/**---
 * title: [Templum Extension - Universal Interface Extension Activation]
 * tags: [Extension, VSCode, Universal-Interface, Orchestration, Activation]
 * provides: [Extension Activation, WebView Registration, Command Registration, Resource Management]
 * requires: [TemplumCore, Universal WebView Provider, VSCode API, Interface Adapters]
 * description: [VSCode extension entry point for Templum Universal Interface system with comprehensive activation and cleanup]
 * ---*/

import * as vscode from 'vscode';
import { TemplumCore } from './core/templum-core';
import { TemplumConfigManager } from './core/templum-config-manager';
import { TemplumUniversalWebViewProvider } from './interfaces/vscode-templum-webview';
import { 
  createTemplumError, 
  isTemplumError,
  ErrorSignalPayload,
  MetricsSignalPayload,
  TemplumConfiguration
} from './types/templum-types';

// Global extension state
let templumCore: TemplumCore | undefined;
let universalWebViewProvider: TemplumUniversalWebViewProvider | undefined;
let serviceStatusWebViewProvider: TemplumUniversalWebViewProvider | undefined;
let sessionManagerWebViewProvider: TemplumUniversalWebViewProvider | undefined;

/**
 * Maps comprehensive TemplumConfig to simplified TemplumConfiguration for TemplumCore
 * Implementation Pattern: Config schema bridging with environment detection
 */
function mapConfigToTemplumConfiguration(config: any): TemplumConfiguration {
  return {
    maxConcurrentSessions: config.session?.maxConcurrentSessions,
    sessionTimeoutMs: config.session?.sessionTimeoutMs,
    enableHealthMonitoring: config.performance?.metricsCollection,
    performanceMetrics: config.performance?.metricsCollection,
    backendDiscovery: {
      enabled: config.backendDiscovery?.enabled ?? true,
      interval: config.backendDiscovery?.interval ?? 30000
    }
  };
}

export async function activate(context: vscode.ExtensionContext) {
  try {
    console.log('🔮 Starting Templum Universal Interface Extension activation...');
    
    // Check for workspace folder
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      console.warn('No workspace folder detected');
      
      // Show friendly message with options
      const choice = await vscode.window.showWarningMessage(
        'Templum works best with a workspace folder open.',
        'Open Folder', 'Continue Anyway', 'Learn More'
      );
      
      if (choice === 'Open Folder') {
        await vscode.commands.executeCommand('vscode.openFolder');
        return; // Exit activation, will re-activate when folder opened
      } else if (choice === 'Learn More') {
        vscode.window.showInformationMessage(
          'Templum Universal Interface Orchestrator provides unified access to multiple backend services (Haruspex, PCL, Litany) through a single interface.'
        );
        return;
      }
      
      // Continue without workspace folder (limited functionality)
      console.log('Continuing activation without workspace folder (limited functionality)');
      
      // Show limited functionality message
      vscode.window.showInformationMessage(
        'Templum activated in limited mode. Open a workspace folder for full functionality.'
      );
      
      return; // Exit early, don't try to initialize core engine
    }

    // Initialize Templum Core Engine
    let engineInitialized = false;
    
    try {
      console.log('Initializing Templum Core engine...');
      
      // Real Configuration Loading Implementation - TASK-NEW-044
      console.log('Loading Templum configuration...');
      const configManager = new TemplumConfigManager();
      await configManager.initialize();
      const comprehensiveConfig = configManager.getConfig();
      
      // Map comprehensive config to TemplumCore configuration
      const coreConfig = mapConfigToTemplumConfiguration(comprehensiveConfig);
      
      console.log('✓ Configuration loaded successfully');
      templumCore = new TemplumCore(coreConfig);

      await templumCore.initialize();
      engineInitialized = true;
      
      console.log('✅ Templum Core engine initialized successfully');
      
      // Backend Service Discovery Integration - TASK-NEW-045
      try {
        console.log('🔍 Checking backend service discovery results...');
        const backendRouter = templumCore.getBackendRouter();
        
        // Check if getConnectionStatus method is available
        if (backendRouter.getConnectionStatus) {
          const connectionStatus = backendRouter.getConnectionStatus();
          
          console.log(`Backend Discovery Results: ${connectionStatus.healthyConnections}/${connectionStatus.totalConnections} services connected`);
          
          // Provide user feedback about service discovery
          if (connectionStatus.healthyConnections === 0) {
            vscode.window.showWarningMessage(
              '⚠️ Templum activated but no backend services discovered. Some features may be limited.',
              'Retry Discovery', 'Continue Anyway'
            ).then((choice: string | undefined) => {
              if (choice === 'Retry Discovery') {
                // Trigger rediscovery
                backendRouter.discoverAndConnect().then(() => {
                  if (backendRouter.getConnectionStatus) {
                    const updatedStatus = backendRouter.getConnectionStatus();
                    if (updatedStatus.healthyConnections > 0) {
                      vscode.window.showInformationMessage(
                        `✅ Discovery retry successful: ${updatedStatus.healthyConnections} services connected`
                      );
                    }
                  }
                }).catch(error => {
                  console.error('Backend service rediscovery failed:', error);
                });
              }
            });
          } else if (connectionStatus.healthyConnections < connectionStatus.totalConnections) {
            // Partial discovery success
            const connectedServices = Object.keys(connectionStatus.backends)
              .filter(id => connectionStatus.backends[id].connected);
            vscode.window.showInformationMessage(
              `🔮 Templum activated with ${connectionStatus.healthyConnections} backend services: ${connectedServices.join(', ')}`
            );
          } else {
            // Full discovery success
            const connectedServices = Object.keys(connectionStatus.backends)
              .filter(id => connectionStatus.backends[id].connected);
            vscode.window.showInformationMessage(
              `🔮 Templum activated successfully with all backend services: ${connectedServices.join(', ')}`
            );
          }
        } else {
          // Fallback when getConnectionStatus is not available
          console.log('Backend service router initialized but status checking not available');
          vscode.window.showInformationMessage(
            '🔮 Templum activated successfully with backend service router'
          );
        }
      } catch (error) {
        console.error('Backend service status check failed:', error);
        // Fallback to basic success message
        vscode.window.showInformationMessage(
          '🔮 Templum activated successfully with real configuration loading'
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Templum Core engine error: ${errorMessage}`);
      engineInitialized = false;
    }

    // Register WebView providers (even if engine failed, for graceful degradation)
    await registerWebViewProviders(context, engineInitialized);

    // Register commands
    await registerCommands(context, engineInitialized);

    // TODO: [TASK-NEW-046] VSCode Service Tree Provider Implementation
    // Priority: Medium | Complexity: 8 | Location: extension.ts activation  
    // Dependencies: Backend service discovery, TreeDataProvider interface
    // Phase: Interface
    
    console.log('🎉 Templum Universal Interface Extension activation complete');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown activation error';
    console.error('❌ Templum activation failed:', error);
    vscode.window.showErrorMessage(`Templum activation failed: ${errorMessage}`);
  }
}

/**
 * Register WebView providers with error handling and graceful degradation
 */
async function registerWebViewProviders(context: vscode.ExtensionContext, engineReady: boolean): Promise<void> {
  try {
    console.log('📋 Registering Templum WebView providers...');

    if (engineReady && templumCore) {
      // Register real WebView providers
      universalWebViewProvider = new TemplumUniversalWebViewProvider(context, templumCore);
      serviceStatusWebViewProvider = new TemplumUniversalWebViewProvider(context, templumCore);
      sessionManagerWebViewProvider = new TemplumUniversalWebViewProvider(context, templumCore);
      
      console.log('✅ Real WebView providers created');
    } else {
      // Create placeholder providers that show setup prompts
      universalWebViewProvider = createPlaceholderWebViewProvider(context, 'universalInterface', engineReady);
      serviceStatusWebViewProvider = createPlaceholderWebViewProvider(context, 'serviceStatus', engineReady);
      sessionManagerWebViewProvider = createPlaceholderWebViewProvider(context, 'sessionManager', engineReady);
      
      console.log('⚠️ Placeholder WebView providers created (engine not ready)');
    }

    // Register webview providers with VSCode
    if (universalWebViewProvider) {
      const universalWebViewDisposable = vscode.window.registerWebviewViewProvider(
        'templum.universalInterface',
        universalWebViewProvider
      );
      context.subscriptions.push(universalWebViewDisposable);
    }

    if (serviceStatusWebViewProvider) {
      const serviceStatusWebViewDisposable = vscode.window.registerWebviewViewProvider(
        'templum.serviceStatus', 
        serviceStatusWebViewProvider
      );
      context.subscriptions.push(serviceStatusWebViewDisposable);
    }

    if (sessionManagerWebViewProvider) {
      const sessionManagerWebViewDisposable = vscode.window.registerWebviewViewProvider(
        'templum.sessionManager',
        sessionManagerWebViewProvider
      );
      context.subscriptions.push(sessionManagerWebViewDisposable);
    }

    console.log('✅ All Templum WebView providers registered successfully');

  } catch (error) {
    console.error('❌ WebView provider registration failed:', error);
    throw error;
  }
}

/**
 * Register Templum commands with VSCode
 */
async function registerCommands(context: vscode.ExtensionContext, engineReady: boolean): Promise<void> {
  try {
    console.log('📋 Registering Templum commands...');

    // Refresh All Services command
    const refreshAllCommand = vscode.commands.registerCommand(
      'templum.refreshAll',
      async () => {
        try {
          if (!templumCore) {
            vscode.window.showWarningMessage('Templum not initialized - try reloading the window');
            return;
          }

          console.log('🔄 Refreshing all Templum services...');
          
          // Refresh backend services using real backend service router
          await templumCore.refreshBackendServices();
          
          const status = await templumCore.getSystemStatus();
          
          // Refresh WebView providers
          if (universalWebViewProvider) {
            await universalWebViewProvider.refresh();
          }
          if (serviceStatusWebViewProvider) {
            await serviceStatusWebViewProvider.refresh();
          }
          if (sessionManagerWebViewProvider) {
            await sessionManagerWebViewProvider.refresh();
          }

          vscode.window.showInformationMessage(
            `🔮 Templum refreshed: ${status.coreEngine.backendConnections.healthyConnections}/${status.coreEngine.backendConnections.totalConnections} backends active, ${status.coreEngine.activeInterfaces.length} interfaces`
          );
          console.log('✅ All services refreshed successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          vscode.window.showErrorMessage(`Templum refresh failed: ${errorMessage}`);
          console.error(`❌ Refresh failed: ${errorMessage}`);
        }
      }
    );

    // Show Service Status command
    const showServiceStatusCommand = vscode.commands.registerCommand(
      'templum.showServiceStatus',
      async () => {
        try {
          if (!templumCore) {
            vscode.window.showWarningMessage('Templum not initialized');
            return;
          }

          const status = await templumCore.getSystemStatus();
          const statusIcon = status.health === 'healthy' ? '✅' : 
                            status.health === 'degraded' ? '⚠️' : '❌';
          
          vscode.window.showInformationMessage(
            `🔮 Templum Status ${statusIcon} ${status.health.toUpperCase()} - ` +
            `${status.activeBackends} backends, ${status.activeInterfaces.length} interfaces`
          );
          console.log(`Service status: ${status.health}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          vscode.window.showErrorMessage(`Status check failed: ${errorMessage}`);
          console.error(`❌ Status check failed: ${errorMessage}`);
        }
      }
    );

    // Switch Interface Mode command
    const switchInterfaceCommand = vscode.commands.registerCommand(
      'templum.switchInterface',
      async () => {
        try {
          if (!templumCore) {
            vscode.window.showWarningMessage('Templum not initialized');
            return;
          }

          // TODO: [TASK-NEW-048] Interface Switching Implementation
          // Priority: High | Complexity: 10 | Location: extension.ts commands
          // Dependencies: Universal Interface Manager, interface adapters
          // Phase: Interface
          
          const availableInterfaces = ['VSCode', 'CLI', 'Universal'];
          const choice = await vscode.window.showQuickPick(availableInterfaces, {
            placeHolder: 'Select interface mode'
          });

          if (choice) {
            vscode.window.showInformationMessage(`🔄 Interface switching: ${choice} (Coming soon)`);
            console.log(`Interface switch requested: ${choice}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          vscode.window.showErrorMessage(`Interface switch failed: ${errorMessage}`);
          console.error(`❌ Interface switch failed: ${errorMessage}`);
        }
      }
    );

    // Service Tree commands
    const refreshServiceTreeCommand = vscode.commands.registerCommand(
      'templum.refreshServiceTree',
      () => {
        // TODO: [TASK-NEW-049] Service Tree Refresh Implementation
        // Priority: Medium | Complexity: 4 | Location: extension.ts commands
        // Dependencies: Service tree provider, backend service discovery
        // Phase: Interface
        
        vscode.window.showInformationMessage('🔄 Service tree refresh (Coming soon)');
        console.log('Service tree refresh requested');
      }
    );

    const connectServiceCommand = vscode.commands.registerCommand(
      'templum.connectService',
      async () => {
        // TODO: [TASK-NEW-050] Service Connection Implementation  
        // Priority: High | Complexity: 8 | Location: extension.ts commands
        // Dependencies: Backend service router, connection management
        // Phase: Interface
        
        const services = ['Haruspex', 'Phoenix Code Lite', 'Litany'];
        const choice = await vscode.window.showQuickPick(services, {
          placeHolder: 'Select service to connect'
        });

        if (choice) {
          vscode.window.showInformationMessage(`🔗 Connecting to ${choice} (Coming soon)`);
          console.log(`Service connection requested: ${choice}`);
        }
      }
    );

    const disconnectServiceCommand = vscode.commands.registerCommand(
      'templum.disconnectService',
      async () => {
        // TODO: [TASK-NEW-051] Service Disconnection Implementation
        // Priority: Medium | Complexity: 6 | Location: extension.ts commands  
        // Dependencies: Backend service router, connection management
        // Phase: Interface
        
        vscode.window.showInformationMessage('🔌 Service disconnection (Coming soon)');
        console.log('Service disconnection requested');
      }
    );

    // Register all commands with VSCode
    context.subscriptions.push(
      refreshAllCommand,
      showServiceStatusCommand,
      switchInterfaceCommand,
      refreshServiceTreeCommand,
      connectServiceCommand,
      disconnectServiceCommand
    );

    console.log('✅ All Templum commands registered successfully');

  } catch (error) {
    console.error('❌ Command registration failed:', error);
    throw error;
  }
}

/**
 * Create placeholder WebView provider for graceful degradation
 */
function createPlaceholderWebViewProvider(
  context: vscode.ExtensionContext, 
  type: 'universalInterface' | 'serviceStatus' | 'sessionManager',
  engineReady: boolean
): any {
  const titles = {
    universalInterface: 'Universal Interface',
    serviceStatus: 'Service Status',
    sessionManager: 'Session Manager'
  };
  
  const descriptions = {
    universalInterface: 'Unified interface to all backend services',
    serviceStatus: 'Real-time backend service health monitoring',
    sessionManager: 'Manage sessions across interface modes'
  };

  return {
    resolveWebviewView: (webviewView: vscode.WebviewView) => {
      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [context.extensionUri]
      };
      
      webviewView.webview.html = generatePlaceholderHtml(type, titles[type], descriptions[type], engineReady);
      
      webviewView.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case 'reload':
            vscode.commands.executeCommand('workbench.action.reloadWindow');
            break;
          case 'openFolder':
            vscode.commands.executeCommand('vscode.openFolder');
            break;
        }
      });
    },
    
    refresh: async () => {
      // Placeholder providers don't need refresh until engine is ready
    }
  };
}

/**
 * Generate HTML for placeholder WebViews
 */
function generatePlaceholderHtml(type: string, title: string, description: string, engineReady: boolean): string {
  if (!engineReady) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .placeholder {
            max-width: 300px;
            margin: 0 auto;
        }
        .icon {
            font-size: 3em;
            margin-bottom: 20px;
            opacity: 0.6;
        }
        .title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .description {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 20px;
            line-height: 1.4;
        }
        .button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 0.9em;
        }
        .button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .button.secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .button.secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
    </style>
</head>
<body>
    <div class="placeholder">
        <div class="icon">🔮</div>
        <div class="title">${title}</div>
        <div class="description">${description}</div>
        <div class="description">Templum needs a workspace folder to initialize.</div>
        <button class="button" onclick="openFolder()">Open Folder</button>
        <button class="button secondary" onclick="reload()">Reload Window</button>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function openFolder() {
            vscode.postMessage({ type: 'openFolder' });
        }
        
        function reload() {
            vscode.postMessage({ type: 'reload' });
        }
    </script>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 20px;
            text-align: center;
        }
        .loading {
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="loading">Loading ${title.toLowerCase()}...</div>
</body>
</html>`;
}

export function deactivate() {
  try {
    console.log('🔄 Starting Templum extension deactivation...');

    // TODO: [TASK-NEW-052] Comprehensive Extension Cleanup Implementation
    // Priority: High | Complexity: 8 | Location: extension.ts deactivate
    // Dependencies: Resource cleanup, connection termination, state persistence
    // Phase: Interface

    // Clean up WebView providers
    if (universalWebViewProvider) {
      universalWebViewProvider = undefined;
      console.log('✅ Universal WebView provider cleaned up');
    }

    if (serviceStatusWebViewProvider) {
      serviceStatusWebViewProvider = undefined;
      console.log('✅ Service Status WebView provider cleaned up');
    }

    if (sessionManagerWebViewProvider) {
      sessionManagerWebViewProvider = undefined;
      console.log('✅ Session Manager WebView provider cleaned up');
    }

    // Clean up core engine
    if (templumCore) {
      templumCore.dispose();
      templumCore = undefined;
      console.log('✅ Templum Core engine disposed');
    }

    console.log('🎉 Templum extension deactivation complete');

  } catch (error) {
    console.error('❌ Error during Templum deactivation:', error);
  }
}
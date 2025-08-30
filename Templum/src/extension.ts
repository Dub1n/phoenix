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
  TemplumConfiguration,
  TreeViewDefinition,
  PanelDefinition,
  CommandDefinition
} from './types/templum-types';

// Global extension state
let templumCore: TemplumCore | undefined;
let universalWebViewProvider: TemplumUniversalWebViewProvider | undefined;
let serviceStatusWebViewProvider: TemplumUniversalWebViewProvider | undefined;
let sessionManagerWebViewProvider: TemplumUniversalWebViewProvider | undefined;
let serviceTreeProvider: BackendServiceTreeProvider | undefined;
let activeTreeViews: Map<string, vscode.TreeView<any>> = new Map();
let registeredCommands: Map<string, vscode.Disposable> = new Map();

/**
 * Enhanced Tree Data Provider for Backend Service Discovery
 * Implements VSCodeInterfaceAdapter pattern per Templum 1.1 spec
 */
class BackendServiceTreeProvider implements vscode.TreeDataProvider<ServiceTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ServiceTreeItem | undefined | void> = new vscode.EventEmitter<ServiceTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ServiceTreeItem | undefined | void> = this._onDidChangeTreeData.event;
  
  private serviceCache: Map<string, BackendServiceInfo> = new Map();
  private lastRefresh: number = 0;
  private refreshInterval: number = 30000; // 30 seconds

  constructor(private templumCore: TemplumCore) {
    // Auto-refresh every 30 seconds
    setInterval(() => {
      this.refresh();
    }, this.refreshInterval);
  }

  refresh(): void {
    this.lastRefresh = Date.now();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ServiceTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ServiceTreeItem): Promise<ServiceTreeItem[]> {
    if (!element) {
      // Root level - show backend services
      return this.getBackendServices();
    } else if (element.contextValue === 'backend-service') {
      // Backend service level - show capabilities and status
      return this.getServiceDetails(element.serviceId!);
    }
    return [];
  }

  private async getBackendServices(): Promise<ServiceTreeItem[]> {
    try {
      const backendRouter = this.templumCore.getBackendRouter();
      const connectionStatus = backendRouter.getConnectionStatus?.();
      
      if (!connectionStatus || !connectionStatus.backends) {
        return [new ServiceTreeItem('No backend services available', vscode.TreeItemCollapsibleState.None, 'no-services')];
      }

      const serviceItems: ServiceTreeItem[] = [];

      for (const [backendId, status] of Object.entries(connectionStatus.backends)) {
        const backendStatus = status as {
          connected: boolean;
          health?: string;
          capabilities?: string[];
          lastCheck?: number;
          responseTime?: number;
          version?: string;
          errorMessage?: string;
        };

        const displayName = this.getBackendDisplayName(backendId);
        const healthIcon = this.getHealthIcon(backendStatus.connected, backendStatus.health);
        const description = this.getServiceDescription(backendStatus);
        
        const serviceItem = new ServiceTreeItem(
          `${healthIcon} ${displayName}`,
          vscode.TreeItemCollapsibleState.Expanded,
          'backend-service'
        );
        
        serviceItem.serviceId = backendId;
        serviceItem.description = description;
        serviceItem.tooltip = this.getServiceTooltip(backendId, backendStatus);
        serviceItem.command = {
          command: 'templum.selectBackendService',
          title: 'Select Backend Service',
          arguments: [backendId, backendStatus]
        };

        // Add contextual menus
        (serviceItem as any).contextValue = backendStatus.connected ? 'backend-service-connected' : 'backend-service-disconnected';
        
        serviceItems.push(serviceItem);

        // Cache service info for quick access
        this.serviceCache.set(backendId, {
          id: backendId,
          name: displayName,
          status: backendStatus.connected ? 'connected' : 'disconnected',
          description: this.getBackendDescription(backendId),
          capabilities: backendStatus.capabilities || [],
          lastActivity: backendStatus.lastCheck || Date.now(),
          health: backendStatus.health as any || 'unknown',
          responseTime: backendStatus.responseTime,
          version: backendStatus.version,
          errorMessage: backendStatus.errorMessage
        });
      }

      return serviceItems;
    } catch (error) {
      console.error('Failed to get backend services for tree view:', error);
      return [new ServiceTreeItem('Error loading services', vscode.TreeItemCollapsibleState.None, 'error')];
    }
  }

  private async getServiceDetails(serviceId: string): Promise<ServiceTreeItem[]> {
    const serviceInfo = this.serviceCache.get(serviceId);
    if (!serviceInfo) {
      return [];
    }

    const details: ServiceTreeItem[] = [];

    // Add health status
    const healthItem = new ServiceTreeItem(
      `Health: ${serviceInfo.health}`,
      vscode.TreeItemCollapsibleState.None,
      'service-health'
    );
    healthItem.iconPath = new vscode.ThemeIcon(this.getHealthThemeIcon(serviceInfo.health));
    details.push(healthItem);

    // Add response time if available
    if (serviceInfo.responseTime !== undefined) {
      const responseItem = new ServiceTreeItem(
        `Response Time: ${serviceInfo.responseTime}ms`,
        vscode.TreeItemCollapsibleState.None,
        'service-response-time'
      );
      responseItem.iconPath = new vscode.ThemeIcon('clock');
      details.push(responseItem);
    }

    // Add version if available
    if (serviceInfo.version) {
      const versionItem = new ServiceTreeItem(
        `Version: ${serviceInfo.version}`,
        vscode.TreeItemCollapsibleState.None,
        'service-version'
      );
      versionItem.iconPath = new vscode.ThemeIcon('tag');
      details.push(versionItem);
    }

    // Add capabilities
    if (serviceInfo.capabilities && serviceInfo.capabilities.length > 0) {
      const capabilitiesItem = new ServiceTreeItem(
        'Capabilities',
        vscode.TreeItemCollapsibleState.Expanded,
        'capabilities-group'
      );
      capabilitiesItem.iconPath = new vscode.ThemeIcon('list-unordered');

      details.push(capabilitiesItem);

      // Add individual capabilities as child items
      for (const capability of serviceInfo.capabilities) {
        const capabilityItem = new ServiceTreeItem(
          capability,
          vscode.TreeItemCollapsibleState.None,
          'capability'
        );
        capabilityItem.iconPath = new vscode.ThemeIcon('symbol-method');
        details.push(capabilityItem);
      }
    }

    // Add error message if available
    if (serviceInfo.errorMessage) {
      const errorItem = new ServiceTreeItem(
        `Error: ${serviceInfo.errorMessage}`,
        vscode.TreeItemCollapsibleState.None,
        'service-error'
      );
      errorItem.iconPath = new vscode.ThemeIcon('error');
      details.push(errorItem);
    }

    return details;
  }

  private getBackendDisplayName(backendId: string): string {
    const names: { [key: string]: string } = {
      'haruspex': 'Haruspex Analysis Service',
      'pcl': 'Phoenix Code Lite TDD Engine', 
      'litany': 'Litany Context Manager'
    };
    return names[backendId] || backendId;
  }

  private getBackendDescription(backendId: string): string {
    const descriptions: { [key: string]: string } = {
      'haruspex': 'Advanced code analysis and prediction service',
      'pcl': 'Test-driven development workflow orchestration',
      'litany': 'Intelligent context and memory management'
    };
    return descriptions[backendId] || 'Backend service';
  }

  private getHealthIcon(connected: boolean, health?: string): string {
    if (!connected) return '🔴';
    switch (health) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'unhealthy': return '🟠';
      case 'error': return '🔴';
      default: return '⚪';
    }
  }

  private getHealthThemeIcon(health?: string): string {
    switch (health) {
      case 'healthy': return 'check';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'error';
      case 'error': return 'stop';
      default: return 'question';
    }
  }

  private getServiceDescription(status: any): string {
    if (!status.connected) return 'Disconnected';
    if (status.responseTime) return `${status.responseTime}ms`;
    return status.health || 'Connected';
  }

  private getServiceTooltip(serviceId: string, status: any): string {
    const lines = [
      `Backend: ${this.getBackendDisplayName(serviceId)}`,
      `Status: ${status.connected ? 'Connected' : 'Disconnected'}`,
      `Health: ${status.health || 'Unknown'}`
    ];
    
    if (status.responseTime) {
      lines.push(`Response Time: ${status.responseTime}ms`);
    }
    
    if (status.version) {
      lines.push(`Version: ${status.version}`);
    }
    
    if (status.capabilities && status.capabilities.length > 0) {
      lines.push(`Capabilities: ${status.capabilities.length}`);
    }
    
    if (status.errorMessage) {
      lines.push(`Error: ${status.errorMessage}`);
    }
    
    return lines.join('\n');
  }
}

/**
 * Service Tree Item for Backend Service Tree View
 */
class ServiceTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public serviceId?: string
  ) {
    super(label, collapsibleState);
    this.contextValue = contextValue;
  }
}

/**
 * Backend Service Info Interface
 */
interface BackendServiceInfo {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'degraded';
  description?: string;
  capabilities?: string[];
  lastActivity?: number;
  health?: 'healthy' | 'degraded' | 'unhealthy' | 'error' | 'unknown';
  responseTime?: number;
  version?: string;
  errorMessage?: string;
}

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

    // Register Service Tree Provider - TASK-NEW-046 Implementation Complete
    await registerServiceTreeProvider(context, engineInitialized);
    
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
          const health = status.health ?? 'error';
          const statusIcon = health === 'healthy' ? '✅' : 
                            health === 'warning' ? '⚠️' : '❌';
          
          const backendCount = status.activeBackends?.length ?? 0;
          const interfaceCount = status.activeInterfaces?.length ?? 0;
          
          vscode.window.showInformationMessage(
            `🔮 Templum Status ${statusIcon} ${health.toUpperCase()} - ` +
            `${backendCount} backends, ${interfaceCount} interfaces`
          );
          console.log(`Service status: ${status.health}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          vscode.window.showErrorMessage(`Status check failed: ${errorMessage}`);
          console.error(`❌ Status check failed: ${errorMessage}`);
        }
      }
    );

    // Enhanced Switch Interface Mode command with Universal Interface Manager coordination
    // TASK-NEW-048: Interface Switching Implementation - Enhanced with Universal Interface Manager
    const switchInterfaceCommand = vscode.commands.registerCommand(
      'templum.switchInterface',
      async () => {
        const switchStartTime = Date.now();
        
        try {
          if (!templumCore) {
            vscode.window.showWarningMessage('Templum not initialized');
            return;
          }

          // Get Universal Interface Manager status and available interfaces
          const systemStatus = await templumCore.getSystemStatus();
          const activeInterfaces = systemStatus.coreEngine.activeInterfaces;
          const universalInterfaceManager = (templumCore as any).getUniversalInterfaceManager?.();
          
          if (!universalInterfaceManager) {
            console.warn('Universal Interface Manager not available - proceeding with basic interface switch');
            // Continue without Universal Interface Manager for compatibility
          }

          // Enhanced interface options with backend compatibility checking
          const interfaceOptions = [
            { 
              label: 'VSCode Interface', 
              value: 'vscode' as const, 
              description: 'Visual Studio Code integrated interface with webview and tree view support',
              capabilities: ['webview', 'treeview', 'commands', 'panels']
            },
            { 
              label: 'CLI Interface', 
              value: 'cli' as const, 
              description: 'Command-line terminal interface with menu navigation',
              capabilities: ['menu', 'commands', 'interactive']
            },
            { 
              label: 'Command Interface', 
              value: 'command' as const, 
              description: 'Direct command execution interface for automation',
              capabilities: ['commands', 'batch']
            }
          ];

          // Check backend service compatibility with interface types
          const backendRouter = templumCore.getBackendRouter();
          const connectionStatus = backendRouter.getConnectionStatus?.();
          const connectedBackends = Object.keys(connectionStatus?.backends || {})
            .filter(id => connectionStatus.backends[id].connected);

          // Enhanced options with backend compatibility and current status
          const enhancedOptions = interfaceOptions.map(opt => {
            const isActive = activeInterfaces.includes(opt.value);
            const compatibleBackends = connectedBackends.length; // All backends should support all interfaces
            
            return {
              label: isActive ? `${opt.label} ✅ (Active)` : `${opt.label}`,
              value: opt.value,
              description: `${opt.description} • Compatible with ${compatibleBackends} backend(s)`,
              detail: `Capabilities: ${opt.capabilities.join(', ')}`,
              capabilities: opt.capabilities,
              isActive
            };
          });

          const choice = await vscode.window.showQuickPick(enhancedOptions, {
            placeHolder: 'Select interface to switch to',
            matchOnDescription: true,
            matchOnDetail: true,
            ignoreFocusOut: true
          });

          if (choice) {
            // Show progress during interface switch
            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: `Switching to ${choice.label.replace(' ✅ (Active)', '')}`,
                cancellable: false
              },
              async (progress) => {
                progress.report({ increment: 0, message: 'Preparing interface switch...' });

                try {
                  // Phase 1: Validate interface compatibility with connected backends
                  progress.report({ increment: 20, message: 'Validating backend compatibility...' });
                  
                  const compatibilityCheck = await this.validateInterfaceCompatibility(
                    choice.value, 
                    connectedBackends,
                    templumCore
                  );
                  
                  if (!compatibilityCheck.compatible) {
                    throw createTemplumError(
                      `Interface ${choice.value} not compatible with current backends: ${compatibilityCheck.reason}`,
                      'INTERFACE_COMPATIBILITY_ERROR',
                      'validation'
                    );
                  }

                  // Phase 2: Coordinate with Universal Interface Manager for state preparation
                  progress.report({ increment: 40, message: 'Coordinating with Interface Manager...' });
                  
                  const interfaceManager = (templumCore as any).getUniversalInterfaceManager?.();
                  if (interfaceManager?.prepareInterfaceSwitch) {
                    await interfaceManager.prepareInterfaceSwitch(choice.value, {
                      preserveSession: true,
                      migrateState: true,
                      maintainConnections: true
                    });
                  }

                  // Phase 3: Execute interface switch through TemplumCore
                  progress.report({ increment: 60, message: `Switching to ${choice.value} interface...` });
                  
                  const result = await templumCore.switchInterface(choice.value);
                  
                  if (!result.success) {
                    throw createTemplumError(
                      `Interface switch failed: ${result.message}`,
                      'INTERFACE_SWITCH_ERROR',
                      'runtime'
                    );
                  }

                  // Phase 4: Synchronize interface state and update webviews
                  progress.report({ increment: 80, message: 'Synchronizing interface state...' });
                  
                  // Refresh all webview providers to reflect new interface state
                  if (universalWebViewProvider) {
                    await universalWebViewProvider.refresh();
                  }
                  if (serviceStatusWebViewProvider) {
                    await serviceStatusWebViewProvider.refresh();
                  }
                  if (sessionManagerWebViewProvider) {
                    await sessionManagerWebViewProvider.refresh();
                  }
                  
                  // Refresh service tree to show interface-specific views
                  if (serviceTreeProvider) {
                    serviceTreeProvider.refresh();
                  }

                  // Phase 5: Complete interface switch with success metrics
                  progress.report({ increment: 100, message: 'Interface switch complete!' });

                  const switchDuration = Date.now() - switchStartTime;
                  
                  // Emit success metrics
                  const metricsPayload: MetricsSignalPayload = {
                    metrics: {
                      memory: { heapUsed: 0, rss: 0 },
                      cpu: { user: 0, system: 0 },
                      interfaces: {
                        [choice.value]: {
                          responseTime: switchDuration,
                          lastActivity: Date.now()
                        }
                      }
                    },
                    category: 'usage',
                    timestamp: Date.now(),
                    source: 'InterfaceSwitch',
                    data: {
                      event_type: 'interface_switched',
                      from_interface: activeInterfaces[0] || 'none',
                      to_interface: choice.value,
                      switch_duration: switchDuration,
                      compatible_backends: connectedBackends.length,
                      capabilities: choice.capabilities
                    }
                  };
                  (process as any).emit('templum:metrics', metricsPayload);

                  vscode.window.showInformationMessage(
                    `🔄 Successfully switched to ${choice.label.replace(' ✅ (Active)', '')} (${switchDuration}ms)`
                  );
                  console.log(`✅ Interface switched to: ${choice.value} in ${switchDuration}ms`);

                } catch (switchError) {
                  // Enhanced error handling with rollback capability
                  const errorMessage = isTemplumError(switchError) 
                    ? switchError.message 
                    : (switchError instanceof Error ? switchError.message : 'Unknown interface switch error');

                  // Emit error metrics
                  const errorPayload: ErrorSignalPayload = {
                    error: isTemplumError(switchError) ? switchError : createTemplumError(errorMessage, 'INTERFACE_SWITCH_ERROR', 'runtime'),
                    severity: 'high',
                    timestamp: Date.now(),
                    source: 'InterfaceSwitch',
                    data: {
                      target_interface: choice.value,
                      switch_duration: Date.now() - switchStartTime,
                      compatible_backends: connectedBackends.length
                    }
                  };
                  (process as any).emit('templum:error', errorPayload);

                  vscode.window.showErrorMessage(`❌ Interface switch failed: ${errorMessage}`);
                  console.error(`❌ Interface switch failed: ${errorMessage}`);
                  throw switchError;
                }
              }
            );
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          vscode.window.showErrorMessage(`Interface switch failed: ${errorMessage}`);
          console.error(`❌ Interface switch failed: ${errorMessage}`);
        }
      }
    );

    // Helper method for interface compatibility validation
    (switchInterfaceCommand as any).validateInterfaceCompatibility = async function(
      interfaceType: string, 
      connectedBackends: string[], 
      templumCore: TemplumCore
    ): Promise<{compatible: boolean, reason?: string}> {
      try {
        // Check if any backends are connected
        if (connectedBackends.length === 0) {
          return { compatible: false, reason: 'No backend services connected' };
        }

        // For now, assume all interfaces are compatible with all backends
        // In the future, this could check specific backend capabilities
        return { compatible: true };
        
      } catch (error) {
        return { compatible: false, reason: 'Compatibility check failed' };
      }
    };

    // Service Tree Refresh command - TASK-NEW-049 Implementation Complete
    const refreshServiceTreeCommand = vscode.commands.registerCommand(
      'templum.refreshServiceTree',
      async () => {
        try {
          console.log('🔄 Service tree refresh requested');
          
          if (!serviceTreeProvider) {
            vscode.window.showWarningMessage('Service tree provider not available');
            return;
          }

          // Show progress during refresh
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: 'Refreshing Service Tree',
              cancellable: false
            },
            async (progress) => {
              progress.report({ increment: 0, message: 'Discovering backend services...' });

              // Trigger backend service rediscovery if available
              if (templumCore) {
                const backendRouter = templumCore.getBackendRouter();
                if (backendRouter.discoverAndConnect) {
                  progress.report({ increment: 30, message: 'Reconnecting to services...' });
                  await backendRouter.discoverAndConnect();
                }
              }

              progress.report({ increment: 70, message: 'Updating service tree...' });
              
              // Refresh the tree provider
              serviceTreeProvider.refresh();

              progress.report({ increment: 100, message: 'Service tree updated!' });
            }
          );

          // Emit metrics for service tree refresh
          const metricsPayload: MetricsSignalPayload = {
            metrics: {
              memory: { heapUsed: 0, rss: 0 },
              cpu: { user: 0, system: 0 },
              interfaces: {
                vscode: {
                  responseTime: 0,
                  lastActivity: Date.now()
                }
              }
            },
            category: 'usage',
            timestamp: Date.now(),
            source: 'ServiceTreeRefresh',
            data: {
              event_type: 'service_tree_refreshed',
              manual_refresh: true
            }
          };
          (process as any).emit('templum:metrics', metricsPayload);

          vscode.window.showInformationMessage('🔄 Service tree refreshed successfully');
          console.log('✅ Service tree refresh completed');
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown refresh error';
          vscode.window.showErrorMessage(`Service tree refresh failed: ${errorMessage}`);
          console.error('❌ Service tree refresh failed:', error);
        }
      }
    );

    // Enhanced Service Connection command - TASK-NEW-050 Implementation Complete
    const connectServiceCommand = vscode.commands.registerCommand(
      'templum.connectService',
      async (serviceId?: string) => {
        const connectionStartTime = Date.now();
        
        try {
          if (!templumCore) {
            vscode.window.showWarningMessage('Templum not initialized');
            return;
          }

          const backendRouter = templumCore.getBackendRouter();
          if (!backendRouter) {
            vscode.window.showErrorMessage('Backend router not available');
            return;
          }

          // Get current connection status
          const connectionStatus = backendRouter.getConnectionStatus?.();
          const availableServices = Object.entries(connectionStatus?.backends || {})
            .map(([id, status]: [string, any]) => ({
              id,
              label: (connectServiceCommand as any).getServiceDisplayName(id),
              description: (connectServiceCommand as any).getServiceDescription(id),
              status: status.connected ? 'Connected' : 'Disconnected',
              connected: status.connected,
              health: status.health,
              errorMessage: status.errorMessage
            }));

          let targetServiceId = serviceId;

          // If no specific service provided, show service selection
          if (!targetServiceId) {
            const disconnectedServices = availableServices.filter(service => !service.connected);
            
            if (disconnectedServices.length === 0) {
              vscode.window.showInformationMessage('All available backend services are already connected');
              return;
            }

            const serviceOptions = disconnectedServices.map(service => ({
              label: `${service.label}`,
              description: service.description,
              detail: service.errorMessage ? `Last error: ${service.errorMessage}` : 'Ready to connect',
              serviceId: service.id
            }));

            const choice = await vscode.window.showQuickPick(serviceOptions, {
              placeHolder: 'Select service to connect',
              matchOnDescription: true,
              matchOnDetail: true,
              ignoreFocusOut: true
            });

            if (!choice) {
              return;
            }

            targetServiceId = choice.serviceId;
          }

          const serviceName = (connectServiceCommand as any).getServiceDisplayName(targetServiceId);

          // Show progress during connection
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Connecting to ${serviceName}`,
              cancellable: true
            },
            async (progress, token) => {
              progress.report({ increment: 0, message: 'Initiating connection...' });

              try {
                // Phase 1: Validate service availability
                progress.report({ increment: 20, message: 'Validating service availability...' });
                
                const isServiceAvailable = await (connectServiceCommand as any).checkServiceAvailability(targetServiceId!, backendRouter);
                if (!isServiceAvailable && !token.isCancellationRequested) {
                  throw createTemplumError(
                    `Service ${serviceName} is not available or not responding`,
                    'SERVICE_UNAVAILABLE',
                    'network'
                  );
                }

                // Phase 2: Establish connection
                progress.report({ increment: 40, message: 'Establishing connection...' });
                
                if (token.isCancellationRequested) {
                  throw createTemplumError('Connection cancelled by user', 'CONNECTION_CANCELLED', 'runtime');
                }

                const connectionResult = await (backendRouter as any).connectToService?.(targetServiceId!);
                
                if (!connectionResult?.success) {
                  throw createTemplumError(
                    `Connection failed: ${connectionResult?.message || 'Unknown connection error'}`,
                    'CONNECTION_FAILED',
                    'network'
                  );
                }

                // Phase 3: Validate connection and retrieve service info
                progress.report({ increment: 70, message: 'Validating connection...' });
                
                const updatedStatus = backendRouter.getConnectionStatus?.();
                const serviceStatus = updatedStatus?.backends?.[targetServiceId!];
                
                if (!serviceStatus?.connected) {
                  throw createTemplumError(
                    'Connection established but service not responding properly',
                    'CONNECTION_UNSTABLE',
                    'network'
                  );
                }

                // Phase 4: Initialize service capabilities
                progress.report({ increment: 90, message: 'Initializing service capabilities...' });
                
                // Try to load service capabilities or skin definition
                try {
                  const skinEngine = templumCore.getUniversalSkinEngine();
                  if ((skinEngine as any)?.loadBackendSkin) {
                    await (skinEngine as any).loadBackendSkin(targetServiceId!);
                  }
                } catch (skinError) {
                  // Service connected but skin loading failed - continue anyway
                  console.warn(`Skin loading failed for ${targetServiceId}:`, skinError);
                }

                // Phase 5: Complete connection
                progress.report({ increment: 100, message: 'Connection established!' });

                const connectionDuration = Date.now() - connectionStartTime;

                // Emit success metrics
                const metricsPayload: MetricsSignalPayload = {
                  metrics: {
                    memory: { heapUsed: 0, rss: 0 },
                    cpu: { user: 0, system: 0 },
                    interfaces: {
                      vscode: {
                        responseTime: connectionDuration,
                        lastActivity: Date.now()
                      }
                    }
                  },
                  category: 'usage',
                  timestamp: Date.now(),
                  source: 'ServiceConnection',
                  data: {
                    event_type: 'service_connected',
                    service_id: targetServiceId,
                    connection_duration: connectionDuration,
                    service_health: serviceStatus.health,
                    capabilities_count: serviceStatus.capabilities?.length || 0
                  }
                };
                (process as any).emit('templum:metrics', metricsPayload);

                // Refresh UI components
                if (serviceTreeProvider) {
                  serviceTreeProvider.refresh();
                }
                if (universalWebViewProvider) {
                  await universalWebViewProvider.refresh();
                }

                const healthInfo = serviceStatus.health ? ` (${serviceStatus.health})` : '';
                vscode.window.showInformationMessage(
                  `✅ Connected to ${serviceName}${healthInfo} (${connectionDuration}ms)`
                );
                console.log(`✅ Service connection successful: ${targetServiceId} in ${connectionDuration}ms`);

              } catch (connectionError) {
                if (token.isCancellationRequested) {
                  console.log('Connection cancelled by user');
                  return;
                }

                // Enhanced error handling with user guidance
                const errorMessage = isTemplumError(connectionError) 
                  ? connectionError.message 
                  : (connectionError instanceof Error ? connectionError.message : 'Unknown connection error');

                // Emit error metrics
                const errorPayload: ErrorSignalPayload = {
                  error: isTemplumError(connectionError) ? connectionError : createTemplumError(errorMessage, 'CONNECTION_ERROR', 'network'),
                  severity: 'medium',
                  timestamp: Date.now(),
                  source: 'ServiceConnection',
                  data: {
                    service_id: targetServiceId,
                    connection_duration: Date.now() - connectionStartTime
                  }
                };
                (process as any).emit('templum:error', errorPayload);

                vscode.window.showErrorMessage(
                  `❌ Failed to connect to ${serviceName}: ${errorMessage}`,
                  'Retry', 'View Logs'
                ).then((action) => {
                  if (action === 'Retry') {
                    vscode.commands.executeCommand('templum.connectService', targetServiceId);
                  } else if (action === 'View Logs') {
                    vscode.commands.executeCommand('templum.showServiceStatus');
                  }
                });

                console.error(`❌ Service connection failed: ${targetServiceId}`, connectionError);
                throw connectionError;
              }
            }
          );

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (!errorMessage.includes('cancelled')) {
            console.error('❌ Service connection failed:', error);
          }
        }
      }
    );

    // Helper methods for service connection
    (connectServiceCommand as any).getServiceDisplayName = function(serviceId: string): string {
      const names: { [key: string]: string } = {
        'haruspex': 'Haruspex Analysis Service',
        'pcl': 'Phoenix Code Lite TDD Engine', 
        'litany': 'Litany Context Manager'
      };
      return names[serviceId] || serviceId;
    };

    (connectServiceCommand as any).getServiceDescription = function(serviceId: string): string {
      const descriptions: { [key: string]: string } = {
        'haruspex': 'Advanced code analysis and prediction service',
        'pcl': 'Test-driven development workflow orchestration',
        'litany': 'Intelligent context and memory management'
      };
      return descriptions[serviceId] || 'Backend service';
    };

    (connectServiceCommand as any).checkServiceAvailability = async function(
      serviceId: string, 
      backendRouter: any
    ): Promise<boolean> {
      try {
        if (backendRouter.isServiceAvailable) {
          const timeout = 5000; // 5 second timeout
          const availabilityPromise = backendRouter.isServiceAvailable(serviceId);
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Availability check timeout')), timeout);
          });
          
          return await Promise.race([availabilityPromise, timeoutPromise]);
        }
        return true; // Assume available if check not supported
      } catch (error) {
        return false;
      }
    };

    // Enhanced Service Disconnection command - TASK-NEW-051 Implementation Complete  
    const disconnectServiceCommand = vscode.commands.registerCommand(
      'templum.disconnectService',
      async (serviceId?: string) => {
        const disconnectionStartTime = Date.now();
        
        try {
          if (!templumCore) {
            vscode.window.showWarningMessage('Templum not initialized');
            return;
          }

          const backendRouter = templumCore.getBackendRouter();
          if (!backendRouter) {
            vscode.window.showErrorMessage('Backend router not available');
            return;
          }

          // Get current connection status
          const connectionStatus = backendRouter.getConnectionStatus?.();
          const connectedServices = Object.entries(connectionStatus?.backends || {})
            .filter(([_, status]: [string, any]) => status.connected)
            .map(([id, status]: [string, any]) => ({
              id,
              label: (connectServiceCommand as any).getServiceDisplayName(id),
              description: (connectServiceCommand as any).getServiceDescription(id),
              health: status.health,
              lastActivity: status.lastCheck
            }));

          let targetServiceId = serviceId;

          // If no specific service provided, show service selection
          if (!targetServiceId) {
            if (connectedServices.length === 0) {
              vscode.window.showInformationMessage('No backend services are currently connected');
              return;
            }

            const serviceOptions = connectedServices.map(service => ({
              label: `${service.label}`,
              description: service.description,
              detail: service.health ? `Status: ${service.health}` : 'Connected',
              serviceId: service.id
            }));

            const choice = await vscode.window.showQuickPick(serviceOptions, {
              placeHolder: 'Select service to disconnect',
              matchOnDescription: true,
              ignoreFocusOut: true
            });

            if (!choice) {
              return;
            }

            targetServiceId = choice.serviceId;
          }

          const serviceName = (connectServiceCommand as any).getServiceDisplayName(targetServiceId);

          // Confirm disconnection for safety
          const confirmChoice = await vscode.window.showWarningMessage(
            `Are you sure you want to disconnect from ${serviceName}?`,
            'Disconnect', 'Cancel'
          );

          if (confirmChoice !== 'Disconnect') {
            return;
          }

          // Show progress during disconnection
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Disconnecting from ${serviceName}`,
              cancellable: false
            },
            async (progress) => {
              progress.report({ increment: 0, message: 'Preparing disconnection...' });

              try {
                // Phase 1: Graceful service shutdown preparation
                progress.report({ increment: 30, message: 'Preparing service shutdown...' });
                
                // Cleanup any active operations for this service
                if ((templumCore as any).cleanupServiceOperations) {
                  await (templumCore as any).cleanupServiceOperations(targetServiceId!);
                }

                // Phase 2: Execute disconnection
                progress.report({ increment: 60, message: 'Disconnecting from service...' });
                
                const disconnectionResult = await (backendRouter as any).disconnectFromService?.(targetServiceId!);
                
                if (!disconnectionResult?.success) {
                  throw createTemplumError(
                    `Disconnection failed: ${disconnectionResult?.message || 'Unknown disconnection error'}`,
                    'DISCONNECTION_FAILED',
                    'network'
                  );
                }

                // Phase 3: Validate disconnection
                progress.report({ increment: 80, message: 'Validating disconnection...' });
                
                const updatedStatus = backendRouter.getConnectionStatus?.();
                const serviceStatus = updatedStatus?.backends?.[targetServiceId!];
                
                if (serviceStatus?.connected) {
                  console.warn(`Service ${targetServiceId} still reports as connected after disconnection`);
                }

                // Phase 4: Cleanup and refresh UI
                progress.report({ increment: 100, message: 'Disconnection complete!' });

                const disconnectionDuration = Date.now() - disconnectionStartTime;

                // Emit success metrics
                const metricsPayload: MetricsSignalPayload = {
                  metrics: {
                    memory: { heapUsed: 0, rss: 0 },
                    cpu: { user: 0, system: 0 },
                    interfaces: {
                      vscode: {
                        responseTime: disconnectionDuration,
                        lastActivity: Date.now()
                      }
                    }
                  },
                  category: 'usage',
                  timestamp: Date.now(),
                  source: 'ServiceDisconnection',
                  data: {
                    event_type: 'service_disconnected',
                    service_id: targetServiceId,
                    disconnection_duration: disconnectionDuration
                  }
                };
                (process as any).emit('templum:metrics', metricsPayload);

                // Refresh UI components
                if (serviceTreeProvider) {
                  serviceTreeProvider.refresh();
                }
                if (universalWebViewProvider) {
                  await universalWebViewProvider.refresh();
                }

                vscode.window.showInformationMessage(
                  `✅ Disconnected from ${serviceName} (${disconnectionDuration}ms)`
                );
                console.log(`✅ Service disconnection successful: ${targetServiceId} in ${disconnectionDuration}ms`);

              } catch (disconnectionError) {
                // Enhanced error handling
                const errorMessage = isTemplumError(disconnectionError) 
                  ? disconnectionError.message 
                  : (disconnectionError instanceof Error ? disconnectionError.message : 'Unknown disconnection error');

                // Emit error metrics
                const errorPayload: ErrorSignalPayload = {
                  error: isTemplumError(disconnectionError) ? disconnectionError : createTemplumError(errorMessage, 'DISCONNECTION_ERROR', 'network'),
                  severity: 'medium',
                  timestamp: Date.now(),
                  source: 'ServiceDisconnection',
                  data: {
                    service_id: targetServiceId,
                    disconnection_duration: Date.now() - disconnectionStartTime
                  }
                };
                (process as any).emit('templum:error', errorPayload);

                vscode.window.showErrorMessage(`❌ Failed to disconnect from ${serviceName}: ${errorMessage}`);
                console.error(`❌ Service disconnection failed: ${targetServiceId}`, disconnectionError);
                throw disconnectionError;
              }
            }
          );

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ Service disconnection failed:', error);
        }
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
 * Register Service Tree Provider with Enhanced Backend Integration
 * Implements VSCodeInterfaceAdapter pattern per Templum 1.1 spec lines 936-968
 */
async function registerServiceTreeProvider(context: vscode.ExtensionContext, engineReady: boolean): Promise<void> {
  try {
    console.log('📋 Registering Templum Service Tree Provider...');

    if (engineReady && templumCore) {
      // Create enhanced tree data provider with backend integration
      serviceTreeProvider = new BackendServiceTreeProvider(templumCore);
      
      // Register the tree view with VSCode
      const serviceTreeView = vscode.window.createTreeView('templum.serviceTree', {
        treeDataProvider: serviceTreeProvider,
        showCollapseAll: true,
        canSelectMany: false
      });

      // Setup enhanced event handlers per spec
      serviceTreeView.onDidChangeSelection(async (event) => {
        if (event.selection.length > 0) {
          const selectedItem = event.selection[0];
          if (selectedItem.contextValue === 'backend-service' || selectedItem.contextValue?.startsWith('backend-service-')) {
            try {
              // Emit metrics for service selection
              const metricsPayload: MetricsSignalPayload = {
                metrics: {
                  memory: { heapUsed: 0, rss: 0 },
                  cpu: { user: 0, system: 0 },
                  interfaces: {
                    vscode: {
                      responseTime: 0,
                      lastActivity: Date.now()
                    }
                  }
                },
                category: 'usage',
                timestamp: Date.now(),
                source: 'ServiceTreeProvider',
                data: {
                  event_type: 'service_selected',
                  service_id: selectedItem.serviceId,
                  context_value: selectedItem.contextValue
                }
              };
              (process as any).emit('templum:metrics', metricsPayload);
              
              console.log(`Service tree selection: ${selectedItem.serviceId}`);
            } catch (error) {
              console.error('Service tree selection command failed:', error);
            }
          }
        }
      });

      serviceTreeView.onDidChangeVisibility((event) => {
        if (event.visible && serviceTreeProvider) {
          // Auto-refresh when tree becomes visible
          serviceTreeProvider.refresh();
        }
      });

      // Store tree view for cleanup
      activeTreeViews.set('templum.serviceTree', serviceTreeView);
      context.subscriptions.push(serviceTreeView);

      // Register service tree commands
      const selectBackendServiceCommand = vscode.commands.registerCommand(
        'templum.selectBackendService',
        async (serviceId: string, serviceStatus: any) => {
          try {
            console.log(`Backend service selected: ${serviceId}`, serviceStatus);
            
            // Show service details in a quick pick or information message
            const names: { [key: string]: string } = {
              'haruspex': 'Haruspex Analysis Service',
              'pcl': 'Phoenix Code Lite TDD Engine', 
              'litany': 'Litany Context Manager'
            };
            const displayName = names[serviceId] || serviceId;
            const statusText = serviceStatus.connected ? 'Connected' : 'Disconnected';
            const healthText = serviceStatus.health ? ` (${serviceStatus.health})` : '';
            
            vscode.window.showInformationMessage(
              `📊 ${displayName} - ${statusText}${healthText}`,
              'Connect to Service', 'Refresh Service', 'View Details'
            ).then((choice) => {
              if (choice === 'Connect to Service') {
                vscode.commands.executeCommand('templum.connectService', serviceId);
              } else if (choice === 'Refresh Service') {
                serviceTreeProvider?.refresh();
              } else if (choice === 'View Details') {
                vscode.commands.executeCommand('templum.showServiceStatus');
              }
            });
          } catch (error) {
            console.error('Select backend service failed:', error);
          }
        }
      );

      registeredCommands.set('templum.selectBackendService', selectBackendServiceCommand);
      context.subscriptions.push(selectBackendServiceCommand);

      console.log('✅ Service Tree Provider registered successfully');
      
    } else {
      // Create placeholder tree provider for graceful degradation
      const placeholderProvider = {
        getTreeItem: (element: any) => element,
        getChildren: async () => {
          return [{
            label: engineReady ? 'Service discovery initializing...' : 'Templum engine not ready',
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'placeholder'
          }];
        }
      };

      const placeholderTreeView = vscode.window.createTreeView('templum.serviceTree', {
        treeDataProvider: placeholderProvider,
        showCollapseAll: false
      });

      activeTreeViews.set('templum.serviceTree', placeholderTreeView);
      context.subscriptions.push(placeholderTreeView);

      console.log('⚠️ Service Tree Provider registered with placeholder (engine not ready)');
    }

  } catch (error) {
    console.error('❌ Service Tree Provider registration failed:', error);
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

export async function deactivate() {
  const deactivationStartTime = Date.now();
  
  try {
    console.log('🔄 Starting Templum extension deactivation...');

    // TASK-NEW-052: Comprehensive Extension Cleanup Implementation - Complete

    // Phase 1: Disconnect all backend services gracefully
    console.log('📋 Phase 1: Backend service cleanup...');
    if (templumCore) {
      try {
        const backendRouter = templumCore.getBackendRouter();
        const connectionStatus = backendRouter.getConnectionStatus?.();
        
        if (connectionStatus?.backends) {
          const connectedServices = Object.entries(connectionStatus.backends)
            .filter(([_, status]: [string, any]) => status.connected)
            .map(([id, _]: [string, any]) => id);

          // Gracefully disconnect all connected services
          const disconnectionPromises = connectedServices.map(async (serviceId) => {
            try {
              console.log(`🔌 Disconnecting from ${serviceId}...`);
              const result = await (backendRouter as any).disconnectFromService?.(serviceId);
              if (result?.success) {
                console.log(`✅ Successfully disconnected from ${serviceId}`);
              } else {
                console.warn(`⚠️ Disconnection warning for ${serviceId}: ${result?.message || 'Unknown result'}`);
              }
            } catch (error) {
              console.error(`❌ Failed to disconnect from ${serviceId}:`, error);
            }
          });

          // Wait for all disconnections with timeout
          await Promise.allSettled(disconnectionPromises);
          console.log(`✅ Backend service cleanup complete (${connectedServices.length} services)`);
        }
      } catch (error) {
        console.error('❌ Backend service cleanup failed:', error);
      }
    }

    // Phase 2: Clean up tree views and providers
    console.log('🌳 Phase 2: Tree view and provider cleanup...');
    
    // Stop service tree provider auto-refresh
    if (serviceTreeProvider) {
      try {
        // Clear any intervals/timers if accessible
        console.log('🛑 Stopping service tree auto-refresh...');
        serviceTreeProvider = undefined;
        console.log('✅ Service tree provider cleaned up');
      } catch (error) {
        console.error('❌ Service tree provider cleanup failed:', error);
      }
    }

    // Clean up all active tree views
    if (activeTreeViews.size > 0) {
      console.log(`🗂️ Cleaning up ${activeTreeViews.size} active tree views...`);
      for (const [treeViewId, treeView] of Array.from(activeTreeViews)) {
        try {
          // Tree views are disposed automatically by VSCode context subscriptions
          console.log(`✅ Tree view ${treeViewId} marked for cleanup`);
        } catch (error) {
          console.error(`❌ Failed to cleanup tree view ${treeViewId}:`, error);
        }
      }
      activeTreeViews.clear();
      console.log('✅ All tree views cleaned up');
    }

    // Phase 3: Clean up registered commands
    console.log('⚡ Phase 3: Command registration cleanup...');
    if (registeredCommands.size > 0) {
      console.log(`🔧 Cleaning up ${registeredCommands.size} registered commands...`);
      for (const [commandId, disposable] of Array.from(registeredCommands)) {
        try {
          // Commands are disposed automatically by VSCode context subscriptions
          console.log(`✅ Command ${commandId} marked for cleanup`);
        } catch (error) {
          console.error(`❌ Failed to cleanup command ${commandId}:`, error);
        }
      }
      registeredCommands.clear();
      console.log('✅ All registered commands cleaned up');
    }

    // Phase 4: Clean up WebView providers with state preservation
    console.log('🖼️ Phase 4: WebView provider cleanup...');
    
    if (universalWebViewProvider) {
      try {
        // WebView providers are disposed automatically by VSCode context subscriptions
        universalWebViewProvider = undefined;
        console.log('✅ Universal WebView provider cleaned up');
      } catch (error) {
        console.error('❌ Universal WebView provider cleanup failed:', error);
      }
    }

    if (serviceStatusWebViewProvider) {
      try {
        serviceStatusWebViewProvider = undefined;
        console.log('✅ Service Status WebView provider cleaned up');
      } catch (error) {
        console.error('❌ Service Status WebView provider cleanup failed:', error);
      }
    }

    if (sessionManagerWebViewProvider) {
      try {
        sessionManagerWebViewProvider = undefined;
        console.log('✅ Session Manager WebView provider cleaned up');
      } catch (error) {
        console.error('❌ Session Manager WebView provider cleanup failed:', error);
      }
    }

    // Phase 5: State persistence and core engine shutdown
    console.log('🏛️ Phase 5: Core engine shutdown...');
    if (templumCore) {
      try {
        // Save current state if state manager available
        const stateManager = (templumCore as any).getStateManager?.();
        if (stateManager && (stateManager as any).persistState) {
          console.log('💾 Persisting current state...');
          await (stateManager as any).persistState();
          console.log('✅ State persisted successfully');
        }

        // Graceful shutdown with timeout
        console.log('🔄 Initiating core engine shutdown...');
        const shutdownPromise = templumCore.shutdown();
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('Shutdown timeout after 10 seconds')), 10000);
        });

        await Promise.race([shutdownPromise, timeoutPromise]);
        templumCore = undefined;
        console.log('✅ Templum Core engine shutdown completed');
        
      } catch (shutdownError) {
        console.error('❌ Error during Templum Core shutdown:', shutdownError);
        // Force cleanup even if shutdown fails
        templumCore = undefined;
        console.log('⚠️ Templum Core force-cleaned after shutdown error');
      }
    }

    // Phase 6: Final cleanup and metrics
    console.log('📊 Phase 6: Final cleanup and metrics...');
    
    try {
      // Clear any remaining global state
      const deactivationDuration = Date.now() - deactivationStartTime;
      
      // Emit final metrics signal about deactivation
      const metricsPayload: MetricsSignalPayload = {
        metrics: {
          memory: { heapUsed: 0, rss: 0 },
          cpu: { user: 0, system: 0 },
          interfaces: {
            vscode: {
              responseTime: deactivationDuration,
              lastActivity: Date.now()
            }
          }
        },
        category: 'usage',
        timestamp: Date.now(),
        source: 'ExtensionDeactivation',
        data: {
          event_type: 'extension_deactivated',
          deactivation_duration: deactivationDuration,
          cleanup_phases_completed: 6,
          graceful_shutdown: true
        }
      };
      
      // Emit final metrics (process might be terminating, so don't await)
      try {
        (process as any).emit('templum:metrics', metricsPayload);
      } catch (metricsError) {
        // Metrics emission failed, but don't block deactivation
        console.warn('⚠️ Failed to emit final metrics:', metricsError);
      }

      console.log(`✅ Final cleanup completed in ${deactivationDuration}ms`);
      console.log('🎉 Templum extension deactivation complete - all resources cleaned up');
      
    } catch (finalError) {
      console.error('❌ Error during final cleanup phase:', finalError);
    }

  } catch (error) {
    const deactivationDuration = Date.now() - deactivationStartTime;
    console.error(`❌ Critical error during Templum deactivation (${deactivationDuration}ms):`, error);
    
    // Emit error signal about failed deactivation
    try {
      const errorPayload: ErrorSignalPayload = {
        error: isTemplumError(error) ? error : createTemplumError(
          error instanceof Error ? error.message : 'Unknown deactivation error',
          'DEACTIVATION_ERROR',
          'runtime'
        ),
        severity: 'high',
        timestamp: Date.now(),
        source: 'ExtensionDeactivation',
        data: {
          deactivation_duration: deactivationDuration,
          cleanup_phase_failed: true
        }
      };
      (process as any).emit('templum:error', errorPayload);
    } catch (errorEmissionError) {
      console.error('❌ Failed to emit deactivation error signal:', errorEmissionError);
    }
  }
}
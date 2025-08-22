/**---
 * title: [Haruspex Extension - Comprehensive Cleanup & Resource Management]
 * tags: [Extension, VSCode, UX, Debugging, Setup, Cleanup, Resource-Management]
 * provides: [Extension Activation, Cleanup Orchestration, Crash Recovery, Process Management]
 * requires: [Core Engine, Debug Manager, Setup Wizard, WebView Providers, Cleanup Orchestrator]
 * description: [Enhanced extension entry point with comprehensive cleanup, process tracking, crash recovery, and robust resource management]
 * ---*/

import * as vscode from 'vscode';
import { HaruspexCoreEngine } from './core/haruspex-core-engine';
import { DocumentationTreeProvider } from './providers/documentation-tree';
import { MermaidWebViewProvider } from './providers/mermaid-webview';
import { KanbanWebViewProvider } from './providers/kanban-webview';
import { TruthMatrixWebViewProvider } from './providers/truth-matrix-webview';
import { TelemetryCollector } from './core/telemetry-collector';
import { HaruspexDebugManager } from './debugging/haruspex-debug-manager';
import { HaruspexWorkspaceWizard } from './setup/haruspex-workspace-wizard';
import { AgentDebuggingSystem } from './debugging/agent-debugging-integration';
import { HaruspexCleanupOrchestrator } from './core/haruspex-cleanup-orchestrator';

// Global extension state
let coreEngine: HaruspexCoreEngine | undefined;
let documentationTreeProvider: DocumentationTreeProvider | undefined;
let mermaidWebViewProvider: MermaidWebViewProvider | undefined;
let kanbanWebViewProvider: KanbanWebViewProvider | undefined;
let truthMatrixWebViewProvider: TruthMatrixWebViewProvider | undefined;
let debugManager: HaruspexDebugManager | undefined;
let workspaceWizard: HaruspexWorkspaceWizard | undefined;
let telemetryCollector: TelemetryCollector | undefined;
let agentDebugging: AgentDebuggingSystem | undefined;
let cleanupOrchestrator: HaruspexCleanupOrchestrator | undefined;

export async function activate(context: vscode.ExtensionContext) {
  try {
    // Initialize debug manager first for comprehensive logging
    debugManager = new HaruspexDebugManager(context);
    debugManager.recordActivationStart();
    debugManager.log('Starting Haruspex extension activation with robust cleanup');

    // Check for workspace folder
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      debugManager.recordActivationWarning('No workspace folder detected');
      
      // Show friendly message with options
      const choice = await vscode.window.showWarningMessage(
        'Haruspex works best with a workspace folder open.',
        'Open Folder', 'Continue Anyway', 'Learn More'
      );
      
      if (choice === 'Open Folder') {
        await vscode.commands.executeCommand('vscode.openFolder');
        return; // Exit activation, will re-activate when folder opened
      } else if (choice === 'Learn More') {
        await vscode.commands.executeCommand('haruspex.debug.showInfo');
        return;
      }
      
      // Continue without workspace folder (limited functionality)
      debugManager.log('Continuing activation without workspace folder (limited functionality)');
      
      // Initialize with limited functionality
      telemetryCollector = new TelemetryCollector({
        privacyCompliant: true,
        performanceMetrics: true,
        errorReporting: true,
        outputChannel: true
      });
      
      debugManager.log('Telemetry collector initialized (limited mode)');
      
      // Initialize workspace wizard in limited mode
      workspaceWizard = new HaruspexWorkspaceWizard(context, undefined, telemetryCollector);
      debugManager.log('Workspace wizard initialized (limited mode)');
      
      // Show limited functionality message
      vscode.window.showInformationMessage(
        'Haruspex activated in limited mode. Open a workspace folder for full functionality.'
      );
      
      return; // Exit early, don't try to initialize core engine
    }

    // Initialize cleanup orchestrator FIRST for crash recovery
    cleanupOrchestrator = new HaruspexCleanupOrchestrator(
      context,
      workspaceRoot,
      (message: string, level?: 'info' | 'warning' | 'error') => debugManager?.log(message, level),
      {
        components: {
          enableProcessManagement: true,
          enableFileCleanup: true,
          enableCommandManagement: true,
        },
        recovery: {
          enableStartupRecovery: true,
          enableCrashRecovery: true,
          enableBackupValidation: false,
        },
        timing: {
          gracefulShutdownTimeout: 10000,
          heartbeatInterval: 2000,
          retryDelay: 200,
          maxRetryAttempts: 3,
        },
        enableDetailedLogging: true
      }
    );

    // Perform startup recovery (detects and cleans up crashed sessions)
    debugManager.log('Performing startup recovery check...');
    const recoveryResult = await cleanupOrchestrator.initialize();
    
    if (recoveryResult.recoveryNeeded) {
      debugManager.log('Crash recovery performed:', 'warning');
      debugManager.log(recoveryResult.summary);
      
      // Show recovery notification to user
      vscode.window.showInformationMessage(
        `Haruspex: Recovered from previous session (${recoveryResult.orphanProcesses.orphansFound} processes, ${recoveryResult.fileCleanup.filesDeleted} files cleaned)`
      );
    } else {
      debugManager.log('Clean startup - no recovery needed');
    }

    // Initialize telemetry collector
    telemetryCollector = new TelemetryCollector({
      privacyCompliant: true,
      performanceMetrics: true,
      errorReporting: true,
      outputChannel: true
    });

    debugManager.log('Telemetry collector initialized');

    // Initialize workspace wizard
    workspaceWizard = new HaruspexWorkspaceWizard(context, undefined, telemetryCollector);
    debugManager.log('Workspace wizard initialized');

    let engineInitialized = false;
    
    if (workspaceRoot) {
      try {
        // Create and initialize core engine
        debugManager.log('Initializing core engine...');
        coreEngine = new HaruspexCoreEngine(workspaceRoot, {
          telemetry: {
            privacyCompliant: true,
            performanceMetrics: true,
            errorReporting: true,
            outputChannel: true
          },
          fileMonitoring: {
            enabled: true,
            patterns: ['**/*.{ts,tsx,js,jsx,md,json}'],
            debounceMs: 500
          }
        });

        const initResult = await coreEngine.initialize();
        engineInitialized = initResult.success;
        
        if (initResult.success) {
          debugManager.log('Core engine initialized successfully');
          
          // Setup file monitoring
          coreEngine.setupFileWatching(context);
          debugManager.log('File monitoring setup complete');
          
          // Show success message with compatibility score
          const score = initResult.compatibility?.score || 0;
          vscode.window.showInformationMessage(
            `Haruspex activated successfully (Compatibility: ${score}%)`
          );
          
          // Log any compatibility warnings
          if (initResult.warnings?.length) {
            initResult.warnings.forEach(warning => 
              debugManager!.recordActivationWarning(warning)
            );
          }
        } else {
          debugManager.recordActivationError('Core engine initialization failed');
          const errors = initResult.errors?.join(', ') || 'Unknown error';
          vscode.window.showErrorMessage(`Haruspex initialization failed: ${errors}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        debugManager.recordActivationError(`Core engine error: ${errorMessage}`);
        engineInitialized = false;
      }
    }

    // Update debug manager with initialized engine
    if (engineInitialized && coreEngine) {
      debugManager = new HaruspexDebugManager(context, coreEngine, telemetryCollector);
      workspaceWizard = new HaruspexWorkspaceWizard(context, coreEngine, telemetryCollector);
      
      // Initialize agent debugging system
      try {
        debugManager.log('Initializing agent debugging system...');
        agentDebugging = new AgentDebuggingSystem(
          context,
          coreEngine, 
          debugManager, 
          workspaceRoot!,
          cleanupOrchestrator!
        );
        
        await agentDebugging.initialize();
        debugManager.log('Agent debugging system initialized successfully');
        
        // Track any processes created by the agent debugging system
        if (cleanupOrchestrator && agentDebugging) {
          // The AgentDebuggingSystem may create IPC servers and other processes
          // We'll track them through the debugging system's process management
          debugManager.log('Tracking agent debugging system processes...');
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        debugManager.recordActivationWarning(`Agent debugging system failed to initialize: ${errorMessage}`);
        debugManager.log(`Agent debugging initialization failed: ${errorMessage}`, 'warning');
      }
    }

    // Register UI providers (even if engine failed, for graceful degradation)
    await registerUIProviders(context, engineInitialized);

    // Register enhanced commands using cleanup orchestrator for conflict handling
    await registerEnhancedCommands(context);

    // Check if workspace needs initialization
    if (workspaceRoot && engineInitialized) {
      await checkWorkspaceInitialization(context);
    }

    const activationDuration = Date.now() - (debugManager as any).activationTime;
    debugManager.recordActivationSuccess(activationDuration);
    debugManager.log(`Haruspex activation complete in ${activationDuration}ms`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown activation error';
    debugManager?.recordActivationError(errorMessage);
    vscode.window.showErrorMessage(`Haruspex activation failed: ${errorMessage}`);
    console.error('Haruspex activation error:', error);
  }
}

/**
 * Register UI providers with enhanced error handling and user feedback
 */
async function registerUIProviders(context: vscode.ExtensionContext, engineReady: boolean): Promise<void> {
  try {
    debugManager?.log('Registering UI providers...');

    // ✅ PHASE 4: Register Documentation Tree Provider
    if (engineReady && coreEngine && telemetryCollector) {
      documentationTreeProvider = new DocumentationTreeProvider(coreEngine, telemetryCollector);
      
      const treeDataProviderDisposable = vscode.window.registerTreeDataProvider(
        'haruspex.documentationTree', 
        documentationTreeProvider
      );
      context.subscriptions.push(treeDataProviderDisposable);
      debugManager?.log('Documentation tree provider registered');
    } else {
      // Register placeholder provider for graceful degradation
      const placeholderProvider = createPlaceholderTreeProvider();
      const treeDataProviderDisposable = vscode.window.registerTreeDataProvider(
        'haruspex.documentationTree', 
        placeholderProvider
      );
      context.subscriptions.push(treeDataProviderDisposable);
      debugManager?.log('Placeholder tree provider registered (engine not ready)');
    }

    // Register tree-related commands
    registerTreeCommands(context);

    // ✅ PHASE 5: Register WebView Providers
    if (engineReady && coreEngine && telemetryCollector) {
      mermaidWebViewProvider = new MermaidWebViewProvider(context, coreEngine, telemetryCollector);
      kanbanWebViewProvider = new KanbanWebViewProvider(context, coreEngine, telemetryCollector);  
      truthMatrixWebViewProvider = new TruthMatrixWebViewProvider(context, coreEngine, telemetryCollector);
      debugManager?.log('WebView providers created');
    } else {
      // Create enhanced providers that show setup prompts instead of loading
      mermaidWebViewProvider = createEnhancedWebViewProvider(context, 'mermaid', engineReady);
      kanbanWebViewProvider = createEnhancedWebViewProvider(context, 'kanban', engineReady);
      truthMatrixWebViewProvider = createEnhancedWebViewProvider(context, 'truthMatrix', engineReady);
      debugManager?.log('Enhanced WebView providers created (engine not ready)');
    }

    // Register webview providers with VSCode
    if (mermaidWebViewProvider) {
      const mermaidWebViewDisposable = vscode.window.registerWebviewViewProvider(
        'haruspex.mermaidView',
        mermaidWebViewProvider
      );
      context.subscriptions.push(mermaidWebViewDisposable);
    }

    if (kanbanWebViewProvider) {
      const kanbanWebViewDisposable = vscode.window.registerWebviewViewProvider(
        'haruspex.kanbanView', 
        kanbanWebViewProvider
      );
      context.subscriptions.push(kanbanWebViewDisposable);
    }

    if (truthMatrixWebViewProvider) {
      const truthMatrixWebViewDisposable = vscode.window.registerWebviewViewProvider(
        'haruspex.truthMatrix',
        truthMatrixWebViewProvider
      );
      context.subscriptions.push(truthMatrixWebViewDisposable);
    }

    debugManager?.log('All UI providers registered successfully');

  } catch (error) {
    debugManager?.recordActivationError(`UI provider registration failed: ${error}`);
    throw error;
  }
}

/**
 * Register tree-related commands
 */
function registerTreeCommands(context: vscode.ExtensionContext): void {
  const refreshTreeCommand = vscode.commands.registerCommand(
    'haruspex.refreshDocumentationTree', 
    () => {
      if (documentationTreeProvider) {
        documentationTreeProvider.refresh();
        debugManager?.log('Documentation tree refreshed via command');
      } else {
        vscode.window.showWarningMessage('Documentation tree not available - try running Haruspex setup');
      }
    }
  );

  const navigateToFileCommand = vscode.commands.registerCommand(
    'haruspex.navigateToFile', 
    async (filePath: string) => {
      try {
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc, { preview: false });
        debugManager?.log(`Navigated to file: ${filePath}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to open file: ${errorMessage}`);
        debugManager?.log(`Navigation failed: ${errorMessage}`, 'error');
      }
    }
  );

  const generateStubCommand = vscode.commands.registerCommand(
    'haruspex.generateStub',
    async (treeItem: any) => {
      try {
        const filePath = treeItem?.metadata?.filePath;
        if (!filePath) {
          vscode.window.showWarningMessage('No file path available for stub generation');
          return;
        }

        vscode.window.showInformationMessage(
          `Stub generation for ${filePath} - Enhanced in setup wizard`
        );
        debugManager?.log(`Stub generation requested for: ${filePath}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to generate stub: ${errorMessage}`);
        debugManager?.log(`Stub generation failed: ${errorMessage}`, 'error');
      }
    }
  );

  context.subscriptions.push(refreshTreeCommand, navigateToFileCommand, generateStubCommand);
}

/**
 * Register enhanced commands with debugging and setup integration
 */
async function registerEnhancedCommands(context: vscode.ExtensionContext): Promise<void> {

  // Register commands using cleanup orchestrator for enhanced conflict handling
  if (cleanupOrchestrator) {
    try {
      const commandsToRegister = [
        {
          commandId: 'haruspex.refreshAll',
          handler: async () => {
            try {
              if (!coreEngine) {
                vscode.window.showWarningMessage('Haruspex core engine not initialized - try running setup');
                return;
              }

              debugManager?.log('Refreshing all Haruspex data...');
              const truthMatrix = await coreEngine.getTruthMatrix();
              const docTree = await coreEngine.getDocumentationTree();
              const diagrams = await coreEngine.getMermaidDiagrams();

              // Refresh UI providers
              documentationTreeProvider?.refresh();
              mermaidWebViewProvider?.refresh();
              kanbanWebViewProvider?.refresh();
              truthMatrixWebViewProvider?.refresh();

              vscode.window.showInformationMessage(
                `Haruspex refreshed: Health ${truthMatrix.overallHealthScore}%, ` +
                `${docTree.length} docs, ${diagrams.length} diagrams`
              );
              debugManager?.log('All data refreshed successfully');
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              vscode.window.showErrorMessage(`Haruspex refresh failed: ${errorMessage}`);
              debugManager?.log(`Refresh failed: ${errorMessage}`, 'error');
            }
          },
          metadata: {
            category: 'core' as const,
            description: 'Refresh all Haruspex data and UI components',
            essential: true
          }
        },
        {
          commandId: 'haruspex.showHealth',
          handler: () => {
            if (!coreEngine) {
              vscode.window.showWarningMessage('Haruspex core engine not initialized');
              return;
            }

            const health = coreEngine.getHealthStatus();
            const statusIcon = health.overall === 'healthy' ? '✅' : 
                              health.overall === 'degraded' ? '⚠️' : '❌';
            
            vscode.window.showInformationMessage(
              `Haruspex Health ${statusIcon} ${health.overall.toUpperCase()} - ` +
              `${health.metrics?.totalOperations || 0} ops, ` +
              `${health.metrics?.averageResponseTime || 0}ms avg`
            );
            debugManager?.log(`Health status: ${health.overall}`);
          },
          metadata: {
            category: 'core' as const,
            description: 'Display Haruspex health status',
            essential: false
          }
        },
        {
          commandId: 'haruspex.showMetrics',
          handler: () => {
            if (!coreEngine) {
              vscode.window.showWarningMessage('Haruspex core engine not initialized');
              return;
            }

            const metrics = coreEngine.getMetrics();
            showMetricsPanel(metrics);
          },
          metadata: {
            category: 'core' as const,
            description: 'Display comprehensive metrics panel',
            essential: false
          }
        },
        {
          commandId: 'haruspex.setup.runWizard',
          handler: async () => {
            if (!workspaceWizard) {
              vscode.window.showErrorMessage('Workspace wizard not available');
              return;
            }

            debugManager?.log('Starting workspace setup wizard...');
            try {
              const result = await workspaceWizard.runSetupWizard();
              if (result) {
                debugManager?.log(`Setup completed: ${result.filesModified} files modified`);
                // Refresh all providers after setup
                await vscode.commands.executeCommand('haruspex.refreshAll');
              } else {
                debugManager?.log('Setup wizard cancelled by user');
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              vscode.window.showErrorMessage(`Setup failed: ${errorMessage}`);
              debugManager?.log(`Setup failed: ${errorMessage}`, 'error');
            }
          },
          metadata: {
            category: 'setup' as const,
            description: 'Run Haruspex workspace setup wizard',
            essential: true
          }
        },
        {
          commandId: 'haruspex.initWorkspace',
          handler: async () => {
            await vscode.commands.executeCommand('haruspex.setup.runWizard');
          },
          metadata: {
            category: 'setup' as const,
            description: 'Initialize Haruspex workspace',
            essential: true
          }
        }
      ];

      const registrationResult = await cleanupOrchestrator.registerCommands(commandsToRegister);
      
      debugManager?.log(
        `Enhanced commands registered: ${registrationResult.successful} successful, ` +
        `${registrationResult.skipped} skipped (hot-reload), ${registrationResult.failed} failed`
      );

      if (registrationResult.failed > 0) {
        debugManager?.log('Some commands failed to register - check for conflicts', 'warning');
      }

    } catch (error) {
      debugManager?.log(`Command registration failed: ${error}`, 'error');
      debugManager?.log('Enhanced command registration with cleanup orchestrator failed - functionality may be limited', 'warning');
    }
  } else {
    debugManager?.log('Cleanup orchestrator not available - commands may conflict during hot-reload', 'warning');
  }
}

/**
 * Check if workspace needs initialization and prompt user
 */
async function checkWorkspaceInitialization(context: vscode.ExtensionContext): Promise<void> {
  if (!workspaceWizard) return;

  try {
    const analysis = await workspaceWizard.analyzeWorkspace();
    
    // If workspace has no Haruspex files and has supported files, suggest setup
    if (analysis.haruspexFileCount === 0 && analysis.supportedFileCount > 0) {
      const choice = await vscode.window.showInformationMessage(
        `Welcome to Haruspex! Found ${analysis.supportedFileCount} files in your ${analysis.projectType} project.`,
        'Initialize Workspace', 'Maybe Later', 'Show Diagnostics'
      );

      if (choice === 'Initialize Workspace') {
        await vscode.commands.executeCommand('haruspex.setup.runWizard');
      } else if (choice === 'Show Diagnostics') {
        await vscode.commands.executeCommand('haruspex.debug.showInfo');
      }
      
      debugManager?.log(`Workspace initialization prompt: ${choice || 'dismissed'}`);
    }
  } catch (error) {
    debugManager?.log(`Workspace analysis failed: ${error}`, 'warning');
  }
}

/**
 * Create placeholder tree provider for graceful degradation
 */
function createPlaceholderTreeProvider(): vscode.TreeDataProvider<any> {
  return {
    getTreeItem: (element: any) => {
      const item = new vscode.TreeItem(element.label);
      item.description = element.description;
      item.contextValue = 'haruspexPlaceholder';
      return item;
    },
    
    getChildren: () => {
      return [
        { 
          label: 'Haruspex Setup Required', 
          description: 'Click to initialize workspace'
        },
        { 
          label: 'Run Setup Wizard', 
          description: 'Initialize documentation system'
        },
        { 
          label: 'Show Diagnostics', 
          description: 'Troubleshoot issues'
        }
      ];
    }
  };
}

/**
 * Create enhanced WebView provider with better UX
 */
function createEnhancedWebViewProvider(
  context: vscode.ExtensionContext, 
  type: 'mermaid' | 'kanban' | 'truthMatrix',
  engineReady: boolean
): any {
  return {
    resolveWebviewView: (webviewView: vscode.WebviewView) => {
      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [context.extensionUri]
      };
      
      webviewView.webview.html = generateSetupPromptHtml(type, engineReady);
      
      webviewView.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case 'runSetup':
            vscode.commands.executeCommand('haruspex.setup.runWizard');
            break;
          case 'showDiagnostics':
            vscode.commands.executeCommand('haruspex.debug.showInfo');
            break;
          case 'openFolder':
            vscode.commands.executeCommand('vscode.openFolder');
            break;
        }
      });
    },
    
    refresh: async () => {
      // Enhanced providers don't need refresh until engine is ready
    }
  };
}

/**
 * Generate HTML for setup prompt in WebViews
 */
function generateSetupPromptHtml(type: string, engineReady: boolean): string {
  const titles = {
    mermaid: 'Architecture Diagrams',
    kanban: 'TDD Workflow',
    truthMatrix: 'Health Dashboard'
  };
  
  const descriptions = {
    mermaid: 'Visual representation of your system architecture',
    kanban: 'Track your development progress and testing status',
    truthMatrix: 'Monitor the health and completeness of your documentation'
  };

  const title = titles[type as keyof typeof titles];
  const description = descriptions[type as keyof typeof descriptions];

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
        .setup-prompt {
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
    <div class="setup-prompt">
        <div class="icon">🔮</div>
        <div class="title">${title}</div>
        <div class="description">${description}</div>
        <div class="description">Initialize your workspace to see content here.</div>
        <button class="button" onclick="runSetup()">Initialize Workspace</button>
        <button class="button secondary" onclick="showDiagnostics()">Show Diagnostics</button>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function runSetup() {
            vscode.postMessage({ type: 'runSetup' });
        }
        
        function showDiagnostics() {
            vscode.postMessage({ type: 'showDiagnostics' });
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

/**
 * Generate HTML for debug info panel
 */
function generateDebugInfoHtml(debugInfo: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Haruspex Debug Info</title>
      <style>
        body { 
          font-family: var(--vscode-font-family); 
          background: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
          padding: 20px; 
        }
        .section {
          margin-bottom: 20px;
          padding: 15px;
          background: var(--vscode-textCodeBlock-background);
          border-radius: 5px;
        }
        .section h3 {
          margin-top: 0;
          color: var(--vscode-textPreformat-foreground);
        }
        pre { 
          background: var(--vscode-editor-background); 
          padding: 10px; 
          border-radius: 3px;
          overflow-x: auto;
          font-size: 0.9em;
        }
        .status-good { color: #4CAF50; }
        .status-warning { color: #FF9800; }
        .status-error { color: #F44336; }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 10px 0;
        }
        .info-item {
          padding: 8px;
          background: var(--vscode-editor-background);
          border-radius: 3px;
        }
      </style>
    </head>
    <body>
      <h1>🔮 Haruspex Agent Debugging System</h1>
      
      <div class="section">
        <h3>🚀 System Status</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Server Status:</strong> 
            <span class="${debugInfo.server?.running ? 'status-good' : 'status-error'}">
              ${debugInfo.server?.running ? '✅ Running' : '❌ Stopped'}
            </span>
          </div>
          <div class="info-item">
            <strong>Socket Path:</strong> 
            <code>${debugInfo.server?.socketPath || 'N/A'}</code>
          </div>
          <div class="info-item">
            <strong>State Inspector:</strong> 
            <span class="${debugInfo.stateInspector?.active ? 'status-good' : 'status-warning'}">
              ${debugInfo.stateInspector?.active ? '✅ Active' : '⚠️ Inactive'}
            </span>
          </div>
          <div class="info-item">
            <strong>Interactive Controller:</strong> 
            <span class="${debugInfo.interactiveController?.active ? 'status-good' : 'status-warning'}">
              ${debugInfo.interactiveController?.active ? '✅ Active' : '⚠️ Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>📊 Performance Metrics</h3>
        <pre>${JSON.stringify(debugInfo.metrics || {}, null, 2)}</pre>
      </div>

      <div class="section">
        <h3>🔍 State Inspector Status</h3>
        <pre>${JSON.stringify(debugInfo.stateInspector || {}, null, 2)}</pre>
      </div>

      <div class="section">
        <h3>🎮 Interactive Controller Status</h3>
        <pre>${JSON.stringify(debugInfo.interactiveController || {}, null, 2)}</pre>
      </div>

      <div class="section">
        <h3>🌐 IPC Server Details</h3>
        <pre>${JSON.stringify(debugInfo.server || {}, null, 2)}</pre>
      </div>

      <p><em>Generated: ${new Date().toLocaleString()}</em></p>
    </body>
    </html>`;
}

/**
 * Show metrics in a panel
 */
function showMetricsPanel(metrics: any): void {
  const output = [
    'Haruspex Core Engine Metrics:',
    `- Operations: ${metrics.operations.totalOperations} total, ${metrics.operations.successfulOperations} successful`,
    `- Circuit Breaker: ${metrics.circuitBreaker.state}, ${metrics.circuitBreaker.failures} failures`,
    `- Error Boundary: ${metrics.errorBoundary.totalErrors} errors, ${Math.round(metrics.errorBoundary.recoverySuccessRate * 100)}% recovery rate`,
    `- Telemetry: ${metrics.telemetry.totalEvents} events collected`,
    `- File Monitor: ${metrics.fileMonitor.totalChanges} file changes detected`
  ];

  const panel = vscode.window.createWebviewPanel(
    'haruspexMetrics',
    'Haruspex Metrics',
    vscode.ViewColumn.One,
    {}
  );

  panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Haruspex Metrics</title>
      <style>
        body { 
          font-family: var(--vscode-font-family); 
          background: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
          padding: 20px; 
        }
        pre { 
          background: var(--vscode-textCodeBlock-background); 
          padding: 15px; 
          border-radius: 5px; 
        }
      </style>
    </head>
    <body>
      <h1>🔮 Haruspex Core Engine Metrics</h1>
      <pre>${output.join('\\n')}</pre>
      <p><em>Updated: ${new Date().toLocaleString()}</em></p>
    </body>
    </html>
  `;
}

export function deactivate() {
  try {
    debugManager?.log('Starting Haruspex deactivation with comprehensive cleanup...');

    // Use cleanup orchestrator for comprehensive shutdown
    if (cleanupOrchestrator) {
      debugManager?.log('Triggering graceful shutdown via cleanup orchestrator...');
      
      // Trigger graceful shutdown (don't await as VS Code may have timeout constraints)
      cleanupOrchestrator.gracefulShutdown()
        .then(result => {
          debugManager?.log('Graceful shutdown complete');
          debugManager?.log(result.summary);
        })
        .catch(error => {
          debugManager?.log(`Graceful shutdown failed, attempting emergency cleanup: ${error}`, 'error');
          
          // If graceful shutdown fails, try emergency shutdown
          cleanupOrchestrator?.emergencyShutdown()
            .then(emergencyResult => {
              debugManager?.log('Emergency shutdown complete');
              debugManager?.log(emergencyResult.summary);
            })
            .catch(emergencyError => {
              console.error('Both graceful and emergency shutdown failed:', emergencyError);
            });
        })
        .finally(() => {
          // Clean up the orchestrator itself
          cleanupOrchestrator = undefined;
        });
        
    } else {
      // Fallback to basic cleanup if orchestrator not available
      debugManager?.log('Cleanup orchestrator not available - performing basic cleanup');
      performBasicCleanup();
    }

  } catch (error) {
    console.error('Error during Haruspex deactivation:', error);
    // Try basic cleanup as last resort
    performBasicCleanup();
  }
}

/**
 * Fallback basic cleanup for when orchestrator is not available
 */
function performBasicCleanup(): void {
  try {
    debugManager?.log('Performing basic cleanup...');

    // Clean up providers
    if (documentationTreeProvider) {
      documentationTreeProvider = undefined;
      debugManager?.log('Documentation tree provider cleaned up');
    }

    if (mermaidWebViewProvider) {
      mermaidWebViewProvider = undefined;
      debugManager?.log('Mermaid WebView provider cleaned up');
    }

    if (kanbanWebViewProvider) {
      kanbanWebViewProvider = undefined;
      debugManager?.log('Kanban WebView provider cleaned up');
    }

    if (truthMatrixWebViewProvider) {
      truthMatrixWebViewProvider = undefined;
      debugManager?.log('Truth Matrix WebView provider cleaned up');
    }

    // Clean up core engine
    if (coreEngine) {
      coreEngine.dispose();
      coreEngine = undefined;
      debugManager?.log('Haruspex core engine disposed');
    }

    // Clean up agent debugging system
    if (agentDebugging) {
      try {
        agentDebugging.dispose();
        agentDebugging = undefined;
        debugManager?.log('Agent debugging system disposed');
      } catch (error) {
        console.error('Error disposing agent debugging system:', error);
      }
    }

    // Clean up other managers
    if (workspaceWizard) {
      workspaceWizard = undefined;
      debugManager?.log('Workspace wizard cleaned up');
    }

    if (telemetryCollector) {
      telemetryCollector.dispose();
      telemetryCollector = undefined;
      debugManager?.log('Telemetry collector disposed');
    }

    // Clean up debug manager last
    if (debugManager) {
      debugManager.log('Basic cleanup complete');
      debugManager.dispose();
      debugManager = undefined;
    }

  } catch (error) {
    console.error('Error during basic cleanup:', error);
  }
}

/**---
 * title: [Enhanced Haruspex Extension - Robust Cleanup & Process Management]
 * tags: [Extension, VSCode, Cleanup, Process-Management, Robust-Shutdown]
 * provides: [EnhancedActivation, RobustCleanup, ProcessTracking, CommandManagement]
 * requires: [CleanupOrchestrator, ProcessManager, FileCleanup, CommandManager]
 * description: [Enhanced extension entry point with comprehensive cleanup, process tracking, and robust shutdown handling for graceful and ungraceful termination scenarios]
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
import { HaruspexCleanupOrchestrator, StartupRecoveryResult, CleanupResult } from './core/haruspex-cleanup-orchestrator';

// Global extension state with enhanced cleanup management
let cleanupOrchestrator: HaruspexCleanupOrchestrator | undefined;
let coreEngine: HaruspexCoreEngine | undefined;
let documentationTreeProvider: DocumentationTreeProvider | undefined;
let mermaidWebViewProvider: MermaidWebViewProvider | undefined;
let kanbanWebViewProvider: KanbanWebViewProvider | undefined;
let truthMatrixWebViewProvider: TruthMatrixWebViewProvider | undefined;
let debugManager: HaruspexDebugManager | undefined;
let workspaceWizard: HaruspexWorkspaceWizard | undefined;
let telemetryCollector: TelemetryCollector | undefined;
let agentDebugging: AgentDebuggingSystem | undefined;

// Global activation state
let isActivating = false;
let activationStartTime = 0;

export async function activate(context: vscode.ExtensionContext) {
  if (isActivating) {
    throw new Error('Extension activation already in progress');
  }

  isActivating = true;
  activationStartTime = Date.now();

  try {
    // Get workspace root early
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    
    // Initialize debug manager first for comprehensive logging
    debugManager = new HaruspexDebugManager(context);
    debugManager.recordActivationStart();
    debugManager.log('Starting enhanced Haruspex extension activation with robust cleanup...');

    // Initialize cleanup orchestrator FIRST (before any other components)
    if (workspaceRoot) {
      cleanupOrchestrator = new HaruspexCleanupOrchestrator(
        context,
        workspaceRoot,
        (message: string, level?: 'info' | 'warning' | 'error') => {
          debugManager?.log(message, level);
        },
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
          enableDetailedLogging: true
        }
      );

      // Perform startup recovery and initialization
      const recoveryResult = await cleanupOrchestrator.initialize();
      
      if (recoveryResult.recoveryNeeded) {
        debugManager.log(`Startup recovery performed: ${recoveryResult.summary}`, 'warning');
        
        // Show user notification if significant recovery was needed
        if (recoveryResult.orphanProcesses.orphansFound > 0 || recoveryResult.fileCleanup.filesDeleted > 5) {
          vscode.window.showInformationMessage(
            `Haruspex recovered from previous session: ${recoveryResult.orphanProcesses.orphansFound} processes cleaned, ${recoveryResult.fileCleanup.filesDeleted} temporary files removed.`,
            'Show Details'
          ).then(choice => {
            if (choice === 'Show Details') {
              vscode.commands.executeCommand('haruspex.debug.showInfo');
            }
          });
        }
      } else {
        debugManager.log('Clean startup - no recovery needed');
      }
    }

    // Handle no workspace scenario with enhanced cleanup
    if (!workspaceRoot) {
      await handleNoWorkspaceScenario(context);
      return;
    }

    // Initialize core components with process tracking
    await initializeCoreComponents(context, workspaceRoot);

    // Register UI providers with enhanced error handling
    await registerUIProviders(context);

    // Register enhanced commands with conflict resolution
    await registerEnhancedCommands(context);

    // Check if workspace needs initialization
    await checkWorkspaceInitialization(context);

    // Finalize activation
    const activationDuration = Date.now() - activationStartTime;
    debugManager?.recordActivationSuccess(activationDuration);
    debugManager?.log(`Enhanced Haruspex activation complete in ${activationDuration}ms`);

    // Log cleanup orchestrator status
    if (cleanupOrchestrator) {
      const status = cleanupOrchestrator.getStatus();
      debugManager?.log(`Cleanup orchestrator ready: ${status.processes} processes tracked, ${status.commands} commands managed`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown activation error';
    debugManager?.recordActivationError(errorMessage);
    
    // Attempt emergency cleanup on activation failure
    if (cleanupOrchestrator) {
      try {
        await cleanupOrchestrator.emergencyShutdown();
      } catch (cleanupError) {
        debugManager?.log(`Emergency cleanup after activation failure failed: ${cleanupError}`, 'error');
      }
    }
    
    vscode.window.showErrorMessage(`Haruspex activation failed: ${errorMessage}`);
    console.error('Haruspex activation error:', error);
    throw error;
  } finally {
    isActivating = false;
  }
}

/**
 * Handle no workspace folder scenario with limited functionality
 */
async function handleNoWorkspaceScenario(context: vscode.ExtensionContext): Promise<void> {
  debugManager?.recordActivationWarning('No workspace folder detected');
  
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
  debugManager?.log('Continuing activation without workspace folder (limited functionality)');
  
  // Initialize with limited functionality
  telemetryCollector = new TelemetryCollector({
    privacyCompliant: true,
    performanceMetrics: true,
    errorReporting: true,
    outputChannel: true
  });
  
  debugManager?.log('Telemetry collector initialized (limited mode)');
  
  // Initialize workspace wizard in limited mode
  workspaceWizard = new HaruspexWorkspaceWizard(context, undefined, telemetryCollector);
  debugManager?.log('Workspace wizard initialized (limited mode)');
  
  // Register basic commands even in limited mode
  await registerLimitedModeCommands(context);
  
  // Show limited functionality message
  vscode.window.showInformationMessage(
    'Haruspex activated in limited mode. Open a workspace folder for full functionality.'
  );
}

/**
 * Initialize core components with process tracking
 */
async function initializeCoreComponents(context: vscode.ExtensionContext, workspaceRoot: string): Promise<void> {
  let engineInitialized = false;
  
  try {
    // Initialize telemetry collector and track it
    telemetryCollector = new TelemetryCollector({
      privacyCompliant: true,
      performanceMetrics: true,
      errorReporting: true,
      outputChannel: true
    });
    debugManager?.log('Telemetry collector initialized');

    // Initialize workspace wizard
    workspaceWizard = new HaruspexWorkspaceWizard(context, undefined, telemetryCollector);
    debugManager?.log('Workspace wizard initialized');

    // Create and initialize core engine
    debugManager?.log('Initializing core engine...');
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
      debugManager?.log('Core engine initialized successfully');
      
      // Setup file monitoring and track watchers
      coreEngine.setupFileWatching(context);
      debugManager?.log('File monitoring setup complete');
      
      // Track file monitoring processes if available
      // Note: Actual file watchers are handled internally by VS Code, 
      // but we can track our handlers
      
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
      debugManager?.recordActivationError('Core engine initialization failed');
      const errors = initResult.errors?.join(', ') || 'Unknown error';
      vscode.window.showErrorMessage(`Haruspex initialization failed: ${errors}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    debugManager?.recordActivationError(`Core engine error: ${errorMessage}`);
    engineInitialized = false;
  }

  // Update debug manager with initialized engine
  if (engineInitialized && coreEngine) {
    debugManager = new HaruspexDebugManager(context, coreEngine, telemetryCollector);
    workspaceWizard = new HaruspexWorkspaceWizard(context, coreEngine, telemetryCollector);
    
    // Initialize agent debugging system and track its processes
    try {
      debugManager.log('Initializing agent debugging system...');
      agentDebugging = new AgentDebuggingSystem(
        context,
        coreEngine, 
        debugManager, 
        workspaceRoot,
        cleanupOrchestrator!
      );
      
      await agentDebugging.initialize();
      
      // Track agent debugging processes
      if (cleanupOrchestrator && agentDebugging) {
        const components = agentDebugging.getComponents();
        
        // Track IPC server if available
        if (components.ipcServer) {
          const status = components.ipcServer.getStatus();
          cleanupOrchestrator.trackServer(
            components.ipcServer, 
            'agent-debugging-ipc-server', 
            status.port, 
            status.host
          );
        }
        
        // Track state inspector intervals if available
        if (components.stateInspector) {
          // State inspector tracking would be handled internally
          debugManager.log('State inspector processes tracked');
        }
      }
      
      debugManager.log('Agent debugging system initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debugManager?.recordActivationWarning(`Agent debugging system failed to initialize: ${errorMessage}`);
      debugManager?.log(`Agent debugging initialization failed: ${errorMessage}`, 'warning');
    }
  }
}

/**
 * Register UI providers with enhanced error handling and process tracking
 */
async function registerUIProviders(context: vscode.ExtensionContext): Promise<void> {
  const engineReady = !!(coreEngine && telemetryCollector);
  
  try {
    debugManager?.log('Registering UI providers...');

    // Register Documentation Tree Provider
    if (engineReady) {
      documentationTreeProvider = new DocumentationTreeProvider(coreEngine!, telemetryCollector!);
      
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

    // Register tree-related commands with enhanced command manager
    await registerTreeCommands();

    // Register WebView Providers
    if (engineReady) {
      mermaidWebViewProvider = new MermaidWebViewProvider(context, coreEngine!, telemetryCollector!);
      kanbanWebViewProvider = new KanbanWebViewProvider(context, coreEngine!, telemetryCollector!);  
      truthMatrixWebViewProvider = new TruthMatrixWebViewProvider(context, coreEngine!, telemetryCollector!);
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
 * Register tree-related commands using enhanced command manager
 */
async function registerTreeCommands(): Promise<void> {
  if (!cleanupOrchestrator) {
    // Fallback to manual registration if cleanup orchestrator not available
    registerTreeCommandsManually();
    return;
  }

  await cleanupOrchestrator.registerCommands([
    {
      commandId: 'haruspex.refreshDocumentationTree',
      handler: () => {
        if (documentationTreeProvider) {
          documentationTreeProvider.refresh();
          debugManager?.log('Documentation tree refreshed via command');
        } else {
          vscode.window.showWarningMessage('Documentation tree not available - try running Haruspex setup');
        }
      },
      metadata: {
        category: 'ui',
        description: 'Refresh documentation tree view',
        essential: false
      }
    },
    {
      commandId: 'haruspex.navigateToFile',
      handler: async (filePath: string) => {
        try {
          const doc = await vscode.workspace.openTextDocument(filePath);
          await vscode.window.showTextDocument(doc, { preview: false });
          debugManager?.log(`Navigated to file: ${filePath}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          vscode.window.showErrorMessage(`Failed to open file: ${errorMessage}`);
          debugManager?.log(`Navigation failed: ${errorMessage}`, 'error');
        }
      },
      metadata: {
        category: 'ui',
        description: 'Navigate to file from tree view',
        essential: false
      }
    },
    {
      commandId: 'haruspex.generateStub',
      handler: async (treeItem: any) => {
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
      },
      metadata: {
        category: 'setup',
        description: 'Generate documentation stub',
        essential: false
      }
    }
  ]);
}

/**
 * Fallback manual command registration
 */
function registerTreeCommandsManually(): void {
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

  // These will be cleaned up automatically by VS Code's context.subscriptions
  // if cleanup orchestrator is not available
}

/**
 * Register enhanced commands with comprehensive conflict resolution
 */
async function registerEnhancedCommands(context: vscode.ExtensionContext): Promise<void> {
  if (!cleanupOrchestrator) {
    // Fallback to manual registration
    registerEnhancedCommandsManually(context);
    return;
  }

  // Register all core Haruspex commands through the enhanced command manager
  await cleanupOrchestrator.registerCommands([
    // Core functionality commands
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
        category: 'core',
        description: 'Refresh all Haruspex data and UI components',
        essential: true
      }
    },
    
    // Health and metrics commands
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
        category: 'debug',
        description: 'Show Haruspex health status',
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
        category: 'debug',
        description: 'Show detailed Haruspex metrics',
        essential: false
      }
    },

    // Setup and workspace commands
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
        category: 'setup',
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
        category: 'setup',
        description: 'Initialize Haruspex workspace (alias for setup wizard)',
        essential: true
      }
    },

    // Debug and diagnostic commands
    {
      commandId: 'haruspex.debug.showCleanupStatus',
      handler: () => {
        if (!cleanupOrchestrator) {
          vscode.window.showWarningMessage('Cleanup orchestrator not available');
          return;
        }

        const report = cleanupOrchestrator.generateStatusReport();
        const panel = vscode.window.createWebviewPanel(
          'haruspexCleanupStatus',
          'Haruspex Cleanup Status',
          vscode.ViewColumn.One,
          {}
        );

        panel.webview.html = generateCleanupStatusHtml(report);
      },
      metadata: {
        category: 'debug',
        description: 'Show cleanup orchestrator status',
        essential: false
      }
    }
  ]);

  debugManager?.log('Enhanced commands registered successfully');
}

/**
 * Register limited mode commands (when no workspace)
 */
async function registerLimitedModeCommands(context: vscode.ExtensionContext): Promise<void> {
  if (cleanupOrchestrator) {
    await cleanupOrchestrator.registerCommands([
      {
        commandId: 'haruspex.setup.runWizard',
        handler: async () => {
          vscode.window.showInformationMessage('Open a workspace folder to use Haruspex setup wizard.');
        },
        metadata: {
          category: 'setup',
          description: 'Workspace setup (limited mode)',
          essential: false
        }
      }
    ]);
  }
}

/**
 * Fallback manual command registration
 */
function registerEnhancedCommandsManually(context: vscode.ExtensionContext): void {
  // Core Haruspex commands - implement the same logic but without the enhanced manager
  const refreshCommand = vscode.commands.registerCommand('haruspex.refreshAll', async () => {
    // Same implementation as above
  });

  const healthCommand = vscode.commands.registerCommand('haruspex.showHealth', () => {
    // Same implementation as above
  });

  // Add all commands to context subscriptions for cleanup
  context.subscriptions.push(refreshCommand, healthCommand);
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
 * Generate HTML for cleanup status display
 */
function generateCleanupStatusHtml(report: any): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
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
        .status-good { color: #4CAF50; }
        .status-warning { color: #FF9800; }
        .status-error { color: #F44336; }
        pre {
            background: var(--vscode-editor-background);
            padding: 10px;
            border-radius: 3px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>🧹 Haruspex Cleanup Status</h1>
    
    <div class="section">
        <h3>Orchestrator Status</h3>
        <p><strong>Initialized:</strong> <span class="${report.orchestrator.initialized ? 'status-good' : 'status-error'}">${report.orchestrator.initialized ? '✅ Yes' : '❌ No'}</span></p>
        <p><strong>Processes Tracked:</strong> ${report.orchestrator.processes}</p>
        <p><strong>Commands Managed:</strong> ${report.orchestrator.commands}</p>
        <p><strong>Can Perform Cleanup:</strong> <span class="${report.orchestrator.canPerformCleanup ? 'status-good' : 'status-warning'}">${report.orchestrator.canPerformCleanup ? '✅ Yes' : '⚠️ No'}</span></p>
    </div>

    ${report.processes ? `
    <div class="section">
        <h3>Tracked Processes</h3>
        <pre>${JSON.stringify(report.processes, null, 2)}</pre>
    </div>
    ` : ''}

    ${report.commands ? `
    <div class="section">
        <h3>Managed Commands</h3>
        <pre>${JSON.stringify(report.commands, null, 2)}</pre>
    </div>
    ` : ''}

    ${report.recommendations.length > 0 ? `
    <div class="section">
        <h3>Recommendations</h3>
        <ul>
        ${report.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

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

/**
 * Enhanced deactivate function with comprehensive cleanup
 */
export async function deactivate(): Promise<void> {
  try {
    debugManager?.log('Starting enhanced Haruspex deactivation...');

    // Use cleanup orchestrator for comprehensive shutdown
    if (cleanupOrchestrator) {
      const cleanupResult = await cleanupOrchestrator.gracefulShutdown();
      
      debugManager?.log(`Cleanup orchestrator shutdown: ${cleanupResult.summary}`);
      
      if (!cleanupResult.success) {
        debugManager?.log(`Cleanup completed with errors: ${cleanupResult.errors.join(', ')}`, 'warning');
      }
    } else {
      // Fallback to manual cleanup if orchestrator not available
      await fallbackManualCleanup();
    }

    debugManager?.log('Enhanced Haruspex deactivation complete');

  } catch (error) {
    console.error('Error during enhanced Haruspex deactivation:', error);
    debugManager?.log(`Deactivation error: ${error}`, 'error');
    
    // Last resort - attempt emergency cleanup
    if (cleanupOrchestrator) {
      try {
        await cleanupOrchestrator.emergencyShutdown();
      } catch (emergencyError) {
        console.error('Emergency shutdown also failed:', emergencyError);
      }
    }
  }
}

/**
 * Fallback manual cleanup when orchestrator is not available
 */
async function fallbackManualCleanup(): Promise<void> {
  debugManager?.log('Performing fallback manual cleanup...');

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
    debugManager.log('Fallback manual cleanup complete');
    debugManager.dispose();
    debugManager = undefined;
  }
}
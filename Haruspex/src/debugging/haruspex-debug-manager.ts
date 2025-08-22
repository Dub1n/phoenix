/**---
 * title: [Haruspex Debug Manager - Comprehensive Diagnostics]
 * tags: [Debugging, Diagnostics, UX, Development, Logging]
 * provides: [HaruspexDebugManager, DebugInfo, DiagnosticReport]
 * requires: [Core Engine, Telemetry, VSCode APIs]
 * description: [Comprehensive debugging and diagnostic system for Haruspex extension development and user troubleshooting]
 * ---*/

import * as vscode from 'vscode';
import { HaruspexCoreEngine } from '../core/haruspex-core-engine';
import { TelemetryCollector } from '../core/telemetry-collector';

export interface DebugInfo {
  /** Extension activation status */
  activation: {
    activated: boolean;
    activationTime?: number;
    activationDuration?: number;
    errors: string[];
    warnings: string[];
  };
  
  /** Core engine status */
  engine: {
    initialized: boolean;
    initializationDuration?: number;
    compatibility?: {
      score: number;
      allCompatible: boolean;
      issues: string[];
    };
    health: 'healthy' | 'degraded' | 'critical';
    errors: string[];
  };
  
  /** Workspace analysis */
  workspace: {
    hasWorkspaceFolder: boolean;
    workspaceRoot?: string;
    fileCount: number;
    haruspexFiles: number;
    supportedFiles: number;
    patterns: string[];
  };
  
  /** UI providers status */
  providers: {
    documentationTree: {
      registered: boolean;
      dataLoaded: boolean;
      nodeCount: number;
      errors: string[];
    };
    webviews: {
      mermaid: WebViewStatus;
      kanban: WebViewStatus;
      truthMatrix: WebViewStatus;
    };
  };
  
  /** Performance metrics */
  performance: {
    memoryUsage: number;
    averageResponseTime: number;
    totalOperations: number;
    failureRate: number;
  };
}

interface WebViewStatus {
  registered: boolean;
  initialized: boolean;
  dataLoaded: boolean;
  lastRefresh?: number;
  errors: string[];
}

export interface DiagnosticReport {
  timestamp: number;
  debugInfo: DebugInfo;
  recommendations: DiagnosticRecommendation[];
  nextSteps: string[];
  isHealthy: boolean;
}

interface DiagnosticRecommendation {
  severity: 'info' | 'warning' | 'error';
  category: 'setup' | 'configuration' | 'performance' | 'data';
  title: string;
  description: string;
  actions: string[];
}

/**
 * Comprehensive debugging and diagnostic system for Haruspex
 * 
 * Provides:
 * - Real-time debug information collection
 * - Diagnostic report generation
 * - User-friendly troubleshooting guidance
 * - Developer debugging tools
 * - Performance monitoring
 */
export class HaruspexDebugManager {
  private debugOutput: vscode.OutputChannel;
  private activationTime: number = 0;
  private activationErrors: string[] = [];
  private activationWarnings: string[] = [];
  
  constructor(
    private context: vscode.ExtensionContext,
    private engine?: HaruspexCoreEngine,
    private telemetry?: TelemetryCollector
  ) {
    this.debugOutput = vscode.window.createOutputChannel('Haruspex Debug');
    this.context.subscriptions.push(this.debugOutput);
    
    // Register debug commands
    this.registerDebugCommands();
    
    this.log('Debug Manager initialized');
  }

  /**
   * Record extension activation start
   */
  recordActivationStart(): void {
    this.activationTime = Date.now();
    this.log('Extension activation started');
  }

  /**
   * Record activation success
   */
  recordActivationSuccess(duration: number): void {
    this.log(`Extension activated successfully in ${duration}ms`);
  }

  /**
   * Record activation error
   */
  recordActivationError(error: string): void {
    this.activationErrors.push(error);
    this.log(`Activation error: ${error}`, 'error');
  }

  /**
   * Record activation warning
   */
  recordActivationWarning(warning: string): void {
    this.activationWarnings.push(warning);
    this.log(`Activation warning: ${warning}`, 'warning');
  }

  /**
   * Collect comprehensive debug information
   */
  async collectDebugInfo(): Promise<DebugInfo> {
    const debugInfo: DebugInfo = {
      activation: {
        activated: this.activationTime > 0,
        ...(this.activationTime > 0 && { activationTime: this.activationTime }),
        ...(this.activationTime > 0 && { activationDuration: Date.now() - this.activationTime }),
        errors: [...this.activationErrors],
        warnings: [...this.activationWarnings]
      },
      
      engine: {
        initialized: false,
        health: 'critical',
        errors: []
      },
      
      workspace: {
        hasWorkspaceFolder: false,
        fileCount: 0,
        haruspexFiles: 0,
        supportedFiles: 0,
        patterns: []
      },
      
      providers: {
        documentationTree: {
          registered: false,
          dataLoaded: false,
          nodeCount: 0,
          errors: []
        },
        webviews: {
          mermaid: { registered: false, initialized: false, dataLoaded: false, errors: [] },
          kanban: { registered: false, initialized: false, dataLoaded: false, errors: [] },
          truthMatrix: { registered: false, initialized: false, dataLoaded: false, errors: [] }
        }
      },
      
      performance: {
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        averageResponseTime: 0,
        totalOperations: 0,
        failureRate: 0
      }
    };

    // Collect engine information
    if (this.engine) {
      try {
        const health = this.engine.getHealthStatus();
        const metrics = this.engine.getMetrics();
        
        debugInfo.engine = {
          initialized: true,
          health: health.overall,
          errors: [],
          initializationDuration: metrics.operations.responseTimes.length > 0 
            ? metrics.operations.responseTimes.reduce((a, b) => a + b, 0) / metrics.operations.responseTimes.length 
            : 0
        };
        
        debugInfo.performance = {
          memoryUsage: debugInfo.performance.memoryUsage,
          averageResponseTime: metrics.operations.responseTimes.length > 0 
            ? metrics.operations.responseTimes.reduce((a, b) => a + b, 0) / metrics.operations.responseTimes.length 
            : 0,
          totalOperations: metrics.operations.totalOperations,
          failureRate: 1 - (metrics.operations.successfulOperations / Math.max(1, metrics.operations.totalOperations))
        };
      } catch (error) {
        debugInfo.engine.errors.push(error instanceof Error ? error.message : 'Unknown engine error');
      }
    }

    // Collect workspace information
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      debugInfo.workspace.hasWorkspaceFolder = true;
      debugInfo.workspace.workspaceRoot = workspaceFolders[0].uri.fsPath;
      
      try {
        // Count files in workspace
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 1000);
        debugInfo.workspace.fileCount = files.length;
        
        // Count Haruspex-compatible files
        const supportedPatterns = ['**/*.{ts,tsx,js,jsx,md,json}'];
        const supportedFiles = await vscode.workspace.findFiles(supportedPatterns[0], '**/node_modules/**', 1000);
        debugInfo.workspace.supportedFiles = supportedFiles.length;
        debugInfo.workspace.patterns = supportedPatterns;
        
        // Count files with Haruspex stubs
        const mdFiles = await vscode.workspace.findFiles('**/*.md', '**/node_modules/**', 100);
        let haruspexFiles = 0;
        for (const file of mdFiles) {
          try {
            const content = await vscode.workspace.fs.readFile(file);
            const text = content.toString();
            if (text.includes('/**---') || text.includes('title:') || text.includes('provides:')) {
              haruspexFiles++;
            }
          } catch {
            // Ignore file read errors
          }
        }
        debugInfo.workspace.haruspexFiles = haruspexFiles;
        
      } catch (error) {
        this.log(`Error analyzing workspace: ${error}`, 'error');
        // Set safe defaults when workspace analysis fails
        debugInfo.workspace.fileCount = 0;
        debugInfo.workspace.supportedFiles = 0;
        debugInfo.workspace.haruspexFiles = 0;
      }
    } else {
      // No workspace folder - set safe defaults
      debugInfo.workspace.hasWorkspaceFolder = false;
      // Don't set workspaceRoot when there's no workspace - omit the property entirely
      debugInfo.workspace.fileCount = 0;
      debugInfo.workspace.supportedFiles = 0;
      debugInfo.workspace.haruspexFiles = 0;
      debugInfo.workspace.patterns = [];
    }

    return debugInfo;
  }

  /**
   * Generate comprehensive diagnostic report
   */
  async generateDiagnosticReport(): Promise<DiagnosticReport> {
    const debugInfo = await this.collectDebugInfo();
    const recommendations: DiagnosticRecommendation[] = [];
    const nextSteps: string[] = [];

    // Analyze and generate recommendations
    if (!debugInfo.activation.activated) {
      recommendations.push({
        severity: 'error',
        category: 'setup',
        title: 'Extension Not Activated',
        description: 'The Haruspex extension has not been activated properly.',
        actions: [
          'Check VSCode Developer Console for activation errors',
          'Restart VSCode',
          'Reinstall the extension'
        ]
      });
      nextSteps.push('Check activation status and resolve activation errors');
    }

    if (!debugInfo.workspace.hasWorkspaceFolder) {
      recommendations.push({
        severity: 'warning',
        category: 'setup',
        title: 'No Workspace Folder',
        description: 'Haruspex requires a workspace folder to function properly.',
        actions: [
          'Open a folder in VSCode (File → Open Folder)',
          'Create a new project folder'
        ]
      });
      nextSteps.push('Open a workspace folder');
    }

    if (debugInfo.workspace.haruspexFiles === 0 && debugInfo.workspace.supportedFiles > 0) {
      recommendations.push({
        severity: 'info',
        category: 'setup',
        title: 'Fresh Workspace Detected',
        description: 'This workspace doesn\'t have Haruspex documentation stubs yet.',
        actions: [
          'Run "Haruspex: Initialize Workspace" command',
          'Add documentation stubs to your files',
          'Check the Getting Started guide'
        ]
      });
      nextSteps.push('Initialize workspace with Haruspex documentation');
    }

    if (!debugInfo.engine.initialized) {
      recommendations.push({
        severity: 'error',
        category: 'configuration',
        title: 'Core Engine Not Initialized',
        description: 'The Haruspex core engine failed to initialize.',
        actions: [
          'Check the debug output for initialization errors',
          'Verify workspace permissions',
          'Check for conflicting extensions'
        ]
      });
      nextSteps.push('Resolve core engine initialization issues');
    }

    if (debugInfo.performance.failureRate > 0.1) {
      recommendations.push({
        severity: 'warning',
        category: 'performance',
        title: 'High Failure Rate',
        description: `${Math.round(debugInfo.performance.failureRate * 100)}% of operations are failing.`,
        actions: [
          'Check the debug output for error patterns',
          'Reduce workspace size if very large',
          'Update to latest extension version'
        ]
      });
      nextSteps.push('Investigate and resolve operation failures');
    }

    // Determine overall health
    const isHealthy = debugInfo.activation.activated && 
                     debugInfo.workspace.hasWorkspaceFolder && 
                     debugInfo.engine.initialized && 
                     debugInfo.performance.failureRate < 0.1;

    if (isHealthy && debugInfo.workspace.haruspexFiles === 0) {
      nextSteps.push('Add Haruspex documentation stubs to see content in the UI');
    }

    return {
      timestamp: Date.now(),
      debugInfo,
      recommendations,
      nextSteps,
      isHealthy
    };
  }

  /**
   * Show diagnostic report in user-friendly format
   */
  async showDiagnosticReport(): Promise<void> {
    const report = await this.generateDiagnosticReport();
    
    // Create HTML report
    const html = this.generateDiagnosticHtml(report);
    
    // Show in webview panel
    const panel = vscode.window.createWebviewPanel(
      'haruspexDiagnostics',
      'Haruspex Diagnostics',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    panel.webview.html = html;
  }

  /**
   * Register debug commands with improved duplicate handling for development
   */
  private registerDebugCommands(): void {
    const commands = [
      {
        id: 'haruspex.debug.showInfo',
        handler: async () => {
          await this.showDiagnosticReport();
        }
      },
      {
        id: 'haruspex.debug.showOutput',
        handler: () => {
          this.debugOutput.show();
        }
      },
      {
        id: 'haruspex.debug.clearOutput',
        handler: () => {
          this.debugOutput.clear();
          this.log('Debug output cleared');
        }
      },
      {
        id: 'haruspex.debug.exportReport',
        handler: async () => {
          const report = await this.generateDiagnosticReport();
          const json = JSON.stringify(report, null, 2);
          
          const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('haruspex-debug-report.json'),
            filters: { 'JSON': ['json'] }
          });
          
          if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(json));
            vscode.window.showInformationMessage(`Debug report saved to ${uri.fsPath}`);
          }
        }
      },
      {
        id: 'haruspex.debug.connect',
        handler: async () => {
          await this.connectDebugAgent();
        }
      },
      {
        id: 'haruspex.debug.disconnect',
        handler: async () => {
          await this.disconnectDebugAgent();
        }
      },
      {
        id: 'haruspex.debug.status',
        handler: async () => {
          await this.showConnectionStatus();
        }
      },
      {
        id: 'haruspex.debug.executeCommand',
        handler: async () => {
          await this.executeDebugCommand();
        }
      },
      {
        id: 'haruspex.debug.testConnection',
        handler: async () => {
          await this.testDebugConnection();
        }
      }
    ];

    // Register commands with improved duplicate handling for development hot-reload
    const registeredCommands: vscode.Disposable[] = [];
    let successCount = 0;
    let skipCount = 0;
    
    for (const cmd of commands) {
      try {
        const disposable = vscode.commands.registerCommand(cmd.id, cmd.handler);
        registeredCommands.push(disposable);
        successCount++;
        this.log(`Registered command: ${cmd.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Log all registration failures as warnings for proper debugging
        if (errorMessage.includes('already exists')) {
          skipCount++;
          this.log(`Command ${cmd.id} already registered - this indicates a cleanup issue: ${errorMessage}`, 'warning');
        } else {
          this.log(`Failed to register command ${cmd.id}: ${errorMessage}`, 'warning');
        }
      }
    }

    // Add successfully registered commands to subscriptions
    this.context.subscriptions.push(...registeredCommands);
    
    // Provide clear summary based on registration results
    if (skipCount > 0) {
      this.log(`Debug commands: ${successCount} registered, ${skipCount} already existed (development mode)`, 'info');
    } else {
      this.log(`Successfully registered ${successCount} debug commands`);
    }
  }

  /**
   * Log message to debug output with full error visibility for debugging
   */
  log(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = level.toUpperCase().padEnd(7);
    const logMessage = `[${timestamp}] ${prefix} ${message}`;
    
    // Always add to debug output channel
    this.debugOutput.appendLine(logMessage);
    
    // Show all errors/warnings for proper debugging visibility
    if (level === 'error') {
      console.error(`Haruspex: ${message}`);
    } else if (level === 'warning') {
      console.warn(`Haruspex: ${message}`);
    } else {
      console.log(`Haruspex: ${message}`);
    }
  }

  /**
   * Generate HTML for diagnostic report
   */
  private generateDiagnosticHtml(report: DiagnosticReport): string {
    const healthIcon = report.isHealthy ? '✅' : '⚠️';
    const healthColor = report.isHealthy ? '#28a745' : '#ffc107';
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Haruspex Diagnostics</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .health-icon {
            font-size: 2em;
            margin-right: 15px;
        }
        .health-status {
            color: ${healthColor};
            font-weight: bold;
            font-size: 1.2em;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background: var(--vscode-editor-inlayHint-background);
            border-radius: 8px;
            border: 1px solid var(--vscode-panel-border);
        }
        .section h2 {
            margin-top: 0;
            color: var(--vscode-foreground);
        }
        .recommendation {
            margin: 15px 0;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid;
        }
        .recommendation.error {
            background: var(--vscode-inputValidation-errorBackground);
            border-left-color: var(--vscode-inputValidation-errorBorder);
        }
        .recommendation.warning {
            background: var(--vscode-inputValidation-warningBackground);
            border-left-color: var(--vscode-inputValidation-warningBorder);
        }
        .recommendation.info {
            background: var(--vscode-inputValidation-infoBackground);
            border-left-color: var(--vscode-inputValidation-infoBorder);
        }
        .next-steps {
            list-style: none;
            padding: 0;
        }
        .next-steps li {
            padding: 10px;
            margin: 5px 0;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 4px;
            position: relative;
            padding-left: 40px;
        }
        .next-steps li:before {
            content: "→";
            position: absolute;
            left: 15px;
            font-weight: bold;
        }
        .debug-details {
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
            background: var(--vscode-textCodeBlock-background);
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
        }
        .metric {
            display: inline-block;
            margin: 5px 10px 5px 0;
            padding: 5px 10px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 3px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="health-icon">${healthIcon}</div>
        <div>
            <h1>Haruspex Diagnostics</h1>
            <div class="health-status">${report.isHealthy ? 'Healthy' : 'Issues Detected'}</div>
        </div>
    </div>

    <div class="section">
        <h2>System Status</h2>
        <div class="metric">Activation: ${report.debugInfo.activation.activated ? '✅ Success' : '❌ Failed'}</div>
        <div class="metric">Engine: ${report.debugInfo.engine.initialized ? '✅ Ready' : '❌ Failed'}</div>
        <div class="metric">Workspace: ${report.debugInfo.workspace.hasWorkspaceFolder ? '✅ Found' : '❌ Missing'}</div>
        <div class="metric">Files: ${report.debugInfo.workspace.supportedFiles} supported, ${report.debugInfo.workspace.haruspexFiles} with stubs</div>
        <div class="metric">Performance: ${Math.round((1 - report.debugInfo.performance.failureRate) * 100)}% success rate</div>
    </div>

    ${report.recommendations.length > 0 ? `
    <div class="section">
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation ${rec.severity}">
                <h3>${rec.title}</h3>
                <p>${rec.description}</p>
                <ul>
                    ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${report.nextSteps.length > 0 ? `
    <div class="section">
        <h2>Next Steps</h2>
        <ul class="next-steps">
            ${report.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    <div class="section">
        <h2>Debug Details</h2>
        <div class="debug-details">
            <pre>${JSON.stringify(report.debugInfo, null, 2)}</pre>
        </div>
    </div>

    <div style="text-align: center; margin-top: 30px; color: var(--vscode-descriptionForeground);">
        <p>Generated at ${new Date(report.timestamp).toLocaleString()}</p>
    </div>
</body>
</html>`;
  }

  // Phase 3: Real IPC command handlers

  /**
   * Connect debug agent - Phase 3 implementation with real IPC integration
   */
  private async connectDebugAgent(): Promise<void> {
    try {
      // Import IPC client dynamically to avoid circular dependencies
      const { HaruspexIPCClient } = await import('./ipc-client');
      
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showWarningMessage('No workspace folder open. Debug agent requires a workspace.');
        this.log('Connect debug agent failed: No workspace folder', 'error');
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const client = new HaruspexIPCClient(workspaceRoot);
      
      vscode.window.showInformationMessage('Connecting to debug agent...');
      this.log('Attempting to connect debug agent...');
      
      await client.connect({ timeout: 10000, retryAttempts: 3, retryDelay: 2000 });
      
      // Test the connection
      const connectionValid = await client.validateConnection();
      if (connectionValid) {
        const status = await client.getStatus();
        const message = `Debug agent connected successfully!\n\nConnection Details:
• Host: ${client.getConnectionInfo().host}
• Port: ${client.getConnectionInfo().port}
• Engine Status: ${status.health?.overall || 'unknown'}
• Extension Status: ${status.debugInfo?.activation?.activated ? 'Active' : 'Inactive'}`;

        vscode.window.showInformationMessage(message);
        this.log('Debug agent connection successful', 'info');
      } else {
        throw new Error('Connection validation failed');
      }
      
      // Clean up the client connection for this test
      await client.disconnect();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Failed to connect debug agent: ${errorMessage}`);
      this.log(`Debug agent connection failed: ${errorMessage}`, 'error');
    }
  }

  /**
   * Disconnect debug agent - Phase 3 implementation  
   */
  private async disconnectDebugAgent(): Promise<void> {
    try {
      vscode.window.showInformationMessage('Debug agent is stateless - each command creates a new connection. No persistent connection to disconnect.');
      this.log('Debug agent disconnect info: connections are per-command', 'info');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Debug agent disconnect error: ${errorMessage}`, 'error');
    }
  }

  /**
   * Show connection status - Phase 3 implementation with real IPC testing
   */
  private async showConnectionStatus(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showWarningMessage('No workspace folder open');
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const connectionInfoPath = `${workspaceRoot}/.haruspex/haruspex-debug-connection.json`;
    
    try {
      const fs = require('fs');
      
      if (!fs.existsSync(connectionInfoPath)) {
        vscode.window.showWarningMessage(
          'IPC server not running. Connection info file not found. ' +
          'Run "Haruspex: Start Agent Debugging" first.'
        );
        this.log('Connection status: Not running (no connection file)');
        return;
      }

      // Read connection file
      const content = fs.readFileSync(connectionInfoPath, 'utf8');
      const connectionInfo = JSON.parse(content);
      
      const age = Date.now() - connectionInfo.timestamp;
      const ageMinutes = Math.round(age / 1000 / 60);
      
      // Test actual connection using IPC client
      const { HaruspexIPCClient } = await import('./ipc-client');
      const client = new HaruspexIPCClient(workspaceRoot);
      
      let connectionStatus = 'Unknown';
      let serverHealth = 'Unknown';
      
      try {
        await client.connect({ timeout: 5000, retryAttempts: 1 });
        
        const testResult = await client.testConnection();
        const status = await client.getStatus();
        
        connectionStatus = testResult.connected && testResult.pingSuccess ? 'Connected ✅' : 'Connection Issues ⚠️';
        serverHealth = status.health?.overall || 'Unknown';
        
        await client.disconnect();
      } catch (error) {
        connectionStatus = 'Connection Failed ❌';
        this.log(`Connection test failed: ${error instanceof Error ? error.message : error}`, 'warning');
      }
      
      const statusMsg = `IPC Server Status:
• Host: ${connectionInfo.host}
• Port: ${connectionInfo.port}
• Connection: ${connectionStatus}
• Server Health: ${serverHealth}
• Age: ${ageMinutes} minutes
• Connection File: ${connectionInfoPath}`;

      vscode.window.showInformationMessage(statusMsg);
      this.log(`Connection status: ${connectionStatus} on ${connectionInfo.host}:${connectionInfo.port} (age: ${ageMinutes}min)`);
      
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to read connection status: ${error}`);
      this.log(`Connection status error: ${error}`, 'error');
    }
  }

  /**
   * Execute debug command interactively - Phase 3 implementation with real IPC integration
   */
  private async executeDebugCommand(): Promise<void> {
    const commands = [
      { label: 'status', description: 'Get comprehensive Haruspex status' },
      { label: 'health', description: 'Get health status and metrics' },
      { label: 'debug-info', description: 'Get comprehensive debug information' },
      { label: 'metrics', description: 'Get performance metrics' },
      { label: 'refresh', description: 'Refresh all Haruspex data' },
      { label: 'ping', description: 'Test connection to Haruspex extension' },
      { label: 'haruspex.refreshAll', description: 'Execute Haruspex refresh command' },
      { label: 'haruspex.getHealth', description: 'Execute Haruspex health command' },
      { label: 'haruspex.getMetrics', description: 'Execute Haruspex metrics command' }
    ];

    const selected = await vscode.window.showQuickPick(commands, {
      placeHolder: 'Select a debug command to execute',
      matchOnDescription: true
    });

    if (!selected) {
      return;
    }

    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showWarningMessage('No workspace folder open. Debug commands require a workspace.');
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const { HaruspexIPCClient } = await import('./ipc-client');
      const client = new HaruspexIPCClient(workspaceRoot);

      this.log(`Executing debug command: ${selected.label}`);
      vscode.window.showInformationMessage(`Executing command: ${selected.label}...`);

      await client.connect({ timeout: 10000, retryAttempts: 2 });

      let result: any;
      const startTime = Date.now();

      // Execute the appropriate command
      switch (selected.label) {
        case 'ping':
          result = await client.ping();
          break;
        case 'status':
          result = await client.getStatus();
          break;
        case 'health':
          result = await client.getHealth();
          break;
        case 'debug-info':
          result = await client.getDebugInfo();
          break;
        case 'metrics':
          result = await client.getMetrics();
          break;
        case 'refresh':
          result = await client.refreshData();
          break;
        case 'haruspex.refreshAll':
        case 'haruspex.getHealth':
        case 'haruspex.getMetrics':
          result = await client.executeCommand({
            command: selected.label,
            args: []
          });
          break;
        default:
          throw new Error(`Unknown command: ${selected.label}`);
      }

      const duration = Date.now() - startTime;
      await client.disconnect();

      // Display result
      this.showCommandResult(selected.label, result, duration);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Command execution failed: ${errorMessage}`);
      this.log(`Debug command failed: ${errorMessage}`, 'error');
    }
  }

  /**
   * Show command result in a user-friendly way
   */
  private showCommandResult(command: string, result: any, duration: number): void {
    try {
      // Create a new output channel for results to avoid cluttering debug output
      const resultOutput = vscode.window.createOutputChannel('Haruspex Command Results');
      
      const timestamp = new Date().toISOString();
      const header = `\n=== Command: ${command} ===\nExecuted at: ${timestamp}\nDuration: ${duration}ms\n\n`;
      
      resultOutput.appendLine(header);
      
      if (typeof result === 'object') {
        resultOutput.appendLine(JSON.stringify(result, null, 2));
      } else {
        resultOutput.appendLine(String(result));
      }
      
      resultOutput.appendLine('\n=== End Result ===\n');
      resultOutput.show();
      
      vscode.window.showInformationMessage(`Command '${command}' executed successfully in ${duration}ms. See output for details.`);
      this.log(`Command result displayed for: ${command} (${duration}ms)`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Failed to display command result: ${errorMessage}`);
      this.log(`Command result display failed: ${errorMessage}`, 'error');
    }
  }

  /**
   * Test debug connection with comprehensive diagnostics - Phase 3 implementation
   */
  private async testDebugConnection(): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showWarningMessage('No workspace folder open. Connection test requires a workspace.');
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const { HaruspexIPCClient } = await import('./ipc-client');
      const client = new HaruspexIPCClient(workspaceRoot);

      vscode.window.showInformationMessage('Running comprehensive connection test...');
      this.log('Starting connection test...');

      const testResult = await client.testConnection();
      
      // If not connected, try to connect first
      if (!testResult.connected) {
        this.log('Not connected. Attempting to connect first...');
        await client.connect({ timeout: 10000, retryAttempts: 2 });
        const retryResult = await client.testConnection();
        testResult.connected = retryResult.connected;
        testResult.pingSuccess = retryResult.pingSuccess;
        testResult.statusSuccess = retryResult.statusSuccess;
        testResult.healthSuccess = retryResult.healthSuccess;
      }

      await client.disconnect();

      // Display comprehensive results
      const allTestsPassed = testResult.connected && testResult.pingSuccess && 
                           testResult.statusSuccess && testResult.healthSuccess;

      const resultMessage = `Connection Test Results:
• Connected: ${testResult.connected ? '✅' : '❌'}
• Ping Test: ${testResult.pingSuccess ? '✅' : '❌'}
• Status Test: ${testResult.statusSuccess ? '✅' : '❌'}
• Health Test: ${testResult.healthSuccess ? '✅' : '❌'}

Overall: ${allTestsPassed ? 'All tests passed! ✅' : 'Some tests failed ⚠️'}

${testResult.errors.length > 0 ? 'Errors:\n' + testResult.errors.map(e => `• ${e}`).join('\n') : ''}`;

      if (allTestsPassed) {
        vscode.window.showInformationMessage(resultMessage);
        this.log('Connection test completed successfully - all tests passed');
      } else {
        vscode.window.showWarningMessage(resultMessage);
        this.log('Connection test completed with issues', 'warning');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Connection test failed: ${errorMessage}`);
      this.log(`Connection test failed: ${errorMessage}`, 'error');
    }
  }

  /**
   * Dispose debug manager resources
   */
  dispose(): void {
    this.debugOutput.dispose();
  }
}

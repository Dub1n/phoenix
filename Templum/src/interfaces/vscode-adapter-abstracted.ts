/**---
 * title: [VSCode Interface Adapter - Abstraction Layer Implementation]
 * tags: [Interface, Adapter, VSCode, Abstraction]
 * provides: [VSCodeInterfaceAdapter, Abstracted WebView Integration]
 * requires: [ITemplumOrchestrator, VSCode API, Universal Types]
 * description: [Abstracted VSCode interface adapter that depends on ITemplumOrchestrator interface, not concrete TemplumCore]
 * ---*/

import * as vscode from 'vscode';
import { 
  ErrorSignalPayload, 
  createTemplumError, 
  isTemplumError,
  InterfaceType,
  UniversalSkinDefinition,
  StateUpdate,
  InterfaceAdapterStatus
} from '../types/templum-types';
import { 
  ITemplumOrchestrator, 
  IInterfaceAdapter 
} from './templum-orchestrator-interface';
import { createLogger, LogLevel } from '../utils/logger';
import { withTimeout } from '../utils/async-utils';
import type { TemplumSessionManagerContract } from '../session/universal-session-manager.types';

/**
 * Abstracted VSCode Interface Adapter
 * 
 * This adapter uses the ITemplumOrchestrator abstraction instead of directly coupling
 * to the concrete TemplumCore implementation, providing proper separation of concerns
 * and enabling dependency inversion.
 */
export class VSCodeInterfaceAdapter implements IInterfaceAdapter {
  private view?: vscode.WebviewView;
  private orchestrator!: ITemplumOrchestrator;
  private readonly logger = createLogger('vscode-interface-adapter', { level: LogLevel.ERROR });
  private sessionManager?: TemplumSessionManagerContract;
  private webviewReady = false;
  private pendingMessages: Array<{
    message: unknown;
    resolve: () => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor(
    private readonly context: vscode.ExtensionContext
  ) {}

  /**
   * Initialize with orchestrator abstraction
   */
  async initialize(orchestrator: ITemplumOrchestrator): Promise<void> {
    this.orchestrator = orchestrator;
    if (this.orchestrator.getSessionManager) {
      try {
        this.sessionManager = this.orchestrator.getSessionManager();
        await this.sessionManager.ensureSessionForInterface('vscode');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn('VSCodeInterfaceAdapter: Failed to ensure session', { errorMessage });
      }
    }
    
    // Register this adapter with the orchestrator
    await this.orchestrator.registerInterface('vscode', this);
    
    this.logger.info('VSCodeInterfaceAdapter: Initialized with orchestrator abstraction');
  }

  getInterfaceType(): InterfaceType {
    return 'vscode';
  }

  supportsSkin(skinDefinition: UniversalSkinDefinition): boolean {
    // Check if this skin is compatible with VSCode interface
    return skinDefinition.metadata.compatibleInterfaces.includes('vscode');
  }

  /**
   * Resolve WebView with abstraction layer integration
   */
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    const startTime = Date.now();
    
    try {
      this.rejectPendingMessages(new Error('Webview reinitialized'));
      this.webviewReady = false;
      this.view = webviewView;
      
      // Configure webview options
      const webviewOptions: vscode.WebviewOptions = {
        enableScripts: true,
        ...(this.context.extensionUri && { localResourceRoots: [this.context.extensionUri] })
      };
      
      this.view.webview.options = webviewOptions;

      // Set up message handling
      this.setupMessageHandling();
      
      // Load initial content using orchestrator abstraction
      void this.loadInitialContent();
      
      const initTime = Date.now() - startTime;
      this.logger.info(`VSCodeInterfaceAdapter: WebView resolved in ${initTime}ms using abstraction layer`);
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'VSCodeInterfaceAdapter',
        error: createTemplumError(errorMessage, 'WEBVIEW_INITIALIZATION_ERROR', 'runtime'),
        severity: 'high'
      };
      
      this.logger.error('VSCodeInterfaceAdapter: WebView initialization failed', errorPayload.error);
    }
  }

  /**
   * Apply skin definition using orchestrator abstraction
   */
  async applySkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    if (!this.view || !this.orchestrator.isInitialized()) {
      this.logger.warn('VSCodeInterfaceAdapter: Cannot apply skin - adapter or orchestrator not ready');
      return;
    }

    try {
      // Use orchestrator's skin engine through abstraction
      const skinEngine = this.orchestrator.getUniversalSkinEngine();
      
      // Render skin for VSCode interface
      if (!skinEngine?.renderForInterface) {
        this.logger.warn('VSCodeInterfaceAdapter: Skin engine does not implement renderForInterface');
        return;
      }

      const renderResult = await skinEngine.renderForInterface(
        skinDefinition,
        'vscode',
        { webview: true, context: this.context }
      );

      const renderedHTML = renderResult.renderedContent?.html ??
        (skinEngine.generateSkinHTML ? skinEngine.generateSkinHTML(renderResult, skinDefinition) : '');

      if (!renderedHTML) {
        this.logger.warn('VSCodeInterfaceAdapter: Render result did not include HTML content');
      }

      // Update webview content
      await this.postToWebview({
        type: 'render_skin',
        payload: {
          renderResult,
          html: renderedHTML,
          skinId: skinDefinition.metadata.id,
          timestamp: Date.now()
        }
      });

      this.logger.info(`VSCodeInterfaceAdapter: Applied skin ${skinDefinition.metadata.name} via orchestrator abstraction`);
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      this.logger.error('VSCodeInterfaceAdapter: Failed to apply skin', undefined, { errorMessage });
    }
  }

  /**
   * Execute command using orchestrator abstraction
   */
  async executeCommand(command: string, args: any[] = []): Promise<any> {
    if (!this.orchestrator.isInitialized()) {
      throw createTemplumError('Orchestrator not initialized', 'SERVICE_NOT_READY', 'configuration');
    }

    try {
      // Execute command through orchestrator abstraction
      const result = await this.orchestrator.executeCommand(
        command,
        'vscode',
        args,
        { source: 'VSCodeInterfaceAdapter', timestamp: Date.now() }
      );

      this.logger.info(`VSCodeInterfaceAdapter: Executed command '${command}' via orchestrator abstraction`);
      return result;
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      throw createTemplumError(`Command execution failed: ${errorMessage}`, 'COMMAND_EXECUTION_ERROR', 'runtime');
    }
  }

  async dispose(): Promise<void> {
    try {
      // Clean up resources
      if (this.view) {
        // Clear webview content
        this.view.webview.html = '';
        this.view = undefined;
      }
      this.rejectPendingMessages(new Error('VSCode WebView disposed'));
      this.webviewReady = false;
      
      this.logger.info('VSCodeInterfaceAdapter: Disposed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('VSCodeInterfaceAdapter disposal error', undefined, { errorMessage });
    }
  }

  /**
   * Load initial content using orchestrator abstraction with enhanced real backend integration
   * @private
   */
  private async loadInitialContent(): Promise<void> {
    if (!this.view || !this.orchestrator.isInitialized()) {
      return;
    }

    try {
      // Enhanced real backend service integration
      this.logger.info('VSCodeInterfaceAdapter: Loading initial content with real backend integration...');
      
      // Get system status with real backend connection information
      const systemStatus = this.orchestrator.getSystemStatus();
      const backendConnections = systemStatus.coreEngine.backendConnections;

      // Consume any orchestrator preloaded skins first to avoid hardcoded fallbacks
      const preloadedSkins =
        typeof this.orchestrator.getLoadedSkins === 'function'
          ? this.orchestrator
              .getLoadedSkins()
              .filter((skin) => skin?.metadata?.compatibleInterfaces?.includes('vscode'))
          : [];

      let skinLoaded = false;

      for (const skin of preloadedSkins) {
        try {
          this.logger.info('VSCodeInterfaceAdapter: Rendering preloaded skin', {
            skinId: skin.metadata?.id ?? skin.id,
            skinName: skin.metadata?.name ?? skin.name,
          });
          await this.applySkin(skin);
          skinLoaded = true;
          break;
        } catch (preloadedError) {
          const message = preloadedError instanceof Error ? preloadedError.message : String(preloadedError);
          this.logger.warn('VSCodeInterfaceAdapter: Preloaded skin render failed', {
            skinId: skin.metadata?.id ?? skin.id,
            error: message,
          });
        }
      }

      // Prioritize backends by health and capabilities for real integration
      const healthyBackends = Object.entries(backendConnections.backends)
        .filter(([_, status]) => status.connected && status.health === 'healthy')
        .sort((a, b) => {
          // Prioritize by response time and capabilities
          const aTime = a[1].responseTime || 1000;
          const bTime = b[1].responseTime || 1000;
          const aCaps = a[1].capabilities?.length || 0;
          const bCaps = b[1].capabilities?.length || 0;
          return (aTime - bTime) + (bCaps - aCaps) * 10; // Favor more capabilities
        });

      this.logger.info(`VSCodeInterfaceAdapter: Found ${healthyBackends.length} healthy backend(s) for real integration`);

      // Attempt to load real skin from healthy backends with proper error handling
      for (const [backendId, status] of healthyBackends) {
        if (skinLoaded) {
          break;
        }
        try {
          this.logger.info(`VSCodeInterfaceAdapter: Attempting to load real skin from ${backendId} backend...`);
          
          // Load real skin definition with timeout handling
          const skinDefinition = await withTimeout(
            Promise.resolve(this.orchestrator.loadBackendSkin(backendId)),
            5000,
            new Error('Skin loading timeout')
          );
          
          if (skinDefinition) {
            this.logger.info(`VSCodeInterfaceAdapter: Successfully loaded real skin from ${backendId}`);
            await this.applySkin(skinDefinition);
            skinLoaded = true;
            
            // Update webview with backend status information
            await this.postToWebview({
              type: 'backend_status',
              payload: {
                connectedBackend: backendId,
                capabilities: status.capabilities,
                health: status.health,
                responseTime: status.responseTime,
                timestamp: Date.now()
              }
            });
            break;
          }
        } catch (error) {
          this.logger.warn(`VSCodeInterfaceAdapter: Failed to load skin from ${backendId}`, error);
          // Continue to next backend
        }
      }

      // Enhanced fallback with real backend discovery attempts
      if (!skinLoaded) {
        this.logger.info('VSCodeInterfaceAdapter: No real skins loaded, checking for backend discovery...');
        
        // Trigger backend discovery if no healthy backends found
        if (healthyBackends.length === 0) {
          this.logger.info('VSCodeInterfaceAdapter: No healthy backends found, triggering discovery...');
          try {
            // Attempt to trigger backend discovery through orchestrator
            const backendRouter = this.orchestrator.getBackendRouter();
            if (backendRouter && typeof backendRouter.discoverAndConnect === 'function') {
              await backendRouter.discoverAndConnect();
              this.logger.info('VSCodeInterfaceAdapter: Backend discovery triggered, retrying skin load...');
              
              // Retry with newly discovered backends
              const updatedStatus = this.orchestrator.getSystemStatus();
              const newBackends = Object.entries(updatedStatus.coreEngine.backendConnections.backends)
                .filter(([_, status]) => status.connected);
              
              if (newBackends.length > 0) {
                const [backendId] = newBackends[0];
                const retryedSkin = await this.orchestrator.loadBackendSkin(backendId);
                if (retryedSkin) {
                  await this.applySkin(retryedSkin);
                  skinLoaded = true;
                  this.logger.info(`VSCodeInterfaceAdapter: Successfully loaded skin after discovery from ${backendId}`);
                }
              }
            }
          } catch (discoveryError) {
            this.logger.warn('VSCodeInterfaceAdapter: Backend discovery failed', discoveryError);
          }
        }
        
        // Load enhanced fallback HTML with backend status
        if (!skinLoaded) {
          this.view.webview.html = this.getEnhancedFallbackHTML(backendConnections);
          this.logger.info('VSCodeInterfaceAdapter: Loaded enhanced fallback HTML with backend status information');
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('VSCodeInterfaceAdapter: Failed to load initial content', undefined, { errorMessage });
      
      // Enhanced error HTML with debugging information
      this.view!.webview.html = this.getEnhancedErrorHTML(errorMessage);
    }
  }

  /**
   * Set up message handling between webview and extension
   * @private
   */
  private setupMessageHandling(): void {
    if (!this.view) return;

    this.view.webview.onDidReceiveMessage(async (message) => {
      try {
        switch (message.type) {
          case 'templum:webview_ready':
            this.webviewReady = true;
            await this.flushPendingMessages();
            break;
          case 'execute_command':
            await this.executeCommand(message.command, message.args);
            break;
          case 'load_backend_skin':
            const skin = await this.orchestrator.loadBackendSkin(message.backendId);
            if (skin) {
              await this.applySkin(skin);
            }
            break;
          case 'get_system_status':
            const status = this.orchestrator.getSystemStatus();
            await this.postToWebview({
              type: 'system_status',
              payload: status
            });
            break;
          case 'retry_backend_connection':
            this.logger.info('VSCodeInterfaceAdapter: Retrying backend connections...');
            try {
              const backendRouter = this.orchestrator.getBackendRouter();
              if (backendRouter && typeof backendRouter.discoverAndConnect === 'function') {
                await backendRouter.discoverAndConnect();
                // Reload content after connection retry
                await this.loadInitialContent();
                await this.postToWebview({
                  type: 'retry_complete',
                  payload: { success: true, timestamp: Date.now() }
                });
              }
            } catch (error) {
              this.logger.error('VSCodeInterfaceAdapter: Backend connection retry failed', error instanceof Error ? error : undefined, error);
              await this.postToWebview({
                type: 'retry_complete',
                payload: { 
                  success: false, 
                  error: error instanceof Error ? error.message : 'Unknown error',
                  timestamp: Date.now() 
                }
              });
            }
            break;
          default:
            this.logger.warn(`VSCodeInterfaceAdapter: Unknown message type: ${message.type}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error('VSCodeInterfaceAdapter: Message handling error', undefined, { errorMessage });
        
        await this.postToWebview({
          type: 'error',
          payload: { error: errorMessage, timestamp: Date.now() }
        });
      }
    });
  }

  private async postToWebview(message: unknown): Promise<void> {
    if (!this.view) {
      return;
    }

    if (this.webviewReady) {
      await this.view.webview.postMessage(message);
      return;
    }

    try {
      await this.view.webview.postMessage(message);
    } catch (error) {
      await new Promise<void>((resolve, reject) => {
        this.pendingMessages.push({ message, resolve, reject });
      });
    }
  }

  private async flushPendingMessages(): Promise<void> {
    if (!this.view || this.pendingMessages.length === 0) {
      return;
    }

    const queue = [...this.pendingMessages];
    this.pendingMessages.length = 0;

    for (const entry of queue) {
      try {
        await this.view.webview.postMessage(entry.message);
        entry.resolve();
      } catch (error) {
        entry.reject(error);
      }
    }
  }

  private rejectPendingMessages(error: unknown): void {
    if (this.pendingMessages.length === 0) {
      return;
    }

    const queue = [...this.pendingMessages];
    this.pendingMessages.length = 0;
    queue.forEach((entry) => entry.reject(error));
  }

  /**
   * Get fallback HTML for initial content
   * @private
   */
  private getFallbackHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Templum Universal Interface</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .templum-container { padding: 20px; border: 1px solid #ccc; }
          .status-indicator { color: green; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="templum-container">
          <h2>🌟 Templum Universal Interface</h2>
          <p class="status-indicator">✅ VSCode Interface Adapter Active (Abstraction Layer)</p>
          <p>Waiting for backend skin definitions...</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get enhanced fallback HTML with backend status information
   * @private
   */
  private getEnhancedFallbackHTML(backendConnections: any): string {
    const connectedCount = Object.values(backendConnections.backends).filter((b: any) => b.connected).length;
    const totalCount = Object.keys(backendConnections.backends).length;
    const healthyCount = Object.values(backendConnections.backends).filter((b: any) => b.health === 'healthy').length;
    
    const backendStatusHtml = Object.entries(backendConnections.backends).map(([id, status]: [string, any]) => `
      <tr>
        <td>${id}</td>
        <td>${status.connected ? '🟢 Connected' : '🔴 Disconnected'}</td>
        <td>${status.health || 'Unknown'}</td>
        <td>${status.responseTime ? `${status.responseTime}ms` : 'N/A'}</td>
        <td>${status.capabilities?.join(', ') || 'None detected'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Templum Universal Interface</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
          .templum-container { padding: 20px; border: 1px solid #ddd; background: white; border-radius: 8px; }
          .status-indicator { color: green; font-weight: bold; margin: 10px 0; }
          .backend-status { margin: 20px 0; }
          .backend-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .backend-table th, .backend-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          .backend-table th { background-color: #f2f2f2; }
          .stats { display: flex; gap: 20px; margin: 10px 0; }
          .stat { padding: 10px; background: #e9ecef; border-radius: 4px; }
          .connection-actions { margin: 15px 0; }
          .connection-actions button { padding: 8px 16px; margin-right: 10px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="templum-container">
          <h2>🌟 Templum Universal Interface</h2>
          <p class="status-indicator">✅ VSCode Interface Adapter Active (Real Backend Integration)</p>
          
          <div class="stats">
            <div class="stat">
              <strong>Connected:</strong> ${connectedCount}/${totalCount} backends
            </div>
            <div class="stat">
              <strong>Healthy:</strong> ${healthyCount}/${connectedCount} connected
            </div>
            <div class="stat">
              <strong>Status:</strong> ${healthyCount > 0 ? 'Operational' : 'Discovery Mode'}
            </div>
          </div>
          
          <div class="backend-status">
            <h3>Backend Service Status</h3>
            <table class="backend-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Connection</th>
                  <th>Health</th>
                  <th>Response Time</th>
                  <th>Capabilities</th>
                </tr>
              </thead>
              <tbody>
                ${backendStatusHtml}
              </tbody>
            </table>
          </div>
          
          <div class="connection-actions">
            <button onclick="retryConnection()">🔄 Retry Connection</button>
            <button onclick="refreshStatus()">📊 Refresh Status</button>
          </div>
          
          <p><small>Real backend integration active. ${healthyCount === 0 ? 'Waiting for backend services to become available...' : 'Ready for skin loading from connected backends.'}</small></p>
        </div>
        
        <script>
          function retryConnection() {
            vscode.postMessage({ type: 'retry_backend_connection' });
          }
          
          function refreshStatus() {
            vscode.postMessage({ type: 'get_system_status' });
          }
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Get enhanced error HTML with debugging information
   * @private
   */
  private getEnhancedErrorHTML(error: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Templum - Integration Error</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
          .error-container { padding: 20px; border: 2px solid #dc3545; background: #f8d7da; border-radius: 8px; }
          .error-details { margin: 15px 0; padding: 10px; background: #fff; border-left: 4px solid #dc3545; }
          .troubleshooting { margin: 15px 0; padding: 15px; background: #d1ecf1; border: 1px solid #b8daff; border-radius: 4px; }
          .troubleshooting h4 { margin-top: 0; color: #004085; }
          .troubleshooting ul { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h2>❌ VSCode Interface Adapter - Real Backend Integration Error</h2>
          <div class="error-details">
            <strong>Error Details:</strong>
            <p>${error}</p>
            <p><small>Timestamp: ${new Date().toISOString()}</small></p>
          </div>
          
          <div class="troubleshooting">
            <h4>🔧 Troubleshooting Real Backend Integration</h4>
            <ul>
              <li><strong>Backend Services:</strong> Ensure Haruspex, PCL, or Litany services are running</li>
              <li><strong>Network:</strong> Check if backend services are accessible on their configured ports</li>
              <li><strong>Configuration:</strong> Verify backend endpoint configuration in Templum config</li>
              <li><strong>Discovery:</strong> Backend service discovery may be in progress</li>
              <li><strong>Fallback:</strong> System will use Universal Skin Engine for fallback rendering</li>
            </ul>
          </div>
          
          <p><small>Using abstraction layer with real backend integration. This error indicates a problem with connecting to or loading content from real backend services.</small></p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get error HTML for display (legacy method maintained for compatibility)
   * @private
   */
  private getErrorHTML(error: string): string {
    return this.getEnhancedErrorHTML(error);
  }

  /**
   * Synchronize state update from orchestrator
   * Sends state updates to the VSCode webview via postMessage
   */
  async syncState(stateUpdate: StateUpdate): Promise<void> {
    try {
      // Update webview state if view is available
      if (this.view) {
        await this.postToWebview({
          type: 'state-update',
          payload: stateUpdate
        });
      }
      this.logger.info('VSCodeInterfaceAdapter: State synchronized', stateUpdate);
    } catch (error) {
      this.logger.error('VSCodeInterfaceAdapter: Failed to sync state', error instanceof Error ? error : undefined, error);
      throw createTemplumError(`Failed to synchronize state: ${error instanceof Error ? error.message : 'Unknown error'}`, 'STATE_SYNC_FAILED', 'runtime');
    }
  }

  /**
   * Get current adapter status
   * Returns comprehensive status including webview and orchestrator connection state
   */
  getStatus(): InterfaceAdapterStatus {
    return {
      active: !!this.view && !!this.orchestrator,
      webviewReady: !!this.view?.webview,
      orchestratorConnected: !!this.orchestrator,
      lastActivity: Date.now()
    };
  }
}

/**
 * Factory function for creating VSCode interface adapter
 * 
 * This provides a clean creation pattern that doesn't require direct imports
 * of the concrete adapter class in other parts of the system.
 */
export function createVSCodeInterfaceAdapter(context: vscode.ExtensionContext): IInterfaceAdapter {
  return new VSCodeInterfaceAdapter(context);
}

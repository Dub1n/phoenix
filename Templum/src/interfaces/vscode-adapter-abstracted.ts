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
  MetricsSignalPayload,
  createTemplumError, 
  isTemplumError,
  InterfaceType
} from '../types/templum-types';
import { UniversalSkinDefinition } from '../types/universal-skin-engine-types';
import { 
  ITemplumOrchestrator, 
  IInterfaceAdapter 
} from './templum-orchestrator-interface';

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

  constructor(
    private readonly context: vscode.ExtensionContext
  ) {}

  /**
   * Initialize with orchestrator abstraction
   */
  async initialize(orchestrator: ITemplumOrchestrator): Promise<void> {
    this.orchestrator = orchestrator;
    
    // Register this adapter with the orchestrator
    await this.orchestrator.registerInterface('vscode', this);
    
    console.log('VSCodeInterfaceAdapter: Initialized with orchestrator abstraction');
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
      this.loadInitialContent();
      
      const initTime = Date.now() - startTime;
      console.log(`VSCodeInterfaceAdapter: WebView resolved in ${initTime}ms using abstraction layer`);
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'VSCodeInterfaceAdapter',
        error: createTemplumError(errorMessage, 'WEBVIEW_INITIALIZATION_ERROR', 'runtime'),
        severity: 'high'
      };
      
      console.error('VSCodeInterfaceAdapter: WebView initialization failed:', errorPayload.error);
    }
  }

  /**
   * Apply skin definition using orchestrator abstraction
   */
  async applySkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    if (!this.view || !this.orchestrator.isInitialized()) {
      console.warn('VSCodeInterfaceAdapter: Cannot apply skin - adapter or orchestrator not ready');
      return;
    }

    try {
      // Use orchestrator's skin engine through abstraction
      const skinEngine = this.orchestrator.getUniversalSkinEngine();
      
      // Render skin for VSCode interface
      if (skinEngine.renderForInterface) {
        const renderResult = await skinEngine.renderForInterface(
          skinDefinition, 
          'vscode', 
          { webview: true, context: this.context }
        );

        // Generate HTML using skin engine abstraction
        let renderedHTML = '';
        if (skinEngine.generateSkinHTML) {
          renderedHTML = skinEngine.generateSkinHTML(renderResult, skinDefinition);
        } else {
          // Fallback rendering if skin engine doesn't provide HTML generation
          renderedHTML = this.generateFallbackHTML(renderResult, skinDefinition);
        }

        // Update webview content
        await this.view.webview.postMessage({
          type: 'render_skin',
          payload: { 
            renderResult, 
            html: renderedHTML,
            skinId: skinDefinition.metadata.id,
            timestamp: Date.now()
          }
        });

        console.log(`VSCodeInterfaceAdapter: Applied skin ${skinDefinition.metadata.name} via orchestrator abstraction`);
      }
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      console.error(`VSCodeInterfaceAdapter: Failed to apply skin: ${errorMessage}`);
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

      console.log(`VSCodeInterfaceAdapter: Executed command '${command}' via orchestrator abstraction`);
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
      
      console.log('VSCodeInterfaceAdapter: Disposed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('VSCodeInterfaceAdapter disposal error:', errorMessage);
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
      console.log('VSCodeInterfaceAdapter: Loading initial content with real backend integration...');
      
      // Get system status with real backend connection information
      const systemStatus = this.orchestrator.getSystemStatus();
      const backendConnections = systemStatus.coreEngine.backendConnections;
      
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

      console.log(`VSCodeInterfaceAdapter: Found ${healthyBackends.length} healthy backend(s) for real integration`);

      // Attempt to load real skin from healthy backends with proper error handling
      let skinLoaded = false;
      for (const [backendId, status] of healthyBackends) {
        try {
          console.log(`VSCodeInterfaceAdapter: Attempting to load real skin from ${backendId} backend...`);
          
          // Load real skin definition with timeout handling
          const skinDefinition = await Promise.race([
            this.orchestrator.loadBackendSkin(backendId),
            new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Skin loading timeout')), 5000)
            )
          ]);
          
          if (skinDefinition) {
            console.log(`VSCodeInterfaceAdapter: Successfully loaded real skin from ${backendId}`);
            await this.applySkin(skinDefinition);
            skinLoaded = true;
            
            // Update webview with backend status information
            await this.view.webview.postMessage({
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
          console.warn(`VSCodeInterfaceAdapter: Failed to load skin from ${backendId}:`, error);
          // Continue to next backend
        }
      }

      // Enhanced fallback with real backend discovery attempts
      if (!skinLoaded) {
        console.log('VSCodeInterfaceAdapter: No real skins loaded, checking for backend discovery...');
        
        // Trigger backend discovery if no healthy backends found
        if (healthyBackends.length === 0) {
          console.log('VSCodeInterfaceAdapter: No healthy backends found, triggering discovery...');
          try {
            // Attempt to trigger backend discovery through orchestrator
            const backendRouter = this.orchestrator.getBackendRouter();
            if (backendRouter && typeof backendRouter.discoverAndConnect === 'function') {
              await backendRouter.discoverAndConnect();
              console.log('VSCodeInterfaceAdapter: Backend discovery triggered, retrying skin load...');
              
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
                  console.log(`VSCodeInterfaceAdapter: Successfully loaded skin after discovery from ${backendId}`);
                }
              }
            }
          } catch (discoveryError) {
            console.warn('VSCodeInterfaceAdapter: Backend discovery failed:', discoveryError);
          }
        }
        
        // Load enhanced fallback HTML with backend status
        if (!skinLoaded) {
          this.view.webview.html = this.getEnhancedFallbackHTML(backendConnections);
          console.log('VSCodeInterfaceAdapter: Loaded enhanced fallback HTML with backend status information');
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('VSCodeInterfaceAdapter: Failed to load initial content:', errorMessage);
      
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
            await this.view!.webview.postMessage({
              type: 'system_status',
              payload: status
            });
            break;
          case 'retry_backend_connection':
            console.log('VSCodeInterfaceAdapter: Retrying backend connections...');
            try {
              const backendRouter = this.orchestrator.getBackendRouter();
              if (backendRouter && typeof backendRouter.discoverAndConnect === 'function') {
                await backendRouter.discoverAndConnect();
                // Reload content after connection retry
                await this.loadInitialContent();
                await this.view!.webview.postMessage({
                  type: 'retry_complete',
                  payload: { success: true, timestamp: Date.now() }
                });
              }
            } catch (error) {
              console.error('VSCodeInterfaceAdapter: Backend connection retry failed:', error);
              await this.view!.webview.postMessage({
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
            console.warn(`VSCodeInterfaceAdapter: Unknown message type: ${message.type}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('VSCodeInterfaceAdapter: Message handling error:', errorMessage);
        
        await this.view!.webview.postMessage({
          type: 'error',
          payload: { error: errorMessage, timestamp: Date.now() }
        });
      }
    });
  }

  /**
   * Generate fallback HTML when skin engine doesn't provide HTML generation
   * @private
   */
  private generateFallbackHTML(renderResult: any, skinDefinition: UniversalSkinDefinition): string {
    const skinId = skinDefinition.metadata.id;
    const skinName = skinDefinition.metadata.name;
    const timestamp = Date.now();
    
    return `
      <div class="templum-skin-container" data-skin-id="${skinId}">
        <div class="templum-header">
          <h2>${skinName}</h2>
          <p>Loaded via VSCode Interface Adapter (Abstraction Layer)</p>
        </div>
        <div class="templum-content">
          ${renderResult ? JSON.stringify(renderResult, null, 2) : 'No render result available'}
        </div>
        <div class="templum-footer">
          <small>Timestamp: ${timestamp}</small>
        </div>
      </div>
    `;
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
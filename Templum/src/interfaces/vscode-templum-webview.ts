/**
 * @fileoverview Templum Universal WebView Provider - VSCode Integration
 * @author Claude Code Implementation  
 * @created 2025-08-23
 * 
 * Universal interface adapter that consumes skin definitions from backend services
 * (Haruspex, PCL, Litany) and renders them as VSCode WebView interfaces.
 * Implements the Templum 1.0 Universal Skin Engine pattern.
 */

import * as vscode from 'vscode';
import { TemplumCore } from '../core/templum-core';
import { 
  ErrorSignalPayload, 
  MetricsSignalPayload,
  createTemplumError, 
  isTemplumError,
  UniversalSkinDefinition
} from '../types/templum-types';
import { withTimeout } from '../utils/async-utils';
import type { BackendServiceInfo, BackendStatusSnapshot } from './vscode/backend-service-model';

/**
 * Universal WebView Provider for Backend Service Integration
 * 
 * Renders backend-provided skin definitions as VSCode WebView interfaces.
 * Supports dynamic skin loading from multiple backend services.
 */
export class TemplumUniversalWebViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly templumCore: TemplumCore // Adapted from HaruspexCoreEngine
  ) {}

  /**
   * Initialize WebView with error isolation patterns
   */
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    const startTime = Date.now();
    
    try {
      this.view = webviewView;
      
      // ✅ APPLY: Conditional property assignment pattern
      const webviewOptions: vscode.WebviewOptions = {
        enableScripts: true,
        ...(this.context.extensionUri && { localResourceRoots: [this.context.extensionUri] })
      };
      
      this.view.webview.options = webviewOptions;
      this.view.webview.html = this.generateHtml();
      this.view.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
      
      // ✅ APPLY: Signal-based telemetry pattern (adapted from Haruspex)
      this.emitMetricsSignal({
        event_type: 'templum_webview_initialized',
        initialization_ms: Date.now() - startTime,
        metrics: { success: true }
      });
      
      void this.refresh();
    } catch (error) {
      // ✅ APPLY: UI-safe error handling with signal emission
      this.emitErrorSignal('webview_init_failed', error, {
        initialization_ms: Date.now() - startTime
      });
      
      // UI should never crash - always provide safe fallback
      console.error('Templum Interface WebView initialization failed:', error);
    }
  }

  /**
   * Refresh WebView with built-in engine reliability patterns
   */
  async refresh(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Use Templum Core for backend service data
      const backendData = await this.loadBackendData();
      
      if (this.view?.webview) {
        await this.view.webview.postMessage({ 
          type: 'update', 
          payload: { backendData, timestamp: Date.now() } 
        });
        
        // ✅ APPLY: Signal-based telemetry pattern
        this.emitMetricsSignal({
          event_type: 'templum_webview_refreshed',
          backend_count: backendData.backends?.length || 0,
          refresh_ms: Date.now() - startTime,
          metrics: { success: true }
        });
      }
    } catch (error) {
      // ✅ APPLY: Error isolation pattern with Templum signals
      this.emitErrorSignal('webview_refresh_failed', error, {
        refresh_ms: Date.now() - startTime
      });
      
      // Provide user feedback but don't crash UI
      if (this.view?.webview) {
        await this.view.webview.postMessage({
          type: 'error',
          payload: { message: 'Unable to load backend service data' }
        });
      }
    }
  }

  /**
   * Handle messages with error isolation
   */
  private handleMessage(message: { type: string; payload?: unknown }): void {
    try {
      switch (message.type) {
        case 'refresh':
          void this.refresh();
          break;
        case 'backend_clicked':
          this.emitMetricsSignal({
            event_type: 'backend_clicked',
            // Privacy-safe: No backend content or user-specific data
            timestamp: Date.now(),
            metrics: { interaction: true }
          });
          break;
        case 'backend_interaction':
          if (message.payload && typeof message.payload === 'object' && 'backendId' in message.payload) {
            const payload = message.payload as { backendId: string; action?: string };
            void this.handleBackendInteraction(
              payload.backendId, 
              payload.action || 'default'
            );
          }
          break;
        default:
          break;
      }
    } catch (error) {
      // ✅ APPLY: Message handling safety with Templum error handling
      this.emitErrorSignal('webview_message_failed', error, {
        message_type: message.type
      });
    }
  }

  /**
   * Handle backend service interaction with Universal Interface Orchestration
   * ✅ APPLY: Universal Interface Orchestration pattern with backend validation
   */
  private async handleBackendInteraction(backendId: string, action: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // ✅ APPLY: Backend availability validation before interaction
      const backendRouter = this.templumCore.getBackendRouter();
      const connectionStatus = backendRouter.getConnectionStatus?.();
      
      // Validate backend is available before attempting interaction
      const backendStatus = connectionStatus?.backends?.[backendId] as { 
        connected: boolean; 
        capabilities?: string[]; 
        lastCheck?: number 
      };
      if (!backendStatus?.connected) {
        // Provide user feedback about backend unavailability
        if (this.view?.webview) {
          await this.view.webview.postMessage({
            type: 'backend_unavailable',
            payload: {
              backendId,
              action,
              message: `Backend service '${this.getBackendDisplayName(backendId)}' is not available`,
              suggestedAction: 'Please ensure the backend service is running and try again'
            }
          });
        }
        
        this.emitMetricsSignal({
          event_type: 'backend_interaction_unavailable',
          backend_id: backendId,
          action: action,
          timestamp: Date.now(),
          metrics: { available: false, interaction_attempted: true }
        });
        return;
      }
      
      // ✅ ENHANCED: Robust backend service interaction with fallback handling
      if (action === 'load_skin') {
        const skinDefinition = await this.templumCore.loadBackendSkin(backendId);
        if (skinDefinition) {
          await this.renderBackendSkin(skinDefinition);
        } else {
          // ✅ APPLY: Graceful fallback when skin definition not available
          if (this.view?.webview) {
            await this.view.webview.postMessage({
              type: 'skin_load_fallback',
              payload: {
                backendId,
                message: `No skin definition available for ${this.getBackendDisplayName(backendId)}`,
                fallbackAvailable: true
              }
            });
          }
        }
      } else if (action === 'execute_command') {
        // ✅ ENHANCED: Command execution with proper error context
        const result = await this.templumCore.executeCommand(
          `${backendId}.default_action`,
          'vscode',
          [],
          { backendId, source: 'webview_interaction' }
        );
        await this.updateWebViewWithResult(result);
      } else {
        // ✅ APPLY: Handle unknown actions gracefully
        console.warn(`Unknown backend action: ${action} for backend: ${backendId}`);
        if (this.view?.webview) {
          await this.view.webview.postMessage({
            type: 'unsupported_action',
            payload: {
              backendId,
              action,
              message: `Action '${action}' is not supported for this backend`
            }
          });
        }
      }
      
      // ✅ APPLY: Enhanced metrics with performance tracking
      this.emitMetricsSignal({
        event_type: 'backend_interaction_success',
        backend_id: backendId,
        action: action,
        interaction_time: Date.now() - startTime,
        backend_available: true,
        timestamp: Date.now(),
        metrics: { interaction: true, success: true }
      });
    } catch (error) {
      // ✅ ENHANCED: Comprehensive error handling with user feedback
      const errorMessage = isTemplumError(error) 
        ? error.message 
        : (error instanceof Error ? error.message : 'Unknown backend interaction error');
      
      // Provide user feedback about the error
      if (this.view?.webview) {
        await this.view.webview.postMessage({
          type: 'backend_interaction_error',
          payload: {
            backendId,
            action,
            error: errorMessage,
            backendName: this.getBackendDisplayName(backendId),
            retryAvailable: true
          }
        });
      }
      
      this.emitErrorSignal('backend_interaction_failed', error, {
        backend_id: backendId,
        action: action,
        interaction_time: Date.now() - startTime
      });
    }
  }
  
  /**
   * Render a backend's skin definition in the WebView using Universal Skin Engine
   */
  private async renderBackendSkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Get Universal Skin Engine from TemplumCore
      const skinEngine = this.templumCore.getUniversalSkinEngine();
      
      // Create rendering context for VSCode interface
      const renderingContext = {
        theme: 'default-light', // Use default theme or detect from VSCode
        preferences: {
          analysisMode: 'standard'
        }
      };
      
      // Render skin using Universal Skin Engine
      const renderResult = await skinEngine.renderForInterface?.(
        skinDefinition,
        'vscode',
        renderingContext
      );
      
      if (renderResult?.success) {
        // ✅ ENHANCED: Use PCL-rendered HTML if available, fallback to generated HTML
        const renderedHTML = renderResult.renderedContent?.html || this.generateSkinHTML(renderResult, skinDefinition);
        
        // Update WebView with PCL-enhanced backend skin
        if (this.view?.webview) {
          await this.view.webview.postMessage({
            type: 'render_backend_skin',
            payload: {
              backend: skinDefinition.metadata.backend,
              name: skinDefinition.metadata.name || skinDefinition.id,
              renderResult: renderResult,
              customHTML: renderedHTML,
              performance: renderResult.performance,
              // ✅ NEW: Include PCL integration metadata
              pclEnhanced: renderResult.metadata.pclIntegration || false,
              reusePercentage: renderResult.metadata.reusePercentage || 0,
              layoutInfo: renderResult.renderedContent?.layout
            }
          });
        }
        
        // Emit success metrics
        this.emitMetricsSignal({
          event_type: 'skin_render_complete',
          backend_id: skinDefinition.metadata.backend,
          skin_id: skinDefinition.id,
          render_time: renderResult.performance.renderTime,
          component_count: renderResult.components.length,
          cache_hit: renderResult.performance.cacheHit,
          timestamp: Date.now(),
          metrics: { success: true }
        });
        
        console.log(`Universal Skin Engine: Successfully rendered ${skinDefinition.metadata.name} for VSCode in ${renderResult.performance.renderTime}ms`);
        
      } else {
        throw createTemplumError(
          `Skin rendering failed for ${skinDefinition.metadata.backend}`,
          'SkinRenderError',
          'runtime'
        );
      }
    } catch (error) {
      const errorMessage = isTemplumError(error) 
        ? error.message 
        : (error instanceof Error ? error.message : 'Unknown skin rendering error');
      
      // Emit error signal with context
      this.emitErrorSignal('skin_render_failed', error, {
        backend_service: skinDefinition.metadata.backend,
        skin_id: skinDefinition.id,
        render_time: Date.now() - startTime
      });
      
      // Provide fallback UI to prevent crash
      if (this.view?.webview) {
        await this.view.webview.postMessage({
          type: 'skin_render_error',
          payload: {
            backend: skinDefinition.metadata.backend,
            name: skinDefinition.name,
            error: errorMessage,
            fallbackAvailable: true
          }
        });
      }
      
      console.error(`Universal Skin Engine: Failed to render skin for ${skinDefinition.metadata.backend}:`, errorMessage);
    }
  }
  
  /**
   * Generate HTML content from Universal Skin Engine render result
   */
  private generateSkinHTML(renderResult: any, skinDefinition: UniversalSkinDefinition): string {
    try {
      const components = renderResult.components || [];
      let htmlContent = '';
      
      // Generate HTML for each rendered component
      components.forEach((component: any) => {
        switch (component.type) {
          case 'treeView':
            htmlContent += this.generateTreeViewHTML(component);
            break;
          case 'menu':
            htmlContent += this.generateMenuHTML(component);
            break;
          case 'command':
            htmlContent += this.generateCommandHTML(component);
            break;
          default:
            htmlContent += this.generateGenericComponentHTML(component);
        }
      });
      
      // Wrap in themed container
      return `
        <div class="backend-skin-container" data-backend="${skinDefinition.metadata.backend}">
          <div class="skin-header">
            <h3>${skinDefinition.metadata.name || skinDefinition.id}</h3>
            <span class="backend-label">${skinDefinition.metadata.backend}</span>
          </div>
          <div class="skin-content">
            ${htmlContent || '<p>No renderable components found</p>'}
          </div>
        </div>
      `;
    } catch (_error) {
      // Return safe fallback HTML
      return `
        <div class="backend-skin-container error">
          <h3>Skin Rendering Error</h3>
          <p>Unable to generate HTML for ${skinDefinition.metadata.name}</p>
        </div>
      `;
    }
  }
  
  private generateTreeViewHTML(component: any): string {
    const treeView = component.content;
    return `
      <div class="tree-view-component" data-id="${component.id}">
        <h4>${treeView.title || component.id}</h4>
        <div class="tree-content">
          ${treeView.description ? `<p>${treeView.description}</p>` : ''}
          ${treeView.actions ? this.generateActionsHTML(treeView.actions) : ''}
        </div>
      </div>
    `;
  }
  
  private generateMenuHTML(component: any): string {
    const menu = component.content;
    return `
      <div class="menu-component" data-id="${component.id}">
        <h4>${menu.title || component.id}</h4>
        <div class="menu-items">
          ${menu.items ? menu.items.map((item: any) => `
            <div class="menu-item" data-command="${item.command}">
              <span>${item.label}</span>
            </div>
          `).join('') : '<p>No menu items</p>'}
        </div>
      </div>
    `;
  }
  
  private generateCommandHTML(component: any): string {
    const command = component.content;
    return `
      <div class="command-component" data-id="${component.id}">
        <button class="command-button" data-command="${command.id}">
          ${command.title || command.id}
        </button>
        ${command.description ? `<p class="command-description">${command.description}</p>` : ''}
      </div>
    `;
  }
  
  private generateGenericComponentHTML(component: any): string {
    return `
      <div class="generic-component" data-id="${component.id}" data-type="${component.type}">
        <h4>${component.content?.title || component.id}</h4>
        <p>Component Type: ${component.type}</p>
        <p>Backend: ${component.backend}</p>
      </div>
    `;
  }
  
  private generateActionsHTML(actions: any[]): string {
    return `
      <div class="actions">
        ${actions.map(action => `
          <button class="action-button" data-action="${action.id}">
            ${action.label || action.id}
          </button>
        `).join('')}
      </div>
    `;
  }

  private async updateWebViewWithResult(result: any): Promise<void> {
    if (this.view?.webview) {
      await this.view.webview.postMessage({
        type: 'command_result',
        payload: result
      });
    }
  }

  /**
   * Load backend service data and skin definitions with comprehensive status integration
   */
  private async loadBackendData(): Promise<{ backends: BackendServiceInfo[] }> {
    const statusStartTime = Date.now();

    try {
      const backendRouter = this.templumCore.getBackendRouter();
      const connectionStatus = backendRouter.getConnectionStatus?.();

      if (!connectionStatus || !connectionStatus.backends) {
        this.emitErrorSignal(
          'backend_status_missing',
          new Error('Connection status unavailable'),
          { reason: 'missing-status' }
        );

        this.emitMetricsSignal({
          event_type: 'backend_data_loaded',
          total_backends: 0,
          connected_backends: 0,
          refresh_ms: Date.now() - statusStartTime,
          metrics: { backend_discovery: false, status_integration: false }
        });
        return { backends: [] };
      }

      const backendEntries = Object.entries(connectionStatus.backends);
      if (backendEntries.length === 0) {
        this.emitMetricsSignal({
          event_type: 'backend_data_loaded',
          total_backends: 0,
          connected_backends: 0,
          refresh_ms: Date.now() - statusStartTime,
          metrics: { backend_discovery: true, status_integration: true, empty: true }
        });
        return { backends: [] };
      }

      const availability = await this.resolveBackendAvailability(
        backendRouter,
        backendEntries.map(([backendId]) => backendId)
      );

      const failures: Array<{ id: string; error: string }> = [];
      const backends = backendEntries.map(([backendId, status]) => {
        try {
          const backendStatus = status as BackendStatusSnapshot;

          return {
            id: backendId,
            name: this.getBackendDisplayName(backendId),
            status: this.determineBackendStatus(backendStatus, availability[backendId] ?? false),
            description: this.getBackendDescription(backendId),
            capabilities: backendStatus.capabilities || [],
            lastActivity: backendStatus.lastCheck || Date.now(),
            health: backendStatus.health || 'unknown',
            responseTime: backendStatus.responseTime,
            version: backendStatus.version,
            errorMessage: backendStatus.errorMessage
          } satisfies BackendServiceInfo;
        } catch (backendError) {
          const message = backendError instanceof Error ? backendError.message : 'Unknown backend error';
          failures.push({ id: backendId, error: message });
          return {
            id: backendId,
            name: this.getBackendDisplayName(backendId),
            status: 'error',
            description: this.getBackendDescription(backendId),
            capabilities: [],
            lastActivity: Date.now(),
            health: 'error',
            errorMessage: message
          } satisfies BackendServiceInfo;
        }
      });

      const connected = backends.filter((backend) => backend.status === 'connected').length;
      const refreshDuration = Date.now() - statusStartTime;

      this.emitMetricsSignal({
        event_type: 'backend_data_loaded',
        total_backends: backends.length,
        connected_backends: connected,
        refresh_ms: refreshDuration,
        error_count: failures.length,
        metrics: {
          backend_discovery: true,
          status_integration: true,
          success: failures.length === 0
        }
      });

      if (failures.length > 0) {
        this.emitErrorSignal(
          'backend_data_partial_failure',
          new Error('One or more backend entries failed to normalize'),
          {
            failed_backends: failures.map((entry) => entry.id),
            refresh_ms: refreshDuration
          }
        );
      }

      return { backends };
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      this.emitErrorSignal('backend_data_loading_failed', failure, {
        fallback_mode: true,
        timestamp: Date.now()
      });

      return { backends: [] };
    }
  }

  private async resolveBackendAvailability(
    backendRouter: any,
    backendIds: string[]
  ): Promise<Record<string, boolean>> {
    if (!backendRouter || typeof backendRouter.isServiceAvailable !== 'function' || backendIds.length === 0) {
      return backendIds.reduce<Record<string, boolean>>((acc, backendId) => {
        acc[backendId] = false;
        return acc;
      }, {});
    }

    const healthCheckTimeout = 5000;
    const availabilityEntries = await Promise.all(
      backendIds.map(async (backendId) => {
        try {
          const isAvailable = await withTimeout(
            Promise.resolve(backendRouter.isServiceAvailable(backendId)),
            healthCheckTimeout,
            new Error('Health check timeout')
          );
          return [backendId, Boolean(isAvailable)] as const;
        } catch (_error) {
          return [backendId, false] as const;
        }
      })
    );

    return Object.fromEntries(availabilityEntries);
  }
  
  /**
   * Determine comprehensive backend status from multiple indicators
   */
  private determineBackendStatus(
    status: BackendStatusSnapshot,
    isServiceAvailable: boolean
  ): 'connected' | 'disconnected' | 'error' | 'degraded' {
    
    // Error status takes precedence
    if (status.errorMessage || status.health === 'error') {
      return 'error';
    }
    
    // Degraded service detection
    if (status.connected && status.health === 'degraded') {
      return 'degraded';
    }
    
    // Real-time availability check
    if (status.connected && isServiceAvailable) {
      return 'connected';
    }
    
    // Default to disconnected
    return 'disconnected';
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

  /**
   * Generate HTML with theme integration patterns (adapted for Templum)
   */
  private generateHtml(): string {
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline' vscode-resource:; script-src 'unsafe-inline';" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      /* ✅ APPLY: Theme-aware styling with semantic color references */
      :root {
        color-scheme: light dark;
      }
      body {
        background: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-font-family);
        margin: 0; 
        padding: 8px;
      }
      .error-message {
        color: var(--vscode-errorForeground);
        background: var(--vscode-inputValidation-errorBackground);
        border: 1px solid var(--vscode-inputValidation-errorBorder);
        border-radius: 3px;
        padding: 8px;
        margin: 8px 0;
      }
      .interface-container {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        margin: 4px 0;
        padding: 12px;
        background: var(--vscode-editor-background);
      }
      .interface-container:hover {
        background: var(--vscode-list-hoverBackground);
        cursor: pointer;
      }
      .interface-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }
      .interface-name {
        font-weight: bold;
        margin-right: 8px;
        color: var(--vscode-foreground);
      }
      .interface-status {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 2px;
        text-transform: uppercase;
        font-weight: bold;
      }
      .status-active { 
        background: var(--vscode-terminal-ansiGreen);
        color: white;
      }
      .status-available { 
        background: var(--vscode-terminal-ansiBlue);
        color: white;
      }
      .status-inactive { 
        background: var(--vscode-descriptionForeground);
        color: white;
      }
      .interface-description {
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        margin-top: 4px;
      }
      .switch-button {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 3px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        margin-top: 8px;
      }
      .switch-button:hover {
        background: var(--vscode-button-hoverBackground);
      }
      .switch-button:disabled {
        background: var(--vscode-button-background);
        opacity: 0.5;
        cursor: not-allowed;
      }
      .sr-only { 
        position: absolute; 
        width: 1px; 
        height: 1px; 
        padding: 0; 
        margin: -1px; 
        overflow: hidden; 
        clip: rect(0,0,0,0); 
        white-space: nowrap; 
        border: 0; 
      }
      .loading {
        text-align: center;
        padding: 20px;
        color: var(--vscode-descriptionForeground);
      }
      .empty {
        text-align: center;
        padding: 20px;
        color: var(--vscode-descriptionForeground);
      }
      .header {
        border-bottom: 1px solid var(--vscode-panel-border);
        padding-bottom: 8px;
        margin-bottom: 12px;
      }
      .header h1 {
        margin: 0;
        font-size: 16px;
        font-weight: bold;
        color: var(--vscode-foreground);
      }
      .header p {
        margin: 4px 0 0 0;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
      }
      .skin-rendered-container {
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 12px;
        margin: 8px 0;
      }
      .performance-info {
        color: var(--vscode-descriptionForeground);
        font-size: 10px;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--vscode-panel-border);
      }
      .backend-skin-container {
        margin: 8px 0;
      }
      .backend-skin-container.error {
        color: var(--vscode-errorForeground);
        background: var(--vscode-inputValidation-errorBackground);
        border: 1px solid var(--vscode-inputValidation-errorBorder);
        border-radius: 3px;
        padding: 8px;
      }
      .skin-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--vscode-panel-border);
      }
      .skin-header h3 {
        margin: 0;
        font-size: 14px;
        color: var(--vscode-foreground);
      }
      .backend-label {
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 2px 6px;
        border-radius: 2px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
      }
      .skin-content {
        padding: 8px 0;
      }
      .tree-view-component, .menu-component, .command-component, .generic-component {
        margin: 8px 0;
        padding: 8px;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 3px;
      }
      .tree-view-component h4, .menu-component h4, .command-component h4, .generic-component h4 {
        margin: 0 0 8px 0;
        font-size: 12px;
        color: var(--vscode-foreground);
      }
      .command-button, .action-button {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 3px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
        margin: 2px;
      }
      .command-button:hover, .action-button:hover {
        background: var(--vscode-button-hoverBackground);
      }
      .menu-item {
        padding: 4px 8px;
        margin: 2px 0;
        background: var(--vscode-list-hoverBackground);
        border-radius: 2px;
        cursor: pointer;
        font-size: 11px;
      }
      .menu-item:hover {
        background: var(--vscode-list-activeSelectionBackground);
        color: var(--vscode-list-activeSelectionForeground);
      }
      .command-description {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        margin: 4px 0 0 0;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 8px;
      }
      .skin-error {
        background: var(--vscode-inputValidation-errorBackground);
        border: 1px solid var(--vscode-inputValidation-errorBorder);
        color: var(--vscode-errorForeground);
      }
      .skin-fallback {
        color: var(--vscode-descriptionForeground);
        font-style: italic;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Templum Universal Interface</h1>
      <p>Backend Service Integration Dashboard</p>
    </div>
    <div id="root" class="loading">Loading backend services...</div>
    <script>
      const vscode = acquireVsCodeApi();
      let readySent = false;
      const announceReady = (stage: string) => {
        if (readySent) {
          return;
        }
        readySent = true;
        vscode.postMessage({
          type: 'templum:webview_ready',
          payload: { interfaceId: 'templum.universalInterface', stage }
        });
      };
      
      // Announce immediately in case the DOM is already ready
      announceReady('bootstrap');
      window.addEventListener('DOMContentLoaded', () => announceReady('dom'), { once: true });
      window.addEventListener('load', () => announceReady('load'), { once: true });
      
      window.addEventListener('message', (event) => {
        const { type, payload } = event.data || {};
        const root = document.getElementById('root');
        
        if (type === 'update' && payload?.backendData) {
          // ✅ APPLY: Safe UI update pattern
          root.innerHTML = '';
          root.className = '';
          
          const backendData = payload.backendData;
          
          if (!backendData.backends || backendData.backends.length === 0) {
            root.className = 'empty';
            root.innerHTML = '<p>No backend services available</p>';
          } else {
            backendData.backends.forEach((backendInfo) => {
              const container = document.createElement('div');
              container.className = 'interface-container';
              
              const header = document.createElement('div');
              header.className = 'interface-header';
              
              const name = document.createElement('div');
              name.className = 'interface-name';
              name.textContent = backendInfo.name || backendInfo.id || 'Unknown Backend';
              
              const status = document.createElement('div');
              status.className = 'interface-status status-' + (backendInfo.status || 'disconnected');
              status.textContent = backendInfo.status || 'disconnected';
              
              header.appendChild(name);
              header.appendChild(status);
              
              const description = document.createElement('div');
              description.className = 'interface-description';
              description.textContent = backendInfo.description || 'No description available';
              
              const actionButton = document.createElement('button');
              actionButton.className = 'switch-button';
              actionButton.textContent = backendInfo.status === 'connected' ? 'Load Interface' : 'Disconnected';
              actionButton.disabled = backendInfo.status !== 'connected';
              
              actionButton.addEventListener('click', () => {
                vscode.postMessage({ 
                  type: 'backend_interaction', 
                  payload: { backendId: backendInfo.id, action: 'load_skin' } 
                });
              });
              
              container.appendChild(header);
              container.appendChild(description);
              container.appendChild(actionButton);
              
              container.addEventListener('click', (e) => {
                if (e.target !== actionButton) {
                  vscode.postMessage({ 
                    type: 'backend_clicked', 
                    payload: { backendId: backendInfo.id } 
                  });
                }
              });
              
              root.appendChild(container);
            });
          }
        } else if (type === 'error') {
          // ✅ APPLY: Error display pattern
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-message';
          errorDiv.textContent = payload?.message || 'Unknown error occurred';
          root.innerHTML = '';
          root.className = '';
          root.appendChild(errorDiv);
        } else if (type === 'render_backend_skin') {
          // Handle successful backend skin rendering
          root.innerHTML = '';
          root.className = '';
          
          const skinContainer = document.createElement('div');
          skinContainer.className = 'skin-rendered-container';
          
          // Add performance info if available
          if (payload.performance) {
            const perfInfo = document.createElement('div');
            perfInfo.className = 'performance-info';
            perfInfo.innerHTML = \`
              <small>Rendered in \${payload.performance.renderTime}ms
              \${payload.performance.cacheHit ? ' (cached)' : ''}
              • \${payload.renderResult?.components?.length || 0} components</small>
            \`;
            skinContainer.appendChild(perfInfo);
          }
          
          // Add custom HTML if available
          if (payload.customHTML) {
            const htmlDiv = document.createElement('div');
            htmlDiv.innerHTML = payload.customHTML;
            skinContainer.appendChild(htmlDiv);
          } else {
            // Fallback rendering
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'skin-fallback';
            fallbackDiv.innerHTML = \`
              <h3>\${payload.name}</h3>
              <p>Backend: \${payload.backend}</p>
              <p>Skin rendered successfully but no custom HTML available</p>
            \`;
            skinContainer.appendChild(fallbackDiv);
          }
          
          root.appendChild(skinContainer);
        } else if (type === 'skin_render_error') {
          // Handle skin rendering errors
          root.innerHTML = '';
          root.className = 'error';
          
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-message skin-error';
          errorDiv.innerHTML = \`
            <h3>Skin Rendering Failed</h3>
            <p><strong>Backend:</strong> \${payload.backend}</p>
            <p><strong>Skin:</strong> \${payload.name}</p>
            <p><strong>Error:</strong> \${payload.error}</p>
            \${payload.fallbackAvailable ? '<p><em>Using fallback interface</em></p>' : ''}
          \`;
          root.appendChild(errorDiv);
        } else if (type === 'command_result') {
          // Handle command execution results
          console.log('Command result:', payload);
        } else if (type === 'backend_unavailable') {
          // ✅ ENHANCED: Handle backend unavailability feedback
          const unavailableDiv = document.createElement('div');
          unavailableDiv.className = 'error-message';
          unavailableDiv.innerHTML = \`
            <h3>Backend Service Unavailable</h3>
            <p><strong>Service:</strong> \${payload.backendId}</p>
            <p><strong>Action:</strong> \${payload.action}</p>
            <p>\${payload.message}</p>
            <p><em>\${payload.suggestedAction}</em></p>
          \`;
          root.appendChild(unavailableDiv);
        } else if (type === 'skin_load_fallback') {
          // ✅ ENHANCED: Handle skin loading fallback
          const fallbackDiv = document.createElement('div');
          fallbackDiv.className = 'interface-container skin-fallback';
          fallbackDiv.innerHTML = \`
            <h3>Skin Loading Fallback</h3>
            <p>\${payload.message}</p>
            <p><em>Using default interface for this backend</em></p>
          \`;
          root.appendChild(fallbackDiv);
        } else if (type === 'unsupported_action') {
          // ✅ ENHANCED: Handle unsupported action feedback
          const unsupportedDiv = document.createElement('div');
          unsupportedDiv.className = 'error-message';
          unsupportedDiv.innerHTML = \`
            <h3>Unsupported Action</h3>
            <p><strong>Backend:</strong> \${payload.backendId}</p>
            <p>\${payload.message}</p>
          \`;
          root.appendChild(unsupportedDiv);
        } else if (type === 'backend_interaction_error') {
          // ✅ ENHANCED: Handle backend interaction errors with retry option
          root.innerHTML = '';
          root.className = 'error';
          
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-message';
          errorDiv.innerHTML = \`
            <h3>Backend Interaction Failed</h3>
            <p><strong>Service:</strong> \${payload.backendName}</p>
            <p><strong>Action:</strong> \${payload.action}</p>
            <p><strong>Error:</strong> \${payload.error}</p>
            \${payload.retryAvailable ? '<p><button class="switch-button" onclick="location.reload()">Retry</button></p>' : ''}
          \`;
          root.appendChild(errorDiv);
        }
      });
    </script>
  </body>
</html>`;
  }

  /**
   * Emit metrics signal using Templum signal pattern
   */
  private emitMetricsSignal(eventData: { 
    event_type: string; 
    timestamp?: number; 
    metrics: Record<string, any>;
    [key: string]: any;
  }): void {
    const metricsPayload: MetricsSignalPayload = {
      metrics: {
        memory: { heapUsed: 0, rss: 0 },
        cpu: { user: 0, system: 0 },
        interfaces: {
          vscode: {
            responseTime: eventData.interaction_time || 0,
            lastActivity: eventData.timestamp || Date.now()
          }
        }
      },
      category: 'usage',
      timestamp: Date.now(),
      source: 'TemplumInterfaceWebView',
      data: eventData
    };
    (process as any).emit('templum:metrics', metricsPayload);
  }

  /**
   * Emit error signal using Templum signal pattern
   */
  private emitErrorSignal(errorCode: string, error: unknown, context?: Record<string, any>): void {
    const message = isTemplumError(error) 
      ? error.message 
      : (error instanceof Error ? error.message : 'Unknown error');
    
    const errorPayload: ErrorSignalPayload = {
      error: isTemplumError(error) ? error : createTemplumError(message, 'WEBVIEW_ERROR', 'runtime'),
      severity: 'medium',
      timestamp: Date.now(),
      source: 'TemplumInterfaceWebView',
      data: context
    };
    (process as any).emit('templum:error', errorPayload);
  }
}

// Helper interface for backend service data

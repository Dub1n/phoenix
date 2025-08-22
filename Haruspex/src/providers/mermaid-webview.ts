/**
 * @fileoverview Mermaid WebView Provider - Phase 5 Implementation 
 * @author Claude Code Implementation
 * @created 2025-08-14
 * 
 * Applies validated error isolation, theme integration, and telemetry
 * patterns from Phase 4 DocumentationTreeProvider implementation.
 */

import * as vscode from 'vscode';
import { HaruspexCoreEngine } from '../core/haruspex-core-engine';
import { TelemetryCollector } from '../core/telemetry-collector';

/**
 * Mermaid WebView Provider with Phase 4 Integration Patterns
 * 
 * Applies validated error isolation, theme integration, and telemetry
 * patterns from Phase 4 DocumentationTreeProvider implementation.
 */
export class MermaidWebViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly engine: HaruspexCoreEngine, // Phase 4 integration ready
    private readonly telemetry: TelemetryCollector // Phase 4 privacy-compliant telemetry
  ) {}

  /**
   * Initialize WebView with Phase 4 error isolation patterns
   */
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    const startTime = Date.now();
    
    try {
      this.view = webviewView;
      
      // ✅ APPLY: Phase 4 conditional property assignment pattern
      const webviewOptions: vscode.WebviewOptions = {
        enableScripts: true,
        ...(this.context.extensionUri && { localResourceRoots: [this.context.extensionUri] })
      };
      
      this.view.webview.options = webviewOptions;
      this.view.webview.html = this.generateHtml();
      this.view.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
      
      // ✅ APPLY: Phase 4 telemetry pattern
      this.telemetry.recordEvent('webview_provider_event', {
        event_type: 'mermaid_webview_initialized',
        initialization_ms: Date.now() - startTime
      });
      
      void this.refresh();
    } catch (error) {
      // ✅ APPLY: Phase 4 UI-safe error handling
      this.telemetry.recordErrorEvent('webview_init_failed', 'ui', {
        error_code: 'mermaid_webview_init_failed',
        initialization_ms: Date.now() - startTime
      });
      
      // UI should never crash - always provide safe fallback
      console.error('Mermaid WebView initialization failed:', error);
    }
  }

  /**
   * Refresh WebView with built-in engine reliability patterns
   */
  async refresh(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Use Phase 4 pattern: leverage engine's built-in reliability
      const diagrams = await this.engine.getMermaidDiagrams();
      
      if (this.view?.webview) {
        await this.view.webview.postMessage({ 
          type: 'update', 
          payload: { diagrams, timestamp: Date.now() } 
        });
        
        // ✅ APPLY: Phase 4 telemetry pattern
        this.telemetry.recordEvent('webview_provider_event', {
          event_type: 'mermaid_webview_refreshed',
          diagram_count: diagrams.length,
          refresh_ms: Date.now() - startTime
        });
      }
    } catch (error) {
      // ✅ APPLY: Phase 4 error isolation pattern
      this.telemetry.recordErrorEvent('webview_refresh_failed', 'ui', {
        error_code: 'mermaid_data_unavailable',
        refresh_ms: Date.now() - startTime
      });
      
      // Provide user feedback but don't crash UI
      if (this.view?.webview) {
        await this.view.webview.postMessage({
          type: 'error',
          payload: { message: 'Unable to load diagrams' }
        });
      }
    }
  }

  /**
   * Handle messages with Phase 4 error isolation
   */
  private handleMessage(message: { type: string; payload?: unknown }): void {
    try {
      switch (message.type) {
        case 'refresh':
          void this.refresh();
          break;
        case 'diagram_clicked':
          this.telemetry.recordEvent('webview_interaction_event', {
            event_type: 'diagram_clicked',
            // Privacy-safe: No diagram content or user-specific data
            timestamp: Date.now()
          });
          break;
        default:
          break;
      }
    } catch (error) {
      // ✅ APPLY: Phase 4 message handling safety
      this.telemetry.recordErrorEvent('webview_message_failed', 'ui', {
        error_code: 'message_handling_error',
        message_type: message.type
      });
    }
  }

  /**
   * Generate HTML with Phase 4 theme integration patterns
   */
  private generateHtml(): string {
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline' vscode-resource:; script-src 'unsafe-inline';" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      /* ✅ APPLY: Phase 4 theme-aware styling with semantic color references */
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
      .diagram-container {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        margin: 4px 0;
        padding: 8px;
        background: var(--vscode-editor-background);
      }
      .diagram-container:hover {
        background: var(--vscode-list-hoverBackground);
        cursor: pointer;
      }
      .diagram-title {
        font-weight: bold;
        margin-bottom: 8px;
        color: var(--vscode-foreground);
      }
      .diagram-source {
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        background: var(--vscode-textCodeBlock-background);
        padding: 8px;
        border-radius: 3px;
        white-space: pre-wrap;
        overflow-x: auto;
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
    </style>
  </head>
  <body>
    <h1 class="sr-only">Mermaid Architecture Diagrams</h1>
    <div id="root" class="loading">Loading diagrams...</div>
    <script>
      const vscode = acquireVsCodeApi();
      
      window.addEventListener('message', (event) => {
        const { type, payload } = event.data || {};
        const root = document.getElementById('root');
        
        if (type === 'update' && payload?.diagrams) {
          // ✅ APPLY: Phase 4 safe UI update pattern
          root.innerHTML = '';
          root.className = '';
          
          if (payload.diagrams.length === 0) {
            root.className = 'empty';
            root.innerHTML = '<p>No diagrams available</p>';
          } else {
            payload.diagrams.forEach((diagram, index) => {
              const container = document.createElement('div');
              container.className = 'diagram-container';
              
              const title = document.createElement('div');
              title.className = 'diagram-title';
              title.textContent = diagram.title || diagram.id || 'Untitled Diagram';
              
              const source = document.createElement('div');
              source.className = 'diagram-source';
              source.textContent = diagram.source || 'No source available';
              
              container.appendChild(title);
              container.appendChild(source);
              
              container.addEventListener('click', () => {
                vscode.postMessage({ type: 'diagram_clicked', payload: { index, id: diagram.id } });
              });
              
              root.appendChild(container);
            });
          }
        } else if (type === 'error') {
          // ✅ APPLY: Phase 4 error display pattern
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-message';
          errorDiv.textContent = payload?.message || 'Unknown error occurred';
          root.innerHTML = '';
          root.className = '';
          root.appendChild(errorDiv);
        }
      });
    </script>
  </body>
</html>`;
  }
}
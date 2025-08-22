/**
 * @fileoverview Truth Matrix WebView Provider - Phase 5 Implementation 
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
 * Truth Matrix WebView Provider with Phase 4 Integration Patterns
 * 
 * Displays system health dashboard with detailed metrics and visual indicators
 */
export class TruthMatrixWebViewProvider implements vscode.WebviewViewProvider {
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
        event_type: 'truth_matrix_webview_initialized',
        initialization_ms: Date.now() - startTime
      });
      
      void this.refresh();
    } catch (error) {
      // ✅ APPLY: Phase 4 UI-safe error handling
      this.telemetry.recordErrorEvent('webview_init_failed', 'ui', {
        error_code: 'truth_matrix_webview_init_failed',
        initialization_ms: Date.now() - startTime
      });
      
      // UI should never crash - always provide safe fallback
      console.error('Truth Matrix WebView initialization failed:', error);
    }
  }

  /**
   * Refresh WebView with built-in engine reliability patterns
   */
  async refresh(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Use Phase 4 pattern: leverage engine's built-in reliability
      const truthMatrix = await this.engine.getTruthMatrix();
      
      if (this.view?.webview) {
        await this.view.webview.postMessage({ 
          type: 'update', 
          payload: { truthMatrix, timestamp: Date.now() } 
        });
        
        // ✅ APPLY: Phase 4 telemetry pattern
        this.telemetry.recordEvent('webview_provider_event', {
          event_type: 'truth_matrix_webview_refreshed',
          health_score: truthMatrix.overallHealthScore,
          files_analyzed: truthMatrix.filesAnalyzed || 0,
          refresh_ms: Date.now() - startTime
        });
      }
    } catch (error) {
      // ✅ APPLY: Phase 4 error isolation pattern
      this.telemetry.recordErrorEvent('webview_refresh_failed', 'ui', {
        error_code: 'truth_matrix_data_unavailable',
        refresh_ms: Date.now() - startTime
      });
      
      // Provide user feedback but don't crash UI
      if (this.view?.webview) {
        await this.view.webview.postMessage({
          type: 'error',
          payload: { message: 'Unable to load health dashboard' }
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
        case 'metric_clicked':
          this.telemetry.recordEvent('webview_interaction_event', {
            event_type: 'health_metric_clicked',
            // Privacy-safe: No project-specific data
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
      .health-dashboard {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .overall-score {
        text-align: center;
        padding: 16px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        background: var(--vscode-editor-background);
      }
      .score-value {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      .score-healthy { color: var(--vscode-terminal-ansiGreen); }
      .score-warning { color: var(--vscode-problemsWarningIcon-foreground); }
      .score-error { color: var(--vscode-problemsErrorIcon-foreground); }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
      }
      .metric-card {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 8px;
        background: var(--vscode-editor-background);
        cursor: pointer;
      }
      .metric-card:hover {
        background: var(--vscode-list-hoverBackground);
      }
      .metric-title {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 4px;
        text-transform: uppercase;
      }
      .metric-value {
        font-size: 16px;
        font-weight: bold;
      }
      .files-analyzed {
        text-align: center;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        margin-top: 16px;
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
    <h1 class="sr-only">Truth Matrix Health Dashboard</h1>
    <div id="root" class="loading">Loading health dashboard...</div>
    <script>
      const vscode = acquireVsCodeApi();
      
      function getScoreClass(score) {
        if (score >= 80) return 'score-healthy';
        if (score >= 60) return 'score-warning';
        return 'score-error';
      }
      
      function formatScore(score) {
        return Math.round(score) + '%';
      }
      
      window.addEventListener('message', (event) => {
        const { type, payload } = event.data || {};
        const root = document.getElementById('root');
        
        if (type === 'update' && payload?.truthMatrix) {
          // ✅ APPLY: Phase 4 safe UI update pattern
          root.innerHTML = '';
          root.className = '';
          
          const truthMatrix = payload.truthMatrix;
          const dashboard = document.createElement('div');
          dashboard.className = 'health-dashboard';
          
          // Overall score
          const overallScore = document.createElement('div');
          overallScore.className = 'overall-score';
          
          const scoreValue = document.createElement('div');
          scoreValue.className = 'score-value ' + getScoreClass(truthMatrix.overallHealthScore);
          scoreValue.textContent = formatScore(truthMatrix.overallHealthScore);
          
          const scoreLabel = document.createElement('div');
          scoreLabel.textContent = 'Overall Health Score';
          
          overallScore.appendChild(scoreValue);
          overallScore.appendChild(scoreLabel);
          dashboard.appendChild(overallScore);
          
          // Health metrics grid
          if (truthMatrix.healthMetrics) {
            const metricsGrid = document.createElement('div');
            metricsGrid.className = 'metrics-grid';
            
            const metrics = [
              { key: 'codeQuality', label: 'Code Quality' },
              { key: 'documentationCoverage', label: 'Documentation' },
              { key: 'architectureConsistency', label: 'Architecture' },
              { key: 'testCoverage', label: 'Test Coverage' },
              { key: 'dependencyHealth', label: 'Dependencies' },
              { key: 'securityScore', label: 'Security' }
            ];
            
            metrics.forEach(metric => {
              const card = document.createElement('div');
              card.className = 'metric-card';
              
              const title = document.createElement('div');
              title.className = 'metric-title';
              title.textContent = metric.label;
              
              const value = document.createElement('div');
              value.className = 'metric-value ' + getScoreClass(truthMatrix.healthMetrics[metric.key] || 0);
              value.textContent = formatScore(truthMatrix.healthMetrics[metric.key] || 0);
              
              card.appendChild(title);
              card.appendChild(value);
              
              card.addEventListener('click', () => {
                vscode.postMessage({ type: 'metric_clicked', payload: { metric: metric.key } });
              });
              
              metricsGrid.appendChild(card);
            });
            
            dashboard.appendChild(metricsGrid);
          }
          
          // Files analyzed info
          if (truthMatrix.filesAnalyzed) {
            const filesAnalyzed = document.createElement('div');
            filesAnalyzed.className = 'files-analyzed';
            filesAnalyzed.textContent = truthMatrix.filesAnalyzed + ' files analyzed';
            dashboard.appendChild(filesAnalyzed);
          }
          
          root.appendChild(dashboard);
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
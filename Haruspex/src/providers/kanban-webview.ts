/**
 * @fileoverview Kanban WebView Provider - Phase 5 Implementation 
 * @author Claude Code Implementation
 * @created 2025-08-14
 * 
 * Applies validated error isolation, theme integration, and telemetry
 * patterns from Phase 4 DocumentationTreeProvider implementation.
 * 
 * Visualizes TDD workflow progress as a Kanban board
 */

import * as vscode from 'vscode';
import { HaruspexCoreEngine } from '../core/haruspex-core-engine';
import { TelemetryCollector } from '../core/telemetry-collector';

interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
}

interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  type: 'planning' | 'implementation' | 'testing' | 'documentation';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
}

/**
 * Kanban WebView Provider with Phase 4 Integration Patterns
 * 
 * Visualizes TDD workflow and project tasks as an interactive Kanban board
 */
export class KanbanWebViewProvider implements vscode.WebviewViewProvider {
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
        event_type: 'kanban_webview_initialized',
        initialization_ms: Date.now() - startTime
      });
      
      void this.refresh();
    } catch (error) {
      // ✅ APPLY: Phase 4 UI-safe error handling
      this.telemetry.recordErrorEvent('webview_init_failed', 'ui', {
        error_code: 'kanban_webview_init_failed',
        initialization_ms: Date.now() - startTime
      });
      
      // UI should never crash - always provide safe fallback
      console.error('Kanban WebView initialization failed:', error);
    }
  }

  /**
   * Refresh WebView with TDD workflow data
   */
  async refresh(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Generate Kanban data based on project state and TDD workflow
      const kanbanData = await this.generateKanbanData();
      
      if (this.view?.webview) {
        await this.view.webview.postMessage({ 
          type: 'update', 
          payload: { kanbanData, timestamp: Date.now() } 
        });
        
        // ✅ APPLY: Phase 4 telemetry pattern
        this.telemetry.recordEvent('webview_provider_event', {
          event_type: 'kanban_webview_refreshed',
          total_items: kanbanData.columns.reduce((sum, col) => sum + col.items.length, 0),
          columns_count: kanbanData.columns.length,
          refresh_ms: Date.now() - startTime
        });
      }
    } catch (error) {
      // ✅ APPLY: Phase 4 error isolation pattern
      this.telemetry.recordErrorEvent('webview_refresh_failed', 'ui', {
        error_code: 'kanban_data_unavailable',
        refresh_ms: Date.now() - startTime
      });
      
      // Provide user feedback but don't crash UI
      if (this.view?.webview) {
        await this.view.webview.postMessage({
          type: 'error',
          payload: { message: 'Unable to load TDD workflow board' }
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
        case 'item_clicked':
          this.telemetry.recordEvent('webview_interaction_event', {
            event_type: 'kanban_item_clicked',
            // Privacy-safe: No project-specific data
            timestamp: Date.now()
          });
          break;
        case 'column_clicked':
          this.telemetry.recordEvent('webview_interaction_event', {
            event_type: 'kanban_column_clicked',
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
   * Generate Kanban data based on project state
   */
  private async generateKanbanData(): Promise<{ columns: KanbanColumn[] }> {
    try {
      // Get project health data to inform TDD workflow state
      const truthMatrix = await this.engine.getTruthMatrix();
      const docTree = await this.engine.getDocumentationTree();
      const diagrams = await this.engine.getMermaidDiagrams();

      // Generate workflow items based on project state
      const todoItems: KanbanItem[] = [];
      const inProgressItems: KanbanItem[] = [];
      const doneItems: KanbanItem[] = [];

      // Generate items based on health scores
      if (truthMatrix.healthMetrics) {
        if (truthMatrix.healthMetrics.testCoverage < 80) {
          todoItems.push({
            id: 'improve-tests',
            title: 'Improve Test Coverage',
            description: `Current: ${Math.round(truthMatrix.healthMetrics.testCoverage)}%`,
            type: 'testing',
            priority: 'high',
            status: 'pending'
          });
        }

        if (truthMatrix.healthMetrics.documentationCoverage < 70) {
          todoItems.push({
            id: 'improve-docs',
            title: 'Improve Documentation',
            description: `Current: ${Math.round(truthMatrix.healthMetrics.documentationCoverage)}%`,
            type: 'documentation',
            priority: 'medium',
            status: 'pending'
          });
        }

        if (truthMatrix.healthMetrics.codeQuality < 85) {
          inProgressItems.push({
            id: 'refactor-code',
            title: 'Code Quality Improvements',
            description: `Current: ${Math.round(truthMatrix.healthMetrics.codeQuality)}%`,
            type: 'implementation',
            priority: 'medium',
            status: 'in-progress'
          });
        }
      }

      // Add items based on documentation tree
      if (docTree.length === 0) {
        todoItems.push({
          id: 'create-docs',
          title: 'Create Documentation Structure',
          description: 'Initialize project documentation',
          type: 'documentation',
          priority: 'high',
          status: 'pending'
        });
      } else {
        doneItems.push({
          id: 'docs-structure',
          title: 'Documentation Structure Created',
          description: `${docTree.length} documentation nodes`,
          type: 'documentation',
          priority: 'medium',
          status: 'completed'
        });
      }

      // Add items based on diagrams
      if (diagrams.length === 0) {
        todoItems.push({
          id: 'create-architecture',
          title: 'Create Architecture Diagrams',
          description: 'Document system architecture',
          type: 'planning',
          priority: 'medium',
          status: 'pending'
        });
      } else {
        doneItems.push({
          id: 'architecture-diagrams',
          title: 'Architecture Diagrams Created',
          description: `${diagrams.length} diagrams available`,
          type: 'planning',
          priority: 'medium',
          status: 'completed'
        });
      }

      // Ensure we have some baseline items
      if (todoItems.length === 0 && inProgressItems.length === 0 && doneItems.length === 0) {
        todoItems.push({
          id: 'analyze-project',
          title: 'Analyze Project Health',
          description: 'Run comprehensive project analysis',
          type: 'planning',
          priority: 'high',
          status: 'pending'
        });
      }

      return {
        columns: [
          {
            id: 'todo',
            title: 'To Do',
            items: todoItems
          },
          {
            id: 'in-progress',
            title: 'In Progress',
            items: inProgressItems
          },
          {
            id: 'done',
            title: 'Done',
            items: doneItems
          }
        ]
      };
    } catch (error) {
      // Fallback data if engine calls fail
      return {
        columns: [
          {
            id: 'todo',
            title: 'To Do',
            items: [
              {
                id: 'analyze-project',
                title: 'Analyze Project',
                description: 'Run initial project analysis',
                type: 'planning',
                priority: 'high',
                status: 'pending'
              }
            ]
          },
          {
            id: 'in-progress',
            title: 'In Progress',
            items: []
          },
          {
            id: 'done',
            title: 'Done',
            items: []
          }
        ]
      };
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
      .kanban-board {
        display: flex;
        gap: 12px;
        min-height: 300px;
        overflow-x: auto;
      }
      .kanban-column {
        flex: 1;
        min-width: 150px;
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 8px;
      }
      .column-header {
        font-weight: bold;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--vscode-panel-border);
        color: var(--vscode-foreground);
        cursor: pointer;
      }
      .column-header:hover {
        background: var(--vscode-list-hoverBackground);
      }
      .kanban-item {
        background: var(--vscode-list-activeSelectionBackground);
        border: 1px solid var(--vscode-list-activeSelectionBackground);
        border-radius: 3px;
        padding: 8px;
        margin-bottom: 6px;
        cursor: pointer;
      }
      .kanban-item:hover {
        background: var(--vscode-list-hoverBackground);
      }
      .item-title {
        font-weight: bold;
        margin-bottom: 4px;
        color: var(--vscode-list-activeSelectionForeground);
      }
      .item-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 4px;
      }
      .item-badges {
        display: flex;
        gap: 4px;
        align-items: center;
      }
      .badge {
        font-size: 10px;
        padding: 2px 4px;
        border-radius: 2px;
        text-transform: uppercase;
        font-weight: bold;
      }
      .priority-high { 
        background: var(--vscode-errorBackground);
        color: var(--vscode-errorForeground);
      }
      .priority-medium { 
        background: var(--vscode-inputValidation-warningBackground);
        color: var(--vscode-inputValidation-warningForeground);
      }
      .priority-low { 
        background: var(--vscode-inputValidation-infoBackground);
        color: var(--vscode-inputValidation-infoForeground);
      }
      .type-planning { background: var(--vscode-terminal-ansiBlue); color: white; }
      .type-implementation { background: var(--vscode-terminal-ansiGreen); color: white; }
      .type-testing { background: var(--vscode-terminal-ansiYellow); color: black; }
      .type-documentation { background: var(--vscode-terminal-ansiCyan); color: black; }
      
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
    <h1 class="sr-only">TDD Workflow Kanban Board</h1>
    <div id="root" class="loading">Loading TDD workflow...</div>
    <script>
      const vscode = acquireVsCodeApi();
      
      window.addEventListener('message', (event) => {
        const { type, payload } = event.data || {};
        const root = document.getElementById('root');
        
        if (type === 'update' && payload?.kanbanData) {
          // ✅ APPLY: Phase 4 safe UI update pattern
          root.innerHTML = '';
          root.className = '';
          
          const kanbanData = payload.kanbanData;
          const board = document.createElement('div');
          board.className = 'kanban-board';
          
          kanbanData.columns.forEach(column => {
            const columnDiv = document.createElement('div');
            columnDiv.className = 'kanban-column';
            
            const header = document.createElement('div');
            header.className = 'column-header';
            header.textContent = column.title + ' (' + column.items.length + ')';
            header.addEventListener('click', () => {
              vscode.postMessage({ type: 'column_clicked', payload: { columnId: column.id } });
            });
            columnDiv.appendChild(header);
            
            column.items.forEach(item => {
              const itemDiv = document.createElement('div');
              itemDiv.className = 'kanban-item';
              
              const title = document.createElement('div');
              title.className = 'item-title';
              title.textContent = item.title;
              itemDiv.appendChild(title);
              
              if (item.description) {
                const description = document.createElement('div');
                description.className = 'item-description';
                description.textContent = item.description;
                itemDiv.appendChild(description);
              }
              
              const badges = document.createElement('div');
              badges.className = 'item-badges';
              
              const priorityBadge = document.createElement('span');
              priorityBadge.className = 'badge priority-' + item.priority;
              priorityBadge.textContent = item.priority;
              badges.appendChild(priorityBadge);
              
              const typeBadge = document.createElement('span');
              typeBadge.className = 'badge type-' + item.type;
              typeBadge.textContent = item.type;
              badges.appendChild(typeBadge);
              
              itemDiv.appendChild(badges);
              
              itemDiv.addEventListener('click', () => {
                vscode.postMessage({ type: 'item_clicked', payload: { itemId: item.id } });
              });
              
              columnDiv.appendChild(itemDiv);
            });
            
            board.appendChild(columnDiv);
          });
          
          root.appendChild(board);
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
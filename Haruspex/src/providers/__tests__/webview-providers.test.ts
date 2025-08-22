/**
 * @fileoverview WebView Providers Tests - Phase 5 Implementation
 * @author Claude Code Implementation  
 * @created 2025-08-14
 * 
 * Comprehensive tests for WebView providers using Phase 4 integration patterns
 */

import * as vscode from 'vscode';
import { MermaidWebViewProvider } from '../mermaid-webview';
import { KanbanWebViewProvider } from '../kanban-webview';
import { TruthMatrixWebViewProvider } from '../truth-matrix-webview';
import { HaruspexCoreEngine } from '../../core/haruspex-core-engine';
import { TelemetryCollector } from '../../core/telemetry-collector';
import { MermaidDiagram } from '../../components/haruspex-mermaid-generator';
import { TruthMatrix } from '../../components/haruspex-truth-calculator';

// ✅ APPLY: Phase 4 inline VSCode mock pattern (prevents circular references)
jest.mock('vscode', () => ({
  WebviewViewProvider: jest.fn(),
  window: {
    registerWebviewViewProvider: jest.fn()
  },
  Uri: {
    parse: jest.fn().mockReturnValue({ toString: () => 'file:///tmp' })
  }
}));

describe('WebView Providers with Phase 4 Integration', () => {
  let mockEngine: jest.Mocked<HaruspexCoreEngine>;
  let mockTelemetry: jest.Mocked<TelemetryCollector>;
  let mockContext: vscode.ExtensionContext;

  const mockDiagrams: MermaidDiagram[] = [
    { 
      id: 'diagram1', 
      title: 'System Architecture',
      source: 'graph TD; A-->B',
      type: 'graph'
    },
    { 
      id: 'diagram2', 
      title: 'Component Relations',
      source: 'graph LR; C-->D',
      type: 'graph'
    }
  ];

  const mockTruthMatrix: TruthMatrix = {
    overallHealthScore: 85,
    filesAnalyzed: 42,
    healthMetrics: {
      codeQuality: 90,
      documentationCoverage: 75,
      architectureConsistency: 85,
      testCoverage: 80,
      dependencyHealth: 95,
      securityScore: 88
    }
  };

  beforeEach(() => {
    // ✅ APPLY: Phase 4 mock patterns for engine and telemetry
    mockEngine = {
      getMermaidDiagrams: jest.fn().mockResolvedValue(mockDiagrams),
      getTruthMatrix: jest.fn().mockResolvedValue(mockTruthMatrix),
      getDocumentationTree: jest.fn().mockResolvedValue([]),
    } as any;

    mockTelemetry = {
      recordEvent: jest.fn(),
      recordErrorEvent: jest.fn()
    } as any;

    mockContext = {
      extensionUri: vscode.Uri.parse('file:///tmp')
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('MermaidWebViewProvider with Phase 4 error isolation', () => {
    let provider: MermaidWebViewProvider;

    beforeEach(() => {
      provider = new MermaidWebViewProvider(mockContext, mockEngine, mockTelemetry);
    });

    describe('resolveWebviewView with Phase 4 conditional assignment patterns', () => {
      it('should initialize webview with Phase 4 conditional assignment patterns', () => {
        const mockWebview = {
          webview: {
            options: {},
            html: '',
            onDidReceiveMessage: jest.fn(),
            postMessage: jest.fn()
          }
        } as any;

        provider.resolveWebviewView(mockWebview);

        // Verify conditional property assignment worked
        expect(mockWebview.webview.options.enableScripts).toBe(true);
        expect(mockWebview.webview.options.localResourceRoots).toBeDefined();
        expect(mockTelemetry.recordEvent).toHaveBeenCalledWith('webview_provider_event',
          expect.objectContaining({
            event_type: 'mermaid_webview_initialized'
          })
        );
      });

      it('should handle initialization errors gracefully with fallback', () => {
        const mockWebview = null; // Simulate initialization failure

        // Should not throw error due to Phase 4 error isolation
        expect(() => provider.resolveWebviewView(mockWebview as any)).not.toThrow();
        
        expect(mockTelemetry.recordErrorEvent).toHaveBeenCalledWith('webview_init_failed', 'ui',
          expect.objectContaining({
            error_code: 'mermaid_webview_init_failed'
          })
        );
      });
    });

    describe('refresh with engine integration', () => {
      it('should populate diagrams from engine with telemetry tracking', async () => {
        const mockWebview = {
          webview: {
            postMessage: jest.fn().mockResolvedValue(true)
          }
        } as any;

        (provider as any).view = mockWebview;
        await provider.refresh();

        expect(mockEngine.getMermaidDiagrams).toHaveBeenCalled();
        expect(mockWebview.webview.postMessage).toHaveBeenCalledWith({
          type: 'update',
          payload: expect.objectContaining({
            diagrams: mockDiagrams
          })
        });
        expect(mockTelemetry.recordEvent).toHaveBeenCalledWith('webview_provider_event',
          expect.objectContaining({
            event_type: 'mermaid_webview_refreshed',
            diagram_count: 2
          })
        );
      });

      it('should handle refresh errors with user feedback', async () => {
        mockEngine.getMermaidDiagrams.mockRejectedValue(new Error('Engine failure'));
        
        const mockWebview = {
          webview: {
            postMessage: jest.fn().mockResolvedValue(true)
          }
        } as any;

        (provider as any).view = mockWebview;
        await provider.refresh();

        expect(mockTelemetry.recordErrorEvent).toHaveBeenCalledWith('webview_refresh_failed', 'ui',
          expect.objectContaining({
            error_code: 'mermaid_data_unavailable'
          })
        );
        expect(mockWebview.webview.postMessage).toHaveBeenCalledWith({
          type: 'error',
          payload: { message: 'Unable to load diagrams' }
        });
      });
    });

    describe('message handling with Phase 4 safety patterns', () => {
      it('should handle refresh messages safely', () => {
        const refreshSpy = jest.spyOn(provider, 'refresh').mockResolvedValue();
        
        (provider as any).handleMessage({ type: 'refresh' });
        
        expect(refreshSpy).toHaveBeenCalled();
      });

      it('should handle interaction events with telemetry', () => {
        (provider as any).handleMessage({ 
          type: 'diagram_clicked', 
          payload: { index: 0 } 
        });
        
        expect(mockTelemetry.recordEvent).toHaveBeenCalledWith('webview_interaction_event',
          expect.objectContaining({
            event_type: 'diagram_clicked'
          })
        );
      });

      it('should handle unknown messages safely', () => {
        // Should not throw error due to Phase 4 message safety
        expect(() => 
          (provider as any).handleMessage({ type: 'unknown_type' })
        ).not.toThrow();
      });
    });

    describe('HTML generation with Phase 4 theme patterns', () => {
      it('should generate theme-aware HTML with semantic colors', () => {
        const html = (provider as any).generateHtml();
        
        // Verify Phase 4 semantic color usage
        expect(html).toContain('var(--vscode-editor-background)');
        expect(html).toContain('var(--vscode-editor-foreground)');
        expect(html).toContain('var(--vscode-errorForeground)');
        expect(html).toContain('var(--vscode-panel-border)');
        
        // Verify accessibility
        expect(html).toContain('class="sr-only"');
        expect(html).toContain('Mermaid Architecture Diagrams');
      });
    });
  });

  describe('TruthMatrixWebViewProvider with health dashboard', () => {
    let provider: TruthMatrixWebViewProvider;

    beforeEach(() => {
      provider = new TruthMatrixWebViewProvider(mockContext, mockEngine, mockTelemetry);
    });

    describe('resolveWebviewView initialization', () => {
      it('should initialize with health dashboard configuration', () => {
        const mockWebview = {
          webview: {
            options: {},
            html: '',
            onDidReceiveMessage: jest.fn(),
            postMessage: jest.fn()
          }
        } as any;

        provider.resolveWebviewView(mockWebview);

        expect(mockTelemetry.recordEvent).toHaveBeenCalledWith('webview_provider_event',
          expect.objectContaining({
            event_type: 'truth_matrix_webview_initialized'
          })
        );
      });
    });

    describe('refresh with truth matrix data', () => {
      it('should populate health data from engine', async () => {
        const mockWebview = {
          webview: {
            postMessage: jest.fn().mockResolvedValue(true)
          }
        } as any;

        (provider as any).view = mockWebview;
        await provider.refresh();

        expect(mockEngine.getTruthMatrix).toHaveBeenCalled();
        expect(mockWebview.webview.postMessage).toHaveBeenCalledWith({
          type: 'update',
          payload: expect.objectContaining({
            truthMatrix: mockTruthMatrix
          })
        });
        expect(mockTelemetry.recordEvent).toHaveBeenCalledWith('webview_provider_event',
          expect.objectContaining({
            event_type: 'truth_matrix_webview_refreshed',
            health_score: 85,
            files_analyzed: 42
          })
        );
      });
    });

    describe('HTML generation for health dashboard', () => {
      it('should generate health dashboard HTML with metrics grid', () => {
        const html = (provider as any).generateHtml();
        
        expect(html).toContain('health-dashboard');
        expect(html).toContain('metrics-grid');
        expect(html).toContain('overall-score');
        expect(html).toContain('Truth Matrix Health Dashboard');
      });
    });
  });

  describe('KanbanWebViewProvider with TDD workflow', () => {
    let provider: KanbanWebViewProvider;

    beforeEach(() => {
      provider = new KanbanWebViewProvider(mockContext, mockEngine, mockTelemetry);
    });

    describe('generateKanbanData workflow analysis', () => {
      it('should generate kanban data based on project health', async () => {
        const kanbanData = await (provider as any).generateKanbanData();
        
        expect(kanbanData.columns).toHaveLength(3);
        expect(kanbanData.columns[0].id).toBe('todo');
        expect(kanbanData.columns[1].id).toBe('in-progress'); 
        expect(kanbanData.columns[2].id).toBe('done');
        
        // Should have items based on mock data
        const totalItems = kanbanData.columns.reduce((sum: number, col: any) => sum + col.items.length, 0);
        expect(totalItems).toBeGreaterThan(0);
      });

      it('should handle engine failures with fallback data', async () => {
        mockEngine.getTruthMatrix.mockRejectedValue(new Error('Engine failure'));
        mockEngine.getDocumentationTree.mockRejectedValue(new Error('Engine failure'));
        mockEngine.getMermaidDiagrams.mockRejectedValue(new Error('Engine failure'));

        const kanbanData = await (provider as any).generateKanbanData();
        
        // Should still return valid structure
        expect(kanbanData.columns).toHaveLength(3);
        expect(kanbanData.columns[0].items).toContainEqual(
          expect.objectContaining({
            id: 'analyze-project',
            title: 'Analyze Project'
          })
        );
      });
    });

    describe('HTML generation for kanban board', () => {
      it('should generate kanban board HTML with columns and items', () => {
        const html = (provider as any).generateHtml();
        
        expect(html).toContain('kanban-board');
        expect(html).toContain('kanban-column');
        expect(html).toContain('kanban-item');
        expect(html).toContain('TDD Workflow Kanban Board');
      });
    });
  });

  describe('Cross-provider integration patterns', () => {
    it('should all use consistent Phase 4 patterns', () => {
      const mermaidProvider = new MermaidWebViewProvider(mockContext, mockEngine, mockTelemetry);
      const kanbanProvider = new KanbanWebViewProvider(mockContext, mockEngine, mockTelemetry);
      const truthMatrixProvider = new TruthMatrixWebViewProvider(mockContext, mockEngine, mockTelemetry);

      // All should be instances of their respective classes
      expect(mermaidProvider).toBeInstanceOf(MermaidWebViewProvider);
      expect(kanbanProvider).toBeInstanceOf(KanbanWebViewProvider);
      expect(truthMatrixProvider).toBeInstanceOf(TruthMatrixWebViewProvider);
    });

    it('should all handle message routing safely', () => {
      const providers = [
        new MermaidWebViewProvider(mockContext, mockEngine, mockTelemetry),
        new KanbanWebViewProvider(mockContext, mockEngine, mockTelemetry),
        new TruthMatrixWebViewProvider(mockContext, mockEngine, mockTelemetry)
      ];

      providers.forEach(provider => {
        // Should not throw on unknown message types
        expect(() => 
          (provider as any).handleMessage({ type: 'unknown_message' })
        ).not.toThrow();
      });
    });
  });
});
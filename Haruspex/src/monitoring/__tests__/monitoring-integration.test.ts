/**---
 * title: [File Monitoring Integration Tests - Phase 6]
 * tags: [Testing, Integration, Phase6, Cross-Component, WebView]
 * provides: [Integration Tests, Phase 5 Provider Integration, Cross-Component Validation]
 * requires: [Phase 4 TreeProvider, Phase 5 WebView Providers, Optimized Batching Queue]
 * description: [Integration tests for file monitoring with Phase 5 validated components and cross-component coordination]
 * ---*/

import * as vscode from 'vscode';
import { DebouncedBatchingQueue } from '../optimized-file-watching';
import { createUpdateCoordinator } from '../update-coordinator';
import { DocumentationTreeProvider } from '../../providers/documentation-tree';
import { MermaidWebViewProvider } from '../../providers/mermaid-webview';
import { KanbanWebViewProvider } from '../../providers/kanban-webview'; 
import { TruthMatrixWebViewProvider } from '../../providers/truth-matrix-webview';
import { TelemetryCollector } from '../../core/telemetry-collector';
import { HaruspexCoreEngine } from '../../core/haruspex-core-engine';

// ✅ APPLY: Phase 5 inline VSCode mock pattern (prevents circular references)
jest.mock('vscode', () => ({
  WebviewViewProvider: jest.fn(),
  TreeDataProvider: jest.fn(),
  EventEmitter: jest.fn().mockImplementation(() => ({
    event: jest.fn(),
    fire: jest.fn(),
    dispose: jest.fn()
  })),
  TreeItem: jest.fn(),
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  },
  window: { 
    registerWebviewViewProvider: jest.fn(), 
    registerTreeDataProvider: jest.fn(),
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn()
  },
  workspace: {
    getConfiguration: jest.fn().mockReturnValue({
      get: jest.fn().mockReturnValue({}),
      update: jest.fn()
    }),
    workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }]
  },
  Uri: { 
    parse: jest.fn().mockReturnValue({ toString: () => 'file:///tmp', fsPath: '/tmp' }),
    file: jest.fn().mockReturnValue({ toString: () => 'file:///tmp', fsPath: '/tmp' })
  },
  ViewColumn: { One: 1 },
  WebviewPanel: jest.fn(),
  ConfigurationTarget: { Global: 1 }
}));

function createPhase5ValidatedMocks() {
  const calls: string[] = [];
  
  // Mock HaruspexCoreEngine with Phase 5 validated methods
  const mockEngine: jest.Mocked<HaruspexCoreEngine> = {
    getMermaidDiagrams: jest.fn().mockResolvedValue([
      { id: 'test-diagram', content: 'graph TD\nA --> B', filePath: '/test/file.md' }
    ]),
    getTruthMatrix: jest.fn().mockResolvedValue({ 
      overallHealthScore: 85, 
      filesAnalyzed: 5, 
      healthMetrics: { documentation: 0.8, implementation: 0.9 }
    }),
    getDocumentationTree: jest.fn().mockResolvedValue([
      { id: 'root', label: 'Documentation', children: [] }
    ]),
    // Add other required methods from the actual interface
    scanWorkspace: jest.fn().mockResolvedValue(undefined),
    calculateTruthMatrix: jest.fn().mockResolvedValue(undefined)
  } as any;

  // Mock TelemetryCollector with Phase 5 privacy-compliant patterns
  const mockTelemetry: jest.Mocked<TelemetryCollector> = {
    recordEvent: jest.fn(),
    recordErrorEvent: jest.fn(),
    // Add other required methods
    flush: jest.fn().mockResolvedValue(undefined),
    dispose: jest.fn()
  } as any;

  const mockContext = { 
    extensionUri: vscode.Uri.parse('file:///tmp'),
    subscriptions: [],
    workspaceState: {
      get: jest.fn(),
      update: jest.fn()
    },
    globalState: {
      get: jest.fn(),
      update: jest.fn()
    }
  } as any;

  // Create actual provider instances with mocked dependencies
  const treeProvider = new DocumentationTreeProvider(mockEngine, mockTelemetry);
  const mermaidProvider = new MermaidWebViewProvider(mockContext, mockEngine, mockTelemetry);
  const kanbanProvider = new KanbanWebViewProvider(mockContext, mockEngine, mockTelemetry);
  const truthMatrixProvider = new TruthMatrixWebViewProvider(mockContext, mockEngine, mockTelemetry);

  // Spy on refresh methods to track calls
  const treeRefreshSpy = jest.spyOn(treeProvider, 'refresh').mockReturnValue(undefined);
  const mermaidRefreshSpy = jest.spyOn(mermaidProvider, 'refresh').mockResolvedValue();
  const kanbanRefreshSpy = jest.spyOn(kanbanProvider, 'refresh').mockResolvedValue();
  const truthMatrixRefreshSpy = jest.spyOn(truthMatrixProvider, 'refresh').mockResolvedValue();

  return {
    deps: {
      // ✅ READY: Use actual Phase 4/5 provider classes with mocked dependencies
      tree: treeProvider,
      mermaidWebView: mermaidProvider,
      kanbanWebView: kanbanProvider,
      truthMatrixWebView: truthMatrixProvider,
      telemetry: mockTelemetry
    },
    spies: {
      treeRefresh: treeRefreshSpy,
      mermaidRefresh: mermaidRefreshSpy,
      kanbanRefresh: kanbanRefreshSpy,
      truthMatrixRefresh: truthMatrixRefreshSpy
    },
    mocks: {
      engine: mockEngine,
      telemetry: mockTelemetry,
      context: mockContext
    }
  } as const;
}

describe('File monitoring integration with Phase 5 validated components', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Cross-component update coordination', () => {
    it('coalesces file change bursts into coordinated UI refreshes', done => {
      const { deps, spies, mocks } = createPhase5ValidatedMocks();
      const handle = createUpdateCoordinator(deps);
      const q = new DebouncedBatchingQueue({ 
        debounceMs: 50,    // Based on Phase 5 throttling success
        maxBatchSize: 100, 
        maxWaitMs: 150 
      });
      
      q.onFlush(handle.handleFileBatch);

      // Simulate burst of file changes
      for (let i = 0; i < 25; i++) {
        q.enqueue({ path: `f${i}.ts`, kind: 'change', timestamp: Date.now() });
      }

      // ✅ APPLY: Phase 5 callback-based async test pattern
      setTimeout(() => {
        try {
          // Verify all components were refreshed
          expect(spies.treeRefresh).toHaveBeenCalled();
          expect(spies.mermaidRefresh).toHaveBeenCalled();
          expect(spies.kanbanRefresh).toHaveBeenCalled();
          expect(spies.truthMatrixRefresh).toHaveBeenCalled();

          // Verify Phase 5 telemetry pattern applied
          expect(mocks.telemetry.recordEvent).toHaveBeenCalledWith('file_monitoring_event',
            expect.objectContaining({
              event_type: 'file_batch_applied',
              batch_size: 25,
              affected_components: 4
            })
          );

          q.dispose();
          done();
        } catch (e) {
          q.dispose();
          done(e);
        }
      }, 250);
    });

    it('handles cross-component update errors with Phase 5 error isolation', async () => {
      const { deps, spies, mocks } = createPhase5ValidatedMocks();
      
      // Force one component to fail
      spies.mermaidRefresh.mockRejectedValueOnce(new Error('Mock failure'));
      
      const coordinator = createUpdateCoordinator(deps);
      
      // Should not throw due to Phase 5 error boundary patterns
      await expect(coordinator.handleFileBatch([
        { path: 'test.ts', kind: 'change', timestamp: Date.now() }
      ])).resolves.not.toThrow();
      
      // Verify error was recorded using Phase 5 error telemetry pattern
      expect(mocks.telemetry.recordErrorEvent).toHaveBeenCalledWith('file_monitoring_failed', 'system',
        expect.objectContaining({
          error_code: 'cross_component_update_failed'
        })
      );

      // Verify other components were still attempted
      expect(spies.treeRefresh).toHaveBeenCalled();
      expect(spies.kanbanRefresh).toHaveBeenCalled();
      expect(spies.truthMatrixRefresh).toHaveBeenCalled();
    });

    it('maintains performance targets during coordination', async () => {
      const { deps } = createPhase5ValidatedMocks();
      const coordinator = createUpdateCoordinator(deps);
      
      const startTime = Date.now();
      
      await coordinator.handleFileBatch([
        { path: 'perf-test.ts', kind: 'change', timestamp: Date.now() }
      ]);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200); // Performance target

      const metrics = coordinator.getMetrics();
      expect(metrics.lastUpdateDuration).toBeLessThan(200);
    });
  });

  describe('Performance monitoring and health checks', () => {
    it('tracks detailed performance metrics', async () => {
      const { deps } = createPhase5ValidatedMocks();
      const coordinator = createUpdateCoordinator(deps);
      
      // Process multiple batches
      await coordinator.handleFileBatch([
        { path: 'batch1.ts', kind: 'change', timestamp: Date.now() }
      ]);
      
      await coordinator.handleFileBatch([
        { path: 'batch2.ts', kind: 'change', timestamp: Date.now() },
        { path: 'batch3.ts', kind: 'delete', timestamp: Date.now() }
      ]);

      const metrics = coordinator.getMetrics();
      expect(metrics.totalBatches).toBe(2);
      expect(metrics.totalEvents).toBe(3);
      expect(metrics.successfulUpdates).toBe(8); // 4 components × 2 batches
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);

      // Verify component-specific timing
      expect(metrics.componentUpdateTimes.tree).toBeGreaterThanOrEqual(0);
      expect(metrics.componentUpdateTimes.mermaidWebView).toBeGreaterThanOrEqual(0);
      expect(metrics.componentUpdateTimes.kanbanWebView).toBeGreaterThanOrEqual(0);
      expect(metrics.componentUpdateTimes.truthMatrixWebView).toBeGreaterThanOrEqual(0);
    });

    it('provides health status assessment', async () => {
      const { deps } = createPhase5ValidatedMocks();
      const coordinator = createUpdateCoordinator(deps);
      
      await coordinator.handleFileBatch([
        { path: 'health-test.ts', kind: 'change', timestamp: Date.now() }
      ]);

      const health = coordinator.getHealthStatus();
      expect(health.healthy).toBe(true);
      expect(health.performance).toBeLessThan(200);
      expect(health.errorRate).toBeLessThan(0.1);
      expect(health.recommendations).toEqual([]);
    });

    it('detects performance degradation', async () => {
      const { deps, spies, mocks } = createPhase5ValidatedMocks();
      
      // Simulate slow component refresh
      spies.mermaidRefresh.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 300))
      );
      
      const coordinator = createUpdateCoordinator(deps);
      
      await coordinator.handleFileBatch([
        { path: 'slow-test.ts', kind: 'change', timestamp: Date.now() }
      ]);

      // Should record performance warning
      expect(mocks.telemetry.recordEvent).toHaveBeenCalledWith('file_monitoring_performance',
        expect.objectContaining({
          event_type: 'slow_coordination_detected'
        })
      );
    });
  });

  describe('Memory management and stability', () => {
    it('handles sustained file change load without memory leaks', async () => {
      const { deps } = createPhase5ValidatedMocks();
      const coordinator = createUpdateCoordinator(deps);
      
      // Simulate sustained load
      const promises: Promise<void>[] = [];
      for (let i = 0; i < 100; i++) {
        promises.push(coordinator.handleFileBatch([
          { path: `sustained${i}.ts`, kind: 'change', timestamp: Date.now() }
        ]));
      }
      
      await Promise.all(promises);

      const metrics = coordinator.getMetrics();
      expect(metrics.totalBatches).toBe(100);
      expect(metrics.totalEvents).toBe(100);
      
      // Should maintain performance
      expect(metrics.averageProcessingTime).toBeLessThan(300);
    });

    it('resets metrics correctly', () => {
      const { deps } = createPhase5ValidatedMocks();
      const coordinator = createUpdateCoordinator(deps);
      
      // Process some events
      coordinator.handleFileBatch([
        { path: 'reset-test.ts', kind: 'change', timestamp: Date.now() }
      ]);

      coordinator.resetMetrics();

      const metrics = coordinator.getMetrics();
      expect(metrics.totalBatches).toBe(0);
      expect(metrics.totalEvents).toBe(0);
      expect(metrics.successfulUpdates).toBe(0);
      expect(metrics.failedUpdates).toBe(0);
    });
  });

  describe('Error resilience', () => {
    it('continues functioning when all components fail', async () => {
      const { deps, spies, mocks } = createPhase5ValidatedMocks();
      
      // Make all components fail
      spies.treeRefresh.mockImplementation(() => { throw new Error('Tree failure'); });
      spies.mermaidRefresh.mockRejectedValue(new Error('Mermaid failure'));
      spies.kanbanRefresh.mockRejectedValue(new Error('Kanban failure'));
      spies.truthMatrixRefresh.mockRejectedValue(new Error('Truth matrix failure'));
      
      const coordinator = createUpdateCoordinator(deps);
      
      // Should not throw
      await expect(coordinator.handleFileBatch([
        { path: 'all-fail-test.ts', kind: 'change', timestamp: Date.now() }
      ])).resolves.not.toThrow();

      // Should record appropriate metrics
      const metrics = coordinator.getMetrics();
      expect(metrics.failedUpdates).toBe(4); // All 4 components failed
      expect(metrics.successfulUpdates).toBe(0);

      // Should still record telemetry
      expect(mocks.telemetry.recordEvent).toHaveBeenCalledWith('file_monitoring_event',
        expect.objectContaining({
          successful_components: 0,
          failed_components: 4
        })
      );
    });
  });
});
/**---
 * title: [Cross-Component Update Coordinator - Performance System]
 * tags: [Performance, Coordination, WebView, TreeProvider, Phase6]
 * provides: [UpdateCoordinator, createUpdateCoordinator, UpdateCoordinatorDeps]
 * requires: [Phase 4 TreeProvider, Phase 5 WebView Providers, TelemetryCollector]
 * description: [Coordinates file change updates across all UI components with error isolation and performance monitoring]
 * ---*/

import { DocumentationTreeProvider } from '../providers/documentation-tree';
import { MermaidWebViewProvider } from '../providers/mermaid-webview';
import { KanbanWebViewProvider } from '../providers/kanban-webview';
import { TruthMatrixWebViewProvider } from '../providers/truth-matrix-webview';
import { TelemetryCollector } from '../core/telemetry-collector';
import { FileChangeKind } from './optimized-file-watching';

export interface UpdateCoordinatorDeps {
  readonly tree: DocumentationTreeProvider;           // ✅ PROVEN: Phase 4 implementation
  readonly mermaidWebView: MermaidWebViewProvider;     // ✅ PROVEN: Phase 5 implementation  
  readonly kanbanWebView: KanbanWebViewProvider;       // ✅ PROVEN: Phase 5 implementation
  readonly truthMatrixWebView: TruthMatrixWebViewProvider; // ✅ PROVEN: Phase 5 implementation
  readonly telemetry: TelemetryCollector;              // ✅ PROVEN: Phase 5 privacy-compliant telemetry
}

export interface UpdateCoordinatorMetrics {
  totalBatches: number;
  totalEvents: number;
  averageProcessingTime: number;
  successfulUpdates: number;
  failedUpdates: number;
  lastUpdateDuration: number;
  componentUpdateTimes: {
    tree: number;
    mermaidWebView: number;
    kanbanWebView: number;
    truthMatrixWebView: number;
  };
}

/**
 * High-performance update coordinator for cross-component file change synchronization
 * 
 * Integrates with Phase 5 WebView foundation to provide coordinated updates across:
 * - Documentation Tree Provider (Phase 4)
 * - Mermaid WebView Provider (Phase 5)
 * - Kanban WebView Provider (Phase 5)
 * - Truth Matrix WebView Provider (Phase 5)
 * 
 * Performance targets:
 * - Total coordination time: <50ms overhead
 * - Individual component refresh: <200ms
 * - Error isolation: No single component failure affects others
 * - Memory stability: No leaks during sustained operation
 */
export function createUpdateCoordinator(deps: UpdateCoordinatorDeps) {
  let metrics: UpdateCoordinatorMetrics = {
    totalBatches: 0,
    totalEvents: 0,
    averageProcessingTime: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    lastUpdateDuration: 0,
    componentUpdateTimes: {
      tree: 0,
      mermaidWebView: 0,
      kanbanWebView: 0,
      truthMatrixWebView: 0
    }
  };

  /**
   * Handles a batch of file changes with coordinated UI updates
   * 
   * ✅ APPLIES: Phase 5 error isolation patterns
   * ✅ APPLIES: Phase 5 telemetry patterns  
   * ✅ APPLIES: Phase 5 performance monitoring
   * 
   * @param batch - Array of file change events to process
   * @returns Promise that resolves when all components have been updated
   */
  async function handleFileBatch(
    batch: readonly { path: string; kind: FileChangeKind; timestamp?: number }[]
  ): Promise<void> {
    const startTime = Date.now();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Update metrics
      metrics.totalBatches++;
      metrics.totalEvents += batch.length;

      // ✅ APPLY: Phase 5 error isolation pattern - Use Promise.allSettled for fault tolerance
      const componentStartTimes = {
        tree: Date.now(),
        mermaidWebView: Date.now(),
        kanbanWebView: Date.now(),
        truthMatrixWebView: Date.now()
      };

      const refreshPromises = [
        instrumentComponentRefresh('tree', Promise.resolve(deps.tree.refresh()), componentStartTimes.tree),
        instrumentComponentRefresh('mermaidWebView', deps.mermaidWebView.refresh(), componentStartTimes.mermaidWebView),
        instrumentComponentRefresh('kanbanWebView', deps.kanbanWebView.refresh(), componentStartTimes.kanbanWebView),
        instrumentComponentRefresh('truthMatrixWebView', deps.truthMatrixWebView.refresh(), componentStartTimes.truthMatrixWebView)
      ];

      // Coordinate all updates with error isolation
      const results = await Promise.allSettled(refreshPromises);
      
      // Count successful vs failed updates
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      metrics.successfulUpdates += successful;
      metrics.failedUpdates += failed;

      const totalDuration = Date.now() - startTime;
      metrics.lastUpdateDuration = totalDuration;
      metrics.averageProcessingTime = ((metrics.averageProcessingTime * (metrics.totalBatches - 1)) + totalDuration) / metrics.totalBatches;

      // ✅ APPLY: Phase 5 telemetry pattern - Privacy-safe event recording
      deps.telemetry.recordEvent('file_monitoring_event', {
        event_type: 'file_batch_applied',
        batch_id: batchId,
        batch_size: batch.length,
        processing_ms: totalDuration,
        successful_components: successful,
        failed_components: failed,
        // Privacy-safe: No file paths or user-specific data
        affected_components: 4,
        performance_healthy: totalDuration < 200
      });

      // Performance warning if coordination is slow
      if (totalDuration > 200) {
        console.warn(`UpdateCoordinator: Slow batch coordination - ${totalDuration}ms for ${batch.length} events`);
        
        deps.telemetry.recordEvent('file_monitoring_performance', {
          event_type: 'slow_coordination_detected',
          batch_id: batchId,
          processing_ms: totalDuration,
          batch_size: batch.length,
          component_times: metrics.componentUpdateTimes
        });
      }

      // Log failed component refreshes for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const componentNames = ['tree', 'mermaidWebView', 'kanbanWebView', 'truthMatrixWebView'];
          console.error(`UpdateCoordinator: ${componentNames[index]} refresh failed:`, result.reason);
        }
      });

    } catch (error) {
      // ✅ APPLY: Phase 5 error boundary pattern - Never crash the UI
      metrics.failedUpdates++;
      const errorDuration = Date.now() - startTime;
      
      deps.telemetry.recordErrorEvent('file_monitoring_failed', 'system', {
        error_code: 'cross_component_update_failed',
        batch_id: batchId,
        batch_size: batch.length,
        processing_ms: errorDuration,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't throw - file monitoring should never crash UI
      console.error('UpdateCoordinator: Batch update failed:', error);
    }
  }

  /**
   * Instrument individual component refresh with timing and error handling
   */
  async function instrumentComponentRefresh(
    componentName: keyof typeof metrics.componentUpdateTimes,
    refreshPromise: Promise<void>,
    startTime: number
  ): Promise<void> {
    try {
      await refreshPromise;
      metrics.componentUpdateTimes[componentName] = Date.now() - startTime;
    } catch (error) {
      metrics.componentUpdateTimes[componentName] = Date.now() - startTime;
      throw error; // Re-throw for Promise.allSettled to handle
    }
  }

  /**
   * Get current coordinator performance metrics
   */
  function getMetrics(): UpdateCoordinatorMetrics {
    return { ...metrics };
  }

  /**
   * Reset performance metrics (useful for testing and monitoring)
   */
  function resetMetrics(): void {
    metrics = {
      totalBatches: 0,
      totalEvents: 0,
      averageProcessingTime: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      lastUpdateDuration: 0,
      componentUpdateTimes: {
        tree: 0,
        mermaidWebView: 0,
        kanbanWebView: 0,
        truthMatrixWebView: 0
      }
    };
  }

  /**
   * Get health status of the coordinator
   */
  function getHealthStatus() {
    const recentPerformance = metrics.averageProcessingTime;
    const errorRate = metrics.totalBatches > 0 ? metrics.failedUpdates / (metrics.successfulUpdates + metrics.failedUpdates) : 0;
    
    return {
      healthy: recentPerformance < 200 && errorRate < 0.1,
      performance: recentPerformance,
      errorRate: errorRate,
      recommendations: recentPerformance > 200 ? ['Consider reducing batch size', 'Check component performance'] : []
    };
  }

  // Return coordinator interface
  return {
    handleFileBatch,
    getMetrics,
    resetMetrics,
    getHealthStatus
  };
}

/**
 * Type alias for the update coordinator function
 */
export type UpdateCoordinator = ReturnType<typeof createUpdateCoordinator>;
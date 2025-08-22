/**---
 * title: [Optimized File Watching - Performance System]
 * tags: [Performance, File Monitoring, Debouncing, Batching, Phase6]
 * provides: [DebouncedBatchingQueue, FileChangeKind, BatchingQueueOptions]
 * requires: [VSCode FileSystemWatcher, Phase 5 WebView Foundation]
 * description: [High-performance debounced batching queue for file change events with <200ms target latency]
 * ---*/

export type FileChangeKind = 'create' | 'change' | 'delete';

export interface FileChangeEvent {
  readonly path: string;
  readonly kind: FileChangeKind;
  readonly timestamp: number;
}

export interface BatchingQueueOptions {
  readonly debounceMs: number; // Target: 75-150ms for optimal responsiveness
  readonly maxBatchSize: number; // Safety cap to prevent memory issues
  readonly maxWaitMs: number; // Force flush even if events keep arriving
}

export interface BatchingQueue {
  enqueue(event: FileChangeEvent): void;
  onFlush(handler: (batch: readonly FileChangeEvent[]) => void): void;
  dispose(): void;
}

/**
 * High-performance debounced batching queue optimized for VSCode file monitoring
 * 
 * Performance Characteristics:
 * - Target processing latency: <100ms
 * - Memory optimization: Automatic queue management
 * - Burst handling: Intelligent batching under high-frequency changes
 * - Stability: Graceful degradation under extreme load
 */
export class DebouncedBatchingQueue implements BatchingQueue {
  private readonly buffer: FileChangeEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private firstEventAt: number | null = null;
  private onFlushHandler: ((batch: readonly FileChangeEvent[]) => void) | null = null;
  private isDisposed = false;

  // Performance monitoring
  private batchCount = 0;
  private totalEventsProcessed = 0;
  private lastFlushDuration = 0;

  constructor(private readonly options: BatchingQueueOptions) {
    // Validate performance-critical options
    if (options.debounceMs < 25 || options.debounceMs > 500) {
      console.warn(`DebouncedBatchingQueue: debounceMs ${options.debounceMs} outside recommended range 25-500ms`);
    }
    if (options.maxBatchSize > 1000) {
      console.warn(`DebouncedBatchingQueue: maxBatchSize ${options.maxBatchSize} may impact performance`);
    }
  }

  onFlush(handler: (batch: readonly FileChangeEvent[]) => void): void {
    this.onFlushHandler = handler;
  }

  enqueue(event: FileChangeEvent): void {
    if (this.isDisposed) {
      console.warn('DebouncedBatchingQueue: Attempted to enqueue on disposed queue');
      return;
    }

    this.buffer.push(event);
    if (this.firstEventAt === null) {
      this.firstEventAt = Date.now();
    }

    // Immediate flush if batch size exceeded (performance safety)
    if (this.buffer.length >= this.options.maxBatchSize) {
      this.flush('maxBatchSize');
      return;
    }

    // Clear existing timer if present
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    // Calculate timing for optimal performance
    const elapsed = Date.now() - (this.firstEventAt ?? Date.now());
    const remaining = Math.max(0, this.options.debounceMs);
    const forceFlushIn = Math.max(0, this.options.maxWaitMs - elapsed);

    // Use shorter timeout for performance optimization
    this.flushTimer = setTimeout(() => {
      this.flush('debounce');
    }, Math.min(remaining, forceFlushIn));
  }

  dispose(): void {
    this.isDisposed = true;
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush of remaining events
    if (this.buffer.length > 0) {
      this.flush('dispose');
    }

    this.buffer.length = 0;
    this.firstEventAt = null;
    this.onFlushHandler = null;

    console.log(`DebouncedBatchingQueue: Disposed. Processed ${this.totalEventsProcessed} events in ${this.batchCount} batches`);
  }

  /**
   * Get performance metrics for monitoring and optimization
   */
  getPerformanceMetrics() {
    return {
      batchCount: this.batchCount,
      totalEventsProcessed: this.totalEventsProcessed,
      averageBatchSize: this.batchCount > 0 ? Math.round(this.totalEventsProcessed / this.batchCount) : 0,
      lastFlushDuration: this.lastFlushDuration,
      currentBufferSize: this.buffer.length,
      isHealthy: this.lastFlushDuration < 100 // <100ms processing target
    };
  }

  private flush(reason: 'debounce' | 'maxBatchSize' | 'dispose'): void {
    if (this.buffer.length === 0) return;

    const flushStartTime = Date.now();
    const batch = this.buffer.splice(0, this.buffer.length);
    this.firstEventAt = null;

    // Performance tracking
    this.batchCount++;
    this.totalEventsProcessed += batch.length;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Execute handler with performance monitoring
    if (this.onFlushHandler) {
      try {
        this.onFlushHandler(Object.freeze(batch));
        this.lastFlushDuration = Date.now() - flushStartTime;

        // Performance warning for optimization
        if (this.lastFlushDuration > 200) {
          console.warn(`DebouncedBatchingQueue: Slow flush detected - ${this.lastFlushDuration}ms for ${batch.length} events (reason: ${reason})`);
        }
      } catch (error) {
        console.error('DebouncedBatchingQueue: Handler error:', error);
        this.lastFlushDuration = Date.now() - flushStartTime;
      }
    }
  }
}

/**
 * Factory function for creating optimized batching queues with performance presets
 */
export function createOptimizedBatchingQueue(preset: 'fast' | 'balanced' | 'stable' = 'balanced'): DebouncedBatchingQueue {
  const presets = {
    fast: { debounceMs: 50, maxBatchSize: 25, maxWaitMs: 100 }, // Ultra-responsive
    balanced: { debounceMs: 100, maxBatchSize: 50, maxWaitMs: 250 }, // Recommended default
    stable: { debounceMs: 150, maxBatchSize: 100, maxWaitMs: 500 } // Conservative for large workspaces
  };

  return new DebouncedBatchingQueue(presets[preset]);
}
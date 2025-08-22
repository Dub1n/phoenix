/**---
 * title: [File Monitoring Performance Tests - Phase 6]
 * tags: [Testing, Performance, Phase6, Validation, Benchmarking]
 * provides: [Performance Tests, Latency Validation, Memory Stability Tests]
 * requires: [Performance Testing Utils, Monitoring Components]
 * description: [Performance validation tests ensuring <200ms latency targets and memory stability under sustained load]
 * ---*/

import { DebouncedBatchingQueue, createOptimizedBatchingQueue } from '../optimized-file-watching';
import { createUpdateCoordinator } from '../update-coordinator';

// Performance test helpers
function timeAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  return fn().then(result => ({ result, duration: Date.now() - start }));
}

function createMockUpdateCoordinatorDeps() {
  const refreshSpy = jest.fn().mockResolvedValue(undefined);
  
  return {
    tree: { refresh: refreshSpy },
    mermaidWebView: { refresh: refreshSpy },
    kanbanWebView: { refresh: refreshSpy },
    truthMatrixWebView: { refresh: refreshSpy },
    telemetry: {
      recordEvent: jest.fn(),
      recordErrorEvent: jest.fn()
    }
  } as any;
}

describe('File Monitoring Performance Validation', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Latency Performance Targets', () => {
    it('meets <200ms total update latency target', async () => {
      const deps = createMockUpdateCoordinatorDeps();
      const coordinator = createUpdateCoordinator(deps);
      
      const { duration } = await timeAsync(() => 
        coordinator.handleFileBatch([
          { path: 'latency-test.ts', kind: 'change', timestamp: Date.now() }
        ])
      );

      expect(duration).toBeLessThan(200); // Primary performance target
      
      const metrics = coordinator.getMetrics();
      expect(metrics.lastUpdateDuration).toBeLessThan(200);
    });

    it('maintains performance with varying batch sizes', async () => {
      const deps = createMockUpdateCoordinatorDeps();
      const coordinator = createUpdateCoordinator(deps);
      
      const batchSizes = [1, 5, 10, 25, 50];
      const results: Array<{ batchSize: number; duration: number }> = [];

      for (const size of batchSizes) {
        const batch = Array.from({ length: size }, (_, i) => ({
          path: `batch-${size}-file-${i}.ts`,
          kind: 'change' as const,
          timestamp: Date.now()
        }));

        const { duration } = await timeAsync(() => coordinator.handleFileBatch(batch));
        results.push({ batchSize: size, duration });
        
        expect(duration).toBeLessThan(200); // All batch sizes must meet target
      }

      // Verify scaling characteristics
      const maxDuration = Math.max(...results.map(r => r.duration));
      expect(maxDuration).toBeLessThan(200);
      
      console.log('Batch size performance results:', results);
    });

    it('achieves <100ms batching queue processing time', () => {
      return new Promise<void>((resolve, reject) => {
        const queue = createOptimizedBatchingQueue('fast');
        const startTime = Date.now();
        
        queue.onFlush((batch) => {
          try {
            const processingTime = Date.now() - startTime;
            expect(processingTime).toBeLessThan(100); // Fast processing target
            expect(batch.length).toBe(5);
            
            const metrics = queue.getPerformanceMetrics();
            expect(metrics.isHealthy).toBe(true);
            expect(metrics.lastFlushDuration).toBeLessThan(50); // Handler execution time
            
            queue.dispose();
            resolve();
          } catch (error) {
            queue.dispose();
            reject(error);
          }
        });

        // Enqueue events rapidly
        for (let i = 0; i < 5; i++) {
          queue.enqueue({ path: `fast-${i}.ts`, kind: 'change', timestamp: Date.now() });
        }
      });
    });
  });

  describe('High-Frequency Performance', () => {
    it('handles burst of 100 events within performance targets', async () => {
      const deps = createMockUpdateCoordinatorDeps();
      const coordinator = createUpdateCoordinator(deps);
      const queue = createOptimizedBatchingQueue('balanced');
      
      let totalEvents = 0;
      const startTime = Date.now();
      
      queue.onFlush(async (batch) => {
        totalEvents += batch.length;
        
        const coordinatorBatch = batch.map(event => ({
          path: event.path,
          kind: event.kind,
          timestamp: event.timestamp
        }));
        
        await coordinator.handleFileBatch(coordinatorBatch);
        
        if (totalEvents >= 100) {
          const totalTime = Date.now() - startTime;
          
          try {
            expect(totalTime).toBeLessThan(1000); // 1 second for 100 events
            
            const metrics = coordinator.getMetrics();
            expect(metrics.averageProcessingTime).toBeLessThan(200);
            
            queue.dispose();
          } catch (error) {
            queue.dispose();
            throw error;
          }
        }
      });

      // Generate burst of events
      for (let i = 0; i < 100; i++) {
        queue.enqueue({ 
          path: `burst-${i}.ts`, 
          kind: i % 3 === 0 ? 'create' : i % 3 === 1 ? 'change' : 'delete', 
          timestamp: Date.now() 
        });
      }

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
    });

    it('maintains performance under sustained load', async () => {
      const deps = createMockUpdateCoordinatorDeps();
      const coordinator = createUpdateCoordinator(deps);
      
      const sustainedDuration = 2000; // 2 seconds of sustained load
      const eventInterval = 50; // Event every 50ms
      const expectedEvents = sustainedDuration / eventInterval;
      
      const startTime = Date.now();
      let eventCount = 0;
      const durations: number[] = [];
      
      const intervalId = setInterval(async () => {
        if (Date.now() - startTime >= sustainedDuration) {
          clearInterval(intervalId);
          
          // Validate sustained performance
          expect(eventCount).toBeGreaterThanOrEqual(expectedEvents * 0.9); // Allow 10% tolerance
          
          const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
          expect(avgDuration).toBeLessThan(200);
          
          // Verify no performance degradation
          const recentDurations = durations.slice(-5);
          const recentAvg = recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length;
          expect(recentAvg).toBeLessThan(250); // Allow slight degradation but not excessive
          
          return;
        }
        
        const eventStart = Date.now();
        await coordinator.handleFileBatch([{
          path: `sustained-${eventCount}.ts`,
          kind: 'change',
          timestamp: Date.now()
        }]);
        
        durations.push(Date.now() - eventStart);
        eventCount++;
      }, eventInterval);
      
      // Wait for sustained test to complete
      await new Promise(resolve => setTimeout(resolve, sustainedDuration + 500));
    });
  });

  describe('Memory Stability', () => {
    it('maintains stable memory usage during long-running operation', async () => {
      const queue = createOptimizedBatchingQueue('stable');
      let processedBatches = 0;
      const targetBatches = 50;
      
      queue.onFlush((batch) => {
        processedBatches++;
        
        if (processedBatches >= targetBatches) {
          const metrics = queue.getPerformanceMetrics();
          
          // Verify no memory bloat in queue
          expect(metrics.currentBufferSize).toBeLessThanOrEqual(100); // Should be empty or small
          expect(metrics.isHealthy).toBe(true);
          
          // Performance should remain consistent
          expect(metrics.averageBatchSize).toBeGreaterThan(0);
          expect(metrics.averageBatchSize).toBeLessThan(50); // Reasonable batch sizes
          
          queue.dispose();
        }
      });

      // Generate events over time to trigger multiple batches
      for (let batch = 0; batch < targetBatches; batch++) {
        setTimeout(() => {
          for (let i = 0; i < 5; i++) {
            queue.enqueue({
              path: `memory-test-${batch}-${i}.ts`,
              kind: 'change',
              timestamp: Date.now()
            });
          }
        }, batch * 20); // Spread over time
      }

      // Wait for all batches to process
      await new Promise(resolve => setTimeout(resolve, (targetBatches * 20) + 1000));
    });

    it('handles memory pressure gracefully', () => {
      const queue = new DebouncedBatchingQueue({
        debounceMs: 10,
        maxBatchSize: 10, // Small batch size to force frequent flushes
        maxWaitMs: 50
      });
      
      let flushCount = 0;
      const memoryUsageSamples: number[] = [];
      
      queue.onFlush((batch) => {
        flushCount++;
        
        // Sample memory usage (simplified - in real test might use process.memoryUsage())
        const metrics = queue.getPerformanceMetrics();
        memoryUsageSamples.push(metrics.currentBufferSize);
        
        if (flushCount >= 20) {
          // Verify memory usage stays bounded
          const maxBufferSize = Math.max(...memoryUsageSamples);
          expect(maxBufferSize).toBeLessThanOrEqual(10); // Should respect maxBatchSize
          
          // Verify consistent performance
          expect(metrics.isHealthy).toBe(true);
          
          queue.dispose();
        }
      });

      // Generate high-frequency events to test memory pressure
      for (let i = 0; i < 200; i++) {
        setTimeout(() => {
          queue.enqueue({
            path: `pressure-${i}.ts`,
            kind: 'change',
            timestamp: Date.now()
          });
        }, i * 2); // Very rapid events
      }
    });
  });

  describe('Performance Presets Validation', () => {
    it('validates fast preset meets ultra-responsive targets', () => {
      return new Promise<void>((resolve, reject) => {
        const queue = createOptimizedBatchingQueue('fast');
        const startTime = Date.now();
        
        queue.onFlush((batch) => {
          try {
            const totalTime = Date.now() - startTime;
            expect(totalTime).toBeLessThan(75); // Ultra-fast target
            expect(batch.length).toBe(3);
            
            const metrics = queue.getPerformanceMetrics();
            expect(metrics.isHealthy).toBe(true);
            
            queue.dispose();
            resolve();
          } catch (error) {
            queue.dispose();
            reject(error);
          }
        });

        // Quick burst of events
        queue.enqueue({ path: 'fast1.ts', kind: 'change', timestamp: Date.now() });
        queue.enqueue({ path: 'fast2.ts', kind: 'change', timestamp: Date.now() });
        queue.enqueue({ path: 'fast3.ts', kind: 'change', timestamp: Date.now() });
      });
    });

    it('validates stable preset handles large workspaces', () => {
      return new Promise<void>((resolve, reject) => {
        const queue = createOptimizedBatchingQueue('stable');
        let batchCount = 0;
        
        queue.onFlush((batch) => {
          batchCount++;
          
          if (batchCount === 1) {
            try {
              expect(batch.length).toBeGreaterThanOrEqual(50); // Should wait for larger batches
              
              const metrics = queue.getPerformanceMetrics();
              expect(metrics.isHealthy).toBe(true);
              
              queue.dispose();
              resolve();
            } catch (error) {
              queue.dispose();
              reject(error);
            }
          }
        });

        // Generate many events to test large batch handling
        for (let i = 0; i < 50; i++) {
          queue.enqueue({ path: `stable${i}.ts`, kind: 'change', timestamp: Date.now() });
        }
      });
    });
  });
});
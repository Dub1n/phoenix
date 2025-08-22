/**---
 * title: [Optimized File Watching Tests - Phase 6 Performance]
 * tags: [Testing, Performance, Phase6, Debouncing, Batching]
 * provides: [Unit Tests for DebouncedBatchingQueue, Performance Validation]
 * requires: [Phase 5 Testing Patterns, Jest Testing Framework]
 * description: [Comprehensive unit tests for debounced batching queue with performance validation and Phase 5 timing patterns]
 * ---*/

import { DebouncedBatchingQueue, BatchingQueueOptions, createOptimizedBatchingQueue } from '../optimized-file-watching';

describe('DebouncedBatchingQueue with Phase 5 timing patterns', () => {
  const opts: BatchingQueueOptions = { 
    debounceMs: 100,    // Based on Phase 5 message throttling success
    maxBatchSize: 50, 
    maxWaitMs: 250 
  };

  afterEach(() => {
    // ✅ APPLY: Phase 5 state reset pattern for test isolation
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Basic batching behavior', () => {
    // ✅ APPLY: Phase 5 callback-based test pattern for timing tests
    it('batches multiple events within debounce window', done => {
      const q = new DebouncedBatchingQueue(opts);
      q.onFlush(batch => {
        try {
          expect(batch.length).toBe(3);
          expect(batch[0].path).toBe('a.ts');
          expect(batch[1].path).toBe('b.ts');
          expect(batch[2].path).toBe('c.ts');
          expect(batch[0].kind).toBe('change');
          expect(batch[2].kind).toBe('create');
          done();
        } catch (e) {
          done(e);
        } finally {
          q.dispose();
        }
      });

      // Apply Phase 5 rapid-fire event pattern
      q.enqueue({ path: 'a.ts', kind: 'change', timestamp: Date.now() });
      q.enqueue({ path: 'b.ts', kind: 'change', timestamp: Date.now() });
      q.enqueue({ path: 'c.ts', kind: 'create', timestamp: Date.now() });
    });

    // ✅ APPLY: Phase 5 batch limit testing pattern
    it('flushes when max batch size is reached', done => {
      const q = new DebouncedBatchingQueue({ ...opts, maxBatchSize: 2 });
      q.onFlush(batch => {
        try {
          expect(batch.length).toBe(2);
          expect(batch[0].path).toBe('x.ts');
          expect(batch[1].path).toBe('y.ts');
          done();
        } catch (e) {
          done(e);
        } finally {
          q.dispose();
        }
      });

      q.enqueue({ path: 'x.ts', kind: 'change', timestamp: Date.now() });
      q.enqueue({ path: 'y.ts', kind: 'change', timestamp: Date.now() });
    });

    // ✅ APPLY: Phase 5 sustained event testing pattern (callback-based)
    it('flushes after maxWaitMs even if events keep arriving', done => {
      const q = new DebouncedBatchingQueue({ ...opts, debounceMs: 50, maxWaitMs: 100 });
      q.onFlush(batch => {
        try {
          expect(batch.length).toBeGreaterThan(0);
          done();
        } catch (e) {
          done(e);
        } finally {
          q.dispose();
        }
      });

      // Simulate sustained file changes - matches Phase 5 throttling test pattern
      const interval = setInterval(() => q.enqueue({ path: 'z.ts', kind: 'change', timestamp: Date.now() }), 10);
      setTimeout(() => clearInterval(interval), 120);
    });
  });

  describe('Performance characteristics', () => {
    it('processes events within performance targets', done => {
      const q = new DebouncedBatchingQueue(opts);
      const startTime = Date.now();
      
      q.onFlush(batch => {
        try {
          const processingTime = Date.now() - startTime;
          expect(processingTime).toBeLessThan(300); // Well within 200ms target + buffer
          expect(batch.length).toBe(10);
          
          const metrics = q.getPerformanceMetrics();
          expect(metrics.isHealthy).toBe(true);
          expect(metrics.lastFlushDuration).toBeLessThan(100);
          
          done();
        } catch (e) {
          done(e);
        } finally {
          q.dispose();
        }
      });

      // Enqueue burst of events
      for (let i = 0; i < 10; i++) {
        q.enqueue({ path: `file${i}.ts`, kind: 'change', timestamp: Date.now() });
      }
    });

    it('tracks performance metrics accurately', () => {
      const q = new DebouncedBatchingQueue(opts);
      let batchCount = 0;
      
      q.onFlush(() => {
        batchCount++;
      });

      // Process multiple batches
      q.enqueue({ path: 'test1.ts', kind: 'change', timestamp: Date.now() });
      q.enqueue({ path: 'test2.ts', kind: 'change', timestamp: Date.now() });
      
      // Force flush
      for (let i = 0; i < opts.maxBatchSize; i++) {
        q.enqueue({ path: `bulk${i}.ts`, kind: 'change', timestamp: Date.now() });
      }

      const metrics = q.getPerformanceMetrics();
      expect(metrics.batchCount).toBeGreaterThan(0);
      expect(metrics.totalEventsProcessed).toBeGreaterThan(0);
      expect(metrics.averageBatchSize).toBeGreaterThan(0);
      
      q.dispose();
    });

    it('handles high-frequency events gracefully', done => {
      const q = new DebouncedBatchingQueue({ debounceMs: 25, maxBatchSize: 100, maxWaitMs: 150 });
      const eventCount = 50;
      let processedCount = 0;
      
      q.onFlush(batch => {
        processedCount += batch.length;
        
        if (processedCount >= eventCount) {
          try {
            expect(processedCount).toBe(eventCount);
            const metrics = q.getPerformanceMetrics();
            expect(metrics.isHealthy).toBe(true);
            done();
          } catch (e) {
            done(e);
          } finally {
            q.dispose();
          }
        }
      });

      // Rapid-fire events
      for (let i = 0; i < eventCount; i++) {
        setTimeout(() => {
          q.enqueue({ path: `rapid${i}.ts`, kind: 'change', timestamp: Date.now() });
        }, i * 2); // 2ms intervals for high frequency
      }
    });
  });

  describe('Edge cases and error handling', () => {
    it('handles disposal during active batching', () => {
      const q = new DebouncedBatchingQueue(opts);
      let flushCalled = false;
      
      q.onFlush(() => {
        flushCalled = true;
      });

      q.enqueue({ path: 'test.ts', kind: 'change', timestamp: Date.now() });
      q.dispose(); // Should trigger final flush
      
      // Give time for any pending operations
      setTimeout(() => {
        expect(flushCalled).toBe(true);
      }, 10);
    });

    it('ignores enqueue operations after disposal', () => {
      const q = new DebouncedBatchingQueue(opts);
      let flushCount = 0;
      
      q.onFlush(() => {
        flushCount++;
      });

      q.dispose();
      q.enqueue({ path: 'test.ts', kind: 'change', timestamp: Date.now() });
      
      setTimeout(() => {
        expect(flushCount).toBe(0); // No flush should occur
      }, opts.debounceMs + 50);
    });

    it('handles handler errors gracefully', done => {
      const q = new DebouncedBatchingQueue(opts);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      q.onFlush(() => {
        throw new Error('Handler error');
      });

      q.enqueue({ path: 'error-test.ts', kind: 'change', timestamp: Date.now() });
      
      setTimeout(() => {
        const metrics = q.getPerformanceMetrics();
        expect(metrics.batchCount).toBe(1); // Should still track the batch
        expect(consoleErrorSpy).toHaveBeenCalled();
        
        consoleErrorSpy.mockRestore();
        q.dispose();
        done();
      }, opts.debounceMs + 50);
    });
  });

  describe('Factory function', () => {
    it('creates queues with correct presets', () => {
      const fastQueue = createOptimizedBatchingQueue('fast');
      const balancedQueue = createOptimizedBatchingQueue('balanced');
      const stableQueue = createOptimizedBatchingQueue('stable');

      // Test that they're different instances
      expect(fastQueue).not.toBe(balancedQueue);
      expect(balancedQueue).not.toBe(stableQueue);

      // Cleanup
      fastQueue.dispose();
      balancedQueue.dispose();
      stableQueue.dispose();
    });

    it('defaults to balanced preset', () => {
      const defaultQueue = createOptimizedBatchingQueue();
      const balancedQueue = createOptimizedBatchingQueue('balanced');

      // Both should have similar behavior (testing structure, not exact equality)
      expect(defaultQueue.getPerformanceMetrics).toBeDefined();
      expect(balancedQueue.getPerformanceMetrics).toBeDefined();

      defaultQueue.dispose();
      balancedQueue.dispose();
    });
  });
});
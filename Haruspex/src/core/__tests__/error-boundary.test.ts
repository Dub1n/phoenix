/**
 * Unit tests for ErrorBoundary implementation
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

import { ErrorBoundary, ErrorBoundaryConfig } from '../error-boundary';

// Mock setTimeout for testing retry delays
jest.useFakeTimers();

describe('ErrorBoundary', () => {
  const defaultConfig: ErrorBoundaryConfig = {
    isolationStrategy: 'component',
    recoveryStrategy: 'graceful-degradation',
    maxRetries: 3,
    retryDelay: 100
  };

  describe('Constructor', () => {
    it('should create error boundary with default configuration', () => {
      const boundary = new ErrorBoundary({ 
        isolationStrategy: 'component',
        recoveryStrategy: 'graceful-degradation'
      });
      expect(boundary).toBeInstanceOf(ErrorBoundary);
    });

    it('should set default values for retry strategy', () => {
      const boundary = new ErrorBoundary({
        isolationStrategy: 'component',
        recoveryStrategy: 'retry'
      });
      expect(boundary).toBeInstanceOf(ErrorBoundary);
    });
  });

  describe('Synchronous Operations (wrap)', () => {
    let boundary: ErrorBoundary;

    beforeEach(() => {
      boundary = new ErrorBoundary(defaultConfig);
    });

    it('should execute successful synchronous operations', () => {
      const factory = jest.fn().mockReturnValue('success');
      
      const result = boundary.wrap(factory, 'test-context');
      
      expect(factory).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should return null when synchronous operation throws', () => {
      const factory = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = boundary.wrap(factory, 'test-context');
      
      expect(factory).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should track errors from synchronous operations', () => {
      const factory = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      boundary.wrap(factory, 'test-context');
      
      const metrics = boundary.getMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByContext['test-context']).toBe(1);
    });
  });

  describe('Asynchronous Operations (execute)', () => {
    let boundary: ErrorBoundary;

    beforeEach(() => {
      boundary = new ErrorBoundary(defaultConfig);
    });

    it('should execute successful async operations', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await boundary.execute(operation, 'test-context');
      
      expect(operation).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should return null when async operation fails with graceful degradation', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const result = await boundary.execute(operation, 'test-context');
      
      expect(operation).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should track errors from async operations', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await boundary.execute(operation, 'test-context');
      
      const metrics = boundary.getMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByContext['test-context']).toBe(1);
    });
  });

  describe('Retry Strategy', () => {
    let boundary: ErrorBoundary;

    beforeEach(() => {
      boundary = new ErrorBoundary({
        isolationStrategy: 'component',
        recoveryStrategy: 'retry',
        maxRetries: 2,
        retryDelay: 100
      });
    });

    it('should retry failed operations up to max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const promise = boundary.execute(operation, 'test-context');
      
      // Fast-forward through all retry delays
      jest.runAllTimers();
      await promise;
      
      // Should call original + 2 retries = 3 total calls
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should succeed on retry if operation recovers', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');
      
      const promise = boundary.execute(operation, 'test-context');
      
      // Fast-forward through retry delays
      jest.runAllTimers();
      const result = await promise;
      
      expect(operation).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    it('should use exponential backoff for retry delays', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      const originalSetTimeout = global.setTimeout;
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      const promise = boundary.execute(operation, 'test-context');
      
      // Advance timers step by step to check delays
      jest.advanceTimersByTime(100); // First retry delay
      jest.advanceTimersByTime(200); // Second retry delay (exponential backoff)
      
      await promise;
      
      // Should have called setTimeout with increasing delays
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100); // First retry
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 200); // Second retry
      
      setTimeoutSpy.mockRestore();
    });

    it('should count successful recoveries in metrics', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');
      
      const promise = boundary.execute(operation, 'test-context');
      jest.runAllTimers();
      await promise;
      
      const metrics = boundary.getMetrics();
      expect(metrics.recoverySuccessRate).toBeGreaterThan(0);
    });
  });

  describe('Fail-Fast Strategy', () => {
    let boundary: ErrorBoundary;

    beforeEach(() => {
      boundary = new ErrorBoundary({
        isolationStrategy: 'component',
        recoveryStrategy: 'fail-fast'
      });
    });

    it('should re-throw errors immediately with fail-fast strategy', async () => {
      const testError = new Error('Test error');
      const operation = jest.fn().mockRejectedValue(testError);
      
      await expect(boundary.execute(operation, 'test-context')).rejects.toThrow('Test error');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Context Tracking', () => {
    let boundary: ErrorBoundary;

    beforeEach(() => {
      boundary = new ErrorBoundary(defaultConfig);
    });

    it('should track errors by context', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await boundary.execute(operation, 'context-1');
      await boundary.execute(operation, 'context-1');
      await boundary.execute(operation, 'context-2');
      
      const metrics = boundary.getMetrics();
      expect(metrics.errorsByContext['context-1']).toBe(2);
      expect(metrics.errorsByContext['context-2']).toBe(1);
    });

    it('should identify problematic contexts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Generate multiple errors for same context
      for (let i = 0; i < 6; i++) {
        await boundary.execute(operation, 'problematic-context');
      }
      
      expect(boundary.isContextProblematic('problematic-context')).toBe(true);
      expect(boundary.isContextProblematic('good-context')).toBe(false);
    });

    it('should provide recent errors for specific contexts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await boundary.execute(operation, 'test-context');
      await boundary.execute(operation, 'other-context');
      await boundary.execute(operation, 'test-context');
      
      const recentErrors = boundary.getRecentErrorsForContext('test-context');
      expect(recentErrors).toHaveLength(2);
      expect(recentErrors[0].context).toBe('test-context');
    });
  });

  describe('Fallback Operations', () => {
    let boundary: ErrorBoundary;

    beforeEach(() => {
      boundary = new ErrorBoundary(defaultConfig);
    });

    it('should execute operation and return result on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const fallback = 'fallback-value';
      
      const result = await boundary.executeWithFallback(operation, fallback, 'test-context');
      
      expect(result).toBe('success');
    });

    it('should return fallback value when operation fails', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      const fallback = 'fallback-value';
      
      const result = await boundary.executeWithFallback(operation, fallback, 'test-context');
      
      expect(result).toBe('fallback-value');
    });
  });

  describe('Metrics and Monitoring', () => {
    let boundary: ErrorBoundary;

    beforeEach(() => {
      boundary = new ErrorBoundary(defaultConfig);
    });

    it('should maintain recent errors list with size limit', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Generate more than 10 errors (should keep only last 10 recent)
      for (let i = 0; i < 15; i++) {
        await boundary.execute(operation, `context-${i}`);
      }
      
      const metrics = boundary.getMetrics();
      expect(metrics.totalErrors).toBe(15);
      expect(metrics.recentErrors.length).toBeLessThanOrEqual(10);
    });

    it('should calculate recovery success rate correctly', async () => {
      const boundary = new ErrorBoundary({
        isolationStrategy: 'component',
        recoveryStrategy: 'retry',
        maxRetries: 1,
        retryDelay: 10
      });

      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success'); // Succeeds on retry
      
      const promise = boundary.execute(operation, 'test-context');
      jest.runAllTimers();
      await promise;
      
      const metrics = boundary.getMetrics();
      expect(metrics.recoverySuccessRate).toBe(1.0); // 100% success rate
    });

    it('should reset all metrics when reset is called', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await boundary.execute(operation, 'test-context');
      boundary.reset();
      
      const metrics = boundary.getMetrics();
      expect(metrics.totalErrors).toBe(0);
      expect(metrics.errorsByContext).toEqual({});
      expect(metrics.recentErrors).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    let boundary: ErrorBoundary;

    beforeEach(() => {
      boundary = new ErrorBoundary(defaultConfig);
    });

    it('should handle operations returning null or undefined', async () => {
      const nullOperation = jest.fn().mockResolvedValue(null);
      const undefinedOperation = jest.fn().mockResolvedValue(undefined);
      
      const nullResult = await boundary.execute(nullOperation, 'null-context');
      const undefinedResult = await boundary.execute(undefinedOperation, 'undefined-context');
      
      expect(nullResult).toBeNull();
      expect(undefinedResult).toBeUndefined();
    });

    it('should handle synchronous errors in async operations', async () => {
      const operation = jest.fn().mockImplementation(() => {
        throw new Error('Synchronous error in async operation');
      });
      
      const result = await boundary.execute(operation, 'test-context');
      
      expect(result).toBeNull();
      expect(boundary.getMetrics().totalErrors).toBe(1);
    });

    it('should handle empty context names', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await boundary.execute(operation, '');
      
      const metrics = boundary.getMetrics();
      expect(metrics.errorsByContext['']).toBe(1);
    });
  });
});

// Restore real timers after all tests
afterAll(() => {
  jest.useRealTimers();
});
/**
 * Unit tests for CircuitBreaker implementation
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

import { CircuitBreaker, CircuitBreakerConfig } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  const defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 3,
    recoveryTimeout: 1000,
    monitorWindow: 5000
  };

  describe('Constructor', () => {
    it('should create circuit breaker with valid configuration', () => {
      const breaker = new CircuitBreaker(defaultConfig);
      expect(breaker).toBeInstanceOf(CircuitBreaker);
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should throw error for invalid failure threshold', () => {
      const invalidConfig = { ...defaultConfig, failureThreshold: 0 };
      expect(() => new CircuitBreaker(invalidConfig)).toThrow('failureThreshold must be greater than 0');
    });

    it('should throw error for invalid recovery timeout', () => {
      const invalidConfig = { ...defaultConfig, recoveryTimeout: -1 };
      expect(() => new CircuitBreaker(invalidConfig)).toThrow('recoveryTimeout must be greater than 0');
    });

    it('should throw error for invalid monitor window', () => {
      const invalidConfig = { ...defaultConfig, monitorWindow: 0 };
      expect(() => new CircuitBreaker(invalidConfig)).toThrow('monitorWindow must be greater than 0');
    });
  });

  describe('Circuit States', () => {
    let breaker: CircuitBreaker;

    beforeEach(() => {
      breaker = new CircuitBreaker(defaultConfig);
    });

    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should remain CLOSED after successful operations', async () => {
      const successfulOperation = jest.fn().mockResolvedValue('success');
      
      await breaker.executeWithFallback(successfulOperation, 'fallback');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should transition to OPEN after reaching failure threshold', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Execute operations to reach failure threshold
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        await breaker.executeWithFallback(failingOperation, 'fallback');
      }
      
      expect(breaker.getState()).toBe('OPEN');
    });

    it('should return fallback immediately when OPEN', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Trigger circuit to open
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        await breaker.executeWithFallback(failingOperation, 'fallback');
      }
      
      // Reset mock to track subsequent calls
      failingOperation.mockClear();
      
      // This should return fallback immediately without calling operation
      const result = await breaker.executeWithFallback(failingOperation, 'fallback');
      
      expect(result).toBe('fallback');
      expect(failingOperation).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after recovery timeout', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Trigger circuit to open
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        await breaker.executeWithFallback(failingOperation, 'fallback');
      }
      
      expect(breaker.getState()).toBe('OPEN');
      
      // Wait for recovery timeout
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          // Execute operation to trigger state check
          await breaker.executeWithFallback(jest.fn().mockResolvedValue('success'), 'fallback');
          expect(breaker.getState()).toBe('CLOSED');
          resolve();
        }, defaultConfig.recoveryTimeout + 100);
      });
    });

    it('should close circuit after successful operations in HALF_OPEN', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      const successOperation = jest.fn().mockResolvedValue('success');
      
      // Open circuit
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        await breaker.executeWithFallback(failingOperation, 'fallback');
      }
      
      // Wait for recovery timeout and simulate successful operations
      await new Promise(resolve => setTimeout(resolve, defaultConfig.recoveryTimeout + 100));
      
      // Execute enough successful operations to close circuit
      const requiredSuccesses = Math.ceil(defaultConfig.failureThreshold / 2);
      for (let i = 0; i < requiredSuccesses; i++) {
        await breaker.executeWithFallback(successOperation, 'fallback');
      }
      
      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('Operation Execution', () => {
    let breaker: CircuitBreaker;

    beforeEach(() => {
      breaker = new CircuitBreaker(defaultConfig);
    });

    it('should execute operation and return result when successful', async () => {
      const operation = jest.fn().mockResolvedValue('operation result');
      
      const result = await breaker.executeWithFallback(operation, 'fallback');
      
      expect(operation).toHaveBeenCalledTimes(1);
      expect(result).toBe('operation result');
    });

    it('should return fallback when operation fails', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const result = await breaker.executeWithFallback(operation, 'fallback');
      
      expect(operation).toHaveBeenCalledTimes(1);
      expect(result).toBe('fallback');
    });

    it('should reset failure count after successful operation', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      const successOperation = jest.fn().mockResolvedValue('success');
      
      // Fail some operations but not enough to open circuit
      for (let i = 0; i < defaultConfig.failureThreshold - 1; i++) {
        await breaker.executeWithFallback(failingOperation, 'fallback');
      }
      
      // Succeed once
      await breaker.executeWithFallback(successOperation, 'fallback');
      
      // Now fail again - should not immediately open circuit
      await breaker.executeWithFallback(failingOperation, 'fallback');
      
      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('Metrics', () => {
    let breaker: CircuitBreaker;

    beforeEach(() => {
      breaker = new CircuitBreaker(defaultConfig);
    });

    it('should track operation metrics', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      const failOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await breaker.executeWithFallback(successOperation, 'fallback');
      await breaker.executeWithFallback(failOperation, 'fallback');
      
      const metrics = breaker.getMetrics();
      
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.failures).toBe(1);
      expect(metrics.state).toBe('CLOSED');
    });

    it('should reset metrics when circuit is reset', async () => {
      const failOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Generate some metrics
      await breaker.executeWithFallback(failOperation, 'fallback');
      
      breaker.reset();
      const metrics = breaker.getMetrics();
      
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.failures).toBe(0);
      expect(metrics.state).toBe('CLOSED');
    });
  });

  describe('Edge Cases', () => {
    it('should handle synchronous exceptions in async operations', async () => {
      const breaker = new CircuitBreaker(defaultConfig);
      const operation = jest.fn().mockImplementation(() => {
        throw new Error('Synchronous error');
      });
      
      const result = await breaker.executeWithFallback(operation, 'fallback');
      
      expect(result).toBe('fallback');
      expect(breaker.getMetrics().failures).toBe(1);
    });

    it('should handle operations that return undefined', async () => {
      const breaker = new CircuitBreaker(defaultConfig);
      const operation = jest.fn().mockResolvedValue(undefined);
      
      const result = await breaker.executeWithFallback(operation, 'fallback');
      
      expect(result).toBeUndefined();
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should handle null fallback values', async () => {
      const breaker = new CircuitBreaker(defaultConfig);
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const result = await breaker.executeWithFallback(operation, null);
      
      expect(result).toBeNull();
    });
  });
});
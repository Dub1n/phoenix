/**
 * Circuit Breaker Implementation for Haruspex Core Engine
 * 
 * Provides failure detection and recovery patterns to prevent cascading failures
 * and enable graceful degradation of system functionality under stress.
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds before attempting recovery */
  recoveryTimeout: number;
  /** Time window in milliseconds for monitoring failures */
  monitorWindow: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  successCount: number;
  totalRequests: number;
}

/**
 * Circuit Breaker implementation with configurable failure thresholds and recovery strategies
 * 
 * States:
 * - CLOSED: Normal operation, requests flow through
 * - OPEN: Circuit is open, requests return fallback immediately
 * - HALF_OPEN: Testing recovery, limited requests allowed through
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailure = 0;
  private successCount = 0;
  private totalRequests = 0;

  constructor(private readonly config: CircuitBreakerConfig) {
    // Validate configuration
    if (config.failureThreshold <= 0) {
      throw new Error('failureThreshold must be greater than 0');
    }
    if (config.recoveryTimeout <= 0) {
      throw new Error('recoveryTimeout must be greater than 0');
    }
    if (config.monitorWindow <= 0) {
      throw new Error('monitorWindow must be greater than 0');
    }
  }

  /**
   * Execute an operation with circuit breaker protection
   * 
   * @param operation - The async operation to execute
   * @param fallback - Fallback value to return if circuit is open or operation fails
   * @returns Promise resolving to operation result or fallback
   */
  async executeWithFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    this.totalRequests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.config.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        // Circuit is still open, return fallback immediately
        return fallback;
      }
    }

    try {
      const result = await operation();
      
      // Operation succeeded
      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        // If we have enough successful operations in HALF_OPEN, close the circuit
        if (this.successCount >= Math.ceil(this.config.failureThreshold / 2)) {
          this.state = 'CLOSED';
          this.failures = 0;
        }
      } else if (this.state === 'CLOSED') {
        // Reset failure count on successful operation in CLOSED state
        this.failures = 0;
      }

      return result;
    } catch (error) {
      // Operation failed
      this.failures++;
      this.lastFailure = Date.now();

      // Check if we should open the circuit
      if (this.failures >= this.config.failureThreshold) {
        this.state = 'OPEN';
      } else if (this.state === 'HALF_OPEN') {
        // If operation fails in HALF_OPEN, go back to OPEN
        this.state = 'OPEN';
      }

      return fallback;
    }
  }

  /**
   * Get current circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailure,
      successCount: this.successCount,
      totalRequests: this.totalRequests
    };
  }

  /**
   * Reset the circuit breaker to initial state
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailure = 0;
    this.successCount = 0;
    this.totalRequests = 0;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }
}
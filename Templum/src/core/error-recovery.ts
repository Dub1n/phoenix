/**---
 * title: [Error Recovery - Circuit Breaker Implementation]
 * tags: [Core, ErrorRecovery, CircuitBreaker, Resilience]
 * provides: [CircuitBreaker, ErrorRecoveryConfig, FailureThreshold]
 * requires: [TemplumTypes, ErrorHandling]
 * description: [Circuit breaker implementation for Templum universal interface orchestrator with failure detection and recovery patterns]
 * ---*/

import { 
  isTemplumError, 
  createTemplumError, 
  Signals, 
  ErrorSignalPayload 
} from '../types/templum-types';
import { createLogger } from '../utils/logger';

export interface ErrorRecoveryConfig {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds before attempting recovery */
  recoveryTimeout: number;
  /** Time window in milliseconds for monitoring failures */
  monitorWindow: number;
  /** Enable telemetry and metrics collection */
  enableTelemetry?: boolean;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  successCount: number;
  totalRequests: number;
  interfaceSwitchingFailures: number;
  backendIntegrationFailures: number;
  stateManagementFailures: number;
}

/**
 * Circuit Breaker implementation adapted for Templum interface orchestration
 * 
 * Provides failure detection and recovery patterns to prevent cascading failures
 * and enable graceful degradation of system functionality under stress.
 * 
 * Optimized for Templum-specific operations:
 * - Interface switching (VSCode, CLI, Command)
 * - Backend service integration
 * - State synchronization across interfaces
 * 
 * States:
 * - CLOSED: Normal operation, requests flow through
 * - OPEN: Circuit is open, requests return fallback immediately
 * - HALF_OPEN: Testing recovery, limited requests allowed through
 */
export class TemplumCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailure = 0;
  private successCount = 0;
  private totalRequests = 0;
  
  // Templum-specific failure tracking
  private interfaceSwitchingFailures = 0;
  private backendIntegrationFailures = 0;
  private stateManagementFailures = 0;
  private readonly logger = createLogger('templum-circuit-breaker');

  constructor(private readonly config: ErrorRecoveryConfig) {
    // Validate configuration with Templum-specific defaults
    if (config.failureThreshold <= 0) {
      throw createTemplumError(
        'failureThreshold must be greater than 0',
        'INVALID_CONFIG_FAILURE_THRESHOLD',
        'configuration',
        { provided: config.failureThreshold }
      );
    }
    if (config.recoveryTimeout <= 0) {
      throw createTemplumError(
        'recoveryTimeout must be greater than 0',
        'INVALID_CONFIG_RECOVERY_TIMEOUT',
        'configuration',
        { provided: config.recoveryTimeout }
      );
    }
    if (config.monitorWindow <= 0) {
      throw createTemplumError(
        'monitorWindow must be greater than 0',
        'INVALID_CONFIG_MONITOR_WINDOW',
        'configuration',
        { provided: config.monitorWindow }
      );
    }
  }

  /**
   * Execute an operation with circuit breaker protection optimized for Templum operations
   * 
   * @param operation - The async operation to execute
   * @param fallback - Fallback value to return if circuit is open or operation fails
   * @param operationType - Type of Templum operation for failure classification
   * @returns Promise resolving to operation result or fallback
   */
  async executeWithFallback<T>(
    operation: () => Promise<T>, 
    fallback: T,
    operationType: 'interface-switch' | 'backend-integration' | 'state-management' | 'general' = 'general'
  ): Promise<T> {
    this.totalRequests++;

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.config.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        
        if (this.config.enableTelemetry) {
          this.emitStateChange('HALF_OPEN', 'Recovery attempt initiated');
        }
      } else {
        // Circuit is still open, return fallback immediately
        if (this.config.enableTelemetry) {
          this.emitCircuitOpen(operationType);
        }
        return fallback;
      }
    }

    try {
      const result = await operation();
      
      // Operation succeeded
      this.handleOperationSuccess(operationType);
      
      return result;
    } catch (error) {
      // Operation failed - handle with Templum error classification
      this.handleOperationFailure(error, operationType);
      
      if (this.config.enableTelemetry) {
        this.emitOperationError(error, operationType);
      }
      
      return fallback;
    }
  }

  private handleOperationSuccess(_operationType: string): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      // If we have enough successful operations in HALF_OPEN, close the circuit
      if (this.successCount >= Math.ceil(this.config.failureThreshold / 2)) {
        this.state = 'CLOSED';
        this.failures = 0;
        
        if (this.config.enableTelemetry) {
          this.emitStateChange('CLOSED', 'Circuit closed after successful recovery');
        }
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on successful operation in CLOSED state
      this.failures = 0;
    }
  }

  private handleOperationFailure(error: unknown, operationType: string): void {
    this.failures++;
    this.lastFailure = Date.now();

    // Track Templum-specific failure types
    switch (operationType) {
      case 'interface-switch':
        this.interfaceSwitchingFailures++;
        break;
      case 'backend-integration':
        this.backendIntegrationFailures++;
        break;
      case 'state-management':
        this.stateManagementFailures++;
        break;
    }

    // Check if we should open the circuit
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      
      if (this.config.enableTelemetry) {
        this.emitStateChange('OPEN', `Circuit opened after ${this.failures} failures`);
      }
    } else if (this.state === 'HALF_OPEN') {
      // If operation fails in HALF_OPEN, go back to OPEN
      this.state = 'OPEN';
      
      if (this.config.enableTelemetry) {
        this.emitStateChange('OPEN', 'Circuit opened after failure during recovery');
      }
    }
  }

  /**
   * Get current circuit breaker metrics with Templum-specific failure breakdown
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailure,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      interfaceSwitchingFailures: this.interfaceSwitchingFailures,
      backendIntegrationFailures: this.backendIntegrationFailures,
      stateManagementFailures: this.stateManagementFailures
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
    this.interfaceSwitchingFailures = 0;
    this.backendIntegrationFailures = 0;
    this.stateManagementFailures = 0;

    if (this.config.enableTelemetry) {
      this.emitStateChange('CLOSED', 'Circuit breaker manually reset');
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is healthy for specific operation type
   */
  isHealthyForOperation(operationType: string): boolean {
    if (this.state === 'OPEN') {
      return false;
    }
    
    // Additional health checks for specific Templum operations
    switch (operationType) {
      case 'interface-switch':
        // Allow if interface switching failures are less than 50% of total failures
        return this.interfaceSwitchingFailures < (this.failures * 0.5);
      case 'backend-integration':
        return this.backendIntegrationFailures < (this.failures * 0.7);
      case 'state-management':
        return this.stateManagementFailures < (this.failures * 0.6);
      default:
        return this.state === 'CLOSED' || this.state === 'HALF_OPEN';
    }
  }

  private emitStateChange(newState: CircuitState, reason: string): void {
    try {
      const payload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumCircuitBreaker',
        error: createTemplumError(
          `Circuit breaker state changed to ${newState}: ${reason}`,
          'CIRCUIT_STATE_CHANGE',
          'runtime',
          { 
            previousState: this.state,
            newState,
            reason,
            metrics: this.getMetrics()
          }
        ),
        severity: newState === 'OPEN' ? 'high' : 'medium'
      };

      // Emit via Node.js process event emitter (following Templum pattern)
      (process as any).emit('backend-integration:error' as Signals, payload);
    } catch (error) {
      // Silently handle telemetry errors to avoid affecting circuit breaker operation
      this.logger.warn('Failed to emit circuit breaker state change', {
        reason: isTemplumError(error) ? error.message : String(error),
        newState,
        previousState: this.state
      });
    }
  }

  private emitCircuitOpen(operationType: string): void {
    try {
      const payload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumCircuitBreaker',
        error: createTemplumError(
          `Circuit breaker is OPEN - operation rejected`,
          'CIRCUIT_BREAKER_OPEN',
          'runtime',
          { operationType, metrics: this.getMetrics() }
        ),
        severity: 'medium'
      };

      (process as any).emit('backend-integration:error' as Signals, payload);
    } catch (error) {
      this.logger.warn('Failed to emit circuit open event', {
        reason: isTemplumError(error) ? error.message : String(error),
        operationType
      });
    }
  }

  private emitOperationError(error: unknown, operationType: string): void {
    try {
      const templumError = isTemplumError(error) 
        ? error 
        : createTemplumError(
            error instanceof Error ? error.message : 'Unknown operation error',
            'OPERATION_ERROR',
            'runtime',
            { operationType, originalError: error }
          );

      const payload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumCircuitBreaker',
        error: templumError,
        severity: this.state === 'OPEN' ? 'high' : 'medium'
      };

      (process as any).emit('backend-integration:error' as Signals, payload);
    } catch (emitError) {
      this.logger.warn('Failed to emit operation error', {
        reason: isTemplumError(emitError) ? emitError.message : String(emitError),
        operationType
      });
    }
  }
}

/**
 * Factory function to create circuit breaker with Templum-optimized defaults
 */
export function createTemplumCircuitBreaker(overrides: Partial<ErrorRecoveryConfig> = {}): TemplumCircuitBreaker {
  const defaultConfig: ErrorRecoveryConfig = {
    failureThreshold: 5,        // Conservative for interface operations
    recoveryTimeout: 30000,     // 30 seconds - allows time for backend recovery
    monitorWindow: 60000,       // 1 minute monitoring window
    enableTelemetry: true       // Enable by default for production monitoring
  };

  const config = { ...defaultConfig, ...overrides };
  return new TemplumCircuitBreaker(config);
}

/**
 * Pre-configured circuit breaker for interface switching operations
 * Optimized for fast recovery with shorter timeouts
 */
export function createInterfaceSwitchCircuitBreaker(): TemplumCircuitBreaker {
  return createTemplumCircuitBreaker({
    failureThreshold: 3,        // Lower threshold for interface operations
    recoveryTimeout: 10000,     // 10 seconds - interfaces should recover quickly
    monitorWindow: 30000,       // 30 second window for interface monitoring
    enableTelemetry: true
  });
}

/**
 * Pre-configured circuit breaker for backend integration operations
 * More tolerant with longer recovery times for external services
 */
export function createBackendIntegrationCircuitBreaker(): TemplumCircuitBreaker {
  return createTemplumCircuitBreaker({
    failureThreshold: 7,        // Higher threshold for backend operations
    recoveryTimeout: 60000,     // 1 minute - backends may need longer recovery
    monitorWindow: 120000,      // 2 minute window for backend monitoring
    enableTelemetry: true
  });
}

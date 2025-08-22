/**
 * Error Boundary Implementation for Haruspex Core Engine
 * 
 * Provides component isolation and graceful error handling to prevent
 * failures in one component from affecting the entire system.
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

export type IsolationStrategy = 'component' | 'operation' | 'global';
export type RecoveryStrategy = 'graceful-degradation' | 'retry' | 'fail-fast';

export interface ErrorBoundaryConfig {
  /** How to isolate errors */
  isolationStrategy: IsolationStrategy;
  /** How to recover from errors */
  recoveryStrategy: RecoveryStrategy;
  /** Maximum number of retries for retry strategy */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
}

export interface ErrorContext {
  /** Component or operation identifier */
  context: string;
  /** Error that occurred */
  error: Error;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Number of retry attempts */
  retryCount: number;
}

export interface ErrorBoundaryMetrics {
  /** Total number of errors caught */
  totalErrors: number;
  /** Errors by context */
  errorsByContext: Record<string, number>;
  /** Recent errors (last 10) */
  recentErrors: ErrorContext[];
  /** Recovery success rate */
  recoverySuccessRate: number;
}

/**
 * Error Boundary implementation providing component isolation and recovery strategies
 * 
 * Supports multiple isolation and recovery strategies to handle different types of failures
 * while maintaining system stability and user experience.
 */
export class ErrorBoundary {
  private errors: ErrorContext[] = [];
  private errorsByContext: Record<string, number> = {};
  private recoveryAttempts = 0;
  private successfulRecoveries = 0;

  constructor(private readonly config: ErrorBoundaryConfig) {
    // Set default values
    if (config.recoveryStrategy === 'retry') {
      this.config.maxRetries = config.maxRetries ?? 3;
      this.config.retryDelay = config.retryDelay ?? 1000;
    }
  }

  /**
   * Wrap a synchronous operation with error boundary protection
   * 
   * @param factory - Function that creates/returns a value
   * @param context - Context identifier for error tracking
   * @returns Result of factory or null if error occurred
   */
  wrap<T>(factory: () => T, context = 'unknown'): T | null {
    try {
      return factory();
    } catch (error) {
      this.handleError(error as Error, context);
      return null;
    }
  }

  /**
   * Execute an async operation with error boundary protection
   * 
   * @param operation - Async operation to execute
   * @param context - Context identifier for error tracking
   * @param retryCount - Current retry attempt (internal use)
   * @returns Promise resolving to operation result or null if error occurred
   */
  async execute<T>(
    operation: () => Promise<T>, 
    context = 'unknown',
    retryCount = 0
  ): Promise<T | null> {
    try {
      const result = await operation();
      
      // If this was a retry that succeeded, count it as successful recovery
      if (retryCount > 0) {
        this.successfulRecoveries++;
      }
      
      return result;
    } catch (error) {
      const errorContext = this.handleError(error as Error, context, retryCount);
      
      // Apply recovery strategy
      if (this.config.recoveryStrategy === 'retry' && 
          retryCount < (this.config.maxRetries ?? 3)) {
        
        this.recoveryAttempts++;
        
        // Wait before retry
        if (this.config.retryDelay) {
          await this.delay(this.config.retryDelay * (retryCount + 1)); // Exponential backoff
        }
        
        // Retry the operation
        return this.execute(operation, context, retryCount + 1);
      } else if (this.config.recoveryStrategy === 'fail-fast') {
        // Re-throw the error for fail-fast strategy
        throw error;
      }
      
      // Default to graceful degradation - return null
      return null;
    }
  }

  /**
   * Execute an operation with a fallback value
   * 
   * @param operation - Operation to execute
   * @param fallback - Fallback value if operation fails
   * @param context - Context identifier
   * @returns Operation result or fallback value
   */
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallback: T,
    context = 'unknown'
  ): Promise<T> {
    const result = await this.execute(operation, context);
    return result !== null ? result : fallback;
  }

  /**
   * Check if a specific context has been problematic
   * 
   * @param context - Context to check
   * @param threshold - Error threshold (default: 5)
   * @returns True if context has exceeded error threshold
   */
  isContextProblematic(context: string, threshold = 5): boolean {
    return (this.errorsByContext[context] ?? 0) >= threshold;
  }

  /**
   * Get error boundary metrics
   */
  getMetrics(): ErrorBoundaryMetrics {
    const totalRecoveryAttempts = this.recoveryAttempts;
    const recoverySuccessRate = totalRecoveryAttempts > 0 
      ? this.successfulRecoveries / totalRecoveryAttempts 
      : 1.0;

    return {
      totalErrors: this.errors.length,
      errorsByContext: { ...this.errorsByContext },
      recentErrors: this.errors.slice(-10), // Last 10 errors
      recoverySuccessRate
    };
  }

  /**
   * Reset error boundary state
   */
  reset(): void {
    this.errors = [];
    this.errorsByContext = {};
    this.recoveryAttempts = 0;
    this.successfulRecoveries = 0;
  }

  /**
   * Get recent errors for a specific context
   */
  getRecentErrorsForContext(context: string, limit = 5): ErrorContext[] {
    return this.errors
      .filter(err => err.context === context)
      .slice(-limit);
  }

  private handleError(error: Error, context: string, retryCount = 0): ErrorContext {
    const errorContext: ErrorContext = {
      context,
      error,
      timestamp: Date.now(),
      retryCount
    };

    this.errors.push(errorContext);
    this.errorsByContext[context] = (this.errorsByContext[context] ?? 0) + 1;

    // Keep only recent errors in memory (last 100)
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    return errorContext;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
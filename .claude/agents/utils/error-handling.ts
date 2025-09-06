/**
 * Comprehensive Error Handling Framework
 * 
 * Error handling utilities with retry mechanisms, timeout handling, and audit trails.
 * Implements comprehensive error recovery patterns from design specification.
 * 
 * @created 2025-09-05-1824
 * @source dev/auto/subagent-workflow-integration-design.md lines 707-732
 */

import { HandoffError, HandoffErrorType } from '../interfaces/handoff-types.js';

/**
 * Retry configuration for error recovery
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number;  // milliseconds
  exponentialBackoff: boolean;
  retryableErrors: HandoffErrorType[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,    // 1 second
  maxDelay: 10000,    // 10 seconds
  exponentialBackoff: true,
  retryableErrors: [
    HandoffErrorType.FILE_ACCESS_ERROR,
    HandoffErrorType.TIMEOUT_ERROR,
    HandoffErrorType.AGENT_UNAVAILABLE
  ]
};

/**
 * Operation result with error handling
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: HandoffError;
  retryCount: number;
  totalTime: number;
}

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
  timeoutMs: number;
  onTimeout?: () => void;
  timeoutMessage?: string;
}

/**
 * Execute operation with retry logic and error handling
 * 
 * @param operation - Async operation to execute
 * @param config - Retry configuration
 * @returns Operation result with success/error information
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<OperationResult<T>> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  
  let lastError: HandoffError | undefined;
  let retryCount = 0;
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const data = await operation();
      return {
        success: true,
        data,
        retryCount,
        totalTime: Date.now() - startTime
      };
    } catch (error) {
      const handoffError = normalizeError(error);
      lastError = handoffError;
      retryCount++;
      
      // Check if error is retryable
      if (!retryConfig.retryableErrors.includes(handoffError.type) || 
          attempt >= retryConfig.maxRetries) {
        break;
      }
      
      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, retryConfig);
      await sleep(delay);
    }
  }
  
  return {
    success: false,
    error: lastError,
    retryCount,
    totalTime: Date.now() - startTime
  };
}

/**
 * Execute operation with timeout handling
 * 
 * @param operation - Async operation to execute
 * @param config - Timeout configuration
 * @returns Promise that resolves or rejects based on operation or timeout
 */
export async function executeWithTimeout<T>(
  operation: () => Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  const { timeoutMs, onTimeout, timeoutMessage } = config;
  
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (onTimeout) {
        onTimeout();
      }
      reject(createHandoffError(
        HandoffErrorType.TIMEOUT_ERROR,
        timeoutMessage || `Operation timed out after ${timeoutMs}ms`,
        'Increase timeout or optimize operation performance'
      ));
    }, timeoutMs);
    
    operation()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(normalizeError(error));
      });
  });
}

/**
 * Execute operation with both retry and timeout handling
 * 
 * @param operation - Async operation to execute
 * @param retryConfig - Retry configuration
 * @param timeoutConfig - Timeout configuration
 * @returns Operation result with comprehensive error handling
 */
export async function executeWithRetryAndTimeout<T>(
  operation: () => Promise<T>,
  retryConfig: Partial<RetryConfig> = {},
  timeoutConfig: TimeoutConfig
): Promise<OperationResult<T>> {
  return executeWithRetry(
    () => executeWithTimeout(operation, timeoutConfig),
    retryConfig
  );
}

/**
 * Create a standardized HandoffError
 * 
 * @param type - Error type
 * @param message - Error message
 * @param resolution - Suggested resolution
 * @param filePath - Optional file path
 * @param retryCount - Optional retry count
 * @returns HandoffError instance
 */
export function createHandoffError(
  type: HandoffErrorType,
  message: string,
  resolution: string,
  filePath?: string,
  retryCount?: number
): HandoffError {
  return {
    type,
    message,
    file_path: filePath,
    timestamp: new Date().toISOString(),
    suggested_resolution: resolution,
    retry_count: retryCount
  };
}

/**
 * Normalize various error types to HandoffError
 * 
 * @param error - Error to normalize
 * @returns HandoffError instance
 */
export function normalizeError(error: any): HandoffError {
  if (isHandoffError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    // Determine error type based on error properties
    let type = HandoffErrorType.FILE_ACCESS_ERROR;
    let resolution = 'Check file permissions and path validity';
    
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      type = HandoffErrorType.TIMEOUT_ERROR;
      resolution = 'Increase timeout or optimize operation performance';
    } else if (error.message.includes('ENOENT') || error.message.includes('not found')) {
      type = HandoffErrorType.FILE_ACCESS_ERROR;
      resolution = 'Verify file exists and check file permissions';
    } else if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      type = HandoffErrorType.FILE_ACCESS_ERROR;
      resolution = 'Check file permissions and user access rights';
    } else if (error.message.includes('validation') || error.message.includes('schema')) {
      type = HandoffErrorType.SCHEMA_VALIDATION_ERROR;
      resolution = 'Review and correct data structure according to schema';
    }
    
    return createHandoffError(type, error.message, resolution);
  }
  
  return createHandoffError(
    HandoffErrorType.FILE_ACCESS_ERROR,
    String(error),
    'Review error details and check system state'
  );
}

/**
 * Check if error is a HandoffError
 * 
 * @param error - Error to check
 * @returns true if error is HandoffError
 */
export function isHandoffError(error: any): error is HandoffError {
  return error && 
         typeof error === 'object' && 
         'type' in error && 
         'message' in error && 
         'timestamp' in error && 
         'suggested_resolution' in error &&
         Object.values(HandoffErrorType).includes(error.type);
}

/**
 * Calculate delay for retry attempts
 * 
 * @param attempt - Current attempt number (0-based)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  if (!config.exponentialBackoff) {
    return config.baseDelay;
  }
  
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
  
  return Math.min(jitteredDelay, config.maxDelay);
}

/**
 * Sleep utility for delays
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Error aggregation for multiple operations
 */
export class ErrorAggregator {
  private errors: HandoffError[] = [];
  
  /**
   * Add an error to the aggregation
   * 
   * @param error - Error to add
   */
  addError(error: HandoffError): void {
    this.errors.push(error);
  }
  
  /**
   * Check if there are any errors
   * 
   * @returns true if errors exist
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }
  
  /**
   * Get all errors
   * 
   * @returns Array of all errors
   */
  getErrors(): HandoffError[] {
    return [...this.errors];
  }
  
  /**
   * Get errors by type
   * 
   * @param type - Error type to filter by
   * @returns Array of errors of specified type
   */
  getErrorsByType(type: HandoffErrorType): HandoffError[] {
    return this.errors.filter(error => error.type === type);
  }
  
  /**
   * Create summary error from all aggregated errors
   * 
   * @returns Summary HandoffError
   */
  createSummaryError(): HandoffError {
    const errorCounts = this.getErrorCounts();
    const summary = Object.entries(errorCounts)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
    
    return createHandoffError(
      HandoffErrorType.FILE_ACCESS_ERROR,
      `Multiple errors occurred: ${summary}`,
      'Review individual errors and resolve each issue'
    );
  }
  
  /**
   * Get count of errors by type
   * 
   * @returns Object with error type counts
   */
  private getErrorCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const error of this.errors) {
      counts[error.type] = (counts[error.type] || 0) + 1;
    }
    
    return counts;
  }
  
  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
  }
}

/**
 * Circuit breaker for preventing cascade failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private maxFailures: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}
  
  /**
   * Execute operation through circuit breaker
   * 
   * @param operation - Operation to execute
   * @returns Promise with operation result
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw createHandoffError(
          HandoffErrorType.AGENT_UNAVAILABLE,
          'Circuit breaker is open',
          `Wait ${Math.ceil((this.resetTimeoutMs - (Date.now() - this.lastFailureTime)) / 1000)} seconds before retry`
        );
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.maxFailures) {
      this.state = 'open';
    }
  }
  
  /**
   * Get current circuit breaker state
   */
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
  
  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}
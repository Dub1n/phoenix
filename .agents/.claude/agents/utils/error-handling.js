"use strict";
/**
 * Comprehensive Error Handling Framework
 *
 * Error handling utilities with retry mechanisms, timeout handling, and audit trails.
 * Implements comprehensive error recovery patterns from design specification.
 *
 * @created 2025-09-05-1824
 * @source dev/auto/subagent-workflow-integration-design.md lines 707-732
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.ErrorAggregator = exports.DEFAULT_RETRY_CONFIG = void 0;
exports.executeWithRetry = executeWithRetry;
exports.executeWithTimeout = executeWithTimeout;
exports.executeWithRetryAndTimeout = executeWithRetryAndTimeout;
exports.createHandoffError = createHandoffError;
exports.normalizeError = normalizeError;
exports.isHandoffError = isHandoffError;
const handoff_types_js_1 = require("../interfaces/handoff-types.js");
/**
 * Default retry configuration
 */
exports.DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    exponentialBackoff: true,
    retryableErrors: [
        handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR,
        handoff_types_js_1.HandoffErrorType.TIMEOUT_ERROR,
        handoff_types_js_1.HandoffErrorType.AGENT_UNAVAILABLE
    ]
};
/**
 * Execute operation with retry logic and error handling
 *
 * @param operation - Async operation to execute
 * @param config - Retry configuration
 * @returns Operation result with success/error information
 */
async function executeWithRetry(operation, config = {}) {
    const retryConfig = { ...exports.DEFAULT_RETRY_CONFIG, ...config };
    const startTime = Date.now();
    let lastError;
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
        }
        catch (error) {
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
async function executeWithTimeout(operation, config) {
    const { timeoutMs, onTimeout, timeoutMessage } = config;
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            if (onTimeout) {
                onTimeout();
            }
            reject(createHandoffError(handoff_types_js_1.HandoffErrorType.TIMEOUT_ERROR, timeoutMessage || `Operation timed out after ${timeoutMs}ms`, 'Increase timeout or optimize operation performance'));
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
async function executeWithRetryAndTimeout(operation, retryConfig = {}, timeoutConfig) {
    return executeWithRetry(() => executeWithTimeout(operation, timeoutConfig), retryConfig);
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
function createHandoffError(type, message, resolution, filePath, retryCount) {
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
function normalizeError(error) {
    if (isHandoffError(error)) {
        return error;
    }
    if (error instanceof Error) {
        // Determine error type based on error properties
        let type = handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR;
        let resolution = 'Check file permissions and path validity';
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
            type = handoff_types_js_1.HandoffErrorType.TIMEOUT_ERROR;
            resolution = 'Increase timeout or optimize operation performance';
        }
        else if (error.message.includes('ENOENT') || error.message.includes('not found')) {
            type = handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR;
            resolution = 'Verify file exists and check file permissions';
        }
        else if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
            type = handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR;
            resolution = 'Check file permissions and user access rights';
        }
        else if (error.message.includes('validation') || error.message.includes('schema')) {
            type = handoff_types_js_1.HandoffErrorType.SCHEMA_VALIDATION_ERROR;
            resolution = 'Review and correct data structure according to schema';
        }
        return createHandoffError(type, error.message, resolution);
    }
    return createHandoffError(handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR, String(error), 'Review error details and check system state');
}
/**
 * Check if error is a HandoffError
 *
 * @param error - Error to check
 * @returns true if error is HandoffError
 */
function isHandoffError(error) {
    return error &&
        typeof error === 'object' &&
        'type' in error &&
        'message' in error &&
        'timestamp' in error &&
        'suggested_resolution' in error &&
        Object.values(handoff_types_js_1.HandoffErrorType).includes(error.type);
}
/**
 * Calculate delay for retry attempts
 *
 * @param attempt - Current attempt number (0-based)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt, config) {
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
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Error aggregation for multiple operations
 */
class ErrorAggregator {
    constructor() {
        this.errors = [];
    }
    /**
     * Add an error to the aggregation
     *
     * @param error - Error to add
     */
    addError(error) {
        this.errors.push(error);
    }
    /**
     * Check if there are any errors
     *
     * @returns true if errors exist
     */
    hasErrors() {
        return this.errors.length > 0;
    }
    /**
     * Get all errors
     *
     * @returns Array of all errors
     */
    getErrors() {
        return [...this.errors];
    }
    /**
     * Get errors by type
     *
     * @param type - Error type to filter by
     * @returns Array of errors of specified type
     */
    getErrorsByType(type) {
        return this.errors.filter(error => error.type === type);
    }
    /**
     * Create summary error from all aggregated errors
     *
     * @returns Summary HandoffError
     */
    createSummaryError() {
        const errorCounts = this.getErrorCounts();
        const summary = Object.entries(errorCounts)
            .map(([type, count]) => `${type}: ${count}`)
            .join(', ');
        return createHandoffError(handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR, `Multiple errors occurred: ${summary}`, 'Review individual errors and resolve each issue');
    }
    /**
     * Get count of errors by type
     *
     * @returns Object with error type counts
     */
    getErrorCounts() {
        const counts = {};
        for (const error of this.errors) {
            counts[error.type] = (counts[error.type] || 0) + 1;
        }
        return counts;
    }
    /**
     * Clear all errors
     */
    clear() {
        this.errors = [];
    }
}
exports.ErrorAggregator = ErrorAggregator;
/**
 * Circuit breaker for preventing cascade failures
 */
class CircuitBreaker {
    constructor(maxFailures = 5, resetTimeoutMs = 60000) {
        this.maxFailures = maxFailures;
        this.resetTimeoutMs = resetTimeoutMs;
        this.failures = 0;
        this.lastFailureTime = 0;
        this.state = 'closed';
    }
    /**
     * Execute operation through circuit breaker
     *
     * @param operation - Operation to execute
     * @returns Promise with operation result
     */
    async execute(operation) {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
                this.state = 'half-open';
            }
            else {
                throw createHandoffError(handoff_types_js_1.HandoffErrorType.AGENT_UNAVAILABLE, 'Circuit breaker is open', `Wait ${Math.ceil((this.resetTimeoutMs - (Date.now() - this.lastFailureTime)) / 1000)} seconds before retry`);
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.state = 'closed';
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.maxFailures) {
            this.state = 'open';
        }
    }
    /**
     * Get current circuit breaker state
     */
    getState() {
        return this.state;
    }
    /**
     * Reset circuit breaker to closed state
     */
    reset() {
        this.failures = 0;
        this.lastFailureTime = 0;
        this.state = 'closed';
    }
}
exports.CircuitBreaker = CircuitBreaker;

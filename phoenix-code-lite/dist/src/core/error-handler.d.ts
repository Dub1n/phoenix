/**
 * Error classification and severity levels
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum ErrorCategory {
    VALIDATION = "validation",
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    NETWORK = "network",
    FILE_SYSTEM = "file_system",
    CONFIGURATION = "configuration",
    SESSION = "session",
    WORKFLOW = "workflow",
    SYSTEM = "system",
    UNKNOWN = "unknown"
}
/**
 * Structured error information
 */
export interface ErrorInfo {
    id: string;
    timestamp: Date;
    severity: ErrorSeverity;
    category: ErrorCategory;
    source: string;
    message: string;
    originalError?: Error;
    context?: Record<string, any>;
    stackTrace?: string;
    sessionId?: string;
    userId?: string;
    recoverable: boolean;
    retryable: boolean;
}
/**
 * Error handling strategies
 */
export interface ErrorStrategy {
    name: string;
    canHandle: (error: ErrorInfo) => boolean;
    handle: (error: ErrorInfo) => Promise<ErrorHandlingResult>;
    priority: number;
}
export interface ErrorHandlingResult {
    handled: boolean;
    recovered: boolean;
    action: string;
    message?: string;
    retry?: boolean;
    data?: any;
}
/**
 * Comprehensive error handling system
 */
export declare class ErrorHandler {
    private auditLogger;
    private strategies;
    private errorHistory;
    private maxHistorySize;
    private errorCounts;
    constructor();
    /**
     * Handle an error with comprehensive processing
     */
    handleError(error: Error | string, context?: {
        source?: string;
        sessionId?: string;
        userId?: string;
        category?: ErrorCategory;
        severity?: ErrorSeverity;
        additionalContext?: Record<string, any>;
    }): Promise<ErrorHandlingResult>;
    /**
     * Register a custom error handling strategy
     */
    registerStrategy(strategy: ErrorStrategy): void;
    /**
     * Get error statistics
     */
    getErrorStats(): {
        totalErrors: number;
        errorsByCategory: Record<string, number>;
        errorsBySeverity: Record<string, number>;
        errorsBySource: Record<string, number>;
        recentErrors: ErrorInfo[];
        topErrors: {
            pattern: string;
            count: number;
        }[];
    };
    /**
     * Check if error pattern is recurring
     */
    isRecurringError(errorInfo: ErrorInfo): boolean;
    /**
     * Get error recovery suggestions
     */
    getRecoverySuggestions(errorInfo: ErrorInfo): string[];
    /**
     * Create structured error information
     */
    private createErrorInfo;
    /**
     * Infer error severity from error details
     */
    private inferSeverity;
    /**
     * Infer error category from error details
     */
    private inferCategory;
    /**
     * Check if error is recoverable
     */
    private isRecoverable;
    /**
     * Check if error is retryable
     */
    private isRetryable;
    /**
     * Execute appropriate error handling strategy
     */
    private executeStrategy;
    /**
     * Initialize default error handling strategies
     */
    private initializeDefaultStrategies;
    /**
     * Log error details
     */
    private logError;
    /**
     * Log error handling result
     */
    private logHandlingResult;
    /**
     * Store error in history
     */
    private storeErrorHistory;
    /**
     * Update error count statistics
     */
    private updateErrorCounts;
    /**
     * Create error pattern for counting
     */
    private createErrorPattern;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=error-handler.d.ts.map
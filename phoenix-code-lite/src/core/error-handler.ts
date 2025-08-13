/**---
 * title: [Error Handler - Core Infrastructure Component]
 * tags: [Core, Infrastructure, Error-Handling, Audit]
 * provides: [ErrorHandler Class, Error Severity/Category Enums, Strategy Registration, Statistics APIs]
 * requires: [Zod, AuditLogger]
 * description: [Comprehensive error handling system providing classification, strategies, auditing, and analytics for Phoenix Code Lite across CLI and workflow components.]
 * ---*/

import { z } from 'zod';
import { AuditLogger } from '../utils/audit-logger';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  FILE_SYSTEM = 'file_system',
  CONFIGURATION = 'configuration',
  SESSION = 'session',
  WORKFLOW = 'workflow',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
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
export class ErrorHandler {
  private auditLogger: AuditLogger;
  private strategies: ErrorStrategy[] = [];
  private errorHistory: Map<string, ErrorInfo[]> = new Map();
  private maxHistorySize: number = 1000;
  private errorCounts: Map<string, number> = new Map();

  constructor() {
    this.auditLogger = new AuditLogger('error-handler');
    this.initializeDefaultStrategies();
  }

  /**
   * Handle an error with comprehensive processing
   */
  public async handleError(
    error: Error | string,
    context?: {
      source?: string;
      sessionId?: string;
      userId?: string;
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      additionalContext?: Record<string, any>;
    }
  ): Promise<ErrorHandlingResult> {
    const errorInfo = this.createErrorInfo(error, context);
    
    try {
      // Log the error
      await this.logError(errorInfo);
      
      // Store in history
      this.storeErrorHistory(errorInfo);
      
      // Update error counts
      this.updateErrorCounts(errorInfo);
      
      // Find and execute appropriate strategy
      const result = await this.executeStrategy(errorInfo);
      
      // Log the handling result
      await this.logHandlingResult(errorInfo, result);
      
      return result;
      
    } catch (handlingError) {
      // Meta-error: error occurred while handling an error
      const fallbackResult: ErrorHandlingResult = {
        handled: false,
        recovered: false,
        action: 'fallback_logging',
        message: 'Error occurred during error handling'
      };
      
      console.error('Critical: Error handling failed:', handlingError);
      console.error('Original error:', errorInfo);
      
      return fallbackResult;
    }
  }

  /**
   * Register a custom error handling strategy
   */
  public registerStrategy(strategy: ErrorStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    errorsBySource: Record<string, number>;
    recentErrors: ErrorInfo[];
    topErrors: { pattern: string; count: number }[];
  } {
    const allErrors = Array.from(this.errorHistory.values()).flat();
    
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsBySource: Record<string, number> = {};
    
    for (const error of allErrors) {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      errorsBySource[error.source] = (errorsBySource[error.source] || 0) + 1;
    }
    
    const recentErrors = allErrors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    const topErrors = Array.from(this.errorCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));
    
    return {
      totalErrors: allErrors.length,
      errorsByCategory,
      errorsBySeverity,
      errorsBySource,
      recentErrors,
      topErrors
    };
  }

  /**
   * Check if error pattern is recurring
   */
  public isRecurringError(errorInfo: ErrorInfo): boolean {
    const pattern = this.createErrorPattern(errorInfo);
    const count = this.errorCounts.get(pattern) || 0;
    return count > 3; // Threshold for recurring errors
  }

  /**
   * Get error recovery suggestions
   */
  public getRecoverySuggestions(errorInfo: ErrorInfo): string[] {
    const suggestions: string[] = [];
    
    switch (errorInfo.category) {
      case ErrorCategory.VALIDATION:
        suggestions.push('Check input data format and types');
        suggestions.push('Verify required fields are provided');
        break;
        
      case ErrorCategory.NETWORK:
        suggestions.push('Check network connectivity');
        suggestions.push('Verify API endpoints and credentials');
        suggestions.push('Consider implementing retry logic');
        break;
        
      case ErrorCategory.FILE_SYSTEM:
        suggestions.push('Check file permissions');
        suggestions.push('Verify file paths exist');
        suggestions.push('Ensure sufficient disk space');
        break;
        
      case ErrorCategory.CONFIGURATION:
        suggestions.push('Validate configuration file syntax');
        suggestions.push('Check for missing required configuration');
        suggestions.push('Reset to default configuration');
        break;
        
      case ErrorCategory.SESSION:
        suggestions.push('Check session validity and expiration');
        suggestions.push('Verify session limits and quotas');
        suggestions.push('Consider session cleanup');
        break;
        
      default:
        suggestions.push('Check logs for more details');
        suggestions.push('Contact support if error persists');
    }
    
    if (errorInfo.retryable) {
      suggestions.push('Operation can be retried');
    }
    
    return suggestions;
  }

  /**
   * Create structured error information
   */
  private createErrorInfo(
    error: Error | string,
    context?: any
  ): ErrorInfo {
    const now = new Date();
    const errorId = `error-${now.getTime()}-${Math.random().toString(36).substr(2, 6)}`;
    
    let message: string;
    let originalError: Error | undefined;
    let stackTrace: string | undefined;
    
    if (error instanceof Error) {
      message = error.message;
      originalError = error;
      stackTrace = error.stack;
    } else {
      message = String(error);
    }
    
    return {
      id: errorId,
      timestamp: now,
      severity: context?.severity || this.inferSeverity(error, context),
      category: context?.category || this.inferCategory(error, context),
      source: context?.source || 'unknown',
      message,
      originalError,
      stackTrace,
      context: context?.additionalContext,
      sessionId: context?.sessionId,
      userId: context?.userId,
      recoverable: this.isRecoverable(error, context),
      retryable: this.isRetryable(error, context)
    };
  }

  /**
   * Infer error severity from error details
   */
  private inferSeverity(error: Error | string, context?: any): ErrorSeverity {
    const message = error instanceof Error ? error.message : error;
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('critical') || lowerMessage.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (lowerMessage.includes('warning') || lowerMessage.includes('deprecated')) {
      return ErrorSeverity.LOW;
    }
    
    if (context?.source === 'validation') {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.HIGH;
  }

  /**
   * Infer error category from error details
   */
  private inferCategory(error: Error | string, context?: any): ErrorCategory {
    if (context?.category) {
      return context.category;
    }
    
    const message = error instanceof Error ? error.message : error;
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    
    if (lowerMessage.includes('file') || lowerMessage.includes('permission')) {
      return ErrorCategory.FILE_SYSTEM;
    }
    
    if (lowerMessage.includes('config')) {
      return ErrorCategory.CONFIGURATION;
    }
    
    if (lowerMessage.includes('session')) {
      return ErrorCategory.SESSION;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverable(error: Error | string, context?: any): boolean {
    const category = context?.category || this.inferCategory(error, context);
    
    switch (category) {
      case ErrorCategory.VALIDATION:
      case ErrorCategory.CONFIGURATION:
        return true;
      case ErrorCategory.NETWORK:
        return true; // Often temporary
      case ErrorCategory.SYSTEM:
        return false;
      default:
        return true;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: Error | string, context?: any): boolean {
    const category = context?.category || this.inferCategory(error, context);
    
    switch (category) {
      case ErrorCategory.NETWORK:
      case ErrorCategory.FILE_SYSTEM:
        return true;
      case ErrorCategory.VALIDATION:
      case ErrorCategory.AUTHENTICATION:
        return false;
      default:
        return false;
    }
  }

  /**
   * Execute appropriate error handling strategy
   */
  private async executeStrategy(errorInfo: ErrorInfo): Promise<ErrorHandlingResult> {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(errorInfo)) {
        try {
          const result = await strategy.handle(errorInfo);
          if (result.handled) {
            return result;
          }
        } catch (strategyError) {
          console.error(`Strategy ${strategy.name} failed:`, strategyError);
        }
      }
    }
    
    // No strategy could handle the error
    return {
      handled: false,
      recovered: false,
      action: 'no_strategy_found',
      message: `No error handling strategy found for ${errorInfo.category} error`
    };
  }

  /**
   * Initialize default error handling strategies
   */
  private initializeDefaultStrategies(): void {
    // Validation error strategy
    this.registerStrategy({
      name: 'validation_error_handler',
      priority: 100,
      canHandle: (error) => error.category === ErrorCategory.VALIDATION,
      handle: async (error) => ({
        handled: true,
        recovered: false,
        action: 'validation_failed',
        message: `Validation error: ${error.message}`,
        retry: false
      })
    });

    // Network error strategy
    this.registerStrategy({
      name: 'network_error_handler',
      priority: 90,
      canHandle: (error) => error.category === ErrorCategory.NETWORK,
      handle: async (error) => ({
        handled: true,
        recovered: false,
        action: 'network_error',
        message: `Network error: ${error.message}`,
        retry: true
      })
    });

    // Configuration error strategy
    this.registerStrategy({
      name: 'config_error_handler',
      priority: 85,
      canHandle: (error) => error.category === ErrorCategory.CONFIGURATION,
      handle: async (error) => ({
        handled: true,
        recovered: false,
        action: 'config_error',
        message: `Configuration error: ${error.message}`,
        retry: false
      })
    });

    // Generic fallback strategy
    this.registerStrategy({
      name: 'fallback_handler',
      priority: 1,
      canHandle: () => true,
      handle: async (error) => ({
        handled: true,
        recovered: false,
        action: 'logged_only',
        message: `Error logged: ${error.message}`
      })
    });
  }

  /**
   * Log error details
   */
  private async logError(errorInfo: ErrorInfo): Promise<void> {
    await this.auditLogger.logEvent('error_occurred', {
      errorId: errorInfo.id,
      severity: errorInfo.severity,
      category: errorInfo.category,
      source: errorInfo.source,
      message: errorInfo.message,
      sessionId: errorInfo.sessionId,
      userId: errorInfo.userId,
      recoverable: errorInfo.recoverable,
      retryable: errorInfo.retryable,
      context: errorInfo.context,
      stackTrace: errorInfo.stackTrace?.split('\n').slice(0, 10) // Limit stack trace size
    });
  }

  /**
   * Log error handling result
   */
  private async logHandlingResult(errorInfo: ErrorInfo, result: ErrorHandlingResult): Promise<void> {
    await this.auditLogger.logEvent('error_handled', {
      errorId: errorInfo.id,
      handled: result.handled,
      recovered: result.recovered,
      action: result.action,
      message: result.message,
      retry: result.retry
    });
  }

  /**
   * Store error in history
   */
  private storeErrorHistory(errorInfo: ErrorInfo): void {
    const sessionErrors = this.errorHistory.get(errorInfo.sessionId || 'system') || [];
    sessionErrors.push(errorInfo);
    
    // Limit history size
    if (sessionErrors.length > this.maxHistorySize) {
      sessionErrors.splice(0, sessionErrors.length - this.maxHistorySize);
    }
    
    this.errorHistory.set(errorInfo.sessionId || 'system', sessionErrors);
  }

  /**
   * Update error count statistics
   */
  private updateErrorCounts(errorInfo: ErrorInfo): void {
    const pattern = this.createErrorPattern(errorInfo);
    const currentCount = this.errorCounts.get(pattern) || 0;
    this.errorCounts.set(pattern, currentCount + 1);
  }

  /**
   * Create error pattern for counting
   */
  private createErrorPattern(errorInfo: ErrorInfo): string {
    return `${errorInfo.category}:${errorInfo.source}:${errorInfo.message.substring(0, 50)}`;
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    const stats = this.getErrorStats();
    
    await this.auditLogger.logEvent('error_handler_shutdown', {
      finalStats: stats,
      timestamp: new Date().toISOString()
    });
    
    this.errorHistory.clear();
    this.errorCounts.clear();
    this.strategies.length = 0;
  }
}

/**---
 * title: [Haruspex Shared Error Types - Structured Error Handling Framework]
 * tags: [Core, Error-Handling, Types, Classification, Recovery]
 * provides: [ErrorTypes, ErrorClassification, RecoveryStrategies, ErrorReporting]
 * requires: [TypeScript, Error Classification, Logging Framework]
 * description: [Comprehensive error type hierarchy and handling framework for all Haruspex cleanup managers with classification, recovery strategies, and structured reporting]
 * ---*/

// =============================================================================
// BASE ERROR CLASSES
// =============================================================================

/**
 * Base error class for all Haruspex errors
 */
export abstract class HaruspexError extends Error {
  public readonly timestamp: number;
  public readonly errorId: string;
  public readonly component: string;
  public readonly severity: ErrorSeverity;
  public readonly recoverable: boolean;
  public readonly context: Record<string, any>;
  
  constructor(
    message: string,
    component: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    recoverable: boolean = true,
    context: Record<string, any> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = Date.now();
    this.errorId = this.generateErrorId();
    this.component = component;
    this.severity = severity;
    this.recoverable = recoverable;
    this.context = context;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Generate unique error ID for tracking
   */
  private generateErrorId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `haruspex_${timestamp}_${random}`;
  }
  
  /**
   * Get error classification
   */
  abstract getClassification(): ErrorClassification;
  
  /**
   * Get recovery strategy for this error
   */
  abstract getRecoveryStrategy(): RecoveryStrategy;
  
  /**
   * Convert error to structured format for logging
   */
  toStructured(): StructuredError {
    return {
      errorId: this.errorId,
      name: this.name,
      message: this.message,
      component: this.component,
      severity: this.severity,
      recoverable: this.recoverable,
      classification: this.getClassification(),
      recoveryStrategy: this.getRecoveryStrategy(),
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack || undefined
    };
  }
  
  /**
   * Create error report for debugging
   */
  createReport(): ErrorReport {
    return {
      error: this.toStructured(),
      recommendations: this.getRecommendations(),
      relatedErrors: [],
      debugInfo: this.getDebugInfo()
    };
  }
  
  /**
   * Get recommendations for fixing this error
   */
  protected getRecommendations(): string[] {
    return [`Check ${this.component} configuration and retry operation`];
  }
  
  /**
   * Get debug information for this error
   */
  protected getDebugInfo(): Record<string, any> {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime()
    };
  }
}

// =============================================================================
// ERROR ENUMS AND TYPES
// =============================================================================

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
  FATAL = 'fatal'
}

/**
 * Error classification categories
 */
export enum ErrorClassification {
  CONFIGURATION = 'configuration',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  RESOURCE = 'resource',
  TIMEOUT = 'timeout',
  CONFLICT = 'conflict',
  SYSTEM = 'system',
  NETWORK = 'network',
  USER = 'user',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  RETRY_WITH_BACKOFF = 'retry_with_backoff',
  SKIP = 'skip',
  FALLBACK = 'fallback',
  USER_INTERVENTION = 'user_intervention',
  RESTART_COMPONENT = 'restart_component',
  RESTART_SERVICE = 'restart_service',
  SYSTEM_RESTART = 'system_restart',
  MANUAL_RECOVERY = 'manual_recovery',
  NO_RECOVERY = 'no_recovery'
}

/**
 * Structured error representation
 */
export interface StructuredError {
  errorId: string;
  name: string;
  message: string;
  component: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  classification: ErrorClassification;
  recoveryStrategy: RecoveryStrategy;
  timestamp: number;
  context: Record<string, any>;
  stack?: string;
}

/**
 * Error report with recommendations
 */
export interface ErrorReport {
  error: StructuredError;
  recommendations: string[];
  relatedErrors: StructuredError[];
  debugInfo: Record<string, any>;
}

// =============================================================================
// CONFIGURATION ERRORS
// =============================================================================

/**
 * Configuration validation error
 */
export class ConfigurationError extends HaruspexError {
  constructor(
    message: string,
    component: string,
    public readonly configPath?: string,
    public readonly invalidValue?: any,
    context: Record<string, any> = {}
  ) {
    super(message, component, ErrorSeverity.ERROR, true, {
      ...context,
      configPath,
      invalidValue
    });
  }
  
  getClassification(): ErrorClassification {
    return ErrorClassification.CONFIGURATION;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.USER_INTERVENTION;
  }
  
  protected getRecommendations(): string[] {
    const recommendations = [
      'Verify configuration file exists and is readable',
      'Check configuration format and syntax',
      'Ensure all required configuration fields are present'
    ];
    
    if (this.configPath) {
      recommendations.push(`Review configuration at path: ${this.configPath}`);
    }
    
    if (this.invalidValue !== undefined) {
      recommendations.push(`Fix invalid value: ${JSON.stringify(this.invalidValue)}`);
    }
    
    return recommendations;
  }
}

/**
 * Configuration validation schema error
 */
export class ConfigurationValidationError extends ConfigurationError {
  constructor(
    message: string,
    component: string,
    public readonly validationErrors: Array<{path: string; message: string}>,
    context: Record<string, any> = {}
  ) {
    super(message, component, undefined, undefined, {
      ...context,
      validationErrors
    });
  }
  
  protected getRecommendations(): string[] {
    const recommendations = super.getRecommendations();
    recommendations.push('Fix the following validation errors:');
    
    this.validationErrors.forEach(error => {
      recommendations.push(`  - ${error.path}: ${error.message}`);
    });
    
    return recommendations;
  }
}

// =============================================================================
// PROCESS MANAGEMENT ERRORS
// =============================================================================

/**
 * Process management error base class
 */
export abstract class ProcessManagementError extends HaruspexError {
  constructor(
    message: string,
    public readonly pid?: number,
    public readonly processName?: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'ProcessManager', ErrorSeverity.ERROR, true, {
      ...context,
      pid,
      processName
    });
  }
}

/**
 * Process not found error
 */
export class ProcessNotFoundError extends ProcessManagementError {
  getClassification(): ErrorClassification {
    return ErrorClassification.RESOURCE;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.SKIP;
  }
  
  protected getRecommendations(): string[] {
    return [
      'Process may have already terminated',
      'Check if process ID is valid',
      'Verify process tracking state'
    ];
  }
}

/**
 * Process termination failed error
 */
export class ProcessTerminationError extends ProcessManagementError {
  constructor(
    message: string,
    pid?: number,
    processName?: string,
    public readonly terminationSignal?: string,
    context: Record<string, any> = {}
  ) {
    super(message, pid, processName, {
      ...context,
      terminationSignal
    });
  }
  
  getClassification(): ErrorClassification {
    return ErrorClassification.SYSTEM;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.RETRY_WITH_BACKOFF;
  }
  
  protected getRecommendations(): string[] {
    return [
      'Process may be unresponsive - try force termination',
      'Check if process has sufficient permissions',
      'Verify process ownership before termination'
    ];
  }
}

/**
 * Process ownership verification failed error
 */
export class ProcessOwnershipError extends ProcessManagementError {
  getClassification(): ErrorClassification {
    return ErrorClassification.PERMISSION;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.SKIP;
  }
  
  protected getRecommendations(): string[] {
    return [
      'Process does not belong to current session',
      'Verify process tracking metadata',
      'Check session ID correlation'
    ];
  }
}

// =============================================================================
// FILE MANAGEMENT ERRORS
// =============================================================================

/**
 * File management error base class
 */
export abstract class FileManagementError extends HaruspexError {
  constructor(
    message: string,
    public readonly filePath?: string,
    public readonly operation?: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'FileCleanup', ErrorSeverity.ERROR, true, {
      ...context,
      filePath,
      operation
    });
  }
}

/**
 * File access denied error
 */
export class FileAccessError extends FileManagementError {
  getClassification(): ErrorClassification {
    return ErrorClassification.PERMISSION;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.SKIP;
  }
  
  protected getRecommendations(): string[] {
    return [
      'Check file permissions',
      'Verify user has access to file location',
      'File may be locked by another process'
    ];
  }
}

/**
 * File safety violation error
 */
export class FileSafetyError extends FileManagementError {
  constructor(
    message: string,
    filePath?: string,
    public readonly safetyReason?: string,
    context: Record<string, any> = {}
  ) {
    super(message, filePath, 'safety_check', {
      ...context,
      safetyReason
    });
  }
  
  getClassification(): ErrorClassification {
    return ErrorClassification.VALIDATION;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.SKIP;
  }
  
  protected getRecommendations(): string[] {
    const recommendations = [
      'File is protected by safety rules',
      'Review file cleanup configuration'
    ];
    
    if (this.safetyReason) {
      recommendations.push(`Safety reason: ${this.safetyReason}`);
    }
    
    return recommendations;
  }
}

/**
 * File system error for file operations
 */
export class FileSystemError extends FileManagementError {
  constructor(
    message: string,
    component: string,
    filePath?: string,
    operation?: string,
    context: Record<string, any> = {}
  ) {
    super(message, filePath, operation, {
      ...context,
      component
    });
  }
  
  getClassification(): ErrorClassification {
    return ErrorClassification.SYSTEM;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.RETRY_WITH_BACKOFF;
  }
  
  protected getRecommendations(): string[] {
    return [
      'File system operation failed',
      'Check file permissions and disk space',
      'Verify file path exists and is accessible'
    ];
  }
}

/**
 * File protection error
 */
export class FileProtectionError extends FileManagementError {
  constructor(
    message: string,
    component: string,
    filePath?: string,
    context: Record<string, any> = {}
  ) {
    super(message, filePath, 'protection_check', {
      ...context,
      component
    });
  }
  
  getClassification(): ErrorClassification {
    return ErrorClassification.VALIDATION;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.SKIP;
  }
  
  protected getRecommendations(): string[] {
    return [
      'File is protected by safety mechanisms',
      'Review file protection settings',
      'Consider if file should be excluded from operations'
    ];
  }
}

// =============================================================================
// COMMAND MANAGEMENT ERRORS
// =============================================================================

/**
 * Command management error base class
 */
export abstract class CommandManagementError extends HaruspexError {
  constructor(
    message: string,
    public readonly commandId?: string,
    public readonly operation?: string,
    context: Record<string, any> = {}
  ) {
    super(message, 'CommandManager', ErrorSeverity.ERROR, true, {
      ...context,
      commandId,
      operation
    });
  }
}

/**
 * Command registration failed error
 */
export class CommandRegistrationError extends CommandManagementError {
  constructor(
    message: string,
    commandId?: string,
    public readonly registrationAttempts?: number,
    context: Record<string, any> = {}
  ) {
    super(message, commandId, 'registration', {
      ...context,
      registrationAttempts
    });
  }
  
  getClassification(): ErrorClassification {
    return ErrorClassification.CONFLICT;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.RETRY_WITH_BACKOFF;
  }
  
  protected getRecommendations(): string[] {
    return [
      'Command may already be registered',
      'Check for hot-reload conflicts',
      'Verify extension context is valid'
    ];
  }
}

/**
 * Command conflict resolution error
 */
export class CommandConflictError extends CommandManagementError {
  constructor(
    message: string,
    commandId?: string,
    public readonly conflictType?: string,
    public readonly resolutionStrategy?: string,
    context: Record<string, any> = {}
  ) {
    super(message, commandId, 'conflict_resolution', {
      ...context,
      conflictType,
      resolutionStrategy
    });
  }
  
  getClassification(): ErrorClassification {
    return ErrorClassification.CONFLICT;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.SKIP;
  }
  
  protected getRecommendations(): string[] {
    const recommendations = [
      'Command conflict detected during registration',
      'Review conflict resolution strategy configuration'
    ];
    
    if (this.conflictType) {
      recommendations.push(`Conflict type: ${this.conflictType}`);
    }
    
    if (this.resolutionStrategy) {
      recommendations.push(`Resolution strategy: ${this.resolutionStrategy}`);
    }
    
    return recommendations;
  }
}

/**
 * Command hot-reload conflict error
 */
export class CommandHotReloadError extends CommandManagementError {
  getClassification(): ErrorClassification {
    return ErrorClassification.CONFLICT;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.SKIP;
  }
  
  protected getRecommendations(): string[] {
    return [
      'Hot-reload conflict detected (expected during development)',
      'Enable hot-reload handling in configuration',
      'Commands will be registered on next clean start'
    ];
  }
}

// =============================================================================
// TIMEOUT AND ASYNC ERRORS
// =============================================================================

/**
 * Timeout error for async operations
 */
export class TimeoutError extends HaruspexError {
  constructor(
    message: string,
    component: string,
    public readonly timeoutDuration: number,
    public readonly operation?: string,
    context: Record<string, any> = {}
  ) {
    super(message, component, ErrorSeverity.WARNING, true, {
      ...context,
      timeoutDuration,
      operation
    });
  }
  
  getClassification(): ErrorClassification {
    return ErrorClassification.TIMEOUT;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.RETRY_WITH_BACKOFF;
  }
  
  protected getRecommendations(): string[] {
    return [
      `Operation timed out after ${this.timeoutDuration}ms`,
      'Consider increasing timeout duration',
      'Check system performance and load'
    ];
  }
}

/**
 * Async operation error
 */
export class AsyncOperationError extends HaruspexError {
  constructor(
    message: string,
    component: string,
    public readonly operation: string,
    public readonly cause?: Error,
    context: Record<string, any> = {}
  ) {
    super(message, component, ErrorSeverity.ERROR, true, {
      ...context,
      operation,
      cause: cause?.message
    });
  }
  
  getClassification(): ErrorClassification {
    return ErrorClassification.SYSTEM;
  }
  
  getRecoveryStrategy(): RecoveryStrategy {
    return RecoveryStrategy.RETRY;
  }
  
  protected getRecommendations(): string[] {
    const recommendations = [
      'Async operation failed',
      'Check system resources and load',
      'Verify operation parameters'
    ];
    
    if (this.cause) {
      recommendations.push(`Root cause: ${this.cause.message}`);
    }
    
    return recommendations;
  }
}

// =============================================================================
// ERROR UTILITIES
// =============================================================================

/**
 * Error classification utility
 */
export class ErrorClassifier {
  /**
   * Classify an unknown error
   */
  static classify(error: unknown): {
    classification: ErrorClassification;
    severity: ErrorSeverity;
    recoverable: boolean;
  } {
    if (error instanceof HaruspexError) {
      return {
        classification: error.getClassification(),
        severity: error.severity,
        recoverable: error.recoverable
      };
    }
    
    if (error instanceof Error) {
      // Classify standard errors
      const message = error.message.toLowerCase();
      
      if (message.includes('permission') || message.includes('access')) {
        return {
          classification: ErrorClassification.PERMISSION,
          severity: ErrorSeverity.WARNING,
          recoverable: false
        };
      }
      
      if (message.includes('timeout')) {
        return {
          classification: ErrorClassification.TIMEOUT,
          severity: ErrorSeverity.WARNING,
          recoverable: true
        };
      }
      
      if (message.includes('not found') || message.includes('enoent')) {
        return {
          classification: ErrorClassification.RESOURCE,
          severity: ErrorSeverity.WARNING,
          recoverable: true
        };
      }
      
      if (message.includes('conflict') || message.includes('already exists')) {
        return {
          classification: ErrorClassification.CONFLICT,
          severity: ErrorSeverity.INFO,
          recoverable: true
        };
      }
    }
    
    return {
      classification: ErrorClassification.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      recoverable: true
    };
  }
  
  /**
   * Create HaruspexError from unknown error
   */
  static createStructuredError(
    error: unknown,
    component: string,
    context: Record<string, any> = {}
  ): HaruspexError {
    if (error instanceof HaruspexError) {
      return error;
    }
    
    const classification = this.classify(error);
    const message = error instanceof Error ? error.message : String(error);
    
    return new (class extends HaruspexError {
      getClassification(): ErrorClassification {
        return classification.classification;
      }
      
      getRecoveryStrategy(): RecoveryStrategy {
        switch (classification.classification) {
          case ErrorClassification.TIMEOUT:
            return RecoveryStrategy.RETRY_WITH_BACKOFF;
          case ErrorClassification.PERMISSION:
            return RecoveryStrategy.SKIP;
          case ErrorClassification.CONFLICT:
            return RecoveryStrategy.SKIP;
          case ErrorClassification.RESOURCE:
            return RecoveryStrategy.RETRY;
          default:
            return RecoveryStrategy.MANUAL_RECOVERY;
        }
      }
    })(message, component, classification.severity, classification.recoverable, context);
  }
}

/**
 * Error aggregator for collecting and analyzing multiple errors
 */
export class ErrorAggregator {
  private errors: HaruspexError[] = [];
  
  /**
   * Add error to aggregator
   */
  add(error: HaruspexError): void {
    this.errors.push(error);
  }
  
  /**
   * Get all errors
   */
  getErrors(): HaruspexError[] {
    return [...this.errors];
  }
  
  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): HaruspexError[] {
    return this.errors.filter(error => error.severity === severity);
  }
  
  /**
   * Get errors by classification
   */
  getErrorsByClassification(classification: ErrorClassification): HaruspexError[] {
    return this.errors.filter(error => error.getClassification() === classification);
  }
  
  /**
   * Get error summary
   */
  getSummary(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byClassification: Record<ErrorClassification, number>;
    recoverable: number;
    critical: number;
  } {
    const summary = {
      total: this.errors.length,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byClassification: {} as Record<ErrorClassification, number>,
      recoverable: 0,
      critical: 0
    };
    
    this.errors.forEach(error => {
      // Count by severity
      summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;
      
      // Count by classification
      const classification = error.getClassification();
      summary.byClassification[classification] = (summary.byClassification[classification] || 0) + 1;
      
      // Count recoverable
      if (error.recoverable) {
        summary.recoverable++;
      }
      
      // Count critical
      if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.FATAL) {
        summary.critical++;
      }
    });
    
    return summary;
  }
  
  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
  }
}
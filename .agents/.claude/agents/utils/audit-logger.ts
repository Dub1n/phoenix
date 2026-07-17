/**
 * Audit Trail Logging System
 * 
 * Comprehensive audit trail for all handoff operations with structured logging.
 * Provides detailed tracking for debugging, monitoring, and compliance.
 * 
 * @created 2025-09-05-1824
 * @source dev/auto/subagent-workflow-integration-design.md audit requirements
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { HandoffConfig, HandoffError } from '../interfaces/handoff-types.js';
import { generateTimestamp } from './file-naming.js';

/**
 * Audit log levels
 */
export enum AuditLogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  AUDIT = 'AUDIT'
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  timestamp: string;
  level: AuditLogLevel;
  operation: string;
  taskId?: string;
  filePath?: string;
  details: Record<string, any>;
  error?: HandoffError;
  duration?: number;
  metadata: {
    sessionId: string;
    userId?: string;
    version: string;
  };
}

/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
  logDirectory: string;
  maxLogFileSize: number; // bytes
  maxLogFiles: number;
  logLevel: AuditLogLevel;
  enableConsoleOutput: boolean;
  enableFileOutput: boolean;
  logRotationInterval: 'daily' | 'weekly' | 'monthly';
}

/**
 * Default audit logger configuration
 */
export const DEFAULT_AUDIT_CONFIG: AuditLoggerConfig = {
  logDirectory: '.claude/logs',
  maxLogFileSize: 10 * 1024 * 1024, // 10MB
  maxLogFiles: 10,
  logLevel: AuditLogLevel.INFO,
  enableConsoleOutput: false,
  enableFileOutput: true,
  logRotationInterval: 'daily'
};

/**
 * Operation timing tracker
 */
class OperationTimer {
  private startTimes = new Map<string, number>();
  
  start(operationId: string): void {
    this.startTimes.set(operationId, Date.now());
  }
  
  end(operationId: string): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      return 0;
    }
    
    const duration = Date.now() - startTime;
    this.startTimes.delete(operationId);
    return duration;
  }
}

/**
 * Comprehensive audit logger for handoff operations
 */
export class HandoffAuditLogger {
  private config: AuditLoggerConfig;
  private sessionId: string;
  private timer: OperationTimer;
  private currentLogFile?: string;
  
  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.timer = new OperationTimer();
  }
  
  /**
   * Log handoff input operation
   * 
   * @param operation - Operation name
   * @param taskId - Task identifier
   * @param filePath - File path
   * @param details - Additional details
   */
  async logInputOperation(
    operation: string,
    taskId: string,
    filePath: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.log(AuditLogLevel.AUDIT, operation, {
      taskId,
      filePath,
      operationType: 'input',
      ...details
    });
  }
  
  /**
   * Log handoff output operation
   * 
   * @param operation - Operation name
   * @param taskId - Task identifier
   * @param filePath - File path
   * @param details - Additional details
   */
  async logOutputOperation(
    operation: string,
    taskId: string,
    filePath: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.log(AuditLogLevel.AUDIT, operation, {
      taskId,
      filePath,
      operationType: 'output',
      ...details
    });
  }
  
  /**
   * Log cleanup operation
   * 
   * @param operation - Operation name
   * @param details - Cleanup details
   */
  async logCleanupOperation(
    operation: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.log(AuditLogLevel.AUDIT, operation, {
      operationType: 'cleanup',
      ...details
    });
  }
  
  /**
   * Log error with context
   * 
   * @param operation - Operation name
   * @param error - HandoffError
   * @param context - Additional context
   */
  async logError(
    operation: string,
    error: HandoffError,
    context: Record<string, any> = {}
  ): Promise<void> {
    await this.log(AuditLogLevel.ERROR, operation, context, error);
  }
  
  /**
   * Log warning message
   * 
   * @param operation - Operation name
   * @param message - Warning message
   * @param details - Additional details
   */
  async logWarning(
    operation: string,
    message: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.log(AuditLogLevel.WARN, operation, {
      message,
      ...details
    });
  }
  
  /**
   * Log informational message
   * 
   * @param operation - Operation name
   * @param message - Info message
   * @param details - Additional details
   */
  async logInfo(
    operation: string,
    message: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.log(AuditLogLevel.INFO, operation, {
      message,
      ...details
    });
  }
  
  /**
   * Log debug message
   * 
   * @param operation - Operation name
   * @param message - Debug message
   * @param details - Additional details
   */
  async logDebug(
    operation: string,
    message: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.log(AuditLogLevel.DEBUG, operation, {
      message,
      ...details
    });
  }
  
  /**
   * Start timing an operation
   * 
   * @param operationId - Unique operation identifier
   */
  startTiming(operationId: string): void {
    this.timer.start(operationId);
  }
  
  /**
   * End timing an operation and log it
   * 
   * @param operationId - Unique operation identifier
   * @param operation - Operation name
   * @param details - Additional details
   */
  async endTiming(
    operationId: string,
    operation: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    const duration = this.timer.end(operationId);
    await this.log(AuditLogLevel.AUDIT, operation, {
      duration,
      operationId,
      ...details
    });
  }
  
  /**
   * Log performance metrics
   * 
   * @param operation - Operation name
   * @param metrics - Performance metrics
   */
  async logPerformanceMetrics(
    operation: string,
    metrics: Record<string, number>
  ): Promise<void> {
    await this.log(AuditLogLevel.AUDIT, operation, {
      operationType: 'performance',
      metrics
    });
  }
  
  /**
   * Core logging method
   * 
   * @param level - Log level
   * @param operation - Operation name
   * @param details - Details object
   * @param error - Optional error
   */
  private async log(
    level: AuditLogLevel,
    operation: string,
    details: Record<string, any> = {},
    error?: HandoffError
  ): Promise<void> {
    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return;
    }
    
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      taskId: details.taskId,
      filePath: details.filePath,
      details,
      error,
      duration: details.duration,
      metadata: {
        sessionId: this.sessionId,
        userId: details.userId || process.env.USER || 'unknown',
        version: '1.0.0' // TODO: Get from package.json
      }
    };
    
    // Output to console if enabled
    if (this.config.enableConsoleOutput) {
      this.logToConsole(entry);
    }
    
    // Output to file if enabled
    if (this.config.enableFileOutput) {
      await this.logToFile(entry);
    }
  }
  
  /**
   * Check if a log level should be logged
   * 
   * @param level - Log level to check
   * @returns true if should log
   */
  private shouldLog(level: AuditLogLevel): boolean {
    const levels = [
      AuditLogLevel.DEBUG,
      AuditLogLevel.INFO,
      AuditLogLevel.WARN,
      AuditLogLevel.ERROR,
      AuditLogLevel.AUDIT
    ];
    
    const currentIndex = levels.indexOf(this.config.logLevel);
    const targetIndex = levels.indexOf(level);
    
    return targetIndex >= currentIndex;
  }
  
  /**
   * Log entry to console
   * 
   * @param entry - Log entry
   */
  private logToConsole(entry: AuditLogEntry): void {
    const message = this.formatLogEntry(entry);
    
    switch (entry.level) {
      case AuditLogLevel.ERROR:
        console.error(message);
        break;
      case AuditLogLevel.WARN:
        console.warn(message);
        break;
      case AuditLogLevel.DEBUG:
        console.debug(message);
        break;
      default:
        console.log(message);
    }
  }
  
  /**
   * Log entry to file
   * 
   * @param entry - Log entry
   */
  private async logToFile(entry: AuditLogEntry): Promise<void> {
    try {
      const logFile = await this.getLogFile();
      const logLine = JSON.stringify(entry) + '\n';
      
      await fs.appendFile(logFile, logLine, 'utf8');
      
      // Check if rotation is needed
      await this.checkLogRotation(logFile);
      
    } catch (error) {
      // Fallback to console if file logging fails
      console.error('Failed to write to audit log:', error);
      console.log('Audit entry:', this.formatLogEntry(entry));
    }
  }
  
  /**
   * Format log entry for display
   * 
   * @param entry - Log entry
   * @returns Formatted string
   */
  private formatLogEntry(entry: AuditLogEntry): string {
    const parts = [
      entry.timestamp,
      `[${entry.level}]`,
      entry.operation
    ];
    
    if (entry.taskId) {
      parts.push(`task:${entry.taskId}`);
    }
    
    if (entry.duration) {
      parts.push(`duration:${entry.duration}ms`);
    }
    
    if (entry.error) {
      parts.push(`error:${entry.error.message}`);
    }
    
    if (entry.details.message) {
      parts.push(entry.details.message);
    }
    
    return parts.join(' ');
  }
  
  /**
   * Get current log file path
   * 
   * @returns Promise with log file path
   */
  private async getLogFile(): Promise<string> {
    if (!this.currentLogFile) {
      const logDir = this.config.logDirectory;
      await this.ensureDirectoryExists(logDir);
      
      const timestamp = generateTimestamp();
      this.currentLogFile = path.join(logDir, `handoff-audit-${timestamp}.log`);
    }
    
    return this.currentLogFile;
  }
  
  /**
   * Check if log rotation is needed
   * 
   * @param logFile - Current log file
   */
  private async checkLogRotation(logFile: string): Promise<void> {
    try {
      const stats = await fs.stat(logFile);
      
      if (stats.size > this.config.maxLogFileSize) {
        // Force rotation by clearing current log file
        this.currentLogFile = undefined;
        
        // Clean up old log files
        await this.cleanupOldLogFiles();
      }
    } catch {
      // Ignore stat errors
    }
  }
  
  /**
   * Clean up old log files
   */
  private async cleanupOldLogFiles(): Promise<void> {
    try {
      const logDir = this.config.logDirectory;
      const files = await fs.readdir(logDir);
      const logFiles = files
        .filter(file => file.startsWith('handoff-audit-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(logDir, file),
          mtime: 0
        }));
      
      // Get modification times
      for (const file of logFiles) {
        try {
          const stats = await fs.stat(file.path);
          file.mtime = stats.mtime.getTime();
        } catch {
          // Skip files that can't be stat'd
        }
      }
      
      // Sort by modification time (newest first)
      logFiles.sort((a, b) => b.mtime - a.mtime);
      
      // Remove excess files
      const filesToRemove = logFiles.slice(this.config.maxLogFiles);
      for (const file of filesToRemove) {
        try {
          await fs.unlink(file.path);
        } catch {
          // Ignore deletion errors
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }
  
  /**
   * Ensure directory exists
   * 
   * @param dirPath - Directory path
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
  
  /**
   * Generate unique session ID
   * 
   * @returns Session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `${timestamp}-${random}`;
  }
  
  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
  
  /**
   * Update configuration
   * 
   * @param config - Partial configuration update
   */
  updateConfig(config: Partial<AuditLoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Global audit logger instance
 */
let globalLogger: HandoffAuditLogger | null = null;

/**
 * Get global audit logger instance
 * 
 * @param config - Optional configuration
 * @returns HandoffAuditLogger instance
 */
export function getAuditLogger(config?: Partial<AuditLoggerConfig>): HandoffAuditLogger {
  if (!globalLogger) {
    globalLogger = new HandoffAuditLogger(config);
  }
  
  return globalLogger;
}

/**
 * Create a new audit logger instance
 * 
 * @param config - Logger configuration
 * @returns HandoffAuditLogger instance
 */
export function createAuditLogger(config?: Partial<AuditLoggerConfig>): HandoffAuditLogger {
  return new HandoffAuditLogger(config);
}

/**
 * Configure global audit logger
 * 
 * @param config - Configuration to apply
 */
export function configureAuditLogger(config: Partial<AuditLoggerConfig>): void {
  const logger = getAuditLogger();
  logger.updateConfig(config);
}
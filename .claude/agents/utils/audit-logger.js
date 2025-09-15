"use strict";
/**
 * Audit Trail Logging System
 *
 * Comprehensive audit trail for all handoff operations with structured logging.
 * Provides detailed tracking for debugging, monitoring, and compliance.
 *
 * @created 2025-09-05-1824
 * @source dev/auto/subagent-workflow-integration-design.md audit requirements
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandoffAuditLogger = exports.DEFAULT_AUDIT_CONFIG = exports.AuditLogLevel = void 0;
exports.getAuditLogger = getAuditLogger;
exports.createAuditLogger = createAuditLogger;
exports.configureAuditLogger = configureAuditLogger;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const file_naming_js_1 = require("./file-naming.js");
/**
 * Audit log levels
 */
var AuditLogLevel;
(function (AuditLogLevel) {
    AuditLogLevel["DEBUG"] = "DEBUG";
    AuditLogLevel["INFO"] = "INFO";
    AuditLogLevel["WARN"] = "WARN";
    AuditLogLevel["ERROR"] = "ERROR";
    AuditLogLevel["AUDIT"] = "AUDIT";
})(AuditLogLevel || (exports.AuditLogLevel = AuditLogLevel = {}));
/**
 * Default audit logger configuration
 */
exports.DEFAULT_AUDIT_CONFIG = {
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
    constructor() {
        this.startTimes = new Map();
    }
    start(operationId) {
        this.startTimes.set(operationId, Date.now());
    }
    end(operationId) {
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
class HandoffAuditLogger {
    constructor(config = {}) {
        this.config = { ...exports.DEFAULT_AUDIT_CONFIG, ...config };
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
    async logInputOperation(operation, taskId, filePath, details = {}) {
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
    async logOutputOperation(operation, taskId, filePath, details = {}) {
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
    async logCleanupOperation(operation, details = {}) {
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
    async logError(operation, error, context = {}) {
        await this.log(AuditLogLevel.ERROR, operation, context, error);
    }
    /**
     * Log warning message
     *
     * @param operation - Operation name
     * @param message - Warning message
     * @param details - Additional details
     */
    async logWarning(operation, message, details = {}) {
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
    async logInfo(operation, message, details = {}) {
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
    async logDebug(operation, message, details = {}) {
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
    startTiming(operationId) {
        this.timer.start(operationId);
    }
    /**
     * End timing an operation and log it
     *
     * @param operationId - Unique operation identifier
     * @param operation - Operation name
     * @param details - Additional details
     */
    async endTiming(operationId, operation, details = {}) {
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
    async logPerformanceMetrics(operation, metrics) {
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
    async log(level, operation, details = {}, error) {
        // Check if we should log this level
        if (!this.shouldLog(level)) {
            return;
        }
        const entry = {
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
    shouldLog(level) {
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
    logToConsole(entry) {
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
    async logToFile(entry) {
        try {
            const logFile = await this.getLogFile();
            const logLine = JSON.stringify(entry) + '\n';
            await fs.appendFile(logFile, logLine, 'utf8');
            // Check if rotation is needed
            await this.checkLogRotation(logFile);
        }
        catch (error) {
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
    formatLogEntry(entry) {
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
    async getLogFile() {
        if (!this.currentLogFile) {
            const logDir = this.config.logDirectory;
            await this.ensureDirectoryExists(logDir);
            const timestamp = (0, file_naming_js_1.generateTimestamp)();
            this.currentLogFile = path.join(logDir, `handoff-audit-${timestamp}.log`);
        }
        return this.currentLogFile;
    }
    /**
     * Check if log rotation is needed
     *
     * @param logFile - Current log file
     */
    async checkLogRotation(logFile) {
        try {
            const stats = await fs.stat(logFile);
            if (stats.size > this.config.maxLogFileSize) {
                // Force rotation by clearing current log file
                this.currentLogFile = undefined;
                // Clean up old log files
                await this.cleanupOldLogFiles();
            }
        }
        catch (_a) {
            // Ignore stat errors
        }
    }
    /**
     * Clean up old log files
     */
    async cleanupOldLogFiles() {
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
                }
                catch (_a) {
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
                }
                catch (_b) {
                    // Ignore deletion errors
                }
            }
        }
        catch (_c) {
            // Ignore cleanup errors
        }
    }
    /**
     * Ensure directory exists
     *
     * @param dirPath - Directory path
     */
    async ensureDirectoryExists(dirPath) {
        try {
            await fs.access(dirPath);
        }
        catch (_a) {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }
    /**
     * Generate unique session ID
     *
     * @returns Session ID
     */
    generateSessionId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 8);
        return `${timestamp}-${random}`;
    }
    /**
     * Get session ID
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Update configuration
     *
     * @param config - Partial configuration update
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
}
exports.HandoffAuditLogger = HandoffAuditLogger;
/**
 * Global audit logger instance
 */
let globalLogger = null;
/**
 * Get global audit logger instance
 *
 * @param config - Optional configuration
 * @returns HandoffAuditLogger instance
 */
function getAuditLogger(config) {
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
function createAuditLogger(config) {
    return new HandoffAuditLogger(config);
}
/**
 * Configure global audit logger
 *
 * @param config - Configuration to apply
 */
function configureAuditLogger(config) {
    const logger = getAuditLogger();
    logger.updateConfig(config);
}

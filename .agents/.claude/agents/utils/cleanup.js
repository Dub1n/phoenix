"use strict";
/**
 * Automated Cleanup System
 *
 * Automated cleanup utilities with configurable retention policies and audit logging.
 * Implements safe cleanup with comprehensive error handling and recovery.
 *
 * @created 2025-09-05-1824
 * @source dev/auto/subagent-workflow-integration-design.md lines 581-585
 *
 * Fixed TypeScript strict mode null-safety violations and error type casting for production-ready code
 * Implements null-safety-error-handling pattern with nullish coalescing operators
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
exports.HandoffCleanupManager = void 0;
exports.createCleanupManager = createCleanupManager;
exports.executeCleanup = executeCleanup;
exports.getCleanupStats = getCleanupStats;
exports.scheduleCleanup = scheduleCleanup;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const handoff_types_js_1 = require("../interfaces/handoff-types.js");
const file_naming_js_1 = require("./file-naming.js");
const error_handling_js_1 = require("./error-handling.js");
/**
 * Automated cleanup manager
 */
class HandoffCleanupManager {
    constructor(config) {
        this.config = config;
        this.errorAggregator = new error_handling_js_1.ErrorAggregator();
    }
    /**
     * Execute automated cleanup based on configuration
     *
     * @param policy - Optional cleanup policy override
     * @returns Promise with cleanup result
     */
    async executeCleanup(policy) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const startTime = Date.now();
        this.errorAggregator.clear();
        const cleanupPolicy = {
            inputRetentionDays: this.config.input_retention_days,
            outputRetentionDays: this.config.output_retention_days,
            archiveRetentionDays: 90, // Default archive retention
            maxArchiveSize: 100 * 1024 * 1024, // 100MB default
            dryRun: false,
            forceCleanup: false,
            ...policy
        };
        let totalFiles = 0;
        let cleanedFiles = 0;
        let archivedFiles = 0;
        let bytesCleaned = 0;
        try {
            // Cleanup input files
            const inputResult = await this.cleanupInputFiles(cleanupPolicy);
            totalFiles += (_a = inputResult.totalFiles) !== null && _a !== void 0 ? _a : 0;
            cleanedFiles += (_b = inputResult.cleanedFiles) !== null && _b !== void 0 ? _b : 0;
            bytesCleaned += (_c = inputResult.bytesCleaned) !== null && _c !== void 0 ? _c : 0;
            // Cleanup output files
            const outputResult = await this.cleanupOutputFiles(cleanupPolicy);
            totalFiles += (_d = outputResult.totalFiles) !== null && _d !== void 0 ? _d : 0;
            cleanedFiles += (_e = outputResult.cleanedFiles) !== null && _e !== void 0 ? _e : 0;
            bytesCleaned += (_f = outputResult.bytesCleaned) !== null && _f !== void 0 ? _f : 0;
            // Cleanup archive files if policy specified
            if (cleanupPolicy.archiveRetentionDays !== undefined) {
                const archiveResult = await this.cleanupArchiveFiles(cleanupPolicy);
                totalFiles += (_g = archiveResult.totalFiles) !== null && _g !== void 0 ? _g : 0;
                archivedFiles += (_h = archiveResult.cleanedFiles) !== null && _h !== void 0 ? _h : 0;
                bytesCleaned += (_j = archiveResult.bytesCleaned) !== null && _j !== void 0 ? _j : 0;
            }
            // Enforce archive size limits
            if (cleanupPolicy.maxArchiveSize) {
                const sizeResult = await this.enforceArchiveSizeLimit(cleanupPolicy);
                archivedFiles += (_k = sizeResult.cleanedFiles) !== null && _k !== void 0 ? _k : 0;
                bytesCleaned += (_l = sizeResult.bytesCleaned) !== null && _l !== void 0 ? _l : 0;
            }
        }
        catch (error) {
            this.errorAggregator.addError((0, error_handling_js_1.normalizeError)(error));
        }
        return {
            totalFiles,
            cleanedFiles,
            archivedFiles,
            errors: this.errorAggregator.getErrors(),
            duration: Date.now() - startTime,
            bytesCleaned
        };
    }
    /**
     * Get cleanup statistics without performing cleanup
     *
     * @param policy - Cleanup policy for analysis
     * @returns Promise with cleanup statistics
     */
    async getCleanupStats(policy) {
        const cleanupPolicy = {
            inputRetentionDays: this.config.input_retention_days,
            outputRetentionDays: this.config.output_retention_days,
            dryRun: true,
            ...policy
        };
        const inputFiles = await this.analyzeInputFiles(cleanupPolicy);
        const outputFiles = await this.analyzeOutputFiles(cleanupPolicy);
        const archiveFiles = await this.analyzeArchiveFiles();
        return {
            inputFiles: {
                total: inputFiles.total,
                cleaned: inputFiles.eligible,
                retained: inputFiles.total - inputFiles.eligible
            },
            outputFiles: {
                total: outputFiles.total,
                cleaned: outputFiles.eligible,
                retained: outputFiles.total - outputFiles.eligible
            },
            archiveFiles: {
                total: archiveFiles.total,
                size: archiveFiles.size
            }
        };
    }
    /**
     * Clean up input files based on retention policy
     *
     * @param policy - Cleanup policy
     * @returns Cleanup result for input files
     */
    async cleanupInputFiles(policy) {
        const inputDir = path.join(this.config.base_path, 'input');
        const files = await this.getFileCleanupInfo(inputDir);
        let totalFiles = files.length;
        let cleanedFiles = 0;
        let bytesCleaned = 0;
        for (const file of files) {
            if (file.age > policy.inputRetentionDays) {
                try {
                    if (!policy.dryRun) {
                        await this.safeDeleteFile(file.path);
                    }
                    cleanedFiles++;
                    bytesCleaned += file.size;
                }
                catch (error) {
                    this.errorAggregator.addError((0, error_handling_js_1.createHandoffError)(handoff_types_js_1.HandoffErrorType.CLEANUP_ERROR, `Failed to clean input file: ${file.path}`, 'Check file permissions and disk space', file.path));
                }
            }
        }
        return { totalFiles, cleanedFiles, bytesCleaned };
    }
    /**
     * Clean up output files based on retention policy
     *
     * @param policy - Cleanup policy
     * @returns Cleanup result for output files
     */
    async cleanupOutputFiles(policy) {
        const outputDir = path.join(this.config.base_path, 'output');
        const files = await this.getFileCleanupInfo(outputDir);
        let totalFiles = files.length;
        let cleanedFiles = 0;
        let bytesCleaned = 0;
        for (const file of files) {
            if (file.age > policy.outputRetentionDays) {
                try {
                    if (!policy.dryRun) {
                        await this.safeDeleteFile(file.path);
                    }
                    cleanedFiles++;
                    bytesCleaned += file.size;
                }
                catch (error) {
                    this.errorAggregator.addError((0, error_handling_js_1.createHandoffError)(handoff_types_js_1.HandoffErrorType.CLEANUP_ERROR, `Failed to clean output file: ${file.path}`, 'Check file permissions and disk space', file.path));
                }
            }
        }
        return { totalFiles, cleanedFiles, bytesCleaned };
    }
    /**
     * Clean up archive files based on retention policy
     *
     * @param policy - Cleanup policy
     * @returns Cleanup result for archive files
     */
    async cleanupArchiveFiles(policy) {
        if (!policy.archiveRetentionDays) {
            return { totalFiles: 0, cleanedFiles: 0, bytesCleaned: 0 };
        }
        const archiveDir = path.join(this.config.base_path, 'archive');
        const files = await this.getFileCleanupInfo(archiveDir);
        let totalFiles = files.length;
        let cleanedFiles = 0;
        let bytesCleaned = 0;
        for (const file of files) {
            if (file.age > policy.archiveRetentionDays) {
                try {
                    if (!policy.dryRun) {
                        await this.safeDeleteFile(file.path);
                    }
                    cleanedFiles++;
                    bytesCleaned += file.size;
                }
                catch (error) {
                    this.errorAggregator.addError((0, error_handling_js_1.createHandoffError)(handoff_types_js_1.HandoffErrorType.CLEANUP_ERROR, `Failed to clean archive file: ${file.path}`, 'Check file permissions and disk space', file.path));
                }
            }
        }
        return { totalFiles, cleanedFiles, bytesCleaned };
    }
    /**
     * Enforce archive size limits by removing oldest files
     *
     * @param policy - Cleanup policy
     * @returns Cleanup result for size enforcement
     */
    async enforceArchiveSizeLimit(policy) {
        if (!policy.maxArchiveSize) {
            return { cleanedFiles: 0, bytesCleaned: 0 };
        }
        const archiveDir = path.join(this.config.base_path, 'archive');
        const files = await this.getFileCleanupInfo(archiveDir);
        // Sort by age (oldest first)
        files.sort((a, b) => b.age - a.age);
        let totalSize = files.reduce((sum, file) => sum + file.size, 0);
        let cleanedFiles = 0;
        let bytesCleaned = 0;
        // Remove oldest files until under size limit
        for (const file of files) {
            if (totalSize <= policy.maxArchiveSize) {
                break;
            }
            try {
                if (!policy.dryRun) {
                    await this.safeDeleteFile(file.path);
                }
                totalSize -= file.size;
                cleanedFiles++;
                bytesCleaned += file.size;
            }
            catch (error) {
                this.errorAggregator.addError((0, error_handling_js_1.createHandoffError)(handoff_types_js_1.HandoffErrorType.CLEANUP_ERROR, `Failed to enforce size limit for: ${file.path}`, 'Check file permissions and disk space', file.path));
            }
        }
        return { cleanedFiles, bytesCleaned };
    }
    /**
     * Get file cleanup information for a directory
     *
     * @param dirPath - Directory path to analyze
     * @returns Array of file cleanup info
     */
    async getFileCleanupInfo(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            const fileInfos = [];
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                try {
                    const stats = await fs.stat(filePath);
                    const parsed = (0, file_naming_js_1.parseHandoffFilename)(file);
                    if (parsed && stats.isFile()) {
                        const age = Math.floor((Date.now() - stats.mtime.getTime()) / (24 * 60 * 60 * 1000));
                        fileInfos.push({
                            path: filePath,
                            age,
                            size: stats.size,
                            phase: parsed.phase,
                            taskId: parsed.task_id,
                            timestamp: parsed.timestamp,
                            type: parsed.type
                        });
                    }
                }
                catch (error) {
                    // Skip files that can't be analyzed
                    continue;
                }
            }
            return fileInfos;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw (0, error_handling_js_1.normalizeError)(error);
        }
    }
    /**
     * Analyze input files for cleanup statistics
     *
     * @param policy - Cleanup policy
     * @returns Analysis result
     */
    async analyzeInputFiles(policy) {
        const files = await this.getFileCleanupInfo(path.join(this.config.base_path, 'input'));
        const eligible = files.filter(file => file.age > policy.inputRetentionDays).length;
        return { total: files.length, eligible };
    }
    /**
     * Analyze output files for cleanup statistics
     *
     * @param policy - Cleanup policy
     * @returns Analysis result
     */
    async analyzeOutputFiles(policy) {
        const files = await this.getFileCleanupInfo(path.join(this.config.base_path, 'output'));
        const eligible = files.filter(file => file.age > policy.outputRetentionDays).length;
        return { total: files.length, eligible };
    }
    /**
     * Analyze archive files for statistics
     *
     * @returns Analysis result
     */
    async analyzeArchiveFiles() {
        const files = await this.getFileCleanupInfo(path.join(this.config.base_path, 'archive'));
        const size = files.reduce((sum, file) => sum + file.size, 0);
        return { total: files.length, size };
    }
    /**
     * Safely delete a file with error handling
     *
     * @param filePath - File path to delete
     */
    async safeDeleteFile(filePath) {
        const result = await (0, error_handling_js_1.executeWithRetry)(() => fs.unlink(filePath), {
            maxRetries: 2,
            retryableErrors: [handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR]
        });
        if (!result.success) {
            throw result.error;
        }
    }
}
exports.HandoffCleanupManager = HandoffCleanupManager;
/**
 * Create a new cleanup manager
 *
 * @param config - Handoff configuration
 * @returns HandoffCleanupManager instance
 */
function createCleanupManager(config) {
    return new HandoffCleanupManager(config);
}
/**
 * Execute quick cleanup with default settings
 *
 * @param config - Handoff configuration
 * @param policy - Optional cleanup policy
 * @returns Promise with cleanup result
 */
async function executeCleanup(config, policy) {
    const manager = createCleanupManager(config);
    return manager.executeCleanup(policy);
}
/**
 * Get cleanup statistics without performing cleanup
 *
 * @param config - Handoff configuration
 * @param policy - Optional cleanup policy
 * @returns Promise with cleanup statistics
 */
async function getCleanupStats(config, policy) {
    const manager = createCleanupManager(config);
    return manager.getCleanupStats(policy);
}
/**
 * Schedule automatic cleanup (stub for future implementation)
 *
 * @param config - Handoff configuration
 * @param intervalHours - Cleanup interval in hours
 * @returns Cleanup scheduler (placeholder)
 */
function scheduleCleanup(config, intervalHours = 24) {
    // TODO: Implement actual scheduling with cron-like functionality
    // For now, return a stub that can be extended later
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const intervalId = setInterval(async () => {
        try {
            await executeCleanup(config);
        }
        catch (error) {
            // Log error but don't throw to prevent scheduler from stopping
            console.warn('Scheduled cleanup failed:', error);
        }
    }, intervalMs);
    return {
        stop: () => clearInterval(intervalId)
    };
}

"use strict";
/**
 * File Management Utilities
 *
 * Core file operations for handoff communication with comprehensive error handling.
 * Integrates validation, error handling, and file naming utilities.
 *
 * @created 2025-09-05-1824
 * @source dev/auto/subagent-workflow-integration-design.md lines 225-232, 580-592
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
exports.HandoffFileManager = exports.DEFAULT_HANDOFF_CONFIG = void 0;
exports.createFileManager = createFileManager;
exports.writeHandoffInput = writeHandoffInput;
exports.readHandoffInput = readHandoffInput;
exports.writeHandoffOutput = writeHandoffOutput;
exports.readHandoffOutput = readHandoffOutput;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const handoff_types_js_1 = require("../interfaces/handoff-types.js");
const file_naming_js_1 = require("./file-naming.js");
const validation_js_1 = require("./validation.js");
const error_handling_js_1 = require("./error-handling.js");
/**
 * Default handoff configuration
 */
exports.DEFAULT_HANDOFF_CONFIG = {
    base_path: '.claude/handoff',
    input_retention_days: 7,
    output_retention_days: 30,
    cleanup_strategy: 'automated',
    file_naming_pattern: '{phase}-{context|results}-{task-id}-{timestamp}.json'
};
/**
 * Main file manager class for handoff operations
 */
class HandoffFileManager {
    constructor(config = {}) {
        this.config = { ...exports.DEFAULT_HANDOFF_CONFIG, ...config };
    }
    /**
     * Write handoff input to file
     *
     * @param input - HandoffInput data
     * @param options - File operation options
     * @returns Promise with operation result
     */
    async writeInput(input, options = {}) {
        const opts = {
            timeout: 5000,
            retries: 3,
            createDirs: true,
            validate: true,
            ...options
        };
        return (0, error_handling_js_1.executeWithRetry)(async () => {
            return (0, error_handling_js_1.executeWithTimeout)(async () => {
                // Sanitize and validate input
                const sanitizedInput = (0, validation_js_1.sanitizeHandoffInput)(input);
                if (opts.validate) {
                    const validation = (0, validation_js_1.validateHandoffInput)(sanitizedInput);
                    if (!validation.success) {
                        throw (0, validation_js_1.createValidationError)(validation.errors);
                    }
                }
                // Generate filename
                const filename = (0, file_naming_js_1.generateInputFilename)(input.workflow_phase, input.task_id, (0, file_naming_js_1.generateTimestamp)());
                const filePath = path.join(this.config.base_path, 'input', filename);
                // Create directories if needed
                if (opts.createDirs) {
                    await this.ensureDirectoryExists(path.dirname(filePath));
                }
                // Write file
                const content = JSON.stringify(sanitizedInput, null, 2);
                await fs.writeFile(filePath, content, 'utf8');
                return filePath;
            }, { timeoutMs: opts.timeout });
        }, {
            maxRetries: opts.retries,
            retryableErrors: [handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR, handoff_types_js_1.HandoffErrorType.TIMEOUT_ERROR]
        });
    }
    /**
     * Read handoff input from file
     *
     * @param filePath - Path to input file
     * @param options - File operation options
     * @returns Promise with operation result
     */
    async readInput(filePath, options = {}) {
        const opts = { timeout: 5000, retries: 3, validate: true, ...options };
        return (0, error_handling_js_1.executeWithRetry)(async () => {
            return (0, error_handling_js_1.executeWithTimeout)(async () => {
                const content = await fs.readFile(filePath, 'utf8');
                const data = JSON.parse(content);
                if (opts.validate) {
                    const validation = (0, validation_js_1.validateHandoffInput)(data);
                    if (!validation.success) {
                        throw (0, validation_js_1.createValidationError)(validation.errors, filePath);
                    }
                    return validation.data;
                }
                return data;
            }, { timeoutMs: opts.timeout });
        }, {
            maxRetries: opts.retries,
            retryableErrors: [handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR, handoff_types_js_1.HandoffErrorType.TIMEOUT_ERROR]
        });
    }
    /**
     * Write handoff output to file
     *
     * @param output - HandoffOutput data
     * @param options - File operation options
     * @returns Promise with operation result
     */
    async writeOutput(output, options = {}) {
        const opts = {
            timeout: 5000,
            retries: 3,
            createDirs: true,
            validate: true,
            ...options
        };
        return (0, error_handling_js_1.executeWithRetry)(async () => {
            return (0, error_handling_js_1.executeWithTimeout)(async () => {
                // Validate output
                if (opts.validate) {
                    const validation = (0, validation_js_1.validateHandoffOutput)(output);
                    if (!validation.success) {
                        throw (0, validation_js_1.createValidationError)(validation.errors);
                    }
                }
                // Determine phase from existing input file or use 'execution' as default
                const phaseString = await this.determinePhaseFromTaskId(output.task_id) || 'execution';
                const phase = phaseString;
                // Generate filename
                const filename = (0, file_naming_js_1.generateOutputFilename)(phase, output.task_id, (0, file_naming_js_1.generateTimestamp)());
                const filePath = path.join(this.config.base_path, 'output', filename);
                // Create directories if needed
                if (opts.createDirs) {
                    await this.ensureDirectoryExists(path.dirname(filePath));
                }
                // Write file
                const content = JSON.stringify(output, null, 2);
                await fs.writeFile(filePath, content, 'utf8');
                return filePath;
            }, { timeoutMs: opts.timeout });
        }, {
            maxRetries: opts.retries,
            retryableErrors: [handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR, handoff_types_js_1.HandoffErrorType.TIMEOUT_ERROR]
        });
    }
    /**
     * Read handoff output from file
     *
     * @param filePath - Path to output file
     * @param options - File operation options
     * @returns Promise with operation result
     */
    async readOutput(filePath, options = {}) {
        const opts = { timeout: 5000, retries: 3, validate: true, ...options };
        return (0, error_handling_js_1.executeWithRetry)(async () => {
            return (0, error_handling_js_1.executeWithTimeout)(async () => {
                const content = await fs.readFile(filePath, 'utf8');
                const data = JSON.parse(content);
                if (opts.validate) {
                    const validation = (0, validation_js_1.validateHandoffOutput)(data);
                    if (!validation.success) {
                        throw (0, validation_js_1.createValidationError)(validation.errors, filePath);
                    }
                    return validation.data;
                }
                return data;
            }, { timeoutMs: opts.timeout });
        }, {
            maxRetries: opts.retries,
            retryableErrors: [handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR, handoff_types_js_1.HandoffErrorType.TIMEOUT_ERROR]
        });
    }
    /**
     * List all input files for a specific task ID
     *
     * @param taskId - Task identifier
     * @returns Promise with list of input file paths
     */
    async listInputFiles(taskId) {
        const inputDir = path.join(this.config.base_path, 'input');
        try {
            const files = await fs.readdir(inputDir);
            const handoffFiles = files.filter(file => {
                const parsed = (0, file_naming_js_1.parseHandoffFilename)(file);
                return parsed &&
                    parsed.type === 'context' &&
                    (!taskId || parsed.task_id === taskId);
            });
            return handoffFiles.map(file => path.join(inputDir, file));
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw (0, error_handling_js_1.normalizeError)(error);
        }
    }
    /**
     * List all output files for a specific task ID
     *
     * @param taskId - Task identifier
     * @returns Promise with list of output file paths
     */
    async listOutputFiles(taskId) {
        const outputDir = path.join(this.config.base_path, 'output');
        try {
            const files = await fs.readdir(outputDir);
            const handoffFiles = files.filter(file => {
                const parsed = (0, file_naming_js_1.parseHandoffFilename)(file);
                return parsed &&
                    parsed.type === 'results' &&
                    (!taskId || parsed.task_id === taskId);
            });
            return handoffFiles.map(file => path.join(outputDir, file));
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw (0, error_handling_js_1.normalizeError)(error);
        }
    }
    /**
     * Archive completed handoff files
     *
     * @param taskId - Task identifier
     * @returns Promise with operation result
     */
    async archiveTask(taskId) {
        return (0, error_handling_js_1.executeWithRetry)(async () => {
            const inputFiles = await this.listInputFiles(taskId);
            const outputFiles = await this.listOutputFiles(taskId);
            const allFiles = [...inputFiles, ...outputFiles];
            if (allFiles.length === 0) {
                return [];
            }
            const archiveDir = path.join(this.config.base_path, 'archive');
            await this.ensureDirectoryExists(archiveDir);
            const archivedFiles = [];
            for (const file of allFiles) {
                const filename = path.basename(file);
                const archivePath = path.join(archiveDir, filename);
                // Copy to archive
                await fs.copyFile(file, archivePath);
                // Remove original
                await fs.unlink(file);
                archivedFiles.push(archivePath);
            }
            return archivedFiles;
        }, error_handling_js_1.DEFAULT_RETRY_CONFIG);
    }
    /**
     * Get handoff configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update handoff configuration
     *
     * @param config - Partial configuration to update
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Ensure directory exists, creating it if necessary
     *
     * @param dirPath - Directory path
     */
    async ensureDirectoryExists(dirPath) {
        try {
            await fs.access(dirPath);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                await fs.mkdir(dirPath, { recursive: true });
            }
            else {
                throw (0, error_handling_js_1.normalizeError)(error);
            }
        }
    }
    /**
     * Determine workflow phase from existing input files for a task
     *
     * @param taskId - Task identifier
     * @returns Phase or null if not found
     */
    async determinePhaseFromTaskId(taskId) {
        try {
            const inputFiles = await this.listInputFiles(taskId);
            if (inputFiles.length > 0) {
                const filename = path.basename(inputFiles[inputFiles.length - 1]); // Get latest
                const parsed = (0, file_naming_js_1.parseHandoffFilename)(filename);
                return (parsed === null || parsed === void 0 ? void 0 : parsed.phase) || null;
            }
            return null;
        }
        catch (_a) {
            return null;
        }
    }
}
exports.HandoffFileManager = HandoffFileManager;
/**
 * Create a new HandoffFileManager instance
 *
 * @param config - Optional configuration
 * @returns HandoffFileManager instance
 */
function createFileManager(config) {
    return new HandoffFileManager(config);
}
/**
 * Quick write input utility
 *
 * @param input - HandoffInput data
 * @param config - Optional configuration
 * @returns Promise with file path
 */
async function writeHandoffInput(input, config) {
    const manager = createFileManager(config);
    const result = await manager.writeInput(input);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
}
/**
 * Quick read input utility
 *
 * @param filePath - Path to input file
 * @param config - Optional configuration
 * @returns Promise with HandoffInput data
 */
async function readHandoffInput(filePath, config) {
    const manager = createFileManager(config);
    const result = await manager.readInput(filePath);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
}
/**
 * Quick write output utility
 *
 * @param output - HandoffOutput data
 * @param config - Optional configuration
 * @returns Promise with file path
 */
async function writeHandoffOutput(output, config) {
    const manager = createFileManager(config);
    const result = await manager.writeOutput(output);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
}
/**
 * Quick read output utility
 *
 * @param filePath - Path to output file
 * @param config - Optional configuration
 * @returns Promise with HandoffOutput data
 */
async function readHandoffOutput(filePath, config) {
    const manager = createFileManager(config);
    const result = await manager.readOutput(filePath);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
}

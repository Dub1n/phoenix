"use strict";
/**
 * File-Based Handoff Infrastructure - Main Entry Point
 *
 * TASK-SUBAGENT-001 implementation for Claude Code subagent workflow integration.
 * Provides complete file-based handoff communication system.
 *
 * @created 2025-09-05-1824
 * @version 1.0.0
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_ID = exports.BUILD_DATE = exports.VERSION = exports.DEFAULT_CONFIG = exports.runQuickValidationTest = exports.TestRunner = exports.TestEnvironment = exports.TestDataGenerator = exports.isValidHandoffFilename = exports.parseHandoffFilename = exports.generateTaskId = exports.generateTimestamp = exports.generateOutputFilename = exports.generateInputFilename = exports.generateHandoffFilename = exports.createValidationError = exports.sanitizeHandoffInput = exports.validateHandoffOutput = exports.validateHandoffInput = exports.CircuitBreaker = exports.ErrorAggregator = exports.createHandoffError = exports.executeWithRetryAndTimeout = exports.executeWithTimeout = exports.executeWithRetry = exports.getCleanupStats = exports.executeCleanup = exports.createCleanupManager = exports.CleanupManager = exports.configureAuditLogger = exports.createAuditLogger = exports.getAuditLogger = exports.AuditLogger = exports.readOutput = exports.writeOutput = exports.readInput = exports.writeInput = exports.createFileManager = exports.FileManager = void 0;
// Fixed critical import/export issues - corrected module references and removed .js extensions for TypeScript compatibility
// Implements typescript-import-resolution-pattern with relative imports
// Core interfaces and types
__exportStar(require("./interfaces/handoff-types"), exports);
// Utility modules
__exportStar(require("./utils/file-naming"), exports);
__exportStar(require("./utils/validation"), exports);
__exportStar(require("./utils/error-handling"), exports);
__exportStar(require("./utils/file-manager"), exports);
__exportStar(require("./utils/cleanup"), exports);
__exportStar(require("./utils/audit-logger"), exports);
__exportStar(require("./utils/test-utilities"), exports);
// Research agent implementation available in utils/ directory (TASK-SUBAGENT-002)
// Re-export commonly used classes and functions with convenience names
var file_manager_1 = require("./utils/file-manager");
Object.defineProperty(exports, "FileManager", { enumerable: true, get: function () { return file_manager_1.HandoffFileManager; } });
Object.defineProperty(exports, "createFileManager", { enumerable: true, get: function () { return file_manager_1.createFileManager; } });
Object.defineProperty(exports, "writeInput", { enumerable: true, get: function () { return file_manager_1.writeHandoffInput; } });
Object.defineProperty(exports, "readInput", { enumerable: true, get: function () { return file_manager_1.readHandoffInput; } });
Object.defineProperty(exports, "writeOutput", { enumerable: true, get: function () { return file_manager_1.writeHandoffOutput; } });
Object.defineProperty(exports, "readOutput", { enumerable: true, get: function () { return file_manager_1.readHandoffOutput; } });
var audit_logger_1 = require("./utils/audit-logger");
Object.defineProperty(exports, "AuditLogger", { enumerable: true, get: function () { return audit_logger_1.HandoffAuditLogger; } });
Object.defineProperty(exports, "getAuditLogger", { enumerable: true, get: function () { return audit_logger_1.getAuditLogger; } });
Object.defineProperty(exports, "createAuditLogger", { enumerable: true, get: function () { return audit_logger_1.createAuditLogger; } });
Object.defineProperty(exports, "configureAuditLogger", { enumerable: true, get: function () { return audit_logger_1.configureAuditLogger; } });
var cleanup_1 = require("./utils/cleanup");
Object.defineProperty(exports, "CleanupManager", { enumerable: true, get: function () { return cleanup_1.HandoffCleanupManager; } });
Object.defineProperty(exports, "createCleanupManager", { enumerable: true, get: function () { return cleanup_1.createCleanupManager; } });
Object.defineProperty(exports, "executeCleanup", { enumerable: true, get: function () { return cleanup_1.executeCleanup; } });
Object.defineProperty(exports, "getCleanupStats", { enumerable: true, get: function () { return cleanup_1.getCleanupStats; } });
var error_handling_1 = require("./utils/error-handling");
Object.defineProperty(exports, "executeWithRetry", { enumerable: true, get: function () { return error_handling_1.executeWithRetry; } });
Object.defineProperty(exports, "executeWithTimeout", { enumerable: true, get: function () { return error_handling_1.executeWithTimeout; } });
Object.defineProperty(exports, "executeWithRetryAndTimeout", { enumerable: true, get: function () { return error_handling_1.executeWithRetryAndTimeout; } });
Object.defineProperty(exports, "createHandoffError", { enumerable: true, get: function () { return error_handling_1.createHandoffError; } });
Object.defineProperty(exports, "ErrorAggregator", { enumerable: true, get: function () { return error_handling_1.ErrorAggregator; } });
Object.defineProperty(exports, "CircuitBreaker", { enumerable: true, get: function () { return error_handling_1.CircuitBreaker; } });
var validation_1 = require("./utils/validation");
Object.defineProperty(exports, "validateHandoffInput", { enumerable: true, get: function () { return validation_1.validateHandoffInput; } });
Object.defineProperty(exports, "validateHandoffOutput", { enumerable: true, get: function () { return validation_1.validateHandoffOutput; } });
Object.defineProperty(exports, "sanitizeHandoffInput", { enumerable: true, get: function () { return validation_1.sanitizeHandoffInput; } });
Object.defineProperty(exports, "createValidationError", { enumerable: true, get: function () { return validation_1.createValidationError; } });
var file_naming_1 = require("./utils/file-naming");
Object.defineProperty(exports, "generateHandoffFilename", { enumerable: true, get: function () { return file_naming_1.generateHandoffFilename; } });
Object.defineProperty(exports, "generateInputFilename", { enumerable: true, get: function () { return file_naming_1.generateInputFilename; } });
Object.defineProperty(exports, "generateOutputFilename", { enumerable: true, get: function () { return file_naming_1.generateOutputFilename; } });
Object.defineProperty(exports, "generateTimestamp", { enumerable: true, get: function () { return file_naming_1.generateTimestamp; } });
Object.defineProperty(exports, "generateTaskId", { enumerable: true, get: function () { return file_naming_1.generateTaskId; } });
Object.defineProperty(exports, "parseHandoffFilename", { enumerable: true, get: function () { return file_naming_1.parseHandoffFilename; } });
Object.defineProperty(exports, "isValidHandoffFilename", { enumerable: true, get: function () { return file_naming_1.isValidHandoffFilename; } });
var test_utilities_1 = require("./utils/test-utilities");
Object.defineProperty(exports, "TestDataGenerator", { enumerable: true, get: function () { return test_utilities_1.HandoffTestDataGenerator; } });
Object.defineProperty(exports, "TestEnvironment", { enumerable: true, get: function () { return test_utilities_1.HandoffTestEnvironment; } });
Object.defineProperty(exports, "TestRunner", { enumerable: true, get: function () { return test_utilities_1.HandoffTestRunner; } });
Object.defineProperty(exports, "runQuickValidationTest", { enumerable: true, get: function () { return test_utilities_1.runQuickValidationTest; } });
// Research agent exports available via utils/ directory (TASK-SUBAGENT-002)
/**
 * Default configuration for handoff system
 */
exports.DEFAULT_CONFIG = {
    base_path: '.claude/handoff',
    input_retention_days: 7,
    output_retention_days: 30,
    cleanup_strategy: 'automated',
    file_naming_pattern: '{phase}-{context|results}-{task-id}-{timestamp}.json'
};
/**
 * Version information
 */
exports.VERSION = '1.0.0';
exports.BUILD_DATE = '2025-09-05-1824';
exports.TASK_ID = 'TASK-SUBAGENT-001';

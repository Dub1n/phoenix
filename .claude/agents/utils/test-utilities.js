"use strict";
/**
 * Test Utilities for Handoff Infrastructure
 *
 * Comprehensive test utilities for validating handoff system functionality.
 * Provides mock data, test scenarios, and validation helpers.
 *
 * @created 2025-09-05-1824
 * @source TASK-SUBAGENT-001 testing requirements
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
exports.HandoffTestRunner = exports.HandoffTestEnvironment = exports.HandoffTestDataGenerator = void 0;
exports.runQuickValidationTest = runQuickValidationTest;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const handoff_types_js_1 = require("../interfaces/handoff-types.js");
const file_naming_js_1 = require("./file-naming.js");
const file_manager_js_1 = require("./file-manager.js");
const audit_logger_js_1 = require("./audit-logger.js");
const cleanup_js_1 = require("./cleanup.js");
/**
 * Mock data generators
 */
class HandoffTestDataGenerator {
    /**
     * Generate mock HandoffInput
     *
     * @param overrides - Property overrides
     * @returns Mock HandoffInput
     */
    static generateMockInput(overrides = {}) {
        const taskId = (0, file_naming_js_1.generateTaskId)('TEST');
        return {
            project: 'TestProject',
            task_id: taskId,
            workflow_phase: 'research',
            context: {
                task_description: 'Test task for handoff system validation',
                requirements: [
                    'Validate file-based communication',
                    'Test error handling',
                    'Verify audit trail'
                ],
                constraints: [
                    'Maximum execution time: 300 seconds',
                    'Memory limit: 512MB'
                ],
                relevant_files: [
                    'test-file-1.ts',
                    'test-file-2.ts'
                ]
            },
            execution_parameters: {
                max_execution_time: 300000,
                confidence_threshold: 'medium',
                fallback_strategy: 'retry_with_reduced_scope'
            },
            ...overrides
        };
    }
    /**
     * Generate mock HandoffOutput
     *
     * @param taskId - Task identifier
     * @param overrides - Property overrides
     * @returns Mock HandoffOutput
     */
    static generateMockOutput(taskId, overrides = {}) {
        return {
            task_id: taskId,
            status: 'success',
            confidence: 'high',
            execution_time_ms: 5000,
            results: {
                primary_data: {
                    analysis_result: 'Test analysis completed successfully',
                    recommendations_implemented: 3,
                    files_processed: 2
                },
                summary: 'Test handoff operation completed successfully with all validations passing',
                recommendations: [
                    'Continue with next phase of testing',
                    'Monitor system performance',
                    'Update documentation'
                ],
                evidence_files: [
                    'test-evidence-1.json',
                    'test-evidence-2.log'
                ]
            },
            next_action: 'continue',
            metadata: {
                files_accessed: [
                    'test-file-1.ts',
                    'test-file-2.ts'
                ],
                tools_used: [
                    'file-system-validator',
                    'schema-validator',
                    'audit-logger'
                ],
                token_usage_estimate: 1500
            },
            ...overrides
        };
    }
    /**
     * Generate mock error scenario
     *
     * @param type - Error type
     * @param message - Error message
     * @returns Mock HandoffError
     */
    static generateMockError(type = handoff_types_js_1.HandoffErrorType.FILE_ACCESS_ERROR, message = 'Test error for validation') {
        return {
            type,
            message,
            timestamp: new Date().toISOString(),
            suggested_resolution: 'This is a test error - check test configuration',
            retry_count: 1
        };
    }
}
exports.HandoffTestDataGenerator = HandoffTestDataGenerator;
/**
 * Test environment manager
 */
class HandoffTestEnvironment {
    constructor(testDir = '.claude/test-handoff') {
        this.testDir = testDir;
        this.config = {
            base_path: testDir,
            input_retention_days: 1,
            output_retention_days: 1,
            cleanup_strategy: 'manual',
            file_naming_pattern: '{phase}-{context|results}-{task-id}-{timestamp}.json'
        };
        this.fileManager = new file_manager_js_1.HandoffFileManager(this.config);
        this.auditLogger = new audit_logger_js_1.HandoffAuditLogger({
            logDirectory: path.join(testDir, 'logs'),
            enableConsoleOutput: false,
            enableFileOutput: false, // Disable for tests
            logLevel: 'DEBUG'
        });
        this.cleanupManager = new cleanup_js_1.HandoffCleanupManager(this.config);
    }
    /**
     * Set up test environment
     */
    async setup() {
        await this.auditLogger.logInfo('test-setup', 'Setting up test environment');
        // Create test directories
        await fs.mkdir(path.join(this.testDir, 'input'), { recursive: true });
        await fs.mkdir(path.join(this.testDir, 'output'), { recursive: true });
        await fs.mkdir(path.join(this.testDir, 'archive'), { recursive: true });
        await this.auditLogger.logInfo('test-setup', 'Test environment setup complete');
    }
    /**
     * Clean up test environment
     */
    async teardown() {
        await this.auditLogger.logInfo('test-teardown', 'Cleaning up test environment');
        try {
            // Remove test directory and all contents
            await fs.rm(this.testDir, { recursive: true, force: true });
        }
        catch (error) {
            // Ignore cleanup errors in tests
        }
        await this.auditLogger.logInfo('test-teardown', 'Test environment cleanup complete');
    }
    /**
     * Get file manager for testing
     */
    getFileManager() {
        return this.fileManager;
    }
    /**
     * Get audit logger for testing
     */
    getAuditLogger() {
        return this.auditLogger;
    }
    /**
     * Get cleanup manager for testing
     */
    getCleanupManager() {
        return this.cleanupManager;
    }
    /**
     * Get test configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Create test files for cleanup testing
     *
     * @param count - Number of files to create
     * @param ageInDays - Age of files in days
     */
    async createTestFiles(count, ageInDays = 0) {
        const files = [];
        for (let i = 0; i < count; i++) {
            const input = HandoffTestDataGenerator.generateMockInput({
                task_id: (0, file_naming_js_1.generateTaskId)(`TEST${i}`)
            });
            const result = await this.fileManager.writeInput(input);
            if (result.success) {
                files.push(result.data);
                // Modify file timestamps if age specified
                if (ageInDays > 0) {
                    const ageMs = ageInDays * 24 * 60 * 60 * 1000;
                    const pastTime = new Date(Date.now() - ageMs);
                    await fs.utimes(result.data, pastTime, pastTime);
                }
            }
        }
        return files;
    }
}
exports.HandoffTestEnvironment = HandoffTestEnvironment;
/**
 * Test scenario runner
 */
class HandoffTestRunner {
    constructor(testDir) {
        this.results = [];
        this.environment = new HandoffTestEnvironment(testDir);
    }
    /**
     * Run all test scenarios
     *
     * @returns Promise with test results
     */
    async runAllTests() {
        const scenarios = this.getTestScenarios();
        await this.environment.setup();
        try {
            for (const scenario of scenarios) {
                await this.runScenario(scenario);
            }
        }
        finally {
            await this.environment.teardown();
        }
        return this.results;
    }
    /**
     * Run a specific test scenario
     *
     * @param scenario - Test scenario to run
     */
    async runScenario(scenario) {
        const startTime = Date.now();
        try {
            if (scenario.setup) {
                await scenario.setup();
            }
            // Execute scenario based on name
            await this.executeScenario(scenario);
            this.results.push({
                scenario: scenario.name,
                success: true,
                duration: Date.now() - startTime,
                details: {
                    description: scenario.description,
                    expectedResult: scenario.expectedResult
                }
            });
        }
        catch (error) {
            this.results.push({
                scenario: scenario.name,
                success: false,
                duration: Date.now() - startTime,
                error: error,
                details: {
                    description: scenario.description,
                    expectedResult: scenario.expectedResult
                }
            });
        }
        finally {
            if (scenario.teardown) {
                try {
                    await scenario.teardown();
                }
                catch (_a) {
                    // Ignore teardown errors
                }
            }
        }
    }
    /**
     * Execute specific test scenario
     *
     * @param scenario - Test scenario
     */
    async executeScenario(scenario) {
        const fileManager = this.environment.getFileManager();
        const auditLogger = this.environment.getAuditLogger();
        const cleanupManager = this.environment.getCleanupManager();
        switch (scenario.name) {
            case 'file-write-read-cycle':
                await this.testFileWriteReadCycle(fileManager, auditLogger);
                break;
            case 'validation-error-handling':
                await this.testValidationErrorHandling(fileManager, auditLogger);
                break;
            case 'cleanup-functionality':
                await this.testCleanupFunctionality(cleanupManager, auditLogger);
                break;
            case 'audit-trail-logging':
                await this.testAuditTrailLogging(auditLogger);
                break;
            case 'error-recovery':
                await this.testErrorRecovery(fileManager, auditLogger);
                break;
            case 'concurrent-operations':
                await this.testConcurrentOperations(fileManager, auditLogger);
                break;
            default:
                throw new Error(`Unknown test scenario: ${scenario.name}`);
        }
    }
    /**
     * Test file write/read cycle
     */
    async testFileWriteReadCycle(fileManager, auditLogger) {
        const input = HandoffTestDataGenerator.generateMockInput();
        // Write input
        const writeResult = await fileManager.writeInput(input);
        if (!writeResult.success) {
            throw new Error('Failed to write input file');
        }
        // Read input back
        const readResult = await fileManager.readInput(writeResult.data);
        if (!readResult.success) {
            throw new Error('Failed to read input file');
        }
        // Validate data integrity
        if (readResult.data.task_id !== input.task_id) {
            throw new Error('Data integrity check failed');
        }
        await auditLogger.logInfo('test-file-cycle', 'File write/read cycle completed successfully');
    }
    /**
     * Test validation error handling
     */
    async testValidationErrorHandling(fileManager, auditLogger) {
        const invalidInput = {
            // Missing required fields to trigger validation errors
            project: '',
            invalid_field: 'should not be here'
        };
        const result = await fileManager.writeInput(invalidInput);
        // Should fail validation
        if (result.success) {
            throw new Error('Validation should have failed for invalid input');
        }
        await auditLogger.logInfo('test-validation', 'Validation error handling test passed');
    }
    /**
     * Test cleanup functionality
     */
    async testCleanupFunctionality(cleanupManager, auditLogger) {
        // Create test files with different ages
        await this.environment.createTestFiles(5, 2); // 5 files, 2 days old
        const result = await cleanupManager.executeCleanup({
            inputRetentionDays: 1,
            outputRetentionDays: 1,
            dryRun: true
        });
        if (result.errors.length > 0) {
            throw new Error('Cleanup operation had errors');
        }
        await auditLogger.logInfo('test-cleanup', 'Cleanup functionality test passed');
    }
    /**
     * Test audit trail logging
     */
    async testAuditTrailLogging(auditLogger) {
        const taskId = (0, file_naming_js_1.generateTaskId)('AUDIT');
        // Test various log levels
        await auditLogger.logDebug('test-operation', 'Debug message');
        await auditLogger.logInfo('test-operation', 'Info message');
        await auditLogger.logWarning('test-operation', 'Warning message');
        // Test operation logging
        await auditLogger.logInputOperation('test-input', taskId, 'test-file.json');
        await auditLogger.logOutputOperation('test-output', taskId, 'test-result.json');
        // Test error logging
        const mockError = HandoffTestDataGenerator.generateMockError();
        await auditLogger.logError('test-error', mockError);
        // Audit trail logging test always passes if no exceptions thrown
    }
    /**
     * Test error recovery mechanisms
     */
    async testErrorRecovery(fileManager, auditLogger) {
        // Test with non-existent file path
        const result = await fileManager.readInput('/nonexistent/path/file.json');
        // Should fail gracefully with error
        if (result.success) {
            throw new Error('Should have failed reading nonexistent file');
        }
        if (!result.error) {
            throw new Error('Should have error information');
        }
        await auditLogger.logInfo('test-error-recovery', 'Error recovery test passed');
    }
    /**
     * Test concurrent operations
     */
    async testConcurrentOperations(fileManager, auditLogger) {
        const operations = [];
        // Start multiple concurrent write operations
        for (let i = 0; i < 5; i++) {
            const input = HandoffTestDataGenerator.generateMockInput({
                task_id: (0, file_naming_js_1.generateTaskId)(`CONCURRENT${i}`)
            });
            operations.push(fileManager.writeInput(input));
        }
        const results = await Promise.all(operations);
        // All operations should succeed
        const failures = results.filter(result => !result.success);
        if (failures.length > 0) {
            throw new Error(`${failures.length} concurrent operations failed`);
        }
        await auditLogger.logInfo('test-concurrent', 'Concurrent operations test passed');
    }
    /**
     * Get all test scenarios
     *
     * @returns Array of test scenarios
     */
    getTestScenarios() {
        return [
            {
                name: 'file-write-read-cycle',
                description: 'Test complete file write and read cycle with validation',
                expectedResult: 'success'
            },
            {
                name: 'validation-error-handling',
                description: 'Test proper handling of validation errors',
                expectedResult: 'success'
            },
            {
                name: 'cleanup-functionality',
                description: 'Test automated cleanup with retention policies',
                expectedResult: 'success'
            },
            {
                name: 'audit-trail-logging',
                description: 'Test comprehensive audit trail logging',
                expectedResult: 'success'
            },
            {
                name: 'error-recovery',
                description: 'Test error recovery mechanisms',
                expectedResult: 'success'
            },
            {
                name: 'concurrent-operations',
                description: 'Test concurrent file operations',
                expectedResult: 'success'
            }
        ];
    }
    /**
     * Get test results summary
     */
    getResultSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.success).length;
        const failed = total - passed;
        const successRate = total > 0 ? (passed / total) * 100 : 0;
        return { total, passed, failed, successRate };
    }
}
exports.HandoffTestRunner = HandoffTestRunner;
/**
 * Run quick validation test
 *
 * @returns Promise with test success status
 */
async function runQuickValidationTest() {
    const runner = new HandoffTestRunner('.claude/test-quick');
    try {
        const results = await runner.runAllTests();
        const summary = runner.getResultSummary();
        return summary.successRate >= 90; // 90% success rate required
    }
    catch (_a) {
        return false;
    }
}

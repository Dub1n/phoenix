/**
 * Test Utilities for Handoff Infrastructure
 * 
 * Comprehensive test utilities for validating handoff system functionality.
 * Provides mock data, test scenarios, and validation helpers.
 * 
 * @created 2025-09-05-1824
 * @source TASK-SUBAGENT-001 testing requirements
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { HandoffInput, HandoffOutput, HandoffConfig, HandoffError, HandoffErrorType } from '../interfaces/handoff-types.js';
import { generateTaskId, generateTimestamp } from './file-naming.js';
import { HandoffFileManager } from './file-manager.js';
import { HandoffAuditLogger } from './audit-logger.js';
import { HandoffCleanupManager } from './cleanup.js';

/**
 * Test scenario configuration
 */
export interface TestScenario {
  name: string;
  description: string;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  expectedResult: 'success' | 'failure' | 'partial';
}

/**
 * Test result summary
 */
export interface TestResult {
  scenario: string;
  success: boolean;
  duration: number;
  error?: Error;
  details: Record<string, any>;
}

/**
 * Mock data generators
 */
export class HandoffTestDataGenerator {
  /**
   * Generate mock HandoffInput
   * 
   * @param overrides - Property overrides
   * @returns Mock HandoffInput
   */
  static generateMockInput(overrides: Partial<HandoffInput> = {}): HandoffInput {
    const taskId = generateTaskId('TEST');
    
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
  static generateMockOutput(taskId: string, overrides: Partial<HandoffOutput> = {}): HandoffOutput {
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
  static generateMockError(
    type: HandoffErrorType = HandoffErrorType.FILE_ACCESS_ERROR,
    message: string = 'Test error for validation'
  ): HandoffError {
    return {
      type,
      message,
      timestamp: new Date().toISOString(),
      suggested_resolution: 'This is a test error - check test configuration',
      retry_count: 1
    };
  }
}

/**
 * Test environment manager
 */
export class HandoffTestEnvironment {
  private config: HandoffConfig;
  private testDir: string;
  private fileManager: HandoffFileManager;
  private auditLogger: HandoffAuditLogger;
  private cleanupManager: HandoffCleanupManager;
  
  constructor(testDir: string = '.claude/test-handoff') {
    this.testDir = testDir;
    this.config = {
      base_path: testDir,
      input_retention_days: 1,
      output_retention_days: 1,
      cleanup_strategy: 'manual',
      file_naming_pattern: '{phase}-{context|results}-{task-id}-{timestamp}.json'
    };
    
    this.fileManager = new HandoffFileManager(this.config);
    this.auditLogger = new HandoffAuditLogger({
      logDirectory: path.join(testDir, 'logs'),
      enableConsoleOutput: false,
      enableFileOutput: false, // Disable for tests
      logLevel: 'DEBUG' as any
    });
    this.cleanupManager = new HandoffCleanupManager(this.config);
  }
  
  /**
   * Set up test environment
   */
  async setup(): Promise<void> {
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
  async teardown(): Promise<void> {
    await this.auditLogger.logInfo('test-teardown', 'Cleaning up test environment');
    
    try {
      // Remove test directory and all contents
      await fs.rm(this.testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors in tests
    }
    
    await this.auditLogger.logInfo('test-teardown', 'Test environment cleanup complete');
  }
  
  /**
   * Get file manager for testing
   */
  getFileManager(): HandoffFileManager {
    return this.fileManager;
  }
  
  /**
   * Get audit logger for testing
   */
  getAuditLogger(): HandoffAuditLogger {
    return this.auditLogger;
  }
  
  /**
   * Get cleanup manager for testing
   */
  getCleanupManager(): HandoffCleanupManager {
    return this.cleanupManager;
  }
  
  /**
   * Get test configuration
   */
  getConfig(): HandoffConfig {
    return { ...this.config };
  }
  
  /**
   * Create test files for cleanup testing
   * 
   * @param count - Number of files to create
   * @param ageInDays - Age of files in days
   */
  async createTestFiles(count: number, ageInDays: number = 0): Promise<string[]> {
    const files: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const input = HandoffTestDataGenerator.generateMockInput({
        task_id: generateTaskId(`TEST${i}`)
      });
      
      const result = await this.fileManager.writeInput(input);
      if (result.success) {
        files.push(result.data!);
        
        // Modify file timestamps if age specified
        if (ageInDays > 0) {
          const ageMs = ageInDays * 24 * 60 * 60 * 1000;
          const pastTime = new Date(Date.now() - ageMs);
          await fs.utimes(result.data!, pastTime, pastTime);
        }
      }
    }
    
    return files;
  }
}

/**
 * Test scenario runner
 */
export class HandoffTestRunner {
  private environment: HandoffTestEnvironment;
  private results: TestResult[] = [];
  
  constructor(testDir?: string) {
    this.environment = new HandoffTestEnvironment(testDir);
  }
  
  /**
   * Run all test scenarios
   * 
   * @returns Promise with test results
   */
  async runAllTests(): Promise<TestResult[]> {
    const scenarios = this.getTestScenarios();
    
    await this.environment.setup();
    
    try {
      for (const scenario of scenarios) {
        await this.runScenario(scenario);
      }
    } finally {
      await this.environment.teardown();
    }
    
    return this.results;
  }
  
  /**
   * Run a specific test scenario
   * 
   * @param scenario - Test scenario to run
   */
  private async runScenario(scenario: TestScenario): Promise<void> {
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
      
    } catch (error) {
      this.results.push({
        scenario: scenario.name,
        success: false,
        duration: Date.now() - startTime,
        error: error as Error,
        details: {
          description: scenario.description,
          expectedResult: scenario.expectedResult
        }
      });
    } finally {
      if (scenario.teardown) {
        try {
          await scenario.teardown();
        } catch {
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
  private async executeScenario(scenario: TestScenario): Promise<void> {
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
  private async testFileWriteReadCycle(
    fileManager: HandoffFileManager,
    auditLogger: HandoffAuditLogger
  ): Promise<void> {
    const input = HandoffTestDataGenerator.generateMockInput();
    
    // Write input
    const writeResult = await fileManager.writeInput(input);
    if (!writeResult.success) {
      throw new Error('Failed to write input file');
    }
    
    // Read input back
    const readResult = await fileManager.readInput(writeResult.data!);
    if (!readResult.success) {
      throw new Error('Failed to read input file');
    }
    
    // Validate data integrity
    if (readResult.data!.task_id !== input.task_id) {
      throw new Error('Data integrity check failed');
    }
    
    await auditLogger.logInfo('test-file-cycle', 'File write/read cycle completed successfully');
  }
  
  /**
   * Test validation error handling
   */
  private async testValidationErrorHandling(
    fileManager: HandoffFileManager,
    auditLogger: HandoffAuditLogger
  ): Promise<void> {
    const invalidInput = {
      // Missing required fields to trigger validation errors
      project: '',
      invalid_field: 'should not be here'
    } as any;
    
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
  private async testCleanupFunctionality(
    cleanupManager: HandoffCleanupManager,
    auditLogger: HandoffAuditLogger
  ): Promise<void> {
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
  private async testAuditTrailLogging(auditLogger: HandoffAuditLogger): Promise<void> {
    const taskId = generateTaskId('AUDIT');
    
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
  private async testErrorRecovery(
    fileManager: HandoffFileManager,
    auditLogger: HandoffAuditLogger
  ): Promise<void> {
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
  private async testConcurrentOperations(
    fileManager: HandoffFileManager,
    auditLogger: HandoffAuditLogger
  ): Promise<void> {
    const operations = [];
    
    // Start multiple concurrent write operations
    for (let i = 0; i < 5; i++) {
      const input = HandoffTestDataGenerator.generateMockInput({
        task_id: generateTaskId(`CONCURRENT${i}`)
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
  private getTestScenarios(): TestScenario[] {
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
  getResultSummary(): {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    
    return { total, passed, failed, successRate };
  }
}

/**
 * Run quick validation test
 * 
 * @returns Promise with test success status
 */
export async function runQuickValidationTest(): Promise<boolean> {
  const runner = new HandoffTestRunner('.claude/test-quick');
  
  try {
    const results = await runner.runAllTests();
    const summary = runner.getResultSummary();
    
    return summary.successRate >= 90; // 90% success rate required
  } catch {
    return false;
  }
}
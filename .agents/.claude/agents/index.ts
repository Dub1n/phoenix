/**
 * File-Based Handoff Infrastructure - Main Entry Point
 * 
 * TASK-SUBAGENT-001 implementation for Claude Code subagent workflow integration.
 * Provides complete file-based handoff communication system.
 * 
 * @created 2025-09-05-1824
 * @version 1.0.0
 */

// Fixed critical import/export issues - corrected module references and removed .js extensions for TypeScript compatibility
// Implements typescript-import-resolution-pattern with relative imports

// Core interfaces and types
export * from './interfaces/handoff-types';

// Utility modules
export * from './utils/file-naming';
export * from './utils/validation';
export * from './utils/error-handling';
export * from './utils/file-manager';
export * from './utils/cleanup';
export * from './utils/audit-logger';
export * from './utils/test-utilities';

// Research agent implementation available in utils/ directory (TASK-SUBAGENT-002)
// Execution agent implementation available in utils/ directory (TASK-SUBAGENT-004)
export * from './utils/execution-capabilities';
export * from './utils/execution-agent-implementation';
export * from './utils/quality-gates';

// Re-export commonly used classes and functions with convenience names
export { 
  HandoffFileManager as FileManager,
  createFileManager,
  writeHandoffInput as writeInput,
  readHandoffInput as readInput,
  writeHandoffOutput as writeOutput,
  readHandoffOutput as readOutput
} from './utils/file-manager';

export {
  HandoffAuditLogger as AuditLogger,
  getAuditLogger,
  createAuditLogger,
  configureAuditLogger
} from './utils/audit-logger';

export {
  HandoffCleanupManager as CleanupManager,
  createCleanupManager,
  executeCleanup,
  getCleanupStats
} from './utils/cleanup';

export {
  executeWithRetry,
  executeWithTimeout,
  executeWithRetryAndTimeout,
  createHandoffError,
  ErrorAggregator,
  CircuitBreaker
} from './utils/error-handling';

export {
  validateHandoffInput,
  validateHandoffOutput,
  sanitizeHandoffInput,
  createValidationError
} from './utils/validation';

export {
  generateHandoffFilename,
  generateInputFilename,
  generateOutputFilename,
  generateTimestamp,
  generateTaskId,
  parseHandoffFilename,
  isValidHandoffFilename
} from './utils/file-naming';

export {
  HandoffTestDataGenerator as TestDataGenerator,
  HandoffTestEnvironment as TestEnvironment,
  HandoffTestRunner as TestRunner,
  runQuickValidationTest
} from './utils/test-utilities';

// Research agent exports available via utils/ directory (TASK-SUBAGENT-002)

/**
 * Default configuration for handoff system
 */
export const DEFAULT_CONFIG = {
  base_path: '.claude/handoff',
  input_retention_days: 7,
  output_retention_days: 30,
  cleanup_strategy: 'automated' as const,
  file_naming_pattern: '{phase}-{context|results}-{task-id}-{timestamp}.json'
};

/**
 * Version information
 */
export const VERSION = '1.0.0';
export const BUILD_DATE = '2025-09-05-1824';
export const TASK_ID = 'TASK-SUBAGENT-001';
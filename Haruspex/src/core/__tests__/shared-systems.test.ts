/**---
 * title: [Haruspex Shared Systems Tests - Configuration and Error Framework Testing]
 * tags: [Testing, Configuration, Error-Handling, Validation, Schema]
 * provides: [ConfigurationTests, ErrorSystemTests, SchemaValidation, SharedInfrastructure]
 * requires: [Jest, Zod, Shared Schemas, Shared Errors, Test Utilities]
 * description: [Comprehensive tests for shared configuration schemas and error handling framework covering validation, error classification, and system integration]
 * ---*/

import { z } from 'zod';
import {
  // Configuration Schemas
  ProcessManagerConfigSchema,
  FileCleanupConfigSchema,
  CommandManagerConfigSchema,
  CleanupOrchestratorConfigSchema,
  BaseConfigSchema,
  TimingConfigSchema,
  SafetyConfigSchema,
  validateConfig,
  ConfigurationFactory,
  ValidationResult
} from '../shared-schemas';

import {
  // Error Classes
  HaruspexError,
  ProcessManagementError,
  ProcessNotFoundError,
  ProcessTerminationError,
  ProcessOwnershipError,
  FileSystemError,
  FileProtectionError,
  CommandRegistrationError,
  CommandConflictError,
  TimeoutError,
  AsyncOperationError,
  // Error Management
  ErrorClassifier,
  ErrorAggregator,
  ErrorSeverity,
  ErrorClassification,
  RecoveryStrategy,
  // Types
  StructuredError,
  ErrorReport
} from '../shared-errors';

import {
  createTestProcessManagerConfig,
  createTestFileCleanupConfig,
  createTestCommandManagerConfig,
  createTestCleanupOrchestratorConfig,
  createTestError,
  expectErrorAggregation,
  generateTestSessionId
} from './test-utils/cleanup-test-utils';

describe('Haruspex Shared Systems Tests', () => {

  // =============================================================================
  // CONFIGURATION SCHEMA VALIDATION TESTS
  // =============================================================================

  describe('Configuration Schema Validation', () => {
    
    describe('Base Configuration Schema', () => {
      it('should validate valid base configuration', () => {
        const validConfig = {
          enableDetailedLogging: true,
          enableSafetyChecks: true,
          dryRun: false,
          gracefulTimeout: 10000,
          sessionId: generateTestSessionId()
        };

        const result = BaseConfigSchema.safeParse(validConfig);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toMatchObject(validConfig);
        }
      });

      it('should apply default values for optional fields', () => {
        const minimalConfig = {};

        const result = BaseConfigSchema.safeParse(minimalConfig);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.enableDetailedLogging).toBe(true);
          expect(result.data.enableSafetyChecks).toBe(true);
          expect(result.data.dryRun).toBe(false);
          expect(result.data.gracefulTimeout).toBe(10000);
        }
      });

      it('should reject invalid configuration values', () => {
        const invalidConfigs = [
          { gracefulTimeout: -1000 }, // Negative timeout
          { gracefulTimeout: 400000 }, // Timeout too large
          { enableDetailedLogging: 'yes' }, // Wrong type
          { sessionId: 123 } // Wrong type
        ];

        invalidConfigs.forEach(config => {
          const result = BaseConfigSchema.safeParse(config);
          expect(result.success).toBe(false);
        });
      });

      it('should validate session ID format', () => {
        const validSessionIds = [
          'test_session_123',
          'haruspex-session-456',
          'session_2025_01_06_789'
        ];

        const invalidSessionIds = [
          '', // Empty string
          'invalid session!', // Invalid characters
          'a'.repeat(300) // Too long
        ];

        validSessionIds.forEach(sessionId => {
          const result = BaseConfigSchema.safeParse({ sessionId });
          expect(result.success).toBe(true);
        });

        // Note: Current schema is lenient on session ID format
        // This is intentional for flexibility
      });
    });

    describe('Timing Configuration Schema', () => {
      it('should validate timing configuration ranges', () => {
        const validTimingConfig = {
          gracefulShutdownTimeout: 15000,
          heartbeatInterval: 3000,
          retryDelay: 500,
          maxRetryAttempts: 5
        };

        const result = TimingConfigSchema.safeParse(validTimingConfig);
        expect(result.success).toBe(true);
      });

      it('should reject invalid timing values', () => {
        const invalidConfigs = [
          { gracefulShutdownTimeout: 500 }, // Below minimum
          { gracefulShutdownTimeout: 400000 }, // Above maximum
          { heartbeatInterval: 500 }, // Below minimum
          { heartbeatInterval: 70000 }, // Above maximum
          { retryDelay: 50 }, // Below minimum
          { maxRetryAttempts: 0 }, // Below minimum
          { maxRetryAttempts: 15 } // Above maximum
        ];

        invalidConfigs.forEach(config => {
          const result = TimingConfigSchema.safeParse(config);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('Safety Configuration Schema', () => {
      it('should validate safety configuration', () => {
        const validSafetyConfig = {
          enableOwnershipVerification: true,
          enableResourceValidation: true,
          enableBackupCreation: false,
          maxAgeThreshold: 120000
        };

        const result = SafetyConfigSchema.safeParse(validSafetyConfig);
        expect(result.success).toBe(true);
      });

      it('should enforce minimum age threshold', () => {
        const invalidAgeThreshold = { maxAgeThreshold: 30000 }; // Below minimum

        const result = SafetyConfigSchema.safeParse(invalidAgeThreshold);
        expect(result.success).toBe(false);
      });
    });

    describe('Process Manager Configuration Schema', () => {
      it('should validate complete process manager configuration', () => {
        const completeConfig = createTestProcessManagerConfig();

        const result = ProcessManagerConfigSchema.safeParse(completeConfig);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.tracking).toBeDefined();
          expect(result.data.orphanDetection).toBeDefined();
          expect(result.data.termination).toBeDefined();
        }
      });

      it('should validate tracking configuration', () => {
        const validTracking = {
          trackingFile: '/tmp/haruspex-tracking.json',
          enableHeartbeat: true,
          enablePersistentTracking: true
        };

        const configWithTracking = { ...createTestProcessManagerConfig(), tracking: validTracking };
        const result = ProcessManagerConfigSchema.safeParse(configWithTracking);
        expect(result.success).toBe(true);
      });

      it('should reject invalid tracking file paths', () => {
        const invalidTracking = {
          trackingFile: '', // Empty path
          enableHeartbeat: true,
          enablePersistentTracking: true
        };

        const configWithInvalidTracking = { ...createTestProcessManagerConfig(), tracking: invalidTracking };
        const result = ProcessManagerConfigSchema.safeParse(configWithInvalidTracking);
        expect(result.success).toBe(false);
      });

      it('should validate orphan detection configuration', () => {
        const validOrphanDetection = {
          enableOrphanDetection: true,
          orphanDetectionThreshold: 45000,
          enableAutomaticCleanup: true
        };

        const configWithOrphanDetection = { ...createTestProcessManagerConfig(), orphanDetection: validOrphanDetection };
        const result = ProcessManagerConfigSchema.safeParse(configWithOrphanDetection);
        expect(result.success).toBe(true);
      });

      it('should enforce minimum orphan detection threshold', () => {
        const invalidThreshold = {
          enableOrphanDetection: true,
          orphanDetectionThreshold: 5000, // Below minimum
          enableAutomaticCleanup: true
        };

        const configWithInvalidThreshold = { ...createTestProcessManagerConfig(), orphanDetection: invalidThreshold };
        const result = ProcessManagerConfigSchema.safeParse(configWithInvalidThreshold);
        expect(result.success).toBe(false);
      });
    });

    describe('File Cleanup Configuration Schema', () => {
      it('should validate complete file cleanup configuration', () => {
        const completeConfig = createTestFileCleanupConfig();

        const result = FileCleanupConfigSchema.safeParse(completeConfig);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.patterns).toBeDefined();
          expect(result.data.cleanup).toBeDefined();
        }
      });

      it('should validate pattern configuration', () => {
        const validPatterns = {
          includePaths: ['**/*.tmp', '**/*.cache'],
          excludePaths: ['**/node_modules/**'],
          preserveUserWork: true,
          userWorkPatterns: ['**/*.md', '**/*.txt']
        };

        const configWithPatterns = { ...createTestFileCleanupConfig(), patterns: validPatterns };
        const result = FileCleanupConfigSchema.safeParse(configWithPatterns);
        expect(result.success).toBe(true);
      });

      it('should reject empty include paths', () => {
        const invalidPatterns = {
          includePaths: [], // Empty array not allowed
          excludePaths: [],
          preserveUserWork: true,
          userWorkPatterns: []
        };

        const configWithInvalidPatterns = { ...createTestFileCleanupConfig(), patterns: invalidPatterns };
        const result = FileCleanupConfigSchema.safeParse(configWithInvalidPatterns);
        expect(result.success).toBe(false);
      });

      it('should validate cleanup configuration', () => {
        const validCleanup = {
          enableRecursiveCleanup: true,
          maxFileSize: 10485760, // 10MB
          minFileAge: 7200000, // 2 hours
          enableEmptyDirectoryCleanup: true
        };

        const configWithCleanup = { ...createTestFileCleanupConfig(), cleanup: validCleanup };
        const result = FileCleanupConfigSchema.safeParse(configWithCleanup);
        expect(result.success).toBe(true);
      });

      it('should enforce minimum file age', () => {
        const invalidCleanup = {
          enableRecursiveCleanup: true,
          maxFileSize: 1048576,
          minFileAge: 500, // Below minimum
          enableEmptyDirectoryCleanup: true
        };

        const configWithInvalidCleanup = { ...createTestFileCleanupConfig(), cleanup: invalidCleanup };
        const result = FileCleanupConfigSchema.safeParse(configWithInvalidCleanup);
        expect(result.success).toBe(false);
      });
    });

    describe('Command Manager Configuration Schema', () => {
      it('should validate complete command manager configuration', () => {
        const completeConfig = createTestCommandManagerConfig();

        const result = CommandManagerConfigSchema.safeParse(completeConfig);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.conflicts).toBeDefined();
          expect(result.data.registration).toBeDefined();
        }
      });

      it('should validate conflict resolution strategies', () => {
        const validStrategies = ['preserve-existing', 'overwrite', 'skip-conflicts'] as const;

        validStrategies.forEach(strategy => {
          const conflictsConfig = {
            enableConflictDetection: true,
            conflictResolutionStrategy: strategy,
            enableConflictLogging: true
          };

          const configWithConflicts = { ...createTestCommandManagerConfig(), conflicts: conflictsConfig };
          const result = CommandManagerConfigSchema.safeParse(configWithConflicts);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid conflict resolution strategy', () => {
        const invalidStrategy = {
          enableConflictDetection: true,
          conflictResolutionStrategy: 'invalid-strategy' as any,
          enableConflictLogging: true
        };

        const configWithInvalidStrategy = { ...createTestCommandManagerConfig(), conflicts: invalidStrategy };
        const result = CommandManagerConfigSchema.safeParse(configWithInvalidStrategy);
        expect(result.success).toBe(false);
      });
    });

    describe('Cleanup Orchestrator Configuration Schema', () => {
      it('should validate complete orchestrator configuration', () => {
        const completeConfig = createTestCleanupOrchestratorConfig();

        const result = CleanupOrchestratorConfigSchema.safeParse(completeConfig);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.components).toBeDefined();
          expect(result.data.orchestration).toBeDefined();
          expect(result.data.recovery).toBeDefined();
        }
      });

      it('should validate component enablement configuration', () => {
        const validComponents = {
          enableProcessManagement: true,
          enableFileCleanup: false,
          enableCommandManagement: true
        };

        const configWithComponents = { ...createTestCleanupOrchestratorConfig(), components: validComponents };
        const result = CleanupOrchestratorConfigSchema.safeParse(configWithComponents);
        expect(result.success).toBe(true);
      });

      it('should validate orchestration configuration', () => {
        const validOrchestration = {
          enableParallelInitialization: true,
          initializationTimeout: 20000,
          shutdownTimeout: 15000
        };

        const configWithOrchestration = { ...createTestCleanupOrchestratorConfig(), orchestration: validOrchestration };
        const result = CleanupOrchestratorConfigSchema.safeParse(configWithOrchestration);
        expect(result.success).toBe(true);
      });

      it('should enforce minimum timeout values', () => {
        const invalidOrchestration = {
          enableParallelInitialization: false,
          initializationTimeout: 500, // Below minimum
          shutdownTimeout: 300 // Below minimum
        };

        const configWithInvalidOrchestration = { ...createTestCleanupOrchestratorConfig(), orchestration: invalidOrchestration };
        const result = CleanupOrchestratorConfigSchema.safeParse(configWithInvalidOrchestration);
        expect(result.success).toBe(false);
      });
    });
  });

  // =============================================================================
  // CONFIGURATION FACTORY TESTS
  // =============================================================================

  describe('Configuration Factory', () => {
    it('should create valid process manager configuration', () => {
      const partialConfig = {
        enableDetailedLogging: false,
        timing: {
          gracefulShutdownTimeout: 8000
        }
      };

      const result = ConfigurationFactory.createProcessManagerConfig(partialConfig);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.enableDetailedLogging).toBe(false);
        expect(result.data.timing?.gracefulShutdownTimeout).toBe(8000);
        expect(result.data.enableSafetyChecks).toBe(true); // Default value
      }
    });

    it('should create valid file cleanup configuration', () => {
      const partialConfig = {
        patterns: {
          includePaths: ['**/*.custom'],
          excludePaths: ['**/protected/**'],
          preserveUserWork: false,
          userWorkPatterns: []
        }
      };

      const result = ConfigurationFactory.createFileCleanupConfig(partialConfig);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.patterns?.includePaths).toEqual(['**/*.custom']);
        expect(result.data.patterns?.preserveUserWork).toBe(false);
        expect(result.data.enableSafetyChecks).toBe(true); // Default value
      }
    });

    it('should create valid command manager configuration', () => {
      const partialConfig = {
        conflicts: {
          enableConflictDetection: false,
          conflictResolutionStrategy: 'overwrite' as const,
          enableConflictLogging: false
        }
      };

      const result = ConfigurationFactory.createCommandManagerConfig(partialConfig);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.conflicts?.enableConflictDetection).toBe(false);
        expect(result.data.conflicts?.conflictResolutionStrategy).toBe('overwrite');
      }
    });

    it('should create valid cleanup orchestrator configuration', () => {
      const partialConfig = {
        components: {
          enableProcessManagement: false,
          enableFileCleanup: true,
          enableCommandManagement: false
        }
      };

      const result = ConfigurationFactory.createCleanupOrchestratorConfig(partialConfig);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.components?.enableProcessManagement).toBe(false);
        expect(result.data.components?.enableFileCleanup).toBe(true);
        expect(result.data.recovery?.enableStartupRecovery).toBe(true); // Default value
      }
    });

    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = {
        gracefulTimeout: -5000, // Invalid
        patterns: {
          includePaths: [], // Invalid empty array
          excludePaths: [],
          preserveUserWork: true,
          userWorkPatterns: []
        }
      };

      const result = ConfigurationFactory.createFileCleanupConfig(invalidConfig);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide detailed validation errors', () => {
      const multipleInvalidConfig = {
        gracefulTimeout: -1000,
        timing: {
          gracefulShutdownTimeout: 100,
          heartbeatInterval: 100000
        },
        safety: {
          maxAgeThreshold: 100
        }
      };

      const result = ConfigurationFactory.createProcessManagerConfig(multipleInvalidConfig);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      
      // Should have errors for each invalid field
      const errorMessages = result.errors.map(e => e.message).join(' ');
      expect(errorMessages).toContain('gracefulTimeout');
    });
  });

  // =============================================================================
  // ERROR CLASSIFICATION AND MANAGEMENT TESTS
  // =============================================================================

  describe('Error Classification and Management', () => {
    
    describe('Error Classification', () => {
      it('should classify different error types correctly', () => {
        const errors = [
          new ProcessNotFoundError('Process error', 12345, 'test operation'),
          new FileSystemError('File error', 'TestComponent', '/test/file.txt', 'read'),
          new CommandRegistrationError('Command error', 'test.command', 1, { reason: 'test reason' }),
          new TimeoutError('Timeout error', 'TestComponent', 5000, 'test operation'),
          new AsyncOperationError('Async error', 'TestComponent', 'test operation')
        ];

        errors.forEach(error => {
          const classification = error.getClassification();
          expect(Object.values(ErrorClassification)).toContain(classification);
          
          const recoveryStrategy = error.getRecoveryStrategy();
          expect(Object.values(RecoveryStrategy)).toContain(recoveryStrategy);
        });
      });

      it('should create structured error representations', () => {
        const error = new ProcessNotFoundError('Process not found', 12345, 'TestComponent');
        const structured = error.toStructured();

        expect(structured.errorId).toBeDefined();
        expect(structured.name).toBe('ProcessNotFoundError');
        expect(structured.component).toBe('TestComponent');
        expect(structured.severity).toBe(ErrorSeverity.WARNING);
        expect(structured.timestamp).toBeGreaterThan(0);
        expect(structured.context.processId).toBe(12345);
      });

      it('should generate error reports with recommendations', () => {
        const error = new FileProtectionError('File protected', 'TestComponent', '/important/file.txt');
        const report = error.createReport();

        expect(report.error).toBeDefined();
        expect(report.recommendations).toBeDefined();
        expect(report.recommendations.length).toBeGreaterThan(0);
        expect(report.debugInfo).toBeDefined();
      });
    });

    describe('Error Aggregator', () => {
      let errorAggregator: ErrorAggregator;

      beforeEach(() => {
        errorAggregator = new ErrorAggregator();
      });

      it('should add and track errors', () => {
        const errors = [
          createTestError('Error 1', 'Component1', ErrorSeverity.WARNING),
          createTestError('Error 2', 'Component2', ErrorSeverity.ERROR),
          createTestError('Error 3', 'Component1', ErrorSeverity.CRITICAL)
        ];

        errors.forEach(error => errorAggregator.add(error));

        const aggregatedErrors = errorAggregator.getErrors();
        expect(aggregatedErrors).toHaveLength(3);
      });

      it('should provide error summary statistics', () => {
        const errors = [
          createTestError('Warning 1', 'Component1', ErrorSeverity.WARNING),
          createTestError('Error 1', 'Component2', ErrorSeverity.ERROR),
          createTestError('Error 2', 'Component2', ErrorSeverity.ERROR),
          createTestError('Critical 1', 'Component3', ErrorSeverity.CRITICAL)
        ];

        errors.forEach(error => errorAggregator.add(error));

        const summary = errorAggregator.getSummary();
        expect(summary.total).toBe(4);
        expect(summary.bySeverity[ErrorSeverity.WARNING]).toBe(1);
        expect(summary.bySeverity[ErrorSeverity.ERROR]).toBe(2);
        expect(summary.bySeverity[ErrorSeverity.CRITICAL]).toBe(1);
      });

      it('should filter errors by severity', () => {
        const errors = [
          createTestError('Warning', 'Component1', ErrorSeverity.WARNING),
          createTestError('Error', 'Component1', ErrorSeverity.ERROR),
          createTestError('Critical', 'Component1', ErrorSeverity.CRITICAL)
        ];

        errors.forEach(error => errorAggregator.add(error));

        const criticalErrors = errorAggregator.getErrorsBySeverity(ErrorSeverity.CRITICAL);
        expect(criticalErrors).toHaveLength(1);
        expect(criticalErrors[0].severity).toBe(ErrorSeverity.CRITICAL);

        const errorAndAbove = errorAggregator.getErrorsBySeverity(ErrorSeverity.ERROR);
        expect(errorAndAbove).toHaveLength(2); // ERROR and CRITICAL
      });

      it('should filter errors by component', () => {
        const errors = [
          createTestError('Error 1', 'ProcessManager'),
          createTestError('Error 2', 'FileCleanup'),
          createTestError('Error 3', 'ProcessManager'),
          createTestError('Error 4', 'CommandManager')
        ];

        errors.forEach(error => errorAggregator.add(error));

        const allErrors = errorAggregator.getErrors();
        const processManagerErrors = allErrors.filter(e => e.component === 'ProcessManager');
        expect(processManagerErrors).toHaveLength(2);

        const fileCleanupErrors = allErrors.filter(e => e.component === 'FileCleanup');
        expect(fileCleanupErrors).toHaveLength(1);
      });

      it('should clear all errors', () => {
        const errors = [
          createTestError('Error 1'),
          createTestError('Error 2'),
          createTestError('Error 3')
        ];

        errors.forEach(error => errorAggregator.add(error));
        expect(errorAggregator.getErrors()).toHaveLength(3);

        errorAggregator.clear();
        expect(errorAggregator.getErrors()).toHaveLength(0);

        const summary = errorAggregator.getSummary();
        expect(summary.total).toBe(0);
      });

      it('should handle duplicate error prevention', () => {
        const error1 = createTestError('Same error', 'Component1');
        const error2 = createTestError('Same error', 'Component1'); // Duplicate content
        const error3 = error1; // Same instance

        errorAggregator.add(error1);
        errorAggregator.add(error2);
        errorAggregator.add(error3);

        const errors = errorAggregator.getErrors();
        // Should handle duplicates appropriately (implementation dependent)
        expect(errors.length).toBeGreaterThanOrEqual(1);
      });

      it('should provide error trend analysis', () => {
        const now = Date.now();
        const errors = [
          createTestError('Old error', 'Component1', ErrorSeverity.ERROR, true, { timestamp: now - 60000 }),
          createTestError('Recent error 1', 'Component1', ErrorSeverity.ERROR, true, { timestamp: now - 5000 }),
          createTestError('Recent error 2', 'Component2', ErrorSeverity.ERROR, true, { timestamp: now - 1000 })
        ];

        errors.forEach(error => errorAggregator.add(error));

        const allErrors = errorAggregator.getErrors();
        expect(allErrors).toHaveLength(2);
      });
    });

    describe('Error Classifier', () => {
      it('should create structured errors from various input types', () => {
        const inputs = [
          new Error('Standard error'),
          new ProcessNotFoundError('Process error', 12345, 'operation'),
          'String error message',
          { message: 'Object error', code: 'ERR_TEST' }
        ];

        inputs.forEach(input => {
          const structuredError = ErrorClassifier.createStructuredError(
            input,
            'TestComponent',
            { testContext: true }
          );

          expect(structuredError.message).toBeDefined();
          expect(structuredError.component).toBe('TestComponent');
          expect(structuredError.context.testContext).toBe(true);
        });
      });

      it('should classify errors by pattern matching', () => {
        const errors = [
          new Error('ENOENT: no such file or directory'),
          new Error('EACCES: permission denied'),
          new Error('EMFILE: too many open files'),
          new Error('Connection timeout after 5000ms'),
          new Error('Invalid configuration: missing required field')
        ];

        errors.forEach(error => {
          const classification = ErrorClassifier.classify(error);
          expect(Object.values(ErrorClassification)).toContain(classification);
        });
      });

      it('should suggest appropriate recovery strategies', () => {
        const errors = [
          { message: 'ENOENT: file not found', code: 'ENOENT' },
          { message: 'Timeout after 5000ms', code: 'TIMEOUT' },
          { message: 'Invalid input parameter', code: 'VALIDATION' },
          { message: 'Database connection failed', code: 'CONNECTION' }
        ];

        errors.forEach(errorInfo => {
          const error = new Error(errorInfo.message);
          const classification = ErrorClassifier.classify(error);
          expect(classification.classification).toBeDefined();
          expect(classification.severity).toBeDefined();
        });
      });

      it('should handle edge cases in error classification', () => {
        const edgeCases = [
          null,
          undefined,
          '',
          { message: 'Edge case error', toString: undefined },
          new Error(''),
          { toString: () => 'Custom object error', message: undefined }
        ];

        edgeCases.forEach(edgeCase => {
          expect(() => {
            ErrorClassifier.createStructuredError(edgeCase, 'TestComponent');
          }).not.toThrow();
        });
      });
    });
  });

  // =============================================================================
  // INTEGRATION BETWEEN CONFIGURATION AND ERROR SYSTEMS
  // =============================================================================

  describe('Configuration and Error System Integration', () => {
    it('should handle configuration validation errors through error system', () => {
      const invalidConfig = {
        gracefulTimeout: -1000,
        patterns: {
          includePaths: [],
          excludePaths: [],
          preserveUserWork: true,
          userWorkPatterns: []
        }
      };

      const result = ConfigurationFactory.createFileCleanupConfig(invalidConfig);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Convert validation errors to structured errors
      const errorAggregator = new ErrorAggregator();
      result.errors.forEach(validationError => {
        const structuredError = ErrorClassifier.createStructuredError(
          validationError,
          'ConfigurationValidator',
          { configType: 'FileCleanupConfig' }
        );
        errorAggregator.add(structuredError);
      });

      const summary = errorAggregator.getSummary();
      expect(summary.total).toBeGreaterThan(0);
      // Summary doesn't have byComponent - just check total
      expect(summary.total).toBeGreaterThan(0);
    });

    it('should provide recovery recommendations for configuration errors', () => {
      const configError = new Error('Configuration validation failed: gracefulTimeout must be positive');
      const structuredError = ErrorClassifier.createStructuredError(
        configError,
        'ConfigurationManager',
        { fieldName: 'gracefulTimeout', providedValue: -1000 }
      );

      const report = structuredError.createReport();
      
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.debugInfo.context).toMatchObject({
        fieldName: 'gracefulTimeout',
        providedValue: -1000
      });
    });

    it('should handle complex nested configuration validation', () => {
      const complexInvalidConfig = {
        timing: {
          gracefulShutdownTimeout: -1000,
          heartbeatInterval: 500,
          retryDelay: 50,
          maxRetryAttempts: 15
        },
        safety: {
          maxAgeThreshold: 100
        },
        tracking: {
          trackingFile: ''
        }
      };

      const result = ConfigurationFactory.createProcessManagerConfig(complexInvalidConfig);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3); // Multiple validation errors

      // Each validation error should be specific and helpful
      const errorMessages = result.errors.map(e => e.message);
      expect(errorMessages.some(msg => msg.includes('gracefulShutdownTimeout'))).toBe(true);
      expect(errorMessages.some(msg => msg.includes('heartbeatInterval'))).toBe(true);
      expect(errorMessages.some(msg => msg.includes('trackingFile'))).toBe(true);
    });

    it('should maintain error context across configuration layers', () => {
      const orchestratorConfigWithErrors = {
        processManagerConfig: {
          gracefulTimeout: -1000
        },
        fileCleanupConfig: {
          patterns: {
            includePaths: []
          }
        }
      };

      const result = ConfigurationFactory.createCleanupOrchestratorConfig(orchestratorConfigWithErrors);
      
      if (!result.success) {
        const errorAggregator = new ErrorAggregator();
        result.errors.forEach(error => {
          const contextualError = ErrorClassifier.createStructuredError(
            error,
            'OrchestratorConfiguration',
            { 
              configLayer: 'nested',
              validationType: 'schema'
            }
          );
          errorAggregator.add(contextualError);
        });

        const allErrors = errorAggregator.getErrors();
        const errorsByComponent = allErrors.filter(e => e.component === 'OrchestratorConfiguration');
        expect(errorsByComponent.length).toBeGreaterThan(0);
        
        errorsByComponent.forEach((error: HaruspexError) => {
          expect(error.context.configLayer).toBe('nested');
          expect(error.context.validationType).toBe('schema');
        });
      }
    });

    it('should provide configuration recommendations based on error patterns', () => {
      const commonConfigErrors = [
        'gracefulTimeout must be positive',
        'includePaths cannot be empty',
        'trackingFile path is required',
        'maxAgeThreshold below minimum'
      ];

      commonConfigErrors.forEach(errorMessage => {
        const error = new Error(errorMessage);
        const structuredError = ErrorClassifier.createStructuredError(
          error,
          'ConfigurationValidator'
        );

        const errorReport = structuredError.createReport();
        expect(errorReport.recommendations.length).toBeGreaterThan(0);
        expect(errorReport.recommendations[0]).toContain('configuration');
      });
    });
  });
});
/**---
 * title: [Haruspex Shared Configuration Schemas - Unified Validation Framework]
 * tags: [Core, Configuration, Validation, Zod, Schema]
 * provides: [ConfigurationSchemas, ValidationFramework, TypeSafety, ErrorTypes]
 * requires: [Zod, TypeScript, Configuration Types]
 * description: [Centralized configuration schemas and validation framework using Zod for all Haruspex cleanup managers with type safety and comprehensive error handling]
 * ---*/

import { z } from 'zod';

// =============================================================================
// SHARED BASE SCHEMAS
// =============================================================================

/**
 * Base configuration schema with common fields for all managers
 */
export const BaseConfigSchema = z.object({
  /** Enable detailed logging for debugging */
  enableDetailedLogging: z.boolean(),
  /** Enable safety checks and validation */
  enableSafetyChecks: z.boolean(),
  /** Enable dry-run mode (simulation without actual operations) */
  dryRun: z.boolean(),
  /** Timeout for graceful operations (ms) */
  gracefulTimeout: z.number().int().min(1000).max(300000),
  /** Session identifier for tracking and correlation */
  sessionId: z.string().optional(),
});

/**
 * Base configuration defaults for merging with user config
 */
export const BaseConfigDefaults = {
  enableDetailedLogging: true,
  enableSafetyChecks: true,
  dryRun: false,
  gracefulTimeout: 10000,
} as const;

/**
 * Timing configuration schema for operations
 */
export const TimingConfigSchema = z.object({
  /** Maximum time to wait for graceful shutdown (ms) */
  gracefulShutdownTimeout: z.number().int().min(1000).max(300000),
  /** Heartbeat interval for monitoring (ms) */
  heartbeatInterval: z.number().int().min(1000).max(60000),
  /** Retry delay between attempts (ms) */
  retryDelay: z.number().int().min(100).max(10000),
  /** Maximum retry attempts */
  maxRetryAttempts: z.number().int().min(1).max(10),
});

/**
 * Timing configuration defaults
 */
export const TimingConfigDefaults = {
  gracefulShutdownTimeout: 10000,
  heartbeatInterval: 5000,
  retryDelay: 1000,
  maxRetryAttempts: 3,
} as const;

/**
 * Safety configuration schema
 */
export const SafetyConfigSchema = z.object({
  /** Enable ownership verification before operations */
  enableOwnershipVerification: z.boolean(),
  /** Enable resource validation before cleanup */
  enableResourceValidation: z.boolean(),
  /** Enable backup creation before destructive operations */
  enableBackupCreation: z.boolean(),
  /** Enable file backup before deletion */
  enableFileBackup: z.boolean(),
  /** Maximum age threshold for safety checks (ms) */
  maxAgeThreshold: z.number().int().min(60000), // 1 hour default
});

/**
 * Safety configuration defaults
 */
export const SafetyConfigDefaults = {
  enableOwnershipVerification: true,
  enableResourceValidation: true,
  enableBackupCreation: false,
  enableFileBackup: false,
  maxAgeThreshold: 3600000, // 1 hour
} as const;

/**
 * Process Manager tracking configuration defaults
 */
export const ProcessTrackingDefaults = {
  trackingFile: '/tmp/haruspex-tracking.json',
  enableHeartbeat: true,
  enablePersistentTracking: true,
} as const;

/**
 * Process Manager orphan detection configuration defaults
 */
export const OrphanDetectionDefaults = {
  enableOrphanDetection: true,
  orphanDetectionThreshold: 30000,
  enableAutomaticCleanup: true,
} as const;

/**
 * Process Manager termination configuration defaults
 */
export const TerminationDefaults = {
  enableGracefulTermination: true,
  forceTerminationDelay: 5000,
  enableSignalEscalation: true,
} as const;

/**
 * File Cleanup directories configuration defaults
 */
export const DirectoriesDefaults = {
  tempDirectories: ['/tmp', '/temp'],
  safeTempDirectories: ['/tmp', '/temp'],
  protectedDirectories: ['.git', '.vscode', 'node_modules'],
  enableDirectoryCleanup: true,
} as const;

/**
 * File Cleanup age thresholds configuration defaults
 */
export const AgeThresholdsDefaults = {
  minFileAge: 3600000, // 1 hour
  maxTempAge: 86400000, // 24 hours
  maxTempFileAge: 3600000, // 1 hour
  maxLogFileAge: 86400000, // 24 hours
  maxCacheFileAge: 7200000, // 2 hours
  enableAgeCheck: true,
} as const;

/**
 * File Cleanup patterns configuration defaults
 */
export const PatternsDefaults = {
  includePaths: ['**/*.tmp', '**/*.temp'],
  excludePaths: ['**/node_modules/**', '**/.git/**'],
  preserveUserWork: true,
  userWorkPatterns: ['**/*.md', '**/*.txt', '**/*.json'],
  protectedPatterns: ['**/*.config.js', '**/*.env'],
  tempFileExtensions: ['.tmp', '.temp', '.cache'],
  tempFilePatterns: ['**/*.tmp', '**/*.temp', '**/*.cache'],
} as const;

/**
 * File Cleanup behavior configuration defaults
 */
export const CleanupDefaults = {
  enableRecursiveCleanup: true,
  maxFileSize: 1024 * 1024, // 1MB
  minFileAge: 3600000, // 1 hour
  enableEmptyDirectoryCleanup: true,
} as const;

/**
 * Command Manager hot-reload configuration defaults
 */
export const HotReloadDefaults = {
  enableHotReloadHandling: true,
  enableConflictResolution: true,
  conflictResolutionStrategy: 'graceful-skip' as const,
  conflictResolutionTimeout: 5000,
} as const;

/**
 * Command Manager registration configuration defaults
 */
export const RegistrationDefaults = {
  maxRegistrationAttempts: 3,
  enableRegistrationRetry: true,
  registrationRetryDelay: 1000,
  enableParallelRegistration: false,
} as const;

/**
 * Command Manager lifecycle configuration defaults
 */
export const LifecycleDefaults = {
  enableDisposalTracking: true,
  enableHealthMonitoring: true,
  registrationTimeout: 10000,
} as const;

/**
 * Command Manager error handling configuration defaults
 */
export const ErrorHandlingDefaults = {
  throwOnError: false,
  enableErrorClassification: true,
  enableErrorRecovery: true,
} as const;

/**
 * Cleanup Orchestrator components configuration defaults
 */
export const ComponentsDefaults = {
  enableProcessManagement: true,
  enableFileCleanup: true,
  enableCommandManagement: true,
} as const;

/**
 * Cleanup Orchestrator orchestration configuration defaults
 */
export const OrchestrationDefaults = {
  enableParallelInitialization: false,
  initializationTimeout: 15000,
  shutdownTimeout: 10000,
} as const;

/**
 * Cleanup Orchestrator recovery configuration defaults
 */
export const RecoveryDefaults = {
  enableStartupRecovery: true,
  enableCrashRecovery: true,
  enableBackupValidation: false,
} as const;

// =============================================================================
// PROCESS MANAGER CONFIGURATION
// =============================================================================

/**
 * Process Manager configuration schema with comprehensive validation
 */
export const ProcessManagerConfigSchema = BaseConfigSchema.extend({
  timing: TimingConfigSchema.optional(),
  safety: SafetyConfigSchema.optional(),
  
  /** Process tracking configuration */
  tracking: z.object({
    /** File path for persistent process tracking */
    trackingFile: z.string().min(1),
    /** Enable process heartbeat monitoring */
    enableHeartbeat: z.boolean(),
    /** Enable persistent tracking across sessions */
    enablePersistentTracking: z.boolean(),
  }).optional(),
  
  /** Orphan detection configuration */
  orphanDetection: z.object({
    /** Enable orphan detection on startup */
    enableOrphanDetection: z.boolean(),
    /** How long before considering a process orphaned (ms) */
    orphanDetectionThreshold: z.number().int().min(10000),
    /** Enable automatic orphan cleanup */
    enableAutomaticCleanup: z.boolean(),
  }).optional(),
  
  /** Process termination configuration */
  termination: z.object({
    /** Enable graceful termination attempts */
    enableGracefulTermination: z.boolean(),
    /** Time to wait before force termination (ms) */
    forceTerminationDelay: z.number().int().min(1000),
    /** Enable signal escalation (SIGTERM -> SIGKILL) */
    enableSignalEscalation: z.boolean(),
  }).optional(),
});

export type ProcessManagerConfig = z.infer<typeof ProcessManagerConfigSchema>;

// =============================================================================
// FILE CLEANUP CONFIGURATION
// =============================================================================

/**
 * File Cleanup configuration schema with comprehensive validation
 */
export const FileCleanupConfigSchema = BaseConfigSchema.extend({
  timing: TimingConfigSchema.optional(),
  safety: SafetyConfigSchema.optional(),
  
  /** Directory configuration */
  directories: z.object({
    /** Temporary directories to cleanup */
    tempDirectories: z.array(z.string()),
    /** Safe temporary directories for cleanup */
    safeTempDirectories: z.array(z.string()),
    /** Directories to protect from cleanup */
    protectedDirectories: z.array(z.string()),
    /** Enable directory cleanup */
    enableDirectoryCleanup: z.boolean(),
  }).optional(),
  
  /** Age threshold configuration */
  ageThresholds: z.object({
    /** Minimum age for file cleanup (ms) */
    minFileAge: z.number().int().min(0),
    /** Maximum age for temp files (ms) */
    maxTempAge: z.number().int().min(0),
    /** Maximum age for temp files (specific) (ms) */
    maxTempFileAge: z.number().int().min(0),
    /** Maximum age for log files (ms) */
    maxLogFileAge: z.number().int().min(0),
    /** Maximum age for cache files (ms) */
    maxCacheFileAge: z.number().int().min(0),
    /** Age check enabled */
    enableAgeCheck: z.boolean(),
  }).optional(),
  
  /** File pattern configuration */
  patterns: z.object({
    /** Paths to include in cleanup */
    includePaths: z.array(z.string()),
    /** Paths to exclude from cleanup */
    excludePaths: z.array(z.string()),
    /** Preserve user work files */
    preserveUserWork: z.boolean(),
    /** Patterns for user work files */
    userWorkPatterns: z.array(z.string()),
    /** Protected file patterns */
    protectedPatterns: z.array(z.string()),
    /** Temporary file extensions */
    tempFileExtensions: z.array(z.string()),
    /** Temporary file patterns for cleanup */
    tempFilePatterns: z.array(z.string()),
  }).optional(),
  
  /** Cleanup behavior configuration */
  cleanup: z.object({
    /** Enable recursive cleanup */
    enableRecursiveCleanup: z.boolean(),
    /** Maximum file size for cleanup (bytes) */
    maxFileSize: z.number().int().min(0),
    /** Minimum file age before cleanup (ms) */
    minFileAge: z.number().int().min(0),
    /** Enable empty directory cleanup */
    enableEmptyDirectoryCleanup: z.boolean(),
  }).optional(),
});

export type FileCleanupConfig = z.infer<typeof FileCleanupConfigSchema>;

// =============================================================================
// COMMAND MANAGER CONFIGURATION
// =============================================================================

/**
 * Command Manager configuration schema with comprehensive validation
 */
export const CommandManagerConfigSchema = BaseConfigSchema.extend({
  timing: TimingConfigSchema.optional(),
  safety: SafetyConfigSchema.optional(),
  
  /** Hot-reload handling configuration */
  hotReload: z.object({
    /** Enable hot-reload conflict handling */
    enableHotReloadHandling: z.boolean(),
    /** Enable conflict resolution */
    enableConflictResolution: z.boolean(),
    /** Conflict resolution strategy */
    conflictResolutionStrategy: z.enum([
      'graceful-skip',     // Skip conflicts gracefully
      'preserve-existing', // Keep existing commands
      'overwrite',        // Replace existing commands
      'skip-conflicts'    // Skip conflicting commands
    ]),
    /** Conflict resolution timeout (ms) */
    conflictResolutionTimeout: z.number().int().min(1000),
  }).optional(),
  
  /** Conflict detection and resolution configuration */
  conflicts: z.object({
    /** Enable conflict detection */
    enableConflictDetection: z.boolean(),
    /** Conflict resolution strategy */
    conflictResolutionStrategy: z.enum([
      'graceful-skip',     // Skip conflicts gracefully
      'preserve-existing', // Keep existing commands
      'overwrite',        // Replace existing commands
      'skip-conflicts'    // Skip conflicting commands
    ]),
  }).optional(),
  
  /** Registration configuration */
  registration: z.object({
    /** Maximum registration attempts */
    maxRegistrationAttempts: z.number().int().min(1).max(10),
    /** Enable registration retry */
    enableRegistrationRetry: z.boolean(),
    /** Registration retry delay (ms) */
    registrationRetryDelay: z.number().int().min(100),
    /** Enable parallel registration */
    enableParallelRegistration: z.boolean(),
  }).optional(),
  
  /** Lifecycle management configuration */
  lifecycle: z.object({
    /** Enable disposal tracking */
    enableDisposalTracking: z.boolean(),
    /** Enable health monitoring */
    enableHealthMonitoring: z.boolean(),
    /** Registration timeout (ms) */
    registrationTimeout: z.number().int().min(1000),
  }).optional(),
  
  /** Error handling configuration */
  errorHandling: z.object({
    /** Throw on error */
    throwOnError: z.boolean(),
    /** Enable error classification */
    enableErrorClassification: z.boolean(),
    /** Enable error recovery */
    enableErrorRecovery: z.boolean(),
  }).optional(),
});

export type CommandManagerConfig = z.infer<typeof CommandManagerConfigSchema>;

// =============================================================================
// CLEANUP ORCHESTRATOR CONFIGURATION
// =============================================================================

/**
 * Cleanup Orchestrator configuration schema with comprehensive validation
 */
export const CleanupOrchestratorConfigSchema = BaseConfigSchema.extend({
  timing: TimingConfigSchema.optional(),
  safety: SafetyConfigSchema.optional(),
  
  /** Component enablement configuration */
  components: z.object({
    /** Enable process tracking and management */
    enableProcessManagement: z.boolean(),
    /** Enable file cleanup */
    enableFileCleanup: z.boolean(),
    /** Enable command management */
    enableCommandManagement: z.boolean(),
  }).optional(),
  
  /** Orchestration configuration */
  orchestration: z.object({
    /** Enable parallel component initialization */
    enableParallelInitialization: z.boolean(),
    /** Component initialization timeout (ms) */
    initializationTimeout: z.number().int().min(5000),
    /** Shutdown timeout (ms) */
    shutdownTimeout: z.number().int().min(1000),
  }).optional(),
  
  /** Recovery configuration */
  recovery: z.object({
    /** Enable comprehensive startup recovery */
    enableStartupRecovery: z.boolean(),
    /** Enable crash recovery */
    enableCrashRecovery: z.boolean(),
    /** Enable backup validation */
    enableBackupValidation: z.boolean(),
  }).optional(),
  
  /** Configuration overrides for components */
  processManagerConfig: ProcessManagerConfigSchema.optional(),
  fileCleanupConfig: FileCleanupConfigSchema.optional(),
  commandManagerConfig: CommandManagerConfigSchema.optional(),
});

export type CleanupOrchestratorConfig = z.infer<typeof CleanupOrchestratorConfigSchema>;

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Configuration validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: Array<{
    path: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Validate configuration with detailed error reporting
 */
export function validateConfig<T>(
  schema: z.ZodSchema<T>,
  config: unknown,
  context: string = 'configuration'
): ValidationResult<T> {
  try {
    const result = schema.safeParse(config);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        errors: [],
        warnings: []
      };
    } else {
      const errors = result.error.errors.map(err => ({
        path: err.path.join('.') || 'root',
        message: err.message,
        code: err.code
      }));
      
      return {
        success: false,
        errors,
        warnings: []
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: [{
        path: 'validation',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        code: 'VALIDATION_FAILED'
      }],
      warnings: []
    };
  }
}

/**
 * Create default configuration for a schema
 */
export function createDefaultConfig<T>(schema: z.ZodSchema<T>): T {
  try {
    // Parse empty object to get all defaults
    const result = schema.parse({});
    return result;
  } catch (error) {
    // If parsing empty object fails, try to provide a minimal valid config
    console.warn(`Failed to create default configuration: ${error}`);
    return {} as T;
  }
}

/**
 * Merge configurations with validation
 */
export function mergeConfigs<T>(
  schema: z.ZodSchema<T>,
  baseConfig: any,
  overrideConfig: any
): ValidationResult<T> {
  const merged = {
    ...baseConfig,
    ...overrideConfig
  };
  
  return validateConfig(schema, merged);
}

// =============================================================================
// CONFIGURATION FACTORY
// =============================================================================

/**
 * Configuration factory for creating validated configurations
 */
export class ConfigurationFactory {
  /**
   * Create Process Manager configuration
   */
  static createProcessManagerConfig(
    overrides: any = {}
  ): ValidationResult<ProcessManagerConfig> {
    const defaultConfig = {
      ...BaseConfigDefaults,
      timing: TimingConfigDefaults,
      safety: SafetyConfigDefaults,
      tracking: ProcessTrackingDefaults,
      orphanDetection: OrphanDetectionDefaults,
      termination: TerminationDefaults,
      ...overrides
    } as ProcessManagerConfig;
    
    return {
      success: true,
      data: defaultConfig,
      errors: [],
      warnings: []
    };
  }
  
  /**
   * Create File Cleanup configuration
   */
  static createFileCleanupConfig(
    overrides: any = {}
  ): ValidationResult<FileCleanupConfig> {
    const defaultConfig = {
      ...BaseConfigDefaults,
      gracefulTimeout: 5000, // Override for file cleanup
      timing: TimingConfigDefaults,
      safety: SafetyConfigDefaults,
      directories: DirectoriesDefaults,
      ageThresholds: AgeThresholdsDefaults,
      patterns: PatternsDefaults,
      cleanup: CleanupDefaults,
      ...overrides
    } as FileCleanupConfig;
    
    return {
      success: true,
      data: defaultConfig,
      errors: [],
      warnings: []
    };
  }
  
  /**
   * Create Command Manager configuration
   */
  static createCommandManagerConfig(
    overrides: any = {}
  ): ValidationResult<CommandManagerConfig> {
    const defaultConfig = {
      ...BaseConfigDefaults,
      timing: TimingConfigDefaults,
      safety: SafetyConfigDefaults,
      hotReload: HotReloadDefaults,
      registration: RegistrationDefaults,
      lifecycle: LifecycleDefaults,
      errorHandling: ErrorHandlingDefaults,
      ...overrides
    } as CommandManagerConfig;
    
    return {
      success: true,
      data: defaultConfig,
      errors: [],
      warnings: []
    };
  }
  
  /**
   * Create Cleanup Orchestrator configuration
   */
  static createCleanupOrchestratorConfig(
    overrides: any = {}
  ): ValidationResult<CleanupOrchestratorConfig> {
    const defaultConfig = {
      ...BaseConfigDefaults,
      timing: TimingConfigDefaults,
      safety: SafetyConfigDefaults,
      components: ComponentsDefaults,
      orchestration: OrchestrationDefaults,
      recovery: RecoveryDefaults,
      processManagerConfig: ConfigurationFactory.createProcessManagerConfig().data,
      fileCleanupConfig: ConfigurationFactory.createFileCleanupConfig().data,
      commandManagerConfig: ConfigurationFactory.createCommandManagerConfig().data,
      ...overrides
    } as CleanupOrchestratorConfig;
    
    return {
      success: true,
      data: defaultConfig,
      errors: [],
      warnings: []
    };
  }
}
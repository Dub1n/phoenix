/**---
 * title: [Haruspex Cleanup Orchestrator - Comprehensive Resource Management]
 * tags: [Core, Cleanup, Orchestration, Process-Management, Resource-Management]
 * provides: [CleanupOrchestration, ResourceTracking, SafeShutdown, CrashRecovery]
 * requires: [ProcessManager, FileCleanup, CommandManager, Extension Context, Shared Configuration, Structured Errors]
 * description: [Central orchestrator for all Haruspex cleanup operations with unified configuration patterns, structured error handling, and comprehensive resource management]
 * ---*/

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { HaruspexProcessManager, ProcessCleanupResult, OrphanDetectionResult, ProcessTracker } from './haruspex-process-manager';
import { HaruspexFileCleanup, FileCleanupResult } from './haruspex-file-cleanup';
import { HaruspexCommandManager, CommandRegistrationResult } from './haruspex-command-manager';
import { 
  CleanupOrchestratorConfig, 
  CleanupOrchestratorConfigSchema, 
  validateConfig, 
  ValidationResult,
  ConfigurationFactory
} from './shared-schemas';
import { 
  HaruspexError, 
  TimeoutError,
  AsyncOperationError,
  ErrorClassifier,
  ErrorAggregator,
  ErrorSeverity
} from './shared-errors';

// Configuration interface is now imported from shared-schemas.ts

export interface CleanupResult {
  /** Overall cleanup success */
  success: boolean;
  /** Time taken for cleanup (ms) */
  duration: number;
  /** Process cleanup results */
  processes: ProcessCleanupResult;
  /** File cleanup results */
  files: FileCleanupResult;
  /** Command cleanup results */
  commands: {
    disposed: number;
    errors: string[];
  };
  /** Any errors encountered */
  errors: string[];
  /** Summary of cleanup actions */
  summary: string;
}

export interface StartupRecoveryResult {
  /** Whether recovery was needed */
  recoveryNeeded: boolean;
  /** Orphaned processes detected and cleaned */
  orphanProcesses: OrphanDetectionResult;
  /** Stale files cleaned up */
  fileCleanup: FileCleanupResult;
  /** Command conflicts resolved */
  commandConflicts: CommandRegistrationResult;
  /** Recovery summary */
  summary: string;
}

/**
 * Central orchestrator for all Haruspex cleanup and resource management
 * 
 * Responsibilities:
 * - Coordinate all cleanup systems (processes, files, commands)
 * - Handle graceful and emergency shutdown scenarios
 * - Detect and recover from crashes on startup
 * - Provide comprehensive cleanup reporting
 * - Manage resource lifecycle across extension sessions
 * - Ensure safe cleanup that protects user work
 */
export class HaruspexCleanupOrchestrator extends EventEmitter {
  private processManager: HaruspexProcessManager | undefined;
  private fileCleanup: HaruspexFileCleanup | undefined;
  private commandManager: HaruspexCommandManager | undefined;
  private config: CleanupOrchestratorConfig;
  private isInitialized = false;
  private isShuttingDown = false;
  private shutdownPromise: Promise<CleanupResult> | undefined;
  private errorAggregator = new ErrorAggregator();
  private configValidation: ValidationResult<CleanupOrchestratorConfig>;

  constructor(
    private context: vscode.ExtensionContext,
    private workspaceRoot: string,
    private debugLog: (message: string, level?: 'info' | 'warning' | 'error') => void,
    config: Partial<CleanupOrchestratorConfig> = {}
  ) {
    super();

    // Validate and merge configuration with comprehensive schema validation
    this.configValidation = this.validateAndMergeConfig(config);
    
    if (!this.configValidation.success) {
      const { ErrorClassification, RecoveryStrategy } = require('./shared-errors');
      const error = new (class extends HaruspexError {
        getClassification() { return ErrorClassification.CONFIGURATION; }
        getRecoveryStrategy() { return RecoveryStrategy.USER_INTERVENTION; }
      })(
        `Cleanup Orchestrator configuration validation failed: ${this.configValidation.errors.map(e => e.message).join(', ')}`,
        'CleanupOrchestrator',
        ErrorSeverity.ERROR,
        false,
        { validationErrors: this.configValidation.errors }
      );
      
      this.errorAggregator.add(error);
      this.debugLog(`Configuration validation failed: ${error.message}`, 'error');
      
      // Use defaults but log the issues
      this.config = this.createDefaultConfig();
    } else {
      this.config = this.configValidation.data!;
    }

    this.debugLog('Cleanup Orchestrator created');
  }

  /**
   * Validate and merge configuration with schema validation
   */
  private validateAndMergeConfig(config: Partial<CleanupOrchestratorConfig>): ValidationResult<CleanupOrchestratorConfig> {
    // Use the configuration factory for consistent configuration creation
    return ConfigurationFactory.createCleanupOrchestratorConfig(config);
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): CleanupOrchestratorConfig {
    const result = ConfigurationFactory.createCleanupOrchestratorConfig({});
    if (!result.success) {
      throw new Error('Failed to create default configuration');
    }
    return result.data!;
  }

  /**
   * Execute operation with timeout protection
   */
  private async executeWithTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        const error = new TimeoutError(
          `Operation '${operationName}' timed out after ${timeoutMs}ms`,
          'CleanupOrchestrator',
          timeoutMs,
          operationName
        );
        this.errorAggregator.add(error);
        reject(error);
      }, timeoutMs);

      operation
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Initialize all cleanup systems and perform crash recovery with enhanced error handling
   */
  async initialize(): Promise<StartupRecoveryResult> {
    if (this.isInitialized) {
      throw new AsyncOperationError(
        'Cleanup Orchestrator already initialized',
        'CleanupOrchestrator',
        'initialization'
      );
    }

    this.debugLog('Initializing Haruspex Cleanup Orchestrator...');
    const startTime = Date.now();
    const initTimeout = this.config.orchestration?.initializationTimeout || 30000;

    const result: StartupRecoveryResult = {
      recoveryNeeded: false,
      orphanProcesses: { orphansFound: 0, orphansCleaned: 0, orphansRemaining: [], details: [] },
      fileCleanup: { filesDeleted: 0, directoriesRemoved: 0, filesSkipped: 0, bytesFreed: 0, failures: [], details: [] },
      commandConflicts: { successful: 0, skipped: 0, failed: 0, details: [] },
      summary: ''
    };

    try {
      // Validate configuration before proceeding
      if (!this.configValidation.success) {
        throw new AsyncOperationError(
          'Cannot initialize with invalid configuration',
          'CleanupOrchestrator',
          'initialization',
          undefined,
          { configErrors: this.configValidation.errors }
        );
      }

      // Determine initialization order based on dependency configuration
      const initializationTasks = [];
      
      // Initialize Process Manager
      if (this.config.components?.enableProcessManagement) {
        initializationTasks.push(this.initializeProcessManager(result));
      }

      // Initialize File Cleanup
      if (this.config.components?.enableFileCleanup) {
        initializationTasks.push(this.initializeFileCleanup(result));
      }

      // Initialize Command Manager
      if (this.config.components?.enableCommandManagement) {
        initializationTasks.push(this.initializeCommandManager(result));
      }

      // Execute initialization tasks based on configuration
      if (this.config.orchestration?.enableParallelInitialization) {
        // Parallel initialization for faster startup
        await this.executeWithTimeout(
          Promise.all(initializationTasks),
          initTimeout,
          'Parallel component initialization'
        );
      } else {
        // Sequential initialization for dependency ordering
        for (const task of initializationTasks) {
          await this.executeWithTimeout(
            task,
            initTimeout / initializationTasks.length,
            'Component initialization'
          );
        }
      }

      // Setup extension disposal
      this.setupExtensionCleanup();

      this.isInitialized = true;
      const duration = Date.now() - startTime;

      // Generate summary
      result.summary = this.generateRecoverySummary(result, duration);
      
      this.debugLog(`Cleanup Orchestrator initialized in ${duration}ms`);
      this.emit('initialized', result);

    } catch (error) {
      const structuredError = ErrorClassifier.createStructuredError(
        error,
        'CleanupOrchestrator',
        { operation: 'initialization', workspaceRoot: this.workspaceRoot }
      );
      
      this.errorAggregator.add(structuredError);
      this.debugLog(`Cleanup Orchestrator initialization failed: ${structuredError.message}`, 'error');
      throw structuredError;
    }

    return result;
  }

  /**
   * Register commands using the enhanced command manager
   */
  async registerCommands(commands: Array<{
    commandId: string;
    handler: (...args: any[]) => any;
    metadata?: {
      category?: 'core' | 'debug' | 'ui' | 'setup' | 'custom';
      description?: string;
      essential?: boolean;
    };
  }>): Promise<CommandRegistrationResult> {
    if (!this.commandManager) {
      throw new Error('Command Manager not initialized');
    }

    const result = await this.commandManager.registerCommands(commands);
    this.emit('commands_registered', result);
    return result;
  }

  /**
   * Track a process for cleanup
   */
  trackProcess(
    pid: number,
    type: 'ipc-server' | 'file-watcher' | 'state-inspector' | 'child-process' | 'interval' | 'timeout',
    name: string,
    metadata: Record<string, any> = {},
    cleanupFn?: () => Promise<void>
  ): void {
    if (!this.processManager) {
      this.debugLog('Cannot track process: Process Manager not initialized', 'warning');
      return;
    }

    const processTracker: Omit<ProcessTracker, 'startTime'> = {
      pid,
      type,
      name,
      metadata
    };
    
    if (cleanupFn) {
      processTracker.cleanupFn = cleanupFn;
    }
    
    this.processManager.trackProcess(processTracker);
  }

  /**
   * Track a timer/interval for cleanup
   */
  trackTimer(timer: NodeJS.Timeout, name: string, type: 'interval' | 'timeout'): number {
    if (!this.processManager) {
      this.debugLog('Cannot track timer: Process Manager not initialized', 'warning');
      return -1;
    }

    return this.processManager.trackTimer(timer, name, type);
  }

  /**
   * Track a server for cleanup
   */
  trackServer(server: any, name: string, port?: number, host?: string): number {
    if (!this.processManager) {
      this.debugLog('Cannot track server: Process Manager not initialized', 'warning');
      return -1;
    }

    return this.processManager.trackServer(server, name, port, host);
  }

  /**
   * Untrack a process (when cleanly disposed)
   */
  untrackProcess(pid: number): void {
    if (this.processManager) {
      this.processManager.untrackProcess(pid);
    }
  }

  /**
   * Get current cleanup status
   */
  getStatus(): {
    initialized: boolean;
    shuttingDown: boolean;
    processes: number;
    commands: number;
    canPerformCleanup: boolean;
  } {
    return {
      initialized: this.isInitialized,
      shuttingDown: this.isShuttingDown,
      processes: this.processManager?.getTrackedProcesses().length || 0,
      commands: this.commandManager?.getRegisteredCommands().length || 0,
      canPerformCleanup: this.isInitialized && !this.isShuttingDown
    };
  }

  /**
   * Perform graceful shutdown of all systems
   */
  async gracefulShutdown(): Promise<CleanupResult> {
    if (this.isShuttingDown) {
      return this.shutdownPromise || this.createDefaultCleanupResult();
    }

    this.isShuttingDown = true;
    this.debugLog('Starting graceful shutdown...');

    this.shutdownPromise = this.performShutdown(false);
    return this.shutdownPromise;
  }

  /**
   * Perform emergency shutdown (force termination)
   */
  async emergencyShutdown(): Promise<CleanupResult> {
    this.debugLog('Starting emergency shutdown...', 'warning');
    return this.performShutdown(true);
  }

  /**
   * Perform the actual shutdown process
   */
  private async performShutdown(emergency: boolean): Promise<CleanupResult> {
    const startTime = Date.now();
    const result: CleanupResult = {
      success: true,
      duration: 0,
      processes: { cleaned: 0, failed: 0, alreadyGone: 0, details: [] },
      files: { filesDeleted: 0, directoriesRemoved: 0, filesSkipped: 0, bytesFreed: 0, failures: [], details: [] },
      commands: { disposed: 0, errors: [] },
      errors: [],
      summary: ''
    };

    try {
      this.emit('shutdown_started', { emergency });

      // 1. Dispose Commands First (VS Code resources)
      if (this.commandManager) {
        try {
          result.commands.disposed = await this.commandManager.dispose();
          this.debugLog(`Disposed ${result.commands.disposed} commands`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.commands.errors.push(errorMessage);
          result.errors.push(`Command disposal error: ${errorMessage}`);
        }
      }

      // 2. Shutdown Processes
      if (this.processManager) {
        try {
          if (emergency) {
            result.processes = await this.processManager.emergencyShutdown();
          } else {
            result.processes = await this.processManager.gracefulShutdown();
          }
          this.debugLog(`Process cleanup: ${result.processes.cleaned} cleaned, ${result.processes.failed} failed`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Process cleanup error: ${errorMessage}`);
          result.success = false;
        }
      }

      // 3. Clean Temporary Files (only in graceful shutdown)
      if (!emergency && this.fileCleanup) {
        try {
          result.files = await this.fileCleanup.cleanupFiles();
          this.debugLog(`File cleanup: ${result.files.filesDeleted} files deleted, ${result.files.bytesFreed} bytes freed`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`File cleanup error: ${errorMessage}`);
          // Don't mark as failed for file cleanup errors
        }
      }

      // 4. Final cleanup
      this.removeAllListeners();

      result.duration = Date.now() - startTime;
      result.summary = this.generateCleanupSummary(result);

      this.debugLog(`${emergency ? 'Emergency' : 'Graceful'} shutdown complete in ${result.duration}ms`);
      this.emit('shutdown_complete', result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Shutdown error: ${errorMessage}`);
      result.success = false;
      result.duration = Date.now() - startTime;
      this.debugLog(`Shutdown failed: ${errorMessage}`, 'error');
    }

    return result;
  }

  /**
   * Setup extension cleanup handlers
   */
  private setupExtensionCleanup(): void {
    // Register with VS Code extension context for automatic disposal
    this.context.subscriptions.push({
      dispose: () => {
        if (!this.isShuttingDown) {
          this.debugLog('Extension deactivation triggered - starting graceful shutdown');
          // Don't await here as VS Code may have timeout constraints
          this.gracefulShutdown().catch(error => {
            this.debugLog(`Deactivation cleanup failed: ${error}`, 'error');
          });
        }
      }
    });

    // Setup emergency handlers (for crash scenarios)
    const emergencyHandler = async (signal: string) => {
      if (!this.isShuttingDown) {
        this.debugLog(`Received ${signal} - starting emergency shutdown`, 'warning');
        try {
          await this.emergencyShutdown();
        } catch (error) {
          this.debugLog(`Emergency shutdown failed: ${error}`, 'error');
        }
      }
    };

    // Handle process termination signals
    process.once('SIGTERM', () => emergencyHandler('SIGTERM'));
    process.once('SIGINT', () => emergencyHandler('SIGINT'));
    process.once('beforeExit', () => emergencyHandler('beforeExit'));
  }

  /**
   * Generate recovery summary
   */
  private generateRecoverySummary(result: StartupRecoveryResult, duration: number): string {
    const parts: string[] = [];

    if (result.recoveryNeeded) {
      parts.push('🔧 Crash recovery performed:');
      
      if (result.orphanProcesses.orphansFound > 0) {
        parts.push(`  • ${result.orphanProcesses.orphansFound} orphaned processes found, ${result.orphanProcesses.orphansCleaned} cleaned`);
      }
      
      if (result.fileCleanup.filesDeleted > 0) {
        parts.push(`  • ${result.fileCleanup.filesDeleted} temporary files cleaned (${result.fileCleanup.bytesFreed} bytes)`);
      }
      
      if (result.commandConflicts.skipped > 0) {
        parts.push(`  • ${result.commandConflicts.skipped} command conflicts resolved`);
      }
    } else {
      parts.push('✅ Clean startup - no recovery needed');
    }

    parts.push(`⏱️ Initialization completed in ${duration}ms`);
    return parts.join('\n');
  }

  /**
   * Generate cleanup summary
   */
  private generateCleanupSummary(result: CleanupResult): string {
    const parts: string[] = [];
    
    parts.push(`🧹 Cleanup ${result.success ? 'completed' : 'completed with errors'}:`);
    parts.push(`  • Processes: ${result.processes.cleaned} cleaned, ${result.processes.failed} failed`);
    parts.push(`  • Commands: ${result.commands.disposed} disposed`);
    
    if (result.files.filesDeleted > 0) {
      parts.push(`  • Files: ${result.files.filesDeleted} deleted (${result.files.bytesFreed} bytes freed)`);
    }
    
    if (result.errors.length > 0) {
      parts.push(`  • Errors: ${result.errors.length} encountered`);
    }
    
    parts.push(`⏱️ Duration: ${result.duration}ms`);
    return parts.join('\n');
  }

  /**
   * Create default cleanup result
   */
  private createDefaultCleanupResult(): CleanupResult {
    return {
      success: false,
      duration: 0,
      processes: { cleaned: 0, failed: 0, alreadyGone: 0, details: [] },
      files: { filesDeleted: 0, directoriesRemoved: 0, filesSkipped: 0, bytesFreed: 0, failures: [], details: [] },
      commands: { disposed: 0, errors: [] },
      errors: ['Cleanup not properly initialized'],
      summary: 'Cleanup failed - not properly initialized'
    };
  }

  /**
   * Initialize Process Manager component
   */
  private async initializeProcessManager(result: StartupRecoveryResult): Promise<void> {
    this.processManager = new HaruspexProcessManager(
      this.workspaceRoot,
      this.debugLog,
      this.config.processManagerConfig || {}
    );

    result.orphanProcesses = await this.processManager.initialize();
    if (result.orphanProcesses.orphansFound > 0) {
      result.recoveryNeeded = true;
    }

    this.debugLog(`Process Manager initialized: ${result.orphanProcesses.orphansFound} orphans found`);
  }

  /**
   * Initialize File Cleanup component
   */
  private async initializeFileCleanup(result: StartupRecoveryResult): Promise<void> {
    this.fileCleanup = new HaruspexFileCleanup(
      this.workspaceRoot,
      this.debugLog,
      this.config.fileCleanupConfig || {}
    );

    // Perform startup file cleanup if crash recovery is enabled
    if (this.config.recovery?.enableStartupRecovery) {
      result.fileCleanup = await this.fileCleanup.cleanupFiles();
      if (result.fileCleanup.filesDeleted > 0) {
        result.recoveryNeeded = true;
      }
    }

    this.debugLog(`File Cleanup initialized: ${result.fileCleanup.filesDeleted} files cleaned`);
  }

  /**
   * Initialize Command Manager component
   */
  private async initializeCommandManager(result: StartupRecoveryResult): Promise<void> {
    this.commandManager = new HaruspexCommandManager(
      this.context,
      this.debugLog,
      this.config.commandManagerConfig || {}
    );

    this.debugLog('Command Manager initialized');
  }

  /**
   * Get current configuration
   */
  getConfiguration(): CleanupOrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Get configuration validation result
   */
  getConfigurationValidation(): ValidationResult<CleanupOrchestratorConfig> {
    return this.configValidation;
  }

  /**
   * Get aggregated errors from all components
   */
  getErrors(): import('./shared-errors').StructuredError[] {
    const allStructuredErrors: import('./shared-errors').StructuredError[] = [];
    
    // Collect errors from orchestrator's error aggregator (convert to structured)
    allStructuredErrors.push(...this.errorAggregator.getErrors().map(error => error.toStructured()));
    
    // Collect already structured errors from components
    if (this.processManager) {
      allStructuredErrors.push(...this.processManager.getErrors());
    }
    if (this.fileCleanup) {
      allStructuredErrors.push(...this.fileCleanup.getErrors());
    }
    if (this.commandManager) {
      allStructuredErrors.push(...this.commandManager.getErrors());
    }
    
    return allStructuredErrors;
  }

  /**
   * Get comprehensive error summary from all components
   */
  getErrorSummary(): {
    orchestrator: ReturnType<ErrorAggregator['getSummary']>;
    processManager?: ReturnType<ErrorAggregator['getSummary']>;
    fileCleanup?: ReturnType<ErrorAggregator['getSummary']>;
    commandManager?: ReturnType<ErrorAggregator['getSummary']>;
    totalErrors: number;
    criticalErrors: number;
  } {
    const orchestratorSummary = this.errorAggregator.getSummary();
    const result: {
      orchestrator: ReturnType<ErrorAggregator['getSummary']>;
      processManager?: ReturnType<ErrorAggregator['getSummary']>;
      fileCleanup?: ReturnType<ErrorAggregator['getSummary']>;
      commandManager?: ReturnType<ErrorAggregator['getSummary']>;
      totalErrors: number;
      criticalErrors: number;
    } = {
      orchestrator: orchestratorSummary,
      totalErrors: orchestratorSummary.total,
      criticalErrors: orchestratorSummary.critical
    };
    
    if (this.processManager) {
      const pmSummary = this.processManager.getErrorSummary();
      result.processManager = pmSummary;
      result.totalErrors += pmSummary.total;
      result.criticalErrors += pmSummary.critical;
    }
    
    if (this.fileCleanup) {
      const fcSummary = this.fileCleanup.getErrorSummary();
      result.fileCleanup = fcSummary;
      result.totalErrors += fcSummary.total;
      result.criticalErrors += fcSummary.critical;
    }
    
    if (this.commandManager) {
      const cmSummary = this.commandManager.getErrorSummary();
      result.commandManager = cmSummary;
      result.totalErrors += cmSummary.total;
      result.criticalErrors += cmSummary.critical;
    }
    
    return result;
  }

  /**
   * Clear all accumulated errors from all components
   */
  clearErrors(): void {
    this.errorAggregator.clear();
    
    if (this.processManager) {
      this.processManager.clearErrors();
    }
    if (this.fileCleanup) {
      this.fileCleanup.clearErrors();
    }
    if (this.commandManager) {
      this.commandManager.clearErrors();
    }
  }

  /**
   * Get comprehensive status report with enhanced error information
   */
  generateStatusReport(): {
    orchestrator: {
      initialized: boolean;
      shuttingDown: boolean;
      processes: number;
      commands: number;
      canPerformCleanup: boolean;
    };
    processes?: Array<{pid: number; name: string; type: string}>;
    commands?: Array<{id: string; category: string; registered: boolean}>;
    errors: {
      total: number;
      critical: number;
      byComponent: Record<string, number>;
    };
    configuration: {
      valid: boolean;
      componentsEnabled: {
        processManagement: boolean;
        fileCleanup: boolean;
        commandManagement: boolean;
        crashRecovery: boolean;
      };
    };
    recommendations: string[];
  } {
    const status = this.getStatus();
    const errorSummary = this.getErrorSummary();
    const recommendations: string[] = [];

    const report = {
      orchestrator: status,
      errors: {
        total: errorSummary.totalErrors,
        critical: errorSummary.criticalErrors,
        byComponent: {
          orchestrator: errorSummary.orchestrator.total,
          processManager: errorSummary.processManager?.total || 0,
          fileCleanup: errorSummary.fileCleanup?.total || 0,
          commandManager: errorSummary.commandManager?.total || 0
        }
      },
      configuration: {
        valid: this.configValidation.success,
        componentsEnabled: {
          processManagement: this.config.components?.enableProcessManagement || false,
          fileCleanup: this.config.components?.enableFileCleanup || false,
          commandManagement: this.config.components?.enableCommandManagement || false,
          crashRecovery: this.config.recovery?.enableStartupRecovery || false
        }
      },
      recommendations
    };

    // Add component-specific information
    if (this.processManager) {
      (report as any).processes = this.processManager.getTrackedProcesses().map(p => ({
        pid: p.pid,
        name: p.name,
        type: p.type
      }));
    }

    if (this.commandManager) {
      (report as any).commands = this.commandManager.getRegisteredCommands().map(c => ({
        id: c.commandId,
        category: c.metadata.category,
        registered: !!c.disposable
      }));

      const stats = this.commandManager.getRegistrationStats();
      if (stats.byStatus.failed > 0) {
        recommendations.push(`${stats.byStatus.failed} commands failed to register - check for conflicts`);
      }
    }

    // Configuration recommendations
    if (!this.configValidation.success) {
      recommendations.push('Configuration validation failed - check configuration settings');
    }

    // Error-based recommendations
    if (errorSummary.criticalErrors > 0) {
      recommendations.push(`${errorSummary.criticalErrors} critical errors detected - immediate attention required`);
    }
    
    if (errorSummary.totalErrors > 10) {
      recommendations.push('High error count detected - review component configurations');
    }

    // Performance recommendations
    if (status.processes > 10) {
      recommendations.push('High number of tracked processes - consider cleanup');
    }

    if (!status.canPerformCleanup) {
      recommendations.push('Cleanup orchestrator not ready - initialization may have failed');
    }

    return report;
  }
}
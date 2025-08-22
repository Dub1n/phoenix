/**---
 * title: [Haruspex Command Manager - Robust Command Registration & Conflict Resolution]
 * tags: [Core, Command-Management, VS-Code, Hot-Reload, Conflict-Resolution]
 * provides: [CommandRegistration, ConflictHandling, HotReloadSupport, CleanupTracking]
 * requires: [VS Code Extension API, Extension Context, Disposable Management, Shared Configuration, Structured Errors]
 * description: [Enhanced command registration system with unified configuration patterns, comprehensive conflict resolution, and structured error handling]
 * ---*/

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { CommandManagerConfig, CommandManagerConfigSchema, validateConfig, ValidationResult } from './shared-schemas';
import { 
  HaruspexError, 
  CommandManagementError, 
  CommandRegistrationError, 
  CommandHotReloadError,
  TimeoutError,
  AsyncOperationError,
  ErrorClassifier,
  ErrorAggregator,
  ErrorSeverity,
  ErrorClassification,
  RecoveryStrategy
} from './shared-errors';
import { ConflictResolver } from './conflict-resolver';

export interface CommandRegistration {
  /** Unique command identifier */
  commandId: string;
  /** Command handler function */
  handler: (...args: any[]) => any;
  /** VS Code disposable for cleanup */
  disposable?: vscode.Disposable;
  /** Number of registration attempts */
  registrationAttempts: number;
  /** Last registration error (if any) */
  lastError?: string;
  /** When this command was first registered */
  registeredAt: number;
  /** Session ID when registered */
  sessionId: string;
  /** Command metadata for debugging */
  metadata: {
    category: 'core' | 'debug' | 'ui' | 'setup' | 'custom';
    description: string;
    essential: boolean; // Critical for extension functionality
  };
}

// Configuration interface is now imported from shared-schemas.ts

export interface CommandRegistrationResult {
  /** Number of commands successfully registered */
  successful: number;
  /** Number of commands skipped (already exists) */
  skipped: number;
  /** Number of commands that failed registration */
  failed: number;
  /** Details about each registration attempt */
  details: Array<{
    commandId: string;
    status: 'success' | 'skipped' | 'failed';
    reason: string;
    attempts: number;
  }>;
}

export interface CommandInfo {
  /** Command identifier */
  id: string;
  /** Command category */
  category: 'core' | 'debug' | 'ui' | 'setup' | 'custom';
  /** Command description */
  description?: string;
  /** Registration timestamp */
  registeredAt: number;
  /** Number of registration attempts */
  attempts: number;
  /** Whether command is essential for functionality */
  essential: boolean;
  /** Session ID when registered */
  sessionId: string;
}

/**
 * Enhanced command manager for VS Code extension commands
 * 
 * Features:
 * - Graceful handling of hot-reload command conflicts
 * - Intelligent error classification (hot-reload vs genuine errors)
 * - Comprehensive command lifecycle tracking
 * - Safe command disposal and cleanup
 * - Development-friendly logging and feedback
 * - Command registration statistics and reporting
 */
export class HaruspexCommandManager extends EventEmitter {
  private registeredCommands = new Map<string, CommandRegistration>();
  private config: CommandManagerConfig;
  private sessionId: string;
  private errorAggregator = new ErrorAggregator();
  private configValidation: ValidationResult<CommandManagerConfig>;
  private conflictResolver: ConflictResolver;

  constructor(
    private context: vscode.ExtensionContext,
    private debugLog: (message: string, level?: 'info' | 'warning' | 'error') => void,
    config: Partial<CommandManagerConfig> = {}
  ) {
    super();
    
    // Enhanced session ID generation for better uniqueness
    this.sessionId = this.generateSessionId();
    
    // Validate and merge configuration with comprehensive schema validation
    this.configValidation = this.validateAndMergeConfig(config);
    
    if (!this.configValidation.success) {
      const error = new (class extends HaruspexError {
        getClassification() { return ErrorClassification.CONFIGURATION; }
        getRecoveryStrategy() { return RecoveryStrategy.USER_INTERVENTION; }
      })(
        `Command Manager configuration validation failed: ${this.configValidation.errors.map(e => e.message).join(', ')}`,
        'CommandManager',
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

    // Initialize conflict resolver
    this.conflictResolver = new ConflictResolver(this.config, this.debugLog);

    this.debugLog(`Command Manager initialized (Session: ${this.sessionId})`);
  }

  /**
   * Validate and merge configuration with schema validation
   */
  private validateAndMergeConfig(config: Partial<CommandManagerConfig>): ValidationResult<CommandManagerConfig> {
    const defaultConfig = this.createDefaultConfig();
    const mergedConfig = {
      ...defaultConfig,
      ...config,
      // Merge nested objects properly
      hotReload: {
        ...defaultConfig.hotReload,
        ...config.hotReload
      },
      registration: {
        ...defaultConfig.registration,
        ...config.registration
      },
      lifecycle: {
        ...defaultConfig.lifecycle,
        ...config.lifecycle
      },
      errorHandling: {
        ...defaultConfig.errorHandling,
        ...config.errorHandling
      }
    };
    
    return validateConfig(CommandManagerConfigSchema, mergedConfig, 'CommandManager');
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): CommandManagerConfig {
    return {
      enableDetailedLogging: true,
      enableSafetyChecks: true,
      dryRun: false,
      gracefulTimeout: 10000,
      hotReload: {
        enableHotReloadHandling: true,
        enableConflictResolution: true,
        conflictResolutionStrategy: 'graceful-skip',
        conflictResolutionTimeout: 5000
      },
      registration: {
        maxRegistrationAttempts: 3,
        enableRegistrationRetry: true,
        registrationRetryDelay: 1000,
        enableParallelRegistration: false
      },
      lifecycle: {
        enableDisposalTracking: true,
        enableHealthMonitoring: true,
        registrationTimeout: 10000
      },
      errorHandling: {
        throwOnError: false,
        enableErrorClassification: true,
        enableErrorRecovery: true
      }
    };
  }

  /**
   * Generate a unique session ID with better entropy
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const pid = process.pid;
    const random = Math.random().toString(36).substring(2, 15);
    const contextId = this.context?.extension?.id?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8) || 'haruspex';
    
    return `cmd_${timestamp}_${pid}_${contextId}_${random}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current configuration
   */
  getConfiguration(): CommandManagerConfig {
    return { ...this.config };
  }

  /**
   * Get configuration validation result
   */
  getConfigurationValidation(): ValidationResult<CommandManagerConfig> {
    return this.configValidation;
  }

  /**
   * Get aggregated errors
   */
  getErrors(): import('./shared-errors').StructuredError[] {
    return this.errorAggregator.getErrors().map(error => error.toStructured());
  }

  /**
   * Get error summary
   */
  getErrorSummary(): ReturnType<ErrorAggregator['getSummary']> {
    return this.errorAggregator.getSummary();
  }

  /**
   * Clear all accumulated errors
   */
  clearErrors(): void {
    this.errorAggregator.clear();
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
          'CommandManager',
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
   * Register a single command with enhanced conflict handling
   */
  async registerCommand(
    commandId: string, 
    handler: (...args: any[]) => any,
    metadata: Partial<CommandRegistration['metadata']> = {}
  ): Promise<CommandRegistrationResult> {
    const fullMetadata: CommandRegistration['metadata'] = {
      category: 'custom',
      description: `Command ${commandId}`,
      essential: false,
      ...metadata
    };

    try {
      // Check if we already have this command registered
      const existing = this.registeredCommands.get(commandId);
      if (existing) {
        existing.registrationAttempts++;
        
        // Use the conflict resolver to handle the conflict
        const resolution = await this.conflictResolver.resolveConflict(
          commandId,
          existing,
          handler,
          fullMetadata
        );
        
        switch (resolution.action) {
          case 'skip':
            this.debugLog(`Command ${commandId} already registered - ${resolution.reason}`, 'info');
            this.emit('command_skipped', existing);
            return {
              successful: 0,
              skipped: 1,
              failed: 0,
              details: [{
                commandId,
                status: 'skipped',
                reason: resolution.reason || 'Already registered',
                attempts: existing.registrationAttempts
              }]
            };
            
          case 'replace':
            this.debugLog(`Replacing existing command ${commandId} - ${resolution.reason}`, 'info');
            // Dispose old registration first
            if (existing.disposable) {
              existing.disposable.dispose();
            }
            // Continue with new registration
            break;
            
          case 'error':
            throw new CommandRegistrationError(
              resolution.reason || `Command ${commandId} already registered`,
              commandId,
              existing.registrationAttempts
            );
            
          case 'retry':
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, resolution.retryDelay || 1000));
            return this.registerCommand(commandId, handler, metadata);
        }
      }

      // Attempt to register with VS Code with timeout
      const disposable = await this.executeWithTimeout(
        Promise.resolve(vscode.commands.registerCommand(commandId, handler)),
        this.config.lifecycle?.registrationTimeout || 10000,
        `Register command ${commandId}`
      );
      
      // Track the registration
      const registration: CommandRegistration = {
        commandId,
        handler,
        disposable,
        registrationAttempts: (existing?.registrationAttempts || 0) + 1,
        registeredAt: Date.now(),
        sessionId: this.sessionId,
        metadata: fullMetadata
      };

      this.registeredCommands.set(commandId, registration);
      this.context.subscriptions.push(disposable);

      if (this.config.enableDetailedLogging) {
        this.debugLog(`✓ Registered command: ${commandId} (${fullMetadata.category})`);
      }

      this.emit('command_registered', registration);
      return {
        successful: 1,
        skipped: 0,
        failed: 0,
        details: [{
          commandId,
          status: 'success',
          reason: 'Successfully registered',
          attempts: registration.registrationAttempts
        }]
      };

    } catch (error) {
      const structuredError = this.classifyRegistrationError(error, commandId, fullMetadata);
      this.errorAggregator.add(structuredError);
      
      // Track the failed registration
      const registration: CommandRegistration = {
        commandId,
        handler,
        registrationAttempts: (this.registeredCommands.get(commandId)?.registrationAttempts || 0) + 1,
        lastError: structuredError.message,
        registeredAt: Date.now(),
        sessionId: this.sessionId,
        metadata: fullMetadata
      };
      
      this.registeredCommands.set(commandId, registration);
      this.emit('command_failed', registration);
      
      if (this.config.errorHandling?.throwOnError) {
        throw structuredError;
      }
      
      this.debugLog(`✗ Failed to register command ${commandId}: ${structuredError.message}`, 'error');
      return {
        successful: 0,
        skipped: 0,
        failed: 1,
        details: [{
          commandId,
          status: 'failed',
          reason: structuredError.message,
          attempts: registration.registrationAttempts
        }]
      };
    }
  }

  /**
   * Register multiple commands in batch with comprehensive reporting
   */
  async registerCommands(commands: Array<{
    commandId: string;
    handler: (...args: any[]) => any;
    metadata?: Partial<CommandRegistration['metadata']>;
  }>): Promise<CommandRegistrationResult> {
    const result: CommandRegistrationResult = {
      successful: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    this.debugLog(`Registering ${commands.length} commands...`);

    for (const command of commands) {
      try {
        const success = await this.registerCommand(
          command.commandId, 
          command.handler, 
          command.metadata
        );
        
        if (success) {
          result.successful++;
          result.details.push({
            commandId: command.commandId,
            status: 'success',
            reason: 'Successfully registered',
            attempts: 1
          });
        } else {
          const registration = this.registeredCommands.get(command.commandId);
          const isConflict = registration?.lastError && this.isHotReloadError(registration.lastError);
          
          if (isConflict) {
            result.skipped++;
            result.details.push({
              commandId: command.commandId,
              status: 'skipped',
              reason: 'Hot-reload conflict (gracefully handled)',
              attempts: registration?.registrationAttempts || 1
            });
          } else {
            result.failed++;
            result.details.push({
              commandId: command.commandId,
              status: 'failed',
              reason: registration?.lastError || 'Unknown error',
              attempts: registration?.registrationAttempts || 1
            });
          }
        }
        
      } catch (error) {
        result.failed++;
        result.details.push({
          commandId: command.commandId,
          status: 'failed',
          reason: error instanceof Error ? error.message : 'Unknown error',
          attempts: 1
        });
      }
    }

    // Log summary
    this.debugLog(
      `Command registration complete: ${result.successful} successful, ` +
      `${result.skipped} skipped (hot-reload), ${result.failed} failed`
    );

    this.emit('batch_registration_complete', result);
    return result;
  }

  /**
   * Safely unregister a command
   */
  async unregisterCommand(commandId: string): Promise<boolean> {
    const registration = this.registeredCommands.get(commandId);
    
    if (!registration) {
      this.debugLog(`Cannot unregister ${commandId}: not found in registry`, 'warning');
      return false;
    }

    try {
      // Dispose of the VS Code registration
      if (registration.disposable) {
        registration.disposable.dispose();
      }

      // Remove from our tracking
      this.registeredCommands.delete(commandId);
      
      this.debugLog(`✓ Unregistered command: ${commandId}`);
      this.emit('command_unregistered', registration);
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.debugLog(`✗ Failed to unregister command ${commandId}: ${errorMessage}`, 'error');
      return false;
    }
  }

  /**
   * Get all registered commands
   */
  getRegisteredCommands(): CommandRegistration[] {
    return Array.from(this.registeredCommands.values());
  }

  /**
   * Get registration statistics
   */
  getRegistrationStats(): {
    total: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    byConflictResolution: Record<string, number>;
    essential: number;
    sessionId: string;
  } {
    const commands = this.getRegisteredCommands();
    
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {
      successful: 0,
      skipped: 0,
      failed: 0
    };
    const byConflictResolution: Record<string, number> = {
      preserved: 0,
      overwritten: 0,
      skipped: 0
    };

    for (const cmd of commands) {
      // Count by category
      byCategory[cmd.metadata.category] = (byCategory[cmd.metadata.category] || 0) + 1;
      
      // Count by status
      if (cmd.disposable) {
        byStatus.successful++;
      } else {
        byStatus.failed++;
      }
    }

    return {
      total: commands.length,
      byCategory,
      byStatus,
      byConflictResolution,
      essential: commands.filter(cmd => cmd.metadata.essential).length,
      sessionId: this.sessionId
    };
  }

  /**
   * Check if a command is registered and functional
   */
  isCommandRegistered(commandId: string): boolean {
    const registration = this.registeredCommands.get(commandId);
    return !!(registration && registration.disposable);
  }

  /**
   * Get command registration details
   */
  getCommandDetails(commandId: string): CommandRegistration | undefined {
    return this.registeredCommands.get(commandId);
  }

  /**
   * Retry failed command registrations
   */
  async retryFailedRegistrations(): Promise<CommandRegistrationResult> {
    const failedCommands = this.getRegisteredCommands()
      .filter(cmd => !cmd.disposable && cmd.registrationAttempts < (this.config.registration?.maxRegistrationAttempts || 3));

    if (failedCommands.length === 0) {
      return {
        successful: 0,
        skipped: 0,
        failed: 0,
        details: []
      };
    }

    this.debugLog(`Retrying ${failedCommands.length} failed command registrations...`);

    const retryCommands = failedCommands.map(cmd => ({
      commandId: cmd.commandId,
      handler: cmd.handler,
      metadata: cmd.metadata
    }));

    return await this.registerCommands(retryCommands);
  }

  /**
   * Clean up commands (public cleanup method)
   */
  async cleanupCommands(options: {
    onlyFailed?: boolean;
    maxAge?: number;
    force?: boolean;
  } = {}): Promise<CommandRegistrationResult> {
    const result: CommandRegistrationResult = {
      successful: 0,
      skipped: 0,
      failed: 0,
      details: []
    };

    const now = Date.now();
    const { onlyFailed = false, maxAge, force = false } = options;

    this.debugLog(`Cleaning up commands (onlyFailed: ${onlyFailed}, maxAge: ${maxAge}, force: ${force})...`);

    const commandsToCleanup = Array.from(this.registeredCommands.values()).filter(cmd => {
      // Filter by failed status if requested
      if (onlyFailed && cmd.disposable) {
        return false; // Skip successful registrations
      }

      // Filter by age if specified
      if (maxAge && (now - cmd.registeredAt) < maxAge) {
        return false; // Skip commands that are too recent
      }

      return true;
    });

    for (const registration of commandsToCleanup) {
      try {
        if (registration.disposable || force) {
          // Dispose if we have a disposable or if forced
          if (registration.disposable) {
            registration.disposable.dispose();
          }

          // Remove from tracking
          this.registeredCommands.delete(registration.commandId);

          result.successful++;
          result.details.push({
            commandId: registration.commandId,
            status: 'success',
            reason: 'Command cleaned up successfully',
            attempts: registration.registrationAttempts
          });

          this.debugLog(`✓ Cleaned up command: ${registration.commandId}`);
          this.emit('command_cleaned', registration);

        } else {
          result.skipped++;
          result.details.push({
            commandId: registration.commandId,
            status: 'skipped',
            reason: 'No disposable found and force not enabled',
            attempts: registration.registrationAttempts
          });
        }

      } catch (error) {
        result.failed++;
        result.details.push({
          commandId: registration.commandId,
          status: 'failed',
          reason: error instanceof Error ? error.message : 'Unknown error',
          attempts: registration.registrationAttempts
        });

        this.debugLog(`✗ Failed to cleanup command ${registration.commandId}: ${error}`, 'error');
      }
    }

    this.debugLog(
      `Command cleanup complete: ${result.successful} cleaned, ` +
      `${result.skipped} skipped, ${result.failed} failed`
    );

    this.emit('cleanup_complete', result);
    return result;
  }

  /**
   * Dispose all registered commands
   */
  async dispose(): Promise<number> {
    this.debugLog('Disposing all registered commands...');
    
    let disposed = 0;
    
    for (const [commandId, registration] of this.registeredCommands) {
      try {
        if (registration.disposable) {
          registration.disposable.dispose();
          disposed++;
        }
      } catch (error) {
        this.debugLog(`Error disposing command ${commandId}: ${error}`, 'warning');
      }
    }

    this.registeredCommands.clear();
    this.removeAllListeners();
    
    this.debugLog(`Disposed ${disposed} commands`);
    return disposed;
  }

  /**
   * Classify registration errors for better handling
   */
  private classifyRegistrationError(
    error: unknown,
    commandId: string,
    metadata: CommandRegistration['metadata']
  ): HaruspexError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's a hot-reload conflict
    if (this.isHotReloadError(errorMessage)) {
      return new CommandHotReloadError(
        `Hot-reload conflict for command ${commandId}: ${errorMessage}`,
        commandId,
        'registration',
        { originalError: errorMessage, metadata }
      );
    }
    
    // Check if it's a timeout
    if (error instanceof TimeoutError) {
      return error;
    }
    
    // Generic registration error
    return new CommandRegistrationError(
      `Registration failed for command ${commandId}: ${errorMessage}`,
      commandId,
      1,
      { originalError: errorMessage, metadata }
    );
  }

  /**
   * Check if an error is likely due to hot-reload command conflicts
   */
  private isHotReloadError(errorMessage: string): boolean {
    const hotReloadIndicators = [
      'already exists',
      'command already registered',
      'duplicate command',
      'command is already registered'
    ];

    return hotReloadIndicators.some(indicator => 
      errorMessage.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  /**
   * Generate a comprehensive registration report
   */
  generateReport(): {
    summary: string;
    details: string;
    stats: {
      total: number;
      byCategory: Record<string, number>;
      byStatus: Record<string, number>;
      essential: number;
      sessionId: string;
    };
    recommendations: string[];
  } {
    const stats = this.getRegistrationStats();
    const commands = this.getRegisteredCommands();
    
    const failed = commands.filter(cmd => !cmd.disposable);
    const essential = commands.filter(cmd => cmd.metadata.essential);
    
    const summary = `Command Registration Report:
• Total Commands: ${stats.total}
• Successfully Registered: ${stats.byStatus.registered}
• Failed Registrations: ${stats.byStatus.failed}
• Essential Commands: ${stats.essential}`;

    const details = commands.map(cmd => {
      const status = cmd.disposable ? '✓' : '✗';
      const attempts = cmd.registrationAttempts > 1 ? ` (${cmd.registrationAttempts} attempts)` : '';
      const error = cmd.lastError ? ` - ${cmd.lastError}` : '';
      return `${status} ${cmd.commandId} [${cmd.metadata.category}]${attempts}${error}`;
    }).join('\n');

    const recommendations: string[] = [];
    
    if (failed.length > 0) {
      recommendations.push(`${failed.length} commands failed to register - check for conflicts`);
    }
    
    if (essential.filter(cmd => !cmd.disposable).length > 0) {
      recommendations.push('Essential commands failed - extension functionality may be limited');
    }
    
    if (stats.byStatus.failed > stats.byStatus.registered * 0.5) {
      recommendations.push('High failure rate - consider hot-reload handling or command cleanup');
    }

    return {
      summary,
      details,
      stats,
      recommendations
    };
  }

  /**
   * Get current status information
   */
  getStatus(): {
    initialized: boolean;
    commandCount: number;
    canRegister: boolean;
  } {
    return {
      initialized: false, // Command manager doesn't need initialization
      commandCount: this.registeredCommands.size,
      canRegister: true
    };
  }

  /**
   * Generate comprehensive status report
   */
  generateStatusReport(): {
    configuration: { valid: boolean };
    commands: { 
      total: number; 
      byCategory: Record<string, number>;
    };
    conflicts: { detectionEnabled: boolean };
    errors: { total: number };
  } {
    const stats = this.getRegistrationStats();
    const errorSummary = this.getErrorSummary();
    
    return {
      configuration: {
        valid: this.configValidation.success
      },
      commands: {
        total: stats.total,
        byCategory: stats.byCategory
      },
      conflicts: {
        detectionEnabled: this.config.hotReload?.enableConflictResolution ?? true
      },
      errors: {
        total: errorSummary.total
      }
    };
  }

  /**
   * Dispose commands by category
   */
  disposeByCategory(category: string): number {
    let disposed = 0;
    const toDispose: string[] = [];
    
    for (const [commandId, registration] of this.registeredCommands) {
      if (registration.metadata.category === category) {
        toDispose.push(commandId);
      }
    }
    
    for (const commandId of toDispose) {
      const registration = this.registeredCommands.get(commandId);
      if (registration?.disposable) {
        try {
          registration.disposable.dispose();
          disposed++;
        } catch (error) {
          this.debugLog(`Failed to dispose command ${commandId}: ${error}`, 'warning');
        }
      }
      this.registeredCommands.delete(commandId);
    }
    
    return disposed;
  }

  /**
   * Create a test-friendly command manager instance
   */
  static createForTesting(
    context: vscode.ExtensionContext,
    debugLog: (message: string, level?: string) => void = () => {},
    config: Partial<CommandManagerConfig> = {}
  ): HaruspexCommandManager {
    return new HaruspexCommandManager(context, debugLog, {
      enableDetailedLogging: false,
      enableSafetyChecks: true,
      dryRun: false,
      gracefulTimeout: 5000,
      hotReload: {
        enableHotReloadHandling: true,
        enableConflictResolution: true,
        conflictResolutionStrategy: 'graceful-skip',
        conflictResolutionTimeout: 5000
      },
      registration: {
        maxRegistrationAttempts: 3,
        enableRegistrationRetry: false,
        registrationRetryDelay: 100,
        enableParallelRegistration: false
      },
      lifecycle: {
        enableDisposalTracking: false,
        enableHealthMonitoring: false,
        registrationTimeout: 5000
      },
      errorHandling: {
        throwOnError: false,
        enableErrorClassification: true,
        enableErrorRecovery: true
      },
      ...config
    });
  }
}
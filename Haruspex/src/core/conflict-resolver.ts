/**---
 * title: [Haruspex Conflict Resolver - Advanced Command Conflict Resolution]
 * tags: [Core, Conflict-Resolution, Command-Management, Hot-Reload, Strategy-Pattern]
 * provides: [ConflictResolution, StrategyPattern, HotReloadHandling, AdvancedConflictManagement]
 * requires: [CommandManagerConfig, CommandRegistration, Error Framework]
 * description: [Advanced conflict resolution system for VS Code command registration with multiple strategies and intelligent conflict detection]
 * ---*/

import { CommandManagerConfig } from './shared-schemas';
import { CommandRegistration } from './haruspex-command-manager';

/**
 * Conflict resolution action types
 */
export type ConflictResolutionAction = 'skip' | 'replace' | 'error' | 'retry';

/**
 * Conflict resolution result
 */
export interface ConflictResolutionResult {
  action: ConflictResolutionAction;
  reason: string;
  retryDelay?: number;
  metadata?: Record<string, any>;
}

/**
 * Conflict context information
 */
export interface ConflictContext {
  commandId: string;
  existingRegistration: CommandRegistration;
  newHandler: (...args: any[]) => any;
  newMetadata: CommandRegistration['metadata'];
  conflictType: ConflictType;
  sessionAge: number;
  attemptNumber: number;
}

/**
 * Types of conflicts that can occur
 */
export enum ConflictType {
  HOT_RELOAD = 'hot_reload',
  DUPLICATE_REGISTRATION = 'duplicate_registration',
  SESSION_CONFLICT = 'session_conflict',
  PERMISSION_CONFLICT = 'permission_conflict',
  UNKNOWN = 'unknown'
}

/**
 * Advanced conflict resolver for command registration
 */
export class ConflictResolver {
  constructor(
    private config: CommandManagerConfig,
    private debugLog: (message: string, level?: 'info' | 'warning' | 'error') => void
  ) {}

  /**
   * Resolve a command registration conflict
   */
  async resolveConflict(
    commandId: string,
    existingRegistration: CommandRegistration,
    newHandler: (...args: any[]) => any,
    newMetadata: CommandRegistration['metadata']
  ): Promise<ConflictResolutionResult> {
    // Analyze the conflict context
    const context = this.analyzeConflict(commandId, existingRegistration, newHandler, newMetadata);
    
    // Apply resolution strategy based on configuration
    const strategy = this.config.hotReload?.conflictResolutionStrategy || 'graceful-skip';
    
    switch (strategy) {
      case 'graceful-skip':
        return this.gracefulSkipStrategy(context);
        
      case 'preserve-existing':
        return this.preserveExistingStrategy(context);
        
      case 'overwrite':
        return this.overwriteStrategy(context);
        
      case 'skip-conflicts':
        return this.skipConflictsStrategy(context);
        
      default:
        this.debugLog(`Unknown conflict resolution strategy: ${strategy}`, 'warning');
        return this.gracefulSkipStrategy(context);
    }
  }

  /**
   * Analyze the type and context of a conflict
   */
  private analyzeConflict(
    commandId: string,
    existingRegistration: CommandRegistration,
    newHandler: (...args: any[]) => any,
    newMetadata: CommandRegistration['metadata']
  ): ConflictContext {
    const now = Date.now();
    const sessionAge = now - existingRegistration.registeredAt;
    
    // Determine conflict type
    let conflictType = ConflictType.UNKNOWN;
    
    if (this.isHotReloadScenario(existingRegistration, sessionAge)) {
      conflictType = ConflictType.HOT_RELOAD;
    } else if (this.isDuplicateRegistration(existingRegistration, newHandler)) {
      conflictType = ConflictType.DUPLICATE_REGISTRATION;
    } else if (this.isSessionConflict(existingRegistration)) {
      conflictType = ConflictType.SESSION_CONFLICT;
    } else if (this.isPermissionConflict(existingRegistration)) {
      conflictType = ConflictType.PERMISSION_CONFLICT;
    }
    
    return {
      commandId,
      existingRegistration,
      newHandler,
      newMetadata,
      conflictType,
      sessionAge,
      attemptNumber: existingRegistration.registrationAttempts
    };
  }

  /**
   * Graceful skip strategy - skip conflicting registrations gracefully
   */
  private gracefulSkipStrategy(context: ConflictContext): ConflictResolutionResult {
    switch (context.conflictType) {
      case ConflictType.HOT_RELOAD:
        return {
          action: 'skip',
          reason: 'Hot-reload scenario detected - gracefully skipping duplicate registration',
          metadata: { conflictType: context.conflictType, sessionAge: context.sessionAge }
        };
        
      case ConflictType.DUPLICATE_REGISTRATION:
        return {
          action: 'skip',
          reason: 'Duplicate registration detected - skipping to avoid conflicts',
          metadata: { conflictType: context.conflictType }
        };
        
      case ConflictType.SESSION_CONFLICT:
        return {
          action: 'skip',
          reason: 'Session conflict detected - skipping to maintain session integrity',
          metadata: { conflictType: context.conflictType }
        };
        
      default:
        return {
          action: 'skip',
          reason: 'Unknown conflict type - gracefully skipping for safety',
          metadata: { conflictType: context.conflictType }
        };
    }
  }

  /**
   * Force replace strategy - replace existing registrations
   */
  private preserveExistingStrategy(context: ConflictContext): ConflictResolutionResult {
    // Only replace in certain scenarios to avoid breaking existing functionality
    switch (context.conflictType) {
      case ConflictType.HOT_RELOAD:
        return {
          action: 'replace',
          reason: 'Hot-reload scenario - replacing with updated registration',
          metadata: { conflictType: context.conflictType, replaced: true }
        };
        
      case ConflictType.DUPLICATE_REGISTRATION:
        // Be cautious with duplicates
        if (context.existingRegistration.metadata.essential) {
          return {
            action: 'skip',
            reason: 'Essential command detected - refusing to replace for safety',
            metadata: { conflictType: context.conflictType, essential: true }
          };
        }
        return {
          action: 'replace',
          reason: 'Duplicate non-essential registration - replacing',
          metadata: { conflictType: context.conflictType, replaced: true }
        };
        
      default:
        return {
          action: 'error',
          reason: 'Force replace not applicable for this conflict type',
          metadata: { conflictType: context.conflictType }
        };
    }
  }

  /**
   * Error on conflict strategy - throw errors for conflicts
   */
  private overwriteStrategy(context: ConflictContext): ConflictResolutionResult {
    const errorReasons = {
      [ConflictType.HOT_RELOAD]: 'Hot-reload conflict detected',
      [ConflictType.DUPLICATE_REGISTRATION]: 'Duplicate command registration attempted',
      [ConflictType.SESSION_CONFLICT]: 'Session conflict detected',
      [ConflictType.PERMISSION_CONFLICT]: 'Permission conflict detected',
      [ConflictType.UNKNOWN]: 'Unknown conflict type detected'
    };
    
    return {
      action: 'error',
      reason: errorReasons[context.conflictType] || 'Command registration conflict',
      metadata: { 
        conflictType: context.conflictType,
        existingCommand: context.existingRegistration.commandId,
        attemptNumber: context.attemptNumber
      }
    };
  }

  /**
   * Smart merge strategy - intelligent conflict resolution
   */
  private skipConflictsStrategy(context: ConflictContext): ConflictResolutionResult {
    // Analyze both registrations to make intelligent decisions
    const existing = context.existingRegistration;
    const isEssential = existing.metadata.essential;
    const isOldRegistration = context.sessionAge > 30000; // 30 seconds
    const maxAttempts = this.config.registration?.maxRegistrationAttempts || 3;
    
    // Hot-reload scenarios
    if (context.conflictType === ConflictType.HOT_RELOAD) {
      if (isOldRegistration) {
        return {
          action: 'replace',
          reason: 'Hot-reload with stale registration - replacing',
          metadata: { conflictType: context.conflictType, stale: true }
        };
      } else {
        return {
          action: 'skip',
          reason: 'Recent hot-reload - skipping to avoid rapid changes',
          metadata: { conflictType: context.conflictType, recent: true }
        };
      }
    }
    
    // Essential commands
    if (isEssential) {
      return {
        action: 'skip',
        reason: 'Essential command detected - preserving existing registration',
        metadata: { conflictType: context.conflictType, essential: true }
      };
    }
    
    // Retry logic for transient issues
    if (context.attemptNumber < maxAttempts && this.isTransientConflict(context)) {
      const retryDelay = this.calculateRetryDelay(context.attemptNumber);
      return {
        action: 'retry',
        reason: `Transient conflict detected - retry ${context.attemptNumber + 1}/${maxAttempts}`,
        retryDelay,
        metadata: { 
          conflictType: context.conflictType, 
          attempt: context.attemptNumber + 1,
          maxAttempts 
        }
      };
    }
    
    // Default to graceful skip for safety
    return {
      action: 'skip',
      reason: 'Smart merge analysis suggests skipping for safety',
      metadata: { 
        conflictType: context.conflictType,
        analysis: 'default_safe_skip'
      }
    };
  }

  /**
   * Check if this appears to be a hot-reload scenario
   */
  private isHotReloadScenario(existing: CommandRegistration, sessionAge: number): boolean {
    // Hot-reload indicators:
    // 1. Recent registration (< 10 seconds)
    // 2. Error message contains hot-reload indicators
    // 3. Development environment indicators
    
    const isRecent = sessionAge < 10000;
    const hasHotReloadError = existing.lastError && this.containsHotReloadIndicators(existing.lastError);
    const isDevelopmentMode = process.env.NODE_ENV === 'development' || 
                             process.env.VSCODE_DEBUGGING === 'true';
    
    return isRecent || hasHotReloadError || isDevelopmentMode;
  }

  /**
   * Check if this is a duplicate registration of the same handler
   */
  private isDuplicateRegistration(
    existing: CommandRegistration, 
    newHandler: (...args: any[]) => any
  ): boolean {
    // Compare function signatures and names if possible
    return existing.handler === newHandler || 
           existing.handler.toString() === newHandler.toString();
  }

  /**
   * Check if this is a session conflict
   */
  private isSessionConflict(existing: CommandRegistration): boolean {
    // Session conflicts occur when registrations from different sessions interfere
    // This is more complex to detect and might require session tracking
    return false; // Simplified for now
  }

  /**
   * Check if this is a permission-related conflict
   */
  private isPermissionConflict(existing: CommandRegistration): boolean {
    // Permission conflicts occur when there are insufficient permissions
    // This would typically manifest in the error message
    return existing.lastError?.toLowerCase().includes('permission') || false;
  }

  /**
   * Check if error message contains hot-reload indicators
   */
  private containsHotReloadIndicators(errorMessage: string): boolean {
    const indicators = [
      'already exists',
      'command already registered',
      'duplicate command',
      'command is already registered',
      'hot reload',
      'extension development'
    ];
    
    const lowerMessage = errorMessage.toLowerCase();
    return indicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Check if this is a transient conflict that might resolve with retry
   */
  private isTransientConflict(context: ConflictContext): boolean {
    // Transient conflicts are those that might resolve themselves
    // Examples: timing issues, temporary resource locks, etc.
    
    const transientIndicators = [
      ConflictType.PERMISSION_CONFLICT, // Might resolve if permissions change
      ConflictType.UNKNOWN // Unknown conflicts might be transient
    ];
    
    return transientIndicators.includes(context.conflictType);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attemptNumber: number): number {
    const baseDelay = this.config.registration?.registrationRetryDelay || 1000;
    const maxDelay = this.config.hotReload?.conflictResolutionTimeout || 5000;
    
    // Exponential backoff: baseDelay * 2^(attemptNumber - 1)
    const delay = baseDelay * Math.pow(2, attemptNumber - 1);
    
    // Cap at maximum delay
    return Math.min(delay, maxDelay);
  }

  /**
   * Get conflict resolution statistics
   */
  getResolutionStats(): {
    strategy: string;
    conflictTypesHandled: ConflictType[];
    configuration: {
      enableHotReloadHandling: boolean;
      enableConflictResolution: boolean;
      conflictResolutionStrategy: string;
      conflictResolutionTimeout: number;
    };
  } {
    return {
      strategy: this.config.hotReload?.conflictResolutionStrategy || 'graceful-skip',
      conflictTypesHandled: Object.values(ConflictType),
      configuration: {
        enableHotReloadHandling: this.config.hotReload?.enableHotReloadHandling || false,
        enableConflictResolution: this.config.hotReload?.enableConflictResolution || false,
        conflictResolutionStrategy: this.config.hotReload?.conflictResolutionStrategy || 'graceful-skip',
        conflictResolutionTimeout: this.config.hotReload?.conflictResolutionTimeout || 5000
      }
    };
  }
}
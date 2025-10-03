/**
---
date: 2025-09-12T174343Z
name: CLI Navigation Exit Handler
TASK-ID: [TASK-MCP-006]
category: navigation-system
status: ["[T]"]
patterns: [graceful-exit, double-confirmation, session-cleanup]
components: [ExitHandler, ConfirmationDialog, SessionCleanup]
dependencies: [terminal-ui-components, session-management]
tags: [cli, navigation, exit-behavior, user-safety]
---
 * 
 * ExitHandler - Graceful Exit and Confirmation System
 * 
 * Provides double-confirmation exit behavior, session cleanup,
 * and graceful shutdown procedures. Implements the enhanced exit
 * behavior specified in the navigation system requirements.
 * 
 * Generated: 2025-09-12T174343Z
 * TASK-ID: TASK-MCP-006 Pattern: graceful-exit | Complexity: 4 | Dependencies: terminal-ui,session-management
 * Context: Double-confirmation exit behavior with session cleanup and graceful shutdown
 * Validation-Required: signal-handling, cleanup-verification, user-experience
 * Pattern-Info: { approach: "double-confirmation", alternatives: "immediate-exit", trade-offs: "safety-convenience" }
 */

import { EventEmitter } from 'events';
import * as readline from 'readline';
import { TerminalColorTheme, DefaultColorThemes, InteractivePrompt } from '../terminal-ui-components';

type FatalEventType = 'uncaughtException' | 'unhandledRejection';

/**
 * Utility type to convert event function signatures to parameter arrays for EventEmitter compatibility
 * This ensures TypeScript compatibility while maintaining type safety
 */
type EventMap<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => void ? P : never;
};

type TypedEventEmitter<T> = {
  emit<K extends keyof T>(event: K, ...args: EventMap<T>[K]): boolean;
  on<K extends keyof T>(event: K, listener: T[K]): TypedEventEmitter<T>;
  off<K extends keyof T>(event: K, listener: T[K]): TypedEventEmitter<T>;
  once<K extends keyof T>(event: K, listener: T[K]): TypedEventEmitter<T>;
} & EventEmitter;

// TODO: [TASK-ID-008] Pattern: graceful-exit | Complexity: 3 | Dependencies: signal-handling
// Context: Comprehensive signal handling for graceful shutdown in all scenarios
// Validation-Required: signal-compatibility, cleanup-reliability, error-recovery
// Pattern-Info: { approach: "multi-signal-handling", alternatives: "basic-sigint", trade-offs: "complexity-robustness" }

/**
 * Exit confirmation configuration
 */
export interface ExitConfirmationConfig {
  requireConfirmation: boolean;
  doubleConfirmation: boolean;
  confirmationTimeout: number; // milliseconds
  confirmationMessage: string;
  cancelMessage: string;
  theme: TerminalColorTheme;
  showUnsavedWarning: boolean;
}

/**
 * Exit context information
 */
export interface ExitContext {
  trigger: 'user-command' | 'keyboard-interrupt' | 'signal' | 'programmatic';
  hasUnsavedChanges: boolean;
  activeWindows: number;
  sessionDuration: number;
  cleanupRequired: string[];
  metadata?: Record<string, any>;
}

/**
 * Exit handler events
 */
export interface ExitHandlerEvents {
  'exitRequested': (context: ExitContext) => void;
  'confirmationStarted': (context: ExitContext) => void;
  'confirmationCompleted': (confirmed: boolean, context: ExitContext) => void;
  'exitCancelled': (reason: string, context: ExitContext) => void;
  'cleanupStarted': (items: string[]) => void;
  'cleanupCompleted': (success: boolean, errors?: string[]) => void;
  'gracefulExit': (code: number) => void;
  'forceExit': (code: number) => void;
}

/**
 * Cleanup task definition
 */
export interface CleanupTask {
  id: string;
  name: string;
  priority: number; // 1-10, 1 is highest priority
  timeout: number; // milliseconds
  executor: () => Promise<void>;
  required: boolean; // If true, exit fails if cleanup fails
}

/**
 * Session state information
 */
export interface SessionState {
  hasUnsavedChanges: boolean;
  activeConnections: string[];
  openResources: string[];
  runningTasks: string[];
  windowCount: number;
  sessionStartTime: number;
}

/**
 * Confirmation dialog for exit operations
 */
export class ExitConfirmationDialog {
  private prompt: InteractivePrompt;
  private config: ExitConfirmationConfig;

  constructor(config: ExitConfirmationConfig) {
    this.config = config;
    this.prompt = new InteractivePrompt({
      theme: config.theme,
      prefix: '?',
      suffix: ''
    });
  }

  /**
   * Show exit confirmation dialog
   */
  async showConfirmation(context: ExitContext): Promise<boolean> {
    if (!this.config.requireConfirmation) {
      return true;
    }

    try {
      // Show context-aware confirmation message
      const message = this.buildConfirmationMessage(context);
      
      if (this.config.doubleConfirmation) {
        return await this.showDoubleConfirmation(message, context);
      } else {
        return await this.showSingleConfirmation(message);
      }
    } catch (error) {
      console.error('Error during exit confirmation:', error);
      return false; // Fail safe - don't exit on error
    }
  }

  /**
   * Show single confirmation dialog
   */
  private async showSingleConfirmation(message: string): Promise<boolean> {
    const answer = await this.prompt.confirm(message, false);
    return answer;
  }

  /**
   * Show double confirmation dialog
   */
  private async showDoubleConfirmation(message: string, context: ExitContext): Promise<boolean> {
    // First confirmation
    const firstAnswer = await this.prompt.confirm(message, false);
    
    if (!firstAnswer) {
      return false;
    }

    // Brief pause for user to reconsider
    await this.sleep(1000);

    // Second confirmation with more specific message
    let secondMessage = 'Are you sure you want to exit?';
    
    if (context.hasUnsavedChanges) {
      secondMessage = 'You have unsaved changes. Really exit and lose changes?';
    } else if (context.activeWindows > 1) {
      secondMessage = `Really exit and close ${context.activeWindows} open windows?`;
    }

    const secondAnswer = await this.prompt.confirm(secondMessage, false);
    return secondAnswer;
  }

  /**
   * Build context-aware confirmation message
   */
  private buildConfirmationMessage(context: ExitContext): string {
    let message = this.config.confirmationMessage;
    
    const warnings: string[] = [];
    
    if (context.hasUnsavedChanges) {
      warnings.push('unsaved changes will be lost');
    }
    
    if (context.activeWindows > 1) {
      warnings.push(`${context.activeWindows} windows will be closed`);
    }
    
    if (context.cleanupRequired.length > 0) {
      warnings.push('active connections will be terminated');
    }
    
    if (warnings.length > 0) {
      message += ` (${warnings.join(', ')})`;
    }
    
    return message;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ExitConfirmationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.prompt = new InteractivePrompt({
      theme: this.config.theme,
      prefix: '?',
      suffix: ''
    });
  }
}

/**
 * Cleanup manager for graceful shutdown
 */
export class CleanupManager {
  private tasks: CleanupTask[] = [];
  private isRunning = false;

  /**
   * Register cleanup task
   */
  registerTask(task: CleanupTask): void {
    // Remove existing task with same ID
    this.tasks = this.tasks.filter(t => t.id !== task.id);
    
    // Add new task and sort by priority
    this.tasks.push(task);
    this.tasks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Unregister cleanup task
   */
  unregisterTask(taskId: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    return this.tasks.length < initialLength;
  }

  /**
   * Execute all cleanup tasks
   */
  async executeCleanup(): Promise<{ success: boolean; errors: string[] }> {
    if (this.isRunning) {
      return { success: false, errors: ['Cleanup already in progress'] };
    }

    this.isRunning = true;
    const errors: string[] = [];
    let success = true;

    try {
      for (const task of this.tasks) {
        try {
          // Execute task with timeout
          await this.executeTaskWithTimeout(task);
        } catch (error) {
          const errorMessage = `Cleanup task '${task.name}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          
          if (task.required) {
            success = false;
          }
        }
      }
    } finally {
      this.isRunning = false;
    }

    return { success, errors };
  }

  /**
   * Execute single task with timeout
   */
  private async executeTaskWithTimeout(task: CleanupTask): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Task '${task.name}' timed out after ${task.timeout}ms`));
      }, task.timeout);

      task.executor()
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Get registered tasks
   */
  getTasks(): CleanupTask[] {
    return [...this.tasks];
  }

  /**
   * Clear all tasks
   */
  clearTasks(): void {
    this.tasks = [];
  }
}

/**
 * Main exit handler implementation
 */
export class ExitHandler extends EventEmitter implements TypedEventEmitter<ExitHandlerEvents> {
  private static activeHandlers = new Set<ExitHandler>();
  private static processingFatalEvent = false;
  private static registered = false;
  private static readonly globalProcessListeners: Record<FatalEventType, (...args: any[]) => void> = {
    uncaughtException: (error: unknown) => {
      ExitHandler.dispatchFatalEvent('uncaughtException', error);
    },
    unhandledRejection: (reason: unknown, promise: Promise<unknown>) => {
      ExitHandler.dispatchFatalEvent('unhandledRejection', reason, promise);
    }
  };

  private confirmationDialog: ExitConfirmationDialog;
  private cleanupManager: CleanupManager;
  private config: ExitConfirmationConfig;
  private sessionState: SessionState;
  private signalHandlers: Map<string, () => void> = new Map();
  private exitInProgress = false;
  private forceExitTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<ExitConfirmationConfig> = {}) {
    super();

    this.config = {
      requireConfirmation: true,
      doubleConfirmation: true,
      confirmationTimeout: 30000,
      confirmationMessage: 'Do you really want to exit?',
      cancelMessage: 'Exit cancelled',
      theme: DefaultColorThemes.default,
      showUnsavedWarning: true,
      ...config
    };

    this.confirmationDialog = new ExitConfirmationDialog(this.config);
    this.cleanupManager = new CleanupManager();
    
    this.sessionState = {
      hasUnsavedChanges: false,
      activeConnections: [],
      openResources: [],
      runningTasks: [],
      windowCount: 0,
      sessionStartTime: Date.now()
    };

    this.setupSignalHandlers();
    this.registerDefaultCleanupTasks();
  }

  private static dispatchFatalEvent(type: FatalEventType, payload: unknown, promise?: Promise<unknown>): void {
    if (ExitHandler.processingFatalEvent) {
      return;
    }

    ExitHandler.processingFatalEvent = true;

    for (const handler of ExitHandler.activeHandlers) {
      handler.handleFatalEvent(type, payload, promise);
    }

    ExitHandler.processingFatalEvent = false;
  }

  private static registerProcessListeners(handler: ExitHandler): void {
    ExitHandler.activeHandlers.add(handler);

    if (ExitHandler.registered) {
      return;
    }

    process.on('uncaughtException', ExitHandler.globalProcessListeners.uncaughtException);
    process.on('unhandledRejection', ExitHandler.globalProcessListeners.unhandledRejection);
    ExitHandler.registered = true;
  }

  private static unregisterProcessListeners(handler: ExitHandler): void {
    ExitHandler.activeHandlers.delete(handler);

    if (ExitHandler.activeHandlers.size > 0 || !ExitHandler.registered) {
      return;
    }

    process.removeListener('uncaughtException', ExitHandler.globalProcessListeners.uncaughtException);
    process.removeListener('unhandledRejection', ExitHandler.globalProcessListeners.unhandledRejection);
    ExitHandler.registered = false;
  }

  /**
   * Handle exit request
   */
  async handleExit(trigger: ExitContext['trigger'] = 'programmatic', metadata?: Record<string, any>): Promise<boolean> {
    if (this.exitInProgress) {
      return false; // Exit already in progress
    }

    this.exitInProgress = true;

    try {
      const context = this.buildExitContext(trigger, metadata);
      this.emit('exitRequested', context);

      // Show confirmation dialog
      this.emit('confirmationStarted', context);
      const confirmed = await this.confirmationDialog.showConfirmation(context);
      this.emit('confirmationCompleted', confirmed, context);

      if (!confirmed) {
        this.emit('exitCancelled', 'User declined confirmation', context);
        this.exitInProgress = false;
        return false;
      }

      // Execute cleanup
      const cleanupItems = this.getCleanupItems();
      this.emit('cleanupStarted', cleanupItems);
      
      const cleanupResult = await this.cleanupManager.executeCleanup();
      this.emit('cleanupCompleted', cleanupResult.success, cleanupResult.errors);

      if (!cleanupResult.success && cleanupResult.errors.length > 0) {
        console.error('Cleanup warnings:');
        cleanupResult.errors.forEach(error => console.error(`  - ${error}`));
      }

      // Graceful exit
      this.emit('gracefulExit', 0);
      this.performExit(0);
      return true;

    } catch (error) {
      console.error('Error during exit process:', error);
      this.emit('forceExit', 1);
      this.performExit(1);
      return false;
    }
  }

  /**
   * Handle force exit (for emergencies or timeouts)
   */
  forceExit(code = 0, delay = 5000): void {
    console.log(`Force exit in ${delay / 1000} seconds...`);
    
    this.forceExitTimer = setTimeout(() => {
      this.emit('forceExit', code);
      this.performExit(code);
    }, delay);
  }

  /**
   * Cancel force exit
   */
  cancelForceExit(): boolean {
    if (this.forceExitTimer) {
      clearTimeout(this.forceExitTimer);
      this.forceExitTimer = null;
      return true;
    }
    return false;
  }

  /**
   * Update session state
   */
  updateSessionState(updates: Partial<SessionState>): void {
    this.sessionState = { ...this.sessionState, ...updates };
  }

  /**
   * Register cleanup task
   */
  registerCleanupTask(task: CleanupTask): void {
    this.cleanupManager.registerTask(task);
  }

  /**
   * Unregister cleanup task
   */
  unregisterCleanupTask(taskId: string): boolean {
    return this.cleanupManager.unregisterTask(taskId);
  }

  /**
   * Build exit context from current state
   */
  private buildExitContext(trigger: ExitContext['trigger'], metadata?: Record<string, any>): ExitContext {
    return {
      trigger,
      hasUnsavedChanges: this.sessionState.hasUnsavedChanges,
      activeWindows: this.sessionState.windowCount,
      sessionDuration: Date.now() - this.sessionState.sessionStartTime,
      cleanupRequired: this.getCleanupItems(),
      metadata
    };
  }

  /**
   * Get cleanup items that need attention
   */
  private getCleanupItems(): string[] {
    const items: string[] = [];
    
    items.push(...this.sessionState.activeConnections.map(conn => `Connection: ${conn}`));
    items.push(...this.sessionState.openResources.map(res => `Resource: ${res}`));
    items.push(...this.sessionState.runningTasks.map(task => `Task: ${task}`));
    
    return items;
  }

  private handleFatalEvent(type: FatalEventType, payload: unknown, promise?: Promise<unknown>): void {
    if (type === 'uncaughtException') {
      console.error('Uncaught exception:', payload);
    } else {
      console.error('Unhandled promise rejection at:', promise, 'reason:', payload);
    }

    this.forceExit(1, 1000);
  }

  /**
   * Setup signal handlers
   */
  private setupSignalHandlers(): void {
    // SIGINT (Ctrl+C)
    const sigintHandler = () => {
      this.handleExit('keyboard-interrupt');
    };
    
    // SIGTERM (graceful shutdown)
    const sigtermHandler = () => {
      this.handleExit('signal', { signal: 'SIGTERM' });
    };

    // SIGHUP (terminal closed)
    const sighupHandler = () => {
      this.handleExit('signal', { signal: 'SIGHUP' });
    };

    process.on('SIGINT', sigintHandler);
    process.on('SIGTERM', sigtermHandler);
    process.on('SIGHUP', sighupHandler);

    // Store handlers for cleanup
    this.signalHandlers.set('SIGINT', sigintHandler);
    this.signalHandlers.set('SIGTERM', sigtermHandler);
    this.signalHandlers.set('SIGHUP', sighupHandler);

    ExitHandler.registerProcessListeners(this);
  }

  /**
   * Register default cleanup tasks
   */
  private registerDefaultCleanupTasks(): void {
    // Readline interface cleanup
    this.registerCleanupTask({
      id: 'readline-cleanup',
      name: 'Readline Interface Cleanup',
      priority: 1,
      timeout: 2000,
      required: false,
      executor: async () => {
        // Close any open readline interfaces
        // This would be handled by the CLI adapter cleanup
      }
    });

    // Terminal state restoration
    this.registerCleanupTask({
      id: 'terminal-restore',
      name: 'Terminal State Restoration',
      priority: 2,
      timeout: 1000,
      required: false,
      executor: async () => {
        // Restore terminal to normal mode
        if (process.stdin.setRawMode) {
          process.stdin.setRawMode(false);
        }
        
        // Show cursor
        process.stdout.write('\x1b[?25h');
        
        // Reset colors
        process.stdout.write('\x1b[0m');
      }
    });

    // Session data save
    this.registerCleanupTask({
      id: 'session-save',
      name: 'Session Data Save',
      priority: 3,
      timeout: 5000,
      required: false,
      executor: async () => {
        // Save session state if needed
        // This would be handled by session context
      }
    });
  }

  /**
   * Perform actual exit
   */
  private performExit(code: number): void {
    // Clear any pending timers
    if (this.forceExitTimer) {
      clearTimeout(this.forceExitTimer);
    }

    // Remove signal handlers
    this.signalHandlers.forEach((handler, signal) => {
      process.removeListener(signal as any, handler);
    });

    ExitHandler.unregisterProcessListeners(this);

    // Avoid terminating the process when running under automated tests
    if (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test') {
      return;
    }

    process.exit(code);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ExitConfirmationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.confirmationDialog.updateConfig(this.config);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.removeAllListeners();
    
    // Remove signal handlers
    this.signalHandlers.forEach((handler, signal) => {
      process.removeListener(signal as any, handler);
    });

    ExitHandler.unregisterProcessListeners(this);
    this.signalHandlers.clear();
    this.cleanupManager.clearTasks();
    
    if (this.forceExitTimer) {
      clearTimeout(this.forceExitTimer);
      this.forceExitTimer = null;
    }
  }
}

// TODO: [TASK-ID-009] Pattern: session-integration | Complexity: 3 | Dependencies: session-context
// Context: Integration with session management for state-aware exit handling
// Validation-Required: session-consistency, state-preservation, recovery-scenarios
// Pattern-Info: { approach: "session-aware-exit", alternatives: "stateless-exit", trade-offs: "complexity-functionality" }

/**
 * Session-aware exit handler that integrates with session context
 */
export class SessionAwareExitHandler extends ExitHandler {
  private sessionContextRef: any; // Reference to session context

  constructor(
    sessionContext: any,
    config: Partial<ExitConfirmationConfig> = {}
  ) {
    super(config);
    this.sessionContextRef = sessionContext;
    this.setupSessionIntegration();
  }

  /**
   * Setup integration with session context
   */
  private setupSessionIntegration(): void {
    if (!this.sessionContextRef) {
      return;
    }

    // Register session cleanup task
    this.registerCleanupTask({
      id: 'session-context-cleanup',
      name: 'Session Context Cleanup',
      priority: 1,
      timeout: 5000,
      required: true,
      executor: async () => {
        await this.sessionContextRef.cleanup?.();
      }
    });

    // Listen for session state changes
    if (this.sessionContextRef.on) {
      this.sessionContextRef.on('stateChanged', (state: any) => {
        this.updateSessionState({
          hasUnsavedChanges: state.hasUnsavedChanges || false,
          activeConnections: state.activeConnections || [],
          openResources: state.openResources || [],
          runningTasks: state.runningTasks || [],
          windowCount: state.windowCount || 0
        });
      });
    }
  }

  /**
   * Handle session-aware exit
   */
  async handleSessionExit(): Promise<boolean> {
    // Update session state before exit
    if (this.sessionContextRef?.getSessionInfo) {
      const sessionInfo = this.sessionContextRef.getSessionInfo();
      this.updateSessionState({
        hasUnsavedChanges: sessionInfo.hasUnsavedChanges || false,
        activeConnections: sessionInfo.activeConnections || [],
        windowCount: sessionInfo.windowCount || 0
      });
    }

    return this.handleExit('user-command');
  }
}

/**
 * Factory function for creating exit handler
 */
export function createExitHandler(config?: Partial<ExitConfirmationConfig>): ExitHandler {
  return new ExitHandler(config);
}

/**
 * Factory function for creating session-aware exit handler
 */
export function createSessionAwareExitHandler(
  sessionContext: any,
  config?: Partial<ExitConfirmationConfig>
): SessionAwareExitHandler {
  return new SessionAwareExitHandler(sessionContext, config);
}

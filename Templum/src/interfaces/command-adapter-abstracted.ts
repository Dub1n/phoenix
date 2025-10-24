/**---
 * title: [Command Interface Adapter - Abstraction Layer Implementation]
 * tags: [Interface, Adapter, Command, Abstraction]
 * provides: [CommandInterfaceAdapter, Abstracted Command Execution]
 * requires: [ITemplumOrchestrator, Command Framework, Universal Types]
 * description: [Abstracted command interface adapter that depends on ITemplumOrchestrator interface, not concrete implementations]
 * ---*/

import {
  ErrorSignalPayload,
  createTemplumError,
  isTemplumError,
  InterfaceType,
  CommandContext,
  CommandResult,
  UniversalSkinDefinition,
  StateUpdate,
  InterfaceAdapterStatus,
} from '../types/templum-types';
import { ITemplumOrchestrator, IInterfaceAdapter } from './templum-orchestrator-interface';
import { TypeGuards } from '../utils/type-guards';
import { createLogger, LogLevel } from '../utils/logger';
import {
  EventUtils,
  ScopedEventBus,
  SubscriptionOptions,
  TypedEventMap,
  UnsubscribeFn
} from '../utils/event-utils';

/**
 * Command Input Types (Interface-specific)
 */
export interface CommandInput {
  type: 'direct_command' | 'batch_command' | 'scripted_command';
  command: string;
  args?: any[];
  context?: CommandInputContext;
  source?: 'api' | 'script' | 'batch' | 'programmatic';
}

export interface CommandInputContext {
  sessionId?: string;
  executionMode?: 'synchronous' | 'asynchronous' | 'background';
  timeout?: number;
  retryPolicy?: CommandRetryPolicy;
  metadata?: Record<string, any>;
}

export interface CommandRetryPolicy {
  maxRetries: number;
  retryInterval: number;
  backoffStrategy: 'linear' | 'exponential';
}

export interface CommandExecutionResult extends CommandResult {
  handled: boolean;
  executionTime?: number;
  errors?: string[];
  metadata?: Record<string, any>;
}

interface CommandMetricsEvent {
  timestamp: number;
  source: 'command';
  executionTime: number;
  success: boolean;
  command: string;
}

interface CommandInterfaceAdapterEvents extends TypedEventMap {
  error: (payload: ErrorSignalPayload) => void;
  stateUpdated: (state: StateUpdate) => void;
  'command-metrics': (metrics: CommandMetricsEvent) => void;
}

type CommandEventKey = Extract<keyof CommandInterfaceAdapterEvents, string>;
type CommandListener = (...args: any[]) => unknown;

/**
 * Abstracted Command Interface Adapter
 * 
 * This adapter uses the ITemplumOrchestrator abstraction instead of directly coupling
 * to concrete implementations. This provides proper separation of concerns and enables 
 * dependency inversion for programmatic command execution.
 */
export class CommandInterfaceAdapter implements IInterfaceAdapter {
  private static instanceCounter = 0;

  private readonly eventScope: string;
  private readonly events: ScopedEventBus<CommandInterfaceAdapterEvents>;
  private readonly listenerRegistry = new Map<CommandEventKey, Map<CommandListener, UnsubscribeFn>>();
  private orchestrator!: ITemplumOrchestrator;
  private config: CommandAdapterConfig;
  private executionQueue: CommandInput[] = [];
  private isProcessingQueue: boolean = false;
  private executionHistory: CommandExecutionResult[] = [];
  private lastActivityTimestamp = Date.now();
  private readonly logger = createLogger('command-interface-adapter', { level: LogLevel.ERROR });

  constructor(config?: Partial<CommandAdapterConfig>) {
    this.eventScope = `command-interface-adapter:${CommandInterfaceAdapter.instanceCounter++}`;
    this.events = EventUtils.createScopedBus<CommandInterfaceAdapterEvents>(this.eventScope, 50);

    this.config = {
      enableBatchExecution: true,
      enableAsynchronousExecution: true,
      enableExecutionHistory: true,
      maxQueueSize: 100,
      maxHistorySize: 500,
      defaultTimeout: 30000,
      enableMetrics: true,
      ...config
    };
  }

  emit<K extends CommandEventKey>(event: K, ...args: Parameters<CommandInterfaceAdapterEvents[K]>): boolean {
    return this.events.emit(event, ...args);
  }

  on<K extends CommandEventKey>(event: K, listener: CommandInterfaceAdapterEvents[K]): this {
    this.registerListener(event, listener);
    return this;
  }

  addListener<K extends CommandEventKey>(event: K, listener: CommandInterfaceAdapterEvents[K]): this {
    return this.on(event, listener);
  }

  once<K extends CommandEventKey>(event: K, listener: CommandInterfaceAdapterEvents[K]): this {
    this.registerListener(event, listener, { once: true });
    return this;
  }

  off<K extends CommandEventKey>(event: K, listener: CommandInterfaceAdapterEvents[K]): this {
    this.unregisterListener(event, listener);
    return this;
  }

  removeListener<K extends CommandEventKey>(event: K, listener: CommandInterfaceAdapterEvents[K]): this {
    return this.off(event, listener);
  }

  removeAllListeners(event?: CommandEventKey): this {
    if (event) {
      this.flushListeners(event);
    } else {
      for (const eventName of Array.from(this.listenerRegistry.keys())) {
        this.flushListeners(eventName);
      }
      this.events.cleanup();
    }
    return this;
  }

  listenerCount(event: CommandEventKey): number {
    return this.events.getListenerCount(event);
  }

  eventNames(): CommandEventKey[] {
    return this.events.getEventNames();
  }

  private registerListener<K extends CommandEventKey>(
    event: K,
    listener: CommandInterfaceAdapterEvents[K],
    options?: SubscriptionOptions
  ): void {
    const unsubscribe = EventUtils.subscribe(this.events.emitter, event, listener, {
      context: this.eventScope,
      ...options
    });

    if (!this.listenerRegistry.has(event)) {
      this.listenerRegistry.set(event, new Map());
    }

    this.listenerRegistry.get(event)!.set(listener as unknown as CommandListener, unsubscribe);
  }

  private unregisterListener<K extends CommandEventKey>(
    event: K,
    listener: CommandInterfaceAdapterEvents[K]
  ): void {
    const registry = this.listenerRegistry.get(event);
    const unsubscribe = registry?.get(listener as unknown as CommandListener);

    if (unsubscribe) {
      unsubscribe();
      registry!.delete(listener as unknown as CommandListener);
      if (registry!.size === 0) {
        this.listenerRegistry.delete(event);
      }
    } else {
      this.events.emitter.off(event, listener);
    }
  }

  private flushListeners(event: CommandEventKey): void {
    const registry = this.listenerRegistry.get(event);
    if (registry) {
      for (const unsubscribe of registry.values()) {
        unsubscribe();
      }
      registry.clear();
      this.listenerRegistry.delete(event);
    }
    this.events.emitter.removeAllListeners(event);
  }

  /**
   * Initialize with orchestrator abstraction
   */
  async initialize(orchestrator: ITemplumOrchestrator): Promise<void> {
    this.orchestrator = orchestrator;
    
    // Register this adapter with the orchestrator
    await this.orchestrator.registerInterface('command', this);
    
    // Initialize command execution components
    await this.initializeCommandComponents();
    
    this.logger.debug('CommandInterfaceAdapter: Initialized with orchestrator abstraction');
  }

  getInterfaceType(): InterfaceType {
    return 'command';
  }

  supportsSkin(_skinDefinition: UniversalSkinDefinition): boolean {
    // Command interface supports all skins as it's programmatic
    return true;
  }

  /**
   * Apply skin configuration (command interface specific handling)
   */
  async applySkin(_skinDefinition: UniversalSkinDefinition): Promise<void> {
    try {
      this.logger.debug('CommandInterfaceAdapter: Applying skin');
      
      // Command interface skin application primarily affects execution behavior
      // Command interface typically uses default skin behavior without special configuration
      this.logger.debug('CommandInterfaceAdapter: Command interface uses default skin rendering');
      
      this.logger.debug('CommandInterfaceAdapter: Skin applied successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('CommandInterfaceAdapter: Skin application failed', undefined, { errorMessage });
      
      this.emit('error', {
        timestamp: Date.now(),
        source: 'command',
        error: createTemplumError(`Skin application failed: ${errorMessage}`, 'SKIN_APPLICATION_FAILED', 'runtime'),
        severity: 'medium' as const
      } as ErrorSignalPayload);
    }
  }

  /**
   * Sync state update from orchestrator
   */
  async syncState(stateUpdate: StateUpdate): Promise<void> {
    try {
      this.validateStateUpdate(stateUpdate);
      this.logger.debug('CommandInterfaceAdapter: Received state update', {
        timestamp: new Date(stateUpdate.timestamp).toISOString(),
        includesSessionState: Boolean(stateUpdate.sessionState),
        includesGlobalState: Boolean(stateUpdate.globalState)
      });
      
      // Command interface state synchronization affects execution context
      if (stateUpdate.sessionState) {
        // Update execution context based on session state changes
        this.logger.debug('CommandInterfaceAdapter: Session state synchronized for command execution');
      }
      
      // Handle global state updates that might affect command routing
      if (stateUpdate.globalState) {
        this.logger.debug('CommandInterfaceAdapter: Global state synchronized for command routing');
      }

      this.emit('stateUpdated', stateUpdate);
      
    } catch (error) {
      const templumError = isTemplumError(error)
        ? error
        : createTemplumError(
            `State synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'STATE_SYNC_FAILED',
            'runtime'
          );

      this.logger.error('CommandInterfaceAdapter: State sync failed', undefined, {
        errorMessage: templumError.message
      });

      this.emit('error', {
        timestamp: Date.now(),
        source: 'command',
        error: templumError,
        severity: 'medium' as const
      } as ErrorSignalPayload);

      throw templumError;
    }
  }

  /**
   * Execute command through orchestrator abstraction
   */
  async executeCommand(input: CommandInput): Promise<CommandExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Validate command input
      if (!TypeGuards.isNonEmptyString(input.command)) {
        throw createTemplumError('Command cannot be empty', 'INVALID_INPUT', 'validation');
      }
      
      const sanitizedArgs = Array.isArray(input.args) ? input.args : [];

      const metadata = TypeGuards.isPlainObject(input.context?.metadata)
        ? (input.context!.metadata as Record<string, unknown>)
        : undefined;

      const retryPolicy = this.normalizeRetryPolicy(input.context?.retryPolicy);

      const context: CommandContext = {
        sessionId: TypeGuards.isNonEmptyString(input.context?.sessionId)
          ? input.context!.sessionId
          : this.generateSessionId(),
        originalInput: input.command,
        executionMode: input.context?.executionMode || 'synchronous',
        retryPolicy,
        metadata,
        source: input.source || 'programmatic',
      };
      
      // Execute through orchestrator abstraction (not direct coupling)
      const result = await this.orchestrator.executeCommand(
        input.command,
        'command',
        sanitizedArgs,
        context
      );
      
      const executionTime = Date.now() - startTime;
      this.lastActivityTimestamp = Date.now();

      const executionResult: CommandExecutionResult = {
        handled: true,
        success: result.success,
        message: result.message,
        data: result.data,
        error: result.error,
        source: result.source || 'command',
        timestamp: result.timestamp || Date.now(),
        executionTime,
        context: result.context || context,
        metadata: {
          inputType: input.type,
          source: input.source || 'programmatic',
          executionMode: input.context?.executionMode || 'synchronous',
          queueDepth: this.executionQueue.length,
        },
      };
      
      // Add to history if enabled
      if (this.config.enableExecutionHistory) {
        this.addToHistory(executionResult);
      }
      
      // Emit metrics if enabled
      if (this.config.enableMetrics) {
        // Simplified metrics emission for command interface
        this.emit('command-metrics', {
          timestamp: Date.now(),
          source: 'command',
          executionTime,
          success: result.success,
          command: input.command
        });
      }
      
      return executionResult;
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : error instanceof Error ? error.message : 'Unknown error';
      const executionTime = Date.now() - startTime;
      
      this.logger.error('CommandInterfaceAdapter: Command execution failed', undefined, { errorMessage });
      this.lastActivityTimestamp = Date.now();
      
      const executionResult: CommandExecutionResult = {
        handled: false,
        success: false,
        executionTime: executionTime,
        errors: [errorMessage],
        error: errorMessage,
        metadata: {
          inputType: input.type,
          source: input.source || 'programmatic',
          failed: true,
          queueDepth: this.executionQueue.length,
        }
      };

      this.emit('error', {
        timestamp: Date.now(),
        source: 'command',
        error: createTemplumError(`Command execution failed: ${errorMessage}`, 'COMMAND_EXECUTION_FAILED', 'runtime', { command: input.command }),
        severity: 'high' as const
      } as ErrorSignalPayload);
      
      return executionResult;
    }
  }

  private validateStateUpdate(stateUpdate: StateUpdate): void {
    if (!stateUpdate) {
      throw createTemplumError('State synchronization failed: state update is undefined', 'STATE_SYNC_FAILED', 'runtime');
    }

    if (typeof stateUpdate.timestamp !== 'number' || Number.isNaN(stateUpdate.timestamp)) {
      throw createTemplumError('State synchronization failed: invalid timestamp', 'STATE_SYNC_FAILED', 'runtime');
    }
  }

  /**
   * Execute batch of commands
   */
  async executeBatch(commands: CommandInput[]): Promise<CommandExecutionResult[]> {
    if (!this.config.enableBatchExecution) {
      throw createTemplumError('Batch execution is disabled', 'FEATURE_DISABLED', 'configuration');
    }
    
    const results: CommandExecutionResult[] = [];
    
    for (const command of commands) {
      try {
        const result = await this.executeCommand(command);
        results.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          handled: false,
          success: false,
          errors: [errorMessage],
          error: errorMessage,
          metadata: { command: command.command, batchExecution: true },
        });
      }
    }
    
    return results;
  }

  /**
   * Get adapter status
   */
  getStatus(): InterfaceAdapterStatus {
    const orchestratorConnected = Boolean(this.orchestrator?.isInitialized?.() ?? this.orchestrator);

    return {
      initialized: orchestratorConnected,
      connected: orchestratorConnected,
      active: orchestratorConnected || this.isProcessingQueue,
      lastActivity: this.lastActivityTimestamp,
      queueSize: this.executionQueue.length,
      healthy: this.isHealthy(),
      metrics: {
        totalCommands: this.executionHistory.length,
        queueSize: this.executionQueue.length,
        isProcessing: this.isProcessingQueue,
        averageExecutionTime: this.calculateAverageExecutionTime(),
      },
    };
  }

  /**
   * Dispose of adapter resources
   */
  async dispose(): Promise<void> {
    this.logger.debug('CommandInterfaceAdapter: Disposing resources');
    
    // Clear execution queue
    this.executionQueue = [];
    
    // Clear history if needed to free memory
    this.executionHistory = [];
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.logger.debug('CommandInterfaceAdapter: Disposed');
  }

  /**
   * Initialize command execution components
   * @private
   */
  private async initializeCommandComponents(): Promise<void> {
    // Initialize execution queue processing if batch execution is enabled
    if (this.config.enableBatchExecution) {
      this.logger.debug('CommandInterfaceAdapter: Batch execution enabled');
    }
    
    // Initialize execution history storage
    if (this.config.enableExecutionHistory) {
      this.logger.debug('CommandInterfaceAdapter: Execution history enabled');
    }
    
    this.logger.debug('CommandInterfaceAdapter: Command components initialized');
  }

  /**
   * Generate session ID for command execution
   * @private
   */
  private generateSessionId(): string {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeRetryPolicy(policy?: CommandRetryPolicy): CommandRetryPolicy | undefined {
    if (!policy || !TypeGuards.isNumber(policy.maxRetries) || !TypeGuards.isNumber(policy.retryInterval)) {
      return undefined;
    }

    const backoffStrategy = policy.backoffStrategy;
    const validStrategy = backoffStrategy === 'linear' || backoffStrategy === 'exponential';

    return {
      maxRetries: Math.max(0, Math.floor(policy.maxRetries)),
      retryInterval: Math.max(0, Math.floor(policy.retryInterval)),
      backoffStrategy: validStrategy ? backoffStrategy : 'linear',
    };
  }

  /**
   * Add execution result to history
   * @private
   */
  private addToHistory(result: CommandExecutionResult): void {
    this.executionHistory.push(result);
    
    // Trim history if it exceeds max size
    if (this.executionHistory.length > this.config.maxHistorySize) {
      this.executionHistory.shift(); // Remove oldest entry
    }
  }

  /**
   * Calculate average execution time from history
   * @private
   */
  private calculateAverageExecutionTime(): number {
    if (this.executionHistory.length === 0) return 0;
    
    const totalTime = this.executionHistory.reduce((sum, result) => {
      return sum + (result.executionTime || 0);
    }, 0);
    
    return totalTime / this.executionHistory.length;
  }

  /**
   * Check if adapter is healthy
   * @private
   */
  private isHealthy(): boolean {
    return this.orchestrator !== undefined && 
           this.executionQueue.length < this.config.maxQueueSize;
  }
}

/**
 * Command Adapter Configuration
 */
export interface CommandAdapterConfig {
  enableBatchExecution: boolean;
  enableAsynchronousExecution: boolean;
  enableExecutionHistory: boolean;
  maxQueueSize: number;
  maxHistorySize: number;
  defaultTimeout: number;
  enableMetrics: boolean;
}

/**
 * Factory function for creating command interface adapter
 * 
 * This provides a clean creation pattern that doesn't require direct imports
 * of the concrete adapter class in other parts of the system.
 */
export function createCommandInterfaceAdapter(config?: Partial<CommandAdapterConfig>): IInterfaceAdapter {
  return new CommandInterfaceAdapter(config);
}

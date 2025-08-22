/**
 * Universal Command Registry
 * 
 * Extended from Phoenix Code Lite for multi-backend command routing.
 * Maintains session context integration and adds cross-interface command execution.
 * 
 * Performance Target: <50ms command routing (Phase 2 baseline)
 * Dependencies: SessionContextFoundation for command context tracking
 * 
 * Generated: 2025-08-21
 */

import { EventEmitter } from 'events';
import { SessionContextFoundation, SessionContext } from '../session/session-context-foundation';

// Extended interfaces for multi-backend support
export interface UniversalCommandHandler extends CommandHandler {
  backendId?: string;
  interfaceSupport?: InterfaceType[];
  backendConfig?: BackendConfig;
}

export interface CommandHandler {
  id: string;
  name: string;
  description: string;
  handler: (context: UniversalCommandContext) => Promise<CommandResult>;
  permissions?: PermissionRequirement[];
  validation?: ValidationSchema;
  metadata?: CommandMetadata;
}

export interface UniversalCommandContext extends CommandContext {
  sessionContext: SessionContext;
  interfaceType: InterfaceType;
  backendId?: string;
  crossInterfaceCapable?: boolean;
}

export interface CommandContext {
  parameters: Record<string, any>;
  sessionId?: string;
  userId?: string;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  backend?: string;
  executionTime?: number;
  sessionId?: string;
  contextPreserved?: boolean;
}

export interface PermissionRequirement {
  type: 'read' | 'write' | 'execute' | 'admin';
  resource?: string;
  scope?: string;
}

export interface ValidationSchema {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  parameters?: Record<string, ValidationRule>;
}

export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
}

export interface CommandMetadata {
  category?: string;
  tags?: string[];
  version?: string;
  deprecated?: boolean;
  backend?: string;
}

export interface BackendConfig {
  id: string;
  name: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  healthCheckEndpoint?: string;
}

export interface AuditLogEntry {
  timestamp: Date;
  commandId: string;
  backendId?: string;
  interfaceType: InterfaceType;
  parameters: Record<string, any>;
  result: CommandResult;
  executionTime: number;
  sessionId?: string;
}

export interface BackendIntegration {
  id: string;
  name: string;
  isHealthy: boolean;
  lastHealthCheck: Date;
  commandCount: number;
  averageResponseTime: number;
}

export type InterfaceType = 'vscode' | 'cli' | 'command';

/**
 * Universal Command Registry with Multi-Backend Support
 * Extends PCL command registry for cross-backend and cross-interface operation
 */
export class UniversalCommandRegistry extends EventEmitter {
  private handlers = new Map<string, UniversalCommandHandler>();
  private backendRegistries = new Map<string, Map<string, UniversalCommandHandler>>();
  private interfaceAdapters = new Map<InterfaceType, any>();
  private auditLog: AuditLogEntry[] = [];
  private backendIntegrations = new Map<string, BackendIntegration>();
  private sessionContext: SessionContextFoundation;
  private maxAuditLogSize = 1000;
  private performanceMetrics = new Map<string, number>();

  constructor(sessionContext: SessionContextFoundation) {
    super();
    this.sessionContext = sessionContext;
    this.setupEventHandlers();
  }

  /**
   * Load backend commands from multiple backend services
   */
  async loadBackendCommands(backendIds: string[]): Promise<void> {
    const loadPromises = backendIds.map(backendId => this.loadBackendCommandsForService(backendId));
    await Promise.all(loadPromises);
    this.emit('backendsLoaded', backendIds);
  }

  /**
   * Load commands for a specific backend service
   */
  private async loadBackendCommandsForService(backendId: string): Promise<void> {
    if (!this.backendRegistries.has(backendId)) {
      this.backendRegistries.set(backendId, new Map());
    }

    const backendRegistry = this.backendRegistries.get(backendId)!;
    
    // Initialize backend integration tracking
    if (!this.backendIntegrations.has(backendId)) {
      this.backendIntegrations.set(backendId, {
        id: backendId,
        name: this.getBackendDisplayName(backendId),
        isHealthy: true,
        lastHealthCheck: new Date(),
        commandCount: 0,
        averageResponseTime: 0
      });
    }

    // Load backend-specific commands
    const commands = await this.discoverBackendCommands(backendId);
    
    for (const command of commands) {
      const backendCommand: UniversalCommandHandler = {
        ...command,
        backendId,
        interfaceSupport: (command as UniversalCommandHandler).interfaceSupport || ['cli', 'command'],
        backendConfig: this.getBackendConfig(backendId)
      };

      // Register in backend-specific registry
      backendRegistry.set(command.id, backendCommand);
      
      // Register in universal registry with backend prefix
      const universalId = `${backendId}.${command.id}`;
      this.handlers.set(universalId, backendCommand);
    }

    const backendIntegration = this.backendIntegrations.get(backendId)!;
    backendIntegration.commandCount = commands.length;
    backendIntegration.lastHealthCheck = new Date();

    this.emit('backendCommandsLoaded', backendId, commands.length);
  }

  /**
   * Execute command with multi-backend routing
   */
  async executeCommand(
    commandId: string,
    parameters: Record<string, any> = {},
    options: { interfaceType?: InterfaceType; sessionId?: string } = {}
  ): Promise<CommandResult> {
    const startTime = Date.now();
    const sessionId = options.sessionId || this.sessionContext.getActiveSession()?.sessionId;
    const interfaceType = options.interfaceType || 'cli';

    try {
      // Resolve command handler (with backend routing)
      const { handler, backendId } = await this.resolveCommandHandler(commandId);
      
      if (!handler) {
        throw new Error(`Command handler not found: ${commandId}`);
      }

      // Build universal command context
      const context = await this.buildUniversalContext(
        parameters,
        sessionId,
        interfaceType,
        backendId
      );

      // Validate command execution
      await this.validateCommand(handler, context);
      
      // Execute with backend routing
      const result = await this.executeWithBackendRouting(handler, context, backendId);
      
      const executionTime = Date.now() - startTime;
      
      // Enhanced result with backend and session information
      const enhancedResult: CommandResult = {
        ...result,
        backend: backendId,
        executionTime,
        sessionId,
        contextPreserved: true
      };

      // Record audit entry
      this.recordUniversalAuditEntry(commandId, context, enhancedResult, executionTime);
      
      // Update performance metrics
      this.updatePerformanceMetrics(commandId, backendId, executionTime);
      
      this.emit('commandExecuted', commandId, backendId, enhancedResult);
      
      return enhancedResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      const errorResult: CommandResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        sessionId
      };

      // Record failed execution
      const context = await this.buildUniversalContext(parameters, sessionId, interfaceType);
      this.recordUniversalAuditEntry(commandId, context, errorResult, executionTime);
      
      this.emit('commandFailed', commandId, errorResult);
      
      throw error;
    }
  }

  /**
   * Register interface adapter for cross-interface support
   */
  async registerInterfaceAdapter(interfaceType: InterfaceType, adapter: any): Promise<boolean> {
    if (!adapter.initialize || typeof adapter.initialize !== 'function') {
      throw new Error(`Interface adapter for ${interfaceType} must have initialize method`);
    }

    await adapter.initialize();
    this.interfaceAdapters.set(interfaceType, adapter);
    this.emit('interfaceAdapterRegistered', interfaceType);
    
    return true;
  }

  /**
   * Get registered interfaces
   */
  getRegisteredInterfaces(): InterfaceType[] {
    return Array.from(this.interfaceAdapters.keys());
  }

  /**
   * Check if session context is available
   */
  hasSessionContext(): boolean {
    return this.sessionContext.isInitialized();
  }

  /**
   * Get command handlers by backend
   */
  getHandlersByBackend(backendId: string): UniversalCommandHandler[] {
    const backendRegistry = this.backendRegistries.get(backendId);
    return backendRegistry ? Array.from(backendRegistry.values()) : [];
  }

  /**
   * Get backend integration status
   */
  getBackendIntegrations(): BackendIntegration[] {
    return Array.from(this.backendIntegrations.values());
  }

  /**
   * Get execution statistics with backend breakdown
   */
  getExecutionStats(): any {
    const totalExecutions = this.auditLog.length;
    const successfulExecutions = this.auditLog.filter(entry => entry.result.success).length;
    
    // Backend-specific statistics
    const backendStats: Record<string, any> = {};
    for (const backendId of this.backendRegistries.keys()) {
      const backendEntries = this.auditLog.filter(entry => entry.backendId === backendId);
      backendStats[backendId] = {
        totalExecutions: backendEntries.length,
        successfulExecutions: backendEntries.filter(entry => entry.result.success).length,
        averageExecutionTime: backendEntries.length > 0 
          ? backendEntries.reduce((sum, entry) => sum + entry.executionTime, 0) / backendEntries.length
          : 0
      };
    }

    return {
      universal: {
        totalExecutions,
        successfulExecutions,
        failedExecutions: totalExecutions - successfulExecutions,
        averageExecutionTime: totalExecutions > 0 
          ? this.auditLog.reduce((sum, entry) => sum + entry.executionTime, 0) / totalExecutions
          : 0
      },
      backends: backendStats,
      performance: Object.fromEntries(this.performanceMetrics)
    };
  }

  /**
   * Resolve command handler with backend routing
   */
  private async resolveCommandHandler(commandId: string): Promise<{
    handler: UniversalCommandHandler | null;
    backendId?: string;
  }> {
    // Check if command has backend prefix (e.g., "pcl.analyze")
    const parts = commandId.split('.');
    
    if (parts.length > 1) {
      const potentialBackendId = parts[0];
      const actualCommandId = parts.slice(1).join('.');
      
      const backendRegistry = this.backendRegistries.get(potentialBackendId);
      if (backendRegistry && backendRegistry.has(actualCommandId)) {
        return {
          handler: backendRegistry.get(actualCommandId)!,
          backendId: potentialBackendId
        };
      }
    }

    // Check universal registry
    const universalHandler = this.handlers.get(commandId);
    if (universalHandler) {
      return {
        handler: universalHandler,
        backendId: universalHandler.backendId
      };
    }

    return { handler: null };
  }

  /**
   * Build universal command context with session integration
   */
  private async buildUniversalContext(
    parameters: Record<string, any>,
    sessionId?: string,
    interfaceType: InterfaceType = 'cli',
    backendId?: string
  ): Promise<UniversalCommandContext> {
    let sessionContext: SessionContext | null = null;
    
    if (sessionId) {
      sessionContext = this.sessionContext.getSession(sessionId);
    } else {
      sessionContext = this.sessionContext.getActiveSession();
    }

    if (!sessionContext) {
      // Create temporary session context if none exists
      sessionContext = await this.sessionContext.createSession(
        undefined,
        interfaceType,
        { temporary: true }
      );
    }

    return {
      parameters,
      sessionId: sessionContext.sessionId,
      sessionContext,
      interfaceType,
      backendId,
      crossInterfaceCapable: this.interfaceAdapters.size > 1
    };
  }

  /**
   * Execute command with backend-specific routing
   */
  private async executeWithBackendRouting(
    handler: UniversalCommandHandler,
    context: UniversalCommandContext,
    backendId?: string
  ): Promise<CommandResult> {
    try {
      // Check if interface is supported
      if (handler.interfaceSupport && !handler.interfaceSupport.includes(context.interfaceType)) {
        throw new Error(`Command ${handler.id} not supported on ${context.interfaceType} interface`);
      }

      // Execute the command handler
      const result = await handler.handler(context);
      
      // Update backend metrics
      if (backendId) {
        this.updateBackendMetrics(backendId, true, Date.now());
      }

      return {
        ...result,
        success: result.success !== undefined ? result.success : true
      };

    } catch (error) {
      // Update backend metrics for failure
      if (backendId) {
        this.updateBackendMetrics(backendId, false, Date.now());
      }

      console.error(`Command execution error for ${handler.id}:`, error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Command execution failed'
      };
    }
  }

  /**
   * Validate command with enhanced security
   */
  private async validateCommand(
    handler: UniversalCommandHandler,
    context: UniversalCommandContext
  ): Promise<void> {
    // Validate permissions
    if (handler.permissions && handler.permissions.length > 0) {
      await this.validatePermissions(handler.permissions, context);
    }
    
    // Validate input using handler's validation schema
    if (handler.validation) {
      await this.validateInput(handler.validation, context);
    }

    // Validate session context if required
    if (!context.sessionContext && handler.metadata?.category !== 'system') {
      throw new Error('Valid session context required for this command');
    }
  }

  /**
   * Enhanced permission validation
   */
  private async validatePermissions(
    permissions: PermissionRequirement[],
    context: UniversalCommandContext
  ): Promise<void> {
    for (const permission of permissions) {
      if (!await this.checkPermission(permission, context)) {
        throw new Error(`Insufficient permissions: ${permission.type} access required`);
      }
    }
  }

  /**
   * Check individual permission with session context
   */
  private async checkPermission(
    permission: PermissionRequirement,
    context: UniversalCommandContext
  ): Promise<boolean> {
    switch (permission.type) {
      case 'read':
        return true; // Most operations allow read
      case 'write':
        return true; // Allow write operations
      case 'execute':
        return true; // Allow command execution
      case 'admin':
        // Check session context for admin privileges
        return context.sessionContext?.metadata?.capabilities?.includes('admin') || false;
      default:
        return true;
    }
  }

  /**
   * Enhanced input validation
   */
  private async validateInput(
    validation: ValidationSchema,
    context: UniversalCommandContext
  ): Promise<void> {
    const { parameters } = context;
    
    if (validation.required && (!parameters || Object.keys(parameters).length === 0)) {
      throw new Error('Parameters are required for this command');
    }
    
    if (validation.parameters) {
      for (const [key, rule] of Object.entries(validation.parameters)) {
        const value = parameters[key];
        
        if (rule.required && (value === undefined || value === null)) {
          throw new Error(`Parameter '${key}' is required`);
        }
        
        if (value !== undefined) {
          await this.validateParameterValue(key, value, rule);
        }
      }
    }
  }

  /**
   * Validate individual parameter value
   */
  private async validateParameterValue(key: string, value: any, rule: ValidationRule): Promise<void> {
    if (rule.type === 'string' && typeof value !== 'string') {
      throw new Error(`Parameter '${key}' must be a string`);
    }
    
    if (rule.type === 'number' && typeof value !== 'number') {
      throw new Error(`Parameter '${key}' must be a number`);
    }
    
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      throw new Error(`Parameter '${key}' does not match required pattern`);
    }
    
    if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
      throw new Error(`Parameter '${key}' must be at least ${rule.min}`);
    }
    
    if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
      throw new Error(`Parameter '${key}' must be at most ${rule.max}`);
    }
  }

  /**
   * Record universal audit entry with backend and interface information
   */
  private recordUniversalAuditEntry(
    commandId: string,
    context: UniversalCommandContext,
    result: CommandResult,
    executionTime: number
  ): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      commandId,
      backendId: context.backendId,
      interfaceType: context.interfaceType,
      parameters: context.parameters,
      result,
      executionTime,
      sessionId: context.sessionId
    };
    
    this.auditLog.push(entry);
    
    // Trim audit log if it exceeds max size
    if (this.auditLog.length > this.maxAuditLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxAuditLogSize);
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(commandId: string, backendId: string | undefined, executionTime: number): void {
    const key = backendId ? `${backendId}.${commandId}` : commandId;
    const existing = this.performanceMetrics.get(key) || 0;
    this.performanceMetrics.set(key, (existing + executionTime) / 2); // Simple moving average
    
    // Warn if performance exceeds baseline
    if (executionTime > 50) {
      console.warn(`Command execution time exceeded 50ms baseline: ${executionTime}ms for ${key}`);
    }
  }

  /**
   * Update backend integration metrics
   */
  private updateBackendMetrics(backendId: string, success: boolean, timestamp: number): void {
    const integration = this.backendIntegrations.get(backendId);
    if (integration) {
      integration.lastHealthCheck = new Date(timestamp);
      integration.isHealthy = success;
      // Update average response time logic could be added here
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('commandExecuted', (commandId, backendId, result) => {
      if (result.executionTime && result.executionTime > 50) {
        this.emit('performanceWarning', {
          commandId,
          backendId,
          executionTime: result.executionTime,
          threshold: 50
        });
      }
    });

    this.on('commandFailed', (commandId, result) => {
      console.warn(`Command failed: ${commandId} - ${result.message}`);
    });
  }

  // Backend discovery and configuration methods
  private async discoverBackendCommands(backendId: string): Promise<CommandHandler[]> {
    // Simulated backend command discovery - in real implementation,
    // this would query actual backend services
    switch (backendId) {
      case 'pcl':
        return this.getPCLCommands();
      case 'haruspex':
        return this.getHaruspexCommands();
      default:
        return [];
    }
  }

  private getPCLCommands(): CommandHandler[] {
    return [
      {
        id: 'analyze',
        name: 'Analyze Code',
        description: 'Analyze codebase for patterns and issues',
        handler: async (context) => ({ success: true, message: 'Analysis complete' })
      },
      {
        id: 'generate',
        name: 'Generate Code',
        description: 'Generate code based on templates',
        handler: async (context) => ({ success: true, message: 'Code generated' })
      },
      {
        id: 'status',
        name: 'Get Status',
        description: 'Get current PCL status',
        handler: async (context) => ({ 
          success: true, 
          message: 'PCL is operational',
          data: { version: '2.0.0', status: 'healthy' }
        })
      }
    ];
  }

  private getHaruspexCommands(): CommandHandler[] {
    return [
      {
        id: 'predict',
        name: 'Predict Outcomes',
        description: 'Predict analysis outcomes',
        handler: async (context) => ({ success: true, message: 'Prediction complete' })
      },
      {
        id: 'enhance',
        name: 'Enhance Analysis',
        description: 'Enhance existing analysis',
        handler: async (context) => ({ success: true, message: 'Analysis enhanced' })
      }
    ];
  }

  private getBackendDisplayName(backendId: string): string {
    const names: Record<string, string> = {
      'pcl': 'Phoenix Code Lite',
      'haruspex': 'Haruspex Analysis Engine',
      'templum': 'Templum Interface Engine'
    };
    return names[backendId] || backendId;
  }

  private getBackendConfig(backendId: string): BackendConfig {
    const configs: Record<string, BackendConfig> = {
      'pcl': {
        id: 'pcl',
        name: 'Phoenix Code Lite',
        timeout: 5000,
        retryAttempts: 2,
        healthCheckEndpoint: '/health'
      },
      'haruspex': {
        id: 'haruspex',
        name: 'Haruspex Analysis Engine',
        timeout: 10000,
        retryAttempts: 3,
        healthCheckEndpoint: '/status'
      }
    };
    
    return configs[backendId] || {
      id: backendId,
      name: backendId,
      timeout: 5000,
      retryAttempts: 2
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.handlers.clear();
    this.backendRegistries.clear();
    this.interfaceAdapters.clear();
    this.auditLog = [];
    this.backendIntegrations.clear();
    this.performanceMetrics.clear();
    this.removeAllListeners();
  }
}
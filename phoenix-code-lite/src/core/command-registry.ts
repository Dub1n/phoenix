/**
 * Command Registry Implementation
 * Created: 2025-01-06-175700
 * 
 * Unified command execution system with validation, permissions, and audit logging.
 * Handles all commands regardless of interaction mode.
 */

import { 
  CommandHandler, 
  CommandRegistry, 
  CommandContext, 
  CommandResult,
  PermissionRequirement,
  AuditLogEntry,
  ValidationContext
} from '../types/command-execution';

export class UnifiedCommandRegistry implements CommandRegistry {
  private handlers = new Map<string, CommandHandler>();
  private auditLog: AuditLogEntry[] = [];
  private maxAuditLogSize = 1000;

  /**
   * Register a command handler
   */
  register(handler: CommandHandler): void {
    if (!handler.id) {
      throw new Error('Command handler must have an id');
    }
    
    if (typeof handler.handler !== 'function') {
      throw new Error('Command handler must have a handler function');
    }
    
    this.handlers.set(handler.id, handler);
  }

  /**
   * Execute a command with full validation and audit logging
   */
  async execute(commandId: string, context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      const handler = this.handlers.get(commandId);
      if (!handler) {
        throw new Error(`Command handler not found: ${commandId}`);
      }

      // Validate permissions and input
      await this.validateCommand(handler, context);
      
      // Execute with error handling and audit logging
      const result = await this.executeWithLogging(handler, context);
      
      // Record successful execution
      this.recordAuditEntry(commandId, context, result, Date.now() - startTime);
      
      return result;
    } catch (error) {
      // Record failed execution
      const errorResult: CommandResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.recordAuditEntry(commandId, context, errorResult, Date.now() - startTime);
      
      throw error;
    }
  }

  /**
   * Get a specific command handler
   */
  getHandler(commandId: string): CommandHandler | null {
    return this.handlers.get(commandId) || null;
  }

  /**
   * List all registered handlers
   */
  listHandlers(): CommandHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Get command handlers by category
   */
  getHandlersByCategory(category: string): CommandHandler[] {
    return this.listHandlers().filter(handler => {
      // Assuming handlers have metadata.category
      const metadata = (handler as any).metadata;
      return metadata?.category === category;
    });
  }

  /**
   * Check if a command exists
   */
  hasCommand(commandId: string): boolean {
    return this.handlers.has(commandId);
  }

  /**
   * Unregister a command handler
   */
  unregister(commandId: string): boolean {
    return this.handlers.delete(commandId);
  }

  /**
   * Get recent audit log entries
   */
  getAuditLog(limit: number = 50): AuditLogEntry[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Get command execution statistics
   */
  getExecutionStats(): Record<string, any> {
    const stats = {
      totalExecutions: this.auditLog.length,
      successfulExecutions: this.auditLog.filter(entry => entry.result.success).length,
      failedExecutions: this.auditLog.filter(entry => !entry.result.success).length,
      averageExecutionTime: 0,
      commandFrequency: {} as Record<string, number>
    };
    
    if (this.auditLog.length > 0) {
      const totalTime = this.auditLog.reduce((sum, entry) => sum + entry.executionTime, 0);
      stats.averageExecutionTime = totalTime / this.auditLog.length;
      
      // Calculate command frequency
      for (const entry of this.auditLog) {
        stats.commandFrequency[entry.commandId] = (stats.commandFrequency[entry.commandId] || 0) + 1;
      }
    }
    
    return stats;
  }

  /**
   * Validate command permissions and input
   */
  private async validateCommand(handler: CommandHandler, context: CommandContext): Promise<void> {
    // Validate permissions
    if (handler.permissions && handler.permissions.length > 0) {
      await this.validatePermissions(handler.permissions, context);
    }
    
    // Validate input using handler's validation schema
    if (handler.validation) {
      await this.validateInput(handler.validation, context);
    }
  }

  /**
   * Validate user permissions
   */
  private async validatePermissions(
    permissions: PermissionRequirement[], 
    context: CommandContext
  ): Promise<void> {
    for (const permission of permissions) {
      if (!await this.checkPermission(permission, context)) {
        throw new Error(`Insufficient permissions: ${permission.type} access required`);
      }
    }
  }

  /**
   * Check individual permission
   */
  private async checkPermission(
    permission: PermissionRequirement, 
    context: CommandContext
  ): Promise<boolean> {
    // Basic permission checking - can be enhanced with proper RBAC
    switch (permission.type) {
      case 'read':
        return true; // Most operations allow read
      case 'write':
        return true; // For now, allow write operations
      case 'execute':
        return true; // Allow command execution
      case 'admin':
        // Check if running in admin mode or has admin privileges
        return context.sessionContext.debugMode || false;
      default:
        return true;
    }
  }

  /**
   * Validate input against schema
   */
  private async validateInput(
    validation: any, 
    context: CommandContext
  ): Promise<void> {
    const { parameters } = context;
    
    // Basic validation - can be enhanced with proper schema validation
    if (validation.required && (!parameters || Object.keys(parameters).length === 0)) {
      throw new Error('Parameters are required for this command');
    }
    
    if (validation.pattern && parameters.input) {
      if (!validation.pattern.test(parameters.input)) {
        throw new Error('Input does not match required pattern');
      }
    }
    
    if (validation.minLength && parameters.input && parameters.input.length < validation.minLength) {
      throw new Error(`Input must be at least ${validation.minLength} characters`);
    }
    
    if (validation.maxLength && parameters.input && parameters.input.length > validation.maxLength) {
      throw new Error(`Input must be no more than ${validation.maxLength} characters`);
    }
  }

  /**
   * Execute command with comprehensive error handling
   */
  private async executeWithLogging(
    handler: CommandHandler, 
    context: CommandContext
  ): Promise<CommandResult> {
    try {
      const result = await handler.handler(context);
      
      // Return result with defaults only if not already specified
      return {
        ...result,
        success: result.success !== undefined ? result.success : true
      };
    } catch (error) {
      // Log execution error
      console.error(`Command execution error for ${handler.id}:`, error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Command execution failed'
      };
    }
  }

  /**
   * Record audit log entry
   */
  private recordAuditEntry(
    commandId: string,
    context: CommandContext,
    result: CommandResult,
    executionTime: number
  ): void {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      commandId,
      parameters: context.parameters,
      result,
      executionTime,
      sessionId: (context.sessionContext as any).sessionId
    };
    
    this.auditLog.push(entry);
    
    // Trim audit log if it exceeds max size
    if (this.auditLog.length > this.maxAuditLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxAuditLogSize);
    }
  }

  /**
   * Clear all registrations (for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.auditLog = [];
  }
}
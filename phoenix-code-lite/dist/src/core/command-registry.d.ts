/**---
 * title: [Unified Command Registry - Core Service Module]
 * tags: [Core, Service, Command, Audit]
 * provides: [UnifiedCommandRegistry Class, Command Execution, Validation, Audit Logging, Statistics]
 * requires: [Types: command-execution]
 * description: [Centralized command execution and validation service with permission checks, input validation, audit trail, and execution statistics used by unified/interactive CLI layers.]
 * ---*/
import { CommandHandler, CommandRegistry, CommandContext, CommandResult, AuditLogEntry } from '../types/command-execution';
export declare class UnifiedCommandRegistry implements CommandRegistry {
    private handlers;
    private auditLog;
    private maxAuditLogSize;
    /**
     * Register a command handler
     */
    register(handler: CommandHandler): void;
    /**
     * Execute a command with full validation and audit logging
     */
    execute(commandId: string, context: CommandContext): Promise<CommandResult>;
    /**
     * Get a specific command handler
     */
    getHandler(commandId: string): CommandHandler | null;
    /**
     * List all registered handlers
     */
    listHandlers(): CommandHandler[];
    /**
     * Get command handlers by category
     */
    getHandlersByCategory(category: string): CommandHandler[];
    /**
     * Check if a command exists
     */
    hasCommand(commandId: string): boolean;
    /**
     * Unregister a command handler
     */
    unregister(commandId: string): boolean;
    /**
     * Get recent audit log entries
     */
    getAuditLog(limit?: number): AuditLogEntry[];
    /**
     * Clear audit log
     */
    clearAuditLog(): void;
    /**
     * Get command execution statistics
     */
    getExecutionStats(): Record<string, any>;
    /**
     * Validate command permissions and input
     */
    private validateCommand;
    /**
     * Validate user permissions
     */
    private validatePermissions;
    /**
     * Check individual permission
     */
    private checkPermission;
    /**
     * Validate input against schema
     */
    private validateInput;
    /**
     * Execute command with comprehensive error handling
     */
    private executeWithLogging;
    /**
     * Record audit log entry
     */
    private recordAuditEntry;
    /**
     * Clear all registrations (for testing)
     */
    clear(): void;
}
//# sourceMappingURL=command-registry.d.ts.map
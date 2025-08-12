/**
 * Command Registry Implementation
 * Created: 2025-01-06-175700
 *
 * Unified command execution system with validation, permissions, and audit logging.
 * Handles all commands regardless of interaction mode.
 */
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
/**
 * Command Execution Types
 * Created: 2025-01-06-175700
 *
 * Unified command execution independent of how command was triggered.
 * Provides consistent command handling across all interaction modes.
 */
import { MenuContext, ValidationSchema, SessionContext } from './menu-definitions';
import { InteractionMode } from './interaction-abstraction';
export interface CommandHandler {
    id: string;
    handler: (context: CommandContext) => Promise<CommandResult>;
    validation?: ValidationSchema;
    permissions?: PermissionRequirement[];
}
export interface CommandContext {
    commandId: string;
    parameters: any;
    menuContext: MenuContext;
    sessionContext: SessionContext;
    interactionMode: InteractionMode;
}
export interface CommandResult {
    success: boolean;
    data?: any;
    message?: string;
    shouldExit?: boolean;
    shouldNavigate?: boolean;
    navigationTarget?: string;
}
export interface CommandRegistry {
    register(handler: CommandHandler): void;
    execute(commandId: string, context: CommandContext): Promise<CommandResult>;
    getHandler(commandId: string): CommandHandler | null;
    listHandlers(): CommandHandler[];
}
export interface PermissionRequirement {
    type: 'read' | 'write' | 'execute' | 'admin';
    resource?: string;
    condition?: (context: CommandContext) => boolean;
}
export interface CommandMetadata {
    category: string;
    priority: number;
    description: string;
    examples?: string[];
    deprecated?: boolean;
    since?: string;
}
export interface ValidationContext {
    commandId: string;
    parameters: any;
    sessionContext: SessionContext;
}
export interface AuditLogEntry {
    timestamp: Date;
    commandId: string;
    parameters: any;
    result: CommandResult;
    executionTime: number;
    userId?: string;
    sessionId?: string;
}
//# sourceMappingURL=command-execution.d.ts.map
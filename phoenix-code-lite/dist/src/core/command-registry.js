"use strict";
/**
 * Command Registry Implementation
 * Created: 2025-01-06-175700
 *
 * Unified command execution system with validation, permissions, and audit logging.
 * Handles all commands regardless of interaction mode.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedCommandRegistry = void 0;
class UnifiedCommandRegistry {
    constructor() {
        this.handlers = new Map();
        this.auditLog = [];
        this.maxAuditLogSize = 1000;
    }
    /**
     * Register a command handler
     */
    register(handler) {
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
    async execute(commandId, context) {
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
        }
        catch (error) {
            // Record failed execution
            const errorResult = {
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
    getHandler(commandId) {
        return this.handlers.get(commandId) || null;
    }
    /**
     * List all registered handlers
     */
    listHandlers() {
        return Array.from(this.handlers.values());
    }
    /**
     * Get command handlers by category
     */
    getHandlersByCategory(category) {
        return this.listHandlers().filter(handler => {
            // Assuming handlers have metadata.category
            const metadata = handler.metadata;
            return metadata?.category === category;
        });
    }
    /**
     * Check if a command exists
     */
    hasCommand(commandId) {
        return this.handlers.has(commandId);
    }
    /**
     * Unregister a command handler
     */
    unregister(commandId) {
        return this.handlers.delete(commandId);
    }
    /**
     * Get recent audit log entries
     */
    getAuditLog(limit = 50) {
        return this.auditLog.slice(-limit);
    }
    /**
     * Clear audit log
     */
    clearAuditLog() {
        this.auditLog = [];
    }
    /**
     * Get command execution statistics
     */
    getExecutionStats() {
        const stats = {
            totalExecutions: this.auditLog.length,
            successfulExecutions: this.auditLog.filter(entry => entry.result.success).length,
            failedExecutions: this.auditLog.filter(entry => !entry.result.success).length,
            averageExecutionTime: 0,
            commandFrequency: {}
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
    async validateCommand(handler, context) {
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
    async validatePermissions(permissions, context) {
        for (const permission of permissions) {
            if (!await this.checkPermission(permission, context)) {
                throw new Error(`Insufficient permissions: ${permission.type} access required`);
            }
        }
    }
    /**
     * Check individual permission
     */
    async checkPermission(permission, context) {
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
    async validateInput(validation, context) {
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
    async executeWithLogging(handler, context) {
        try {
            const result = await handler.handler(context);
            // Return result with defaults only if not already specified
            return {
                ...result,
                success: result.success !== undefined ? result.success : true
            };
        }
        catch (error) {
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
    recordAuditEntry(commandId, context, result, executionTime) {
        const entry = {
            timestamp: new Date(),
            commandId,
            parameters: context.parameters,
            result,
            executionTime,
            sessionId: context.sessionContext.sessionId
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
    clear() {
        this.handlers.clear();
        this.auditLog = [];
    }
}
exports.UnifiedCommandRegistry = UnifiedCommandRegistry;
//# sourceMappingURL=command-registry.js.map
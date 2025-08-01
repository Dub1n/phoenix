import { TaskContext } from '../types/workflow';
export interface SecurityPolicy {
    allowedPaths: string[];
    blockedPaths: string[];
    allowedCommands: string[];
    blockedCommands: string[];
    maxFileSize: number;
    maxExecutionTime: number;
    requireApproval: boolean;
    auditAll: boolean;
}
export interface SecurityViolation {
    type: 'path_violation' | 'command_violation' | 'size_violation' | 'time_violation' | 'approval_required';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    requestedAction: string;
    policy: string;
    timestamp: Date;
}
export interface SecurityAuditLog {
    sessionId: string;
    timestamp: Date;
    action: 'file_read' | 'file_write' | 'file_delete' | 'command_exec' | 'directory_access';
    target: string;
    approved: boolean;
    user?: string;
    violations: SecurityViolation[];
    metadata?: Record<string, any>;
}
export declare class SecurityGuardrailsManager {
    private defaultPolicy;
    private auditLog;
    private sessionId;
    constructor(customPolicy?: Partial<SecurityPolicy>);
    validateFileAccess(filePath: string, action: 'read' | 'write' | 'delete', context?: TaskContext): Promise<{
        allowed: boolean;
        violations: SecurityViolation[];
    }>;
    validateCommandExecution(command: string, context?: TaskContext): Promise<{
        allowed: boolean;
        violations: SecurityViolation[];
    }>;
    validateFileSize(filePath: string, size: number): Promise<{
        allowed: boolean;
        violations: SecurityViolation[];
    }>;
    requireApproval(action: string, target: string): Promise<boolean>;
    getSecurityReport(): {
        violations: SecurityViolation[];
        auditCount: number;
        sessionId: string;
        summary: string;
    };
    private logSecurityEvent;
    private normalizePath;
    private matchPath;
}
export declare class SecureClaudeCodeClient {
    private securityManager;
    constructor(securityPolicy?: Partial<SecurityPolicy>);
    secureFileRead(filePath: string, context?: TaskContext): Promise<string>;
    secureFileWrite(filePath: string, content: string, context?: TaskContext): Promise<void>;
    secureCommandExecution(command: string, context?: TaskContext): Promise<any>;
    getSecurityReport(): {
        violations: SecurityViolation[];
        auditCount: number;
        sessionId: string;
        summary: string;
    };
}
//# sourceMappingURL=guardrails.d.ts.map
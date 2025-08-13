/**---
 * title: [Audit Logger - Workflow Audit and Events]
 * tags: [Utility, Logging, Audit]
 * provides: [AuditLogger Class, Event Logging, Session Metadata]
 * requires: [fs, path]
 * description: [Structured audit logging for workflows, including events, session IDs, and summarization support.]
 * ---*/
import { TaskContext, WorkflowResult, PhaseResult } from '../types/workflow';
import { z } from 'zod';
export declare const AuditEventSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodDate;
    sessionId: z.ZodString;
    workflowId: z.ZodOptional<z.ZodString>;
    eventType: z.ZodEnum<{
        error: "error";
        workflow_start: "workflow_start";
        workflow_end: "workflow_end";
        phase_start: "phase_start";
        phase_end: "phase_end";
        quality_gate: "quality_gate";
        agent_invocation: "agent_invocation";
        user_action: "user_action";
        config_change: "config_change";
        performance_metric: "performance_metric";
        session_created: "session_created";
        session_updated: "session_updated";
        session_completed: "session_completed";
        session_expired: "session_expired";
        mode_switch: "mode_switch";
        mode_switch_failed: "mode_switch_failed";
        config_updated: "config_updated";
        config_update_failed: "config_update_failed";
        core_foundation_init_start: "core_foundation_init_start";
        core_foundation_initialized: "core_foundation_initialized";
        core_foundation_init_failed: "core_foundation_init_failed";
        core_foundation_shutdown: "core_foundation_shutdown";
        mode_manager_initialized: "mode_manager_initialized";
        mode_manager_shutdown: "mode_manager_shutdown";
        session_manager_shutdown: "session_manager_shutdown";
        critical_error: "critical_error";
        error_occurred: "error_occurred";
        error_handled: "error_handled";
        config_manager_init_start: "config_manager_init_start";
        config_manager_initialized: "config_manager_initialized";
        config_manager_init_failed: "config_manager_init_failed";
        config_manager_shutdown: "config_manager_shutdown";
        template_loaded: "template_loaded";
        template_load_failed: "template_load_failed";
        config_hot_reload: "config_hot_reload";
        error_handler_shutdown: "error_handler_shutdown";
    }>;
    source: z.ZodString;
    severity: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        critical: "critical";
    }>;
    message: z.ZodString;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metadata: z.ZodOptional<z.ZodObject<{
        duration: z.ZodOptional<z.ZodNumber>;
        tokenUsage: z.ZodOptional<z.ZodObject<{
            input: z.ZodNumber;
            output: z.ZodNumber;
            total: z.ZodNumber;
        }, z.core.$strip>>;
        qualityScore: z.ZodOptional<z.ZodNumber>;
        agentType: z.ZodOptional<z.ZodString>;
        phaseType: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export interface AuditQuery {
    sessionId?: string;
    workflowId?: string;
    eventType?: string;
    severity?: string;
    source?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
}
export declare class AuditLogger {
    private source;
    private auditPath;
    private buffer;
    private bufferSize;
    private autoFlushInterval;
    private currentSessionId?;
    constructor(source: string, auditPath?: string);
    /**
     * Set the current session ID for this logger instance
     */
    setSessionId(sessionId: string): void;
    /**
     * Generic event logging method for Phase 1 events
     */
    logEvent(eventType: string, data?: any): Promise<void>;
    logWorkflowStart(taskDescription: string, context: TaskContext): Promise<void>;
    logWorkflowEnd(result: WorkflowResult): Promise<void>;
    logPhaseStart(phaseName: string, context: TaskContext): Promise<void>;
    logPhaseEnd(result: PhaseResult): Promise<void>;
    logError(source: string, error: Error, context?: any): Promise<void>;
    logAgentInvocation(agentType: string, prompt: string, result: any): Promise<void>;
    private log;
    flush(): Promise<void>;
    query(query: AuditQuery): Promise<AuditEvent[]>;
    private matchesQuery;
    private setupAutoFlush;
    private generateEventId;
    private sanitizeContext;
    destroy(): Promise<void>;
}
//# sourceMappingURL=audit-logger.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = exports.AuditEventSchema = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const zod_1 = require("zod");
// Enhanced audit event schemas for Phase 1
exports.AuditEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    timestamp: zod_1.z.date(),
    sessionId: zod_1.z.string(),
    workflowId: zod_1.z.string().optional(),
    eventType: zod_1.z.enum([
        'workflow_start',
        'workflow_end',
        'phase_start',
        'phase_end',
        'quality_gate',
        'agent_invocation',
        'error',
        'user_action',
        'config_change',
        'performance_metric',
        // Phase 1 specific events
        'session_created',
        'session_updated',
        'session_completed',
        'session_expired',
        'mode_switch',
        'mode_switch_failed',
        'config_updated',
        'config_update_failed',
        'core_foundation_init_start',
        'core_foundation_initialized',
        'core_foundation_init_failed',
        'core_foundation_shutdown',
        'mode_manager_initialized',
        'mode_manager_shutdown',
        'session_manager_shutdown',
        'critical_error',
        'error_occurred',
        'error_handled',
        'config_manager_init_start',
        'config_manager_initialized',
        'config_manager_init_failed',
        'config_manager_shutdown',
        'template_loaded',
        'template_load_failed',
        'config_hot_reload',
        'error_handler_shutdown'
    ]),
    source: zod_1.z.string(),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
    message: zod_1.z.string(),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    metadata: zod_1.z.object({
        duration: zod_1.z.number().optional(),
        tokenUsage: zod_1.z.object({
            input: zod_1.z.number(),
            output: zod_1.z.number(),
            total: zod_1.z.number(),
        }).optional(),
        qualityScore: zod_1.z.number().optional(),
        agentType: zod_1.z.string().optional(),
        phaseType: zod_1.z.string().optional(),
    }).optional(),
});
class AuditLogger {
    constructor(source, auditPath) {
        this.buffer = [];
        this.bufferSize = 100;
        this.autoFlushInterval = null;
        this.source = source;
        this.auditPath = auditPath || (0, path_1.join)(process.cwd(), '.phoenix-code-lite', 'audit');
        this.setupAutoFlush();
    }
    /**
     * Set the current session ID for this logger instance
     */
    setSessionId(sessionId) {
        this.currentSessionId = sessionId;
    }
    /**
     * Generic event logging method for Phase 1 events
     */
    async logEvent(eventType, data) {
        await this.log({
            eventType: eventType,
            source: this.source,
            severity: 'medium',
            message: `${eventType}: ${this.source}`,
            data
        });
    }
    async logWorkflowStart(taskDescription, context) {
        await this.log({
            eventType: 'workflow_start',
            source: 'TDDOrchestrator',
            severity: 'medium',
            message: `Workflow started: ${taskDescription}`,
            data: {
                taskDescription,
                context: this.sanitizeContext(context),
            },
        });
    }
    async logWorkflowEnd(result) {
        await this.log({
            eventType: 'workflow_end',
            source: 'TDDOrchestrator',
            severity: result.success ? 'medium' : 'high',
            message: `Workflow ${result.success ? 'completed' : 'failed'}: ${result.taskDescription}`,
            data: {
                success: result.success,
                duration: result.duration,
                phases: result.phases.length,
                error: result.error,
            },
            metadata: {
                duration: result.duration,
                qualityScore: result.metadata?.overallQualityScore,
            },
        });
    }
    async logPhaseStart(phaseName, context) {
        await this.log({
            eventType: 'phase_start',
            source: phaseName,
            severity: 'low',
            message: `Phase started: ${phaseName}`,
            metadata: {
                phaseType: phaseName,
            },
        });
    }
    async logPhaseEnd(result) {
        const duration = result.endTime ? result.endTime.getTime() - result.startTime.getTime() : 0;
        await this.log({
            eventType: 'phase_end',
            source: result.name,
            severity: result.success ? 'low' : 'medium',
            message: `Phase ${result.success ? 'completed' : 'failed'}: ${result.name}`,
            data: {
                success: result.success,
                artifacts: result.artifacts,
                error: result.error,
            },
            metadata: {
                duration,
                phaseType: result.name,
            },
        });
    }
    async logError(source, error, context) {
        await this.log({
            eventType: 'error',
            source,
            severity: 'high',
            message: `Error in ${source}: ${error.message}`,
            data: {
                error: error.message,
                stack: error.stack,
                context,
            },
        });
    }
    async logAgentInvocation(agentType, prompt, result) {
        await this.log({
            eventType: 'agent_invocation',
            source: 'ClaudeCodeClient',
            severity: 'low',
            message: `Agent invoked: ${agentType}`,
            data: {
                agentType,
                promptLength: prompt.length,
                resultLength: result.content?.length || 0,
            },
            metadata: {
                agentType,
                tokenUsage: result.usage,
            },
        });
    }
    async log(eventData) {
        const eventToValidate = {
            id: this.generateEventId(),
            timestamp: new Date(),
            sessionId: this.currentSessionId || 'system',
            ...eventData,
        };
        const event = exports.AuditEventSchema.parse(eventToValidate);
        this.buffer.push(event);
        if (this.buffer.length >= this.bufferSize) {
            await this.flush();
        }
    }
    async flush() {
        if (this.buffer.length === 0)
            return;
        try {
            await fs_1.promises.mkdir(this.auditPath, { recursive: true });
            const filename = `audit-${this.source}-${Date.now()}.jsonl`;
            const filepath = (0, path_1.join)(this.auditPath, filename);
            const content = this.buffer
                .map(event => JSON.stringify(event))
                .join('\n') + '\n';
            await fs_1.promises.writeFile(filepath, content, 'utf-8');
            this.buffer = [];
        }
        catch (error) {
            console.error('Failed to flush audit log:', error);
        }
    }
    async query(query) {
        const events = [];
        try {
            const files = await fs_1.promises.readdir(this.auditPath);
            const auditFiles = files.filter(f => f.startsWith('audit-') && f.endsWith('.jsonl'));
            for (const file of auditFiles) {
                const content = await fs_1.promises.readFile((0, path_1.join)(this.auditPath, file), 'utf-8');
                const lines = content.trim().split('\n');
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const event = JSON.parse(line);
                            event.timestamp = new Date(event.timestamp);
                            if (this.matchesQuery(event, query)) {
                                events.push(event);
                            }
                        }
                        catch (error) {
                            console.error('Failed to parse audit event:', error);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to query audit log:', error);
        }
        // Sort by timestamp and apply limit
        events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return query.limit ? events.slice(0, query.limit) : events;
    }
    matchesQuery(event, query) {
        if (query.sessionId && event.sessionId !== query.sessionId)
            return false;
        if (query.eventType && event.eventType !== query.eventType)
            return false;
        if (query.severity && event.severity !== query.severity)
            return false;
        if (query.source && event.source !== query.source)
            return false;
        if (query.startTime && event.timestamp < query.startTime)
            return false;
        if (query.endTime && event.timestamp > query.endTime)
            return false;
        return true;
    }
    setupAutoFlush() {
        this.autoFlushInterval = setInterval(() => {
            this.flush().catch(console.error);
        }, 30000); // Flush every 30 seconds
    }
    generateEventId() {
        return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    sanitizeContext(context) {
        // Remove sensitive information
        const sanitized = { ...context };
        delete sanitized.systemPrompt; // May contain sensitive info
        return sanitized;
    }
    async destroy() {
        if (this.autoFlushInterval) {
            clearInterval(this.autoFlushInterval);
            this.autoFlushInterval = null;
        }
        await this.flush();
    }
}
exports.AuditLogger = AuditLogger;
//# sourceMappingURL=audit-logger.js.map
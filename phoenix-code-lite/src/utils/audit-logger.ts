import { promises as fs } from 'fs';
import { join } from 'path';
import { TaskContext, WorkflowResult, PhaseResult } from '../types/workflow';
import { z } from 'zod';

// Enhanced audit event schemas for Phase 1
export const AuditEventSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  sessionId: z.string(),
  workflowId: z.string().optional(),
  eventType: z.enum([
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
  source: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  data: z.record(z.string(), z.any()).optional(),
  metadata: z.object({
    duration: z.number().optional(),
    tokenUsage: z.object({
      input: z.number(),
      output: z.number(),
      total: z.number(),
    }).optional(),
    qualityScore: z.number().optional(),
    agentType: z.string().optional(),
    phaseType: z.string().optional(),
  }).optional(),
});

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

export class AuditLogger {
  private source: string;
  private auditPath: string;
  private buffer: AuditEvent[] = [];
  private bufferSize: number = 100;
  private autoFlushInterval: NodeJS.Timeout | null = null;
  private currentSessionId?: string;
  
  constructor(source: string, auditPath?: string) {
    this.source = source;
    this.auditPath = auditPath || join(process.cwd(), '.phoenix-code-lite', 'audit');
    this.setupAutoFlush();
  }
  
  /**
   * Set the current session ID for this logger instance
   */
  public setSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
  }
  
  /**
   * Generic event logging method for Phase 1 events
   */
  public async logEvent(eventType: string, data?: any): Promise<void> {
    await this.log({
      eventType: eventType as any,
      source: this.source,
      severity: 'medium',
      message: `${eventType}: ${this.source}`,
      data
    });
  }
  
  async logWorkflowStart(taskDescription: string, context: TaskContext): Promise<void> {
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
  
  async logWorkflowEnd(result: WorkflowResult): Promise<void> {
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
        qualityScore: (result.metadata as any)?.overallQualityScore,
      },
    });
  }
  
  async logPhaseStart(phaseName: string, context: TaskContext): Promise<void> {
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
  
  async logPhaseEnd(result: PhaseResult): Promise<void> {
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
  
  async logError(source: string, error: Error, context?: any): Promise<void> {
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
  
  async logAgentInvocation(agentType: string, prompt: string, result: any): Promise<void> {
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
  
  private async log(eventData: Partial<AuditEvent>): Promise<void> {
    const eventToValidate = {
      id: this.generateEventId(),
      timestamp: new Date(),
      sessionId: this.currentSessionId || 'system',
      ...eventData,
    };
    
    const event = AuditEventSchema.parse(eventToValidate);
    this.buffer.push(event);
    
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }
  
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    try {
      await fs.mkdir(this.auditPath, { recursive: true });
      
      const filename = `audit-${this.source}-${Date.now()}.jsonl`;
      const filepath = join(this.auditPath, filename);
      
      const content = this.buffer
        .map(event => JSON.stringify(event))
        .join('\n') + '\n';
      
      await fs.writeFile(filepath, content, 'utf-8');
      this.buffer = [];
    } catch (error) {
      console.error('Failed to flush audit log:', error);
    }
  }
  
  async query(query: AuditQuery): Promise<AuditEvent[]> {
    const events: AuditEvent[] = [];
    
    try {
      const files = await fs.readdir(this.auditPath);
      const auditFiles = files.filter(f => f.startsWith('audit-') && f.endsWith('.jsonl'));
      
      for (const file of auditFiles) {
        const content = await fs.readFile(join(this.auditPath, file), 'utf-8');
        const lines = content.trim().split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = JSON.parse(line);
              event.timestamp = new Date(event.timestamp);
              
              if (this.matchesQuery(event, query)) {
                events.push(event);
              }
            } catch (error) {
              console.error('Failed to parse audit event:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to query audit log:', error);
    }
    
    // Sort by timestamp and apply limit
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return query.limit ? events.slice(0, query.limit) : events;
  }
  
  private matchesQuery(event: AuditEvent, query: AuditQuery): boolean {
    if (query.sessionId && event.sessionId !== query.sessionId) return false;
    if (query.eventType && event.eventType !== query.eventType) return false;
    if (query.severity && event.severity !== query.severity) return false;
    if (query.source && event.source !== query.source) return false;
    if (query.startTime && event.timestamp < query.startTime) return false;
    if (query.endTime && event.timestamp > query.endTime) return false;
    
    return true;
  }
  
  private setupAutoFlush(): void {
    this.autoFlushInterval = setInterval(() => {
      this.flush().catch(console.error);
    }, 30000); // Flush every 30 seconds
  }
  
  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private sanitizeContext(context: TaskContext): any {
    // Remove sensitive information
    const sanitized = { ...context };
    delete sanitized.systemPrompt; // May contain sensitive info
    return sanitized;
  }
  
  async destroy(): Promise<void> {
    if (this.autoFlushInterval) {
      clearInterval(this.autoFlushInterval);
      this.autoFlushInterval = null;
    }
    await this.flush();
  }
}
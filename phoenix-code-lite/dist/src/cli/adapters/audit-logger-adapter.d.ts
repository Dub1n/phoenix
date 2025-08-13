/**---
 * title: [Audit Logger Adapter - CLI Integration]
 * tags: [CLI, Adapter, Logging]
 * provides: [Adapter Functions, Logger Wiring]
 * requires: [AuditLogger, IAuditLogger]
 * description: [Adapter bridging CLI components to the audit logger implementation and metrics.]
 * ---*/
import { IAuditLogger, AuditMetrics } from '../interfaces/audit-logger';
import { AuditLogger } from '../../utils/audit-logger';
export declare class AuditLoggerAdapter implements IAuditLogger {
    private auditLogger;
    constructor(auditLogger: AuditLogger);
    log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): void;
    flush(): Promise<void>;
    destroy(): Promise<void>;
    getMetrics(): Promise<AuditMetrics>;
}
//# sourceMappingURL=audit-logger-adapter.d.ts.map
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
/**---
 * title: [Audit Logger Interface - Metrics & Logging Contract]
 * tags: [CLI, Interface, Types]
 * provides: [IAuditLogger Interface, AuditMetrics Type]
 * requires: []
 * description: [Defines the logging and metrics interface used across CLI and TDD components.]
 * ---*/
export interface AuditMetrics {
    totalLogs: number;
    errorCount: number;
    lastLogTime: Date;
}
export interface IAuditLogger {
    log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): void;
    flush(): Promise<void>;
    destroy(): Promise<void>;
    getMetrics(): Promise<AuditMetrics>;
}
//# sourceMappingURL=audit-logger.d.ts.map
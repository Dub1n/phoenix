/**---
 * title: [Mock Audit Logger - Testing Double]
 * tags: [Testing, Mocks]
 * provides: [MockAuditLogger]
 * requires: []
 * description: [Mock implementation of IAuditLogger for unit and integration tests.]
 * ---*/
import { IAuditLogger, AuditMetrics } from '../../cli/interfaces/audit-logger';
export declare class MockAuditLogger implements IAuditLogger {
    private logs;
    log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): void;
    flush(): Promise<void>;
    destroy(): Promise<void>;
    getMetrics(): Promise<AuditMetrics>;
    getLogs(): {
        level: string;
        message: string;
        metadata?: any;
    }[];
    clearLogs(): void;
    getLogsByLevel(level: string): {
        level: string;
        message: string;
        metadata?: any;
    }[];
}
//# sourceMappingURL=mock-audit-logger.d.ts.map
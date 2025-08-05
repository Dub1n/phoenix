import { IAuditLogger, AuditMetrics } from '../../cli/interfaces/audit-logger';

export class MockAuditLogger implements IAuditLogger {
  private logs: Array<{level: string, message: string, metadata?: any}> = [];

  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): void {
    this.logs.push({level, message, metadata});
  }

  async flush(): Promise<void> {
    // Mock flush - no actual I/O
  }

  async destroy(): Promise<void> {
    // Mock destroy - no actual cleanup needed
  }

  async getMetrics(): Promise<AuditMetrics> {
    return {
      totalLogs: this.logs.length,
      errorCount: this.logs.filter(l => l.level === 'error').length,
      lastLogTime: new Date()
    };
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  getLogsByLevel(level: string) {
    return this.logs.filter(l => l.level === level);
  }
} 
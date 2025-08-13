/**---
 * title: [Audit Logger Adapter - CLI Integration]
 * tags: [CLI, Adapter, Logging]
 * provides: [Adapter Functions, Logger Wiring]
 * requires: [AuditLogger, IAuditLogger]
 * description: [Adapter bridging CLI components to the audit logger implementation and metrics.]
 * ---*/

import { IAuditLogger, AuditMetrics } from '../interfaces/audit-logger';
import { AuditLogger } from '../../utils/audit-logger';

export class AuditLoggerAdapter implements IAuditLogger {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): void {
    // Map the interface log method to the real audit logger
    // The real audit logger doesn't have a simple log method, so we'll use logEvent
    this.auditLogger.logEvent('user_action', {
      level,
      message,
      metadata
    });
  }

  async flush(): Promise<void> {
    await this.auditLogger.flush();
  }

  async destroy(): Promise<void> {
    await this.auditLogger.destroy();
  }

  async getMetrics(): Promise<AuditMetrics> {
    // For now, return a simple metrics object
    // In a real implementation, this would query the actual audit logger
    return {
      totalLogs: 0,
      errorCount: 0,
      lastLogTime: new Date()
    };
  }
} 
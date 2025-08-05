"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLoggerAdapter = void 0;
class AuditLoggerAdapter {
    constructor(auditLogger) {
        this.auditLogger = auditLogger;
    }
    log(level, message, metadata) {
        // Map the interface log method to the real audit logger
        // The real audit logger doesn't have a simple log method, so we'll use logEvent
        this.auditLogger.logEvent('user_action', {
            level,
            message,
            metadata
        });
    }
    async flush() {
        await this.auditLogger.flush();
    }
    async destroy() {
        await this.auditLogger.destroy();
    }
    async getMetrics() {
        // For now, return a simple metrics object
        // In a real implementation, this would query the actual audit logger
        return {
            totalLogs: 0,
            errorCount: 0,
            lastLogTime: new Date()
        };
    }
}
exports.AuditLoggerAdapter = AuditLoggerAdapter;
//# sourceMappingURL=audit-logger-adapter.js.map
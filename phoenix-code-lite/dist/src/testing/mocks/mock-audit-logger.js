"use strict";
/**---
 * title: [Mock Audit Logger - Testing Double]
 * tags: [Testing, Mocks]
 * provides: [MockAuditLogger]
 * requires: []
 * description: [Mock implementation of IAuditLogger for unit and integration tests.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAuditLogger = void 0;
class MockAuditLogger {
    constructor() {
        this.logs = [];
    }
    log(level, message, metadata) {
        this.logs.push({ level, message, metadata });
    }
    async flush() {
        // Mock flush - no actual I/O
    }
    async destroy() {
        // Mock destroy - no actual cleanup needed
    }
    async getMetrics() {
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
    getLogsByLevel(level) {
        return this.logs.filter(l => l.level === level);
    }
}
exports.MockAuditLogger = MockAuditLogger;
//# sourceMappingURL=mock-audit-logger.js.map
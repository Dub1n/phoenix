"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// tests/integration/audit-logging.test.ts
const audit_logger_1 = require("../../src/utils/audit-logger");
const metrics_1 = require("../../src/utils/metrics");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
describe('Phase 6: Audit Logging & Metrics', () => {
    const testAuditPath = path.join(__dirname, 'test-audit');
    const sessionId = 'test-session-123';
    beforeEach(async () => {
        await fs.mkdir(testAuditPath, { recursive: true });
    });
    afterEach(async () => {
        await fs.rm(testAuditPath, { recursive: true, force: true });
    });
    describe('Audit Event Schema', () => {
        test('AuditEventSchema validates valid events', () => {
            const validEvent = {
                id: 'event-123',
                timestamp: new Date(),
                sessionId: 'session-123',
                eventType: 'workflow_start',
                source: 'TDDOrchestrator',
                severity: 'medium',
                message: 'Workflow started'
            };
            expect(() => audit_logger_1.AuditEventSchema.parse(validEvent)).not.toThrow();
        });
        test('Schema rejects invalid event types', () => {
            const invalidEvent = {
                id: 'event-123',
                timestamp: new Date(),
                sessionId: 'session-123',
                eventType: 'invalid_type',
                source: 'TDDOrchestrator',
                severity: 'medium',
                message: 'Test'
            };
            expect(() => audit_logger_1.AuditEventSchema.parse(invalidEvent)).toThrow();
        });
    });
    describe('AuditLogger', () => {
        let auditLogger;
        beforeEach(() => {
            auditLogger = new audit_logger_1.AuditLogger(sessionId, testAuditPath);
        });
        test('Can log workflow events', async () => {
            const context = {
                taskDescription: 'Test task',
                projectPath: '/test',
                maxTurns: 3
            };
            await auditLogger.logWorkflowStart('Test task', context);
            await auditLogger.flush();
            // Check that audit file was created
            const files = await fs.readdir(testAuditPath);
            expect(files.length).toBeGreaterThan(0);
        });
        test('Can query audit events', async () => {
            await auditLogger.logWorkflowStart('Test task', { taskDescription: 'Test task', projectPath: '/test', maxTurns: 3 });
            await auditLogger.flush();
            const events = await auditLogger.query({ eventType: 'workflow_start' });
            expect(events.length).toBe(1);
            expect(events[0].eventType).toBe('workflow_start');
        });
    });
    describe('MetricsCollector', () => {
        let metricsCollector;
        beforeEach(() => {
            metricsCollector = new metrics_1.MetricsCollector(testAuditPath);
        });
        test('Can record workflow metrics', async () => {
            const workflowResult = {
                taskDescription: 'Test workflow',
                startTime: new Date(),
                endTime: new Date(),
                duration: 5000,
                success: true,
                phases: [],
                artifacts: []
            };
            await metricsCollector.recordWorkflow(workflowResult);
            const metrics = await metricsCollector.getWorkflowMetrics();
            expect(metrics.totalWorkflows).toBe(1);
            expect(metrics.successRate).toBe(1.0);
        });
        test('Can generate analytics report', async () => {
            // Record some test data
            const successfulWorkflow = {
                taskDescription: 'Success test',
                startTime: new Date(),
                endTime: new Date(),
                duration: 3000,
                success: true,
                phases: [],
                artifacts: []
            };
            await metricsCollector.recordWorkflow(successfulWorkflow);
            const report = await metricsCollector.generateAnalyticsReport();
            expect(report.totalWorkflows).toBe(1);
            expect(report.averageDuration).toBe(3000);
        });
    });
});
//# sourceMappingURL=audit-logging.test.js.map
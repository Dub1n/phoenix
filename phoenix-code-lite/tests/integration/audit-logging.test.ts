// tests/integration/audit-logging.test.ts
import { AuditLogger, AuditEventSchema } from '../../src/utils/audit-logger';
import { MetricsCollector } from '../../src/utils/metrics';
import * as fs from 'fs/promises';
import * as path from 'path';

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
      
      expect(() => AuditEventSchema.parse(validEvent)).not.toThrow();
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
      
      expect(() => AuditEventSchema.parse(invalidEvent)).toThrow();
    });
  });
  
  describe('AuditLogger', () => {
    let auditLogger: AuditLogger;
    
    beforeEach(() => {
      auditLogger = new AuditLogger(sessionId, testAuditPath);
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
    let metricsCollector: MetricsCollector;
    
    beforeEach(() => {
      metricsCollector = new MetricsCollector(testAuditPath);
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
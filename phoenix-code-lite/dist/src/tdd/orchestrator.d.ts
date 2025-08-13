/**---
 * title: [TDD Orchestrator - Core Service Module]
 * tags: [TDD, Service, Workflow, Quality-Assurance]
 * provides: [TDDOrchestrator Class, 3-Phase Workflow Coordination, Quality Gate Integration, Audit & Metrics]
 * requires: [ClaudeCodeClient, PlanTestPhase, ImplementFixPhase, RefactorDocumentPhase, QualityGateManager, CodebaseScanner, AuditLogger, MetricsCollector]
 * description: [Coordinates Phoenix Code Lite’s TDD workflow (Plan & Test, Implement & Fix, Refactor & Document) with anti-reimplementation scanning, auditing, metrics, and quality gates.]
 * ---*/
import { ClaudeCodeClient } from '../claude/client';
import { TaskContext, WorkflowResult } from '../types/workflow';
export declare class TDDOrchestrator {
    private claudeClient;
    private planTestPhase;
    private implementFixPhase;
    private refactorDocumentPhase;
    private qualityGateManager;
    private codebaseScanner;
    private auditLogger;
    private metricsCollector;
    constructor(claudeClient: ClaudeCodeClient);
    executeWorkflow(taskDescription: string, context: TaskContext): Promise<WorkflowResult>;
    private gatherImplementationArtifacts;
    private gatherFinalArtifacts;
    private applyQualityImprovements;
    private calculateOverallQualityScore;
    private generateQualitySummary;
    private displayQualitySummary;
    private validateScanAcknowledgment;
}
//# sourceMappingURL=orchestrator.d.ts.map
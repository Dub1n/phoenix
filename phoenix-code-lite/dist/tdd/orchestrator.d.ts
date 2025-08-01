import { ClaudeCodeClient } from '../claude/client';
import { TaskContext, WorkflowResult } from '../types/workflow';
export declare class TDDOrchestrator {
    private claudeClient;
    private planTestPhase;
    private implementFixPhase;
    private refactorDocumentPhase;
    private qualityGateManager;
    private codebaseScanner;
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
import { ClaudeCodeClient } from '../../claude/client';
import { TaskContext, PhaseResult } from '../../types/workflow';
export declare class PlanTestPhase {
    private claudeClient;
    constructor(claudeClient: ClaudeCodeClient);
    execute(taskDescription: string, context: TaskContext): Promise<PhaseResult>;
    private validateTestCreation;
    private findTestFiles;
}
//# sourceMappingURL=plan-test.d.ts.map
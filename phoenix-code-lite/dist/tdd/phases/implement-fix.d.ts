import { ClaudeCodeClient } from '../../claude/client';
import { TaskContext, PhaseResult } from '../../types/workflow';
export declare class ImplementFixPhase {
    private claudeClient;
    private maxAttempts;
    constructor(claudeClient: ClaudeCodeClient);
    execute(planResult: PhaseResult, context: TaskContext): Promise<PhaseResult>;
    private runTests;
    private parseTestOutput;
    private extractTestCount;
    private formatTestErrors;
    private getImplementationFiles;
}
//# sourceMappingURL=implement-fix.d.ts.map
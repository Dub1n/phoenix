import { ClaudeCodeClient } from '../../claude/client';
import { TaskContext, PhaseResult } from '../../types/workflow';
export declare class RefactorDocumentPhase {
    private claudeClient;
    constructor(claudeClient: ClaudeCodeClient);
    execute(implementResult: PhaseResult, context: TaskContext): Promise<PhaseResult>;
    private validateTestsStillPass;
    private getRefactoredFiles;
}
//# sourceMappingURL=refactor-document.d.ts.map
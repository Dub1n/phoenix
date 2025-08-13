/**---
 * title: [TDD Phase - Refactor & Document]
 * tags: [TDD, Service, Refactoring, Documentation]
 * provides: [RefactorDocumentPhase Class, Refactoring Prompting, Test Validation, Artifact Collection]
 * requires: [ClaudeCodeClient, TDDPrompts, SpecializedAgentContexts, TaskContext, PhaseResult]
 * description: [Performs refactoring and documentation improvements via Claude Code, validates tests still pass, and records resulting artifacts.]
 * ---*/
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
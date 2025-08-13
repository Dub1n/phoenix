/**---
 * title: [TDD Phase - Implement & Fix]
 * tags: [TDD, Service, Implementation, Testing]
 * provides: [ImplementFixPhase Class, Implementation Loop, Test Execution, Artifact Collection]
 * requires: [ClaudeCodeClient, TDDPrompts, SpecializedAgentContexts, TaskContext, PhaseResult]
 * description: [Executes iterative implementation attempts using Claude Code, runs tests, aggregates artifacts, and records outcomes until criteria pass or attempts exhausted.]
 * ---*/
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
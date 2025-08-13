/**---
 * title: [Plan & Test Phase - TDD Phase Module]
 * tags: [TDD, Phase, Planning, Test-Generation]
 * provides: [PlanTestPhase Class, Test Planning Execution, Test Validation]
 * requires: [ClaudeCodeClient, TDDPrompts, Workflow Types, Agents]
 * description: [Generates a planning strategy and test suite using Claude with specialized persona and validates test creation for the TDD workflow.]
 * ---*/
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
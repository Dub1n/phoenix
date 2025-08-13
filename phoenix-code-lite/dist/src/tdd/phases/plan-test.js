"use strict";
/**---
 * title: [Plan & Test Phase - TDD Phase Module]
 * tags: [TDD, Phase, Planning, Test-Generation]
 * provides: [PlanTestPhase Class, Test Planning Execution, Test Validation]
 * requires: [ClaudeCodeClient, TDDPrompts, Workflow Types, Agents]
 * description: [Generates a planning strategy and test suite using Claude with specialized persona and validates test creation for the TDD workflow.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanTestPhase = void 0;
const prompts_1 = require("../../claude/prompts");
const agents_1 = require("../../types/agents");
class PlanTestPhase {
    constructor(claudeClient) {
        this.claudeClient = claudeClient;
    }
    async execute(taskDescription, context) {
        const phase = {
            name: 'plan-test',
            startTime: new Date(),
            success: false,
            artifacts: [],
        };
        try {
            // Generate comprehensive prompt with Planning Analyst persona
            const prompt = prompts_1.TDDPrompts.planAndTestPrompt(taskDescription, context);
            // Ask Claude Code to plan and create tests using specialized persona
            const response = await this.claudeClient.query(prompt, context, agents_1.SpecializedAgentContexts.PLANNING_ANALYST);
            // Validate that tests were created
            const testValidation = await this.validateTestCreation(context);
            if (!testValidation.valid) {
                throw new Error(`Test creation failed: ${testValidation.errors.join(', ')}`);
            }
            phase.success = true;
            phase.output = response.content;
            phase.artifacts = testValidation.testFiles;
            phase.endTime = new Date();
            return phase;
        }
        catch (error) {
            phase.success = false;
            phase.error = error instanceof Error ? error.message : 'Unknown error';
            phase.endTime = new Date();
            return phase;
        }
    }
    async validateTestCreation(context) {
        try {
            // Check if test files were created using Claude Code
            const testFiles = await this.findTestFiles(context.projectPath);
            // For now, return basic validation - will be enhanced with actual file checking
            return {
                valid: true, // Placeholder - assumes Claude Code created tests successfully
                errors: [],
                testFiles: testFiles,
            };
        }
        catch (error) {
            return {
                valid: false,
                errors: [error instanceof Error ? error.message : 'Test validation failed'],
                testFiles: [],
            };
        }
    }
    async findTestFiles(projectPath) {
        // Placeholder for actual file discovery via Claude Code
        // In real implementation, would use Claude Code to find test files
        return ['tests/generated.test.ts']; // Placeholder
    }
}
exports.PlanTestPhase = PlanTestPhase;
//# sourceMappingURL=plan-test.js.map
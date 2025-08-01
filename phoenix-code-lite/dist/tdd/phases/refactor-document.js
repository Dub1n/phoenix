"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefactorDocumentPhase = void 0;
const prompts_1 = require("../../claude/prompts");
const agents_1 = require("../../types/agents");
class RefactorDocumentPhase {
    constructor(claudeClient) {
        this.claudeClient = claudeClient;
    }
    async execute(implementResult, context) {
        const phase = {
            name: 'refactor-document',
            startTime: new Date(),
            success: false,
            artifacts: [],
        };
        try {
            // Create refactoring prompt with implementation context
            const prompt = prompts_1.TDDPrompts.refactorPrompt(implementResult.output || '', context);
            // Ask Claude Code to refactor and document using Quality Reviewer persona
            const response = await this.claudeClient.query(prompt, context, agents_1.SpecializedAgentContexts.QUALITY_REVIEWER);
            // Validate that tests still pass after refactoring
            const testValidation = await this.validateTestsStillPass(context);
            if (!testValidation.valid) {
                throw new Error(`Refactoring broke tests: ${testValidation.errors.join(', ')}`);
            }
            phase.success = true;
            phase.output = response.content;
            phase.artifacts = await this.getRefactoredFiles(context);
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
    async validateTestsStillPass(context) {
        try {
            const result = await this.claudeClient.executeCommand('npm test');
            return {
                valid: result.exitCode === 0,
                errors: result.exitCode !== 0 ? [result.stderr] : [],
            };
        }
        catch (error) {
            return {
                valid: false,
                errors: [error instanceof Error ? error.message : 'Test validation failed'],
            };
        }
    }
    async getRefactoredFiles(context) {
        // Placeholder for finding refactored files via Claude Code
        return ['src/refactored.ts', 'docs/README.md']; // Placeholder
    }
}
exports.RefactorDocumentPhase = RefactorDocumentPhase;
//# sourceMappingURL=refactor-document.js.map
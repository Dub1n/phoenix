import { ClaudeCodeClient } from '../../claude/client';
import { TDDPrompts } from '../../claude/prompts';
import { TaskContext, PhaseResult } from '../../types/workflow';
import { SpecializedAgentContexts } from '../../types/agents';

export class RefactorDocumentPhase {
  private claudeClient: ClaudeCodeClient;
  
  constructor(claudeClient: ClaudeCodeClient) {
    this.claudeClient = claudeClient;
  }
  
  async execute(implementResult: PhaseResult, context: TaskContext): Promise<PhaseResult> {
    const phase: PhaseResult = {
      name: 'refactor-document',
      startTime: new Date(),
      success: false,
      artifacts: [],
    };
    
    try {
      // Create refactoring prompt with implementation context
      const prompt = TDDPrompts.refactorPrompt(
        implementResult.output || '',
        context
      );
      
      // Ask Claude Code to refactor and document using Quality Reviewer persona
      const response = await this.claudeClient.query(
        prompt,
        context,
        SpecializedAgentContexts.QUALITY_REVIEWER
      );
      
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
      
    } catch (error) {
      phase.success = false;
      phase.error = error instanceof Error ? error.message : 'Unknown error';
      phase.endTime = new Date();
      return phase;
    }
  }
  
  private async validateTestsStillPass(context: TaskContext): Promise<{valid: boolean, errors: string[]}> {
    try {
      const result = await this.claudeClient.executeCommand('npm test');
      
      return {
        valid: result.exitCode === 0,
        errors: result.exitCode !== 0 ? [result.stderr] : [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Test validation failed'],
      };
    }
  }
  
  private async getRefactoredFiles(context: TaskContext): Promise<string[]> {
    // Placeholder for finding refactored files via Claude Code
    return ['src/refactored.ts', 'docs/README.md']; // Placeholder
  }
}
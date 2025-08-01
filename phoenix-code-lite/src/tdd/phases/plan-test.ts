import { ClaudeCodeClient } from '../../claude/client';
import { TDDPrompts } from '../../claude/prompts';
import { TaskContext, PhaseResult } from '../../types/workflow';
import { SpecializedAgentContexts } from '../../types/agents';

interface TestValidation {
  valid: boolean;
  errors: string[];
  testFiles: string[];
}

export class PlanTestPhase {
  private claudeClient: ClaudeCodeClient;
  
  constructor(claudeClient: ClaudeCodeClient) {
    this.claudeClient = claudeClient;
  }
  
  async execute(taskDescription: string, context: TaskContext): Promise<PhaseResult> {
    const phase: PhaseResult = {
      name: 'plan-test',
      startTime: new Date(),
      success: false,
      artifacts: [],
    };
    
    try {
      // Generate comprehensive prompt with Planning Analyst persona
      const prompt = TDDPrompts.planAndTestPrompt(taskDescription, context);
      
      // Ask Claude Code to plan and create tests using specialized persona
      const response = await this.claudeClient.query(
        prompt, 
        context, 
        SpecializedAgentContexts.PLANNING_ANALYST
      );
      
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
      
    } catch (error) {
      phase.success = false;
      phase.error = error instanceof Error ? error.message : 'Unknown error';
      phase.endTime = new Date();
      return phase;
    }
  }
  
  private async validateTestCreation(context: TaskContext): Promise<TestValidation> {
    try {
      // Check if test files were created using Claude Code
      const testFiles = await this.findTestFiles(context.projectPath);
      
      // For now, return basic validation - will be enhanced with actual file checking
      return {
        valid: true, // Placeholder - assumes Claude Code created tests successfully
        errors: [],
        testFiles: testFiles,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Test validation failed'],
        testFiles: [],
      };
    }
  }
  
  private async findTestFiles(projectPath: string): Promise<string[]> {
    // Placeholder for actual file discovery via Claude Code
    // In real implementation, would use Claude Code to find test files
    return ['tests/generated.test.ts']; // Placeholder
  }
}
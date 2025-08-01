import { ClaudeCodeClient } from '../../claude/client';
import { TDDPrompts } from '../../claude/prompts';
import { TaskContext, PhaseResult } from '../../types/workflow';
import { SpecializedAgentContexts } from '../../types/agents';

interface TestResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errors: string[];
  duration: number;
}

export class ImplementFixPhase {
  private claudeClient: ClaudeCodeClient;
  private maxAttempts: number = 3;
  
  constructor(claudeClient: ClaudeCodeClient) {
    this.claudeClient = claudeClient;
  }
  
  async execute(planResult: PhaseResult, context: TaskContext): Promise<PhaseResult> {
    const phase: PhaseResult = {
      name: 'implement-fix',
      startTime: new Date(),
      success: false,
      artifacts: [],
    };
    
    let attempt = 0;
    let lastError = '';
    
    while (attempt < this.maxAttempts) {
      attempt++;
      console.log(`  ⇔ Implementation attempt ${attempt}/${this.maxAttempts}`);
      
      try {
        // Create implementation prompt with context
        const prompt = TDDPrompts.implementationPrompt(
          planResult.output || '',
          lastError,
          context
        );
        
        // Ask Claude Code to implement using Implementation Engineer persona
        const response = await this.claudeClient.query(
          prompt,
          context,
          SpecializedAgentContexts.IMPLEMENTATION_ENGINEER
        );
        
        // Run tests to validate implementation
        const testResults = await this.runTests(context);
        
        if (testResults.failedTests === 0) {
          console.log('  ✓ All tests passed!');
          phase.success = true;
          phase.output = response.content;
          phase.artifacts = await this.getImplementationFiles(context);
          phase.metadata = { testResults, attempts: attempt };
          break;
        } else {
          lastError = this.formatTestErrors(testResults);
          console.log(`  ✗ ${testResults.failedTests} tests failed`);
          
          if (attempt < this.maxAttempts) {
            console.log('  ⇔ Retrying with error feedback...');
          }
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.log(`  ✗ Implementation error: ${lastError}`);
      }
    }
    
    if (!phase.success) {
      phase.error = `Failed after ${this.maxAttempts} attempts. Last error: ${lastError}`;
    }
    
    phase.endTime = new Date();
    return phase;
  }
  
  private async runTests(context: TaskContext): Promise<TestResults> {
    try {
      // Use Claude Code to run tests
      const result = await this.claudeClient.executeCommand('npm test');
      
      return this.parseTestOutput(result.stdout, result.stderr, result.duration);
    } catch (error) {
      return {
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        errors: [error instanceof Error ? error.message : 'Test execution failed'],
        duration: 0,
      };
    }
  }
  
  private parseTestOutput(stdout: string, stderr: string, duration: number): TestResults {
    // Basic test output parsing - would be enhanced for specific test frameworks
    const failed = stderr.includes('failed') || stdout.includes('failed');
    const testCount = this.extractTestCount(stdout);
    
    return {
      totalTests: testCount,
      passedTests: failed ? 0 : testCount,
      failedTests: failed ? testCount : 0,
      errors: failed ? [stderr || 'Tests failed'] : [],
      duration,
    };
  }
  
  private extractTestCount(output: string): number {
    // Simple extraction - would be enhanced for specific test runners
    const match = output.match(/(\d+) test/);
    return match ? parseInt(match[1]) : 1;
  }
  
  private formatTestErrors(testResults: TestResults): string {
    return `${testResults.failedTests} tests failed. Errors: ${testResults.errors.join(', ')}`;
  }
  
  private async getImplementationFiles(context: TaskContext): Promise<string[]> {
    // Placeholder for finding implementation files via Claude Code
    return ['src/implementation.ts']; // Placeholder
  }
}
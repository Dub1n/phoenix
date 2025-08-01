// tests/integration/core-architecture.test.ts
import { TaskContextSchema, LLMResponseSchema, CommandResultSchema } from '../../src/types/workflow';
import { SpecializedAgentContexts } from '../../src/types/agents';
import { ClaudeCodeClient } from '../../src/claude/client';
import { TDDPrompts } from '../../src/claude/prompts';

describe('Phase 2: Core Architecture Integration', () => {
  describe('Structured Data Validation', () => {
    test('TaskContext schema validates correct data', () => {
      const validContext = {
        taskDescription: 'Create a simple calculator function',
        projectPath: '/test/project',
        language: 'typescript',
        maxTurns: 3
      };
      
      expect(() => TaskContextSchema.parse(validContext)).not.toThrow();
    });
    
    test('TaskContext schema rejects invalid data', () => {
      const invalidContext = {
        taskDescription: 'too short', // Should be min 10 chars
        projectPath: '', // Should be non-empty
        maxTurns: 20 // Should be max 10
      };
      
      expect(() => TaskContextSchema.parse(invalidContext)).toThrow();
    });
    
    test('LLMResponse schema validates response structure', () => {
      const validResponse = {
        content: 'Test response',
        usage: { inputTokens: 100, outputTokens: 50 },
        metadata: { model: 'claude-3' }
      };
      
      expect(() => LLMResponseSchema.parse(validResponse)).not.toThrow();
    });
  });
  
  describe('Agent Specialization System', () => {
    test('All specialized agent contexts are properly defined', () => {
      expect(SpecializedAgentContexts.PLANNING_ANALYST).toBeDefined();
      expect(SpecializedAgentContexts.IMPLEMENTATION_ENGINEER).toBeDefined();
      expect(SpecializedAgentContexts.QUALITY_REVIEWER).toBeDefined();
      
      // Verify each has required properties
      Object.values(SpecializedAgentContexts).forEach(agent => {
        expect(agent.role).toBeDefined();
        expect(agent.expertise).toBeInstanceOf(Array);
        expect(agent.approach).toBeDefined();
        expect(agent.quality_standards).toBeInstanceOf(Array);
        expect(agent.output_format).toBeDefined();
      });
    });
  });
  
  describe('Claude Code Client Integration', () => {
    let client: ClaudeCodeClient;
    
    beforeEach(() => {
      client = new ClaudeCodeClient();
    });
    
    test('ClaudeCodeClient can be instantiated', () => {
      expect(client).toBeInstanceOf(ClaudeCodeClient);
    });
    
    test('validateWorkflowContext returns errors for invalid context', async () => {
      const invalidContext = {
        taskDescription: 'short',
        projectPath: '',
        maxTurns: 50
      };
      
      const errors = await client.validateWorkflowContext(invalidContext as any);
      expect(errors.length).toBeGreaterThan(0);
    });
    
    test('validateWorkflowContext returns no errors for valid context', async () => {
      const validContext = {
        taskDescription: 'Create a comprehensive test suite for user authentication',
        projectPath: '/valid/project/path',
        language: 'typescript',
        maxTurns: 3
      };
      
      const errors = await client.validateWorkflowContext(validContext);
      expect(errors).toHaveLength(0);
    });
  });
  
  describe('TDD Prompt System', () => {
    test('planAndTestPrompt generates structured prompt', () => {
      const context = {
        taskDescription: 'Create user authentication system',
        projectPath: '/test/project',
        language: 'typescript',
        maxTurns: 3
      };
      
      const prompt = TDDPrompts.planAndTestPrompt('Create login functionality', context);
      
      expect(prompt).toContain('Senior Technical Analyst');
      expect(prompt).toContain('Implementation Plan');
      expect(prompt).toContain('Comprehensive tests');
      expect(prompt).toContain('Edge cases');
    });
    
    test('implementationPrompt includes previous context', () => {
      const context = {
        taskDescription: 'Implement login functionality',
        projectPath: '/test/project',
        maxTurns: 3
      };
      
      const prompt = TDDPrompts.implementationPrompt(
        'Previous plan context',
        'Test failure results',
        context
      );
      
      expect(prompt).toContain('Senior Software Engineer');
      expect(prompt).toContain('Previous plan context');
      expect(prompt).toContain('Test failure results');
      expect(prompt).toContain('minimal, clean implementation');
    });
  });
});
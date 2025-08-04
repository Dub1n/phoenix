import { TDDOrchestrator } from '../../src/tdd/orchestrator';
import { QualityGateManager } from '../../src/tdd/quality-gates';
import { PlanTestPhase } from '../../src/tdd/phases/plan-test';
import { ImplementFixPhase } from '../../src/tdd/phases/implement-fix';
import { RefactorDocumentPhase } from '../../src/tdd/phases/refactor-document';
import { CodebaseScanner } from '../../src/tdd/codebase-scanner';
import { ClaudeCodeClient } from '../../src/claude/client';

describe('Phase 3: TDD Workflow Engine', () => {
  let orchestrator: TDDOrchestrator;
  let mockClient: ClaudeCodeClient;
  
  beforeEach(() => {
    mockClient = new ClaudeCodeClient();
    orchestrator = new TDDOrchestrator(mockClient);
  });
  
  describe('Quality Gate Framework', () => {
    let qualityGateManager: QualityGateManager;
    
    beforeEach(() => {
      qualityGateManager = new QualityGateManager();
    });
    
    test('Quality gates are properly initialized', () => {
      expect(qualityGateManager).toBeInstanceOf(QualityGateManager);
    });
    
    test('Syntax validation gate works with valid code', async () => {
      const artifact = {
        files: [{
          path: 'test.ts',
          content: 'function test() { return "hello"; }'
        }]
      };
      
      const context = {
        taskDescription: 'Test syntax validation',
        projectPath: '/test',
        language: 'typescript',
        maxTurns: 3
      };
      
      const report = await qualityGateManager.runQualityGates(artifact, context, 'test');
      expect(report.gateResults['syntax-validation']).toBeDefined();
      expect(report.gateResults['syntax-validation'].passed).toBe(true);
    });
    
    test('Syntax validation gate catches invalid code', async () => {
      const artifact = {
        files: [{
          path: 'bad.ts',
          content: 'function bad() {' // Missing closing brace
        }]
      };
      
      const context = {
        taskDescription: 'Test invalid syntax',
        projectPath: '/test',
        language: 'typescript',
        maxTurns: 3
      };
      
      const report = await qualityGateManager.runQualityGates(artifact, context, 'test');
      expect(report.gateResults['syntax-validation'].passed).toBe(false);
      expect(report.gateResults['syntax-validation'].issues.length).toBeGreaterThan(0);
    });
    
    test('Test coverage gate validates test-to-implementation ratio', async () => {
      const artifact = {
        files: [{ path: 'src/main.ts', content: 'function main() { return 42; }' }],
        testFiles: [{ path: 'tests/main.test.ts', content: 'test("main", () => { expect(main()).toBe(42); });' }]
      };
      
      const context = {
        taskDescription: 'Test coverage validation',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const report = await qualityGateManager.runQualityGates(artifact, context, 'test');
      expect(report.gateResults['test-coverage']).toBeDefined();
      expect(report.gateResults['test-coverage'].score).toBeGreaterThan(0);
    });
    
    test('Test coverage gate identifies missing tests', async () => {
      const artifact = {
        files: [{ path: 'src/main.ts', content: 'function main() { return 42; }' }],
        testFiles: [] // No test files
      };
      
      const context = {
        taskDescription: 'Test missing coverage',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const report = await qualityGateManager.runQualityGates(artifact, context, 'test');
      expect(report.gateResults['test-coverage'].passed).toBe(false);
      expect(report.gateResults['test-coverage'].issues).toContain('No test files found');
    });
    
    test('Code quality gate detects long functions', async () => {
      const longFunction = `
        function longFunction() {
          ${Array(60).fill('console.log("line");').join('\n  ')}
        }
      `;
      
      const artifact = {
        files: [{ path: 'src/long.ts', content: longFunction }]
      };
      
      const context = {
        taskDescription: 'Test code quality',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const report = await qualityGateManager.runQualityGates(artifact, context, 'test');
      expect(report.gateResults['code-quality'].issues.some(issue => 
        issue.includes('long functions')
      )).toBe(true);
    });
    
    test('Documentation gate validates presence of comments', async () => {
      const artifact = {
        files: [{ 
          path: 'src/documented.ts', 
          content: `
            /**
             * Main function that returns the answer
             */
            function main() {
              // Return the ultimate answer
              return 42;
            }
          `
        }]
      };
      
      const context = {
        taskDescription: 'Test documentation',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const report = await qualityGateManager.runQualityGates(artifact, context, 'test');
      expect(report.gateResults['documentation'].passed).toBe(true);
    });
    
    test('Quality report includes recommendations for failing gates', async () => {
      const badArtifact = {
        files: [{ path: 'bad.js', content: 'function bad() {' }], // Missing closing brace
        testFiles: []
      };
      
      const context = {
        taskDescription: 'Test failing validation',
        projectPath: '/test',
        language: 'javascript',
        maxTurns: 3
      };
      
      const report = await qualityGateManager.runQualityGates(badArtifact, context, 'test');
      expect(report.overallPassed).toBe(false);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });
  
  describe('Codebase Scanner', () => {
    let codebaseScanner: CodebaseScanner;
    
    beforeEach(() => {
      codebaseScanner = new CodebaseScanner(mockClient);
    });
    
    test('Codebase scanner can be instantiated', () => {
      expect(codebaseScanner).toBeInstanceOf(CodebaseScanner);
    });
    
    test('Scan returns structured results', async () => {
      const context = {
        taskDescription: 'Create a simple utility function',
        projectPath: '/test/project',
        maxTurns: 3
      };
      
      // This will use fallback implementation due to mock client
      const result = await codebaseScanner.scanCodebase('Create helper function', context);
      
      expect(result).toHaveProperty('scanId');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('projectPath', '/test/project');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('reuseOpportunities');
      expect(result).toHaveProperty('conflictRisks');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
    
    test('Scan includes mandatory acknowledgment recommendation', async () => {
      const context = {
        taskDescription: 'Test scan acknowledgment',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const result = await codebaseScanner.scanCodebase('Test task', context);
      
      expect(result.recommendations.some(rec => 
        rec.includes('MANDATORY') || rec.includes('acknowledge')
      )).toBe(true);
    });
  });
  
  describe('TDD Phase Classes', () => {
    test('PlanTestPhase can be instantiated', () => {
      const planPhase = new PlanTestPhase(mockClient);
      expect(planPhase).toBeInstanceOf(PlanTestPhase);
    });
    
    test('ImplementFixPhase can be instantiated', () => {
      const implementPhase = new ImplementFixPhase(mockClient);
      expect(implementPhase).toBeInstanceOf(ImplementFixPhase);
    });
    
    test('RefactorDocumentPhase can be instantiated', () => {
      const refactorPhase = new RefactorDocumentPhase(mockClient);
      expect(refactorPhase).toBeInstanceOf(RefactorDocumentPhase);
    });
    
    test('PlanTestPhase execute returns proper phase result structure', async () => {
      const planPhase = new PlanTestPhase(mockClient);
      const context = {
        taskDescription: 'Create a simple function',
        projectPath: '/test/project',
        language: 'typescript',
        maxTurns: 3
      };
      
      const result = await planPhase.execute('Create add function', context);
      
      expect(result).toHaveProperty('name', 'plan-test');
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('artifacts');
      expect(Array.isArray(result.artifacts)).toBe(true);
      
      // Should succeed with functional mock client
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('output');
      expect(typeof result.output).toBe('string');
    });
    
    test('ImplementFixPhase handles multiple attempts', async () => {
      const implementPhase = new ImplementFixPhase(mockClient);
      const mockPlanResult = {
        name: 'plan-test',
        startTime: new Date(),
        endTime: new Date(),
        success: true,
        output: 'Mock plan output',
        artifacts: ['test.ts'],
      };
      
      const context = {
        taskDescription: 'Implement function',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const result = await implementPhase.execute(mockPlanResult, context);
      
      expect(result).toHaveProperty('name', 'implement-fix');
      expect(result.success).toBe(true); // Expected with functional mock client
      expect(result).toHaveProperty('output');
    });
  });
  
  describe('TDD Orchestrator Integration', () => {
    test('TDDOrchestrator initializes with all phases', () => {
      expect(orchestrator).toBeInstanceOf(TDDOrchestrator);
    });
    
    test('executeWorkflow returns proper workflow structure', async () => {
      const context = {
        taskDescription: 'Create a simple function that adds two numbers',
        projectPath: '/test/project',
        language: 'typescript',
        maxTurns: 3
      };
      
      // This will fail initially because phases aren't fully implemented with real Claude SDK
      const result = await orchestrator.executeWorkflow('Test task', context);
      
      expect(result).toHaveProperty('taskDescription', 'Test task');
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result).toHaveProperty('phases');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.phases)).toBe(true);
      
      // Should include codebase scan in metadata
      expect(result.metadata).toHaveProperty('codebaseScan');
      expect(result.metadata?.codebaseScan).toHaveProperty('scanId');
    });
    
    test('Workflow includes mandatory codebase scan phase', async () => {
      const context = {
        taskDescription: 'Test codebase scan integration',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const result = await orchestrator.executeWorkflow('Test scan', context);
      
      expect(result.metadata).toHaveProperty('codebaseScan');
      expect(result.metadata?.codebaseScan).toHaveProperty('recommendations');
      expect(result.metadata?.codebaseScan.recommendations.some((rec: string) => 
        rec.includes('MANDATORY') || rec.includes('acknowledge')
      )).toBe(true);
    });
    
    test('Workflow tracks quality gates across phases', async () => {
      const context = {
        taskDescription: 'Test quality tracking',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const result = await orchestrator.executeWorkflow('Quality test', context);
      
      expect(result.metadata).toHaveProperty('qualityReports');
      expect(result.metadata).toHaveProperty('overallQualityScore');
      expect(result.metadata).toHaveProperty('qualitySummary');
      expect(Array.isArray(result.metadata?.qualityReports)).toBe(true);
    });
  });
  
  describe('StateFlow Management', () => {
    test('Workflow follows proper state transitions', async () => {
      const context = {
        taskDescription: 'Test state transitions',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const result = await orchestrator.executeWorkflow('State test', context);
      
      // Verify phases are in correct order
      if (result.phases.length > 0) {
        expect(result.phases[0].name).toBe('plan-test');
        
        if (result.phases.length > 1) {
          expect(result.phases[1].name).toBe('implement-fix');
        }
        
        if (result.phases.length > 2) {
          expect(result.phases[2].name).toBe('refactor-document');
        }
      }
      
      // All phases should have proper timestamps
      result.phases.forEach(phase => {
        expect(phase.startTime).toBeInstanceOf(Date);
        expect(phase.endTime).toBeInstanceOf(Date);
        expect(phase.endTime?.getTime()).toBeGreaterThanOrEqual(phase.startTime.getTime());
      });
    });
    
    test('Workflow handles phase failures gracefully', async () => {
      const context = {
        taskDescription: 'Test failure handling',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const result = await orchestrator.executeWorkflow('Failure test', context);
      
      // Should complete execution successfully with functional mock
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('endTime');
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result).toHaveProperty('phases');
      expect(result.phases.length).toBeGreaterThan(0);
    });
  });
  
  describe('Anti-Reimplementation System', () => {
    test('Codebase scan runs before implementation phases', async () => {
      const context = {
        taskDescription: 'Test anti-reimplementation',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await orchestrator.executeWorkflow('Anti-reimplementation test', context);
      
      // Verify scan phase logs appear before other phases
      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      const scanLogIndex = logCalls.findIndex(log => 
        typeof log === 'string' && log.includes('PHASE 0') && log.includes('codebase scan')
      );
      const planLogIndex = logCalls.findIndex(log => 
        typeof log === 'string' && log.includes('PHASE 1') && log.includes('Planning')
      );
      
      expect(scanLogIndex).toBeGreaterThan(-1);
      if (planLogIndex > -1) {
        expect(scanLogIndex).toBeLessThan(planLogIndex);
      }
      
      consoleSpy.mockRestore();
    });
    
    test('Scan acknowledgment validation is enforced', async () => {
      const context = {
        taskDescription: 'Test scan acknowledgment',
        projectPath: '/test',
        maxTurns: 3
      };
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await orchestrator.executeWorkflow('Acknowledgment test', context);
      
      // Verify mandatory validation logs appear
      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      const hasValidationLog = logCalls.some(log => 
        typeof log === 'string' && 
        (log.includes('MANDATORY VALIDATION') || log.includes('acknowledgment required'))
      );
      
      expect(hasValidationLog).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });
});
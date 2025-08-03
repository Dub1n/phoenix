// tests/integration/advanced-cli.test.ts
import { AdvancedCLI } from '../../src/cli/advanced-cli';
import { ProgressTracker } from '../../src/cli/progress-tracker';
import { HelpSystem } from '../../src/cli/help-system';
import { InteractivePrompts } from '../../src/cli/interactive';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Phase 7: Advanced CLI Interface', () => {
  const testOutputPath = path.join(__dirname, 'test-output');
  
  beforeEach(async () => {
    await fs.mkdir(testOutputPath, { recursive: true });
  });
  
  afterEach(async () => {
    await fs.rm(testOutputPath, { recursive: true, force: true });
  });
  
  describe('Progress Tracking System', () => {
    test('ProgressTracker can track multi-phase workflows', async () => {
      const tracker = new ProgressTracker('Test Workflow', 3);
      
      expect(tracker.getCurrentPhase()).toBe(0);
      expect(tracker.getProgress()).toBe(0);
      
      tracker.startPhase('Planning & Testing');
      expect(tracker.getCurrentPhase()).toBe(1);
      expect(tracker.getCurrentPhaseName()).toBe('Planning & Testing');
      
      tracker.completePhase();
      expect(tracker.getProgress()).toBeCloseTo(0.33, 2);
    });
    
    test('Progress tracker supports substeps within phases', async () => {
      const tracker = new ProgressTracker('Complex Workflow', 2);
      
      tracker.startPhase('Implementation', 3); // 3 substeps
      expect(tracker.getPhaseProgress()).toBe(0);
      
      tracker.completeSubstep('Code generation');
      expect(tracker.getPhaseProgress()).toBeCloseTo(0.33, 2);
      
      tracker.completeSubstep('Testing');
      expect(tracker.getPhaseProgress()).toBeCloseTo(0.67, 2);
    });
  });
  
  describe('Context-Aware Help System', () => {
    test('HelpSystem provides contextual help based on project state', async () => {
      const helpSystem = new HelpSystem();
      
      // Test basic help
      const basicHelp = await helpSystem.getContextualHelp('/test/project');
      expect(basicHelp).toContain('phoenix-code-lite generate');
      
      // Test help with existing config
      await fs.writeFile(path.join(testOutputPath, '.phoenix-code-lite.json'), '{}');
      const configHelp = await helpSystem.getContextualHelp(testOutputPath);
      expect(configHelp).toContain('Configuration found');
    });
    
    test('Help system provides command examples', () => {
      const helpSystem = new HelpSystem();
      
      const examples = helpSystem.getCommandExamples('generate');
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].command).toContain('--task');
    });
  });
  
  describe('Interactive Prompts', () => {
    test('InteractivePrompts can validate user input', async () => {
      const prompts = new InteractivePrompts();
      
      // Test task description validation
      const isValid = prompts.validateTaskDescription('Create a simple calculator');
      expect(isValid).toBe(true);
      
      const isEmpty = prompts.validateTaskDescription('');
      expect(isEmpty).toBe(false);
    });
    
    test('Interactive prompts can generate configuration wizard', () => {
      const prompts = new InteractivePrompts();
      
      const wizardQuestions = prompts.getConfigurationWizard();
      expect(wizardQuestions.length).toBeGreaterThan(0);
      expect(wizardQuestions[0].name).toBe('projectType');
    });
  });
  
  describe('Advanced CLI Features', () => {
    test('AdvancedCLI supports command history', async () => {
      const cli = new AdvancedCLI(testOutputPath);
      
      await cli.recordCommand('generate', { task: 'test task' });
      const history = await cli.getCommandHistory();
      
      expect(history.length).toBe(1);
      expect(history[0].command).toBe('generate');
    });
    
    test('CLI can generate completion suggestions', () => {
      const cli = new AdvancedCLI();
      
      const suggestions = cli.getCompletionSuggestions('gen');
      expect(suggestions).toContain('generate');
      
      const flagSuggestions = cli.getCompletionSuggestions('generate --');
      expect(flagSuggestions).toContain('--task');
    });
  });
  
  describe('Report Generation', () => {
    test('Can generate structured workflow reports', async () => {
      const cli = new AdvancedCLI(testOutputPath);
      
      const mockWorkflowResult = {
        taskDescription: 'Test workflow',
        startTime: new Date(),
        success: true,
        duration: 5000,
        phases: [
          { name: 'plan-test', startTime: new Date(), endTime: new Date(Date.now() + 2000), success: true, artifacts: [] },
          { name: 'implement-fix', startTime: new Date(), endTime: new Date(Date.now() + 3000), success: true, artifacts: [] }
        ],
        artifacts: ['test.js', 'implementation.js']
      };
      
      const report = await cli.generateWorkflowReport(mockWorkflowResult);
      expect(report).toContain('Workflow Summary');
      expect(report).toContain('Test workflow');
      expect(report).toContain('✓ SUCCESS');
    });
    
    test('Can export reports in multiple formats', async () => {
      const cli = new AdvancedCLI(testOutputPath);
      
      const mockResult = {
        taskDescription: 'Export test',
        startTime: new Date(),
        success: true,
        duration: 1000,
        phases: [],
        artifacts: []
      };
      
      await cli.exportReport(mockResult, 'json', path.join(testOutputPath, 'report.json'));
      const reportExists = await fs.access(path.join(testOutputPath, 'report.json')).then(() => true).catch(() => false);
      expect(reportExists).toBe(true);
    });
  });
});
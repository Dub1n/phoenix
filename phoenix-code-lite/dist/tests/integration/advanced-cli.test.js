"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// tests/integration/advanced-cli.test.ts
const advanced_cli_1 = require("../../src/cli/advanced-cli");
const progress_tracker_1 = require("../../src/cli/progress-tracker");
const help_system_1 = require("../../src/cli/help-system");
const interactive_1 = require("../../src/cli/interactive");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
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
            const tracker = new progress_tracker_1.ProgressTracker('Test Workflow', 3);
            expect(tracker.getCurrentPhase()).toBe(0);
            expect(tracker.getProgress()).toBe(0);
            tracker.startPhase('Planning & Testing');
            expect(tracker.getCurrentPhase()).toBe(1);
            expect(tracker.getCurrentPhaseName()).toBe('Planning & Testing');
            tracker.completePhase();
            expect(tracker.getProgress()).toBeCloseTo(0.33, 2);
        });
        test('Progress tracker supports substeps within phases', async () => {
            const tracker = new progress_tracker_1.ProgressTracker('Complex Workflow', 2);
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
            const helpSystem = new help_system_1.HelpSystem();
            // Test basic help
            const basicHelp = await helpSystem.getContextualHelp('/test/project');
            expect(basicHelp).toContain('phoenix-code-lite generate');
            // Test help with existing config
            await fs.writeFile(path.join(testOutputPath, '.phoenix-code-lite.json'), '{}');
            const configHelp = await helpSystem.getContextualHelp(testOutputPath);
            expect(configHelp).toContain('Configuration found');
        });
        test('Help system provides command examples', () => {
            const helpSystem = new help_system_1.HelpSystem();
            const examples = helpSystem.getCommandExamples('generate');
            expect(examples.length).toBeGreaterThan(0);
            expect(examples[0].command).toContain('--task');
        });
    });
    describe('Interactive Prompts', () => {
        test('InteractivePrompts can validate user input', async () => {
            const prompts = new interactive_1.InteractivePrompts();
            // Test task description validation
            const isValid = prompts.validateTaskDescription('Create a simple calculator');
            expect(isValid).toBe(true);
            const isEmpty = prompts.validateTaskDescription('');
            expect(isEmpty).toBe(false);
        });
        test('Interactive prompts can generate configuration wizard', () => {
            const prompts = new interactive_1.InteractivePrompts();
            const wizardQuestions = prompts.getConfigurationWizard();
            expect(wizardQuestions.length).toBeGreaterThan(0);
            expect(wizardQuestions[0].name).toBe('projectType');
        });
    });
    describe('Advanced CLI Features', () => {
        test('AdvancedCLI supports command history', async () => {
            const cli = new advanced_cli_1.AdvancedCLI(testOutputPath);
            await cli.recordCommand('generate', { task: 'test task' });
            const history = await cli.getCommandHistory();
            expect(history.length).toBe(1);
            expect(history[0].command).toBe('generate');
        });
        test('CLI can generate completion suggestions', () => {
            const cli = new advanced_cli_1.AdvancedCLI();
            const suggestions = cli.getCompletionSuggestions('gen');
            expect(suggestions).toContain('generate');
            const flagSuggestions = cli.getCompletionSuggestions('generate --');
            expect(flagSuggestions).toContain('--task');
        });
    });
    describe('Report Generation', () => {
        test('Can generate structured workflow reports', async () => {
            const cli = new advanced_cli_1.AdvancedCLI(testOutputPath);
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
            const cli = new advanced_cli_1.AdvancedCLI(testOutputPath);
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
//# sourceMappingURL=advanced-cli.test.js.map
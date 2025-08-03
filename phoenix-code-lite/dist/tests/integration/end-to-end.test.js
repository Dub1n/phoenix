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
// tests/integration/end-to-end.test.ts
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const e2e_runner_1 = require("../../src/testing/e2e-runner");
const performance_1 = require("../../src/testing/performance");
const mock_claude_1 = require("../../src/testing/mock-claude");
describe('Phase 8: Integration Testing & Documentation', () => {
    const testProjectPath = (0, path_1.join)(__dirname, 'test-project');
    let mockServer;
    beforeAll(async () => {
        // Set up test project environment
        await fs_1.promises.mkdir(testProjectPath, { recursive: true });
        // Start mock Claude server for testing
        mockServer = new mock_claude_1.MockClaudeServer();
        await mockServer.start();
    });
    afterAll(async () => {
        await mockServer.stop();
        await fs_1.promises.rm(testProjectPath, { recursive: true, force: true });
    });
    describe('End-to-End Workflow Testing', () => {
        test('Complete workflow from CLI to file generation', async () => {
            const e2e = new e2e_runner_1.PhoenixCodeLiteE2E(testProjectPath);
            // Test complete workflow
            const result = await e2e.runWorkflow({
                task: 'Create a simple calculator function',
                framework: 'none',
                language: 'javascript',
                expectFiles: ['calculator.js', 'calculator.test.js'],
                expectTests: true,
                expectDocumentation: true,
            });
            expect(result.success).toBe(true);
            expect(result.filesGenerated.length).toBeGreaterThan(0);
            expect(result.testsPass).toBe(true);
            expect(result.duration).toBeLessThan(30000); // Max 30 seconds
        });
        test('Error recovery and retry mechanisms', async () => {
            const e2e = new e2e_runner_1.PhoenixCodeLiteE2E(testProjectPath);
            // Test with intentional failure scenario
            mockServer.setResponseMode('intermittent-failure');
            const result = await e2e.runWorkflow({
                task: 'Create a function that will trigger retry logic',
                maxAttempts: 3,
                expectRetries: true,
            });
            expect(result.retryCount).toBeGreaterThan(0);
            expect(result.retryCount).toBeLessThanOrEqual(3);
        });
        test('Configuration template workflows', async () => {
            const e2e = new e2e_runner_1.PhoenixCodeLiteE2E(testProjectPath);
            const templates = ['starter', 'enterprise', 'performance'];
            for (const template of templates) {
                const result = await e2e.runConfigurationWorkflow(template);
                expect(result.configCreated).toBe(true);
                expect(result.configValid).toBe(true);
                // Test that configuration affects workflow behavior
                const workflowResult = await e2e.runWorkflow({
                    task: `Test ${template} template workflow`,
                    useExistingConfig: true,
                });
                expect(workflowResult.success).toBe(true);
                // Validate template-specific behavior
                if (template === 'enterprise') {
                    expect(workflowResult.qualityScore).toBeGreaterThan(0.9);
                }
                if (template === 'performance') {
                    expect(workflowResult.duration).toBeLessThan(15000);
                }
            }
        });
    });
    describe('Performance Testing', () => {
        test('Workflow performance benchmarks', async () => {
            const benchmark = new performance_1.PerformanceBenchmark();
            const results = await benchmark.runBenchmarkSuite([
                {
                    name: 'Simple Function Generation',
                    task: 'Create a function that adds two numbers',
                    expectedDuration: 10000,
                    iterations: 5,
                },
                {
                    name: 'Complex Component Generation',
                    task: 'Create a React component with state and event handlers',
                    expectedDuration: 20000,
                    iterations: 3,
                },
                {
                    name: 'API Endpoint Generation',
                    task: 'Create Express.js API endpoint with validation',
                    expectedDuration: 15000,
                    iterations: 3,
                },
            ]);
            results.forEach((result, index) => {
                const expectedDuration = [10000, 20000, 15000][index]; // Match the test configuration
                expect(result.averageDuration).toBeLessThan(expectedDuration);
                expect(result.successRate).toBeGreaterThan(0.8);
                expect(result.memoryUsage.peak).toBeLessThan(200 * 1024 * 1024); // 200MB
            });
        });
        test('Concurrent workflow handling', async () => {
            const benchmark = new performance_1.PerformanceBenchmark();
            const concurrentResult = await benchmark.runConcurrentTest({
                concurrency: 3,
                task: 'Create utility functions for concurrent testing',
                timeout: 45000,
            });
            expect(concurrentResult.allSucceeded).toBe(true);
            expect(concurrentResult.totalDuration).toBeLessThan(45000);
            expect(concurrentResult.averageQueueTime).toBeLessThan(5000);
        });
    });
    describe('Documentation Generation', () => {
        test('API documentation is generated correctly', async () => {
            const docsPath = (0, path_1.join)(testProjectPath, 'docs');
            // Generate API documentation
            const docGenerator = new (await Promise.resolve().then(() => __importStar(require('../../src/docs/generator')))).DocumentationGenerator();
            await docGenerator.generateAPIDocs(docsPath);
            // Verify documentation files exist
            const apiDocsExist = await fs_1.promises.access((0, path_1.join)(docsPath, 'api.md')).then(() => true).catch(() => false);
            expect(apiDocsExist).toBe(true);
            // Verify content quality
            const apiContent = await fs_1.promises.readFile((0, path_1.join)(docsPath, 'api.md'), 'utf-8');
            expect(apiContent).toContain('## TDDOrchestrator');
            expect(apiContent).toContain('### Methods');
            expect(apiContent).toContain('```typescript');
        });
        test('User guide generation with examples', async () => {
            const docsPath = (0, path_1.join)(testProjectPath, 'docs');
            const docGenerator = new (await Promise.resolve().then(() => __importStar(require('../../src/docs/generator')))).DocumentationGenerator();
            await docGenerator.generateUserGuide(docsPath);
            const userGuideExists = await fs_1.promises.access((0, path_1.join)(docsPath, 'user-guide.md')).then(() => true).catch(() => false);
            expect(userGuideExists).toBe(true);
            const guideContent = await fs_1.promises.readFile((0, path_1.join)(docsPath, 'user-guide.md'), 'utf-8');
            expect(guideContent).toContain('# Phoenix-Code-Lite User Guide');
            expect(guideContent).toContain('## Getting Started');
            expect(guideContent).toContain('## Examples');
        });
    });
    describe('CLI Integration Testing', () => {
        test('All CLI commands work end-to-end', async () => {
            const commands = [
                ['init', '--force'],
                ['config', '--show'],
                ['generate', '--task', 'Create a test function', '--max-attempts', '2'],
                ['history'],
                ['help', '--contextual'],
            ];
            for (const command of commands) {
                const result = await runCLICommand(command);
                expect(result.exitCode).toBe(0);
                expect(result.stderr).toBe('');
            }
        }, 60000);
        test('Error handling across all commands', async () => {
            const errorScenarios = [
                {
                    command: ['generate'],
                    expectedError: 'required option',
                },
                {
                    command: ['config', '--invalid-flag'],
                    expectedError: 'unknown option',
                },
                {
                    command: ['generate', '--task', 'x'], // Too short
                    expectedError: 'Task description must be',
                },
            ];
            for (const scenario of errorScenarios) {
                const result = await runCLICommand(scenario.command);
                expect(result.exitCode).not.toBe(0);
                expect(result.stderr.toLowerCase()).toContain(scenario.expectedError.toLowerCase());
            }
        });
    });
});
async function runCLICommand(args) {
    return new Promise((resolve) => {
        const child = (0, child_process_1.spawn)('node', ['dist/index.js', ...args], {
            stdio: 'pipe',
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        child.on('close', (code) => {
            resolve({
                exitCode: code || 0,
                stdout,
                stderr,
            });
        });
    });
}
//# sourceMappingURL=end-to-end.test.js.map
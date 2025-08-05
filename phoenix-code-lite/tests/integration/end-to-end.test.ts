// tests/integration/end-to-end.test.ts
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PhoenixCodeLiteE2E } from '../../src/testing/e2e-runner';
import { PerformanceBenchmark } from '../../src/testing/performance';
import { MockClaudeServer } from '../../src/testing/mock-claude';

describe('Phase 8: Integration Testing & Documentation', () => {
  const testProjectPath = join(__dirname, 'test-project');
  let mockServer: MockClaudeServer;
  
  beforeAll(async () => {
    // Set up test project environment
    await fs.mkdir(testProjectPath, { recursive: true });
    
    // Start mock Claude server for testing
    mockServer = new MockClaudeServer();
    await mockServer.start();
  });
  
  afterAll(async () => {
    // Ensure proper cleanup
    if (mockServer) {
      await mockServer.stop();
    }
    try {
      await fs.rm(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  
  afterEach(async () => {
    // Clean up any hanging processes
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  describe('End-to-End Workflow Testing', () => {
    test('Complete workflow from CLI to file generation', async () => {
      const e2e = new PhoenixCodeLiteE2E(testProjectPath);
      
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
      const e2e = new PhoenixCodeLiteE2E(testProjectPath);
      
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
      const e2e = new PhoenixCodeLiteE2E(testProjectPath);
      
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
      const benchmark = new PerformanceBenchmark();
      
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
      const benchmark = new PerformanceBenchmark();
      
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
      const docsPath = join(testProjectPath, 'docs');
      
      // Generate API documentation
      const docGenerator = new (await import('../../src/docs/generator')).DocumentationGenerator();
      await docGenerator.generateAPIDocs(docsPath);
      
      // Verify documentation files exist
      const apiDocsExist = await fs.access(join(docsPath, 'api.md')).then(() => true).catch(() => false);
      expect(apiDocsExist).toBe(true);
      
      // Verify content quality
      const apiContent = await fs.readFile(join(docsPath, 'api.md'), 'utf-8');
      expect(apiContent).toContain('## TDDOrchestrator');
      expect(apiContent).toContain('### Methods');
      expect(apiContent).toContain('```typescript');
    });
    
    test('User guide generation with examples', async () => {
      const docsPath = join(testProjectPath, 'docs');
      
      const docGenerator = new (await import('../../src/docs/generator')).DocumentationGenerator();
      await docGenerator.generateUserGuide(docsPath);
      
      const userGuideExists = await fs.access(join(docsPath, 'user-guide.md')).then(() => true).catch(() => false);
      expect(userGuideExists).toBe(true);
      
      const guideContent = await fs.readFile(join(docsPath, 'user-guide.md'), 'utf-8');
      expect(guideContent).toContain('# Phoenix-Code-Lite User Guide');
      expect(guideContent).toContain('## Getting Started');
      expect(guideContent).toContain('## Examples');
    });
  });
  
  describe('CLI Integration Testing', () => {
    test('Debug: Test basic CLI command execution', async () => {
      const result = await runCLICommand(['--version']);
      console.log('CLI Version Test Result:', result);
      expect(result.exitCode).toBe(0);
    }, 30000);
    
    test('Debug: Test help command', async () => {
      const result = await runCLICommand(['--help']);
      console.log('CLI Help Test Result:', result);
      expect(result.exitCode).toBe(0);
    }, 30000);
    
    test('Debug: Test config command', async () => {
      const result = await runCLICommand(['config', '--show']);
      console.log('CLI Config Test Result:', result);
      expect(result.exitCode).toBe(0);
    }, 30000);
    
    test('Debug: Test config command with timeout', async () => {
      const result = await runCLICommandWithTimeout(['config', '--show'], 5000);
      console.log('CLI Config Test Result (5s timeout):', result);
      // Don't expect success, just want to see what happens
    }, 10000);
    
    test('Debug: Test CLI argument parsing', async () => {
      const result = await runCLICommandWithTimeout(['--help'], 3000);
      console.log('CLI Help Test Result:', result);
      // This should work since --help is a basic command
    }, 10000);
    
    test('Debug: Test config command with shorter timeout', async () => {
      const result = await runCLICommandWithTimeout(['config', '--show'], 3000);
      console.log('CLI Config Test Result (3s timeout):', result);
      // Don't expect success, just want to see if we get any output
    }, 10000);
    
    test('Debug: Test configuration functionality directly', async () => {
      // Test the configuration functionality directly without CLI
      const { PhoenixCodeLiteConfig } = await import('../../src/config/settings');
      const { ConfigFormatter } = await import('../../src/cli/config-formatter');
      
      try {
        const config = await PhoenixCodeLiteConfig.load();
        const formattedConfig = ConfigFormatter.formatConfig(config.export());
        
        console.log('Direct Config Test Result:');
        console.log(formattedConfig);
        
        // Verify the configuration is valid
        const errors = config.validate();
        expect(errors.length).toBe(0);
        expect(config.get('version')).toBe('1.0.0');
        
      } catch (error) {
        console.error('Direct config test error:', error);
        throw error;
      }
    }, 10000);
    
    test('Debug: Test basic config command', async () => {
      const result = await runCLICommandWithTimeout(['config'], 3000);
      console.log('CLI Basic Config Test Result:', result);
      // This should show the help for config command
    }, 10000);
    
    test('All CLI commands work end-to-end', async () => {
      const commands = [
        ['--version'],
        ['--help'],
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

async function runCLICommand(args: string[]): Promise<{exitCode: number, stdout: string, stderr: string}> {
  return new Promise(async (resolve) => {
    const child = spawn('node', ['dist/src/index.js', ...args], {
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    let stdout = '';
    let stderr = '';
    let resolved = false;
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        try {
          // Close all pipes first
          child.stdin?.end();
          child.stdout?.destroy();
          child.stderr?.destroy();
          
          // Kill the process
          child.kill('SIGTERM');
          
          // Force kill after a short delay if needed
          setTimeout(() => {
            try {
              child.kill('SIGKILL');
            } catch (e) {
              // Ignore errors
            }
          }, 1000);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', async (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        
        // Wait for graceful shutdown to complete in test environment
        try {
          const { waitForCLIShutdown } = await import('../../src/utils/test-utils');
          await waitForCLIShutdown(child, 3000);
        } catch (error) {
          // Ignore shutdown timeout errors
        }
        
        resolve({
          exitCode: code || 0,
          stdout,
          stderr,
        });
      }
    });
    
    child.on('error', async (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        
        // Wait for graceful shutdown to complete in test environment
        try {
          const { waitForCLIShutdown } = await import('../../src/utils/test-utils');
          await waitForCLIShutdown(child, 3000);
        } catch (shutdownError) {
          // Ignore shutdown timeout errors
        }
        
        resolve({
          exitCode: 1,
          stdout: '',
          stderr: error.message,
        });
      }
    });
    
    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(async () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        
        // Wait for graceful shutdown to complete in test environment
        try {
          const { waitForCLIShutdown } = await import('../../src/utils/test-utils');
          await waitForCLIShutdown(child, 3000);
        } catch (error) {
          // Ignore shutdown timeout errors
        }
        
        resolve({
          exitCode: 1,
          stdout: '',
          stderr: 'Command timed out',
        });
      }
    }, 15000); // Increased timeout to 15 seconds
  });
}

async function runCLICommandWithTimeout(args: string[], timeoutMs: number): Promise<{exitCode: number, stdout: string, stderr: string}> {
  return new Promise((resolve) => {
    const child = spawn('node', ['dist/src/index.js', ...args], {
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let stdout = '';
    let stderr = '';
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        try {
          // Close all pipes first
          child.stdin?.end();
          child.stdout?.destroy();
          child.stderr?.destroy();
          
          // Kill the process
          child.kill('SIGTERM');
          
          // Force kill after a short delay if needed
          setTimeout(() => {
            try {
              child.kill('SIGKILL');
            } catch (e) {
              // Ignore errors
            }
          }, 1000);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve({
          exitCode: code || 0,
          stdout,
          stderr,
        });
      }
    });

    child.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve({
          exitCode: 1,
          stdout: '',
          stderr: error.message,
        });
      }
    });

    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve({
          exitCode: 1,
          stdout: '',
          stderr: 'Command timed out',
        });
      }
    }, timeoutMs);
  });
}
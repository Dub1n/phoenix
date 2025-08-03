import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface E2EWorkflowOptions {
  task: string;
  framework?: string;
  language?: string;
  maxAttempts?: number;
  expectFiles?: string[];
  expectTests?: boolean;
  expectDocumentation?: boolean;
  expectRetries?: boolean;
  useExistingConfig?: boolean;
}

export interface E2EWorkflowResult {
  success: boolean;
  duration: number;
  filesGenerated: string[];
  testsPass: boolean;
  qualityScore: number;
  retryCount: number;
  error?: string;
}

export class PhoenixCodeLiteE2E {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async runWorkflow(options: E2EWorkflowOptions): Promise<E2EWorkflowResult> {
    const startTime = Date.now();
    let filesGenerated: string[] = [];
    let testsPass = false;
    let qualityScore = 0;
    let retryCount = 0;

    try {
      // Build CLI command
      const args = [
        'dist/index.js',
        'generate',
        '--task', options.task,
      ];

      if (options.framework) {
        args.push('--framework', options.framework);
      }
      if (options.language) {
        args.push('--language', options.language);
      }
      if (options.maxAttempts) {
        args.push('--max-attempts', options.maxAttempts.toString());
      }

      // Execute workflow
      const result = await this.executeCommand(args);
      
      if (result.exitCode !== 0) {
        throw new Error(`Workflow failed: ${result.stderr}`);
      }

      // Analyze results
      const workflowData = await this.analyzeWorkflowResults();
      filesGenerated = workflowData.files;
      testsPass = workflowData.testsPass;
      qualityScore = workflowData.qualityScore;
      retryCount = workflowData.retryCount;

      // Validate expectations
      if (options.expectFiles) {
        for (const expectedFile of options.expectFiles) {
          if (!filesGenerated.includes(expectedFile)) {
            throw new Error(`Expected file not generated: ${expectedFile}`);
          }
        }
      }

      if (options.expectTests && !testsPass) {
        throw new Error('Expected tests to pass, but they failed');
      }

      return {
        success: true,
        duration: Date.now() - startTime,
        filesGenerated,
        testsPass,
        qualityScore,
        retryCount,
      };

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        filesGenerated,
        testsPass,
        qualityScore,
        retryCount,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async runConfigurationWorkflow(template: string): Promise<{configCreated: boolean, configValid: boolean}> {
    try {
      // Apply template
      await this.executeCommand([
        'dist/index.js',
        'config',
        '--template', template,
      ]);

      // Verify configuration was created
      const configPath = join(this.projectPath, '.phoenix-code-lite.json');
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);

      if (!configExists) {
        return { configCreated: false, configValid: false };
      }

      // Validate configuration
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      const isValid = this.validateConfigurationStructure(config);

      return {
        configCreated: true,
        configValid: isValid,
      };

    } catch (error) {
      return { configCreated: false, configValid: false };
    }
  }

  private async executeCommand(args: string[]): Promise<{exitCode: number, stdout: string, stderr: string}> {
    return new Promise((resolve) => {
      const child = spawn('node', args, {
        cwd: this.projectPath,
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

  private async analyzeWorkflowResults(): Promise<{
    files: string[];
    testsPass: boolean;
    qualityScore: number;
    retryCount: number;
  }> {
    const files: string[] = [];
    let testsPass = false;
    let qualityScore = 0;
    let retryCount = 0;

    try {
      // Check for generated files
      const projectFiles = await fs.readdir(this.projectPath);
      files.push(...projectFiles.filter(f => f.endsWith('.js') || f.endsWith('.ts')));

      // Check audit logs for test results and retry count
      const auditPath = join(this.projectPath, '.phoenix-code-lite', 'audit');
      try {
        const auditFiles = await fs.readdir(auditPath);
        const latestAudit = auditFiles.sort().pop();
        
        if (latestAudit) {
          const auditContent = await fs.readFile(join(auditPath, latestAudit), 'utf-8');
          const auditLines = auditContent.trim().split('\n');
          
          auditLines.forEach(line => {
            try {
              const event = JSON.parse(line);
              if (event.eventType === 'quality_gate' && event.data?.testsPassed) {
                testsPass = true;
              }
              if (event.metadata?.qualityScore) {
                qualityScore = Math.max(qualityScore, event.metadata.qualityScore);
              }
              if (event.eventType === 'agent_invocation' && event.data?.retryAttempt) {
                retryCount++;
              }
            } catch {
              // Skip invalid JSON lines
            }
          });
        }
      } catch {
        // No audit logs available
      }

    } catch (error) {
      console.warn('Failed to analyze workflow results:', error);
    }

    return { files, testsPass, qualityScore, retryCount };
  }

  private validateConfigurationStructure(config: any): boolean {
    const requiredFields = ['version', 'claude', 'tdd', 'output'];
    return requiredFields.every(field => field in config);
  }
}
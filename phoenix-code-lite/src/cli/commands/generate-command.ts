/**---
 * title: [Generate Command - CLI Command]
 * tags: [CLI, Command, Generation]
 * provides: [GenerateCommand]
 * requires: [IClaudeClient, IConfigManager, IAuditLogger, IFileSystem, TDDOrchestrator, ClaudeCodeClient]
 * description: [Executes TDD workflow to generate code using Claude Code with configuration awareness and validation.]
 * ---*/

import { IClaudeClient } from '../interfaces/claude-client';
import { IConfigManager } from '../interfaces/config-manager';
import { IAuditLogger } from '../interfaces/audit-logger';
import { IFileSystem } from '../interfaces/file-system';
import { TDDOrchestrator } from '../../tdd/orchestrator';
import { ClaudeCodeClient } from '../../claude/client';
import { ClaudeClientAdapter } from '../adapters/claude-client-adapter';
import { TaskContextSchema } from '../../types/workflow';
import { PhoenixCodeLiteOptions } from '../args';
import { safeExit } from '../../utils/test-utils';
import chalk from 'chalk';

export class GenerateCommand {
  constructor(
    private claudeClient: IClaudeClient,
    private configManager: IConfigManager,
    private auditLogger: IAuditLogger,
    private fileSystem: IFileSystem
  ) {}

  async execute(options: PhoenixCodeLiteOptions): Promise<void> {
    this.auditLogger.log('info', 'Generate command executed', { options });
    
    try {
      // Load configuration
      const config = await this.configManager.getConfig();
      
      // Apply CLI overrides to configuration
      if (options.verbose) {
        // In a real implementation, this would update the config
        this.auditLogger.log('debug', 'Verbose mode enabled');
      }
      if (options.maxAttempts) {
        // In a real implementation, this would update the config
        this.auditLogger.log('debug', `Max attempts set to: ${options.maxAttempts}`);
      }
      
      // Validate task context
      const context = {
        taskDescription: options.task,
        projectPath: options.projectPath || process.cwd(),
        language: options.language,
        framework: options.framework,
        maxTurns: config.performance.maxMemoryUsage, // Using a config value as example
      };
      
      // Validate using schema
      const validatedContext = TaskContextSchema.parse(context);
      
      // Create TDD orchestrator with adapter
      const realClient = new ClaudeCodeClient();
      const adapter = new ClaudeClientAdapter(realClient);
      const orchestrator = new TDDOrchestrator(realClient);
      
      this.auditLogger.log('info', 'Starting TDD workflow', { context: validatedContext });
      
      // Execute the workflow
      const result = await orchestrator.executeWorkflow(options.task, validatedContext);
      
      // Display results
      if (result.success) {
        console.log(chalk.green('✓ Phoenix-Code-Lite workflow completed successfully!'));
        console.log(chalk.gray(`Duration: ${result.duration}ms`));
        console.log(chalk.gray(`Phases completed: ${result.phases.length}`));
        
        if (options.verbose) {
          this.displayDetailedResults(result);
        }
      } else {
        console.log(chalk.red('✗ Phoenix-Code-Lite workflow failed'));
        console.log(chalk.red(`Error: ${result.error}`));
        
        safeExit(1);
      }
      
    } catch (error) {
      this.auditLogger.log('error', 'Generate command failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      console.error(chalk.red('Fatal error:'), error instanceof Error ? error.message : 'Unknown error');
      
      safeExit(1);
    }
  }

  private displayDetailedResults(result: any): void {
    console.log(chalk.blue('\nDetailed Results:'));
    console.log(chalk.gray('Phases:'));
    result.phases.forEach((phase: any, index: number) => {
      console.log(chalk.gray(`  ${index + 1}. ${phase.name}: ${phase.success ? '✓' : '✗'}`));
    });
  }
} 

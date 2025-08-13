/**---
 * title: [CLI Argument Parser - CLI Interface Module]
 * tags: [CLI, Interface, Command-Processing, TypeScript]
 * provides: [setupCLI Function, PhoenixCodeLiteOptions Type, Command Definitions]
 * requires: [commander, fs, path, Commands Hub]
 * description: [Defines Phoenix Code Lite command-line interface with commands (generate, init, wizard, config, template) and options parsing using Commander.]
 * ---*/

import { Command } from 'commander';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface PhoenixCodeLiteOptions {
  task: string;
  projectPath?: string;
  language?: string;
  framework?: string;
  verbose?: boolean;
  skipDocs?: boolean;
  maxAttempts?: number;
  withTests?: boolean;
  type?: 'component' | 'api' | 'service' | 'feature';
}

function getVersion(): string {
  try {
    // Try to read from package.json in the built distribution
    const packageJsonPath = join(__dirname, '..', '..', 'package.json');
    const packageData = require(packageJsonPath);
    return packageData.version || '1.0.0';
  } catch (error) {
    return '1.0.0';
  }
}

export function setupCLI(): Command {
  const program = new Command();
  
  program
    .name('phoenix-code-lite')
    .description('TDD workflow orchestrator for Claude Code')
    .version(getVersion(), '-v, --version', 'display version number');
  
  program
    .command('generate')
    .description('Generate code using the TDD workflow')
    .requiredOption('-t, --task <description>', 'Task description')
    .option('-p, --project-path <path>', 'Project path', process.cwd())
    .option('-l, --language <lang>', 'Programming language')
    .option('-f, --framework <framework>', 'Framework to use')
    .option('-m, --max-attempts <number>', 'Maximum implementation attempts', '3')
    .option('-v, --verbose', 'Verbose output', false)
    .option('--skip-docs', 'Skip documentation generation', false)
    .option('--with-tests', 'Include comprehensive test generation', false)
    .option('--type <type>', 'Generation type (component|api|service|feature)', 'feature')
    .action(async (options: PhoenixCodeLiteOptions) => {
      const { generateCommand } = await import('./commands');
      await generateCommand(options);
    });
  
  program
    .command('init')
    .description('Initialize Phoenix-Code-Lite in current directory')
    .option('-f, --force', 'Overwrite existing configuration')
    .option('--template <name>', 'Apply configuration template (starter|enterprise|performance)')
    .action(async (options) => {
      const { initCommand } = await import('./commands');
      await initCommand(options);
    });

  program
    .command('wizard')
    .description('Interactive setup wizard for first-time configuration')
    .action(async () => {
      const { wizardCommand } = await import('./enhanced-commands');
      await wizardCommand();
    });
  
  program
    .command('config')
    .description('Manage Phoenix-Code-Lite configuration')
    .option('--show', 'Show current configuration')
    .option('--edit', 'Interactive configuration editor')
    .option('--template <name>', 'Apply configuration template (starter|enterprise|performance)')
    .option('--use <name>', 'Switch to configuration template')
    .option('--adjust <name>', 'Adjust template settings')
    .option('--add <name>', 'Create new template')
    .action(async (options) => {
      const { configCommand } = await import('./commands');
      await configCommand(options);
    });

  program
    .command('template')
    .description('Interactive template management (replaces config template subcommands)')
    .action(async (options) => {
      const { templateCommand } = await import('./commands');
      await templateCommand(options);
    });
  
  return program;
}

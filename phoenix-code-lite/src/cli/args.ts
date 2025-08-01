import { Command } from 'commander';

export interface PhoenixCodeLiteOptions {
  task: string;
  projectPath?: string;
  language?: string;
  framework?: string;
  verbose?: boolean;
  skipDocs?: boolean;
  maxAttempts?: number;
}

export function setupCLI(): Command {
  const program = new Command();
  
  program
    .name('phoenix-code-lite')
    .description('TDD workflow orchestrator for Claude Code')
    .version('1.0.0');
  
  program
    .command('generate')
    .description('Generate code using the TDD workflow')
    .requiredOption('-t, --task <description>', 'Task description')
    .option('-p, --project-path <path>', 'Project path', process.cwd())
    .option('-l, --language <lang>', 'Programming language')
    .option('-f, --framework <framework>', 'Framework to use')
    .option('-v, --verbose', 'Verbose output', false)
    .option('--skip-docs', 'Skip documentation generation', false)
    .option('--max-attempts <number>', 'Maximum implementation attempts', '3')
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
    .command('config')
    .description('Manage Phoenix-Code-Lite configuration')
    .option('--show', 'Show current configuration')
    .option('--reset', 'Reset to default configuration')
    .option('--template <name>', 'Apply configuration template (starter|enterprise|performance)')
    .action(async (options) => {
      const { configCommand } = await import('./commands');
      await configCommand(options);
    });
  
  return program;
}
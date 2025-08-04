import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export interface CommandExample {
  description: string;
  command: string;
  explanation?: string;
}

export class HelpSystem {
  private examples: Map<string, CommandExample[]> = new Map();

  constructor() {
    this.initializeExamples();
  }

  async getContextualHelp(projectPath: string = process.cwd()): Promise<string> {
    const context = await this.analyzeProjectContext(projectPath);
    let help = this.getBaseHelp();

    // Add contextual suggestions
    if (context.hasConfig) {
      help += this.getConfigFoundHelp();
    } else {
      help += this.getNoConfigHelp();
    }

    if (context.hasAuditLogs) {
      help += this.getAuditLogsHelp();
    }

    if (context.language) {
      help += this.getLanguageSpecificHelp(context.language);
    }

    try {
      const boxen = await import('boxen');
      return boxen.default(help, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      });
    } catch (error) {
      // Fallback without boxen styling
      return help;
    }
  }

  getCommandExamples(command: string): CommandExample[] {
    return this.examples.get(command) || [];
  }

  generateQuickReference(): string {
    const sections = [
      {
        title: 'Essential Commands',
        commands: [
          { cmd: 'phoenix-code-lite', desc: 'Start interactive CLI mode', opts: 'Recommended for beginners' },
          { cmd: 'phoenix-code-lite generate', desc: 'Generate code using TDD workflow', opts: '-t, --task <desc>' },
          { cmd: 'phoenix-code-lite init', desc: 'Initialize project configuration', opts: '-f, --force' },
          { cmd: 'phoenix-code-lite wizard', desc: 'Interactive first-time setup', opts: 'Guided configuration' }
        ]
      },
      {
        title: 'Configuration Management', 
        commands: [
          { cmd: 'phoenix-code-lite config --show', desc: 'Display current settings', opts: 'View active config' },
          { cmd: 'phoenix-code-lite config --edit', desc: 'Interactive config editor', opts: 'Modify settings' },
          { cmd: 'phoenix-code-lite template', desc: 'Template management hub', opts: 'starter|enterprise|performance' },
          { cmd: 'phoenix-code-lite config --reset', desc: 'Reset to defaults', opts: 'Emergency recovery' }
        ]
      },
      {
        title: 'Generate Command Options',
        commands: [
          { cmd: '-t, --task <desc>', desc: 'Task description (required)', opts: 'Natural language input' },
          { cmd: '--type <type>', desc: 'Generation type', opts: 'component|api|service|feature' },
          { cmd: '-f, --framework <name>', desc: 'Target framework', opts: 'react|vue|express|fastapi' },
          { cmd: '-l, --language <lang>', desc: 'Programming language', opts: 'typescript|javascript|python' },
          { cmd: '-m, --max-attempts <num>', desc: 'Maximum attempts', opts: 'default: 3, range: 1-10' },
          { cmd: '-v, --verbose', desc: 'Detailed output', opts: 'Shows TDD phases' },
          { cmd: '--with-tests', desc: 'Include comprehensive tests', opts: 'Enhanced testing' },
          { cmd: '--skip-docs', desc: 'Skip documentation generation', opts: 'Faster execution' }
        ]
      }
    ];

    let reference = chalk.bold.blue('🔥 Phoenix-Code-Lite Quick Reference Guide\n');
    reference += chalk.bold.gray('   TDD Workflow Orchestrator for Claude Code\n');
    reference += chalk.gray('═'.repeat(80)) + '\n\n';

    sections.forEach(section => {
      reference += chalk.yellow.bold(`${section.title}:\n`);
      reference += chalk.gray('─'.repeat(section.title.length + 1)) + '\n';
      
      section.commands.forEach(item => {
        const cmdPart = chalk.green(item.cmd.padEnd(35));
        const descPart = chalk.white(item.desc.padEnd(30));
        const optsPart = item.opts ? chalk.gray(item.opts) : '';
        reference += `  ${cmdPart} ${descPart} ${optsPart}\n`;
      });
      reference += '\n';
    });

    reference += chalk.blue('🖥️  Interactive Mode (Recommended):\n');
    reference += chalk.gray('─'.repeat(35)) + '\n';
    reference += chalk.cyan('  phoenix-code-lite') + chalk.gray(' - Start interactive CLI with guided navigation\n');
    reference += chalk.gray('  • Context-sensitive help and command completion\n');
    reference += chalk.gray('  • Visual menu system with Phoenix branding\n');
    reference += chalk.gray('  • Intelligent error handling and suggestions\n\n');
    
    reference += chalk.blue('💡 Usage Examples:\n');
    reference += chalk.gray('─'.repeat(18)) + '\n';
    reference += chalk.green('  # Generate React login component\n');
    reference += chalk.gray('  phoenix-code-lite generate -t "Create login form with validation" -f react --type component\n\n');
    reference += chalk.green('  # Build REST API with authentication\n');
    reference += chalk.gray('  phoenix-code-lite generate -t "User authentication API" --type api -f express --with-tests\n\n');
    reference += chalk.green('  # Apply enterprise configuration\n');
    reference += chalk.gray('  phoenix-code-lite config --use enterprise\n\n');
    reference += chalk.green('  # Interactive setup for new projects\n');
    reference += chalk.gray('  phoenix-code-lite wizard\n\n');
    
    reference += chalk.blue('📚 Additional Resources:\n');
    reference += chalk.gray('─'.repeat(22)) + '\n';
    reference += chalk.gray('  • Documentation: Run interactive mode for guided help\n');
    reference += chalk.gray('  • Templates: Use "template" command to explore configurations\n');
    reference += chalk.gray('  • TDD Workflow: Each generation follows Plan→Implement→Refactor phases\n');
    reference += chalk.gray('  • Quality Gates: Automated validation ensures production-ready code\n\n');

    return reference;
  }

  private async analyzeProjectContext(projectPath: string) {
    const context = {
      hasConfig: false,
      hasAuditLogs: false,
      language: null as string | null,
      framework: null as string | null,
    };

    try {
      // Check for configuration
      await fs.access(join(projectPath, '.phoenix-code-lite.json'));
      context.hasConfig = true;
    } catch {
      // No config file
    }

    try {
      // Check for audit logs
      await fs.access(join(projectPath, '.phoenix-code-lite', 'audit'));
      context.hasAuditLogs = true;
    } catch {
      // No audit logs
    }

    try {
      // Detect language from package.json
      const packageJson = await fs.readFile(join(projectPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(packageJson);
      
      if (pkg.dependencies) {
        if (pkg.dependencies.react) context.framework = 'react';
        else if (pkg.dependencies.vue) context.framework = 'vue';
        else if (pkg.dependencies.express) context.framework = 'express';
      }
      
      context.language = 'javascript';
    } catch {
      // No package.json, try other language files
      try {
        await fs.access(join(projectPath, 'requirements.txt'));
        context.language = 'python';
      } catch {
        // No Python project detected
      }
    }

    return context;
  }

  private getBaseHelp(): string {
    return chalk.bold.blue('🔥 Phoenix-Code-Lite CLI Help\n') +
           chalk.gray('═'.repeat(50)) + '\n' +
           chalk.bold('TDD Workflow Orchestrator for Claude Code\n\n') +
           'Phoenix-Code-Lite transforms natural language task descriptions into tested, \n' +
           'working code through a systematic 3-phase TDD workflow:\n\n' +
           chalk.yellow('• Phase 1: Plan & Test') + ' - Requirements analysis and comprehensive test planning\n' +
           chalk.yellow('• Phase 2: Implement & Fix') + ' - Clean code generation with iterative refinement\n' +
           chalk.yellow('• Phase 3: Refactor & Document') + ' - Code optimization and documentation\n\n' +
           chalk.bold('Quick Start:\n') +
           chalk.cyan('  phoenix-code-lite') + ' - Interactive CLI (recommended for beginners)\n' +
           chalk.cyan('  phoenix-code-lite generate --task "your description"') + ' - Direct generation\n\n';
  }

  private getConfigFoundHelp(): string {
    return chalk.green('✓ Configuration found\n') +
           chalk.gray('Your project is configured and ready for TDD workflow generation.\n') +
           chalk.blue('Quick actions:\n') +
           chalk.gray('  • ') + chalk.cyan('config --show') + chalk.gray(' - View current configuration\n') +
           chalk.gray('  • ') + chalk.cyan('template') + chalk.gray(' - Manage configuration templates\n') +
           chalk.gray('  • ') + chalk.cyan('generate -t "task"') + chalk.gray(' - Start TDD workflow\n\n');
  }

  private getNoConfigHelp(): string {
    return chalk.yellow('⚠  No Configuration Detected\n') +
           chalk.gray('Phoenix-Code-Lite will use default settings. For optimal performance:\n') +
           chalk.blue('Setup options:\n') +
           chalk.gray('  • ') + chalk.green('phoenix-code-lite init') + chalk.gray(' - Quick initialization\n') +
           chalk.gray('  • ') + chalk.green('phoenix-code-lite wizard') + chalk.gray(' - Interactive guided setup\n') +
           chalk.gray('  • ') + chalk.green('phoenix-code-lite template') + chalk.gray(' - Choose configuration template\n\n');
  }

  private getAuditLogsHelp(): string {
    return chalk.blue('📈 Audit & Metrics Available\n') +
           chalk.gray('Your project has workflow history and performance metrics.\n') +
           chalk.blue('Analysis options:\n') +
           chalk.gray('  • View metrics in interactive mode under Advanced → Metrics\n') +
           chalk.gray('  • Export data for external analysis (feature coming soon)\n') +
           chalk.gray('  • Track TDD workflow effectiveness and improvements\n\n');
  }

  private getLanguageSpecificHelp(language: string): string {
    const tips = {
      javascript: {
        emoji: '🟨',
        tip: 'JavaScript detected! Use --framework for React, Vue, or Express optimization.',
        examples: ['--framework react', '--framework vue', '--framework express']
      },
      typescript: {
        emoji: '🟦', 
        tip: 'TypeScript detected! Built-in type safety and modern ES features supported.',
        examples: ['--with-tests for type-safe testing', '--framework react for TSX components']
      },
      python: {
        emoji: '🐍',
        tip: 'Python detected! Excellent support for Flask, Django, and FastAPI projects.',
        examples: ['--framework fastapi', '--framework flask', '--framework django']
      }
    };

    const langInfo = tips[language as keyof typeof tips];
    if (langInfo) {
      let help = chalk.cyan(`${langInfo.emoji} ${langInfo.tip}\n`);
      help += chalk.gray('  Optimizations available:\n');
      langInfo.examples.forEach(example => {
        help += chalk.gray(`    • ${example}\n`);
      });
      return help + '\n';
    }
    
    return chalk.cyan(`📝 Language detected: ${language}\n`) +
           chalk.gray('  Phoenix-Code-Lite will adapt to your project structure.\n\n');
  }

  private initializeExamples(): void {
    this.examples.set('generate', [
      {
        description: 'Basic code generation',
        command: 'phoenix-code-lite generate --task "Create a simple calculator function"',
        explanation: 'Generates a calculator with comprehensive tests'
      },
      {
        description: 'Framework-specific generation',
        command: 'phoenix-code-lite generate --task "Add user authentication" --framework express',
        explanation: 'Creates Express.js authentication with middleware and tests'
      },
      {
        description: 'Verbose output with custom attempts',
        command: 'phoenix-code-lite generate --task "Build REST API" --verbose --max-attempts 5',
        explanation: 'Detailed logging with up to 5 implementation attempts'
      }
    ]);

    this.examples.set('config', [
      {
        description: 'View current configuration',
        command: 'phoenix-code-lite config --show',
        explanation: 'Displays all current settings and validates configuration'
      },
      {
        description: 'Apply enterprise template',
        command: 'phoenix-code-lite config --template enterprise',
        explanation: 'Applies strict quality gates and comprehensive documentation'
      },
      {
        description: 'Interactive configuration editor',
        command: 'phoenix-code-lite config --edit',
        explanation: 'Opens interactive editor for modifying configuration settings'
      }
    ]);
  }
}
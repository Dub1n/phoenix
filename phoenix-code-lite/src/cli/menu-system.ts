import chalk from 'chalk';
import { SessionContext, MenuAction } from './session';

export interface MenuContext {
  level: 'main' | 'config' | 'templates' | 'advanced' | 'generate';
  parentMenu?: string;
  currentItem?: string;
  breadcrumb: string[];
}

export class MenuSystem {
  
  public async showContextualMenu(context: SessionContext): Promise<void> {
    switch (context.level) {
      case 'main':
        this.showMainMenu();
        break;
      case 'config':
        this.showConfigMenu(context);
        break;
      case 'templates':
        this.showTemplatesMenu(context);
        break;
      case 'generate':
        this.showGenerateMenu(context);
        break;
      case 'advanced':
        this.showAdvancedMenu(context);
        break;
      default:
        this.showMainMenu();
    }
  }

  public async processContextCommand(input: string, context: SessionContext): Promise<MenuAction | null> {
    const cmd = input.toLowerCase().trim();
    
    switch (context.level) {
      case 'main':
        return this.processMainCommands(cmd);
      case 'config':
        return this.processConfigCommands(cmd, context);
      case 'templates':
        return this.processTemplateCommands(cmd, context);
      case 'generate':
        return this.processGenerateCommands(cmd, context);
      case 'advanced':
        return this.processAdvancedCommands(cmd, context);
      default:
        return null;
    }
  }

  public showContextHelp(context: SessionContext): void {
    switch (context.level) {
      case 'main':
        this.showMainHelp();
        break;
      case 'config':
        this.showConfigHelp();
        break;
      case 'templates':
        this.showTemplatesHelp();
        break;
      case 'generate':
        this.showGenerateHelp();
        break;
      case 'advanced':
        this.showAdvancedHelp();
        break;
    }
  }

  private showMainMenu(): void {
    console.log(chalk.red.bold('🔥 Phoenix Code Lite') + chalk.gray(' • ') + chalk.blue('TDD Workflow Orchestrator'));
    console.log(chalk.gray('═'.repeat(70)));
    console.log(chalk.dim('Transform natural language into production-ready code through TDD'));
    console.log();
    
    console.log(chalk.green.bold('📋 1. Configuration') + chalk.gray('     • Manage project settings and preferences'));
    console.log(chalk.gray('   Commands: ') + chalk.cyan('config, show, edit, reset'));
    console.log();
    
    console.log(chalk.yellow.bold('📄 2. Templates') + chalk.gray('          • Starter, Enterprise, Performance configurations'));
    console.log(chalk.gray('   Commands: ') + chalk.cyan('templates, use, preview, create'));
    console.log();
    
    console.log(chalk.magenta.bold('⚡ 3. Generate') + chalk.gray('           • AI-powered TDD code generation'));
    console.log(chalk.gray('   Commands: ') + chalk.cyan('generate, task, component, api'));
    console.log();
    
    console.log(chalk.cyan.bold('🔧 4. Advanced') + chalk.gray('          • Expert settings, metrics, logging'));
    console.log(chalk.gray('   Commands: ') + chalk.cyan('advanced, debug, metrics'));
    console.log();
    
    console.log(chalk.gray('─'.repeat(70)));
    console.log(chalk.blue('💡 Quick Tips:'));
    console.log(chalk.gray('  • Type a ') + chalk.yellow('number') + chalk.gray(' or ') + chalk.yellow('command name') + chalk.gray(' to navigate'));
    console.log(chalk.gray('  • Use ') + chalk.yellow('"help"') + chalk.gray(' for detailed command reference'));
    console.log(chalk.gray('  • Use ') + chalk.yellow('"quit"') + chalk.gray(' to exit or ') + chalk.yellow('"back"') + chalk.gray(' to return'));
    console.log();
  }

  private showConfigMenu(context: SessionContext): void {
    const title = context.currentItem ? 
      `📋 Configuration › ${context.currentItem}` : 
      '📋 Configuration Management Hub';
      
    console.log(chalk.green.bold(title));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.dim('Manage Phoenix Code Lite settings and preferences'));
    console.log();
    
    console.log(chalk.yellow.bold('🔧 Configuration Commands:'));
    console.log(chalk.green('  1. show      ') + chalk.gray('- Display current configuration with validation status'));
    console.log(chalk.green('  2. edit      ') + chalk.gray('- Interactive configuration editor with guided setup'));
    console.log(chalk.green('  3. templates ') + chalk.gray('- Browse and apply configuration templates'));
    console.log(chalk.green('  4. framework ') + chalk.gray('- Framework-specific optimization settings'));
    console.log(chalk.green('  5. quality   ') + chalk.gray('- Quality gates and testing thresholds'));
    console.log(chalk.green('  6. security  ') + chalk.gray('- Security policies and guardrails'));
    console.log();
    console.log(chalk.blue('💡 Navigation: ') + chalk.cyan('command name') + chalk.gray(', ') + chalk.cyan('number') + chalk.gray(', ') + chalk.cyan('"back"') + chalk.gray(' to return, ') + chalk.cyan('"quit"') + chalk.gray(' to exit'));
    console.log();
  }

  private showTemplatesMenu(context: SessionContext): void {
    const title = context.currentItem ? 
      `📄 Templates › ${context.currentItem}` : 
      '📄 Template Management Center';
      
    console.log(chalk.yellow.bold(title));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.dim('Choose from Starter, Enterprise, Performance, or create custom templates'));
    console.log();
    
    console.log(chalk.yellow.bold('📦 Template Commands:'));
    console.log(chalk.yellow('  1. list      ') + chalk.gray('- Show all available configuration templates'));
    console.log(chalk.yellow('  2. use       ') + chalk.gray('- Apply template to current project'));
    console.log(chalk.yellow('  3. preview   ') + chalk.gray('- Preview template settings before applying them'));
    console.log(chalk.yellow('  4. create    ') + chalk.gray('- Build custom template from current configuration'));
    console.log(chalk.yellow('  5. edit      ') + chalk.gray('- Modify existing template settings'));
    console.log(chalk.yellow('  6. reset     ') + chalk.gray('- Restore template to original defaults'));
    console.log();
    console.log(chalk.magenta('🎆 Popular Templates: ') + chalk.cyan('starter') + chalk.gray(', ') + chalk.cyan('enterprise') + chalk.gray(', ') + chalk.cyan('performance'));
    console.log(chalk.blue('💡 Navigation: ') + chalk.cyan('command name') + chalk.gray(', ') + chalk.cyan('number') + chalk.gray(', ') + chalk.cyan('"back"') + chalk.gray(' to return'));
    console.log();
  }

  private showGenerateMenu(context: SessionContext): void {
    console.log(chalk.magenta.bold('⚡ AI-Powered Code Generation'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.dim('Transform natural language into tested, production-ready code'));
    console.log();
    
    console.log(chalk.magenta.bold('🤖 Generation Commands:'));
    console.log(chalk.magenta('  task      ') + chalk.gray('- General code generation from any description'));
    console.log(chalk.magenta('  component ') + chalk.gray('- UI/React components with tests and styling'));
    console.log(chalk.magenta('  api       ') + chalk.gray('- REST API endpoints with validation and docs'));
    console.log(chalk.magenta('  test      ') + chalk.gray('- Comprehensive test suites for existing code'));
    console.log();
    console.log(chalk.blue.bold('💬 Natural Language Input:'));
    console.log(chalk.gray('  Simply describe what you want to build:'));
    console.log(chalk.cyan('  "create a user authentication system with JWT"'));
    console.log(chalk.cyan('  "add a responsive dashboard component"'));
    console.log(chalk.cyan('  "build API for product catalog management"'));
    console.log();
    console.log(chalk.yellow('🔄 TDD Workflow: ') + chalk.gray('Plan & Test → Implement & Fix → Refactor & Document'));
    console.log();
  }

  private showAdvancedMenu(context: SessionContext): void {
    console.log(chalk.cyan.bold('🔧 Advanced Configuration Center'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.dim('Expert settings, debugging tools, and performance monitoring'));
    console.log();
    
    console.log(chalk.cyan.bold('⚙️ Advanced Commands:'));
    console.log(chalk.cyan('  language  ') + chalk.gray('- Programming language preferences and optimization'));
    console.log(chalk.cyan('  agents    ') + chalk.gray('- AI agent configuration and specialization settings'));
    console.log(chalk.cyan('  logging   ') + chalk.gray('- Comprehensive audit logging and session tracking'));
    console.log(chalk.cyan('  metrics   ') + chalk.gray('- Performance metrics, success rates, and analytics'));
    console.log(chalk.cyan('  debug     ') + chalk.gray('- Debug mode, verbose output, and troubleshooting'));
    console.log();
    console.log(chalk.yellow('📊 Analytics: ') + chalk.gray('Track TDD workflow performance and code quality trends'));
    console.log(chalk.blue('💡 Navigation: ') + chalk.cyan('command name') + chalk.gray(', ') + chalk.cyan('"back"') + chalk.gray(' to return'));
    console.log();
  }

  private processMainCommands(cmd: string): MenuAction | null {
    switch (cmd) {
      case 'config':
      case 'configuration':
      case '1':
        return { type: 'navigate', target: 'config' };
      case 'templates':
      case 'template':
      case '2':
        return { type: 'navigate', target: 'templates' };
      case 'generate':
      case 'gen':
      case '3':
        return { type: 'navigate', target: 'generate' };
      case 'advanced':
      case 'settings':
      case '4':
        return { type: 'navigate', target: 'advanced' };
      default:
        return null;
    }
  }

  private processConfigCommands(cmd: string, context: SessionContext): MenuAction | null {
    switch (cmd) {
      case 'show':
      case '1':
        return { type: 'execute', target: 'config:show' };
      case 'edit':
      case '2':
        return { type: 'execute', target: 'config:edit' };
      case 'templates':
      case '3':
        context.currentItem = 'Templates';
        return { type: 'execute', target: 'config:templates' };
      case 'framework':
      case '4':
        context.currentItem = 'Framework';
        return { type: 'execute', target: 'config:framework' };
      case 'quality':
      case '5':
        context.currentItem = 'Quality';
        return { type: 'execute', target: 'config:quality' };
      case 'security':
      case '6':
        context.currentItem = 'Security';
        return { type: 'execute', target: 'config:security' };
      case 'back':
        return { type: 'navigate', target: 'main' };
      default:
        return null;
    }
  }

  private processTemplateCommands(cmd: string, context: SessionContext): MenuAction | null {
    const parts = cmd.split(' ');
    const command = parts[0];
    const arg = parts.slice(1).join(' ');

    switch (command) {
      case 'list':
      case '1':
        return { type: 'execute', target: 'templates:list' };
      case 'use':
      case '2':
        return { type: 'execute', target: 'templates:use', data: { template: arg } };
      case 'preview':
      case '3':
        return { type: 'execute', target: 'templates:preview', data: { template: arg } };
      case 'create':
      case '4':
        return { type: 'execute', target: 'templates:create', data: { name: arg } };
      case 'edit':
      case '5':
        return { type: 'execute', target: 'templates:edit', data: { template: arg } };
      case 'reset':
      case '6':
        return { type: 'execute', target: 'templates:reset', data: { template: arg } };
      case 'back':
        return { type: 'navigate', target: 'main' };
      default:
        return null;
    }
  }

  private processGenerateCommands(cmd: string, context: SessionContext): MenuAction | null {
    const parts = cmd.split(' ');
    const command = parts[0];
    const description = parts.slice(1).join(' ');

    switch (command) {
      case 'task':
        return { type: 'execute', target: 'generate:task', data: { description } };
      case 'component':
        return { type: 'execute', target: 'generate:component', data: { description } };
      case 'api':
        return { type: 'execute', target: 'generate:api', data: { description } };
      case 'test':
        return { type: 'execute', target: 'generate:test', data: { description } };
      default:
        // Treat any unrecognized command as a task description
        return { type: 'execute', target: 'generate:task', data: { description: cmd } };
    }
  }

  private processAdvancedCommands(cmd: string, context: SessionContext): MenuAction | null {
    switch (cmd) {
      case 'language':
        return { type: 'execute', target: 'advanced:language' };
      case 'agents':
        return { type: 'execute', target: 'advanced:agents' };
      case 'logging':
        return { type: 'execute', target: 'advanced:logging' };
      case 'metrics':
        return { type: 'execute', target: 'advanced:metrics' };
      case 'debug':
        return { type: 'execute', target: 'advanced:debug' };
      default:
        return null;
    }
  }

  private showMainHelp(): void {
    console.log('  config     - Enter configuration management');
    console.log('  templates  - Enter template management');
    console.log('  generate   - Enter code generation');
    console.log('  advanced   - Enter advanced settings');
  }

  private showConfigHelp(): void {
    console.log('  show       - Display current configuration');
    console.log('  edit       - Open interactive editor');
    console.log('  templates  - Manage configuration templates');
    console.log('  framework  - Framework-specific settings');
    console.log('  quality    - Quality thresholds and gates');
    console.log('  security   - Security policies and guardrails');
  }

  private showTemplatesHelp(): void {
    console.log('  list                    - Show all available templates');
    console.log('  use <name>              - Switch to specified template');
    console.log('  preview [name]          - Preview template settings');
    console.log('  create <name>           - Create new custom template');
    console.log('  edit <name>             - Edit template settings');
    console.log('  reset <name>            - Reset template to defaults');
  }

  private showGenerateHelp(): void {
    console.log('  task <description>      - Generate from task description');
    console.log('  component <description> - Generate UI component');
    console.log('  api <description>       - Generate API endpoint');
    console.log('  test <description>      - Generate test files');
    console.log('');
    console.log('  Or simply type your task description directly');
  }

  private showAdvancedHelp(): void {
    console.log('  language  - Configure language preferences');
    console.log('  agents    - Configure AI agent settings');
    console.log('  logging   - Configure audit logging');
    console.log('  metrics   - Configure performance metrics');
    console.log('  debug     - Configure debug settings');
  }

  public generateTitle(context: SessionContext): string {
    const phoenixBrand = '🔥 Phoenix Code Lite';
    
    switch (context.level) {
      case 'templates':
        return `${phoenixBrand} • 📄 Template Manager${context.currentItem ? ` › ${context.currentItem}` : ''}`;
      case 'config':
        return `${phoenixBrand} • 📋 Configuration${context.currentItem ? ` › ${context.currentItem}` : ''}`;
      case 'generate':
        return `${phoenixBrand} • ⚡ Code Generation`;
      case 'advanced':
        return `${phoenixBrand} • 🔧 Advanced Settings`;
      default:
        return `${phoenixBrand} • TDD Workflow Orchestrator`;
    }
  }
}
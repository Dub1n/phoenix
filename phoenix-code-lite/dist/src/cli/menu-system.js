"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuSystem = void 0;
const chalk_1 = __importDefault(require("chalk"));
class MenuSystem {
    async showContextualMenu(context) {
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
    async processContextCommand(input, context) {
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
    showContextHelp(context) {
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
    showMainMenu() {
        console.log(chalk_1.default.red.bold('🔥 Phoenix Code Lite') + chalk_1.default.gray(' • ') + chalk_1.default.blue('TDD Workflow Orchestrator'));
        console.log(chalk_1.default.gray('═'.repeat(70)));
        console.log(chalk_1.default.dim('Transform natural language into production-ready code through TDD'));
        console.log();
        console.log(chalk_1.default.green.bold('📋 1. Configuration') + chalk_1.default.gray('     • Manage project settings and preferences'));
        console.log(chalk_1.default.gray('   Commands: ') + chalk_1.default.cyan('config, show, edit, reset'));
        console.log();
        console.log(chalk_1.default.yellow.bold('📄 2. Templates') + chalk_1.default.gray('          • Starter, Enterprise, Performance configurations'));
        console.log(chalk_1.default.gray('   Commands: ') + chalk_1.default.cyan('templates, use, preview, create'));
        console.log();
        console.log(chalk_1.default.magenta.bold('⚡ 3. Generate') + chalk_1.default.gray('           • AI-powered TDD code generation'));
        console.log(chalk_1.default.gray('   Commands: ') + chalk_1.default.cyan('generate, task, component, api'));
        console.log();
        console.log(chalk_1.default.cyan.bold('🔧 4. Advanced') + chalk_1.default.gray('          • Expert settings, metrics, logging'));
        console.log(chalk_1.default.gray('   Commands: ') + chalk_1.default.cyan('advanced, debug, metrics'));
        console.log();
        console.log(chalk_1.default.gray('─'.repeat(70)));
        console.log(chalk_1.default.blue('💡 Quick Tips:'));
        console.log(chalk_1.default.gray('  • Type a ') + chalk_1.default.yellow('number') + chalk_1.default.gray(' or ') + chalk_1.default.yellow('command name') + chalk_1.default.gray(' to navigate'));
        console.log(chalk_1.default.gray('  • Use ') + chalk_1.default.yellow('"help"') + chalk_1.default.gray(' for detailed command reference'));
        console.log(chalk_1.default.gray('  • Use ') + chalk_1.default.yellow('"quit"') + chalk_1.default.gray(' to exit or ') + chalk_1.default.yellow('"back"') + chalk_1.default.gray(' to return'));
        console.log();
    }
    showConfigMenu(context) {
        const title = context.currentItem ?
            `📋 Configuration › ${context.currentItem}` :
            '📋 Configuration Management Hub';
        console.log(chalk_1.default.green.bold(title));
        console.log(chalk_1.default.gray('═'.repeat(60)));
        console.log(chalk_1.default.dim('Manage Phoenix Code Lite settings and preferences'));
        console.log();
        console.log(chalk_1.default.yellow.bold('🔧 Configuration Commands:'));
        console.log(chalk_1.default.green('  1. show      ') + chalk_1.default.gray('- Display current configuration with validation status'));
        console.log(chalk_1.default.green('  2. edit      ') + chalk_1.default.gray('- Interactive configuration editor with guided setup'));
        console.log(chalk_1.default.green('  3. templates ') + chalk_1.default.gray('- Browse and apply configuration templates'));
        console.log(chalk_1.default.green('  4. framework ') + chalk_1.default.gray('- Framework-specific optimization settings'));
        console.log(chalk_1.default.green('  5. quality   ') + chalk_1.default.gray('- Quality gates and testing thresholds'));
        console.log(chalk_1.default.green('  6. security  ') + chalk_1.default.gray('- Security policies and guardrails'));
        console.log();
        console.log(chalk_1.default.blue('💡 Navigation: ') + chalk_1.default.cyan('command name') + chalk_1.default.gray(', ') + chalk_1.default.cyan('number') + chalk_1.default.gray(', ') + chalk_1.default.cyan('"back"') + chalk_1.default.gray(' to return, ') + chalk_1.default.cyan('"quit"') + chalk_1.default.gray(' to exit'));
        console.log();
    }
    showTemplatesMenu(context) {
        const title = context.currentItem ?
            `📄 Templates › ${context.currentItem}` :
            '📄 Template Management Center';
        console.log(chalk_1.default.yellow.bold(title));
        console.log(chalk_1.default.gray('═'.repeat(60)));
        console.log(chalk_1.default.dim('Choose from Starter, Enterprise, Performance, or create custom templates'));
        console.log();
        console.log(chalk_1.default.yellow.bold('📦 Template Commands:'));
        console.log(chalk_1.default.yellow('  1. list      ') + chalk_1.default.gray('- Show all available configuration templates'));
        console.log(chalk_1.default.yellow('  2. use       ') + chalk_1.default.gray('- Apply template to current project'));
        console.log(chalk_1.default.yellow('  3. preview   ') + chalk_1.default.gray('- Preview template settings before applying them'));
        console.log(chalk_1.default.yellow('  4. create    ') + chalk_1.default.gray('- Build custom template from current configuration'));
        console.log(chalk_1.default.yellow('  5. edit      ') + chalk_1.default.gray('- Modify existing template settings'));
        console.log(chalk_1.default.yellow('  6. reset     ') + chalk_1.default.gray('- Restore template to original defaults'));
        console.log();
        console.log(chalk_1.default.magenta('🎆 Popular Templates: ') + chalk_1.default.cyan('starter') + chalk_1.default.gray(', ') + chalk_1.default.cyan('enterprise') + chalk_1.default.gray(', ') + chalk_1.default.cyan('performance'));
        console.log(chalk_1.default.blue('💡 Navigation: ') + chalk_1.default.cyan('command name') + chalk_1.default.gray(', ') + chalk_1.default.cyan('number') + chalk_1.default.gray(', ') + chalk_1.default.cyan('"back"') + chalk_1.default.gray(' to return'));
        console.log();
    }
    showGenerateMenu(context) {
        console.log(chalk_1.default.magenta.bold('⚡ AI-Powered Code Generation'));
        console.log(chalk_1.default.gray('═'.repeat(60)));
        console.log(chalk_1.default.dim('Transform natural language into tested, production-ready code'));
        console.log();
        console.log(chalk_1.default.magenta.bold('🤖 Generation Commands:'));
        console.log(chalk_1.default.magenta('  task      ') + chalk_1.default.gray('- General code generation from any description'));
        console.log(chalk_1.default.magenta('  component ') + chalk_1.default.gray('- UI/React components with tests and styling'));
        console.log(chalk_1.default.magenta('  api       ') + chalk_1.default.gray('- REST API endpoints with validation and docs'));
        console.log(chalk_1.default.magenta('  test      ') + chalk_1.default.gray('- Comprehensive test suites for existing code'));
        console.log();
        console.log(chalk_1.default.blue.bold('💬 Natural Language Input:'));
        console.log(chalk_1.default.gray('  Simply describe what you want to build:'));
        console.log(chalk_1.default.cyan('  "create a user authentication system with JWT"'));
        console.log(chalk_1.default.cyan('  "add a responsive dashboard component"'));
        console.log(chalk_1.default.cyan('  "build API for product catalog management"'));
        console.log();
        console.log(chalk_1.default.yellow('🔄 TDD Workflow: ') + chalk_1.default.gray('Plan & Test → Implement & Fix → Refactor & Document'));
        console.log();
    }
    showAdvancedMenu(context) {
        console.log(chalk_1.default.cyan.bold('🔧 Advanced Configuration Center'));
        console.log(chalk_1.default.gray('═'.repeat(60)));
        console.log(chalk_1.default.dim('Expert settings, debugging tools, and performance monitoring'));
        console.log();
        console.log(chalk_1.default.cyan.bold('⚙️ Advanced Commands:'));
        console.log(chalk_1.default.cyan('  language  ') + chalk_1.default.gray('- Programming language preferences and optimization'));
        console.log(chalk_1.default.cyan('  agents    ') + chalk_1.default.gray('- AI agent configuration and specialization settings'));
        console.log(chalk_1.default.cyan('  logging   ') + chalk_1.default.gray('- Comprehensive audit logging and session tracking'));
        console.log(chalk_1.default.cyan('  metrics   ') + chalk_1.default.gray('- Performance metrics, success rates, and analytics'));
        console.log(chalk_1.default.cyan('  debug     ') + chalk_1.default.gray('- Debug mode, verbose output, and troubleshooting'));
        console.log();
        console.log(chalk_1.default.yellow('📊 Analytics: ') + chalk_1.default.gray('Track TDD workflow performance and code quality trends'));
        console.log(chalk_1.default.blue('💡 Navigation: ') + chalk_1.default.cyan('command name') + chalk_1.default.gray(', ') + chalk_1.default.cyan('"back"') + chalk_1.default.gray(' to return'));
        console.log();
    }
    processMainCommands(cmd) {
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
    processConfigCommands(cmd, context) {
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
    processTemplateCommands(cmd, context) {
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
    processGenerateCommands(cmd, context) {
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
    processAdvancedCommands(cmd, context) {
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
    showMainHelp() {
        console.log('  config     - Enter configuration management');
        console.log('  templates  - Enter template management');
        console.log('  generate   - Enter code generation');
        console.log('  advanced   - Enter advanced settings');
    }
    showConfigHelp() {
        console.log('  show       - Display current configuration');
        console.log('  edit       - Open interactive editor');
        console.log('  templates  - Manage configuration templates');
        console.log('  framework  - Framework-specific settings');
        console.log('  quality    - Quality thresholds and gates');
        console.log('  security   - Security policies and guardrails');
    }
    showTemplatesHelp() {
        console.log('  list                    - Show all available templates');
        console.log('  use <name>              - Switch to specified template');
        console.log('  preview [name]          - Preview template settings');
        console.log('  create <name>           - Create new custom template');
        console.log('  edit <name>             - Edit template settings');
        console.log('  reset <name>            - Reset template to defaults');
    }
    showGenerateHelp() {
        console.log('  task <description>      - Generate from task description');
        console.log('  component <description> - Generate UI component');
        console.log('  api <description>       - Generate API endpoint');
        console.log('  test <description>      - Generate test files');
        console.log('');
        console.log('  Or simply type your task description directly');
    }
    showAdvancedHelp() {
        console.log('  language  - Configure language preferences');
        console.log('  agents    - Configure AI agent settings');
        console.log('  logging   - Configure audit logging');
        console.log('  metrics   - Configure performance metrics');
        console.log('  debug     - Configure debug settings');
    }
    generateTitle(context) {
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
exports.MenuSystem = MenuSystem;
//# sourceMappingURL=menu-system.js.map
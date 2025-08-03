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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpSystem = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
class HelpSystem {
    constructor() {
        this.examples = new Map();
        this.initializeExamples();
    }
    async getContextualHelp(projectPath = process.cwd()) {
        const context = await this.analyzeProjectContext(projectPath);
        let help = this.getBaseHelp();
        // Add contextual suggestions
        if (context.hasConfig) {
            help += this.getConfigFoundHelp();
        }
        else {
            help += this.getNoConfigHelp();
        }
        if (context.hasAuditLogs) {
            help += this.getAuditLogsHelp();
        }
        if (context.language) {
            help += this.getLanguageSpecificHelp(context.language);
        }
        try {
            const boxen = await Promise.resolve().then(() => __importStar(require('boxen')));
            return boxen.default(help, {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'blue'
            });
        }
        catch (error) {
            // Fallback without boxen styling
            return help;
        }
    }
    getCommandExamples(command) {
        return this.examples.get(command) || [];
    }
    generateQuickReference() {
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
        let reference = chalk_1.default.bold.blue('🔥 Phoenix-Code-Lite Quick Reference Guide\n');
        reference += chalk_1.default.bold.gray('   TDD Workflow Orchestrator for Claude Code\n');
        reference += chalk_1.default.gray('═'.repeat(80)) + '\n\n';
        sections.forEach(section => {
            reference += chalk_1.default.yellow.bold(`${section.title}:\n`);
            reference += chalk_1.default.gray('─'.repeat(section.title.length + 1)) + '\n';
            section.commands.forEach(item => {
                const cmdPart = chalk_1.default.green(item.cmd.padEnd(35));
                const descPart = chalk_1.default.white(item.desc.padEnd(30));
                const optsPart = item.opts ? chalk_1.default.gray(item.opts) : '';
                reference += `  ${cmdPart} ${descPart} ${optsPart}\n`;
            });
            reference += '\n';
        });
        reference += chalk_1.default.blue('🖥️  Interactive Mode (Recommended):\n');
        reference += chalk_1.default.gray('─'.repeat(35)) + '\n';
        reference += chalk_1.default.cyan('  phoenix-code-lite') + chalk_1.default.gray(' - Start interactive CLI with guided navigation\n');
        reference += chalk_1.default.gray('  • Context-sensitive help and command completion\n');
        reference += chalk_1.default.gray('  • Visual menu system with Phoenix branding\n');
        reference += chalk_1.default.gray('  • Intelligent error handling and suggestions\n\n');
        reference += chalk_1.default.blue('💡 Usage Examples:\n');
        reference += chalk_1.default.gray('─'.repeat(18)) + '\n';
        reference += chalk_1.default.green('  # Generate React login component\n');
        reference += chalk_1.default.gray('  phoenix-code-lite generate -t "Create login form with validation" -f react --type component\n\n');
        reference += chalk_1.default.green('  # Build REST API with authentication\n');
        reference += chalk_1.default.gray('  phoenix-code-lite generate -t "User authentication API" --type api -f express --with-tests\n\n');
        reference += chalk_1.default.green('  # Apply enterprise configuration\n');
        reference += chalk_1.default.gray('  phoenix-code-lite config --use enterprise\n\n');
        reference += chalk_1.default.green('  # Interactive setup for new projects\n');
        reference += chalk_1.default.gray('  phoenix-code-lite wizard\n\n');
        reference += chalk_1.default.blue('📚 Additional Resources:\n');
        reference += chalk_1.default.gray('─'.repeat(22)) + '\n';
        reference += chalk_1.default.gray('  • Documentation: Run interactive mode for guided help\n');
        reference += chalk_1.default.gray('  • Templates: Use "template" command to explore configurations\n');
        reference += chalk_1.default.gray('  • TDD Workflow: Each generation follows Plan→Implement→Refactor phases\n');
        reference += chalk_1.default.gray('  • Quality Gates: Automated validation ensures production-ready code\n\n');
        return reference;
    }
    async analyzeProjectContext(projectPath) {
        const context = {
            hasConfig: false,
            hasAuditLogs: false,
            language: null,
            framework: null,
        };
        try {
            // Check for configuration
            await fs_1.promises.access((0, path_1.join)(projectPath, '.phoenix-code-lite.json'));
            context.hasConfig = true;
        }
        catch {
            // No config file
        }
        try {
            // Check for audit logs
            await fs_1.promises.access((0, path_1.join)(projectPath, '.phoenix-code-lite', 'audit'));
            context.hasAuditLogs = true;
        }
        catch {
            // No audit logs
        }
        try {
            // Detect language from package.json
            const packageJson = await fs_1.promises.readFile((0, path_1.join)(projectPath, 'package.json'), 'utf-8');
            const pkg = JSON.parse(packageJson);
            if (pkg.dependencies) {
                if (pkg.dependencies.react)
                    context.framework = 'react';
                else if (pkg.dependencies.vue)
                    context.framework = 'vue';
                else if (pkg.dependencies.express)
                    context.framework = 'express';
            }
            context.language = 'javascript';
        }
        catch {
            // No package.json, try other language files
            try {
                await fs_1.promises.access((0, path_1.join)(projectPath, 'requirements.txt'));
                context.language = 'python';
            }
            catch {
                // No Python project detected
            }
        }
        return context;
    }
    getBaseHelp() {
        return chalk_1.default.bold.blue('🔥 Phoenix-Code-Lite CLI Help\n') +
            chalk_1.default.gray('═'.repeat(50)) + '\n' +
            chalk_1.default.bold('TDD Workflow Orchestrator for Claude Code\n\n') +
            'Phoenix-Code-Lite transforms natural language task descriptions into tested, \n' +
            'working code through a systematic 3-phase TDD workflow:\n\n' +
            chalk_1.default.yellow('• Phase 1: Plan & Test') + ' - Requirements analysis and comprehensive test planning\n' +
            chalk_1.default.yellow('• Phase 2: Implement & Fix') + ' - Clean code generation with iterative refinement\n' +
            chalk_1.default.yellow('• Phase 3: Refactor & Document') + ' - Code optimization and documentation\n\n' +
            chalk_1.default.bold('Quick Start:\n') +
            chalk_1.default.cyan('  phoenix-code-lite') + ' - Interactive CLI (recommended for beginners)\n' +
            chalk_1.default.cyan('  phoenix-code-lite generate --task "your description"') + ' - Direct generation\n\n';
    }
    getConfigFoundHelp() {
        return chalk_1.default.green('✓ Configuration Active!\n') +
            chalk_1.default.gray('Your project is configured and ready for TDD workflow generation.\n') +
            chalk_1.default.blue('Quick actions:\n') +
            chalk_1.default.gray('  • ') + chalk_1.default.cyan('config --show') + chalk_1.default.gray(' - View current configuration\n') +
            chalk_1.default.gray('  • ') + chalk_1.default.cyan('template') + chalk_1.default.gray(' - Manage configuration templates\n') +
            chalk_1.default.gray('  • ') + chalk_1.default.cyan('generate -t "task"') + chalk_1.default.gray(' - Start TDD workflow\n\n');
    }
    getNoConfigHelp() {
        return chalk_1.default.yellow('⚠  No Configuration Detected\n') +
            chalk_1.default.gray('Phoenix-Code-Lite will use default settings. For optimal performance:\n') +
            chalk_1.default.blue('Setup options:\n') +
            chalk_1.default.gray('  • ') + chalk_1.default.green('phoenix-code-lite init') + chalk_1.default.gray(' - Quick initialization\n') +
            chalk_1.default.gray('  • ') + chalk_1.default.green('phoenix-code-lite wizard') + chalk_1.default.gray(' - Interactive guided setup\n') +
            chalk_1.default.gray('  • ') + chalk_1.default.green('phoenix-code-lite template') + chalk_1.default.gray(' - Choose configuration template\n\n');
    }
    getAuditLogsHelp() {
        return chalk_1.default.blue('📈 Audit & Metrics Available\n') +
            chalk_1.default.gray('Your project has workflow history and performance metrics.\n') +
            chalk_1.default.blue('Analysis options:\n') +
            chalk_1.default.gray('  • View metrics in interactive mode under Advanced → Metrics\n') +
            chalk_1.default.gray('  • Export data for external analysis (feature coming soon)\n') +
            chalk_1.default.gray('  • Track TDD workflow effectiveness and improvements\n\n');
    }
    getLanguageSpecificHelp(language) {
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
        const langInfo = tips[language];
        if (langInfo) {
            let help = chalk_1.default.cyan(`${langInfo.emoji} ${langInfo.tip}\n`);
            help += chalk_1.default.gray('  Optimizations available:\n');
            langInfo.examples.forEach(example => {
                help += chalk_1.default.gray(`    • ${example}\n`);
            });
            return help + '\n';
        }
        return chalk_1.default.cyan(`📝 Language detected: ${language}\n`) +
            chalk_1.default.gray('  Phoenix-Code-Lite will adapt to your project structure.\n\n');
    }
    initializeExamples() {
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
exports.HelpSystem = HelpSystem;
//# sourceMappingURL=help-system.js.map
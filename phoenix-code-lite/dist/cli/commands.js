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
exports.generateCommand = generateCommand;
exports.initCommand = initCommand;
exports.configCommand = configCommand;
const client_1 = require("../claude/client");
const orchestrator_1 = require("../tdd/orchestrator");
const workflow_1 = require("../types/workflow");
const settings_1 = require("../config/settings");
const templates_1 = require("../config/templates");
const chalk_1 = __importDefault(require("chalk"));
async function generateCommand(options) {
    // Use dynamic import for ES modules
    const { default: ora } = await Promise.resolve().then(() => __importStar(require('ora')));
    const spinner = ora('Initializing Phoenix-Code-Lite workflow...').start();
    try {
        // Load configuration using new system
        const config = await settings_1.PhoenixCodeLiteConfig.load();
        // Apply CLI overrides to configuration
        if (options.verbose)
            config.set('output.verbose', true);
        if (options.maxAttempts)
            config.set('tdd.maxImplementationAttempts', parseInt(String(options.maxAttempts)));
        // Validate task context
        const context = {
            taskDescription: options.task,
            projectPath: options.projectPath || process.cwd(),
            language: options.language,
            framework: options.framework,
            maxTurns: config.get('claude.maxTurns'),
        };
        // Validate using schema
        const validatedContext = workflow_1.TaskContextSchema.parse(context);
        // Initialize Claude Code client with configuration
        const claudeClient = new client_1.ClaudeCodeClient({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        // Create TDD orchestrator
        const orchestrator = new orchestrator_1.TDDOrchestrator(claudeClient);
        spinner.text = 'Starting TDD workflow...';
        // Execute the workflow
        const result = await orchestrator.executeWorkflow(options.task, validatedContext);
        spinner.stop();
        // Display results
        if (result.success) {
            console.log(chalk_1.default.green('✓ Phoenix-Code-Lite workflow completed successfully!'));
            console.log(chalk_1.default.gray(`Duration: ${result.duration}ms`));
            console.log(chalk_1.default.gray(`Phases completed: ${result.phases.length}`));
            if (options.verbose) {
                displayDetailedResults(result);
            }
        }
        else {
            console.log(chalk_1.default.red('✗ Phoenix-Code-Lite workflow failed'));
            console.log(chalk_1.default.red(`Error: ${result.error}`));
            process.exit(1);
        }
    }
    catch (error) {
        spinner.stop();
        console.error(chalk_1.default.red('Fatal error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
async function initCommand(options) {
    console.log(chalk_1.default.blue('✦ Initializing Phoenix-Code-Lite...'));
    try {
        // Create configuration using new system
        let config = settings_1.PhoenixCodeLiteConfig.getDefault();
        // Apply template if specified
        if (options.template) {
            let template;
            switch (options.template) {
                case 'starter':
                    template = templates_1.ConfigurationTemplates.getStarterTemplate();
                    break;
                case 'enterprise':
                    template = templates_1.ConfigurationTemplates.getEnterpriseTemplate();
                    break;
                case 'performance':
                    template = templates_1.ConfigurationTemplates.getPerformanceTemplate();
                    break;
                default:
                    console.log(chalk_1.default.yellow('Unknown template. Using default configuration.'));
                    console.log(chalk_1.default.gray('Available templates: starter, enterprise, performance'));
            }
            if (template) {
                config = config.merge(template);
                console.log(chalk_1.default.blue(`Applied ${options.template} template`));
            }
        }
        await config.save(options.force);
        console.log(chalk_1.default.green('✓ Phoenix-Code-Lite initialized successfully!'));
        console.log(chalk_1.default.gray('Run "phoenix-code-lite generate --task \'your task\'" to get started'));
    }
    catch (error) {
        console.error(chalk_1.default.red('Initialization failed:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
async function configCommand(options) {
    try {
        if (options.show) {
            // Show current configuration using new system
            const config = await settings_1.PhoenixCodeLiteConfig.load();
            console.log(chalk_1.default.blue('※ Current Configuration:'));
            console.log(JSON.stringify(config.export(), null, 2));
            // Show validation status
            const errors = config.validate();
            if (errors.length > 0) {
                console.log(chalk_1.default.yellow('\n⚠  Configuration Issues:'));
                errors.forEach(error => console.log(chalk_1.default.yellow(`  - ${error}`)));
            }
            else {
                console.log(chalk_1.default.green('\n✓ Configuration is valid'));
            }
        }
        else if (options.reset) {
            // Reset using new configuration system
            const config = settings_1.PhoenixCodeLiteConfig.getDefault();
            await config.save(true);
            console.log(chalk_1.default.green('✓ Configuration reset to defaults'));
        }
        else if (options.template) {
            // Apply configuration template
            let template;
            switch (options.template) {
                case 'starter':
                    template = templates_1.ConfigurationTemplates.getStarterTemplate();
                    break;
                case 'enterprise':
                    template = templates_1.ConfigurationTemplates.getEnterpriseTemplate();
                    break;
                case 'performance':
                    template = templates_1.ConfigurationTemplates.getPerformanceTemplate();
                    break;
                default:
                    console.log(chalk_1.default.red('Unknown template. Available templates: starter, enterprise, performance'));
                    return;
            }
            const baseConfig = settings_1.PhoenixCodeLiteConfig.getDefault();
            const configWithTemplate = baseConfig.merge(template);
            await configWithTemplate.save(true);
            console.log(chalk_1.default.green(`✓ Applied ${options.template} template`));
        }
        else {
            console.log(chalk_1.default.yellow('Configuration commands:'));
            console.log('  --show              Display current configuration');
            console.log('  --reset             Reset to default configuration');
            console.log('  --template <name>   Apply template (starter|enterprise|performance)');
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Configuration error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
function displayDetailedResults(result) {
    console.log('\n◊ Detailed Results:');
    result.phases.forEach((phase, index) => {
        const icon = phase.success ? '✓' : '✗';
        const duration = phase.endTime ? phase.endTime.getTime() - phase.startTime.getTime() : 0;
        console.log(`${icon} Phase ${index + 1}: ${phase.name} (${duration}ms)`);
        if (phase.artifacts && phase.artifacts.length > 0) {
            console.log(`   □ Artifacts: ${phase.artifacts.join(', ')}`);
        }
        if (phase.error) {
            console.log(chalk_1.default.red(`   ✗ Error: ${phase.error}`));
        }
    });
    if (result.metadata?.qualitySummary) {
        console.log(`\n○ ${result.metadata.qualitySummary}`);
    }
}
//# sourceMappingURL=commands.js.map
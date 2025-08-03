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
exports.templateCommand = templateCommand;
const client_1 = require("../claude/client");
const orchestrator_1 = require("../tdd/orchestrator");
const workflow_1 = require("../types/workflow");
const settings_1 = require("../config/settings");
const templates_1 = require("../config/templates");
const config_formatter_1 = require("./config-formatter");
const interactive_1 = require("./interactive");
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
        const interactive = new interactive_1.InteractivePrompts();
        if (options.show) {
            // Show current configuration using new formatted display
            try {
                const config = await settings_1.PhoenixCodeLiteConfig.load();
                // Use the new formatter for user-friendly display
                console.log(config_formatter_1.ConfigFormatter.formatConfig(config.export()));
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
            catch (error) {
                // Handle configuration loading errors gracefully
                if (error instanceof Error && error.message.includes('Configuration validation failed')) {
                    console.log(chalk_1.default.yellow('⚠  Configuration validation issues detected. Using default values.\n'));
                    // Load and display default configuration
                    const defaultConfig = settings_1.PhoenixCodeLiteConfig.getDefault();
                    console.log(chalk_1.default.gray('Configuration (using defaults due to validation issues):'));
                    console.log(config_formatter_1.ConfigFormatter.formatConfig(defaultConfig.export()));
                    console.log(chalk_1.default.yellow('\n⚠  To fix configuration issues, run: phoenix-code-lite config --reset'));
                }
                else {
                    throw error;
                }
            }
        }
        else if (options.edit) {
            // Launch interactive configuration editor
            const result = await interactive.runInteractiveConfigEditor();
            if (result.saved) {
                if (result.templateUpdated) {
                    await applyTemplate(result.templateUpdated);
                }
            }
        }
        else if (options.use) {
            // Switch to template using new --use command
            await applyTemplate(options.use);
        }
        else if (options.adjust) {
            // Adjust template functionality
            await adjustTemplate(options.adjust, interactive);
        }
        else if (options.add) {
            // Add new template functionality
            await addTemplate(options.add, interactive);
        }
        else if (options.reset) {
            // Reset using new configuration system
            const config = settings_1.PhoenixCodeLiteConfig.getDefault();
            await config.save(true);
            console.log(chalk_1.default.green('✓ Configuration reset to defaults'));
        }
        else if (options.template) {
            // Apply configuration template (legacy support)
            await applyTemplate(options.template);
        }
        else {
            console.log(chalk_1.default.yellow('Configuration commands:'));
            console.log('  --show              Display current configuration');
            console.log('  --edit              Interactive configuration editor');
            console.log('  --use <name>        Switch to template (starter|enterprise|performance|default)');
            console.log('  --adjust <name>     Adjust template settings');
            console.log('  --add <name>        Create new template');
            console.log('  --reset             Reset to default configuration');
            console.log('  --template <name>   Apply template (legacy - use --use instead)');
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Configuration error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
async function applyTemplate(templateName) {
    let template;
    let displayName = templateName;
    switch (templateName) {
        case 'starter':
            template = templates_1.ConfigurationTemplates.getStarterTemplate();
            break;
        case 'enterprise':
            template = templates_1.ConfigurationTemplates.getEnterpriseTemplate();
            break;
        case 'performance':
            template = templates_1.ConfigurationTemplates.getPerformanceTemplate();
            break;
        case 'default':
            template = settings_1.PhoenixCodeLiteConfig.getDefault().export();
            displayName = 'default';
            break;
        default:
            console.log(chalk_1.default.red('Unknown template. Available templates: starter, enterprise, performance, default'));
            return;
    }
    const baseConfig = settings_1.PhoenixCodeLiteConfig.getDefault();
    const configWithTemplate = baseConfig.merge(template);
    await configWithTemplate.save(true);
    console.log(chalk_1.default.green(`✓ Applied ${displayName} template`));
    console.log(chalk_1.default.gray(config_formatter_1.ConfigFormatter.formatConfigSummary(configWithTemplate.export())));
}
async function adjustTemplate(templateName, interactive) {
    console.log(chalk_1.default.blue.bold(`🔧 Adjusting Template: ${templateName}`));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    // Load the specified template
    let templateConfig;
    try {
        switch (templateName) {
            case 'starter':
                templateConfig = settings_1.PhoenixCodeLiteConfig.getDefault().merge(templates_1.ConfigurationTemplates.getStarterTemplate());
                break;
            case 'enterprise':
                templateConfig = settings_1.PhoenixCodeLiteConfig.getDefault().merge(templates_1.ConfigurationTemplates.getEnterpriseTemplate());
                break;
            case 'performance':
                templateConfig = settings_1.PhoenixCodeLiteConfig.getDefault().merge(templates_1.ConfigurationTemplates.getPerformanceTemplate());
                break;
            case 'default':
                templateConfig = settings_1.PhoenixCodeLiteConfig.getDefault();
                break;
            default:
                console.log(chalk_1.default.red(`Unknown template: ${templateName}`));
                console.log(chalk_1.default.gray('Available templates: starter, enterprise, performance, default'));
                return;
        }
        // Run interactive editor on the template
        console.log(chalk_1.default.yellow(`\nLoaded ${templateName} template for adjustment.`));
        console.log(chalk_1.default.gray('Use the interactive editor to modify settings, then save to apply changes.\n'));
        const result = await interactive.runInteractiveConfigEditor();
        if (result.saved) {
            console.log(chalk_1.default.green(`\n✓ ${templateName} template adjustments saved successfully!`));
        }
        else {
            console.log(chalk_1.default.yellow(`\n⚠ No changes saved to ${templateName} template.`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Template adjustment failed:'), error instanceof Error ? error.message : 'Unknown error');
    }
}
async function addTemplate(templateName, interactive) {
    console.log(chalk_1.default.blue.bold(`➕ Creating New Template: ${templateName}`));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
    // Ask user to select base template
    const { baseTemplate } = await inquirer.default.prompt([
        {
            type: 'list',
            name: 'baseTemplate',
            message: `Select base template for '${templateName}':`,
            choices: [
                { name: '🚀 Starter Template (Basic settings)', value: 'starter' },
                { name: '🏢 Enterprise Template (Production-ready)', value: 'enterprise' },
                { name: '⚡ Performance Template (Speed-optimized)', value: 'performance' },
                { name: '🎯 Default Template (Balanced)', value: 'default' },
                { name: '⭐ Empty Template (Start from scratch)', value: 'empty' },
            ],
        },
    ]);
    // Load base template
    let baseConfig;
    switch (baseTemplate) {
        case 'starter':
            baseConfig = settings_1.PhoenixCodeLiteConfig.getDefault().merge(templates_1.ConfigurationTemplates.getStarterTemplate());
            break;
        case 'enterprise':
            baseConfig = settings_1.PhoenixCodeLiteConfig.getDefault().merge(templates_1.ConfigurationTemplates.getEnterpriseTemplate());
            break;
        case 'performance':
            baseConfig = settings_1.PhoenixCodeLiteConfig.getDefault().merge(templates_1.ConfigurationTemplates.getPerformanceTemplate());
            break;
        case 'empty':
            baseConfig = settings_1.PhoenixCodeLiteConfig.getDefault();
            // Reset to minimal configuration
            baseConfig.set('tdd.testQualityThreshold', 0.5);
            baseConfig.set('quality.minTestCoverage', 0.5);
            break;
        default:
            baseConfig = settings_1.PhoenixCodeLiteConfig.getDefault();
            break;
    }
    console.log(chalk_1.default.yellow(`\nCreating '${templateName}' based on ${baseTemplate} template.`));
    console.log(chalk_1.default.gray('Use the interactive editor to customize your new template.\n'));
    // Run interactive editor
    const result = await interactive.runInteractiveConfigEditor();
    if (result.saved) {
        console.log(chalk_1.default.green(`\n✓ New template '${templateName}' created successfully!`));
        console.log(chalk_1.default.gray(`Template saved to current configuration.`));
        console.log(chalk_1.default.blue(`\nTo use this template in the future, run:`));
        console.log(chalk_1.default.gray(`  phoenix-code-lite config --use ${templateName}`));
        console.log(chalk_1.default.yellow(`\nNote: Custom templates are saved as configurations.`));
        console.log(chalk_1.default.yellow(`For persistent templates, consider documenting your settings.`));
    }
    else {
        console.log(chalk_1.default.yellow(`\n⚠ Template creation cancelled.`));
    }
}
async function templateCommand(options) {
    console.log(chalk_1.default.blue.bold('📄 Phoenix Code Lite Template Manager'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    const interactive = new interactive_1.InteractivePrompts();
    const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
    try {
        const { action } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Select template operation:',
                choices: [
                    { name: '🔄 Switch to Template', value: 'use' },
                    { name: '🔧 Adjust Template Settings', value: 'adjust' },
                    { name: '➕ Create New Template', value: 'add' },
                    { name: '🔄 Reset to Default Template', value: 'reset' },
                    { name: '📋 View Template Previews', value: 'preview' },
                    new inquirer.default.Separator(),
                    { name: '❌ Cancel', value: 'cancel' },
                ],
                pageSize: 10,
                loop: false,
            },
        ]);
        switch (action) {
            case 'use':
                const template = await selectTemplateForUse();
                if (template && template !== 'cancel') {
                    await applyTemplate(template);
                }
                break;
            case 'adjust':
                const adjustTemplate = await selectTemplateForAdjust();
                if (adjustTemplate && adjustTemplate !== 'cancel') {
                    await adjustTemplateSettings(adjustTemplate, interactive);
                }
                break;
            case 'add':
                const templateName = await getNewTemplateName();
                if (templateName) {
                    await addTemplate(templateName, interactive);
                }
                break;
            case 'reset':
                const confirmed = await confirmTemplateReset();
                if (confirmed) {
                    await resetToDefaultTemplate();
                }
                break;
            case 'preview':
                await showTemplatePreview();
                break;
            case 'cancel':
                console.log(chalk_1.default.gray('\n✓ Template management cancelled.'));
                break;
            default:
                console.log(chalk_1.default.gray('\n✓ Template management completed.'));
                break;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Template management error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
async function selectTemplateForUse() {
    const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
    const { template } = await inquirer.default.prompt([
        {
            type: 'list',
            name: 'template',
            message: 'Select template to use:',
            choices: [
                { name: '🚀 Starter Template (Basic settings)', value: 'starter' },
                { name: '🏢 Enterprise Template (Production-ready)', value: 'enterprise' },
                { name: '⚡ Performance Template (Speed-optimized)', value: 'performance' },
                { name: '🎯 Default Template (Balanced)', value: 'default' },
                new inquirer.default.Separator(),
                { name: '❌ Cancel', value: 'cancel' },
            ],
            pageSize: 8,
            loop: false,
        },
    ]);
    return template === 'cancel' ? null : template;
}
async function selectTemplateForAdjust() {
    const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
    const { template } = await inquirer.default.prompt([
        {
            type: 'list',
            name: 'template',
            message: 'Select template to adjust:',
            choices: [
                { name: '🚀 Starter Template', value: 'starter' },
                { name: '🏢 Enterprise Template', value: 'enterprise' },
                { name: '⚡ Performance Template', value: 'performance' },
                { name: '🎯 Default Template', value: 'default' },
                new inquirer.default.Separator(),
                { name: '❌ Cancel', value: 'cancel' },
            ],
            pageSize: 8,
            loop: false,
        },
    ]);
    return template === 'cancel' ? null : template;
}
async function getNewTemplateName() {
    const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
    const { templateName } = await inquirer.default.prompt([
        {
            type: 'input',
            name: 'templateName',
            message: 'Enter name for new template:',
            validate: (input) => {
                if (!input || input.trim().length === 0) {
                    return 'Template name cannot be empty';
                }
                if (input.trim().length < 3) {
                    return 'Template name must be at least 3 characters';
                }
                if (!/^[a-zA-Z0-9-_]+$/.test(input.trim())) {
                    return 'Template name can only contain letters, numbers, hyphens, and underscores';
                }
                return true;
            },
            filter: (input) => input.trim(),
        },
    ]);
    return templateName || null;
}
async function adjustTemplateSettings(templateName, interactive) {
    console.log(chalk_1.default.blue.bold(`🔧 Adjusting Template: ${templateName}`));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    // Load the specified template
    let templateConfig;
    try {
        switch (templateName) {
            case 'starter':
                templateConfig = settings_1.PhoenixCodeLiteConfig.getDefault().merge(templates_1.ConfigurationTemplates.getStarterTemplate());
                break;
            case 'enterprise':
                templateConfig = settings_1.PhoenixCodeLiteConfig.getDefault().merge(templates_1.ConfigurationTemplates.getEnterpriseTemplate());
                break;
            case 'performance':
                templateConfig = settings_1.PhoenixCodeLiteConfig.getDefault().merge(templates_1.ConfigurationTemplates.getPerformanceTemplate());
                break;
            case 'default':
                templateConfig = settings_1.PhoenixCodeLiteConfig.getDefault();
                break;
            default:
                console.log(chalk_1.default.red(`Unknown template: ${templateName}`));
                console.log(chalk_1.default.gray('Available templates: starter, enterprise, performance, default'));
                return;
        }
        // Run interactive editor on the template
        console.log(chalk_1.default.yellow(`\nLoaded ${templateName} template for adjustment.`));
        console.log(chalk_1.default.gray('Use the interactive editor to modify settings, then save to apply changes.\n'));
        const result = await interactive.runInteractiveConfigEditor();
        if (result.saved) {
            console.log(chalk_1.default.green(`\n✓ ${templateName} template adjustments saved successfully!`));
        }
        else {
            console.log(chalk_1.default.yellow(`\n⚠ No changes saved to ${templateName} template.`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Template adjustment failed:'), error instanceof Error ? error.message : 'Unknown error');
    }
}
async function confirmTemplateReset() {
    const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
    const { confirm } = await inquirer.default.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Reset configuration to default template? This will replace all current settings.',
            default: false,
        },
    ]);
    return confirm;
}
async function resetToDefaultTemplate() {
    try {
        const config = settings_1.PhoenixCodeLiteConfig.getDefault();
        await config.save(true);
        console.log(chalk_1.default.green('\n✓ Configuration reset to default template successfully!'));
        console.log(chalk_1.default.gray('All settings have been restored to their default values.'));
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to reset template:'), error instanceof Error ? error.message : 'Unknown error');
    }
}
async function showTemplatePreview() {
    const templates = ['starter', 'enterprise', 'performance', 'default'];
    console.log(chalk_1.default.blue('\n📄 Template Previews\n'));
    for (const templateName of templates) {
        let templateData;
        switch (templateName) {
            case 'starter':
                templateData = templates_1.ConfigurationTemplates.getStarterTemplate();
                break;
            case 'enterprise':
                templateData = templates_1.ConfigurationTemplates.getEnterpriseTemplate();
                break;
            case 'performance':
                templateData = templates_1.ConfigurationTemplates.getPerformanceTemplate();
                break;
            default:
                templateData = settings_1.PhoenixCodeLiteConfig.getDefault().export();
                break;
        }
        console.log(chalk_1.default.bold(`${templateName.toUpperCase()} TEMPLATE:`));
        if (templateData) {
            console.log(config_formatter_1.ConfigFormatter.formatConfigSummary(templateData));
        }
        console.log('');
    }
    const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
    await inquirer.default.prompt([
        {
            type: 'input',
            name: 'continue',
            message: 'Press Enter to continue...',
        },
    ]);
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
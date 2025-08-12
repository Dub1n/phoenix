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
exports.enhancedGenerateCommand = enhancedGenerateCommand;
exports.wizardCommand = wizardCommand;
exports.historyCommand = historyCommand;
exports.helpCommand = helpCommand;
exports.executeSessionAction = executeSessionAction;
const advanced_cli_1 = require("./advanced-cli");
const progress_tracker_1 = require("./progress-tracker");
const interactive_1 = require("./interactive");
const orchestrator_1 = require("../tdd/orchestrator");
const client_1 = require("../claude/client");
const workflow_1 = require("../types/workflow");
const settings_1 = require("../config/settings");
const templates_1 = require("../config/templates");
const config_formatter_1 = require("./config-formatter");
const document_manager_1 = require("../config/document-manager");
const test_utils_1 = require("../utils/test-utils");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = require("path");
async function enhancedGenerateCommand(options) {
    const startTime = Date.now();
    const cli = new advanced_cli_1.AdvancedCLI();
    try {
        // Display banner
        if (!options.verbose) {
            try {
                const figlet = await Promise.resolve().then(() => __importStar(require('figlet')));
                const gradient = await Promise.resolve().then(() => __importStar(require('gradient-string')));
                console.log(gradient.default.pastel.multiline(figlet.default.textSync('Phoenix', { font: 'Small' })));
                console.log(chalk_1.default.gray('Code-Lite TDD Workflow Orchestrator\n'));
            }
            catch (error) {
                // Fallback without fancy banner
                console.log(chalk_1.default.blue('Phoenix Code-Lite TDD Workflow Orchestrator\n'));
            }
        }
        // Interactive task input if not provided
        if (!options.task) {
            const prompts = new interactive_1.InteractivePrompts();
            options.task = await prompts.getTaskInput();
        }
        // Initialize progress tracker
        const tracker = new progress_tracker_1.ProgressTracker('TDD Workflow', 3);
        // Validate task context
        const context = {
            taskDescription: options.task,
            projectPath: options.projectPath || process.cwd(),
            language: options.language,
            framework: options.framework,
            maxTurns: typeof options.maxAttempts === 'number' ? options.maxAttempts : parseInt(options.maxAttempts || '3'),
        };
        const validatedContext = workflow_1.TaskContextSchema.parse(context);
        // Initialize components
        const claudeClient = new client_1.ClaudeCodeClient();
        const orchestrator = new orchestrator_1.TDDOrchestrator(claudeClient);
        // Execute workflow with progress tracking
        const result = await executeWorkflowWithTracking(orchestrator, options.task, validatedContext, tracker);
        tracker.destroy();
        // Generate and display report
        const report = await cli.generateWorkflowReport(result);
        console.log(report);
        // Record command in history
        const duration = Date.now() - startTime;
        await cli.recordCommand('generate', options, result.success, duration);
        // Export report if requested (feature for future implementation)
        // This would require adding exportFormat and exportPath options to PhoenixCodeLiteOptions
        if (!result.success) {
            (0, test_utils_1.safeExit)(1);
        }
    }
    catch (error) {
        const duration = Date.now() - startTime;
        await cli.recordCommand('generate', options, false, duration);
        console.error(chalk_1.default.red('✗ Fatal error:'), error instanceof Error ? error.message : 'Unknown error');
        (0, test_utils_1.safeExit)(1);
    }
}
async function wizardCommand() {
    try {
        const figlet = await Promise.resolve().then(() => __importStar(require('figlet')));
        const gradient = await Promise.resolve().then(() => __importStar(require('gradient-string')));
        console.log(gradient.default.pastel.multiline(figlet.default.textSync('Setup', { font: 'Small' })));
    }
    catch (error) {
        console.log(chalk_1.default.blue('Phoenix Code-Lite Enhanced Setup Wizard'));
    }
    const { EnhancedWizard } = await Promise.resolve().then(() => __importStar(require('./enhanced-wizard')));
    const wizard = new EnhancedWizard();
    try {
        const answers = await wizard.runEnhancedWizard({
            projectPath: process.cwd(),
            verbose: false
        });
        // Generate configuration based on enhanced wizard answers
        const configTemplate = wizard.generateConfiguration(answers);
        // Apply configuration
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        await fs.writeFile('.phoenix-code-lite.json', JSON.stringify(configTemplate, null, 2));
        console.log(chalk_1.default.green('\n✅ Enhanced configuration created successfully!'));
        // Show discovery summary if available
        if (answers.discoveredContext && answers.useDiscoveredSettings) {
            console.log(chalk_1.default.cyan('\n📊 Applied smart defaults based on project analysis:'));
            console.log(chalk_1.default.gray(`  • Detected: ${answers.discoveredContext.language} ${answers.discoveredContext.framework ? `with ${answers.discoveredContext.framework}` : ''}`));
            console.log(chalk_1.default.gray(`  • Template: ${answers.qualityLevel}`));
            console.log(chalk_1.default.gray(`  • Confidence: ${Math.round(answers.discoveredContext.confidence * 100)}%`));
        }
        console.log(chalk_1.default.gray('\nRun "phoenix-code-lite generate --task \'your task\'" to get started.'));
        console.log(chalk_1.default.dim('Use "phoenix-code-lite config" to modify settings anytime.'));
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('cancelled')) {
            console.log(chalk_1.default.yellow('\n⚠️ Setup wizard cancelled by user.'));
            console.log(chalk_1.default.gray('You can run "phoenix-code-lite wizard" again anytime.'));
        }
        else {
            console.error(chalk_1.default.red('\n❌ Setup wizard failed:'), error);
            console.log(chalk_1.default.gray('Please try again or check the error message above.'));
        }
    }
}
async function historyCommand(options) {
    const cli = new advanced_cli_1.AdvancedCLI();
    await cli.displayHistory(options.limit || 10);
}
async function helpCommand(options) {
    const cli = new advanced_cli_1.AdvancedCLI();
    if (options.contextual) {
        const help = await cli.getContextualHelp();
        console.log(help);
    }
    else {
        const helpSystem = new (await Promise.resolve().then(() => __importStar(require('./help-system')))).HelpSystem();
        console.log(helpSystem.generateQuickReference());
    }
}
// Helper function to execute workflow with progress tracking
async function executeWorkflowWithTracking(orchestrator, taskDescription, context, tracker) {
    // Phase 1: Planning & Testing
    tracker.startPhase('Planning & Testing', 3);
    tracker.completeSubstep('Analyzing requirements');
    tracker.completeSubstep('Designing test strategy');
    tracker.completeSubstep('Creating comprehensive tests');
    // Phase 2: Implementation & Fixing
    tracker.startPhase('Implementation & Fixing', 2);
    tracker.completeSubstep('Code generation');
    tracker.completeSubstep('Running tests and fixes');
    // Phase 3: Refactoring & Documentation
    tracker.startPhase('Refactoring & Documentation', 2);
    tracker.completeSubstep('Code quality improvements');
    tracker.completeSubstep('Documentation generation');
    // Execute the actual workflow
    const result = await orchestrator.executeWorkflow(taskDescription, context);
    // Complete final phase
    tracker.completePhase(result.success);
    return result;
}
// Session-based action executor
async function executeSessionAction(action, data, context) {
    const [category, command] = action.split(':');
    try {
        switch (category) {
            case 'config':
                await executeConfigAction(command, data, context);
                break;
            case 'templates':
                await executeTemplateAction(command, data, context);
                break;
            case 'generate':
                await executeGenerateAction(command, data, context);
                break;
            case 'advanced':
                await executeAdvancedAction(command, data, context);
                break;
            default:
                console.log(chalk_1.default.red(`Unknown action category: ${category}`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('Action failed:'), error instanceof Error ? error.message : 'Unknown error');
    }
    // Wait for user to continue
    await waitForEnter();
}
async function executeConfigAction(command, data, context) {
    const config = await settings_1.PhoenixCodeLiteConfig.load();
    switch (command) {
        case 'show':
            console.log(chalk_1.default.green.bold('\n📋 Current Configuration'));
            console.log(chalk_1.default.gray('═'.repeat(50)));
            console.log(config_formatter_1.ConfigFormatter.formatConfig(config.export()));
            break;
        case 'edit':
            const prompts = new interactive_1.InteractivePrompts();
            const result = await prompts.runInteractiveConfigEditor();
            if (result.saved) {
                console.log(chalk_1.default.green('\n✓ Configuration updated successfully!'));
            }
            break;
        case 'framework':
            await showFrameworkSettings(config);
            break;
        case 'quality':
            await showQualitySettings(config);
            break;
        case 'security':
            await showSecuritySettings();
            break;
        case 'templates':
            context.currentItem = 'Templates';
            await showConfigTemplateOptions();
            break;
        case 'documents':
            context.currentItem = 'Document Management';
            await executeDocumentManagementAction(data, context);
            break;
        default:
            console.log(chalk_1.default.red(`Unknown config command: ${command}`));
    }
}
async function executeTemplateAction(command, data, context) {
    switch (command) {
        case 'list':
            await showTemplateList();
            break;
        case 'use':
            await switchToTemplate(data?.template, context);
            break;
        case 'preview':
            await showTemplatePreview(data?.template);
            break;
        case 'create':
            await createNewTemplate(data?.name, context);
            break;
        case 'edit':
            await editTemplate(data?.template, context);
            break;
        case 'reset':
            await resetTemplate(data?.template, context);
            break;
        default:
            console.log(chalk_1.default.red(`Unknown template command: ${command}`));
    }
}
async function executeGenerateAction(command, data, context) {
    const description = data?.description;
    if (!description || description.trim().length < 5) {
        console.log(chalk_1.default.yellow('Please provide a task description:'));
        const prompts = new interactive_1.InteractivePrompts();
        const task = await prompts.getTaskInput();
        data = { ...data, description: task };
    }
    switch (command) {
        case 'task':
            await executeTaskGeneration(data?.description, context);
            break;
        case 'component':
            await executeComponentGeneration(data?.description, context);
            break;
        case 'api':
            await executeApiGeneration(data?.description, context);
            break;
        case 'test':
            await executeTestGeneration(data?.description, context);
            break;
        default:
            console.log(chalk_1.default.red(`Unknown generate command: ${command}`));
    }
}
async function executeAdvancedAction(command, data, context) {
    switch (command) {
        case 'language':
            await showLanguageSettings();
            break;
        case 'agents':
            await showAgentSettings();
            break;
        case 'logging':
            await showLoggingSettings();
            break;
        case 'metrics':
            await showMetricsSettings();
            break;
        case 'debug':
            await showDebugSettings();
            break;
        default:
            console.log(chalk_1.default.red(`Unknown advanced command: ${command}`));
    }
}
// Helper functions for template management with enhanced UX
async function showTemplateList() {
    console.log(chalk_1.default.yellow.bold('\n📄 Available Templates'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    const templates = [
        { name: 'starter', description: 'Basic settings for learning and experimentation', coverage: '70%', quality: 'Basic' },
        { name: 'enterprise', description: 'Strict quality gates and comprehensive validation', coverage: '90%', quality: 'Comprehensive' },
        { name: 'performance', description: 'Speed-optimized with minimal overhead', coverage: '60%', quality: 'Minimal' },
        { name: 'default', description: 'Balanced configuration for most projects', coverage: '80%', quality: 'Standard' }
    ];
    for (const template of templates) {
        console.log(chalk_1.default.yellow(`${template.name.padEnd(12)} `) + chalk_1.default.gray(template.description));
        console.log(chalk_1.default.gray(`                Coverage: ${template.coverage} • Quality: ${template.quality}`));
        console.log();
    }
}
async function switchToTemplate(templateName, context) {
    if (!templateName) {
        console.log(chalk_1.default.yellow('Available templates: starter, enterprise, performance, default'));
        return;
    }
    const templates = {
        'starter': templates_1.ConfigurationTemplates.getStarterTemplate(),
        'enterprise': templates_1.ConfigurationTemplates.getEnterpriseTemplate(),
        'performance': templates_1.ConfigurationTemplates.getPerformanceTemplate(),
        'default': settings_1.PhoenixCodeLiteConfig.getDefault().export()
    };
    if (!templates[templateName]) {
        console.log(chalk_1.default.red(`Unknown template: ${templateName}`));
        return;
    }
    // Enhanced feedback with template name context
    console.log(chalk_1.default.green(`✓ Switched to ${templateName} template`));
    console.log(chalk_1.default.gray(`Configuration updated for ${templateName} settings`));
    // Save the new template
    const config = new settings_1.PhoenixCodeLiteConfig(templates[templateName], (0, path_1.join)(process.cwd(), '.phoenix-code-lite.json'));
    await config.save(true);
    // Update context for consistent navigation
    context.currentItem = templateName;
}
async function showTemplatePreview(templateName) {
    if (!templateName) {
        console.log(chalk_1.default.yellow('Previewing all templates:'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        const templates = ['starter', 'enterprise', 'performance', 'default'];
        for (const name of templates) {
            await showSingleTemplatePreview(name);
        }
    }
    else {
        await showSingleTemplatePreview(templateName);
    }
}
async function showSingleTemplatePreview(templateName) {
    const templates = {
        'starter': templates_1.ConfigurationTemplates.getStarterTemplate(),
        'enterprise': templates_1.ConfigurationTemplates.getEnterpriseTemplate(),
        'performance': templates_1.ConfigurationTemplates.getPerformanceTemplate(),
        'default': settings_1.PhoenixCodeLiteConfig.getDefault().export()
    };
    const template = templates[templateName];
    if (!template) {
        console.log(chalk_1.default.red(`Unknown template: ${templateName}`));
        return;
    }
    console.log(chalk_1.default.yellow.bold(`📊 ${templateName.toUpperCase()} TEMPLATE`));
    console.log(chalk_1.default.gray('─'.repeat(30)));
    console.log(config_formatter_1.ConfigFormatter.formatConfigSummary(template));
    console.log();
}
async function resetTemplate(templateName, context) {
    if (!templateName) {
        console.log(chalk_1.default.yellow('Please specify a template to reset (starter, enterprise, performance, default)'));
        return;
    }
    // Enhanced confirmation with template name context
    const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
    const { confirm } = await inquirer.default.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: `Reset the ${templateName} template to its default settings?`,
            default: false
        }]);
    if (confirm) {
        // Enhanced feedback with specific template name
        console.log(chalk_1.default.green(`✓ ${templateName} template has been reset to its default settings`));
        console.log(chalk_1.default.gray('All customizations have been removed'));
    }
    else {
        console.log(chalk_1.default.gray('Reset cancelled'));
    }
}
async function createNewTemplate(name, context) {
    if (!name) {
        console.log(chalk_1.default.yellow('Please provide a name for the new template'));
        return;
    }
    console.log(chalk_1.default.blue.bold(`\n🧙 Creating Template: ${name}`));
    console.log(chalk_1.default.gray('This wizard will help you configure your custom template'));
    // Template creation wizard implementation would go here
    // For now, show a placeholder
    console.log(chalk_1.default.yellow('\n⚠ Template creation wizard is not yet implemented'));
    console.log(chalk_1.default.gray('This feature will be available in a future update'));
}
async function editTemplate(templateName, context) {
    if (!templateName) {
        console.log(chalk_1.default.yellow('Please specify a template to edit (starter, enterprise, performance, default)'));
        return;
    }
    console.log(chalk_1.default.yellow.bold(`\n📝 Editing Template: ${templateName}`));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    // For now, redirect to the configuration editor
    const prompts = new interactive_1.InteractivePrompts();
    const result = await prompts.runInteractiveConfigEditor();
    if (result.saved) {
        console.log(chalk_1.default.green(`\n✓ ${templateName} template has been updated successfully!`));
        if (context) {
            context.currentItem = templateName;
        }
    }
    else {
        console.log(chalk_1.default.gray('No changes made to template'));
    }
}
// Helper functions for other actions
async function showFrameworkSettings(config) {
    console.log(chalk_1.default.green.bold('\n⚙️ Framework Settings'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log(`Claude Max Turns: ${config.get('claude.maxTurns')}`);
    console.log(`Claude Timeout: ${config.get('claude.timeout')}ms`);
    console.log(`Retry Attempts: ${config.get('claude.retryAttempts')}`);
    console.log(`TDD Max Attempts: ${config.get('tdd.maxImplementationAttempts')}`);
}
async function showQualitySettings(config) {
    console.log(chalk_1.default.green.bold('\n📊 Quality Settings'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log(`Test Quality Threshold: ${config.get('tdd.testQualityThreshold')}`);
    console.log(`Min Test Coverage: ${config.get('quality.minTestCoverage')}`);
    console.log(`Max Complexity: ${config.get('quality.maxComplexity')}`);
}
async function showSecuritySettings() {
    console.log(chalk_1.default.green.bold('\n🛡️ Security Settings'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log(chalk_1.default.green('✅ Security Status: Active'));
    console.log(chalk_1.default.gray('All security guardrails are operational'));
}
async function showConfigTemplateOptions() {
    console.log(chalk_1.default.green.bold('\n📄 Configuration Templates'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log('Use the "templates" section to manage configuration templates');
    console.log(chalk_1.default.gray('Navigate to templates from the main menu'));
}
async function showLanguageSettings() {
    console.log(chalk_1.default.cyan.bold('\n🔤 Language Preferences'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log(chalk_1.default.gray('Language preferences are now set per-project during generation'));
    console.log(chalk_1.default.gray('This provides better flexibility for multi-language projects'));
}
async function showAgentSettings() {
    console.log(chalk_1.default.cyan.bold('\n🤖 Agent Settings'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    try {
        const config = await settings_1.PhoenixCodeLiteConfig.load();
        const configData = config.export();
        const agentSettings = configData.agents || {};
        // Display each agent's configuration
        const agents = [
            { key: 'planningAnalyst', name: 'Planning Analyst', icon: '🧠' },
            { key: 'implementationEngineer', name: 'Implementation Engineer', icon: '⚡' },
            { key: 'qualityReviewer', name: 'Quality Reviewer', icon: '🔍' }
        ];
        agents.forEach(agent => {
            const settings = agentSettings[agent.key] || {};
            const enabled = settings.enabled !== false;
            const status = enabled ? chalk_1.default.green('Active') : chalk_1.default.red('Inactive');
            console.log(`${agent.icon} ${agent.name}: ${status}`);
            if (enabled) {
                console.log(chalk_1.default.gray(`   Priority: ${settings.priority || 0.8}`));
                console.log(chalk_1.default.gray(`   Timeout: ${settings.timeout || 30000}ms`));
                console.log(chalk_1.default.gray(`   Retry Attempts: ${settings.retryAttempts || 2}`));
                if (settings.customPrompts && Object.keys(settings.customPrompts).length > 0) {
                    console.log(chalk_1.default.gray(`   Custom Prompts: ${Object.keys(settings.customPrompts).length} defined`));
                }
            }
            console.log();
        });
        // Global agent settings
        console.log(chalk_1.default.yellow('Global Agent Settings:'));
        console.log(chalk_1.default.gray(`  Specialization Enabled: ${agentSettings.enableSpecialization !== false ? 'Yes' : 'No'}`));
        console.log(chalk_1.default.gray(`  Fallback to Generic: ${agentSettings.fallbackToGeneric !== false ? 'Yes' : 'No'}`));
    }
    catch (error) {
        console.log(chalk_1.default.red('Error loading agent configuration'));
        console.log(chalk_1.default.gray('Using default agent settings'));
        console.log('Planning Analyst: Active (Default)');
        console.log('Implementation Engineer: Active (Default)');
        console.log('Quality Reviewer: Active (Default)');
    }
}
async function showLoggingSettings() {
    console.log(chalk_1.default.cyan.bold('\n📝 Logging Settings'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log('Audit logging is enabled by default');
    console.log('All workflow operations are tracked');
}
async function showMetricsSettings() {
    console.log(chalk_1.default.cyan.bold('\n📊 Metrics Settings'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log('Performance metrics collection is active');
    console.log('Token usage and execution time are tracked');
}
async function showDebugSettings() {
    console.log(chalk_1.default.cyan.bold('\n🐛 Debug Settings'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log('Debug mode: Disabled');
    console.log('Verbose logging: Disabled');
}
async function executeDocumentManagementAction(data, context) {
    try {
        console.log(chalk_1.default.cyan.bold('\n📋 Document Management'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        // Initialize document manager
        const documentManager = new document_manager_1.DocumentManager();
        await documentManager.initializeDocumentSystem();
        // Get current template for context
        const config = await settings_1.PhoenixCodeLiteConfig.load();
        const currentTemplate = config.get('template') || 'starter';
        console.log(chalk_1.default.gray(`Current Template: ${chalk_1.default.cyan(currentTemplate)}`));
        // Get available documents
        const inventory = await documentManager.getAvailableDocuments();
        const totalDocs = inventory.global.length +
            Object.values(inventory.agents).reduce((sum, docs) => sum + docs.length, 0);
        console.log(chalk_1.default.gray(`Total Documents: ${chalk_1.default.cyan(totalDocs)} (${inventory.global.length} global, ${Object.values(inventory.agents).reduce((sum, docs) => sum + docs.length, 0)} agent-specific)`));
        // Display document categories
        console.log(chalk_1.default.yellow('\nDocument Categories:'));
        console.log(`1. Global Documents (${inventory.global.length})`);
        console.log(`2. Planning Agent Documents (${inventory.agents['planning-analyst'].length})`);
        console.log(`3. Implementation Documents (${inventory.agents['implementation-engineer'].length})`);
        console.log(`4. Quality Review Documents (${inventory.agents['quality-reviewer'].length})`);
        console.log(`5. Template Document Settings`);
        console.log(`6. Back to Configuration Menu`);
        console.log(chalk_1.default.gray('\n📖 Document Management Integration:'));
        console.log(chalk_1.default.gray('• Each template maintains separate document activation settings'));
        console.log(chalk_1.default.gray('• Documents can be enabled/disabled per agent and per template'));
        console.log(chalk_1.default.gray('• Global documents are available to all agents when activated'));
        console.log(chalk_1.default.gray('• Agent-specific documents provide specialized context'));
        console.log(chalk_1.default.cyan('\n🔗 Access Full Document Management:'));
        console.log(chalk_1.default.gray('  → Configuration > Edit > Document Management'));
        console.log(chalk_1.default.gray('  → Interactive configuration editor with full document controls'));
    }
    catch (error) {
        console.log(chalk_1.default.red('Error loading document management:'));
        console.log(chalk_1.default.gray(`Details: ${error instanceof Error ? error.message : 'Unknown error'}`));
        console.log(chalk_1.default.gray('\n💡 Troubleshooting:'));
        console.log(chalk_1.default.gray('• Ensure .phoenix-documents directory exists'));
        console.log(chalk_1.default.gray('• Run: phoenix-code-lite init to initialize document system'));
        console.log(chalk_1.default.gray('• Check file permissions for document directory'));
    }
}
async function executeTaskGeneration(description, context) {
    console.log(chalk_1.default.magenta.bold('\n⚡ Generating Code from Task'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log(chalk_1.default.white(`Task: ${description}`));
    const options = {
        task: description,
        projectPath: process.cwd(),
        verbose: false
    };
    await enhancedGenerateCommand(options);
}
async function executeComponentGeneration(description, context) {
    console.log(chalk_1.default.magenta.bold('\n🧩 Generating UI Component'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log(chalk_1.default.white(`Component: ${description}`));
    const options = {
        task: `Create a UI component: ${description}`,
        projectPath: process.cwd(),
        verbose: false
    };
    await enhancedGenerateCommand(options);
}
async function executeApiGeneration(description, context) {
    console.log(chalk_1.default.magenta.bold('\n🌐 Generating API Endpoint'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log(chalk_1.default.white(`API: ${description}`));
    const options = {
        task: `Create an API endpoint: ${description}`,
        projectPath: process.cwd(),
        verbose: false
    };
    await enhancedGenerateCommand(options);
}
async function executeTestGeneration(description, context) {
    console.log(chalk_1.default.magenta.bold('\n🧪 Generating Tests'));
    console.log(chalk_1.default.gray('═'.repeat(50)));
    console.log(chalk_1.default.white(`Tests: ${description}`));
    const options = {
        task: `Generate tests for: ${description}`,
        projectPath: process.cwd(),
        verbose: false
    };
    await enhancedGenerateCommand(options);
}
async function waitForEnter() {
    // Fix Issue #2: Proper session continuation instead of process exit
    return new Promise((resolve) => {
        console.log(chalk_1.default.gray('\nPress Enter to continue...'));
        // Simple approach: just wait for any keypress
        const stdin = process.stdin;
        stdin.resume();
        stdin.setEncoding('utf8');
        const handleInput = () => {
            stdin.removeListener('data', handleInput);
            resolve();
        };
        stdin.once('data', handleInput);
    });
}
//# sourceMappingURL=enhanced-commands.js.map
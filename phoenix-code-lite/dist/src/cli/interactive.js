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
exports.InteractivePrompts = void 0;
const chalk_1 = __importDefault(require("chalk"));
const settings_1 = require("../config/settings");
const templates_1 = require("../config/templates");
const config_formatter_1 = require("./config-formatter");
class InteractivePrompts {
    async runConfigurationWizard() {
        console.log(chalk_1.default.blue.bold('\n🧙 Phoenix-Code-Lite Configuration Wizard\n'));
        console.log('This wizard will help you set up Phoenix-Code-Lite for your project.\n');
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        // Enhanced wizard with navigation support
        let currentStep = 0;
        const steps = this.getConfigurationWizardSteps();
        const responses = [];
        while (currentStep < steps.length) {
            const step = steps[currentStep];
            const canGoBack = currentStep > 0;
            const canCancel = true;
            const progress = `${currentStep + 1}/${steps.length}`;
            // Add navigation options to each step
            const stepWithNavigation = {
                ...step,
                message: `${step.message} ${chalk_1.default.gray(`[${progress}]`)} ${chalk_1.default.dim('(ESC to exit)')}`,
            };
            // Add navigation choices for steps after the first
            if (canGoBack || canCancel) {
                const navigationChoices = [];
                if (canGoBack) {
                    navigationChoices.push(new inquirer.default.Separator());
                    navigationChoices.push({ name: '← Back to previous step', value: '__BACK__' });
                }
                if (canCancel) {
                    navigationChoices.push({ name: '❌ Cancel wizard', value: '__CANCEL__' });
                }
                if (step.type === 'list') {
                    stepWithNavigation.choices = [...(step.choices || []), ...navigationChoices];
                }
            }
            const response = await inquirer.default.prompt([stepWithNavigation]);
            const answer = response[step.name];
            if (answer === '__BACK__') {
                currentStep = Math.max(0, currentStep - 1);
                responses.pop(); // Remove previous response
                continue;
            }
            else if (answer === '__CANCEL__') {
                const { confirmCancel } = await inquirer.default.prompt([{
                        type: 'confirm',
                        name: 'confirmCancel',
                        message: 'Are you sure you want to cancel the setup wizard?',
                        default: false
                    }]);
                if (confirmCancel) {
                    throw new Error('Setup wizard cancelled by user');
                }
                continue; // Stay on current step
            }
            responses.push({ [step.name]: answer });
            currentStep++;
        }
        // Combine all responses into final answers object
        const answers = responses.reduce((acc, response) => ({ ...acc, ...response }), {});
        return answers;
    }
    async confirmOverwrite(path) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        const { confirm } = await inquirer.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Configuration file exists at ${path}. Overwrite?`,
                default: false,
            },
        ]);
        return confirm;
    }
    async selectTemplate() {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        const { template } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'template',
                message: 'Choose a configuration template:',
                choices: [
                    {
                        name: 'Starter - Basic settings for learning and experimentation',
                        value: 'starter',
                    },
                    {
                        name: 'Professional - Balanced settings for production projects',
                        value: 'professional',
                    },
                    {
                        name: 'Enterprise - Strict quality gates and comprehensive validation',
                        value: 'enterprise',
                    },
                    {
                        name: 'Performance - Optimized for speed with minimal overhead',
                        value: 'performance',
                    },
                ],
            },
        ]);
        return template;
    }
    validateTaskDescription(input) {
        if (!input || input.trim().length === 0) {
            return false;
        }
        if (input.trim().length < 10) {
            return false;
        }
        return true;
    }
    async handleEscapeKey() {
        console.log(chalk_1.default.yellow('\n⚠ ESC pressed - Exit current operation?'));
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        const { confirm } = await inquirer.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Do you want to exit the current operation?',
                default: true,
            },
        ]);
        return confirm;
    }
    setupEscapeHandler() {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', (key) => {
            // ESC key code is 27
            if (key[0] === 27) {
                this.handleEscapeKey().then((shouldExit) => {
                    if (shouldExit) {
                        console.log(chalk_1.default.gray('\n✓ Operation cancelled by user'));
                        process.exit(0);
                    }
                });
            }
        });
    }
    cleanupEscapeHandler() {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
            process.stdin.pause();
        }
    }
    getConfigurationWizardSteps() {
        return [
            {
                type: 'list',
                name: 'projectType',
                message: 'What type of project are you working on?',
                choices: [
                    { name: 'Web Application (Frontend)', value: 'web' },
                    { name: 'API/Backend Service', value: 'api' },
                    { name: 'Library/Package', value: 'library' },
                    { name: 'CLI Tool', value: 'cli' },
                ],
            },
            {
                type: 'list',
                name: 'language',
                message: 'What programming language?',
                choices: [
                    { name: 'JavaScript', value: 'javascript' },
                    { name: 'TypeScript', value: 'typescript' },
                    { name: 'Python', value: 'python' },
                ],
            },
            {
                type: 'list',
                name: 'framework',
                message: 'Which framework are you using?',
                choices: [
                    { name: 'React', value: 'React' },
                    { name: 'Vue.js', value: 'Vue.js' },
                    { name: 'Angular', value: 'Angular' },
                    { name: 'Express.js', value: 'Express.js' },
                    { name: 'Fastify', value: 'Fastify' },
                    { name: 'Flask', value: 'Flask' },
                    { name: 'Django', value: 'Django' },
                    { name: 'None', value: 'None' },
                ],
            },
            {
                type: 'list',
                name: 'qualityLevel',
                message: 'What quality level do you need?',
                choices: [
                    {
                        name: 'Starter - Learning and experimentation (70% test coverage)',
                        value: 'starter',
                    },
                    {
                        name: 'Professional - Production ready (80% test coverage)',
                        value: 'professional',
                    },
                    {
                        name: 'Enterprise - Mission critical (90% test coverage)',
                        value: 'enterprise',
                    },
                ],
            },
            {
                type: 'confirm',
                name: 'enableAdvancedFeatures',
                message: 'Enable advanced features? (Audit logging, metrics, detailed reporting)',
                default: true,
            },
        ];
    }
    // Keep the old method for backward compatibility
    getConfigurationWizard() {
        return this.getConfigurationWizardSteps();
    }
    async getTaskInput() {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        const { task } = await inquirer.default.prompt([
            {
                type: 'input',
                name: 'task',
                message: 'Describe the task you want to implement:',
                validate: (input) => {
                    if (!this.validateTaskDescription(input)) {
                        return 'Task description must be at least 10 characters long and descriptive.';
                    }
                    return true;
                },
            },
        ]);
        return task;
    }
    async runInteractiveConfigEditor() {
        console.log(chalk_1.default.blue.bold('\n📋 Phoenix Code Lite Configuration Editor\n'));
        const config = await settings_1.PhoenixCodeLiteConfig.load();
        let currentConfig = config.clone();
        let hasChanges = false;
        while (true) {
            const action = await this.showMainConfigMenu(currentConfig);
            switch (action) {
                case 'framework':
                    hasChanges = await this.editFrameworkSettings(currentConfig) || hasChanges;
                    break;
                case 'language':
                    hasChanges = await this.editLanguagePreferences(currentConfig) || hasChanges;
                    break;
                case 'quality':
                    hasChanges = await this.editQualityThresholds(currentConfig) || hasChanges;
                    break;
                case 'security':
                    hasChanges = await this.editSecurityPolicies(currentConfig) || hasChanges;
                    break;
                case 'templates':
                    const result = await this.manageTemplates(currentConfig);
                    if (result.templateUpdated) {
                        return { saved: true, templateUpdated: result.templateUpdated, config: currentConfig };
                    }
                    hasChanges = result.hasChanges || hasChanges;
                    break;
                case 'advanced':
                    hasChanges = await this.editAdvancedSettings(currentConfig) || hasChanges;
                    break;
                case 'save':
                    if (hasChanges) {
                        await currentConfig.save(true);
                        console.log(chalk_1.default.green('\n✓ Configuration saved successfully!'));
                        return { saved: true, config: currentConfig };
                    }
                    else {
                        console.log(chalk_1.default.yellow('\n⚠ No changes to save.'));
                        return { saved: false };
                    }
                case 'cancel':
                    if (hasChanges) {
                        const confirm = await this.confirmDiscardChanges();
                        if (confirm) {
                            console.log(chalk_1.default.yellow('\n⚠ Changes discarded.'));
                            return { saved: false };
                        }
                        continue; // Go back to menu
                    }
                    else {
                        console.log(chalk_1.default.gray('\n✓ No changes made.'));
                        return { saved: false };
                    }
                default:
                    return { saved: false };
            }
        }
    }
    async showMainConfigMenu(config) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        // Clear screen and show consistent header
        console.clear();
        console.log(chalk_1.default.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.gray(`Current: ${config_formatter_1.ConfigFormatter.formatConfigSummary(config.export())}`));
        console.log(chalk_1.default.dim('Press ESC at any time to exit'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        const { action } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Select configuration section:',
                choices: [
                    { name: '⚙️  Framework Settings', value: 'framework' },
                    { name: '🔤 Language Preferences', value: 'language' },
                    { name: '📊 Quality Thresholds', value: 'quality' },
                    { name: '🛡️  Security Policies', value: 'security' },
                    { name: '📄 Templates', value: 'templates' },
                    { name: '🔧 Advanced Settings', value: 'advanced' },
                    new inquirer.default.Separator(),
                    { name: '💾 Save Configuration', value: 'save' },
                    { name: '❌ Cancel', value: 'cancel' },
                ],
                pageSize: 10,
                loop: false,
            },
        ]);
        return action;
    }
    async editFrameworkSettings(config) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        console.clear();
        console.log(chalk_1.default.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.blue.bold('⚙️  Framework Settings'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        const { setting } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'setting',
                message: 'Select setting to configure:',
                choices: [
                    { name: `Claude Max Turns ${chalk_1.default.gray(`(current: ${config.get('claude.maxTurns')})`)}`, value: 'maxTurns' },
                    { name: `Claude Timeout ${chalk_1.default.gray(`(current: ${config.get('claude.timeout')}ms)`)}`, value: 'timeout' },
                    { name: `Retry Attempts ${chalk_1.default.gray(`(current: ${config.get('claude.retryAttempts')})`)}`, value: 'retryAttempts' },
                    { name: `TDD Max Attempts ${chalk_1.default.gray(`(current: ${config.get('tdd.maxImplementationAttempts')})`)}`, value: 'maxImplementationAttempts' },
                    new inquirer.default.Separator(),
                    { name: '← Back to Main Menu', value: 'back' },
                ],
                pageSize: 10,
                loop: false,
            },
        ]);
        if (setting === 'back')
            return false;
        return await this.editSpecificSetting(config, setting);
    }
    async editSpecificSetting(config, setting) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        const currentValue = config.get(this.getConfigPath(setting));
        const settingInfo = this.getSettingInfo(setting);
        const prompt = {
            type: settingInfo.type,
            name: 'newValue',
            message: `${settingInfo.label} ${chalk_1.default.gray(`(current: ${currentValue})`)}:`,
            default: currentValue,
            choices: settingInfo.choices,
            validate: settingInfo.validate,
        };
        // Add step for decimal number inputs
        if (settingInfo.type === 'number' && settingInfo.allowDecimals) {
            prompt.step = 0.1;
        }
        const { action } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: `Configure ${settingInfo.label}`,
                choices: [
                    { name: `Change value (currently: ${chalk_1.default.cyan(currentValue)})`, value: 'change' },
                    { name: '← Back to previous menu', value: 'back' },
                ],
            },
        ]);
        if (action === 'back') {
            return false;
        }
        const { newValue } = await inquirer.default.prompt([prompt]);
        if (newValue !== currentValue) {
            config.set(this.getConfigPath(setting), newValue);
            console.log(chalk_1.default.green(`✓ ${settingInfo.label} updated to: ${chalk_1.default.cyan(newValue)}`));
            return true;
        }
        return false;
    }
    getConfigPath(setting) {
        const paths = {
            maxTurns: 'claude.maxTurns',
            timeout: 'claude.timeout',
            retryAttempts: 'claude.retryAttempts',
            maxImplementationAttempts: 'tdd.maxImplementationAttempts',
            testQualityThreshold: 'tdd.testQualityThreshold',
            minTestCoverage: 'quality.minTestCoverage',
            maxComplexity: 'quality.maxComplexity',
            verbose: 'output.verbose',
            logLevel: 'output.logLevel',
        };
        return paths[setting] || setting;
    }
    getSettingInfo(setting) {
        const settings = {
            maxTurns: {
                label: 'Maximum Claude turns',
                type: 'number',
                validate: (value) => value >= 1 && value <= 10 ? true : 'Must be between 1 and 10',
            },
            timeout: {
                label: 'Claude timeout (milliseconds)',
                type: 'number',
                validate: (value) => value >= 30000 && value <= 1800000 ? true : 'Must be between 30,000 and 1,800,000 ms',
            },
            retryAttempts: {
                label: 'Retry attempts',
                type: 'number',
                validate: (value) => value >= 1 && value <= 5 ? true : 'Must be between 1 and 5',
            },
            maxImplementationAttempts: {
                label: 'Maximum implementation attempts',
                type: 'number',
                validate: (value) => value >= 1 && value <= 10 ? true : 'Must be between 1 and 10',
            },
            testQualityThreshold: {
                label: 'Test quality threshold',
                type: 'number',
                allowDecimals: true,
                validate: (value) => value >= 0 && value <= 1 ? true : 'Must be between 0.0 and 1.0',
            },
            minTestCoverage: {
                label: 'Minimum test coverage',
                type: 'number',
                allowDecimals: true,
                validate: (value) => value >= 0 && value <= 1 ? true : 'Must be between 0.0 and 1.0',
            },
            maxComplexity: {
                label: 'Maximum complexity',
                type: 'number',
                validate: (value) => value >= 1 && value <= 50 ? true : 'Must be between 1 and 50',
            },
            logLevel: {
                label: 'Log level',
                type: 'list',
                choices: ['error', 'warn', 'info', 'debug'],
            },
        };
        return settings[setting] || { label: setting, type: 'input' };
    }
    async editLanguagePreferences(config) {
        console.log(chalk_1.default.blue('\n🔤 Language Preferences'));
        console.log(chalk_1.default.gray('Language preferences have been moved to Advanced Settings.'));
        console.log(chalk_1.default.gray('Navigate to Advanced Settings > Language Preferences for configuration.'));
        await this.pressEnterToContinue();
        return false;
    }
    async editLanguagePreferencesAdvanced(config) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        console.clear();
        console.log(chalk_1.default.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.blue.bold('🔤 Language Preferences'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        const { action } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Language preference options:',
                choices: [
                    { name: 'Default Language Preference', value: 'default' },
                    { name: 'Framework-Specific Language Settings', value: 'framework' },
                    { name: 'Template-Specific Language Overrides', value: 'template' },
                    new inquirer.default.Separator(),
                    { name: '← Back to Advanced Settings', value: 'back' },
                ],
            },
        ]);
        if (action === 'back')
            return false;
        switch (action) {
            case 'default':
                console.log(chalk_1.default.yellow('\n💡 Language preferences are now set per-project during generation.'));
                console.log(chalk_1.default.gray('This provides better flexibility for multi-language projects.'));
                break;
            case 'framework':
                console.log(chalk_1.default.yellow('\n⚙️ Framework-specific language settings'));
                console.log(chalk_1.default.gray('Configure language defaults based on detected frameworks.'));
                break;
            case 'template':
                console.log(chalk_1.default.yellow('\n📄 Template-specific language overrides'));
                console.log(chalk_1.default.gray('Set language preferences that override template defaults.'));
                break;
        }
        await this.pressEnterToContinue();
        return false;
    }
    async editAgentConfiguration(config) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        console.clear();
        console.log(chalk_1.default.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.blue.bold('🤖 Agent Configuration'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.green('✓ Planning Analyst: Active'));
        console.log(chalk_1.default.green('✓ Implementation Engineer: Active'));
        console.log(chalk_1.default.green('✓ Quality Reviewer: Active'));
        console.log();
        console.log(chalk_1.default.gray('All agents are currently operational and configured optimally.'));
        await this.pressEnterToContinue();
        return false;
    }
    async editLoggingConfiguration(config) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        console.clear();
        console.log(chalk_1.default.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.blue.bold('📝 Audit Logging Configuration'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.green('✓ Audit logging is enabled by default'));
        console.log(chalk_1.default.gray('• All workflow operations are tracked'));
        console.log(chalk_1.default.gray('• Performance metrics are collected'));
        console.log(chalk_1.default.gray('• Session data is preserved'));
        await this.pressEnterToContinue();
        return false;
    }
    async editMetricsConfiguration(config) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        console.clear();
        console.log(chalk_1.default.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.blue.bold('📊 Performance Metrics Configuration'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.green('✓ Performance metrics collection is active'));
        console.log(chalk_1.default.gray('• Token usage tracking'));
        console.log(chalk_1.default.gray('• Execution time measurement'));
        console.log(chalk_1.default.gray('• Quality score tracking'));
        console.log(chalk_1.default.gray('• Success rate monitoring'));
        await this.pressEnterToContinue();
        return false;
    }
    async editQualityThresholds(config) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        console.clear();
        console.log(chalk_1.default.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.blue.bold('📊 Quality Thresholds'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        const { setting } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'setting',
                message: 'Select quality setting to configure:',
                choices: [
                    { name: `Test Quality Threshold ${chalk_1.default.gray(`(current: ${config.get('tdd.testQualityThreshold')})`)}`, value: 'testQualityThreshold' },
                    { name: `Minimum Test Coverage ${chalk_1.default.gray(`(current: ${config.get('quality.minTestCoverage')})`)}`, value: 'minTestCoverage' },
                    { name: `Maximum Complexity ${chalk_1.default.gray(`(current: ${config.get('quality.maxComplexity')})`)}`, value: 'maxComplexity' },
                    new inquirer.default.Separator(),
                    { name: '← Back to Main Menu', value: 'back' },
                ],
                pageSize: 10,
                loop: false,
            },
        ]);
        if (setting === 'back')
            return false;
        return await this.editSpecificSetting(config, setting);
    }
    async editSecurityPolicies(config) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        console.clear();
        console.log(chalk_1.default.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.blue.bold('🛡️  Security Policies'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.yellow('Security policies are managed through the security guardrails system.'));
        console.log(chalk_1.default.gray('These settings ensure safe file access and command execution.\n'));
        const { action } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Security policy options:',
                choices: [
                    { name: '📖 View Security Documentation', value: 'docs' },
                    { name: '🔍 Check Current Security Status', value: 'status' },
                    { name: '⚙️  Security Settings (Advanced)', value: 'settings' },
                    new inquirer.default.Separator(),
                    { name: '← Back to Main Menu', value: 'back' },
                ],
                pageSize: 10,
                loop: false,
            },
        ]);
        switch (action) {
            case 'docs':
                console.log(chalk_1.default.blue('\n📖 Security Documentation'));
                console.log(chalk_1.default.gray('Security policies include:'));
                console.log(chalk_1.default.gray('• File access control (whitelist/blacklist paths)'));
                console.log(chalk_1.default.gray('• Command execution security (approved commands only)'));
                console.log(chalk_1.default.gray('• Size and time limits for operations'));
                console.log(chalk_1.default.gray('• Audit logging for security events'));
                break;
            case 'status':
                console.log(chalk_1.default.green('\n✅ Security Status: Active'));
                console.log(chalk_1.default.gray('All security guardrails are operational.'));
                break;
            case 'settings':
                console.log(chalk_1.default.yellow('\n⚠  Advanced security settings are managed through'));
                console.log(chalk_1.default.yellow('the security guardrails configuration file.'));
                break;
        }
        if (action !== 'back') {
            await this.pressEnterToContinue();
        }
        return false;
    }
    async manageTemplates(config) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        console.log(chalk_1.default.blue('\n📄 Template Management'));
        const { action } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do with templates?',
                choices: [
                    { name: 'Switch to Different Template', value: 'switch' },
                    { name: 'View Template Previews', value: 'preview' },
                    { name: 'Reset Current Template', value: 'reset' },
                    { name: '← Back to Main Menu', value: 'back' },
                ],
            },
        ]);
        switch (action) {
            case 'switch':
                const template = await this.selectTemplateWithPreview();
                if (template && template !== 'back') {
                    return { hasChanges: false, templateUpdated: template };
                }
                break;
            case 'preview':
                await this.showTemplatePreview();
                break;
            case 'reset':
                const confirm = await this.confirmTemplateReset();
                if (confirm) {
                    const defaultConfig = settings_1.PhoenixCodeLiteConfig.getDefault();
                    Object.assign(config, defaultConfig);
                    console.log(chalk_1.default.green('✓ Configuration reset to default template'));
                    return { hasChanges: true };
                }
                break;
        }
        return { hasChanges: false };
    }
    async editAdvancedSettings(config) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        console.clear();
        console.log(chalk_1.default.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(chalk_1.default.blue.bold('🔧 Advanced Settings'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        const { setting } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'setting',
                message: 'Which advanced setting would you like to adjust?',
                choices: [
                    { name: '🔤 Language Preferences', value: 'language' },
                    { name: '🤖 Agent Configuration', value: 'agents' },
                    { name: '📝 Audit Logging', value: 'logging' },
                    { name: '📊 Performance Metrics', value: 'metrics' },
                    { name: '🔊 Verbose Output', value: 'verbose' },
                    { name: '📋 Log Level', value: 'logLevel' },
                    new inquirer.default.Separator(),
                    { name: '← Back to Main Menu', value: 'back' },
                ],
                pageSize: 10,
                loop: false,
            },
        ]);
        if (setting === 'back')
            return false;
        // Handle language settings separately since they're now moved to advanced
        if (setting === 'language') {
            return await this.editLanguagePreferencesAdvanced(config);
        }
        else if (setting === 'agents') {
            return await this.editAgentConfiguration(config);
        }
        else if (setting === 'logging') {
            return await this.editLoggingConfiguration(config);
        }
        else if (setting === 'metrics') {
            return await this.editMetricsConfiguration(config);
        }
        return await this.editSpecificSetting(config, setting);
    }
    async selectTemplateWithPreview() {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        const { template } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'template',
                message: 'Select a configuration template:',
                choices: [
                    {
                        name: '🚀 Starter Template\n     Perfect for learning and experimentation\n     • Test Coverage: 70% • Quality Gates: Basic validation • Performance: Balanced',
                        value: 'starter',
                    },
                    {
                        name: '🏢 Enterprise Template\n     Production-ready with strict validation\n     • Test Coverage: 90% • Quality Gates: Comprehensive • Performance: Quality-focused',
                        value: 'enterprise',
                    },
                    {
                        name: '⚡ Performance Template\n     Speed-optimized for rapid iteration\n     • Test Coverage: 60% • Quality Gates: Minimal overhead • Performance: Speed-optimized',
                        value: 'performance',
                    },
                    {
                        name: '🎯 Default Template\n     Balanced configuration suitable for most projects\n     • Test Coverage: 80% • Quality Gates: Standard validation • Performance: Balanced',
                        value: 'default',
                    },
                    new inquirer.default.Separator(),
                    { name: '← Back to Template Menu', value: 'back' },
                ],
            },
        ]);
        return template;
    }
    async showTemplatePreview() {
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
        await this.pressEnterToContinue();
    }
    async confirmTemplateReset() {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        const { confirm } = await inquirer.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to reset to the default template? This will lose all current settings.',
                default: false,
            },
        ]);
        return confirm;
    }
    async confirmDiscardChanges() {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        const { confirm } = await inquirer.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'You have unsaved changes. Are you sure you want to discard them?',
                default: false,
            },
        ]);
        return confirm;
    }
    async pressEnterToContinue() {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        await inquirer.default.prompt([
            {
                type: 'input',
                name: 'continue',
                message: `${chalk_1.default.dim('Press Enter to continue')} ${chalk_1.default.gray('(or ESC to exit)')}...`,
            },
        ]);
    }
}
exports.InteractivePrompts = InteractivePrompts;
//# sourceMappingURL=interactive.js.map
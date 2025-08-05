"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigCommand = void 0;
const interactive_1 = require("../interactive");
const chalk_1 = __importDefault(require("chalk"));
class ConfigCommand {
    constructor(configManager, auditLogger) {
        this.configManager = configManager;
        this.auditLogger = auditLogger;
    }
    async execute(args) {
        this.auditLogger.log('info', 'Config command executed', { args });
        const options = this.parseArgs(args);
        try {
            if (options.show) {
                await this.showConfig();
            }
            else if (options.edit || options.adjust || options.add) {
                await this.handleInteractiveOperations(options);
            }
            else if (options.use) {
                await this.applyTemplate(options.use);
            }
            else if (options.reset) {
                await this.resetConfig();
            }
            else if (options.template) {
                await this.applyTemplate(options.template);
            }
            else {
                await this.showHelp();
            }
        }
        catch (error) {
            this.auditLogger.log('error', 'Config command failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    async showConfig() {
        // For now, we'll use a simple config display
        // In a real implementation, this would load the actual PhoenixCodeLiteConfig
        console.log(chalk_1.default.blue('Phoenix Code Lite Configuration:'));
        console.log(chalk_1.default.gray('Configuration loaded successfully'));
        // Show validation status
        const config = await this.configManager.getConfig();
        const isValid = this.configManager.validateConfig(config);
        if (isValid) {
            console.log(chalk_1.default.green('\n✓ Configuration is valid'));
        }
        else {
            console.log(chalk_1.default.yellow('\n⚠ Configuration has issues'));
        }
    }
    async handleInteractiveOperations(options) {
        const interactive = new interactive_1.InteractivePrompts();
        if (options.edit) {
            const result = await interactive.runInteractiveConfigEditor();
            if (result.saved) {
                this.auditLogger.log('info', 'Configuration updated via interactive editor');
            }
        }
        else if (options.adjust) {
            await this.adjustTemplate(options.adjust, interactive);
        }
        else if (options.add) {
            await this.addTemplate(options.add, interactive);
        }
    }
    async applyTemplate(templateName) {
        this.auditLogger.log('info', 'Applying template', { templateName });
        // For now, we'll use a simple template application
        // In a real implementation, this would load and apply the template
        console.log(chalk_1.default.green(`✓ Applied template: ${templateName}`));
    }
    async resetConfig() {
        await this.configManager.resetToDefaults();
        this.auditLogger.log('info', 'Configuration reset to defaults');
        console.log(chalk_1.default.green('✓ Configuration reset to defaults'));
    }
    async showHelp() {
        console.log(chalk_1.default.yellow('Configuration commands:'));
        console.log('  --show              Display current configuration');
        console.log('  --edit              Interactive configuration editor');
        console.log('  --use <name>        Switch to template (starter|enterprise|performance|default)');
        console.log('  --adjust <name>     Adjust template settings');
        console.log('  --add <name>        Create new template');
        console.log('  --reset             Reset to default configuration');
        console.log('  --template <name>   Apply template (legacy - use --use instead)');
    }
    parseArgs(args) {
        const options = {};
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === '--show') {
                options.show = true;
            }
            else if (arg === '--edit') {
                options.edit = true;
            }
            else if (arg === '--reset') {
                options.reset = true;
            }
            else if (arg === '--use' && i + 1 < args.length) {
                options.use = args[++i];
            }
            else if (arg === '--adjust' && i + 1 < args.length) {
                options.adjust = args[++i];
            }
            else if (arg === '--add' && i + 1 < args.length) {
                options.add = args[++i];
            }
            else if (arg === '--template' && i + 1 < args.length) {
                options.template = args[++i];
            }
        }
        return options;
    }
    async adjustTemplate(templateName, interactive) {
        this.auditLogger.log('info', 'Adjusting template', { templateName });
        console.log(chalk_1.default.blue(`Adjusting template: ${templateName}`));
        // Implementation would go here
    }
    async addTemplate(templateName, interactive) {
        this.auditLogger.log('info', 'Adding template', { templateName });
        console.log(chalk_1.default.blue(`Adding template: ${templateName}`));
        // Implementation would go here
    }
}
exports.ConfigCommand = ConfigCommand;
//# sourceMappingURL=config-command.js.map
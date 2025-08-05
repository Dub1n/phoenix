"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
class InitCommand {
    constructor(configManager, auditLogger, fileSystem) {
        this.configManager = configManager;
        this.auditLogger = auditLogger;
        this.fileSystem = fileSystem;
    }
    async execute(args) {
        this.auditLogger.log('info', 'Init command executed', { args });
        console.log(chalk_1.default.blue('✦ Initializing Phoenix-Code-Lite...'));
        try {
            // Get default configuration
            const config = await this.configManager.getConfig();
            // Apply template if specified
            const options = this.parseArgs(args);
            if (options.template) {
                await this.applyTemplate(options.template);
            }
            // Create necessary directories
            await this.createProjectStructure();
            // Initialize configuration file
            await this.initializeConfigFile();
            console.log(chalk_1.default.green('✓ Phoenix-Code-Lite initialized successfully!'));
            console.log(chalk_1.default.gray('You can now use: phoenix-code-lite generate <task>'));
        }
        catch (error) {
            this.auditLogger.log('error', 'Init command failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            console.error(chalk_1.default.red('Initialization error:'), error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
    async applyTemplate(templateName) {
        this.auditLogger.log('info', 'Applying template during init', { templateName });
        let template;
        let displayName = templateName;
        switch (templateName) {
            case 'starter':
                template = this.getStarterTemplate();
                break;
            case 'enterprise':
                template = this.getEnterpriseTemplate();
                break;
            case 'performance':
                template = this.getPerformanceTemplate();
                break;
            default:
                console.log(chalk_1.default.yellow('Unknown template. Using default configuration.'));
                console.log(chalk_1.default.gray('Available templates: starter, enterprise, performance'));
                return;
        }
        // Apply the template
        await this.configManager.updateConfig(template);
        console.log(chalk_1.default.green(`✓ Applied ${displayName} template`));
    }
    async createProjectStructure() {
        const directories = [
            '.phoenix-code-lite',
            '.phoenix-code-lite/audit',
            '.phoenix-code-lite/sessions',
            '.phoenix-code-lite/templates'
        ];
        for (const dir of directories) {
            await this.fileSystem.createDirectory(dir);
        }
        console.log(chalk_1.default.gray('✓ Created project directories'));
    }
    async initializeConfigFile() {
        const configPath = '.phoenix-code-lite/config.json';
        const config = await this.configManager.getConfig();
        await this.fileSystem.writeFile(configPath, JSON.stringify(config, null, 2));
        console.log(chalk_1.default.gray('✓ Created configuration file'));
    }
    parseArgs(args) {
        const options = {};
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === '--template' && i + 1 < args.length) {
                options.template = args[++i];
            }
        }
        return options;
    }
    getStarterTemplate() {
        return {
            system: {
                name: 'Phoenix Code Lite',
                version: '1.0.0',
                environment: 'development',
                logLevel: 'info'
            },
            session: {
                maxConcurrentSessions: 2,
                sessionTimeoutMs: 1800000,
                persistentStorage: false,
                auditLogging: true
            },
            mode: {
                defaultMode: 'standalone',
                allowModeSwitching: true,
                autoDetectIntegration: true
            },
            performance: {
                maxMemoryUsage: 300,
                gcInterval: 300000,
                metricsCollection: true
            }
        };
    }
    getEnterpriseTemplate() {
        return {
            system: {
                name: 'Phoenix Code Lite Enterprise',
                version: '1.0.0',
                environment: 'production',
                logLevel: 'warn'
            },
            session: {
                maxConcurrentSessions: 10,
                sessionTimeoutMs: 7200000,
                persistentStorage: true,
                auditLogging: true
            },
            mode: {
                defaultMode: 'integrated',
                allowModeSwitching: true,
                autoDetectIntegration: true
            },
            performance: {
                maxMemoryUsage: 1000,
                gcInterval: 180000,
                metricsCollection: true
            }
        };
    }
    getPerformanceTemplate() {
        return {
            system: {
                name: 'Phoenix Code Lite Performance',
                version: '1.0.0',
                environment: 'production',
                logLevel: 'error'
            },
            session: {
                maxConcurrentSessions: 5,
                sessionTimeoutMs: 3600000,
                persistentStorage: false,
                auditLogging: false
            },
            mode: {
                defaultMode: 'integrated',
                allowModeSwitching: false,
                autoDetectIntegration: false
            },
            performance: {
                maxMemoryUsage: 750,
                gcInterval: 120000,
                metricsCollection: false
            }
        };
    }
}
exports.InitCommand = InitCommand;
//# sourceMappingURL=init-command.js.map
"use strict";
/**---
 * title: [Enhanced Wizard - Guided Interactive Setup]
 * tags: [CLI, Wizard, UX, Configuration]
 * provides: [wizardCommand, Interactive Setup Flows, Validation]
 * requires: [InteractivePrompts, PhoenixCodeLiteConfig, Templates, HelpSystem]
 * description: [Guided interactive setup wizard for onboarding and configuration with validation and template selection.]
 * ---*/
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
exports.EnhancedWizard = void 0;
const chalk_1 = __importDefault(require("chalk"));
const project_discovery_1 = require("./project-discovery");
const interactive_1 = require("./interactive");
const settings_1 = require("../config/settings");
const templates_1 = require("../config/templates");
class EnhancedWizard {
    constructor() {
        this.discovery = new project_discovery_1.ProjectDiscovery();
        this.prompts = new interactive_1.InteractivePrompts();
    }
    async runEnhancedWizard(options = {}) {
        console.log(chalk_1.default.blue.bold('\n🧙‍♂️ Phoenix Code Lite Enhanced Setup Wizard\n'));
        console.log(chalk_1.default.gray('Intelligent project discovery and configuration\n'));
        const projectPath = options.projectPath || process.cwd();
        let context = null;
        // Step 1: Project Discovery
        if (!options.skipDiscovery) {
            console.log(chalk_1.default.yellow('⌕ Analyzing your project...'));
            context = await this.discovery.analyzeProject(projectPath);
            if (options.verbose || context.confidence > 0.3) {
                this.discovery.displayAnalysis(context);
            }
        }
        // Step 2: Smart Configuration Flow
        const answers = await this.getSmartConfiguration(context);
        return {
            ...answers,
            discoveredContext: context || undefined,
        };
    }
    async getSmartConfiguration(context) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        // If we have good project detection, offer smart defaults
        if (context && context.confidence > 0.5) {
            console.log(chalk_1.default.green('\n⑇ Smart Configuration Available'));
            console.log(chalk_1.default.gray('Based on your project analysis, we can auto-configure settings.\n'));
            const { useSmartConfig } = await inquirer.default.prompt([
                {
                    type: 'confirm',
                    name: 'useSmartConfig',
                    message: `Use detected settings? (${context.language}, ${context.framework || 'no framework'}, ${context.suggestedTemplate} template)`,
                    default: true,
                },
            ]);
            if (useSmartConfig) {
                return await this.generateSmartConfiguration(context);
            }
        }
        // Fall back to manual configuration with enhanced context
        return await this.runManualConfiguration(context);
    }
    async generateSmartConfiguration(context) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        console.log(chalk_1.default.blue('\n^ Generating smart configuration...\n'));
        // Convert detected context to wizard answers
        const baseAnswers = {
            projectType: context.type === 'unknown' ? 'web' : context.type,
            language: context.language === 'unknown' ? 'javascript' : context.language,
            framework: context.framework || 'None',
            qualityLevel: context.suggestedTemplate,
            enableAdvancedFeatures: context.confidence > 0.7,
        };
        // Get stack-specific recommendations
        const stackKnowledge = context.framework ? this.discovery.getStackKnowledge(context.framework) : null;
        if (stackKnowledge) {
            console.log(chalk_1.default.cyan(`* ${stackKnowledge.framework} Stack Recommendations:`));
            console.log(chalk_1.default.gray(`  • Recommended quality level: ${stackKnowledge.recommendations.qualityLevel}`));
            console.log(chalk_1.default.gray(`  • Suggested test coverage: ${Math.round(stackKnowledge.recommendations.testCoverage * 100)}%`));
            if (stackKnowledge.recommendations.additionalTools.length > 0) {
                console.log(chalk_1.default.gray(`  • Recommended tools: ${stackKnowledge.recommendations.additionalTools.join(', ')}`));
            }
            console.log('');
        }
        // Allow customization
        const { customize } = await inquirer.default.prompt([
            {
                type: 'confirm',
                name: 'customize',
                message: 'Would you like to customize these settings?',
                default: false,
            },
        ]);
        if (customize) {
            return await this.customizeSmartConfiguration(baseAnswers, context, stackKnowledge);
        }
        return {
            ...baseAnswers,
            discoveredContext: context,
            useDiscoveredSettings: true,
            customizeTemplate: false,
        };
    }
    async customizeSmartConfiguration(baseAnswers, context, stackKnowledge) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        console.log(chalk_1.default.blue('\n⌘ Customize Configuration\n'));
        // Enhanced choices based on context
        const answers = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'projectType',
                message: 'Confirm project type:',
                default: baseAnswers.projectType,
                choices: this.getProjectTypeChoices(context),
            },
            {
                type: 'list',
                name: 'language',
                message: 'Confirm programming language:',
                default: baseAnswers.language,
                choices: this.getLanguageChoices(context),
            },
            {
                type: 'list',
                name: 'framework',
                message: 'Confirm framework:',
                default: baseAnswers.framework,
                choices: this.getFrameworkChoices(context),
            },
            {
                type: 'list',
                name: 'qualityLevel',
                message: 'Choose quality level:',
                default: baseAnswers.qualityLevel,
                choices: this.getQualityLevelChoices(stackKnowledge),
            },
            {
                type: 'confirm',
                name: 'enableAdvancedFeatures',
                message: 'Enable advanced features? (audit logging, metrics, detailed reporting)',
                default: baseAnswers.enableAdvancedFeatures,
            },
        ]);
        return {
            ...answers,
            discoveredContext: context,
            useDiscoveredSettings: true,
            customizeTemplate: true,
        };
    }
    async runManualConfiguration(context) {
        console.log(chalk_1.default.blue('\n⋇ Manual Configuration\n'));
        // Use the existing wizard with enhanced choices
        const steps = this.getEnhancedWizardSteps(context);
        const answers = await this.runSteppedWizard(steps);
        return {
            ...answers,
            discoveredContext: context || undefined,
            useDiscoveredSettings: false,
            customizeTemplate: false,
        };
    }
    async runSteppedWizard(steps) {
        const inquirer = await Promise.resolve().then(() => __importStar(require('inquirer')));
        let currentStep = 0;
        const responses = [];
        while (currentStep < steps.length) {
            const step = steps[currentStep];
            const progress = `${currentStep + 1}/${steps.length}`;
            const stepWithNavigation = {
                ...step,
                message: `${step.message} ${chalk_1.default.gray(`[${progress}]`)} ${chalk_1.default.dim('(ESC to exit)')}`,
            };
            // Add navigation options
            if (currentStep > 0) {
                const navigationChoices = [
                    new inquirer.default.Separator(),
                    { name: '← Back to previous step', value: '__BACK__' },
                    { name: '✗ Cancel wizard', value: '__CANCEL__' },
                ];
                if (step.type === 'list') {
                    stepWithNavigation.choices = [...(step.choices || []), ...navigationChoices];
                }
            }
            const response = await inquirer.default.prompt([stepWithNavigation]);
            const answer = response[step.name];
            if (answer === '__BACK__') {
                currentStep = Math.max(0, currentStep - 1);
                responses.pop();
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
                continue;
            }
            responses.push({ [step.name]: answer });
            currentStep++;
        }
        return responses.reduce((acc, response) => ({ ...acc, ...response }), {});
    }
    getProjectTypeChoices(context) {
        const choices = [
            { name: 'Web Application (Frontend)', value: 'web' },
            { name: 'API/Backend Service', value: 'api' },
            { name: 'Library/Package', value: 'library' },
            { name: 'CLI Tool', value: 'cli' },
        ];
        // Highlight detected type
        if (context && context.type !== 'unknown') {
            const detectedChoice = choices.find(c => c.value === context.type);
            if (detectedChoice) {
                detectedChoice.name += chalk_1.default.green(' ✓ (detected)');
            }
        }
        return choices;
    }
    getLanguageChoices(context) {
        const choices = [
            { name: 'JavaScript', value: 'javascript' },
            { name: 'TypeScript', value: 'typescript' },
            { name: 'Python', value: 'python' },
        ];
        // Highlight detected language
        if (context && context.language !== 'unknown') {
            const detectedChoice = choices.find(c => c.value === context.language);
            if (detectedChoice) {
                detectedChoice.name += chalk_1.default.green(' ✓ (detected)');
            }
        }
        return choices;
    }
    getFrameworkChoices(context) {
        const choices = [
            { name: 'React', value: 'React' },
            { name: 'Vue.js', value: 'Vue.js' },
            { name: 'Angular', value: 'Angular' },
            { name: 'Express.js', value: 'Express.js' },
            { name: 'Fastify', value: 'Fastify' },
            { name: 'Flask', value: 'Flask' },
            { name: 'Django', value: 'Django' },
            { name: 'None', value: 'None' },
        ];
        // Highlight detected framework
        if (context && context.framework) {
            const detectedChoice = choices.find(c => c.value === context.framework);
            if (detectedChoice) {
                detectedChoice.name += chalk_1.default.green(' ✓ (detected)');
            }
        }
        return choices;
    }
    getQualityLevelChoices(stackKnowledge) {
        const choices = [
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
            {
                name: 'Performance - Speed optimized (60% test coverage)',
                value: 'performance',
            },
        ];
        // Highlight recommended quality level
        if (stackKnowledge) {
            const recommendedChoice = choices.find(c => c.value === stackKnowledge.recommendations.qualityLevel);
            if (recommendedChoice) {
                recommendedChoice.name += chalk_1.default.cyan(' * (recommended)');
            }
        }
        return choices;
    }
    getEnhancedWizardSteps(context) {
        return [
            {
                type: 'list',
                name: 'projectType',
                message: 'What type of project are you working on?',
                choices: this.getProjectTypeChoices(context),
            },
            {
                type: 'list',
                name: 'language',
                message: 'What programming language?',
                choices: this.getLanguageChoices(context),
            },
            {
                type: 'list',
                name: 'framework',
                message: 'Which framework are you using?',
                choices: this.getFrameworkChoices(context),
            },
            {
                type: 'list',
                name: 'qualityLevel',
                message: 'What quality level do you need?',
                choices: this.getQualityLevelChoices(null),
            },
            {
                type: 'confirm',
                name: 'enableAdvancedFeatures',
                message: 'Enable advanced features? (Audit logging, metrics, detailed reporting)',
                default: true,
            },
        ];
    }
    generateConfiguration(answers) {
        // Check if we should use stack-specific template
        if (answers.discoveredContext && answers.useDiscoveredSettings &&
            answers.discoveredContext.framework && answers.discoveredContext.confidence > 0.6) {
            const stackConfig = templates_1.ConfigurationTemplates.getStackSpecificTemplate(answers.discoveredContext.framework, answers.discoveredContext.language);
            // Merge with quality level adjustments
            return this.mergeWithQualityLevel(stackConfig, answers.qualityLevel);
        }
        // Fall back to standard template selection
        let config;
        switch (answers.qualityLevel) {
            case 'enterprise':
                config = templates_1.ConfigurationTemplates.getEnterpriseTemplate();
                break;
            case 'performance':
                config = templates_1.ConfigurationTemplates.getPerformanceTemplate();
                break;
            case 'starter':
                config = templates_1.ConfigurationTemplates.getStarterTemplate();
                break;
            default:
                config = settings_1.PhoenixCodeLiteConfig.getDefault().export();
        }
        // Apply stack-specific optimizations
        if (answers.discoveredContext && answers.useDiscoveredSettings) {
            config = this.applyStackOptimizations(config, answers.discoveredContext);
        }
        // Apply framework-specific settings
        if (answers.framework && answers.framework !== 'None') {
            config = this.applyFrameworkSettings(config, answers.framework);
        }
        return config;
    }
    mergeWithQualityLevel(stackConfig, qualityLevel) {
        // Apply quality level adjustments to stack-specific config
        const qualityMultipliers = {
            starter: { coverage: 0.9, complexity: 1.2, timeout: 0.8 },
            professional: { coverage: 1.0, complexity: 1.0, timeout: 1.0 },
            enterprise: { coverage: 1.1, complexity: 0.8, timeout: 1.3 },
            performance: { coverage: 0.8, complexity: 1.3, timeout: 0.7 }
        };
        const multipliers = qualityMultipliers[qualityLevel] || qualityMultipliers.professional;
        return {
            ...stackConfig,
            claude: {
                ...stackConfig.claude,
                timeout: Math.round((stackConfig.claude?.timeout || 300000) * multipliers.timeout),
                maxTurns: qualityLevel === 'enterprise' ? Math.max(stackConfig.claude?.maxTurns || 3, 5) :
                    qualityLevel === 'starter' ? Math.min(stackConfig.claude?.maxTurns || 3, 3) :
                        stackConfig.claude?.maxTurns || 3,
            },
            tdd: {
                ...stackConfig.tdd,
                testQualityThreshold: Math.min((stackConfig.tdd?.testQualityThreshold || 0.8) * multipliers.coverage, 1.0),
                qualityGates: {
                    ...stackConfig.tdd?.qualityGates,
                    strictMode: qualityLevel === 'enterprise',
                    thresholds: {
                        ...stackConfig.tdd?.qualityGates?.thresholds,
                        testCoverage: Math.min((stackConfig.tdd?.qualityGates?.thresholds?.testCoverage || 0.8) * multipliers.coverage, 1.0),
                    },
                },
            },
            quality: {
                ...stackConfig.quality,
                minTestCoverage: Math.min((stackConfig.quality?.minTestCoverage || 0.8) * multipliers.coverage, 1.0),
                maxComplexity: Math.round((stackConfig.quality?.maxComplexity || 10) * multipliers.complexity),
            },
        };
    }
    applyStackOptimizations(config, context) {
        // Adjust based on detected capabilities
        if (context.hasTests) {
            config.tdd.testQualityThreshold = Math.max(config.tdd.testQualityThreshold, 0.8);
        }
        if (context.hasLinting) {
            config.quality.enableQualityGates = true;
        }
        if (context.hasTypeScript) {
            config.output.verbose = false; // TypeScript projects typically prefer concise output
        }
        // Adjust timeouts based on project complexity
        if (context.dependencies.length > 50) {
            config.claude.timeout = Math.max(config.claude.timeout, 600000); // 10 minutes for complex projects
        }
        return config;
    }
    applyFrameworkSettings(config, framework) {
        const stackKnowledge = this.discovery.getStackKnowledge(framework);
        if (stackKnowledge) {
            // Apply recommended quality level
            if (stackKnowledge.recommendations.qualityLevel === 'enterprise') {
                config.tdd.testQualityThreshold = 0.9;
                config.quality.minTestCoverage = 0.9;
            }
            else if (stackKnowledge.recommendations.qualityLevel === 'professional') {
                config.tdd.testQualityThreshold = 0.8;
                config.quality.minTestCoverage = 0.8;
            }
            // Apply test coverage recommendations
            config.quality.minTestCoverage = Math.max(config.quality.minTestCoverage, stackKnowledge.recommendations.testCoverage);
        }
        return config;
    }
}
exports.EnhancedWizard = EnhancedWizard;
//# sourceMappingURL=enhanced-wizard.js.map
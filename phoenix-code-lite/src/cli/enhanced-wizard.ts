/**---
 * title: [Enhanced Wizard - Guided Interactive Setup]
 * tags: [CLI, Wizard, UX, Configuration]
 * provides: [wizardCommand, Interactive Setup Flows, Validation]
 * requires: [InteractivePrompts, PhoenixCodeLiteConfig, Templates, HelpSystem]
 * description: [Guided interactive setup wizard for onboarding and configuration with validation and template selection.]
 * ---*/

import chalk from 'chalk';
import { ProjectDiscovery, ProjectContext, StackKnowledge } from './project-discovery';
import { InteractivePrompts, ConfigurationWizardAnswers } from './interactive';
import { PhoenixCodeLiteConfig } from '../config/settings';
import { ConfigurationTemplates } from '../config/templates';

export interface EnhancedWizardOptions {
  skipDiscovery?: boolean;
  projectPath?: string;
  verbose?: boolean;
}

export interface EnhancedWizardAnswers extends ConfigurationWizardAnswers {
  discoveredContext?: ProjectContext;
  useDiscoveredSettings?: boolean;
  customizeTemplate?: boolean;
}

export class EnhancedWizard {
  private discovery: ProjectDiscovery;
  private prompts: InteractivePrompts;

  constructor() {
    this.discovery = new ProjectDiscovery();
    this.prompts = new InteractivePrompts();
  }

  async runEnhancedWizard(options: EnhancedWizardOptions = {}): Promise<EnhancedWizardAnswers> {
    console.log(chalk.blue.bold('\n🧙‍♂️ Phoenix Code Lite Enhanced Setup Wizard\n'));
    console.log(chalk.gray('Intelligent project discovery and configuration\n'));

    const projectPath = options.projectPath || process.cwd();
    let context: ProjectContext | null = null;

    // Step 1: Project Discovery
    if (!options.skipDiscovery) {
      console.log(chalk.yellow('⌕ Analyzing your project...'));
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

  private async getSmartConfiguration(context: ProjectContext | null): Promise<EnhancedWizardAnswers> {
    const inquirer = await import('inquirer');

    // If we have good project detection, offer smart defaults
    if (context && context.confidence > 0.5) {
      console.log(chalk.green('\n⑇ Smart Configuration Available'));
      console.log(chalk.gray('Based on your project analysis, we can auto-configure settings.\n'));

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

  private async generateSmartConfiguration(context: ProjectContext): Promise<EnhancedWizardAnswers> {
    const inquirer = await import('inquirer');

    console.log(chalk.blue('\n^ Generating smart configuration...\n'));

    // Convert detected context to wizard answers
    const baseAnswers: ConfigurationWizardAnswers = {
      projectType: context.type === 'unknown' ? 'web' : context.type,
      language: context.language === 'unknown' ? 'javascript' : context.language,
      framework: context.framework || 'None',
      qualityLevel: context.suggestedTemplate,
      enableAdvancedFeatures: context.confidence > 0.7,
    };

    // Get stack-specific recommendations
    const stackKnowledge = context.framework ? this.discovery.getStackKnowledge(context.framework) : null;
    
    if (stackKnowledge) {
      console.log(chalk.cyan(`* ${stackKnowledge.framework} Stack Recommendations:`));
      console.log(chalk.gray(`  • Recommended quality level: ${stackKnowledge.recommendations.qualityLevel}`));
      console.log(chalk.gray(`  • Suggested test coverage: ${Math.round(stackKnowledge.recommendations.testCoverage * 100)}%`));
      if (stackKnowledge.recommendations.additionalTools.length > 0) {
        console.log(chalk.gray(`  • Recommended tools: ${stackKnowledge.recommendations.additionalTools.join(', ')}`));
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

  private async customizeSmartConfiguration(
    baseAnswers: ConfigurationWizardAnswers,
    context: ProjectContext,
    stackKnowledge: StackKnowledge | null
  ): Promise<EnhancedWizardAnswers> {
    const inquirer = await import('inquirer');

    console.log(chalk.blue('\n⌘ Customize Configuration\n'));

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

  private async runManualConfiguration(context: ProjectContext | null): Promise<EnhancedWizardAnswers> {
    console.log(chalk.blue('\n⋇ Manual Configuration\n'));
    
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

  private async runSteppedWizard(steps: any[]): Promise<ConfigurationWizardAnswers> {
    const inquirer = await import('inquirer');
    let currentStep = 0;
    const responses: any[] = [];

    while (currentStep < steps.length) {
      const step = steps[currentStep];
      const progress = `${currentStep + 1}/${steps.length}`;
      
      const stepWithNavigation = {
        ...step,
        message: `${step.message} ${chalk.gray(`[${progress}]`)} ${chalk.dim('(ESC to exit)')}`,
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
      } else if (answer === '__CANCEL__') {
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

  private getProjectTypeChoices(context: ProjectContext | null) {
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
        detectedChoice.name += chalk.green(' ✓ (detected)');
      }
    }

    return choices;
  }

  private getLanguageChoices(context: ProjectContext | null) {
    const choices = [
      { name: 'JavaScript', value: 'javascript' },
      { name: 'TypeScript', value: 'typescript' },
      { name: 'Python', value: 'python' },
    ];

    // Highlight detected language
    if (context && context.language !== 'unknown') {
      const detectedChoice = choices.find(c => c.value === context.language);
      if (detectedChoice) {
        detectedChoice.name += chalk.green(' ✓ (detected)');
      }
    }

    return choices;
  }

  private getFrameworkChoices(context: ProjectContext | null) {
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
        detectedChoice.name += chalk.green(' ✓ (detected)');
      }
    }

    return choices;
  }

  private getQualityLevelChoices(stackKnowledge: StackKnowledge | null) {
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
        recommendedChoice.name += chalk.cyan(' * (recommended)');
      }
    }

    return choices;
  }

  private getEnhancedWizardSteps(context: ProjectContext | null): any[] {
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

  generateConfiguration(answers: EnhancedWizardAnswers): any {
    // Check if we should use stack-specific template
    if (answers.discoveredContext && answers.useDiscoveredSettings && 
        answers.discoveredContext.framework && answers.discoveredContext.confidence > 0.6) {
      const stackConfig = ConfigurationTemplates.getStackSpecificTemplate(
        answers.discoveredContext.framework,
        answers.discoveredContext.language
      );
      
      // Merge with quality level adjustments
      return this.mergeWithQualityLevel(stackConfig, answers.qualityLevel);
    }

    // Fall back to standard template selection
    let config;
    switch (answers.qualityLevel) {
      case 'enterprise':
        config = ConfigurationTemplates.getEnterpriseTemplate();
        break;
      case 'performance':
        config = ConfigurationTemplates.getPerformanceTemplate();
        break;
      case 'starter':
        config = ConfigurationTemplates.getStarterTemplate();
        break;
      default:
        config = PhoenixCodeLiteConfig.getDefault().export();
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

  private mergeWithQualityLevel(stackConfig: any, qualityLevel: string): any {
    // Apply quality level adjustments to stack-specific config
    const qualityMultipliers = {
      starter: { coverage: 0.9, complexity: 1.2, timeout: 0.8 },
      professional: { coverage: 1.0, complexity: 1.0, timeout: 1.0 },
      enterprise: { coverage: 1.1, complexity: 0.8, timeout: 1.3 },
      performance: { coverage: 0.8, complexity: 1.3, timeout: 0.7 }
    };

    const multipliers = qualityMultipliers[qualityLevel as keyof typeof qualityMultipliers] || qualityMultipliers.professional;

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

  private applyStackOptimizations(config: any, context: ProjectContext): any {
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

  private applyFrameworkSettings(config: any, framework: string): any {
    const stackKnowledge = this.discovery.getStackKnowledge(framework);
    
    if (stackKnowledge) {
      // Apply recommended quality level
      if (stackKnowledge.recommendations.qualityLevel === 'enterprise') {
        config.tdd.testQualityThreshold = 0.9;
        config.quality.minTestCoverage = 0.9;
      } else if (stackKnowledge.recommendations.qualityLevel === 'professional') {
        config.tdd.testQualityThreshold = 0.8;
        config.quality.minTestCoverage = 0.8;
      }

      // Apply test coverage recommendations
      config.quality.minTestCoverage = Math.max(
        config.quality.minTestCoverage,
        stackKnowledge.recommendations.testCoverage
      );
    }

    return config;
  }
}

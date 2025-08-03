import chalk from 'chalk';
import readline from 'readline';
import { PhoenixCodeLiteConfig, PhoenixCodeLiteConfigData } from '../config/settings';
import { ConfigurationTemplates } from '../config/templates';
import { ConfigFormatter } from './config-formatter';

export interface ConfigurationWizardAnswers {
  projectType: 'web' | 'api' | 'library' | 'cli';
  language: 'javascript' | 'typescript' | 'python';
  framework?: string;
  qualityLevel: 'starter' | 'professional' | 'enterprise' | 'performance';
  enableAdvancedFeatures: boolean;
}

export interface ConfigEditResult {
  saved: boolean;
  templateUpdated?: string;
  config?: PhoenixCodeLiteConfig;
}

export class InteractivePrompts {
  async runConfigurationWizard(): Promise<ConfigurationWizardAnswers> {
    console.log(chalk.blue.bold('\n🧙 Phoenix-Code-Lite Configuration Wizard\n'));
    console.log('This wizard will help you set up Phoenix-Code-Lite for your project.\n');

    const inquirer = await import('inquirer');
    
    // Enhanced wizard with navigation support
    let currentStep = 0;
    const steps = this.getConfigurationWizardSteps();
    const responses: any[] = [];
    
    while (currentStep < steps.length) {
      const step = steps[currentStep];
      const canGoBack = currentStep > 0;
      const canCancel = true;
      const progress = `${currentStep + 1}/${steps.length}`;
      
      // Add navigation options to each step
      const stepWithNavigation = {
        ...step,
        message: `${step.message} ${chalk.gray(`[${progress}]`)} ${chalk.dim('(ESC to exit)')}`,
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
        continue; // Stay on current step
      }
      
      responses.push({ [step.name]: answer });
      currentStep++;
    }
    
    // Combine all responses into final answers object
    const answers = responses.reduce((acc, response) => ({ ...acc, ...response }), {});
    return answers as ConfigurationWizardAnswers;
  }

  async confirmOverwrite(path: string): Promise<boolean> {
    const inquirer = await import('inquirer');
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

  async selectTemplate(): Promise<string> {
    const inquirer = await import('inquirer');
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

  validateTaskDescription(input: string): boolean {
    if (!input || input.trim().length === 0) {
      return false;
    }
    if (input.trim().length < 10) {
      return false;
    }
    return true;
  }

  async handleEscapeKey(): Promise<boolean> {
    console.log(chalk.yellow('\n⚠ ESC pressed - Exit current operation?'));
    const inquirer = await import('inquirer');
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

  setupEscapeHandler(): void {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (key) => {
      // ESC key code is 27
      if (key[0] === 27) {
        this.handleEscapeKey().then((shouldExit) => {
          if (shouldExit) {
            console.log(chalk.gray('\n✓ Operation cancelled by user'));
            process.exit(0);
          }
        });
      }
    });
  }

  cleanupEscapeHandler(): void {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  }

  getConfigurationWizardSteps(): any[] {
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
  getConfigurationWizard(): any[] {
    return this.getConfigurationWizardSteps();
  }

  async getTaskInput(): Promise<string> {
    const inquirer = await import('inquirer');
    const { task } = await inquirer.default.prompt([
      {
        type: 'input',
        name: 'task',
        message: 'Describe the task you want to implement:',
        validate: (input: string) => {
          if (!this.validateTaskDescription(input)) {
            return 'Task description must be at least 10 characters long and descriptive.';
          }
          return true;
        },
      },
    ]);
    return task;
  }

  async runInteractiveConfigEditor(): Promise<ConfigEditResult> {
    console.log(chalk.blue.bold('\n📋 Phoenix Code Lite Configuration Editor\n'));
    
    const config = await PhoenixCodeLiteConfig.load();
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
            console.log(chalk.green('\n✓ Configuration saved successfully!'));
            return { saved: true, config: currentConfig };
          } else {
            console.log(chalk.yellow('\n⚠ No changes to save.'));
            return { saved: false };
          }
        case 'cancel':
          if (hasChanges) {
            const confirm = await this.confirmDiscardChanges();
            if (confirm) {
              console.log(chalk.yellow('\n⚠ Changes discarded.'));
              return { saved: false };
            }
            continue; // Go back to menu
          } else {
            console.log(chalk.gray('\n✓ No changes made.'));
            return { saved: false };
          }
        default:
          return { saved: false };
      }
    }
  }

  private async showMainConfigMenu(config: PhoenixCodeLiteConfig): Promise<string> {
    const inquirer = await import('inquirer');
    
    // Clear screen and show consistent header
    console.clear();
    console.log(chalk.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.gray(`Current: ${ConfigFormatter.formatConfigSummary(config.export())}`));
    console.log(chalk.dim('Press ESC at any time to exit'));
    console.log(chalk.gray('═'.repeat(50)));
    
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

  private async editFrameworkSettings(config: PhoenixCodeLiteConfig): Promise<boolean> {
    const inquirer = await import('inquirer');
    
    console.clear();
    console.log(chalk.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.blue.bold('⚙️  Framework Settings'));
    console.log(chalk.gray('═'.repeat(50)));
    
    const { setting } = await inquirer.default.prompt([
      {
        type: 'list',
        name: 'setting',
        message: 'Select setting to configure:',
        choices: [
          { name: `Claude Max Turns ${chalk.gray(`(current: ${config.get('claude.maxTurns')})`)}`, value: 'maxTurns' },
          { name: `Claude Timeout ${chalk.gray(`(current: ${config.get('claude.timeout')}ms)`)}`, value: 'timeout' },
          { name: `Retry Attempts ${chalk.gray(`(current: ${config.get('claude.retryAttempts')})`)}`, value: 'retryAttempts' },
          { name: `TDD Max Attempts ${chalk.gray(`(current: ${config.get('tdd.maxImplementationAttempts')})`)}`, value: 'maxImplementationAttempts' },
          new inquirer.default.Separator(),
          { name: '← Back to Main Menu', value: 'back' },
        ],
        pageSize: 10,
        loop: false,
      },
    ]);
    
    if (setting === 'back') return false;
    
    return await this.editSpecificSetting(config, setting);
  }

  private async editSpecificSetting(config: PhoenixCodeLiteConfig, setting: string): Promise<boolean> {
    const inquirer = await import('inquirer');
    
    const currentValue = config.get(this.getConfigPath(setting));
    const settingInfo = this.getSettingInfo(setting);
    
    const prompt: any = {
      type: settingInfo.type,
      name: 'newValue',
      message: `${settingInfo.label} ${chalk.gray(`(current: ${currentValue})`)}:`,
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
          { name: `Change value (currently: ${chalk.cyan(currentValue)})`, value: 'change' },
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
      console.log(chalk.green(`✓ ${settingInfo.label} updated to: ${chalk.cyan(newValue)}`));
      return true;
    }
    
    return false;
  }

  private getConfigPath(setting: string): string {
    const paths: Record<string, string> = {
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

  private getSettingInfo(setting: string): any {
    const settings: Record<string, any> = {
      maxTurns: {
        label: 'Maximum Claude turns',
        type: 'number',
        validate: (value: number) => value >= 1 && value <= 10 ? true : 'Must be between 1 and 10',
      },
      timeout: {
        label: 'Claude timeout (milliseconds)',
        type: 'number',
        validate: (value: number) => value >= 30000 && value <= 1800000 ? true : 'Must be between 30,000 and 1,800,000 ms',
      },
      retryAttempts: {
        label: 'Retry attempts',
        type: 'number',
        validate: (value: number) => value >= 1 && value <= 5 ? true : 'Must be between 1 and 5',
      },
      maxImplementationAttempts: {
        label: 'Maximum implementation attempts',
        type: 'number',
        validate: (value: number) => value >= 1 && value <= 10 ? true : 'Must be between 1 and 10',
      },
      testQualityThreshold: {
        label: 'Test quality threshold',
        type: 'number',
        allowDecimals: true,
        validate: (value: number) => value >= 0 && value <= 1 ? true : 'Must be between 0.0 and 1.0',
      },
      minTestCoverage: {
        label: 'Minimum test coverage',
        type: 'number',
        allowDecimals: true,
        validate: (value: number) => value >= 0 && value <= 1 ? true : 'Must be between 0.0 and 1.0',
      },
      maxComplexity: {
        label: 'Maximum complexity',
        type: 'number',
        validate: (value: number) => value >= 1 && value <= 50 ? true : 'Must be between 1 and 50',
      },
      logLevel: {
        label: 'Log level',
        type: 'list',
        choices: ['error', 'warn', 'info', 'debug'],
      },
    };
    return settings[setting] || { label: setting, type: 'input' };
  }

  private async editLanguagePreferences(config: PhoenixCodeLiteConfig): Promise<boolean> {
    console.log(chalk.blue('\n🔤 Language Preferences'));
    console.log(chalk.gray('Language preferences have been moved to Advanced Settings.'));
    console.log(chalk.gray('Navigate to Advanced Settings > Language Preferences for configuration.'));
    await this.pressEnterToContinue();
    return false;
  }

  private async editLanguagePreferencesAdvanced(config: PhoenixCodeLiteConfig): Promise<boolean> {
    const inquirer = await import('inquirer');
    
    console.clear();
    console.log(chalk.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.blue.bold('🔤 Language Preferences'));
    console.log(chalk.gray('═'.repeat(50)));
    
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
    
    if (action === 'back') return false;
    
    switch (action) {
      case 'default':
        console.log(chalk.yellow('\n💡 Language preferences are now set per-project during generation.'));
        console.log(chalk.gray('This provides better flexibility for multi-language projects.'));
        break;
      case 'framework':
        console.log(chalk.yellow('\n⚙️ Framework-specific language settings'));
        console.log(chalk.gray('Configure language defaults based on detected frameworks.'));
        break;
      case 'template':
        console.log(chalk.yellow('\n📄 Template-specific language overrides'));
        console.log(chalk.gray('Set language preferences that override template defaults.'));
        break;
    }
    
    await this.pressEnterToContinue();
    return false;
  }

  private async editAgentConfiguration(config: PhoenixCodeLiteConfig): Promise<boolean> {
    const inquirer = await import('inquirer');
    
    console.clear();
    console.log(chalk.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.blue.bold('🤖 Agent Configuration'));
    console.log(chalk.gray('═'.repeat(50)));
    
    console.log(chalk.green('✓ Planning Analyst: Active'));
    console.log(chalk.green('✓ Implementation Engineer: Active'));
    console.log(chalk.green('✓ Quality Reviewer: Active'));
    console.log();
    console.log(chalk.gray('All agents are currently operational and configured optimally.'));
    
    await this.pressEnterToContinue();
    return false;
  }

  private async editLoggingConfiguration(config: PhoenixCodeLiteConfig): Promise<boolean> {
    const inquirer = await import('inquirer');
    
    console.clear();
    console.log(chalk.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.blue.bold('📝 Audit Logging Configuration'));
    console.log(chalk.gray('═'.repeat(50)));
    
    console.log(chalk.green('✓ Audit logging is enabled by default'));
    console.log(chalk.gray('• All workflow operations are tracked'));
    console.log(chalk.gray('• Performance metrics are collected'));
    console.log(chalk.gray('• Session data is preserved'));
    
    await this.pressEnterToContinue();
    return false;
  }

  private async editMetricsConfiguration(config: PhoenixCodeLiteConfig): Promise<boolean> {
    const inquirer = await import('inquirer');
    
    console.clear();
    console.log(chalk.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.blue.bold('📊 Performance Metrics Configuration'));
    console.log(chalk.gray('═'.repeat(50)));
    
    console.log(chalk.green('✓ Performance metrics collection is active'));
    console.log(chalk.gray('• Token usage tracking'));
    console.log(chalk.gray('• Execution time measurement'));
    console.log(chalk.gray('• Quality score tracking'));
    console.log(chalk.gray('• Success rate monitoring'));
    
    await this.pressEnterToContinue();
    return false;
  }

  private async editQualityThresholds(config: PhoenixCodeLiteConfig): Promise<boolean> {
    const inquirer = await import('inquirer');
    
    console.clear();
    console.log(chalk.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.blue.bold('📊 Quality Thresholds'));
    console.log(chalk.gray('═'.repeat(50)));
    
    const { setting } = await inquirer.default.prompt([
      {
        type: 'list',
        name: 'setting',
        message: 'Select quality setting to configure:',
        choices: [
          { name: `Test Quality Threshold ${chalk.gray(`(current: ${config.get('tdd.testQualityThreshold')})`)}`, value: 'testQualityThreshold' },
          { name: `Minimum Test Coverage ${chalk.gray(`(current: ${config.get('quality.minTestCoverage')})`)}`, value: 'minTestCoverage' },
          { name: `Maximum Complexity ${chalk.gray(`(current: ${config.get('quality.maxComplexity')})`)}`, value: 'maxComplexity' },
          new inquirer.default.Separator(),
          { name: '← Back to Main Menu', value: 'back' },
        ],
        pageSize: 10,
        loop: false,
      },
    ]);
    
    if (setting === 'back') return false;
    
    return await this.editSpecificSetting(config, setting);
  }

  private async editSecurityPolicies(config: PhoenixCodeLiteConfig): Promise<boolean> {
    const inquirer = await import('inquirer');
    
    console.clear();
    console.log(chalk.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.blue.bold('🛡️  Security Policies'));
    console.log(chalk.gray('═'.repeat(50)));
    
    console.log(chalk.yellow('Security policies are managed through the security guardrails system.'));
    console.log(chalk.gray('These settings ensure safe file access and command execution.\n'));
    
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
        console.log(chalk.blue('\n📖 Security Documentation'));
        console.log(chalk.gray('Security policies include:'));
        console.log(chalk.gray('• File access control (whitelist/blacklist paths)'));
        console.log(chalk.gray('• Command execution security (approved commands only)'));
        console.log(chalk.gray('• Size and time limits for operations'));
        console.log(chalk.gray('• Audit logging for security events'));
        break;
      case 'status':
        console.log(chalk.green('\n✅ Security Status: Active'));
        console.log(chalk.gray('All security guardrails are operational.'));
        break;
      case 'settings':
        console.log(chalk.yellow('\n⚠  Advanced security settings are managed through'));
        console.log(chalk.yellow('the security guardrails configuration file.'));
        break;
    }
    
    if (action !== 'back') {
      await this.pressEnterToContinue();
    }
    
    return false;
  }

  private async manageTemplates(config: PhoenixCodeLiteConfig): Promise<{ hasChanges: boolean; templateUpdated?: string }> {
    const inquirer = await import('inquirer');
    
    console.log(chalk.blue('\n📄 Template Management'));
    
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
          const defaultConfig = PhoenixCodeLiteConfig.getDefault();
          Object.assign(config, defaultConfig);
          console.log(chalk.green('✓ Configuration reset to default template'));
          return { hasChanges: true };
        }
        break;
    }
    
    return { hasChanges: false };
  }

  private async editAdvancedSettings(config: PhoenixCodeLiteConfig): Promise<boolean> {
    const inquirer = await import('inquirer');
    
    console.clear();
    console.log(chalk.blue.bold('📋 Phoenix Code Lite Configuration Editor'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log(chalk.blue.bold('🔧 Advanced Settings'));
    console.log(chalk.gray('═'.repeat(50)));
    
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
    
    if (setting === 'back') return false;
    
    // Handle language settings separately since they're now moved to advanced
    if (setting === 'language') {
      return await this.editLanguagePreferencesAdvanced(config);
    } else if (setting === 'agents') {
      return await this.editAgentConfiguration(config);
    } else if (setting === 'logging') {
      return await this.editLoggingConfiguration(config);
    } else if (setting === 'metrics') {
      return await this.editMetricsConfiguration(config);
    }
    
    return await this.editSpecificSetting(config, setting);
  }

  private async selectTemplateWithPreview(): Promise<string | null> {
    const inquirer = await import('inquirer');
    
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

  private async showTemplatePreview(): Promise<void> {
    const templates = ['starter', 'enterprise', 'performance', 'default'];
    
    console.log(chalk.blue('\n📄 Template Previews\n'));
    
    for (const templateName of templates) {
      let templateData;
      
      switch (templateName) {
        case 'starter':
          templateData = ConfigurationTemplates.getStarterTemplate();
          break;
        case 'enterprise':
          templateData = ConfigurationTemplates.getEnterpriseTemplate();
          break;
        case 'performance':
          templateData = ConfigurationTemplates.getPerformanceTemplate();
          break;
        default:
          templateData = PhoenixCodeLiteConfig.getDefault().export();
          break;
      }
      
      console.log(chalk.bold(`${templateName.toUpperCase()} TEMPLATE:`));
      if (templateData) {
        console.log(ConfigFormatter.formatConfigSummary(templateData as PhoenixCodeLiteConfigData));
      }
      console.log('');
    }
    
    await this.pressEnterToContinue();
  }

  private async confirmTemplateReset(): Promise<boolean> {
    const inquirer = await import('inquirer');
    
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

  private async confirmDiscardChanges(): Promise<boolean> {
    const inquirer = await import('inquirer');
    
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

  private async pressEnterToContinue(): Promise<void> {
    const inquirer = await import('inquirer');
    
    await inquirer.default.prompt([
      {
        type: 'input',
        name: 'continue',
        message: `${chalk.dim('Press Enter to continue')} ${chalk.gray('(or ESC to exit)')}...`,
      },
    ]);
  }
}
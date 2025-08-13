/**---
 * title: [CLI Commands Hub - CLI Interface Module]
 * tags: [CLI, Interface, Command-Processing, Orchestration]
 * provides: [generateCommand, initCommand, configCommand, templateCommand, Support Utilities]
 * requires: [ClaudeCodeClient, TDDOrchestrator, PhoenixCodeLiteConfig, ConfigurationTemplates, InteractivePrompts, ConfigFormatter]
 * description: [Implements Phoenix Code Lite CLI command handlers bridging CLI parsing to TDD workflow, configuration management, and interactive operations.]
 * ---*/

import { ClaudeCodeClient } from '../claude/client';
import { TDDOrchestrator } from '../tdd/orchestrator';
import { TaskContextSchema } from '../types/workflow';
import { PhoenixCodeLiteConfig, PhoenixCodeLiteConfigData } from '../config/settings';
import { ConfigurationTemplates } from '../config/templates';
import { PhoenixCodeLiteOptions } from './args';
import { ConfigFormatter } from './config-formatter';
import { InteractivePrompts } from './interactive';
import { safeExit } from '../utils/test-utils';
import chalk from 'chalk';

export async function generateCommand(options: PhoenixCodeLiteOptions): Promise<void> {
  // Use dynamic import for ES modules
  const { default: ora } = await import('ora');
  const spinner = ora('Initializing Phoenix-Code-Lite workflow...').start();
  
  try {
    // Load configuration using new system
    const config = await PhoenixCodeLiteConfig.load();
    
    // Apply CLI overrides to configuration
    if (options.verbose) config.set('output.verbose', true);
    if (options.maxAttempts) config.set('tdd.maxImplementationAttempts', parseInt(String(options.maxAttempts)));
    
    // Validate task context
    const context = {
      taskDescription: options.task,
      projectPath: options.projectPath || process.cwd(),
      language: options.language,
      framework: options.framework,
      maxTurns: config.get('claude.maxTurns'),
    };
    
    // Validate using schema
    const validatedContext = TaskContextSchema.parse(context);
    
    // Initialize Claude Code client with configuration
    const claudeClient = new ClaudeCodeClient({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Create TDD orchestrator
    const orchestrator = new TDDOrchestrator(claudeClient);
    
    spinner.text = 'Starting TDD workflow...';
    
    // Execute the workflow
    const result = await orchestrator.executeWorkflow(options.task, validatedContext);
    
    spinner.stop();
    
    // Display results
    if (result.success) {
      console.log(chalk.green('✓ Phoenix-Code-Lite workflow completed successfully!'));
      console.log(chalk.gray(`Duration: ${result.duration}ms`));
      console.log(chalk.gray(`Phases completed: ${result.phases.length}`));
      
      if (options.verbose) {
        displayDetailedResults(result);
      }
    } else {
      console.log(chalk.red('✗ Phoenix-Code-Lite workflow failed'));
      console.log(chalk.red(`Error: ${result.error}`));
      
      safeExit(1);
    }
    
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('Fatal error:'), error instanceof Error ? error.message : 'Unknown error');
    
    safeExit(1);
  }
}

export async function initCommand(options: any): Promise<void> {
  console.log(chalk.blue('✦ Initializing Phoenix-Code-Lite...'));
  
  try {
    // Create configuration using new system
    let config = PhoenixCodeLiteConfig.getDefault();
    
    // Apply template if specified
    if (options.template) {
      let template;
      switch (options.template) {
        case 'starter':
          template = ConfigurationTemplates.getStarterTemplate();
          break;
        case 'enterprise':
          template = ConfigurationTemplates.getEnterpriseTemplate();
          break;
        case 'performance':
          template = ConfigurationTemplates.getPerformanceTemplate();
          break;
        default:
          console.log(chalk.yellow('Unknown template. Using default configuration.'));
          console.log(chalk.gray('Available templates: starter, enterprise, performance'));
      }
      
      if (template) {
        config = config.merge(template);
        console.log(chalk.blue(`Applied ${options.template} template`));
      }
    }
    
    await config.save(options.force);
    
    console.log(chalk.green('✓ Phoenix-Code-Lite initialized successfully!'));
    console.log(chalk.gray('Run "phoenix-code-lite generate --task \'your task\'" to get started'));
    
  } catch (error) {
    console.error(chalk.red('Initialization failed:'), error instanceof Error ? error.message : 'Unknown error');
    
    safeExit(1);
  }
}

export async function configCommand(options: any): Promise<void> {
  try {
    if (options.show) {
      // Show current configuration using new formatted display
      try {
        const config = await PhoenixCodeLiteConfig.load();
        
        // Use the new formatter for user-friendly display
        console.log(ConfigFormatter.formatConfig(config.export()));
        
        // Show validation status
        const errors = config.validate();
        if (errors.length > 0) {
          console.log(chalk.yellow('\n⚠  Configuration Issues:'));
          errors.forEach(error => console.log(chalk.yellow(`  - ${error}`)));
        } else {
          console.log(chalk.green('\n✓ Configuration is valid'));
        }
        
      } catch (error) {
        // Handle configuration loading errors gracefully
        if (error instanceof Error && error.message.includes('Configuration validation failed')) {
          console.log(chalk.yellow('⚠  Configuration validation issues detected. Using default values.\n'));
          
          // Load and display default configuration
          const defaultConfig = PhoenixCodeLiteConfig.getDefault();
          console.log(chalk.gray('Configuration (using defaults due to validation issues):'));
          console.log(ConfigFormatter.formatConfig(defaultConfig.export()));
          
          console.log(chalk.yellow('\n⚠  To fix configuration issues, run: phoenix-code-lite config --reset'));
        } else {
          throw error;
        }
      }
      
    } else if (options.edit || options.adjust || options.add) {
      // Only create InteractivePrompts when actually needed for interactive operations
      const interactive = new InteractivePrompts();
      
      if (options.edit) {
        // Launch interactive configuration editor
        const result = await interactive.runInteractiveConfigEditor();
        
        if (result.saved) {
          if (result.templateUpdated) {
            await applyTemplate(result.templateUpdated);
          }
        }
        
      } else if (options.adjust) {
        // Adjust template functionality
        await adjustTemplate(options.adjust, interactive);
        
      } else if (options.add) {
        // Add new template functionality
        await addTemplate(options.add, interactive);
      }
      
    } else if (options.use) {
      // Switch to template using new --use command
      await applyTemplate(options.use);
      
    } else if (options.reset) {
      // Reset using new configuration system
      const config = PhoenixCodeLiteConfig.getDefault();
      await config.save(true);
      console.log(chalk.green('✓ Configuration reset to defaults'));
      
    } else if (options.template) {
      // Apply configuration template (legacy support)
      await applyTemplate(options.template);
      
    } else {
      console.log(chalk.yellow('Configuration commands:'));
      console.log('  --show              Display current configuration');
      console.log('  --edit              Interactive configuration editor');
      console.log('  --use <name>        Switch to template (starter|enterprise|performance|default)');
      console.log('  --adjust <name>     Adjust template settings');
      console.log('  --add <name>        Create new template');
      console.log('  --reset             Reset to default configuration');
      console.log('  --template <name>   Apply template (legacy - use --use instead)');
    }
    
    // Let main program handle process exit - don't call safeExit() here
    // This matches the behavior of help/version commands
    
  } catch (error) {
    console.error(chalk.red('Configuration error:'), error instanceof Error ? error.message : 'Unknown error');
    
    // Re-throw error to let main program handle exit
    throw error;
  }
}

async function applyTemplate(templateName: string): Promise<void> {
  let template;
  let displayName = templateName;
  
  switch (templateName) {
    case 'starter':
      template = ConfigurationTemplates.getStarterTemplate();
      break;
    case 'enterprise':
      template = ConfigurationTemplates.getEnterpriseTemplate();
      break;
    case 'performance':
      template = ConfigurationTemplates.getPerformanceTemplate();
      break;
    case 'default':
      template = PhoenixCodeLiteConfig.getDefault().export();
      displayName = 'default';
      break;
    default:
      console.log(chalk.red('Unknown template. Available templates: starter, enterprise, performance, default'));
      return;
  }
  
  const baseConfig = PhoenixCodeLiteConfig.getDefault();
  const configWithTemplate = baseConfig.merge(template);
  await configWithTemplate.save(true);
  
  console.log(chalk.green(`✓ Applied ${displayName} template`));
  console.log(chalk.gray(ConfigFormatter.formatConfigSummary(configWithTemplate.export())));
}

async function adjustTemplate(templateName: string, interactive: InteractivePrompts): Promise<void> {
  console.log(chalk.blue.bold(`◦ Adjusting Template: ${templateName}`));
  console.log(chalk.gray('═'.repeat(50)));
  
  // Load the specified template
  let templateConfig;
  try {
    switch (templateName) {
      case 'starter':
        templateConfig = PhoenixCodeLiteConfig.getDefault().merge(ConfigurationTemplates.getStarterTemplate());
        break;
      case 'enterprise':
        templateConfig = PhoenixCodeLiteConfig.getDefault().merge(ConfigurationTemplates.getEnterpriseTemplate());
        break;
      case 'performance':
        templateConfig = PhoenixCodeLiteConfig.getDefault().merge(ConfigurationTemplates.getPerformanceTemplate());
        break;
      case 'default':
        templateConfig = PhoenixCodeLiteConfig.getDefault();
        break;
      default:
        console.log(chalk.red(`Unknown template: ${templateName}`));
        console.log(chalk.gray('Available templates: starter, enterprise, performance, default'));
        return;
    }
    
    // Run interactive editor on the template
    console.log(chalk.yellow(`\nLoaded ${templateName} template for adjustment.`));
    console.log(chalk.gray('Use the interactive editor to modify settings, then save to apply changes.\n'));
    
    const result = await interactive.runInteractiveConfigEditor();
    
    if (result.saved) {
      console.log(chalk.green(`\n✓ ${templateName} template adjustments saved successfully!`));
    } else {
      console.log(chalk.yellow(`\n⚠ No changes saved to ${templateName} template.`));
    }
    
  } catch (error) {
    console.error(chalk.red('Template adjustment failed:'), error instanceof Error ? error.message : 'Unknown error');
  }
}

async function addTemplate(templateName: string, interactive: InteractivePrompts): Promise<void> {
  console.log(chalk.blue.bold(`➕ Creating New Template: ${templateName}`));
  console.log(chalk.gray('═'.repeat(50)));
  
  const inquirer = await import('inquirer');
  
  // Ask user to select base template
  const { baseTemplate } = await inquirer.default.prompt([
    {
      type: 'list',
      name: 'baseTemplate',
      message: `Select base template for '${templateName}':`,
      choices: [
        { name: '^ Starter Template (Basic settings)', value: 'starter' },
        { name: '🏢 Enterprise Template (Production-ready)', value: 'enterprise' },
        { name: '⚡ Performance Template (Speed-optimized)', value: 'performance' },
        { name: '⊕ Default Template (Balanced)', value: 'default' },
        { name: '* Empty Template (Start from scratch)', value: 'empty' },
      ],
    },
  ]);
  
  // Load base template
  let baseConfig;
  switch (baseTemplate) {
    case 'starter':
      baseConfig = PhoenixCodeLiteConfig.getDefault().merge(ConfigurationTemplates.getStarterTemplate());
      break;
    case 'enterprise':
      baseConfig = PhoenixCodeLiteConfig.getDefault().merge(ConfigurationTemplates.getEnterpriseTemplate());
      break;
    case 'performance':
      baseConfig = PhoenixCodeLiteConfig.getDefault().merge(ConfigurationTemplates.getPerformanceTemplate());
      break;
    case 'empty':
      baseConfig = PhoenixCodeLiteConfig.getDefault();
      // Reset to minimal configuration
      baseConfig.set('tdd.testQualityThreshold', 0.5);
      baseConfig.set('quality.minTestCoverage', 0.5);
      break;
    default:
      baseConfig = PhoenixCodeLiteConfig.getDefault();
      break;
  }
  
  console.log(chalk.yellow(`\nCreating '${templateName}' based on ${baseTemplate} template.`));
  console.log(chalk.gray('Use the interactive editor to customize your new template.\n'));
  
  // Run interactive editor
  const result = await interactive.runInteractiveConfigEditor();
  
  if (result.saved) {
    console.log(chalk.green(`\n✓ New template '${templateName}' created successfully!`));
    console.log(chalk.gray(`Template saved to current configuration.`));
    console.log(chalk.blue(`\nTo use this template in the future, run:`));
    console.log(chalk.gray(`  phoenix-code-lite config --use ${templateName}`));
    console.log(chalk.yellow(`\nNote: Custom templates are saved as configurations.`));
    console.log(chalk.yellow(`For persistent templates, consider documenting your settings.`));
  } else {
    console.log(chalk.yellow(`\n⚠ Template creation cancelled.`));
  }
}

export async function templateCommand(options: any): Promise<void> {
  console.log(chalk.blue.bold('□ Phoenix Code Lite Template Manager'));
  console.log(chalk.gray('═'.repeat(50)));
  
  const interactive = new InteractivePrompts();
  const inquirer = await import('inquirer');
  
  try {
    const { action } = await inquirer.default.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select template operation:',
        choices: [
          { name: '⇔ Switch to Template', value: 'use' },
          { name: '◦ Adjust Template Settings', value: 'adjust' },
          { name: '➕ Create New Template', value: 'add' },
          { name: '⇔ Reset to Default Template', value: 'reset' },
          { name: '⋇ View Template Previews', value: 'preview' },
          new inquirer.default.Separator(),
          { name: '✗ Cancel', value: 'cancel' },
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
        console.log(chalk.gray('\n✓ Template management cancelled.'));
        break;
        
      default:
        console.log(chalk.gray('\n✓ Template management completed.'));
        break;
    }
    
  } catch (error) {
    console.error(chalk.red('Template management error:'), error instanceof Error ? error.message : 'Unknown error');
    
    safeExit(1);
  }
}

async function selectTemplateForUse(): Promise<string | null> {
  const inquirer = await import('inquirer');
  
  const { template } = await inquirer.default.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select template to use:',
      choices: [
        { name: '^ Starter Template (Basic settings)', value: 'starter' },
        { name: '🏢 Enterprise Template (Production-ready)', value: 'enterprise' },
        { name: '⚡ Performance Template (Speed-optimized)', value: 'performance' },
        { name: '⊕ Default Template (Balanced)', value: 'default' },
        new inquirer.default.Separator(),
        { name: '✗ Cancel', value: 'cancel' },
      ],
      pageSize: 8,
      loop: false,
    },
  ]);
  
  return template === 'cancel' ? null : template;
}

async function selectTemplateForAdjust(): Promise<string | null> {
  const inquirer = await import('inquirer');
  
  const { template } = await inquirer.default.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select template to adjust:',
      choices: [
        { name: '^ Starter Template', value: 'starter' },
        { name: '🏢 Enterprise Template', value: 'enterprise' },
        { name: '⚡ Performance Template', value: 'performance' },
        { name: '⊕ Default Template', value: 'default' },
        new inquirer.default.Separator(),
        { name: '✗ Cancel', value: 'cancel' },
      ],
      pageSize: 8,
      loop: false,
    },
  ]);
  
  return template === 'cancel' ? null : template;
}

async function getNewTemplateName(): Promise<string | null> {
  const inquirer = await import('inquirer');
  
  const { templateName } = await inquirer.default.prompt([
    {
      type: 'input',
      name: 'templateName',
      message: 'Enter name for new template:',
      validate: (input: string) => {
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
      filter: (input: string) => input.trim(),
    },
  ]);
  
  return templateName || null;
}

async function adjustTemplateSettings(templateName: string, interactive: InteractivePrompts): Promise<void> {
  console.log(chalk.blue.bold(`◦ Adjusting Template: ${templateName}`));
  console.log(chalk.gray('═'.repeat(50)));
  
  // Load the specified template
  let templateConfig;
  try {
    switch (templateName) {
      case 'starter':
        templateConfig = PhoenixCodeLiteConfig.getDefault().merge(ConfigurationTemplates.getStarterTemplate());
        break;
      case 'enterprise':
        templateConfig = PhoenixCodeLiteConfig.getDefault().merge(ConfigurationTemplates.getEnterpriseTemplate());
        break;
      case 'performance':
        templateConfig = PhoenixCodeLiteConfig.getDefault().merge(ConfigurationTemplates.getPerformanceTemplate());
        break;
      case 'default':
        templateConfig = PhoenixCodeLiteConfig.getDefault();
        break;
      default:
        console.log(chalk.red(`Unknown template: ${templateName}`));
        console.log(chalk.gray('Available templates: starter, enterprise, performance, default'));
        return;
    }
    
    // Run interactive editor on the template
    console.log(chalk.yellow(`\nLoaded ${templateName} template for adjustment.`));
    console.log(chalk.gray('Use the interactive editor to modify settings, then save to apply changes.\n'));
    
    const result = await interactive.runInteractiveConfigEditor();
    
    if (result.saved) {
      console.log(chalk.green(`\n✓ ${templateName} template adjustments saved successfully!`));
    } else {
      console.log(chalk.yellow(`\n⚠ No changes saved to ${templateName} template.`));
    }
    
  } catch (error) {
    console.error(chalk.red('Template adjustment failed:'), error instanceof Error ? error.message : 'Unknown error');
  }
}

async function confirmTemplateReset(): Promise<boolean> {
  const inquirer = await import('inquirer');
  
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

async function resetToDefaultTemplate(): Promise<void> {
  try {
    const config = PhoenixCodeLiteConfig.getDefault();
    await config.save(true);
    console.log(chalk.green('\n✓ Configuration reset to default template successfully!'));
    console.log(chalk.gray('All settings have been restored to their default values.'));
  } catch (error) {
    console.error(chalk.red('Failed to reset template:'), error instanceof Error ? error.message : 'Unknown error');
  }
}

async function showTemplatePreview(): Promise<void> {
  const templates = ['starter', 'enterprise', 'performance', 'default'];
  
  console.log(chalk.blue('\n□ Template Previews\n'));
  
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
  
  const inquirer = await import('inquirer');
  await inquirer.default.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...',
    },
  ]);
}

function displayDetailedResults(result: any): void {
  console.log('\n◊ Detailed Results:');
  
  result.phases.forEach((phase: any, index: number) => {
    const icon = phase.success ? '✓' : '✗';
    const duration = phase.endTime ? phase.endTime.getTime() - phase.startTime.getTime() : 0;
    
    console.log(`${icon} Phase ${index + 1}: ${phase.name} (${duration}ms)`);
    
    if (phase.artifacts && phase.artifacts.length > 0) {
      console.log(`   □ Artifacts: ${phase.artifacts.join(', ')}`);
    }
    
    if (phase.error) {
      console.log(chalk.red(`   ✗ Error: ${phase.error}`));
    }
  });
  
  if (result.metadata?.qualitySummary) {
    console.log(`\n○ ${result.metadata.qualitySummary}`);
  }
}

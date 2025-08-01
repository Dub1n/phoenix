import { ClaudeCodeClient } from '../claude/client';
import { TDDOrchestrator } from '../tdd/orchestrator';
import { TaskContextSchema } from '../types/workflow';
import { PhoenixCodeLiteConfig } from '../config/settings';
import { ConfigurationTemplates } from '../config/templates';
import { PhoenixCodeLiteOptions } from './args';
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
      process.exit(1);
    }
    
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('Fatal error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
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
    process.exit(1);
  }
}

export async function configCommand(options: any): Promise<void> {
  try {
    if (options.show) {
      // Show current configuration using new system
      const config = await PhoenixCodeLiteConfig.load();
      
      console.log(chalk.blue('※ Current Configuration:'));
      console.log(JSON.stringify(config.export(), null, 2));
      
      // Show validation status
      const errors = config.validate();
      if (errors.length > 0) {
        console.log(chalk.yellow('\n⚠  Configuration Issues:'));
        errors.forEach(error => console.log(chalk.yellow(`  - ${error}`)));
      } else {
        console.log(chalk.green('\n✓ Configuration is valid'));
      }
      
    } else if (options.reset) {
      // Reset using new configuration system
      const config = PhoenixCodeLiteConfig.getDefault();
      await config.save(true);
      console.log(chalk.green('✓ Configuration reset to defaults'));
      
    } else if (options.template) {
      // Apply configuration template
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
          console.log(chalk.red('Unknown template. Available templates: starter, enterprise, performance'));
          return;
      }
      
      const baseConfig = PhoenixCodeLiteConfig.getDefault();
      const configWithTemplate = baseConfig.merge(template);
      await configWithTemplate.save(true);
      
      console.log(chalk.green(`✓ Applied ${options.template} template`));
      
    } else {
      console.log(chalk.yellow('Configuration commands:'));
      console.log('  --show              Display current configuration');
      console.log('  --reset             Reset to default configuration');
      console.log('  --template <name>   Apply template (starter|enterprise|performance)');
    }
  } catch (error) {
    console.error(chalk.red('Configuration error:'), error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
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
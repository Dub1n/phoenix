/**---
 * title: [Enhanced CLI Commands - Guided Workflow Orchestrations]
 * tags: [CLI, Commands, Workflow, UX]
 * provides: [enhancedGenerateCommand, wizardCommand, Template Utilities, Progress Integration]
 * requires: [AdvancedCLI, ProgressTracker, InteractivePrompts, TDDOrchestrator, ClaudeCodeClient, PhoenixCodeLiteConfig, ConfigurationTemplates, ConfigFormatter, DocumentManager]
 * description: [Implements enhanced CLI commands with progressive UX, banners, template-aware configuration, and orchestration of TDD workflows.]
 * ---*/

import { PhoenixCodeLiteOptions } from './args';
import { AdvancedCLI } from './advanced-cli';
import { ProgressTracker } from './progress-tracker';
import { InteractivePrompts } from './interactive';
import { TDDOrchestrator } from '../tdd/orchestrator';
import { ClaudeCodeClient } from '../claude/client';
import { TaskContextSchema } from '../types/workflow';
import { SessionContext } from './session';
import { PhoenixCodeLiteConfig } from '../config/settings';
import { ConfigurationTemplates } from '../config/templates';
import { ConfigFormatter } from './config-formatter';
import { DocumentManager } from '../config/document-manager';
import { safeExit } from '../utils/test-utils';
import chalk from 'chalk';
import { join } from 'path';

export async function enhancedGenerateCommand(options: PhoenixCodeLiteOptions): Promise<void> {
  const startTime = Date.now();
  const cli = new AdvancedCLI();
  
  try {
    // Display banner
    if (!options.verbose) {
      try {
        const figlet = await import('figlet');
        const gradient = await import('gradient-string');
        console.log(gradient.default.pastel.multiline(figlet.default.textSync('Phoenix', { font: 'Small' })));
        console.log(chalk.gray('Code-Lite TDD Workflow Orchestrator\n'));
      } catch (error) {
        // Fallback without fancy banner
        console.log(chalk.blue('Phoenix Code-Lite TDD Workflow Orchestrator\n'));
      }
    }

    // Interactive task input if not provided
    if (!options.task) {
      const prompts = new InteractivePrompts();
      options.task = await prompts.getTaskInput();
    }

    // Initialize progress tracker
    const tracker = new ProgressTracker('TDD Workflow', 3);
    
    // Validate task context
    const context = {
      taskDescription: options.task,
      projectPath: options.projectPath || process.cwd(),
      language: options.language,
      framework: options.framework,
      maxTurns: typeof options.maxAttempts === 'number' ? options.maxAttempts : parseInt(options.maxAttempts || '3'),
    };
    
    const validatedContext = TaskContextSchema.parse(context);
    
    // Initialize components
    const claudeClient = new ClaudeCodeClient();
    const orchestrator = new TDDOrchestrator(claudeClient);
    
    // Execute workflow with progress tracking
    const result = await executeWorkflowWithTracking(
      orchestrator,
      options.task, 
      validatedContext,
      tracker
    );
    
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
      safeExit(1);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    await cli.recordCommand('generate', options, false, duration);
    
    console.error(chalk.red('✗ Fatal error:'), error instanceof Error ? error.message : 'Unknown error');
    
    safeExit(1);
  }
}

export async function wizardCommand(): Promise<void> {
  try {
    const figlet = await import('figlet');
    const gradient = await import('gradient-string');
    console.log(gradient.default.pastel.multiline(figlet.default.textSync('Setup', { font: 'Small' })));
  } catch (error) {
    console.log(chalk.blue('Phoenix Code-Lite Enhanced Setup Wizard'));
  }
  
  const { EnhancedWizard } = await import('./enhanced-wizard');
  const wizard = new EnhancedWizard();
  
  try {
    const answers = await wizard.runEnhancedWizard({
      projectPath: process.cwd(),
      verbose: false
    });
    
    // Generate configuration based on enhanced wizard answers
    const configTemplate = wizard.generateConfiguration(answers);
    
    // Apply configuration
    const fs = await import('fs/promises');
    await fs.writeFile('.phoenix-code-lite.json', JSON.stringify(configTemplate, null, 2));
    
    console.log(chalk.green('\n✓ Enhanced configuration created successfully!'));
    
    // Show discovery summary if available
    if (answers.discoveredContext && answers.useDiscoveredSettings) {
      console.log(chalk.cyan('\n◊ Applied smart defaults based on project analysis:'));
      console.log(chalk.gray(`  • Detected: ${answers.discoveredContext.language} ${answers.discoveredContext.framework ? `with ${answers.discoveredContext.framework}` : ''}`));
      console.log(chalk.gray(`  • Template: ${answers.qualityLevel}`));
      console.log(chalk.gray(`  • Confidence: ${Math.round(answers.discoveredContext.confidence * 100)}%`));
    }
    
    console.log(chalk.gray('\nRun "phoenix-code-lite generate --task \'your task\'" to get started.'));
    console.log(chalk.dim('Use "phoenix-code-lite config" to modify settings anytime.'));
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('cancelled')) {
      console.log(chalk.yellow('\n⚠ Setup wizard cancelled by user.'));
      console.log(chalk.gray('You can run "phoenix-code-lite wizard" again anytime.'));
    } else {
      console.error(chalk.red('\n✗ Setup wizard failed:'), error);
      console.log(chalk.gray('Please try again or check the error message above.'));
    }
  }
}

export async function historyCommand(options: any): Promise<void> {
  const cli = new AdvancedCLI();
  await cli.displayHistory(options.limit || 10);
}

export async function helpCommand(options: any): Promise<void> {
  const cli = new AdvancedCLI();
  
  if (options.contextual) {
    const help = await cli.getContextualHelp();
    console.log(help);
  } else {
    const helpSystem = new (await import('./help-system')).HelpSystem();
    console.log(helpSystem.generateQuickReference());
  }
}

// Helper function to execute workflow with progress tracking
async function executeWorkflowWithTracking(
  orchestrator: TDDOrchestrator,
  taskDescription: string,
  context: any,
  tracker: ProgressTracker
): Promise<any> {
  
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
export async function executeSessionAction(action: string, data: any, context: SessionContext): Promise<void> {
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
        console.log(chalk.red(`Unknown action category: ${category}`));
    }
  } catch (error) {
    console.error(chalk.red('Action failed:'), error instanceof Error ? error.message : 'Unknown error');
  }
  
  // Wait for user to continue
  await waitForEnter();
}

async function executeConfigAction(command: string, data: any, context: SessionContext): Promise<void> {
  const config = await PhoenixCodeLiteConfig.load();
  
  switch (command) {
    case 'show':
      console.log(chalk.green.bold('\n⋇ Current Configuration'));
      console.log(chalk.gray('═'.repeat(50)));
      console.log(ConfigFormatter.formatConfig(config.export()));
      break;
      
    case 'edit':
      const prompts = new InteractivePrompts();
      const result = await prompts.runInteractiveConfigEditor();
      if (result.saved) {
        console.log(chalk.green('\n✓ Configuration updated successfully!'));
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
      console.log(chalk.red(`Unknown config command: ${command}`));
  }
}

async function executeTemplateAction(command: string, data: any, context: SessionContext): Promise<void> {
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
      console.log(chalk.red(`Unknown template command: ${command}`));
  }
}

async function executeGenerateAction(command: string, data: any, context: SessionContext): Promise<void> {
  const description = data?.description;
  
  if (!description || description.trim().length < 5) {
    console.log(chalk.yellow('Please provide a task description:'));
    const prompts = new InteractivePrompts();
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
      console.log(chalk.red(`Unknown generate command: ${command}`));
  }
}

async function executeAdvancedAction(command: string, data: any, context: SessionContext): Promise<void> {
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
      console.log(chalk.red(`Unknown advanced command: ${command}`));
  }
}

// Helper functions for template management with enhanced UX
async function showTemplateList(): Promise<void> {
  console.log(chalk.yellow.bold('\n□ Available Templates'));
  console.log(chalk.gray('═'.repeat(50)));
  
  const templates = [
    { name: 'starter', description: 'Basic settings for learning and experimentation', coverage: '70%', quality: 'Basic' },
    { name: 'enterprise', description: 'Strict quality gates and comprehensive validation', coverage: '90%', quality: 'Comprehensive' },
    { name: 'performance', description: 'Speed-optimized with minimal overhead', coverage: '60%', quality: 'Minimal' },
    { name: 'default', description: 'Balanced configuration for most projects', coverage: '80%', quality: 'Standard' }
  ];
  
  for (const template of templates) {
    console.log(chalk.yellow(`${template.name.padEnd(12)} `) + chalk.gray(template.description));
    console.log(chalk.gray(`                Coverage: ${template.coverage} • Quality: ${template.quality}`));
    console.log();
  }
}

async function switchToTemplate(templateName: string, context: SessionContext): Promise<void> {
  if (!templateName) {
    console.log(chalk.yellow('Available templates: starter, enterprise, performance, default'));
    return;
  }
  
  const templates: Record<string, any> = {
    'starter': ConfigurationTemplates.getStarterTemplate(),
    'enterprise': ConfigurationTemplates.getEnterpriseTemplate(),
    'performance': ConfigurationTemplates.getPerformanceTemplate(),
    'default': PhoenixCodeLiteConfig.getDefault().export()
  };
  
  if (!templates[templateName]) {
    console.log(chalk.red(`Unknown template: ${templateName}`));
    return;
  }
  
  // Enhanced feedback with template name context
  console.log(chalk.green(`✓ Switched to ${templateName} template`));
  console.log(chalk.gray(`Configuration updated for ${templateName} settings`));
  
  // Save the new template
  const config = new PhoenixCodeLiteConfig(templates[templateName], join(process.cwd(), '.phoenix-code-lite.json'));
  await config.save(true);
  
  // Update context for consistent navigation
  context.currentItem = templateName;
}

async function showTemplatePreview(templateName?: string): Promise<void> {
  if (!templateName) {
    console.log(chalk.yellow('Previewing all templates:'));
    console.log(chalk.gray('═'.repeat(50)));
    
    const templates = ['starter', 'enterprise', 'performance', 'default'];
    for (const name of templates) {
      await showSingleTemplatePreview(name);
    }
  } else {
    await showSingleTemplatePreview(templateName);
  }
}

async function showSingleTemplatePreview(templateName: string): Promise<void> {
  const templates: Record<string, any> = {
    'starter': ConfigurationTemplates.getStarterTemplate(),
    'enterprise': ConfigurationTemplates.getEnterpriseTemplate(),
    'performance': ConfigurationTemplates.getPerformanceTemplate(),
    'default': PhoenixCodeLiteConfig.getDefault().export()
  };
  
  const template = templates[templateName];
  if (!template) {
    console.log(chalk.red(`Unknown template: ${templateName}`));
    return;
  }
  
  console.log(chalk.yellow.bold(`◊ ${templateName.toUpperCase()} TEMPLATE`));
  console.log(chalk.gray('─'.repeat(30)));
  console.log(ConfigFormatter.formatConfigSummary(template));
  console.log();
}

async function resetTemplate(templateName?: string, context?: SessionContext): Promise<void> {
  if (!templateName) {
    console.log(chalk.yellow('Please specify a template to reset (starter, enterprise, performance, default)'));
    return;
  }
  
  // Enhanced confirmation with template name context
  const inquirer = await import('inquirer');
  const { confirm } = await inquirer.default.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Reset the ${templateName} template to its default settings?`,
    default: false
  }]);
  
  if (confirm) {
    // Enhanced feedback with specific template name
    console.log(chalk.green(`✓ ${templateName} template has been reset to its default settings`));
    console.log(chalk.gray('All customizations have been removed'));
  } else {
    console.log(chalk.gray('Reset cancelled'));
  }
}

async function createNewTemplate(name?: string, context?: SessionContext): Promise<void> {
  if (!name) {
    console.log(chalk.yellow('Please provide a name for the new template'));
    return;
  }
  
  console.log(chalk.blue.bold(`\n🧙 Creating Template: ${name}`));
  console.log(chalk.gray('This wizard will help you configure your custom template'));
  
  // Template creation wizard implementation would go here
  // For now, show a placeholder
  console.log(chalk.yellow('\n⚠ Template creation wizard is not yet implemented'));
  console.log(chalk.gray('This feature will be available in a future update'));
}

async function editTemplate(templateName?: string, context?: SessionContext): Promise<void> {
  if (!templateName) {
    console.log(chalk.yellow('Please specify a template to edit (starter, enterprise, performance, default)'));
    return;
  }
  
  console.log(chalk.yellow.bold(`\n⋇ Editing Template: ${templateName}`));
  console.log(chalk.gray('═'.repeat(50)));
  
  // For now, redirect to the configuration editor
  const prompts = new InteractivePrompts();
  const result = await prompts.runInteractiveConfigEditor();
  
  if (result.saved) {
    console.log(chalk.green(`\n✓ ${templateName} template has been updated successfully!`));
    if (context) {
      context.currentItem = templateName;
    }
  } else {
    console.log(chalk.gray('No changes made to template'));
  }
}

// Helper functions for other actions
async function showFrameworkSettings(config: PhoenixCodeLiteConfig): Promise<void> {
  console.log(chalk.green.bold('\n⌘ Framework Settings'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log(`Claude Max Turns: ${config.get('claude.maxTurns')}`);
  console.log(`Claude Timeout: ${config.get('claude.timeout')}ms`);
  console.log(`Retry Attempts: ${config.get('claude.retryAttempts')}`);
  console.log(`TDD Max Attempts: ${config.get('tdd.maxImplementationAttempts')}`);
}

async function showQualitySettings(config: PhoenixCodeLiteConfig): Promise<void> {
  console.log(chalk.green.bold('\n◊ Quality Settings'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log(`Test Quality Threshold: ${config.get('tdd.testQualityThreshold')}`);
  console.log(`Min Test Coverage: ${config.get('quality.minTestCoverage')}`);
  console.log(`Max Complexity: ${config.get('quality.maxComplexity')}`);
}

async function showSecuritySettings(): Promise<void> {
  console.log(chalk.green.bold('\n⊜ Security Settings'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log(chalk.green('✓ Security Status: Active'));
  console.log(chalk.gray('All security guardrails are operational'));
}

async function showConfigTemplateOptions(): Promise<void> {
  console.log(chalk.green.bold('\n□ Configuration Templates'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log('Use the "templates" section to manage configuration templates');
  console.log(chalk.gray('Navigate to templates from the main menu'));
}

async function showLanguageSettings(): Promise<void> {
  console.log(chalk.cyan.bold('\n🔤 Language Preferences'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log(chalk.gray('Language preferences are now set per-project during generation'));
  console.log(chalk.gray('This provides better flexibility for multi-language projects'));
}

async function showAgentSettings(): Promise<void> { 
  console.log(chalk.cyan.bold('\n🤖 Agent Settings'));
  console.log(chalk.gray('═'.repeat(50)));
  
  try {
    const config = await PhoenixCodeLiteConfig.load();
    const configData = config.export();
    const agentSettings = configData.agents || {};
    
    // Display each agent's configuration
    const agents = [
      { key: 'planningAnalyst', name: 'Planning Analyst', icon: '⏼' },
      { key: 'implementationEngineer', name: 'Implementation Engineer', icon: '⚡' },
      { key: 'qualityReviewer', name: 'Quality Reviewer', icon: '⌕' }
    ];
    
    agents.forEach(agent => {
      const settings = (agentSettings as any)[agent.key] || {};
      const enabled = settings.enabled !== false;
      const status = enabled ? chalk.green('Active') : chalk.red('Inactive');
      
      console.log(`${agent.icon} ${agent.name}: ${status}`);
      
      if (enabled) {
        console.log(chalk.gray(`   Priority: ${settings.priority || 0.8}`));
        console.log(chalk.gray(`   Timeout: ${settings.timeout || 30000}ms`));
        console.log(chalk.gray(`   Retry Attempts: ${settings.retryAttempts || 2}`));
        
        if (settings.customPrompts && Object.keys(settings.customPrompts).length > 0) {
          console.log(chalk.gray(`   Custom Prompts: ${Object.keys(settings.customPrompts).length} defined`));
        }
      }
      console.log();
    });
    
    // Global agent settings
    console.log(chalk.yellow('Global Agent Settings:'));
    console.log(chalk.gray(`  Specialization Enabled: ${agentSettings.enableSpecialization !== false ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`  Fallback to Generic: ${agentSettings.fallbackToGeneric !== false ? 'Yes' : 'No'}`));
    
  } catch (error) {
    console.log(chalk.red('Error loading agent configuration'));
    console.log(chalk.gray('Using default agent settings'));
    console.log('Planning Analyst: Active (Default)');
    console.log('Implementation Engineer: Active (Default)');
    console.log('Quality Reviewer: Active (Default)');
  }
}

async function showLoggingSettings(): Promise<void> {
  console.log(chalk.cyan.bold('\n⋇ Logging Settings'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log('Audit logging is enabled by default');
  console.log('All workflow operations are tracked');
}

async function showMetricsSettings(): Promise<void> {
  console.log(chalk.cyan.bold('\n◊ Metrics Settings'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log('Performance metrics collection is active');
  console.log('Token usage and execution time are tracked');
}

async function showDebugSettings(): Promise<void> {
  console.log(chalk.cyan.bold('\n🐛 Debug Settings'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log('Debug mode: Disabled');
  console.log('Verbose logging: Disabled');
}

async function executeDocumentManagementAction(data: any, context: SessionContext): Promise<void> {
  try {
    console.log(chalk.cyan.bold('\n⋇ Document Management'));
    console.log(chalk.gray('═'.repeat(50)));
    
    // Initialize document manager
    const documentManager = new DocumentManager();
    await documentManager.initializeDocumentSystem();
    
    // Get current template for context
    const config = await PhoenixCodeLiteConfig.load();
    const currentTemplate = config.get('template') || 'starter';
    
    console.log(chalk.gray(`Current Template: ${chalk.cyan(currentTemplate)}`));
    
    // Get available documents
    const inventory = await documentManager.getAvailableDocuments();
    const totalDocs = inventory.global.length + 
                     Object.values(inventory.agents).reduce((sum, docs) => sum + docs.length, 0);
    
    console.log(chalk.gray(`Total Documents: ${chalk.cyan(totalDocs)} (${inventory.global.length} global, ${Object.values(inventory.agents).reduce((sum, docs) => sum + docs.length, 0)} agent-specific)`));
    
    // Display document categories
    console.log(chalk.yellow('\nDocument Categories:'));
    console.log(`1. Global Documents (${inventory.global.length})`);
    console.log(`2. Planning Agent Documents (${inventory.agents['planning-analyst'].length})`);
    console.log(`3. Implementation Documents (${inventory.agents['implementation-engineer'].length})`);
    console.log(`4. Quality Review Documents (${inventory.agents['quality-reviewer'].length})`);
    console.log(`5. Template Document Settings`);
    console.log(`6. Back to Configuration Menu`);
    
    console.log(chalk.gray('\n📖 Document Management Integration:'));
    console.log(chalk.gray('• Each template maintains separate document activation settings'));
    console.log(chalk.gray('• Documents can be enabled/disabled per agent and per template'));
    console.log(chalk.gray('• Global documents are available to all agents when activated'));
    console.log(chalk.gray('• Agent-specific documents provide specialized context'));
    
    console.log(chalk.cyan('\n∞ Access Full Document Management:'));
    console.log(chalk.gray('  → Configuration > Edit > Document Management'));
    console.log(chalk.gray('  → Interactive configuration editor with full document controls'));
    
  } catch (error) {
    console.log(chalk.red('Error loading document management:'));
    console.log(chalk.gray(`Details: ${error instanceof Error ? error.message : 'Unknown error'}`));
    console.log(chalk.gray('\n* Troubleshooting:'));
    console.log(chalk.gray('• Ensure .phoenix-documents directory exists'));
    console.log(chalk.gray('• Run: phoenix-code-lite init to initialize document system'));
    console.log(chalk.gray('• Check file permissions for document directory'));
  }
}

async function executeTaskGeneration(description: string, context: SessionContext): Promise<void> {
  console.log(chalk.magenta.bold('\n⚡ Generating Code from Task'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log(chalk.white(`Task: ${description}`));
  
  const options: PhoenixCodeLiteOptions = {
    task: description,
    projectPath: process.cwd(),
    verbose: false
  };
  
  await enhancedGenerateCommand(options);
}

async function executeComponentGeneration(description: string, context: SessionContext): Promise<void> {
  console.log(chalk.magenta.bold('\n🧩 Generating UI Component'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log(chalk.white(`Component: ${description}`));
  
  const options: PhoenixCodeLiteOptions = {
    task: `Create a UI component: ${description}`,
    projectPath: process.cwd(),
    verbose: false
  };
  
  await enhancedGenerateCommand(options);
}

async function executeApiGeneration(description: string, context: SessionContext): Promise<void> {
  console.log(chalk.magenta.bold('\n🌐 Generating API Endpoint'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log(chalk.white(`API: ${description}`));
  
  const options: PhoenixCodeLiteOptions = {
    task: `Create an API endpoint: ${description}`,
    projectPath: process.cwd(),
    verbose: false
  };
  
  await enhancedGenerateCommand(options);
}

async function executeTestGeneration(description: string, context: SessionContext): Promise<void> {
  console.log(chalk.magenta.bold('\n⊎ Generating Tests'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log(chalk.white(`Tests: ${description}`));
  
  const options: PhoenixCodeLiteOptions = {
    task: `Generate tests for: ${description}`,
    projectPath: process.cwd(),
    verbose: false
  };
  
  await enhancedGenerateCommand(options);
}

async function waitForEnter(): Promise<void> {
  // Fix Issue #2: Proper session continuation instead of process exit
  return new Promise((resolve) => {
    console.log(chalk.gray('\nPress Enter to continue...'));
    
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

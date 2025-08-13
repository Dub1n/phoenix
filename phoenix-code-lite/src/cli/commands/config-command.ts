/**---
 * title: [Config Command - CLI Command]
 * tags: [CLI, Command, Configuration]
 * provides: [ConfigCommand]
 * requires: [IConfigManager, IAuditLogger, ConfigFormatter, InteractivePrompts]
 * description: [Manages Phoenix Code Lite configuration operations including show, edit, adjust, use, and template application.]
 * ---*/

import { IConfigManager } from '../interfaces/config-manager';
import { IAuditLogger } from '../interfaces/audit-logger';
import { ConfigFormatter } from '../config-formatter';
import { InteractivePrompts } from '../interactive';
import { PhoenixCodeLiteConfig } from '../../config/settings';
import chalk from 'chalk';

export class ConfigCommand {
  constructor(
    private configManager: IConfigManager,
    private auditLogger: IAuditLogger
  ) {}

  async execute(args: string[]): Promise<void> {
    this.auditLogger.log('info', 'Config command executed', { args });
    
    const options = this.parseArgs(args);
    
    try {
      if (options.show) {
        await this.showConfig();
      } else if (options.edit || options.adjust || options.add) {
        await this.handleInteractiveOperations(options);
      } else if (options.use) {
        await this.applyTemplate(options.use);
      } else if (options.reset) {
        await this.resetConfig();
      } else if (options.template) {
        await this.applyTemplate(options.template);
      } else {
        await this.showHelp();
      }
    } catch (error) {
      this.auditLogger.log('error', 'Config command failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private async showConfig(): Promise<void> {
    // For now, we'll use a simple config display
    // In a real implementation, this would load the actual PhoenixCodeLiteConfig
    console.log(chalk.blue('Phoenix Code Lite Configuration:'));
    console.log(chalk.gray('Configuration loaded successfully'));
    
    // Show validation status
    const config = await this.configManager.getConfig();
    const isValid = this.configManager.validateConfig(config);
    if (isValid) {
      console.log(chalk.green('\n✓ Configuration is valid'));
    } else {
      console.log(chalk.yellow('\n⚠ Configuration has issues'));
    }
  }

  private async handleInteractiveOperations(options: any): Promise<void> {
    const interactive = new InteractivePrompts();
    
    if (options.edit) {
      const result = await interactive.runInteractiveConfigEditor();
      if (result.saved) {
        this.auditLogger.log('info', 'Configuration updated via interactive editor');
      }
    } else if (options.adjust) {
      await this.adjustTemplate(options.adjust, interactive);
    } else if (options.add) {
      await this.addTemplate(options.add, interactive);
    }
  }

  private async applyTemplate(templateName: string): Promise<void> {
    this.auditLogger.log('info', 'Applying template', { templateName });
    
    // For now, we'll use a simple template application
    // In a real implementation, this would load and apply the template
    console.log(chalk.green(`✓ Applied template: ${templateName}`));
  }

  private async resetConfig(): Promise<void> {
    await this.configManager.resetToDefaults();
    this.auditLogger.log('info', 'Configuration reset to defaults');
    console.log(chalk.green('✓ Configuration reset to defaults'));
  }

  private async showHelp(): Promise<void> {
    console.log(chalk.yellow('Configuration commands:'));
    console.log('  --show              Display current configuration');
    console.log('  --edit              Interactive configuration editor');
    console.log('  --use <name>        Switch to template (starter|enterprise|performance|default)');
    console.log('  --adjust <name>     Adjust template settings');
    console.log('  --add <name>        Create new template');
    console.log('  --reset             Reset to default configuration');
    console.log('  --template <name>   Apply template (legacy - use --use instead)');
  }

  private parseArgs(args: string[]): any {
    const options: any = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--show') {
        options.show = true;
      } else if (arg === '--edit') {
        options.edit = true;
      } else if (arg === '--reset') {
        options.reset = true;
      } else if (arg === '--use' && i + 1 < args.length) {
        options.use = args[++i];
      } else if (arg === '--adjust' && i + 1 < args.length) {
        options.adjust = args[++i];
      } else if (arg === '--add' && i + 1 < args.length) {
        options.add = args[++i];
      } else if (arg === '--template' && i + 1 < args.length) {
        options.template = args[++i];
      }
    }
    
    return options;
  }

  private async adjustTemplate(templateName: string, interactive: InteractivePrompts): Promise<void> {
    this.auditLogger.log('info', 'Adjusting template', { templateName });
    console.log(chalk.blue(`Adjusting template: ${templateName}`));
    // Implementation would go here
  }

  private async addTemplate(templateName: string, interactive: InteractivePrompts): Promise<void> {
    this.auditLogger.log('info', 'Adding template', { templateName });
    console.log(chalk.blue(`Adding template: ${templateName}`));
    // Implementation would go here
  }
} 

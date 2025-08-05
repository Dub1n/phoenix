import { IConfigManager } from '../interfaces/config-manager';
import { IAuditLogger } from '../interfaces/audit-logger';
import { IFileSystem } from '../interfaces/file-system';
import chalk from 'chalk';

export class InitCommand {
  constructor(
    private configManager: IConfigManager,
    private auditLogger: IAuditLogger,
    private fileSystem: IFileSystem
  ) {}

  async execute(args: string[]): Promise<void> {
    this.auditLogger.log('info', 'Init command executed', { args });
    
    console.log(chalk.blue('✦ Initializing Phoenix-Code-Lite...'));
    
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
      
      console.log(chalk.green('✓ Phoenix-Code-Lite initialized successfully!'));
      console.log(chalk.gray('You can now use: phoenix-code-lite generate <task>'));
      
    } catch (error) {
      this.auditLogger.log('error', 'Init command failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      console.error(chalk.red('Initialization error:'), error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async applyTemplate(templateName: string): Promise<void> {
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
        console.log(chalk.yellow('Unknown template. Using default configuration.'));
        console.log(chalk.gray('Available templates: starter, enterprise, performance'));
        return;
    }
    
    // Apply the template
    await this.configManager.updateConfig(template);
    console.log(chalk.green(`✓ Applied ${displayName} template`));
  }

  private async createProjectStructure(): Promise<void> {
    const directories = [
      '.phoenix-code-lite',
      '.phoenix-code-lite/audit',
      '.phoenix-code-lite/sessions',
      '.phoenix-code-lite/templates'
    ];
    
    for (const dir of directories) {
      await this.fileSystem.createDirectory(dir);
    }
    
    console.log(chalk.gray('✓ Created project directories'));
  }

  private async initializeConfigFile(): Promise<void> {
    const configPath = '.phoenix-code-lite/config.json';
    const config = await this.configManager.getConfig();
    
    await this.fileSystem.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.gray('✓ Created configuration file'));
  }

  private parseArgs(args: string[]): any {
    const options: any = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--template' && i + 1 < args.length) {
        options.template = args[++i];
      }
    }
    
    return options;
  }

  private getStarterTemplate() {
    return {
      system: {
        name: 'Phoenix Code Lite',
        version: '1.0.0',
        environment: 'development' as const,
        logLevel: 'info' as const
      },
      session: {
        maxConcurrentSessions: 2,
        sessionTimeoutMs: 1800000,
        persistentStorage: false,
        auditLogging: true
      },
      mode: {
        defaultMode: 'standalone' as const,
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

  private getEnterpriseTemplate() {
    return {
      system: {
        name: 'Phoenix Code Lite Enterprise',
        version: '1.0.0',
        environment: 'production' as const,
        logLevel: 'warn' as const
      },
      session: {
        maxConcurrentSessions: 10,
        sessionTimeoutMs: 7200000,
        persistentStorage: true,
        auditLogging: true
      },
      mode: {
        defaultMode: 'integrated' as const,
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

  private getPerformanceTemplate() {
    return {
      system: {
        name: 'Phoenix Code Lite Performance',
        version: '1.0.0',
        environment: 'production' as const,
        logLevel: 'error' as const
      },
      session: {
        maxConcurrentSessions: 5,
        sessionTimeoutMs: 3600000,
        persistentStorage: false,
        auditLogging: false
      },
      mode: {
        defaultMode: 'integrated' as const,
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
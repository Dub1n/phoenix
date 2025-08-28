/**---
 * title: [Templum Configuration Manager - Core Infrastructure Component]
 * tags: [Core, Infrastructure, Configuration, Validation, Interface-Orchestration]
 * provides: [ConfigManager Class, Template Loading, Hot Reloading, Validation, Interface Settings]
 * requires: [Zod, FS, TemplumConfigSchema, EventEmitter, Templum Error System]
 * description: [Manages Templum configuration with schema validation, interface orchestration settings, file persistence, hot reload, template management, and change notifications for universal interface coordination.]
 * ---*/

import { z } from 'zod';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { EventEmitter } from 'events';
import { 
  InterfaceType, 
  TemplumError, 
  isTemplumError, 
  createTemplumError,
  ErrorSignalPayload 
} from '../types/templum-types';

// Enhanced Templum Configuration Schema
export const TemplumConfigSchema = z.object({
  system: z.object({
    name: z.string().default('Templum Universal Interface Orchestrator'),
    version: z.string().default('1.0.0'),
    environment: z.enum(['development', 'production', 'test']).default('development'),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info')
  }),
  session: z.object({
    maxConcurrentSessions: z.number().min(1).max(20).default(10),
    sessionTimeoutMs: z.number().min(60000).default(3600000), // 1 hour
    persistentStorage: z.boolean().default(false),
    auditLogging: z.boolean().default(true)
  }),
  interfaces: z.object({
    vscode: z.object({
      enabled: z.boolean().default(true),
      autoActivate: z.boolean().default(true),
      webviewTimeout: z.number().min(1000).default(30000),
      extensionId: z.string().default('templum-vscode-extension')
    }),
    cli: z.object({
      enabled: z.boolean().default(true),
      interactiveMode: z.boolean().default(true),
      menuTimeout: z.number().min(1000).default(60000),
      historySize: z.number().min(10).default(100)
    }),
    command: z.object({
      enabled: z.boolean().default(true),
      directExecution: z.boolean().default(true),
      timeoutMs: z.number().min(1000).default(5000),
      maxRetries: z.number().min(0).default(3)
    }),
    universal: z.object({
      primaryInterface: z.enum(['vscode', 'cli', 'command']).default('vscode'),
      fallbackInterface: z.enum(['vscode', 'cli', 'command']).default('cli'),
      switchingTimeoutMs: z.number().min(100).default(1000)
    })
  }),
  orchestration: z.object({
    switchingTimeout: z.number().min(100).default(1000),
    coordinationMode: z.enum(['sequential', 'parallel', 'adaptive']).default('adaptive'),
    stateSync: z.object({
      enabled: z.boolean().default(true),
      intervalMs: z.number().min(1000).default(5000),
      conflictResolution: z.enum(['last-wins', 'interface-priority', 'user-prompt']).default('interface-priority')
    }),
    errorRecovery: z.object({
      enabled: z.boolean().default(true),
      maxRetries: z.number().min(0).default(3),
      fallbackToStandalone: z.boolean().default(true)
    })
  }),
  performance: z.object({
    maxMemoryUsage: z.number().min(100).default(500), // MB
    gcInterval: z.number().min(30000).default(300000), // 5 minutes
    metricsCollection: z.boolean().default(true),
    interfaceSwitchingMaxMs: z.number().min(50).default(100)
  }),
  backendDiscovery: z.object({
    enabled: z.boolean().default(true),
    interval: z.number().min(5000).default(30000),
    supportedBackends: z.array(z.enum(['pcl', 'litany', 'haruspex'])).default(['pcl']),
    autoConnect: z.boolean().default(true)
  })
});

export type TemplumConfig = z.infer<typeof TemplumConfigSchema>;

export const TemplumConfigTemplates = {
  basic: {
    system: {
      name: 'Templum Universal Interface Orchestrator',
      version: '1.0.0',
      environment: 'development' as const,
      logLevel: 'info' as const
    },
    session: {
      maxConcurrentSessions: 5,
      sessionTimeoutMs: 1800000, // 30 minutes
      persistentStorage: false,
      auditLogging: true
    },
    interfaces: {
      vscode: {
        enabled: true,
        autoActivate: true,
        webviewTimeout: 30000,
        extensionId: 'templum-vscode-extension'
      },
      cli: {
        enabled: true,
        interactiveMode: true,
        menuTimeout: 60000,
        historySize: 50
      },
      command: {
        enabled: false,
        directExecution: true,
        timeoutMs: 5000,
        maxRetries: 1
      },
      universal: {
        primaryInterface: 'vscode' as const,
        fallbackInterface: 'cli' as const,
        switchingTimeoutMs: 500
      }
    },
    orchestration: {
      switchingTimeout: 500,
      coordinationMode: 'sequential' as const,
      stateSync: {
        enabled: true,
        intervalMs: 10000,
        conflictResolution: 'last-wins' as const
      },
      errorRecovery: {
        enabled: true,
        maxRetries: 2,
        fallbackToStandalone: true
      }
    },
    performance: {
      maxMemoryUsage: 300,
      gcInterval: 300000,
      metricsCollection: false,
      interfaceSwitchingMaxMs: 100
    },
    backendDiscovery: {
      enabled: false,
      interval: 60000,
      supportedBackends: ['pcl'] as const,
      autoConnect: true
    }
  },
  
  development: {
    system: {
      name: 'Templum Development Environment',
      version: '1.0.0',
      environment: 'development' as const,
      logLevel: 'debug' as const
    },
    session: {
      maxConcurrentSessions: 10,
      sessionTimeoutMs: 3600000, // 1 hour
      persistentStorage: true,
      auditLogging: true
    },
    interfaces: {
      vscode: {
        enabled: true,
        autoActivate: true,
        webviewTimeout: 30000,
        extensionId: 'templum-vscode-dev'
      },
      cli: {
        enabled: true,
        interactiveMode: true,
        menuTimeout: 120000,
        historySize: 200
      },
      command: {
        enabled: true,
        directExecution: true,
        timeoutMs: 10000,
        maxRetries: 3
      },
      universal: {
        primaryInterface: 'vscode' as const,
        fallbackInterface: 'cli' as const,
        switchingTimeoutMs: 1000
      }
    },
    orchestration: {
      switchingTimeout: 1000,
      coordinationMode: 'adaptive' as const,
      stateSync: {
        enabled: true,
        intervalMs: 5000,
        conflictResolution: 'interface-priority' as const
      },
      errorRecovery: {
        enabled: true,
        maxRetries: 3,
        fallbackToStandalone: true
      }
    },
    performance: {
      maxMemoryUsage: 750,
      gcInterval: 300000,
      metricsCollection: true,
      interfaceSwitchingMaxMs: 100
    },
    backendDiscovery: {
      enabled: true,
      interval: 30000,
      supportedBackends: ['pcl', 'haruspex'] as const,
      autoConnect: true
    }
  },
  
  enterprise: {
    system: {
      name: 'Templum Enterprise Universal Interface',
      version: '1.0.0',
      environment: 'production' as const,
      logLevel: 'warn' as const
    },
    session: {
      maxConcurrentSessions: 20,
      sessionTimeoutMs: 7200000, // 2 hours
      persistentStorage: true,
      auditLogging: true
    },
    interfaces: {
      vscode: {
        enabled: true,
        autoActivate: true,
        webviewTimeout: 45000,
        extensionId: 'templum-vscode-enterprise'
      },
      cli: {
        enabled: true,
        interactiveMode: true,
        menuTimeout: 300000,
        historySize: 500
      },
      command: {
        enabled: true,
        directExecution: true,
        timeoutMs: 15000,
        maxRetries: 5
      },
      universal: {
        primaryInterface: 'vscode' as const,
        fallbackInterface: 'cli' as const,
        switchingTimeoutMs: 100
      }
    },
    orchestration: {
      switchingTimeout: 100,
      coordinationMode: 'parallel' as const,
      stateSync: {
        enabled: true,
        intervalMs: 3000,
        conflictResolution: 'interface-priority' as const
      },
      errorRecovery: {
        enabled: true,
        maxRetries: 5,
        fallbackToStandalone: false
      }
    },
    performance: {
      maxMemoryUsage: 1000,
      gcInterval: 180000,
      metricsCollection: true,
      interfaceSwitchingMaxMs: 50
    },
    backendDiscovery: {
      enabled: true,
      interval: 15000,
      supportedBackends: ['pcl', 'litany', 'haruspex'] as const,
      autoConnect: true
    }
  }
} as const;

export type TemplumConfigTemplate = keyof typeof TemplumConfigTemplates;

/**
 * Templum Configuration management with validation, persistence, and hot reloading
 * Adapted from PCL ConfigManager for interface orchestration needs
 */
export class TemplumConfigManager extends EventEmitter {
  private config: TemplumConfig;
  private configPath: string;
  private watchInterval?: NodeJS.Timeout;
  private lastModified?: Date;
  private callbacks: Map<string, (config: TemplumConfig) => void> = new Map();

  constructor(configPath?: string) {
    super();
    this.configPath = configPath || join(process.cwd(), '.templum', 'config.json');
    
    // Initialize with default values for all required fields
    this.config = {
      system: {
        name: 'Templum Universal Interface Orchestrator',
        version: '1.0.0',
        environment: 'development',
        logLevel: 'info'
      },
      session: {
        maxConcurrentSessions: 10,
        sessionTimeoutMs: 3600000,
        persistentStorage: false,
        auditLogging: true
      },
      interfaces: {
        vscode: {
          enabled: true,
          autoActivate: true,
          webviewTimeout: 30000,
          extensionId: 'templum-vscode-extension'
        },
        cli: {
          enabled: true,
          interactiveMode: true,
          menuTimeout: 60000,
          historySize: 100
        },
        command: {
          enabled: true,
          directExecution: true,
          timeoutMs: 5000,
          maxRetries: 3
        },
        universal: {
          primaryInterface: 'vscode',
          fallbackInterface: 'cli',
          switchingTimeoutMs: 1000
        }
      },
      orchestration: {
        switchingTimeout: 1000,
        coordinationMode: 'adaptive',
        stateSync: {
          enabled: true,
          intervalMs: 5000,
          conflictResolution: 'interface-priority'
        },
        errorRecovery: {
          enabled: true,
          maxRetries: 3,
          fallbackToStandalone: true
        }
      },
      performance: {
        maxMemoryUsage: 500,
        gcInterval: 300000,
        metricsCollection: true,
        interfaceSwitchingMaxMs: 100
      },
      backendDiscovery: {
        enabled: true,
        interval: 30000,
        supportedBackends: ['pcl'],
        autoConnect: true
      }
    };
  }

  /**
   * Initialize configuration manager
   */
  public async initialize(): Promise<boolean> {
    try {
      this.emit('templumConfigInit', {
        configPath: this.configPath,
        timestamp: Date.now()
      });

      // Try to load existing configuration
      const loaded = await this.loadFromFile();
      
      if (!loaded) {
        // Create default configuration
        await this.saveToFile();
        console.log('⋇ Created default Templum configuration file');
      } else {
        console.log('✓ Loaded existing Templum configuration');
      }

      // Setup file watching
      this.setupFileWatching();

      this.emit('templumConfigInitialized', {
        configPath: this.configPath,
        configTemplate: this.detectTemplate(),
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumConfigManager',
        error: createTemplumError(errorMessage, 'CONFIG_INIT_ERROR', 'configuration'),
        severity: 'high'
      };

      this.emit('templumConfigError', errorPayload);
      console.error('✗ Templum configuration manager initialization failed:', error);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): TemplumConfig {
    return { ...this.config };
  }

  /**
   * Update configuration with validation
   */
  public async updateConfig(updates: Partial<TemplumConfig>): Promise<boolean> {
    try {
      const previousConfig = { ...this.config };
      const updatedConfig = this.mergeConfigs(this.config, updates);
      
      // Validate updated configuration
      const validatedConfig = TemplumConfigSchema.parse(updatedConfig);
      
      this.config = validatedConfig;
      
      // Save to file
      await this.saveToFile();
      
      // Notify callbacks
      this.notifyCallbacks(validatedConfig);
      
      this.emit('templumConfigUpdated', {
        previousConfig: this.sanitizeConfig(previousConfig),
        updatedConfig: this.sanitizeConfig(validatedConfig),
        changes: this.getConfigChanges(previousConfig, validatedConfig),
        timestamp: Date.now()
      });

      console.log('✓ Templum configuration updated successfully');
      return true;
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumConfigManager',
        error: createTemplumError(errorMessage, 'CONFIG_UPDATE_ERROR', 'configuration'),
        severity: 'medium'
      };

      this.emit('templumConfigError', errorPayload);
      console.error('✗ Templum configuration update failed:', error);
      return false;
    }
  }

  /**
   * Load configuration template
   */
  public async loadTemplate(templateName: TemplumConfigTemplate): Promise<boolean> {
    try {
      const template = TemplumConfigTemplates[templateName];
      const updatedConfig = TemplumConfigSchema.parse(template);
      
      this.config = updatedConfig;
      await this.saveToFile();

      this.emit('templumTemplateLoaded', {
        templateName,
        config: this.sanitizeConfig(updatedConfig),
        timestamp: Date.now()
      });

      console.log(`⋇ Loaded ${templateName} Templum template`);
      return true;
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumConfigManager',
        error: createTemplumError(errorMessage, 'TEMPLATE_LOAD_ERROR', 'configuration'),
        severity: 'medium'
      };

      this.emit('templumConfigError', errorPayload);
      console.error(`✗ Failed to load ${templateName} Templum template:`, error);
      return false;
    }
  }

  /**
   * Get available templates
   */
  public getAvailableTemplates(): {
    name: TemplumConfigTemplate;
    description: string;
    suitableFor: string[];
  }[] {
    return [
      {
        name: 'basic',
        description: 'Basic configuration for simple interface orchestration',
        suitableFor: ['getting started', 'single-interface', 'lightweight usage']
      },
      {
        name: 'development',
        description: 'Full-featured configuration for development and testing',
        suitableFor: ['development', 'debugging', 'multi-interface testing']
      },
      {
        name: 'enterprise',
        description: 'High-performance configuration for production environments',
        suitableFor: ['production', 'high-load', 'enterprise deployment', 'full orchestration']
      }
    ];
  }

  /**
   * Get interface-specific configuration
   */
  public getInterfaceConfig(interfaceType: InterfaceType) {
    return this.config.interfaces[interfaceType];
  }

  /**
   * Get orchestration configuration
   */
  public getOrchestrationConfig() {
    return this.config.orchestration;
  }

  /**
   * Validate current configuration
   */
  public validateConfig(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      TemplumConfigSchema.parse(this.config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push('Unknown validation error');
      }
    }

    // Templum-specific validation logic
    if (this.config.session.maxConcurrentSessions > 15) {
      warnings.push('High concurrent session limit may impact interface orchestration performance');
    }

    if (this.config.performance.interfaceSwitchingMaxMs < 50) {
      warnings.push('Very low interface switching timeout may cause coordination issues');
    }

    if (this.config.orchestration.switchingTimeout < this.config.performance.interfaceSwitchingMaxMs) {
      warnings.push('Orchestration switching timeout is less than performance limit - may cause conflicts');
    }

    if (this.config.system.environment === 'production' && this.config.system.logLevel === 'debug') {
      warnings.push('Debug logging in production may impact performance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get configuration summary for interface orchestration
   */
  public getConfigSummary(): {
    template: string;
    primaryInterface: string;
    environment: string;
    features: {
      name: string;
      enabled: boolean;
      value?: any;
    }[];
    limits: {
      name: string;
      value: any;
      unit?: string;
    }[];
    interfaces: {
      type: string;
      enabled: boolean;
      primary: boolean;
    }[];
  } {
    return {
      template: this.detectTemplate(),
      primaryInterface: this.config.interfaces.universal.primaryInterface,
      environment: this.config.system.environment,
      features: [
        { name: 'Interface Orchestration', enabled: true },
        { name: 'State Synchronization', enabled: this.config.orchestration.stateSync.enabled },
        { name: 'Backend Discovery', enabled: this.config.backendDiscovery.enabled },
        { name: 'Session Management', enabled: true },
        { name: 'Error Recovery', enabled: this.config.orchestration.errorRecovery.enabled },
        { name: 'Performance Monitoring', enabled: this.config.performance.metricsCollection }
      ],
      limits: [
        { name: 'Max Concurrent Sessions', value: this.config.session.maxConcurrentSessions },
        { name: 'Session Timeout', value: this.config.session.sessionTimeoutMs / 1000 / 60, unit: 'minutes' },
        { name: 'Interface Switching Max Time', value: this.config.performance.interfaceSwitchingMaxMs, unit: 'ms' },
        { name: 'Max Memory Usage', value: this.config.performance.maxMemoryUsage, unit: 'MB' }
      ],
      interfaces: [
        { 
          type: 'vscode', 
          enabled: this.config.interfaces.vscode.enabled, 
          primary: this.config.interfaces.universal.primaryInterface === 'vscode' 
        },
        { 
          type: 'cli', 
          enabled: this.config.interfaces.cli.enabled, 
          primary: this.config.interfaces.universal.primaryInterface === 'cli' 
        },
        { 
          type: 'command', 
          enabled: this.config.interfaces.command.enabled, 
          primary: this.config.interfaces.universal.primaryInterface === 'command' 
        }
      ]
    };
  }

  /**
   * Register configuration change callback
   */
  public onConfigChange(id: string, callback: (config: TemplumConfig) => void): void {
    this.callbacks.set(id, callback);
  }

  /**
   * Unregister configuration change callback
   */
  public offConfigChange(id: string): void {
    this.callbacks.delete(id);
  }

  /**
   * Load configuration from file
   */
  private async loadFromFile(): Promise<boolean> {
    try {
      await fs.access(this.configPath);
      const content = await fs.readFile(this.configPath, 'utf-8');
      const configData = JSON.parse(content);
      
      // Validate and parse
      const parsedConfig = TemplumConfigSchema.parse(configData);
      this.config = parsedConfig;
      
      // Update last modified time
      const stats = await fs.stat(this.configPath);
      this.lastModified = stats.mtime;
      
      return true;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return false; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Save configuration to file
   */
  private async saveToFile(): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(dirname(this.configPath), { recursive: true });
    
    const content = JSON.stringify(this.config, null, 2);
    await fs.writeFile(this.configPath, content, 'utf-8');
    
    // Update last modified time
    const stats = await fs.stat(this.configPath);
    this.lastModified = stats.mtime;
  }

  /**
   * Setup file watching for hot reloading
   */
  private setupFileWatching(): void {
    this.watchInterval = setInterval(async () => {
      try {
        const stats = await fs.stat(this.configPath);
        
        if (this.lastModified && stats.mtime > this.lastModified) {
          console.log('⇔ Templum configuration file changed, reloading...');
          
          const reloaded = await this.loadFromFile();
          if (reloaded) {
            this.notifyCallbacks(this.config);
            
            this.emit('templumConfigHotReload', {
              timestamp: Date.now(),
              config: this.sanitizeConfig(this.config)
            });
            
            console.log('✓ Templum configuration reloaded');
          }
        }
      } catch (error) {
        // File might have been deleted, ignore
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Detect which template the current configuration matches
   */
  private detectTemplate(): string {
    const templates = Object.entries(TemplumConfigTemplates);
    
    for (const [name, template] of templates) {
      if (this.configMatches(this.config, template)) {
        return name;
      }
    }
    
    return 'custom';
  }

  /**
   * Check if configuration matches a template
   */
  private configMatches(config: TemplumConfig, template: any): boolean {
    // Simple deep comparison for key properties
    return (
      config.interfaces.universal.primaryInterface === template.interfaces.universal.primaryInterface &&
      config.system.environment === template.system.environment &&
      config.session.maxConcurrentSessions === template.session.maxConcurrentSessions
    );
  }

  /**
   * Merge configuration objects deeply
   */
  private mergeConfigs(base: TemplumConfig, updates: Partial<TemplumConfig>): TemplumConfig {
    const merged = { ...base };
    
    for (const [key, value] of Object.entries(updates)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key as keyof TemplumConfig] = {
          ...merged[key as keyof TemplumConfig] as any,
          ...value
        };
      } else {
        (merged as any)[key] = value;
      }
    }
    
    return merged;
  }

  /**
   * Get configuration changes between two configs
   */
  private getConfigChanges(oldConfig: TemplumConfig, newConfig: TemplumConfig): string[] {
    const changes: string[] = [];
    
    const checkSection = (section: string, oldSection: any, newSection: any) => {
      for (const key in newSection) {
        if (typeof newSection[key] === 'object' && newSection[key] !== null) {
          // Handle nested objects
          if (oldSection[key] && typeof oldSection[key] === 'object') {
            checkSection(`${section}.${key}`, oldSection[key], newSection[key]);
          }
        } else if (oldSection[key] !== newSection[key]) {
          changes.push(`${section}.${key}: ${oldSection[key]} -> ${newSection[key]}`);
        }
      }
    };
    
    checkSection('system', oldConfig.system, newConfig.system);
    checkSection('session', oldConfig.session, newConfig.session);
    checkSection('interfaces', oldConfig.interfaces, newConfig.interfaces);
    checkSection('orchestration', oldConfig.orchestration, newConfig.orchestration);
    checkSection('performance', oldConfig.performance, newConfig.performance);
    checkSection('backendDiscovery', oldConfig.backendDiscovery, newConfig.backendDiscovery);
    
    return changes;
  }

  /**
   * Sanitize configuration for logging (remove sensitive data)
   */
  private sanitizeConfig(config: TemplumConfig): any {
    // No sensitive data in current schema, but future-proofing
    return { ...config };
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks(config: TemplumConfig): void {
    for (const callback of Array.from(this.callbacks.values())) {
      try {
        callback(config);
      } catch (error) {
        console.error('Templum configuration callback error:', error);
      }
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }

    this.emit('templumConfigShutdown', {
      finalConfig: this.sanitizeConfig(this.config),
      timestamp: Date.now()
    });

    this.callbacks.clear();
  }
}
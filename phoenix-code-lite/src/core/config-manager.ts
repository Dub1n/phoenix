import { z } from 'zod';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { CoreConfig, CoreConfigSchema } from './foundation';
import { AuditLogger } from '../utils/audit-logger';

/**
 * Configuration templates for different use cases
 */
export const ConfigTemplates = {
  starter: {
    system: {
      name: 'Phoenix Code Lite',
      version: '1.0.0',
      environment: 'development' as const,
      logLevel: 'info' as const
    },
    session: {
      maxConcurrentSessions: 2,
      sessionTimeoutMs: 1800000, // 30 minutes
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
  },
  
  enterprise: {
    system: {
      name: 'Phoenix Code Lite Enterprise',
      version: '1.0.0',
      environment: 'production' as const,
      logLevel: 'warn' as const
    },
    session: {
      maxConcurrentSessions: 10,
      sessionTimeoutMs: 7200000, // 2 hours
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
  },
  
  performance: {
    system: {
      name: 'Phoenix Code Lite Performance',
      version: '1.0.0',
      environment: 'production' as const,
      logLevel: 'error' as const
    },
    session: {
      maxConcurrentSessions: 5,
      sessionTimeoutMs: 3600000, // 1 hour
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
  }
} as const;

export type ConfigTemplate = keyof typeof ConfigTemplates;

/**
 * Configuration management with validation, persistence, and hot reloading
 */
export class ConfigManager {
  private config: CoreConfig;
  private configPath: string;
  private auditLogger: AuditLogger;
  private watchInterval?: NodeJS.Timeout;
  private lastModified?: Date;
  private callbacks: Map<string, (config: CoreConfig) => void> = new Map();

  constructor(configPath?: string) {
    this.configPath = configPath || join(process.cwd(), '.phoenix-code-lite', 'config.json');
    this.auditLogger = new AuditLogger('config-manager');
    // Initialize with default values for all required fields
    this.config = {
      system: {
        name: 'Phoenix Code Lite',
        version: '1.0.0',
        environment: 'development',
        logLevel: 'info'
      },
      session: {
        maxConcurrentSessions: 3,
        sessionTimeoutMs: 3600000,
        persistentStorage: false,
        auditLogging: true
      },
      mode: {
        defaultMode: 'standalone',
        allowModeSwitching: true,
        autoDetectIntegration: true
      },
      performance: {
        maxMemoryUsage: 500,
        gcInterval: 300000,
        metricsCollection: true
      }
    };
  }

  /**
   * Initialize configuration manager
   */
  public async initialize(): Promise<boolean> {
    try {
      await this.auditLogger.logEvent('config_manager_init_start', {
        configPath: this.configPath,
        timestamp: new Date().toISOString()
      });

      // Try to load existing configuration
      const loaded = await this.loadFromFile();
      
      if (!loaded) {
        // Create default configuration
        await this.saveToFile();
        console.log('📝 Created default configuration file');
      } else {
        console.log('✅ Loaded existing configuration');
      }

      // Setup file watching
      this.setupFileWatching();

      await this.auditLogger.logEvent('config_manager_initialized', {
        configPath: this.configPath,
        configTemplate: this.detectTemplate(),
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      await this.auditLogger.logEvent('config_manager_init_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        configPath: this.configPath,
        timestamp: new Date().toISOString()
      });

      console.error('❌ Configuration manager initialization failed:', error);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): CoreConfig {
    return { ...this.config };
  }

  /**
   * Update configuration with validation
   */
  public async updateConfig(updates: Partial<CoreConfig>): Promise<boolean> {
    try {
      const previousConfig = { ...this.config };
      const updatedConfig = this.mergeConfigs(this.config, updates);
      
      // Validate updated configuration
      const validatedConfig = CoreConfigSchema.parse(updatedConfig);
      
      this.config = validatedConfig;
      
      // Save to file
      await this.saveToFile();
      
      // Notify callbacks
      this.notifyCallbacks(validatedConfig);
      
      await this.auditLogger.logEvent('config_updated', {
        previousConfig: this.sanitizeConfig(previousConfig),
        updatedConfig: this.sanitizeConfig(validatedConfig),
        changes: this.getConfigChanges(previousConfig, validatedConfig),
        timestamp: new Date().toISOString()
      });

      console.log('✅ Configuration updated successfully');
      return true;
    } catch (error) {
      await this.auditLogger.logEvent('config_update_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        updates,
        timestamp: new Date().toISOString()
      });

      console.error('❌ Configuration update failed:', error);
      return false;
    }
  }

  /**
   * Load configuration template
   */
  public async loadTemplate(templateName: ConfigTemplate): Promise<boolean> {
    try {
      const template = ConfigTemplates[templateName];
      const updatedConfig = CoreConfigSchema.parse(template);
      
      this.config = updatedConfig;
      await this.saveToFile();

      await this.auditLogger.logEvent('template_loaded', {
        templateName,
        config: this.sanitizeConfig(updatedConfig),
        timestamp: new Date().toISOString()
      });

      console.log(`📋 Loaded ${templateName} template`);
      return true;
    } catch (error) {
      await this.auditLogger.logEvent('template_load_failed', {
        templateName,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      console.error(`❌ Failed to load ${templateName} template:`, error);
      return false;
    }
  }

  /**
   * Get available templates
   */
  public getAvailableTemplates(): {
    name: ConfigTemplate;
    description: string;
    suitableFor: string[];
  }[] {
    return [
      {
        name: 'starter',
        description: 'Basic configuration for getting started',
        suitableFor: ['development', 'learning', 'small projects']
      },
      {
        name: 'enterprise',
        description: 'Full-featured configuration for production use',
        suitableFor: ['production', 'team environments', 'large projects']
      },
      {
        name: 'performance',
        description: 'Optimized configuration for maximum performance',
        suitableFor: ['performance-critical', 'resource-constrained', 'high-throughput']
      }
    ];
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
      CoreConfigSchema.parse(this.config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push('Unknown validation error');
      }
    }

    // Additional validation logic
    if (this.config.session.maxConcurrentSessions > 10) {
      warnings.push('High concurrent session limit may impact performance');
    }

    if (this.config.performance.maxMemoryUsage > 1000) {
      warnings.push('High memory limit may cause system instability');
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
   * Get configuration summary
   */
  public getConfigSummary(): {
    template: string;
    mode: string;
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
  } {
    return {
      template: this.detectTemplate(),
      mode: this.config.mode.defaultMode,
      environment: this.config.system.environment,
      features: [
        { name: 'Session Management', enabled: true },
        { name: 'Audit Logging', enabled: this.config.session.auditLogging },
        { name: 'Persistent Storage', enabled: this.config.session.persistentStorage },
        { name: 'Mode Switching', enabled: this.config.mode.allowModeSwitching },
        { name: 'Auto Integration Detection', enabled: this.config.mode.autoDetectIntegration },
        { name: 'Metrics Collection', enabled: this.config.performance.metricsCollection }
      ],
      limits: [
        { name: 'Max Concurrent Sessions', value: this.config.session.maxConcurrentSessions },
        { name: 'Session Timeout', value: this.config.session.sessionTimeoutMs / 1000 / 60, unit: 'minutes' },
        { name: 'Max Memory Usage', value: this.config.performance.maxMemoryUsage, unit: 'MB' },
        { name: 'GC Interval', value: this.config.performance.gcInterval / 1000, unit: 'seconds' }
      ]
    };
  }

  /**
   * Register configuration change callback
   */
  public onConfigChange(id: string, callback: (config: CoreConfig) => void): void {
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
      const parsedConfig = CoreConfigSchema.parse(configData);
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
          console.log('🔄 Configuration file changed, reloading...');
          
          const reloaded = await this.loadFromFile();
          if (reloaded) {
            this.notifyCallbacks(this.config);
            
            await this.auditLogger.logEvent('config_hot_reload', {
              timestamp: new Date().toISOString(),
              config: this.sanitizeConfig(this.config)
            });
            
            console.log('✅ Configuration reloaded');
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
    const templates = Object.entries(ConfigTemplates);
    
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
  private configMatches(config: CoreConfig, template: any): boolean {
    // Simple deep comparison for key properties
    return (
      config.mode.defaultMode === template.mode.defaultMode &&
      config.system.environment === template.system.environment &&
      config.session.maxConcurrentSessions === template.session.maxConcurrentSessions
    );
  }

  /**
   * Merge configuration objects deeply
   */
  private mergeConfigs(base: CoreConfig, updates: Partial<CoreConfig>): CoreConfig {
    const merged = { ...base };
    
    for (const [key, value] of Object.entries(updates)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key as keyof CoreConfig] = {
          ...merged[key as keyof CoreConfig] as any,
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
  private getConfigChanges(oldConfig: CoreConfig, newConfig: CoreConfig): string[] {
    const changes: string[] = [];
    
    const checkSection = (section: string, oldSection: any, newSection: any) => {
      for (const key in newSection) {
        if (oldSection[key] !== newSection[key]) {
          changes.push(`${section}.${key}: ${oldSection[key]} -> ${newSection[key]}`);
        }
      }
    };
    
    checkSection('system', oldConfig.system, newConfig.system);
    checkSection('session', oldConfig.session, newConfig.session);
    checkSection('mode', oldConfig.mode, newConfig.mode);
    checkSection('performance', oldConfig.performance, newConfig.performance);
    
    return changes;
  }

  /**
   * Sanitize configuration for logging (remove sensitive data)
   */
  private sanitizeConfig(config: CoreConfig): any {
    // No sensitive data in current schema, but future-proofing
    return { ...config };
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks(config: CoreConfig): void {
    for (const callback of this.callbacks.values()) {
      try {
        callback(config);
      } catch (error) {
        console.error('Configuration callback error:', error);
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

    await this.auditLogger.logEvent('config_manager_shutdown', {
      finalConfig: this.sanitizeConfig(this.config),
      timestamp: new Date().toISOString()
    });

    this.callbacks.clear();
  }
}
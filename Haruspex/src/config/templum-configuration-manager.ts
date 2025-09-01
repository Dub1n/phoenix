/**---
 * title: [Templum Configuration Manager - Dynamic Configuration System]
 * tags: [Configuration, Templum-Compatible, Dynamic-Config, Backend-Service]
 * provides: [Configuration-Management, Templum-Integration, Runtime-Updates]
 * requires: [HaruspexServiceConfig, FileSystem, Validation]
 * description: [Dynamic configuration management system for Templum 2.1 compatibility with persistence and validation]
 * ---*/

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { resolve, join } from 'path';
import { HaruspexServiceConfig } from '../api/types/api-contracts';

export interface TemplumConfigurationOptions {
  configPath?: string;
  autoSave?: boolean;
  validationEnabled?: boolean;
  backupEnabled?: boolean;
}

export interface TemplumServiceConfig {
  // Service identity for Templum discovery
  serviceId: string;
  serviceName: string;
  serviceVersion: string;
  
  // Templum integration settings
  templum: {
    discoveryEnabled: boolean;
    autoRegistration: boolean;
    heartbeatInterval: number;
    registrationPath: string;
    capabilities: string[];
  };
  
  // Runtime configuration
  runtime: {
    configUpdateEndpoint: boolean;
    hotReloadEnabled: boolean;
    persistConfig: boolean;
    configValidation: boolean;
  };
  
  // Extend base service config
  baseConfig: HaruspexServiceConfig;
}

export interface ConfigurationUpdateRequest {
  section: keyof TemplumServiceConfig;
  updates: Partial<TemplumServiceConfig[keyof TemplumServiceConfig]>;
  validate?: boolean;
  persist?: boolean;
}

export interface ConfigurationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  affectedServices: string[];
}

/**
 * Templum Configuration Manager
 * 
 * Provides dynamic configuration management with Templum 2.1 compatibility.
 * Extends the base HaruspexServiceConfig with Templum-specific capabilities:
 * - Dynamic configuration updates via HTTP endpoints
 * - Configuration persistence and validation
 * - Templum service discovery integration
 * - Hot reloading without service restart
 */
export class TemplumConfigurationManager extends EventEmitter {
  private config: TemplumServiceConfig;
  private configPath: string;
  private options: Required<TemplumConfigurationOptions>;
  private configHistory: TemplumServiceConfig[] = [];
  private maxHistorySize = 10;

  constructor(
    baseConfig: HaruspexServiceConfig,
    options: TemplumConfigurationOptions = {}
  ) {
    super();

    this.options = {
      configPath: options.configPath || join(process.cwd(), 'templum-config.json'),
      autoSave: options.autoSave ?? true,
      validationEnabled: options.validationEnabled ?? true,
      backupEnabled: options.backupEnabled ?? true
    };

    this.configPath = resolve(this.options.configPath);

    // Initialize Templum-compatible configuration
    this.config = this.createTemplumConfig(baseConfig);

    console.log(`TemplumConfigurationManager: Initialized with config at ${this.configPath}`);
  }

  /**
   * Create Templum-compatible configuration from base config
   */
  private createTemplumConfig(baseConfig: HaruspexServiceConfig): TemplumServiceConfig {
    return {
      serviceId: `haruspex-${Date.now()}`,
      serviceName: 'haruspex-analysis',
      serviceVersion: '2.1.0',
      
      templum: {
        discoveryEnabled: true,
        autoRegistration: true,
        heartbeatInterval: 30000,
        registrationPath: process.env.TEMPLUM_REGISTRATION_PATH || '~/.templum/services/',
        capabilities: ['code-analysis', 'prediction', 'diagnostics', 'health-monitoring']
      },
      
      runtime: {
        configUpdateEndpoint: true,
        hotReloadEnabled: true,
        persistConfig: true,
        configValidation: true
      },
      
      baseConfig
    };
  }

  /**
   * Load configuration from file system if it exists
   */
  async loadConfiguration(): Promise<void> {
    try {
      const configExists = await fs.access(this.configPath).then(() => true).catch(() => false);
      
      if (configExists) {
        const configData = await fs.readFile(this.configPath, 'utf-8');
        const savedConfig: TemplumServiceConfig = JSON.parse(configData);
        
        // Validate loaded configuration
        if (this.options.validationEnabled) {
          const validation = this.validateConfiguration(savedConfig);
          if (!validation.valid) {
            console.warn('TemplumConfigurationManager: Loaded config has validation errors:', validation.errors);
            this.emit('configurationValidationFailed', validation);
          }
        }
        
        // Merge with current config to ensure all properties exist
        this.config = {
          ...this.config,
          ...savedConfig,
          baseConfig: {
            ...this.config.baseConfig,
            ...savedConfig.baseConfig
          }
        };
        
        console.log('TemplumConfigurationManager: Configuration loaded successfully');
        this.emit('configurationLoaded', this.config);
      } else {
        console.log('TemplumConfigurationManager: No existing config found, using defaults');
        // Save default configuration
        if (this.options.autoSave) {
          await this.saveConfiguration();
        }
      }
    } catch (error) {
      console.error('TemplumConfigurationManager: Failed to load configuration:', error);
      this.emit('configurationError', { type: 'load', error });
      throw error;
    }
  }

  /**
   * Save configuration to file system
   */
  async saveConfiguration(): Promise<void> {
    try {
      // Create backup if enabled
      if (this.options.backupEnabled) {
        await this.createConfigBackup();
      }
      
      // Save current configuration
      const configData = JSON.stringify(this.config, null, 2);
      await fs.writeFile(this.configPath, configData, 'utf-8');
      
      console.log('TemplumConfigurationManager: Configuration saved successfully');
      this.emit('configurationSaved', this.config);
    } catch (error) {
      console.error('TemplumConfigurationManager: Failed to save configuration:', error);
      this.emit('configurationError', { type: 'save', error });
      throw error;
    }
  }

  /**
   * Update configuration section
   */
  async updateConfiguration(updateRequest: ConfigurationUpdateRequest): Promise<ConfigurationValidationResult> {
    const previousConfig = JSON.parse(JSON.stringify(this.config));
    
    try {
      // Apply updates
      if (updateRequest.section === 'baseConfig') {
        this.config.baseConfig = {
          ...this.config.baseConfig,
          ...updateRequest.updates as Partial<HaruspexServiceConfig>
        };
      } else {
        const currentSection = this.config[updateRequest.section];
        const updates = updateRequest.updates as any;
        
        // Ensure both currentSection and updates are objects before spreading
        if (currentSection && typeof currentSection === 'object' && updates && typeof updates === 'object') {
          (this.config[updateRequest.section] as any) = {
            ...currentSection,
            ...updates
          };
        } else {
          // Direct assignment if spreading is not safe
          (this.config[updateRequest.section] as any) = updates;
        }
      }
      
      // Validate if requested
      let validation: ConfigurationValidationResult = { valid: true, errors: [], warnings: [], affectedServices: [] };
      if (updateRequest.validate !== false && this.options.validationEnabled) {
        validation = this.validateConfiguration(this.config);
        
        if (!validation.valid) {
          // Revert on validation failure
          this.config = previousConfig;
          console.warn('TemplumConfigurationManager: Configuration update failed validation, reverted');
          this.emit('configurationValidationFailed', validation);
          return validation;
        }
      }
      
      // Add to history
      this.addToHistory(previousConfig);
      
      // Persist if requested
      if (updateRequest.persist !== false && this.options.autoSave) {
        await this.saveConfiguration();
      }
      
      console.log(`TemplumConfigurationManager: Updated configuration section: ${updateRequest.section}`);
      this.emit('configurationUpdated', {
        section: updateRequest.section,
        previousConfig,
        currentConfig: this.config,
        validation
      });
      
      return validation;
      
    } catch (error) {
      // Revert on error
      this.config = previousConfig;
      console.error('TemplumConfigurationManager: Configuration update failed:', error);
      this.emit('configurationError', { type: 'update', error });
      throw error;
    }
  }

  /**
   * Validate configuration
   */
  validateConfiguration(config: TemplumServiceConfig): ConfigurationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const affectedServices: string[] = [];

    // Validate service identity
    if (!config.serviceId || config.serviceId.trim() === '') {
      errors.push('serviceId is required');
    }
    if (!config.serviceName || config.serviceName.trim() === '') {
      errors.push('serviceName is required');
    }
    if (!config.serviceVersion || !config.serviceVersion.match(/^\d+\.\d+\.\d+$/)) {
      errors.push('serviceVersion must be in semantic version format (x.y.z)');
    }

    // Validate Templum settings
    if (config.templum.heartbeatInterval < 5000) {
      warnings.push('heartbeatInterval below 5 seconds may cause performance issues');
    }
    if (config.templum.heartbeatInterval > 120000) {
      warnings.push('heartbeatInterval above 2 minutes may cause discovery timeouts');
    }

    // Validate capabilities
    if (config.templum.capabilities.length === 0) {
      warnings.push('No capabilities defined - service may not be discoverable');
    }

    // Validate base configuration
    if (!config.baseConfig.api) {
      errors.push('baseConfig.api is required');
    } else {
      // Validate API ports
      const ports = [
        config.baseConfig.api.http.port,
        config.baseConfig.api.websocket.port,
        config.baseConfig.api.ipc.port
      ];
      const uniquePorts = new Set(ports);
      if (uniquePorts.size !== ports.length) {
        errors.push('API ports must be unique');
      }
      
      // Validate port ranges
      for (const port of ports) {
        if (port < 1024 || port > 65535) {
          warnings.push(`Port ${port} outside recommended range (1024-65535)`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      affectedServices: ['haruspex-analysis'] // This service
    };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): TemplumServiceConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Get base service configuration for compatibility
   */
  getBaseConfiguration(): HaruspexServiceConfig {
    return JSON.parse(JSON.stringify(this.config.baseConfig));
  }

  /**
   * Get configuration for Templum service discovery
   */
  getTemplumServiceDefinition() {
    return {
      id: this.config.serviceId,
      name: this.config.serviceName,
      version: this.config.serviceVersion,
      endpoint: `http://localhost:${this.config.baseConfig.api.http.port}`,
      capabilities: this.config.templum.capabilities,
      status: 'active',
      lastHeartbeat: Date.now(),
      discoveryEnabled: this.config.templum.discoveryEnabled,
      autoRegistration: this.config.templum.autoRegistration
    };
  }

  /**
   * Create configuration backup
   */
  private async createConfigBackup(): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = this.configPath.replace('.json', `.backup.${timestamp}.json`);
      
      const configExists = await fs.access(this.configPath).then(() => true).catch(() => false);
      if (configExists) {
        await fs.copyFile(this.configPath, backupPath);
        console.log(`TemplumConfigurationManager: Config backup created: ${backupPath}`);
      }
    } catch (error) {
      console.warn('TemplumConfigurationManager: Failed to create backup:', error);
    }
  }

  /**
   * Add configuration to history
   */
  private addToHistory(config: TemplumServiceConfig): void {
    this.configHistory.unshift(JSON.parse(JSON.stringify(config)));
    
    // Maintain history size limit
    if (this.configHistory.length > this.maxHistorySize) {
      this.configHistory = this.configHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get configuration history
   */
  getConfigurationHistory(): TemplumServiceConfig[] {
    return this.configHistory.map(config => JSON.parse(JSON.stringify(config)));
  }

  /**
   * Revert to previous configuration
   */
  async revertConfiguration(historyIndex: number = 0): Promise<void> {
    if (historyIndex >= this.configHistory.length) {
      throw new Error(`History index ${historyIndex} out of range`);
    }
    
    const previousConfig = this.configHistory[historyIndex];
    const currentConfig = JSON.parse(JSON.stringify(this.config));
    
    this.config = JSON.parse(JSON.stringify(previousConfig));
    
    if (this.options.autoSave) {
      await this.saveConfiguration();
    }
    
    console.log(`TemplumConfigurationManager: Reverted to configuration from history index ${historyIndex}`);
    this.emit('configurationReverted', {
      revertedConfig: this.config,
      previousConfig: currentConfig,
      historyIndex
    });
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.removeAllListeners();
    this.configHistory = [];
    console.log('TemplumConfigurationManager: Disposed');
  }
}
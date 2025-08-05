import { IConfigManager } from '../interfaces/config-manager';
import { ConfigManager } from '../../core/config-manager';
import { CoreConfig } from '../../core/foundation';

export class ConfigManagerAdapter implements IConfigManager {
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  async getConfig(): Promise<CoreConfig> {
    return this.configManager.getConfig();
  }

  async updateConfig(config: Partial<CoreConfig>): Promise<void> {
    await this.configManager.updateConfig(config);
  }

  validateConfig(config: CoreConfig): boolean {
    const validation = this.configManager.validateConfig();
    return validation.valid;
  }

  async resetToDefaults(): Promise<void> {
    // For now, we'll create a new config with defaults
    // In a real implementation, this would reset to the actual defaults
    const defaultConfig = {
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
    
    await this.configManager.updateConfig(defaultConfig);
  }
} 
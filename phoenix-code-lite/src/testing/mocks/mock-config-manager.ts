/**---
 * title: [Mock Config Manager - Testing Double]
 * tags: [Testing, Mocks]
 * provides: [MockConfigManager]
 * requires: []
 * description: [Mock implementation of IConfigManager for unit and integration tests.]
 * ---*/

import { IConfigManager } from '../../cli/interfaces/config-manager';
import { CoreConfig } from '../../core/foundation';

function createDefaultConfig(): CoreConfig {
  return {
    system: {
      name: 'Phoenix Code Lite',
      version: '1.0.0',
      environment: 'development',
      logLevel: 'info'
    },
    session: {
      maxConcurrentSessions: 2,
      sessionTimeoutMs: 1800000,
      persistentStorage: false,
      auditLogging: true
    },
    mode: {
      defaultMode: 'standalone',
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

export class MockConfigManager implements IConfigManager {
  private config: CoreConfig = createDefaultConfig();
  private calls: Array<{method: string, args: any[]}> = [];

  async getConfig(): Promise<CoreConfig> {
    this.calls.push({method: 'getConfig', args: []});
    return this.config;
  }

  async updateConfig(config: Partial<CoreConfig>): Promise<void> {
    this.calls.push({method: 'updateConfig', args: [config]});
    this.config = { ...this.config, ...config };
  }

  validateConfig(config: CoreConfig): boolean {
    this.calls.push({method: 'validateConfig', args: [config]});
    return true; // Mock validation always passes
  }

  async resetToDefaults(): Promise<void> {
    this.calls.push({method: 'resetToDefaults', args: []});
    this.config = createDefaultConfig();
  }

  getCallHistory() {
    return this.calls;
  }

  setConfig(config: CoreConfig) {
    this.config = config;
  }

  clearCallHistory() {
    this.calls = [];
  }
} 

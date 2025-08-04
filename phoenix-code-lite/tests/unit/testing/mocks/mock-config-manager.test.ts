import { MockConfigManager } from '../../../../src/testing/mocks/mock-config-manager';
import { CoreConfig } from '../../../../src/core/foundation';

describe('MockConfigManager', () => {
  let mockConfigManager: MockConfigManager;

  beforeEach(() => {
    mockConfigManager = new MockConfigManager();
  });

  test('should implement IConfigManager interface', () => {
    expect(mockConfigManager.getConfig).toBeDefined();
    expect(mockConfigManager.updateConfig).toBeDefined();
    expect(mockConfigManager.validateConfig).toBeDefined();
    expect(mockConfigManager.resetToDefaults).toBeDefined();
  });

  test('should return default config on getConfig', async () => {
    const config = await mockConfigManager.getConfig();
    expect(config.system.name).toBe('Phoenix Code Lite');
    expect(config.system.version).toBe('1.0.0');
  });

  test('should update config correctly', async () => {
    const update = { 
      system: { 
        name: 'Updated Name',
        version: '1.0.0',
        environment: 'development' as const,
        logLevel: 'info' as const
      } 
    };
    await mockConfigManager.updateConfig(update);
    
    const config = await mockConfigManager.getConfig();
    expect(config.system.name).toBe('Updated Name');
  });

  test('should track call history', async () => {
    await mockConfigManager.getConfig();
    await mockConfigManager.updateConfig({ 
      system: { 
        name: 'Test',
        version: '1.0.0',
        environment: 'development' as const,
        logLevel: 'info' as const
      } 
    });
    
    const callHistory = mockConfigManager.getCallHistory();
    expect(callHistory).toHaveLength(2);
    expect(callHistory[0].method).toBe('getConfig');
    expect(callHistory[1].method).toBe('updateConfig');
  });

  test('should validate config (mock always returns true)', () => {
    const testConfig: CoreConfig = {
      system: { name: 'Test', version: '1.0', environment: 'test', logLevel: 'info' },
      session: { maxConcurrentSessions: 1, sessionTimeoutMs: 1000, persistentStorage: false, auditLogging: true },
      mode: { defaultMode: 'standalone', allowModeSwitching: true, autoDetectIntegration: true },
      performance: { maxMemoryUsage: 100, gcInterval: 1000, metricsCollection: true }
    };
    
    const isValid = mockConfigManager.validateConfig(testConfig);
    expect(isValid).toBe(true);
  });

  test('should reset to defaults', async () => {
    // First update config
    await mockConfigManager.updateConfig({ 
      system: { 
        name: 'Updated',
        version: '1.0.0',
        environment: 'development' as const,
        logLevel: 'info' as const
      } 
    });
    let config = await mockConfigManager.getConfig();
    expect(config.system.name).toBe('Updated');
    
    // Then reset
    await mockConfigManager.resetToDefaults();
    config = await mockConfigManager.getConfig();
    expect(config.system.name).toBe('Phoenix Code Lite');
  });
}); 
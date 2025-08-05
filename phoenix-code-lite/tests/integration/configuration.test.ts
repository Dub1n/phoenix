// tests/integration/configuration.test.ts
import { PhoenixCodeLiteConfig, PhoenixCodeLiteConfigSchema } from '../../src/config/settings';
import { ConfigurationTemplates } from '../../src/config/templates';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Phase 5: Configuration Management', () => {
  const testConfigPath = path.join(__dirname, 'test-config.json');
  
  afterEach(async () => {
    try {
      await fs.unlink(testConfigPath);
    } catch {
      // File may not exist
    }
  });
  
  describe('Configuration Schema Validation', () => {
    test('PhoenixCodeLiteConfigSchema validates valid configuration', () => {
      const validConfig = {
        version: '1.0.0',
        claude: {
          maxTurns: 3,
          timeout: 300000,
          retryAttempts: 3
        },
        tdd: {
          maxImplementationAttempts: 5,
          testQualityThreshold: 0.8,
          enableRefactoring: true,
          skipDocumentation: false
        }
      };
      
      expect(() => PhoenixCodeLiteConfigSchema.parse(validConfig)).not.toThrow();
    });
    
    test('Schema rejects invalid configuration values', () => {
      const invalidConfig = {
        claude: {
          maxTurns: 15, // Should be max 10
          timeout: -1, // Should be positive
        }
      };
      
      expect(() => PhoenixCodeLiteConfigSchema.parse(invalidConfig)).toThrow();
    });
  });
  
  describe('Configuration Class', () => {
    test('Can create default configuration', () => {
      const config = PhoenixCodeLiteConfig.getDefault(testConfigPath);
      expect(config).toBeInstanceOf(PhoenixCodeLiteConfig);
    });
    
    test('Can save and load configuration', async () => {
      const config = PhoenixCodeLiteConfig.getDefault(testConfigPath);
      await config.save();
      
      const loadedConfig = await PhoenixCodeLiteConfig.load(path.dirname(testConfigPath));
      expect(loadedConfig.get('version')).toBe('1.0.0');
    });
    
    test('Can get and set nested values', () => {
      const config = PhoenixCodeLiteConfig.getDefault();
      
      config.set('claude.maxTurns', 5);
      expect(config.get('claude.maxTurns')).toBe(5);
      
      expect(config.get('tdd.enableRefactoring')).toBe(true);
    });
    
    test('Validates configuration when setting values', () => {
      // Test that setting invalid values throws
      expect(() => {
        const config = PhoenixCodeLiteConfig.getDefault();
        config.set('claude.maxTurns', 15);
      }).toThrow(); // Max is 10
      
      expect(() => {
        const config = PhoenixCodeLiteConfig.getDefault();
        config.set('claude.timeout', -1);
      }).toThrow(); // Must be positive
      
      // Verify that valid values can be set
      const config = PhoenixCodeLiteConfig.getDefault();
      expect(() => config.set('claude.maxTurns', 5)).not.toThrow();
      expect(config.get('claude.maxTurns')).toBe(5);
    });
  });
  
  describe('Configuration Templates', () => {
    test('Starter template has appropriate settings', () => {
      const template = ConfigurationTemplates.getStarterTemplate();
      
      expect(template.claude?.maxTurns).toBe(2);
      expect(template.tdd?.testQualityThreshold).toBe(0.7);
      expect(template.quality?.minTestCoverage).toBe(0.7);
    });
    
    test('Enterprise template has strict settings', () => {
      const template = ConfigurationTemplates.getEnterpriseTemplate();
      
      expect(template.claude?.maxTurns).toBe(5);
      expect(template.tdd?.testQualityThreshold).toBe(0.9);
      expect(template.quality?.minTestCoverage).toBe(0.9);
      expect(template.quality?.enforceStrictMode).toBe(true);
    });
    
    test('Performance template optimizes for speed', () => {
      const template = ConfigurationTemplates.getPerformanceTemplate();
      
      expect(template.claude?.maxTurns).toBe(2);
      expect(template.tdd?.enableRefactoring).toBe(false);
      expect(template.tdd?.skipDocumentation).toBe(true);
    });
  });
  
  describe('Agent Configuration', () => {
    test('Can configure individual agents', () => {
      const config = PhoenixCodeLiteConfig.getDefault();
      
      const planningConfig = config.getAgentConfig('planningAnalyst');
      expect(planningConfig.enabled).toBe(true);
      
      expect(config.isAgentEnabled('implementationEngineer')).toBe(true);
    });
    
    test('Can disable agent specialization', () => {
      const config = PhoenixCodeLiteConfig.getDefault();
      
      // First verify it starts enabled
      expect(config.isAgentEnabled('planningAnalyst')).toBe(true);
      
      // Disable specialization
      config.set('agents.enableSpecialization', false);
      
      // Should now be disabled
      expect(config.isAgentEnabled('planningAnalyst')).toBe(false);
    });
  });
});
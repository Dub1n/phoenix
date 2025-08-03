import { PhoenixCodeLiteConfigData } from './settings';

export interface TemplateMetadata {
  name: string;
  displayName: string;
  description: string;
  category: 'starter' | 'production' | 'performance' | 'custom';
  features: string[];
  testCoverage: number;
  qualityLevel: 'basic' | 'standard' | 'strict';
  recommended: boolean;
}

export class ConfigurationTemplates {
  static getStarterTemplate(): Partial<PhoenixCodeLiteConfigData> {
    return {
      claude: {
        maxTurns: 2,
        timeout: 180000, // 3 minutes
        retryAttempts: 2,
        model: 'claude-3-5-sonnet-20241022',
      },
      tdd: {
        maxImplementationAttempts: 3,
        testQualityThreshold: 0.7,
        enableRefactoring: true,
        skipDocumentation: false,
        qualityGates: {
          enabled: true,
          strictMode: false,
          thresholds: {
            syntaxValidation: 1.0,
            testCoverage: 0.7,
            codeQuality: 0.6,
            documentation: 0.5,
          },
          weights: {
            syntaxValidation: 1.0,
            testCoverage: 0.8,
            codeQuality: 0.6,
            documentation: 0.4,
          },
        },
      },
      agents: {
        enableSpecialization: true,
        fallbackToGeneric: true,
        planningAnalyst: { enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 },
        implementationEngineer: { enabled: true, priority: 0.9, timeout: 30000, retryAttempts: 2 },
        qualityReviewer: { enabled: true, priority: 0.7, timeout: 30000, retryAttempts: 2 },
      },
      quality: {
        minTestCoverage: 0.7,
        maxComplexity: 15,
        requireDocumentation: false,
        enforceStrictMode: false,
      },
    };
  }
  
  static getEnterpriseTemplate(): Partial<PhoenixCodeLiteConfigData> {
    return {
      claude: {
        maxTurns: 5,
        timeout: 600000, // 10 minutes
        retryAttempts: 3,
        model: 'claude-3-5-sonnet-20241022',
      },
      tdd: {
        maxImplementationAttempts: 5,
        testQualityThreshold: 0.9,
        enableRefactoring: true,
        skipDocumentation: false,
        qualityGates: {
          enabled: true,
          strictMode: true,
          thresholds: {
            syntaxValidation: 1.0,
            testCoverage: 0.9,
            codeQuality: 0.8,
            documentation: 0.8,
          },
          weights: {
            syntaxValidation: 1.0,
            testCoverage: 0.9,
            codeQuality: 0.8,
            documentation: 0.7,
          },
        },
      },
      agents: {
        enableSpecialization: true,
        fallbackToGeneric: false,
        planningAnalyst: { enabled: true, priority: 0.95, timeout: 60000, retryAttempts: 3 },
        implementationEngineer: { enabled: true, priority: 0.95, timeout: 120000, retryAttempts: 3 },
        qualityReviewer: { enabled: true, priority: 0.95, timeout: 90000, retryAttempts: 3 },
      },
      quality: {
        minTestCoverage: 0.9,
        maxComplexity: 8,
        requireDocumentation: true,
        enforceStrictMode: true,
      },
    };
  }
  
  static getPerformanceTemplate(): Partial<PhoenixCodeLiteConfigData> {
    return {
      claude: {
        maxTurns: 2,
        timeout: 120000, // 2 minutes
        retryAttempts: 2,
        model: 'claude-3-5-sonnet-20241022',
      },
      tdd: {
        maxImplementationAttempts: 3,
        testQualityThreshold: 0.8,
        enableRefactoring: false, // Skip for speed
        skipDocumentation: true, // Skip for speed
        qualityGates: {
          enabled: true,
          strictMode: false,
          thresholds: {
            syntaxValidation: 1.0,
            testCoverage: 0.6,
            codeQuality: 0.5,
            documentation: 0.0, // Skip documentation
          },
          weights: {
            syntaxValidation: 1.0,
            testCoverage: 0.6,
            codeQuality: 0.4,
            documentation: 0.0,
          },
        },
      },
      agents: {
        enableSpecialization: false, // Use generic for speed
        fallbackToGeneric: true,
        planningAnalyst: { enabled: false, priority: 0.5, timeout: 15000, retryAttempts: 1 },
        implementationEngineer: { enabled: false, priority: 0.5, timeout: 15000, retryAttempts: 1 },
        qualityReviewer: { enabled: false, priority: 0.5, timeout: 15000, retryAttempts: 1 },
      },
      quality: {
        minTestCoverage: 0.6,
        maxComplexity: 20,
        requireDocumentation: false,
        enforceStrictMode: false,
      },
      output: {
        verbose: false,
        showMetrics: false,
        saveArtifacts: false,
        logLevel: 'warn' as const,
      },
    };
  }

  static getTemplateList(): TemplateMetadata[] {
    return [
      {
        name: 'starter',
        displayName: 'Starter Template',
        description: 'Perfect for learning and experimentation',
        category: 'starter',
        features: ['Basic validation', 'Essential quality gates', 'Balanced performance'],
        testCoverage: 0.7,
        qualityLevel: 'basic',
        recommended: true,
      },
      {
        name: 'enterprise',
        displayName: 'Enterprise Template',
        description: 'Production-ready with comprehensive validation',
        category: 'production',
        features: ['Strict quality gates', 'Full documentation', 'Maximum reliability'],
        testCoverage: 0.9,
        qualityLevel: 'strict',
        recommended: false,
      },
      {
        name: 'performance',
        displayName: 'Performance Template',
        description: 'Speed-optimized for rapid iteration',
        category: 'performance',
        features: ['Minimal overhead', 'Fast execution', 'Essential validation only'],
        testCoverage: 0.6,
        qualityLevel: 'basic',
        recommended: false,
      },
    ];
  }

  static getTemplateByName(name: string): Partial<PhoenixCodeLiteConfigData> | null {
    switch (name.toLowerCase()) {
      case 'starter':
        return this.getStarterTemplate();
      case 'enterprise':
        return this.getEnterpriseTemplate();
      case 'performance':
        return this.getPerformanceTemplate();
      default:
        return null;
    }
  }

  static getTemplateMetadata(name: string): TemplateMetadata | null {
    const templates = this.getTemplateList();
    return templates.find(t => t.name === name.toLowerCase()) || null;
  }

  static validateTemplate(template: Partial<PhoenixCodeLiteConfigData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (template.claude) {
      if (template.claude.maxTurns && (template.claude.maxTurns < 1 || template.claude.maxTurns > 10)) {
        errors.push('Claude maxTurns must be between 1 and 10');
      }
      if (template.claude.timeout && (template.claude.timeout < 30000 || template.claude.timeout > 1800000)) {
        errors.push('Claude timeout must be between 30,000 and 1,800,000 ms');
      }
    }

    if (template.quality) {
      if (template.quality.minTestCoverage && (template.quality.minTestCoverage < 0 || template.quality.minTestCoverage > 1)) {
        errors.push('Minimum test coverage must be between 0 and 1');
      }
      if (template.quality.maxComplexity && (template.quality.maxComplexity < 1 || template.quality.maxComplexity > 50)) {
        errors.push('Maximum complexity must be between 1 and 50');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  static createCustomTemplate(
    name: string,
    baseTemplate: string,
    customizations: Partial<PhoenixCodeLiteConfigData>
  ): { template: Partial<PhoenixCodeLiteConfigData>; metadata: TemplateMetadata } | null {
    const base = this.getTemplateByName(baseTemplate);
    if (!base) return null;

    const template = this.mergeTemplates(base, customizations);
    const validation = this.validateTemplate(template);
    
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    const metadata: TemplateMetadata = {
      name: name.toLowerCase(),
      displayName: name,
      description: `Custom template based on ${baseTemplate}`,
      category: 'custom',
      features: ['Custom configuration', 'User-defined settings'],
      testCoverage: template.quality?.minTestCoverage || 0.8,
      qualityLevel: template.quality?.enforceStrictMode ? 'strict' : 'standard',
      recommended: false,
    };

    return { template, metadata };
  }

  static mergeTemplates(
    base: Partial<PhoenixCodeLiteConfigData>,
    override: Partial<PhoenixCodeLiteConfigData>
  ): Partial<PhoenixCodeLiteConfigData> {
    const merged = { ...base };
    
    Object.keys(override).forEach(key => {
      const overrideValue = override[key as keyof PhoenixCodeLiteConfigData];
      const baseValue = merged[key as keyof PhoenixCodeLiteConfigData];
      
      if (overrideValue && typeof overrideValue === 'object' && !Array.isArray(overrideValue) && baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)) {
        (merged as any)[key] = {
          ...baseValue,
          ...overrideValue
        };
      } else {
        (merged as any)[key] = overrideValue;
      }
    });
    
    return merged;
  }

  static exportTemplate(
    name: string,
    template: Partial<PhoenixCodeLiteConfigData>,
    metadata: TemplateMetadata
  ): string {
    const exportData = {
      metadata,
      template,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  static importTemplate(jsonData: string): { template: Partial<PhoenixCodeLiteConfigData>; metadata: TemplateMetadata } {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.template || !data.metadata) {
        throw new Error('Invalid template format: missing template or metadata');
      }
      
      const validation = this.validateTemplate(data.template);
      if (!validation.valid) {
        throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
      }
      
      return {
        template: data.template,
        metadata: data.metadata,
      };
    } catch (error) {
      throw new Error(`Failed to import template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
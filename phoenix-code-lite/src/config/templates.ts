import { PhoenixCodeLiteConfigData } from './settings';

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
      output: {
        verbose: false,
        showMetrics: false,
        saveArtifacts: false,
        logLevel: 'warn' as const,
      },
    };
  }
}
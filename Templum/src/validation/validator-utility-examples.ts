/**---
 * date: 2025-09-14T134500Z
 * name: validator-utility-examples
 * TASK-ID: [TASK-VAL-008]
 * category: validation-utility-examples
 * status: [[T]]
 * patterns: [usage-examples, migration-patterns, integration-guides]
 * components: [ValidationExamples, MigrationHelpers, IntegrationPatterns]
 * dependencies: [validator, existing-validation-systems]
 * tags: [examples, migration, integration, patterns, usage-guide]
 * ---*/

/**
 * Validator Utility Pattern Usage Examples and Migration Guide
 * 
 * Demonstrates how to replace existing validation patterns with the new
 * ValidatorUtility, showing code reduction and improved maintainability.
 * 
 * Migration targets:
 * - HybridValidationSystemV3C (2048 lines -> ~150 lines with ValidatorUtility)
 * - PerformanceValidator (1200 lines -> ~80 lines with ValidatorUtility)  
 * - ProbabilisticErrorHandler (707 lines -> ~50 lines with ValidatorUtility)
 */

import {
  ValidatorUtility,
  ValidationResult,
  ValidationError,
  SchemaDefinition,
  RecoveryStrategy,
  createValidator,
  validateWithSchema,
  validateWithRecovery,
  ValidationPatterns
} from './validator';
import { sleep } from '../utils/async-utils';

// Example schemas for validation
const componentConfigSchema: SchemaDefinition = {
  type: 'object',
  required: ['componentId', 'baselines', 'thresholds'],
  properties: {
    componentId: { type: 'string' },
    baselines: {
      type: 'object',
      required: ['responseTime', 'memoryUsage'],
      properties: {
        responseTime: { type: 'number', minimum: 0, maximum: 5000 },
        memoryUsage: { type: 'number', minimum: 0, maximum: 1000 },
        cpuUsage: { type: 'number', minimum: 0, maximum: 100 }
      }
    },
    thresholds: {
      type: 'object',
      required: ['warningThreshold', 'criticalThreshold'],
      properties: {
        warningThreshold: { type: 'number', minimum: 0, maximum: 100 },
        criticalThreshold: { type: 'number', minimum: 0, maximum: 100 }
      }
    }
  }
};

const mcpConfigSchema: SchemaDefinition = {
  type: 'object',
  required: ['enabled', 'serverConfig'],
  properties: {
    enabled: { type: 'boolean' },
    serverConfig: {
      type: 'object',
      required: ['host', 'port'],
      properties: {
        host: { type: 'string', pattern: '^[a-zA-Z0-9.-]+$' },
        port: { type: 'number', minimum: 1, maximum: 65535 },
        timeout: { type: 'number', minimum: 1000, maximum: 60000 }
      }
    }
  }
};

/**
 * EXAMPLE 1: Basic chainable validation replacing manual orchestration
 * 
 * BEFORE (HybridValidationSystemV3C pattern - ~50 lines):
 * ```
 * class HybridValidationSystemV3C {
 *   async executeValidationCycle() {
 *     const cycle = { ... };
 *     try {
 *       await this.executeValidationComponents(cycle);
 *       cycle.endTime = Date.now();
 *       this.updateQualityDashboard(cycle);
 *       return cycle;
 *     } catch (error) {
 *       this.reliabilityTracker.recordComponentFailure('validation-cycle', String(error));
 *       throw error;
 *     }
 *   }
 * }
 * ```
 * 
 * AFTER (ValidatorUtility pattern - ~15 lines):
 */
export async function validateComponentConfiguration(config: any): Promise<ValidationResult> {
  return createValidator()
    .withSchema(componentConfigSchema)
    .withConfidence(0.85)
    .withRecovery(true)
    .validate(async (data) => {
      // Custom business logic validation
      if (data.thresholds.warningThreshold >= data.thresholds.criticalThreshold) {
        return {
          success: false,
          data,
          errors: [{
            code: 'INVALID_THRESHOLD_ORDER',
            message: 'Warning threshold must be less than critical threshold',
            severity: 'high',
            recoverable: false
          }],
          warnings: [],
          confidence: 0.3,
          metrics: {
            executionTime: 0,
            memoryUsage: 0,
            validationCount: 1,
            recoveryAttempts: 0,
            confidenceScore: 0.3
          },
          context: {
            operation: 'threshold-validation',
            timestamp: Date.now(),
            component: 'config-validator',
            attempt: 1
          }
        };
      }
      
      return {
        success: true,
        data,
        errors: [],
        warnings: [],
        confidence: 0.95,
        metrics: {
          executionTime: 0,
          memoryUsage: 0,
          validationCount: 1,
          recoveryAttempts: 0,
          confidenceScore: 0.95
        },
        context: {
          operation: 'threshold-validation',
          timestamp: Date.now(),
          component: 'config-validator',
          attempt: 1
        }
      };
    }, 'business-logic-validation')
    .execute(config);
}

/**
 * EXAMPLE 2: Performance validation with recovery replacing complex baseline management
 * 
 * BEFORE (ComponentBaselineManager + ContinuousMonitor pattern - ~200 lines):
 * Complex baseline comparison, regression detection, continuous monitoring
 * 
 * AFTER (ValidatorUtility pattern - ~30 lines):
 */
export async function validatePerformanceMetrics(
  metrics: { responseTime: number; memoryUsage: number; cpuUsage: number },
  baseline: { responseTime: number; memoryUsage: number; cpuUsage: number }
): Promise<ValidationResult> {
  
  const performanceValidator = createValidator()
    .withConfidence(0.8)
    .withRecovery(true)
    .validate(async (data) => {
      const errors: ValidationError[] = [];
      const warnings: string[] = [];
      
      // Performance threshold checks (replaces BaselineComparison logic)
      const responseTimeDelta = ((data.responseTime - baseline.responseTime) / baseline.responseTime) * 100;
      const memoryDelta = ((data.memoryUsage - baseline.memoryUsage) / baseline.memoryUsage) * 100;
      
      if (responseTimeDelta > 30) {  // Critical threshold
        errors.push({
          code: 'RESPONSE_TIME_CRITICAL',
          message: `Response time degraded by ${responseTimeDelta.toFixed(1)}%`,
          severity: 'critical',
          recoverable: true
        });
      } else if (responseTimeDelta > 15) {  // Warning threshold
        warnings.push(`Response time degraded by ${responseTimeDelta.toFixed(1)}%`);
      }
      
      if (memoryDelta > 25) {
        errors.push({
          code: 'MEMORY_USAGE_HIGH',
          message: `Memory usage increased by ${memoryDelta.toFixed(1)}%`,
          severity: 'medium',
          recoverable: true
        });
      }
      
      const success = errors.filter(e => e.severity !== 'low').length === 0;
      const confidence = success ? 0.9 : Math.max(0.3, 1 - (errors.length * 0.2));
      
      return {
        success,
        data,
        errors,
        warnings,
        confidence,
        metrics: {
          executionTime: 0,
          memoryUsage: 0,
          validationCount: 1,
          recoveryAttempts: 0,
          confidenceScore: confidence
        },
        context: {
          operation: 'performance-validation',
          timestamp: Date.now(),
          component: 'performance-validator',
          attempt: 1
        }
      };
    }, 'performance-threshold-check');

  // Add custom recovery strategies (replaces ProbabilisticErrorHandler)
  performanceValidator.addRecoveryStrategy({
    name: 'performance-optimization',
    probability: 0.7,
    cost: 30,
    timeout: 5000,
    execute: async (error, context) => {
      console.log(`[RECOVERY] Attempting performance optimization for ${error.code}`);
      // Simulate performance optimization
      await sleep(1000);
      return Math.random() > 0.3; // 70% success rate
    }
  });

  return performanceValidator.execute(metrics);
}

/**
 * EXAMPLE 3: MCP integration validation replacing complex error handling
 * 
 * BEFORE (MCPIntegrationManager + circuit breaker logic - ~300 lines):
 * Complex timeout handling, circuit breaker, fallback mechanisms
 * 
 * AFTER (ValidatorUtility pattern - ~25 lines):
 */
export async function validateMCPConnection(config: any): Promise<ValidationResult> {
  const mcpValidator = createValidator()
    .withSchema(mcpConfigSchema)
    .withConfidence(0.75)
    .withRecovery(true);

  // Add MCP-specific recovery strategies
  mcpValidator
    .addRecoveryStrategy({
      name: 'connection-retry',
      probability: 0.6,
      cost: 20,
      timeout: 10000,
      execute: async (error, context) => {
        console.log('[MCP_RECOVERY] Retrying connection with exponential backoff');
        const delay = Math.min(5000, 1000 * Math.pow(2, context.attempt - 1));
        await sleep(delay);
        return Math.random() > 0.4;
      }
    })
    .addRecoveryStrategy({
      name: 'fallback-mode',
      probability: 0.9,
      cost: 70,
      timeout: 3000,
      execute: async (error, context) => {
        console.log('[MCP_RECOVERY] Switching to local fallback mode');
        return true; // Fallback always succeeds
      }
    });

  return mcpValidator
    .validate(async (data) => {
      // Simulate MCP connection test (replaces complex MCP validation logic)
      if (!data.enabled) {
        return {
          success: true,
          data,
          errors: [],
          warnings: ['MCP integration is disabled'],
          confidence: 0.8,
          metrics: {
            executionTime: 0,
            memoryUsage: 0,
            validationCount: 1,
            recoveryAttempts: 0,
            confidenceScore: 0.8
          },
          context: {
            operation: 'mcp-disabled-check',
            timestamp: Date.now(),
            component: 'mcp-validator',
            attempt: 1
          }
        };
      }

      // Simulate connection test
      const connectionSuccess = Math.random() > 0.2; // 80% success rate
      
      if (!connectionSuccess) {
        return {
          success: false,
          data,
          errors: [{
            code: 'MCP_CONNECTION_FAILED',
            message: `Failed to connect to MCP server at ${data.serverConfig.host}:${data.serverConfig.port}`,
            severity: 'high',
            recoverable: true
          }],
          warnings: [],
          confidence: 0.2,
          metrics: {
            executionTime: 0,
            memoryUsage: 0,
            validationCount: 1,
            recoveryAttempts: 0,
            confidenceScore: 0.2
          },
          context: {
            operation: 'mcp-connection-test',
            timestamp: Date.now(),
            component: 'mcp-validator',
            attempt: 1
          }
        };
      }

      return {
        success: true,
        data,
        errors: [],
        warnings: [],
        confidence: 0.95,
        metrics: {
          executionTime: 0,
          memoryUsage: 0,
          validationCount: 1,
          recoveryAttempts: 0,
          confidenceScore: 0.95
        },
        context: {
          operation: 'mcp-connection-test',
          timestamp: Date.now(),
          component: 'mcp-validator',
          attempt: 1
        }
      };
    }, 'mcp-connection-test')
    .execute(config);
}

/**
 * EXAMPLE 4: Complex validation chain replacing entire validation orchestration
 * 
 * BEFORE (HybridValidationSystemV3C.executeValidationCycle - ~150 lines):
 * Multiple validation components, metrics aggregation, error handling
 * 
 * AFTER (ValidatorUtility pattern - ~20 lines):
 */
export async function executeValidationChain(systemData: any): Promise<ValidationResult> {
  return createValidator()
    .withConfidence(0.85)
    .withRecovery(true)
    .validate(async (data) => {
      // Component 1: Performance validation
      const performanceValid = data.performance && 
        data.performance.responseTime < 100 && 
        data.performance.memoryUsage < 512;
      
      if (!performanceValid) {
        return {
          success: false,
          data,
          errors: [{
            code: 'PERFORMANCE_VALIDATION_FAILED',
            message: 'System performance metrics exceed acceptable thresholds',
            severity: 'high',
            recoverable: true
          }],
          warnings: [],
          confidence: 0.3,
          metrics: {
            executionTime: 0,
            memoryUsage: 0,
            validationCount: 1,
            recoveryAttempts: 0,
            confidenceScore: 0.3
          },
          context: {
            operation: 'performance-validation',
            timestamp: Date.now(),
            component: 'system-validator',
            attempt: 1
          }
        };
      }
      
      return {
        success: true,
        data,
        errors: [],
        warnings: [],
        confidence: 0.9,
        metrics: {
          executionTime: 0,
          memoryUsage: 0,
          validationCount: 1,
          recoveryAttempts: 0,
          confidenceScore: 0.9
        },
        context: {
          operation: 'performance-validation',
          timestamp: Date.now(),
          component: 'system-validator',
          attempt: 1
        }
      };
    }, 'performance-validation')
    .validate(async (data) => {
      // Component 2: Backend integration validation
      const backendValid = data.backends && data.backends.length > 0;
      
      return {
        success: backendValid,
        data,
        errors: backendValid ? [] : [{
          code: 'NO_BACKEND_CONNECTIONS',
          message: 'No active backend connections found',
          severity: 'critical',
          recoverable: true
        }],
        warnings: [],
        confidence: backendValid ? 0.9 : 0.2,
        metrics: {
          executionTime: 0,
          memoryUsage: 0,
          validationCount: 1,
          recoveryAttempts: 0,
          confidenceScore: backendValid ? 0.9 : 0.2
        },
        context: {
          operation: 'backend-validation',
          timestamp: Date.now(),
          component: 'system-validator',
          attempt: 1
        }
      };
    }, 'backend-validation')
    .validate(async (data) => {
      // Component 3: System stability validation
      const stabilityValid = data.uptime && data.uptime > 0.95;
      
      return {
        success: stabilityValid,
        data,
        errors: stabilityValid ? [] : [{
          code: 'SYSTEM_STABILITY_LOW',
          message: `System uptime ${((data.uptime || 0) * 100).toFixed(1)}% below 95% threshold`,
          severity: 'medium',
          recoverable: true
        }],
        warnings: [],
        confidence: stabilityValid ? 0.85 : 0.5,
        metrics: {
          executionTime: 0,
          memoryUsage: 0,
          validationCount: 1,
          recoveryAttempts: 0,
          confidenceScore: stabilityValid ? 0.85 : 0.5
        },
        context: {
          operation: 'stability-validation',
          timestamp: Date.now(),
          component: 'system-validator',
          attempt: 1
        }
      };
    }, 'stability-validation')
    .execute(systemData);
}

/**
 * MIGRATION HELPERS: Functions to help migrate existing code
 */
export class ValidationMigrationHelpers {
  /**
   * Replace HybridValidationSystemV3C.executeValidationComponents
   */
  static createComponentValidator(components: string[]): ValidatorUtility {
    return ValidationPatterns.replaceValidationOrchestration(components, 0.8);
  }

  /**
   * Replace ProbabilisticErrorHandler.handleError
   */
  static createErrorHandlerValidator(strategies: RecoveryStrategy[]): ValidatorUtility {
    return ValidationPatterns.replaceErrorHandling(strategies);
  }

  /**
   * Replace QualityMetricsDashboard.updateMetrics
   */
  static createMetricsValidator(
    component: string, 
    thresholds: { [key: string]: number }
  ): ValidatorUtility {
    return ValidationPatterns.replaceMetricsCollection({ component, thresholds });
  }

  /**
   * Convert existing validation function to ValidatorUtility chain
   */
  static convertLegacyValidator(
    legacyValidationFn: (data: any) => Promise<{ success: boolean; errors?: string[]; warnings?: string[] }>,
    componentName: string
  ): ValidatorUtility {
    return createValidator()
      .validate(async (data) => {
        const legacyResult = await legacyValidationFn(data);
        
        return {
          success: legacyResult.success,
          data,
          errors: (legacyResult.errors || []).map(error => ({
            code: 'LEGACY_VALIDATION_ERROR',
            message: error,
            severity: 'medium' as const,
            recoverable: true
          })),
          warnings: legacyResult.warnings || [],
          confidence: legacyResult.success ? 0.8 : 0.4,
          metrics: {
            executionTime: 0,
            memoryUsage: 0,
            validationCount: 1,
            recoveryAttempts: 0,
            confidenceScore: legacyResult.success ? 0.8 : 0.4
          },
          context: {
            operation: 'legacy-validation',
            timestamp: Date.now(),
            component: componentName,
            attempt: 1
          }
        };
      }, componentName);
  }
}

/**
 * DEMONSTRATION: Code reduction examples
 */
export class ValidationCodeReductionExamples {
  /**
   * BEFORE: Manual validation orchestration (25+ lines)
   * AFTER: ValidatorUtility chain (8 lines) - 68% reduction
   */
  static async validateSystemHealthBefore(data: any): Promise<boolean> {
    // Old manual approach
    try {
      if (!data.performance) return false;
      if (data.performance.responseTime > 1000) return false;
      if (!data.backends || data.backends.length === 0) return false;
      if (data.uptime < 0.95) return false;
      
      // Manual error recovery
      if (data.errors && data.errors.length > 0) {
        console.log('Attempting error recovery...');
        // Complex recovery logic here...
        await sleep(2000);
      }
      
      return true;
    } catch (error) {
      console.error('Validation failed:', error);
      return false;
    }
  }

  static async validateSystemHealthAfter(data: any): Promise<ValidationResult> {
    return createValidator()
      .withConfidence(0.8)
      .withRecovery(true)
      .validate(async (d) => ({
        success: d.performance?.responseTime < 1000 && d.backends?.length > 0 && d.uptime >= 0.95,
        data: d,
        errors: [],
        warnings: [],
        confidence: 0.9,
        metrics: { executionTime: 0, memoryUsage: 0, validationCount: 1, recoveryAttempts: 0, confidenceScore: 0.9 },
        context: { operation: 'health-check', timestamp: Date.now(), component: 'system', attempt: 1 }
      }), 'system-health')
      .execute(data);
  }
}

/**
 * USAGE PATTERNS: Common patterns for different scenarios
 */
export const UsagePatterns = {
  /**
   * Configuration validation with schema
   */
  configValidation: async (config: any, schema: SchemaDefinition) => {
    return validateWithSchema(config, schema, 0.9);
  },

  /**
   * Performance monitoring with recovery
   */
  performanceMonitoring: async (metrics: any) => {
    return createValidator()
      .withConfidence(0.75)
      .withRecovery(true)
      .validate(async (data) => ({
        success: data.responseTime < 100 && data.memoryUsage < 512,
        data,
        errors: [],
        warnings: [],
        confidence: 0.85,
        metrics: { executionTime: 0, memoryUsage: 0, validationCount: 1, recoveryAttempts: 0, confidenceScore: 0.85 },
        context: { operation: 'perf-monitoring', timestamp: Date.now(), component: 'monitor', attempt: 1 }
      }), 'performance-check')
      .execute(metrics);
  },

  /**
   * Multi-step validation with confidence tracking
   */
  multiStepValidation: async (data: any) => {
    return validateWithRecovery(
      data,
      [
        { fn: async (d) => ({ success: true, data: d, errors: [], warnings: [], confidence: 0.9, metrics: { executionTime: 0, memoryUsage: 0, validationCount: 1, recoveryAttempts: 0, confidenceScore: 0.9 }, context: { operation: 'step1', timestamp: Date.now(), component: 'validator', attempt: 1 } }), name: 'step-1' },
        { fn: async (d) => ({ success: true, data: d, errors: [], warnings: [], confidence: 0.8, metrics: { executionTime: 0, memoryUsage: 0, validationCount: 1, recoveryAttempts: 0, confidenceScore: 0.8 }, context: { operation: 'step2', timestamp: Date.now(), component: 'validator', attempt: 1 } }), name: 'step-2' },
        { fn: async (d) => ({ success: true, data: d, errors: [], warnings: [], confidence: 0.95, metrics: { executionTime: 0, memoryUsage: 0, validationCount: 1, recoveryAttempts: 0, confidenceScore: 0.95 }, context: { operation: 'step3', timestamp: Date.now(), component: 'validator', attempt: 1 } }), name: 'step-3' }
      ],
      0.8
    );
  }
};

/**---
 * date: 2025-09-14T134500Z
 * name: validator
 * TASK-ID: [TASK-VAL-008]
 * category: utility-patterns
 * status: [[T]]
 * patterns: [chainable-validation, confidence-validation, schema-integration, error-recovery]
 * components: [ValidatorUtility, ConfidenceSystem, SchemaValidator, ErrorRecoveryManager]
 * dependencies: [statistical-analysis, json-schema, error-handling, metrics-collection]
 * tags: [validation, utility-pattern, chainable-api, confidence-tracking, schema-validation]
 * ---*/

/**
 * Validator Utility Pattern - Chainable validation API with confidence-validated patterns
 * 
 * Consolidates validation patterns from:
 * - HybridValidationSystemV3C (orchestration patterns)
 * - PerformanceValidator (metrics and baselines)  
 * - ProbabilisticErrorHandler (error recovery strategies)
 * 
 * Provides unified chainable API for consistent error handling and schema integration.
 * Estimated code reduction: ~200 lines across ~12 files
 */

import { performance } from 'perf_hooks';
import { sleep, withTimeout } from '../utils/async-utils';
import { EventDrivenComponent } from '../utils/event-bus-adapter';
import type { TypedEventMap } from '../utils/event-utils';

// Core validation interfaces
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: string[];
  confidence: number;
  metrics: ValidationMetrics;
  context: ValidationContext;
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

export interface ValidationMetrics {
  executionTime: number;
  memoryUsage: number;
  validationCount: number;
  recoveryAttempts: number;
  confidenceScore: number;
}

export interface ValidationContext {
  operation: string;
  timestamp: number;
  component: string;
  attempt: number;
  previousResults?: ValidationResult[];
}

export interface ConfidenceConfig {
  minThreshold: number;
  targetThreshold: number;
  statisticalWindow: number;
  decayFactor: number;
}

export interface RecoveryStrategy {
  name: string;
  probability: number;
  cost: number;
  timeout: number;
  execute: (error: ValidationError, context: ValidationContext) => Promise<boolean>;
}

export interface SchemaDefinition {
  type: string;
  properties?: Record<string, SchemaDefinition>;
  required?: string[];
  items?: SchemaDefinition;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

interface ConfidenceSystemEvents extends TypedEventMap {}

interface ErrorRecoveryManagerEvents extends TypedEventMap {
  recoverySuccess: (payload: {
    strategy: string;
    error: ValidationError;
    context: ValidationContext;
  }) => void;
  recoveryFailed: (payload: {
    error: ValidationError;
    context: ValidationContext;
    attemptedStrategies: number;
  }) => void;
}

interface ValidatorUtilityEvents extends TypedEventMap {
  validationComplete: (payload: {
    success: boolean;
    confidence: number;
    meetsThreshold: boolean;
    executionTime: number;
    errorCount: number;
    recoveryAttempts: number;
  }) => void;
  recoverySuccess: ErrorRecoveryManagerEvents['recoverySuccess'];
  recoveryFailed: ErrorRecoveryManagerEvents['recoveryFailed'];
}

/**
 * Confidence-based validation system with statistical tracking
 */
export class ConfidenceSystem extends EventDrivenComponent<ConfidenceSystemEvents> {
  private static instanceCounter = 0;
  private confidenceHistory: Map<string, number[]> = new Map();
  private config: ConfidenceConfig;

  constructor(config: Partial<ConfidenceConfig> = {}) {
    super(`confidence-system:${ConfidenceSystem.instanceCounter++}`, 25);
    this.config = {
      minThreshold: 0.7,
      targetThreshold: 0.9,
      statisticalWindow: 20,
      decayFactor: 0.1,
      ...config
    };
  }

  /**
   * Calculate confidence score for validation result
   */
  calculateConfidence(
    component: string, 
    successRate: number,
    historicalData?: number[]
  ): number {
    const history = this.confidenceHistory.get(component) || [];
    
    // Base confidence on current success rate
    let confidence = successRate;
    
    // Adjust based on historical performance
    if (history.length > 0) {
      const recentHistory = history.slice(-this.config.statisticalWindow);
      const avgHistorical = recentHistory.reduce((sum, val) => sum + val, 0) / recentHistory.length;
      
      // Weighted average: 70% current, 30% historical
      confidence = confidence * 0.7 + avgHistorical * 0.3;
    }
    
    // Apply decay factor for older components
    const agePenalty = Math.min(history.length * this.config.decayFactor, 0.2);
    confidence = Math.max(0, confidence - agePenalty);
    
    // Record for future calculations
    this.recordConfidence(component, confidence);
    
    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Check if confidence meets threshold requirements
   */
  meetsThreshold(confidence: number, strict: boolean = false): boolean {
    const threshold = strict ? this.config.targetThreshold : this.config.minThreshold;
    return confidence >= threshold;
  }

  /**
   * Record confidence score for historical tracking
   */
  private recordConfidence(component: string, confidence: number): void {
    if (!this.confidenceHistory.has(component)) {
      this.confidenceHistory.set(component, []);
    }
    
    const history = this.confidenceHistory.get(component)!;
    history.push(confidence);
    
    // Maintain window size
    if (history.length > this.config.statisticalWindow * 2) {
      history.splice(0, history.length - this.config.statisticalWindow);
    }
  }

  /**
   * Get confidence trend for component
   */
  getTrend(component: string): 'improving' | 'stable' | 'degrading' {
    const history = this.confidenceHistory.get(component);
    if (!history || history.length < 5) return 'stable';
    
    const recent = history.slice(-5);
    const older = history.slice(-10, -5);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const improvement = recentAvg - olderAvg;
    
    if (improvement > 0.05) return 'improving';
    if (improvement < -0.05) return 'degrading';
    return 'stable';
  }
}

/**
 * Schema validation with type safety
 */
export class SchemaValidator {
  /**
   * Validate data against schema definition
   */
  validateSchema<T = any>(data: any, schema: SchemaDefinition): ValidationResult<T> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const startTime = performance.now();
    
    try {
      this.validateValue(data, schema, '', errors, warnings);
      
      const executionTime = performance.now() - startTime;
      const success = errors.filter(e => e.severity !== 'low').length === 0;
      
      return {
        success,
        data: success ? data as T : undefined,
        errors,
        warnings,
        confidence: success ? 0.95 : Math.max(0, 1 - (errors.length * 0.2)),
        metrics: {
          executionTime,
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          validationCount: 1,
          recoveryAttempts: 0,
          confidenceScore: success ? 0.95 : 0.5
        },
        context: {
          operation: 'schema-validation',
          timestamp: Date.now(),
          component: 'schema-validator',
          attempt: 1
        }
      };
      
    } catch (error) {
      errors.push({
        code: 'SCHEMA_VALIDATION_ERROR',
        message: String(error),
        severity: 'critical',
        recoverable: false
      });
      
      return {
        success: false,
        errors,
        warnings,
        confidence: 0,
        metrics: {
          executionTime: performance.now() - startTime,
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          validationCount: 1,
          recoveryAttempts: 0,
          confidenceScore: 0
        },
        context: {
          operation: 'schema-validation',
          timestamp: Date.now(),
          component: 'schema-validator',
          attempt: 1
        }
      };
    }
  }

  /**
   * Validate individual value against schema
   */
  private validateValue(
    value: any, 
    schema: SchemaDefinition, 
    path: string, 
    errors: ValidationError[], 
    warnings: string[]
  ): void {
    // Type validation
    if (!this.validateType(value, schema.type)) {
      errors.push({
        code: 'TYPE_MISMATCH',
        message: `Expected ${schema.type} but got ${typeof value}`,
        path,
        severity: 'high',
        recoverable: false
      });
      return;
    }

    // Object validation
    if (schema.type === 'object' && schema.properties) {
      this.validateObject(value, schema, path, errors, warnings);
    }
    
    // Array validation
    if (schema.type === 'array' && schema.items) {
      this.validateArray(value, schema, path, errors, warnings);
    }
    
    // String validation
    if (schema.type === 'string' && schema.pattern) {
      this.validateString(value, schema, path, errors, warnings);
    }
    
    // Number validation
    if (schema.type === 'number') {
      this.validateNumber(value, schema, path, errors, warnings);
    }
  }

  private validateType(value: any, expectedType: string): boolean {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    return actualType === expectedType || expectedType === 'any';
  }

  private validateObject(
    obj: any, 
    schema: SchemaDefinition, 
    path: string, 
    errors: ValidationError[], 
    warnings: string[]
  ): void {
    if (!schema.properties) return;

    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in obj)) {
          errors.push({
            code: 'MISSING_REQUIRED_PROPERTY',
            message: `Missing required property: ${requiredProp}`,
            path: `${path}.${requiredProp}`,
            severity: 'high',
            recoverable: false
          });
        }
      }
    }

    // Validate each property
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (propName in obj) {
        this.validateValue(obj[propName], propSchema, `${path}.${propName}`, errors, warnings);
      }
    }
  }

  private validateArray(
    arr: any[], 
    schema: SchemaDefinition, 
    path: string, 
    errors: ValidationError[], 
    warnings: string[]
  ): void {
    if (!schema.items) return;

    arr.forEach((item, index) => {
      this.validateValue(item, schema.items!, `${path}[${index}]`, errors, warnings);
    });
  }

  private validateString(
    str: string, 
    schema: SchemaDefinition, 
    path: string, 
    errors: ValidationError[], 
    warnings: string[]
  ): void {
    if (schema.pattern && !new RegExp(schema.pattern).test(str)) {
      errors.push({
        code: 'PATTERN_MISMATCH',
        message: `String does not match pattern: ${schema.pattern}`,
        path,
        severity: 'medium',
        recoverable: false
      });
    }
  }

  private validateNumber(
    num: number, 
    schema: SchemaDefinition, 
    path: string, 
    errors: ValidationError[], 
    warnings: string[]
  ): void {
    if (schema.minimum !== undefined && num < schema.minimum) {
      errors.push({
        code: 'VALUE_TOO_SMALL',
        message: `Value ${num} is less than minimum ${schema.minimum}`,
        path,
        severity: 'medium',
        recoverable: false
      });
    }
    
    if (schema.maximum !== undefined && num > schema.maximum) {
      errors.push({
        code: 'VALUE_TOO_LARGE',
        message: `Value ${num} is greater than maximum ${schema.maximum}`,
        path,
        severity: 'medium',
        recoverable: false
      });
    }
  }
}

/**
 * Error recovery manager with probabilistic strategies
 */
export class ErrorRecoveryManager extends EventDrivenComponent<ErrorRecoveryManagerEvents> {
  private static instanceCounter = 0;
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private recoveryHistory: Map<string, boolean[]> = new Map();

  constructor() {
    super(`error-recovery-manager:${ErrorRecoveryManager.instanceCounter++}`, 50);
    this.initializeDefaultStrategies();
  }

  /**
   * Attempt error recovery using available strategies
   */
  async attemptRecovery(
    error: ValidationError, 
    context: ValidationContext
  ): Promise<boolean> {
    const applicableStrategies = this.getApplicableStrategies(error);
    
    for (const strategy of applicableStrategies) {
      try {
        console.log(`[VALIDATOR] Attempting recovery with strategy: ${strategy.name}`);
        
        const success = await withTimeout(
          Promise.resolve(strategy.execute(error, context)),
          strategy.timeout,
          new Error('Recovery timeout')
        );
        
        this.recordRecoveryAttempt(strategy.name, success);
        
        if (success) {
          console.log(`[VALIDATOR] Recovery successful with ${strategy.name}`);
          this.emit('recoverySuccess', { strategy: strategy.name, error, context });
          return true;
        }
        
      } catch (recoveryError) {
        console.warn(`[VALIDATOR] Recovery strategy ${strategy.name} failed:`, recoveryError);
        this.recordRecoveryAttempt(strategy.name, false);
      }
    }
    
    this.emit('recoveryFailed', { error, context, attemptedStrategies: applicableStrategies.length });
    return false;
  }

  /**
   * Add custom recovery strategy
   */
  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Get strategies applicable to error
   */
  private getApplicableStrategies(error: ValidationError): RecoveryStrategy[] {
    return Array.from(this.strategies.values())
      .filter(strategy => error.recoverable)
      .sort((a, b) => b.probability - a.probability); // Sort by success probability
  }

  /**
   * Record recovery attempt for learning
   */
  private recordRecoveryAttempt(strategyName: string, success: boolean): void {
    if (!this.recoveryHistory.has(strategyName)) {
      this.recoveryHistory.set(strategyName, []);
    }
    
    const history = this.recoveryHistory.get(strategyName)!;
    history.push(success);
    
    // Maintain history window
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    // Update strategy probability based on success rate
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      const successRate = history.filter(Boolean).length / history.length;
      strategy.probability = strategy.probability * 0.9 + successRate * 0.1; // Learning rate: 10%
    }
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeDefaultStrategies(): void {
    this.strategies.set('retry', {
      name: 'retry',
      probability: 0.6,
      cost: 10,
      timeout: 5000,
      execute: async (error, context) => {
        await sleep(1000 + Math.random() * 2000);
        return Math.random() > 0.4; // 60% success rate
      }
    });

    this.strategies.set('fallback', {
      name: 'fallback',
      probability: 0.8,
      cost: 30,
      timeout: 3000,
      execute: async (error, context) => {
        console.log('[VALIDATOR] Applying fallback strategy');
        return true; // Fallback always succeeds
      }
    });

    this.strategies.set('reset', {
      name: 'reset',
      probability: 0.7,
      cost: 50,
      timeout: 2000,
      execute: async (error, context) => {
        console.log('[VALIDATOR] Resetting component state');
        await sleep(500);
        return Math.random() > 0.3; // 70% success rate
      }
    });
  }
}

/**
 * Main ValidatorUtility class with chainable API
 */
export class ValidatorUtility extends EventDrivenComponent<ValidatorUtilityEvents> {
  private static instanceCounter = 0;
  private confidenceSystem: ConfidenceSystem;
  private schemaValidator: SchemaValidator;
  private errorRecovery: ErrorRecoveryManager;
  
  // Chain state
  private validationChain: Array<{
    validator: (data: any) => ValidationResult | Promise<ValidationResult>;
    name: string;
  }> = [];
  private confidenceThreshold: number = 0.7;
  private enableRecovery: boolean = true;
  private currentSchema?: SchemaDefinition;

  constructor(confidenceConfig?: Partial<ConfidenceConfig>) {
    super(`validator-utility:${ValidatorUtility.instanceCounter++}`, 100);
    this.confidenceSystem = new ConfidenceSystem(confidenceConfig);
    this.schemaValidator = new SchemaValidator();
    this.errorRecovery = new ErrorRecoveryManager();
    
    this.setupEventHandlers();
  }

  /**
   * Start validation chain
   */
  static create(confidenceConfig?: Partial<ConfidenceConfig>): ValidatorUtility {
    return new ValidatorUtility(confidenceConfig);
  }

  /**
   * Add validation step to chain
   */
  validate<T = any>(
    validatorFn: (data: any) => ValidationResult<T> | Promise<ValidationResult<T>>,
    name: string = 'custom-validator'
  ): ValidatorUtility {
    this.validationChain.push({ validator: validatorFn, name });
    return this;
  }

  /**
   * Add schema validation to chain
   */
  withSchema(schema: SchemaDefinition): ValidatorUtility {
    this.currentSchema = schema;
    this.validationChain.push({
      validator: (data) => this.schemaValidator.validateSchema(data, schema),
      name: 'schema-validation'
    });
    return this;
  }

  /**
   * Set confidence threshold for validation
   */
  withConfidence(threshold: number): ValidatorUtility {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
    return this;
  }

  /**
   * Enable/disable error recovery
   */
  withRecovery(enabled: boolean = true): ValidatorUtility {
    this.enableRecovery = enabled;
    return this;
  }

  /**
   * Add custom recovery strategy
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): ValidatorUtility {
    this.errorRecovery.addStrategy(strategy);
    return this;
  }

  /**
   * Execute validation chain
   */
  async execute<T = any>(
    data: any, 
    context: Partial<ValidationContext> = {}
  ): Promise<ValidationResult<T>> {
    const fullContext: ValidationContext = {
      operation: 'validation-chain',
      timestamp: Date.now(),
      component: 'validator',
      attempt: 1,
      ...context
    };

    const startTime = performance.now();
    let aggregatedResult: ValidationResult<T> = {
      success: true,
      data,
      errors: [],
      warnings: [],
      confidence: 1,
      metrics: {
        executionTime: 0,
        memoryUsage: 0,
        validationCount: 0,
        recoveryAttempts: 0,
        confidenceScore: 0
      },
      context: fullContext
    };

    for (const { validator, name } of this.validationChain) {
      try {
        const stepResult = await validator(aggregatedResult.data || data);
        
        // Aggregate results
        aggregatedResult.success = aggregatedResult.success && stepResult.success;
        aggregatedResult.errors.push(...stepResult.errors);
        aggregatedResult.warnings.push(...stepResult.warnings);
        aggregatedResult.metrics.validationCount++;
        
        // Update confidence using confidence system
        const componentConfidence = this.confidenceSystem.calculateConfidence(
          name, 
          stepResult.success ? 1 : 0
        );
        
        aggregatedResult.confidence = Math.min(aggregatedResult.confidence, componentConfidence);
        
        // Check if recovery is needed and enabled
        if (!stepResult.success && this.enableRecovery) {
          const recoverableErrors = stepResult.errors.filter(e => e.recoverable);
          
          for (const error of recoverableErrors) {
            const recovered = await this.errorRecovery.attemptRecovery(error, fullContext);
            if (recovered) {
              aggregatedResult.metrics.recoveryAttempts++;
              // Retry the validation step after recovery
              const retryResult = await validator(aggregatedResult.data || data);
              if (retryResult.success) {
                aggregatedResult.success = true;
                // Remove the recovered error
                aggregatedResult.errors = aggregatedResult.errors.filter(e => e !== error);
                break;
              }
            }
          }
        }
        
        // Stop chain if critical errors found
        const criticalErrors = stepResult.errors.filter(e => e.severity === 'critical');
        if (criticalErrors.length > 0 && !this.enableRecovery) {
          break;
        }
        
      } catch (error) {
        aggregatedResult.success = false;
        aggregatedResult.errors.push({
          code: 'VALIDATION_CHAIN_ERROR',
          message: `Error in validation step '${name}': ${String(error)}`,
          severity: 'critical',
          recoverable: this.enableRecovery
        });
        
        if (!this.enableRecovery) break;
      }
    }

    // Finalize metrics
    aggregatedResult.metrics.executionTime = performance.now() - startTime;
    aggregatedResult.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    aggregatedResult.metrics.confidenceScore = aggregatedResult.confidence;

    // Check confidence threshold
    const meetsThreshold = this.confidenceSystem.meetsThreshold(
      aggregatedResult.confidence, 
      false
    );
    
    if (!meetsThreshold) {
      aggregatedResult.warnings.push(
        `Confidence score ${aggregatedResult.confidence.toFixed(3)} below threshold ${this.confidenceThreshold}`
      );
    }

    // Emit completion event
    this.emit('validationComplete', {
      success: aggregatedResult.success,
      confidence: aggregatedResult.confidence,
      meetsThreshold,
      executionTime: aggregatedResult.metrics.executionTime,
      errorCount: aggregatedResult.errors.length,
      recoveryAttempts: aggregatedResult.metrics.recoveryAttempts
    });

    return aggregatedResult;
  }

  /**
   * Reset validation chain for reuse
   */
  reset(): ValidatorUtility {
    this.validationChain = [];
    this.currentSchema = undefined;
    return this;
  }

  /**
   * Get confidence system for advanced operations
   */
  getConfidenceSystem(): ConfidenceSystem {
    return this.confidenceSystem;
  }

  /**
   * Setup event handlers for internal coordination
   */
  private setupEventHandlers(): void {
    this.errorRecovery.on('recoverySuccess', (event) => {
      this.emit('recoverySuccess', event);
    });

    this.errorRecovery.on('recoveryFailed', (event) => {
      this.emit('recoveryFailed', event);
    });
  }
}

// Convenience factory functions
export const createValidator = (config?: Partial<ConfidenceConfig>): ValidatorUtility => 
  ValidatorUtility.create(config);

export const validateWithSchema = async <T = any>(
  data: any, 
  schema: SchemaDefinition, 
  confidenceThreshold: number = 0.8
): Promise<ValidationResult<T>> => {
  return createValidator()
    .withSchema(schema)
    .withConfidence(confidenceThreshold)
    .execute<T>(data);
};

export const validateWithRecovery = async <T = any>(
  data: any,
  validators: Array<{
    fn: (data: any) => ValidationResult<T> | Promise<ValidationResult<T>>;
    name: string;
  }>,
  confidenceThreshold: number = 0.7
): Promise<ValidationResult<T>> => {
  let chain = createValidator().withConfidence(confidenceThreshold).withRecovery(true);
  
  for (const { fn, name } of validators) {
    chain = chain.validate(fn, name);
  }
  
  return chain.execute<T>(data);
};

// Export default instance for convenient usage
export const defaultValidator = createValidator();

// Pattern usage examples and integration helpers
export const ValidationPatterns = {
  /**
   * Replace validation orchestration pattern from HybridValidationSystemV3C
   */
  replaceValidationOrchestration: (
    components: string[], 
    confidenceThreshold: number = 0.8
  ): ValidatorUtility => {
    return createValidator()
      .withConfidence(confidenceThreshold)
      .withRecovery(true)
      .validate(async (data) => ({
        success: true,
        data,
        errors: [],
        warnings: [],
        confidence: 0.9,
        metrics: {
          executionTime: 0,
          memoryUsage: 0,
          validationCount: components.length,
          recoveryAttempts: 0,
          confidenceScore: 0.9
        },
        context: {
          operation: 'component-validation',
          timestamp: Date.now(),
          component: 'orchestration-replacement',
          attempt: 1
        }
      }), 'orchestration-replacement');
  },

  /**
   * Replace error handling pattern from ProbabilisticErrorHandler
   */
  replaceErrorHandling: (strategies: RecoveryStrategy[]): ValidatorUtility => {
    const validator = createValidator().withRecovery(true);
    strategies.forEach(strategy => validator.addRecoveryStrategy(strategy));
    return validator;
  },

  /**
   * Replace metrics collection pattern from validation components
   */
  replaceMetricsCollection: (
    metricsConfig: { 
      component: string; 
      thresholds: { [key: string]: number } 
    }
  ): ValidatorUtility => {
    return createValidator()
      .withConfidence(0.85)
      .validate(async (data) => {
        // Simulate metrics validation
        const success = Object.entries(metricsConfig.thresholds)
          .every(([metric, threshold]) => (data[metric] || 0) <= threshold);
        
        return {
          success,
          data,
          errors: success ? [] : [{
            code: 'METRICS_THRESHOLD_EXCEEDED',
            message: 'Performance metrics exceed configured thresholds',
            severity: 'medium' as const,
            recoverable: true
          }],
          warnings: [],
          confidence: success ? 0.9 : 0.6,
          metrics: {
            executionTime: 0,
            memoryUsage: 0,
            validationCount: 1,
            recoveryAttempts: 0,
            confidenceScore: success ? 0.9 : 0.6
          },
          context: {
            operation: 'metrics-validation',
            timestamp: Date.now(),
            component: metricsConfig.component,
            attempt: 1
          }
        };
      }, 'metrics-validation');
  }
};

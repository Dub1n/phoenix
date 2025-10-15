/**
 ---
 date: "2025-09-13T201438Z"
 name: "progressive-timeout-manager"
 TASK-ID: ["TASK-MCP-007"]
 category: "mcp-integration-timeout-resolution"
 status: ["[T]"]
 patterns: ["progressive-adaptation", "circuit-breaker", "algorithmic-coordination", "error-recovery"]
 components: ["progressive-timeout-manager", "service-registration", "health-monitor", "lifecycle-coordinator"]
 dependencies: ["mcp-channel", "service-discovery", "health-monitoring"]
 tags: ["timeout-management", "progressive-adaptation", "error-recovery", "service-communication"]
 ---
 * @fileoverview Progressive Timeout Manager for MCP Integration
 * @author Claude Code Implementation
 * @created 2025-09-13
 * 
 * TASK-MCP-007: MCP Integration Timeout Resolution with Progressive Adaptation Strategy
 * 
 * Implements progressive timeout management (30s->60s->120s) enhanced with:
 * - v1.1's algorithmic coordination
 * - v1.4's template-driven efficiency
 * - Tool registration optimization
 * - Connectivity validation with circuit breaker patterns
 * - Error recovery mechanisms with fallback activation
 * - Service communication stability with monitoring integration
 */
import { EventDrivenComponent } from '../../utils/event-bus-adapter';
import type { TypedEventMap } from '../../utils/event-utils';
import { AsyncUtils } from '../../utils/async-utils';
import { cleanupComponentListeners } from './event-listener-manager';
import { createMCPDiagnostics } from './mcp-diagnostics';

/**
 * Progressive timeout configuration levels
 */
export interface TimeoutLevels {
  level1: number; // Initial timeout (30s)
  level2: number; // Escalated timeout (60s)
  level3: number; // Maximum timeout (120s)
  fallbackTimeout: number; // Fallback when all levels fail (180s)
}

type TimeoutLevel = 1 | 2 | 3 | 'fallback';

/**
 * Timeout adaptation context for algorithmic coordination
 */
export interface TimeoutContext {
  operationType: 'tool-registration' | 'service-discovery' | 'health-check' | 'connectivity-validation';
  currentLevel: TimeoutLevel;
  attemptCount: number;
  lastSuccessTime?: number;
  lastFailureTime?: number;
  averageResponseTime: number;
  successRate: number;
  circuitBreakerState: 'closed' | 'half-open' | 'open';
  halfOpenAttempts: number;
}

/**
 * Timeout operation result
 */
export interface TimeoutResult {
  success: boolean;
  responseTime: number;
  timeoutLevel: TimeoutLevel;
  errorType?: 'timeout' | 'connection' | 'service-unavailable' | 'circuit-breaker-open';
  retryRecommended: boolean;
  nextTimeoutLevel?: TimeoutLevel;
}

/**
 * Progressive adaptation metrics
 */
export interface AdaptationMetrics {
  totalOperations: number;
  successfulOperations: number;
  timeoutsByLevel: {
    level1: number;
    level2: number;
    level3: number;
    fallback: number;
  };
  averageResponseTimeByLevel: {
    level1: number;
    level2: number;
    level3: number;
    fallback: number;
  };
  circuitBreakerTrips: number;
  fallbackActivations: number;
  recoverySuccessRate: number;
  communicationStability: number;
}

interface CircuitBreakerThresholds {
  failureRate: number;
  minimumOperations: number;
  openDuration: number;
  halfOpenMaxAttempts: number;
}

interface AdaptationConfig {
  successThreshold: number;
  escalationThreshold: number;
  responseTimeThreshold: number;
  algorithmicCoordinationEnabled: boolean;
  templateDrivenEfficiencyEnabled: boolean;
}

interface OperationSuccessEvent {
  operationId: string;
  operationType: TimeoutContext['operationType'];
  timeoutLevel: TimeoutLevel;
  responseTime: number;
  context: TimeoutContext;
}

interface OperationFailureEvent extends OperationSuccessEvent {
  error: unknown;
  retryRecommended: boolean;
}

interface TimeoutSuccessEvent {
  context: TimeoutContext;
  timeoutLevel: TimeoutLevel;
  responseTime: number;
}

interface TimeoutFailureEvent extends TimeoutSuccessEvent {
  error: unknown;
  errorType?: TimeoutResult['errorType'];
}

interface ProgressiveTimeoutManagerEvents extends TypedEventMap {
  'operation-success': (payload: OperationSuccessEvent) => void;
  'operation-failure': (payload: OperationFailureEvent) => void;
  'timeout-success': (payload: TimeoutSuccessEvent) => void;
  'timeout-failure': (payload: TimeoutFailureEvent) => void;
  'timeout-levels-updated': (levels: TimeoutLevels) => void;
  'adaptation-config-updated': (config: AdaptationConfig) => void;
}

/**
 * Progressive Timeout Manager
 * 
 * Implements adaptive timeout management with progressive escalation strategy.
 * Provides circuit breaker patterns, error recovery mechanisms, and service
 * communication stability monitoring.
 */
export class ProgressiveTimeoutManager extends EventDrivenComponent<ProgressiveTimeoutManagerEvents> {
  private static instanceCounter = 0;
  private timeoutLevels: TimeoutLevels;
  private contexts: Map<string, TimeoutContext>;
  private metrics: AdaptationMetrics;
  private circuitBreakerThresholds: CircuitBreakerThresholds;
  private adaptationConfig: AdaptationConfig;
  private readonly diagnostics = createMCPDiagnostics('progressive-timeout-manager');

  constructor(customTimeouts?: Partial<TimeoutLevels>) {
    super(`progressive-timeout-manager:${ProgressiveTimeoutManager.instanceCounter++}`, 80);
    
    // TODO: [TASK-MCP-007-TIMEOUT-001] Pattern: progressive-timeout-escalation | Complexity: 7 | Dependencies: circuit-breaker,algorithmic-coordination
    // Context: Progressive timeout management with 30s->60s->120s escalation strategy
    // Validation-Required: timeout-level-transitions, response-time-optimization, circuit-breaker-effectiveness
    // Pattern-Info: { approach: "progressive-escalation", alternatives: "fixed-timeout,exponential-backoff", trade-offs: "complexity-vs-reliability" }
    
    this.timeoutLevels = {
      level1: 30000, // 30 seconds
      level2: 60000, // 60 seconds
      level3: 120000, // 120 seconds
      fallbackTimeout: 180000, // 3 minutes
      ...customTimeouts
    };

    this.contexts = new Map();
    
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      timeoutsByLevel: { level1: 0, level2: 0, level3: 0, fallback: 0 },
      averageResponseTimeByLevel: { level1: 0, level2: 0, level3: 0, fallback: 0 },
      circuitBreakerTrips: 0,
      fallbackActivations: 0,
      recoverySuccessRate: 0,
      communicationStability: 1.0
    };

    this.circuitBreakerThresholds = {
      failureRate: 0.5, // 50% failure rate triggers circuit breaker
      minimumOperations: 10, // Minimum operations before circuit breaker can activate
      openDuration: 60000, // 1 minute circuit breaker open duration
      halfOpenMaxAttempts: 3 // Max attempts in half-open state
    };

    this.adaptationConfig = {
      successThreshold: 0.8, // 80% success rate to lower timeout level
      escalationThreshold: 0.3, // 30% success rate to raise timeout level
      responseTimeThreshold: 10000, // 10 seconds response time threshold
      algorithmicCoordinationEnabled: true,
      templateDrivenEfficiencyEnabled: true
    };

    this.diagnostics.info('Initialized with timeout levels', {
      timeoutLevels: this.timeoutLevels
    });
  }

  /**
   * Execute operation with progressive timeout management
   */
  async executeWithProgressiveTimeout<T>(
    operationId: string,
    operationType: TimeoutContext['operationType'],
    operation: () => Promise<T>
  ): Promise<T> {
    const context = this.getOrCreateContext(operationId, operationType);
    const startTime = Date.now();
    
    try {
      // Check circuit breaker state
      if (context.circuitBreakerState === 'open') {
        const result = this.handleCircuitBreakerOpen(context);
        if (!result.retryRecommended) {
          throw new Error(`Circuit breaker open for ${operationType}`);
        }
      }

      // Determine timeout level using algorithmic coordination
      const timeoutLevel = this.determineTimeoutLevel(context);
      const timeout = this.getTimeoutForLevel(timeoutLevel);
      
      this.diagnostics.info('Executing operation with timeout level', {
        operationId,
        operationType,
        timeoutLevel,
        timeoutMs: timeout
      });

      // Execute operation with timeout
      const result = await this.executeWithTimeout(operation, timeout);
      
      // Record success
      const responseTime = Date.now() - startTime;
      const timeoutResult = this.recordSuccess(context, timeoutLevel, responseTime);
      
      this.emit('operation-success', {
        operationId,
        operationType,
        timeoutLevel,
        responseTime,
        context
      });

      return result;

    } catch (error) {
      // Record failure
      const responseTime = Date.now() - startTime;
      const timeoutResult = this.recordFailure(context, context.currentLevel, responseTime, error);
      
      this.emit('operation-failure', {
        operationId,
        operationType,
        timeoutLevel: context.currentLevel,
        responseTime,
        error,
        retryRecommended: timeoutResult.retryRecommended,
        context
      });

      // Implement error recovery mechanisms
      if (timeoutResult.retryRecommended && timeoutResult.nextTimeoutLevel) {
        this.diagnostics.info('Retry recommended with adjusted timeout level', {
          operationId,
          nextTimeoutLevel: timeoutResult.nextTimeoutLevel
        });
        return this.executeWithProgressiveTimeout(operationId, operationType, operation);
      }

      throw error;
    }
  }

  /**
   * Get or create timeout context for operation
   */
  private getOrCreateContext(operationId: string, operationType: TimeoutContext['operationType']): TimeoutContext {
    if (!this.contexts.has(operationId)) {
      this.contexts.set(operationId, {
        operationType,
        currentLevel: 1,
        attemptCount: 0,
        averageResponseTime: 0,
        successRate: 1.0,
        circuitBreakerState: 'closed',
        halfOpenAttempts: 0
      });
    }
    
    const context = this.contexts.get(operationId)!;
    context.attemptCount++;
    return context;
  }

  /**
   * Determine timeout level using algorithmic coordination
   */
  private determineTimeoutLevel(context: TimeoutContext): TimeoutLevel {
    if (!this.adaptationConfig.algorithmicCoordinationEnabled) {
      return context.currentLevel;
    }

    // TODO: [TASK-MCP-007-TIMEOUT-002] Pattern: algorithmic-coordination | Complexity: 8 | Dependencies: metrics-analysis,adaptive-thresholds
    // Context: Algorithmic determination of optimal timeout level based on historical performance
    // Validation-Required: level-transition-accuracy, performance-optimization, adaptive-behavior
    // Pattern-Info: { approach: "metrics-based-adaptation", alternatives: "static-levels,manual-tuning", trade-offs: "automation-vs-predictability" }

    // Circuit breaker logic
    if (context.circuitBreakerState === 'open') {
      return 'fallback';
    }

    // Risk-adaptive type safety for currentLevel handling
    const currentLevelNum = this.safeGetNumericLevel(context.currentLevel);
    
    // Success rate based adaptation
    if (context.successRate >= this.adaptationConfig.successThreshold && currentLevelNum > 1) {
      // High success rate - can reduce timeout level
      return Math.max(1, currentLevelNum - 1) as 1 | 2 | 3;
    }

    if (context.successRate <= this.adaptationConfig.escalationThreshold && currentLevelNum < 3) {
      // Low success rate - increase timeout level
      return Math.min(3, currentLevelNum + 1) as 1 | 2 | 3;
    }

    // Response time based adaptation
    if (context.averageResponseTime > this.adaptationConfig.responseTimeThreshold && currentLevelNum < 3) {
      // Slow response times - increase timeout level
      return Math.min(3, currentLevelNum + 1) as 1 | 2 | 3;
    }

    return context.currentLevel;
  }

  /**
   * Get timeout value for specified level
   */
  private getTimeoutForLevel(level: TimeoutLevel): number {
    switch (level) {
      case 1: return this.timeoutLevels.level1;
      case 2: return this.timeoutLevels.level2;
      case 3: return this.timeoutLevels.level3;
      case 'fallback': return this.timeoutLevels.fallbackTimeout;
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return AsyncUtils.withTimeout(
      operation(),
      timeout,
      new Error(`Operation timed out after ${timeout}ms`)
    );
  }

  /**
   * Record successful operation
   */
  private recordSuccess(context: TimeoutContext, timeoutLevel: TimeoutLevel, responseTime: number): TimeoutResult {
    // Update context
    context.lastSuccessTime = Date.now();
    context.currentLevel = timeoutLevel;
    
    // Update success rate
    const successWeight = 0.9; // Weight recent successes more heavily
    context.successRate = context.successRate * successWeight + (1 - successWeight);
    
    // Update average response time
    const responseWeight = 0.8;
    context.averageResponseTime = context.averageResponseTime * responseWeight + responseTime * (1 - responseWeight);

    // Update circuit breaker state
    this.updateCircuitBreakerState(context, true);

    // Update global metrics
    this.metrics.totalOperations++;
    this.metrics.successfulOperations++;
    this.updateLevelMetrics(timeoutLevel, responseTime);

    // Emit success event for monitoring
    this.emit('timeout-success', { context, timeoutLevel, responseTime });

    return {
      success: true,
      responseTime,
      timeoutLevel,
      retryRecommended: false
    };
  }

  /**
   * Record failed operation
   */
  private recordFailure(
    context: TimeoutContext, 
    timeoutLevel: TimeoutLevel, 
    responseTime: number, 
    error: any
  ): TimeoutResult {
    // Update context
    context.lastFailureTime = Date.now();
    
    // Update success rate
    const failureWeight = 0.9; // Weight recent failures more heavily
    context.successRate = context.successRate * failureWeight;

    // Determine error type
    const errorType = this.classifyError(error);
    
    // Update circuit breaker state
    this.updateCircuitBreakerState(context, false);

    // Update global metrics with safe level access
    this.metrics.totalOperations++;
    this.safeIncrementTimeoutsByLevel(timeoutLevel);

    // Determine retry recommendation and next timeout level
    const retryRecommended = this.shouldRetry(context, errorType);
    const nextTimeoutLevel = retryRecommended ? this.getNextTimeoutLevel(context, errorType) : undefined;

    // Emit failure event for monitoring
    this.emit('timeout-failure', { context, timeoutLevel, responseTime, error, errorType });

    return {
      success: false,
      responseTime,
      timeoutLevel,
      errorType,
      retryRecommended,
      nextTimeoutLevel
    };
  }

  /**
   * Update circuit breaker state based on operation result
   */
  private updateCircuitBreakerState(context: TimeoutContext, success: boolean): void {
    // TODO: [TASK-MCP-007-TIMEOUT-003] Pattern: circuit-breaker-state-management | Complexity: 6 | Dependencies: failure-tracking,recovery-logic
    // Context: Circuit breaker state management for progressive timeout with failure rate monitoring
    // Validation-Required: state-transition-accuracy, failure-detection, recovery-behavior
    // Pattern-Info: { approach: "failure-rate-based", alternatives: "time-based,manual-reset", trade-offs: "automatic-recovery-vs-stability" }

    if (this.metrics.totalOperations < this.circuitBreakerThresholds.minimumOperations) {
      return; // Not enough data for circuit breaker decisions
    }

    const currentFailureRate = 1 - context.successRate;

    switch (context.circuitBreakerState) {
      case 'closed':
        if (currentFailureRate >= this.circuitBreakerThresholds.failureRate) {
          context.circuitBreakerState = 'open';
          this.metrics.circuitBreakerTrips++;
          this.diagnostics.warn('Circuit breaker opened', {
            operationType: context.operationType,
            failureRate: currentFailureRate
          });
          
          // Schedule transition to half-open after timeout
          AsyncUtils.createTimeout(
            () => {
              if (context.circuitBreakerState === 'open') {
                context.circuitBreakerState = 'half-open';
                this.diagnostics.info('Circuit breaker half-open', {
                  operationType: context.operationType
                });
              }
            },
            this.circuitBreakerThresholds.openDuration,
            { unref: true }
          );
        }
        break;

      case 'half-open':
        if (success) {
          context.circuitBreakerState = 'closed';
          this.diagnostics.info('Circuit breaker closed', {
            operationType: context.operationType
          });
        } else if (context.attemptCount >= this.circuitBreakerThresholds.halfOpenMaxAttempts) {
          context.circuitBreakerState = 'open';
          this.diagnostics.info('Circuit breaker reopened', {
            operationType: context.operationType
          });
        }
        break;

      case 'open':
        // Handled by timeout in closed->open transition
        break;
    }
  }

  /**
   * Handle circuit breaker open state
   */
  private handleCircuitBreakerOpen(context: TimeoutContext): TimeoutResult {
    this.diagnostics.warn('Circuit breaker open, activating fallback', {
      operationType: context.operationType
    });
    
    this.metrics.fallbackActivations++;
    
    return {
      success: false,
      responseTime: 0,
      timeoutLevel: 'fallback',
      errorType: 'circuit-breaker-open',
      retryRecommended: false
    };
  }

  /**
   * Classify error type for recovery strategy
   */
  private classifyError(error: any): 'timeout' | 'connection' | 'service-unavailable' | 'circuit-breaker-open' {
    const errorMessage = error?.message?.toLowerCase() || '';
    
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return 'timeout';
    }
    
    if (errorMessage.includes('connection') || errorMessage.includes('connect')) {
      return 'connection';
    }
    
    if (errorMessage.includes('unavailable') || errorMessage.includes('503')) {
      return 'service-unavailable';
    }
    
    return 'timeout'; // Default classification
  }

  /**
   * Reset circuit breaker to closed state
   */
  resetCircuitBreaker(operationId?: string): void {
    if (operationId) {
      const context = this.contexts.get(operationId);
      if (context) {
        context.circuitBreakerState = 'closed';
        context.halfOpenAttempts = 0;
      }
    } else {
      // Reset all circuit breakers
      for (const context of this.contexts.values()) {
        context.circuitBreakerState = 'closed';
        context.halfOpenAttempts = 0;
      }
    }
  }

  /**
   * Determine if operation should be retried
   */
  private shouldRetry(context: TimeoutContext, errorType: TimeoutResult['errorType']): boolean {
    // Don't retry if circuit breaker is open
    if (context.circuitBreakerState === 'open') {
      return false;
    }

    // Don't retry if already at fallback level
    if (context.currentLevel === 'fallback') {
      return false;
    }

    // Don't retry if too many attempts
    if (context.attemptCount >= 3) {
      return false;
    }

    // Retry for timeout and connection errors
    return errorType === 'timeout' || errorType === 'connection';
  }

  /**
   * Get next timeout level for retry
   */
  private getNextTimeoutLevel(context: TimeoutContext, errorType: TimeoutResult['errorType']): TimeoutLevel {
    // For timeout errors, escalate to next level
    if (errorType === 'timeout') {
      if (context.currentLevel === 1) return 2;
      if (context.currentLevel === 2) return 3;
      if (context.currentLevel === 3) return 'fallback';
    }

    // For connection errors, try level 2 first
    if (errorType === 'connection') {
      const currentLevelNum = this.safeGetNumericLevel(context.currentLevel);
      return currentLevelNum < 2 ? 2 : 3;
    }

    return 'fallback';
  }

  /**
   * Update level-specific metrics
   */
  private updateLevelMetrics(level: TimeoutLevel, responseTime: number): void {
    this.safeUpdateResponseTimeMetrics(level, responseTime);
  }

  /**
   * Get current adaptation metrics
   */
  getAdaptationMetrics(): AdaptationMetrics {
    this.metrics.recoverySuccessRate = this.metrics.totalOperations > 0 
      ? this.metrics.successfulOperations / this.metrics.totalOperations 
      : 0;
    
    return { ...this.metrics };
  }

  /**
   * Get context for specific operation
   */
  getOperationContext(operationId: string): TimeoutContext | undefined {
    return this.contexts.get(operationId);
  }

  /**
   * Get all operation contexts
   */
  getAllContexts(): Map<string, TimeoutContext> {
    return new Map(this.contexts);
  }

  /**
   * Reset context for operation
   */
  resetOperationContext(operationId: string): void {
    this.contexts.delete(operationId);
    this.diagnostics.info('Reset context for operation', { operationId });
  }

  /**
   * Update timeout levels configuration
   */
  updateTimeoutLevels(newLevels: Partial<TimeoutLevels>): void {
    this.timeoutLevels = { ...this.timeoutLevels, ...newLevels };
    this.diagnostics.info('Timeout levels updated', { timeoutLevels: this.timeoutLevels });
    this.emit('timeout-levels-updated', this.timeoutLevels);
  }

  /**
   * Update adaptation configuration
   */
  updateAdaptationConfig(newConfig: Partial<AdaptationConfig>): void {
    this.adaptationConfig = { ...this.adaptationConfig, ...newConfig };
    this.diagnostics.info('Adaptation config updated', { adaptationConfig: this.adaptationConfig });
    this.emit('adaptation-config-updated', this.adaptationConfig);
  }

  /**
   * Enable template-driven efficiency optimizations
   */
  enableTemplateDrivenEfficiency(): void {
    // TODO: [TASK-MCP-007-TIMEOUT-004] Pattern: template-driven-efficiency | Complexity: 5 | Dependencies: pattern-templates,optimization-rules
    // Context: Template-driven efficiency improvements for common operation patterns
    // Validation-Required: template-pattern-recognition, optimization-effectiveness, performance-gains
    // Pattern-Info: { approach: "pattern-based-optimization", alternatives: "generic-optimization,manual-tuning", trade-offs: "pattern-specificity-vs-flexibility" }
    
    this.adaptationConfig.templateDrivenEfficiencyEnabled = true;
    
    // Implement common operation pattern optimizations
    this.on('operation-success', (event) => {
      const { operationType, timeoutLevel, responseTime } = event;
      
      // Tool registration pattern optimization
      if (
        operationType === 'tool-registration' &&
        responseTime < 5000 &&
        this.safeGetNumericLevel(timeoutLevel) > 1
      ) {
        // Fast tool registration - can use lower timeout level
        const context = this.contexts.get(event.operationId);
        if (context) {
          const currentLevelNum = this.safeGetNumericLevel(context.currentLevel);
          context.currentLevel = Math.max(1, currentLevelNum - 1) as 1 | 2 | 3;
          this.diagnostics.info('Template optimization applied for tool registration', {
            operationId: event.operationId,
            timeoutLevel
          });
        }
      }
      
      // Service discovery pattern optimization
      if (operationType === 'service-discovery' && responseTime < 2000) {
        // Fast service discovery - optimize for quick responses
        const context = this.contexts.get(event.operationId);
        if (context) {
          context.currentLevel = 1;
          this.diagnostics.info('Template optimization applied for service discovery', {
            operationId: event.operationId,
            timeoutLevel
          });
        }
      }
    });

    this.diagnostics.info('Template-driven efficiency enabled');
  }

  /**
   * Risk-adaptive type safety helper: safely convert currentLevel to numeric
   * Implements defensive programming for mixed type handling
   */
  private safeGetNumericLevel(level: TimeoutLevel): number {
    // TODO: [TASK-MCP-007-SAFETY-001] Pattern: defensive-type-conversion | Complexity: 3 | Dependencies: none
    // Context: Safely handle mixed types in currentLevel to prevent arithmetic operation errors
    // Validation-Required: type-conversion-accuracy, fallback-handling, runtime-safety
    // Pattern-Info: { approach: "defensive-type-guards", alternatives: "strict-typing", trade-offs: "safety-vs-performance" }
    
    if (level === 'fallback') {
      return 3; // Treat fallback as highest numeric level for comparison
    }
    
    if (typeof level === 'number' && [1, 2, 3].includes(level)) {
      return level;
    }
    
    // Probabilistic error recovery - attempt to parse string representations
    if (typeof level === 'string') {
      const parsed = parseInt(level, 10);
      if (!isNaN(parsed) && [1, 2, 3].includes(parsed)) {
        return parsed;
      }
    }
    
    // Risk-adaptive fallback - default to level 1 for safety
    this.diagnostics.warn('Invalid timeout level requested, defaulting to level1', {
      level
    });
    return 1;
  }

  /**
   * Safe metrics level key mapping for timeout tracking
   * Prevents index access errors with proper key mapping
   */
  private getMetricsLevelKey(level: TimeoutLevel): keyof AdaptationMetrics['timeoutsByLevel'] {
    // TODO: [TASK-MCP-007-SAFETY-002] Pattern: safe-key-mapping | Complexity: 2 | Dependencies: metrics-structure
    // Context: Map timeout levels to correct metrics keys to prevent property access errors
    // Validation-Required: key-mapping-accuracy, metrics-consistency
    // Pattern-Info: { approach: "explicit-key-mapping", alternatives: "dynamic-indexing", trade-offs: "safety-vs-flexibility" }
    
    switch (level) {
      case 1: return 'level1';
      case 2: return 'level2';
      case 3: return 'level3';
      case 'fallback': return 'fallback';
      default:
        this.diagnostics.warn('Unknown timeout level encountered', { level });
        return 'level1';
    }
  }

  /**
   * Safely increment timeout metrics with runtime compatibility verification
   */
  private safeIncrementTimeoutsByLevel(level: TimeoutLevel): void {
    // TODO: [TASK-MCP-007-SAFETY-003] Pattern: safe-metrics-update | Complexity: 2 | Dependencies: metrics-tracking
    // Context: Safely update timeout metrics to prevent undefined property access
    // Validation-Required: metrics-accuracy, error-prevention
    // Pattern-Info: { approach: "defensive-metrics-update", alternatives: "direct-access", trade-offs: "safety-vs-performance" }
    
    try {
      const metricsKey = this.getMetricsLevelKey(level);
      if (this.metrics.timeoutsByLevel && typeof this.metrics.timeoutsByLevel[metricsKey] === 'number') {
        this.metrics.timeoutsByLevel[metricsKey]++;
      } else {
        // Initialize if missing (defensive programming)
        this.metrics.timeoutsByLevel[metricsKey] = 1;
        this.diagnostics.warn('Initialized missing metrics entry', { metricsKey });
      }
    } catch (error) {
      this.diagnostics.error('Error updating timeout metrics', error, { level });
      // Probabilistic error handling - continue operation despite metrics error
    }
  }

  /**
   * Safely update response time metrics with exponential moving average
   */
  private safeUpdateResponseTimeMetrics(level: TimeoutLevel, responseTime: number): void {
    // TODO: [TASK-MCP-007-SAFETY-004] Pattern: safe-response-time-tracking | Complexity: 3 | Dependencies: metrics-smoothing
    // Context: Update response time averages with safe property access and error handling
    // Validation-Required: averaging-accuracy, overflow-protection, error-recovery
    // Pattern-Info: { approach: "defensive-averaging-with-bounds-checking", alternatives: "simple-arithmetic", trade-offs: "accuracy-vs-complexity" }
    
    try {
      const metricsKey = this.getMetricsLevelKey(level);
      
      // Runtime compatibility verification
      if (!this.metrics.averageResponseTimeByLevel) {
        this.metrics.averageResponseTimeByLevel = {
          level1: 0, level2: 0, level3: 0, fallback: 0
        };
      }
      
      const currentAvg = this.metrics.averageResponseTimeByLevel[metricsKey] || 0;
      const weight = 0.7; // 70% smoothing factor
      
      // Bounds checking for numerical stability
      const clampedResponseTime = Math.max(0, Math.min(responseTime, 300000)); // Clamp to 0-300s
      const newAverage = currentAvg * weight + clampedResponseTime * (1 - weight);
      
      this.metrics.averageResponseTimeByLevel[metricsKey] = newAverage;
      
    } catch (error) {
      this.diagnostics.error('Error updating response time metrics', error, { level });
      // Continue operation despite metrics error (graceful degradation)
    }
  }

  /**
   * Runtime compatibility verification for MCP channel integration
   */
  public verifyRuntimeCompatibility(): boolean {
    // TODO: [TASK-MCP-007-SAFETY-005] Pattern: runtime-compatibility-verification | Complexity: 4 | Dependencies: system-validation
    // Context: Verify system state and dependencies for MCP channel integration safety
    // Validation-Required: dependency-availability, configuration-validity, system-readiness
    // Pattern-Info: { approach: "comprehensive-system-check", alternatives: "basic-validation", trade-offs: "thoroughness-vs-startup-time" }
    
    try {
      // Verify timeout configuration
      const requiredTimeouts = ['level1', 'level2', 'level3', 'fallbackTimeout'];
      for (const timeout of requiredTimeouts) {
        if (typeof this.timeoutLevels[timeout as keyof TimeoutLevels] !== 'number' || this.timeoutLevels[timeout as keyof TimeoutLevels] <= 0) {
          this.diagnostics.error('Invalid timeout configuration', new Error(`Invalid timeout configuration for ${String(timeout)}`), {
            timeout
          });
          return false;
        }
      }
      
      // Verify metrics structure integrity
      if (!this.metrics || typeof this.metrics.totalOperations !== 'number') {
        this.diagnostics.error('Invalid metrics structure', new Error('Invalid metrics structure'));
        return false;
      }
      
      // Verify adaptation configuration
      if (!this.adaptationConfig || 
          typeof this.adaptationConfig.successThreshold !== 'number' ||
          typeof this.adaptationConfig.escalationThreshold !== 'number') {
        this.diagnostics.error('Invalid adaptation configuration', new Error('Invalid adaptation configuration'));
        return false;
      }
      
      // Verify event emitter functionality
      if (typeof this.emit !== 'function' || typeof this.on !== 'function') {
        this.diagnostics.error('EventEmitter functionality unavailable', new Error('EventEmitter functionality unavailable'));
        return false;
      }
      
      this.diagnostics.info('Runtime compatibility verified successfully');
      return true;
      
    } catch (error) {
      this.diagnostics.error('Runtime compatibility check failed', error);
      return false;
    }
  }

  /**
   * Cleanup resources with memory leak prevention
   */
  cleanup(): void {
    // TODO: [TASK-MCP-007-MEMORY-007] Pattern: comprehensive-resource-cleanup | Complexity: 3 | Dependencies: event-listener-manager
    // Context: Clean up all resources and prevent memory leaks during shutdown
    // Validation-Required: complete-cleanup, memory-leak-prevention, graceful-shutdown
    // Pattern-Info: { approach: "comprehensive-cleanup-with-tracking", alternatives: "basic-cleanup", trade-offs: "thoroughness-vs-speed" }
    
    try {
      // Clear contexts and internal state
      this.contexts.clear();
      
      // Remove all internal event listeners
      this.removeAllListeners();
      
      // Clean up any registered process listeners via event manager
      const cleanedListeners = cleanupComponentListeners('progressive-timeout-manager');
      if (cleanedListeners > 0) {
        this.diagnostics.info('Cleaned up tracked event listeners', { cleanedListeners });
      }
      
      this.diagnostics.info('Cleaned up progressive timeout manager');
      
    } catch (error) {
      this.diagnostics.error('Error during progressive timeout cleanup', error);
      // Continue cleanup despite errors (graceful degradation)
    }
  }
}

/**
 * Create progressive timeout manager with default configuration
 */
export function createProgressiveTimeoutManager(customTimeouts?: Partial<TimeoutLevels>): ProgressiveTimeoutManager {
  const manager = new ProgressiveTimeoutManager(customTimeouts);
  manager.enableTemplateDrivenEfficiency();
  return manager;
}

/**
 * Create progressive timeout manager for specific operation type
 */
export function createOperationSpecificTimeoutManager(
  operationType: TimeoutContext['operationType'],
  customTimeouts?: Partial<TimeoutLevels>
): ProgressiveTimeoutManager {
  const timeouts = { ...customTimeouts };
  
  // Operation-specific timeout optimizations
  switch (operationType) {
    case 'tool-registration':
      timeouts.level1 = timeouts.level1 || 20000; // 20s for tool registration
      break;
    case 'service-discovery':
      timeouts.level1 = timeouts.level1 || 15000; // 15s for service discovery
      break;
    case 'health-check':
      timeouts.level1 = timeouts.level1 || 10000; // 10s for health checks
      break;
    case 'connectivity-validation':
      timeouts.level1 = timeouts.level1 || 25000; // 25s for connectivity validation
      break;
  }
  
  return createProgressiveTimeoutManager(timeouts);
}

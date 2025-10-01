import { EventEmitter } from 'events';
import { createLogger, Logger } from './logger';
import { withTimeout, retry as asyncRetry, TIMEOUTS } from './async-utils';
import { handleAsync } from './error-handler';

type Severity = 'low' | 'medium' | 'high' | 'critical';

type ResilienceState = 'idle' | 'active' | 'degraded' | 'failing';

export interface FallbackTriggerThresholds {
  performanceThreshold: number; // milliseconds
  errorRateThreshold: number; // 0-100%
  timeoutThreshold: number; // milliseconds
  customTrigger?: (metrics: ResilienceMetrics) => boolean;
}

export interface FallbackStrategyResult {
  succeeded: boolean;
  strategyId: string;
  description: string;
  executedAt: number;
  durationMs: number;
  confidence: number;
  error?: unknown;
}

export interface FallbackStrategy {
  id: string;
  description: string;
  execute: () => Promise<unknown>;
  confidence: number;
  autoRecover?: boolean;
}

export interface FallbackValidationOptions {
  healthCheck: boolean;
  performanceValidation: boolean;
  functionalityTest: boolean;
}

export interface FallbackConfig {
  strategies: {
    primary: FallbackStrategy;
    secondary: FallbackStrategy;
    emergency: FallbackStrategy;
  };
  triggers: FallbackTriggerThresholds;
  validation: FallbackValidationOptions;
}

export interface MonitoringConfig {
  samplingIntervalMs: number;
  performanceBudgetMs: number;
  errorBudget: number;
  trendWindow: number;
}

export interface RollbackDecision {
  decision: 'continue' | 'rollback' | 'emergency-stop';
  confidence: number;
  reason: string;
  recommendations: string[];
  evaluatedAt: number;
}

export interface RollbackTrigger {
  condition: (metrics: ResilienceMetrics) => boolean;
  severity: Severity;
  description: string;
}

export interface RollbackConfig {
  triggers: RollbackTrigger[];
  rollbackAction: () => Promise<void>;
  emergencyAction?: () => Promise<void>;
}

export interface ResilienceMetrics {
  componentId: string;
  interfaceType: string;
  executions: number;
  failures: number;
  fallbacks: number;
  retries: number;
  averageLatencyMs: number;
  peakLatencyMs: number;
  lastError?: unknown;
  lastFallback?: FallbackStrategyResult;
  lastRollbackDecision?: RollbackDecision;
  state: ResilienceState;
  updatedAt: number;
}

export interface ResilienceReport {
  componentId: string;
  interfaceType: string;
  metrics: ResilienceMetrics;
  recommendations: string[];
  severity: Severity;
  generatedAt: number;
}

export interface ResilienceExecutionOptions<TFallback = unknown> {
  timeoutMs?: number;
  retries?: number;
  context?: string;
  onFallback?: (result: FallbackStrategyResult) => void;
  fallbackReturnValue?: TFallback;
}

const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  samplingIntervalMs: 5_000,
  performanceBudgetMs: 300,
  errorBudget: 0.1,
  trendWindow: 6
};

const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  strategies: {
    primary: {
      id: 'graceful-degradation',
      description: 'Gracefully degrade functionality',
      execute: async () => undefined,
      confidence: 0.8
    },
    secondary: {
      id: 'alternative-component',
      description: 'Switch to secondary component',
      execute: async () => undefined,
      confidence: 0.6
    },
    emergency: {
      id: 'offline-mode',
      description: 'Enter safe offline mode',
      execute: async () => undefined,
      confidence: 0.4,
      autoRecover: false
    }
  },
  triggers: {
    performanceThreshold: 500,
    errorRateThreshold: 0.2,
    timeoutThreshold: TIMEOUTS.VERY_SLOW
  },
  validation: {
    healthCheck: true,
    performanceValidation: true,
    functionalityTest: false
  }
};

const DEFAULT_ROLLBACK_CONFIG: RollbackConfig = {
  triggers: [],
  rollbackAction: async () => undefined
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

class ResilienceEventEmitter extends EventEmitter {
  emitFallbackTriggered(data: FallbackStrategyResult): boolean {
    return this.emit('fallback-triggered', data);
  }

  emitRollbackDecision(decision: RollbackDecision): boolean {
    return this.emit('rollback-decision', decision);
  }

  emitStateChanged(state: ResilienceState): boolean {
    return this.emit('state-changed', state);
  }

  emitMetricsUpdated(metrics: ResilienceMetrics): boolean {
    return this.emit('metrics-updated', metrics);
  }
}

export class ResilienceManager {
  private readonly logger: Logger;
  private readonly events = new ResilienceEventEmitter();
  private fallbackConfig: FallbackConfig = DEFAULT_FALLBACK_CONFIG;
  private monitoringConfig: MonitoringConfig = DEFAULT_MONITORING_CONFIG;
  private rollbackConfig: RollbackConfig = DEFAULT_ROLLBACK_CONFIG;
  private metrics: ResilienceMetrics;
  private monitoringTimer?: NodeJS.Timeout;
  private active = false;

  constructor(private readonly componentId: string, private readonly interfaceType: string) {
    this.logger = createLogger('resilience-manager').child(`${componentId}:${interfaceType}`);
    this.metrics = {
      componentId,
      interfaceType,
      executions: 0,
      failures: 0,
      fallbacks: 0,
      retries: 0,
      averageLatencyMs: 0,
      peakLatencyMs: 0,
      state: 'idle',
      updatedAt: Date.now()
    };
  }

  on(event: 'fallback-triggered', listener: (result: FallbackStrategyResult) => void): this;
  on(event: 'rollback-decision', listener: (decision: RollbackDecision) => void): this;
  on(event: 'state-changed', listener: (state: ResilienceState) => void): this;
  on(event: 'metrics-updated', listener: (metrics: ResilienceMetrics) => void): this;
  on(event: string, listener: (...args: any[]) => void): this {
    this.events.on(event, listener);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    this.events.off(event, listener);
    return this;
  }

  fallback(config: Partial<FallbackConfig>): ResilienceManager {
    this.fallbackConfig = {
      ...this.fallbackConfig,
      ...config,
      strategies: {
        ...this.fallbackConfig.strategies,
        ...(config.strategies ?? {})
      },
      triggers: {
        ...this.fallbackConfig.triggers,
        ...(config.triggers ?? {})
      },
      validation: {
        ...this.fallbackConfig.validation,
        ...(config.validation ?? {})
      }
    };
    return this;
  }

  monitor(config: Partial<MonitoringConfig>): ResilienceManager {
    this.monitoringConfig = {
      ...this.monitoringConfig,
      ...config
    };
    return this;
  }

  rollback(config: Partial<RollbackConfig>): ResilienceManager {
    this.rollbackConfig = {
      ...this.rollbackConfig,
      ...config,
      triggers: config.triggers ?? this.rollbackConfig.triggers
    };
    return this;
  }

  async activate(): Promise<ResilienceManager> {
    if (this.active) {
      return this;
    }
    this.logger.info('Activating resilience manager');
    this.active = true;
    this.metrics.state = 'active';
    this.metrics.updatedAt = Date.now();
    this.events.emitStateChanged(this.metrics.state);
    this.scheduleMonitoring();
    return this;
  }

  async deactivate(): Promise<void> {
    if (!this.active) {
      return;
    }
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
    this.active = false;
    this.metrics.state = 'idle';
    this.events.emitStateChanged(this.metrics.state);
  }

  async execute<T, TFallback = T>(operation: () => Promise<T>, options: ResilienceExecutionOptions<TFallback> = {}): Promise<T | TFallback> {
    if (!this.active) {
      await this.activate();
    }

    const start = Date.now();
    this.metrics.executions += 1;
    const timeout = options.timeoutMs ?? TIMEOUTS.NORMAL;
    const retries = options.retries ?? 1;

    const executeOperation = async () => {
      try {
        const result = await withTimeout(Promise.resolve(operation()), timeout);
        this.updateLatencyMetrics(Date.now() - start);
        return result;
      } catch (error) {
        this.metrics.failures += 1;
        this.metrics.lastError = error;
        this.logger.warn('Primary execution failed, evaluating resilience options', {
          context: options.context,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    };

    try {
      return await asyncRetry(executeOperation, {
        maxAttempts: retries,
        onRetry: (error, attempt, delay) => {
          this.metrics.retries += 1;
          this.logger.warn('Retrying resilient operation', {
            attempt,
            delay,
            context: options.context,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });
    } catch (error) {
      const fallbackResult = await this.executeFallbackChain(error);
      options.onFallback?.(fallbackResult);
      if (!fallbackResult.succeeded && options.fallbackReturnValue !== undefined) {
        return options.fallbackReturnValue;
      }
      if (fallbackResult.succeeded) {
        return options.fallbackReturnValue as TFallback;
      }
      throw error;
    }
  }

  getMetrics(): ResilienceMetrics {
    return { ...this.metrics };
  }

  generateReport(): ResilienceReport {
    const severity: Severity = this.metrics.state === 'failing'
      ? 'critical'
      : this.metrics.state === 'degraded'
        ? 'high'
        : 'medium';

    const recommendations: string[] = [];
    if (this.metrics.failures > 0) {
      recommendations.push('Review failure logs and ensure fallback strategies remain valid');
    }
    if (this.metrics.fallbacks > this.metrics.executions * 0.2) {
      recommendations.push('Consider improving primary reliability or tuning triggers');
    }

    return {
      componentId: this.componentId,
      interfaceType: this.interfaceType,
      metrics: this.getMetrics(),
      recommendations,
      severity,
      generatedAt: Date.now()
    };
  }

  cleanup(): void {
    void this.deactivate();
    this.events.removeAllListeners();
  }

  private updateLatencyMetrics(durationMs: number): void {
    const { executions } = this.metrics;
    this.metrics.averageLatencyMs = executions === 0
      ? durationMs
      : ((this.metrics.averageLatencyMs * (executions - 1)) + durationMs) / executions;
    this.metrics.peakLatencyMs = Math.max(this.metrics.peakLatencyMs, durationMs);
    this.metrics.updatedAt = Date.now();
    this.events.emitMetricsUpdated(this.metrics);
  }

  private async executeFallbackChain(error: unknown): Promise<FallbackStrategyResult> {
    const strategies = [
      this.fallbackConfig.strategies.primary,
      this.fallbackConfig.strategies.secondary,
      this.fallbackConfig.strategies.emergency
    ];

    for (const strategy of strategies) {
      const result = await this.executeFallback(strategy, error);
      if (result.succeeded) {
        return result;
      }
    }

    return {
      succeeded: false,
      strategyId: 'none',
      description: 'No fallback strategy succeeded',
      executedAt: Date.now(),
      durationMs: 0,
      confidence: 0,
      error
    };
  }

  private async executeFallback(strategy: FallbackStrategy, cause: unknown): Promise<FallbackStrategyResult> {
    const start = Date.now();
    this.metrics.fallbacks += 1;

    try {
      const result = await handleAsync(Promise.resolve(strategy.execute()), `resilience.fallback.${strategy.id}`);
      const duration = Date.now() - start;
      const fallbackResult: FallbackStrategyResult = {
        succeeded: true,
        strategyId: strategy.id,
        description: strategy.description,
        executedAt: Date.now(),
        durationMs: duration,
        confidence: strategy.confidence
      };
      this.metrics.lastFallback = fallbackResult;
      this.metrics.state = 'degraded';
      this.events.emitFallbackTriggered(fallbackResult);
      this.events.emitStateChanged(this.metrics.state);
      return fallbackResult;
    } catch (error) {
      const duration = Date.now() - start;
      const fallbackResult: FallbackStrategyResult = {
        succeeded: false,
        strategyId: strategy.id,
        description: strategy.description,
        executedAt: Date.now(),
        durationMs: duration,
        confidence: strategy.confidence,
        error
      };
      this.metrics.lastFallback = fallbackResult;
      this.metrics.state = 'failing';
      this.events.emitFallbackTriggered(fallbackResult);
      this.events.emitStateChanged(this.metrics.state);
      this.logger.error(
        'Fallback strategy failed',
        error instanceof Error ? error : undefined,
        {
          strategyId: strategy.id,
          cause: cause instanceof Error ? cause.message : String(cause)
        }
      );
      return fallbackResult;
    }
  }

  private scheduleMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = setInterval(() => {
      try {
        const decision = this.evaluateRollbackDecision();
        this.metrics.lastRollbackDecision = decision;
        if (decision.decision !== 'continue') {
          void this.executeRollback(decision);
        }
        this.events.emitMetricsUpdated(this.metrics);
      } catch (error) {
        this.logger.error(
          'Error during resilience monitoring',
          error instanceof Error ? error : undefined,
          {
            componentId: this.componentId,
            interfaceType: this.interfaceType
          }
        );
      }
    }, this.monitoringConfig.samplingIntervalMs);
  }

  private evaluateRollbackDecision(): RollbackDecision {
    const metrics = this.metrics;
    const triggers = this.rollbackConfig.triggers ?? [];

    for (const trigger of triggers) {
      if (trigger.condition(metrics)) {
        const recommendation = trigger.severity === 'critical' ? 'Execute emergency action immediately' : 'Perform standard rollback and investigate';
        const decision: RollbackDecision = {
          decision: trigger.severity === 'critical' ? 'emergency-stop' : 'rollback',
          confidence: trigger.severity === 'critical' ? 0.95 : 0.85,
          reason: trigger.description,
          recommendations: [recommendation],
          evaluatedAt: Date.now()
        };
        this.events.emitRollbackDecision(decision);
        return decision;
      }
    }

    return {
      decision: 'continue',
      confidence: 0.9,
      reason: 'Within resilience thresholds',
      recommendations: [],
      evaluatedAt: Date.now()
    };
  }

  private async executeRollback(decision: RollbackDecision): Promise<void> {
    if (decision.decision === 'continue') {
      return;
    }

    this.logger.warn('Executing rollback decision', decision);
    if (decision.decision === 'emergency-stop' && this.rollbackConfig.emergencyAction) {
      await handleAsync(Promise.resolve(this.rollbackConfig.emergencyAction()), 'resilience.emergencyAction');
    } else {
      await handleAsync(Promise.resolve(this.rollbackConfig.rollbackAction()), 'resilience.rollbackAction');
    }

    this.metrics.state = 'degraded';
    this.metrics.updatedAt = Date.now();
    this.events.emitStateChanged(this.metrics.state);
  }
}

export class ResilienceUtils {
  private static instances = new Map<string, ResilienceManager>();

  static for(componentId: string, interfaceType = 'default'): ResilienceManager {
    const key = `${componentId}:${interfaceType}`;
    if (!this.instances.has(key)) {
      this.instances.set(key, new ResilienceManager(componentId, interfaceType));
    }
    return this.instances.get(key)!;
  }

  static cleanup(): void {
    for (const manager of this.instances.values()) {
      manager.cleanup();
    }
    this.instances.clear();
  }
}

export const resilienceUtils = ResilienceUtils;
export const forComponentResilience = ResilienceUtils.for.bind(ResilienceUtils);
export const cleanupResilienceManagers = ResilienceUtils.cleanup.bind(ResilienceUtils);


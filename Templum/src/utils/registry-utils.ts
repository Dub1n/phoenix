import { EventEmitter } from 'events';
import { createLogger, Logger } from './logger';
import { handleAsync } from './error-handler';
import { withTimeout } from './async-utils';

export interface PerformanceMetrics {
  averageResolveTimeMs: number;
  maxResolveTimeMs: number;
  registeredComponents: number;
  activeComponents: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ComponentValidationStatus {
  name: string;
  valid: boolean;
  issues: string[];
  interfaceCompliance: boolean;
  methodAvailability: boolean;
  initializationStatus: 'pending' | 'initialized' | 'failed';
  confidenceScore: number;
}

export interface DependencyWiringStatus {
  component: string;
  dependencies: string[];
  missingDependencies: string[];
  circularDependency?: string[];
}

export interface IntegrityValidation {
  consistent: boolean;
  issues: string[];
}

export interface ValidationReport {
  timestamp: number;
  overallValid: boolean;
  validationLevel: 'strict' | 'standard' | 'relaxed';
  componentValidation: ComponentValidationStatus[];
  dependencyWiring: DependencyWiringStatus[];
  integrityValidation: IntegrityValidation;
  recommendations: string[];
  executionTime: number;
  confidenceScore: number;
}

export interface SystemInsight {
  category: 'performance' | 'reliability' | 'security' | 'maintainability';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  recommendation?: string;
  confidenceLevel: number;
}

export interface RecommendedAction {
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export interface RegistryIntelligence {
  healthScore: number;
  performanceMetrics: PerformanceMetrics;
  validationReport: ValidationReport;
  systemInsights: SystemInsight[];
  recommendedActions: RecommendedAction[];
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface LifecycleConfiguration {
  enableValidation: boolean;
  validationLevel: 'strict' | 'standard' | 'relaxed';
  enableIntelligence: boolean;
  intelligenceUpdateInterval: number;
  enablePerformanceMonitoring: boolean;
  lifecycleTimeout: number;
}

export interface ComponentRegistration<TComponent> {
  name: string;
  factory: () => TComponent | Promise<TComponent>;
  dependencies?: string[];
  lifecycle?: {
    eager?: boolean;
    dispose?: (component: TComponent) => Promise<void> | void;
  };
  metadata?: Record<string, unknown>;
}

export interface RegistryMetrics {
  initializedAt?: number;
  disposedAt?: number;
  resolveCount: number;
  cacheHits: number;
  cacheMisses: number;
}

const DEFAULT_CONFIGURATION: LifecycleConfiguration = {
  enableValidation: true,
  validationLevel: 'standard',
  enableIntelligence: true,
  intelligenceUpdateInterval: 30_000,
  enablePerformanceMonitoring: true,
  lifecycleTimeout: 10_000
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export abstract class BaseRegistry<TComponent, TConfig = unknown> extends EventEmitter {
  protected readonly components = new Map<string, TComponent>();
  protected readonly registrations = new Map<string, ComponentRegistration<TComponent>>();
  protected readonly config: LifecycleConfiguration;
  protected readonly logger: Logger;
  protected readonly metrics: RegistryMetrics = {
    resolveCount: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  protected validationReport: ValidationReport | null = null;
  protected intelligence: RegistryIntelligence | null = null;
  private intelligenceTimer?: NodeJS.Timeout;
  private initialized = false;

  protected constructor(configuration: Partial<LifecycleConfiguration> = {}, loggerContext = 'registry-utils') {
    super();
    this.config = {
      ...DEFAULT_CONFIGURATION,
      ...configuration
    };
    this.logger = createLogger(loggerContext);
  }

  async initialize(config?: TConfig): Promise<void> {
    if (this.initialized) {
      return;
    }

    const start = Date.now();
    this.logger.info('Initializing registry', { config: this.config });

    await handleAsync(this.onBeforeInitialize(config), 'registry.beforeInitialize');

    for (const registration of this.registrations.values()) {
      if (registration.lifecycle?.eager) {
        await this.resolve(registration.name, config);
      }
    }

    this.initialized = true;
    this.metrics.initializedAt = Date.now();

    if (this.config.enableValidation) {
      this.validationReport = await this.validate('post-initialize');
    }

    if (this.config.enableIntelligence) {
      this.intelligence = await this.generateIntelligence();
      this.scheduleIntelligenceUpdates();
    }

    await handleAsync(this.onAfterInitialize(config), 'registry.afterInitialize');
    this.logger.info('Registry initialization completed', { durationMs: Date.now() - start });
    this.emit('initialized', { config, durationMs: Date.now() - start });
  }

  async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    if (this.intelligenceTimer) {
      clearInterval(this.intelligenceTimer);
      this.intelligenceTimer = undefined;
    }

    await handleAsync(this.onBeforeDispose(), 'registry.beforeDispose');

    for (const [name, component] of this.components) {
      const registration = this.registrations.get(name);
      if (registration?.lifecycle?.dispose) {
        await handleAsync(Promise.resolve(registration.lifecycle.dispose(component)), 'registry.disposeComponent');
      }
    }

    this.components.clear();
    this.metrics.disposedAt = Date.now();
    this.initialized = false;

    await handleAsync(this.onAfterDispose(), 'registry.afterDispose');
    this.emit('disposed');
  }

  protected abstract onBeforeInitialize(config?: TConfig): Promise<void> | void;
  protected abstract onAfterInitialize(config?: TConfig): Promise<void> | void;
  protected abstract onBeforeDispose(): Promise<void> | void;
  protected abstract onAfterDispose(): Promise<void> | void;
  protected abstract validateComponent(component: TComponent, registration: ComponentRegistration<TComponent>): Promise<ComponentValidationStatus> | ComponentValidationStatus;

  register(registration: ComponentRegistration<TComponent>): void {
    if (this.registrations.has(registration.name)) {
      throw new Error(`Component "${registration.name}" is already registered`);
    }
    this.registrations.set(registration.name, registration);
    this.emit('registered', { name: registration.name, registration });
  }

  unregister(name: string): void {
    if (!this.registrations.has(name)) {
      return;
    }
    this.registrations.delete(name);
    this.components.delete(name);
    this.emit('unregistered', { name });
  }

  has(name: string): boolean {
    return this.registrations.has(name);
  }

  async resolve(name: string, config?: TConfig): Promise<TComponent> {
    if (!this.registrations.has(name)) {
      throw new Error(`Component "${name}" is not registered`);
    }

    if (this.components.has(name)) {
      this.metrics.cacheHits += 1;
      return this.components.get(name)!;
    }

    this.metrics.cacheMisses += 1;
    this.metrics.resolveCount += 1;

    const registration = this.registrations.get(name)!;
    const resolved = await withTimeout(
      Promise.resolve(registration.factory()),
      this.config.lifecycleTimeout
    );

    this.components.set(name, resolved);
    this.emit('resolved', { name, component: resolved });

    if (this.config.enableValidation && this.initialized) {
      const componentStatus = await this.validateComponent(resolved, registration);
      if (!componentStatus.valid) {
        this.logger.warn('Component validation failed after resolve', {
          component: name,
          issues: componentStatus.issues
        });
      }
    }

    return resolved;
  }

  getRegisteredComponents(): string[] {
    return [...this.registrations.keys()];
  }

  getValidationReport(): ValidationReport | null {
    return this.validationReport;
  }

  getIntelligence(): RegistryIntelligence | null {
    return this.intelligence;
  }

  async validate(context: string = 'manual'): Promise<ValidationReport> {
    const start = Date.now();
    const componentStatuses: ComponentValidationStatus[] = [];
    const dependencyStatuses: DependencyWiringStatus[] = [];
    const recommendations: string[] = [];

    for (const [name, registration] of this.registrations) {
      const component = this.components.get(name) ?? null;
      if (!component) {
        componentStatuses.push({
          name,
          valid: false,
          issues: ['Component has not been resolved'],
          interfaceCompliance: false,
          methodAvailability: false,
          initializationStatus: 'pending',
          confidenceScore: 0.4
        });
        continue;
      }

      const status = await this.validateComponent(component, registration);
      componentStatuses.push(status);
      if (!status.valid) {
        recommendations.push(`Investigate component ${name}: ${status.issues.join(', ')}`);
      }

      if (registration.dependencies?.length) {
        const missing = registration.dependencies.filter(dep => !this.components.has(dep));
        dependencyStatuses.push({
          component: name,
          dependencies: registration.dependencies,
          missingDependencies: missing,
          circularDependency: this.detectCircularDependency(name, registration.dependencies)
        });
        if (missing.length > 0) {
          recommendations.push(`Wire missing dependencies for ${name}: ${missing.join(', ')}`);
        }
      }
    }

    const inconsistentComponents = componentStatuses.filter(status => !status.valid).map(status => status.name);
    const integrityValidation: IntegrityValidation = {
      consistent: inconsistentComponents.length === 0,
      issues: inconsistentComponents
    };

    const confidenceScore = clamp(
      componentStatuses.reduce((acc, status) => acc + status.confidenceScore, 0) / Math.max(1, componentStatuses.length),
      0,
      1
    );

    this.validationReport = {
      timestamp: Date.now(),
      overallValid: integrityValidation.consistent,
      validationLevel: this.config.validationLevel,
      componentValidation: componentStatuses,
      dependencyWiring: dependencyStatuses,
      integrityValidation,
      recommendations,
      executionTime: Date.now() - start,
      confidenceScore
    };

    this.emit('validated', { context, report: this.validationReport });
    return this.validationReport;
  }

  protected async generateIntelligence(): Promise<RegistryIntelligence> {
    const performance: PerformanceMetrics = {
      averageResolveTimeMs: this.metrics.resolveCount === 0 ? 0 : this.metrics.cacheMisses / this.metrics.resolveCount,
      maxResolveTimeMs: 0,
      registeredComponents: this.registrations.size,
      activeComponents: this.components.size,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses
    };

    const validation = this.validationReport ?? await this.validate('intelligence-update');

    const insights: SystemInsight[] = [];
    if (!validation.overallValid) {
      insights.push({
        category: 'maintainability',
        severity: 'warning',
        message: 'One or more components failed validation',
        recommendation: 'Review validation report for remediation steps',
        confidenceLevel: validation.confidenceScore
      });
    }

    if (performance.cacheMisses > performance.cacheHits) {
      insights.push({
        category: 'performance',
        severity: 'info',
        message: 'High cache miss ratio detected',
        recommendation: 'Consider eager initialization for frequently resolved components',
        confidenceLevel: 0.8
      });
    }

    const actions: RecommendedAction[] = validation.recommendations.map(recommendation => ({
      description: recommendation,
      priority: recommendation.toLowerCase().includes('missing') ? 'high' : 'medium',
      confidence: validation.confidenceScore
    }));

    const healthScore = clamp(
      (validation.confidenceScore * 0.6) + ((1 - performance.cacheMisses / Math.max(1, performance.cacheHits + performance.cacheMisses)) * 0.4),
      0,
      1
    );

    const intelligence: RegistryIntelligence = {
      healthScore: healthScore * 100,
      performanceMetrics: performance,
      validationReport: validation,
      systemInsights: insights,
      recommendedActions: actions,
      confidenceLevel: healthScore > 0.75 ? 'high' : healthScore > 0.5 ? 'medium' : 'low'
    };

    this.emit('intelligence', intelligence);
    return intelligence;
  }

  private detectCircularDependency(component: string, dependencies: string[]): string[] | undefined {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const visit = (current: string): boolean => {
      if (!this.registrations.has(current)) {
        return false;
      }
      if (stack.has(current)) {
        return true;
      }
      if (visited.has(current)) {
        return false;
      }

      visited.add(current);
      stack.add(current);
      const deps = this.registrations.get(current)?.dependencies ?? [];
      for (const dep of deps) {
        if (visit(dep)) {
          stack.add(dep);
          return true;
        }
      }
      stack.delete(current);
      return false;
    };

    const hasCycle = visit(component);
    if (!hasCycle) {
      return undefined;
    }
    return [...stack];
  }

  private scheduleIntelligenceUpdates(): void {
    if (this.intelligenceTimer) {
      clearInterval(this.intelligenceTimer);
    }

    this.intelligenceTimer = setInterval(() => {
      void this.generateIntelligence().then(intelligence => {
        this.intelligence = intelligence;
      }).catch(error => {
        this.logger.error('Failed to generate registry intelligence', {
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }, this.config.intelligenceUpdateInterval);
  }
}


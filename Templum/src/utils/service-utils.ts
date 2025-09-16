import { EventEmitter } from 'events';
import { createLogger, Logger } from './logger';
import { withTimeout, retry as asyncRetry, TIMEOUTS } from './async-utils';
import { handleAsync } from './error-handler';

export type ServiceProtocol = 'http' | 'https' | 'ipc' | 'ws' | 'custom';

export interface ServiceRegistration {
  id: string;
  name: string;
  description?: string;
  protocol: ServiceProtocol;
  endpoint?: string;
  version?: string;
  tags?: string[];
  capabilities?: string[];
  confidence?: number;
  discoverySource?: 'registry' | 'config' | 'scan' | 'manual';
  metadata?: Record<string, unknown>;
  healthCheck?: () => Promise<ServiceHealthCheckResult>;
  validator?: (service: ServiceRegistration) => Promise<ServiceValidationResult> | ServiceValidationResult;
}

export interface ServiceHealthCheckResult {
  serviceId: string;
  isHealthy: boolean;
  responseTimeMs: number;
  timestamp: number;
  details?: Record<string, unknown>;
}

export interface ServiceValidationResult {
  serviceId: string;
  isValid: boolean;
  confidence: number;
  issues: string[];
  metrics?: Record<string, unknown>;
}

export interface ServiceMetrics {
  serviceId: string;
  availability: number;
  averageResponseTime: number;
  responseTimeSamples: number[];
  consecutiveFailures: number;
  lastCheckedAt?: number;
  lastHealthyAt?: number;
  lastFailureAt?: number;
}

export interface DiscoveryIntelligence {
  totalDiscovered: number;
  discoveryMethods: Record<string, number>;
  avgConfidence: number;
  discoveryLatency: number;
  fileWatchingActive: boolean;
  staleSevices: number;
}

export interface ValidationIntelligence {
  validationCoverage: number;
  avgValidationTime: number;
  validationSuccessRate: number;
  capabilityProfilesComplete: number;
  healthCheckSuccessRate: number;
}

export interface HealthIntelligence {
  avgResponseTime: number;
  healthyServices: number;
  unhealthyServices: number;
  healthCheckLatency: number;
}

export interface PerformanceIntelligence {
  averageLatency: number;
  peakLatency: number;
  errorRate: number;
  throughput: number;
}

export interface ReliabilityIntelligence {
  uptimePercentage: number;
  degradedServices: number;
  failedServices: number;
}

export interface ServiceInsight {
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'health' | 'performance' | 'reliability' | 'discovery';
  message: string;
  recommendation?: string;
  confidence: number;
}

export interface ServiceAction {
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export interface ServiceIntelligence {
  timestamp: number;
  serviceCount: number;
  healthScore: number;
  discoveryMetrics: DiscoveryIntelligence;
  validationMetrics: ValidationIntelligence;
  healthMetrics: HealthIntelligence;
  performanceMetrics: PerformanceIntelligence;
  reliabilityMetrics: ReliabilityIntelligence;
  systemInsights: ServiceInsight[];
  recommendedActions: ServiceAction[];
  confidenceLevel: 'high' | 'medium' | 'low';
}

export interface ServiceDiscoveryStrategy {
  id: string;
  description: string;
  discover: () => Promise<ServiceRegistration[]>;
  intervalMs?: number;
}

interface ServiceRecord {
  registration: ServiceRegistration;
  metrics: ServiceMetrics;
  validation?: ServiceValidationResult;
  lastUpdatedAt: number;
  discoverySource: string;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const DEFAULT_HEALTH_CHECK_INTERVAL = 30_000;
const MAX_RESPONSE_HISTORY = 20;

export class ServiceUtils extends EventEmitter {
  private readonly services = new Map<string, ServiceRecord>();
  private readonly discoveryStrategies = new Map<string, ServiceDiscoveryStrategy>();
  private readonly discoveryTimers = new Map<string, NodeJS.Timeout>();
  private readonly healthCheckTimers = new Map<string, NodeJS.Timeout>();
  private readonly logger: Logger;

  constructor(logger: Logger = createLogger('service-utils')) {
    super();
    this.logger = logger;
  }

  register(service: ServiceRegistration): void {
    const existing = this.services.get(service.id);
    const record: ServiceRecord = {
      registration: {
        ...service,
        confidence: clamp(service.confidence ?? 0.8, 0, 1)
      },
      metrics: existing?.metrics ?? {
        serviceId: service.id,
        availability: 1,
        averageResponseTime: 0,
        responseTimeSamples: [],
        consecutiveFailures: 0,
        lastCheckedAt: undefined,
        lastHealthyAt: undefined,
        lastFailureAt: undefined
      },
      validation: existing?.validation,
      lastUpdatedAt: Date.now(),
      discoverySource: service.discoverySource ?? 'manual'
    };

    this.services.set(service.id, record);
    this.emit('serviceRegistered', { service: record });

    if (service.healthCheck && !this.healthCheckTimers.has(service.id)) {
      this.scheduleHealthCheck(service.id);
    }
  }

  unregister(serviceId: string): void {
    if (!this.services.has(serviceId)) {
      return;
    }
    this.services.delete(serviceId);
    const timer = this.healthCheckTimers.get(serviceId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(serviceId);
    }
    this.emit('serviceUnregistered', { serviceId });
  }

  registerDiscoveryStrategy(strategy: ServiceDiscoveryStrategy): void {
    if (this.discoveryStrategies.has(strategy.id)) {
      throw new Error(`Discovery strategy ${strategy.id} already registered`);
    }
    this.discoveryStrategies.set(strategy.id, strategy);
    this.emit('discoveryStrategyRegistered', strategy);

    if (strategy.intervalMs && strategy.intervalMs > 0) {
      const timer = setInterval(() => {
        void this.executeDiscovery(strategy.id);
      }, strategy.intervalMs);
      this.discoveryTimers.set(strategy.id, timer);
    }
  }

  async executeDiscovery(strategyId: string): Promise<ServiceRegistration[]> {
    const strategy = this.discoveryStrategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Discovery strategy ${strategyId} is not registered`);
    }

    this.logger.info('Executing service discovery strategy', { strategyId });
    const start = Date.now();
    const registrations = await handleAsync(strategy.discover(), `service-discovery.${strategyId}`);

    for (const registration of registrations) {
      this.register({
        ...registration,
        discoverySource: strategyId
      });
    }

    this.emit('servicesDiscovered', { strategyId, durationMs: Date.now() - start, count: registrations.length });
    return registrations;
  }

  async runHealthChecks(): Promise<void> {
    const servicesWithHealth = [...this.services.values()].filter(record => !!record.registration.healthCheck);
    for (const record of servicesWithHealth) {
      await this.runHealthCheck(record.registration.id);
    }
  }

  async runHealthCheck(serviceId: string): Promise<ServiceHealthCheckResult | null> {
    const record = this.services.get(serviceId);
    if (!record || !record.registration.healthCheck) {
      return null;
    }

    const start = Date.now();
    try {
      const result = await withTimeout(
        Promise.resolve(record.registration.healthCheck()),
        TIMEOUTS.SLOW
      );

      this.updateHealthMetrics(record, {
        ...result,
        responseTimeMs: result.responseTimeMs ?? Date.now() - start,
        timestamp: Date.now()
      });

      this.emit('healthCheckCompleted', { serviceId, result });
      return result;
    } catch (error) {
      this.updateHealthMetrics(record, {
        serviceId,
        isHealthy: false,
        responseTimeMs: Date.now() - start,
        timestamp: Date.now(),
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      this.emit('healthCheckFailed', { serviceId, error });
      return null;
    }
  }

  async validateService(serviceId: string): Promise<ServiceValidationResult | null> {
    const record = this.services.get(serviceId);
    if (!record) {
      return null;
    }

    const validator = record.registration.validator;
    if (!validator) {
      return null;
    }

    const result = await handleAsync(Promise.resolve(validator(record.registration)), 'service-utils.validate');
    record.validation = result;
    record.lastUpdatedAt = Date.now();
    this.emit('serviceValidated', { serviceId, result });
    return result;
  }

  getService(serviceId: string): ServiceRegistration | undefined {
    return this.services.get(serviceId)?.registration;
  }

  listServices(): ServiceRegistration[] {
    return [...this.services.values()].map(record => record.registration);
  }

  getServiceHealth(serviceId: string): ServiceMetrics | undefined {
    return this.services.get(serviceId)?.metrics;
  }

  getPerformanceMetrics(): Record<string, ServiceMetrics> {
    const metrics: Record<string, ServiceMetrics> = {};
    for (const [serviceId, record] of this.services) {
      metrics[serviceId] = record.metrics;
    }
    return metrics;
  }

  async generateIntelligenceBriefing(): Promise<ServiceIntelligence> {
    const serviceCount = this.services.size;
    const discoveryMetrics: DiscoveryIntelligence = {
      totalDiscovered: serviceCount,
      discoveryMethods: {},
      avgConfidence: 0,
      discoveryLatency: 0,
      fileWatchingActive: [...this.discoveryTimers.values()].some(timer => timer?.hasRef?.() ?? false),
      staleSevices: 0
    };

    const validationMetrics: ValidationIntelligence = {
      validationCoverage: 0,
      avgValidationTime: 0,
      validationSuccessRate: 0,
      capabilityProfilesComplete: 0,
      healthCheckSuccessRate: 0
    };

    const healthMetrics: HealthIntelligence = {
      avgResponseTime: 0,
      healthyServices: 0,
      unhealthyServices: 0,
      healthCheckLatency: 0
    };

    const performanceMetrics: PerformanceIntelligence = {
      averageLatency: 0,
      peakLatency: 0,
      errorRate: 0,
      throughput: 0
    };

    const reliabilityMetrics: ReliabilityIntelligence = {
      uptimePercentage: 1,
      degradedServices: 0,
      failedServices: 0
    };

    const insights: ServiceInsight[] = [];
    const actions: ServiceAction[] = [];

    let confidenceAccumulator = 0;
    let validationCount = 0;
    let validationSuccess = 0;
    let totalResponseTime = 0;
    let totalHealthChecks = 0;
    let successfulHealthChecks = 0;
    let totalFailures = 0;

    for (const record of this.services.values()) {
      discoveryMetrics.discoveryMethods[record.discoverySource] = (discoveryMetrics.discoveryMethods[record.discoverySource] ?? 0) + 1;
      confidenceAccumulator += record.registration.confidence ?? 0.8;

      if (record.validation) {
        validationCount += 1;
        if (record.validation.isValid) {
          validationSuccess += 1;
        }
      }

      if (record.metrics.responseTimeSamples.length > 0) {
        const average = record.metrics.responseTimeSamples.reduce((sum, sample) => sum + sample, 0) / record.metrics.responseTimeSamples.length;
        totalResponseTime += average;
        performanceMetrics.peakLatency = Math.max(performanceMetrics.peakLatency, Math.max(...record.metrics.responseTimeSamples));
        totalHealthChecks += record.metrics.responseTimeSamples.length;
        successfulHealthChecks += record.metrics.responseTimeSamples.filter(() => record.metrics.consecutiveFailures === 0).length;
        performanceMetrics.throughput += record.metrics.responseTimeSamples.length;
      }

      if (!record.metrics.lastHealthyAt || (record.metrics.lastFailureAt && record.metrics.lastFailureAt > record.metrics.lastHealthyAt)) {
        healthMetrics.unhealthyServices += 1;
        totalFailures += record.metrics.consecutiveFailures;
      } else {
        healthMetrics.healthyServices += 1;
      }

      if (record.metrics.consecutiveFailures > 0) {
        reliabilityMetrics.degradedServices += 1;
      }

      if (record.metrics.consecutiveFailures > 3) {
        reliabilityMetrics.failedServices += 1;
        insights.push({
          severity: 'error',
          category: 'reliability',
          message: `Service ${record.registration.name} is repeatedly failing health checks`,
          recommendation: 'Investigate service health and restart if necessary',
          confidence: 0.9
        });
        actions.push({
          description: `Escalate incident for service ${record.registration.name}`,
          priority: 'high',
          confidence: 0.95
        });
      }
    }

    discoveryMetrics.avgConfidence = serviceCount === 0 ? 0 : confidenceAccumulator / serviceCount;
    validationMetrics.validationCoverage = serviceCount === 0 ? 0 : validationCount / serviceCount;
    validationMetrics.validationSuccessRate = validationCount === 0 ? 0 : validationSuccess / validationCount;
    validationMetrics.healthCheckSuccessRate = totalHealthChecks === 0 ? 0 : successfulHealthChecks / totalHealthChecks;
    healthMetrics.avgResponseTime = serviceCount === 0 ? 0 : totalResponseTime / serviceCount;
    healthMetrics.healthCheckLatency = totalHealthChecks === 0 ? 0 : healthMetrics.avgResponseTime;
    performanceMetrics.averageLatency = healthMetrics.avgResponseTime;
    performanceMetrics.errorRate = totalHealthChecks === 0 ? 0 : totalFailures / totalHealthChecks;
    reliabilityMetrics.uptimePercentage = serviceCount === 0 ? 1 : clamp((serviceCount - reliabilityMetrics.degradedServices) / serviceCount, 0, 1);

    if (performanceMetrics.errorRate > 0.2) {
      insights.push({
        severity: 'warning',
        category: 'performance',
        message: 'Elevated error rate detected across service mesh',
        recommendation: 'Investigate failing services and adjust resilience policies',
        confidence: 0.85
      });
      actions.push({
        description: 'Review resilience configuration for services with repeated failures',
        priority: 'medium',
        confidence: 0.85
      });
    }

    const healthScore = clamp(
      (validationMetrics.validationSuccessRate * 0.4) +
      ((1 - performanceMetrics.errorRate) * 0.3) +
      ((healthMetrics.healthyServices / Math.max(1, serviceCount)) * 0.2) +
      (discoveryMetrics.avgConfidence * 0.1),
      0,
      1
    );

    const intelligence: ServiceIntelligence = {
      timestamp: Date.now(),
      serviceCount,
      healthScore: healthScore * 100,
      discoveryMetrics,
      validationMetrics,
      healthMetrics,
      performanceMetrics,
      reliabilityMetrics,
      systemInsights: insights,
      recommendedActions: actions,
      confidenceLevel: healthScore > 0.75 ? 'high' : healthScore > 0.5 ? 'medium' : 'low'
    };

    this.emit('intelligenceUpdated', { intelligence });
    return intelligence;
  }

  private scheduleHealthCheck(serviceId: string): void {
    const record = this.services.get(serviceId);
    if (!record?.registration.healthCheck) {
      return;
    }

    if (this.healthCheckTimers.has(serviceId)) {
      clearInterval(this.healthCheckTimers.get(serviceId)!);
    }

    const timer = setInterval(() => {
      void this.runHealthCheck(serviceId);
    }, DEFAULT_HEALTH_CHECK_INTERVAL);
    this.healthCheckTimers.set(serviceId, timer);
  }

  private updateHealthMetrics(record: ServiceRecord, result: ServiceHealthCheckResult): void {
    record.metrics.lastCheckedAt = result.timestamp;
    if (result.isHealthy) {
      record.metrics.consecutiveFailures = 0;
      record.metrics.lastHealthyAt = result.timestamp;
      record.registration.confidence = clamp((record.registration.confidence ?? 0.6) * 0.9 + 0.1, 0, 1);
    } else {
      record.metrics.consecutiveFailures += 1;
      record.metrics.lastFailureAt = result.timestamp;
      record.registration.confidence = clamp((record.registration.confidence ?? 0.6) * 0.7, 0, 1);
    }

    record.metrics.responseTimeSamples.push(result.responseTimeMs);
    if (record.metrics.responseTimeSamples.length > MAX_RESPONSE_HISTORY) {
      record.metrics.responseTimeSamples.shift();
    }

    const total = record.metrics.responseTimeSamples.reduce((sum, sample) => sum + sample, 0);
    record.metrics.averageResponseTime = record.metrics.responseTimeSamples.length === 0 ? 0 : total / record.metrics.responseTimeSamples.length;
    record.metrics.availability = record.metrics.consecutiveFailures === 0 ? 1 : clamp(1 - (record.metrics.consecutiveFailures / 5), 0, 1);

    this.emit('serviceHealthUpdated', { serviceId: record.registration.id, metrics: record.metrics });
  }
}

export const serviceUtils = new ServiceUtils();

export const registerService = (registration: ServiceRegistration): void => {
  serviceUtils.register(registration);
};

export const unregisterService = (serviceId: string): void => {
  serviceUtils.unregister(serviceId);
};

export const registerServiceDiscoveryStrategy = (strategy: ServiceDiscoveryStrategy): void => {
  serviceUtils.registerDiscoveryStrategy(strategy);
};

export const executeServiceDiscovery = (strategyId: string): Promise<ServiceRegistration[]> => {
  return serviceUtils.executeDiscovery(strategyId);
};

export const runServiceHealthChecks = (): Promise<void> => {
  return serviceUtils.runHealthChecks();
};

export const runServiceHealthCheck = (serviceId: string): Promise<ServiceHealthCheckResult | null> => {
  return serviceUtils.runHealthCheck(serviceId);
};

export const validateRegisteredService = (serviceId: string): Promise<ServiceValidationResult | null> => {
  return serviceUtils.validateService(serviceId);
};

export const getRegisteredService = (serviceId: string): ServiceRegistration | undefined => {
  return serviceUtils.getService(serviceId);
};

export const listRegisteredServices = (): ServiceRegistration[] => {
  return serviceUtils.listServices();
};

export const getServiceHealthMetrics = (serviceId: string): ServiceMetrics | undefined => {
  return serviceUtils.getServiceHealth(serviceId);
};

export const getServicePerformanceMetrics = (): Record<string, ServiceMetrics> => {
  return serviceUtils.getPerformanceMetrics();
};

export const generateServiceIntelligenceBriefing = (): Promise<ServiceIntelligence> => {
  return serviceUtils.generateIntelligenceBriefing();
};

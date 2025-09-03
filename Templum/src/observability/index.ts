/**---
- title: Templum Observability - Module Exports
- tags: [Observability, Infrastructure, Index, Export]
- provides: [All Observability Components, Interfaces, Types]
- requires: [Observability System, Observability Adapter]
- description: [Central export module for all Templum observability infrastructure components and interfaces]        
- ---*/

// Import types for local use in helper functions
import {
    TemplumObservabilitySystem,
    type ObservabilityConfig
} from './templum-observability-system';


// Core observability system - Re-export all types and classes
export {
  TemplumObservabilitySystem,
  ObservabilityLogger,
  MetricsCollector,
  AlertManager,
  type LogLevel,
  type MetricType,
  type AlertSeverity,
  type OutputFormat,
  type LogEntry,
  type MetricEntry,
  type AlertRule,
  type Alert,
  type ObservabilityConfig
} from './templum-observability-system';

// Adapter for dependency injection
export {
  ObservabilityAdapter,
  IObservabilityService,
  createObservabilityAdapter,
  createObservabilityAdapterWithConfig,
  createDevelopmentObservabilityAdapter,
  createProductionObservabilityAdapter
} from './observability-adapter';

// Default configurations
export const OBSERVABILITY_DEFAULTS = {
  DEVELOPMENT: {
    logging: {
      level: 'debug' as const,
      outputs: ['console' as const],
      includeStackTrace: true,
      maxLogBufferSize: 500,
    },
    metrics: {
      enabled: true,
      collectionInterval: 5000,
      bufferSize: 500,
      retentionPeriod: 1800000, // 30 minutes
      enableHistograms: true,
    },
    alerting: {
      enabled: false,
      rules: [],
      channels: ['console' as const],
      evaluationInterval: 30000,
    },
    performance: {
      enableTracing: true,
      tracingThreshold: 50,
      enableProfiling: false,
      memoryMonitoring: true,
    },
  },
  PRODUCTION: {
    logging: {
      level: 'info' as const,
      outputs: ['structured' as const, 'file' as const],
      includeStackTrace: false,
      maxLogBufferSize: 2000,
      logFilePath: './logs/templum.log',
    },
    metrics: {
      enabled: true,
      collectionInterval: 15000,
      bufferSize: 2000,
      retentionPeriod: 7200000, // 2 hours
      enableHistograms: true,
    },
    alerting: {
      enabled: true,
      rules: [
        {
          id: 'high_error_rate',
          name: 'High Error Rate',
          condition: 'error_rate > 0.05',
          severity: 'high' as const,
          enabled: true,
          cooldown: 300000,
          description: 'Error rate above 5%'
        },
        {
          id: 'slow_response_time',
          name: 'Slow Response Time',
          condition: 'response_time > 2000',
          severity: 'medium' as const,
          enabled: true,
          cooldown: 600000,
          description: 'P95 response time above 2000ms'
        },
        {
          id: 'high_memory_usage',
          name: 'High Memory Usage',
          condition: 'memory_usage > 1024',
          severity: 'medium' as const,
          enabled: true,
          cooldown: 900000,
          description: 'Memory usage above 1GB'
        }
      ],
      channels: ['console' as const],
      evaluationInterval: 60000,
    },
    performance: {
      enableTracing: false,
      tracingThreshold: 500,
      enableProfiling: false,
      memoryMonitoring: true,
    },
  }
};

// Common alert rules
export const COMMON_ALERT_RULES = {
  HIGH_ERROR_RATE: {
    id: 'high_error_rate',
    name: 'High Error Rate',
    condition: 'error_rate > 0.05',
    severity: 'high' as const,
    enabled: true,
    cooldown: 300000,
    description: 'Error rate above 5%'
  },
  SLOW_RESPONSE_TIME: {
    id: 'slow_response_time',
    name: 'Slow Response Time',
    condition: 'response_time > 1000',
    severity: 'medium' as const,
    enabled: true,
    cooldown: 300000,
    description: 'P95 response time above 1000ms'
  },
  HIGH_MEMORY_USAGE: {
    id: 'high_memory_usage',
    name: 'High Memory Usage',
    condition: 'memory_usage > 512',
    severity: 'medium' as const,
    enabled: true,
    cooldown: 600000,
    description: 'Memory usage above 512MB'
  },
  BACKEND_DISCONNECTION: {
    id: 'backend_disconnection',
    name: 'Backend Service Disconnection',
    condition: 'connected_backends < 1',
    severity: 'critical' as const,
    enabled: true,
    cooldown: 180000,
    description: 'No backend services connected'
  }
};

// Helper functions
export const ObservabilityHelpers = {
  /**
   * Create observability configuration for specific environment
   */
  createEnvironmentConfig: (environment: 'development' | 'production' | 'testing') => {
    switch (environment) {
      case 'development':
        return OBSERVABILITY_DEFAULTS.DEVELOPMENT;
      case 'production':
        return OBSERVABILITY_DEFAULTS.PRODUCTION;
      case 'testing':
        return {
          ...OBSERVABILITY_DEFAULTS.DEVELOPMENT,
          logging: { ...OBSERVABILITY_DEFAULTS.DEVELOPMENT.logging, level: 'warn' as const },
          metrics: { ...OBSERVABILITY_DEFAULTS.DEVELOPMENT.metrics, enabled: false },
          alerting: { ...OBSERVABILITY_DEFAULTS.DEVELOPMENT.alerting, enabled: false }
        };
      default:
        return OBSERVABILITY_DEFAULTS.DEVELOPMENT;
    }
  },

  /**
   * Merge custom configuration with defaults
   */
  mergeConfig: (customConfig: Partial<ObservabilityConfig>, baseConfig: ObservabilityConfig): ObservabilityConfig => {
    return {
      logging: { ...baseConfig.logging, ...customConfig.logging },
      metrics: { ...baseConfig.metrics, ...customConfig.metrics },
      alerting: { 
        ...baseConfig.alerting, 
        ...customConfig.alerting,
        rules: customConfig.alerting?.rules || baseConfig.alerting.rules
      },
      performance: { ...baseConfig.performance, ...customConfig.performance }
    };
  },

  /**
   * Validate observability configuration
   */
  validateConfig: (config: ObservabilityConfig): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate logging configuration
    if (!config.logging.level || !['trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(config.logging.level)) {
      errors.push('Invalid logging level');
    }
    if (!config.logging.outputs || config.logging.outputs.length === 0) {
      errors.push('At least one logging output is required');
    }

    // Validate metrics configuration
    if (config.metrics.enabled && config.metrics.collectionInterval < 1000) {
      errors.push('Metrics collection interval must be at least 1000ms');
    }

    // Validate alerting configuration
    if (config.alerting.enabled && config.alerting.evaluationInterval < 10000) {
      errors.push('Alert evaluation interval must be at least 10000ms');
    }

    return { valid: errors.length === 0, errors };
  }
};

export default TemplumObservabilitySystem;

/**---
- title: Templum Observability System - Enterprise Infrastructure
- tags: [Core, Infrastructure, Observability, Metrics, Logging]
- provides: [TemplumObservabilitySystem, ObservabilityLogger, MetricsCollector, AlertManager]
- requires: [EventEmitter, TemplumTypes, ResourceManager]
- description: [Centralized observability infrastructure replacing hardcoded metrics with enterprise-grade logging, metrics collection, alerting, and monitoring]        
- ---*/

import { EventEmitter } from 'events';
import { 
  TemplumError, 
  isTemplumError, 
  createTemplumError,
  Signals, 
  ErrorSignalPayload, 
  MetricsSignalPayload,
  PerformanceMetrics 
} from '../types/templum-types';

// TODO: [TASK-NEW-038] Enhanced metrics correlation across interface adapters
// Priority: Medium | Complexity: 6
// Location: Observability infrastructure implementation
// Dependencies: Interface adapter metrics, session correlation
// Phase: Integration

// TODO: [TASK-NEW-039] Real-time alerting integration with external monitoring systems
// Priority: High | Complexity: 8
// Location: Observability infrastructure implementation  
// Dependencies: External monitoring APIs, alerting channels
// Phase: Integration

// ============================================================================
// Core Observability Types
// ============================================================================

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type OutputFormat = 'console' | 'json' | 'structured' | 'file';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  source: string;
  message: string;
  metadata?: Record<string, any>;
  error?: TemplumError;
  correlationId?: string;
  sessionId?: string;
  interfaceType?: string;
}

export interface MetricEntry {
  timestamp: number;
  name: string;
  type: MetricType;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  source: string;
  correlationId?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string; // Expression like "error_rate > 0.05"
  severity: AlertSeverity;
  enabled: boolean;
  cooldown?: number; // Minimum time between alerts (ms)
  description?: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  timestamp: number;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: number;
}

export interface ObservabilityConfig {
  // Logging configuration
  logging: {
    level: LogLevel;
    outputs: OutputFormat[];
    includeStackTrace: boolean;
    maxLogBufferSize: number;
    logFilePath?: string;
  };
  
  // Metrics configuration
  metrics: {
    enabled: boolean;
    collectionInterval: number; // ms
    bufferSize: number;
    retentionPeriod: number; // ms
    enableHistograms: boolean;
  };
  
  // Alerting configuration  
  alerting: {
    enabled: boolean;
    rules: AlertRule[];
    channels: string[]; // console, email, webhook, etc.
    evaluationInterval: number; // ms
  };
  
  // Performance monitoring
  performance: {
    enableTracing: boolean;
    tracingThreshold: number; // ms - operations above this are traced
    enableProfiling: boolean;
    memoryMonitoring: boolean;
  };
}

// ============================================================================
// Observability Logger
// ============================================================================

export class ObservabilityLogger {
  private buffer: LogEntry[] = [];
  private correlationContext: Map<string, string> = new Map();
  
  constructor(
    private config: ObservabilityConfig,
    private emitter: EventEmitter
  ) {}
  
  // Core logging methods with structured output
  trace(message: string, metadata?: Record<string, any>, source = 'unknown'): void {
    this.log('trace', message, metadata, source);
  }
  
  debug(message: string, metadata?: Record<string, any>, source = 'unknown'): void {
    this.log('debug', message, metadata, source);
  }
  
  info(message: string, metadata?: Record<string, any>, source = 'unknown'): void {
    this.log('info', message, metadata, source);
  }
  
  warn(message: string, metadata?: Record<string, any>, source = 'unknown'): void {
    this.log('warn', message, metadata, source);
  }
  
  error(message: string, error?: TemplumError | Error, metadata?: Record<string, any>, source = 'unknown'): void {
    const templumError = error ? (isTemplumError(error) ? error : createTemplumError(error.message, 'UNKNOWN_ERROR', 'runtime')) : undefined;
    this.log('error', message, { ...metadata, errorDetails: templumError }, source, templumError);
  }
  
  fatal(message: string, error?: TemplumError | Error, metadata?: Record<string, any>, source = 'unknown'): void {
    const templumError = error ? (isTemplumError(error) ? error : createTemplumError(error.message, 'FATAL_ERROR', 'runtime')) : undefined;
    this.log('fatal', message, { ...metadata, errorDetails: templumError }, source, templumError);
  }
  
  // Context management for correlation
  setCorrelationId(key: string, correlationId: string): void {
    this.correlationContext.set(key, correlationId);
  }
  
  getCorrelationId(key: string): string | undefined {
    return this.correlationContext.get(key);
  }
  
  clearCorrelationContext(): void {
    this.correlationContext.clear();
  }
  
  private log(level: LogLevel, message: string, metadata?: Record<string, any>, source = 'unknown', error?: TemplumError): void {
    // Check if this log level should be recorded
    if (!this.shouldLog(level)) return;
    
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      source,
      message,
      metadata,
      error,
      correlationId: this.correlationContext.get('default'),
      sessionId: this.correlationContext.get('session'),
      interfaceType: this.correlationContext.get('interface')
    };
    
    // Add to buffer
    this.buffer.push(logEntry);
    
    // Emit as signal for real-time processing
    if (error) {
      const errorPayload: ErrorSignalPayload = {
        error,
        severity: level === 'fatal' ? 'critical' : level === 'error' ? 'high' : 'medium',
        timestamp: logEntry.timestamp,
        source: logEntry.source,
        data: metadata
      };
      this.emitter.emit('templum:error', errorPayload);
    }
    
    // Output to configured channels
    this.outputLog(logEntry);
    
    // Maintain buffer size
    if (this.buffer.length > this.config.logging.maxLogBufferSize) {
      this.buffer.splice(0, this.buffer.length - this.config.logging.maxLogBufferSize);
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    const configLevelIndex = levels.indexOf(this.config.logging.level);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= configLevelIndex;
  }
  
  private outputLog(entry: LogEntry): void {
    for (const output of this.config.logging.outputs) {
      switch (output) {
        case 'console':
          this.outputToConsole(entry);
          break;
        case 'json':
          this.outputAsJSON(entry);
          break;
        case 'structured':
          this.outputStructured(entry);
          break;
        case 'file':
          this.outputToFile(entry);
          break;
      }
    }
  }
  
  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.source}]`;
    
    switch (entry.level) {
      case 'error':
      case 'fatal':
        console.error(`${prefix} ${entry.message}`, entry.metadata || '', entry.error || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}`, entry.metadata || '');
        break;
      case 'info':
        console.info(`${prefix} ${entry.message}`, entry.metadata || '');
        break;
      default:
        console.log(`${prefix} ${entry.message}`, entry.metadata || '');
    }
  }
  
  private outputAsJSON(entry: LogEntry): void {
    console.log(JSON.stringify(entry));
  }
  
  private outputStructured(entry: LogEntry): void {
    const structured = {
      '@timestamp': new Date(entry.timestamp).toISOString(),
      '@level': entry.level,
      '@source': entry.source,
      '@message': entry.message,
      '@correlation_id': entry.correlationId,
      '@session_id': entry.sessionId,
      '@interface_type': entry.interfaceType,
      ...entry.metadata,
      '@error': entry.error ? {
        code: entry.error.code,
        category: entry.error.category,
        message: entry.error.message
      } : undefined
    };
    console.log(JSON.stringify(structured));
  }
  
  private outputToFile(entry: LogEntry): void {
    // TODO: [TASK-NEW-040] File output implementation with log rotation
    // Priority: Medium | Complexity: 4
    // Dependencies: File system access, log rotation policies
    console.log(`FILE_LOG: ${JSON.stringify(entry)}`);
  }
  
  // Buffer management
  getLogBuffer(): LogEntry[] {
    return [...this.buffer];
  }
  
  clearLogBuffer(): void {
    this.buffer = [];
  }
}

// ============================================================================  
// Metrics Collector
// ============================================================================

export class MetricsCollector {
  private metrics: Map<string, MetricEntry[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  
  constructor(
    private config: ObservabilityConfig,
    private emitter: EventEmitter
  ) {}
  
  // Counter metrics (incrementing values)
  incrementCounter(name: string, value = 1, tags?: Record<string, string>, source = 'unknown'): void {
    const currentValue = this.counters.get(name) || 0;
    this.counters.set(name, currentValue + value);
    
    this.recordMetric({
      timestamp: Date.now(),
      name,
      type: 'counter',
      value: currentValue + value,
      tags,
      source
    });
  }
  
  // Gauge metrics (current state values)
  setGauge(name: string, value: number, tags?: Record<string, string>, source = 'unknown'): void {
    this.gauges.set(name, value);
    
    this.recordMetric({
      timestamp: Date.now(),
      name,
      type: 'gauge',
      value,
      tags,
      source
    });
  }
  
  // Histogram metrics (distribution of values)
  recordHistogram(name: string, value: number, tags?: Record<string, string>, source = 'unknown'): void {
    if (!this.config.metrics.enableHistograms) return;
    
    const values = this.histograms.get(name) || [];
    values.push(value);
    this.histograms.set(name, values);
    
    // Keep only recent values for performance
    if (values.length > 1000) {
      values.splice(0, values.length - 1000);
    }
    
    this.recordMetric({
      timestamp: Date.now(),
      name,
      type: 'histogram',
      value,
      tags,
      source
    });
  }
  
  // Performance timing helper
  startTiming(name: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.recordHistogram(`${name}_duration`, duration, { unit: 'ms' });
    };
  }
  
  private recordMetric(metric: MetricEntry): void {
    if (!this.config.metrics.enabled) return;
    
    const metricsList = this.metrics.get(metric.name) || [];
    metricsList.push(metric);
    this.metrics.set(metric.name, metricsList);
    
    // Emit metrics signal
    const metricsPayload: MetricsSignalPayload = {
      timestamp: metric.timestamp,
      source: metric.source,
      metrics: this.convertToPerformanceMetrics(metric),
      category: this.categorizeMetric(metric.name)
    };
    
    this.emitter.emit('templum:metrics', metricsPayload);
    
    // Maintain buffer size
    if (metricsList.length > this.config.metrics.bufferSize) {
      metricsList.splice(0, metricsList.length - this.config.metrics.bufferSize);
    }
  }
  
  private convertToPerformanceMetrics(metric: MetricEntry): PerformanceMetrics {
    // Convert metric to PerformanceMetrics format for existing signal compatibility
    return {
      memory: { heapUsed: 0, rss: 0 }, // Will be populated by actual metrics
      cpu: { user: 0, system: 0 }, // Will be populated by actual metrics  
      interfaces: {} // Will be populated by interface-specific metrics
    };
  }
  
  private categorizeMetric(metricName: string): 'performance' | 'usage' | 'error' {
    if (metricName.includes('error') || metricName.includes('failure')) return 'error';
    if (metricName.includes('duration') || metricName.includes('response_time')) return 'performance';
    return 'usage';
  }
  
  // Query metrics
  getMetric(name: string): MetricEntry[] {
    return this.metrics.get(name) || [];
  }
  
  getAllMetrics(): Map<string, MetricEntry[]> {
    return new Map(this.metrics);
  }
  
  getCounterValue(name: string): number {
    return this.counters.get(name) || 0;
  }
  
  getGaugeValue(name: string): number {
    return this.gauges.get(name) || 0;
  }
  
  getHistogramStats(name: string): { count: number; min: number; max: number; avg: number; p95: number } | null {
    const values = this.histograms.get(name);
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = sorted.reduce((sum, val) => sum + val, 0) / count;
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index] || max;
    
    return { count, min, max, avg, p95 };
  }
}

// ============================================================================
// Alert Manager  
// ============================================================================

export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private ruleLastTriggered: Map<string, number> = new Map();
  private evaluationTimer?: NodeJS.Timeout;
  
  constructor(
    private config: ObservabilityConfig,
    private metricsCollector: MetricsCollector,
    private logger: ObservabilityLogger
  ) {}
  
  start(): void {
    if (!this.config.alerting.enabled) return;
    
    this.evaluationTimer = setInterval(() => {
      this.evaluateRules();
    }, this.config.alerting.evaluationInterval);
    
    this.logger.info('Alert manager started', { 
      rulesCount: this.config.alerting.rules.length,
      evaluationInterval: this.config.alerting.evaluationInterval 
    }, 'AlertManager');
  }
  
  stop(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = undefined;
    }
    
    this.logger.info('Alert manager stopped', {}, 'AlertManager');
  }
  
  private evaluateRules(): void {
    for (const rule of this.config.alerting.rules) {
      if (!rule.enabled) continue;
      
      // Check cooldown
      const lastTriggered = this.ruleLastTriggered.get(rule.id) || 0;
      if (rule.cooldown && (Date.now() - lastTriggered < rule.cooldown)) {
        continue;
      }
      
      if (this.evaluateRule(rule)) {
        this.triggerAlert(rule);
      }
    }
  }
  
  private evaluateRule(rule: AlertRule): boolean {
    // Simple expression evaluation - can be enhanced with proper expression parser
    // TODO: [TASK-NEW-041] Advanced alert rule expression parsing
    // Priority: Low | Complexity: 5
    // Dependencies: Expression parser library, complex rule evaluation
    
    try {
      // Basic evaluation for common patterns
      if (rule.condition.includes('error_rate >')) {
        const threshold = parseFloat(rule.condition.split('>')[1].trim());
        const errorCount = this.metricsCollector.getCounterValue('errors_total');
        const requestCount = this.metricsCollector.getCounterValue('requests_total');
        const errorRate = requestCount > 0 ? errorCount / requestCount : 0;
        return errorRate > threshold;
      }
      
      if (rule.condition.includes('response_time >')) {
        const threshold = parseFloat(rule.condition.split('>')[1].trim());
        const stats = this.metricsCollector.getHistogramStats('response_time_duration');
        return stats ? stats.p95 > threshold : false;
      }
      
      if (rule.condition.includes('memory_usage >')) {
        const threshold = parseFloat(rule.condition.split('>')[1].trim());
        const memoryUsage = this.metricsCollector.getGaugeValue('memory_usage_mb');
        return memoryUsage > threshold;
      }
      
      return false;
    } catch (error) {
      const errorObj = error instanceof Error ? error : createTemplumError(String(error), 'ALERT_EVALUATION_ERROR', 'runtime');
      this.logger.error(`Failed to evaluate alert rule: ${rule.id}`, errorObj, { rule }, 'AlertManager');
      return false;
    }
  }
  
  private triggerAlert(rule: AlertRule): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      timestamp: Date.now(),
      severity: rule.severity,
      message: `Alert: ${rule.name} - ${rule.description || 'No description'}`,
      metadata: { condition: rule.condition }
    };
    
    this.alerts.set(alert.id, alert);
    this.ruleLastTriggered.set(rule.id, Date.now());
    
    // Log the alert
    this.logger.warn(`ALERT TRIGGERED: ${alert.message}`, { 
      alertId: alert.id,
      severity: alert.severity,
      rule: rule.name
    }, 'AlertManager');
    
    // Send to configured channels
    this.sendAlert(alert);
  }
  
  private sendAlert(alert: Alert): void {
    for (const channel of this.config.alerting.channels) {
      switch (channel) {
        case 'console':
          console.warn(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
          break;
        case 'email':
          // TODO: [TASK-NEW-042] Email alerting integration
          // Priority: Medium | Complexity: 4
          this.logger.info('Email alert would be sent', { alert }, 'AlertManager');
          break;
        case 'webhook':
          // TODO: [TASK-NEW-043] Webhook alerting integration  
          // Priority: Medium | Complexity: 3
          this.logger.info('Webhook alert would be sent', { alert }, 'AlertManager');
          break;
      }
    }
  }
  
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.logger.info(`Alert resolved: ${alertId}`, { alert }, 'AlertManager');
    }
  }
  
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }
  
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }
}

// ============================================================================
// Main Observability System
// ============================================================================

export class TemplumObservabilitySystem extends EventEmitter {
  private logger: ObservabilityLogger;
  private metrics: MetricsCollector;
  private alerts: AlertManager;
  private systemMonitorTimer?: NodeJS.Timeout;
  
  constructor(private config: ObservabilityConfig) {
    super();
    
    this.logger = new ObservabilityLogger(config, this);
    this.metrics = new MetricsCollector(config, this);  
    this.alerts = new AlertManager(config, this.metrics, this.logger);
  }
  
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Templum Observability System', {
        config: {
          loggingLevel: this.config.logging.level,
          metricsEnabled: this.config.metrics.enabled,
          alertingEnabled: this.config.alerting.enabled
        }
      }, 'TemplumObservabilitySystem');
      
      // Start alert manager
      this.alerts.start();
      
      // Start system monitoring
      this.startSystemMonitoring();
      
      // Register default metrics
      this.registerDefaultMetrics();
      
      this.logger.info('Templum Observability System initialized successfully', {}, 'TemplumObservabilitySystem');
      
    } catch (error) {
      const templumError = createTemplumError('Failed to initialize observability system', 'INITIALIZATION_ERROR', 'configuration');
      this.logger.fatal('Observability system initialization failed', templumError, {}, 'TemplumObservabilitySystem');
      throw templumError;
    }
  }
  
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down Templum Observability System', {}, 'TemplumObservabilitySystem');
      
      // Stop timers
      if (this.systemMonitorTimer) {
        clearInterval(this.systemMonitorTimer);
        this.systemMonitorTimer = undefined;
      }
      
      // Stop alert manager
      this.alerts.stop();
      
      // Final log flush
      this.logger.info('Templum Observability System shutdown complete', {}, 'TemplumObservabilitySystem');
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : createTemplumError(String(error), 'SHUTDOWN_ERROR', 'runtime');
      this.logger.error('Error during observability system shutdown', errorObj, {}, 'TemplumObservabilitySystem');
    }
  }
  
  private startSystemMonitoring(): void {
    if (!this.config.performance.memoryMonitoring) return;
    
    this.systemMonitorTimer = setInterval(() => {
      try {
        // Collect system metrics
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        // Record as gauges
        this.metrics.setGauge('memory_heap_used_mb', memoryUsage.heapUsed / 1024 / 1024, { unit: 'MB' }, 'SystemMonitor');
        this.metrics.setGauge('memory_rss_mb', memoryUsage.rss / 1024 / 1024, { unit: 'MB' }, 'SystemMonitor');
        this.metrics.setGauge('cpu_user_ms', cpuUsage.user / 1000, { unit: 'ms' }, 'SystemMonitor');
        this.metrics.setGauge('cpu_system_ms', cpuUsage.system / 1000, { unit: 'ms' }, 'SystemMonitor');
        
      } catch (error) {
        const errorObj = error instanceof Error ? error : createTemplumError(String(error), 'MONITORING_ERROR', 'runtime');
        this.logger.error('System monitoring error', errorObj, {}, 'SystemMonitor');
      }
    }, this.config.metrics.collectionInterval);
  }
  
  private registerDefaultMetrics(): void {
    // Initialize common metrics
    this.metrics.incrementCounter('system_starts', 1, { version: '1.0.0' }, 'TemplumObservabilitySystem');
    this.metrics.setGauge('uptime_seconds', process.uptime(), { unit: 'seconds' }, 'TemplumObservabilitySystem');
  }
  
  // Public API for components to use
  getLogger(): ObservabilityLogger {
    return this.logger;
  }
  
  getMetrics(): MetricsCollector {
    return this.metrics;
  }
  
  getAlerts(): AlertManager {
    return this.alerts;
  }
  
  // Convenience methods for common operations
  logInfo(message: string, metadata?: Record<string, any>, source?: string): void {
    this.logger.info(message, metadata, source);
  }
  
  logError(message: string, error?: TemplumError | Error, metadata?: Record<string, any>, source?: string): void {
    this.logger.error(message, error, metadata, source);
  }
  
  incrementMetric(name: string, value = 1, tags?: Record<string, string>, source?: string): void {
    this.metrics.incrementCounter(name, value, tags, source);
  }
  
  recordTiming(name: string, duration: number, tags?: Record<string, string>, source?: string): void {
    this.metrics.recordHistogram(name, duration, tags, source);
  }
  
  // Create default configuration
  static createDefaultConfig(): ObservabilityConfig {
    return {
      logging: {
        level: 'info',
        outputs: ['console', 'structured'],
        includeStackTrace: true,
        maxLogBufferSize: 1000,
      },
      metrics: {
        enabled: true,
        collectionInterval: 10000, // 10 seconds
        bufferSize: 1000,
        retentionPeriod: 3600000, // 1 hour
        enableHistograms: true,
      },
      alerting: {
        enabled: true,
        rules: [
          {
            id: 'high_error_rate',
            name: 'High Error Rate',
            condition: 'error_rate > 0.05',
            severity: 'high',
            enabled: true,
            cooldown: 300000, // 5 minutes
            description: 'Error rate above 5%'
          },
          {
            id: 'slow_response_time',
            name: 'Slow Response Time',
            condition: 'response_time > 1000',
            severity: 'medium',
            enabled: true,
            cooldown: 300000, // 5 minutes  
            description: 'P95 response time above 1000ms'
          },
          {
            id: 'high_memory_usage',
            name: 'High Memory Usage',
            condition: 'memory_usage > 512',
            severity: 'medium',
            enabled: true,
            cooldown: 600000, // 10 minutes
            description: 'Memory usage above 512MB'
          }
        ],
        channels: ['console'],
        evaluationInterval: 30000, // 30 seconds
      },
      performance: {
        enableTracing: true,
        tracingThreshold: 100, // 100ms
        enableProfiling: false,
        memoryMonitoring: true,
      },
    };
  }
}

export default TemplumObservabilitySystem;
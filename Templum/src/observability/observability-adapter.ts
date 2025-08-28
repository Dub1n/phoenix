/**---
- title: Templum Observability Adapter - Dependency Injection Integration
- tags: [Core, Infrastructure, Adapter, DependencyInjection]
- provides: [ObservabilityAdapter, IObservabilityService]
- requires: [TemplumObservabilitySystem, CoreComponentInterfaces]
- description: [Adapter implementing observability service interface for dependency injection integration with existing Templum architecture]        
- ---*/

import { EventEmitter } from 'events';
import { 
  TemplumObservabilitySystem, 
  ObservabilityConfig,
  ObservabilityLogger,
  MetricsCollector,
  AlertManager
} from './templum-observability-system';
import { 
  TemplumError,
  isTemplumError,
  createTemplumError
} from '../types/templum-types';

// TODO: [TASK-NEW-044] Cross-component observability correlation patterns
// Priority: High | Complexity: 7
// Location: Observability adapter implementation
// Dependencies: Component identification, correlation ID propagation
// Phase: Integration

// ============================================================================
// Observability Service Interface
// ============================================================================

/**
 * Observability service interface for dependency injection
 * Provides centralized logging, metrics, and alerting capabilities
 */
export interface IObservabilityService {
  // Lifecycle management
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  isInitialized(): boolean;
  
  // Logging operations
  logTrace(message: string, metadata?: Record<string, any>, source?: string): void;
  logDebug(message: string, metadata?: Record<string, any>, source?: string): void;
  logInfo(message: string, metadata?: Record<string, any>, source?: string): void;
  logWarn(message: string, metadata?: Record<string, any>, source?: string): void;
  logError(message: string, error?: TemplumError | Error, metadata?: Record<string, any>, source?: string): void;
  logFatal(message: string, error?: TemplumError | Error, metadata?: Record<string, any>, source?: string): void;
  
  // Metrics operations  
  incrementCounter(name: string, value?: number, tags?: Record<string, string>, source?: string): void;
  setGauge(name: string, value: number, tags?: Record<string, string>, source?: string): void;
  recordTiming(name: string, duration: number, tags?: Record<string, string>, source?: string): void;
  startTimer(name: string): () => void;
  
  // Context management
  setCorrelationId(correlationId: string): void;
  setSessionId(sessionId: string): void;
  setInterfaceType(interfaceType: string): void;
  clearContext(): void;
  
  // System health
  getSystemHealth(): {
    logging: { level: string; bufferSize: number; outputs: string[] };
    metrics: { enabled: boolean; counters: number; gauges: number; histograms: number };
    alerts: { enabled: boolean; active: number; rules: number };
  };
  
  // Access to underlying services
  getLogger(): ObservabilityLogger;
  getMetrics(): MetricsCollector;
  getAlerts(): AlertManager;
}

// ============================================================================
// Observability Adapter Implementation
// ============================================================================

export class ObservabilityAdapter implements IObservabilityService {
  private observabilitySystem: TemplumObservabilitySystem;
  private initialized = false;
  private logger: ObservabilityLogger;
  private metrics: MetricsCollector;
  private alerts: AlertManager;
  
  constructor(config?: ObservabilityConfig) {
    // Use provided config or create default
    const observabilityConfig = config || TemplumObservabilitySystem.createDefaultConfig();
    
    this.observabilitySystem = new TemplumObservabilitySystem(observabilityConfig);
    this.logger = this.observabilitySystem.getLogger();
    this.metrics = this.observabilitySystem.getMetrics();
    this.alerts = this.observabilitySystem.getAlerts();
  }
  
  // ============================================================================
  // Lifecycle Management
  // ============================================================================
  
  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        console.warn('ObservabilityAdapter: Already initialized, skipping');
        return;
      }
      
      // Initialize the underlying observability system
      await this.observabilitySystem.initialize();
      
      this.initialized = true;
      
      // Log successful initialization using the new system
      this.logInfo('Observability adapter initialized successfully', { 
        timestamp: Date.now(),
        component: 'ObservabilityAdapter'
      }, 'ObservabilityAdapter');
      
      // Record initialization metric
      this.incrementCounter('observability_initializations', 1, { status: 'success' }, 'ObservabilityAdapter');
      
    } catch (error) {
      const templumError = isTemplumError(error) ? error : createTemplumError(
        `Observability adapter initialization failed: ${error}`, 
        'OBSERVABILITY_INIT_ERROR', 
        'configuration'
      );
      
      // Use console for bootstrapping errors since observability might not be ready
      console.error('ObservabilityAdapter: Initialization failed:', templumError);
      this.incrementCounter('observability_initializations', 1, { status: 'error' }, 'ObservabilityAdapter');
      throw templumError;
    }
  }
  
  async shutdown(): Promise<void> {
    try {
      if (!this.initialized) {
        console.warn('ObservabilityAdapter: Not initialized, skipping shutdown');
        return;
      }
      
      this.logInfo('Shutting down observability adapter', {}, 'ObservabilityAdapter');
      
      // Shutdown the underlying system
      await this.observabilitySystem.shutdown();
      
      this.initialized = false;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during shutdown';
      console.error('ObservabilityAdapter: Shutdown error:', errorMessage);
      // Don't throw during shutdown to prevent cascade failures
    }
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  // ============================================================================
  // Logging Operations
  // ============================================================================
  
  logTrace(message: string, metadata?: Record<string, any>, source = 'unknown'): void {
    if (!this.initialized) {
      console.log(`[TRACE] [${source}] ${message}`, metadata || '');
      return;
    }
    this.logger.trace(message, metadata, source);
  }
  
  logDebug(message: string, metadata?: Record<string, any>, source = 'unknown'): void {
    if (!this.initialized) {
      console.log(`[DEBUG] [${source}] ${message}`, metadata || '');
      return;
    }
    this.logger.debug(message, metadata, source);
  }
  
  logInfo(message: string, metadata?: Record<string, any>, source = 'unknown'): void {
    if (!this.initialized) {
      console.log(`[INFO] [${source}] ${message}`, metadata || '');
      return;
    }
    this.logger.info(message, metadata, source);
  }
  
  logWarn(message: string, metadata?: Record<string, any>, source = 'unknown'): void {
    if (!this.initialized) {
      console.warn(`[WARN] [${source}] ${message}`, metadata || '');
      return;
    }
    this.logger.warn(message, metadata, source);
  }
  
  logError(message: string, error?: TemplumError | Error, metadata?: Record<string, any>, source = 'unknown'): void {
    if (!this.initialized) {
      console.error(`[ERROR] [${source}] ${message}`, error || '', metadata || '');
      return;
    }
    this.logger.error(message, error, metadata, source);
  }
  
  logFatal(message: string, error?: TemplumError | Error, metadata?: Record<string, any>, source = 'unknown'): void {
    if (!this.initialized) {
      console.error(`[FATAL] [${source}] ${message}`, error || '', metadata || '');
      return;
    }
    this.logger.fatal(message, error, metadata, source);
  }
  
  // ============================================================================
  // Metrics Operations
  // ============================================================================
  
  incrementCounter(name: string, value = 1, tags?: Record<string, string>, source = 'unknown'): void {
    if (!this.initialized) {
      return; // Silently skip metrics if not initialized
    }
    this.metrics.incrementCounter(name, value, tags, source);
  }
  
  setGauge(name: string, value: number, tags?: Record<string, string>, source = 'unknown'): void {
    if (!this.initialized) {
      return; // Silently skip metrics if not initialized
    }
    this.metrics.setGauge(name, value, tags, source);
  }
  
  recordTiming(name: string, duration: number, tags?: Record<string, string>, source = 'unknown'): void {
    if (!this.initialized) {
      return; // Silently skip metrics if not initialized
    }
    this.metrics.recordHistogram(name, duration, { ...tags, unit: 'ms' }, source);
  }
  
  startTimer(name: string): () => void {
    if (!this.initialized) {
      return () => {}; // Return no-op function if not initialized
    }
    return this.metrics.startTiming(name);
  }
  
  // ============================================================================
  // Context Management
  // ============================================================================
  
  setCorrelationId(correlationId: string): void {
    if (!this.initialized) return;
    this.logger.setCorrelationId('default', correlationId);
  }
  
  setSessionId(sessionId: string): void {
    if (!this.initialized) return;
    this.logger.setCorrelationId('session', sessionId);
  }
  
  setInterfaceType(interfaceType: string): void {
    if (!this.initialized) return;
    this.logger.setCorrelationId('interface', interfaceType);
  }
  
  clearContext(): void {
    if (!this.initialized) return;
    this.logger.clearCorrelationContext();
  }
  
  // ============================================================================
  // System Health
  // ============================================================================
  
  getSystemHealth(): {
    logging: { level: string; bufferSize: number; outputs: string[] };
    metrics: { enabled: boolean; counters: number; gauges: number; histograms: number };
    alerts: { enabled: boolean; active: number; rules: number };
  } {
    if (!this.initialized) {
      return {
        logging: { level: 'unknown', bufferSize: 0, outputs: [] },
        metrics: { enabled: false, counters: 0, gauges: 0, histograms: 0 },
        alerts: { enabled: false, active: 0, rules: 0 }
      };
    }
    
    const logBuffer = this.logger.getLogBuffer();
    const allMetrics = this.metrics.getAllMetrics();
    const activeAlerts = this.alerts.getActiveAlerts();
    
    return {
      logging: {
        level: 'info', // Would need to expose from config
        bufferSize: logBuffer.length,
        outputs: ['console', 'structured'] // Would need to expose from config
      },
      metrics: {
        enabled: true, // Would need to expose from config
        counters: Array.from(allMetrics.keys()).filter(name => name.includes('counter')).length,
        gauges: Array.from(allMetrics.keys()).filter(name => name.includes('gauge')).length,
        histograms: Array.from(allMetrics.keys()).filter(name => name.includes('duration')).length
      },
      alerts: {
        enabled: true, // Would need to expose from config
        active: activeAlerts.length,
        rules: 3 // Would need to expose from config
      }
    };
  }
  
  // ============================================================================
  // Access to Underlying Services
  // ============================================================================
  
  getLogger(): ObservabilityLogger {
    return this.logger;
  }
  
  getMetrics(): MetricsCollector {
    return this.metrics;
  }
  
  getAlerts(): AlertManager {
    return this.alerts;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create observability adapter with default configuration
 */
export function createObservabilityAdapter(): ObservabilityAdapter {
  return new ObservabilityAdapter();
}

/**
 * Create observability adapter with custom configuration
 */
export function createObservabilityAdapterWithConfig(config: ObservabilityConfig): ObservabilityAdapter {
  return new ObservabilityAdapter(config);
}

/**
 * Create observability adapter for development environment
 */
export function createDevelopmentObservabilityAdapter(): ObservabilityAdapter {
  const config = TemplumObservabilitySystem.createDefaultConfig();
  
  // Development-specific overrides
  config.logging.level = 'debug';
  config.logging.outputs = ['console'];
  config.metrics.collectionInterval = 5000; // More frequent in development
  config.alerting.enabled = false; // Disable alerting in development
  config.performance.enableTracing = true;
  config.performance.tracingThreshold = 50; // Lower threshold in development
  
  return new ObservabilityAdapter(config);
}

/**
 * Create observability adapter for production environment
 */
export function createProductionObservabilityAdapter(): ObservabilityAdapter {
  const config = TemplumObservabilitySystem.createDefaultConfig();
  
  // Production-specific overrides
  config.logging.level = 'info';
  config.logging.outputs = ['structured', 'file'];
  config.metrics.retentionPeriod = 7200000; // 2 hours in production
  config.alerting.enabled = true;
  config.performance.enableProfiling = false; // Disable profiling in production for performance
  
  return new ObservabilityAdapter(config);
}

export default ObservabilityAdapter;
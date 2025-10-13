/**
 * @fileoverview Real-Time Monitoring System for MCP Integration
 * 
 * date: 2025-09-13T103229Z
 * name: real-time-monitor
 * TASK-ID: ["TASK-MCP-009"]
 * category: mcp-real-time-monitoring
 * status: ["[~]"]
 * patterns: ["real-time-monitoring", "event-driven-updates", "performance-tracking"]
 * components: ["real-time-monitor", "performance-tracker", "event-aggregator"]
 * dependencies: ["visual-feedback-system", "health-monitor", "progressive-timeout-manager"]
 * tags: ["mcp-integration", "real-time-monitoring", "performance-analysis"]
 * 
 * Implements comprehensive real-time monitoring for MCP integration with:
 * - Live performance tracking
 * - Real-time health monitoring
 * - Event-driven status updates
 * - Continuous validation monitoring
 * - Performance trend analysis
 * 
 * @author VDL Vault Execution Agent  
 * @since 2025-09-13
 */

import { EventDrivenComponent } from '../../utils/event-bus-adapter';
import type { TypedEventMap } from '../../utils/event-utils';
import { VisualFeedbackSystem, VisualDashboard, VisualSection } from './visual-feedback-system';
import { HealthStatus, MCPHealthMonitor } from './health-monitor';
import { ProgressiveTimeoutManager } from './progressive-timeout-manager';
import { serialization, type SerializationOutcome } from '../../utils/serialization-utils';
import { emitSerializationWarnings } from '../../backend/backend-serialization-log';
import { AsyncUtils, type ManagedInterval } from '../../utils/async-utils';

export interface MonitoringConfig {
  updateInterval: number;
  performanceWindowSize: number;
  enableTrendAnalysis: boolean;
  alertThresholds: AlertThresholds;
  retainHistoryHours: number;
}

export interface AlertThresholds {
  responseTimeMs: number;
  errorRatePercent: number;
  memoryUsageMB: number;
  circuitBreakerTrips: number;
  stabilityPercent: number;
}

export interface PerformanceSnapshot {
  timestamp: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  activeConnections: number;
  circuitBreakerState: string;
  communicationStability: number;
}

export interface MonitoringEvent {
  type: 'performance' | 'health' | 'alert' | 'validation' | 'timeout' | 'circuit-breaker';
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: number;
  data: any;
  source: string;
}

export interface TrendAnalysis {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  changePercent: number;
  confidence: number;
  recommendation?: string;
}

export interface ValidationResult {
  operation: string;
  success: boolean;
  duration: number;
  timestamp: number;
  details: any;
}

interface RealTimeMonitorEvents extends TypedEventMap {
  'monitoring-started': (payload: { timestamp: number }) => void;
  'monitoring-stopped': (payload: { timestamp: number }) => void;
  'monitoring-cycle-completed': (payload: {
    snapshot: PerformanceSnapshot;
    healthStatus: HealthStatus;
    trends: TrendAnalysis[];
  }) => void;
  alert: (event: MonitoringEvent) => void;
  'validation-recorded': (validation: ValidationResult) => void;
  'monitoring-error': (error: unknown) => void;
}

/**
 * Real-Time Monitoring System
 * 
 * Provides comprehensive real-time monitoring for MCP integration including:
 * - Continuous performance tracking with trend analysis
 * - Real-time health monitoring with visual feedback
 * - Event-driven alerting system
 * - Live validation monitoring
 * - Performance optimization recommendations
 */
export class RealTimeMonitor extends EventDrivenComponent<RealTimeMonitorEvents> {
  private static instanceCounter = 0;
  private config: MonitoringConfig;
  private visualFeedback: VisualFeedbackSystem;
  private healthMonitor: MCPHealthMonitor;
  private timeoutManager: ProgressiveTimeoutManager;
  
  private performanceHistory: PerformanceSnapshot[];
  private eventHistory: MonitoringEvent[];
  private validationHistory: ValidationResult[];
  private trendAnalysis: Map<string, TrendAnalysis>;
  
  private monitoringInterval: ManagedInterval | null = null;
  private dashboard: VisualDashboard | null = null;
  private isMonitoring: boolean = false;
  private startTime: number;

  constructor(
    visualFeedback: VisualFeedbackSystem,
    healthMonitor: MCPHealthMonitor,
    timeoutManager: ProgressiveTimeoutManager,
    config?: Partial<MonitoringConfig>
  ) {
    super(`real-time-monitor:${RealTimeMonitor.instanceCounter++}`, 60);
    
    this.visualFeedback = visualFeedback;
    this.healthMonitor = healthMonitor;
    this.timeoutManager = timeoutManager;
    
    this.config = {
      updateInterval: 5000, // 5 seconds
      performanceWindowSize: 100,
      enableTrendAnalysis: true,
      alertThresholds: {
        responseTimeMs: 200,
        errorRatePercent: 5,
        memoryUsageMB: 100,
        circuitBreakerTrips: 3,
        stabilityPercent: 80
      },
      retainHistoryHours: 24,
      ...config
    };

    this.performanceHistory = [];
    this.eventHistory = [];
    this.validationHistory = [];
    this.trendAnalysis = new Map();
    this.startTime = Date.now();

    this.setupEventListeners();
  }

  /**
   * Start real-time monitoring with visual dashboard
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      this.visualFeedback.addIndicator({
        status: 'warning',
        message: 'Monitoring already active',
        category: 'monitor'
      });
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();

    // TODO: [TASK-MCP-009-MONITOR-001] Pattern: real-time-monitoring-startup | Complexity: 6 | Dependencies: visual-dashboard,health-monitor
    // Context: Initialize comprehensive real-time monitoring with visual dashboard and event tracking
    // Validation-Required: monitoring-accuracy, dashboard-responsiveness, event-capture
    // Pattern-Info: { approach: "event-driven-monitoring", alternatives: "polling-based,hybrid", trade-offs: "responsiveness-vs-resources" }

    // Create monitoring dashboard
    this.createMonitoringDashboard();

    // Start periodic monitoring
    this.monitoringInterval = AsyncUtils.createInterval(
      () => this.performMonitoringCycle(),
      this.config.updateInterval,
      { unref: true }
    );

    // Start visual dashboard
    this.visualFeedback.startDashboard();

    this.visualFeedback.addIndicator({
      status: 'success',
      message: 'Real-time monitoring started',
      details: `Update interval: ${this.config.updateInterval}ms`,
      category: 'monitor'
    });

    this.emit('monitoring-started', { timestamp: Date.now() });
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    this.monitoringInterval?.stop();
    this.monitoringInterval = null;

    this.visualFeedback.stopDashboard();

    this.visualFeedback.addIndicator({
      status: 'info',
      message: 'Real-time monitoring stopped',
      details: `Uptime: ${Math.round((Date.now() - this.startTime) / 1000)}s`,
      category: 'monitor'
    });

    this.emit('monitoring-stopped', { timestamp: Date.now() });
  }

  /**
   * Create comprehensive monitoring dashboard
   */
  private createMonitoringDashboard(): void {
    const sections: VisualSection[] = [
      {
        title: 'System Health',
        type: 'health',
        content: null,
        priority: 'high'
      },
      {
        title: 'Performance Metrics',
        type: 'metrics',
        content: null,
        priority: 'high'
      },
      {
        title: 'Real-Time Validation',
        type: 'status',
        content: null,
        priority: 'medium'
      },
      {
        title: 'Trend Analysis',
        type: 'progress',
        content: null,
        priority: 'medium'
      },
      {
        title: 'Recent Events',
        type: 'logs',
        content: [],
        priority: 'low'
      }
    ];

    this.dashboard = this.visualFeedback.createDashboard(
      'MCP Integration - Real-Time Monitor',
      sections
    );
  }

  /**
   * Perform monitoring cycle with comprehensive data collection
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // Collect performance snapshot
      const snapshot = await this.collectPerformanceSnapshot();
      this.performanceHistory.push(snapshot);

      // Maintain history size
      this.trimHistory();

      // Perform health check
      const healthStatus = await this.healthMonitor.performHealthCheck();

      // Update trend analysis
      if (this.config.enableTrendAnalysis) {
        this.updateTrendAnalysis();
      }

      // Check for alerts
      this.checkAlertConditions(snapshot, healthStatus);

      // Update dashboard sections
      this.updateDashboardData(snapshot, healthStatus);

      // Emit monitoring event
      this.emit('monitoring-cycle-completed', {
        snapshot,
        healthStatus,
        trends: Array.from(this.trendAnalysis.values())
      });

    } catch (error) {
      this.handleMonitoringError(error);
    }
  }

  /**
   * Collect comprehensive performance snapshot
   */
  private async collectPerformanceSnapshot(): Promise<PerformanceSnapshot> {
    const mcpMetrics = this.healthMonitor.getPerformanceMetrics();
    const timeoutMetrics = this.timeoutManager.getAdaptationMetrics();
    const memUsage = process.memoryUsage();

    return {
      timestamp: Date.now(),
      responseTime: mcpMetrics.averageResponseTime,
      errorRate: this.calculateRecentErrorRate(),
      throughput: this.calculateThroughput(),
      memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      activeConnections: this.getActiveConnectionCount(),
      circuitBreakerState: this.getCircuitBreakerState(),
      communicationStability: timeoutMetrics.communicationStability || 1.0
    };
  }

  /**
   * Update trend analysis for key metrics
   */
  private updateTrendAnalysis(): void {
    if (this.performanceHistory.length < 10) return; // Need enough data

    const metrics = ['responseTime', 'errorRate', 'memoryUsage', 'communicationStability'];
    
    for (const metric of metrics) {
      const trend = this.analyzeTrend(metric);
      if (trend) {
        this.trendAnalysis.set(metric, trend);
      }
    }
  }

  /**
   * Analyze trend for specific metric
   */
  private analyzeTrend(metric: string): TrendAnalysis | null {
    const recentData = this.performanceHistory.slice(-20); // Last 20 snapshots
    if (recentData.length < 10) return null;

    const values = recentData.map(s => (s as any)[metric]).filter(v => v !== undefined);
    if (values.length < 5) return null;

    // Simple linear regression for trend detection
    const n = values.length;
    const sumX = n * (n - 1) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const changePercent = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    let direction: TrendAnalysis['direction'];
    if (Math.abs(changePercent) < 5) {
      direction = 'stable';
    } else if (changePercent > 0) {
      direction = metric === 'errorRate' || metric === 'memoryUsage' ? 'degrading' : 'improving';
    } else {
      direction = metric === 'errorRate' || metric === 'memoryUsage' ? 'improving' : 'degrading';
    }

    const confidence = Math.min(100, Math.abs(changePercent) * 2); // Simple confidence calculation

    let recommendation: string | undefined;
    if (direction === 'degrading' && confidence > 70) {
      switch (metric) {
        case 'responseTime':
          recommendation = 'Consider optimizing request processing or scaling resources';
          break;
        case 'errorRate':
          recommendation = 'Investigate error patterns and implement additional error handling';
          break;
        case 'memoryUsage':
          recommendation = 'Review memory allocation and implement cleanup procedures';
          break;
        case 'communicationStability':
          recommendation = 'Check network conditions and timeout configurations';
          break;
      }
    }

    return {
      metric,
      direction,
      changePercent: Math.round(changePercent * 100) / 100,
      confidence: Math.round(confidence),
      recommendation
    };
  }

  /**
   * Check alert conditions and trigger notifications
   */
  private checkAlertConditions(snapshot: PerformanceSnapshot, healthStatus: HealthStatus): void {
    const alerts: MonitoringEvent[] = [];

    // Response time alert
    if (snapshot.responseTime > this.config.alertThresholds.responseTimeMs) {
      alerts.push({
        type: 'performance',
        severity: snapshot.responseTime > this.config.alertThresholds.responseTimeMs * 2 ? 'critical' : 'warning',
        timestamp: Date.now(),
        data: { responseTime: snapshot.responseTime, threshold: this.config.alertThresholds.responseTimeMs },
        source: 'real-time-monitor'
      });
    }

    // Error rate alert
    if (snapshot.errorRate * 100 > this.config.alertThresholds.errorRatePercent) {
      alerts.push({
        type: 'performance',
        severity: snapshot.errorRate * 100 > this.config.alertThresholds.errorRatePercent * 2 ? 'critical' : 'warning',
        timestamp: Date.now(),
        data: { errorRate: snapshot.errorRate, threshold: this.config.alertThresholds.errorRatePercent },
        source: 'real-time-monitor'
      });
    }

    // Memory usage alert
    if (snapshot.memoryUsage > this.config.alertThresholds.memoryUsageMB) {
      alerts.push({
        type: 'performance',
        severity: snapshot.memoryUsage > this.config.alertThresholds.memoryUsageMB * 2 ? 'critical' : 'warning',
        timestamp: Date.now(),
        data: { memoryUsage: snapshot.memoryUsage, threshold: this.config.alertThresholds.memoryUsageMB },
        source: 'real-time-monitor'
      });
    }

    // Health status alert
    if (healthStatus.status === 'unhealthy') {
      alerts.push({
        type: 'health',
        severity: 'critical',
        timestamp: Date.now(),
        data: { status: healthStatus.status, checks: healthStatus.checks },
        source: 'health-monitor'
      });
    } else if (healthStatus.status === 'degraded') {
      alerts.push({
        type: 'health',
        severity: 'warning',
        timestamp: Date.now(),
        data: { status: healthStatus.status, checks: healthStatus.checks },
        source: 'health-monitor'
      });
    }

    // Process alerts
    for (const alert of alerts) {
      this.processAlert(alert);
    }
  }

  /**
   * Process monitoring alert with visual feedback
   */
  private processAlert(alert: MonitoringEvent): void {
    this.eventHistory.push(alert);

    // Visual feedback
    const status = alert.severity === 'critical' ? 'error' : 'warning';
    this.visualFeedback.addIndicator({
      status,
      message: `${alert.type.toUpperCase()} ALERT: ${this.getAlertMessage(alert)}`,
      details: this.stringifyAlertDetails(alert.data, 'mcp:real-time-monitor:alert-data'),
      category: 'alert'
    });

    // Emit alert event
    this.emit('alert', alert);
  }

  /**
   * Get human-readable alert message
   */
  private getAlertMessage(alert: MonitoringEvent): string {
    switch (alert.type) {
      case 'performance':
        if (alert.data.responseTime) {
          return `High response time: ${alert.data.responseTime}ms (threshold: ${alert.data.threshold}ms)`;
        } else if (alert.data.errorRate) {
          return `High error rate: ${(alert.data.errorRate * 100).toFixed(1)}% (threshold: ${alert.data.threshold}%)`;
        } else if (alert.data.memoryUsage) {
          return `High memory usage: ${alert.data.memoryUsage}MB (threshold: ${alert.data.threshold}MB)`;
        }
        break;
      case 'health':
        return `System health: ${alert.data.status}`;
      default:
        return 'Unknown alert condition';
    }
    return 'Alert condition detected';
  }

  /**
   * Update dashboard with latest data
   */
  private updateDashboardData(snapshot: PerformanceSnapshot, healthStatus: HealthStatus): void {
    if (!this.dashboard) return;

    // Update health section
    this.visualFeedback.updateDashboardSection('health', healthStatus);

    // Update metrics section
    this.visualFeedback.updateDashboardSection('metrics', {
      'Response Time': `${snapshot.responseTime}ms`,
      'Error Rate': `${(snapshot.errorRate * 100).toFixed(1)}%`,
      'Throughput': `${snapshot.throughput.toFixed(1)}/sec`,
      'Memory Usage': `${snapshot.memoryUsage}MB`,
      'Communication Stability': `${(snapshot.communicationStability * 100).toFixed(1)}%`,
      'Circuit Breaker': snapshot.circuitBreakerState,
      'Active Connections': snapshot.activeConnections,
      'Uptime': `${Math.round((Date.now() - this.startTime) / 1000)}s`
    });

    // Update validation section
    const recentValidations = this.validationHistory.slice(-5);
    const validationSummary = {
      'Recent Validations': recentValidations.length,
      'Success Rate': recentValidations.length > 0 ? 
        `${((recentValidations.filter(v => v.success).length / recentValidations.length) * 100).toFixed(1)}%` : 'N/A',
      'Average Duration': recentValidations.length > 0 ?
        `${(recentValidations.reduce((sum, v) => sum + v.duration, 0) / recentValidations.length).toFixed(0)}ms` : 'N/A'
    };
    this.visualFeedback.updateDashboardSection('status', validationSummary);

    // Update trend section
    const trends = Array.from(this.trendAnalysis.values()).map(trend => ({
      current: 0,
      total: 100,
      label: `${trend.metric} (${trend.direction})`,
      showPercentage: true
    }));
    this.visualFeedback.updateDashboardSection('progress', trends);

    // Update events section
    const recentEvents = this.eventHistory.slice(-10).map(event => ({
      status: event.severity === 'critical' ? 'error' : event.severity === 'warning' ? 'warning' : 'info',
      message: `${event.type}: ${this.getAlertMessage(event)}`,
      timestamp: event.timestamp,
      category: event.source
    }));
    this.visualFeedback.updateDashboardSection('logs', recentEvents);
  }

  /**
   * Record validation result for monitoring
   */
  recordValidation(operation: string, success: boolean, duration: number, details?: any): void {
    const validation: ValidationResult = {
      operation,
      success,
      duration,
      timestamp: Date.now(),
      details: details || {}
    };

    this.validationHistory.push(validation);

    // Maintain history size
    if (this.validationHistory.length > this.config.performanceWindowSize) {
      this.validationHistory.shift();
    }

    // Show validation feedback
    this.visualFeedback.showValidationFeedback(operation, success, duration, details);

    this.emit('validation-recorded', validation);
  }

  /**
   * Setup event listeners for external components
   */
  private setupEventListeners(): void {
    // Listen to timeout manager events
    this.timeoutManager.on('timeout-adaptation', (data) => {
      this.visualFeedback.showTimeoutAdaptation(data.level, data.reason, data.duration);
      
      const event: MonitoringEvent = {
        type: 'timeout',
        severity: data.level > 2 ? 'warning' : 'info',
        timestamp: Date.now(),
        data,
        source: 'timeout-manager'
      };
      this.eventHistory.push(event);
    });

    this.timeoutManager.on('circuit-breaker-state-change', (data) => {
      this.visualFeedback.showCircuitBreakerStatus(data.state, data.failureRate, data.details);
      
      const event: MonitoringEvent = {
        type: 'circuit-breaker',
        severity: data.state === 'open' ? 'error' : 'info',
        timestamp: Date.now(),
        data,
        source: 'circuit-breaker'
      };
      this.eventHistory.push(event);
    });
  }

  /**
   * Handle monitoring errors gracefully
   */
  private handleMonitoringError(error: any): void {
    this.visualFeedback.addIndicator({
      status: 'error',
      message: 'Monitoring cycle failed',
      details: error.message,
      category: 'monitor'
    });

    const event: MonitoringEvent = {
      type: 'performance',
      severity: 'error',
      timestamp: Date.now(),
      data: { error: error.message },
      source: 'real-time-monitor'
    };
    
    this.eventHistory.push(event);
    this.emit('monitoring-error', error);
  }

  /**
   * Helper methods for data collection
   */

  private calculateRecentErrorRate(): number {
    const recentValidations = this.validationHistory.slice(-20);
    if (recentValidations.length === 0) return 0;
    
    const failures = recentValidations.filter(v => !v.success).length;
    return failures / recentValidations.length;
  }

  private calculateThroughput(): number {
    const oneMinuteAgo = Date.now() - 60000;
    const recentValidations = this.validationHistory.filter(v => v.timestamp > oneMinuteAgo);
    return recentValidations.length / 60; // per second
  }

  private getActiveConnectionCount(): number {
    // This would be implemented based on actual connection tracking
    return 1; // Placeholder
  }

  private getCircuitBreakerState(): string {
    const metrics = this.timeoutManager.getAdaptationMetrics();
    // This would be based on actual circuit breaker state
    return metrics.circuitBreakerTrips > 0 ? 'OPEN' : 'CLOSED';
  }

  private trimHistory(): void {
    const cutoffTime = Date.now() - (this.config.retainHistoryHours * 60 * 60 * 1000);
    
    this.performanceHistory = this.performanceHistory.filter(s => s.timestamp > cutoffTime);
    this.eventHistory = this.eventHistory.filter(e => e.timestamp > cutoffTime);
    this.validationHistory = this.validationHistory.filter(v => v.timestamp > cutoffTime);
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    uptime: number;
    performanceSnapshots: number;
    events: number;
    validations: number;
    trends: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      uptime: Date.now() - this.startTime,
      performanceSnapshots: this.performanceHistory.length,
      events: this.eventHistory.length,
      validations: this.validationHistory.length,
      trends: this.trendAnalysis.size
    };
  }

  private stringifyAlertDetails(
    details: unknown,
    context: string
  ): string {
    const builder = serialization.json(details).context(context).fallback('{}');
    const outcome = builder.stringify();
    emitSerializationWarnings(context, outcome);

    if (!outcome.ok || outcome.status === 'fallback' || !outcome.value) {
      return this.buildAlertFallback(context, outcome);
    }

    return outcome.value;
  }

  private buildAlertFallback(
    context: string,
    outcome: SerializationOutcome<string>
  ): string {
    const fallbackContext = `${context}:fallback`;
    const fallbackPayload = {
      message: 'serialization-fallback',
      context,
      warnings: [...outcome.meta.warnings],
      maskedFields: [...outcome.meta.maskedFields]
    };

    const fallbackBuilder = serialization
      .json(fallbackPayload)
      .context(fallbackContext)
      .fallback('"serialization-fallback"');

    const fallbackOutcome = fallbackBuilder.stringify();
    emitSerializationWarnings(fallbackContext, fallbackOutcome);

    return fallbackOutcome.value ?? '"serialization-fallback"';
  }

  /**
   * Cleanup monitoring resources
   */
  cleanup(): void {
    this.stopMonitoring();
    this.removeAllListeners();

    this.performanceHistory = [];
    this.eventHistory = [];
    this.validationHistory = [];
    this.trendAnalysis.clear();

    const disposable = this.visualFeedback as VisualFeedbackSystem & {
      dispose?: () => void;
    };

    if (typeof disposable.dispose === 'function') {
      disposable.dispose();
    } else if (typeof this.visualFeedback.stopDashboard === 'function') {
      this.visualFeedback.stopDashboard();
    }
  }
}

/**
 * Create real-time monitor with optimized configuration
 */
export function createRealTimeMonitor(
  visualFeedback: VisualFeedbackSystem,
  healthMonitor: MCPHealthMonitor,
  timeoutManager: ProgressiveTimeoutManager,
  config?: Partial<MonitoringConfig>
): RealTimeMonitor {
  return new RealTimeMonitor(visualFeedback, healthMonitor, timeoutManager, config);
}

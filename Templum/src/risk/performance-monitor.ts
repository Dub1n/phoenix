/**---
 * title: [Performance Monitor - Real-time Performance Validation]
 * tags: [Performance, Monitoring, Risk-Mitigation, Threshold-Management, Continuous-Validation]
 * provides: [Performance Tracking, Degradation Detection, Alert System, Metrics Collection]
 * requires: [Performance Baselines, Alert Handlers, Metrics Storage]
 * description: [Continuous performance monitoring with >30% degradation threshold detection and automatic response]
 * ---*/

import { EventEmitter } from 'events';
import { createInterval, ManagedInterval } from '../utils/async-utils';

export interface PerformanceMetric {
  componentId: string;
  metricType: 'response-time' | 'memory-usage' | 'cpu-usage' | 'error-rate' | 'throughput';
  value: number;
  unit: 'ms' | 'MB' | 'percent' | 'requests/sec';
  timestamp: number;
  context: {
    interfaceType?: string;
    operationType?: string;
    userId?: string;
    sessionId?: string;
  };
}

export interface PerformanceBaseline {
  componentId: string;
  metricType: 'response-time' | 'memory-usage' | 'cpu-usage' | 'error-rate' | 'throughput';
  baselineValue: number;
  acceptableVariation: number; // Percentage
  criticalThreshold: number;   // 30% degradation threshold from Phase 1
  warningThreshold: number;    // 15% warning threshold
  samplingWindow: number;      // Minutes
  minSampleSize: number;       // Minimum samples for valid measurement
}

export interface PerformanceDegradation {
  componentId: string;
  metricType: string;
  currentValue: number;
  baselineValue: number;
  degradationPercentage: number;
  severity: 'warning' | 'critical' | 'emergency';
  duration: number; // How long degradation has persisted (ms)
  affectedInterfaces: string[];
  recommendedActions: string[];
  automaticResponseTriggered: boolean;
  timestamp: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'degradation' | 'threshold-breach' | 'baseline-drift' | 'anomaly';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  message: string;
  componentId: string;
  metricType: string;
  details: {
    current: number;
    baseline: number;
    threshold: number;
    degradation: number;
  };
  actions: string[];
  timestamp: number;
  acknowledged: boolean;
  resolvedTimestamp?: number;
}

export interface MonitoringStats {
  totalMetrics: number;
  activeAlerts: number;
  degradationCount: {
    warning: number;
    critical: number;
    emergency: number;
  };
  performanceHealth: {
    healthy: number;
    warning: number;
    critical: number;
  };
  topDegradations: Array<{
    componentId: string;
    degradation: number;
    duration: number;
  }>;
  systemHealth: {
    overall: 'healthy' | 'degraded' | 'critical' | 'emergency';
    score: number; // 0-100
    uptime: number;
  };
}

export class PerformanceMonitor extends EventEmitter {
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private degradations: Map<string, PerformanceDegradation> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private monitoringInterval: ManagedInterval | null = null;
  private isMonitoring: boolean = false;
  private config: {
    defaultDegradationThreshold: number; // 30% from Phase 1
    alertCooldown: number; // ms
    maxMetricsHistory: number;
    samplingInterval: number; // ms
  };

  constructor() {
    super();
    this.config = {
      defaultDegradationThreshold: 30, // >30% degradation threshold from Phase 1
      alertCooldown: 60000, // 1 minute between similar alerts
      maxMetricsHistory: 1000, // Keep last 1000 metrics per component
      samplingInterval: 5000 // Sample every 5 seconds
    };
    this.initializeSystemBaselines();
  }

  /**
   * Start continuous performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Performance monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = createInterval(() => {
      this.collectMetrics();
    }, this.config.samplingInterval);

    this.emit('monitoringStarted', { timestamp: Date.now() });
    console.log('Performance Monitor: Started continuous monitoring');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.monitoringInterval?.stop();
    this.monitoringInterval = null;

    this.emit('monitoringStopped', { timestamp: Date.now() });
    console.log('Performance Monitor: Stopped monitoring');
  }

  /**
   * Register performance baseline for component
   */
  registerBaseline(baseline: PerformanceBaseline): void {
    const key = `${baseline.componentId}-${baseline.metricType}`;
    this.baselines.set(key, baseline);
    
    this.emit('baselineRegistered', {
      componentId: baseline.componentId,
      metricType: baseline.metricType,
      baselineValue: baseline.baselineValue,
      criticalThreshold: baseline.criticalThreshold
    });

    console.log(`Performance Monitor: Registered baseline for ${baseline.componentId} ${baseline.metricType}: ${baseline.baselineValue}`);
  }

  /**
   * Record performance metric and check for degradation
   */
  recordMetric(metric: PerformanceMetric): void {
    const key = `${metric.componentId}-${metric.metricType}`;
    
    // Store metric
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const metrics = this.metrics.get(key)!;
    metrics.push(metric);
    
    // Maintain history limit
    if (metrics.length > this.config.maxMetricsHistory) {
      metrics.shift();
    }

    // Check for performance degradation
    this.checkPerformanceDegradation(metric);

    this.emit('metricRecorded', metric);
  }

  /**
   * Check for performance degradation against baseline
   */
  private checkPerformanceDegradation(metric: PerformanceMetric): void {
    const key = `${metric.componentId}-${metric.metricType}`;
    const baseline = this.baselines.get(key);
    
    if (!baseline) {
      // No baseline to compare against
      return;
    }

    // Calculate degradation percentage
    const degradationPercentage = this.calculateDegradationPercentage(
      metric.value,
      baseline.baselineValue,
      metric.metricType
    );

    // Check if degradation exceeds thresholds
    let severity: 'warning' | 'critical' | 'emergency' | null = null;
    
    if (Math.abs(degradationPercentage) >= baseline.criticalThreshold) {
      severity = degradationPercentage > 0 ? 'critical' : 'emergency';
    } else if (Math.abs(degradationPercentage) >= baseline.warningThreshold) {
      severity = 'warning';
    }

    if (severity) {
      this.handlePerformanceDegradation({
        componentId: metric.componentId,
        metricType: metric.metricType,
        currentValue: metric.value,
        baselineValue: baseline.baselineValue,
        degradationPercentage,
        severity,
        duration: 0, // Will be calculated from existing degradation
        affectedInterfaces: this.getAffectedInterfaces(metric),
        recommendedActions: this.getRecommendedActions(severity, degradationPercentage),
        automaticResponseTriggered: false,
        timestamp: metric.timestamp
      });
    } else {
      // Check if we should clear existing degradation
      const existingDegradation = this.degradations.get(key);
      if (existingDegradation) {
        this.clearDegradation(key);
      }
    }
  }

  /**
   * Handle performance degradation with automatic response
   */
  private handlePerformanceDegradation(degradation: PerformanceDegradation): void {
    const key = `${degradation.componentId}-${degradation.metricType}`;
    const existingDegradation = this.degradations.get(key);
    
    // Update duration if this is an ongoing degradation
    if (existingDegradation) {
      degradation.duration = degradation.timestamp - existingDegradation.timestamp;
    }

    this.degradations.set(key, degradation);

    // Create alert
    this.createAlert({
      type: 'degradation',
      severity: degradation.severity,
      message: this.createDegradationMessage(degradation),
      componentId: degradation.componentId,
      metricType: degradation.metricType,
      details: {
        current: degradation.currentValue,
        baseline: degradation.baselineValue,
        threshold: this.config.defaultDegradationThreshold,
        degradation: degradation.degradationPercentage
      },
      actions: degradation.recommendedActions
    });

    // Trigger automatic response for critical degradation
    if (degradation.severity === 'critical' || degradation.severity === 'emergency') {
      this.triggerAutomaticResponse(degradation);
    }

    this.emit('performanceDegradation', degradation);
  }

  /**
   * Trigger automatic response to critical performance degradation
   */
  private async triggerAutomaticResponse(degradation: PerformanceDegradation): Promise<void> {
    const key = `${degradation.componentId}-${degradation.metricType}`;
    
    try {
      // Mark as automatic response triggered
      degradation.automaticResponseTriggered = true;
      this.degradations.set(key, degradation);

      // Trigger fallback mechanisms based on severity
      if (degradation.severity === 'emergency') {
        await this.triggerEmergencyFallback(degradation);
      } else if (degradation.severity === 'critical') {
        await this.triggerCriticalFallback(degradation);
      }

      this.emit('automaticResponseTriggered', {
        componentId: degradation.componentId,
        severity: degradation.severity,
        actions: degradation.recommendedActions,
        timestamp: Date.now()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to trigger automatic response for ${degradation.componentId}: ${errorMessage}`);
      
      this.createAlert({
        type: 'anomaly',
        severity: 'critical',
        message: `Automatic response failed for ${degradation.componentId}`,
        componentId: degradation.componentId,
        metricType: degradation.metricType,
        details: {
          current: degradation.currentValue,
          baseline: degradation.baselineValue,
          threshold: this.config.defaultDegradationThreshold,
          degradation: degradation.degradationPercentage
        },
        actions: ['Manual intervention required', 'Check system health']
      });
    }
  }

  /**
   * Get current performance health status
   */
  getPerformanceHealth(): {
    overallHealth: 'healthy' | 'degraded' | 'critical' | 'emergency';
    healthScore: number; // 0-100
    degradedComponents: number;
    criticalComponents: number;
    activeAlerts: number;
    worstDegradation: {
      componentId: string;
      degradation: number;
      duration: number;
    } | null;
  } {
    const degradations = Array.from(this.degradations.values());
    const alerts = Array.from(this.alerts.values()).filter(a => !a.acknowledged);
    
    // Count components by health status
    const criticalComponents = degradations.filter(d => d.severity === 'critical' || d.severity === 'emergency').length;
    const degradedComponents = degradations.filter(d => d.severity === 'warning').length;
    
    // Calculate overall health
    let overallHealth: 'healthy' | 'degraded' | 'critical' | 'emergency' = 'healthy';
    let healthScore = 100;

    if (criticalComponents > 0) {
      overallHealth = degradations.some(d => d.severity === 'emergency') ? 'emergency' : 'critical';
      healthScore = Math.max(0, 50 - (criticalComponents * 10));
    } else if (degradedComponents > 0) {
      overallHealth = 'degraded';
      healthScore = Math.max(50, 90 - (degradedComponents * 5));
    }

    // Find worst degradation
    const worstDegradation = degradations.length > 0 ? 
      degradations.reduce((worst, current) => 
        Math.abs(current.degradationPercentage) > Math.abs(worst.degradationPercentage) ? current : worst
      ) : null;

    return {
      overallHealth,
      healthScore,
      degradedComponents,
      criticalComponents,
      activeAlerts: alerts.length,
      worstDegradation: worstDegradation ? {
        componentId: worstDegradation.componentId,
        degradation: worstDegradation.degradationPercentage,
        duration: worstDegradation.duration
      } : null
    };
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): MonitoringStats {
    const degradations = Array.from(this.degradations.values());
    const alerts = Array.from(this.alerts.values()).filter(a => !a.acknowledged);
    
    // Count degradations by severity
    const degradationCount = {
      warning: degradations.filter(d => d.severity === 'warning').length,
      critical: degradations.filter(d => d.severity === 'critical').length,
      emergency: degradations.filter(d => d.severity === 'emergency').length
    };

    // Count components by health
    const totalComponents = this.baselines.size;
    const criticalComponents = degradationCount.critical + degradationCount.emergency;
    const warningComponents = degradationCount.warning;
    const healthyComponents = totalComponents - criticalComponents - warningComponents;

    const performanceHealth = {
      healthy: healthyComponents,
      warning: warningComponents,
      critical: criticalComponents
    };

    // Top degradations
    const topDegradations = degradations
      .sort((a, b) => Math.abs(b.degradationPercentage) - Math.abs(a.degradationPercentage))
      .slice(0, 5)
      .map(d => ({
        componentId: d.componentId,
        degradation: d.degradationPercentage,
        duration: d.duration
      }));

    // System health
    const health = this.getPerformanceHealth();
    const systemHealth = {
      overall: health.overallHealth,
      score: health.healthScore,
      uptime: this.isMonitoring ? Date.now() - (this.monitoringInterval ? 0 : Date.now()) : 0
    };

    return {
      totalMetrics: Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0),
      activeAlerts: alerts.length,
      degradationCount,
      performanceHealth,
      topDegradations,
      systemHealth
    };
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, userId?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.acknowledged = true;
    this.alerts.set(alertId, alert);

    this.emit('alertAcknowledged', { 
      alertId, 
      userId, 
      timestamp: Date.now() 
    });

    return true;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, userId?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.resolvedTimestamp = Date.now();
    this.alerts.set(alertId, alert);

    this.emit('alertResolved', { 
      alertId, 
      userId, 
      timestamp: Date.now() 
    });

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolvedTimestamp)
      .sort((a, b) => {
        // Sort by severity (emergency > critical > warning > info) then by timestamp
        const severityOrder = { emergency: 4, critical: 3, warning: 2, info: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        return severityDiff !== 0 ? severityDiff : b.timestamp - a.timestamp;
      });
  }

  private calculateDegradationPercentage(
    currentValue: number, 
    baselineValue: number, 
    metricType: string
  ): number {
    if (baselineValue === 0) return 0;

    let degradation: number;

    // For metrics where higher values are worse (response time, memory usage, cpu usage, error rate)
    if (['response-time', 'memory-usage', 'cpu-usage', 'error-rate'].includes(metricType)) {
      degradation = ((currentValue - baselineValue) / baselineValue) * 100;
    } else {
      // For metrics where lower values are worse (throughput)
      degradation = ((baselineValue - currentValue) / baselineValue) * 100;
    }

    return degradation;
  }

  private getAffectedInterfaces(metric: PerformanceMetric): string[] {
    // Determine which interfaces are affected by this performance issue
    const interfaces: string[] = [];
    
    if (metric.context.interfaceType) {
      interfaces.push(metric.context.interfaceType);
    } else {
      // If no specific interface, assume all interfaces could be affected
      interfaces.push('vscode', 'cli', 'command', 'web');
    }

    return interfaces;
  }

  private getRecommendedActions(severity: string, degradationPercentage: number): string[] {
    const actions: string[] = [];

    if (severity === 'emergency') {
      actions.push('Immediate fallback to secondary systems');
      actions.push('Escalate to on-call team');
      actions.push('Consider system rollback');
    } else if (severity === 'critical') {
      actions.push('Activate fallback mechanisms');
      actions.push('Investigate root cause');
      actions.push('Monitor closely');
    } else if (severity === 'warning') {
      actions.push('Monitor performance trends');
      actions.push('Consider performance optimization');
      actions.push('Review recent changes');
    }

    // Add specific actions based on degradation percentage
    if (Math.abs(degradationPercentage) > 50) {
      actions.push('Consider component restart');
    } else if (Math.abs(degradationPercentage) > 30) {
      actions.push('Review component configuration');
    }

    return actions;
  }

  private clearDegradation(key: string): void {
    const degradation = this.degradations.get(key);
    if (degradation) {
      this.degradations.delete(key);
      this.emit('degradationCleared', {
        componentId: degradation.componentId,
        metricType: degradation.metricType,
        timestamp: Date.now()
      });
    }
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: PerformanceAlert = {
      id: alertId,
      timestamp: Date.now(),
      acknowledged: false,
      ...alertData
    };

    this.alerts.set(alertId, alert);
    this.emit('alertCreated', alert);
  }

  private createDegradationMessage(degradation: PerformanceDegradation): string {
    const direction = degradation.degradationPercentage > 0 ? 'increased' : 'decreased';
    return `Performance degradation detected: ${degradation.componentId} ${degradation.metricType} has ${direction} by ${Math.abs(degradation.degradationPercentage).toFixed(1)}% from baseline`;
  }

  private async triggerEmergencyFallback(degradation: PerformanceDegradation): Promise<void> {
    // Emergency fallback - immediate system protection
    console.error(`EMERGENCY: Triggering emergency fallback for ${degradation.componentId}`);
    
    // Emit emergency signal for immediate response
    this.emit('emergencyFallback', {
      componentId: degradation.componentId,
      degradation: degradation.degradationPercentage,
      action: 'emergency-fallback',
      timestamp: Date.now()
    });
  }

  private async triggerCriticalFallback(degradation: PerformanceDegradation): Promise<void> {
    // Critical fallback - activate backup systems
    console.warn(`CRITICAL: Triggering critical fallback for ${degradation.componentId}`);
    
    // Emit critical signal for fallback activation
    this.emit('criticalFallback', {
      componentId: degradation.componentId,
      degradation: degradation.degradationPercentage,
      action: 'critical-fallback',
      timestamp: Date.now()
    });
  }

  private async collectMetrics(): Promise<void> {
    // Collect current system metrics
    const memoryUsage = process.memoryUsage();
    const timestamp = Date.now();

    // System-wide metrics
    this.recordMetric({
      componentId: 'system',
      metricType: 'memory-usage',
      value: memoryUsage.heapUsed / 1024 / 1024, // MB
      unit: 'MB',
      timestamp,
      context: {}
    });

    // CPU usage would be collected here in real implementation
    // Network metrics would be collected here in real implementation
    // Application-specific metrics would be collected here in real implementation
  }

  private initializeSystemBaselines(): void {
    // Initialize default system baselines based on Phase 1 requirements
    this.registerBaseline({
      componentId: 'system',
      metricType: 'response-time',
      baselineValue: 100, // 100ms baseline
      acceptableVariation: 15, // 15% variation acceptable
      criticalThreshold: 30, // 30% degradation threshold from Phase 1
      warningThreshold: 15, // 15% warning threshold
      samplingWindow: 5, // 5 minutes
      minSampleSize: 10
    });

    this.registerBaseline({
      componentId: 'system',
      metricType: 'memory-usage',
      baselineValue: 150, // 150MB baseline
      acceptableVariation: 20,
      criticalThreshold: 30,
      warningThreshold: 15,
      samplingWindow: 10,
      minSampleSize: 5
    });

    this.registerBaseline({
      componentId: 'component-transfer',
      metricType: 'response-time',
      baselineValue: 50, // <50ms from Phase 1 component transfer requirements
      acceptableVariation: 10,
      criticalThreshold: 30,
      warningThreshold: 15,
      samplingWindow: 5,
      minSampleSize: 10
    });

    console.log('Performance Monitor: Initialized system baselines with 30% degradation threshold');
  }
}

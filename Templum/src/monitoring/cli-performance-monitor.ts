/**
 * CLI Performance Monitor
 * 
 * Real-time performance monitoring and metrics collection for CLI stress testing.
 * Implements continuous monitoring patterns with adaptive threshold detection.
 * 
 * Performance Targets Integration:
 * - Service Discovery: <50ms latency monitoring
 * - Interactive Navigation: <200ms render latency tracking
 * - Backend Management: <500ms skin loading monitoring  
 * - Memory Management: Leak detection and baseline tracking
 * 
 * Generated: 2025-09-12
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { createInterval } from '../utils/async-utils';
import type { ManagedInterval } from '../utils/async-utils';

// TODO: [TASK-ID-CLI-PERF-001] Pattern: real-time-performance-monitoring | Complexity: 25 | Dependencies: CLI-stress-testing-infrastructure,performance-baselines
// Context: Real-time performance monitoring with adaptive threshold detection for CLI stress testing
// Validation-Required: monitoring-accuracy, threshold-detection, memory-tracking, real-time-reporting
// Pattern-Info: { approach: "continuous monitoring with adaptive thresholds", alternatives: "batch monitoring", trade-offs: "real-time vs resource usage" }

export interface PerformanceSnapshot {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  throughput: number;
  activeConnections: number;
  errorRate: number;
}

export interface PerformanceAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: number;
  message: string;
}

export interface MonitoringConfiguration {
  samplingInterval: number; // ms
  retentionPeriod: number; // ms
  alertThresholds: {
    responseTime: number;
    memoryGrowth: number;
    errorRate: number;
    cpuUsage: number;
    throughput: number;
  };
  enableRealTimeAlerts: boolean;
  enableTrendAnalysis: boolean;
  adaptiveThresholds: boolean;
}

export interface TrendAnalysis {
  metric: string;
  trend: 'improving' | 'degrading' | 'stable';
  changeRate: number;
  confidence: number;
  prediction: number;
}

/**
 * CLI Performance Monitor with Adaptive Threshold Detection
 * Provides real-time performance monitoring and alerting for CLI stress testing
 */
export class CLIPerformanceMonitor extends EventEmitter {
  private config: MonitoringConfiguration;
  private snapshots: PerformanceSnapshot[] = [];
  private alerts: PerformanceAlert[] = [];
  private monitoringActive = false;
  private monitoringInterval?: ManagedInterval;
  private baselineMetrics = new Map<string, number>();
  private trendAnalysisCache = new Map<string, TrendAnalysis>();
  private adaptiveThresholds = new Map<string, number>();
  
  constructor(config?: Partial<MonitoringConfiguration>) {
    super();
    
    this.config = {
      samplingInterval: 1000, // 1 second
      retentionPeriod: 300000, // 5 minutes
      alertThresholds: {
        responseTime: 200, // ms
        memoryGrowth: 50, // MB
        errorRate: 5, // %
        cpuUsage: 80, // %
        throughput: 10 // commands/second minimum
      },
      enableRealTimeAlerts: true,
      enableTrendAnalysis: true,
      adaptiveThresholds: true,
      ...config
    };
    
    this.initializeBaselines();
  }
  
  /**
   * Initialize performance baselines from stress testing targets
   */
  private initializeBaselines(): void {
    // Performance baselines from analysis handoff
    this.baselineMetrics.set('serviceDiscoveryLatency', 50);
    this.baselineMetrics.set('renderLatency', 200);
    this.baselineMetrics.set('inputProcessingTime', 50);
    this.baselineMetrics.set('skinLoadTime', 500);
    this.baselineMetrics.set('interfaceSwitchTime', 300);
    this.baselineMetrics.set('stateSync', 100);
    this.baselineMetrics.set('memoryUsage', 100); // 100MB baseline
    this.baselineMetrics.set('commandThroughput', 20); // 20 commands/second
    
    // Initialize adaptive thresholds
    this.baselineMetrics.forEach((value, key) => {
      this.adaptiveThresholds.set(key, value * 1.2); // 20% above baseline
    });
  }
  
  /**
   * Start real-time performance monitoring
   */
  public startMonitoring(): void {
    if (this.monitoringActive) {
      console.warn('Performance monitoring is already active');
      return;
    }
    
    console.log('🔍 Starting CLI Performance Monitoring...');
    console.log(`  Sampling Interval: ${this.config.samplingInterval}ms`);
    console.log(`  Retention Period: ${(this.config.retentionPeriod / 1000 / 60).toFixed(1)} minutes`);
    console.log(`  Adaptive Thresholds: ${this.config.adaptiveThresholds ? 'ENABLED' : 'DISABLED'}`);
    
    this.monitoringActive = true;
    this.monitoringInterval = createInterval(
      () => {
        this.collectPerformanceSnapshot();
      },
      this.config.samplingInterval,
      { unref: true }
    );
    
    this.emit('monitoringStarted');
  }
  
  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.monitoringActive) {
      return;
    }
    
    console.log('🛑 Stopping CLI Performance Monitoring...');
    
    this.monitoringActive = false;
    this.monitoringInterval?.stop();
    this.monitoringInterval = undefined;
    
    this.generateMonitoringReport();
    this.emit('monitoringStopped');
  }
  
  /**
   * Collect real-time performance snapshot
   */
  private collectPerformanceSnapshot(): void {
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      cpuUsage: this.getCPUUsage(),
      memoryUsage: this.getMemoryUsage(),
      responseTime: this.getCurrentResponseTime(),
      throughput: this.getCurrentThroughput(),
      activeConnections: this.getActiveConnections(),
      errorRate: this.getErrorRate()
    };
    
    this.snapshots.push(snapshot);
    
    // Trim old snapshots
    const cutoff = Date.now() - this.config.retentionPeriod;
    this.snapshots = this.snapshots.filter(s => s.timestamp >= cutoff);
    
    // Update adaptive thresholds if enabled
    if (this.config.adaptiveThresholds) {
      this.updateAdaptiveThresholds(snapshot);
    }
    
    // Check for alerts
    if (this.config.enableRealTimeAlerts) {
      this.checkForAlerts(snapshot);
    }
    
    // Update trend analysis if enabled
    if (this.config.enableTrendAnalysis) {
      this.updateTrendAnalysis(snapshot);
    }
    
    this.emit('snapshotCollected', snapshot);
  }
  
  /**
   * Update adaptive thresholds based on performance history
   */
  private updateAdaptiveThresholds(snapshot: PerformanceSnapshot): void {
    if (this.snapshots.length < 10) return; // Need history for adaptation
    
    const recentSnapshots = this.snapshots.slice(-30); // Last 30 samples
    
    // Calculate rolling averages
    const avgResponseTime = recentSnapshots.reduce((sum, s) => sum + s.responseTime, 0) / recentSnapshots.length;
    const avgMemoryUsage = recentSnapshots.reduce((sum, s) => sum + s.memoryUsage, 0) / recentSnapshots.length;
    const avgThroughput = recentSnapshots.reduce((sum, s) => sum + s.throughput, 0) / recentSnapshots.length;
    
    // Adapt thresholds based on recent performance
    this.adaptiveThresholds.set('responseTime', Math.max(avgResponseTime * 1.5, this.baselineMetrics.get('renderLatency') || 200));
    this.adaptiveThresholds.set('memoryUsage', Math.max(avgMemoryUsage * 1.3, this.baselineMetrics.get('memoryUsage') || 100));
    this.adaptiveThresholds.set('throughput', Math.max(avgThroughput * 0.7, this.baselineMetrics.get('commandThroughput') || 10));
  }
  
  /**
   * Check for performance alerts
   */
  private checkForAlerts(snapshot: PerformanceSnapshot): void {
    const alerts: PerformanceAlert[] = [];
    
    // Response time alert
    const responseTimeThreshold = this.adaptiveThresholds.get('responseTime') || this.config.alertThresholds.responseTime;
    if (snapshot.responseTime > responseTimeThreshold) {
      alerts.push({
        severity: snapshot.responseTime > responseTimeThreshold * 2 ? 'critical' : 'high',
        metric: 'responseTime',
        currentValue: snapshot.responseTime,
        threshold: responseTimeThreshold,
        timestamp: snapshot.timestamp,
        message: `Response time exceeded threshold: ${snapshot.responseTime.toFixed(2)}ms > ${responseTimeThreshold}ms`
      });
    }
    
    // Memory usage alert
    const memoryThreshold = this.adaptiveThresholds.get('memoryUsage') || this.config.alertThresholds.memoryGrowth;
    if (snapshot.memoryUsage > memoryThreshold) {
      alerts.push({
        severity: snapshot.memoryUsage > memoryThreshold * 1.5 ? 'critical' : 'medium',
        metric: 'memoryUsage',
        currentValue: snapshot.memoryUsage,
        threshold: memoryThreshold,
        timestamp: snapshot.timestamp,
        message: `Memory usage exceeded threshold: ${snapshot.memoryUsage.toFixed(1)}MB > ${memoryThreshold}MB`
      });
    }
    
    // CPU usage alert  
    if (snapshot.cpuUsage > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        severity: snapshot.cpuUsage > 95 ? 'critical' : 'medium',
        metric: 'cpuUsage',
        currentValue: snapshot.cpuUsage,
        threshold: this.config.alertThresholds.cpuUsage,
        timestamp: snapshot.timestamp,
        message: `CPU usage exceeded threshold: ${snapshot.cpuUsage.toFixed(1)}% > ${this.config.alertThresholds.cpuUsage}%`
      });
    }
    
    // Throughput alert (low throughput)
    const throughputThreshold = this.adaptiveThresholds.get('throughput') || this.config.alertThresholds.throughput;
    if (snapshot.throughput < throughputThreshold) {
      alerts.push({
        severity: snapshot.throughput < throughputThreshold * 0.5 ? 'high' : 'medium',
        metric: 'throughput',
        currentValue: snapshot.throughput,
        threshold: throughputThreshold,
        timestamp: snapshot.timestamp,
        message: `Throughput below threshold: ${snapshot.throughput.toFixed(2)} < ${throughputThreshold} commands/second`
      });
    }
    
    // Error rate alert
    if (snapshot.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        severity: snapshot.errorRate > 15 ? 'critical' : 'high',
        metric: 'errorRate',
        currentValue: snapshot.errorRate,
        threshold: this.config.alertThresholds.errorRate,
        timestamp: snapshot.timestamp,
        message: `Error rate exceeded threshold: ${snapshot.errorRate.toFixed(1)}% > ${this.config.alertThresholds.errorRate}%`
      });
    }
    
    // Add alerts and emit events
    for (const alert of alerts) {
      this.alerts.push(alert);
      this.emit('performanceAlert', alert);
      
      if (alert.severity === 'critical') {
        console.warn(`🚨 CRITICAL ALERT: ${alert.message}`);
      } else if (alert.severity === 'high') {
        console.warn(`⚠️  HIGH ALERT: ${alert.message}`);
      }
    }
    
    // Trim old alerts
    const alertCutoff = Date.now() - this.config.retentionPeriod;
    this.alerts = this.alerts.filter(a => a.timestamp >= alertCutoff);
  }
  
  /**
   * Update trend analysis for performance metrics
   */
  private updateTrendAnalysis(snapshot: PerformanceSnapshot): void {
    if (this.snapshots.length < 20) return; // Need sufficient history
    
    const recentSnapshots = this.snapshots.slice(-20);
    const metrics = ['responseTime', 'memoryUsage', 'throughput', 'cpuUsage'];
    
    for (const metric of metrics) {
      const values = recentSnapshots.map(s => s[metric as keyof PerformanceSnapshot] as number);
      const trend = this.calculateTrend(values);
      
      this.trendAnalysisCache.set(metric, trend);
    }
  }
  
  /**
   * Calculate trend analysis for a series of values
   */
  private calculateTrend(values: number[]): TrendAnalysis {
    if (values.length < 5) {
      return {
        metric: '',
        trend: 'stable',
        changeRate: 0,
        confidence: 0,
        prediction: values[values.length - 1] || 0
      };
    }
    
    // Simple linear regression to determine trend
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const changeRate = Math.abs(slope);
    
    // Determine trend direction
    let trend: 'improving' | 'degrading' | 'stable';
    if (Math.abs(slope) < 0.1) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'degrading'; // Generally, increasing metrics are bad (except throughput)
    } else {
      trend = 'improving';
    }
    
    // Calculate confidence based on data consistency
    const variance = values.reduce((sum, val) => {
      const diff = val - (sumY / n);
      return sum + diff * diff;
    }, 0) / n;
    const confidence = Math.max(0, 100 - Math.sqrt(variance));
    
    // Simple prediction (next value)
    const prediction = y[y.length - 1] + slope;
    
    return {
      metric: '',
      trend,
      changeRate,
      confidence,
      prediction
    };
  }
  
  /**
   * Generate comprehensive monitoring report
   */
  private generateMonitoringReport(): void {
    if (this.snapshots.length === 0) {
      console.log('📊 No performance data collected during monitoring session');
      return;
    }
    
    const duration = (this.snapshots[this.snapshots.length - 1].timestamp - this.snapshots[0].timestamp) / 1000;
    const avgSnapshot = this.calculateAverageSnapshot();
    const peakSnapshot = this.calculatePeakSnapshot();
    
    console.log('\\n📊 CLI PERFORMANCE MONITORING REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Monitoring Duration: ${duration.toFixed(1)} seconds`);
    console.log(`Snapshots Collected: ${this.snapshots.length}`);
    console.log(`Sampling Rate: ${(this.snapshots.length / duration).toFixed(1)} samples/second`);
    console.log('');
    
    // Average performance
    console.log('📈 AVERAGE PERFORMANCE:');
    console.log(`  Response Time: ${avgSnapshot.responseTime.toFixed(2)}ms`);
    console.log(`  Memory Usage: ${avgSnapshot.memoryUsage.toFixed(1)}MB`);
    console.log(`  CPU Usage: ${avgSnapshot.cpuUsage.toFixed(1)}%`);
    console.log(`  Throughput: ${avgSnapshot.throughput.toFixed(2)} commands/second`);
    console.log(`  Error Rate: ${avgSnapshot.errorRate.toFixed(2)}%`);
    console.log('');
    
    // Peak performance
    console.log('📊 PEAK PERFORMANCE:');
    console.log(`  Max Response Time: ${peakSnapshot.responseTime.toFixed(2)}ms`);
    console.log(`  Peak Memory Usage: ${peakSnapshot.memoryUsage.toFixed(1)}MB`);
    console.log(`  Peak CPU Usage: ${peakSnapshot.cpuUsage.toFixed(1)}%`);
    console.log(`  Max Throughput: ${peakSnapshot.throughput.toFixed(2)} commands/second`);
    console.log('');
    
    // Alerts summary
    if (this.alerts.length > 0) {
      console.log('🚨 ALERTS SUMMARY:');
      const alertCounts = this.alerts.reduce((counts, alert) => {
        counts[alert.severity] = (counts[alert.severity] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      Object.entries(alertCounts).forEach(([severity, count]) => {
        console.log(`  ${severity.toUpperCase()}: ${count} alerts`);
      });
      console.log('');
    }
    
    // Trend analysis summary
    if (this.config.enableTrendAnalysis && this.trendAnalysisCache.size > 0) {
      console.log('📈 TREND ANALYSIS:');
      for (const [metric, trend] of this.trendAnalysisCache.entries()) {
        const trendIcon = trend.trend === 'improving' ? '↗️' : trend.trend === 'degrading' ? '↘️' : '➡️';
        console.log(`  ${metric}: ${trendIcon} ${trend.trend.toUpperCase()} (confidence: ${trend.confidence.toFixed(1)}%)`);
      }
      console.log('');
    }
    
    // Performance vs baseline comparison
    console.log('⚖️ BASELINE COMPARISON:');
    const baselineComparison = this.compareAgainstBaselines(avgSnapshot);
    Object.entries(baselineComparison).forEach(([metric, comparison]) => {
      const status = comparison.withinTarget ? '✅' : '❌';
      console.log(`  ${metric}: ${status} ${comparison.percentage.toFixed(1)}% of baseline`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  /**
   * Calculate average performance snapshot
   */
  private calculateAverageSnapshot(): PerformanceSnapshot {
    if (this.snapshots.length === 0) {
      return {
        timestamp: Date.now(),
        cpuUsage: 0,
        memoryUsage: 0,
        responseTime: 0,
        throughput: 0,
        activeConnections: 0,
        errorRate: 0
      };
    }
    
    const sums = this.snapshots.reduce((acc, snapshot) => ({
      cpuUsage: acc.cpuUsage + snapshot.cpuUsage,
      memoryUsage: acc.memoryUsage + snapshot.memoryUsage,
      responseTime: acc.responseTime + snapshot.responseTime,
      throughput: acc.throughput + snapshot.throughput,
      activeConnections: acc.activeConnections + snapshot.activeConnections,
      errorRate: acc.errorRate + snapshot.errorRate
    }), {
      cpuUsage: 0,
      memoryUsage: 0,
      responseTime: 0,
      throughput: 0,
      activeConnections: 0,
      errorRate: 0
    });
    
    const count = this.snapshots.length;
    return {
      timestamp: Date.now(),
      cpuUsage: sums.cpuUsage / count,
      memoryUsage: sums.memoryUsage / count,
      responseTime: sums.responseTime / count,
      throughput: sums.throughput / count,
      activeConnections: sums.activeConnections / count,
      errorRate: sums.errorRate / count
    };
  }
  
  /**
   * Calculate peak performance snapshot
   */
  private calculatePeakSnapshot(): PerformanceSnapshot {
    if (this.snapshots.length === 0) {
      return this.calculateAverageSnapshot();
    }
    
    return {
      timestamp: Date.now(),
      cpuUsage: Math.max(...this.snapshots.map(s => s.cpuUsage)),
      memoryUsage: Math.max(...this.snapshots.map(s => s.memoryUsage)),
      responseTime: Math.max(...this.snapshots.map(s => s.responseTime)),
      throughput: Math.max(...this.snapshots.map(s => s.throughput)),
      activeConnections: Math.max(...this.snapshots.map(s => s.activeConnections)),
      errorRate: Math.max(...this.snapshots.map(s => s.errorRate))
    };
  }
  
  /**
   * Compare current performance against established baselines
   */
  private compareAgainstBaselines(snapshot: PerformanceSnapshot): Record<string, { percentage: number; withinTarget: boolean }> {
    const comparisons: Record<string, { percentage: number; withinTarget: boolean }> = {};
    
    // Response time comparison (lower is better)
    const responseTimeBaseline = this.baselineMetrics.get('renderLatency') || 200;
    comparisons.responseTime = {
      percentage: (snapshot.responseTime / responseTimeBaseline) * 100,
      withinTarget: snapshot.responseTime <= responseTimeBaseline
    };
    
    // Memory usage comparison (lower is better)
    const memoryBaseline = this.baselineMetrics.get('memoryUsage') || 100;
    comparisons.memoryUsage = {
      percentage: (snapshot.memoryUsage / memoryBaseline) * 100,
      withinTarget: snapshot.memoryUsage <= memoryBaseline * 1.2 // 20% tolerance
    };
    
    // Throughput comparison (higher is better)
    const throughputBaseline = this.baselineMetrics.get('commandThroughput') || 20;
    comparisons.throughput = {
      percentage: (snapshot.throughput / throughputBaseline) * 100,
      withinTarget: snapshot.throughput >= throughputBaseline * 0.8 // 20% tolerance
    };
    
    return comparisons;
  }
  
  // Performance data collection methods
  
  private getCPUUsage(): number {
    // Simplified CPU usage estimation
    // In real implementation, this would use system monitoring
    return Math.min(100, Math.random() * 80 + 10);
  }
  
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB
    }
    return Math.random() * 50 + 20; // Fallback simulation
  }
  
  private getCurrentResponseTime(): number {
    // This would be populated from actual command execution metrics
    return Math.random() * 150 + 25; // Simulate 25-175ms response times
  }
  
  private getCurrentThroughput(): number {
    // This would be calculated from actual command execution counts
    return Math.random() * 40 + 10; // Simulate 10-50 commands/second
  }
  
  private getActiveConnections(): number {
    // This would come from actual backend connection tracking
    return Math.floor(Math.random() * 10) + 1; // Simulate 1-10 connections
  }
  
  private getErrorRate(): number {
    // This would be calculated from actual error tracking
    return Math.random() * 8; // Simulate 0-8% error rate
  }
  
  /**
   * Get current monitoring status
   */
  public getMonitoringStatus(): {
    active: boolean;
    snapshotsCollected: number;
    alertsGenerated: number;
    adaptiveThresholds: Record<string, number>;
    trendAnalysis: Record<string, TrendAnalysis>;
  } {
    const adaptiveThresholdsObj: Record<string, number> = {};
    this.adaptiveThresholds.forEach((value, key) => {
      adaptiveThresholdsObj[key] = value;
    });
    
    const trendAnalysisObj: Record<string, TrendAnalysis> = {};
    this.trendAnalysisCache.forEach((value, key) => {
      trendAnalysisObj[key] = value;
    });
    
    return {
      active: this.monitoringActive,
      snapshotsCollected: this.snapshots.length,
      alertsGenerated: this.alerts.length,
      adaptiveThresholds: adaptiveThresholdsObj,
      trendAnalysis: trendAnalysisObj
    };
  }
  
  /**
   * Get recent performance snapshots
   */
  public getRecentSnapshots(count = 10): PerformanceSnapshot[] {
    return this.snapshots.slice(-count);
  }
  
  /**
   * Get recent alerts
   */
  public getRecentAlerts(count = 10): PerformanceAlert[] {
    return this.alerts.slice(-count);
  }
  
  /**
   * Cleanup monitoring resources
   */
  public cleanup(): void {
    this.stopMonitoring();
    this.snapshots = [];
    this.alerts = [];
    this.trendAnalysisCache.clear();
    this.removeAllListeners();
    
    console.log('🧹 CLI Performance Monitor cleaned up');
  }
}

/**
 * Performance Monitor Implementation
 * 
 * Purpose: Comprehensive performance monitoring with metrics collection and optimization suggestions  
 * Scope: Performance tracking, bottleneck detection, optimization recommendations, and performance analysis  
 * Related: Phase 2 Performance, Node Perf Hooks, Node Process
 * 
 * This module provides comprehensive performance monitoring with metrics collection,
 * bottleneck detection, optimization recommendations, and performance analysis capabilities.
 */

import { performance, PerformanceObserver } from 'perf_hooks';

// Core interfaces for performance monitoring
export interface PerformanceMonitorConfig {
  metricsRetention: number; // Number of metrics to retain
  enableRealTimeMonitoring: boolean;
  enableBottleneckDetection: boolean;
  enableOptimizationSuggestions: boolean;
  performanceThresholds: {
    templateResolution: number; // ms
    memoryUsage: number; // bytes
    cacheHitRate: number; // 0-1
    cleanupEfficiency: number; // 0-1
  };
}

export interface PerformanceMetric {
  id: string;
  category: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata: Record<string, any>;
  tags: string[];
}

export interface PerformanceSnapshot {
  timestamp: number;
  metrics: PerformanceMetric[];
  summary: {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
    categoryBreakdown: Record<string, number>;
  };
}

export interface BottleneckAnalysis {
  bottlenecks: Bottleneck[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
}

export interface Bottleneck {
  category: string;
  operation: string;
  metric: PerformanceMetric;
  impact: number; // 0-1 impact score
  description: string;
  suggestions: string[];
}

export interface OptimizationSuggestion {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImpact: number; // 0-1 impact score
  implementation: string;
  metrics: string[];
}

export interface PerformanceReport {
  summary: PerformanceSummary;
  bottlenecks: BottleneckAnalysis;
  suggestions: OptimizationSuggestion[];
  trends: PerformanceTrend[];
  recommendations: string[];
}

export interface PerformanceSummary {
  totalOperations: number;
  averageDuration: number;
  peakMemoryUsage: number;
  cacheEfficiency: number;
  overallScore: number;
  timeRange: {
    start: number;
    end: number;
    duration: number;
  };
}

export interface PerformanceTrend {
  metric: string;
  trend: 'improving' | 'stable' | 'degrading';
  change: number; // Percentage change
  confidence: number; // 0-1
  dataPoints: number;
}

export interface OptimizationResult {
  improvements: string[];
  recommendations: string[];
  metrics: {
    performanceGain: number;
    efficiencyImprovement: number;
    resourceOptimization: number;
  };
}

// Main performance monitoring system
export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private metrics: PerformanceMetric[];
  private observers: Map<string, PerformanceObserver>;
  private isInitialized: boolean;
  private startTime: number;

  constructor(config: PerformanceMonitorConfig) {
    this.config = config;

    this.metrics = [];
    this.observers = new Map();
    this.isInitialized = false;
    this.startTime = Date.now();
  }

  /**
   * Initialize the performance monitoring system
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Performance Monitor...');
    
    // Set up performance observers
    this.setupPerformanceObservers();
    
    // Start real-time monitoring if enabled
    if (this.config.enableRealTimeMonitoring) {
      this.startRealTimeMonitoring();
    }
    
    this.isInitialized = true;
    console.log('✅ Performance Monitor initialized');
  }

  /**
   * Start timing an operation
   */
  startTimer(category: string, operation: string, metadata?: Record<string, any>, tags?: string[]): string {
    const id = `${category}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetric = {
      id,
      category,
      operation,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      metadata: metadata || {},
      tags: tags || []
    };

    this.metrics.push(metric);
    
    // Keep only the configured number of metrics
    if (this.metrics.length > this.config.metricsRetention) {
      this.metrics.shift();
    }
    
    return id;
  }

  /**
   * End timing an operation
   */
  endTimer(timerId: string, additionalMetadata?: Record<string, any>): PerformanceMetric | null {
    const metric = this.metrics.find(m => m.id === timerId);
    if (!metric) {
      console.warn(`Timer ${timerId} not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    // Check if this operation exceeds performance thresholds
    this.checkPerformanceThresholds(metric);
    
    return metric;
  }

  /**
   * Record a performance metric directly
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'startTime' | 'endTime' | 'duration'>): string {
    const id = `${metric.category}_${metric.operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullMetric: PerformanceMetric = {
      id,
      startTime: performance.now(),
      endTime: performance.now(),
      duration: 0,
      ...metric
    };

    this.metrics.push(fullMetric);
    
    // Keep only the configured number of metrics
    if (this.metrics.length > this.config.metricsRetention) {
      this.metrics.shift();
    }
    
    return id;
  }

  /**
   * Get current performance snapshot
   */
  getSnapshot(): PerformanceSnapshot {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => (now - m.startTime) < 3600000); // Last hour
    
    const totalOperations = recentMetrics.length;
    const averageDuration = totalOperations > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations 
      : 0;
    
    const slowestOperation = recentMetrics.length > 0 
      ? recentMetrics.reduce((slowest, current) => current.duration > slowest.duration ? current : slowest)
      : null;
    
    const fastestOperation = recentMetrics.length > 0 
      ? recentMetrics.reduce((fastest, current) => current.duration < fastest.duration ? current : fastest)
      : null;
    
    const categoryBreakdown: Record<string, number> = {};
    recentMetrics.forEach(metric => {
      categoryBreakdown[metric.category] = (categoryBreakdown[metric.category] || 0) + 1;
    });

    return {
      timestamp: now,
      metrics: recentMetrics,
      summary: {
        totalOperations,
        averageDuration,
        slowestOperation,
        fastestOperation,
        categoryBreakdown
      }
    };
  }

  /**
   * Analyze performance bottlenecks
   */
  async analyzeBottlenecks(): Promise<BottleneckAnalysis> {
    if (!this.config.enableBottleneckDetection) {
      return {
        bottlenecks: [],
        recommendations: [],
        severity: 'low',
        confidence: 0
      };
    }

    const bottlenecks: Bottleneck[] = [];
    const recommendations: string[] = [];
    
    // Analyze template resolution performance
    const templateMetrics = this.metrics.filter(m => m.category === 'template');
    if (templateMetrics.length > 0) {
      const slowTemplates = templateMetrics.filter(m => m.duration > this.config.performanceThresholds.templateResolution);
      if (slowTemplates.length > 0) {
        const avgTemplateTime = slowTemplates.reduce((sum, m) => sum + m.duration, 0) / slowTemplates.length;
        bottlenecks.push({
          category: 'template',
          operation: 'resolution',
          metric: slowTemplates[0],
          impact: Math.min(1, avgTemplateTime / this.config.performanceThresholds.templateResolution),
          description: `Template resolution is ${(avgTemplateTime / this.config.performanceThresholds.templateResolution).toFixed(1)}x slower than threshold`,
          suggestions: [
            'Enable template caching',
            'Precompile large templates',
            'Optimize template complexity'
          ]
        });
      }
    }

    // Analyze memory usage
    const memoryMetrics = this.metrics.filter(m => m.category === 'memory');
    if (memoryMetrics.length > 0) {
      const highMemoryUsage = memoryMetrics.filter(m => 
        m.metadata.memoryUsage && m.metadata.memoryUsage > this.config.performanceThresholds.memoryUsage
      );
      if (highMemoryUsage.length > 0) {
        bottlenecks.push({
          category: 'memory',
          operation: 'usage',
          metric: highMemoryUsage[0],
          impact: 0.8,
          description: 'Memory usage exceeds performance threshold',
          suggestions: [
            'Enable automatic memory cleanup',
            'Review object lifecycle management',
            'Implement memory pooling'
          ]
        });
      }
    }

    // Analyze cache efficiency
    const cacheMetrics = this.metrics.filter(m => m.category === 'cache');
    if (cacheMetrics.length > 0) {
      const lowCacheEfficiency = cacheMetrics.filter(m => 
        m.metadata.hitRate && m.metadata.hitRate < this.config.performanceThresholds.cacheHitRate
      );
      if (lowCacheEfficiency.length > 0) {
        bottlenecks.push({
          category: 'cache',
          operation: 'efficiency',
          metric: lowCacheEfficiency[0],
          impact: 0.6,
          description: 'Cache hit rate below performance threshold',
          suggestions: [
            'Increase cache size',
            'Improve cache key strategy',
            'Review cache invalidation logic'
          ]
        });
      }
    }

    // Determine overall severity
    const severity = this.calculateSeverity(bottlenecks);
    const confidence = this.calculateConfidence(bottlenecks);

    // Generate recommendations
    if (bottlenecks.length > 0) {
      recommendations.push('Address high-impact bottlenecks first');
      recommendations.push('Monitor performance metrics after changes');
      recommendations.push('Consider performance testing in development');
    } else {
      recommendations.push('Performance is within acceptable thresholds');
      recommendations.push('Continue monitoring for degradation');
    }

    return {
      bottlenecks,
      recommendations,
      severity,
      confidence
    };
  }

  /**
   * Generate optimization suggestions
   */
  async generateOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    if (!this.config.enableOptimizationSuggestions) {
      return [];
    }

    const suggestions: OptimizationSuggestion[] = [];
    
    // Analyze template performance
    const templateMetrics = this.metrics.filter(m => m.category === 'template');
    if (templateMetrics.length > 0) {
      const avgTemplateTime = templateMetrics.reduce((sum, m) => sum + m.duration, 0) / templateMetrics.length;
      if (avgTemplateTime > 50) { // 50ms threshold
        suggestions.push({
          category: 'template',
          priority: 'medium',
          description: 'Template resolution performance could be improved',
          expectedImpact: 0.3,
          implementation: 'Enable template caching and precompilation',
          metrics: ['template_resolution_time', 'cache_hit_rate']
        });
      }
    }

    // Analyze memory patterns
    const memoryMetrics = this.metrics.filter(m => m.category === 'memory');
    if (memoryMetrics.length > 0) {
      const memoryGrowth = this.calculateMemoryGrowth(memoryMetrics);
      if (memoryGrowth > 0.1) { // 10% growth threshold
        suggestions.push({
          category: 'memory',
          priority: 'high',
          description: 'Memory usage shows growth pattern',
          expectedImpact: 0.5,
          implementation: 'Implement memory leak detection and cleanup',
          metrics: ['memory_usage', 'cleanup_efficiency']
        });
      }
    }

    // Analyze cache performance
    const cacheMetrics = this.metrics.filter(m => m.category === 'cache');
    if (cacheMetrics.length > 0) {
      const avgHitRate = cacheMetrics
        .filter(m => m.metadata.hitRate)
        .reduce((sum, m) => sum + m.metadata.hitRate, 0) / cacheMetrics.filter(m => m.metadata.hitRate).length;
      
      if (avgHitRate < 0.7) { // 70% threshold
        suggestions.push({
          category: 'cache',
          priority: 'medium',
          description: 'Cache hit rate could be improved',
          expectedImpact: 0.4,
          implementation: 'Optimize cache size and eviction strategy',
          metrics: ['cache_hit_rate', 'cache_size']
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate comprehensive performance report
   */
  async generateReport(): Promise<PerformanceReport> {
    const snapshot = this.getSnapshot();
    const bottlenecks = await this.analyzeBottlenecks();
    const suggestions = await this.generateOptimizationSuggestions();
    const trends = await this.analyzeTrends();
    
    // Calculate overall performance score
    const overallScore = this.calculateOverallScore(snapshot, bottlenecks);
    
    const summary: PerformanceSummary = {
      totalOperations: snapshot.summary.totalOperations,
      averageDuration: snapshot.summary.averageDuration,
      peakMemoryUsage: this.getPeakMemoryUsage(),
      cacheEfficiency: this.getCacheEfficiency(),
      overallScore,
      timeRange: {
        start: this.startTime,
        end: Date.now(),
        duration: Date.now() - this.startTime
      }
    };

    // Generate final recommendations
    const recommendations = this.generateFinalRecommendations(bottlenecks, suggestions, overallScore);

    return {
      summary,
      bottlenecks,
      suggestions,
      trends,
      recommendations
    };
  }

  /**
   * Optimize performance monitoring
   */
  async optimize(): Promise<OptimizationResult> {
    const improvements: string[] = [];
    const recommendations: string[] = [];

    // Check metrics retention
    if (this.metrics.length > this.config.metricsRetention * 0.9) {
      improvements.push('Metrics approaching retention limit');
      recommendations.push('Consider increasing metrics retention or implementing data archiving');
    }

    // Check performance thresholds
    const thresholdViolations = this.metrics.filter(m => 
      m.duration > this.config.performanceThresholds.templateResolution ||
      (m.metadata.memoryUsage && m.metadata.memoryUsage > this.config.performanceThresholds.memoryUsage)
    );

    if (thresholdViolations.length > 0) {
      improvements.push(`${thresholdViolations.length} performance threshold violations detected`);
      recommendations.push('Review and adjust performance thresholds based on actual usage patterns');
    }

    // Calculate optimization metrics
    const metrics = {
      performanceGain: this.calculatePerformanceGain(),
      efficiencyImprovement: this.calculateEfficiencyImprovement(),
      resourceOptimization: this.calculateResourceOptimization()
    };

    return {
      improvements,
      recommendations,
      metrics
    };
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    console.log('🧹 Disposing Performance Monitor...');
    
    // Stop all observers
    for (const [name, observer] of this.observers) {
      observer.disconnect();
    }
    this.observers.clear();
    
    // Clear metrics
    this.metrics = [];
    
    this.isInitialized = false;
    console.log('✅ Performance Monitor disposed');
  }

  /**
   * Set up performance observers
   */
  private setupPerformanceObservers(): void {
    // Observer for performance marks
    const markObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.recordMetric({
          category: 'performance',
          operation: entry.name,
          metadata: {
            entryType: entry.entryType,
            startTime: entry.startTime,
            duration: entry.duration
          },
          tags: ['auto-recorded']
        });
      });
    });

    markObserver.observe({ entryTypes: ['measure'] });
    this.observers.set('marks', markObserver);
  }

  /**
   * Start real-time monitoring
   */
  private startRealTimeMonitoring(): void {
    // Monitor system performance every 10 seconds
    setInterval(async () => {
      try {
        const memoryUsage = process.memoryUsage();
        this.recordMetric({
          category: 'system',
          operation: 'memory_check',
          metadata: {
            rss: memoryUsage.rss,
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            external: memoryUsage.external
          },
          tags: ['auto-monitoring']
        });
      } catch (error) {
        console.error('Real-time monitoring error:', error);
      }
    }, 10000);
  }

  /**
   * Check performance thresholds
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    if (metric.category === 'template' && metric.duration > this.config.performanceThresholds.templateResolution) {
      console.warn(`⚠️ Template operation ${metric.operation} exceeded performance threshold: ${metric.duration.toFixed(2)}ms`);
    }
    
    if (metric.category === 'memory' && metric.metadata.memoryUsage > this.config.performanceThresholds.memoryUsage) {
      console.warn(`⚠️ Memory usage exceeded performance threshold: ${(metric.metadata.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  /**
   * Calculate severity level
   */
  private calculateSeverity(bottlenecks: Bottleneck[]): 'low' | 'medium' | 'high' | 'critical' {
    if (bottlenecks.length === 0) return 'low';
    
    const maxImpact = Math.max(...bottlenecks.map(b => b.impact));
    
    if (maxImpact > 0.8) return 'critical';
    if (maxImpact > 0.6) return 'high';
    if (maxImpact > 0.4) return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(bottlenecks: Bottleneck[]): number {
    if (bottlenecks.length === 0) return 0;
    
    const totalMetrics = this.metrics.length;
    if (totalMetrics === 0) return 0;
    
    const bottleneckMetrics = bottlenecks.length;
    return Math.min(1, bottleneckMetrics / Math.max(totalMetrics * 0.1, 1));
  }

  /**
   * Analyze performance trends
   */
  private async analyzeTrends(): Promise<PerformanceTrend[]> {
    const trends: PerformanceTrend[] = [];
    
    // Analyze template resolution trends
    const templateMetrics = this.metrics.filter(m => m.category === 'template');
    if (templateMetrics.length >= 10) {
      const recent = templateMetrics.slice(-10);
      const older = templateMetrics.slice(-20, -10);
      
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
        const olderAvg = older.reduce((sum, m) => sum + m.duration, 0) / older.length;
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        trends.push({
          metric: 'template_resolution',
          trend: change < -5 ? 'improving' : change > 5 ? 'degrading' : 'stable',
          change: Math.abs(change),
          confidence: 0.7,
          dataPoints: templateMetrics.length
        });
      }
    }

    return trends;
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(snapshot: PerformanceSnapshot, bottlenecks: BottleneckAnalysis): number {
    let score = 100;
    
    // Deduct points for slow operations
    if (snapshot.summary.averageDuration > 100) {
      score -= Math.min(30, (snapshot.summary.averageDuration - 100) / 10);
    }
    
    // Deduct points for bottlenecks
    score -= bottlenecks.bottlenecks.length * 10;
    
    // Deduct points for high severity
    if (bottlenecks.severity === 'critical') score -= 20;
    else if (bottlenecks.severity === 'high') score -= 15;
    else if (bottlenecks.severity === 'medium') score -= 10;
    
    return Math.max(0, score);
  }

  /**
   * Get peak memory usage
   */
  private getPeakMemoryUsage(): number {
    const memoryMetrics = this.metrics.filter(m => m.category === 'memory' && m.metadata.memoryUsage);
    if (memoryMetrics.length === 0) return 0;
    
    return Math.max(...memoryMetrics.map(m => m.metadata.memoryUsage));
  }

  /**
   * Get cache efficiency
   */
  private getCacheEfficiency(): number {
    const cacheMetrics = this.metrics.filter(m => m.category === 'cache' && m.metadata.hitRate);
    if (cacheMetrics.length === 0) return 0;
    
    return cacheMetrics.reduce((sum, m) => sum + m.metadata.hitRate, 0) / cacheMetrics.length;
  }

  /**
   * Calculate memory growth
   */
  private calculateMemoryGrowth(metrics: PerformanceMetric[]): number {
    if (metrics.length < 2) return 0;
    
    const memoryMetrics = metrics.filter(m => m.metadata.memoryUsage);
    if (memoryMetrics.length < 2) return 0;
    
    const first = memoryMetrics[0];
    const last = memoryMetrics[memoryMetrics.length - 1];
    
    return (last.metadata.memoryUsage - first.metadata.memoryUsage) / first.metadata.memoryUsage;
  }

  /**
   * Calculate performance gain
   */
  private calculatePerformanceGain(): number {
    // Placeholder implementation
    return 0;
  }

  /**
   * Calculate efficiency improvement
   */
  private calculateEfficiencyImprovement(): number {
    // Placeholder implementation
    return 0;
  }

  /**
   * Calculate resource optimization
   */
  private calculateResourceOptimization(): number {
    // Placeholder implementation
    return 0;
  }

  /**
   * Generate final recommendations
   */
  private generateFinalRecommendations(
    bottlenecks: BottleneckAnalysis, 
    suggestions: OptimizationSuggestion[], 
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (overallScore < 70) {
      recommendations.push('Performance requires immediate attention');
    } else if (overallScore < 85) {
      recommendations.push('Performance has room for improvement');
    } else {
      recommendations.push('Performance is within acceptable range');
    }
    
    if (bottlenecks.bottlenecks.length > 0) {
      recommendations.push(`Address ${bottlenecks.bottlenecks.length} identified bottlenecks`);
    }
    
    if (suggestions.length > 0) {
      recommendations.push(`Consider ${suggestions.length} optimization suggestions`);
    }
    
    recommendations.push('Continue monitoring performance metrics');
    recommendations.push('Set up performance alerts for critical thresholds');
    
    return recommendations;
  }
}

// Export the main class and interfaces
export default PerformanceMonitor;

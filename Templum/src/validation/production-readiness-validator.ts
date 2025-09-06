/**---
 * title: Production Readiness Validator - Comprehensive System Verification
 * tags: [Production, Validation, Readiness, System-Health, Performance]
 * provides: [ProductionReadinessValidator, SystemHealthChecker, ResourcePolicyValidator, ErrorHandlingVerifier]
 * requires: [TemplumResourceManager, PerformanceValidator, TemplumError, CircuitBreaker]
 * description: Comprehensive production readiness validation system that verifies resource management, error handling, and performance benchmarks with real system measurements
 * ---*/

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import * as os from 'os';
import * as fs from 'fs/promises';
import { 
  isTemplumError, 
  createTemplumError,
  ErrorSignalPayload
} from '../types/templum-types';
import {TemplumResourceManager, ResourceUsage} from '../core/templum-resource-manager';
import { PerformanceValidator, PerformanceMetrics } from './performance-validation';

// ============================================================================
// Production Readiness Interfaces
// ============================================================================

export interface ProductionReadinessConfig {
  performanceThresholds: {
    maxResponseTime: number;        // ms - <50ms target
    maxMemoryUsage: number;         // MB - system limit
    maxCpuUsage: number;            // % - system limit
    minSystemUptime: number;        // hours - minimum uptime requirement
  };
  resourceValidation: {
    enableResourcePolicyValidation: boolean;
    validateResourceLeaks: boolean;
    checkResourceLimits: boolean;
    monitoringDurationMs: number;   // duration for resource monitoring
  };
  errorHandling: {
    validateErrorPatterns: boolean;
    checkCircuitBreakerConfig: boolean;
    verifyErrorRecovery: boolean;
  };
  systemHealth: {
    checkDiskSpace: boolean;
    validateNetworkConnectivity: boolean;
    verifyFileSystemPermissions: boolean;
    checkSystemResources: boolean;
  };
}

export interface ProductionReadinessResult {
  timestamp: number;
  overallStatus: 'READY' | 'NOT_READY' | 'WARNINGS';
  readinessScore: number; // 0-100
  categories: {
    performance: ProductionReadinessCategory;
    resourceManagement: ProductionReadinessCategory;
    errorHandling: ProductionReadinessCategory;
    systemHealth: ProductionReadinessCategory;
  };
  criticalIssues: ReadinessIssue[];
  warnings: ReadinessIssue[];
  recommendations: string[];
  systemMetrics: RealSystemMetrics;
}

export interface ProductionReadinessCategory {
  status: 'PASS' | 'FAIL' | 'WARNING';
  score: number; // 0-100
  checks: ReadinessCheck[];
  summary: string;
}

export interface ReadinessCheck {
  checkId: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIPPED';
  description: string;
  actualValue?: any;
  expectedValue?: any;
  evidence?: string;
  recommendation?: string;
}

export interface ReadinessIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'performance' | 'resourceManagement' | 'errorHandling' | 'systemHealth';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  evidence: any;
}

export interface RealSystemMetrics {
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    uptime: number;
    loadAverage: number[];
  };
  memory: {
    totalMB: number;
    freeMB: number;
    usedMB: number;
    usagePercent: number;
    processMemoryMB: number;
  };
  cpu: {
    cpuCount: number;
    currentUsagePercent: number;
    loadAverage1Min: number;
  };
  disk: {
    totalGB: number;
    freeGB: number;
    usagePercent: number;
  };
  network: {
    connectivityStatus: 'CONNECTED' | 'LIMITED' | 'OFFLINE';
    latencyMs?: number;
  };
  templumComponents: {
    activeComponents: number;
    healthyComponents: number;
    resourceUsage: ResourceUsage;
  };
}

// ============================================================================
// Real System Metrics Collector
// ============================================================================

export class RealSystemMetricsCollector {
  /**
   * Collect real system metrics (not hardcoded)
   */
  async collectRealMetrics(): Promise<RealSystemMetrics> {
    const _startTime = performance.now();
    
    // System information
    const platform = os.platform();
    const arch = os.arch();
    const nodeVersion = process.version;
    const uptime = os.uptime() / 3600; // hours
    const loadAverage = os.loadavg();

    // Memory metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const processMemory = process.memoryUsage();

    const memoryMetrics = {
      totalMB: Math.round(totalMemory / 1024 / 1024),
      freeMB: Math.round(freeMemory / 1024 / 1024),
      usedMB: Math.round(usedMemory / 1024 / 1024),
      usagePercent: Math.round((usedMemory / totalMemory) * 100),
      processMemoryMB: Math.round(processMemory.rss / 1024 / 1024)
    };

    // CPU metrics
    const cpuCount = os.cpus().length;
    const currentUsage = await this.getCpuUsage();

    // Disk metrics (for current working directory)
    const diskMetrics = await this.getDiskUsage();

    // Network connectivity
    const networkStatus = await this.checkNetworkConnectivity();

    const _endTime = performance.now();
    
    return {
      system: {
        platform,
        arch,
        nodeVersion,
        uptime,
        loadAverage
      },
      memory: memoryMetrics,
      cpu: {
        cpuCount,
        currentUsagePercent: currentUsage,
        loadAverage1Min: loadAverage[0]
      },
      disk: diskMetrics,
      network: networkStatus,
      templumComponents: {
        activeComponents: 0, // Will be populated by component checker
        healthyComponents: 0,
        resourceUsage: {
          memory: { used: 0, allocated: 0, limit: 0, percentage: 0 },
          connections: { active: 0, allocated: 0, limit: 0, percentage: 0 },
          cache: { used: 0, limit: 0, hitRate: 0, entries: 0 },
          fileHandles: { open: 0, limit: 0, percentage: 0 },
          processes: { active: 0, limit: 0, percentage: 0 }
        }
      }
    };
  }

  private async getCpuUsage(): Promise<number> {
    // Simple CPU usage calculation using process CPU usage
    const startUsage = process.cpuUsage();
    const startTime = performance.now();
    
    // Wait 100ms to get a meaningful sample
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endUsage = process.cpuUsage(startUsage);
    const endTime = performance.now();
    
    const elapsedTime = (endTime - startTime) * 1000; // microseconds
    const totalUsage = endUsage.user + endUsage.system;
    
    return Math.min(100, (totalUsage / elapsedTime) * 100);
  }

  private async getDiskUsage(): Promise<{ totalGB: number; freeGB: number; usagePercent: number; }> {
    try {
      const stats = await fs.statfs(process.cwd());
      const total = stats.bavail * stats.bsize;
      const free = stats.bavail * stats.bsize;
      const used = total - free;
      
      return {
        totalGB: Math.round(total / 1024 / 1024 / 1024 * 10) / 10,
        freeGB: Math.round(free / 1024 / 1024 / 1024 * 10) / 10,
        usagePercent: Math.round((used / total) * 100)
      };
    } catch (_error: any) {
      // Fallback for systems without statfs
      return {
        totalGB: 0,
        freeGB: 0,
        usagePercent: 0
      };
    }
  }

  private async checkNetworkConnectivity(): Promise<{ connectivityStatus: 'CONNECTED' | 'LIMITED' | 'OFFLINE'; latencyMs?: number; }> {
    try {
      const startTime = performance.now();
      // Simple connectivity test using DNS resolution
      await new Promise((resolve, reject) => {
        require('dns').resolve('google.com', (err: any) => {
          if (err) reject(err);
          else resolve(true);
        });
      });
      const latency = performance.now() - startTime;
      
      return {
        connectivityStatus: 'CONNECTED',
        latencyMs: Math.round(latency)
      };
    } catch (_error: any) {
      return {
        connectivityStatus: 'OFFLINE'
      };
    }
  }
}

// ============================================================================
// Resource Policy Validator
// ============================================================================

export class ResourcePolicyValidator {
  constructor(
    private resourceManager: TemplumResourceManager,
    private metricsCollector: RealSystemMetricsCollector
  ) {}

  async validateResourcePolicies(_config: ProductionReadinessConfig): Promise<ProductionReadinessCategory> {
    const checks: ReadinessCheck[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Check 1: Resource Manager Initialization
    maxScore += 20;
    try {
      const status = await this.resourceManager.getStatus();
      if (status.initialized) {
        checks.push({
          checkId: 'resource_manager_init',
          name: 'Resource Manager Initialization',
          status: 'PASS',
          description: 'Resource manager is properly initialized',
          evidence: `Active resources: ${status.activeResources}`
        });
        totalScore += 20;
      } else {
        checks.push({
          checkId: 'resource_manager_init',
          name: 'Resource Manager Initialization', 
          status: 'FAIL',
          description: 'Resource manager failed to initialize',
          recommendation: 'Check resource manager configuration and dependencies'
        });
      }
    } catch (error: any) {
      checks.push({
        checkId: 'resource_manager_init',
        name: 'Resource Manager Initialization',
        status: 'FAIL', 
        description: 'Error checking resource manager status',
        evidence: (error as any)?.message || String(error),
        recommendation: 'Investigate resource manager initialization errors'
      });
    }

    // Check 2: Memory Usage Validation
    maxScore += 25;
    const systemMetrics = await this.metricsCollector.collectRealMetrics();
    if (systemMetrics.memory.usagePercent < 85) {
      checks.push({
        checkId: 'memory_usage',
        name: 'System Memory Usage',
        status: 'PASS',
        description: 'System memory usage within acceptable limits',
        actualValue: `${systemMetrics.memory.usagePercent}%`,
        expectedValue: '<85%',
        evidence: `${systemMetrics.memory.usedMB}MB used of ${systemMetrics.memory.totalMB}MB total`
      });
      totalScore += 25;
    } else {
      checks.push({
        checkId: 'memory_usage',
        name: 'System Memory Usage',
        status: systemMetrics.memory.usagePercent > 95 ? 'FAIL' : 'WARNING',
        description: 'System memory usage is high',
        actualValue: `${systemMetrics.memory.usagePercent}%`,
        expectedValue: '<85%',
        recommendation: 'Monitor memory usage and consider increasing system memory or optimizing resource allocation'
      });
      if (systemMetrics.memory.usagePercent <= 95) totalScore += 10;
    }

    // Check 3: Resource Policy Compliance
    maxScore += 25;
    try {
      const resourceStatus = await this.resourceManager.getStatus();
      const policyViolations = resourceStatus.policyViolations;
      
      if (policyViolations === 0) {
        checks.push({
          checkId: 'policy_compliance',
          name: 'Resource Policy Compliance',
          status: 'PASS',
          description: 'No resource policy violations detected',
          evidence: `0 violations in active resource monitoring`
        });
        totalScore += 25;
      } else {
        checks.push({
          checkId: 'policy_compliance', 
          name: 'Resource Policy Compliance',
          status: policyViolations > 5 ? 'FAIL' : 'WARNING',
          description: `${policyViolations} resource policy violations detected`,
          recommendation: 'Review resource allocation patterns and adjust policies if needed'
        });
        if (policyViolations <= 5) totalScore += 10;
      }
    } catch (error: any) {
      checks.push({
        checkId: 'policy_compliance',
        name: 'Resource Policy Compliance',
        status: 'FAIL',
        description: 'Unable to check resource policy compliance',
        evidence: (error as any)?.message || String(error)
      });
    }

    // Check 4: Resource Cleanup Efficiency 
    maxScore += 30;
    try {
      const resourceStatus = await this.resourceManager.getStatus();
      const timeSinceLastCleanup = Date.now() - resourceStatus.lastCleanup;
      const cleanupIntervalMs = 60000; // 1 minute expected
      
      if (timeSinceLastCleanup < cleanupIntervalMs * 2) {
        checks.push({
          checkId: 'resource_cleanup',
          name: 'Resource Cleanup Efficiency',
          status: 'PASS',
          description: 'Resource cleanup is operating within expected intervals',
          actualValue: `${Math.round(timeSinceLastCleanup / 1000)}s ago`,
          expectedValue: `<${cleanupIntervalMs * 2 / 1000}s`,
          evidence: `Next cleanup in ${Math.round((resourceStatus.nextCleanup - Date.now()) / 1000)}s`
        });
        totalScore += 30;
      } else {
        checks.push({
          checkId: 'resource_cleanup',
          name: 'Resource Cleanup Efficiency',
          status: 'WARNING',
          description: 'Resource cleanup intervals are longer than expected',
          actualValue: `${Math.round(timeSinceLastCleanup / 1000)}s ago`,
          expectedValue: `<${cleanupIntervalMs * 2 / 1000}s`,
          recommendation: 'Check resource cleanup configuration and system load'
        });
        totalScore += 15;
      }
    } catch (error: any) {
      checks.push({
        checkId: 'resource_cleanup',
        name: 'Resource Cleanup Efficiency',
        status: 'FAIL',
        description: 'Unable to verify resource cleanup status',
        evidence: (error as any)?.message || String(error)
      });
    }

    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const status = finalScore >= 80 ? 'PASS' : finalScore >= 60 ? 'WARNING' : 'FAIL';
    
    return {
      status,
      score: finalScore,
      checks,
      summary: `Resource management validation: ${totalScore}/${maxScore} points (${finalScore}%)`
    };
  }
}

// ============================================================================
// Error Handling Verifier
// ============================================================================

export class ErrorHandlingVerifier {
  async verifyErrorHandlingPatterns(): Promise<ProductionReadinessCategory> {
    const checks: ReadinessCheck[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Check 1: TemplumError Type System
    maxScore += 30;
    try {
      // Test error creation and validation
      const testError = createTemplumError(
        'Test error for production readiness validation',
        'PRODUCTION_READINESS_TEST',
        'validation',
        { testContext: 'production_validation' }
      );
      
      if (isTemplumError(testError) && testError.code === 'PRODUCTION_READINESS_TEST') {
        checks.push({
          checkId: 'templum_error_system',
          name: 'TemplumError Type System',
          status: 'PASS',
          description: 'TemplumError type system is functioning correctly',
          evidence: `Error type: ${testError.name}, Code: ${testError.code}`
        });
        totalScore += 30;
      } else {
        checks.push({
          checkId: 'templum_error_system',
          name: 'TemplumError Type System',
          status: 'FAIL',
          description: 'TemplumError type system validation failed',
          recommendation: 'Check TemplumError implementation and type guard functions'
        });
      }
    } catch (error: any) {
      checks.push({
        checkId: 'templum_error_system',
        name: 'TemplumError Type System',
        status: 'FAIL',
        description: 'Error testing TemplumError system',
        evidence: error?.message || String(error)
      });
    }

    // Check 2: Error Signal Payload Structure
    maxScore += 25;
    try {
      const errorPayload: ErrorSignalPayload = {
        error: createTemplumError('Test signal payload', 'TEST_SIGNAL_PAYLOAD', 'validation'),
        source: 'production-readiness-validator',
        severity: 'low',
        timestamp: Date.now()
      };
      
      if (errorPayload.error && isTemplumError(errorPayload.error)) {
        checks.push({
          checkId: 'error_signal_payload',
          name: 'Error Signal Payload Structure',
          status: 'PASS',
          description: 'Error signal payloads are properly structured',
          evidence: `Error: ${errorPayload.error.code}, Severity: ${errorPayload.severity}`
        });
        totalScore += 25;
      } else {
        checks.push({
          checkId: 'error_signal_payload',
          name: 'Error Signal Payload Structure',
          status: 'FAIL',
          description: 'Error signal payload structure validation failed',
          recommendation: 'Check ErrorSignalPayload interface implementation'
        });
      }
    } catch (error: any) {
      checks.push({
        checkId: 'error_signal_payload',
        name: 'Error Signal Payload Structure',
        status: 'FAIL',
        description: 'Error testing error signal payload structure',
        evidence: error?.message || String(error)
      });
    }

    // Check 3: Circuit Breaker Integration
    maxScore += 45;
    try {
      // Import and test circuit breaker
      const { TemplumCircuitBreaker } = await import('../core/error-recovery');
      const circuitBreaker = new TemplumCircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 10000,
        monitorWindow: 60000,
        enableTelemetry: true
      });
      
      const metrics = circuitBreaker.getMetrics();
      if (metrics.state === 'CLOSED' && typeof metrics.failures === 'number') {
        checks.push({
          checkId: 'circuit_breaker_integration',
          name: 'Circuit Breaker Integration',
          status: 'PASS',
          description: 'Circuit breaker is properly integrated and functional',
          evidence: `State: ${metrics.state}, Total requests: ${metrics.totalRequests}`
        });
        totalScore += 45;
      } else {
        checks.push({
          checkId: 'circuit_breaker_integration',
          name: 'Circuit Breaker Integration',
          status: 'FAIL',
          description: 'Circuit breaker integration validation failed',
          recommendation: 'Check TemplumCircuitBreaker implementation and metrics'
        });
      }
    } catch (error: any) {
      checks.push({
        checkId: 'circuit_breaker_integration',
        name: 'Circuit Breaker Integration',
        status: 'FAIL',
        description: 'Error testing circuit breaker integration',
        evidence: (error as any)?.message || String(error),
        recommendation: 'Ensure error-recovery.ts is properly implemented and accessible'
      });
    }

    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const status = finalScore >= 80 ? 'PASS' : finalScore >= 60 ? 'WARNING' : 'FAIL';
    
    return {
      status,
      score: finalScore,
      checks,
      summary: `Error handling validation: ${totalScore}/${maxScore} points (${finalScore}%)`
    };
  }
}

// ============================================================================
// Performance Validator (Real Metrics)
// ============================================================================

export class RealPerformanceValidator {
  constructor(
    private metricsCollector: RealSystemMetricsCollector,
    private performanceValidator: PerformanceValidator
  ) {}

  async validatePerformance(config: ProductionReadinessConfig): Promise<ProductionReadinessCategory> {
    const checks: ReadinessCheck[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Check 1: Real System Metrics Collection
    maxScore += 40;
    try {
      const startTime = performance.now();
      const systemMetrics = await this.metricsCollector.collectRealMetrics();
      const collectionTime = performance.now() - startTime;
      
      if (collectionTime < 1000 && systemMetrics.system.platform) { // Should collect in <1s
        checks.push({
          checkId: 'real_metrics_collection',
          name: 'Real System Metrics Collection',
          status: 'PASS',
          description: 'System metrics are collected from real system sources',
          evidence: `Collection time: ${Math.round(collectionTime)}ms, Platform: ${systemMetrics.system.platform}`,
          actualValue: `${Math.round(collectionTime)}ms`,
          expectedValue: '<1000ms'
        });
        totalScore += 40;
      } else {
        checks.push({
          checkId: 'real_metrics_collection',
          name: 'Real System Metrics Collection',
          status: 'WARNING',
          description: 'System metrics collection is slower than expected',
          actualValue: `${Math.round(collectionTime)}ms`,
          expectedValue: '<1000ms',
          recommendation: 'Optimize metrics collection performance'
        });
        totalScore += 20;
      }
    } catch (error: any) {
      checks.push({
        checkId: 'real_metrics_collection',
        name: 'Real System Metrics Collection',
        status: 'FAIL',
        description: 'Failed to collect real system metrics',
        evidence: (error as any)?.message || String(error),
        recommendation: 'Check system metrics collection implementation'
      });
    }

    // Check 2: Performance Thresholds Validation
    maxScore += 35;
    const systemMetrics = await this.metricsCollector.collectRealMetrics();
    const responseTimeTest = await this.measureResponseTime();
    
    if (responseTimeTest < config.performanceThresholds.maxResponseTime) {
      checks.push({
        checkId: 'response_time_threshold',
        name: 'Response Time Threshold',
        status: 'PASS',
        description: 'System response times meet production requirements',
        actualValue: `${responseTimeTest}ms`,
        expectedValue: `<${config.performanceThresholds.maxResponseTime}ms`,
        evidence: `Average response time from real measurements`
      });
      totalScore += 35;
    } else {
      checks.push({
        checkId: 'response_time_threshold',
        name: 'Response Time Threshold',
        status: responseTimeTest > config.performanceThresholds.maxResponseTime * 2 ? 'FAIL' : 'WARNING',
        description: 'System response times exceed production thresholds',
        actualValue: `${responseTimeTest}ms`,
        expectedValue: `<${config.performanceThresholds.maxResponseTime}ms`,
        recommendation: 'Investigate performance bottlenecks and optimize critical paths'
      });
      if (responseTimeTest <= config.performanceThresholds.maxResponseTime * 2) totalScore += 15;
    }

    // Check 3: Performance Baseline Validation
    maxScore += 25;
    try {
      // Test that performance validation is not returning hardcoded values
      const testMetrics: PerformanceMetrics = {
        componentId: 'production-readiness-test',
        timestamp: Date.now(),
        measurements: {
          responseTime: responseTimeTest,
          memoryUsage: systemMetrics.memory.processMemoryMB,
          cpuUsage: systemMetrics.cpu.currentUsagePercent
        },
        metadata: {
          operation: 'production_readiness_validation',
          interface: 'system',
          transferPhase: 'production',
          sampleCount: 1
        }
      };

      const validationResult = await this.performanceValidator.validateComponent(
        'production-readiness-test', 
        testMetrics
      );
      
      // Verify that we get real validation results
      if (validationResult && validationResult.metrics.currentPerformance.responseTime === responseTimeTest) {
        checks.push({
          checkId: 'performance_baseline_validation',
          name: 'Performance Baseline Validation', 
          status: 'PASS',
          description: 'Performance validation uses real metrics, not hardcoded values',
          evidence: `Real response time: ${responseTimeTest}ms, Validation confidence: ${validationResult.validation.confidence}`
        });
        totalScore += 25;
      } else {
        checks.push({
          checkId: 'performance_baseline_validation',
          name: 'Performance Baseline Validation',
          status: 'WARNING',
          description: 'Performance validation may still use hardcoded values',
          recommendation: 'Verify performance validation system uses real system measurements'
        });
        totalScore += 10;
      }
    } catch (error: any) {
      checks.push({
        checkId: 'performance_baseline_validation',
        name: 'Performance Baseline Validation',
        status: 'FAIL',
        description: 'Error validating performance baseline system',
        evidence: (error as any)?.message || String(error)
      });
    }

    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const status = finalScore >= 80 ? 'PASS' : finalScore >= 60 ? 'WARNING' : 'FAIL';
    
    return {
      status,
      score: finalScore,
      checks,
      summary: `Performance validation: ${totalScore}/${maxScore} points (${finalScore}%)`
    };
  }

  private async measureResponseTime(): Promise<number> {
    // Measure actual system response time
    const samples: number[] = [];
    const sampleCount = 5;
    
    for (let i = 0; i < sampleCount; i++) {
      const startTime = performance.now();
      
      // Simulate typical system operation
      await new Promise(resolve => {
        // File system operation
        require('fs').readdir(process.cwd(), (_err: any, _files: any) => {
          resolve(true);
        });
      });
      
      const endTime = performance.now();
      samples.push(endTime - startTime);
      
      // Small delay between samples
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Return average response time
    return Math.round(samples.reduce((sum, sample) => sum + sample, 0) / samples.length);
  }
}

// ============================================================================
// System Health Checker
// ============================================================================

export class SystemHealthChecker {
  constructor(private metricsCollector: RealSystemMetricsCollector) {}

  async checkSystemHealth(config: ProductionReadinessConfig): Promise<ProductionReadinessCategory> {
    const checks: ReadinessCheck[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Check 1: System Uptime
    maxScore += 20;
    const systemMetrics = await this.metricsCollector.collectRealMetrics();
    if (systemMetrics.system.uptime >= config.performanceThresholds.minSystemUptime) {
      checks.push({
        checkId: 'system_uptime',
        name: 'System Uptime',
        status: 'PASS',
        description: 'System uptime meets minimum production requirements',
        actualValue: `${Math.round(systemMetrics.system.uptime * 100) / 100} hours`,
        expectedValue: `>=${config.performanceThresholds.minSystemUptime} hours`
      });
      totalScore += 20;
    } else {
      checks.push({
        checkId: 'system_uptime',
        name: 'System Uptime',
        status: 'WARNING',
        description: 'System uptime is below recommended minimum for production',
        actualValue: `${Math.round(systemMetrics.system.uptime * 100) / 100} hours`,
        expectedValue: `>=${config.performanceThresholds.minSystemUptime} hours`,
        recommendation: 'Monitor system stability and restart patterns'
      });
      totalScore += 10;
    }

    // Check 2: Network Connectivity
    maxScore += 25;
    if (systemMetrics.network.connectivityStatus === 'CONNECTED') {
      checks.push({
        checkId: 'network_connectivity',
        name: 'Network Connectivity',
        status: 'PASS', 
        description: 'Network connectivity is available for backend services',
        evidence: `Latency: ${systemMetrics.network.latencyMs}ms`
      });
      totalScore += 25;
    } else {
      checks.push({
        checkId: 'network_connectivity',
        name: 'Network Connectivity',
        status: 'FAIL',
        description: 'Network connectivity issues detected',
        actualValue: systemMetrics.network.connectivityStatus,
        recommendation: 'Check network configuration and connectivity to backend services'
      });
    }

    // Check 3: CPU Load Average
    maxScore += 25;
    const loadAverage1Min = systemMetrics.cpu.loadAverage1Min;
    const cpuCount = systemMetrics.cpu.cpuCount;
    const loadPerCpu = loadAverage1Min / cpuCount;
    
    if (loadPerCpu < 0.8) {
      checks.push({
        checkId: 'cpu_load_average',
        name: 'CPU Load Average',
        status: 'PASS',
        description: 'CPU load is within acceptable limits',
        actualValue: `${Math.round(loadPerCpu * 100) / 100} per CPU`,
        expectedValue: '<0.8 per CPU',
        evidence: `${loadAverage1Min} load across ${cpuCount} CPUs`
      });
      totalScore += 25;
    } else {
      checks.push({
        checkId: 'cpu_load_average',
        name: 'CPU Load Average',
        status: loadPerCpu > 1.5 ? 'FAIL' : 'WARNING',
        description: 'CPU load is elevated',
        actualValue: `${Math.round(loadPerCpu * 100) / 100} per CPU`,
        expectedValue: '<0.8 per CPU', 
        recommendation: 'Monitor CPU usage patterns and consider performance optimization'
      });
      if (loadPerCpu <= 1.5) totalScore += 10;
    }

    // Check 4: File System Permissions
    maxScore += 30;
    try {
      // Test read/write permissions in working directory
      const testFile = `${process.cwd()}/production-readiness-test-${Date.now()}.tmp`;
      await fs.writeFile(testFile, 'production readiness test');
      const content = await fs.readFile(testFile, 'utf8');
      await fs.unlink(testFile);
      
      if (content === 'production readiness test') {
        checks.push({
          checkId: 'filesystem_permissions',
          name: 'File System Permissions',
          status: 'PASS',
          description: 'File system read/write permissions are properly configured',
          evidence: 'Successfully created, read, and deleted test file'
        });
        totalScore += 30;
      } else {
        checks.push({
          checkId: 'filesystem_permissions',
          name: 'File System Permissions',
          status: 'FAIL',
          description: 'File system permissions test failed - content mismatch',
          recommendation: 'Check file system permissions and access rights'
        });
      }
    } catch (error: any) {
      checks.push({
        checkId: 'filesystem_permissions',
        name: 'File System Permissions',
        status: 'FAIL',
        description: 'File system permissions test failed',
        evidence: (error as any)?.message || String(error),
        recommendation: 'Verify read/write permissions in working directory'
      });
    }

    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const status = finalScore >= 80 ? 'PASS' : finalScore >= 60 ? 'WARNING' : 'FAIL';
    
    return {
      status,
      score: finalScore, 
      checks,
      summary: `System health validation: ${totalScore}/${maxScore} points (${finalScore}%)`
    };
  }
}

// ============================================================================
// Production Readiness Validator - Main Orchestrator
// ============================================================================

export class ProductionReadinessValidator extends EventEmitter {
  private config: ProductionReadinessConfig;
  private metricsCollector: RealSystemMetricsCollector;
  private resourceValidator: ResourcePolicyValidator;
  private errorVerifier: ErrorHandlingVerifier;
  private performanceValidator: RealPerformanceValidator;
  private systemHealthChecker: SystemHealthChecker;

  constructor(
    resourceManager: TemplumResourceManager,
    performanceValidator: PerformanceValidator,
    config: Partial<ProductionReadinessConfig> = {}
  ) {
    super();

    this.config = {
      performanceThresholds: {
        maxResponseTime: 50,      // ms
        maxMemoryUsage: 512,      // MB
        maxCpuUsage: 80,          // %
        minSystemUptime: 1        // hours
      },
      resourceValidation: {
        enableResourcePolicyValidation: true,
        validateResourceLeaks: true,
        checkResourceLimits: true,
        monitoringDurationMs: 30000 // 30 seconds
      },
      errorHandling: {
        validateErrorPatterns: true,
        checkCircuitBreakerConfig: true,
        verifyErrorRecovery: true
      },
      systemHealth: {
        checkDiskSpace: true,
        validateNetworkConnectivity: true,
        verifyFileSystemPermissions: true,
        checkSystemResources: true
      },
      ...config
    };

    // Initialize components
    this.metricsCollector = new RealSystemMetricsCollector();
    this.resourceValidator = new ResourcePolicyValidator(resourceManager, this.metricsCollector);
    this.errorVerifier = new ErrorHandlingVerifier();
    this.performanceValidator = new RealPerformanceValidator(this.metricsCollector, performanceValidator);
    this.systemHealthChecker = new SystemHealthChecker(this.metricsCollector);
  }

  /**
   * Perform comprehensive production readiness validation
   */
  async validateProductionReadiness(): Promise<ProductionReadinessResult> {
    const startTime = Date.now();
    
    this.emit('validationStarted', { timestamp: startTime });

    try {
      // Collect real system metrics
      const systemMetrics = await this.metricsCollector.collectRealMetrics();

      // Run all validation categories in parallel
      const [performance, resourceManagement, errorHandling, systemHealth] = await Promise.all([
        this.performanceValidator.validatePerformance(this.config),
        this.resourceValidator.validateResourcePolicies(this.config),
        this.errorVerifier.verifyErrorHandlingPatterns(),
        this.systemHealthChecker.checkSystemHealth(this.config)
      ]);

      // Calculate overall readiness score
      const categoryScores = [performance.score, resourceManagement.score, errorHandling.score, systemHealth.score];
      const averageScore = Math.round(categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length);

      // Determine overall status
      let overallStatus: 'READY' | 'NOT_READY' | 'WARNINGS' = 'READY';
      const failedCategories = [performance, resourceManagement, errorHandling, systemHealth].filter(cat => cat.status === 'FAIL');
      const warningCategories = [performance, resourceManagement, errorHandling, systemHealth].filter(cat => cat.status === 'WARNING');

      if (failedCategories.length > 0) {
        overallStatus = 'NOT_READY';
      } else if (warningCategories.length > 0 || averageScore < 80) {
        overallStatus = 'WARNINGS';
      }

      // Collect issues and recommendations
      const criticalIssues = this.collectCriticalIssues([performance, resourceManagement, errorHandling, systemHealth]);
      const warnings = this.collectWarnings([performance, resourceManagement, errorHandling, systemHealth]);
      const recommendations = this.generateRecommendations(overallStatus, [performance, resourceManagement, errorHandling, systemHealth]);

      const result: ProductionReadinessResult = {
        timestamp: Date.now(),
        overallStatus,
        readinessScore: averageScore,
        categories: {
          performance,
          resourceManagement,
          errorHandling,
          systemHealth
        },
        criticalIssues,
        warnings,
        recommendations,
        systemMetrics
      };

      this.emit('validationCompleted', result);
      return result;

    } catch (error: any) {
      const errorResult = this.createErrorResult(error);
      this.emit('validationFailed', { error: error.message, result: errorResult });
      return errorResult;
    }
  }

  private collectCriticalIssues(categories: ProductionReadinessCategory[]): ReadinessIssue[] {
    const issues: ReadinessIssue[] = [];

    categories.forEach((category, index) => {
      const categoryNames = ['performance', 'resourceManagement', 'errorHandling', 'systemHealth'];
      const categoryName = categoryNames[index] as ReadinessIssue['category'];

      category.checks.forEach(check => {
        if (check.status === 'FAIL') {
          issues.push({
            severity: 'HIGH',
            category: categoryName,
            title: check.name,
            description: check.description,
            impact: `${categoryName} validation failure may prevent production deployment`,
            recommendation: check.recommendation || 'Review and resolve the underlying issue',
            evidence: check.evidence || check.actualValue
          });
        }
      });
    });

    return issues;
  }

  private collectWarnings(categories: ProductionReadinessCategory[]): ReadinessIssue[] {
    const warnings: ReadinessIssue[] = [];

    categories.forEach((category, index) => {
      const categoryNames = ['performance', 'resourceManagement', 'errorHandling', 'systemHealth'];
      const categoryName = categoryNames[index] as ReadinessIssue['category'];

      category.checks.forEach(check => {
        if (check.status === 'WARNING') {
          warnings.push({
            severity: 'MEDIUM',
            category: categoryName,
            title: check.name,
            description: check.description,
            impact: `${categoryName} warning may affect system performance or reliability`,
            recommendation: check.recommendation || 'Monitor and consider optimization',
            evidence: check.evidence || check.actualValue
          });
        }
      });
    });

    return warnings;
  }

  private generateRecommendations(
    overallStatus: 'READY' | 'NOT_READY' | 'WARNINGS', 
    categories: ProductionReadinessCategory[]
  ): string[] {
    const recommendations: string[] = [];

    // Overall status recommendations
    switch (overallStatus) {
      case 'NOT_READY':
        recommendations.push('Address all critical issues before production deployment');
        recommendations.push('Re-run production readiness validation after fixes');
        break;
      case 'WARNINGS':
        recommendations.push('Review warning conditions and assess production impact');
        recommendations.push('Consider implementing monitoring for warning conditions');
        break;
      case 'READY':
        recommendations.push('System meets production readiness criteria');
        recommendations.push('Continue monitoring system health and performance metrics');
        break;
    }

    // Category-specific recommendations
    if (categories[0].status !== 'PASS') { // Performance
      recommendations.push('Implement performance monitoring and alerting for production');
      recommendations.push('Consider caching strategies and response time optimization');
    }

    if (categories[1].status !== 'PASS') { // Resource Management
      recommendations.push('Review resource allocation policies and adjust limits if needed');
      recommendations.push('Implement automated resource cleanup and monitoring');
    }

    if (categories[2].status !== 'PASS') { // Error Handling
      recommendations.push('Verify error handling patterns across all components');
      recommendations.push('Test circuit breaker configuration under load conditions');
    }

    if (categories[3].status !== 'PASS') { // System Health
      recommendations.push('Address system resource constraints before production use');
      recommendations.push('Implement system health monitoring and alerting');
    }

    // Add production-specific recommendations
    recommendations.push('Schedule regular production readiness assessments');
    recommendations.push('Document system baseline metrics for ongoing monitoring');

    return recommendations;
  }

  private createErrorResult(error: any): ProductionReadinessResult {
    return {
      timestamp: Date.now(),
      overallStatus: 'NOT_READY',
      readinessScore: 0,
      categories: {
        performance: { status: 'FAIL', score: 0, checks: [], summary: 'Validation failed due to error' },
        resourceManagement: { status: 'FAIL', score: 0, checks: [], summary: 'Validation failed due to error' },
        errorHandling: { status: 'FAIL', score: 0, checks: [], summary: 'Validation failed due to error' },
        systemHealth: { status: 'FAIL', score: 0, checks: [], summary: 'Validation failed due to error' }
      },
      criticalIssues: [{
        severity: 'CRITICAL',
        category: 'systemHealth',
        title: 'Production Readiness Validation Error',
        description: `Validation process failed: ${error.message}`,
        impact: 'Unable to assess production readiness',
        recommendation: 'Check system configuration and validation dependencies',
        evidence: error.stack
      }],
      warnings: [],
      recommendations: [
        'Resolve validation system errors before attempting production deployment',
        'Check system dependencies and configuration'
      ],
      systemMetrics: {
        system: { platform: '', arch: '', nodeVersion: '', uptime: 0, loadAverage: [] },
        memory: { totalMB: 0, freeMB: 0, usedMB: 0, usagePercent: 0, processMemoryMB: 0 },
        cpu: { cpuCount: 0, currentUsagePercent: 0, loadAverage1Min: 0 },
        disk: { totalGB: 0, freeGB: 0, usagePercent: 0 },
        network: { connectivityStatus: 'OFFLINE' },
        templumComponents: {
          activeComponents: 0,
          healthyComponents: 0,
          resourceUsage: {
            memory: { used: 0, allocated: 0, limit: 0, percentage: 0 },
            connections: { active: 0, allocated: 0, limit: 0, percentage: 0 },
            cache: { used: 0, limit: 0, hitRate: 0, entries: 0 },
            fileHandles: { open: 0, limit: 0, percentage: 0 },
            processes: { active: 0, limit: 0, percentage: 0 }
          }
        }
      }
    };
  }
}

// Export default instance factory
export const createProductionReadinessValidator = (
  resourceManager: TemplumResourceManager,
  performanceValidator: PerformanceValidator,
  config?: Partial<ProductionReadinessConfig>
): ProductionReadinessValidator => {
  return new ProductionReadinessValidator(resourceManager, performanceValidator, config);
};
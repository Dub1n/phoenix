/**
 * @fileoverview MCP Health Monitor
 * @author Claude Code Implementation
 * @created 2025-09-11
 * 
 * MCP Service Discovery Integration - Health monitoring and performance tracking
 * 
 * Provides comprehensive health monitoring for MCP server with performance tracking,
 * PTY session monitoring, and integration with Templum service discovery.
 */

import { CLIMCPServer, MCPRequest } from './cli-mcp-server';
import { PTYManager } from './pty-manager';
import { ProgressiveTimeoutManager, createOperationSpecificTimeoutManager, TimeoutResult, AdaptationMetrics } from './progressive-timeout-manager';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  checks: {
    mcpServer: HealthCheckResult;
    ptyManager: HealthCheckResult;
    performance: HealthCheckResult;
    resources: HealthCheckResult;
    communication: HealthCheckResult;
  };
  metrics: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    activeSessions: number;
    memoryUsage: number;
    cpuUsage: number;
    timeoutAdaptations: number;
    circuitBreakerTrips: number;
    communicationStability: number;
  };
}

export interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail';
  duration: number;
  message: string;
  details?: any;
}

export interface PerformanceMetrics {
  requestCount: number;
  totalResponseTime: number;
  errorCount: number;
  lastRequestTime: number;
  responseTimeHistory: number[];
  averageResponseTime: number;
}

/**
 * MCP Health Monitor
 * 
 * Monitors MCP server health including performance metrics, resource usage,
 * and integration status with service discovery system.
 */
export class MCPHealthMonitor {
  private mcpServer: CLIMCPServer;
  private ptyManager: PTYManager;
  private startTime: number;
  private performanceMetrics: PerformanceMetrics;
  private healthCheckHistory: HealthStatus[];
  private maxHistorySize: number = 100;
  private progressiveTimeoutManager: ProgressiveTimeoutManager;
  private communicationMetrics: {
    timeoutAdaptations: number;
    circuitBreakerTrips: number;
    communicationStability: number;
    lastStabilityCheck: number;
  };
  private metrics: AdaptationMetrics;
  
  constructor(mcpServer: CLIMCPServer, ptyManager: PTYManager) {
    this.mcpServer = mcpServer;
    this.ptyManager = ptyManager;
    this.startTime = Date.now();
    
    this.performanceMetrics = {
      requestCount: 0,
      totalResponseTime: 0,
      errorCount: 0,
      lastRequestTime: 0,
      responseTimeHistory: [],
      averageResponseTime: 0
    };
    
    this.healthCheckHistory = [];
    
    // Initialize progressive timeout manager for health checks
    this.progressiveTimeoutManager = createOperationSpecificTimeoutManager('health-check');
    
    this.communicationMetrics = {
      timeoutAdaptations: 0,
      circuitBreakerTrips: 0,
      communicationStability: 1.0,
      lastStabilityCheck: Date.now()
    };

    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      timeoutsByLevel: { level1: 0, level2: 0, level3: 0, fallback: 0 },
      averageResponseTimeByLevel: { level1: 0, level2: 0, level3: 0, fallback: 0 },
      circuitBreakerTrips: 0,
      fallbackActivations: 0,
      recoverySuccessRate: 0,
      communicationStability: 1.0
    };

    // Listen to timeout manager events for communication stability tracking
    this.setupTimeoutManagerListeners();
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthStatus> {
    return this.progressiveTimeoutManager.executeWithProgressiveTimeout(
      'health-check-comprehensive',
      'health-check',
      () => this.performHealthCheckInternal()
    );
  }

  /**
   * Internal health check implementation with progressive timeout support
   */
  private async performHealthCheckInternal(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // TODO: [TASK-MCP-007-HEALTH-001] Pattern: progressive-health-monitoring | Complexity: 7 | Dependencies: timeout-management,communication-stability
      // Context: Comprehensive health monitoring with progressive timeout and communication stability tracking
      // Validation-Required: health-check-reliability, timeout-adaptation, communication-metrics
      // Pattern-Info: { approach: "progressive-monitoring", alternatives: "fixed-timeout,manual-checks", trade-offs: "accuracy-vs-performance" }
      
      // Run all health checks in parallel for better performance
      const [mcpCheck, ptyCheck, perfCheck, resourceCheck, commCheck] = await Promise.all([
        this.checkMCPServer(),
        this.checkPTYManager(), 
        this.checkPerformance(),
        this.checkResources(),
        this.checkCommunicationStability()
      ]);

      const status = this.determineOverallHealth(mcpCheck, ptyCheck, perfCheck, resourceCheck, commCheck);
      
      // Update communication stability metrics
      this.updateCommunicationStability();
      
      const healthStatus: HealthStatus = {
        status,
        timestamp: Date.now(),
        uptime: Date.now() - this.startTime,
        checks: {
          mcpServer: mcpCheck,
          ptyManager: ptyCheck,
          performance: perfCheck,
          resources: resourceCheck,
          communication: commCheck
        },
        metrics: {
          totalRequests: this.performanceMetrics.requestCount,
          averageResponseTime: this.getAverageResponseTime(),
          errorRate: this.getErrorRate(),
          activeSessions: this.getActiveSessionCount(),
          memoryUsage: this.getMemoryUsage(),
          cpuUsage: 0, // CPU usage monitoring would require additional dependencies
          timeoutAdaptations: this.communicationMetrics.timeoutAdaptations,
          circuitBreakerTrips: this.communicationMetrics.circuitBreakerTrips,
          communicationStability: this.communicationMetrics.communicationStability
        }
      };

      // Add to history
      this.addToHistory(healthStatus);
      
      console.log(`[MCP_HEALTH] Health check completed in ${Date.now() - startTime}ms: ${status}`);
      return healthStatus;

    } catch (error) {
      console.error('[MCP_HEALTH] Health check failed:', error);
      
      const failedStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp: Date.now(),
        uptime: Date.now() - this.startTime,
        checks: {
          mcpServer: { status: 'fail', duration: 0, message: 'Health check failed', details: error },
          ptyManager: { status: 'fail', duration: 0, message: 'Health check failed' },
          performance: { status: 'fail', duration: 0, message: 'Health check failed' },
          resources: { status: 'fail', duration: 0, message: 'Health check failed' },
          communication: { status: 'fail', duration: 0, message: 'Health check failed' }
        },
        metrics: {
          totalRequests: this.performanceMetrics.requestCount,
          averageResponseTime: 0,
          errorRate: 1,
          activeSessions: 0,
          memoryUsage: this.getMemoryUsage(),
          cpuUsage: 0,
          timeoutAdaptations: this.communicationMetrics.timeoutAdaptations,
          circuitBreakerTrips: this.communicationMetrics.circuitBreakerTrips,
          communicationStability: 0
        }
      };

      this.addToHistory(failedStatus);
      return failedStatus;
    }
  }

  /**
   * Check MCP Server health
   */
  private async checkMCPServer(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test basic MCP server functionality
      const tools = this.mcpServer.getAvailableTools();
      
      if (tools.length === 0) {
        return {
          status: 'fail',
          duration: Date.now() - startTime,
          message: 'MCP server has no available tools'
        };
      }

      // Test tools/list functionality with performance check
      const testRequest: MCPRequest = {
        id: 'health-check-' + Date.now(),
        method: 'tools/list'
      };

      const response = await this.mcpServer.handleMCPRequest(testRequest);
      const duration = Date.now() - startTime;
      
      if (response.error) {
        return {
          status: 'fail',
          duration,
          message: 'MCP server request failed',
          details: response.error
        };
      }

      // Check response time performance (should be <100ms for health checks)
      if (duration > 100) {
        return {
          status: 'warn',
          duration,
          message: `MCP server response time degraded: ${duration}ms`,
          details: { responseTime: duration, threshold: 100 }
        };
      }

      return {
        status: 'pass',
        duration,
        message: `MCP server operational (${tools.length} tools available)`
      };

    } catch (error) {
      return {
        status: 'fail',
        duration: Date.now() - startTime,
        message: 'MCP server check failed',
        details: error
      };
    }
  }

  /**
   * Check PTY Manager health
   */
  private async checkPTYManager(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check if PTY manager is functional
      const sessionIds = this.ptyManager.getActiveSessions();
      const sessionCount = sessionIds.length;
      
      // Check for any problematic sessions
      let healthySessions = 0;
      for (const sessionId of sessionIds) {
        const session = this.ptyManager.getSession(sessionId);
        if (session && session.processHandle) {
          healthySessions++;
        }
      }

      const duration = Date.now() - startTime;
      
      // Warn if there are inactive sessions
      if (sessionCount > healthySessions) {
        return {
          status: 'warn',
          duration,
          message: `${sessionCount - healthySessions} inactive sessions detected`,
          details: { total: sessionCount, healthy: healthySessions }
        };
      }

      return {
        status: 'pass',
        duration,
        message: `PTY manager operational (${sessionCount} active sessions)`,
        details: { activeSessions: sessionCount }
      };

    } catch (error) {
      return {
        status: 'fail',
        duration: Date.now() - startTime,
        message: 'PTY manager check failed',
        details: error
      };
    }
  }

  /**
   * Check performance metrics
   */
  private async checkPerformance(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const avgResponseTime = this.getAverageResponseTime();
      const errorRate = this.getErrorRate();
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'Performance within normal parameters';
      
      // Check average response time (should be <100ms for good performance)
      if (avgResponseTime > 200) {
        status = 'fail';
        message = `High average response time: ${avgResponseTime}ms`;
      } else if (avgResponseTime > 100) {
        status = 'warn';
        message = `Elevated response time: ${avgResponseTime}ms`;
      }
      
      // Check error rate (should be <5% for healthy service)
      if (errorRate > 0.1) { // 10%
        status = 'fail';
        message = `High error rate: ${(errorRate * 100).toFixed(1)}%`;
      } else if (errorRate > 0.05) { // 5%
        status = 'warn';
        message = `Elevated error rate: ${(errorRate * 100).toFixed(1)}%`;
      }

      return {
        status,
        duration: Date.now() - startTime,
        message,
        details: {
          averageResponseTime: avgResponseTime,
          errorRate: errorRate,
          totalRequests: this.performanceMetrics.requestCount,
          errors: this.performanceMetrics.errorCount
        }
      };

    } catch (error) {
      return {
        status: 'fail',
        duration: Date.now() - startTime,
        message: 'Performance check failed',
        details: error
      };
    }
  }

  /**
   * Check resource usage
   */
  private async checkResources(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const memoryUsage = this.getMemoryUsage();
      const uptime = Date.now() - this.startTime;
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'Resource usage normal';
      
      // Check memory usage (warn if >100MB, fail if >500MB)
      if (memoryUsage > 500 * 1024 * 1024) { // 500MB
        status = 'fail';
        message = `Critical memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`;
      } else if (memoryUsage > 100 * 1024 * 1024) { // 100MB
        status = 'warn';
        message = `High memory usage: ${Math.round(memoryUsage / 1024 / 1024)}MB`;
      }

      return {
        status,
        duration: Date.now() - startTime,
        message,
        details: {
          memoryUsage: Math.round(memoryUsage / 1024 / 1024), // MB
          uptime: Math.round(uptime / 1000) // seconds
        }
      };

    } catch (error) {
      return {
        status: 'fail',
        duration: Date.now() - startTime,
        message: 'Resource check failed',
        details: error
      };
    }
  }

  /**
   * Record request performance metrics
   */
  recordRequest(responseTime: number, success: boolean): void {
    this.performanceMetrics.requestCount++;
    this.performanceMetrics.totalResponseTime += responseTime;
    this.performanceMetrics.lastRequestTime = Date.now();
    this.performanceMetrics.averageResponseTime = this.performanceMetrics.totalResponseTime / this.performanceMetrics.requestCount;
    
    if (!success) {
      this.performanceMetrics.errorCount++;
    }
    
    // Maintain response time history (last 50 requests)
    this.performanceMetrics.responseTimeHistory.push(responseTime);
    if (this.performanceMetrics.responseTimeHistory.length > 50) {
      this.performanceMetrics.responseTimeHistory.shift();
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get health check history
   */
  getHealthHistory(): HealthStatus[] {
    return [...this.healthCheckHistory];
  }

  /**
   * Check communication stability
   */
  private async checkCommunicationStability(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const timeoutMetrics = this.progressiveTimeoutManager.getAdaptationMetrics();
      const stability = this.communicationMetrics.communicationStability;
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'Communication stability normal';
      
      // Check circuit breaker trips
      if (timeoutMetrics.circuitBreakerTrips > 5) {
        status = 'fail';
        message = `High circuit breaker trips: ${timeoutMetrics.circuitBreakerTrips}`;
      } else if (timeoutMetrics.circuitBreakerTrips > 2) {
        status = 'warn';
        message = `Elevated circuit breaker trips: ${timeoutMetrics.circuitBreakerTrips}`;
      }
      
      // Check communication stability
      if (stability < 0.5) { // 50%
        status = 'fail';
        message = `Poor communication stability: ${(stability * 100).toFixed(1)}%`;
      } else if (stability < 0.8) { // 80%
        status = 'warn';
        message = `Reduced communication stability: ${(stability * 100).toFixed(1)}%`;
      }

      return {
        status,
        duration: Date.now() - startTime,
        message,
        details: {
          communicationStability: stability,
          circuitBreakerTrips: timeoutMetrics.circuitBreakerTrips,
          timeoutAdaptations: this.communicationMetrics.timeoutAdaptations,
          fallbackActivations: timeoutMetrics.fallbackActivations
        }
      };

    } catch (error) {
      return {
        status: 'fail',
        duration: Date.now() - startTime,
        message: 'Communication stability check failed',
        details: error
      };
    }
  }

  /**
   * Setup timeout manager event listeners
   */
  private setupTimeoutManagerListeners(): void {
    this.progressiveTimeoutManager.on('operation-success', (event) => {
      // Track successful operations for stability metrics
      this.updateCommunicationStability(true);
    });

    this.progressiveTimeoutManager.on('operation-failure', (event) => {
      // Track failed operations and circuit breaker trips
      this.updateCommunicationStability(false);
      
      if (event.error?.message?.includes('circuit breaker')) {
        this.communicationMetrics.circuitBreakerTrips++;
      }
    });

    this.progressiveTimeoutManager.on('timeout-levels-updated', () => {
      this.communicationMetrics.timeoutAdaptations++;
    });
  }

  /**
   * Update communication stability metrics
   */
  private updateCommunicationStability(success?: boolean): void {
    // TODO: [TASK-MCP-007-STABILITY-001] Pattern: communication-stability-tracking | Complexity: 5 | Dependencies: metrics-aggregation,stability-calculation
    // Context: Communication stability tracking with weighted success rate calculation
    // Validation-Required: stability-accuracy, metric-aggregation, trend-analysis
    // Pattern-Info: { approach: "weighted-success-rate", alternatives: "simple-average,exponential-smoothing", trade-offs: "accuracy-vs-responsiveness" }
    
    const now = Date.now();
    const timeSinceLastCheck = now - this.communicationMetrics.lastStabilityCheck;
    
    // Update stability every 30 seconds or on specific events
    if (timeSinceLastCheck > 30000 || success !== undefined) {
      const timeoutMetrics = this.progressiveTimeoutManager.getAdaptationMetrics();
      
      if (timeoutMetrics.totalOperations > 0) {
        // Calculate weighted stability based on recent operations
        const baseStability = timeoutMetrics.successfulOperations / timeoutMetrics.totalOperations;
        
        // Apply penalty for circuit breaker trips
        const circuitBreakerPenalty = Math.min(0.3, timeoutMetrics.circuitBreakerTrips * 0.05);
        
        // Apply penalty for fallback activations
        const fallbackPenalty = Math.min(0.2, timeoutMetrics.fallbackActivations * 0.03);
        
        // Calculate weighted stability
        const newStability = Math.max(0, baseStability - circuitBreakerPenalty - fallbackPenalty);
        
        // Smooth stability using exponential moving average
        const smoothingFactor = 0.7;
        this.communicationMetrics.communicationStability = 
          this.communicationMetrics.communicationStability * smoothingFactor + 
          newStability * (1 - smoothingFactor);
      }
      
      this.communicationMetrics.lastStabilityCheck = now;
    }
  }

  /**
   * Determine overall health status including communication stability
   */
  private determineOverallHealth(
    mcpCheck: HealthCheckResult,
    ptyCheck: HealthCheckResult,
    perfCheck: HealthCheckResult,
    resourceCheck: HealthCheckResult,
    commCheck: HealthCheckResult
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const checks = [mcpCheck, ptyCheck, perfCheck, resourceCheck, commCheck];
    
    // If any check fails, service is unhealthy
    if (checks.some(check => check.status === 'fail')) {
      return 'unhealthy';
    }
    
    // If any check warns, service is degraded
    if (checks.some(check => check.status === 'warn')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Calculate average response time
   */
  private getAverageResponseTime(): number {
    if (this.performanceMetrics.requestCount === 0) return 0;
    return Math.round(this.performanceMetrics.totalResponseTime / this.performanceMetrics.requestCount);
  }

  /**
   * Calculate error rate
   */
  private getErrorRate(): number {
    if (this.performanceMetrics.requestCount === 0) return 0;
    return this.performanceMetrics.errorCount / this.performanceMetrics.requestCount;
  }

  /**
   * Get active session count
   */
  private getActiveSessionCount(): number {
    return this.ptyManager.getActiveSessions().length;
  }

  /**
   * Get memory usage in bytes
   */
  private getMemoryUsage(): number {
    const memUsage = process.memoryUsage();
    return memUsage.heapUsed;
  }

  /**
   * Add health status to history
   */
  private addToHistory(status: HealthStatus): void {
    this.healthCheckHistory.push(status);
    
    // Maintain history size limit
    if (this.healthCheckHistory.length > this.maxHistorySize) {
      this.healthCheckHistory.shift();
    }
  }

  /**
   * Cleanup resources and stop monitoring
   */
  cleanup(): void {
    // Clean up any resources, timers, or listeners
    this.healthCheckHistory = [];
    this.performanceMetrics = {
      requestCount: 0,
      totalResponseTime: 0,
      errorCount: 0,
      lastRequestTime: 0,
      responseTimeHistory: [],
      averageResponseTime: 0
    };
    
    // Reset metrics
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      timeoutsByLevel: { level1: 0, level2: 0, level3: 0, fallback: 0 },
      averageResponseTimeByLevel: { level1: 0, level2: 0, level3: 0, fallback: 0 },
      circuitBreakerTrips: 0,
      fallbackActivations: 0,
      recoverySuccessRate: 0,
      communicationStability: 1.0
    };
  }
}

/**
 * Create MCP health monitor instance
 */
export function createMCPHealthMonitor(
  mcpServer: CLIMCPServer,
  ptyManager: PTYManager
): MCPHealthMonitor {
  return new MCPHealthMonitor(mcpServer, ptyManager);
}
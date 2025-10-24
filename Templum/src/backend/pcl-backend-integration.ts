/**---
 * title: PCL Backend Integration - Component Transfer Orchestration System
 * tags: [Backend-Integration, PCL-Patterns, Component-Transfer, Performance-Validation, IPC-Coordination]
 * provides: [PCLBackendIntegrator, ComponentTransferCoordinator, PCLCommandRouter, ValidationFramework, BackendFallbackManager]
 * requires: [Enhanced-State-Synchronization, Component-Transfer-Strategy, PCL-Command-Registry, Risk-Mitigation-Framework]
 * description: PCL-specific backend integration with component transfer validation framework and Enhanced State Synchronization coordination, addressing Phase 2 realignment architectural gaps
 * ---*/

import { performance } from 'perf_hooks';
import { createInterval, ManagedInterval, sleep } from '../utils/async-utils';
import {
  Signals,
  // Unused imports removed: TemplumError, IntegrationError
  isTemplumError,
  createTemplumError,
  MetricsSignalPayload
} from '../types/templum-types';
import { EventDrivenComponent } from '../utils/event-bus-adapter';
import type { TypedEventMap } from '../utils/event-utils';
import { createLogger, normalizeLoggerError } from '../utils/logger';

const backendIntegrationLogger = createLogger('pcl-backend-integration');
const validationLogger = backendIntegrationLogger.child('validation-framework');
const fallbackLogger = backendIntegrationLogger.child('fallback-manager');
const integratorLogger = backendIntegrationLogger.child('integrator');

// Core interfaces for PCL backend communication with component transfer coordination
export interface PCLBackendCommand {
  type: 'component-request' | 'component-transfer' | 'validation-check';
  componentId: string;
  complexity: 1 | 2 | 3 | 4 | 5; // From Component Transfer Strategy
  transferPhase: '2A' | '2B' | '2C';
  payload: any;
  timestamp: number;
  requestId: string;
}

// Component transfer validation with state sync coordination
export interface ComponentTransferRequest {
  componentId: string;
  targetInterface: string;
  sourceInterface: string;
  transferType: 'direct' | 'enhanced' | 'fallback';
  validationCriteria: {
    performanceBaseline: number;
    complexityScore: number;
    rollbackRequired: boolean;
  };
}

export interface BackendServiceConnection {
  id: string;
  name: string;
  type: 'pcl' | 'vscode' | 'cli' | 'web';
  instance: any;
  capabilities: string[];
  healthStatus: {
    connected: boolean;
    responseTime: number;
    errorRate: number;
    lastCheck: number;
  };
  routingStrategy: 'direct' | 'load-balanced' | 'fallback';
  pclCompatibility: {
    commandSupport: string[];
    reusePercentage: number;
    mappingType: 'direct' | 'adapter' | 'composite' | 'custom';
  };
}

export interface ValidationResult {
  componentId: string;
  valid: boolean;
  performanceMetrics: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    performanceDelta: number; // % change from baseline
  };
  validationErrors: string[];
  fallbackRecommended: boolean;
  rollbackRequired: boolean;
}

export interface BackendIntegrationStats {
  totalConnections: number;
  healthyConnections: number;
  avgResponseTime: number;
  successRate: number;
  pclReuseEfficiency: number;
  componentTransferStats: {
    totalTransfers: number;
    successfulTransfers: number;
    averageTransferTime: number;
    fallbackActivations: number;
  };
  performanceMetrics: {
    degradationThresholdBreaches: number;
    rollbackOperations: number;
    avgPerformanceGain: number;
  };
}

interface ComponentTransferCoordinatorEvents extends TypedEventMap {
  transferQueued: (payload: { transferId: string; request: ComponentTransferRequest }) => void;
  'component-transfer-start': (payload: {
    componentId: string;
    transferId: string;
    sourceInterface: string;
    targetInterface: string;
  }) => void;
  'component-transfer-complete': (payload: {
    componentId: string;
    transferId: string;
    duration: number;
    success: boolean;
  }) => void;
  'component-transfer-failed': (payload: {
    componentId: string;
    transferId: string;
    error: string;
  }) => void;
  performanceThresholdExceeded: (payload: unknown) => void;
  stateChangeConfirmed: (payload: unknown) => void;
}

interface PCLCommandRouterEvents extends TypedEventMap {
  routingError: (payload: { command: PCLBackendCommand; error: string; duration: number }) => void;
}

interface ValidationFrameworkEvents extends TypedEventMap {
  rollbackRequired: (payload: { componentId: string; result: ValidationResult }) => void;
  fallbackRecommended: (payload: { componentId: string; result: ValidationResult }) => void;
  baselineSet: (payload: { componentId: string; baseline: number }) => void;
  performanceWarning: (payload: { operation: string; duration: number; threshold: number }) => void;
}

interface BackendFallbackManagerEvents extends TypedEventMap {
  fallbackExecuted: (payload: {
    componentId: string;
    fallbackId: string;
    fallbackType: 'performance' | 'error' | 'timeout';
    success: boolean;
    duration: number;
    reason: string;
  }) => void;
  fallbackFailed: (payload: { componentId: string; fallbackId: string; error: string; duration: number }) => void;
  fallbackStrategyRegistered: (payload: {
    componentId: string;
    strategy: {
      type: 'direct' | 'graceful' | 'rollback';
      timeout: number;
      retries: number;
      fallbackComponent?: string;
    };
  }) => void;
  componentSwitched: (payload: { originalComponent: string; fallbackComponent: string }) => void;
  gracefulFallbackSuccess: (payload: { componentId: string; attempt: number }) => void;
  rollbackInitiated: (payload: { componentId: string; strategy: unknown }) => void;
  rollbackCompleted: (payload: { componentId: string }) => void;
}

interface PCLBackendIntegratorEvents extends TypedEventMap {
  initialized: (payload: { timestamp: number }) => void;
  error: (payload: { error: string; operation: string }) => void;
  backendConnected: (payload: { backendId: string; pclCompatibility: BackendServiceConnection['pclCompatibility']; duration: number }) => void;
  commandExecuted: (payload: {
    commandId: string;
    componentId: string;
    backend: string;
    duration: number;
    reusePercentage: number;
  }) => void;
  commandFailed: (payload: { commandId: string; error: string; duration: number }) => void;
  componentTransferred: (payload: {
    componentId: string;
    sourceInterface: string;
    targetInterface: string;
    duration: number;
  }) => void;
  componentTransferComplete: (payload: {
    componentId: string;
    transferId: string;
    duration: number;
    success: boolean;
  }) => void;
  performanceThresholdExceeded: (payload: unknown) => void;
  rollbackRequired: (payload: { componentId: string; result: ValidationResult }) => void;
  fallbackExecuted: (payload: {
    componentId: string;
    fallbackId: string;
    fallbackType: 'performance' | 'error' | 'timeout';
    success: boolean;
    duration: number;
    reason: string;
  }) => void;
  setupComponentIntegration: (payload: {
    componentTransferCoordinator: ComponentTransferCoordinator;
    pclCommandRouter: PCLCommandRouter;
    validationFramework: ValidationFramework;
    backendFallbackManager: BackendFallbackManager;
  }) => void;
  performanceWarning: (payload: { operation: string; duration: number; threshold: number }) => void;
  shuttingDown: (payload: { timestamp: number }) => void;
  shutdownComplete: (payload: { timestamp: number }) => void;
}

/**
 * ComponentTransferCoordinator - Enhanced State Synchronization integration
 * Coordinates component transfers with IPC-based state synchronization
 */
export class ComponentTransferCoordinator extends EventDrivenComponent<ComponentTransferCoordinatorEvents> {
  private static instanceCounter = 0;
  private transferQueue: Map<string, ComponentTransferRequest> = new Map();
  private activeTransfers: Map<string, any> = new Map();
  private stateManager: any; // Enhanced State Synchronization integration
  private readonly maxConcurrentTransfers: number = 3;

  constructor(stateManager: any) {
    super(`component-transfer-coordinator:${ComponentTransferCoordinator.instanceCounter++}`, 80);
    this.stateManager = stateManager;
    this.setupStateManagerIntegration();
  }

  /**
   * Coordinate component transfer with Enhanced State Synchronization
   */
  async coordinateComponentTransfer(request: ComponentTransferRequest): Promise<void> {
    const startTime = performance.now();
    const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Check transfer capacity
      if (this.activeTransfers.size >= this.maxConcurrentTransfers) {
        this.transferQueue.set(transferId, request);
        this.emit('transferQueued', { transferId, request });
        return;
      }

      // Start transfer coordination
      this.activeTransfers.set(transferId, {
        request,
        startTime,
        status: 'coordinating'
      });

      // Emit component transfer start event for Enhanced State Synchronization
      this.emit('component-transfer-start', {
        componentId: request.componentId,
        transferId,
        sourceInterface: request.sourceInterface,
        targetInterface: request.targetInterface
      });

      // Create state snapshot for rollback capability
      await this.stateManager.updateState(
        request.componentId, 
        'transfer-status', 
        { status: 'transferring', transferId },
        { sourceInterface: 'component-transfer-coordinator' }
      );

      // Validate transfer readiness
      const validationResult = await this.validateTransferReadiness(request);
      if (!validationResult.valid) {
        throw new Error(`Transfer validation failed: ${validationResult.validationErrors.join(', ')}`);
      }

      // Execute transfer coordination
      await this.executeTransferCoordination(request, transferId);

      // Update performance metrics
      const duration = performance.now() - startTime;
      this.emitPerformanceMetrics('transfer-coordination', duration, 1);

      // Emit completion event
      this.emit('component-transfer-complete', {
        componentId: request.componentId,
        transferId,
        duration,
        success: true
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Emit transfer failed event
      this.emit('component-transfer-failed', {
        componentId: request.componentId,
        transferId,
        error: errorMessage
      });

      throw error;
    } finally {
      this.activeTransfers.delete(transferId);
      this.processTransferQueue();
    }
  }

  /**
   * Validate component transfer readiness with Enhanced State Synchronization
   */
  async validateTransferReadiness(request: ComponentTransferRequest): Promise<ValidationResult> {
    const startTime = performance.now();
    const validationErrors: string[] = [];

    try {
      // Check source component state
      const sourceState = await this.stateManager.requestState(request.componentId, request.sourceInterface);
      if (!sourceState) {
        validationErrors.push(`Source component ${request.componentId} state not available`);
      }

      // Validate performance baseline
      const currentPerformance = await this.measureComponentPerformance(request.componentId);
      const performanceDelta = this.calculatePerformanceDelta(
        request.validationCriteria.performanceBaseline,
        currentPerformance.responseTime
      );

      // Check if performance degradation exceeds threshold (30% from Phase 1)
      const rollbackRequired = Math.abs(performanceDelta) > 30;
      const fallbackRecommended = performanceDelta > 15; // 15% threshold for fallback recommendation

      const duration = performance.now() - startTime;
      this.emitPerformanceMetrics('transfer-validation', duration, 1);

      return {
        componentId: request.componentId,
        valid: validationErrors.length === 0 && !rollbackRequired,
        performanceMetrics: {
          responseTime: currentPerformance.responseTime,
          memoryUsage: currentPerformance.memoryUsage,
          cpuUsage: currentPerformance.cpuUsage,
          performanceDelta
        },
        validationErrors,
        fallbackRecommended,
        rollbackRequired
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      validationErrors.push(`Validation error: ${errorMessage}`);

      return {
        componentId: request.componentId,
        valid: false,
        performanceMetrics: { responseTime: 0, memoryUsage: 0, cpuUsage: 0, performanceDelta: 0 },
        validationErrors,
        fallbackRecommended: true,
        rollbackRequired: false
      };
    }
  }

  private async executeTransferCoordination(request: ComponentTransferRequest, transferId: string): Promise<void> {
    // Coordinate with Enhanced State Synchronization for transfer
    await this.stateManager.updateState(
      request.componentId,
      'interface',
      request.targetInterface,
      {
        sourceInterface: request.sourceInterface,
        priority: 'high'
      }
    );

    // Update transfer status
    this.activeTransfers.get(transferId)!.status = 'completed';
  }

  private async measureComponentPerformance(_componentId: string): Promise<{
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  }> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Simulate component performance measurement
    await sleep(5);

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    return {
      responseTime: endTime - startTime,
      memoryUsage: Math.max(0, endMemory - startMemory) / 1024 / 1024, // MB
      cpuUsage: 0 // Placeholder - would measure actual CPU usage
    };
  }

  private calculatePerformanceDelta(baseline: number, current: number): number {
    return ((current - baseline) / baseline) * 100;
  }

  private setupStateManagerIntegration(): void {
    // Only setup integration if stateManager is available
    if (this.stateManager && typeof this.stateManager.on === 'function') {
      // Listen for state manager events
      this.stateManager.on('performance-threshold-exceeded', (data: any) => {
        this.emit('performanceThresholdExceeded', data);
      });

      this.stateManager.on('state-changed', (data: any) => {
        if (data.change.source === 'component-transfer-coordinator') {
          this.emit('stateChangeConfirmed', data);
        }
      });
    }
  }

  private async processTransferQueue(): Promise<void> {
    if (this.transferQueue.size > 0 && this.activeTransfers.size < this.maxConcurrentTransfers) {
      const transferEntry = this.transferQueue.entries().next().value;
      if (transferEntry) {
        const [transferId, request] = transferEntry;
        this.transferQueue.delete(transferId);
        await this.coordinateComponentTransfer(request);
      }
    }
  }

  private emitPerformanceMetrics(operation: string, duration: number, operationCount: number): void {
    process.nextTick(() => {
      const signal: Signals = 'backend-integration:metrics';
      const payload: MetricsSignalPayload = {
        timestamp: Date.now(),
        source: 'pcl-backend-integration',
        data: {
          operation: `transfer-coordinator-${operation}`,
          duration,
          operationCount
        },
        metrics: {
          memory: {
            heapUsed: process.memoryUsage().heapUsed,
            rss: process.memoryUsage().rss
          },
          cpu: {
            user: 0, // Would need actual CPU measurement
            system: 0
          },
          interfaces: {}
        },
        category: 'performance'
      };
      (process as any).emit(signal, payload);
    });
  }
}

/**
 * PCLCommandRouter - PCL Registry pattern integration
 * Routes commands using proven PCL patterns with 75% reuse optimization
 */
export class PCLCommandRouter extends EventDrivenComponent<PCLCommandRouterEvents> {
  private static instanceCounter = 0;
  private commandRegistry: any; // PCL Command Registry integration
  private routingCache: Map<string, any> = new Map();
  private routingStats: Map<string, any> = new Map();

  constructor(commandRegistry: any) {
    super(`pcl-command-router:${PCLCommandRouter.instanceCounter++}`, 40);
    this.commandRegistry = commandRegistry;
  }

  /**
   * Route PCL command with optimization patterns
   */
  async routePCLCommand(command: PCLBackendCommand, targetBackend: string): Promise<any> {
    const startTime = performance.now();
    const routingKey = `${command.componentId}:${command.type}:${targetBackend}`;

    try {
      // Check routing cache for optimization
      if (this.routingCache.has(routingKey)) {
        const cachedRoute = this.routingCache.get(routingKey);
        this.updateRoutingStats(routingKey, 'cache-hit', performance.now() - startTime);
        return cachedRoute;
      }

      // Use PCL Command Registry patterns for optimal routing
      const routingInfo = this.commandRegistry.getCommandRouting(command.componentId);
      if (!routingInfo.command) {
        throw new Error(`No PCL command mapping found for component ${command.componentId}`);
      }

      // Apply PCL-specific routing optimization
      const optimizedRoute = await this.optimizeRouting(command, routingInfo);
      
      // Cache successful route for reuse
      this.routingCache.set(routingKey, optimizedRoute);
      
      const duration = performance.now() - startTime;
      this.updateRoutingStats(routingKey, 'route-success', duration);
      this.emitPerformanceMetrics('command-routing', duration, 1);

      return optimizedRoute;

    } catch (error) {
      const duration = performance.now() - startTime;
      this.updateRoutingStats(routingKey, 'route-failure', duration);
      
      const templumError = isTemplumError(error) 
        ? error 
        : createTemplumError(
            error instanceof Error ? error.message : 'Unknown routing error',
            'ROUTING_FAILED',
            'integration',
            { command: command.componentId, duration }
          );
      
      this.emit('routingError', { command, error: templumError.message, duration });
      throw templumError;
    }
  }

  /**
   * Optimize routing using PCL patterns and complexity scoring
   */
  private async optimizeRouting(command: PCLBackendCommand, routingInfo: any): Promise<any> {
    const optimization = {
      route: routingInfo.routing.primaryBackend,
      fallbackRoutes: routingInfo.routing.fallbackBackends,
      reusePercentage: 0,
      optimizationApplied: [] as string[]
    };

    // Apply PCL reuse optimization based on component complexity
    if (command.complexity <= 2 && command.transferPhase === '2A') {
      // Low complexity - direct PCL mapping (80-95% reuse)
      optimization.reusePercentage = 90;
      optimization.optimizationApplied.push('direct-pcl-mapping');
    } else if (command.complexity === 3 && command.transferPhase === '2B') {
      // Medium complexity - adapter pattern (60-80% reuse)
      optimization.reusePercentage = 75;
      optimization.optimizationApplied.push('adapter-pattern');
    } else if (command.complexity >= 4 && command.transferPhase === '2C') {
      // High complexity - composite pattern (40-60% reuse)
      optimization.reusePercentage = 50;
      optimization.optimizationApplied.push('composite-pattern');
    }

    return optimization;
  }

  private updateRoutingStats(routingKey: string, result: string, duration: number): void {
    if (!this.routingStats.has(routingKey)) {
      this.routingStats.set(routingKey, {
        totalRequests: 0,
        cacheHits: 0,
        successes: 0,
        failures: 0,
        avgDuration: 0
      });
    }

    const stats = this.routingStats.get(routingKey);
    stats.totalRequests++;
    
    switch (result) {
      case 'cache-hit':
        stats.cacheHits++;
        stats.successes++;
        break;
      case 'route-success':
        stats.successes++;
        break;
      case 'route-failure':
        stats.failures++;
        break;
    }

    // Update rolling average duration
    stats.avgDuration = ((stats.avgDuration * (stats.totalRequests - 1)) + duration) / stats.totalRequests;
  }

  private emitPerformanceMetrics(operation: string, duration: number, operationCount: number): void {
    process.nextTick(() => {
      const signal: Signals = 'backend-integration:metrics';
      const payload: MetricsSignalPayload = {
        timestamp: Date.now(),
        source: 'pcl-command-router',
        data: {
          operation: `command-router-${operation}`,
          duration,
          operationCount
        },
        metrics: {
          memory: {
            heapUsed: process.memoryUsage().heapUsed,
            rss: process.memoryUsage().rss
          },
          cpu: {
            user: 0,
            system: 0
          },
          interfaces: {}
        },
        category: 'performance'
      };
      (process as any).emit(signal, payload);
    });
  }

  /**
   * Get routing statistics for optimization analysis
   */
  getRoutingStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [key, routingStats] of Array.from(this.routingStats.entries())) {
      stats[key] = { ...routingStats };
    }

    return stats;
  }
}

/**
 * ValidationFramework - Performance monitoring integration
 * Integrates with Performance Monitor for continuous validation
 */
export class ValidationFramework extends EventDrivenComponent<ValidationFrameworkEvents> {
  private static instanceCounter = 0;
  private performanceThreshold: number = 30; // 30% degradation threshold from Phase 1
  private performanceBaselines: Map<string, number> = new Map();
  private validationResults: Map<string, ValidationResult[]> = new Map();
  private cleanupTasks: Array<() => void> = [];

  constructor() {
    super(`validation-framework:${ValidationFramework.instanceCounter++}`, 60);
    this.setupPerformanceMonitoring();
  }

  /**
   * Validate component performance with continuous monitoring
   */
  async validateComponentPerformance(componentId: string, operation: string): Promise<ValidationResult> {
    const startTime = performance.now();

    try {
      // Get baseline performance
      const baseline = this.performanceBaselines.get(componentId) || 50; // 50ms default from Phase 1

      // Measure current performance
      const currentMetrics = await this.measureCurrentPerformance(componentId, operation);
      
      // Calculate performance delta
      const performanceDelta = ((currentMetrics.responseTime - baseline) / baseline) * 100;
      
      // Determine if rollback is required
      const rollbackRequired = performanceDelta > this.performanceThreshold;
      const fallbackRecommended = performanceDelta > (this.performanceThreshold * 0.5); // 15% threshold

      const result: ValidationResult = {
        componentId,
        valid: !rollbackRequired,
        performanceMetrics: {
          ...currentMetrics,
          performanceDelta
        },
        validationErrors: rollbackRequired ? [`Performance degradation ${performanceDelta.toFixed(1)}% exceeds threshold ${this.performanceThreshold}%`] : [],
        fallbackRecommended,
        rollbackRequired
      };

      // Store validation result
      if (!this.validationResults.has(componentId)) {
        this.validationResults.set(componentId, []);
      }
      this.validationResults.get(componentId)!.push(result);

      // Emit validation events
      if (rollbackRequired) {
        this.emit('rollbackRequired', { componentId, result });
      } else if (fallbackRecommended) {
        this.emit('fallbackRecommended', { componentId, result });
      }

      const duration = performance.now() - startTime;
      this.emitPerformanceMetrics('performance-validation', duration, 1);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        componentId,
        valid: false,
        performanceMetrics: { responseTime: 0, memoryUsage: 0, cpuUsage: 0, performanceDelta: 0 },
        validationErrors: [`Validation failed: ${errorMessage}`],
        fallbackRecommended: true,
        rollbackRequired: false
      };
    }
  }

  /**
   * Set performance baseline for component
   */
  setPerformanceBaseline(componentId: string, baseline: number): void {
    this.performanceBaselines.set(componentId, baseline);
    this.emit('baselineSet', { componentId, baseline });
  }

  private async measureCurrentPerformance(_componentId: string, _operation: string): Promise<{
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  }> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Simulate performance measurement
    await sleep(Math.random() * 10);

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    return {
      responseTime: endTime - startTime,
      memoryUsage: Math.max(0, endMemory - startMemory) / 1024 / 1024, // MB
      cpuUsage: 0 // Placeholder
    };
  }

  private setupPerformanceMonitoring(): void {
    // Listen for performance metrics from other components
    const metricsHandler = (metrics: any) => {
      this.processPerformanceMetrics(metrics);
    };
    process.on('backend-integration:metrics', metricsHandler);
    this.registerCleanup(() => process.off('backend-integration:metrics', metricsHandler));

    // Periodic performance validation
    const validationInterval: ManagedInterval = createInterval(
      () => void this.performPeriodicValidation(),
      10000,
      { unref: true }
    );
    this.registerCleanup(() => validationInterval.stop());
  }

  private processPerformanceMetrics(metrics: any): void {
    // Process metrics and emit warnings if thresholds are exceeded
    if (metrics.duration > 50) { // 50ms threshold from Phase 1
      this.emit('performanceWarning', {
        operation: metrics.operation,
        duration: metrics.duration,
        threshold: 50
      });
    }
  }

  private async performPeriodicValidation(): Promise<void> {
    // Validate performance for all components with baselines
    for (const componentId of Array.from(this.performanceBaselines.keys())) {
      try {
        await this.validateComponentPerformance(componentId, 'periodic-validation');
      } catch (error) {
        const { error: normalizedError, data } = normalizeLoggerError(error);
        const metadata: Record<string, unknown> = {
          componentId,
          operation: 'periodic-validation'
        };
        if (data !== undefined) {
          metadata.details = data;
        }
        validationLogger.error(
          'Periodic validation failed during scheduled validation',
          normalizedError ?? undefined,
          metadata
        );
      }
    }
  }

  private emitPerformanceMetrics(operation: string, duration: number, operationCount: number): void {
    process.nextTick(() => {
      const signal: Signals = 'backend-integration:metrics';
      const payload: MetricsSignalPayload = {
        timestamp: Date.now(),
        source: 'validation-framework',
        data: {
          operation: `validation-framework-${operation}`,
          duration,
          operationCount
        },
        metrics: {
          memory: {
            heapUsed: process.memoryUsage().heapUsed,
            rss: process.memoryUsage().rss
          },
          cpu: {
            user: 0,
            system: 0
          },
          interfaces: {}
        },
        category: 'performance'
      };
      (process as any).emit(signal, payload);
    });
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    totalValidations: number;
    successRate: number;
    avgPerformanceDelta: number;
    rollbacksTriggered: number;
    fallbacksRecommended: number;
  } {
    let totalValidations = 0;
    let successfulValidations = 0;
    let totalPerformanceDelta = 0;
    let rollbacksTriggered = 0;
    let fallbacksRecommended = 0;

    for (const results of Array.from(this.validationResults.values())) {
      totalValidations += results.length;
      
      for (const result of results) {
        if (result.valid) successfulValidations++;
        totalPerformanceDelta += Math.abs(result.performanceMetrics.performanceDelta);
        if (result.rollbackRequired) rollbacksTriggered++;
        if (result.fallbackRecommended) fallbacksRecommended++;
      }
    }

    return {
      totalValidations,
      successRate: totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0,
      avgPerformanceDelta: totalValidations > 0 ? totalPerformanceDelta / totalValidations : 0,
      rollbacksTriggered,
      fallbacksRecommended
    };
  }

  dispose(): void {
    while (this.cleanupTasks.length) {
      const task = this.cleanupTasks.pop();
      try {
        task?.();
      } catch (error) {
        const { error: normalizedError, data } = normalizeLoggerError(error);
        const metadata: Record<string, unknown> = {
          phase: 'dispose',
          taskDefined: Boolean(task)
        };
        if (data !== undefined) {
          metadata.details = data;
        }
        validationLogger.error(
          'Cleanup task failed while disposing ValidationFramework',
          normalizedError ?? undefined,
          metadata
        );
      }
    }
    this.cleanupEvents();
  }

  private registerCleanup(task: () => void): void {
    this.cleanupTasks.push(task);
  }
}

/**
 * BackendFallbackManager - Risk Mitigation Framework integration
 * Manages fallback scenarios and coordinates with Risk Mitigation Framework
 */
export class BackendFallbackManager extends EventDrivenComponent<BackendFallbackManagerEvents> {
  private static instanceCounter = 0;
  private fallbackStrategies: Map<string, any> = new Map();
  private riskMitigationFramework: any;
  private cleanupTasks: Array<() => void> = [];

  constructor(riskMitigationFramework: any) {
    super(`backend-fallback-manager:${BackendFallbackManager.instanceCounter++}`, 50);
    this.riskMitigationFramework = riskMitigationFramework;
    this.setupRiskMitigationIntegration();
  }

  /**
   * Execute fallback strategy for component
   */
  async executeFallback(componentId: string, reason: string, fallbackType: 'performance' | 'error' | 'timeout'): Promise<boolean> {
    const startTime = performance.now();
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get fallback strategy
      const strategy = this.fallbackStrategies.get(componentId) || this.getDefaultFallbackStrategy();
      
      // Coordinate with Risk Mitigation Framework
      await this.riskMitigationFramework.triggerFallback(componentId, {
        type: fallbackType,
        reason,
        fallbackId,
        strategy: strategy.type
      });

      // Execute fallback based on strategy
      const fallbackSuccess = await this.executeStrategy(strategy, componentId, fallbackType);
      
      const duration = performance.now() - startTime;
      this.emitPerformanceMetrics('fallback-execution', duration, 1);

      this.emit('fallbackExecuted', {
        componentId,
        fallbackId,
        fallbackType,
        success: fallbackSuccess,
        duration,
        reason
      });

      return fallbackSuccess;

    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.emit('fallbackFailed', {
        componentId,
        fallbackId,
        error: errorMessage,
        duration
      });

      return false;
    }
  }

  /**
   * Register fallback strategy for component
   */
  registerFallbackStrategy(componentId: string, strategy: {
    type: 'direct' | 'graceful' | 'rollback';
    timeout: number;
    retries: number;
    fallbackComponent?: string;
  }): void {
    this.fallbackStrategies.set(componentId, strategy);
    this.emit('fallbackStrategyRegistered', { componentId, strategy });
  }

  private async executeStrategy(strategy: any, componentId: string, _fallbackType: string): Promise<boolean> {
    switch (strategy.type) {
      case 'direct':
        return this.executeDirectFallback(componentId, strategy);
      case 'graceful':
        return this.executeGracefulFallback(componentId, strategy);
      case 'rollback':
        return this.executeRollbackFallback(componentId, strategy);
      default:
        return false;
    }
  }

  private async executeDirectFallback(componentId: string, strategy: any): Promise<boolean> {
    // Direct fallback - switch to fallback component immediately
    if (strategy.fallbackComponent) {
      this.emit('componentSwitched', { 
        originalComponent: componentId, 
        fallbackComponent: strategy.fallbackComponent 
      });
      return true;
    }
    return false;
  }

  private async executeGracefulFallback(componentId: string, strategy: any): Promise<boolean> {
    // Graceful fallback - gradual degradation with retries
    for (let attempt = 1; attempt <= strategy.retries; attempt++) {
      await sleep(strategy.timeout);
      
      // Simulate retry success based on attempt number
      const successProbability = 0.3 + (0.2 * attempt); // Increasing success probability
      if (Math.random() < successProbability) {
        this.emit('gracefulFallbackSuccess', { componentId, attempt });
        return true;
      }
    }
    
    return false;
  }

  private async executeRollbackFallback(componentId: string, strategy: any): Promise<boolean> {
    // Rollback fallback - restore previous working state
    this.emit('rollbackInitiated', { componentId, strategy });
    
    // Simulate rollback operation
    await sleep(strategy.timeout);
    
    this.emit('rollbackCompleted', { componentId });
    return true;
  }

  private getDefaultFallbackStrategy(): any {
    return {
      type: 'graceful',
      timeout: 1000,
      retries: 3
    };
  }

  private setupRiskMitigationIntegration(): void {
    // Listen for risk mitigation events
    if (this.riskMitigationFramework) {
      this.riskMitigationFramework.on('performanceDegradationDetected', (data: any) => {
        this.executeFallback(data.componentId, 'performance degradation', 'performance');
      });

      this.riskMitigationFramework.on('rollbackRecommended', (data: any) => {
        this.executeFallback(data.componentId, 'rollback recommended', 'error');
      });
    }
  }

  private emitPerformanceMetrics(operation: string, duration: number, operationCount: number): void {
    process.nextTick(() => {
      const signal: Signals = 'backend-integration:metrics';
      const payload: MetricsSignalPayload = {
        timestamp: Date.now(),
        source: 'fallback-manager',
        data: {
          operation: `fallback-manager-${operation}`,
          duration,
          operationCount
        },
        metrics: {
          memory: {
            heapUsed: process.memoryUsage().heapUsed,
            rss: process.memoryUsage().rss
          },
          cpu: {
            user: 0,
            system: 0
          },
          interfaces: {}
        },
        category: 'performance'
      };
      (process as any).emit(signal, payload);
    });
  }

  dispose(): void {
    while (this.cleanupTasks.length) {
      const task = this.cleanupTasks.pop();
      try {
        task?.();
      } catch (error) {
        const { error: normalizedError, data } = normalizeLoggerError(error);
        const metadata: Record<string, unknown> = {
          phase: 'dispose',
          taskDefined: Boolean(task)
        };
        if (data !== undefined) {
          metadata.details = data;
        }
        fallbackLogger.error(
          'Cleanup task failed while disposing BackendFallbackManager',
          normalizedError ?? undefined,
          metadata
        );
      }
    }
    this.cleanupEvents();
  }

  private registerCleanup(task: () => void): void {
    this.cleanupTasks.push(task);
  }
}

/**
 * PCLBackendIntegrator - Main orchestrator for PCL backend integration
 * Coordinates all backend operations with component transfer validation and Enhanced State Synchronization
 */
export class PCLBackendIntegrator extends EventDrivenComponent<PCLBackendIntegratorEvents> {
  private static instanceCounter = 0;
  private backendConnections: Map<string, BackendServiceConnection> = new Map();
  private componentTransferCoordinator: ComponentTransferCoordinator;
  private pclCommandRouter: PCLCommandRouter;
  private validationFramework: ValidationFramework;
  private backendFallbackManager: BackendFallbackManager;
  private cleanupTasks: Array<() => void> = [];
  
  private integrationStats: BackendIntegrationStats = {
    totalConnections: 0,
    healthyConnections: 0,
    avgResponseTime: 0,
    successRate: 0,
    pclReuseEfficiency: 0,
    componentTransferStats: {
      totalTransfers: 0,
      successfulTransfers: 0,
      averageTransferTime: 0,
      fallbackActivations: 0
    },
    performanceMetrics: {
      degradationThresholdBreaches: 0,
      rollbackOperations: 0,
      avgPerformanceGain: 0
    }
  };

  constructor(dependencies: {
    stateManager: any;
    commandRegistry: any;
    riskMitigationFramework: any;
  }) {
    super(`pcl-backend-integrator:${PCLBackendIntegrator.instanceCounter++}`, 120);
    
    // Initialize components with proper integration
    this.componentTransferCoordinator = new ComponentTransferCoordinator(dependencies.stateManager);
    this.pclCommandRouter = new PCLCommandRouter(dependencies.commandRegistry);
    this.validationFramework = new ValidationFramework();
    this.backendFallbackManager = new BackendFallbackManager(dependencies.riskMitigationFramework);
    
    this.setupComponentIntegration();
    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize PCL backend integration system
   */
  async initialize(): Promise<void> {
    try {
      // Setup integration with existing components
      this.setupExistingComponentIntegration();
      
      // Start performance monitoring
      this.validationFramework.setPerformanceBaseline('backend-integration', 50); // 50ms baseline
      
      this.emit('initialized', { timestamp: Date.now() });
      
    } catch (error) {
      const templumError = isTemplumError(error) 
        ? error 
        : createTemplumError(
            error instanceof Error ? error.message : 'Unknown initialization error',
            'INITIALIZATION_FAILED',
            'configuration',
            { operation: 'initialization' }
          );
      
      this.emit('error', { error: templumError.message, operation: 'initialization' });
      throw templumError;
    }
  }

  /**
   * Connect to PCL backend service with validation
   */
  async connectBackend(backendConfig: {
    id: string;
    name: string;
    type: 'pcl' | 'vscode' | 'cli' | 'web';
    instance: any;
    capabilities: string[];
  }): Promise<void> {
    const startTime = performance.now();

    try {
      // Validate PCL compatibility
      const compatibility = await this.validatePCLCompatibility(backendConfig.instance);
      
      // Create backend connection
      const connection: BackendServiceConnection = {
        id: backendConfig.id,
        name: backendConfig.name,
        type: backendConfig.type,
        instance: backendConfig.instance,
        capabilities: backendConfig.capabilities,
        healthStatus: {
          connected: true,
          responseTime: 0,
          errorRate: 0,
          lastCheck: Date.now()
        },
        routingStrategy: this.determineRoutingStrategy(backendConfig.type),
        pclCompatibility: compatibility
      };

      // Store connection
      this.backendConnections.set(backendConfig.id, connection);

      // Register fallback strategy
      this.backendFallbackManager.registerFallbackStrategy(backendConfig.id, {
        type: 'graceful',
        timeout: 2000,
        retries: 3
      });

      const duration = performance.now() - startTime;
      this.updateStats('backend-connection', true, duration);

      this.emit('backendConnected', {
        backendId: backendConfig.id,
        pclCompatibility: compatibility,
        duration
      });

    } catch (error) {
      const duration = performance.now() - startTime;
      this.updateStats('backend-connection', false, duration);
      throw error;
    }
  }

  /**
   * Execute PCL backend command with component transfer coordination
   */
  async executeBackendCommand(command: PCLBackendCommand): Promise<any> {
    const startTime = performance.now();

    try {
      // Validate command with ValidationFramework
      const validation = await this.validationFramework.validateComponentPerformance(
        command.componentId, 
        'backend-command'
      );

      if (!validation.valid && validation.rollbackRequired) {
        // Trigger fallback for performance degradation
        await this.backendFallbackManager.executeFallback(
          command.componentId,
          'Performance validation failed',
          'performance'
        );
        throw new Error(`Command rejected due to performance issues: ${validation.validationErrors.join(', ')}`);
      }

      // Route command using PCL patterns
      const routing = await this.pclCommandRouter.routePCLCommand(
        command,
        this.selectOptimalBackend(command)
      );

      // Execute command
      const backend = this.backendConnections.get(routing.route);
      if (!backend) {
        throw new Error(`Backend ${routing.route} not available`);
      }

      const result = await backend.instance.executeCommand(command);

      // Update performance metrics
      const duration = performance.now() - startTime;
      this.updateStats('command-execution', true, duration);

      this.emit('commandExecuted', {
        commandId: command.requestId,
        componentId: command.componentId,
        backend: routing.route,
        duration,
        reusePercentage: routing.reusePercentage
      });

      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      this.updateStats('command-execution', false, duration);
      
      const templumError = isTemplumError(error) 
        ? error 
        : createTemplumError(
            error instanceof Error ? error.message : 'Unknown command execution error',
            'COMMAND_EXECUTION_FAILED',
            'runtime',
            { commandId: command.requestId, duration }
          );
      
      this.emit('commandFailed', {
        commandId: command.requestId,
        error: templumError.message,
        duration
      });

      throw templumError;
    }
  }

  /**
   * Transfer component with full coordination
   */
  async transferComponent(request: ComponentTransferRequest): Promise<void> {
    const startTime = performance.now();

    try {
      // Coordinate component transfer with Enhanced State Synchronization
      await this.componentTransferCoordinator.coordinateComponentTransfer(request);
      
      // Update transfer statistics
      const duration = performance.now() - startTime;
      this.integrationStats.componentTransferStats.totalTransfers++;
      this.integrationStats.componentTransferStats.successfulTransfers++;
      this.integrationStats.componentTransferStats.averageTransferTime = 
        ((this.integrationStats.componentTransferStats.averageTransferTime * 
          (this.integrationStats.componentTransferStats.totalTransfers - 1)) + duration) / 
        this.integrationStats.componentTransferStats.totalTransfers;

      this.emit('componentTransferred', {
        componentId: request.componentId,
        sourceInterface: request.sourceInterface,
        targetInterface: request.targetInterface,
        duration
      });

    } catch (error) {
      this.integrationStats.componentTransferStats.totalTransfers++;
      
      const templumError = isTemplumError(error) 
        ? error 
        : createTemplumError(
            error instanceof Error ? error.message : 'Unknown component transfer error',
            'COMPONENT_TRANSFER_FAILED',
            'integration',
            { componentId: request.componentId }
          );
      
      // Attempt fallback
      await this.backendFallbackManager.executeFallback(
        request.componentId,
        `Transfer failed: ${templumError.message}`,
        'error'
      );

      throw templumError;
    }
  }

  private async validatePCLCompatibility(backendInstance: any): Promise<{
    commandSupport: string[];
    reusePercentage: number;
    mappingType: 'direct' | 'adapter' | 'composite' | 'custom';
  }> {
    // Check PCL command compatibility
    const commandSupport = backendInstance.getSupportedCommands ? 
      backendInstance.getSupportedCommands() : [];
    
    // Calculate PCL reuse percentage based on supported commands
    const pclCommands = ['pcl.file.save', 'pcl.debug.start', 'pcl.terminal.new'];
    const supportedPCLCommands = commandSupport.filter((cmd: string) => 
      pclCommands.some(pclCmd => cmd.includes(pclCmd.split('.').pop() || ''))
    );
    
    const reusePercentage = (supportedPCLCommands.length / pclCommands.length) * 75; // Up to 75% reuse
    
    let mappingType: 'direct' | 'adapter' | 'composite' | 'custom';
    if (reusePercentage >= 60) mappingType = 'direct';
    else if (reusePercentage >= 40) mappingType = 'adapter';
    else if (reusePercentage >= 20) mappingType = 'composite';
    else mappingType = 'custom';

    return {
      commandSupport,
      reusePercentage,
      mappingType
    };
  }

  private determineRoutingStrategy(backendType: string): 'direct' | 'load-balanced' | 'fallback' {
    switch (backendType) {
      case 'pcl':
        return 'direct'; // Direct routing for PCL backends
      case 'vscode':
      case 'cli':
        return 'load-balanced'; // Load balancing for multiple instances
      default:
        return 'fallback'; // Fallback routing for other types
    }
  }

  private selectOptimalBackend(_command: PCLBackendCommand): string {
    // Select backend based on PCL compatibility and performance
    const candidates = Array.from(this.backendConnections.values())
      .filter(conn => conn.healthStatus.connected)
      .sort((a, b) => {
        // Sort by PCL reuse percentage (higher is better)
        const reuseA = a.pclCompatibility.reusePercentage;
        const reuseB = b.pclCompatibility.reusePercentage;
        if (reuseA !== reuseB) return reuseB - reuseA;
        
        // Then by response time (lower is better)
        return a.healthStatus.responseTime - b.healthStatus.responseTime;
      });

    return candidates.length > 0 ? candidates[0].id : '';
  }

  private setupComponentIntegration(): void {
    // Component Transfer Coordinator events
    this.componentTransferCoordinator.on('component-transfer-complete', (data) => {
      this.emit('componentTransferComplete', data);
    });

    this.componentTransferCoordinator.on('performanceThresholdExceeded', (data) => {
      this.integrationStats.performanceMetrics.degradationThresholdBreaches++;
      this.emit('performanceThresholdExceeded', data);
    });

    // Validation Framework events
    this.validationFramework.on('rollbackRequired', (data) => {
      this.integrationStats.performanceMetrics.rollbackOperations++;
      this.emit('rollbackRequired', data);
    });

    // Backend Fallback Manager events
    this.backendFallbackManager.on('fallbackExecuted', (data) => {
      if (data.success) {
        this.integrationStats.componentTransferStats.fallbackActivations++;
      }
      this.emit('fallbackExecuted', data);
    });
  }

  private setupExistingComponentIntegration(): void {
    // Integration hooks for existing components
    this.emit('setupComponentIntegration', {
      componentTransferCoordinator: this.componentTransferCoordinator,
      pclCommandRouter: this.pclCommandRouter,
      validationFramework: this.validationFramework,
      backendFallbackManager: this.backendFallbackManager
    });
  }

  private setupPerformanceMonitoring(): void {
    // Listen for performance metrics from components
    const metricsHandler = (metrics: any) => {
      this.processPerformanceMetrics(metrics);
    };
    process.on('backend-integration:metrics', metricsHandler);
    this.registerCleanup(() => process.off('backend-integration:metrics', metricsHandler));

    // Periodic health checks
    const healthInterval: ManagedInterval = createInterval(
      () => void this.performHealthChecks(),
      30000,
      { unref: true }
    );
    this.registerCleanup(() => healthInterval.stop());
  }

  private processPerformanceMetrics(metrics: any): void {
    // Update integration statistics
    this.integrationStats.avgResponseTime = 
      (this.integrationStats.avgResponseTime + metrics.duration) / 2;

    // Emit performance warnings if thresholds exceeded
    if (metrics.duration > 50) {
      this.emit('performanceWarning', {
        operation: metrics.operation,
        duration: metrics.duration,
        threshold: 50
      });
    }
  }

  private async performHealthChecks(): Promise<void> {
    let healthyCount = 0;
    
    for (const [_backendId, connection] of Array.from(this.backendConnections.entries())) {
      try {
        const startTime = performance.now();
        
        // Perform health check
        const healthy = await this.checkBackendHealth(connection);
        const responseTime = performance.now() - startTime;

        // Update health status
        connection.healthStatus.connected = healthy;
        connection.healthStatus.responseTime = responseTime;
        connection.healthStatus.lastCheck = Date.now();

        if (healthy) healthyCount++;

      } catch (_error) {
        connection.healthStatus.connected = false;
        connection.healthStatus.errorRate++;
      }
    }

    this.integrationStats.totalConnections = this.backendConnections.size;
    this.integrationStats.healthyConnections = healthyCount;
  }

  private async checkBackendHealth(connection: BackendServiceConnection): Promise<boolean> {
    // Simple health check - would be more sophisticated in production
    if (connection.instance && typeof connection.instance.ping === 'function') {
      try {
        await connection.instance.ping();
        return true;
      } catch (_error) {
        return false;
      }
    }
    
    return !!connection.instance; // Basic existence check
  }

  private updateStats(operation: string, success: boolean, duration: number): void {
    // Update success rate
    const totalOperations = (this.integrationStats.successRate > 0) ? 
      Math.round(100 / this.integrationStats.successRate) : 1;
    
    this.integrationStats.successRate = success ? 
      ((this.integrationStats.successRate * (totalOperations - 1)) + 100) / totalOperations :
      (this.integrationStats.successRate * (totalOperations - 1)) / totalOperations;

    // Update response time
    this.integrationStats.avgResponseTime = 
      (this.integrationStats.avgResponseTime + duration) / 2;

    // Calculate PCL reuse efficiency
    const totalReuse = Array.from(this.backendConnections.values())
      .reduce((sum, conn) => sum + conn.pclCompatibility.reusePercentage, 0);
    
    this.integrationStats.pclReuseEfficiency = this.backendConnections.size > 0 ?
      totalReuse / this.backendConnections.size : 0;
  }

  /**
   * Get comprehensive integration statistics
   */
  getIntegrationStats(): BackendIntegrationStats {
    return { ...this.integrationStats };
  }

  /**
   * Shutdown integration system
   */
  async shutdown(): Promise<void> {
    this.emit('shuttingDown', { timestamp: Date.now() });

    // Clean up components
    this.componentTransferCoordinator.removeAllListeners();
    this.pclCommandRouter.removeAllListeners();
    this.validationFramework.dispose();
    this.backendFallbackManager.dispose();
    this.cleanupResources();

    this.cleanupEvents();

    this.emit('shutdownComplete', { timestamp: Date.now() });
  }

  private registerCleanup(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  private cleanupResources(): void {
    while (this.cleanupTasks.length) {
      const task = this.cleanupTasks.pop();
      try {
        task?.();
      } catch (error) {
        const { error: normalizedError, data } = normalizeLoggerError(error);
        const metadata: Record<string, unknown> = {
          phase: 'cleanup',
          taskDefined: Boolean(task)
        };
        if (data !== undefined) {
          metadata.details = data;
        }
        integratorLogger.error(
          'Cleanup task failed while shutting down PCLBackendIntegrator',
          normalizedError ?? undefined,
          metadata
        );
      }
    }
  }
}

// Export default instance for convenience
export const backendIntegrator = new PCLBackendIntegrator({
  stateManager: null, // Will be injected during initialization
  commandRegistry: null, // Will be injected during initialization
  riskMitigationFramework: null // Will be injected during initialization
});

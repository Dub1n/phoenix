/**---
 * title: [Fallback Manager - Interface-Specific Fallback Orchestration]
 * tags: [Risk-Mitigation, Fallback-Systems, Interface-Specific, High-Complexity, Emergency-Response]
 * provides: [Fallback Strategies, Interface Adaptation, Emergency Response, System Resilience]
 * requires: [Interface Adapters, Performance Monitor, Component Transfer Strategy]
 * description: [Interface-specific fallback mechanisms for high-complexity operations with automatic failover coordination]
 * ---*/

import { EventEmitter } from 'events';

export interface FallbackStrategy {
  id: string;
  componentId: string;
  interfaceType: 'vscode' | 'cli' | 'command' | 'web';
  complexity: 1 | 2 | 3 | 4 | 5; // From Component Transfer Strategy
  strategy: {
    primary: FallbackMethod;
    secondary: FallbackMethod;
    emergency: FallbackMethod;
  };
  triggers: {
    performanceThreshold: number; // % degradation
    errorRateThreshold: number;   // % error rate
    timeoutThreshold: number;     // ms
    manualTrigger: boolean;
  };
  validation: {
    healthCheck: boolean;
    performanceValidation: boolean;
    functionalityTest: boolean;
  };
  rollback: {
    enabled: boolean;
    criteria: string[];
    timeout: number; // ms
    maxAttempts: number;
  };
}

export interface FallbackMethod {
  type: 'graceful-degradation' | 'alternative-component' | 'simplified-mode' | 'offline-mode' | 'emergency-shutdown';
  description: string;
  implementation: string; // Handler function name
  dependencies: string[];
  expectedPerformance: {
    responseTime: number; // ms
    successRate: number;  // %
    resourceUsage: number; // % of normal
  };
  limitations: string[];
  recoveryTime: number; // Expected time to recover (ms)
}

export interface FallbackExecution {
  id: string;
  strategyId: string;
  componentId: string;
  interfaceType: string;
  trigger: {
    type: 'performance' | 'error-rate' | 'timeout' | 'manual' | 'emergency';
    value: number;
    threshold: number;
    timestamp: number;
  };
  execution: {
    method: 'primary' | 'secondary' | 'emergency';
    startTime: number;
    endTime?: number;
    status: 'pending' | 'executing' | 'completed' | 'failed' | 'rolled-back';
    error?: string;
  };
  performance: {
    responseTime?: number;
    successRate?: number;
    resourceUsage?: number;
  };
  rollback?: {
    triggered: boolean;
    reason: string;
    timestamp: number;
    success: boolean;
  };
  recovery?: {
    attempted: boolean;
    timestamp: number;
    success: boolean;
    newPerformance?: any;
  };
}

export interface FallbackStats {
  totalStrategies: number;
  activeExecutions: number;
  executionHistory: {
    total: number;
    successful: number;
    failed: number;
    rolledBack: number;
  };
  performanceImpact: {
    avgResponseTimeIncrease: number; // %
    avgResourceReduction: number;    // %
    avgSuccessRateImpact: number;    // %
  };
  reliabilityMetrics: {
    fallbackSuccessRate: number;
    avgRecoveryTime: number;
    rollbackSuccessRate: number;
  };
  interfaceSpecificStats: Record<string, {
    executionCount: number;
    successRate: number;
    avgFallbackTime: number;
  }>;
}

export class FallbackManager extends EventEmitter {
  private strategies: Map<string, FallbackStrategy> = new Map();
  private activeExecutions: Map<string, FallbackExecution> = new Map();
  private executionHistory: FallbackExecution[] = [];
  private interfaceAdapters: Map<string, any> = new Map();
  private performanceMonitor: any;
  private config: {
    maxConcurrentFallbacks: number;
    executionTimeout: number;
    rollbackTimeout: number;
    historyRetention: number; // days
  };

  constructor() {
    super();
    this.config = {
      maxConcurrentFallbacks: 5,
      executionTimeout: 30000, // 30 seconds
      rollbackTimeout: 10000,  // 10 seconds
      historyRetention: 30     // 30 days
    };
    this.initializeDefaultStrategies();
  }

  /**
   * Register fallback strategy for component-interface combination
   */
  registerFallbackStrategy(strategy: FallbackStrategy): void {
    // Validate strategy
    const validation = this.validateFallbackStrategy(strategy);
    if (!validation.valid) {
      throw new Error(`Invalid fallback strategy: ${validation.errors.join(', ')}`);
    }

    this.strategies.set(strategy.id, strategy);
    
    this.emit('strategyRegistered', {
      strategyId: strategy.id,
      componentId: strategy.componentId,
      interfaceType: strategy.interfaceType,
      complexity: strategy.complexity,
      timestamp: Date.now()
    });

    console.log(`Fallback Manager: Registered strategy for ${strategy.componentId} on ${strategy.interfaceType} (complexity ${strategy.complexity})`);
  }

  /**
   * Execute fallback for specific component and interface
   */
  async executeFallback(
    componentId: string,
    interfaceType: string,
    triggerType: 'performance' | 'error-rate' | 'timeout' | 'manual' | 'emergency',
    triggerValue: number,
    context?: any
  ): Promise<FallbackExecution> {
    // Find appropriate strategy
    const strategy = this.findFallbackStrategy(componentId, interfaceType);
    if (!strategy) {
      throw new Error(`No fallback strategy found for ${componentId} on ${interfaceType}`);
    }

    // Check if we've reached max concurrent fallbacks
    if (this.activeExecutions.size >= this.config.maxConcurrentFallbacks) {
      throw new Error('Maximum concurrent fallbacks reached');
    }

    // Determine fallback method based on trigger severity
    const fallbackMethod = this.selectFallbackMethod(strategy, triggerType, triggerValue);

    // Create execution record
    const execution: FallbackExecution = {
      id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      strategyId: strategy.id,
      componentId,
      interfaceType,
      trigger: {
        type: triggerType,
        value: triggerValue,
        threshold: this.getThresholdForTrigger(strategy, triggerType),
        timestamp: Date.now()
      },
      execution: {
        method: fallbackMethod,
        startTime: Date.now(),
        status: 'pending'
      },
      performance: {}
    };

    this.activeExecutions.set(execution.id, execution);

    try {
      // Execute fallback with timeout
      execution.execution.status = 'executing';
      const result = await this.executeWithTimeout(
        () => this.performFallback(strategy, fallbackMethod, context),
        this.config.executionTimeout
      );

      execution.execution.endTime = Date.now();
      execution.execution.status = 'completed';
      execution.performance = result.performance;

      // Validate fallback execution
      const validationResult = await this.validateFallbackExecution(execution, strategy);
      if (!validationResult.valid) {
        throw new Error(`Fallback validation failed: ${validationResult.issues.join(', ')}`);
      }

      this.emit('fallbackCompleted', execution);
      console.log(`Fallback Manager: Successfully executed ${fallbackMethod} fallback for ${componentId}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      execution.execution.status = 'failed';
      execution.execution.error = errorMessage;
      execution.execution.endTime = Date.now();

      // Attempt rollback if enabled
      if (strategy.rollback.enabled) {
        await this.attemptRollback(execution, strategy);
      }

      this.emit('fallbackFailed', execution);
      throw new Error(`Fallback execution failed: ${errorMessage}`);
    } finally {
      // Move to history and cleanup
      this.moveToHistory(execution);
      this.activeExecutions.delete(execution.id);
    }

    return execution;
  }

  /**
   * Monitor component and automatically trigger fallback when thresholds exceeded
   */
  enableAutomaticFallback(
    componentId: string, 
    interfaceType: string, 
    performanceMonitor: any
  ): void {
    const strategy = this.findFallbackStrategy(componentId, interfaceType);
    if (!strategy) {
      throw new Error(`No fallback strategy found for ${componentId} on ${interfaceType}`);
    }

    // Connect to performance monitor
    this.performanceMonitor = performanceMonitor;
    
    // Listen for performance degradation events
    this.performanceMonitor.on('performanceDegradation', async (degradation: any) => {
      if (degradation.componentId === componentId) {
        const shouldTrigger = this.shouldTriggerFallback(strategy, degradation);
        
        if (shouldTrigger) {
          try {
            await this.executeFallback(
              componentId,
              interfaceType,
              'performance',
              Math.abs(degradation.degradationPercentage)
            );
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Automatic fallback failed for ${componentId}: ${errorMessage}`);
          }
        }
      }
    });

    this.emit('automaticFallbackEnabled', {
      componentId,
      interfaceType,
      strategyId: strategy.id,
      timestamp: Date.now()
    });
  }

  /**
   * Attempt recovery from fallback to normal operation
   */
  async attemptRecovery(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId) || 
      this.executionHistory.find(e => e.id === executionId);
    
    if (!execution) {
      throw new Error(`Fallback execution ${executionId} not found`);
    }

    if (execution.execution.status !== 'completed') {
      throw new Error('Cannot recover from incomplete fallback execution');
    }

    const strategy = this.strategies.get(execution.strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${execution.strategyId} not found`);
    }

    try {
      // Attempt to restore normal operation
      const recoveryResult = await this.performRecovery(execution, strategy);
      
      execution.recovery = {
        attempted: true,
        timestamp: Date.now(),
        success: recoveryResult.success,
        newPerformance: recoveryResult.performance
      };

      if (recoveryResult.success) {
        this.emit('recoveryCompleted', {
          executionId,
          componentId: execution.componentId,
          interfaceType: execution.interfaceType,
          recoveryTime: Date.now() - execution.execution.startTime,
          newPerformance: recoveryResult.performance
        });
        
        console.log(`Fallback Manager: Successfully recovered ${execution.componentId} from fallback`);
        return true;
      } else {
        this.emit('recoveryFailed', {
          executionId,
          componentId: execution.componentId,
          error: recoveryResult.error
        });
        
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      execution.recovery = {
        attempted: true,
        timestamp: Date.now(),
        success: false
      };

      this.emit('recoveryFailed', {
        executionId,
        componentId: execution.componentId,
        error: errorMessage
      });

      return false;
    }
  }

  /**
   * Get fallback statistics and health metrics
   */
  getFallbackStats(): FallbackStats {
    const allExecutions = [...this.executionHistory, ...Array.from(this.activeExecutions.values())];
    
    const successful = allExecutions.filter(e => e.execution.status === 'completed').length;
    const failed = allExecutions.filter(e => e.execution.status === 'failed').length;
    const rolledBack = allExecutions.filter(e => e.rollback?.triggered).length;

    // Calculate performance impact
    const completedExecutions = allExecutions.filter(e => e.execution.status === 'completed' && e.performance.responseTime);
    const avgResponseTimeIncrease = completedExecutions.length > 0 ?
      completedExecutions.reduce((sum, e) => sum + (e.performance.responseTime! / this.getBaselineResponseTime(e.componentId) - 1), 0) / completedExecutions.length * 100 : 0;

    // Calculate interface-specific stats
    const interfaceStats: Record<string, any> = {};
    for (const execution of allExecutions) {
      const iface = execution.interfaceType;
      if (!interfaceStats[iface]) {
        interfaceStats[iface] = { executionCount: 0, successful: 0, totalFallbackTime: 0 };
      }
      
      interfaceStats[iface].executionCount++;
      if (execution.execution.status === 'completed') {
        interfaceStats[iface].successful++;
      }
      
      if (execution.execution.endTime) {
        interfaceStats[iface].totalFallbackTime += execution.execution.endTime - execution.execution.startTime;
      }
    }

    // Convert to final format
    const interfaceSpecificStats: Record<string, any> = {};
    Object.entries(interfaceStats).forEach(([iface, stats]) => {
      interfaceSpecificStats[iface] = {
        executionCount: stats.executionCount,
        successRate: stats.executionCount > 0 ? (stats.successful / stats.executionCount) * 100 : 0,
        avgFallbackTime: stats.executionCount > 0 ? stats.totalFallbackTime / stats.executionCount : 0
      };
    });

    return {
      totalStrategies: this.strategies.size,
      activeExecutions: this.activeExecutions.size,
      executionHistory: {
        total: allExecutions.length,
        successful,
        failed,
        rolledBack
      },
      performanceImpact: {
        avgResponseTimeIncrease,
        avgResourceReduction: 25, // Placeholder - would calculate from actual data
        avgSuccessRateImpact: 5   // Placeholder - would calculate from actual data
      },
      reliabilityMetrics: {
        fallbackSuccessRate: allExecutions.length > 0 ? (successful / allExecutions.length) * 100 : 0,
        avgRecoveryTime: this.calculateAverageRecoveryTime(allExecutions),
        rollbackSuccessRate: rolledBack > 0 ? (allExecutions.filter(e => e.rollback?.success).length / rolledBack) * 100 : 0
      },
      interfaceSpecificStats
    };
  }

  /**
   * Register interface adapter for fallback execution
   */
  registerInterfaceAdapter(interfaceType: string, adapter: any): void {
    this.interfaceAdapters.set(interfaceType, adapter);
    
    this.emit('interfaceAdapterRegistered', {
      interfaceType,
      availableStrategies: this.getStrategiesForInterface(interfaceType).length
    });
  }

  /**
   * Get active fallback executions
   */
  getActiveFallbacks(): FallbackExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Force rollback of active fallback
   */
  async forceRollback(executionId: string, reason: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error(`Active fallback execution ${executionId} not found`);
    }

    const strategy = this.strategies.get(execution.strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${execution.strategyId} not found`);
    }

    return await this.attemptRollback(execution, strategy, reason);
  }

  private validateFallbackStrategy(strategy: FallbackStrategy): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!strategy.id) errors.push('Strategy ID is required');
    if (!strategy.componentId) errors.push('Component ID is required');
    if (!strategy.interfaceType) errors.push('Interface type is required');
    if (!strategy.complexity || strategy.complexity < 1 || strategy.complexity > 5) {
      errors.push('Complexity must be between 1 and 5');
    }

    // Validate strategy methods
    if (!strategy.strategy.primary) errors.push('Primary fallback method is required');
    if (!strategy.strategy.secondary) errors.push('Secondary fallback method is required');
    if (!strategy.strategy.emergency) errors.push('Emergency fallback method is required');

    // Validate triggers
    if (strategy.triggers.performanceThreshold <= 0 || strategy.triggers.performanceThreshold > 100) {
      errors.push('Performance threshold must be between 0 and 100');
    }

    return { valid: errors.length === 0, errors };
  }

  private findFallbackStrategy(componentId: string, interfaceType: string): FallbackStrategy | null {
    for (const strategy of this.strategies.values()) {
      if (strategy.componentId === componentId && strategy.interfaceType === interfaceType) {
        return strategy;
      }
    }
    return null;
  }

  private selectFallbackMethod(
    strategy: FallbackStrategy, 
    triggerType: string, 
    triggerValue: number
  ): 'primary' | 'secondary' | 'emergency' {
    // Emergency triggers use emergency method
    if (triggerType === 'emergency') {
      return 'emergency';
    }

    // High-severity triggers use secondary method
    if (triggerType === 'performance' && triggerValue >= strategy.triggers.performanceThreshold * 2) {
      return 'secondary';
    }

    if (triggerType === 'error-rate' && triggerValue >= strategy.triggers.errorRateThreshold * 2) {
      return 'secondary';
    }

    // Default to primary method
    return 'primary';
  }

  private getThresholdForTrigger(strategy: FallbackStrategy, triggerType: string): number {
    switch (triggerType) {
      case 'performance': return strategy.triggers.performanceThreshold;
      case 'error-rate': return strategy.triggers.errorRateThreshold;
      case 'timeout': return strategy.triggers.timeoutThreshold;
      default: return 0;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private async performFallback(
    strategy: FallbackStrategy, 
    method: 'primary' | 'secondary' | 'emergency', 
    context?: any
  ): Promise<{ performance: any }> {
    const fallbackMethod = strategy.strategy[method];
    const interfaceAdapter = this.interfaceAdapters.get(strategy.interfaceType);

    if (!interfaceAdapter) {
      throw new Error(`No interface adapter available for ${strategy.interfaceType}`);
    }

    const startTime = Date.now();

    try {
      // Execute the appropriate fallback method
      let result;
      switch (fallbackMethod.type) {
        case 'graceful-degradation':
          result = await this.executeGracefulDegradation(strategy, interfaceAdapter, context);
          break;
        case 'alternative-component':
          result = await this.executeAlternativeComponent(strategy, interfaceAdapter, context);
          break;
        case 'simplified-mode':
          result = await this.executeSimplifiedMode(strategy, interfaceAdapter, context);
          break;
        case 'offline-mode':
          result = await this.executeOfflineMode(strategy, interfaceAdapter, context);
          break;
        case 'emergency-shutdown':
          result = await this.executeEmergencyShutdown(strategy, interfaceAdapter, context);
          break;
        default:
          throw new Error(`Unknown fallback method type: ${fallbackMethod.type}`);
      }

      const responseTime = Date.now() - startTime;

      return {
        performance: {
          responseTime,
          successRate: result.successRate || fallbackMethod.expectedPerformance.successRate,
          resourceUsage: result.resourceUsage || fallbackMethod.expectedPerformance.resourceUsage
        }
      };
    } catch (error) {
      throw new Error(`Fallback method ${fallbackMethod.type} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateFallbackExecution(
    execution: FallbackExecution, 
    strategy: FallbackStrategy
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (strategy.validation.healthCheck) {
      const healthCheck = await this.performHealthCheck(execution.componentId, execution.interfaceType);
      if (!healthCheck.healthy) {
        issues.push(`Health check failed: ${healthCheck.issues.join(', ')}`);
      }
    }

    if (strategy.validation.performanceValidation && execution.performance.responseTime) {
      const expectedResponseTime = this.getFallbackMethod(strategy, execution.execution.method).expectedPerformance.responseTime;
      if (execution.performance.responseTime > expectedResponseTime * 1.5) {
        issues.push(`Performance validation failed: response time ${execution.performance.responseTime}ms exceeds expected ${expectedResponseTime}ms`);
      }
    }

    if (strategy.validation.functionalityTest) {
      const functionalityTest = await this.performFunctionalityTest(execution.componentId, execution.interfaceType);
      if (!functionalityTest.passed) {
        issues.push(`Functionality test failed: ${functionalityTest.issues.join(', ')}`);
      }
    }

    return { valid: issues.length === 0, issues };
  }

  private async attemptRollback(
    execution: FallbackExecution, 
    strategy: FallbackStrategy, 
    reason?: string
  ): Promise<boolean> {
    if (!strategy.rollback.enabled) {
      return false;
    }

    const rollbackStartTime = Date.now();

    try {
      // Perform rollback operation
      const rollbackResult = await this.executeWithTimeout(
        () => this.performRollback(execution, strategy),
        strategy.rollback.timeout || this.config.rollbackTimeout
      );

      execution.rollback = {
        triggered: true,
        reason: reason || 'Automatic rollback due to validation failure',
        timestamp: rollbackStartTime,
        success: rollbackResult.success
      };

      if (rollbackResult.success) {
        execution.execution.status = 'rolled-back';
        this.emit('rollbackCompleted', execution);
        return true;
      } else {
        this.emit('rollbackFailed', execution);
        return false;
      }
    } catch (_error) {
      execution.rollback = {
        triggered: true,
        reason: reason || 'Automatic rollback due to validation failure',
        timestamp: rollbackStartTime,
        success: false
      };

      this.emit('rollbackFailed', execution);
      return false;
    }
  }

  private shouldTriggerFallback(strategy: FallbackStrategy, degradation: any): boolean {
    const degradationPercentage = Math.abs(degradation.degradationPercentage);
    return degradationPercentage >= strategy.triggers.performanceThreshold;
  }

  private async performRecovery(execution: FallbackExecution, _strategy: FallbackStrategy): Promise<{
    success: boolean;
    performance?: any;
    error?: string;
  }> {
    // Attempt to restore component to normal operation
    const interfaceAdapter = this.interfaceAdapters.get(execution.interfaceType);
    if (!interfaceAdapter || !interfaceAdapter.restoreNormalOperation) {
      return { success: false, error: 'Interface adapter does not support recovery' };
    }

    try {
      const result = await interfaceAdapter.restoreNormalOperation(execution.componentId);
      return { success: true, performance: result.performance };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private moveToHistory(execution: FallbackExecution): void {
    this.executionHistory.push(execution);
    
    // Maintain history size limit
    const maxHistorySize = this.config.historyRetention * 24 * 10; // Rough estimate based on frequency
    if (this.executionHistory.length > maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  private getStrategiesForInterface(interfaceType: string): FallbackStrategy[] {
    return Array.from(this.strategies.values()).filter(s => s.interfaceType === interfaceType);
  }

  private getBaselineResponseTime(_componentId: string): number {
    // Placeholder - would get from performance monitor
    return 100; // 100ms baseline
  }

  private calculateAverageRecoveryTime(executions: FallbackExecution[]): number {
    const recoveredExecutions = executions.filter(e => e.recovery?.success && e.execution.endTime);
    if (recoveredExecutions.length === 0) return 0;

    const totalRecoveryTime = recoveredExecutions.reduce((sum, e) => {
      return sum + (e.recovery!.timestamp - e.execution.startTime);
    }, 0);

    return totalRecoveryTime / recoveredExecutions.length;
  }

  private getFallbackMethod(strategy: FallbackStrategy, method: 'primary' | 'secondary' | 'emergency'): FallbackMethod {
    return strategy.strategy[method];
  }

  // Fallback method implementations
  private async executeGracefulDegradation(strategy: FallbackStrategy, adapter: any, context?: any): Promise<any> {
    // Reduce functionality while maintaining core operations
    return await adapter.enableGracefulDegradation(strategy.componentId, context);
  }

  private async executeAlternativeComponent(strategy: FallbackStrategy, adapter: any, context?: any): Promise<any> {
    // Switch to alternative component implementation
    return await adapter.switchToAlternativeComponent(strategy.componentId, context);
  }

  private async executeSimplifiedMode(strategy: FallbackStrategy, adapter: any, context?: any): Promise<any> {
    // Enable simplified mode with reduced features
    return await adapter.enableSimplifiedMode(strategy.componentId, context);
  }

  private async executeOfflineMode(strategy: FallbackStrategy, adapter: any, context?: any): Promise<any> {
    // Switch to offline operation mode
    return await adapter.enableOfflineMode(strategy.componentId, context);
  }

  private async executeEmergencyShutdown(strategy: FallbackStrategy, adapter: any, context?: any): Promise<any> {
    // Perform controlled emergency shutdown
    return await adapter.performEmergencyShutdown(strategy.componentId, context);
  }

  private async performHealthCheck(componentId: string, interfaceType: string): Promise<{
    healthy: boolean;
    issues: string[];
  }> {
    const adapter = this.interfaceAdapters.get(interfaceType);
    if (!adapter || !adapter.performHealthCheck) {
      return { healthy: true, issues: [] }; // Assume healthy if no health check available
    }

    return await adapter.performHealthCheck(componentId);
  }

  private async performFunctionalityTest(componentId: string, interfaceType: string): Promise<{
    passed: boolean;
    issues: string[];
  }> {
    const adapter = this.interfaceAdapters.get(interfaceType);
    if (!adapter || !adapter.performFunctionalityTest) {
      return { passed: true, issues: [] }; // Assume passed if no test available
    }

    return await adapter.performFunctionalityTest(componentId);
  }

  private async performRollback(execution: FallbackExecution, _strategy: FallbackStrategy): Promise<{
    success: boolean;
  }> {
    const adapter = this.interfaceAdapters.get(execution.interfaceType);
    if (!adapter || !adapter.performRollback) {
      return { success: false };
    }

    try {
      await adapter.performRollback(execution.componentId, execution.execution.method);
      return { success: true };
    } catch (_error) {
      return { success: false };
    }
  }

  private initializeDefaultStrategies(): void {
    // Initialize default fallback strategies for common components based on Phase 1 analysis
    
    // High-complexity components (Phase 2C) with comprehensive fallback strategies
    const highComplexityComponents = [
      { id: 'state-synchronizer', complexity: 4 },
      { id: 'backend-orchestrator', complexity: 5 }
    ];

    // Medium-complexity components (Phase 2B) with enhanced fallback strategies  
    const mediumComplexityComponents = [
      { id: 'layout-engine', complexity: 3 },
      { id: 'menu-registry', complexity: 3 },
      { id: 'command-registry', complexity: 3 }
    ];

    // Low-complexity components (Phase 2A) with basic fallback strategies
    const lowComplexityComponents = [
      { id: 'audit-logger', complexity: 1 },
      { id: 'error-handler', complexity: 2 },
      { id: 'menu-content-converter', complexity: 2 }
    ];

    const interfaces: ('vscode' | 'cli' | 'command' | 'web')[] = ['vscode', 'cli', 'command', 'web'];

    // Create strategies for each component-interface combination
    [...highComplexityComponents, ...mediumComplexityComponents, ...lowComplexityComponents].forEach(comp => {
      interfaces.forEach(interfaceType => {
        const strategy: FallbackStrategy = {
          id: `${comp.id}-${interfaceType}-fallback`,
          componentId: comp.id,
          interfaceType,
          complexity: comp.complexity as 1 | 2 | 3 | 4 | 5,
          strategy: this.createFallbackMethods(comp.complexity),
          triggers: this.createTriggers(comp.complexity),
          validation: this.createValidation(comp.complexity),
          rollback: this.createRollbackConfig(comp.complexity)
        };

        this.strategies.set(strategy.id, strategy);
      });
    });

    console.log(`Fallback Manager: Initialized ${this.strategies.size} default fallback strategies`);
  }

  private createFallbackMethods(complexity: number): {
    primary: FallbackMethod;
    secondary: FallbackMethod;
    emergency: FallbackMethod;
  } {
    return {
      primary: {
        type: complexity <= 2 ? 'graceful-degradation' : 'alternative-component',
        description: `Primary fallback for complexity ${complexity} component`,
        implementation: `fallback-primary-${complexity}`,
        dependencies: [],
        expectedPerformance: {
          responseTime: 150, // 50% slower than normal
          successRate: 95,
          resourceUsage: 80
        },
        limitations: ['Reduced functionality', 'Slower performance'],
        recoveryTime: 5000 // 5 seconds
      },
      secondary: {
        type: complexity >= 4 ? 'simplified-mode' : 'graceful-degradation',
        description: `Secondary fallback for complexity ${complexity} component`,
        implementation: `fallback-secondary-${complexity}`,
        dependencies: [],
        expectedPerformance: {
          responseTime: 200, // 100% slower than normal
          successRate: 85,
          resourceUsage: 60
        },
        limitations: ['Significantly reduced functionality', 'Performance degradation'],
        recoveryTime: 10000 // 10 seconds
      },
      emergency: {
        type: complexity >= 4 ? 'emergency-shutdown' : 'offline-mode',
        description: `Emergency fallback for complexity ${complexity} component`,
        implementation: `fallback-emergency-${complexity}`,
        dependencies: [],
        expectedPerformance: {
          responseTime: 50, // Fast shutdown/offline mode
          successRate: 100, // Should always succeed
          resourceUsage: 10
        },
        limitations: ['No functionality', 'Complete service disruption'],
        recoveryTime: 30000 // 30 seconds
      }
    };
  }

  private createTriggers(complexity: number): {
    performanceThreshold: number;
    errorRateThreshold: number;
    timeoutThreshold: number;
    manualTrigger: boolean;
  } {
    return {
      performanceThreshold: 30, // 30% degradation threshold from Phase 1
      errorRateThreshold: Math.max(5, 15 - complexity * 2), // Lower error tolerance for higher complexity
      timeoutThreshold: Math.min(10000, 2000 * complexity), // Higher timeout for higher complexity
      manualTrigger: true
    };
  }

  private createValidation(complexity: number): {
    healthCheck: boolean;
    performanceValidation: boolean;
    functionalityTest: boolean;
  } {
    return {
      healthCheck: true,
      performanceValidation: complexity >= 3, // Performance validation for medium+ complexity
      functionalityTest: complexity >= 4      // Functionality testing for high complexity
    };
  }

  private createRollbackConfig(complexity: number): {
    enabled: boolean;
    criteria: string[];
    timeout: number;
    maxAttempts: number;
  } {
    return {
      enabled: complexity >= 2, // Enable rollback for complexity 2+
      criteria: [
        'Performance degradation >50%',
        'Error rate >25%',
        'Health check failure'
      ],
      timeout: Math.min(30000, 5000 * complexity), // Longer rollback timeout for higher complexity
      maxAttempts: Math.max(1, 4 - complexity)     // Fewer attempts for higher complexity
    };
  }
}
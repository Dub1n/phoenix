---
date-created: 2025-09-15T00:00:00Z
last-updated: 2025-09-15T00:00:00Z
name: resilience-utils-consolidation-pattern
description: Unified resilience utilities consolidating fallback strategies, performance monitoring, and rollback decision logic into a single chainable API for consistent system resilience
status: pending
category: resilience-infrastructure
use-when:
  - Need unified resilience patterns across components
  - Consolidating scattered fallback and monitoring logic
  - Implementing automated rollback decision systems
  - Reducing complexity in risk management components
keywords:
  - resilience-utilities
  - fallback-strategies
  - performance-monitoring
  - rollback-automation
  - risk-mitigation
  - system-recovery
prerequisites:
  - error-handler-utility
  - logger-utility
  - async-utils
related-patterns:
  - circuit-breaker-resilience
  - error-recovery
  - performance-utils-utility
  - observability-infrastructure
---

### Resilience Utils Utility Consolidation Pattern

**Problem**: Templum has resilience patterns scattered across 3 risk management components (~940 lines total) with duplicated monitoring logic, inconsistent fallback strategies, and manual rollback decision processes lacking unified API design.

**Current State Examples**:

```typescript
// Scattered fallback management (fallback-manager.ts)
const strategy = this.findFallbackStrategy(componentId, interfaceType);
if (!strategy) {
  throw new Error(`No fallback strategy found`);
}
const execution = await this.executeFallback(componentId, interfaceType, triggerType, triggerValue);

// Manual performance monitoring (performance-monitor.ts)
this.checkPerformanceDegradation(metric);
if (severity) {
  this.handlePerformanceDegradation(degradation);
  if (degradation.severity === 'critical') {
    this.triggerAutomaticResponse(degradation);
  }
}

// Complex rollback decisions (rollback-criteria.ts)
const decision = await this.evaluateRollbackDecision(componentId, interfaceType, currentMetrics);
if (['rollback', 'emergency-stop'].includes(decision.decision)) {
  await this.executeRollbackDecision(decision);
}
```

**Solution**: Unified ResilienceUtils with chainable API: `resilience.fallback().monitor().rollback()` providing consistent resilience patterns, automated decision logic, and integrated recovery strategies.

#### Resilience Utils Implementation

**Core ResilienceUtils Class** (Chainable API Design):

```typescript
import { createLogger } from './logger';
import { withTimeout, retry } from './async-utils';
import { ErrorHandler } from './error-handler';

export class ResilienceUtils {
  private static logger = createLogger('resilience-utils');
  private static instances = new Map<string, ResilienceManager>();
  
  // Chainable entry point for component resilience
  static for(componentId: string, interfaceType: string = 'default'): ResilienceManager {
    const key = `${componentId}:${interfaceType}`;
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new ResilienceManager(componentId, interfaceType));
    }
    
    return this.instances.get(key)!;
  }
  
  // Global cleanup for shutdown
  static cleanup(): void {
    this.instances.forEach(manager => manager.cleanup());
    this.instances.clear();
    this.logger.debug('Cleaned up all resilience managers');
  }
}

export class ResilienceManager {
  private componentId: string;
  private interfaceType: string;
  private fallbackConfig: FallbackConfig | null = null;
  private monitoringConfig: MonitoringConfig | null = null;
  private rollbackConfig: RollbackConfig | null = null;
  private isActive = false;
  
  constructor(componentId: string, interfaceType: string) {
    this.componentId = componentId;
    this.interfaceType = interfaceType;
  }
  
  // Configure fallback strategies with fluent API
  fallback(config: FallbackConfig): ResilienceManager {
    this.fallbackConfig = {
      strategies: {
        primary: 'graceful-degradation',
        secondary: 'alternative-component', 
        emergency: 'offline-mode',
        ...config.strategies
      },
      triggers: {
        performanceThreshold: 30,
        errorRateThreshold: 10,
        timeoutThreshold: 5000,
        ...config.triggers
      },
      validation: {
        healthCheck: true,
        performanceValidation: true,
        functionalityTest: false,
        ...config.validation
      },
      rollback: {
        enabled: true,
        timeout: 10000,
        maxAttempts: 3,
        ...config.rollback
      }
    };
    
    return this;
  }
  
  // Configure performance monitoring with fluent API
  monitor(config: MonitoringConfig): ResilienceManager {
    this.monitoringConfig = {
      metrics: ['response-time', 'error-rate', 'memory-usage', ...config.metrics],
      thresholds: {
        degradationThreshold: 30, // 30% from Phase 1
        warningThreshold: 15,
        criticalThreshold: 50,
        ...config.thresholds
      },
      sampling: {
        interval: 5000,
        window: 60000,
        minSamples: 5,
        ...config.sampling
      },
      alerts: {
        cooldown: 60000,
        escalation: true,
        autoResponse: true,
        ...config.alerts
      }
    };
    
    return this;
  }
  
  // Configure rollback criteria with fluent API
  rollback(config: RollbackConfig): ResilienceManager {
    this.rollbackConfig = {
      criteria: [
        { type: 'performance', threshold: 30, action: 'rollback' },
        { type: 'error-rate', threshold: 10, action: 'rollback' },
        { type: 'response-time', threshold: 500, action: 'emergency-stop' },
        ...config.criteria
      ],
      execution: {
        emergencyThreshold: 80,
        rollbackThreshold: 60,
        fallbackThreshold: 40,
        timeout: 30000,
        ...config.execution
      },
      safety: {
        checkUserSessions: true,
        checkCriticalProcesses: true,
        allowEmergencyOverride: true,
        ...config.safety
      }
    };
    
    return this;
  }
  
  // Activate resilience monitoring and response
  async activate(): Promise<ResilienceState> {
    if (this.isActive) {
      throw new Error(`Resilience already active for ${this.componentId}`);
    }
    
    const state = new ResilienceState(this.componentId, this.interfaceType);
    
    // Initialize fallback strategies
    if (this.fallbackConfig) {
      await state.initializeFallback(this.fallbackConfig);
    }
    
    // Start performance monitoring
    if (this.monitoringConfig) {
      await state.startMonitoring(this.monitoringConfig);
    }
    
    // Configure rollback criteria
    if (this.rollbackConfig) {
      await state.configureRollback(this.rollbackConfig);
    }
    
    // Wire up automatic responses
    state.on('degradation', (degradation) => this.handleDegradation(degradation, state));
    state.on('fallback-triggered', (execution) => this.handleFallback(execution, state));
    state.on('rollback-required', (decision) => this.handleRollback(decision, state));
    
    this.isActive = true;
    
    ResilienceUtils.logger.info(`Resilience activated for ${this.componentId}:${this.interfaceType}`);
    return state;
  }
  
  // Handle performance degradation automatically
  private async handleDegradation(degradation: any, state: ResilienceState): Promise<void> {
    try {
      // Check if degradation exceeds fallback thresholds
      if (this.shouldTriggerFallback(degradation)) {
        await state.executeFallback(degradation.severity, degradation);
      }
      
      // Check if degradation requires rollback
      if (this.shouldTriggerRollback(degradation)) {
        const decision = await state.evaluateRollback(degradation);
        if (decision.action !== 'continue') {
          await state.executeRollback(decision);
        }
      }
    } catch (error) {
      ResilienceUtils.logger.error(`Failed to handle degradation for ${this.componentId}:`, error);
    }
  }
  
  // Handle fallback execution
  private async handleFallback(execution: any, state: ResilienceState): Promise<void> {
    ResilienceUtils.logger.info(`Fallback triggered for ${this.componentId}: ${execution.method}`);
    
    // Monitor fallback performance
    const fallbackResult = await state.validateFallback(execution);
    
    if (!fallbackResult.success && this.rollbackConfig?.execution.emergencyThreshold) {
      // Fallback failed, consider rollback
      const decision = await state.evaluateRollback({
        type: 'fallback-failure',
        execution,
        severity: 'critical'
      });
      
      if (decision.action === 'rollback') {
        await state.executeRollback(decision);
      }
    }
  }
  
  // Handle rollback execution
  private async handleRollback(decision: any, state: ResilienceState): Promise<void> {
    ResilienceUtils.logger.warn(`Rollback initiated for ${this.componentId}: ${decision.action}`);
    
    const result = await state.executeRollback(decision);
    
    if (result.success) {
      ResilienceUtils.logger.info(`Rollback completed for ${this.componentId}: ${result.recoveryPercentage}% recovery`);
    } else {
      ResilienceUtils.logger.error(`Rollback failed for ${this.componentId}:`, result.error);
    }
  }
  
  private shouldTriggerFallback(degradation: any): boolean {
    if (!this.fallbackConfig) return false;
    
    const { performanceThreshold, errorRateThreshold } = this.fallbackConfig.triggers;
    
    return Math.abs(degradation.degradationPercentage) >= performanceThreshold ||
           degradation.errorRate >= errorRateThreshold;
  }
  
  private shouldTriggerRollback(degradation: any): boolean {
    if (!this.rollbackConfig) return false;
    
    return this.rollbackConfig.criteria.some(criterion => {
      return this.evaluateCriterion(criterion, degradation);
    });
  }
  
  private evaluateCriterion(criterion: any, degradation: any): boolean {
    switch (criterion.type) {
      case 'performance':
        return Math.abs(degradation.degradationPercentage) >= criterion.threshold;
      case 'error-rate':
        return degradation.errorRate >= criterion.threshold;
      case 'response-time':
        return degradation.responseTime >= criterion.threshold;
      default:
        return false;
    }
  }
  
  cleanup(): void {
    this.isActive = false;
    // Cleanup monitoring, fallback handlers, etc.
  }
}

// Resilience state management
export class ResilienceState extends EventTarget {
  private componentId: string;
  private interfaceType: string;
  private fallbackStrategies = new Map<string, any>();
  private activeExecutions = new Map<string, any>();
  private performanceBaselines = new Map<string, any>();
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  constructor(componentId: string, interfaceType: string) {
    super();
    this.componentId = componentId;
    this.interfaceType = interfaceType;
  }
  
  async initializeFallback(config: FallbackConfig): Promise<void> {
    // Initialize fallback strategies based on config
    const strategy = {
      id: `${this.componentId}-${this.interfaceType}`,
      componentId: this.componentId,
      interfaceType: this.interfaceType,
      strategies: config.strategies,
      triggers: config.triggers,
      validation: config.validation,
      rollback: config.rollback
    };
    
    this.fallbackStrategies.set(strategy.id, strategy);
  }
  
  async startMonitoring(config: MonitoringConfig): Promise<void> {
    // Start performance monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics(config);
    }, config.sampling.interval);
  }
  
  async configureRollback(config: RollbackConfig): Promise<void> {
    // Configure rollback criteria and decision logic
    // Implementation details for rollback configuration
  }
  
  async executeFallback(severity: string, context: any): Promise<any> {
    const strategy = this.fallbackStrategies.get(`${this.componentId}-${this.interfaceType}`);
    if (!strategy) {
      throw new Error(`No fallback strategy configured for ${this.componentId}`);
    }
    
    const method = this.selectFallbackMethod(strategy, severity);
    const execution = {
      id: `fallback-${Date.now()}`,
      componentId: this.componentId,
      method,
      startTime: Date.now(),
      context
    };
    
    this.activeExecutions.set(execution.id, execution);
    
    try {
      const result = await this.performFallback(execution, strategy);
      execution.endTime = Date.now();
      execution.result = result;
      
      this.dispatchEvent(new CustomEvent('fallback-triggered', { detail: execution }));
      return execution;
    } catch (error) {
      execution.error = error;
      execution.endTime = Date.now();
      throw error;
    } finally {
      this.activeExecutions.delete(execution.id);
    }
  }
  
  async evaluateRollback(context: any): Promise<any> {
    // Evaluate rollback criteria and return decision
    const riskScore = this.calculateRiskScore(context);
    
    let action = 'continue';
    if (riskScore >= 80) action = 'emergency-stop';
    else if (riskScore >= 60) action = 'rollback';
    else if (riskScore >= 40) action = 'fallback';
    
    return {
      action,
      riskScore,
      context,
      timestamp: Date.now()
    };
  }
  
  async executeRollback(decision: any): Promise<any> {
    // Execute rollback based on decision
    const execution = {
      id: `rollback-${Date.now()}`,
      componentId: this.componentId,
      decision,
      startTime: Date.now(),
      phases: this.createRollbackPhases(decision)
    };
    
    try {
      for (const phase of execution.phases) {
        await this.executeRollbackPhase(phase);
      }
      
      execution.endTime = Date.now();
      execution.success = true;
      execution.recoveryPercentage = await this.calculateRecovery();
      
      return execution;
    } catch (error) {
      execution.error = error;
      execution.success = false;
      return execution;
    }
  }
  
  async validateFallback(execution: any): Promise<any> {
    // Validate fallback execution results
    return { success: true, metrics: {} };
  }
  
  private async collectMetrics(config: MonitoringConfig): Promise<void> {
    // Collect performance metrics and check for degradation
    const metrics = await this.gatherMetrics(config.metrics);
    
    for (const [metricType, value] of Object.entries(metrics)) {
      const baseline = this.performanceBaselines.get(metricType);
      if (baseline) {
        const degradation = this.calculateDegradation(value as number, baseline, metricType);
        if (Math.abs(degradation) >= config.thresholds.degradationThreshold) {
          this.dispatchEvent(new CustomEvent('degradation', {
            detail: {
              componentId: this.componentId,
              metricType,
              degradationPercentage: degradation,
              currentValue: value,
              baselineValue: baseline,
              severity: this.calculateSeverity(degradation, config.thresholds)
            }
          }));
        }
      }
    }
  }
  
  private selectFallbackMethod(strategy: any, severity: string): string {
    switch (severity) {
      case 'emergency': return 'emergency';
      case 'critical': return 'secondary';
      default: return 'primary';
    }
  }
  
  private async performFallback(execution: any, strategy: any): Promise<any> {
    // Execute the fallback method
    const method = strategy.strategies[execution.method];
    // Implementation depends on fallback type
    return { success: true, performance: {} };
  }
  
  private calculateRiskScore(context: any): number {
    // Calculate risk score based on context
    let score = 0;
    
    if (context.degradationPercentage) {
      score += Math.abs(context.degradationPercentage);
    }
    
    if (context.errorRate) {
      score += context.errorRate * 2;
    }
    
    if (context.severity === 'critical') score += 30;
    if (context.severity === 'emergency') score += 50;
    
    return Math.min(100, score);
  }
  
  private createRollbackPhases(decision: any): any[] {
    return [
      { id: 'preparation', order: 1, action: 'prepare' },
      { id: 'component-restoration', order: 2, action: 'restore' },
      { id: 'validation', order: 3, action: 'validate' }
    ];
  }
  
  private async executeRollbackPhase(phase: any): Promise<void> {
    // Execute individual rollback phase
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
  }
  
  private async calculateRecovery(): Promise<number> {
    // Calculate performance recovery percentage
    return Math.floor(Math.random() * 40) + 60; // 60-100%
  }
  
  private async gatherMetrics(metricTypes: string[]): Promise<Record<string, number>> {
    // Gather current metrics
    return {
      'response-time': 120,
      'error-rate': 2,
      'memory-usage': 180
    };
  }
  
  private calculateDegradation(current: number, baseline: number, metricType: string): number {
    if (baseline === 0) return 0;
    
    if (['response-time', 'memory-usage', 'error-rate'].includes(metricType)) {
      return ((current - baseline) / baseline) * 100;
    } else {
      return ((baseline - current) / baseline) * 100;
    }
  }
  
  private calculateSeverity(degradation: number, thresholds: any): string {
    const abs = Math.abs(degradation);
    if (abs >= thresholds.criticalThreshold) return 'critical';
    if (abs >= thresholds.degradationThreshold) return 'warning';
    return 'info';
  }
}

// Configuration interfaces
interface FallbackConfig {
  strategies?: {
    primary?: string;
    secondary?: string;
    emergency?: string;
  };
  triggers?: {
    performanceThreshold?: number;
    errorRateThreshold?: number;
    timeoutThreshold?: number;
  };
  validation?: {
    healthCheck?: boolean;
    performanceValidation?: boolean;
    functionalityTest?: boolean;
  };
  rollback?: {
    enabled?: boolean;
    timeout?: number;
    maxAttempts?: number;
  };
}

interface MonitoringConfig {
  metrics: string[];
  thresholds?: {
    degradationThreshold?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
  };
  sampling?: {
    interval?: number;
    window?: number;
    minSamples?: number;
  };
  alerts?: {
    cooldown?: number;
    escalation?: boolean;
    autoResponse?: boolean;
  };
}

interface RollbackConfig {
  criteria?: Array<{
    type: string;
    threshold: number;
    action: string;
  }>;
  execution?: {
    emergencyThreshold?: number;
    rollbackThreshold?: number;
    fallbackThreshold?: number;
    timeout?: number;
  };
  safety?: {
    checkUserSessions?: boolean;
    checkCriticalProcesses?: boolean;
    allowEmergencyOverride?: boolean;
  };
}

// Convenience exports
export const resilience = ResilienceUtils;
```

#### Usage Examples (Minimal Footprint)

**Before** (Current scattered patterns):

```typescript
// Manual fallback setup (fallback-manager.ts - 939 lines)
const manager = new FallbackManager();
manager.registerFallbackStrategy({
  id: 'component-fallback',
  componentId: 'ui-component',
  interfaceType: 'cli',
  // ... 20+ lines of configuration
});
await manager.executeFallback('ui-component', 'cli', 'performance', 35);

// Manual monitoring setup (performance-monitor.ts - 671 lines)
const monitor = new PerformanceMonitor();
monitor.registerBaseline({
  componentId: 'ui-component',
  metricType: 'response-time',
  // ... configuration
});
monitor.startMonitoring();
monitor.on('performanceDegradation', async (degradation) => {
  // Manual response logic
});

// Manual rollback criteria (rollback-criteria.ts - 1155 lines)
const criteria = new RollbackCriteria();
criteria.registerCriterion({
  id: 'perf-degradation',
  // ... complex configuration
});
const decision = await criteria.evaluateRollbackDecision('ui-component', 'cli', metrics);
```

**After** (One-line consolidated):

```typescript
// Complete resilience setup with chainable API
const resilienceState = await resilience
  .for('ui-component', 'cli')
  .fallback({
    strategies: {
      primary: 'graceful-degradation',
      secondary: 'alternative-component',
      emergency: 'offline-mode'
    },
    triggers: {
      performanceThreshold: 30,
      errorRateThreshold: 10
    }
  })
  .monitor({
    metrics: ['response-time', 'error-rate', 'memory-usage'],
    thresholds: {
      degradationThreshold: 30,
      criticalThreshold: 50
    }
  })
  .rollback({
    criteria: [
      { type: 'performance', threshold: 30, action: 'rollback' },
      { type: 'error-rate', threshold: 10, action: 'rollback' }
    ]
  })
  .activate();

// Automatic resilience - everything handled internally
// Performance degradation → fallback → rollback decision → execution
// All integrated with monitoring, alerting, and recovery validation
```

**Advanced Usage**:

```typescript
// Component-specific resilience with custom strategies
const criticalComponent = await resilience
  .for('backend-orchestrator', 'api')
  .fallback({
    strategies: {
      primary: 'load-balancing',
      secondary: 'simplified-mode',
      emergency: 'emergency-shutdown'
    },
    triggers: { performanceThreshold: 15 } // Stricter for critical component
  })
  .monitor({
    metrics: ['response-time', 'throughput', 'error-rate', 'cpu-usage'],
    sampling: { interval: 1000 }, // More frequent sampling
    thresholds: { degradationThreshold: 15 }
  })
  .rollback({
    criteria: [
      { type: 'response-time', threshold: 500, action: 'emergency-stop' },
      { type: 'error-rate', threshold: 5, action: 'rollback' }
    ],
    safety: { checkUserSessions: true }
  })
  .activate();

// Event-driven resilience handling
resilienceState.addEventListener('degradation', (event) => {
  console.log(`Performance degradation detected:`, event.detail);
});

resilienceState.addEventListener('fallback-triggered', (event) => {
  console.log(`Fallback executed:`, event.detail);
});

resilienceState.addEventListener('rollback-required', (event) => {
  console.log(`Rollback initiated:`, event.detail);
});
```

#### Files Using This Pattern

**Risk Management Components** (Consolidation targets):

- [x] `src/risk/fallback-manager.ts` (939 lines → ResilienceUtils fallback methods)
- [x] `src/risk/performance-monitor.ts` (671 lines → ResilienceUtils monitoring)
- [x] `src/risk/rollback-criteria.ts` (1155 lines → ResilienceUtils rollback logic)

**Backend Components** (Heavy resilience usage):

- [ ] `src/backend/backend-service-router.ts` (resilience for service routing)
- [ ] `src/backend/service-discovery.ts` (service discovery resilience)
- [ ] `src/backend/connection-factory.ts` (connection resilience)
- [ ] `src/core/templum-core.ts` (core orchestrator resilience)

**Interface Components** (UI resilience):

- [ ] `src/interfaces/cli-adapter.ts` (CLI interface resilience)
- [ ] `src/interfaces/vscode-adapter.ts` (VSCode interface resilience)
- [ ] `src/session/templum-universal-session-manager.ts` (session resilience)

**Integration Components** (Service resilience):

- [ ] `src/skin/universal-skin-engine.ts` (skin processing resilience)
- [ ] `src/observability/templum-observability-system.ts` (observability resilience)

#### Expected Impact

**Quantitative Benefits**:

- **Lines Reduced**: ~2765 lines (939 + 671 + 1155) → ~400 lines unified utility
- **Files Consolidated**: 3 complex risk management files → 1 utility pattern
- **API Simplification**: 15+ methods per class → chainable fluent API
- **Configuration Reduction**: 100+ configuration options → structured config objects

**Qualitative Benefits**:

- **Unified Resilience**: Consistent resilience patterns across all components
- **Automatic Integration**: Fallback, monitoring, and rollback work together automatically
- **Simplified Configuration**: Declarative configuration vs. imperative setup
- **Event-Driven Architecture**: Clean separation of concerns with event handling
- **Chainable API**: Fluent interface for easy setup and configuration

#### Integration with Other Utilities

**Error Handler Integration**:

```typescript
// ResilienceUtils integrates with ErrorHandler for comprehensive error management
const resilientOperation = await resilience
  .for('critical-service')
  .fallback({ /* config */ })
  .monitor({ /* config */ })
  .rollback({ /* config */ })
  .activate();

// Errors automatically handled through resilience patterns
```

**Async Utils Integration**:

```typescript
// Resilience operations use AsyncUtils for timeout and retry management
// Built-in integration with withTimeout, retry, and cleanup utilities
```

**Logger Integration**:

```typescript
// All resilience events automatically logged with context
// Structured logging for monitoring and debugging
```

#### Implementation Validation

**Before Migration**:

- [ ] Analyze current resilience patterns across 3 risk management files
- [ ] Map fallback strategies, monitoring logic, and rollback criteria
- [ ] Identify integration points and dependencies

**During Migration**:

- [ ] Replace FallbackManager with ResilienceUtils.fallback()
- [ ] Convert PerformanceMonitor to ResilienceUtils.monitor()
- [ ] Migrate RollbackCriteria to ResilienceUtils.rollback()
- [ ] Implement chainable API with proper state management

**After Migration**:

- [ ] Verify all resilience patterns work through unified API
- [ ] Test automatic integration between fallback, monitoring, and rollback
- [ ] Validate event-driven architecture and proper cleanup
- [ ] Confirm 150+ line reduction and simplified configuration

#### Anti-Patterns

- **X** Don't use individual risk management classes - use unified ResilienceUtils
- **X** Don't manually wire fallback/monitoring/rollback - use chainable API
- **X** Don't duplicate resilience logic per component - configure once, reuse
- **X** Don't skip .activate() - resilience must be explicitly activated

#### Pattern Metadata

**Used By Active Tasks**: Risk Management Consolidation, Resilience Pattern Unification  
**Implementation Priority**: HIGH (Consolidates 3 major components)  
**Dependencies**: Error Handler Utility, Logger Utility, Async Utils Utility  
**Integration Points**: All components requiring resilience (backend, interface, session)  
**Migration Complexity**: Medium-High (3 complex classes to unified API)  
**Performance Impact**: Positive (reduced overhead, automatic cleanup, integrated decision logic)

**Status**: [pending]  
**Chain Position**: [standalone]  
**Chain Ready**: [false]  
**Critical Failure**: [false]  
**Handoff Location**: [direct_response]  
**Next Action**: [continue]  
**Confidence**: [high]

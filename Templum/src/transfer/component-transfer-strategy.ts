/**---
 * title: [Component Transfer Strategy - Complexity-Based Transfer Orchestrator]
 * tags: [Transfer, Strategy, Complexity-Scoring, PCL-Integration, Performance]
 * provides: [Complexity Assessment, Transfer Prioritization, Performance Validation, Rollback Criteria]
 * requires: [PCL Components, Performance Monitors, State Synchronization]
 * description: [Strategic component transfer orchestrator implementing Phase 1 insights with complexity scoring (1-5 scale)]
 * ---*/

import { EventEmitter } from 'events';

export interface ComponentComplexity {
  id: string;
  name: string;
  complexityScore: 1 | 2 | 3 | 4 | 5; // 1=Low, 5=High
  transferPhase: '2A' | '2B' | '2C';
  pclReusePercentage: number; // 0-100%
  performanceBaseline: {
    responseTime: number; // ms
    memoryUsage: number;   // MB
    cpuUsage: number;      // %
  };
  dependencies: string[];
  riskFactors: RiskFactor[];
  fallbackStrategy: FallbackStrategy;
}

export interface RiskFactor {
  type: 'performance' | 'integration' | 'compatibility' | 'complexity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigationStrategy: string;
}

export interface FallbackStrategy {
  enabled: boolean;
  fallbackComponent?: string;
  rollbackThreshold: number; // Performance degradation % (30% default)
  fallbackTimeout: number;   // ms
  retryAttempts: number;
}

export interface TransferResult {
  componentId: string;
  success: boolean;
  performanceMetrics: {
    preTransferBaseline: number;
    postTransferPerformance: number;
    performanceDelta: number; // % change
  };
  transferTime: number;
  error?: string;
  fallbackActivated: boolean;
  rollbackRequired: boolean;
}

export class ComponentTransferStrategy extends EventEmitter {
  private components: Map<string, ComponentComplexity> = new Map();
  private transferQueue: string[] = [];
  private transferResults: Map<string, TransferResult> = new Map();
  private performanceThreshold: number = 30; // >30% degradation triggers rollback
  
  constructor() {
    super();
    this.initializeComponentComplexityMap();
  }

  /**
   * Assess component complexity and assign transfer phase based on Phase 1 strategic insights
   */
  assessComponentComplexity(
    componentId: string,
    componentDefinition: any
  ): ComponentComplexity {
    const baseComplexity = this.calculateBaseComplexity(componentDefinition);
    const pclReusePercentage = this.calculatePCLReusePercentage(componentDefinition);
    const transferPhase = this.determineTransferPhase(baseComplexity);

    const complexity: ComponentComplexity = {
      id: componentId,
      name: componentDefinition.name || componentId,
      complexityScore: baseComplexity,
      transferPhase,
      pclReusePercentage,
      performanceBaseline: {
        responseTime: 50, // <50ms target from Phase 1
        memoryUsage: 10,  // MB baseline
        cpuUsage: 5       // % baseline
      },
      dependencies: componentDefinition.dependencies || [],
      riskFactors: this.assessRiskFactors(componentDefinition, baseComplexity),
      fallbackStrategy: this.createFallbackStrategy(baseComplexity)
    };

    this.components.set(componentId, complexity);
    this.emit('complexityAssessed', { componentId, complexity });

    return complexity;
  }

  /**
   * Create transfer priority queue following Phase 1 strategic order:
   * Phase 2A: Low-complexity direct transfers (audit-logger, error-handler, menu-content-converter)
   * Phase 2B: Medium-complexity enhanced transfers (layout engine, registries)
   * Phase 2C: High-complexity components with fallback strategies
   */
  createTransferPriorityQueue(): string[] {
    const allComponents = Array.from(this.components.values());
    
    // Group by transfer phase as identified in Phase 1
    const phase2A = allComponents
      .filter(c => c.transferPhase === '2A')
      .sort((a, b) => a.complexityScore - b.complexityScore);
      
    const phase2B = allComponents
      .filter(c => c.transferPhase === '2B')
      .sort((a, b) => b.pclReusePercentage - a.pclReusePercentage); // Highest reuse first
      
    const phase2C = allComponents
      .filter(c => c.transferPhase === '2C')
      .sort((a, b) => a.riskFactors.length - b.riskFactors.length); // Lowest risk first

    this.transferQueue = [
      ...phase2A.map(c => c.id),
      ...phase2B.map(c => c.id),
      ...phase2C.map(c => c.id)
    ];

    this.emit('transferQueueCreated', { 
      totalComponents: this.transferQueue.length,
      phase2A: phase2A.length,
      phase2B: phase2B.length,
      phase2C: phase2C.length
    });

    return this.transferQueue;
  }

  /**
   * Execute component transfer with performance monitoring and fallback support
   */
  async transferComponent(
    componentId: string,
    pclBackend: any,
    targetInterface: string
  ): Promise<TransferResult> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found in complexity assessment`);
    }

    const startTime = Date.now();
    const preTransferBaseline = await this.measurePerformanceBaseline(componentId);

    try {
      // Validate PCL integration readiness
      const pclValidation = await this.validatePCLIntegration(component, pclBackend);
      if (!pclValidation.valid) {
        throw new Error(`PCL integration validation failed: ${pclValidation.errors.join(', ')}`);
      }

      // Execute transfer with appropriate strategy
      const transferSuccess = await this.executeTransferStrategy(
        component,
        pclBackend,
        targetInterface
      );

      // Measure post-transfer performance
      const postTransferPerformance = await this.measurePostTransferPerformance(componentId);
      const performanceDelta = this.calculatePerformanceDelta(preTransferBaseline, postTransferPerformance);

      // Check if rollback is required due to performance degradation
      const rollbackRequired = Math.abs(performanceDelta) > this.performanceThreshold;

      const result: TransferResult = {
        componentId,
        success: transferSuccess && !rollbackRequired,
        performanceMetrics: {
          preTransferBaseline,
          postTransferPerformance,
          performanceDelta
        },
        transferTime: Date.now() - startTime,
        fallbackActivated: false,
        rollbackRequired
      };

      if (rollbackRequired) {
        result.success = false;
        result.error = `Performance degradation ${performanceDelta.toFixed(1)}% exceeds threshold ${this.performanceThreshold}%`;
        await this.executeRollback(componentId, component);
      }

      this.transferResults.set(componentId, result);
      this.emit('transferCompleted', result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Attempt fallback if configured
      let fallbackActivated = false;
      if (component.fallbackStrategy.enabled) {
        fallbackActivated = await this.executeFallback(componentId, component);
      }

      const result: TransferResult = {
        componentId,
        success: false,
        performanceMetrics: {
          preTransferBaseline,
          postTransferPerformance: preTransferBaseline, // No change due to failure
          performanceDelta: 0
        },
        transferTime: Date.now() - startTime,
        error: errorMessage,
        fallbackActivated,
        rollbackRequired: false
      };

      this.transferResults.set(componentId, result);
      this.emit('transferFailed', result);

      return result;
    }
  }

  /**
   * Get transfer strategy validation report
   */
  getValidationReport(): {
    totalComponents: number;
    phaseDistribution: Record<string, number>;
    reuseOpportunities: { menuRegistry: number; commandRegistry: number };
    riskAssessment: Record<string, number>;
    performanceTargets: { responseTime: number; memoryUsage: number };
  } {
    const allComponents = Array.from(this.components.values());
    
    return {
      totalComponents: allComponents.length,
      phaseDistribution: {
        '2A': allComponents.filter(c => c.transferPhase === '2A').length,
        '2B': allComponents.filter(c => c.transferPhase === '2B').length,
        '2C': allComponents.filter(c => c.transferPhase === '2C').length
      },
      reuseOpportunities: {
        menuRegistry: Math.round(allComponents.reduce((sum, c) => 
          c.name.toLowerCase().includes('menu') ? sum + c.pclReusePercentage : sum, 0) / 
          allComponents.filter(c => c.name.toLowerCase().includes('menu')).length || 0
        ),
        commandRegistry: Math.round(allComponents.reduce((sum, c) => 
          c.name.toLowerCase().includes('command') ? sum + c.pclReusePercentage : sum, 0) / 
          allComponents.filter(c => c.name.toLowerCase().includes('command')).length || 0
        )
      },
      riskAssessment: {
        low: allComponents.filter(c => c.complexityScore <= 2).length,
        medium: allComponents.filter(c => c.complexityScore === 3).length,
        high: allComponents.filter(c => c.complexityScore >= 4).length
      },
      performanceTargets: {
        responseTime: 50, // <50ms from Phase 1 requirements
        memoryUsage: 200  // <200MB from Phase 1 requirements
      }
    };
  }

  private calculateBaseComplexity(componentDefinition: any): 1 | 2 | 3 | 4 | 5 {
    let complexity = 1;
    
    // Increase complexity based on component characteristics
    if (componentDefinition.dependencies && componentDefinition.dependencies.length > 3) complexity++;
    if (componentDefinition.hasStateManagement) complexity++;
    if (componentDefinition.requiresUIIntegration) complexity++;
    if (componentDefinition.hasAsyncOperations) complexity++;
    if (componentDefinition.requiresBackendIntegration) complexity++;

    return Math.min(5, complexity) as 1 | 2 | 3 | 4 | 5;
  }

  private calculatePCLReusePercentage(componentDefinition: any): number {
    // Calculate based on PCL pattern compatibility identified in Phase 1
    const menuComponents = ['menu', 'navigation', 'content-converter'];
    const commandComponents = ['command', 'registry', 'router'];
    
    const componentType = componentDefinition.type || componentDefinition.name || '';
    
    if (menuComponents.some(type => componentType.toLowerCase().includes(type))) {
      return 80; // 80% reuse potential identified in Phase 1
    }
    
    if (commandComponents.some(type => componentType.toLowerCase().includes(type))) {
      return 75; // 75% reuse potential identified in Phase 1
    }
    
    return 50; // Default reuse percentage for other components
  }

  private determineTransferPhase(complexity: number): '2A' | '2B' | '2C' {
    if (complexity <= 2) return '2A'; // Low-complexity direct transfers
    if (complexity === 3) return '2B'; // Medium-complexity enhanced transfers
    return '2C'; // High-complexity components with fallback strategies
  }

  private assessRiskFactors(componentDefinition: any, complexity: number): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (complexity >= 4) {
      risks.push({
        type: 'complexity',
        severity: 'high',
        description: 'High complexity component requires careful integration',
        mitigationStrategy: 'Implement comprehensive fallback and monitoring'
      });
    }

    if (componentDefinition.requiresUIIntegration) {
      risks.push({
        type: 'integration',
        severity: 'medium',
        description: 'UI integration may require skin compatibility validation',
        mitigationStrategy: 'Use PCL-Skins universal rendering patterns'
      });
    }

    if (componentDefinition.hasPerformanceCritical) {
      risks.push({
        type: 'performance',
        severity: 'high',
        description: 'Performance-critical component requires continuous monitoring',
        mitigationStrategy: 'Implement real-time performance validation with automatic rollback'
      });
    }

    return risks;
  }

  private createFallbackStrategy(complexity: number): FallbackStrategy {
    return {
      enabled: complexity >= 3, // Enable fallback for medium+ complexity
      rollbackThreshold: this.performanceThreshold,
      fallbackTimeout: complexity * 1000, // Longer timeout for higher complexity
      retryAttempts: Math.max(1, 4 - complexity) // Fewer retries for higher complexity
    };
  }

  private initializeComponentComplexityMap(): void {
    // Pre-populate with known components from Phase 1 analysis
    const knownComponents = [
      { id: 'audit-logger', name: 'Audit Logger', complexity: 1, phase: '2A' },
      { id: 'error-handler', name: 'Error Handler', complexity: 2, phase: '2A' },
      { id: 'menu-content-converter', name: 'Menu Content Converter', complexity: 2, phase: '2A' },
      { id: 'layout-engine', name: 'Layout Engine', complexity: 3, phase: '2B' },
      { id: 'menu-registry', name: 'Menu Registry', complexity: 3, phase: '2B' },
      { id: 'command-registry', name: 'Command Registry', complexity: 3, phase: '2B' },
      { id: 'state-synchronizer', name: 'State Synchronizer', complexity: 4, phase: '2C' },
      { id: 'backend-orchestrator', name: 'Backend Orchestrator', complexity: 5, phase: '2C' }
    ];

    knownComponents.forEach(comp => {
      const complexity: ComponentComplexity = {
        id: comp.id,
        name: comp.name,
        complexityScore: comp.complexity as 1 | 2 | 3 | 4 | 5,
        transferPhase: comp.phase as '2A' | '2B' | '2C',
        pclReusePercentage: comp.name.toLowerCase().includes('menu') ? 80 : 
                           comp.name.toLowerCase().includes('command') ? 75 : 50,
        performanceBaseline: { responseTime: 50, memoryUsage: 10, cpuUsage: 5 },
        dependencies: [],
        riskFactors: this.assessRiskFactors({ name: comp.name }, comp.complexity),
        fallbackStrategy: this.createFallbackStrategy(comp.complexity)
      };
      
      this.components.set(comp.id, complexity);
    });
  }

  private async measurePerformanceBaseline(componentId: string): Promise<number> {
    // Simulate performance measurement
    const startTime = process.hrtime.bigint();
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work
    const endTime = process.hrtime.bigint();
    return Number(endTime - startTime) / 1000000; // Convert to milliseconds
  }

  private async validatePCLIntegration(component: ComponentComplexity, pclBackend: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate PCL compatibility
    if (!pclBackend) {
      errors.push('PCL backend not available');
    }

    // Validate component meets PCL patterns
    if (component.pclReusePercentage < 50) {
      errors.push('Component has low PCL reuse potential');
    }

    // Validate performance requirements
    if (component.performanceBaseline.responseTime > 50) {
      errors.push('Component exceeds <50ms response time requirement');
    }

    return { valid: errors.length === 0, errors };
  }

  private async executeTransferStrategy(
    component: ComponentComplexity,
    pclBackend: any,
    targetInterface: string
  ): Promise<boolean> {
    // Simulate component transfer based on complexity
    const transferTime = component.complexityScore * 100; // Higher complexity = longer transfer
    await new Promise(resolve => setTimeout(resolve, transferTime));

    // Simulate success rate based on complexity (higher complexity = lower success rate)
    const successRate = Math.max(0.6, 1 - (component.complexityScore * 0.1));
    return Math.random() < successRate;
  }

  private async measurePostTransferPerformance(componentId: string): Promise<number> {
    return this.measurePerformanceBaseline(componentId);
  }

  private calculatePerformanceDelta(baseline: number, postTransfer: number): number {
    return ((postTransfer - baseline) / baseline) * 100;
  }

  private async executeRollback(componentId: string, component: ComponentComplexity): Promise<void> {
    this.emit('rollbackInitiated', { componentId, reason: 'Performance degradation' });
    // Simulate rollback operation
    await new Promise(resolve => setTimeout(resolve, component.fallbackStrategy.fallbackTimeout));
    this.emit('rollbackCompleted', { componentId });
  }

  private async executeFallback(componentId: string, component: ComponentComplexity): Promise<boolean> {
    if (!component.fallbackStrategy.enabled) return false;

    this.emit('fallbackInitiated', { componentId });
    
    // Simulate fallback execution
    await new Promise(resolve => setTimeout(resolve, component.fallbackStrategy.fallbackTimeout));
    
    // Simulate fallback success rate
    const fallbackSuccess = Math.random() < 0.8; // 80% fallback success rate
    
    this.emit('fallbackCompleted', { componentId, success: fallbackSuccess });
    return fallbackSuccess;
  }
}
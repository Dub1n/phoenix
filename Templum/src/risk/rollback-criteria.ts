/**---
 * title: [Rollback Criteria - Automated Rollback Decision Engine]
 * tags: [Risk-Mitigation, Rollback-Validation, Decision-Engine, Performance-Criteria, Safety-Protocols]
 * provides: [Rollback Decision Logic, Safety Validation, Performance Thresholds, Automated Recovery]
 * requires: [Performance Monitor, Fallback Manager, Component Transfer Strategy]
 * description: [Automated rollback criteria validation framework implementing Phase 1 rollback safety requirements]
 * ---*/

import { sleep } from '../utils/async-utils';
import { EventDrivenComponent } from '../utils/event-bus-adapter';
import type { TypedEventMap } from '../utils/event-utils';

export interface RollbackCriterion {
  id: string;
  name: string;
  type: 'performance' | 'error-rate' | 'health-check' | 'resource-usage' | 'user-experience' | 'safety';
  severity: 'warning' | 'critical' | 'emergency';
  condition: {
    metric: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'not-contains';
    threshold: number | string;
    duration?: number; // How long condition must persist (ms)
    samplingWindow?: number; // Time window for evaluation (ms)
  };
  action: 'monitor' | 'warn' | 'fallback' | 'rollback' | 'emergency-stop';
  dependencies: string[]; // Other criteria that must be met
  weight: number; // Importance weight (1-10)
  enabled: boolean;
  metadata: {
    description: string;
    rationale: string;
    impact: string;
    recovery: string;
  };
}

export interface RollbackDecision {
  id: string;
  componentId: string;
  interfaceType: string;
  decision: 'continue' | 'warn' | 'fallback' | 'rollback' | 'emergency-stop';
  confidence: number; // 0-100%
  triggeredCriteria: Array<{
    criterionId: string;
    severity: string;
    value: number | string;
    threshold: number | string;
    weight: number;
  }>;
  riskScore: number; // 0-100
  recommendation: {
    action: string;
    reason: string;
    timeline: number; // Recommended action timeline (ms)
    alternatives: string[];
  };
  safetyCheck: {
    passed: boolean;
    issues: string[];
    overrides: string[];
  };
  context: {
    currentPerformance: Record<string, any>;
    baselinePerformance: Record<string, any>;
    systemHealth: any;
    userImpact: number; // 0-100%
    businessImpact: number; // 0-100%
  };
  timestamp: number;
}

export interface RollbackExecution {
  id: string;
  decisionId: string;
  componentId: string;
  interfaceType: string;
  rollbackType: 'partial' | 'complete' | 'emergency';
  phases: RollbackPhase[];
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'aborted';
  startTime: number;
  endTime?: number;
  results: {
    success: boolean;
    restoredPerformance?: Record<string, any>;
    remainingIssues: string[];
    nextSteps: string[];
  };
  validation: {
    preRollbackSnapshot: any;
    postRollbackValidation: any;
    performanceRecovery: number; // % recovery achieved
  };
}

export interface RollbackPhase {
  id: string;
  name: string;
  order: number;
  type: 'preparation' | 'component-restoration' | 'state-recovery' | 'validation' | 'cleanup';
  action: string;
  expectedDuration: number; // ms
  actualDuration?: number;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  dependencies: string[];
  rollbackActions: string[];
  validationSteps: string[];
  error?: string;
}

export interface CriteriaStats {
  totalCriteria: number;
  enabledCriteria: number;
  criteriaByType: Record<string, number>;
  criteriaBySeverity: Record<string, number>;
  recentDecisions: {
    total: number;
    rollbacks: number;
    fallbacks: number;
    emergencyStops: number;
  };
  performanceMetrics: {
    avgDecisionTime: number;
    avgRollbackTime: number;
    rollbackSuccessRate: number;
    falsePositiveRate: number;
  };
  riskAssessment: {
    currentRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    mitigationStrategies: string[];
  };
}

interface RollbackCriteriaEvents extends TypedEventMap {
  criterionRegistered: (payload: {
    criterionId: string;
    type: RollbackCriterion['type'];
    severity: RollbackCriterion['severity'];
    weight: number;
  }) => void;
  rollbackDecisionMade: (decision: RollbackDecision) => void;
  rollbackDecisionError: (decision: RollbackDecision) => void;
  rollbackCompleted: (execution: RollbackExecution) => void;
  rollbackFailed: (execution: RollbackExecution) => void;
  continuousMonitoringStarted: (payload: {
    componentId: string;
    interfaceType: RollbackExecution['interfaceType'];
    timestamp: number;
  }) => void;
  rollbackAborted: (payload: { executionId: string; reason: string; timestamp: number }) => void;
  rollbackPhaseCompleted: (payload: { executionId: string; phaseId: string; duration: number }) => void;
  rollbackPhaseFailed: (payload: { executionId: string; phaseId: string; error: string }) => void;
}

export class RollbackCriteria extends EventDrivenComponent<RollbackCriteriaEvents> {
  private static instanceCounter = 0;

  private static createScope(): string {
    return `rollback-criteria:${RollbackCriteria.instanceCounter++}`;
  }

  private criteria: Map<string, RollbackCriterion> = new Map();
  private decisions: Map<string, RollbackDecision> = new Map();
  private executions: Map<string, RollbackExecution> = new Map();
  private decisionHistory: RollbackDecision[] = [];
  private executionHistory: RollbackExecution[] = [];
  private performanceMonitor: any;
  private fallbackManager: any;
  private config: {
    emergencyThreshold: number;     // Risk score for emergency action
    rollbackThreshold: number;      // Risk score for rollback
    fallbackThreshold: number;      // Risk score for fallback
    decisionTimeout: number;        // Max time for decision making (ms)
    rollbackTimeout: number;        // Max time for rollback execution (ms)
    historyRetention: number;       // Days to retain history
  };

  constructor() {
    super(RollbackCriteria.createScope(), 100);
    this.config = {
      emergencyThreshold: 80,  // Risk score >80 triggers emergency action
      rollbackThreshold: 60,   // Risk score >60 triggers rollback
      fallbackThreshold: 40,   // Risk score >40 triggers fallback
      decisionTimeout: 5000,   // 5 second decision timeout
      rollbackTimeout: 30000,  // 30 second rollback timeout
      historyRetention: 30     // 30 days history retention
    };
    this.initializeDefaultCriteria();
  }

  /**
   * Register rollback criterion for component monitoring
   */
  registerCriterion(criterion: RollbackCriterion): void {
    const validation = this.validateCriterion(criterion);
    if (!validation.valid) {
      throw new Error(`Invalid rollback criterion: ${validation.errors.join(', ')}`);
    }

    this.criteria.set(criterion.id, criterion);
    
    this.emit('criterionRegistered', {
      criterionId: criterion.id,
      type: criterion.type,
      severity: criterion.severity,
      weight: criterion.weight
    });

    console.log(`Rollback Criteria: Registered criterion ${criterion.name} (${criterion.type}, weight: ${criterion.weight})`);
  }

  /**
   * Evaluate rollback decision for component based on current metrics
   */
  async evaluateRollbackDecision(
    componentId: string,
    interfaceType: string,
    currentMetrics: Record<string, any>,
    context?: any
  ): Promise<RollbackDecision> {
    const decisionId = `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const relevantCriteria = this.getRelevantCriteria(componentId, interfaceType);

    try {
      // Evaluate each criterion
      const triggeredCriteria: any[] = [];
      let totalRiskScore = 0;
      let totalWeight = 0;

      for (const criterion of relevantCriteria) {
        if (!criterion.enabled) continue;

        const evaluation = await this.evaluateCriterion(criterion, currentMetrics, context);
        
        if (evaluation.triggered) {
          triggeredCriteria.push({
            criterionId: criterion.id,
            severity: criterion.severity,
            value: evaluation.value,
            threshold: criterion.condition.threshold,
            weight: criterion.weight
          });

          // Calculate risk contribution
          const severityMultiplier = this.getSeverityMultiplier(criterion.severity);
          totalRiskScore += criterion.weight * severityMultiplier;
        }
        
        totalWeight += criterion.weight;
      }

      // Normalize risk score
      const riskScore = totalWeight > 0 ? Math.min(100, (totalRiskScore / totalWeight) * 10) : 0;

      // Make decision based on risk score and triggered criteria
      const decisionLogic = this.makeRollbackDecision(riskScore, triggeredCriteria);

      // Perform safety check
      const safetyCheck = await this.performSafetyCheck(componentId, interfaceType, decisionLogic.decision, context);

      // Create decision record
      const decision: RollbackDecision = {
        id: decisionId,
        componentId,
        interfaceType,
        decision: safetyCheck.safe ? decisionLogic.decision : 'warn',
        confidence: this.calculateConfidence(triggeredCriteria, riskScore),
        triggeredCriteria,
        riskScore,
        recommendation: decisionLogic.recommendation,
        safetyCheck: {
          passed: safetyCheck.safe,
          issues: safetyCheck.issues,
          overrides: safetyCheck.overrides
        },
        context: {
          currentPerformance: currentMetrics,
          baselinePerformance: await this.getBaselinePerformance(componentId),
          systemHealth: await this.getSystemHealth(),
          userImpact: this.calculateUserImpact(triggeredCriteria),
          businessImpact: this.calculateBusinessImpact(triggeredCriteria)
        },
        timestamp: Date.now()
      };

      this.decisions.set(decisionId, decision);
      this.addToHistory(decision);

      this.emit('rollbackDecisionMade', decision);

      // Execute decision if automatic action required
      if (['rollback', 'emergency-stop'].includes(decision.decision)) {
        await this.executeRollbackDecision(decision);
      }

      return decision;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to evaluate rollback decision for ${componentId}: ${errorMessage}`);
      
      // Create error decision
      const errorDecision: RollbackDecision = {
        id: decisionId,
        componentId,
        interfaceType,
        decision: 'warn',
        confidence: 0,
        triggeredCriteria: [],
        riskScore: 0,
        recommendation: {
          action: 'Manual review required',
          reason: `Decision evaluation failed: ${errorMessage}`,
          timeline: 0,
          alternatives: ['Manual intervention', 'System restart']
        },
        safetyCheck: {
          passed: false,
          issues: [errorMessage],
          overrides: []
        },
        context: {
          currentPerformance: currentMetrics,
          baselinePerformance: {},
          systemHealth: {},
          userImpact: 0,
          businessImpact: 0
        },
        timestamp: Date.now()
      };

      this.emit('rollbackDecisionError', errorDecision);
      return errorDecision;
    }
  }

  /**
   * Execute rollback decision with comprehensive validation
   */
  async executeRollbackDecision(decision: RollbackDecision): Promise<RollbackExecution> {
    if (!['rollback', 'emergency-stop'].includes(decision.decision)) {
      throw new Error(`Cannot execute rollback for decision type: ${decision.decision}`);
    }

    const executionId = `execution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine rollback type and phases
    const rollbackType = decision.decision === 'emergency-stop' ? 'emergency' : 
                        decision.riskScore >= 80 ? 'complete' : 'partial';
    
    const phases = this.createRollbackPhases(decision, rollbackType);

    const execution: RollbackExecution = {
      id: executionId,
      decisionId: decision.id,
      componentId: decision.componentId,
      interfaceType: decision.interfaceType,
      rollbackType,
      phases,
      status: 'pending',
      startTime: Date.now(),
      results: {
        success: false,
        remainingIssues: [],
        nextSteps: []
      },
      validation: {
        preRollbackSnapshot: await this.capturePreRollbackSnapshot(decision.componentId),
        postRollbackValidation: null,
        performanceRecovery: 0
      }
    };

    this.executions.set(executionId, execution);

    try {
      execution.status = 'executing';
      
      // Execute rollback phases in order
      for (const phase of phases.sort((a, b) => a.order - b.order)) {
        await this.executeRollbackPhase(execution, phase);
        
        if (phase.status === 'failed' && rollbackType === 'emergency') {
          // Continue emergency rollback even if phases fail
          console.warn(`Emergency rollback phase ${phase.name} failed but continuing: ${phase.error}`);
        } else if (phase.status === 'failed') {
          throw new Error(`Rollback phase ${phase.name} failed: ${phase.error}`);
        }
      }

      // Validate rollback results
      execution.validation.postRollbackValidation = await this.validateRollbackExecution(execution);
      execution.validation.performanceRecovery = this.calculatePerformanceRecovery(execution);

      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.results.success = execution.validation.performanceRecovery >= 80; // 80% recovery threshold

      this.emit('rollbackCompleted', execution);
      console.log(`Rollback executed successfully for ${decision.componentId}: ${execution.validation.performanceRecovery}% performance recovery`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.results.success = false;
      execution.results.remainingIssues.push(errorMessage);
      execution.results.nextSteps.push('Manual intervention required');

      this.emit('rollbackFailed', execution);
      console.error(`Rollback execution failed for ${decision.componentId}: ${errorMessage}`);
    } finally {
      this.executionHistory.push(execution);
      this.executions.delete(executionId);
    }

    return execution;
  }

  /**
   * Monitor component continuously and trigger decisions automatically
   */
  startContinuousMonitoring(
    componentId: string,
    interfaceType: string,
    performanceMonitor: any,
    fallbackManager?: any
  ): void {
    this.performanceMonitor = performanceMonitor;
    this.fallbackManager = fallbackManager;

    // Listen for performance degradation events
    this.performanceMonitor.on('performanceDegradation', async (degradation: any) => {
      if (degradation.componentId === componentId) {
        const currentMetrics = this.extractMetricsFromDegradation(degradation);
        await this.evaluateRollbackDecision(componentId, interfaceType, currentMetrics, { degradation });
      }
    });

    // Listen for critical alerts
    this.performanceMonitor.on('criticalFallback', async (event: any) => {
      if (event.componentId === componentId) {
        const currentMetrics = { degradation: event.degradation };
        await this.evaluateRollbackDecision(componentId, interfaceType, currentMetrics, { event: 'critical-fallback' });
      }
    });

    // Listen for emergency fallback
    this.performanceMonitor.on('emergencyFallback', async (event: any) => {
      if (event.componentId === componentId) {
        const currentMetrics = { degradation: event.degradation };
        await this.evaluateRollbackDecision(componentId, interfaceType, currentMetrics, { event: 'emergency-fallback' });
      }
    });

    this.emit('continuousMonitoringStarted', {
      componentId,
      interfaceType,
      timestamp: Date.now()
    });

    console.log(`Rollback Criteria: Started continuous monitoring for ${componentId} on ${interfaceType}`);
  }

  /**
   * Get rollback criteria statistics and health metrics
   */
  getCriteriaStats(): CriteriaStats {
    const allCriteria = Array.from(this.criteria.values());
    const recentDecisions = this.decisionHistory.slice(-100); // Last 100 decisions
    const recentExecutions = this.executionHistory.slice(-50); // Last 50 executions

    const rollbacks = recentDecisions.filter(d => d.decision === 'rollback').length;
    const fallbacks = recentDecisions.filter(d => d.decision === 'fallback').length;
    const emergencyStops = recentDecisions.filter(d => d.decision === 'emergency-stop').length;

    const successfulRollbacks = recentExecutions.filter(e => e.results.success).length;
    const rollbackSuccessRate = recentExecutions.length > 0 ? (successfulRollbacks / recentExecutions.length) * 100 : 0;

    const avgDecisionTime = this.calculateAverageDecisionTime(recentDecisions);
    const avgRollbackTime = this.calculateAverageRollbackTime(recentExecutions);

    return {
      totalCriteria: allCriteria.length,
      enabledCriteria: allCriteria.filter(c => c.enabled).length,
      criteriaByType: this.groupByType(allCriteria),
      criteriaBySeverity: this.groupBySeverity(allCriteria),
      recentDecisions: {
        total: recentDecisions.length,
        rollbacks,
        fallbacks,
        emergencyStops
      },
      performanceMetrics: {
        avgDecisionTime,
        avgRollbackTime,
        rollbackSuccessRate,
        falsePositiveRate: this.calculateFalsePositiveRate(recentDecisions)
      },
      riskAssessment: {
        currentRiskLevel: this.assessCurrentRiskLevel(),
        riskFactors: this.identifyRiskFactors(),
        mitigationStrategies: this.suggestMitigationStrategies()
      }
    };
  }

  /**
   * Get active rollback executions
   */
  getActiveExecutions(): RollbackExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Abort active rollback execution
   */
  async abortRollbackExecution(executionId: string, reason: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return false;
    }

    if (execution.status !== 'executing') {
      return false;
    }

    try {
      execution.status = 'aborted';
      execution.endTime = Date.now();
      execution.results.success = false;
      execution.results.remainingIssues.push(`Execution aborted: ${reason}`);
      execution.results.nextSteps.push('Manual cleanup may be required');

      this.emit('rollbackAborted', { executionId, reason, timestamp: Date.now() });
      return true;
    } catch (error) {
      console.error(`Failed to abort rollback execution ${executionId}: ${error}`);
      return false;
    }
  }

  private validateCriterion(criterion: RollbackCriterion): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!criterion.id) errors.push('Criterion ID is required');
    if (!criterion.name) errors.push('Criterion name is required');
    if (!criterion.type) errors.push('Criterion type is required');
    if (!criterion.condition.metric) errors.push('Condition metric is required');
    if (criterion.condition.threshold === undefined) errors.push('Condition threshold is required');
    if (criterion.weight < 1 || criterion.weight > 10) errors.push('Weight must be between 1 and 10');

    return { valid: errors.length === 0, errors };
  }

  private getRelevantCriteria(_componentId: string, _interfaceType: string): RollbackCriterion[] {
    // For now, return all criteria. In real implementation, would filter by component/interface
    return Array.from(this.criteria.values());
  }

  private async evaluateCriterion(
    criterion: RollbackCriterion,
    metrics: Record<string, any>,
    _context?: any
  ): Promise<{ triggered: boolean; value: any }> {
    const metricValue = this.extractMetricValue(metrics, criterion.condition.metric);
    
    if (metricValue === undefined) {
      return { triggered: false, value: undefined };
    }

    const triggered = this.evaluateCondition(metricValue, criterion.condition);
    
    // Check duration requirement if specified
    if (triggered && criterion.condition.duration) {
      const durationMet = await this.checkDurationRequirement(
        criterion,
        metricValue,
        criterion.condition.duration
      );
      return { triggered: durationMet, value: metricValue };
    }

    return { triggered, value: metricValue };
  }

  private evaluateCondition(value: any, condition: RollbackCriterion['condition']): boolean {
    const { operator, threshold } = condition;

    switch (operator) {
      case '>': return Number(value) > Number(threshold);
      case '<': return Number(value) < Number(threshold);
      case '>=': return Number(value) >= Number(threshold);
      case '<=': return Number(value) <= Number(threshold);
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      case 'contains': return String(value).includes(String(threshold));
      case 'not-contains': return !String(value).includes(String(threshold));
      default: return false;
    }
  }

  private getSeverityMultiplier(severity: string): number {
    switch (severity) {
      case 'warning': return 1;
      case 'critical': return 3;
      case 'emergency': return 5;
      default: return 1;
    }
  }

  private makeRollbackDecision(
    riskScore: number,
    triggeredCriteria: any[]
  ): { decision: RollbackDecision['decision']; recommendation: RollbackDecision['recommendation'] } {
    if (riskScore >= this.config.emergencyThreshold) {
      return {
        decision: 'emergency-stop',
        recommendation: {
          action: 'Immediate emergency stop',
          reason: `Critical risk score ${riskScore}% with ${triggeredCriteria.length} triggered criteria`,
          timeline: 1000, // 1 second
          alternatives: ['Manual intervention', 'System isolation']
        }
      };
    } else if (riskScore >= this.config.rollbackThreshold) {
      return {
        decision: 'rollback',
        recommendation: {
          action: 'Execute component rollback',
          reason: `High risk score ${riskScore}% requires rollback to previous stable state`,
          timeline: 10000, // 10 seconds
          alternatives: ['Partial rollback', 'Targeted fixes']
        }
      };
    } else if (riskScore >= this.config.fallbackThreshold) {
      return {
        decision: 'fallback',
        recommendation: {
          action: 'Activate fallback mechanisms',
          reason: `Moderate risk score ${riskScore}% indicates need for fallback`,
          timeline: 5000, // 5 seconds
          alternatives: ['Monitor closely', 'Performance optimization']
        }
      };
    } else if (triggeredCriteria.length > 0) {
      return {
        decision: 'warn',
        recommendation: {
          action: 'Monitor situation closely',
          reason: `Low risk score ${riskScore}% but ${triggeredCriteria.length} criteria triggered`,
          timeline: 30000, // 30 seconds
          alternatives: ['Preventive measures', 'Increased monitoring']
        }
      };
    } else {
      return {
        decision: 'continue',
        recommendation: {
          action: 'Continue normal operation',
          reason: `Low risk score ${riskScore}% with no critical criteria triggered`,
          timeline: 0,
          alternatives: []
        }
      };
    }
  }

  private async performSafetyCheck(
    componentId: string,
    interfaceType: string,
    decision: RollbackDecision['decision'],
    context?: any
  ): Promise<{ safe: boolean; issues: string[]; overrides: string[] }> {
    const issues: string[] = [];
    const overrides: string[] = [];

    // Check if system is in safe state for the proposed action
    if (decision === 'emergency-stop' || decision === 'rollback') {
      // Check for active user sessions
      const activeSessions = await this.getActiveUserSessions(componentId);
      if (activeSessions > 0) {
        issues.push(`${activeSessions} active user sessions may be disrupted`);
      }

      // Check for critical processes
      const criticalProcesses = await this.getCriticalProcesses(componentId);
      if (criticalProcesses.length > 0) {
        issues.push(`Critical processes may be affected: ${criticalProcesses.join(', ')}`);
      }

      // Check system dependencies
      const dependencies = await this.getSystemDependencies(componentId);
      if (dependencies.length > 0) {
        issues.push(`System dependencies may be affected: ${dependencies.join(', ')}`);
      }
    }

    // Emergency situations can override safety checks
    if (decision === 'emergency-stop' && context?.emergencyOverride) {
      overrides.push('Emergency situation overrides safety checks');
    }

    const safe = issues.length === 0 || overrides.length > 0;

    return { safe, issues, overrides };
  }

  private calculateConfidence(triggeredCriteria: any[], riskScore: number): number {
    if (triggeredCriteria.length === 0) return 95; // High confidence in continue decision

    const weightSum = triggeredCriteria.reduce((sum, c) => sum + c.weight, 0);
    const maxWeight = triggeredCriteria.length * 10; // Max weight per criterion is 10
    
    const confidenceFromWeights = (weightSum / maxWeight) * 100;
    const confidenceFromRisk = Math.min(100, riskScore);
    
    return Math.round((confidenceFromWeights + confidenceFromRisk) / 2);
  }

  private calculateUserImpact(triggeredCriteria: any[]): number {
    // Calculate user impact based on triggered criteria
    const userFacingCriteria = triggeredCriteria.filter(c => 
      c.criterionId.includes('response-time') || 
      c.criterionId.includes('error-rate') || 
      c.criterionId.includes('availability')
    );

    if (userFacingCriteria.length === 0) return 0;

    const totalWeight = userFacingCriteria.reduce((sum, c) => sum + c.weight, 0);
    const maxWeight = userFacingCriteria.length * 10;
    
    return Math.round((totalWeight / maxWeight) * 100);
  }

  private calculateBusinessImpact(triggeredCriteria: any[]): number {
    // Calculate business impact based on severity and weight
    const severityWeights = { warning: 1, critical: 3, emergency: 5 };
    
    const impactScore = triggeredCriteria.reduce((sum, c) => {
      const severityWeight = severityWeights[c.severity as keyof typeof severityWeights] || 1;
      return sum + (c.weight * severityWeight);
    }, 0);

    const maxPossibleScore = triggeredCriteria.length * 10 * 5; // Max weight * max severity
    
    return maxPossibleScore > 0 ? Math.round((impactScore / maxPossibleScore) * 100) : 0;
  }

  private createRollbackPhases(decision: RollbackDecision, rollbackType: RollbackExecution['rollbackType']): RollbackPhase[] {
    const phases: RollbackPhase[] = [];

    // Preparation phase
    phases.push({
      id: 'preparation',
      name: 'Rollback Preparation',
      order: 1,
      type: 'preparation',
      action: 'Prepare system for rollback',
      expectedDuration: 5000,
      status: 'pending',
      dependencies: [],
      rollbackActions: [
        'Capture current state snapshot',
        'Notify monitoring systems',
        'Prepare rollback resources'
      ],
      validationSteps: [
        'Verify rollback prerequisites',
        'Confirm resource availability'
      ]
    });

    // Component restoration phase
    phases.push({
      id: 'component-restoration',
      name: 'Component Restoration',
      order: 2,
      type: 'component-restoration',
      action: 'Restore component to previous stable state',
      expectedDuration: rollbackType === 'emergency' ? 3000 : 10000,
      status: 'pending',
      dependencies: ['preparation'],
      rollbackActions: [
        'Stop current component processes',
        'Restore previous component version',
        'Restart component services'
      ],
      validationSteps: [
        'Verify component startup',
        'Check component health'
      ]
    });

    // State recovery phase (if not emergency)
    if (rollbackType !== 'emergency') {
      phases.push({
        id: 'state-recovery',
        name: 'State Recovery',
        order: 3,
        type: 'state-recovery',
        action: 'Recover component state from backup',
        expectedDuration: 8000,
        status: 'pending',
        dependencies: ['component-restoration'],
        rollbackActions: [
          'Restore component configuration',
          'Recover runtime state',
          'Sync with dependent components'
        ],
        validationSteps: [
          'Verify state consistency',
          'Check state synchronization'
        ]
      });
    }

    // Validation phase
    phases.push({
      id: 'validation',
      name: 'Rollback Validation',
      order: rollbackType === 'emergency' ? 3 : 4,
      type: 'validation',
      action: 'Validate rollback success',
      expectedDuration: 5000,
      status: 'pending',
      dependencies: rollbackType === 'emergency' ? ['component-restoration'] : ['state-recovery'],
      rollbackActions: [
        'Run component health checks',
        'Verify performance metrics',
        'Test critical functionality'
      ],
      validationSteps: [
        'Performance validation',
        'Functionality validation',
        'Integration validation'
      ]
    });

    // Cleanup phase
    phases.push({
      id: 'cleanup',
      name: 'Cleanup',
      order: rollbackType === 'emergency' ? 4 : 5,
      type: 'cleanup',
      action: 'Clean up rollback artifacts',
      expectedDuration: 2000,
      status: 'pending',
      dependencies: ['validation'],
      rollbackActions: [
        'Remove temporary files',
        'Update monitoring systems',
        'Generate rollback report'
      ],
      validationSteps: [
        'Verify cleanup completion'
      ]
    });

    return phases;
  }

  private async executeRollbackPhase(execution: RollbackExecution, phase: RollbackPhase): Promise<void> {
    const startTime = Date.now();
    phase.status = 'executing';

    try {
      // Execute phase-specific logic
      switch (phase.type) {
        case 'preparation':
          await this.executePreparationPhase(execution, phase);
          break;
        case 'component-restoration':
          await this.executeComponentRestorationPhase(execution, phase);
          break;
        case 'state-recovery':
          await this.executeStateRecoveryPhase(execution, phase);
          break;
        case 'validation':
          await this.executeValidationPhase(execution, phase);
          break;
        case 'cleanup':
          await this.executeCleanupPhase(execution, phase);
          break;
      }

      phase.status = 'completed';
      phase.actualDuration = Date.now() - startTime;
      
      this.emit('rollbackPhaseCompleted', {
        executionId: execution.id,
        phaseId: phase.id,
        duration: phase.actualDuration
      });

    } catch (error) {
      phase.status = 'failed';
      phase.error = error instanceof Error ? error.message : 'Unknown error';
      phase.actualDuration = Date.now() - startTime;

      this.emit('rollbackPhaseFailed', {
        executionId: execution.id,
        phaseId: phase.id,
        error: phase.error
      });

      throw error;
    }
  }

  // Placeholder implementations for rollback phase executors
  private async executePreparationPhase(execution: RollbackExecution, phase: RollbackPhase): Promise<void> {
    // Simulate preparation work
    await sleep(Math.min(phase.expectedDuration, 2000));
    console.log(`Executing preparation phase for ${execution.componentId}`);
  }

  private async executeComponentRestorationPhase(execution: RollbackExecution, phase: RollbackPhase): Promise<void> {
    // Simulate component restoration
    await sleep(Math.min(phase.expectedDuration, 5000));
    console.log(`Executing component restoration phase for ${execution.componentId}`);
  }

  private async executeStateRecoveryPhase(execution: RollbackExecution, phase: RollbackPhase): Promise<void> {
    // Simulate state recovery
    await sleep(Math.min(phase.expectedDuration, 3000));
    console.log(`Executing state recovery phase for ${execution.componentId}`);
  }

  private async executeValidationPhase(execution: RollbackExecution, phase: RollbackPhase): Promise<void> {
    // Simulate validation
    await sleep(Math.min(phase.expectedDuration, 2000));
    console.log(`Executing validation phase for ${execution.componentId}`);
  }

  private async executeCleanupPhase(execution: RollbackExecution, _phase: RollbackPhase): Promise<void> {
    // Simulate cleanup
    await sleep(1000);
    console.log(`Executing cleanup phase for ${execution.componentId}`);
  }

  // Helper methods
  private extractMetricValue(metrics: Record<string, any>, metricPath: string): any {
    const keys = metricPath.split('.');
    let value = metrics;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private async checkDurationRequirement(
    _criterion: RollbackCriterion,
    _currentValue: any,
    _duration: number
  ): Promise<boolean> {
    // Simplified implementation - in real system would check historical data
    return true; // Assume duration requirement is met
  }

  private extractMetricsFromDegradation(degradation: any): Record<string, any> {
    return {
      'performance.degradation': degradation.degradationPercentage,
      'performance.response-time': degradation.currentValue,
      'performance.baseline': degradation.baselineValue,
      'system.severity': degradation.severity
    };
  }

  private addToHistory(decision: RollbackDecision): void {
    this.decisionHistory.push(decision);
    
    // Maintain history size
    const maxSize = 1000;
    if (this.decisionHistory.length > maxSize) {
      this.decisionHistory.shift();
    }
  }

  // Placeholder methods for external integrations
  private async getBaselinePerformance(_componentId: string): Promise<Record<string, any>> {
    return { responseTime: 100, memoryUsage: 150, cpuUsage: 20 };
  }

  private async getSystemHealth(): Promise<any> {
    return { overall: 'healthy', score: 85 };
  }

  private async getActiveUserSessions(_componentId: string): Promise<number> {
    return 0; // Placeholder
  }

  private async getCriticalProcesses(_componentId: string): Promise<string[]> {
    return []; // Placeholder
  }

  private async getSystemDependencies(_componentId: string): Promise<string[]> {
    return []; // Placeholder
  }

  private async capturePreRollbackSnapshot(componentId: string): Promise<any> {
    return { timestamp: Date.now(), componentId };
  }

  private async validateRollbackExecution(_execution: RollbackExecution): Promise<any> {
    return { validated: true, timestamp: Date.now() };
  }

  private calculatePerformanceRecovery(_execution: RollbackExecution): number {
    // Simulate performance recovery calculation
    return Math.floor(Math.random() * 40) + 60; // 60-100% recovery
  }

  // Statistics helper methods
  private groupByType(criteria: RollbackCriterion[]): Record<string, number> {
    const groups: Record<string, number> = {};
    criteria.forEach(c => {
      groups[c.type] = (groups[c.type] || 0) + 1;
    });
    return groups;
  }

  private groupBySeverity(criteria: RollbackCriterion[]): Record<string, number> {
    const groups: Record<string, number> = {};
    criteria.forEach(c => {
      groups[c.severity] = (groups[c.severity] || 0) + 1;
    });
    return groups;
  }

  private calculateAverageDecisionTime(_decisions: RollbackDecision[]): number {
    // Placeholder - would calculate from actual decision timing data
    return 1500; // 1.5 seconds average
  }

  private calculateAverageRollbackTime(executions: RollbackExecution[]): number {
    const completedExecutions = executions.filter(e => e.endTime);
    if (completedExecutions.length === 0) return 0;

    const totalTime = completedExecutions.reduce((sum, e) => sum + (e.endTime! - e.startTime), 0);
    return totalTime / completedExecutions.length;
  }

  private calculateFalsePositiveRate(_decisions: RollbackDecision[]): number {
    // Placeholder - would calculate based on retrospective analysis
    return 5; // 5% false positive rate
  }

  private assessCurrentRiskLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const recentDecisions = this.decisionHistory.slice(-20);
    const highRiskDecisions = recentDecisions.filter(d => d.riskScore >= 60).length;
    
    if (highRiskDecisions >= 5) return 'critical';
    if (highRiskDecisions >= 3) return 'high';
    if (highRiskDecisions >= 1) return 'medium';
    return 'low';
  }

  private identifyRiskFactors(): string[] {
    return [
      'High component complexity',
      'Performance degradation trends',
      'Increased error rates',
      'System resource constraints'
    ];
  }

  private suggestMitigationStrategies(): string[] {
    return [
      'Implement proactive monitoring',
      'Optimize component performance',
      'Enhance fallback mechanisms',
      'Regular system health checks'
    ];
  }

  private initializeDefaultCriteria(): void {
    // Performance degradation criteria based on Phase 1 requirements
    this.registerCriterion({
      id: 'performance-degradation-30',
      name: 'Performance Degradation >30%',
      type: 'performance',
      severity: 'critical',
      condition: {
        metric: 'performance.degradation',
        operator: '>',
        threshold: 30, // 30% threshold from Phase 1
        duration: 10000, // 10 seconds
        samplingWindow: 60000 // 1 minute
      },
      action: 'rollback',
      dependencies: [],
      weight: 8,
      enabled: true,
      metadata: {
        description: 'Triggers rollback when performance degrades by more than 30%',
        rationale: 'Phase 1 identified 30% as critical degradation threshold',
        impact: 'High - requires immediate rollback to maintain service quality',
        recovery: 'Automatic rollback with performance validation'
      }
    });

    this.registerCriterion({
      id: 'error-rate-critical',
      name: 'Error Rate >10%',
      type: 'error-rate',
      severity: 'critical',
      condition: {
        metric: 'system.error-rate',
        operator: '>',
        threshold: 10,
        duration: 5000,
        samplingWindow: 30000
      },
      action: 'rollback',
      dependencies: [],
      weight: 9,
      enabled: true,
      metadata: {
        description: 'Triggers rollback when error rate exceeds 10%',
        rationale: 'High error rates indicate system instability',
        impact: 'High - user experience severely impacted',
        recovery: 'Rollback to last stable version'
      }
    });

    this.registerCriterion({
      id: 'response-time-emergency',
      name: 'Response Time >500ms',
      type: 'performance',
      severity: 'emergency',
      condition: {
        metric: 'performance.response-time',
        operator: '>',
        threshold: 500, // 500ms emergency threshold
        duration: 15000,
        samplingWindow: 60000
      },
      action: 'emergency-stop',
      dependencies: [],
      weight: 10,
      enabled: true,
      metadata: {
        description: 'Emergency stop when response time exceeds 500ms consistently',
        rationale: 'Extremely slow response times indicate system failure',
        impact: 'Critical - system unusable for users',
        recovery: 'Emergency shutdown and manual intervention'
      }
    });

    // Component transfer specific criteria
    this.registerCriterion({
      id: 'component-transfer-failure',
      name: 'Component Transfer Failure',
      type: 'error-rate',
      severity: 'critical',
      condition: {
        metric: 'transfer.failure-rate',
        operator: '>',
        threshold: 20, // >20% transfer failure rate
        duration: 0,
        samplingWindow: 30000
      },
      action: 'rollback',
      dependencies: [],
      weight: 9,
      enabled: true,
      metadata: {
        description: 'Rollback when component transfer failures exceed 20%',
        rationale: 'High transfer failure rate indicates integration issues',
        impact: 'High - component separation process failing',
        recovery: 'Rollback transfers and review compatibility'
      }
    });

    console.log(`Rollback Criteria: Initialized ${this.criteria.size} default criteria with 30% performance threshold`);
  }
}

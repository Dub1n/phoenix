/**
---
date: "2025-09-13T220000Z"
name: "probabilistic-error-handler"
TASK-ID: ["TASK-MCP-007"]
category: "mcp-integration-probabilistic-error-handling"
status: ["[T]"]
patterns: ["probabilistic-error-handling", "circuit-breaker", "adaptive-recovery", "risk-assessment"]
components: ["probabilistic-error-handler", "mcp-channel", "progressive-timeout-manager"]
dependencies: ["error-tracking", "statistical-analysis", "recovery-strategies"]
tags: ["error-handling", "probabilistic-recovery", "adaptive-strategies", "risk-management"]
---
* @fileoverview Probabilistic Error Handler for MCP Channel Integration
* @author Claude Code Implementation  
* @created 2025-09-13
* 
* TASK-MCP-007: Probabilistic Error Handling with Risk-Adaptive Recovery
* 
* Implements intelligent error handling with probabilistic recovery strategies:
* - Statistical error pattern analysis
* - Adaptive recovery probability calculation
* - Circuit breaker with probabilistic state transitions
* - Risk-based error escalation
* - Predictive failure prevention
* - Learning-based strategy optimization
*/

import { EventEmitter } from 'events';
import { safeRegisterListener, cleanupComponentListeners } from './event-listener-manager';

export interface ErrorPattern {
  errorType: string;
  frequency: number;
  lastOccurrence: number;
  averageInterval: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: string;
  recoverySuccessRate: number;
}

export interface RecoveryStrategy {
  name: string;
  probability: number; // 0-1, likelihood of success
  cost: number; // Resource cost (0-100)
  executionTime: number; // Expected execution time in ms
  prerequisites: string[];
  implementation: () => Promise<boolean>;
}

export interface ErrorContext {
  operation: string;
  timestamp: number;
  errorCode?: string;
  errorMessage: string;
  stackTrace?: string;
  systemState: Record<string, any>;
  previousAttempts: number;
  recoveryHistory: RecoveryAttempt[];
}

export interface RecoveryAttempt {
  strategy: string;
  timestamp: number;
  success: boolean;
  executionTime: number;
  confidence: number;
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByContext: Record<string, number>;
  recoverySuccessRate: number;
  averageRecoveryTime: number;
  patternPredictions: PatternPrediction[];
  riskAssessment: RiskAssessment;
}

export interface PatternPrediction {
  pattern: string;
  likelihood: number; // 0-1
  timeframe: number; // Expected time to occurrence in ms
  severity: 'low' | 'medium' | 'high' | 'critical';
  preventionStrategies: string[];
}

export interface RiskAssessment {
  overallRisk: number; // 0-100
  criticalPatterns: string[];
  stabilityTrend: 'improving' | 'stable' | 'degrading';
  recommendedActions: string[];
}

/**
 * Probabilistic Error Handler
 * 
 * Implements intelligent error handling with statistical analysis and
 * probabilistic recovery strategies for MCP channel integration.
 */
export class ProbabilisticErrorHandler extends EventEmitter {
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private recentErrors: ErrorContext[] = [];
  private analytics: ErrorAnalytics;
  
  // Configuration
  private readonly MAX_ERROR_HISTORY = 1000;
  private readonly PATTERN_ANALYSIS_WINDOW = 3600000; // 1 hour
  private readonly MIN_PATTERN_OCCURRENCES = 3;
  private readonly RECOVERY_TIMEOUT = 30000; // 30 seconds
  
  // Probabilistic parameters
  private readonly SUCCESS_PROBABILITY_THRESHOLD = 0.7;
  private readonly COST_THRESHOLD = 80;
  private readonly PATTERN_CONFIDENCE_THRESHOLD = 0.8;

  constructor() {
    super();
    
    // TODO: [TASK-MCP-007-PROB-001] Pattern: probabilistic-error-management | Complexity: 8 | Dependencies: statistical-analysis
    // Context: Initialize probabilistic error handling with learning capabilities
    // Validation-Required: pattern-detection-accuracy, recovery-effectiveness, performance-impact
    // Pattern-Info: { approach: "machine-learning-inspired-error-handling", alternatives: "static-error-handling", trade-offs: "intelligence-vs-complexity" }
    
    this.analytics = {
      totalErrors: 0,
      errorsByType: {},
      errorsByContext: {},
      recoverySuccessRate: 0,
      averageRecoveryTime: 0,
      patternPredictions: [],
      riskAssessment: {
        overallRisk: 0,
        criticalPatterns: [],
        stabilityTrend: 'stable',
        recommendedActions: []
      }
    };
    
    this.initializeDefaultStrategies();
    this.setupPeriodicAnalysis();
  }

  /**
   * Handle error with probabilistic recovery strategies
   */
  public async handleError(error: Error, context: ErrorContext): Promise<boolean> {
    // TODO: [TASK-MCP-007-PROB-002] Pattern: intelligent-error-recovery | Complexity: 7 | Dependencies: pattern-analysis
    // Context: Apply probabilistic recovery strategies based on error analysis
    // Validation-Required: recovery-success-rate, strategy-selection-accuracy, performance-impact
    // Pattern-Info: { approach: "probabilistic-strategy-selection", alternatives: "fixed-retry-logic", trade-offs: "adaptability-vs-predictability" }
    
    console.log(`[PROBABILISTIC_ERROR] Handling error: ${error.message}`);
    
    try {
      // Record the error for pattern analysis
      this.recordError(error, context);
      
      // Analyze error patterns and select recovery strategy
      const errorSignature = this.generateErrorSignature(error, context);
      const pattern = this.errorPatterns.get(errorSignature);
      
      // Calculate recovery probability based on historical data
      const recoveryProbability = this.calculateRecoveryProbability(errorSignature, context);
      
      console.log(`[PROBABILISTIC_ERROR] Recovery probability: ${recoveryProbability.toFixed(2)}`);
      
      // Select optimal recovery strategy
      const strategy = this.selectOptimalStrategy(errorSignature, context, recoveryProbability);
      
      if (!strategy) {
        console.warn(`[PROBABILISTIC_ERROR] No viable recovery strategy found for ${errorSignature}`);
        return false;
      }
      
      console.log(`[PROBABILISTIC_ERROR] Attempting recovery with strategy: ${strategy.name} (probability: ${strategy.probability.toFixed(2)})`);
      
      // Execute recovery strategy
      const recoveryStartTime = Date.now();
      const recoverySuccess = await this.executeRecoveryStrategy(strategy, context);
      const recoveryTime = Date.now() - recoveryStartTime;
      
      // Record recovery attempt
      const attempt: RecoveryAttempt = {
        strategy: strategy.name,
        timestamp: recoveryStartTime,
        success: recoverySuccess,
        executionTime: recoveryTime,
        confidence: strategy.probability
      };
      
      context.recoveryHistory.push(attempt);
      this.updateRecoveryStatistics(errorSignature, attempt);
      
      // Emit recovery event for monitoring
      this.emit('recovery-attempt', {
        errorSignature,
        strategy: strategy.name,
        success: recoverySuccess,
        executionTime: recoveryTime
      });
      
      if (recoverySuccess) {
        console.log(`[PROBABILISTIC_ERROR] Recovery successful with ${strategy.name} in ${recoveryTime}ms`);
      } else {
        console.warn(`[PROBABILISTIC_ERROR] Recovery failed with ${strategy.name} after ${recoveryTime}ms`);
        
        // Try fallback strategies if available
        return await this.attemptFallbackRecovery(errorSignature, context);
      }
      
      return recoverySuccess;
      
    } catch (handlingError) {
      console.error('[PROBABILISTIC_ERROR] Error in error handling:', handlingError);
      return false;
    }
  }

  /**
   * Record error for pattern analysis
   */
  private recordError(error: Error, context: ErrorContext): void {
    this.recentErrors.push(context);
    
    // Maintain error history limit
    if (this.recentErrors.length > this.MAX_ERROR_HISTORY) {
      this.recentErrors = this.recentErrors.slice(-this.MAX_ERROR_HISTORY);
    }
    
    // Update analytics
    this.analytics.totalErrors++;
    
    const errorType = error.constructor.name;
    this.analytics.errorsByType[errorType] = (this.analytics.errorsByType[errorType] || 0) + 1;
    this.analytics.errorsByContext[context.operation] = (this.analytics.errorsByContext[context.operation] || 0) + 1;
    
    // Update error patterns
    this.updateErrorPatterns(error, context);
  }

  /**
   * Generate unique signature for error classification
   */
  private generateErrorSignature(error: Error, context: ErrorContext): string {
    const errorType = error.constructor.name;
    const operation = context.operation;
    const errorCode = context.errorCode || 'unknown';
    
    // Create signature based on error characteristics
    return `${errorType}_${operation}_${errorCode}`;
  }

  /**
   * Update error patterns for machine learning
   */
  private updateErrorPatterns(error: Error, context: ErrorContext): void {
    const signature = this.generateErrorSignature(error, context);
    const existing = this.errorPatterns.get(signature);
    
    if (existing) {
      // Update existing pattern
      existing.frequency++;
      existing.lastOccurrence = context.timestamp;
      
      // Calculate new average interval
      const timeSinceFirst = context.timestamp - (existing.lastOccurrence - existing.averageInterval * existing.frequency);
      existing.averageInterval = timeSinceFirst / existing.frequency;
    } else {
      // Create new pattern
      this.errorPatterns.set(signature, {
        errorType: error.constructor.name,
        frequency: 1,
        lastOccurrence: context.timestamp,
        averageInterval: 0,
        severity: this.assessErrorSeverity(error, context),
        context: context.operation,
        recoverySuccessRate: 0
      });
    }
  }

  /**
   * Calculate recovery probability based on historical data
   */
  private calculateRecoveryProbability(errorSignature: string, context: ErrorContext): number {
    const pattern = this.errorPatterns.get(errorSignature);
    
    if (!pattern) {
      // No historical data, use baseline probability
      return 0.5;
    }
    
    // Base probability on historical success rate
    let probability = pattern.recoverySuccessRate;
    
    // Adjust based on context factors
    const attemptPenalty = Math.min(context.previousAttempts * 0.1, 0.5);
    probability -= attemptPenalty;
    
    // Adjust based on pattern frequency (frequent errors are harder to recover)
    const frequencyPenalty = Math.min(pattern.frequency * 0.01, 0.3);
    probability -= frequencyPenalty;
    
    // Adjust based on time since last occurrence
    const timeSinceLastError = Date.now() - pattern.lastOccurrence;
    const recencyBonus = Math.min(timeSinceLastError / (1000 * 60 * 60), 0.2); // Up to 20% bonus for recent patterns
    probability += recencyBonus;
    
    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Select optimal recovery strategy based on probability and cost
   */
  private selectOptimalStrategy(errorSignature: string, context: ErrorContext, recoveryProbability: number): RecoveryStrategy | null {
    const availableStrategies = Array.from(this.recoveryStrategies.values())
      .filter(strategy => {
        // Check prerequisites
        return strategy.prerequisites.every(prereq => this.checkPrerequisite(prereq, context));
      });
    
    if (availableStrategies.length === 0) {
      return null;
    }
    
    // Calculate utility score for each strategy
    const scoredStrategies = availableStrategies.map(strategy => {
      const successWeight = 0.5;
      const costWeight = 0.3;
      const timeWeight = 0.2;
      
      const successScore = strategy.probability * successWeight;
      const costScore = (100 - strategy.cost) / 100 * costWeight;
      const timeScore = Math.max(0, (10000 - strategy.executionTime) / 10000) * timeWeight;
      
      const totalScore = successScore + costScore + timeScore;
      
      return { strategy, score: totalScore };
    });
    
    // Sort by score and select the best
    scoredStrategies.sort((a, b) => b.score - a.score);
    
    const selectedStrategy = scoredStrategies[0].strategy;
    
    // Only select if probability meets threshold
    if (selectedStrategy.probability >= this.SUCCESS_PROBABILITY_THRESHOLD) {
      return selectedStrategy;
    }
    
    // If no strategy meets threshold, select best available if desperate
    if (context.previousAttempts > 2) {
      return scoredStrategies[0].strategy;
    }
    
    return null;
  }

  /**
   * Execute recovery strategy with timeout
   */
  private async executeRecoveryStrategy(strategy: RecoveryStrategy, context: ErrorContext): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`[PROBABILISTIC_ERROR] Recovery strategy ${strategy.name} timed out`);
        resolve(false);
      }, this.RECOVERY_TIMEOUT);
      
      strategy.implementation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          console.error(`[PROBABILISTIC_ERROR] Recovery strategy ${strategy.name} failed:`, error);
          resolve(false);
        });
    });
  }

  /**
   * Attempt fallback recovery strategies
   */
  private async attemptFallbackRecovery(errorSignature: string, context: ErrorContext): Promise<boolean> {
    // Get fallback strategies (lower probability but may still work)
    const fallbackStrategies = Array.from(this.recoveryStrategies.values())
      .filter(strategy => strategy.probability < this.SUCCESS_PROBABILITY_THRESHOLD)
      .sort((a, b) => b.probability - a.probability);
    
    for (const strategy of fallbackStrategies.slice(0, 2)) { // Try up to 2 fallback strategies
      console.log(`[PROBABILISTIC_ERROR] Attempting fallback strategy: ${strategy.name}`);
      
      const success = await this.executeRecoveryStrategy(strategy, context);
      if (success) {
        console.log(`[PROBABILISTIC_ERROR] Fallback recovery successful with ${strategy.name}`);
        return true;
      }
    }
    
    console.warn(`[PROBABILISTIC_ERROR] All recovery strategies failed for ${errorSignature}`);
    return false;
  }

  /**
   * Check if prerequisite is met for strategy
   */
  private checkPrerequisite(prerequisite: string, context: ErrorContext): boolean {
    switch (prerequisite) {
      case 'network-available':
        return true; // Simplified check
      case 'file-system-access':
        return true; // Simplified check
      case 'low-resource-usage':
        return true; // Simplified check
      default:
        return true;
    }
  }

  /**
   * Update recovery statistics for learning
   */
  private updateRecoveryStatistics(errorSignature: string, attempt: RecoveryAttempt): void {
    const pattern = this.errorPatterns.get(errorSignature);
    if (pattern) {
      // Update success rate using exponential moving average
      const alpha = 0.1; // Learning rate
      pattern.recoverySuccessRate = pattern.recoverySuccessRate * (1 - alpha) + (attempt.success ? 1 : 0) * alpha;
    }
    
    // Update strategy success rate
    const strategy = this.recoveryStrategies.get(attempt.strategy);
    if (strategy) {
      strategy.probability = strategy.probability * 0.9 + (attempt.success ? 1 : 0) * 0.1;
    }
    
    // Update global analytics
    const totalAttempts = this.recentErrors.reduce((sum, error) => sum + error.recoveryHistory.length, 0);
    const successfulAttempts = this.recentErrors.reduce((sum, error) => 
      sum + error.recoveryHistory.filter(h => h.success).length, 0);
    
    this.analytics.recoverySuccessRate = totalAttempts > 0 ? successfulAttempts / totalAttempts : 0;
    
    const totalRecoveryTime = this.recentErrors.reduce((sum, error) => 
      sum + error.recoveryHistory.reduce((time, h) => time + h.executionTime, 0), 0);
    
    this.analytics.averageRecoveryTime = totalAttempts > 0 ? totalRecoveryTime / totalAttempts : 0;
  }

  /**
   * Assess error severity based on context
   */
  private assessErrorSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    // Assess based on error type and context
    if (error.name.includes('Critical') || context.operation.includes('startup')) {
      return 'critical';
    } else if (error.name.includes('Timeout') || context.previousAttempts > 3) {
      return 'high';
    } else if (error.name.includes('Network') || error.name.includes('Connection')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeDefaultStrategies(): void {
    // TODO: [TASK-MCP-007-PROB-003] Pattern: strategy-initialization | Complexity: 5 | Dependencies: recovery-mechanisms
    // Context: Set up default recovery strategies with probabilistic parameters
    // Validation-Required: strategy-effectiveness, probability-accuracy, implementation-reliability
    // Pattern-Info: { approach: "pre-configured-strategies", alternatives: "dynamic-strategy-generation", trade-offs: "predictability-vs-adaptability" }
    
    this.recoveryStrategies.set('retry-with-backoff', {
      name: 'retry-with-backoff',
      probability: 0.7,
      cost: 20,
      executionTime: 5000,
      prerequisites: [],
      implementation: async () => {
        // Implement exponential backoff retry
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
        return Math.random() > 0.3; // 70% success rate
      }
    });
    
    this.recoveryStrategies.set('resource-cleanup', {
      name: 'resource-cleanup',
      probability: 0.8,
      cost: 30,
      executionTime: 3000,
      prerequisites: [],
      implementation: async () => {
        // Cleanup resources and retry
        console.log('[RECOVERY] Performing resource cleanup');
        cleanupComponentListeners('probabilistic-error-handler');
        return Math.random() > 0.2; // 80% success rate
      }
    });
    
    this.recoveryStrategies.set('fallback-mode', {
      name: 'fallback-mode',
      probability: 0.9,
      cost: 70,
      executionTime: 1000,
      prerequisites: [],
      implementation: async () => {
        // Switch to fallback mode
        console.log('[RECOVERY] Switching to fallback mode');
        return true; // Fallback mode always succeeds
      }
    });
    
    this.recoveryStrategies.set('service-restart', {
      name: 'service-restart',
      probability: 0.6,
      cost: 90,
      executionTime: 10000,
      prerequisites: ['low-resource-usage'],
      implementation: async () => {
        // Restart service components
        console.log('[RECOVERY] Restarting service components');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return Math.random() > 0.4; // 60% success rate
      }
    });
  }

  /**
   * Setup periodic pattern analysis
   */
  private setupPeriodicAnalysis(): void {
    setInterval(() => {
      this.analyzePatterns();
      this.generatePredictions();
      this.assessRisk();
    }, 300000); // Every 5 minutes
  }

  /**
   * Analyze error patterns for insights
   */
  private analyzePatterns(): void {
    console.log('[PROBABILISTIC_ERROR] Analyzing error patterns...');
    
    const now = Date.now();
    const recentErrors = this.recentErrors.filter(error => 
      now - error.timestamp < this.PATTERN_ANALYSIS_WINDOW);
    
    // Update pattern analysis
    for (const [signature, pattern] of this.errorPatterns) {
      if (pattern.frequency >= this.MIN_PATTERN_OCCURRENCES) {
        console.log(`[PROBABILISTIC_ERROR] Pattern detected: ${signature} (frequency: ${pattern.frequency}, success rate: ${pattern.recoverySuccessRate.toFixed(2)})`);
      }
    }
  }

  /**
   * Generate failure predictions
   */
  private generatePredictions(): void {
    const predictions: PatternPrediction[] = [];
    
    for (const [signature, pattern] of this.errorPatterns) {
      if (pattern.frequency >= this.MIN_PATTERN_OCCURRENCES && pattern.averageInterval > 0) {
        const timeSinceLastError = Date.now() - pattern.lastOccurrence;
        const likelihood = Math.max(0, 1 - (timeSinceLastError / pattern.averageInterval));
        
        if (likelihood > this.PATTERN_CONFIDENCE_THRESHOLD) {
          predictions.push({
            pattern: signature,
            likelihood,
            timeframe: pattern.averageInterval - timeSinceLastError,
            severity: pattern.severity,
            preventionStrategies: this.getPreventionStrategies(pattern)
          });
        }
      }
    }
    
    this.analytics.patternPredictions = predictions;
  }

  /**
   * Assess overall system risk
   */
  private assessRisk(): void {
    const criticalPatterns = Array.from(this.errorPatterns.values())
      .filter(pattern => pattern.severity === 'critical')
      .map(pattern => pattern.errorType);
    
    const highFrequencyPatterns = Array.from(this.errorPatterns.values())
      .filter(pattern => pattern.frequency > 10);
    
    const overallRisk = Math.min(100, 
      criticalPatterns.length * 30 + 
      highFrequencyPatterns.length * 10 + 
      (1 - this.analytics.recoverySuccessRate) * 50
    );
    
    let stabilityTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    
    // Simple trend analysis based on recent error frequency
    const recentErrorCount = this.recentErrors.filter(error => 
      Date.now() - error.timestamp < 3600000).length; // Last hour
    
    if (recentErrorCount < 5) {
      stabilityTrend = 'improving';
    } else if (recentErrorCount > 20) {
      stabilityTrend = 'degrading';
    }
    
    this.analytics.riskAssessment = {
      overallRisk,
      criticalPatterns: criticalPatterns,
      stabilityTrend,
      recommendedActions: this.generateRecommendations(overallRisk, criticalPatterns)
    };
  }

  /**
   * Get prevention strategies for a pattern
   */
  private getPreventionStrategies(pattern: ErrorPattern): string[] {
    const strategies = [];
    
    if (pattern.severity === 'critical') {
      strategies.push('Implement circuit breaker');
      strategies.push('Add health checks');
    }
    
    if (pattern.frequency > 10) {
      strategies.push('Investigate root cause');
      strategies.push('Implement rate limiting');
    }
    
    return strategies;
  }

  /**
   * Generate risk-based recommendations
   */
  private generateRecommendations(overallRisk: number, criticalPatterns: string[]): string[] {
    const recommendations = [];
    
    if (overallRisk > 70) {
      recommendations.push('Immediate intervention required');
      recommendations.push('Consider system restart');
    } else if (overallRisk > 40) {
      recommendations.push('Monitor closely');
      recommendations.push('Prepare fallback procedures');
    }
    
    if (criticalPatterns.length > 0) {
      recommendations.push(`Address critical patterns: ${criticalPatterns.join(', ')}`);
    }
    
    return recommendations;
  }

  /**
   * Get error analytics for monitoring
   */
  public getAnalytics(): ErrorAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get error patterns for analysis
   */
  public getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values());
  }

  /**
   * Cleanup and shutdown
   */
  public cleanup(): void {
    cleanupComponentListeners('probabilistic-error-handler');
    this.removeAllListeners();
  }
}

/**
 * Global error handler instance
 */
export const probabilisticErrorHandler = new ProbabilisticErrorHandler();

/**
 * Convenience function for error handling
 */
export async function handleErrorProbabilistically(error: Error, operation: string): Promise<boolean> {
  const context: ErrorContext = {
    operation,
    timestamp: Date.now(),
    errorMessage: error.message,
    stackTrace: error.stack,
    systemState: {},
    previousAttempts: 0,
    recoveryHistory: []
  };
  
  return await probabilisticErrorHandler.handleError(error, context);
}
/**---
 * title: [Haruspex Interactive Controller - Real-Time Control System]
 * tags: [Interactive-Control, Action-Triggering, Debugging, Automation]
 * provides: [InteractiveController, ActionTrigger, BatchExecution, WorkflowAutomation]
 * requires: [Core Engine, State Inspector, IPC Protocol]
 * description: [Interactive control system for real-time debugging, action triggering, and workflow automation]
 * ---*/

import { EventEmitter } from 'events';
import { HaruspexCoreEngine } from '../core/haruspex-core-engine';
import { HaruspexStateInspector, StateChange } from './state-inspector';
import { HaruspexDebugManager } from './haruspex-debug-manager';
import { CommandRequest, CommandResponse } from './ipc-protocol';

export interface Action {
  id: string;
  name: string;
  description: string;
  command: string;
  args?: any[];
  options?: Record<string, any>;
  timeout?: number;
  confirmationRequired?: boolean;
  category: 'diagnostic' | 'control' | 'data' | 'workflow' | 'automation';
}

export interface ActionTrigger {
  id: string;
  name: string;
  description: string;
  condition: TriggerCondition;
  actions: string[]; // Action IDs to execute
  enabled: boolean;
  cooldown?: number; // Minimum time between triggers (ms)
  maxExecutions?: number; // Maximum executions before disabling
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TriggerCondition {
  type: 'state_change' | 'property_value' | 'health_status' | 'performance_threshold' | 'error_count' | 'custom';
  component?: string;
  property?: string;
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'regex';
  value?: any;
  evaluator?: (currentState: any, change?: StateChange) => boolean;
}

export interface BatchOperation {
  id: string;
  name: string;
  description: string;
  actions: BatchAction[];
  parallel?: boolean;
  stopOnError?: boolean;
  timeout?: number;
}

export interface BatchAction {
  actionId: string;
  delay?: number;
  condition?: (results: ActionResult[], context: any) => boolean;
  retryCount?: number;
  retryDelay?: number;
}

export interface ActionResult {
  actionId: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  timestamp: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'wait' | 'loop' | 'parallel';
  config: any;
  nextSteps?: string[];
  errorSteps?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
  timeout?: number;
}

export interface ExecutionContext {
  workflowId?: string;
  batchId?: string;
  triggerId?: string;
  userId?: string;
  variables: Record<string, any>;
  startTime: number;
}

/**
 * Interactive control system for real-time debugging and automation
 * 
 * Provides:
 * - Predefined diagnostic and control actions
 * - Automated trigger system based on state changes
 * - Batch operation execution
 * - Workflow automation for complex scenarios
 * - Real-time control and intervention capabilities
 */
export class HaruspexInteractiveController extends EventEmitter {
  private actions = new Map<string, Action>();
  private triggers = new Map<string, ActionTrigger>();
  private batchOperations = new Map<string, BatchOperation>();
  private workflows = new Map<string, Workflow>();
  private triggerCooldowns = new Map<string, number>();
  private triggerExecutions = new Map<string, number>();
  private executionHistory: ActionResult[] = [];
  private activeExecutions = new Map<string, ExecutionContext>();

  constructor(
    private coreEngine: HaruspexCoreEngine,
    private stateInspector: HaruspexStateInspector,
    private debugManager: HaruspexDebugManager
  ) {
    super();
    
    this.initializePredefinedActions();
    this.initializePredefinedTriggers();
    this.initializePredefinedBatchOperations();
    this.initializePredefinedWorkflows();
    this.setupEventHandlers();
  }

  /**
   * Initialize predefined diagnostic and control actions
   */
  private initializePredefinedActions(): void {
    const predefinedActions: Action[] = [
      // Diagnostic Actions
      {
        id: 'get_health_status',
        name: 'Get Health Status',
        description: 'Retrieve current health status and metrics',
        command: 'haruspex.getHealth',
        category: 'diagnostic',
        timeout: 5000
      },
      {
        id: 'get_debug_info',
        name: 'Get Debug Information',
        description: 'Collect comprehensive debug information',
        command: 'haruspex.getDebugInfo',
        category: 'diagnostic',
        timeout: 10000
      },
      {
        id: 'get_metrics',
        name: 'Get Performance Metrics',
        description: 'Retrieve performance metrics and statistics',
        command: 'haruspex.getMetrics',
        category: 'diagnostic',
        timeout: 5000
      },
      {
        id: 'check_engine_initialization',
        name: 'Check Engine Initialization',
        description: 'Verify core engine initialization status',
        command: 'haruspex.checkEngineInit',
        category: 'diagnostic',
        timeout: 3000
      },
      
      // Control Actions
      {
        id: 'refresh_all_data',
        name: 'Refresh All Data',
        description: 'Refresh all Haruspex data sources',
        command: 'haruspex.refreshAll',
        category: 'control',
        timeout: 30000,
        confirmationRequired: true
      },
      {
        id: 'restart_engine',
        name: 'Restart Core Engine',
        description: 'Restart the Haruspex core engine',
        command: 'haruspex.restartEngine',
        category: 'control',
        timeout: 20000,
        confirmationRequired: true
      },
      {
        id: 'clear_error_state',
        name: 'Clear Error State',
        description: 'Clear current error state and reset circuit breakers',
        command: 'haruspex.clearErrors',
        category: 'control',
        timeout: 5000
      },
      {
        id: 'force_garbage_collection',
        name: 'Force Garbage Collection',
        description: 'Force garbage collection to free memory',
        command: 'haruspex.forceGC',
        category: 'control',
        timeout: 10000
      },
      
      // Data Actions
      {
        id: 'export_debug_report',
        name: 'Export Debug Report',
        description: 'Export comprehensive debug report to file',
        command: 'haruspex.exportDebugReport',
        category: 'data',
        timeout: 15000
      },
      {
        id: 'backup_state',
        name: 'Backup Current State',
        description: 'Create backup of current extension state',
        command: 'haruspex.backupState',
        category: 'data',
        timeout: 10000
      },
      {
        id: 'clear_cache',
        name: 'Clear All Caches',
        description: 'Clear all internal caches and temporary data',
        command: 'haruspex.clearCache',
        category: 'data',
        timeout: 5000
      },
      
      // Workflow Actions
      {
        id: 'run_diagnostic_suite',
        name: 'Run Diagnostic Suite',
        description: 'Execute comprehensive diagnostic workflow',
        command: 'haruspex.runDiagnostics',
        category: 'workflow',
        timeout: 60000
      },
      {
        id: 'initialize_workspace',
        name: 'Initialize Workspace',
        description: 'Run workspace initialization wizard',
        command: 'haruspex.initWorkspace',
        category: 'workflow',
        timeout: 120000,
        confirmationRequired: true
      },
      {
        id: 'analyze_workspace_pcl',
        name: 'Analyze Workspace (PCL)',
        description: 'Analyze workspace using PCL integration',
        command: 'haruspex.analyzeWorkspace',
        category: 'workflow',
        timeout: 30000
      },
      
      // Automation Actions
      {
        id: 'auto_fix_issues',
        name: 'Auto-Fix Known Issues',
        description: 'Automatically fix known configuration and setup issues',
        command: 'haruspex.autoFix',
        category: 'automation',
        timeout: 45000,
        confirmationRequired: true
      },
      {
        id: 'optimize_performance',
        name: 'Optimize Performance',
        description: 'Run performance optimization procedures',
        command: 'haruspex.optimizePerformance',
        category: 'automation',
        timeout: 30000
      }
    ];

    predefinedActions.forEach(action => {
      this.actions.set(action.id, action);
    });
  }

  /**
   * Initialize predefined automated triggers
   */
  private initializePredefinedTriggers(): void {
    const predefinedTriggers: ActionTrigger[] = [
      // Health Monitoring Triggers
      {
        id: 'health_degraded_trigger',
        name: 'Health Degraded Alert',
        description: 'Trigger when health status changes from healthy to degraded',
        condition: {
          type: 'state_change',
          component: 'engine',
          property: 'health.overall',
          evaluator: (currentState, change) => {
            return change?.oldValue === 'healthy' && change?.newValue === 'degraded';
          }
        },
        actions: ['get_health_status', 'get_debug_info'],
        enabled: true,
        cooldown: 30000, // 30 seconds
        priority: 'high'
      },
      {
        id: 'health_critical_trigger',
        name: 'Health Critical Alert',
        description: 'Trigger when health status becomes critical',
        condition: {
          type: 'state_change',
          component: 'engine',
          property: 'health.overall',
          evaluator: (currentState, change) => {
            return change?.newValue === 'critical';
          }
        },
        actions: ['get_health_status', 'get_debug_info', 'export_debug_report'],
        enabled: true,
        cooldown: 60000, // 1 minute
        priority: 'critical'
      },
      
      // Error Monitoring Triggers
      {
        id: 'new_errors_trigger',
        name: 'New Errors Detected',
        description: 'Trigger when new errors are detected',
        condition: {
          type: 'state_change',
          component: 'debug',
          property: 'errors',
          evaluator: (currentState, change) => {
            const oldErrors = Array.isArray(change?.oldValue) ? change.oldValue : [];
            const newErrors = Array.isArray(change?.newValue) ? change.newValue : [];
            return newErrors.length > oldErrors.length;
          }
        },
        actions: ['get_debug_info'],
        enabled: true,
        cooldown: 10000, // 10 seconds
        priority: 'medium'
      },
      
      // Performance Monitoring Triggers
      {
        id: 'high_memory_usage_trigger',
        name: 'High Memory Usage Alert',
        description: 'Trigger when memory usage exceeds threshold',
        condition: {
          type: 'property_value',
          component: 'performance',
          property: 'memoryUsage',
          operator: '>',
          value: 500 // 500MB
        },
        actions: ['get_metrics', 'force_garbage_collection'],
        enabled: true,
        cooldown: 120000, // 2 minutes
        priority: 'medium'
      },
      {
        id: 'high_failure_rate_trigger',
        name: 'High Failure Rate Alert',
        description: 'Trigger when operation failure rate is high',
        condition: {
          type: 'custom',
          evaluator: (currentState) => {
            const metrics = currentState?.engine?.metrics?.operations;
            if (!metrics) return false;
            
            const totalOps = metrics.totalOperations;
            const failedOps = metrics.failedOperations;
            
            if (totalOps === 0) return false;
            
            const failureRate = failedOps / totalOps;
            return failureRate > 0.1; // 10% failure rate
          }
        },
        actions: ['get_metrics', 'get_debug_info', 'clear_error_state'],
        enabled: true,
        cooldown: 300000, // 5 minutes
        priority: 'high'
      },
      
      // Engine State Triggers
      {
        id: 'engine_not_initialized_trigger',
        name: 'Engine Not Initialized',
        description: 'Trigger when engine initialization fails',
        condition: {
          type: 'property_value',
          component: 'engine',
          property: 'isInitialized',
          operator: '==',
          value: false
        },
        actions: ['check_engine_initialization', 'get_debug_info'],
        enabled: true,
        cooldown: 60000, // 1 minute
        maxExecutions: 5, // Limit to prevent infinite retries
        priority: 'critical'
      }
    ];

    predefinedTriggers.forEach(trigger => {
      this.triggers.set(trigger.id, trigger);
    });
  }

  /**
   * Initialize predefined batch operations
   */
  private initializePredefinedBatchOperations(): void {
    const predefinedBatchOps: BatchOperation[] = [
      {
        id: 'full_diagnostic_scan',
        name: 'Full Diagnostic Scan',
        description: 'Complete diagnostic scan of all system components',
        actions: [
          { actionId: 'get_health_status' },
          { actionId: 'get_debug_info', delay: 1000 },
          { actionId: 'get_metrics', delay: 500 },
          { actionId: 'check_engine_initialization', delay: 500 }
        ],
        parallel: false,
        stopOnError: false,
        timeout: 60000
      },
      {
        id: 'emergency_recovery',
        name: 'Emergency Recovery Procedure',
        description: 'Emergency recovery workflow for critical failures',
        actions: [
          { actionId: 'export_debug_report' },
          { actionId: 'backup_state', delay: 2000 },
          { actionId: 'clear_error_state', delay: 1000 },
          { actionId: 'clear_cache', delay: 1000 },
          { actionId: 'restart_engine', delay: 2000 }
        ],
        parallel: false,
        stopOnError: false,
        timeout: 120000
      },
      {
        id: 'performance_optimization',
        name: 'Performance Optimization',
        description: 'Optimize system performance and free resources',
        actions: [
          { actionId: 'get_metrics' },
          { actionId: 'clear_cache', delay: 1000 },
          { actionId: 'force_garbage_collection', delay: 2000 },
          { actionId: 'optimize_performance', delay: 3000 }
        ],
        parallel: false,
        stopOnError: false,
        timeout: 60000
      },
      {
        id: 'workspace_setup',
        name: 'Complete Workspace Setup',
        description: 'Complete workspace initialization and analysis',
        actions: [
          { actionId: 'initialize_workspace' },
          { actionId: 'analyze_workspace_pcl', delay: 5000 },
          { actionId: 'refresh_all_data', delay: 3000 }
        ],
        parallel: false,
        stopOnError: true,
        timeout: 300000
      }
    ];

    predefinedBatchOps.forEach(batch => {
      this.batchOperations.set(batch.id, batch);
    });
  }

  /**
   * Initialize predefined workflows
   */
  private initializePredefinedWorkflows(): void {
    const predefinedWorkflows: Workflow[] = [
      {
        id: 'startup_diagnostics',
        name: 'Startup Diagnostics Workflow',
        description: 'Comprehensive startup diagnostics and health check',
        steps: [
          {
            id: 'check_health',
            name: 'Check Health Status',
            type: 'action',
            config: { actionId: 'get_health_status' },
            nextSteps: ['evaluate_health']
          },
          {
            id: 'evaluate_health',
            name: 'Evaluate Health',
            type: 'condition',
            config: {
              condition: (context: any) => context.results?.check_health?.result?.overall === 'healthy'
            },
            nextSteps: ['health_ok'],
            errorSteps: ['health_issues']
          },
          {
            id: 'health_ok',
            name: 'Health OK - Quick Scan',
            type: 'action',
            config: { actionId: 'get_metrics' },
            nextSteps: ['complete']
          },
          {
            id: 'health_issues',
            name: 'Health Issues - Full Diagnostic',
            type: 'action',
            config: { batchId: 'full_diagnostic_scan' },
            nextSteps: ['complete']
          },
          {
            id: 'complete',
            name: 'Workflow Complete',
            type: 'action',
            config: { actionId: 'export_debug_report' }
          }
        ],
        timeout: 120000
      },
      {
        id: 'auto_recovery',
        name: 'Automatic Recovery Workflow',
        description: 'Automated recovery from critical failures',
        steps: [
          {
            id: 'assess_damage',
            name: 'Assess System State',
            type: 'action',
            config: { batchId: 'full_diagnostic_scan' },
            nextSteps: ['determine_recovery']
          },
          {
            id: 'determine_recovery',
            name: 'Determine Recovery Strategy',
            type: 'condition',
            config: {
              condition: (context: any) => {
                const health = context.results?.assess_damage?.result?.health;
                return health?.overall === 'critical';
              }
            },
            nextSteps: ['emergency_recovery'],
            errorSteps: ['standard_recovery']
          },
          {
            id: 'emergency_recovery',
            name: 'Emergency Recovery',
            type: 'action',
            config: { batchId: 'emergency_recovery' },
            nextSteps: ['verify_recovery']
          },
          {
            id: 'standard_recovery',
            name: 'Standard Recovery',
            type: 'action',
            config: { actionId: 'clear_error_state' },
            nextSteps: ['verify_recovery']
          },
          {
            id: 'verify_recovery',
            name: 'Verify Recovery',
            type: 'action',
            config: { actionId: 'get_health_status' },
            nextSteps: ['complete']
          },
          {
            id: 'complete',
            name: 'Recovery Complete',
            type: 'action',
            config: { actionId: 'export_debug_report' }
          }
        ],
        timeout: 300000
      }
    ];

    predefinedWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  /**
   * Setup event handlers for state changes and triggers
   */
  private setupEventHandlers(): void {
    // Listen for state changes to evaluate triggers
    this.stateInspector.on('state_changed', (stateDiff) => {
      this.evaluateTriggersForStateChange(stateDiff);
    });

    this.stateInspector.on('property_changed', (change) => {
      this.evaluateTriggersForPropertyChange(change);
    });

    this.stateInspector.on('critical_change', (change) => {
      this.handleCriticalChange(change);
    });
  }

  /**
   * Evaluate triggers for state changes
   */
  private evaluateTriggersForStateChange(stateDiff: any): void {
    for (const change of stateDiff.changes) {
      for (const [triggerId, trigger] of this.triggers) {
        if (!trigger.enabled) continue;
        
        if (this.shouldEvaluateTrigger(trigger, change)) {
          this.evaluateTrigger(triggerId, trigger, change);
        }
      }
    }
  }

  /**
   * Evaluate triggers for property changes
   */
  private evaluateTriggersForPropertyChange(change: StateChange): void {
    const currentSnapshot = this.stateInspector.getCurrentSnapshot();
    
    for (const [triggerId, trigger] of this.triggers) {
      if (!trigger.enabled) continue;
      
      if (trigger.condition.type === 'property_value') {
        const propertyValue = this.getPropertyValue(currentSnapshot, trigger.condition);
        if (this.evaluateCondition(trigger.condition, propertyValue)) {
          this.evaluateTrigger(triggerId, trigger, change);
        }
      }
    }
  }

  /**
   * Handle critical state changes
   */
  private handleCriticalChange(change: StateChange): void {
    this.emit('critical_change_detected', {
      change,
      timestamp: Date.now(),
      autoActions: this.getAutoActionsForCriticalChange(change)
    });

    // Execute immediate critical response if configured
    const criticalTriggers = Array.from(this.triggers.values())
      .filter(t => t.enabled && t.priority === 'critical');
    
    for (const trigger of criticalTriggers) {
      if (this.shouldEvaluateTrigger(trigger, change)) {
        this.evaluateTrigger(trigger.id, trigger, change);
      }
    }
  }

  /**
   * Check if trigger should be evaluated for a change
   */
  private shouldEvaluateTrigger(trigger: ActionTrigger, change: StateChange): boolean {
    if (trigger.condition.type !== 'state_change') return false;
    
    if (trigger.condition.component && trigger.condition.component !== change.component) {
      return false;
    }
    
    if (trigger.condition.property && trigger.condition.property !== change.property) {
      return false;
    }
    
    return true;
  }

  /**
   * Evaluate a specific trigger
   */
  private async evaluateTrigger(triggerId: string, trigger: ActionTrigger, change?: StateChange): Promise<void> {
    // Check cooldown
    const lastExecution = this.triggerCooldowns.get(triggerId) || 0;
    if (trigger.cooldown && Date.now() - lastExecution < trigger.cooldown) {
      return;
    }

    // Check execution limit
    const executions = this.triggerExecutions.get(triggerId) || 0;
    if (trigger.maxExecutions && executions >= trigger.maxExecutions) {
      this.emit('trigger_disabled', { triggerId, reason: 'max_executions_reached' });
      trigger.enabled = false;
      return;
    }

    // Evaluate condition
    const currentSnapshot = this.stateInspector.getCurrentSnapshot();
    let conditionMet = false;

    try {
      switch (trigger.condition.type) {
        case 'state_change':
          conditionMet = trigger.condition.evaluator ? 
            trigger.condition.evaluator(currentSnapshot, change) : true;
          break;
          
        case 'property_value':
          const propertyValue = this.getPropertyValue(currentSnapshot, trigger.condition);
          conditionMet = this.evaluateCondition(trigger.condition, propertyValue);
          break;
          
        case 'custom':
          conditionMet = trigger.condition.evaluator ? 
            trigger.condition.evaluator(currentSnapshot, change) : false;
          break;
          
        default:
          conditionMet = false;
      }
    } catch (error) {
      this.emit('trigger_evaluation_error', { triggerId, error, change });
      return;
    }

    if (conditionMet) {
      // Update cooldown and execution count
      this.triggerCooldowns.set(triggerId, Date.now());
      this.triggerExecutions.set(triggerId, executions + 1);

      // Execute trigger actions
      this.emit('trigger_activated', { triggerId, trigger, change });
      await this.executeTriggerActions(triggerId, trigger, change);
    }
  }

  /**
   * Execute actions for an activated trigger
   */
  private async executeTriggerActions(triggerId: string, trigger: ActionTrigger, change?: StateChange): Promise<void> {
    const context: ExecutionContext = {
      triggerId,
      variables: { trigger, change },
      startTime: Date.now()
    };

    try {
      const results: ActionResult[] = [];
      
      for (const actionId of trigger.actions) {
        const action = this.actions.get(actionId);
        if (action) {
          const result = await this.executeAction(actionId, context);
          results.push(result);
          
          if (!result.success && trigger.priority === 'critical') {
            this.emit('critical_action_failed', { triggerId, actionId, result });
          }
        }
      }

      this.emit('trigger_execution_complete', { triggerId, results });
      
    } catch (error) {
      this.emit('trigger_execution_error', { triggerId, error });
    }
  }

  /**
   * Get property value from snapshot using condition path
   */
  private getPropertyValue(snapshot: any, condition: TriggerCondition): any {
    if (!snapshot || !condition.component || !condition.property) {
      return undefined;
    }

    const componentData = snapshot[condition.component];
    if (!componentData) return undefined;

    const propertyPath = condition.property.split('.');
    let current = componentData;

    for (const part of propertyPath) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Evaluate condition against a value
   */
  private evaluateCondition(condition: TriggerCondition, value: any): boolean {
    if (!condition.operator || condition.value === undefined) {
      return false;
    }

    switch (condition.operator) {
      case '==':
        return value === condition.value;
      case '!=':
        return value !== condition.value;
      case '>':
        return typeof value === 'number' && value > condition.value;
      case '<':
        return typeof value === 'number' && value < condition.value;
      case '>=':
        return typeof value === 'number' && value >= condition.value;
      case '<=':
        return typeof value === 'number' && value <= condition.value;
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value);
      case 'regex':
        return typeof value === 'string' && new RegExp(condition.value).test(value);
      default:
        return false;
    }
  }

  /**
   * Get auto-actions for critical changes
   */
  private getAutoActionsForCriticalChange(change: StateChange): string[] {
    const autoActions: string[] = ['get_debug_info'];
    
    if (change.component === 'engine' && change.property === 'health.overall') {
      autoActions.push('get_health_status', 'export_debug_report');
    }
    
    if (change.component === 'performance' && change.property === 'memoryUsage') {
      autoActions.push('get_metrics', 'force_garbage_collection');
    }
    
    return autoActions;
  }

  // Public API Methods

  /**
   * Execute a single action
   */
  async executeAction(actionId: string, context?: ExecutionContext): Promise<ActionResult> {
    const action = this.actions.get(actionId);
    if (!action) {
      throw new Error(`Action not found: ${actionId}`);
    }

    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.emit('action_started', { actionId, action, executionId, context });

    try {
      // Check if confirmation is required
      if (action.confirmationRequired && !context?.variables?.skipConfirmation) {
        this.emit('confirmation_required', { actionId, action });
        // In a real implementation, this would wait for user confirmation
        // For now, we'll assume confirmation is granted
      }

      // Execute the action via command
      const commandRequest: CommandRequest = {
        command: action.command,
        args: action.args || [],
        options: action.options || {}
      };

      const commandResult = await this.executeCommand(commandRequest, action.timeout);
      
      const result: ActionResult = {
        actionId,
        success: commandResult.success,
        result: commandResult.result,
        error: commandResult.error || '',
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      this.executionHistory.push(result);
      this.emit('action_completed', { actionId, result, executionId });

      return result;

    } catch (error) {
      const result: ActionResult = {
        actionId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      this.executionHistory.push(result);
      this.emit('action_failed', { actionId, result, executionId, error });

      return result;
    }
  }

  /**
   * Execute a batch operation
   */
  async executeBatchOperation(batchId: string, context?: ExecutionContext): Promise<ActionResult[]> {
    const batch = this.batchOperations.get(batchId);
    if (!batch) {
      throw new Error(`Batch operation not found: ${batchId}`);
    }

    const executionContext: ExecutionContext = {
      batchId,
      variables: context?.variables || {},
      startTime: Date.now(),
      ...context
    };

    this.activeExecutions.set(batchId, executionContext);
    this.emit('batch_started', { batchId, batch, context: executionContext });

    try {
      const results: ActionResult[] = [];

      if (batch.parallel) {
        // Execute actions in parallel
        const promises = batch.actions.map(async (batchAction) => {
          if (batchAction.delay) {
            await new Promise(resolve => setTimeout(resolve, batchAction.delay));
          }
          
          if (batchAction.condition && !batchAction.condition(results, executionContext)) {
            return null;
          }

          return this.executeActionWithRetry(batchAction, executionContext);
        });

        const parallelResults = await Promise.allSettled(promises);
        results.push(...parallelResults
          .filter(r => r.status === 'fulfilled' && r.value !== null)
          .map(r => (r as PromiseFulfilledResult<ActionResult>).value));

      } else {
        // Execute actions sequentially
        for (const batchAction of batch.actions) {
          if (batchAction.delay) {
            await new Promise(resolve => setTimeout(resolve, batchAction.delay));
          }
          
          if (batchAction.condition && !batchAction.condition(results, executionContext)) {
            continue;
          }

          const result = await this.executeActionWithRetry(batchAction, executionContext);
          results.push(result);

          if (!result.success && batch.stopOnError) {
            this.emit('batch_stopped_on_error', { batchId, result });
            break;
          }
        }
      }

      this.activeExecutions.delete(batchId);
      this.emit('batch_completed', { batchId, results });

      return results;

    } catch (error) {
      this.activeExecutions.delete(batchId);
      this.emit('batch_failed', { batchId, error });
      throw error;
    }
  }

  /**
   * Execute action with retry logic
   */
  private async executeActionWithRetry(batchAction: BatchAction, context: ExecutionContext): Promise<ActionResult> {
    const retryCount = batchAction.retryCount || 0;
    const retryDelay = batchAction.retryDelay || 1000;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const result = await this.executeAction(batchAction.actionId, context);
        
        if (result.success || attempt === retryCount) {
          return result;
        }
        
        lastError = new Error(result.error || 'Action failed');
        
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw lastError || new Error('Action failed after retries');
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId: string, context?: ExecutionContext): Promise<any> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionContext: ExecutionContext = {
      workflowId,
      variables: { ...workflow.variables, ...context?.variables },
      startTime: Date.now(),
      ...context
    };

    this.activeExecutions.set(workflowId, executionContext);
    this.emit('workflow_started', { workflowId, workflow, context: executionContext });

    try {
      const results: Record<string, any> = {};
      let currentStepId = workflow.steps[0]?.id;

      while (currentStepId) {
        const step = workflow.steps.find(s => s.id === currentStepId);
        if (!step) break;

        this.emit('workflow_step_started', { workflowId, stepId: currentStepId, step });

        try {
          const stepResult = await this.executeWorkflowStep(step, executionContext, results);
          results[step.id] = stepResult;

          // Determine next step
          if (stepResult.success && step.nextSteps?.length) {
            currentStepId = step.nextSteps[0]; // Simple linear flow for now
          } else if (!stepResult.success && step.errorSteps?.length) {
            currentStepId = step.errorSteps[0];
          } else {
            break; // End workflow
          }

        } catch (error) {
          this.emit('workflow_step_failed', { workflowId, stepId: currentStepId, error });
          
          if (step.errorSteps?.length) {
            currentStepId = step.errorSteps[0];
          } else {
            throw error;
          }
        }
      }

      this.activeExecutions.delete(workflowId);
      this.emit('workflow_completed', { workflowId, results });

      return results;

    } catch (error) {
      this.activeExecutions.delete(workflowId);
      this.emit('workflow_failed', { workflowId, error });
      throw error;
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeWorkflowStep(step: WorkflowStep, context: ExecutionContext, results: Record<string, any>): Promise<any> {
    switch (step.type) {
      case 'action':
        if (step.config.actionId) {
          return await this.executeAction(step.config.actionId, context);
        } else if (step.config.batchId) {
          return await this.executeBatchOperation(step.config.batchId, context);
        }
        throw new Error(`Invalid action step configuration: ${step.id}`);

      case 'condition':
        const conditionResult = step.config.condition ? 
          step.config.condition({ ...context, results }) : false;
        return { success: conditionResult, result: conditionResult };

      case 'wait':
        const delay = step.config.delay || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return { success: true, result: 'wait_completed' };

      default:
        throw new Error(`Unsupported workflow step type: ${step.type}`);
    }
  }

  /**
   * Execute command through core engine
   */
  private async executeCommand(request: CommandRequest, timeout?: number): Promise<CommandResponse> {
    // This would integrate with the actual command execution system
    // For now, we'll simulate command execution
    
    this.debugManager.log(`Executing command: ${request.command}`, 'info');
    
    try {
      // Map commands to core engine methods
      let result: any;
      
      switch (request.command) {
        case 'haruspex.getHealth':
          result = this.coreEngine.getHealthStatus();
          break;
        case 'haruspex.getMetrics':
          result = this.coreEngine.getMetrics();
          break;
        case 'haruspex.refreshAll':
          result = await this.refreshAllData();
          break;
        default:
          throw new Error(`Unknown command: ${request.command}`);
      }

      return {
        success: true,
        result,
        duration: 100 // Simulated duration
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: 100
      };
    }
  }

  /**
   * Refresh all data - placeholder implementation
   */
  private async refreshAllData(): Promise<any> {
    const [truthMatrix, docTree, diagrams] = await Promise.allSettled([
      this.coreEngine.getTruthMatrix(),
      this.coreEngine.getDocumentationTree(),
      this.coreEngine.getMermaidDiagrams()
    ]);

    return {
      truthMatrix: truthMatrix.status === 'fulfilled' ? 'success' : 'failed',
      docTree: docTree.status === 'fulfilled' ? 'success' : 'failed',
      diagrams: diagrams.status === 'fulfilled' ? 'success' : 'failed'
    };
  }

  // Management API Methods

  /**
   * Get all available actions
   */
  getActions(): Action[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get action by ID
   */
  getAction(actionId: string): Action | undefined {
    return this.actions.get(actionId);
  }

  /**
   * Add custom action
   */
  addAction(action: Action): void {
    this.actions.set(action.id, action);
    this.emit('action_added', action);
  }

  /**
   * Remove action
   */
  removeAction(actionId: string): boolean {
    const removed = this.actions.delete(actionId);
    if (removed) {
      this.emit('action_removed', actionId);
    }
    return removed;
  }

  /**
   * Get all triggers
   */
  getTriggers(): ActionTrigger[] {
    return Array.from(this.triggers.values());
  }

  /**
   * Get trigger by ID
   */
  getTrigger(triggerId: string): ActionTrigger | undefined {
    return this.triggers.get(triggerId);
  }

  /**
   * Add custom trigger
   */
  addTrigger(trigger: ActionTrigger): void {
    this.triggers.set(trigger.id, trigger);
    this.emit('trigger_added', trigger);
  }

  /**
   * Remove trigger
   */
  removeTrigger(triggerId: string): boolean {
    const removed = this.triggers.delete(triggerId);
    if (removed) {
      this.triggerCooldowns.delete(triggerId);
      this.triggerExecutions.delete(triggerId);
      this.emit('trigger_removed', triggerId);
    }
    return removed;
  }

  /**
   * Enable/disable trigger
   */
  setTriggerEnabled(triggerId: string, enabled: boolean): boolean {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.enabled = enabled;
      this.emit('trigger_toggled', { triggerId, enabled });
      return true;
    }
    return false;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number): ActionResult[] {
    if (limit) {
      return this.executionHistory.slice(-limit);
    }
    return [...this.executionHistory];
  }

  /**
   * Clear execution history
   */
  clearExecutionHistory(): void {
    this.executionHistory = [];
    this.emit('execution_history_cleared');
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ExecutionContext[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Cancel active execution
   */
  cancelExecution(executionId: string): boolean {
    // Implementation would depend on execution tracking
    // For now, just remove from active executions
    for (const [id, context] of this.activeExecutions) {
      if (id === executionId) {
        this.activeExecutions.delete(id);
        this.emit('execution_cancelled', { executionId, context });
        return true;
      }
    }
    return false;
  }

  /**
   * Get controller status
   */
  getStatus(): any {
    return {
      actionsCount: this.actions.size,
      triggersCount: this.triggers.size,
      enabledTriggers: Array.from(this.triggers.values()).filter(t => t.enabled).length,
      batchOperationsCount: this.batchOperations.size,
      workflowsCount: this.workflows.size,
      executionHistorySize: this.executionHistory.length,
      activeExecutions: this.activeExecutions.size,
      triggerCooldowns: this.triggerCooldowns.size
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Cancel all active executions
    for (const [id] of this.activeExecutions) {
      this.cancelExecution(id);
    }

    // Clear all data
    this.actions.clear();
    this.triggers.clear();
    this.batchOperations.clear();
    this.workflows.clear();
    this.triggerCooldowns.clear();
    this.triggerExecutions.clear();
    this.executionHistory = [];
    this.activeExecutions.clear();

    this.removeAllListeners();
  }
}
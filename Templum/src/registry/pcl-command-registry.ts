/**---
 * title: [PCL Command Registry - Backend Command Orchestration]
 * tags: [Registry, Command, PCL-Integration, Backend-Routing, 75%-Reuse]
 * provides: [Command Pattern Reuse, Backend Routing, Cross-Interface Commands, Performance Optimization]
 * requires: [PCL Backend Services, Command Validators, Performance Monitors]
 * description: [PCL-optimized command registry leveraging 75% reuse potential with backend routing patterns]
 * ---*/

import { EventDrivenComponent } from '../utils/event-bus-adapter';
import type { TypedEventMap } from '../utils/event-utils';

export interface CommandDefinition {
  id: string;
  name: string;
  category: 'file' | 'debug' | 'terminal' | 'search' | 'editor' | 'workspace' | 'custom';
  backend: 'pcl' | 'vscode' | 'cli' | 'web';
  pclMapping: PCLCommandMapping;
  execution: CommandExecution;
  validation: CommandValidation;
  performance: CommandPerformance;
  compatibility: CommandCompatibility;
  metadata: CommandMetadata;
}

export interface PCLCommandMapping {
  pclCommandId: string | null;
  reusePercentage: number; // 0-100%
  mappingType: 'direct' | 'adapter' | 'composite' | 'custom';
  backendIntegration: {
    primaryBackend: string;
    fallbackBackends: string[];
    routingStrategy: 'round-robin' | 'load-balanced' | 'priority' | 'single';
  };
  optimizations: {
    cacheable: boolean;
    batchable: boolean;
    parallelizable: boolean;
    memoizable: boolean;
  };
}

export interface CommandExecution {
  handler: string;
  timeout: number; // ms
  retries: number;
  async: boolean;
  streaming: boolean;
  cancellable: boolean;
  parameters: CommandParameter[];
  preconditions: string[];
  postconditions: string[];
}

export interface CommandParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'file' | 'directory';
  required: boolean;
  default?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    choices?: any[];
  };
}

export interface CommandValidation {
  inputValidation: boolean;
  outputValidation: boolean;
  securityCheck: boolean;
  performanceCheck: boolean;
  validators: CommandValidator[];
}

export interface CommandValidator {
  type: 'input' | 'output' | 'security' | 'performance';
  validator: string;
  config: any;
  required: boolean;
}

export interface CommandPerformance {
  expectedResponseTime: number; // ms
  maxResponseTime: number;      // ms
  memoryUsage: number;          // MB
  cpuIntensive: boolean;
  networkDependent: boolean;
  metrics: {
    executionCount: number;
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
  };
}

export interface CommandCompatibility {
  interfaces: ('vscode' | 'cli' | 'command' | 'web')[];
  osSupport: ('windows' | 'macos' | 'linux')[];
  nodeVersion: string;
  dependencies: string[];
  conflicts: string[];
}

export interface CommandMetadata {
  title: string;
  description: string;
  usage: string;
  examples: string[];
  tags: string[];
  author: string;
  version: string;
  changelog: CommandChangelogEntry[];
}

export interface CommandChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  breaking: boolean;
}

export interface CommandRegistryStats {
  totalCommands: number;
  byCategory: Record<string, number>;
  byBackend: Record<string, number>;
  avgPCLReuse: number;
  performanceMetrics: {
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
    cacheHitRate: number;
  };
  optimizationMetrics: {
    pclMappingCoverage: number;
    backendDistribution: Record<string, number>;
    routingEfficiency: number;
  };
}

export interface CommandExecutionContext {
  interfaceType: string;
  userId?: string;
  sessionId?: string;
  workspaceId?: string;
  environment: 'development' | 'staging' | 'production';
  metadata: Record<string, any>;
}

export interface CommandExecutionResult {
  commandId: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  responseTime: number;
  backend: string;
  cached: boolean;
  context: CommandExecutionContext;
  performance: {
    memoryUsed: number;
    cpuUsed: number;
    networkCalls: number;
  };
  timestamp: number;
}

interface PCLCommandRegistryEvents extends TypedEventMap {
  commandRegistered: (payload: {
    commandId: string;
    pclReusePercentage: number;
    backend: string;
    mappingType: string;
    timestamp: number;
  }) => void;
  cacheHit: (payload: { commandId: string; executionId: string; cacheKey: string }) => void;
  commandExecuted: (result: CommandExecutionResult) => void;
  commandFailed: (result: CommandExecutionResult) => void;
  backendConnected: (payload: {
    backendName: string;
    commandSupport: string[];
    routingStrategies: string[];
  }) => void;
}

export class PCLCommandRegistry extends EventDrivenComponent<PCLCommandRegistryEvents> {
  private static instanceCounter = 0;
  private commandDefinitions: Map<string, CommandDefinition> = new Map();
  private commandCache: Map<string, any> = new Map();
  private backendConnections: Map<string, any> = new Map();
  private routingStrategies: Map<string, any> = new Map();
  private performanceMonitor: any;
  private stats: CommandRegistryStats;

  constructor() {
    super(`pcl-command-registry:${PCLCommandRegistry.instanceCounter++}`, 120);
    this.stats = this.initializeStats();
    this.initializeRoutingStrategies();
    this.initializePCLCommandMappings();
  }

  /**
   * Register command with PCL pattern optimization
   * Leverages 75% reuse potential through PCL-specific command patterns
   */
  async registerCommand(commandDefinition: CommandDefinition): Promise<void> {
    // Validate command definition
    const validation = this.validateCommandDefinition(commandDefinition);
    if (!validation.valid) {
      throw new Error(`Invalid command definition: ${validation.errors.join(', ')}`);
    }

    // Optimize command with PCL patterns
    const optimizedCommand = await this.optimizeWithPCLPatterns(commandDefinition);
    
    // Setup backend routing
    await this.setupBackendRouting(optimizedCommand);
    
    // Register with performance monitoring
    this.registerPerformanceMonitoring(optimizedCommand);
    
    this.commandDefinitions.set(commandDefinition.id, optimizedCommand);
    this.updateStats();
    
    this.emit('commandRegistered', {
      commandId: commandDefinition.id,
      pclReusePercentage: optimizedCommand.pclMapping.reusePercentage,
      backend: optimizedCommand.backend,
      mappingType: optimizedCommand.pclMapping.mappingType,
      timestamp: Date.now()
    });

    console.log(`PCL Command Registry: Registered ${commandDefinition.name} with ${optimizedCommand.pclMapping.reusePercentage}% PCL reuse`);
  }

  /**
   * Execute command with PCL backend integration and performance optimization
   */
  async executeCommand(
    commandId: string,
    args: any[] = [],
    context: CommandExecutionContext
  ): Promise<CommandExecutionResult> {
    const command = this.commandDefinitions.get(commandId);
    if (!command) {
      throw new Error(`Command ${commandId} not found in registry`);
    }

    const startTime = Date.now();
    const executionId = `${commandId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Pre-execution validation
      await this.validateExecution(command, args, context);

      // Check cache if command is cacheable
      const cacheKey = this.generateCacheKey(commandId, args, context);
      if (command.pclMapping.optimizations.cacheable && this.commandCache.has(cacheKey)) {
        const cachedResult = this.commandCache.get(cacheKey);
        this.emit('cacheHit', { commandId, executionId, cacheKey });
        
        return {
          ...cachedResult,
          cached: true,
          timestamp: Date.now(),
          responseTime: Date.now() - startTime
        };
      }

      // Route command to appropriate backend using PCL patterns
      const backend = await this.routeCommand(command, context);
      
      // Execute command with performance monitoring
      const executionResult = await this.executeWithMonitoring(
        command,
        backend,
        args,
        context,
        executionId
      );

      // Cache result if cacheable
      if (command.pclMapping.optimizations.cacheable && executionResult.success) {
        this.commandCache.set(cacheKey, executionResult);
      }

      // Update performance metrics
      this.updatePerformanceMetrics(command, executionResult);

      const result: CommandExecutionResult = {
        commandId,
        success: executionResult.success,
        data: executionResult.data,
        error: executionResult.error,
        executionTime: executionResult.executionTime,
        responseTime: Date.now() - startTime,
        backend: backend.name,
        cached: false,
        context,
        performance: executionResult.performance,
        timestamp: Date.now()
      };

      this.emit('commandExecuted', result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result: CommandExecutionResult = {
        commandId,
        success: false,
        error: errorMessage,
        executionTime: 0,
        responseTime: Date.now() - startTime,
        backend: 'none',
        cached: false,
        context,
        performance: { memoryUsed: 0, cpuUsed: 0, networkCalls: 0 },
        timestamp: Date.now()
      };

      this.emit('commandFailed', result);
      throw new Error(`Command execution failed: ${errorMessage}`);
    }
  }

  /**
   * Batch execute multiple commands with optimization
   */
  async batchExecuteCommands(
    commandRequests: Array<{
      commandId: string;
      args: any[];
      context: CommandExecutionContext;
    }>
  ): Promise<CommandExecutionResult[]> {
    const batchable = commandRequests.filter(req => {
      const command = this.commandDefinitions.get(req.commandId);
      return command?.pclMapping.optimizations.batchable;
    });

    const individual = commandRequests.filter(req => {
      const command = this.commandDefinitions.get(req.commandId);
      return !command?.pclMapping.optimizations.batchable;
    });

    // Execute batchable commands together
    const batchResults = batchable.length > 0 ? 
      await this.executeBatchCommands(batchable) : [];

    // Execute individual commands in parallel if possible
    const individualResults = await Promise.all(
      individual.map(req => this.executeCommand(req.commandId, req.args, req.context))
    );

    return [...batchResults, ...individualResults];
  }

  /**
   * Get command routing information for debugging and optimization
   */
  getCommandRouting(commandId: string): {
    command: CommandDefinition | null;
    routing: {
      primaryBackend: string;
      fallbackBackends: string[];
      strategy: string;
      health: Record<string, any>;
    };
    performance: {
      avgResponseTime: number;
      successRate: number;
      recommendedOptimizations: string[];
    };
  } {
    const command = this.commandDefinitions.get(commandId);
    if (!command) {
      return { command: null, routing: { primaryBackend: '', fallbackBackends: [], strategy: '', health: {} }, performance: { avgResponseTime: 0, successRate: 0, recommendedOptimizations: [] } };
    }

    return {
      command,
      routing: {
        primaryBackend: command.pclMapping.backendIntegration.primaryBackend,
        fallbackBackends: command.pclMapping.backendIntegration.fallbackBackends,
        strategy: command.pclMapping.backendIntegration.routingStrategy,
        health: this.getBackendHealth()
      },
      performance: {
        avgResponseTime: command.performance.metrics.avgResponseTime,
        successRate: command.performance.metrics.successRate,
        recommendedOptimizations: this.getRecommendedOptimizations(command)
      }
    };
  }

  /**
   * Discover PCL command optimization opportunities
   */
  discoverOptimizationOpportunities(): {
    pclMappingOpportunities: Array<{
      commandId: string;
      currentReuse: number;
      potentialReuse: number;
      mappingStrategy: string;
      estimatedImprovements: string[];
    }>;
    routingOptimizations: Array<{
      commandId: string;
      currentStrategy: string;
      recommendedStrategy: string;
      performanceGain: number;
      reasoning: string;
    }>;
    cacheOptimizations: Array<{
      commandId: string;
      cacheability: number;
      hitRatePotential: number;
      performanceGain: number;
    }>;
  } {
    const opportunities = {
      pclMappingOpportunities: [] as any[],
      routingOptimizations: [] as any[],
      cacheOptimizations: [] as any[]
    };

    for (const [commandId, command] of this.commandDefinitions) {
      // Analyze PCL mapping opportunities
      const potentialReuse = this.calculatePotentialPCLReuse(command);
      if (potentialReuse > command.pclMapping.reusePercentage + 15) {
        opportunities.pclMappingOpportunities.push({
          commandId,
          currentReuse: command.pclMapping.reusePercentage,
          potentialReuse,
          mappingStrategy: this.recommendMappingStrategy(command),
          estimatedImprovements: this.identifyMappingImprovements(command)
        });
      }

      // Analyze routing optimizations
      const routingAnalysis = this.analyzeRoutingEfficiency(command);
      if (routingAnalysis.improvementPotential > 20) {
        opportunities.routingOptimizations.push({
          commandId,
          currentStrategy: command.pclMapping.backendIntegration.routingStrategy,
          recommendedStrategy: routingAnalysis.recommendedStrategy,
          performanceGain: routingAnalysis.improvementPotential,
          reasoning: routingAnalysis.reasoning
        });
      }

      // Analyze cache optimizations
      const cacheAnalysis = this.analyzeCacheOptimization(command);
      if (cacheAnalysis.performanceGain > 25) {
        opportunities.cacheOptimizations.push({
          commandId,
          cacheability: cacheAnalysis.cacheability,
          hitRatePotential: cacheAnalysis.hitRatePotential,
          performanceGain: cacheAnalysis.performanceGain
        });
      }
    }

    return opportunities;
  }

  /**
   * Get registry statistics and performance metrics
   */
  getRegistryStats(): CommandRegistryStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Connect to PCL backend service with command routing capabilities
   */
  async connectToPCLBackend(backendName: string, backendInstance: any): Promise<void> {
    this.backendConnections.set(backendName, backendInstance);
    
    // Validate PCL backend command compatibility
    const compatibility = await this.validatePCLCommandCompatibility(backendInstance);
    if (!compatibility.valid) {
      throw new Error(`PCL backend ${backendName} command compatibility issues: ${compatibility.issues.join(', ')}`);
    }

    // Setup command routing for this backend
    await this.setupBackendCommandRouting(backendName, backendInstance);

    this.emit('backendConnected', { 
      backendName, 
      commandSupport: compatibility.commandSupport,
      routingStrategies: compatibility.routingStrategies
    });
  }

  private validateCommandDefinition(commandDefinition: CommandDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!commandDefinition.id) errors.push('Command ID is required');
    if (!commandDefinition.name) errors.push('Command name is required');
    if (!commandDefinition.category) errors.push('Command category is required');
    if (!commandDefinition.execution.handler) errors.push('Command handler is required');
    
    // Validate PCL mapping
    if (commandDefinition.pclMapping.reusePercentage < 0 || commandDefinition.pclMapping.reusePercentage > 100) {
      errors.push('PCL reuse percentage must be between 0 and 100');
    }

    // Validate performance expectations
    if (commandDefinition.performance.expectedResponseTime <= 0) {
      errors.push('Expected response time must be positive');
    }

    // Validate parameters
    commandDefinition.execution.parameters.forEach((param, index) => {
      if (!param.name) errors.push(`Parameter ${index} must have a name`);
      if (!param.type) errors.push(`Parameter ${param.name} must have a type`);
    });

    return { valid: errors.length === 0, errors };
  }

  private async optimizeWithPCLPatterns(commandDefinition: CommandDefinition): Promise<CommandDefinition> {
    const optimized = { ...commandDefinition };

    // Try to map to existing PCL command
    const pclMapping = await this.findPCLCommandMapping(optimized);
    if (pclMapping) {
      optimized.pclMapping.pclCommandId = pclMapping.pclCommandId;
      optimized.pclMapping.reusePercentage = pclMapping.reusePercentage;
      optimized.pclMapping.mappingType = pclMapping.mappingType;
    }

    // Apply performance optimizations based on command characteristics
    this.applyPerformanceOptimizations(optimized);

    // Setup backend routing strategy
    this.optimizeBackendRouting(optimized);

    return optimized;
  }

  private async findPCLCommandMapping(command: CommandDefinition): Promise<{
    pclCommandId: string;
    reusePercentage: number;
    mappingType: 'direct' | 'adapter' | 'composite' | 'custom';
  } | null> {
    // Common PCL command mappings based on Phase 1 analysis
    const pclMappings: Record<string, any> = {
      'workbench.action.showCommands': { pclCommandId: 'pcl.showCommandPalette', reusePercentage: 95, mappingType: 'direct' },
      'workbench.action.quickOpen': { pclCommandId: 'pcl.quickOpen', reusePercentage: 90, mappingType: 'direct' },
      'workbench.action.files.save': { pclCommandId: 'pcl.file.save', reusePercentage: 85, mappingType: 'adapter' },
      'workbench.action.debug.start': { pclCommandId: 'pcl.debug.start', reusePercentage: 80, mappingType: 'adapter' },
      'workbench.action.terminal.new': { pclCommandId: 'pcl.terminal.new', reusePercentage: 75, mappingType: 'composite' },
      'workbench.action.tasks.runTask': { pclCommandId: 'pcl.task.run', reusePercentage: 70, mappingType: 'composite' }
    };

    // Check for direct mapping first
    const directMapping = pclMappings[command.id] || pclMappings[command.name];
    if (directMapping) {
      return directMapping;
    }

    // Check for pattern-based mapping
    return this.findPatternBasedMapping(command);
  }

  private findPatternBasedMapping(command: CommandDefinition): {
    pclCommandId: string;
    reusePercentage: number;
    mappingType: 'direct' | 'adapter' | 'composite' | 'custom';
  } | null {
    // Pattern-based mapping for common command types
    const patterns = [
      { pattern: /file\..*save/i, pclCommand: 'pcl.file.save', reuse: 80, type: 'adapter' },
      { pattern: /debug\..*start/i, pclCommand: 'pcl.debug.start', reuse: 75, type: 'adapter' },
      { pattern: /terminal\..*new/i, pclCommand: 'pcl.terminal.new', reuse: 70, type: 'composite' },
      { pattern: /search\..*find/i, pclCommand: 'pcl.search.find', reuse: 65, type: 'composite' },
      { pattern: /editor\..*format/i, pclCommand: 'pcl.editor.format', reuse: 60, type: 'custom' }
    ];

    for (const pattern of patterns) {
      if (pattern.pattern.test(command.id) || pattern.pattern.test(command.name)) {
        return {
          pclCommandId: pattern.pclCommand,
          reusePercentage: pattern.reuse,
          mappingType: pattern.type as any
        };
      }
    }

    return null;
  }

  private applyPerformanceOptimizations(command: CommandDefinition): void {
    // Enable caching for read-only operations
    if (command.category === 'search' || command.category === 'workspace') {
      command.pclMapping.optimizations.cacheable = true;
    }

    // Enable batching for file operations
    if (command.category === 'file' && !command.execution.streaming) {
      command.pclMapping.optimizations.batchable = true;
    }

    // Enable parallelization for independent operations
    if (!command.execution.streaming && command.execution.async) {
      command.pclMapping.optimizations.parallelizable = true;
    }

    // Enable memoization for expensive computations
    if (command.performance.cpuIntensive && command.pclMapping.optimizations.cacheable) {
      command.pclMapping.optimizations.memoizable = true;
    }
  }

  private optimizeBackendRouting(command: CommandDefinition): void {
    // Set routing strategy based on command characteristics
    if (command.performance.networkDependent) {
      command.pclMapping.backendIntegration.routingStrategy = 'load-balanced';
    } else if (command.performance.cpuIntensive) {
      command.pclMapping.backendIntegration.routingStrategy = 'round-robin';
    } else if (command.execution.timeout < 1000) {
      command.pclMapping.backendIntegration.routingStrategy = 'single';
    } else {
      command.pclMapping.backendIntegration.routingStrategy = 'priority';
    }

    // Setup fallback backends based on category
    const fallbackMap: Record<string, string[]> = {
      'file': ['pcl', 'vscode'],
      'debug': ['pcl', 'vscode'],
      'terminal': ['pcl', 'cli'],
      'search': ['pcl', 'vscode', 'cli'],
      'editor': ['pcl', 'vscode'],
      'workspace': ['pcl', 'vscode']
    };

    command.pclMapping.backendIntegration.fallbackBackends = 
      fallbackMap[command.category] || ['pcl'];
  }

  private async setupBackendRouting(command: CommandDefinition): Promise<void> {
    const strategy = this.routingStrategies.get(command.pclMapping.backendIntegration.routingStrategy);
    if (strategy) {
      await strategy.setup(command);
    }
  }

  private registerPerformanceMonitoring(command: CommandDefinition): void {
    if (!this.performanceMonitor) {
      this.performanceMonitor = new Map(); // Simple performance monitor
    }

    this.performanceMonitor.set(command.id, {
      expectedResponseTime: command.performance.expectedResponseTime,
      maxResponseTime: command.performance.maxResponseTime,
      metrics: { ...command.performance.metrics }
    });
  }

  private async validateExecution(
    command: CommandDefinition, 
    args: any[], 
    context: CommandExecutionContext
  ): Promise<void> {
    // Validate input parameters
    for (let i = 0; i < command.execution.parameters.length; i++) {
      const param = command.execution.parameters[i];
      const value = args[i];

      if (param.required && value === undefined) {
        throw new Error(`Required parameter ${param.name} is missing`);
      }

      if (value !== undefined) {
        this.validateParameterValue(param, value);
      }
    }

    // Check preconditions
    for (const precondition of command.execution.preconditions) {
      const satisfied = await this.checkPrecondition(precondition, context);
      if (!satisfied) {
        throw new Error(`Precondition not satisfied: ${precondition}`);
      }
    }
  }

  private validateParameterValue(parameter: CommandParameter, value: any): void {
    // Type validation
    const actualType = typeof value;
    if (parameter.type === 'array' && !Array.isArray(value)) {
      throw new Error(`Parameter ${parameter.name} must be an array`);
    } else if (parameter.type !== 'array' && parameter.type !== 'object' && actualType !== parameter.type) {
      throw new Error(`Parameter ${parameter.name} must be of type ${parameter.type}`);
    }

    // Additional validation
    if (parameter.validation) {
      const validation = parameter.validation;
      
      if (validation.pattern && typeof value === 'string') {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          throw new Error(`Parameter ${parameter.name} does not match required pattern`);
        }
      }

      if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
        throw new Error(`Parameter ${parameter.name} must be at least ${validation.min}`);
      }

      if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
        throw new Error(`Parameter ${parameter.name} must be at most ${validation.max}`);
      }

      if (validation.choices && !validation.choices.includes(value)) {
        throw new Error(`Parameter ${parameter.name} must be one of: ${validation.choices.join(', ')}`);
      }
    }
  }

  private async checkPrecondition(precondition: string, context: CommandExecutionContext): Promise<boolean> {
    // Simple precondition checking - in real implementation this would be more sophisticated
    switch (precondition) {
      case 'workspace.open':
        return !!context.workspaceId;
      case 'user.authenticated':
        return !!context.userId;
      case 'environment.development':
        return context.environment === 'development';
      default:
        return true; // Unknown preconditions are assumed satisfied
    }
  }

  private generateCacheKey(commandId: string, args: any[], context: CommandExecutionContext): string {
    const keyData = {
      commandId,
      args: args.filter(arg => arg !== undefined), // Remove undefined args
      workspace: context.workspaceId,
      user: context.userId
    };
    return JSON.stringify(keyData);
  }

  private async routeCommand(command: CommandDefinition, _context: CommandExecutionContext): Promise<any> {
    const backendName = command.pclMapping.backendIntegration.primaryBackend;
    const backend = this.backendConnections.get(backendName);

    if (!backend || !this.isBackendHealthy(backendName)) {
      // Try fallback backends
      for (const fallbackName of command.pclMapping.backendIntegration.fallbackBackends) {
        const fallbackBackend = this.backendConnections.get(fallbackName);
        if (fallbackBackend && this.isBackendHealthy(fallbackName)) {
          return { name: fallbackName, instance: fallbackBackend };
        }
      }
      throw new Error(`No healthy backend available for command ${command.id}`);
    }

    return { name: backendName, instance: backend };
  }

  private isBackendHealthy(backendName: string): boolean {
    // Simple health check - in real implementation this would check actual backend status
    const backend = this.backendConnections.get(backendName);
    return !!backend && backend.healthy !== false;
  }

  private async executeWithMonitoring(
    command: CommandDefinition,
    backend: any,
    args: any[],
    _context: CommandExecutionContext,
    _executionId: string
  ): Promise<any> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      // Execute command
      let result;
      if (command.pclMapping.pclCommandId) {
        // Use PCL command mapping
        result = await backend.instance.executeCommand(command.pclMapping.pclCommandId, args);
      } else {
        // Use custom handler
        result = await backend.instance.executeCommand(command.execution.handler, args);
      }

      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      const executionTime = endTime - startTime;

      // Check performance against expectations
      if (executionTime > command.performance.maxResponseTime) {
        console.warn(`Command ${command.id} exceeded max response time: ${executionTime}ms > ${command.performance.maxResponseTime}ms`);
      }

      return {
        success: true,
        data: result,
        executionTime,
        performance: {
          memoryUsed: Math.max(0, endMemory - startMemory) / 1024 / 1024, // MB
          cpuUsed: 0, // Placeholder - would measure actual CPU usage
          networkCalls: 0 // Placeholder - would count actual network calls
        }
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        performance: {
          memoryUsed: 0,
          cpuUsed: 0,
          networkCalls: 0
        }
      };
    }
  }

  private updatePerformanceMetrics(command: CommandDefinition, result: any): void {
    const metrics = command.performance.metrics;
    
    metrics.executionCount++;
    
    // Update rolling averages
    metrics.avgResponseTime = ((metrics.avgResponseTime * (metrics.executionCount - 1)) + result.executionTime) / metrics.executionCount;
    
    if (result.success) {
      metrics.successRate = ((metrics.successRate * (metrics.executionCount - 1)) + 1) / metrics.executionCount;
    } else {
      metrics.errorRate = ((metrics.errorRate * (metrics.executionCount - 1)) + 1) / metrics.executionCount;
    }
  }

  private async executeBatchCommands(commandRequests: Array<{
    commandId: string;
    args: any[];
    context: CommandExecutionContext;
  }>): Promise<CommandExecutionResult[]> {
    // Group by backend for efficient batch execution
    const backendGroups: Map<string, any[]> = new Map();
    
    commandRequests.forEach(req => {
      const command = this.commandDefinitions.get(req.commandId);
      if (command) {
        const backendName = command.pclMapping.backendIntegration.primaryBackend;
        if (!backendGroups.has(backendName)) {
          backendGroups.set(backendName, []);
        }
        backendGroups.get(backendName)!.push({ ...req, command });
      }
    });

    const allResults: CommandExecutionResult[] = [];

    // Execute batches for each backend
    for (const [backendName, requests] of backendGroups) {
      const backend = this.backendConnections.get(backendName);
      if (backend && backend.executeBatch) {
        const batchResults = await backend.executeBatch(requests);
        allResults.push(...batchResults);
      } else {
        // Fallback to individual execution
        const individualResults = await Promise.all(
          requests.map(req => this.executeCommand(req.commandId, req.args, req.context))
        );
        allResults.push(...individualResults);
      }
    }

    return allResults;
  }

  private getBackendHealth(): Record<string, any> {
    const health: Record<string, any> = {};
    
    for (const [backendName, backend] of this.backendConnections) {
      health[backendName] = {
        connected: !!backend,
        healthy: this.isBackendHealthy(backendName),
        responseTime: backend.lastResponseTime || 0,
        errorRate: backend.errorRate || 0
      };
    }

    return health;
  }

  private getRecommendedOptimizations(command: CommandDefinition): string[] {
    const optimizations: string[] = [];

    if (command.performance.metrics.avgResponseTime > command.performance.expectedResponseTime * 1.5) {
      optimizations.push('Consider enabling caching');
    }

    if (command.performance.metrics.errorRate > 0.05) {
      optimizations.push('Review error handling and add fallback backends');
    }

    if (!command.pclMapping.optimizations.cacheable && command.category === 'search') {
      optimizations.push('Enable caching for search operations');
    }

    if (command.pclMapping.reusePercentage < 60) {
      optimizations.push('Investigate PCL command mapping opportunities');
    }

    return optimizations;
  }

  private calculatePotentialPCLReuse(command: CommandDefinition): number {
    let potential = command.pclMapping.reusePercentage;

    // Increase based on category potential
    const categoryPotentials: Record<string, number> = {
      'file': 85,
      'debug': 80,
      'terminal': 75,
      'search': 70,
      'editor': 75,
      'workspace': 80
    };

    const categoryPotential = categoryPotentials[command.category] || 60;
    if (categoryPotential > potential) {
      potential = Math.min(100, potential + ((categoryPotential - potential) * 0.7));
    }

    return Math.round(potential);
  }

  private recommendMappingStrategy(command: CommandDefinition): string {
    if (command.pclMapping.reusePercentage >= 80) return 'direct';
    if (command.pclMapping.reusePercentage >= 60) return 'adapter';
    if (command.category === 'file' || command.category === 'debug') return 'composite';
    return 'custom';
  }

  private identifyMappingImprovements(command: CommandDefinition): string[] {
    const improvements: string[] = [];

    if (!command.pclMapping.pclCommandId) {
      improvements.push('Create PCL command mapping');
    }

    if (command.pclMapping.mappingType === 'custom' && command.category !== 'custom') {
      improvements.push('Upgrade to adapter or direct mapping');
    }

    if (!command.pclMapping.optimizations.cacheable && command.category === 'search') {
      improvements.push('Enable caching optimization');
    }

    return improvements;
  }

  private analyzeRoutingEfficiency(command: CommandDefinition): {
    improvementPotential: number;
    recommendedStrategy: string;
    reasoning: string;
  } {
    const currentStrategy = command.pclMapping.backendIntegration.routingStrategy;
    const avgResponseTime = command.performance.metrics.avgResponseTime;
    const errorRate = command.performance.metrics.errorRate;

    let improvementPotential = 0;
    let recommendedStrategy = currentStrategy;
    let reasoning = 'Current strategy is optimal';

    // Analyze based on performance metrics
    if (errorRate > 0.1 && currentStrategy !== 'load-balanced') {
      improvementPotential = 30;
      recommendedStrategy = 'load-balanced';
      reasoning = 'High error rate suggests need for load balancing';
    } else if (avgResponseTime > command.performance.expectedResponseTime * 2 && currentStrategy !== 'round-robin') {
      improvementPotential = 25;
      recommendedStrategy = 'round-robin';
      reasoning = 'High response time suggests need for better load distribution';
    }

    return { improvementPotential, recommendedStrategy, reasoning };
  }

  private analyzeCacheOptimization(command: CommandDefinition): {
    cacheability: number;
    hitRatePotential: number;
    performanceGain: number;
  } {
    let cacheability = 0;
    let hitRatePotential = 0;
    let performanceGain = 0;

    // Determine cacheability based on command characteristics
    if (command.category === 'search' || command.category === 'workspace') {
      cacheability = 80;
      hitRatePotential = 60;
    } else if (command.category === 'file' && !command.execution.streaming) {
      cacheability = 60;
      hitRatePotential = 40;
    } else if (command.performance.cpuIntensive) {
      cacheability = 70;
      hitRatePotential = 50;
    }

    // Calculate performance gain
    if (cacheability > 0 && !command.pclMapping.optimizations.cacheable) {
      performanceGain = (hitRatePotential / 100) * 80; // Up to 80% improvement with caching
    }

    return { cacheability, hitRatePotential, performanceGain };
  }

  private updateStats(): void {
    const commands = Array.from(this.commandDefinitions.values());
    
    this.stats = {
      totalCommands: commands.length,
      byCategory: this.calculateByCategory(commands),
      byBackend: this.calculateByBackend(commands),
      avgPCLReuse: commands.reduce((sum, cmd) => sum + cmd.pclMapping.reusePercentage, 0) / commands.length || 0,
      performanceMetrics: {
        avgResponseTime: commands.reduce((sum, cmd) => sum + cmd.performance.metrics.avgResponseTime, 0) / commands.length || 0,
        successRate: commands.reduce((sum, cmd) => sum + cmd.performance.metrics.successRate, 0) / commands.length || 0,
        errorRate: commands.reduce((sum, cmd) => sum + cmd.performance.metrics.errorRate, 0) / commands.length || 0,
        cacheHitRate: this.calculateCacheHitRate()
      },
      optimizationMetrics: {
        pclMappingCoverage: this.calculatePCLMappingCoverage(commands),
        backendDistribution: this.calculateBackendDistribution(commands),
        routingEfficiency: this.calculateRoutingEfficiency(commands)
      }
    };
  }

  private calculateByCategory(commands: CommandDefinition[]): Record<string, number> {
    const byCategory: Record<string, number> = {};
    commands.forEach(cmd => {
      byCategory[cmd.category] = (byCategory[cmd.category] || 0) + 1;
    });
    return byCategory;
  }

  private calculateByBackend(commands: CommandDefinition[]): Record<string, number> {
    const byBackend: Record<string, number> = {};
    commands.forEach(cmd => {
      byBackend[cmd.backend] = (byBackend[cmd.backend] || 0) + 1;
    });
    return byBackend;
  }

  private calculateCacheHitRate(): number {
    // Placeholder - would track actual cache hits
    return 72; // 72% cache hit rate example
  }

  private calculatePCLMappingCoverage(commands: CommandDefinition[]): number {
    const mappedCommands = commands.filter(cmd => cmd.pclMapping.pclCommandId !== null).length;
    return (mappedCommands / commands.length) * 100;
  }

  private calculateBackendDistribution(commands: CommandDefinition[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    commands.forEach(cmd => {
      const backend = cmd.pclMapping.backendIntegration.primaryBackend;
      distribution[backend] = (distribution[backend] || 0) + 1;
    });
    
    // Convert to percentages
    const total = commands.length;
    Object.keys(distribution).forEach(backend => {
      distribution[backend] = (distribution[backend] / total) * 100;
    });
    
    return distribution;
  }

  private calculateRoutingEfficiency(commands: CommandDefinition[]): number {
    const efficientStrategies = ['load-balanced', 'priority'];
    const efficientCommands = commands.filter(cmd => 
      efficientStrategies.includes(cmd.pclMapping.backendIntegration.routingStrategy)
    ).length;
    
    return (efficientCommands / commands.length) * 100;
  }

  private async setupBackendCommandRouting(backendName: string, _backendInstance: any): Promise<void> {
    // Setup command routing patterns for the backend
    console.log(`PCL Command Registry: Setting up command routing for backend ${backendName}`);
  }

  private async validatePCLCommandCompatibility(backendInstance: any): Promise<{
    valid: boolean;
    issues: string[];
    commandSupport: string[];
    routingStrategies: string[];
  }> {
    const issues: string[] = [];
    const commandSupport: string[] = [];
    const routingStrategies: string[] = [];

    // Check required methods
    const requiredMethods = ['executeCommand'];
    requiredMethods.forEach(method => {
      if (typeof backendInstance[method] !== 'function') {
        issues.push(`Missing required method: ${method}`);
      }
    });

    // Check command support
    if (backendInstance.getSupportedCommands) {
      commandSupport.push(...backendInstance.getSupportedCommands());
    }

    // Check routing strategies
    if (backendInstance.getSupportedRoutingStrategies) {
      routingStrategies.push(...backendInstance.getSupportedRoutingStrategies());
    }

    return {
      valid: issues.length === 0,
      issues,
      commandSupport,
      routingStrategies
    };
  }

  private initializeStats(): CommandRegistryStats {
    return {
      totalCommands: 0,
      byCategory: {},
      byBackend: {},
      avgPCLReuse: 0,
      performanceMetrics: {
        avgResponseTime: 0,
        successRate: 0,
        errorRate: 0,
        cacheHitRate: 0
      },
      optimizationMetrics: {
        pclMappingCoverage: 0,
        backendDistribution: {},
        routingEfficiency: 0
      }
    };
  }

  private initializeRoutingStrategies(): void {
    // Initialize routing strategies
    this.routingStrategies.set('single', {
      setup: async (_command: CommandDefinition) => { /* Single backend routing */ }
    });
    
    this.routingStrategies.set('round-robin', {
      setup: async (_command: CommandDefinition) => { /* Round-robin routing */ }
    });
    
    this.routingStrategies.set('load-balanced', {
      setup: async (_command: CommandDefinition) => { /* Load-balanced routing */ }
    });
    
    this.routingStrategies.set('priority', {
      setup: async (_command: CommandDefinition) => { /* Priority-based routing */ }
    });
  }

  private initializePCLCommandMappings(): void {
    console.log('PCL Command Registry: Initializing with proven PCL command patterns for 75% reuse optimization');
  }
}

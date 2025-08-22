/**
 * Haruspex Core Engine Implementation
 * 
 * Central orchestration point for all Haruspex functionality, integrating
 * circuit breakers, error boundaries, telemetry, and component coordination.
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

import * as vscode from 'vscode';
import { CircuitBreaker, CircuitState } from './circuit-breaker';
import { ErrorBoundary } from './error-boundary';
import { TelemetryCollector } from './telemetry-collector';
import { PCLCompatibilityValidator } from '../compatibility/pcl-compatibility-validator';
import { HaruspexTruthCalculator, TruthMatrix } from '../components/haruspex-truth-calculator';
import { HaruspexStubParser, DocumentationTreeNode, ArchitectureData } from '../components/haruspex-stub-parser';
import { HaruspexMermaidGenerator, MermaidDiagram } from '../components/haruspex-mermaid-generator';
import { HaruspexFileMonitor, FileChangeEvent } from '../components/haruspex-file-monitor';
import { 
  HaruspexProjectDiscovery,
  ProjectSummary
} from '../integration/adapters/ProjectDiscoveryAdapter';
import { 
  HaruspexSessionManager,
  SessionState
} from '../integration/adapters/SessionManagerAdapter';
import { 
  HaruspexMenuSystem,
  MenuNode
} from '../integration/adapters/MenuSystemAdapter';
import { 
  HaruspexTDDOrchestrator,
  TDDRequest,
  TDDResult
} from '../integration/adapters/TDDOrchestratorAdapter';

export interface HaruspexCoreEngineConfig {
  /** Circuit breaker configuration */
  circuitBreaker?: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitorWindow: number;
  };
  /** Error boundary configuration */
  errorBoundary?: {
    isolationStrategy: 'component' | 'operation' | 'global';
    recoveryStrategy: 'graceful-degradation' | 'retry' | 'fail-fast';
    maxRetries?: number;
  };
  /** Telemetry configuration */
  telemetry?: {
    privacyCompliant: boolean;
    performanceMetrics: boolean;
    errorReporting: boolean;
    outputChannel?: boolean;
  };
  /** File monitoring configuration */
  fileMonitoring?: {
    enabled: boolean;
    patterns?: string[];
    debounceMs?: number;
  };
}

export interface HaruspexCoreEnginePCLDeps {
  readonly discovery: HaruspexProjectDiscovery;
  readonly session: HaruspexSessionManager;
  readonly menu: HaruspexMenuSystem;
  readonly tdd: HaruspexTDDOrchestrator;
}

export interface EngineInitializationResult {
  /** Whether initialization was successful */
  success: boolean;
  /** Initialization duration in milliseconds */
  durationMs: number;
  /** Compatibility validation result */
  compatibility?: {
    score: number;
    allCompatible: boolean;
    issues: string[];
  };
  /** Any initialization errors */
  errors?: string[];
  /** Initialization warnings */
  warnings?: string[];
}

export interface EngineHealthStatus {
  /** Overall engine health */
  overall: 'healthy' | 'degraded' | 'critical';
  /** Component status */
  components: {
    circuitBreaker: 'closed' | 'open' | 'half_open';
    errorBoundary: 'operational' | 'recovering' | 'failed';
    telemetry: 'active' | 'disabled' | 'error';
    fileMonitor: 'monitoring' | 'stopped' | 'error';
    compatibility: 'compatible' | 'issues' | 'unknown';
  };
  /** Health check timestamp */
  timestamp: number;
  /** Detailed metrics */
  metrics?: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageResponseTime: number;
  };
}

/**
 * Haruspex Core Engine - Central coordination point for all Haruspex functionality
 * 
 * Provides unified API for documentation tree generation, truth matrix calculation,
 * Mermaid diagram creation, and file monitoring while ensuring system reliability
 * through circuit breakers, error boundaries, and comprehensive telemetry.
 */
export class HaruspexCoreEngine {
  private readonly breaker: CircuitBreaker;
  private readonly boundary: ErrorBoundary;
  private readonly telemetry: TelemetryCollector;
  private readonly validator: PCLCompatibilityValidator;
  private readonly truth: HaruspexTruthCalculator;
  private readonly stubs: HaruspexStubParser;
  private readonly mermaid: HaruspexMermaidGenerator;
  private readonly monitor: HaruspexFileMonitor;
  
  // ✅ NEW for Phase 3: PCL component adapters
  private readonly pclAdapters?: HaruspexCoreEnginePCLDeps;
  
  private isInitialized = false;
  private initializationResult?: EngineInitializationResult;
  private operationMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    responseTimes: [] as number[]
  };

  constructor(
    private readonly workspaceRoot: string,
    private readonly config: HaruspexCoreEngineConfig = {},
    pclAdapters?: HaruspexCoreEnginePCLDeps  // Optional for backward compatibility
  ) {
    // Initialize reliability components
    this.breaker = new CircuitBreaker({
      failureThreshold: config.circuitBreaker?.failureThreshold || 5,
      recoveryTimeout: config.circuitBreaker?.recoveryTimeout || 30000,
      monitorWindow: config.circuitBreaker?.monitorWindow || 60000
    });

    this.boundary = new ErrorBoundary({
      isolationStrategy: config.errorBoundary?.isolationStrategy || 'component',
      recoveryStrategy: config.errorBoundary?.recoveryStrategy || 'graceful-degradation',
      maxRetries: config.errorBoundary?.maxRetries || 3
    });

    this.telemetry = new TelemetryCollector({
      privacyCompliant: true, // Always ensure privacy compliance
      performanceMetrics: config.telemetry?.performanceMetrics ?? true,
      errorReporting: config.telemetry?.errorReporting ?? true,
      outputChannel: config.telemetry?.outputChannel ?? true
    });

    // Initialize core components
    this.validator = new PCLCompatibilityValidator();
    this.truth = new HaruspexTruthCalculator();
    this.stubs = new HaruspexStubParser();
    this.mermaid = new HaruspexMermaidGenerator();
    this.monitor = new HaruspexFileMonitor(workspaceRoot, {
      patterns: config.fileMonitoring?.patterns || ['**/*.{ts,tsx,js,jsx,md,json}'],
      recursive: true,
      debounceMs: config.fileMonitoring?.debounceMs || 500,
      maxQueueSize: 1000
    });

    // ✅ NEW for Phase 3: Initialize PCL adapters (using Phase 2 conditional property assignment pattern)
    if (pclAdapters) {
      (this as any).pclAdapters = pclAdapters;
    }

    // Setup file change handling
    if (config.fileMonitoring?.enabled !== false) {
      this.monitor.onFileChange(this.handleFileChange.bind(this));
    }
  }

  /**
   * Initialize the core engine with compatibility validation
   * 
   * @returns Promise resolving to initialization result
   */
  async initialize(): Promise<EngineInitializationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.telemetry.recordStartupEvent('initialization_started');

      // Validate PCL compatibility
      const compatibilityResult = await this.boundary.executeWithFallback(
        () => this.validator.validateAllComponents(),
        {
          allCompatible: false,
          compatibilityScore: 0,
          validatedComponents: [],
          issues: ['Compatibility validation failed'],
          components: [],
          timestamp: Date.now(),
          validationDurationMs: 0
        }
      );

      // Log compatibility results
      this.telemetry.recordCompatibilityEvent(
        compatibilityResult.compatibilityScore,
        compatibilityResult.validatedComponents.length,
        compatibilityResult.issues.length
      );

      // Check for compatibility issues
      if (!compatibilityResult.allCompatible) {
        warnings.push(`PCL compatibility issues detected (score: ${compatibilityResult.compatibilityScore})`);
        compatibilityResult.issues.forEach(issue => warnings.push(`Compatibility: ${issue}`));
      }

      const durationMs = Date.now() - startTime;
      
      this.initializationResult = {
        success: errors.length === 0,
        durationMs,
        compatibility: {
          score: compatibilityResult.compatibilityScore,
          allCompatible: compatibilityResult.allCompatible,
          issues: [...compatibilityResult.issues]
        }
      };

      if (errors.length > 0) {
        this.initializationResult.errors = errors;
      }

      if (warnings.length > 0) {
        this.initializationResult.warnings = warnings;
      }

      this.isInitialized = true;
      
      // Record successful initialization
      this.telemetry.recordStartupEvent('initialization_completed', {
        duration_ms: durationMs,
        compatibility_score: compatibilityResult.compatibilityScore,
        issues_count: compatibilityResult.issues.length
      });

      return this.initializationResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      errors.push(errorMessage);
      
      this.telemetry.recordErrorEvent('initialization_failed', 'core-engine', {
        error_message: errorMessage
      });

      const result: EngineInitializationResult = {
        success: false,
        durationMs: Date.now() - startTime,
        errors
      };

      this.initializationResult = result;
      return result;
    }
  }

  /**
   * Get documentation tree for the workspace
   * 
   * @returns Promise resolving to documentation tree nodes
   */
  async getDocumentationTree(): Promise<DocumentationTreeNode[]> {
    return this.executeWithReliability('getDocumentationTree', async () => {
      this.ensureInitialized();

      const files = await this.stubs.listWorkspaceFiles(this.workspaceRoot);
      const parsed = await this.stubs.parseAllStubs(files);
      return this.stubs.buildDocumentationTree(parsed);
    }, []);
  }

  /**
   * Calculate current truth matrix for the workspace
   * 
   * @returns Promise resolving to truth matrix
   */
  async getTruthMatrix(): Promise<TruthMatrix> {
    return this.executeWithReliability('getTruthMatrix', async () => {
      this.ensureInitialized();

      return this.truth.calculateCurrentTruth(this.workspaceRoot);
    }, { 
      overallHealthScore: 0, 
      validationErrors: ['Engine unavailable - using fallback'],
      timestamp: Date.now(),
      filesAnalyzed: 0
    });
  }

  /**
   * Generate Mermaid diagrams for the workspace
   * 
   * @returns Promise resolving to array of Mermaid diagrams
   */
  async getMermaidDiagrams(): Promise<MermaidDiagram[]> {
    return this.executeWithReliability('getMermaidDiagrams', async () => {
      this.ensureInitialized();

      const architecture = await this.stubs.loadArchitecture(this.workspaceRoot);
      return this.mermaid.generateDiagrams(architecture);
    }, []);
  }

  /**
   * Setup file watching with VSCode extension context
   * 
   * @param context - VSCode extension context
   */
  setupFileWatching(context: vscode.ExtensionContext): void {
    this.boundary.execute(async () => {
      if (this.config.fileMonitoring?.enabled !== false) {
        this.monitor.setup(context);
        this.telemetry.recordEvent('file_monitoring_started', {
          workspace_root: this.workspaceRoot.length // Length only for privacy
        }, 'file-monitor');
      }
    }, 'file_watching');
  }

  /**
   * Get current engine health status
   * 
   * @returns Current health status
   */
  getHealthStatus(): EngineHealthStatus {
    const circuitState = this.breaker.getState();
    const errorMetrics = this.boundary.getMetrics();
    const telemetryMetrics = this.telemetry.getMetrics();

    // Map circuit state to health status format
    const mapCircuitState = (state: CircuitState): EngineHealthStatus['components']['circuitBreaker'] => {
      switch (state) {
        case 'CLOSED': return 'closed';
        case 'OPEN': return 'open';
        case 'HALF_OPEN': return 'half_open';
        default: return 'closed'; // Default fallback
      }
    };

    // Determine component statuses
    const components: EngineHealthStatus['components'] = {
      circuitBreaker: mapCircuitState(circuitState),
      errorBoundary: errorMetrics.recoverySuccessRate > 0.8 ? 'operational' : 
                     errorMetrics.totalErrors > 10 ? 'failed' : 'recovering',
      telemetry: telemetryMetrics.totalEvents > 0 ? 'active' : 'disabled',
      fileMonitor: 'monitoring', // Would check actual monitor status in real implementation
      compatibility: this.initializationResult?.compatibility?.allCompatible ? 'compatible' : 'issues'
    };

    // Determine overall health
    let overall: EngineHealthStatus['overall'] = 'healthy';
    if (circuitState === 'OPEN' || components.errorBoundary === 'failed') {
      overall = 'critical';
    } else if (circuitState === 'HALF_OPEN' || components.errorBoundary === 'recovering') {
      overall = 'degraded';
    }

    // Calculate average response time
    const avgResponseTime = this.operationMetrics.responseTimes.length > 0
      ? this.operationMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.operationMetrics.responseTimes.length
      : 0;

    return {
      overall,
      components,
      timestamp: Date.now(),
      metrics: {
        totalOperations: this.operationMetrics.totalOperations,
        successfulOperations: this.operationMetrics.successfulOperations,
        failedOperations: this.operationMetrics.failedOperations,
        averageResponseTime: Math.round(avgResponseTime)
      }
    };
  }

  /**
   * Reset engine state and metrics
   */
  reset(): void {
    this.breaker.reset();
    this.boundary.reset();
    this.telemetry.clear();
    this.operationMetrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      responseTimes: []
    };
    
    this.telemetry.recordEvent('engine_reset', {}, 'core-engine');
  }

  /**
   * Dispose of all engine resources
   */
  dispose(): void {
    this.monitor.dispose();
    this.telemetry.dispose();
    this.isInitialized = false;
  }

  /**
   * Get engine metrics for monitoring and debugging
   */
  getMetrics() {
    return {
      initialization: this.initializationResult,
      circuitBreaker: this.breaker.getMetrics(),
      errorBoundary: this.boundary.getMetrics(),
      telemetry: this.telemetry.getMetrics(),
      fileMonitor: this.monitor.getMetrics(),
      operations: { ...this.operationMetrics }
    };
  }

  // ✅ NEW: PCL-powered workspace analysis using proven error boundary pattern
  /**
   * Analyze workspace using PCL ProjectDiscovery adapter
   * 
   * @param rootPath - Root path to analyze (optional, defaults to workspaceRoot)
   * @returns Promise resolving to project summary
   * @throws Error - When PCL adapters not configured
   */
  public async analyzeWorkspace(rootPath?: string): Promise<ProjectSummary> {
    if (!this.pclAdapters) {
      throw new Error('PCL adapters not configured');
    }

    const targetPath = rootPath || this.workspaceRoot;

    return this.executeWithReliability('analyzeWorkspace', async () => {
      this.ensureInitialized();

      // Record telemetry for PCL integration
      this.telemetry.recordEvent('pcl_workspace_analysis_started', {
        has_custom_path: !!rootPath,
        path_length: targetPath.length
      }, 'pcl-integration');

      const startTime = Date.now();
      try {
        const result = await this.pclAdapters!.discovery.scan(targetPath);
        
        const duration = Date.now() - startTime;
        this.telemetry.recordEvent('pcl_workspace_analysis_completed', {
          success: true,
          duration_ms: duration,
          files_found: result.files.length,
          languages_detected: result.languages.length
        }, 'pcl-integration');

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        this.telemetry.recordEvent('pcl_workspace_analysis_failed', {
          success: false,
          duration_ms: duration,
          error_type: error instanceof Error ? error.constructor.name : 'unknown'
        }, 'pcl-integration');

        throw error;
      }
    }, { files: [], languages: [] });
  }

  // ✅ NEW: TDD execution with established reliability patterns
  /**
   * Execute TDD workflow using PCL TDDOrchestrator adapter
   * 
   * @param task - Task description for TDD workflow
   * @param maxTurns - Maximum number of TDD turns (optional)
   * @param options - Additional TDD options (optional)
   * @returns Promise resolving to TDD result
   * @throws Error - When PCL adapters not configured
   */
  public async runTDD(task: string, maxTurns?: number, options?: Record<string, unknown>): Promise<TDDResult> {
    if (!this.pclAdapters) {
      throw new Error('PCL adapters not configured');
    }

    // ✅ Apply Phase 2 conditional property assignment pattern
    const request: TDDRequest = {
      task,
      projectPath: this.workspaceRoot
    };

    if (maxTurns !== undefined) {
      (request as any).maxTurns = maxTurns;
    }

    if (options !== undefined) {
      (request as any).options = options;
    }

    return this.executeWithReliability('runTDD', async () => {
      this.ensureInitialized();

      // Record telemetry for TDD execution
      this.telemetry.recordEvent('pcl_tdd_execution_started', {
        task_length: task.length,
        max_turns: maxTurns || 3,
        has_options: !!options
      }, 'pcl-integration');

      const startTime = Date.now();
      try {
        const result = await this.pclAdapters!.tdd.run(request);
        
        const duration = Date.now() - startTime;
        this.telemetry.recordEvent('pcl_tdd_execution_completed', {
          success: result.success,
          duration_ms: duration,
          artifacts_generated: result.artifacts.length,
          quality_score: result.qualityScore || 0
        }, 'pcl-integration');

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        this.telemetry.recordEvent('pcl_tdd_execution_failed', {
          success: false,
          duration_ms: duration,
          error_type: error instanceof Error ? error.constructor.name : 'unknown'
        }, 'pcl-integration');

        throw error;
      }
    }, { success: false, artifacts: [] });
  }

  // ✅ NEW: Session management with PCL integration
  /**
   * Get current session state using PCL SessionManager adapter
   * 
   * @returns Promise resolving to current session state
   * @throws Error - When PCL adapters not configured
   */
  public async getSessionState(): Promise<SessionState> {
    if (!this.pclAdapters) {
      throw new Error('PCL adapters not configured');
    }

    return this.executeWithReliability('getSessionState', async () => {
      this.ensureInitialized();

      const result = await this.pclAdapters!.session.getState();
      
      this.telemetry.recordEvent('pcl_session_state_retrieved', {
        session_id_length: result.id.length,
        context_keys_count: Object.keys(result.context).length
      }, 'pcl-integration');

      return result;
    }, { id: 'fallback-session', context: {} });
  }

  /**
   * Update session context using PCL SessionManager adapter
   * 
   * @param patch - Context properties to update
   * @returns Promise resolving to updated session state
   * @throws Error - When PCL adapters not configured
   */
  public async updateSessionContext(patch: Record<string, unknown>): Promise<SessionState> {
    if (!this.pclAdapters) {
      throw new Error('PCL adapters not configured');
    }

    return this.executeWithReliability('updateSessionContext', async () => {
      this.ensureInitialized();

      const result = await this.pclAdapters!.session.updateContext(patch);
      
      this.telemetry.recordEvent('pcl_session_context_updated', {
        patch_keys_count: Object.keys(patch).length,
        session_id_length: result.id.length,
        updated_context_keys: Object.keys(result.context).length
      }, 'pcl-integration');

      return result;
    }, { id: 'fallback-session', context: {} });
  }

  // ✅ NEW: Menu system with PCL integration
  /**
   * Get root menu using PCL MenuSystem adapter
   * 
   * @returns Promise resolving to root menu node
   * @throws Error - When PCL adapters not configured
   */
  public async getRootMenu(): Promise<MenuNode> {
    if (!this.pclAdapters) {
      throw new Error('PCL adapters not configured');
    }

    return this.executeWithReliability('getRootMenu', async () => {
      this.ensureInitialized();

      const result = await this.pclAdapters!.menu.getRoot();
      
      // Count menu nodes recursively for telemetry
      const nodeCount = this.countMenuNodes(result);
      
      this.telemetry.recordEvent('pcl_root_menu_retrieved', {
        total_nodes: nodeCount,
        has_children: !!(result.children && result.children.length > 0),
        root_label_length: result.label.length
      }, 'pcl-integration');

      return result;
    }, { id: 'fallback-root', label: 'Fallback Menu' });
  }

  /**
   * Check if PCL integration is available
   * 
   * @returns Boolean indicating if PCL adapters are configured
   */
  public isPCLIntegrationAvailable(): boolean {
    return !!this.pclAdapters;
  }

  private async executeWithReliability<T>(
    operationName: string,
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> {
    const startTime = Date.now();
    this.operationMetrics.totalOperations++;

    try {
      const result = await this.breaker.executeWithFallback(operation, fallback);
      
      const duration = Date.now() - startTime;
      this.operationMetrics.successfulOperations++;
      this.operationMetrics.responseTimes.push(duration);
      
      // Keep only recent response times
      if (this.operationMetrics.responseTimes.length > 100) {
        this.operationMetrics.responseTimes = this.operationMetrics.responseTimes.slice(-50);
      }

      this.telemetry.recordPerformanceEvent(operationName, duration);
      
      return result;
    } catch (error) {
      this.operationMetrics.failedOperations++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.telemetry.recordErrorEvent(operationName, 'core-engine', {
        error_message: errorMessage
      });
      
      return fallback;
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('HaruspexCoreEngine must be initialized before use');
    }
  }

  private async handleFileChange(event: FileChangeEvent): Promise<void> {
    // Handle file changes by invalidating caches or triggering updates
    this.telemetry.recordEvent('file_changed', {
      change_type: event.type,
      file_extension: event.extension,
      is_monitored: event.isMonitored
    }, 'file-monitor');

    // In a full implementation, this would trigger updates to:
    // - Documentation tree (if structure files changed)
    // - Truth matrix (if code files changed) 
    // - Mermaid diagrams (if architecture changed)
    
    // For now, just log the event
    console.log(`File ${event.type}: ${event.filePath}`);
  }

  /**
   * Count menu nodes recursively for telemetry
   * 
   * @private
   * @param node - Menu node to count
   * @returns Total number of nodes in the tree
   */
  private countMenuNodes(node: MenuNode): number {
    let count = 1; // Count current node
    
    if (node.children) {
      for (const child of node.children) {
        count += this.countMenuNodes(child);
      }
    }
    
    return count;
  }
}
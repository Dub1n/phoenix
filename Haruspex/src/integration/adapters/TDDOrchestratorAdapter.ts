/**
 * TDD Orchestrator Adapter for PCL Integration
 * 
 * Provides adapter layer between Phoenix Code Lite TDDOrchestrator component
 * and Haruspex-native interfaces, supporting TDD workflow execution with
 * proper error isolation and result normalization.
 * 
 * @implementation Phase 3 PCL Integration - TDD Orchestration
 * @created 2025-08-14
 */

import { IntegrationError } from './ProjectDiscoveryAdapter';

export interface TDDRequest {
  readonly task: string;
  readonly maxTurns?: number;
  readonly projectPath?: string;
  readonly options?: Record<string, unknown>;
}

export interface TDDResult {
  readonly success: boolean;
  readonly artifacts: readonly string[];
  readonly duration?: number;
  readonly phases?: readonly string[];
  readonly qualityScore?: number;
  readonly errors?: readonly string[];
}

export interface HaruspexTDDOrchestrator {
  run(request: TDDRequest): Promise<TDDResult>;
  getCapabilities?(): Promise<{ supportedLanguages: string[]; maxComplexity: number }>;
}

export interface PCLTDDOrchestrator {
  execute(task: string, options?: { 
    maxTurns?: number; 
    projectPath?: string;
    [key: string]: unknown;
  }): Promise<{ 
    success: boolean; 
    artifacts: string[];
    duration?: number;
    phases?: string[];
    qualityScore?: number;
    errors?: string[];
  }>;
}

/**
 * Adapter for Phoenix Code Lite TDDOrchestrator component
 * 
 * Harmonizes PCL's TDD orchestration interface to Haruspex's unified API,
 * providing comprehensive error isolation and result validation for TDD workflows.
 */
export class TDDOrchestratorAdapter implements HaruspexTDDOrchestrator {
  private static readonly MAX_TASK_LENGTH = 2000;
  private static readonly MIN_TASK_LENGTH = 5;
  private static readonly DEFAULT_MAX_TURNS = 3;
  private static readonly MAX_ALLOWED_TURNS = 10;

  constructor(private readonly pcl: PCLTDDOrchestrator) {
    if (!pcl) {
      throw new Error('PCL TDDOrchestrator instance is required');
    }
  }

  /**
   * Execute TDD workflow with the provided request
   * 
   * @param request - TDD execution request with task and options
   * @returns Promise resolving to TDD execution result
   * @throws IntegrationError - When TDD execution fails or request is invalid
   */
  public async run(request: TDDRequest): Promise<TDDResult> {
    // Validate request
    this.validateTDDRequest(request);

    try {
      // Prepare PCL options
      const pclOptions = this.preparePCLOptions(request);
      
      // Execute TDD workflow through PCL
      const startTime = Date.now();
      const result = await this.pcl.execute(request.task, pclOptions);
      const executionDuration = Date.now() - startTime;

      // Validate PCL response
      this.validatePCLResponse(result);

      // Normalize and return result
      return this.normalizeResult(result, executionDuration);
    } catch (err) {
      // Handle known integration errors
      if (err instanceof IntegrationError) {
        throw err;
      }

      // Handle PCL execution failures gracefully
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Return failed result instead of throwing for PCL execution failures
      // This allows the circuit breaker to handle failures gracefully
      return {
        success: false,
        artifacts: [],
        duration: 0,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Get TDD orchestrator capabilities (optional implementation)
   * 
   * @returns Promise resolving to orchestrator capabilities
   */
  public async getCapabilities(): Promise<{ supportedLanguages: string[]; maxComplexity: number }> {
    // Return capabilities based on PCL TDD orchestrator limits
    return {
      supportedLanguages: ['typescript', 'javascript', 'python', 'go', 'rust', 'java'],
      maxComplexity: TDDOrchestratorAdapter.MAX_ALLOWED_TURNS
    };
  }

  /**
   * Validate TDD request parameters
   * 
   * @private
   * @param request - Request to validate
   * @throws IntegrationError - When request is invalid
   */
  private validateTDDRequest(request: TDDRequest): void {
    if (!request) {
      throw new IntegrationError(
        'invalid_tdd_request',
        'TDD request is required',
        { request }
      );
    }

    // Validate task
    if (typeof request.task !== 'string') {
      throw new IntegrationError(
        'invalid_task',
        'Task must be a non-empty string',
        { task: request.task }
      );
    }

    if (request.task.length < TDDOrchestratorAdapter.MIN_TASK_LENGTH) {
      throw new IntegrationError(
        'task_too_short',
        `Task must be at least ${TDDOrchestratorAdapter.MIN_TASK_LENGTH} characters`,
        { taskLength: request.task.length }
      );
    }

    if (request.task.length > TDDOrchestratorAdapter.MAX_TASK_LENGTH) {
      throw new IntegrationError(
        'task_too_long',
        `Task must not exceed ${TDDOrchestratorAdapter.MAX_TASK_LENGTH} characters`,
        { taskLength: request.task.length }
      );
    }

    // Validate maxTurns if provided
    if (request.maxTurns !== undefined) {
      if (typeof request.maxTurns !== 'number' || request.maxTurns < 1) {
        throw new IntegrationError(
          'invalid_max_turns',
          'maxTurns must be a positive number',
          { maxTurns: request.maxTurns }
        );
      }

      if (request.maxTurns > TDDOrchestratorAdapter.MAX_ALLOWED_TURNS) {
        throw new IntegrationError(
          'max_turns_exceeded',
          `maxTurns cannot exceed ${TDDOrchestratorAdapter.MAX_ALLOWED_TURNS}`,
          { maxTurns: request.maxTurns }
        );
      }
    }

    // Validate projectPath if provided
    if (request.projectPath !== undefined) {
      if (typeof request.projectPath !== 'string' || request.projectPath.length === 0) {
        throw new IntegrationError(
          'invalid_project_path',
          'Project path must be a non-empty string',
          { projectPath: request.projectPath }
        );
      }
    }
  }

  /**
   * Prepare PCL options from Haruspex request
   * 
   * @private
   * @param request - Haruspex TDD request
   * @returns PCL-compatible options
   */
  private preparePCLOptions(request: TDDRequest): { maxTurns?: number; projectPath?: string; [key: string]: unknown } {
    const options: { maxTurns?: number; projectPath?: string; [key: string]: unknown } = {};

    // Set maxTurns with default
    options.maxTurns = request.maxTurns || TDDOrchestratorAdapter.DEFAULT_MAX_TURNS;

    // Set projectPath if provided
    if (request.projectPath) {
      options.projectPath = request.projectPath;
    }

    // Include additional options if provided
    if (request.options) {
      Object.assign(options, request.options);
    }

    return options;
  }

  /**
   * Validate PCL response structure
   * 
   * @private
   * @param result - PCL response to validate
   * @throws IntegrationError - When response is invalid
   */
  private validatePCLResponse(result: any): void {
    if (!result || typeof result !== 'object') {
      throw new IntegrationError(
        'invalid_pcl_response',
        'PCL TDDOrchestrator returned invalid response',
        { response: result }
      );
    }

    if (typeof result.success !== 'boolean') {
      throw new IntegrationError(
        'missing_success_field',
        'PCL response must include success boolean field',
        { response: result }
      );
    }

    if (!Array.isArray(result.artifacts)) {
      throw new IntegrationError(
        'invalid_artifacts',
        'PCL response artifacts must be an array',
        { artifacts: result.artifacts }
      );
    }

    // Validate optional fields if present
    if (result.duration !== undefined && typeof result.duration !== 'number') {
      throw new IntegrationError(
        'invalid_duration',
        'PCL response duration must be a number',
        { duration: result.duration }
      );
    }

    if (result.phases !== undefined && !Array.isArray(result.phases)) {
      throw new IntegrationError(
        'invalid_phases',
        'PCL response phases must be an array',
        { phases: result.phases }
      );
    }

    if (result.qualityScore !== undefined && typeof result.qualityScore !== 'number') {
      throw new IntegrationError(
        'invalid_quality_score',
        'PCL response quality score must be a number',
        { qualityScore: result.qualityScore }
      );
    }

    if (result.errors !== undefined && !Array.isArray(result.errors)) {
      throw new IntegrationError(
        'invalid_errors',
        'PCL response errors must be an array',
        { errors: result.errors }
      );
    }
  }

  /**
   * Normalize PCL result to Haruspex format
   * 
   * @private
   * @param pclResult - PCL execution result
   * @param executionDuration - Measured execution duration
   * @returns Normalized Haruspex TDD result
   */
  private normalizeResult(pclResult: any, executionDuration: number): TDDResult {
    const result: TDDResult = {
      success: pclResult.success,
      artifacts: [...pclResult.artifacts], // Create immutable copy
      duration: pclResult.duration || executionDuration
    };

    // Add optional fields if present
    if (pclResult.phases) {
      (result as any).phases = [...pclResult.phases];
    }

    if (typeof pclResult.qualityScore === 'number') {
      (result as any).qualityScore = Math.max(0, Math.min(1, pclResult.qualityScore)); // Clamp to 0-1
    }

    if (pclResult.errors) {
      (result as any).errors = [...pclResult.errors];
    }

    return result;
  }
}
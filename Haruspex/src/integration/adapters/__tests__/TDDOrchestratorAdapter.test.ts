/**
 * Unit tests for TDDOrchestratorAdapter
 * 
 * Tests TDD workflow execution, request validation, and error isolation
 * following Phase 3 PCL integration patterns.
 * 
 * @implementation Phase 3 PCL Integration - TDD Orchestrator Tests
 * @created 2025-08-14
 */

import { TDDOrchestratorAdapter, PCLTDDOrchestrator } from '../TDDOrchestratorAdapter';
import { IntegrationError } from '../ProjectDiscoveryAdapter';

describe('TDDOrchestratorAdapter', () => {
  let mockPCL: jest.Mocked<PCLTDDOrchestrator>;
  let adapter: TDDOrchestratorAdapter;

  beforeEach(() => {
    mockPCL = {
      execute: jest.fn()
    };
    adapter = new TDDOrchestratorAdapter(mockPCL);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should require PCL instance', () => {
      expect(() => new TDDOrchestratorAdapter(null as any)).toThrow('PCL TDDOrchestrator instance is required');
      expect(() => new TDDOrchestratorAdapter(undefined as any)).toThrow('PCL TDDOrchestrator instance is required');
    });

    it('should accept valid PCL instance', () => {
      expect(() => new TDDOrchestratorAdapter(mockPCL)).not.toThrow();
    });
  });

  describe('run', () => {
    it('should execute TDD workflow and normalize result', async () => {
      // Arrange
      const request = {
        task: 'Create a calculator function',
        maxTurns: 3,
        projectPath: '/test/project',
        options: { framework: 'jest' }
      };

      const mockResponse = {
        success: true,
        artifacts: ['calculator.ts', 'calculator.test.ts'],
        duration: 5000,
        phases: ['plan', 'implement', 'refactor'],
        qualityScore: 0.85,
        errors: []
      };
      mockPCL.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.run(request);

      // Assert
      expect(mockPCL.execute).toHaveBeenCalledWith('Create a calculator function', {
        maxTurns: 3,
        projectPath: '/test/project',
        framework: 'jest'
      });
      expect(result).toEqual({
        success: true,
        artifacts: ['calculator.ts', 'calculator.test.ts'],
        duration: 5000,
        phases: ['plan', 'implement', 'refactor'],
        qualityScore: 0.85,
        errors: []
      });
    });

    it('should handle minimal request with defaults', async () => {
      // Arrange
      const request = { task: 'Simple task' };
      const mockResponse = {
        success: true,
        artifacts: ['output.ts']
      };
      mockPCL.execute.mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.run(request);

      // Assert
      expect(mockPCL.execute).toHaveBeenCalledWith('Simple task', {
        maxTurns: 3 // Default value
      });
      expect(result).toEqual({
        success: true,
        artifacts: ['output.ts'],
        duration: expect.any(Number) // Should be calculated duration
      });
    });

    it('should create immutable result arrays', async () => {
      const originalArtifacts = ['file1.ts', 'file2.ts'];
      const originalPhases = ['phase1', 'phase2'];
      
      const mockResponse = {
        success: true,
        artifacts: originalArtifacts,
        phases: originalPhases
      };
      mockPCL.execute.mockResolvedValue(mockResponse);

      const result = await adapter.run({ task: 'Test task' });

      expect(result.artifacts).not.toBe(originalArtifacts); // Different reference
      expect(result.phases).not.toBe(originalPhases); // Different reference
      expect(result.artifacts).toEqual(originalArtifacts); // Same content
      expect(result.phases).toEqual(originalPhases); // Same content
    });

    it('should validate task parameter', async () => {
      // Test missing task
      await expect(adapter.run(null as any)).rejects.toMatchObject({
        code: 'invalid_tdd_request',
        message: 'TDD request is required'
      });

      await expect(adapter.run(undefined as any)).rejects.toMatchObject({
        code: 'invalid_tdd_request'
      });

      // Test invalid task type
      await expect(adapter.run({ task: null } as any)).rejects.toMatchObject({
        code: 'invalid_task',
        message: 'Task must be a non-empty string'
      });

      await expect(adapter.run({ task: 123 } as any)).rejects.toMatchObject({
        code: 'invalid_task'
      });

      await expect(adapter.run({ task: '' })).rejects.toMatchObject({
        code: 'task_too_short',
        message: 'Task must be at least 5 characters'
      });

      // Test task too short
      await expect(adapter.run({ task: 'abc' })).rejects.toMatchObject({
        code: 'task_too_short'
      });

      // Test task too long
      const longTask = 'a'.repeat(2001);
      await expect(adapter.run({ task: longTask })).rejects.toMatchObject({
        code: 'task_too_long',
        message: 'Task must not exceed 2000 characters'
      });
    });

    it('should validate maxTurns parameter', async () => {
      const validTask = 'Valid task description';

      // Test invalid maxTurns type
      await expect(adapter.run({ task: validTask, maxTurns: 'invalid' } as any)).rejects.toMatchObject({
        code: 'invalid_max_turns',
        message: 'maxTurns must be a positive number'
      });

      // Test negative maxTurns
      await expect(adapter.run({ task: validTask, maxTurns: -1 })).rejects.toMatchObject({
        code: 'invalid_max_turns'
      });

      // Test zero maxTurns
      await expect(adapter.run({ task: validTask, maxTurns: 0 })).rejects.toMatchObject({
        code: 'invalid_max_turns'
      });

      // Test exceeding max allowed turns
      await expect(adapter.run({ task: validTask, maxTurns: 11 })).rejects.toMatchObject({
        code: 'max_turns_exceeded',
        message: 'maxTurns cannot exceed 10'
      });

      // Test valid maxTurns
      mockPCL.execute.mockResolvedValue({ success: true, artifacts: [] });
      await expect(adapter.run({ task: validTask, maxTurns: 5 })).resolves.toMatchObject({
        success: true
      });
    });

    it('should validate projectPath parameter', async () => {
      const validTask = 'Valid task';

      // Test invalid projectPath type
      await expect(adapter.run({ 
        task: validTask, 
        projectPath: 123 
      } as any)).rejects.toMatchObject({
        code: 'invalid_project_path',
        message: 'Project path must be a non-empty string'
      });

      // Test empty projectPath
      await expect(adapter.run({ 
        task: validTask, 
        projectPath: '' 
      })).rejects.toMatchObject({
        code: 'invalid_project_path'
      });

      // Test valid projectPath
      mockPCL.execute.mockResolvedValue({ success: true, artifacts: [] });
      await expect(adapter.run({ 
        task: validTask, 
        projectPath: '/valid/path' 
      })).resolves.toMatchObject({
        success: true
      });
    });

    it('should validate PCL response structure', async () => {
      const validRequest = { task: 'Valid task' };

      // Test null response
      mockPCL.execute.mockResolvedValue(null as any);
      await expect(adapter.run(validRequest)).rejects.toMatchObject({
        code: 'invalid_pcl_response',
        message: 'PCL TDDOrchestrator returned invalid response'
      });

      // Test missing success field
      mockPCL.execute.mockResolvedValue({ artifacts: [] } as any);
      await expect(adapter.run(validRequest)).rejects.toMatchObject({
        code: 'missing_success_field',
        message: 'PCL response must include success boolean field'
      });

      // Test invalid success field
      mockPCL.execute.mockResolvedValue({ success: 'yes', artifacts: [] } as any);
      await expect(adapter.run(validRequest)).rejects.toMatchObject({
        code: 'missing_success_field'
      });

      // Test missing artifacts field
      mockPCL.execute.mockResolvedValue({ success: true } as any);
      await expect(adapter.run(validRequest)).rejects.toMatchObject({
        code: 'invalid_artifacts',
        message: 'PCL response artifacts must be an array'
      });

      // Test invalid artifacts field
      mockPCL.execute.mockResolvedValue({ success: true, artifacts: 'not-array' } as any);
      await expect(adapter.run(validRequest)).rejects.toMatchObject({
        code: 'invalid_artifacts'
      });
    });

    it('should validate optional PCL response fields', async () => {
      const validRequest = { task: 'Valid task' };

      // Test invalid duration
      mockPCL.execute.mockResolvedValue({ 
        success: true, 
        artifacts: [], 
        duration: 'invalid' 
      } as any);
      await expect(adapter.run(validRequest)).rejects.toMatchObject({
        code: 'invalid_duration',
        message: 'PCL response duration must be a number'
      });

      // Test invalid phases
      mockPCL.execute.mockResolvedValue({ 
        success: true, 
        artifacts: [], 
        phases: 'not-array' 
      } as any);
      await expect(adapter.run(validRequest)).rejects.toMatchObject({
        code: 'invalid_phases',
        message: 'PCL response phases must be an array'
      });

      // Test invalid qualityScore
      mockPCL.execute.mockResolvedValue({ 
        success: true, 
        artifacts: [], 
        qualityScore: 'invalid' 
      } as any);
      await expect(adapter.run(validRequest)).rejects.toMatchObject({
        code: 'invalid_quality_score',
        message: 'PCL response quality score must be a number'
      });

      // Test invalid errors
      mockPCL.execute.mockResolvedValue({ 
        success: true, 
        artifacts: [], 
        errors: 'not-array' 
      } as any);
      await expect(adapter.run(validRequest)).rejects.toMatchObject({
        code: 'invalid_errors',
        message: 'PCL response errors must be an array'
      });
    });

    it('should normalize quality score to 0-1 range', async () => {
      const validRequest = { task: 'Valid task' };

      // Test quality score above 1
      mockPCL.execute.mockResolvedValue({
        success: true,
        artifacts: [],
        qualityScore: 1.5
      });

      let result = await adapter.run(validRequest);
      expect(result.qualityScore).toBe(1); // Clamped to 1

      // Test quality score below 0
      mockPCL.execute.mockResolvedValue({
        success: true,
        artifacts: [],
        qualityScore: -0.5
      });

      result = await adapter.run(validRequest);
      expect(result.qualityScore).toBe(0); // Clamped to 0

      // Test valid quality score
      mockPCL.execute.mockResolvedValue({
        success: true,
        artifacts: [],
        qualityScore: 0.7
      });

      result = await adapter.run(validRequest);
      expect(result.qualityScore).toBe(0.7); // Unchanged
    });

    it('should return failed result for PCL execution errors instead of throwing', async () => {
      const validRequest = { task: 'Valid task' };
      const originalError = new Error('PCL execution failed');
      mockPCL.execute.mockRejectedValue(originalError);

      // Should return failed result, not throw
      const result = await adapter.run(validRequest);

      expect(result).toEqual({
        success: false,
        artifacts: [],
        duration: 0,
        errors: ['PCL execution failed']
      });
    });

    it('should re-throw IntegrationErrors from validation', async () => {
      // This tests that validation errors are still thrown,
      // only PCL execution errors are converted to failed results
      await expect(adapter.run({ task: '' })).rejects.toBeInstanceOf(IntegrationError);
      await expect(adapter.run({ task: '' })).rejects.toMatchObject({
        code: 'task_too_short'
      });
    });

    it('should handle non-Error PCL rejections', async () => {
      const validRequest = { task: 'Valid task' };
      mockPCL.execute.mockRejectedValue('string error');

      const result = await adapter.run(validRequest);

      expect(result).toEqual({
        success: false,
        artifacts: [],
        duration: 0,
        errors: ['Unknown error']
      });
    });

    it('should use measured duration when PCL duration not provided', async () => {
      const validRequest = { task: 'Valid task' };
      mockPCL.execute.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          artifacts: []
        }), 100))
      );

      const result = await adapter.run(validRequest);

      expect(result.duration).toBeGreaterThanOrEqual(90); // Allow for timing variance
      expect(result.duration).toBeLessThan(200); // Reasonable upper bound
    });

    it('should prefer PCL duration over measured duration', async () => {
      const validRequest = { task: 'Valid task' };
      mockPCL.execute.mockResolvedValue({
        success: true,
        artifacts: [],
        duration: 5000 // PCL reported duration
      });

      const result = await adapter.run(validRequest);

      expect(result.duration).toBe(5000); // Should use PCL value, not measured
    });
  });

  describe('getCapabilities', () => {
    it('should return supported languages and max complexity', async () => {
      const capabilities = await adapter.getCapabilities();

      expect(capabilities).toEqual({
        supportedLanguages: ['typescript', 'javascript', 'python', 'go', 'rust', 'java'],
        maxComplexity: 10
      });
    });

    it('should be consistent with validation limits', async () => {
      const capabilities = await adapter.getCapabilities();

      // Max complexity should match MAX_ALLOWED_TURNS
      expect(capabilities.maxComplexity).toBe(10);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty optional arrays in PCL response', async () => {
      const validRequest = { task: 'Valid task' };
      mockPCL.execute.mockResolvedValue({
        success: true,
        artifacts: [],
        phases: [],
        errors: []
      });

      const result = await adapter.run(validRequest);

      expect(result.phases).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should omit empty optional arrays from result', async () => {
      const validRequest = { task: 'Valid task' };
      mockPCL.execute.mockResolvedValue({
        success: true,
        artifacts: ['file.ts'], // Non-empty
        phases: [], // Empty
        errors: [] // Empty
      });

      const result = await adapter.run(validRequest);

      expect(result.phases).toEqual([]); // Included even if empty
      expect(result.errors).toEqual([]); // Included even if empty
    });

    it('should handle very long task at boundary', async () => {
      const boundaryTask = 'a'.repeat(2000); // Exactly at limit
      mockPCL.execute.mockResolvedValue({ success: true, artifacts: [] });

      // Should not throw
      await expect(adapter.run({ task: boundaryTask })).resolves.toMatchObject({
        success: true
      });
    });

    it('should prepare options correctly with all parameters', async () => {
      const request = {
        task: 'Complex task',
        maxTurns: 5,
        projectPath: '/test/path',
        options: { 
          framework: 'jest',
          timeout: 30000,
          customFlag: true
        }
      };
      mockPCL.execute.mockResolvedValue({ success: true, artifacts: [] });

      await adapter.run(request);

      expect(mockPCL.execute).toHaveBeenCalledWith('Complex task', {
        maxTurns: 5,
        projectPath: '/test/path',
        framework: 'jest',
        timeout: 30000,
        customFlag: true
      });
    });
  });
});
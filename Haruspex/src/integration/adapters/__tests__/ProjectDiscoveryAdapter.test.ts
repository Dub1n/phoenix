/**
 * Unit tests for ProjectDiscoveryAdapter
 * 
 * Tests adapter functionality including error isolation, interface harmonization,
 * and proper PCL integration patterns following Phase 3 specifications.
 * 
 * @implementation Phase 3 PCL Integration - Project Discovery Tests
 * @created 2025-08-14
 */

import { ProjectDiscoveryAdapter, IntegrationError, PCLProjectDiscovery } from '../ProjectDiscoveryAdapter';

describe('ProjectDiscoveryAdapter', () => {
  let mockPCL: jest.Mocked<PCLProjectDiscovery>;
  let adapter: ProjectDiscoveryAdapter;

  beforeEach(() => {
    mockPCL = {
      scanWorkspace: jest.fn()
    };
    adapter = new ProjectDiscoveryAdapter(mockPCL);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should require PCL instance', () => {
      expect(() => new ProjectDiscoveryAdapter(null as any)).toThrow('PCL ProjectDiscovery instance is required');
      expect(() => new ProjectDiscoveryAdapter(undefined as any)).toThrow('PCL ProjectDiscovery instance is required');
    });

    it('should accept valid PCL instance', () => {
      expect(() => new ProjectDiscoveryAdapter(mockPCL)).not.toThrow();
    });
  });

  describe('scan', () => {
    it('should forward scan request and normalize result', async () => {
      // Arrange
      const rootPath = '/test/root';
      const mockResponse = {
        files: ['file1.ts', 'file2.js'],
        languages: ['typescript', 'javascript']
      };
      mockPCL.scanWorkspace.mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.scan(rootPath);

      // Assert
      expect(mockPCL.scanWorkspace).toHaveBeenCalledWith(rootPath);
      expect(mockPCL.scanWorkspace).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        files: ['file1.ts', 'file2.js'],
        languages: ['typescript', 'javascript']
      });
    });

    it('should create immutable result arrays', async () => {
      // Arrange
      const mockResponse = {
        files: ['file1.ts'],
        languages: ['typescript']
      };
      mockPCL.scanWorkspace.mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.scan('/test');

      // Assert
      expect(result.files).not.toBe(mockResponse.files); // Different array reference
      expect(result.languages).not.toBe(mockResponse.languages); // Different array reference
      expect(result.files).toEqual(mockResponse.files); // Same content
      expect(result.languages).toEqual(mockResponse.languages); // Same content
    });

    it('should validate input parameters', async () => {
      await expect(adapter.scan('')).rejects.toMatchObject({
        name: 'IntegrationError',
        code: 'invalid_input',
        message: 'Root path must be a non-empty string'
      });

      await expect(adapter.scan(null as any)).rejects.toMatchObject({
        code: 'invalid_input'
      });

      await expect(adapter.scan(undefined as any)).rejects.toMatchObject({
        code: 'invalid_input'
      });

      await expect(adapter.scan(123 as any)).rejects.toMatchObject({
        code: 'invalid_input'
      });
    });

    it('should validate PCL response structure', async () => {
      // Test invalid response structure
      mockPCL.scanWorkspace.mockResolvedValue(null as any);
      await expect(adapter.scan('/test')).rejects.toMatchObject({
        code: 'invalid_pcl_response',
        message: 'PCL ProjectDiscovery returned invalid response structure'
      });

      // Test missing files array
      mockPCL.scanWorkspace.mockResolvedValue({ languages: ['ts'] } as any);
      await expect(adapter.scan('/test')).rejects.toMatchObject({
        code: 'invalid_pcl_response'
      });

      // Test missing languages array
      mockPCL.scanWorkspace.mockResolvedValue({ files: ['file.ts'] } as any);
      await expect(adapter.scan('/test')).rejects.toMatchObject({
        code: 'invalid_pcl_response'
      });

      // Test non-array files
      mockPCL.scanWorkspace.mockResolvedValue({ files: 'not-array', languages: [] } as any);
      await expect(adapter.scan('/test')).rejects.toMatchObject({
        code: 'invalid_pcl_response'
      });

      // Test non-array languages
      mockPCL.scanWorkspace.mockResolvedValue({ files: [], languages: 'not-array' } as any);
      await expect(adapter.scan('/test')).rejects.toMatchObject({
        code: 'invalid_pcl_response'
      });
    });

    it('should wrap PCL errors with IntegrationError', async () => {
      const originalError = new Error('PCL scan failed');
      mockPCL.scanWorkspace.mockRejectedValue(originalError);

      await expect(adapter.scan('/test')).rejects.toMatchObject({
        name: 'IntegrationError',
        code: 'project_discovery_failed',
        message: 'Failed to scan workspace',
        data: {
          rootPath: '/test',
          originalError: 'PCL scan failed'
        }
      });
    });

    it('should re-throw IntegrationErrors as-is', async () => {
      const integrationError = new IntegrationError('custom_error', 'Custom error message');
      mockPCL.scanWorkspace.mockRejectedValue(integrationError);

      await expect(adapter.scan('/test')).rejects.toBe(integrationError);
    });

    it('should handle empty scan results', async () => {
      mockPCL.scanWorkspace.mockResolvedValue({
        files: [],
        languages: []
      });

      const result = await adapter.scan('/test');

      expect(result).toEqual({
        files: [],
        languages: []
      });
    });

    it('should handle large scan results', async () => {
      const largeFileList = Array.from({ length: 1000 }, (_, i) => `file${i}.ts`);
      const manyLanguages = ['typescript', 'javascript', 'python', 'go', 'rust'];
      
      mockPCL.scanWorkspace.mockResolvedValue({
        files: largeFileList,
        languages: manyLanguages
      });

      const result = await adapter.scan('/large/project');

      expect(result.files).toHaveLength(1000);
      expect(result.languages).toHaveLength(5);
      expect(result.files[0]).toBe('file0.ts');
      expect(result.files[999]).toBe('file999.ts');
    });

    it('should handle PCL timeout gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockPCL.scanWorkspace.mockRejectedValue(timeoutError);

      await expect(adapter.scan('/test')).rejects.toMatchObject({
        code: 'project_discovery_failed',
        data: {
          originalError: 'Request timeout'
        }
      });
    });
  });

  describe('error handling edge cases', () => {
    it('should handle non-Error rejections', async () => {
      mockPCL.scanWorkspace.mockRejectedValue('string error');

      await expect(adapter.scan('/test')).rejects.toMatchObject({
        code: 'project_discovery_failed',
        data: {
          originalError: 'Unknown error'
        }
      });
    });

    it('should handle undefined rejection', async () => {
      mockPCL.scanWorkspace.mockRejectedValue(undefined);

      await expect(adapter.scan('/test')).rejects.toMatchObject({
        code: 'project_discovery_failed',
        data: {
          originalError: 'Unknown error'
        }
      });
    });

    it('should preserve error context in data', async () => {
      const rootPath = '/specific/test/path';
      mockPCL.scanWorkspace.mockRejectedValue(new Error('Network failure'));

      try {
        await adapter.scan(rootPath);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError);
        expect((error as IntegrationError).data).toEqual({
          rootPath,
          originalError: 'Network failure'
        });
      }
    });
  });
});
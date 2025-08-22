/**
 * Unit tests for SessionManagerAdapter
 * 
 * Tests session state management, context updates, and error isolation
 * following Phase 3 PCL integration patterns.
 * 
 * @implementation Phase 3 PCL Integration - Session Manager Tests
 * @created 2025-08-14
 */

import { SessionManagerAdapter, PCLSessionManager } from '../SessionManagerAdapter';
import { IntegrationError } from '../ProjectDiscoveryAdapter';

describe('SessionManagerAdapter', () => {
  let mockPCL: jest.Mocked<PCLSessionManager>;
  let adapter: SessionManagerAdapter;

  beforeEach(() => {
    mockPCL = {
      getState: jest.fn(),
      patchContext: jest.fn()
    };
    adapter = new SessionManagerAdapter(mockPCL);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should require PCL instance', () => {
      expect(() => new SessionManagerAdapter(null as any)).toThrow('PCL SessionManager instance is required');
      expect(() => new SessionManagerAdapter(undefined as any)).toThrow('PCL SessionManager instance is required');
    });

    it('should accept valid PCL instance', () => {
      expect(() => new SessionManagerAdapter(mockPCL)).not.toThrow();
    });
  });

  describe('getState', () => {
    it('should retrieve and normalize session state', async () => {
      // Arrange
      const mockResponse = {
        id: 'session-123',
        context: { 
          currentProject: '/test/project',
          lastAction: 'scan',
          preferences: { theme: 'dark' }
        }
      };
      mockPCL.getState.mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.getState();

      // Assert
      expect(mockPCL.getState).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: 'session-123',
        context: { 
          currentProject: '/test/project',
          lastAction: 'scan',
          preferences: { theme: 'dark' }
        }
      });
    });

    it('should create deep clone of context for immutability', async () => {
      const originalContext = { nested: { value: 'test' } };
      const mockResponse = {
        id: 'session-123',
        context: originalContext
      };
      mockPCL.getState.mockResolvedValue(mockResponse);

      const result = await adapter.getState();

      expect(result.context).not.toBe(originalContext); // Different reference
      expect(result.context).toEqual(originalContext); // Same content
      
      // Verify deep clone
      (result.context as any).nested.value = 'modified';
      expect(originalContext.nested.value).toBe('test'); // Original unchanged
    });

    it('should validate PCL response structure', async () => {
      // Test null response
      mockPCL.getState.mockResolvedValue(null as any);
      await expect(adapter.getState()).rejects.toMatchObject({
        code: 'invalid_session_state',
        message: 'PCL SessionManager returned invalid session state'
      });

      // Test missing id
      mockPCL.getState.mockResolvedValue({ context: {} } as any);
      await expect(adapter.getState()).rejects.toMatchObject({
        code: 'invalid_session_state'
      });

      // Test non-string id
      mockPCL.getState.mockResolvedValue({ id: 123, context: {} } as any);
      await expect(adapter.getState()).rejects.toMatchObject({
        code: 'invalid_session_state'
      });

      // Test missing context
      mockPCL.getState.mockResolvedValue({ id: 'session-123' } as any);
      await expect(adapter.getState()).rejects.toMatchObject({
        code: 'invalid_session_state'
      });

      // Test empty session ID
      mockPCL.getState.mockResolvedValue({ id: '', context: {} });
      await expect(adapter.getState()).rejects.toMatchObject({
        code: 'empty_session_id',
        message: 'Session ID cannot be empty'
      });
    });

    it('should wrap PCL errors with IntegrationError', async () => {
      const originalError = new Error('Session retrieval failed');
      mockPCL.getState.mockRejectedValue(originalError);

      await expect(adapter.getState()).rejects.toMatchObject({
        name: 'IntegrationError',
        code: 'session_state_unavailable',
        message: 'Failed to retrieve session state',
        data: {
          originalError: 'Session retrieval failed'
        }
      });
    });

    it('should re-throw IntegrationErrors as-is', async () => {
      const integrationError = new IntegrationError('custom_error', 'Custom error');
      mockPCL.getState.mockRejectedValue(integrationError);

      await expect(adapter.getState()).rejects.toBe(integrationError);
    });

    it('should handle empty context', async () => {
      mockPCL.getState.mockResolvedValue({
        id: 'session-123',
        context: {}
      });

      const result = await adapter.getState();

      expect(result).toEqual({
        id: 'session-123',
        context: {}
      });
    });

    it('should handle complex nested context', async () => {
      const complexContext = {
        user: { name: 'test', preferences: { theme: 'dark', lang: 'en' } },
        project: { path: '/test', files: ['a.ts', 'b.ts'] },
        history: [{ action: 'open', time: 123456 }]
      };

      mockPCL.getState.mockResolvedValue({
        id: 'session-complex',
        context: complexContext
      });

      const result = await adapter.getState();

      expect(result.context).toEqual(complexContext);
      expect(result.context).not.toBe(complexContext); // Verify clone
    });
  });

  describe('updateContext', () => {
    it('should update context and return new state', async () => {
      // Arrange
      const patch = { newKey: 'newValue', updatedKey: 'updated' };
      const mockResponse = {
        id: 'session-123',
        context: { 
          existingKey: 'existing',
          newKey: 'newValue',
          updatedKey: 'updated'
        }
      };
      mockPCL.patchContext.mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.updateContext(patch);

      // Assert
      expect(mockPCL.patchContext).toHaveBeenCalledWith({
        newKey: 'newValue',
        updatedKey: 'updated'
      });
      expect(result).toEqual({
        id: 'session-123',
        context: mockResponse.context
      });
    });

    it('should validate patch input', async () => {
      // Test null patch
      await expect(adapter.updateContext(null as any)).rejects.toMatchObject({
        code: 'invalid_patch',
        message: 'Context patch must be a non-null object'
      });

      // Test undefined patch
      await expect(adapter.updateContext(undefined as any)).rejects.toMatchObject({
        code: 'invalid_patch'
      });

      // Test array patch
      await expect(adapter.updateContext([] as any)).rejects.toMatchObject({
        code: 'invalid_patch'
      });

      // Test string patch
      await expect(adapter.updateContext('not-object' as any)).rejects.toMatchObject({
        code: 'invalid_patch'
      });

      // Test empty patch
      await expect(adapter.updateContext({})).rejects.toMatchObject({
        code: 'empty_patch',
        message: 'Context patch cannot be empty'
      });
    });

    it('should sanitize patch by removing undefined values', async () => {
      const patch = {
        validKey: 'validValue',
        undefinedKey: undefined,
        nullKey: null,
        emptyString: '',
        zero: 0,
        falsy: false
      };

      const expectedSanitized = {
        validKey: 'validValue',
        nullKey: null,
        emptyString: '',
        zero: 0,
        falsy: false
      };

      mockPCL.patchContext.mockResolvedValue({
        id: 'session-123',
        context: expectedSanitized
      });

      await adapter.updateContext(patch);

      expect(mockPCL.patchContext).toHaveBeenCalledWith(expectedSanitized);
    });

    it('should sanitize patch by removing invalid keys', async () => {
      const patch = {
        'validKey': 'value1',
        '': 'emptyKeyValue', // Invalid: empty key
        123: 'numericKey' // Will be converted to string by object
      };

      mockPCL.patchContext.mockResolvedValue({
        id: 'session-123',
        context: { validKey: 'value1', '123': 'numericKey' }
      });

      await adapter.updateContext(patch);

      // Should exclude empty string key but include numeric key (converted to string)
      expect(mockPCL.patchContext).toHaveBeenCalledWith({
        validKey: 'value1',
        '123': 'numericKey'
      });
    });

    it('should validate PCL response structure', async () => {
      const validPatch = { key: 'value' };

      // Test null response
      mockPCL.patchContext.mockResolvedValue(null as any);
      await expect(adapter.updateContext(validPatch)).rejects.toMatchObject({
        code: 'invalid_session_response',
        message: 'PCL SessionManager returned invalid response after context update'
      });

      // Test missing id
      mockPCL.patchContext.mockResolvedValue({ context: {} } as any);
      await expect(adapter.updateContext(validPatch)).rejects.toMatchObject({
        code: 'invalid_session_response'
      });

      // Test missing context
      mockPCL.patchContext.mockResolvedValue({ id: 'session-123' } as any);
      await expect(adapter.updateContext(validPatch)).rejects.toMatchObject({
        code: 'invalid_session_response'
      });
    });

    it('should wrap PCL errors with IntegrationError', async () => {
      const patch = { key: 'value' };
      const originalError = new Error('Context update failed');
      mockPCL.patchContext.mockRejectedValue(originalError);

      await expect(adapter.updateContext(patch)).rejects.toMatchObject({
        name: 'IntegrationError',
        code: 'session_update_failed',
        message: 'Failed to update session context',
        data: {
          patch,
          originalError: 'Context update failed'
        }
      });
    });

    it('should handle JSON serialization failures gracefully', async () => {
      // Create circular reference that will fail JSON serialization
      const circularObj: any = { key: 'value' };
      circularObj.circular = circularObj;

      const mockResponse = {
        id: 'session-123',
        context: circularObj
      };
      mockPCL.patchContext.mockResolvedValue(mockResponse);

      const result = await adapter.updateContext({ test: 'value' });

      // Should return empty object as fallback for serialization failure
      expect(result.context).toEqual({});
    });

    it('should create immutable result', async () => {
      const patch = { key: 'value' };
      const originalContext = { key: 'value', other: 'data' };
      
      mockPCL.patchContext.mockResolvedValue({
        id: 'session-123',
        context: originalContext
      });

      const result = await adapter.updateContext(patch);

      expect(result.context).not.toBe(originalContext); // Different reference
      expect(result.context).toEqual(originalContext); // Same content
    });
  });

  describe('error handling edge cases', () => {
    it('should handle non-Error rejections in getState', async () => {
      mockPCL.getState.mockRejectedValue('string error');

      await expect(adapter.getState()).rejects.toMatchObject({
        code: 'session_state_unavailable',
        data: {
          originalError: 'Unknown error'
        }
      });
    });

    it('should handle non-Error rejections in updateContext', async () => {
      mockPCL.patchContext.mockRejectedValue({ error: 'object error' });

      await expect(adapter.updateContext({ key: 'value' })).rejects.toMatchObject({
        code: 'session_update_failed',
        data: {
          originalError: 'Unknown error'
        }
      });
    });

    it('should preserve error context in updateContext', async () => {
      const patch = { specificKey: 'specificValue' };
      mockPCL.patchContext.mockRejectedValue(new Error('Network timeout'));

      try {
        await adapter.updateContext(patch);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(IntegrationError);
        expect((error as IntegrationError).data).toEqual({
          patch,
          originalError: 'Network timeout'
        });
      }
    });
  });
});
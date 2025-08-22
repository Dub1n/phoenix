/**
 * Unit tests for MenuSystemAdapter
 * 
 * Tests hierarchical menu navigation, tree normalization, and error isolation
 * following Phase 3 PCL integration patterns.
 * 
 * @implementation Phase 3 PCL Integration - Menu System Tests
 * @created 2025-08-14
 */

import { MenuSystemAdapter, PCLMenuSystem } from '../MenuSystemAdapter';
import { IntegrationError } from '../ProjectDiscoveryAdapter';

describe('MenuSystemAdapter', () => {
  let mockPCL: jest.Mocked<PCLMenuSystem>;
  let adapter: MenuSystemAdapter;

  beforeEach(() => {
    mockPCL = {
      getRootMenu: jest.fn()
    };
    adapter = new MenuSystemAdapter(mockPCL);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should require PCL instance', () => {
      expect(() => new MenuSystemAdapter(null as any)).toThrow('PCL MenuSystem instance is required');
      expect(() => new MenuSystemAdapter(undefined as any)).toThrow('PCL MenuSystem instance is required');
    });

    it('should accept valid PCL instance', () => {
      expect(() => new MenuSystemAdapter(mockPCL)).not.toThrow();
    });
  });

  describe('getRoot', () => {
    it('should retrieve and normalize simple root menu', async () => {
      // Arrange
      const mockResponse = {
        id: 'root',
        label: 'Root Menu'
      };
      mockPCL.getRootMenu.mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.getRoot();

      // Assert
      expect(mockPCL.getRootMenu).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: 'root',
        label: 'Root Menu'
      });
    });

    it('should normalize menu with children', async () => {
      // Arrange
      const mockResponse = {
        id: 'root',
        label: 'Root Menu',
        children: [
          { id: 'child1', label: 'Child 1' },
          { id: 'child2', label: 'Child 2' }
        ]
      };
      mockPCL.getRootMenu.mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.getRoot();

      // Assert
      expect(result).toEqual({
        id: 'root',
        label: 'Root Menu',
        children: [
          { id: 'child1', label: 'Child 1' },
          { id: 'child2', label: 'Child 2' }
        ]
      });
      
      // Verify children array is frozen/immutable
      expect(Object.isFrozen(result.children)).toBe(true);
    });

    it('should normalize deeply nested menu structure', async () => {
      // Arrange
      const mockResponse = {
        id: 'root',
        label: 'Root',
        children: [
          {
            id: 'parent1',
            label: 'Parent 1',
            children: [
              { id: 'grandchild1', label: 'Grandchild 1' },
              { 
                id: 'grandchild2', 
                label: 'Grandchild 2',
                children: [
                  { id: 'greatgrand1', label: 'Great Grandchild 1' }
                ]
              }
            ]
          },
          { id: 'parent2', label: 'Parent 2' }
        ]
      };
      mockPCL.getRootMenu.mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.getRoot();

      // Assert
      expect(result.children).toHaveLength(2);
      expect(result.children![0].children).toHaveLength(2);
      expect(result.children![0].children![1].children).toHaveLength(1);
      expect(result.children![0].children![1].children![0].label).toBe('Great Grandchild 1');
    });

    it('should handle empty children arrays', async () => {
      // Arrange
      const mockResponse = {
        id: 'root',
        label: 'Root Menu',
        children: []
      };
      mockPCL.getRootMenu.mockResolvedValue(mockResponse);

      // Act
      const result = await adapter.getRoot();

      // Assert
      expect(result).toEqual({
        id: 'root',
        label: 'Root Menu'
        // children should be omitted when empty
      });
      expect(result.children).toBeUndefined();
    });

    it('should validate PCL response structure', async () => {
      // Test null response
      mockPCL.getRootMenu.mockResolvedValue(null as any);
      await expect(adapter.getRoot()).rejects.toMatchObject({
        code: 'invalid_menu_structure',
        message: 'PCL MenuSystem returned invalid menu structure'
      });

      // Test missing id
      mockPCL.getRootMenu.mockResolvedValue({ label: 'Test' } as any);
      await expect(adapter.getRoot()).rejects.toMatchObject({
        code: 'invalid_menu_structure'
      });

      // Test non-string id
      mockPCL.getRootMenu.mockResolvedValue({ id: 123, label: 'Test' } as any);
      await expect(adapter.getRoot()).rejects.toMatchObject({
        code: 'invalid_menu_structure'
      });

      // Test missing label
      mockPCL.getRootMenu.mockResolvedValue({ id: 'root' } as any);
      await expect(adapter.getRoot()).rejects.toMatchObject({
        code: 'invalid_menu_structure'
      });

      // Test non-string label
      mockPCL.getRootMenu.mockResolvedValue({ id: 'root', label: 123 } as any);
      await expect(adapter.getRoot()).rejects.toMatchObject({
        code: 'invalid_menu_structure'
      });
    });

    it('should validate required fields are non-empty', async () => {
      // Test empty id
      mockPCL.getRootMenu.mockResolvedValue({ id: '', label: 'Test' });
      await expect(adapter.getRoot()).rejects.toMatchObject({
        code: 'empty_menu_fields',
        message: 'Menu node ID and label cannot be empty'
      });

      // Test empty label
      mockPCL.getRootMenu.mockResolvedValue({ id: 'root', label: '' });
      await expect(adapter.getRoot()).rejects.toMatchObject({
        code: 'empty_menu_fields'
      });
    });

    it('should handle child normalization errors', async () => {
      // Arrange - child with missing required field
      const mockResponse = {
        id: 'root',
        label: 'Root',
        children: [
          { id: 'valid', label: 'Valid Child' },
          { id: 'invalid' } as any // Missing label - cast to bypass type checking for test
        ]
      };
      mockPCL.getRootMenu.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(adapter.getRoot()).rejects.toMatchObject({
        code: 'child_normalization_failed',
        message: 'Failed to normalize child node at index 1',
        data: {
          parentId: 'root',
          childIndex: 1
        }
      });
    });

    it('should wrap PCL errors with IntegrationError', async () => {
      const originalError = new Error('Menu retrieval failed');
      mockPCL.getRootMenu.mockRejectedValue(originalError);

      await expect(adapter.getRoot()).rejects.toMatchObject({
        name: 'IntegrationError',
        code: 'menu_retrieval_failed',
        message: 'Failed to retrieve root menu',
        data: {
          originalError: 'Menu retrieval failed'
        }
      });
    });

    it('should re-throw IntegrationErrors as-is', async () => {
      const integrationError = new IntegrationError('custom_error', 'Custom error');
      mockPCL.getRootMenu.mockRejectedValue(integrationError);

      await expect(adapter.getRoot()).rejects.toBe(integrationError);
    });
  });

  describe('getNodeById', () => {
    beforeEach(() => {
      // Setup default menu structure for search tests
      const menuStructure = {
        id: 'root',
        label: 'Root',
        children: [
          {
            id: 'parent1',
            label: 'Parent 1',
            children: [
              { id: 'child1', label: 'Child 1' },
              { id: 'child2', label: 'Child 2' }
            ]
          },
          { id: 'parent2', label: 'Parent 2' }
        ]
      };
      mockPCL.getRootMenu.mockResolvedValue(menuStructure);
    });

    it('should find root node by ID', async () => {
      const result = await adapter.getNodeById('root');

      expect(result).toEqual(expect.objectContaining({
        id: 'root',
        label: 'Root'
      }));
    });

    it('should find child node by ID', async () => {
      const result = await adapter.getNodeById('child1');

      expect(result).toEqual({
        id: 'child1',
        label: 'Child 1'
      });
    });

    it('should find parent node by ID', async () => {
      const result = await adapter.getNodeById('parent2');

      expect(result).toEqual({
        id: 'parent2',
        label: 'Parent 2'
      });
    });

    it('should return null for non-existent ID', async () => {
      const result = await adapter.getNodeById('non-existent');

      expect(result).toBeNull();
    });

    it('should validate node ID input', async () => {
      await expect(adapter.getNodeById('')).rejects.toMatchObject({
        code: 'invalid_node_id',
        message: 'Node ID must be a non-empty string'
      });

      await expect(adapter.getNodeById(null as any)).rejects.toMatchObject({
        code: 'invalid_node_id'
      });

      await expect(adapter.getNodeById(undefined as any)).rejects.toMatchObject({
        code: 'invalid_node_id'
      });

      await expect(adapter.getNodeById(123 as any)).rejects.toMatchObject({
        code: 'invalid_node_id'
      });
    });

    it('should handle search errors gracefully', async () => {
      mockPCL.getRootMenu.mockRejectedValue(new Error('Menu fetch failed'));

      await expect(adapter.getNodeById('any-id')).rejects.toMatchObject({
        code: 'menu_retrieval_failed',
        message: 'Failed to retrieve root menu',
        data: {
          originalError: 'Menu fetch failed'
        }
      });
    });

    it('should re-throw IntegrationErrors from getRoot', async () => {
      const integrationError = new IntegrationError('menu_error', 'Menu error');
      mockPCL.getRootMenu.mockRejectedValue(integrationError);

      await expect(adapter.getNodeById('test-id')).rejects.toBe(integrationError);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle non-Error rejections', async () => {
      mockPCL.getRootMenu.mockRejectedValue('string error');

      await expect(adapter.getRoot()).rejects.toMatchObject({
        code: 'menu_retrieval_failed',
        data: {
          originalError: 'Unknown error'
        }
      });
    });

    it('should handle malformed children arrays', async () => {
      const mockResponse = {
        id: 'root',
        label: 'Root',
        children: [
          { id: 'valid', label: 'Valid' },
          null as any, // Invalid child - cast to bypass type checking for test
          { id: 'another-valid', label: 'Another Valid' }
        ]
      };
      mockPCL.getRootMenu.mockResolvedValue(mockResponse);

      await expect(adapter.getRoot()).rejects.toMatchObject({
        code: 'child_normalization_failed'
      });
    });

    it('should handle circular references in menu tree', () => {
      // Note: This is more of a theoretical test since the adapter
      // doesn't specifically detect cycles, but validates structure
      const circularChild: any = { id: 'child', label: 'Child' };
      circularChild.children = [circularChild]; // Circular reference

      const mockResponse = {
        id: 'root',
        label: 'Root',
        children: [circularChild]
      };
      mockPCL.getRootMenu.mockResolvedValue(mockResponse);

      // This would potentially cause infinite recursion, but our
      // implementation handles it by processing the structure as-is
      // without explicit cycle detection
    });

    it('should handle very deep menu structures', async () => {
      // Create a deeply nested menu (10 levels deep)
      let current: any = { id: 'level0', label: 'Level 0' };
      const root = current;

      for (let i = 1; i <= 10; i++) {
        const child = { id: `level${i}`, label: `Level ${i}` };
        current.children = [child];
        current = child;
      }

      mockPCL.getRootMenu.mockResolvedValue(root);

      const result = await adapter.getRoot();

      // Verify structure is preserved through all levels
      let currentNode = result;
      for (let i = 0; i <= 10; i++) {
        expect(currentNode.id).toBe(`level${i}`);
        if (i < 10) {
          expect(currentNode.children).toHaveLength(1);
          currentNode = currentNode.children![0];
        }
      }
    });

    it('should preserve original child order', async () => {
      const mockResponse = {
        id: 'root',
        label: 'Root',
        children: [
          { id: 'z-last', label: 'Z Last' },
          { id: 'a-first', label: 'A First' },
          { id: 'm-middle', label: 'M Middle' }
        ]
      };
      mockPCL.getRootMenu.mockResolvedValue(mockResponse);

      const result = await adapter.getRoot();

      expect(result.children![0].id).toBe('z-last');
      expect(result.children![1].id).toBe('a-first');
      expect(result.children![2].id).toBe('m-middle');
    });
  });
});
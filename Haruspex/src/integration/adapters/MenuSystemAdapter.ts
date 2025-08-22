/**
 * Menu System Adapter for PCL Integration
 * 
 * Provides adapter layer between Phoenix Code Lite MenuSystem component
 * and Haruspex-native interfaces, supporting hierarchical navigation structures.
 * 
 * @implementation Phase 3 PCL Integration - Menu System
 * @created 2025-08-14
 */

import { IntegrationError } from './ProjectDiscoveryAdapter';

export interface MenuNode {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly MenuNode[];
}

export interface HaruspexMenuSystem {
  getRoot(): Promise<MenuNode>;
  getNodeById?(id: string): Promise<MenuNode | null>;
}

export interface PCLMenuSystem {
  getRootMenu(): Promise<{ 
    id: string; 
    label: string; 
    children?: { id: string; label: string; children?: any[] }[]
  }>;
}

/**
 * Adapter for Phoenix Code Lite MenuSystem component
 * 
 * Harmonizes PCL's menu system interface to Haruspex's unified API,
 * providing recursive menu tree normalization and validation.
 */
export class MenuSystemAdapter implements HaruspexMenuSystem {
  constructor(private readonly pcl: PCLMenuSystem) {
    if (!pcl) {
      throw new Error('PCL MenuSystem instance is required');
    }
  }

  /**
   * Get root menu node with all children
   * 
   * @returns Promise resolving to root menu node
   * @throws IntegrationError - When menu retrieval fails or structure is invalid
   */
  public async getRoot(): Promise<MenuNode> {
    try {
      const result = await this.pcl.getRootMenu();
      
      // Validate PCL response structure
      if (!result || typeof result.id !== 'string' || typeof result.label !== 'string') {
        throw new IntegrationError(
          'invalid_menu_structure',
          'PCL MenuSystem returned invalid menu structure',
          { response: result }
        );
      }

      // Ensure required fields are non-empty
      if (result.id.length === 0 || result.label.length === 0) {
        throw new IntegrationError(
          'empty_menu_fields',
          'Menu node ID and label cannot be empty',
          { id: result.id, label: result.label }
        );
      }

      // Normalize and validate menu tree
      return this.normalizeMenuNode(result);
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new IntegrationError(
        'menu_retrieval_failed',
        'Failed to retrieve root menu',
        { originalError: errorMessage }
      );
    }
  }

  /**
   * Get specific menu node by ID (optional implementation)
   * 
   * @param id - Menu node ID to retrieve
   * @returns Promise resolving to menu node or null if not found
   * @throws IntegrationError - When node retrieval fails
   */
  public async getNodeById(id: string): Promise<MenuNode | null> {
    if (!id || typeof id !== 'string' || id.length === 0) {
      throw new IntegrationError(
        'invalid_node_id',
        'Node ID must be a non-empty string',
        { id }
      );
    }

    try {
      // Get root menu and search for node
      const root = await this.getRoot();
      return this.findNodeInTree(root, id);
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new IntegrationError(
        'node_search_failed',
        'Failed to find menu node by ID',
        { 
          nodeId: id,
          originalError: errorMessage
        }
      );
    }
  }

  /**
   * Normalize PCL menu node to Haruspex format
   * 
   * @private
   * @param pclNode - PCL menu node to normalize
   * @returns Normalized Haruspex menu node
   * @throws IntegrationError - When normalization fails due to invalid structure
   */
  private normalizeMenuNode(pclNode: any): MenuNode {
    // Validate basic node structure
    if (!pclNode || typeof pclNode.id !== 'string' || typeof pclNode.label !== 'string') {
      throw new IntegrationError(
        'invalid_node_structure',
        'Menu node missing required id or label',
        { node: pclNode }
      );
    }

    const normalizedNode: MenuNode = {
      id: pclNode.id,
      label: pclNode.label
    };

    // Process children if they exist
    if (pclNode.children && Array.isArray(pclNode.children)) {
      try {
        // Recursively normalize all children
        const normalizedChildren = pclNode.children.map((child: any, index: number) => {
          try {
            return this.normalizeMenuNode(child);
          } catch (err) {
            throw new IntegrationError(
              'child_normalization_failed',
              `Failed to normalize child node at index ${index}`,
              { 
                parentId: pclNode.id,
                childIndex: index,
                child,
                originalError: err instanceof Error ? err.message : 'Unknown error'
              }
            );
          }
        });

        // Only add children if there are valid ones
        if (normalizedChildren.length > 0) {
          // Create readonly array
          (normalizedNode as any).children = Object.freeze([...normalizedChildren]);
        }
      } catch (err) {
        // Re-throw IntegrationErrors
        if (err instanceof IntegrationError) {
          throw err;
        }

        throw new IntegrationError(
          'children_processing_failed',
          'Failed to process menu node children',
          { 
            parentId: pclNode.id,
            childrenCount: pclNode.children.length,
            originalError: err instanceof Error ? err.message : 'Unknown error'
          }
        );
      }
    }

    return normalizedNode;
  }

  /**
   * Find menu node by ID in menu tree
   * 
   * @private
   * @param node - Root node to search from
   * @param targetId - ID to search for
   * @returns Found menu node or null
   */
  private findNodeInTree(node: MenuNode, targetId: string): MenuNode | null {
    // Check current node
    if (node.id === targetId) {
      return node;
    }

    // Search in children recursively
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeInTree(child, targetId);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Validate menu tree structure integrity
   * 
   * @private
   * @param node - Node to validate
   * @param visitedIds - Set of already visited IDs to detect cycles
   * @throws IntegrationError - When validation fails
   */
  private validateMenuTree(node: MenuNode, visitedIds: Set<string> = new Set()): void {
    // Check for duplicate IDs (cycle detection)
    if (visitedIds.has(node.id)) {
      throw new IntegrationError(
        'duplicate_menu_id',
        'Menu tree contains duplicate ID, indicating a cycle or invalid structure',
        { duplicateId: node.id }
      );
    }

    visitedIds.add(node.id);

    // Validate children recursively
    if (node.children) {
      for (const child of node.children) {
        this.validateMenuTree(child, visitedIds);
      }
    }
  }
}
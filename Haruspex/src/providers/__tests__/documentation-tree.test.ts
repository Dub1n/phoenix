/**
 * @fileoverview Documentation Tree Provider Tests - Phase 4 Implementation
 * @author Claude Code Implementation
 * @created 2025-08-14
 * 
 * Follows Phase 3 validated patterns for VSCode mocking and error isolation testing
 */

import * as vscode from 'vscode';
import { DocumentationTreeProvider, VSCodeDocumentationTreeNode } from '../documentation-tree';
import { HaruspexCoreEngine } from '../../core/haruspex-core-engine';
import { TelemetryCollector } from '../../core/telemetry-collector';
import { DocumentationTreeNode as CoreDocumentationTreeNode } from '../../components/haruspex-stub-parser';

// ✅ APPLY: Phase 3 inline VSCode mock pattern (prevents circular references)
jest.mock('vscode', () => ({
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  },
  TreeItem: jest.fn().mockImplementation((label, state) => ({
    label,
    collapsibleState: state,
    iconPath: undefined,
    tooltip: undefined,
    command: undefined,
    contextValue: undefined
  })),
  ThemeIcon: jest.fn().mockImplementation((id, color) => ({ id, color })),
  ThemeColor: jest.fn().mockImplementation((id) => ({ id })),
  EventEmitter: jest.fn().mockImplementation(() => ({
    fire: jest.fn(),
    event: jest.fn()
  }))
}));

describe('DocumentationTreeProvider with Phase 3 Integration', () => {
  let mockEngine: jest.Mocked<HaruspexCoreEngine>;
  let mockTelemetry: jest.Mocked<TelemetryCollector>;
  let provider: DocumentationTreeProvider;

  const coreTestNodes: CoreDocumentationTreeNode[] = [
    {
      label: 'File One',
      type: 'file',
      filePath: '/tmp/one.ts',
      metadata: { description: 'First test file' },
      symbolInfo: { name: 'TestFunction', type: 'function' } as any
    },
    {
      label: 'File Two',
      type: 'file',
      filePath: '/tmp/two.ts',
      metadata: { description: 'Second test file', tags: ['test', 'example'] },
      symbolInfo: { name: 'TestClass', type: 'class' } as any
    }
  ];

  // Note: expectedVSCodeNodes removed as conversion is tested implicitly in tests

  beforeEach(() => {
    // ✅ APPLY: Phase 3 mock patterns for engine and telemetry
    mockEngine = {
      getDocumentationTree: jest.fn().mockResolvedValue(coreTestNodes)
    } as any;

    mockTelemetry = {
      recordEvent: jest.fn(),
      recordErrorEvent: jest.fn()
    } as any;

    provider = new DocumentationTreeProvider(mockEngine, mockTelemetry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChildren with Phase 3 error isolation', () => {
    it('should populate children from engine with built-in reliability', async () => {
      const children = await provider.getChildren();
      
      expect(children).toHaveLength(2);
      expect(children[0].label).toBe('File One');
      expect(children[0].metadata.filePath).toBe('/tmp/one.ts');
      expect(children[0].metadata.completeness).toBe(75); // file + symbols + metadata
      expect(mockEngine.getDocumentationTree).toHaveBeenCalled();
      expect(mockTelemetry.recordEvent).toHaveBeenCalledWith('tree_provider_event', 
        expect.objectContaining({
          event_type: 'tree_root_loaded',
          node_count: 2
        })
      );
    });

    it('should handle errors gracefully with fallback', async () => {
      mockEngine.getDocumentationTree.mockRejectedValue(new Error('Engine failure'));
      
      const children = await provider.getChildren();
      
      expect(children).toEqual([]);
      expect(mockTelemetry.recordErrorEvent).toHaveBeenCalledWith('tree_fetch_failed', 'ui', 
        expect.objectContaining({
          error_code: 'tree_data_unavailable'
        })
      );
    });

    it('should return child nodes for expanded elements', async () => {
      const childNode: VSCodeDocumentationTreeNode = {
        id: 'child1',
        label: 'Child Node',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        metadata: { filePath: '/tmp/child.ts', completeness: 60 }
      };

      const parentNode: VSCodeDocumentationTreeNode = {
        id: 'parent',
        label: 'Parent Node',
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
        metadata: { completeness: 80 },
        children: [childNode]
      };

      const children = await provider.getChildren(parentNode);
      
      expect(children).toHaveLength(1);
      expect(children[0]).toEqual(childNode);
    });
  });

  describe('getTreeItem with Phase 3 TypeScript patterns', () => {
    it('should create tree items with conditional property assignment', () => {
      const testNode1: VSCodeDocumentationTreeNode = {
        id: 'test1',
        label: 'Test Node 1',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        metadata: { filePath: '/tmp/test1.ts', completeness: 45 }
      };

      const testNode2: VSCodeDocumentationTreeNode = {
        id: 'test2', 
        label: 'Test Node 2',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        metadata: { filePath: '/tmp/test2.ts', completeness: 85 }
      };

      const lowItem = provider.getTreeItem(testNode1);
      const highItem = provider.getTreeItem(testNode2);

      // Verify conditional property assignment worked
      expect(lowItem.iconPath).toBeDefined();
      expect(lowItem.command).toBeDefined();
      expect(lowItem.contextValue).toBe('haruspexDocNodeWithFile');
      expect((lowItem.iconPath as any).id).toBe('warning'); // Low completeness
      
      expect(highItem.iconPath).toBeDefined();
      expect((highItem.iconPath as any).id).toBe('check'); // High completeness
      expect(highItem.command?.command).toBe('haruspex.navigateToFile');
    });

    it('should handle nodes without file paths', () => {
      const nodeWithoutFile: VSCodeDocumentationTreeNode = {
        id: 'folder1',
        label: 'Folder',
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        metadata: { completeness: 50 }
      };

      const item = provider.getTreeItem(nodeWithoutFile);
      
      expect(item.command).toBeUndefined();
      expect(item.contextValue).toBe('haruspexDocNode');
    });

    it('should assign theme-aware icons based on completeness thresholds', () => {
      const lowCompletenessNode: VSCodeDocumentationTreeNode = {
        id: 'low',
        label: 'Low Completeness',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        metadata: { completeness: 30 }
      };

      const mediumCompletenessNode: VSCodeDocumentationTreeNode = {
        id: 'medium', 
        label: 'Medium Completeness',
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        metadata: { completeness: 65 }
      };

      const highCompletenessNode: VSCodeDocumentationTreeNode = {
        id: 'high',
        label: 'High Completeness', 
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        metadata: { completeness: 95 }
      };

      const lowItem = provider.getTreeItem(lowCompletenessNode);
      const mediumItem = provider.getTreeItem(mediumCompletenessNode);
      const highItem = provider.getTreeItem(highCompletenessNode);

      expect((lowItem.iconPath as any).id).toBe('warning');
      expect((mediumItem.iconPath as any).id).toBe('info');
      expect((highItem.iconPath as any).id).toBe('check');
    });
  });

  describe('refresh with telemetry integration', () => {
    it('should emit telemetry events on refresh', () => {
      provider.refresh();
      
      expect(mockTelemetry.recordEvent).toHaveBeenCalledWith('tree_provider_event', {
        event_type: 'tree_refresh_requested',
        timestamp: expect.any(Number)
      });
    });

    it('should fire tree change event on refresh', () => {
      const mockFire = jest.fn();
      (provider as any).onDidChangeTreeDataEmitter.fire = mockFire;
      
      provider.refresh();
      
      expect(mockFire).toHaveBeenCalled();
    });
  });

  describe('constructor initialization', () => {
    it('should initialize with engine and telemetry dependencies', () => {
      expect(provider).toBeInstanceOf(DocumentationTreeProvider);
      expect((provider as any).engine).toBe(mockEngine);
      expect((provider as any).telemetry).toBe(mockTelemetry);
    });

    it('should have onDidChangeTreeData event emitter', () => {
      expect(provider.onDidChangeTreeData).toBeDefined();
    });
  });
});
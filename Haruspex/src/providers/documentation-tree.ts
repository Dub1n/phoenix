/**
 * @fileoverview Documentation Tree Provider - Phase 4 Implementation 
 * @author Claude Code Implementation
 * @created 2025-08-14
 * 
 * Applies validated error isolation, performance optimization, and telemetry
 * patterns from Phase 3 PCL integration implementation.
 */

import * as vscode from 'vscode';
import { HaruspexCoreEngine } from '../core/haruspex-core-engine';
import { TelemetryCollector } from '../core/telemetry-collector';
import { DocumentationTreeNode as CoreDocumentationTreeNode } from '../components/haruspex-stub-parser';

/**
 * VSCode-specific documentation tree node interface with completeness tracking
 */
export interface VSCodeDocumentationTreeNode {
  readonly id: string;
  readonly label: string;
  readonly collapsibleState: vscode.TreeItemCollapsibleState;
  readonly metadata: {
    readonly filePath?: string;
    readonly completeness: number; // 0..100
  };
  readonly children?: readonly VSCodeDocumentationTreeNode[];
}

/**
 * Documentation Tree Provider with Phase 3 Integration Patterns
 * 
 * Applies validated error isolation, performance optimization, and telemetry
 * patterns from Phase 3 PCL integration implementation.
 */
export class DocumentationTreeProvider implements vscode.TreeDataProvider<VSCodeDocumentationTreeNode> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<VSCodeDocumentationTreeNode | void>();
  public readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  public constructor(
    private readonly engine: HaruspexCoreEngine, // Phase 3 PCL integration ready
    private readonly telemetry: TelemetryCollector // Phase 3 privacy-compliant telemetry
  ) {}

  /**
   * Get tree children with built-in engine reliability patterns
   * 
   * Leverages HaruspexCoreEngine's built-in circuit breaker and error boundary patterns
   */
  public async getChildren(element?: VSCodeDocumentationTreeNode): Promise<VSCodeDocumentationTreeNode[]> {
    const startTime = Date.now();
    
    try {
      if (!element) {
        // Use engine's built-in reliability patterns for root data
        const coreTreeData = await this.engine.getDocumentationTree();
        
        // Convert core tree data to VSCode-specific format
        const vscodeTreeData = this.convertToVSCodeNodes(coreTreeData);
        
        // ✅ APPLY: Phase 3 telemetry pattern
        this.telemetry.recordEvent('tree_provider_event', {
          event_type: 'tree_root_loaded',
          node_count: vscodeTreeData.length,
          performance_ms: Date.now() - startTime
        });
        
        return vscodeTreeData;
      }
      
      // Return children if available, otherwise empty array
      return element.children ? [...element.children] : [];
    } catch (error) {
      // ✅ APPLY: Phase 3 UI-safe error handling
      this.telemetry.recordErrorEvent('tree_fetch_failed', 'ui', {
        error_code: 'tree_data_unavailable',
        performance_ms: Date.now() - startTime
      });
      
      // UI should never crash - always return safe fallback
      return [];
    }
  }

  /**
   * Create tree items with Phase 3 TypeScript patterns
   * 
   * Applies conditional property assignment for exactOptionalPropertyTypes
   */
  public getTreeItem(element: VSCodeDocumentationTreeNode): vscode.TreeItem {
    // ✅ APPLY: Phase 3 conditional property assignment pattern
    const item: vscode.TreeItem = {
      label: element.label,
      collapsibleState: element.collapsibleState
    };
    
    // Theme-aware icons based on completeness thresholds
    if (element.metadata.completeness < 50) {
      item.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'));
      item.tooltip = `Documentation ${element.metadata.completeness}% complete (needs attention)`;
    } else if (element.metadata.completeness < 80) {
      item.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('problemsInfoIcon.foreground'));
      item.tooltip = `Documentation ${element.metadata.completeness}% complete (good progress)`;
    } else {
      item.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('terminal.ansiGreen'));
      item.tooltip = `Documentation ${element.metadata.completeness}% complete (excellent)`;
    }

    // ✅ APPLY: Phase 3 conditional property assignment
    if (element.metadata.filePath) {
      item.command = {
        command: 'haruspex.navigateToFile',
        title: 'Open File',
        arguments: [element.metadata.filePath]
      };
      item.contextValue = 'haruspexDocNodeWithFile';
    } else {
      item.contextValue = 'haruspexDocNode';
    }

    return item;
  }

  /**
   * Refresh tree with telemetry tracking
   * 
   * Applies Phase 3 privacy-compliant event recording
   */
  public refresh(): void {
    // ✅ APPLY: Phase 3 telemetry pattern
    this.telemetry.recordEvent('tree_provider_event', {
      event_type: 'tree_refresh_requested',
      // Privacy-safe: No file paths or project-specific data
      timestamp: Date.now()
    });
    
    this.onDidChangeTreeDataEmitter.fire();
  }

  /**
   * Convert core engine DocumentationTreeNode to VSCode-specific format
   * 
   * @private
   * @param coreNodes - Core engine tree nodes
   * @returns VSCode-compatible tree nodes with completeness metadata
   */
  private convertToVSCodeNodes(coreNodes: CoreDocumentationTreeNode[]): VSCodeDocumentationTreeNode[] {
    return coreNodes.map((coreNode, index) => {
      // Calculate completeness based on available metadata
      const completeness = this.calculateCompleteness(coreNode);
      
      // Determine collapsible state based on node type and children
      let collapsibleState = vscode.TreeItemCollapsibleState.None;
      if (coreNode.type === 'directory' || (coreNode.children && coreNode.children.length > 0)) {
        collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
      }

      // Create VSCode-specific node
      const vscodeNode: VSCodeDocumentationTreeNode = {
        id: `${coreNode.filePath || coreNode.label}-${index}`,
        label: coreNode.label,
        collapsibleState,
        metadata: {
          completeness
        }
      };

      // ✅ APPLY: Phase 3 conditional property assignment for exactOptionalPropertyTypes
      if (coreNode.filePath) {
        (vscodeNode.metadata as any).filePath = coreNode.filePath;
      }

      // Recursively convert children if present
      if (coreNode.children && coreNode.children.length > 0) {
        (vscodeNode as any).children = this.convertToVSCodeNodes(coreNode.children);
      }

      return vscodeNode;
    });
  }

  /**
   * Calculate documentation completeness score for a node
   * 
   * @private
   * @param node - Core documentation tree node
   * @returns Completeness percentage (0-100)
   */
  private calculateCompleteness(node: CoreDocumentationTreeNode): number {
    let score = 0;
    const maxScore = 100; // Fixed max score for consistent percentages

    // Base score for having a file (20 points)
    if (node.filePath) {
      score += 20;
    }

    // Score for having symbols/exports (30 points)
    if (node.symbolInfo) {
      score += 30;
    }

    // Score for having metadata/description (25 points)
    if (node.metadata && Object.keys(node.metadata).length > 0) {
      score += 25;
    }

    // Score for having children (structure) (25 points)
    if (node.children && node.children.length > 0) {
      score += 25;
    }

    // Return percentage with minimum baseline of 10% for any node
    return Math.max(10, Math.min(100, score));
  }
}
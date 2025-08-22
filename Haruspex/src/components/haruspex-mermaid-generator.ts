/**
 * Haruspex Mermaid Generator Implementation
 * 
 * Generates Mermaid diagrams from architectural data including dependency graphs,
 * component relationships, and system architecture visualizations.
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

import { ArchitectureData, ComponentRelationship, DependencyNode } from './haruspex-stub-parser';

export interface MermaidDiagram {
  /** Unique diagram identifier */
  id: string;
  /** Human-readable diagram title */
  title: string;
  /** Mermaid diagram source code */
  source: string;
  /** Diagram type */
  type: 'graph' | 'flowchart' | 'classDiagram' | 'stateDiagram' | 'sequenceDiagram';
  /** Diagram metadata */
  metadata?: {
    nodeCount?: number;
    edgeCount?: number;
    complexity?: 'low' | 'medium' | 'high';
    generated?: number; // timestamp
  };
}

export interface DiagramGenerationOptions {
  /** Maximum number of nodes to include */
  maxNodes?: number;
  /** Include node labels */
  includeLabels?: boolean;
  /** Diagram direction */
  direction?: 'TD' | 'BT' | 'LR' | 'RL';
  /** Include metadata in diagrams */
  includeMetadata?: boolean;
  /** Simplify complex relationships */
  simplifyRelationships?: boolean;
}

/**
 * Mermaid Generator for creating architectural diagrams from parsed data
 * 
 * Generates various types of Mermaid diagrams to visualize:
 * - System architecture and component relationships
 * - Dependency graphs and module structures
 * - Data flow and interaction patterns
 * - Project structure and organization
 */
export class HaruspexMermaidGenerator {
  private readonly defaultOptions: DiagramGenerationOptions = {
    maxNodes: 50,
    includeLabels: true,
    direction: 'TD',
    includeMetadata: true,
    simplifyRelationships: true
  };

  /**
   * Generate all relevant diagrams from architecture data
   * 
   * @param architecture - Architectural data to visualize
   * @param options - Generation options
   * @returns Promise resolving to array of generated diagrams
   */
  async generateDiagrams(
    architecture: ArchitectureData,
    options?: DiagramGenerationOptions
  ): Promise<MermaidDiagram[]> {
    const opts = { ...this.defaultOptions, ...options };
    const diagrams: MermaidDiagram[] = [];

    try {
      // Generate dependency graph
      const dependencyDiagram = this.generateDependencyGraph(architecture.dependencies, opts);
      if (dependencyDiagram) {
        diagrams.push(dependencyDiagram);
      }

      // Generate component relationship diagram
      const relationshipDiagram = this.generateRelationshipDiagram(architecture.relationships, opts);
      if (relationshipDiagram) {
        diagrams.push(relationshipDiagram);
      }

      // Generate architecture overview
      const architectureDiagram = this.generateArchitectureOverview(architecture, opts);
      if (architectureDiagram) {
        diagrams.push(architectureDiagram);
      }

      // Generate project structure diagram
      const structureDiagram = this.generateProjectStructure(architecture.structure, opts);
      if (structureDiagram) {
        diagrams.push(structureDiagram);
      }

    } catch (error) {
      console.warn('Error generating diagrams:', error);
      // Return at least a basic diagram if generation fails
      diagrams.push(this.generateErrorDiagram(error instanceof Error ? error.message : 'Unknown error'));
    }

    return diagrams;
  }

  /**
   * Generate dependency graph diagram
   * 
   * @param dependencies - Dependency nodes
   * @param options - Generation options
   * @returns Dependency graph diagram or null if no dependencies
   */
  generateDependencyGraph(
    dependencies: DependencyNode[],
    options: DiagramGenerationOptions
  ): MermaidDiagram | null {
    if (dependencies.length === 0) return null;

    const filteredDeps = this.filterNodes(dependencies, options.maxNodes || 50);
    const direction = options.direction || 'TD';
    
    let source = `graph ${direction}\n`;
    const processedEdges = new Set<string>();

    // Add nodes with labels
    for (const dep of filteredDeps) {
      const nodeId = this.sanitizeNodeId(dep.id);
      const label = options.includeLabels ? dep.label : nodeId;
      source += `    ${nodeId}["${this.escapeLabel(label)}"]\n`;
    }

    source += '\n';

    // Add edges (dependencies)
    for (const dep of filteredDeps) {
      const fromId = this.sanitizeNodeId(dep.id);
      
      for (const depId of dep.dependencies) {
        const targetDep = filteredDeps.find(d => 
          d.id === depId || d.id.includes(depId) || d.label.includes(depId)
        );
        
        if (targetDep) {
          const toId = this.sanitizeNodeId(targetDep.id);
          const edgeKey = `${fromId}->${toId}`;
          
          if (!processedEdges.has(edgeKey)) {
            source += `    ${fromId} --> ${toId}\n`;
            processedEdges.add(edgeKey);
          }
        }
      }
    }

    // Add styling
    source += '\n';
    source += `    classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px\n`;
    source += `    classDef highlight fill:#e1f5fe,stroke:#0277bd,stroke-width:3px\n`;

    return {
      id: 'dependency-graph',
      title: 'Project Dependencies',
      source,
      type: 'graph',
      metadata: {
        nodeCount: filteredDeps.length,
        edgeCount: processedEdges.size,
        complexity: this.calculateComplexity(filteredDeps.length, processedEdges.size),
        generated: Date.now()
      }
    };
  }

  /**
   * Generate component relationship diagram
   * 
   * @param relationships - Component relationships
   * @param options - Generation options
   * @returns Relationship diagram or null if no relationships
   */
  generateRelationshipDiagram(
    relationships: ComponentRelationship[],
    options: DiagramGenerationOptions
  ): MermaidDiagram | null {
    if (relationships.length === 0) return null;

    // Get unique components
    const components = new Set<string>();
    relationships.forEach(rel => {
      components.add(rel.from);
      components.add(rel.to);
    });

    const componentList = Array.from(components);
    const filteredComponents = componentList.slice(0, options.maxNodes || 50);
    const direction = options.direction || 'TD';

    let source = `graph ${direction}\n`;

    // Add nodes
    for (const comp of filteredComponents) {
      const nodeId = this.sanitizeNodeId(comp);
      const label = options.includeLabels ? this.getComponentLabel(comp) : nodeId;
      source += `    ${nodeId}["${this.escapeLabel(label)}"]\n`;
    }

    source += '\n';

    // Add relationships
    const processedEdges = new Set<string>();
    for (const rel of relationships) {
      if (filteredComponents.includes(rel.from) && filteredComponents.includes(rel.to)) {
        const fromId = this.sanitizeNodeId(rel.from);
        const toId = this.sanitizeNodeId(rel.to);
        const edgeKey = `${fromId}-${toId}`;

        if (!processedEdges.has(edgeKey)) {
          const arrow = this.getRelationshipArrow(rel.type);
          const label = options.simplifyRelationships ? '' : ` |${rel.type}|`;
          source += `    ${fromId} ${arrow}${label} ${toId}\n`;
          processedEdges.add(edgeKey);
        }
      }
    }

    // Add styling based on relationship types
    source += '\n';
    source += `    classDef component fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px\n`;
    source += `    classDef service fill:#fff3e0,stroke:#ef6c00,stroke-width:2px\n`;
    source += `    classDef utility fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px\n`;

    return {
      id: 'component-relationships',
      title: 'Component Relationships',
      source,
      type: 'graph',
      metadata: {
        nodeCount: filteredComponents.length,
        edgeCount: processedEdges.size,
        complexity: this.calculateComplexity(filteredComponents.length, processedEdges.size),
        generated: Date.now()
      }
    };
  }

  /**
   * Generate architecture overview diagram
   * 
   * @param architecture - Complete architecture data
   * @param options - Generation options
   * @returns Architecture overview diagram
   */
  generateArchitectureOverview(
    architecture: ArchitectureData,
    options: DiagramGenerationOptions
  ): MermaidDiagram {
    const direction = options.direction || 'TD';
    let source = `flowchart ${direction}\n`;

    // Add architecture layers
    source += `    subgraph "Project Architecture"\n`;
    source += `        direction TB\n`;
    
    // Core components
    source += `        Core["🏗️ Core Engine"]\n`;
    source += `        Components["🧩 Components"]\n`;
    source += `        Utils["🔧 Utilities"]\n`;
    
    // Add patterns if detected
    if (architecture.patterns.length > 0) {
      source += `        Patterns["📋 Patterns<br/>${architecture.patterns.slice(0, 3).join('<br/>')}"]\n`;
    }

    source += `    end\n\n`;

    // Add relationships between layers
    source += `    Core --> Components\n`;
    source += `    Components --> Utils\n`;
    if (architecture.patterns.length > 0) {
      source += `    Core -.-> Patterns\n`;
    }

    // Add file statistics
    const fileStats = architecture.structure.fileStats;
    if (Object.keys(fileStats).length > 0) {
      source += `    subgraph "File Distribution"\n`;
      const topFileTypes = Object.entries(fileStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      for (const [ext, count] of topFileTypes) {
        const nodeId = `files${ext.replace('.', '')}`;
        source += `        ${nodeId}["${ext}: ${count} files"]\n`;
      }
      source += `    end\n\n`;
    }

    // Add styling
    source += `    classDef core fill:#e3f2fd,stroke:#1565c0,stroke-width:3px\n`;
    source += `    classDef component fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px\n`;
    source += `    classDef utility fill:#fff3e0,stroke:#ef6c00,stroke-width:2px\n`;
    source += `    classDef stats fill:#f5f5f5,stroke:#757575,stroke-width:1px\n`;

    // Apply classes
    source += `    class Core core\n`;
    source += `    class Components component\n`;
    source += `    class Utils utility\n`;

    return {
      id: 'architecture-overview',
      title: 'System Architecture Overview',
      source,
      type: 'flowchart',
      metadata: {
        nodeCount: 3 + Object.keys(fileStats).length,
        complexity: 'low',
        generated: Date.now()
      }
    };
  }

  /**
   * Generate project structure diagram
   * 
   * @param structure - Project structure data
   * @param options - Generation options
   * @returns Project structure diagram
   */
  generateProjectStructure(
    structure: any,
    options: DiagramGenerationOptions
  ): MermaidDiagram {
    const direction = options.direction || 'TD';
    let source = `graph ${direction}\n`;

    // Add root node
    const rootId = 'root';
    source += `    ${rootId}["📁 ${this.escapeLabel(structure.root || 'Project Root')}"]\n`;

    // Add directory structure (limit to reasonable number)
    const directories = structure.directories?.slice(0, options.maxNodes || 20) || [];
    const processedDirs = new Set<string>();

    for (const dir of directories) {
      const dirId = this.sanitizeNodeId(dir.path);
      if (!processedDirs.has(dirId)) {
        const label = `📁 ${dir.purpose || 'Directory'} (${dir.fileCount} files)`;
        source += `    ${dirId}["${this.escapeLabel(label)}"]\n`;
        source += `    ${rootId} --> ${dirId}\n`;
        processedDirs.add(dirId);
      }
    }

    // Add key files
    if (structure.keyFiles) {
      for (const keyFile of structure.keyFiles.slice(0, 5)) {
        const fileId = this.sanitizeNodeId(keyFile);
        const fileName = keyFile.split('/').pop() || keyFile;
        source += `    ${fileId}["📄 ${this.escapeLabel(fileName)}"]\n`;
        source += `    ${rootId} --> ${fileId}\n`;
      }
    }

    // Add styling
    source += '\n';
    source += `    classDef folder fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px\n`;
    source += `    classDef file fill:#fff3e0,stroke:#ef6c00,stroke-width:2px\n`;
    source += `    classDef root fill:#e3f2fd,stroke:#1565c0,stroke-width:3px\n`;

    return {
      id: 'project-structure',
      title: 'Project Structure',
      source,
      type: 'graph',
      metadata: {
        nodeCount: 1 + directories.length + (structure.keyFiles?.length || 0),
        complexity: 'low',
        generated: Date.now()
      }
    };
  }

  private filterNodes<T extends { id: string }>(nodes: T[], maxNodes: number): T[] {
    if (nodes.length <= maxNodes) return nodes;
    
    // Prioritize nodes with more connections or importance
    return nodes
      .sort((a, b) => {
        // Simple heuristic: shorter paths are often more important
        return a.id.length - b.id.length;
      })
      .slice(0, maxNodes);
  }

  private sanitizeNodeId(id: string): string {
    // Convert file paths and complex IDs to valid Mermaid node IDs
    return id
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
      .substring(0, 50); // Limit length
  }

  private escapeLabel(label: string): string {
    // Escape special characters in labels
    return label
      .replace(/"/g, '\\"')
      .replace(/\n/g, '<br/>')
      .substring(0, 100); // Limit label length
  }

  private getComponentLabel(componentPath: string): string {
    // Extract meaningful component name from path
    const parts = componentPath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.(ts|js|tsx|jsx)$/, '') || componentPath;
  }

  private getRelationshipArrow(type: ComponentRelationship['type']): string {
    switch (type) {
      case 'imports': return '-->';
      case 'extends': return '==>';
      case 'implements': return '-.>';
      case 'uses': return '-->';
      case 'references': return '-.>';
      default: return '-->';
    }
  }

  private calculateComplexity(nodeCount: number, edgeCount: number): 'low' | 'medium' | 'high' {
    const ratio = edgeCount / Math.max(nodeCount, 1);
    if (nodeCount < 10 && ratio < 2) return 'low';
    if (nodeCount < 30 && ratio < 3) return 'medium';
    return 'high';
  }

  private generateErrorDiagram(error: string): MermaidDiagram {
    const source = `graph TD
    Error["⚠️ Diagram Generation Failed"]
    Details["${this.escapeLabel(error)}"]
    Error --> Details
    
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px
    class Error error
    class Details error`;

    return {
      id: 'generation-error',
      title: 'Generation Error',
      source,
      type: 'graph',
      metadata: {
        nodeCount: 2,
        edgeCount: 1,
        complexity: 'low',
        generated: Date.now()
      }
    };
  }
}
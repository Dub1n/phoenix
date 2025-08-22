/**
 * Haruspex Stub Parser Implementation
 * 
 * Parses file stubs and extracts documentation structure for building
 * comprehensive documentation trees and architectural understanding.
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

import * as path from 'path';
import * as fs from 'fs/promises';

export interface ParsedStub {
  /** File path */
  file: string;
  /** Extracted symbols/exports */
  symbols: readonly string[];
  /** File title if available */
  title?: string;
  /** File description */
  description?: string;
  /** Tags associated with file */
  tags?: readonly string[];
  /** Dependencies/imports */
  dependencies?: readonly string[];
  /** Exports provided by file */
  provides?: readonly string[];
  /** Requirements for this file */
  requires?: readonly string[];
  /** File metadata */
  metadata?: Record<string, unknown>;
}

export interface DocumentationTreeNode {
  /** Node label */
  label: string;
  /** Node type */
  type: 'file' | 'directory' | 'symbol' | 'section';
  /** File path if applicable */
  filePath?: string;
  /** Child nodes */
  children?: DocumentationTreeNode[];
  /** Node metadata */
  metadata?: Record<string, unknown>;
  /** Symbol information */
  symbolInfo?: SymbolInfo;
}

export interface SymbolInfo {
  /** Symbol name */
  name: string;
  /** Symbol type */
  type: 'function' | 'class' | 'interface' | 'variable' | 'constant' | 'type';
  /** Symbol signature if applicable */
  signature?: string;
  /** Symbol description */
  description?: string;
  /** Line number in file */
  lineNumber?: number;
}

export interface ArchitectureData {
  /** Project structure overview */
  structure: ProjectStructure;
  /** Component relationships */
  relationships: ComponentRelationship[];
  /** Architectural patterns detected */
  patterns: string[];
  /** Dependency graph */
  dependencies: DependencyNode[];
}

export interface ProjectStructure {
  /** Root directory */
  root: string;
  /** Main directories */
  directories: DirectoryInfo[];
  /** Key files */
  keyFiles: string[];
  /** File count by type */
  fileStats: Record<string, number>;
}

export interface DirectoryInfo {
  /** Directory path */
  path: string;
  /** Directory purpose/role */
  purpose?: string;
  /** File count */
  fileCount: number;
  /** Subdirectories */
  subdirectories: string[];
}

export interface ComponentRelationship {
  /** Source component */
  from: string;
  /** Target component */
  to: string;
  /** Relationship type */
  type: 'imports' | 'extends' | 'implements' | 'uses' | 'references';
  /** Relationship strength (0-1) */
  strength: number;
}

export interface DependencyNode {
  /** Node identifier */
  id: string;
  /** Node label */
  label: string;
  /** Node type */
  type: 'package' | 'module' | 'component';
  /** Dependencies */
  dependencies: string[];
  /** Dependents */
  dependents: string[];
}

/**
 * Stub Parser for extracting documentation structure and architectural information
 * 
 * Parses various file types to extract symbols, documentation, and relationships
 * for building comprehensive documentation trees and understanding project architecture.
 */
export class HaruspexStubParser {
  private readonly supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.md', '.json'];
  private readonly excludedDirectories = ['node_modules', 'dist', 'build', '.git', 'coverage', '.next'];

  /**
   * List all analyzable files in workspace
   * 
   * @param workspaceRoot - Root directory to scan
   * @returns Promise resolving to array of file paths
   */
  async listWorkspaceFiles(workspaceRoot: string): Promise<string[]> {
    const files: string[] = [];

    const scanDirectory = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            // Skip excluded directories
            if (!this.excludedDirectories.includes(entry.name)) {
              await scanDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (this.supportedExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
        console.warn(`Skipping directory ${dirPath}:`, error);
      }
    };

    await scanDirectory(workspaceRoot);
    return files;
  }

  /**
   * Parse all stub files in the provided file list
   * 
   * @param files - Array of file paths to parse
   * @returns Promise resolving to array of parsed stubs
   */
  async parseAllStubs(files: readonly string[]): Promise<ParsedStub[]> {
    const stubs: ParsedStub[] = [];

    // Process files in batches to avoid overwhelming the system
    const batchSize = 20;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(file => this.parseStub(file))
      );
      stubs.push(...batchResults.filter(stub => stub !== null) as ParsedStub[]);
    }

    return stubs;
  }

  /**
   * Parse a single file stub
   * 
   * @param filePath - Path to file to parse
   * @returns Promise resolving to parsed stub or null if parsing failed
   */
  async parseStub(filePath: string): Promise<ParsedStub | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileExtension = path.extname(filePath);

      switch (fileExtension) {
        case '.ts':
        case '.tsx':
        case '.js':
        case '.jsx':
          return this.parseTypeScriptJavaScript(filePath, content);
        case '.md':
          return this.parseMarkdown(filePath, content);
        case '.json':
          return this.parseJSON(filePath, content);
        default:
          return this.parseGeneric(filePath, content);
      }
    } catch (error) {
      console.warn(`Failed to parse ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Build documentation tree from parsed stubs
   * 
   * @param stubs - Array of parsed stubs
   * @returns Documentation tree structure
   */
  buildDocumentationTree(stubs: readonly ParsedStub[]): DocumentationTreeNode[] {
    const tree: DocumentationTreeNode[] = [];
    const directoryMap = new Map<string, DocumentationTreeNode>();

    // Group files by directory
    for (const stub of stubs) {
      const dirPath = path.dirname(stub.file);
      const fileName = path.basename(stub.file);

      // Create directory nodes if they don't exist
      if (!directoryMap.has(dirPath)) {
        const dirNode: DocumentationTreeNode = {
          label: path.basename(dirPath) || 'root',
          type: 'directory',
          filePath: dirPath,
          children: [],
          metadata: { stubCount: 0 }
        };
        directoryMap.set(dirPath, dirNode);
      }

      // Create file node
      const fileNode: DocumentationTreeNode = {
        label: fileName,
        type: 'file',
        filePath: stub.file,
        children: [],
        metadata: {
          symbolCount: stub.symbols.length,
          title: stub.title,
          description: stub.description,
          tags: stub.tags
        }
      };

      // Add symbol nodes as children
      for (const symbol of stub.symbols) {
        const symbolNode: DocumentationTreeNode = {
          label: symbol,
          type: 'symbol',
          filePath: stub.file,
          symbolInfo: {
            name: symbol,
            type: this.inferSymbolType(symbol),
            description: `Symbol from ${fileName}`
          }
        };
        fileNode.children!.push(symbolNode);
      }

      // Add file to directory
      const dirNode = directoryMap.get(dirPath)!;
      dirNode.children!.push(fileNode);
      dirNode.metadata!.stubCount = (dirNode.metadata!.stubCount as number) + 1;
    }

    // Convert directory map to tree structure
    const directories = Array.from(directoryMap.values());
    
    // Sort directories and files
    directories.sort((a, b) => a.label.localeCompare(b.label));
    directories.forEach(dir => {
      dir.children!.sort((a, b) => a.label.localeCompare(b.label));
    });

    return directories;
  }

  /**
   * Load architecture data from workspace
   * 
   * @param workspaceRoot - Root directory to analyze
   * @returns Promise resolving to architecture data
   */
  async loadArchitecture(workspaceRoot: string): Promise<ArchitectureData> {
    const files = await this.listWorkspaceFiles(workspaceRoot);
    const stubs = await this.parseAllStubs(files);

    // Analyze project structure
    const structure = await this.analyzeProjectStructure(workspaceRoot, files);
    
    // Extract relationships
    const relationships = this.extractRelationships(stubs);
    
    // Detect patterns
    const patterns = this.detectArchitecturalPatterns(stubs, structure);
    
    // Build dependency graph
    const dependencies = this.buildDependencyGraph(stubs);

    return {
      structure,
      relationships,
      patterns,
      dependencies
    };
  }

  private async parseTypeScriptJavaScript(filePath: string, content: string): Promise<ParsedStub> {
    const symbols: string[] = [];
    const dependencies: string[] = [];
    const provides: string[] = [];

    // Extract imports
    const importMatches = content.match(/^import\s+.*?from\s+['"][^'"]+['"];?$/gm) || [];
    for (const importMatch of importMatches) {
      const moduleMatch = importMatch.match(/from\s+['"]([^'"]+)['"]/);
      if (moduleMatch) {
        dependencies.push(moduleMatch[1]);
      }
    }

    // Extract exports
    const exportMatches = content.match(/^export\s+.*$/gm) || [];
    for (const exportMatch of exportMatches) {
      // Extract function names
      const functionMatch = exportMatch.match(/export\s+(?:async\s+)?function\s+(\w+)/);
      if (functionMatch) {
        symbols.push(functionMatch[1]);
        provides.push(functionMatch[1]);
      }

      // Extract class names
      const classMatch = exportMatch.match(/export\s+class\s+(\w+)/);
      if (classMatch) {
        symbols.push(classMatch[1]);
        provides.push(classMatch[1]);
      }

      // Extract interface names
      const interfaceMatch = exportMatch.match(/export\s+interface\s+(\w+)/);
      if (interfaceMatch) {
        symbols.push(interfaceMatch[1]);
        provides.push(interfaceMatch[1]);
      }

      // Extract type names
      const typeMatch = exportMatch.match(/export\s+type\s+(\w+)/);
      if (typeMatch) {
        symbols.push(typeMatch[1]);
        provides.push(typeMatch[1]);
      }
    }

    // Extract internal symbols (functions, classes not exported)
    const functionMatches = content.match(/(?:^|\n)\s*(?:async\s+)?function\s+(\w+)/g) || [];
    const classMatches = content.match(/(?:^|\n)\s*class\s+(\w+)/g) || [];
    
    for (const match of [...functionMatches, ...classMatches]) {
      const symbolMatch = match.match(/\s+(\w+)/);
      if (symbolMatch && !symbols.includes(symbolMatch[1])) {
        symbols.push(symbolMatch[1]);
      }
    }

    // Extract title from header comment
    const headerMatch = content.match(/^\/\*\*\s*\n\s*\*\s*(.+)\s*\n/);
    const title = headerMatch ? headerMatch[1].trim() : undefined;

    const stub: ParsedStub = {
      file: filePath,
      symbols,
      dependencies,
      provides
    };
    
    if (title) {
      stub.title = title;
    }
    
    return stub;
  }

  private async parseMarkdown(filePath: string, content: string): Promise<ParsedStub> {
    const symbols: string[] = [];

    // Extract headings as symbols
    const headingMatches = content.match(/^#+\s+(.+)$/gm) || [];
    for (const heading of headingMatches) {
      const headingText = heading.replace(/^#+\s+/, '').trim();
      symbols.push(headingText);
    }

    // Extract title (first heading or filename)
    const firstHeading = headingMatches[0];
    const title = firstHeading 
      ? firstHeading.replace(/^#+\s+/, '').trim()
      : path.basename(filePath, '.md');

    // Extract description from first paragraph
    const paragraphMatch = content.match(/\n\n([^#\n]+)\n/);
    const description = paragraphMatch ? paragraphMatch[1].trim() : undefined;

    const stub: ParsedStub = {
      file: filePath,
      symbols,
      title
    };

    if (description) {
      stub.description = description;
    }

    return stub;
  }

  private async parseJSON(filePath: string, content: string): Promise<ParsedStub> {
    try {
      const jsonData = JSON.parse(content);
      const symbols = Object.keys(jsonData);
      const fileName = path.basename(filePath);

      return {
        file: filePath,
        symbols,
        title: fileName,
        metadata: { type: 'json', keys: symbols.length }
      };
    } catch (error) {
      return {
        file: filePath,
        symbols: [],
        title: path.basename(filePath),
        metadata: { type: 'json', parseError: true }
      };
    }
  }

  private async parseGeneric(filePath: string, content: string): Promise<ParsedStub> {
    // Basic parsing for other file types
    const lines = content.split('\\n');
    const symbols = lines
      .filter(line => line.trim().length > 0)
      .slice(0, 10) // Take first 10 non-empty lines as symbols
      .map(line => line.trim().substring(0, 50)); // Truncate long lines

    return {
      file: filePath,
      symbols,
      title: path.basename(filePath)
    };
  }

  private inferSymbolType(symbol: string): SymbolInfo['type'] {
    // Simple heuristics for symbol type inference
    if (symbol.endsWith('()') || symbol.includes('function')) return 'function';
    if (symbol[0] === symbol[0].toUpperCase() && symbol.includes('class')) return 'class';
    if (symbol.startsWith('I') && symbol[1] === symbol[1].toUpperCase()) return 'interface';
    if (symbol.toUpperCase() === symbol) return 'constant';
    if (symbol.includes('Type') || symbol.includes('type')) return 'type';
    return 'variable';
  }

  private async analyzeProjectStructure(workspaceRoot: string, files: string[]): Promise<ProjectStructure> {
    const directories: DirectoryInfo[] = [];
    const directoryMap = new Map<string, DirectoryInfo>();
    const fileStats: Record<string, number> = {};

    // Analyze files by directory
    for (const file of files) {
      const dirPath = path.dirname(file);
      const ext = path.extname(file);

      // Count file types
      fileStats[ext] = (fileStats[ext] || 0) + 1;

      // Track directories
      if (!directoryMap.has(dirPath)) {
        directoryMap.set(dirPath, {
          path: dirPath,
          fileCount: 0,
          subdirectories: []
        });
      }

      directoryMap.get(dirPath)!.fileCount++;
    }

    // Convert to array and add metadata
    for (const [dirPath, dirInfo] of directoryMap) {
      // Infer directory purpose
      const dirName = path.basename(dirPath).toLowerCase();
      let purpose: string | undefined;
      
      if (dirName.includes('test')) purpose = 'Testing';
      else if (dirName.includes('src')) purpose = 'Source Code';
      else if (dirName.includes('doc')) purpose = 'Documentation';
      else if (dirName.includes('config')) purpose = 'Configuration';
      else if (dirName.includes('script')) purpose = 'Scripts';

      const directoryInfo: DirectoryInfo = {
        ...dirInfo
      };

      if (purpose) {
        directoryInfo.purpose = purpose;
      }

      directories.push(directoryInfo);
    }

    // Find key files
    const keyFiles = files.filter(file => {
      const fileName = path.basename(file).toLowerCase();
      return ['package.json', 'readme.md', 'index.ts', 'index.js', 'main.ts', 'main.js'].includes(fileName);
    });

    return {
      root: workspaceRoot,
      directories: directories.sort((a, b) => a.path.localeCompare(b.path)),
      keyFiles,
      fileStats
    };
  }

  private extractRelationships(stubs: readonly ParsedStub[]): ComponentRelationship[] {
    const relationships: ComponentRelationship[] = [];

    for (const stub of stubs) {
      if (stub.dependencies) {
        for (const dep of stub.dependencies) {
          // Find corresponding stub for the dependency
          const depStub = stubs.find(s => 
            s.file.includes(dep) || 
            path.basename(s.file, path.extname(s.file)) === dep
          );

          if (depStub) {
            relationships.push({
              from: stub.file,
              to: depStub.file,
              type: 'imports',
              strength: 1.0
            });
          }
        }
      }
    }

    return relationships;
  }

  private detectArchitecturalPatterns(stubs: readonly ParsedStub[], structure: ProjectStructure): string[] {
    const patterns: string[] = [];

    // Detect common patterns based on directory structure and files
    const dirNames = structure.directories.map(d => path.basename(d.path).toLowerCase());

    if (dirNames.includes('src') && dirNames.includes('test')) {
      patterns.push('Source-Test Separation');
    }

    if (dirNames.includes('components') || dirNames.includes('component')) {
      patterns.push('Component-Based Architecture');
    }

    if (dirNames.includes('services') || dirNames.includes('service')) {
      patterns.push('Service Layer Pattern');
    }

    if (dirNames.includes('utils') || dirNames.includes('utilities')) {
      patterns.push('Utility Pattern');
    }

    if (structure.keyFiles.some(f => f.includes('package.json'))) {
      patterns.push('Node.js Module Pattern');
    }

    if (stubs.some(s => s.symbols.some(sym => sym.includes('Controller')))) {
      patterns.push('MVC Pattern');
    }

    return patterns;
  }

  private buildDependencyGraph(stubs: readonly ParsedStub[]): DependencyNode[] {
    const nodes: DependencyNode[] = [];
    const nodeMap = new Map<string, DependencyNode>();

    // Create nodes for each file
    for (const stub of stubs) {
      const id = stub.file;
      const label = path.basename(stub.file);
      
      const node: DependencyNode = {
        id,
        label,
        type: 'module',
        dependencies: stub.dependencies ? [...stub.dependencies] : [],
        dependents: []
      };

      nodes.push(node);
      nodeMap.set(id, node);
    }

    // Build dependent relationships
    for (const node of nodes) {
      for (const depPath of node.dependencies) {
        // Find the dependency node
        const depNode = Array.from(nodeMap.values()).find(n => 
          n.id.includes(depPath) || n.label.includes(depPath)
        );
        
        if (depNode) {
          depNode.dependents.push(node.id);
        }
      }
    }

    return nodes;
  }
}
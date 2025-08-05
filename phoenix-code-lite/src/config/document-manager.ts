/**
 * Document Management System for Phoenix Code Lite
 * Provides per-agent and global document management with template-level activation
 */

import { promises as fs } from 'fs';
import { join, extname, basename } from 'path';
import { 
  DocumentInfo, 
  DocumentConfiguration, 
  DocumentInventory, 
  DocumentTemplate,
  DocumentManagerConfig,
  DocumentSearchOptions,
  DocumentSearchResult,
  DocumentOperationResult 
} from '../types/document-management';
import { ConfigurationTemplates } from './templates';
import { SecurityGuardrailsManager } from '../security/guardrails';

/**
 * Document Management System for Phoenix Code Lite
 * 
 * Provides comprehensive document management with per-agent and global document
 * organization, template-level configuration, and security validation.
 * 
 * @example
 * ```typescript
 * const documentManager = new DocumentManager();
 * await documentManager.initializeDocumentSystem();
 * 
 * const inventory = await documentManager.getAvailableDocuments();
 * console.log(`Found ${inventory.global.length} global documents`);
 * ```
 */
export class DocumentManager {
  private readonly documentsPath: string;
  private readonly config: DocumentManagerConfig;
  private readonly securityManager: SecurityGuardrailsManager;

  /**
   * Creates a new DocumentManager instance.
   * 
   * @param basePath - Optional base path for document storage. Defaults to '.phoenix-documents' in current working directory
   * @param securityManager - Optional security manager instance. Creates default if not provided
   * 
   * @example
   * ```typescript
   * // Use default path and security
   * const manager = new DocumentManager();
   * 
   * // Use custom path
   * const manager = new DocumentManager('/path/to/documents');
   * 
   * // Use custom security manager
   * const security = new SecurityGuardrailsManager(customPolicy);
   * const manager = new DocumentManager(undefined, security);
   * ```
   */
  constructor(basePath?: string, securityManager?: SecurityGuardrailsManager) {
    this.documentsPath = basePath || join(process.cwd(), '.phoenix-documents');
    this.securityManager = securityManager || new SecurityGuardrailsManager();
    this.config = {
      documentsPath: this.documentsPath,
      enabledCategories: ['global', 'agents'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedExtensions: ['.md', '.txt', '.json', '.yaml', '.yml']
    };
  }

  /**
   * Initializes the document management system directory structure.
   * 
   * Creates the required directory hierarchy and default document templates
   * for global and agent-specific document management.
   * 
   * @returns Promise resolving to operation result with success status and affected directories
   * 
   * @example
   * ```typescript
   * const result = await documentManager.initializeDocumentSystem();
   * if (result.success) {
   *   console.log('Document system initialized successfully');
   *   console.log('Created directories:', result.affectedDocuments);
   * }
   * ```
   */
  async initializeDocumentSystem(): Promise<DocumentOperationResult> {
    try {
      // Create document directory structure
      const dirs = [
        'global',
        'agents/planning-analyst',
        'agents/implementation-engineer', 
        'agents/quality-reviewer'
      ];

      for (const dir of dirs) {
        const fullPath = join(this.documentsPath, dir);
        await fs.mkdir(fullPath, { recursive: true });
      }

      // Create default template documents if they don't exist
      await this.createDefaultDocuments();

      return {
        success: true,
        message: 'Document system initialized successfully',
        affectedDocuments: dirs
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize document system: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Retrieves a complete inventory of all available documents.
   * 
   * Scans the document directory structure and returns organized inventory
   * of global and agent-specific documents with metadata.
   * 
   * @returns Promise resolving to document inventory organized by category
   * 
   * @example
   * ```typescript
   * const inventory = await documentManager.getAvailableDocuments();
   * 
   * console.log(`Global documents: ${inventory.global.length}`);
   * console.log(`Planning documents: ${inventory.agents['planning-analyst'].length}`);
   * 
   * // Access document details
   * inventory.global.forEach(doc => {
   *   console.log(`${doc.name}: ${doc.description}`);
   * });
   * ```
   */
  async getAvailableDocuments(): Promise<DocumentInventory> {
    const inventory: DocumentInventory = {
      global: await this.scanDocuments('global'),
      agents: {
        'planning-analyst': await this.scanDocuments('agents/planning-analyst'),
        'implementation-engineer': await this.scanDocuments('agents/implementation-engineer'),
        'quality-reviewer': await this.scanDocuments('agents/quality-reviewer')
      }
    };

    return inventory;
  }

  async scanDocuments(relativePath: string): Promise<DocumentInfo[]> {
    try {
      const fullPath = join(this.documentsPath, relativePath);
      const exists = await fs.access(fullPath).then(() => true).catch(() => false);
      
      if (!exists) {
        return [];
      }

      const files = await fs.readdir(fullPath);
      const documents: DocumentInfo[] = [];

      for (const file of files) {
        const filePath = join(fullPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && this.isAllowedFile(file)) {
          documents.push({
            filename: file,
            name: this.formatDisplayName(file),
            description: await this.extractDescription(filePath),
            path: filePath,
            size: stats.size,
            lastModified: stats.mtime,
            type: this.getFileType(file)
          });
        }
      }

      return documents.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.warn(`Failed to scan documents in ${relativePath}:`, error);
      return [];
    }
  }

  /**
   * Retrieves document configuration for a specific template.
   * 
   * Gets the current document activation settings for a configuration template,
   * including which global and agent-specific documents are enabled.
   * 
   * @param templateName - Name of the configuration template
   * @returns Promise resolving to document configuration for the template
   * 
   * @example
   * ```typescript
   * const config = await documentManager.getTemplateDocumentConfiguration('enterprise');
   * 
   * // Check if a document is enabled
   * const isProjectContextEnabled = config.global['project-context.md'];
   * const isPlanningGuideEnabled = config.agents['planning-analyst']['planning-guidelines.md'];
   * 
   * console.log(`Project context enabled: ${isProjectContextEnabled}`);
   * ```
   */
  async getTemplateDocumentConfiguration(templateName: string): Promise<DocumentConfiguration> {
    try {
      const templateData = ConfigurationTemplates.getTemplateWithDocuments(templateName);
      if (templateData?.metadata.documents) {
        return templateData.metadata.documents;
      }
      
      return {
        global: {},
        agents: {
          'planning-analyst': {},
          'implementation-engineer': {},
          'quality-reviewer': {}
        }
      };
    } catch (error) {
      console.warn(`Failed to get document configuration for template ${templateName}:`, error);
      return {
        global: {},
        agents: {
          'planning-analyst': {},
          'implementation-engineer': {},
          'quality-reviewer': {}
        }
      };
    }
  }

  /**
   * Updates document configuration for a specific template.
   * 
   * Modifies which documents are enabled/disabled for a configuration template.
   * Changes persist and affect future workflow executions using that template.
   * 
   * @param templateName - Name of the configuration template to update
   * @param config - New document configuration settings
   * @returns Promise resolving to operation result indicating success/failure
   * 
   * @example
   * ```typescript
   * const newConfig: DocumentConfiguration = {
   *   global: {
   *     'project-context.md': true,
   *     'requirements.md': false
   *   },
   *   agents: {
   *     'planning-analyst': { 'planning-guidelines.md': true },
   *     'implementation-engineer': { 'implementation-standards.md': true },
   *     'quality-reviewer': { 'review-checklist.md': false }
   *   }
   * };
   * 
   * const result = await documentManager.updateTemplateDocumentConfiguration('enterprise', newConfig);
   * console.log(`Update ${result.success ? 'succeeded' : 'failed'}: ${result.message}`);
   * ```
   */
  async updateTemplateDocumentConfiguration(
    templateName: string, 
    config: DocumentConfiguration
  ): Promise<DocumentOperationResult> {
    try {
      const result = ConfigurationTemplates.updateTemplateDocuments(templateName, config);
      
      return {
        success: result,
        message: result 
          ? `Document configuration updated for template: ${templateName}`
          : `Failed to update document configuration for template: ${templateName}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update document configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Searches for documents based on specified criteria.
   * 
   * Provides flexible document discovery with filtering by category, agent type,
   * file type, and text-based search terms.
   * 
   * @param options - Search criteria and filters
   * @returns Promise resolving to search results with matching documents
   * 
   * @example
   * ```typescript
   * // Search all markdown files
   * const mdFiles = await documentManager.searchDocuments({
   *   fileType: 'markdown'
   * });
   * 
   * // Search planning analyst documents
   * const planningDocs = await documentManager.searchDocuments({
   *   category: 'agents',
   *   agentType: 'planning-analyst'
   * });
   * 
   * // Search by content
   * const testDocs = await documentManager.searchDocuments({
   *   searchTerm: 'testing'
   * });
   * 
   * console.log(`Found ${testDocs.totalCount} documents containing "testing"`);
   * ```
   */
  async searchDocuments(options: DocumentSearchOptions): Promise<DocumentSearchResult> {
    const inventory = await this.getAvailableDocuments();
    let documents: DocumentInfo[] = [];

    // Collect documents based on category filter
    if (!options.category || options.category === 'global') {
      documents.push(...inventory.global);
    }

    if (!options.category || options.category === 'agents') {
      if (!options.agentType) {
        // Include all agent documents
        Object.values(inventory.agents).forEach(agentDocs => {
          documents.push(...agentDocs);
        });
      } else if (options.agentType in inventory.agents) {
        documents.push(...inventory.agents[options.agentType as keyof typeof inventory.agents]);
      }
    }

    // Apply filters
    if (options.fileType) {
      documents = documents.filter(doc => doc.type === options.fileType);
    }

    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      documents = documents.filter(doc => 
        doc.name.toLowerCase().includes(term) ||
        doc.description.toLowerCase().includes(term) ||
        doc.filename.toLowerCase().includes(term)
      );
    }

    return {
      documents,
      totalCount: documents.length,
      query: options
    };
  }

  /**
   * Creates a new document from a template.
   * 
   * Creates a document file in the specified location using security validation
   * to ensure the operation is safe and within allowed paths.
   * 
   * @param template - Document template with content and metadata
   * @param targetPath - Relative path within document directory for the new document
   * @returns Promise resolving to operation result with success status and file path
   * 
   * @example
   * ```typescript
   * const template = {
   *   name: 'api-guidelines',
   *   description: 'API development guidelines',
   *   content: '# API Guidelines\n\n...',
   *   type: 'markdown' as const,
   *   category: 'global' as const
   * };
   * 
   * const result = await documentManager.createDocumentFromTemplate(template, 'global');
   * console.log(`Document created: ${result.success}`);
   * ```
   */
  async createDocumentFromTemplate(template: DocumentTemplate, targetPath: string): Promise<DocumentOperationResult> {
    try {
      // Sanitize template name to prevent path traversal
      const sanitizedName = this.sanitizeFilename(template.name);
      const extension = this.getExtensionForType(template.type);
      const filename = sanitizedName + extension;
      
      // Construct full target path
      const targetDir = join(this.documentsPath, targetPath);
      const fullTargetPath = join(targetDir, filename);
      
      // Use SecurityGuardrailsManager for validation
      const securityResult = await this.securityManager.validateFileAccess(fullTargetPath, 'write');
      
      if (!securityResult.allowed) {
        return {
          success: false,
          message: 'Security validation failed: document creation not permitted',
          errors: securityResult.violations.map(v => v.description)
        };
      }
      
      // Ensure target directory exists
      await fs.mkdir(targetDir, { recursive: true });
      
      await fs.writeFile(fullTargetPath, template.content, 'utf8');

      return {
        success: true,
        message: `Document created: ${sanitizedName}`,
        affectedDocuments: [fullTargetPath]
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async createDefaultDocuments(): Promise<void> {
    const defaultTemplates: DocumentTemplate[] = [
      {
        name: 'project-context',
        description: 'Global project context and requirements',
        content: `# Project Context

## Overview
This document contains global project context that will be available to all agents.

## Requirements
- Document key project requirements here
- Include business rules and constraints
- Note any architectural decisions

## Notes
- This document is shared across all agents
- Update as project requirements evolve
`,
        type: 'markdown',
        category: 'global'
      },
      {
        name: 'planning-guidelines',
        description: 'Guidelines for the Planning Analyst agent',
        content: `# Planning Analyst Guidelines

## Role
The Planning Analyst is responsible for analyzing requirements and creating detailed implementation plans.

## Guidelines
- Focus on breaking down complex requirements
- Identify potential risks and dependencies
- Create clear, actionable tasks

## Resources
- Project architecture documentation
- Business requirements documents
- Technical specifications
`,
        type: 'markdown',
        category: 'agent-specific',
        agentType: 'planning-analyst'
      },
      {
        name: 'implementation-standards',
        description: 'Standards for the Implementation Engineer agent',
        content: `# Implementation Engineer Standards

## Code Quality Standards
- Follow established coding conventions
- Implement comprehensive error handling
- Include appropriate logging

## Testing Requirements
- Unit tests for all new functions
- Integration tests for API endpoints
- Performance tests for critical paths

## Documentation
- Inline code documentation
- API documentation updates
- Architecture decision records
`,
        type: 'markdown',
        category: 'agent-specific',
        agentType: 'implementation-engineer'
      },
      {
        name: 'review-checklist',
        description: 'Checklist for the Quality Reviewer agent',
        content: `# Quality Review Checklist

## Code Review Points
- [ ] Code follows established patterns
- [ ] Error handling is comprehensive
- [ ] Performance considerations addressed
- [ ] Security best practices followed

## Testing Review
- [ ] Test coverage is adequate
- [ ] Edge cases are covered
- [ ] Tests are maintainable

## Documentation Review
- [ ] Code is self-documenting
- [ ] API changes are documented
- [ ] Breaking changes are noted
`,
        type: 'markdown',
        category: 'agent-specific',
        agentType: 'quality-reviewer'
      }
    ];

    for (const template of defaultTemplates) {
      const targetPath = template.category === 'global' 
        ? 'global' 
        : `agents/${template.agentType}`;
      
      const fullPath = join(this.documentsPath, targetPath, template.name + this.getExtensionForType(template.type));
      
      // Only create if it doesn't already exist
      try {
        await fs.access(fullPath);
      } catch {
        await this.createDocumentFromTemplate(template, targetPath);
      }
    }
  }

  private isAllowedFile(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    return this.config.allowedExtensions.includes(ext);
  }

  private formatDisplayName(filename: string): string {
    const name = basename(filename, extname(filename));
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private async extractDescription(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Look for description in first few lines
      for (const line of lines.slice(0, 10)) {
        if (line.trim().startsWith('##') && line.toLowerCase().includes('description')) {
          const nextLineIndex = lines.indexOf(line) + 1;
          if (nextLineIndex < lines.length) {
            return lines[nextLineIndex].trim();
          }
        }
      }
      
      // Fallback: use first non-empty line after title
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);
      return nonEmptyLines.length > 1 ? nonEmptyLines[1].substring(0, 100) + '...' : 'No description available';
    } catch {
      return 'No description available';
    }
  }

  private getFileType(filename: string): 'text' | 'markdown' | 'json' | 'other' {
    const ext = extname(filename).toLowerCase();
    switch (ext) {
      case '.md': return 'markdown';
      case '.json': return 'json';
      case '.txt': return 'text';
      default: return 'other';
    }
  }

  private getExtensionForType(type: 'text' | 'markdown' | 'json'): string {
    switch (type) {
      case 'markdown': return '.md';
      case 'json': return '.json';
      case 'text': return '.txt';
      default: return '.txt';
    }
  }

  /**
   * Sanitize filename to prevent path traversal attacks and invalid characters.
   * 
   * Removes potentially dangerous characters while preserving readability.
   * This complements SecurityGuardrailsManager path validation.
   * 
   * @param filename - Raw filename to sanitize
   * @returns Sanitized filename safe for file system use
   */
  private sanitizeFilename(filename: string): string {
    // Remove path separators and dangerous characters
    return filename
      .replace(/[/\\:*?"<>|]/g, '')
      .replace(/\.\./g, '')
      .replace(/\0/g, '')
      .trim()
      .substring(0, 255); // Limit filename length
  }
}
/**---
 * title: [Document Manager - Inventory and Activation]
 * tags: [Configuration, Documents, Management]
 * provides: [DocumentManager Class, Inventory, Per-Template Activation]
 * requires: [fs, path]
 * description: [Manages document inventory, metadata extraction, and per-template activation for agent phases.]
 *  * @example
 * ```typescript
 * const documentManager = new DocumentManager();
 * await documentManager.initializeDocumentSystem();
 *
 * const inventory = await documentManager.getAvailableDocuments();
 * console.log(`Found ${inventory.global.length} global documents`);
 * ```
 * ---*/
import { DocumentInfo, DocumentConfiguration, DocumentInventory, DocumentTemplate, DocumentSearchOptions, DocumentSearchResult, DocumentOperationResult } from '../types/document-management';
import { SecurityGuardrailsManager } from '../security/guardrails';
export declare class DocumentManager {
    private readonly documentsPath;
    private readonly config;
    private readonly securityManager;
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
    constructor(basePath?: string, securityManager?: SecurityGuardrailsManager);
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
    initializeDocumentSystem(): Promise<DocumentOperationResult>;
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
    getAvailableDocuments(): Promise<DocumentInventory>;
    scanDocuments(relativePath: string): Promise<DocumentInfo[]>;
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
    getTemplateDocumentConfiguration(templateName: string): Promise<DocumentConfiguration>;
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
    updateTemplateDocumentConfiguration(templateName: string, config: DocumentConfiguration): Promise<DocumentOperationResult>;
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
    searchDocuments(options: DocumentSearchOptions): Promise<DocumentSearchResult>;
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
    createDocumentFromTemplate(template: DocumentTemplate, targetPath: string): Promise<DocumentOperationResult>;
    private createDefaultDocuments;
    private isAllowedFile;
    private formatDisplayName;
    private extractDescription;
    private getFileType;
    private getExtensionForType;
    /**
     * Sanitize filename to prevent path traversal attacks and invalid characters.
     *
     * Removes potentially dangerous characters while preserving readability.
     * This complements SecurityGuardrailsManager path validation.
     *
     * @param filename - Raw filename to sanitize
     * @returns Sanitized filename safe for file system use
     */
    private sanitizeFilename;
}
//# sourceMappingURL=document-manager.d.ts.map
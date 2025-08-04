/**
 * Document Management Types for Phoenix Code Lite
 * Supports per-agent and global document management with template-level activation
 */
/**
 * Information about a single document in the system.
 *
 * @interface DocumentInfo
 */
export interface DocumentInfo {
    /** Original filename with extension */
    filename: string;
    /** Human-readable display name derived from filename */
    name: string;
    /** Brief description extracted from file content or metadata */
    description: string;
    /** Absolute file system path to the document */
    path: string;
    /** File size in bytes */
    size: number;
    /** Date when the file was last modified */
    lastModified: Date;
    /** Detected file type based on extension and content */
    type: 'text' | 'markdown' | 'json' | 'other';
}
/**
 * Document activation configuration for a template.
 *
 * Defines which documents are enabled for global use and for each specialized agent.
 * Used by configuration templates to control document availability during workflows.
 *
 * @interface DocumentConfiguration
 * @example
 * ```typescript
 * const config: DocumentConfiguration = {
 *   global: {
 *     'project-context.md': true,    // Enable for all agents
 *     'legacy-notes.md': false       // Disable globally
 *   },
 *   agents: {
 *     'planning-analyst': {
 *       'planning-guidelines.md': true  // Enable for planning phase
 *     },
 *     'implementation-engineer': {
 *       'coding-standards.md': true     // Enable for implementation
 *     },
 *     'quality-reviewer': {
 *       'review-checklist.md': true     // Enable for review phase
 *     }
 *   }
 * };
 * ```
 */
export interface DocumentConfiguration {
    /** Global documents available to all agents (filename -> enabled) */
    global: Record<string, boolean>;
    /** Agent-specific document configurations */
    agents: {
        /** Documents specific to planning and analysis phase */
        'planning-analyst': Record<string, boolean>;
        /** Documents specific to implementation phase */
        'implementation-engineer': Record<string, boolean>;
        /** Documents specific to quality review phase */
        'quality-reviewer': Record<string, boolean>;
    };
}
export interface DocumentInventory {
    global: DocumentInfo[];
    agents: {
        'planning-analyst': DocumentInfo[];
        'implementation-engineer': DocumentInfo[];
        'quality-reviewer': DocumentInfo[];
    };
}
export interface DocumentTemplate {
    name: string;
    description: string;
    content: string;
    type: 'text' | 'markdown' | 'json';
    category: 'global' | 'agent-specific';
    agentType?: 'planning-analyst' | 'implementation-engineer' | 'quality-reviewer';
}
export interface DocumentManagerConfig {
    documentsPath: string;
    enabledCategories: ('global' | 'agents')[];
    maxFileSize: number;
    allowedExtensions: string[];
}
export interface DocumentSearchOptions {
    category?: 'global' | 'agents';
    agentType?: string;
    fileType?: string;
    searchTerm?: string;
    includeContent?: boolean;
}
export interface DocumentSearchResult {
    documents: DocumentInfo[];
    totalCount: number;
    query: DocumentSearchOptions;
}
export interface DocumentOperationResult {
    success: boolean;
    message: string;
    affectedDocuments?: string[];
    errors?: string[];
}
//# sourceMappingURL=document-management.d.ts.map
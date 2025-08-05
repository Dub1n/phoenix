/**
 * Document Configuration Editor for Phoenix Code Lite
 * Provides CLI interface for managing per-agent and global document configurations
 */
import { DocumentOperationResult } from '../types/document-management';
interface DocumentEditOptions {
    templateName: string;
    interactive: boolean;
    showPreview: boolean;
}
export declare class DocumentConfigurationEditor {
    private documentManager;
    constructor();
    editTemplateDocuments(templateName: string, options?: Partial<DocumentEditOptions>): Promise<void>;
    private showCurrentConfiguration;
    private runInteractiveEditor;
    private toggleDocumentCategory;
    private saveConfiguration;
    initializeDocumentSystem(): Promise<DocumentOperationResult>;
    showDocumentInventory(): Promise<void>;
    private promptUser;
}
export {};
//# sourceMappingURL=document-configuration-editor.d.ts.map
/**---
 * title: [Document Configuration Editor - Template-Aware Docs Management]
 * tags: [CLI, Configuration, Documents, Templates]
 * provides: [DocumentConfigurationEditor Class, Interactive Editing, Preview Rendering]
 * requires: [DocumentManager, chalk, Document Types]
 * description: [Interactive editor for per-template document activation and preview, integrating with the document management system.]
 * ---*/
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
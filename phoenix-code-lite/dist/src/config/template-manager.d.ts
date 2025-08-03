import { PhoenixCodeLiteConfig, PhoenixCodeLiteConfigData } from './settings';
import { TemplateMetadata } from './templates';
export interface TemplateManagerOptions {
    templatesDir?: string;
    createDirIfNotExists?: boolean;
}
export declare class TemplateManager {
    private templatesDir;
    private customTemplates;
    constructor(options?: TemplateManagerOptions);
    private ensureTemplatesDirectory;
    private loadCustomTemplates;
    getAllTemplates(): TemplateMetadata[];
    getTemplateByName(name: string): {
        template: Partial<PhoenixCodeLiteConfigData>;
        metadata: TemplateMetadata;
    } | null;
    createTemplate(name: string, baseTemplate: string, customizations?: Partial<PhoenixCodeLiteConfigData>, description?: string): Promise<TemplateMetadata>;
    updateTemplate(name: string, updates: Partial<PhoenixCodeLiteConfigData>, description?: string): Promise<TemplateMetadata>;
    deleteTemplate(name: string): Promise<boolean>;
    duplicateTemplate(sourceName: string, newName: string, description?: string): Promise<TemplateMetadata>;
    resetTemplate(name: string): Promise<TemplateMetadata | null>;
    applyTemplate(templateName: string, config?: PhoenixCodeLiteConfig): Promise<PhoenixCodeLiteConfig>;
    exportTemplate(name: string): string;
    importTemplate(jsonData: string, overwrite?: boolean): Promise<TemplateMetadata>;
    getTemplatePreview(name: string): string;
}
//# sourceMappingURL=template-manager.d.ts.map
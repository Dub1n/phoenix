/**---
 * title: [Configuration Templates - Starter/Enterprise/Performance]
 * tags: [Configuration, Templates]
 * provides: [ConfigurationTemplates, Template Data]
 * requires: [PhoenixCodeLiteConfigData]
 * description: [Provides built-in templates (starter, enterprise, performance) for quick configuration bootstrapping.]
 * ---*/
import { PhoenixCodeLiteConfigData } from './settings';
import { DocumentConfiguration } from '../types/document-management';
export interface TemplateMetadata {
    name: string;
    displayName: string;
    description: string;
    category: 'starter' | 'production' | 'performance' | 'custom';
    features: string[];
    testCoverage: number;
    qualityLevel: 'basic' | 'standard' | 'strict';
    recommended: boolean;
    documents?: DocumentConfiguration;
}
export declare class ConfigurationTemplates {
    static getStarterTemplate(): Partial<PhoenixCodeLiteConfigData>;
    static getEnterpriseTemplate(): Partial<PhoenixCodeLiteConfigData>;
    static getStackSpecificTemplate(framework: string, language: string): Partial<PhoenixCodeLiteConfigData>;
    static getPerformanceTemplate(): Partial<PhoenixCodeLiteConfigData>;
    private static templateMetadataList;
    static getTemplateList(): TemplateMetadata[];
    static getTemplateByName(name: string): Partial<PhoenixCodeLiteConfigData> | null;
    static getTemplateMetadata(name: string): TemplateMetadata | null;
    static validateTemplate(template: Partial<PhoenixCodeLiteConfigData>): {
        valid: boolean;
        errors: string[];
    };
    static createCustomTemplate(name: string, baseTemplate: string, customizations: Partial<PhoenixCodeLiteConfigData>): {
        template: Partial<PhoenixCodeLiteConfigData>;
        metadata: TemplateMetadata;
    } | null;
    static mergeTemplates(base: Partial<PhoenixCodeLiteConfigData>, override: Partial<PhoenixCodeLiteConfigData>): Partial<PhoenixCodeLiteConfigData>;
    static exportTemplate(name: string, template: Partial<PhoenixCodeLiteConfigData>, metadata: TemplateMetadata): string;
    static importTemplate(jsonData: string): {
        template: Partial<PhoenixCodeLiteConfigData>;
        metadata: TemplateMetadata;
    };
    /**
     * Update document configuration for a template
     */
    static updateTemplateDocuments(templateName: string, documentConfig: DocumentConfiguration): boolean;
    /**
     * Get template with document configuration support
     */
    static getTemplateWithDocuments(name: string): {
        template: Partial<PhoenixCodeLiteConfigData>;
        metadata: TemplateMetadata;
    } | null;
    /**
     * Initialize default document configurations for built-in templates
     */
    static initializeDefaultDocumentConfigurations(): void;
}
//# sourceMappingURL=templates.d.ts.map
import { PhoenixCodeLiteConfigData } from './settings';
export interface TemplateMetadata {
    name: string;
    displayName: string;
    description: string;
    category: 'starter' | 'production' | 'performance' | 'custom';
    features: string[];
    testCoverage: number;
    qualityLevel: 'basic' | 'standard' | 'strict';
    recommended: boolean;
}
export declare class ConfigurationTemplates {
    static getStarterTemplate(): Partial<PhoenixCodeLiteConfigData>;
    static getEnterpriseTemplate(): Partial<PhoenixCodeLiteConfigData>;
    static getPerformanceTemplate(): Partial<PhoenixCodeLiteConfigData>;
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
}
//# sourceMappingURL=templates.d.ts.map
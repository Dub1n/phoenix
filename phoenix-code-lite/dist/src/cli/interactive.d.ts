import { PhoenixCodeLiteConfig } from '../config/settings';
export interface ConfigurationWizardAnswers {
    projectType: 'web' | 'api' | 'library' | 'cli';
    language: 'javascript' | 'typescript' | 'python';
    framework?: string;
    qualityLevel: 'starter' | 'professional' | 'enterprise';
    enableAdvancedFeatures: boolean;
}
export interface ConfigEditResult {
    saved: boolean;
    templateUpdated?: string;
    config?: PhoenixCodeLiteConfig;
}
export declare class InteractivePrompts {
    runConfigurationWizard(): Promise<ConfigurationWizardAnswers>;
    confirmOverwrite(path: string): Promise<boolean>;
    selectTemplate(): Promise<string>;
    validateTaskDescription(input: string): boolean;
    handleEscapeKey(): Promise<boolean>;
    setupEscapeHandler(): void;
    cleanupEscapeHandler(): void;
    getConfigurationWizardSteps(): any[];
    getConfigurationWizard(): any[];
    getTaskInput(): Promise<string>;
    runInteractiveConfigEditor(): Promise<ConfigEditResult>;
    private showMainConfigMenu;
    private editFrameworkSettings;
    private editSpecificSetting;
    private getConfigPath;
    private getSettingInfo;
    private editLanguagePreferences;
    private editLanguagePreferencesAdvanced;
    private editAgentConfiguration;
    private editLoggingConfiguration;
    private editMetricsConfiguration;
    private editQualityThresholds;
    private editSecurityPolicies;
    private manageTemplates;
    private editAdvancedSettings;
    private selectTemplateWithPreview;
    private showTemplatePreview;
    private confirmTemplateReset;
    private confirmDiscardChanges;
    private pressEnterToContinue;
}
//# sourceMappingURL=interactive.d.ts.map
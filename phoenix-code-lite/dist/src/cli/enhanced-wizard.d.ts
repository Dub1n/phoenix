/**---
 * title: [Enhanced Wizard - Guided Interactive Setup]
 * tags: [CLI, Wizard, UX, Configuration]
 * provides: [wizardCommand, Interactive Setup Flows, Validation]
 * requires: [InteractivePrompts, PhoenixCodeLiteConfig, Templates, HelpSystem]
 * description: [Guided interactive setup wizard for onboarding and configuration with validation and template selection.]
 * ---*/
import { ProjectContext } from './project-discovery';
import { ConfigurationWizardAnswers } from './interactive';
export interface EnhancedWizardOptions {
    skipDiscovery?: boolean;
    projectPath?: string;
    verbose?: boolean;
}
export interface EnhancedWizardAnswers extends ConfigurationWizardAnswers {
    discoveredContext?: ProjectContext;
    useDiscoveredSettings?: boolean;
    customizeTemplate?: boolean;
}
export declare class EnhancedWizard {
    private discovery;
    private prompts;
    constructor();
    runEnhancedWizard(options?: EnhancedWizardOptions): Promise<EnhancedWizardAnswers>;
    private getSmartConfiguration;
    private generateSmartConfiguration;
    private customizeSmartConfiguration;
    private runManualConfiguration;
    private runSteppedWizard;
    private getProjectTypeChoices;
    private getLanguageChoices;
    private getFrameworkChoices;
    private getQualityLevelChoices;
    private getEnhancedWizardSteps;
    generateConfiguration(answers: EnhancedWizardAnswers): any;
    private mergeWithQualityLevel;
    private applyStackOptimizations;
    private applyFrameworkSettings;
}
//# sourceMappingURL=enhanced-wizard.d.ts.map
/**---
 * title: [AAMI TIR45 Requirement Analyzer - QMS]
 * tags: [Preparation, QMS, Analysis]
 * provides: [AAMITIR45RequirementAnalyzer]
 * requires: []
 * description: [Analyzes requirements and development practices per AAMI TIR45 guidance.]
 * ---*/
import { RegulatoryRequirement } from './regulatory-document-processor';
export interface AAMITIR45Requirement extends RegulatoryRequirement {
    agilePractice?: string;
    iterationType?: 'sprint' | 'release' | 'milestone';
    complianceLevel?: 'basic' | 'enhanced' | 'comprehensive';
}
export declare class AAMITIR45RequirementAnalyzer {
    private documentProcessor;
    constructor();
    /**
     * Extract AAMI TIR45 requirements
     */
    extractRequirements(): Promise<AAMITIR45Requirement[]>;
    /**
     * Convert generic requirement to AAMI TIR45 requirement
     */
    private convertToAAMITIR45Requirement;
    /**
     * Determine agile practice based on requirement
     */
    private determineAgilePractice;
    /**
     * Determine iteration type based on requirement
     */
    private determineIterationType;
    /**
     * Determine compliance level based on requirement
     */
    private determineComplianceLevel;
    /**
     * Get mock requirements for testing
     */
    private getMockRequirements;
    /**
     * Get requirements by agile practice
     */
    getRequirementsByAgilePractice(practice: string): Promise<AAMITIR45Requirement[]>;
    /**
     * Get requirements by iteration type
     */
    getRequirementsByIterationType(iterationType: 'sprint' | 'release' | 'milestone'): Promise<AAMITIR45Requirement[]>;
    /**
     * Get requirements by compliance level
     */
    getRequirementsByComplianceLevel(complianceLevel: 'basic' | 'enhanced' | 'comprehensive'): Promise<AAMITIR45Requirement[]>;
}
//# sourceMappingURL=aami-tir45-requirement-analyzer.d.ts.map
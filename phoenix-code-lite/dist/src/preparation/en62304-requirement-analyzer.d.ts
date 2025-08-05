/**
 * EN 62304 Requirement Analyzer
 *
 * Analyzes and extracts requirements from EN 62304 standard
 */
import { RegulatoryRequirement } from './regulatory-document-processor';
export interface EN62304Requirement extends RegulatoryRequirement {
    safetyClass?: 'A' | 'B' | 'C';
    developmentLevel?: 'basic' | 'intermediate' | 'advanced';
    riskLevel?: 'low' | 'medium' | 'high';
}
export declare class EN62304RequirementAnalyzer {
    private documentProcessor;
    constructor();
    /**
     * Extract EN 62304 requirements
     */
    extractRequirements(): Promise<EN62304Requirement[]>;
    /**
     * Convert generic requirement to EN62304 requirement
     */
    private convertToEN62304Requirement;
    /**
     * Determine safety class based on requirement
     */
    private determineSafetyClass;
    /**
     * Determine development level based on requirement
     */
    private determineDevelopmentLevel;
    /**
     * Determine risk level based on requirement
     */
    private determineRiskLevel;
    /**
     * Get mock requirements for testing
     */
    private getMockRequirements;
    /**
     * Get requirements by safety class
     */
    getRequirementsBySafetyClass(safetyClass: 'A' | 'B' | 'C'): Promise<EN62304Requirement[]>;
    /**
     * Get requirements by category
     */
    getRequirementsByCategory(category: string): Promise<EN62304Requirement[]>;
    /**
     * Get requirements by priority
     */
    getRequirementsByPriority(priority: 'high' | 'medium' | 'low'): Promise<EN62304Requirement[]>;
}
//# sourceMappingURL=en62304-requirement-analyzer.d.ts.map
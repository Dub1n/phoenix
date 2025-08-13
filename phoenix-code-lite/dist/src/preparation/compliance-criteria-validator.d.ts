/**---
 * title: [Compliance Criteria Validator - QMS]
 * tags: [Preparation, QMS, Validation]
 * provides: [ComplianceCriteriaValidator]
 * requires: []
 * description: [Validates project elements against explicit compliance criteria (e.g., EN standards).]
 * ---*/
export interface ComplianceCriteria {
    en62304: {
        safetyClassification: any;
        developmentPlanning: any;
        riskManagement: any;
    };
    aamiTir45: {
        agilePractices: any;
        iterativeDevelopment: any;
        documentation: any;
    };
}
export declare class ComplianceCriteriaValidator {
    /**
     * Create validation criteria for QMS compliance
     */
    createValidationCriteria(): Promise<ComplianceCriteria>;
    /**
     * Validate compliance against criteria
     */
    validateCompliance(criteria: ComplianceCriteria, actualCompliance: any): Promise<{
        valid: boolean;
        issues: string[];
        score: number;
    }>;
    /**
     * Generate compliance report
     */
    generateComplianceReport(): Promise<{
        criteria: ComplianceCriteria;
        recommendations: string[];
        riskLevel: 'low' | 'medium' | 'high';
    }>;
}
//# sourceMappingURL=compliance-criteria-validator.d.ts.map
/**
 * QMS Performance Target Validator
 *
 * Defines and validates QMS-specific performance targets
 * for regulatory compliance and audit trail requirements
 */
export interface DocumentProcessingTarget {
    maxProcessingTime: number;
    maxMemoryUsage: number;
    targetAccuracy: number;
}
export interface ComplianceValidationTarget {
    maxValidationTime: number;
    maxMemoryUsage: number;
    targetAccuracy: number;
}
export interface AuditTrailTarget {
    maxGenerationTime: number;
    maxTrailSize: number;
    targetIntegrity: number;
}
export declare class QMSPerformanceTargetValidator {
    /**
     * Define document processing performance targets
     */
    defineDocumentProcessingTarget(): Promise<DocumentProcessingTarget>;
    /**
     * Define compliance validation performance targets
     */
    defineComplianceValidationTarget(): Promise<ComplianceValidationTarget>;
    /**
     * Define audit trail generation targets
     */
    defineAuditTrailTarget(): Promise<AuditTrailTarget>;
    /**
     * Validate performance against QMS targets
     */
    validatePerformance(actualProcessingTime: number, actualMemoryUsage: number, actualAccuracy: number): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    /**
     * Generate QMS performance report
     */
    generatePerformanceReport(): Promise<{
        documentProcessing: DocumentProcessingTarget;
        complianceValidation: ComplianceValidationTarget;
        auditTrail: AuditTrailTarget;
        recommendations: string[];
    }>;
    /**
     * Calculate QMS performance score
     */
    calculatePerformanceScore(processingTime: number, memoryUsage: number, accuracy: number): Promise<number>;
}
//# sourceMappingURL=qms-performance-target-validator.d.ts.map
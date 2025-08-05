/**
 * QMS Performance Target Validator
 * 
 * Defines and validates QMS-specific performance targets
 * for regulatory compliance and audit trail requirements
 */

export interface DocumentProcessingTarget {
  maxProcessingTime: number; // milliseconds
  maxMemoryUsage: number; // bytes
  targetAccuracy: number; // percentage (0-1)
}

export interface ComplianceValidationTarget {
  maxValidationTime: number; // milliseconds
  maxMemoryUsage: number; // bytes
  targetAccuracy: number; // percentage (0-1)
}

export interface AuditTrailTarget {
  maxGenerationTime: number; // milliseconds
  maxTrailSize: number; // bytes
  targetIntegrity: number; // percentage (0-1)
}

export class QMSPerformanceTargetValidator {
  
  /**
   * Define document processing performance targets
   */
  async defineDocumentProcessingTarget(): Promise<DocumentProcessingTarget> {
    return {
      maxProcessingTime: 30000, // 30 seconds for large regulatory documents
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB for PDF processing
      targetAccuracy: 0.95 // 95% accuracy for requirement extraction
    };
  }
  
  /**
   * Define compliance validation performance targets
   */
  async defineComplianceValidationTarget(): Promise<ComplianceValidationTarget> {
    return {
      maxValidationTime: 10000, // 10 seconds for compliance checks
      maxMemoryUsage: 200 * 1024 * 1024, // 200MB for validation
      targetAccuracy: 0.90 // 90% accuracy for compliance validation
    };
  }
  
  /**
   * Define audit trail generation targets
   */
  async defineAuditTrailTarget(): Promise<AuditTrailTarget> {
    return {
      maxGenerationTime: 5000, // 5 seconds for audit trail generation
      maxTrailSize: 10 * 1024 * 1024, // 10MB max trail size
      targetIntegrity: 1.0 // 100% integrity requirement
    };
  }
  
  /**
   * Validate performance against QMS targets
   */
  async validatePerformance(
    actualProcessingTime: number,
    actualMemoryUsage: number,
    actualAccuracy: number
  ): Promise<{ valid: boolean; issues: string[] }> {
    const targets = await this.defineDocumentProcessingTarget();
    const issues: string[] = [];
    
    if (actualProcessingTime > targets.maxProcessingTime) {
      issues.push(`Processing time ${actualProcessingTime}ms exceeds target ${targets.maxProcessingTime}ms`);
    }
    
    if (actualMemoryUsage > targets.maxMemoryUsage) {
      issues.push(`Memory usage ${actualMemoryUsage} bytes exceeds target ${targets.maxMemoryUsage} bytes`);
    }
    
    if (actualAccuracy < targets.targetAccuracy) {
      issues.push(`Accuracy ${actualAccuracy} below target ${targets.targetAccuracy}`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Generate QMS performance report
   */
  async generatePerformanceReport(): Promise<{
    documentProcessing: DocumentProcessingTarget;
    complianceValidation: ComplianceValidationTarget;
    auditTrail: AuditTrailTarget;
    recommendations: string[];
  }> {
    const documentProcessing = await this.defineDocumentProcessingTarget();
    const complianceValidation = await this.defineComplianceValidationTarget();
    const auditTrail = await this.defineAuditTrailTarget();
    
    const recommendations = [
      'Monitor memory usage during large document processing',
      'Implement caching for frequently accessed regulatory requirements',
      'Use incremental processing for large PDF documents',
      'Implement parallel processing for compliance validation',
      'Regularly audit trail integrity and performance'
    ];
    
    return {
      documentProcessing,
      complianceValidation,
      auditTrail,
      recommendations
    };
  }
  
  /**
   * Calculate QMS performance score
   */
  async calculatePerformanceScore(
    processingTime: number,
    memoryUsage: number,
    accuracy: number
  ): Promise<number> {
    const targets = await this.defineDocumentProcessingTarget();
    
    // Calculate normalized scores (0-1, where 1 is perfect)
    const timeScore = Math.max(0, 1 - (processingTime / targets.maxProcessingTime));
    const memoryScore = Math.max(0, 1 - (memoryUsage / targets.maxMemoryUsage));
    const accuracyScore = accuracy / targets.targetAccuracy;
    
    // Weighted average (accuracy is most important for QMS)
    const weightedScore = (timeScore * 0.2) + (memoryScore * 0.3) + (accuracyScore * 0.5);
    
    return Math.min(1, Math.max(0, weightedScore));
  }
} 
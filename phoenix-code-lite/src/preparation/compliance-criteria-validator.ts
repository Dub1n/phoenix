/**
 * Compliance Criteria Validator
 * 
 * Creates and validates compliance criteria for QMS requirements
 */

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

export class ComplianceCriteriaValidator {
  
  /**
   * Create validation criteria for QMS compliance
   */
  async createValidationCriteria(): Promise<ComplianceCriteria> {
    return {
      en62304: {
        safetyClassification: {
          required: true,
          validationRules: [
            'Safety class A, B, or C must be determined',
            'Risk analysis must be performed',
            'Safety requirements must be documented'
          ],
          acceptanceCriteria: [
            'All safety requirements are traceable',
            'Risk mitigation measures are implemented',
            'Safety classification is justified'
          ]
        },
        developmentPlanning: {
          required: true,
          validationRules: [
            'Software development plan must be established',
            'Development activities must be planned',
            'Resources must be allocated'
          ],
          acceptanceCriteria: [
            'Development plan is comprehensive',
            'Activities are properly sequenced',
            'Resources are adequate'
          ]
        },
        riskManagement: {
          required: true,
          validationRules: [
            'Risk management process must be followed',
            'Risks must be identified and analyzed',
            'Risk control measures must be implemented'
          ],
          acceptanceCriteria: [
            'Risk management is systematic',
            'All risks are addressed',
            'Control measures are effective'
          ]
        }
      },
      aamiTir45: {
        agilePractices: {
          required: true,
          validationRules: [
            'Agile practices must be adapted for medical devices',
            'Sprint planning must include compliance considerations',
            'Continuous integration must maintain traceability'
          ],
          acceptanceCriteria: [
            'Agile practices support compliance',
            'Sprint deliverables are compliant',
            'Traceability is maintained'
          ]
        },
        iterativeDevelopment: {
          required: true,
          validationRules: [
            'Iterations must maintain regulatory compliance',
            'Documentation must be updated incrementally',
            'Validation must occur at each iteration'
          ],
          acceptanceCriteria: [
            'Compliance is maintained throughout',
            'Documentation is current',
            'Validation is comprehensive'
          ]
        },
        documentation: {
          required: true,
          validationRules: [
            'Documentation must be maintained throughout development',
            'Changes must be tracked and controlled',
            'Documentation must be accessible'
          ],
          acceptanceCriteria: [
            'Documentation is complete',
            'Changes are controlled',
            'Access is appropriate'
          ]
        }
      }
    };
  }
  
  /**
   * Validate compliance against criteria
   */
  async validateCompliance(
    criteria: ComplianceCriteria,
    actualCompliance: any
  ): Promise<{ valid: boolean; issues: string[]; score: number }> {
    const issues: string[] = [];
    let totalChecks = 0;
    let passedChecks = 0;
    
    // Validate EN 62304 compliance
    if (criteria.en62304) {
      totalChecks += 3; // 3 categories
      
      if (actualCompliance.en62304?.safetyClassification) {
        passedChecks++;
      } else {
        issues.push('EN 62304 safety classification compliance missing');
      }
      
      if (actualCompliance.en62304?.developmentPlanning) {
        passedChecks++;
      } else {
        issues.push('EN 62304 development planning compliance missing');
      }
      
      if (actualCompliance.en62304?.riskManagement) {
        passedChecks++;
      } else {
        issues.push('EN 62304 risk management compliance missing');
      }
    }
    
    // Validate AAMI TIR45 compliance
    if (criteria.aamiTir45) {
      totalChecks += 3; // 3 categories
      
      if (actualCompliance.aamiTir45?.agilePractices) {
        passedChecks++;
      } else {
        issues.push('AAMI TIR45 agile practices compliance missing');
      }
      
      if (actualCompliance.aamiTir45?.iterativeDevelopment) {
        passedChecks++;
      } else {
        issues.push('AAMI TIR45 iterative development compliance missing');
      }
      
      if (actualCompliance.aamiTir45?.documentation) {
        passedChecks++;
      } else {
        issues.push('AAMI TIR45 documentation compliance missing');
      }
    }
    
    const score = totalChecks > 0 ? passedChecks / totalChecks : 0;
    const valid = score >= 0.8; // 80% threshold
    
    return {
      valid,
      issues,
      score
    };
  }
  
  /**
   * Generate compliance report
   */
  async generateComplianceReport(): Promise<{
    criteria: ComplianceCriteria;
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const criteria = await this.createValidationCriteria();
    
    const recommendations = [
      'Implement automated compliance checking',
      'Establish regular compliance audits',
      'Maintain comprehensive documentation',
      'Train team on regulatory requirements',
      'Use compliance tracking tools'
    ];
    
    return {
      criteria,
      recommendations,
      riskLevel: 'medium' // Default risk level
    };
  }
} 
#!/usr/bin/env node

/**
 * Interface Compliance Checker - Safety Framework Component
 * 
 * Validates that validators implement the IValidator interface correctly
 * and provides detailed compliance reporting for the safety framework.
 * 
 * Part of the Enhanced Validation System Safety Framework
 * Version: 3.0.0
 * Date: 2025-09-06
 */

import fs from 'fs';
import path from 'path';

/**
 * Interface Compliance Checker implementing IComplianceChecker interface
 */
export class InterfaceComplianceChecker {
  constructor() {
    this.requiredInterfaceVersion = '3.0.0';
    this.requiredMethods = [
      'validate',
      'getCapabilities', 
      'checkInterfaceCompliance',
      'runSelfDiagnostics',
      'getMetadata'
    ];
    this.requiredProperties = [
      'category',
      'version', 
      'scopes'
    ];
  }

  /**
   * Check complete compliance of a loaded validator instance
   */
  async checkCompliance(validator) {
    const result = {
      compliant: false,
      interfaceVersion: this.requiredInterfaceVersion,
      missingMethods: [],
      incorrectSignatures: [],
      additionalMethods: [],
      missingProperties: [],
      score: 0,
      details: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Check required properties
      for (const prop of this.requiredProperties) {
        if (!(prop in validator)) {
          result.missingProperties.push(prop);
          result.details.push(`Missing required property: ${prop}`);
        }
      }

      // Check required methods
      for (const method of this.requiredMethods) {
        if (typeof validator[method] !== 'function') {
          result.missingMethods.push(method);
          result.details.push(`Missing or invalid method: ${method}`);
        }
      }

      // Check method signatures
      const signatureErrors = await this.validateMethodSignatures(validator);
      result.incorrectSignatures = signatureErrors;
      result.details.push(...signatureErrors.map(err => `Incorrect signature: ${err}`));

      // Check for additional methods (not an error, just informational)
      const validatorMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(validator))
        .filter(name => typeof validator[name] === 'function' && name !== 'constructor');
      
      result.additionalMethods = validatorMethods.filter(method => 
        !this.requiredMethods.includes(method) &&
        !['cleanup', 'runIntegrationTests'].includes(method) // Known optional methods
      );

      // Calculate compliance score
      const totalChecks = this.requiredMethods.length + this.requiredProperties.length;
      const passedChecks = totalChecks - result.missingMethods.length - result.missingProperties.length - result.incorrectSignatures.length;
      result.score = Math.round((passedChecks / totalChecks) * 100);

      // Determine overall compliance
      result.compliant = result.missingMethods.length === 0 && 
                        result.missingProperties.length === 0 && 
                        result.incorrectSignatures.length === 0;

      if (result.compliant) {
        result.details.push('✅ Validator fully compliant with IValidator interface');
      } else {
        result.details.push(`❌ Validator compliance failed - Score: ${result.score}%`);
      }

      return result;

    } catch (error) {
      result.details.push(`Compliance check failed: ${error.message}`);
      result.score = 0;
      return result;
    }
  }

  /**
   * Validate validator from file path (static analysis)
   */
  async validateInterface(filePath) {
    const result = {
      compliant: false,
      interfaceVersion: this.requiredInterfaceVersion,
      missingMethods: [],
      incorrectSignatures: [],
      additionalMethods: [],
      score: 0,
      details: [],
      timestamp: new Date().toISOString()
    };

    try {
      if (!fs.existsSync(filePath)) {
        result.details.push(`File not found: ${filePath}`);
        return result;
      }

      // Read and analyze file content
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Check for required methods in file content
      for (const method of this.requiredMethods) {
        const methodRegex = new RegExp(`\\s+${method}\\s*\\(`, 'g');
        if (!methodRegex.test(fileContent)) {
          result.missingMethods.push(method);
          result.details.push(`Method not found in source: ${method}`);
        }
      }

      // Check for required properties
      for (const prop of this.requiredProperties) {
        const propRegex = new RegExp(`this\\.${prop}\\s*=`, 'g');
        if (!propRegex.test(fileContent)) {
          result.missingProperties = result.missingProperties || [];
          result.missingProperties.push(prop);
          result.details.push(`Property assignment not found: ${prop}`);
        }
      }

      // Check for class definition
      if (!fileContent.includes('class ') || !fileContent.includes('Validator')) {
        result.details.push('No validator class definition found');
      }

      // Check for proper exports
      if (!fileContent.includes('export ') && !fileContent.includes('module.exports')) {
        result.details.push('No export statement found');
      }

      // Calculate score
      const missingCount = result.missingMethods.length + (result.missingProperties?.length || 0);
      const totalRequired = this.requiredMethods.length + this.requiredProperties.length;
      result.score = Math.round(((totalRequired - missingCount) / totalRequired) * 100);

      result.compliant = result.missingMethods.length === 0 && 
                        (result.missingProperties?.length || 0) === 0;

      if (result.compliant) {
        result.details.push('✅ File appears to implement IValidator interface');
      } else {
        result.details.push(`❌ File compliance failed - Score: ${result.score}%`);
      }

      return result;

    } catch (error) {
      result.details.push(`Interface validation failed: ${error.message}`);
      result.score = 0;
      return result;
    }
  }

  /**
   * Get list of required methods for interface compliance
   */
  getRequiredMethods() {
    return [...this.requiredMethods];
  }

  /**
   * Validate method signatures of a validator instance
   */
  async validateMethodSignatures(validator) {
    const errors = [];

    try {
      // Check validate method signature
      if (typeof validator.validate === 'function') {
        const validateLength = validator.validate.length;
        if (validateLength < 2) {
          errors.push('validate method should accept at least 2 parameters (projectInfo, scopeConfig)');
        }
      }

      // Check getCapabilities method signature
      if (typeof validator.getCapabilities === 'function') {
        const capabilitiesLength = validator.getCapabilities.length;
        if (capabilitiesLength > 0) {
          errors.push('getCapabilities method should accept no parameters');
        }
      }

      // Check getMetadata method signature
      if (typeof validator.getMetadata === 'function') {
        const metadataLength = validator.getMetadata.length;
        if (metadataLength > 0) {
          errors.push('getMetadata method should accept no parameters');
        }
      }

      // Additional signature checks could be added here

    } catch (error) {
      errors.push(`Method signature validation failed: ${error.message}`);
    }

    return errors;
  }

  /**
   * Create a compliance report for a validator
   */
  generateComplianceReport(validator, complianceResult) {
    const report = {
      validator: validator.category || 'Unknown',
      version: validator.version || 'Unknown',
      timestamp: new Date().toISOString(),
      compliant: complianceResult.compliant,
      score: complianceResult.score,
      summary: {
        totalChecks: this.requiredMethods.length + this.requiredProperties.length,
        passedChecks: Math.round((complianceResult.score / 100) * (this.requiredMethods.length + this.requiredProperties.length)),
        failedChecks: complianceResult.missingMethods.length + complianceResult.missingProperties.length + complianceResult.incorrectSignatures.length
      },
      issues: {
        missingMethods: complianceResult.missingMethods,
        missingProperties: complianceResult.missingProperties || [],
        incorrectSignatures: complianceResult.incorrectSignatures
      },
      recommendations: this.generateRecommendations(complianceResult)
    };

    return report;
  }

  /**
   * Generate recommendations based on compliance results
   */
  generateRecommendations(complianceResult) {
    const recommendations = [];

    if (complianceResult.missingMethods.length > 0) {
      recommendations.push(`Implement missing methods: ${complianceResult.missingMethods.join(', ')}`);
    }

    if (complianceResult.missingProperties && complianceResult.missingProperties.length > 0) {
      recommendations.push(`Add missing properties: ${complianceResult.missingProperties.join(', ')}`);
    }

    if (complianceResult.incorrectSignatures.length > 0) {
      recommendations.push('Fix method signatures to match IValidator interface');
    }

    if (complianceResult.score < 100) {
      recommendations.push('Review IValidator interface documentation and ensure full compliance');
    }

    if (complianceResult.score >= 80) {
      recommendations.push('Consider implementing optional methods like cleanup() for enhanced functionality');
    }

    return recommendations;
  }

  /**
   * Batch validate multiple validators
   */
  async batchValidateCompliance(validators) {
    const results = [];

    for (const validator of validators) {
      try {
        const complianceResult = await this.checkCompliance(validator);
        const report = this.generateComplianceReport(validator, complianceResult);
        results.push(report);
      } catch (error) {
        results.push({
          validator: validator.category || 'Unknown',
          error: error.message,
          compliant: false,
          score: 0
        });
      }
    }

    return {
      totalValidators: validators.length,
      compliantValidators: results.filter(r => r.compliant).length,
      averageScore: results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length,
      results
    };
  }
}

export default InterfaceComplianceChecker;
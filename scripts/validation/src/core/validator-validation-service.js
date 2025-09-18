import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { InterfaceComplianceChecker } from '../safety/interface-compliance-checker.js';

// Provides risk assessment and interface compliance checks for validator submissions
export class ValidatorValidationService {
  constructor() {
    this.complianceChecker = new InterfaceComplianceChecker();
  }

  isReady() {
    return Boolean(this.complianceChecker);
  }

  async assessSubmittedValidatorRisk(validatorPath, category) {
    const content = fs.readFileSync(validatorPath, 'utf8');
    let riskScore = 0;
    const riskFactors = [];

    if (content.includes('execSync') || content.includes('spawn')) {
      riskScore += 30;
      riskFactors.push('Contains command execution');
    }

    if (content.includes('eval(') || content.includes('Function(')) {
      riskScore += 40;
      riskFactors.push('Contains code evaluation');
    }

    if (content.includes('fs.writeFileSync') || content.includes('fs.unlinkSync')) {
      riskScore += 20;
      riskFactors.push('Modifies file system');
    }

    if (['core', 'build', 'architecture'].includes(category)) {
      riskScore += 25;
      riskFactors.push('Critical system category');
    }

    let riskLevel = 'low';
    if (riskScore >= 70) {
      riskLevel = 'critical';
    } else if (riskScore >= 40) {
      riskLevel = 'high';
    } else if (riskScore >= 20) {
      riskLevel = 'medium';
    }

    return {
      riskLevel,
      score: riskScore,
      factors: riskFactors
    };
  }

  async sandboxTestSubmittedValidator(validatorPath) {
    const result = {
      passed: false,
      errors: [],
      warnings: []
    };

    try {
      const moduleUrl = pathToFileURL(path.resolve(validatorPath)).href;
      const { default: ValidatorClass } = await import(moduleUrl);
      const validator = new ValidatorClass();

      const requiredMethods = ['validate', 'getCapabilities', 'getMetadata', 'runSelfDiagnostics'];
      for (const method of requiredMethods) {
        if (typeof validator[method] !== 'function') {
          result.errors.push(`Missing required method: ${method}`);
        }
      }

      const capabilities = validator.getCapabilities();
      const metadata = validator.getMetadata();
      const diagnostics = validator.runSelfDiagnostics();

      if (!capabilities || !metadata || !diagnostics) {
        result.errors.push('Basic method execution failed');
      }

      result.passed = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`Import or execution failed: ${error.message}`);
    }

    return result;
  }

  async validateSubmittedValidatorCompliance(validatorPath) {
    try {
      const moduleUrl = pathToFileURL(path.resolve(validatorPath)).href;
      const { default: ValidatorClass } = await import(moduleUrl);
      const validator = new ValidatorClass();

      return await this.ensureInterfaceCompliance(validator);
    } catch (error) {
      return {
        compliant: false,
        score: 0,
        error: error.message
      };
    }
  }

  async ensureInterfaceCompliance(validatorInstance) {
    return this.complianceChecker.checkCompliance(validatorInstance);
  }
}

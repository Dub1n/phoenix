/**
 * NewCategoryTests - Complete Validation Orchestrator
 * 
 * Main orchestrator for all NewCategoryTests validation functions.
 * Source: TEST-COVERAGE-HANDOFF.md - NewCategoryTests Extraction Summary
 * 
 * Purpose: Orchestrates all validations for agent use during ValidatorExtensionSequence.
 * Agent can use this to validate its own work without recursion while leveraging 
 * the comprehensive test framework designed for the enhanced validation system.
 * 
 * Integration: Agent ValidatorExtensionSequence workflow:
 * 1. Agent generates new [category]-validator.js
 * 2. Agent runs NewCategoryTests to validate generated validator
 * 3. If tests pass → Agent proceeds with validation
 * 4. If tests fail → Agent iterates on validator generation
 * 
 * Version: 1.0.0
 * Date: 2025-09-06
 */

import { pathToFileURL } from 'url';
import templateValidation from './template-validation.js';
import codeValidation from './code-validation.js';
import sandboxValidation from './sandbox-validation.js';

/**
 * Complete validator validation for agent use
 * 
 * @param {string} filePath - Path to the generated validator file
 * @param {object} options - Validation options
 * @returns {object} Complete validation result
 */
export async function validateGeneratedValidator(filePath, options = {}) {
  const {
    templateContext = null,
    performSandboxTests = true,
    performSecurityValidation = true,
    validationThresholds = {}
  } = options;

  const validationResults = {
    success: true,
    timestamp: new Date().toISOString(),
    filePath,
    phases: {
      template: null,
      code: null,
      sandbox: null
    },
    summary: {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      warnings: 0
    },
    errors: [],
    warnings: [],
    recommendations: []
  };

  try {
    // Phase 1: Template Validation
    if (templateContext) {
      console.log('🔍 Phase 1: Template Validation');
      
      const fs = await import('fs');
      const generatedContent = fs.readFileSync(filePath, 'utf8');
      
      const templateResult = await templateValidation.validateTemplateProcessing(
        generatedContent, 
        templateContext
      );
      
      validationResults.phases.template = templateResult;
      validationResults.summary.totalChecks += templateResult.checks.length;
      validationResults.summary.passedChecks += templateResult.checks.filter(c => c.status === 'passed').length;
      validationResults.summary.failedChecks += templateResult.checks.filter(c => c.status === 'failed').length;
      
      if (!templateResult.success) {
        validationResults.success = false;
        validationResults.errors.push(...templateResult.errors);
      }
      
      console.log(`  ✅ Template validation: ${templateResult.success ? 'PASSED' : 'FAILED'}`);
    }

    // Phase 2: Code Validation
    console.log('🔧 Phase 2: Code Quality Validation');
    
    // Import and instantiate validator for interface testing
    let validatorInstance = null;
    let codeAnalysis = null;
    
    try {
      const validatorModule = await import(pathToFileURL(filePath).href);
      const ValidatorClass = validatorModule.default;
      validatorInstance = new ValidatorClass();
      
      // Prepare basic code analysis
      const fs = await import('fs');
      const sourceCode = fs.readFileSync(filePath, 'utf8');
      codeAnalysis = {
        sourceCode,
        securityIssues: [], // Would be populated by actual security scanner
        complexity: 'basic'
      };
      
    } catch (importError) {
      validationResults.warnings.push(`Could not instantiate validator for interface testing: ${importError.message}`);
    }
    
    const codeResult = await codeValidation.validateGeneratedCode(
      filePath,
      validatorInstance,
      codeAnalysis
    );
    
    validationResults.phases.code = codeResult;
    validationResults.summary.totalChecks += codeResult.checks.length;
    validationResults.summary.passedChecks += codeResult.checks.filter(c => c.status === 'passed').length;
    validationResults.summary.failedChecks += codeResult.checks.filter(c => c.status === 'failed').length;
    validationResults.summary.warnings += codeResult.warnings.length;
    
    if (!codeResult.success) {
      validationResults.success = false;
      validationResults.errors.push(...codeResult.errors);
    }
    
    if (codeResult.warnings.length > 0) {
      validationResults.warnings.push(...codeResult.warnings);
    }
    
    console.log(`  ✅ Code validation: ${codeResult.success ? 'PASSED' : 'FAILED'}`);

    // Phase 3: Sandbox Validation (if enabled)
    if (performSandboxTests) {
      console.log('🧪 Phase 3: Sandbox Execution Validation');
      
      const sandboxResult = await sandboxValidation.validateSandboxCompliance(
        filePath,
        validatorInstance
      );
      
      validationResults.phases.sandbox = sandboxResult;
      validationResults.summary.totalChecks += sandboxResult.checks.length;
      validationResults.summary.passedChecks += sandboxResult.checks.filter(c => c.status === 'passed').length;
      validationResults.summary.failedChecks += sandboxResult.checks.filter(c => c.status === 'failed').length;
      validationResults.summary.warnings += sandboxResult.warnings.length;
      
      if (!sandboxResult.success) {
        validationResults.success = false;
        validationResults.errors.push(...sandboxResult.errors);
      }
      
      if (sandboxResult.warnings.length > 0) {
        validationResults.warnings.push(...sandboxResult.warnings);
      }
      
      if (sandboxResult.recommendations.length > 0) {
        validationResults.recommendations.push(...sandboxResult.recommendations);
      }
      
      console.log(`  ✅ Sandbox validation: ${sandboxResult.success ? 'PASSED' : 'FAILED'}`);
    }

    // Generate summary recommendations
    generateValidationRecommendations(validationResults);

  } catch (error) {
    validationResults.success = false;
    validationResults.errors.push(`Validation orchestration failed: ${error.message}`);
  }

  return validationResults;
}

/**
 * Quick validation for agent use (minimal checks)
 * 
 * @param {string} filePath - Path to the generated validator file
 * @returns {object} Quick validation result
 */
export async function quickValidateGenerator(filePath) {
  const quickResults = {
    success: true,
    checks: [],
    errors: []
  };

  try {
    // Quick syntax check
    await codeValidation.validateGeneratedCodeSyntax(filePath);
    quickResults.checks.push({ name: 'Syntax', status: 'passed' });

    // Quick interface check
    try {
      const validatorModule = await import(pathToFileURL(filePath).href);
      const ValidatorClass = validatorModule.default;
      const validator = new ValidatorClass();
      
      await codeValidation.validateInterfaceCompliance(validator);
      quickResults.checks.push({ name: 'Interface', status: 'passed' });
      
    } catch (interfaceError) {
      quickResults.success = false;
      quickResults.errors.push(`Interface validation failed: ${interfaceError.message}`);
      quickResults.checks.push({ name: 'Interface', status: 'failed' });
    }

  } catch (error) {
    quickResults.success = false;
    quickResults.errors.push(`Quick validation failed: ${error.message}`);
  }

  return quickResults;
}

/**
 * Generate validation recommendations based on results
 */
function generateValidationRecommendations(validationResults) {
  const { phases, summary } = validationResults;
  
  // Success rate analysis
  const successRate = (summary.passedChecks / summary.totalChecks) * 100;
  
  if (successRate < 80) {
    validationResults.recommendations.push('Generated validator quality below recommended threshold (80%) - consider regeneration');
  }
  
  if (summary.warnings > 5) {
    validationResults.recommendations.push('High number of warnings - review generator template for improvements');
  }
  
  // Phase-specific recommendations
  if (phases.template && !phases.template.success) {
    validationResults.recommendations.push('Template processing issues detected - verify template variables and logic embedding');
  }
  
  if (phases.code && !phases.code.success) {
    validationResults.recommendations.push('Code quality issues detected - consider improving generator logic and error handling');
  }
  
  if (phases.sandbox && !phases.sandbox.success) {
    validationResults.recommendations.push('Sandbox execution issues detected - verify validator runtime compatibility');
  }
  
  // Performance recommendations
  if (phases.sandbox?.metrics?.performance?.executionTimeMs > 1000) {
    validationResults.recommendations.push('Validator execution time exceeds 1s - consider performance optimization');
  }
}

/**
 * Validation configuration for different use cases
 */
export const ValidationProfiles = {
  // Quick validation for development iteration
  DEVELOPMENT: {
    performSandboxTests: false,
    performSecurityValidation: false,
    validationThresholds: {
      successRate: 70
    }
  },
  
  // Standard validation for most cases
  STANDARD: {
    performSandboxTests: true,
    performSecurityValidation: true,
    validationThresholds: {
      successRate: 80,
      maxExecutionTime: 2000
    }
  },
  
  // Comprehensive validation for production
  PRODUCTION: {
    performSandboxTests: true,
    performSecurityValidation: true,
    validationThresholds: {
      successRate: 90,
      maxExecutionTime: 1000,
      maxWarnings: 3
    }
  }
};

/**
 * Export all validation functions for direct use
 */
export {
  templateValidation,
  codeValidation,
  sandboxValidation
};

export default {
  validateGeneratedValidator,
  quickValidateGenerator,
  ValidationProfiles,
  templateValidation,
  codeValidation,
  sandboxValidation
};
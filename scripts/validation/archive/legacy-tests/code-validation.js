/**
 * NewCategoryTests - Code Validation Functions
 * 
 * Extractable validation functions for agent use during ValidatorExtensionSequence.
 * Source: TEST-COVERAGE-HANDOFF.md Test 3 - Post-Generation Validation Pipeline
 * 
 * Purpose: Agent can use VALIDATIONS 2-3 to verify generated validator quality.
 * VALIDATION 1 (pre-generation risk detection) is NOT suitable as it tests the 
 * system's risk assessment, not the agent's generated code.
 * 
 * Usage: Suitable for agent self-validation of generated code quality and compliance.
 * 
 * Version: 1.0.0
 * Date: 2025-09-06
 */

import { execSync } from 'child_process';

/**
 * Validate generated code syntax
 * 
 * @param {string} filePath - Path to the generated validator file
 * @returns {object} Validation result with success status and message
 * @throws {Error} If syntax validation fails
 */
export async function validateGeneratedCodeSyntax(filePath) {
  try {
    execSync(`node --check "${filePath}"`, { timeout: 10000, stdio: 'ignore' });
    return { success: true, message: 'Generated code syntax is valid' };
  } catch (syntaxError) {
    throw new Error(`Generated code has syntax errors: ${syntaxError.message}`);
  }
}

/**
 * Validate IValidator interface compliance
 * 
 * @param {object} validatorInstance - Instance of the generated validator
 * @returns {object} Validation result with success status and message
 * @throws {Error} If interface compliance fails
 */
export async function validateInterfaceCompliance(validatorInstance) {
  // Check required IValidator interface methods and properties
  const requiredMethods = ['validate', 'getCapabilities', 'checkInterfaceCompliance', 'runSelfDiagnostics', 'getMetadata'];
  const requiredProperties = ['category', 'version', 'scopes'];
  
  for (const method of requiredMethods) {
    if (typeof validatorInstance[method] !== 'function') {
      throw new Error(`Generated validator missing required method: ${method}`);
    }
  }
  
  for (const property of requiredProperties) {
    if (!(property in validatorInstance)) {
      throw new Error(`Generated validator missing required property: ${property}`);
    }
  }
  
  // Test interface compliance method
  if (!validatorInstance.checkInterfaceCompliance()) {
    throw new Error('Generated validator reports non-compliant with IValidator interface');
  }
  
  return { success: true, message: 'Generated validator is interface compliant' };
}

/**
 * Validate security patterns in generated code
 * 
 * @param {object} codeAnalysis - Code analysis result containing security information
 * @returns {object} Validation result with success status and message
 * @throws {Error} If security issues are detected
 */
export async function validateSecurityPatterns(codeAnalysis) {
  if (codeAnalysis.securityIssues && codeAnalysis.securityIssues.length > 0) {
    throw new Error(`Security issues detected in generated code: ${codeAnalysis.securityIssues.join(', ')}`);
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = ['eval(', 'execSync(', 'spawn(', 'exec(', 'rm -rf', 'del /s'];
  const foundDangerous = dangerousPatterns.filter(pattern => 
    codeAnalysis.sourceCode && codeAnalysis.sourceCode.includes(pattern)
  );
  
  if (foundDangerous.length > 0) {
    throw new Error(`Dangerous patterns detected: ${foundDangerous.join(', ')}`);
  }
  
  return { success: true, message: 'No security issues detected in generated code' };
}

/**
 * Validate code quality metrics
 * 
 * @param {string} generatedContent - The generated validator code content
 * @returns {object} Validation result with quality metrics
 */
export async function validateCodeQuality(generatedContent) {
  const qualityMetrics = {
    success: true,
    metrics: {
      linesOfCode: 0,
      cyclomaticComplexity: 'basic',
      errorHandlingPresent: false,
      documentationPresent: false,
      testableDesign: false
    },
    issues: [],
    recommendations: []
  };

  try {
    // Basic metrics
    qualityMetrics.metrics.linesOfCode = generatedContent.split('\n').length;
    
    // Check for error handling
    qualityMetrics.metrics.errorHandlingPresent = generatedContent.includes('try') && generatedContent.includes('catch');
    
    // Check for documentation
    qualityMetrics.metrics.documentationPresent = generatedContent.includes('/**') || generatedContent.includes('//');
    
    // Check for testable design patterns
    qualityMetrics.metrics.testableDesign = generatedContent.includes('async ') && generatedContent.includes('return');
    
    // Quality recommendations
    if (!qualityMetrics.metrics.errorHandlingPresent) {
      qualityMetrics.recommendations.push('Consider adding try-catch blocks for error handling');
    }
    
    if (!qualityMetrics.metrics.documentationPresent) {
      qualityMetrics.recommendations.push('Consider adding JSDoc comments for better maintainability');
    }
    
    if (qualityMetrics.metrics.linesOfCode > 200) {
      qualityMetrics.recommendations.push('Consider breaking down large methods for better maintainability');
    }

  } catch (error) {
    qualityMetrics.success = false;
    qualityMetrics.issues.push(`Code quality analysis failed: ${error.message}`);
  }

  return qualityMetrics;
}

/**
 * Validate method signatures match expected patterns
 * 
 * @param {string} generatedContent - The generated validator code content
 * @param {object} expectedSignatures - Expected method signatures
 * @returns {object} Validation result with method signature compliance
 */
export async function validateMethodSignatures(generatedContent, expectedSignatures = {}) {
  const signatureValidation = {
    success: true,
    validatedMethods: [],
    issues: []
  };

  // Default expected signatures for IValidator interface
  const defaultSignatures = {
    validate: /async validate\s*\([^)]*projectInfo[^)]*scopeConfig[^)]*options[^)]*\)/,
    getCapabilities: /getCapabilities\s*\(\s*\)/,
    checkInterfaceCompliance: /checkInterfaceCompliance\s*\(\s*\)/,
    runSelfDiagnostics: /runSelfDiagnostics\s*\(\s*\)/,
    getMetadata: /getMetadata\s*\(\s*\)/
  };

  const signatures = { ...defaultSignatures, ...expectedSignatures };

  for (const [methodName, expectedPattern] of Object.entries(signatures)) {
    const found = expectedPattern.test(generatedContent);
    
    if (found) {
      signatureValidation.validatedMethods.push(methodName);
    } else {
      signatureValidation.success = false;
      signatureValidation.issues.push(`Method signature validation failed for: ${methodName}`);
    }
  }

  return signatureValidation;
}

/**
 * Complete code validation workflow
 * Validates all aspects of generated code quality and compliance
 * 
 * @param {string} filePath - Path to the generated validator file
 * @param {object} validatorInstance - Instance of the generated validator (optional)
 * @param {object} codeAnalysis - Code analysis result (optional)
 * @returns {object} Complete validation result
 */
export async function validateGeneratedCode(filePath, validatorInstance = null, codeAnalysis = null) {
  const validationResults = {
    success: true,
    checks: [],
    errors: [],
    warnings: [],
    metrics: {}
  };

  try {
    // Check 1: Syntax validation
    const syntaxResult = await validateGeneratedCodeSyntax(filePath);
    validationResults.checks.push({
      name: 'Syntax Validation',
      status: 'passed',
      message: syntaxResult.message
    });

    // Check 2: Interface compliance (if validator instance provided)
    if (validatorInstance) {
      const complianceResult = await validateInterfaceCompliance(validatorInstance);
      validationResults.checks.push({
        name: 'Interface Compliance',
        status: 'passed',
        message: complianceResult.message
      });
    }

    // Check 3: Security validation (if code analysis provided)
    if (codeAnalysis) {
      const securityResult = await validateSecurityPatterns(codeAnalysis);
      validationResults.checks.push({
        name: 'Security Patterns',
        status: 'passed',
        message: securityResult.message
      });
    }

    // Check 4: Code quality metrics
    if (filePath) {
      const fs = await import('fs');
      const generatedContent = fs.readFileSync(filePath, 'utf8');
      const qualityResult = await validateCodeQuality(generatedContent);
      
      validationResults.metrics = qualityResult.metrics;
      validationResults.checks.push({
        name: 'Code Quality',
        status: qualityResult.success ? 'passed' : 'warning',
        message: qualityResult.success ? 'Code quality metrics acceptable' : 'Code quality issues detected'
      });

      if (qualityResult.recommendations.length > 0) {
        validationResults.warnings.push(...qualityResult.recommendations);
      }
    }

  } catch (error) {
    validationResults.success = false;
    validationResults.errors.push(error.message);
    validationResults.checks.push({
      name: 'Code Validation',
      status: 'failed',
      message: error.message
    });
  }

  return validationResults;
}

export default {
  validateGeneratedCodeSyntax,
  validateInterfaceCompliance,
  validateSecurityPatterns,
  validateCodeQuality,
  validateMethodSignatures,
  validateGeneratedCode
};
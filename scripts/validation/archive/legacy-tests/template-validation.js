/**
 * NewCategoryTests - Template Validation Functions
 * 
 * Extractable validation functions for agent use during ValidatorExtensionSequence.
 * Source: TEST-COVERAGE-HANDOFF.md Test 2 - Template Variable Substitution Accuracy
 * 
 * Purpose: Agent can use these validation functions to verify the quality of 
 * its generated validators during the ValidatorExtensionSequence.
 * 
 * Usage: Highly suitable for agent self-validation of template processing.
 * 
 * Version: 1.0.0
 * Date: 2025-09-06
 */

/**
 * Validate that all template variables have been substituted
 * 
 * @param {string} generatedContent - The generated validator code content
 * @returns {object} Validation result with success status and message
 * @throws {Error} If unresolved template variables are found
 */
export async function validateTemplateVariableSubstitution(generatedContent) {
  const remainingVariables = generatedContent.match(/\{\{[A-Z_]+\}\}/g);
  if (remainingVariables && remainingVariables.length > 0) {
    throw new Error(`Unsubstituted template variables: ${remainingVariables.join(', ')}`);
  }
  return { success: true, message: 'All template variables substituted' };
}

/**
 * Validate that specific template substitutions were applied correctly
 * 
 * @param {string} generatedContent - The generated validator code content
 * @param {Array} expectedSubstitutions - Array of {variable, expected} objects
 * @returns {object} Validation result with success status and message
 * @throws {Error} If expected substitutions are not found
 */
export async function validateSpecificSubstitutions(generatedContent, expectedSubstitutions) {
  for (const substitution of expectedSubstitutions) {
    if (!generatedContent.includes(substitution.expected)) {
      throw new Error(`Template substitution failed for ${substitution.variable}: expected ${substitution.expected}`);
    }
  }
  return { success: true, message: 'All specific substitutions validated' };
}

/**
 * Validate that generated class follows naming convention
 * 
 * @param {string} generatedContent - The generated validator code content
 * @param {string} expectedClassName - Expected class name prefix (without 'Validator' suffix)
 * @returns {object} Validation result with success status and message
 * @throws {Error} If class naming convention is not followed
 */
export async function validateClassNaming(generatedContent, expectedClassName) {
  const classNameRegex = /export class (\w+)Validator/;
  const classNameMatch = generatedContent.match(classNameRegex);
  if (!classNameMatch || classNameMatch[1] !== expectedClassName) {
    throw new Error(`Generated class name does not follow naming convention: expected ${expectedClassName}Validator`);
  }
  return { success: true, message: 'Class naming convention validated' };
}

/**
 * Validate that validation logic was properly embedded in template
 * 
 * @param {string} generatedContent - The generated validator code content
 * @param {string} expectedLogic - Expected validation logic code
 * @returns {object} Validation result with success status and message
 * @throws {Error} If validation logic is not properly embedded
 */
export async function validateLogicEmbedding(generatedContent, expectedLogic) {
  if (!generatedContent.includes(expectedLogic)) {
    throw new Error('Validation logic was not properly embedded in template');
  }
  return { success: true, message: 'Validation logic embedding verified' };
}

/**
 * Complete template validation workflow
 * Validates all aspects of template processing for a generated validator
 * 
 * @param {string} generatedContent - The generated validator code content
 * @param {object} templateContext - Context used for template generation
 * @returns {object} Complete validation result
 */
export async function validateTemplateProcessing(generatedContent, templateContext) {
  const validationResults = {
    success: true,
    checks: [],
    errors: [],
    warnings: []
  };

  try {
    // Check 1: All template variables substituted
    const substitutionResult = await validateTemplateVariableSubstitution(generatedContent);
    validationResults.checks.push({
      name: 'Template Variable Substitution',
      status: 'passed',
      message: substitutionResult.message
    });

    // Check 2: Specific substitutions if context provided
    if (templateContext && templateContext.expectedSubstitutions) {
      const specificResult = await validateSpecificSubstitutions(
        generatedContent, 
        templateContext.expectedSubstitutions
      );
      validationResults.checks.push({
        name: 'Specific Substitutions',
        status: 'passed',
        message: specificResult.message
      });
    }

    // Check 3: Class naming convention if expected class name provided
    if (templateContext && templateContext.expectedClassName) {
      const classNameResult = await validateClassNaming(
        generatedContent,
        templateContext.expectedClassName
      );
      validationResults.checks.push({
        name: 'Class Naming Convention',
        status: 'passed',
        message: classNameResult.message
      });
    }

    // Check 4: Logic embedding if validation logic provided
    if (templateContext && templateContext.validationLogic) {
      const logicResult = await validateLogicEmbedding(
        generatedContent,
        templateContext.validationLogic
      );
      validationResults.checks.push({
        name: 'Logic Embedding',
        status: 'passed',
        message: logicResult.message
      });
    }

  } catch (error) {
    validationResults.success = false;
    validationResults.errors.push(error.message);
    validationResults.checks.push({
      name: 'Template Processing',
      status: 'failed',
      message: error.message
    });
  }

  return validationResults;
}

export default {
  validateTemplateVariableSubstitution,
  validateSpecificSubstitutions,
  validateClassNaming,
  validateLogicEmbedding,
  validateTemplateProcessing
};
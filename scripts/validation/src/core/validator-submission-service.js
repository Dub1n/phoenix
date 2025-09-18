import fs from 'fs';
import path from 'path';

// Coordinates the secure submission workflow for new validators
export class ValidatorSubmissionService {
  constructor(options) {
    const {
      validationPath,
      capabilityMatrixPath,
      rollbackManager,
      validatorValidationService,
      loadValidator,
      reloadCapabilityMatrix
    } = options;

    this.validationPath = validationPath;
    this.capabilityMatrixPath = capabilityMatrixPath;
    this.rollbackManager = rollbackManager;
    this.validatorValidationService = validatorValidationService;
    this.loadValidator = loadValidator;
    this.reloadCapabilityMatrix = reloadCapabilityMatrix;
  }

  async submitValidator({ validatorPath, category, scopeConfig, executeValidation }) {
    if (!fs.existsSync(validatorPath)) {
      throw new Error(`Validator file not found: ${validatorPath}`);
    }

    console.log(`[T] Processing agent-submitted validator for category: ${category}`);
    console.log('[~] Initiating Secure Integration Pipeline...');

    const riskAssessment = await this.validatorValidationService.assessSubmittedValidatorRisk(validatorPath, category);
    console.log(`   Risk Assessment: ${riskAssessment.riskLevel.toUpperCase()} risk approved for submitted code.`);

    const sandboxResult = await this.validatorValidationService.sandboxTestSubmittedValidator(validatorPath);
    if (!sandboxResult.passed) {
      throw new Error(`Sandbox Testing: FAILED. ${sandboxResult.errors.join(', ')}`);
    }
    console.log('   Sandbox Testing: PASSED. Validator is safe to execute.');

    const complianceResult = await this.validatorValidationService.validateSubmittedValidatorCompliance(validatorPath);
    if (!complianceResult.compliant) {
      throw new Error('Interface Compliance: FAILED. Validator does not meet IValidator contract.');
    }
    console.log('   Interface Compliance: PASSED. Validator meets IValidator contract.');

    await this.integrateSubmittedValidator(validatorPath, category);
    console.log(`   Integration Complete: '${category}' validator registered.`);

    let integrationResult = null;
    if (typeof executeValidation === 'function') {
      integrationResult = await executeValidation(scopeConfig || {});
    }

    return {
      success: true,
      category,
      validatorPath,
      riskAssessment,
      integrationResult
    };
  }

  async integrateSubmittedValidator(validatorPath, category) {
    const fileName = `${category}-validator.js`;
    const targetPath = path.join(this.validationPath, 'src/validators', fileName);

    if (fs.existsSync(targetPath)) {
      await this.rollbackManager.createBackup(category);
    }

    fs.copyFileSync(validatorPath, targetPath);
    await this.updateCapabilityMatrixForSubmittedValidator(category, fileName);

    if (typeof this.reloadCapabilityMatrix === 'function') {
      await this.reloadCapabilityMatrix();
    }

    if (typeof this.loadValidator === 'function') {
      await this.loadValidator(category);
    }
  }

  async updateCapabilityMatrixForSubmittedValidator(category, fileName) {
    let matrix = {};
    if (fs.existsSync(this.capabilityMatrixPath)) {
      matrix = JSON.parse(fs.readFileSync(this.capabilityMatrixPath, 'utf8'));
    }

    matrix.categories = matrix.categories || {};
    matrix.categories[category] = {
      scopes: ['**/*'],
      validator: fileName,
      description: `${category} validation - Agent submitted`,
      interfaceVersion: '3.0.0',
      capabilities: {
        supportedProjects: ['*'],
        performanceProfile: 'standard',
        requiredDependencies: ['node', 'npm']
      },
      safety: {
        lastValidated: new Date().toISOString(),
        complianceStatus: 'verified',
        submittedBy: 'agent',
        submittedAt: new Date().toISOString()
      }
    };

    matrix.metadata = matrix.metadata || {};
    matrix.metadata.lastUpdated = new Date().toISOString();
    matrix.metadata.totalAgentSubmissions = (matrix.metadata.totalAgentSubmissions || 0) + 1;

    fs.writeFileSync(this.capabilityMatrixPath, JSON.stringify(matrix, null, 2), 'utf8');
  }
}

/**
 * Safety Interface - Contracts for Safety Framework
 * 
 * This interface defines the contracts for the comprehensive safety framework
 * that ensures secure and reliable validator extensions.
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 */

import { ExtensionRequest, ExtensionPlan, ExtensionValidationResult } from './extension-interface.js';
import { IValidator } from './validator-interface.js';

/**
 * Safety assessment result
 */
export interface SafetyAssessment {
  approved: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }>;
  recommendations: string[];
  requiredActions: string[];
}

/**
 * Pre-generation validation details
 */
export interface PreGenerationValidation {
  approved: boolean;
  plan: ExtensionPlan;
  safetyAssessment: SafetyAssessment;
  checks: Array<{
    name: string;
    passed: boolean;
    required: boolean;
    message?: string;
  }>;
  reason?: string;
}

/**
 * Post-generation validation details
 */
export interface PostGenerationValidation {
  approved: boolean;
  filePath: string;
  safetyAssessment: SafetyAssessment;
  codeAnalysis: {
    syntaxValid: boolean;
    interfaceCompliant: boolean;
    securityIssues: string[];
    qualityScore: number;
  };
  reason?: string;
}

/**
 * Sandbox testing result
 */
export interface SandboxTestResult {
  passed: boolean;
  executionTime: number;
  memoryUsage: number;
  errors: string[];
  warnings: string[];
  testCoverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  performanceMetrics: {
    averageExecutionTime: number;
    memoryEfficiency: number;
    resourceUsage: number;
  };
}

/**
 * Rollback details
 */
export interface RollbackResult {
  success: boolean;
  filesRemoved: string[];
  registryUpdated: boolean;
  backupRestored: boolean;
  error?: string;
}

/**
 * Interface compliance check result
 */
export interface ComplianceCheckResult {
  compliant: boolean;
  interfaceVersion: string;
  missingMethods: string[];
  incorrectSignatures: string[];
  additionalMethods: string[];
  score: number; // 0-100
}

/**
 * Interface for pre-generation validators
 */
export interface IPreGenerationValidator {
  validateRequest(request: ExtensionRequest): Promise<ExtensionValidationResult>;
  assessRisk(request: ExtensionRequest): Promise<SafetyAssessment>;
  createPlan(request: ExtensionRequest): Promise<ExtensionPlan>;
  validatePlan(plan: ExtensionPlan): Promise<PreGenerationValidation>;
}

/**
 * Interface for post-generation validators
 */
export interface IPostGenerationValidator {
  validateGeneratedCode(filePath: string): Promise<PostGenerationValidation>;
  checkCodeQuality(filePath: string): Promise<number>;
  analyzeSecurityIssues(filePath: string): Promise<string[]>;
  validateInterfaceCompliance(filePath: string): Promise<ComplianceCheckResult>;
}

/**
 * Interface for sandbox testers
 */
export interface ISandboxTester {
  testInSandbox(filePath: string): Promise<SandboxTestResult>;
  createSandboxEnvironment(): Promise<string>;
  cleanupSandbox(sandboxPath: string): Promise<void>;
  validateExecution(validator: IValidator): Promise<boolean>;
}

/**
 * Interface for rollback managers
 */
export interface IRollbackManager {
  createBackup(category: string): Promise<string>;
  rollbackExtension(category: string): Promise<RollbackResult>;
  restoreFromBackup(backupPath: string): Promise<boolean>;
  validateRollback(category: string): Promise<boolean>;
}

/**
 * Interface for interface compliance checkers
 */
export interface IComplianceChecker {
  checkCompliance(validator: IValidator): Promise<ComplianceCheckResult>;
  validateInterface(filePath: string): Promise<ComplianceCheckResult>;
  getRequiredMethods(): string[];
  validateMethodSignatures(validator: IValidator): Promise<string[]>;
}

/**
 * Interface for the main safety framework
 */
export interface ISafetyFramework {
  // Risk assessment
  assessExtensionRisk(reasons: string[]): Promise<SafetyAssessment>;
  
  // Pre-generation validation
  preExtensionValidation(request: {
    category: string;
    requirements: string[];
    recommendations: string[];
  }): Promise<PreGenerationValidation>;
  
  // Post-generation validation
  postGenerationValidation(filePath: string): Promise<PostGenerationValidation>;
  
  // Sandbox testing
  sandboxTest(filePath: string): Promise<SandboxTestResult>;
  
  // Rollback management
  rollbackExtension(extensionResult: any): Promise<RollbackResult>;
  
  // Template selection
  selectTemplate(plan: ExtensionPlan): Promise<{ selected: string }>;
  
  // Validator validation
  validateLoadedValidator(validator: any): Promise<{
    isValid: boolean;
    reason?: string;
  }>;
}

/**
 * Safety configuration
 */
export interface SafetyConfig {
  safetyLevel: 'basic' | 'enhanced' | 'maximum';
  preValidationRequired: boolean;
  postValidationRequired: boolean;
  sandboxTestingRequired: boolean;
  rollbackEnabled: boolean;
  humanReviewRequired: boolean;
  maxRiskLevel: 'low' | 'medium' | 'high';
  qualityThreshold: number; // 0-100
  performanceThreshold: number; // milliseconds
}
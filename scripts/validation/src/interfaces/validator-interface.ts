/**
 * Core Validator Interface - Strict Contract for All Validators
 * 
 * This interface defines the mandatory contract that all validators must implement
 * to ensure compatibility with the enhanced validation framework.
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 */

/**
 * Project information passed to validators
 */
export interface ProjectInfo {
  name: string;
  path: string;
  packageJson: any;
  srcPath: string;
  hasSrc: boolean;
  hasTypeScript: boolean;
  buildCommand: string;
  lintCommand: string;
}

/**
 * Scope configuration for targeted validation
 */
export interface ScopeConfig {
  type: 'full-project' | 'scoped' | 'files' | 'directories';
  scope?: string;
  description: string;
  patterns: string[];
  isFullProject: boolean;
  fileCount?: number;
}

/**
 * Validation options and flags
 */
export interface ValidationOptions {
  enableLint?: boolean;
  save?: boolean;
  taskId?: string | null;
  timeout?: number;
  maxBuffer?: number;
  [key: string]: any;
}

/**
 * Individual test result
 */
export interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  message: string;
  duration?: number;
  command?: string;
  output?: string;
  error?: string | string[];
  evidence?: string[];
  warnings?: string[];
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  status: 'PASS' | 'FAIL' | 'WARN';
  tests: TestResult[];
  duration: number;
  evidence: string[];
  errors?: string[];
  warnings?: string[];
}

/**
 * Validator capabilities metadata
 */
export interface ValidatorCapabilities {
  supportedProjects: string[];
  supportedScopes: string[];
  requiredDependencies: string[];
  performanceProfile: 'fast' | 'standard' | 'comprehensive';
}

/**
 * Diagnostic result for self-validation
 */
export interface DiagnosticResult {
  status: 'healthy' | 'warning' | 'error';
  checks: Array<{
    name: string;
    status: boolean;
    message?: string;
  }>;
  timestamp: string;
}

/**
 * Validator metadata
 */
export interface ValidatorMetadata {
  category: string;
  version: string;
  generated: boolean;
  generatedAt?: string;
  template?: string;
  templateVersion?: string;
  interfaceVersion: string;
}

/**
 * Core validator interface that all validators must implement
 */
export interface IValidator {
  // Basic properties
  category: string;
  version: string;
  scopes: string[];
  
  // Core validation methods
  validate(
    projectInfo: ProjectInfo, 
    scopeConfig: ScopeConfig, 
    options: ValidationOptions
  ): Promise<ValidationResult>;
  
  getCapabilities(): ValidatorCapabilities;
  
  // Safety compliance methods
  checkInterfaceCompliance(): boolean;
  runSelfDiagnostics(): DiagnosticResult;
  
  // Metadata methods
  getMetadata(): ValidatorMetadata;
  
  // Optional cleanup method
  cleanup?(): Promise<void>;
}

/**
 * Extended interface for validators that support integration testing
 */
export interface IIntegratedValidator extends IValidator {
  hasIntegrationTests: boolean;
  runIntegrationTests?(
    projectInfo: ProjectInfo,
    scopeConfig: ScopeConfig,
    options: ValidationOptions
  ): Promise<ValidationResult>;
}

/**
 * Interface for validators that can be generated from templates
 */
export interface IGeneratedValidator extends IValidator {
  generated: true;
  templateUsed: string;
  generatedAt: string;
  validateTemplate(): boolean;
}
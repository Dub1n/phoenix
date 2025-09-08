/**
 * Core IValidator interface that all validators must implement
 * Version: 3.0.0
 * Created: 2025-09-06 for TASK-VAL-004
 */

import { ProjectInfo, ScopeConfig, ValidationOptions } from './types.js';

export interface IValidator {
  // Required properties
  category: string;
  version: string;
  scopes: string[];
  
  // Core validation method
  validate(
    projectInfo: ProjectInfo, 
    scopeConfig: ScopeConfig, 
    options?: ValidationOptions
  ): Promise<ValidationResult>;
  
  // Capability and metadata methods
  getCapabilities(): ValidatorCapabilities;
  getMetadata(): ValidatorMetadata;
  
  // Safety compliance methods
  checkInterfaceCompliance(): boolean;
  runSelfDiagnostics(): DiagnosticResult;
}

export interface ValidationResult {
  status: 'PASS' | 'FAIL' | 'WARN';
  tests: TestResult[];
  duration: number;
  evidence: string[];
  errors?: string[];
  warnings?: string[];
  recommendations?: string[];
}

export interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message?: string;
  details?: any;
  duration?: number;
}

export interface ValidatorCapabilities {
  supportedProjects: string[];
  supportedScopes: string[];
  requiredDependencies: string[];
  performanceProfile: 'fast' | 'standard' | 'comprehensive';
  hasIntegrationTests: boolean;
  supportsRollback: boolean;
}

export interface ValidatorMetadata {
  category: string;
  version: string;
  interfaceVersion: string;
  generated: boolean;
  generatedAt?: string;
  template?: string;
  author: string;
  description: string;
  lastValidated: string;
}

export interface DiagnosticResult {
  status: 'HEALTHY' | 'WARNING' | 'ERROR';
  checks: DiagnosticCheck[];
  recommendations?: string[];
  systemInfo?: any;
}

export interface DiagnosticCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}
/**
 * Extension system interfaces
 * Version: 3.0.0
 * Created: 2025-09-06 for TASK-VAL-004
 */

import { ValidationResult, ValidatorCapabilities } from './validator-interface';

export interface IExtensionGenerator {
  generateExtension(requirements: ExtensionRequirements): Promise<ExtensionResult>;
  validateGeneration(filePath: string): Promise<ValidationResult>;
  rollbackExtension(extensionId: string): Promise<RollbackResult>;
}

export interface ExtensionRequirements {
  category: string;
  description: string;
  scopePatterns: string[];
  supportedProjects: string[];
  performanceProfile: 'fast' | 'standard' | 'comprehensive';
  validationLogic?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  taskId?: string;
  author?: string;
}

export interface ExtensionResult {
  success: boolean;
  extensionId: string;
  filePath: string;
  capabilities: ValidatorCapabilities;
  qualityScore: number;
  safetyReport: SafetyReport;
  error?: string;
  warnings?: string[];
  generatedAt: string;
  template?: string;
}

export interface SafetyReport {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  safetyChecks: SafetyCheck[];
  approved: boolean;
  humanReviewRequired: boolean;
  restrictions?: string[];
}

export interface SafetyCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
}

export interface RollbackResult {
  success: boolean;
  extensionId: string;
  backupId?: string;
  error?: string;
  restoredFiles?: string[];
  timestamp: string;
}
/**
 * Safety framework interfaces
 * Version: 3.0.0
 * Created: 2025-09-06 for TASK-VAL-004
 */

import { IValidator } from './validator-interface';
import { ExtensionRequirements, RollbackResult } from './extension-interface';

export interface ISafetyFramework {
  assessRisk(requirements: ExtensionRequirements): Promise<RiskAssessment>;
  validateCompliance(validator: IValidator): Promise<ComplianceResult>;
  createBackup(identifier: string): Promise<BackupResult>;
  rollback(backupId: string): Promise<RollbackResult>;
  scanSecurity(filePath: string): Promise<SecurityScanResult>;
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: RiskFactor[];
  approved: boolean;
  humanReviewRequired: boolean;
  recommendations: string[];
  timestamp: string;
}

export interface RiskFactor {
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  mitigation?: string;
}

export interface ComplianceResult {
  compliant: boolean;
  score: number;
  interfaceVersion: string;
  missingMethods: string[];
  missingProperties: string[];
  details: ComplianceDetail[];
  timestamp: string;
}

export interface ComplianceDetail {
  type: 'method' | 'property' | 'structure';
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  expected?: any;
  actual?: any;
  message?: string;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  backupPath: string;
  files: string[];
  error?: string;
  timestamp: string;
  metadata?: BackupMetadata;
}

export interface BackupMetadata {
  reason: string;
  category?: string;
  projectPath?: string;
  taskId?: string;
  checksum?: string;
}

export interface SecurityScanResult {
  secure: boolean;
  score: number;
  vulnerabilities: SecurityVulnerability[];
  warnings: SecurityWarning[];
  timestamp: string;
}

export interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  remediation?: string;
}

export interface SecurityWarning {
  type: string;
  message: string;
  location?: string;
  suggestion?: string;
}
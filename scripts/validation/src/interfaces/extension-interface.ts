/**
 * Extension Interface - Contracts for Extension Management
 * 
 * This interface defines the contracts for managing validator extensions,
 * including metadata, generation details, and lifecycle management.
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 */

/**
 * Extension generation request
 */
export interface ExtensionRequest {
  category: string;
  requirements: string[];
  recommendations: string[];
  scopePatterns: string[];
  validationLogic: string;
  supportedProjects: string[];
  performanceProfile?: 'fast' | 'standard' | 'comprehensive';
}

/**
 * Extension generation plan
 */
export interface ExtensionPlan {
  category: string;
  template: string;
  scopePatterns: string[];
  validationLogic: string;
  supportedProjects: string[];
  performanceProfile: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigations: string[];
  };
}

/**
 * Extension generation result
 */
export interface ExtensionResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  capabilities?: any;
  template?: string;
  error?: string;
}

/**
 * Extension metadata
 */
export interface ExtensionMetadata {
  category: string;
  generatedAt: string;
  generatedBy: string;
  template: string;
  templateVersion: string;
  interfaceVersion: string;
  validationResults: {
    preGeneration: ExtensionValidationResult;
    postGeneration: ExtensionValidationResult;
    sandboxTesting: ExtensionValidationResult;
  };
  qualityMetrics: {
    testCoverage: number;
    codeQuality: number;
    performanceScore: number;
    safetyScore: number;
  };
}

/**
 * Extension validation result
 */
export interface ExtensionValidationResult {
  approved: boolean;
  score: number;
  reason?: string;
  checks: Array<{
    name: string;
    passed: boolean;
    message?: string;
  }>;
  timestamp: string;
}

/**
 * Extension registry entry
 */
export interface ExtensionRegistryEntry {
  category: string;
  validator: string;
  status: 'active' | 'deprecated' | 'failed';
  generatedAt: string;
  lastValidated: string;
  qualityScore: number;
  usageCount: number;
  metadata: ExtensionMetadata;
}

/**
 * Extension history entry
 */
export interface ExtensionHistoryEntry {
  timestamp: string;
  action: 'generated' | 'validated' | 'activated' | 'deprecated' | 'removed';
  category: string;
  details: {
    request?: ExtensionRequest;
    result?: ExtensionResult;
    validationResults?: any;
    reason?: string;
  };
  success: boolean;
}

/**
 * Interface for extension generators
 */
export interface IExtensionGenerator {
  generateValidator(plan: ExtensionPlan): Promise<ExtensionResult>;
  validateTemplate(templatePath: string): Promise<boolean>;
  selectTemplate(plan: ExtensionPlan): Promise<string>;
}

/**
 * Interface for extension managers
 */
export interface IExtensionManager {
  createExtension(request: ExtensionRequest): Promise<ExtensionResult>;
  validateExtension(filePath: string): Promise<ExtensionValidationResult>;
  registerExtension(metadata: ExtensionMetadata): Promise<boolean>;
  rollbackExtension(category: string): Promise<boolean>;
  getExtensionHistory(): Promise<ExtensionHistoryEntry[]>;
  getActiveExtensions(): Promise<ExtensionRegistryEntry[]>;
}
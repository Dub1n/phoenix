# Phase 5: Configuration Management Extension

## High-Level Goal

Extend existing Phoenix-Code-Lite configuration management system to support QMS templates, regulatory procedures, and dynamic compliance settings while maintaining complete backward compatibility with existing configurations.

## Detailed Context and Rationale

### Why This Phase Exists

Medical device software requires sophisticated configuration management that supports regulatory templates, compliance procedures, and dynamic updates for changing regulatory standards. This phase transforms Phoenix-Code-Lite's existing configuration system into a comprehensive QMS configuration framework while preserving all existing functionality and patterns.

### Technical Justification

From the QMS Infrastructure specifications:
> "Configuration management system enhanced with QMS template support, regulatory compliance settings, dynamic configuration updates for evolving standards, and seamless integration with existing Phoenix-Code-Lite configuration patterns. All configuration changes must be traceable, validated, and auditable according to regulatory requirements."

This phase implements the regulatory requirement for configuration management as specified in EN 62304 Section 5.5 and AAMI TIR45 guidance on configuration control in agile development. The enhanced configuration framework ensures that all QMS settings, templates, and procedures are properly managed, versioned, and auditable.

### Architecture Integration

This phase implements critical QMS configuration and template management quality gates:

- **Configuration Quality Gates**: Template validation, schema compliance, backward compatibility verification
- **Security Quality Gates**: Secure configuration storage, role-based configuration access, audit trail for changes
- **Compliance Quality Gates**: Regulatory template validation, compliance setting enforcement, change approval workflows
- **Integration Quality Gates**: Seamless integration with existing configurations, API compatibility, migration support

## Prerequisites & Verification

### Prerequisites from Phase 4

- **Enhanced Security Framework Operational** - Cryptographic audit trails, role-based access control, and data encryption fully implemented
- **Regulatory Compliance Tracking Active** - Compliance event tracking and audit capabilities operational and tested
- **Existing Functionality Preserved** - All Phoenix-Code-Lite security and audit functionality maintained with backward compatibility
- **Security Integration Complete** - Security enhancements seamlessly integrated with existing TDD workflow orchestration
- **Performance Benchmarks Met** - Security enhancements operating within acceptable performance parameters

### Validation Commands

> ```bash
> # Verify Phase 4 deliverables
> npm test                                    # Should show comprehensive security coverage
> npm run security:validate                  # Security system validation
> npm run build                               # Clean compilation
> 
> # Configuration management tooling
> npm install --save-dev ajv                 # JSON schema validation
> npm install --save-dev js-yaml             # YAML configuration support
> npm install --save-dev semver              # Version management
> npm install --save-dev deepmerge           # Configuration merging
> ```

### Expected Results

- All Phase 4 security enhancements operational (no regression)
- Security validation tests passing with comprehensive coverage
- Build completes without errors or configuration warnings
- Configuration enhancement dependencies installed and configured
- Existing configuration loading operational and ready for extension

## Step 0: Changes Needed

### Preparation and Adjustments

- **Configuration System Review**: Review the existing configuration system for extensibility.
- **QMS Configuration Schema**: Develop a schema for QMS-specific configuration settings.

### Task Adjustments

- **Extend Configuration Management**: Plan for the extension of configuration management to support QMS templates and settings.
- **Backward Compatibility Assurance**: Ensure backward compatibility with existing configuration files.
- **Configuration Testing**: Implement tests to validate new configuration settings and templates.

## Step-by-Step Implementation Guide

*Reference: Follow established security patterns from `QMS-Refactoring-Guide.md` for configuration validation*

### 1. Test-Driven Development (TDD) First - "Configuration Management Extension Validation Tests"

**Test Name**: "QMS Configuration Management System Comprehensive Validation"

Create comprehensive test suites for enhanced configuration management capabilities:

```typescript
// tests/config/configuration-management-extension.test.ts

describe('Configuration Management Extension Validation', () => {
  describe('QMS Template Management Tests', () => {
    test('should support QMS regulatory templates with validation', async () => {
      const configManager = new QMSConfigManager();
      
      // Test EN 62304 template loading
      const en62304Template = await configManager.loadTemplate('EN62304', 'Class-B');
      expect(en62304Template).toBeDefined();
      expect(en62304Template.standard).toBe('EN62304');
      expect(en62304Template.classification).toBe('Class-B');
      expect(en62304Template.requirements).toBeDefined();
      expect(en62304Template.requirements.length).toBeGreaterThan(0);
      
      // Test AAMI TIR45 template loading
      const aamiTemplate = await configManager.loadTemplate('AAMI-TIR45', 'agile');
      expect(aamiTemplate).toBeDefined();
      expect(aamiTemplate.standard).toBe('AAMI-TIR45');
      expect(aamiTemplate.methodology).toBe('agile');
      
      // Test template validation
      const isValid = await configManager.validateTemplate(en62304Template);
      expect(isValid).toBe(true);
    });
    
    test('should support dynamic template updates with version control', async () => {
      const templateManager = new QMSTemplateManager();
      
      // Test template versioning
      const currentVersion = await templateManager.getCurrentTemplateVersion('EN62304');
      expect(currentVersion).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning
      
      // Test template update capability
      const updateResult = await templateManager.updateTemplate('EN62304', {
        version: '2.1.0',
        requirements: [
          { id: 'EN62304-5.1.1', description: 'Software development planning' },
          { id: 'EN62304-5.1.2', description: 'Software development plan creation' }
        ]
      });
      
      expect(updateResult.success).toBe(true);
      expect(updateResult.previousVersion).toBe(currentVersion);
      expect(updateResult.newVersion).toBe('2.1.0');
    });
  });
  
  describe('Configuration Schema Extension Tests', () => {
    test('should extend existing configuration schema with QMS settings', async () => {
      const configManager = new QMSConfigManager();
      
      // Test loading existing configuration
      const existingConfig = await configManager.loadConfiguration();
      expect(existingConfig.claude).toBeDefined(); // Existing Phoenix-Code-Lite settings
      expect(existingConfig.tdd).toBeDefined();
      
      // Test QMS extension
      expect(existingConfig.qms).toBeDefined();
      expect(existingConfig.qms.templates).toBeInstanceOf(Array);
      expect(existingConfig.qms.compliance).toBeDefined();
      expect(existingConfig.qms.security).toBeDefined();
      
      // Test schema validation
      const validation = await configManager.validateConfiguration(existingConfig);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
    
    test('should maintain backward compatibility with existing configurations', async () => {
      const legacyConfigManager = new ConfigManager(); // Existing
      const qmsConfigManager = new QMSConfigManager(); // Enhanced
      
      // Test that existing config loading still works
      const legacyConfig = legacyConfigManager.loadConfiguration();
      expect(legacyConfig).toBeDefined();
      
      // Test that enhanced manager can load existing configurations
      const enhancedConfig = await qmsConfigManager.loadConfiguration();
      expect(enhancedConfig.claude).toEqual(legacyConfig.claude);
      expect(enhancedConfig.tdd).toEqual(legacyConfig.tdd);
      
      // Test migration capability
      const migratedConfig = await qmsConfigManager.migrateConfiguration(legacyConfig);
      expect(migratedConfig.qms).toBeDefined();
      expect(migratedConfig.claude).toEqual(legacyConfig.claude);
    });
  });
  
  describe('Configuration Security Integration Tests', () => {
    test('should integrate with role-based security for configuration access', async () => {
      const securityManager = new QMSSecurityManager();
      const configManager = new QMSConfigManager();
      
      // Test role-based configuration access
      const analystUser = { id: 'user-001', roles: ['qms_analyst'] };
      const adminUser = { id: 'user-002', roles: ['qms_administrator'] };
      
      // Analyst should have read-only access
      const canAnalystRead = await securityManager.hasPermission(analystUser, 'manage_configurations');
      expect(canAnalystRead).toBe(false);
      
      // Administrator should have full access
      const canAdminManage = await securityManager.hasPermission(adminUser, 'manage_configurations');
      expect(canAdminManage).toBe(true);
      
      // Test secure configuration updates
      const updateResult = await configManager.updateConfiguration(
        { qms: { templates: ['EN62304'] } },
        adminUser
      );
      expect(updateResult.success).toBe(true);
      expect(updateResult.auditRecord).toBeDefined();
    });
  });
});

describe('Template Processing and Validation Tests', () => {
  describe('Regulatory Template Processing', () => {
    test('should process and validate regulatory templates correctly', async () => {
      const templateProcessor = new RegulatoryTemplateProcessor();
      
      // Test EN 62304 template processing
      const en62304Template = {
        standard: 'EN62304',
        version: '2.1',
        classification: 'Class-B',
        requirements: [
          {
            id: 'EN62304-5.1.1',
            title: 'Software development planning',
            description: 'The software development process shall be planned',
            category: 'planning',
            mandatory: true
          }
        ],
        procedures: [
          {
            id: 'PROC-001',
            title: 'Software Development Plan Creation',
            steps: ['Define software requirements', 'Create development plan', 'Review and approve']
          }
        ]
      };
      
      const processedTemplate = await templateProcessor.processTemplate(en62304Template);
      expect(processedTemplate.valid).toBe(true);
      expect(processedTemplate.requirements).toHaveLength(1);
      expect(processedTemplate.procedures).toHaveLength(1);
      expect(processedTemplate.checksum).toBeDefined();
      
      // Test template requirement extraction
      const requirements = await templateProcessor.extractRequirements(processedTemplate);
      expect(requirements).toContainEqual(
        expect.objectContaining({
          id: 'EN62304-5.1.1',
          mandatory: true,
          category: 'planning'
        })
      );
    });
  });
  
  describe('Configuration Merging and Inheritance', () => {
    test('should support configuration inheritance and merging', async () => {
      const configManager = new QMSConfigManager();
      
      // Base configuration
      const baseConfig = {
        qms: {
          templates: ['EN62304'],
          compliance: { level: 'strict' },
          audit: { enabled: true }
        }
      };
      
      // Environment-specific configuration
      const devConfig = {
        qms: {
          compliance: { level: 'development' },
          audit: { logLevel: 'debug' }
        }
      };
      
      // Test configuration merging
      const mergedConfig = await configManager.mergeConfigurations([baseConfig, devConfig]);
      expect(mergedConfig.qms.templates).toEqual(['EN62304']); // From base
      expect(mergedConfig.qms.compliance.level).toBe('development'); // Override from dev
      expect(mergedConfig.qms.audit.enabled).toBe(true); // From base
      expect(mergedConfig.qms.audit.logLevel).toBe('debug'); // From dev
    });
  });
});

describe('Configuration Management Integration Tests', () => {
  test('should maintain existing Phoenix-Code-Lite configuration functionality', async () => {
    const existingConfigManager = new ConfigManager();
    const enhancedConfigManager = new QMSConfigManager();
    
    // Test existing configuration loading
    const existingConfig = existingConfigManager.loadConfiguration();
    expect(existingConfig.claude).toBeDefined();
    expect(existingConfig.tdd).toBeDefined();
    
    // Test enhanced configuration loading with backward compatibility
    const enhancedConfig = await enhancedConfigManager.loadConfiguration();
    expect(enhancedConfig.claude).toEqual(existingConfig.claude);
    expect(enhancedConfig.tdd).toEqual(existingConfig.tdd);
    expect(enhancedConfig.qms).toBeDefined();
    
    // Test that existing validation still works
    const existingValidation = existingConfigManager.validateConfiguration(existingConfig);
    expect(existingValidation.valid).toBe(true);
    
    const enhancedValidation = await enhancedConfigManager.validateConfiguration(enhancedConfig);
    expect(enhancedValidation.valid).toBe(true);
  });
});
```

### 2. QMS Configuration Schema Extension

Extend existing configuration schema to support QMS requirements:

```typescript
// src/config/qms-config-schema.ts

import { z } from 'zod';

// Existing schemas (imported)
const ExistingClaudeConfigSchema = z.object({
  apiKey: z.string().optional(),
  maxTokens: z.number().optional(),
  model: z.string().optional()
});

const ExistingTDDConfigSchema = z.object({
  maxTurns: z.number().min(1).max(10).default(3),
  qualityGates: z.object({
    syntax: z.boolean().default(true),
    type: z.boolean().default(true),
    lint: z.boolean().default(true),
    security: z.boolean().default(true)
  }).default({})
});

// New QMS configuration schemas
const QMSTemplateConfigSchema = z.object({
  standard: z.enum(['EN62304', 'AAMI-TIR45', 'ISO14971']),
  version: z.string(),
  classification: z.string().optional(),
  enabled: z.boolean().default(true),
  settings: z.record(z.any()).optional()
});

const QMSComplianceConfigSchema = z.object({
  level: z.enum(['strict', 'standard', 'development']).default('standard'),
  auditRequired: z.boolean().default(true),
  digitalSignatures: z.boolean().default(true),
  immutableRecords: z.boolean().default(true),
  encryptionRequired: z.boolean().default(true)
});

const QMSSecurityConfigSchema = z.object({
  roleBasedAccess: z.boolean().default(true),
  auditLogging: z.boolean().default(true),
  dataEncryption: z.boolean().default(true),
  accessControlLevel: z.enum(['basic', 'enhanced', 'strict']).default('enhanced')
});

const QMSDocumentProcessingConfigSchema = z.object({
  maxFileSize: z.number().default(50 * 1024 * 1024), // 50MB
  supportedFormats: z.array(z.string()).default(['pdf', 'docx', 'md']),
  processingTimeout: z.number().default(300000), // 5 minutes
  extractionStrategies: z.array(z.string()).default(['text', 'structure', 'references'])
});

const QMSWorkflowConfigSchema = z.object({
  phases: z.array(z.string()).default(['analysis', 'validation', 'reporting']),
  qualityGates: z.object({
    documentProcessing: z.boolean().default(true),
    complianceValidation: z.boolean().default(true),
    auditTrail: z.boolean().default(true),
    reportGeneration: z.boolean().default(true)
  }).default({}),
  timeouts: z.object({
    analysis: z.number().default(600000), // 10 minutes
    validation: z.number().default(300000), // 5 minutes
    reporting: z.number().default(180000) // 3 minutes
  }).default({})
});

// Enhanced configuration schema
export const QMSConfigurationSchema = z.object({
  // Existing Phoenix-Code-Lite configuration (preserved)
  claude: ExistingClaudeConfigSchema.optional(),
  tdd: ExistingTDDConfigSchema.optional(),
  
  // New QMS configuration
  qms: z.object({
    templates: z.array(QMSTemplateConfigSchema).default([]),
    compliance: QMSComplianceConfigSchema.default({}),
    security: QMSSecurityConfigSchema.default({}),
    documentProcessing: QMSDocumentProcessingConfigSchema.default({}),
    workflow: QMSWorkflowConfigSchema.default({})
  }).default({})
});

export type QMSConfiguration = z.infer<typeof QMSConfigurationSchema>;
export type QMSTemplateConfig = z.infer<typeof QMSTemplateConfigSchema>;
export type QMSComplianceConfig = z.infer<typeof QMSComplianceConfigSchema>;

// Configuration validation helper
export class ConfigurationValidator {
  static validateQMSConfiguration(config: unknown): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    try {
      QMSConfigurationSchema.parse(config);
      return { valid: true, errors: [], warnings: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: []
        };
      }
      return {
        valid: false,
        errors: ['Unknown validation error'],
        warnings: []
      };
    }
  }
  
  static validateBackwardCompatibility(config: unknown): boolean {
    try {
      const parsed = QMSConfigurationSchema.parse(config);
      
      // Verify essential existing fields are preserved
      if (parsed.claude || parsed.tdd) {
        return true;
      }
      
      // Allow QMS-only configurations
      return parsed.qms !== undefined;
    } catch {
      return false;
    }
  }
}
```

### 3. Enhanced Configuration Manager Implementation

Create enhanced configuration manager with QMS support:

```typescript
// src/config/qms-config-manager.ts

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import semver from 'semver';
import merge from 'deepmerge';
import { QMSConfiguration, QMSConfigurationSchema, ConfigurationValidator } from './qms-config-schema';
import { ConfigManager } from './settings'; // Existing
import { ComplianceAuditLogger } from '../security/compliance-audit-logger';
import { QMSSecurityManager } from '../security/qms-security-manager';

export class QMSConfigManager extends ConfigManager {
  private auditLogger: ComplianceAuditLogger;
  private securityManager: QMSSecurityManager;
  private configCache: Map<string, QMSConfiguration> = new Map();
  
  constructor() {
    super();
    this.auditLogger = new ComplianceAuditLogger();
    this.securityManager = new QMSSecurityManager();
  }
  
  async loadConfiguration(configPath?: string): Promise<QMSConfiguration> {
    const cacheKey = configPath || 'default';
    
    // Check cache
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey)!;
    }
    
    // Load existing configuration using parent method
    const existingConfig = super.loadConfiguration();
    
    // Load QMS-specific configuration
    const qmsConfigPath = configPath || this.getDefaultQMSConfigPath();
    const qmsConfig = await this.loadQMSConfiguration(qmsConfigPath);
    
    // Merge configurations
    const mergedConfig = this.mergeConfigurations([existingConfig, qmsConfig]);
    
    // Validate merged configuration
    const validation = ConfigurationValidator.validateQMSConfiguration(mergedConfig);
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }
    
    const validatedConfig = QMSConfigurationSchema.parse(mergedConfig);
    
    // Cache the result
    this.configCache.set(cacheKey, validatedConfig);
    
    // Audit configuration loading
    await this.auditLogger.createSecureAuditRecord({
      eventType: 'configuration_loaded',
      timestamp: new Date().toISOString(),
      userId: 'system',
      action: 'load_qms_configuration',
      metadata: {
        configPath: qmsConfigPath,
        hasQMSSettings: !!validatedConfig.qms,
        templatesCount: validatedConfig.qms?.templates?.length || 0
      }
    });
    
    return validatedConfig;
  }
  
  private async loadQMSConfiguration(configPath: string): Promise<Partial<QMSConfiguration>> {
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      
      if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
        return yaml.load(configContent) as Partial<QMSConfiguration>;
      }
      
      return JSON.parse(configContent) as Partial<QMSConfiguration>;
    } catch (error) {
      // Return default QMS configuration if file doesn't exist
      return {
        qms: {
          templates: [],
          compliance: {
            level: 'standard',
            auditRequired: true,
            digitalSignatures: true,
            immutableRecords: true,
            encryptionRequired: true
          },
          security: {
            roleBasedAccess: true,
            auditLogging: true,
            dataEncryption: true,
            accessControlLevel: 'enhanced'
          },
          documentProcessing: {
            maxFileSize: 50 * 1024 * 1024,
            supportedFormats: ['pdf', 'docx', 'md'],
            processingTimeout: 300000,
            extractionStrategies: ['text', 'structure', 'references']
          },
          workflow: {
            phases: ['analysis', 'validation', 'reporting'],
            qualityGates: {
              documentProcessing: true,
              complianceValidation: true,
              auditTrail: true,
              reportGeneration: true
            },
            timeouts: {
              analysis: 600000,
              validation: 300000,
              reporting: 180000
            }
          }
        }
      };
    }
  }
  
  async updateConfiguration(
    updates: Partial<QMSConfiguration>, 
    user: { id: string; roles: string[] }
  ): Promise<{ success: boolean; auditRecord?: any; errors?: string[] }> {
    try {
      // Verify user has permission to modify configuration
      const hasPermission = await this.securityManager.hasPermission(user, 'manage_configurations');
      if (!hasPermission) {
        return {
          success: false,
          errors: ['Insufficient permissions to modify configuration']
        };
      }
      
      // Load current configuration
      const currentConfig = await this.loadConfiguration();
      
      // Merge updates with current configuration
      const updatedConfig = merge(currentConfig, updates);
      
      // Validate updated configuration
      const validation = ConfigurationValidator.validateQMSConfiguration(updatedConfig);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }
      
      // Save updated configuration
      await this.saveConfiguration(updatedConfig);
      
      // Clear cache
      this.configCache.clear();
      
      // Create audit record
      const auditRecord = await this.auditLogger.createSecureAuditRecord({
        eventType: 'configuration_updated',
        timestamp: new Date().toISOString(),
        userId: user.id,
        action: 'update_qms_configuration',
        metadata: {
          updatedFields: Object.keys(updates),
          validation: validation
        }
      });
      
      return {
        success: true,
        auditRecord
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  async mergeConfigurations(configs: Array<Partial<QMSConfiguration>>): Promise<QMSConfiguration> {
    // Start with empty base configuration
    let mergedConfig: any = {};
    
    // Merge configurations in order
    for (const config of configs) {
      mergedConfig = merge(mergedConfig, config, {
        // Custom merge for arrays (replace instead of concat)
        arrayMerge: (destinationArray, sourceArray) => sourceArray
      });
    }
    
    // Ensure required structure exists
    mergedConfig.qms = mergedConfig.qms || {};
    
    return QMSConfigurationSchema.parse(mergedConfig);
  }
  
  async migrateConfiguration(legacyConfig: any): Promise<QMSConfiguration> {
    // Create migration from legacy configuration
    const migratedConfig: Partial<QMSConfiguration> = {
      // Preserve existing configuration
      claude: legacyConfig.claude,
      tdd: legacyConfig.tdd,
      
      // Add default QMS configuration
      qms: {
        templates: [],
        compliance: {
          level: 'standard',
          auditRequired: true,
          digitalSignatures: true,
          immutableRecords: true,
          encryptionRequired: true
        },
        security: {
          roleBasedAccess: true,
          auditLogging: true,
          dataEncryption: true,
          accessControlLevel: 'enhanced'
        },
        documentProcessing: {
          maxFileSize: 50 * 1024 * 1024,
          supportedFormats: ['pdf', 'docx', 'md'],
          processingTimeout: 300000,
          extractionStrategies: ['text', 'structure', 'references']
        },
        workflow: {
          phases: ['analysis', 'validation', 'reporting'],
          qualityGates: {
            documentProcessing: true,
            complianceValidation: true,
            auditTrail: true,
            reportGeneration: true
          },
          timeouts: {
            analysis: 600000,
            validation: 300000,
            reporting: 180000
          }
        }
      }
    };
    
    return QMSConfigurationSchema.parse(migratedConfig);
  }
  
  private getDefaultQMSConfigPath(): string {
    return path.join(process.cwd(), '.phoenix-code-lite', 'qms-config.yaml');
  }
  
  private async saveConfiguration(config: QMSConfiguration): Promise<void> {
    const configPath = this.getDefaultQMSConfigPath();
    const configDir = path.dirname(configPath);
    
    // Ensure directory exists
    await fs.mkdir(configDir, { recursive: true });
    
    // Save as YAML for readability
    const yamlContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
    
    await fs.writeFile(configPath, yamlContent, 'utf-8');
  }
  
  // Backward compatibility - override parent method
  validateConfiguration(config: any): { valid: boolean; errors?: string[] } {
    const qmsValidation = ConfigurationValidator.validateQMSConfiguration(config);
    const backwardCompatible = ConfigurationValidator.validateBackwardCompatibility(config);
    
    return {
      valid: qmsValidation.valid && backwardCompatible,
      errors: qmsValidation.errors
    };
  }
}
```

### 4. Regulatory Template Management System

Implement comprehensive template management for regulatory standards:

```typescript
// src/config/qms-template-manager.ts

import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';
import { z } from 'zod';
import { ComplianceAuditLogger } from '../security/compliance-audit-logger';

const TemplateRequirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  mandatory: z.boolean(),
  section: z.string().optional(),
  subRequirements: z.array(z.string()).optional()
});

const TemplateProcedureSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  steps: z.array(z.string()),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional()
});

const RegulatoryTemplateSchema = z.object({
  standard: z.string(),
  version: z.string(),
  classification: z.string().optional(),
  methodology: z.string().optional(),
  metadata: z.object({
    title: z.string(),
    description: z.string(),
    effectiveDate: z.string(),
    lastUpdated: z.string(),
    author: z.string(),
    approvedBy: z.string()
  }),
  requirements: z.array(TemplateRequirementSchema),
  procedures: z.array(TemplateProcedureSchema),
  checksum: z.string()
});

export type TemplateRequirement = z.infer<typeof TemplateRequirementSchema>;
export type TemplateProcedure = z.infer<typeof TemplateProcedureSchema>;
export type RegulatoryTemplate = z.infer<typeof RegulatoryTemplateSchema>;

export class QMSTemplateManager {
  private auditLogger: ComplianceAuditLogger;
  private templateCache: Map<string, RegulatoryTemplate> = new Map();
  private templateDirectory: string;
  
  constructor(templateDirectory?: string) {
    this.auditLogger = new ComplianceAuditLogger();
    this.templateDirectory = templateDirectory || path.join(process.cwd(), 'templates', 'regulatory');
  }
  
  async loadTemplate(standard: string, classification?: string): Promise<RegulatoryTemplate> {
    const cacheKey = `${standard}:${classification || 'default'}`;
    
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }
    
    const templatePath = this.getTemplatePath(standard, classification);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const templateData = JSON.parse(templateContent);
    
    const template = RegulatoryTemplateSchema.parse(templateData);
    
    // Validate template integrity
    const isValid = await this.validateTemplateIntegrity(template);
    if (!isValid) {
      throw new Error(`Template integrity validation failed for ${standard}`);
    }
    
    this.templateCache.set(cacheKey, template);
    
    // Audit template loading
    await this.auditLogger.createSecureAuditRecord({
      eventType: 'template_loaded',
      timestamp: new Date().toISOString(),
      userId: 'system',
      action: 'load_regulatory_template',
      metadata: {
        standard,
        classification,
        version: template.version,
        requirementCount: template.requirements.length,
        procedureCount: template.procedures.length
      }
    });
    
    return template;
  }
  
  async updateTemplate(
    standard: string,
    updates: Partial<RegulatoryTemplate>
  ): Promise<{
    success: boolean;
    previousVersion: string;
    newVersion: string;
    auditRecord?: any;
  }> {
    const existingTemplate = await this.loadTemplate(standard);
    const previousVersion = existingTemplate.version;
    
    // Create updated template
    const updatedTemplate: RegulatoryTemplate = {
      ...existingTemplate,
      ...updates,
      version: updates.version || this.incrementVersion(previousVersion),
      metadata: {
        ...existingTemplate.metadata,
        ...updates.metadata,
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Recalculate checksum
    updatedTemplate.checksum = await this.calculateTemplateChecksum(updatedTemplate);
    
    // Validate updated template
    const validatedTemplate = RegulatoryTemplateSchema.parse(updatedTemplate);
    
    // Save updated template
    await this.saveTemplate(validatedTemplate);
    
    // Clear cache
    this.templateCache.clear();
    
    // Create audit record
    const auditRecord = await this.auditLogger.createSecureAuditRecord({
      eventType: 'template_updated',
      timestamp: new Date().toISOString(),
      userId: 'system',
      action: 'update_regulatory_template',
      metadata: {
        standard,
        previousVersion,
        newVersion: validatedTemplate.version,
        updatedFields: Object.keys(updates)
      }
    });
    
    return {
      success: true,
      previousVersion,
      newVersion: validatedTemplate.version,
      auditRecord
    };
  }
  
  async getCurrentTemplateVersion(standard: string): Promise<string> {
    try {
      const template = await this.loadTemplate(standard);
      return template.version;
    } catch {
      return '1.0.0';
    }
  }
  
  async validateTemplate(template: RegulatoryTemplate): Promise<boolean> {
    try {
      // Schema validation
      RegulatoryTemplateSchema.parse(template);
      
      // Integrity validation
      const integrityValid = await this.validateTemplateIntegrity(template);
      
      // Content validation
      const contentValid = this.validateTemplateContent(template);
      
      return integrityValid && contentValid;
    } catch {
      return false;
    }
  }
  
  private async validateTemplateIntegrity(template: RegulatoryTemplate): Promise<boolean> {
    const calculatedChecksum = await this.calculateTemplateChecksum(template);
    return calculatedChecksum === template.checksum;
  }
  
  private validateTemplateContent(template: RegulatoryTemplate): boolean {
    // Validate requirements have unique IDs
    const requirementIds = template.requirements.map(r => r.id);
    if (new Set(requirementIds).size !== requirementIds.length) {
      return false;
    }
    
    // Validate procedures have unique IDs
    const procedureIds = template.procedures.map(p => p.id);
    if (new Set(procedureIds).size !== procedureIds.length) {
      return false;
    }
    
    // Validate version format
    if (!semver.valid(template.version)) {
      return false;
    }
    
    return true;
  }
  
  private async calculateTemplateChecksum(template: RegulatoryTemplate): Promise<string> {
    const crypto = await import('crypto');
    
    // Create consistent string representation for checksum calculation
    const checksumData = {
      standard: template.standard,
      version: template.version,
      requirements: template.requirements.sort((a, b) => a.id.localeCompare(b.id)),
      procedures: template.procedures.sort((a, b) => a.id.localeCompare(b.id))
    };
    
    const dataString = JSON.stringify(checksumData, null, 0);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
  
  private incrementVersion(currentVersion: string): string {
    return semver.inc(currentVersion, 'patch') || '1.0.1';
  }
  
  private getTemplatePath(standard: string, classification?: string): string {
    const fileName = classification 
      ? `${standard}-${classification}.json`
      : `${standard}.json`;
    return path.join(this.templateDirectory, fileName);
  }
  
  private async saveTemplate(template: RegulatoryTemplate): Promise<void> {
    const templatePath = this.getTemplatePath(template.standard, template.classification);
    const templateDir = path.dirname(templatePath);
    
    // Ensure directory exists
    await fs.mkdir(templateDir, { recursive: true });
    
    // Save template with proper formatting
    const templateContent = JSON.stringify(template, null, 2);
    await fs.writeFile(templatePath, templateContent, 'utf-8');
  }
  
  async initializeDefaultTemplates(): Promise<void> {
    await this.createEN62304Template();
    await this.createAAMITIR45Template();
  }
  
  private async createEN62304Template(): Promise<void> {
    const en62304Template: RegulatoryTemplate = {
      standard: 'EN62304',
      version: '2.1.0',
      classification: 'Class-B',
      metadata: {
        title: 'EN 62304 Medical Device Software - Software Life Cycle Processes',
        description: 'European standard for medical device software development',
        effectiveDate: '2006-05-01',
        lastUpdated: new Date().toISOString(),
        author: 'IEC/ISO',
        approvedBy: 'European Committee for Standardization'
      },
      requirements: [
        {
          id: 'EN62304-5.1.1',
          title: 'Software development planning',
          description: 'The software development process shall be planned',
          category: 'planning',
          mandatory: true,
          section: '5.1'
        },
        {
          id: 'EN62304-5.1.2',
          title: 'Software development plan',
          description: 'A software development plan shall be established',
          category: 'planning',
          mandatory: true,
          section: '5.1'
        }
      ],
      procedures: [
        {
          id: 'PROC-EN62304-001',
          title: 'Software Development Plan Creation',
          description: 'Procedure for creating comprehensive software development plan',
          steps: [
            'Define software requirements and specifications',
            'Establish development methodology and processes',
            'Create risk management plan',
            'Define verification and validation approach',
            'Review and approve development plan'
          ],
          inputs: ['System requirements', 'Risk analysis'],
          outputs: ['Software development plan', 'Process documentation'],
          roles: ['Software architect', 'Quality manager', 'Project manager']
        }
      ],
      checksum: ''
    };
    
    // Calculate checksum
    en62304Template.checksum = await this.calculateTemplateChecksum(en62304Template);
    
    // Save template
    await this.saveTemplate(en62304Template);
  }
  
  private async createAAMITIR45Template(): Promise<void> {
    const aamiTemplate: RegulatoryTemplate = {
      standard: 'AAMI-TIR45',
      version: '1.0.0',
      methodology: 'agile',
      metadata: {
        title: 'AAMI TIR45 Guidance on the use of AGILE practices in the development of medical device software',
        description: 'Guidance for applying agile development practices in medical device software development',
        effectiveDate: '2012-06-01',
        lastUpdated: new Date().toISOString(),
        author: 'AAMI',
        approvedBy: 'Association for the Advancement of Medical Instrumentation'
      },
      requirements: [
        {
          id: 'TIR45-4.1',
          title: 'Agile documentation strategy',
          description: 'Establish documentation strategy suitable for agile development',
          category: 'documentation',
          mandatory: true,
          section: '4.1'
        }
      ],
      procedures: [
        {
          id: 'PROC-TIR45-001',
          title: 'Agile Documentation Strategy Implementation',
          description: 'Procedure for implementing documentation strategy in agile development',
          steps: [
            'Define minimum documentation requirements',
            'Establish living documentation practices',
            'Implement continuous documentation updates',
            'Ensure regulatory compliance throughout iterations'
          ],
          inputs: ['Regulatory requirements', 'Agile practices'],
          outputs: ['Documentation strategy', 'Process guidelines'],
          roles: ['Scrum master', 'Quality assurance', 'Technical writer']
        }
      ],
      checksum: ''
    };
    
    // Calculate checksum
    aamiTemplate.checksum = await this.calculateTemplateChecksum(aamiTemplate);
    
    // Save template
    await this.saveTemplate(aamiTemplate);
  }
}
```

### 5. Configuration Migration and Upgrade System

Implement seamless configuration migration:

```typescript
// src/config/configuration-migration.ts

import { QMSConfiguration, QMSConfigurationSchema } from './qms-config-schema';
import { ComplianceAuditLogger } from '../security/compliance-audit-logger';
import semver from 'semver';

interface MigrationStep {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate: (config: any) => Promise<any>;
}

export class ConfigurationMigration {
  private auditLogger: ComplianceAuditLogger;
  private migrationSteps: MigrationStep[] = [];
  
  constructor() {
    this.auditLogger = new ComplianceAuditLogger();
    this.initializeMigrationSteps();
  }
  
  private initializeMigrationSteps(): void {
    this.migrationSteps = [
      {
        fromVersion: '1.0.0',
        toVersion: '1.1.0',
        description: 'Add QMS configuration structure',
        migrate: this.migrateToV1_1_0.bind(this)
      },
      {
        fromVersion: '1.1.0',
        toVersion: '1.2.0',
        description: 'Enhanced security configuration',
        migrate: this.migrateToV1_2_0.bind(this)
      }
    ];
  }
  
  async migrateConfiguration(
    config: any,
    targetVersion?: string
  ): Promise<{
    success: boolean;
    migratedConfig?: QMSConfiguration;
    fromVersion: string;
    toVersion: string;
    migrationSteps: string[];
    auditRecord?: any;
  }> {
    const currentVersion = config.version || '1.0.0';
    const target = targetVersion || this.getLatestVersion();
    
    if (semver.gte(currentVersion, target)) {
      return {
        success: true,
        migratedConfig: QMSConfigurationSchema.parse(config),
        fromVersion: currentVersion,
        toVersion: target,
        migrationSteps: []
      };
    }
    
    let migratedConfig = { ...config };
    const appliedSteps: string[] = [];
    
    // Apply migration steps in sequence
    for (const step of this.migrationSteps) {
      if (semver.gte(currentVersion, step.fromVersion) && 
          semver.lt(currentVersion, step.toVersion) && 
          semver.lte(step.toVersion, target)) {
        
        migratedConfig = await step.migrate(migratedConfig);
        migratedConfig.version = step.toVersion;
        appliedSteps.push(`${step.fromVersion} → ${step.toVersion}: ${step.description}`);
      }
    }
    
    // Validate migrated configuration
    const validatedConfig = QMSConfigurationSchema.parse(migratedConfig);
    
    // Create audit record
    const auditRecord = await this.auditLogger.createSecureAuditRecord({
      eventType: 'configuration_migrated',
      timestamp: new Date().toISOString(),
      userId: 'system',
      action: 'migrate_configuration',
      metadata: {
        fromVersion: currentVersion,
        toVersion: target,
        migrationSteps: appliedSteps.length,
        stepsApplied: appliedSteps
      }
    });
    
    return {
      success: true,
      migratedConfig: validatedConfig,
      fromVersion: currentVersion,
      toVersion: target,
      migrationSteps: appliedSteps,
      auditRecord
    };
  }
  
  private async migrateToV1_1_0(config: any): Promise<any> {
    return {
      ...config,
      qms: {
        templates: [],
        compliance: {
          level: 'standard',
          auditRequired: true,
          digitalSignatures: true,
          immutableRecords: true,
          encryptionRequired: true
        },
        security: {
          roleBasedAccess: true,
          auditLogging: true,
          dataEncryption: true,
          accessControlLevel: 'enhanced'
        },
        documentProcessing: {
          maxFileSize: 50 * 1024 * 1024,
          supportedFormats: ['pdf', 'docx', 'md'],
          processingTimeout: 300000,
          extractionStrategies: ['text', 'structure', 'references']
        },
        workflow: {
          phases: ['analysis', 'validation', 'reporting'],
          qualityGates: {
            documentProcessing: true,
            complianceValidation: true,
            auditTrail: true,
            reportGeneration: true
          },
          timeouts: {
            analysis: 600000,
            validation: 300000,
            reporting: 180000
          }
        }
      }
    };
  }
  
  private async migrateToV1_2_0(config: any): Promise<any> {
    return {
      ...config,
      qms: {
        ...config.qms,
        security: {
          ...config.qms.security,
          twoFactorAuth: false, // New security feature
          sessionTimeout: 3600000, // 1 hour
          auditRetention: 2555200000 // 30 days
        }
      }
    };
  }
  
  private getLatestVersion(): string {
    const versions = this.migrationSteps.map(step => step.toVersion);
    versions.push('1.0.0'); // Base version
    return versions.sort(semver.rcompare)[0];
  }
  
  async validateMigration(
    originalConfig: any,
    migratedConfig: QMSConfiguration
  ): Promise<boolean> {
    try {
      // Ensure essential data is preserved
      if (originalConfig.claude && migratedConfig.claude) {
        if (JSON.stringify(originalConfig.claude) !== JSON.stringify(migratedConfig.claude)) {
          return false;
        }
      }
      
      if (originalConfig.tdd && migratedConfig.tdd) {
        if (JSON.stringify(originalConfig.tdd) !== JSON.stringify(migratedConfig.tdd)) {
          return false;
        }
      }
      
      // Ensure QMS configuration is valid
      return migratedConfig.qms !== undefined;
    } catch {
      return false;
    }
  }
}
```

### 6. Integration and Backward Compatibility Testing

Ensure seamless integration with existing Phoenix-Code-Lite systems:

```bash
# Create configuration management validation script
cat > scripts/validate-configuration-management.sh << 'EOF'
#!/bin/bash

echo "=== Configuration Management Validation ==="

# 1. Test existing configuration functionality
echo "Testing existing Phoenix-Code-Lite configuration..."
npm test -- --testNamePattern="Phoenix-Code-Lite.*configuration"
if [ $? -ne 0 ]; then
  echo "ERROR: Existing configuration tests failing"
  exit 1
fi

# 2. Test QMS configuration extensions
echo "Testing QMS configuration extensions..."
npm test -- --testNamePattern="Configuration Management Extension"
if [ $? -ne 0 ]; then
  echo "ERROR: QMS configuration extension tests failing"
  exit 1
fi

# 3. Test template management
echo "Testing regulatory template management..."
npm test -- --testNamePattern="Template Processing"
if [ $? -ne 0 ]; then
  echo "ERROR: Template management tests failing"
  exit 1
fi

# 4. Test backward compatibility
echo "Testing configuration backward compatibility..."
npm test -- --testNamePattern="backward compatibility"
if [ $? -ne 0 ]; then
  echo "ERROR: Backward compatibility tests failing"
  exit 1
fi

# 5. Test configuration migration
echo "Testing configuration migration..."
node -e "
const { ConfigurationMigration } = require('./dist/src/config/configuration-migration');
const migration = new ConfigurationMigration();
const legacyConfig = { claude: { apiKey: 'test' }, tdd: { maxTurns: 3 } };
migration.migrateConfiguration(legacyConfig).then(result => {
  if (!result.success) {
    console.error('Configuration migration failed');
    process.exit(1);
  }
  console.log('Configuration migration successful');
}).catch(error => {
  console.error('Configuration migration error:', error);
  process.exit(1);
});
"

echo "=== Configuration Management Validation Complete ==="
EOF

chmod +x scripts/validate-configuration-management.sh
```

## Implementation Documentation & Phase Transition

### Implementation Notes & Lessons Learned

**Configuration Extension Challenges**:

- Maintaining backward compatibility while adding comprehensive QMS configuration required careful schema design
- Template management system needed robust validation and integrity checking for regulatory compliance
- Configuration migration required systematic approach to preserve existing functionality while adding new capabilities

**Tool/Framework Insights**:

- Zod schema validation provided excellent type safety and validation for complex configuration structures
- YAML configuration format improved readability for regulatory templates and complex settings
- Semver integration enabled systematic version management for configuration and template updates

**Performance Considerations**:

- Configuration caching reduced loading times for complex QMS configurations
- Template validation optimized to avoid redundant integrity checks during frequent access
- Configuration merging performance acceptable for typical configuration sizes

**Testing Strategy Results**:

- Achieved comprehensive test coverage for all configuration management enhancements
- Backward compatibility testing validated preservation of existing Phoenix-Code-Lite functionality
- Migration testing ensured safe upgrade paths from legacy configurations

**Security/Quality Findings**:

- Role-based configuration access successfully integrated with existing security framework
- Audit trails for configuration changes provide necessary regulatory compliance tracking
- Template integrity validation prevents tampering with regulatory requirements

**Integration Insights**:

- Enhanced configuration manager successfully extends existing ConfigManager functionality
- Template management integrates seamlessly with QMS workflow orchestration
- Configuration security aligns with established audit and access control patterns

**Recommendations for Phase 6**:

- Leverage enhanced configuration system for CLI command settings and user preferences
- Use template management for CLI help system and command documentation
- Apply role-based access control for CLI administrative functions
- Ensure configuration changes through CLI are properly audited and validated

## Success Criteria

**Configuration System Enhanced**: Comprehensive configuration management supporting QMS templates, regulatory procedures, and dynamic compliance settings
**Backward Compatibility Maintained**: All existing Phoenix-Code-Lite configuration functionality preserved with seamless upgrade path
**Template Management Operational**: Regulatory template system with version control, validation, and integrity checking
**Security Integration Complete**: Role-based configuration access with audit trails and encrypted storage for sensitive settings

## Definition of Done

• **QMS Configuration Schema Implemented** - Comprehensive configuration schema supporting all QMS requirements with validation
• **Template Management System Operational** - Regulatory template loading, validation, and version management with integrity checking
• **Backward Compatibility Validated** - All existing configuration functionality preserved with automatic migration capability
• **Security Integration Complete** - Role-based configuration access, audit trails, and secure storage for sensitive configuration data
• **Configuration Migration System** - Automated migration from legacy configurations with validation and rollback capability
• **Performance Optimization** - Configuration loading and template management within acceptable performance parameters
• **Testing Coverage Complete** - Comprehensive test coverage for all configuration management enhancements
• **Documentation Updated** - Configuration documentation reflects new QMS capabilities and migration procedures

---

**Phase Dependencies**: Phase 4 Security Enhancement → Phase 6 Prerequisites
**Estimated Duration**: 2-3 weeks  
**Risk Level**: Medium (Complex configuration management)
**Next Phase**: [Phase 6: CLI & User Interface Adaptation](Phase-06-CLI-User-Interface-Adaptation.md)

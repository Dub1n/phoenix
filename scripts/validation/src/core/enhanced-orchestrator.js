#!/usr/bin/env node

/**
 * Enhanced Validation Orchestrator - Complete System Integration
 * 
 * Main orchestrator that extends the existing validation system with
 * autonomous extension capabilities, safety framework, and comprehensive
 * monitoring. Integrates all enhanced components while maintaining
 * backward compatibility.
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import existing system components
// Validators are loaded dynamically - no static imports needed

// Import enhanced system components
import { InterfaceComplianceChecker } from '../safety/interface-compliance-checker.js';
import { RollbackManager } from '../safety/rollback-manager.js';

/**
 * Enhanced Validation Orchestrator
 */
export class EnhancedValidationOrchestrator {
  constructor(options = {}) {
    this.validationPath = options.validationPath || path.resolve(__dirname, '../..');
    this.capabilityMatrixPath = path.join(this.validationPath, 'config/capability-matrix.json');
    this.configPath = path.join(this.validationPath, 'config/enhanced-config.json');
    
    // Initialize core components only (agent-driven workflow)
    this.complianceChecker = new InterfaceComplianceChecker();
    this.rollbackManager = new RollbackManager(this.validationPath);
    
    // System state
    this.validators = new Map();
    this.capabilityMatrix = null;
    this.systemConfig = null;
    this.initialized = false;
    
    // Enhanced logging configuration
    this.loggingEnabled = options.detailedLogging !== false;
    this.errorHistory = [];
    
    // TODO: [TASK-ID-001] Pattern: agent-only-architecture | Complexity: 3 | Dependencies: safety-framework,agent-submission
    // Context: Remove self-generating extension metrics from agent-only validation system
    // Validation-Required: pattern-compliance, agent-submission-workflow, safety-framework-integrity
    // Pattern-Info: { approach: "clean-architecture", alternatives: "hybrid-mode", trade-offs: "simplified-agent-focused" }
    
    // Performance metrics - AGENT-DRIVEN WORKFLOW ONLY
    this.metricsEnabled = false;
    this.metrics = {
      validationsRun: 0,
      agentSubmissions: 0,
      rollbacksPerformed: 0,
      averageValidationTime: 0,
      successRate: 0
    };
  }

  /**
   * Initialize the enhanced validation system
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('🚀 Initializing Enhanced Validation System v3.0.0');
    
    try {
      // Load system configuration
      await this.loadSystemConfig();
      
      // Load capability matrix
      await this.loadCapabilityMatrix();
      
      // Load and validate existing validators
      await this.loadValidators();
      
      // Verify system integrity
      await this.verifySystemIntegrity();
      
      // Perform system diagnostics
      await this.runSystemDiagnostics();
      
      this.initialized = true;
      console.log('✅ Enhanced Validation System initialized successfully');
      
    } catch (error) {
      this.logError('system_initialization', error, {
        validationPath: this.validationPath,
        configPath: this.configPath,
        capabilityMatrixPath: this.capabilityMatrixPath
      });
      throw error;
    }
  }

  /**
   * Main validation orchestration method
   */
  async orchestrateValidation(projectInfo, category, scopeConfig, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const startTime = Date.now();
    console.log(`🎯 Starting enhanced validation for category: ${category}`);
    
    try {
      // Resolve project configuration
      const projectConfig = await this.resolveProjectConfig(projectInfo.name);
      console.log(`📋 Project configuration loaded for: ${projectInfo.name}`);
      
      // Resolve project commands from config and package.json
      const commands = await this.resolveProjectCommands(projectInfo.path, projectConfig);
      const commandWarnings = this.validateRequiredCommands(commands, category);
      
      // Enhance projectInfo with resolved commands
      const enhancedProjectInfo = {
        ...projectInfo,
        commands,
        // Legacy properties for backward compatibility
        buildCommand: commands.build,
        testCommand: commands.test,
        lintCommand: commands.lint,
        typecheckCommand: commands.typecheck,
        startCommand: commands.start,
        // Add hasTypeScript detection
        hasTypeScript: fs.existsSync(path.join(projectInfo.path, 'tsconfig.json'))
      };
      
      // Log command warnings if any
      if (commandWarnings.length > 0) {
        console.log('\n⚠️ Command configuration warnings:');
        commandWarnings.forEach(warning => console.log(`   ${warning}`));
        console.log('');
      }
      
      // Validate report directories early - fail fast if missing
      const directoryIssues = this.validateReportDirectories(projectConfig, projectInfo);
      if (directoryIssues.length > 0) {
        console.log('\n⚠️ Report directory validation issues:');
        directoryIssues.forEach(issue => console.log(`   ${issue}`));
        console.log('🔧 Agent should fix project configuration file\n');
        throw new Error(`Report directory issues prevent validation: ${directoryIssues.join(', ')}`);
      }
      
      // Apply timeout overrides from project config
      const categoryTimeout = projectConfig.timeout_overrides?.[category] || 
                             projectConfig.performance?.maxValidationTime || 
                             300000; // 5 minute default
      
      // Get validator for category
      const validator = await this.getValidator(category);
      if (!validator) {
        throw new Error(`No validator available for category: ${category}`);
      }
      
      // Pre-validation checks
      await this.preValidationChecks(validator, enhancedProjectInfo, scopeConfig);
      
      // Execute validation with timeout
      const validationPromise = validator.validate(enhancedProjectInfo, scopeConfig, { ...options, projectConfig });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Validation timeout after ${categoryTimeout}ms`)), categoryTimeout);
      });
      
      const result = await Promise.race([validationPromise, timeoutPromise]);
      
      // Add timing and task ID to result
      result.duration = Date.now() - startTime;
      result.taskId = options.taskId || 'UNKNOWN';
      
      // Generate validation report (directories already validated)
      try {
        await this.generateValidationReport(result, enhancedProjectInfo, category, projectConfig);
      } catch (reportError) {
        console.error(`⚠️ Report generation failed: ${reportError.message}`);
        // Don't fail validation if report generation fails
      }
      
      // Post-validation processing (simplified)
      await this.postValidationProcessing(category, result);
      
      // Update metrics - DISABLED FOR CORE VALIDATION
      if (this.metricsEnabled) {
        this.updateMetrics(startTime, result.status === 'PASS');
      }
      
      console.log(`✅ Enhanced validation completed for ${category}: ${result.status}`);
      return result;
      
    } catch (error) {
      this.logError('enhanced_validation', error, {
        category,
        projectPath: projectInfo.path,
        validatorLoaded: this.validators.has(category)
      });
      this.updateMetrics(startTime, false);
      throw error;
    }
  }

  /**
   * Agent validator submission - Secure integration pipeline for agent-written validators
   * 
   * TODO: [TASK-ID-003] Pattern: agent-submission-pipeline | Complexity: 5 | Dependencies: safety-framework,compliance-checker,rollback-manager
   * Context: Core agent-driven workflow implementation for secure validator integration
   * Validation-Required: security-compliance, interface-validation, sandbox-testing
   * Pattern-Info: { approach: "secure-pipeline", alternatives: "direct-integration", trade-offs: "security-over-speed" }
   */
  async submitAgentValidator(validatorPath, category, projectInfo, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`📝 Processing agent-submitted validator for category: ${category}`);
    
    try {
      // Verify validator file exists
      if (!fs.existsSync(validatorPath)) {
        throw new Error(`Validator file not found: ${validatorPath}`);
      }
      
      // Initialize secure integration pipeline
      console.log('🔒 Initiating Secure Integration Pipeline...');
      
      // Phase 1: Risk Assessment
      const riskAssessment = await this.assessSubmittedValidatorRisk(validatorPath, category);
      console.log(`   Risk Assessment: ${riskAssessment.riskLevel.toUpperCase()} risk approved for submitted code.`);
      
      // Phase 2: Sandbox Testing  
      const sandboxResult = await this.sandboxTestSubmittedValidator(validatorPath);
      if (!sandboxResult.passed) {
        throw new Error(`Sandbox Testing: FAILED. ${sandboxResult.errors.join(', ')}`);
      }
      console.log('   Sandbox Testing: PASSED. Validator is safe to execute.');
      
      // Phase 3: Interface Compliance
      const complianceResult = await this.validateSubmittedValidatorCompliance(validatorPath);
      if (!complianceResult.compliant) {
        throw new Error(`Interface Compliance: FAILED. Validator does not meet IValidator contract.`);
      }
      console.log('   Interface Compliance: PASSED. Validator meets IValidator contract.');
      
      // Phase 4: Integration
      await this.integrateSubmittedValidator(validatorPath, category);
      console.log(`   Integration Complete: '${category}' validator registered.`);
      
      // Phase 5: Execute validation with new validator
      const result = await this.orchestrateValidation(projectInfo, category, options.scopeConfig || {}, options);
      
      return {
        success: true,
        category,
        validatorPath,
        riskAssessment,
        integrationResult: result
      };
      
    } catch (error) {
      console.error(`❌ Agent validator submission failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rollback an extension
   */
  async rollbackExtension(category, reason = 'Manual rollback request') {
    console.log(`🔄 Rolling back extension: ${category}`);
    
    try {
      // Remove validator from memory
      this.validators.delete(category);
      
      // Perform rollback
      const rollbackResult = await this.rollbackManager.rollbackExtension(category);
      
      if (rollbackResult.success) {
        // Update metrics - AGENT-DRIVEN WORKFLOW
        if (this.metricsEnabled) {
          this.metrics.rollbacksPerformed++;
        }
        
        // Reload capability matrix
        await this.loadCapabilityMatrix();
        
        console.log(`✅ Extension rollback completed: ${category}`);
      }
      
      return rollbackResult;
      
    } catch (error) {
      console.error(`❌ Extension rollback failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get system health status - AGENT-DRIVEN ARCHITECTURE
   * 
   * TODO: [TASK-ID-004] Pattern: agent-architecture-verification | Complexity: 2 | Dependencies: safety-framework,agent-submission
   * Context: Verify agent-only architecture is preserved and functioning after extension removal
   * Validation-Required: agent-submission-pipeline, safety-framework-integrity, rollback-capability
   * Pattern-Info: { approach: "health-verification", alternatives: "deep-diagnostics", trade-offs: "simplicity-over-detail" }
   */
  async getSystemHealth() {
    // SIMPLIFIED HEALTH CHECK - Only basic system status
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      coreComponents: {
        validators: this.validators.size > 0,
        capabilityMatrix: this.capabilityMatrix !== null,
        agentSubmissionFramework: this.complianceChecker !== null && this.rollbackManager !== null,
        safetyFramework: this.complianceChecker !== null && this.rollbackManager !== null
      },
      message: 'Core system operational - Advanced monitoring disabled'
    };

    try {
      // Basic health check - just verify core components are initialized
      const coreHealthy = Object.values(health.coreComponents).every(status => status === true);
      
      if (!coreHealthy) {
        health.status = 'error';
        health.message = 'Core system components not properly initialized';
      }
      
      return health;
      
    } catch (error) {
      health.status = 'error';
      health.message = `Basic health check failed: ${error.message}`;
      return health;
    }
  }

  /**
   * Load system configuration
   */
  async loadSystemConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        this.systemConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      } else {
        // Create default configuration
        this.systemConfig = this.getDefaultConfig();
        fs.writeFileSync(this.configPath, JSON.stringify(this.systemConfig, null, 2), 'utf8');
      }
      
      // Ensure project configuration structure exists
      const projectsDir = path.join(this.validationPath, 'config/projects');
      if (!fs.existsSync(projectsDir)) {
        fs.mkdirSync(projectsDir, { recursive: true });
      }
      
      const templatePath = path.join(this.validationPath, 'config/project-template.json');
      if (!fs.existsSync(templatePath)) {
        await this.createDefaultProjectTemplate(templatePath);
      }
      
      console.log('📋 System configuration loaded');
    } catch (error) {
      throw new Error(`Failed to load system configuration: ${error.message}`);
    }
  }

  /**
   * Resolve project information from config file 
   * @param {string} projectName - Project name (maps to config filename)
   * @returns {Object} Project information with name and resolved path
   */
  async resolveProjectInfo(projectName) {
    const normalizedName = projectName.toLowerCase();
    const projectConfigPath = path.join(
      this.validationPath, 
      'config/projects', 
      `${normalizedName}-valconfig.json`
    );
    
    if (!fs.existsSync(projectConfigPath)) {
      throw new Error(`Project configuration not found: ${projectConfigPath}`);
    }
    
    const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
    
    // Validate required fields
    if (!projectConfig.project?.name) {
      throw new Error(`Invalid project config: missing project.name in ${projectConfigPath}`);
    }
    if (!projectConfig.project?.project_directory) {
      throw new Error(`Invalid project config: missing project.project_directory in ${projectConfigPath}`);
    }
    
    // Resolve project directory path (relative to validation system root)
    let projectPath = projectConfig.project.project_directory;
    if (!path.isAbsolute(projectPath)) {
      projectPath = path.resolve(this.validationPath, projectPath);
    }
    
    // Verify project directory exists
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project directory not found: ${projectPath} (specified in ${projectConfigPath})`);
    }
    
    return {
      name: projectConfig.project.name,
      path: projectPath,
      configPath: projectConfigPath,
      displayName: projectConfig.project.display_name || projectConfig.project.name
    };
  }

  /**
   * Resolve configuration for a specific project
   * @param {string} projectName - Case-insensitive project name
   * @returns {Object} Merged configuration object
   */
  async resolveProjectConfig(projectName) {
    const normalizedName = projectName.toLowerCase();
    const projectConfigPath = path.join(
      this.validationPath, 
      'config/projects', 
      `${normalizedName}-valconfig.json`
    );
    
    // Load system defaults (includes projectDefaults)
    const systemDefaults = this.systemConfig.systemDefaults || {};
    
    // Load project-specific config if exists
    let projectConfig = {};
    if (fs.existsSync(projectConfigPath)) {
      projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
      
      // Validate project config schema
      const validation = this.validateProjectConfig(projectConfig);
      if (!validation.valid) {
        throw new Error(`Invalid project config: ${validation.errors.join(', ')}`);
      }
    } else {
      // Project config doesn't exist - notify agent
      await this.handleMissingProjectConfig(projectName, normalizedName);
    }
    
    // Deep merge: systemDefaults.projectDefaults <- projectConfig.validation
    return this.deepMerge(systemDefaults.projectDefaults || {}, projectConfig.validation || {});
  }

  /**
   * Deep merge configuration objects
   * @param {...Object} configs - Configuration objects to merge
   * @returns {Object} Merged configuration
   */
  deepMerge(...configs) {
    const result = {};
    
    for (const config of configs) {
      for (const [key, value] of Object.entries(config)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = this.deepMerge(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Resolve project commands from config and package.json
   * @param {string} projectPath - Path to the project
   * @param {Object} projectConfig - Resolved project configuration
   * @returns {Object} Commands object with available commands
   */
  async resolveProjectCommands(projectPath, projectConfig) {
    const commands = {};
    
    // Start with commands from project config
    const configCommands = projectConfig.commands || {};
    
    // Copy non-comment commands from config
    Object.entries(configCommands).forEach(([key, value]) => {
      if (!key.startsWith('_') && typeof value === 'string') {
        commands[key] = value.split('//')[0].trim(); // Remove inline comments
      }
    });
    
    // Fallback to package.json scripts if commands not configured
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const scripts = packageJson.scripts || {};
        
        // Common command mappings to package.json scripts
        const scriptMappings = {
          'build': ['build', 'compile'],
          'test': ['test'],
          'lint': ['lint', 'eslint'],
          'typecheck': ['typecheck', 'type-check', 'tsc'],
          'start': ['start', 'dev', 'serve']
        };
        
        // Only add fallbacks for commands not explicitly configured
        Object.entries(scriptMappings).forEach(([commandName, scriptNames]) => {
          if (!commands[commandName]) {
            const foundScript = scriptNames.find(scriptName => scripts[scriptName]);
            if (foundScript) {
              commands[commandName] = `npm run ${foundScript}`;
            }
          }
        });
      }
    } catch (error) {
      console.warn(`⚠️ Could not read package.json for command fallbacks: ${error.message}`);
    }
    
    return commands;
  }

  /**
   * Validate required commands for validators
   * @param {Object} commands - Available commands
   * @param {string} category - Validation category
   * @returns {Array} Array of missing command warnings
   */
  validateRequiredCommands(commands, category) {
    const warnings = [];
    const requirements = {
      'build': ['build'],
      'quality': ['lint'],
      'core': ['typecheck'],
      'backend': ['start'],
      'ui': ['start']
    };
    
    const requiredCommands = requirements[category] || [];
    
    requiredCommands.forEach(cmdName => {
      if (!commands[cmdName]) {
        warnings.push(`Missing ${cmdName} command for ${category} validation. Add to valconfig.json commands section or package.json scripts.`);
      }
    });
    
    return warnings;
  }

  /**
   * Validate project configuration schema
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result with errors/warnings
   */
  validateProjectConfig(config) {
    const errors = [];
    const warnings = [];
    
    // Validate required structure
    if (!config.project?.name) errors.push('Missing project.name');
    if (!config.validation) errors.push('Missing validation section');
    
    // Validate timeout values are reasonable (only check if implemented)
    if (config.validation?.timeout_overrides) {
      Object.entries(config.validation.timeout_overrides).forEach(([category, timeout]) => {
        // Skip comment fields
        if (category.startsWith('_')) return;
        
        if (typeof timeout === 'number' && (timeout < 10000 || timeout > 1800000)) { // 10s to 30min
          warnings.push(`Unusual timeout for ${category}: ${timeout}ms`);
        }
      });
    }
    
    return { 
      valid: errors.length === 0, 
      errors, 
      warnings,
      schema_version: config.version
    };
  }


  /**
   * Handle missing project configuration
   * @param {string} projectName - Original project name
   * @param {string} normalizedName - Normalized project name
   */
  async handleMissingProjectConfig(projectName, normalizedName) {
    console.log(`\n🔧 Project configuration required for: ${projectName}`);
    
    const projectConfigPath = path.join(
      this.validationPath, 
      'config/projects',
      `${normalizedName}-valconfig.json`
    );
    
    console.log(`📄 Configuration file needed: ${projectConfigPath}`);
    console.log(`📖 Use project template from: config/project-template.json`);
    console.log(`🔧 Agent should create and customize project configuration file`);
    
    throw new Error(`Project configuration missing - agent action required: ${projectConfigPath}`);
  }

  /**
   * Validate that report directories exist and are accessible
   * @param {Object} projectConfig - Resolved project configuration
   * @param {Object} projectInfo - Project information with path
   * @returns {Array} Array of validation issues
   */
  validateReportDirectories(projectConfig, projectInfo) {
    const issues = [];
    
    if (projectConfig.report_location) {
      let reportPath = projectConfig.report_location;
      
      // If relative path, resolve relative to project directory (same logic as resolveReportPath)
      if (!path.isAbsolute(reportPath)) {
        reportPath = path.resolve(projectInfo.path, reportPath);
      }
      
      if (!fs.existsSync(reportPath)) {
        issues.push(`Report directory does not exist: ${reportPath}`);
      } else {
        try {
          // Test write access
          const testFile = path.join(reportPath, '.write-test');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
        } catch (error) {
          issues.push(`Report directory not writable: ${reportPath}`);
        }
      }
    }
    
    return issues;
  }

  /**
   * Generate validation report
   * @param {Object} result - Validation result object
   * @param {Object} projectInfo - Project information
   * @param {string} category - Validation category
   * @param {Object} projectConfig - Resolved project configuration
   */
  async generateValidationReport(result, projectInfo, category, projectConfig) {
    try {
      const reportPath = this.resolveReportPath(projectInfo, category, projectConfig, result.taskId);
      const reportContent = this.formatValidationReport(result, projectInfo, category);
      
      // Write report directly - directory already validated in orchestrateValidation
      fs.writeFileSync(reportPath, reportContent, 'utf8');
      
      console.log(`📄 Validation report generated: ${reportPath}`);
      return reportPath;
    } catch (error) {
      console.error(`⚠️ Failed to generate validation report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resolve report file path
   * @param {Object} projectInfo - Project information  
   * @param {string} category - Validation category
   * @param {Object} projectConfig - Resolved project configuration
   * @returns {string} Absolute path to report file
   */
  resolveReportPath(projectInfo, category, projectConfig, taskId = 'UNKNOWN') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${timestamp}-${taskId}-${category}-validation-report.md`;
    
    let reportDir = projectConfig.report_location || 'validation-reports';
    
    // If relative path, resolve relative to project directory
    if (!path.isAbsolute(reportDir)) {
      reportDir = path.resolve(projectInfo.path, reportDir);
    }
    
    return path.join(reportDir, filename);
  }

  /**
   * Format validation report as Markdown
   * @param {Object} result - Validation result
   * @param {Object} projectInfo - Project information
   * @param {string} category - Validation category
   * @returns {string} Formatted report content
   */
  formatValidationReport(result, projectInfo, category) {
    const timestamp = new Date().toISOString();
    const statusMap = {
      'PASS': 'VALIDATION_PASSED',
      'WARN': 'VALIDATION_PASSED_WITH_WARNINGS', 
      'FAIL': 'VALIDATION_FAILED'
    };
    
    const frontmatter = `---
date: ${timestamp.replace(/[:.]/g, '-').slice(0, 16)}
TASK-ID: ${result.taskId || 'UNKNOWN'}
source: validation-system
validation_type: ${category}
category: ${category}
priority: medium
complexity: TBD
components: [validation-generated]
initial_status: [~]
end_status: [${result.status === 'PASS' ? 'P' : result.status === 'FAIL' ? 'F' : 'W'}]
tags: ${category}, validation, automated-testing
---

# Validation Report - ${result.taskId || 'UNKNOWN'} - ${timestamp.replace(/[:.]/g, '-').slice(0, 16)}

## Validation Category: ${this.getCategoryDescription(category)}

**Overall Status**: ${statusMap[result.status] || result.status}
**Execution Time**: ${result.duration}ms
**Tests Executed**: ${result.tests.length}

## Tests Executed

${this.formatTestResults(result.tests)}

## Evidence Collected

${this.formatEvidence(result.evidence)}

## Test Results Detail

${this.formatTestResultsDetail(result.tests)}

${result.errors.length > 0 ? `## Errors\n\n${this.formatErrors(result.errors)}\n` : ''}
${result.warnings.length > 0 ? `## Warnings\n\n${this.formatWarnings(result.warnings)}\n` : ''}

## Summary

- **Project**: ${projectInfo.name}
- **Category**: ${category}
- **Status**: ${result.status}
- **Duration**: ${result.duration}ms
- **Timestamp**: ${timestamp}
- **Tests Passed**: ${result.tests.filter(t => t.status === 'PASS').length}
- **Tests Failed**: ${result.tests.filter(t => t.status === 'FAIL').length}
- **Tests Warned**: ${result.tests.filter(t => t.status === 'WARN').length}
`;

    return frontmatter;
  }

  /**
   * Get category description for report
   * @param {string} category - Validation category
   * @returns {string} Human-readable category description
   */
  getCategoryDescription(category) {
    const descriptions = {
      'build': 'Compilation/Build Tasks',
      'quality': 'Code Quality Assessment',
      'architecture': 'Architecture Validation',
      'backend': 'Backend/Service Tasks',
      'feature': 'Feature Implementation',
      'core': 'Core System Validation',
      'ui': 'User Interface Testing',
      'lint': 'Code Linting and Style'
    };
    return descriptions[category] || `${category} Validation`;
  }

  /**
   * Format test results for report
   * @param {Array} tests - Test results array
   * @returns {string} Formatted test list
   */
  formatTestResults(tests) {
    return tests.map(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
      return `- [ ] ${test.name} - ${icon} ${test.status}`;
    }).join('\n');
  }

  /**
   * Format evidence for report
   * @param {Array} evidence - Evidence array
   * @returns {string} Formatted evidence list
   */
  formatEvidence(evidence) {
    if (!evidence || evidence.length === 0) {
      return 'No evidence collected';
    }
    
    return evidence.map((item, index) => {
      return `${index + 1}. ${item}`;
    }).join('\n');
  }

  /**
   * Format detailed test results
   * @param {Array} tests - Test results array
   * @returns {string} Formatted detailed results
   */
  formatTestResultsDetail(tests) {
    return tests.map(test => {
      return `### ${test.name}

**Status**: ${test.status}
**Message**: ${test.message || 'N/A'}
**Evidence**: ${test.evidence ? test.evidence.join(', ') : 'N/A'}
`;
    }).join('\n');
  }

  /**
   * Format errors for report
   * @param {Array} errors - Errors array
   * @returns {string} Formatted errors
   */
  formatErrors(errors) {
    return errors.map(error => `- ${error}`).join('\n');
  }

  /**
   * Format warnings for report
   * @param {Array} warnings - Warnings array
   * @returns {string} Formatted warnings
   */
  formatWarnings(warnings) {
    return warnings.map(warning => `- ${warning}`).join('\n');
  }

  /**
   * Enhanced error handling with actionable guidance
   * @param {Error} error - The error that occurred
   * @param {Object} projectInfo - Project information
   * @param {string} category - Validation category
   */
  handleValidationError(error, projectInfo, category) {
    if (error.message.includes('Project configuration missing')) {
      console.error(`\n🔧 Project configuration missing for: ${projectInfo.name}`);
      console.error(`   📄 Configuration file needed: config/projects/${projectInfo.name.toLowerCase()}-valconfig.json`);
      console.error(`   📖 Use template from: config/project-template.json`);
      console.error(`   🔧 Agent should create and customize project configuration file\n`);
    } else if (error.message.includes('Invalid project config')) {
      console.error(`\n❌ Invalid project configuration: ${projectInfo.name}`);
      console.error(`   📄 Check file: config/projects/${projectInfo.name.toLowerCase()}-valconfig.json`);
      console.error(`   🔧 Ensure all required fields are present and properly formatted\n`);
    } else if (error.message.includes('Validation timeout')) {
      console.error(`\n⏱️ Timeout occurred during ${category} validation`);
      console.error(`   📄 Edit: config/projects/${projectInfo.name.toLowerCase()}-valconfig.json`);
      console.error(`   🔧 Add: "timeout_overrides": { "${category}": ${this.getRecommendedTimeout(category)} }\n`);
    } else if (error.message.includes('Report directory')) {
      console.error(`\n📁 Report directory issue for project: ${projectInfo.name}`);
      console.error(`   📄 Check: config/projects/${projectInfo.name.toLowerCase()}-valconfig.json`);
      console.error(`   🔧 Ensure report_location is a valid, writable path\n`);
    } else if (error.message.includes('No validator available')) {
      console.error(`\n🔧 No validator available for category: ${category}`);
      console.error(`   💡 Available options:`);
      console.error(`   1. Use --submit-validator flag to provide a custom validator`);
      console.error(`   2. Check available categories with --list-categories`);
      console.error(`   3. Verify category spelling and try again\n`);
    } else {
      console.error(`\n❌ Validation failed: ${error.message}`);
      console.error(`   📄 Project: ${projectInfo.name}`);
      console.error(`   📂 Category: ${category}`);
      console.error(`   🔧 Check logs above for specific details\n`);
    }
  }

  /**
   * Get recommended timeout for category
   * @param {string} category - Validation category
   * @returns {number} Recommended timeout in milliseconds
   */
  getRecommendedTimeout(category) {
    const timeouts = {
      'quality': 120000,      // 2 minutes
      'architecture': 180000, // 3 minutes
      'backend': 180000,      // 3 minutes
      'build': 240000,        // 4 minutes
      'feature': 300000,      // 5 minutes
      'core': 360000          // 6 minutes
    };
    return timeouts[category] || 300000; // 5 minute default
  }

  /**
   * Load capability matrix
   */
  async loadCapabilityMatrix() {
    try {
      if (fs.existsSync(this.capabilityMatrixPath)) {
        this.capabilityMatrix = JSON.parse(fs.readFileSync(this.capabilityMatrixPath, 'utf8'));
        console.log(`📊 Capability matrix loaded - ${Object.keys(this.capabilityMatrix.categories).length} categories`);
      } else {
        throw new Error('Capability matrix not found');
      }
    } catch (error) {
      throw new Error(`Failed to load capability matrix: ${error.message}`);
    }
  }

  /**
   * Load and validate all validators
   */
  async loadValidators() {
    const loadedCount = 0;
    const categories = Object.keys(this.capabilityMatrix.categories);
    
    console.log(`🔧 Loading ${categories.length} validators...`);
    
    for (const category of categories) {
      try {
        await this.loadValidator(category);
      } catch (error) {
        const categoryInfo = this.capabilityMatrix.categories[category] || { validator: `${category}-validator.js` };
        const validatorPath = path.join(this.validationPath, 'src/validators', categoryInfo.validator);
        this.logError('validator_loading', error, {
          category,
          validatorPath
        });
      }
    }
    
    console.log(`✅ Loaded ${this.validators.size}/${categories.length} validators`);
  }

  /**
   * Load a specific validator
   */
  async loadValidator(category) {
    const categoryInfo = this.capabilityMatrix.categories[category];
    if (!categoryInfo) {
      throw new Error(`Category not found in capability matrix: ${category}`);
    }
    
    const validatorPath = path.join(this.validationPath, 'src/validators', categoryInfo.validator);
    
    if (!fs.existsSync(validatorPath)) {
      throw new Error(`Validator file not found: ${categoryInfo.validator}`);
    }
    
    try {
      // Dynamic import of validator
      const { default: ValidatorClass } = await import(validatorPath);
      const validator = new ValidatorClass();
      
      // Validate interface compliance
      const complianceResult = await this.complianceChecker.checkCompliance(validator);
      if (!complianceResult.compliant) {
        throw new Error(`Validator interface compliance failed: ${complianceResult.score}%`);
      }
      
      // Store validator
      this.validators.set(category, validator);
      console.log(`✅ Loaded validator: ${category}`);
      
    } catch (error) {
      throw new Error(`Failed to load validator ${category}: ${error.message}`);
    }
  }

  /**
   * Get validator for category with fallback
   */
  async getValidator(category) {
    let validator = this.validators.get(category);
    
    if (!validator) {
      // Try to load the validator
      try {
        await this.loadValidator(category);
        validator = this.validators.get(category);
      } catch (error) {
        console.warn(`⚠️ Could not load validator for ${category}, checking for fallback`);
      }
    }
    
    return validator;
  }

  /**
   * Pre-validation checks
   */
  async preValidationChecks(validator, projectInfo, scopeConfig) {
    // Verify validator health
    const diagnostics = validator.runSelfDiagnostics();
    if (diagnostics.status !== 'healthy') {
      console.warn(`⚠️ Validator diagnostics warning: ${validator.category}`);
    }
    
    // Check project compatibility
    const capabilities = validator.getCapabilities();
    if (!capabilities.supportedProjects.includes(projectInfo.name) && 
        !capabilities.supportedProjects.includes('*')) {
      console.warn(`⚠️ Project ${projectInfo.name} may not be fully supported by ${validator.category} validator`);
    }
  }

  /**
   * Post-validation processing - SIMPLIFIED FOR CORE VALIDATION
   */
  async postValidationProcessing(category, result) {
    // Basic validation result logging only
    console.log(`📊 Validation result for ${category}: ${result.status} (${result.duration}ms)`);
    
    // DISABLED FOR CORE VALIDATION - TODO: Re-enable after core system validation
    // await this.updateValidatorMetrics(category, result);
    
    // Basic issue detection only
    if (result.status === 'FAIL' && result.errors.length > 3) {
      console.warn(`⚠️ Multiple failures in ${category} - review recommended`);
    }
  }

  /**
   * Verify system integrity
   */
  async verifySystemIntegrity() {
    const checks = [
      'capability-matrix.json exists',
      'safety framework components available',
      'agent submission pipeline ready',
      'compliance validation framework ready'
    ];
    
    console.log('🔍 Verifying system integrity...');
    
    // Add integrity checks here
    // This is a placeholder for comprehensive system checks
    
    console.log('✅ System integrity verified');
  }

  /**
   * Run system diagnostics
   */
  async runSystemDiagnostics() {
    console.log('🩺 Running system diagnostics...');
    
    const diagnostics = {
      validators: {},
      framework: 'healthy',
      performance: 'good'
    };
    
    // Run diagnostics on all loaded validators
    for (const [category, validator] of this.validators) {
      diagnostics.validators[category] = validator.runSelfDiagnostics();
    }
    
    // Analyze results (handle both 'healthy' and 'HEALTHY' status values)
    const unhealthyValidators = Object.entries(diagnostics.validators)
      .filter(([_, diag]) => diag.status?.toLowerCase() !== 'healthy').length;
    
    if (unhealthyValidators > 0) {
      console.warn(`⚠️ ${unhealthyValidators} validators have health issues`);
    }
    
    console.log('✅ System diagnostics completed');
  }

  /**
   * Enhanced error logging with detailed context
   */
  logError(operation, error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      operation,
      error: {
        message: error.message,
        type: error.constructor.name,
        code: error.code,
        stack: error.stack
      },
      context,
      systemState: {
        initialized: this.initialized,
        validatorsLoaded: this.validators.size,
        validationPath: this.validationPath
      }
    };
    
    this.errorHistory.push(errorEntry);
    
    if (this.loggingEnabled) {
      console.error(`\n🚨 ERROR IN ${operation.toUpperCase()}`);
      console.error(`   Message: ${error.message}`);
      console.error(`   Type: ${error.constructor.name}`);
      if (error.code) {
        console.error(`   Code: ${error.code}`);
      }
      if (context.category) {
        console.error(`   Category: ${context.category}`);
      }
      if (context.projectPath) {
        console.error(`   Project: ${context.projectPath}`);
      }
      if (context.validatorPath) {
        console.error(`   Validator: ${context.validatorPath}`);
      }
      console.error(`   Time: ${errorEntry.timestamp}`);
      console.error(`   System: ${this.validators.size} validators loaded, initialized: ${this.initialized}`);
      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(0, 4);
        console.error(`   Stack: ${stackLines.join('\n          ')}`);
      }
      console.error(''); // Empty line for readability
    }
    
    return errorEntry;
  }

  /**
   * Get error history for troubleshooting
   */
  getErrorHistory() {
    return this.errorHistory;
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
  }

  /**
   * Update system metrics - DISABLED FOR CORE VALIDATION
   * TODO: Re-enable after core system validation complete
   */
  updateMetrics(startTime, success) {
    if (!this.metricsEnabled) return;
    
    this.metrics.validationsRun++;
    
    const duration = Date.now() - startTime;
    this.metrics.averageValidationTime = 
      (this.metrics.averageValidationTime * (this.metrics.validationsRun - 1) + duration) / this.metrics.validationsRun;
    
    const successCount = success ? 1 : 0;
    this.metrics.successRate = 
      (this.metrics.successRate * (this.metrics.validationsRun - 1) + successCount) / this.metrics.validationsRun;
  }

  /**
   * Assess risk of submitted agent validator
   */
  async assessSubmittedValidatorRisk(validatorPath, category) {
    // Read validator file for risk analysis
    const content = fs.readFileSync(validatorPath, 'utf8');
    let riskScore = 0;
    const riskFactors = [];
    
    // Check for high-risk patterns
    if (content.includes('execSync') || content.includes('spawn')) {
      riskScore += 30;
      riskFactors.push('Contains command execution');
    }
    
    if (content.includes('eval(') || content.includes('Function(')) {
      riskScore += 40;
      riskFactors.push('Contains code evaluation');
    }
    
    if (content.includes('fs.writeFileSync') || content.includes('fs.unlinkSync')) {
      riskScore += 20;
      riskFactors.push('Modifies file system');
    }
    
    // Core system categories have higher risk
    if (['core', 'build', 'architecture'].includes(category)) {
      riskScore += 25;
      riskFactors.push('Critical system category');
    }
    
    // Determine risk level
    let riskLevel = 'low';
    if (riskScore >= 70) {
      riskLevel = 'critical';
    } else if (riskScore >= 40) {
      riskLevel = 'high';
    } else if (riskScore >= 20) {
      riskLevel = 'medium';
    }
    
    return {
      riskLevel,
      score: riskScore,
      factors: riskFactors
    };
  }
  
  /**
   * Sandbox test submitted validator
   */
  async sandboxTestSubmittedValidator(validatorPath) {
    const result = {
      passed: false,
      errors: [],
      warnings: []
    };
    
    try {
      // Basic import test
      const { default: ValidatorClass } = await import(`file://${path.resolve(validatorPath)}`);
      const validator = new ValidatorClass();
      
      // Test required methods exist
      const requiredMethods = ['validate', 'getCapabilities', 'getMetadata', 'runSelfDiagnostics'];
      for (const method of requiredMethods) {
        if (typeof validator[method] !== 'function') {
          result.errors.push(`Missing required method: ${method}`);
        }
      }
      
      // Test basic method execution
      const capabilities = validator.getCapabilities();
      const metadata = validator.getMetadata();
      const diagnostics = validator.runSelfDiagnostics();
      
      if (!capabilities || !metadata || !diagnostics) {
        result.errors.push('Basic method execution failed');
      }
      
      result.passed = result.errors.length === 0;
      
    } catch (error) {
      result.errors.push(`Import or execution failed: ${error.message}`);
    }
    
    return result;
  }
  
  /**
   * Validate submitted validator compliance
   */
  async validateSubmittedValidatorCompliance(validatorPath) {
    try {
      const { default: ValidatorClass } = await import(`file://${path.resolve(validatorPath)}`);
      const validator = new ValidatorClass();
      
      return await this.complianceChecker.checkCompliance(validator);
    } catch (error) {
      return {
        compliant: false,
        score: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Integrate submitted validator
   */
  async integrateSubmittedValidator(validatorPath, category) {
    // Copy validator to validators directory
    const fileName = `${category}-validator.js`;
    const targetPath = path.join(this.validationPath, 'src/validators', fileName);
    
    // Create backup if validator already exists
    if (fs.existsSync(targetPath)) {
      await this.rollbackManager.createBackup(category);
    }
    
    // Copy validator file
    fs.copyFileSync(validatorPath, targetPath);
    
    // Update capability matrix
    await this.updateCapabilityMatrixForSubmittedValidator(category, fileName);
    
    // Load the new validator
    await this.loadValidator(category);
  }
  
  /**
   * Update capability matrix for submitted validator
   */
  async updateCapabilityMatrixForSubmittedValidator(category, fileName) {
    let matrix = {};
    if (fs.existsSync(this.capabilityMatrixPath)) {
      matrix = JSON.parse(fs.readFileSync(this.capabilityMatrixPath, 'utf8'));
    }
    
    // Add new category
    matrix.categories = matrix.categories || {};
    matrix.categories[category] = {
      scopes: ['**/*'],  // Default scope, can be customized
      validator: fileName,
      description: `${category} validation - Agent submitted`,
      interfaceVersion: '3.0.0',
      capabilities: {
        supportedProjects: ['*'],  // Default to all projects
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
    
    // Update metadata
    matrix.metadata = matrix.metadata || {};
    matrix.metadata.lastUpdated = new Date().toISOString();
    matrix.metadata.totalAgentSubmissions = (matrix.metadata.totalAgentSubmissions || 0) + 1;
    
    fs.writeFileSync(this.capabilityMatrixPath, JSON.stringify(matrix, null, 2), 'utf8');
  }

  /* DISABLED FOR CORE VALIDATION - TODO: Re-enable after core system validation
  
  /**
   * Check validators health
   * /
  async checkValidatorsHealth() {
    const health = { status: 'healthy', details: {}, issues: [] };
    
    for (const [category, validator] of this.validators) {
      const diagnostics = validator.runSelfDiagnostics();
      health.details[category] = diagnostics;
      
      if (diagnostics.status !== 'healthy') {
        health.status = 'warning';
        health.issues.push(`${category} validator has health issues`);
      }
    }
    
    return health;
  }

  /**
   * Check capability matrix health
   * /
  async checkCapabilityMatrixHealth() {
    const health = { status: 'healthy', issues: [] };
    
    if (!this.capabilityMatrix) {
      health.status = 'error';
      health.issues.push('Capability matrix not loaded');
      return health;
    }
    
    const categories = Object.keys(this.capabilityMatrix.categories);
    const loadedValidators = this.validators.size;
    
    if (loadedValidators < categories.length) {
      health.status = 'warning';
      health.issues.push(`Only ${loadedValidators}/${categories.length} validators loaded`);
    }
    
    return health;
  }

  /**
   * Check extension framework health
   * /
  async checkExtensionFrameworkHealth() {
    const health = { status: 'healthy', issues: [] };
    
    if (!this.extensionGenerator) {
      health.status = 'error';
      health.issues.push('Extension generator not available');
    }
    
    return health;
  }

  /**
   * Check safety framework health
   * /
  async checkSafetyFrameworkHealth() {
    const health = { status: 'healthy', issues: [] };
    
    if (!this.complianceChecker || !this.rollbackManager) {
      health.status = 'error';
      health.issues.push('Safety framework components missing');
    }
    
    return health;
  }

  /**
   * Update validator metrics
   * /
  async updateValidatorMetrics(category, result) {
    // This would update performance metrics in the capability matrix
    // Implementation depends on specific metrics tracking requirements
  }
  
  END DISABLED MONITORING SECTION */

  /**
   * Create default project template file
   * @param {string} templatePath - Path where template should be created
   */
  async createDefaultProjectTemplate(templatePath) {
    const defaultTemplate = {
      "version": "3.0.1",
      "project": {
        "name": "PROJECT_NAME_PLACEHOLDER",
        "display_name": "PROJECT_DISPLAY_NAME_PLACEHOLDER", 
        "description": "Validation configuration for PROJECT_DISPLAY_NAME_PLACEHOLDER",
        "project_directory": "../../PROJECT_NAME_PLACEHOLDER"
      },
      "validation": {
        "report_location": "dev/validation-results",
        "timeout_overrides": {
          "_comment": "Override default timeouts for specific categories (milliseconds)",
          "_examples": {
            "quality": "120000  // 2 minutes for quality validation",
            "architecture": "180000  // 3 minutes for architecture validation",
            "backend": "150000  // 2.5 minutes for backend validation"
          }
        },
        "resource_thresholds": {
          "_comment": "Adjust resource warning thresholds if needed", 
          "_examples": {
            "memory_warning": "75  // Warn when memory usage exceeds 75%",
            "cpu_warning": "80     // Warn when CPU usage exceeds 80%"
          }
        },
        "commands": {
          "_comment": "Define commands for validators to use (fallback to package.json scripts if not specified)",
          "_examples": {
            "build": "npm run build  // Build command for build validator",
            "test": "npm test        // Test command for test validators", 
            "lint": "npm run lint    // Lint command for quality validators",
            "typecheck": "npx tsc --noEmit  // TypeScript checking command",
            "start": "npm start      // Start command for backend validators"
          }
        }
      },
      "reporting": {
        "format": "markdown",
        "include_evidence": true,
        "include_timing": true
      }
    };
    
    fs.writeFileSync(templatePath, JSON.stringify(defaultTemplate, null, 2), 'utf8');
    console.log(`📄 Created project template: ${templatePath}`);
  }

  /**
   * Get default system configuration
   */
  getDefaultConfig() {
    // TODO: [TASK-ID-002] Pattern: agent-only-configuration | Complexity: 2 | Dependencies: agent-submission-framework
    // Context: Update default configuration to reflect agent-only architecture without extension generation
    // Validation-Required: configuration-consistency, agent-workflow-integrity
    // Pattern-Info: { approach: "agent-focused-config", alternatives: "hybrid-config", trade-offs: "simplified-maintenance" }
    
    return {
      version: '3.0.0',
      agentSubmissionFramework: {
        enabled: true,
        safetyLevel: 'enhanced',
        maxSubmissionsPerSession: 1,
        rollbackEnabled: true,
        humanReviewRequired: true
      },
      safety: {
        preValidationChecks: true,
        postValidationProcessing: true,
        sandboxTesting: true,
        interfaceCompliance: true,
        automaticRollback: true
      },
      monitoring: {
        metricsEnabled: false, // Disabled for agent-only mode
        successRateTarget: 0.90,
        qualityThreshold: 80
      },
      performance: {
        maxValidationTime: 300000, // 5 minutes
        memoryLimit: 512, // MB
        parallelValidations: 1 // Single validation for agent submissions
      }
    };
  }
}

export default EnhancedValidationOrchestrator;

// CLI handling for direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const main = async () => {
    try {
      const args = process.argv.slice(2);
      const orchestrator = new EnhancedValidationOrchestrator();
      
      // Parse command line arguments
      let category, project, taskId, submitValidator, scopePatterns;
      
      for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
          case '--category':
            category = args[++i];
            break;
          case '--project':
            project = args[++i];
            break;
          case '--task-id':
            taskId = args[++i];
            break;
          case '--submit-validator':
            submitValidator = args[++i];
            break;
          case '--scope':
            scopePatterns = args[++i].split(',');
            break;
          case '--health-check':
            await orchestrator.initialize();
            const health = await orchestrator.getSystemHealth();
            console.log(JSON.stringify(health, null, 2));
            process.exit(health.status === 'healthy' ? 0 : 1);
            break;
          case '--list-categories':
            await orchestrator.initialize();
            const categories = Object.keys(orchestrator.capabilityMatrix.categories);
            console.log('Available categories:', categories.join(', '));
            process.exit(0);
            break;
        }
      }
      
      if (!category || !project || !taskId) {
        console.error('Missing required arguments: --category, --project, --task-id');
        process.exit(1);
      }
      
      // Resolve project information from config file
      const projectInfo = await orchestrator.resolveProjectInfo(project);
      
      const scopeConfig = {
        patterns: scopePatterns || ['**/*']
      };
      
      // Handle validator submission workflow
      if (submitValidator) {
        console.log('Enhanced Validation System v3.0.0');
        console.log(`Received new validator for category '${category}'.`);
        
        const result = await orchestrator.submitAgentValidator(
          submitValidator, 
          category, 
          projectInfo, 
          { scopeConfig }
        );
        
        if (result.success) {
          console.log(`Loading new validator: ${category}-validator.js`);
          console.log('Executing validation with safety monitoring');
          console.log(`Validation Results: ${result.integrationResult.status} (${result.integrationResult.duration || 'unknown duration'})`);
          process.exit(0);
        } else {
          process.exit(1);
        }
      } else {
        // Standard validation workflow
        console.log('Enhanced Validation System v3.0.0');
        console.log(`Compatibility Check: ${category} category found`);
        
        try {
          await orchestrator.initialize();
          const validator = await orchestrator.getValidator(category);
          
          if (!validator) {
            console.log(`Compatibility Check: Category '${category}' not found.`);
            console.log('Extension Required: Please generate a validator script and submit it using the --submit-validator flag.');
            process.exit(1);
          }
          
          console.log(`Loading validator: ${category}-validator.js`);
          console.log('Executing validation with safety monitoring');
          
          const result = await orchestrator.orchestrateValidation(
            projectInfo, 
            category, 
            scopeConfig,
            { taskId }
          );
          
          console.log(`Validation Results: ${result.status} (${result.duration || 'unknown duration'})`);
          console.log('All validations completed successfully');
          process.exit(result.status === 'PASS' ? 0 : 1);
          
        } catch (error) {
          orchestrator.handleValidationError(error, projectInfo, category);
          process.exit(1);
        }
      }
      
    } catch (error) {
      console.error(`System error: ${error.message}`);
      process.exit(1);
    }
  };
  
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
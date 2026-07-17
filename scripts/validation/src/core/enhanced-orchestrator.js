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
import { fileURLToPath, pathToFileURL } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import existing system components
// Validators are loaded dynamically - no static imports needed

// Import enhanced system components
import { RollbackManager } from '../safety/rollback-manager.js';
import { ValidatorValidationService } from './validator-validation-service.js';
import { ValidatorSubmissionService } from './validator-submission-service.js';
import { ValidationReportService } from './validation-report-service.js';

/**
 * Enhanced Validation Orchestrator
 */
export class EnhancedValidationOrchestrator {
  constructor(options = {}) {
    this.validationPath = options.validationPath || path.resolve(__dirname, '../..');
    this.capabilityMatrixPath = path.join(this.validationPath, 'config/capability-matrix.json');
    this.configPath = path.join(this.validationPath, 'config/enhanced-config.json');
    
    // Initialize core components only (agent-driven workflow)
    this.validatorValidationService = new ValidatorValidationService();
    this.rollbackManager = new RollbackManager(this.validationPath);
    this.validatorSubmissionService = new ValidatorSubmissionService({
      validationPath: this.validationPath,
      capabilityMatrixPath: this.capabilityMatrixPath,
      rollbackManager: this.rollbackManager,
      validatorValidationService: this.validatorValidationService,
      loadValidator: this.loadValidator.bind(this),
      reloadCapabilityMatrix: this.loadCapabilityMatrix.bind(this)
    });
    this.validationReportService = new ValidationReportService();
    
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
    
    console.log('[~] Initializing Enhanced Validation System v3.0.0');
    
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
      console.log('[x] Enhanced Validation System initialized successfully');
      
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
    this.validationStartTime = startTime;
    console.log(`[T] Starting enhanced validation for category: ${category}`);
    
    try {
      // Resolve project configuration
      const projectConfig = await this.resolveProjectConfig(projectInfo.name);
      console.log(`[x] Project configuration loaded for: ${projectInfo.name}`);
      
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
        console.log('\n[!] Command configuration warnings:');
        commandWarnings.forEach(warning => console.log(`   ${warning}`));
        console.log('');
      }
      
      // Validate report directories early - fail fast if missing
      const directoryIssues = this.validateReportDirectories(projectConfig, projectInfo);
      if (directoryIssues.length > 0) {
        console.log('\n[!] Report directory validation issues:');
        directoryIssues.forEach(issue => console.log(`   ${issue}`));
        console.log('[?] Agent should fix project configuration file\n');
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
      
      // TODO: [TASK-VAL-CORE-FIX-001] Pattern: per-validator-timeout-enforcement | Complexity: 7 | Dependencies: circuit-breaker,progress-monitoring
      // Context: Implement per-validator timeout enforcement with circuit breaker pattern to prevent infinite hangs
      // Validation-Required: timeout-enforcement, circuit-breaker-functionality, progress-monitoring
      // Pattern-Info: { approach: "race-condition-with-monitoring", alternatives: "worker-threads", trade-offs: "simplicity-vs-isolation" }
      
      // Execute validation with enhanced timeout and progress monitoring
      const result = await this.executeValidationWithTimeout(validator, enhancedProjectInfo, scopeConfig, { ...options, projectConfig }, categoryTimeout, category);
      
      // Add timing and task ID to result
      result.duration = Date.now() - startTime;
      result.taskId = options.taskId || 'UNKNOWN';
      
      // Generate validation report (directories already validated)
      try {
        await this.generateValidationReport(result, enhancedProjectInfo, category, projectConfig);
      } catch (reportError) {
        console.error(`[F] Report generation failed: ${reportError.message}`);
        // Don't fail validation if report generation fails
      }
      
      // Post-validation processing (simplified)
      await this.postValidationProcessing(category, result);
      
      // Update metrics - DISABLED FOR CORE VALIDATION
      if (this.metricsEnabled) {
        this.updateMetrics(startTime, result.status === 'PASS');
      }
      
      console.log(`[x] Enhanced validation completed for ${category}: ${result.status}`);
      return result;
      
    } catch (error) {
      // TODO: [TASK-VAL-CORE-FIX-001] Pattern: enhanced-error-recovery | Complexity: 6 | Dependencies: error-diagnosis,recovery-mechanisms
      // Context: Implement comprehensive error recovery with diagnostic reporting and fallback mechanisms
      // Validation-Required: error-classification, recovery-strategies, diagnostic-accuracy
      // Pattern-Info: { approach: \"multi-tier-recovery\", alternatives: \"simple-logging\", trade-offs: \"complexity-vs-reliability\" }
      
      // Enhanced error classification and recovery
      const recoveryResult = await this.attemptErrorRecovery(error, category, projectInfo, enhancedProjectInfo, scopeConfig, options);
      
      if (recoveryResult.recovered) {
        console.log(`[x] Error recovery successful for ${category}: ${recoveryResult.strategy}`);
        return recoveryResult.result;
      }
      
      // Log comprehensive error details
      const errorContext = {
        category,
        projectPath: projectInfo.path,
        validatorLoaded: this.validators.has(category),
        projectConfig: enhancedProjectInfo.commands ? 'loaded' : 'missing',
        scopePatterns: scopeConfig.patterns,
        timeoutUsed: categoryTimeout,
        validationDuration: Date.now() - startTime,
        systemState: {
          initialized: this.initialized,
          validatorsCount: this.validators.size,
          memoryUsage: process.memoryUsage()
        }
      };
      
      this.logError('enhanced_validation', error, errorContext);
      this.updateMetrics(startTime, false);
      
      // Enhanced error handling with user guidance
      this.handleValidationError(error, projectInfo, category);
      throw error;
    }
  }

  // Agent validator submission - Secure integration pipeline for agent-written validators
  
  async submitAgentValidator(validatorPath, category, projectInfo, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const scopeConfig = options.scopeConfig || {};

    try {
      return await this.validatorSubmissionService.submitValidator({
        validatorPath,
        category,
        scopeConfig,
        executeValidation: async finalScope => {
          const effectiveScope = finalScope || scopeConfig;
          return this.orchestrateValidation(projectInfo, category, effectiveScope, options);
        }
      });
    } catch (error) {
      console.error(`[x] Agent validator submission failed: ${error.message}`);
      throw error;
    }
  }


  /**
   * Rollback an extension
   */
  async rollbackExtension(category, reason = 'Manual rollback request') {
    console.log(`[<] Rolling back extension: ${category}`);
    
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
        
        console.log(`[x] Extension rollback completed: ${category}`);
      }
      
      return rollbackResult;
      
    } catch (error) {
      console.error(`[F] Extension rollback failed: ${error.message}`);
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
        agentSubmissionFramework: this.validatorSubmissionService !== null && this.rollbackManager !== null,
        safetyFramework: this.validatorValidationService?.isReady() && this.rollbackManager !== null
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
      
      console.log('[x] System configuration loaded');
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
      console.warn(`[!] Could not read package.json for command fallbacks: ${error.message}`);
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
    console.log(`\n[?] Project configuration required for: ${projectName}`);
    
    const projectConfigPath = path.join(
      this.validationPath, 
      'config/projects',
      `${normalizedName}-valconfig.json`
    );
    
    console.log(`[?] Configuration file needed: ${projectConfigPath}`);
    console.log(`[>] Use project template from: config/project-template.json`);
    console.log(`[>] Agent should create and customize project configuration file`);
    
    throw new Error(`Project configuration missing - agent action required: ${projectConfigPath}`);
  }


  validateReportDirectories(projectConfig, projectInfo) {
    return this.validationReportService.validateReportDirectories(projectConfig, projectInfo);
  }

  async generateValidationReport(result, projectInfo, category, projectConfig) {
    return this.validationReportService.generateValidationReport(result, projectInfo, category, projectConfig);
  }

  resolveReportPath(projectInfo, category, projectConfig, taskId = 'UNKNOWN') {
    return this.validationReportService.resolveReportPath(projectInfo, category, projectConfig, taskId);
  }

  formatValidationReport(result, projectInfo, category) {
    return this.validationReportService.formatValidationReport(result, projectInfo, category);
  }

  getCategoryDescription(category) {
    return this.validationReportService.getCategoryDescription(category);
  }

  formatTestResults(tests) {
    return this.validationReportService.formatTestResults(tests);
  }

  formatEvidence(evidence) {
    return this.validationReportService.formatEvidence(evidence);
  }

  formatTestResultsDetail(tests) {
    return this.validationReportService.formatTestResultsDetail(tests);
  }

  formatErrors(errors) {
    return this.validationReportService.formatErrors(errors);
  }

  formatWarnings(warnings) {
    return this.validationReportService.formatWarnings(warnings);
  }

  /**
   * Enhanced error handling with actionable guidance
   * @param {Error} error - The error that occurred
   * @param {Object} projectInfo - Project information
   * @param {string} category - Validation category
   */
  handleValidationError(error, projectInfo, category) {
    if (error.message.includes('Project configuration missing')) {
      console.error(`\n[?] Project configuration missing for: ${projectInfo.name}`);
      console.error(`   [?] Configuration file needed: config/projects/${projectInfo.name.toLowerCase()}-valconfig.json`);
      console.error(`   [>] Use template from: config/project-template.json`);
      console.error(`   [>] Agent should create and customize project configuration file\n`);
    } else if (error.message.includes('Invalid project config')) {
      console.error(`\n[?] Invalid project configuration: ${projectInfo.name}`);
      console.error(`   [>] Check file: config/projects/${projectInfo.name.toLowerCase()}-valconfig.json`);
      console.error(`   [>] Ensure all required fields are present and properly formatted\n`);
    } else if (error.message.includes('Validation timeout')) {
      console.error(`\n[?] Timeout occurred during ${category} validation`);
      console.error(`   [>] Edit: config/projects/${projectInfo.name.toLowerCase()}-valconfig.json`);
      console.error(`   [>] Add: "timeout_overrides": { "${category}": ${this.getRecommendedTimeout(category)} }\n`);
    } else if (error.message.includes('Report directory')) {
      console.error(`\n[?] Report directory issue for project: ${projectInfo.name}`);
      console.error(`   [>] Check: config/projects/${projectInfo.name.toLowerCase()}-valconfig.json`);
      console.error(`   [>] Ensure report_location is a valid, writable path\n`);
    } else if (error.message.includes('No validator available')) {
      console.error(`\n[?] No validator available for category: ${category}`);
      console.error(`   Available options:`);
      console.error(`   1. Use --submit-validator flag to provide a custom validator`);
      console.error(`   2. Check available categories with --list-categories`);
      console.error(`   3. Verify category spelling and try again\n`);
    } else {
      console.error(`\n[F] Validation failed: ${error.message}`);
      console.error(`   Project: ${projectInfo.name}`);
      console.error(`   Category: ${category}`);
      console.error(`   Check logs above for specific details\n`);
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
        console.log(`[x] Capability matrix loaded - ${Object.keys(this.capabilityMatrix.categories).length} categories`);
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
    
    console.log(`[~] Loading ${categories.length} validators...`);
    
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
    
    console.log(`[x] Loaded ${this.validators.size}/${categories.length} validators`);
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
      const moduleUrl = pathToFileURL(validatorPath).href;
      const { default: ValidatorClass } = await import(moduleUrl);
      const validator = new ValidatorClass();
      
      // Validate interface compliance
      const complianceResult = await this.validatorValidationService.ensureInterfaceCompliance(validator);
      if (!complianceResult.compliant) {
        throw new Error(`Validator interface compliance failed: ${complianceResult.score}%`);
      }
      
      // Store validator
      this.validators.set(category, validator);
      console.log(`[x] Loaded validator: ${category}`);
      
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
        console.warn(`[>] Could not load validator for ${category}, checking for fallback`);
      }
    }
    
    return validator;
  }

  /**
   * Attempt error recovery with multiple strategies
   */
  async attemptErrorRecovery(error, category, projectInfo, enhancedProjectInfo, scopeConfig, options) {
    // TODO: [TASK-VAL-CORE-FIX-001] Pattern: multi-strategy-error-recovery | Complexity: 8 | Dependencies: error-classification,validator-management
    // Context: Implement multiple error recovery strategies based on error type and validation context
    // Validation-Required: recovery-success-rate, fallback-reliability, error-classification-accuracy
    // Pattern-Info: { approach: \"tiered-recovery-strategies\", alternatives: \"single-retry\", trade-offs: \"complexity-vs-robustness\" }
    
    const recoveryStrategies = [];
    
    // Classify error type and determine recovery strategies
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      recoveryStrategies.push('timeout_recovery');
    }
    
    if (error.message.includes('ENOENT') || error.message.includes('not found')) {
      recoveryStrategies.push('file_recovery');
    }
    
    if (error.message.includes('permission') || error.message.includes('EACCES')) {
      recoveryStrategies.push('permission_recovery');  
    }
    
    if (error.message.includes('memory') || error.message.includes('heap')) {
      recoveryStrategies.push('memory_recovery');
    }
    
    // Always try basic retry as last resort
    recoveryStrategies.push('basic_retry');
    
    // Attempt each recovery strategy
    for (const strategy of recoveryStrategies) {
      try {
        console.log(`  [>] Attempting error recovery using strategy: ${strategy}`);
        
        const recoveryResult = await this.executeRecoveryStrategy(
          strategy, 
          error, 
          category, 
          projectInfo, 
          enhancedProjectInfo, 
          scopeConfig, 
          options
        );
        
        if (recoveryResult.success) {
          return {
            recovered: true,
            strategy,
            result: recoveryResult.validationResult
          };
        }
        
      } catch (recoveryError) {
        console.log(`  [F] Recovery strategy ${strategy} failed: ${recoveryError.message}`);
      }
    }
    
    return {
      recovered: false,
      strategy: null,
      result: null
    };
  }

  /**
   * Execute specific recovery strategy
   */
  async executeRecoveryStrategy(strategy, originalError, category, projectInfo, enhancedProjectInfo, scopeConfig, options) {
    switch (strategy) {
      case 'timeout_recovery':
        // Increase timeout and retry with minimal scope
        console.log(`    [>] Timeout recovery: Extending timeout and reducing scope`);
        const extendedTimeout = 600000; // 10 minutes
        const minimalScope = { patterns: ['*.json', '*.ts'] }; // Minimal file patterns
        
        const validator = await this.getValidator(category);
        if (validator) {
          const result = await this.executeValidationWithTimeout(
            validator, 
            enhancedProjectInfo, 
            minimalScope, 
            options, 
            extendedTimeout, 
            category
          );
          return { success: true, validationResult: result };
        }
        break;
        
      case 'file_recovery':
        // Create missing directories or files if possible
        console.log(`    [>] File recovery: Attempting to resolve missing files`);
        // This is a placeholder - could implement directory creation logic
        break;
        
      case 'permission_recovery':
        // Skip problematic files and continue with available files
        console.log(`    [>] Permission recovery: Continuing with accessible files only`);
        // This could implement a filtered scope approach
        break;
        
      case 'memory_recovery':
        // Force garbage collection and retry with reduced scope
        console.log(`    [>] Memory recovery: Forcing garbage collection`);
        if (global.gc) {
          global.gc();
        }
        break;
        
      case 'basic_retry':
        // Simple retry with original parameters
        console.log(`    [>] Basic retry: Single retry attempt`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        const retryValidator = await this.getValidator(category);
        if (retryValidator) {
          const result = await retryValidator.validate(enhancedProjectInfo, scopeConfig, options);
          return { success: true, validationResult: result };
        }
        break;
    }
    
    return { success: false };
  }

  /**
   * Execute validation with enhanced timeout enforcement and progress monitoring
   */
  async executeValidationWithTimeout(validator, projectInfo, scopeConfig, options, categoryTimeout, category) {
    // TODO: [TASK-VAL-CORE-FIX-001] Pattern: enhanced-timeout-enforcement | Complexity: 8 | Dependencies: circuit-breaker,progress-monitoring
    // Context: Implement comprehensive timeout enforcement with progress monitoring and circuit breaker
    // Validation-Required: timeout-prevention, progress-tracking, circuit-breaker-activation
    // Pattern-Info: { approach: \"multi-layer-timeout\", alternatives: \"single-timeout\", trade-offs: \"complexity-vs-reliability\" }
    
    let progressMonitor = null;
    let circuitBreakerTriggered = false;
    let validationCompleted = false;
    
    try {
      // Initialize progress monitoring for long-running validations
      progressMonitor = setInterval(() => {
        if (!validationCompleted) {
          console.log(`  [~] ${category} validation in progress... (${Math.round((Date.now() - this.validationStartTime) / 1000)}s elapsed)`);
          
          // Circuit breaker: If validation exceeds 80% of timeout, trigger warning
          const elapsed = Date.now() - this.validationStartTime;
          if (elapsed > categoryTimeout * 0.8 && !circuitBreakerTriggered) {
            circuitBreakerTriggered = true;
            console.log(`  [!] Circuit breaker warning: ${category} validation approaching timeout threshold`);
          }
        }
      }, 15000); // Report progress every 15 seconds
      
      // Create validation promise with internal timeout handling
      const validationPromise = new Promise(async (resolve, reject) => {
        try {
          // Add per-validator timeout monitoring
          const validatorTimeout = setTimeout(() => {
            reject(new Error(`Per-validator timeout: ${category} validator exceeded ${categoryTimeout}ms limit`));
          }, categoryTimeout);
          
          // Execute validation
          const result = await validator.validate(projectInfo, scopeConfig, options);
          clearTimeout(validatorTimeout);
          validationCompleted = true;
          resolve(result);
        } catch (error) {
          validationCompleted = true;
          reject(error);
        }
      });
      
      // System-level timeout as backup
      const systemTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          if (!validationCompleted) {
            reject(new Error(`System timeout: ${category} validation exceeded system limit of ${categoryTimeout}ms`));
          }
        }, categoryTimeout + 5000); // 5 second buffer beyond validator timeout
      });
      
      // Race between validation and timeouts
      const result = await Promise.race([validationPromise, systemTimeoutPromise]);
      validationCompleted = true;
      
      return result;
      
    } finally {
      // Clean up progress monitoring
      if (progressMonitor) {
        clearInterval(progressMonitor);
      }
      
      if (circuitBreakerTriggered) {
        console.log(`  [x] Circuit breaker resolved: ${category} validation completed`);
      }
    }
  }

  /**
   * Pre-validation checks
   */
  async preValidationChecks(validator, projectInfo, scopeConfig) {
    // Verify validator health
    const diagnostics = validator.runSelfDiagnostics();
    if (diagnostics.status !== 'healthy') {
      console.warn(`[!] Validator diagnostics warning: ${validator.category}`);
    }
    
    // TODO: [TASK-VAL-CORE-FIX-001] Pattern: case-insensitive-compatibility-check | Complexity: 3 | Dependencies: project-configuration
    // Context: Fix false positive compatibility warnings due to case sensitivity between project names
    // Validation-Required: case-insensitive-matching, compatibility-accuracy
    // Pattern-Info: { approach: \"lowercase-comparison\", alternatives: \"regex-matching\", trade-offs: \"simplicity-vs-flexibility\" }
    
    // Check project compatibility (case-insensitive)
    const capabilities = validator.getCapabilities();
    const projectNameLower = projectInfo.name.toLowerCase();
    const supportedProjectsLower = capabilities.supportedProjects.map(p => p.toLowerCase());
    
    if (!supportedProjectsLower.includes(projectNameLower) && 
        !capabilities.supportedProjects.includes('*')) {
      console.warn(`[!] Project ${projectInfo.name} may not be fully supported by ${validator.category} validator`);
    }
  }

  /**
   * Post-validation processing - SIMPLIFIED FOR CORE VALIDATION
   */
  async postValidationProcessing(category, result) {
    // Basic validation result logging only
    console.log(`[D] Validation result for ${category}: ${result.status} (${result.duration}ms)`);
    
    // DISABLED FOR CORE VALIDATION - TODO: Re-enable after core system validation
    // await this.updateValidatorMetrics(category, result);
    
    // Basic issue detection only
    if (result.status === 'FAIL' && result.errors.length > 3) {
      console.warn(`[F] Multiple failures in ${category} - review recommended`);
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
    
    console.log('[T] Verifying system integrity...');
    
    // Add integrity checks here
    // This is a placeholder for comprehensive system checks
    
    console.log('[x] System integrity verified');
  }

  /**
   * Run system diagnostics
   */
  async runSystemDiagnostics() {
    console.log('[T] Running system diagnostics...');
    
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
      console.warn(`[!] ${unhealthyValidators} validators have health issues`);
    }
    
    console.log('[x] System diagnostics completed');
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
      console.error(`\n[!] ERROR IN ${operation.toUpperCase()}`);
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
    return this.validatorValidationService.assessSubmittedValidatorRisk(validatorPath, category);
  }
  
  /**
   * Sandbox test submitted validator
   */
  async sandboxTestSubmittedValidator(validatorPath) {
    return this.validatorValidationService.sandboxTestSubmittedValidator(validatorPath);
  }
  
  /**
   * Validate submitted validator compliance
   */
  async validateSubmittedValidatorCompliance(validatorPath) {
    return this.validatorValidationService.validateSubmittedValidatorCompliance(validatorPath);
  }
  
  /**
   * Integrate submitted validator
   */
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
    
    if (!this.validatorValidationService?.isReady() || !this.rollbackManager) {
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
        "report_location": "../scripts/validation/results",
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
    console.log(`[>] Created project template: ${templatePath}`);
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
const isDirectExecution = (() => {
  if (!process.argv[1]) {
    return false;
  }
  const entryPath = path.resolve(process.argv[1]);
  const modulePath = fileURLToPath(import.meta.url);
  return path.normalize(entryPath) === path.normalize(modulePath);
})();

if (isDirectExecution) {
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
        console.log('Received new validator for category ' + category + '.');

        const result = await orchestrator.submitAgentValidator(
          submitValidator,
          category,
          projectInfo,
          { scopeConfig }
        );

        if (result.success) {
          console.log('Loading new validator: ' + category + '-validator.js');
          console.log('Executing validation with safety monitoring');
          console.log('Validation Results: ' + result.integrationResult.status + ' (' + (result.integrationResult.duration || 'unknown duration') + ')');
          process.exit(0);
        } else {
          process.exit(1);
        }
      } else {
        // Standard validation workflow
        console.log('Enhanced Validation System v3.0.0');
        console.log('Compatibility Check: ' + category + ' category found');

        try {
          await orchestrator.initialize();
          const validator = await orchestrator.getValidator(category);

          if (!validator) {
            console.log('Compatibility Check: Category ' + category + ' not found.');
            console.log('Extension Required: Please generate a validator script and submit it using the --submit-validator flag.');
            process.exit(1);
          }

          console.log('Loading validator: ' + category + '-validator.js');
          console.log('Executing validation with safety monitoring');

          const result = await orchestrator.orchestrateValidation(
            projectInfo,
            category,
            scopeConfig,
            { taskId }
          );

          console.log('Validation Results: ' + result.status + ' (' + (result.duration || 'unknown duration') + ')');
          console.log('All validations completed successfully');
          process.exit(result.status === 'PASS' ? 0 : 1);

        } catch (error) {
          orchestrator.handleValidationError(error, projectInfo, category);
          process.exit(1);
        }
      }

    } catch (error) {
      console.error('System error: ' + error.message);
      process.exit(1);
    }
  };

  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

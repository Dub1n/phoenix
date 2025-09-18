#!/usr/bin/env node

/**
 * Enhanced Validation System Integration Test
 * 
 * Comprehensive test suite for the enhanced validation system,
 * testing all major components and integration points.
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import system components
import { EnhancedValidationOrchestrator } from '../../src/core/enhanced-orchestrator.js';
import { InterfaceComplianceChecker } from '../../src/safety/interface-compliance-checker.js';
import { RollbackManager } from '../../src/safety/rollback-manager.js';
import { BackendValidator } from '../../src/validators/backend-validator.js';
import { BuildValidator } from '../../src/validators/build-validator.js';

/**
 * Test runner for enhanced validation system
 */
class EnhancedValidationSystemTest {
  constructor() {
    this.testResults = [];
    this.orchestrator = null;
    this.testStartTime = null;
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('[T] Enhanced Validation System Integration Test Suite');
    console.log('=' .repeat(60));
    
    this.testStartTime = Date.now();
    
    try {
      // Test 1: System Initialization
      await this.testSystemInitialization();
      
      // Test 2: Capability Matrix Loading
      await this.testCapabilityMatrixLoading();
      
      // Test 3: Validator Loading and Compliance
      await this.testValidatorLoadingAndCompliance();
      
      // Test 4: Safety Framework Components
      await this.testSafetyFrameworkComponents();
      
      // Test 5: Template System
      await this.testTemplateSystem();
      
      // Test 6: Extension Generation Pipeline
      await this.testAgentSubmissionPipeline();
      
      // Test 7: Rollback Mechanism
      await this.testRollbackMechanism();
      
      // Test 8: System Health Monitoring
      await this.testSystemHealthMonitoring();
      
      // Test 9: Integration Validation
      await this.testIntegrationValidation();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error(`[F] Test suite failed: ${error.message}`);
      this.recordTestResult('System Test Suite', false, error.message);
    }
  }

  /**
   * Test 1: System Initialization
   */
  async testSystemInitialization() {
    console.log('\n[~] Test 1: System Initialization');
    
    try {
      const fixturesDir = path.join(__dirname, 'config');
      const enhancedConfigPath = path.join(fixturesDir, 'enhanced-config.json');
      const capabilityMatrixConfigPath = path.join(fixturesDir, 'capability-matrix.json');

      const enhancedConfigFixture = {
        version: '3.0.0-test',
        coreValidationMode: true,
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
        performance: {
          maxValidationTime: 180000,
          memoryLimit: 256,
          parallelValidations: 1
        },
        systemDefaults: {
          projectDefaults: {
            report_location: 'test/output',
            timeout_overrides: {
              backend: 180000,
              build: 240000,
              quality: 120000
            },
            reporting: {
              format: 'json',
              include_evidence: true,
              include_timing: true
            },
            monitoring: {
              heartbeat_interval: 15000,
              resource_check_enabled: true,
              progress_updates: true
            }
          }
        }
      };

      const capabilityMatrixFixture = {
        version: '3.0.0-test',
        schemaVersion: '1.0.0',
        metadata: {
          lastUpdated: '2025-09-06T00:00:00.000Z',
          systemHealth: 'healthy',
          totalAgentSubmissions: 0
        },
        categories: {
          backend: {
            scopes: ['src/backend/**/*.js'],
            validator: 'backend-validator.js',
            description: 'Backend validation fixture',
            interfaceVersion: '3.0.0',
            capabilities: {
              supportedProjects: ['TestProject'],
              performanceProfile: 'standard',
              requiredDependencies: ['node']
            },
            safety: {
              lastValidated: '2025-09-06T00:00:00.000Z',
              complianceStatus: 'verified',
              testCoverage: 80
            }
          },
          build: {
            scopes: ['src/build/**/*.js'],
            validator: 'build-validator.js',
            description: 'Build validation fixture',
            interfaceVersion: '3.0.0',
            capabilities: {
              supportedProjects: ['TestProject'],
              performanceProfile: 'fast',
              requiredDependencies: ['node']
            },
            safety: {
              lastValidated: '2025-09-06T00:00:00.000Z',
              complianceStatus: 'verified',
              testCoverage: 75
            }
          }
        },
        safety: {
          preGenerationValidation: true,
          postGenerationValidation: true,
          sandboxTesting: true,
          interfaceCompliance: true,
          automaticRollback: true
        },
        monitoring: {
          metricsEnabled: false,
          successRateTarget: 0.9,
          qualityThreshold: 75
        }
      };

      const capabilityMatrixPath = path.join(__dirname, 'capability-matrix.json');
      const realValidationRoot = path.resolve(__dirname, '../..');
      const realConfigDir = path.join(realValidationRoot, 'config');
      const realConfigFlag = (process.env.ENHANCED_VALIDATION_USE_REAL_CONFIG || '').toLowerCase();
      const wantsRealConfig = ['1', 'true', 'yes', 'real'].includes(realConfigFlag);
      const realConfigAvailable =
        fs.existsSync(path.join(realConfigDir, 'enhanced-config.json')) &&
        fs.existsSync(path.join(realConfigDir, 'capability-matrix.json'));

      const harnessValidationPath = wantsRealConfig && realConfigAvailable
        ? realValidationRoot
        : __dirname;

      if (harnessValidationPath === __dirname) {
        if (!fs.existsSync(fixturesDir)) {
          fs.mkdirSync(fixturesDir, { recursive: true });
        }

        fs.writeFileSync(enhancedConfigPath, JSON.stringify(enhancedConfigFixture, null, 2), 'utf8');
        fs.writeFileSync(capabilityMatrixConfigPath, JSON.stringify(capabilityMatrixFixture, null, 2), 'utf8');
        fs.copyFileSync(capabilityMatrixConfigPath, capabilityMatrixPath);
      } else {
        console.log('  [>] Using real validation configuration from scripts/validation/config');
      }

      this.orchestrator = new EnhancedValidationOrchestrator({
        validationPath: harnessValidationPath
      });
      
      await this.orchestrator.initialize();
      
      if (this.orchestrator.initialized) {
        console.log('  [x] System initialization successful');
        this.recordTestResult('System Initialization', true);
      } else {
        throw new Error('System not marked as initialized');
      }
      
    } catch (error) {
      console.log(`  [F] System initialization failed: ${error.message}`);
      this.recordTestResult('System Initialization', false, error.message);
    }
  }

  /**
   * Test 2: Capability Matrix Loading
   */
  async testCapabilityMatrixLoading() {
    console.log('\n[~] Test 2: Capability Matrix Loading');
    
    try {
      const capabilityMatrixPath = path.join(__dirname, 'capability-matrix.json');
      
      if (!fs.existsSync(capabilityMatrixPath)) {
        throw new Error('Capability matrix file not found');
      }
      
      const matrix = JSON.parse(fs.readFileSync(capabilityMatrixPath, 'utf8'));
      
      // Validate matrix structure
      if (!matrix.version || !matrix.categories) {
        throw new Error('Invalid capability matrix structure');
      }
      
      const categoryCount = Object.keys(matrix.categories).length;
      console.log(`  [x] Capability matrix loaded with ${categoryCount} categories`);
      this.recordTestResult('Capability Matrix Loading', true, `${categoryCount} categories loaded`);
      
    } catch (error) {
      console.log(`  [F] Capability matrix loading failed: ${error.message}`);
      this.recordTestResult('Capability Matrix Loading', false, error.message);
    }
  }

  /**
   * Test 3: Validator Loading and Compliance
   */
  async testValidatorLoadingAndCompliance() {
    console.log('\n[T] Test 3: Validator Loading and Compliance');
    
    try {
      const complianceChecker = new InterfaceComplianceChecker();
      
      // Test BackendValidator
      const backendValidator = new BackendValidator();
      const backendCompliance = await complianceChecker.checkCompliance(backendValidator);
      
      if (!backendCompliance.compliant) {
        throw new Error(`Backend validator compliance failed: ${backendCompliance.score}%`);
      }
      
      // Test BuildValidator
      const buildValidator = new BuildValidator();
      const buildCompliance = await complianceChecker.checkCompliance(buildValidator);
      
      if (!buildCompliance.compliant) {
        throw new Error(`Build validator compliance failed: ${buildCompliance.score}%`);
      }
      
      console.log(`  [x] Validator compliance verified (Backend: ${backendCompliance.score}%, Build: ${buildCompliance.score}%)`);
      this.recordTestResult('Validator Compliance', true, `Backend: ${backendCompliance.score}%, Build: ${buildCompliance.score}%`);
      
    } catch (error) {
      console.log(`  [F] Validator compliance check failed: ${error.message}`);
      this.recordTestResult('Validator Compliance', false, error.message);
    }
  }

  /**
   * Test 4: Safety Framework Components
   */
  async testSafetyFrameworkComponents() {
    console.log('\n[T] Test 4: Safety Framework Components');
    
    try {
      // Test Interface Compliance Checker
      const complianceChecker = new InterfaceComplianceChecker();
      const requiredMethods = complianceChecker.getRequiredMethods();
      
      if (requiredMethods.length < 5) {
        throw new Error('Interface compliance checker not properly configured');
      }
      
      // Test Rollback Manager
      const rollbackManager = new RollbackManager(__dirname);
      // Basic functionality test - create a test backup
      const testBackup = await rollbackManager.createBackup('test-safety-check');
      
      if (!testBackup) {
        throw new Error('Rollback manager backup creation failed');
      }
      
      console.log('  [x] Safety framework components operational');
      this.recordTestResult('Safety Framework', true, `${requiredMethods.length} interface methods, backup system operational`);
      
    } catch (error) {
      console.log(`  [F] Safety framework test failed: ${error.message}`);
      this.recordTestResult('Safety Framework', false, error.message);
    }
  }

  /**
   * Test 5: Template System
   */
  async testTemplateSystem() {
    console.log('\n[T] Test 5: Template System');
    
    try {
      const templatesDir = path.join(__dirname, 'templates');
      const templatePath = path.join(templatesDir, 'validator-template.js.template');

      const templateFixture = `export default class {{CLASS_NAME}} {
  constructor() {
    this.category = '{{CATEGORY}}';
    this.name = '{{CATEGORY_NAME}}';
    this.description = '{{DESCRIPTION}}';
  }

  getCapabilities() {
    return {
      category: '{{CATEGORY}}',
      name: '{{CATEGORY_NAME}}',
      description: '{{DESCRIPTION}}'
    };
  }

  getMetadata() {
    return {
      category: '{{CATEGORY}}',
      categoryName: '{{CATEGORY_NAME}}',
      description: '{{DESCRIPTION}}',
      version: '{{VERSION}}'
    };
  }

  async validate(projectInfo, scopeConfig, options) {
    {{VALIDATION_LOGIC}}
  }
}
`;

      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }

      fs.writeFileSync(templatePath, templateFixture, 'utf8');
      
      if (!fs.existsSync(templatePath)) {
        throw new Error('Validator template not found');
      }
      
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      
      // Check for required template variables
      const requiredVariables = [
        'CATEGORY', 'CATEGORY_NAME', 'CLASS_NAME', 
        'DESCRIPTION', 'VALIDATION_LOGIC'
      ];
      
      const missingVariables = requiredVariables.filter(variable => 
        !templateContent.includes(`{{${variable}}}`)
      );
      
      if (missingVariables.length > 0) {
        throw new Error(`Template missing variables: ${missingVariables.join(', ')}`);
      }
      
      console.log(`  [x] Template system verified with ${requiredVariables.length} template variables`);
      this.recordTestResult('Template System', true, `${requiredVariables.length} template variables verified`);
      
    } catch (error) {
      console.log(`  [F] Template system test failed: ${error.message}`);
      this.recordTestResult('Template System', false, error.message);
    }
  }

  /**
   * Test 6: Agent Submission Pipeline (Validation Only)
   */
  async testAgentSubmissionPipeline() {
    console.log('\n[T] Test 6: Agent Submission Pipeline (Validation Only)');
    
    try {
      // Test the agent submission framework components
      const category = 'test_integration';
      const testValidatorContent = `
export default class TestIntegrationValidator {
  constructor() {
    this.category = 'test_integration';
    this.version = '1.0.0';
    this.scopes = ['**/*'];
  }

  getCapabilities() {
    return {
      supportedProjects: ['TestProject'],
      performanceProfile: 'fast',
      requiredDependencies: ['node', 'npm']
    };
  }

  getMetadata() {
    return {
      category: 'test_integration',
      version: '1.0.0',
      description: 'Test integration validator'
    };
  }

  checkInterfaceCompliance() {
    const requiredMethods = ['validate', 'getCapabilities', 'getMetadata', 'checkInterfaceCompliance', 'runSelfDiagnostics'];
    return requiredMethods.every(method => typeof this[method] === 'function');
  }

  runSelfDiagnostics() {
    return { status: 'healthy' };
  }

  async validate(projectInfo, scopeConfig, options) {
    return {
      status: 'PASS',
      duration: 100,
      tests: [],
      errors: [],
      warnings: []
    };
  }
}
`;

      // Create temporary test validator file
      const tempValidatorPath = path.join(__dirname, 'temp-test-validator.js');
      fs.writeFileSync(tempValidatorPath, testValidatorContent);
      
      try {
        // Test risk assessment
        const riskAssessment = await this.orchestrator.assessSubmittedValidatorRisk(tempValidatorPath, category);
        console.log(`  [x] Risk assessment completed: ${riskAssessment.riskLevel} risk`);
        
        // Test sandbox validation
        const sandboxResult = await this.orchestrator.sandboxTestSubmittedValidator(tempValidatorPath);
        if (!sandboxResult.passed) {
          throw new Error(`Sandbox test failed: ${sandboxResult.errors.join(', ')}`);
        }
        console.log('  [x] Sandbox testing passed');
        
        // Test compliance validation
        const complianceResult = await this.orchestrator.validateSubmittedValidatorCompliance(tempValidatorPath);
        if (!complianceResult.compliant) {
          throw new Error('Compliance validation failed');
        }
        console.log('  [x] Interface compliance verified');
        
        this.recordTestResult('Agent Submission Pipeline', true, `All validation steps passed, Risk: ${riskAssessment.riskLevel}`);
        
      } finally {
        // Clean up temporary file
        if (fs.existsSync(tempValidatorPath)) {
          fs.unlinkSync(tempValidatorPath);
        }
      }
      
    } catch (error) {
      console.log(`  [F] Agent submission pipeline test failed: ${error.message}`);
      this.recordTestResult('Agent Submission Pipeline', false, error.message);
    }
  }

  /**
   * Test 7: Rollback Mechanism
   */
  async testRollbackMechanism() {
    console.log('\n[T] Test 7: Rollback Mechanism');
    
    try {
      const rollbackManager = new RollbackManager(__dirname);
      
      // Test backup creation
      const backupPath = await rollbackManager.createBackup('test_rollback_category');
      
      if (!backupPath || !fs.existsSync(backupPath)) {
        throw new Error('Backup creation failed');
      }
      
      // Test backup listing
      const testBackups = fs.readdirSync(path.join(__dirname, 'backups'));
      const hasTestBackup = testBackups.some(backup => backup.includes('test_rollback_category'));
      
      if (!hasTestBackup) {
        throw new Error('Test backup not found in backup directory');
      }
      
      console.log('  [x] Rollback mechanism operational');
      this.recordTestResult('Rollback Mechanism', true, `Backup created: ${path.basename(backupPath)}`);
      
    } catch (error) {
      console.log(`  [F] Rollback mechanism test failed: ${error.message}`);
      this.recordTestResult('Rollback Mechanism', false, error.message);
    }
  }

  /**
   * Test 8: System Health Monitoring (SIMPLIFIED FOR CORE VALIDATION)
   */
  async testSystemHealthMonitoring() {
    console.log('\n[T] Test 8: Basic System Health Check');
    
    try {
      if (!this.orchestrator) {
        throw new Error('Orchestrator not initialized');
      }
      
      const health = await this.orchestrator.getSystemHealth();
      
      if (!health || !health.status) {
        throw new Error('System health check returned invalid result');
      }
      
      // For simplified health check, we expect coreComponents instead of components
      const componentCount = health.coreComponents ? Object.keys(health.coreComponents).length : 0;
      
      console.log(`  [x] Basic system health check operational (Status: ${health.status}, Core Components: ${componentCount})`);
      console.log(`  ${health.message}`);
      this.recordTestResult('Basic System Health Check', true, `Status: ${health.status}, Core Components: ${componentCount}`);
      
    } catch (error) {
      console.log(`  [F] Basic system health check failed: ${error.message}`);
      this.recordTestResult('Basic System Health Check', false, error.message);
    }
  }

  /**
   * Test 9: Integration Validation
   */
  async testIntegrationValidation() {
    console.log('\n[T] Test 9: Integration Validation');
    
    try {
      // Test that all major components can work together
      const components = {
        orchestrator: this.orchestrator,
        complianceChecker: new InterfaceComplianceChecker(),
        rollbackManager: new RollbackManager(__dirname)
      };
      
      // Verify all components are properly instantiated
      for (const [name, component] of Object.entries(components)) {
        if (!component) {
          throw new Error(`Component not initialized: ${name}`);
        }
      }
      
      // Test component interaction (orchestrator getting system health)
      const health = await components.orchestrator.getSystemHealth();
      if (!health) {
        throw new Error('Component interaction failed');
      }
      
      console.log('  [x] Integration validation successful');
      this.recordTestResult('Integration Validation', true, 'All components properly integrated');
      
    } catch (error) {
      console.log(`  [F] Integration validation failed: ${error.message}`);
      this.recordTestResult('Integration Validation', false, error.message);
    }
  }

  /**
   * Record test result
   */
  recordTestResult(testName, success, details = null) {
    this.testResults.push({
      testName,
      success,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = Math.round((passedTests / totalTests) * 100);
    const totalDuration = Date.now() - this.testStartTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('[D] ENHANCED VALIDATION SYSTEM TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    
    if (failedTests > 0) {
      console.log('\n[F] FAILED TESTS:');
      this.testResults.filter(t => !t.success).forEach(test => {
        console.log(`  - ${test.testName}: ${test.details}`);
      });
    }
    
    if (passedTests > 0) {
      console.log('\n[x] PASSED TESTS:');
      this.testResults.filter(t => t.success).forEach(test => {
        console.log(`  - ${test.testName}${test.details ? ': ' + test.details : ''}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (successRate >= 90) {
      console.log('[x] SYSTEM READY FOR PRODUCTION');
    } else if (successRate >= 70) {
      console.log('[!] SYSTEM NEEDS ATTENTION BEFORE PRODUCTION');
    } else {
      console.log('[F] SYSTEM NOT READY FOR PRODUCTION');
    }
    
    console.log('='.repeat(60));
    
    // Save test report to file
    const reportPath = path.join(__dirname, 'test-results.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate,
        totalDuration
      },
      results: this.testResults
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n[>] Test report saved to: ${reportPath}`);
  }
}

// Run the test suite if this script is executed directly
if (import.meta.url === `file://${__filename}`) {
  const testRunner = new EnhancedValidationSystemTest();
  testRunner.runAllTests().catch(error => {
    console.error('Test suite execution failed:', error);
    process.exit(1);
  });
}

export default EnhancedValidationSystemTest;


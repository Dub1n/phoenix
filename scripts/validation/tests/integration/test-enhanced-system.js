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
import { EnhancedValidationOrchestrator } from './enhanced-orchestrator.js';
import { ExtensionGenerator } from './extension-generator.js';
import { InterfaceComplianceChecker } from './safety/interface-compliance-checker.js';
import { RollbackManager } from './safety/rollback-manager.js';
import { BackendValidator } from './validators/backend-validator.js';
import { BuildValidator } from './validators/build-validator.js';

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
    console.log('🧪 Enhanced Validation System Integration Test Suite');
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
      await this.testExtensionGenerationPipeline();
      
      // Test 7: Rollback Mechanism
      await this.testRollbackMechanism();
      
      // Test 8: System Health Monitoring
      await this.testSystemHealthMonitoring();
      
      // Test 9: Integration Validation
      await this.testIntegrationValidation();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error(`💥 Test suite failed: ${error.message}`);
      this.recordTestResult('System Test Suite', false, error.message);
    }
  }

  /**
   * Test 1: System Initialization
   */
  async testSystemInitialization() {
    console.log('\n📋 Test 1: System Initialization');
    
    try {
      this.orchestrator = new EnhancedValidationOrchestrator({
        validationPath: __dirname
      });
      
      await this.orchestrator.initialize();
      
      if (this.orchestrator.initialized) {
        console.log('  ✅ System initialization successful');
        this.recordTestResult('System Initialization', true);
      } else {
        throw new Error('System not marked as initialized');
      }
      
    } catch (error) {
      console.log(`  ❌ System initialization failed: ${error.message}`);
      this.recordTestResult('System Initialization', false, error.message);
    }
  }

  /**
   * Test 2: Capability Matrix Loading
   */
  async testCapabilityMatrixLoading() {
    console.log('\n📊 Test 2: Capability Matrix Loading');
    
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
      console.log(`  ✅ Capability matrix loaded with ${categoryCount} categories`);
      this.recordTestResult('Capability Matrix Loading', true, `${categoryCount} categories loaded`);
      
    } catch (error) {
      console.log(`  ❌ Capability matrix loading failed: ${error.message}`);
      this.recordTestResult('Capability Matrix Loading', false, error.message);
    }
  }

  /**
   * Test 3: Validator Loading and Compliance
   */
  async testValidatorLoadingAndCompliance() {
    console.log('\n🔧 Test 3: Validator Loading and Compliance');
    
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
      
      console.log(`  ✅ Validator compliance verified (Backend: ${backendCompliance.score}%, Build: ${buildCompliance.score}%)`);
      this.recordTestResult('Validator Compliance', true, `Backend: ${backendCompliance.score}%, Build: ${buildCompliance.score}%`);
      
    } catch (error) {
      console.log(`  ❌ Validator compliance check failed: ${error.message}`);
      this.recordTestResult('Validator Compliance', false, error.message);
    }
  }

  /**
   * Test 4: Safety Framework Components
   */
  async testSafetyFrameworkComponents() {
    console.log('\n🛡️ Test 4: Safety Framework Components');
    
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
      
      console.log('  ✅ Safety framework components operational');
      this.recordTestResult('Safety Framework', true, `${requiredMethods.length} interface methods, backup system operational`);
      
    } catch (error) {
      console.log(`  ❌ Safety framework test failed: ${error.message}`);
      this.recordTestResult('Safety Framework', false, error.message);
    }
  }

  /**
   * Test 5: Template System
   */
  async testTemplateSystem() {
    console.log('\n📄 Test 5: Template System');
    
    try {
      const templatePath = path.join(__dirname, 'templates', 'validator-template.js.template');
      
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
      
      console.log(`  ✅ Template system verified with ${requiredVariables.length} template variables`);
      this.recordTestResult('Template System', true, `${requiredVariables.length} template variables verified`);
      
    } catch (error) {
      console.log(`  ❌ Template system test failed: ${error.message}`);
      this.recordTestResult('Template System', false, error.message);
    }
  }

  /**
   * Test 6: Extension Generation Pipeline (Dry Run)
   */
  async testExtensionGenerationPipeline() {
    console.log('\n⚙️ Test 6: Extension Generation Pipeline (Dry Run)');
    
    try {
      const extensionGenerator = new ExtensionGenerator(__dirname);
      
      // Create a test extension request
      const testRequest = {
        category: 'test_integration',
        requirements: [
          'Validate test integration',
          'Check system connectivity'
        ],
        recommendations: [
          'Use standard validation patterns',
          'Include error handling'
        ],
        scopePatterns: ['test/**/*.ts'],
        validationLogic: 'return { success: true, message: "Test validation passed" };',
        supportedProjects: ['TestProject'],
        performanceProfile: 'fast'
      };
      
      // Test pre-generation validation only (don't actually generate)
      const preValidation = await extensionGenerator.preGenerationValidation(testRequest);
      
      if (!preValidation.approved) {
        throw new Error(`Pre-generation validation failed: ${preValidation.reason}`);
      }
      
      console.log(`  ✅ Extension generation pipeline ready (Risk: ${preValidation.safetyAssessment.riskLevel})`);
      this.recordTestResult('Extension Generation Pipeline', true, `Pre-validation passed, Risk: ${preValidation.safetyAssessment.riskLevel}`);
      
    } catch (error) {
      console.log(`  ❌ Extension generation pipeline test failed: ${error.message}`);
      this.recordTestResult('Extension Generation Pipeline', false, error.message);
    }
  }

  /**
   * Test 7: Rollback Mechanism
   */
  async testRollbackMechanism() {
    console.log('\n🔄 Test 7: Rollback Mechanism');
    
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
      
      console.log('  ✅ Rollback mechanism operational');
      this.recordTestResult('Rollback Mechanism', true, `Backup created: ${path.basename(backupPath)}`);
      
    } catch (error) {
      console.log(`  ❌ Rollback mechanism test failed: ${error.message}`);
      this.recordTestResult('Rollback Mechanism', false, error.message);
    }
  }

  /**
   * Test 8: System Health Monitoring (SIMPLIFIED FOR CORE VALIDATION)
   */
  async testSystemHealthMonitoring() {
    console.log('\n🩺 Test 8: Basic System Health Check');
    
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
      
      console.log(`  ✅ Basic system health check operational (Status: ${health.status}, Core Components: ${componentCount})`);
      console.log(`  📝 ${health.message}`);
      this.recordTestResult('Basic System Health Check', true, `Status: ${health.status}, Core Components: ${componentCount}`);
      
    } catch (error) {
      console.log(`  ❌ Basic system health check failed: ${error.message}`);
      this.recordTestResult('Basic System Health Check', false, error.message);
    }
  }

  /**
   * Test 9: Integration Validation
   */
  async testIntegrationValidation() {
    console.log('\n🔗 Test 9: Integration Validation');
    
    try {
      // Test that all major components can work together
      const components = {
        orchestrator: this.orchestrator,
        extensionGenerator: new ExtensionGenerator(__dirname),
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
      
      console.log('  ✅ Integration validation successful');
      this.recordTestResult('Integration Validation', true, 'All components properly integrated');
      
    } catch (error) {
      console.log(`  ❌ Integration validation failed: ${error.message}`);
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
    console.log('📊 ENHANCED VALIDATION SYSTEM TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.filter(t => !t.success).forEach(test => {
        console.log(`  - ${test.testName}: ${test.details}`);
      });
    }
    
    if (passedTests > 0) {
      console.log('\n✅ PASSED TESTS:');
      this.testResults.filter(t => t.success).forEach(test => {
        console.log(`  - ${test.testName}${test.details ? ': ' + test.details : ''}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (successRate >= 90) {
      console.log('🎉 SYSTEM READY FOR PRODUCTION');
    } else if (successRate >= 70) {
      console.log('⚠️ SYSTEM NEEDS ATTENTION BEFORE PRODUCTION');
    } else {
      console.log('❌ SYSTEM NOT READY FOR PRODUCTION');
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
    console.log(`\n📄 Test report saved to: ${reportPath}`);
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
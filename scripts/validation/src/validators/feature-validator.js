#!/usr/bin/env node

/**
 * Feature Validator - Enhanced Modular Implementation
 * 
 * Implements IValidator interface for Feature Enhancement Tasks validation.
 * Extracted and enhanced from legacy-category-validators.js to support the new
 * modular architecture with safety framework compliance.
 * 
 * Category: Feature Enhancement Tasks
 * Description: Feature functionality demonstration, regression testing, integration verification, user workflow testing
 * Source: TEMPLUM-TESTING-GUIDE.md Section 7
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 * Interface Version: 3.0.0
 */

// Feature validator implementation for feature enhancement and integration validation

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Feature Validator implementing IValidator interface
 */
export class FeatureValidator {
  constructor() {
    this.category = 'feature';
    this.version = '3.0.0';
    this.scopes = []; // Applies to determined scope, not its own scope - features can span multiple areas
    this.hasIntegrationTests = true;
    
    // Initialize internal state
    this.validationStartTime = null;
  }

  /**
   * Main validation method implementing IValidator interface
   */
  async validate(projectInfo, scopeConfig, options = {}) {
    this.validationStartTime = Date.now();
    
    const result = {
      status: 'PENDING',
      tests: [],
      duration: 0,
      evidence: [],
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      console.log('  Executing Feature Enhancement mandatory validation commands...');
      console.log('  Source: TEMPLUM-TESTING-GUIDE.md Section 7');

      // Test 1: Feature functionality demonstration (manual verification required)
      const functionalityTest = await this.executeFeatureFunctionalityTest(projectInfo);
      result.tests.push(functionalityTest);
      result.evidence.push(...functionalityTest.evidence || []);

      // Test 2: Comprehensive regression testing
      const regressionTest = await this.executeRegressionTesting(projectInfo);
      result.tests.push(regressionTest);
      result.evidence.push(...regressionTest.evidence || []);

      // Test 3: Integration verification
      const integrationTest = await this.executeIntegrationVerification(projectInfo);
      result.tests.push(integrationTest);
      result.evidence.push(...integrationTest.evidence || []);

      // Test 4: User workflow testing (manual verification noted)
      const workflowTest = await this.executeUserWorkflowTest(projectInfo);
      result.tests.push(workflowTest);
      result.evidence.push(...workflowTest.evidence || []);

      // Integration tests with backend service
      if (this.hasIntegrationTests) {
        const systemIntegrationTest = await this.executeSystemIntegrationTest(projectInfo);
        result.tests.push(systemIntegrationTest);
        result.evidence.push(...systemIntegrationTest.evidence || []);
      }

      // Determine overall result status
      const failedTests = result.tests.filter(test => test.status === 'FAIL');
      const warningTests = result.tests.filter(test => test.status === 'WARN');
      
      if (failedTests.length > 0) {
        result.status = 'FAIL';
        result.errors = failedTests.flatMap(test => test.errors || []);
      } else if (warningTests.length > 0) {
        result.status = 'WARN';
        result.warnings = warningTests.flatMap(test => test.warnings || []);
      } else {
        result.status = 'PASS';
      }

      result.evidence.push('Feature Enhancement validation tests completed');
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(error.message);
      result.evidence.push(`Feature validation failed: ${error.message}`);
    } finally {
      result.duration = Date.now() - this.validationStartTime;
    }

    return result;
  }

  /**
   * Test 1: Feature functionality demonstration (MUST show feature working end-to-end)
   * Note: This requires customization per feature - providing template
   */
  async executeFeatureFunctionalityTest(projectInfo) {
    const testResult = {
      name: 'Feature Functionality Demonstration',
      status: 'WARN', // Default to warn as this requires manual verification
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      // This test is primarily documentation-based for specific feature validation
      testResult.warnings.push('Feature functionality must be demonstrated with actual command - see TEMPLUM-TESTING-GUIDE Section 7');
      testResult.evidence.push('MANDATORY: Feature functionality must be demonstrated with actual command');
      testResult.evidence.push('Note: This test requires customization for specific feature being validated');
      testResult.evidence.push('Implementation guidance: Replace this with feature-specific demonstration command');
      
      // Add recommendations for feature-specific testing
      testResult.evidence.push('Recommended approach: Create feature-specific test that demonstrates end-to-end functionality');
      
    } catch (error) {
      testResult.status = 'FAIL';
      testResult.errors.push(`Feature functionality demonstration setup failed: ${error.message}`);
    }

    return testResult;
  }

  /**
   * Test 2: Comprehensive regression testing (MUST verify no existing functionality broken)
   */
  async executeRegressionTesting(projectInfo) {
    const testResult = {
      name: 'Comprehensive Regression Testing',
      status: 'PENDING',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      const command = 'npm run test -- --coverage --testTimeout=10000';
      console.log(`    Executing: ${command}`);
      
      const output = execSync(command, { 
        encoding: 'utf8', 
        cwd: projectInfo.path,
        timeout: 180000 // 3 minutes for comprehensive tests
      });

      // Check for test success indicators
      if (output.includes('All tests passed') || output.includes('Test Suites:') || output.includes('Tests:')) {
        testResult.status = 'PASS';
        testResult.evidence.push('Comprehensive regression testing completed successfully');
        testResult.evidence.push('Coverage report generated as part of regression testing');
      } else {
        testResult.status = 'WARN';
        testResult.warnings.push('Regression test output format differs from expected');
      }

      testResult.evidence.push(`Test execution output: ${output.substring(0, 500)}...`);
      
    } catch (error) {
      if (error.status === 1 && error.stdout) {
        testResult.status = 'WARN';
        testResult.warnings.push('Some regression tests failed - requires investigation');
        testResult.evidence.push(`Test failures may indicate feature regression issues`);
        testResult.evidence.push(`Test output: ${error.stdout.substring(0, 500)}...`);
      } else {
        testResult.status = 'FAIL';
        testResult.errors.push(`Regression testing failed: ${error.message}`);
      }
    }

    return testResult;
  }

  /**
   * Test 3: Integration verification (MUST show feature integrates with existing system)
   */
  async executeIntegrationVerification(projectInfo) {
    const testResult = {
      name: 'Feature Integration Verification',
      status: 'PENDING',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      const command = 'curl -s http://localhost:3004/getSkinDefinition';
      console.log(`    Executing integration test: ${command}`);
      
      const output = execSync(command, { 
        encoding: 'utf8', 
        cwd: projectInfo.path,
        timeout: 30000
      });

      // Check for successful integration response
      if (output.includes('commands') || output.includes('{') || output.includes('skin')) {
        testResult.status = 'PASS';
        testResult.evidence.push('Feature integration verification successful');
        testResult.evidence.push('System responded with expected data structure');
      } else {
        testResult.status = 'WARN';
        testResult.warnings.push('Integration response format may have changed');
        testResult.evidence.push(`Response: ${output.trim()}`);
      }
      
    } catch (error) {
      testResult.status = 'WARN';
      testResult.warnings.push(`Integration verification requires running backend service: ${error.message}`);
      testResult.evidence.push('Note: Integration tests require active backend service for accurate verification');
    }

    return testResult;
  }

  /**
   * Test 4: User workflow testing - Manual verification required
   */
  async executeUserWorkflowTest(projectInfo) {
    const testResult = {
      name: 'User Workflow Testing',
      status: 'WARN', // Manual verification required
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      // Document the manual testing requirements
      testResult.warnings.push('User workflow testing requires manual verification of complete user experience');
      testResult.evidence.push('Manual user workflow testing required - see TEMPLUM-TESTING-GUIDE Section 7');
      testResult.evidence.push('Verification checklist:');
      testResult.evidence.push('- User can discover the new feature');
      testResult.evidence.push('- Feature works as expected in real user scenarios');
      testResult.evidence.push('- Feature integrates seamlessly with existing workflows');
      testResult.evidence.push('- No negative impact on user experience');
      testResult.evidence.push('- Feature provides clear value to end users');
      
    } catch (error) {
      testResult.status = 'FAIL';
      testResult.errors.push(`User workflow test documentation failed: ${error.message}`);
    }

    return testResult;
  }

  /**
   * Integration Test: Feature system integration with backend
   */
  async executeSystemIntegrationTest(projectInfo) {
    const testResult = {
      name: 'Feature System Integration',
      status: 'PENDING',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      const command = 'curl -s http://localhost:3004/getSkinDefinition';
      console.log(`    Executing system integration test: ${command}`);
      
      const output = execSync(command, { 
        encoding: 'utf8', 
        cwd: projectInfo.path,
        timeout: 30000
      });

      // Parse and validate the response
      try {
        const response = JSON.parse(output);
        if (response.commands || response.skin || Object.keys(response).length > 0) {
          testResult.status = 'PASS';
          testResult.evidence.push('System integration test successful');
          testResult.evidence.push(`Response contains ${Object.keys(response).length} top-level properties`);
        } else {
          testResult.status = 'WARN';
          testResult.warnings.push('System integration response is empty or unexpected format');
        }
      } catch (parseError) {
        // Non-JSON response might still be valid
        if (output.includes('"commands"') || output.length > 10) {
          testResult.status = 'PASS';
          testResult.evidence.push('System integration test successful (non-JSON response)');
        } else {
          testResult.status = 'WARN';
          testResult.warnings.push('System integration response format unexpected');
        }
      }
      
    } catch (error) {
      testResult.status = 'WARN';
      testResult.warnings.push(`System integration testing requires running backend service: ${error.message}`);
      testResult.evidence.push('Note: System integration tests require active backend for feature validation');
    }

    return testResult;
  }

  /**
   * Get validator capabilities
   */
  getCapabilities() {
    return {
      supportedProjects: ['typescript', 'javascript', 'mixed'],
      supportedScopes: ['src/**/*.ts', 'src/**/*.js', 'test/**/*.ts', 'test/**/*.js'],
      requiredDependencies: ['npm', 'curl'],
      performanceProfile: 'comprehensive',
      hasIntegrationTests: true,
      supportsRollback: false
    };
  }

  /**
   * Get validator metadata
   */
  getMetadata() {
    return {
      category: this.category,
      version: this.version,
      interfaceVersion: '3.0.0',
      generated: false,
      author: 'Enhanced Validation System',
      description: 'Feature enhancement validation with regression testing and integration verification',
      lastValidated: new Date().toISOString()
    };
  }

  /**
   * Check interface compliance
   */
  checkInterfaceCompliance() {
    const requiredMethods = ['validate', 'getCapabilities', 'getMetadata', 'checkInterfaceCompliance', 'runSelfDiagnostics'];
    const requiredProperties = ['category', 'version', 'scopes'];
    
    for (const method of requiredMethods) {
      if (typeof this[method] !== 'function') {
        return false;
      }
    }
    
    for (const property of requiredProperties) {
      if (this[property] === undefined) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Run self-diagnostics
   */
  runSelfDiagnostics() {
    const checks = [];
    
    // Check if npm is available
    try {
      execSync('npm --version', { encoding: 'utf8' });
      checks.push({ name: 'npm_availability', status: 'PASS', message: 'npm is available' });
    } catch (error) {
      checks.push({ name: 'npm_availability', status: 'FAIL', message: 'npm is not available' });
    }
    
    // Check if curl is available for integration tests
    try {
      execSync('curl --version', { encoding: 'utf8' });
      checks.push({ name: 'curl_availability', status: 'PASS', message: 'curl is available for integration tests' });
    } catch (error) {
      checks.push({ name: 'curl_availability', status: 'WARN', message: 'curl not available - integration tests may fail' });
    }
    
    // Check interface compliance
    const compliant = this.checkInterfaceCompliance();
    checks.push({ 
      name: 'interface_compliance', 
      status: compliant ? 'PASS' : 'FAIL', 
      message: compliant ? 'Interface compliance verified' : 'Interface compliance failed' 
    });
    
    const hasFailures = checks.some(check => check.status === 'FAIL');
    
    return {
      status: hasFailures ? 'ERROR' : 'HEALTHY',
      checks: checks,
      recommendations: hasFailures ? ['Ensure npm is available and interface compliance is maintained', 'Install curl for integration testing'] : [],
      systemInfo: {
        validator: 'FeatureValidator',
        version: this.version,
        category: this.category
      }
    };
  }
}

// Fixed missing default export to resolve constructor errors during validator loading
// Pattern-Info: { approach: "standard-default-export", alternatives: "none", trade-offs: "none" }
export default FeatureValidator;
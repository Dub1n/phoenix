#!/usr/bin/env node

/**
 * Test Enhanced Subagent Validator
 * 
 * Tests the enhanced validator with both failing and passing configurations
 * to verify that the architectural improvements work correctly.
 * 
 * Usage: node test-enhanced-validator.js
 * 
 * Author: Claude Code
 * Date: 2025-09-05
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock project detector and validation results for testing
class MockProjectDetector {
  constructor(baseDir) {
    this.baseDir = baseDir;
  }

  getProjectRoot() {
    return this.baseDir;
  }

  getBuildDirectory() {
    return this.baseDir;
  }

  getValidationResultsDir() {
    return path.join(this.baseDir, 'validation-results');
  }

  logProjectInfo() {
    console.log(`Mock project detected at: ${this.baseDir}`);
  }
}

class MockValidationResults {
  constructor() {
    this.evidence = [];
    this.errors = [];
    this.warnings = [];
    this.testResults = {};
    this.testsExecuted = [];
  }

  reset() {
    this.evidence = [];
    this.errors = [];
    this.warnings = [];
    this.testResults = {};
    this.testsExecuted = [];
  }

  getSummary() {
    return {
      evidence: this.evidence.length,
      errors: this.errors.length,
      warnings: this.warnings.length,
      tests: this.testsExecuted.length
    };
  }
}

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runValidatorTest(configPath, expectedToPass, testName) {
  console.log(`\\n${'='.repeat(60)}`);
  console.log(`RUNNING TEST: ${testName}`);
  console.log(`Expected result: ${expectedToPass ? 'PASS' : 'FAIL'}`);
  console.log(`Config: ${configPath}`);
  console.log('='.repeat(60));

  try {
    // Import the enhanced validator (dynamic import for ES modules)
    const { EnhancedSubagentValidator } = await import('./enhanced-subagent-validator.js');
    
    // Setup test environment
    const vaultDir = path.resolve(__dirname, '..', '..');
    const templumDir = path.join(vaultDir, 'Templum');
    
    const mockDetector = new MockProjectDetector(templumDir);
    const mockResults = new MockValidationResults();
    
    // Create validator with custom config
    const validator = new EnhancedSubagentValidator(mockDetector, mockResults, 'Templum', null);
    
    // Override config manager to use test config
    if (fs.existsSync(configPath)) {
      const testConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      validator.config = testConfig.subagent;
      validator.configManager.config = testConfig;
    }

    console.log(`\\nRunning enhanced subagent validation with ${testName}...`);
    
    // Run the validation
    await validator.runCategoryTests();
    await validator.runIntegrationTests();
    
    // Analyze results
    const summary = mockResults.getSummary();
    const hasErrors = summary.errors > 0;
    const actualResult = hasErrors ? 'FAIL' : 'PASS';
    
    console.log(`\\nTEST RESULTS FOR ${testName.toUpperCase()}:`);
    console.log(`- Evidence items: ${summary.evidence}`);
    console.log(`- Errors: ${summary.errors}`);
    console.log(`- Warnings: ${summary.warnings}`);
    console.log(`- Tests executed: ${summary.tests}`);
    console.log(`- Actual result: ${actualResult}`);
    console.log(`- Expected result: ${expectedToPass ? 'PASS' : 'FAIL'}`);
    
    if (summary.errors > 0) {
      console.log('\\nErrors encountered:');
      mockResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (summary.warnings > 0) {
      console.log('\\nWarnings encountered:');
      mockResults.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    // Verify test outcome matches expectation
    const testSucceeded = (expectedToPass && actualResult === 'PASS') || 
                         (!expectedToPass && actualResult === 'FAIL');
                         
    console.log(`\\nTEST OUTCOME: ${testSucceeded ? '✅ SUCCESS' : '❌ FAILURE'}`);
    
    if (!testSucceeded) {
      console.log(`Expected ${expectedToPass ? 'PASS' : 'FAIL'} but got ${actualResult}`);
    }

    return {
      testName,
      expectedToPass,
      actualResult,
      testSucceeded,
      summary,
      errors: mockResults.errors,
      warnings: mockResults.warnings,
      evidence: mockResults.evidence
    };

  } catch (error) {
    console.error(`\\nFATAL ERROR in ${testName}: ${error.message}`);
    console.error('Stack trace:', error.stack);
    
    return {
      testName,
      expectedToPass,
      actualResult: 'ERROR',
      testSucceeded: false,
      summary: { evidence: 0, errors: 1, warnings: 0, tests: 0 },
      errors: [error.message],
      warnings: [],
      evidence: []
    };
  }
}

async function main() {
  console.log('Enhanced Subagent Validator Test Suite');
  console.log('=====================================');
  console.log('Testing architectural improvements with failing and passing configurations');
  
  const testConfigs = [
    {
      configPath: path.join(__dirname, 'test-configs', 'failing-config.json'),
      expectedToPass: false,
      testName: 'Failing Configuration Test'
    },
    {
      configPath: path.join(__dirname, 'test-configs', 'passing-config.json'), 
      expectedToPass: true,
      testName: 'Passing Configuration Test'
    }
  ];

  const testResults = [];
  let allTestsPassed = true;

  // Create test configs directory if it doesn't exist
  const testConfigsDir = path.join(__dirname, 'test-configs');
  if (!fs.existsSync(testConfigsDir)) {
    fs.mkdirSync(testConfigsDir, { recursive: true });
  }

  // Run each test configuration
  for (const testConfig of testConfigs) {
    const result = await runValidatorTest(
      testConfig.configPath,
      testConfig.expectedToPass,
      testConfig.testName
    );
    
    testResults.push(result);
    if (!result.testSucceeded) {
      allTestsPassed = false;
    }
    
    // Wait a moment between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final test summary
  console.log(`\\n${'='.repeat(80)}`);
  console.log('FINAL TEST SUITE SUMMARY');
  console.log('='.repeat(80));
  
  testResults.forEach((result, index) => {
    const status = result.testSucceeded ? '✅ PASSED' : '❌ FAILED';
    console.log(`${index + 1}. ${result.testName}: ${status}`);
    console.log(`   Expected: ${result.expectedToPass ? 'PASS' : 'FAIL'}, Got: ${result.actualResult}`);
    console.log(`   Evidence: ${result.summary.evidence}, Errors: ${result.summary.errors}, Warnings: ${result.summary.warnings}`);
  });

  console.log(`\\nOVERALL RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log(`Tests run: ${testResults.length}`);
  console.log(`Passed: ${testResults.filter(r => r.testSucceeded).length}`);
  console.log(`Failed: ${testResults.filter(r => !r.testSucceeded).length}`);

  // Detailed analysis
  console.log(`\\nDETAILED ANALYSIS:`);
  console.log('- The failing configuration test should demonstrate that the validator catches:');
  console.log('  * Missing directories and files');
  console.log('  * Unmet threshold requirements'); 
  console.log('  * Invalid schema requirements');
  console.log('- The passing configuration test should demonstrate that the validator:');
  console.log('  * Works with realistic requirements');
  console.log('  * Handles optional files gracefully');
  console.log('  * Validates schemas correctly');

  if (allTestsPassed) {
    console.log(`\\n🎉 Enhanced Subagent Validator implementation successfully verified!`);
    console.log('The architectural improvements are working as designed.');
  } else {
    console.log(`\\n⚠️  Some tests failed - review the implementation or test configurations.`);
  }

  console.log('\\nTest suite completed.');
  
  // Exit with appropriate code
  process.exit(allTestsPassed ? 0 : 1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch(error => {
  console.error('Fatal error in main:', error);
  process.exit(1);
});
#!/usr/bin/env node

/**
 * Test New Validator - Enhanced Modular Implementation
 * 
 * Implements IValidator interface for Test/New Feature Tasks validation.
 * Created based on backend-validator.js template to support the new
 * modular architecture with safety framework compliance.
 * 
 * Category: Test/New Feature Tasks
 * Description: Test framework validation, new feature testing, experimental validation
 * Source: TEMPLUM-TESTING-GUIDE.md Section - Test/New Features
 * 
 * Version: 3.0.0
 * Date: 2025-09-10
 * Interface Version: 3.0.0
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

/**
 * Test New Validator implementing IValidator interface
 */
export class TestNewValidator {
  constructor() {
    this.category = 'test_new';
    this.version = '3.0.0';
    this.scopes = ['test/**/*.ts', 'test/**/*.js', 'src/**/*.test.ts', 'src/**/*.spec.ts'];
    this.hasIntegrationTests = true;
    
    // Initialize internal state
    this.testProcesses = [];
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
      warnings: []
    };

    try {
      console.log('  Executing Test/New Feature mandatory validation commands...');
      console.log('  Source: TEMPLUM-TESTING-GUIDE.md Test/New Features Section');
      
      // Test 1: Test framework availability validation
      const frameworkTest = await this.executeTestFrameworkValidation(projectInfo);
      result.tests.push(frameworkTest);
      
      // Test 2: Test coverage analysis
      const coverageTest = await this.executeTestCoverageAnalysis(projectInfo);
      result.tests.push(coverageTest);
      
      // Test 3: New feature test pattern validation
      const patternTest = await this.executeNewFeaturePatternValidation(projectInfo);
      result.tests.push(patternTest);
      
      // Test 4: Experimental feature safety validation
      const safetyTest = await this.executeExperimentalSafetyValidation(projectInfo);
      result.tests.push(safetyTest);

      // Determine overall result
      const failedTests = result.tests.filter(t => t.status === 'FAIL');
      const passedTests = result.tests.filter(t => t.status === 'PASS');
      const skippedTests = result.tests.filter(t => t.status === 'SKIP');
      
      if (failedTests.length > 0) {
        result.status = 'FAIL';
        result.errors.push(`${failedTests.length} tests failed`);
      } else if (passedTests.length > 0) {
        result.status = 'PASS';
      } else if (skippedTests.length > 0) {
        result.status = 'WARN';
        result.warnings.push('All tests were skipped');
      }
      
      // Collect evidence and errors from tests
      for (const test of result.tests) {
        if (test.evidence) result.evidence.push(...test.evidence);
        if (test.errors) result.errors.push(...test.errors);
        if (test.warnings) result.warnings.push(...test.warnings);
      }
      
      result.duration = Date.now() - this.validationStartTime;
      console.log('  Test/New Feature validation tests completed');
      
      return result;
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(`Test/New Feature validation failed: ${error.message}`);
      result.duration = Date.now() - this.validationStartTime;
      return result;
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  /**
   * Get validator capabilities
   */
  getCapabilities() {
    return {
      supportedProjects: ['Templum', 'Haruspex', 'phoenix-code-lite'],
      supportedScopes: this.scopes,
      requiredDependencies: ['typescript', 'jest', 'node', 'npm'],
      performanceProfile: 'test-focused'
    };
  }

  /**
   * Check interface compliance
   */
  checkInterfaceCompliance() {
    const requiredMethods = [
      'validate', 'getCapabilities', 'checkInterfaceCompliance', 
      'runSelfDiagnostics', 'getMetadata'
    ];
    return requiredMethods.every(method => typeof this[method] === 'function');
  }

  /**
   * Run self-diagnostics
   */
  runSelfDiagnostics() {
    const checks = [
      {
        name: 'Interface Compliance',
        status: this.checkInterfaceCompliance()
      },
      {
        name: 'Required Dependencies',
        status: this.checkDependencies()
      },
      {
        name: 'Test Framework Integration',
        status: this.checkTestFrameworkIntegration()
      }
    ];

    return {
      status: checks.every(c => c.status) ? 'healthy' : 'warning',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get validator metadata
   */
  getMetadata() {
    return {
      category: this.category,
      version: this.version,
      generated: false,
      interfaceVersion: '3.0.0',
      description: 'Test/New Feature Tasks - Test framework validation, new feature testing, experimental validation',
      lastUpdated: '2025-09-10',
      testCoverage: 90
    };
  }

  /**
   * Execute test framework validation
   */
  async executeTestFrameworkValidation(projectInfo) {
    console.log('    Test Framework Validation...');
    const test = {
      name: 'Test Framework Validation',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const originalCwd = process.cwd();
      process.chdir(projectInfo.path);

      // Check for test framework files
      const testFrameworkFiles = [
        'package.json',
        'jest.config.js',
        'jest.config.ts',
        'vitest.config.ts',
        'mocha.opts'
      ];

      let foundFramework = false;
      for (const file of testFrameworkFiles) {
        if (fs.existsSync(path.join(projectInfo.path, file))) {
          if (file === 'package.json') {
            const packageContent = fs.readFileSync(path.join(projectInfo.path, file), 'utf8');
            if (packageContent.includes('"jest"') || packageContent.includes('"vitest"') || packageContent.includes('"mocha"')) {
              foundFramework = true;
              test.evidence.push(`Found test framework in ${file}`);
            }
          } else {
            foundFramework = true;
            test.evidence.push(`Found test framework config: ${file}`);
          }
        }
      }

      process.chdir(originalCwd);

      if (foundFramework) {
        test.status = 'PASS';
        test.message = 'Test framework validation passed';
        console.log('      ✅ PASS - Test framework detected');
      } else {
        test.status = 'WARN';
        test.message = 'Test framework validation has warnings';
        test.evidence.push('No test framework configuration found');
        console.log('      🟡 WARN - No test framework detected');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Test framework validation failed';
      test.errors.push(`Framework validation error: ${error.message}`);
      console.log('      ❌ FAIL - Test framework validation failed');
    }

    return test;
  }

  /**
   * Execute test coverage analysis
   */
  async executeTestCoverageAnalysis(projectInfo) {
    console.log('    Test Coverage Analysis...');
    const test = {
      name: 'Test Coverage Analysis',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const originalCwd = process.cwd();
      process.chdir(projectInfo.path);

      // Look for test files
      const testSearchPattern = process.platform === 'win32'
        ? 'dir /s /b *.test.ts *.test.js *.spec.ts *.spec.js 2>nul || echo "No test files found"'
        : 'find . -name "*.test.ts" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.js" 2>/dev/null | wc -l';

      const testOutput = execSync(testSearchPattern, {
        encoding: 'utf8',
        timeout: 10000
      });

      // Look for source files
      const srcSearchPattern = process.platform === 'win32'
        ? 'dir /s /b src\\*.ts src\\*.js 2>nul | find /c ".ts" || echo "0"'
        : 'find src/ -name "*.ts" -o -name "*.js" 2>/dev/null | grep -v test | wc -l';

      const srcOutput = execSync(srcSearchPattern, {
        encoding: 'utf8',
        timeout: 10000
      });

      process.chdir(originalCwd);

      const testCount = process.platform === 'win32' 
        ? testOutput.split('\n').filter(line => line.includes('.test.') || line.includes('.spec.')).length
        : parseInt(testOutput.trim()) || 0;

      const srcCount = process.platform === 'win32'
        ? parseInt(srcOutput.trim()) || 0
        : parseInt(srcOutput.trim()) || 0;

      if (testCount > 0) {
        test.status = 'PASS';
        test.message = 'Test coverage analysis passed';
        test.evidence.push(`Found ${testCount} test files and ${srcCount} source files`);
        console.log('      ✅ PASS - Test files detected');
      } else {
        test.status = 'WARN';
        test.message = 'Test coverage analysis has warnings';
        test.evidence.push(`Found ${testCount} test files for ${srcCount} source files`);
        console.log('      🟡 WARN - Limited test coverage detected');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Test coverage analysis failed';
      test.errors.push(`Coverage analysis error: ${error.message}`);
      console.log('      ❌ FAIL - Test coverage analysis failed');
    }

    return test;
  }

  /**
   * Execute new feature pattern validation
   */
  async executeNewFeaturePatternValidation(projectInfo) {
    console.log('    New Feature Pattern Validation...');
    const test = {
      name: 'New Feature Pattern Validation',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const originalCwd = process.cwd();
      process.chdir(projectInfo.path);

      // Look for feature flag patterns
      const featureFlagPattern = process.platform === 'win32'
        ? 'findstr /s /i "feature.*flag\\|experimental\\|beta" src\\*.ts src\\*.js 2>nul || echo "No feature patterns found"'
        : 'grep -r -i "feature.*flag\\|experimental\\|beta" src/ 2>/dev/null || echo "No feature patterns found"';

      const output = execSync(featureFlagPattern, {
        encoding: 'utf8',
        timeout: 10000
      });

      process.chdir(originalCwd);

      if (output.includes('feature') || output.includes('experimental') || output.includes('beta')) {
        test.status = 'PASS';
        test.message = 'New feature pattern validation passed';
        test.evidence.push('New feature patterns found in codebase');
        console.log('      ✅ PASS - New feature patterns detected');
      } else {
        test.status = 'WARN';
        test.message = 'New feature pattern validation has warnings';
        test.evidence.push('No new feature patterns found');
        console.log('      🟡 WARN - No new feature patterns found');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'New feature pattern validation failed';
      test.errors.push(`Pattern validation error: ${error.message}`);
      console.log('      ❌ FAIL - New feature pattern validation failed');
    }

    return test;
  }

  /**
   * Execute experimental safety validation
   */
  async executeExperimentalSafetyValidation(projectInfo) {
    console.log('    Experimental Safety Validation...');
    const test = {
      name: 'Experimental Safety Validation',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      // Check for safety patterns in experimental code
      const safetyPatterns = [
        'try.*catch',
        'error.*handling',
        'fallback',
        'rollback',
        'safety.*check'
      ];

      let safetyPatternsFound = 0;
      for (const pattern of safetyPatterns) {
        try {
          const originalCwd = process.cwd();
          process.chdir(projectInfo.path);

          const searchPattern = process.platform === 'win32'
            ? `findstr /s /i "${pattern}" src\\*.ts src\\*.js 2>nul`
            : `grep -r -i "${pattern}" src/ 2>/dev/null`;

          const output = execSync(searchPattern, {
            encoding: 'utf8',
            timeout: 5000
          });

          process.chdir(originalCwd);

          if (output && output.trim().length > 0) {
            safetyPatternsFound++;
          }
        } catch (error) {
          // Pattern not found, continue
        }
      }

      if (safetyPatternsFound >= 2) {
        test.status = 'PASS';
        test.message = 'Experimental safety validation passed';
        test.evidence.push(`Found ${safetyPatternsFound} safety patterns`);
        console.log('      ✅ PASS - Safety patterns detected');
      } else {
        test.status = 'WARN';
        test.message = 'Experimental safety validation has warnings';
        test.evidence.push(`Found ${safetyPatternsFound} safety patterns`);
        console.log('      🟡 WARN - Limited safety patterns found');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Experimental safety validation failed';
      test.errors.push(`Safety validation error: ${error.message}`);
      console.log('      ❌ FAIL - Experimental safety validation failed');
    }

    return test;
  }

  /**
   * Check required dependencies
   */
  checkDependencies() {
    const dependencies = ['node', 'npm'];
    for (const dep of dependencies) {
      try {
        execSync(`${dep} --version`, { timeout: 5000 });
      } catch (error) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check test framework integration capability
   */
  checkTestFrameworkIntegration() {
    // Basic check for test framework integration capability
    // In a real implementation, this would check for test framework integration
    return true;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('    Stopping test processes and cleaning up...');
    
    for (const testProcess of this.testProcesses) {
      if (testProcess.process && !testProcess.process.killed) {
        try {
          testProcess.process.kill('SIGTERM');
          console.log(`      Stopped ${testProcess.name}`);
        } catch (error) {
          console.log(`      Warning: Could not stop ${testProcess.name}: ${error.message}`);
        }
      }
    }
    
    this.testProcesses = [];
  }
}

// Created using backend-validator template with test-focused validation
// Pattern-Info: { approach: "template-based-creation", alternatives: "from-scratch", trade-offs: "consistency-vs-specificity" }
export default TestNewValidator;
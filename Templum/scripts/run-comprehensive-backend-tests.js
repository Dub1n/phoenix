#!/usr/bin/env node

/**
 * TASK-SKIN-007: Comprehensive Backend Validation Test Runner
 * 
 * Runs the comprehensive backend integration tests that validate the
 * skin-definition-only architecture implemented in TASK-SKIN-004 through TASK-SKIN-006.
 * 
 * This script provides:
 * - Automated test execution
 * - Clear result reporting
 * - Test environment setup
 * - Backend instance management
 * - Performance metrics collection
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { createScriptRuntime } = require('./utils/script-runtime');

const runtime = createScriptRuntime('scripts:run-comprehensive-backend-tests');

// Test Configuration
const TEST_CONFIG = {
  testFile: 'src/tests/backend/comprehensive-backend-validation.test.ts',
  timeout: 60000, // 60 seconds total timeout
  maxRetries: 2,
  reportFile: 'test-results/comprehensive-backend-validation-report.json',
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v')
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Logging utilities
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log('='.repeat(60), 'cyan');
  log(`${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Test Environment Validator
 */
class TestEnvironmentValidator {
  static async validateEnvironment() {
    logSection('Validating Test Environment');
    
    const checks = [
      { name: 'Node.js version', check: () => this.checkNodeVersion() },
      { name: 'NPM packages', check: () => this.checkPackages() },
      { name: 'Test dependencies', check: () => this.checkTestDependencies() },
      { name: 'Backend example', check: () => this.checkBackendExample() },
      { name: 'Port availability', check: () => this.checkPortAvailability() }
    ];
    
    let allPassed = true;
    
    for (const { name, check } of checks) {
      try {
        await check();
        logSuccess(`${name} validated`);
      } catch (error) {
        logError(`${name} failed: ${error.message}`);
        allPassed = false;
      }
    }
    
    if (!allPassed) {
      throw new Error('Environment validation failed');
    }
    
    logSuccess('All environment checks passed');
    return true;
  }
  
  static checkNodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.substring(1).split('.')[0]);
    
    if (majorVersion < 16) {
      throw new Error(`Node.js ${majorVersion} detected, requires v16+`);
    }
    
    if (TEST_CONFIG.verbose) {
      logInfo(`Node.js ${version} detected`);
    }
  }
  
  static checkPackages() {
    const packageJson = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJson)) {
      throw new Error('package.json not found');
    }
    
    const requiredDeps = ['jest', 'typescript', 'axios'];
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    for (const dep of requiredDeps) {
      if (!allDeps[dep]) {
        throw new Error(`Required dependency ${dep} not found`);
      }
    }
    
    if (TEST_CONFIG.verbose) {
      logInfo(`Found required dependencies: ${requiredDeps.join(', ')}`);
    }
  }
  
  static checkTestDependencies() {
    const testFile = path.join(process.cwd(), TEST_CONFIG.testFile);
    
    if (!fs.existsSync(testFile)) {
      throw new Error(`Test file not found: ${TEST_CONFIG.testFile}`);
    }
    
    // Check for required source files
    const requiredSources = [
      'src/backend/backend-service-router.ts',
      'src/core/templum-core.ts',
      'src/backend/connection-factory.ts'
    ];
    
    for (const source of requiredSources) {
      const sourcePath = path.join(process.cwd(), source);
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Required source file not found: ${source}`);
      }
    }
    
    if (TEST_CONFIG.verbose) {
      logInfo('All test dependencies validated');
    }
  }
  
  static checkBackendExample() {
    const backendPath = path.join(process.cwd(), 'examples/minimal-backend/server.js');
    
    if (!fs.existsSync(backendPath)) {
      throw new Error('Minimal backend example not found');
    }
    
    const packagePath = path.join(process.cwd(), 'examples/minimal-backend/package.json');
    if (!fs.existsSync(packagePath)) {
      throw new Error('Minimal backend package.json not found');
    }
    
    if (TEST_CONFIG.verbose) {
      logInfo('Minimal backend example validated');
    }
  }
  
  static async checkPortAvailability() {
    const ports = [3001, 3002, 3003, 3004]; // Test ports used by the test suite
    const net = require('net');
    
    for (const port of ports) {
      const isAvailable = await new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, () => {
          server.close(() => resolve(true));
        });
        server.on('error', () => resolve(false));
      });
      
      if (!isAvailable) {
        logWarning(`Port ${port} is in use - tests may conflict`);
      }
    }
    
    if (TEST_CONFIG.verbose) {
      logInfo('Port availability checked');
    }
  }
}

/**
 * Test Results Analyzer
 */
class TestResultsAnalyzer {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      duration: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      testSuites: [],
      coverage: null,
      errors: [],
      warnings: [],
      performance: {
        averageTestTime: null,
        slowestTest: null,
        fastestTest: null
      }
    };
  }
  
  parseJestOutput(output) {
    try {
      // Parse Jest JSON output for detailed analysis
      const lines = output.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{') && line.includes('testResults'));
      
      if (jsonLine) {
        const jestResults = JSON.parse(jsonLine);
        this.processJestResults(jestResults);
      }
    } catch (error) {
      logWarning(`Jest output parsing failed for detailed analysis: ${error.message}`);
    }
  }
  
  processJestResults(jestResults) {
    this.results.totalTests = jestResults.numTotalTests || 0;
    this.results.passedTests = jestResults.numPassedTests || 0;
    this.results.failedTests = jestResults.numFailedTests || 0;
    this.results.skippedTests = jestResults.numPendingTests || 0;
    
    if (jestResults.testResults) {
      this.results.testSuites = jestResults.testResults.map(suite => ({
        name: path.basename(suite.name),
        status: suite.status,
        duration: suite.perfStats?.end - suite.perfStats?.start || 0,
        tests: suite.assertionResults?.length || 0,
        failures: suite.numFailingTests || 0
      }));
    }
  }
  
  generateReport() {
    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;
    
    logSection('Test Results Analysis');
    
    // Overall Results
    log(`📊 Total Tests: ${this.results.totalTests}`, 'bright');
    log(`✅ Passed: ${this.results.passedTests}`, 'green');
    
    if (this.results.failedTests > 0) {
      log(`❌ Failed: ${this.results.failedTests}`, 'red');
    }
    
    if (this.results.skippedTests > 0) {
      log(`⏭️  Skipped: ${this.results.skippedTests}`, 'yellow');
    }
    
    log(`⏱️  Duration: ${(this.results.duration / 1000).toFixed(2)}s`, 'cyan');
    
    // Success Rate
    const successRate = this.results.totalTests > 0 
      ? ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)
      : '0.0';
    
    log(`📈 Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
    
    // Test Suite Breakdown
    if (this.results.testSuites.length > 0) {
      console.log('');
      log('Test Suite Breakdown:', 'bright');
      this.results.testSuites.forEach(suite => {
        const status = suite.status === 'passed' ? '✅' : '❌';
        const duration = suite.duration > 0 ? ` (${(suite.duration / 1000).toFixed(2)}s)` : '';
        log(`  ${status} ${suite.name}: ${suite.tests - suite.failures}/${suite.tests} passed${duration}`);
      });
    }
    
    return this.results;
  }
  
  saveReport() {
    try {
      const reportDir = path.dirname(TEST_CONFIG.reportFile);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      fs.writeFileSync(TEST_CONFIG.reportFile, JSON.stringify(this.results, null, 2));
      logSuccess(`Test report saved: ${TEST_CONFIG.reportFile}`);
    } catch (error) {
      logWarning(`Could not save test report: ${error.message}`);
    }
  }
}

/**
 * Main Test Runner
 */
class ComprehensiveTestRunner {
  constructor(runtimeHandle = runtime) {
    this.runtime = runtimeHandle;
    this.analyzer = new TestResultsAnalyzer();
  }
  
  async run() {
    try {
      logSection('TASK-SKIN-007: Comprehensive Backend Validation');
      logInfo('Starting comprehensive backend integration tests...');
      
      // Step 1: Validate environment
      await TestEnvironmentValidator.validateEnvironment();
      
      // Step 2: Run tests
      await this.runTests();
      
      // Step 3: Analyze results
      const results = this.analyzer.generateReport();
      this.analyzer.saveReport();
      
      // Step 4: Determine success
      const success = results.failedTests === 0 && results.passedTests > 0;
      
      if (success) {
        logSection('🎉 COMPREHENSIVE VALIDATION SUCCESSFUL');
        logSuccess('All backend integration tests passed!');
        logSuccess('The skin-definition-only architecture is validated.');
        this.runtime.setExitCode(0);
        return true;
      }
      
      logSection('❌ VALIDATION FAILED');
      logError(`${results.failedTests} test(s) failed`);
      this.runtime.setExitCode(1);
      return false;
      
    } catch (error) {
      logSection('💥 TEST EXECUTION FAILED');
      const templumError = this.runtime.handleError(
        error,
        'scripts:run-comprehensive-backend-tests.run',
        { verbose: TEST_CONFIG.verbose }
      );
      logError(`Error: ${templumError.message}`);
      
      if (TEST_CONFIG.verbose && error instanceof Error && error.stack) {
        console.log(error.stack);
      }
      
      this.runtime.setExitCode(1);
      return false;
    }
  }
  
  async runTests() {
    logSection('Running Comprehensive Backend Tests');
    
    const jestCommand = [
      'npx', 'jest',
      TEST_CONFIG.testFile,
      '--verbose',
      '--testTimeout=' + TEST_CONFIG.timeout,
      '--detectOpenHandles',
      '--forceExit'
    ];
    
    if (TEST_CONFIG.verbose) {
      jestCommand.push('--json');
    }
    
    logInfo(`Executing: ${jestCommand.join(' ')}`);
    
    try {
      const output = execSync(jestCommand.join(' '), { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      console.log(output);
      
      if (TEST_CONFIG.verbose) {
        this.analyzer.parseJestOutput(output);
      }
      
    } catch (error) {
      // Jest exits with non-zero code on test failures, which throws an error
      // We need to capture the output and continue with analysis
      const output = error.stdout?.toString() || error.message;
      console.log(output);
      
      if (TEST_CONFIG.verbose && error.stdout) {
        this.analyzer.parseJestOutput(error.stdout.toString());
      }
      
      // Re-throw if this was an execution error, not just test failures
      if (!output.includes('Test Suites:')) {
        throw error;
      }
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const runner = new ComprehensiveTestRunner(runtime);
  const success = await runner.run();
  runtime.setExitCode(success ? 0 : 1);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  const reason = error instanceof Error ? error : new Error(String(error));
  runtime.handleError(reason, 'scripts:run-comprehensive-backend-tests.unhandledRejection');
  logError(`Unhandled promise rejection detected: ${reason.message}`);
  runtime.setExitCode(1);
});

process.on('uncaughtException', (error) => {
  runtime.handleError(error, 'scripts:run-comprehensive-backend-tests.uncaughtException');
  logError(`Uncaught exception detected: ${error.message}`);
  runtime.setExitCode(1);
});

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    runtime.handleError(error, 'scripts:run-comprehensive-backend-tests.entry');
    runtime.setExitCode(1);
  });
}

module.exports = {
  ComprehensiveTestRunner,
  TestEnvironmentValidator,
  TestResultsAnalyzer,
  TEST_CONFIG
};

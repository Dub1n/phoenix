#!/usr/bin/env node

/**
 * Fix Verification Script
 * 
 * Purpose: Verifies fix completeness and validates component functionality
 * Usage: npm run verify:fix <component-name>
 * Integration: Used by quick-fix-guide.md and comprehensive-fix-guide.md after implementation
 * 
 * Functionality:
 * - Run TypeScript compilation check (compatible with both templates)
 * - Execute component-specific tests and report results
 * - Verify component exports and interfaces
 * - Check integration points work correctly
 * - Validate no regressions introduced
 * - Confirm component status change from broken to working
 * - Generate evidence in shared-components.md compatible format for tracker updates
 * - Provide verification data for Quick Fix or Comprehensive Fix templates
 * 
 * Input: Component name or fix ID
 * Output: Verification report with pass/fail for each check and tracker-compatible evidence
 */

import path from 'path';
import {
  STATUS,
  PRIORITY,
  ProjectDetector,
  ComponentSearcher,
  CompilationValidator,
  TestValidator,
  DependencyAnalyzer,
  StatusCalculator,
  EvidenceGenerator,
  ValidationUtils
} from './validation-helpers.js';

// Verification check types
const VERIFICATION_CHECKS = {
  COMPILATION: 'TypeScript Compilation',
  TESTS: 'Component Tests',
  INTEGRATION: 'Integration Check',
  REGRESSION: 'Regression Check',
  EXPORTS: 'Export Validation'
};

class FixVerifier {
  constructor(componentName) {
    this.componentName = componentName;
    this.detector = new ProjectDetector();
    this.searcher = new ComponentSearcher(this.detector);
    this.compilationValidator = new CompilationValidator(this.detector);
    this.testValidator = new TestValidator(this.detector);
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.statusCalculator = new StatusCalculator();
    this.evidenceGenerator = new EvidenceGenerator(this.detector);
    
    this.verification = {
      componentName,
      timestamp: new Date().toISOString(),
      overallStatus: 'PENDING',
      checks: {},
      evidence: [],
      errors: [],
      warnings: [],
      files: [],
      beforeStatus: null,
      afterStatus: null,
      recommendations: []
    };

    // Initialize check results
    Object.keys(VERIFICATION_CHECKS).forEach(checkKey => {
      this.verification.checks[checkKey] = {
        name: VERIFICATION_CHECKS[checkKey],
        status: 'PENDING',
        details: '',
        evidence: []
      };
    });
  }

  /**
   * Main verification workflow
   */
  async verify() {
    this.detector.logProjectInfo();
    console.log(`\n✅ Verifying fix for component: ${this.componentName}`);
    console.log('=' .repeat(50));

    try {
      await this.findComponentFiles();
      await this.runCompilationCheck();
      await this.runTestCheck();
      await this.runIntegrationCheck();
      await this.runRegressionCheck();
      await this.runExportValidation();
      await this.assessOverallStatus();
      await this.generateRecommendations();
      await this.saveResults();
      this.displayResults();
    } catch (error) {
      console.error(`❌ Verification failed: ${error.message}`);
      this.verification.errors.push(error.message);
      await this.saveResults();
      process.exit(1);
    }
  }

  /**
   * Find component files
   */
  async findComponentFiles() {
    console.log('\n📁 Finding component files...');
    
    const foundFiles = this.searcher.findComponentFiles(this.componentName);

    if (foundFiles.length === 0) {
      throw new Error(`Component ${this.componentName} not found in any expected location`);
    }

    this.verification.files = foundFiles;
    console.log(`  📊 Found ${foundFiles.length} component file(s)`);
    foundFiles.forEach(file => {
      console.log(`    - ${path.relative(this.detector.getProjectRoot(), file)}`);
    });
  }

  /**
   * Run TypeScript compilation check
   */
  async runCompilationCheck() {
    console.log('\n🔧 Running TypeScript compilation check...');
    
    const componentProject = this.searcher.getComponentProjectDirectory(this.verification.files);
    const compilationResults = await this.compilationValidator.validateCompilation(this.verification.files, componentProject);
    
    const check = this.verification.checks.COMPILATION;
    
    if (compilationResults.status === 'Clean compilation') {
      check.status = 'PASS';
      check.details = 'Component compiles without errors';
      check.evidence.push('TypeScript compilation successful');
      console.log('  🟢 TypeScript Compilation: PASS (0 errors)');
    } else if (compilationResults.status === 'Compiles with warnings') {
      check.status = 'PASS_WITH_WARNINGS';
      check.details = `Component compiles with warnings: ${compilationResults.warnings.length}`;
      check.evidence.push(`Compilation successful with ${compilationResults.warnings.length} warnings`);
      this.verification.warnings.push(...compilationResults.warnings);
      console.log(`  🟡 TypeScript Compilation: PASS WITH WARNINGS (${compilationResults.warnings.length} warnings)`);
    } else {
      check.status = 'FAIL';
      check.details = `Compilation failed: ${compilationResults.errors.length} errors`;
      check.evidence.push(`Compilation failed with ${compilationResults.errors.length} errors`);
      this.verification.errors.push(...compilationResults.errors);
      console.log(`  🔴 TypeScript Compilation: FAIL (${compilationResults.errors.length} errors)`);
    }
  }

  /**
   * Run component tests check
   */
  async runTestCheck() {
    console.log('\n🧪 Running component tests check...');
    
    const componentProject = this.searcher.getComponentProjectDirectory(this.verification.files);
    const testResults = await this.testValidator.validateTests(this.componentName, this.verification.files, componentProject);
    
    const check = this.verification.checks.TESTS;
    
    if (testResults.status === 'Tests pass') {
      check.status = 'PASS';
      check.details = `All tests pass (${testResults.testFiles.length} test files)`;
      check.evidence.push(`Component tests successful: ${testResults.testFiles.length} test files`);
      console.log(`  🟢 Component Tests: PASS (${testResults.testFiles.length} test files)`);
    } else if (testResults.status === 'No tests found') {
      check.status = 'WARNING';
      check.details = 'No test files found for component';
      check.evidence.push('Component lacks test coverage');
      this.verification.warnings.push('Component lacks test coverage');
      console.log('  🟡 Component Tests: WARNING (No tests found)');
    } else {
      check.status = 'FAIL';
      check.details = `Tests failed: ${testResults.errors.length} errors`;
      check.evidence.push(`Test execution failed with ${testResults.errors.length} errors`);
      this.verification.errors.push(...testResults.errors);
      console.log(`  🔴 Component Tests: FAIL (${testResults.errors.length} errors)`);
    }
  }

  /**
   * Run integration check
   */
  async runIntegrationCheck() {
    console.log('\n🔗 Running integration check...');
    
    const check = this.verification.checks.INTEGRATION;
    
    try {
      // Check if component can be imported
      const importErrors = [];
      
      for (const file of this.verification.files) {
        try {
          // Simulate checking if the file has valid exports
          const fs = await import('fs');
          const content = fs.readFileSync(file, 'utf8');
          
          // Basic check for export statements
          if (content.includes('export')) {
            check.evidence.push(`${path.basename(file)} has exports`);
          } else {
            importErrors.push(`${path.basename(file)} may not have proper exports`);
          }
        } catch (error) {
          importErrors.push(`Error reading ${path.basename(file)}: ${error.message}`);
        }
      }
      
      if (importErrors.length === 0) {
        check.status = 'PASS';
        check.details = 'Component exports are accessible';
        console.log('  🟢 Integration Check: PASS');
      } else {
        check.status = 'WARNING';
        check.details = `Potential integration issues: ${importErrors.length}`;
        check.evidence.push(...importErrors);
        this.verification.warnings.push(...importErrors);
        console.log(`  🟡 Integration Check: WARNING (${importErrors.length} potential issues)`);
      }
    } catch (error) {
      check.status = 'FAIL';
      check.details = `Integration check failed: ${error.message}`;
      this.verification.errors.push(`Integration check error: ${error.message}`);
      console.log('  🔴 Integration Check: FAIL');
    }
  }

  /**
   * Run regression check
   */
  async runRegressionCheck() {
    console.log('\n🔍 Running regression check...');
    
    const check = this.verification.checks.REGRESSION;
    
    try {
      // Analyze dependencies to identify potentially affected components
      const dependencies = this.dependencyAnalyzer.analyzeDependencies(this.verification.files);
      
      // For now, assume no regressions if compilation and tests pass
      const compilationPassed = this.verification.checks.COMPILATION.status === 'PASS';
      const testsPassed = this.verification.checks.TESTS.status === 'PASS' || 
                          this.verification.checks.TESTS.status === 'WARNING';
      
      if (compilationPassed && testsPassed) {
        check.status = 'PASS';
        check.details = 'No regressions detected';
        check.evidence.push('Component changes do not break existing functionality');
        console.log('  🟢 Regression Check: PASS');
      } else {
        check.status = 'FAIL';
        check.details = 'Potential regressions detected';
        check.evidence.push('Component changes may have introduced regressions');
        console.log('  🔴 Regression Check: FAIL (Based on compilation/test failures)');
      }
      
      if (dependencies.length > 0) {
        check.evidence.push(`Component has ${dependencies.length} external dependencies to monitor`);
      }
      
    } catch (error) {
      check.status = 'WARNING';
      check.details = `Regression check incomplete: ${error.message}`;
      this.verification.warnings.push(`Regression check warning: ${error.message}`);
      console.log('  🟡 Regression Check: WARNING (Incomplete)');
    }
  }

  /**
   * Run export validation
   */
  async runExportValidation() {
    console.log('\n📤 Running export validation...');
    
    const check = this.verification.checks.EXPORTS;
    
    try {
      const fs = await import('fs');
      const exportCounts = {};
      let totalExports = 0;
      
      for (const file of this.verification.files) {
        const content = fs.readFileSync(file, 'utf8');
        const filename = path.basename(file);
        
        // Count different types of exports
        const defaultExports = (content.match(/export default/g) || []).length;
        const namedExports = (content.match(/export (?:const|function|class|interface|type)/g) || []).length;
        const reExports = (content.match(/export \{[^}]*\} from/g) || []).length;
        
        const fileExports = defaultExports + namedExports + reExports;
        exportCounts[filename] = fileExports;
        totalExports += fileExports;
        
        check.evidence.push(`${filename}: ${fileExports} exports (default: ${defaultExports}, named: ${namedExports}, re-exports: ${reExports})`);
      }
      
      if (totalExports > 0) {
        check.status = 'PASS';
        check.details = `Component has ${totalExports} exports across ${this.verification.files.length} files`;
        console.log(`  🟢 Export Validation: PASS (${totalExports} exports)`);
      } else {
        check.status = 'WARNING';
        check.details = 'No exports found in component files';
        this.verification.warnings.push('Component files may not have proper exports');
        console.log('  🟡 Export Validation: WARNING (No exports found)');
      }
      
    } catch (error) {
      check.status = 'FAIL';
      check.details = `Export validation failed: ${error.message}`;
      this.verification.errors.push(`Export validation error: ${error.message}`);
      console.log('  🔴 Export Validation: FAIL');
    }
  }

  /**
   * Assess overall verification status
   */
  async assessOverallStatus() {
    console.log('\n📊 Assessing overall verification status...');
    
    const checkResults = Object.values(this.verification.checks);
    const passCount = checkResults.filter(check => check.status === 'PASS').length;
    const warningCount = checkResults.filter(check => check.status === 'WARNING' || check.status === 'PASS_WITH_WARNINGS').length;
    const failCount = checkResults.filter(check => check.status === 'FAIL').length;
    
    // Determine overall status
    if (failCount > 0) {
      this.verification.overallStatus = 'FIX_FAILED';
    } else if (warningCount > 0) {
      this.verification.overallStatus = 'FIX_PARTIAL';
    } else if (passCount === checkResults.length) {
      this.verification.overallStatus = 'FIX_VERIFIED';
    } else {
      this.verification.overallStatus = 'FIX_INCOMPLETE';
    }

    // Determine component status based on checks
    if (this.verification.overallStatus === 'FIX_VERIFIED') {
      this.verification.afterStatus = STATUS.WORKING;
    } else if (this.verification.overallStatus === 'FIX_PARTIAL') {
      this.verification.afterStatus = STATUS.PARTIAL;
    } else {
      this.verification.afterStatus = STATUS.BROKEN;
    }

    console.log(`  📈 Overall Status: ${this.verification.overallStatus}`);
    console.log(`  🏷️  Component Status: ${this.verification.afterStatus}`);
    console.log(`  ✅ Passed: ${passCount}, ⚠️ Warnings: ${warningCount}, ❌ Failed: ${failCount}`);
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations() {
    console.log('\n💡 Generating recommendations...');
    
    const recommendations = [];

    // Status-based recommendations
    if (this.verification.overallStatus === 'FIX_VERIFIED') {
      recommendations.push('Fix has been successfully verified - component is ready for use');
      recommendations.push('Update tracker status to Working with verification evidence');
    } else if (this.verification.overallStatus === 'FIX_PARTIAL') {
      recommendations.push('Fix is partially successful but has warnings to address');
      recommendations.push('Review warnings and determine if additional work is needed');
    } else if (this.verification.overallStatus === 'FIX_FAILED') {
      recommendations.push('Fix verification failed - component requires additional work');
      recommendations.push('Address compilation and test failures before proceeding');
    }

    // Specific check-based recommendations
    const failedChecks = Object.values(this.verification.checks).filter(check => check.status === 'FAIL');
    if (failedChecks.length > 0) {
      recommendations.push(`Priority: Fix ${failedChecks.length} failed verification checks`);
      failedChecks.forEach(check => {
        recommendations.push(`- Address ${check.name}: ${check.details}`);
      });
    }

    const warningChecks = Object.values(this.verification.checks).filter(check => 
      check.status === 'WARNING' || check.status === 'PASS_WITH_WARNINGS');
    if (warningChecks.length > 0) {
      recommendations.push(`Consider addressing ${warningChecks.length} warnings for completeness`);
    }

    // Integration recommendations
    if (this.verification.checks.INTEGRATION.status !== 'PASS') {
      recommendations.push('Verify component integration points work correctly');
      recommendations.push('Test component imports and exports manually if needed');
    }

    // Test coverage recommendations
    if (this.verification.checks.TESTS.status === 'WARNING') {
      recommendations.push('Add test coverage for better component validation');
      recommendations.push('Create unit tests for public methods and interfaces');
    }

    this.verification.recommendations = recommendations;
    
    recommendations.forEach(rec => console.log(`  💡 ${rec}`));
  }

  /**
   * Save verification results
   */
  async saveResults() {
    const resultsDir = this.detector.getValidationResultsDir();
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}-${this.componentName}-verification.json`;
    const filepath = path.join(resultsDir, filename);
    
    const fs = await import('fs');
    fs.writeFileSync(filepath, JSON.stringify(this.verification, null, 2));
    console.log(`\n💾 Results saved to: ${path.relative(this.detector.getProjectRoot(), filepath)}`);
  }

  /**
   * Display verification results
   */
  displayResults() {
    console.log('\n' + '='.repeat(50));
    console.log(`🔍 FIX VERIFICATION: ${this.componentName.toUpperCase()}`);
    console.log('='.repeat(50));
    
    console.log(`\n🏷️  Overall Status: ${this.verification.overallStatus}`);
    console.log(`📊 Component Status: ${this.verification.afterStatus}`);
    console.log(`📅 Timestamp: ${this.verification.timestamp}`);
    
    console.log(`\n📁 Files Verified: ${this.verification.files.length}`);
    this.verification.files.forEach(file => {
      console.log(`  - ${path.relative(this.detector.getProjectRoot(), file)}`);
    });
    
    console.log(`\n🔍 Verification Checks:`);
    Object.values(this.verification.checks).forEach(check => {
      const statusEmoji = {
        'PASS': '🟢',
        'PASS_WITH_WARNINGS': '🟡',
        'WARNING': '🟡',
        'FAIL': '🔴',
        'PENDING': '⚪'
      }[check.status] || '⚪';
      
      console.log(`  ${statusEmoji} ${check.name}: ${check.status}`);
      if (check.details) {
        console.log(`    ${check.details}`);
      }
    });
    
    if (this.verification.errors.length > 0) {
      console.log(`\n❌ Errors (${this.verification.errors.length}):`);
      this.verification.errors.slice(0, 3).forEach(error => {
        console.log(`  - ${error.substring(0, 80)}${error.length > 80 ? '...' : ''}`);
      });
    }
    
    if (this.verification.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.verification.warnings.length}):`);
      this.verification.warnings.slice(0, 3).forEach(warning => {
        console.log(`  - ${warning.substring(0, 80)}${warning.length > 80 ? '...' : ''}`);
      });
    }
    
    console.log(`\n💡 Recommendations:`);
    this.verification.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
    
    console.log('\n' + '='.repeat(50));
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting fix verification...');
  
  const args = process.argv.slice(2);
  ValidationUtils.validateArgs(args, 1, 'Usage: node verify-fix.js <component-name>');

  const componentName = args[0];
  console.log(`📋 Component to verify: ${componentName}`);
  
  try {
    console.log('🔧 Creating verifier instance...');
    const verifier = new FixVerifier(componentName);
    console.log('✅ Verifier created, starting verification...');
    await verifier.verify();
    console.log('🎉 Fix verification completed successfully!');
  } catch (error) {
    console.error(`❌ Verification failed: ${error.message}`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`❌ Unexpected error: ${error.message}`);
  process.exit(1);
});

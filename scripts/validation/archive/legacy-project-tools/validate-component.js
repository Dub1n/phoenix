#!/usr/bin/env node

/**
 * Component Validation Script
 * 
 * Purpose: Validates component health and functionality
 * Usage: npm run validate:component <component-name>
 * Integration: Used by issue-fix-selector.md, quick-fix-guide.md, comprehensive-fix-guide.md
 * 
 * Functionality:
 * - Check TypeScript compilation for specific component
 * - Verify component exports and interfaces
 * - Validate component integration points
 * - Check for missing dependencies
 * - Report component health status compatible with tracker updates
 * - Generate evidence in format compatible with fix documentation
 * 
 * Input: Component name or path
 * Output: Validation report with pass/fail status and tracker-compatible evidence
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
  RecommendationGenerator,
  ValidationUtils
} from './validation-helpers.js';

class ComponentValidator {
  constructor(componentName) {
    this.componentName = componentName;
    this.detector = new ProjectDetector();
    this.searcher = new ComponentSearcher(this.detector);
    this.compilationValidator = new CompilationValidator(this.detector);
    this.testValidator = new TestValidator(this.detector);
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.statusCalculator = new StatusCalculator();
    this.evidenceGenerator = new EvidenceGenerator(this.detector);
    this.recommendationGenerator = new RecommendationGenerator();
    
    this.results = {
      componentName,
      timestamp: new Date().toISOString(),
      status: STATUS.UNKNOWN,
      priority: PRIORITY.LOW,
      evidence: [],
      errors: [],
      warnings: [],
      files: [],
      compilationStatus: null,
      testStatus: null,
      dependencies: [],
      recommendations: []
    };
  }

  /**
   * Main validation workflow
   */
  async validate() {
    this.detector.logProjectInfo();
    console.log(`\n🔍 Validating component: ${this.componentName}`);
    console.log('=' .repeat(50));

    try {
      await this.validateFileExistence();
      await this.validateCompilation();
      await this.validateDependencies();
      await this.validateTests();
      await this.assessOverallStatus();
      await this.generateRecommendations();
      await this.saveResults();
      this.displayResults();
    } catch (error) {
      console.error(`❌ Validation failed: ${error.message}`);
      this.results.errors.push(error.message);
      await this.saveResults();
      process.exit(1);
    }
  }

  /**
   * Check if component files exist
   */
  async validateFileExistence() {
    console.log('\n📁 Checking file existence...');
    
    const foundFiles = this.searcher.findComponentFiles(this.componentName);

    foundFiles.forEach(filePath => {
      console.log(`  ✅ Found: ${path.relative(this.detector.getProjectRoot(), filePath)}`);
    });

    if (foundFiles.length === 0) {
      this.results.status = STATUS.MISSING;
      this.results.evidence.push('No component files found in expected locations');
      this.results.priority = PRIORITY.CRITICAL;
      throw new Error(`Component ${this.componentName} not found in any expected location`);
    }

    this.results.files = foundFiles;
    console.log(`  📊 Found ${foundFiles.length} component file(s)`);
  }

  /**
   * Validate TypeScript compilation
   */
  async validateCompilation() {
    console.log('\n🔧 Checking TypeScript compilation...');
    
    const componentProject = this.searcher.getComponentProjectDirectory(this.results.files);
    console.log(`  📂 Using project directory: ${path.relative(this.detector.getProjectRoot(), componentProject)}`);

    const compilationResults = await this.compilationValidator.validateCompilation(this.results.files, componentProject);
    
    this.results.compilationStatus = compilationResults.status;
    this.results.errors.push(...compilationResults.errors);
    this.results.warnings.push(...compilationResults.warnings);
    this.results.evidence.push(...compilationResults.evidence);
  }

  /**
   * Validate component dependencies
   */
  async validateDependencies() {
    console.log('\n🔗 Checking dependencies...');
    
    const dependencies = this.dependencyAnalyzer.analyzeDependencies(this.results.files);
    this.results.dependencies = dependencies;
    
    if (dependencies.length > 0) {
      console.log(`  📦 Found ${dependencies.length} external dependencies`);
      dependencies.forEach(dep => console.log(`    - ${dep}`));
    } else {
      console.log('  📦 No external dependencies found');
    }
  }

  /**
   * Validate component tests
   */
  async validateTests() {
    console.log('\n🧪 Checking test coverage...');
    
    const componentProject = this.searcher.getComponentProjectDirectory(this.results.files);
    const testResults = await this.testValidator.validateTests(this.componentName, this.results.files, componentProject);
    
    this.results.testStatus = testResults.status;
    this.results.errors.push(...testResults.errors);
    this.results.warnings.push(...testResults.warnings);
  }

  /**
   * Assess overall component status using README scoring system
   */
  async assessOverallStatus() {
    console.log('\n📊 Assessing overall status...');
    
    const assessmentData = {
      filesFound: this.results.files.length,
      compilationStatus: this.results.compilationStatus,
      testStatus: this.results.testStatus,
      dependencies: this.results.dependencies
    };

    const statusResult = this.statusCalculator.calculateStatus(assessmentData);
    
    this.results.status = statusResult.status;
    this.results.priority = statusResult.priority;
    this.results.evidence = statusResult.evidence;

    console.log(`  📈 Status Score: ${statusResult.score}/100`);
    console.log(`  🏷️  Final Status: ${this.results.status}`);
    console.log(`  ⚠️  Priority: ${this.results.priority}`);
  }

  /**
   * Generate recommendations based on findings
   */
  async generateRecommendations() {
    console.log('\n💡 Generating recommendations...');
    
    const recommendations = this.recommendationGenerator.generateRecommendations({
      status: this.results.status,
      priority: this.results.priority,
      compilationStatus: this.results.compilationStatus,
      testStatus: this.results.testStatus,
      dependencies: this.results.dependencies
    });

    this.results.recommendations = recommendations;
    
    recommendations.forEach(rec => console.log(`  💡 ${rec}`));
  }

  /**
   * Save validation results to file
   */
  async saveResults() {
    await this.evidenceGenerator.saveValidationResults(this.componentName, this.results);
  }

  /**
   * Display validation results
   */
  displayResults() {
    ValidationUtils.displayResults(this.componentName, this.results, this.detector.getProjectRoot());
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting component validation...');
  
  const args = process.argv.slice(2);
  ValidationUtils.validateArgs(args, 1, 'Usage: node validate-component.js <component-name>');

  const componentName = args[0];
  console.log(`📋 Component to validate: ${componentName}`);
  
  try {
    console.log('🔧 Creating validator instance...');
    const validator = new ComponentValidator(componentName);
    console.log('✅ Validator created, starting validation...');
    await validator.validate();
    console.log('🎉 Validation completed successfully!');
  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`❌ Unexpected error: ${error.message}`);
  process.exit(1);
});
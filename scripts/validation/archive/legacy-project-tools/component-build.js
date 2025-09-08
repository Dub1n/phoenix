#!/usr/bin/env node

/**
 * Component Build Script
 * 
 * Purpose: Build and validate individual components instead of entire project
 * Usage: npm run build:component <component-name>
 * Integration: Used by quick-fix-guide.md and comprehensive-fix-guide.md during implementation
 * 
 * Functionality:
 * - Compile specific component and its dependencies
 * - Run TypeScript check for component files only
 * - Execute component-specific tests
 * - Validate component exports and interfaces
 * - Generate focused build report for agent workflows
 * - Skip unrelated project files for faster feedback
 * 
 * Input: Component name or file path
 * Output: Component-specific build results with clear pass/fail status
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  STATUS,
  PRIORITY,
  ProjectDetector,
  ComponentSearcher,
  CompilationValidator,
  TestValidator,
  ValidationUtils
} from './validation-helpers.js';

class ComponentBuilder {
  constructor(componentName) {
    this.componentName = componentName;
    this.detector = new ProjectDetector();
    this.searcher = new ComponentSearcher(this.detector);
    this.compilationValidator = new CompilationValidator(this.detector);
    this.testValidator = new TestValidator(this.detector);
    
    this.buildResult = {
      componentName,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      compilationStatus: 'PENDING',
      testStatus: 'PENDING',
      files: [],
      errors: [],
      warnings: [],
      buildTime: 0,
      recommendations: []
    };
  }

  /**
   * Main component build workflow
   */
  async build() {
    console.log(`\n🔨 Building component: ${this.componentName}`);
    console.log('='.repeat(50));
    
    const startTime = Date.now();
    
    try {
      await this.findComponentFiles();
      await this.runComponentCompilation();
      await this.runComponentTests();
      await this.assessBuildStatus();
      await this.generateRecommendations();
      
      this.buildResult.buildTime = Date.now() - startTime;
      this.displayResults();
      
      // Exit with appropriate code for CI/automation
      if (this.buildResult.status === 'SUCCESS') {
        process.exit(0);
      } else {
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Component build failed: ${error.message}`);
      this.buildResult.errors.push(error.message);
      this.buildResult.status = 'ERROR';
      this.buildResult.buildTime = Date.now() - startTime;
      process.exit(1);
    }
  }

  /**
   * Find component files and dependencies
   */
  async findComponentFiles() {
    console.log('\n📁 Finding component files...');
    
    const foundFiles = this.searcher.findComponentFiles(this.componentName);
    
    if (foundFiles.length === 0) {
      throw new Error(`Component ${this.componentName} not found in any expected location`);
    }

    this.buildResult.files = foundFiles;
    console.log(`  📊 Found ${foundFiles.length} component file(s):`);
    foundFiles.forEach(file => {
      console.log(`    - ${path.relative(this.detector.getProjectRoot(), file)}`);
    });
  }

  /**
   * Run TypeScript compilation for component
   */
  async runComponentCompilation() {
    console.log('\n⚡ Running component compilation...');
    
    const componentProject = this.searcher.getComponentProjectDirectory(this.buildResult.files);
    const compilationResults = await this.compilationValidator.validateCompilation(this.buildResult.files, componentProject);
    
    if (compilationResults.status === 'Clean compilation') {
      this.buildResult.compilationStatus = 'SUCCESS';
      console.log('  🟢 Component Compilation: SUCCESS (0 errors)');
    } else if (compilationResults.status === 'Compiles with warnings') {
      this.buildResult.compilationStatus = 'SUCCESS_WITH_WARNINGS';
      this.buildResult.warnings.push(...compilationResults.warnings);
      console.log(`  🟡 Component Compilation: SUCCESS WITH WARNINGS (${compilationResults.warnings.length} warnings)`);
    } else {
      this.buildResult.compilationStatus = 'FAILED';
      this.buildResult.errors.push(...compilationResults.errors);
      console.log(`  🔴 Component Compilation: FAILED (${compilationResults.errors.length} errors)`);
    }
  }

  /**
   * Run component-specific tests
   */
  async runComponentTests() {
    console.log('\n🧪 Running component tests...');
    
    const componentProject = this.searcher.getComponentProjectDirectory(this.buildResult.files);
    const testResults = await this.testValidator.validateTests(this.componentName, this.buildResult.files, componentProject);
    
    if (testResults.status === 'Tests pass') {
      this.buildResult.testStatus = 'SUCCESS';
      console.log(`  🟢 Component Tests: SUCCESS (${testResults.testFiles.length} test files)`);
    } else if (testResults.status === 'No tests found') {
      this.buildResult.testStatus = 'NO_TESTS';
      this.buildResult.warnings.push('Component lacks test coverage');
      console.log('  🟡 Component Tests: NO TESTS FOUND');
    } else {
      this.buildResult.testStatus = 'FAILED';
      this.buildResult.errors.push(...testResults.errors);
      console.log(`  🔴 Component Tests: FAILED (${testResults.errors.length} errors)`);
    }
  }

  /**
   * Assess overall build status
   */
  async assessBuildStatus() {
    console.log('\n📊 Assessing build status...');
    
    if (this.buildResult.errors.length > 0) {
      this.buildResult.status = 'FAILED';
    } else if (this.buildResult.warnings.length > 0) {
      this.buildResult.status = 'SUCCESS_WITH_WARNINGS';
    } else {
      this.buildResult.status = 'SUCCESS';
    }

    console.log(`  📈 Build Status: ${this.buildResult.status}`);
    console.log(`  ⏱️  Build Time: ${this.buildResult.buildTime}ms`);
  }

  /**
   * Generate build recommendations
   */
  async generateRecommendations() {
    const recommendations = [];

    if (this.buildResult.status === 'SUCCESS') {
      recommendations.push('Component build successful - ready for integration');
      recommendations.push('Consider running full project build to verify system integration');
    } else if (this.buildResult.status === 'SUCCESS_WITH_WARNINGS') {
      recommendations.push('Component builds with warnings - review and address if needed');
      recommendations.push(`Address ${this.buildResult.warnings.length} warnings for better code quality`);
    } else if (this.buildResult.status === 'FAILED') {
      recommendations.push('Component build failed - address errors before proceeding');
      recommendations.push(`Fix ${this.buildResult.errors.length} compilation/test errors`);
    }

    // Specific recommendations based on results
    if (this.buildResult.compilationStatus === 'FAILED') {
      recommendations.push('Priority: Fix TypeScript compilation errors');
      recommendations.push('Use: npm run lint to see detailed error locations');
    }

    if (this.buildResult.testStatus === 'FAILED') {
      recommendations.push('Priority: Fix failing component tests');
      recommendations.push('Use: npm test to see detailed test failures');
    }

    if (this.buildResult.testStatus === 'NO_TESTS') {
      recommendations.push('Consider: Add unit tests for component validation');
      recommendations.push('Reference: Create test file following project test patterns');
    }

    this.buildResult.recommendations = recommendations;
  }

  /**
   * Display build results
   */
  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log(`🔨 COMPONENT BUILD: ${this.componentName.toUpperCase()}`);
    console.log('='.repeat(60));
    
    // Status indicators
    const statusEmoji = {
      'SUCCESS': '🟢',
      'SUCCESS_WITH_WARNINGS': '🟡',
      'FAILED': '🔴',
      'ERROR': '💥'
    }[this.buildResult.status] || '⚪';
    
    console.log(`\n${statusEmoji} Overall Status: ${this.buildResult.status}`);
    console.log(`⏱️  Build Time: ${this.buildResult.buildTime}ms`);
    console.log(`📅 Timestamp: ${this.buildResult.timestamp}`);
    
    // Component details
    console.log(`\n📁 Component Files: ${this.buildResult.files.length}`);
    this.buildResult.files.forEach(file => {
      console.log(`  - ${path.relative(this.detector.getProjectRoot(), file)}`);
    });
    
    // Compilation status
    const compileEmoji = {
      'SUCCESS': '🟢',
      'SUCCESS_WITH_WARNINGS': '🟡',
      'FAILED': '🔴'
    }[this.buildResult.compilationStatus] || '⚪';
    console.log(`\n${compileEmoji} Compilation: ${this.buildResult.compilationStatus}`);
    
    // Test status
    const testEmoji = {
      'SUCCESS': '🟢',
      'NO_TESTS': '🟡',
      'FAILED': '🔴'
    }[this.buildResult.testStatus] || '⚪';
    console.log(`${testEmoji} Tests: ${this.buildResult.testStatus}`);
    
    // Errors and warnings
    if (this.buildResult.errors.length > 0) {
      console.log(`\n❌ Errors (${this.buildResult.errors.length}):`);
      this.buildResult.errors.slice(0, 5).forEach(error => {
        console.log(`  - ${error.substring(0, 100)}${error.length > 100 ? '...' : ''}`);
      });
    }
    
    if (this.buildResult.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.buildResult.warnings.length}):`);
      this.buildResult.warnings.slice(0, 3).forEach(warning => {
        console.log(`  - ${warning.substring(0, 100)}${warning.length > 100 ? '...' : ''}`);
      });
    }
    
    // Recommendations
    console.log(`\n💡 Next Steps:`);
    this.buildResult.recommendations.forEach(rec => {
      console.log(`  - ${rec}`);
    });
    
    console.log('\n' + '='.repeat(60));
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting component build...');
  
  const args = process.argv.slice(2);
  ValidationUtils.validateArgs(args, 1, 'Usage: node component-build.js <component-name>');

  const componentName = args[0];
  console.log(`📋 Component to build: ${componentName}`);
  
  try {
    const builder = new ComponentBuilder(componentName);
    await builder.build();
  } catch (error) {
    console.error(`❌ Component build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`❌ Unexpected error: ${error.message}`);
  process.exit(1);
});
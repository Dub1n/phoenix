#!/usr/bin/env node

/**
 * Build Validator - Enhanced Modular Implementation
 * 
 * Implements IValidator interface for Compilation/Build Tasks validation.
 * Extracted and enhanced from category-validators.js to support the new
 * modular architecture with safety framework compliance.
 * 
 * Category: Compilation/Build Tasks
 * Description: TypeScript fixes, library compatibility, build configuration
 * Source: TEMPLUM-TESTING-GUIDE.md Section 4
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 * Interface Version: 3.0.0
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Build Validator implementing IValidator interface
 */
export class BuildValidator {
  constructor() {
    this.category = 'build';
    this.version = '3.0.0';
    // TODO: [TASK-VAL-BUILD-FIX-001] Pattern: scope-aware-build-validation | Complexity: 7 | Dependencies: file-system,build-tools
    // Context: Build validator now supports scope-based filtering to optimize validation performance for targeted changes
    // Validation-Required: scope-pattern-matching, conditional-test-execution, performance-improvement
    // Pattern-Info: { approach: "file-pattern-matching", alternatives: "full-validation", trade-offs: "accuracy-vs-speed" }
    this.scopes = [
      'package.json',
      'tsconfig.json', 
      '*.config.*',
      'src/**/*.ts',
      'src/**/*.js',
      'build/**/*',
      'scripts/**/*',
      '**/*.d.ts'
    ];
    this.hasIntegrationTests = false;
    
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
      warnings: []
    };

    try {
      // Process scope configuration for targeted validation
      const scopeAnalysis = this.analyzeScopeForBuildRelevance(scopeConfig);
      
      console.log('  Executing Compilation/Build validation commands...');
      console.log('  Source: TEMPLUM-TESTING-GUIDE.md Section 4');
      
      if (scopeAnalysis.hasNoRelevantFiles) {
        result.status = 'SKIP';
        result.warnings.push('Scope contains no build-relevant files - skipping build validation');
        result.evidence.push(`Analyzed scope patterns: ${scopeAnalysis.patterns.join(', ')}`);
        result.evidence.push('Scope optimization: Build validation skipped for performance');
        result.duration = Date.now() - this.validationStartTime;
        console.log('  🟡 SKIP - No build-relevant files in scope');
        return result;
      }
      
      // Add scope evidence
      result.evidence.push(`Scope-aware validation: ${scopeAnalysis.relevantPatterns.length} relevant patterns`);
      if (scopeAnalysis.optimizations.length > 0) {
        result.evidence.push(`Applied optimizations: ${scopeAnalysis.optimizations.join(', ')}`);
      }
      
      // Test 1: Clean build test (conditional based on scope)
      if (scopeAnalysis.requiresBuild) {
        const buildTest = await this.executeCleanBuildTest(projectInfo, scopeAnalysis);
        result.tests.push(buildTest);
      } else {
        result.tests.push({
          name: 'Clean Build Test',
          status: 'SKIP',
          message: 'Skipped - scope contains only non-build files',
          evidence: ['Scope optimization: Build test not required for current file changes'],
          errors: [],
          warnings: []
        });
      }
      
      // Test 2: TypeScript type checking (conditional based on scope)
      if (scopeAnalysis.requiresTypeChecking) {
        const typeCheckTest = await this.executeTypeScriptTypeChecking(projectInfo, scopeAnalysis);
        result.tests.push(typeCheckTest);
      } else {
        result.tests.push({
          name: 'TypeScript Type Checking',
          status: 'SKIP',
          message: 'Skipped - scope contains no TypeScript files',
          evidence: ['Scope optimization: TypeScript validation not required for current file changes'],
          errors: [],
          warnings: []
        });
      }
      
      // Test 3: Dependency validation (conditional based on scope)
      if (scopeAnalysis.requiresDependencyCheck) {
        const dependencyTest = await this.executeDependencyValidation(projectInfo, scopeAnalysis);
        result.tests.push(dependencyTest);
      } else {
        result.tests.push({
          name: 'Dependency Validation',
          status: 'SKIP',
          message: 'Skipped - scope does not affect dependencies',
          evidence: ['Scope optimization: Dependency validation not required for current file changes'],
          errors: [],
          warnings: []
        });
      }
      
      // Test 4: Build artifact verification (conditional based on scope)
      if (scopeAnalysis.requiresArtifactCheck) {
        const artifactTest = await this.executeBuildArtifactVerification(projectInfo, scopeAnalysis);
        result.tests.push(artifactTest);
      } else {
        result.tests.push({
          name: 'Build Artifact Verification',
          status: 'SKIP',
          message: 'Skipped - scope does not affect build artifacts',
          evidence: ['Scope optimization: Artifact verification not required for current file changes'],
          errors: [],
          warnings: []
        });
      }

      // Determine overall result with scope-aware logic
      const failedTests = result.tests.filter(t => t.status === 'FAIL');
      const passedTests = result.tests.filter(t => t.status === 'PASS');
      const warnTests = result.tests.filter(t => t.status === 'WARN');
      const skippedTests = result.tests.filter(t => t.status === 'SKIP');
      
      if (failedTests.length > 0) {
        result.status = 'FAIL';
        result.errors.push(`${failedTests.length} build tests failed`);
      } else if (passedTests.length > 0) {
        result.status = warnTests.length > 0 ? 'WARN' : 'PASS';
      } else if (skippedTests.length === result.tests.length) {
        result.status = 'PASS';
        result.warnings.push('All build tests were skipped due to scope optimization - no relevant changes detected');
        result.evidence.push('Performance optimization: Validation completed in minimal time due to scope filtering');
      } else {
        result.status = 'FAIL';
        result.errors.push('No build tests completed successfully');
      }
      
      // Collect evidence and errors from tests
      for (const test of result.tests) {
        if (test.evidence) result.evidence.push(...test.evidence);
        if (test.errors) result.errors.push(...test.errors);
        if (test.warnings) result.warnings.push(...test.warnings);
      }
      
      result.duration = Date.now() - this.validationStartTime;
      console.log(`  Compilation/Build validation tests completed in ${result.duration}ms`);
      
      return result;
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(`Build validation failed: ${error.message}`);
      result.duration = Date.now() - this.validationStartTime;
      return result;
    }
  }

  /**
   * Get validator capabilities
   */
  getCapabilities() {
    return {
      supportedProjects: ['Templum', 'Haruspex', 'phoenix-code-lite'],
      supportedScopes: this.scopes,
      requiredDependencies: ['typescript', 'npm'],
      performanceProfile: 'scope-aware'
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
        name: 'TypeScript Compiler',
        status: this.checkTypeScriptCompiler()
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
      description: 'Compilation/Build Tasks - TypeScript fixes, library compatibility, build configuration',
      lastUpdated: '2025-09-06',
      testCoverage: 85
    };
  }

  /**
   * Execute clean build test
   */
  async executeCleanBuildTest(projectInfo) {
    console.log('    Clean Build Test...');
    const test = {
      name: 'Clean Build Test',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: [],
      warnings: []
    };

    // Check if build command is available
    if (!projectInfo.buildCommand) {
      test.status = 'SKIP';
      test.message = 'No build command configured';
      test.warnings.push('Build command not found in project configuration or package.json scripts');
      test.evidence.push('Add "build" command to valconfig.json or "build" script to package.json');
      console.log('      🟡 SKIP - No build command configured');
      return test;
    }

    try {
      const originalCwd = process.cwd();
      process.chdir(projectInfo.path);

      console.log(`      Executing build command: ${projectInfo.buildCommand}`);
      const buildOutput = execSync(projectInfo.buildCommand, {
        encoding: 'utf8',
        timeout: 180000 // 3 minutes max
      });

      process.chdir(originalCwd);

      test.status = 'PASS';
      test.message = 'Clean build completed successfully';
      test.evidence.push('Build command executed without errors');
      test.evidence.push(`Build output length: ${buildOutput.length} characters`);
      console.log('      ✅ PASS - Clean build successful');

    } catch (error) {
      process.chdir(process.cwd());
      test.status = 'FAIL';
      test.message = 'Clean build failed';
      test.errors.push(`Build command failed: ${error.message}`);
      
      if (error.stdout) {
        test.evidence.push(`Build stdout: ${error.stdout.substring(0, 500)}...`);
      }
      if (error.stderr) {
        test.evidence.push(`Build stderr: ${error.stderr.substring(0, 500)}...`);
      }
      
      console.log('      ❌ FAIL - Clean build failed');
    }

    return test;
  }

  /**
   * Execute TypeScript type checking
   */
  async executeTypeScriptTypeChecking(projectInfo) {
    console.log('    TypeScript Type Checking...');
    const test = {
      name: 'TypeScript Type Checking',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      if (!projectInfo.hasTypeScript) {
        test.status = 'SKIP';
        test.message = 'TypeScript not detected in project';
        test.evidence.push('No tsconfig.json found - skipping TypeScript validation');
        console.log('      🟡 SKIP - No TypeScript configuration found');
        return test;
      }

      const originalCwd = process.cwd();
      process.chdir(projectInfo.path);

      console.log('      Executing: npx tsc --noEmit');
      const tscOutput = execSync('npx tsc --noEmit', {
        encoding: 'utf8',
        timeout: 120000 // 2 minutes max
      });

      process.chdir(originalCwd);

      test.status = 'PASS';
      test.message = 'TypeScript type checking passed';
      test.evidence.push('TypeScript compilation completed without type errors');
      console.log('      ✅ PASS - TypeScript type checking successful');

    } catch (error) {
      process.chdir(process.cwd());
      
      test.status = 'FAIL';
      test.message = 'TypeScript type checking failed';
      test.errors.push('TypeScript compiler found type errors');
      
      // Parse TypeScript errors
      const errorOutput = error.stdout || error.stderr || error.message;
      const typeErrors = this.parseTypeScriptErrors(errorOutput);
      if (typeErrors.length > 0) {
        test.evidence.push(`TypeScript errors found: ${typeErrors.length}`);
        test.evidence.push(`First few errors: ${typeErrors.slice(0, 3).join('; ')}`);
      }
      
      console.log('      ❌ FAIL - TypeScript type checking failed');
    }

    return test;
  }

  /**
   * Execute dependency validation
   */
  async executeDependencyValidation(projectInfo) {
    console.log('    Dependency Validation...');
    const test = {
      name: 'Dependency Validation',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      const originalCwd = process.cwd();
      process.chdir(projectInfo.path);

      console.log('      Executing: npm ls --depth=0');
      const lsOutput = execSync('npm ls --depth=0', {
        encoding: 'utf8',
        timeout: 60000
      });

      process.chdir(originalCwd);

      // Check for dependency conflicts
      if (lsOutput.includes('UNMET DEPENDENCY') || lsOutput.includes('missing:')) {
        test.status = 'FAIL';
        test.message = 'Dependency validation failed - missing dependencies';
        test.errors.push('Missing dependencies detected');
      } else if (lsOutput.includes('extraneous:')) {
        test.status = 'WARN';
        test.message = 'Dependency validation passed with warnings - extraneous packages';
        test.warnings.push('Extraneous dependencies detected');
      } else {
        test.status = 'PASS';
        test.message = 'Dependency validation passed';
      }
      
      test.evidence.push('Dependency tree analysis completed');
      console.log(`      ${test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '🟡' : '❌'} ${test.status} - ${test.message}`);

    } catch (error) {
      process.chdir(process.cwd());
      
      // npm ls returns exit code 1 for warnings, check if output exists
      if (error.status === 1 && error.stdout && error.stdout.includes('npm ls')) {
        test.status = 'WARN';
        test.message = 'Dependency validation completed with warnings';
        test.warnings.push('Dependency tree has some issues but is functional');
        test.evidence.push('npm ls executed but returned warnings');
        console.log('      🟡 WARN - Dependency validation completed with warnings');
      } else {
        test.status = 'FAIL';
        test.message = 'Dependency validation failed';
        test.errors.push(`Dependency check failed: ${error.message}`);
        console.log('      ❌ FAIL - Dependency validation failed');
      }
    }

    return test;
  }

  /**
   * Execute build artifact verification
   */
  async executeBuildArtifactVerification(projectInfo) {
    console.log('    Build Artifact Verification...');
    const test = {
      name: 'Build Artifact Verification',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      const distPath = path.join(projectInfo.path, 'dist');
      const buildPath = path.join(projectInfo.path, 'build');
      const outPath = path.join(projectInfo.path, 'out');
      
      let artifactPath = null;
      if (fs.existsSync(distPath)) {
        artifactPath = distPath;
      } else if (fs.existsSync(buildPath)) {
        artifactPath = buildPath;
      } else if (fs.existsSync(outPath)) {
        artifactPath = outPath;
      }

      if (artifactPath) {
        test.evidence.push(`Build artifacts directory found: ${path.basename(artifactPath)}`);
        
        // Count build artifacts
        const files = fs.readdirSync(artifactPath);
        const buildFiles = files.filter(file => 
          file.endsWith('.js') || file.endsWith('.d.ts') || file.endsWith('.map') || file.endsWith('.mjs')
        );
        
        if (buildFiles.length > 0) {
          test.status = 'PASS';
          test.message = `Build artifacts verified - ${buildFiles.length} files found`;
          test.evidence.push(`Build files found: ${buildFiles.length}`);
          console.log(`      ✅ PASS - Found ${buildFiles.length} build artifacts`);
        } else {
          test.status = 'WARN';
          test.message = 'Build directory exists but contains no recognizable build files';
          test.warnings.push('Build directory may not contain expected artifacts');
          console.log('      🟡 WARN - Build directory exists but no build files found');
        }
      } else {
        test.status = 'WARN';
        test.message = 'No build artifacts directory found (may not be required for this project)';
        test.warnings.push('No standard build output directories found (dist, build, out)');
        test.evidence.push('Build artifact verification skipped - no output directory detected');
        console.log('      🟡 WARN - No build artifacts directory found');
      }

    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Build artifact verification failed';
      test.errors.push(`Artifact verification error: ${error.message}`);
      console.log('      ❌ FAIL - Build artifact verification failed');
    }

    return test;
  }

  /**
   * Parse TypeScript compilation errors
   */
  parseTypeScriptErrors(output) {
    if (!output) return [];
    
    const lines = output.split('\n');
    const errors = lines.filter(line => 
      line.includes('error TS') || 
      line.includes(': error') ||
      (line.includes('(') && line.includes(',') && line.includes('):'))
    );
    
    return errors.slice(0, 10); // Return first 10 errors
  }

  /**
   * Check required dependencies
   */
  checkDependencies() {
    const dependencies = ['npm', 'node'];
    for (const dep of dependencies) {
      try {
        execSync(`${dep} --version`, { timeout: 5000, stdio: 'ignore' });
      } catch (error) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check TypeScript compiler availability
   */
  checkTypeScriptCompiler() {
    try {
      execSync('npx tsc --version', { timeout: 5000, stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup resources (no cleanup needed for build validator)
   */
  async cleanup() {
    // Build validator doesn't need cleanup
  }

  /**
   * Analyze scope configuration to determine build validation requirements
   */
  analyzeScopeForBuildRelevance(scopeConfig) {
    const analysis = {
      patterns: [],
      relevantPatterns: [],
      hasNoRelevantFiles: false,
      requiresBuild: false,
      requiresTypeChecking: false,
      requiresDependencyCheck: false,
      requiresArtifactCheck: false,
      optimizations: []
    };

    // Handle missing or empty scope - default to full validation
    if (!scopeConfig || !scopeConfig.patterns || scopeConfig.patterns.length === 0) {
      analysis.requiresBuild = true;
      analysis.requiresTypeChecking = true;
      analysis.requiresDependencyCheck = true;
      analysis.requiresArtifactCheck = true;
      analysis.patterns = ['*'];
      analysis.relevantPatterns = ['*'];
      return analysis;
    }

    analysis.patterns = Array.isArray(scopeConfig.patterns) ? scopeConfig.patterns : [scopeConfig.patterns];
    
    // Check each pattern for build relevance
    for (const pattern of analysis.patterns) {
      const isRelevant = this.isPatternBuildRelevant(pattern);
      
      if (isRelevant.relevant) {
        analysis.relevantPatterns.push(pattern);
        
        if (isRelevant.requiresBuild) analysis.requiresBuild = true;
        if (isRelevant.requiresTypeChecking) analysis.requiresTypeChecking = true;
        if (isRelevant.requiresDependencyCheck) analysis.requiresDependencyCheck = true;
        if (isRelevant.requiresArtifactCheck) analysis.requiresArtifactCheck = true;
      }
    }

    // Determine if scope has no relevant files
    analysis.hasNoRelevantFiles = analysis.relevantPatterns.length === 0;
    
    // Add optimization notes
    if (analysis.hasNoRelevantFiles) {
      analysis.optimizations.push('complete-skip');
    } else {
      if (!analysis.requiresBuild) analysis.optimizations.push('skip-build-test');
      if (!analysis.requiresTypeChecking) analysis.optimizations.push('skip-typescript-check');
      if (!analysis.requiresDependencyCheck) analysis.optimizations.push('skip-dependency-check');
      if (!analysis.requiresArtifactCheck) analysis.optimizations.push('skip-artifact-check');
    }

    return analysis;
  }

  /**
   * Determine if a file pattern is relevant for build validation
   */
  isPatternBuildRelevant(pattern) {
    const result = {
      relevant: false,
      requiresBuild: false,
      requiresTypeChecking: false,
      requiresDependencyCheck: false,
      requiresArtifactCheck: false
    };

    // TypeScript files
    if (pattern.includes('.ts') || pattern.includes('src/')) {
      result.relevant = true;
      result.requiresBuild = true;
      result.requiresTypeChecking = true;
      result.requiresArtifactCheck = true;
    }
    
    // JavaScript files
    if (pattern.includes('.js') || pattern.includes('.mjs')) {
      result.relevant = true;
      result.requiresBuild = true;
      result.requiresArtifactCheck = true;
    }
    
    // Configuration files that affect build
    if (pattern.includes('package.json') || pattern.includes('tsconfig.json') || 
        pattern.includes('.config.') || pattern.includes('webpack') || pattern.includes('vite')) {
      result.relevant = true;
      result.requiresBuild = true;
      result.requiresTypeChecking = true;
      result.requiresDependencyCheck = true;
      result.requiresArtifactCheck = true;
    }
    
    // Build directories
    if (pattern.includes('build/') || pattern.includes('dist/') || pattern.includes('out/')) {
      result.relevant = true;
      result.requiresArtifactCheck = true;
    }
    
    // Scripts that might affect build
    if (pattern.includes('scripts/') || pattern.includes('.sh') || pattern.includes('.bat')) {
      result.relevant = true;
      result.requiresBuild = true;
    }

    return result;
  }
}

export default BuildValidator;
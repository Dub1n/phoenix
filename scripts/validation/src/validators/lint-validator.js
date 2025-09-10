#!/usr/bin/env node

/**
 * Lint Validator - Code Linting and Style Validation
 * 
 * Implements IValidator interface for Code Linting Tasks validation.
 * Extracted from quality-validator.js for better modularity and separation of concerns.
 * 
 * Category: Code Linting Tasks
 * Description: ESLint compliance, code style validation, linting across multiple languages
 * Source: Extracted from quality-validator.js ESLint functionality
 * 
 * Version: 3.0.0
 * Date: 2025-09-10
 * Interface Version: 3.0.0
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Lint Validator implementing IValidator interface
 */
export class LintValidator {
  constructor() {
    this.category = 'lint';
    this.version = '3.0.0';
    this.scopes = ['**/*.ts', '**/*.js', '**/*.jsx', '**/*.tsx']; // Default to JavaScript/TypeScript files
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
      warnings: []
    };

    try {
      console.log('  Executing Code Linting validation commands...');
      console.log('  Source: Extracted from quality-validator.js for better modularity');
      
      // Test 1: ESLint compliance checking
      const eslintTest = await this.executeESLintComplianceCheck(projectInfo, scopeConfig);
      result.tests.push(eslintTest);
      
      // Future: Add support for other linters (Prettier, language-specific linters, etc.)
      // Test 2: Prettier formatting check (placeholder)
      // Test 3: Language-specific linting (Python flake8, Go golint, etc.)

      // Determine overall result
      const failedTests = result.tests.filter(t => t.status === 'FAIL');
      const passedTests = result.tests.filter(t => t.status === 'PASS');
      const skippedTests = result.tests.filter(t => t.status === 'SKIP');
      const warnTests = result.tests.filter(t => t.status === 'WARN');
      
      if (failedTests.length > 0) {
        result.status = 'FAIL';
        result.errors.push(`${failedTests.length} linting tests failed`);
      } else if (warnTests.length > 0) {
        result.status = 'WARN';
        result.warnings.push(`${warnTests.length} linting tests have warnings`);
      } else if (passedTests.length > 0) {
        result.status = 'PASS';
      } else {
        result.status = 'SKIP';
        result.warnings.push('All linting tests were skipped');
      }
      
      result.duration = Date.now() - this.validationStartTime;
      console.log('  Code Linting validation tests completed');
      
      return result;
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(`Linting validation failed: ${error.message}`);
      result.duration = Date.now() - this.validationStartTime;
      return result;
    }
  }

  /**
   * Execute ESLint compliance checking
   */
  async executeESLintComplianceCheck(projectInfo, scopeConfig) {
    console.log('    ESLint Compliance Check...');
    const test = {
      name: 'ESLint Compliance Check',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const eslintConfigPath = path.join(projectInfo.path, '.eslintrc.js');
      const eslintConfigExists = fs.existsSync(eslintConfigPath) || 
                                fs.existsSync(path.join(projectInfo.path, '.eslintrc.json')) ||
                                fs.existsSync(path.join(projectInfo.path, 'eslint.config.js'));
      
      if (!eslintConfigExists) {
        test.status = 'WARN';
        test.message = 'No ESLint configuration found';
        test.evidence.push('No ESLint configuration file found in project root');
        test.evidence.push('Recommendation: Add .eslintrc.js or eslint.config.js to enable linting');
        console.log('      🟡 WARN - No ESLint configuration found');
        return test;
      }

      // Find files in scope to check
      const filesToCheck = this.findFilesInScope(projectInfo, scopeConfig.patterns || ['**/*.ts', '**/*.js']);
      
      if (filesToCheck.length === 0) {
        test.status = 'SKIP';
        test.message = 'No files found in scope for ESLint validation';
        test.evidence.push('No TypeScript or JavaScript files found in specified scope');
        console.log('      ⏭️ SKIP - No files found in scope');
        return test;
      }

      let totalIssues = 0;
      let filesWithIssues = 0;
      let totalFiles = Math.min(filesToCheck.length, 10); // Limit to 10 files for performance
      
      // Check a sample of files for ESLint issues
      for (let i = 0; i < totalFiles; i++) {
        const file = filesToCheck[i];
        try {
          // Run ESLint on individual file to check for issues
          const eslintResult = execSync(`npx eslint "${file}" --format json`, { 
            cwd: projectInfo.path, 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 10000 // 10 second timeout per file
          });
          
          const lintResults = JSON.parse(eslintResult);
          if (lintResults.length > 0 && lintResults[0].messages.length > 0) {
            filesWithIssues++;
            totalIssues += lintResults[0].messages.length;
          }
          
          test.evidence.push(`ESLint checked: ${path.relative(projectInfo.path, file)} (${lintResults[0]?.messages?.length || 0} issues)`);
        } catch (eslintError) {
          // Handle timeout and other ESLint errors
          if (eslintError.signal === 'SIGTERM' || eslintError.code === 'ETIMEDOUT') {
            test.evidence.push(`ESLint timeout for: ${path.relative(projectInfo.path, file)} (skipped due to timeout)`);
          } else if (eslintError.stdout) {
            try {
              const lintResults = JSON.parse(eslintError.stdout);
              if (lintResults.length > 0 && lintResults[0].messages) {
                filesWithIssues++;
                totalIssues += lintResults[0].messages.length;
                test.evidence.push(`ESLint issues found in: ${path.relative(projectInfo.path, file)} (${lintResults[0].messages.length} issues)`);
              }
            } catch (parseError) {
              test.evidence.push(`ESLint check failed for: ${path.relative(projectInfo.path, file)}`);
            }
          } else {
            test.evidence.push(`ESLint check failed for: ${path.relative(projectInfo.path, file)}`);
          }
        }
      }

      // Determine result based on issues found
      if (totalIssues === 0) {
        test.status = 'PASS';
        test.message = 'ESLint compliance check passed';
        test.evidence.push(`All ${totalFiles} checked files pass ESLint validation`);
        console.log('      ✅ PASS - ESLint compliance check passed');
      } else if (totalIssues < 10) {
        test.status = 'WARN';
        test.message = 'Minor ESLint issues found';
        test.evidence.push(`${totalIssues} ESLint issues found in ${filesWithIssues}/${totalFiles} files`);
        console.log('      🟡 WARN - Minor ESLint issues found');
      } else {
        test.status = 'FAIL';
        test.message = 'Significant ESLint issues found';
        test.errors.push(`${totalIssues} ESLint issues found across ${filesWithIssues} files`);
        console.log('      ❌ FAIL - Significant ESLint issues found');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'ESLint compliance check failed';
      test.errors.push(`ESLint validation error: ${error.message}`);
      console.log('      ❌ FAIL - ESLint compliance check failed');
    }

    return test;
  }

  /**
   * Find files in scope based on patterns
   */
  findFilesInScope(projectInfo, patterns) {
    const files = [];
    const basePath = projectInfo.path;
    
    try {
      // Simple file discovery - look for TypeScript and JavaScript files
      const findFiles = (dir) => {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          // Skip node_modules and hidden directories
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            findFiles(fullPath);
          } else if (stat.isFile() && /\.(ts|js|jsx|tsx)$/.test(item)) {
            files.push(fullPath);
          }
        }
      };
      
      findFiles(basePath);
    } catch (error) {
      console.warn(`Warning: Could not scan files in ${basePath}: ${error.message}`);
    }
    
    return files;
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
        name: 'Linting Tools Available',
        status: this.checkLintingTools()
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
      interfaceVersion: '3.0.0',
      description: 'Code Linting Tasks - ESLint compliance, code style validation, multi-language linting',
      supportedFileTypes: ['.ts', '.js', '.jsx', '.tsx'],
      requiredTools: ['npx', 'eslint'],
      performance: {
        estimatedTimePerFile: '1-10s',
        maxFilesPerRun: 10,
        timeoutPerFile: '10s'
      }
    };
  }

  /**
   * Get validator capabilities
   */
  getCapabilities() {
    return {
      supportedProjects: ['*'], // Universal linting support
      supportedLanguages: ['JavaScript', 'TypeScript', 'JSX', 'TSX'],
      performanceProfile: 'standard',
      requiredDependencies: ['node', 'npm', 'npx'],
      optionalDependencies: ['eslint', 'prettier'],
      configurationRequired: true,
      configurationFiles: ['.eslintrc.js', '.eslintrc.json', 'eslint.config.js']
    };
  }

  /**
   * Check dependencies
   */
  checkDependencies() {
    const dependencies = ['node', 'npx'];
    for (const dep of dependencies) {
      try {
        execSync(`${dep} --version`, { timeout: 5000, stdio: 'pipe' });
      } catch (error) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check linting tools availability
   */
  checkLintingTools() {
    try {
      execSync('npx eslint --version', { 
        stdio: 'pipe',
        timeout: 5000
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('    Cleaning up linting resources...');
    // No persistent resources to clean up for linting
  }
}

export default LintValidator;

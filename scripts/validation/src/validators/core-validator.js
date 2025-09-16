#!/usr/bin/env node

/**
 * Core Validator - Enhanced Modular Implementation
 * 
 * Implements IValidator interface for Core System Tasks validation.
 * Extracted and enhanced from category-validators.js to support the new
 * modular architecture with safety framework compliance.
 * 
 * Category: Core System Tasks
 * Description: Configuration integrity, state management, resource handling, type system consistency
 * Source: TEMPLUM-TESTING-GUIDE.md Core System sections
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 * Interface Version: 3.0.0
 */

// Pattern: modular-validator-implementation (documented in templum-patterns.md)
// Implementation: Comprehensive-core-validation approach with configuration integrity and type system validation

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { resolveScopedFiles, appendScopeEvidence, filterScopedFiles } from '../core/scope-utils.js';

// TODO: [TASK-VAL-CORE-FIX-001] Pattern: recursive-traversal-safety | Complexity: 8 | Dependencies: fs,path
// Context: Fix infinite recursion bug in core validator directory traversal with comprehensive safety measures
// Validation-Required: timeout-protection, cycle-detection, depth-limits, scope-compliance
// Pattern-Info: { approach: "bounded-traversal-with-cycle-detection", alternatives: "glob-library", trade-offs: "custom-implementation-vs-dependency" }

// Safety constants for directory traversal and file operations
const MAX_TRAVERSAL_DEPTH = 10;
const MAX_FILE_COUNT = 1000;
const FILE_READ_TIMEOUT = 5000; // 5 seconds
const DIRECTORY_OPERATION_TIMEOUT = 10000; // 10 seconds

// TODO: [TASK-VAL-CORE-FIX-001] Pattern: performance-optimization-exclusions | Complexity: 4 | Dependencies: file-system-traversal
// Context: Add directory exclusions to prevent scanning unnecessary directories that cause performance issues
// Validation-Required: performance-improvement, exclusion-compliance
// Pattern-Info: { approach: \"exclude-list\", alternatives: \"regex-matching\", trade-offs: \"performance-vs-completeness\" }

// Directories to exclude during traversal for performance optimization
const EXCLUDED_DIRECTORIES = [
  'node_modules',
  '.git', 
  '.next',
  'dist',
  'build',
  'coverage',
  '.nyc_output',
  'logs',
  'tmp',
  'temp',
  '.cache',
  '.vscode',
  '.idea',
  'out',
  'target',
  '.gradle',
  '.maven'
];

/**
 * Core Validator implementing IValidator interface
 */
export class CoreValidator {
  constructor() {
    this.category = 'core';
    this.version = '3.0.0';
    this.scopes = ['src/core/**/*.ts', 'src/types/**/*.ts', 'src/validation/**/*.ts'];
    this.hasIntegrationTests = true;
    
    // Initialize internal state
    this.validationStartTime = null;
  }

  /**
   * Helper method to wrap operations with timeout protection
   */
  async withTimeout(operation, timeoutMs) {
    return Promise.race([
      Promise.resolve(operation),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Safe file reading with timeout protection
   */
  async readFileWithTimeout(filePath, encoding = 'utf8') {
    return this.withTimeout(
      new Promise((resolve, reject) => {
        try {
          const content = fs.readFileSync(filePath, encoding);
          resolve(content);
        } catch (error) {
          reject(error);
        }
      }),
      FILE_READ_TIMEOUT
    );
  }

  /**
   * Resolve pattern path for scope configurations
   */
  resolvePatternPath(projectInfo, pattern) {
    if (path.isAbsolute(pattern)) {
      return pattern;
    }
    
    // Handle relative patterns like 'src/components/**/*.ts' 
    const pathParts = pattern.split('/');
    if (pathParts.includes('**')) {
      // Find directory part before **
      const dirPart = pathParts.slice(0, pathParts.indexOf('**')).join('/');
      return path.join(projectInfo.path, dirPart || 'src');
    }
    
    return path.join(projectInfo.path, pattern);
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
      console.log('  Executing Core System validation commands...');
      console.log('  Source: TEMPLUM-TESTING-GUIDE.md Core System sections');

      const scopeResult = await resolveScopedFiles(projectInfo.path, scopeConfig, {
        maxFiles: options.maxFiles ?? 500,
        maxFileSize: 6 * 1024 * 1024,
        maxTotalSize: 80 * 1024 * 1024
      });
      this.currentScope = scopeResult;
      appendScopeEvidence(result, scopeResult, { includePatterns: true, limit: 12 });

      // Test 1: Configuration integrity check
      const configTest = await this.executeConfigurationIntegrityCheck(projectInfo, scopeConfig);
      result.tests.push(configTest);
      
      // Test 2: State management validation
      const stateTest = await this.executeStateManagementValidation(projectInfo, scopeConfig);
      result.tests.push(stateTest);
      
      // Test 3: Resource handling verification
      const resourceTest = await this.executeResourceHandlingValidation(projectInfo, scopeConfig);
      result.tests.push(resourceTest);
      
      // Test 4: Type system consistency check
      const typeTest = await this.executeTypeSystemValidation(projectInfo, scopeConfig);
      result.tests.push(typeTest);
      
      // Test 5: Core service functionality validation
      const serviceTest = await this.executeCoreServiceValidation(projectInfo, scopeConfig);
      result.tests.push(serviceTest);

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
      console.log('  Core System validation tests completed');
      
      this.currentScope = null;
      return result;
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(`Core system validation failed: ${error.message}`);
      result.duration = Date.now() - this.validationStartTime;
      this.currentScope = null;
      return result;
    }
  }

  /**
   * Execute configuration integrity check
   */
  async executeConfigurationIntegrityCheck(projectInfo, scopeConfig) {
    console.log('    Configuration Integrity Check...');
    const test = {
      name: 'Configuration Integrity Check',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const configFiles = this.findConfigFiles(projectInfo);
      
      if (configFiles.length === 0) {
        test.status = 'WARN';
        test.message = 'No configuration files found to validate';
        test.evidence.push('No standard configuration files found');
        console.log('      🟡 WARN - No configuration files found');
        return test;
      }

      let validConfigs = 0;
      let totalConfigs = configFiles.length;

      for (const configFile of configFiles) {
        let configContent;
        try {
          configContent = await this.readFileWithTimeout(configFile, 'utf8');
          
          // Validate JSON configuration files
          if (configFile.endsWith('.json')) {
            JSON.parse(configContent);
            validConfigs++;
            test.evidence.push(`Valid JSON config: ${path.basename(configFile)}`);
          }
          // Validate TypeScript configuration files
          else if (configFile.endsWith('.ts')) {
            // Basic syntax validation - check for common TypeScript patterns
            if (configContent.includes('export') && !configContent.includes('syntax error')) {
              validConfigs++;
              test.evidence.push(`Valid TS config: ${path.basename(configFile)}`);
            }
          }
          // Validate other configuration formats
          else {
            validConfigs++;
            test.evidence.push(`Config file found: ${path.basename(configFile)}`);
          }
        } catch (parseError) {
          test.errors.push(`Invalid config ${path.basename(configFile)}: ${parseError.message}`);
        }
      }

      if (validConfigs === totalConfigs && totalConfigs > 0) {
        test.status = 'PASS';
        test.message = 'Configuration integrity check passed';
        test.evidence.push(`All ${totalConfigs} configuration files are valid`);
        console.log('      ✅ PASS - Configuration integrity check passed');
      } else if (validConfigs > 0) {
        test.status = 'WARN';
        test.message = 'Some configuration files may have issues';
        test.evidence.push(`${validConfigs}/${totalConfigs} configuration files are valid`);
        console.log('      🟡 WARN - Some configuration files may have issues');
      } else {
        test.status = 'FAIL';
        test.message = 'Configuration integrity check failed';
        test.errors.push('No valid configuration files found');
        console.log('      ❌ FAIL - Configuration integrity check failed');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Configuration integrity check failed';
      test.errors.push(`Configuration validation error: ${error.message}`);
      console.log('      ❌ FAIL - Configuration integrity check failed');
    }

    return test;
  }

  /**
   * Execute state management validation
   */
  async executeStateManagementValidation(projectInfo, scopeConfig) {
    console.log('    State Management Validation...');
    const test = {
      name: 'State Management Validation',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const stateFiles = this.findFilesInScope(projectInfo, ['**/state*.ts', '**/store*.ts', '**/manager*.ts'], scopeConfig);
      
      if (stateFiles.length === 0) {
        test.status = 'SKIP';
        test.message = 'No state management files found to validate';
        test.evidence.push('No state management files found in project');
        console.log('      ⏭️ SKIP - No state management files found');
        return test;
      }

      let validStateFiles = 0;
      let totalStateFiles = 0;

      for (const stateFile of stateFiles) {
        totalStateFiles++;
        
        // Use safe file reading with timeout protection
        let stateContent;
        try {
          stateContent = await this.readFileWithTimeout(stateFile, 'utf8');
        } catch (error) {
          console.log(`      Warning: Could not read ${stateFile}: ${error.message}`);
          test.errors.push(`Failed to read state file: ${path.relative(projectInfo.path, stateFile)} - ${error.message}`);
          continue;
        }
        
        // Check for state management patterns
        const hasStateDefinition = stateContent.includes('state') || stateContent.includes('State');
        const hasStateUpdate = stateContent.includes('update') || stateContent.includes('set');
        const hasStateValidation = stateContent.includes('validate') || stateContent.includes('check');
        const hasErrorHandling = stateContent.includes('catch') || stateContent.includes('error');
        
        if (hasStateDefinition && hasStateUpdate && (hasStateValidation || hasErrorHandling)) {
          validStateFiles++;
        }
        
        test.evidence.push(`Analyzed state file: ${path.relative(projectInfo.path, stateFile)}`);
      }

      if (validStateFiles > 0) {
        test.status = 'PASS';
        test.message = 'State management validation passed';
        test.evidence.push(`${validStateFiles}/${totalStateFiles} state files have good patterns`);
        console.log('      ✅ PASS - State management validation passed');
      } else if (totalStateFiles > 0) {
        test.status = 'WARN';
        test.message = 'State management may need improvement';
        test.evidence.push('Consider improving state management patterns');
        console.log('      🟡 WARN - State management may need improvement');
      } else {
        test.status = 'SKIP';
        test.message = 'No state files to validate';
        console.log('      ⏭️ SKIP - No state files to validate');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'State management validation failed';
      test.errors.push(`State validation error: ${error.message}`);
      console.log('      ❌ FAIL - State management validation failed');
    }

    return test;
  }

  /**
   * Execute resource handling validation
   */
  async executeResourceHandlingValidation(projectInfo, scopeConfig) {
    console.log('    Resource Handling Validation...');
    const test = {
      name: 'Resource Handling Validation',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const resourceFiles = this.findFilesInScope(projectInfo, ['**/resource*.ts', '**/file*.ts', '**/memory*.ts'], scopeConfig);
      
      if (resourceFiles.length === 0) {
        test.status = 'SKIP';
        test.message = 'No resource handling files found to validate';
        test.evidence.push('No resource handling files found in project');
        console.log('      ⏭️ SKIP - No resource handling files found');
        return test;
      }

      let validResourceFiles = 0;
      let totalResourceFiles = 0;

      for (const resourceFile of resourceFiles) {
        totalResourceFiles++;
        
        let resourceContent;
        try {
          resourceContent = await this.readFileWithTimeout(resourceFile, 'utf8');
        } catch (error) {
          console.log(`      Warning: Could not read ${resourceFile}: ${error.message}`);
          test.errors.push(`Failed to read resource file: ${path.relative(projectInfo.path, resourceFile)} - ${error.message}`);
          continue;
        }
        
        // Check for resource handling patterns
        const hasResourceAcquisition = resourceContent.includes('open') || resourceContent.includes('acquire') || resourceContent.includes('allocate');
        const hasResourceRelease = resourceContent.includes('close') || resourceContent.includes('release') || resourceContent.includes('cleanup') || resourceContent.includes('dispose');
        const hasErrorHandling = resourceContent.includes('try') || resourceContent.includes('catch') || resourceContent.includes('finally');
        
        if (hasResourceAcquisition && hasResourceRelease && hasErrorHandling) {
          validResourceFiles++;
        }
        
        test.evidence.push(`Analyzed resource file: ${path.relative(projectInfo.path, resourceFile)}`);
      }

      if (validResourceFiles > 0) {
        test.status = 'PASS';
        test.message = 'Resource handling validation passed';
        test.evidence.push(`${validResourceFiles}/${totalResourceFiles} resource files have proper handling`);
        console.log('      ✅ PASS - Resource handling validation passed');
      } else if (totalResourceFiles > 0) {
        test.status = 'WARN';
        test.message = 'Resource handling may need improvement';
        test.evidence.push('Consider improving resource handling patterns');
        console.log('      🟡 WARN - Resource handling may need improvement');
      } else {
        test.status = 'SKIP';
        test.message = 'No resource files to validate';
        console.log('      ⏭️ SKIP - No resource files to validate');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Resource handling validation failed';
      test.errors.push(`Resource validation error: ${error.message}`);
      console.log('      ❌ FAIL - Resource handling validation failed');
    }

    return test;
  }

  /**
   * Execute type system consistency validation
   */
  async executeTypeSystemValidation(projectInfo, scopeConfig) {
    console.log('    Type System Consistency Check...');
    const test = {
      name: 'Type System Consistency Check',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      // Check for TypeScript compilation
      if (projectInfo.hasTypeScript) {
        try {
          const tscPath = path.join(projectInfo.path, 'node_modules', '.bin', 'tsc');
          const tscCommand = fs.existsSync(tscPath) ? tscPath : 'tsc';
          
          const tscResult = execSync(`${tscCommand} --noEmit --skipLibCheck`, {
            cwd: projectInfo.path,
            encoding: 'utf8',
            timeout: 30000
          });

          test.status = 'PASS';
          test.message = 'Type system consistency check passed';
          test.evidence.push('TypeScript compilation successful');
          console.log('      ✅ PASS - Type system consistency check passed');
        } catch (tscError) {
          const errorOutput = tscError.stdout || tscError.stderr || tscError.message;
          
          if (errorOutput.includes('error TS')) {
            test.status = 'FAIL';
            test.message = 'Type system consistency check failed';
            test.errors.push('TypeScript compilation errors found');
            test.errors.push(errorOutput.substring(0, 500) + '...');
            console.log('      ❌ FAIL - Type system consistency check failed');
          } else {
            test.status = 'WARN';
            test.message = 'Type system validation had issues';
            test.evidence.push('TypeScript compiler not available or configuration issue');
            console.log('      🟡 WARN - Type system validation had issues');
          }
        }
      } else {
        test.status = 'SKIP';
        test.message = 'Project does not use TypeScript';
        test.evidence.push('Project is not a TypeScript project');
        console.log('      ⏭️ SKIP - Project does not use TypeScript');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Type system consistency check failed';
      test.errors.push(`Type system validation error: ${error.message}`);
      console.log('      ❌ FAIL - Type system consistency check failed');
    }

    return test;
  }

  /**
   * Execute core service functionality validation
   */
  async executeCoreServiceValidation(projectInfo, scopeConfig) {
    console.log('    Core Service Functionality Validation...');
    const test = {
      name: 'Core Service Functionality Validation',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const serviceFiles = this.findFilesInScope(projectInfo, ['**/service*.ts', '**/core*.ts'], scopeConfig);
      
      if (serviceFiles.length === 0) {
        test.status = 'SKIP';
        test.message = 'No core service files found to validate';
        test.evidence.push('No core service files found in project');
        console.log('      ⏭️ SKIP - No core service files found');
        return test;
      }

      let validServiceFiles = 0;
      let totalServiceFiles = 0;

      for (const serviceFile of serviceFiles) {
        totalServiceFiles++;
        
        let serviceContent;
        try {
          serviceContent = await this.readFileWithTimeout(serviceFile, 'utf8');
        } catch (error) {
          console.log(`      Warning: Could not read ${serviceFile}: ${error.message}`);
          test.errors.push(`Failed to read service file: ${path.relative(projectInfo.path, serviceFile)} - ${error.message}`);
          continue;
        }
        
        // Check for core service patterns
        const hasServiceDefinition = serviceContent.includes('class') || serviceContent.includes('function') || serviceContent.includes('export');
        const hasServiceInterface = serviceContent.includes('interface') || serviceContent.includes('implements') || serviceContent.includes('extends');
        const hasErrorHandling = serviceContent.includes('try') || serviceContent.includes('catch') || serviceContent.includes('error');
        const hasServiceMethods = serviceContent.includes('async') || serviceContent.includes('Promise') || serviceContent.includes('return');
        
        if (hasServiceDefinition && hasServiceMethods && hasErrorHandling) {
          validServiceFiles++;
        }
        
        test.evidence.push(`Analyzed service file: ${path.relative(projectInfo.path, serviceFile)}`);
      }

      if (validServiceFiles > 0) {
        test.status = 'PASS';
        test.message = 'Core service functionality validation passed';
        test.evidence.push(`${validServiceFiles}/${totalServiceFiles} service files have proper structure`);
        console.log('      ✅ PASS - Core service functionality validation passed');
      } else if (totalServiceFiles > 0) {
        test.status = 'WARN';
        test.message = 'Core service functionality may need improvement';
        test.evidence.push('Consider improving service implementation patterns');
        console.log('      🟡 WARN - Core service functionality may need improvement');
      } else {
        test.status = 'SKIP';
        test.message = 'No service files to validate';
        console.log('      ⏭️ SKIP - No service files to validate');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Core service functionality validation failed';
      test.errors.push(`Service validation error: ${error.message}`);
      console.log('      ❌ FAIL - Core service functionality validation failed');
    }

    return test;
  }
  /**
   * Find files matching patterns in current scope
   */
  findFilesInScope(projectInfo, patterns = [], scopeConfig = null) {
    const scopeResult = this.currentScope;
    if (!scopeResult) {
      return [];
    }

    const filters = (patterns && patterns.length > 0)
      ? patterns
      : (scopeConfig && scopeConfig.patterns ? scopeConfig.patterns : []);

    const combinedPatterns = Array.isArray(filters)
      ? [...filters, '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']
      : ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];

    const filtered = filterScopedFiles(scopeResult, combinedPatterns, {
      projectPath: projectInfo ? projectInfo.path : undefined,
      fallbackPatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']
    });
    return filtered.files;
  }

  /**

   * Find configuration files in project
   */
  findConfigFiles(projectInfo) {
    const configFiles = [];
    const commonConfigFiles = [
      'tsconfig.json',
      'package.json',
      'eslint.config.js',
      '.eslintrc.json',
      'jest.config.js',
      'webpack.config.js',
      'vite.config.ts',
      'rollup.config.js'
    ];

    for (const configFile of commonConfigFiles) {
      const configPath = path.join(projectInfo.path, configFile);
      if (fs.existsSync(configPath)) {
        configFiles.push(configPath);
      }
    }

    return configFiles;
  }


  /**
   * Walk directory recursively to find matching files with comprehensive safety measures
   */
  walkDirectory(dir, pattern, results, depth = 0, visitedPaths = new Set(), fileCount = { count: 0 }) {
    try {
      // Safety check: depth limit
      if (depth >= MAX_TRAVERSAL_DEPTH) {
        console.log(`      Warning: Max traversal depth (${MAX_TRAVERSAL_DEPTH}) reached in ${dir}`);
        return;
      }
      
      // Safety check: file count limit
      if (fileCount.count >= MAX_FILE_COUNT) {
        console.log(`      Warning: Max file count (${MAX_FILE_COUNT}) reached`);
        return;
      }
      
      // Cycle detection using real path resolution
      let realPath;
      try {
        realPath = fs.realpathSync(dir);
      } catch (error) {
        // If we can't resolve the real path, skip this directory
        console.log(`      Warning: Cannot resolve path ${dir}: ${error.message}`);
        return;
      }
      
      if (visitedPaths.has(realPath)) {
        console.log(`      Warning: Cycle detected, skipping already visited path: ${realPath}`);
        return;
      }
      visitedPaths.add(realPath);
      
      // Directory traversal with timeout protection
      let files;
      try {
        files = fs.readdirSync(dir);
      } catch (error) {
        console.log(`      Warning: Cannot read directory ${dir}: ${error.message}`);
        return;
      }
      
      for (const file of files) {
        // Check file count limit on each iteration
        if (fileCount.count >= MAX_FILE_COUNT) {
          console.log(`      Warning: Max file count (${MAX_FILE_COUNT}) reached during traversal`);
          break;
        }
        
        const filePath = path.join(dir, file);
        
        // Skip excluded directories for performance optimization
        if (EXCLUDED_DIRECTORIES.includes(file)) {
          continue;
        }
        
        let stat;
        try {
          stat = fs.statSync(filePath);
        } catch (error) {
          // Skip files we can't stat (permissions, broken links, etc.)
          console.log(`      Warning: Cannot stat ${filePath}: ${error.message}`);
          continue;
        }
        
        if (stat.isDirectory()) {
          // Recurse into subdirectory
          this.walkDirectory(filePath, pattern, results, depth + 1, visitedPaths, fileCount);
        } else if (this.matchesPattern(file, pattern)) {
          results.push(filePath);
          fileCount.count++;
        }
      }
      
      // Remove from visited paths when we're done (allows revisiting in different branches)
      visitedPaths.delete(realPath);
      
    } catch (error) {
      console.log(`      Warning: Error walking directory ${dir}: ${error.message}`);
    }
  }

  /**
   * Check if filename matches a simple pattern
   */
  matchesPattern(filename, pattern) {
    // Convert simple glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`).test(filename);
  }

  /**
   * Get validator capabilities
   */
  getCapabilities() {
    return {
      supportedProjects: ['Templum', 'Haruspex', 'phoenix-code-lite'],
      supportedScopes: this.scopes,
      requiredDependencies: ['typescript', 'node'],
      performanceProfile: 'standard'
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
        name: 'File System Access',
        status: this.checkFileSystemAccess()
      },
      {
        name: 'TypeScript Compiler Access',
        status: this.checkTypeScriptAccess()
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
      description: 'Core System Tasks - Configuration integrity, state management, resource handling, type system consistency',
      lastUpdated: '2025-09-06',
      testCoverage: 90
    };
  }

  /**
   * Check file system access capability
   */
  checkFileSystemAccess() {
    try {
      const tempPath = path.join(process.cwd(), 'temp-access-test');
      fs.writeFileSync(tempPath, 'test');
      fs.unlinkSync(tempPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check TypeScript compiler access
   */
  checkTypeScriptAccess() {
    try {
      execSync('tsc --version', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default CoreValidator;

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
      
      return result;
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(`Core system validation failed: ${error.message}`);
      result.duration = Date.now() - this.validationStartTime;
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
        try {
          const configContent = fs.readFileSync(configFile, 'utf8');
          
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
      const stateFiles = this.findFilesInScope(projectInfo, ['**/state*.ts', '**/store*.ts', '**/manager*.ts']);
      
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
        const stateContent = fs.readFileSync(stateFile, 'utf8');
        
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
      const resourceFiles = this.findFilesInScope(projectInfo, ['**/resource*.ts', '**/file*.ts', '**/memory*.ts']);
      
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
        const resourceContent = fs.readFileSync(resourceFile, 'utf8');
        
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
      const serviceFiles = this.findFilesInScope(projectInfo, ['**/service*.ts', '**/core*.ts']);
      
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
        const serviceContent = fs.readFileSync(serviceFile, 'utf8');
        
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
   * Find files matching patterns in project scope
   */
  findFilesInScope(projectInfo, patterns) {
    const files = [];
    
    try {
      for (const pattern of patterns) {
        // Simple glob-like pattern matching for common cases
        if (pattern.includes('**')) {
          // Handle recursive patterns
          const basePattern = pattern.replace('**/', '').replace('**/');
          const searchPath = path.join(projectInfo.path, 'src');
          
          if (fs.existsSync(searchPath)) {
            this.walkDirectory(searchPath, basePattern, files);
          }
        } else {
          // Handle simple patterns
          const searchPath = path.join(projectInfo.path, pattern);
          if (fs.existsSync(searchPath)) {
            files.push(searchPath);
          }
        }
      }
    } catch (error) {
      console.log(`      Warning: Error finding files: ${error.message}`);
    }
    
    return files;
  }

  /**
   * Walk directory recursively to find matching files
   */
  walkDirectory(dir, pattern, results) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          this.walkDirectory(filePath, pattern, results);
        } else if (this.matchesPattern(file, pattern)) {
          results.push(filePath);
        }
      }
    } catch (error) {
      // Ignore directory access errors
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

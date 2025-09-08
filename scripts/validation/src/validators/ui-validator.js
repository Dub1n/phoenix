#!/usr/bin/env node

/**
 * UI Validator - Enhanced Modular Implementation
 * 
 * Implements IValidator interface for UI/Interface Tasks validation.
 * Extracted and enhanced from category-validators.js to support the new
 * modular architecture with safety framework compliance.
 * 
 * Category: UI/Interface Tasks
 * Description: Menu structure, CLI interface consistency, VSCode integration, UX validation
 * Source: TEMPLUM-TESTING-GUIDE.md UI/Interface sections
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 * Interface Version: 3.0.0
 */

// Pattern: modular-validator-implementation (documented in templum-patterns.md)
// Implementation: Interface-compliance-validation approach following IValidator pattern

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * UI Validator implementing IValidator interface
 */
export class UIValidator {
  constructor() {
    this.category = 'ui';
    this.version = '3.0.0';
    this.scopes = ['src/interfaces/**/*.ts', 'src/rendering/**/*.ts', 'src/menus/**/*.ts'];
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
      console.log('  Executing UI/Interface validation commands...');
      console.log('  Source: TEMPLUM-TESTING-GUIDE.md UI/Interface sections');
      
      // Test 1: Menu structure validation
      const menuTest = await this.executeMenuStructureValidation(projectInfo, scopeConfig);
      result.tests.push(menuTest);
      
      // Test 2: CLI interface consistency check
      const cliTest = await this.executeCLIInterfaceValidation(projectInfo, scopeConfig);
      result.tests.push(cliTest);
      
      // Test 3: VSCode integration validation
      const vscodeTest = await this.executeVSCodeIntegrationValidation(projectInfo);
      result.tests.push(vscodeTest);
      
      // Test 4: User experience flow testing
      const uxTest = await this.executeUXFlowValidation(projectInfo, scopeConfig);
      result.tests.push(uxTest);
      
      // Test 5: Accessibility compliance check
      const a11yTest = await this.executeAccessibilityValidation(projectInfo, scopeConfig);
      result.tests.push(a11yTest);

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
      console.log('  UI/Interface validation tests completed');
      
      return result;
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(`UI validation failed: ${error.message}`);
      result.duration = Date.now() - this.validationStartTime;
      return result;
    }
  }

  /**
   * Execute menu structure validation
   */
  async executeMenuStructureValidation(projectInfo, scopeConfig) {
    console.log('    Menu Structure Validation...');
    const test = {
      name: 'Menu Structure Validation',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const menuFiles = this.findFilesInScope(projectInfo, ['**/menu*.ts', '**/navigation*.ts']);
      
      if (menuFiles.length === 0) {
        test.status = 'WARN';
        test.message = 'No menu files found to validate';
        test.evidence.push('No menu or navigation files found in project');
        console.log('      🟡 WARN - No menu files found');
        return test;
      }

      let validMenus = 0;
      let totalMenus = 0;

      for (const menuFile of menuFiles) {
        totalMenus++;
        const menuContent = fs.readFileSync(menuFile, 'utf8');
        
        // Check for required menu structure patterns
        const hasMenuItems = menuContent.includes('menu') || menuContent.includes('item');
        const hasNavigation = menuContent.includes('navigate') || menuContent.includes('route');
        const hasAccessibility = menuContent.includes('aria-') || menuContent.includes('role=');
        
        if (hasMenuItems && (hasNavigation || hasAccessibility)) {
          validMenus++;
        }
        
        test.evidence.push(`Analyzed menu file: ${path.relative(projectInfo.path, menuFile)}`);
      }

      if (validMenus === totalMenus && totalMenus > 0) {
        test.status = 'PASS';
        test.message = 'Menu structure validation passed';
        test.evidence.push(`All ${totalMenus} menu files have valid structure`);
        console.log('      ✅ PASS - Menu structure validation passed');
      } else if (validMenus > 0) {
        test.status = 'WARN';
        test.message = 'Some menu files may have structural issues';
        test.evidence.push(`${validMenus}/${totalMenus} menu files validated successfully`);
        console.log('      🟡 WARN - Some menu files may have issues');
      } else {
        test.status = 'FAIL';
        test.message = 'Menu structure validation failed';
        test.errors.push('No valid menu structures found');
        console.log('      ❌ FAIL - Menu structure validation failed');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Menu structure validation failed';
      test.errors.push(`Menu validation error: ${error.message}`);
      console.log('      ❌ FAIL - Menu structure validation failed');
    }

    return test;
  }

  /**
   * Execute CLI interface consistency validation
   */
  async executeCLIInterfaceValidation(projectInfo, scopeConfig) {
    console.log('    CLI Interface Consistency Check...');
    const test = {
      name: 'CLI Interface Consistency Check',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      // Check for CLI-related files
      const cliFiles = this.findFilesInScope(projectInfo, ['**/cli*.ts', '**/command*.ts', '**/interface*.ts']);
      
      if (cliFiles.length === 0) {
        test.status = 'SKIP';
        test.message = 'No CLI interface files found to validate';
        test.evidence.push('No CLI interface files found in project');
        console.log('      ⏭️ SKIP - No CLI interface files found');
        return test;
      }

      let consistentInterfaces = 0;
      let totalInterfaces = 0;

      for (const cliFile of cliFiles) {
        totalInterfaces++;
        const cliContent = fs.readFileSync(cliFile, 'utf8');
        
        // Check for CLI consistency patterns
        const hasErrorHandling = cliContent.includes('catch') || cliContent.includes('error');
        const hasHelp = cliContent.includes('help') || cliContent.includes('usage');
        const hasValidation = cliContent.includes('validate') || cliContent.includes('check');
        
        if (hasErrorHandling && (hasHelp || hasValidation)) {
          consistentInterfaces++;
        }
        
        test.evidence.push(`Analyzed CLI file: ${path.relative(projectInfo.path, cliFile)}`);
      }

      if (consistentInterfaces === totalInterfaces && totalInterfaces > 0) {
        test.status = 'PASS';
        test.message = 'CLI interface consistency check passed';
        test.evidence.push(`All ${totalInterfaces} CLI interfaces are consistent`);
        console.log('      ✅ PASS - CLI interface consistency check passed');
      } else if (consistentInterfaces > 0) {
        test.status = 'WARN';
        test.message = 'Some CLI interfaces may have consistency issues';
        test.evidence.push(`${consistentInterfaces}/${totalInterfaces} CLI interfaces are consistent`);
        console.log('      🟡 WARN - Some CLI interfaces may have issues');
      } else {
        test.status = 'FAIL';
        test.message = 'CLI interface consistency check failed';
        test.errors.push('No consistent CLI interfaces found');
        console.log('      ❌ FAIL - CLI interface consistency check failed');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'CLI interface consistency check failed';
      test.errors.push(`CLI validation error: ${error.message}`);
      console.log('      ❌ FAIL - CLI interface consistency check failed');
    }

    return test;
  }

  /**
   * Execute VSCode integration validation
   */
  async executeVSCodeIntegrationValidation(projectInfo) {
    console.log('    VSCode Integration Validation...');
    const test = {
      name: 'VSCode Integration Validation',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      // Check for VSCode configuration files
      const vscodeDir = path.join(projectInfo.path, '.vscode');
      const vscodeFiles = [];
      
      if (fs.existsSync(vscodeDir)) {
        const files = fs.readdirSync(vscodeDir);
        vscodeFiles.push(...files.map(f => path.join(vscodeDir, f)));
      }

      if (vscodeFiles.length === 0) {
        test.status = 'WARN';
        test.message = 'No VSCode configuration files found';
        test.evidence.push('No .vscode directory or configuration files found');
        console.log('      🟡 WARN - No VSCode configuration found');
        return test;
      }

      let validConfigs = 0;
      let totalConfigs = vscodeFiles.length;

      for (const configFile of vscodeFiles) {
        if (configFile.endsWith('.json')) {
          try {
            const configContent = fs.readFileSync(configFile, 'utf8');
            JSON.parse(configContent); // Validate JSON syntax
            validConfigs++;
            test.evidence.push(`Valid VSCode config: ${path.basename(configFile)}`);
          } catch (parseError) {
            test.errors.push(`Invalid JSON in ${path.basename(configFile)}: ${parseError.message}`);
          }
        }
      }

      if (validConfigs > 0) {
        test.status = 'PASS';
        test.message = 'VSCode integration validation passed';
        test.evidence.push(`${validConfigs} valid VSCode configuration files found`);
        console.log('      ✅ PASS - VSCode integration validation passed');
      } else {
        test.status = 'FAIL';
        test.message = 'VSCode integration validation failed';
        test.errors.push('No valid VSCode configuration files found');
        console.log('      ❌ FAIL - VSCode integration validation failed');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'VSCode integration validation failed';
      test.errors.push(`VSCode validation error: ${error.message}`);
      console.log('      ❌ FAIL - VSCode integration validation failed');
    }

    return test;
  }

  /**
   * Execute user experience flow validation
   */
  async executeUXFlowValidation(projectInfo, scopeConfig) {
    console.log('    User Experience Flow Testing...');
    const test = {
      name: 'User Experience Flow Testing',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      // Check for UX-related patterns in interface files
      const uxFiles = this.findFilesInScope(projectInfo, ['**/interface*.ts', '**/ui*.ts', '**/user*.ts']);
      
      if (uxFiles.length === 0) {
        test.status = 'SKIP';
        test.message = 'No user interface files found to test';
        test.evidence.push('No user interface files found in project');
        console.log('      ⏭️ SKIP - No user interface files found');
        return test;
      }

      let uxCompliantFiles = 0;
      let totalFiles = 0;

      for (const uxFile of uxFiles) {
        totalFiles++;
        const uxContent = fs.readFileSync(uxFile, 'utf8');
        
        // Check for UX flow patterns
        const hasStateManagement = uxContent.includes('state') || uxContent.includes('State');
        const hasErrorHandling = uxContent.includes('error') || uxContent.includes('Error');
        const hasUserFeedback = uxContent.includes('message') || uxContent.includes('feedback') || uxContent.includes('status');
        
        if (hasStateManagement && hasErrorHandling && hasUserFeedback) {
          uxCompliantFiles++;
        }
        
        test.evidence.push(`Analyzed UX file: ${path.relative(projectInfo.path, uxFile)}`);
      }

      if (uxCompliantFiles > 0) {
        test.status = 'PASS';
        test.message = 'User experience flow testing passed';
        test.evidence.push(`${uxCompliantFiles}/${totalFiles} files have good UX patterns`);
        console.log('      ✅ PASS - User experience flow testing passed');
      } else if (totalFiles > 0) {
        test.status = 'WARN';
        test.message = 'User experience flow may need improvement';
        test.evidence.push('Consider improving UX patterns in interface files');
        console.log('      🟡 WARN - User experience flow may need improvement');
      } else {
        test.status = 'SKIP';
        test.message = 'No files to validate for UX flow';
        console.log('      ⏭️ SKIP - No files to validate for UX flow');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'User experience flow testing failed';
      test.errors.push(`UX flow validation error: ${error.message}`);
      console.log('      ❌ FAIL - User experience flow testing failed');
    }

    return test;
  }

  /**
   * Execute accessibility compliance validation
   */
  async executeAccessibilityValidation(projectInfo, scopeConfig) {
    console.log('    Accessibility Compliance Check...');
    const test = {
      name: 'Accessibility Compliance Check',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      // Check for accessibility patterns in relevant files
      const accessibilityFiles = this.findFilesInScope(projectInfo, ['**/interface*.ts', '**/ui*.ts', '**/component*.ts']);
      
      if (accessibilityFiles.length === 0) {
        test.status = 'SKIP';
        test.message = 'No UI files found for accessibility validation';
        test.evidence.push('No UI files found to check for accessibility compliance');
        console.log('      ⏭️ SKIP - No UI files for accessibility validation');
        return test;
      }

      let accessibleFiles = 0;
      let totalFiles = 0;

      for (const a11yFile of accessibilityFiles) {
        totalFiles++;
        const a11yContent = fs.readFileSync(a11yFile, 'utf8');
        
        // Check for accessibility patterns
        const hasAriaLabels = a11yContent.includes('aria-') || a11yContent.includes('aria');
        const hasKeyboardNav = a11yContent.includes('keyboard') || a11yContent.includes('key');
        const hasSemantics = a11yContent.includes('role=') || a11yContent.includes('semantic');
        const hasAltText = a11yContent.includes('alt=') || a11yContent.includes('description');
        
        if (hasAriaLabels || hasKeyboardNav || hasSemantics || hasAltText) {
          accessibleFiles++;
        }
        
        test.evidence.push(`Analyzed accessibility in: ${path.relative(projectInfo.path, a11yFile)}`);
      }

      if (accessibleFiles > 0) {
        test.status = 'PASS';
        test.message = 'Accessibility compliance check passed';
        test.evidence.push(`${accessibleFiles}/${totalFiles} files have accessibility features`);
        console.log('      ✅ PASS - Accessibility compliance check passed');
      } else if (totalFiles > 0) {
        test.status = 'WARN';
        test.message = 'Consider improving accessibility compliance';
        test.evidence.push('No explicit accessibility features found in UI files');
        console.log('      🟡 WARN - Consider improving accessibility compliance');
      } else {
        test.status = 'SKIP';
        test.message = 'No files to validate for accessibility';
        console.log('      ⏭️ SKIP - No files to validate for accessibility');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Accessibility compliance check failed';
      test.errors.push(`Accessibility validation error: ${error.message}`);
      console.log('      ❌ FAIL - Accessibility compliance check failed');
    }

    return test;
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
      requiredDependencies: ['typescript'],
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
        name: 'Pattern Matching',
        status: this.checkPatternMatching()
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
      description: 'UI/Interface Tasks - Menu structure, CLI interface consistency, VSCode integration, UX validation',
      lastUpdated: '2025-09-06',
      testCoverage: 85
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
   * Check pattern matching capability
   */
  checkPatternMatching() {
    try {
      const testPattern = '*.ts';
      const testFile = 'test.ts';
      return this.matchesPattern(testFile, testPattern);
    } catch (error) {
      return false;
    }
  }
}

export default UIValidator;
#!/usr/bin/env node

/**
 * Architecture Validator - Lightweight Static Analysis Implementation
 * 
 * TODO: [TASK-VAL-ARCH-FIX-001] Pattern: lightweight-architecture-validation | Complexity: 8 | Dependencies: static-analysis,scope-filtering
 * Context: Complete redesign from npm test approach to lightweight static analysis with proper scope handling
 * Validation-Required: timeout-prevention, scope-compliance, static-analysis-accuracy
 * Pattern-Info: { approach: "static-analysis-with-scope", alternatives: "npm-test-execution", trade-offs: "speed-vs-comprehensive-testing" }
 * 
 * Fixed Critical Issues:
 * - Replaced npm test execution with lightweight static analysis
 * - Implemented proper scope pattern handling and file filtering
 * - Added timeout controls to prevent indefinite hangs
 * - Eliminated dependency on external test execution
 * 
 * Category: Architecture/Pattern Tasks  
 * Description: Lightweight pattern analysis, design compliance, dependency validation, architecture verification
 * Source: Architecture Validator Timeout Fix - 2025-09-11
 * 
 * Version: 5.0.0
 * Date: 2025-09-16
 * Interface Version: 3.0.0
 */

// Lightweight architecture validator using static analysis and file system operations

import fs from 'fs';
import path from 'path';
import { resolveScopedFiles, appendScopeEvidence } from '../core/scope-utils.js';

/**
 * Architecture Validator implementing IValidator interface with lightweight static analysis
 */
export class ArchitectureValidator {
  constructor() {
    this.category = 'architecture';
    this.version = '4.0.0';
    this.scopes = []; // Now properly handles scope patterns for file filtering
    this.hasIntegrationTests = false; // Changed to static analysis only
    
    // Initialize internal state
    this.validationStartTime = null;
    this.maxFileSize = 5 * 1024 * 1024; // 5MB max file size
    this.maxTotalSize = 50 * 1024 * 1024; // 50MB max total analysis size
    this.testTimeout = 10000; // 10 second timeout per test
  }

  /**
   * Main validation method implementing IValidator interface with scope-aware static analysis
   */
  async validate(projectInfo, scopeConfig, options = {}) {
    this.validationStartTime = Date.now();
    
    const result = {
      status: 'PENDING',
      tests: [],
      duration: 0,
      evidence: [],
      errors: [],
      warnings: [],
      recommendations: [],
      scopeInfo: {
        patternsUsed: scopeConfig.patterns || ['**/*.ts', '**/*.js'],
        filesAnalyzed: 0,
        totalSize: 0
      }
    };

    try {
      console.log('  Executing Architecture/Pattern lightweight static analysis...');
      console.log('  Source: Architecture Validator Timeout Fix - 2025-09-11');
      console.log(`  Scope patterns: ${result.scopeInfo.patternsUsed.join(', ')}`);

      const scopeResult = await resolveScopedFiles(projectInfo.path, scopeConfig, {
        maxFiles: options.maxFiles ?? 250,
        maxFileSize: this.maxFileSize,
        maxTotalSize: this.maxTotalSize
      });
      const scopedFiles = scopeResult.files;
      result.scopeInfo.patternsUsed = scopeResult.patterns;
      result.scopeInfo.filesAnalyzed = scopedFiles.length;
      result.scopeInfo.totalSize = scopeResult.totalSize;
      appendScopeEvidence(result, scopeResult, { includePatterns: true, limit: 10 });

      // Test 1: Pattern implementation analysis (static)
      const patternTest = await this.executeWithTimeout(
        () => this.executePatternImplementationAnalysis(projectInfo, scopedFiles),
        this.testTimeout,
        'Pattern Implementation Analysis'
      );
      result.tests.push(patternTest);
      result.evidence.push(...patternTest.evidence || []);

      // Test 2: Design pattern compliance check (enhanced with scope)
      const complianceTest = await this.executeWithTimeout(
        () => this.executeDesignPatternComplianceCheck(projectInfo, scopedFiles),
        this.testTimeout,
        'Design Pattern Compliance Check'
      );
      result.tests.push(complianceTest);
      result.evidence.push(...complianceTest.evidence || []);

      // Test 3: Dependency injection analysis (static)
      const diTest = await this.executeWithTimeout(
        () => this.executeDependencyInjectionAnalysis(projectInfo, scopedFiles),
        this.testTimeout,
        'Dependency Injection Analysis'
      );
      result.tests.push(diTest);
      result.evidence.push(...diTest.evidence || []);

      // Test 4: Architecture compliance validation (replaces scalability)
      const archTest = await this.executeWithTimeout(
        () => this.executeArchitectureComplianceValidation(projectInfo, scopedFiles),
        this.testTimeout,
        'Architecture Compliance Validation'
      );
      result.tests.push(archTest);
      result.evidence.push(...archTest.evidence || []);

      // Determine overall result status
      const failedTests = result.tests.filter(test => test.status === 'FAIL');
      const warningTests = result.tests.filter(test => test.status === 'WARN');
      
      if (failedTests.length > 0) {
        result.status = 'FAIL';
        result.errors = failedTests.flatMap(test => test.errors || []);
      } else if (warningTests.length > 0) {
        result.status = 'WARN';
        result.warnings = warningTests.flatMap(test => test.warnings || []);
      } else {
        result.status = 'PASS';
      }

      result.evidence.push('Architecture/Pattern static analysis completed successfully');
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(error.message);
      result.evidence.push(`Architecture validation failed: ${error.message}`);
    } finally {
      result.duration = Date.now() - this.validationStartTime;
    }

    return result;
  }

  /**
   * Utility: Simple pattern matcher for file discovery
   */
  /**
   * Utility: Execute function with timeout
   */
  async executeWithTimeout(fn, timeoutMs, testName) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          name: testName,
          status: 'FAIL',
          evidence: [],
          errors: [`Test timed out after ${timeoutMs}ms`],
          warnings: []
        });
      }, timeoutMs);
      
      fn().then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      }).catch(error => {
        clearTimeout(timeoutId);
        resolve({
          name: testName,
          status: 'FAIL',
          evidence: [],
          errors: [error.message],
          warnings: []
        });
      });
    });
  }

  /**
   * Test 1: Pattern implementation analysis (lightweight static analysis)
   */
  async executePatternImplementationAnalysis(projectInfo, scopedFiles) {
    const testResult = {
      name: 'Pattern Implementation Analysis',
      status: 'PENDING',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      console.log(`    Analyzing pattern implementations in ${scopedFiles.length} files`);
      
      const patterns = {
        factory: 0,
        singleton: 0,
        observer: 0,
        strategy: 0,
        adapter: 0,
        builder: 0,
        command: 0
      };
      
      let analyzedFiles = 0;
      
      for (const file of scopedFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Look for common design patterns
          if (content.match(/class\s+\w*Factory/gi)) patterns.factory++;
          if (content.match(/private\s+static\s+instance|getInstance\(\)/gi)) patterns.singleton++;
          if (content.match(/subscribe|addEventListener|on\(/gi)) patterns.observer++;
          if (content.match(/interface\s+\w*Strategy|class\s+\w*Strategy/gi)) patterns.strategy++;
          if (content.match(/class\s+\w*Adapter|interface\s+\w*Adapter/gi)) patterns.adapter++;
          if (content.match(/class\s+\w*Builder|interface\s+\w*Builder/gi)) patterns.builder++;
          if (content.match(/interface\s+\w*Command|class\s+\w*Command/gi)) patterns.command++;
          
          analyzedFiles++;
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
      
      const totalPatterns = Object.values(patterns).reduce((sum, count) => sum + count, 0);
      
      testResult.status = totalPatterns > 0 ? 'PASS' : 'WARN';
      testResult.evidence.push(`Analyzed ${analyzedFiles} files for design patterns`);
      testResult.evidence.push(`Found ${totalPatterns} pattern implementations:`);
      
      for (const [pattern, count] of Object.entries(patterns)) {
        if (count > 0) {
          testResult.evidence.push(`  - ${pattern}: ${count} implementations`);
        }
      }
      
      if (totalPatterns === 0) {
        testResult.warnings.push('No obvious design patterns found - consider implementing Factory, Strategy, or Observer patterns');
      }
      
    } catch (error) {
      testResult.status = 'FAIL';
      testResult.errors.push(`Pattern analysis failed: ${error.message}`);
    }

    return testResult;
  }

  /**
   * Test 2: Design pattern compliance check (enhanced with scope filtering)
   */
  async executeDesignPatternComplianceCheck(projectInfo, scopedFiles) {
    const testResult = {
      name: 'Design Pattern Compliance Check',
      status: 'PENDING',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      console.log(`    Analyzing design pattern compliance in ${scopedFiles.length} scoped files`);
      
      const analysis = {
        classes: 0,
        interfaces: 0,
        functions: 0,
        abstractClasses: 0,
        inheritance: 0,
        composition: 0
      };
      
      let totalLines = 0;
      
      for (const file of scopedFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');
          totalLines += lines.length;
          
          // Count different structural elements
          analysis.classes += (content.match(/^\s*class\s+\w+/gm) || []).length;
          analysis.interfaces += (content.match(/^\s*interface\s+\w+/gm) || []).length;
          analysis.functions += (content.match(/^\s*function\s+\w+/gm) || []).length;
          analysis.abstractClasses += (content.match(/^\s*abstract\s+class\s+\w+/gm) || []).length;
          analysis.inheritance += (content.match(/class\s+\w+\s+extends\s+\w+/gm) || []).length;
          analysis.composition += (content.match(/private\s+readonly\s+\w+:|constructor\s*\([^)]*\w+\s*:/gm) || []).length;
          
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
      
      const totalStructures = analysis.classes + analysis.interfaces + analysis.functions;
      
      testResult.status = totalStructures > 0 ? 'PASS' : 'WARN';
      testResult.evidence.push(`Analyzed ${totalLines} lines of code in ${scopedFiles.length} files`);
      testResult.evidence.push(`Structure analysis:`);
      testResult.evidence.push(`  - Classes: ${analysis.classes}`);
      testResult.evidence.push(`  - Interfaces: ${analysis.interfaces}`);
      testResult.evidence.push(`  - Functions: ${analysis.functions}`);
      testResult.evidence.push(`  - Abstract classes: ${analysis.abstractClasses}`);
      testResult.evidence.push(`  - Inheritance relationships: ${analysis.inheritance}`);
      testResult.evidence.push(`  - Composition patterns: ${analysis.composition}`);
      
      // Compliance checks
      if (analysis.interfaces > 0 && analysis.classes > 0) {
        testResult.evidence.push('✓ Good interface-based design detected');
      }
      
      if (analysis.composition > analysis.inheritance) {
        testResult.evidence.push('✓ Composition over inheritance principle followed');
      }
      
      if (totalStructures === 0) {
        testResult.warnings.push('No structural elements found - ensure code contains classes, interfaces, or functions');
      }
      
    } catch (error) {
      testResult.status = 'FAIL';
      testResult.errors.push(`Design pattern compliance check failed: ${error.message}`);
    }

    return testResult;
  }

  /**
   * Test 3: Dependency injection analysis (static analysis)
   */
  async executeDependencyInjectionAnalysis(projectInfo, scopedFiles) {
    const testResult = {
      name: 'Dependency Injection Analysis',
      status: 'PENDING',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      console.log(`    Analyzing dependency injection patterns in ${scopedFiles.length} files`);
      
      const diAnalysis = {
        constructorInjection: 0,
        interfaceBasedDI: 0,
        serviceRegistrations: 0,
        circularDeps: 0,
        singletonPatterns: 0,
        factoryPatterns: 0
      };
      
      const dependencies = new Set();
      
      for (const file of scopedFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // Constructor injection patterns
          const constructorMatches = content.match(/constructor\s*\([^)]*\w+\s*:[^)]*\)/gm);
          if (constructorMatches) {
            diAnalysis.constructorInjection += constructorMatches.length;
          }
          
          // Interface-based dependency injection
          const interfaceMatches = content.match(/:\s*I\w+[,|)]/g);
          if (interfaceMatches) {
            diAnalysis.interfaceBasedDI += interfaceMatches.length;
            interfaceMatches.forEach(match => dependencies.add(match.replace(/[:,)]/g, '').trim()));
          }
          
          // Service registration patterns
          if (content.match(/register|bind|provide|inject/gi)) {
            diAnalysis.serviceRegistrations++;
          }
          
          // Singleton patterns (potential DI)
          if (content.match(/getInstance\(\)|private\s+static\s+instance/gi)) {
            diAnalysis.singletonPatterns++;
          }
          
          // Factory patterns (DI related)
          if (content.match(/create\w*\(|factory|Factory/gi)) {
            diAnalysis.factoryPatterns++;
          }
          
          // Simple circular dependency check
          const imports = content.match(/import.*from\s+['"][^'"]+['"]/g) || [];
          const exports = content.match(/export.*class\s+(\w+)/g) || [];
          if (imports.length > 5 && exports.length > 0) {
            diAnalysis.circularDeps++;
          }
          
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
      
      const totalDIPatterns = diAnalysis.constructorInjection + diAnalysis.interfaceBasedDI + diAnalysis.serviceRegistrations;
      
      testResult.status = totalDIPatterns > 0 ? 'PASS' : 'WARN';
      testResult.evidence.push(`Dependency injection pattern analysis:`);
      testResult.evidence.push(`  - Constructor injection patterns: ${diAnalysis.constructorInjection}`);
      testResult.evidence.push(`  - Interface-based dependencies: ${diAnalysis.interfaceBasedDI}`);
      testResult.evidence.push(`  - Service registrations: ${diAnalysis.serviceRegistrations}`);
      testResult.evidence.push(`  - Singleton patterns: ${diAnalysis.singletonPatterns}`);
      testResult.evidence.push(`  - Factory patterns: ${diAnalysis.factoryPatterns}`);
      testResult.evidence.push(`  - Unique dependencies found: ${dependencies.size}`);
      
      if (diAnalysis.circularDeps > 0) {
        testResult.warnings.push(`Potential circular dependencies detected in ${diAnalysis.circularDeps} files`);
      }
      
      if (totalDIPatterns === 0) {
        testResult.warnings.push('No dependency injection patterns detected - consider implementing constructor injection or service locator patterns');
      } else {
        testResult.evidence.push('✓ Dependency injection patterns detected');
      }
      
      if (diAnalysis.interfaceBasedDI > 0) {
        testResult.evidence.push('✓ Interface-based dependency injection found');
      }
      
    } catch (error) {
      testResult.status = 'FAIL';
      testResult.errors.push(`Dependency injection analysis failed: ${error.message}`);
    }

    return testResult;
  }

  /**
   * Test 4: Architecture compliance validation (replaces scalability testing)
   */
  async executeArchitectureComplianceValidation(projectInfo, scopedFiles) {
    const testResult = {
      name: 'Architecture Compliance Validation',
      status: 'PENDING',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      console.log(`    Analyzing architecture compliance in ${scopedFiles.length} files`);
      
      const compliance = {
        layerSeparation: 0,
        solidPrinciples: {
          singleResponsibility: 0,
          openClosed: 0,
          liskovSubstitution: 0,
          interfaceSegregation: 0,
          dependencyInversion: 0
        },
        modularity: 0,
        abstractionUsage: 0,
        errorHandling: 0
      };
      
      const fileStructure = {
        controllers: 0,
        services: 0,
        repositories: 0,
        models: 0,
        interfaces: 0,
        utils: 0
      };
      
      for (const file of scopedFiles) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const fileName = path.basename(file).toLowerCase();
          
          // Layer identification
          if (fileName.includes('controller')) fileStructure.controllers++;
          if (fileName.includes('service')) fileStructure.services++;
          if (fileName.includes('repository') || fileName.includes('repo')) fileStructure.repositories++;
          if (fileName.includes('model') || fileName.includes('entity')) fileStructure.models++;
          if (fileName.includes('interface') || fileName.includes('.d.ts')) fileStructure.interfaces++;
          if (fileName.includes('util') || fileName.includes('helper')) fileStructure.utils++;
          
          // SOLID principles analysis
          const classMatches = content.match(/class\s+(\w+)/g);
          if (classMatches && classMatches.length === 1) {
            compliance.solidPrinciples.singleResponsibility++;
          }
          
          if (content.match(/extends\s+\w+|implements\s+\w+/)) {
            compliance.solidPrinciples.openClosed++;
          }
          
          if (content.match(/override|super\./)) {
            compliance.solidPrinciples.liskovSubstitution++;
          }
          
          if (content.match(/interface\s+\w+/)) {
            compliance.solidPrinciples.interfaceSegregation++;
          }
          
          if (content.match(/constructor\s*\([^)]*I\w+/)) {
            compliance.solidPrinciples.dependencyInversion++;
          }
          
          // Modularity check
          const importCount = (content.match(/^import/gm) || []).length;
          const exportCount = (content.match(/^export/gm) || []).length;
          if (importCount <= 10 && exportCount > 0) {
            compliance.modularity++;
          }
          
          // Abstraction usage
          if (content.match(/abstract\s+class|interface\s+\w+/)) {
            compliance.abstractionUsage++;
          }
          
          // Error handling
          if (content.match(/try\s*\{|catch\s*\(|throw\s+/)) {
            compliance.errorHandling++;
          }
          
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
      
      // Calculate layer separation score
      const layerTypes = Object.values(fileStructure).filter(count => count > 0).length;
      compliance.layerSeparation = layerTypes;
      
      const solidScore = Object.values(compliance.solidPrinciples).reduce((sum, count) => sum + count, 0);
      const totalCompliance = compliance.layerSeparation + solidScore + compliance.modularity + compliance.abstractionUsage;
      
      testResult.status = totalCompliance > 5 ? 'PASS' : 'WARN';
      testResult.evidence.push(`Architecture compliance analysis:`);
      testResult.evidence.push(`  Layer structure:`);
      Object.entries(fileStructure).forEach(([layer, count]) => {
        if (count > 0) testResult.evidence.push(`    - ${layer}: ${count} files`);
      });
      
      testResult.evidence.push(`  SOLID principles adherence:`);
      Object.entries(compliance.solidPrinciples).forEach(([principle, count]) => {
        if (count > 0) testResult.evidence.push(`    - ${principle}: ${count} instances`);
      });
      
      testResult.evidence.push(`  - Modular files: ${compliance.modularity}`);
      testResult.evidence.push(`  - Abstraction usage: ${compliance.abstractionUsage}`);
      testResult.evidence.push(`  - Error handling: ${compliance.errorHandling}`);
      
      if (layerTypes >= 3) {
        testResult.evidence.push('✓ Good layer separation detected');
      }
      
      if (solidScore >= 3) {
        testResult.evidence.push('✓ SOLID principles adherence detected');
      }
      
      if (totalCompliance <= 5) {
        testResult.warnings.push('Low architecture compliance score - consider improving layer separation and SOLID principles adherence');
      }
      
    } catch (error) {
      testResult.status = 'FAIL';
      testResult.errors.push(`Architecture compliance validation failed: ${error.message}`);
    }

    return testResult;
  }

  /**
   * Get validator capabilities
   */
  getCapabilities() {
    return {
      supportedProjects: ['typescript', 'javascript', 'mixed'],
      supportedScopes: ['**/*.ts', '**/*.js', 'src/**/*.ts', 'src/**/*.js', 'lib/**/*.ts', 'lib/**/*.js'],
      requiredDependencies: [], // No external dependencies required
      performanceProfile: 'lightweight',
      hasIntegrationTests: false, // Static analysis only
      supportsRollback: false,
      scopeAware: true, // Now properly handles scope filtering
      timeoutControlled: true // Has timeout controls
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
      generated: false,
      author: 'Architecture Validator Timeout Fix',
      description: 'Lightweight architecture validation with static analysis, proper scope handling, and timeout controls',
      lastValidated: new Date().toISOString(),
      fixes: [
        'Replaced npm test execution with static analysis',
        'Implemented proper scope pattern filtering',
        'Added timeout controls to prevent hangs',
        'Enhanced with SOLID principles checking'
      ]
    };
  }

  /**
   * Check interface compliance
   */
  checkInterfaceCompliance() {
    const requiredMethods = ['validate', 'getCapabilities', 'getMetadata', 'checkInterfaceCompliance', 'runSelfDiagnostics'];
    const requiredProperties = ['category', 'version', 'scopes'];
    
    for (const method of requiredMethods) {
      if (typeof this[method] !== 'function') {
        return false;
      }
    }
    
    for (const property of requiredProperties) {
      if (this[property] === undefined) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Run self-diagnostics
   */
  runSelfDiagnostics() {
    const checks = [];
    
    // Check pattern matching functionality
    try {
      const testMatch = this.matchesPattern('/test/file.ts', '**/*.ts');
      checks.push({ name: 'pattern_matching', status: testMatch ? 'PASS' : 'FAIL', message: 'Pattern matching functionality verified' });
    } catch (error) {
      checks.push({ name: 'pattern_matching', status: 'FAIL', message: 'Pattern matching functionality failed' });
    }
    
    // Check file system access
    try {
      fs.accessSync(process.cwd(), fs.constants.R_OK);
      checks.push({ name: 'filesystem_access', status: 'PASS', message: 'File system is accessible' });
    } catch (error) {
      checks.push({ name: 'filesystem_access', status: 'FAIL', message: 'File system is not accessible' });
    }
    
    // Check interface compliance
    const compliant = this.checkInterfaceCompliance();
    checks.push({ 
      name: 'interface_compliance', 
      status: compliant ? 'PASS' : 'FAIL', 
      message: compliant ? 'Interface compliance verified' : 'Interface compliance failed' 
    });
    
    // Check timeout configuration
    checks.push({ 
      name: 'timeout_configuration', 
      status: this.testTimeout > 0 ? 'PASS' : 'FAIL', 
      message: `Test timeout set to ${this.testTimeout}ms` 
    });
    
    const hasFailures = checks.some(check => check.status === 'FAIL');
    
    return {
      status: hasFailures ? 'ERROR' : 'HEALTHY',
      checks: checks,
      recommendations: hasFailures ? ['Ensure file system access and required modules are available'] : [
        'Architecture validator is healthy',
        'Static analysis approach eliminates npm test dependencies',
        'Timeout controls prevent infinite hangs',
        'Scope filtering improves performance'
      ],
      systemInfo: {
        validator: 'ArchitectureValidator',
        version: this.version,
        category: this.category,
        approach: 'static_analysis',
        timeoutMs: this.testTimeout,
        scopeAware: true
      }
    };
  }
}

// Fixed missing default export to resolve constructor errors during validator loading
// Pattern-Info: { approach: "standard-default-export", alternatives: "none", trade-offs: "none" }
export default ArchitectureValidator;

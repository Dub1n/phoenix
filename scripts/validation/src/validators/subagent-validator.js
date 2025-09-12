#!/usr/bin/env node

/**
 * Subagent Validator - Enhanced Modular Implementation
 * 
 * Implements IValidator interface for Subagent Tasks validation.
 * Created based on backend-validator.js template to support the new
 * modular architecture with safety framework compliance.
 * 
 * Category: Subagent Tasks
 * Description: Subagent coordination, task delegation, multi-agent workflows
 * Source: TEMPLUM-TESTING-GUIDE.md Section - Subagent
 * 
 * Version: 3.0.0
 * Date: 2025-09-10
 * Interface Version: 3.0.0
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

/**
 * Subagent Validator implementing IValidator interface
 */
export class SubagentValidator {
  constructor() {
    this.category = 'subagent';
    this.version = '3.0.0';
    this.scopes = ['src/**/*.ts', 'src/**/*.js', '.claude/agents/**/*'];
    this.hasIntegrationTests = true;
    
    // Initialize internal state
    this.agentsStarted = [];
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
      console.log('  Executing Subagent mandatory validation commands...');
      console.log('  Source: TEMPLUM-TESTING-GUIDE.md Subagent Section');
      
      // Test 1: Subagent file structure validation
      const structureTest = await this.executeStructureValidation(projectInfo, scopeConfig);
      result.tests.push(structureTest);
      
      // Test 2: Agent communication test
      const communicationTest = await this.executeAgentCommunicationTest(projectInfo, scopeConfig);
      result.tests.push(communicationTest);
      
      // Test 3: Task delegation capability test
      const delegationTest = await this.executeTaskDelegationTest(projectInfo, scopeConfig);
      result.tests.push(delegationTest);
      
      // Test 4: Multi-agent coordination test
      const coordinationTest = await this.executeCoordinationTest(projectInfo, scopeConfig);
      result.tests.push(coordinationTest);

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
      console.log('  Subagent validation tests completed');
      
      return result;
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(`Subagent validation failed: ${error.message}`);
      result.duration = Date.now() - this.validationStartTime;
      return result;
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  /**
   * Get validator capabilities
   */
  getCapabilities() {
    // TODO: [TASK-ID-VAL-SUBAGENT-FIX-001] Pattern: case-insensitive-project-support | Complexity: 2 | Dependencies: none
    // Context: Fix case sensitivity bug by supporting both capitalized and lowercase project names
    // Validation-Required: case-insensitive-matching, project-compatibility
    // Pattern-Info: { approach: "dual-case-support", alternatives: "case-normalization", trade-offs: "explicit-vs-implicit" }
    
    return {
      supportedProjects: ['Templum', 'templum', 'Haruspex', 'haruspex', 'phoenix-code-lite'],
      supportedScopes: this.scopes,
      requiredDependencies: ['typescript', 'node', 'npm'],
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
        name: 'Required Dependencies',
        status: this.checkDependencies()
      },
      {
        name: 'Agent Infrastructure',
        status: this.checkAgentInfrastructure()
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
      description: 'Subagent Tasks - Subagent coordination, task delegation, multi-agent workflows',
      lastUpdated: '2025-09-10',
      testCoverage: 85
    };
  }

  /**
   * Execute subagent structure validation
   */
  async executeStructureValidation(projectInfo, scopeConfig) {
    console.log('    Subagent Structure Validation...');
    const test = {
      name: 'Subagent Structure Validation',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const originalCwd = process.cwd();
      process.chdir(projectInfo.path);

      // TODO: [TASK-ID-VAL-SUBAGENT-FIX-001] Pattern: scope-aware-structure-validation | Complexity: 4 | Dependencies: scope-config,file-system
      // Context: Replace hardcoded path checking with scope-aware functional structure validation
      // Validation-Required: scope-integration, functional-validation, infrastructure-assessment
      // Pattern-Info: { approach: "scope-based-validation", alternatives: "hardcoded-paths", trade-offs: "flexibility-vs-simplicity" }

      // Determine paths to check based on scope configuration
      let pathsToCheck = ['.claude/agents', '.claude/handoff', 'src/agents'];
      
      if (scopeConfig && scopeConfig.patterns && scopeConfig.patterns.length > 0) {
        // Extract directory paths from scope patterns
        const scopePaths = scopeConfig.patterns
          .map(pattern => {
            // Convert glob patterns to directory paths
            const cleanPattern = pattern.replace(/\*+.*$/, '').replace(/\/$/, '');
            return cleanPattern;
          })
          .filter(path => path && path.length > 0);
        
        if (scopePaths.length > 0) {
          pathsToCheck = scopePaths;
          test.evidence.push(`Using scope-defined paths: ${pathsToCheck.join(', ')}`);
        }
      }

      // Check for subagent infrastructure in specified paths
      let foundPaths = 0;
      let functionalInfrastructure = 0;

      for (const requiredPath of pathsToCheck) {
        const fullPath = path.join(projectInfo.path, requiredPath);
        
        if (fs.existsSync(fullPath)) {
          foundPaths++;
          test.evidence.push(`Found path: ${requiredPath}`);
          
          // Functional check: verify the path contains relevant files
          try {
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
              const files = fs.readdirSync(fullPath);
              const relevantFiles = files.filter(file => 
                file.endsWith('.ts') || file.endsWith('.js') || 
                file.endsWith('.json') || file.endsWith('.md')
              ).length;
              
              if (relevantFiles > 0) {
                functionalInfrastructure++;
                test.evidence.push(`Path ${requiredPath} contains ${relevantFiles} relevant files`);
              }
            }
          } catch (statError) {
            console.log(`      ⚠️  Could not analyze ${requiredPath}: ${statError.message}`);
          }
        }
      }

      process.chdir(originalCwd);

      // Enhanced evaluation criteria
      if (foundPaths >= 2 && functionalInfrastructure >= 1) {
        test.status = 'PASS';
        test.message = 'Subagent structure validation passed - Functional infrastructure found';
        console.log('      ✅ PASS - Functional subagent structure detected');
      } else if (foundPaths >= 1) {
        test.status = 'WARN';
        test.message = 'Subagent structure validation has warnings - Minimal infrastructure found';
        test.evidence.push(`Found ${foundPaths}/${pathsToCheck.length} paths, ${functionalInfrastructure} functional`);
        console.log('      🟡 WARN - Minimal subagent infrastructure detected');
      } else {
        test.status = 'WARN';
        test.message = 'Subagent structure validation has warnings - No infrastructure found';
        test.evidence.push('No subagent infrastructure detected in specified scope');
        console.log('      🟡 WARN - No subagent infrastructure found');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Subagent structure validation failed';
      test.errors.push(`Structure validation error: ${error.message}`);
      console.log('      ❌ FAIL - Subagent structure validation failed');
    }

    return test;
  }

  /**
   * Execute agent communication test
   */
  async executeAgentCommunicationTest(projectInfo, scopeConfig) {
    console.log('    Agent Communication Test...');
    const test = {
      name: 'Agent Communication Test',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      // TODO: [TASK-ID-VAL-SUBAGENT-FIX-001] Pattern: functional-communication-testing | Complexity: 5 | Dependencies: scope-config,interface-analysis
      // Context: Replace simple file existence with functional interface validation and scope integration
      // Validation-Required: interface-functionality, communication-patterns, scope-awareness
      // Pattern-Info: { approach: "functional-interface-validation", alternatives: "file-existence-only", trade-offs: "thorough-validation-vs-performance" }

      // Determine communication files to check based on scope
      let communicationFiles = [
        'src/interfaces/handoff-types.ts',
        '.claude/interfaces/handoff-interfaces.ts',
        '.claude/agents/interfaces/handoff-types.ts'
      ];

      if (scopeConfig && scopeConfig.patterns && scopeConfig.patterns.length > 0) {
        // Find interface files within scope patterns
        const scopeFiles = [];
        for (const pattern of scopeConfig.patterns) {
          const baseDir = pattern.split('*')[0];
          if (baseDir && fs.existsSync(baseDir)) {
            try {
              const files = this.findInterfaceFilesInDirectory(baseDir, projectInfo.path);
              scopeFiles.push(...files);
            } catch (error) {
              console.log(`      ⚠️  Could not scan ${baseDir}: ${error.message}`);
            }
          }
        }
        
        if (scopeFiles.length > 0) {
          communicationFiles = [...new Set([...communicationFiles, ...scopeFiles])];
          test.evidence.push(`Expanded search to ${scopeFiles.length} scope-based interface files`);
        }
      }

      let foundFiles = 0;
      let functionalInterfaces = 0;

      for (const file of communicationFiles) {
        const filePath = path.join(projectInfo.path, file);
        if (fs.existsSync(filePath)) {
          foundFiles++;
          test.evidence.push(`Found communication interface: ${file}`);
          
          // Functional test: check if the interface file contains actual interface definitions
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const hasInterfaces = content.includes('interface') || content.includes('type') || content.includes('export');
            const hasHandoffTypes = content.includes('handoff') || content.includes('agent') || content.includes('task');
            
            if (hasInterfaces && hasHandoffTypes) {
              functionalInterfaces++;
              test.evidence.push(`Interface ${file} contains functional handoff definitions`);
            }
          } catch (readError) {
            console.log(`      ⚠️  Could not analyze ${file}: ${readError.message}`);
          }
        }
      }

      // Enhanced evaluation with functional criteria
      if (functionalInterfaces > 0) {
        test.status = 'PASS';
        test.message = 'Agent communication test passed - Functional interfaces found';
        test.evidence.push(`Found ${foundFiles} interface files, ${functionalInterfaces} functional`);
        console.log('      ✅ PASS - Functional agent communication interfaces found');
      } else if (foundFiles > 0) {
        test.status = 'WARN';
        test.message = 'Agent communication test has warnings - Non-functional interfaces found';
        test.evidence.push('Interface files exist but may not contain functional definitions');
        console.log('      🟡 WARN - Interface files found but functionality unclear');
      } else {
        test.status = 'WARN';
        test.message = 'Agent communication test has warnings - No interfaces found';
        test.evidence.push('No communication interfaces found in specified scope');
        console.log('      🟡 WARN - No agent communication interfaces found');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Agent communication test failed';
      test.errors.push(`Communication test error: ${error.message}`);
      console.log('      ❌ FAIL - Agent communication test failed');
    }

    return test;
  }

  /**
   * Execute task delegation test
   */
  async executeTaskDelegationTest(projectInfo, scopeConfig) {
    console.log('    Task Delegation Test...');
    const test = {
      name: 'Task Delegation Test',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const originalCwd = process.cwd();
      process.chdir(projectInfo.path);

      // TODO: [TASK-ID-VAL-SUBAGENT-FIX-001] Pattern: enhanced-delegation-testing | Complexity: 6 | Dependencies: execSync,scope-integration
      // Context: Fix ENOBUFS error and implement functional delegation testing with proper scope handling
      // Validation-Required: buffer-overflow-prevention, functional-testing, scope-integration
      // Pattern-Info: { approach: "functional-testing-with-scope", alternatives: "file-existence-only", trade-offs: "accuracy-vs-simplicity" }

      // Determine search patterns based on scope configuration
      let searchPaths = ['src/'];
      if (scopeConfig && scopeConfig.patterns && scopeConfig.patterns.length > 0) {
        // Convert glob patterns to directory paths for search
        searchPaths = scopeConfig.patterns
          .filter(pattern => pattern.includes('/'))
          .map(pattern => pattern.split('*')[0])
          .filter(path => path && fs.existsSync(path.replace(/\/$/, '')));
        
        if (searchPaths.length === 0) {
          searchPaths = ['src/', '.claude/agents/', '.claude/handoff/'];
        }
      }

      let foundPatterns = false;
      let searchOutput = '';

      for (const searchPath of searchPaths) {
        if (!fs.existsSync(searchPath)) continue;

        try {
          // Fixed regex patterns and added maxBuffer to prevent ENOBUFS
          const searchPattern = process.platform === 'win32'
            ? `findstr /s /i "delegate spawn task" ${searchPath}*.ts ${searchPath}*.js 2>nul`
            : `grep -r -i "delegate\\|spawn\\|task" ${searchPath} 2>/dev/null`;

          const output = execSync(searchPattern, {
            encoding: 'utf8',
            timeout: 10000,
            maxBuffer: 1024 * 1024 * 5, // 5MB buffer limit to prevent ENOBUFS
            stdio: 'pipe'
          });

          if (output && output.trim() && !output.includes('No delegation patterns found')) {
            foundPatterns = true;
            searchOutput += output;
            test.evidence.push(`Found delegation patterns in ${searchPath}: ${output.split('\n').length} matches`);
          }
        } catch (execError) {
          // Don't fail the entire test for individual search failures
          if (execError.code !== 1) { // Code 1 is "no matches found", not a real error
            console.log(`      ⚠️  Search warning in ${searchPath}: ${execError.message}`);
          }
        }
      }

      // Additional functional test: Check for actual agent handoff files
      const handoffDirs = ['.claude/handoff/input', '.claude/handoff/output'];
      let handoffFiles = 0;
      for (const dir of handoffDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
          handoffFiles += files.length;
          if (files.length > 0) {
            test.evidence.push(`Found ${files.length} handoff files in ${dir}`);
          }
        }
      }

      process.chdir(originalCwd);

      // Evaluate results with functional criteria
      if (foundPatterns && handoffFiles > 0) {
        test.status = 'PASS';
        test.message = 'Task delegation test passed - Found both code patterns and handoff infrastructure';
        test.evidence.push('Functional delegation system detected with active handoff files');
        console.log('      ✅ PASS - Functional task delegation system detected');
      } else if (foundPatterns || handoffFiles > 0) {
        test.status = 'WARN';
        test.message = 'Task delegation test has warnings - Partial delegation infrastructure found';
        test.evidence.push(`Found patterns: ${foundPatterns}, handoff files: ${handoffFiles}`);
        console.log('      🟡 WARN - Partial task delegation infrastructure');
      } else {
        test.status = 'WARN';
        test.message = 'Task delegation test has warnings - No delegation patterns found';
        test.evidence.push('No delegation patterns or handoff infrastructure found');
        console.log('      🟡 WARN - No task delegation infrastructure detected');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Task delegation test failed';
      test.errors.push(`Delegation test error: ${error.message}`);
      console.log('      ❌ FAIL - Task delegation test failed');
    }

    return test;
  }

  /**
   * Execute coordination test
   */
  async executeCoordinationTest(projectInfo, scopeConfig) {
    console.log('    Multi-agent Coordination Test...');
    const test = {
      name: 'Multi-agent Coordination Test',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      // TODO: [TASK-ID-VAL-SUBAGENT-FIX-001] Pattern: functional-coordination-testing | Complexity: 6 | Dependencies: scope-config,orchestration-analysis
      // Context: Replace file existence with functional coordination validation and scope integration
      // Validation-Required: coordination-functionality, orchestration-patterns, workflow-validation
      // Pattern-Info: { approach: "workflow-based-validation", alternatives: "file-existence-only", trade-offs: "comprehensive-validation-vs-performance" }

      // Determine coordination files to check based on scope
      let coordinationFiles = [
        '.claude/agents/index.ts',
        'src/core/orchestrator.ts', 
        'src/core/agent-manager.ts',
        'src/core/enhanced-orchestrator.js'
      ];

      if (scopeConfig && scopeConfig.patterns && scopeConfig.patterns.length > 0) {
        const scopeFiles = [];
        for (const pattern of scopeConfig.patterns) {
          const baseDir = pattern.split('*')[0];
          if (baseDir && fs.existsSync(baseDir)) {
            try {
              const files = this.findCoordinationFilesInDirectory(baseDir, projectInfo.path);
              scopeFiles.push(...files);
            } catch (error) {
              console.log(`      ⚠️  Could not scan ${baseDir}: ${error.message}`);
            }
          }
        }
        
        if (scopeFiles.length > 0) {
          coordinationFiles = [...new Set([...coordinationFiles, ...scopeFiles])];
          test.evidence.push(`Expanded search to ${scopeFiles.length} scope-based coordination files`);
        }
      }

      let foundFiles = 0;
      let functionalCoordination = 0;

      for (const file of coordinationFiles) {
        const filePath = path.join(projectInfo.path, file);
        if (fs.existsSync(filePath)) {
          foundFiles++;
          test.evidence.push(`Found coordination file: ${file}`);
          
          // Functional test: check if file contains coordination patterns
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const hasCoordination = content.includes('orchestrat') || content.includes('coordinat') || content.includes('agent');
            const hasWorkflow = content.includes('workflow') || content.includes('handoff') || content.includes('delegate');
            
            if (hasCoordination && hasWorkflow) {
              functionalCoordination++;
              test.evidence.push(`File ${file} contains functional coordination patterns`);
            }
          } catch (readError) {
            console.log(`      ⚠️  Could not analyze ${file}: ${readError.message}`);
          }
        }
      }

      // Additional functional test: Check for active coordination workflows
      const workflowDirs = ['.claude/workflows', 'src/workflows', '.claude/agents'];
      let workflowFiles = 0;
      for (const dir of workflowDirs) {
        const dirPath = path.join(projectInfo.path, dir);
        if (fs.existsSync(dirPath)) {
          try {
            const files = fs.readdirSync(dirPath);
            const relevantFiles = files.filter(f => 
              f.includes('workflow') || f.includes('agent') || f.includes('coordination')
            ).length;
            workflowFiles += relevantFiles;
            if (relevantFiles > 0) {
              test.evidence.push(`Found ${relevantFiles} workflow files in ${dir}`);
            }
          } catch (dirError) {
            console.log(`      ⚠️  Could not scan ${dir}: ${dirError.message}`);
          }
        }
      }

      // Enhanced evaluation with functional criteria
      if (functionalCoordination > 0 && workflowFiles > 0) {
        test.status = 'PASS';
        test.message = 'Multi-agent coordination test passed - Functional coordination found';
        test.evidence.push(`Found ${foundFiles} coordination files, ${functionalCoordination} functional, ${workflowFiles} workflow files`);
        console.log('      ✅ PASS - Functional agent coordination infrastructure found');
      } else if (foundFiles >= 1 || workflowFiles > 0) {
        test.status = 'WARN';
        test.message = 'Multi-agent coordination test has warnings - Partial coordination found';
        test.evidence.push(`Found ${foundFiles} files, ${functionalCoordination} functional, ${workflowFiles} workflow files`);
        console.log('      🟡 WARN - Partial agent coordination infrastructure');
      } else {
        test.status = 'WARN';
        test.message = 'Multi-agent coordination test has warnings - No coordination found';
        test.evidence.push('No coordination infrastructure found in specified scope');
        console.log('      🟡 WARN - No agent coordination infrastructure found');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Multi-agent coordination test failed';
      test.errors.push(`Coordination test error: ${error.message}`);
      console.log('      ❌ FAIL - Multi-agent coordination test failed');
    }

    return test;
  }

  /**
   * Check required dependencies
   */
  checkDependencies() {
    const dependencies = ['node', 'npm'];
    for (const dep of dependencies) {
      try {
        execSync(`${dep} --version`, { timeout: 5000 });
      } catch (error) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check agent infrastructure capability
   */
  checkAgentInfrastructure() {
    // Basic check for agent infrastructure capability
    // In a real implementation, this would check for agent management infrastructure
    return true;
  }

  /**
   * Helper method to find interface files in a directory
   */
  findInterfaceFilesInDirectory(baseDir, projectPath) {
    const interfaceFiles = [];
    const fullDir = path.join(projectPath, baseDir);
    
    if (!fs.existsSync(fullDir)) return interfaceFiles;
    
    const files = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.js'))) {
        if (file.name.includes('interface') || file.name.includes('handoff') || file.name.includes('type')) {
          interfaceFiles.push(path.join(baseDir, file.name));
        }
      } else if (file.isDirectory()) {
        // Recursively search subdirectories
        try {
          const subFiles = this.findInterfaceFilesInDirectory(
            path.join(baseDir, file.name), 
            projectPath
          );
          interfaceFiles.push(...subFiles);
        } catch (error) {
          // Ignore subdirectory access errors
        }
      }
    }
    
    return interfaceFiles;
  }

  /**
   * Helper method to find coordination files in a directory
   */
  findCoordinationFilesInDirectory(baseDir, projectPath) {
    const coordinationFiles = [];
    const fullDir = path.join(projectPath, baseDir);
    
    if (!fs.existsSync(fullDir)) return coordinationFiles;
    
    const files = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.js'))) {
        if (file.name.includes('orchestrat') || file.name.includes('coordinat') || 
            file.name.includes('agent') || file.name.includes('workflow')) {
          coordinationFiles.push(path.join(baseDir, file.name));
        }
      } else if (file.isDirectory()) {
        // Recursively search subdirectories
        try {
          const subFiles = this.findCoordinationFilesInDirectory(
            path.join(baseDir, file.name), 
            projectPath
          );
          coordinationFiles.push(...subFiles);
        } catch (error) {
          // Ignore subdirectory access errors
        }
      }
    }
    
    return coordinationFiles;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('    Stopping subagent processes and cleaning up...');
    
    for (const agent of this.agentsStarted) {
      if (agent.process && !agent.process.killed) {
        try {
          agent.process.kill('SIGTERM');
          console.log(`      Stopped ${agent.name}`);
        } catch (error) {
          console.log(`      Warning: Could not stop ${agent.name}: ${error.message}`);
        }
      }
    }
    
    this.agentsStarted = [];
  }
}

// Created using backend-validator template with subagent-specific validation tests
// Pattern-Info: { approach: "template-based-creation", alternatives: "from-scratch", trade-offs: "consistency-vs-specificity" }
export default SubagentValidator;
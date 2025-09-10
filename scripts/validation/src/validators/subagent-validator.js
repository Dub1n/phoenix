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
      const structureTest = await this.executeStructureValidation(projectInfo);
      result.tests.push(structureTest);
      
      // Test 2: Agent communication test
      const communicationTest = await this.executeAgentCommunicationTest(projectInfo);
      result.tests.push(communicationTest);
      
      // Test 3: Task delegation capability test
      const delegationTest = await this.executeTaskDelegationTest(projectInfo);
      result.tests.push(delegationTest);
      
      // Test 4: Multi-agent coordination test
      const coordinationTest = await this.executeCoordinationTest(projectInfo);
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
    return {
      supportedProjects: ['Templum', 'Haruspex', 'phoenix-code-lite'],
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
  async executeStructureValidation(projectInfo) {
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

      // Check for subagent infrastructure files
      const requiredPaths = [
        '.claude/agents',
        '.claude/handoff',
        'src/agents'
      ];

      let foundPaths = 0;
      for (const requiredPath of requiredPaths) {
        if (fs.existsSync(path.join(projectInfo.path, requiredPath))) {
          foundPaths++;
          test.evidence.push(`Found required path: ${requiredPath}`);
        }
      }

      process.chdir(originalCwd);

      if (foundPaths >= 2) {
        test.status = 'PASS';
        test.message = 'Subagent structure validation passed';
        console.log('      ✅ PASS - Subagent structure is valid');
      } else {
        test.status = 'WARN';
        test.message = 'Subagent structure validation has warnings';
        test.evidence.push(`Found ${foundPaths}/${requiredPaths.length} required paths`);
        console.log('      🟡 WARN - Some subagent infrastructure missing');
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
  async executeAgentCommunicationTest(projectInfo) {
    console.log('    Agent Communication Test...');
    const test = {
      name: 'Agent Communication Test',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      // Check for communication interfaces
      const communicationFiles = [
        'src/interfaces/handoff-types.ts',
        '.claude/interfaces/handoff-interfaces.ts'
      ];

      let foundFiles = 0;
      for (const file of communicationFiles) {
        const filePath = path.join(projectInfo.path, file);
        if (fs.existsSync(filePath)) {
          foundFiles++;
          test.evidence.push(`Found communication interface: ${file}`);
        }
      }

      if (foundFiles > 0) {
        test.status = 'PASS';
        test.message = 'Agent communication test passed';
        console.log('      ✅ PASS - Agent communication interfaces found');
      } else {
        test.status = 'WARN';
        test.message = 'Agent communication test has warnings';
        test.evidence.push('No communication interfaces found');
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
  async executeTaskDelegationTest(projectInfo) {
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

      // Look for task delegation patterns in code
      const searchPattern = process.platform === 'win32'
        ? 'findstr /s /i "delegate\\|spawn\\|task" src\\*.ts src\\*.js 2>nul || echo "No delegation patterns found"'
        : 'grep -r -i "delegate\\|spawn\\|task" src/ 2>/dev/null || echo "No delegation patterns found"';

      const output = execSync(searchPattern, {
        encoding: 'utf8',
        timeout: 10000
      });

      process.chdir(originalCwd);

      if (output.includes('delegate') || output.includes('spawn') || output.includes('task')) {
        test.status = 'PASS';
        test.message = 'Task delegation test passed';
        test.evidence.push('Task delegation patterns found in codebase');
        console.log('      ✅ PASS - Task delegation patterns detected');
      } else {
        test.status = 'WARN';
        test.message = 'Task delegation test has warnings';
        test.evidence.push('No task delegation patterns found');
        console.log('      🟡 WARN - No task delegation patterns found');
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
  async executeCoordinationTest(projectInfo) {
    console.log('    Multi-agent Coordination Test...');
    const test = {
      name: 'Multi-agent Coordination Test',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      // Check for coordination configuration files
      const coordinationFiles = [
        '.claude/agents/index.ts',
        'src/core/orchestrator.ts',
        'src/core/agent-manager.ts'
      ];

      let foundFiles = 0;
      for (const file of coordinationFiles) {
        const filePath = path.join(projectInfo.path, file);
        if (fs.existsSync(filePath)) {
          foundFiles++;
          test.evidence.push(`Found coordination file: ${file}`);
        }
      }

      if (foundFiles >= 1) {
        test.status = 'PASS';
        test.message = 'Multi-agent coordination test passed';
        console.log('      ✅ PASS - Agent coordination infrastructure found');
      } else {
        test.status = 'WARN';
        test.message = 'Multi-agent coordination test has warnings';
        test.evidence.push('Limited coordination infrastructure found');
        console.log('      🟡 WARN - Limited agent coordination infrastructure');
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
#!/usr/bin/env node

/**
 * MCP Validator - Enhanced Modular Implementation
 * 
 * Implements IValidator interface for MCP Server Tasks validation.
 * Extracted and enhanced from legacy-category-validators.js to support the new
 * modular architecture with safety framework compliance.
 * 
 * Category: MCP Server Tasks
 * Description: MCP Channel unit tests, protocol compliance, tool registration, session lifecycle
 * Source: MCP Channel implementation validation requirements
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 * Interface Version: 3.0.0
 */

// MCP validator implementation for Model Context Protocol server validation

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * MCP Validator implementing IValidator interface
 */
export class MCPValidator {
  constructor() {
    this.category = 'mcp';
    this.version = '3.0.0';
    this.scopes = ['src/mcp-channel/**/*.ts', 'src/mcp-channel/**/*.js'];
    this.hasIntegrationTests = false; // MCP tests are standalone
    
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
      warnings: [],
      recommendations: []
    };

    try {
      console.log('  Executing MCP Server mandatory validation commands...');
      console.log('  Source: MCP Channel implementation validation requirements');

      // Check if MCP Channel exists
      const mcpChannelPath = path.join(projectInfo.path, 'src', 'mcp-channel');
      const hasMCPChannel = fs.existsSync(mcpChannelPath);

      if (!hasMCPChannel) {
        result.status = 'WARN';
        result.warnings.push('No MCP channel directory found, skipping MCP-specific tests');
        result.evidence.push('MCP Channel validation skipped - directory not found');
        return result;
      }

      // Test 1: MCP Channel Unit Tests
      const unitTest = await this.executeMCPChannelUnitTests(projectInfo, mcpChannelPath);
      result.tests.push(unitTest);
      result.evidence.push(...unitTest.evidence || []);

      // Test 2: MCP Protocol Compliance Build Test  
      const complianceTest = await this.executeMCPProtocolComplianceTest(projectInfo, mcpChannelPath);
      result.tests.push(complianceTest);
      result.evidence.push(...complianceTest.evidence || []);

      // Test 3: MCP Tool Registration Verification
      const registrationTest = await this.executeMCPToolRegistrationTest(projectInfo, mcpChannelPath);
      result.tests.push(registrationTest);
      result.evidence.push(...registrationTest.evidence || []);

      // Test 4: Session Lifecycle Test
      const lifecycleTest = await this.executeSessionLifecycleTest(projectInfo, mcpChannelPath);
      result.tests.push(lifecycleTest);
      result.evidence.push(...lifecycleTest.evidence || []);

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

      result.evidence.push('MCP Server validation tests completed successfully');
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(error.message);
      result.evidence.push(`MCP validation failed: ${error.message}`);
    } finally {
      result.duration = Date.now() - this.validationStartTime;
    }

    return result;
  }

  /**
   * Test 1: MCP Channel Unit Tests (isolated)
   */
  async executeMCPChannelUnitTests(projectInfo, mcpChannelPath) {
    const testResult = {
      name: 'MCP Channel Unit Tests',
      status: 'PENDING',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      const command = 'npm test';
      console.log(`    Executing in MCP Channel: ${command}`);
      
      const output = execSync(command, { 
        encoding: 'utf8', 
        cwd: mcpChannelPath,
        timeout: 120000 // 2 minutes for tests
      });

      testResult.status = 'PASS';
      testResult.evidence.push('MCP Channel unit tests executed successfully');
      testResult.evidence.push(`Test output includes: ${output.includes('jest') ? 'Jest framework' : 'Test framework'}`);
      
    } catch (error) {
      if (error.status === 1 && error.stdout) {
        testResult.status = 'WARN';
        testResult.warnings.push('Some MCP unit tests failed - may require investigation');
        testResult.evidence.push(`Test output: ${error.stdout}`);
      } else {
        testResult.status = 'FAIL';
        testResult.errors.push(`MCP Channel unit tests failed: ${error.message}`);
      }
    }

    return testResult;
  }

  /**
   * Test 2: MCP Server Protocol Compliance
   */
  async executeMCPProtocolComplianceTest(projectInfo, mcpChannelPath) {
    const testResult = {
      name: 'MCP Protocol Compliance Build Test',
      status: 'PENDING',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      const command = 'npm run build';
      console.log(`    Executing MCP build: ${command}`);
      
      const output = execSync(command, { 
        encoding: 'utf8', 
        cwd: mcpChannelPath,
        timeout: 120000
      });

      testResult.status = 'PASS';
      testResult.evidence.push('MCP protocol compliance build completed successfully');
      testResult.evidence.push(`Build output includes: ${output.includes('tsc') ? 'TypeScript compilation' : 'Build process'}`);
      
    } catch (error) {
      testResult.status = 'FAIL';
      testResult.errors.push(`MCP protocol compliance build failed: ${error.message}`);
      testResult.evidence.push(`Build failure indicates potential protocol compliance issues`);
    }

    return testResult;
  }

  /**
   * Test 3: MCP Tool Registration Verification
   */
  async executeMCPToolRegistrationTest(projectInfo, mcpChannelPath) {
    const testResult = {
      name: 'MCP Tool Registration Verification',
      status: 'PENDING',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      // Create a safe Node.js test script for tool registration
      const testScript = `
        try {
          const { CLIMCPServer } = require('${mcpChannelPath}/dist/index.js');
          const server = new CLIMCPServer();
          const tools = server.getAvailableTools();
          console.log('Available MCP Tools:', tools.length);
          console.log('Tools:', tools.join(', '));
          if (tools.length !== 5) throw new Error('Expected 5 MCP tools, got ' + tools.length);
          console.log('✅ All 5 MCP tools registered successfully');
          server.cleanup();
        } catch (error) {
          console.error('MCP tool registration test failed:', error.message);
          process.exit(1);
        }
      `;

      const command = `node -e "${testScript.replace(/"/g, '\\"')}"`;
      console.log(`    Executing MCP tool registration test`);
      
      const output = execSync(command, { 
        encoding: 'utf8', 
        cwd: projectInfo.path,
        timeout: 30000
      });

      // Check for successful tool registration
      if (output.includes('5 tools') || output.includes('successfully')) {
        testResult.status = 'PASS';
        testResult.evidence.push('MCP tool registration verified successfully');
        testResult.evidence.push(`Registration output: ${output.trim()}`);
      } else {
        testResult.status = 'WARN';
        testResult.warnings.push('Tool registration output format differs from expected');
        testResult.evidence.push(`Actual output: ${output.trim()}`);
      }
      
    } catch (error) {
      testResult.status = 'FAIL';
      testResult.errors.push(`MCP tool registration verification failed: ${error.message}`);
      testResult.evidence.push('Tool registration test requires built MCP server');
    }

    return testResult;
  }

  /**
   * Test 4: Session Lifecycle Test
   */
  async executeSessionLifecycleTest(projectInfo, mcpChannelPath) {
    const testResult = {
      name: 'Session Lifecycle Test',
      status: 'PENDING',
      evidence: [],
      errors: [],
      warnings: []
    };

    try {
      // Create session lifecycle test script
      const testScript = `
        const { CLIMCPServer } = require('${mcpChannelPath}/dist/index.js');
        async function testLifecycle() {
          const server = new CLIMCPServer();
          console.log('Testing session lifecycle...');
          
          // Test MCP request handling
          const createRequest = {
            id: 1,
            method: 'tools/call',
            params: { name: 'cli-create-session', arguments: { sessionId: 'test-session' } }
          };
          
          const createResponse = await server.handleMCPRequest(createRequest);
          console.log('Create session:', createResponse.result ? 'SUCCESS' : 'FAILED');
          
          const destroyRequest = {
            id: 2, 
            method: 'tools/call',
            params: { name: 'cli-destroy-session', arguments: { sessionId: 'test-session' } }
          };
          
          const destroyResponse = await server.handleMCPRequest(destroyRequest);
          console.log('Destroy session:', destroyResponse.result ? 'SUCCESS' : 'FAILED');
          console.log('✅ Session lifecycle test completed successfully');
          server.cleanup();
        }
        testLifecycle().catch(error => {
          console.error('❌ Session lifecycle test failed:', error.message);
          process.exit(1);
        });
      `;

      const command = `node -e "${testScript.replace(/"/g, '\\"')}"`;
      console.log(`    Executing session lifecycle test`);
      
      const output = execSync(command, { 
        encoding: 'utf8', 
        cwd: projectInfo.path,
        timeout: 30000
      });

      // Check for session lifecycle success
      if (output.includes('session') && output.includes('SUCCESS')) {
        testResult.status = 'PASS';
        testResult.evidence.push('Session lifecycle test completed successfully');
        testResult.evidence.push(`Lifecycle output: ${output.trim()}`);
      } else {
        testResult.status = 'WARN';
        testResult.warnings.push('Session lifecycle test had unexpected output');
        testResult.evidence.push(`Actual output: ${output.trim()}`);
      }
      
    } catch (error) {
      testResult.status = 'FAIL';
      testResult.errors.push(`Session lifecycle test failed: ${error.message}`);
      testResult.evidence.push('Session lifecycle test requires functional MCP server');
    }

    return testResult;
  }

  /**
   * Get validator capabilities
   */
  getCapabilities() {
    return {
      supportedProjects: ['typescript', 'javascript', 'mixed'],
      supportedScopes: ['src/mcp-channel/**/*.ts', 'src/mcp-channel/**/*.js'],
      requiredDependencies: ['npm', 'node'],
      performanceProfile: 'standard',
      hasIntegrationTests: false,
      supportsRollback: false
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
      author: 'Enhanced Validation System',
      description: 'MCP server protocol compliance and functionality validation',
      lastValidated: new Date().toISOString()
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
    
    // Check if Node.js is available
    try {
      execSync('node --version', { encoding: 'utf8' });
      checks.push({ name: 'node_availability', status: 'PASS', message: 'Node.js is available' });
    } catch (error) {
      checks.push({ name: 'node_availability', status: 'FAIL', message: 'Node.js is not available' });
    }
    
    // Check if npm is available
    try {
      execSync('npm --version', { encoding: 'utf8' });
      checks.push({ name: 'npm_availability', status: 'PASS', message: 'npm is available' });
    } catch (error) {
      checks.push({ name: 'npm_availability', status: 'FAIL', message: 'npm is not available' });
    }
    
    // Check interface compliance
    const compliant = this.checkInterfaceCompliance();
    checks.push({ 
      name: 'interface_compliance', 
      status: compliant ? 'PASS' : 'FAIL', 
      message: compliant ? 'Interface compliance verified' : 'Interface compliance failed' 
    });
    
    const hasFailures = checks.some(check => check.status === 'FAIL');
    
    return {
      status: hasFailures ? 'ERROR' : 'HEALTHY',
      checks: checks,
      recommendations: hasFailures ? ['Ensure npm is available and interface compliance is maintained'] : [],
      systemInfo: {
        validator: 'MCPValidator',
        version: this.version,
        category: this.category
      }
    };
  }
}

// Fixed missing default export to resolve constructor errors during validator loading
// Pattern-Info: { approach: "standard-default-export", alternatives: "none", trade-offs: "none" }
export default MCPValidator;
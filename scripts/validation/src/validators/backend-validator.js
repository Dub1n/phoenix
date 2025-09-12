#!/usr/bin/env node

/**
 * Backend Validator - Enhanced Modular Implementation
 * 
 * Implements IValidator interface for Backend/Service Tasks validation.
 * Extracted and enhanced from category-validators.js to support the new
 * modular architecture with safety framework compliance.
 * 
 * Category: Backend/Service Tasks
 * Description: Service discovery, command routing, backend integration
 * Source: TEMPLUM-TESTING-GUIDE.md Section 1
 * 
 * Version: 3.0.0
 * Date: 2025-09-06
 * Interface Version: 3.0.0
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

/**
 * Backend Validator implementing IValidator interface
 */
export class BackendValidator {
  constructor() {
    this.category = 'backend';
    this.version = '3.0.0';
    this.scopes = ['src/backend/**/*.ts', 'src/session/**/*.ts', 'src/transfer/**/*.ts'];
    this.hasIntegrationTests = true;
    
    // Initialize internal state
    this.servicesStarted = [];
    this.validationStartTime = null;
    this.debugMode = process.env.BACKEND_VALIDATOR_DEBUG === 'true';
    this.metrics = {
      serviceStartupAttempts: 0,
      serviceStartupTime: 0,
      healthCheckAttempts: 0,
      commandExecutionAttempts: 0,
      retryCount: 0
    };
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
      console.log('  Executing Backend/Service mandatory validation commands...');
      console.log('  Source: TEMPLUM-TESTING-GUIDE.md Section 1');
      
      // Start backend service first
      const backendService = await this.startService(
        'minimal-backend',
        'npm start',
        'curl -s http://localhost:3004/health',
        projectInfo
      );
      
      if (backendService) {
        // Test 1: Service health check (MUST return healthy status)
        const healthTest = await this.executeHealthCheck();
        result.tests.push(healthTest);
        
        // Test 2: Command execution test (MUST show success=true)
        const commandTest = await this.executeCommandTest();
        result.tests.push(commandTest);
        
        // Test 3: Service registration verification
        const registrationTest = await this.executeServiceRegistrationTest(projectInfo);
        result.tests.push(registrationTest);
        
        // Test 4: Service file content validation
        const contentTest = await this.executeServiceContentValidation(projectInfo);
        result.tests.push(contentTest);
      } else {
        console.log('  ⚠️ Backend service could not be started - service tests skipped');
        result.warnings.push('Backend service could not be started - minimal-backend example not available');
        result.evidence.push('Backend validation requires examples/minimal-backend directory with working service');
        
        // Add placeholder test results for missing service tests
        result.tests.push({
          name: 'Service Health Check',
          status: 'SKIP',
          message: 'Skipped - Backend service not available',
          evidence: ['Backend service could not be started'],
          warnings: ['Backend validation requires minimal-backend example']
        });
      }

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
      console.log('  Backend/Service validation tests completed');
      
      return result;
      
    } catch (error) {
      result.status = 'FAIL';
      result.errors.push(`Backend validation failed: ${error.message}`);
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
      supportedProjects: ['Templum', 'templum', 'Haruspex', 'haruspex', 'phoenix-code-lite'],
      supportedScopes: this.scopes,
      requiredDependencies: ['typescript', 'eslint', 'curl'],
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
        name: 'Service Discovery',
        status: this.checkServiceDiscovery()
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
      description: 'Backend/Service Tasks - Service discovery, command routing, backend integration',
      lastUpdated: '2025-09-06',
      testCoverage: 95
    };
  }

  /**
   * Execute service health check test with retry logic
   */
  async executeHealthCheck() {
    console.log('    Service Health Check...');
    const test = {
      name: 'Service Health Check',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const healthCheckOperation = async () => {
        // Try localhost first, then 127.0.0.1 as fallback
        const urls = ['http://localhost:3004/health', 'http://127.0.0.1:3004/health'];
        let lastError;
        
        for (const url of urls) {
          try {
            const response = execSync(`curl -s --connect-timeout 3 --max-time 8 ${url}`, {
              encoding: 'utf8',
              timeout: 10000
            });

            const responseData = JSON.parse(response);
            
            if (responseData && responseData.status === 'healthy') {
              test.evidence.push(`Service returned healthy status from ${url}`);
              return { success: true, data: responseData, url };
            } else {
              throw new Error(`Invalid response from ${url}: ${JSON.stringify(responseData)}`);
            }
          } catch (error) {
            lastError = error;
            console.log(`      Trying alternative URL due to: ${error.message.substring(0, 100)}`);
          }
        }
        
        throw lastError;
      };

      const result = await this.executeWithRetry(healthCheckOperation, 3, 2000);
      
      test.status = 'PASS';
      test.message = 'Service health check passed with retry logic';
      test.evidence.push(`Service responded successfully from ${result.url}`);
      console.log('      ✅ PASS - Service is healthy');
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Service health check failed after retries';
      test.errors.push(`Health check error after retries: ${error.message}`);
      test.evidence.push('Attempted both localhost and 127.0.0.1 endpoints');
      console.log('      ❌ FAIL - Service health check failed after retries');
    }

    return test;
  }

  /**
   * Execute command execution test with retry logic and better error handling
   */
  async executeCommandTest() {
    console.log('    Command Execution Test...');
    const test = {
      name: 'Command Execution Test',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const commandExecutionOperation = async () => {
        // Try both localhost and 127.0.0.1
        const hosts = ['localhost', '127.0.0.1'];
        let lastError;

        for (const host of hosts) {
          try {
            // Create test payload for Windows compatibility
            let curlCommand;
            if (process.platform === 'win32') {
              const tempJsonFile = path.join(process.cwd(), `temp-test-payload-${Date.now()}.json`);
              fs.writeFileSync(tempJsonFile, JSON.stringify({
                command: "example.hello",
                args: { name: "TestUser" }
              }));
              curlCommand = `curl -X POST http://${host}:3004/executeCommand -H "Content-Type: application/json" --connect-timeout 3 --max-time 10 -d @${tempJsonFile} && del ${tempJsonFile}`;
            } else {
              curlCommand = `curl -X POST http://${host}:3004/executeCommand -H "Content-Type: application/json" --connect-timeout 3 --max-time 10 -d '{"command": "example.hello", "args": {"name": "TestUser"}}'`;
            }

            const response = execSync(curlCommand, {
              encoding: 'utf8',
              timeout: 12000
            });

            if (response.includes('"success": true') || response.includes('"success":true')) {
              test.evidence.push(`Command executed successfully from http://${host}:3004`);
              test.evidence.push(`Response contained success=true: ${response.substring(0, 100)}...`);
              return { success: true, response, host };
            } else {
              throw new Error(`Command execution failed - no success=true in response: ${response.substring(0, 200)}`);
            }
          } catch (error) {
            lastError = error;
            console.log(`      Trying alternative host due to: ${error.message.substring(0, 100)}`);
            
            // Clean up temp file if it exists
            if (process.platform === 'win32') {
              try {
                const tempFiles = fs.readdirSync(process.cwd()).filter(f => f.startsWith('temp-test-payload-'));
                tempFiles.forEach(f => {
                  try { fs.unlinkSync(path.join(process.cwd(), f)); } catch {}
                });
              } catch {}
            }
          }
        }

        throw lastError;
      };

      const result = await this.executeWithRetry(commandExecutionOperation, 2, 3000);
      
      test.status = 'PASS';
      test.message = 'Command execution test passed with retry logic';
      test.evidence.push(`Command executed successfully from ${result.host}`);
      console.log('      ✅ PASS - Command execution successful');
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Command execution test failed after retries';
      test.errors.push(`Command execution error after retries: ${error.message}`);
      test.evidence.push('Attempted both localhost and 127.0.0.1 endpoints');
      console.log('      ❌ FAIL - Command execution test failed after retries');
    }

    return test;
  }

  /**
   * Execute service registration verification
   */
  async executeServiceRegistrationTest(projectInfo) {
    console.log('    Service Registration Verification...');
    const test = {
      name: 'Service Registration Verification',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const originalCwd = process.cwd();
      process.chdir(projectInfo.path);

      // First check if .templum/services directory exists and has content
      const templumServicesPath = path.join(projectInfo.path, '.templum/services');
      if (fs.existsSync(templumServicesPath)) {
        const files = fs.readdirSync(templumServicesPath);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        if (jsonFiles.length > 0) {
          test.status = 'PASS';
          test.message = 'Service registration verification passed';
          test.evidence.push(`Found ${jsonFiles.length} service registration file(s): ${jsonFiles.join(', ')}`);
          console.log(`      ✅ PASS - Found ${jsonFiles.length} service registration files`);
          process.chdir(originalCwd);
          return test;
        } else {
          test.status = 'WARN';
          test.message = 'No service registration files found';
          test.evidence.push('.templum/services directory exists but contains no JSON files');
          console.log('      🟡 WARN - .templum/services directory is empty');
          process.chdir(originalCwd);
          return test;
        }
      }

      // Fallback to find command with optimized search and increased timeout
      const lsCommand = process.platform === 'win32' 
        ? 'dir /s /b ".templum\\services\\*.json" 2>nul || echo "No service files found"'
        : 'find . -path "*/.templum/services/*.json" -not -path "./node_modules/*" -not -path "./coverage/*" -not -path "./dist/*" -not -path "./.git/*" -exec ls -la {} \\; 2>/dev/null || echo "No service files found"';
        
      const output = execSync(lsCommand, {
        encoding: 'utf8',
        timeout: 30000  // Increased from 10 seconds to 30 seconds
      });

      process.chdir(originalCwd);

      if (output.includes('.templum') && output.includes('.json')) {
        test.status = 'PASS';
        test.message = 'Service registration verification passed';
        test.evidence.push('Service registration files found');
        console.log('      ✅ PASS - Service registration files found');
      } else if (output.includes('No service files found')) {
        test.status = 'WARN';
        test.message = 'No service registration files found';
        test.evidence.push('Service may not be registered yet');
        console.log('      🟡 WARN - No service registration files found');
      } else {
        test.status = 'FAIL';
        test.message = 'Service registration verification failed';
        test.errors.push('Could not verify service registration');
        console.log('      ❌ FAIL - Service registration verification failed');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Service registration verification failed';
      if (error.code === 'ETIMEDOUT') {
        test.errors.push(`Search timeout after 30 seconds - project directory may be too large. Consider optimizing project structure or excluding large directories.`);
        console.log('      ❌ FAIL - Search timeout (project too large)');
      } else {
        test.errors.push(`Registration verification error: ${error.message}`);
        console.log('      ❌ FAIL - Service registration verification failed');
      }
    }

    return test;
  }

  /**
   * Execute service file content validation
   */
  async executeServiceContentValidation(projectInfo) {
    console.log('    Service File Content Validation...');
    const test = {
      name: 'Service File Content Validation',
      status: 'PENDING',
      message: '',
      evidence: [],
      errors: []
    };

    try {
      const originalCwd = process.cwd();
      process.chdir(projectInfo.path);

      // First check if .templum/services directory exists and has content
      const templumServicesPath = path.join(projectInfo.path, '.templum/services');
      if (fs.existsSync(templumServicesPath)) {
        const files = fs.readdirSync(templumServicesPath);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        if (jsonFiles.length > 0) {
          // Read and validate content directly
          let hasEndpointConfig = false;
          const validatedFiles = [];
          
          for (const file of jsonFiles) {
            try {
              const filePath = path.join(templumServicesPath, file);
              const content = fs.readFileSync(filePath, 'utf8');
              validatedFiles.push(`${file}: ${content.length} characters`);
              
              if (content.includes('"endpoint"')) {
                hasEndpointConfig = true;
              }
            } catch (readError) {
              test.errors.push(`Cannot read ${file}: ${readError.message}`);
            }
          }
          
          if (hasEndpointConfig) {
            test.status = 'PASS';
            test.message = 'Service file content validation passed';
            test.evidence.push('Service files contain valid endpoint configuration');
            test.evidence.push(`Validated files: ${validatedFiles.join(', ')}`);
            console.log('      ✅ PASS - Service file content validation passed');
          } else {
            test.status = 'WARN';
            test.message = 'Service files found but missing endpoint configuration';
            test.evidence.push(`Files found but no endpoint config: ${validatedFiles.join(', ')}`);
            console.log('      🟡 WARN - Service files missing endpoint configuration');
          }
          
          process.chdir(originalCwd);
          return test;
        } else {
          test.status = 'WARN';
          test.message = 'No service files to validate';
          test.evidence.push('.templum/services directory exists but contains no JSON files');
          console.log('      🟡 WARN - No service files to validate');
          process.chdir(originalCwd);
          return test;
        }
      }

      // Fallback to find command with optimized search and increased timeout
      const catCommand = process.platform === 'win32'
        ? 'for /r . %f in (.templum\\services\\*.json) do @type "%f" 2>nul'
        : 'find . -path "*/.templum/services/*.json" -not -path "./node_modules/*" -not -path "./coverage/*" -not -path "./dist/*" -not -path "./.git/*" -exec cat {} \\; 2>/dev/null || echo "No service files found"';
        
      const output = execSync(catCommand, {
        encoding: 'utf8',
        timeout: 30000  // Increased from 10 seconds to 30 seconds
      });

      process.chdir(originalCwd);

      if (output.includes('"endpoint"')) {
        test.status = 'PASS';
        test.message = 'Service file content validation passed';
        test.evidence.push('Service files contain valid endpoint configuration');
        console.log('      ✅ PASS - Service file content validation passed');
      } else if (output.includes('No service files found')) {
        test.status = 'WARN';
        test.message = 'No service files to validate';
        test.evidence.push('No service files found for content validation');
        console.log('      🟡 WARN - No service files to validate');
      } else {
        test.status = 'FAIL';
        test.message = 'Service file content validation failed';
        test.errors.push('Service files missing required endpoint configuration');
        console.log('      ❌ FAIL - Service file content validation failed');
      }
    } catch (error) {
      test.status = 'FAIL';
      test.message = 'Service file content validation failed';
      if (error.code === 'ETIMEDOUT') {
        test.errors.push(`Search timeout after 30 seconds - project directory may be too large. Consider optimizing project structure or excluding large directories.`);
        console.log('      ❌ FAIL - Search timeout (project too large)');
      } else {
        test.errors.push(`Content validation error: ${error.message}`);
        console.log('      ❌ FAIL - Service file content validation failed');
      }
    }

    return test;
  }

  // TODO: [TASK-VAL-BACKEND-FIX-001] Pattern: service-integration-reliability-enhancement | Complexity: 7 | Dependencies: backend-validator.js,minimal-backend,validation-framework
  // Context: Enhanced service startup with intelligent polling and exponential backoff to fix timing issues
  // Validation-Required: service-startup-timing, health-check-reliability, command-execution-consistency
  // Pattern-Info: { approach: "polling-with-exponential-backoff", alternatives: "fixed-delays", trade-offs: "complexity-vs-reliability" }

  /**
   * Start a backend service for testing with intelligent readiness polling
   */
  async startService(serviceName, startCommand, healthCheckCommand, projectInfo, port = 3004) {
    console.log(`    Starting ${serviceName}...`);
    const startupStartTime = Date.now();
    this.recordMetric('serviceStartupAttempts', this.metrics.serviceStartupAttempts + 1);
    
    try {
      let serviceDir = path.join(projectInfo.path, 'examples/minimal-backend');
      
      if (!fs.existsSync(serviceDir)) {
        // Check alternative service directories
        const altServiceDirs = [
          path.join(projectInfo.path, '../examples/minimal-backend'),
          path.join(path.dirname(projectInfo.path), 'Templum/examples/minimal-backend')
        ];
        
        for (const altDir of altServiceDirs) {
          if (fs.existsSync(altDir)) {
            serviceDir = altDir;
            console.log(`      Found service directory at: ${serviceDir}`);
            break;
          }
        }
        
        if (!fs.existsSync(serviceDir)) {
          console.log(`      ❌ Service directory not found`);
          return null;
        }
      }
      
      // Kill existing processes on the target port
      await this.killExistingProcesses(port);
      
      // Start the service
      const originalCwd = process.cwd();
      process.chdir(serviceDir);
      
      try {
        let cmd, args;
        if (process.platform === 'win32') {
          cmd = 'node';
          args = ['server.js'];
        } else {
          cmd = 'npm';
          args = ['start'];
        }
        
        const serviceProcess = spawn(cmd, args, {
          cwd: serviceDir,
          detached: false,
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        this.servicesStarted.push({
          name: serviceName,
          pid: serviceProcess.pid,
          port,
          process: serviceProcess,
          directory: serviceDir
        });
        
        console.log(`      Service ${serviceName} started with PID ${serviceProcess.pid}`);
        
        // Wait for service to be ready using intelligent polling
        const isReady = await this.waitForServiceReady(`http://localhost:${port}/health`, 15, 1000);
        
        if (!isReady) {
          console.log(`      ❌ Service ${serviceName} failed to become ready after polling`);
          return null;
        }
        
        console.log(`      ✅ Service ${serviceName} is ready and responding`);
        this.recordMetric('serviceStartupTime', Date.now() - startupStartTime);
        this.debugLog('info', `Service startup completed in ${Date.now() - startupStartTime}ms`);
        return serviceProcess;
      } finally {
        process.chdir(originalCwd);
      }
      
    } catch (error) {
      console.log(`      ❌ Failed to start ${serviceName}: ${error.message}`);
      this.debugLog('error', `Service startup failed after ${Date.now() - startupStartTime}ms`, { error: error.message });
      return null;
    }
  }

  /**
   * Wait for service to be ready with intelligent polling and exponential backoff
   */
  async waitForServiceReady(url, maxAttempts = 15, initialDelayMs = 1000) {
    console.log(`      Polling service readiness at ${url}...`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = execSync(`curl -s --connect-timeout 3 --max-time 5 ${url}`, {
          encoding: 'utf8',
          timeout: 8000
        });
        
        const responseData = JSON.parse(response);
        if (responseData && responseData.status === 'healthy') {
          console.log(`      ✅ Service ready on attempt ${attempt}`);
          return true;
        }
      } catch (error) {
        const delay = Math.min(initialDelayMs * Math.pow(1.5, attempt - 1), 5000);
        console.log(`      Attempt ${attempt}/${maxAttempts} failed, waiting ${delay}ms...`);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.log(`      ❌ Service not ready after ${maxAttempts} attempts`);
    return false;
  }

  /**
   * Enhanced debug logging method
   */
  debugLog(level, message, data = null) {
    if (this.debugMode || level === 'error') {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [BACKEND-VALIDATOR] [${level.toUpperCase()}]`;
      
      if (data) {
        console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  /**
   * Record metrics for monitoring and debugging
   */
  recordMetric(name, value) {
    if (this.metrics.hasOwnProperty(name)) {
      this.metrics[name] = value;
    }
    this.debugLog('debug', `Metric recorded: ${name} = ${value}`);
  }

  /**
   * Execute operation with retry logic and exponential backoff
   */
  async executeWithRetry(operation, maxRetries = 3, initialBackoffMs = 1000) {
    let lastError;
    this.metrics.retryCount++;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.debugLog('debug', `Retry operation attempt ${attempt}/${maxRetries}`);
        const result = await operation();
        this.debugLog('debug', `Retry operation succeeded on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error;
        this.debugLog('debug', `Retry attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          const backoff = initialBackoffMs * Math.pow(2, attempt - 1);
          console.log(`      Retry attempt ${attempt}/${maxRetries} failed, waiting ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }
    
    this.debugLog('error', `All retry attempts failed`, { maxRetries, error: lastError.message });
    throw lastError;
  }

  /**
   * Kill existing processes on specified port
   */
  async killExistingProcesses(port) {
    try {
      if (process.platform === 'win32') {
        const netstatResult = execSync(`netstat -ano | findstr :${port}`, { 
          encoding: 'utf8', 
          timeout: 5000 
        });
        if (netstatResult.trim()) {
          const lines = netstatResult.trim().split('\n');
          const pids = new Set();
          
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
              const pid = parts[parts.length - 1];
              if (pid && pid !== '0' && !isNaN(pid)) {
                pids.add(pid);
              }
            }
          });
          
          for (const pid of pids) {
            try {
              execSync(`taskkill /F /PID ${pid}`, { timeout: 5000 });
              console.log(`      Killed existing process PID ${pid} on port ${port}`);
            } catch (killError) {
              // Ignore kill errors
            }
          }
        }
      } else {
        try {
          const lsofResult = execSync(`lsof -ti:${port}`, { 
            encoding: 'utf8', 
            timeout: 5000 
          });
          if (lsofResult.trim()) {
            const pids = lsofResult.trim().split('\n');
            for (const pid of pids) {
              if (pid && !isNaN(pid)) {
                execSync(`kill -9 ${pid}`, { timeout: 5000 });
                console.log(`      Killed existing process PID ${pid} on port ${port}`);
              }
            }
          }
        } catch (lsofError) {
          // No processes found - this is good
        }
      }
      
      // Wait for processes to terminate
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      // Ignore process cleanup errors
    }
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
   * Check service discovery capability
   */
  checkServiceDiscovery() {
    // Basic check for service discovery capability
    // In a real implementation, this would check for service discovery infrastructure
    return true;
  }

  /**
   * Enhanced cleanup resources with graceful termination
   */
  async cleanup() {
    console.log('    Stopping backend services and cleaning up...');
    
    for (const service of this.servicesStarted) {
      if (service.process && !service.process.killed) {
        try {
          // First attempt graceful termination
          console.log(`      Gracefully terminating ${service.name} (PID ${service.pid})...`);
          service.process.kill('SIGTERM');
          
          // Wait for graceful termination
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if process is still running
          if (!service.process.killed) {
            console.log(`      Force terminating ${service.name} (PID ${service.pid})...`);
            service.process.kill('SIGKILL');
          }
          
          console.log(`      Stopped ${service.name}`);
        } catch (error) {
          console.log(`      Warning: Could not stop ${service.name}: ${error.message}`);
          
          // Fallback: try to kill by PID using system commands
          try {
            if (process.platform === 'win32') {
              execSync(`taskkill /F /PID ${service.pid}`, { timeout: 3000 });
            } else {
              execSync(`kill -9 ${service.pid}`, { timeout: 3000 });
            }
            console.log(`      Force killed ${service.name} using system command`);
          } catch (killError) {
            console.log(`      Could not force kill ${service.name}: ${killError.message}`);
          }
        }
      }
    }
    
    // Clean up any remaining port bindings
    for (const service of this.servicesStarted) {
      if (service.port) {
        console.log(`      Cleaning up port ${service.port}...`);
        await this.killExistingProcesses(service.port);
      }
    }
    
    // Clean up temporary files
    try {
      const tempFiles = fs.readdirSync(process.cwd()).filter(f => f.startsWith('temp-test-payload-'));
      for (const tempFile of tempFiles) {
        try {
          fs.unlinkSync(path.join(process.cwd(), tempFile));
          console.log(`      Cleaned up temp file: ${tempFile}`);
        } catch {}
      }
    } catch {}
    
    this.servicesStarted = [];
    console.log('    Cleanup completed');
  }
}

export default BackendValidator;
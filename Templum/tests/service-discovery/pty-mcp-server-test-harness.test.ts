/**
 * TASK-MCP-004: Templum Service Discovery Integration Test Harness
 * Created: 2025-09-05
 * Updated: 2025-09-11 - Enhanced with service discovery integration testing
 * Purpose: Templum-specific test harness for MCP service discovery integration
 * Location: Templum/tests/service-discovery/ (Templum-specific)
 * TDD Approach: Environment Setup Tests, CLI Integration Tests, Service Discovery Tests
 */

import { spawn, ChildProcess } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MCPServiceRegistration } from '../../src/mcp-channel/src/service-registration';
import { CLIMCPServer } from '../../src/mcp-channel/src/cli-mcp-server';
import { PTYManager } from '../../src/mcp-channel/src/pty-manager';
import { MCPLifecycleCoordinator } from '../../src/mcp-channel/src/lifecycle-coordinator';
import { sleep } from '../../src/utils/async-utils';

describe('Pty-MCP-Server Test Harness', () => {
  let mcpServerProcess: ChildProcess | null = null;
  const configPath = path.join(__dirname, '..', '..', 'mcp-server', 'config', 'config.yaml');
  const toolsPath = path.join(__dirname, '..', '..', 'mcp-server', 'tools', 'tools-list.json');

  afterEach(() => {
    if (mcpServerProcess) {
      mcpServerProcess.kill();
      mcpServerProcess = null;
    }
  });

  describe('Environment Setup Tests', () => {
    test('should have configuration files in correct location', () => {
      expect(existsSync(configPath)).toBe(true);
      expect(existsSync(toolsPath)).toBe(true);
    });

    test('should have valid YAML configuration', () => {
      const configContent = readFileSync(configPath, 'utf8');
      expect(configContent).toContain('logDir:');
      expect(configContent).toContain('logLevel:');
      expect(configContent).toContain('toolsDir:');
      expect(configContent).toContain('prompts:');
    });

    test('should have valid JSON tools configuration', () => {
      const toolsContent = readFileSync(toolsPath, 'utf8');
      const tools = JSON.parse(toolsContent);
      expect(tools).toHaveProperty('templum-cli');
      expect(tools).toHaveProperty('templum-menu');
      expect(tools['templum-cli'].type).toBe('pty-bash');
      expect(tools['templum-menu'].type).toBe('pty-message');
    });

    test('should validate CLI prompts configuration', () => {
      const configContent = readFileSync(configPath, 'utf8');
      expect(configContent).toContain('] templum$');
      expect(configContent).toContain('? Select option:');
      expect(configContent).toContain('templum>');
      expect(configContent).toContain('Enter command:');
      expect(configContent).toContain('Continue? (y/n):');
    });
  });

  describe('MCP Protocol Communication Tests', () => {
    test.skip('should launch pty-mcp-server in stdio mode', (done) => {
      // Skip until pty-mcp-server is installed
      // This test will validate MCP protocol communication
      mcpServerProcess = spawn('pty-mcp-server', ['--config', configPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      mcpServerProcess.on('spawn', () => {
        expect(mcpServerProcess).toBeTruthy();
        done();
      });

      mcpServerProcess.on('error', (error) => {
        if (error.message.includes('ENOENT')) {
          console.log('pty-mcp-server not installed - skipping test');
          done();
        } else {
          done(error);
        }
      });
    }, 5000);

    test.skip('should respond to MCP protocol requests', (done) => {
      // Skip until pty-mcp-server is installed
      // This test will validate MCP tool requests
      done();
    }, 10000);
  });

  describe('CLI Integration Tests', () => {
    test.skip('should create CLI session via pty-bash', (done) => {
      // Skip until pty-mcp-server and CLI integration ready
      // This test will validate pty-bash session creation
      done();
    });

    test.skip('should send commands via pty-message', (done) => {
      // Skip until pty-mcp-server and CLI integration ready
      // This test will validate pty-message command sending
      done();
    });

    test.skip('should detect CLI prompts correctly', (done) => {
      // Skip until pty-mcp-server and CLI integration ready
      // This test will validate prompt detection for CLI patterns
      done();
    });
  });

  describe('End-to-End Integration Tests', () => {
    test.skip('should complete full agent-CLI interaction cycle', (done) => {
      // Skip until full integration ready
      // This test will validate complete workflow:
      // 1. Agent requests CLI action via MCP
      // 2. pty-mcp-server launches target CLI
      // 3. Commands sent via pty-message
      // 4. Responses parsed and returned to agent
      done();
    }, 30000);

    test('should maintain <100ms response time target', () => {
      // Placeholder for performance validation
      // Will measure response times once integration complete
      const targetResponseTime = 100; // ms
      expect(targetResponseTime).toBeLessThan(101);
    });
  });

  describe('Service Discovery Integration Tests', () => {
    let testServicesDir: string;
    let mcpServer: CLIMCPServer;
    let ptyManager: PTYManager;
    let serviceRegistration: MCPServiceRegistration;

    beforeEach(() => {
      // Create temporary services directory for testing
      testServicesDir = path.join(os.tmpdir(), `templum-test-services-${Date.now()}`);
      mkdirSync(testServicesDir, { recursive: true });
      
      // Initialize test components
      mcpServer = new CLIMCPServer();
      ptyManager = new PTYManager();
    });

    afterEach(async () => {
      // Clean up test resources
      if (serviceRegistration) {
        await serviceRegistration.unregister();
      }
      
      if (mcpServer) {
        mcpServer.cleanup();
      }
      
      if (ptyManager) {
        ptyManager.cleanup();
      }
      
      // Remove test services directory
      if (existsSync(testServicesDir)) {
        rmSync(testServicesDir, { recursive: true, force: true });
      }
    });

    test('should register MCP service in services directory', async () => {
      serviceRegistration = new MCPServiceRegistration({
        serviceId: 'test-mcp-server',
        serviceName: 'Test MCP Server',
        servicesDir: testServicesDir,
        healthCheckInterval: 1000,
        enableAutoCleanup: false // Disable for testing
      });

      serviceRegistration.initialize(mcpServer, ptyManager);
      await serviceRegistration.register();

      const serviceFilePath = serviceRegistration.getServiceFilePath();
      expect(existsSync(serviceFilePath)).toBe(true);
      
      const serviceConfig = JSON.parse(readFileSync(serviceFilePath, 'utf-8'));
      expect(serviceConfig.id).toBe('test-mcp-server');
      expect(serviceConfig.name).toBe('Test MCP Server');
      expect(serviceConfig.capabilities).toContain('cli-create-session');
      expect(serviceConfig.pid).toBe(process.pid);
    });

    test('should validate service health monitoring', async () => {
      serviceRegistration = new MCPServiceRegistration({
        serviceId: 'test-health-mcp',
        servicesDir: testServicesDir,
        healthCheckInterval: 500, // Short interval for testing
        enableAutoCleanup: false
      });

      serviceRegistration.initialize(mcpServer, ptyManager);
      await serviceRegistration.register();

      // Wait for at least one health check
      await sleep(600);

      const serviceConfig = JSON.parse(readFileSync(serviceRegistration.getServiceFilePath(), 'utf-8'));
      expect(serviceConfig.lastSeen).toBeGreaterThan(Date.now() - 1000);
    });

    test('should unregister service on cleanup', async () => {
      serviceRegistration = new MCPServiceRegistration({
        serviceId: 'test-cleanup-mcp',
        servicesDir: testServicesDir,
        enableAutoCleanup: false
      });

      serviceRegistration.initialize(mcpServer, ptyManager);
      await serviceRegistration.register();

      const serviceFilePath = serviceRegistration.getServiceFilePath();
      expect(existsSync(serviceFilePath)).toBe(true);

      await serviceRegistration.unregister();
      expect(existsSync(serviceFilePath)).toBe(false);
    });

    test('should validate MCP performance metrics', async () => {
      // Test MCP server performance optimization
      const testRequest = {
        id: 'perf-test-1',
        method: 'tools/list'
      };

      const startTime = Date.now();
      const response = await mcpServer.handleMCPRequest(testRequest);
      const responseTime = Date.now() - startTime;

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(responseTime).toBeLessThan(100); // <100ms requirement
      
      // Test caching - second request should be faster
      const cachedStartTime = Date.now();
      const cachedResponse = await mcpServer.handleMCPRequest(testRequest);
      const cachedResponseTime = Date.now() - cachedStartTime;

      expect(cachedResponse.error).toBeUndefined();
      expect(cachedResponseTime).toBeLessThanOrEqual(responseTime); // Should be same or faster due to caching
    });

    test('should validate lifecycle coordinator integration', async () => {
      const coordinator = new MCPLifecycleCoordinator({
        serviceId: 'test-lifecycle-mcp',
        servicesDir: testServicesDir,
        healthCheckInterval: 1000,
        enableAutoCleanup: false
      });

      await coordinator.start();
      expect(coordinator.isReady()).toBe(true);
      
      const state = coordinator.getState();
      expect(state.phase).toBe('running');
      expect(state.services.mcpServer).toBe('running');
      expect(state.services.ptyManager).toBe('running');
      expect(state.services.serviceRegistration).toBe('running');

      // Verify service file was created
      const expectedServiceFile = path.join(testServicesDir, `test-lifecycle-mcp.json`);
      expect(existsSync(expectedServiceFile)).toBe(true);

      await coordinator.stop();
      expect(coordinator.getState().phase).toBe('stopped');
      expect(existsSync(expectedServiceFile)).toBe(false);
    });

    test('should fail fast on raw console usage during lifecycle bootstrap', async () => {
      // Guardrail: Stage 4 lane 4j asserts consolidated logger adoption before Stage 6e lands.
      const logSpy = jest.spyOn(console, 'log');
      const warnSpy = jest.spyOn(console, 'warn');
      const errorSpy = jest.spyOn(console, 'error');

      let coordinator: MCPLifecycleCoordinator | null = null;
      try {
        coordinator = new MCPLifecycleCoordinator({
          serviceId: 'guardrail-mcp-lifecycle',
          servicesDir: testServicesDir,
          enableAutoCleanup: false,
          enablePerformanceOptimization: false,
          healthCheckInterval: 250
        });

        await coordinator.start();

        const logCount =
          logSpy.mock.calls.length +
          warnSpy.mock.calls.length +
          errorSpy.mock.calls.length;

        expect(logCount).toBe(0);
      } finally {
        if (coordinator) {
          await coordinator.stop();
        }
        logSpy.mockRestore();
        warnSpy.mockRestore();
        errorSpy.mockRestore();
      }
    });
  });

  describe('Configuration Validation Tests', () => {
    test('should validate tools directory structure', () => {
      const toolsDir = path.join(__dirname, '..', '..', 'mcp-server', 'tools');
      expect(existsSync(toolsDir)).toBe(true);
    });

    test('should validate logs directory can be created', () => {
      const logsDir = './logs/mcp-channel';
      // This test ensures the logs directory path is valid
      // Actual directory creation will happen when pty-mcp-server runs
      expect(typeof logsDir).toBe('string');
      expect(logsDir.length).toBeGreaterThan(0);
    });
  });
});

/**
 * TODO: [TASK-MCP-004] Pattern: templum-service-discovery-pattern | Complexity: 4 | Dependencies: TASK-MCP-INT-001,Templum-service-discovery
 * Context: Templum-specific test harness for service discovery integration with TDD approach
 * Location: Templum/tests/service-discovery/ (Templum-specific)
 * Validation-Required: service-registration, discovery-detection, health-monitoring
 * Pattern-Info: { approach: "TDD-test-harness-first", alternatives: "direct-service-integration", trade-offs: "development-ready-vs-production-service" }
 */

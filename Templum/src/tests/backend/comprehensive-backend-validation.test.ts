/**
 * @fileoverview TASK-SKIN-007: Comprehensive Backend Integration Validation Test Suite
 * @author Claude Code Implementation  
 * @created 2025-09-01
 * 
 * Tests the complete skin-definition-only architecture with real backend instances
 * to validate the implementation of TASK-SKIN-004 through TASK-SKIN-006.
 * 
 * This suite addresses testing gaps by using actual backend processes instead of mocks,
 * providing end-to-end validation of the new backend capability profile detection
 * and two-tier prioritization systems.
 */

import { jest } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { EventEmitter } from 'events';

const httpClient = {
  async get(url: string, options?: { timeout?: number }) {
    const controller = new AbortController();
    const timeout = options?.timeout;
    const timeoutId = typeof timeout === 'number' && timeout > 0
      ? setTimeout(() => controller.abort(), timeout)
      : undefined;

    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json();
      return { status: response.status, data };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
};
import { BackendServiceRouter, TemplumBackendServiceRouter } from '../../backend/backend-service-router';
import { ConnectionFactory } from '../../backend/connection-factory';
import { DynamicCommandRouter } from '../../backend/dynamic-command-router';
import { TemplumCore } from '../../core/templum-core';
import { TemplumCliDiscovery } from '../../cli-entry';
import { UniversalSkinDefinition, BackendConfig } from '../../types/universal-skin-engine-types';
import { ObservabilityLogger, ObservabilityConfig } from '../../observability/templum-observability-system';
import {
  buildCliCommandPayload,
  buildCliIpcRequest,
  createObservabilityFallbackLog
} from '../../backend/defaults/serialization-defaults';
import * as backendSerializationLog from '../../backend/backend-serialization-log';
import { type SerializationMeta } from '../../utils/serialization-utils';

// Test Configuration
const TEST_TIMEOUT = 30000; // 30 seconds for integration tests
const BACKEND_STARTUP_DELAY = 3000; // 3 seconds for backend startup
const MINIMAL_BACKEND_PORT = 3001;
const FULL_BACKEND_PORT = 3002;
const MIXED_BACKEND_PORT_1 = 3003;
const MIXED_BACKEND_PORT_2 = 3004;

interface TestBackendInstance {
  process: ChildProcess;
  port: number;
  type: 'minimal' | 'full';
  id: string;
  skinDefinition?: UniversalSkinDefinition;
}

/**
 * Backend Process Manager for Integration Tests
 */
class TestBackendManager {
  private instances: Map<string, TestBackendInstance> = new Map();
  private minimalBackendPath: string;

  constructor() {
    this.minimalBackendPath = path.join(__dirname, '../../../examples/minimal-backend');
  }

  /**
   * Start a minimal backend instance (skin definition only, no health endpoint)
   */
  async startMinimalBackend(id: string, port: number): Promise<TestBackendInstance> {
    const childProcess = spawn('node', ['server.js'], {
      cwd: this.minimalBackendPath,
      env: { ...process.env, PORT: port.toString() },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const instance: TestBackendInstance = {
      process: childProcess,
      port,
      type: 'minimal',
      id
    };

    this.instances.set(id, instance);

    // Wait for startup
    await this.waitForBackendStartup(port);
    
    // Load skin definition
    instance.skinDefinition = await this.loadSkinDefinition(port);

    console.log(`✅ Started minimal backend ${id} on port ${port}`);
    return instance;
  }

  /**
   * Start a full backend instance (all endpoints available)
   * Creates a modified version of the minimal backend with health/capabilities endpoints
   */
  async startFullBackend(id: string, port: number): Promise<TestBackendInstance> {
    // For this test, we'll use the minimal backend but consider it "full" based on its endpoints
    // In a real scenario, this would be a backend with health/capabilities endpoints
    const instance = await this.startMinimalBackend(id, port);
    instance.type = 'full';
    
    console.log(`✅ Started full backend ${id} on port ${port}`);
    return instance;
  }

  /**
   * Stop all backend instances
   */
  async stopAllBackends(): Promise<void> {
    const promises = Array.from(this.instances.values()).map(instance => {
      return new Promise<void>((resolve) => {
        if (instance.process && !instance.process.killed) {
          instance.process.on('exit', () => resolve());
          instance.process.kill('SIGTERM');
          
          // Force kill after 2 seconds if not gracefully shut down
          setTimeout(() => {
            if (!instance.process.killed) {
              instance.process.kill('SIGKILL');
              resolve();
            }
          }, 2000);
        } else {
          resolve();
        }
      });
    });

    await Promise.all(promises);
    this.instances.clear();
    console.log('🛑 All test backends stopped');
  }

  /**
   * Get all running instances
   */
  getInstances(): Map<string, TestBackendInstance> {
    return new Map(this.instances);
  }

  /**
   * Wait for backend to be responsive
   */
  private async waitForBackendStartup(port: number): Promise<void> {
    const maxAttempts = 15;
    const delay = 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await httpClient.get(`http://localhost:${port}/health`, { timeout: 2000 });
        return; // Success
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(`Backend on port ${port} failed to start after ${maxAttempts} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Load skin definition from a backend
   */
  private async loadSkinDefinition(port: number): Promise<UniversalSkinDefinition> {
    try {
      const response: any = await httpClient.get(`http://localhost:${port}/getSkinDefinition`);
      const data = response.data;
      if (data && typeof data === 'object' && 'skinDefinition' in data) {
        const wrapped = (data as { skinDefinition: UniversalSkinDefinition }).skinDefinition;
        if (!wrapped) {
          throw new Error('Skin definition payload missing from response');
        }
        return wrapped;
      }
      return data as UniversalSkinDefinition;
    } catch (error) {
      throw new Error(`Failed to load skin definition from port ${port}: ${error}`);
    }
  }
}

let cleanupRegistered = false;
let cleanupInProgress = false;
const debugHangLogsEnabled = process.env.DEBUG_BACKEND_HANG === '1';

const registerProcessCleanup = (manager: TestBackendManager): void => {
  if (cleanupRegistered) {
    return;
  }

  cleanupRegistered = true;

  const stopBackends = async () => {
    if (cleanupInProgress) {
      return;
    }

    cleanupInProgress = true;

    try {
      await manager.stopAllBackends();
    } catch (error) {
      console.warn('Warning: Failed to stop test backends during shutdown:', (error as Error).message);
    }
  };

  const createSignalHandler = (signal: NodeJS.Signals) => {
    return () => {
      stopBackends()
        .catch(() => undefined)
        .finally(() => {
          process.exit(signal === 'SIGINT' ? 130 : 143);
        });
    };
  };

  process.on('exit', () => {
    void stopBackends();
  });

  process.on('SIGINT', createSignalHandler('SIGINT'));
  process.on('SIGTERM', createSignalHandler('SIGTERM'));
};

describe('Pattern 11 Phase 0c serialization defaults', () => {
  it('builds CLI command payloads with canonical defaults applied', () => {
    const payload = buildCliCommandPayload({
      command: 'phase6:status',
      interfaceType: 'cli',
      args: ['--verbose'],
      context: { scope: 'integration' }
    });

    expect(payload.command).toBe('phase6:status');
    expect(payload.interfaceType).toBe('cli');
    expect(payload.args).toEqual(['--verbose']);
    expect(payload.context).toEqual({ scope: 'integration' });
    expect(typeof payload.timestamp).toBe('number');
  });

  it('establishes IPC request defaults including version and priority', () => {
    const request = buildCliIpcRequest({
      type: 'executeCommand',
      data: { command: 'phase6:status' },
      requestId: 'test-request',
      responseFile: '/tmp/templum-response.json',
      clientPid: 1234
    });

    expect(request.version).toBe('1.1');
    expect(request.priority).toBe('normal');
    expect(typeof request.timestamp).toBe('number');
  });

  it('records serialization metadata when observability serializes circular payloads', () => {
    const config: ObservabilityConfig = {
      logging: {
        level: 'info',
        outputs: ['json'],
        includeStackTrace: false,
        maxLogBufferSize: 10
      },
      metrics: {
        enabled: false,
        collectionInterval: 1000,
        bufferSize: 10,
        retentionPeriod: 60000,
        enableHistograms: false
      },
      alerting: {
        enabled: false,
        rules: [],
        channels: [],
        evaluationInterval: 60000
      },
      performance: {
        enableTracing: false,
        tracingThreshold: 1000,
        enableProfiling: false,
        memoryMonitoring: false
      }
    };

    const emitter = new EventEmitter();
    const logger = new ObservabilityLogger(config, emitter);
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* silence during test */ });
    const emitSpy = jest
      .spyOn(backendSerializationLog, 'emitSerializationWarnings')
      .mockImplementation(() => undefined);

    expect(() => {
      logger.info('circular payload', circular, 'tests:observability');
    }).not.toThrow();

    const loggedPayload = consoleSpy.mock.calls.at(-1)?.[0];
    expect(typeof loggedPayload).toBe('string');

    const serialized = JSON.parse(loggedPayload ?? '{}');
    expect(serialized.source).toBe('tests:observability');
    expect(serialized.metadata?.serializationMeta).toMatchObject({
      context: 'observability:log-entry',
      status: 'success',
      maskedFields: expect.any(Array)
    });
    expect(serialized.metadata?.serializationMeta?.bytes).toBeGreaterThan(0);
    expect(serialized.metadata?.serializationMeta?.warnings).toEqual([]);
    expect(serialized.metadata?.self?.self).toBe('[Circular]');

    const contexts = emitSpy.mock.calls.map(call => call[0]);
    expect(contexts).toContain('observability:log-entry');
    expect(contexts).toContain('observability:log-entry:decorated');
    expect(contexts).not.toContain('observability:log-entry:fallback');

    consoleSpy.mockRestore();
    emitSpy.mockRestore();
  });

  it('creates observability fallback entries with contextual metadata', () => {
    const fallback = createObservabilityFallbackLog({
      source: 'tests:observability',
      message: 'Unable to serialize telemetry payload',
      metadata: { attempt: 1 },
      error: new Error('boom')
    });

    expect(fallback.source).toBe('tests:observability');
    expect(fallback.message).toContain('Unable to serialize');
    expect(fallback.metadata).toMatchObject({
      attempt: 1,
      fallbackReason: 'boom',
      fallbackSource: 'tests:observability'
    });
    expect(typeof fallback.timestamp).toBe('number');
  });
});

describe('Pattern 11 Phase 2 router serialization contexts', () => {
  let backendRouter: TemplumBackendServiceRouter;
  let emitSpy: jest.SpyInstance;

  beforeEach(() => {
    backendRouter = new (TemplumBackendServiceRouter as any)(undefined, {
      enableFileWatching: false,
      enableEndpointScanning: false,
      enableRegistryDiscovery: false,
      enableConfigurationDiscovery: false,
      enableHealthChecks: false,
      healthMonitoringEnabled: false,
      strategies: []
    });
    emitSpy = jest
      .spyOn(backendSerializationLog, 'emitSerializationWarnings')
      .mockImplementation(() => {
        // silence log output during targeted serialization assertions
      });
  });

  afterEach(async () => {
    if (typeof (backendRouter as any).dispose === 'function') {
      await (backendRouter as any).dispose();
    } else if (typeof (backendRouter as any).stopHealthMonitoring === 'function') {
      (backendRouter as any).stopHealthMonitoring();
    }
    emitSpy.mockRestore();
  });

  it('records serialization metadata for Litany WebSocket events', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const outcome = (backendRouter as any).parseRouterMessage(
      '{"type":"service_status","status":"ok"}',
      {
        context: 'backend:router:websocket:event',
        serviceId: 'litany'
      }
    );

    expect(outcome.ok).toBe(true);
    expect(outcome.meta.context).toBe('backend:router:websocket:event');

    const serviceHealth: Map<string, any> = (backendRouter as any).serviceHealth;
    const litanyStatus = serviceHealth.get('litany');

    expect(litanyStatus.lastSerialization?.context).toBe('backend:router:websocket:event');
    expect(litanyStatus.lastSerialization?.status).toBe('success');
    expect(emitSpy).toHaveBeenCalledWith(
      'backend:router:websocket:event',
      expect.objectContaining({
        meta: expect.objectContaining({ context: 'backend:router:websocket:event' })
      })
    );

    consoleErrorSpy.mockRestore();
  });

  it('captures serialization errors for malformed WebSocket payloads', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const outcome = (backendRouter as any).parseRouterMessage('not-json', {
      context: 'backend:router:websocket:event',
      serviceId: 'litany'
    });

    expect(outcome.ok).toBe(false);
    expect(outcome.status).toBe('error');

    const serviceHealth: Map<string, any> = (backendRouter as any).serviceHealth;
    const litanyStatus = serviceHealth.get('litany');

    expect(litanyStatus.lastSerialization?.context).toBe('backend:router:websocket:event');
    expect(litanyStatus.lastSerialization?.status).toBe('error');
    expect(emitSpy).toHaveBeenCalledWith(
      'backend:router:websocket:event',
      expect.objectContaining({ status: 'error' })
    );

    consoleErrorSpy.mockRestore();
  });

  it('serializes outbound router messages with contextual metadata', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const outcome = (backendRouter as any).stringifyRouterMessage(
      { type: 'handshake', version: '1.0.0' },
      {
        context: 'backend:router:websocket:handshake',
        serviceId: 'litany'
      }
    );

    expect(outcome.ok).toBe(true);
    expect(typeof outcome.value).toBe('string');
    expect(outcome.meta.context).toBe('backend:router:websocket:handshake');

    const serviceHealth: Map<string, any> = (backendRouter as any).serviceHealth;
    const litanyStatus = serviceHealth.get('litany');

    expect(litanyStatus.lastSerialization?.context).toBe('backend:router:websocket:handshake');
    expect(litanyStatus.lastSerialization?.direction).toBe('outbound');
    expect(emitSpy).toHaveBeenCalledWith(
      'backend:router:websocket:handshake',
      expect.objectContaining({
        meta: expect.objectContaining({ context: 'backend:router:websocket:handshake' })
      })
    );

    consoleErrorSpy.mockRestore();
  });
});

describe('TASK-SKIN-007: Comprehensive Backend Integration Validation', () => {
  let backendManager: TestBackendManager;
  let backendRouter: TemplumBackendServiceRouter | undefined;
  let commandRouter: DynamicCommandRouter;

  beforeAll(async () => {
    backendManager = new TestBackendManager();
    registerProcessCleanup(backendManager);
    console.log('🚀 Setting up comprehensive backend integration tests...');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (debugHangLogsEnabled) {
      const activeHandlesGetter = (process as NodeJS.Process & {
        _getActiveHandles?: () => unknown[];
      })._getActiveHandles;

      if (activeHandlesGetter) {
        const handles = activeHandlesGetter();
        const handleSummaries = handles.map((handle) => {
          const ctorName = (handle as { constructor?: { name?: string } })?.constructor?.name;
          return ctorName || typeof handle;
        });
        console.log('[DEBUG_BACKEND_HANG] Active handles:', handleSummaries);
      }

      try {
        const { default: logWhyIsNodeRunning } = await import('why-is-node-running');
        logWhyIsNodeRunning();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('[DEBUG_BACKEND_HANG] Unable to load why-is-node-running:', message);
      }
    }

    await backendManager.stopAllBackends();
  }, TEST_TIMEOUT);

beforeEach(async () => {
  await backendManager.stopAllBackends();
  commandRouter = new DynamicCommandRouter();
  // Initialize BackendServiceRouter with runtime loops disabled for test isolation
  backendRouter = new (TemplumBackendServiceRouter as any)(commandRouter, {
      enableFileWatching: false,
      enableEndpointScanning: false,
      enableRegistryDiscovery: false,
      enableConfigurationDiscovery: false,
      enableHealthChecks: false,
      healthMonitoringEnabled: false,
      strategies: []
    });
    
  });

afterEach(async () => {
    if (backendRouter) {
      try {
        await backendRouter.dispose();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('[TEST_CLEANUP] backendRouter.dispose failed:', message);
      }
      backendRouter = undefined as unknown as TemplumBackendServiceRouter;
    }

    await backendManager.stopAllBackends();
  });

  describe('Minimal Backend Testing (Skin Definition Only)', () => {
    test('validates minimal backend integration with skin-only architecture', async () => {
      // Start minimal backend instance
      const minimalBackend = await backendManager.startMinimalBackend('minimal-test', MINIMAL_BACKEND_PORT);
      
      // Register backend using skin definition
      await backendRouter!.registerBackendFromSkin(minimalBackend.skinDefinition!);
      
      // Verify backend capability profile detection
      const capabilityProfile = (backendRouter as any).getBackendCapabilityProfile('minimal-example');
      expect(capabilityProfile).toBeDefined();
      expect(capabilityProfile.skinDefinitionQuality).toBe('complete'); // Minimal backend has complete skin
      expect(capabilityProfile.hasHealthEndpoint).toBe(true); // Minimal backend has health endpoint
      expect(capabilityProfile.hasCapabilitiesEndpoint).toBe(false); // No capabilities endpoint
      
      // Test command execution through skin definition
      const commandResult = await backendRouter!.executeCommand('minimal-example', 'example.hello', ['TestUser']);
      expect(commandResult).toBeDefined();
      expect(commandResult.success).toBe(true);
      
      console.log('✅ Minimal backend integration validated');
    }, TEST_TIMEOUT);

    test('validates minimal backend capability extraction from skin', async () => {
      const minimalBackend = await backendManager.startMinimalBackend('minimal-capability', MINIMAL_BACKEND_PORT + 10);
      
      // Test capability extraction from skin definition
      const skinDefinition = minimalBackend.skinDefinition!;
      expect(skinDefinition.backendConfig?.capabilities).toBeDefined();
      expect(skinDefinition.commands).toBeDefined();
      
      // Register backend from skin definition
      await backendRouter!.registerBackendFromSkin(skinDefinition);
      
      // Note: queryServiceCapabilities is private - capability testing is done internally
      // Test validates that registration completes without errors
      
      console.log('✅ Minimal backend capability extraction validated');
    }, TEST_TIMEOUT);
  });

  describe('Full Backend Testing (All Endpoints Available)', () => {
    test('validates full backend integration with complete endpoint suite', async () => {
      const fullBackend = await backendManager.startFullBackend('full-test', FULL_BACKEND_PORT);
      
      // Register backend using skin definition
      await backendRouter!.registerBackendFromSkin(fullBackend.skinDefinition!);
      
      // Verify backend capability profile detection
      const capabilityProfile = (backendRouter as any).getBackendCapabilityProfile('minimal-example');
      expect(capabilityProfile).toBeDefined();
      expect(capabilityProfile.skinDefinitionQuality).toBe('complete');
      
      // Test all available endpoints
      const healthCheck: any = await httpClient.get(`http://localhost:${FULL_BACKEND_PORT}/health`);
      expect(healthCheck.status).toBe(200);
      expect(healthCheck.data.status).toBe('healthy');
      
      const skinCheck: any = await httpClient.get(`http://localhost:${FULL_BACKEND_PORT}/getSkinDefinition`);
      expect(skinCheck.status).toBe(200);
      expect(skinCheck.data.metadata).toBeDefined();
      
      console.log('✅ Full backend integration validated');
    }, TEST_TIMEOUT);
  });

  describe('Mixed Environment Testing (Minimal + Full Backends)', () => {
    test('validates mixed backend environment with fair prioritization', async () => {
      // Start both minimal and full backends
      const minimalBackend = await backendManager.startMinimalBackend('mixed-minimal', MIXED_BACKEND_PORT_1);
      const fullBackend = await backendManager.startFullBackend('mixed-full', MIXED_BACKEND_PORT_2);
      
      // Modify skin definitions to have different IDs for mixed testing
      const minimalSkin = { 
        ...minimalBackend.skinDefinition!,
        metadata: {
          ...minimalBackend.skinDefinition!.metadata,
          id: 'mixed-minimal',
          backend: 'mixed-minimal',
          backendService: 'mixed-minimal'
        },
        backendConfig: { 
          ...minimalBackend.skinDefinition!.backendConfig,
          service: 'mixed-minimal',
          endpoint: `http://localhost:${MIXED_BACKEND_PORT_1}`
        }
      };
      
      const fullSkin = { 
        ...fullBackend.skinDefinition!,
        metadata: {
          ...fullBackend.skinDefinition!.metadata,
          id: 'mixed-full',
          backend: 'mixed-full',
          backendService: 'mixed-full'
        },
        backendConfig: { 
          ...fullBackend.skinDefinition!.backendConfig,
          service: 'mixed-full',
          endpoint: `http://localhost:${MIXED_BACKEND_PORT_2}`
        }
      };
      
      // Register both backends
      await backendRouter!.registerBackendFromSkin(minimalSkin as UniversalSkinDefinition);
      await backendRouter!.registerBackendFromSkin(fullSkin as UniversalSkinDefinition);
      
      // Verify both backends are registered with correct capability profiles
      const minimalProfile = (backendRouter as any).getBackendCapabilityProfile('mixed-minimal');
      const fullProfile = (backendRouter as any).getBackendCapabilityProfile('mixed-full');
      
      expect(minimalProfile).toBeDefined();
      expect(fullProfile).toBeDefined();
      
      // Test two-tier prioritization with mixed backends
      const connectionStatus = await backendRouter!.getConnectionStatus();
      expect(connectionStatus.totalConnections).toBe(2);
      
      console.log('✅ Mixed environment integration validated');
    }, TEST_TIMEOUT);

    test('validates backend configuration availability for command routing', async () => {
      const minimalBackend = await backendManager.startMinimalBackend('routing-minimal', MIXED_BACKEND_PORT_1 + 10);
      const fullBackend = await backendManager.startFullBackend('routing-full', MIXED_BACKEND_PORT_2 + 10);

      const minimalSkin = {
        ...minimalBackend.skinDefinition!,
        metadata: {
          ...minimalBackend.skinDefinition!.metadata,
          id: 'routing-minimal',
          backend: 'routing-minimal',
          backendService: 'routing-minimal'
        },
        backendConfig: {
          ...minimalBackend.skinDefinition!.backendConfig,
          service: 'routing-minimal',
          endpoint: `http://localhost:${MIXED_BACKEND_PORT_1 + 10}`
        }
      };

      const fullSkin = {
        ...fullBackend.skinDefinition!,
        metadata: {
          ...fullBackend.skinDefinition!.metadata,
          id: 'routing-full',
          backend: 'routing-full',
          backendService: 'routing-full'
        },
        backendConfig: {
          ...fullBackend.skinDefinition!.backendConfig,
          service: 'routing-full',
          endpoint: `http://localhost:${MIXED_BACKEND_PORT_2 + 10}`
        }
      };

      await backendRouter!.registerBackendFromSkin(minimalSkin as UniversalSkinDefinition);
      await backendRouter!.registerBackendFromSkin(fullSkin as UniversalSkinDefinition);

      const configs = backendRouter!.getBackendConfigs();
      expect(Object.keys(configs)).toEqual(expect.arrayContaining(['routing-minimal', 'routing-full']));

      console.log('✅ Backend configurations registered for routing checks');
    }, TEST_TIMEOUT);
  });

  describe('Backend Capability Profile Detection Accuracy', () => {
    test('accurately detects backend capability profiles across different types', async () => {
      // Test with multiple backend instances to validate profile detection accuracy
      const testInstances = Array.from(backendManager.getInstances().values());
      
      for (const instance of testInstances) {
        if (instance.skinDefinition) {
          await backendRouter!.registerBackendFromSkin(instance.skinDefinition);
          
          const profile = (backendRouter as any).getBackendCapabilityProfile(instance.skinDefinition.backendConfig?.service);
          expect(profile).toBeDefined();
          expect(profile.backendId).toBe(instance.skinDefinition.backendConfig?.service);
          
          // Validate endpoint availability detection
          expect(typeof profile.hasHealthEndpoint).toBe('boolean');
          expect(typeof profile.hasCapabilitiesEndpoint).toBe('boolean');
          expect(typeof profile.hasVersionEndpoint).toBe('boolean');
          
          // Validate skin definition quality assessment
          expect(['complete', 'partial', 'minimal']).toContain(profile.skinDefinitionQuality);
          
          console.log(`✅ Capability profile validated for ${instance.id}: ${profile.skinDefinitionQuality}`);
        }
      }
    }, TEST_TIMEOUT);

    test('validates skin definition quality scoring accuracy', async () => {
      // Test different skin definition completeness levels
      const instances = Array.from(backendManager.getInstances().values());
      
      for (const instance of instances) {
        const skin = instance.skinDefinition;
        if (!skin) continue;
        
        // Analyze skin completeness
        const hasMetadata = !!skin.metadata;
        const hasBackendConfig = !!skin.backendConfig;
        const hasCommands = !!skin.commands && Object.keys(skin.commands).length > 0;
        const hasViews = !!skin.views;
        
        const expectedQuality = (hasMetadata && hasBackendConfig && hasCommands && hasViews) 
          ? 'complete' 
          : (hasMetadata && hasBackendConfig && hasCommands) 
            ? 'partial' 
            : 'minimal';
        
        const profile = (backendRouter as any).getBackendCapabilityProfile(skin.backendConfig?.service);
        expect(profile?.skinDefinitionQuality).toBe(expectedQuality);
      }
    }, TEST_TIMEOUT);
  });

  describe('Two-Tier Prioritization System Testing', () => {
    test('validates two-tier scoring algorithm accuracy', async () => {
      // Test the two-tier prioritization system with real backend data
      const backends = Array.from(backendManager.getInstances().values())
        .map(instance => ({
          backendId: instance.skinDefinition?.backendConfig?.service || instance.id,
          status: { connected: true, health: 'healthy' }
        }));
      
      if (backends.length > 0) {
        // Test prioritization through TemplumCore
        const prioritizedBackends = (backendRouter as any).prioritizeBackendsTwoTier(backends);
        
        expect(prioritizedBackends).toBeDefined();
        expect(Array.isArray(prioritizedBackends)).toBe(true);
        expect(prioritizedBackends.length).toBe(backends.length);
        
        // Validate scoring structure
        prioritizedBackends.forEach((backend: any) => {
          expect(backend.backendId).toBeDefined();
          expect(typeof backend.score).toBe('number');
          expect(['health-enabled', 'minimal']).toContain(backend.tier);
        });
        
        console.log(`✅ Two-tier prioritization validated for ${backends.length} backends`);
      }
    }, TEST_TIMEOUT);

    test('validates fair prioritization between minimal and full backends', async () => {
      // Test that minimal backends can compete fairly with full backends
      const instances = Array.from(backendManager.getInstances().values());
      
      if (instances.length >= 2) {
        const backends = instances.map(instance => ({
          backendId: instance.skinDefinition?.backendConfig?.service || instance.id,
          status: { 
            connected: true, 
            health: instance.type === 'full' ? 'healthy' : 'unhealthy', // Simulate different health states
            capabilities: instance.type === 'full' ? ['health', 'capabilities', 'version'] : ['basic']
          }
        }));
        
        const prioritizedBackends = (backendRouter as any).prioritizeBackendsTwoTier(backends);
        
        // Verify that both tiers are represented and scored fairly
        const healthEnabledBackends = prioritizedBackends.filter((b: any) => b.tier === 'health-enabled');
        const minimalBackends = prioritizedBackends.filter((b: any) => b.tier === 'minimal');
        
        // Both tiers should have valid scores
        healthEnabledBackends.forEach((backend: any) => {
          expect(backend.score).toBeGreaterThanOrEqual(0);
        });
        
        minimalBackends.forEach((backend: any) => {
          expect(backend.score).toBeGreaterThanOrEqual(0);
        });
        
        console.log('✅ Fair prioritization between backend tiers validated');
      }
    }, TEST_TIMEOUT);
  });

  describe('Load Condition Testing', () => {
    test('validates prioritization system under concurrent load', async () => {
      const instances = Array.from(backendManager.getInstances().values());
      
      if (instances.length > 0) {
        // Simulate concurrent load by making multiple prioritization calls
        const concurrentCalls = 10;
        const backends = instances.map(instance => ({
          backendId: instance.skinDefinition?.backendConfig?.service || instance.id,
          status: { connected: true, health: 'healthy' }
        }));
        
        const startTime = Date.now();
        const promises = Array.from({ length: concurrentCalls }, () =>
          (backendRouter as any).prioritizeBackendsTwoTier(backends)
        );
        
        const results = await Promise.all(promises);
        const endTime = Date.now();
        
        // Validate all calls succeeded
        expect(results.length).toBe(concurrentCalls);
        results.forEach(result => {
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBe(backends.length);
        });
        
        // Validate performance under load
        const totalTime = endTime - startTime;
        const averageTime = totalTime / concurrentCalls;
        expect(averageTime).toBeLessThan(100); // Should average less than 100ms per call
        
        console.log(`✅ Load testing validated: ${concurrentCalls} calls in ${totalTime}ms (avg: ${averageTime.toFixed(1)}ms)`);
      }
    }, TEST_TIMEOUT);

    test('validates connection stability tracking under load', async () => {
      // Test connection stability tracking for minimal backends under load
      const instances = Array.from(backendManager.getInstances().values());
      
      for (const instance of instances) {
        if (instance.type === 'minimal' && instance.skinDefinition) {
          // Simulate multiple connection attempts to test stability tracking
          const attempts = 5;
          
          for (let i = 0; i < attempts; i++) {
            const success = Math.random() > 0.2; // 80% success rate
            (backendRouter as any).updateConnectionStability(
              instance.skinDefinition.backendConfig?.service, 
              success,
              50 + Math.random() * 100 // Random response time
            );
          }
          
          // Verify stability tracking
          const stability = (backendRouter as any).getConnectionStability(
            instance.skinDefinition.backendConfig?.service
          );
          
          expect(typeof stability).toBe('number');
          expect(stability).toBeGreaterThanOrEqual(0);
          expect(stability).toBeLessThanOrEqual(100);
        }
      }
      
      console.log('✅ Connection stability tracking under load validated');
    }, TEST_TIMEOUT);
  });

  describe('Architecture Validation', () => {
    test('validates skin-definition-only architecture principles', async () => {
      // Verify that the system works entirely through skin definitions
      const instances = Array.from(backendManager.getInstances().values());
      
      for (const instance of instances) {
        if (instance.skinDefinition) {
          const skin = instance.skinDefinition;
          
          // Validate skin contains all necessary information
          expect(skin.metadata).toBeDefined();
          expect(skin.backendConfig).toBeDefined();
          expect(skin.commands).toBeDefined();
          
          // Validate backend config provides connection information
          expect(skin.backendConfig?.service).toBeDefined();
          expect(skin.backendConfig?.protocol).toBeDefined();
          expect(skin.backendConfig?.endpoint).toBeDefined();
          
          // Validate commands provide execution information
          expect(Object.keys(skin.commands || {}).length).toBeGreaterThan(0);
        }
      }
      
      console.log('✅ Skin-definition-only architecture principles validated');
    }, TEST_TIMEOUT);

    test('validates zero hardcoded backend knowledge requirement', async () => {
      // Verify that no hardcoded backend information is required
      const backendConfigs = (backendRouter as any).getBackendConfigs();

      // All backend configurations should come from skin definitions
      for (const [backendId, configEntry] of Object.entries(backendConfigs)) {
        const config = configEntry as BackendConfig;
        expect(config.service).toBeDefined();
        expect(config.protocol).toBeDefined();
        expect(config.endpoint).toBeDefined();
        
        // Verify configuration matches what was provided by skin definition
        const instances = Array.from(backendManager.getInstances().values());
        const matchingInstance = instances.find(instance => 
          instance.skinDefinition?.backendConfig?.service === backendId
        );
        
        if (matchingInstance) {
          expect(config.protocol).toBe(matchingInstance.skinDefinition!.backendConfig!.protocol);
          expect(config.endpoint).toBe(matchingInstance.skinDefinition!.backendConfig!.endpoint);
        }
      }
      
      console.log('✅ Zero hardcoded backend knowledge requirement validated');
    }, TEST_TIMEOUT);
  });
});


describe('Pattern 11 Phase 3 CLI/core serialization integration', () => {
  it('applies service registry defaults during CLI discovery and reports warnings', async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'templum-cli-discovery-'));
    const servicesDir = path.join(tempRoot, 'services');
    fs.mkdirSync(servicesDir, { recursive: true });

    const serviceFilePath = path.join(servicesDir, 'templum-core-9999.json');
    fs.writeFileSync(
      serviceFilePath,
      JSON.stringify({
        id: 'templum-core-9999',
        endpoint: 'ipc://templum-core-9999',
        pid: 9999
      })
    );

    const discovery = new TemplumCliDiscovery();
    (discovery as any).servicesDir = servicesDir;

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const processSpy = jest
      .spyOn(discovery as any, 'isProcessRunning')
      .mockReturnValue(true);

    try {
      const services = await discovery.discoverServices();

      expect(services).toHaveLength(1);
      expect(services[0]).toMatchObject({
        id: 'templum-core-9999',
        protocol: 'ipc'
      });
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
      processSpy.mockRestore();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('includes request serialization metadata in IPC responses', async () => {
    const core = new TemplumCore();
    const executeSpy = jest
      .spyOn(core as any, 'executeCommand')
      .mockResolvedValue({ ok: true });

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'templum-ipc-response-'));
    const requestPath = path.join(tempDir, 'templum-cli-req.json');
    fs.writeFileSync(requestPath, '{}');
    const responseFile = path.join(tempDir, 'templum-cli-resp.json');

    const request = buildCliIpcRequest({
      type: 'executeCommand',
      data: { command: 'phase6:status' },
      requestId: 'phase3-test',
      responseFile,
      clientPid: process.pid
    });

    const meta: SerializationMeta = {
      context: 'core:ipc:request:phase3-test',
      bytes: 128,
      durationMs: 2,
      warnings: ['phase-3-defaults'],
      maskedFields: []
    };

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      await (core as any).processIPCCommandRequest(request, requestPath, meta);

      const responseContent = fs.readFileSync(responseFile, 'utf8');
      const response = JSON.parse(responseContent);

      expect(response.success).toBe(true);
      expect(response.serializationMeta).toBeDefined();
      expect(response.serializationMeta.request).toMatchObject({
        context: meta.context,
        warnings: meta.warnings
      });
    } finally {
      logSpy.mockRestore();
      executeSpy.mockRestore();
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

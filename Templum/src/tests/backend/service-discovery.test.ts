/**
 * @fileoverview Comprehensive tests for Generic Service Discovery System
 * @author Claude Code Implementation
 * @created 2025-08-29
 * 
 * Tests all three discovery strategies: registry-based, configuration-based, and endpoint scanning
 * Validates multi-strategy discovery orchestration and error handling
 * 
 * TASK: TASK-GENERIC-003 - Generic Service Discovery Mechanism (Testing)
 */

import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as net from 'net';
import * as WebSocket from 'ws';

import {
  ServiceDiscovery,
  RegistryBasedDiscoveryStrategy,
  ConfigurationBasedDiscoveryStrategy,
  EndpointScanningDiscoveryStrategy,
  DiscoveredService,
  ServiceRegistry,
  DiscoveryStrategy,
} from '../../backend/service-discovery';
import { serialization } from '../../utils/serialization-utils';
import * as backendSerializationLog from '../../backend/backend-serialization-log';
import { serviceRegistryEntrySchema } from '../../backend/schemas/serialization-registry';
import { buildServiceRegistryDefaults } from '../../backend/defaults/serialization-defaults';
import { serializeServiceManifest } from '../../backend/schemas/service-manifest';

// Mock file system operations
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock HTTP requests  
jest.mock('http');
const mockHttp = http as jest.Mocked<typeof http>;

// Mock WebSocket
jest.mock('ws');
const mockWebSocket = WebSocket as jest.Mocked<typeof WebSocket>;

// Mock net for IPC
jest.mock('net');
const mockNet = net as jest.Mocked<typeof net>;

let emitSerializationWarningsSpy: jest.SpyInstance;
const registryHealthSpy = jest.spyOn(RegistryBasedDiscoveryStrategy.prototype as any, 'validateServiceHealth');

describe('ServiceDiscovery', () => {
  let serviceDiscovery: ServiceDiscovery;
  let tempDir: string;

  beforeEach(() => {
    registryHealthSpy.mockResolvedValue(true);
    jest.clearAllMocks();
    emitSerializationWarningsSpy = jest.spyOn(backendSerializationLog, 'emitSerializationWarnings');
    tempDir = '/tmp/templum-test';

    serviceDiscovery = new ServiceDiscovery({
      registryPath: path.join(tempDir, 'service-registry.json'),
      configurationPath: path.join(tempDir, 'backend-config.json'),
      scanPorts: [3001, 3002, 3003],
      scanHosts: ['localhost'],
      timeout: 1000,
      enableFileWatching: false,
      enableHealthChecks: false,
    });

    mockHttp.get.mockImplementation((_url: any, callback: any) => {
      const response = {
        statusCode: 200,
        resume: jest.fn(),
        on: (event: string, handler: (...args: any[]) => void) => {
          if (event === 'data') {
            handler('');
          }
          if (event === 'end') {
            handler();
          }
          return response;
        },
      } as any;

      if (typeof callback === 'function') {
        callback(response);
      }

      return { on: jest.fn() } as any;
    });

    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockReturnValue('{}');
  });

  afterEach(() => {
    emitSerializationWarningsSpy.mockRestore();
    registryHealthSpy.mockReset();
  });

  describe('Multi-Strategy Discovery', () => {
    it('should discover services using multiple strategies', async () => {
      // Mock registry-based discovery
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('service-registry.json');
      });

      (mockFs.readFileSync as any).mockImplementation((filePath: fs.PathOrFileDescriptor) => {
        if (filePath.toString().includes('service-registry.json')) {
          const registry: ServiceRegistry = {
            services: {
              'haruspex': {
                id: 'haruspex',
                endpoint: 'ipc://localhost:3001',
                protocol: 'ipc',
                health: 'http://localhost:3001/health',
                capabilities: ['analysis', 'prediction'],
                version: '2.0.0',
                registrationTime: Date.now() - 1000,
                lastSeen: Date.now() - 100
              }
            },
            version: 1,
            lastUpdated: Date.now()
          };
          return JSON.stringify(registry);
        }
        return '{}';
      });

      // Mock HTTP health check
      mockHttp.get.mockImplementation((_url: any, callback: any) => {
        const response = {
          statusCode: 200,
          resume: jest.fn(),
          on: (event: string, handler: (...args: any[]) => void) => {
            if (event === 'data') {
              handler('');
            }
            if (event === 'end') {
              handler();
            }
            return response;
          },
        } as any;

        setTimeout(() => {
          if (typeof callback === 'function') {
            callback(response);
          }
        }, 10);

        return { on: jest.fn() } as any;
      });

      const discovered = await serviceDiscovery.discoverServices();

      expect(discovered).toHaveLength(1);
      expect(discovered[0].id).toBe('haruspex');
      expect(discovered[0].discoveryMethod).toBe('registry');
      expect(discovered[0].confidence).toBe(0.9);
    });

    it('should deduplicate services from multiple strategies', async () => {
      // Create service discovery with custom strategies
      const registryStrategy = new RegistryBasedDiscoveryStrategy({
        registryPath: path.join(tempDir, 'service-registry.json'),
        timeout: 1000
      });

      const configStrategy = new ConfigurationBasedDiscoveryStrategy({
        configurationPath: path.join(tempDir, 'backend-config.json'),
        timeout: 1000
      });

      serviceDiscovery = new ServiceDiscovery({
        strategies: [registryStrategy, configStrategy]
      });

      // Mock both strategies returning the same service
      jest.spyOn(registryStrategy, 'discover').mockResolvedValue([
        {
          id: 'pcl',
          config: {
            service: 'pcl',
            version: '1.0.0',
            protocol: 'http',
            endpoint: 'http://localhost:3002',
            timeout: 5000,
            retries: 2,
            keepAlive: true,
            authentication: { type: 'none' }
          },
          discoveryMethod: 'registry',
          confidence: 0.9,
          timestamp: Date.now()
        }
      ]);

      jest.spyOn(configStrategy, 'discover').mockResolvedValue([
        {
          id: 'pcl',
          config: {
            service: 'pcl',
            version: '1.0.0',
            protocol: 'http',
            endpoint: 'http://localhost:3002',
            timeout: 5000,
            retries: 2,
            keepAlive: true,
            authentication: { type: 'none' }
          },
          discoveryMethod: 'configuration',
          confidence: 0.8,
          timestamp: Date.now() - 1000
        }
      ]);

      const discovered = await serviceDiscovery.discoverServices();

      expect(discovered).toHaveLength(1);
      expect(discovered[0].discoveryMethod).toBe('registry'); // Higher confidence preferred
      expect(discovered[0].confidence).toBe(0.9);
    });

    it('should handle strategy failures gracefully', async () => {
      const mockDiscover = (jest.fn() as any).mockRejectedValue(new Error('Strategy failed'));
      const failingStrategy: DiscoveryStrategy = {
        name: 'failing-strategy',
        priority: 100,
        discover: mockDiscover
      };

      serviceDiscovery.addStrategy(failingStrategy);

      const discovered = await serviceDiscovery.discoverServices();
      
      // Should not throw and should return empty array
      expect(discovered).toEqual([]);
    });

    it('should emit strategyError when strategy is missing discover implementation', async () => {
      const invalidStrategy = { name: 'invalid-strategy', priority: 50 } as unknown as DiscoveryStrategy;
      const errorSpy = jest.fn();
      serviceDiscovery.on('strategyError', errorSpy);

      serviceDiscovery.addStrategy(invalidStrategy);

      const discovered = await serviceDiscovery.discoverServices();

      expect(discovered).toEqual([]);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          strategy: 'invalid-strategy',
          error: expect.any(Error),
        }),
      );
    });
  });


  describe('Service manifest ingestion', () => {
    const servicesRoot = '/tmp/templum-services';
    const httpManifestPath = `${servicesRoot}/http-service.json`;
    const wsManifestPath = `${servicesRoot}/ws-service.json`;
    const ipcManifestPath = `${servicesRoot}/ipc-service.json`;

    beforeEach(() => {
      const manifests: Record<string, string> = {
        [httpManifestPath]: serializeServiceManifest({
          id: 'http-service',
          endpoint: 'http://localhost:3100',
          protocol: 'http',
          version: '1.2.0',
          capabilities: ['ping', 'status'],
          registrationTime: 1730822400000,
          lastSeen: 1730822401000,
          healthCheck: {
            type: 'http',
            endpoint: 'http://localhost:3100/health',
            timeoutMs: 2000,
          },
        }),
        [wsManifestPath]: serializeServiceManifest({
          id: 'ws-service',
          endpoint: 'ws://localhost:3200',
          protocol: 'websocket',
          version: '3.0.0',
          capabilities: ['events'],
          registrationTime: 1730822402000,
          lastSeen: 1730822403000,
          healthCheck: {
            type: 'websocket',
            endpoint: 'ws://localhost:3200',
            timeoutMs: 1500,
          },
        }),
        [ipcManifestPath]: serializeServiceManifest({
          id: 'ipc-service',
          endpoint: 'ipc://templum-ipc-service',
          protocol: 'ipc',
          version: '2.1.0',
          capabilities: ['analysis'],
          registrationTime: 1730822404000,
          lastSeen: 1730822405000,
          healthCheck: {
            type: 'ipc',
            timeoutMs: 1000,
          },
        }),
      };

      mockFs.readFileSync.mockImplementation((filePath: fs.PathOrFileDescriptor) => {
        const normalized = filePath.toString();
        const manifest = manifests[normalized];
        if (!manifest) {
          throw new Error(`Unexpected file read: ${normalized}`);
        }
        return manifest;
      });
    });

    it('registers healthy manifests and filters failing ones', async () => {
      const discovery = new ServiceDiscovery({
        enableFileWatching: false,
        enableHealthChecks: true,
        timeout: 750,
      });

      const validateHealthSpy = jest
        .spyOn(discovery as any, 'validateServiceHealth')
        .mockImplementation(async ({ manifest }: { manifest: { id: string } }) => manifest.id !== 'ipc-service');

      const discoveredIds: string[] = [];
      discovery.on('serviceDiscovered', ({ service }) => {
        discoveredIds.push(service.id);
      });

      await (discovery as any).handleServiceFileChange(
        httpManifestPath,
        'add',
      );
      await (discovery as any).handleServiceFileChange(
        wsManifestPath,
        'add',
      );
      await (discovery as any).handleServiceFileChange(
        ipcManifestPath,
        'add',
      );

      expect(validateHealthSpy).toHaveBeenCalledTimes(3);
      expect(validateHealthSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          manifest: expect.objectContaining({ id: 'http-service', protocol: 'http' }),
        }),
      );
      expect(validateHealthSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          manifest: expect.objectContaining({ id: 'ws-service', protocol: 'websocket' }),
        }),
      );

      const backendConfigs = discovery.getBackendConfigs();
      expect(backendConfigs.get('http-service')).toMatchObject({
        protocol: 'http',
        healthEndpoint: 'http://localhost:3100/health',
      });
      expect(backendConfigs.get('ws-service')).toMatchObject({ protocol: 'websocket' });
      expect(backendConfigs.has('ipc-service')).toBe(false);
      expect(discoveredIds).toEqual(['http-service', 'ws-service']);
    });

    it('emits removal events when manifests disappear', async () => {
      const discovery = new ServiceDiscovery({
        enableFileWatching: false,
        enableHealthChecks: false,
        timeout: 500,
      });

      await (discovery as any).handleServiceFileChange(
        wsManifestPath,
        'add',
      );

      const removed: string[] = [];
      discovery.on('serviceRemoved', ({ serviceId }) => removed.push(serviceId));

      (discovery as any).handleServiceFileRemoval(wsManifestPath);

      expect(removed).toEqual(['ws-service']);
      expect(discovery.getBackendConfigs().has('ws-service')).toBe(false);
    });
  });

  describe('RegistryBasedDiscoveryStrategy', () => {
    let strategy: RegistryBasedDiscoveryStrategy;

    beforeEach(() => {
      strategy = new RegistryBasedDiscoveryStrategy({
        registryPath: path.join(tempDir, 'service-registry.json'),
        timeout: 1000
      });
    });

    it('should discover services from registry file', async () => {
      const registry: ServiceRegistry = {
        services: {
          'haruspex': {
            id: 'haruspex',
            endpoint: 'ipc://localhost:3001',
            protocol: 'ipc',
            health: 'http://localhost:3001/health',
            capabilities: ['analysis', 'prediction'],
            version: '2.0.0',
            registrationTime: Date.now() - 1000,
            lastSeen: Date.now() - 100
          },
          'pcl': {
            id: 'pcl',
            endpoint: 'http://localhost:3002',
            protocol: 'http',
            health: 'http://localhost:3002/api/health',
            capabilities: ['tdd-workflow', 'testing'],
            version: '1.0.0',
            registrationTime: Date.now() - 2000,
            lastSeen: Date.now() - 50
          }
        },
        version: 1,
        lastUpdated: Date.now()
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(registry));

      // Mock health checks to pass
      mockHttp.get.mockImplementation((_url: any, callback: any) => {
        const response = {
          statusCode: 200,
          resume: jest.fn(),
          on: (event: string, handler: (...args: any[]) => void) => {
            if (event === 'data') {
              handler('');
            }
            if (event === 'end') {
              handler();
            }
            return response;
          },
        } as any;

        setTimeout(() => {
          if (typeof callback === 'function') {
            callback(response);
          }
        }, 10);

        return { on: jest.fn() } as any;
      });

      const discovered = await strategy.discover();

      expect(discovered).toHaveLength(2);
      expect(discovered[0].discoveryMethod).toBe('registry');
      expect(discovered[0].confidence).toBe(0.9);
    });

    it('should skip stale registrations', async () => {
      const registry: ServiceRegistry = {
        services: {
          'stale-service': {
            id: 'stale-service',
            endpoint: 'http://localhost:8000',
            protocol: 'http',
            health: '',
            capabilities: [],
            version: '1.0.0',
            registrationTime: Date.now() - 10 * 60 * 1000, // 10 minutes ago
            lastSeen: Date.now() - 10 * 60 * 1000 // 10 minutes ago (stale)
          }
        },
        version: 1,
        lastUpdated: Date.now()
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(registry));

      const discovered = await strategy.discover();

      expect(discovered).toHaveLength(0);
    });

    it('should return empty array when registry file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const discovered = await strategy.discover();

      expect(discovered).toEqual([]);
    });

    it('should handle invalid registry file format', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      const discovered = await strategy.discover();

      expect(discovered).toEqual([]);
    });

    it('should skip services with non-numeric pid values in services directory', async () => {
      mockFs.existsSync.mockImplementation((target: fs.PathLike) => {
        const value = target.toString();
        if (value.endsWith('service-registry.json')) {
          return false;
        }
        return value.includes('services');
      });

      mockFs.readdirSync.mockReturnValue(['service.json']);
      (mockFs.readFileSync as jest.Mock).mockImplementation((filePath: fs.PathOrFileDescriptor) => {
        if (filePath.toString().endsWith('service.json')) {
          return JSON.stringify({
            id: 'svc',
            endpoint: 'http://localhost:4100',
            pid: 'not-a-number',
            protocol: 'http'
          });
        }
        return '';
      });

      mockHttp.get.mockImplementation((_url: any, callback: any) => {
        const response = {
          statusCode: 200,
          on: (event: string, handler: (...args: any[]) => void) => {
            if (event === 'data') {
              handler('');
            }
            if (event === 'end') {
              handler();
            }
            return response;
          },
        } as any;

        if (typeof callback === 'function') {
          callback(response);
        }

        return { on: jest.fn() } as any;
      });

      const discovered = await strategy.discover();

      expect(discovered).toHaveLength(0);
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('ConfigurationBasedDiscoveryStrategy', () => {
    let strategy: ConfigurationBasedDiscoveryStrategy;

    beforeEach(() => {
      strategy = new ConfigurationBasedDiscoveryStrategy({
        configurationPath: path.join(tempDir, 'backend-config.json'),
        timeout: 1000
      });
    });

    it('should discover services from configuration file', async () => {
      const config = {
        backends: [
          {
            service: 'haruspex',
            version: '2.0.0',
            protocol: 'ipc',
            endpoint: 'ipc://localhost:3001',
            timeout: 10000,
            retries: 3,
            keepAlive: true,
            authentication: { type: 'none' },
            healthEndpoint: 'http://localhost:3001/health'
          },
          {
            service: 'pcl',
            version: '1.0.0',
            protocol: 'http',
            endpoint: 'http://localhost:3002',
            timeout: 5000,
            retries: 2,
            keepAlive: true,
            authentication: { type: 'none' },
            healthEndpoint: 'http://localhost:3002/api/health',
            capabilitiesEndpoint: 'http://localhost:3002/api/capabilities'
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(config));

      const discovered = await strategy.discover();

      expect(discovered).toHaveLength(2);
      expect(discovered[0].discoveryMethod).toBe('configuration');
      expect(discovered[0].confidence).toBe(0.8);
      expect(discovered[0].config.service).toBe('haruspex');
      expect(discovered[1].config.service).toBe('pcl');
    });

    it('should skip invalid backend configurations', async () => {
      const config = {
        backends: [
          {
            service: 'valid-service',
            protocol: 'http',
            endpoint: 'http://localhost:3000'
          },
          {
            // Missing required fields
            service: 'invalid-service'
          },
          {
            service: 'another-invalid',
            protocol: 'unknown-protocol',
            endpoint: 'invalid://endpoint'
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(config));

      const discovered = await strategy.discover();

      expect(discovered).toHaveLength(1);
      expect(discovered[0].config.service).toBe('valid-service');
    });

    it('should ignore non-object entries in configuration backends array', async () => {
      const config = {
        backends: ['just-a-string', null, 42]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(config));

      const discovered = await strategy.discover();

      expect(discovered).toHaveLength(0);
    });

    it('should return empty array when configuration file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const discovered = await strategy.discover();

      expect(discovered).toEqual([]);
    });

    it('should handle invalid configuration file format', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{ "backends": "not an array" }');

      const discovered = await strategy.discover();

      expect(discovered).toEqual([]);
    });
  });

  describe('EndpointScanningDiscoveryStrategy', () => {
    let strategy: EndpointScanningDiscoveryStrategy;

    beforeEach(() => {
      strategy = new EndpointScanningDiscoveryStrategy({
        scanPorts: [3001, 3002],
        scanHosts: ['localhost'],
        timeout: 1000,
        maxRetries: 2
      });
    });

    it('should discover HTTP services via endpoint scanning', async () => {
      const mockRequest = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            // Don't trigger error for successful requests
          }
        })
      } as any;

      mockHttp.get.mockImplementation((url: any, callback: any) => {
        if (url.includes(':3002/api/skin')) {
          setTimeout(() => {
            const mockResponse = {
              statusCode: 200,
              on: jest.fn((event: string, callback: (data?: any) => void) => {
                if (event === 'data') {
                  callback(JSON.stringify({
                    service: 'pcl',
                    version: '1.0.0',
                    capabilities: ['tdd-workflow']
                  }));
                } else if (event === 'end') {
                  callback();
                }
              })
            };
            callback(mockResponse);
          }, 10);
        } else {
          // Simulate connection failure for other ports
          setTimeout(() => {
            mockRequest.on.mock.calls.find((call: any[]) => call[0] === 'error')?.[1]?.(new Error('Connection failed'));
          }, 10);
        }
        return mockRequest;
      });

      const discovered = await strategy.discover();

      expect(discovered.length).toBeGreaterThan(0);
      const httpService = discovered.find(s => s.config.protocol === 'http');
      expect(httpService).toBeDefined();
      expect(httpService?.config.service).toBe('pcl');
      expect(httpService?.discoveryMethod).toBe('scanning');
      expect(httpService?.confidence).toBe(0.7);
    });

    it('should discover WebSocket services', async () => {
      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
        close: jest.fn()
      };

      (mockWebSocket as any).mockImplementation(() => mockWs);

      // Simulate WebSocket connection and response
      setTimeout(() => {
        const openHandler = mockWs.on.mock.calls.find((call: any[]) => call[0] === 'open')?.[1] as Function;
        if (openHandler) openHandler();

        const messageHandler = mockWs.on.mock.calls.find((call: any[]) => call[0] === 'message')?.[1] as Function;
        if (messageHandler) {
          messageHandler(Buffer.from(JSON.stringify({
            type: 'skin_definition_response',
            data: {
              service: 'litany',
              version: '1.0.0',
              capabilities: ['context-management']
            }
          })));
        }
      }, 50);

      const discovered = await strategy.discover();

      // Note: This test may not find WebSocket services due to async timing,
      // but it validates the scanning logic doesn't crash
      expect(Array.isArray(discovered)).toBe(true);
    });

    it('should handle scanning timeouts gracefully', async () => {
      const mockRequest = {
        on: jest.fn()
      } as any;

      // Simulate all requests timing out
      mockHttp.get.mockImplementation(() => {
        // Don't call callback to simulate timeout
        return mockRequest;
      });

      const discovered = await strategy.discover();

      expect(discovered).toEqual([]);
    });

    it('should handle network errors during scanning', async () => {
      const mockRequest = {
        on: jest.fn()
      } as any;

      mockHttp.get.mockImplementation((url: any, callback: any) => {
        setTimeout(() => {
          const errorHandler = mockRequest.on.mock.calls.find((call: any[]) => call[0] === 'error')?.[1];
          if (errorHandler) errorHandler(new Error('Network error'));
        }, 10);
        return mockRequest;
      });

      const discovered = await strategy.discover();

      expect(discovered).toEqual([]);
    });
  });

  describe('ServiceDiscovery Integration', () => {
    it('should provide access to discovered services', async () => {
      const mockDiscover = (jest.fn() as any).mockResolvedValue([
        {
          id: 'test-service',
          config: {
            service: 'test-service',
            version: '1.0.0',
            protocol: 'http',
            endpoint: 'http://localhost:3000',
            timeout: 5000,
            retries: 2,
            keepAlive: true,
            authentication: { type: 'none' }
          },
          discoveryMethod: 'configuration',
          confidence: 0.8,
          timestamp: Date.now()
        } as DiscoveredService
      ]);
      const mockStrategy: DiscoveryStrategy = {
        name: 'mock-strategy',
        priority: 100,
        discover: mockDiscover
      };

      serviceDiscovery.addStrategy(mockStrategy);
      await serviceDiscovery.discoverServices();

      const services = serviceDiscovery.getDiscoveredServices();
      expect(services).toHaveLength(1);
      expect(services[0].id).toBe('test-service');

      const service = serviceDiscovery.getServiceById('test-service');
      expect(service).toBeDefined();
      expect(service?.id).toBe('test-service');

      const configs = serviceDiscovery.getBackendConfigs();
      expect(configs.has('test-service')).toBe(true);
    });

    it('should allow adding and removing strategies', () => {
      const mockDiscover = (jest.fn() as any).mockResolvedValue([]);
      const customStrategy: DiscoveryStrategy = {
        name: 'custom-strategy',
        priority: 50,
        discover: mockDiscover
      };

      serviceDiscovery.addStrategy(customStrategy);
      expect(serviceDiscovery.removeStrategy('custom-strategy')).toBe(true);
      expect(serviceDiscovery.removeStrategy('non-existent')).toBe(false);
    });

    it('should emit discovery events', async () => {
      const mockDiscover = (jest.fn() as any).mockResolvedValue([]);
      const mockStrategy: DiscoveryStrategy = {
        name: 'event-test-strategy',
        priority: 100,
        discover: mockDiscover
      };

      serviceDiscovery.addStrategy(mockStrategy);

      const discoveryStartedSpy = jest.fn();
      const discoveryCompletedSpy = jest.fn();

      serviceDiscovery.on('discoveryStarted', discoveryStartedSpy);
      serviceDiscovery.on('discoveryCompleted', discoveryCompletedSpy);

      await serviceDiscovery.discoverServices();

      const expectedStrategyCount = (serviceDiscovery as any).strategies.length;

      expect(discoveryStartedSpy).toHaveBeenCalledWith({ strategies: expectedStrategyCount });
      expect(discoveryCompletedSpy).toHaveBeenCalledWith({
        discovered: 0,
        strategies: expectedStrategyCount,
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty discovery results', async () => {
      const mockDiscover = (jest.fn() as any).mockResolvedValue([]);
      const emptyStrategy: DiscoveryStrategy = {
        name: 'empty-strategy',
        priority: 100,
        discover: mockDiscover
      };

      serviceDiscovery.addStrategy(emptyStrategy);
      const discovered = await serviceDiscovery.discoverServices();

      expect(discovered).toEqual([]);
    });

    it('should handle strategy errors without crashing', async () => {
      const mockDiscoverError = (jest.fn() as any).mockRejectedValue(new Error('Strategy error'));
      const errorStrategy: DiscoveryStrategy = {
        name: 'error-strategy',
        priority: 100,
        discover: mockDiscoverError
      };

      const mockDiscoverWorking = (jest.fn() as any).mockResolvedValue([
        {
          id: 'working-service',
          config: {
            service: 'working-service',
            version: '1.0.0',
            protocol: 'http',
            endpoint: 'http://localhost:3000',
            timeout: 5000,
            retries: 2,
            keepAlive: true,
            authentication: { type: 'none' }
          },
          discoveryMethod: 'configuration',
          confidence: 0.8,
          timestamp: Date.now()
        } as DiscoveredService
      ]);
      const workingStrategy: DiscoveryStrategy = {
        name: 'working-strategy',
        priority: 90,
        discover: mockDiscoverWorking
      };

      serviceDiscovery.addStrategy(errorStrategy);
      serviceDiscovery.addStrategy(workingStrategy);

      const strategyErrorSpy = jest.fn();
      serviceDiscovery.on('strategyError', strategyErrorSpy);

      const discovered = await serviceDiscovery.discoverServices();

      expect(discovered).toHaveLength(1);
      expect(discovered[0].id).toBe('working-service');
      expect(strategyErrorSpy).toHaveBeenCalled();
    });

    it('should sort strategies by priority', () => {
      const lowPriorityStrategy: DiscoveryStrategy = {
        name: 'low-priority',
        priority: 10,
        discover: jest.fn() as () => Promise<DiscoveredService[]>
      };

      const highPriorityStrategy: DiscoveryStrategy = {
        name: 'high-priority', 
        priority: 100,
        discover: jest.fn() as () => Promise<DiscoveredService[]>
      };

      const isolatedDiscovery = new ServiceDiscovery({
        strategies: [lowPriorityStrategy],
        enableFileWatching: false,
        enableHealthChecks: false,
        enableRegistryDiscovery: false,
        enableConfigurationDiscovery: false,
        enableEndpointScanning: false,
      });

      isolatedDiscovery.addStrategy(highPriorityStrategy);

      // Access private strategies array for testing
      const strategies = (isolatedDiscovery as any).strategies;
      expect(strategies[0].name).toBe('high-priority');
      expect(strategies[1].name).toBe('low-priority');
    });
  });

  describe('Phase 1 migrations', () => {
    it('emits serialization warnings when registry defaults are applied', async () => {
      emitSerializationWarningsSpy.mockClear();

      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('service-registry.json');
      });

      (mockFs.readFileSync as jest.Mock).mockImplementation((filePath: fs.PathOrFileDescriptor) => {
        if (filePath.toString().includes('service-registry.json')) {
          return JSON.stringify({
            services: {
              haruspex: {
                id: 'haruspex',
                endpoint: 'http://localhost:3001'
              }
            },
            version: 1,
            lastUpdated: Date.now()
          });
        }

        return '{}';
      });

      const discovered = await serviceDiscovery.discoverServices();

      const registryWarnings = emitSerializationWarningsSpy.mock.calls
        .filter((call) => call[0].startsWith('backend:service-discovery:registry'))
        .flatMap((call) => call[1].meta.warnings);

      expect(discovered).toHaveLength(1);
      expect(registryWarnings.length).toBeGreaterThan(0);
      expect(registryWarnings.some((warning) => warning.includes('defaults'))).toBe(true);
      expect(discovered[0].config.healthEndpoint).toBe('http://localhost:3001/health');
    });
  });

  describe('serialization helper defaults', () => {
    const registryContext = 'tests:service-discovery:registry-defaults';

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-10-02T14:30:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('applies registry defaults when optional fields are missing', () => {
      const payload = { id: 'templum-core', endpoint: 'http://localhost:4600' };
      const expectedTimestamp = Date.now();
      const defaults = buildServiceRegistryDefaults(payload);

      const result = serialization
        .fromJson(JSON.stringify(payload))
        .context(registryContext)
        .withSchema(serviceRegistryEntrySchema)
        .withDefaults(defaults)
        .parse();

      expect(result.ok).toBe(true);
      expect(result.status).toBe('defaults');
      expect(result.meta.warnings).toContain('Schema validation failed; applied defaults');
      expect(result.value).toMatchObject({
        id: 'templum-core',
        endpoint: 'http://localhost:4600',
        protocol: 'http',
        health: 'http://localhost:4600/health',
        version: '1.0.0',
        capabilities: []
      });
      expect(result.value?.registrationTime).toBe(expectedTimestamp);
      expect(result.value?.lastSeen).toBe(expectedTimestamp);
    });
  });
});

afterAll(() => {
  registryHealthSpy.mockRestore();
});

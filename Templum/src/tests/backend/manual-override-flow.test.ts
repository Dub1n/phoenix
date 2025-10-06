import { EventEmitter } from 'events';
import { jest } from '@jest/globals';
import { TemplumBackendServiceRouter } from '../../backend/backend-service-router';
import { ConnectionFactory } from '../../backend/connection-factory';
import { ServiceDiscovery } from '../../backend/service-discovery';
import type { DiscoveredService } from '../../backend/service-discovery';
import { MockBackendConnection } from './__utils__/mock-backend-connection';
import type { UniversalSkinDefinition, BackendConfig } from '../../types/universal-skin-engine-types';

jest.mock('../../backend/connection-factory');
jest.mock('../../backend/service-discovery');

const mockConnectionFactory = ConnectionFactory as jest.Mocked<typeof ConnectionFactory>;
const ServiceDiscoveryMock = ServiceDiscovery as unknown as jest.Mock;

type ServiceDiscoveryController = ReturnType<typeof createServiceDiscoveryMock>;

const createServiceDiscoveryMock = () => {
  let currentServices: DiscoveredService[] = [];
  const emitter = new EventEmitter();

  const discoverServices = jest.fn(async () => currentServices);
  const getDiscoveredServices = jest.fn(() => currentServices);
  const getBackendConfigs = jest.fn(() => new Map(currentServices.map(service => [service.id, service.config])));
  const setServices = (services: DiscoveredService[]) => {
    currentServices = services;
  };

  const instance = Object.assign(emitter, {
    discoverServices,
    getDiscoveredServices,
    getBackendConfigs,
    getServiceById: jest.fn((id: string) => currentServices.find(service => service.id === id)),
    close: jest.fn(async () => undefined)
  });

  return {
    instance,
    discoverServices,
    getDiscoveredServices,
    getBackendConfigs,
    setServices
  };
};

const createSkin = (overrides: Partial<UniversalSkinDefinition> = {}): UniversalSkinDefinition => ({
  id: 'haruspex-skin',
  name: 'Haruspex Skin',
  version: '1.0.0',
  metadata: {
    id: 'haruspex-skin',
    name: 'Haruspex Skin',
    version: '1.0.0',
    backend: 'haruspex',
    backendService: 'haruspex'
  },
  backendConfig: {
    service: 'haruspex',
    version: '1.0.0',
    protocol: 'http',
    endpoint: 'http://localhost:3005',
    timeout: 15000,
    retries: 2,
    authentication: { type: 'none' as const }
  },
  commands: {},
  ...overrides
});

describe('Manual Override Flow', () => {
  let router: TemplumBackendServiceRouter;
  let serviceDiscoveryController: ServiceDiscoveryController;
  let backendConfig: BackendConfig;
  let fetchSpy: jest.SpyInstance | undefined;

  beforeEach(async () => {
    jest.clearAllMocks();

    serviceDiscoveryController = createServiceDiscoveryMock();
    ServiceDiscoveryMock.mockImplementation(() => serviceDiscoveryController.instance);

    const skin = createSkin();
    backendConfig = skin.backendConfig!;

    mockConnectionFactory.create.mockImplementation(async () => new MockBackendConnection(skin));

    if (typeof globalThis.fetch === 'function') {
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({}),
          text: async () => '',
        } as unknown as Response);
    }

    router = new TemplumBackendServiceRouter();
    await (router as unknown as {
      registerBackendFromSkin: (skinDefinition: UniversalSkinDefinition) => Promise<void>;
    }).registerBackendFromSkin(skin);

    serviceDiscoveryController.setServices([
      {
        id: 'haruspex',
        config: backendConfig,
        discoveryMethod: 'registry',
        confidence: 0.95,
        timestamp: Date.now()
      }
    ]);

    // Sync discovered service cache for sanitized metadata
    const discoveredCache = (router as unknown as {
      discoveredServiceCache: Map<string, DiscoveredService>;
    }).discoveredServiceCache;
    discoveredCache.set('haruspex', {
      id: 'haruspex',
      config: backendConfig,
      discoveryMethod: 'registry',
      confidence: 0.95,
      timestamp: Date.now()
    });
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test('applies manual override and emits sanitized descriptor', async () => {
    const appliedEvents: any[] = [];
    router.on('manualOverride:applied', payload => appliedEvents.push(payload));

    const descriptor = await router.applyManualOverride('haruspex', { scope: 'session', reason: 'test' });

    expect(descriptor.serviceId).toBe('haruspex');
    expect(descriptor.scope).toBe('session');
    expect(descriptor).not.toHaveProperty('endpoint');
    expect(descriptor.metadata).toEqual({ discoveryMethod: 'registry', confidence: 0.95 });

    const snapshot = router.getManualOverrideSnapshot();
    expect(snapshot.overrides).toHaveLength(1);
    expect(mockConnectionFactory.create).toHaveBeenCalledWith('haruspex', backendConfig);

    expect(appliedEvents).toHaveLength(1);
    expect(appliedEvents[0]).toEqual(descriptor);
  });

  test('clears manual override and resets snapshot', async () => {
    await router.applyManualOverride('haruspex');
    const result = await router.clearManualOverride('haruspex');

    expect(result.descriptor?.serviceId).toBe('haruspex');
    expect(router.getManualOverrideSnapshot().overrides).toHaveLength(0);
  });

  test('auto-clears override when service is removed', async () => {
    await router.applyManualOverride('haruspex');

    const clearedEvents: Array<{ serviceId?: string }> = [];
    router.on('manualOverride:cleared', descriptor => clearedEvents.push({ serviceId: descriptor?.serviceId }));

    serviceDiscoveryController.instance.emit('serviceRemoved', { serviceId: 'haruspex' });

    expect(router.getManualOverrideSnapshot().overrides).toHaveLength(0);
    expect(clearedEvents.some(event => event.serviceId === 'haruspex')).toBe(true);
  });
});

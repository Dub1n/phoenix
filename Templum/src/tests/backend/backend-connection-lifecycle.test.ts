import { EventEmitter } from 'events';
import { jest } from '@jest/globals';
import { TemplumBackendServiceRouter } from '../../backend/backend-service-router';
import { ConnectionFactory, type BackendConnection } from '../../backend/connection-factory';
import { ServiceDiscovery, type DiscoveredService } from '../../backend/service-discovery';
import type { BackendConfig } from '../../types/universal-skin-engine-types';

jest.mock('../../backend/connection-factory');
jest.mock('../../backend/service-discovery');

const mockConnectionFactory = ConnectionFactory as jest.Mocked<typeof ConnectionFactory>;
const ServiceDiscoveryMock = ServiceDiscovery as unknown as jest.Mock;
const loadBackendSkinSpy = jest.spyOn(TemplumBackendServiceRouter.prototype as any, 'loadBackendSkin');
const detectServiceCapabilitiesSpy = jest.spyOn(TemplumBackendServiceRouter.prototype as any, 'detectServiceCapabilities');
const getServiceVersionSpy = jest.spyOn(TemplumBackendServiceRouter.prototype as any, 'getServiceVersion');
const startContinuousHealthMonitoringSpy = jest.spyOn(TemplumBackendServiceRouter.prototype as any, 'startContinuousHealthMonitoring');

const buildBackendConfig = (overrides: Partial<BackendConfig> = {}): BackendConfig => ({
  protocol: 'http',
  endpoint: 'http://localhost:4077',
  retries: 2,
  timeout: 5000,
  keepAlive: false,
  options: {},
  ...overrides
});

const createServiceDiscoveryMock = () => {
  let discovered: DiscoveredService[] = [];
  const emitter = new EventEmitter();

  const discoverServices = jest.fn(async () => discovered);
  const getDiscoveredServices = jest.fn(() => discovered);
  const close = jest.fn(async () => undefined);

  const instance = Object.assign(emitter, {
    discoverServices,
    getDiscoveredServices,
    close
  });

  return {
    instance,
    discoverServices,
    getDiscoveredServices,
    close,
    setServices: (services: DiscoveredService[]) => {
      discovered = services;
    }
  };
};

const createConnectionStub = (serviceId: string) => {
  let connected = false;

  const stub: BackendConnection = {
    id: serviceId,
    protocol: 'http',
    endpoint: 'http://localhost:4077',
    isConnected: () => connected,
    connect: jest.fn(async () => {
      connected = true;
    }),
    disconnect: jest.fn(async () => {
      connected = false;
    })
  };

  return stub;
};

describe('TemplumBackendServiceRouter lifecycle events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadBackendSkinSpy.mockResolvedValue(null);
    detectServiceCapabilitiesSpy.mockResolvedValue(undefined);
    getServiceVersionSpy.mockResolvedValue('0.0.0-test');
    startContinuousHealthMonitoringSpy.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    loadBackendSkinSpy.mockReset();
    detectServiceCapabilitiesSpy.mockReset();
    getServiceVersionSpy.mockReset();
    startContinuousHealthMonitoringSpy.mockReset();
  });

  afterAll(() => {
    loadBackendSkinSpy.mockRestore();
    detectServiceCapabilitiesSpy.mockRestore();
    getServiceVersionSpy.mockRestore();
    startContinuousHealthMonitoringSpy.mockRestore();
  });

  it('emits connected and disconnected events during explicit lifecycle', async () => {
    const discoveryMock = createServiceDiscoveryMock();
    ServiceDiscoveryMock.mockImplementation(() => discoveryMock.instance);

    const backendConfig = buildBackendConfig();
    const discoveredService: DiscoveredService = {
      id: 'pcl-backend',
      config: backendConfig,
      discoveryMethod: 'registry',
      confidence: 0.95,
      timestamp: Date.now()
    };
    discoveryMock.setServices([discoveredService]);

    const connectionStub = createConnectionStub('pcl-backend');
    mockConnectionFactory.create.mockResolvedValue(connectionStub);

    const router = new TemplumBackendServiceRouter(undefined, {
      useGenericDiscovery: true,
      healthMonitoringEnabled: false
    });

    const events: Array<Record<string, any>> = [];
    router.on('connection:lifecycle', (event) => {
      events.push(event);
    });

    await router.discoverAndConnect();
    expect(events.some((event) => event.state === 'connected' && event.backendId === 'pcl-backend')).toBe(true);
    expect(startContinuousHealthMonitoringSpy).not.toHaveBeenCalled();

    const disconnectResult = await router.disconnectFromService('pcl-backend');
    expect(disconnectResult.success).toBe(true);
    expect(events.some((event) => event.state === 'disconnected' && event.backendId === 'pcl-backend')).toBe(true);
  });

  it('emits failed lifecycle event when all connection attempts fail', async () => {
    const discoveryMock = createServiceDiscoveryMock();
    ServiceDiscoveryMock.mockImplementation(() => discoveryMock.instance);

    const backendConfig = buildBackendConfig();
    const discoveredService: DiscoveredService = {
      id: 'faulty-backend',
      config: backendConfig,
      discoveryMethod: 'registry',
      confidence: 0.55,
      timestamp: Date.now()
    };
    discoveryMock.setServices([discoveredService]);

    const connectionStub = createConnectionStub('faulty-backend');
    connectionStub.connect = jest.fn(async () => {
      throw new Error('connection refused');
    });
    mockConnectionFactory.create.mockResolvedValue(connectionStub);

    const router = new TemplumBackendServiceRouter(undefined, {
      useGenericDiscovery: true,
      healthMonitoringEnabled: false
    });

    const events: Array<Record<string, any>> = [];
    router.on('connection:lifecycle', (event) => events.push(event));

    await router.discoverAndConnect();

    expect(events.some((event) => event.state === 'failed' && event.backendId === 'faulty-backend')).toBe(true);
    const failureEvent = events.find((event) => event.state === 'failed');
    expect(failureEvent?.error?.message).toContain('connection refused');
  });

  it('emits health degraded and recovered events when health state changes', async () => {
    const discoveryMock = createServiceDiscoveryMock();
    ServiceDiscoveryMock.mockImplementation(() => discoveryMock.instance);

    const backendConfig = buildBackendConfig();
    const discoveredService: DiscoveredService = {
      id: 'haruspex-backend',
      config: backendConfig,
      discoveryMethod: 'registry',
      confidence: 0.88,
      timestamp: Date.now()
    };
    discoveryMock.setServices([discoveredService]);

    const connectionStub = createConnectionStub('haruspex-backend');
    mockConnectionFactory.create.mockResolvedValue(connectionStub);

    const router = new TemplumBackendServiceRouter(undefined, {
      useGenericDiscovery: true,
      healthMonitoringEnabled: false
    });

    const events: Array<Record<string, any>> = [];
    router.on('connection:lifecycle', (event) => events.push(event));

    await router.discoverAndConnect();
    expect(events.some((event) => event.state === 'connected')).toBe(true);

    (router as any).updateServiceHealth('haruspex-backend', true, 'unhealthy', 'Health check failed');
    expect(events.some((event) => event.state === 'health-degraded')).toBe(true);

    (router as any).updateServiceHealth('haruspex-backend', true, 'healthy');
    expect(events.some((event) => event.state === 'recovered')).toBe(true);
  });
});

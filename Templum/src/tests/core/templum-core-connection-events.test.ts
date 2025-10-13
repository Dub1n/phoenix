import { EventDrivenComponent } from '../../utils/event-bus-adapter';
import type { GenericEventMap } from '../../utils/event-utils';
import { jest } from '@jest/globals';
import { TemplumCore } from '../../core/templum-core';
import type {
  IBackendRouter,
  IBackendServiceRouter,
  IDependencyInjectionConfig,
  IResourceManager,
  IStateManager
} from '../../interfaces/core-component-interfaces';
import type { InterfaceAdapter } from '../../types/templum-types';

class StubBackendServiceRouter
  extends EventDrivenComponent<GenericEventMap>
  implements IBackendServiceRouter {
  discoverCallCount = 0;

  constructor() {
    super('stub-backend-service-router', 20);
  }

  async discoverAndConnect(): Promise<void> {
    this.discoverCallCount += 1;
  }

  async loadBackendSkin(): Promise<null> {
    return null;
  }

  executeCommand = jest.fn();
  isServiceAvailable = jest.fn();
  getConnectionStatus = jest.fn(() => ({ totalConnections: 0, healthyConnections: 0, backends: {} }));
  cleanup = jest.fn(async () => {
    this.removeAllListeners();
  });

  onLifecycleEvent(listener: (event: Record<string, any>) => void): () => void {
    this.on('connection:lifecycle', listener);
    return () => this.off('connection:lifecycle', listener);
  }

  emitLifecycle(event: Record<string, any>): void {
    this.emit('connection:lifecycle', event);
  }
}

const createStateManagerStub = () => {
  const handleBackendLifecycleEvent = jest.fn(async () => undefined);
  const syncState = jest.fn(async () => undefined);

  const stub: IStateManager = {
    initialize: jest.fn(async () => undefined),
    syncState: syncState as unknown as IStateManager['syncState'],
    sendMessage: jest.fn(async () => undefined),
    handleBackendLifecycleEvent
  } as unknown as IStateManager;

  return { stub, handleBackendLifecycleEvent, syncState };
};

const createDependencyConfig = (overrides: Partial<IDependencyInjectionConfig> = {}) => {
  const backendRouter: IBackendRouter = {
    initialize: jest.fn()
  } as unknown as IBackendRouter;

  const backendServiceRouter = new StubBackendServiceRouter();

  const { stub: stateManager, handleBackendLifecycleEvent, syncState } = createStateManagerStub();

  const resourceManager: IResourceManager = {
    initialize: jest.fn(async () => undefined),
    registerCoreServices: jest.fn(),
    registerService: jest.fn(async () => undefined),
    updateResourcePolicy: jest.fn(),
    updateResourceAccess: jest.fn(),
    allocateResource: jest.fn(async () => 'resource-1'),
    deallocateResource: jest.fn(async () => undefined),
    getStatus: jest.fn(() => ({ resources: [] })),
    shutdown: jest.fn(async () => undefined)
  } as unknown as IResourceManager;

  const skinEngine = {
    initialize: jest.fn(async () => undefined)
  };

  const observabilityService = {
    logInfo: jest.fn(),
    logWarn: jest.fn(),
    logError: jest.fn()
  };

  const config: IDependencyInjectionConfig = {
    enableSkinEngine: true,
    enableStateManager: true,
    enableBackendRouter: true,
    enableBackendServiceRouter: true,
    enableResourceManager: true,
    enableObservabilityService: true,
    customFactories: {
      skinEngine: () => skinEngine as any,
      stateManager: () => stateManager,
      backendRouter: () => backendRouter,
      backendServiceRouter: () => backendServiceRouter,
      resourceManager: () => resourceManager,
      observabilityService: () => observabilityService as any
    },
    ...overrides
  };

  return {
    config,
    backendServiceRouter,
    stateManager,
    handleBackendLifecycleEvent,
    syncState,
    observabilityService
  };
};

describe('TemplumCore backend lifecycle bridge', () => {
  const cores: TemplumCore[] = [];
  const routers: StubBackendServiceRouter[] = [];

  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(async () => {
    try {
      await Promise.all(cores.map(async (core) => core.shutdown()));
    } finally {
      cores.length = 0;
      routers.forEach((router) => router.removeAllListeners());
      routers.length = 0;
      jest.clearAllTimers();
    }
  });

  it('re-emits lifecycle events and forwards them to the state manager', async () => {
    const { config, backendServiceRouter, handleBackendLifecycleEvent, syncState, observabilityService } = createDependencyConfig();
    const core = new TemplumCore({}, config);
    cores.push(core);
    routers.push(backendServiceRouter);

    const lifecycleEvents: Array<Record<string, any>> = [];
    core.on('backend:lifecycle', (event) => lifecycleEvents.push(event));

    await core.initialize();

    const adapter: InterfaceAdapter = {
      getInterfaceType: () => 'cli',
      applySkin: jest.fn(async () => undefined),
      syncState: jest.fn(async () => undefined),
      dispose: jest.fn(async () => undefined),
      getStatus: () => ({ active: true })
    };

    await core.registerInterface('cli', adapter);

    const event = {
      backendId: 'stub-backend',
      state: 'connected',
      timestamp: Date.now()
    };
    backendServiceRouter.emitLifecycle(event);

    await new Promise((resolve) => setImmediate(resolve));

    expect(lifecycleEvents).toContainEqual(expect.objectContaining(event));
    expect(handleBackendLifecycleEvent).toHaveBeenCalledWith(expect.objectContaining(event));
    expect(syncState).toHaveBeenCalledWith(
      'cli',
      expect.objectContaining({
        globalState: expect.objectContaining({
          backendLifecycle: expect.objectContaining({
            'stub-backend': expect.objectContaining({ state: 'connected' })
          })
        })
      }),
      'backend-lifecycle'
    );
    expect(observabilityService.logInfo).toHaveBeenCalledWith(expect.stringContaining('connected'), expect.objectContaining({ backendId: 'stub-backend' }), 'TemplumCore');
  });

  it('logs degraded or failed events with warnings', async () => {
    const { config, backendServiceRouter, observabilityService } = createDependencyConfig();
    const core = new TemplumCore({}, config);
    cores.push(core);
    routers.push(backendServiceRouter);
    await core.initialize();

    backendServiceRouter.emitLifecycle({
      backendId: 'stub-backend',
      state: 'health-degraded',
      timestamp: Date.now(),
      error: { message: 'Health check failed' }
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(observabilityService.logWarn).toHaveBeenCalledWith(expect.stringContaining('health-degraded'), expect.objectContaining({ backendId: 'stub-backend' }), 'TemplumCore');
  });
});

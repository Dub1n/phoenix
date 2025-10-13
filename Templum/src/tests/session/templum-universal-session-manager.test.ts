import { EventDrivenComponent } from '../../utils/event-bus-adapter';
import type { GenericEventMap } from '../../utils/event-utils';
import { jest } from '@jest/globals';
import { TemplumUniversalSessionManager } from '../../session/templum-universal-session-manager';
import { ThemeUsageRecord } from '../../utils/service-utils';
import {
  InterfaceAdapter,
  InterfaceType,
  UniversalSkinDefinition
} from '../../types/templum-types';

/**
 * The timeout wrapper guidance (docs/current/testing-guide.md §2) recommends
 * starting at 30 s, only escalating if the command fails to exit. The test
 * suite itself should finish in well under that limit, but we keep the value
 * here to make slow local runs easier to diagnose before resorting to wrapper
 * bumps.
 */
const DEFAULT_TEST_TIMEOUT_MS = 12_000;

class FakeBackendServiceRouter extends EventDrivenComponent<GenericEventMap> {
  readonly connections = new Map<string, unknown>();

  constructor() {
    super('fake-backend-service-router', 20);
  }

  async isServiceAvailable(): Promise<boolean> {
    return false;
  }

  async loadBackendSkin(): Promise<UniversalSkinDefinition | null> {
    return null;
  }

  async cleanup(): Promise<void> {
    this.removeAllListeners();
  }
}

class MinimalAdapter implements InterfaceAdapter {
  constructor(private readonly type: InterfaceType) {}

  getInterfaceType(): InterfaceType {
    return this.type;
  }

  async applySkin(): Promise<void> {
    // no-op for tests
  }

  async syncState(): Promise<void> {
    // no-op for tests
  }

  async dispose(): Promise<void> {
    // no-op for tests
  }

  getStatus() {
    return { active: true };
  }
}

describe('TemplumUniversalSessionManager', () => {
  const managers: TemplumUniversalSessionManager[] = [];
  const backendRouters: FakeBackendServiceRouter[] = [];

  const createManager = () => {
    const backendRouter = new FakeBackendServiceRouter();
    backendRouters.push(backendRouter);

    const manager = new TemplumUniversalSessionManager({}, undefined, backendRouter);
    managers.push(manager);
    return manager;
  };

  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(async () => {
    try {
      await Promise.all(
        managers.map(async (manager) => {
          await manager.shutdown();
        })
      );
    } finally {
      managers.length = 0;
      backendRouters.forEach((router) => router.removeAllListeners());
      backendRouters.length = 0;
      jest.clearAllTimers();
    }
  });

  test('rejects interface adapters missing required hooks', async () => {
    const manager = createManager();
    await manager.initialize();

    const brokenAdapter = {
      getInterfaceType: () => 'cli' as InterfaceType,
      async syncState() {
        // no-op
      },
      async dispose() {
        // no-op
      },
      getStatus() {
        return { active: false };
      },
    } as Partial<InterfaceAdapter> as InterfaceAdapter;

    await expect(manager.registerInterfaceAdapter('cli', brokenAdapter)).rejects.toMatchObject({
      code: 'SESSION_ADAPTER_INVALID',
      context: expect.objectContaining({ missingHooks: ['applySkin'] }),
    });
  }, DEFAULT_TEST_TIMEOUT_MS);

  test('accepts adapters that expose the expected hooks', async () => {
    const manager = createManager();
    await manager.initialize();

    const adapter = new MinimalAdapter('cli');

    await expect(manager.registerInterfaceAdapter('cli', adapter)).resolves.toBeUndefined();
  }, DEFAULT_TEST_TIMEOUT_MS);

  test('emits interfaceStateSyncError when adapters return invalid preserved state', async () => {
    const manager = createManager();
    await manager.initialize();

    const cliAdapter: InterfaceAdapter = {
      getInterfaceType: () => 'cli',
      async applySkin() {},
      async syncState() {},
      async dispose() {},
      getStatus: () => ({ active: true }),
      preserveState: async () => 'invalid-state' as any,
    } as InterfaceAdapter;

    const commandAdapter: InterfaceAdapter = {
      getInterfaceType: () => 'command',
      async applySkin() {},
      async syncState() {},
      async dispose() {},
      getStatus: () => ({ active: true }),
      restoreState: async () => {},
    } as InterfaceAdapter;

    await manager.registerInterfaceAdapter('cli', cliAdapter);
    await manager.registerInterfaceAdapter('command', commandAdapter);

    await manager.startSession('cli');

    const errors: unknown[] = [];
    manager.once('interfaceStateSyncError', (payload) => {
      errors.push(payload);
    });

    const switched = await manager.switchInterface('command');

    expect(switched).toBe(false);
    expect(errors).not.toHaveLength(0);
    const [firstError] = errors as Array<{ error?: { code?: string } }>;
    expect(firstError?.error?.code).toBe('SESSION_STATE_INVALID');
  }, DEFAULT_TEST_TIMEOUT_MS);

  test('records theme usage metrics using the shared summariser', async () => {
    const manager = createManager();
    await manager.initialize();

    const records: ThemeUsageRecord[] = [
      {
        id: 'cli',
        theme: 'default-light',
        applied: true,
        fallbackMode: 'unicode',
        capabilities: { supportsColor: true, supportsUnicode: true },
        overrides: [],
      },
      {
        id: 'window',
        theme: 'high-contrast',
        applied: false,
        fallbackMode: 'ascii',
        capabilities: { supportsColor: false, supportsUnicode: false },
        overrides: ['border'],
      },
    ];

    records.forEach(record => manager.recordThemeUsage(record));

    const metrics = manager.getSessionMetrics();
    expect(metrics.theme.total).toBe(2);
    expect(metrics.theme.applied).toBe(1);
    expect(metrics.theme.fallbackModes.unicode).toBe(1);
    expect(metrics.theme.fallbackModes.ascii).toBe(1);
    expect(metrics.theme.overridesApplied).toBe(1);
  }, DEFAULT_TEST_TIMEOUT_MS);

});

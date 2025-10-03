/**---
 * title: [Universal Interface Manager Guard Tests]
 * tags: [Testing, Core, Interface, Guards]
 * provides: [Guard behaviour regression tests for UniversalInterfaceManager]
 * requires: [Jest, UniversalInterfaceManager]
 * description: [Ensures the universal interface manager enforces consolidated TypeGuards and SemanticValidators before registering adapters.]
 * ---*/

import { UniversalInterfaceManager } from '../../src/core/universal-interface-manager';
import { InterfaceAdapter, InterfaceType } from '../../src/types/templum-types';
import { ITemplumCoreDependencies } from '../../src/interfaces/core-component-interfaces';

const noopAsync = async () => undefined;

const createDependencies = (): ITemplumCoreDependencies => ({
  skinEngine: {
    renderForInterface: noopAsync,
    validateSkin: async () => true,
    generateSkinHTML: () => '',
    dispose: noopAsync,
  },
  stateManager: {
    initialize: noopAsync,
    syncState: noopAsync,
    sendMessage: noopAsync,
    getCurrentState: async () => ({ session: 'state' }),
  },
  backendRouter: {
    initialize: () => undefined,
    executeCommand: async () => ({ success: true }),
    getStatus: () => ({ healthy: true }),
  },
  backendServiceRouter: {
    discoverAndConnect: noopAsync,
    loadBackendSkin: async () => null,
  },
  resourceManager: {
    initialize: noopAsync,
    allocateResource: async () => 'resource-id',
    deallocateResource: noopAsync,
    updateResourceAccess: () => undefined,
    getResourceUsage: () => ({ active: 1 }) as any,
    registerService: noopAsync,
    updateServiceHealth: noopAsync,
    getServiceHealth: () => [],
    getStatus: () => ({ status: 'ok' }) as any,
  },
  observabilityService: {
    logInfo: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn(),
  },
});

const createAdapter = (overrides: Partial<InterfaceAdapter> = {}): InterfaceAdapter => ({
  getInterfaceType: () => overrides.getInterfaceType?.() ?? ('cli' as InterfaceType),
  applySkin: overrides.applySkin ?? (async () => undefined),
  syncState: overrides.syncState ?? (async () => undefined),
  dispose: overrides.dispose ?? (async () => undefined),
  getStatus:
    overrides.getStatus ?? (() => ({ interface: 'cli', connected: true, timestamp: Date.now() } as any)),
});

describe('UniversalInterfaceManager guard rails', () => {
  let manager: UniversalInterfaceManager;

  beforeEach(() => {
    manager = new UniversalInterfaceManager(createDependencies());
  });

  test('rejects interface adapters missing contract functions', () => {
    const invalidAdapter = {} as InterfaceAdapter;

    expect(() => manager.registerInterfaceAdapter('cli', invalidAdapter)).toThrow(
      /must implement getInterfaceType/i,
    );
  });

  test('accepts valid interface adapters', () => {
    const adapter = createAdapter();

    expect(() => manager.registerInterfaceAdapter('cli', adapter)).not.toThrow();
  });
});

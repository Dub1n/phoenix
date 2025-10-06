import { EventEmitter } from 'events';
import { TemplumUniversalSessionManager } from '../../src/session/templum-universal-session-manager';
import type { InterfaceAdapter, InterfaceType } from '../../src/types/templum-types';

const createStubBackendRouter = () => ({
  discoverAndConnect: jest.fn().mockResolvedValue(undefined),
  loadBackendSkin: jest.fn().mockResolvedValue(null),
  executeCommand: jest.fn().mockResolvedValue(undefined),
  getConnectionStatus: jest.fn().mockReturnValue({
    totalConnections: 0,
    healthyConnections: 0,
    backends: {},
  }),
});

const createAdapter = (interfaceType: InterfaceType): InterfaceAdapter => {
  const emitter = new EventEmitter();
  return {
    applySkin: jest.fn().mockResolvedValue(undefined),
    syncState: jest.fn().mockResolvedValue(undefined),
    dispose: jest.fn().mockResolvedValue(undefined),
    getStatus: jest.fn().mockReturnValue({ interfaceType, active: true }),
    getInterfaceType: () => interfaceType,
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter),
  } as unknown as InterfaceAdapter;
};

describe('TemplumUniversalSessionManager Integration', () => {
  let sessionManager: TemplumUniversalSessionManager;

  beforeEach(async () => {
    sessionManager = new TemplumUniversalSessionManager(
      {},
      undefined,
      createStubBackendRouter() as any,
    );
    await sessionManager.initialize();
  });

  afterEach(async () => {
    await (sessionManager as any).stopSession?.();
    sessionManager.removeAllListeners();
    await (sessionManager as any).sessionFoundation?.cleanup?.();
  });

  test('ensures single session across interfaces and updates shared state', async () => {
    const cliAdapter = createAdapter('cli');
    const vscodeAdapter = createAdapter('vscode');

    const cliSessionId = await sessionManager.ensureSessionForInterface('cli');
    await sessionManager.registerInterfaceAdapter('cli', cliAdapter);

    const vscodeSessionId = await sessionManager.ensureSessionForInterface('vscode');
    await sessionManager.registerInterfaceAdapter('vscode', vscodeAdapter);

    expect(vscodeSessionId).toBe(cliSessionId);

    await sessionManager.updateSessionState({
      sessionId: cliSessionId,
      interfaceType: 'cli',
      state: {
        navigationStack: ['main', 'settings'],
        currentMenu: 'settings',
        commandHistory: ['templum.test'],
        interactionMode: 'command',
      },
    });

    const snapshot = sessionManager.getSessionSnapshot(cliSessionId);
    expect(snapshot?.currentMenu).toBe('settings');
    expect(snapshot?.navigationHistory).toEqual(['main', 'settings']);
    expect(snapshot?.commandHistory[0]).toBe('templum.test');
    expect(snapshot?.interactionMode).toBe('command');

    await expect(
      sessionManager.syncInterfaces('cli', 'vscode'),
    ).resolves.not.toThrow();

    const disconnectSpy = jest.fn();
    sessionManager.on('interfaceDisconnected', disconnectSpy);
    sessionManager.notifyInterfaceDisconnect('cli', 'integration-test');

    expect(disconnectSpy).toHaveBeenCalledWith(
      expect.objectContaining({ interfaceType: 'cli', reason: 'integration-test' }),
    );
  });
});

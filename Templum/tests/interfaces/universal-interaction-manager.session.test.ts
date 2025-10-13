import { EventUtils, type GenericEventMap } from '../../src/utils/event-utils';
import { UniversalInteractionManager } from '../../src/interfaces/universal-interaction-manager';
import { SessionContextFoundation } from '../../src/session/session-context-foundation';
import type { TemplumSessionManagerContract } from '../../src/session/universal-session-manager.types';
import type { Interface as ReadlineInterface } from 'readline';

const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

const createReadlineStub = (): ReadlineInterface => ({
  question: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  setPrompt: jest.fn(),
  prompt: jest.fn(),
}) as unknown as ReadlineInterface;

jest.mock('readline', () => {
  const actual = jest.requireActual<typeof import('readline')>('readline');
  return {
    __esModule: true,
    ...actual,
    createInterface: jest.fn(() => createReadlineStub()),
  };
});

const createSessionManagerMock = (
  sessionContext: SessionContextFoundation,
  sessionId: string,
) => {
  const events = EventUtils.createTypedEmitter<GenericEventMap>();

  const mock: jest.Mocked<TemplumSessionManagerContract> = {
    initialize: jest.fn().mockResolvedValue(undefined),
    attachOrchestrator: jest.fn(),
    ensureSessionForInterface: jest.fn().mockResolvedValue(sessionId),
    getActiveSessionId: jest.fn().mockReturnValue(sessionId),
    getSessionSnapshot: jest.fn().mockReturnValue(null),
    updateSessionState: jest.fn().mockImplementation(async ({ interfaceType, state }) => {
      sessionContext.updateSessionState(sessionId, {
        [interfaceType]: {
          ...(sessionContext.getActiveSession()?.state?.[interfaceType] ?? {}),
          ...state,
          timestamp: Date.now(),
        },
      });
    }),
    registerInterfaceAdapter: jest.fn().mockResolvedValue(undefined),
    syncInterfaces: jest.fn().mockResolvedValue(undefined),
    notifyInterfaceDisconnect: jest.fn(),
    on: events.on.bind(events),
    off: events.off.bind(events),
  } as unknown as jest.Mocked<TemplumSessionManagerContract>;

  return mock;
};

const createCommandRegistryStub = (sessionId: string) => ({
  executeCommand: jest.fn().mockResolvedValue({
    success: true,
    message: 'ok',
    data: null,
    sessionId,
  }),
  getBackendIntegrations: jest.fn().mockReturnValue([]),
  getHandlersByBackend: jest.fn().mockReturnValue([
    { id: 'templum.test' },
    { id: 'help' },
  ]),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
});

const createMenuRegistryStub = () => ({
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
});

const createSkinRendererStub = () => ({
  renderMenu: jest.fn().mockResolvedValue({ success: true }),
});

describe('UniversalInteractionManager session integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const createManager = async (options: { sessionId?: string } = {}) => {
    const sessionContext = new SessionContextFoundation();
    await sessionContext.initialize();

    const session = await sessionContext.createSession(options.sessionId, 'cli');
    sessionContext.setActiveSession(session.sessionId);

    const sessionManager = createSessionManagerMock(sessionContext, session.sessionId);

    const interactionManager = new UniversalInteractionManager(
      createCommandRegistryStub(session.sessionId) as any,
      createMenuRegistryStub() as any,
      sessionContext,
      createSkinRendererStub() as any,
      { enabledInterfaces: ['cli', 'vscode'] },
      { sessionManager },
    );

    return { interactionManager, sessionContext, sessionManager, sessionId: session.sessionId };
  };

  test('executeUniversalCommand persists command history through the shared session manager', async () => {
    const { interactionManager, sessionContext, sessionManager, sessionId } = await createManager();

    const result = await interactionManager.executeUniversalCommand('templum.test', {}, 'cli');
    await flushPromises();

    expect(result.success).toBe(true);
    expect(sessionManager.updateSessionState).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId,
        interfaceType: 'cli',
        state: expect.objectContaining({
          commandHistory: expect.arrayContaining(['templum.test']),
        }),
      }),
    );

    expect(sessionManager.syncInterfaces).toHaveBeenCalledWith('cli', 'vscode');

    const activeSession = sessionContext.getActiveSession();
    const interfaceState = activeSession?.state?.['cli'] as Record<string, any> | undefined;
    expect(interfaceState?.commandHistory?.[0]).toBe('templum.test');
    await interactionManager.dispose();
    await sessionContext.cleanup();
  });

  test('switchMode pushes interaction mode updates to the shared session state', async () => {
    const { interactionManager, sessionContext, sessionManager, sessionId } = await createManager();

    expect(interactionManager.getCurrentMode()).toBe('menu');

    const newMode = interactionManager.switchMode();
    expect(newMode).toBe('command');

    await flushPromises();

    expect(sessionManager.updateSessionState).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId,
        interfaceType: 'cli',
        state: expect.objectContaining({ interactionMode: 'command' }),
      }),
    );

    const refreshedSession = sessionContext.getActiveSession();
    const interfaceState = refreshedSession?.state?.['cli'] as Record<string, any> | undefined;
    expect(interfaceState?.interactionMode).toBe('command');

    await interactionManager.dispose();
    await sessionContext.cleanup();
  });
});

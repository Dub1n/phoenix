import { VSCodeInterfaceAdapter } from '../../../src/interfaces/vscode-adapter-abstracted';

const createVSCodeContext = () => ({
  extensionUri: undefined,
  subscriptions: [],
  globalState: { get: jest.fn(), update: jest.fn() },
  workspaceState: { get: jest.fn(), update: jest.fn() },
  asAbsolutePath: (value: string) => value,
});

const createOrchestrator = () => ({
  registerInterface: jest.fn().mockResolvedValue(undefined),
  getSessionManager: jest.fn().mockReturnValue({
    ensureSessionForInterface: jest.fn().mockResolvedValue(undefined),
  }),
});

describe('VSCode interface adapter consolidated logger guardrail', () => {
  test('initialization routes lifecycle messaging through the consolidated logger', async () => {
    const adapter = new VSCodeInterfaceAdapter(createVSCodeContext() as any);
    const orchestrator = createOrchestrator();
    const consoleSpy = jest.spyOn(console, 'log');
    const loggerInfoSpy = jest.spyOn((adapter as any).logger, 'info');

    try {
      await adapter.initialize(orchestrator as any);
    } finally {
      await adapter.dispose();
    }

    try {
      expect(loggerInfoSpy).toHaveBeenCalled();
      const [message] = loggerInfoSpy.mock.calls[0];
      expect(message).toBe(
        'VSCodeInterfaceAdapter: Initialized with orchestrator abstraction',
      );

      expect(consoleSpy).not.toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
      loggerInfoSpy.mockRestore();
    }
  });
});

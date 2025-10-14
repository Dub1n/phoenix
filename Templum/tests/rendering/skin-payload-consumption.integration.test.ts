import * as vscode from 'vscode';
import { CLIInterfaceAdapter } from '../../src/interfaces/cli-adapter-abstracted';
import { VSCodeInterfaceAdapter } from '../../src/interfaces/vscode-adapter-abstracted';
import {
  CommandContext,
  CommandResult,
  InterfaceAdapter,
  InterfaceType,
  TemplumSystemStatus,
  UniversalSkinDefinition,
} from '../../src/types/templum-types';
import {
  ISkinEngine,
  IBackendServiceRouter,
  IResourceManager,
} from '../../src/interfaces/core-component-interfaces';
import {
  ManualOverrideClearResult,
  ManualOverrideDescriptor,
  ManualOverrideSnapshot,
} from '../../src/backend/manual-override-manager';
import { ITemplumOrchestrator } from '../../src/interfaces/templum-orchestrator-interface';
import {
  TemplumSessionManagerContract,
  SessionStateUpdate,
} from '../../src/session/universal-session-manager.types';
import { SkinRenderResult } from '../../src/types/universal-skin-engine-types';

describe('Skin payload consumption integration', () => {
  const baseSkin: UniversalSkinDefinition = {
    id: 'stub-skin',
    name: 'Stub Skin',
    version: '1.0.0',
    metadata: {
      id: 'stub-skin',
      name: 'Stub Skin',
      version: '1.0.0',
      backend: 'haruspex',
      backendService: 'haruspex-service',
      compatibleInterfaces: ['cli', 'vscode', 'command'],
    },
    menus: {
      main: {
        id: 'main-menu',
        title: 'Main Tasks',
        items: [
          { id: 'start', label: 'Start Analysis', type: 'command', command: 'templum.start' },
          { id: 'config', label: 'Configure Project', type: 'command', command: 'templum.configure' },
        ],
      },
    },
    views: {
      panels: [
        { id: 'overview', name: 'Overview', type: 'webview', showOnStartup: true },
      ],
    },
    commands: {
      primary: [
        {
          id: 'templum.start',
          name: 'templum.start',
          title: 'Start Analysis',
          description: 'Kick off analysis workflow',
          category: 'Templum',
        },
      ],
    },
  };

  const createSkinEngine = () => {
    const renderForInterface = jest.fn(
      async (
        skinDefinition: UniversalSkinDefinition,
        interfaceType: InterfaceType,
      ): Promise<SkinRenderResult> => {
        const menuItems = skinDefinition.menus?.main?.items ?? [];
        const menuLabels = menuItems.map((item) => item.label).join(' | ');

        return {
          success: true,
          interface: interfaceType,
          metadata: {
            skinId: skinDefinition.id,
            backendService: skinDefinition.metadata.backendService,
          },
          components: menuItems.map((item) => ({
            id: item.id,
            type: item.type,
            backend: skinDefinition.metadata.backendService,
            content: item,
          })),
          performance: {
            renderTime: 4,
            outputSize: menuLabels.length,
            cacheHit: false,
          },
          customization: {},
          inheritance: { parentSkin: undefined, applied: false },
          renderedContent: {
            cli: `CLI_RENDER:${menuLabels}`,
            html: `<div data-skin="${skinDefinition.id}">${menuLabels}</div>`,
          },
        };
      },
    );

    const generateSkinHTML = jest.fn((renderResult: SkinRenderResult) => {
      return renderResult.renderedContent?.html ?? '';
    });

    return {
      renderForInterface,
      generateSkinHTML,
    } as unknown as ISkinEngine;
  };

  class StubSessionManager implements TemplumSessionManagerContract {
    private readonly sessionId = 'session-cli-1';

    async initialize(): Promise<void> {}

    attachOrchestrator(): void {}

    async ensureSessionForInterface(): Promise<string> {
      return this.sessionId;
    }

    getActiveSessionId(): string | null {
      return this.sessionId;
    }

    getSessionSnapshot(): null {
      return null;
    }

    async updateSessionState(_update: SessionStateUpdate): Promise<void> {}

    async registerInterfaceAdapter(): Promise<void> {}

    async syncInterfaces(): Promise<void> {}

    notifyInterfaceDisconnect(): void {}

    on(): void {}

    off(): void {}
  }

  class StubOrchestrator implements ITemplumOrchestrator {
    private readonly registered = new Map<InterfaceType, InterfaceAdapter>();
    private loadedSkins: UniversalSkinDefinition[] = [];

    constructor(
      private readonly skinEngine: ISkinEngine,
      private readonly sessionManager: TemplumSessionManagerContract,
    ) {}

    isInitialized(): boolean {
      return true;
    }

    getSupportedInterfaces(): InterfaceType[] {
      return ['cli', 'vscode', 'command'];
    }

    async registerInterface(interfaceType: InterfaceType, adapter: InterfaceAdapter): Promise<void> {
      this.registered.set(interfaceType, adapter);
    }

    async loadSkin(): Promise<void> {}

    async loadBackendSkin(): Promise<UniversalSkinDefinition | null> {
      return null;
    }

    async executeCommand(): Promise<CommandResult> {
      return { success: true, timestamp: Date.now() };
    }

    getSystemStatus(): TemplumSystemStatus {
      const factory = (global as any)?.testUtils?.createMockSystemStatus;
      return factory ? factory() : {
        coreEngine: {
          initialized: true,
          activeInterfaces: ['cli'],
          loadedSkins: this.loadedSkins.map((skin) => skin.id ?? skin.metadata?.id ?? 'unknown'),
          backendConnections: { totalConnections: 0, healthyConnections: 0, backends: {} },
        },
        stateManager: {
          synchronized: true,
          globalState: { lastModified: Date.now(), backendStates: [] },
          sessionState: { startTime: Date.now(), totalCommands: 0, lastCommand: '' },
          subscribers: 0,
          historySize: 0,
          persistence: {},
        },
        skinEngine: {
          cachedSkins: 0,
          renderers: { vscode: {}, cli: {}, command: {} },
          performance: { cacheHitRate: 0, averageRenderTime: 0 },
        },
        performance: {
          memory: { heapUsed: 0, rss: 0 },
          cpu: { user: 0, system: 0 },
          interfaces: {},
        },
      } as TemplumSystemStatus;
    }

    getLoadedSkins(): UniversalSkinDefinition[] {
      return this.loadedSkins;
    }

    async refreshBackendServices(): Promise<void> {}

    getUniversalSkinEngine(): ISkinEngine {
      return this.skinEngine;
    }

    getBackendRouter(): IBackendServiceRouter {
      return {} as unknown as IBackendServiceRouter;
    }

    getResourceManager(): IResourceManager {
      return {} as unknown as IResourceManager;
    }

    getSessionManager(): TemplumSessionManagerContract {
      return this.sessionManager;
    }

    async applyManualOverride(): Promise<ManualOverrideDescriptor> {
      return { serviceId: 'stub', active: true, overrides: {} } as ManualOverrideDescriptor;
    }

    async clearManualOverride(): Promise<ManualOverrideClearResult> {
      return { cleared: [], remaining: [] };
    }

    getManualOverrideSnapshot(): ManualOverrideSnapshot {
      return { overrides: [] };
    }

    async shutdown(): Promise<void> {}

    // Test helper
    setLoadedSkins(skins: UniversalSkinDefinition[]): void {
      this.loadedSkins = skins;
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('CLI adapter surfaces menus rendered from skin payload', async () => {
    const sessionManager = new StubSessionManager();
    const skinEngine = createSkinEngine();
    const orchestrator = new StubOrchestrator(skinEngine, sessionManager);
    const adapter = new CLIInterfaceAdapter();
    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await adapter.initialize(orchestrator);
    try {
      await adapter.applySkin(baseSkin);

      expect(skinEngine.renderForInterface).toHaveBeenCalledWith(
        expect.objectContaining({ id: baseSkin.id }),
        'cli',
        expect.objectContaining({ interfaceType: 'cli' }),
      );

      const loggedLines = stdoutSpy.mock.calls
        .flat()
        .filter((value): value is string => typeof value === 'string');
      expect(
        loggedLines.some(
          (line) =>
            typeof line === 'string' &&
            line.includes('CLI_RENDER:Start Analysis | Configure Project'),
      ),
      ).toBe(true);
    } finally {
      stdoutSpy.mockRestore();
      await adapter.dispose();
    }
  });

  test('VSCode adapter posts rendered HTML derived from skin payload', async () => {
    const sessionManager = new StubSessionManager();
    const skinEngine = createSkinEngine();
    const orchestrator = new StubOrchestrator(skinEngine, sessionManager);
    const adapter = new VSCodeInterfaceAdapter({
      extensionUri: vscode.Uri.parse('templum://test'),
      subscriptions: [],
      globalState: { get: jest.fn(), update: jest.fn() },
      workspaceState: { get: jest.fn(), update: jest.fn() },
      environmentVariableCollection: {
        persistent: true,
        replace: jest.fn(),
        get: jest.fn(),
        forEach: jest.fn(),
        append: jest.fn(),
        prepend: jest.fn(),
        clear: jest.fn(),
        delete: jest.fn(),
      },
      asAbsolutePath: (value: string) => value,
    } as unknown as vscode.ExtensionContext);

    await adapter.initialize(orchestrator);

    const fakeWebview = {
      postMessage: jest.fn().mockResolvedValue(undefined),
      options: {},
      html: '',
    };

    (adapter as unknown as { view: vscode.WebviewView }).view = {
      webview: fakeWebview as unknown as vscode.Webview,
    } as vscode.WebviewView;

    try {
      await adapter.applySkin(baseSkin);

      expect(skinEngine.renderForInterface).toHaveBeenCalledWith(
        expect.objectContaining({ id: baseSkin.id }),
        'vscode',
        expect.objectContaining({ webview: true }),
      );

      expect(fakeWebview.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'render_skin',
          payload: expect.objectContaining({
            html: `<div data-skin="${baseSkin.id}">Start Analysis | Configure Project</div>`,
            skinId: baseSkin.metadata.id,
          }),
        }),
      );
    } finally {
      await adapter.dispose();
    }
  });

  test('CLI loadInitialContent renders last loaded skin when no healthy backends', async () => {
    const sessionManager = new StubSessionManager();
    const skinEngine = createSkinEngine();
    const orchestrator = new StubOrchestrator(skinEngine, sessionManager);
    orchestrator.setLoadedSkins([baseSkin]);

    const adapter = new CLIInterfaceAdapter({
      enableInteractiveMode: false,
      enableKeyboardShortcuts: false,
      enableColorOutput: false,
      clearScreenOnRender: false,
    });

    const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await adapter.initialize(orchestrator);
    try {
      await (adapter as unknown as { loadInitialContent(): Promise<void> }).loadInitialContent();

      expect(skinEngine.renderForInterface).toHaveBeenCalledWith(
        expect.objectContaining({ id: baseSkin.id }),
        'cli',
        expect.objectContaining({ interfaceType: 'cli' }),
      );

      const loggedLines = stdoutSpy.mock.calls
        .flat()
        .filter((value): value is string => typeof value === 'string');
      expect(
        loggedLines.some((line) =>
          line.includes('CLI_RENDER:Start Analysis | Configure Project'),
      ),
      ).toBe(true);
      expect(
        loggedLines.some((line) =>
          line.includes('Templum Universal Interface - CLI Mode'),
      ),
      ).toBe(false);
    } finally {
      await adapter.dispose();
      stdoutSpy.mockRestore();
    }
  });

  test('VSCode loadInitialContent pushes rendered skin payload without backend fallback', async () => {
    const sessionManager = new StubSessionManager();
    const skinEngine = createSkinEngine();
    const orchestrator = new StubOrchestrator(skinEngine, sessionManager);
    orchestrator.setLoadedSkins([baseSkin]);

    const adapter = new VSCodeInterfaceAdapter({
      extensionUri: vscode.Uri.parse('templum://test'),
      subscriptions: [],
      globalState: { get: jest.fn(), update: jest.fn() },
      workspaceState: { get: jest.fn(), update: jest.fn() },
      environmentVariableCollection: {
        persistent: true,
        replace: jest.fn(),
        get: jest.fn(),
        forEach: jest.fn(),
        append: jest.fn(),
        prepend: jest.fn(),
        clear: jest.fn(),
        delete: jest.fn(),
      },
      asAbsolutePath: (value: string) => value,
    } as unknown as vscode.ExtensionContext);

    await adapter.initialize(orchestrator);

    const fakeWebview = {
      postMessage: jest.fn().mockResolvedValue(undefined),
      options: {},
      html: '',
    };

    (adapter as unknown as { view: vscode.WebviewView }).view = {
      webview: fakeWebview as unknown as vscode.Webview,
    } as vscode.WebviewView;

    await (adapter as unknown as { loadInitialContent(): Promise<void> }).loadInitialContent();

    expect(skinEngine.renderForInterface).toHaveBeenCalledWith(
      expect.objectContaining({ id: baseSkin.id }),
      'vscode',
      expect.objectContaining({ webview: true }),
    );

    expect(fakeWebview.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'render_skin',
        payload: expect.objectContaining({
          html: `<div data-skin="${baseSkin.id}">Start Analysis | Configure Project</div>`,
          skinId: baseSkin.metadata.id,
        }),
      }),
    );

    // Fallback HTML should not have been injected
    expect(fakeWebview.html).toBe('');
  });
});

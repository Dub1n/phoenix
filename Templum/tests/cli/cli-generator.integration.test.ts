import { buildCLIMenuModel } from '../../src/interfaces/cli-generator';
import { CLIInterfaceAdapter } from '../../src/interfaces/cli-adapter-abstracted';
import type { UniversalSkinDefinition, TemplumSystemStatus, CommandResult } from '../../src/types/templum-types';
import type {
  TemplumSessionManagerContract,
  TemplumSessionState,
  SessionStateUpdate,
  TemplumSessionMetrics,
} from '../../src/session/universal-session-manager.types';
import type { ITemplumOrchestrator, InterfaceAdapter } from '../../src/interfaces/templum-orchestrator-interface';
import type {
  ManualOverrideDescriptor,
  ManualOverrideClearResult,
  ManualOverrideSnapshot,
  ManualOverrideOptions,
} from '../../src/backend/manual-override-manager';

const createTestSkin = (): UniversalSkinDefinition => ({
  id: 'cli-generator-test',
  name: 'CLI Generator Test Skin',
  version: '1.0.0',
  metadata: {
    id: 'cli-generator-test',
    name: 'CLI Generator Test Skin',
    version: '1.0.0',
    backend: 'pcl',
    backendService: 'pcl',
    compatibleInterfaces: ['cli'],
  },
  menus: {
    main: {
      id: 'main-menu',
      title: 'Templum Actions',
      items: [
        {
          id: 'analyze',
          label: 'Analyze Project',
          command: 'haruspex.analyze',
          shortcuts: ['Ctrl+Shift+A'],
        },
        {
          id: 'predictions',
          label: 'View Predictions',
          command: 'haruspex.viewPredictions',
          shortcut: 'Ctrl+Shift+P',
        },
      ],
    },
    submenus: {
      admin: {
        id: 'admin-menu',
        title: 'Administration',
        items: [
          {
            id: 'restart',
            label: 'Restart Backend',
            command: 'templum.restartBackend',
            shortcuts: ['Ctrl+Alt+R'],
          },
        ],
      },
    },
  },
  commands: {
    primary: [
      {
        id: 'haruspex.analyze',
        title: 'Analyze Project',
        description: 'Run the Haruspex analysis pipeline on the current workspace.',
        handler: 'haruspex.analysis.start',
        parameters: [],
      },
      {
        id: 'haruspex.viewPredictions',
        title: 'View Predictions',
        description: 'Display analysis predictions and suggestions.',
        handler: 'haruspex.analysis.view',
        parameters: [],
      },
    ],
  },
  shortcuts: {
    'Ctrl+Alt+S': 'templum.openSettings',
  },
});

class StubSessionManager implements TemplumSessionManagerContract {
  private snapshot: TemplumSessionState;

  constructor() {
    const metrics: TemplumSessionMetrics = {
      interfaceSwitches: 0,
      backendInteractions: 0,
      commandsExecuted: 0,
      sessionsCreated: 1,
      totalSkinLoads: 0,
      averageSwitchTime: 0,
      completion: {
        completed: false,
      },
    };

    this.snapshot = {
      sessionId: 'session-1',
      startTime: new Date(),
      activeInterface: 'cli',
      preferences: {},
      capabilities: [],
      activeBackends: [],
      loadedSkins: [],
      interfaceHistory: ['cli'],
      sessionMetrics: metrics,
      lastActivity: new Date(),
      navigationHistory: [],
      commandHistory: [],
      interactionMode: 'menu',
      currentMenu: 'main-menu',
    };
  }

  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  attachOrchestrator(): void {
    // no-op for tests
  }

  async ensureSessionForInterface(): Promise<string> {
    return 'session-1';
  }

  getActiveSessionId(): string | null {
    return 'session-1';
  }

  getSessionSnapshot(): TemplumSessionState | null {
    return this.snapshot;
  }

  async updateSessionState(update: SessionStateUpdate): Promise<void> {
    this.snapshot = {
      ...this.snapshot,
      navigationHistory: update.state.navigationStack ?? this.snapshot.navigationHistory,
      currentMenu: update.state.currentMenu ?? this.snapshot.currentMenu,
      interactionMode: update.state.interactionMode ?? this.snapshot.interactionMode ?? 'menu',
      commandHistory: update.state.commandHistory ?? this.snapshot.commandHistory,
      lastActivity: new Date(),
    };
  }

  async registerInterfaceAdapter(): Promise<void> {
    return Promise.resolve();
  }

  async syncInterfaces(): Promise<void> {
    return Promise.resolve();
  }

  notifyInterfaceDisconnect(): void {
    // no-op for tests
  }

  on(): void {
    // unused in tests
  }

  off(): void {
    // unused in tests
  }
}

class StubOrchestrator implements ITemplumOrchestrator {
  private readonly sessionManager: TemplumSessionManagerContract;

  constructor(sessionManager: TemplumSessionManagerContract) {
    this.sessionManager = sessionManager;
  }

  isInitialized(): boolean {
    return true;
  }

  getSupportedInterfaces(): Array<'cli'> {
    return ['cli'];
  }

  async registerInterface(_interfaceType: 'cli', _adapter: InterfaceAdapter): Promise<void> {
    return Promise.resolve();
  }

  async loadSkin(): Promise<void> {
    return Promise.resolve();
  }

  async loadBackendSkin(): Promise<UniversalSkinDefinition | null> {
    return Promise.resolve(null);
  }

  async executeCommand(command: string): Promise<CommandResult> {
    return Promise.resolve({
      success: true,
      message: `Executed ${command}`,
      data: null,
      timestamp: Date.now(),
      executionTime: 0,
    });
  }

  getSystemStatus(): TemplumSystemStatus {
    return {
      health: 'healthy',
      activeBackends: [],
      activeInterfaces: ['cli'],
      coreEngine: {
        initialized: true,
        activeInterfaces: ['cli'],
        loadedSkins: [],
        backendConnections: { totalConnections: 0, healthyConnections: 0, backends: {} },
      },
      stateManager: {
        synchronized: true,
        globalState: {},
        sessionState: {},
        subscribers: 0,
        historySize: 0,
        persistence: null,
      },
      skinEngine: {
        cachedSkins: 0,
        renderers: {},
        performance: { averageRenderTime: 0, cacheHitRate: 0 },
      },
      performance: {
        memory: { heapUsed: 0, rss: 0 },
        cpu: { user: 0, system: 0 },
        interfaces: {},
      },
    };
  }

  getLoadedSkins(): UniversalSkinDefinition[] {
    return [];
  }

  async refreshBackendServices(): Promise<void> {
    return Promise.resolve();
  }

  getUniversalSkinEngine() {
    return {
      async renderForInterface() {
        return { success: true, renderedContent: {} };
      },
    } as any;
  }

  getBackendRouter(): any {
    return {};
  }

  getResourceManager(): any {
    return {};
  }

  getSessionManager(): TemplumSessionManagerContract {
    return this.sessionManager;
  }

  async applyManualOverride(serviceId: string, _options?: ManualOverrideOptions): Promise<ManualOverrideDescriptor> {
    return {
      serviceId,
      scope: 'session',
      appliedAt: Date.now(),
    };
  }

  async clearManualOverride(): Promise<ManualOverrideClearResult> {
    return {
      descriptor: undefined,
      snapshot: this.getManualOverrideSnapshot(),
    };
  }

  getManualOverrideSnapshot(): ManualOverrideSnapshot {
    return {
      overrides: [],
      updatedAt: Date.now(),
    };
  }

  async shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

describe('CLI generator integration', () => {
  it('buildCLIMenuModel produces menu graph and bindings from skin metadata', () => {
    const skin = createTestSkin();
    const model = buildCLIMenuModel(skin);

    expect(model.skinId).toBe(skin.metadata.id);
    expect(model.defaultMenuId).toBe('main-menu');
    expect(Object.keys(model.menuGraph)).toContain('admin-menu');

    const analyzeBinding = model.commandBindings.find((binding) => binding.commandId === 'haruspex.analyze');
    expect(analyzeBinding).toBeDefined();
    expect(analyzeBinding?.shortcuts).toContain('Ctrl+Shift+A');

    const shortcutKeys = model.shortcuts.map((shortcut) => shortcut.key);
    expect(shortcutKeys).toEqual(expect.arrayContaining(['Ctrl+Shift+A', 'Ctrl+Shift+P', 'Ctrl+Alt+R']));
  });

  it('CLIInterfaceAdapter.applySkin hydrates keyboard shortcuts from skin metadata', async () => {
    const skin = createTestSkin();
    const sessionManager = new StubSessionManager();
    const orchestrator = new StubOrchestrator(sessionManager);
    const adapter = new CLIInterfaceAdapter({ enableKeyboardShortcuts: true });

    await adapter.initialize(orchestrator);
    await adapter.applySkin(skin);

    const model = adapter.getGeneratedMenuModel();
    expect(model).not.toBeNull();
    expect(model?.commandBindings.length).toBeGreaterThan(0);

    const shortcutMap = (adapter as unknown as { keyboardShortcuts: Map<string, string> }).keyboardShortcuts;
    expect(shortcutMap.get('Ctrl+Shift+A')).toBe('haruspex.analyze');
    expect(shortcutMap.get('Ctrl+Shift+P')).toBe('haruspex.viewPredictions');
    expect(shortcutMap.size).toBeGreaterThanOrEqual(2);
  });
});

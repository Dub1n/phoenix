import { jest } from '@jest/globals';
import * as vscode from 'vscode';
import { TemplumUniversalWebViewProvider } from '../../interfaces/vscode-templum-webview';

function createCoreInstance(overrides: Partial<CoreInstance> = {}): CoreInstance {
  const defaultRouter = {
    getConnectionStatus: jest.fn(() => ({
      totalConnections: 0,
      healthyConnections: 0,
      backends: {}
    })),
    isServiceAvailable: jest.fn(async () => false),
    discoverAndConnect: jest.fn(async () => undefined)
  };

  const instance = {
    initialize: jest.fn(async () => undefined),
    getBackendRouter: jest.fn(() => defaultRouter),
    refreshBackendServices: jest.fn(async () => undefined),
    getSystemStatus: jest.fn(async () => ({
      coreEngine: {
        backendConnections: {
          healthyConnections: 0,
          totalConnections: 0,
          backends: {}
        },
        activeInterfaces: []
      }
    })),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),
    once: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    shutdown: jest.fn(async () => undefined),
    loadBackendSkin: jest.fn(),
    getUniversalSkinEngine: jest.fn(),
    getBackendRouterInstance: defaultRouter,
    ...overrides
  };

  // Maintain consistent router return when overridden
  if (overrides.getBackendRouter) {
    instance.getBackendRouter = overrides.getBackendRouter;
  }

  return instance;
}

function createConfigManagerInstance(): ConfigManagerInstance {
  return {
    initialize: jest.fn(async () => undefined),
    getConfig: jest.fn(() => ({
      session: {},
      performance: {},
      backendDiscovery: {}
    }))
  };
}

function createObservabilityInstance(): ObservabilityInstance {
  return {
    initialize: jest.fn(async () => undefined),
    logError: jest.fn(),
    logWarn: jest.fn(),
    logInfo: jest.fn(),
    shutdown: jest.fn(async () => undefined)
  };
}

const templumCoreConstructorMock = jest.fn();
const templumConfigManagerConstructorMock = jest.fn();
const createObservabilityAdapterMock = jest.fn();

type CoreInstance = ReturnType<typeof createCoreInstance>;
type ConfigManagerInstance = ReturnType<typeof createConfigManagerInstance>;
type ObservabilityInstance = ReturnType<typeof createObservabilityInstance>;

jest.mock('../../core/templum-core', () => ({
  TemplumCore: templumCoreConstructorMock
}));

jest.mock('../../core/templum-config-manager', () => ({
  TemplumConfigManager: templumConfigManagerConstructorMock
}));

jest.mock('../../observability/observability-adapter', () => ({
  createObservabilityAdapter: createObservabilityAdapterMock,
  ObservabilityAdapter: class {}
}));

describe('VSCode extension activation', () => {
  let registerProviderMock: jest.Mock;
  let createTreeViewMock: jest.Mock;
  let coreInstance: CoreInstance;
  let configManagerInstance: ConfigManagerInstance;
  let observabilityInstance: ObservabilityInstance;

  const createExtensionContext = (): vscode.ExtensionContext => {
    return {
      subscriptions: [],
      extensionUri: vscode.Uri.file('/workspace')
    } as unknown as vscode.ExtensionContext;
  };

  const loadExtension = async (context: vscode.ExtensionContext) => {
    await jest.isolateModulesAsync(async () => {
      const extension = await import('../../extension');
      await extension.activate(context);
    });
  };

  beforeEach(() => {
    templumCoreConstructorMock.mockReset();
    templumConfigManagerConstructorMock.mockReset();
    createObservabilityAdapterMock.mockReset();

    (vscode.workspace as any).workspaceFolders = [];

    registerProviderMock = jest.fn(() => ({ dispose: jest.fn() }));
    createTreeViewMock = jest.fn(() => ({
      onDidChangeSelection: jest.fn(),
      onDidChangeVisibility: jest.fn(),
      dispose: jest.fn()
    }));

    (vscode.window as any).registerWebviewViewProvider = registerProviderMock;
    (vscode.window as any).createTreeView = createTreeViewMock;
    (vscode.window.showInformationMessage as jest.Mock).mockClear();
    (vscode.window.showWarningMessage as jest.Mock).mockClear();
    (vscode.window.showErrorMessage as jest.Mock).mockClear();
    const vscodeModule = jest.requireMock('vscode') as any;
    vscodeModule.TreeItem = class {
      label?: string;
      collapsibleState?: unknown;
      constructor(label?: string, collapsibleState?: unknown) {
        this.label = label;
        this.collapsibleState = collapsibleState;
      }
    };
    vscodeModule.TreeItemCollapsibleState = {
      None: 0,
      Collapsed: 1,
      Expanded: 2
    };
    vscodeModule.EventEmitter = class<T> {
      private listeners: Array<(value: T) => void> = [];
      event = (listener: (value: T) => void) => {
        this.listeners.push(listener);
        return { dispose: jest.fn() };
      };
      fire = (value?: T) => {
        this.listeners.forEach((listener) => listener(value as T));
      };
      dispose = () => {
        this.listeners = [];
      };
    };
    (vscode as any).TreeItem = vscodeModule.TreeItem;
    (vscode as any).TreeItemCollapsibleState = vscodeModule.TreeItemCollapsibleState;
    (vscode as any).EventEmitter = vscodeModule.EventEmitter;
    (vscode.commands.registerCommand as jest.Mock).mockImplementation(() => ({ dispose: jest.fn() }));

    configManagerInstance = createConfigManagerInstance();
    templumConfigManagerConstructorMock.mockImplementation(() => configManagerInstance);

    coreInstance = createCoreInstance();
    templumCoreConstructorMock.mockImplementation(() => coreInstance);

    observabilityInstance = createObservabilityInstance();
    createObservabilityAdapterMock.mockReturnValue(observabilityInstance);
  });

  it('registers placeholder providers when no workspace folder is open', async () => {
    const context = createExtensionContext();
    await loadExtension(context);

    expect(registerProviderMock).toHaveBeenCalledTimes(3);
    const registeredProviders = registerProviderMock.mock.calls.map(([, provider]) => provider);
    registeredProviders.forEach((provider) => {
      expect(provider).not.toBeInstanceOf(TemplumUniversalWebViewProvider);
    });

    expect(templumCoreConstructorMock).not.toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'Templum activated in limited mode. Open a workspace folder for full functionality.'
    );
  });

  it('registers real providers and wires core events when workspace is available', async () => {
    (vscode.workspace as any).workspaceFolders = [
      { uri: { fsPath: '/workspace', path: '/workspace' } }
    ];

    const backendStatus = {
      totalConnections: 1,
      healthyConnections: 1,
      backends: {
        haruspex: {
          connected: true,
          health: 'healthy',
          responseTime: 42
        }
      }
    };

    const backendRouter = {
      getConnectionStatus: jest.fn(() => backendStatus),
      isServiceAvailable: jest.fn(async () => true),
      discoverAndConnect: jest.fn(async () => undefined)
    };

    coreInstance = createCoreInstance({
      getBackendRouter: jest.fn(() => backendRouter)
    });
    templumCoreConstructorMock.mockImplementation(() => coreInstance);

    const context = createExtensionContext();
    await loadExtension(context);

    expect(registerProviderMock).toHaveBeenCalledTimes(3);
    const providers = registerProviderMock.mock.calls.map(([, provider]) => provider);
    providers.forEach((provider) => {
      expect(provider.constructor.name).toBe('TemplumUniversalWebViewProvider');
      expect(typeof provider.refresh).toBe('function');
    });

    expect(coreInstance.initialize).toHaveBeenCalledTimes(1);
    expect(coreInstance.on).toHaveBeenCalledWith('backend-services-refreshed', expect.any(Function));
    expect(coreInstance.on).toHaveBeenCalledWith('backend-refresh-error', expect.any(Function));
    expect(coreInstance.on).toHaveBeenCalledWith('commandError', expect.any(Function));

    const universalCall = registerProviderMock.mock.calls.find(
      ([viewId]) => viewId === 'templum.universalInterface'
    );
    expect(universalCall).toBeDefined();

    const universalProvider = universalCall![1] as TemplumUniversalWebViewProvider;
    const postMessage = jest.fn().mockResolvedValue(undefined);
    const webviewView = {
      webview: {
        options: {},
        html: '',
        postMessage,
        onDidReceiveMessage: jest.fn()
      }
    } as unknown as vscode.WebviewView;

    universalProvider.resolveWebviewView(webviewView);
    expect(webviewView.webview.html).toContain('<!doctype html>');
  });

  it('falls back to placeholder providers and logs when core initialization fails', async () => {
    (vscode.workspace as any).workspaceFolders = [
      { uri: { fsPath: '/workspace', path: '/workspace' } }
    ];

    const failure = new Error('failed to initialize');

    coreInstance = createCoreInstance({
      initialize: jest.fn(async () => {
        throw failure;
      })
    });
    templumCoreConstructorMock.mockImplementation(() => coreInstance);

    const context = createExtensionContext();
    await loadExtension(context);

    expect(registerProviderMock).toHaveBeenCalledTimes(3);
    const providers = registerProviderMock.mock.calls.map(([, provider]) => provider);
    providers.forEach((provider) => {
      expect(provider).not.toBeInstanceOf(TemplumUniversalWebViewProvider);
    });

    expect(observabilityInstance.logError).toHaveBeenCalledWith(
      'Templum Core engine initialization failed',
      failure,
      { stage: 'initialize' },
      'VSCodeExtension'
    );
  });
});

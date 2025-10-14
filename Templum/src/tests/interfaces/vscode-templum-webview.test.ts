import { jest } from '@jest/globals';
import * as vscode from 'vscode';
import { TemplumUniversalWebViewProvider } from '../../interfaces/vscode-templum-webview';

interface WebviewMocks {
  view: vscode.WebviewView;
  postMessage: jest.Mock;
}

function createCoreStub(connectionStatus?: unknown, availability: Record<string, boolean> = {}) {
  const router = {
    getConnectionStatus: jest.fn(() => connectionStatus),
    isServiceAvailable: jest.fn(async (backendId: string) => availability[backendId] ?? false)
  };

  return {
    getBackendRouter: jest.fn(() => router)
  } as unknown as any;
}

function createWebviewMocks(): WebviewMocks {
  const postMessage = jest.fn().mockResolvedValue(undefined);
  const webview = {
    options: {},
    html: '',
    postMessage,
    onDidReceiveMessage: jest.fn()
  } as unknown as vscode.Webview;

  const view = {
    webview
  } as unknown as vscode.WebviewView;

  return { view, postMessage };
}

function createContext(): vscode.ExtensionContext {
  return {
    subscriptions: [],
    extensionUri: vscode.Uri.file('/workspace')
  } as unknown as vscode.ExtensionContext;
}

describe('TemplumUniversalWebViewProvider.refresh', () => {
  it('guards missing connection status and posts empty payload', async () => {
    const context = createContext();
    const templumCore = createCoreStub(undefined);
    const provider = new TemplumUniversalWebViewProvider(context, templumCore);

    (provider as any).emitMetricsSignal = jest.fn();
    (provider as any).emitErrorSignal = jest.fn();

    const { view, postMessage } = createWebviewMocks();
    provider.resolveWebviewView(view);

    postMessage.mockClear();
    await provider.refresh();

    expect(postMessage).toHaveBeenCalledWith({
      type: 'update',
      payload: expect.objectContaining({
        backendData: { backends: [] },
        timestamp: expect.any(Number)
      })
    });

    expect((provider as any).emitErrorSignal).toHaveBeenCalledWith(
      'backend_status_missing',
      expect.any(Error),
      expect.objectContaining({ reason: 'missing-status' })
    );
  });

  it('handles partial backend data without throwing and reports metrics', async () => {
    const context = createContext();
    const connectionStatus = {
      backends: {
        haruspex: {
          connected: true,
          health: 'healthy',
          responseTime: 120
        }
      }
    };

    const templumCore = createCoreStub(connectionStatus, { haruspex: true });
    const provider = new TemplumUniversalWebViewProvider(context, templumCore);

    const metricsSpy = jest.fn();
    const errorSpy = jest.fn();
    (provider as any).emitMetricsSignal = metricsSpy;
    (provider as any).emitErrorSignal = errorSpy;

    const { view, postMessage } = createWebviewMocks();
    provider.resolveWebviewView(view);

    postMessage.mockClear();
    await provider.refresh();

    expect(postMessage).toHaveBeenCalledWith({
      type: 'update',
      payload: expect.objectContaining({
        backendData: {
          backends: [
            expect.objectContaining({
              id: 'haruspex',
              status: 'connected',
              health: 'healthy'
            })
          ]
        }
      })
    });

    expect(metricsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'backend_data_loaded',
        total_backends: 1,
        connected_backends: 1
      })
    );

    expect(errorSpy).not.toHaveBeenCalledWith(
      'backend_data_partial_failure',
      expect.anything(),
      expect.anything()
    );
  });
});

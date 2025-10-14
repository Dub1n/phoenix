import * as vscode from 'vscode';

export type TemplumWebviewId =
  | 'templum.universalInterface'
  | 'templum.serviceStatus'
  | 'templum.sessionManager';

export type WebviewProviderKind = 'real' | 'placeholder';

export interface RefreshableWebviewProvider extends vscode.WebviewViewProvider {
  refresh?: () => Promise<void> | void;
}

interface RegistryEntry {
  provider: RefreshableWebviewProvider;
  kind: WebviewProviderKind;
  disposable: vscode.Disposable;
}

export interface WebviewProviderRecord {
  id: TemplumWebviewId;
  provider: RefreshableWebviewProvider;
  kind: WebviewProviderKind;
}

/**
 * Central registry that tracks the VSCode WebView providers used by the
 * Templum extension. Consumers can refresh providers deterministically and
 * introspect which variants (real vs placeholder) are active.
 */
export class WebviewProviderRegistry implements vscode.Disposable {
  private readonly entries = new Map<TemplumWebviewId, RegistryEntry>();

  constructor(private readonly context: vscode.ExtensionContext) {}

  register(
    id: TemplumWebviewId,
    provider: RefreshableWebviewProvider,
    kind: WebviewProviderKind
  ): void {
    const existing = this.entries.get(id);
    if (existing) {
      existing.disposable.dispose();
    }

    const disposable = vscode.window.registerWebviewViewProvider(id, provider);
    this.entries.set(id, { provider, kind, disposable });
    this.context.subscriptions.push(disposable);
  }

  get(id: TemplumWebviewId): WebviewProviderRecord | undefined {
    const entry = this.entries.get(id);
    if (!entry) {
      return undefined;
    }

    return {
      id,
      provider: entry.provider,
      kind: entry.kind
    };
  }

  list(): WebviewProviderRecord[] {
    return Array.from(this.entries.entries()).map(([id, entry]) => ({
      id,
      provider: entry.provider,
      kind: entry.kind
    }));
  }

  async refresh(ids?: TemplumWebviewId[]): Promise<void> {
    const targets = ids ? ids : (Array.from(this.entries.keys()) as TemplumWebviewId[]);
    await Promise.all(
      targets.map(async (id) => {
        const entry = this.entries.get(id);
        if (!entry) {
          return;
        }

        const maybePromise = entry.provider.refresh?.();
        if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
          await maybePromise;
        }
      })
    );
  }

  dispose(): void {
    for (const entry of this.entries.values()) {
      entry.disposable.dispose();
    }
    this.entries.clear();
  }
}

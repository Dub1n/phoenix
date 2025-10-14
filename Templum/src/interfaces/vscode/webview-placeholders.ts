import * as vscode from 'vscode';
import type { RefreshableWebviewProvider } from './webview-registry';

type PlaceholderType = 'universalInterface' | 'serviceStatus' | 'sessionManager';

const TITLES: Record<PlaceholderType, string> = {
  universalInterface: 'Universal Interface',
  serviceStatus: 'Service Status',
  sessionManager: 'Session Manager'
};

const DESCRIPTIONS: Record<PlaceholderType, string> = {
  universalInterface: 'Unified interface to all backend services',
  serviceStatus: 'Real-time backend service health monitoring',
  sessionManager: 'Manage sessions across interface modes'
};

export function createPlaceholderWebViewProvider(
  context: vscode.ExtensionContext,
  type: PlaceholderType,
  engineReady: boolean
): RefreshableWebviewProvider {
  return {
    resolveWebviewView: (webviewView: vscode.WebviewView) => {
      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [context.extensionUri]
      };

      webviewView.webview.html = generatePlaceholderHtml(type, engineReady);

      webviewView.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case 'reload':
            void vscode.commands.executeCommand('workbench.action.reloadWindow');
            break;
          case 'openFolder':
            void vscode.commands.executeCommand('vscode.openFolder');
            break;
          default:
            break;
        }
      });
    }
  };
}

function generatePlaceholderHtml(type: PlaceholderType, engineReady: boolean): string {
  if (!engineReady) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: var(--vscode-font-family);
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      margin: 0;
      padding: 1.5rem;
    }
    h1 {
      font-size: 1.4rem;
      margin-bottom: 0.5rem;
    }
    p {
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <h1>${TITLES[type]}</h1>
  <p>${DESCRIPTIONS[type]}</p>
  <p>Open a workspace folder to unlock the full Templum experience.</p>
  <div class="actions">
    <button data-action="open-folder">Open Folder</button>
    <button data-action="reload">Reload Window</button>
  </div>
  <script>
    const vscodeApi = acquireVsCodeApi();
    function announceReady() {
      vscodeApi.postMessage({ type: 'templum:webview_ready', payload: { placeholder: true } });
    }
    window.addEventListener('DOMContentLoaded', announceReady);
    window.addEventListener('load', announceReady);
    document.querySelectorAll('button[data-action]').forEach((button) => {
      button.addEventListener('click', (event) => {
        const action = event.currentTarget.getAttribute('data-action');
        if (action === 'open-folder') {
          vscodeApi.postMessage({ type: 'openFolder' });
        } else if (action === 'reload') {
          vscodeApi.postMessage({ type: 'reload' });
        }
      });
    });
  </script>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: var(--vscode-font-family);
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      margin: 0;
      padding: 1.5rem;
    }
    h1 {
      font-size: 1.3rem;
      margin-bottom: 0.75rem;
    }
    .message {
      border: 1px solid var(--vscode-input-border);
      padding: 1rem;
      border-radius: 6px;
      background: var(--vscode-sideBar-background);
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <h1>${TITLES[type]}</h1>
  <div class="message">
    <p>${DESCRIPTIONS[type]}</p>
    <p>Templum is preparing the interface. This view will refresh automatically.</p>
  </div>
  <script>
    const vscodeApi = acquireVsCodeApi();
    window.addEventListener('DOMContentLoaded', () => {
      vscodeApi.postMessage({ type: 'templum:webview_ready', payload: { placeholder: false } });
    });
  </script>
</body>
</html>`;
}

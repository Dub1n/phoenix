/**
 * VSCode Interface Adapter
 * 
 * Implements VSCode-specific interface integration using PCL patterns and 
 * Universal Registry infrastructure. Provides TreeView, WebView, and Command integration.
 * 
 * Dependencies: Command Registry, Menu Registry, Session Context Foundation
 * Performance Target: <100ms interface switching from Phase 2
 * 
 * Generated: 2025-08-21
 */

import { EventEmitter } from 'events';
import { UniversalCommandRegistry } from '../commands/universal-command-registry';
import { UniversalMenuRegistry } from '../menus/universal-menu-registry';
import { SessionContextFoundation } from '../session/session-context-foundation';

export interface VSCodeAdapter {
  type: 'vscode';
  initialize(): Promise<boolean>;
  render(menuData: any): Promise<VSCodeRenderResult>;
  handleInput(input: VSCodeInput): Promise<VSCodeInputResult>;
  cleanup(): Promise<boolean>;
}

export interface VSCodeRenderResult {
  success: boolean;
  treeViewData?: TreeViewNode[];
  webViewHtml?: string;
  commandRegistrations?: VSCodeCommand[];
  statusBarItems?: StatusBarItem[];
  errors?: string[];
}

export interface VSCodeInput {
  type: 'command' | 'treeViewClick' | 'webViewMessage';
  command?: string;
  parameters?: Record<string, any>;
  nodeId?: string;
  message?: any;
}

export interface VSCodeInputResult {
  handled: boolean;
  result?: any;
  errors?: string[];
}

export interface TreeViewNode {
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  collapsibleState: TreeItemCollapsibleState;
  iconPath?: string | { light: string; dark: string };
  command?: VSCodeCommand;
  children?: TreeViewNode[];
  contextValue?: string;
}

export interface VSCodeCommand {
  command: string;
  title: string;
  category?: string;
  arguments?: any[];
  enablement?: string;
}

export interface StatusBarItem {
  id: string;
  text: string;
  tooltip?: string;
  command?: string;
  alignment: StatusBarAlignment;
  priority?: number;
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2
}

export enum StatusBarAlignment {
  Left = 1,
  Right = 2
}

export interface VSCodeAdapterConfig {
  enableTreeView: boolean;
  enableWebView: boolean;
  enableStatusBar: boolean;
  enableCommandPalette: boolean;
  webViewRetainContextWhenHidden: boolean;
  treeViewRefreshInterval?: number;
}

/**
 * VSCode Interface Adapter Implementation
 * Integrates Templum with VSCode extension API using established patterns
 */
export class VSCodeInterfaceAdapter extends EventEmitter implements VSCodeAdapter {
  type: 'vscode' = 'vscode';
  
  private commandRegistry: UniversalCommandRegistry;
  private menuRegistry: UniversalMenuRegistry;
  private sessionContext: SessionContextFoundation;
  private config: VSCodeAdapterConfig;
  private isInitialized = false;
  private registeredCommands = new Set<string>();
  private treeViewProvider: any = null;
  private webViewPanel: any = null;
  private statusBarItems = new Map<string, any>();

  constructor(
    commandRegistry: UniversalCommandRegistry,
    menuRegistry: UniversalMenuRegistry,
    sessionContext: SessionContextFoundation,
    config?: Partial<VSCodeAdapterConfig>
  ) {
    super();
    this.commandRegistry = commandRegistry;
    this.menuRegistry = menuRegistry;
    this.sessionContext = sessionContext;
    this.config = {
      enableTreeView: true,
      enableWebView: true,
      enableStatusBar: true,
      enableCommandPalette: true,
      webViewRetainContextWhenHidden: true,
      treeViewRefreshInterval: 5000,
      ...config
    };
  }

  /**
   * Initialize VSCode interface adapter
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Register core VSCode commands
      await this.registerCoreCommands();

      // Setup TreeView provider if enabled
      if (this.config.enableTreeView) {
        await this.setupTreeViewProvider();
      }

      // Setup WebView panel if enabled
      if (this.config.enableWebView) {
        await this.setupWebViewPanel();
      }

      // Setup status bar items if enabled
      if (this.config.enableStatusBar) {
        await this.setupStatusBar();
      }

      // Setup event handlers
      this.setupEventHandlers();

      this.isInitialized = true;
      this.emit('initialized');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize VSCode adapter:', error);
      return false;
    }
  }

  /**
   * Render menu data for VSCode interface
   */
  async render(menuData: any): Promise<VSCodeRenderResult> {
    if (!this.isInitialized) {
      return { success: false, errors: ['Adapter not initialized'] };
    }

    try {
      const result: VSCodeRenderResult = { success: true };

      // Generate TreeView data
      if (this.config.enableTreeView && menuData) {
        result.treeViewData = await this.generateTreeViewData(menuData);
      }

      // Generate WebView HTML
      if (this.config.enableWebView && menuData) {
        result.webViewHtml = await this.generateWebViewHtml(menuData);
      }

      // Generate command registrations
      if (this.config.enableCommandPalette && menuData) {
        result.commandRegistrations = await this.generateCommandRegistrations(menuData);
      }

      // Generate status bar items
      if (this.config.enableStatusBar) {
        result.statusBarItems = await this.generateStatusBarItems(menuData);
      }

      this.emit('rendered', result);
      return result;

    } catch (error) {
      console.error('Failed to render VSCode interface:', error);
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown render error'] 
      };
    }
  }

  /**
   * Handle VSCode input events
   */
  async handleInput(input: VSCodeInput): Promise<VSCodeInputResult> {
    try {
      switch (input.type) {
        case 'command':
          return await this.handleCommandInput(input);
        case 'treeViewClick':
          return await this.handleTreeViewClick(input);
        case 'webViewMessage':
          return await this.handleWebViewMessage(input);
        default:
          return { handled: false, errors: [`Unknown input type: ${input.type}`] };
      }
    } catch (error) {
      console.error('Failed to handle VSCode input:', error);
      return { 
        handled: false, 
        errors: [error instanceof Error ? error.message : 'Unknown input error'] 
      };
    }
  }

  /**
   * Cleanup VSCode adapter resources
   */
  async cleanup(): Promise<boolean> {
    try {
      // Dispose TreeView provider
      if (this.treeViewProvider?.dispose) {
        this.treeViewProvider.dispose();
      }

      // Dispose WebView panel
      if (this.webViewPanel?.dispose) {
        this.webViewPanel.dispose();
      }

      // Dispose status bar items
      for (const item of this.statusBarItems.values()) {
        if (item.dispose) {
          item.dispose();
        }
      }

      // Clear registrations
      this.registeredCommands.clear();
      this.statusBarItems.clear();
      this.removeAllListeners();

      this.isInitialized = false;
      this.emit('cleanup');

      return true;
    } catch (error) {
      console.error('Failed to cleanup VSCode adapter:', error);
      return false;
    }
  }

  /**
   * Register core VSCode commands
   */
  private async registerCoreCommands(): Promise<void> {
    const coreCommands = [
      {
        command: 'templum.refreshTreeView',
        title: 'Refresh Tree View',
        handler: () => this.refreshTreeView()
      },
      {
        command: 'templum.openWebView',
        title: 'Open Web View',
        handler: () => this.openWebView()
      },
      {
        command: 'templum.executeCommand',
        title: 'Execute Command',
        handler: (commandId: string, args?: any[]) => this.executeTemplumCommand(commandId, args)
      }
    ];

    for (const cmd of coreCommands) {
      await this.registerCommand(cmd.command, cmd.handler);
    }
  }

  /**
   * Register a VSCode command
   */
  private async registerCommand(command: string, _handler: (...args: any[]) => any): Promise<void> {
    if (this.registeredCommands.has(command)) return;

    // In real VSCode extension, this would use vscode.commands.registerCommand
    // For now, we'll simulate the registration
    this.registeredCommands.add(command);
    this.emit('commandRegistered', command);
  }

  /**
   * Setup TreeView provider
   */
  private async setupTreeViewProvider(): Promise<void> {
    // Create TreeView data provider
    this.treeViewProvider = {
      getTreeItem: (element: TreeViewNode) => element,
      getChildren: async (element?: TreeViewNode) => {
        if (!element) {
          // Root nodes
          return await this.getRootTreeViewNodes();
        }
        return element.children || [];
      },
      refresh: () => this.emit('treeViewRefresh'),
      dispose: () => this.emit('treeViewDisposed')
    };

    this.emit('treeViewProviderSetup');
  }

  /**
   * Setup WebView panel
   */
  private async setupWebViewPanel(): Promise<void> {
    // Create WebView panel configuration
    this.webViewPanel = {
      webview: {
        html: '<html><body><h1>Templum WebView</h1></body></html>',
        onDidReceiveMessage: (message: any) => {
          this.handleInput({
            type: 'webViewMessage',
            message
          });
        }
      },
      onDidDispose: () => {
        this.webViewPanel = null;
        this.emit('webViewDisposed');
      },
      dispose: () => this.emit('webViewDisposed')
    };

    this.emit('webViewPanelSetup');
  }

  /**
   * Setup status bar items
   */
  private async setupStatusBar(): Promise<void> {
    const statusItems = [
      {
        id: 'templum.status',
        text: '$(symbol-misc) Templum',
        tooltip: 'Templum Interface Engine',
        command: 'templum.openWebView',
        alignment: StatusBarAlignment.Right,
        priority: 100
      }
    ];

    for (const item of statusItems) {
      const statusBarItem = {
        text: item.text,
        tooltip: item.tooltip,
        command: item.command,
        show: () => this.emit('statusBarItemShown', item.id),
        hide: () => this.emit('statusBarItemHidden', item.id),
        dispose: () => this.emit('statusBarItemDisposed', item.id)
      };

      this.statusBarItems.set(item.id, statusBarItem);
      statusBarItem.show();
    }

    this.emit('statusBarSetup');
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Listen for menu updates
    this.menuRegistry.on('menusLoaded', async () => {
      await this.refreshTreeView();
    });

    // Listen for session changes
    this.sessionContext.on('activeSessionChanged', async (sessionId) => {
      await this.updateContextForSession(sessionId);
    });

    // Setup periodic refresh if configured
    if (this.config.treeViewRefreshInterval) {
      setInterval(() => {
        this.refreshTreeView();
      }, this.config.treeViewRefreshInterval);
    }
  }

  /**
   * Generate TreeView data from menu data
   */
  private async generateTreeViewData(menuData: any): Promise<TreeViewNode[]> {
    const nodes: TreeViewNode[] = [];

    if (menuData.sections) {
      for (const section of menuData.sections) {
        const sectionNode: TreeViewNode = {
          id: section.id,
          label: section.heading,
          collapsibleState: TreeItemCollapsibleState.Expanded,
          iconPath: '$(folder)',
          children: []
        };

        for (const item of section.items) {
          const itemNode: TreeViewNode = {
            id: item.id,
            label: item.label,
            description: item.description,
            tooltip: item.description || item.label,
            collapsibleState: TreeItemCollapsibleState.None,
            iconPath: this.getIconForActionType(item.action?.type),
            command: item.action?.target ? {
              command: 'templum.executeCommand',
              title: item.label,
              arguments: [item.action.target]
            } : undefined,
            contextValue: 'menuItem'
          };

          sectionNode.children!.push(itemNode);
        }

        nodes.push(sectionNode);
      }
    }

    return nodes;
  }

  /**
   * Generate WebView HTML from menu data
   */
  private async generateWebViewHtml(menuData: any): Promise<string> {
    const title = menuData.title || 'Templum Menu';
    const subtitle = menuData.subtitle || '';

    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { 
            font-family: var(--vscode-font-family); 
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
          }
          .menu-title { 
            color: var(--vscode-textLink-foreground);
            font-size: 1.5em;
            margin-bottom: 10px;
          }
          .menu-subtitle {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 20px;
          }
          .menu-section {
            margin-bottom: 20px;
          }
          .section-heading {
            color: var(--vscode-textLink-foreground);
            font-weight: bold;
            margin-bottom: 10px;
          }
          .menu-item {
            margin: 5px 0;
            padding: 8px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            cursor: pointer;
          }
          .menu-item:hover {
            background-color: var(--vscode-list-hoverBackground);
          }
          .item-label {
            font-weight: bold;
          }
          .item-description {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="menu-title">${title}</div>
        ${subtitle ? `<div class="menu-subtitle">${subtitle}</div>` : ''}
    `;

    if (menuData.sections) {
      for (const section of menuData.sections) {
        html += `
          <div class="menu-section">
            <div class="section-heading">${section.heading}</div>
        `;

        for (const item of section.items) {
          html += `
            <div class="menu-item" onclick="executeCommand('${item.action?.target || item.id}')">
              <div class="item-label">${item.label}</div>
              ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
            </div>
          `;
        }

        html += '</div>';
      }
    }

    html += `
        <script>
          const vscode = acquireVsCodeApi();
          
          function executeCommand(command) {
            vscode.postMessage({
              command: 'execute',
              value: command
            });
          }
        </script>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generate command registrations from menu data
   */
  private async generateCommandRegistrations(menuData: any): Promise<VSCodeCommand[]> {
    const commands: VSCodeCommand[] = [];

    if (menuData.sections) {
      for (const section of menuData.sections) {
        for (const item of section.items) {
          if (item.action?.target) {
            commands.push({
              command: `templum.${item.action.target}`,
              title: item.label,
              category: 'Templum'
            });
          }
        }
      }
    }

    return commands;
  }

  /**
   * Generate status bar items
   */
  private async generateStatusBarItems(menuData: any): Promise<StatusBarItem[]> {
    return [
      {
        id: 'templum.status',
        text: `$(symbol-misc) ${menuData.title || 'Templum'}`,
        tooltip: menuData.subtitle || 'Templum Interface Engine',
        command: 'templum.openWebView',
        alignment: StatusBarAlignment.Right,
        priority: 100
      }
    ];
  }

  // Event handlers
  private async handleCommandInput(input: VSCodeInput): Promise<VSCodeInputResult> {
    if (!input.command) {
      return { handled: false, errors: ['No command specified'] };
    }

    try {
      const result = await this.commandRegistry.executeCommand(
        input.command,
        input.parameters || {},
        { interfaceType: 'vscode' }
      );

      return { handled: true, result };
    } catch (error) {
      return { 
        handled: false, 
        errors: [error instanceof Error ? error.message : 'Command execution failed'] 
      };
    }
  }

  private async handleTreeViewClick(input: VSCodeInput): Promise<VSCodeInputResult> {
    if (!input.nodeId) {
      return { handled: false, errors: ['No node ID specified'] };
    }

    this.emit('treeViewNodeClicked', input.nodeId);
    return { handled: true, result: { nodeId: input.nodeId } };
  }

  private async handleWebViewMessage(input: VSCodeInput): Promise<VSCodeInputResult> {
    if (!input.message) {
      return { handled: false, errors: ['No message specified'] };
    }

    if (input.message.command === 'execute') {
      return await this.handleCommandInput({
        type: 'command',
        command: input.message.value,
        parameters: input.message.parameters
      });
    }

    return { handled: true, result: input.message };
  }

  // Helper methods
  private async getRootTreeViewNodes(): Promise<TreeViewNode[]> {
    try {
      const availableMenus = this.menuRegistry.getAvailableMenuIds('vscode');
      const nodes: TreeViewNode[] = [];

      for (const menuId of availableMenus) {
        const menu = await this.menuRegistry.getMenu(menuId, 'vscode');
        const node: TreeViewNode = {
          id: menuId,
          label: menu.title,
          description: menu.subtitle,
          collapsibleState: TreeItemCollapsibleState.Collapsed,
          iconPath: '$(symbol-misc)',
          contextValue: 'menu',
          children: await this.generateTreeViewData(menu)
        };
        nodes.push(node);
      }

      return nodes;
    } catch (error) {
      console.error('Failed to get root TreeView nodes:', error);
      return [];
    }
  }

  private async refreshTreeView(): Promise<void> {
    if (this.treeViewProvider) {
      this.treeViewProvider.refresh();
      this.emit('treeViewRefreshed');
    }
  }

  private async openWebView(): Promise<void> {
    if (this.webViewPanel) {
      this.emit('webViewOpened');
    }
  }

  private async executeTemplumCommand(commandId: string, args?: any[]): Promise<any> {
    return await this.commandRegistry.executeCommand(
      commandId,
      args ? { arguments: args } : {},
      { interfaceType: 'vscode' }
    );
  }

  private async updateContextForSession(sessionId: string): Promise<void> {
    // Update VSCode context based on session changes
    this.emit('sessionContextUpdated', sessionId);
  }

  private getIconForActionType(actionType?: string): string {
    const icons: Record<string, string> = {
      'command': '$(play)',
      'submenu': '$(folder)',
      'navigation': '$(arrow-right)',
      'external': '$(link-external)'
    };
    return icons[actionType || 'command'] || '$(circle-outline)';
  }
}
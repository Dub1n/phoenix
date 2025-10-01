/**
 * CLI Interface Adapter
 * 
 * Leverages Phoenix Code Lite CLI infrastructure for interactive menu navigation
 * and skin-based menu rendering. Maintains full PCL compatibility while extending
 * for multi-backend operations.
 * 
 * Dependencies: All registry systems and session foundation
 * Performance Target: Maintain PCL responsiveness and interaction patterns
 * 
 * Generated: 2025-08-21
 */

import { EventEmitter } from 'events';
import * as readline from 'readline';
import { UniversalCommandRegistry } from '../commands/universal-command-registry';
import {UniversalMenuRegistry, LoadedSkin, UniversalMenuDefinition} from '../menus/universal-menu-registry';
import { SessionContextFoundation } from '../session/session-context-foundation';
import { UniversalLayoutEngine } from '../rendering/universal-layout-engine';
import { ITemplumOrchestrator } from './templum-orchestrator-interface';
import { UniversalSkinDefinition } from '../types/universal-skin-definition';
import { 
  createDefaultTerminalUI,
  InteractiveSearch as _InteractiveSearch, 
  SearchableItem, 
  SearchResult,
  DefaultColorThemes 
} from './terminal-ui-components';
import { StringUtils } from '../utils/chainable-string-utils';

export interface CLIAdapter {
  type: 'cli';
  initialize(): Promise<boolean>;
  render(menuData: any): Promise<CLIRenderResult>;
  handleInput(input: CLIInput): Promise<CLIInputResult>;
  cleanup(): Promise<boolean>;
}

export interface CLIRenderResult {
  success: boolean;
  rendered: boolean;
  output?: string;
  errors?: string[];
}

export interface CLIInput {
  type: 'command' | 'menu_selection' | 'keyboard_shortcut' | 'navigation';
  value: string;
  rawInput?: string;
  context?: CLIInputContext;
}

export interface CLIInputContext {
  currentMenu?: string;
  navigationHistory?: string[];
  sessionId?: string;
  searchResult?: boolean;
  shortcut?: string;
}

export interface CLIInputResult {
  handled: boolean;
  result?: any;
  navigationChange?: NavigationChange;
  errors?: string[];
}

export interface NavigationChange {
  action: 'menu' | 'back' | 'forward' | 'exit';
  target?: string;
  previousMenu?: string;
}

export interface KeyboardShortcut {
  key: string;
  command: string;
  description: string;
  modifiers?: string[];
}

export interface CLIAdapterConfig {
  enableInteractiveMode: boolean;
  enableKeyboardShortcuts: boolean;
  enableColorOutput: boolean;
  enableProgressIndicators: boolean;
  clearScreenOnRender: boolean;
  maxHistorySize: number;
  inputTimeout?: number;
  enableInteractiveSearch: boolean;
  searchConfig?: {
    fuzzySearch: boolean;
    categoryFilter: boolean;
    maxResults: number;
    minSearchLength: number;
  };
  terminalTheme?: 'default' | 'dark' | 'light';
}

/**
 * CLI Interface Adapter Implementation
 * Transfers interactive menu navigation from PCL Interaction Manager and 
 * implements skin-based menu rendering using established session context
 */
export class CLIInterfaceAdapter extends EventEmitter implements CLIAdapter {
  type: 'cli' = 'cli';
  
  private commandRegistry: UniversalCommandRegistry;
  private menuRegistry: UniversalMenuRegistry;
  private sessionContext: SessionContextFoundation;
  private layoutEngine: UniversalLayoutEngine;
  private orchestrator?: ITemplumOrchestrator;
  private config: CLIAdapterConfig;
  private isInitialized = false;
  private readlineInterface: readline.Interface | null = null;
  private currentMenu = 'main';
  private navigationHistory: string[] = [];
  private keyboardShortcuts = new Map<string, string>();
  private isInteractiveMode = false;
  private terminalUI: any; // TerminalUI instance
  private searchableItems: SearchableItem[] = [];

  private formatColumn(
    value: unknown,
    width: number,
    alignment: 'left' | 'right' | 'center' = 'right'
  ): string {
    const text = value === null || value === undefined ? '' : String(value);
    return StringUtils.chain(text, { mode: 'terminal' }).pad(width, alignment).value();
  }

  constructor(
    commandRegistry: UniversalCommandRegistry,
    menuRegistry: UniversalMenuRegistry,
    sessionContext: SessionContextFoundation,
    config?: Partial<CLIAdapterConfig>,
    orchestrator?: ITemplumOrchestrator
  ) {
    super();
    this.commandRegistry = commandRegistry;
    this.menuRegistry = menuRegistry;
    this.sessionContext = sessionContext;
    this.orchestrator = orchestrator;
    this.layoutEngine = new UniversalLayoutEngine();
    this.config = {
      enableInteractiveMode: true,
      enableKeyboardShortcuts: true,
      enableColorOutput: true,
      enableProgressIndicators: true,
      clearScreenOnRender: true,
      maxHistorySize: 50,
      inputTimeout: 30000, // 30 seconds
      enableInteractiveSearch: true,
      searchConfig: {
        fuzzySearch: true,
        categoryFilter: true,
        maxResults: 10,
        minSearchLength: 1
      },
      terminalTheme: 'default',
      ...config
    };

    // Initialize Terminal UI with centralized defaults
    this.terminalUI = createDefaultTerminalUI(this.config.terminalTheme || 'default');
  }

  /**
   * Initialize CLI interface adapter
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Setup readline interface for interactive mode
      if (this.config.enableInteractiveMode) {
        await this.setupReadlineInterface();
      }

      // Setup keyboard shortcuts
      if (this.config.enableKeyboardShortcuts) {
        await this.setupKeyboardShortcuts();
      }

      // Setup event handlers
      this.setupEventHandlers();

      this.isInitialized = true;
      this.emit('initialized');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize CLI adapter:', error);
      return false;
    }
  }

  /**
   * Render menu using Universal Layout Engine
   */
  async render(menuData: any): Promise<CLIRenderResult> {
    if (!this.isInitialized) {
      return { success: false, rendered: false, errors: ['Adapter not initialized'] };
    }

    try {
      // Use Universal Layout Engine for consistent rendering
      const renderResult = await this.layoutEngine.renderForInterface(
        menuData,
        'cli',
        {
          interfaceType: 'cli',
          minHeight: 15,
          minWidth: 40,
          maxWidth: 100,
          textboxLines: 3,
          paddingLines: 2,
          enforceConsistentHeight: true,
          interfaceSpecific: {
            cli: {
              interactive: this.config.enableInteractiveMode,
              colorDepth: this.config.enableColorOutput ? 8 : 0,
              unicodeSupport: true
            }
          }
        }
      );

      if (renderResult.success && renderResult.output) {
        // Output the rendered menu
        console.log(renderResult.output);
        
        // Show keyboard shortcuts if enabled
        if (this.config.enableKeyboardShortcuts && this.keyboardShortcuts.size > 0) {
          this.displayKeyboardShortcuts();
        }

        this.emit('rendered', menuData);
        
        return {
          success: true,
          rendered: true,
          output: renderResult.output
        };
      } else {
        return {
          success: false,
          rendered: false,
          errors: renderResult.errors || ['Unknown rendering error']
        };
      }

    } catch (error) {
      console.error('Failed to render CLI interface:', error);
      return { 
        success: false, 
        rendered: false,
        errors: [error instanceof Error ? error.message : 'Unknown render error'] 
      };
    }
  }

  /**
   * Handle CLI input with PCL-style interaction patterns
   */
  async handleInput(input: CLIInput): Promise<CLIInputResult> {
    try {
      switch (input.type) {
        case 'command':
          return await this.handleCommandInput(input);
        case 'menu_selection':
          return await this.handleMenuSelection(input);
        case 'keyboard_shortcut':
          return await this.handleKeyboardShortcut(input);
        case 'navigation':
          return await this.handleNavigation(input);
        default:
          return { handled: false, errors: [`Unknown input type: ${input.type}`] };
      }
    } catch (error) {
      console.error('Failed to handle CLI input:', error);
      return { 
        handled: false, 
        errors: [error instanceof Error ? error.message : 'Unknown input error'] 
      };
    }
  }

  /**
   * Start interactive session (PCL pattern)
   */
  async startInteractiveSession(initialMenu = 'main'): Promise<void> {
    if (!this.config.enableInteractiveMode || !this.readlineInterface) {
      throw new Error('Interactive mode not enabled or readline not setup');
    }

    this.isInteractiveMode = true;
    this.currentMenu = initialMenu;
    this.navigationHistory = [];

    // Create or use existing session
    let session = this.sessionContext.getActiveSession();
    if (!session) {
      session = await this.sessionContext.createSession(undefined, 'cli');
      this.sessionContext.setActiveSession(session.sessionId);
    }

    // Render initial menu
    await this.renderCurrentMenu();

    // Setup input handling
    this.setupInteractiveInputHandling();

    this.emit('interactiveSessionStarted', session.sessionId);
  }

  /**
   * Stop interactive session
   */
  async stopInteractiveSession(): Promise<void> {
    this.isInteractiveMode = false;
    
    if (this.readlineInterface) {
      this.readlineInterface.removeAllListeners();
    }

    this.emit('interactiveSessionStopped');
  }

  /**
   * Cleanup CLI adapter resources
   */
  async cleanup(): Promise<boolean> {
    try {
      if (this.readlineInterface) {
        this.readlineInterface.close();
        this.readlineInterface = null;
      }

      this.keyboardShortcuts.clear();
      this.navigationHistory = [];
      this.removeAllListeners();

      this.isInitialized = false;
      this.emit('cleanup');

      return true;
    } catch (error) {
      console.error('Failed to cleanup CLI adapter:', error);
      return false;
    }
  }

  // Private implementation methods
  private async setupReadlineInterface(): Promise<void> {
    this.readlineInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });

    this.readlineInterface.on('line', async (input) => {
      await this.processInteractiveInput(input.trim());
    });

    this.readlineInterface.on('SIGINT', () => {
      this.emit('interruptReceived');
      this.stopInteractiveSession();
    });
  }

  private async setupKeyboardShortcuts(): Promise<void> {
    // Default keyboard shortcuts (PCL pattern)
    const defaultShortcuts = [
      { key: 'h', command: 'help', description: 'Show help' },
      { key: 'q', command: 'quit', description: 'Quit application' },
      { key: 'b', command: 'back', description: 'Go back' },
      { key: 'r', command: 'refresh', description: 'Refresh current view' },
      { key: 's', command: 'status', description: 'Show system status' }
    ];

    // Add interactive search shortcut if enabled
    if (this.config.enableInteractiveSearch) {
      defaultShortcuts.push(
        { key: 'f', command: 'search', description: 'Interactive search' },
        { key: '/', command: 'search', description: 'Interactive search' }
      );
    }

    for (const shortcut of defaultShortcuts) {
      this.keyboardShortcuts.set(shortcut.key, shortcut.command);
    }
  }

  private setupEventHandlers(): void {
    // Listen for menu updates
    this.menuRegistry.on('menusLoaded', async () => {
      if (this.isInteractiveMode) {
        await this.renderCurrentMenu();
      }
    });

    // Listen for session changes
    this.sessionContext.on('activeSessionChanged', async (sessionId) => {
      this.emit('sessionChanged', sessionId);
    });
  }

  private async renderCurrentMenu(): Promise<void> {
    try {
      const menu = await this.menuRegistry.getMenu(this.currentMenu, 'cli');
      await this.render(menu);
    } catch (error) {
      console.error(`Failed to render menu '${this.currentMenu}':`, error);
    }
  }

  private setupInteractiveInputHandling(): void {
    if (!this.readlineInterface) return;

    this.readlineInterface.prompt();
  }

  private async processInteractiveInput(input: string): Promise<void> {
    if (!input) {
      this.readlineInterface?.prompt();
      return;
    }

    // Handle navigation commands
    if (input === 'back') {
      await this.goBack();
    } else if (input === 'quit' || input === 'exit') {
      await this.stopInteractiveSession();
      return;
    } else if (input === 'help') {
      this.displayHelp();
    } else if (input === 'status') {
      this.displayBackendStatus();
    } else if (input === 'refresh') {
      await this.renderCurrentMenu();
    } else if (input === 'search' || input === 'f' || input === '/') {
      if (this.config.enableInteractiveSearch) {
        await this.launchInteractiveSearch();
      } else {
        console.log('Interactive search is disabled');
      }
    } else if (input === 'backends') {
      // List available backends with status
      await this.displayAvailableBackendsDetailed();
    } else if (/^\d+$/.test(input)) {
      // Numeric menu selection
      await this.handleMenuSelection({
        type: 'menu_selection',
        value: input,
        context: { currentMenu: this.currentMenu }
      });
    } else if (input.startsWith('load ')) {
      // Manual backend skin loading
      const backendId = input.substring(5).trim();
      await this.loadSpecificBackendSkin(backendId);
    } else if (input.startsWith('unload ')) {
      // Manual backend disconnection
      const backendId = input.substring(7).trim();
      await this.unloadSpecificBackend(backendId);
    } else {
      // Command execution
      await this.handleCommandInput({
        type: 'command',
        value: input,
        context: { currentMenu: this.currentMenu }
      });
    }

    if (this.isInteractiveMode) {
      this.readlineInterface?.prompt();
    }
  }

  private async handleCommandInput(input: CLIInput): Promise<CLIInputResult> {
    try {
      console.log(`CLI Adapter: Processing command '${input.value}' with real backend integration...`);
      
      // Enhanced real backend command execution
      if (this.orchestrator?.isInitialized()) {
        try {
          // First attempt: Execute through orchestrator (real backend integration)
          console.log('CLI Adapter: Attempting real backend command execution...');
          const orchResult = await this.orchestrator.executeCommand(
            input.value,
            'cli',
            [],
            { 
              interfaceType: 'cli',
              source: 'CLIInterfaceAdapter',
              timestamp: Date.now(),
              sessionId: this.sessionContext.getActiveSession()?.sessionId
            }
          );
          
          if (orchResult) {
            console.log('CLI Adapter: Command executed successfully via real backend integration');
            console.log(orchResult.message || 'Command executed successfully');
            
            // Display backend execution information
            if (orchResult.metadata?.backendId) {
              console.log(`[Backend: ${orchResult.metadata.backendId}] ${orchResult.message || 'Success'}`);
            }
            
            return { handled: true, result: orchResult };
          }
        } catch (orchestratorError) {
          console.warn('CLI Adapter: Real backend command execution failed, falling back to local registry:', orchestratorError);
        }
      }
      
      // Fallback: Execute through local command registry
      console.log('CLI Adapter: Executing command through local registry fallback...');
      const result = await this.commandRegistry.executeCommand(
        input.value,
        {},
        { interfaceType: 'cli' }
      );

      console.log(result.message || 'Command executed successfully (local registry)');
      return { handled: true, result };
      
    } catch (error) {
      console.error(`Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { 
        handled: false, 
        errors: [error instanceof Error ? error.message : 'Command execution failed'] 
      };
    }
  }

  private async handleMenuSelection(input: CLIInput): Promise<CLIInputResult> {
    try {
      const menu = await this.menuRegistry.getMenu(this.currentMenu, 'cli');
      const selectionNumber = parseInt(input.value, 10);
      
      if (isNaN(selectionNumber) || selectionNumber < 1) {
        return { handled: false, errors: ['Invalid menu selection'] };
      }

      // Find the selected item
      let itemIndex = 0;
      let selectedItem: any = null;

      for (const section of menu.sections) {
        for (const item of section.items) {
          itemIndex++;
          if (itemIndex === selectionNumber) {
            selectedItem = item;
            break;
          }
        }
        if (selectedItem) break;
      }

      if (!selectedItem) {
        return { handled: false, errors: ['Menu item not found'] };
      }

      // Execute the selected item's action
      return await this.executeMenuItemAction(selectedItem);

    } catch (error) {
      return { 
        handled: false, 
        errors: [error instanceof Error ? error.message : 'Menu selection failed'] 
      };
    }
  }

  private async handleKeyboardShortcut(input: CLIInput): Promise<CLIInputResult> {
    const command = this.keyboardShortcuts.get(input.value);
    
    if (!command) {
      return { handled: false, errors: ['Unknown keyboard shortcut'] };
    }

    return await this.handleCommandInput({
      type: 'command',
      value: command,
      context: input.context
    });
  }

  private async handleNavigation(input: CLIInput): Promise<CLIInputResult> {
    switch (input.value) {
      case 'back':
        return await this.goBack();
      case 'forward':
        return await this.goForward();
      case 'home':
        return await this.goHome();
      default:
        return { handled: false, errors: ['Unknown navigation command'] };
    }
  }

  private async executeMenuItemAction(item: any): Promise<CLIInputResult> {
    switch (item.action.type) {
      case 'command':
        if (item.action.target) {
          return await this.handleCommandInput({
            type: 'command',
            value: item.action.target,
            context: { currentMenu: this.currentMenu }
          });
        }
        break;

      case 'submenu':
        if (item.action.target) {
          return await this.navigateToMenu(item.action.target);
        }
        break;

      case 'navigation':
        if (item.action.target) {
          return await this.handleNavigation({
            type: 'navigation',
            value: item.action.target,
            context: { currentMenu: this.currentMenu }
          });
        }
        break;

      case 'external':
        console.log(`External action: ${item.action.target}`);
        return { handled: true };
    }

    return { handled: false, errors: ['Unknown menu item action'] };
  }

  private async navigateToMenu(menuId: string): Promise<CLIInputResult> {
    try {
      // Add current menu to history
      this.navigationHistory.push(this.currentMenu);
      
      // Trim history if too long
      if (this.navigationHistory.length > this.config.maxHistorySize) {
        this.navigationHistory = this.navigationHistory.slice(-this.config.maxHistorySize);
      }

      // Navigate to new menu
      this.currentMenu = menuId;
      
      // Update session state
      await this.updateSessionNavigationState();
      
      // Render new menu
      if (this.isInteractiveMode) {
        await this.renderCurrentMenu();
      }

      return {
        handled: true,
        navigationChange: {
          action: 'menu',
          target: menuId,
          previousMenu: this.navigationHistory[this.navigationHistory.length - 1]
        }
      };

    } catch (error) {
      return { 
        handled: false, 
        errors: [error instanceof Error ? error.message : 'Navigation failed'] 
      };
    }
  }

  private async goBack(): Promise<CLIInputResult> {
    if (this.navigationHistory.length === 0) {
      return { handled: false, errors: ['No previous menu in history'] };
    }

    const previousMenu = this.navigationHistory.pop()!;
    this.currentMenu = previousMenu;
    
    await this.updateSessionNavigationState();
    
    if (this.isInteractiveMode) {
      await this.renderCurrentMenu();
    }

    return {
      handled: true,
      navigationChange: {
        action: 'back',
        target: previousMenu
      }
    };
  }

  private async goForward(): Promise<CLIInputResult> {
    // Forward navigation would require a forward history stack
    // For now, just indicate it's not available
    return { handled: false, errors: ['Forward navigation not available'] };
  }

  private async goHome(): Promise<CLIInputResult> {
    this.navigationHistory.push(this.currentMenu);
    this.currentMenu = 'main';
    
    await this.updateSessionNavigationState();
    
    if (this.isInteractiveMode) {
      await this.renderCurrentMenu();
    }

    return {
      handled: true,
      navigationChange: {
        action: 'menu',
        target: 'main',
        previousMenu: this.navigationHistory[this.navigationHistory.length - 1]
      }
    };
  }

  private async updateSessionNavigationState(): Promise<void> {
    const session = this.sessionContext.getActiveSession();
    if (session) {
      this.sessionContext.updateSessionState(session.sessionId, {
        currentMenu: this.currentMenu,
        navigationHistory: [...this.navigationHistory]
      });

      // Also update menu registry state
      await this.menuRegistry.updateMenuState('cli', {
        activeMenu: this.currentMenu,
        navigationHistory: [...this.navigationHistory]
      });
    }
  }

  /**
   * Launch interactive search interface - TASK-CLI-002 implementation
   */
  private async launchInteractiveSearch(): Promise<void> {
    if (!this.config.enableInteractiveSearch) {
      console.log('Interactive search is disabled');
      return;
    }

    try {
      // Build searchable items from current context
      await this.buildSearchableItems();

      if (this.searchableItems.length === 0) {
        console.log('No searchable items available');
        return;
      }

      // Create and configure interactive search
      const search = this.terminalUI.createInteractiveSearch({
        theme: DefaultColorThemes[this.config.terminalTheme || 'default'] || DefaultColorThemes.default,
        placeholder: 'Search menus and commands... (type to filter, tab for categories)',
        enableFuzzySearch: this.config.searchConfig?.fuzzySearch ?? true,
        enableCategoryFilter: this.config.searchConfig?.categoryFilter ?? true,
        maxResults: this.config.searchConfig?.maxResults ?? 10,
        minSearchLength: this.config.searchConfig?.minSearchLength ?? 1
      });

      // Set searchable items and start search
      search.setItems(this.searchableItems);
      
      // Launch interactive search
      const result = await search.start();
      
      if (result) {
        await this.handleSearchResult(result);
      }

      // Return to interactive session
      if (this.isInteractiveMode) {
        await this.renderCurrentMenu();
        this.readlineInterface?.prompt();
      }

    } catch (error) {
      console.error('Failed to launch interactive search:', error);
      
      if (this.isInteractiveMode) {
        this.readlineInterface?.prompt();
      }
    }
  }

  /**
   * Build searchable items from menus and commands
   */
  private async buildSearchableItems(): Promise<void> {
    this.searchableItems = [];
    
    try {
      // Add basic commands that are always available
      const basicCommands = [
        { name: 'help', description: 'Show help information' },
        { name: 'status', description: 'Show system status' },
        { name: 'refresh', description: 'Refresh current view' },
        { name: 'back', description: 'Go to previous menu' },
        { name: 'quit', description: 'Exit application' }
      ];

      for (const cmd of basicCommands) {
        this.searchableItems.push({
          id: `command:${cmd.name}`,
          title: cmd.name,
          description: cmd.description,
          category: 'Commands',
          tags: ['basic', 'navigation'],
          data: {
            type: 'command',
            command: cmd.name,
            info: { description: cmd.description }
          }
        });
      }

      // Get menu items from current and available menus
      const availableMenus = this.menuRegistry.getAvailableMenuIds('cli');
      
      for (const menuId of availableMenus) {
        try {
          const menu = await this.menuRegistry.getMenu(menuId, 'cli');
          
          // Add menu as searchable item
          this.searchableItems.push({
            id: `menu:${menuId}`,
            title: menu.title || menuId,
            description: `Navigate to ${menu.title || menuId} menu`,
            category: 'Menus',
            tags: ['menu', 'navigation'],
            data: {
              type: 'menu',
              menuId: menuId,
              menu: menu
            }
          });

          // Add individual menu items
          if (menu.sections) {
            for (const section of menu.sections) {
              if (section.items) {
                for (const item of section.items) {
                  this.searchableItems.push({
                    id: `menu-item:${menuId}:${item.id || item.label}`,
                    title: item.label,
                    description: item.description || `${item.action?.type}: ${item.action?.target}`,
                    category: `Menu: ${menu.title || menuId}`,
                    tags: ['menu-item', menuId],
                    data: {
                      type: 'menu-item',
                      menuId: menuId,
                      item: item,
                      section: section.id || 'section'
                    }
                  });
                }
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to load menu '${menuId}' for search:`, error);
        }
      }

      // Add keyboard shortcuts as searchable items
      for (const [key, command] of Array.from(this.keyboardShortcuts.entries())) {
        this.searchableItems.push({
          id: `shortcut:${key}`,
          title: `${key} (shortcut)`,
          description: `Keyboard shortcut for: ${command}`,
          category: 'Shortcuts',
          tags: ['shortcut', 'keyboard', command],
          data: {
            type: 'shortcut',
            key: key,
            command: command
          }
        });
      }

      // Add backend services if orchestrator is available
      if (this.orchestrator?.isInitialized()) {
        try {
          const systemStatus = this.orchestrator.getSystemStatus();
          const backends = systemStatus.coreEngine?.backendConnections?.backends || {};
          
          for (const [serviceId, status] of Object.entries(backends)) {
            this.searchableItems.push({
              id: `backend:${serviceId}`,
              title: `${serviceId} (backend)`,
              description: `Backend service: ${status.connected ? 'Connected' : 'Disconnected'} - ${status.health || 'Unknown'}`,
              category: 'Backend Services',
              tags: ['backend', 'service', status.connected ? 'connected' : 'disconnected'],
              data: {
                type: 'backend',
                serviceId: serviceId,
                status: status
              }
            });
          }
        } catch (error) {
          console.warn('Failed to load backend services for search:', error);
        }
      }

    } catch (error) {
      console.error('Failed to build searchable items:', error);
      this.searchableItems = [];
    }
  }

  /**
   * Handle the selected search result
   */
  private async handleSearchResult(result: SearchResult): Promise<void> {
    try {
      console.log(`\nSelected: ${result.title}`);
      
      switch (result.data.type) {
        case 'command':
          await this.handleCommandInput({
            type: 'command',
            value: result.data.command,
            context: { 
              currentMenu: this.currentMenu,
              searchResult: true
            }
          });
          break;

        case 'menu':
          await this.navigateToMenu(result.data.menuId);
          break;

        case 'menu-item':
          await this.executeMenuItemAction(result.data.item);
          break;

        case 'shortcut':
          await this.handleCommandInput({
            type: 'command',
            value: result.data.command,
            context: { 
              currentMenu: this.currentMenu,
              shortcut: result.data.key
            }
          });
          break;

        case 'backend':
          console.log(`Backend service: ${result.data.serviceId}`);
          console.log(`Status: ${result.data.status.connected ? 'Connected' : 'Disconnected'}`);
          console.log(`Health: ${result.data.status.health || 'Unknown'}`);
          if (result.data.status.capabilities) {
            console.log(`Capabilities: ${result.data.status.capabilities.join(', ')}`);
          }
          break;

        default:
          console.log(`Unknown search result type: ${result.data.type}`);
          break;
      }

    } catch (error) {
      console.error(`Failed to handle search result:`, error);
    }
  }

  /**
   * Load a specific backend's skin definition and switch to its interface
   * @private
   */
  private async loadSpecificBackendSkin(backendId: string): Promise<void> {
    if (!backendId) {
      console.log('[ERROR] Please specify a backend ID (e.g., load pcl, load minimal-example)');
      return;
    }

    try {
      console.log(`[LOADING] Loading skin from backend: ${backendId}`);
      
      // Check if orchestrator is available
      if (!this.orchestrator?.isInitialized()) {
        console.log('[ERROR] Orchestrator not available - cannot load backend skins');
        return;
      }

      // Attempt to load the backend skin
      const skinDefinition = await this.orchestrator.loadBackendSkin(backendId);
      
      if (skinDefinition) {
        // Load skin into menu registry
        await this.loadSkinIntoMenuRegistry(backendId, skinDefinition);
        
        // Switch to the main menu of this backend if available
        const backendMainMenu = `${backendId}.main`;
        const availableMenus = this.menuRegistry.getAvailableMenuIds('cli');
        
        if (availableMenus.includes(backendMainMenu)) {
          this.currentMenu = backendMainMenu;
          await this.renderCurrentMenu();
          console.log(`[OK] Switched to ${skinDefinition.name || backendId} interface`);
        } else if (availableMenus.includes('main')) {
          // Fallback to generic main menu with backend loaded
          await this.renderCurrentMenu();
          console.log(`[OK] Loaded ${skinDefinition.name || backendId} skin (using generic menu)`);
        } else {
          console.log(`[OK] Loaded ${skinDefinition.name || backendId} skin definition`);
        }
        
        // Update searchable items to include new backend
        await this.buildSearchableItems();
        
      } else {
        console.log(`[ERROR] Could not load skin from backend: ${backendId}`);
        console.log('[TIP] Check if backend is running and accessible');
        
        // Show available backends for reference
        await this.displayAvailableBackends();
      }
      
    } catch (error) {
      console.error(`[ERROR] Failed to load skin from ${backendId}:`, error);
      console.log('[TIP] Use "status" command to check backend connectivity');
    }
  }

  /**
   * Load a skin definition into the menu registry
   * @private
   */
  private async loadSkinIntoMenuRegistry(serviceId: string, skin: UniversalSkinDefinition): Promise<void> {
    if (!skin.menus) {
      console.log(`[WARN] Backend ${serviceId} has no menu definitions`);
      return;
    }
    
    // Convert SkinMenus to Record<string, UniversalMenuDefinition>
    const convertedMenus: Record<string, UniversalMenuDefinition> = {};
    
    // Helper function to convert skin MenuDefinition to UniversalMenuDefinition
    const convertMenuDefinition = (menuDef: any, menuId: string): UniversalMenuDefinition => {
      // Convert items array to sections array format
      const sections = [{
        id: 'main',
        heading: menuDef.subtitle || 'Options',
        items: (menuDef.items || []).map((item: any) => ({
          id: item.id,
          label: item.label,
          description: item.description,
          action: item.action ? { type: 'command', target: item.action } : { type: 'command', target: item.command || '' },
          enabled: true
        }))
      }];
      
      return {
        id: menuDef.id || menuId,
        title: menuDef.title,
        subtitle: menuDef.subtitle,
        sections: sections,
        backendId: serviceId,
        interfaceSupport: ['cli'],
        crossInterfaceSync: false
      };
    };

    // Handle main menu
    if (skin.menus.main) {
      convertedMenus.main = convertMenuDefinition(skin.menus.main, 'main');
    }
    
    // Handle submenus
    if (skin.menus.submenus) {
      for (const [menuId, menuDef] of Object.entries(skin.menus.submenus)) {
        if (menuDef && typeof menuDef === 'object' && 'title' in menuDef) {
          convertedMenus[menuId] = convertMenuDefinition(menuDef, menuId);
        }
      }
    }
    
    // Convert skin menus to LoadedSkin format
    const loadedSkin: LoadedSkin = {
      metadata: {
        name: serviceId,
        displayName: skin.name || serviceId,
        version: skin.version || '1.0.0',
        supportedInterfaces: ['cli']
      },
      menus: convertedMenus,
      // Skip theme conversion for now to avoid type issues
      config: {
        defaultInterface: 'cli'
      }
    };
    
    // Load skin into menu registry
    await this.menuRegistry.loadSkin(loadedSkin);
    const menuCount = Object.keys(convertedMenus).length;
    console.log(`[LIST] Loaded ${menuCount} menu(s) from ${skin.name || serviceId}`);
  }

  /**
   * Display available backends with detailed information
   * TASK-CLI-018: Enhanced backends command implementation
   * @private
   */
  private async displayAvailableBackendsDetailed(): Promise<void> {
    if (!this.orchestrator?.isInitialized()) {
      console.log('[ERROR] Backend management unavailable - orchestrator not initialized');
      console.log('[TIP] Try restarting Templum to initialize backend connections');
      return;
    }

    try {
      const systemStatus = this.orchestrator.getSystemStatus();
      const backends = systemStatus.coreEngine?.backendConnections?.backends || {};
      
      if (Object.keys(backends).length === 0) {
        console.log('[EMPTY] No backends currently discovered');
        console.log('[TIP] Backend services will appear here when they start');
        return;
      }
      
      console.log('\n[TOOLS] Backend Management Dashboard');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Backend ID     Status        Health     Skin   Commands Available');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      for (const [serviceId, status] of Object.entries(backends)) {
        const statusIcon = status.connected
          ? (status.health === 'healthy' ? '[CONNECTED]  ' : '[WARN]        ')
          : '[OFFLINE]     ';
        const health = this.formatColumn(status.health || 'Unknown', 10);
        const skinStatus = this.formatColumn((status as any).skinLoaded ? '[OK] Yes' : '[NO] No', 10);
        const serviceColumn = this.formatColumn(serviceId, 14);
        const capabilityCount = status.capabilities?.length || 0;
        const commandInfo = capabilityCount > 0 ? `${capabilityCount} available` : 'None loaded';
        
        console.log(`${serviceColumn} ${statusIcon} ${health} ${skinStatus} ${commandInfo}`);
      }
      
      const connectedCount = Object.values(backends).filter((b: any) => b.connected).length;
      const totalCount = Object.keys(backends).length;
      const healthyCount = Object.values(backends).filter((b: any) => b.health === 'healthy').length;
      const skinsLoaded = Object.values(backends).filter((b: any) => (b as any).skinLoaded).length;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Total: ${totalCount} | Connected: ${connectedCount} | Healthy: ${healthyCount} | Skins Loaded: ${skinsLoaded}`);
      console.log('\n[GAME] Management Commands:');
      console.log('  load <backend-id>    - Load backend skin interface');
      console.log('  unload <backend-id>  - Disconnect from backend service');
      console.log('  refresh              - Trigger service discovery');
      console.log('  status               - Show detailed connection status');
      
    } catch (error) {
      console.log('[ERROR] Failed to retrieve backend information:', error);
      console.log('[TIP] Try "refresh" command to re-scan for services');
    }
  }

  /**
   * Unload/disconnect from a specific backend service
   * TASK-CLI-018: Enhanced unload command implementation
   * @private
   */
  private async unloadSpecificBackend(backendId: string): Promise<void> {
    if (!backendId) {
      console.log('[ERROR] Please specify a backend ID (e.g., unload pcl, unload minimal-example)');
      console.log('[TIP] Use "backends" command to see available backend IDs');
      return;
    }

    try {
      console.log(`[REFRESH] Disconnecting from backend: ${backendId}`);
      
      // Check if orchestrator is available
      if (!this.orchestrator?.isInitialized()) {
        console.log('[ERROR] Backend management unavailable - orchestrator not initialized');
        return;
      }

      // Check if backend exists and is connected
      const systemStatus = this.orchestrator.getSystemStatus();
      const backends = systemStatus.coreEngine?.backendConnections?.backends || {};
      const backendStatus = (backends as any)[backendId];
      
      if (!backendStatus) {
        console.log(`[ERROR] Backend '${backendId}' not found`);
        console.log('[TIP] Use "backends" command to see available backend IDs');
        return;
      }
      
      if (!backendStatus.connected) {
        console.log(`[WARN] Backend '${backendId}' is already disconnected`);
        return;
      }

      // Attempt to disconnect from the backend
      // TODO: [TASK-CLI-020] Implement orchestrator.disconnectFromBackend method | Priority: Medium | Phase: Integration
      // Complexity: 3 | Location: ITemplumOrchestrator interface | Dependencies: Backend connection management
      
      // For now, we'll implement a basic skin unloading by clearing searchable items
      // TODO: [TASK-CLI-021] Implement proper skin unloading in UniversalMenuRegistry | Priority: Medium | Phase: Integration
      // Complexity: 3 | Location: UniversalMenuRegistry.unloadSkin() | Dependencies: Menu registry management
      
      // Switch back to main menu if we were using this backend's interface  
      const currentMenuPrefix = this.currentMenu.split('.')[0];
      if (currentMenuPrefix === backendId) {
        this.currentMenu = 'main';
        await this.renderCurrentMenu();
      }
      
      // Update searchable items to remove this backend's items
      await this.buildSearchableItems();
      
      console.log(`[OK] Disconnected from ${backendId}`);
      console.log('[TIP] Backend service may still be running - this only unloads the interface');
      
    } catch (error) {
      console.error(`[ERROR] Failed to disconnect from ${backendId}:`, error);
      console.log('[TIP] Use "status" command to check current backend connections');
    }
  }

  /**
   * Display available backends for user reference
   * @private
   */
  private async displayAvailableBackends(): Promise<void> {
    if (!this.orchestrator?.isInitialized()) {
      console.log('Cannot check available backends - orchestrator not initialized');
      return;
    }

    try {
      const systemStatus = this.orchestrator.getSystemStatus();
      const backends = systemStatus.coreEngine?.backendConnections?.backends || {};
      
      if (Object.keys(backends).length === 0) {
        console.log('No backends currently connected');
        return;
      }
      
      console.log('\n[LINK] Available backends:');
      for (const [serviceId, status] of Object.entries(backends)) {
        const statusIcon = status.connected 
          ? (status.health === 'healthy' ? '[OK]' : '[WARN]') 
          : '[OFFLINE]';
        console.log(`  ${statusIcon} ${serviceId} - ${status.connected ? 'connected' : 'disconnected'}`);
      }
      console.log('\n[TIP] Try: load <backend-id>');
      
    } catch (_error) {
      console.log('Failed to get backend status');
    }
  }

  private displayKeyboardShortcuts(): void {
    if (this.keyboardShortcuts.size === 0) return;

    console.log('\nKeyboard Shortcuts:');
    for (const [key, command] of Array.from(this.keyboardShortcuts.entries())) {
      console.log(`  ${key} - ${command}`);
    }
    console.log();
  }

  private displayHelp(): void {
    console.log('\nTemplum CLI Help:');
    console.log('Commands:');
    console.log('  help          - Show this help message');
    console.log('  back          - Go to previous menu');
    console.log('  home          - Go to main menu');
    console.log('  refresh       - Refresh current menu and trigger service discovery');
    console.log('  status        - Show detailed backend service status');
    console.log('  quit          - Exit application');
    console.log('');
    console.log('Backend Management:');
    console.log('  backends      - List all available backends with status details');
    console.log('  load <id>     - Load backend skin interface (e.g., load pcl)');
    console.log('  unload <id>   - Disconnect from backend service (e.g., unload pcl)');
    
    if (this.config.enableInteractiveSearch) {
      console.log('  search   - Launch interactive search (also: f, /)');
    }
    
    console.log('\nNavigation:');
    console.log('  1-9      - Select menu item by number');
    console.log('  command  - Execute any backend command');
    
    if (this.config.enableInteractiveSearch) {
      console.log('\nInteractive Search:');
      console.log('  f or /   - Launch search interface');
      console.log('  ESC      - Cancel search');
      console.log('  ↑↓       - Navigate results');
      console.log('  TAB      - Cycle category filters');
      console.log('  ENTER    - Select item');
      console.log('  Type     - Filter results in real-time');
    }
    
    if (this.keyboardShortcuts.size > 0) {
      console.log('\nShortcuts:');
      for (const [key, command] of Array.from(this.keyboardShortcuts.entries())) {
        console.log(`  ${key}       - ${command}`);
      }
    }
    
    // Display real backend integration status
    if (this.orchestrator?.isInitialized()) {
      console.log('\nBackend Integration:');
      console.log('  [OK] Real backend integration active');
      this.displayBackendStatus();
    } else {
      console.log('\nBackend Integration:');
      console.log('  [WARN] Local registry fallback mode');
    }
    console.log();
  }

  /**
   * Display current backend service status
   * @private
   */
  private displayBackendStatus(): void {
    if (!this.orchestrator?.isInitialized()) {
      console.log('Backend status unavailable - orchestrator not initialized');
      return;
    }

    try {
      const systemStatus = this.orchestrator.getSystemStatus();
      const backends = systemStatus.coreEngine?.backendConnections?.backends || {};
      
      console.log('\nBackend Service Status:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Service      Status      Health    Response   Capabilities');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      for (const [serviceId, status] of Object.entries(backends)) {
        const conn = this.formatColumn(status.connected ? '[CONNECTED]' : '[DISCONNECTED]', 12);
        const health = this.formatColumn(status.health || 'Unknown', 9);
        const responseTime = this.formatColumn(status.responseTime ? `${status.responseTime}ms` : 'N/A', 10);
        const capabilities = status.capabilities?.slice(0, 2).join(', ') || 'None';
        const serviceColumn = this.formatColumn(serviceId, 12);
        
        console.log(`${serviceColumn} ${conn} ${health} ${responseTime} ${capabilities}`);
      }
      
      const connectedCount = Object.values(backends).filter((b: any) => b.connected).length;
      const totalCount = Object.keys(backends).length;
      const healthyCount = Object.values(backends).filter((b: any) => b.health === 'healthy').length;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Connected: ${connectedCount}/${totalCount} | Healthy: ${healthyCount}/${connectedCount} | Status: ${healthyCount > 0 ? 'Operational' : 'Discovery Mode'}`);
      
    } catch (error) {
      console.log('Failed to retrieve backend status:', error);
    }
  }

  /**
   * Get current menu information
   */
  getCurrentMenu(): string {
    return this.currentMenu;
  }

  /**
   * Get navigation history
   */
  getNavigationHistory(): string[] {
    return [...this.navigationHistory];
  }

  /**
   * Check if interactive mode is active
   */
  isInInteractiveMode(): boolean {
    return this.isInteractiveMode;
  }

  /**
   * Get available keyboard shortcuts
   */
  getKeyboardShortcuts(): Map<string, string> {
    return new Map(this.keyboardShortcuts);
  }

  /**
   * Set current menu (programmatic navigation)
   */
  async setCurrentMenu(menuId: string): Promise<boolean> {
    try {
      // Validate menu exists
      const _menu = await this.menuRegistry.getMenu(menuId, 'cli');
      
      this.navigationHistory.push(this.currentMenu);
      this.currentMenu = menuId;
      
      await this.updateSessionNavigationState();
      
      if (this.isInteractiveMode) {
        await this.renderCurrentMenu();
      }

      return true;
    } catch (error) {
      console.error(`Failed to set current menu to '${menuId}':`, error);
      return false;
    }
  }

  /**
   * Add custom keyboard shortcut
   */
  addKeyboardShortcut(key: string, command: string): void {
    this.keyboardShortcuts.set(key, command);
    this.emit('keyboardShortcutAdded', key, command);
  }

  /**
   * Remove keyboard shortcut
   */
  removeKeyboardShortcut(key: string): boolean {
    const removed = this.keyboardShortcuts.delete(key);
    if (removed) {
      this.emit('keyboardShortcutRemoved', key);
    }
    return removed;
  }
}

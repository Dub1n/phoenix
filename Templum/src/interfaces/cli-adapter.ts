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
import readline from 'readline';
import { UniversalCommandRegistry } from '../commands/universal-command-registry';
import { UniversalMenuRegistry } from '../menus/universal-menu-registry';
import { SessionContextFoundation } from '../session/session-context-foundation';
import { UniversalLayoutEngine } from '../rendering/universal-layout-engine';
import { ITemplumOrchestrator } from './templum-orchestrator-interface';
import { InterfaceType, createTemplumError, isTemplumError } from '../types/templum-types';

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
      ...config
    };
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
    } else if (/^\d+$/.test(input)) {
      // Numeric menu selection
      await this.handleMenuSelection({
        type: 'menu_selection',
        value: input,
        context: { currentMenu: this.currentMenu }
      });
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

  private displayKeyboardShortcuts(): void {
    if (this.keyboardShortcuts.size === 0) return;

    console.log('\nKeyboard Shortcuts:');
    for (const [key, command] of this.keyboardShortcuts) {
      console.log(`  ${key} - ${command}`);
    }
    console.log();
  }

  private displayHelp(): void {
    console.log('\nTemplum CLI Help:');
    console.log('Commands:');
    console.log('  help     - Show this help message');
    console.log('  back     - Go to previous menu');
    console.log('  home     - Go to main menu');
    console.log('  refresh  - Refresh current menu');
    console.log('  status   - Show backend service status');
    console.log('  quit     - Exit application');
    console.log('\nNavigation:');
    console.log('  1-9      - Select menu item by number');
    console.log('  command  - Execute any backend command');
    
    if (this.keyboardShortcuts.size > 0) {
      console.log('\nShortcuts:');
      for (const [key, command] of this.keyboardShortcuts) {
        console.log(`  ${key}       - ${command}`);
      }
    }
    
    // Display real backend integration status
    if (this.orchestrator?.isInitialized()) {
      console.log('\nBackend Integration:');
      console.log('  ✅ Real backend integration active');
      this.displayBackendStatus();
    } else {
      console.log('\nBackend Integration:');
      console.log('  ⚠️  Local registry fallback mode');
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
      const backends = systemStatus.coreEngine.backendConnections.backends;
      
      console.log('\nBackend Service Status:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Service      Status      Health    Response   Capabilities');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      for (const [serviceId, status] of Object.entries(backends)) {
        const conn = status.connected ? '🟢 Connected ' : '🔴 Disconnected';
        const health = status.health || 'Unknown';
        const responseTime = status.responseTime ? `${status.responseTime}ms` : 'N/A';
        const capabilities = status.capabilities?.slice(0, 2).join(', ') || 'None';
        
        console.log(`${serviceId.padEnd(12)} ${conn.padEnd(12)} ${health.padEnd(9)} ${responseTime.padEnd(10)} ${capabilities}`);
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
      const menu = await this.menuRegistry.getMenu(menuId, 'cli');
      
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
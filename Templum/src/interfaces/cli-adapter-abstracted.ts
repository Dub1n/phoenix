/**
---
title: [CLI Interface Adapter - Abstraction Layer Implementation]
tags: [Interface, Adapter, CLI, Abstraction]
provides: [CLIInterfaceAdapter, Abstracted CLI Integration]
requires: [ITemplumOrchestrator, CLI Framework, Universal Types]
description: [Abstracted CLI interface adapter that depends on ITemplumOrchestrator interface, not concrete implementations]
---
*/

import { EventEmitter } from 'events';
import * as readline from 'readline';
import { 
  createTemplumError, 
  isTemplumError,
  InterfaceType,
  CommandResult,
  UniversalSkinDefinition,
  StateUpdate,
  InterfaceAdapterStatus
} from '../types/templum-types';
import { 
  ITemplumOrchestrator, 
  IInterfaceAdapter 
} from './templum-orchestrator-interface';
import {
  TerminalUI,
  DefaultColorThemes,
  ProgressBar,
  Spinner,
  InteractivePrompt,
  ResponsiveLayout,
  createDefaultTerminalUI
} from './terminal-ui-components';
import { StringUtils } from '../utils/chainable-string-utils';
import chalk from 'chalk';
import { 
  InteractiveMenuRenderer, 
  MenuInteractionResult 
} from './interactive-menu-renderer';
import { 
  CLIDisplayConsistencyEngine, 
  createCLIDisplayConsistencyEngine,
  BackendStatusDisplayData 
} from './cli-display-consistency-engine';
import { ServiceInfo } from './service-ordering-manager';

/**
 * CLI Input Types (Interface-specific)
 */
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

/**
 * CLI Session State Interface
 * TODO: [TASK-ID-003] Pattern: session-persistence | Complexity: 6 | Dependencies: file-system,state-management
 * Context: Session state management for CLI persistence across restarts with navigation history and preferences
 * Validation-Required: state-serialization, persistence-validation, recovery-testing
 * Pattern-Info: { approach: "file-based-session-state", alternatives: "memory-only,database", trade-offs: "persistence-vs-performance" }
 */
export interface CLISessionState {
  sessionId: string;
  currentMenu: string;
  navigationHistory: string[];
  interactionMode: 'menu' | 'command';
  preferences: {
    theme: string;
    autoSave: boolean;
    lastBackend?: string;
  };
  lastActivity: number;
  commandHistory: string[];
  created: number;
  version: string;
}

/**
 * CLI Session Manager
 * Handles session persistence and restoration across CLI restarts
 */
export class CLISessionManager {
  private sessionFile: string;
  private currentSession: CLISessionState;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor() {
    const os = require('os');
    const path = require('path');
    const homeDir = os.homedir();
    const templumDir = path.join(homeDir, '.templum');
    
    // Ensure .templum directory exists
    const fs = require('fs');
    if (!fs.existsSync(templumDir)) {
      fs.mkdirSync(templumDir, { recursive: true });
    }
    
    this.sessionFile = path.join(templumDir, 'cli-session.json');
    this.currentSession = this.createDefaultSession();
  }

  /**
   * Initialize session manager and restore previous session if available
   */
  async initialize(): Promise<void> {
    try {
      await this.loadSession();
      this.startAutoSave();
      console.log(`CLI Session restored: ${this.currentSession.sessionId}`);
    } catch (error) {
      console.warn('Failed to restore previous session, using new session');
      await this.saveSession();
    }
  }

  /**
   * Create default session state
   */
  private createDefaultSession(): CLISessionState {
    return {
      sessionId: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      currentMenu: 'main',
      navigationHistory: [],
      interactionMode: 'menu',
      preferences: {
        theme: 'dark',
        autoSave: true
      },
      lastActivity: Date.now(),
      commandHistory: [],
      created: Date.now(),
      version: '1.0'
    };
  }

  /**
   * Load session from disk
   */
  private async loadSession(): Promise<void> {
    const fs = require('fs').promises;
    
    try {
      if (require('fs').existsSync(this.sessionFile)) {
        const sessionData = await fs.readFile(this.sessionFile, 'utf8');
        const loadedSession = JSON.parse(sessionData) as CLISessionState;
        
        // Validate session format and version
        if (loadedSession.version === '1.0' && loadedSession.sessionId) {
          this.currentSession = loadedSession;
          this.currentSession.lastActivity = Date.now(); // Update activity timestamp
        } else {
          throw new Error('Invalid or outdated session format');
        }
      }
    } catch (error) {
      throw new Error(`Session load failed: ${error}`);
    }
  }

  /**
   * Save current session to disk
   */
  async saveSession(): Promise<void> {
    try {
      const fs = require('fs').promises;
      this.currentSession.lastActivity = Date.now();
      
      const sessionData = JSON.stringify(this.currentSession, null, 2);
      await fs.writeFile(this.sessionFile, sessionData, 'utf8');
    } catch (error) {
      console.warn(`Failed to save session: ${error}`);
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.currentSession.preferences.autoSave) {
      this.autoSaveInterval = setInterval(async () => {
        await this.saveSession();
      }, 30000); // Save every 30 seconds
    }
  }

  /**
   * Stop auto-save timer
   */
  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Update session state
   */
  updateSession(updates: Partial<CLISessionState>): void {
    this.currentSession = { ...this.currentSession, ...updates };
    this.currentSession.lastActivity = Date.now();
  }

  /**
   * Get current session state
   */
  getCurrentSession(): CLISessionState {
    return { ...this.currentSession };
  }

  /**
   * Add command to history
   */
  addCommandToHistory(command: string): void {
    this.currentSession.commandHistory.unshift(command);
    
    // Keep only last 100 commands
    if (this.currentSession.commandHistory.length > 100) {
      this.currentSession.commandHistory = this.currentSession.commandHistory.slice(0, 100);
    }
    
    this.currentSession.lastActivity = Date.now();
  }

  /**
   * Set current menu and update navigation history
   */
  navigateToMenu(menuId: string, addToHistory: boolean = true): void {
    if (addToHistory && this.currentSession.currentMenu !== menuId) {
      this.currentSession.navigationHistory.push(this.currentSession.currentMenu);
      
      // Keep navigation history manageable
      if (this.currentSession.navigationHistory.length > 20) {
        this.currentSession.navigationHistory = this.currentSession.navigationHistory.slice(-20);
      }
    }
    
    this.currentSession.currentMenu = menuId;
    this.currentSession.lastActivity = Date.now();
  }

  /**
   * Navigate back in history
   */
  navigateBack(): string | null {
    if (this.currentSession.navigationHistory.length > 0) {
      const previousMenu = this.currentSession.navigationHistory.pop()!;
      this.currentSession.currentMenu = previousMenu;
      this.currentSession.lastActivity = Date.now();
      return previousMenu;
    }
    return null;
  }

  /**
   * Switch interaction mode
   */
  switchInteractionMode(mode: 'menu' | 'command'): void {
    this.currentSession.interactionMode = mode;
    this.currentSession.lastActivity = Date.now();
  }

  /**
   * Cleanup and save session
   */
  async dispose(): Promise<void> {
    this.stopAutoSave();
    await this.saveSession();
  }
}

export interface CLIRenderResult {
  success: boolean;
  rendered: boolean;
  output?: string;
  errors?: string[];
}

/**
 * Abstracted CLI Interface Adapter
 * 
 * This adapter uses the ITemplumOrchestrator abstraction instead of directly coupling
 * to concrete implementations like UniversalCommandRegistry, UniversalMenuRegistry, etc.
 * This provides proper separation of concerns and enables dependency inversion.
 */
export class CLIInterfaceAdapter extends EventEmitter implements IInterfaceAdapter {
  private orchestrator!: ITemplumOrchestrator;
  private readlineInterface: readline.Interface | null = null;
  private currentMenu: string = 'main';
  private navigationHistory: string[] = [];
  private keyboardShortcuts = new Map<string, string>();
  private isInteractiveMode: boolean = false;
  private config: CLIAdapterConfig;
  private terminalUI: TerminalUI;
  private activeSpinner: Spinner | null = null;
  private activeProgressBar: ProgressBar | null = null;
  private interactiveMenuRenderer: InteractiveMenuRenderer | null = null;
  private interactionMode: 'menu' | 'command' = 'menu';
  private sessionManager: CLISessionManager;
  private consistencyEngine: CLIDisplayConsistencyEngine;

  private formatColumn(
    value: unknown,
    width: number,
    alignment: 'left' | 'right' | 'center' = 'right'
  ): string {
    const text = value === null || value === undefined ? '' : String(value);
    return StringUtils.chain(text, { mode: 'terminal' }).pad(width, alignment).value();
  }

  constructor(config?: Partial<CLIAdapterConfig>) {
    super();
    
    this.config = {
      enableInteractiveMode: true,
      enableKeyboardShortcuts: true,
      enableColorOutput: true,
      enableProgressIndicators: true,
      clearScreenOnRender: true,
      maxHistorySize: 50,
      inputTimeout: 30000,
      terminalTheme: 'default',
      enableResponsiveLayout: true,
      ...config
    };

    // Initialize terminal UI with centralized defaults
    this.terminalUI = createDefaultTerminalUI(this.config.terminalTheme);
    
    // Initialize session manager
    // TODO: [TASK-ID-004] Pattern: session-manager-integration | Complexity: 4 | Dependencies: session-persistence
    // Context: Integration of session persistence into CLI adapter lifecycle
    // Validation-Required: session-restoration, state-synchronization, cleanup-verification
    // Pattern-Info: { approach: "constructor-initialization", alternatives: "lazy-initialization", trade-offs: "startup-cost-vs-reliability" }
    this.sessionManager = new CLISessionManager();
    
    // Initialize consistency engine with responsive layout integration
    // TODO: [TASK-ID-005] Pattern: display-consistency-integration | Complexity: 6 | Dependencies: consistency-framework,responsive-layout
    // Context: Integration of CLI display consistency engine for uniform formatting across all display elements
    // Validation-Required: consistency-enforcement, skin-compatibility, responsive-behavior
    // Pattern-Info: { approach: "centralized-consistency-engine", alternatives: "distributed-formatting", trade-offs: "uniformity-vs-flexibility" }
    this.consistencyEngine = createCLIDisplayConsistencyEngine({
      enforceWidthStandards: this.config.enableResponsiveLayout,
      enforceServiceOrdering: true, // Always enforce connected-first, alphabetical ordering
      enforceLayoutNormalization: true,
      skinCompatibilityMode: true,
      responsiveBreakpoints: {
        small: 60,
        medium: 100,
        large: 140
      }
    });
  }

  /**
   * Initialize with orchestrator abstraction
   */
  async initialize(orchestrator: ITemplumOrchestrator): Promise<void> {
    this.orchestrator = orchestrator;
    
    // Initialize session management first
    await this.sessionManager.initialize();
    
    // Restore session state
    const session = this.sessionManager.getCurrentSession();
    this.currentMenu = session.currentMenu;
    this.navigationHistory = [...session.navigationHistory];
    this.interactionMode = session.interactionMode;
    
    // Register this adapter with the orchestrator
    await this.orchestrator.registerInterface('cli', this);
    
    // Initialize CLI components
    await this.initializeCLIComponents();
    
    console.log(`CLIInterfaceAdapter: Initialized with session ${session.sessionId}`);
  }

  getInterfaceType(): InterfaceType {
    return 'cli';
  }

  supportsSkin(skinDefinition: UniversalSkinDefinition): boolean {
    // Check if this skin is compatible with CLI interface
    return skinDefinition.metadata.compatibleInterfaces.includes('cli');
  }

  /**
   * Sync state update from orchestrator
   */
  async syncState(stateUpdate: StateUpdate): Promise<void> {
    try {
      // Handle state synchronization for CLI interface
      console.log(`CLIInterfaceAdapter: Received state update at ${new Date(stateUpdate.timestamp).toISOString()}`);
      
      // Update local state based on menu updates
      if (stateUpdate.menuUpdates) {
        for (const [menuId, menuUpdate] of Object.entries(stateUpdate.menuUpdates)) {
          if (menuUpdate.refreshRequired && menuId !== this.currentMenu) {
            console.log(`CLIInterfaceAdapter: Menu refresh required for ${menuId}`);
          }
          // Handle navigation state changes if available
          if (menuUpdate.navigationState) {
            console.log(`CLIInterfaceAdapter: Navigation state updated for ${menuId}`);
          }
        }
      }
      
      // Handle session state updates
      if (stateUpdate.sessionState) {
        console.log('CLIInterfaceAdapter: Session state synchronized');
      }

      this.emit('stateUpdated', stateUpdate);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('CLIInterfaceAdapter: State sync failed:', errorMessage);
    }
  }

  /**
   * Get adapter status information
   */
  getStatus(): InterfaceAdapterStatus {
    return {
      active: this.orchestrator?.isInitialized() && this.isInteractiveMode,
      interfaceType: 'cli',
      initialized: this.orchestrator?.isInitialized() || false,
      connected: this.isInteractiveMode,
      lastActivity: Date.now(),
      activeSession: this.isInteractiveMode ? 'interactive' : undefined,
      error: undefined,
      performance: {
        averageResponseTime: 0, // CLI is typically immediate response
        totalCommands: 0, // Could track this if needed
        errorRate: 0 // Could track this if needed
      },
      configuration: {
        interactiveMode: this.config.enableInteractiveMode,
        keyboardShortcuts: this.config.enableKeyboardShortcuts,
        colorOutput: this.config.enableColorOutput
      }
    };
  }


  /**
   * Apply skin definition using orchestrator abstraction
   */
  async applySkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    if (!this.orchestrator.isInitialized()) {
      console.warn('CLIInterfaceAdapter: Cannot apply skin - orchestrator not ready');
      return;
    }

    try {
      // Note: Terminal theme should remain as DefaultColorThemes per established pattern
      // Skin themes are for content rendering, not terminal UI components
      // Use orchestrator's skin engine through abstraction
      const skinEngine = this.orchestrator.getUniversalSkinEngine();
      
      // Render skin for CLI interface
      if (skinEngine.renderForInterface) {
        const renderResult = await skinEngine.renderForInterface(
          skinDefinition, 
          'cli', 
          { 
            interfaceType: 'cli',
            interactive: this.config.enableInteractiveMode,
            colorDepth: this.config.enableColorOutput ? 8 : 0
          }
        );

        // Generate CLI output using skin engine abstraction
        let renderedOutput = '';
        if (skinEngine.generateSkinHTML) {
          // Use HTML generation method and convert to CLI format
          const htmlOutput = skinEngine.generateSkinHTML(renderResult, skinDefinition);
          renderedOutput = this.convertHTMLToCLI(htmlOutput, skinDefinition);
        } else {
          // Fallback rendering if skin engine doesn't provide HTML generation
          renderedOutput = this.generateFallbackCLIOutput(renderResult, skinDefinition);
        }

        // Output the rendered CLI content
        console.log(renderedOutput);
        
        // Show keyboard shortcuts if enabled
        if (this.config.enableKeyboardShortcuts && this.keyboardShortcuts.size > 0) {
          this.displayKeyboardShortcuts();
        }

        console.log(`CLIInterfaceAdapter: Applied skin ${skinDefinition.metadata.name} via orchestrator abstraction`);
      }
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      console.error(`CLIInterfaceAdapter: Failed to apply skin: ${errorMessage}`);
    }
  }

  /**
   * Execute command using orchestrator abstraction with terminal UI enhancements
   */
  async executeCommand(command: string, args: any[] = []): Promise<any> {
    if (!this.orchestrator.isInitialized()) {
      throw createTemplumError('Orchestrator not initialized', 'SERVICE_NOT_READY', 'configuration');
    }

    let spinner: Spinner | null = null;
    
    try {
      // Show spinner for command execution if enabled
      if (this.config.enableProgressIndicators) {
        spinner = this.terminalUI.createSpinner({
          text: `Executing command: ${command}`,
          frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
        });
        spinner.start();
      }
      
      // Execute command through orchestrator abstraction
      const result = await this.orchestrator.executeCommand(
        command,
        'cli',
        args,
        { 
          source: 'CLIInterfaceAdapter', 
          timestamp: Date.now(),
          interactive: this.isInteractiveMode,
          currentMenu: this.currentMenu
        }
      );

      // TASK-CLI-014: Check if orchestrator indicates command should be handled locally
      if (result && result.handleLocally === true) {
        // Process command locally instead of forwarding to service
        console.log(`[CLI] Processing command '${command}' locally`);
        
        if (spinner) {
          spinner.info(`Processing '${command}' locally`);
        }
        
        // Handle local command processing
        const localResult = await this.processLocalCommand(command, args);
        
        if (spinner) {
          spinner.succeed(`Command '${command}' processed locally`);
        }
        
        return localResult;
      }

      // Stop spinner and show success for remote commands
      if (spinner) {
        spinner.succeed(`Command '${command}' executed successfully`);
      }

      // Display results in CLI format with responsive layout
      this.displayCommandResult(result);
      
      return result;
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      
      // Stop spinner and show error
      if (spinner) {
        spinner.fail(`Command '${command}' failed: ${errorMessage}`);
      }
      
      throw createTemplumError(`Command execution failed: ${errorMessage}`, 'COMMAND_EXECUTION_ERROR', 'runtime');
    }
  }

  /**
   * TASK-CLI-014: Process local CLI commands that should not be forwarded to Templum Core
   * @private
   */
  private async processLocalCommand(command: string, _args: any[] = []): Promise<any> {
    const cmd = command.trim().toLowerCase();
    
    try {
      // Handle different types of local commands
      if (cmd === 'help') {
        await this.displayHelp();
        return { success: true, message: 'Help displayed', command };
        
      } else if (cmd === 'refresh') {
        await this.loadInitialContent();
        return { success: true, message: 'CLI content refreshed', command };
        
      } else if (cmd === 'status') {
        await this.displayAvailableBackends();
        return { success: true, message: 'Backend status displayed', command };
        
      } else if (cmd === 'back') {
        // Navigate back in menu history using session manager
        const previousMenu = this.sessionManager.navigateBack();
        if (previousMenu) {
          this.currentMenu = previousMenu;
          await this.loadInitialContent();
          return { success: true, message: `Navigated back to ${previousMenu}`, command };
        } else {
          return { success: false, message: 'No previous menu in history', command };
        }
        
      } else if (cmd === 'home') {
        // Navigate to main menu
        this.sessionManager.navigateToMenu('main', true);
        this.currentMenu = 'main';
        this.navigationHistory = [];
        await this.loadInitialContent();
        return { success: true, message: 'Navigated to main menu', command };
        
      } else if (cmd === 'c' || cmd === 'command') {
        // TODO: [TASK-ID-005] Pattern: dual-interaction-modes | Complexity: 5 | Dependencies: terminal-ui-components,session-persistence
        // Context: Switch to command mode with preserved session state and seamless mode switching
        // Validation-Required: mode-switching, state-preservation, user-experience
        // Pattern-Info: { approach: "hotkey-mode-switching", alternatives: "menu-selection,flag-based", trade-offs: "immediacy-vs-discoverability" }
        return await this.switchToCommandMode();
        
      } else if (cmd === 'm' || cmd === 'menu') {
        // Switch to menu mode
        return await this.switchToMenuMode();
        
      } else if (cmd.startsWith('load ')) {
        // Load specific backend skin
        const backendId = cmd.substring(5).trim();
        await this.loadSpecificBackendSkin(backendId);
        return { success: true, message: `Attempted to load skin from ${backendId}`, command };
        
      } else if (/^\d+$/.test(cmd)) {
        // Handle numeric menu selection
        await this.handleInput({
          type: 'menu_selection',
          value: cmd,
          context: { currentMenu: this.currentMenu }
        });
        return { success: true, message: `Menu selection: ${cmd}`, command };
        
      } else if (cmd === 'quit' || cmd === 'exit') {
        // Handle exit commands
        console.log('👋 Goodbye!');
        process.exit(0);
        
      } else {
        // Unknown local command
        console.log(`❌ Unknown local command: ${command}`);
        console.log('💡 Type "help" to see available commands');
        return { success: false, message: `Unknown local command: ${command}`, command };
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Local command processing failed: ${errorMessage}`);
      return { success: false, error: errorMessage, command };
    }
  }

  /**
   * Start interactive CLI session with visual menu navigation
   */
  async startInteractiveSession(initialMenu = 'main'): Promise<void> {
    if (!this.config.enableInteractiveMode) {
      throw createTemplumError('Interactive mode not enabled', 'CONFIGURATION_ERROR', 'configuration');
    }

    if (!this.orchestrator.isInitialized()) {
      throw createTemplumError('Orchestrator not initialized', 'SERVICE_NOT_READY', 'configuration');
    }

    try {
      this.isInteractiveMode = true;
      this.currentMenu = initialMenu;
      this.navigationHistory = [];

      // Initialize interactive menu renderer
      this.interactiveMenuRenderer = new InteractiveMenuRenderer(this.orchestrator);

      // Show welcome message
      console.log(chalk.green('✅ Connected to Templum service successfully'));
      console.log(chalk.blue('🚀 Starting Templum interactive session...'));
      console.log(chalk.gray('Use arrow keys to navigate, Enter to select, Ctrl+C to exit'));
      console.log(chalk.gray('═'.repeat(60)));

      // TASK-CLI-014: Add automatic skin discovery and loading during initialization
      console.log(chalk.blue('🔍 Discovering and loading backend skins...'));
      await this.loadInitialContent();
      console.log(chalk.gray('═'.repeat(60)));

      this.emit('interactiveSessionStarted', { menu: initialMenu, timestamp: Date.now() });

      // Start interactive menu loop
      await this.runInteractiveMenuLoop();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createTemplumError(`Failed to start interactive session: ${errorMessage}`, 'SESSION_START_ERROR', 'runtime');
    }
  }

  /**
   * Run interactive menu loop with navigation and command execution
   */
  private async runInteractiveMenuLoop(): Promise<void> {
    if (!this.interactiveMenuRenderer) {
      throw createTemplumError('Interactive menu renderer not initialized', 'INTERNAL_ERROR', 'runtime');
    }

    let sessionRunning = true;
    const sessionHistory: string[] = [];

    try {
      while (sessionRunning && this.isInteractiveMode) {
        try {
          const result: MenuInteractionResult = await this.interactiveMenuRenderer.displayMenu();
          
          // Record interaction in session history
          sessionHistory.push(`${new Date().toISOString()}: ${result.action} - ${result.target || result.command || 'unknown'}`);
          
          switch (result.action) {
            case 'navigate':
            case 'back':
              // Navigation is handled by the menu renderer
              break;
              
            case 'execute':
              if (result.command) {
                await this.executeMenuCommand(result.command, result.data);
                
                // TODO: [TASK-MCP-010-002] Pattern: cli-design-compliance | Complexity: 3 | Dependencies: command-execution,navigation-flow
                // Context: Replaced Press Enter message with timeout-based flow per CLI-design specification
                // Validation-Required: command-execution-flow, user-experience-timing, cli-design-compliance
                // Pattern-Info: { approach: "timeout-based-continuation", alternatives: "immediate-return", trade-offs: "result-visibility-vs-flow-speed" }
                // Brief pause to show result, then return to menu
                // CLI-design compliance: No Press Enter messages
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
              break;
              
            case 'help':
              // Help is displayed by the menu renderer, just wait for user
              await this.waitForKeypress();
              break;
              
            case 'quit':
              sessionRunning = false;
              break;
          }
          
        } catch (error) {
          if ((error as any).isTtyError === false || (error as any).name === 'ExitPromptError') {
            // User pressed Ctrl+C
            sessionRunning = false;
          } else {
            console.error(chalk.red('Menu interaction error:'), error);
            // TODO: [TASK-MCP-010-003] Pattern: cli-design-compliance | Complexity: 3 | Dependencies: error-handling,navigation-flow
            // Context: Replaced Press Enter message with timeout-based error handling per CLI-design specification
            // Validation-Required: error-display-timing, user-experience-flow, cli-design-compliance
            // Pattern-Info: { approach: "timeout-based-error-handling", alternatives: "immediate-return", trade-offs: "error-visibility-vs-flow-interruption" }
            // Brief pause to display error, then return to menu
            // CLI-design compliance: No Press Enter messages
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
    } finally {
      // Store session history for potential debugging
      this.navigationHistory = sessionHistory;
      
      console.log(chalk.yellow('\n🛑 Interactive session ended'));
      console.log(chalk.gray(`Session history: ${sessionHistory.length} interactions recorded`));
    }
  }

  /**
   * Execute command from menu selection
   */
  private async executeMenuCommand(command: string, data?: any): Promise<void> {
    try {
      console.log(chalk.blue(`\n⚡ Executing: ${command}`));
      
      const [namespace, action, ...args] = command.split(':');
      
      switch (namespace) {
        case 'system':
          await this.handleSystemCommand(action, args, data);
          break;
          
        case 'services':
          await this.handleServicesCommand(action, args, data);
          break;
          
        case 'backend':
          await this.handleBackendCommand(action, args, data);
          break;
          
        case 'command':
          await this.handleCommandExecution(action, args, data);
          break;
          
        case 'settings':
          await this.handleSettingsCommand(action, args, data);
          break;
          
        case 'execute':
          // Execute command on specific backend
          if (args.length > 0) {
            const backendId = args[0];
            const commandToExecute = await this.promptForCommand(`Enter command for ${backendId}:`);
            if (commandToExecute.trim()) {
              const result = await this.orchestrator.executeCommand(
                commandToExecute, 
                'cli', 
                [], 
                { backendId, source: 'interactive-menu' }
              );
              this.displayCommandResult(result);
            }
          }
          break;
          
        default:
          console.log(chalk.yellow(`Unknown command namespace: ${namespace}`));
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`Command execution failed: ${errorMessage}`));
    }
  }

  /**
   * Handle system commands
   */
  private async handleSystemCommand(action: string, _args: string[], _data?: any): Promise<void> {
    switch (action) {
      case 'status':
        const systemStatus = this.orchestrator.getSystemStatus();
        console.log(chalk.green('\n📊 System Status:'));
        console.log(`  Initialized: ${systemStatus.coreEngine.initialized ? '✅' : '❌'}`);
        console.log(`  Active Interfaces: ${systemStatus.activeInterfaces?.join(', ') || 'None'}`);
        
        if (systemStatus.coreEngine?.backendConnections?.backends) {
          const backends = Object.entries(systemStatus.coreEngine.backendConnections.backends);
          console.log(`  Connected Backends: ${backends.length}`);
          
          if (backends.length > 0) {
            this.displayBackendStatus({ backends: systemStatus.coreEngine.backendConnections.backends });
          }
        }
        break;
        
      default:
        console.log(chalk.yellow(`Unknown system command: ${action}`));
    }
  }

  /**
   * Handle services commands
   */
  private async handleServicesCommand(action: string, _args: string[], _data?: any): Promise<void> {
    switch (action) {
      case 'list':
        const systemStatus = this.orchestrator.getSystemStatus();
        if (systemStatus.coreEngine?.backendConnections?.backends) {
          this.displayBackendStatus({ backends: systemStatus.coreEngine.backendConnections.backends });
        } else {
          console.log(chalk.yellow('No backend services found'));
        }
        break;
        
      case 'refresh':
        console.log(chalk.blue('🔄 Refreshing backend services...'));
        await this.orchestrator.refreshBackendServices();
        console.log(chalk.green('✅ Backend services refreshed'));
        break;
        
      default:
        console.log(chalk.yellow(`Unknown services command: ${action}`));
    }
  }

  /**
   * Handle backend-specific commands
   */
  private async handleBackendCommand(action: string, args: string[], _data?: any): Promise<void> {
    if (action === 'info' && args.length > 0) {
      const backendId = args[0];
      const systemStatus = this.orchestrator.getSystemStatus();
      
      const backends = systemStatus.coreEngine?.backendConnections?.backends;
      if (backends) {
        // Find the backend in the typed structure
        const backendEntry = Object.entries(backends).find(([key]) => key === backendId);
        if (backendEntry) {
          const [_key, backend] = backendEntry;
          console.log(chalk.green(`\n📋 Backend Info: ${backendId}`));
          console.log(`  Connected: ${backend.connected ? '✅' : '❌'}`);
          console.log(`  Health: ${backend.health || 'Unknown'}`);
          console.log(`  Last Check: ${new Date(backend.lastCheck).toISOString()}`);
          
          if (backend.capabilities) {
            console.log(`  Capabilities: ${backend.capabilities.join(', ')}`);
          }
          
          if (backend.version) {
            console.log(`  Version: ${backend.version}`);
          }
          
          if (backend.responseTime) {
            console.log(`  Response Time: ${backend.responseTime}ms`);
          }
        } else {
          console.log(chalk.yellow(`Backend not found: ${backendId}`));
        }
      } else {
        console.log(chalk.yellow(`Backend not found: ${backendId}`));
      }
    } else {
      console.log(chalk.yellow(`Unknown backend command: ${action}`));
    }
  }

  /**
   * Handle command execution
   */
  private async handleCommandExecution(action: string, _args: string[], _data?: any): Promise<void> {
    if (action === 'custom') {
      const command = await this.promptForCommand('Enter command to execute:');
      if (command.trim()) {
        const result = await this.orchestrator.executeCommand(
          command, 
          'cli', 
          [], 
          { source: 'interactive-menu-custom' }
        );
        this.displayCommandResult(result);
      }
    }
  }

  /**
   * Handle settings commands
   */
  private async handleSettingsCommand(action: string, _args: string[], _data?: any): Promise<void> {
    switch (action) {
      case 'toggle-mode':
        console.log(chalk.blue('🔀 Switching to command mode...'));
        this.interactionMode = 'command';
        
        // Switch to command mode (would need additional implementation)
        console.log(chalk.yellow('Command mode not yet implemented - staying in menu mode'));
        break;
        
      default:
        console.log(chalk.yellow(`Unknown settings command: ${action}`));
    }
  }

  /**
   * Wait for user keypress without conflicting with main inquirer session
   * TASK-CLI-009: Fixed nested inquirer calls causing terminal state corruption
   */
  private async waitForKeypress(): Promise<void> {
    return new Promise((resolve) => {
      const stdin = process.stdin;
      
      // Check if we're in a TTY environment
      if (stdin.isTTY) {
        // Use a simple one-time listener without changing terminal modes
        // This avoids conflicts with the main inquirer session
        stdin.resume();
        const listener = () => {
          stdin.removeListener('data', listener);
          stdin.pause();
          resolve();
        };
        stdin.once('data', listener);
      } else {
        // Non-TTY environment (automated testing, etc.)
        setTimeout(() => resolve(), 1000);
      }
    });
  }

  /**
   * Prompt for custom command input
   */
  private async promptForCommand(message: string): Promise<string> {
    const inquirer = await import('inquirer');
    const { command } = await inquirer.default.prompt([
      {
        type: 'input',
        name: 'command',
        message: message
      }
    ]);
    return command;
  }

  /**
   * Stop interactive CLI session
   */
  async stopInteractiveSession(): Promise<void> {
    this.isInteractiveMode = false;
    
    if (this.readlineInterface) {
      this.readlineInterface.removeAllListeners();
      this.readlineInterface.close();
      this.readlineInterface = null;
    }

    this.emit('interactiveSessionStopped', { timestamp: Date.now() });
    console.log('CLIInterfaceAdapter: Interactive session stopped');
  }

  async dispose(): Promise<void> {
    try {
      // Stop interactive session if active
      if (this.isInteractiveMode) {
        await this.stopInteractiveSession();
      }

      // Cleanup session manager
      await this.sessionManager.dispose();

      // Cleanup terminal UI components
      await this.terminalUI.cleanup();

      // Clean up resources
      this.keyboardShortcuts.clear();
      this.navigationHistory = [];
      this.removeAllListeners();
      
      console.log('CLIInterfaceAdapter: Disposed successfully with session saved');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('CLIInterfaceAdapter disposal error:', errorMessage);
    }
  }

  /**
   * Switch to command mode with session persistence
   * TODO: [TASK-ID-006] Pattern: command-mode-implementation | Complexity: 6 | Dependencies: dual-interaction-modes,session-persistence
   * Context: Implement direct command input mode with readline interface and command history
   * Validation-Required: command-parsing, history-management, error-handling
   * Pattern-Info: { approach: "readline-based-command-mode", alternatives: "prompt-library", trade-offs: "control-vs-simplicity" }
   */
  private async switchToCommandMode(): Promise<any> {
    console.log(chalk.blue('\n🔧 Switching to Command Mode'));
    console.log(chalk.gray('Type commands directly. Use "m" to return to menu mode.'));
    console.log(chalk.gray('Commands: help, status, load <backend>, quit, etc.'));
    console.log(chalk.gray('═'.repeat(50)));
    
    this.interactionMode = 'command';
    this.sessionManager.switchInteractionMode('command');
    
    // Start command mode input loop
    await this.runCommandModeLoop();
    
    return { success: true, message: 'Entered command mode', mode: 'command' };
  }

  /**
   * Switch to menu mode with session persistence
   */
  private async switchToMenuMode(): Promise<any> {
    console.log(chalk.blue('\n📋 Switching to Menu Mode'));
    console.log(chalk.gray('Use arrow keys to navigate, Enter to select.'));
    console.log(chalk.gray('═'.repeat(50)));
    
    this.interactionMode = 'menu';
    this.sessionManager.switchInteractionMode('menu');
    
    // Refresh menu content
    await this.loadInitialContent();
    
    return { success: true, message: 'Entered menu mode', mode: 'menu' };
  }

  /**
   * Run command mode input loop with readline
   */
  private async runCommandModeLoop(): Promise<void> {
    const readline = require('readline');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('templum> ')
    });

    // Setup command history
    const session = this.sessionManager.getCurrentSession();
    if (session.commandHistory.length > 0) {
      // Note: readline history setup would require more complex implementation
      console.log(chalk.gray(`Command history available (${session.commandHistory.length} commands)`));
    }

    rl.prompt();

    return new Promise((resolve) => {
      rl.on('line', async (input: string) => {
        const command = input.trim();
        
        if (!command) {
          rl.prompt();
          return;
        }

        // Add command to session history
        this.sessionManager.addCommandToHistory(command);

        // Check for mode switching
        if (command === 'm' || command === 'menu') {
          rl.close();
          await this.switchToMenuMode();
          resolve();
          return;
        }

        // Check for exit
        if (command === 'quit' || command === 'exit') {
          console.log('👋 Goodbye!');
          rl.close();
          process.exit(0);
        }

        try {
          // Process the command
          const result = await this.processLocalCommand(command);
          
          if (result.success) {
            console.log(chalk.green(`✅ ${result.message}`));
          } else {
            console.log(chalk.red(`❌ ${result.message}`));
          }
          
        } catch (error) {
          // TODO: [TASK-ID-007] Pattern: intelligent-error-recovery | Complexity: 7 | Dependencies: error-recovery-patterns,user-guidance
          // Context: Enhanced error handling with recovery suggestions and user guidance
          // Validation-Required: error-categorization, recovery-suggestion-accuracy, user-experience
          // Pattern-Info: { approach: "contextual-error-recovery", alternatives: "generic-error-display", trade-offs: "complexity-vs-user-experience" }
          await this.handleIntelligentError(error, command, 'command-mode');
        }

        rl.prompt();
      });

      rl.on('close', () => {
        resolve();
      });

      rl.on('SIGINT', () => {
        console.log(chalk.yellow('\n🔄 Use "m" to switch to menu mode or "quit" to exit'));
        rl.prompt();
      });
    });
  }

  /**
   * Intelligent error handling with contextual recovery suggestions
   * TODO: [TASK-ID-008] Pattern: contextual-error-recovery-system | Complexity: 8 | Dependencies: error-analysis,user-guidance-patterns
   * Context: Comprehensive error analysis and recovery suggestion system with context-aware guidance
   * Validation-Required: error-pattern-recognition, suggestion-relevance, recovery-success-rate
   * Pattern-Info: { approach: "pattern-based-error-analysis", alternatives: "static-error-mapping", trade-offs: "intelligence-vs-maintainability" }
   */
  private async handleIntelligentError(error: any, context: string, source: string): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = this.categorizeError(error, context);
    
    // Display error with context
    console.log(chalk.red(`\n❌ ${errorType.category}: ${errorMessage}`));
    
    // Provide recovery suggestions
    const suggestions = this.generateRecoverySuggestions(errorType, context, source);
    if (suggestions.length > 0) {
      console.log(chalk.yellow('\n💡 Recovery Suggestions:'));
      suggestions.forEach((suggestion, index) => {
        console.log(chalk.yellow(`   ${index + 1}. ${suggestion.action}`));
        if (suggestion.command) {
          console.log(chalk.gray(`      Try: ${suggestion.command}`));
        }
      });
    }
    
    // Offer automated recovery if available
    const autoRecovery = this.getAutomatedRecovery(errorType, context);
    if (autoRecovery) {
      console.log(chalk.blue(`\n🔧 Auto-recovery available: ${autoRecovery.description}`));
      console.log(chalk.gray('Type "y" to attempt auto-recovery, or any other key to continue...'));
      
      // Note: In a full implementation, this would wait for user input
      // For now, just log the availability
    }
    
    // Log error for session history
    this.sessionManager.addCommandToHistory(`ERROR: ${context} - ${errorMessage}`);
  }

  /**
   * Categorize error based on patterns and context
   */
  private categorizeError(error: any, context: string): { category: string; severity: 'low' | 'medium' | 'high'; recoverable: boolean } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // IPC/Communication errors
    if (errorMessage.includes('IPC') || errorMessage.includes('timeout') || errorMessage.includes('ENOENT')) {
      return { category: 'Communication Error', severity: 'high', recoverable: true };
    }
    
    // Service discovery errors
    if (errorMessage.includes('service') && (errorMessage.includes('not found') || errorMessage.includes('unavailable'))) {
      return { category: 'Service Unavailable', severity: 'high', recoverable: true };
    }
    
    // Command syntax errors
    if (errorMessage.includes('Unknown') && context.includes('command')) {
      return { category: 'Command Error', severity: 'low', recoverable: true };
    }
    
    // Backend errors
    if (errorMessage.includes('backend') || errorMessage.includes('skin')) {
      return { category: 'Backend Error', severity: 'medium', recoverable: true };
    }
    
    // File system errors
    if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
      return { category: 'Permission Error', severity: 'medium', recoverable: true };
    }
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return { category: 'Network Error', severity: 'high', recoverable: true };
    }
    
    // Default categorization
    return { category: 'System Error', severity: 'medium', recoverable: false };
  }

  /**
   * Generate contextual recovery suggestions
   */
  private generateRecoverySuggestions(errorType: { category: string; severity: string; recoverable: boolean }, context: string, source: string): Array<{ action: string; command?: string; priority: number }> {
    const suggestions: Array<{ action: string; command?: string; priority: number }> = [];
    
    switch (errorType.category) {
      case 'Communication Error':
        suggestions.push(
          { action: 'Check if Templum service is running', command: 'ps aux | grep templum', priority: 1 },
          { action: 'Restart Templum service if needed', command: 'node dist/src/index.js', priority: 2 },
          { action: 'Check service registry', command: 'ls ~/.templum/services/', priority: 3 }
        );
        break;
        
      case 'Service Unavailable':
        suggestions.push(
          { action: 'Refresh backend services', command: 'refresh', priority: 1 },
          { action: 'Check backend status', command: 'status', priority: 2 },
          { action: 'Load specific backend manually', command: 'load <backend-id>', priority: 3 }
        );
        break;
        
      case 'Command Error':
        suggestions.push(
          { action: 'View available commands', command: 'help', priority: 1 },
          { action: 'Check command spelling and syntax', priority: 2 },
          { action: 'Switch to menu mode for guided navigation', command: 'm', priority: 3 }
        );
        break;
        
      case 'Backend Error':
        suggestions.push(
          { action: 'Check backend connectivity', command: 'status', priority: 1 },
          { action: 'Try loading a different backend', command: 'load pcl', priority: 2 },
          { action: 'Restart CLI to refresh connections', priority: 3 }
        );
        break;
        
      case 'Permission Error':
        suggestions.push(
          { action: 'Check file permissions', priority: 1 },
          { action: 'Run with appropriate permissions', priority: 2 },
          { action: 'Check ~/.templum directory access', priority: 3 }
        );
        break;
        
      case 'Network Error':
        suggestions.push(
          { action: 'Check network connectivity', priority: 1 },
          { action: 'Verify service endpoints', priority: 2 },
          { action: 'Switch to local mode if available', priority: 3 }
        );
        break;
    }
    
    // Add context-specific suggestions
    if (source === 'command-mode') {
      suggestions.push({ action: 'Switch to menu mode for easier navigation', command: 'm', priority: 4 });
    }
    
    if (context.includes('skin')) {
      suggestions.push({ action: 'Try loading default skin', command: 'load default', priority: 4 });
    }
    
    return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Get automated recovery options
   */
  private getAutomatedRecovery(errorType: { category: string; severity: string; recoverable: boolean }, context: string): { description: string; action: () => Promise<void> } | null {
    if (!errorType.recoverable) {
      return null;
    }
    
    switch (errorType.category) {
      case 'Service Unavailable':
        return {
          description: 'Refresh backend services and reload interface',
          action: async () => {
            await this.orchestrator.refreshBackendServices();
            await this.loadInitialContent();
          }
        };
        
      case 'Backend Error':
        return {
          description: 'Reset to main menu and refresh content',
          action: async () => {
            this.sessionManager.navigateToMenu('main', false);
            this.currentMenu = 'main';
            await this.loadInitialContent();
          }
        };
        
      case 'Command Error':
        if (context.includes('load')) {
          return {
            description: 'Show available backends for loading',
            action: async () => {
              await this.displayAvailableBackends();
            }
          };
        }
        break;
    }
    
    return null;
  }

  /**
   * Create and display a progress bar for long-running operations
   */
  createProgressBar(total: number, message?: string): ProgressBar {
    const progressBar = this.terminalUI.createProgressBar({
      width: this.getOptimalProgressBarWidth(),
      format: ':bar :percent :eta :message',
      showPercentage: true,
      showEta: true
    });
    
    progressBar.start(total);
    if (message) {
      progressBar.update(0, message);
    }
    
    this.activeProgressBar = progressBar;
    return progressBar;
  }

  /**
   * Create an interactive prompt for user input
   */
  createPrompt(): InteractivePrompt {
    return this.terminalUI.createPrompt();
  }

  /**
   * Show a spinner with message
   */
  showSpinner(message: string): Spinner {
    const spinner = this.terminalUI.createSpinner({
      text: message
    });
    
    spinner.start();
    this.activeSpinner = spinner;
    return spinner;
  }

  /**
   * Hide active spinner
   */
  hideSpinner(finalMessage?: string): void {
    if (this.activeSpinner) {
      if (finalMessage) {
        this.activeSpinner.succeed(finalMessage);
      } else {
        this.activeSpinner.stop();
      }
      this.activeSpinner = null;
    }
  }

  /**
   * Set terminal theme
   */
  setTheme(themeName: keyof typeof DefaultColorThemes): void {
    const theme = DefaultColorThemes[themeName];
    if (theme) {
      this.terminalUI.setTheme(theme);
      this.config.terminalTheme = themeName;
    }
  }

  /**
   * Get responsive layout manager
   */
  getResponsiveLayout(): ResponsiveLayout {
    return this.terminalUI.getLayout();
  }

  /**
   * Format content with responsive layout
   */
  formatResponsiveContent<T>(content: T, formatters: {
    small: (content: T) => string;
    medium: (content: T) => string;
    large: (content: T) => string;
  }): string {
    return this.terminalUI.getLayout().formatForBreakpoint(content, formatters);
  }

  /**
   * Create responsive table display
   */
  displayTable(data: any[], headers: string[]): void {
    const table = this.terminalUI.getLayout().createTable(data, headers);
    console.log(table);
  }

  /**
   * Handle CLI input with proper abstraction
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('CLIInterfaceAdapter: Input handling error:', errorMessage);
      return { 
        handled: false, 
        errors: [errorMessage] 
      };
    }
  }

  /**
   * Initialize CLI components using orchestrator abstraction
   * @private
   */
  private async initializeCLIComponents(): Promise<void> {
    // Setup keyboard shortcuts
    if (this.config.enableKeyboardShortcuts) {
      await this.setupKeyboardShortcuts();
    }

    // Setup event handlers for orchestrator events
    this.setupEventHandlers();
  }

  /**
   * Load initial content using orchestrator abstraction
   * @private
   */
  private async loadInitialContent(): Promise<void> {
    if (!this.orchestrator.isInitialized()) {
      return;
    }

    try {
      console.log('CLIInterfaceAdapter: Loading initial content with real backend integration...');
      
      // Get system status with real backend connection information
      const systemStatus = this.orchestrator.getSystemStatus();
      const backendConnections = systemStatus.coreEngine?.backendConnections || { backends: {}, totalConnections: 0, healthyConnections: 0 };
      
      // Display backend status
      this.displayBackendStatus(backendConnections);
      
      // Prioritize healthy backends for skin loading
      const healthyBackends = Object.entries(backendConnections.backends || {})
        .filter(([_, status]) => status.connected && status.health === 'healthy')
        .sort((a, b) => {
          const aTime = a[1].responseTime || 1000;
          const bTime = b[1].responseTime || 1000;
          return aTime - bTime; // Prefer faster response times
        });

      console.log(`CLIInterfaceAdapter: Found ${healthyBackends.length} healthy backend(s) for integration`);

      // Attempt to load real skin from healthy backends
      let skinLoaded = false;
      for (const [backendId] of healthyBackends) {
        try {
          console.log(`CLIInterfaceAdapter: Attempting to load skin from ${backendId} backend...`);
          
          const skinDefinition = await this.orchestrator.loadBackendSkin(backendId);
          
          if (skinDefinition) {
            console.log(`CLIInterfaceAdapter: Successfully loaded skin from ${backendId}`);
            await this.applySkin(skinDefinition);
            skinLoaded = true;
            break;
          }
        } catch (error) {
          console.warn(`CLIInterfaceAdapter: Failed to load skin from ${backendId}:`, error);
        }
      }

      // Display fallback content if no skins loaded
      if (!skinLoaded) {
        console.log(this.getFallbackCLIOutput(backendConnections));
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('CLIInterfaceAdapter: Failed to load initial content:', errorMessage);
      console.log(this.getErrorCLIOutput(errorMessage));
    }
  }

  /**
   * Setup readline interface for interactive mode
   * @private
   */
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

    this.readlineInterface.prompt();
  }

  /**
   * Setup default keyboard shortcuts
   * @private
   */
  private async setupKeyboardShortcuts(): Promise<void> {
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

  /**
   * Setup event handlers for orchestrator events
   * @private
   */
  private setupEventHandlers(): void {
    // Listen for orchestrator events if accessible
    // Note: This would depend on the orchestrator's event interface
  }

  /**
   * Process interactive input
   * @private
   */
  private async processInteractiveInput(input: string): Promise<void> {
    if (!input) {
      this.readlineInterface?.prompt();
      return;
    }

    // Handle navigation commands
    if (input === 'back') {
      await this.handleNavigation({ type: 'navigation', value: 'back' });
    } else if (input === 'quit' || input === 'exit') {
      await this.stopInteractiveSession();
      return;
    } else if (input === 'help') {
      this.displayHelp();
    } else if (input === 'status') {
      const systemStatus = this.orchestrator.getSystemStatus();
      this.displayBackendStatus(systemStatus.coreEngine?.backendConnections || { backends: {}, totalConnections: 0, healthyConnections: 0 });
    } else if (input === 'refresh') {
      await this.loadInitialContent();
    } else if (input.startsWith('load ')) {
      // Manual backend skin loading
      const backendId = input.substring(5).trim();
      await this.loadSpecificBackendSkin(backendId);
    } else if (/^\d+$/.test(input)) {
      // Numeric menu selection
      await this.handleInput({
        type: 'menu_selection',
        value: input,
        context: { currentMenu: this.currentMenu }
      });
    } else {
      // Command execution
      await this.handleInput({
        type: 'command',
        value: input,
        context: { currentMenu: this.currentMenu }
      });
    }

    if (this.isInteractiveMode) {
      this.readlineInterface?.prompt();
    }
  }

  /**
   * Handle command input
   * @private
   */
  private async handleCommandInput(input: CLIInput): Promise<CLIInputResult> {
    try {
      const result = await this.executeCommand(input.value, []);
      return { handled: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { handled: false, errors: [errorMessage] };
    }
  }

  /**
   * Handle menu selection (placeholder - would need menu system integration)
   * @private
   */
  private async handleMenuSelection(input: CLIInput): Promise<CLIInputResult> {
    console.log(`Menu selection ${input.value} (integration with orchestrator menu system pending)`);
    return { handled: true, result: { menuSelection: input.value } };
  }

  /**
   * Handle keyboard shortcut
   * @private
   */
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

  /**
   * Handle navigation
   * @private
   */
  private async handleNavigation(input: CLIInput): Promise<CLIInputResult> {
    switch (input.value) {
      case 'back':
        if (this.navigationHistory.length === 0) {
          return { handled: false, errors: ['No previous menu in history'] };
        }
        const previousMenu = this.navigationHistory.pop()!;
        this.currentMenu = previousMenu;
        console.log(`Navigated back to: ${previousMenu}`);
        return { handled: true, navigationChange: { action: 'back', target: previousMenu } };
      
      case 'home':
        this.navigationHistory.push(this.currentMenu);
        this.currentMenu = 'main';
        console.log('Navigated to main menu');
        return { handled: true, navigationChange: { action: 'menu', target: 'main' } };
      
      default:
        return { handled: false, errors: ['Unknown navigation command'] };
    }
  }

  /**
   * Display command result in CLI format
   * @private
   */
  private displayCommandResult(result: CommandResult): void {
    if (result.success) {
      console.log(`✅ ${result.message || 'Command executed successfully'}`);
      
      if (result.metadata?.backendId) {
        console.log(`   Backend: ${result.metadata.backendId}`);
      }
      
      if (result.executionTime) {
        console.log(`   Time: ${result.executionTime}ms`);
      }
    } else {
      console.log(`❌ ${result.error || 'Command execution failed'}`);
    }
  }

  /**
   * Get optimal progress bar width based on terminal size
   * @private
   */
  private getOptimalProgressBarWidth(): number {
    const layout = this.terminalUI.getLayout();
    const dimensions = layout.getDimensions();
    const breakpoint = layout.getCurrentBreakpoint();
    
    switch (breakpoint) {
      case 'small':
        return Math.min(30, dimensions.width - 20);
      case 'medium':
        return Math.min(50, dimensions.width - 30);
      case 'large':
        return Math.min(70, dimensions.width - 40);
      default:
        return 40;
    }
  }

  /**
   * Display backend status information using consistency framework
   * @private
   */
  private displayBackendStatus(backendConnections: any): void {
    // Convert backend connections to ServiceInfo format for consistency engine
    const services: ServiceInfo[] = Object.entries(backendConnections.backends).map(([serviceId, status]) => {
      const statusTyped = status as any;
      return {
        id: serviceId,
        name: serviceId,
        connected: statusTyped.connected || false,
        health: statusTyped.health || 'unknown',
        responseTime: statusTyped.responseTime,
        capabilities: statusTyped.capabilities || [],
        lastCheck: statusTyped.lastCheck || Date.now(),
        version: statusTyped.version,
        metadata: statusTyped
      } as ServiceInfo;
    });

    // Use consistency engine for backend status display
    const displayData: BackendStatusDisplayData = {
      services,
      context: 'status-display',
      showHealthDetails: true,
      showResponseTimes: true,
      showCapabilities: true
    };

    try {
      // Apply consistency framework
      const consistencyResult = this.consistencyEngine.formatBackendStatusDisplay(displayData);
      
      // Set theme for skin compatibility
      const theme = this.terminalUI.getTheme();
      if (theme) {
        this.consistencyEngine.setTheme(theme);
      }
      
      // Display the consistently formatted content
      console.log(consistencyResult.formattedContent);
      
      // Display additional statistics with consistent formatting
      if (consistencyResult.serviceMetadata) {
        const { connectedCount, totalCount, healthyCount } = consistencyResult.serviceMetadata;
        const statusText = healthyCount > 0 ? 'Operational' : 'Discovery Mode';
        
        // Use theme functions if available
        if (theme && typeof theme.info === 'function' && typeof theme.success === 'function' && typeof theme.warning === 'function') {
          const statusDisplay = healthyCount > 0 ? theme.success(statusText) : theme.warning(statusText);
          console.log(theme.info(`Connected: ${connectedCount}/${totalCount} | Healthy: ${healthyCount}/${connectedCount} | Status: ${statusDisplay}`));
        } else {
          console.log(`Connected: ${connectedCount}/${totalCount} | Healthy: ${healthyCount}/${connectedCount} | Status: ${statusText}`);
        }
      }
      
      // Display recommendations if any
      if (consistencyResult.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        consistencyResult.recommendations.forEach(rec => {
          console.log(`   ${rec}`);
        });
      }
      
      console.log();
      
    } catch (error) {
      console.warn('CLIInterfaceAdapter: Consistency engine failed, using fallback display');
      console.error('Error details:', error);
      
      // Fallback to basic display
      this.displayBackendStatusFallback(backendConnections);
    }
  }

  /**
   * Fallback backend status display when consistency engine fails
   * @private
   */
  private displayBackendStatusFallback(backendConnections: any): void {
    console.log('\n🌐 Backend Service Status (Fallback Display):');
    console.log('━'.repeat(60));
    
    Object.entries(backendConnections.backends).forEach(([serviceId, status]) => {
      const statusTyped = status as any;
      const icon = statusTyped.connected ? '🟢' : '🔴';
      const serviceColumn = this.formatColumn(serviceId, 20);
      const connectionState = this.formatColumn(statusTyped.connected ? 'Connected' : 'Disconnected', 12);
      const health = statusTyped.health || 'Unknown';
      console.log(`${icon} ${serviceColumn} ${connectionState} | ${health}`);
    });
    
    console.log('━'.repeat(60));
    console.log();
  }

  /**
   * Display keyboard shortcuts
   * @private
   */
  private displayKeyboardShortcuts(): void {
    if (this.keyboardShortcuts.size === 0) return;

    console.log('\n⌨️  Keyboard Shortcuts:');
    this.keyboardShortcuts.forEach((command, key) => {
      console.log(`  ${key} - ${command}`);
    });
    console.log();
  }

  /**
   * Display help information
   * @private
   */
  private displayHelp(): void {
    console.log('\n📚 Templum CLI Help (Abstraction Layer):');
    console.log('Commands:');
    console.log('  help     - Show this help message');
    console.log('  back     - Go to previous menu');
    console.log('  home     - Go to main menu');
    console.log('  refresh  - Refresh current view');
    console.log('  status   - Show backend service status');
    console.log('  load <id>- Load backend skin (e.g., load pcl, load minimal-example)');
    console.log('  quit     - Exit application');
    console.log('\nNavigation:');
    console.log('  1-9      - Select menu item by number');
    console.log('  command  - Execute any backend command');
    
    if (this.keyboardShortcuts.size > 0) {
      console.log('\nShortcuts:');
      this.keyboardShortcuts.forEach((command, key) => {
        console.log(`  ${key}       - ${command}`);
      });
    }
    
    console.log('\nBackend Integration:');
    if (this.orchestrator?.isInitialized()) {
      console.log('  ✅ Real backend integration active via orchestrator abstraction');
    } else {
      console.log('  ⚠️  Orchestrator not initialized');
    }
    console.log();
  }

  /**
   * Convert HTML output to CLI format
   * @private
   */
  private convertHTMLToCLI(htmlOutput: string, skinDefinition: UniversalSkinDefinition): string {
    // Basic HTML to CLI conversion
    // Remove HTML tags and format for CLI display
    let cliOutput = htmlOutput
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Convert non-breaking spaces
      .replace(/&lt;/g, '<') // Convert HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    
    // Add CLI-specific formatting
    const skinName = skinDefinition.metadata.name;
    const skinId = skinDefinition.metadata.id;
    
    return `
🌟 ${skinName} (${skinId})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${cliOutput}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated via CLI Interface Adapter (Abstraction Layer)
    `;
  }

  /**
   * Generate fallback CLI output when skin engine doesn't provide CLI generation
   * @private
   */
  private generateFallbackCLIOutput(renderResult: any, skinDefinition: UniversalSkinDefinition): string {
    const skinId = skinDefinition.metadata.id;
    const skinName = skinDefinition.metadata.name;
    const timestamp = Date.now();
    
    return `
🌟 Templum CLI Interface (Abstraction Layer)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Skin: ${skinName} (${skinId})
Loaded via CLI Interface Adapter with Orchestrator Abstraction

${renderResult ? JSON.stringify(renderResult, null, 2) : 'No render result available'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Timestamp: ${new Date(timestamp).toISOString()}
    `;
  }

  /**
   * Get fallback CLI output for initial content
   * @private
   */
  private getFallbackCLIOutput(backendConnections: any): string {
    const connectedCount = Object.values(backendConnections.backends).filter((b: any) => b.connected).length;
    const totalCount = Object.keys(backendConnections.backends).length;
    const healthyCount = Object.values(backendConnections.backends).filter((b: any) => b.health === 'healthy').length;
    
    return `
🌟 Templum Universal Interface - CLI Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ CLI Interface Adapter Active (Real Backend Integration)

Backend Status: Connected ${connectedCount}/${totalCount} | Healthy ${healthyCount}/${connectedCount}
System Status: ${healthyCount > 0 ? '🟢 Operational' : '🟡 Discovery Mode'}

${healthyCount === 0 ? 'Waiting for backend services to become available...' : 'Ready for command execution with real backend integration.'}

Type 'help' for available commands or 'status' for detailed backend information.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
  }

  /**
   * Get error CLI output for display
   * @private
   */
  private getErrorCLIOutput(error: string): string {
    return `
❌ CLI Interface Adapter - Real Backend Integration Error
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Error: ${error}
Timestamp: ${new Date().toISOString()}

🔧 Troubleshooting Real Backend Integration:
- Ensure Haruspex, PCL, or Litany services are running
- Check backend service accessibility on configured ports
- Verify backend endpoint configuration in Templum config
- Backend service discovery may be in progress
- System will use orchestrator fallback for functionality

Using abstraction layer with real backend integration.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
  }

  /**
   * Load a specific backend's skin definition manually
   * @private
   */
  private async loadSpecificBackendSkin(backendId: string): Promise<void> {
    if (!backendId) {
      console.log('❌ Please specify a backend ID (e.g., load pcl, load minimal-example)');
      return;
    }

    try {
      console.log(`🔄 Loading skin from backend: ${backendId}`);
      
      // Attempt to load the backend skin via orchestrator
      const skinDefinition = await this.orchestrator.loadBackendSkin(backendId);
      
      if (skinDefinition) {
        console.log(`✅ Successfully loaded skin: ${skinDefinition.name || backendId}`);
        console.log(`   Version: ${skinDefinition.version}`);
        console.log(`   ID: ${skinDefinition.id}`);
        
        // Refresh the CLI content to show the new skin
        await this.loadInitialContent();
        console.log(`📋 Interface updated with ${skinDefinition.name || backendId} skin definition`);
        
      } else {
        console.log(`❌ Could not load skin from backend: ${backendId}`);
        console.log('💡 Check if backend is running and accessible');
        
        // Show available backends
        await this.displayAvailableBackends();
      }
      
    } catch (error) {
      console.error(`❌ Failed to load skin from ${backendId}:`, error instanceof Error ? error.message : 'Unknown error');
      console.log('💡 Use "status" command to check backend connectivity');
    }
  }

  /**
   * Display available backends for user reference  
   * @private
   */
  private async displayAvailableBackends(): Promise<void> {
    try {
      const systemStatus = this.orchestrator.getSystemStatus();
      const backends = systemStatus.coreEngine?.backendConnections?.backends || {};
      
      if (Object.keys(backends).length === 0) {
        console.log('📡 No backends currently connected');
        return;
      }
      
      console.log('\n📡 Available backends:');
      for (const [serviceId, status] of Object.entries(backends)) {
        const statusIcon = status.connected 
          ? (status.health === 'healthy' ? '🟢' : '🟡') 
          : '🔴';
        console.log(`  ${statusIcon} ${serviceId} - ${status.connected ? 'connected' : 'disconnected'}`);
      }
      console.log('\n💡 Try: load <backend-id>');
      
    } catch (_error) {
      console.log('⚠️ Failed to get backend status');
    }
  }
}

/**
 * CLI Adapter Configuration
 */
export interface CLIAdapterConfig {
  enableInteractiveMode: boolean;
  enableKeyboardShortcuts: boolean;
  enableColorOutput: boolean;
  enableProgressIndicators: boolean;
  clearScreenOnRender: boolean;
  maxHistorySize: number;
  inputTimeout?: number;
  terminalTheme: keyof typeof DefaultColorThemes;
  enableResponsiveLayout: boolean;
}

/**
 * Factory function for creating CLI interface adapter
 * 
 * This provides a clean creation pattern that doesn't require direct imports
 * of the concrete adapter class in other parts of the system.
 */
export function createCLIInterfaceAdapter(config?: Partial<CLIAdapterConfig>): IInterfaceAdapter {
  return new CLIInterfaceAdapter(config);
}

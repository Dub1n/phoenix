/**---
 * title: [CLI Interface Adapter - Abstraction Layer Implementation]
 * tags: [Interface, Adapter, CLI, Abstraction]
 * provides: [CLIInterfaceAdapter, Abstracted CLI Integration]
 * requires: [ITemplumOrchestrator, CLI Framework, Universal Types]
 * description: [Abstracted CLI interface adapter that depends on ITemplumOrchestrator interface, not concrete implementations]
 * ---*/

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
import chalk from 'chalk';
import { 
  InteractiveMenuRenderer, 
  MenuInteractionResult 
} from './interactive-menu-renderer';

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
  }

  /**
   * Initialize with orchestrator abstraction
   */
  async initialize(orchestrator: ITemplumOrchestrator): Promise<void> {
    this.orchestrator = orchestrator;
    
    // Register this adapter with the orchestrator
    await this.orchestrator.registerInterface('cli', this);
    
    // Initialize CLI components
    await this.initializeCLIComponents();
    
    console.log('CLIInterfaceAdapter: Initialized with orchestrator abstraction');
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
        // Navigate back in menu history
        if (this.navigationHistory.length > 0) {
          this.currentMenu = this.navigationHistory.pop() || 'main';
          await this.loadInitialContent();
        }
        return { success: true, message: 'Navigated back', command };
        
      } else if (cmd === 'home') {
        // Navigate to main menu
        this.currentMenu = 'main';
        this.navigationHistory = [];
        await this.loadInitialContent();
        return { success: true, message: 'Navigated to main menu', command };
        
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
                
                // Pause briefly to show result before returning to menu
                console.log(chalk.gray('\nPress Enter to continue...'));
                await this.waitForKeypress();
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
            console.log(chalk.gray('Press Enter to continue...'));
            await this.waitForKeypress();
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

      // Cleanup terminal UI components
      await this.terminalUI.cleanup();

      // Clean up resources
      this.keyboardShortcuts.clear();
      this.navigationHistory = [];
      this.removeAllListeners();
      
      console.log('CLIInterfaceAdapter: Disposed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('CLIInterfaceAdapter disposal error:', errorMessage);
    }
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
   * Display backend status information with responsive layout
   * @private
   */
  private displayBackendStatus(backendConnections: any): void {
    const theme = this.terminalUI.getTheme();
    const layout = this.terminalUI.getLayout();
    
    // Safety check: ensure theme has proper functions before using
    const isThemeValid = theme && 
      typeof theme.primary === 'function' &&
      typeof theme.info === 'function' &&
      typeof theme.success === 'function' &&
      typeof theme.warning === 'function';
    
    if (!isThemeValid) {
      console.log('\n🌐 Backend Service Status:');
    } else {
      console.log(theme.primary('\n🌐 Backend Service Status:'));
    }
    
    // Create table data for responsive display
    const tableData = Object.entries(backendConnections.backends).map(([serviceId, status]) => {
      const statusTyped = status as any;
      return {
        service: serviceId,
        status: statusTyped.connected ? 'Connected' : 'Disconnected',
        health: statusTyped.health || 'Unknown',
        response: statusTyped.responseTime ? `${statusTyped.responseTime}ms` : 'N/A',
        capabilities: statusTyped.capabilities?.slice(0, 2).join(', ') || 'None'
      };
    });
    
    const headers = ['service', 'status', 'health', 'response', 'capabilities'];
    
    // Use responsive table layout
    if (this.config.enableResponsiveLayout) {
      const table = layout.createTable(tableData, headers);
      console.log(table);
    } else {
      // Fallback to original table format
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Service      Status      Health    Response   Capabilities');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      tableData.forEach(row => {
        const statusIcon = row.status === 'Connected' ? '🟢' : '🔴';
        const statusText = `${statusIcon} ${row.status}`;
        console.log(`${row.service.padEnd(12)} ${statusText.padEnd(12)} ${row.health.padEnd(9)} ${row.response.padEnd(10)} ${row.capabilities}`);
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    const connectedCount = Object.values(backendConnections.backends).filter((b: any) => b.connected).length;
    const totalCount = Object.keys(backendConnections.backends).length;
    const healthyCount = Object.values(backendConnections.backends).filter((b: any) => b.health === 'healthy').length;
    
    // Use theme functions only if theme is valid, otherwise use plain text
    if (isThemeValid) {
      console.log(theme.info(`Connected: ${connectedCount}/${totalCount} | Healthy: ${healthyCount}/${connectedCount} | Status: ${healthyCount > 0 ? theme.success('Operational') : theme.warning('Discovery Mode')}`));
    } else {
      const statusText = healthyCount > 0 ? 'Operational' : 'Discovery Mode';
      console.log(`Connected: ${connectedCount}/${totalCount} | Healthy: ${healthyCount}/${connectedCount} | Status: ${statusText}`);
    }
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
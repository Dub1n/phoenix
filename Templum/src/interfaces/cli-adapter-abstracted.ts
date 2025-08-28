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
  ErrorSignalPayload, 
  MetricsSignalPayload,
  createTemplumError, 
  isTemplumError,
  InterfaceType,
  CommandContext,
  CommandResult,
  UniversalSkinDefinition,
  StateUpdate,
  InterfaceAdapterStatus
} from '../types/templum-types';
import { 
  ITemplumOrchestrator, 
  IInterfaceAdapter 
} from './templum-orchestrator-interface';

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
      ...config
    };
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
   * Execute command using orchestrator abstraction
   */
  async executeCommand(command: string, args: any[] = []): Promise<any> {
    if (!this.orchestrator.isInitialized()) {
      throw createTemplumError('Orchestrator not initialized', 'SERVICE_NOT_READY', 'configuration');
    }

    try {
      console.log(`CLIInterfaceAdapter: Executing command '${command}' via orchestrator abstraction...`);
      
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

      // Display results in CLI format
      this.displayCommandResult(result);
      
      console.log(`CLIInterfaceAdapter: Executed command '${command}' via orchestrator abstraction`);
      return result;
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      console.error(`Command execution failed: ${errorMessage}`);
      throw createTemplumError(`Command execution failed: ${errorMessage}`, 'COMMAND_EXECUTION_ERROR', 'runtime');
    }
  }

  /**
   * Start interactive CLI session
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

      // Setup readline interface
      await this.setupReadlineInterface();

      // Load and display initial content
      await this.loadInitialContent();

      this.emit('interactiveSessionStarted', { menu: initialMenu, timestamp: Date.now() });
      
      console.log('CLIInterfaceAdapter: Interactive session started with orchestrator integration');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createTemplumError(`Failed to start interactive session: ${errorMessage}`, 'SESSION_START_ERROR', 'runtime');
    }
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
      const backendConnections = systemStatus.coreEngine.backendConnections;
      
      // Display backend status
      this.displayBackendStatus(backendConnections);
      
      // Prioritize healthy backends for skin loading
      const healthyBackends = Object.entries(backendConnections.backends)
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
      this.displayBackendStatus(systemStatus.coreEngine.backendConnections);
    } else if (input === 'refresh') {
      await this.loadInitialContent();
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
   * Display backend status information
   * @private
   */
  private displayBackendStatus(backendConnections: any): void {
    console.log('\n🌐 Backend Service Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Service      Status      Health    Response   Capabilities');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const [serviceId, status] of Object.entries(backendConnections.backends)) {
      const statusTyped = status as any; // Type assertion for backend status
      const conn = statusTyped.connected ? '🟢 Connected ' : '🔴 Disconnected';
      const health = statusTyped.health || 'Unknown';
      const responseTime = statusTyped.responseTime ? `${statusTyped.responseTime}ms` : 'N/A';
      const capabilities = statusTyped.capabilities?.slice(0, 2).join(', ') || 'None';
      
      console.log(`${serviceId.padEnd(12)} ${conn.padEnd(12)} ${health.padEnd(9)} ${responseTime.padEnd(10)} ${capabilities}`);
    }
    
    const connectedCount = Object.values(backendConnections.backends).filter((b: any) => b.connected).length;
    const totalCount = Object.keys(backendConnections.backends).length;
    const healthyCount = Object.values(backendConnections.backends).filter((b: any) => b.health === 'healthy').length;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Connected: ${connectedCount}/${totalCount} | Healthy: ${healthyCount}/${connectedCount} | Status: ${healthyCount > 0 ? 'Operational' : 'Discovery Mode'}`);
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
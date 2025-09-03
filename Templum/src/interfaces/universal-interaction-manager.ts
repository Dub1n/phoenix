/**
 * Universal Interaction Manager
 * 
 * Extended from Phoenix Code Lite Interaction Manager for multi-interface input handling.
 * Maintains dual-mode PCL functionality while adding VSCode command palette integration,
 * cross-interface input validation, and session-aware keyboard shortcuts.
 * 
 * Dependencies: All previous systems (session, registries, adapters)
 * Performance Target: Cross-interface input validation with session awareness
 * 
 * Generated: 2025-08-21
 */

import { EventEmitter } from 'events';
import { createInterface, Interface } from 'readline';
import chalk from 'chalk';
import { UniversalCommandRegistry } from '../commands/universal-command-registry';
import { UniversalMenuRegistry } from '../menus/universal-menu-registry';
import { SessionContextFoundation, SessionContext } from '../session/session-context-foundation';
import { UniversalSkinRenderer } from '../rendering/universal-skin-renderer';

// Extended interfaces for multi-interface support
export interface UniversalInteractionConfig extends InteractionModeConfig {
  enabledInterfaces: InterfaceType[];
  crossInterfaceSync: boolean;
  sessionIntegration: boolean;
  inputValidation: InputValidationConfig;
}

export interface InteractionModeConfig {
  currentMode: 'menu' | 'command';
  allowModeSwitch: boolean;
  commandConfig: CommandConfig;
  menuConfig?: MenuConfig;
}

export interface CommandConfig {
  promptSymbol: string;
  enableAutoComplete?: boolean;
  commandHistory?: boolean;
  timeout?: number;
}

export interface MenuConfig {
  enableNumberedSelection: boolean;
  enableKeyboardShortcuts: boolean;
  enableFuzzySearch: boolean;
  maxVisibleItems?: number;
}

export interface InputValidationConfig {
  enableCrossInterfaceValidation: boolean;
  enableSessionValidation: boolean;
  enableSyntaxValidation: boolean;
  validationTimeout: number;
}

export interface UniversalInputResult extends InputResult {
  interfaceType: InterfaceType;
  sessionId?: string;
  crossInterfaceCapable?: boolean;
  validationResult?: InputValidationResult;
}

export interface InputResult {
  action: 'navigate' | 'execute' | 'switch_mode' | 'back' | 'quit';
  target?: string;
  newMode?: 'menu' | 'command';
  success: boolean;
  message?: string;
  data?: any;
}

export interface InputValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  correctedInput?: string;
}

export interface UniversalMenuOption extends MenuOption {
  interfaceSupport?: InterfaceType[];
  sessionRequired?: boolean;
  permissions?: string[];
}

export interface MenuOption {
  label: string;
  value: string;
  description?: string;
  enabled?: boolean;
  hotkey?: string;
}

export interface UniversalCommandInfo extends CommandInfo {
  interfaceSupport?: InterfaceType[];
  backendId?: string;
  sessionRequired?: boolean;
  validation?: CommandValidation;
}

export interface CommandInfo {
  name: string;
  description?: string;
  aliases?: string[];
  category?: string;
}

export interface CommandValidation {
  parameterPattern?: RegExp;
  requiredParameters?: string[];
  contextRequired?: string[];
}

export type KeyboardShortcutMap = Map<string, {
  command: string;
  description: string;
  interfaceSupport: InterfaceType[];
  sessionRequired?: boolean;
}>;

export type InterfaceType = 'vscode' | 'cli' | 'command';

/**
 * Universal Interaction Manager - Multi-Interface Input Handling
 * Extends PCL Interaction Manager for cross-interface input validation and session awareness
 */
export class UniversalInteractionManager extends EventEmitter {
  private config: UniversalInteractionConfig;
  private commandRegistry: UniversalCommandRegistry;
  private menuRegistry: UniversalMenuRegistry;
  private sessionContext: SessionContextFoundation;
  private skinRenderer: UniversalSkinRenderer;
  private readline: Interface | null = null;
  private keyboardShortcuts: KeyboardShortcutMap = new Map();
  private inputHistory: Map<InterfaceType, string[]> = new Map();
  private activeInterface: InterfaceType = 'cli';
  private maxHistorySize = 50;

  constructor(
    commandRegistry: UniversalCommandRegistry,
    menuRegistry: UniversalMenuRegistry,
    sessionContext: SessionContextFoundation,
    skinRenderer: UniversalSkinRenderer,
    config?: Partial<UniversalInteractionConfig>
  ) {
    super();
    this.commandRegistry = commandRegistry;
    this.menuRegistry = menuRegistry;
    this.sessionContext = sessionContext;
    this.skinRenderer = skinRenderer;
    
    this.config = {
      currentMode: 'menu',
      allowModeSwitch: true,
      enabledInterfaces: ['vscode', 'cli', 'command'],
      crossInterfaceSync: true,
      sessionIntegration: true,
      commandConfig: {
        promptSymbol: '> ',
        enableAutoComplete: true,
        commandHistory: true,
        timeout: 30000
      },
      menuConfig: {
        enableNumberedSelection: true,
        enableKeyboardShortcuts: true,
        enableFuzzySearch: true,
        maxVisibleItems: 10
      },
      inputValidation: {
        enableCrossInterfaceValidation: true,
        enableSessionValidation: true,
        enableSyntaxValidation: true,
        validationTimeout: 5000
      },
      ...config
    };

    this.setupInitialComponents();
  }

  /**
   * Display universal menu mode with multi-interface support
   * Extends PCL displayMenuMode with cross-interface rendering
   */
  async displayUniversalMenuMode(
    options: UniversalMenuOption[],
    title: string,
    interfaceType: InterfaceType = this.activeInterface
  ): Promise<UniversalInputResult> {
    // Filter options based on interface support and session requirements
    const filteredOptions = await this.filterOptionsForInterface(options, interfaceType);
    
    // Get current session context
    const session = this.sessionContext.getActiveSession();
    
    try {
      // Render menu using Universal Skin Renderer
      const renderResult = await this.skinRenderer.renderMenu(
        'templum-universal',
        'main',
        interfaceType,
        {
          interfaceType,
          sessionId: session?.sessionId,
          level: 'main'
        }
      );

      if (!renderResult.success) {
        throw new Error(`Menu rendering failed: ${renderResult.errors?.join(', ')}`);
      }

      // Handle input based on interface type
      switch (interfaceType) {
        case 'cli':
          return await this.handleCLIMenuInput(filteredOptions, session);
        case 'vscode':
          return await this.handleVSCodeMenuInput(filteredOptions, session);
        case 'command':
          return await this.handleCommandMenuInput(filteredOptions, session);
        default:
          throw new Error(`Unsupported interface type: ${interfaceType}`);
      }

    } catch (error) {
      return {
        action: 'execute',
        success: false,
        message: error instanceof Error ? error.message : 'Menu display failed',
        interfaceType
      };
    }
  }

  /**
   * Display universal command mode with multi-backend support
   * Extends PCL displayCommandMode with backend routing
   */
  async displayUniversalCommandMode(
    commands: UniversalCommandInfo[],
    title: string,
    interfaceType: InterfaceType = this.activeInterface
  ): Promise<UniversalInputResult> {
    // Filter commands based on interface support and backend availability
    const filteredCommands = await this.filterCommandsForInterface(commands, interfaceType);
    
    const session = this.sessionContext.getActiveSession();
    
    try {
      // Display command interface based on type
      switch (interfaceType) {
        case 'cli':
          return await this.handleCLICommandInput(filteredCommands, session);
        case 'vscode':
          return await this.handleVSCodeCommandInput(filteredCommands, session);
        case 'command':
          return await this.handleDirectCommandInput(filteredCommands, session);
        default:
          throw new Error(`Unsupported interface type: ${interfaceType}`);
      }

    } catch (error) {
      return {
        action: 'execute',
        success: false,
        message: error instanceof Error ? error.message : 'Command mode failed',
        interfaceType
      };
    }
  }

  /**
   * Handle cross-interface input validation with session awareness
   * New functionality for multi-interface architecture
   */
  async validateUniversalInput(
    input: string,
    interfaceType: InterfaceType,
    context?: any
  ): Promise<InputValidationResult> {
    const validationResult: InputValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Session validation if enabled
      if (this.config.inputValidation.enableSessionValidation) {
        const sessionValidation = await this.validateSessionContext(input, context);
        if (!sessionValidation.isValid) {
          validationResult.isValid = false;
          validationResult.errors.push(...sessionValidation.errors);
        }
      }

      // Cross-interface validation if enabled
      if (this.config.inputValidation.enableCrossInterfaceValidation) {
        const crossValidation = await this.validateCrossInterface(input, interfaceType);
        if (!crossValidation.isValid) {
          validationResult.warnings.push(...crossValidation.warnings);
        }
      }

      // Syntax validation if enabled
      if (this.config.inputValidation.enableSyntaxValidation) {
        const syntaxValidation = await this.validateSyntax(input, interfaceType);
        if (!syntaxValidation.isValid) {
          validationResult.isValid = false;
          validationResult.errors.push(...syntaxValidation.errors);
          if (syntaxValidation.correctedInput) {
            validationResult.correctedInput = syntaxValidation.correctedInput;
          }
        }
      }

      // Generate suggestions if validation failed
      if (!validationResult.isValid || validationResult.warnings.length > 0) {
        validationResult.suggestions = await this.generateInputSuggestions(input, interfaceType);
      }

      return validationResult;

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Switch current interface type
   * New functionality for multi-interface architecture
   */
  async switchInterface(newInterface: InterfaceType): Promise<boolean> {
    if (!this.config.enabledInterfaces.includes(newInterface)) {
      console.warn(`Interface ${newInterface} not enabled`);
      return false;
    }

    const oldInterface = this.activeInterface;
    this.activeInterface = newInterface;

    // Update session context if integration is enabled
    if (this.config.sessionIntegration) {
      const session = this.sessionContext.getActiveSession();
      if (session) {
        this.sessionContext.switchInterface(session.sessionId, newInterface);
      }
    }

    this.emit('interfaceSwitched', oldInterface, newInterface);
    return true;
  }

  /**
   * Add cross-interface keyboard shortcut
   * Extended from PCL keyboard shortcuts with interface support
   */
  addUniversalKeyboardShortcut(
    key: string,
    command: string,
    description: string,
    interfaceSupport: InterfaceType[] = ['cli'],
    sessionRequired = false
  ): void {
    this.keyboardShortcuts.set(key, {
      command,
      description,
      interfaceSupport,
      sessionRequired
    });

    this.emit('keyboardShortcutAdded', key, command, interfaceSupport);
  }

  /**
   * Get available keyboard shortcuts for current interface
   */
  getKeyboardShortcutsForInterface(interfaceType?: InterfaceType): Record<string, any> {
    const targetInterface = interfaceType || this.activeInterface;
    const shortcuts: Record<string, any> = {};

    for (const [key, shortcut] of this.keyboardShortcuts) {
      if (shortcut.interfaceSupport.includes(targetInterface)) {
        // Check session requirements
        if (shortcut.sessionRequired && !this.sessionContext.getActiveSession()) {
          continue;
        }
        shortcuts[key] = shortcut;
      }
    }

    return shortcuts;
  }

  /**
   * Execute command through Universal Command Registry
   * Enhanced from PCL with backend routing and session context
   */
  async executeUniversalCommand(
    commandId: string,
    parameters: Record<string, any> = {},
    interfaceType: InterfaceType = this.activeInterface
  ): Promise<UniversalInputResult> {
    try {
      // Validate input first
      const validation = await this.validateUniversalInput(commandId, interfaceType, { parameters });
      
      if (!validation.isValid) {
        return {
          action: 'execute',
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`,
          interfaceType,
          validationResult: validation
        };
      }

      // Execute through Universal Command Registry
      const result = await this.commandRegistry.executeCommand(
        commandId,
        parameters,
        { interfaceType }
      );

      // Add to input history
      this.addToInputHistory(interfaceType, commandId);

      return {
        action: 'execute',
        success: result.success,
        message: result.message,
        data: result.data,
        interfaceType,
        sessionId: result.sessionId,
        crossInterfaceCapable: this.config.crossInterfaceSync,
        validationResult: validation
      };

    } catch (error) {
      return {
        action: 'execute',
        success: false,
        message: error instanceof Error ? error.message : 'Command execution failed',
        interfaceType
      };
    }
  }

  /**
   * Get input history for interface
   */
  getInputHistory(interfaceType?: InterfaceType): string[] {
    const targetInterface = interfaceType || this.activeInterface;
    return this.inputHistory.get(targetInterface) || [];
  }

  /**
   * Clear input history for interface
   */
  clearInputHistory(interfaceType?: InterfaceType): void {
    if (interfaceType) {
      this.inputHistory.delete(interfaceType);
    } else {
      this.inputHistory.clear();
    }
  }

  // Private implementation methods
  private setupInitialComponents(): void {
    // Initialize input history for enabled interfaces
    for (const interfaceType of this.config.enabledInterfaces) {
      this.inputHistory.set(interfaceType, []);
    }

    // Setup default keyboard shortcuts
    this.setupDefaultKeyboardShortcuts();

    // Setup readline if CLI is enabled
    if (this.config.enabledInterfaces.includes('cli')) {
      this.setupReadline();
    }

    // Setup event handlers
    this.setupEventHandlers();
  }

  private setupDefaultKeyboardShortcuts(): void {
    const shortcuts = [
      { key: 'h', command: 'help', description: 'Show help', interfaces: ['cli'] },
      { key: 'q', command: 'quit', description: 'Quit application', interfaces: ['cli'] },
      { key: 'b', command: 'back', description: 'Go back', interfaces: ['cli', 'vscode'] },
      { key: 'r', command: 'refresh', description: 'Refresh current view', interfaces: ['cli', 'vscode'] },
      { key: 's', command: 'status', description: 'Show system status', interfaces: ['cli', 'command'] },
      { key: 'c', command: 'command', description: 'Switch to command mode', interfaces: ['cli'] },
      { key: 'm', command: 'menu', description: 'Switch to menu mode', interfaces: ['cli'] }
    ];

    for (const shortcut of shortcuts) {
      this.addUniversalKeyboardShortcut(
        shortcut.key,
        shortcut.command,
        shortcut.description,
        shortcut.interfaces as InterfaceType[]
      );
    }
  }

  private setupReadline(): void {
    this.readline = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.config.commandConfig.promptSymbol
    });

    this.clearInputBuffer();
  }

  private clearInputBuffer(): void {
    if (process.stdin.readable) {
      let data;
      while ((data = process.stdin.read()) !== null) {
        // Clear any buffered input
      }
    }

    if (typeof process.stdin.setRawMode === 'function') {
      process.stdin.setRawMode(false);
    }
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
  }

  private setupEventHandlers(): void {
    // Listen for session changes
    this.sessionContext.on('activeSessionChanged', (sessionId) => {
      this.emit('sessionChanged', sessionId);
    });

    // Listen for command registry changes
    this.commandRegistry.on('backendsLoaded', (backendIds) => {
      this.emit('backendsAvailable', backendIds);
    });

    // Listen for menu registry changes
    this.menuRegistry.on('menusLoaded', (sources) => {
      this.emit('menusAvailable', sources);
    });
  }

  // Interface-specific input handlers
  private async handleCLIMenuInput(
    options: UniversalMenuOption[],
    session: SessionContext | null
  ): Promise<UniversalInputResult> {
    const input = await this.getInput();
    
    // Handle special commands first
    const specialResult = this.handleSpecialCommands(input, 'cli');
    if (specialResult) return { ...specialResult, interfaceType: 'cli', sessionId: session?.sessionId };
    
    // Handle numbered selection
    const num = parseInt(input);
    if (!isNaN(num) && num >= 1 && num <= options.length) {
      const selectedOption = options[num - 1];
      if (selectedOption.enabled === false) {
        return {
          action: 'execute',
          success: false,
          message: `Option "${selectedOption.label}" is currently disabled`,
          interfaceType: 'cli'
        };
      }
      return {
        action: 'navigate',
        target: selectedOption.value,
        success: true,
        interfaceType: 'cli',
        sessionId: session?.sessionId
      };
    }
    
    // Handle text matching
    const matchedOption = this.findMatchingOption(input, options);
    if (matchedOption) {
      if (matchedOption.enabled === false) {
        return {
          action: 'execute',
          success: false,
          message: `Option "${matchedOption.label}" is currently disabled`,
          interfaceType: 'cli'
        };
      }
      return {
        action: 'navigate',
        target: matchedOption.value,
        success: true,
        interfaceType: 'cli',
        sessionId: session?.sessionId
      };
    }
    
    console.log(chalk.red(`Invalid option: ${input}`));
    return await this.handleCLIMenuInput(options, session);
  }

  private async handleVSCodeMenuInput(
    options: UniversalMenuOption[],
    session: SessionContext | null
  ): Promise<UniversalInputResult> {
    // VSCode interface would use command palette or TreeView
    // For now, simulate VSCode command palette interaction
    return {
      action: 'execute',
      success: true,
      message: 'VSCode interface not fully implemented yet',
      interfaceType: 'vscode',
      sessionId: session?.sessionId
    };
  }

  private async handleCommandMenuInput(
    options: UniversalMenuOption[],
    session: SessionContext | null
  ): Promise<UniversalInputResult> {
    // Command interface provides direct command execution
    return {
      action: 'execute',
      success: true,
      message: 'Command interface - use direct commands',
      interfaceType: 'command',
      sessionId: session?.sessionId
    };
  }

  private async handleCLICommandInput(
    commands: UniversalCommandInfo[],
    session: SessionContext | null
  ): Promise<UniversalInputResult> {
    process.stdout.write(chalk.gray(this.config.commandConfig.promptSymbol));
    const input = await this.getInput();
    
    return await this.executeUniversalCommand(input, {}, 'cli');
  }

  private async handleVSCodeCommandInput(
    commands: UniversalCommandInfo[],
    session: SessionContext | null
  ): Promise<UniversalInputResult> {
    // VSCode command palette integration would go here
    return {
      action: 'execute',
      success: true,
      message: 'VSCode command interface not fully implemented yet',
      interfaceType: 'vscode',
      sessionId: session?.sessionId
    };
  }

  private async handleDirectCommandInput(
    commands: UniversalCommandInfo[],
    session: SessionContext | null
  ): Promise<UniversalInputResult> {
    // Direct command execution
    return {
      action: 'execute',
      success: true,
      message: 'Direct command execution ready',
      interfaceType: 'command',
      sessionId: session?.sessionId
    };
  }

  // Validation methods
  private async validateSessionContext(input: string, context?: any): Promise<InputValidationResult> {
    const session = this.sessionContext.getActiveSession();
    
    if (!session) {
      return {
        isValid: false,
        errors: ['No active session - please create a session first'],
        warnings: [],
        suggestions: ['Use "session create" to start a new session']
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
  }

  private async validateCrossInterface(input: string, interfaceType: InterfaceType): Promise<InputValidationResult> {
    // Check if command is available on current interface
    if (input.includes('.')) {
      // Backend-prefixed command
      const [backendId] = input.split('.');
      const integration = this.commandRegistry.getBackendIntegrations();
      const backend = integration.find(b => b.id === backendId);
      
      if (!backend || !backend.isHealthy) {
        return {
          isValid: false,
          errors: [],
          warnings: [`Backend "${backendId}" may not be available`],
          suggestions: [`Check backend status with "status ${backendId}"`]
        };
      }
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
  }

  private async validateSyntax(input: string, interfaceType: InterfaceType): Promise<InputValidationResult> {
    // Basic syntax validation
    if (input.trim().length === 0) {
      return {
        isValid: false,
        errors: ['Empty input not allowed'],
        warnings: [],
        suggestions: ['Enter a command or menu option']
      };
    }

    // Check for common typos and suggest corrections
    const corrections = this.suggestInputCorrections(input);
    if (corrections.length > 0) {
      return {
        isValid: true,
        errors: [],
        warnings: ['Possible typo detected'],
        suggestions: corrections,
        correctedInput: corrections[0]
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
  }

  private async generateInputSuggestions(input: string, interfaceType: InterfaceType): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Get available commands for this interface
    const commands = this.commandRegistry.getHandlersByBackend('pcl')
      .map(handler => handler.id)
      .slice(0, 3);
    
    suggestions.push(...commands);

    // Add keyboard shortcuts
    const shortcuts = this.getKeyboardShortcutsForInterface(interfaceType);
    const shortcutCommands = Object.values(shortcuts)
      .map((s: any) => s.command)
      .slice(0, 2);
    
    suggestions.push(...shortcutCommands);

    return suggestions;
  }

  private suggestInputCorrections(input: string): string[] {
    // Common command corrections
    const corrections: Record<string, string> = {
      'hlep': 'help',
      'exti': 'exit',
      'quti': 'quit',
      'bakc': 'back',
      'staus': 'status'
    };

    const correction = corrections[input.toLowerCase()];
    return correction ? [correction] : [];
  }

  // Helper methods
  private async filterOptionsForInterface(
    options: UniversalMenuOption[],
    interfaceType: InterfaceType
  ): Promise<UniversalMenuOption[]> {
    return options.filter(option => {
      // Check interface support
      if (option.interfaceSupport && !option.interfaceSupport.includes(interfaceType)) {
        return false;
      }

      // Check session requirements
      if (option.sessionRequired && !this.sessionContext.getActiveSession()) {
        return false;
      }

      return true;
    });
  }

  private async filterCommandsForInterface(
    commands: UniversalCommandInfo[],
    interfaceType: InterfaceType
  ): Promise<UniversalCommandInfo[]> {
    return commands.filter(command => {
      // Check interface support
      if (command.interfaceSupport && !command.interfaceSupport.includes(interfaceType)) {
        return false;
      }

      // Check session requirements
      if (command.sessionRequired && !this.sessionContext.getActiveSession()) {
        return false;
      }

      return true;
    });
  }

  private findMatchingOption(input: string, options: UniversalMenuOption[]): UniversalMenuOption | null {
    const query = input.toLowerCase();
    
    // Exact match on value
    let match = options.find(opt => opt.value.toLowerCase() === query);
    if (match) return match;
    
    // Exact match on label
    match = options.find(opt => opt.label.toLowerCase() === query);
    if (match) return match;
    
    // Partial match on label
    match = options.find(opt => opt.label.toLowerCase().includes(query));
    if (match) return match;
    
    // Partial match on value
    match = options.find(opt => opt.value.toLowerCase().includes(query));
    return match || null;
  }

  private handleSpecialCommands(input: string, interfaceType: InterfaceType): InputResult | null {
    const cmd = input.toLowerCase().trim();
    
    // Get shortcuts for current interface
    const shortcuts = this.getKeyboardShortcutsForInterface(interfaceType);
    
    if (shortcuts[cmd]) {
      const shortcut = shortcuts[cmd];
      switch (shortcut.command) {
        case 'command':
          if (this.config.currentMode === 'menu' && this.config.allowModeSwitch) {
            return { action: 'switch_mode', newMode: 'command', success: true };
          }
          break;
        case 'menu':
          if (this.config.currentMode === 'command' && this.config.allowModeSwitch) {
            return { action: 'switch_mode', newMode: 'menu', success: true };
          }
          break;
        case 'back':
          return { action: 'back', success: true };
        case 'help':
          return { action: 'execute', target: 'help', success: true };
        case 'quit':
          return { action: 'quit', success: true };
      }
    }
    
    return null;
  }

  private async getInput(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.readline) {
        this.setupReadline();
      }
      
      this.readline!.question('', (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private addToInputHistory(interfaceType: InterfaceType, input: string): void {
    let history = this.inputHistory.get(interfaceType) || [];
    
    // Remove duplicate if exists
    history = history.filter(item => item !== input);
    
    // Add to beginning
    history.unshift(input);
    
    // Trim to max size
    if (history.length > this.maxHistorySize) {
      history = history.slice(0, this.maxHistorySize);
    }
    
    this.inputHistory.set(interfaceType, history);
  }

  /**
   * Get current interface type
   */
  getCurrentInterface(): InterfaceType {
    return this.activeInterface;
  }

  /**
   * Get current interaction mode
   */
  getCurrentMode(): 'menu' | 'command' {
    return this.config.currentMode;
  }

  /**
   * Switch interaction mode
   */
  switchMode(): 'menu' | 'command' {
    this.config.currentMode = this.config.currentMode === 'menu' ? 'command' : 'menu';
    console.log(chalk.green(`\n═ Switched to ${this.config.currentMode.toUpperCase()} mode`));
    this.emit('modeChanged', this.config.currentMode);
    return this.config.currentMode;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<UniversalInteractionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.readline) {
      this.readline.close();
      this.readline = null;
    }
    
    this.keyboardShortcuts.clear();
    this.inputHistory.clear();
    this.removeAllListeners();
    
    this.emit('disposed');
  }
}

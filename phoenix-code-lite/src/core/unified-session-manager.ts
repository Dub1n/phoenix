/**
 * Unified Session Manager
 * Created: 2025-01-06-175700
 * 
 * Coordinates menu definitions, interaction modes, and command execution.
 * Provides seamless mode switching and unified session management.
 */

import chalk from 'chalk';
import { MenuRegistry } from './menu-registry';
import { UnifiedCommandRegistry } from './command-registry';
import { InteractiveRenderer } from '../interaction/interactive-renderer';
import { CommandRenderer } from '../interaction/command-renderer';
import { DebugRenderer } from '../interaction/debug-renderer';
import { 
  MenuDefinition, 
  MenuContext, 
  MenuAction,
  SessionContext
} from '../types/menu-definitions';
import { 
  InteractionRenderer, 
  InteractionResult, 
  InteractionMode 
} from '../types/interaction-abstraction';
import { 
  CommandRegistry,
  CommandContext, 
  CommandResult 
} from '../types/command-execution';

export class UnifiedSessionManager {
  private menuRegistry: MenuRegistry;
  private commandRegistry: CommandRegistry;
  private currentRenderer: InteractionRenderer;
  private sessionContext: SessionContext;
  private navigationHistory: string[] = [];
  private running: boolean = false;

  constructor(
    menuRegistry: MenuRegistry,
    commandRegistry: CommandRegistry,
    initialMode: InteractionMode
  ) {
    this.menuRegistry = menuRegistry;
    this.commandRegistry = commandRegistry;
    this.currentRenderer = this.createRenderer(initialMode);
    this.sessionContext = {
      level: 'main',
      projectInitialized: false,
      debugMode: false
    };
  }

  /**
   * Start the session manager
   */
  async start(): Promise<void> {
    this.running = true;
    
    try {
      console.clear();
      this.showWelcome();
      
      // Start with main menu
      await this.displayMenu('main');
    } catch (error) {
      console.error(chalk.red('Session error:'), error);
      throw error;
    }
  }

  /**
   * Stop the session manager
   */
  async stop(): Promise<void> {
    this.running = false;
    
    if (this.currentRenderer) {
      await this.currentRenderer.dispose();
    }
    
    console.log(chalk.blue('👋 Thanks for using Phoenix Code Lite!'));
  }

  /**
   * Display a menu and handle interaction loop
   */
  async displayMenu(menuId: string): Promise<void> {
    if (!this.running) return;
    
    try {
      const menuDefinition = this.menuRegistry.getMenu(menuId);
      const menuContext = this.createMenuContext(menuDefinition);
      
      // Update session context
      this.sessionContext.level = menuId;
      
      // For interactive mode, we don't need the old menu rendering
      // The interactive renderer will handle everything
      if (this.currentRenderer.mode.name === 'interactive') {
        // Just show a simple header for interactive mode
        console.log(chalk.blue.bold(`🔥 ${menuDefinition.title}`));
        if (menuDefinition.description) {
          console.log(chalk.gray(menuDefinition.description));
        }
        console.log(); // Empty line for spacing
      } else {
        // Render the menu for other modes (debug, command)
        await this.currentRenderer.renderMenu(menuDefinition, menuContext);
      }
      
      // Input handling loop
      while (this.running) {
        try {
          const result = await this.currentRenderer.handleInput(menuDefinition, menuContext);
          
          if (result.success) {
            const shouldContinue = await this.executeAction(result.action, menuContext, result);
            if (!shouldContinue) {
              break;
            }
          } else {
            if (result.message) {
              console.log(chalk.red(result.message));
            }
            // Continue the input loop for invalid inputs
          }
        } catch (error) {
          console.error(chalk.red('Input handling error:'), error);
          // Continue the loop even on errors
        }
      }
    } catch (error) {
      console.error(chalk.red(`Failed to display menu ${menuId}:`), error);
      // Try to recover by showing main menu
      if (menuId !== 'main') {
        await this.displayMenu('main');
      }
    }
  }

  /**
   * Execute a menu action
   */
  async executeAction(action: MenuAction, context: MenuContext, result?: InteractionResult): Promise<boolean> {
    try {
      switch (action.type) {
        case 'navigate':
          if (action.target) {
            await this.navigateToMenu(action.target, context);
            return false; // Exit current menu loop
          }
          break;
          
        case 'execute':
          if (action.handler) {
            const commandResult = await this.executeCommand(action.handler, action.data, context);
            return this.handleCommandResult(commandResult);
          }
          break;
          
        case 'back':
          await this.navigateBack(context);
          return false; // Exit current menu loop
          
        case 'exit':
          await this.confirmExit();
          return false; // Exit current menu loop
      }
    } catch (error) {
      console.error(chalk.red('Action execution error:'), error);
      await this.waitForEnter();
    }
    
    return true; // Continue current menu loop
  }

  /**
   * Switch between interaction modes
   */
  async switchInteractionMode(newMode: InteractionMode): Promise<void> {
    console.log(chalk.green(`\n═ Switching to ${newMode.displayName} mode`));
    
    // Dispose current renderer
    await this.currentRenderer.dispose();
    
    // Create new renderer
    this.currentRenderer = this.createRenderer(newMode);
    
    // Re-render current menu in new mode
    await this.displayCurrentMenu();
  }

  /**
   * Get current session context
   */
  getSessionContext(): SessionContext {
    return { ...this.sessionContext };
  }

  /**
   * Update session context
   */
  updateSessionContext(updates: Partial<SessionContext>): void {
    this.sessionContext = { ...this.sessionContext, ...updates };
  }

  /**
   * Create renderer based on mode
   */
  private createRenderer(mode: InteractionMode): InteractionRenderer {
    switch (mode.name) {
      case 'interactive':
        return new InteractiveRenderer();
      case 'command':
        return new CommandRenderer();
      case 'debug':
        return new DebugRenderer();
      default:
        throw new Error(`Unsupported interaction mode: ${mode.name}`);
    }
  }

  /**
   * Create menu context for rendering
   */
  private createMenuContext(menuDefinition: MenuDefinition): MenuContext {
    return {
      level: menuDefinition.id,
      sessionContext: this.sessionContext,
      parameters: {}
    };
  }

  /**
   * Navigate to a specific menu
   */
  private async navigateToMenu(target: string, context: MenuContext): Promise<void> {
    // Add current menu to navigation history
    this.navigationHistory.push(context.level);
    
    console.clear();
    this.showHeader();
    
    // Display the target menu
    await this.displayMenu(target);
  }

  /**
   * Navigate back to previous menu
   */
  private async navigateBack(context: MenuContext): Promise<void> {
    const previousMenu = this.navigationHistory.pop() || 'main';
    
    console.clear();
    this.showHeader();
    
    await this.displayMenu(previousMenu);
  }

  /**
   * Execute a command handler
   */
  private async executeCommand(handlerId: string, data: any, menuContext: MenuContext): Promise<CommandResult> {
    // Check if this is a system command first
    if (handlerId.startsWith('system:')) {
      return await this.handleSystemCommand(handlerId, data);
    }
    
    const commandContext: CommandContext = {
      commandId: handlerId,
      parameters: data || {},
      menuContext,
      sessionContext: this.sessionContext,
      interactionMode: this.currentRenderer.mode
    };
    
    try {
      return await this.commandRegistry.execute(handlerId, commandContext);
    } catch (error) {
      console.error(chalk.red(`Command execution failed: ${handlerId}`), error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Command execution failed'
      };
    }
  }

  /**
   * Handle command execution result
   */
  private handleCommandResult(result: CommandResult): boolean {
    if (result.message) {
      const color = result.success ? 'green' : 'red';
      console.log(chalk[color](result.message));
    }
    
    if (result.shouldExit) {
      this.running = false;
      return false;
    }
    
    if (result.shouldNavigate && result.navigationTarget) {
      this.navigateToMenu(result.navigationTarget, this.createMenuContext({
        id: this.sessionContext.level,
        title: 'Current',
        sections: []
      }));
      return false;
    }
    
    return true; // Continue current menu
  }

  /**
   * Display current menu (for mode switching)
   */
  private async displayCurrentMenu(): Promise<void> {
    const currentMenuId = this.sessionContext.level || 'main';
    await this.displayMenu(currentMenuId);
  }

  /**
   * Show welcome screen
   */
  private showWelcome(): void {
    console.log(chalk.red.bold('🔥 Phoenix Code Lite • Unified CLI'));
    console.log(chalk.gray('TDD Workflow Orchestrator with Decoupled Architecture'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log();
  }

  /**
   * Show header
   */
  private showHeader(): void {
    const modeName = this.currentRenderer.mode.displayName;
    console.log(chalk.red.bold('🔥 Phoenix Code Lite'));
    console.log(chalk.gray(`Mode: ${modeName} • Level: ${this.sessionContext.level}`));
    console.log(chalk.gray('═'.repeat(60)));
    console.log();
  }

  /**
   * Confirm exit
   */
  private async confirmExit(): Promise<void> {
    // For now, just exit immediately
    // Can be enhanced with confirmation dialog
    this.running = false;
  }

  /**
   * Wait for user to press enter
   */
  private async waitForEnter(): Promise<void> {
    return new Promise((resolve) => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question(chalk.gray('Press Enter to continue...'), () => {
        readline.close();
        resolve();
      });
    });
  }

  /**
   * Handle system commands
   */
  private async handleSystemCommand(command: string, data?: any): Promise<CommandResult> {
    switch (command) {
      case 'system:switch-mode':
        const targetMode = data?.mode === 'command' ? 
          this.createCommandMode() : this.createInteractiveMode();
        await this.switchInteractionMode(targetMode);
        return { success: true, message: `Switched to ${targetMode.displayName}` };
        
      case 'system:help':
        this.showHelp();
        return { success: true };
        
      case 'system:refresh':
        console.clear();
        this.showHeader();
        await this.displayCurrentMenu();
        return { success: true };
        
      default:
        return { success: false, message: `Unknown system command: ${command}` };
    }
  }

  /**
   * Create interactive mode configuration
   */
  private createInteractiveMode(): InteractionMode {
    return {
      name: 'interactive',
      displayName: 'Interactive Navigation',
      capabilities: {
        supportsArrowNavigation: true,
        supportsTextInput: true,
        supportsKeyboardShortcuts: true,
        supportsRealTimeValidation: false
      },
      configuration: {}
    };
  }

  /**
   * Create command mode configuration
   */
  private createCommandMode(): InteractionMode {
    return {
      name: 'command',
      displayName: 'Command-Line Interface',
      capabilities: {
        supportsArrowNavigation: false,
        supportsTextInput: true,
        supportsKeyboardShortcuts: true,
        supportsRealTimeValidation: true
      },
      configuration: {}
    };
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(chalk.blue.bold('\n📚 Phoenix Code Lite Help'));
    console.log(chalk.gray('═'.repeat(40)));
    
    console.log(chalk.yellow('\n🌐 Global Commands:'));
    console.log('  help     - Show this help');
    console.log('  back     - Go to previous menu');
    console.log('  home     - Go to main menu');
    console.log('  quit     - Exit application');
    
    const modeName = this.currentRenderer.mode.name;
    if (modeName === 'interactive') {
      console.log('  c        - Switch to command mode');
    } else {
      console.log('  m        - Switch to menu mode');
    }
    
    console.log(chalk.gray('\n' + '═'.repeat(40)));
  }
}

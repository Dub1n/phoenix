"use strict";
/**---
 * title: [Unified Session Manager - Core Service Module]
 * tags: [Core, Service, Session-Management, CLI-Integration]
 * provides: [UnifiedSessionManager Class, Renderer Switching, Menu Display, Command Execution Loop]
 * requires: [MenuRegistry, UnifiedCommandRegistry, InteractiveRenderer, CommandRenderer, DebugRenderer, Interaction/Command Types]
 * description: [Coordinates unified interactive and command modes, handling menu navigation, action execution, and renderer lifecycle for the CLI.]
 * ---*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedSessionManager = void 0;
const chalk_1 = __importDefault(require("chalk"));
const interactive_renderer_1 = require("../interaction/interactive-renderer");
const command_renderer_1 = require("../interaction/command-renderer");
const debug_renderer_1 = require("../interaction/debug-renderer");
class UnifiedSessionManager {
    constructor(menuRegistry, commandRegistry, initialMode) {
        this.navigationHistory = [];
        this.running = false;
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
    async start() {
        this.running = true;
        try {
            console.clear();
            this.showWelcome();
            // Start with main menu
            await this.displayMenu('main');
        }
        catch (error) {
            console.error(chalk_1.default.red('Session error:'), error);
            throw error;
        }
    }
    /**
     * Stop the session manager
     */
    async stop() {
        this.running = false;
        if (this.currentRenderer) {
            await this.currentRenderer.dispose();
        }
        console.log(chalk_1.default.blue('👋 Thanks for using Phoenix Code Lite!'));
    }
    /**
     * Display a menu and handle interaction loop
     */
    async displayMenu(menuId) {
        if (!this.running)
            return;
        try {
            const menuDefinition = this.menuRegistry.getMenu(menuId);
            const menuContext = this.createMenuContext(menuDefinition);
            // Update session context
            this.sessionContext.level = menuId;
            // For interactive mode, we don't need the old menu rendering
            // The interactive renderer will handle everything
            if (this.currentRenderer.mode.name === 'interactive') {
                // Just show a simple header for interactive mode
                console.log(chalk_1.default.blue.bold(`* ${menuDefinition.title}`));
                if (menuDefinition.description) {
                    console.log(chalk_1.default.gray(menuDefinition.description));
                }
                console.log(); // Empty line for spacing
            }
            else {
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
                    }
                    else {
                        if (result.message) {
                            console.log(chalk_1.default.red(result.message));
                        }
                        // Continue the input loop for invalid inputs
                    }
                }
                catch (error) {
                    console.error(chalk_1.default.red('Input handling error:'), error);
                    // Continue the loop even on errors
                }
            }
        }
        catch (error) {
            console.error(chalk_1.default.red(`Failed to display menu ${menuId}:`), error);
            // Try to recover by showing main menu
            if (menuId !== 'main') {
                await this.displayMenu('main');
            }
        }
    }
    /**
     * Execute a menu action
     */
    async executeAction(action, context, result) {
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
        }
        catch (error) {
            console.error(chalk_1.default.red('Action execution error:'), error);
            await this.waitForEnter();
        }
        return true; // Continue current menu loop
    }
    /**
     * Switch between interaction modes
     */
    async switchInteractionMode(newMode) {
        console.log(chalk_1.default.green(`\n═ Switching to ${newMode.displayName} mode`));
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
    getSessionContext() {
        return { ...this.sessionContext };
    }
    /**
     * Update session context
     */
    updateSessionContext(updates) {
        this.sessionContext = { ...this.sessionContext, ...updates };
    }
    /**
     * Create renderer based on mode
     */
    createRenderer(mode) {
        switch (mode.name) {
            case 'interactive':
                return new interactive_renderer_1.InteractiveRenderer();
            case 'command':
                return new command_renderer_1.CommandRenderer();
            case 'debug':
                return new debug_renderer_1.DebugRenderer();
            default:
                throw new Error(`Unsupported interaction mode: ${mode.name}`);
        }
    }
    /**
     * Create menu context for rendering
     */
    createMenuContext(menuDefinition) {
        return {
            level: menuDefinition.id,
            sessionContext: this.sessionContext,
            parameters: {}
        };
    }
    /**
     * Navigate to a specific menu
     */
    async navigateToMenu(target, context) {
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
    async navigateBack(context) {
        const previousMenu = this.navigationHistory.pop() || 'main';
        console.clear();
        this.showHeader();
        await this.displayMenu(previousMenu);
    }
    /**
     * Execute a command handler
     */
    async executeCommand(handlerId, data, menuContext) {
        // Check if this is a system command first
        if (handlerId.startsWith('system:')) {
            return await this.handleSystemCommand(handlerId, data);
        }
        const commandContext = {
            commandId: handlerId,
            parameters: data || {},
            menuContext,
            sessionContext: this.sessionContext,
            interactionMode: this.currentRenderer.mode
        };
        try {
            return await this.commandRegistry.execute(handlerId, commandContext);
        }
        catch (error) {
            console.error(chalk_1.default.red(`Command execution failed: ${handlerId}`), error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Command execution failed'
            };
        }
    }
    /**
     * Handle command execution result
     */
    handleCommandResult(result) {
        if (result.message) {
            const color = result.success ? 'green' : 'red';
            console.log(chalk_1.default[color](result.message));
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
    async displayCurrentMenu() {
        const currentMenuId = this.sessionContext.level || 'main';
        await this.displayMenu(currentMenuId);
    }
    /**
     * Show welcome screen
     */
    showWelcome() {
        console.log(chalk_1.default.red.bold('* Phoenix Code Lite • Unified CLI'));
        console.log(chalk_1.default.gray('TDD Workflow Orchestrator with Decoupled Architecture'));
        console.log(chalk_1.default.gray('═'.repeat(60)));
        console.log();
    }
    /**
     * Show header
     */
    showHeader() {
        const modeName = this.currentRenderer.mode.displayName;
        console.log(chalk_1.default.red.bold('* Phoenix Code Lite'));
        console.log(chalk_1.default.gray(`Mode: ${modeName} • Level: ${this.sessionContext.level}`));
        console.log(chalk_1.default.gray('═'.repeat(60)));
        console.log();
    }
    /**
     * Confirm exit
     */
    async confirmExit() {
        // For now, just exit immediately
        // Can be enhanced with confirmation dialog
        this.running = false;
    }
    /**
     * Wait for user to press enter
     */
    async waitForEnter() {
        return new Promise((resolve) => {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            readline.question(chalk_1.default.gray('Press Enter to continue...'), () => {
                readline.close();
                resolve();
            });
        });
    }
    /**
     * Handle system commands
     */
    async handleSystemCommand(command, data) {
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
    createInteractiveMode() {
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
    createCommandMode() {
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
    showHelp() {
        console.log(chalk_1.default.blue.bold('\n📚 Phoenix Code Lite Help'));
        console.log(chalk_1.default.gray('═'.repeat(40)));
        console.log(chalk_1.default.yellow('\n🌐 Global Commands:'));
        console.log('  help     - Show this help');
        console.log('  back     - Go to previous menu');
        console.log('  home     - Go to main menu');
        console.log('  quit     - Exit application');
        const modeName = this.currentRenderer.mode.name;
        if (modeName === 'interactive') {
            console.log('  c        - Switch to command mode');
        }
        else {
            console.log('  m        - Switch to menu mode');
        }
        console.log(chalk_1.default.gray('\n' + '═'.repeat(40)));
    }
}
exports.UnifiedSessionManager = UnifiedSessionManager;
//# sourceMappingURL=unified-session-manager.js.map
/**
 * Unified Session Manager
 * Created: 2025-01-06-175700
 *
 * Coordinates menu definitions, interaction modes, and command execution.
 * Provides seamless mode switching and unified session management.
 */
import { MenuRegistry } from './menu-registry';
import { MenuContext, MenuAction, SessionContext } from '../types/menu-definitions';
import { InteractionResult, InteractionMode } from '../types/interaction-abstraction';
import { CommandRegistry } from '../types/command-execution';
export declare class UnifiedSessionManager {
    private menuRegistry;
    private commandRegistry;
    private currentRenderer;
    private sessionContext;
    private navigationHistory;
    private running;
    constructor(menuRegistry: MenuRegistry, commandRegistry: CommandRegistry, initialMode: InteractionMode);
    /**
     * Start the session manager
     */
    start(): Promise<void>;
    /**
     * Stop the session manager
     */
    stop(): Promise<void>;
    /**
     * Display a menu and handle interaction loop
     */
    displayMenu(menuId: string): Promise<void>;
    /**
     * Execute a menu action
     */
    executeAction(action: MenuAction, context: MenuContext, result?: InteractionResult): Promise<boolean>;
    /**
     * Switch between interaction modes
     */
    switchInteractionMode(newMode: InteractionMode): Promise<void>;
    /**
     * Get current session context
     */
    getSessionContext(): SessionContext;
    /**
     * Update session context
     */
    updateSessionContext(updates: Partial<SessionContext>): void;
    /**
     * Create renderer based on mode
     */
    private createRenderer;
    /**
     * Create menu context for rendering
     */
    private createMenuContext;
    /**
     * Navigate to a specific menu
     */
    private navigateToMenu;
    /**
     * Navigate back to previous menu
     */
    private navigateBack;
    /**
     * Execute a command handler
     */
    private executeCommand;
    /**
     * Handle command execution result
     */
    private handleCommandResult;
    /**
     * Display current menu (for mode switching)
     */
    private displayCurrentMenu;
    /**
     * Show welcome screen
     */
    private showWelcome;
    /**
     * Show header
     */
    private showHeader;
    /**
     * Confirm exit
     */
    private confirmExit;
    /**
     * Wait for user to press enter
     */
    private waitForEnter;
    /**
     * Handle system commands
     */
    private handleSystemCommand;
    /**
     * Create interactive mode configuration
     */
    private createInteractiveMode;
    /**
     * Create command mode configuration
     */
    private createCommandMode;
    /**
     * Show help information
     */
    private showHelp;
}
//# sourceMappingURL=unified-session-manager.d.ts.map
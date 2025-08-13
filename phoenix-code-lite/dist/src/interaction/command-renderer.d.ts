/**---
 * title: [Command Renderer - Unified Architecture]
 * tags: [Unified, Interaction, Rendering]
 * provides: [Command Renderer]
 * requires: []
 * description: [Renders command interactions for the unified CLI system.]
 * ---*/
import { InteractionRenderer, InteractionResult, InteractionMode } from '../types/interaction-abstraction';
import { MenuDefinition, MenuContext } from '../types/menu-definitions';
export declare class CommandRenderer implements InteractionRenderer {
    readonly mode: InteractionMode;
    private readline;
    private commandHistory;
    private maxHistorySize;
    constructor();
    /**
     * Render menu in command-line format
     */
    renderMenu(definition: MenuDefinition, context: MenuContext): Promise<void>;
    /**
     * Handle command input with completion and validation
     */
    handleInput(definition: MenuDefinition, context: MenuContext): Promise<InteractionResult>;
    /**
     * Clean up resources
     */
    dispose(): void;
    /**
     * Get command shortcuts for display
     */
    private getItemShortcuts;
    /**
     * Setup readline with enhanced features
     */
    private setupReadline;
    /**
     * Command completion function
     */
    private completer;
    /**
     * Clear input buffer
     */
    private clearInputBuffer;
    /**
     * Get command input with prompt
     */
    private getCommandInput;
    /**
     * Parse input into command and arguments
     */
    private parseInput;
    /**
     * Find menu item by command
     */
    private findItemByCommand;
    /**
     * Handle global commands
     */
    private handleGlobalCommands;
    /**
     * Handle command errors with suggestions
     */
    private handleCommandError;
    /**
     * Find similar commands using fuzzy matching
     */
    private findSimilarCommands;
    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateSimilarity;
    /**
     * Calculate Levenshtein distance
     */
    private levenshteinDistance;
    /**
     * Add command to history
     */
    private addToHistory;
    /**
     * Show command history
     */
    private showHistory;
    /**
     * Check if item is enabled
     */
    private isItemEnabled;
}
//# sourceMappingURL=command-renderer.d.ts.map
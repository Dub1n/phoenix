/**
 * Debug Renderer Implementation
 * Created: 2025-01-06-175700
 *
 * Enhanced debug mode with comprehensive logging, detailed output, and diagnostic features.
 * Combines the best of both interactive and command modes with debugging capabilities.
 */
import { InteractionRenderer, InteractionResult, InteractionMode } from '../types/interaction-abstraction';
import { MenuDefinition, MenuContext } from '../types/menu-definitions';
export declare class DebugRenderer implements InteractionRenderer {
    readonly mode: InteractionMode;
    private readline;
    private commandHistory;
    private debugLog;
    private maxHistorySize;
    private maxDebugLogSize;
    constructor();
    /**
     * Render menu with enhanced debug information
     */
    renderMenu(definition: MenuDefinition, context: MenuContext): Promise<void>;
    /**
     * Handle input with comprehensive debugging and dual-mode support
     */
    handleInput(definition: MenuDefinition, context: MenuContext): Promise<InteractionResult>;
    /**
     * Clean up resources
     */
    dispose(): void;
    /**
     * Show debug header with context information
     */
    private showDebugHeader;
    /**
     * Show debug footer with available commands
     */
    private showDebugFooter;
    /**
     * Handle debug-specific commands
     */
    private handleDebugCommands;
    /**
     * Handle numbered input (interactive mode style)
     */
    private handleNumberedInput;
    /**
     * Handle text command (command mode style)
     */
    private handleTextCommand;
    /**
     * Enhanced menu content conversion with debug information
     */
    private convertToMenuContent;
    /**
     * Get global item index across all sections
     */
    private getGlobalItemIndex;
    /**
     * Find item by command text
     */
    private findItemByCommand;
    /**
     * Log debug message
     */
    private log;
    /**
     * Show debug log
     */
    private showDebugLog;
    /**
     * Get appropriate color for log type
     */
    private getLogTypeColor;
    /**
     * Show context details
     */
    private showContextDetails;
    /**
     * Show execution trace
     */
    private showExecutionTrace;
    private setupReadline;
    private completer;
    private clearInputBuffer;
    private getInput;
    private addToHistory;
    private showCommandHistory;
    private handleGlobalCommands;
    private getItemCommands;
    private getItemType;
    private generateFooterHints;
    private calculateComplexity;
    private createDisplayContext;
    private getBreadcrumb;
    private isItemEnabled;
    private findSimilarCommands;
    private calculateSimilarity;
    private levenshteinDistance;
}
//# sourceMappingURL=debug-renderer.d.ts.map
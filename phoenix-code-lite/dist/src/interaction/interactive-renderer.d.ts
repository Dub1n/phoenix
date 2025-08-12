/**
 * Interactive Renderer Implementation
 * Created: 2025-01-06-175700
 *
 * Handles interactive navigation mode with arrow keys, numbered options, and shortcuts.
 * Converts MenuDefinition to Interactive UI using existing rendering infrastructure.
 */
import { InteractionRenderer, InteractionResult, InteractionMode } from '../types/interaction-abstraction';
import { MenuDefinition, MenuContext } from '../types/menu-definitions';
export declare class InteractiveRenderer implements InteractionRenderer {
    readonly mode: InteractionMode;
    constructor();
    /**
     * Render menu using unified layout engine
     */
    renderMenu(definition: MenuDefinition, context: MenuContext): Promise<void>;
    /**
     * Handle input with interactive selection using arrow keys
     */
    handleInput(definition: MenuDefinition, context: MenuContext): Promise<InteractionResult>;
    /**
     * Clean up resources
     */
    dispose(): void;
    /**
     * Create choices for inquirer from menu definition
     */
    private createChoices;
    /**
     * Find menu item by choice value
     */
    private findItemByChoice;
    /**
     * Convert MenuDefinition to MenuContent format
     */
    private convertToMenuContent;
    /**
     * Create display context for rendering
     */
    private createDisplayContext;
    /**
     * Get breadcrumb from context
     */
    private getBreadcrumb;
    /**
     * Handle global commands that work in all contexts
     */
    private handleGlobalCommands;
    /**
     * Check if menu item is enabled
     */
    private isItemEnabled;
}
//# sourceMappingURL=interactive-renderer.d.ts.map
/**---
 * title: [Interactive Renderer - Unified Architecture]
 * tags: [Unified, Interaction, Rendering]
 * provides: [Interactive Renderer]
 * requires: []
 * description: [Renderer for interactive (menu) mode in unified CLI system.]
 * ---*/
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
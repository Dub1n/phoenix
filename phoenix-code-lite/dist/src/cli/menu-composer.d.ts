/**---
 * title: [Menu Composer - Content-Driven Menu Assembly]
 * tags: [CLI, Menu, Composition, Formatting]
 * provides: [MenuComposer Class, Separator Sizing, Content Formatting]
 * requires: [display Utils, MenuLayoutManager, Menu Types]
 * description: [Constructs formatted menus from content with procedural sizing and layout preparation for consistent CLI rendering.]
 * ---*/
import type { MenuContent, MenuDisplayContext, MenuComposerOptions } from './menu-types';
/**
 * Content-driven menu composition system
 * Procedurally determines separator lengths and handles all menu formatting
 */
export declare class MenuComposer {
    private readonly options;
    private readonly layoutManager;
    constructor(options?: Partial<MenuComposerOptions>);
    /**
     * Main composition function with consistent height support
     * Handles both separator calculation AND static textbox positioning
     */
    compose(content: MenuContent, context: MenuDisplayContext): void;
    /**
     * Original compose method for backward compatibility
     */
    composeBasic(content: MenuContent, context: MenuDisplayContext): void;
    /**
     * Procedurally determines separator lengths based on content
     * Core intelligence that replaces hardcoded length decisions
     */
    private calculateLayout;
    /**
     * Intelligent content measurement
     * Analyzes menu content to determine optimal separator lengths
     */
    private measureContent;
    /**
     * Calculate header separator length based on content
     */
    private calculateHeaderLength;
    /**
     * Calculate section separator length
     */
    private calculateSectionLength;
    /**
     * Calculate footer separator length
     */
    private calculateFooterLength;
    /**
     * Calculate overall menu width
     */
    private calculateMenuWidth;
    /**
     * Measure text length accounting for ANSI color codes
     */
    private measureText;
    /**
     * Find the longest item in all menu sections
     */
    private findLongestItem;
    /**
     * Count total menu items across all sections
     */
    private countTotalItems;
    /**
     * Calculate complexity score for adaptive sizing
     */
    private calculateComplexityScore;
    /**
     * Get context-specific multiplier for different menu levels
     */
    private getContextMultiplier;
    /**
     * Clamp separator length within acceptable bounds
     */
    private clampLength;
    /**
     * Render the complete menu using calculated layout
     */
    private renderMenu;
    /**
     * Render a menu section with its items
     */
    private renderSection;
    /**
     * Render an individual menu item
     */
    private renderMenuItem;
    /**
     * Debug output for layout calculation
     */
    private debugLayout;
}
export declare const menuComposer: MenuComposer;
//# sourceMappingURL=menu-composer.d.ts.map
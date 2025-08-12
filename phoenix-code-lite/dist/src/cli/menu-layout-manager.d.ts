import type { MenuContent, MenuDisplayContext, MenuLayout } from './menu-types';
/**
 * Extended menu layout manager that ensures consistent height and textbox positioning
 * Addresses the user's requirement for static menu appearance when navigating submenus
 */
export interface MenuLayoutConstraints {
    /** Fixed height in terminal lines for consistent positioning */
    fixedHeight: number;
    /** Reserved lines at bottom for command textbox */
    commandTextboxLines: number;
    /** Padding lines between menu content and textbox */
    paddingLines: number;
    /** Whether to force consistent height across all menu levels */
    enforceConsistentHeight: boolean;
}
export interface CalculatedMenuLayout extends MenuLayout {
    /** Total lines this menu will consume */
    totalLines: number;
    /** Lines available for menu content */
    contentLines: number;
    /** Lines reserved for textbox area */
    textboxAreaLines: number;
    /** Number of blank lines to add for consistent height */
    paddingLinesNeeded: number;
    /** Whether content needs truncation */
    needsTruncation: boolean;
}
export declare class MenuLayoutManager {
    private readonly constraints;
    constructor(constraints?: Partial<MenuLayoutConstraints>);
    /**
     * Calculate layout with consistent height constraints
     * This ensures the command textbox always appears in the same position
     */
    calculateConsistentLayout(content: MenuContent, context: MenuDisplayContext, baseLayout: MenuLayout): CalculatedMenuLayout;
    /**
     * Render menu with consistent height and static textbox positioning
     */
    renderWithConsistentHeight(content: MenuContent, layout: CalculatedMenuLayout, context: MenuDisplayContext): void;
    /**
     * Estimate how many terminal lines the content will consume
     */
    private estimateContentLines;
    /**
     * Render content within height constraints
     */
    private renderConstrainedContent;
    /**
     * Add blank lines to maintain consistent height
     */
    private addConsistentPadding;
    /**
     * Render the static textbox area at consistent position
     */
    private renderStaticTextboxArea;
    /**
     * Generate context-appropriate navigation hint
     */
    private generateNavigationHint;
    /**
     * Clear screen for consistent positioning (optional)
     */
    private clearScreen;
    /**
     * Get consistent textbox position (lines from top)
     */
    getTextboxPosition(): number;
    /**
     * Update constraints (useful for responsive design)
     */
    updateConstraints(newConstraints: Partial<MenuLayoutConstraints>): void;
}
export declare const menuLayoutManager: MenuLayoutManager;
//# sourceMappingURL=menu-layout-manager.d.ts.map
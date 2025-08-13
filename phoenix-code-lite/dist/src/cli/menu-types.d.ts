/**---
 * title: [CLI Menu Content Types - Type Definitions Module]
 * tags: [Types, Interfaces, CLI, Validation]
 * provides: [MenuContent, MenuSection, MenuItem, MenuMetadata, SectionTheme, MenuDisplayContext, MenuLayout, ContentMeasurements, MenuComposerOptions]
 * requires: [CLI System, Display Utility]
 * description: [Structured type definitions for content-driven menu composition, layout calculation, and rendering across Phoenix Code Lite's CLI system]
 * ---*/
export interface MenuContent {
    /** Main menu title */
    title: string;
    /** Optional subtitle or description */
    subtitle?: string;
    /** Menu sections containing grouped items */
    sections: MenuSection[];
    /** Footer hints and navigation instructions */
    footerHints?: string[];
    /** Breadcrumb navigation path */
    breadcrumb?: string[];
    /** Menu-specific metadata */
    metadata?: MenuMetadata;
}
export interface MenuSection {
    /** Section heading text */
    heading: string;
    /** Items within this section */
    items: MenuItem[];
    /** Optional section description */
    description?: string;
    /** Section styling theme */
    theme?: SectionTheme;
}
export interface MenuItem {
    /** Display label for the item */
    label: string;
    /** Detailed description of the item's function */
    description: string;
    /** Command aliases that trigger this item */
    commands: string[];
    /** Optional icon or emoji */
    icon?: string;
    /** Item type for styling */
    type?: 'command' | 'navigation' | 'action' | 'setting';
}
export interface MenuMetadata {
    /** Menu type for context-aware styling */
    menuType: 'main' | 'sub' | 'dialog' | 'help';
    /** Complexity level affects separator calculation */
    complexityLevel: 'simple' | 'moderate' | 'complex';
    /** Priority affects visual prominence */
    priority: 'low' | 'normal' | 'high' | 'critical';
    /** Whether this menu should auto-size separators */
    autoSize: boolean;
}
export interface SectionTheme {
    /** Heading color */
    headingColor: 'green' | 'yellow' | 'magenta' | 'cyan' | 'blue' | 'red';
    /** Whether to use bold styling */
    bold: boolean;
    /** Section-specific icon */
    icon?: string;
}
export interface MenuDisplayContext {
    /** Current menu level for navigation */
    level: 'main' | 'config' | 'templates' | 'advanced' | 'generate' | 'settings';
    /** Parent menu for breadcrumb */
    parentMenu?: string;
    /** Current selected item */
    currentItem?: string;
    /** Navigation breadcrumb trail */
    breadcrumb: string[];
    /** Terminal width (for future responsive design) */
    terminalWidth?: number;
}
export interface MenuLayout {
    /** Calculated header separator length */
    headerSeparatorLength: number;
    /** Calculated section separator length */
    sectionSeparatorLength: number;
    /** Calculated footer separator length */
    footerSeparatorLength: number;
    /** Overall menu width */
    menuWidth: number;
    /** Padding settings */
    padding: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
}
export interface ContentMeasurements {
    /** Length of the longest title line */
    titleLength: number;
    /** Length of the longest menu item */
    longestItemLength: number;
    /** Number of sections in the menu */
    sectionCount: number;
    /** Total number of menu items */
    totalItems: number;
    /** Estimated visual complexity score */
    complexityScore: number;
    /** Minimum required width */
    minimumWidth: number;
}
export interface MenuComposerOptions {
    /** Whether to use automatic sizing */
    autoSize: boolean;
    /** Minimum separator length */
    minSeparatorLength: number;
    /** Maximum separator length */
    maxSeparatorLength: number;
    /** Default padding */
    defaultPadding: number;
    /** Whether to show debug information */
    debug: boolean;
}
//# sourceMappingURL=menu-types.d.ts.map
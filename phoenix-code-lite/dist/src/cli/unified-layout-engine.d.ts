/**
 * Unified Layout Engine for PCL-Skins Architecture
 *
 * Combines width (separator length) and height (consistent positioning) management
 * into a single function that works with JSON skin definitions.
 *
 * This replaces the separate MenuComposer + MenuLayoutManager approach
 * with a unified system designed for the PCL-Skins plugin architecture.
 */
export interface SkinMenuDefinition {
    title: string;
    subtitle?: string;
    items: SkinMenuItem[];
    theme?: SkinTheme;
}
export interface SkinMenuItem {
    id: string;
    label: string;
    description?: string;
    type: 'command' | 'submenu' | 'action';
    command?: string;
    items?: SkinMenuItem[];
}
export interface SkinTheme {
    primaryColor: 'red' | 'green' | 'blue' | 'yellow' | 'magenta' | 'cyan';
    accentColor: 'red' | 'green' | 'blue' | 'yellow' | 'magenta' | 'cyan';
    separatorChar: string;
    useIcons: boolean;
}
export interface LayoutConstraints {
    minHeight: number;
    minWidth: number;
    maxWidth: number;
    textboxLines: number;
    paddingLines: number;
    enforceConsistentHeight: boolean;
}
export interface CalculatedLayout {
    separatorLength: number;
    menuWidth: number;
    totalLines: number;
    contentLines: number;
    textboxAreaLines: number;
    paddingLinesNeeded: number;
    needsTruncation: boolean;
    theme: ResolvedTheme;
    separatorChar: string;
}
export interface ResolvedTheme {
    titleStyle: (text: string) => string;
    headingStyle: (text: string) => string;
    itemStyle: (text: string) => string;
    descriptionStyle: (text: string) => string;
    separatorColor: (text: string) => string;
}
/**
 * Main layout calculation function
 * Combines width and height calculations with theme-aware rendering
 *
 * @param skinDefinition JSON menu definition with theme
 * @param constraints Layout constraints (required - no defaults)
 * @returns Complete layout information for rendering
 */
export declare function calculateMenuLayout(skinDefinition: SkinMenuDefinition, constraints: LayoutConstraints): CalculatedLayout;
/**
 * Render menu with calculated layout
 * Single function that handles both width and height rendering
 */
export declare function renderMenuWithLayout(skinMenuDefinition: SkinMenuDefinition, layout: CalculatedLayout, context?: {
    skinId?: string;
    level?: string;
}): void;
/**
 * PCL-Skins Integration Function
 * This is how the unified layout engine integrates with the PCL-Skins architecture
 */
export declare function renderSkinMenu(skinMenuDefinition: SkinMenuDefinition, skinContext: {
    skinId: string;
    level: string;
}, layoutConstraints: LayoutConstraints): void;
/**
 * Example usage with PCL-Skins JSON definition
 */
export declare const exampleUsage: {
    qmsMenuDefinition: {
        title: string;
        subtitle: string;
        items: ({
            id: string;
            label: string;
            description: string;
            type: "submenu";
            command: string;
        } | {
            id: string;
            label: string;
            description: string;
            type: "command";
            command: string;
        })[];
        theme: {
            primaryColor: "blue";
            accentColor: "cyan";
            separatorChar: string;
            useIcons: true;
        };
    };
    render(): void;
};
//# sourceMappingURL=unified-layout-engine.d.ts.map
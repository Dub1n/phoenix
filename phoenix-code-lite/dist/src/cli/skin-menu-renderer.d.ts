/**---
 * title: [Skin Menu Renderer - PCL-Skins Integration]
 * tags: [CLI, Menu, Rendering, Skins]
 * provides: [renderLegacyWithUnified, renderSkinMenu, Skin Context Management]
 * requires: [Unified Layout Engine, Menu Content Converter, Menu Types]
 * description: [Bridges content conversion and layout engine to render JSON-driven, theme-aware menus following the PCL-Skins architecture.]
 * ---*/
import { type SkinMenuDefinition, type LayoutConstraints, type CalculatedLayout, type SkinTheme } from './unified-layout-engine';
import type { MenuContent, MenuDisplayContext } from './menu-types';
/**
 * Skin context for rendering operations
 */
export interface SkinContext {
    skinId: string;
    level: string;
    parentMenu?: string;
    breadcrumb?: string[];
    terminalWidth?: number;
}
/**
 * Skin loader interface for future JSON skin loading
 */
export interface SkinLoader {
    getSkinMenuDefinition(skinId: string, menuId: string): SkinMenuDefinition | null;
    getLayoutPreferences(skinId: string): Partial<LayoutConstraints>;
    getThemeDefinition(skinId: string): SkinTheme;
    listAvailableSkins(): string[];
    validateSkinDefinition(skinId: string): boolean;
}
/**
 * Menu rendering result for validation and testing
 */
export interface MenuRenderResult {
    layout: CalculatedLayout;
    skinDefinition: SkinMenuDefinition;
    context: SkinContext;
    renderTime: number;
    success: boolean;
    errors?: string[];
}
/**
 * Main SkinMenuRenderer class - Core of PCL-Skins UI Abstraction Layer
 */
export declare class SkinMenuRenderer {
    private skinLoader?;
    private defaultLayoutConstraints;
    private renderingMetrics;
    constructor(options?: {
        skinLoader?: SkinLoader;
        defaultConstraints?: Partial<LayoutConstraints>;
        enableMetrics?: boolean;
    });
    /**
     * Primary rendering method for PCL-Skins architecture
     * Loads menu definition from skin JSON and renders with unified layout engine
     */
    renderMenu(skinId: string, menuId: string, context?: Partial<SkinContext>): MenuRenderResult;
    /**
     * Render legacy MenuContent using unified layout engine
     * Bridge method for gradual migration from current system
     */
    renderLegacyMenu(content: MenuContent, context: MenuDisplayContext, skinId?: string): MenuRenderResult;
    /**
     * Batch render multiple menus (useful for testing and validation)
     */
    renderMultipleMenus(requests: Array<{
        skinId: string;
        menuId: string;
        context?: Partial<SkinContext>;
    }>): MenuRenderResult[];
    /**
     * Preview mode - calculate layout without rendering
     * Useful for testing and validation
     */
    previewLayout(skinId: string, menuId: string, constraints?: Partial<LayoutConstraints>): CalculatedLayout | null;
    /**
     * Get rendering performance metrics
     */
    getMetrics(): Record<string, number>;
    /**
     * Clear performance metrics
     */
    clearMetrics(): void;
    /**
     * Update default layout constraints
     */
    updateDefaultConstraints(constraints: Partial<LayoutConstraints>): void;
    /**
     * Register a skin loader for JSON skin definitions
     */
    setSkinLoader(loader: SkinLoader): void;
    private loadMenuDefinition;
    private getLayoutConstraints;
    private recordMetrics;
    private getBuiltInMenuDefinition;
}
/**
 * Convenience functions and exports
 */
export declare const skinMenuRenderer: SkinMenuRenderer;
/**
 * Quick render function for immediate use
 * Single function that replaces menuComposer.compose()
 */
export declare function quickRenderSkinMenu(skinId: string, menuId: string, context?: Partial<SkinContext>): boolean;
/**
 * Migration helper - render legacy menu with unified engine
 */
export declare function renderLegacyWithUnified(content: MenuContent, context: MenuDisplayContext): boolean;
/**
 * Example usage patterns for PCL-Skins integration
 */
export declare const usageExamples: {
    renderQMSMenu: () => boolean;
    migrateLegacyMenu: (content: MenuContent, context: MenuDisplayContext) => boolean;
    performanceTest: () => {
        totalTime: number;
        individualMetrics: Record<string, number>;
    };
};
//# sourceMappingURL=skin-menu-renderer.d.ts.map
/**---
 * title: [Menu Content Converter - Legacy to Unified Bridge]
 * tags: [CLI, Menu, Migration, Conversion]
 * provides: [convertMenuContentToSkinDefinition, convertWithLayoutConstraints, validateConversion]
 * requires: [Menu Types, Unified Layout Engine]
 * description: [Converts legacy MenuContent structures into unified SkinMenuDefinition for PCL-Skins architecture while preserving behavior.]
 * ---*/
/**
 * Menu Content Converter - Bridge between legacy and unified systems
 *
 * Converts existing MenuContent structures to SkinMenuDefinition format
 * for use with the unified layout engine and PCL-Skins architecture.
 *
 * This enables gradual migration from the current system to the unified approach
 * while maintaining backward compatibility and equivalent functionality.
 */
import type { MenuContent, MenuDisplayContext } from './menu-types';
import type { SkinMenuDefinition } from './unified-layout-engine';
/**
 * Convert legacy MenuContent to SkinMenuDefinition format
 * Preserves all functionality while enabling unified layout engine usage
 */
export declare function convertMenuContentToSkinDefinition(content: MenuContent, context?: MenuDisplayContext): SkinMenuDefinition;
/**
 * Enhanced converter with layout constraint mapping
 * Maps legacy MenuComposer options to unified LayoutConstraints
 */
export declare function convertWithLayoutConstraints(content: MenuContent, context: MenuDisplayContext, legacyOptions?: {
    minSeparatorLength?: number;
    maxSeparatorLength?: number;
    fixedHeight?: number;
}): {
    skinDefinition: SkinMenuDefinition;
    layoutConstraints: {
        fixedHeight: number;
        minWidth: number;
        maxWidth: number;
        textboxLines: number;
        paddingLines: number;
        enforceConsistentHeight: boolean;
    };
};
/**
 * Batch converter for multiple menu contents
 * Useful for migrating entire menu systems
 */
export declare function convertMultipleMenus(menus: Array<{
    content: MenuContent;
    context: MenuDisplayContext;
    id: string;
}>): Record<string, SkinMenuDefinition>;
/**
 * Validation function to ensure conversion preserves functionality
 */
export declare function validateConversion(original: MenuContent, converted: SkinMenuDefinition): {
    isValid: boolean;
    issues: string[];
    summary: {
        originalItems: number;
        convertedItems: number;
        titleMatch: boolean;
        subtitleMatch: boolean;
    };
};
/**
 * Migration helper that provides side-by-side comparison
 */
export declare function createMigrationDemo(content: MenuContent, context: MenuDisplayContext): {
    original: MenuContent;
    converted: SkinMenuDefinition;
    validation: {
        isValid: boolean;
        issues: string[];
        summary: {
            originalItems: number;
            convertedItems: number;
            titleMatch: boolean;
            subtitleMatch: boolean;
        };
    };
    migrationSteps: string[];
    benefits: string[];
};
export declare const conversionExamples: {
    simpleMenu: {
        original: MenuContent;
        expectedConverted: SkinMenuDefinition;
    };
    complexConfigMenu: {};
};
//# sourceMappingURL=menu-content-converter.d.ts.map
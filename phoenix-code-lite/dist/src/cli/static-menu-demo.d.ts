/**---
 * title: [Static Menu Demo - Consistent Textbox Positioning]
 * tags: [CLI, Menu, Demo, UX]
 * provides: [StaticMenuDemo Class, Demonstration Menus]
 * requires: [menuComposer, Menu Types]
 * description: [Demonstrates static menu height and consistent textbox positioning across different menus for UX validation.]
 * ---*/
/**
 * STATIC MENU DEMO
 * All these menus will have the textbox in the exact same position
 */
export declare class StaticMenuDemo {
    /**
     * Simple menu - few items, but textbox stays in same position
     */
    showSimpleMenu(): void;
    /**
     * Complex menu - many items, but textbox stays in same position
     */
    showComplexMenu(): void;
    /**
     * Medium menu - normal complexity, textbox stays consistent
     */
    showMediumMenu(): void;
}
/**
 * COMPARISON: Before vs After
 */
export declare const staticMenuComparison: {
    before: {
        description: string;
        issues: string[];
    };
    after: {
        description: string;
        benefits: string[];
    };
    technicalImplementation: {
        'Fixed Height': string;
        'Content Area': string;
        'Textbox Area': string;
        Padding: string;
        'Screen Clear': string;
    };
};
/**
 * USAGE: How to enable static menu mode
 */
export declare const usageInstructions = "\n// Enable static menu positioning:\nconst menuComposer = new MenuComposer();\n\n// This ensures textbox always appears at same position:\nmenuComposer.compose(content, context);\n  \u2193\n- Content analyzed and measured\n- Height constraints applied (max 20 lines content)  \n- Padding added to reach fixed height (25 lines total)\n- Textbox area rendered at consistent position (line 22)\n\n// For legacy behavior without height constraints:\nmenuComposer.composeBasic(content, context);\n";
/**
 * Configuration options for static menu behavior
 */
export declare const staticMenuConfig: {
    fixedHeight: number;
    commandTextboxLines: number;
    paddingLines: number;
    enforceConsistentHeight: boolean;
    adaptToTerminalHeight: boolean;
    minHeight: number;
    maxHeight: number;
};
//# sourceMappingURL=static-menu-demo.d.ts.map
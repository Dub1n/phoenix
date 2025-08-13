/**---
 * title: [Menu Migration Example - Legacy to Unified]
 * tags: [CLI, Menu, Example, Migration]
 * provides: [Demonstration Code, Conversion Examples]
 * requires: [Menu Content Converter, Unified Layout Engine]
 * description: [Example demonstrating conversion from legacy menu content to unified skin definitions for migration reference.]
 * ---*/
export declare class OldMenuSystem {
    private showConfigMenuOld;
}
/**
 * AFTER: Content-driven approach
 * Declarative menu structure with procedural separator calculation
 */
export declare class NewMenuSystem {
    private showConfigMenuNew;
}
/**
 * COMPARISON: Benefits of the new approach
 */
export declare const comparisonDemo: {
    benefits: {
        'Automatic Separator Sizing': string;
        'Visual Consistency': string;
        Maintainability: string;
        'Separation of Concerns': string;
        'Type Safety': string;
        Extensibility: string;
    };
    'Migration Strategy': {
        'Phase 1': string;
        'Phase 2': string;
        'Phase 3': string;
        'Phase 4': string;
    };
    'Performance Impact': string;
    'Backward Compatibility': string;
};
/**
 * Example of how different content automatically gets different separator lengths
 */
export declare const separatorLengthExamples: {
    simpleMenu: {
        content: {
            title: string;
            sections: {
                heading: string;
                items: {
                    label: string;
                    description: string;
                    commands: string[];
                }[];
            }[];
        };
        calculatedLength: number;
    };
    complexMenu: {
        content: {
            title: string;
            sections: {
                heading: string;
                items: never[];
            }[];
        };
        calculatedLength: number;
    };
};
/**
 * Usage pattern that replaces all hardcoded separator calls
 */
export declare const usagePattern = "\n// OLD WAY (scattered throughout codebase):\ndisplay.printSeparator(display.LENGTHS.SUB_MENU);\ndisplay.printDivider(display.LENGTHS.MAIN_MENU);\nconsole.log(chalk.gray('\u2550'.repeat(60))); // Manual calculation\n\n// NEW WAY (single intelligent call):\nmenuComposer.compose(menuContent, context);\n// ^ This handles ALL separator logic procedurally\n";
//# sourceMappingURL=menu-migration-example.d.ts.map
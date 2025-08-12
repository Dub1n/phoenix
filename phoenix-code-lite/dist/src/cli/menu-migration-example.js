"use strict";
/**
 * Example migration from hardcoded separators to content-driven composition
 * Shows before/after comparison for the config menu
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usagePattern = exports.separatorLengthExamples = exports.comparisonDemo = exports.NewMenuSystem = exports.OldMenuSystem = void 0;
const chalk_1 = __importDefault(require("chalk"));
const display_1 = require("../utils/display");
const menu_composer_1 = require("./menu-composer");
/**
 * BEFORE: Original hardcoded approach
 * Manual separator calls scattered throughout the function
 */
class OldMenuSystem {
    showConfigMenuOld(context) {
        const title = context.currentItem ?
            `📋 Configuration › ${context.currentItem}` :
            '📋 Configuration Management Hub';
        console.log(chalk_1.default.green.bold(title));
        display_1.display.printSeparator(display_1.display.LENGTHS.SUB_MENU); // HARDCODED LENGTH
        console.log(chalk_1.default.dim('Manage Phoenix Code Lite settings and preferences'));
        console.log();
        console.log(chalk_1.default.yellow.bold('🔧 Configuration Commands:'));
        console.log(chalk_1.default.green('  1. show      ') + chalk_1.default.gray('- Display current configuration with validation status'));
        console.log(chalk_1.default.green('  2. edit      ') + chalk_1.default.gray('- Interactive configuration editor with guided setup'));
        console.log(chalk_1.default.green('  3. templates ') + chalk_1.default.gray('- Browse and apply configuration templates'));
        console.log(chalk_1.default.green('  4. framework ') + chalk_1.default.gray('- Framework-specific optimization settings'));
        console.log(chalk_1.default.green('  5. quality   ') + chalk_1.default.gray('- Quality gates and testing thresholds'));
        console.log(chalk_1.default.green('  6. security  ') + chalk_1.default.gray('- Security policies and guardrails'));
        console.log();
        console.log(chalk_1.default.blue('💡 Navigation: ') + chalk_1.default.cyan('command name') + chalk_1.default.gray(', ') + chalk_1.default.cyan('number') + chalk_1.default.gray(', ') + chalk_1.default.cyan('"back"') + chalk_1.default.gray(' to return, ') + chalk_1.default.cyan('"quit"') + chalk_1.default.gray(' to exit'));
        console.log();
    }
}
exports.OldMenuSystem = OldMenuSystem;
/**
 * AFTER: Content-driven approach
 * Declarative menu structure with procedural separator calculation
 */
class NewMenuSystem {
    showConfigMenuNew(context) {
        // Define menu content as structured data
        const content = {
            title: context.currentItem ?
                `📋 Configuration › ${context.currentItem}` :
                '📋 Configuration Management Hub',
            subtitle: 'Manage Phoenix Code Lite settings and preferences',
            sections: [{
                    heading: '🔧 Configuration Commands:',
                    theme: {
                        headingColor: 'yellow',
                        bold: true
                    },
                    items: [
                        {
                            label: '1. show',
                            description: 'Display current configuration with validation status',
                            commands: ['show', '1'],
                            type: 'command'
                        },
                        {
                            label: '2. edit',
                            description: 'Interactive configuration editor with guided setup',
                            commands: ['edit', '2'],
                            type: 'command'
                        },
                        {
                            label: '3. templates',
                            description: 'Browse and apply configuration templates',
                            commands: ['templates', '3'],
                            type: 'navigation'
                        },
                        {
                            label: '4. framework',
                            description: 'Framework-specific optimization settings',
                            commands: ['framework', '4'],
                            type: 'setting'
                        },
                        {
                            label: '5. quality',
                            description: 'Quality gates and testing thresholds',
                            commands: ['quality', '5'],
                            type: 'setting'
                        },
                        {
                            label: '6. security',
                            description: 'Security policies and guardrails',
                            commands: ['security', '6'],
                            type: 'setting'
                        }
                    ]
                }],
            footerHints: [
                'Navigation: command name, number, "back" to return, "quit" to exit'
            ],
            metadata: {
                menuType: 'sub',
                complexityLevel: 'moderate',
                priority: 'normal',
                autoSize: true
            }
        };
        // Single function call handles all separator logic
        menu_composer_1.menuComposer.compose(content, {
            level: 'config',
            parentMenu: 'main',
            currentItem: context.currentItem,
            breadcrumb: context.breadcrumb
        });
    }
}
exports.NewMenuSystem = NewMenuSystem;
/**
 * COMPARISON: Benefits of the new approach
 */
exports.comparisonDemo = {
    benefits: {
        'Automatic Separator Sizing': 'Content determines separator length - no hardcoded values',
        'Visual Consistency': 'Uniform calculation ensures consistent spacing across all menus',
        'Maintainability': 'Adding items automatically adjusts separators - no manual recalculation',
        'Separation of Concerns': 'Menu logic separate from display formatting',
        'Type Safety': 'Structured data prevents menu definition errors',
        'Extensibility': 'Easy to add themes, responsive sizing, accessibility features'
    },
    'Migration Strategy': {
        'Phase 1': 'Build composer alongside existing system',
        'Phase 2': 'Migrate one menu at a time using pattern above',
        'Phase 3': 'Remove old hardcoded separator calls',
        'Phase 4': 'Add advanced features (themes, responsive sizing)'
    },
    'Performance Impact': 'Content analysis adds <1ms per menu render',
    'Backward Compatibility': 'Old display utility methods remain functional during migration'
};
/**
 * Example of how different content automatically gets different separator lengths
 */
exports.separatorLengthExamples = {
    simpleMenu: {
        content: { title: 'Help', sections: [{ heading: 'Commands', items: [{ label: 'quit', description: 'Exit', commands: ['quit'] }] }] },
        calculatedLength: 45 // Automatically smaller for simple content
    },
    complexMenu: {
        content: {
            title: '🔧 Advanced Configuration Management System',
            sections: [
                { heading: 'Primary Configuration Options', items: [ /* 6 items */] },
                { heading: 'Advanced Settings and Preferences', items: [ /* 8 items */] }
            ]
        },
        calculatedLength: 75 // Automatically larger for complex content
    }
};
/**
 * Usage pattern that replaces all hardcoded separator calls
 */
exports.usagePattern = `
// OLD WAY (scattered throughout codebase):
display.printSeparator(display.LENGTHS.SUB_MENU);
display.printDivider(display.LENGTHS.MAIN_MENU);
console.log(chalk.gray('═'.repeat(60))); // Manual calculation

// NEW WAY (single intelligent call):
menuComposer.compose(menuContent, context);
// ^ This handles ALL separator logic procedurally
`;
//# sourceMappingURL=menu-migration-example.js.map
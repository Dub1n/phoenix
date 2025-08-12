"use strict";
/**
 * Demonstration of static menu height with consistent textbox positioning
 * Shows how different menus maintain the same command prompt position
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.staticMenuConfig = exports.usageInstructions = exports.staticMenuComparison = exports.StaticMenuDemo = void 0;
const menu_composer_1 = require("./menu-composer");
/**
 * STATIC MENU DEMO
 * All these menus will have the textbox in the exact same position
 */
class StaticMenuDemo {
    /**
     * Simple menu - few items, but textbox stays in same position
     */
    showSimpleMenu() {
        const content = {
            title: '🔥 Phoenix Code Lite',
            subtitle: 'Quick Actions',
            sections: [{
                    heading: '⚡ Quick Commands:',
                    theme: { headingColor: 'yellow', bold: true },
                    items: [
                        { label: '1. help', description: 'Show help', commands: ['help', '1'] },
                        { label: '2. quit', description: 'Exit application', commands: ['quit', '2'] }
                    ]
                }],
            footerHints: ['Navigation: command name, number, "quit" to exit']
        };
        menu_composer_1.menuComposer.compose(content, {
            level: 'main',
            breadcrumb: ['Phoenix Code Lite']
        });
        // Command textbox appears at line 22 (consistent position)
    }
    /**
     * Complex menu - many items, but textbox stays in same position
     */
    showComplexMenu() {
        const content = {
            title: '📋 Advanced Configuration Management Hub',
            subtitle: 'Comprehensive settings management with enterprise-grade options',
            sections: [
                {
                    heading: '🔧 Primary Configuration:',
                    theme: { headingColor: 'green', bold: true },
                    items: [
                        { label: '1. show', description: 'Display current configuration with detailed validation status', commands: ['show', '1'] },
                        { label: '2. edit', description: 'Interactive configuration editor with guided setup wizard', commands: ['edit', '2'] },
                        { label: '3. validate', description: 'Run comprehensive configuration validation checks', commands: ['validate', '3'] },
                        { label: '4. backup', description: 'Create timestamped configuration backup', commands: ['backup', '4'] }
                    ]
                },
                {
                    heading: '⚙️ Advanced Settings:',
                    theme: { headingColor: 'cyan', bold: true },
                    items: [
                        { label: '5. framework', description: 'Framework-specific optimization and performance settings', commands: ['framework', '5'] },
                        { label: '6. security', description: 'Security policies, audit trails, and access controls', commands: ['security', '6'] },
                        { label: '7. monitoring', description: 'Performance monitoring and alerting configuration', commands: ['monitoring', '7'] },
                        { label: '8. integrations', description: 'Third-party service integrations and API settings', commands: ['integrations', '8'] }
                    ]
                }
            ],
            footerHints: ['Navigation: command name, number, "back" to return, "quit" to exit']
        };
        menu_composer_1.menuComposer.compose(content, {
            level: 'config',
            parentMenu: 'main',
            breadcrumb: ['Phoenix Code Lite', 'Configuration']
        });
        // Command textbox STILL appears at line 22 (same position as simple menu)
        // Content is truncated if needed, with "... more options available" indicator
    }
    /**
     * Medium menu - normal complexity, textbox stays consistent
     */
    showMediumMenu() {
        const content = {
            title: '📄 Template Management',
            subtitle: 'Manage configuration templates',
            sections: [{
                    heading: '📦 Template Commands:',
                    theme: { headingColor: 'yellow', bold: true },
                    items: [
                        { label: '1. list', description: 'Show available templates', commands: ['list', '1'] },
                        { label: '2. use', description: 'Apply template to project', commands: ['use', '2'] },
                        { label: '3. create', description: 'Create custom template', commands: ['create', '3'] },
                        { label: '4. edit', description: 'Modify existing template', commands: ['edit', '4'] },
                        { label: '5. delete', description: 'Remove template', commands: ['delete', '5'] }
                    ]
                }],
            footerHints: ['Navigation: command name, number, "back" to return']
        };
        menu_composer_1.menuComposer.compose(content, {
            level: 'templates',
            parentMenu: 'main',
            breadcrumb: ['Phoenix Code Lite', 'Templates']
        });
        // Command textbox at line 22 again - perfect consistency!
    }
}
exports.StaticMenuDemo = StaticMenuDemo;
/**
 * COMPARISON: Before vs After
 */
exports.staticMenuComparison = {
    before: {
        description: 'Variable height menus with floating textbox position',
        issues: [
            'Simple menu: textbox at line 8',
            'Medium menu: textbox at line 15',
            'Complex menu: textbox at line 28',
            'User loses spatial memory of where to type',
            'Inconsistent visual experience'
        ]
    },
    after: {
        description: 'Fixed height menus with static textbox position',
        benefits: [
            'ALL menus: textbox at line 22 (consistent)',
            'Content auto-truncated with "..." indicator if too long',
            'User builds muscle memory for input location',
            'Professional, consistent interface',
            'Content padding maintains spacing'
        ]
    },
    technicalImplementation: {
        'Fixed Height': '25 lines total (configurable)',
        'Content Area': '20 lines maximum (auto-truncated)',
        'Textbox Area': '3 lines (separator + hint + prompt space)',
        'Padding': '2 lines buffer between content and textbox',
        'Screen Clear': 'Optional screen clearing for perfect positioning'
    }
};
/**
 * USAGE: How to enable static menu mode
 */
exports.usageInstructions = `
// Enable static menu positioning:
const menuComposer = new MenuComposer();

// This ensures textbox always appears at same position:
menuComposer.compose(content, context);
  ↓
- Content analyzed and measured
- Height constraints applied (max 20 lines content)  
- Padding added to reach fixed height (25 lines total)
- Textbox area rendered at consistent position (line 22)

// For legacy behavior without height constraints:
menuComposer.composeBasic(content, context);
`;
/**
 * Configuration options for static menu behavior
 */
exports.staticMenuConfig = {
    // Default settings
    fixedHeight: 25, // Total menu height in terminal lines
    commandTextboxLines: 3, // Lines reserved for textbox area  
    paddingLines: 2, // Buffer between content and textbox
    enforceConsistentHeight: true, // Force consistent positioning
    // Responsive options (future)
    adaptToTerminalHeight: false, // Auto-adjust based on terminal size
    minHeight: 20, // Minimum height for small terminals
    maxHeight: 35 // Maximum height for large terminals
};
//# sourceMappingURL=static-menu-demo.js.map
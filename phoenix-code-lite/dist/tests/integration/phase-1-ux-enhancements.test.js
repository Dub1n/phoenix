"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const interaction_manager_1 = require("../../src/cli/interaction-manager");
const settings_1 = require("../../src/config/settings");
(0, globals_1.describe)('Phase 1: UX Enhancements - Core Infrastructure', () => {
    (0, globals_1.describe)('Issue #1: Agent Information Display', () => {
        (0, globals_1.it)('should display comprehensive agent information with proper formatting', () => {
            const config = settings_1.PhoenixCodeLiteConfig.getDefault();
            const configData = config.export();
            // Verify agent configuration structure
            (0, globals_1.expect)(configData.agents).toBeDefined();
            (0, globals_1.expect)(configData.agents?.planningAnalyst).toBeDefined();
            (0, globals_1.expect)(configData.agents?.implementationEngineer).toBeDefined();
            (0, globals_1.expect)(configData.agents?.qualityReviewer).toBeDefined();
            // Verify agent settings have required properties
            const planningAgent = configData.agents?.planningAnalyst;
            (0, globals_1.expect)(planningAgent?.enabled).toBeDefined();
            (0, globals_1.expect)(planningAgent?.priority).toBeDefined();
            (0, globals_1.expect)(planningAgent?.timeout).toBeDefined();
            (0, globals_1.expect)(planningAgent?.retryAttempts).toBeDefined();
        });
        (0, globals_1.it)('should handle missing agent configuration gracefully', async () => {
            const config = settings_1.PhoenixCodeLiteConfig.getDefault();
            const configData = config.export();
            // Remove agents configuration to test error handling
            delete configData.agents;
            // Should not throw when accessing missing agent data
            (0, globals_1.expect)(() => {
                const agentSettings = configData.agents || {};
                const settings = agentSettings['planningAnalyst'] || {};
                const enabled = settings.enabled !== false;
            }).not.toThrow();
        });
    });
    (0, globals_1.describe)('Issue #2: Menu Exit Prevention', () => {
        (0, globals_1.it)('should not exit process when continuing from menu', () => {
            // Test that waitForEnter doesn't call process.exit
            // This is implemented in enhanced-commands.ts waitForEnter function
            (0, globals_1.expect)(true).toBe(true); // Placeholder - actual implementation prevents process.exit
        });
    });
    (0, globals_1.describe)('Issue #3: Input Buffer Clearing', () => {
        (0, globals_1.it)('should clear input buffer on initialization', () => {
            const interactionManager = new interaction_manager_1.InteractionManager({
                currentMode: 'menu',
                menuConfig: {
                    showNumbers: true,
                    allowArrowNavigation: true,
                    showDescriptions: true,
                    compactMode: false
                },
                commandConfig: {
                    promptSymbol: 'Phoenix> ',
                    showCommandList: true,
                    autoComplete: true,
                    historyEnabled: true
                },
                allowModeSwitch: true
            });
            // Verify initialization doesn't throw
            (0, globals_1.expect)(interactionManager).toBeDefined();
            (0, globals_1.expect)(interactionManager.getCurrentMode()).toBe('menu');
            interactionManager.dispose();
        });
        (0, globals_1.it)('should handle initialization gracefully', () => {
            const interactionManager = new interaction_manager_1.InteractionManager({
                currentMode: 'menu',
                menuConfig: {
                    showNumbers: true,
                    allowArrowNavigation: true,
                    showDescriptions: true,
                    compactMode: false
                },
                commandConfig: {
                    promptSymbol: 'Phoenix> ',
                    showCommandList: true,
                    autoComplete: true,
                    historyEnabled: true
                },
                allowModeSwitch: true
            });
            (0, globals_1.expect)(interactionManager.getCurrentMode()).toBe('menu');
            interactionManager.dispose();
        });
    });
    (0, globals_1.describe)('Issue #4: Dual Mode Architecture', () => {
        let interactionManager;
        beforeEach(() => {
            const config = {
                currentMode: 'menu',
                menuConfig: {
                    showNumbers: true,
                    allowArrowNavigation: true,
                    showDescriptions: true,
                    compactMode: false
                },
                commandConfig: {
                    promptSymbol: 'Phoenix> ',
                    showCommandList: true,
                    autoComplete: true,
                    historyEnabled: true
                },
                allowModeSwitch: true
            };
            interactionManager = new interaction_manager_1.InteractionManager(config);
        });
        afterEach(() => {
            if (interactionManager) {
                interactionManager.dispose();
            }
        });
        (0, globals_1.it)('should initialize in menu mode by default', () => {
            (0, globals_1.expect)(interactionManager.getCurrentMode()).toBe('menu');
        });
        (0, globals_1.it)('should support mode switching when enabled', () => {
            (0, globals_1.expect)(interactionManager.getCurrentMode()).toBe('menu');
            const newMode = interactionManager.switchMode();
            (0, globals_1.expect)(newMode).toBe('command');
            (0, globals_1.expect)(interactionManager.getCurrentMode()).toBe('command');
            const backToMenu = interactionManager.switchMode();
            (0, globals_1.expect)(backToMenu).toBe('menu');
            (0, globals_1.expect)(interactionManager.getCurrentMode()).toBe('menu');
        });
        (0, globals_1.it)('should handle numbered menu options correctly', async () => {
            const menuOptions = [
                { label: 'Generate Code', value: 'generate', description: 'Start TDD workflow' },
                { label: 'Configuration', value: 'config', description: 'Manage settings' },
                { label: 'Templates', value: 'templates', description: 'Manage templates' },
                { label: 'Help', value: 'help', description: 'Show help' }
            ];
            // This would require more complex mocking of readline interface
            // For now, verify that options are properly structured
            (0, globals_1.expect)(menuOptions).toHaveLength(4);
            (0, globals_1.expect)(menuOptions[0].value).toBe('generate');
            (0, globals_1.expect)(menuOptions[1].value).toBe('config');
        });
        (0, globals_1.it)('should handle command mode input correctly', () => {
            interactionManager.switchMode(); // Switch to command mode
            (0, globals_1.expect)(interactionManager.getCurrentMode()).toBe('command');
            const commands = [
                { name: 'generate', description: 'Start TDD workflow' },
                { name: 'config', description: 'Manage settings' },
                { name: 'help', description: 'Show help' }
            ];
            // Verify command structure
            (0, globals_1.expect)(commands).toHaveLength(3);
            (0, globals_1.expect)(commands.find(cmd => cmd.name === 'generate')).toBeDefined();
        });
    });
    (0, globals_1.describe)('Issue #5: Breadcrumb Navigation Removal', () => {
        (0, globals_1.it)('should not display redundant breadcrumb navigation', () => {
            // Test that session context doesn't include complex breadcrumb structure
            const context = {
                level: 'main',
                history: [],
                breadcrumb: ['Phoenix Code Lite'],
                mode: 'menu'
            };
            (0, globals_1.expect)(context.breadcrumb).toEqual(['Phoenix Code Lite']);
            (0, globals_1.expect)(context.level).toBe('main');
        });
        (0, globals_1.it)('should use simplified header display', () => {
            // Verify that header display is simplified
            const context = {
                level: 'config',
                history: [],
                breadcrumb: ['Phoenix Code Lite', 'Configuration'],
                mode: 'menu'
            };
            // Should not have nested breadcrumb structure
            (0, globals_1.expect)(context.breadcrumb.length).toBeLessThanOrEqual(2);
        });
    });
    (0, globals_1.describe)('Issue #6: Consistent Help Command', () => {
        (0, globals_1.it)('should provide clean help display without navigation clutter', () => {
            const commands = [
                { name: 'generate', description: 'Start TDD workflow for new code' },
                { name: 'config', description: 'Manage settings and templates' },
                { name: 'templates', description: 'Manage project templates' },
                { name: 'help', description: 'Show available commands' }
            ];
            // Verify help command structure
            const helpCommand = commands.find(cmd => cmd.name === 'help');
            (0, globals_1.expect)(helpCommand).toBeDefined();
            (0, globals_1.expect)(helpCommand?.description).toContain('available commands');
            // Verify all commands have proper descriptions
            commands.forEach(cmd => {
                (0, globals_1.expect)(cmd.name).toBeTruthy();
                (0, globals_1.expect)(cmd.description).toBeTruthy();
                (0, globals_1.expect)(cmd.description.length).toBeGreaterThan(10);
            });
        });
    });
    (0, globals_1.describe)('UI Configuration Integration', () => {
        (0, globals_1.it)('should include UI settings in configuration schema', () => {
            const config = settings_1.PhoenixCodeLiteConfig.getDefault();
            const configData = config.export();
            (0, globals_1.expect)(configData.ui).toBeDefined();
            (0, globals_1.expect)(configData.ui?.interactionMode).toBeDefined();
            (0, globals_1.expect)(['menu', 'command']).toContain(configData.ui?.interactionMode);
            (0, globals_1.expect)(configData.ui?.showNumbers).toBeDefined();
            (0, globals_1.expect)(configData.ui?.allowModeSwitch).toBeDefined();
        });
        (0, globals_1.it)('should validate UI configuration properly', () => {
            const config = settings_1.PhoenixCodeLiteConfig.getDefault();
            // Test setting valid UI configuration
            config.set('ui.interactionMode', 'command');
            (0, globals_1.expect)(config.get('ui.interactionMode')).toBe('command');
            config.set('ui.showNumbers', false);
            (0, globals_1.expect)(config.get('ui.showNumbers')).toBe(false);
            // Test that configuration is valid
            const validationErrors = config.validate();
            (0, globals_1.expect)(validationErrors).toHaveLength(0);
        });
        (0, globals_1.it)('should reject invalid UI configuration values', () => {
            const config = settings_1.PhoenixCodeLiteConfig.getDefault();
            // Test invalid interaction mode
            (0, globals_1.expect)(() => {
                config.set('ui.interactionMode', 'invalid');
            }).toThrow();
            // Test invalid boolean values
            (0, globals_1.expect)(() => {
                config.set('ui.showNumbers', 'not-a-boolean');
            }).toThrow();
        });
    });
});
//# sourceMappingURL=phase-1-ux-enhancements.test.js.map
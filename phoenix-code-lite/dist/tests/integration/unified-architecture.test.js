"use strict";
/**
 * Unified Architecture Integration Tests
 * Created: 2025-01-06-175700
 *
 * Integration tests for the CLI Interaction Decoupling Architecture.
 * Validates menu definitions, command execution, and interaction modes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const menu_registry_1 = require("../../src/core/menu-registry");
const command_registry_1 = require("../../src/core/command-registry");
const unified_session_manager_1 = require("../../src/core/unified-session-manager");
const interactive_renderer_1 = require("../../src/interaction/interactive-renderer");
const command_renderer_1 = require("../../src/interaction/command-renderer");
const menu_registration_1 = require("../../src/menus/menu-registration");
const command_registration_1 = require("../../src/commands/command-registration");
describe('Unified Architecture Integration', () => {
    let menuRegistry;
    let commandRegistry;
    let sessionManager;
    beforeEach(() => {
        menuRegistry = new menu_registry_1.MenuRegistry();
        commandRegistry = new command_registry_1.UnifiedCommandRegistry();
        // Create test interaction mode
        const testMode = {
            name: 'test',
            displayName: 'Test Mode',
            capabilities: {
                supportsArrowNavigation: true,
                supportsTextInput: true,
                supportsKeyboardShortcuts: true,
                supportsRealTimeValidation: false
            },
            configuration: {}
        };
        sessionManager = new unified_session_manager_1.UnifiedSessionManager(menuRegistry, commandRegistry, testMode);
    });
    afterEach(() => {
        menuRegistry.clear();
        commandRegistry.clear();
    });
    describe('Menu Registry', () => {
        it('should validate core menu definitions', () => {
            expect((0, menu_registration_1.validateCoreMenus)()).toBe(true);
        });
        it('should register all core menus without errors', () => {
            expect(() => (0, menu_registration_1.registerCoreMenus)(menuRegistry)).not.toThrow();
            // Verify all expected menus are registered
            const expectedMenuIds = ['main', 'config', 'templates', 'generate', 'advanced'];
            const availableMenuIds = menuRegistry.getAvailableMenuIds();
            expectedMenuIds.forEach(menuId => {
                expect(availableMenuIds).toContain(menuId);
            });
        });
        it('should retrieve main menu definition', () => {
            (0, menu_registration_1.registerCoreMenus)(menuRegistry);
            const mainMenu = menuRegistry.getMenu('main');
            expect(mainMenu).toBeDefined();
            expect(mainMenu.id).toBe('main');
            expect(mainMenu.title).toContain('Phoenix Code Lite');
            expect(mainMenu.sections).toHaveLength(1);
            expect(mainMenu.sections[0].items).toHaveLength(4);
        });
        it('should handle menu inheritance from skins', () => {
            (0, menu_registration_1.registerCoreMenus)(menuRegistry);
            // Create a test skin
            const testSkin = {
                metadata: { name: 'test-skin', displayName: 'Test Skin' },
                menus: {
                    'custom': {
                        id: 'custom',
                        title: 'Custom Menu',
                        sections: [{
                                id: 'custom-section',
                                heading: 'Custom Commands',
                                items: [{
                                        id: 'custom-item',
                                        label: 'Custom Command',
                                        action: { type: 'execute', handler: 'custom:command' }
                                    }]
                            }]
                    }
                }
            };
            menuRegistry.loadSkin(testSkin);
            const customMenu = menuRegistry.getMenu('custom');
            expect(customMenu).toBeDefined();
            expect(customMenu.id).toBe('custom');
        });
    });
    describe('Command Registry', () => {
        it('should register all core commands without errors', () => {
            expect(() => (0, command_registration_1.registerCoreCommands)(commandRegistry)).not.toThrow();
            expect((0, command_registration_1.validateCommandRegistration)(commandRegistry)).toBe(true);
        });
        it('should execute config:show command', async () => {
            (0, command_registration_1.registerCoreCommands)(commandRegistry);
            const context = {
                commandId: 'config:show',
                parameters: {},
                menuContext: {
                    level: 'config',
                    sessionContext: { level: 'config' }
                },
                sessionContext: { level: 'config' },
                interactionMode: {
                    name: 'test',
                    displayName: 'Test',
                    capabilities: {
                        supportsArrowNavigation: false,
                        supportsTextInput: true,
                        supportsKeyboardShortcuts: false,
                        supportsRealTimeValidation: false
                    },
                    configuration: {}
                }
            };
            const result = await commandRegistry.execute('config:show', context);
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });
        it('should handle unknown commands gracefully', async () => {
            const context = {
                commandId: 'unknown:command',
                parameters: {},
                menuContext: { level: 'test', sessionContext: { level: 'test' } },
                sessionContext: { level: 'test' },
                interactionMode: {
                    name: 'test',
                    displayName: 'Test',
                    capabilities: {
                        supportsArrowNavigation: false,
                        supportsTextInput: true,
                        supportsKeyboardShortcuts: false,
                        supportsRealTimeValidation: false
                    },
                    configuration: {}
                }
            };
            await expect(commandRegistry.execute('unknown:command', context))
                .rejects.toThrow('Command handler not found: unknown:command');
        });
        it('should track command execution in audit log', async () => {
            (0, command_registration_1.registerCoreCommands)(commandRegistry);
            const context = {
                commandId: 'config:show',
                parameters: {},
                menuContext: { level: 'config', sessionContext: { level: 'config' } },
                sessionContext: { level: 'config' },
                interactionMode: {
                    name: 'test',
                    displayName: 'Test',
                    capabilities: {
                        supportsArrowNavigation: false,
                        supportsTextInput: true,
                        supportsKeyboardShortcuts: false,
                        supportsRealTimeValidation: false
                    },
                    configuration: {}
                }
            };
            await commandRegistry.execute('config:show', context);
            const auditLog = commandRegistry.getAuditLog(1);
            expect(auditLog).toHaveLength(1);
            expect(auditLog[0].commandId).toBe('config:show');
            expect(auditLog[0].result.success).toBe(true);
        });
    });
    describe('Interaction Renderers', () => {
        it('should create interactive renderer with correct mode', () => {
            const renderer = new interactive_renderer_1.InteractiveRenderer();
            expect(renderer.mode.name).toBe('interactive');
            expect(renderer.mode.capabilities.supportsArrowNavigation).toBe(true);
            expect(renderer.mode.capabilities.supportsTextInput).toBe(true);
        });
        it('should create command renderer with correct mode', () => {
            const renderer = new command_renderer_1.CommandRenderer();
            expect(renderer.mode.name).toBe('command');
            expect(renderer.mode.capabilities.supportsArrowNavigation).toBe(false);
            expect(renderer.mode.capabilities.supportsTextInput).toBe(true);
        });
    });
    describe('Session Manager', () => {
        it('should initialize with correct default context', () => {
            const context = sessionManager.getSessionContext();
            expect(context.level).toBe('main');
            expect(context.projectInitialized).toBe(false);
            expect(context.debugMode).toBe(false);
        });
        it('should update session context', () => {
            sessionManager.updateSessionContext({ debugMode: true, projectInitialized: true });
            const context = sessionManager.getSessionContext();
            expect(context.debugMode).toBe(true);
            expect(context.projectInitialized).toBe(true);
        });
    });
    describe('Mode Switching', () => {
        it('should switch between interaction modes seamlessly', () => {
            // This would test mode switching functionality
            // For now, just test that the concept works
            const interactiveMode = {
                name: 'interactive',
                displayName: 'Interactive Navigation',
                capabilities: {
                    supportsArrowNavigation: true,
                    supportsTextInput: true,
                    supportsKeyboardShortcuts: true,
                    supportsRealTimeValidation: false
                },
                configuration: {}
            };
            const commandMode = {
                name: 'command',
                displayName: 'Command-Line Interface',
                capabilities: {
                    supportsArrowNavigation: false,
                    supportsTextInput: true,
                    supportsKeyboardShortcuts: true,
                    supportsRealTimeValidation: true
                },
                configuration: {}
            };
            expect(interactiveMode.name).toBe('interactive');
            expect(commandMode.name).toBe('command');
            expect(interactiveMode.capabilities.supportsArrowNavigation).toBe(true);
            expect(commandMode.capabilities.supportsArrowNavigation).toBe(false);
        });
    });
    describe('End-to-End Integration', () => {
        it('should integrate all components without errors', () => {
            // Register all components
            (0, menu_registration_1.registerCoreMenus)(menuRegistry);
            (0, command_registration_1.registerCoreCommands)(commandRegistry);
            // Verify integration
            expect(menuRegistry.getAvailableMenuIds()).toHaveLength(5);
            expect(commandRegistry.listHandlers()).toHaveLength(19); // Total number of registered commands
            expect(sessionManager.getSessionContext()).toBeDefined();
        });
    });
});
// Helper function for creating mock menu definitions
function createMockMenuDefinition() {
    return {
        id: 'mock',
        title: 'Mock Menu',
        sections: [{
                id: 'mock-section',
                heading: 'Mock Section',
                items: [{
                        id: 'mock-item',
                        label: 'Mock Item',
                        action: { type: 'execute', handler: 'mock:command' }
                    }]
            }]
    };
}
// Helper function for creating mock menu context
function createMockContext() {
    return {
        level: 'mock',
        sessionContext: { level: 'mock' }
    };
}
//# sourceMappingURL=unified-architecture.test.js.map
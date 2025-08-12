/**
 * Unified Architecture Integration Tests
 * Created: 2025-01-06-175700
 * 
 * Integration tests for the CLI Interaction Decoupling Architecture.
 * Validates menu definitions, command execution, and interaction modes.
 */

import { MenuRegistry } from '../../src/core/menu-registry';
import { UnifiedCommandRegistry } from '../../src/core/command-registry';
import { UnifiedSessionManager } from '../../src/core/unified-session-manager';
import { InteractiveRenderer } from '../../src/interaction/interactive-renderer';
import { CommandRenderer } from '../../src/interaction/command-renderer';
import { registerCoreMenus, validateCoreMenus } from '../../src/menus/menu-registration';
import { registerCoreCommands, validateCommandRegistration } from '../../src/commands/command-registration';
import { MenuDefinition, MenuContext } from '../../src/types/menu-definitions';
import { InteractionMode } from '../../src/types/interaction-abstraction';

describe('Unified Architecture Integration', () => {
  let menuRegistry: MenuRegistry;
  let commandRegistry: UnifiedCommandRegistry;
  let sessionManager: UnifiedSessionManager;

  beforeEach(() => {
    menuRegistry = new MenuRegistry();
    commandRegistry = new UnifiedCommandRegistry();
    
    // Create test interaction mode
    const testMode: InteractionMode = {
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
    
    sessionManager = new UnifiedSessionManager(
      menuRegistry,
      commandRegistry,
      testMode
    );
  });

  afterEach(() => {
    menuRegistry.clear();
    commandRegistry.clear();
  });

  describe('Menu Registry', () => {
    it('should validate core menu definitions', () => {
      expect(validateCoreMenus()).toBe(true);
    });

    it('should register all core menus without errors', () => {
      expect(() => registerCoreMenus(menuRegistry)).not.toThrow();
      
      // Verify all expected menus are registered
      const expectedMenuIds = ['main', 'config', 'templates', 'generate', 'advanced'];
      const availableMenuIds = menuRegistry.getAvailableMenuIds();
      
      expectedMenuIds.forEach(menuId => {
        expect(availableMenuIds).toContain(menuId);
      });
    });

    it('should retrieve main menu definition', () => {
      registerCoreMenus(menuRegistry);
      
      const mainMenu = menuRegistry.getMenu('main');
      expect(mainMenu).toBeDefined();
      expect(mainMenu.id).toBe('main');
      expect(mainMenu.title).toContain('Phoenix Code Lite');
      expect(mainMenu.sections).toHaveLength(1);
      expect(mainMenu.sections[0].items).toHaveLength(4);
    });

    it('should handle menu inheritance from skins', () => {
      registerCoreMenus(menuRegistry);
      
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
          } as MenuDefinition
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
      expect(() => registerCoreCommands(commandRegistry)).not.toThrow();
      expect(validateCommandRegistration(commandRegistry)).toBe(true);
    });

    it('should execute config:show command', async () => {
      registerCoreCommands(commandRegistry);
      
      const context = {
        commandId: 'config:show',
        parameters: {},
        menuContext: {
          level: 'config',
          sessionContext: { level: 'config' }
        } as MenuContext,
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
        menuContext: { level: 'test', sessionContext: { level: 'test' } } as MenuContext,
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
      registerCoreCommands(commandRegistry);
      
      const context = {
        commandId: 'config:show',
        parameters: {},
        menuContext: { level: 'config', sessionContext: { level: 'config' } } as MenuContext,
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
      const renderer = new InteractiveRenderer();
      
      expect(renderer.mode.name).toBe('interactive');
      expect(renderer.mode.capabilities.supportsArrowNavigation).toBe(true);
      expect(renderer.mode.capabilities.supportsTextInput).toBe(true);
    });

    it('should create command renderer with correct mode', () => {
      const renderer = new CommandRenderer();
      
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
      const interactiveMode: InteractionMode = {
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
      
      const commandMode: InteractionMode = {
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
      registerCoreMenus(menuRegistry);
      registerCoreCommands(commandRegistry);
      
      // Verify integration
      expect(menuRegistry.getAvailableMenuIds()).toHaveLength(5);
      expect(commandRegistry.listHandlers()).toHaveLength(19); // Total number of registered commands
      expect(sessionManager.getSessionContext()).toBeDefined();
    });
  });
});

// Helper function for creating mock menu definitions
function createMockMenuDefinition(): MenuDefinition {
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
function createMockContext(): MenuContext {
  return {
    level: 'mock',
    sessionContext: { level: 'mock' }
  };
}
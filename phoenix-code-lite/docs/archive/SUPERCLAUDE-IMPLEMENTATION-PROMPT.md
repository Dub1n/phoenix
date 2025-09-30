<!--
title: [SuperClaude Implementation Prompt - Documentation]
tags: [Documentation, Prompt, Implementation, Architecture, CLI, Decoupling]
provides: [Step-by-Step Implementation Guide, Architecture Layers]
requires: [docs/CLI-INTERACTION-DECOUPLING-ARCHITECTURE.md]
description: [Execution prompt guiding implementation of the decoupled CLI architecture]
-->

# SuperClaude Implementation Prompt: CLI Interaction Decoupling Architecture

## Context and Reference

**Primary Reference**: `phoenix-code-lite/docs/CLI-INTERACTION-DECOUPLING-ARCHITECTURE.md`

This prompt implements the comprehensive architectural refactoring outlined in the reference document to decouple Phoenix Code Lite's interaction modes from menu content definitions. Follow the exact specifications, interfaces, and migration strategy detailed in the reference document.

## Core Implementation Principle

**Separation of Concerns**: Menu structure/content must be completely independent of how users interact with it. This is the fundamental architectural principle that drives all implementation decisions.

## Implementation Architecture Overview

The new architecture consists of four distinct layers:

```
┌─────────────────────────────────────────────────────────┐
│                     USER INTERACTION                   │
├─────────────────────────────────────────────────────────┤
│  Interactive Mode    │  Command Mode   │  Future Modes  │
│  (Arrow Navigation)  │  (Text Input)   │  (Voice, etc.) │
├─────────────────────────────────────────────────────────┤
│              INTERACTION ABSTRACTION LAYER             │
├─────────────────────────────────────────────────────────┤
│                   MENU DEFINITION LAYER                │
│         (Data structures describing menus/commands)    │
├─────────────────────────────────────────────────────────┤
│                   COMMAND EXECUTION LAYER              │
│              (Business logic implementation)           │
├─────────────────────────────────────────────────────────┤
│                      SKINS SYSTEM                      │
│            (Menu/command definitions per domain)       │
└─────────────────────────────────────────────────────────┘
```

## Phase 1: Core Interface Definitions

### Step 1.1: Menu Definition Interfaces

Create the following TypeScript interfaces in `src/types/menu-definitions.ts`:

```typescript
interface MenuDefinition {
  id: string;
  title: string;
  description?: string;
  sections: MenuSection[];
  context?: MenuContext;
  metadata?: MenuMetadata;
}

interface MenuSection {
  id: string;
  heading: string;
  items: MenuItem[];
  theme?: SectionTheme;
}

interface MenuItem {
  id: string;
  label: string;
  description?: string;
  action: MenuAction;
  enabled?: boolean | ((context: MenuContext) => boolean);
  visible?: boolean | ((context: MenuContext) => boolean);
  shortcuts?: string[]; // ['1', 'config', 'c']
  validation?: ValidationSchema;
}

interface MenuAction {
  type: 'navigate' | 'execute' | 'exit' | 'back';
  target?: string;
  handler?: string; // Reference to command handler
  data?: any;
  confirmation?: ConfirmationConfig;
}

interface MenuContext {
  level: string;
  sessionContext: SessionContext;
  parameters?: any;
}

interface MenuMetadata {
  contextLevel: string;
  allowBack: boolean;
  defaultAction?: string;
}
```

### Step 1.2: Interaction Abstraction Interfaces

Create `src/types/interaction-abstraction.ts`:

```typescript
interface InteractionRenderer {
  readonly mode: InteractionMode;
  renderMenu(definition: MenuDefinition, context: MenuContext): Promise<void>;
  handleInput(definition: MenuDefinition, context: MenuContext): Promise<InteractionResult>;
  dispose(): void;
}

interface InteractionResult {
  action: MenuAction;
  selectedItem?: MenuItem;
  inputValue?: string;
  success: boolean;
  message?: string;
}

interface InteractionMode {
  name: string;
  displayName: string;
  capabilities: ModeCapabilities;
  configuration: ModeConfiguration;
}

interface ModeCapabilities {
  supportsArrowNavigation: boolean;
  supportsTextInput: boolean;
  supportsKeyboardShortcuts: boolean;
  supportsRealTimeValidation: boolean;
}

interface ModeConfiguration {
  inputTimeout?: number;
  validationRules?: ValidationRule[];
  displayOptions?: DisplayOptions;
}
```

### Step 1.3: Command Execution Interfaces

Create `src/types/command-execution.ts`:

```typescript
interface CommandHandler {
  id: string;
  handler: (context: CommandContext) => Promise<CommandResult>;
  validation?: ValidationSchema;
  permissions?: PermissionRequirement[];
}

interface CommandContext {
  commandId: string;
  parameters: any;
  menuContext: MenuContext;
  sessionContext: SessionContext;
  interactionMode: InteractionMode;
}

interface CommandResult {
  success: boolean;
  data?: any;
  message?: string;
  shouldExit?: boolean;
  shouldNavigate?: boolean;
  navigationTarget?: string;
}

interface CommandRegistry {
  register(handler: CommandHandler): void;
  execute(commandId: string, context: CommandContext): Promise<CommandResult>;
  getHandler(commandId: string): CommandHandler | null;
  listHandlers(): CommandHandler[];
}
```

## Phase 2: Core Implementation Classes

### Step 2.1: Menu Registry Implementation

Create `src/core/menu-registry.ts`:

```typescript
class MenuRegistry {
  private menus = new Map<string, MenuDefinition>();
  private skins = new Map<string, LoadedSkin>();
  private activeSkinsIds: string[] = [];

  registerMenu(menu: MenuDefinition): void {
    this.menus.set(menu.id, menu);
  }

  getMenu(menuId: string): MenuDefinition {
    // Check active skins in priority order
    for (const skinId of this.activeSkinsIds) {
      const skin = this.skins.get(skinId);
      const menu = skin?.menus[menuId];
      if (menu) {
        return this.resolveMenuInheritance(menu, skin);
      }
    }
    
    // Fallback to core menus
    const coreMenu = this.menus.get(menuId);
    if (!coreMenu) {
      throw new Error(`Menu not found: ${menuId}`);
    }
    return coreMenu;
  }

  loadSkin(skin: LoadedSkin): void {
    this.skins.set(skin.metadata.name, skin);
    this.activeSkinsIds.push(skin.metadata.name);
  }

  private resolveMenuInheritance(menu: MenuDefinition, skin: LoadedSkin): MenuDefinition {
    // Implement menu inheritance logic
    return menu;
  }
}
```

### Step 2.2: Command Registry Implementation

Create `src/core/command-registry.ts`:

```typescript
class UnifiedCommandRegistry implements CommandRegistry {
  private handlers = new Map<string, CommandHandler>();

  register(handler: CommandHandler): void {
    this.handlers.set(handler.id, handler);
  }

  async execute(commandId: string, context: CommandContext): Promise<CommandResult> {
    const handler = this.handlers.get(commandId);
    if (!handler) {
      throw new Error(`Command handler not found: ${commandId}`);
    }

    // Validate permissions and input
    await this.validateCommand(handler, context);
    
    // Execute with error handling and audit logging
    return await this.executeWithLogging(handler, context);
  }

  getHandler(commandId: string): CommandHandler | null {
    return this.handlers.get(commandId) || null;
  }

  listHandlers(): CommandHandler[] {
    return Array.from(this.handlers.values());
  }

  private async validateCommand(handler: CommandHandler, context: CommandContext): Promise<void> {
    // Implement validation logic
  }

  private async executeWithLogging(handler: CommandHandler, context: CommandContext): Promise<CommandResult> {
    // Implement execution with logging
    return await handler.handler(context);
  }
}
```

### Step 2.3: Interaction Renderer Implementations

Create `src/interaction/interactive-renderer.ts`:

```typescript
class InteractiveRenderer implements InteractionRenderer {
  readonly mode = {
    name: 'interactive',
    displayName: 'Interactive Navigation',
    capabilities: {
      supportsArrowNavigation: true,
      supportsTextInput: true,
      supportsKeyboardShortcuts: true,
      supportsRealTimeValidation: false
    },
    configuration: {
      inputTimeout: 30000,
      displayOptions: {
        showNumbers: true,
        showShortcuts: true
      }
    }
  };

  async renderMenu(definition: MenuDefinition, context: MenuContext): Promise<void> {
    // Convert MenuDefinition to Interactive UI
    const menuContent = this.convertToMenuContent(definition, context);
    await this.renderLegacyWithUnified(menuContent, context);
  }

  async handleInput(definition: MenuDefinition, context: MenuContext): Promise<InteractionResult> {
    // Handle numbered selection, arrow keys, shortcuts
    const input = await this.getInput();
    const selectedItem = this.findItemByInput(input, definition);
    
    if (selectedItem) {
      return {
        action: selectedItem.action,
        selectedItem,
        success: true
      };
    }
    
    return this.handleGlobalCommands(input, definition, context);
  }

  dispose(): void {
    // Cleanup resources
  }

  private convertToMenuContent(definition: MenuDefinition, context: MenuContext): any {
    // Convert MenuDefinition to legacy menu content format
    // This maintains backward compatibility during migration
  }

  private async renderLegacyWithUnified(menuContent: any, context: MenuContext): Promise<void> {
    // Use existing skin-menu-renderer but with data-driven approach
  }

  private findItemByInput(input: string, definition: MenuDefinition): MenuItem | null {
    // Find menu item by input (number, shortcut, etc.)
  }

  private async handleGlobalCommands(input: string, definition: MenuDefinition, context: MenuContext): Promise<InteractionResult> {
    // Handle global commands like 'help', 'exit', etc.
  }
}
```

Create `src/interaction/command-renderer.ts`:

```typescript
class CommandRenderer implements InteractionRenderer {
  readonly mode = {
    name: 'command',
    displayName: 'Command-Line Interface',
    capabilities: {
      supportsArrowNavigation: false,
      supportsTextInput: true,
      supportsKeyboardShortcuts: true,
      supportsRealTimeValidation: true
    },
    configuration: {
      inputTimeout: 60000,
      validationRules: [
        { type: 'command', pattern: /^[a-zA-Z0-9\s\-_]+$/ }
      ]
    }
  };

  async renderMenu(definition: MenuDefinition, context: MenuContext): Promise<void> {
    // Convert MenuDefinition to command-line format
    console.log(chalk.blue.bold(definition.title));
    console.log('Available commands:');
    
    definition.sections.forEach(section => {
      console.log(chalk.yellow(`\n${section.heading}:`));
      section.items.forEach(item => {
        const shortcuts = item.shortcuts?.join(', ') || item.id;
        console.log(`  ${shortcuts.padEnd(15)} - ${item.description || item.label}`);
      });
    });
  }

  async handleInput(definition: MenuDefinition, context: MenuContext): Promise<InteractionResult> {
    // Handle text commands and shortcuts
    const input = await this.getCommandInput();
    const selectedItem = this.findItemByCommand(input, definition);
    
    return selectedItem ? 
      { action: selectedItem.action, selectedItem, success: true } :
      this.handleCommandError(input, definition);
  }

  dispose(): void {
    // Cleanup resources
  }

  private async getCommandInput(): Promise<string> {
    // Get command input with validation
  }

  private findItemByCommand(input: string, definition: MenuDefinition): MenuItem | null {
    // Find menu item by command input
  }

  private handleCommandError(input: string, definition: MenuDefinition): InteractionResult {
    // Handle invalid command input
  }
}
```

## Phase 3: Unified Session Manager

### Step 3.1: Create Unified Session Manager

Create `src/core/unified-session-manager.ts`:

```typescript
class UnifiedSessionManager {
  private menuRegistry: MenuRegistry;
  private commandRegistry: CommandRegistry;
  private currentRenderer: InteractionRenderer;
  private sessionContext: SessionContext;

  constructor(
    menuRegistry: MenuRegistry,
    commandRegistry: CommandRegistry,
    initialMode: InteractionMode
  ) {
    this.menuRegistry = menuRegistry;
    this.commandRegistry = commandRegistry;
    this.currentRenderer = this.createRenderer(initialMode);
  }

  async displayMenu(menuId: string): Promise<void> {
    const menuDefinition = this.menuRegistry.getMenu(menuId);
    const menuContext = this.createMenuContext(menuDefinition);
    
    await this.currentRenderer.renderMenu(menuDefinition, menuContext);
    
    // Unified input handling loop
    while (true) {
      const result = await this.currentRenderer.handleInput(menuDefinition, menuContext);
      
      if (result.success) {
        const commandResult = await this.executeAction(result.action, menuContext);
        if (commandResult.shouldExit || commandResult.shouldNavigate) {
          break;
        }
      }
    }
  }

  async executeAction(action: MenuAction, context: MenuContext): Promise<CommandResult> {
    switch (action.type) {
      case 'navigate':
        return this.navigateToMenu(action.target!, context);
      case 'execute':
        return this.executeCommand(action.handler!, action.data, context);
      case 'back':
        return this.navigateBack(context);
      case 'exit':
        return this.exitSession();
    }
  }

  async switchInteractionMode(newMode: InteractionMode): Promise<void> {
    // Seamlessly switch between interaction modes
    await this.currentRenderer.dispose();
    this.currentRenderer = this.createRenderer(newMode);
    
    // Re-render current menu in new mode
    await this.displayCurrentMenu();
  }

  private createRenderer(mode: InteractionMode): InteractionRenderer {
    switch (mode.name) {
      case 'interactive':
        return new InteractiveRenderer();
      case 'command':
        return new CommandRenderer();
      default:
        throw new Error(`Unsupported interaction mode: ${mode.name}`);
    }
  }

  private createMenuContext(menuDefinition: MenuDefinition): MenuContext {
    return {
      level: menuDefinition.metadata?.contextLevel || 'main',
      sessionContext: this.sessionContext,
      parameters: {}
    };
  }

  private async navigateToMenu(target: string, context: MenuContext): Promise<CommandResult> {
    await this.displayMenu(target);
    return { success: true, shouldNavigate: true, navigationTarget: target };
  }

  private async executeCommand(handlerId: string, data: any, context: MenuContext): Promise<CommandResult> {
    const commandContext: CommandContext = {
      commandId: handlerId,
      parameters: data,
      menuContext: context,
      sessionContext: this.sessionContext,
      interactionMode: this.currentRenderer.mode
    };
    
    return await this.commandRegistry.execute(handlerId, commandContext);
  }

  private async navigateBack(context: MenuContext): Promise<CommandResult> {
    // Implement back navigation logic
    return { success: true, shouldNavigate: true };
  }

  private async exitSession(): Promise<CommandResult> {
    return { success: true, shouldExit: true };
  }
}
```

## Phase 4: Menu Definition Migration

### Step 4.1: Create Core Menu Definitions

Create `src/menus/core-menus.ts`:

```typescript
export const MainMenuDefinition: MenuDefinition = {
  id: 'main',
  title: '* Phoenix Code Lite • TDD Workflow Orchestrator',
  sections: [{
    id: 'navigation',
    heading: 'Main Navigation',
    items: [
      {
        id: 'config',
        label: 'Configuration',
        description: 'Manage project settings and preferences',
        action: { type: 'navigate', target: 'config' },
        shortcuts: ['1', 'config', 'configuration']
      },
      {
        id: 'templates',
        label: 'Templates', 
        description: 'Starter, Enterprise, Performance configurations',
        action: { type: 'navigate', target: 'templates' },
        shortcuts: ['2', 'templates', 'template']
      },
      {
        id: 'generate',
        label: 'Generate',
        description: 'AI-powered TDD code generation',
        action: { type: 'execute', handler: 'tdd:generate' },
        shortcuts: ['3', 'generate', 'gen'],
        enabled: (context) => context.sessionContext.projectInitialized
      },
      {
        id: 'advanced',
        label: 'Advanced',
        description: 'Advanced features and debugging',
        action: { type: 'navigate', target: 'advanced' },
        shortcuts: ['4', 'advanced', 'adv']
      }
    ]
  }],
  metadata: {
    contextLevel: 'main',
    allowBack: false,
    defaultAction: 'config'
  }
};

export const ConfigMenuDefinition: MenuDefinition = {
  id: 'config',
  title: 'Configuration Management',
  sections: [{
    id: 'settings',
    heading: 'Settings',
    items: [
      {
        id: 'show-config',
        label: 'Show Current Configuration',
        description: 'Display current project settings',
        action: { type: 'execute', handler: 'config:show' },
        shortcuts: ['1', 'show', 'display']
      },
      {
        id: 'edit-config',
        label: 'Edit Configuration',
        description: 'Modify project settings',
        action: { type: 'execute', handler: 'config:edit' },
        shortcuts: ['2', 'edit', 'modify']
      },
      {
        id: 'reset-config',
        label: 'Reset to Defaults',
        description: 'Reset configuration to default values',
        action: { type: 'execute', handler: 'config:reset' },
        shortcuts: ['3', 'reset', 'default']
      }
    ]
  }],
  metadata: {
    contextLevel: 'config',
    allowBack: true
  }
};
```

### Step 4.2: Register Core Menus

Create `src/menus/menu-registration.ts`:

```typescript
import { MenuRegistry } from '../core/menu-registry';
import { MainMenuDefinition, ConfigMenuDefinition } from './core-menus';

export function registerCoreMenus(menuRegistry: MenuRegistry): void {
  menuRegistry.registerMenu(MainMenuDefinition);
  menuRegistry.registerMenu(ConfigMenuDefinition);
  // Register other core menus...
}
```

## Phase 5: Command Handler Migration

### Step 5.1: Extract Command Handlers

Create `src/commands/core-commands.ts`:

```typescript
import { CommandHandler, CommandContext, CommandResult } from '../types/command-execution';

export const TDDGenerateCommand: CommandHandler = {
  id: 'tdd:generate',
  handler: async (context: CommandContext): Promise<CommandResult> => {
    try {
      // Extract existing TDD generation logic from current implementation
      const result = await executeTDDGeneration(context.parameters);
      return {
        success: true,
        data: result,
        message: 'TDD generation completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `TDD generation failed: ${error.message}`
      };
    }
  },
  validation: {
    projectPath: { type: 'string', required: true },
    template: { type: 'string', required: false }
  }
};

export const ConfigShowCommand: CommandHandler = {
  id: 'config:show',
  handler: async (context: CommandContext): Promise<CommandResult> => {
    try {
      const config = await loadCurrentConfiguration();
      return {
        success: true,
        data: config,
        message: 'Configuration loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to load configuration: ${error.message}`
      };
    }
  }
};

export const ConfigEditCommand: CommandHandler = {
  id: 'config:edit',
  handler: async (context: CommandContext): Promise<CommandResult> => {
    try {
      const result = await editConfiguration(context.parameters);
      return {
        success: true,
        data: result,
        message: 'Configuration updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Configuration update failed: ${error.message}`
      };
    }
  }
};
```

### Step 5.2: Register Command Handlers

Create `src/commands/command-registration.ts`:

```typescript
import { CommandRegistry } from '../core/command-registry';
import { TDDGenerateCommand, ConfigShowCommand, ConfigEditCommand } from './core-commands';

export function registerCoreCommands(commandRegistry: CommandRegistry): void {
  commandRegistry.register(TDDGenerateCommand);
  commandRegistry.register(ConfigShowCommand);
  commandRegistry.register(ConfigEditCommand);
  // Register other core commands...
}
```

## Phase 6: Integration and Testing

### Step 6.1: Update Main Entry Point

Update `src/index.ts` to use the new architecture:

```typescript
import { MenuRegistry } from './core/menu-registry';
import { UnifiedCommandRegistry } from './core/command-registry';
import { UnifiedSessionManager } from './core/unified-session-manager';
import { registerCoreMenus } from './menus/menu-registration';
import { registerCoreCommands } from './commands/command-registration';

export async function initializePhoenixCodeLite(): Promise<void> {
  // Initialize core components
  const menuRegistry = new MenuRegistry();
  const commandRegistry = new UnifiedCommandRegistry();
  
  // Register core menus and commands
  registerCoreMenus(menuRegistry);
  registerCoreCommands(commandRegistry);
  
  // Create session manager with default interactive mode
  const sessionManager = new UnifiedSessionManager(
    menuRegistry,
    commandRegistry,
    {
      name: 'interactive',
      displayName: 'Interactive Navigation',
      capabilities: {
        supportsArrowNavigation: true,
        supportsTextInput: true,
        supportsKeyboardShortcuts: true,
        supportsRealTimeValidation: false
      },
      configuration: {}
    }
  );
  
  // Start with main menu
  await sessionManager.displayMenu('main');
}
```

### Step 6.2: Create Test Suite

Create `tests/integration/unified-architecture.test.ts`:

```typescript
import { MenuRegistry } from '../../src/core/menu-registry';
import { UnifiedCommandRegistry } from '../../src/core/command-registry';
import { UnifiedSessionManager } from '../../src/core/unified-session-manager';
import { InteractiveRenderer } from '../../src/interaction/interactive-renderer';
import { CommandRenderer } from '../../src/interaction/command-renderer';

describe('Unified Architecture Integration', () => {
  let menuRegistry: MenuRegistry;
  let commandRegistry: UnifiedCommandRegistry;
  let sessionManager: UnifiedSessionManager;

  beforeEach(() => {
    menuRegistry = new MenuRegistry();
    commandRegistry = new UnifiedCommandRegistry();
    sessionManager = new UnifiedSessionManager(
      menuRegistry,
      commandRegistry,
      { name: 'interactive', displayName: 'Test', capabilities: {}, configuration: {} }
    );
  });

  describe('Menu Definitions', () => {
    it('should validate main menu structure', () => {
      const menu = menuRegistry.getMenu('main');
      expect(menu.sections).toHaveLength(1);
      expect(menu.sections[0].items).toHaveLength(4);
    });
  });

  describe('Interaction Modes', () => {
    it('should render menu in interactive mode', async () => {
      const renderer = new InteractiveRenderer();
      const mockMenu = createMockMenuDefinition();
      await renderer.renderMenu(mockMenu, mockContext);
      // Verify rendering output
    });

    it('should render menu in command mode', async () => {
      const renderer = new CommandRenderer();
      const mockMenu = createMockMenuDefinition();
      await renderer.renderMenu(mockMenu, mockContext);
      // Verify command-line output
    });
  });

  describe('Command Execution', () => {
    it('should execute config:show command', async () => {
      const result = await commandRegistry.execute('config:show', mockContext);
      expect(result.success).toBe(true);
    });
  });

  describe('Mode Switching', () => {
    it('should switch between interaction modes seamlessly', async () => {
      // Test mode switching functionality
    });
  });
});
```

## Implementation Guidelines

### Backward Compatibility

1. **Maintain Existing APIs**: Keep existing public APIs functional during migration
2. **Gradual Migration**: Migrate one menu at a time, not all at once
3. **Legacy Support**: Support both old and new menu systems during transition
4. **Feature Parity**: Ensure all existing functionality works in new architecture

### Error Handling

1. **Graceful Degradation**: Fall back to core functionality when skin menus fail
2. **User-Friendly Errors**: Provide clear error messages for missing commands
3. **Validation**: Validate menu definitions and command handlers at load time
4. **Logging**: Implement comprehensive logging for debugging

### Performance Considerations

1. **Menu Caching**: Cache parsed menu definitions to avoid repeated parsing
2. **Lazy Loading**: Load command handlers only when needed
3. **Renderer Reuse**: Reuse renderer instances across menu displays
4. **Context Sharing**: Efficient context passing between layers

### Testing Strategy

1. **Unit Tests**: Test each layer independently
2. **Integration Tests**: Test complete workflows
3. **Mode Testing**: Test all interaction modes with all menus
4. **Performance Tests**: Ensure no performance degradation
5. **Backward Compatibility Tests**: Verify existing functionality still works

## Migration Checklist

- [ ] Define all TypeScript interfaces
- [ ] Implement MenuRegistry and CommandRegistry
- [ ] Create InteractiveRenderer and CommandRenderer
- [ ] Implement UnifiedSessionManager
- [ ] Create core menu definitions
- [ ] Extract and register command handlers
- [ ] Update main entry point
- [ ] Create comprehensive test suite
- [ ] Test mode switching functionality
- [ ] Verify backward compatibility
- [ ] Performance testing and optimization
- [ ] Documentation updates

## Success Criteria

1. **Separation Achieved**: Menu definitions completely independent of interaction modes
2. **Mode Switching**: Seamless switching between interactive and command modes
3. **Feature Parity**: All existing functionality preserved
4. **Performance**: No performance degradation compared to current implementation
5. **Testability**: All components can be tested independently
6. **Extensibility**: Easy to add new interaction modes or menu definitions
7. **Skins Ready**: Architecture prepared for Skins system integration

Follow this implementation guide step by step, referencing the original `CLI-INTERACTION-DECOUPLING-ARCHITECTURE.md` document for detailed specifications and examples. Maintain the separation of concerns principle throughout the implementation process. 

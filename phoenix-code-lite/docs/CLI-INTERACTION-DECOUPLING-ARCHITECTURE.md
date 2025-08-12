# CLI Interaction Mode Decoupling Architecture

*Created: 2025-01-06-120000*

## Executive Summary

This document proposes a comprehensive architectural refactoring to decouple Phoenix Code Lite's **interaction modes** (Interactive/arrow-keys vs Command-based) from **menu content definitions**. The current tightly coupled system requires duplicate menu definitions and scattered command processing logic. The proposed architecture creates a unified, data-driven system that supports both interaction modes while preparing for Skins infrastructure integration.

## Current Architecture Problems

### Problem 1: Menu Definition Duplication

**Current State**: Each interaction mode requires separate menu definitions

```typescript
// Menu Mode (InteractionManager.ts)
async displayMenuMode(options: MenuOption[], title: string): Promise<InputResult> {
  // Hard-coded menu rendering for arrow-key navigation
}

// Command Mode (InteractionManager.ts)  
async displayCommandMode(commands: CommandInfo[], title: string): Promise<InputResult> {
  // Separate rendering logic for the same underlying functionality
}

// Yet Another Definition (MenuSystem.ts)
private showMainMenu(): void {
  // Third definition of the same menu structure
}
```

**Impact**: 
- Inconsistent menu structures across modes
- Maintenance burden when adding/changing options
- Risk of feature divergence between modes

### Problem 2: Scattered Command Processing

**Current State**: Command processing logic scattered across mode-specific methods

```typescript
// menu-system.ts
private processMainCommands(cmd: string): MenuAction | null { /* hardcoded switch */ }
private processConfigCommands(cmd: string, context: SessionContext): MenuAction | null { /* hardcoded switch */ }
private processTemplateCommands(cmd: string, context: SessionContext): MenuAction | null { /* hardcoded switch */ }
private processGenerateCommands(cmd: string, context: SessionContext): MenuAction | null { /* hardcoded switch */ }
private processAdvancedCommands(cmd: string, context: SessionContext): MenuAction | null { /* hardcoded switch */ }
```

**Impact**:
- Business logic mixed with UI concerns
- Difficult to add new commands or contexts
- Inconsistent command handling patterns

### Problem 3: Mode-Context Coupling

**Current State**: Interaction logic tightly coupled to context levels

```typescript
// session.ts
switch (context.level) {
  case 'main': return this.processMainCommands(cmd);
  case 'config': return this.processConfigCommands(cmd, context);  
  case 'templates': return this.processTemplateCommands(cmd, context);
  // etc...
}
```

**Impact**:
- Cannot easily test menu logic independent of interaction modes
- Difficult to extend with new contexts or modes
- Hard to maintain consistency across different interaction paths

## Proposed Decoupled Architecture

### Core Architectural Principle

**Separation of Concerns**: Menu structure/content should be completely independent of how users interact with it.

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

### 1. Menu Definition Layer

**Purpose**: Define menu structure and commands once, consumed by all interaction modes

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
```

**Example Menu Definition**:

```typescript
const MainMenuDefinition: MenuDefinition = {
  id: 'main',
  title: '🔥 Phoenix Code Lite • TDD Workflow Orchestrator',
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
        enabled: (context) => context.projectInitialized
      }
    ]
  }],
  metadata: {
    contextLevel: 'main',
    allowBack: false,
    defaultAction: 'config'
  }
};
```

### 2. Interaction Abstraction Layer

**Purpose**: Abstract interaction patterns so any mode can consume menu definitions

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
```

**Concrete Implementations**:

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
    }
  };

  async renderMenu(definition: MenuDefinition, context: MenuContext): Promise<void> {
    // Convert MenuDefinition to Interactive UI
    // Use existing skin-menu-renderer but with data-driven approach
    const menuContent = this.convertToMenuContent(definition, context);
    renderLegacyWithUnified(menuContent, context);
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
}

class CommandRenderer implements InteractionRenderer {
  readonly mode = {
    name: 'command',
    displayName: 'Command-Line Interface',
    capabilities: {
      supportsArrowNavigation: false,
      supportsTextInput: true,
      supportsKeyboardShortcuts: true,
      supportsRealTimeValidation: true
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
}
```

### 3. Command Execution Layer

**Purpose**: Unified command execution independent of how command was triggered

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

interface CommandRegistry {
  register(handler: CommandHandler): void;
  execute(commandId: string, context: CommandContext): Promise<CommandResult>;
  getHandler(commandId: string): CommandHandler | null;
  listHandlers(): CommandHandler[];
}

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
}
```

### 4. Unified Session Manager

**Purpose**: Coordinate menu definitions, interaction modes, and command execution

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
}
```

## Integration with Skins Infrastructure

### Skins as Menu Definition Providers

The Skins system can now provide menu definitions instead of complete UI implementations:

```json
{
  "skinMetadata": {
    "name": "qms-medical-device",
    "displayName": "QMS Medical Device Compliance"
  },
  "menus": {
    "main": {
      "id": "qms-main",
      "title": "🏥 QMS Compliance Assistant",
      "sections": [{
        "id": "document-processing",
        "heading": "Document Processing",
        "items": [
          {
            "id": "process-pdf",
            "label": "□ Process PDF Documents",
            "description": "Convert regulatory PDFs to structured format",
            "action": { "type": "execute", "handler": "qms:process-document" },
            "shortcuts": ["1", "pdf", "process"]
          },
          {
            "id": "trace-requirements", 
            "label": "⎄ Requirements Traceability",
            "description": "Generate traceability matrix",
            "action": { "type": "navigate", "target": "requirements" },
            "shortcuts": ["2", "trace", "req"]
          }
        ]
      }]
    }
  },
  "commands": {
    "qms:process-document": {
      "handler": "qms/document-processor",
      "validation": {
        "inputPath": { "type": "file", "required": true, "extensions": [".pdf"] }
      }
    }
  }
}
```

### Skin-Aware Menu Registry

```typescript
class SkinAwareMenuRegistry implements MenuRegistry {
  private skins = new Map<string, LoadedSkin>();
  private activeSkinsIds: string[] = [];

  loadSkin(skin: LoadedSkin): void {
    this.skins.set(skin.metadata.name, skin);
    this.activeSkinsIds.push(skin.metadata.name);
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
    return this.getCoreMenu(menuId);
  }
}
```

## Migration Strategy

### Phase 1: Create Abstraction Layer (Week 1-2)

1. **Define Interfaces**: Create all TypeScript interfaces for the new architecture
2. **Create Menu Registry**: Implement basic menu definition loading
3. **Basic Command Registry**: Simple command registration and execution

### Phase 2: Implement Renderers (Week 2-3)

1. **Interactive Renderer**: Convert existing interactive mode to use menu definitions
2. **Command Renderer**: Convert existing command mode to use menu definitions  
3. **Unified Input Handling**: Common input processing patterns

### Phase 3: Menu Definition Migration (Week 3-4)

1. **Convert Main Menu**: Create MenuDefinition for main menu
2. **Convert Config Menu**: Migrate configuration menu structure
3. **Convert Other Menus**: Templates, Generate, Advanced menus
4. **Test Mode Switching**: Ensure seamless switching between modes

### Phase 4: Command Handler Migration (Week 4-5)

1. **Extract Command Logic**: Move command processing from menu-system.ts to dedicated handlers
2. **Unified Command Context**: Ensure consistent context passing
3. **Error Handling**: Consistent error handling across all commands

### Phase 5: Integration & Testing (Week 5-6)

1. **Integration Testing**: Test all combinations of menus, modes, and commands
2. **Performance Testing**: Ensure no performance degradation
3. **Backward Compatibility**: Ensure existing workflows still function

## Benefits

### For Developers

1. **Single Source of Truth**: Menu structure defined once, consumed by all modes
2. **Easy Testing**: Menu logic can be tested independently of interaction modes
3. **Clean Separation**: UI concerns separated from business logic
4. **Extensibility**: New interaction modes can be added without changing menu definitions

### For Users

1. **Consistent Experience**: Same functionality available regardless of interaction mode
2. **Mode Switching**: Seamlessly switch between interaction preferences
3. **Predictable Behavior**: Commands work the same way across all modes

### For Skins System

1. **Data-Driven Customization**: Skins provide menu definitions, not UI implementations  
2. **Mode Independence**: Skins work with any interaction mode
3. **Simplified Development**: Skin developers focus on menu structure, not rendering logic

## Implementation Notes

### Testing Strategy

```typescript
// Menu definitions can be tested independently
describe('Menu Definitions', () => {
  it('should validate main menu structure', () => {
    const menu = MenuRegistry.getMenu('main');
    expect(menu.sections).toHaveLength(1);
    expect(menu.sections[0].items).toHaveLength(4);
  });
});

// Interaction modes can be tested with mock menus
describe('Interactive Renderer', () => {
  it('should render numbered options', async () => {
    const mockMenu = createMockMenuDefinition();
    const renderer = new InteractiveRenderer();
    await renderer.renderMenu(mockMenu, mockContext);
    expect(consoleOutput).toContain('1. Configuration');
  });
});

// Command execution can be tested independently
describe('Command Registry', () => {
  it('should execute config:show command', async () => {
    const result = await commandRegistry.execute('config:show', mockContext);
    expect(result.success).toBe(true);
  });
});
```

### Performance Considerations

- **Menu Definition Caching**: Cache parsed menu definitions to avoid repeated parsing
- **Lazy Command Loading**: Load command handlers only when needed
- **Renderer Optimization**: Reuse renderer instances across menu displays
- **Context Sharing**: Efficient context passing between layers

### Error Handling

- **Menu Definition Validation**: Validate menu definitions at load time
- **Command Handler Validation**: Ensure all referenced handlers exist
- **Graceful Degradation**: Fall back to core functionality when skin menus fail
- **User-Friendly Errors**: Clear error messages for missing commands or invalid inputs

---

This architecture provides the foundation for both the immediate decoupling needs and future Skins infrastructure integration, creating a maintainable, extensible, and user-friendly CLI system.
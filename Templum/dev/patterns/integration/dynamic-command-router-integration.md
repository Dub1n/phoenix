---
date-created: 2025-08-29-0000
last-updated: 2025-09-11-121733
name: dynamic-command-router-integration
description: Menu and registry systems need to integrate with DynamicCommandRouter for skin-driven command routing while maintaining backward compatibility with legacy hardcoded patterns
status: established
category: integration
use-when:
  - Menu and registry systems need to integrate with DynamicCommandRouter
  - Skin-driven command routing while maintaining backward compatibility
  - Legacy hardcoded patterns must be preserved
keywords:
  - dynamic-command-router
  - menu-integration
  - registry-systems
  - backward-compatibility
  - skin-driven
prerequisites:
  - dynamic-command-router-understanding
  - feature-flag-configuration
related-patterns:
  - dynamic-command-routing
  - universal-command-registry
  - backend-service-integration-unified
---

### Dynamic Command Router Integration

**Solution**: Hybrid routing integration with intelligent fallback using dependency injection pattern.

#### Dynamic Command Router Integration: Implementation Pattern

```typescript
// Dependency injection pattern for router integration
export class PCLMenuRegistry extends EventEmitter {
  private commandRouter: DynamicCommandRouter | null = null;

  constructor(commandRouter?: DynamicCommandRouter) {
    super();
    this.commandRouter = commandRouter || null;
    // ... initialization
  }

  private async optimizeMenuItemsWithPCL(items: MenuItem[]): Promise<MenuItem[]> {
    return items.map(item => {
      const config = backendIntegrationConfig.getConfig();
      
      if (config.features.useDynamicCommandRouting && this.commandRouter) {
        // Dynamic routing with intelligent fallback
        if (item.command) {
          const commandRoute = this.commandRouter.getCommandRoute(item.command);
          if (commandRoute) {
            // Command already registered - use as-is
            console.log(`Using dynamic route: ${item.command} -> ${commandRoute.backend.id}`);
          } else {
            // Check for legacy fallback if enabled
            if (config.mode === 'legacy' || config.features.enableLegacyFallback) {
              const legacyCommand = this.mapToLegacyCommand(item.command);
              if (legacyCommand) {
                const legacyRoute = this.commandRouter.getCommandRoute(legacyCommand);
                if (legacyRoute) {
                  item.command = legacyCommand;
                  console.log(`Using legacy mapping: ${item.command} -> ${legacyCommand}`);
                }
              }
            }
          }
        }
      } else {
        // Fallback to hardcoded mapping when no router available
        // ... legacy implementation
      }
      
      return item;
    });
  }
}
```

#### Dynamic Command Router Integration: Integration Points

- **Menu Registry Systems**: Inject DynamicCommandRouter via constructor
- **Backend Service Router**: Provides DynamicCommandRouter instance to consumers
- **Feature Flag Integration**: Use `backendIntegrationConfig` for hybrid mode control
- **Command Resolution**: Check dynamic router first, fall back to legacy patterns

**Used By Active Tasks**: [TASK-CONSOLIDATED-COMMAND-SYSTEM] ✅ (2025-08-29)  
**Successfully Applied**: PCL Menu Registry integrated with DynamicCommandRouter, hybrid routing with legacy fallback  
**Pattern Dependencies**: Backend Integration Feature Flags, Dynamic Command Routing  
**Enables**: Skin-driven command routing, zero hardcoded patterns, backward compatibility  

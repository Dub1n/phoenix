---
date-created: 2025-08-29-0000
last-updated: 2025-09-11-0000
name: dynamic-command-routing
description: Dynamic command routing system that eliminates hardcoded patterns by building routing tables from skin definitions at runtime
status: established
category: routing
use-when:
  - Implementing generic backend integration without hardcoded routing
  - Adding new backends that need command routing capabilities
  - Building systems that route commands based on skin definitions
  - Creating flexible command-to-backend mapping systems
keywords:
  - dynamic-routing
  - command-mapping
  - backend-integration
  - skin-definitions
  - runtime-configuration
  - generic-routing
prerequisites:
  - backend-service-integration
  - universal-interface-orchestration
  - unified-type-system
related-patterns:
  - backend-service-integration
  - universal-interface-orchestration
  - session-management
---

### Dynamic Command Routing Pattern

**Solution**: Dynamic command routing system that builds routing tables from skin definitions at runtime, eliminating all hardcoded routing patterns.

#### Dynamic Command Routing Pattern: Implementation Steps

**Step 1**: Core Dynamic Command Router Architecture

```typescript
// Dynamic Command Router Implementation
class DynamicCommandRouter {
  private commandMap: Map<string, BackendConnection> = new Map();
  private aliasMap: Map<string, string> = new Map();
  private backendCommands: Map<string, Set<string>> = new Map();

  // Register backend commands from skin definition
  registerBackend(backend: BackendConnection, skin: UniversalSkinDefinition): void {
    if (!skin.commands) return;

    // Build command-to-backend mapping dynamically from skin
    for (const [commandId, commandDef] of Object.entries(skin.commands)) {
      this.commandMap.set(commandId, backend);
    }

    // Handle shortcuts as aliases
    if (skin.shortcuts) {
      for (const [shortcut, commandId] of Object.entries(skin.shortcuts)) {
        if (this.commandMap.has(commandId)) {
          this.aliasMap.set(shortcut, commandId);
          this.commandMap.set(shortcut, backend);
        }
      }
    }
  }

  // Get backend for command with intelligent routing
  getBackendForCommand(commandId: string): BackendConnection | null {
    return this.commandMap.get(commandId) || null;
  }
}
```

**Step 2**: Key Implementation Components

1. **Command Registration**: Automatic command registration when backend skin definitions are loaded
2. **Routing Decision Logic**: Commands route to specific backends based on skin ownership
3. **Lifecycle Integration**: Command mappings automatically update when backends connect/disconnect
4. **Alias/Shortcut Support**: Full support for command aliases and shortcuts defined in skins
5. **Fallback Strategy**: Maintains backward compatibility with fallback routing

#### Dynamic Command Routing Pattern: Success Metrics

- Commands routed entirely from skin definitions without hardcoded patterns
- New backends integrate by providing skin definition only - zero Templum code changes
- Command aliases and shortcuts work automatically from skin definitions
- Backend lifecycle automatically manages command availability
- O(1) command-to-backend mapping performance achieved
- Comprehensive debugging and statistics for command routing decisions

#### Dynamic Command Routing Pattern: Anti-Patterns

- **X** [Anti-Patterns]

#### Dynamic Command Routing Pattern: Validation Checklist

- [ ] Dynamic command router properly registers backends from skin definitions
- [ ] Command routing works without hardcoded patterns
- [ ] Alias and shortcut support functional from skin definitions
- [ ] Backend lifecycle integration manages command availability
- [ ] Fallback routing maintained for backward compatibility

#### Dynamic Command Routing Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

// TODO: [TASK-PATTERN-001] Pattern: frontmatter-standardization | Complexity: 2 | Dependencies: template-system
// Context: Updated frontmatter to follow standardized YAML template format with kebab-case fields, structured arrays, and proper metadata organization
// Validation-Required: yaml-syntax-validation, pattern-metadata-completeness, searchability-enhancement
// Pattern-Info: { approach: "template-based-standardization", alternatives: "manual-update", trade-offs: "consistency-vs-flexibility" }

#### Dynamic Command Routing Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-GENERIC-002]
**Successfully Applied**: [TASK-GENERIC-002] ✅ Dynamic Command Routing System Implementation (2025-08-29)
**Integration Points**: Backend Service Integration, Universal Interface Orchestration, Session Management, Unified Type System
**Files Using This Pattern**: src/backend/dynamic-command-router.ts, src/backend/backend-service-router.ts, src/session/templum-universal-session-manager.ts

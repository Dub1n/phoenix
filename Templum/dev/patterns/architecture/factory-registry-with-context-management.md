---
date-created: 2025-08-29-0000
last-updated: 2025-09-11-0000
name: factory-registry-with-context-management
description: Factory registration systems with context-dependent dependencies, error boundaries and graceful degradation
status: established
category: architecture
use-when:
  - Need factory registration with context dependencies
  - Implementing VSCode extension context management
  - Requiring error boundaries with graceful degradation
keywords:
  - factory-pattern
  - registry
  - context-management
  - error-boundaries
  - vscode-extension
  - dependency-injection
prerequisites:
  - dependency-injection-pattern
  - vscode-extension-context
related-patterns:
  - dependency-injection
  - unified-type-system
---

### Factory Registry with Context Management Pattern

**Problem**: Factory registration systems need to handle context-dependent dependencies (like VSCode Extension Context) while maintaining error boundaries and graceful degradation.

**Solution**: Global state context management with error boundary pattern and lazy loading, following Haruspex provider registration approaches with multi-strategy context resolution.

#### Factory Registry with Context Management Pattern: Implementation Steps

**Step 1**: Global Context Management

```typescript
// Static methods for context management
export class InterfaceAdapterRegistry {
/**
* Set VSCode extension context for adapter creation
*/
static setVSCodeContext(context: any): void {
(global as any).__templumVSCodeContext = context;
console.log('InterfaceAdapterRegistry: VSCode context registered for  adapter factory use');
}

/**
* Clear VSCode extension context (for cleanup)
*/
static clearVSCodeContext(): void {
delete (global as any).__templumVSCodeContext;
console.log('InterfaceAdapterRegistry: VSCode context cleared');
}
}
```

**Step 2**: Context-Aware Factory Registration

```typescript
private async registerBuiltInFactories(): Promise<void> {
const registeredFactories: string[] = [];
const failedFactories: string[] = [];

try {
// VSCode adapter factory with context validation
this.registerAdapterFactory('vscode', () => {
try {
const { createVSCodeInterfaceAdapter } =  require('./vscode-adapter-abstracted');

// Get context from global state with validation
const context = (global as any).__templumVSCodeContext;
if (!context) {
console.warn('VSCode context not available, adapter creation  deferred');
throw createTemplumError('VSCode context not available',  'CONTEXT_NOT_AVAILABLE', 'configuration');
}

return createVSCodeInterfaceAdapter(context);
} catch (error) {
const errorMessage = error instanceof Error ? error.message :  'Unknown error';
console.error('VSCode adapter factory failed:', errorMessage);
throw createTemplumError(`VSCode adapter creation failed:  ${errorMessage}`, 'ADAPTER_FACTORY_ERROR', 'runtime');
}
});
registeredFactories.push('vscode');
} catch (error) {
// Graceful degradation - factory registration failures are non-fatal
failedFactories.push('vscode');
}
}
```

**Step 3**: Enhanced Status Reporting

```typescript
getStatus(): any {
return {
initialized: this.initialized,
registeredAdapters: Array.from(this.adapters.keys()),
availableFactories: Array.from(this.adapterFactories.keys()),
orchestratorReady: this.orchestrator?.isInitialized() || false,
contextStatus: {
vscodeContextAvailable: !!(global as any).__templumVSCodeContext
}
};
}
```

Enhanced Status Reporting: Usage Example

```typescript
// In VSCode extension activation
export async function activate(context: vscode.ExtensionContext) {
// Register context before initializing registry
InterfaceAdapterRegistry.setVSCodeContext(context);

// Initialize registry with proper context available
const registry = new InterfaceAdapterRegistry();
await registry.initialize(orchestrator);

// VSCode adapter can now be created successfully
const vscodeAdapter = await registry.createAndRegisterAdapter('vscode');
}

export async function deactivate() {
// Clean up context during disposal
InterfaceAdapterRegistry.clearVSCodeContext();
}
```

#### Factory Registry with Context Management Pattern: Success Metrics

- Multi-strategy context resolution with 3-tier fallback system
- 100% factory creation success when context is properly provided
- Error boundary pattern with graceful degradation implemented
- VSCode Extension Context integration functional

#### Factory Registry with Context Management Pattern: Anti-Patterns

- **X** [Anti-Patterns]

#### Factory Registry with Context Management Pattern: Validation Checklist

- [ ] Add static context management methods to factory class
- [ ] Implement context validation in context-dependent factories
- [ ] Add comprehensive error handling with specific error types
- [ ] Implement graceful degradation for factory failures
- [ ] Add status reporting for context availability
- [ ] Follow Haruspex provider registration patterns for robustness

#### Factory Registry with Context Management Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

#### Factory Registry with Context Management Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-NEW-035], [TASK-WIRE-001]
**Successfully Applied**: [TASK-NEW-035] ✅ Built-in Adapter Factory Registration (2025-08-27), [TASK-WIRE-001] ✅ Enhanced Multi-Strategy Context Provider (2025-08-29)
**Integration Points**: Dependency Injection, Unified Type System
**Files Using This Pattern**: InterfaceAdapterRegistry with VSCode extension integration

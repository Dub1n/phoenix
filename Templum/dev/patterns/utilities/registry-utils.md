---
date-created: 2025-09-14T12:00:00Z
last-updated: 2025-09-15T12:00:00Z
name: registry-utils
description: Confidence-validated registry foundation replacing bespoke lifecycle, validation, and duplicate detection logic scattered across interface and command registries
status:
  - [x]
category: infrastructure
use-when:
  - You need to register and lazily resolve components while enforcing consistent lifecycle hooks
  - Duplicate registry code exists across command, menu, adapter, or service registries
  - Validation, duplicate detection, and health insights must be standardized without bespoke wiring
keywords:
  - registry-utils
  - lifecycle-management
  - dependency-injection
  - confidence-scoring
prerequisites:
  - logger
  - error-handler
  - async-utils
related-patterns:
  - factory-utils
  - service-utils
  - dependency-injection-unified
---

# Registry Utils Utility Consolidation Pattern

## Consolidation Snapshot

- **Redundancy**: ~200 duplicated lines across 5 registry implementations (`universal-command`, `universal-menu`, `pcl-command`, `pcl-menu`, `interface-adapter`)
- **Hotspots**: Manual lifecycle phases, duplicate detection, validation reports, and telemetry wiring repeated in each registry
- **Impact**: One shared registry foundation eliminates bespoke `Map` plumbing, reduces error handling divergence, and unlocks cross-registry telemetry
- **Priority**: MEDIUM — enables downstream consolidation for factories, services, and adapter orchestration

## Problem Statement

Hand-rolled registries mix event emitters, lifecycle ordering, duplicate detection, and ad-hoc metrics. The result is inconsistent initialization, divergent validation logic, and limited reuse. For example:

```typescript
// src/commands/universal-command-registry.ts
private handlers = new Map<string, UniversalCommandHandler>();

async registerCommand(command: UniversalCommandHandler): Promise<void> {
  if (this.handlers.has(command.id)) {
    throw new Error(`Command ${command.id} already registered`);
  }
  this.handlers.set(command.id, command);
  this.emit('commandRegistered', command.id);
  // ... bespoke validation, audit logging, and lifecycle wiring ...
}

async dispose(): Promise<void> {
  for (const handler of this.handlers.values()) {
    await handler.dispose?.();
  }
  this.handlers.clear();
}
```

Similar blocks appear in menu registries and adapter registries, each reimplementing lifecycle, validation, caching, and logging. Duplication drives drift in validation rigor (strict vs. permissive), makes intelligence reporting inconsistent, and stretches maintenance across multiple files.

## Solution Overview

Adopt the shared `BaseRegistry` from `Templum/src/utils/registry-utils.ts` to centralize lifecycle orchestration, component validation, and telemetry. Consumers extend the base when they need custom wiring, or instantiate a builder for simple cases.

### Minimal Usage API

```typescript
import { createRegistry } from '../../utils/registry-utils';

const registry = createRegistry<CommandHandler>('command-registry')
  .withValidation(async (component, registration) => {
    const valid = typeof component.handler === 'function';
    return {
      name: registration.name,
      valid,
      issues: valid ? [] : ['Missing handler function'],
      interfaceCompliance: valid,
      methodAvailability: valid,
      initializationStatus: 'initialized',
      confidenceScore: valid ? 1 : 0
    };
  })
  .register({ name: 'help', factory: () => helpCommand });

await registry.initialize();
const handler = await registry.resolve('help');
```

### Extending for Advanced Registries

```typescript
// src/interfaces/interface-adapter-registry.ts
export class InterfaceAdapterRegistry extends BaseRegistry<IInterfaceAdapter> {
  protected async onBeforeInitialize(): Promise<void> {
    await this.registerBuiltInFactories();
  }

  protected async validateComponent(component, registration) {
    return {
      name: registration.name,
      valid: typeof component.initialize === 'function',
      issues: [],
      interfaceCompliance: true,
      methodAvailability: true,
      initializationStatus: 'initialized',
      confidenceScore: 0.9
    };
  }
}
```

The shared implementation layers in:

- **Lifecycle orchestration** (`initialize` → registration resolution → validation → intelligence scheduling)
- **Logger + error-handler integration** via `createLogger`, `handleAsync`, and `withTimeout`
- **Duplicate detection** in `register` and circular dependency checks during validation
- **Telemetry hooks** (`getIntelligence`, `getValidationReport`, `performanceMetrics`)

## Integration with Core Utilities

- **Logger**: every registry instance receives a contextual logger (`createLogger('interface-adapter-registry')`)
- **Error Handler**: initialization, disposal, and component cleanup all flow through `handleAsync`
- **Async Utils**: component creation honours `withTimeout` for lifecycle guarantees
- **Test Utilities**: validation reports expose deterministic data for harness assertions

## Files Using This Pattern

| File | Migration Status | Notes |
|------|------------------|-------|
| `src/interfaces/interface-adapter-registry.ts` | ✅ Already extends `BaseRegistry`; ensure builder API covers simple adapters | High-volume adapter lifecycle |
| `src/commands/universal-command-registry.ts` | ⚠️ Pending migration to `BaseRegistry` | Replace bespoke map + auditing with shared lifecycle |
| `src/menus/universal-menu-registry.ts` | ⚠️ Pending migration | Align menu registration and duplicate detection |
| `src/registry/pcl-command-registry.ts` | ⚠️ Pending migration | Consolidate backend-specific command wiring |
| `src/registry/pcl-menu-registry.ts` | ⚠️ Pending migration | Reuse validation + intelligence scaffolding |

_Estimated reduction_: ≈200 duplicate lines once command/menu registries adopt the shared base.

## Migration Strategy

1. **Inventory** existing registration hooks, duplicate checks, and validation steps in each registry file.
2. **Adopt** the builder (`createRegistry`) for lightweight registries or extend `BaseRegistry` where custom lifecycle logic is required.
3. **Wire** logger contexts and dependency metadata through `ComponentRegistration.metadata` to surface insights in `RegistryIntelligence`.
4. **Retire** manual maps, bespoke emitters, and per-file validation scaffolding.

### Before → After Example

```typescript
// Before: command registry duplicate detection
if (this.handlers.has(command.id)) {
  throw new Error(`Command ${command.id} already registered`);
}

// After: centralized detection
registry.register({
  name: command.id,
  factory: () => command,
  metadata: { domain: 'command', backend: command.backendId }
});
```

## Implementation Checklist

**Before migration**

- [ ] Confirm registry responsibilities (command/menu/adapter) and required lifecycle hooks
- [ ] Capture duplicate detection rules and existing validation outputs for parity tests
- [ ] Note dependency graphs to verify circular dependency alerts post-migration

**During migration**

- [ ] Replace manual `Map` operations with `register`/`resolve`/`unregister`
- [ ] Implement `validateComponent` to preserve domain-specific checks
- [ ] Configure lifecycle timeouts and validation levels via `.withConfiguration` or initial builder options before calling `register`
- [ ] Surface metadata for telemetry and intelligence reports

**After migration**

- [ ] Run registration lifecycle tests (initialize → register → resolve → dispose)
- [ ] Assert duplicate detection through the builder (`register` throws on duplicate names)
- [ ] Validate circular dependency detection using representative dependency graphs
- [ ] Capture `getIntelligence()` output in regression tests

## Validation & Metrics

- **Health score**: target ≥80 once registries migrate and validation passes
- **Intelligence update**: default 30s cadence; adjust via config when registries need faster telemetry
- **Lifecycle timeout**: defaults to 10s; tune per registry if factories exceed this window

## Testing Guidance

- Focused unit tests should cover initialization, duplicate detection, dependency wiring, and intelligence generation
- Integration tests should register real command/menu/adapters and assert lifecycle events (`initialized`, `resolved`, `disposed`)
- Use mocked logger assertions to guarantee consistent context strings and error emission

## Anti-Patterns to Avoid

- Reintroducing bespoke maps or manual lifecycle timers outside the utility
- Skipping validation (`enableValidation: false`) in production environments
- Bypassing the shared error handler when disposing components

## Follow-On Opportunities

- Once registries migrate, extract shared factory wiring into `factory-utils` to reduce repeated adapter/command construction
- Feed `RegistryIntelligence` outputs into observability dashboards outlined in `observability-instrumentation`

---
date-created: 2025-09-14T14:00:00Z
last-updated: 2025-10-01T11:18:59Z
name: navigation-utils
description: Unified navigation utilities providing path validation, breadcrumb optimisation, and confidence-scored navigation state management.
status:
  - '[x]'
category: business-logic
use-when:
  - Centralising breadcrumb or navigation state handling across adapters or surfaces
  - Validating and sanitising navigation paths before routing them to content handlers
  - Computing navigation confidence scores across modules without duplicating heuristics
  - Providing a minimal API for go/back/home/exit flows that keeps history in sync
keywords:
  - navigation-utils
  - breadcrumb-optimization
  - confidence-scoring
  - routing-flows
  - state-management
prerequisites:
  - logger
  - validator
  - display-utils
related-patterns:
  - dynamic-command-router
  - content-driven-navigation
  - terminal-ui-components
---

# Navigation Utils Utility Pattern

## Consolidation Snapshot

- **Redundancy count**: Navigation helpers duplicated across ≈4 files (breadcrumb manager, exit handler, content navigation, skin navigation parser).
- **Target reduction**: ≈180 lines.
- **Priority**: MEDIUM (business logic) – keeps navigation behaviour consistent across surfaces.

## Problem Statement

Navigation flow is implemented separately across session navigation, breadcrumb managers, and skin-specific parsers. Each reimplements path sanitation, breadcrumb trimming, and confidence scoring – leading to conflicting behaviour when navigating between content sources.

### Current State Examples

```typescript
const isValid = path.startsWith('/') && !path.includes('..');
if (!isValid) throw new Error('Unsafe navigation path');

breadcrumbs.push({ label, path, depth: breadcrumbs.length });
if (breadcrumbs.length > 5) {
  breadcrumbs.shift();
}
```

## Solution Overview

Design `NavigationUtils` to expose a cohesive navigation controller that keeps caller footprint to one or two statements:

- `NavigationUtils.navigate(request)` returns a `Promise<NavigationResult>` with confidence scoring and breadcrumb updates.
- `NavigationUtils.validatePath` and `NavigationUtils.sanitizePath` centralise security checks.
- `NavigationUtils.buildBreadcrumbs` and `NavigationUtils.optimizeBreadcrumbs` standardise breadcrumb output.
- `NavigationUtils.getNavigationState` exposes immutable state snapshots; `NavigationUtils.manager.handleAction` supports back/reset flows.

### Integration Contracts

- **Logger/Error Handler**: Emit telemetry via `Logger` contexts and wrap recoverable issues through `ErrorHandler.handle` so navigation errors surface consistently.
- **Validator Interop**: Reuse shared `Validator` primitives (path, id, command validation) before applying navigation-specific sanitisation rules.
- **Display Utils**: Provide breadcrumb payloads compatible with `DisplayUtils` renderers for CLI, VSCode, and future adapters.
- **Async Utils**: Support cancellable navigation requests by accepting `AbortSignal` or timeout wrappers from `AsyncUtils`.

### Core API Sketch

```typescript
import {
  NavigationUtils,
  type NavigationRequest,
  type NavigationResult,
  type NavigationState
} from './navigation-utils';

// Minimal usage examples
const result: NavigationResult = await NavigationUtils.navigate({
  path: '/services/connected',
  context: { userIntent: 'browse', interfaceType: 'cli' }
});

if (result.success) {
  Logger.info('Navigated to %s', result.normalizedPath);
}

const state: NavigationState = NavigationUtils.getNavigationState();
const validation = NavigationUtils.validatePath('/unsafe/../path');
```

### Migration Example

```typescript
// Before
if (!isSafe(targetPath)) {
  return { success: false, path: currentPath };
}
breadcrumbs = trim([...breadcrumbs, buildCrumb(targetPath)]);

// After
const result = await NavigationUtils.navigate({
  path: targetPath,
  context: { userIntent: 'browse', previousPath: currentPath },
  action: { type: 'navigate' }
});
```

## Files Using This Pattern

| Component | Migration Focus | Estimated Helpers |
|-----------|-----------------|-------------------|
| `src/navigation/breadcrumb-manager.ts` | Replace bespoke breadcrumb trimming | 4 helpers |
| `src/navigation/exit-handler.ts` | Use shared `back()`/`reset()` semantics | 3 helpers |
| `src/navigation/content-driven-navigation.ts` | Centralise confidence scoring | 5 helpers |
| `src/navigation/skin-navigation-parser.ts` | Use shared path validation/sanitisation | 4 helpers |

## Expected Impact

- **Lines reduced**: ≈180 across navigation modules.
- **Usage footprint**: Navigate/back/home flows within ≤3 calls.
- **Confidence**: Unified scoring and validation prevents inconsistent routing.

## Success Metrics

- Path validation accuracy ≥95% for security and format issues.
- Breadcrumb optimisation reduces rendered items by ≥40% while preserving context.
- Navigation code duplication decreases by ≥60% across the targeted files.
- Navigation flows respond within ≤10 ms at the 95th percentile after consolidation.

## Anti-Patterns

- Do not bypass `NavigationUtils.validatePath` for "trusted" sources.
- Avoid storing sensitive data in breadcrumb metadata or history payloads.
- Do not embed authorisation or entitlement checks inside navigation utilities.
- Avoid branch-specific breadcrumb trimming logic that diverges from the shared optimiser.

## Implementation Checklist

**Before migration**

- [ ] Inventory navigation entry points (commands, UI interactions, skin events).
- [ ] Document existing confidence/validation logic.

**During migration**

- [ ] Replace manual validation with `NavigationUtils.validatePath`.
- [ ] Update breadcrumb handling to shared optimiser and feed results to `DisplayUtils`.
- [ ] Route navigation entry points through `NavigationUtils.navigate` with logger contexts.

**After migration**

- [ ] Verify navigation telemetry/logging uses shared logger context.
- [ ] Exercise back/home flows to ensure history state correct.
- [ ] Update consolidation checklist entries and capture remaining consumer tickets.

## Validation Checklist

- [ ] Path validation prevents directory traversal and protocol-smuggling attacks.
- [ ] Breadcrumb optimisation retains navigation context for CLI, VSCode, and skin-driven adapters.
- [ ] Confidence scoring reflects navigation safety thresholds and issues warnings when below policy levels.
- [ ] Unified API integrates with command router and session manager without additional adapters.
- [ ] Navigation telemetry stays under 5 ms overhead when logging and metrics are enabled.

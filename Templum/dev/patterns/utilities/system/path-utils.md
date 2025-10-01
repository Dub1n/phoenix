---
date-created: 2025-09-14T00:00:00Z
last-updated: 2025-10-01T11:03:35Z
name: path-utils
description: Sandboxed path orchestration with confidence scoring for cross-platform file operations.
status:
  - "[~]"
category: system
use-when:
  - Handling filesystem paths that must remain inside a guarded workspace or sandbox root.
  - Consolidating duplicated filesystem access across discovery, configuration, or session managers.
  - Reading or writing JSON assets while preserving consistent logging and fallback semantics.
keywords:
  - safe-paths
  - sandbox-io
  - confidence-scoring
  - cross-platform
prerequisites:
  - logger
  - error-handler
  - async-utils
related-patterns:
  - configuration-utils
  - registry-utils
  - resilience-utils
---

# Path Utils Utility Pattern

## Consolidation Snapshot

- **Redundancy count**: ≈8 source files repeat manual `path` + `fs` handling (`service-discovery.ts`, `connection-factory.ts`, `backend-service-router.ts`, `templum-core.ts`, CLI bootstrap, config loaders, session managers, backend tests).
- **Target reduction**: ≈120 lines once duplicated `existsSync`/`mkdirSync`/JSON parsing blocks are removed.
- **Priority**: MEDIUM (system utilities) — required before config/watch utilities can rely on sandbox-aware paths.

## Problem Statement

Key backend flows build file paths through ad-hoc `path.join` + `fs` calls. Each caller implements its own guard logic, directory creation, and error handling. Examples include:

```typescript
const registryDir = path.dirname(this.options.registryPath);
const servicesDir = path.join(registryDir, 'services');
if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
}
const registry = JSON.parse(fs.readFileSync(this.options.registryPath, 'utf-8')) as ServiceRegistry;
```

This duplication produces inconsistent sandbox rules, blocks confidence-based validation, and complicates migration to asynchronous fs usage.

## Solution Overview

Provide a sandbox-aware `PathUtils` helper that delivers:

- Guarded path resolution with escape prevention and path-length enforcement.
- Chainable handles (`PathHandle`) that expose fluent helpers (`join`, `parent`, `ensureDir`, `exists`, `readJSON`, `writeJSON`).
- Consistent logging via `logger` and error normalization via `ErrorHandler`.
- Confidence scores in every operation result so callers can gate downstream logic.

### Core API Sketch

```typescript
const sandboxRoot = process.cwd();
const registryHandle = PathUtils.from(options.registryPath, { sandbox: sandboxRoot });

const servicesDir = await registryHandle
  .parent()
  .join('services')
  .ensureDir();
if (!servicesDir.ok) throw servicesDir.error;

const registry = await registryHandle.readJSON<ServiceRegistry>({
  fallback: DEFAULT_REGISTRY,
});
if (!registry.ok) throw registry.error;
```

### Operation Matrix

| Helper | Purpose | Notes |
|--------|---------|-------|
| `PathUtils.from(target, opts)` | Create a `PathHandle` anchored to a sandbox | Computes initial confidence (0.95 when guarded) |
| `handle.join(...segments)` | Chain additional segments safely | Blocks traversal outside sandbox unless `allowEscape` is set |
| `handle.ensureDir()` | Create directory recursively | Returns `{ ok, value: PathHandle }` with confidence metadata |
| `handle.exists()` | Check presence without throwing | Metadata records `{ exists: boolean }` |
| `handle.readText()` / `readJSON()` | Async file reads with logging + fallback option | Missing files + fallback ⇒ confidence `0.5` |
| `handle.writeText()` / `writeJSON()` | Writes text/JSON with automatic parent directory creation | Returns `{ ok, metadata: { bytes } }` |
| `PathUtils.findUp(start, markers, opts)` | Locate nearest ancestor containing marker files | Respects sandbox guard; returns `confidence 0.4` when not found |

## Integration Expectations

- **Logging**: All mutating operations push debug logs (`path-utils` context) so observability captures filesystem interactions.
- **Error Handling**: Failures are normalized through `ErrorHandler`, producing `TemplumError` objects (`PATH_*` codes) for upstream recovery.
- **Confidence**: Callers should treat `confidence < 0.8` as conditional or fallback; e.g., a `readJSON` fallback returns 0.5, `findUp` miss returns 0.4.
- **Composition**: Other utilities (e.g., `ConfigurationUtils`) depend on `PathUtils` to guarantee paths stay inside `.templum` sandboxes before touching files.

## Primary Migration Targets

| Component | Current Issue | Path Utils Adoption |
|-----------|---------------|---------------------|
| `src/backend/service-discovery.ts` | Manual `existsSync`/`mkdirSync`/`readFileSync` for registry + services dir | Replace with `PathHandle` for services dir, registry load/save, watcher paths |
| `src/backend/connection-factory.ts` | Custom workspace root search + JSON parsing | Use `findUp` for workspace markers and `readJSON` for IPC metadata |
| `src/backend/backend-service-router.ts` | Duplicated IPC connection discovery logic | Share the same path guard + JSON reader to avoid drift |
| `src/core/templum-core.ts` / `src/cli-entry.ts` | Hard-coded `.templum` path assembly | Swap to `PathUtils` to maintain sandbox + logging |
| `src/tests/backend/service-discovery.test.ts` | Path joins in test scaffolding | Adopt `PathUtils` to mirror production contract |

## Migration & Validation Checklist

**Path safety**
- [ ] Define a sandbox root (`process.cwd()` or workspace root) before creating handles.
- [ ] Replace raw `path.join` / `resolve` usage with `handle.join(...)` so traversal attempts raise `PATH_GUARD_BLOCKED`.
- [ ] Use `PathUtils.findUp` for marker discovery instead of bespoke loops.

**Error handling**
- [ ] Remove direct `try/catch` + `JSON.parse` combos; rely on `readJSON` to surface `TemplumError` with context.
- [ ] When fallbacks are acceptable, inspect the `confidence` value (~0.5) and log the degraded state.
- [ ] Bubble `.error` from failed operations back through existing orchestrator guardrails (logger/error handler).

**Tests**
- [ ] Add unit coverage for new call-sites verifying sandbox enforcement and fallback behaviour.
- [ ] Expand integration tests to assert `confidence` gating (e.g., service discovery ignores stale registry when `confidence < 0.8`).
- [ ] Document executed test suites in consolidation notes once consumers migrate.

## Quality Gates

- External callers must never use synchronous `fs.*Sync` once migrated.
- Any `PathOperationResult` with `ok: false` must surface to error reporting; no silent catches.
- Confidence at or below 0.8 should trigger explicit validation or fallback logic in adopting modules.

## Status

Pattern implementation exists in `src/utils/path-utils.ts` with accompanying tests (`src/tests/utils/path-utils.test.ts`). Migration of the listed consumers remains in-flight; keep status at `[~]` until adoption removes the duplicated logic from all targeted files.

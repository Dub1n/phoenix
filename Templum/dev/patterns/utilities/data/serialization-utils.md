---
date-created: 2025-09-14T00:00:00Z
last-updated: 2025-10-01T11:09:36Z
name: serialization-utils
description: Fluent JSON serialization helpers with schema-aware parsing, confidence defaults, and fallback recovery for multi-protocol payloads
status: ['[x]']
category: data-management
use-when:
  - Handling backend payloads that move between IPC, HTTP, and WebSocket adapters.
  - Persisting or reloading configuration files that must obey shared schemas.
  - Shipping skin definitions or interface state snapshots between runtimes.
keywords:
  - serialization
  - json-safety
  - schema-validation
  - fallback-orchestration
prerequisites:
  - logger
  - error-handler
  - validator
  - type-guards
related-patterns:
  - configuration-utils
  - resilience-utils
  - backend-service-integration-unified
  - error-handler
---

# Serialization Utils Consolidation Pattern

## Consolidation Snapshot

- **Redundancy confirmed**: 75 direct `JSON.parse` / `JSON.stringify` invocations across 29 production files (2025-10-01 run of `rg --no-heading -c "JSON\.(stringify|parse)" Templum/src`). The top 15 hotspots account for **60 calls**, matching the phase dossier's ≈15 files / ≈100 lines duplicate estimate.
- **Primary hotspots**: Backend transport (`backend-service-router.ts`, `connection-factory.ts`, `service-discovery.ts`), config persistence (`templum-core.ts`, `cli-entry.ts`), and skin/runtime serialization (`skin/universal-skin-engine.ts`, MCP channel utilities).
- **Impact goal**: Replace ad-hoc parsing with fluent helpers to drop ~100 lines of manual error handling while guaranteeing logger + error-handler integration for every serialization path.
- **Confidence coverage**: Provide defaults/fallbacks + schema validation to keep adapters resilient when backends misbehave.

## Problem Statement

Manual JSON blocks mingle parsing, validation, and logging, causing inconsistent behaviour under failure. For example:

```typescript
// Templum/src/backend/service-discovery.ts:342
const serviceData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
if (!serviceData.id || !serviceData.endpoint) {
  console.warn(`[FILE_WATCHER] Invalid service file ${filePath}: missing id or endpoint`);
  return;
}
```

```typescript
// Templum/src/backend/backend-service-router.ts:971
const message = JSON.parse(data.toString()) as IPCMessage | IPCResponse;
...
ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
```

Each call repeats:

- ad-hoc try/catch wrappers (or none at all),
- manual console logging instead of the shared logger,
- bespoke fallbacks or "ignore" comments instead of tracked defaults,
- duplicated size / circular reference handling logic.

## Target Solution

### Minimal Usage API

```typescript
import { serialization } from '../../utils/serialization-utils';

// Emit JSON with auto masking + limits
const payload = serialization
  .json(handshakePayload)
  .context('backend:ws-handshake')
  .maxBytes(2048)
  .mask(['token', 'secret'])
  .fallback('{}')
  .stringify();

// Parse responses with schema + defaults
const result = serialization
  .fromJson(rawMessage)
  .context('backend:ws-handshake')
  .withSchema(handshakeSchema)
  .withDefaults(defaultHandshake)
  .fallback(defaultHandshake)
  .parse();

if (!result.ok || result.status !== 'success') {
  log.warn('Handshake payload degraded', { status: result.status, warnings: result.meta.warnings });
}
```

### Integration Guarantees

- **Logger + error handler**: All failures route through `createLogger('serialization-utils')` and `ErrorHandler.handle`, producing consistent `TemplumError` envelopes.
- **Confidence states**: Outcomes expose `status: 'success' | 'defaults' | 'fallback' | 'error'` with metadata (`bytes`, `durationMs`, `warnings`, `maskedFields`). Callers can branch on status while enjoying single-line usage.
- **Schema-aware validation**: Accepts any object exposing `parse` and optional `safeParse` (Zod recommended). Defaults/fallbacks keep pipelines live when validation fails.
- **Safe writers**: Circular references collapse to `"[Circular]"`, secret fields mask to `"[masked]"`, and optional size caps prevent unbounded payloads.

## Files Using This Pattern

| File | JSON Calls | Migration Notes |
|------|------------|-----------------|
| `Templum/src/backend/backend-service-router.ts` | 11 | Replace ping/pong + IPC handlers with `serialization.json(...)` / `.fromJson(...)`, feed warnings into router logger. |
| `Templum/src/backend/service-discovery.ts` | 9 | Unify registry/config file loads and WebSocket payloads; leverage defaults for optional fields. |
| `Templum/src/core/templum-core.ts` | 5 | Standardise config persistence and status reporting. |
| `Templum/src/scripts/run-phase6-integration-validation.ts` | 4 | Swap CLI script serialization for shared helpers to align logging + failure handling. |
| `Templum/src/cli-entry.ts` | 4 | Convert CLI state snapshots and config writes. |
| `Templum/src/backend/connection-factory.ts` | 4 | Wrap protocol payloads and health probes with schema-backed parsing. |
| `Templum/src/skin/universal-skin-engine.ts` | 3 | Guard cache metrics + overrides with size limits, provide defaults on parse.
| `Templum/src/observability/templum-observability-system.ts` | 3 | Unify metric export JSON with fallback reporting. |
| `Templum/src/mcp-channel/src/visual-feedback-system.ts` | 3 | Use fluent defaults for visual feedback payloads. |
| `Templum/src/mcp-channel/src/service-registration.ts` | 3 | Harden registration messages with schema + fallback. |
| `Templum/src/interfaces/cli-adapter-abstracted.ts` | 3 | Replace console logging + parse with minimal API. |
| `Templum/src/validation/hybrid-validation-system-v3c.ts` | 2 | Centralise validation harness serialization. |
| `Templum/src/skin/skin-version-manager.ts` | 2 | Enforce size limits on version manifests. |
| `Templum/src/rendering/universal-layout-engine.ts` | 2 | Mask layout payload secrets and reuse defaults. |
| `Templum/src/interfaces/navigation/window-stack.ts` | 2 | Use builder for navigation state persistence. |
| _Other production files (14)_ | 15 | Apply during rollout using inventory from the `rg` command above. |

## Migration Blueprint

1. **Inventory** each target file (`rg "JSON\\.(stringify|parse)" <file>`). Annotate context string to feed into `serialization.context()` (e.g., `backend:ws-handshake`).
2. **Replace writers**: `JSON.stringify` → `serialization.json(value).context(...).maxBytes(...).mask([...]).stringify()`.
3. **Replace readers**: `JSON.parse` → `serialization.fromJson(raw).context(...).withSchema(schema).withDefaults(defaults).fallback(default).parse()`.
4. **Propagate metadata**: Use `result.meta.warnings` and `result.status` to surface degraded states to existing loggers / telemetry.
5. **Remove manual try/catch** once handlers are updated; rely on `ErrorHandler` for escalation and on returned `status` for branching.
6. **Update tests** to assert outcomes rather than raw JSON; refer to `Templum/src/tests/utils/serialization-utils.test.ts` for harness patterns.

## Validation Checklist

**Before migration**
- [ ] Confirm schema availability (or plan quick Zod schema extraction) for each consuming module.
- [ ] Document acceptable fallbacks/defaults per payload in module notes.
- [ ] Set byte thresholds for large payloads (e.g., skin definitions, telemetry dumps).

**During migration**
- [ ] Replace every raw `JSON.parse`/`JSON.stringify` with the fluent API.
- [ ] Log or forward `result.meta.warnings` and `result.status !== 'success'` to module-specific loggers.
- [ ] Ensure masked fields lists cover secrets/tokens previously redacted manually.

**After migration**
- [ ] Run integration scripts (`Templum/src/scripts/run-phase6-integration-validation.ts`, CLI smoke flows) to confirm no regression.
- [ ] Capture serialized payload metrics (`bytes`, `durationMs`) for dashboards if applicable.
- [ ] Tick the consolidation checklist entry in `safe-consolidation-candidates.md` and record migrated files.

## Testing Strategy

- **Unit tests**: `Templum/src/tests/utils/serialization-utils.test.ts` covers happy path, max-size fallback, schema defaults, and invalid JSON recovery. Extend with edge cases (streaming, revivers) as new scenarios appear.
- **Integration tests**: Add assertions within backend router/service discovery suites once callers migrate (e.g., ensure `status: 'success'` for healthy paths and `'fallback'` for degraded responses).
- **Observability**: Monitor logger output for `serialization-utils` to catch unexpected fallback spikes.

## Success Metrics

- ✅ Minimal usage footprint: single-line `.stringify()` / `.parse()` replacements with contextual metadata.
- ✅ Schema-driven validation and automatic defaults restore consistent behaviour.
- ✅ Logger/error-handler alignment eliminates console noise and ignored parse errors.
- ✅ Masked fields + byte limits mitigate data leakage and runaway payloads.

Delivering on this pattern means the new `Templum/src/utils/serialization-utils.ts` is the authoritative implementation, and all subsequent migrations should conform to the API and validation requirements detailed above.

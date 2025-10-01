---
date-created: 2025-09-14T12:06:00Z
last-updated: 2025-09-15T00:00:00Z
name: debug-utils
description: Chainable development toolkit for logging, inspection, and profiling with confidence gating.
status: ["[~]"]
category: development-tools
use-when:
  - Deploying temporary or diagnostic instrumentation that must respect production safety boundaries.
  - Profiling backend adapters, CLI flows, or test harnesses without scattering ad-hoc console statements.
keywords:
  - debug-toolkit
  - profiling
  - state-inspection
prerequisites:
  - logger
  - error-handler
related-patterns:
  - async-utils
  - logger
  - test-utils
---

# Debug Utils Utility Pattern

Status: standardising | Category: Development Tools

## Why This Pattern Exists

Templum carries multiple ad-hoc debugging blocks that bypass shared logging and error handling. The most costly issues are:
- Console-based diagnostics that never flow through the central logger, so log-level gating and transports are bypassed.
- Repeated inspection/profiling snippets that must be manually wired (particularly in backend service routing and CLI adapters).
- No shared teardown for timers/intervals created during debugging, leading to lingering resources in long-running sessions and tests.
- Missing regression coverage for instrumentation helpers, so fixes regress silently.

## Redundancy Snapshot

| Area | File | Statements flagged (`rg "console\\."`) | Risk |
| --- | --- | --- | --- |
| Backend router | `Templum/src/backend/backend-service-router.ts` | 37 debug/warn lines | Skips central logger + level gating |
| CLI adapter | `Templum/src/cli-entry.ts` | 9 debug/warn lines | Hard-coded terminal output, no teardown |
| State sync | `Templum/src/state/state-sync-foundation.ts` | 2 debug/warn lines | No shared inspection context |
| Session management | `Templum/src/session/session-context-foundation.ts` | 3 debug lines | Interval cleanup only via console message |
| Test harness | `Templum/src/tests/backend/comprehensive-backend-validation.test.ts` | 16 console logs | Test noise hides real failures |

Total: **67 console-based debug statements across five hotspots**, exceeding the ~60-line redundancy budget in the consolidation plan and blocking consistent instrumentation.

## Solution Overview

Introduce `createDebugToolkit` in `Templum/src/utils/debug-utils.ts` as the single entry point for development diagnostics. The toolkit delivers a fluent API so callers can collapse verbose debugging chains into one-liners while inheriting logging, error handling, and lifecycle control.

```ts
import { createDebugToolkit, LogLevel } from '../utils/debug-utils';

const debug = createDebugToolkit({ namespace: 'backend-router', level: LogLevel.DEBUG });

debug
  .log('service-connected', { data: { backendId } })
  .inspect(stateSnapshot, { label: 'state-sync' });

await debug.profile('hydrate-skin', async () => loadSkin(backendId), {
  metadata: { backendId, attempt },
  onError: (error) => report(error)
});
```

## Core Capabilities

- **Log level gating**: honours toolkit-level thresholds before doing work, preventing expensive inspection/profiling when only warnings should surface.
- **Chainable diagnostics**: `log().inspect().profile()` returns the same toolkit instance, keeping call-sites compact and enforcing the minimal-footprint mandate.
- **Context-aware logging**: delegates to `logger.child(namespace)` so messages inherit structured prefixes (`[backend-router:adapter] …`).
- **Confidence-validated profiling**: wraps async/sync operations, records timing metadata, and routes failures through `error-handler` before rethrowing or falling back.
- **Structured history**: retains a bounded in-memory history (`historyLimit`, default 50) for assertions and post-run assertions without polluting production logs.
- **Deterministic teardown**: `onTeardown` registers cleanup hooks and `teardown()` guarantees idempotent disposal, logging handler failures through the shared error path.

## API Contract

| Method | Purpose | Notes |
| --- | --- | --- |
| `log(message, { level, data, scope })` | Emit structured debug/info/warn/error entries | Default `level = DEBUG`; scopes append `namespace:scope` |
| `inspect(target, { label, level, scope, maxDepth })` | Snapshot state safely | Uses `util.inspect` with bounded depth |
| `profile(label, operation, { metadata, level, swallowError, fallbackValue, onError, scope })` | Time operations with automatic error delegation | Logs success as provided level; failures emit at `ERROR` |
| `onTeardown(handler)` | Register cleanup hooks | Late-bound handlers execute immediately after disposal |
| `teardown()` | Flush and dispose instrumentation | Clears history and executes handlers exactly once |
| `withContext(segment)` | Fork toolkit with nested namespace | Shares history + teardown registry for coordinated cleanup |
| `getHistory()` | Returns immutable snapshot of recorded events | Enables targeted assertions in tests |

## Integration Requirements

- **Logger**: relies on `Templum/src/utils/logger.ts`; inject custom transports via config or allow default structured logging.
- **Error handler**: defaults to `Templum/src/utils/error-handler.ts::handle`. Failures during profiling or teardown propagate as wrapped `TemplumError`s.
- **Async utilities**: profile blocks accept async functions; pair with `async-utils` when coordinating timeouts or retries.
- **Consumers**: replace ad-hoc console usage in:
  - `Templum/src/backend/backend-service-router.ts` (health monitor + recovery logging)
  - `Templum/src/cli-entry.ts` (CLI adapter diagnostics)
  - `Templum/src/state/state-sync-foundation.ts` + `Templum/src/session/session-context-foundation.ts`
  - Integration harnesses under `Templum/src/tests/backend/`

## Implementation Checklist

- [x] Provide `createDebugToolkit` with chainable `log`, `inspect`, and `profile` APIs wired to the shared logger.
- [x] Enforce log-level gating before serialization/profiling work; expose `historyLimit` for bounded retention.
- [x] Route operation failures through `error-handler` and emit structured error payloads (includes `phase`, `durationMs`).
- [x] Implement deterministic teardown: `onTeardown`, `teardown`, and guarded handler invocation.
- [x] Ship coverage: `Templum/tests/development-tools/debug-utils.test.ts` exercises chaining, gating, profiling, error delegation, teardown, and namespace forking.

## Validation & Adoption Steps

1. Replace console instrumentation in the listed hotspots with toolkit calls, starting with backend routing where 37 debug lines exist.
2. Update CLI adapters and session/state managers to share a `debug` instance scoped per component, ensuring tear-down of timers and intervals.
3. Wrap test harness logging with toolkit + capture history for assertions, cutting the 16 console statements to a single toolkit instance.
4. Extend regression suites: add targeted assertions using `getHistory()` once consumers migrate.

## Evidence & References

- Haruspex and Phoenix Code Lite already operate confidence-validated debugging stacks (see `haruspex-debug-manager.ts`, `debug-renderer.ts`); the toolkit mirrors their fluent ergonomics while matching Templum's logger/error-handler contracts.
- Redundancy data collected with `rg "console\\."` on 2025-09-15; revisit counts after migrations and update this table.
- Implementation lives at `Templum/src/utils/debug-utils.ts`; tests at `Templum/tests/development-tools/debug-utils.test.ts` guarantee behavioural parity during consolidation.

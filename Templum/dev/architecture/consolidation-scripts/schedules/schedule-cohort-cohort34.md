# Consolidation Schedule (Generated)

Generated at 2025-10-13T13:22:42Z.
Patterns: 3, 4.

| Pa  | Ta  | St  | De               | Ti    | Focus                                                                                        |
| --- | --- | --- | ---------------- | ----- | -------------------------------------------------------------------------------------------- |
|     |     |     |                  |       | `{x}`                                                                                        |
| 3   | 1   | [x] | -                | --:-- | Inventory and scope alignment for Async Utils Consolidation                                  |
| 3   | 2   | [x] | -                | --:-- | Test-first utility updates across Async Utils Consolidation                                  |
| 3   | 3   | [x] | -                | --:-- | Migration orchestration plan for Async Utils Consolidation                                   |
| 3   | 4a  | [x] | -                | --:-- | Baseline backend router + lifecycle gating                                                   |
| 3   | 4b  | [x] | 3:4d             | 00:15 | Hybrid validation suite baseline                                                             |
| 3   | 4c  | [x] | 3:4e             | 00:01 | Phase 6 health/cleanup baseline                                                              |
| 3   | 4d  | [x] | -                | 04:28 | External fix for hybrid validation MCP fallbacks                                             |
| 3   | 4e  | [x] | -                | 00:10 | Phase6 health TypeScript remediation                                                         |
| 3   | 5B  | [x] | -                | 00:29 | Cohort gating readiness for Async Utils Consolidation                                        |
| 3   | 6a  | [x] | -                | 00:17 | Backend service router lifecycle timers                                                      |
| 3   | 6b  | [x] | 7:6              | 00:24 | Connection factory + discovery timers                                                        |
| 3   | 6c  | [x] | 7:6              | 00:01 | Validation + session timer consolidation                                                     |
| 3   | 6d  | [x] | 7:7              | 00:07 | Interface adapters + CLI timers                                                              |
| 3   | 6e  | [x] | -                | 00:30 | State/core/CLI timer sweep & harness cleanup                                                 |
| 3   | 6f  | [x] | -                | 00:14 | State + risk + shared utilities timer migration                                              |
| 3   | 6g  | [x] | -                | 00:10 | Core orchestrator + extension + E2E harness timer migration                                  |
| 3   | 6h  | [x] | -                | 00:17 | MCP channel + integration harness timer migration                                            |
| 3   | 6i  | [x] | -                | 00:14 | Test suites timer migration (unit + integration)                                             |
| 3   | 6o  | [x] | -                | 00:01 | CLI helper scripts managed timer migration                                                   |
| 4   | 1   | [x] | -                | 00:22 | Inventory and scope alignment for Event Utils Consolidation                                  |
| 4   | 2   | [x] | -                | 00:09 | Test-first utility updates across Event Utils Consolidation                                  |
| 4   | 3   | [x] | -                | 00:08 | Migration orchestration plan for Event Utils Consolidation                                   |
| 4   | 4a  | [x] | -                | 00:14 | Interfaces/Adapters migrate to EventUtils typed bus (CLI, VSCode, universal adapters)        |
| 4   | 4b  | [x] | -                | 01:07 | Session orchestrators migrate to createTypedEmitter + forward flow                           |
| 4   | 4c  | [x] | -                | 00:18 | Observability/Resilience emitters wrap EventUtils batchSubscribe+forward                     |
| 4   | 4d  | [x] | -                | 00:09 | Skin engine renders via waitForEvent + scoped cleanup                                        |
| 4   | 4e  | [x] | -                | 00:01 | Test harness + validation suites adopt EventUtils waitForEvent/batchSubscribe                |
| 4   | 5B  | [x] | -                | 00:05 | Cohort gating readiness for Event Utils Consolidation                                        |
| 4   | 6a  | [x] | -                | 00:30 | Backend connectivity validates EventUtils adoption across ServiceDiscovery/ConnectionFactory |
| 4   | 6b  | [x] | -                | 00:01 | Interface Delivery release validation for EventUtils-backed adapters                         |
| 4   | 6c  | [x] | -                | 00:01 | Observability/Resilience telemetry mirror validates EventUtils migration                     |
| 4   | 6d  | [x] | -                | 00:01 | Validation harness + cross-interface readiness sign-off                                      |
| 4   | 6e  | [x] | -                | 00:53 | Flush backend/core emitters to EventUtils typed bus                                          |
| 4   | 6f  | [x] | -                | 00:27 | Complete interface/rendering EventUtils adoption                                             |
| 4   | 6g  | [x] | -                | 00:25 | Audit tests/MCP channel for EventUtils compliance                                            |
| 4   | 6h  | [x] | 4:6e             | 00:54 | Migrate core/state emitters to typed EventUtils bus                                          |
| 4   | 6o  | [x] | -                | 00:08 | Realign Templum Core initialization flows with typed event fixtures                          |
| 4   | 6p  | [x] | -                | 00:15 | Stabilize interface adapter registry teardown after EventUtils migration                     |
| C   | 5A  | [x] | -                | 00:03 | Stage 5A alignment for Cohort 3+4                                                            |
|     |     |     |                  |       | `{0}`                                                                                        |
| 4   | 6k  | [ ] | -                | --:-- | Align core/state test suites with EventDrivenComponent and update typed event mocks          |
| 4   | 6n  | [ ] | 4:6o, 4:6p       | --:-- | Restore repo TypeScript build/test parity so Stage 6 gating battery passes                   |
| 3   | 7   | [~] | -                | --:-- | Final verification and wrap-up for Async Utils Consolidation                                 |
|     |     |     |                  |       | `{1}`                                                                                        |
| 4   | 6j  | [?] | 4:6e, 4:6h       | --:-- | Migrate validation/observability/risk emitters to typed EventUtils bus                       |
| 4   | 6l  | [?] | -                | --:-- | Migrate residual adapters/observability/risk emitters to EventDrivenComponent                |
|     |     |     |                  |       | `{4}`                                                                                        |
| 4   | 6i  | [?] | 4:6e, 4:6h, 4:6n | --:-- | Migrate backend and registry emitters to typed EventUtils bus                                |
|     |     |     |                  |       | `{5}`                                                                                        |
| 4   | 6m  | [?] | 4:6l, 4:6i, 4:6j | --:-- | Stabilize telemetry/phase6 gating after EventUtils migration                                 |
|     |     |     |                  |       | `{6}`                                                                                        |
| 4   | 7   | [?] | -                | --:-- | Final verification and wrap-up for Event Utils Consolidation                                 |

## Notes

### Pattern 3

- [7] 2025-10-13T12:54:02Z
    Reason: Stage 7 validation pending TypeScript build parity remediation after lane 6o migration; Required check: rerun npm run build, npm run phase6-validation, and npm run phase6-health once dev/tasks/typescript-build-parity.md closes.
- [7] 2025-10-13T10:24:56Z
    Reason: Phase 6 validation blocked by TypeScript build errors (19 diagnostics across service-health-check, CLI adapter, MCP channel, async-utils mocks); Required check: complete dev/tasks/typescript-build-parity.md then rerun npm run phase6-validation && npm run phase6-health to capture clean Stage 7 artefacts.
- [7] 2025-10-12T22:48:32Z
    Reason: Stage 7 reopened after the timer audit surfaced remaining manual setTimeout/setInterval usage; Stage 6 created temporary sweep lanes (6e–6i) to finish consolidation while lanes 6j/6k were mock collision tests only. Required check: with Stage 6 sweep lanes closed, rerun npm run consolidate -- sweep 3 --stage 7 and execute the Stage 7 async-utils validation battery (backend lifecycle/service discovery/validation/interface suites plus phase6 health/validation) before marking complete.
- [7] 2025-10-12T22:48:13Z
    Reason: Stage 7 reopened after the timer audit surfaced remaining manual setTimeout/setInterval usage; Stage 6 created temporary sweep lanes (6e–6i) to finish consolidation — test lanes 6j/6k can be ignored. Required check: with Stage 6 now complete, rerun
    > templum@1.0.0 consolidate
    > node dev/architecture/consolidation-scripts/cli-command-stub.mjs sweep 3 --stage 7
    Planned files for stage 7 on pattern 3 resolved to no non-markdown files; nothing to sweep. plus the Stage 7 async-utils validation battery to confirm the repo is timer-clean before marking complete.
- [7] 2025-10-12T22:36:13Z
    Reason: Stage 6 reopened after audit uncovered remaining manual setTimeout/setInterval usage and introduced sweep lanes (6e-6j); Stage 7 must wait for the migration sweep to finish. Required check: once lanes 6e-6j close, rerun `npm run consolidate -- sweep 3 --stage 7` plus the Stage 7 async-utils validation battery to confirm the repo is timer-clean before marking complete.
- [6] 2025-10-12T18:36:15Z
    6e: Added state/core/CLI sweep lane to eliminate remaining manual timers; run the cleanup sweep before promotion.
- [7] 2025-10-12T18:05:50Z
    Risks: Phase 6 validation runs still rely on mock services; schedule the live backend window per dev/tasks/phase6-validation-signal.md. Follow-ups: Coordinate with backend connectivity crew to capture real-service artefacts and confirm state sync warnings remain non-blocking.
- [5B] 2025-10-12T10:58:08Z
    2025-10-12: Executed Stage 6 gating battery for lane 6a via node scripts/run-with-timeout.mjs; backend lifecycle, manual override, and comprehensive validation suites passed (tmp/consolidation-pattern3-stage5-lane6a-20251012T105628Z.log). Hardened HTTP connection normalization and skin loading to accept direct skin payloads, and updated comprehensive backend validation spec to restore leak-proof teardown with run-with-timeout instructions.
- [4] 2025-10-10T14:29:59Z
    2025-10-10: Lane 4c complete. npm run phase6-health now succeeds post-TypeScript remediation; log tmp/consolidation-pattern3-lane4c-20251010T142938Z.log.
- [4] 2025-10-10T14:29:10Z
    2025-10-10: Lane 4e complete. TypeScript fixes across backend router/discovery/registry/session/skin modules; npm run build passes (tmp/phase6-health-build-20251010T142834Z.log). Phase6 health harness unblocked for lane 4c.
- [4] 2025-10-10T14:16:06Z
    2025-10-10: Lane 4b completed. Rebuilt reliability/performance/degradation/dashboard modules to satisfy V3C hybrid validation suite; tests green (tmp/consolidation-pattern3-lane4b-20251010T141541Z.log). Ready to move on once Phase6 health remediation (lane 4e) is staffed.
- [4] 2025-10-10T00:21:46Z — codex
    Lane 4b blocked: hybrid validation suite (src/tests/validation/hybrid-validation-system-v3c.test.ts) fails 25 specs with timeouts + fallback assertions; evidence tmp/consolidation-pattern3-lane4b-20251010T011558.log. Lane 4c blocked: npm run phase6-health fails during build with 12 TS errors (backend router/service discovery/adapter registry/session manager/skin validator); evidence tmp/consolidation-pattern3-lane4c-20251010T012112.log. Await AsyncUtils cleanup + upstream fixes before resuming Stage 4.
- [4] 2025-10-08T11:03:04Z
    Lane 4a evidence: jest backend lifecycle + manual override suites pass; log tmp/consolidation-pattern3-lane4a-20251008T120251.log; Risks: none identified
- [3] 2025-10-08T10:55:57Z — Codex
    Lane owners: 4a/6a Codex + Backend Connectivity crew; 4b/6c Validation team; 4c Release readiness (Phase6 harness) with support from Observability. Sequencing: complete Stage 4 lanes in order (4a → 4b → 4c) before claiming Stage 6. Stage 6 migration order locked to 6a (backend-service-router) → 6b (connection factory/discovery) → 6c (validation + session) → 6d (interface/CLI). Dependencies: 6b requires 6a green; 6c waits on 6b + Terminal Formatter Pattern 7 Stage 6 lanes; 6d depends on Pattern 7 Stage 7 close-out and AsyncUtils cleanup hooks wired in Stage 4c. Guardrails: reuse AsyncUtils.cleanup in each module’s shutdown path, retain zero-knowledge registry invariants, and coordinate with Haruspex integration before touching MCP timers.
- [2] 2025-10-08T01:03:56Z — Codex
    Tests: add src/tests/utils/async-utils.test.ts covering withTimeout rejection/cleanup, retry backoff+jitter toggles, debounce/throttle scheduling, createInterval stop+cleanup, and global cleanup() semantics; Commands: npm run test -- --runTestsByPath src/tests/utils/async-utils.test.ts --runInBand --no-cache; Guardrails: no production code changes unless tests expose gaps, avoid fake timers that mask real cleanup logic, ensure AsyncUtils logger spies remain stub-free.
- [1] 2025-10-08T00:54:03Z
    Orientation: reviewed pattern doc and src/utils/async-utils.ts to confirm existing API surface (retry, debounce, managed intervals) covers registry expectations; current registry counts are stale (rg shows 132 setTimeout + 35 setInterval entries across src). Consumers: backend/connection-factory.ts (5 setTimeout), backend/service-health-check.ts (3 setTimeout), backend/backend-service-router.ts (3 setTimeout + 2 setInterval), backend/pcl-backend-integration.ts (4 setTimeout + 2 setInterval), interfaces/cli-adapter-abstracted.ts (3 setTimeout), interfaces/navigation/exit-handler.ts (3 setTimeout), state/enhanced-state-synchronization.ts (2 setTimeout + 4 setInterval), validation/hybrid-validation-system-v3c.ts (13 setTimeout + 2 setInterval). Commands: rg -c "setTimeout" src | sort -t: -k2 -nr | head -n 15; rg -c "setInterval" src | sort -t: -k2 -nr | head -n 15; sed -n '1,200p' src/utils/async-utils.ts. Guardrails: Stage 2 must start with backend-service-router timers to stabilise lifecycle/health probes, reuse AsyncUtils.cleanup within existing shutdown handlers, and stage UI/validation migrations until Universal Skin + session timing specs settle.
- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Core Infrastructure Utilities (CRITICAL Priority)
    Pattern doc: Templum/dev/patterns/utilities/core/async-utils.md
    Utility focus: (Templum/src/utils/async-utils.ts)
    Problem: 316 setTimeout/setInterval calls with manual timeout management
    API intent: await timeout(promise, 5000) - Auto-cleanup, retry with backoff
    Impact: ~200 timeout calls consolidatable, reliable retry patterns
    Starter files:
    • src/backend/service-discovery.ts (43 timeout calls) (post-MVP)
    • src/backend/connection-factory.ts (38 timeout calls) (post-MVP)
    • src/backend/backend-service-router.ts (52 timeout calls) (MVP focus: lifecycle/health timers keeping Jest alive)
    • src/interfaces/terminal-ui-components.ts (29 timeout calls) (post-MVP)
    • src/core/templum-core.ts (34 timeout calls) (post-MVP)

### Pattern 4

- [7] 2025-10-12T16:30:24Z
    Risks: Phase 6 validation running with mocks; real backend window still pending coordination.; Follow-ups: Schedule PHASE6_RUN_REAL rerun with Backend Connectivity + Interface Delivery leads once service window confirmed; archive validation artefacts in activity log.
- [5B] 2025-10-12T12:39:03Z
    2025-10-12: Adjusted mock performance regression monitor to treat higher-is-better metrics (concurrency) correctly and accept improvements > baseline. phase6-validation rerun (log: tmp/consolidation/pattern-4-stage5/phase6-validation-after-mock-perf-adjust.log, report: validation-reports/phase6-validation-2025-10-12T12-38-55-983Z.md) now passes without mock-induced regression warnings.
- [5B] 2025-10-12T10:49:06Z
    2025-10-12: Updated mock cross-interface comparison to ignore interface-specific metadata and short-circuit scenarios; phase6-validation re-run (log: tmp/consolidation/pattern-4-stage5/phase6-validation-after-mock-normalized.log) now reports 100% cross-interface consistency while performance warnings remain due to mock baselines.
- [5B] 2025-10-12T10:32:34Z
    Guardrails: keep ServiceDiscovery/ConnectionFactory zero-knowledge and maintain typed EventUtils bus invariants while prepping Stage 6; Stage 6 gating battery: npm run phase6-validation, npm run phase6-health, npm run test -- --runTestsByPath src/tests/backend/backend-serialization-log.test.ts src/tests/backend/backend-connection-lifecycle.test.ts src/tests/backend/manual-override-flow.test.ts src/tests/backend/manual-override-watcher.integration.test.ts; Artefacts: sync Templum/docs/current/progress.md, dev/tasks/unified-session-layer.md, dev/tasks/connection-lifecycle-events.md once evidence captured; Approvals: Backend Connectivity + Interface Delivery leads to confirm gating logs before Stage 6 lane claims.
- [5B] 2025-10-12T10:20:31Z
    Stage 5A alignment completed; re-ran event-utils guardrail tests, confirmed adapter/session/telemetry/skin cleanup remains in place, and flagged Stage 6a to carry templum-core connection suite adapter mocks for leak prevention.
- [4] 2025-10-12T01:03:13Z
    Lane 4b: Session manager refactored onto EventUtils typed bus and tests hardened for clean shutdown; templum-core connection suite still requires adapter mocks during Stage 6 migration to avoid legacy CLI module leaks.
- [4] 2025-10-12T00:17:54Z
    Lane 4c: Observability + resilience emitters now wrap EventUtils batchSubscribe/forward (process mirror + scoped resilience bus) with cleanup-aware teardown; verified via npm run test -- --runTestsByPath src/tests/backend/backend-connection-lifecycle.test.ts src/tests/backend/backend-serialization-log.test.ts
- [4] 2025-10-12T00:12:41Z
    Lane 4d: Added waitForEvent-based cleanup for terminal UI components, registered process signal handlers via scoped EventUtils context, and captured formatter test evidence.
- [4] 2025-10-12T00:04:23Z
    Lane 4e: Executed manual override validation suites with EventUtils harness; manual-override flow + watcher tests passing, evidence logged at dev/architecture/evidence/pattern-4-lane-4e-validation-suites.md.
- [4] 2025-10-11T23:52:06Z
    Lane 4a: CLI + command adapters now emit via EventUtils typed bus with scoped cleanup; docs/tasks updated and menu-definition adapter suite logged at dev/architecture/evidence/pattern-4-lane-4a-menu-definition-adapter.test.md.
- [3] 2025-10-11T17:55:51Z — codex
    Guardrails: preserve zero-knowledge ServiceDiscovery/ConnectionFactory contracts, enforce event schema validation per manual-override-flow.md, reuse EventUtils waitForEvent/batchSubscribe patterns captured in Stage 2 tests, and document changes in docs/current/progress.md + dev/tasks/unified-session-layer.md when each lane lands.
- [3] 2025-10-11T17:55:46Z — codex
    Dependencies: lane deps encoded (6a waits on Stage 4 + lanes 4b/4c; 6b after 4a/4d; 6c after 4c; 6d after 4e + display-stack lanes). Cross-pattern: pair with Pattern 3 Async Utils for cleanupContext + timer reuse, Pattern 7 Terminal Formatter + Pattern 5 Display Utils for adapter/menu sync, and log Haruspex milestone handshakes before 4e/6d per milestone-01 playbook.
- [3] 2025-10-11T17:55:38Z — codex
    Sequencing: run Stage 4 lanes 4a→4b→4c→4d→4e so adapters publish typed maps before session/telemetry/renderer/harness swaps; Stage 6 executes 6a→6b→6c→6d with command evidence dropped in utility-consolidation-activity-log + docs/current/progress.md updates after each lane.
- [3] 2025-10-11T17:55:26Z — codex
    Lane owners: 4a Interface Delivery (Display Stack) w/ CLI+VSCode maintainers; 4b Session Core (Unified Session Layer) w/ Backend Connectivity pairing; 4c Observability & Resilience telemetry crew; 4d Skin Engine pod; 4e QA validation harness. Stage 6 lanes: 6a Backend Connectivity validation, 6b Interface Delivery release sign-off, 6c Observability telemetry verification, 6d QA harness close-out.
- [3] 2025-10-09T17:00:49Z — codex
    Stage 3 prep — Cohort guidance: Interfaces/Adapters to replace direct EventEmitter wiring with createScopedBus + typed maps, piggyback on src/tests/utils/event-utils.test.ts before adapter regressions; Orchestrators/Session Core to route session+state broadcast via createTypedEmitter + forward, align lifecycle cleanupContext use; Observability/Resilience to wrap telemetry emitters with batchSubscribe+forward for globalBus mirroring; Skin Engine to rely on waitForEvent for renderer readiness and scoped cleanup; Test Harness to standardize harness timers around waitForEvent/batchSubscribe and record scoped cleanup evidence.
- [2] 2025-10-09T16:52:09Z — codex
    Suites: npm test -- src/tests/utils/event-utils.test.ts; Guardrails: typed emitter binding, scoped context cleanup, forward/waitForEvent protections; Coverage: exercising batch subscribe and emit error handling under mocked logger/error-handler.
- [1] 2025-10-09T15:36:31Z
    Consumers: 70 modules bucketed via rg inventory; Commands: rg --stats 'EventEmitter' src; rg --files-with-matches 'EventEmitter' src; rg --files-with-matches 'EventEmitter' src | cut -d/ -f2 | sort | uniq -c; Priority clusters: Interfaces & adapters (15 modules across CLI/VSCode/universal adapters, Interface Delivery owners); Orchestrators & session/state engines (9 modules: universal interface/session managers, state sync, backend dependency router, Session Core owners); Observability & resilience monitors (6 modules: templum-observability-system, cli-performance-monitor, progressive timeout and resilience utils, Observability owners); Skin/render/rendering engines (4 modules: universal skin engines, renderer, Skin Engine owners); Test & harness coverage (22 modules: backend/service discovery, MCP channel utilities, tests folder, QA coordination). Guardrails: maintain typed emitter compatibility with EventUtils API, keep CLI/VSCode adapters stable, align orchestrator cleanup semantics with zero-knowledge registry, and coordinate observability hooks before altering global emitters.
- [1] 2025-10-09T15:16:12Z
    Consumers: 70 modules (backend=8, interfaces=15, mcp-channel=6, tests=8, utils=4, validation=4, risk=3, remaining categories <=2) confirmed via inventory; Commands: rg --stats 'EventEmitter' src; rg --files-with-matches 'EventEmitter' src; rg --files-with-matches 'EventEmitter' src | cut -d/ -f2 | sort | uniq -c; Guardrails: protect adapters (CLI, VSCode, command registry), session orchestrators, and observability emitters while aligning with event-utils spec before modifications.
- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Core Infrastructure Utilities (CRITICAL Priority)
    Pattern doc: Templum/dev/patterns/utilities/core/event-utils.md
    Utility focus: (Templum/src/utils/event-utils.ts)
    Problem: 528 EventEmitter uses with repeated event management patterns
    API intent: events.typed<EventMap>().emit('event', data) - Typed events, auto-cleanup
    Impact: Standardized event handling, reduced boilerplate
    Starter files:
    • All components using EventEmitter pattern (528 uses across codebase)
    • Event handling, debouncing, aggregation patterns
    • Typed event management systems

---
doc-type: architecture-spec
name: Templum Architecture Specification
tags: [templum, universal_interface, architecture]
status: current
last_updated: 2025-10-14
---

# Templum — Architecture Specification (Current State)

## 0. Summary

- **Purpose:** Universal interface orchestrator that renders backend-defined skins across CLI, VSCode, and future interfaces without hardcoded knowledge.
- **Current Status:** In migration—backend discovery works, the shared session manager now spans adapters, and the skin-driven UI still needs implementation/verification.
- **Key Dependencies:** Haruspex and Phoenix Code Lite backends; Validation System for runtime checks.
- **Documentation Links:** [progress](docs/current/progress.md), [testing guide](docs/current/testing-guide.md), [V3C](docs/target/ValidationSystem-V3C-Documentation.md), pattern references under `dev/patterns/`.

## 1. Current State Snapshot
>
> ⚠️ **Needs Verification:** Skin rendering pipeline, CLI refactor, and observability wiring are documented but not proven end-to-end.
>
> 🧭 **In Progress:** Backend router refactor, shared session/context verification, and Haruspex integration.

- Backend discovery (`ServiceDiscovery`, `ConnectionFactory`) enumerates locally registered services; watcher overrides keep `.templum/services` scoped to the active workspace/tests and regression suites cover manifest add/change/remove plus router promotion. Lifecycle broadcasting now flows through a dedicated `BackendLifecycleChannel`, allowing the router to emit normalized `connected/disconnected/recovered/failed/health-degraded` events that `TemplumCore` relays to the enhanced state manager/observability layer. All connection/discovery timeouts are now routed through the managed `AsyncUtils.createTimeout`/`createInterval` helpers so timers unref automatically and teardown can assert the active-handle budget. Live partner boots remain deferred and are tracked under `dev/tasks/phase6-validation-signal.md`. **Status:** Present (real-service run deferred post-MVP).
- Manual override manager sits between the router and discovery caches, enforcing zero-knowledge constraints (redacted service descriptors, hashed observability logs) while surfacing `apply`/`clear` controls through `TemplumCore` and the shared command registry. Automated watcher tests drop manifests into `.templum/services` to prove add/remove flows; these run in CI via the backend bundle, with partner-live runs optional post-MVP. **Status:** Present.
- Skin payload consumption now flows through `TemplumCore` → `UniversalSkinEngine`; adapters render cached backend skins without bespoke fallbacks while partner exports remain pending. The universal layout engine now normalises PCL-style `layout.items` definitions into canonical menu items so CLI/VSCode rendering stays consistent and compatibility mode reporting reflects the incoming schema. Procedural CLI windows are generated via `ContentLayoutSystem.composeWindow` and `UniversalLayoutEngine.renderForCLI`, with `EnhancedWindowSystem.renderWindowSet` exposing capability-aware window sets to the CLI adapter’s `renderMenuWindow` path. Guardrail suites (`tests/rendering/skin-payload-consumption.integration.test.ts`) now exercise the abstraction path directly, emitting deterministic `CLI_RENDER` markers and webview payloads. **Status:** Present (awaiting live backend payloads).
- Test architecture governance guardrails enforce centralized error handling on interface and backend seams. CLI/VSC adapters call `ErrorHandler.handle` in all catch clauses surfaced by `tests/interfaces/interface-session-error-handler.guardrail.test.ts`, backend auto-connect propagates templum errors for lane 4d coverage (`src/tests/backend/generic-backend-integration.test.ts`), and adaptive CLI factory helpers initialise against the abstracted session manager while maintaining legacy compatibility APIs (`src/interfaces/__tests__/adaptive-cli-integration.test.ts`). **Status:** Present.
- CLI/daemon process separation is scaffolded; IPC contracts need integration tests. **Status:** Broken.
- Observability/health monitoring blueprints exist; instrumentation must be validated before relying on metrics dashboards. Stage 6 lane 6j (2025-10-13) migrated `TemplumObservabilitySystem`, `CLIPerformanceMonitor`, risk managers, and the hybrid validation stack onto the shared `EventDrivenComponent`/`EventUtils` seams so emitters stay typed and scoped without backend-specific knowledge, but the dashboards still require end-to-end verification. Stage 6 lane 6l (2025-10-14) removed the interim scoped bus in observability, driving all metrics/risk signals through the inherited component adapter and adding regression coverage to guard the consolidated bus (`tmp/consolidation/pattern-4-stage6/lane-6l/event-driven-migration-tests.log`). **Status:** Partial (evidence captured under `tmp/consolidation/pattern-4-lane-6j/` and `tmp/consolidation/pattern-4-stage6/lane-6l/`).
- Stage 6 lane 6k (2025-10-13) extended the core engine, enhanced state manager, and protocol session harnesses with typed event assertions via a shared recorder utility. This locks in the `EventDrivenComponent` contract for initialization, command routing, IPC broadcasts, and protocol telemetry without leaking backend specifics, keeping the zero-knowledge seams defensible ahead of the remaining Stage 6 migrations. **Status:** Present (evidence logged at `dev/architecture/evidence/pattern-4-lane-6k-core-state-tests.log`).

## 2. Architecture Overview

- **Core Components:**
  - `TemplumCore` orchestrates adapters, state, and backend routing. **Status:** Present (initialises but still tied to legacy session managers).
- `ServiceDiscovery` + `ConnectionFactory` provide zero-knowledge backend connections (IPC/HTTP/WebSocket/gRPC). Timeout/abort contracts are centralised via `AsyncUtils`, and the router now guards against recursive fallback loading by tracking visited services during migrations. **Status:** Partial (local multi-protocol tests pass; partner boot captured as post-MVP follow-up).
  - `UniversalSkinEngine` is responsible for consuming `UniversalSkinDefinition` payloads (pending full implementation). **Status:** Broken (schema enforcement and payload rendering incomplete) — current work adds automatic conversion for legacy PCL layout definitions and records compatibility mode for adapters during the migration.
  - Interface adapters (`cli`, `vscode`, `command`) render skins and manage interaction state. **Status:** Present (operational yet reliant on fallback rendering). CLI now bridges into the shared session foundation via `CLISessionBridge`, has dropped its legacy caches in favour of bridge helpers, and VSCode receives the injected session manager instance; typed WebView provider registry wiring plus observability-backed activation keeps placeholder and real providers in sync, subscribes to `TemplumCore` lifecycle signals, and defers WebView messaging until a `templum:webview_ready` handshake eliminates the previous "WebView load" warnings. A lightweight fallback adapter now registers automatically for any interface missing a concrete implementation so `TemplumCore.switchInterface` and Stage 7 validation continue to pass even when the VSCode or command adapters are not initialised in-process.
  - Display stack utilities (`DisplayUtils`, `TerminalFormatter`, `WindowUtils`) expose dependency-injected seams via `configureDisplayStack(...)`, wrapping `DisplayUtils.configure`, `WindowUtils.configure`, and `TerminalFormatter.configure` so CLI/session surfaces share formatter, logger, and column providers without importing `chalk` directly. **Status:** Present.
- **Data/Control Flow:**
  - Backends publish skins that discovery ingests. **Status:** Absent (partner exports not yet available). Practical Developer Guide notifications, design review acknowledgements, sprint risk prompts, and backlog tooling banners will arrive as skin elements emitted by Phoenix Code Lite; Templum will simply render them once available.
  - Discovery registers services and hydrates connection factories. **Status:** Partial (manifest-led integration works; live partner start deferred post-MVP).
  - Command router/skin engine expose functionality across adapters. **Status:** Broken (skin-driven output still falls back to hardcoded menus).
- **Integration Points:**
  - Haruspex backend (analysis) and Phoenix Code Lite (QMS tooling) will expose skins consumed by Templum. **Status:** Absent (waiting on partner exports).
  - Validation System results need to surface through observability hooks for compliance workflows. **Status:** Broken (instrumentation wiring incomplete).

## 3. Ideal Requirements vs. Status

| Requirement                         | Status | Notes                                             |
| ----------------------------------- | ------ | ------------------------------------------------- |
| Zero-knowledge backend registry     | `[~]`  | Local suites green; real backend run deferred to post-MVP follow-up. |
| Versioned skin contract enforcement | `[x]`  | Ajv-backed validator enforces the canonical schema, emits registration metadata, and contract/adapter suites cover rejection flows. |
| Unified session/context layer       | `[~]`  | Core now constructs a single `TemplumUniversalSessionManager` shared by adapters; CLI uses the bridge wrapper, VSCode receives the injected manager, follow-up work is tightening interaction-manager syncing. |
| Skin-driven CLI/VSCode UI           | `[x]`  | Adapters render cached/backend skins via `UniversalSkinEngine`; fallback scaffolds removed pending live payload validation. |
| Observability instrumentation       | `[?]`  | Blueprint archived; confirm runtime wiring.       |
| Haruspex backend integration        | `[~]`  | Pending skin output + API alignment.              |
| PCL skin ingestion                  | `[ ]`  | Awaiting PCL exporter prototype.                  |

(Refer to `docs/current/progress.md` for the full matrix.)

## 4. Operational Considerations

- **Observability:** Centralised logging/metrics planned (`observability/templum-observability-system.ts`); ensure instrumentation before enabling production dashboards. **Status:** Broken.
- **Display Stack Management:** Configure CLI/session layout helpers via `configureDisplayStack`/`resetDisplayStack`, which wrap `DisplayUtils.configure`, `WindowUtils.configure`, and `TerminalFormatter.configure` to keep formatter + column providers aligned with `dev/architecture/display-stack-alignment.md`. **Status:** Present.
- **Deployment:** Supports headless daemon + separate CLI/VSCode interfaces once process separation stabilises. **Status:** Broken.
- **Compliance:** Must provide traceable logs and health reports for regulated workflows; integrate with Validation System once categories are defined. **Status:** Absent.

### Phase 6 Validation CLI Reference

| Command                                                                              | Purpose                                                                                                          | Defaults                                                                                                           | Real Backend Trigger                                                                                                                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run phase6-validation`                                                          | Build artifacts then execute the Phase 6 suite against mock backends with contract enforcement.                  | Sets `PHASE6_USE_REAL_BACKENDS=0`, `PHASE6_SKIP_HARUSPEX=1`; fails fast on payload drift via mock harness schemas. | Opt in later with env or flags when needed.                                                                                                                                |
| `npm run phase6-validation:full`                                                     | Dual-run helper that always executes the mock pass and, when enabled, immediately repeats against live services. | Respects `PHASE6_SKIP_BUILD=1` / `--no-build` to reuse dist output.                                                | Set `PHASE6_RUN_REAL=1` (or pass `--real`/`--with-real`) to append the real backend pass; exports `PHASE6_USE_REAL_BACKENDS=1`, `PHASE6_SKIP_HARUSPEX=0` automatically.    |
| `npm run phase6-validation:real`                                                     | Direct real-backend sweep without the mock pre-run (pipelines that already trust mocks).                         | Rebuilds before execution; expects services reachable.                                                             | Always runs with real backends; mock harness unused.                                                                                                                       |
| `npm run phase6-health`                                                              | Health probe sequence against mock services (contract-validated).                                                | Same default env as `phase6-validation`.                                                                           | Use `--use-real-backends` flag or env override to hit live services.                                                                                                       |
| `npm run phase6-health:real`                                                         | Health probe sequence against live services.                                                                     | Rebuilds before execution.                                                                                         | Always targets real services.                                                                                                                                              |
| `node dist/src/scripts/run-phase6-integration-validation.js run --use-real-backends` | Low-level entry point for custom automation.                                                                     | Caller manages env flags.                                                                                          | Passing `--use-real-backends` (or setting `PHASE6_USE_REAL_BACKENDS=1`) enables real services; pair with `PHASE6_SKIP_HARUSPEX=0` once Haruspex availability is confirmed. |

**Environment knobs:**

- `PHASE6_USE_REAL_BACKENDS` — boolean-like flag parsed by the CLI (`1`/`true` vs `0`/`false`).
- `PHASE6_SKIP_HARUSPEX` — temporary guard; defaults to `1` during mock runs until the Haruspex harness is reinstated.
- `PHASE6_RUN_REAL` — toggles the real segment inside `phase6-validation:full`.
- `PHASE6_SKIP_BUILD` — skip the build step for dual runs when dist artifacts are current.

Mock orchestration now validates request/response contracts via `Templum/src/tests/mock-backend-contracts.ts`; any mismatch surfaces as a `Mock contract violation` before real services are touched.

> **Phase 6 status (2025-10-06):** The harness now emits deterministic `passed`/`skipped` outcomes for mock runs and stores raw reports in `validation-reports/`. Mock executions capture real timings, memory deltas, and error paths via the consolidated mock harness; live backend baselines remain tracked in `dev/tasks/phase6-validation-signal.md` and will be enabled once partner services are online.

## 5. Outstanding Work & Risks

- Full skin-driven UI and CLI refactor remain the largest blockers.
- Observability and health monitoring require implementation proof before go-live.
- Need reliable session/context management to keep adapters in sync.
- Dependency on backend teams for compliant skin emission (Haruspex, PCL).
- Over-engineering risk—prioritise MVP features before extending “enterprise” capabilities.

## 6. Verification & Validation

### Test Taxonomy & Coverage Bands

| Suite                               | Scope & Entry Points                                                                                                           | Coverage Thresholds (statements/branches/functions/lines) | Notes                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Unit** (`jest.config.js`)         | `src/**`, `tests/**` (core services, adapters, utilities, session contracts)                                                   | ≥30 / 22 / 30 / 30                                         | Aggregated into `coverage/unit`; reporters `text`, `lcov`, `html`, `json-summary`.                               |
| **Backend integration** (`jest.backend.config.js`) | `tests/backend/**/*.integration.test.ts`, `tests/backend/comprehensive-backend-validation.test.ts` (connection factory, discovery, manual override flow) | ≥20 / 12 / 20 / 20                                         | Serialised (`maxWorkers:1`) to avoid port conflicts; coverage landed in `coverage/backend`.                     |
| **E2E** (`jest.e2e.config.js`)      | `tests/e2e/**/*.test.ts` (CLI/VSCode orchestration, scenario harness, cross-interface telemetry)                               | ≥35 / 12 / 30 / 35                                         | Focused on harness determinism; runs with mocked backends, coverage written to `coverage/e2e`.                   |
| **Aggregate governance**            | Union of all suites via `npm run coverage:governance`                                                                           | ≥32 / 22 / 32 / 32                                         | `scripts/coverage-reality-check.js` merges summaries, enforces suite bands, and records `.coverage-history.json`. |

### Governance Flow

- **Primary command:** `npm run coverage:governance` executes the unit, backend, and e2e configs sequentially, merges their `coverage-summary.json` artefacts, and fails the run if any suite or the aggregate drops below the thresholds above.
- **History & trend analysis:** `scripts/coverage-reality-check.js` keeps a bounded `.coverage-history.json` (50 entries) so regressions are visible when the command is re-run locally or in CI. Trend output is surfaced alongside the threshold report.
- **Pre-commit hooks:** `scripts/check-tests.js` invokes the governance flow unless `--skip-governance` is passed (the pre-commit script runs `check:tests -- --skip-governance` followed by an explicit `npm run coverage:governance` to surface failures early).
- **CI enforcement:** `npm run test:ci` now runs the leak-guarded Jest pass followed by `npm run coverage:governance`, so every pipeline verifies suite health and coverage thresholds together.
- **Documentation discipline:** any change that alters the taxonomy or thresholds must update this section, the testing guide, and the active task tracker (`dev/tasks/test-architecture-governance.md`) in the same change set.

## Appendix

- **Reference Docs:** `docs/current/testing-guide.md`, `docs/target/ValidationSystem-V3C-Documentation.md`, `docs/archive/observability-infrastructure.md`, `docs/archive/TEST-HEALTH-MONITORING.md` for historical context.
- **Task Logs:** See `dev/tasks/` for active requirement breakdowns.

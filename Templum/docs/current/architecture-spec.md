---
doc-type: architecture-spec
title: Templum Architecture Specification
tags: [templum, universal_interface, architecture]
status: current
last_updated: 2025-10-06
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

- Backend discovery (`ServiceDiscovery`, `ConnectionFactory`) enumerates locally registered services; watcher overrides keep `.templum/services` scoped to the active workspace/tests and regression suites cover manifest add/change/remove plus router promotion. Live partner boots remain deferred and are tracked under `dev/tasks/phase6-validation-signal.md`. **Status:** Present (real-service run deferred post-MVP).
- Skins are not yet produced by backends; renderer still mixes hardcoded menus with skin stubs. **Status:** Absent.
- CLI/daemon process separation is scaffolded; IPC contracts need integration tests. **Status:** Broken.
- Observability/health monitoring blueprints exist; instrumentation must be validated before relying on metrics dashboards. **Status:** Broken.

## 2. Architecture Overview

- **Core Components:**
  - `TemplumCore` orchestrates adapters, state, and backend routing. **Status:** Present (initialises but still tied to legacy session managers).
  - `ServiceDiscovery` + `ConnectionFactory` provide zero-knowledge backend connections (IPC/HTTP/WebSocket/gRPC). **Status:** Partial (local multi-protocol tests pass; partner boot captured as post-MVP follow-up).
  - `UniversalSkinEngine` is responsible for consuming `UniversalSkinDefinition` payloads (pending full implementation). **Status:** Broken (schema enforcement and payload rendering incomplete).
  - Interface adapters (`cli`, `vscode`, `command`) render skins and manage interaction state. **Status:** Present (operational yet reliant on fallback rendering). CLI now bridges into the shared session foundation via `CLISessionBridge`, and VSCode receives the injected session manager instance; the interaction manager still needs to move off local caches.
  - Display stack utilities (`DisplayUtils`, `TerminalFormatter`, `WindowUtils`) expose dependency-injected seams via `configureDisplayStack(...)`, wrapping `DisplayUtils.configure`, `WindowUtils.configure`, and `TerminalFormatter.configure` so CLI/session surfaces share formatter, logger, and column providers without importing `chalk` directly. **Status:** Present.
- **Data/Control Flow:**
  - Backends publish skins that discovery ingests. **Status:** Absent (partner exports not yet available).
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
| Skin-driven CLI/VSCode UI           | `[ ]`  | Renderer refactor outstanding.                    |
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

- Smoke tests: run backend discovery against stub backend; exercise CLI wire-up once skin support lands.
- Plan for automated validation using Validation System categories once skin/command execution is in place.
- Manual checklist: follow `meta/DOC_CHANGE_CHECKLIST.md` when modifying architecture-critical components.

## Appendix

- **Reference Docs:** `docs/target/ValidationSystem-V3C-Documentation.md`, `docs/archive/observability-infrastructure.md`, `docs/archive/TEST-HEALTH-MONITORING.md` for historical context.
- **Task Logs:** See `dev/tasks/` for active requirement breakdowns.

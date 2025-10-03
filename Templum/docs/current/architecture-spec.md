---
doc-type: architecture-spec
title: Templum Architecture Specification
tags: [templum, universal_interface, architecture]
status: current
last_updated: 2025-09-22
---

# Templum — Architecture Specification (Current State)

## 0. Summary

- **Purpose:** Universal interface orchestrator that renders backend-defined skins across CLI, VSCode, and future interfaces without hardcoded knowledge.
- **Current Status:** In migration—backend discovery works, but the skin-driven UI and shared session model still need implementation/verification.
- **Key Dependencies:** Haruspex and Phoenix Code Lite backends; Validation System for runtime checks.
- **Documentation Links:** [progress](docs/current/progress.md), [testing guide](docs/current/testing-guide.md), [V3C](docs/target/ValidationSystem-V3C-Documentation.md), pattern references under `dev/patterns/`.

## 1. Current State Snapshot
>
> ⚠️ **Needs Verification:** Skin rendering pipeline, CLI refactor, and observability wiring are documented but not proven end-to-end.
>
> 🧭 **In Progress:** Backend router refactor, shared session/context work, and Haruspex integration.

- Backend discovery (`ServiceDiscovery`, `ConnectionFactory`) enumerates locally registered services but requires regression testing after recent refactors.
- Skins are not yet produced by backends; renderer still mixes hardcoded menus with skin stubs.
- CLI/daemon process separation is scaffolded; IPC contracts need integration tests.
- Observability/health monitoring blueprints exist; instrumentation must be validated before relying on metrics dashboards.

## 2. Architecture Overview

- **Core Components:**
  - `TemplumCore` orchestrates adapters, state, and backend routing.
  - `ServiceDiscovery` + `ConnectionFactory` provide zero-knowledge backend connections (IPC/HTTP/WebSocket/gRPC).
  - `UniversalSkinEngine` is responsible for consuming `UniversalSkinDefinition` payloads (pending full implementation).
  - Interface adapters (`cli`, `vscode`, `command`) render skins and manage interaction state.
  - Display stack utilities (`DisplayUtils`, `TerminalFormatter`, `WindowUtils`) expose dependency-injected seams via `configureDisplayStack(...)`, wrapping `DisplayUtils.configure`, `WindowUtils.configure`, and `TerminalFormatter.configure` so CLI/session surfaces share formatter, logger, and column providers without importing `chalk` directly.
- **Data/Control Flow:** Backends publish skins → discovery registers service → connection factory establishes protocol → command router/skin engine expose functionality across adapters.
- **Integration Points:**
  - Haruspex backend (analysis) and Phoenix Code Lite (QMS tooling) will expose skins consumed by Templum.
  - Validation System results need to surface through observability hooks for compliance workflows.

## 3. Ideal Requirements vs. Status

| Requirement                         | Status | Notes                                             |
| ----------------------------------- | ------ | ------------------------------------------------- |
| Zero-knowledge backend registry     | `[~]`  | Discovery works; re-verify health/priority logic. |
| Versioned skin contract enforcement | `[~]`  | Schema validation planned; tests missing.         |
| Unified session/context layer       | `[ ]`  | See `dev/tasks/unified-session-layer.md`.         |
| Skin-driven CLI/VSCode UI           | `[ ]`  | Renderer refactor outstanding.                    |
| Observability instrumentation       | `[?]`  | Blueprint archived; confirm runtime wiring.       |
| Haruspex backend integration        | `[~]`  | Pending skin output + API alignment.              |
| PCL skin ingestion                  | `[ ]`  | Awaiting PCL exporter prototype.                  |

(Refer to `docs/current/progress.md` for the full matrix.)

## 4. Operational Considerations

- **Observability:** Centralised logging/metrics planned (`observability/templum-observability-system.ts`); ensure instrumentation before enabling production dashboards.
- **Display Stack Management:** Configure CLI/session layout helpers via `configureDisplayStack`/`resetDisplayStack`, which wrap `DisplayUtils.configure`, `WindowUtils.configure`, and `TerminalFormatter.configure` to keep formatter + column providers aligned with `dev/architecture/display-stack-alignment.md`.
- **Deployment:** Supports headless daemon + separate CLI/VSCode interfaces once process separation stabilises.
- **Compliance:** Must provide traceable logs and health reports for regulated workflows; integrate with Validation System once categories are defined.

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

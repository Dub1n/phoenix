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
- **Documentation Links:** `docs/current/progress.md`, `docs/target/ValidationSystem-V3C-Documentation.md`, pattern references under `dev/patterns/`.

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
- **Data/Control Flow:** Backends publish skins → discovery registers service → connection factory establishes protocol → command router/skin engine expose functionality across adapters.
- **Integration Points:**
  - Haruspex backend (analysis) and Phoenix Code Lite (QMS tooling) will expose skins consumed by Templum.
  - Validation System results need to surface through observability hooks for compliance workflows.

## 3. Ideal Requirements vs. Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Zero-knowledge backend registry | `[~]` | Discovery works; re-verify health/priority logic. |
| Versioned skin contract enforcement | `[~]` | Schema validation planned; tests missing. |
| Unified session/context layer | `[ ]` | See `dev/tasks/unified-session-layer.md`. |
| Skin-driven CLI/VSCode UI | `[ ]` | Renderer refactor outstanding. |
| Observability instrumentation | `[?]` | Blueprint archived; confirm runtime wiring. |
| Haruspex backend integration | `[~]` | Pending skin output + API alignment. |
| PCL skin ingestion | `[ ]` | Awaiting PCL exporter prototype. |

(Refer to `docs/current/progress.md` for the full matrix.)

## 4. Operational Considerations

- **Observability:** Centralised logging/metrics planned (`observability/templum-observability-system.ts`); ensure instrumentation before enabling production dashboards.
- **Deployment:** Supports headless daemon + separate CLI/VSCode interfaces once process separation stabilises.
- **Compliance:** Must provide traceable logs and health reports for regulated workflows; integrate with Validation System once categories are defined.

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

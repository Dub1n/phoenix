---
doc-type: architecture-spec
title: Haruspex Architecture Specification
tags: [haruspex, analysis_backend, architecture]
status: current
last_updated: 2025-09-22
---
---

# Haruspex — Architecture Specification (Current State)

## 0. Summary
- **Purpose:** Pure backend service providing codebase analysis/visualisation for Templum interfaces.
- **Current Status:** In migration from VSCode extension to standalone HTTP backend; deterministic analysis focus (prediction features deferred).
- **Key Dependencies:** Templum integration (skin + auto-registration), Validation System for execution checks.
- **Documentation Links:** `docs/current/progress.md`, `dev/03-debugging/`, `dev/tasks/backend-skin-generator.md`.

## 1. Current State Snapshot
> ⚠️ **Needs Verification:** HTTP handlers and analysis outputs still rely on extension-era components; verify runtime without VSCode.
>
> 🧭 **In Progress:** Backend refactor, skin endpoint implementation, CLI debugging tooling.

- Backend entry point (`src/backend-main.ts`) boots listeners but handlers return placeholder data.
- Skin payload generation now exists through `provideSkinDefinition()` and conforms to Templum's public JSON schema; live `/getSkinDefinition` endpoint verification remains pending.
- Analysis pipeline reuses documentation tree providers rather than full code graph.
- VSCode components still exist—extension decoupling incomplete.
- Debug CLI/IPC tooling design complete but unimplemented.

## 2. Architecture Overview
- **Core Components:**
  - `AnalysisEngine` (planned) to produce deterministic repository insights.
  - `DiagnosticSystem`, `CacheManager`, `ModelManager` scaffolds exist; require refit for deterministic analytics.
  - `HTTPGateway` intended for REST/WebSocket skin + analysis endpoints.
- **Data/Control Flow:** Repository ingestion → analysis jobs → cached results → HTTP API → Templum skin presentation.
- **Integration Points:**
  - Templum auto-registration and the Templum-owned skin contract.
  - PCL/Validation System for cross-project traceability.

## 3. Ideal Requirements vs. Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Deterministic analysis pipeline | `[?]` | Documented but still relies on extension scaffolding.
| Skin endpoint for Templum | `[~]` | `provideSkinDefinition()` now emits a Templum-conforming payload; endpoint/runtime verification still required. |
| Frontmatter enrichment workflow | `[ ]` | Job runner not yet implemented.
| Backend independent of VSCode APIs | `[!]` | Extension components remain; migration required.
| Job scheduling/progress tracking | `[ ]` | Pending design implementation.
| Observability/audit logs | `[ ]` | To be designed alongside analysis pipeline.

## 4. Operational Considerations
- Requires secure file system access to analysed repositories; ensure sandboxing.
- Logging/auditing must capture analysis requests/results for compliance.
- Deployment target: standalone Node.js service with HTTP/WebSocket APIs.

## 5. Outstanding Work & Risks
- Replace placeholder analysis responses with real deterministic metrics.
- Implement skin generator exposing dashboards/detail views.
- Remove VSCode extension artefacts to avoid hidden dependencies.
- Ensure performance and caching strategies exist for large repositories.
- Confirm security posture when manipulating repository contents (frontmatter editing).

## 6. Verification & Validation
- Smoke test backend by running `node dist/src/backend-main.js` and exercising health/analysis endpoints.
- Validate skin payloads against Templum's public JSON schema; Haruspex does not own a separate canonical skin definition.
- Use Validation System to run backend category checks after migration.

## Appendix
- Historical specs archived under `docs/archive/` for reference.
- Debug architecture plans in `dev/03-debugging/05.5-Agent-Debugging-Architecture.md`.

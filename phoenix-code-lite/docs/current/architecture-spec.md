---
doc-type: architecture-spec
title: Phoenix Code Lite Architecture Specification
tags: [phoenix-code-lite, qms, architecture]
status: current
last_updated: 2025-09-22
---
---

# Phoenix Code Lite — Architecture Specification (Current State)

## 0. Summary
- **Purpose:** Transform Phoenix Code Lite into a QMS-focused workflow engine supplying regulated development artefacts and exposing skin-driven interfaces via Templum.
- **Current Status:** Architectural redesign complete on paper; implementation still carries legacy Claude/TDD workflows.
- **Key Dependencies:** Templum (skin consumer), Validation System (validator execution), Haruspex (analysis integration).
- **Documentation Links:** `docs/current/progress.md`, `docs/03-PCL-QMS/`, `dev/tasks/skin-exporter.md`.

## 1. Current State Snapshot
> ⚠️ **Needs Verification:** Most QMS-specific features exist only in documentation; codebase still dominated by agent-driven workflow logic.
>
> 🧭 **In Progress:** QMS model consolidation, skin exporter design, validator integration planning.

- QMS domain models/roadmaps documented under `docs/03-PCL-QMS/`.
- Existing CLI/UI still render legacy menus; no skin exporter available.
- Validation System integration plan unresolved.
- Claude-specific modules remain in `src/claude/`.

## 2. Architecture Overview
- **Core Components (target):**
  - QMS data layer managing requirements, risks, verification, releases.
  - Workflow orchestrator generating artefacts, running validators, preparing release packages.
  - Skin exporter bridging QMS data to Templum.
- **Data/Control Flow (desired):** Requirements intake → traceability updates → validation execution → documentation/export → skin update.
- **Integration Points:**
  - Validation System categories invoked programmatically.
  - Templum skins for dashboards and release workflows.
  - Possible Haruspex analysis data ingestion.

## 3. Ideal Requirements vs. Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Traceability model with audit history | `[~]` | Models drafted; implementation audit pending.
| Workflow automation with gated transitions | `[ ]` | Requires new orchestration layer.
| QMS artefact generation (forms/reports) | `[ ]` | Not yet implemented.
| Validation System integration | `[ ]` | Map categories + blocking logic.
| Skin exporter for Templum | `[ ]` | See `dev/tasks/skin-exporter.md`.
| Release package/bundle creation | `[ ]` | To be designed.

## 4. Operational Considerations
- Must satisfy regulated environment requirements (audit logs, immutable history, electronic signatures where applicable).
- Needs deterministic exports for submissions (PDF/Markdown bundles).
- When integrated with Templum, skins must respect role-based access and traceability references.

## 5. Outstanding Work & Risks
- Remove or isolate legacy Claude workflow code to prevent conflicts.
- Implement QMS data model with persistence/audit.
- Build skin exporter and ensure Templum compatibility.
- Align Validation System outputs with QMS lifecycle.
- Risk of scope creep—focus on core QMS deliverables before advanced automation.

## 6. Verification & Validation
- After implementation, run `npm run build`, unit tests, and dedicated QMS validation suites.
- Add integration validations covering traceability matrices and validator gating.
- Follow `meta/DOC_CHANGE_CHECKLIST.md` when modifying architecture-critical components.

## Appendix
- Target-state documentation: `docs/03-PCL-QMS/` directory.
- Archived legacy specs: `docs/archive/`.

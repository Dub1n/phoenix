---
doc-type: architecture-spec
title: Phoenix Code Lite Architecture Specification
tags: [phoenix-code-lite, qms, architecture]
status: current
last_updated: 2025-02-15
---
---

# Phoenix Code Lite — Architecture Specification (Current State)

## 0. Summary
- **Purpose:** Transform Phoenix Code Lite into an internal QMS workflow engine that converts regulatory source material into actionable development data, guides teams through compliance tasks, automates evidence capture, and exposes skin-driven interfaces via Templum.
- **Scope Note:** PCL itself is not a regulated device; its mission is to help the VDL2 product satisfy EN 62304, MDR, FDA, and related obligations with minimal friction for development teams.
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
  - **Regulation ingestion layer** *(Status: Absent)* — intended to assist teams in capturing classifications, requirements, and obligations from MDR/62304/etc.; no ingest workflow or schema implementation exists yet beyond planning docs.
  - **QMS data layer** *(Status: Partial/Broken)* — legacy analyzers and validators produce ad-hoc structures; canonical traceability types, catalogs, and persistence are still missing.
  - **Workflow assistance & automation engine** *(Status: Present — Legacy implementation)* — current code still runs the Claude/TDD orchestrator; QMS-specific lifecycle gating, signatures, and validator hooks have not replaced it.
  - **Skin exporter bridge to Templum** *(Status: Absent)* — no exporter modules or skin payload generation exist in the codebase.
- **Data/Control Flow (desired):** Regulation intake/classification → requirement modelling → traceability updates → validation execution → documentation/export → skin update.
- **Integration Points:**
  - Validation System categories invoked programmatically.
  - Templum skins for dashboards and release workflows.
  - Possible Haruspex analysis data ingestion.
  - External or curated regulatory content repositories feeding the ingestion layer.

## 3. Ideal Requirements vs. Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Traceability model with audit history | `[~]` | Models drafted; implementation audit pending.
| Regulation ingestion & classification tooling | `[ ]` | Guided workflows/assisted parsing not yet implemented; data schemas for obligations pending.
| Guided compliance workflow engine | `[ ]` | Needs contextual guidance, checklists, SOP links embedded into skin-driven UI.
| Workflow automation with gated transitions | `[ ]` | Requires new orchestration layer.
| QMS artefact generation (forms/reports) | `[ ]` | Not yet implemented.
| Validation System integration | `[ ]` | Map categories + blocking logic.
| Skin exporter for Templum | `[ ]` | See `dev/tasks/skin-exporter.md`.
| Release package/bundle creation | `[ ]` | To be designed.

## 4. Operational Considerations
> Status: Absent — Operational safeguards (immutable logs, signatures, deterministic exports) are documented but not yet enforced in runtime code.
- Must produce regulated-environment-ready outputs (audit logs, immutable history, electronic signatures where applicable) even though the tooling itself is internal.
- Needs deterministic exports for submissions (PDF/Markdown bundles).
- When integrated with Templum, skins must respect role-based access, traceability references, and guided workflow states.

## 5. Outstanding Work & Risks
> Status: Known gaps — Entire QMS feature set still pending implementation; legacy workflows remain active.
- Remove or isolate legacy Claude workflow code to prevent conflicts.
- Implement QMS data model with persistence/audit.
- Design and ship the regulation ingestion/normalisation workflows (guided UI, assisted parsing, schema validation).
- Implement guided workflow surfaces (checklists, SOP shortcuts, contextual help) through skin output.
- Build skin exporter and ensure Templum compatibility.
- Align Validation System outputs with QMS lifecycle.
- Risk of scope creep—focus on core QMS deliverables before advanced automation.

## 6. Verification & Validation
> Status: Absent — QMS-specific validation suites and acceptance tests have not been authored; only the environment preparation suite currently runs.
- After implementation, run `npm run build`, unit tests, and dedicated QMS validation suites.
- Add integration validations covering traceability matrices and validator gating.
- Include scenario tests that run the regulation ingestion pipeline against curated MDR/62304 samples and verify resulting classifications/requirements.
- Add guided workflow acceptance tests ensuring generated skins surface the correct instructions, checklists, and blocking rules per regulatory obligation.
- Follow `meta/DOC_CHANGE_CHECKLIST.md` when modifying architecture-critical components.

## Appendix
- Target-state documentation: `docs/03-PCL-QMS/` directory.
- Archived legacy specs: `docs/archive/`.

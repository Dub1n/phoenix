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
  - Regulation ingestion layer that assists teams in capturing classifications, requirements, and obligations from MDR/62304/etc. via guided workflows or assisted parsing.
  - QMS data layer managing requirements, risks, verification, releases, and regulatory metadata.
  - Workflow assistance & automation engine generating artefacts, guiding users, running validators, preparing release packages.
  - Skin exporter bridging QMS data and workflows to Templum so guidance lives inside shared interfaces.
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
- Must produce regulated-environment-ready outputs (audit logs, immutable history, electronic signatures where applicable) even though the tooling itself is internal.
- Needs deterministic exports for submissions (PDF/Markdown bundles).
- When integrated with Templum, skins must respect role-based access, traceability references, and guided workflow states.

## 5. Outstanding Work & Risks
- Remove or isolate legacy Claude workflow code to prevent conflicts.
- Implement QMS data model with persistence/audit.
- Design and ship the regulation ingestion/normalisation workflows (guided UI, assisted parsing, schema validation).
- Implement guided workflow surfaces (checklists, SOP shortcuts, contextual help) through skin output.
- Build skin exporter and ensure Templum compatibility.
- Align Validation System outputs with QMS lifecycle.
- Risk of scope creep—focus on core QMS deliverables before advanced automation.

## 6. Verification & Validation
- After implementation, run `npm run build`, unit tests, and dedicated QMS validation suites.
- Add integration validations covering traceability matrices and validator gating.
- Include scenario tests that run the regulation ingestion pipeline against curated MDR/62304 samples and verify resulting classifications/requirements.
- Add guided workflow acceptance tests ensuring generated skins surface the correct instructions, checklists, and blocking rules per regulatory obligation.
- Follow `meta/DOC_CHANGE_CHECKLIST.md` when modifying architecture-critical components.

## Appendix
- Target-state documentation: `docs/03-PCL-QMS/` directory.
- Archived legacy specs: `docs/archive/`.

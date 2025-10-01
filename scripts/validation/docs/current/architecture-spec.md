---
title: Validation System Architecture Specification
tags: [validation-system, architecture]
status: current
last_updated: 2025-09-22
---

# Validation System — Architecture Specification (Current State)

## 0. Summary
- **Purpose:** Modular validation orchestrator that runs category-based validators across projects with deterministic execution.
- **Current Status:** Core orchestrator operational; advanced governance (policy engine, observability) pending.
- **Key Dependencies:** Per-project valconfig files, Phoenix Code Lite QMS workflows, Templum (future UI integration).
- **Documentation Links:** `docs/current/progress.md`, `dev/tasks/policy-engine.md`, `docs/target/architecture/`.

## 1. Current State Snapshot
> ⚠️ **Needs Verification:** Re-run backend/ui/build categories for each project to ensure scripts and configs still align.
>
> 🧭 **In Progress:** Policy engine design, refreshed documentation/CI wiring, Templum visualization experiments.

- CLI orchestrator executes existing categories using name-based configs; success depends on up-to-date project commands.
- Extension workflow for submitting new validators works but lacks recent validation.
- Governance features (policy enforcement, audit logs) are planned but not implemented.

## 2. Architecture Overview
- **Core Components:**
  - Orchestrator (`src/core/enhanced-orchestrator.js`) coordinates validator execution with safety checks.
  - Validator modules under `src/validators/` implement category-specific logic.
  - Configuration layer (`config/projects/*.json`) maps projects to commands, timeouts, report locations.
- **Data/Control Flow:** CLI invocation → project config resolution → validator pipeline execution → report output (`dev/validation-results/`).
- **Integration Points:**
  - Phoenix Code Lite QMS workflow (future automated gating).
  - Templum UI (planned skin integration for monitoring results).

## 3. Ideal Requirements vs. Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Deterministic orchestrator with sandboxing | `[?]` | Requires fresh smoke tests.
| Validator dependency graph support | `[ ]` | Task: policy engine + orchestrator updates.
| Config discovery with schema validation | `[ ]` | Pending implementation.
| Standardised machine-readable outputs | `[~]` | Some JSON outputs exist; needs consolidation.
| Policy engine for release gating | `[ ]` | See `dev/tasks/policy-engine.md`.
| Observability/audit logging | `[ ]` | Not yet implemented.
| Templum skin metadata | `[ ]` | Future integration.

## 4. Operational Considerations
- Ensure Node.js/runtime versions align with project requirements (Node 18+).
- Validators may execute project build/test commands—enforce project-level safety.
- Reports stored under project-specific paths; integrate with QMS reporting once stable.

## 5. Outstanding Work & Risks
- Validate existing categories for each project to avoid silent drift.
- Implement policy engine to block releases lacking required validators.
- Standardise result outputs for QMS consumption.
- Add audit/observability hooks to track executions and failures.
- Plan for skin/UX integration (Templum) without overloading CLI output.

## 6. Verification & Validation
- Commands: `node src/core/enhanced-orchestrator.js --category <cat> --project <proj>`; run key categories regularly.
- Validate per-project configs after significant repo changes.
- Use `meta/DOC_CHANGE_CHECKLIST.md` when modifying orchestrator/validators.

## Appendix
- Legacy quick-start/usage details can be found in `docs/target/architecture/VALIDATION-SYSTEM-ARCHITECTURE-README.md` and `docs/current/guides/`.

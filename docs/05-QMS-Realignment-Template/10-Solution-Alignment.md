# Solution Alignment Matrix

This document connects each aim/objective to the capabilities of the active projects (Templum, Phoenix Code Lite, Haruspex, Validation System). The goal is to demonstrate how the existing roadmap satisfies the QMS problem space, while exposing integration gaps.

## Instructions

1. Copy aims/objectives from `05-Aims-and-Objectives.md`.
2. For every objective, identify the project feature(s) that provide or will provide the required capability using `meta/ARCHITECTURE.md` target-state descriptions.
3. Capture the integration strategy (what needs to be built or wired together) and the current maturity.
4. Highlight gaps so they can feed `20-Progress-and-Gaps.md` and project backlogs.

## Alignment Table

| Aim / Objective                                                                       | Required Capability                | Project Feature (Ideal State)                                                                | Implementation & Integration Notes                                                    | Current Maturity                                              | Remaining Gaps / Next Steps                                                      |
| ------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Reference the aim and objective (e.g. Compliance Evidence → Traceability automation). | Describe the functionality needed. | Link to the project and capability that fulfils it (e.g. PCL: automated document generator). | Outline how the capability will be realised (APIs, skin contracts, validation hooks). | Use a simple scale such as `Planned`, `In Progress`, `Ready`. | List actions, blockers, or dependencies (e.g. needs cybersecurity requirements). |

> Tip: keep one row per objective to avoid losing detail. If multiple projects support the same objective, add additional rows with the same objective but different feature entries.

## Narrative Summary

- Summarise where the current architecture already covers the objectives versus where new work is required.
- Highlight any places where existing scope should be trimmed or re-sequenced to serve the QMS priorities.
- Note assumptions (e.g. Validation System can host quality gates once Phase 6 harness is stable).

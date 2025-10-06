# QMS Realignment Onboarding Guide

Welcome to the QMS realignment effort. This initiative focuses on aligning our internal tooling (Templum, Phoenix Code Lite, Haruspex, Validation System) so VDL2’s regulated delivery can rely on generated evidence and guided workflows. Follow this guide to stay consistent with repo governance (`dev/notes/AGENTS.md`) and the architecture framework (`meta/ARCHITECTURE.md`).

## 1. Prerequisites & Orientation

- **Read first**: `docs/00-QMS/Info.md`, `meta/ARCHITECTURE.md`, `Templum/docs/current/architecture-spec.md`, `phoenix-code-lite/docs/current/architecture-spec.md`, `scripts/validation/docs/current/architecture-spec.md`.
- **Understand legacy context**: skim filenames inside `docs/00-QMS/Docs/` (current SOP bundle) and the optimistic PCL docs (`docs/03-PCL-QMS/03-QMS-via-PCL.md`, `docs/03-PCL-QMS/10-QMS-Explanation.md`).
- **Environment checks**: Node.js 20.x, repo dependencies installed (`npm install` in `Templum/` and `Templum/examples/minimal-backend/`), Phase 6 harness health when touching validation (`npm run phase6-health`).
- **Open questions**: IEC 62304 safety classification for VDL2 still pending confirmation; cybersecurity scope undecided; patient data handling intentionally out of scope for now.

## 2. Working Folder Structure

- `00-Problem-Statement.md`: capture latest drivers and constraints for supporting VDL2.
- `01-Aims-and-Objectives.md`: define measurable targets for the internal tooling.
- `02-Solution-Alignment.md`: map aims to Templum/PCL/Haruspex/Validation System capabilities.
- `03-Traceability-Matrix.md`: connect VDL2 requirements → aims → tooling features → evidence.
- `04-Progress-and-Gaps.md`: log maturity, next actions, unresolved items.
- `templates/`: reusable skeletons—reference instead of editing directly.

## 3. Standard Workflow

1. **Pull latest changes**; skim `04-Progress-and-Gaps.md` for current state.
2. **Update problem context** if new facts emerged (regulatory decisions, architecture shifts).
3. **Adjust aims/objectives** to reflect new priorities or evidence.
4. **Reconcile solution alignment** with project updates—capture integration notes and maturity.
5. **Extend traceability matrix** when new requirements or evidence appear.
6. **Log progress & gaps**; note outstanding decisions and next actions.
7. **Sync documentation**: when work impacts other repos/docs, update their progress trackers per `meta/DOC_CHANGE_CHECKLIST.md`.

## 4. Roles & Responsibilities

- **Regulatory Lead**: validates safety classification, ensures aims reflect VDL2 compliance needs, signs off traceability entries.
- **Technical Lead(s)** (Templum/PCL/Haruspex/Validation System): keep project capabilities and integration notes accurate.
- **Quality/Validation Owner**: curates evidence sources, Phase 6 logs, audit packages demonstrating the tooling’s output.
- **Contributors**: follow this guide, keep templates intact, document questions in the progress log.

## 5. Contribution Checklist

Before committing or handing off:

- [ ] Templates untouched; working docs updated using prompts.
- [ ] References added for any new evidence (command logs, documents).
- [ ] `04-Progress-and-Gaps.md` reflects changes and open issues.
- [ ] Outstanding questions tagged with owner/next step.
- [ ] Cross-repo trackers (`Templum/docs/current/progress.md`, etc.) updated if scope changed.

## 6. Escalation & Communication

- Record blockers or decisions needed in `04-Progress-and-Gaps.md` under “Outstanding Decisions & Questions”.
- Use repo notes (`dev/notes/AGENTS.md`) for communication norms; avoid ad-hoc tooling without documenting rationale.
- For integration-breaking findings (e.g. Phase 6 harness failing), escalate to project leads immediately and capture the incident in the progress log.

## 7. First-Day Tasks

1. Read the prerequisite docs listed above.
2. Walk through each file in `docs/05-QMS-Realignment/` to understand current content.
3. Confirm whether new information exists for safety classification or cybersecurity scope; if yes, update `00-Problem-Statement.md` and flag it in `04-Progress-and-Gaps.md`.
4. Coordinate with project leads to verify which capabilities have advanced since the last update; reflect changes in the solution alignment matrix.

Staying disciplined with this flow keeps the internal tooling aligned with VDL2’s compliance needs while the technical work evolves.

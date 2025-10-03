# QMS Realignment Playbook

This folder gathers the working material for realigning the in-flight projects (Templum, Phoenix Code Lite, Haruspex, Validation System) with the Quality Management System goals captured in `docs/00-QMS/` and the architecture dossier in `meta/ARCHITECTURE.md`.

## How to Use This Folder

1. Start with `00-Problem-Statement.md` to capture the business/regulatory drivers and frame the core problem the QMS must solve.
2. Translate the problem into measurable targets in `05-Aims-and-Objectives.md`.
3. Map each aim to the ideal-state capabilities of the active projects in `10-Solution-Alignment.md`.
4. Build end-to-end traceability inside `15-Traceability-Matrix.md` once the first three files have initial content.
5. Keep the current maturity snapshot up to date in `20-Progress-and-Gaps.md` after each review or delivery milestone.

Templates under `templates/` provide prompts and skeleton tables for each step. Copy or reference them whenever you iterate on the documents above.

## Outstanding Inputs to Resolve Early

- Confirm the IEC 62304 software safety classification (see `SSI-QF-20A Software Safety Classification iss1.docx`).
- Decide how the repo will absorb formal cybersecurity requirements (flagged as an open follow-up).
- Note that patient data handling is out of scope for now; document how it would be incorporated later if requirements change.

Keeping these constraints visible prevents rework when auditors or stakeholders ask for evidence.

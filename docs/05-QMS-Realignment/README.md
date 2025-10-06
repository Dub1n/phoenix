# QMS Realignment Playbook

This folder gathers the working material for realigning the in-flight projects (Templum, Phoenix Code Lite, Haruspex, Validation System) so they collectively support the company’s Quality Management System goals for the VDL2 medical device project. The tooling itself remains an internal development aid, but it must enable regulated delivery workflows documented in `docs/00-QMS/` and the architecture dossier in `meta/ARCHITECTURE.md`.

## How to Use This Folder

1. Start with `00-Problem-Statement.md` to capture the business/regulatory drivers and frame the core problem the internal QMS tooling must solve for VDL2.
2. Translate the problem into measurable targets in `01-Aims-and-Objectives.md`.
3. Map each aim to the ideal-state capabilities of the active projects in `02-Solution-Alignment.md`.
4. Build end-to-end traceability inside `03-Traceability-Matrix.md` once the first three files have initial content.
5. Keep the current maturity snapshot up to date in `04-Progress-and-Gaps.md` after each review or delivery milestone.

Templates under `templates/` provide prompts and skeleton tables for each step. Copy or reference them whenever you iterate on the documents above.

## Outstanding Inputs to Resolve Early

- Confirm the IEC 62304 software safety classification for VDL2 (see `SSI-QF-20A Software Safety Classification iss1.docx`) so the tooling outputs target the correct evidence level.
- Decide how formal cybersecurity requirements for VDL2 will be captured and reflected in the tooling (flagged as an open follow-up).
- Note that patient data handling is out of scope for now; document how support would be added later if requirements change.

Keeping these constraints visible prevents rework when auditors or stakeholders review how the internal tools back the regulated product.

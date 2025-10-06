# Traceability Matrix Seed

Build this matrix once the problem statement, aims, and solution alignment have initial content. It provides the auditor-friendly view from VDL2 user needs and regulatory clauses through to internal tooling features and evidence.

## How to Populate

1. Start with the primary VDL2 user needs and regulatory clauses identified in `00-Problem-Statement.md` and the EN 62304 / AAMI TIR45 references.
2. Link each row to at least one aim/objective from `01-Aims-and-Objectives.md`.
3. Map the objective to specific project features (actual or planned) using `02-Solution-Alignment.md`.
4. Identify the verification or validation artefact that will demonstrate the tooling supports the requirement (e.g. automated test suite, CI report, validation command log).
5. Update the status as work progresses (e.g. Planned → In Progress → Verified).

## Matrix Template

| User Need / Regulatory Clause                                    | Aim / Objective Reference                  | Project Feature / Asset                                                       | Verification Evidence                                                             | Status                                                 | Notes                                          |
| ---------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| Summarise the requirement or clause (cite the standard/section). | Reference the aim/objective ID or heading. | Mention the system component, skin, or workflow that fulfils the requirement. | Describe the artefact that proves compliance (test suite, report, manual review). | Track maturity (`Planned`, `In Progress`, `Verified`). | Add context, open risks, or follow-up actions. |

> Keep row text concise. If a requirement spans multiple aims or features, duplicate the row with adjusted references rather than overloading a single row.

# Aims and Objectives - QMS Realignment MVP

Plain-language note: This document translates the updated problem statement into measurable outcomes for the internal tooling stack (Templum, Phoenix Code Lite, Haruspex, Validation System). It retains the full technical scope while using terminology that remains readable for stakeholders who are not engineers.

## Aim 1: Retire Manual Word and Excel QMS Workflows

- **Intent:** Replace fragile SOP checklists with skin-driven, auditable workflows that developers and operations staff execute inside the tooling suite.
- **Owner:** QMS tooling lead (coordinating Phoenix Code Lite and Templum).
- **Time horizon:** MVP cutover.

| Objective | Evidence artifacts | Success metric | Responsible projects/systems | Dependencies and notes |
| --- | --- | --- | --- | --- |
| Deliver a skin-driven checklist workflow that mirrors the SOP steps end-to-end. | Phoenix Code Lite skin exporter payloads committed under `dist/skins/`; Templum session recordings or automated tests demonstrating checklist execution; Markdown or JSON export of completed checklists. | 100% of VDL2 release checklists executed through Templum by MVP, with an export stored per release (no manual Word or Excel edits). | Phoenix Code Lite, Templum | Requires Phoenix Code Lite skin exporter prototype, completed Templum skin ingestion, CRUD backing store for checklist entries; aligns with Development-Process-1.pdf §3.1 (p.5) guidance on mapping agile activities to controlled QMS artefacts. |
| Capture traceability links between checklist items, requirements, and validation runs. | Traceability export (CSV or Markdown) including Validation System run identifiers; associated validation log bundle. | Every SOP checklist row references a requirement identifier and validator run within 48 hours of execution. | Phoenix Code Lite, Validation System | Depends on confirming IEC 62304 Class B scope, deterministic validator result export, Phoenix Code Lite traceability data model; fulfils Development-Process-1.pdf §4.2 (p.7) and §9.3 (p.12) expectations for continuous traceability and digital reporting. |
| Record design-review outcomes with named reviewer roles. | Phoenix Code Lite review records storing reviewer name, role, independence flag, and approval timestamp; Templum UI submission log showing who signed off and when. | 100% of gated reviews (initial planning, architecture, incremental, release) captured with Project Lead and Independent Reviewer entries available within 24 hours of the meeting. | Phoenix Code Lite, Templum | Requires review record schema, UI prompts for reviewer acknowledgement, agreement on where role assignments are mastered; meets Development-Process-1.pdf §3.2 (p.6) requirements for documented, independent design reviews. |

## Aim 2: Embed QMS Actions into Daily Developer Tooling

- **Intent:** Ensure engineers and firmware developers can complete QMS steps through the same CLI and VS Code workflows they already use, without introducing separate utilities.
- **Owner:** Templum interface lead (coordinating with Validation System owners).
- **Time horizon:** MVP plus hardening sprint.

| Objective | Evidence artifacts | Success metric | Responsible projects/systems | Dependencies and notes |
| --- | --- | --- | --- | --- |
| Provide unified CLI and VS Code entry points for QMS flows with session management. | Templum integration test logs (for example `universal-interaction-manager.session.test.ts`); VS Code activation telemetry; curated user walkthrough recording. | At least 90% of QMS interactions during pilot executed through Templum entry points; no open-handle leaks in continuous integration runs. | Templum | Requires VS Code initialisation stability fix, refreshed adapter teardown tests, onboarding material for pilot users; operationalises Development-Process-1.pdf §§5.2–5.4 (pp.8–9) and §9.2 (p.11) guidance on embedding QMS steps into daily development and enabling asynchronous participation. |
| Expose deterministic validation triggers inside Templum workflows. | Command logs (for example `templum validate`); Validation System execution reports; persisted run metadata within traceability ledger. | All release-gating validations triggered via Templum CLI or UI; pass or fail status recorded inside the Phoenix Code Lite traceability ledger. | Templum, Validation System | Depends on replacing Phase 6 random readiness with deterministic outputs and standardising validator result exports; supports Development-Process-1.pdf §§6.1–6.3 (pp.9–10) requirements for continuous verification with documented results. |
| Surface Practical Developer Guide checkpoints during development. | Phoenix Code Lite checklist/table export listing OneFlow branch naming, TDD evidence, and Definition-of-Done prompts; Templum session log capturing developer confirmations via the structured table component; pilot telemetry summarising prompt acknowledgements. | ≥90% of sprint exit or story-completion checklists record confirmations for branching, unit tests, and documentation updates within 24 hours of completion; deterministic evidence (e.g., passing test run) linked automatically. | Phoenix Code Lite, Templum | Depends on new table component schema, Phoenix Code Lite workflow rows, and adapter rendering updates; fulfils Development-Process-1.pdf Practical Developer Guide (pp.14–21) and addresses Problem Statement §2 (lines 16–25) on replacing manual Word/Excel-driven discipline tracking. |
| Confirm backlog tooling decision in light of YouTrack recommendation. | Decision note recorded in Phoenix Code Lite documentation (or equivalent) summarising whether YouTrack or an alternative will host backlog/QMS integration; supporting analysis referencing Development-Process-1.pdf software comparison. | Decision published before MVP pilot; if an alternative tool is selected, documented rationale shows parity with YouTrack features (simplicity, knowledge base, GitHub integration). | Phoenix Code Lite, Templum | Requires review of current tooling plan, coordination with compliance/product owners; ties back to Development-Process-1.pdf Software Comparison (pp.29–31). |

## Aim 3: Produce Auditor-Ready Evidence on Sprint Cadence

- **Intent:** Assemble requirements, validation logs, and decision trails quickly enough to support Class B regulatory reviews without manual collation.
- **Owner:** Compliance tooling owner (Phoenix Code Lite and Validation System integrator).
- **Time horizon:** MVP plus first audit rehearsal.

| Objective | Evidence artifacts | Success metric | Responsible projects/systems | Dependencies and notes |
| --- | --- | --- | --- | --- |
| Generate a consolidated release evidence bundle per tagged build. | Bundled artefact (zip or tar) containing traceability export, validator reports, and checklist outcomes; storage pointer within repository. | 100% of release tags produce an evidence bundle within two business days. | Phoenix Code Lite, Validation System | Requires traceability exporter, validator result schema, automated hook on release tagging; delivers Development-Process-1.pdf §§6.3–6.4 (p.9) and §§8.1–8.3 (p.11) expectations for milestone verification, validation, and release documentation. |
| Baseline logging and metrics for backend lifecycle and QMS events. | Structured log samples (JSONL); observability configuration notes; retention policy documentation. | 100% of backend lifecycle events and checklist submissions logged with timestamp, actor, and outcome; logs retained for at least 90 days. | Templum, Haruspex | Depends on observability instrumentation task, Haruspex to Templum integration handshake, agreed log schema; ensures automated evidence capture per Development-Process-1.pdf §6.1 (p.9) and §9.3 (p.12). |
| Publish evidence-bundle schema and legacy form crosswalk. | Phoenix Code Lite schema note describing bundle sections/fields; crosswalk document linking each legacy SSI-QF obligation to bundle outputs and workflow evidence. | Crosswalk accepted by compliance stakeholders before MVP pilot; schema docs stored alongside bundle generator. | Phoenix Code Lite | Requires coordination with compliance, alignment with Phoenix Code Lite bundler design; demonstrates continuity with Development-Process-1.pdf §§3.1, 8.2, 9.1 (pp.5, 11, 9) on maintaining controlled documentation. |

## Aim 4: Keep Risk Controls Current Through the Sprint Cadence

- **Intent:** Maintain a living risk register and link risk controls to requirements and verification so IEC 62304 Section 7 obligations stay satisfied inside the new QMS.
- **Owner:** Phoenix Code Lite compliance lead (working with Templum session owners and Validation System maintainers).
- **Time horizon:** MVP plus first audit rehearsal.

| Objective | Evidence artifacts | Success metric | Responsible projects/systems | Dependencies and notes |
| --- | --- | --- | --- | --- |
| Provide a live risk register tied to sprint reviews and requirement updates. | Phoenix Code Lite risk register export (JSON/Markdown) showing risk ID, control, owner, linked requirement, validator outcome; sprint review note recorded through Templum confirming risk review completed. | 100% of sprints document risk review outcomes within 48 hours; every new or changed requirement links to an assessed risk entry before release. | Phoenix Code Lite, Templum, Validation System | Needs risk schema updates, UI prompts during sprint review flows, deterministic validator identifiers for risk-control evidence; implements Development-Process-1.pdf §7 (p.10) and §4.2 (p.7) directives on continuous risk management and risk-control traceability. |

## Cross-Aim Considerations

- Confirmation of IEC 62304 safety class (expected Class B) and any cloud or cybersecurity obligations will refine metrics and traceability scope; track updates in `04-Progress-and-Gaps.md`.
- Phase 6 harness overhaul is a prerequisite for using Validation System outputs in objectives 1.2, 2.2, and 3.1; treat it as a shared gating task.
- Patient data handling remains out of scope for this MVP; revisit objectives if internal tooling ever processes real patient information.
- CRUD back-ends for broader company workflows are optional extensions. If prioritised, add objectives under Aim 1 with their own evidence outputs and migration plans.
- Once the risk register and role-aware review capture land, the same plumbing can support future extensions (for example automated support-hand-off tracking) with less effort than retrofitting third-party QMS tools described in Development-Process-1.pdf §9.2 (p.11).
- Developer-discipline automation reinforces the Practical Developer Guide (Development-Process-1.pdf pp.14–22), letting Phoenix Code Lite auto-complete deterministic follow-ups and Templum surface targeted prompts only when human confirmation is still required.
- Tooling decision transparency ensures the MVP respects the YouTrack recommendation in Development-Process-1.pdf (pp.29–31) or documents an equivalent alternative without losing the simplicity, knowledge base, and GitHub integration benefits.
- Skin-driven delivery keeps Templum lightweight: backends publish workflows once, and the universal interface renders them consistently across CLI and VS Code, reducing duplicate UI work and preserving auditability as additional processes migrate.

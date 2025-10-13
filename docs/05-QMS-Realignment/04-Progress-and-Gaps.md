# Progress and Gaps Log

Orientation note: This log captures the current delivery status for each project contributing to the QMS realignment MVP. It references the aims and objectives defined in `01-Aims-and-Objectives.md` so stakeholders can verify alignment with the agreed scope.

## Snapshot

- **Date:** 2025-10-08  
- **Compiled by:** QA tooling working session (Gabe + Codex)

## Global Summary

- Templum: Discovery, session management, and skin ingestion are verified. Remaining interface work is focused on the CLI generator polish, the VS Code activation defect, and the initial observability wiring.
- Phoenix Code Lite: Architecture specifications for the traceability model and skin exporter are complete, but production code has not landed. This is the largest blocker to removing the manual Word and Excel checklists.
- Validation System: Logging is mature, yet the Phase 6 harness still relies on mocked readiness and random scoring. Deterministic exports are required before Phoenix Code Lite can ingest the results.
- Haruspex: Provides partial VS Code and HTTP server functionality but still returns placeholder analysis. Its primary MVP contribution is structured logging once the backend refactor is delivered, so it can trail the checklist milestones without blocking them.
- Cross-project dependencies: Confirm IEC 62304 classification (expected Class B), agree on cybersecurity scope for remote deployments, and determine whether to remediate or replace the Phase 6 harness.
- Alternatives review: Legacy SOP/QF workflow and commercial QMS offerings remain unsuitable because they depend on manual duplication and cannot integrate with Validation System outputs or Templum skins. The internal stack continues to be the preferred path.

## Project Status Tables

### Templum

| Capability Focus | Evidence to Capture | Current Maturity | Next Actions and Risks |
| --- | --- | --- | --- |
| Skin ingestion and session manager powering checklist UI | `skin-payload-consumption` integration tests, CLI walkthrough recording | Verified | Extend CLI generator to surface checklist menus, stabilise VS Code activation, connect storage client once Phoenix Code Lite exporter is ready. |
| VS Code adapter initialisation | Activation telemetry, forced-exit test 'DP' | In progress | Resolve WebView readiness warnings and ensure teardown clears listeners to avoid continuous integration hangs. |
| Observability baseline (lifecycle events and submissions) | Structured log samples, logging configuration reference | Planned | Execute `observability-baseline` task, coordinate schema with Haruspex logging output. |
| Review acknowledgement flow (role-aware approvals) | Prototype UI capture, submission log proving Project Lead/Independent Reviewer entries | Planned | Design acknowledgement prompts, confirm identity storage model, wire submissions to Phoenix Code Lite review record API so evidence covers Development-Process-1.pdf §3.2 (p.6). |
| Sprint review risk prompts | Sprint review recording, synced risk-update payload | Planned | Add risk review checklist to sprint workflow, coordinate schedule with Phoenix Code Lite risk ledger, ensure minimal duplicate data entry per Development-Process-1.pdf §7 (p.10). |
| Developer workflow prompts and notifications | Session log showing automated confirmations and manual acknowledgements | Planned | Implement Practical Developer Guide checks in UI: notify when deterministic steps auto-complete, prompt for manual confirmation only when needed (Development-Process-1.pdf Practical Developer Guide, pp.14–22). |
| Backlog tooling visibility | Updated onboarding snippet or announcement log | Planned | Document final backlog tooling decision (YouTrack or alternative) inside Templum onboarding/CLI help so teams understand where QMS work lives (Development-Process-1.pdf Software Comparison, pp.29–31). |

### Phoenix Code Lite (PCL)

| Capability Focus | Evidence to Capture | Current Maturity | Next Actions and Risks |
| --- | --- | --- | --- |
| Traceability data model and export | CLI export prototype, unit tests for requirement-to-validator link | In progress | Finalise schema, attach Validation System run identifiers, confirm Class B requirement inventory. |
| Skin exporter for SOP checklists | `dist/skins/` payload fixture, Templum ingestion smoke test | Planned | Implement exporter, add CRUD storage for checklist entries, create pilot checklist skin. |
| Release evidence bundler | Automated bundle artefact, repository storage pointer | Planned | Complete traceability and validator exports first, then build bundler triggered by release tags. |
| Evidence bundle schema & crosswalk | Draft schema note, reviewed crosswalk doc | Planned | Capture bundle structure and SSI-QF replacement mapping as per Development-Process-1.pdf §§3.1, 8.2, 9.1–9.3 (pp.5, 11, 9–12); schedule compliance review alongside bundler delivery. |
| Design review record store | Review export sample showing roles/independence/timestamps | Planned | Extend schema, create CRUD endpoints, define reviewer vocabulary with compliance team, align export with evidence bundle format required by Development-Process-1.pdf §3.2 (p.6). |
| Risk register ledger | Risk register export with linked requirements and controls | Planned | Finalise risk schema, connect to requirement updates, ensure updates feed into evidence bundles and sprint review prompts in line with Development-Process-1.pdf §7 (p.10). |
| Practical Developer Guide metadata | Workflow record showing branch, TDD, docs, Definition of Done status | Planned | Extend Phoenix Code Lite schema/hook to capture Practical Developer Guide markers, auto-complete deterministic checks, expose outstanding manual items (Development-Process-1.pdf Practical Developer Guide, pp.14–22). |
| Backlog tooling decision note | Published comparison and decision document | Planned | Compile analysis comparing YouTrack recommendation to current/target tool, capture rationale for final choice, share with stakeholders (Development-Process-1.pdf Software Comparison, pp.29–31). |

### Haruspex

| Capability Focus | Evidence to Capture | Current Maturity | Next Actions and Risks |
| --- | --- | --- | --- |
| Deterministic HTTP backend responses | Backend smoke test outputs, fixture analysis JSON | Planned | Finish HTTP server refactor and replace placeholder handlers with deterministic analysis routines. |
| Skin generator for analysis dashboards | Skin payload fixture, Templum ingestion log | Planned | Build backend skin generator after deterministic data exists; coordinate with observability schema. |
| Logging contribution to QMS evidence | Structured log snippet, retention configuration | Planned | Align with Templum logging work and ensure analysis events correlate with checklist actions. |

### Validation System

| Capability Focus | Evidence to Capture | Current Maturity | Next Actions and Risks |
| --- | --- | --- | --- |
| Deterministic validator result exports | JSON or JUnit output sample, contract tests | In progress | Remove remaining harness randomness, finalise `validator-result-exports` schema and documentation, publish run metadata API. |
| Baseline validator revalidation | Command logs (`backend/ui/core/build/quality`) | In progress | Re-run suites after determinism fixes and document outputs for Phoenix Code Lite ingestion. |
| Phoenix Code Lite integration API | API specification draft, CLI stub | Planned | Define embedding interface after result export schema stabilises and guarantee idempotent re'DP'. |
| Risk-tagged validator outputs | Result payload including risk-control identifiers | Planned | Extend export schema, add CLI flags for risk context, document consumption pattern for Phoenix Code Lite risk ledger to back Development-Process-1.pdf §7 (p.10) risk-control verification. |

## Outstanding Decisions and Questions

- **IEC 62304 classification:** Confirm Class B or define alternative risk categorisation, then update aims and metrics.
- **Cybersecurity obligations:** Determine whether remote deployment introduces additional standards (owner: regulatory lead).
- **Phase 6 harness remediation:** Decide whether to rehabilitate or replace the current mocked harness before MVP evidence exports.
- **CRUD backend pilot:** Secure approval for extending the architecture to broader Excel and Word replacements once the checklist MVP is stable.
- **Zero-knowledge deviations:** Document any manual configuration in Templum during the MVP and schedule remediation to restore full zero-knowledge behaviour.
- **Commercial tooling watchlist:** Maintain a lightweight review cadence in case a vendor surfaces APIs that satisfy integration requirements without disrupting developer workflows.
- **Reviewer identity source of truth:** Choose whether Phoenix Code Lite or another system masters reviewer-role assignments before the design-review flow goes live.
- **Risk register extension path:** Decide if the post-MVP roadmap should prioritise support/QA hand-off tracking once the core risk ledger is operational.

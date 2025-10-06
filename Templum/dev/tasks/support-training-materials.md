# Task: Support/training materials delivered to operations and partner teams

## Requirement Summary

- Status: `[ ]`
- Requirement text: "Support/training materials delivered to operations and partner teams."

## Prerequisites

- [ ] Production runbooks and on-call handoff prepared (incident flows, escalation matrix). — Ops training references the escalation flows, incident artefacts, and `reports/operations` outputs produced here.
- [ ] Change management & post-launch adoption plan executed (communications, feedback loop). — Training delivery cadence and attendee tracking depend on the comms schedule and feedback mechanisms this requirement establishes.
- [~] Haruspex integration path defined (backend pending skin output). — Partner enablement for Haruspex must describe the production integration steps once this path is finalized.
- [ ] Phoenix Code Lite skin ingestion validated. — PCL partner materials need the validated ingestion workflow and evidence from this requirement.

## Implementation Steps

### Unblocked Actions

- [ ] Author `docs/current/training/templum-operations-playbook.md` with scenario-based modules covering release validation (`npm run phase6-validation -- --format markdown --output docs/current/checklists` per `src/scripts/run-phase6-integration-validation.ts:160`), production readiness verification (`node dist/src/scripts/production-readiness-validation.js` sourced from `src/scripts/production-readiness-validation.ts:124`), CLI connection troubleshooting (`src/cli-entry.ts:1`), and incident evidence collection (tie into `reports/operations/` produced by the runbook task). Include command transcripts, expected artefacts, and owner sign-off fields so operations can self-serve.
- [ ] Create `docs/current/training/partner-enablement.md` that splits into Haruspex and Phoenix Code Lite sections. Document onboarding flows using the real service router contracts (`src/backend/backend-service-router.ts:218`), Phase 6 verification checkpoints (`src/tests/integration-validation-framework.ts:3455`), and backend integration steps already captured in `docs/current/1.2-Backend-Integration-Guide.md:1088`. Provide API endpoints, manifest expectations, and validation scripts partners must run before sign-off.
- [ ] Capture live artefacts for the training bundle by running the validation scripts and storing sanitized outputs under `docs/current/training/artifacts/` (e.g., latest `phase6-validation-*.json|md`, `production-readiness-report.json`). Reference these artefacts from the playbook and partner enablement guide so attendees can compare their results.
- [ ] Map the Phase 6 workflow exercises to hands-on labs: export the relevant steps from `tests/e2e/e2e-complete-workflows.test.ts:1` into `docs/current/training/labs/phase6-cross-interface.md`, translating each automated scenario into manual exercises with success criteria and troubleshooting checklists.
- [ ] Update `src/tests/integration-validation-framework.ts:3482` recommendation output so completed validation reports include a pointer to the new operations/partner training docs when readiness gaps highlight user enablement issues. This keeps automated reports aligned with the training collateral.

### Blocked Actions (pending [ ] Production runbooks and on-call handoff prepared (incident flows, escalation matrix).)

- [ ] Once runbooks land, weave the escalation matrix and remediation scripts into `templum-operations-playbook.md`, and embed links to `docs/current/runbooks/` plus the generated `reports/operations/incident-log.json` examples inside the training artefacts.

### Blocked Actions (pending [ ] Change management & post-launch adoption plan executed (communications, feedback loop).)

- [ ] After the adoption plan is approved, add the training delivery calendar, feedback intake links, and attendee tracking tables to `docs/current/training/templum-operations-playbook.md` and surface the plan in `partner-enablement.md` so sessions align with org-wide communications.

### Blocked Actions (pending [~] Haruspex integration path defined (backend pending skin output).)

- [ ] Replace the provisional Haruspex onboarding notes with the finalized connection checklist (service endpoints, skin payload expectations, validation commands) and attach evidence from the integration path once stabilized.

### Blocked Actions (pending [ ] Phoenix Code Lite skin ingestion validated.)

- [ ] Augment the PCL section with the validated ingestion walkthrough, captured output from `src/skin/pcl-rendering-adapter.ts:25` integration tests, and partner sign-off templates once the ingestion requirement is closed.

## Definition of Done

- Tests to run: `npm run phase6-validation -- --format markdown --output docs/current/training/artifacts`, `npm run phase6-health`, `node dist/src/scripts/production-readiness-validation.js`, `npm test -- tests/e2e/e2e-complete-workflows.test.ts`.
- Validation/commands: Review the generated artefacts in `docs/current/training/artifacts/` and ensure the tasks referenced in the playbook/partner guide match current CLI output; run `npx lint-md docs/current/training` (or existing doc lint command) if available to keep materials publication-ready.
- Documentation to update: `docs/current/progress.md` (status/link), `docs/current/architecture-spec.md` Operational Considerations, `docs/current/1.2-Backend-Integration-Guide.md` partner enablement notes, and any new training assets under `docs/current/training/`.

## References

- `docs/current/progress.md:41`
- `docs/current/architecture-spec.md:54`
- `docs/current/1.2-Backend-Integration-Guide.md:1088`
- `src/scripts/run-phase6-integration-validation.ts:160`
- `src/scripts/production-readiness-validation.ts:124`
- `src/cli-entry.ts:1`
- `src/backend/backend-service-router.ts:218`
- `src/tests/integration-validation-framework.ts:3455`
- `tests/e2e/e2e-complete-workflows.test.ts:1`
- `src/skin/pcl-rendering-adapter.ts:25`

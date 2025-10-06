# Task: Unified go/no-go checklist with compliance, security, and partner sign-offs

## Requirement Summary

- Status: `[ ]`
- Requirement text: "Unified go/no-go checklist with compliance, security, and partner sign-offs."

## Prerequisites

- [ ] Release pipeline hardening and packaging verification (artifact signing, CI gating, rollback paths). — Go/no-go gating must pull its pass/fail signals from the hardened pipeline before we can treat the checklist as authoritative.
- [ ] Security and compliance validation sign-off (threat model, audit evidence packaged). — The checklist needs the curated evidence bundle and formal approvals produced here.
- [~] Haruspex integration path defined (backend pending skin output). — Partner approval for Haruspex depends on this integration path reaching a production-ready state.
- [ ] Phoenix Code Lite skin ingestion validated. — Partner approval for PCL requires the ingestion flow to clear validation.

## Implementation Steps

### Unblocked Actions

- [ ] Create `docs/current/go-no-go-checklist.md` capturing release gating, compliance, security, and partner sign-off sections that map to `src/scripts/run-phase6-integration-validation.ts:430`, `src/scripts/production-readiness-validation.ts:203`, `src/tests/integration-validation-framework.ts:3455`, and `src/risk/rollback-criteria.ts:1`. Document owners, evidence locations, and approval fields per function so teams can complete the checklist without ad hoc coordination.
- [ ] Extend `src/tests/integration-validation-framework.ts:3360` with an exported `generateGoNoGoSnapshot()` that projects readiness, compliance scores, security validation booleans, and partner integration matrix data from existing `Phase6ValidationReport` calculations.
- [ ] Update `src/scripts/run-phase6-integration-validation.ts:430` so `saveValidationReport` also writes `go-no-go-summary.json` (and markdown when requested) containing the snapshot from `generateGoNoGoSnapshot()`, and emit the file path in the CLI output for checklist authors.
- [ ] Wire a `go-no-go` npm script in `package.json:103` that runs the build, executes `run-phase6-integration-validation.js run --format markdown`, and drops artifacts into a stable directory (e.g., `docs/current/checklists/`) referenced by the checklist doc.

### Blocked Actions (pending [ ] Release pipeline hardening and packaging verification (artifact signing, CI gating, rollback paths).)

- [ ] Once the hardened pipeline is available, pipe the go/no-go summary status into the release gate configuration (`.github/workflows/*` or equivalent) so the checklist completion is required before publishing artifacts.

### Blocked Actions (pending [ ] Security and compliance validation sign-off (threat model, audit evidence packaged).)

- [ ] After the sign-off package lands, link the threat model, audit evidence bundle, and validation run IDs inside `docs/current/go-no-go-checklist.md` under the compliance/security sections created earlier.

### Blocked Actions (pending [~] Haruspex integration path defined (backend pending skin output).)

- [ ] Capture Haruspex partner approval by embedding the finalized service readiness checklist and sign-off contact in the partner section once `src/backend/backend-service-router.ts:218` targets the production connection path.

### Blocked Actions (pending [ ] Phoenix Code Lite skin ingestion validated.)

- [ ] Record the Phoenix Code Lite sign-off by referencing the ingestion validation evidence (`src/skin/pcl-rendering-adapter.ts:25` + associated tests) and storing the approval signature in the partner section.

## Definition of Done

- Tests to run: `npm run phase6-validation -- --format markdown --output docs/current/checklists`, `npm run phase6-health`, `node dist/src/scripts/production-readiness-validation.js`.
- Validation/commands: review generated `docs/current/checklists/go-no-go-summary.json` and `docs/current/go-no-go-checklist.md` for the latest run; ensure rollout/rollback criteria match `src/risk/rollback-criteria.ts` thresholds.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, `docs/current/1.2-Backend-Integration-Guide.md`, `docs/target/ValidationSystem-V3C-Documentation.md` with any new evidence references.

## References

- `docs/current/progress.md:33`
- `docs/current/architecture-spec.md:37`
- `docs/target/ValidationSystem-V3C-Documentation.md:128`
- `docs/current/1.2-Backend-Integration-Guide.md:1076`
- `src/tests/integration-validation-framework.ts:3455`
- `src/scripts/run-phase6-integration-validation.ts:430`
- `src/scripts/production-readiness-validation.ts:203`
- `src/risk/rollback-criteria.ts:1`
- `src/backend/backend-service-router.ts:218`
- `src/skin/pcl-rendering-adapter.ts:25`
- `package.json:103`

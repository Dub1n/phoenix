# Task: Release pipeline hardening and packaging verification

## Requirement Summary
- Status: [ ]
- Requirement text: "Release pipeline hardening and packaging verification (artifact signing, CI gating, rollback paths)."

## Prerequisites
- [ ] "[ ] Test architecture consolidation and coverage governance (unit/integration/e2e thresholds codified)." — release gating depends on the consolidated coverage commands and suite-specific thresholds.

## Implementation Steps
### Unblocked Actions
- [ ] Build a release verification orchestrator in `scripts/release/run-release-verification.js` that reuses the command runner utilities from `scripts/check-tests.js`/`scripts/test-health-monitor.js`, executes `npm run coverage:governance`, `npm run phase6-validation run`, `npm run lint`, and `npm run check:types`, wraps `node dist/src/scripts/production-readiness-validation.js`, bundles the outputs with timestamps, and writes `reports/release/pipeline-verification.json` capturing pass/fail states and artifact metadata.
- [ ] Extend packaging automation by adding an npm script `release:package` that calls the new orchestrator, runs `npx vsce package --no-dependencies`, and archives the CLI (`dist/src/cli-entry.js` plus assets) via a new `scripts/create-cli-bundle.js` helper that emits `artifacts/templum-cli.tar.gz` and records its checksum in the verification report.
- [ ] Implement `scripts/sign-release-artifacts.js` that loads a PEM key from `process.env.TEMPLUM_RELEASE_KEY_PATH`, signs each artifact produced by `release:package` (VSIX and CLI bundle) using Node `crypto.createSign('RSA-SHA256')`, writes `<artifact>.sig` and updates `reports/release/pipeline-verification.json` with signature fingerprints; fail fast when the key is missing or signature verification via `crypto.createVerify` fails.
- [ ] Add regression coverage in `tests/risk/rollback-criteria.test.ts` exercising `src/risk/rollback-criteria.ts` and `src/risk/fallback-manager.ts`: assert emergency versus partial rollbacks emit the expected phase order and that the release verification report attaches the generated rollback plan under `reports/release/rollback-plan.json`.
- [ ] Update CI gating by teaching `scripts/check-tests.js` (or a shared helper) to gate on the freshness of `reports/release/pipeline-verification.json` and on the presence of `artifactSignatures`/`rollbackPlan` blocks, ensuring stale or unsigned artifacts cause a non-zero exit; wire this into a new npm script `release:verify` consumed by CI.
- [ ] Document the hardened pipeline in `docs/current/architecture-spec.md` (Operational Considerations + Verification & Validation) summarising the commands (`npm run release:verify`, `npm run release:package`), generated reports, and rollback validation outputs so deployment owners can follow the flow.

### Blocked Actions (pending "[ ] Security and compliance validation sign-off (threat model, audit evidence packaged).")
- [ ] Integrate the orchestrator with the production signing service (swap the local PEM loader for the approved KMS/secret manager endpoint and capture audit evidence) once security hands off the official key management runbook.

## Definition of Done
- Tests to run: `npm run test`, `npm run coverage:governance`, `npx jest --runTestsByPath tests/risk/rollback-criteria.test.ts`, `npm run release:verify`.
- Validation/commands: `npm run release:package`, `node scripts/sign-release-artifacts.js`, `npm run phase6-validation run`, `npx vsce package --no-dependencies`.
- Documentation to update: `docs/current/progress.md` (status/link), `docs/current/architecture-spec.md` Sections 4 & 6, and the generated `reports/release/pipeline-verification.json`.

## References
- Progress entry: `docs/current/progress.md:32`
- Architecture spec: `docs/current/architecture-spec.md:54`, `docs/current/architecture-spec.md:68`
- Release automation: `scripts/check-tests.js`, `scripts/test-health-monitor.js`, `src/scripts/production-readiness-validation.ts`, `src/scripts/run-phase6-integration-validation.ts`, `src/risk/rollback-criteria.ts`, `src/risk/fallback-manager.ts`

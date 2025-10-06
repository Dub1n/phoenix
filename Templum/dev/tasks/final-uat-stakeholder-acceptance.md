# Task: Final UAT and stakeholder acceptance recorded

## Requirement Summary

- Status: [ ]
- Requirement text: "Final UAT and stakeholder acceptance recorded."

## Prerequisites

- [ ] "[ ] Release pipeline hardening and packaging verification (artifact signing, CI gating, rollback paths)." — ensures the release candidate used for UAT is produced by a hardened pipeline.
- [ ] "[ ] Unified go/no-go checklist with compliance, security, and partner sign-offs." — provides the decision framework and approvers needed for UAT sign-off meetings.
- [ ] "[ ] Security and compliance validation sign-off (threat model, audit evidence packaged)." — guarantees risk owners have approved controls before stakeholders sign.

## Implementation Steps

### Unblocked Actions

- [ ] Extend `src/tests/e2e/e2e-scenarios.ts` to tag each enterprise persona flow (executive dashboard, operations on-call, compliance reviewer) with UAT-specific metadata and tighten `expectedOutcome` tolerances so failures surface any regression before sign-off.
- [ ] Augment `src/testing/e2e-test-framework.ts` with an `exportAcceptanceReport` helper that aggregates scenario results, writes `reports/uat/templum-uat-report.json`, and emits events consumable by stakeholder tooling.
- [ ] Update `tests/e2e/e2e-complete-workflows.test.ts` to execute the persona-tagged UAT subset, assert zero warnings/errors, call `exportAcceptanceReport`, and snapshot the generated artifact for review.
- [ ] Produce a living UAT runbook in `docs/current/UAT-runbook.md` detailing personas, entry/exit criteria, and the command sequence (`npm run test`, `npm run coverage:reality-check`, `npm run phase6-validation`) stakeholders must witness; validate the doc with `meta/DOC_CHANGE_CHECKLIST.md`.
- [ ] Wire the acceptance report into release gating by teaching `scripts/check-tests.js` to fail when `reports/uat/templum-uat-report.json` is older than 24 hours or missing expected persona keys, ensuring nightly builds stay UAT-ready.

### Blocked Actions (pending "[ ] Unified go/no-go checklist with compliance, security, and partner sign-offs.")

- [ ] Schedule and record the joint UAT walkthrough, capturing signed approvals in `docs/current/UAT-runbook.md` and archiving the output under `reports/uat/` once the checklist owners confirm readiness.

## Definition of Done

- Tests to run: `npm test`, `npm run test:coverage`, `npm run coverage:reality-check`, `npm run phase6-validation`, `npm run lint`, `npm run check:types`.
- Validation/commands: execute the updated `scripts/check-tests.js` gate and confirm the generated `reports/uat/templum-uat-report.json` passes schema validation.
- Documentation to update: `docs/current/progress.md` status/notes, `docs/current/UAT-runbook.md`, `docs/current/architecture-spec.md` Operational Considerations, and any stakeholder communication logs linked from `docs/current/progress.md`.

## References

- Progress entry: `docs/current/progress.md:34`
- Architecture spec: `docs/current/architecture-spec.md:10`, `docs/current/architecture-spec.md:54`, `docs/current/architecture-spec.md:60`
- Tests: `tests/e2e/e2e-complete-workflows.test.ts`, `src/tests/e2e/e2e-scenarios.ts`, `src/testing/e2e-test-framework.ts`

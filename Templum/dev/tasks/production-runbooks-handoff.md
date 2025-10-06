# Task: Production runbooks and on-call handoff prepared

## Requirement Summary

- Status: [ ]
- Requirement text: "Production runbooks and on-call handoff prepared (incident flows, escalation matrix)."

## Prerequisites

- [ ] "[?] Structured metrics and logging in place (observability blueprint documented; confirm runtime wiring)." -- runbooks must reference real alert streams and dashboards once observability wiring is verified.
- [ ] "[ ] Release pipeline hardening and packaging verification (artifact signing, CI gating, rollback paths)." -- escalation and rollback sections rely on the hardened release flow and signed artifacts produced by that requirement.

## Implementation Steps

### Unblocked Actions

- [ ] Implement an `OnCallEscalationChannel` in `src/observability/oncall-escalation-channel.ts` that subscribes to `TemplumObservabilitySystem`, `PerformanceMonitor`, and `FallbackManager` events, writes rolling incident records to `reports/operations/incident-log.json`, and exposes helpers for determining escalation tier and recovery playbooks.
- [ ] Wire the new channel into `src/observability/templum-observability-system.ts`, `src/risk/performance-monitor.ts`, and `src/risk/fallback-manager.ts` so emergency/critical alerts emit `onCallEscalation` events with severity, affected interfaces, and recommended runbook IDs.
- [ ] Add `scripts/operations/export-incident-report.js` that aggregates the incident log into `reports/operations/daily-incident-summary.json` plus a Markdown `reports/operations/oncall-handoff.md`, including open incidents, recent rollbacks, verification commands (`npm run release:verify`, `npm run phase6-validation run`), and contact shifts for the next 48 hours.
- [ ] Create regression tests in `tests/risk/oncall-escalation.test.ts` (and supporting fixtures under `tests/__fixtures__/reports/operations/`) exercising the channel: simulate alert + fallback events, assert log persistence, escalation tier selection, and report generation via the new script; ensure `tests/setup.ts` cleans up `reports/operations` artefacts.
- [ ] Author `docs/current/runbooks/templum-production-runbook.md` detailing detection signals, immediate triage steps, remediation/rollback commands, verification checklists, and handoff expectations; reference concrete commands (`node scripts/operations/export-incident-report.js --since 24h`, `npm run release:verify`, `npm run phase6-validation run`) and map each incident type to the corresponding code modules.
- [ ] Produce `docs/current/runbooks/on-call-handoff.md` with the escalation matrix (tiers, response time targets, contact modalities), runbook refresh cadence, and instructions for using the generated reports and incident log; cross-link to observability dashboards and release artefacts paths under `reports/`.
- [ ] Update `src/tests/integration-validation-framework.ts` to surface the new runbooks in the Phase 6 recommendations and confirm validation output references `reports/operations/incident-log.json` when incidents occur.
- [ ] Refresh `docs/current/architecture-spec.md` Sections 4 & 6 to capture the on-call programme, pointing to the new reports, scripts, and runbooks so operational owners have a single reference.

### Blocked Actions (pending prerequisites)

- [ ] Once "[?] Structured metrics and logging in place (observability blueprint documented; confirm runtime wiring)." is complete, attach live dashboard URLs and alert routing IDs to the runbooks and incident summary script output.
- [ ] After "[ ] Release pipeline hardening and packaging verification (artifact signing, CI gating, rollback paths)." lands, embed the signed artefact locations and rollback verification steps into `templum-production-runbook.md` and the handoff summary.

## Definition of Done

- Tests to run: `npm test`, `npx jest --runTestsByPath tests/risk/oncall-escalation.test.ts`, `npm run coverage:governance`.
- Validation/commands: `node scripts/operations/export-incident-report.js --since 24h`, `npm run phase6-validation run`, `npm run release:verify` (ensures runbook references and artefacts are fresh).
- Documentation to update: `docs/current/progress.md` status/link, `docs/current/runbooks/templum-production-runbook.md`, `docs/current/runbooks/on-call-handoff.md`, `docs/current/architecture-spec.md` Operational + Verification sections, and add generated reports under `reports/operations/`.

## References

- Progress entry: `docs/current/progress.md:40`
- Architecture spec: `docs/current/architecture-spec.md:54`, `docs/current/architecture-spec.md:68`
- Code: `src/observability/templum-observability-system.ts`, `src/risk/performance-monitor.ts`, `src/risk/fallback-manager.ts`, `src/tests/integration-validation-framework.ts`
- Scripts/Reports: `scripts/test-health-monitor.js`, `scripts/check-tests.js`, `reports/`

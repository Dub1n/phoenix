# Task: QMS bundle crosswalk for legacy SSI-QF obligations

Related requirement: `docs/current/progress.md` → Quality & Runtime Stability → "Phase 6 validation signal overhaul".

Tags: `#docs`

## Checklist

- [ ] Draft schema outline for Phoenix Code Lite evidence bundle (checklist exports, validator reports, approval events) highlighting stored fields and format.
- [ ] Produce contextual crosswalk showing how each SSI-QF artefact’s regulatory obligation is met within the new bundle (bundle sections, APIs, or logs).
- [ ] Circulate proposal for review (QA tooling + compliance) and integrate feedback.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: document qms bundle crosswalk` after tests.

## References

- Code:
- Tests:
- Docs: `docs/00-QMS/Docs/Development-Process-1.pdf`, `docs/05-QMS-Realignment/01-Aims-and-Objectives.md`, `docs/05-QMS-Realignment/02-Solution-Alignment.md`, `docs/05-QMS-Realignment/03-Traceability-Matrix.md`, `docs/05-QMS-Realignment/04-Progress-and-Gaps.md`

## Notes

- Goal is to give auditors and delivery stakeholders a clear bridge between legacy SSI-QF coverage and the Phoenix Code Lite-generated evidence bundle so retiring Word/Excel SOP artefacts does not create compliance ambiguity.
- Crosswalk should map obligations contextually (what requirement or approval each form satisfied) rather than replicate SSI-QF templates. Each entry must point to specific bundle fields, storage locations, or workflow events that satisfy the same clause.
- Include rationale for any obligations that the new bundle intentionally handles differently, plus follow-up items if additional automation or interface support is needed (e.g., role-aware approvals, risk-control annotations).
- Coordinate with Phoenix Code Lite and Validation System owners to verify schema readiness; surface blockers in `docs/05-QMS-Realignment/04-Progress-and-Gaps.md` if new dependencies appear.
- If bundle schema diverges significantly during design, capture the delta and update the crosswalk so future audits have a living reference.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed

# Task: Validation System integration blocking promotions on failed checks.

## Requirement Summary
- Status: `[ ]`
- Requirement text: "- [ ] Validation System integration blocking promotions on failed checks."

## Prerequisites
- [ ] Lifecycle orchestration with gated transitions and signatures. — Promotion gating must hook into the orchestrator’s state machine once available.

## Implementation Steps
### Unblocked Actions
- [ ] Add failing promotion gating tests in `tests/qms/validation-promotion-gating.test.ts` asserting that `PromotionService.promote` rejects transitions on `FAIL`, surfaces validator evidence, and succeeds only when every category returns `PASS` (mock the gateway via dependency injection).
- [ ] Implement `src/qms/integration/validation-system-gateway.ts` exposing a typed adapter around `scripts/validation/src/core/enhanced-orchestrator.js`, mapping lifecycle categories to validator categories, normalizing PASS/FAIL/WARN payloads, and raising descriptive errors without placeholders.
- [ ] Create `src/qms/workflow/promotion-policy.ts` to declare lifecycle states, promotion preconditions, and required validation categories, then wire it into a new `PromotionService` in `src/qms/workflow/promotion-service.ts` that invokes the gateway and emits audit events through `src/utils/audit-logger.ts` when promotions are blocked.
- [ ] Register a CLI/API hook (e.g., `qms:promote` handler in `src/commands/core-commands.ts` and supporting wiring in `src/core/foundation.ts`) that routes promotion requests through `PromotionService` and returns validator failures to the caller; cover it with an integration test under `tests/integration/qms-promotion-command.test.ts`.
- [ ] Document the gating flow in `docs/current/architecture-spec.md` (Integration Points + Outstanding Work) and capture lifecycle-to-validator mappings in `docs/03-PCL-QMS/03-QMS-via-PCL.md` so auditors know which checks block each promotion stage.

### Blocked Actions (pending [ ] Lifecycle orchestration with gated transitions and signatures.)
- [ ] Integrate `PromotionService` into the lifecycle orchestrator once that requirement lands (e.g., ensure `src/qms/workflow/lifecycle-orchestrator.ts` or equivalent invokes validation gating before mutating work-item state, and extend end-to-end flow tests accordingly).

## Definition of Done
- Tests to run: `npm test -- tests/qms/validation-promotion-gating.test.ts`, `npm test -- tests/integration/qms-promotion-command.test.ts`.
- Validation/commands: `npm run build`, `node dist/unified-cli.js qms:promote --work-item demo --target release` (should fail with validator errors when categories report `FAIL`).
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, `docs/03-PCL-QMS/03-QMS-via-PCL.md` (integration + lifecycle mapping sections).

## References
- Progress entry: `docs/current/progress.md:15`
- Architecture spec: `docs/current/architecture-spec.md:23`, `docs/current/architecture-spec.md:33`, `docs/current/architecture-spec.md:44`, `docs/current/architecture-spec.md:57`
- QMS roadmap: `../docs/03-PCL-QMS/03-QMS-via-PCL.md:418`, `../docs/03-PCL-QMS/03-QMS-via-PCL.md:452`, `../docs/03-PCL-QMS/09-Current-State.md:282`, `../docs/03-PCL-QMS/09-Current-State.md:293`

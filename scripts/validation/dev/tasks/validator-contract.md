# Task: New validator contract documentation and enforcement

## Requirement Summary
- Status: [ ]
- Requirement text: `- [ ] New validator contract documentation and enforcement.`

## Prerequisites
- None.

## Implementation Steps
### Unblocked Actions
- [ ] Capture the canonical validator contract in `docs/current/guides/validator-contract.md`, outlining required properties, lifecycle methods, metadata fields, and interface version expectations based on `src/interfaces/validator-interface.ts` and `src/interfaces/safety-interface.ts`.
- [ ] Extend `src/safety/interface-compliance-checker.js` to validate the documented contract (metadata structure, `interfaceVersion` match, `scopes` coverage, diagnostics hooks) and emit actionable failure details.
- [ ] Align `src/interfaces/validator-interface.ts` plus validators/templates (`src/validators/*`, `src/templates/validator-*.template`) so `getMetadata()` and related helpers satisfy the updated contract and surface new metadata fields.
- [ ] Add unit/integration coverage (e.g., `tests/unit`, `tests/integration/test-enhanced-system.js`) that fails when the contract is violated and verifies compliant validators pass with the new enforcement.
- [ ] Update `docs/current/architecture-spec.md` (Safety & Compliance layers) to reference the contract guide and note enforcement behavior in orchestrator/submission services.

### Blocked Actions (if any)
- None.

## Definition of Done
- Tests to run (`node tests/integration/test-enhanced-system.js`, `node tests/validation-system-enhancement-test.js`).
- Validation/commands (`node src/core/enhanced-orchestrator.js --category <cat> --project <proj>` to confirm contract failures block execution).
- Documentation to update (`docs/current/progress.md`, `docs/current/guides/validator-contract.md`, `docs/current/architecture-spec.md`).

## References
- Progress entry: `docs/current/progress.md` (Validator Modules section, line 14).
- Architecture spec sections: `docs/current/architecture-spec.md` §§2,5.
- Related source/tests: `src/safety/interface-compliance-checker.js`, `src/interfaces/validator-interface.ts`, `tests/integration/test-enhanced-system.js`.

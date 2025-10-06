# Task: Versioned skin contract enforcement

## Requirement Summary

- Status: [~]
- Requirement text: "Versioned skin contract enforcement (schema validation pending integration tests)."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [ ] Add contract-focused integration tests first in `tests/templum/universal-skin-system.test.ts` (or a new `tests/templum/skin-contract.integration.test.ts`) covering `UniversalSkinEngine.registerSkin` rejecting malformed definitions, surfacing `skinValidationWarnings`, and emitting `skinRegistrationFailed` for schema breaches.
- [ ] Extend adapter-facing coverage in `tests/interfaces/interface-adapter-integration.test.ts` to assert CLI/VSCode adapters bubble schema/compatibility failures when orchestrator injects an invalid-version skin.
- [ ] Replace the placeholder validation in `src/skin/universal-skin-engine-impl.ts` with the real JSON schema flow by calling `validateSkinDefinition` (Ajv-backed) against `schemas/universal-skin-engine-validation.json`, enforcing root/metadata version parity and attaching warnings to emitted events.
- [ ] Harden `src/validation/skin-validator.ts` to compile/cache the schema with Ajv, normalize warning/error output, and fail when contract versions drift from `SkinVersionManager.validatorVersion`.
- [ ] Update `src/skin/skin-version-manager.ts` to record the validator/schema revision, gate compatibility on `metadata.minimumVersion`, and expose actionable issues consumed by the new integration tests.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests to run: `npm test`, `npm run test:coverage` (ensure new suites meet ≥80% coverage target).
- Validation/commands: `npm run lint`, `npm run check:types`, `npm run phase6-validation` if contract wiring affects validation harness.
- Documentation to update: `docs/current/progress.md` (status + notes), `docs/current/architecture-spec.md` Section 3 entry on contract enforcement, and any release/changelog artefacts tracking validation guarantees.

## References

- Progress entry: `docs/current/progress.md:8`
- Architecture spec: `docs/current/architecture-spec.md` → Section 3 “Ideal Requirements vs. Status”.
- Code: `src/skin/universal-skin-engine-impl.ts`, `src/validation/skin-validator.ts`, `src/skin/skin-version-manager.ts`
- Tests: `tests/templum/universal-skin-system.test.ts`, `tests/interfaces/interface-adapter-integration.test.ts`
- Schema: `schemas/universal-skin-engine-validation.json`

## Current Assessment (2025-10-05)

- Implementation: `validateSkinDefinition` still performs manual field checks and ignores the Ajv schema; `UniversalSkinEngine.registerSkin` never invokes schema-backed enforcement or emits structured validation warnings.
- Tests: No contract-focused integration suites exist yet (`tests/templum/universal-skin-system.test.ts` does not cover malformed payloads), so adapters never prove how failures surface.
- Coverage: `node scripts/run-with-timeout.mjs -- npm run test:coverage -- --passWithNoTests` terminated with the `babel-plugin-istanbul` TypeError, preventing coverage signal for this work.
- Gaps to unblock: wire Ajv schema compilation, add adapter regression tests for invalid versions, and update docs per Definition of Done once behaviour is observable.

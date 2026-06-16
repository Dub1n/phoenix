# Task: Versioned skin contract enforcement

## Requirement Summary

- Status: [~]
- Requirement text: "Versioned skin contract enforcement (schema validation pending integration tests)."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [x] Add contract-focused integration tests in `tests/templum/skin-contract.integration.test.ts` covering `UniversalSkinEngine.registerSkin` rejecting malformed definitions, surfacing `skinValidationWarnings`, and emitting `skinRegistrationFailed` for schema breaches.
- [x] Extend adapter-facing coverage in `tests/interfaces/interface-adapter-integration.test.ts` to assert CLI/VSCode adapters bubble schema/compatibility failures when orchestrator injects an invalid-version skin.
- [x] Replace the placeholder validation in `src/skin/universal-skin-engine-impl.ts` with the real JSON schema flow by calling `validateSkinDefinition` (Ajv-backed) against `schemas/universal-skin-definition.schema.json`, enforcing schema-backed enforcement and attaching warnings to emitted events.
- [x] Harden `src/validation/skin-validator.ts` to compile/cache the schema with Ajv, normalize warning/error output, and fail when contract versions drift from `SkinVersionManager.getValidatorVersion()`.
- [x] Update `src/skin/skin-version-manager.ts` to record the validator/schema revision, gate compatibility on `metadata.minimumVersion`, and expose actionable issues consumed by the new integration tests.
- [x] Swap the temporary schema fallbacks in `schemas/universal-skin-definition.schema.json`/`skin-validator.ts` with the canonical `PerformanceHints`, menu, command, and workflow definitions from `src/types/universal-skin-definition.ts`.

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
- Schema: `schemas/universal-skin-definition.schema.json`

## Contract Directory Note (2026-06-15)

- `schemas` is reserved for public JSON contract artifacts owned by Templum. The skin contract now uses `universal-skin-definition.schema.json` with the Templum-owned `$id` `urn:templum:schema:universal-skin-definition:v1.0.0`.
- `service-manifest.ts` and `serialization-registry.ts` remain source runtime helpers. No JSON schema was added for the service manifest, service registry document, backend handshake payload, or CLI request envelope because the current repo exposes those as TypeScript/Zod implementation boundaries rather than existing public JSON schema artifacts.

## Current Assessment (2025-10-06)

- Implementation: Ajv-backed validation now secures skin registration, emits schema metadata, and version manager awareness is in place. Schema definitions for menus/commands/workflows were ported from the TypeScript contracts, but the JSON still lacks certain canonical constraints (e.g., full `PerformanceHints` typing) and will be replaced with the authoritative definitions in a follow-up.
- Tests: Contract (`tests/templum/skin-contract.integration.test.ts`) and adapter integration suites enforce failure propagation; both pass under `npm test -- --runTestsByPath …` and `jest --runInBand` invocations.
- Coverage: Full `npm test` remains blocked by an unrelated harness hang (see Testing Guide guidance); targeted suites succeed. `npm run test:coverage` still fails with the historic `babel-plugin-istanbul` issue and remains outside this task scope.
- Gaps to unblock: finalize canonical schema replacements, re-run the full test/validation stack once the harness hang is resolved, and capture coverage once the Istanbul tooling is repaired.

### Execution Log (2025-10-06)

- `npm test -- --runTestsByPath tests/templum/skin-contract.integration.test.ts tests/interfaces/interface-adapter-integration.test.ts`
- `node scripts/run-with-timeout.mjs --timeout 60000 --cwd Templum -- npm test` *(hangs; watchdog terminated, see Testing Guide §5 for leak-proof follow-up)*
- `node scripts/run-with-timeout.mjs --timeout 60000 --cwd Templum -- npm run test:coverage` *(still blocked by historical Istanbul error)*
- `npm test -- --runTestsByPath tests/templum/universal-skin-system.test.ts tests/templum/skin-contract.integration.test.ts tests/interfaces/interface-adapter-integration.test.ts --runInBand --forceExit`

# Task: Backend contract fixture library for regression coverage

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Backend contract fixture library for regression coverage."

## Prerequisites
- [~] Haruspex integration path defined (backend pending skin output). — align Haruspex fixture exports with the final documented contract once the integration path stabilises.
- [ ] Phoenix Code Lite skin ingestion validated. — use the validated ingestion flow to confirm the PCL fixture payload and command catalogue.

## Implementation Steps
### Unblocked Actions
- [ ] Stand up a shared fixture module under `Templum/tests/__fixtures__/backend/` that exports typed builders and JSON baselines for each supported backend (Haruspex IPC, PCL HTTP, Litany WebSocket, minimal example), reusing the `UniversalSkinDefinition` schema and collapsing duplicated mocks currently in `Templum/src/tests/backend/generic-backend-integration.test.ts` and `Templum/tests/templum/universal-skin-system.test.ts`.
- [ ] Refactor backend-focused suites (`Templum/src/tests/backend/generic-backend-integration.test.ts`, `Templum/src/tests/backend/comprehensive-backend-validation.test.ts`, `Templum/tests/backend/connection-factory.test.ts`) to import the new fixtures, ensuring each test covers protocol-specific wiring and rejects mutated contracts via snapshot or schema assertions.
- [ ] Introduce a regression harness (e.g., `Templum/tests/backend/contract-fixtures.regression.test.ts`) that iterates the fixture set against `ConnectionFactory.create()` and `TemplumBackendServiceRouter` to verify connection negotiation, command registration, and capability detection stay in sync with fixture metadata.
- [ ] Provide an update script (place in `Templum/scripts/validation/` or adjacent to existing tooling) that can pull live backend manifests (using `examples/minimal-backend` and future Haruspex/PCL endpoints) and regenerate fixture JSON with checksums so CI can detect drift.
- [ ] Document fixture usage and contribution rules in the repository (extend `Templum/docs/current/architecture-spec.md` operational notes and add README snippet under the new `tests/__fixtures__/backend/` directory) so backend teams know how to submit contract updates.

### Blocked Actions (pending Haruspex integration path defined)
- [ ] Capture the canonical Haruspex contract export once the integration path finalises, update the fixture baseline, and rerun regression tests to record the new checksum.

### Blocked Actions (pending Phoenix Code Lite skin ingestion validated)
- [ ] Run the validated ingestion pipeline to serialise the latest PCL skin definition, update the corresponding fixture, and ensure ingestion tests load the shared snapshot rather than in-test literals.

## Definition of Done
- Tests to run: `npm test -- --runTestsByPath src/tests/backend/generic-backend-integration.test.ts src/tests/backend/comprehensive-backend-validation.test.ts tests/backend/connection-factory.test.ts tests/backend/contract-fixtures.regression.test.ts`.
- Validation/commands: `npm run build`; execute the new fixture refresh script to confirm live backends serialise without schema drift.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md` integration/operations sections, and the fixture directory README.

## References
- Progress entry: `Templum/docs/current/progress.md:54`
- Architecture context: `Templum/docs/current/architecture-spec.md:30`
- Existing backend contract mocks: `Templum/src/tests/backend/generic-backend-integration.test.ts:28`
- Router and connection usage: `Templum/src/backend/backend-service-router.ts:1`, `Templum/src/backend/connection-factory.ts:43`
- Live backend source: `Templum/examples/minimal-backend/server.js:44`
- Skin engine consumers: `Templum/tests/templum/universal-skin-system.test.ts:421`
- Integration validation harness: `Templum/src/tests/backend/comprehensive-backend-validation.test.ts:23`

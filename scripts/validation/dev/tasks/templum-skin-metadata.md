# Task: Skin metadata for Templum visualisation

## Requirement Summary
- Status: [ ]
- Requirement text: `- [ ] Skin metadata for Templum visualisation (future goal).`

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Document the canonical skin metadata contract in `docs/current/guides/templum-skin-metadata.md`, mapping fields from `Templum/src/types/universal-skin-definition.ts` and `Templum/src/skin/universal-skin-engine.ts` to the Validation System’s outputs with examples for each interface type.
- [ ] Introduce a JSON schema (`config/templum-skin-schema.json`) plus configuration hooks (`config/projects/templum-valconfig.json`, `config/enhanced-config.json`) that specify where metadata is emitted and validated before Templum consumes it.
- [ ] Implement a metadata exporter module under `src/integration/templum/skin-metadata-exporter.js` that assembles validator-derived data (`config/capability-matrix.json`, `src/validators/*`) into the schema and writes `dev/templum-skin/metadata.json` for Templum ingestion.
- [ ] Integrate the exporter with the orchestrator/report pipeline (`src/core/enhanced-orchestrator.js`, `src/core/validation-report-service.js`) so metadata generation runs after relevant category executions and surfaces actionable logging on failure.
- [ ] Extend automated coverage (`tests/integration/test-enhanced-system.js`, new `tests/integration/test-templum-skin-metadata.js`) to assert the metadata file matches the schema and includes categories, interface capability flags, and timestamp/version stamps.

### Blocked Actions (if any)
- None.

## Definition of Done
- Tests to run (`node tests/integration/test-enhanced-system.js`, `node tests/integration/test-templum-skin-metadata.js`, `node tests/validation-system-enhancement-test.js`).
- Validation/commands (`node src/core/enhanced-orchestrator.js --category ui --project templum` to regenerate metadata and confirm schema validation passes).
- Documentation to update (`docs/current/progress.md`, `docs/current/architecture-spec.md`, `docs/current/guides/templum-skin-metadata.md`).

## References
- Progress entry: `docs/current/progress.md` (Interface Enablement section, line 31).
- Architecture spec sections: `docs/current/architecture-spec.md:13`, `docs/current/architecture-spec.md:19`, `docs/current/architecture-spec.md:33`, `docs/current/architecture-spec.md:45`, `docs/current/architecture-spec.md:57`.
- Templum skin sources: `Templum/src/types/universal-skin-definition.ts`, `Templum/src/skin/universal-skin-engine.ts`.

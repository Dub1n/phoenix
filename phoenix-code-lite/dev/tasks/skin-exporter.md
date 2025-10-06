# Task: Skin exporter generating dashboards/boards/report views for Templum

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Skin exporter generating dashboards/boards/report views for Templum."

## Prerequisites
- [~] Design inputs/requirements/risk traceability (data structures drafted; confirm implementation coverage). — exporter must consume the canonical requirement/risk models once the implementation is verified.
- [ ] Regulatory metadata catalog (standards clauses, owners, timestamps) live in system. — dashboards need the finalized catalog fields to embed compliance context.

## Implementation Steps
### Unblocked Actions
- [ ] Catalogue QMS data sources by reviewing `phoenix-code-lite/src/preparation/regulatory-document-processor.ts`, `phoenix-code-lite/src/preparation/qms-performance-target-validator.ts`, and related docs under `phoenix-code-lite/docs/current/index/ARCHITECTURE-DIAGRAM.md` to define which dashboards, boards, and reports the exporter must produce.
- [ ] Add a typed exporter module (e.g., `phoenix-code-lite/src/skin/exporter/templum-skin-exporter.ts`) that assembles a `UniversalSkinDefinition` using Templum’s schema (`Templum/src/types/universal-skin-engine-types.ts`), including role-based menus, dashboard panels, and report views sourced from the QMS model.
- [ ] Follow TDD by introducing unit tests (`phoenix-code-lite/tests/unit/skin/templum-skin-exporter.test.ts`) that snapshot exported skins, validate against schema, and assert the exporter surfaces dashboards/boards/report sections with the correct metadata.
- [ ] Integrate the exporter into existing command/CLI flows by wiring a `skin:export` command inside `phoenix-code-lite/src/commands/core-commands.ts` and plumbing it through the menu registry (`phoenix-code-lite/src/core/menu-registry.ts`) so exporting refreshes active skins for local preview.
- [ ] Create an integration regression (`phoenix-code-lite/tests/integration/skin-exporter.integration.test.ts`) that loads the generated skin via `SkinMenuRenderer` (`phoenix-code-lite/src/cli/skin-menu-renderer.ts`) to ensure dashboards render and navigation entities match expectations.
- [ ] Emit the skin artifact during builds (for example, writing `dist/skins/phoenix-code-lite.json`) and document invocation in project docs so Templum can ingest the exported file during connector setup.
- [ ] Update documentation (`phoenix-code-lite/docs/current/architecture-spec.md`) and add a README in `phoenix-code-lite/tests/unit/skin/` describing fixture expectations and exporter usage instructions.

### Blocked Actions (pending Design inputs/requirements/risk traceability)
- [ ] Once the traceability requirement completes, replace placeholder requirement/risk data in exporter fixtures with the finalized data structures and re-run schema validation to confirm dashboards align with the authoritative models.

### Blocked Actions (pending Regulatory metadata catalog)
- [ ] After the regulatory catalog is implemented, extend the exporter to embed standard clause metadata (owners, timestamps) into the dashboard widgets and regenerate fixtures/tests to cover the new fields.

## Definition of Done
- Tests to run: `npm test -- --runTestsByPath tests/unit/skin/templum-skin-exporter.test.ts tests/integration/skin-exporter.integration.test.ts`.
- Validation/commands: `npm run build`; execute the new `skin:export` command to produce `dist/skins/phoenix-code-lite.json` and verify Templum loads it without schema errors.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, exporter README (within `tests/unit/skin/` or adjacent module docs).

## References
- Progress entry: `phoenix-code-lite/docs/current/progress.md:20`
- Architecture context: `phoenix-code-lite/docs/current/architecture-spec.md:12`
- Data sources: `phoenix-code-lite/src/preparation/regulatory-document-processor.ts:1`, `phoenix-code-lite/src/preparation/qms-performance-target-validator.ts:1`
- Menu/system integration: `phoenix-code-lite/src/core/menu-registry.ts:1`, `phoenix-code-lite/src/cli/skin-menu-renderer.ts:1`
- Command wiring: `phoenix-code-lite/src/commands/core-commands.ts:1`
- Templum skin schema: `Templum/src/types/universal-skin-engine-types.ts:1`
- Existing integration test harness: `phoenix-code-lite/tests/integration/unified-architecture.test.ts:81`
- Architecture diagram callout: `phoenix-code-lite/docs/current/index/ARCHITECTURE-DIAGRAM.md:26`

## Current Status (2025-02-15)
- Implementation: no exporter module, CLI handler, or build artifact under `dist/skins/`; the runtime still renders static CLI menus without emitting `UniversalSkinDefinition` assets for Templum.
- Tests executed: none — unit/integration suites for the exporter have not been created.
- Coverage snapshot: not applicable while exporter code is missing.
- Gaps blocking completion: need canonical data feeds, exporter implementation, schema validation harness, and documentation updates to feed Templum.

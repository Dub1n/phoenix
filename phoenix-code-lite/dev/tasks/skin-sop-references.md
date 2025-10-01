# Task: Contextual SOP references wired into skin definitions.

## Requirement Summary
- Status: `[ ]`
- Requirement text: "- [ ] Contextual SOP references wired into skin definitions."

## Prerequisites
- [ ] Skin exporter generating dashboards/boards/report views for Templum *(see `dev/tasks/skin-exporter.md`)* — SOP hooks must plug into the exporter’s emitted `UniversalSkinDefinition`.

## Implementation Steps
### Unblocked Actions
- [ ] Author failing TDD coverage in `tests/qms/skin-sop-references.test.ts` that loads a generated skin JSON and asserts menu nodes expose `contextualReferences` with `sopId`, `title`, `link`, `summary`, and `applicableRoles`, and that references match the active workflow context.
- [ ] Implement a `SopReferenceIndex` module in `src/qms/knowledge/sop-reference-index.ts` that ingests structured SSI-SOP metadata from processed outputs (reuse `src/preparation/regulatory-document-processor.ts` pipelines) and caches lookups without duplicating parsing logic.
- [ ] Build a `SkinSopDecorator` in `src/qms/skin/sop-decorator.ts` that resolves SOP references per skin panel/menu item, applies dependency injection so tests can stub data sources, and enforces deterministic ordering plus audit `src/utils/audit-logger.ts` events when new SOP bindings are emitted.
- [ ] Extend the interim skin loader (`src/cli/skin-menu-renderer.ts` or QMS exporter stubs) to call the decorator, updating TypeScript types so `SkinMenuDefinition` supports the contextual data while keeping legacy skins backward-compatible.
- [ ] Update documentation in `docs/current/architecture-spec.md` (Integration Points and Outstanding Work) and `docs/03-PCL-QMS/05-QMS-Infrastructure-Technical-Notes.md` to record how SOP metadata flows into skins and which roles consume each reference.

### Blocked Actions (pending [ ] Skin exporter generating dashboards/boards/report views for Templum *(see `dev/tasks/skin-exporter.md`)*.)
- [ ] Wire `SkinSopDecorator` into the production skin exporter once the generator exists, and add an integration test (`tests/integration/templum-skin-sop-context.test.ts`) that drives the exporter CLI path and verifies Templum-compatible JSON includes the contextual references.

## Definition of Done
- Tests to run: `npm test -- tests/qms/skin-sop-references.test.ts`, `npm test -- tests/integration/templum-skin-sop-context.test.ts`.
- Validation/commands: `npm run build`, `node dist/unified-cli.js qms:export-skin --skin qms-medical-device --include-sop` (fails unless SOP references resolve correctly).
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, `docs/03-PCL-QMS/05-QMS-Infrastructure-Technical-Notes.md`.

## References
- Progress entry: `docs/current/progress.md:21`
- Architecture spec: `docs/current/architecture-spec.md:30`, `docs/current/architecture-spec.md:34`
- QMS knowledge base: `../docs/03-PCL-QMS/03-QMS-via-PCL.md:41`, `../docs/03-PCL-QMS/05-QMS-Infrastructure-Technical-Notes.md:30`, `../docs/03-PCL-QMS/07-QMS-Knowledge-Transfer-Guide.md:95`

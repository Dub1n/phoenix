# Task: Role-based menu sets derived from skin metadata

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Role-based menu sets derived from skin metadata."

## Prerequisites
- [ ] Skin exporter generating dashboards/boards/report views for Templum. (see dev/tasks/skin-exporter.md) — Role-aware menus must ingest the exporter’s canonical `UniversalSkinDefinition` so CLI views stay consistent with Templum skins.

## Implementation Steps
### Unblocked Actions
- [ ] Start with TDD by adding `phoenix-code-lite/tests/qms/role-based-menus.test.ts` that loads representative skin metadata fixtures (roles, permissions, menu hierarchies) and asserts a new `RoleMenuAssembler.generateSets()` returns filtered menus per role, enforces default/fallback behaviour, and emits audit-ready metadata before any production code changes.
- [ ] Define shared contracts for skin access metadata in `phoenix-code-lite/src/qms/skin/role-menu-types.ts`, extending `SkinMenuItem`/`SkinMenuDefinition` via focused augmentations (e.g., `allowedRoles`, `visibilityRules`) while re-exporting existing structures from `src/cli/unified-layout-engine.ts` to stay DRY and strongly typed.
- [ ] Implement `RoleMenuAssembler` in `phoenix-code-lite/src/qms/skin/role-menu-assembler.ts` that normalizes exporter metadata, collapses inheritance, and produces `LoadedSkin` payloads grouped by role; inject `MenuRegistry` and `PhoenixCodeLiteConfig` dependencies so tests can stub configuration/state without global coupling.
- [ ] Update CLI surfaces to consume the assembler output: thread an `activeRole` through `SessionContext` (`src/cli/session.ts`) and `MenuSystem` (`src/cli/menu-system.ts`) so menu rendering picks the role-specific set, add config persistence (`ui.activeRole`) in `src/config/settings.ts`, and cover the behavioural change with `tests/unit/cli/session/role-menu-session.test.ts`.
- [ ] Surface a role preview command (e.g., `phoenix-code-lite/src/commands/qms-role-menus.ts` wired through `src/commands/command-registration.ts`) plus CLI handler tests (`tests/unit/cli/commands/qms-role-menus.test.ts`) so developers can list available roles and swap the active profile without editing config manually.
- [ ] Extend `SkinMenuRenderer` (`src/cli/skin-menu-renderer.ts`) to respect `allowedRoles` when falling back to built-in definitions, ensuring legacy rendering still works; write targeted coverage in `tests/unit/cli/skin-menu-renderer-role-filter.test.ts` validating mixed-role menus.
- [ ] Document the role-menu pipeline in `phoenix-code-lite/docs/current/index/ARCHITECTURE-DIAGRAM.md` and `phoenix-code-lite/docs/current/architecture-spec.md` (Operational Considerations) describing how skin metadata drives CLI access profiles, and update developer notes under `phoenix-code-lite/docs/current/index/CODEBASE-INDEX.md` for the new modules.

### Blocked Actions (pending `[ ] Skin exporter generating dashboards/boards/report views for Templum. (see dev/tasks/skin-exporter.md)`)
- [ ] Replace fixture-driven metadata with the exporter’s real `UniversalSkinDefinition`, hook `RoleMenuAssembler` into the export pipeline, and add an end-to-end regression (`tests/integration/skin/role-menu-exporter.test.ts`) once the exporter lands to ensure generated skins include `roleAccess` entries consumed by the CLI.

## Definition of Done
- Tests to run (`npm test -- tests/qms/role-based-menus.test.ts`, `npm test -- tests/unit/cli/session/role-menu-session.test.ts`, `npm test -- tests/unit/cli/skin-menu-renderer-role-filter.test.ts`).
- Validation/commands (`node dist/unified-cli.js config --set ui.activeRole=compliance-reviewer`, `node dist/unified-cli.js qms:role-menus --role compliance-reviewer` once wired) verifying role selection swaps menu sets and audit logs capture the change.
- Documentation to update (`phoenix-code-lite/docs/current/progress.md`, `phoenix-code-lite/docs/current/architecture-spec.md`, `phoenix-code-lite/docs/current/index/ARCHITECTURE-DIAGRAM.md`, `phoenix-code-lite/docs/current/index/CODEBASE-INDEX.md`).

## References
- Progress entry: `phoenix-code-lite/docs/current/progress.md:22`.
- Architecture spec role access callout: `phoenix-code-lite/docs/current/architecture-spec.md:51`.
- Built-in skin definition stub: `phoenix-code-lite/src/cli/skin-menu-renderer.ts:287`.
- Legacy menu rendering context: `phoenix-code-lite/src/cli/menu-system.ts:84`.
- Configuration schema for UI settings: `phoenix-code-lite/src/config/settings.ts:39`.

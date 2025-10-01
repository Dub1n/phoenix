# Task: Skin media/localisation/command asset validation

## Requirement Summary

- Status: `[ ]`
- Requirement text: "Asset validation (media/localisation/command bindings)."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [ ] Expand the skin schema to capture localisation and richer asset metadata: add a `LocalizationBundle` map and optional `labelKey`/`descriptionKey` fields to `src/types/universal-skin-definition.ts:270` (menus), `src/types/universal-skin-definition.ts:316` (commands), and `src/types/universal-skin-definition.ts:369` (workflow steps), and extend `SkinAssets` to describe source path, format constraints, and expected size/checksum values per asset.
- [ ] Replace the placeholder logic in `src/skin/skin-version-manager.ts:1143` and `src/skin/skin-version-manager.ts:1529` with a concrete `SkinAssetValidator` that loads assets relative to a configurable root, verifies file existence/size/format (icons, images, fonts, sounds), composes localisation coverage results for the default locale, and produces actionable diagnostics for missing or unsupported assets.
- [ ] Add a command-binding validator that walks `SkinMenus`, `ContextMenuDefinition`, `SkinWorkflows`, and shortcut/alias tables to ensure every referenced `command` resolves to a definition in `skin.commands`, and surface any dangling references through the advanced compatibility report (update `validateStructuralCompatibility`/`validateFeatureCompatibility` as needed).
- [ ] Back the validators with targeted unit tests under `src/tests/skin/skin-asset-validation.test.ts` exercising happy path, missing asset, unsupported format, absent localisation key, and dangling command cases; update `src/tests/backend/comprehensive-backend-validation.test.ts:524` to assert the advanced compatibility report fails when assets/localisation/command bindings are invalid.
- [ ] Provide a CLI/scripting entry point (e.g., `scripts/validation/validate-skin-assets.ts`) that wraps `SkinVersionManager.validateAdvancedCompatibility` with the new options so backend teams can run `npm run validate:skin-assets -- --skin <path>`; document the workflow in `docs/current/1.2-Backend-Integration-Guide.md:204` and call out the validator in `docs/current/architecture-spec.md`.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests: `npm test -- src/tests/skin/skin-asset-validation.test.ts src/tests/backend/comprehensive-backend-validation.test.ts`; `npm run test:health`.
- Validation: `npm run validate:skin-assets -- --skin examples/minimal-backend/skin-definition.json` (or the backend-provided manifest) completes with all assets/locales/command bindings reported healthy.
- Documentation: Update `docs/current/progress.md`, `docs/current/architecture-spec.md`, and `docs/current/1.2-Backend-Integration-Guide.md` with the asset validation flow and troubleshooting guidance.

## References

- docs/current/progress.md:21
- docs/current/architecture-spec.md:30
- src/types/universal-skin-definition.ts:270
- src/skin/skin-version-manager.ts:1143
- src/backend/dynamic-command-router.ts:72
- src/tests/backend/comprehensive-backend-validation.test.ts:524

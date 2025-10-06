# Task: Modularise Universal Skin Engine

## Goal

Restructure the universal skin engine so schema management/version gating and interface rendering are separated, reducing duplication and making extensions predictable.

## Implementation Outline

1. **Skin registry module**
   - Move schema compilation, version compatibility, and storage into `src/skin/skin-registry.ts` with clear APIs (`registerSkin`, `getSkin`, `listSkins`).
2. **Renderer pipelines**
   - Create per-interface renderers (CLI, VSCode, command) that accept a `SkinDefinition` and context to produce render packets.
3. **Adapter integration**
   - Update adapters to request render packets instead of invoking the monolithic engine; ensure dependency injection stays aligned.
4. **Re-use Phoenix assets**
   - Pull validated layout/menu components from Phoenix Code Lite into shared modules reused by the new renderers.
5. **Retire legacy engine**
   - Remove duplicate implementation files once tests pass against the new modules.
6. **Testing**
   - Expand existing integration suites to assert registry caching, version conflict handling, and render outputs.

## Notes

- Run only after MVP rendering pipeline is stable.
- Coordinate with `dev/tasks/skin-payload-consumption.md` and `dev/tasks/cli-skin-generator.md`.

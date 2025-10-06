# Task: Universal Skin Engine convergence roadmap

Related requirement: `docs/current/progress.md` → Skin-Driven Rendering → "Universal Skin Engine convergence roadmap".

Tags: `#infra`

## Checklist

- [ ] Extract validation/render/cache responsibilities from `UniversalSkinEngine` into dedicated modules that meet SOLID/file-size guidelines.
- [ ] Port the Phase 5 validation + versioning logic from `src/skin/universal-skin-engine-impl.ts` into the modularised engine without regressing current PCL workflows.
- [ ] Retire the duplicate Phase 5 implementation after the consolidated engine passes existing interface + backend suites.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `project: universal skin engine convergence` after tests.

## References

- Code: `src/skin/universal-skin-engine.ts`, `src/skin/universal-skin-engine-impl.ts`, `src/backend/backend-service-router.ts`, `src/core/adapter-registry.ts`
- Tests: `npm run test -- --runTestsByPath src/tests/backend/comprehensive-backend-validation.test.ts`, `npm run test -- --runTestsByPath tests/interfaces/interface-adapter-integration.test.ts`
- Docs: `dev/architecture/architecture-restructuring-plan.md`, `docs/current/progress.md`

## Current Assessment (2025-10-05)

- Implementation: Both engine implementations remain active with overlapping logic; no modular extraction or consolidation has occurred.
- Tests: Neither of the referenced suites has been updated to fail on duplicate engine behaviour; in fact, `tests/backend/comprehensive-backend-validation.test.ts` currently fails before execution due to the coverage instrumentation error.
- Next work: plan the extraction, add sanity tests for the consolidated modules, and remove the redundant implementation once the new structure passes the existing suites.

## Notes

- Current engine owns PCL rendering (`PCLRenderingAdapter`), theme telemetry, fallback orchestration, and interface registration; keep these behaviours intact while reshaping the internals.
- Phase 5 prototype (`universal-skin-engine-impl.ts`) provides stronger `registerSkin` validation (semantic version parsing, conflict resolution) and a simplified cache; lift these improvements instead of swapping implementations outright.
- Plan aligns with restructuring guidance to maintain skin-rendering independence while reducing code size and duplication.
- Regenerate dependency maps once the refactor lands to capture new module boundaries.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed

> Scope: **Post-MVP** — stabilise the existing engine for MVP; convergence refactor resumes once skin validation/rendering are proven.

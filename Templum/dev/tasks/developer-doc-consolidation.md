# Task: Developer documentation consolidation & onboarding

## Requirement Summary

- Status: `[ ]`
- Requirement text: "Developer documentation consolidation for post-migration workflows (API surface, adapter guides, onboarding)."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [ ] Audit existing developer-facing material (`docs/archive/*.md`, `dev/templum-roadmap.md`, `dev/patterns/`) and outline the post-migration handbook structure in `docs/current/developer-handbook/README.md`, capturing required sections for API surface, adapter guides, and onboarding flows.
- [ ] Document the API surface by extracting entry points and exported types from `src/core/templum-core.ts`, `src/interfaces/templum-orchestrator-interface.ts`, `src/backend/backend-service-router.ts`, and related `src/types/*.ts`, producing `docs/current/developer-handbook/api-surface.md` with links back to the source.
- [ ] Produce adapter implementation guides in `docs/current/developer-handbook/adapter-guides.md` summarising CLI (`src/interfaces/cli-adapter.ts`, `examples/minimal-cli.ts`), VSCode (`src/interfaces/vscode-adapter.ts`, `src/extension.ts`), and command adapters, including expected skin payload hooks and lifecycle notes from `docs/current/1.2-Backend-Integration-Guide.md`.
- [ ] Create an onboarding playbook `docs/current/developer-handbook/onboarding.md` that covers environment setup, required tooling, and “first day” workflows (build/test commands from `package.json`, validation scripts under `scripts/`, and test directories under `tests/`).
- [ ] Cross-link the new handbook from `docs/current/architecture-spec.md` (Summary and Verification & Validation sections) and retire outdated duplicates by updating `docs/archive/ARCHIVE_INDEX.md` with pointers to the consolidated docs.
- [ ] Update developer task indexes (`dev/templum-active-tasks.md`, `dev/tasks/`) if needed to reference the handbook, and prepare change notes for `docs/current/progress.md` once ready to mark progress.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Developer handbook exists under `docs/current/developer-handbook/` with `README.md`, `api-surface.md`, `adapter-guides.md`, and `onboarding.md` populated and internally cross-linked.
- `docs/current/architecture-spec.md` reflects the consolidated documentation and references the handbook for developer workflows.
- Archive index updated to point to the new canonical docs; redundant copies removed or clearly deprecated.
- Quality checks (`npm run lint`, `npm run test:health`) pass after documentation updates.
- `docs/current/progress.md` updated to include the handbook link for this requirement and status reviewed.

## References

- docs/current/progress.md:35
- docs/current/architecture-spec.md
- docs/archive/ARCHIVE_INDEX.md
- docs/current/1.2-Backend-Integration-Guide.md
- src/core/templum-core.ts
- src/interfaces/templum-orchestrator-interface.ts
- src/interfaces/cli-adapter.ts
- src/interfaces/vscode-adapter.ts
- src/backend/backend-service-router.ts
- package.json

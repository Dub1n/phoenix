# Task: Command Template Metadata

Related requirement: `docs/target/post-mvp-progress.md` → Skin-Driven Rendering → "Command template metadata for backend skins".

Tags: `#feature`

## Checklist

- [ ] Define a skin metadata schema for command templates (argument sources, defaults, transforms) and document it in `docs/current/1.2-Backend-Integration-Guide.md`.
- [ ] Provide SDK/helpers (or validation utilities) to generate and verify command templates alongside skins.
- [ ] Update adapters/renderers to honour command templates when present while preserving fallback behaviour.
- [ ] Add canonical examples to the backend mock and testing fixtures demonstrating CLI tool mappings (e.g., `rg` wrapper).
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: add command template metadata` after tests.

## References

- Code: `Templum/src/interfaces`, `Templum/src/core/templum-core.ts`, `Templum/src/tests/rendering`
- Tests: `tests/interfaces/**`, `tests/rendering/**`
- Docs: `Templum/docs/current/1.2-Backend-Integration-Guide.md`, `Templum/docs/current/tests/universal-backend-mock-spec.md`

## Notes

- Treat templates as optional metadata, flagged via a capability (e.g., `commandTemplates`) so minimal backends remain unaffected.
- Ensure templates integrate with Templum’s state manager so multi-step menu flows can preview and confirm command execution before dispatch.
- Coordinate with `dev/tasks/backend-capability-tiering.md` so capability flags stay consistent across docs and implementation.
- If this task changes prerequisites or dependency relationships, regenerate the project’s dependency map JSON (see `dev/tasks/*_task_dependencies.json`) and attach the updated file in the related progress planner.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed

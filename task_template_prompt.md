You are assisting with repository documentation for the `{{PROJECT_NAME}}` project.

Goal: Create or update a single task file that makes the requirement immediately actionable for a developer.

Inputs to consult:

- high-level overview: `meta\templates\architecture-spec.md`
- `{{PROJECT_PATH}}/docs/current/progress.md`
- `{{PROJECT_PATH}}/docs/current/architecture-spec.md`
- relevant source/tests under `{{PROJECT_PATH}}/src/` and `{{PROJECT_PATH}}/tests/`

Steps:

1. Restate the requirement exactly as listed in `progress.md` (include its status marker and text).
2. Determine prerequisite requirements:
   - If the requirement depends on other entries in `progress.md`, list them under **Prerequisites**, referencing them by their exact labels/status.
   - For partially blocked work, split the checklist into **Unblocked Actions** and **Blocked Actions (pending [Requirement Name])**.
3. Draft the task file at `{{TASK_PATH}}` with the following sections:

```markdown
# Task: <short requirement restatement>

## Requirement Summary
- Status: `[ ]` / `[~]` / etc. (copy from progress)
- Requirement text: "..."

## Prerequisites
- [ ] Requirement label — explanation (if none, state "None.")

## Implementation Steps
### Unblocked Actions
- [ ] Specific code/test/doc updates (reference files, e.g., `src/...`).

### Blocked Actions (if any)
- [ ] Work that must wait on prerequisite completion.

## Definition of Done
- Tests to run (`npm test`, unit files, etc.).
- Validation/commands (e.g., Validation System category).
- Documentation to update (progress.md, architecture-spec sections, changelog).

## References
- Progress entry: `docs/current/progress.md` (line/section).
- Architecture spec sections.
- Related task files if applicable.
```

4. Update `{{PROJECT_PATH}}/docs/current/progress.md` so the requirement line includes a link to the task file, e.g., `(see dev/tasks/<filename>.md)` while preserving the existing status marker and notes.
5. Do not modify other requirements or files.
6. After completion, output a concise summary of modifications (task file created/updated, progress link added).

Follow these instructions regardless of existing content; ensure the resulting task file contains concrete implementation guidance, not placeholders.

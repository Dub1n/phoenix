# Documentation Change Checklist

Use this list before finalising any change. Mark items as you go and link the checklist from your task log if helpful.

Legend: `[ ]` pending · `[x]` complete

## Core Checklist (all changes)

- [ ] Update relevant code/tests.
- [ ] Run required tests/validation commands.
- [ ] Update canonical spec (`docs/current/architecture-spec.md` or equivalent) when behaviour changes.
- [ ] Update progress tracker (`docs/current/progress.md`).
- [ ] Update or verify `docs/current/testing-guide.md` if test commands, prerequisites, or runtimes changed.
- [ ] Update/close requirement task log under `dev/tasks/`.
- [ ] Archive or tag superseded docs/scripts.
- [ ] `git status` clean except intentional changes; commit with descriptive message.

## Additional Checks by Change Type

### Feature / Enhancement (`#feature`)

- [ ] Add/extend documentation explaining new behaviour.
- [ ] Ensure Validation System coverage updated or planned.
- [ ] Note migration considerations if existing users affected.

### Bugfix (`#bugfix`)

- [ ] Document root cause and fix link in progress/task log.
- [ ] Add regression test or monitoring hook.
- [ ] Verify related requirements remain satisfied.

### Infrastructure / Refactor (`#infra`)

- [ ] Update architecture diagrams or references impacted.
- [ ] Confirm CI/validation scripts still pass.
- [ ] Record decisions/ADRs if architectural choices changed.

### Documentation-only (`#docs`)

- [ ] Ensure content is sourced from verified behaviour (or clearly marked otherwise).
- [ ] Update archive index if deprecating files.
- [ ] Alert owners of dependent docs if follow-up needed.
- [ ] If pattern categories change, sync `docs/current/pattern-taxonomy.md`, the schema enum, and `meta/templates/pattern-taxonomy-template.md`.
- [ ] Validate affected docs with `meta/scripts/validate_frontmatter.py` (override `--schema` if a project-specific variant is required).

Keep this checklist lean—add project-specific items adjacent to the relevant requirement task logs if needed.

---
doc-type: documentation-index
id: templum-developer-documentation-index
status: current
tags: [development, documentation, navigation]
last_updated: 2026-07-16
---

# Templum Developer Documentation

This page indexes developer working material. It does not duplicate project status.

## Canonical Current State

- `../docs/current/architecture-spec.md` - implemented architecture and explicit verification gaps.
- `../docs/current/progress.md` - requirement status and links to focused task logs.
- `../docs/current/testing-guide.md` - supported validation commands and test ownership.
- `../docs/current/pattern-taxonomy.md` - permitted pattern categories and metadata rules.

## Active Work

- `tasks/` - one focused log per incomplete requirement. See `tasks/README.md` for lifecycle rules.
- `CLI/` - active CLI product and character-grid renderer target architecture.
- `architecture/` - active target plans plus consolidation evidence and generated schedules.
- `patterns/` - reusable implementation guidance; verify a pattern against current code before reuse.
- `auto/` - active automation research and scripts pending a separate lifecycle audit.

## Historical Evidence

- `fixes/` - historical implementation/fix reports; not a current task source.
- `validation-results/` - generated validation evidence; not developer guidance.
- `../docs/archive/` - superseded specifications, trackers, and documentation indexed by `ARCHIVE_INDEX.md`.
- `Thoughts/` - unverified exploratory notes pending a later archive audit.

Do not infer current implementation status from historical evidence. Use `architecture-spec.md` and `progress.md`.

## Tracking Model

The legacy top-level active/future task queues, roadmap, and health-dashboard tracker were superseded on 2026-07-16.

- Requirement status belongs in `progress.md`.
- Incomplete requirement work belongs in a focused file under `tasks/`.
- Target architecture belongs in `dev/architecture/` or the relevant area directory.
- Completed or superseded records belong in `docs/archive/` with an archive-index entry.

## Change Discipline

When behaviour changes, update code, tests, `architecture-spec.md`, `progress.md`, `testing-guide.md` when applicable, and the relevant task log in the same change. Follow `meta/DOC_CHANGE_CHECKLIST.md` before finalising documentation work.

---
doc-type: documentation-index
id: templum-cli-documentation-index
category: documentation-index
status: current
tags: [cli, renderer, documentation]
last_updated: 2026-07-16
---

# Templum CLI Documentation

This directory contains the active product and target-architecture documentation for the Templum CLI. Implemented reality remains canonical in `docs/current/architecture-spec.md`; requirement status remains canonical in `docs/current/progress.md`.

## Active Documents

- `CLI-product-spec.md` - observable CLI behaviour and acceptance rules.
- `CLI-character-grid-architecture.md` - accepted target architecture for the replacement CLI presentation runtime.
- `report_2026-07-16.md` - accepted decision record explaining why the current renderer is being replaced.
- `renders/2.1_examples.ASCII` - source design examples retained for comparison while golden fixtures are implemented.
- `renders/2.1_condensed_heading.ASCII` - compact source design example retained for comparison.

## Active Task

- `../tasks/cli-character-grid-renderer.md` - implementation stages, migration gates, validation, and evidence.

## Document Ownership

| Information | Owner |
|---|---|
| Implemented CLI reality | `docs/current/architecture-spec.md` |
| Requirement status | `docs/current/progress.md` |
| User-visible CLI contract | `CLI-product-spec.md` |
| Target renderer architecture | `CLI-character-grid-architecture.md` |
| Implementation work and evidence | `dev/tasks/cli-character-grid-renderer.md` |
| Superseded CLI designs | `docs/archive/cli/` and `docs/archive/ARCHIVE_INDEX.md` |

## Status Rules

- Do not describe target behaviour as implemented until code and tests prove it.
- Do not add a second CLI task tracker in this directory.
- Move superseded designs to the archive after their still-valid requirements have been migrated.
- Treat ASCII examples as design inputs until exact golden fixtures exist in the test suite.

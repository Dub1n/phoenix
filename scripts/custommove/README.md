# custommove utility

`custommove` wraps the repeatable workflow for moving pattern files while keeping repository references consistent.

## Installation

No additional installation is required. The repo root exposes the binary via `package.json`, so you can run it with `npx` or add a shell alias:

```bash
npx custommove <source-pattern> <target-pattern> [options]
```

To prefer a short alias, add something like the following to your shell profile:

```bash
alias custommove='npx custommove'
```

## Pattern syntax

- **Bracket expansion**: `Templum/dev/patterns/[foo|bar].md` expands to both `foo.md` and `bar.md`.
- **Target placeholder**: `[*]` injects the source filename **without** its extension (the stem). Append the extension yourself—e.g. `Templum/dev/patterns/foundation/[*].md` → `pattern-name.md`, or `Templum/dev/patterns/backups/[*]_backup.md` → `pattern-name_backup.md`.

## Options

- `--dry-run` – Preview the operations without modifying files.
- `--no-ref-update` – Skip repository-wide reference replacements.
- `--skip-check` – Omit the post-move ripgrep verification.
- `--ref-root <dir>` – Limit reference rewriting to a subtree (defaults to repo root).
- `--commit[=<msg>]` / `--message <msg>` – Automatically commit the staged changes.
- `--silent` – Suppress informational logging.

## Examples

Move a single pattern into a category folder:

```bash
npx custommove Templum/dev/patterns/<pattern-name>.md Templum/dev/patterns/foundation/<pattern-name>.md
```

Move a batch of patterns using expansion and update references:

```bash
npx custommove \
  'Templum/dev/patterns/[pattern-a|pattern-b|pattern-c].md' \
  'Templum/dev/patterns/foundation/[*].md'
```

Dry-run a move scoped to documentation files and auto-commit afterwards:

```bash
npx custommove Templum/dev/patterns/<pattern-name>.md \
  Templum/dev/patterns/integration/<pattern-name>.md \
  --dry-run --ref-root Templum/docs/current --commit "Move pattern"
```

## Workflow

1. Resolves all sources from the provided pattern.
2. Creates target directories as needed and performs `git mv` (unless `--dry-run`).
3. Rewrites tracked text files so references to the old path point at the new location.
4. Runs an `rg` sweep to ensure no stale paths remain.
5. Optionally commits the result.

Binary files are skipped during replacement detection, and all commands run relative to the git repository root to keep history clean.

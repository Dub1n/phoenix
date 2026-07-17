# Consolidation CLI — Interaction Design

## Goals

- Prevent agents from skipping required gates or forgetting evidence.
- Provide a single entrypoint to read the current registry state, update lanes/stages, and regenerate Markdown artefacts.
- Emit clear terminal cues that surface outstanding prerequisites before allowing progress.

## Architecture Overview

The consolidate CLI is a thin wrapper around three core modules:

1. **Command registry (`cli-command-registry.mjs`)** — declarative descriptors that describe usage, flags, and examples.
2. **Shared parser (`cli-shared-parser.mjs`)** — normalises argv, applies coercions/aliases, and enforces required arguments.
3. **Command driver (`consolidation-scripts/cli-command-stub.mjs`)** — executes the command, mutates `consolidation-state.json`, emits guidance, and triggers targeted regenerations. The driver now focuses on parse → dispatch → persist flows and pulls in shared helpers from the `modules/` directory instead of embedding utility logic inline.
4. **Support modules (`consolidation-scripts/modules/…`)** — house environment resolution, time utilities, plan-file + search-term normalisers, cleanup guard orchestration, markdown formatting, and registry runtime helpers (load/save, Ajv validation, pending regen tracking). These modules keep behaviour centralised while shrinking the driver surface.

### Evidence output boundary

Consolidation commands executed through `scripts/run-with-timeout.mjs` must place
`--log-file` output under `archive/dev-files/utility-migration/evidence/` using
`pattern-<id>/stage<id>/[lane<id>/]<name>.log`. The general-purpose wrapper
requires an `archive/` directory within the monorepo because it also serves
other projects and workflows; consolidation CLI guidance supplies this
workflow-specific layout.
Registry `--files` entries should use the repository-relative
`Templum/archive/...` form.

### Command Dispatch Flow

```mermaid
flowchart LR
    A["CLI entry<br>npm run consolidate"] --> B["Load command descriptors"]
    B --> C["cli-shared-parser<br>normalises argv"]
    C --> D{Command handler}
    D -->|Read-only| E["Render guidance<br>/status output"]
    D -->|Mutating| F["Update registry -->JSON"]
    F --> G["Ajv schema validation"]
    G --> H["Persist state<br>+ regen plans/activity"]
    H --> I["Console summary<br>(next-work hints)"]
    E --> I
```

### State Mutation Sequence

```mermaid
sequenceDiagram
    participant Agent
    participant CLI
    participant Parser
    participant Handler
    participant Registry
    participant Generators

    Agent->>CLI: npm run consolidate -- update-lane 4 4d --status complete
    CLI->>Parser: argv
    Parser-->>CLI: {command, positionals, options}
    CLI->>Handler: dispatch("update-lane", payload)
    Handler->>Registry: load + mutate lane entry
    Handler->>Registry: Ajv validate
    Registry-->>Handler: ok / throw
    Handler->>Generators: schedule targeted regen (plans, activity, schedules)
    Generators-->>Handler: rendered artefacts (optional)
    Handler-->>Agent: status summary, next-work hint, warnings
```

### Data Sources & Outputs

- **Primary datastore:** defaults to the `consolidation-state.json` that ships next to the CLI config (schema: `consolidation-state.schema.json`). Override the location through `CONSOLIDATION_STATE_PATH` or the config-driven `paths.registryState` hook when mirroring the registry elsewhere.
- **Derived artefacts:** utility plans (`dev/architecture/plans/<patternId>.generated.md` by default), activity log (`dev/architecture/utility-consolidation-activity-log.generated.md`), cohort/global schedules (`dev/architecture/schedules/{cohortId\|schedule-all}.{md,json}`), and hand-off manifests. Each target honours the shared path overrides surfaced by the environment helper so relocations stay centralised.
- **Console guidance:** assembled on demand (no cached Markdown), incorporating live registry, lane dependencies, and cohort signals.

### Root Resolution & Path Overrides

- The environment module resolves the repository root by scanning upward from the CLI location until it finds a `package.json`, letting `npm run consolidate` work from the workspace root or from inside the scripts directory without divergent behaviour.
- Root detection can be overridden explicitly: the `CONSOLIDATION_REPO_ROOT` environment variable wins first, followed by the `root` entry inside `consolidation-cli.config.json`. Both accept `~/` expansion and must point at an existing directory; invalid overrides stop execution early instead of silently guessing.
- The module exports `cliPaths`, a frozen map covering plans, schedules, the activity log, and the generated registry tracker. Each entry defaults to the canonical locations above but can be redirected through the config’s `paths` block without touching command handlers.
- Registry persistence, schedule generation, and any CLI flag that accepts a path now flow through `resolveRepoPath`, ensuring overrides stay relative to the resolved root. Schedule commands therefore write to the intended checkout even when invoked from another workspace.

### Regeneration Output Filters

- `generatedArtifacts` inside `consolidation-cli.config.json` lets teams whitelist which autogenerated files should refresh during registry mutations or `npm run consolidate -- regen`. Leave the array empty (or omit it) to preserve the default “update everything” behaviour.
- Entries accept filename shorthands or friendly aliases—`"2"` or `"2.generated.md"` target `plans/2.generated.md`, `"A"` covers both `schedules/A.md` and `A.json`, while `"A.md"` narrows to the Markdown artefact. Optional `.generated`, `.md`, and `.json` suffixes are ignored unless they pick a specific format.
- Use `"schedule-all"`/`"global"` for the shared schedule, `"activity"` or the full `utility-consolidation-activity-log.generated.md` name for the activity log, and `"registry-status"`/`"tracker"` for the registry summary. `"plan"` or `"schedule"` enable entire categories, and `"*"` restores “generate everything” without editing the array.
- When a file is filtered out the CLI logs it as `skipped` during regen summaries, ensuring agents can confirm the config is the reason a file stayed untouched.

## Command Surface

| Command                                                   | Purpose                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run consolidate -- guide <patternId> [--stage N] [--lane 6b] [--lanes] [--recent] [--next\|-n]` | Surface focused guidance for a pattern, optionally narrowed to a stage or lane, surface planned-file conflicts, and highlight the next actionable work item. |
| `npm run consolidate -- status <patternId>`               | Show registry snapshot (stage pointer, cohort membership, pending lanes, blockers, and latest evidence). |
| `npm run consolidate -- claim <patternId> --stage <id>\|--lane 6b [--summary text] [--note text] [--plan-files a,b]` | Claim a stage or lane, stamp the start timestamp, register planned files, and log the deterministic agent id for collision prevention. |
| `npm run consolidate -- cohort [--all] [--create patternIds] [--id <cohortId> --list] [--id <cohortId> --add-pattern ids --remove-pattern ids] [--name text] [--description text] [--note text]` | Manage cohort rosters and metadata; ids auto-increment A, B, … AA, and roster edits keep each pattern in exactly one cohort while `--all`/`--list` provide read-only previews. |
| `npm run consolidate -- cohort-stage <cohortId> --segment <segmentId> [--status <value>] [--show] [--plan-files …] [--notes text]` | Manage or inspect cohort segments (Stage 5A and beyond); `--show` previews without mutation, and marking 5A `complete` enforces the shared plan-file requirement and propagates it to Stage 5 gates. |
| `npm run consolidate -- stage-note <patternId> <stageId> --body "<text>"` | Append a stage-scoped note (auto-tagged in the guide output) to capture discoveries and guardrails. |
| `npm run consolidate -- update-stage <patternId> <stageId> [--status <value>] [--plan-files …] [--search-terms …] [--clear-search-terms] [--clear-plan-files] [--add-dependency patternId:gate] [--remove-dependency patternId:gate] [--clear-dependencies] [--force]` | Update stage gate status, manage dependencies, keep search terms/planned files aligned, and enforce the planned-file cleanup guard (use \`--force\` only after documenting intentional leftovers). |
| `npm run consolidate -- update-handoff <patternId> [options]` | Maintain shared guardrails, files, and acknowledgements recorded during Stage 5 hand-off. |
| `npm run consolidate -- update-lane <patternId> <laneId> [--status <value>] [--plan-files …] [--search-terms …] [--clear-search-terms] [--clear-plan-files] [--add-dependency patternId:gate] [--remove-dependency patternId:gate] [--clear-dependencies] [--force]` | Update lane status (`pending`/`in_progress`/`blocked`/`complete`), manage planned files/search terms, emit guard results, and keep dependency propagation accurate. |
| `npm run consolidate -- remove-lane <patternId> <laneId> [--summary text] [--agent name] [--drop-notes] [--force]` | Remove an existing Stage 4/6 lane, optionally delete lane-scoped notes, clear dependency references, and recompute stage readiness (use `--force` only after detaching dependants). |
| `npm run consolidate -- sweep <patternId> (--stage <id> \| --lane <laneId>) [--list]` | Re-run the planned-file search for recorded terms, list counts per file when matches remain, and exit non-zero so agents can resolve or document the residue; skips CLI artefacts, surfaces `.gitignore`/excluded-only plans, and preserves stationarity if the CLI moves. |
| `npm run consolidate -- append-activity <patternId> --scope stage-6\|lane-6b --summary "<text>"` | Append collaborative evidence to the activity log without changing the underlying stage/lane status (combine with `--stage`/`--lane` shortcuts for clarity). |
| `npm run consolidate -- reopen <patternId> <laneId>`      | Roll back a lane to `pending`/`blocked` (forces plan/hand-off review). |
| `npm run consolidate -- schedule [--patterns "[1,2]"] [--cohort id] [--format json\|markdown] [--output path] [--no-save]` | Generate a deterministic, cohort-aware schedule; defaults to Markdown saved to `Templum/dev/architecture/schedules/` (request JSON explicitly when needed). |
| `npm run consolidate -- regen [--check] [--pattern id] [--cohort id] [--no-global] [--force-all]` | Regenerate plan previews, the activity log, and targeted schedules; defaults to only the artefacts named by the provided filters (or the scopes touched during the session). |

All subcommands operate on `consolidation-state.json`, validate via the schema, and ensure projections are refreshed when the state changes. Stage 5 hand-off metadata remains the single home for approvals—there are no additional per-lane approval prompts.

Command parsing is now metadata-driven: descriptor files capture positionals, flags, aliases, and help text for every subcommand. The shared parser merges repeated flags (including comma-separated lists), emits consistent usage errors, and powers per-command `--help`/`-h` output generated from the metadata.

#### Metadata & Parser Architecture

- **Descriptors:** `dev/architecture/cli-command-registry.mjs` defines each command’s usage, summary, positionals, and flag metadata. Adding a new CLI surface area now means adding a descriptor entry plus handler logic—no repetitive parsing boilerplate.
- **Shared parser:** `dev/architecture/cli-shared-parser.mjs` normalises input (aliases, repeated flags, CSV values), applies inline coercions, and throws usage errors that embed the generated help block (required args/flags, examples, etc.).
- **Handler contract:** `cli-command-stub.mjs` receives `{ positionals, options, helpRequested }` from `parseCommandInvocation`, keeping business logic small and consistent. Help requests short-circuit before handler execution.
- **Generated help:** `--help`/`-h` renders the descriptor-driven usage text for every command; `help <command>` prints the same metadata so documentation and runtime behaviour stay aligned.
- **Regression coverage:** `tests/scripts/cli-shared-parser.test.ts` calls a lightweight Node probe (`tests/scripts/helpers/cli-parser-probe.mjs`) to assert plan-file merging, acknowledgement sequencing, and alias resolution. Extend this suite whenever descriptors or parsing rules evolve.

### Planned File Tracking

- Every stage gate and lane now supports `plannedFiles`, captured via `claim`, `update-stage`, `update-lane`, and `create-lane`.
- Agents can repeat `--plan-files` (or provide comma-separated lists) in any order; the CLI normalises duplicates before validation and conflict checks.
- Auto-assignment skips scopes whose planned files overlap with other `in_progress` scopes; manual claims emit a warning instead of failing.
- Guides, status views, generated plans, and activity exports surface the planned file list so collaborators can reason about potential collisions.
- The same commands accept `--search-terms` and `--clear-search-terms`, keeping the cleanup guard aligned with the lane/stage scope without editing auxiliary JSON.

### Time-to-Completion Telemetry

- Claiming a stage or lane records `startedAt`; moving an `in_progress` scope to any other status logs the elapsed wall-clock time.
- `update-stage`/`update-lane` output the elapsed duration when work leaves `in_progress` and persist `elapsedMs` for schedule parity. They also accept `--add-dependency` / `--remove-dependency` / `--clear-dependencies` so external blockers stay encoded in the registry and downstream waves remain accurate. Omitting `--status` keeps the current state but another mutation flag (plan files, dependencies, search terms, notes, summary, evidence, agent, etc.) is required to avoid a no-op.
- Activity entries inherit `durationMs`, and generated Markdown renders the duration inline for both stages and lanes.

### Regeneration & Artefact Refresh

- After each write, the CLI tracks which patterns, scopes, and cohorts were touched (including dependency-driven status flips) and silently regenerates only the affected plan previews, cohort schedules, and the activity log—no background console noise.
- Dependent artefacts are pulled in automatically: if a scope completes and other stages/lanes list it as a blocker, those downstream patterns and their cohorts are queued for regeneration.
- Manual `regen` runs accept selective flags—`--pattern`, `--cohort`, `--no-global`, `--force-all`, and `--check`—so agents can preview or refresh exactly the documents they care about; `--silent` quietly suppresses the summary output when chaining CLI commands.
- Generated schedules now match the cohort example layout: status glyphs in the `St` column, HH:MM durations, filtered dependency lists (only cross-pattern or non-default blockers), a `Focus` column sourced from lane scopes or stage summaries, and a notes section that mirrors the latest pattern annotations.

### Cohort Coordination

- `cohort --all` exposes the live lettered ids, while `cohort --id <id> --list` mirrors the Stage 5A bundle (patterns, timestamps, notes, planned files) before you change anything. `cohort --create` spins up the next alphabetical cohort automatically, and `--add-pattern`/`--remove-pattern` edits keep every pattern assigned to at most one cohort.
- `cohort-stage` owns alignment status. Add `--show` for read-only previews; when mutating, the CLI now refuses Stage 5A completion unless an alignment spec is recorded via `--plan-files`, preventing empty or fragmentary cohorts from closing the gate.
- When Stage 5A flips to `complete`, the CLI automatically seeds each cohort member’s Stage 5 gate with the recorded spec so Stage 5B guidance references the shared plan. If every pattern already tracks the file, the CLI confirms instead of duplicating entries.
- After Stage 5A completes, Stage 6 lanes remain `pending` so auto-assignment can spread the work; only add `blocked` statuses and `--add-dependency` links when a concrete blocker appears during execution.
- Stage 5 claims still enforce Stage 4 readiness plus the shared Stage 5A completion. If the guard fails, the precise blockers are surfaced and the stage remains `blocked`/`pending`.
- While a cohort is aligning, `guide --stage 5` hides the Stage 5B checklist and instead points you to `cohort --id <cohortId> --list` and `cohort-stage <cohortId> --segment 5a --show` so you can inspect readiness without mutating state; the full Stage 5B flow reappears automatically once alignment closes.
- Each cohort edit appends a Stage 5 activity entry and triggers markdown regeneration so downstream teammates inherit the latest roster and evidence without re-running commands manually.

### Schedule Automation

- `runRegen` regenerates global and per-cohort schedules (Markdown only, with JSON available on-demand) alongside plan previews, the tracker, and the activity log. Files land under `Templum/dev/architecture/schedules/` only when content changes, keeping diffs clean.
- `schedule --cohort <id>` (and `node dev/architecture/consolidation-scripts/generate-schedule.mjs --cohort <id>`) focus the wave planner on a cohort while preserving cross-pattern prerequisites (including the synthetic `cohort:<id>|cohort-5a` task).
- Planned-file conflicts are normalized (trimmed, case-insensitive). Scopes with no declared plan files are treated as collision-free so they join the earliest wave that satisfies their dependencies (e.g., pending Stage 7 gates without plan files land in the current wave instead of slipping to a trailing "cleanup" wave).
- Wave packing ignores plan-file collisions from scopes already in a terminal status (`complete`, `ready`, `ready_for_handoff`, `cancelled`, `deferred`); only active scopes (`pending`, `in_progress`, `blocked`, etc.) reserve keys, preventing historical overlaps from pushing fresh work into later waves.
- The generator produces the fewest waves possible by packing any dependency-ready tasks (even across different stages) into the same wave while still staggering overlapping planned files. Stage 6 lanes that collide across cohort members remain `[?] blocked` until the shared files clear, and lanes such as `4:6l`, `4:6i`, and `4:6j` now surface that blocked state explicitly instead of appearing runnable. Lanes that still list placeholder plan files (e.g., a literal `"0"`) are auto-blocked until owners supply a real file list, preventing the scheduler from assuming the lane is safe to run.
- Scopes that share plan files across different patterns now select a primary owner (the earliest ready scope in the wave); trailing peers are auto-blocked so the suite or artefact runs once at a time, while the original owner stays in the front wave as `[ ]` pending.
- Same-pattern collisions still block peers unless the blocked lane explicitly depends on the other entry; dependency-linked pairs now keep the upstream scope runnable while the overlap stays documented in schedules/notes, preventing mutual-dependency deadlocks (e.g., `4:6l` feeding `4:6m`).
- Stage dependencies honour completed registry state: once upstream gates are marked `complete`/`ready`, the scheduler treats those dependencies as satisfied and schedules the downstream scope immediately, even if the predecessor is no longer listed in the current wave output.
- Waves are split so runnable/owned scopes stay in the lead wave; any `[?]` slots created by plan-file collisions slide to a trailing wave, keeping the queue short while making the contention explicit.
- Stage 4 and Stage 6 gates no longer surface as standalone rows—their lanes are the tracked work, Stage 5A acts as the Stage 4 close-out for the cohort, and Stage 7 captures the Stage 6 completion.
- Generated schedules annotate cohorts, planned files, elapsed timing, and dependency chains for every scope; all tasks appear in a wave (no unscheduled table), Stage 5A always renders as a cohort-only wave, and later waves combine higher stages when dependencies allow parallel execution.

### Schedule Generator

- `npm run consolidate -- schedule` (or `node dev/architecture/consolidation-scripts/generate-schedule.mjs`) defaults to markdown output and saves it under `dev/architecture/schedules/schedule-<patterns>.md`; pass `--no-save` to emit to stdout only. Cohort-specific runs now emit `<cohortId>.{md,json}` (no `schedule-` prefix) to match the consolidated artefact roster.
- Override the default target with `--output path` (relative paths resolve from the repo root), switch to JSON rendering via `--format json`, or keep everything ephemeral with `--no-save`.
- Markdown output is formatted with Prettier using the same config as generated pattern plans before writing to disk.
- Schedule waves honor declared dependencies, isolate Stage 5A as its own wave, and otherwise pack any ready tasks (lanes, pattern stages, or cohort segments) so long as their planned files do not collide; higher stage numbers may share a wave when safe.
- Explicit `--patterns` or `--cohort` selections stay authoritative even when the resulting pattern list is empty; the generator no longer falls back to the global roster, preventing unrelated cohorts or test patterns from appearing in filtered schedules.

### Guide Output & Gating Mechanics

- `guide --stage <id>` renders the requested gate alongside the live pointer. Locked stages print the upstream summary (latest Stage N – 1 note plus exit metadata) before showing reminders and actions.
- Stage 5 is now split into two explicit guidance paths:
- `guide --stage 5` (and `--next` once Stage 5A is complete) shows the cohort prerequisite banner, Stage 5B reminders, and, when unlocked, the Stage 6 gating battery checklist plus hand-off summary.
- `guide --stage 5a` (as well as `--next` while Stage 5A remains pending) renders the full cohort alignment bundle inline—cohort roster, status glyphs, Stage 4 evidence per pattern (lanes, commands, notes, planned files), and the exact `cohort --id <cohortId> --list` / `cohort-stage <cohortId> --segment 5a …` commands to execute.
- Agents can append colon-delimited shorthands to the pattern argument—e.g., `npm run consolidate -- guide 4:lane-6p:recent` or `guide 210:stage-5a:lanes`—to focus a lane, stage, or toggle `--recent`/`--lanes`/`--next`; the parser normalises these segments, merges them with explicit flags, and rejects conflicts so targeted views never fall back to the auto `--next` flow.
- Cohort rows collapse supporting artefacts so alignment agents no longer need to open generated plans; everything necessary to run Stage 5A is streamed directly into the guide output.
- `guide --lane <id>` prints the same expanded lane card that `--next` would auto-select, keeping the shorthand and explicit forms in sync.
- Plan-file conflicts and unsatisfied dependencies cause `--next` to skip a scope automatically. Manual guide views call out the conflicts so agents can coordinate before claiming, and the auto-blocker now also inspects Stage 6 cohort peers—any lane with overlapping planned files stays `[?] blocked` until the earlier cohort member closes.
- The glyph legend now includes the `ready` state (`[>]`) alongside `[ ]`, `[~]`, `[?]`, `[x]`, matching the registry metadata and schedule output.
- `--recent` appends the last three activity entries for the focused stage or lane, providing context without opening the Markdown artefacts.

Agents always start with `guide`: it surfaces readiness, blockers, and guardrails for the target stage or lane. Once the guidance confirms availability, invoke `claim` to move the chosen scope into `in_progress`; the Stage actions block now prints the exact command (with the concrete pattern id and lane id when applicable) instead of asking agents to re-run `guide`. The CLI still issues deterministic agent ids (pattern + stage/lane) when claiming so the registry records a single active owner; a future enhancement will swap this for non-repeating codenames.

After a stage is set to `complete` or a lane is marked `complete`, the CLI suggests the next assignable stage or lane—complete with the `guide`/`claim` commands to run next—so agents do not bypass the guardrail flow when dependencies unlock new work. If coordination asks you to pause instead of claiming, the CLI reminder also nudges you to commit touched files before exiting. Stage claims and lane creation now emit explicit auto-blocking reminders so agents know downstream scopes will remain blocked until prerequisites finish; no manual status flip is required to unlock the next wave.

`guide` defaults to the first auto-assignable lane. When earlier stages (especially Stage 1) are still open, the CLI surfaces the seeded orientation block (pattern summary, problem/API snapshot, starter files) **and** an actionable checklist (Stage actions) so agents can proceed without hopping to `status`. Use `--next`/`-n` to highlight the first actionable stage starting from the current pointer (including that pointer stage when it still needs work); when the next task is a lane, `--next` now renders the same lane detail that `--lane <id>` would show. Use `--stage` to focus elsewhere, `--lane` for a detailed view, `--lanes` to list every lane in the chosen stage, and `--recent` to include the latest activity entries. If a stage or lane has no assignable work (e.g., every lane is blocked), the guide explicitly says so and nudges the agent to coordinate before attempting another claim. Stage notes recorded with `stage-note` appear automatically in the guide; run `status` only when you need the full structured snapshot. Stage 1 scaffolding is sourced from the registry via `scripts/seed-registry-from-candidates.mjs`, removing the need to keep `safe-consolidation-candidates.md` open during onboarding. For Stage 5 and 6, the guide also prints the handoff guardrails/shared files/acknowledgements so lane owners see the contract inline. Every stage view now includes the immediately preceding stage’s exit summary and latest stage note (if present) so follow-on owners inherit the synthesized context; Stage 6 lane views reuse the Stage 5 handoff block automatically when it appears upstream.

### Stage 5A Cohort Alignment Workflow

When Stage 5 is blocked, the CLI expects the alignment squad to run the following loop:

1. `npm run consolidate -- cohort --all` (if you need the id), then `cohort --id <cohortId> --list` to confirm membership, Stage 5A status, and the existing alignment artefacts before changing anything.
2. Review the Stage 5A bundle in `guide --stage 5a` to ingest Stage 4 evidence (lanes, commands, notes) for every cohort pattern before touching code.
3. Start the shared session with `cohort-stage <cohortId> --segment 5a --status in_progress --notes "<alignment summary>" [--plan-files …]`. The CLI immediately records `startedAt`, planned files, and any conflicts.
4. Capture per-pattern mitigations (e.g., reopening Stage 4 lanes) using `update-lane` / `update-stage` and log coordination context with `append-activity`.
5. Once evidence and documentation are archived, flip the cohort segment via `cohort-stage <cohortId> --segment 5a --status complete --plan-files alignment/spec.md --notes "<outcome>"`. The CLI enforces the plan-file requirement and seeds every cohort member’s Stage 5 gate with the shared spec before re-evaluating readiness.
6. Re-run `guide --stage 5` to unlock Stage 5B actions and surface the Stage 6 gating battery.

*Stage 5A owners should also sanity-check each cohort lane's `plannedFiles` and newly recorded `searchTerms` so Stage 6 guards reflect the agreed migration surface.*

### Stage 3 Orchestration Checklist (2025-11-07 Refresh)

- Run the migration search (`rg --files-with-matches` or equivalent) for every documented term. Bucket the results into **guardrail surfaces** (tests, fixtures, harness utilities) and **runtime surfaces** (production code, adapters, configs). Stage 4 lanes own the guardrail assets; Stage 6 lanes own the runtime migrations.
- For each guardrail lane, create the paired Stage 6 lane in the registry and capture the one-to-one mapping (lane id, scope, dependencies) in the Stage 3 note so owners immediately see which runtime slice each guardrail protects.
- Stage 4 lane plan-files should reference the guardrail assets (e.g., `src/tests/**`, harness helpers), while the paired Stage 6 lane records only the runtime files those guards will exercise. Keep plan-files/search terms disjoint across the two stages.
- Apply the full search-term set to both lane types and the Stage 7 gate so sweeps cover the entire contract; propagate updates via `update-lane --search-terms` and `update-stage 7 --search-terms`.
- Add the project root itself (`Templum/` for this migration) to the Stage 7 gate’s plan-files so the final sweep enforces repo-wide cleanliness before release.
- Capture sequencing, dependencies, expected failure signatures, and reminder text in the Stage 3 note so downstream owners inherit the migration choreography and can spot plan-file overlaps early.

*Reminder: each pattern belongs to exactly one cohort—remove it with `cohort --id <currentId> --remove-pattern <patternId>` before assigning it elsewhere.*

### Stage 5B execution guidance

- Stage 6 lanes remain `pending` until Stage 5B proves the Stage 4 guardrails behave as expected: run the new guardrail assets against the unmigrated baseline, capture the failing signature, and attach the timeout log to the Stage 5 note or activity entry.
- Document the migration recipe for each Stage 6 lane (expected edits, DI seams to respect, guardrail commands to re-run, plan-file owners) inside the Stage 5 note and in the hand-off so execution agents inherit a deterministic checklist.
- Record cross-pattern or cross-lane dependencies uncovered while rehearsing the guardrails using `update-lane --add-dependency` or Stage 5 gate dependencies; keep blockers visible until Stage 6 owners confirm the guardrail now passes.
- Close Stage 5B only after every Stage 6 lane has: a paired guardrail reference, failing evidence logged, migration instructions captured, and any approvals/coordination items acknowledged by the cohort.

### Cleanup guard enforcement

- Stages and lanes now store `searchTerms` alongside their `plannedFiles`. When both are present the CLI expands every planned entry (directories recurse; `.md` files are ignored) and performs fixed-string searches for each term.
- `update-stage` / `update-lane` print `No instances of […terms…] found in […planned files…]` when the sweep passes. If matches remain, the update is rejected with a per-file/per-term count unless `--force` is supplied; the failure summary reminds agents to migrate or document leftovers.
- `--force` applies the update while still printing the outstanding matches so owners can add a stage note that justifies any intentional residuals.
- `npm run consolidate -- sweep <patternId> --stage <id>|--lane <laneId>` reuses the same search plan, honouring recorded `searchTerms` and refusing to fall back to repo-wide scans. It reports missing configuration (no terms or no planned files) instead of guessing paths.
- Stage 6 lane closures and Stage 7 completion invoke the guard automatically, preventing those scopes from flipping to `complete` until their planned files are clean; earlier stages may record plan-files without triggering the guard so orchestration can continue.
- Planned-file expansion now drops anything ignored by `.gitignore`, ensures paths resolve from the detected repo root (walking up from the CLI location, or honoring `CONSOLIDATION_REPO_ROOT` and the `root` override in `consolidation-cli.config.json`), and automatically skips files in the consolidation CLI directory so relocations don’t require config churn.
- When planned files resolve only to `.gitignore` exclusions or the skipped consolidation directory, the sweep prints that outcome (with sample paths) instead of claiming “nothing to sweep,” prompting agents to fix the registry before rerunning the guard.
- Stage 4 lanes, Stage 5A cohort updates, Stage 5B lane prep, and every Stage 6 lane owner must keep both `plannedFiles` and `searchTerms` accurate so the guard reflects real ownership of the migration surface.

```mermaid
sequenceDiagram
    participant Agent
    participant CLI
    participant Registry
    participant Cohort as Cohort entry
    participant Patterns as Cohort patterns

    Agent->>CLI: guide --stage 5a
    CLI->>Registry: fetch cohort + pattern data
    Registry-->>CLI: Stage 5A bundle (status, notes, lanes, commands)
    CLI-->>Agent: Render Stage 5A guidance
    Agent->>CLI: cohort-stage cohort34 --segment 5a --status in_progress
    CLI->>Registry: update cohort stages[5a]
    Registry-->>CLI: validation ok
    CLI-->>Agent: Alignment in_progress + conflict warnings
    Agent->>CLI: cohort-stage cohort34 --segment 5a --status complete --notes "Alignment shipped"
    CLI->>Registry: mark Stage 5A complete, recompute Stage 5 ready status
    Registry-->>CLI: Stage 5 gate becomes ready
    CLI-->>Agent: Stage 5 unlocked: rerun guide (stage 5) for Stage 5B actions
```

### Stage 1 expectations

- Start with `guide`/`claim`, then build the consumer inventory using repeatable `rg` (or equivalent) commands that can be pasted into activity logs.
- Bucket findings into priority cohorts (interfaces/adapters, orchestrators/session utilities, observability/telemetry, tests, long tail) and call out ownership/risks inline with counts.
- Capture a Stage 1 note (`stage-note … 1`) summarising commands, clusters, and guardrails so Stage 2 inherits repeatable evidence.
- Close Stage 1 only after recording an exit summary (`update-stage … --status complete`) that highlights priorities, blockers, and required docs/progress updates before Stage 2 opens.

### Stage 2 expectations

- Document the regression plan plus timeout wrapper preset (`--preset jest-suite` for targeted files, `--preset jest-ci` for `npm run test:ci`) so completion markers stay deterministic.
- Execute every suite via `node scripts/run-with-timeout.mjs --preset <preset> -- …`; attach logs with `update-stage … --files` to keep artefacts auditable.
- Reopen Stage 2 if later stages expose coverage gaps—extend the suite, re-run with the wrapper, and record the new evidence before progressing.

### Stage 3 expectations

- Map the migration search results into paired Stage 4 (guardrail) and Stage 6 (runtime) lanes; Stage 4 plan-files reference the guard assets, Stage 6 plan-files cover runtime surfaces.
- Record the guardrail/runtime pairing, sequencing, and expected failure signatures in the Stage 3 note so downstream owners inherit the choreography.
- Apply the combined search-term set to both lane types and the Stage 7 gate (add the project root, e.g., `Templum/`) so sweeps enforce the full contract.
- When new scope appears reopen Stage 3
  - Stage 3 then adds new guardrail/runtime lane pairs and update dependencies before handing off.
- The CLI automatically reopens and blocks only downstream gates (Stage 5 onward), resets every linked cohort Stage 5A segment (dropping it to `blocked` until Stage 4 readiness is restored), and mirrors the Stage 5/6 reopen across cohort peers whenever Stage 3 leaves `complete`/`ready`. Stage 4/6 lanes remain untouched by the cascade and stay closed; replacement lanes are created explicitly when Stage 3 restages the work.

### Stage 4 expectations

- Author or refresh guardrail suites, fixtures, and helpers that fail until the migration lands; outline the paired Stage 6 lane and expected failure in a Stage 4 note.
- Run the guardrail through `node scripts/run-with-timeout.mjs --preset <preset> -- …`, capture the failing log via `update-lane … --status in_progress --files`, and block/reopen coverage work if the guard passes unexpectedly.
- Close the lane only after the failing signature is stable and the paired Stage 6 lane has been updated with the guardrail reference.

### Stage 5 expectations

- Stage 5A keeps cohorts aligned: log the shared spec via `cohort-stage … --plan-files`, ensure every Stage 4 guardrail is in place, and attach blockers/dependencies in-band.
- Stage 5B rehearses the guardrails: replay the timeout-wrapped suites against the unmigrated baseline, capture failing evidence in Stage 5 notes, and document the migration checklist plus approvals in the hand-off.
- Update each Stage 6 lane with its guardrail link, dependencies, and migration steps before marking Stage 5 complete.
- If Stage 5 slips back to `pending`/`blocked`, the owning pattern auto-blocks Stage 6/Stage 7 and resets its cohort’s Stage 5A segment. Cohort peers only reopen when an upstream stage (1–4) triggers the cascade—Stage 5 self-reopens no longer undo completed peer gates. Keep the hand-off doc and `update-handoff` metadata in sync while the upstream work is restored.

### Stage 6 expectations

- Claim a lane, reproduce the Stage 4 guardrail failure with the wrapper, and log the baseline via `update-lane … --status in_progress --files`.
- Apply the migration, rerun the guardrail (and any additional batteries) until it passes, log the passing artefact, and run the sweep to ensure no forbidden `console.*` usage remains.
- If the guardrail still fails or scope expands, block the lane, attach dependencies to the remediation stage, and capture details with `append-activity` before resuming.

### Stage 7 expectations

- Execute the Stage 7 validation battery with `node scripts/run-with-timeout.mjs --preset <preset> -- …`, recording artefacts via `update-stage … --files`.
- Document the reason for the validation, required reruns, and confirmation that promised documentation/progress trackers were updated (automation pending) in a Stage 7 note.
- Run the Stage 7 sweep, confirm the repo is clean, and only then mark the stage complete. Reopen Stage 7 if regressions surface later.
- If any upstream stage (especially Stage 3/5/6) is reopened, the CLI will automatically drop Stage 7 back to `pending` across every affected cohort pattern and block it until prerequisites return to `complete`; treat the printed cascade list as a TODO checklist.
- Stage 7 planned files intentionally skip the plan-file collision guard while Stage 7 is underway so release sweeps that touch the repo root never auto-block Stage 6 lanes or their cohort peers. Stage-level dependencies still control the hand-off ordering.

### Guide rendering flow

- `printGuide` sources stage status, timestamps, elapsed timings, and `plannedFiles` directly from `pattern.stageGates[stageId]`.
- Stage-scoped notes (`pattern.notes` entries with `scope: ["stage-<id>"]`) are collated through `filterNotes` and now surfaced twice: inside the focused stage’s “Notes” block and via the upstream-summary helper that injects the previous stage’s latest entry.
- Lane guidance uses the same helpers (`collectAllNotesForLane`, `printLaneDetail`) plus `laneIdToStage` to map lane notes back into stage context.
- When `--stage` is omitted, the guide infers the pointer stage (highest incomplete stage) and, if that stage is `in_progress`, automatically focuses it; `--next` skips completed gates from the pointer forward.
- For Stage 5/6 views the guide also renders `pattern.handoff` through `printHandoffSummary`, so handoff guardrails/shared files/acks stay inline with lane instructions.

### Stage handoff data map

| Stage | What it records | Where it lives | Who consumes it |
| ----- | --------------- | -------------- | ---------------- |
| 1     | Inventory commands, cluster buckets, guardrails, exit summary | `stage-note … 1`, `update-stage … --notes` | Stage 2 guide’s upstream summary (auto-printed) |
| 2     | Test batteries, guardrails, coverage gaps, exit summary | `stage-note … 2`, Stage 2 gate notes | Stage 3 guide’s upstream summary; Stage 6 lanes via dependencies |
| 3     | Lane sequencing, dependencies, owner roster | `stage-note … 3`, Stage 3 gate notes | Stage 4 guide (upstream summary) and Stage 5 gating (lane creation) |
| 4     | Prereq evidence per lane | Lane notes (`scope: ["4a"]`, etc.), Stage 4 gate notes | Stage 5 guide upstream summary and Stage 5A cohort readiness checks |
| 5     | Cohort guardrails + Stage 5B approvals | `pattern.handoff` via `update-handoff`, Stage 5 gate notes | Stage 6 guide (auto prints upstream summary + handoff) |
| 6     | Lane execution evidence | Lane notes (`scope: ["6a"]`), `append-activity` | Stage 7 validation planning, reopened Stage 5 prerequisites |

Each stage’s exit summary should call out required doc/task syncs so the printed upstream summary gives Stage N+1 owners their starting checklist. When extra notes exist, the guide tells agents how many remain, and they can drill further via `guide --stage <id> --recent` or the generated plan without touching implementation internals.

### Lane Status Glyphs

| Status        | Glyph | Auto-Assignable? | Usage                                                                                        |
| ------------- | ----- | ---------------- | -------------------------------------------------------------------------------------------- |
| `pending`     | `[ ]` | Yes              | Dependency cleared; scope is the next candidate once the coordinator confirms availability.  |
| `in_progress` | `[~]` | No               | Claimed and actively underway.                                                               |
| `blocked`     | `[?]` | No               | Blocked by upstream work; CLI captures blocker notes and propagates dependencies downstream. |
| `ready`       | `[>]` | No               | Shared prerequisite satisfied (e.g., cohort Stage 5A). Signals downstream gates to re-check. |
| `complete`    | `[x]` | No               | Fully complete; no further action required.                                                  |

Stage gates mirror these signals with `[ ] pending`, `[?] blocked`, `[~] in-progress`, `[>] ready`, and `[x] complete`.

`status` highlights lanes that remain assignable and expands blocker/testing notes inline so agents can see impediments without opening the generated Markdown.

## Update Flow (Lane Example)

- Use `npm run consolidate -- update-lane <patternId> <laneId>` when you are ready to move the lane forward or capture a blocker. Provide `--status` for state changes or pair metadata updates (planned files, evidence via `--files`/`--summary`/`--note`, dependency links via `--add-dependency` / `--remove-dependency` / `--clear-dependencies`, search terms, agent attribution) to record progress without altering the state.
- Use `npm run consolidate -- remove-lane <patternId> <laneId>` to retire Stage 4/6 lanes once experiments or temporary sweeps conclude; the command refuses to remove in-progress lanes or active dependants unless `--force` is supplied, optionally drops lane-scoped notes, and recalculates stage readiness after pruning dependencies.
- After applying the update, the CLI recomputes elapsed timing, writes an activity entry, and (if the status changed) prints default suggestions for blocking or queueing downstream lanes. You can accept the defaults or bypass the prompt with `--no-prompt`.
- When a lane is blocked, include a short reason in `--note` and log detailed remediation steps with `append-activity` so the next owner knows exactly which suites/logs to revisit.
- Lane statuses now auto-block on two fronts: within the pattern (earlier Stage 4/6 lanes sharing planned files) and across the active cohort (earlier Stage 6 cohort peers with overlapping planned files). Downstream owners no longer need to add manual dependencies just to honor wave sequencing—unblock by completing or re-blocking the upstream lane instead.
- Lane auto-unblocking now runs strictly in stage order: when a lane closes, only dependants from later stages are lifted back to `pending`; same-stage companions stay frozen so historical Stage 4/6 work is never silently reopened.
- Command executions are not auto-detected; agents must run the listed commands themselves and supply log paths/notes in the update.
- Dependency changes are echoed to the terminal (added/removed references and the new dependency list) so agents can confirm the registry mirrors reality.

### Stage Gate Updates

- Use `npm run consolidate -- update-stage <patternId> <stageId> [--status <value>]` to advance or reopen a stage gate; include `--add-dependency` / `--remove-dependency` / `--clear-dependencies` when external blockers must be recorded. The CLI updates timestamps/notes, logs dependency changes, and adds an activity entry automatically; when `--status` is omitted the gate status is preserved while the supplied metadata changes are applied.
- Reopening a stage now cascades automatically: only later gates (strictly after the reopened stage) that were previously `complete`/`ready` are reset to `pending` (and auto-blocked) so the schedule reflects the open prerequisite. Linked cohort Stage 5A segments are also reset—defaulting to `blocked` until Stage 4 readiness is restored—and, when the reopen originates from an upstream stage (1–4), cohort peers with an auto-reopened Stage 5 will have their Stage 6/7 gates reset as well. Stage 5 self-reopens no longer touch peer patterns. Stage 4 and Stage 6 lanes are **not** reopened—Stage 3 recreation still generates the replacement lanes when needed, and same-stage lanes stay sealed once complete.
- When the cascade runs, the CLI prints the list of reopened stages so coordinators can spot the implied TODOs without scanning the registry manually. Downstream agents wait for the upstream stage to return to `complete`; no manual re-block toggles are required.
- Cohort peer cascades are summarised as `Pattern <id> (Stage 5B, Stage 6, …)` so the coordinator can nudge the right owners before resuming work.
- Log discovery or coordination details for a stage with `npm run consolidate -- stage-note <patternId> <stageId> --body "..."` so the guidance surface stays current.
- Maintain Stage 5 hand-off guardrails/shared files/acknowledgements with `npm run consolidate -- update-handoff <patternId> [options]` (add/remove entries with `--add-*`, `--remove-*`, or `--remove-ack-agent <name>`; inspect without changes using `--list`) so downstream agents see the contract without opening other docs.

### Claim Guardrails

- `claim` refuses to move a stage into `in_progress` unless its current status is `pending`. Stages already `in_progress`, `blocked`, or closed must be coordinated manually before another agent can pick them up.
- Lane claims require an explicit lane id; the CLI checks that dependencies are satisfied and that the status is assignable (`pending`). Attempts to skip the guardrails are rejected so parallel agents cannot collide.
- Claiming a stage optionally records a note (scoped to that stage), while lane claims can append lane notes just like before.
- Deterministic agent ids are derived from the pattern and scope (e.g., `24-stage3`, `24-6a`) so coordination logs stay clear even without manually supplying `--agent`.
- When a lane is flipped from `in_progress` to `blocked`, the CLI appends a reminder to log blockers with `append-activity`, attach the dependency to the follow-up scope (creating a new lane when necessary), and to rerun `guide` before reclaiming the work.

## Safety Nets

- All writes are validated against the registry schema via Ajv; validation errors abort the operation with a detailed pointer so agents can correct the input.
- After every successful write the CLI quietly regenerates only the plans, schedules, and activity log entries whose patterns or cohorts changed (plus their dependants), keeping artefacts current without spamming the terminal.
- Dependency-aware status propagation keeps downstream lanes/stages blocked when prerequisites fail and reopens them once dependencies complete, reducing the chance of progressing while an upstream fix is still pending.

### Auto-blocking validation roadmap

- Unit-focused coverage now imports the CLI helpers directly. `reopenDownstreamStageGates` is exported from the driver and guarded so the CLI entrypoint (`main()`) only executes when invoked from the shell, letting the Jest suite exercise cascade logic without spawning the CLI. The baseline regression asserts that reopening Stage 3 only reopens later gates (Stage 5 onward) and clears their timing metadata while leaving Stage 4/6 lanes untouched; extend the suite alongside future cascade fixes.
- `promoteDependentLanes` is exported alongside the cascade helper so tests can verify that auto-unblocking only promotes dependants from later stages. Same-stage lanes remain blocked until coordinators explicitly requeue them, preserving “done means done” for Stage 4/6 work.
- CLI integration checks will run the driver against a temporary registry via `CONSOLIDATION_STATE_PATH`, mirroring the manual smoke tests (e.g., `update-stage`, `cohort-stage`, `claim`) to confirm Stage 5 peer completions persist while Stage 3 reopenings still cascade across the cohort.
- `dev/architecture/consolidation-scripts/tests/auto-blocking-cascade.test.ts` tracks both the unit coverage and upcoming CLI flows. To run the current guard without coverage noise, use:<br>`NODE_OPTIONS=--experimental-vm-modules npx jest --config jest.config.js --roots dev/architecture/consolidation-scripts/tests --runTestsByPath dev/architecture/consolidation-scripts/tests/auto-blocking-cascade.test.ts --no-coverage`
- Prefer removing the `--experimental-vm-modules` requirement by teaching Jest to load `.mjs` natively (e.g., set `extensionsToTreatAsEsm` to include `.mjs` and add a transform for `^.+\\.mjs$` in `jest.config.js`). Once Jest understands the ESM surfaces, the command above no longer needs the `NODE_OPTIONS` prefix.

## Implementation Outline

- CLI remains plain Node.js (ESM) with the descriptor registry + shared parser handling all argument coercion; no external CLI framework is required.
- `modules/registry-runtime.mjs` encapsulates Ajv setup, registry loading/saving, cohort canonicalisation, pending regen tracking, and scope-change bookkeeping. `cli-command-stub.mjs` delegates to these helpers for `loadRegistry`/`saveRegistry` and no longer owns inline validator state.
- Cross-cutting helpers (environment resolution, time formatting, plan-file/search-term normalisation, cleanup guard execution, markdown formatting) live under `modules/` and are imported wherever needed, keeping the driver lean and the helper logic reusable.
- After each successful write the driver still calls `runRegen`, now using the regen request assembled by the runtime module so pending scope updates are handled in one place.
- Regression tests for the parser live in `tests/scripts/cli-shared-parser.test.ts` (run via `npm run test -- --runTestsByPath tests/scripts/cli-shared-parser.test.ts`) and should be updated whenever descriptors or shared rules change.
- The driver exports `reopenDownstreamStageGates` and `reopenCohortPeerStages` for direct consumption in unit tests, and wraps the `main()` invocation in an entrypoint guard so importing the module never triggers CLI execution.
- Environment flags:
  - `CONSOLIDATION_STATE_PATH` can override the default registry location during tests or experiments.

## Open Questions

None currently. Revisit as additional cohorts surface new workflow needs.

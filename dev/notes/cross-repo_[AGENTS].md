# AGENTS.md

## Command Tool

- Default to bash commands via `["bash","-lc", …]`; switch shells only when explicitly required (invoke PowerShell with `["powershell.exe","-NoProfile", …]`).

## Placeholders

- Never add mocks or placeholders unless the user explicitly requests them.

## DRY

- Remove duplicated logic by extracting reusable functions, components, or higher-order helpers, and regression-test shared code before reuse.

## Test-Driven Development (TDD)

- Prefer TDD for new features and infrastructure; relax it for small tweaks, lightweight harnesses, or code already covered by quick commands when speed matters.
- Write tests before code: lean on unit tests for isolated behavior, integration tests for module interactions, ≥80% coverage, and mocks/stubs to control dependencies.
- When you find untested areas: (1) finish the assigned task, (2) flag missing tests and affected components in your summary, (3) wait for user direction on writing them, (4) if told to “present test plan,” draft the plan for the user to complete, then, when building the tests, inspect implementation details as needed, fold any new insights back into the plan, and call out those additions in your summary.

## SOLID Design Principles

### Single Responsibility Principle

- Keep files under 500 lines (treat ~400 as a prompt to split; never let 1000 linger); group small files logically and limit each class to one reason to change within a single abstraction.
- Keep functions under ~30–40 lines and reassess classes once they pass ~100–150 lines; use the thresholds as cues to evaluate structure, separate cross-cutting concerns from core logic, and dedicate classes to data access, business rules, or UI as needed.
- Use descriptive, single-purpose method names; if the description needs “and/or,” refactor; prefer composition over inheritance when combining behaviors.

### Open/Closed Principle

- Design modules for extension, not modification; rely on abstracts/interfaces, configuration, dependency injection, clear extension hooks, and strategy-style polymorphism while avoiding type-check chains. Be pragmatic in this regard so as to not overly layer abstractions when unnecessary.

### Liskov Substitution Principle

- Ensure subclasses honor base invariants, declared exceptions, and pre/postconditions; avoid no-op or exception-only overrides, type checks, and downcasts; choose composition when full substitution is impossible.

### Interface Segregation Principle

- Provide focused, cohesive interfaces, splitting bloated contracts so consumers depend only on the methods they need, and expose granular APIs per client.

### Dependency Inversion Principle

- Depend on abstractions and inject dependencies where it keeps modules decoupled; use factories, containers, or simple wiring based on scale, review inheritance for LSP compliance, refactor toward SOLID regularly, lean on patterns like Strategy/Decorator/Factory/Observer, keep names intention-revealing (avoid `data`/`info`/`helper`/`temp`), code for future scaling, and bake in extension points from day one while favoring composition within sound OO design.

### Warning Signs

- Watch for god classes, behavior-changing boolean flags, deep inheritance, dependency knowledge leaks, circular references, unrelated coupling, rapidly expanding classes, and parameter-heavy methods.

## Modular Design

- Keep modules interchangeable, testable, and isolated; if something cannot be reused across screens or projects, refactor and reduce coupling with dependency injection or protocols.

## Manager and Coordinator Patterns

- Separate responsibilities: ViewModel handles UI logic, Manager handles business rules, Coordinator manages navigation/flow; never mix view code with business logic.

## Project Settings and Data

- Always check for existing CLI interactions (e.g., `npx sanity --help`) before writing custom scripts.

## TypeScript

### Content Modelling

- When working on Sanity schemas, model domain concepts rather than presentation; describe attributes like `status`, not `color`, unless explicitly modelling views.

### Basic Schema Types

- In Sanity schema files, always use `defineType`, `defineField`, and `defineArrayMember`; place schema types in dedicated files exporting a named `const` that matches the filename.
- Use only `name` unless a different `title` is required; for `string` fields with fewer than five `options.list` items set `options.layout: "radio"` and ensure every `image` includes `options.hotspot: true`.
- Provide concise `description` text, apply `rule.warning()` where length guidance helps, and add explicit `rule.required().error("<Message>")` reasons.
- Replace booleans with string select lists, never use single `reference` fields (always arrays of references), and order fields from most to least important.

### Dependency Injection

- Favor dependency injection via interfaces and maintain registries or containers so modules stay loosely coupled and testable.

## Workflow & Communication

- Use short, imperative commit subjects (e.g., `Add skin asset validation guard`); list executed commands and touched docs in the body.
- Pull requests must link relevant progress/task files, note test commands, and highlight documentation updates or pending verification.
- User prefers **collegial** communication: they would like it to be *clear, helpful, and easy to scan* without sounding clipped; reinforce user reasoning and flag risks or blockers.
- User prefers reference to **filenames only**; they say to supply the full path only when more than one file shares that name, and would rather you **omit line numbers** or git-status rundowns unless specifically requested.
- User has decided that providing full file paths and line numbers is unhelpful to them.
- Complete immediate follow-up work (tests, quality checks, documentation, related updates) without additional prompting; confirm with the user before starting sizable or risky follow-ups.
- Provide right-sized implementation context, and when the user signals confusion, explain the relevant systems and approach in an instructive, task-aligned way that builds their understanding.
- When introducing new interfaces or adapters, confirm DI seams remain substitutable and document mitigation if any SOLID rule is at risk.

## Teaching

- Provide right-sized implementation context, and when the user shows confusion, explain the relevant systems and your approach in an instructive, task-aligned way.

## Troubleshooting

### File Editing

- After three failed edit attempts caused by tooling issues, share the intended contents or >100-line diff in chat and ask the user to apply it.

## Skill Tree Maintenance

- Use the CLI for all updates—do not hand-edit `skill-tree/*.yaml` or `skill-log/` files. Run `npm run skill-tree:update -- --node <id> <ops…>` to adjust nodes, append evidence, and increment session counters (`-c`) while the tool regenerates `skill-tree/skill-tree.md` automatically.
- Capture new check-ins via the CLI’s logging flags (`--log "- Domains touched: …"`, `--log-slug <slug>` or `--log-file path.md`); the helper creates the dated entry under `skill-log/` and links it to the node updates. Use `--skip-render` only when markdown regeneration must be deferred.
- Record fine-grained exposure with `--topic-upsert id=<topic>,status=<status>,note="…"` so the CLI keeps `skill-tree/areas.yaml` in sync; continue using the standard status ladder (`unseen` → `encountered` → `learning` → `confident`) and keep notes concise.
- Before delivering a substantial summary or complex answer, run `npm run skill-tree:lookup -- <node>` (or a fuzzy search term) for the relevant skill to gauge current level and micro-topics; tailor explanations accordingly and offer lesson options where confidence is lowest.
- When a node or topic is marked `priority: true`, favour lessons/tests there whenever the session’s work aligns—unless focusing elsewhere is essential for task completion.
- For each affected node, adjust `level`, `readiness`, `confidence`, achievements, and hints via CLI flags (`--level`, `--readiness`, `--set-readiness`, `--confidence`, `--achievement`, `--set-next-hint`). Keep hierarchy depth at four levels max (root → level-2 → level-3 → level-4); if a concept would push deeper, create sibling branches or restructure instead.
- Track `readiness` (0–1) as progress toward the next evaluation. Promote: reset to 0.1. Fail: halve it, subtract 0.2, and floor at 0.1.
- When a lesson (rather than a formal test) results in the user restating concepts accurately, consider nudging `readiness` upward modestly (≤0.15) to reflect momentum—note the rationale in `evidence` using the CLI’s `--evidence` flag (`YYYY-MM-DD: detail`).
- Maintain `test_cooldown` (integer) so only one evaluation happens per session. After any test set it to at least 1; on failure compute `max(2, ceil(previous_readiness * 4))`. Decrement on later check-ins before testing again.
- Only schedule a test when `readiness >= 1` and `test_cooldown == 0`; record outcomes in `last_test` and future ideas in `next_test_hint` through the CLI.
- Limit to one skill test per session; if multiple nodes are ready, note the rest for follow-up instead of testing immediately.
- When the user misses a comprehension check, teach the concept, supply a fill-in-the-blank recap (with a tiny word bank if helpful), and capture the takeaway in `evidence`.

## Repository Integration

- Treat this file as the canonical cross-repo guidance; when creating a repo-specific `AGENTS.md`, fold in only the sections that apply to that codebase and drop language- or tool-specific rules that are irrelevant.
- Summarize shared rules instead of pasting duplicates—link back to the cross-repo document or reference the section name so future global updates apply automatically.
- Merge repo-specific conventions ahead of these global directives so the local policies take precedence, then note that remaining sections inherit from the cross-repo guidance.
- When a repo requires extra emphasis on a global rule, inline a short reminder rather than copying the entire section; keep the combined document under the same clarity and length standards as the rest of this file.
- The "Skill Tree Maintenance" section doesn't apply to all repos. Check first if the repo has access to it, either via the presence of the files associated with it or via the CLI command being available in the repo's venv; if it is, then include the full section in AGENTS.md, if not, then do not include it at all.
- The "TypeScript" section similarly only should be included in AGENTS.md for repos that contain TypeScript source code (not including any dependencies).

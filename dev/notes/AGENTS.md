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

- Design modules for extension, not modification; rely on abstracts/interfaces, configuration, dependency injection, clear extension hooks, and strategy-style polymorphism while avoiding type-check chains.

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

## Autonomy

- Complete immediate follow-up work (tests, quality checks, documentation, related updates) without additional prompting, but confirm with the user before tackling sizable or risky follow-ups.

## Communication

- Exclude emojis, filler, hype, or conversational transitions; stay directive, suppress engagement/sentiment cues, and focus on reinforcing the user’s independent reasoning.
- **No need** to include line numbers in summaries

## Teaching

- Provide right-sized implementation context, and when the user shows confusion, explain the relevant systems and your approach in an instructive, task-aligned way.

## Troubleshooting

### File Editing

- After three failed edit attempts caused by tooling issues, share the intended contents or >100-line diff in chat and ask the user to apply it.

## Repository Integration

- Treat this file as the canonical cross-repo guidance; when creating a repo-specific `AGENTS.md`, fold in only the sections that apply to that codebase and drop language- or tool-specific rules that are irrelevant.
- Summarize shared rules instead of pasting duplicates—link back to the cross-repo document or reference the section name so future global updates apply automatically.
- Merge repo-specific conventions ahead of these global directives so the local policies take precedence, then note that remaining sections inherit from the cross-repo guidance.
- When a repo requires extra emphasis on a global rule, inline a short reminder rather than copying the entire section; keep the combined document under the same clarity and length standards as the rest of this file.

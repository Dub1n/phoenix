Title: Generate Phase 1 implementation document (Haruspex 1.1) — Boosted

Role & Mode

- You are a senior developer specialized in:
  - VSCode extension development, TypeScript strict mode, Jest, @vscode/test-electron, ESLint/Prettier
  - Prompt design for Cursor-based LLM workflows and DSS documentation standards
  - TDD, CI-friendly documentation, and markdownlint-compliant authoring
- Operate in Cursor. Do not modify any files other than the single output described below.
- Use an internal scratchpad for planning. Do not include analysis, chain-of-thought, or notes in the final output.
- Aim for determinism: follow the Output Contract exactly.

Inputs

- Source of truth: Haruspex/docs/Haruspex_1.1.1_spec.md
- Roadmap files to align with:
  - Haruspex/dev/roadmap/Master-Implementation-Roadmap.md
  - Haruspex/dev/roadmap/Phase-Dependency-Framework.md
  - Haruspex/dev/roadmap/Phase-Template-Generator.md
  - Haruspex/dev/roadmap/Implementation-Guide.md

Output file

- Create directory if missing: Haruspex/dev/roadmap/phases/phase-01-foundation/
- Create: Haruspex/dev/roadmap/phases/phase-01-foundation/Phase-01-Foundation-Implementation.md

Project-specific constraints

- Version target: 1.1 architecture (embedded VSCode extension; no external servers/REST; NodeRR/CLI-first removed)
- Keep content concise and actionable; link to the spec rather than restating it
- Use DSS-style YAML frontmatter with arrays and snake_case tags
- Use relative MDC-friendly links exactly as shown in this prompt
- All Markdown must be markdownlint-friendly (valid tables, fenced blocks with language, no stray trailing spaces)

Frontmatter to include
---

tags: [haruspex, roadmap, phase_doc, vscode_extension, foundation]
provides: [phase_01_foundation_implementation]
requires: [../Master-Implementation-Roadmap.md, ../Phase-Dependency-Framework.md, ../Phase-Template-Generator.md, ../../../docs/Haruspex_1.1.1_spec.md]
---

Document content to generate

- Source of truth notice linking to ../../../docs/Haruspex_1.1.1_spec.md.
- Title: Phase 1: Foundation & VSCode Extension Setup — Haruspex Implementation.
- Executive Summary: 2-3 lines on Phase 1 objective and outcome for 1.1 (embedded VSCode extension foundation ready for subsequent phases).

Context and Technical Rationale

- Phase Scope & Boundaries:
  - Included: VSCode extension skeleton, strict TS config, lint/test/build workflow, extension test harness, basic activation, minimal commands scaffolding.
  - Excluded: Core engine, PCL validation, UI providers, monitoring (planned for later phases).
- Architecture Baseline (1.1) note: embedded extension; zero external servers/REST; NodeRR/CLI-first removed. Link to spec.
- VSCode Integration: minimal activation events; initial command registration placeholders aligned with Master-Implementation-Roadmap.

Prerequisites & Environment Setup

- From previous phases: N/A (this is the first).
- Development environment: Node 18+, npm 8+, VSCode 1.74+; tools (yo code, vsce, @vscode/test-electron); link to Implementation-Guide commands.
- Environment Validation: short bash block mirroring Implementation-Guide's validation snippet.

Implementation Roadmap

- Use the template's step structure; specify concrete, minimal deliverables:
  - Step 1: Test-Driven Development Foundation
    - Set up Jest + @vscode/test-electron scaffolding; minimal failing test proving extension activates.
    - Add scripts: build, test, lint, coverage.
  - Step 2: Extension Skeleton & Tooling
    - Initialize extension manifest with activation event (onStartupFinished).
    - Configure strict tsconfig; ESLint+Prettier; basic folder structure.
  - Step 3: Minimal Commands & Activation
    - Register a placeholder command (e.g., haruspex.refreshAll) that no-ops; ensure command shows in Command Palette.
  - Step [N]: Integration & System Testing
    - Run extension tests; ensure activation path works in development host; validate lint/build/test pipeline.

Reference Scaffolding (must be included in the doc)

Add a section titled "Reference Scaffolding (copy-pasteable)" containing these exact, minimal artifacts as fenced blocks with languages:

- package.json with engines.vscode ^1.74.0, activationEvents onStartupFinished, contributes.commands, scripts: build/lint/test:unit/test:ext/test; devDependencies for TypeScript 5, Jest + ts-jest, @vscode/test-electron, ESLint/Prettier, @types/vscode matching ^1.74.0.
- tsconfig.json (strict true, noImplicitAny, exactOptionalPropertyTypes, CJS, outDir dist, include src and test, types ["vscode","jest"]).
- .eslintrc.json and .prettierrc.json minimal configs.
- jest.config.js using ts-jest preset.
- src/extension.ts that registers no-op command haruspex.refreshAll.
- src/extension.test.ts unit test asserting command is registered after activate().
- test/runTests.ts invoking @vscode/test-electron runTests.
- Folder layout (src/, test/) and install/run commands block (npm install; npm run lint; npm run build; npm run test).

Test Strategy (concise)

- Unit: verify activation function registers command(s).
- Integration: extension host test that activation completes without errors.
- Performance: only basic smoke checks here (full perf gates in later phases).

Acceptance and Exit Criteria (align to Master-Implementation-Roadmap + Phase-Dependency-Framework)

- VSCode extension project structure complete with proper manifest.
- TypeScript compilation, lint, test workflows operational.
- Basic activation successful in VSCode development host.
- Extension testing framework configured and functional.
- ESLint/Prettier configured with project standards.
- No perf gates enforced yet beyond smoke checks.

Quality Gates (Phase 1)

- TypeScript strict mode compilation passes.
- ESLint compliance >95%.
- Extension loads without errors; basic command execution works.

Performance & Compatibility Notes (Phase 1 planning hooks only)

- Note the project-wide perf targets (activation <2s; file change <100ms; UI <200ms; memory <100MB) for awareness; not enforced here.
- Note VSCode version matrix (baseline ^1.74 + latest stable) intent; not enforced here.

Definition of Done

- Reiterate the exit criteria; include “Ready for Phase 2 entry checks” pointer.

Link hygiene

- Add short “Related” links at the end to the three roadmap files and the spec using relative paths.

Boosters (applied to this use case)

- Output Contract (strict):
  - Write exactly one file at path: Haruspex/dev/roadmap/phases/phase-01-foundation/Phase-01-Foundation-Implementation.md
  - Output format in this session:
    1) A single line: WRITE FILE: Haruspex/dev/roadmap/phases/phase-01-foundation/Phase-01-Foundation-Implementation.md
    2) One fenced block with language markdown containing the full file contents
    3) A short Diff Summary listing section headings only (no prose)
  - Do not emit any other text.
- Style & Formatting Rules:
  - Use ATX headings consistently; increment levels by one; no skipped levels
  - Valid pipe tables only; no HTML tables
  - Fenced code blocks must include a language (e.g., ```bash)
  - No trailing spaces; blank lines between major sections; keep lines reasonably short
  - Relative links only; match paths exactly as listed above
- Content Guardrails:
  - Do not restate the entire spec; link to it
  - Do not introduce servers/REST/NodeRR/CLI-first content—1.1 is an embedded extension
  - No placeholders like “TBD”; if something is out of scope for Phase 1, say so explicitly and point to later phases
  - No emojis or decorative characters; professional tone
- Evidence-first Drafting (silent):
  - Read referenced files; extract constraints and must-haves into a silent scratchpad
  - Resolve any contradictions in favor of the spec (Haruspex_1.1.1_spec.md), then Master-Implementation-Roadmap
- Self-Check (before emitting):
  - Frontmatter present and valid; tags/provides/requires exactly as specified
  - Section set matches the contract above; headings spelled and ordered correctly
  - All links are relative and resolve to listed files/paths
  - Contains acceptance criteria and quality gates verbatim where required
  - Markdown passes basic lint rules (headings, fences, tables)
- Minimal Revision Loop:
  - If any self-check fails, fix and re-validate once before emitting

After creating the file

- Ensure frontmatter and headings match project conventions.
- Validate tables/fences render.
- Post a brief diff summary of the new file (section headings only).

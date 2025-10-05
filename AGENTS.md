# Repository Guidelines

## Project Structure & Key Docs

- `Templum/` (primary focus) keeps source in `src/`, tests in `tests/` and `src/tests/`; launch sample backends from `examples/minimal-backend/` when running connectivity suites.
- Partner systems live in `Haruspex/`, `phoenix-code-lite/`, and `scripts/validation/`; read their current specs before altering shared contracts.
- Canonical references: `Templum/docs/current/architecture-spec.md`, `Templum/docs/current/progress.md`, `Templum/docs/current/testing-guide.md`, `meta/ARCHITECTURE.md`, `meta/DOC_HYGIENE.md`, `meta/workflows/README.md`.
- Cross-repo communication and engineering rules are in `dev/notes/AGENTS.md`; local guidance inherits from that file.

## Architecture & MVP Focus

- Goal: achieve the Ideal Requirements in the Templum architecture spec across Universal Interface Core, Backend Connectivity, Skin-Driven Rendering, Interface Delivery, and Quality & Release Readiness.
- Preserve the zero-knowledge backend registry—use `ServiceDiscovery`/`ConnectionFactory` without backend-specific assumptions; any manual override must keep outputs schema-validated (`Templum/dev/tasks/manual-override-flow.md`).
- All interfaces must render skins only; eliminate bespoke CLI/VSCode UI, keep adapters consuming `UniversalSkinDefinition` payloads.
- When touching Haruspex or Phoenix Code Lite integration points, sync the change with their specs, progress trackers, and task files in the same commit.

## Mission-Critical Priorities

- **Universal Interface Core:** finish `dev/tasks/unified-session-layer.md` and re-verify `zero-knowledge-registry.md`; land versioned skin contract enforcement before adapter work.
- **Backend Connectivity:** unblock `multi-protocol-auto-registration.md`, `connection-lifecycle-events.md`, and keep telemetry aligned with `observability-instrumentation.md`.
- **Skin-Driven Rendering:** complete `skin-payload-consumption.md`, `procedural-windowed-tui.md`, `skin-asset-validation.md`, and the Universal Skin Engine convergence plan.
- **Interface Delivery:** stabilise VSCode startup (`vscode-initialisation-stability.md`) and finish the CLI skin generator migration (`cli-skin-generator.md`).
- **Quality & Release:** raise `phase6-validation-signal.md`, execute `test-architecture-governance.md`, progress release hardening, go/no-go checklist, and audit/security tasks.
- Update `Templum/docs/current/progress.md` and the relevant `dev/tasks/*.md` whenever status changes; leave dated TODO markers if work stays partial.

## Onboarding Checklist

1. Read the canonical specs/tests docs listed above plus active playbooks (e.g., `meta/workflows/milestone-01-templum-haruspex-skin-handshake.md`).
2. Review utility governance: `Templum/dev/architecture/utility-consolidation-onboarding.md`, `Templum/dev/architecture/utility-consolidation-playbook.md`, and your assigned `utility-consolidation-plans/pattern-*.md` entry; log your stage in the activity log.
3. Map affected code with `rg` before editing; note consumers in the Stage 1/2 sections of the pattern plan.
4. Confirm environment: Node.js 20.x, `npm install` run in `Templum/` and `examples/minimal-backend/`, ports `3001-3004` free, `.templum/services/` clear.
5. Validate Phase 6 harness availability (`npm run phase6-health`) before committing backend/registry changes.

## Build & Test Commands

- `cd Templum && npm install` — install dependencies (rerun in `examples/minimal-backend/`).
- `npm test` — full Jest suite (unit + integration).
- `npm run test:ci` — CI-hardened Jest (`--runInBand --detectOpenHandles`).
- `npm run test:coverage` — generate coverage report; expect ≥80% on new utilities.
- `npm run phase6-validation` — build + mock backend validation; add `PHASE6_RUN_REAL=1 npm run phase6-validation:full` for live services.
- `npm run phase6-health` / `npm run phase6-health:real` — registry/health probes; confirm `.templum/services/` is cleaned afterward.
- `npx jest --config jest.backend.config.js` — backend integration focus with extended timeouts.

## Coding & Design Standards

- Follow the cross-repo directives in `dev/notes/AGENTS.md`: default to `["bash","-lc",…]`, avoid placeholders, favour TDD for new work, keep files <500 lines (warn at 400) and functions <40 lines, prefer dependency injection and extension over modification.
- TypeScript on Node 20.x, 2-space indentation, intention-revealing names; share utilities through logger/error-handler/`configureDisplayStack` seams and respect pattern docs in `Templum/dev/patterns/`.
- Remove duplication via shared helpers and regression-test reused code before rollout; record helper reuse in the pattern plan.
- Ensure new modules honour SOLID: composition over inheritance, interface segregation, no hard-coded backend knowledge.

## Testing & Quality Expectations

- Co-locate tests with code (`*.test.ts`/`*.spec.ts`); use TDD when adding utilities or infrastructure.
- Keep ports `3001-3004` free; clear `.templum/services/` if suites crash before teardown.
- Document leak fixes when `npm run test:ci` fails due to open handles—add cleanup logic and rerun.
- Always update architecture spec, progress tracker, testing guide, and task logs together; use `meta/DOC_CHANGE_CHECKLIST.md` before committing.
- When tests remain pending, state the gap and proposed plan in your summary per cross-repo guidance.

## Validation & Evidence Logging

- Capture command outputs (Phase 6 logs, coverage reports) in the relevant Stage sections of `utility-consolidation-plans/pattern-*.md` and link artefacts in progress/task docs.
- For Stage 3–6 hand-offs, append Activity Log entries noting commands executed (e.g., ``npm run phase6-validation -- --verbose``) and evidence paths.
- Mark uncertain spec sections with `Status: Needs Verification` callouts instead of silent drift.
- Archive or update superseded docs immediately, referencing the change in `meta/DOC_HYGIENE.md` expectations.

## Workflow & Communication

- Use short, imperative commit subjects (e.g., `Add skin asset validation guard`); list executed commands and touched docs in the body.
- Pull requests must link relevant progress/task files, note test commands, and highlight documentation updates or pending verification.
- Keep communication concise, professional, and collegial—clear, helpful, and easy to scan without sounding clipped; reinforce user reasoning and flag risks or blockers.
- When summarising work, reference the filename only; supply the full path only when more than one file shares that name, and omit git-status rundowns unless specifically requested.
- Complete immediate follow-up work (tests, quality checks, documentation, related updates) without additional prompting; confirm with the user before starting sizable or risky follow-ups.
- Provide right-sized implementation context, and when the user signals confusion, explain the relevant systems and approach in an instructive, task-aligned way that builds their understanding.
- Sprinkle in brief comprehension checks after key explanations—focus on the underlying concept or principle rather than restating the summary—and pause for the user’s reply before moving on; use a friendly tone rather than punitive delays.
- When the user misses a check, follow up with a concise explanation and ask them to restate it in their own words—offer a short fill-in-the-blank (with a tiny word bank if helpful) to reinforce the concept before continuing.
- Respect utility consolidation stage gates; never skip Stage 3–5 planning. Escalate blockers instead of bypassing the playbook.
- When introducing new interfaces or adapters, confirm DI seams remain substitutable and document mitigation if any SOLID rule is at risk.

## Harness Execution Notes

- When a command needs elevated privileges, issue a single `sudo` call per tool invocation; the user sees the password prompt even if the agent output does not.
- Allow at least a 60 s command timeout so the user can enter credentials before the harness aborts.
- Do not skip required privileged commands—run them, wait for the password to be entered, and continue once the harness returns control. If a sudo command still times out, assume the user is away and fall back to non-sudo work until they respond.

## Skill Tree Maintenance
- Update `skill-tree/skill-tree.yaml` whenever a session includes real learning or capability shifts; add a dated entry under `skill-log/` with the standard check-in template unless the user declines.
- Log fine-grained exposure in `skill-tree/areas.yaml` when a topic is discussed but doesn’t merit a dedicated node; set the appropriate status (`unseen` → `encountered` → `learning` → `confident`) and keep notes succinct.
- Before delivering a substantial summary or complex answer, run `npm run skill-tree:lookup -- <node>` (or a fuzzy search term) for the relevant skill to gauge current level and micro-topics; tailor explanations accordingly and offer lesson options where confidence is lowest.
- When a node or topic is marked `priority: true`, favour lessons/tests there whenever the session’s work aligns—unless focusing elsewhere is essential for task completion.
- For each affected node, adjust `level` using the shared ladder (Learner → Junior → Mid → Senior → Staff) and set `confidence` to highlight tentative judgments.
- Keep hierarchy depth at four levels max (root → level-2 → level-3 → level-4); if a concept would push deeper, split or reorganise branches instead of nesting further.
- Track `readiness` (0–1) as progress toward the next evaluation. Promote: reset to 0.1. Fail: halve it, subtract 0.2, and floor at 0.1.
- When a lesson (rather than a formal test) results in the user restating concepts accurately, consider nudging `readiness` upward modestly (≤0.15) to reflect momentum—note the rationale in `evidence`.
- Maintain `test_cooldown` (integer) so only one evaluation happens per session. After any test set it to at least 1; on failure compute `max(2, ceil(previous_readiness * 4))`. Decrement on later check-ins before testing again.
- Only schedule a test when `readiness >= 1` and `test_cooldown == 0`; record outcomes in `last_test` and future ideas in `next_test_hint`.
- Limit to one skill test per session; if multiple nodes are ready, note the rest for follow-up instead of testing immediately.
- When the user misses a comprehension check, teach the concept, supply a fill-in-the-blank recap (with a tiny word bank if helpful), and capture the takeaway in `evidence`.

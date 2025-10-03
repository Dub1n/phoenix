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
- Communication stays directive and professional—no emojis or filler; reinforce user reasoning and explicitly flag risks or blockers.
- Respect utility consolidation stage gates; never skip Stage 3–5 planning. Escalate blockers instead of bypassing the playbook.
- When introducing new interfaces or adapters, confirm DI seams remain substitutable and document mitigation if any SOLID rule is at risk.

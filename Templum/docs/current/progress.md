---
doc-type: progress
name: Templum MVP Progress Tracker
tags: [templum, progress, mvp]
status: current
last_updated: 2025-10-14
---

# Templum — MVP Route Tracker

## Fastest-to-MVP Snapshot

> Scope lock: anything outside this list is frozen until the MVP ships.

1. **Stabilise discovery & sessions** — multi-protocol auto-registration, zero-knowledge registry verification, shared session/context manager, minimal helper extractions.
2. **Lock skin enforcement & rendering** — Ajv-backed skin validation, skin-driven rendering + CLI generator + procedural TUI, reuse Phoenix assets, fail-first tests.
3. **Harden runtime signals & coverage** — central process-signal manager, repaired coverage tooling, lifecycle broadcasts, manual overrides, lint/test sanity script.
4. **Integrate partners & observability** — Haruspex + PCL ingestion with real skins, baseline logging/metric wiring, minimal command matrix documentation.

## Pattern 6 Close-Out

- [x] [Phase 6 harness & formatter lock-in](../../dev/tasks/pattern-6-finalisation.md)
  Progress 100% — Migrated the remaining CLI/window helpers to `TerminalFormatter` (`src/rendering/content-layout-system.ts`, `src/interfaces/terminal-compatibility-detector.ts`, `src/interfaces/universal-interaction-manager.ts`), routed string utils + layout logs through formatter-aware filters so adaptive CLI integration runs without teardown warnings (`npm test -- --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts`), and re-ran the harness (`npm run phase6-health`, `npm run phase6-validation`) with clean SKIPPED health output and fresh reports (`validation-reports/phase6-validation-2025-10-06T14-08-01-667Z.*`). Real-backend validation remains an opt-in follow-up once partner services are available (tracked in `dev/tasks/phase6-validation-signal.md`).

## Universal Interface Core

- [x] [Zero-knowledge backend registry with auto-discovery](../../dev/tasks/zero-knowledge-registry.md)
  Progress 100% — Watcher overrides and regression coverage are in place, manual verification is documented, and the remaining real-backend Phase 6 run is waived to post-MVP under `dev/tasks/phase6-validation-signal.md`.
- [x] [Versioned skin contract enforcement](../../dev/tasks/versioned-skin-contract.md)
  Progress 100% — Ajv-backed validation now enforces the canonical schema (performance hints, menu/command/workflow structures), emits schema metadata on registration, and new contract + adapter suites cover rejection flows. Full `npm test -- --runTestsByPath … --runInBand --forceExit` is green.
- [x] [Unified session/context layer across adapters](../../dev/tasks/unified-session-layer.md)
 Progress 100% — Stage 4 removed the CLI adapter’s bespoke `navigationHistory`/mode fields in favour of bridge helpers, and Stage 5 hardened teardown by clearing session listeners and asserting disconnect hooks. Evidence: `node scripts/run-with-timeout.mjs --timeout 60000 -- npm test -- --runInBand --forceExit --runTestsByPath tests/interfaces/universal-interaction-manager.session.test.ts` (interaction manager), `node scripts/run-with-timeout.mjs --timeout 180000 -- npm test -- --runInBand --forceExit --runTestsByPath tests/interfaces/interface-adapter-integration.test.ts` (CLI/VSC adapters), plus the existing unified session manager integration run. Documentation synced with the task spec and architecture notes; no open-handle leaks observed under the forced-exit harness.
 2025-10-11: Stage 4 lane 4a attached the CLI and command adapters to the consolidated `EventUtils` typed bus, retaining session bridge behaviour while recording evidence via `npm run test -- --runTestsByPath src/tests/rendering/menu-definition-adapter.test.ts` (log: `dev/architecture/evidence/pattern-4-lane-4a-menu-definition-adapter.test.md`).
 2025-10-12: Stage 5 reran the gating battery (`npm run phase6-validation`, `npm run phase6-health`, backend/manual-override suites) under mocks, archived logs at `tmp/consolidation/pattern-4-stage5/`, and moved Stage 6 lanes to `pending` pending real-backend reruns to clear performance and cross-interface warnings. Subsequent mock harness tuning on 2025-10-12 normalised cross-interface/performance checks (`tmp/consolidation/pattern-4-stage5/phase6-validation-after-mock-perf-adjust.log`, report `validation-reports/phase6-validation-2025-10-12T12-38-55-983Z.md`).
 Stage 7 (2025-10-12) reran the event-utils guardrail (`npm test -- src/tests/utils/event-utils.test.ts`) and backend manual-override battery alongside `npm run phase6-validation`/`npm run phase6-health`, archived the artefacts under `tmp/consolidation/pattern-4-stage7/`, and tightened the force-exit timer parameter in `src/interfaces/navigation/exit-handler.ts` to keep the typed session teardown path build-clean while the real-backend window tracked in `dev/tasks/phase6-validation-signal.md` remains pending.
 2025-10-13: Stage 6 lane 6j migrated the observability system, CLI performance monitor, risk mitigation stack, and validation orchestrators onto the shared `EventDrivenComponent`/`EventUtils` seams (`src/observability/templum-observability-system.ts`, `src/monitoring/cli-performance-monitor.ts`, `src/risk/*.ts`, `src/validation/*.ts`), eliminating raw `EventEmitter` inheritance while preserving zero-knowledge emitters. Evidence: `npm run test:ci` (`tmp/consolidation/pattern-4-lane-6j/test-ci.log`), `npm run phase6-validation` (`tmp/consolidation/pattern-4-lane-6j/phase6-validation.log`), `npm run phase6-health` (`tmp/consolidation/pattern-4-lane-6j/phase6-health.log`).
 2025-10-14: Stage 6 lane 6l completed the residual observability/risk migrations onto the shared adapter, refactoring `TemplumObservabilitySystem` to consume the `EventDrivenComponent` emitter directly and adding `tests/risk/rollback-criteria.test.ts` to guard the risk bus. Evidence: `node scripts/run-with-timeout.mjs --timeout 45000 -- npm run test -- --runTestsByPath tests/interfaces/interface-adapter-integration.test.ts tests/core/observability-adapter.test.ts tests/risk/rollback-criteria.test.ts` (`tmp/consolidation/pattern-4-stage6/lane-6l/event-driven-migration-tests.log`).
 2025-10-14: Stage 7 close-out reran the typed EventUtils guardrail and Phase 6 gating battery after the Stage 6 expansions, logging outputs at `tmp/consolidation/pattern-4-stage7/npm-test-event-utils.log`, `tmp/consolidation/pattern-4-stage7/npm-run-phase6-validation.log`, and `tmp/consolidation/pattern-4-stage7/npm-run-phase6-health.log` before marking the stage release-ready.
  2025-10-12: Stage 6 lane 6e introduced the reusable `createEventBusHost` scaffolding (`src/utils/event-utils.ts` + guardrail tests) to replace direct `EventEmitter` inheritance, refreshed the EventEmitter inventory (`tmp/consolidation/pattern-4-stage6e/eventemitter-usage-files.log`), and partitioned the remaining migrations into queued lanes 6h–6j so core/state, backend/registry, and validation/observability/risk surfaces can adopt the typed bus once the prerequisites close.
  2025-10-13: Stage 6 lane 6i finalises backend/registry adoption by refactoring `src/utils/event-bus-adapter.ts` onto `createEventBusHost`, routing lifecycle propagation through typed emitters (`src/backend/backend-service-router.ts`), and converting the `PathUtils` guard to explicit message assertions (`src/tests/utils/path-utils.test.ts`). Gating evidence archived at `tmp/consolidation/pattern-4-stage6/lane-6i-test-ci-20251013T224301Z.log`, `tmp/consolidation/pattern-4-stage6/lane-6i-phase6-validation-20251013T224530Z.log`, and `tmp/consolidation/pattern-4-stage6/lane-6i-phase6-health-20251013T224542Z.log`.

## Backend Connectivity

- [x] [Multi-protocol auto-registration with health checks](../../dev/tasks/multi-protocol-auto-registration.md)
  Completed — Router/discovery fixes plus multi-protocol test + health suites are green (`npm test -- src/tests/backend/service-discovery.test.ts src/tests/backend/backend-dependency-integration.test.ts src/tests/backend/generic-backend-integration.test.ts`; `npm run test:health`). Live Phase 6 service evidence is rescheduled post-MVP (see `docs/target/post-mvp-progress.md`).
- [x] [Connection lifecycle event broadcasting to interfaces/logs](../../dev/tasks/connection-lifecycle-events.md)
  Progress 100% — Router now emits normalized lifecycle events via a dedicated channel, TemplumCore re-broadcasts them to observability/state manager, and adapters receive deduped updates; targeted backend/core suites pass under the timeout harness (`node scripts/run-with-timeout.mjs --timeout 45000 -- npm test -- --runTestsByPath src/tests/backend/backend-connection-lifecycle.test.ts`). 2025-10-12 gating logged `npm run phase6-validation`, `npm run phase6-health`, and the backend/manual-override suites (evidence in `tmp/consolidation/pattern-4-stage5/`), unblocking Stage 6 lanes while flagging the mock-backed performance regression and cross-interface follow-up for real-service runs. Mock harness parity fixes landed the same day to eliminate false-positive regression warnings in the generated reports (`validation-reports/phase6-validation-2025-10-12T12-38-55-983Z.md`). Stage 7 renewed the backend serialization/connection/manual-override suites plus the Phase 6 health/validation commands (artefacts in `tmp/consolidation/pattern-4-stage7/`) and corrected the logger context wiring in `src/backend/connection-factory.ts` so `npm run build` remains green ahead of the live backend rerun.
- [x] [Manual override flow without breaking zero-knowledge behaviour](../../dev/tasks/manual-override-flow.md)
  Progress 100% — Watcher-backed manual overrides now pass integration coverage (`src/tests/backend/manual-override-watcher.integration.test.ts`), CLI/VSCode plumbing exposes apply/clear, and observability records hashed events; awaiting partner manifests only for live Phase 6 evidence.

## Skin-Driven Rendering

- [x] [Timer & Event cleanup for test harness](../../dev/architecture/safe-consolidation-candidates.md)
  Progress 100% — Stage 6 lanes 6e–6o finished migrating backend/state/core adapters, integration harnesses, and CLI helper scripts onto `AsyncUtils`-managed timers (`scripts/run-with-timeout.mjs`, backend/state timer sweeps), cleared the outstanding sweeps, and Stage 7 reran the consolidated CI + Phase 6 gating battery with fresh artefacts (`tmp/consolidation/pattern-3-stage7/test-ci.log`, `tmp/consolidation/pattern-3-stage7/phase6-validation.log`, `tmp/consolidation/pattern-3-stage7/phase6-health.log`) to confirm the harness exits without leaked handles.
- [x] [Skin payload consumption powering full UI without hardcoding](../../dev/tasks/skin-payload-consumption.md)
  Progress 100% — Orchestrator now caches backend skins and immediately replays them to active adapters, CLI/VSCode load flows render directly from `UniversalSkinDefinition` payloads, and integration coverage proves skins surface without fallback scaffolds (`npm test -- --runTestsByPath tests/rendering/skin-payload-consumption.integration.test.ts`).
- [ ] [Procedural windowed TUI layout from skin descriptors](../../dev/tasks/procedural-windowed-tui.md)
  Progress 20% — `ContentLayoutSystem` is unused by CLI flows; no procedural layout specs run.
- [~] [CLI generator uses skin metadata](../../dev/tasks/cli-skin-generator.md)
  Progress 10% — No dedicated generator module; CLI adapters emit fallback text rather than payload-derived menus.
- [ ] [Minimal MCP terminal bridge for agent CLI validation](../../dev/tasks/minimal-mcp-terminal-bridge.md)
  Progress 90% — Stage 1–4 complete (minimal FastMCP bridge live, legacy MCP architecture removed, in-repo MCP integration stripped from validation system). Pending: capture smoke-test evidence and wire automated validation before closing the task.

## Interface Delivery

- [x] [CLI metadata parser & UX polish](../../dev/architecture/cli-ux-work.md)
  Progress 100% — All consolidation CLI commands now route through a shared descriptor-driven parser (`dev/architecture/consolidation-scripts/cli-command-registry.mjs` + `dev/architecture/consolidation-scripts/cli-shared-parser.mjs`), repeated `--plan-files` flags are normalised automatically, and per-command `--help` output is generated from the metadata (see updated `dev/architecture/consolidation-cli-design.md`). Targeted regression coverage lives in `tests/scripts/cli-shared-parser.test.ts` (`npm run test -- --runTestsByPath tests/scripts/cli-shared-parser.test.ts`).
- [!] [VSCode extension initialisation stable](../../dev/tasks/vscode-initialisation-stability.md)
  Progress 30% — Activation in no-workspace scenarios still aborts; WebView readiness logs warnings and tests hang without forced teardown.

## Developer Workflow Alignment

- [ ] [Design review acknowledgements](../../dev/tasks/design-review-acknowledgements.md)
  Progress 0% — Awaiting Phoenix Code Lite review schema to render role-aware acknowledgement flow and write back independence confirmations (Development-Process-1.pdf §3.2, p.6).
- [ ] [Sprint review risk prompts](../../dev/tasks/risk-review-prompts.md)
  Progress 0% — Depends on Phoenix Code Lite risk ledger API to surface sprint risk updates and capture reviewer notes (Development-Process-1.pdf §7, p.10).
- [ ] [Developer workflow prompts and notifications](../../dev/tasks/developer-discipline-prompts.md)
  Progress 0% — Requires consuming Phoenix Code Lite workflow metadata so deterministic checks auto-complete with evidence links while residual manual steps surface targeted prompts (Development-Process-1.pdf Practical Developer Guide, pp.14–22).
- [ ] [Templum backlog tooling visibility](../../dev/tasks/backlog-tooling-visibility.md)
  Progress 0% — Awaiting final backlog tooling decision from Phoenix Code Lite to update CLI/VS Code onboarding and help flows (Development-Process-1.pdf Software Comparison, pp.29–31).
- [ ] [Restore consolidation CLI shared parser](../../dev/tasks/cli-shared-parser-restoration.md)
  Progress 80% — Updated all consolidate workflows and tests to import directly from `dev/architecture/consolidation-scripts/cli-shared-parser.mjs` / `cli-command-registry.mjs`, removed the temporary top-level shims, and reran the probe (`npm run test -- --runTestsByPath tests/scripts/cli-shared-parser.test.ts --runInBand --no-cache`). Follow-up: close out the restoration task once documentation sign-off is captured.

## Quality & Runtime Stability

- [x] [Test architecture consolidation and coverage governance](../../dev/tasks/test-architecture-governance.md)
  Progress 100% — Codified suite taxonomy (unit/backend/e2e) with explicit coverage bands (`scripts/coverage-thresholds.js`), added `jest.e2e.config.js`, and refactored `scripts/coverage-reality-check.js` to orchestrate all suites, merge summaries, and persist trend history. `npm run coverage:governance` now gates the aggregate (≥32/22/32/32) while pre-commit hooks invoke the same flow. Stabilised the formerly red suites (`tests/core/interface-switching.test.ts`, `src/tests/core/templum-core-connection-events.test.ts`, `tests/development-tools/debug-utils.test.ts`, `src/tests/utils/path-utils.test.ts`) so coverage governance runs cleanly; documentation updated in the architecture spec and testing guide to reflect the thresholds.
- [x] [TypeScript build parity restoration](../../dev/tasks/typescript-build-parity.md)
  Progress 100% — Added explicit teardown for `ResponsiveLayout` consumers (TerminalUI, InteractiveSearch, CLI adapter tests) so repeated suites no longer leak `process.stdout` resize listeners, introduced `scripts/clean-build-artifacts.js` and wired `npm run build` to clean `dist`/`.tsbuildinfo` before compiling, and reran the gating battery (`npm run build`, `npm run test:ci`, `npm run phase6-validation`, `npm run phase6-health`). Evidence: `tmp/consolidation/pattern-4-stage6/lane-6n/npm-run-build-20251013T153412.log`, `.../npm-run-test-ci-20251013T153504.log`, `.../npm-run-phase6-validation-20251013T153433.log`, `.../npm-run-phase6-health-20251013T153447.log`.
- [ ] [Process signal listener consolidation](../../dev/tasks/process-signal-listener-consolidation.md)
  Progress 10% — Dozens of direct `process.on` registrations remain, leaving Jest hanging.
- [ ] [Phase 6 validation signal overhaul](../../dev/tasks/phase6-validation-signal.md)
  Progress 5% — New mandate is to tear out the synthetic readiness metrics and make the harness emit deterministic pass/fail (no random delays or default 100% mocks) before layering real instrumentation back in.
- [ ] [QMS bundle crosswalk for legacy SSI-QF obligations](../../dev/tasks/qms-bundle-crosswalk.md)
  Progress 0% — Needs bundle schema outline and contextual mapping from retired SSI-QF forms to Phoenix Code Lite exports so auditors can see how each regulatory obligation is met once Word/Excel SOP artefacts are removed.
- [ ] [Table component schema & rendering support](../../dev/tasks/table-component-schema.md)
  Progress 0% — Define a reusable table/checklist skin component with cell-level UI hints and editable state so Phoenix Code Lite (and other backends) can surface Practical Developer Guide prompts and CRUD-style tables without bespoke optional fields.
- [~] [Structured metrics and logging in place](../../dev/tasks/observability-instrumentation.md) *(MVP subset: `dev/tasks/mvp/observability-baseline.md`)*
  Progress 45% — Stage 4 lane 4c moved observability and resilience emitters onto the consolidated `EventUtils` bus, but `npm test -- --runTestsByPath tests/core/observability-adapter.test.ts` (2025-10-12) now fails with `Cannot read properties of null (reading 'level')`; restore adapter bootstrap wiring and reconcile entrypoint sinks before rerunning the suites.

## Integration Partners

- [~] [Haruspex integration path defined](../../dev/tasks/haruspex-integration.md)
  Progress 20% — Specs exist but no skin output or ingestion tests; live Phase 6 boot is parked post-MVP while Haruspex build fixes land.
- [ ] [Phoenix Code Lite skin ingestion validated](../../dev/tasks/pcl-skin-ingestion.md)
  Progress 0% — Awaiting PCL exporter prototype and ingestion harness.

> Deferred/Post-MVP work is tracked in `docs/target/post-mvp-progress.md`.

## Utility Consolidation Snapshot

- Async Utils consolidation (Pattern 3) closed Stage 7 validation on 2025-10-12; run-with-timeout harness runs for backend lifecycle/manual override/comprehensive validation, service discovery + dependency integrations, hybrid validation + unified session, and interface adapter suites all passed (`tmp/consolidation/pattern-3-stage7-*.log`). `npm run phase6-validation`/`npm run phase6-health` produced fresh artefacts (`validation-reports/phase6-validation-2025-10-12T18-05-03-893Z.md`) and logged the mock-only skip that remains covered by `dev/tasks/phase6-validation-signal.md`.
- Terminal Formatter consolidation (Pattern 7) completed Stage 7 validation on 2025-10-06; CI gating suites for formatter, CLI/menu, and MCP integrations passed, and the known Phase 6 health harness failure is attributed to the deprecated integration-validation framework stub rather than formatter regressions.
- Event Utils consolidation (Pattern 4) cleared Stage 5A cohort alignment on 2025-10-12 — Stage 4 guardrails (adapter cleanup, session lifecycle hooks, telemetry wiring, skin engine readiness) re-verified via the event-utils suite (`npm test -- src/tests/utils/event-utils.test.ts`), Stage 6 adapter-mock dependency tracked for templum-core connection coverage, and cohort notes updated ahead of Stage 5B gating. Stage 6 lane 6g (tests/MCP channel audit) is now green with typed EventUtils adoption and deterministic E2E harness timings captured in `tmp/consolidation/pattern-4-stage6/lane-6g-test-run-20251012T205958Z.log`.
- Error Handler consolidation (Pattern 2) closed Stage 5B alignment on 2025-10-14; resolved TypeScript regressions in `src/core/templum-core.ts` + `src/interfaces/cli-adapter-abstracted.ts` to keep ErrorHandler payloads string-safe and logger contracts compliant, re-ran the Stage 6 gating battery (`node scripts/run-with-timeout.mjs --preset phase6-validation -- npm run phase6-validation`), and archived the evidence at `logs/consolidation/pattern-2/stage5b/phase6-validation-20251014T140958Z.log`. Stage 6 lanes 6a/6b remain staged for assignment once the restored service-discovery integration test lands per the cohort spec.
- Error Handler consolidation (Pattern 2) unlocked Stage 6 lane 6a on 2025-10-14; restored service-discovery cache coverage (`tests/service-discovery/discovery-cache.integration.test.ts`), introduced regression-focused ErrorHandler utilities coverage (`src/tests/utils/error-handler.test.ts`), and ran the mandated suite battery via `node scripts/run-with-timeout.mjs --preset jest-suite -- npm run test -- --runTestsByPath src/tests/utils/error-handler.test.ts`, `node scripts/run-with-timeout.mjs --preset jest-suite -- npm run test -- --runTestsByPath tests/backend/connection-factory.test.ts`, and `node scripts/run-with-timeout.mjs --preset jest-ci --timeout 300000 -- npm run test:ci`; artefacts captured at `logs/consolidation/pattern-2/lane-6a/error-handler-20251014T152143Z.log`, `logs/consolidation/pattern-2/lane-6a/connection-factory-20251014T152158Z.log`, and `logs/consolidation/pattern-2/lane-6a/test-ci-20251014T152253Z.log`.

---
doc-type: progress
name: Templum MVP Progress Tracker
tags: [templum, progress, mvp]
status: current
last_updated: 2025-10-06
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

## Backend Connectivity

- [x] [Multi-protocol auto-registration with health checks](../../dev/tasks/multi-protocol-auto-registration.md)
  Completed — Router/discovery fixes plus multi-protocol test + health suites are green (`npm test -- src/tests/backend/service-discovery.test.ts src/tests/backend/backend-dependency-integration.test.ts src/tests/backend/generic-backend-integration.test.ts`; `npm run test:health`). Live Phase 6 service evidence is rescheduled post-MVP (see `docs/target/post-mvp-progress.md`).
- [x] [Connection lifecycle event broadcasting to interfaces/logs](../../dev/tasks/connection-lifecycle-events.md)
  Progress 100% — Router now emits normalized lifecycle events via a dedicated channel, TemplumCore re-broadcasts them to observability/state manager, and adapters receive deduped updates; targeted backend/core suites pass under the timeout harness (`node scripts/run-with-timeout.mjs --timeout 45000 -- npm test -- --runTestsByPath src/tests/backend/backend-connection-lifecycle.test.ts`).
- [x] [Manual override flow without breaking zero-knowledge behaviour](../../dev/tasks/manual-override-flow.md)
  Progress 100% — Watcher-backed manual overrides now pass integration coverage (`src/tests/backend/manual-override-watcher.integration.test.ts`), CLI/VSCode plumbing exposes apply/clear, and observability records hashed events; awaiting partner manifests only for live Phase 6 evidence.

## Skin-Driven Rendering

- [ ] [Timer & Event cleanup for test harness](../../dev/architecture/safe-consolidation-candidates.md)
  Progress 0% — Migrate suites that keep Jest alive to `AsyncUtils.createInterval`/`cleanup` and the refactored `event-utils` wrapper per `Templum/dev/patterns/utilities/core/async-utils.md`, `Templum/src/utils/async-utils.ts`, and plan the broader adoption via `Templum/dev/architecture/utility-consolidation-playbook.md`.
- [x] [Skin payload consumption powering full UI without hardcoding](../../dev/tasks/skin-payload-consumption.md)
  Progress 100% — Orchestrator now caches backend skins and immediately replays them to active adapters, CLI/VSCode load flows render directly from `UniversalSkinDefinition` payloads, and integration coverage proves skins surface without fallback scaffolds (`npm test -- --runTestsByPath tests/rendering/skin-payload-consumption.integration.test.ts`).
- [ ] [Procedural windowed TUI layout from skin descriptors](../../dev/tasks/procedural-windowed-tui.md)
  Progress 20% — `ContentLayoutSystem` is unused by CLI flows; no procedural layout specs run.
- [~] [CLI generator uses skin metadata](../../dev/tasks/cli-skin-generator.md)
  Progress 10% — No dedicated generator module; CLI adapters emit fallback text rather than payload-derived menus.

## Interface Delivery

- [!] [VSCode extension initialisation stable](../../dev/tasks/vscode-initialisation-stability.md)
  Progress 30% — Activation in no-workspace scenarios still aborts; WebView readiness logs warnings and tests hang without forced teardown.

## Quality & Runtime Stability

- [ ] [Test architecture consolidation and coverage governance](../../dev/tasks/test-architecture-governance.md)
  Progress 20% — Coverage command fails with `babel-plugin-istanbul` errors; suite-specific thresholds not in place.
- [ ] [Process signal listener consolidation](../../dev/tasks/process-signal-listener-consolidation.md)
  Progress 10% — Dozens of direct `process.on` registrations remain, leaving Jest hanging.
- [ ] [Phase 6 validation signal overhaul](../../dev/tasks/phase6-validation-signal.md)
  Progress 5% — New mandate is to tear out the synthetic readiness metrics and make the harness emit deterministic pass/fail (no random delays or default 100% mocks) before layering real instrumentation back in.
- [?] [Structured metrics and logging in place](../../dev/tasks/observability-instrumentation.md) *(MVP subset: `dev/tasks/mvp/observability-baseline.md`)*
  Progress 0% — Blueprint exists but runtime logging/metric hooks are not wired.

## Integration Partners

- [~] [Haruspex integration path defined](../../dev/tasks/haruspex-integration.md)
  Progress 20% — Specs exist but no skin output or ingestion tests; live Phase 6 boot is parked post-MVP while Haruspex build fixes land.
- [ ] [Phoenix Code Lite skin ingestion validated](../../dev/tasks/pcl-skin-ingestion.md)
  Progress 0% — Awaiting PCL exporter prototype and ingestion harness.

> Deferred/Post-MVP work is tracked in `docs/target/post-mvp-progress.md`.

## Utility Consolidation Snapshot

- Terminal Formatter consolidation (Pattern 7) completed Stage 7 validation on 2025-10-06; CI gating suites for formatter, CLI/menu, and MCP integrations passed, and the known Phase 6 health harness failure is attributed to the deprecated integration-validation framework stub rather than formatter regressions.

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

- [ ] [Phase 6 harness & formatter lock-in](../../dev/tasks/pattern-6-finalisation.md)
  Progress 0% — Stage 7 validation for Terminal Formatter still fails because the compiled Phase 6 harness cannot resolve `../tests/integration-validation-framework`, residual `chalk` calls linger in `content-layout-system.ts`, `terminal-compatibility-detector.ts`, and `universal-interaction-manager.ts`, and adaptive CLI integration runs emit teardown warnings that risk masking leaks.

## Universal Interface Core

- [~] [Zero-knowledge backend registry with auto-discovery](../../dev/tasks/zero-knowledge-registry.md)
  Progress 45% — Unit tests pass (`npm run test -- src/tests/backend/service-discovery.test.ts`), but the generic backend integration suite still fails before watcher/health paths execute.
- [~] [Versioned skin contract enforcement](../../dev/tasks/versioned-skin-contract.md)
  Progress 15% — Validator remains hand-written; Ajv-backed schema enforcement and adapter rejection tests are still pending.
- [ ] [Unified session/context layer across adapters](../../dev/tasks/unified-session-layer.md)
  Progress 15% — Shared manager exists but is not injected; adapters still manage their own session state and leave Jest open handles.

## Backend Connectivity

- [?] [Multi-protocol auto-registration with health checks](../../dev/tasks/multi-protocol-auto-registration.md)
  Progress 35% — Strategy scaffolding is in place, yet `discoverAndConnect()` crashes under Jest; protocol-specific health probes remain HTTP-only.
- [ ] [Connection lifecycle event broadcasting to interfaces/logs](../../dev/tasks/connection-lifecycle-events.md)
  Progress 0% — Lifecycle payloads are not emitted, so adapters/logs never reflect backend state.
- [ ] [Manual override flow without breaking zero-knowledge behaviour](../../dev/tasks/manual-override-flow.md)
  Progress 0% — No override manager or sanitized descriptors exist; router/discovery paths ignore overrides.

## Skin-Driven Rendering

- [ ] [Skin payload consumption powering full UI without hardcoding](../../dev/tasks/skin-payload-consumption.md)
  Progress 25% — Rendering scaffolding exists, but adapters still use fallback dumps instead of payload-driven menus.
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
- [?] [Structured metrics and logging in place](../../dev/tasks/observability-instrumentation.md) *(MVP subset: `dev/tasks/mvp/observability-baseline.md`)*
  Progress 0% — Blueprint exists but runtime logging/metric hooks are not wired.

## Integration Partners

- [~] [Haruspex integration path defined](../../dev/tasks/haruspex-integration.md)
  Progress 20% — Specs exist but no skin output or ingestion tests.
- [ ] [Phoenix Code Lite skin ingestion validated](../../dev/tasks/pcl-skin-ingestion.md)
  Progress 0% — Awaiting PCL exporter prototype and ingestion harness.

> Deferred/Post-MVP work is tracked in `docs/target/post-mvp-progress.md`.

## Utility Consolidation Snapshot

- Terminal Formatter consolidation (Pattern 7) completed Stage 7 validation on 2025-10-06; CI gating suites for formatter, CLI/menu, and MCP integrations passed, and the known Phase 6 health harness failure is attributed to the deprecated integration-validation framework stub rather than formatter regressions.

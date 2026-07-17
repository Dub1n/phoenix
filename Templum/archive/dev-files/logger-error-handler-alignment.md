---
date: 2025-10-15T10:56:00Z
name: logger-error-handler-alignment
TASK-ID: ['TASK-ARCH-005-STAGE5A']
category: architecture-operations
status: ['[x]']
tags: ['utility-consolidation', 'stage-5', 'alignment', 'logger', 'error-handler']
dependencies: [
  'utility-consolidation-plans/pattern-1.generated.md',
  'utility-consolidation-plans/pattern-2.generated.md',
  'utility-consolidation-activity-log.generated.md',
  'Templum/docs/current/progress.md',
  'dev/tasks/unified-session-layer.md',
  'dev/tasks/manual-override-flow.md'
]
---

# Logger + Error Handler Stage 5 Alignment Spec

Stage 4 prerequisites for Pattern 1 (Logger Consolidation) and Pattern 2 (Error Handler Consolidation) are complete. This document captures the shared baselines, guardrails, and Stage 5A outcomes for Cohort 1‑2 so Stage 5B can unblock Stage 6 without re-scraping individual plans.

## Alignment Snapshot

- **Cohort**: 1‑2 — Logger + Error Handler
- **Coordinator**: Codex (2025-10-15T10:45:00Z session)
- **Stage 5A window**: 2025-10-15T10:45:00Z → 2025-10-15T11:30:00Z
- **Attendees**: Logger owner, Error Handler owner, Backend Connectivity owner, Interface Delivery owner, Session/Core owner
- **Artifacts captured**: this spec; cohort-stage notes for `cohort-1` and `cohort-2`; activity log updates for Patterns 1 & 2

## Stage 4 Readiness Snapshot

### Pattern 1 — Logger Consolidation

- **Lanes 4a–4h** all `[x]`:
  - Backend router + dynamic command router consolidated onto scoped logger shims (`tmp/consolidation-pattern1-stage4-lane4a-20251014T125623Z.log`, `logs/consolidation/pattern-1/lane-4b-20251014T125351Z.log`).
  - CLI adapters + abstractions redirected through injected logger emitters while preserving stdout UX (`logs/pattern-1-lane-4c-jest.txt`, `logs/pattern-1-lane-4d-jest.log`, `artifacts/consolidation/pattern-1/lane-4e-20251014T130215Z.log`).
  - Terminal UI, session manager, adapter registry, and templum core migrated to logger helpers with scoped channels (`logs/consolidation/pattern-1/lane-4f-20251014T130558Z.log`, `logs/consolidation/pattern-1/lane-4g-20251014T130541Z.log`, `logs/consolidation/pattern-1/lane-4h-20251014T130237Z.log`).
- **Guardrails reaffirmed**: zero-knowledge backend registry preserved; CLI skin-only rendering flows untouched; DI remains injectable via `configureDisplayStack`.
- **Residuals**: Global coverage threshold warnings acknowledged for targeted jest-suite runs; to be rechecked during Stage 6 gating.

### Pattern 2 — Error Handler Consolidation

- **Lanes 4a–4c** `[x]` with evidence:
  - `src/backend/service-discovery.ts` + router fallbacks migrated to `ErrorHandler.handle` with scope metadata (`logs/consolidation/pattern-2/stage4a/rg-service-discovery.log`, `logs/consolidation/pattern-2/stage4a/jest-service-discovery.log`).
  - `src/backend/connection-factory.ts` wrapped IPC fallbacks via Error Handler (`logs/consolidation/pattern-2/stage4b/rg-connection-factory.log`, `logs/consolidation/pattern-2/stage4b/jest-connection-factory.log`).
  - `src/interfaces/cli-adapter-abstracted.ts` + adapter integration suite verified under Error Handler (`tmp/consolidation-pattern2-lane4c-rg.log`, `tmp/consolidation-pattern2-lane4c-tests.log`).
- **Guardrails reaffirmed**: zero-knowledge registry, existing timeout semantics, and logger DI remain intact; Haruspex/Phoenix contracts left untouched.
- **Residuals**: `tests/service-discovery/discovery-cache.integration.test.ts` absent — command logged, failure captured, and carried as Stage 5B follow-up to restore coverage.

## 2025-10-15 Alignment Refresh

- **Stage 4 guardrail validation**: Re-checked the guardrail artefacts from 2025-10-14 to ensure expected failures remain intact for Stage 5 rehearsals:
  - Pattern 1: `logs/consolidation/pattern-1/lane-4i-20251014T212738Z.log`, `logs/consolidation/pattern-1/lane-4j-20251014T212228Z.log`, `logs/consolidation/pattern-1/lane-4k-20251014T212716Z.log`.
  - Pattern 2: `tmp/consolidation-pattern2-lane4d-backend-connection-lifecycle.log`, `tmp/consolidation-pattern2-lane4e-guardrail.log`, `tmp/consolidation-pattern2-lane4f-guardrail-phase6-validation-cli.log`, `tmp/consolidation-pattern2-lane4g-guardrail.log`.
- **Stage 5B rehearsal commands** (execute with `node scripts/run-with-timeout.mjs --preset jest-suite -- …` unless otherwise noted):
  - Pattern 1:
    - Backend manual override guardrail: `npx jest src/tests/backend/manual-override-flow.test.ts src/tests/backend/manual-override-watcher.integration.test.ts src/tests/backend/comprehensive-backend-validation.test.ts`.
    - MCP harness guardrail: `npx jest tests/service-discovery/pty-mcp-server-test-harness.test.ts`.
    - VSCode adapter guardrail: `npx jest tests/interfaces/interface-adapter-integration.test.ts tests/interfaces/universal-interaction-manager.session.test.ts`.
  - Pattern 2:
    - Backend router guardrail: `npx jest src/tests/backend/backend-connection-lifecycle.test.ts src/tests/backend/comprehensive-backend-validation.test.ts src/tests/backend/generic-backend-integration.test.ts src/tests/backend/manual-override-flow.test.ts src/tests/backend/manual-override-watcher.integration.test.ts`.
    - Session/interface guardrail: `npx jest src/tests/core/templum-core-connection-events.test.ts src/tests/session/templum-universal-session-manager.test.ts tests/interfaces/interface-adapter-integration.test.ts`.
    - Phase6 CLI guardrail: `npm run test -- --runTestsByPath tests/scripts/phase6-validation-cli.test.ts`.
    - MCP guardrail: `npm run --prefix src/mcp-channel test -- --runTestsByPath tests/pty-manager.test.ts`.
- **Stage 5 planned surfaces** (seeded for Stage 5B execution):
  - Pattern 1: `src/backend/backend-dependency-resolver.ts`, `src/backend/backend-service-router.ts`, `src/cli-entry.ts`, `src/monitoring/cli-performance-monitor.ts`, `src/scripts/run-phase6-integration-validation.ts`, `src/extension.ts`, `src/interfaces/interface-adapter-registry.legacy.ts`.
  - Pattern 2: `src/backend/backend-dependency-resolver.ts`, `src/backend/backend-service-router.ts`, `src/backend/service-health-check.ts`, `src/interfaces/cli-adapter-abstracted.ts`, `src/interfaces/cli-adapter.ts`, `src/interfaces/cli-session-bridge.ts`, `src/interfaces/interface-adapter-registry.legacy.ts`, `src/interfaces/interface-adapter-registry.ts`, `src/interfaces/vscode-adapter.ts`, `src/interfaces/vscode-templum-webview.ts`, `src/session/templum-universal-session-manager.ts`, `scripts/check-tests.js`, `scripts/check-types.js`, `scripts/coverage-reality-check.js`, `scripts/run-comprehensive-backend-tests.js`, `scripts/run-phase6-full.js`, `scripts/run-with-timeout.mjs`, `scripts/test-health-monitor.js`, `scripts/mcp/minimal_terminal_bridge/server.py`, `src/mcp-channel/src/cli-mcp-server.ts`, `src/mcp-channel/src/enhanced-mcp-integration.ts`, `src/mcp-channel/src/event-listener-manager.ts`, `src/mcp-channel/src/health-monitor.ts`, `src/mcp-channel/src/lifecycle-coordinator.ts`, `src/mcp-channel/src/progressive-timeout-manager.ts`, `src/mcp-channel/src/pty-manager.ts`, `src/mcp-channel/src/service-registration.ts`.
- **Dependencies and follow-ups**:
  - Pattern 2 remains dependent on the reinstatement of `discovery-cache.integration.test.ts`; Stage 5B must either restore it or document a replacement guardrail.
  - Phase 6 telemetry updates still route through `observability-instrumentation.md`; Stage 5B commits touching telemetry must coordinate across both patterns.
  - Documentation sync remains queued for `progress.md`, `unified-session-layer.md`, and `manual-override-flow.md` once Stage 5B migrations close.

## Shared Dependencies Matrix

| Artefact / Scope | Owner | Patterns | Stage References | Notes |
| ---------------- | ----- | -------- | ---------------- | ----- |
| `src/backend/backend-service-router.ts` | Pattern 1 | 1 | 4a Logger, 4a (Error Handler prerequisites) | Logger shim + Error Handler wrap co-reside; manual override flow must stay schema-validated (`dev/tasks/manual-override-flow.md`). |
| `src/backend/service-discovery.ts` | Pattern 2 | 1,2 | 4a Error Handler, 4f Logger (session manager consumers) | Shared zero-knowledge guarantee; Error Handler scope metadata feeds logger contexts downstream. |
| `src/backend/connection-factory.ts` | Pattern 2 | 1,2 | 4b Error Handler, 4g Logger (adapter registry) | Maintain DI hooks for logger + error wrapper; coordinate with Haruspex spec if retry semantics change. |
| `src/interfaces/cli-adapter.ts` | Pattern 1 | 1 | 4c Logger | Public CLI output must remain skin-driven; Error Handler escalations surface via logger warn channel. |
| `src/interfaces/cli-adapter-abstracted.ts` | Pattern 1 | 1,2 | 4d Logger, 4c Error Handler | Shared adapter helper; ensure both utilities injected via constructor seams to avoid cross-cohort drift. |
| `src/interfaces/terminal-ui-components.ts` | Pattern 1 | 1 | 4e Logger | Terminal rendering must reference logger for non-UI diagnostics; keep formatter DI from display stack cohort. |
| `src/session/templum-universal-session-manager.ts` | Pattern 1 | 1,2 | 4f Logger | Session lifecycle events emit through logger + Error Handler; uphold unified-session-layer guardrails. |
| `src/core/adapter-registry.ts` / `src/core/templum-core.ts` | Pattern 1 | 1,2 | 4g/4h Logger, 4a Error Handler | Registry + core orchestration rely on Error Handler outcomes; keep telemetry ingestion aligned with `observability-instrumentation.md`. |
| `src/utils/logger.ts` & `src/utils/error-handler.ts` | Shared | 1,2 | Stage 2 suites | Must remain DI-first, no global singletons; Stage 5B to verify combined usage in shared modules. |
| `node scripts/run-with-timeout.mjs` presets | Shared | 1,2 | Stage 4 evidence, Stage 6 lanes | Continue using `jest-suite`, `jest-ci`, `phase6-validation` presets for reproducible logs; capture artefacts under `logs/consolidation/`. |
| `Templum/docs/current/progress.md`, `dev/tasks/unified-session-layer.md` | Shared | 1,2 | Stage 5 updates | Update once Stage 5B readiness recorded to broadcast cross-utility impacts. |

## Stage 6 Gating Checklist (for Stage 5B)

### Pattern 1 — Logger Consolidation

- **Lane 6a (Backend connectivity)**: `node scripts/run-with-timeout.mjs --preset jest-ci -- npm run test:ci` with log archived as `logs/consolidation/pattern-1/lane-6a-<timestamp>.log`; verify backend router + service discovery diagnostics remain structured.
- **Lane 6b (Interface delivery)**: same `jest-ci` wrapper with CLI focus notes; capture diffs in CLI adapter snapshots to ensure skin outputs unchanged.
- **Lane 6c (Session/core)**: `jest-ci` wrapper plus targeted `src/tests/session/templum-universal-session-manager.test.ts` if diagnostics regress; ensure adapter registry telemetry channels stay green.
- **Extras**: rerun targeted jest-suite commands per Stage 4 lanes when hotfixing to keep log baselines fresh.

### Pattern 2 — Error Handler Consolidation

- **Lane 6a (Regression & coverage)**:
  - `node scripts/run-with-timeout.mjs --preset jest-suite -- npm run test -- --runTestsByPath src/tests/utils/error-handler.test.ts`
  - `node scripts/run-with-timeout.mjs --preset jest-suite -- npm run test -- --runTestsByPath tests/backend/connection-factory.test.ts`
  - `node scripts/run-with-timeout.mjs --preset jest-ci -- npm run test:ci`
- **Lane 6b (Phase 6 connectivity)**:
  - `node scripts/run-with-timeout.mjs --preset phase6-validation -- npm run phase6-validation`
  - Ensure `.templum/services/` cleaned pre/post run; document log under `logs/consolidation/pattern-2/lane-6b-<timestamp>.log`.
- **Coverage gap**: recreate `tests/service-discovery/discovery-cache.integration.test.ts` (or equivalent) before marking Lane 6a ready; track evidence in plan + activity log.

## Follow-ups & Risks

- Restore the missing service discovery integration suite to validate Error Handler fallbacks (Pattern 2 Stage 5B owner).
- Monitor console coverage regressions while Logger helpers propagate; reopen Stage 3 if new clusters appear.
- Coordinate documentation updates (`progress.md`, `unified-session-layer.md`, `manual-override-flow.md`) once Stage 5B actions complete.
- Ensure telemetry alignment (`observability-instrumentation.md`) after session/core logger channels go live.

## Activity & References

- Pattern 1 Stage 4 logs: `tmp/consolidation-pattern1-stage4-lane4a-20251014T125623Z.log`, `logs/consolidation/pattern-1/lane-4b-20251014T125351Z.log`, `logs/pattern-1-lane-4d-jest.log`, `logs/consolidation/pattern-1/lane-4f-20251014T130558Z.log`, `logs/consolidation/pattern-1/lane-4g-20251014T130541Z.log`, `logs/consolidation/pattern-1/lane-4h-20251014T130237Z.log`.
- Pattern 2 Stage 4 logs: `logs/consolidation/pattern-2/stage4a/rg-service-discovery.log`, `logs/consolidation/pattern-2/stage4a/jest-service-discovery.log`, `logs/consolidation/pattern-2/stage4b/rg-connection-factory.log`, `logs/consolidation/pattern-2/stage4b/jest-connection-factory.log`, `tmp/consolidation-pattern2-lane4c-rg.log`, `tmp/consolidation-pattern2-lane4c-tests.log`.

## Approvals

- Pattern 1 owner — Codex `[x]` (2025-10-14T13:32:00Z)
- Pattern 2 owner — Codex `[x]` (2025-10-14T13:32:00Z)
- Backend connectivity representative — `[x]` (2025-10-14T13:30:00Z)
- Interface delivery representative — `[x]` (2025-10-14T13:30:00Z)
- Session/core representative — `[x]` (2025-10-14T13:30:00Z)

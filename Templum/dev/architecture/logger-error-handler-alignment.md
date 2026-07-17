# Cohort D — Stage 5A Alignment (Logger & Error Handler)

## Scope & Intent
- Patterns: 1 (Logger Consolidation), 2 (Error Handler Consolidation)
- Stage focus: Stage 5A cohort alignment for lanes 5a → 5b/6 hand-off
- Principle reminder: stay within the existing logger helpers (`createLogger`, `Logger.child`, `LoggerConfig`) and ErrorHandler seams (`ErrorHandler.scope`, `ErrorHandler.formatContext`) — no bespoke wrappers or additional DI fan-out beyond the Stage 3 inventory.

## Stage 4 Guardrail Snapshot (Revalidated 2025-10-18)
| Surface | Pattern 1 Guardrail | Pattern 2 Guardrail | Evidence Reviewed | Stage 6 Mirror |
| --- | --- | --- | --- | --- |
| Backend routers + manual override flows | Lane 4m baseline (`Templum/archive/dev-files/utility-migration/evidence/pattern-1/stage4/lane4m/lane-4m-20251018T192907Z.log`) | Lane 4d baseline (`Templum/archive/dev-files/utility-migration/evidence/pattern-2/stage5b/backend-guardrail-20251015T120254Z.log`; rerun `Templum/archive/dev-files/utility-migration/evidence/pattern-2/stage5b/guardrail-20251018T195433Z.log`) | Logs confirm expected console/error handler violations remain; presets untouched | 6h (runtime backend consolidation) |
| Session & interface adapters | Lane 4n baseline (console guardrail) | Lane 4i baseline (ErrorHandler scope guardrail) | Guardrail failure strings still match Stage 4 capture | 6i (interface/session runtime) |
| CLI / Phase6 entrypoints | Lane 4m command preset (`run-with-timeout` + phase6 CLI Jest) | Lane 4f command preset (CLI parser + phase6 CLI) | Commands remain valid; no new skips detected | 6e (CLI runtime) |
| MCP channel | Lane 4l guardrail (`visual-feedback-system.formatter.test.ts`) | Lane 4g guardrail (`pty-mcp-server-test-harness.test.ts`) | Shared MCP harness logs still present in registry snapshot | 6g (MCP runtime) |
| Logger utility | Lane 4o guardrail (`src/utils/__tests__/logger.test.ts`) | Shared via Error Handler structured logging coupling | Jest suite green; coverage threshold warnings unchanged | 6j (logger structured sinks) |

*Alignment check:* all guardrail commands were spot-checked against the registry snapshot to ensure search terms and planned files still match Stage 4 plan entries. No Stage 4 regressions surfaced during review.

## Shared Decisions & DI Seams (Stage 5B / Stage 6 contract)
- Logger adoption must continue to flow through `createLogger` and `Logger.child`. Stage 5B updates can adjust context strings but **must not introduce new global sinks or wrappers.**
- Error handling remains scoped via `ErrorHandler.scope(ErrorHandler.formatContext(...))`. Every Stage 6 lane should call `scope` once per runtime surface and derive child scopes via `child` when additional segmentation is required.
- Logger ↔ ErrorHandler integration: Stage 5B owners should route ErrorHandler metadata through logger payloads only via existing helper merge semantics — no manual spread of console payloads.
- Zero-knowledge backend registry remains mandatory. Any Stage 6 backend instrumentation should source connection details via `ServiceDiscovery`/`ConnectionFactory` APIs; loggers should receive context IDs, not concrete backend names.
- Dependency injection boundaries: keep logger and error-handler instances injected via existing adapter constructors/factories. No new singleton exports beyond `LoggerConfig.getConfiguration()` / `ErrorHandler.scope`.

## Shared Dependency Matrix
| Area | Responsible Stage 6 Lane | Inputs Required | Output Contract |
| --- | --- | --- | --- |
| Backend routing + manual override lifecycle | Pattern 1 lane 6h & Pattern 2 lane 6c | `backend-service-router`, `backend-dependency-resolver`, manual override watchers | Unified logger/error handler surface; confirms no raw `console.*` and scoped errors |
| Interface delivery (CLI + session) | Pattern 1 lane 6e + 6i, Pattern 2 lane 6e + 6i | CLI adapter, session manager, CLI entry script | All logging through helper; scope metadata matches `ErrorHandler.scope('session-manager')` form |
| MCP channel | Pattern 1 lane 6g, Pattern 2 lane 6g | MCP CLI bridge, PTY harness | Consolidated logger context `mcp-channel` with ErrorHandler scopes propagated |
| Logger utility sink | Pattern 1 lane 6j | Logger transport abstraction | Structured logging remains optional but guarded; ensures other patterns can plug transports without change |

## Alignment Notes for Stage 5B Owners
1. Stage 5B should start with a sweep of `console.` via `npm run consolidate -- sweep 1 --stage 5` (after spec adoption) to ensure only planned touchpoints remain.
2. Incorporate the Stage 4 guardrail command list into Stage 5B execution plans; rerun them post-migration to demonstrate guardrail flips from expected-fail → pass.
3. Documentation updates flow: once migrations land, update `Templum/docs/current/progress.md` and `Templum/dev/tasks/unified-session-layer.md` with the consolidated logger/error-handler story (per Mission-Critical priorities). Keep this file linked in notes until replacements are published.

## Risks & Follow-ups
- Coverage thresholds: historical Jest global coverage warnings remain; confirm Stage 6 runs account for this so guardrail output is interpreted correctly.
- Phase 6 harness stability: stage remains sensitive to open handles; ensure Stage 5B owners keep the existing cleanup hooks in CLI scripts intact when swapping logger calls.
- Any deviation from helpers (new wrappers, alternative transports) should be logged as a Stage 5 blocker before implementation.

## Evidence Commands (reviewed, not re-run)
- 2025-10-18: `node scripts/run-with-timeout.mjs --preset jest-suite -- npx jest src/tests/backend/backend-connection-lifecycle.test.ts src/tests/backend/comprehensive-backend-validation.test.ts src/tests/backend/generic-backend-integration.test.ts src/tests/backend/manual-override-flow.test.ts src/tests/backend/manual-override-watcher.integration.test.ts` → `Templum/archive/dev-files/utility-migration/evidence/pattern-2/stage5b/guardrail-20251018T195433Z.log`
- `node scripts/run-with-timeout.mjs --preset jest-suite -- npx jest src/tests/backend/comprehensive-backend-validation.test.ts tests/scripts/phase6-validation-cli.test.ts`
- `node scripts/run-with-timeout.mjs --preset jest-suite -- npx jest tests/service-discovery/pty-mcp-server-test-harness.test.ts`
- `node scripts/run-with-timeout.mjs --preset jest-suite -- npx jest src/utils/__tests__/logger.test.ts`
- `node scripts/run-with-timeout.mjs --preset jest-suite -- npx jest tests/interfaces/interface-adapter-integration.test.ts tests/interfaces/universal-interaction-manager.session.test.ts`

No new approvals required. Alignment ready for Stage 5B execution.

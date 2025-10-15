---
doc-type: operations-guide
title: Templum Testing Guide
tags: [templum, testing, qa]
status: current
last_updated: 2025-10-15
---

# Templum — Testing Guide

## 0. Purpose

- Provide a single reference for running, scoping, and troubleshooting Templum test suites.
- Capture environment prerequisites so contributors can execute the heavier integration checks without guesswork.
- Highlight long-running suites and known gotchas (ports, spawned processes, coverage configuration).

## 1. Environment Prerequisites

- **Node.js:** Use the active project baseline (Node.js 20.x LTS tested most recently). Earlier LTS versions ≥18 should work, but new work should validate on 20.x.
- **Dependencies:** Run `npm install` at `Templum/` before executing any scripts. For backend integration tests also run `npm install` in `Templum/examples/minimal-backend/` so the spawned demo service can boot.
- **Workspace layout:** Execute commands from the `Templum/` directory unless noted. Scripts assume relative paths within this package.
- **Free ports:** Keep `3001-3004` available; the comprehensive backend validation suite spawns local HTTP servers on those ports.
- **Service registry cleanup:** The example backend writes files to `<repo-root>/.templum/services`. The test suite now removes them automatically on shutdown, but manually delete the directory if a crash leaves stale entries.

## 2. Quick Command Reference

| Command                                                                                                                                                   | When to use                                                                     | Notes                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                                                                                                                                | Run the full Jest suite (unit, integration, e2e mocks)                          | Uses `jest.config.js`; default timeout 10 s per test via `tests/setup.ts`                                                                                                             |
| `npm run test:ci [-- <pattern>]`                                                                                                                          | CI-safe Jest run with leak guard                                                | Delegates to `scripts/run-jest-ci.mjs`; sets `CI=1`, `JEST_FORCE_EXIT=1`, adds `--runInBand --detectOpenHandles --forceExit`, and fails if `tests/globalTeardown.ts` reports active handles. The CLI re-runs the manual override suites inline so registry flows stay green. |
| `npm run test -- --runTestsByPath <path>`                                                                                                                 | Execute an individual test file                                                 | Example: `npm run test -- --runTestsByPath src/tests/backend/service-discovery.test.ts`                                                                                               |
| `node scripts/run-with-timeout.mjs --timeout 180000 -- npm test -- --runTestsByPath tests/session/unified-session-manager.integration.test.ts`             | Smoke the shared session manager wiring across interfaces                       | Uses the timeout wrapper so Jest can be killed cleanly if a listener leaks; mirrors the evidence recorded in the unified session task                                                   |
| `npm test -- --runTestsByPath tests/templum/universal-skin-system.test.ts tests/templum/skin-contract.integration.test.ts tests/interfaces/interface-adapter-integration.test.ts --runInBand --forceExit` | Contract enforcement + adapter regression bundle                                | Keeps the Ajv-backed validator and adapter rejection surfaces green; `--forceExit` avoids lingering handles once Jest reports success                                                 |
| `node scripts/run-with-timeout.mjs --preset jest-ci -- npx jest --config jest.guardrail-interface-adapter.config.js tests/interfaces/interface-adapter-integration.test.ts` | Interface adapter logging guardrail                                             | Uses the domain guardrail config to scope coverage to the adapter seam; attach the log to Pattern 1 lanes before marking Stage 6 complete.                                            |
| `npm run test:watch`                                                                                                                                      | Redrive targeted suites during development                                      | Honors Jest watch prompts; avoid for backend tests that spawn servers                                                                                                                 |
| `npm run test:coverage`                                                                                                                                   | Generate unit-suite coverage (developer feedback)                               | Uses `jest.config.js`, writes reports to `coverage/unit`; pair with `npm run coverage:governance` when you need enforced thresholds.                                                 |
| `npm run coverage:governance`                                                                                                                             | Enforce suite-specific coverage bands + aggregate governance                    | Runs unit (`jest.config.js`), backend (`jest.backend.config.js`), and e2e (`jest.e2e.config.js`) sequentially, merges summaries, enforces 75/65/70/75 · 60/55/60/60 · 45/40/45/45 suite bands with a 75/65/70/75 aggregate bar, and records history in `.coverage-history.json`. |
| `npx jest --config jest.backend.config.js`                                                                                                                | Run backend integration validation only                                         | Serial execution, 60 s per-test timeout, enables `detectOpenHandles`                                                                                                                  |
| `npm test -- --runTestsByPath src/tests/backend/comprehensive-backend-validation.test.ts --testNamePattern "Phase 0c" --runInBand --no-cache --forceExit` | Verify Pattern 11 helper lane quickly                                           | Runs only the Phase 0c CLI/observability fallback block; keep handy after editing serialization defaults or observability logging                                                     |
| `npm run phase6-health`                                                                                                                                   | Probe service readiness via the compiled Phase 6 harness                        | Rebuilds first; exits 0 when every mock/real service reports healthy (uses `report.status=passed`)                                                                                    |
| `npm run phase6-validation`                                                                                                                               | “Phase 6” orchestrated smoke validation (build + scripted integration harness)  | Rebuilds first; returns `status=skipped` (exit 0) when running against mocks—re-run with `-- --use-real-backends` for a true PASS                                                      |
| `npm run phase6-validation:full`                                                                                                                          | Full Phase 6 workflow with real backend processes                               | Starts minimal backend services automatically; significantly longer                                                                                                                   |
| `npm run check:tests`                                                                                                                                     | Lightweight health check used in pre-commit                                     | Runs Jest in CI mode to ensure suites are registered                                                                                                                                  |
| `node scripts/run-with-timeout.mjs --timeout <ms> -- <command…>`                                                                                          | Guard long-running suites / capture diagnostics                                 | Add `--log-file <path>` and `--heartbeat <ms>` to stream heartbeats and persisted output; signals propagate to the entire process group                                               |

### Timeout Wrapper Expectations

- Default to a 30 s timeout when wrapping commands with `scripts/run-with-timeout.mjs`.
- For the backend discovery/router bundle, start with  
  ``node scripts/run-with-timeout.mjs --timeout 30000 --log-file tmp/backend-suite.log -- npm test -- --runTestsByPath src/tests/backend/service-discovery.test.ts src/tests/backend/generic-backend-integration.test.ts src/tests/backend/backend-dependency-integration.test.ts --runInBand --detectOpenHandles --forceExit --no-cache``.
- Reset global mocks (notably `ConnectionFactory.create` and `global.fetch`) in `beforeEach`/`afterEach` to avoid leaving mocked sockets alive between runs; the backend suites show the pattern to follow.
- If the wrapped command is still running when the timeout expires, rerun with another 30 s added (30 s → 60 s → 90 s → 120 s) until either the command exits on its own (pass or fail) before the wrapper fires or you reach the 120 s ceiling.
- Treat reaching the 120 s cap without a natural exit as a likely leak that needs investigation.
- Record the final timeout alongside the command (evidence logs, PR notes) so future runs keep the same baseline.

### 2.1 CI leak guard & forced exit

- Prefer `npm run test:ci` (or `node scripts/run-jest-ci.mjs <pattern>`) for automation. The script pins `CI=1`, `JEST_FORCE_EXIT=1`, and adds `--runInBand --detectOpenHandles --forceExit` so the process terminates even if code forgets to `clearInterval` or `close()` resources.
- `tests/globalTeardown.ts` runs after every Jest invocation. It captures active handles/requests, prints a `why-is-node-running` dump, and fails the suite whenever anything besides stdio remains. When this fires, clean up timers or sockets in the relevant component (e.g., call `dispose()` in `afterEach`, stop health monitors, clear `AbortController` timeouts).
- The teardown now polls for up to ~750 ms (50 ms intervals) before declaring a leak, giving Jest workers and short-lived sockets time to settle. Any handles that survive that window are treated as real leaks and will still fail the run.
- Core infrastructure now tracks its own timers: `EnhancedStateManager`, `StatePersistence`, `CrossInterfaceSync`, `PCLBackendIntegrator`, and `TemplumBackendServiceRouter` register every `setInterval`/`setTimeout` and release them during `shutdown()/dispose()`. New code must follow the same pattern—use `AsyncUtils.createTimeout` / `createInterval` (or the router’s `scheduleTimeout`) so timers are unref’d and discoverable via `AsyncUtils.cleanup`.
- Backend integration suites reset `ConnectionFactory.create` and `global.fetch` in `beforeEach`/`afterEach`. When adding specs, copy that pattern to avoid leaving mocked sockets alive between tests; doing so keeps the timeout wrapper from surfacing false positives.
- When diagnosing leaks locally, run `node scripts/run-with-timeout.mjs --timeout 30000 -- node scripts/run-jest-ci.mjs adapter-registry`. The wrapper guarantees the command exits; the teardown output lists the constructor names (and socket endpoints) of anything left behind so you can target the culprit quickly.
- Tests should invoke `registry.dispose()` (or equivalent) in `afterEach` blocks. The core adapter-registry suite has been updated to dispose unconditionally; copy that pattern in new specs to avoid orphaned sockets from connection factories.
- When creating a new guardrail config, copy the `jest.guardrail-interface-adapter.config.js` pattern: extend `jest.config.js`, narrow `collectCoverageFrom` to the domain files, set a domain entry in `scripts/coverage-thresholds.js`, and document the config + lane linkage here. Keep configs per-domain (interface adapters, backend connectivity, skin-engine, etc.) so multiple lanes reuse the same preset rather than spawning one-off configs.

## 3. Suite Taxonomy

### 3.1 Unit & Module Tests

- **Location:** `src/**/?(*.)+(spec|test).ts` and `tests/**` (rooted by `jest.config.js`).
- **Scope:** Pure logic, adapters, and utility modules. Many rely on the global mocks defined in `tests/setup.ts` (e.g., VSCode API shims, console suppression).
- **Runtime:** Generally sub-second; parallelized by Jest. Failures here typically indicate behaviour regressions rather than environment issues.

### 3.2 Integration Suites

- **Service discovery & routing:** `src/tests/backend/service-discovery.test.ts` and related files exercise connection factories and registry flows with in-memory doubles.
- **CLI/adapter integration:** Lives under `src/tests/interfaces` and `src/tests/core`, using mocked transport layers.
- **Execution:** Included in `npm test`; rely on deterministic mocks so they remain fast.

### 3.3 Comprehensive Backend Validation (TASK-SKIN-007)

- **Entry point:** `src/tests/backend/comprehensive-backend-validation.test.ts`.
- **What it does:** Spawns minimal and “full” Node backends from `examples/minimal-backend`, loads real skin definitions, and drives routing/prioritisation paths end-to-end.
- **Runtime expectations:** Each spec allows 30 s, but in practice the suite completes in well under one minute when ports are free and dependencies installed. Anything beyond ~4 min suggests a hung child process or port conflict.
- **Process management:** The suite auto-registers signal handlers (SIGINT/SIGTERM/exit) to invoke `backendManager.stopAllBackends()`, ensuring spawned servers terminate even if Jest is interrupted. If a crash occurs before handlers attach, run `ps -eo pid,ppid,cmd | grep '[n]ode .*server\.js'` and kill leftovers, then clear `.templum/services`.
- **Phase 0c subset:** For quick verification of the serialization helper lane, run `npm test -- --runTestsByPath src/tests/backend/comprehensive-backend-validation.test.ts --testNamePattern "Phase 0c" --runInBand --no-cache --forceExit`. This isolates the CLI/observability fallback assertions added for Pattern 11 and exits immediately after they pass.
- **Phase 2 serialization lane:** The router specs now build `TemplumBackendServiceRouter` with `enableFileWatching: false` and `healthMonitoringEnabled: false`, and rely on the router’s `prioritizeBackendsTwoTier()` helper directly. This removes the old chokidar/timer leak that kept Jest alive, so the full suite (or `--testNamePattern "Pattern 11 Phase 2"`) should exit normally.
- **Phase 4 hang remediation (Pattern 11 Stage 3):** The MCP serialization spec (`src/tests/mcp/visual-feedback-system.serialization.test.ts`) now disposes its `VisualFeedbackSystem` instance after each run to detach the `process.stdout` resize listener and dashboard interval. The matching implementation gained a `dispose()` hook that `RealTimeMonitor.cleanup()` also calls, preventing orphaned handles that previously stalled Jest.
- **Targeted run:** Use `npx jest --config jest.backend.config.js` to isolate this suite with serial execution and extended timeouts.

### 3.4 E2E Mock Workflows

- **Location:** `tests/e2e/*.test.ts`.
- **Behaviour:** Drive the mock orchestrator (`src/testing/e2e-test-framework.ts`) through end-to-end scenarios without launching real interfaces. Useful for validating contract shape and workflow sequencing.
- **Runtime:** Seconds. Safe to include in watch mode.

### 3.5 Scripted Health Checks

- **Scripts:** `npm run phase6-health`, `npm run phase6-validation`, `npm run phase6-services`, and related commands execute the compiled Phase 6 harness to probe discovery, health monitoring, and service summaries.
- **Usage:** Gate longer refactors or verify backend availability before demos. Commands rebuild first; with the default mock backends they succeed but mark validation runs as `status=skipped`. Pass `-- --use-real-backends` (or invoke the `:full`/`:real` variants) when you need an actual PASS and real service telemetry.

### Timeout wrapper presets

- `node scripts/run-with-timeout.mjs --preset jest-ci --timeout 180000 -- npm run test:ci -- --runTestsByPath …` stops the wrapper once coverage governance prints `✅ Overall: PASSED`, while keeping the 180 s fallback if the summary never appears.
- `node scripts/run-with-timeout.mjs --preset phase6-validation --timeout 180000 -- npm run phase6-validation` exits as soon as `Phase6IntegrationValidationSuite: Validation complete.` hits stdout—handy for Stage 6 gating so the harness doesn’t linger on mock runs.
- Layer additional markers with `--exit-on-pattern "<string>"`; presets and manual patterns accumulate, so you can tailor composite pipelines without editing the script.
- Avoid presets for interactive commands (`npm run test:watch`, watch-mode Jest) because they repeatedly print `Ran all test suites.` and would be terminated immediately—stick with the pure timeout in those scenarios. (optional) Which preset pairs with the Stage 6 targeted CI sweep, and what line is it watching for?

## 4. Running Phase 6 Validations

1. Ensure `npm run build` succeeds (implicit for most commands, explicit prerequisite for `phase6-validation:full`).
2. If exercising real backends (`:full` or `:real` variants), install dependencies in each example backend and keep ports free.
3. Execute the desired script:
   - `npm run phase6-health` — reports `status=passed` when all configured services respond to health probes.
   - `npm run phase6-validation` — default pipeline with mocked backends; exits 0 with `status=skipped` (and an explanatory note) unless `--use-real-backends` is provided.
   - `npm run phase6-validation:full` — starts the real minimal backend and runs the extended scenario suite; equivalent to `npm run phase6-validation -- --use-real-backends --verbose`.
4. Inspect the generated reports:
   - `validation-reports/phase6-validation-*.{json,md,html}` contain the typed output (look for `report.status` instead of the deprecated readiness score). Even in mock mode the suite now records real timings, memory deltas, and interface-consistency measurements—expect the report to include those numbers alongside a `status=skipped` gate.
   - `backend-validation-results.json` and `execution-results-backend.json` capture additional pass/fail details for historical reasons.
   - Logs surface under `scripts/run-phase6-*` if a step fails.

Phase 6 scripts are longer-running (2–5 minutes depending on backend availability). Abort with `Ctrl+C` when needed; the backend validation suite’s signal handlers now tear down spawned servers automatically, but confirm no `node server.js` processes remain before rerunning. When only mocks are available, expect `phase6-validation` to finish quickly, emit populated metrics (e.g., workflow durations, cross-interface consistency), and mark the run as `status=skipped`; treat that as a sanity check rather than true coverage, and address any highlighted regressions before attempting a real-backend pass.

## 5. Troubleshooting & Tips

- **Detect open handles:** The global teardown already fails runs that leave timers, sockets, or requests alive and prints a `why-is-node-running` dump. Append `--detectOpenHandles` (or reuse `jest.backend.config.js`) during targeted debugging to grab stack traces for each handle.
- **Watchdog long runners:** Wrap suspicious commands with `node scripts/run-with-timeout.mjs --timeout 30000 --kill-after 5000 --heartbeat 5000 --log-file /tmp/backend-suite.log -- <command…>` to capture heartbeats and ensure signals propagate to hung children. When running the contract bundle, prefer the `--runInBand --forceExit` invocation above so Jest exits cleanly once the suites pass.
- **Schema debugging:** Set `TEMPLUM_SCHEMA_DEBUG=1` before running targeted Ajv suites to print diagnostic output from `validateSkinDefinition` when triaging schema failures.
- **WSL filesystem note:** Running tests from `/mnt/c` slows chokidar and inotify. Prefer cloning/moving the repo inside the WSL ext4 filesystem (e.g., `~/projects/VDL_Vault`) to avoid sluggish watchers; if you must stay on `/mnt/c`, keep file-watching features disabled in tests.
- **Port collisions:** If integration tests fail to start backends, run `lsof -i :3001-3004` to identify competing processes.
- **Service registry residue:** Delete `<repo-root>/.templum/services/*` if the suite crashes before removing registration files.
- **Selective debugging:** Combine `npm run test -- --runInBand --runTestsByPath <file>` with `DEBUG=templum:*` (or custom logs) to isolate slow specs.
- **Mock resets:** `tests/setup.ts` overrides `console.log/info/debug`; call `jest.spyOn(console, 'log')` within tests if you need to assert logged output.
- **Pre-commit guardrails:** Husky hooks execute `npm run check:types`, `npm run check:tests`, and `npm run test:health`. If they fail locally, address them before pushing to avoid CI churn.

For additional context on architecture and active milestones, see `docs/current/architecture-spec.md` and `docs/current/progress.md`.

## Current Utility Consolidation Blockers

- Pattern 11 Stage 4 validation surfaced two remaining follow-ups: `npm run phase6-services` still expects an explicit `start|stop|status` subcommand and exits 1 when invoked without one, and the Phase 6 harness intentionally reports `status=skipped` unless real backends are enabled. Serialization unit and targeted backend suites require `--runInBand --no-cache --forceExit` to avoid the teardown handle warnings emitted by `tests/globalTeardown.ts` until the open-socket cleanup lands.

## Recent Fixes & Diagnostics

- **Router prioritisation clean-up:** `TemplumBackendServiceRouter.prioritizeBackendsTwoTier()` now exposes the two-tier scoring logic used by tests and higher layers. The backend suite constructs the router with `enableFileWatching: false` and `healthMonitoringEnabled: false`, then calls the helper directly—avoiding the old `TemplumCore` instantiation and its persistent state-manager timers.
- **CLI/core serialization metadata:** Pattern 11 Phase 3 exercises now capture serialization metadata in both service registry writes and IPC responses. Check the `serializationMeta` blocks in `/tmp/templum-cli-*.json` when triaging failures; they include the originating context and warnings.
- **Watchdog workflow:** Use `node scripts/run-with-timeout.mjs --timeout 30000 --kill-after 5000 --heartbeat 5000 --log-file /tmp/backend-suite.log --cwd Templum -- npx jest --runInBand --runTestsByPath src/tests/backend/comprehensive-backend-validation.test.ts --testNamePattern "Pattern 11 Phase 2"` to gather heartbeat logs (and confirm signals are honoured) whenever the backend suite behaves unexpectedly.
- **Quieter router specs:** Phase 2 tests stub `console.error` while asserting serialization behaviour, so passing runs stay quiet. If you need to inspect the raw logs, remove the spy or set a breakpoint inside the spec.
- **Generic backend integration verification:** `npm test -- src/tests/backend/service-discovery.test.ts src/tests/backend/backend-dependency-integration.test.ts src/tests/backend/generic-backend-integration.test.ts` now serves as the regression bundle for multi-protocol auto-registration. The generic router specs stub `detectServiceCapabilities`, `getServiceVersion`, and `loadBackendSkin` to avoid real network calls while still exercising cache priming, command routing, and ConnectionFactory wiring.
- **Manual override watcher flow:** `npm test -- --runTestsByPath src/tests/backend/manual-override-flow.test.ts src/tests/backend/manual-override-watcher.integration.test.ts --runInBand --no-cache --forceExit` validates both the direct apply/clear logic and the `.templum/services` file-watcher pathway. The watcher suite serialises manifests via `serializeServiceManifest`, stubs capability/version probes, and cleans up its temporary registry so it remains safe to run locally or in CI. This pair now runs as part of `npm run test:ci` (see `package.json`) so CI always guards the manual override path.
- **Phase 6 services (real backends):** Run `npm run phase6-services -- start --use-real-backends` when partner builds are ready. For this build, live services are deferred post-MVP; track re-enablement under `dev/tasks/haruspex-integration.md` and `docs/target/post-mvp-progress.md`. Logs (once enabled) land in `dist/src/tests/integration-validation-framework.js` and surface as `[Service start failed]` in the CLI if a backend misbehaves.
- **Logger guardrail (Pattern 1 Stage 4 lane 4j):** Run `node scripts/run-with-timeout.mjs --preset jest-suite --log-file logs/consolidation/pattern-1/lane-4j-20251014T212228Z.log -- npx jest tests/service-discovery/pty-mcp-server-test-harness.test.ts` to reproduce the intentional failure (`Expected: 0 Received: 128` console invocations). Keep the log attached to Stage 6e so the CLI/Phase 6 migration owners can rerun the guardrail after replacing raw `console.*`.

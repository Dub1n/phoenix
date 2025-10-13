# Consolidation Schedule (Generated)

Generated at 2025-10-13T13:22:42Z.

| Pa  | Ta  | St  | De               | Ti    | Focus                                                                                        |
| --- | --- | --- | ---------------- | ----- | -------------------------------------------------------------------------------------------- |
|     |     |     |                  |       | `{x}`                                                                                        |
| 2   | 1   | [x] | -                | --:-- | Inventory and scope alignment for Error Handler Consolidation                                |
| 2   | 2   | [x] | -                | --:-- | Test-first utility updates across Error Handler Consolidation                                |
| 2   | 3   | [x] | -                | --:-- | Migration orchestration plan for Error Handler Consolidation                                 |
| 3   | 1   | [x] | -                | --:-- | Inventory and scope alignment for Async Utils Consolidation                                  |
| 3   | 2   | [x] | -                | --:-- | Test-first utility updates across Async Utils Consolidation                                  |
| 3   | 3   | [x] | -                | --:-- | Migration orchestration plan for Async Utils Consolidation                                   |
| 3   | 4a  | [x] | -                | --:-- | Baseline backend router + lifecycle gating                                                   |
| 3   | 4b  | [x] | 3:4d             | 00:15 | Hybrid validation suite baseline                                                             |
| 3   | 4c  | [x] | 3:4e             | 00:01 | Phase 6 health/cleanup baseline                                                              |
| 3   | 4d  | [x] | -                | 04:28 | External fix for hybrid validation MCP fallbacks                                             |
| 3   | 4e  | [x] | -                | 00:10 | Phase6 health TypeScript remediation                                                         |
| 3   | 5B  | [x] | -                | 00:29 | Cohort gating readiness for Async Utils Consolidation                                        |
| 3   | 6a  | [x] | -                | 00:17 | Backend service router lifecycle timers                                                      |
| 3   | 6b  | [x] | 7:6              | 00:24 | Connection factory + discovery timers                                                        |
| 3   | 6c  | [x] | 7:6              | 00:01 | Validation + session timer consolidation                                                     |
| 3   | 6d  | [x] | 7:7              | 00:07 | Interface adapters + CLI timers                                                              |
| 3   | 6e  | [x] | -                | 00:30 | State/core/CLI timer sweep & harness cleanup                                                 |
| 3   | 6f  | [x] | -                | 00:14 | State + risk + shared utilities timer migration                                              |
| 3   | 6g  | [x] | -                | 00:10 | Core orchestrator + extension + E2E harness timer migration                                  |
| 3   | 6h  | [x] | -                | 00:17 | MCP channel + integration harness timer migration                                            |
| 3   | 6i  | [x] | -                | 00:14 | Test suites timer migration (unit + integration)                                             |
| 3   | 6o  | [x] | -                | 00:01 | CLI helper scripts managed timer migration                                                   |
| 4   | 1   | [x] | -                | 00:22 | Inventory and scope alignment for Event Utils Consolidation                                  |
| 4   | 2   | [x] | -                | 00:09 | Test-first utility updates across Event Utils Consolidation                                  |
| 4   | 3   | [x] | -                | 00:08 | Migration orchestration plan for Event Utils Consolidation                                   |
| 4   | 4a  | [x] | -                | 00:14 | Interfaces/Adapters migrate to EventUtils typed bus (CLI, VSCode, universal adapters)        |
| 4   | 4b  | [x] | -                | 01:07 | Session orchestrators migrate to createTypedEmitter + forward flow                           |
| 4   | 4c  | [x] | -                | 00:18 | Observability/Resilience emitters wrap EventUtils batchSubscribe+forward                     |
| 4   | 4d  | [x] | -                | 00:09 | Skin engine renders via waitForEvent + scoped cleanup                                        |
| 4   | 4e  | [x] | -                | 00:01 | Test harness + validation suites adopt EventUtils waitForEvent/batchSubscribe                |
| 4   | 5B  | [x] | -                | 00:05 | Cohort gating readiness for Event Utils Consolidation                                        |
| 4   | 6a  | [x] | -                | 00:30 | Backend connectivity validates EventUtils adoption across ServiceDiscovery/ConnectionFactory |
| 4   | 6b  | [x] | -                | 00:01 | Interface Delivery release validation for EventUtils-backed adapters                         |
| 4   | 6c  | [x] | -                | 00:01 | Observability/Resilience telemetry mirror validates EventUtils migration                     |
| 4   | 6d  | [x] | -                | 00:01 | Validation harness + cross-interface readiness sign-off                                      |
| 4   | 6e  | [x] | -                | 00:53 | Flush backend/core emitters to EventUtils typed bus                                          |
| 4   | 6f  | [x] | -                | 00:27 | Complete interface/rendering EventUtils adoption                                             |
| 4   | 6g  | [x] | -                | 00:25 | Audit tests/MCP channel for EventUtils compliance                                            |
| 4   | 6h  | [x] | 4:6e             | 00:54 | Migrate core/state emitters to typed EventUtils bus                                          |
| 4   | 6o  | [x] | -                | 00:08 | Realign Templum Core initialization flows with typed event fixtures                          |
| 4   | 6p  | [x] | -                | 00:15 | Stabilize interface adapter registry teardown after EventUtils migration                     |
| 5   | 1   | [x] | -                | --:-- | Inventory and scope alignment for Display Utils                                              |
| 5   | 2   | [x] | -                | --:-- | Test-first utility updates across Display Utils                                              |
| 5   | 3   | [x] | -                | --:-- | Migration orchestration plan for Display Utils                                               |
| 5   | 4a  | [x] | -                | --:-- | Service ordering regression harness                                                          |
| 5   | 4b  | [x] | -                | --:-- | CLI layout validation updates                                                                |
| 5   | 4c  | [x] | -                | --:-- | Formatter/window coordination                                                                |
| 5   | 5B  | [x] | -                | --:-- | Cohort gating readiness for Display Utils                                                    |
| 5   | 6a  | [x] | -                | --:-- | Validate backend footprint and run consolidated backend test harness.                        |
| 5   | 6b  | [x] | 5:5B             | --:-- | Migrate service-ordering-manager to DisplayUtils orderings and refresh related tests.        |
| 5   | 6c  | [x] | 6:5B, 7:5B       | --:-- | Centralise interface/navigation layout logic on DisplayUtils calculator.                     |
| 5   | 6d  | [x] | 6:6c             | --:-- | Audit shared utilities and documentation alignment for DisplayUtils DI seams.                |
| 5   | 7   | [x] | -                | --:-- | Final verification and wrap-up for Display Utils                                             |
| 6   | 1   | [x] | -                | --:-- | Inventory and scope alignment for Window Utils Consolidation                                 |
| 6   | 2   | [x] | -                | --:-- | Test-first utility updates across Window Utils Consolidation                                 |
| 6   | 3   | [x] | -                | --:-- | Migration orchestration plan for Window Utils Consolidation                                  |
| 6   | 4a  | [x] | -                | --:-- | Formatter provider finalisation                                                              |
| 6   | 4b  | [x] | -                | --:-- | Test harness upgrades                                                                        |
| 6   | 4c  | [x] | -                | --:-- | Theme/Display coordination                                                                   |
| 6   | 5B  | [x] | -                | --:-- | Cohort gating readiness for Window Utils Consolidation                                       |
| 6   | 6a  | [x] | -                | --:-- | CLI adapter & entrypoint migration                                                           |
| 6   | 6b  | [x] | -                | --:-- | Terminal UI components & rendering                                                           |
| 6   | 6c  | [x] | -                | --:-- | Navigation & compatibility surfaces                                                          |
| 6   | 6d  | [x] | -                | --:-- | MCP channel & observability                                                                  |
| 6   | 7   | [x] | -                | --:-- | Final verification and wrap-up for Window Utils Consolidation                                |
| 7   | 1   | [x] | -                | --:-- | Inventory and scope alignment for Terminal Formatter Consolidation                           |
| 7   | 2   | [x] | -                | --:-- | Test-first utility updates across Terminal Formatter Consolidation                           |
| 7   | 3   | [x] | -                | --:-- | Migration orchestration plan for Terminal Formatter Consolidation                            |
| 7   | 4a  | [x] | -                | --:-- | Formatter/provider alignment                                                                 |
| 7   | 4b  | [x] | -                | --:-- | Theme/window coordination                                                                    |
| 7   | 4c  | [x] | -                | --:-- | CLI regression harness                                                                       |
| 7   | 5B  | [x] | -                | --:-- | Cohort gating readiness for Terminal Formatter Consolidation                                 |
| 7   | 6a  | [x] | -                | --:-- | Window/layout engine migration                                                               |
| 7   | 6b  | [x] | -                | --:-- | Theme application surfaces                                                                   |
| 7   | 6c  | [x] | -                | --:-- | CLI & menu components                                                                        |
| 7   | 6d  | [x] | -                | --:-- | MCP/observability windows                                                                    |
| 7   | 7   | [x] | -                | --:-- | Final verification and wrap-up for Terminal Formatter Consolidation                          |
| 10  | 1   | [x] | -                | --:-- | Inventory and scope alignment for Type Guards Consolidation                                  |
| 10  | 2   | [x] | -                | --:-- | Test-first utility updates across Type Guards Consolidation                                  |
| 10  | 3   | [x] | -                | --:-- | Migration orchestration plan for Type Guards Consolidation                                   |
| 10  | 4a  | [x] | -                | --:-- | Helper implementations                                                                       |
| 10  | 4b  | [x] | -                | --:-- | Jest validation                                                                              |
| 10  | 4c  | [x] | -                | --:-- | Coordination snapshot                                                                        |
| 10  | 5B  | [x] | -                | --:-- | Cohort gating readiness for Type Guards Consolidation                                        |
| 11  | 1   | [x] | -                | --:-- | Inventory and scope alignment for Serialization Utils Consolidation                          |
| 11  | 2   | [x] | -                | --:-- | Test-first utility updates across Serialization Utils Consolidation                          |
| 11  | 3   | [x] | -                | --:-- | Migration orchestration plan for Serialization Utils Consolidation                           |
| 11  | 4a  | [x] | -                | --:-- | Schema & default groundwork                                                                  |
| 11  | 4b  | [x] | -                | --:-- | Logging bridge validation                                                                    |
| 11  | 4c  | [x] | -                | --:-- | CLI & observability fallbacks                                                                |
| 11  | 5B  | [x] | -                | --:-- | Cohort gating readiness for Serialization Utils Consolidation                                |
| 12  | 1   | [x] | -                | --:-- | Inventory and scope alignment for String Utils Consolidation                                 |
| 12  | 2   | [x] | -                | --:-- | Test-first utility updates across String Utils Consolidation                                 |
| 12  | 3   | [x] | -                | --:-- | Migration orchestration plan for String Utils Consolidation                                  |
| 12  | 4a  | [x] | -                | --:-- | Helper finalisation                                                                          |
| 12  | 4b  | [x] | -                | --:-- | Build & navigation remediation                                                               |
| 12  | 4c  | [x] | -                | --:-- | Navigation prep                                                                              |
| 12  | 5B  | [x] | -                | --:-- | Cohort gating readiness for String Utils Consolidation                                       |
| 999 | 1   | [x] | -                | --:-- | Inventory and scope alignment for CLI Stress Pattern                                         |
| 999 | 2   | [x] | -                | --:-- | Test-first utility updates across CLI Stress Pattern                                         |
| 999 | 3   | [x] | -                | --:-- | Migration orchestration plan for CLI Stress Pattern                                          |
| 999 | 4a  | [x] | -                | --:-- | Prototype guardrail alignment for Stage 4                                                    |
| C   | 5A  | [x] | -                | --:-- | Stage 5A alignment for Display Stack Refresh Cohort                                          |
| C   | 5A  | [x] | -                | --:-- | Stage 5A alignment for Type Guard Alignment Cohort                                           |
| C   | 5A  | [x] | -                | 00:03 | Stage 5A alignment for Cohort 3+4                                                            |
|     |     |     |                  |       | `{0}`                                                                                        |
| 1   | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Logger Consolidation                                       |
| 8   | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Theme Utils Consolidation                                  |
| 9   | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Validator Consolidation                                    |
| 13  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Path Utils Consolidation                                   |
| 14  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Config Utils Consolidation                                 |
| 15  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Cache Utils Consolidation                                  |
| 16  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Performance Utils Consolidation                            |
| 17  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Registry Utils Consolidation                               |
| 18  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Factory Utils Consolidation                                |
| 19  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Resilience Utils Consolidation                             |
| 20  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Navigation Utils Consolidation                             |
| 21  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Protocol Utils Consolidation                               |
| 22  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Service Utils Consolidation                                |
| 23  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Test Utils Consolidation                                   |
| 24  | 1   | [ ] | -                | --:-- | Inventory and scope alignment for Debug Utils Consolidation                                  |
| 2   | 4a  | [ ] | 3:2              | --:-- | Backend core migration                                                                       |
| 2   | 4b  | [ ] | -                | --:-- | Connectivity & IPC migration                                                                 |
| 2   | 4c  | [ ] | -                | --:-- | Interface & skin adapter migration                                                           |
| 999 | 4b  | [ ] | -                | --:-- | Backfill missing evidence for prerequisites                                                  |
| 4   | 6k  | [ ] | -                | --:-- | Align core/state test suites with EventDrivenComponent and update typed event mocks          |
| 4   | 6n  | [ ] | 4:6o, 4:6p       | --:-- | Restore repo TypeScript build/test parity so Stage 6 gating battery passes                   |
| 3   | 7   | [~] | -                | --:-- | Final verification and wrap-up for Async Utils Consolidation                                 |
| 10  | 7   | [ ] | -                | --:-- | Final verification and wrap-up for Type Guards Consolidation                                 |
| 11  | 7   | [ ] | -                | --:-- | Final verification and wrap-up for Serialization Utils Consolidation                         |
| 12  | 7   | [ ] | -                | --:-- | Final verification and wrap-up for String Utils Consolidation                                |
|     |     |     |                  |       | `{1}`                                                                                        |
| 4   | 6j  | [?] | 4:6e, 4:6h       | --:-- | Migrate validation/observability/risk emitters to typed EventUtils bus                       |
| 4   | 6l  | [?] | -                | --:-- | Migrate residual adapters/observability/risk emitters to EventDrivenComponent                |
|     |     |     |                  |       | `{2}`                                                                                        |
| 2   | 5B  | [ ] | -                | --:-- | Cohort gating readiness for Error Handler Consolidation                                      |
|     |     |     |                  |       | `{4}`                                                                                        |
| 1   | 2   | [?] | -                | --:-- | Test-first utility updates across Logger Consolidation                                       |
| 8   | 2   | [?] | -                | --:-- | Test-first utility updates across Theme Utils Consolidation                                  |
| 9   | 2   | [?] | -                | --:-- | Test-first utility updates across Validator Consolidation                                    |
| 13  | 2   | [?] | -                | --:-- | Test-first utility updates across Path Utils Consolidation                                   |
| 14  | 2   | [?] | -                | --:-- | Test-first utility updates across Config Utils Consolidation                                 |
| 15  | 2   | [?] | -                | --:-- | Test-first utility updates across Cache Utils Consolidation                                  |
| 16  | 2   | [?] | -                | --:-- | Test-first utility updates across Performance Utils Consolidation                            |
| 17  | 2   | [?] | -                | --:-- | Test-first utility updates across Registry Utils Consolidation                               |
| 18  | 2   | [?] | -                | --:-- | Test-first utility updates across Factory Utils Consolidation                                |
| 19  | 2   | [?] | -                | --:-- | Test-first utility updates across Resilience Utils Consolidation                             |
| 20  | 2   | [?] | -                | --:-- | Test-first utility updates across Navigation Utils Consolidation                             |
| 21  | 2   | [?] | -                | --:-- | Test-first utility updates across Protocol Utils Consolidation                               |
| 22  | 2   | [?] | -                | --:-- | Test-first utility updates across Service Utils Consolidation                                |
| 23  | 2   | [?] | -                | --:-- | Test-first utility updates across Test Utils Consolidation                                   |
| 24  | 2   | [?] | -                | --:-- | Test-first utility updates across Debug Utils Consolidation                                  |
| 2   | 6a  | [?] | -                | --:-- | Regression & coverage validation                                                             |
| 2   | 6b  | [?] | -                | --:-- | Phase 6 connectivity validation                                                              |
| 4   | 6i  | [?] | 4:6e, 4:6h, 4:6n | --:-- | Migrate backend and registry emitters to typed EventUtils bus                                |
|     |     |     |                  |       | `{5}`                                                                                        |
| 1   | 3   | [?] | -                | --:-- | Migration orchestration plan for Logger Consolidation                                        |
| 8   | 3   | [?] | -                | --:-- | Migration orchestration plan for Theme Utils Consolidation                                   |
| 9   | 3   | [?] | -                | --:-- | Migration orchestration plan for Validator Consolidation                                     |
| 13  | 3   | [?] | -                | --:-- | Migration orchestration plan for Path Utils Consolidation                                    |
| 14  | 3   | [?] | -                | --:-- | Migration orchestration plan for Config Utils Consolidation                                  |
| 15  | 3   | [?] | -                | --:-- | Migration orchestration plan for Cache Utils Consolidation                                   |
| 16  | 3   | [?] | -                | --:-- | Migration orchestration plan for Performance Utils Consolidation                             |
| 17  | 3   | [?] | -                | --:-- | Migration orchestration plan for Registry Utils Consolidation                                |
| 18  | 3   | [?] | -                | --:-- | Migration orchestration plan for Factory Utils Consolidation                                 |
| 19  | 3   | [?] | -                | --:-- | Migration orchestration plan for Resilience Utils Consolidation                              |
| 20  | 3   | [?] | -                | --:-- | Migration orchestration plan for Navigation Utils Consolidation                              |
| 21  | 3   | [?] | -                | --:-- | Migration orchestration plan for Protocol Utils Consolidation                                |
| 22  | 3   | [?] | -                | --:-- | Migration orchestration plan for Service Utils Consolidation                                 |
| 23  | 3   | [?] | -                | --:-- | Migration orchestration plan for Test Utils Consolidation                                    |
| 24  | 3   | [?] | -                | --:-- | Migration orchestration plan for Debug Utils Consolidation                                   |
| 4   | 6m  | [?] | 4:6l, 4:6i, 4:6j | --:-- | Stabilize telemetry/phase6 gating after EventUtils migration                                 |
| 2   | 7   | [?] | -                | --:-- | Final verification and wrap-up for Error Handler Consolidation                               |
|     |     |     |                  |       | `{6}`                                                                                        |
| 1   | 5B  | [?] | -                | --:-- | Cohort gating readiness for Logger Consolidation                                             |
| 8   | 5B  | [?] | -                | --:-- | Cohort gating readiness for Theme Utils Consolidation                                        |
| 9   | 5B  | [?] | -                | --:-- | Cohort gating readiness for Validator Consolidation                                          |
| 13  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Path Utils Consolidation                                         |
| 14  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Config Utils Consolidation                                       |
| 15  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Cache Utils Consolidation                                        |
| 16  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Performance Utils Consolidation                                  |
| 17  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Registry Utils Consolidation                                     |
| 18  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Factory Utils Consolidation                                      |
| 19  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Resilience Utils Consolidation                                   |
| 20  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Navigation Utils Consolidation                                   |
| 21  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Protocol Utils Consolidation                                     |
| 22  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Service Utils Consolidation                                      |
| 23  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Test Utils Consolidation                                         |
| 24  | 5B  | [?] | -                | --:-- | Cohort gating readiness for Debug Utils Consolidation                                        |
| 4   | 7   | [?] | -                | --:-- | Final verification and wrap-up for Event Utils Consolidation                                 |
|     |     |     |                  |       | `{7}`                                                                                        |
| 1   | 7   | [?] | -                | --:-- | Final verification and wrap-up for Logger Consolidation                                      |
| 8   | 7   | [?] | -                | --:-- | Final verification and wrap-up for Theme Utils Consolidation                                 |
| 9   | 7   | [?] | -                | --:-- | Final verification and wrap-up for Validator Consolidation                                   |
| 13  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Path Utils Consolidation                                  |
| 14  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Config Utils Consolidation                                |
| 15  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Cache Utils Consolidation                                 |
| 16  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Performance Utils Consolidation                           |
| 17  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Registry Utils Consolidation                              |
| 18  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Factory Utils Consolidation                               |
| 19  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Resilience Utils Consolidation                            |
| 20  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Navigation Utils Consolidation                            |
| 21  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Protocol Utils Consolidation                              |
| 22  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Service Utils Consolidation                               |
| 23  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Test Utils Consolidation                                  |
| 24  | 7   | [?] | -                | --:-- | Final verification and wrap-up for Debug Utils Consolidation                                 |
|     |     |     |                  |       | `{8}`                                                                                        |
| 999 | 5B  | [?] | -                | --:-- | Cohort gating readiness for CLI Stress Pattern                                               |
|     |     |     |                  |       | `{9}`                                                                                        |
| 999 | 7   | [?] | -                | --:-- | Final verification and wrap-up for CLI Stress Pattern                                        |
|     |     |     |                  |       | `{10}`                                                                                       |
| 999 | 6a  | [?] | -                | --:-- | Trial migration lane to simulate execution edge-cases                                        |

## Notes

### Pattern 1

- [5B] 2025-10-09T15:51:23Z
    Seed assignment
- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Core Infrastructure Utilities (CRITICAL Priority)
    Pattern doc: Templum/dev/patterns/utilities/core/logger.md
    Utility focus: (Templum/src/utils/logger.ts)
    Problem: 2,810 console.log/warn/error calls with inconsistent formatting
    API intent: log.info('message') - Auto-context detection, structured output
    Impact: ~1,500-2,000 lines removable, consistent logging across codebase
    Starter files:
    • src/backend/backend-service-router.ts (315 console calls)
    • src/backend/service-discovery.ts (287 console calls)
    • src/backend/connection-factory.ts (156 console calls)
    • src/backend/dynamic-command-router.ts (89 console calls)
    • src/interfaces/cli-adapter.ts (198 console calls)

### Pattern 2

- [3] 2025-10-08T01:04:27Z — Codex
    Stage 3 orchestration plan:
    Stage 4 lanes:
    - 4a Backend core (Codex) — migrate backend-service-router + service-discovery to ErrorHandler.wrap/handleAsync once async-utils consolidation (Pattern 3 Stage 2) lands; keep zero-knowledge registry guardrails.
    - 4b Connectivity + IPC (Codex partnering with Haruspex owners) — refactor connection-factory + IPC client to central error utilities, gated on Haruspex spec sync.
    - 4c Interface + skin adapters (Interface guild) — roll CLI/VSCode adapters + universal-skin-engine onto ErrorHandler after backend lanes verified; coordinate with Skin Engine migration notes.
    Stage 6 validation lanes:
    - 6a Regression + coverage (QA automation) — execute targeted Jest runs from Stage 2 plan + npm run test:ci, capture tmp/error-handler-stage2.log and coverage deltas.
    - 6b Phase 6 connectivity (Backend validation squad) — run npm run phase6-validation with registry cleared, record evidence in utility plan + phase6 logs.
    Sequencing & dependencies: Run 4a → 4b → 4c to avoid adapter regressions; 4b contingent on Haruspex/Phoenix spec alignment; 6b waits for Pattern 3 async-utils retries to ship so timeout semantics match. Notify Pattern 3 owner if retry API changes. Coordination touchpoints recorded via stage-note updates + activity log entries.
- [2] 2025-10-08T00:59:42Z — Codex
    Stage 2 TDD plan:
    Suites: add new src/tests/utils/error-handler.test.ts covering normalizeError/handleAsync fallback + retry; extend tests/backend/connection-factory.test.ts to assert wrap() usage for IPC fallback; introduce integration harness in tests/service-discovery/discovery-cache.integration.test.ts to cover cached fallback path with ErrorHandler instrumentation; run npm run test -- --runTestsByPath src/tests/utils/error-handler.test.ts tests/backend/connection-factory.test.ts tests/service-discovery/discovery-cache.integration.test.ts plus npm run test:ci for regression.
    Guardrails: respect zero-knowledge registry (no backend-specific branches inside ErrorHandler); preserve existing timeout semantics from async-utils and ProbabilisticErrorHandler; ensure logger wiring remains DI-friendly for adapters.
    Coverage: target ≥85% statements/branches on src/utils/error-handler.ts and surface coverage delta in coverage/lcov-report/utils/error-handler.ts.html; capture Jest outputs under tmp/error-handler-stage2.log for Stage 3 handoff.
- [1] 2025-10-08T00:52:31Z — Codex
    Stage 1 discovery snapshot:
    Consumers: backend service router, service discovery layer, connection factory, skin engine, CLI/VSCode adapters, window system utilities; all rely on manual try/catch logging and ad-hoc createTemplumError wrappers.
    Commands: rg "catch \(" src/backend --stats (113 matches/10 files); rg "catch \(" src/interfaces --stats (121 matches/20 files); rg "catch \(" src/skin/universal-skin-engine.ts -n; rg "createTemplumError" src --stats (322 matches/39 files); rg "ProbabilisticErrorHandler" -n.
    Observations: fallback flows reimplement logging + timeout control (router/service discovery cache path, connection factory IPC timeouts, CLI orchestrator guard rails); console.\* logging dominates instead of structured logger; universal skin engine manually wraps rendering/compatibility errors before rethrowing.
    Guardrails: preserve zero-knowledge backend registry + cache fallback semantics; retain timeout + retry behaviour from async-utils/ProbabilisticErrorHandler; surface errors through structured logger (no swallowed telemetry); coordinate with Haruspex/Phoenix specs before touching connection factory or adapter seams.
    Next focus: prepare consolidation play for standard wrap()/handleAsync adoption starting with backend router + service discovery where fallbacks are already clustered.
- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Core Infrastructure Utilities (CRITICAL Priority)
    Pattern doc: Templum/dev/patterns/utilities/core/error-handler.md
    Utility focus: (Templum/src/utils/error-handler.ts)
    Problem: 695 catch blocks with repeated manual error wrapping
    API intent: await wrap(() => operation(), 'context') - One-line error handling
    Impact: ~400 catch blocks standardizable, consistent error patterns
    Starter files:
    • src/backend/backend-service-router.ts (87 catch blocks)
    • src/backend/service-discovery.ts (76 catch blocks)
    • src/backend/connection-factory.ts (54 catch blocks)
    • src/interfaces/cli-adapter-abstracted.ts (63 catch blocks)
    • src/skin/universal-skin-engine.ts (71 catch blocks)

### Pattern 3

- [7] 2025-10-13T12:54:02Z
    Reason: Stage 7 validation pending TypeScript build parity remediation after lane 6o migration; Required check: rerun npm run build, npm run phase6-validation, and npm run phase6-health once dev/tasks/typescript-build-parity.md closes.
- [7] 2025-10-13T10:24:56Z
    Reason: Phase 6 validation blocked by TypeScript build errors (19 diagnostics across service-health-check, CLI adapter, MCP channel, async-utils mocks); Required check: complete dev/tasks/typescript-build-parity.md then rerun npm run phase6-validation && npm run phase6-health to capture clean Stage 7 artefacts.
- [7] 2025-10-12T22:48:32Z
    Reason: Stage 7 reopened after the timer audit surfaced remaining manual setTimeout/setInterval usage; Stage 6 created temporary sweep lanes (6e–6i) to finish consolidation while lanes 6j/6k were mock collision tests only. Required check: with Stage 6 sweep lanes closed, rerun npm run consolidate -- sweep 3 --stage 7 and execute the Stage 7 async-utils validation battery (backend lifecycle/service discovery/validation/interface suites plus phase6 health/validation) before marking complete.
- [7] 2025-10-12T22:48:13Z
    Reason: Stage 7 reopened after the timer audit surfaced remaining manual setTimeout/setInterval usage; Stage 6 created temporary sweep lanes (6e–6i) to finish consolidation — test lanes 6j/6k can be ignored. Required check: with Stage 6 now complete, rerun
    > templum@1.0.0 consolidate
    > node dev/architecture/consolidation-scripts/cli-command-stub.mjs sweep 3 --stage 7
    Planned files for stage 7 on pattern 3 resolved to no non-markdown files; nothing to sweep. plus the Stage 7 async-utils validation battery to confirm the repo is timer-clean before marking complete.
- [7] 2025-10-12T22:36:13Z
    Reason: Stage 6 reopened after audit uncovered remaining manual setTimeout/setInterval usage and introduced sweep lanes (6e-6j); Stage 7 must wait for the migration sweep to finish. Required check: once lanes 6e-6j close, rerun `npm run consolidate -- sweep 3 --stage 7` plus the Stage 7 async-utils validation battery to confirm the repo is timer-clean before marking complete.
- [6] 2025-10-12T18:36:15Z
    6e: Added state/core/CLI sweep lane to eliminate remaining manual timers; run the cleanup sweep before promotion.
- [7] 2025-10-12T18:05:50Z
    Risks: Phase 6 validation runs still rely on mock services; schedule the live backend window per dev/tasks/phase6-validation-signal.md. Follow-ups: Coordinate with backend connectivity crew to capture real-service artefacts and confirm state sync warnings remain non-blocking.
- [5B] 2025-10-12T10:58:08Z
    2025-10-12: Executed Stage 6 gating battery for lane 6a via node scripts/run-with-timeout.mjs; backend lifecycle, manual override, and comprehensive validation suites passed (tmp/consolidation-pattern3-stage5-lane6a-20251012T105628Z.log). Hardened HTTP connection normalization and skin loading to accept direct skin payloads, and updated comprehensive backend validation spec to restore leak-proof teardown with run-with-timeout instructions.
- [4] 2025-10-10T14:29:59Z
    2025-10-10: Lane 4c complete. npm run phase6-health now succeeds post-TypeScript remediation; log tmp/consolidation-pattern3-lane4c-20251010T142938Z.log.
- [4] 2025-10-10T14:29:10Z
    2025-10-10: Lane 4e complete. TypeScript fixes across backend router/discovery/registry/session/skin modules; npm run build passes (tmp/phase6-health-build-20251010T142834Z.log). Phase6 health harness unblocked for lane 4c.
- [4] 2025-10-10T14:16:06Z
    2025-10-10: Lane 4b completed. Rebuilt reliability/performance/degradation/dashboard modules to satisfy V3C hybrid validation suite; tests green (tmp/consolidation-pattern3-lane4b-20251010T141541Z.log). Ready to move on once Phase6 health remediation (lane 4e) is staffed.
- [4] 2025-10-10T00:21:46Z — codex
    Lane 4b blocked: hybrid validation suite (src/tests/validation/hybrid-validation-system-v3c.test.ts) fails 25 specs with timeouts + fallback assertions; evidence tmp/consolidation-pattern3-lane4b-20251010T011558.log. Lane 4c blocked: npm run phase6-health fails during build with 12 TS errors (backend router/service discovery/adapter registry/session manager/skin validator); evidence tmp/consolidation-pattern3-lane4c-20251010T012112.log. Await AsyncUtils cleanup + upstream fixes before resuming Stage 4.
- [4] 2025-10-08T11:03:04Z
    Lane 4a evidence: jest backend lifecycle + manual override suites pass; log tmp/consolidation-pattern3-lane4a-20251008T120251.log; Risks: none identified
- [3] 2025-10-08T10:55:57Z — Codex
    Lane owners: 4a/6a Codex + Backend Connectivity crew; 4b/6c Validation team; 4c Release readiness (Phase6 harness) with support from Observability. Sequencing: complete Stage 4 lanes in order (4a → 4b → 4c) before claiming Stage 6. Stage 6 migration order locked to 6a (backend-service-router) → 6b (connection factory/discovery) → 6c (validation + session) → 6d (interface/CLI). Dependencies: 6b requires 6a green; 6c waits on 6b + Terminal Formatter Pattern 7 Stage 6 lanes; 6d depends on Pattern 7 Stage 7 close-out and AsyncUtils cleanup hooks wired in Stage 4c. Guardrails: reuse AsyncUtils.cleanup in each module’s shutdown path, retain zero-knowledge registry invariants, and coordinate with Haruspex integration before touching MCP timers.
- [2] 2025-10-08T01:03:56Z — Codex
    Tests: add src/tests/utils/async-utils.test.ts covering withTimeout rejection/cleanup, retry backoff+jitter toggles, debounce/throttle scheduling, createInterval stop+cleanup, and global cleanup() semantics; Commands: npm run test -- --runTestsByPath src/tests/utils/async-utils.test.ts --runInBand --no-cache; Guardrails: no production code changes unless tests expose gaps, avoid fake timers that mask real cleanup logic, ensure AsyncUtils logger spies remain stub-free.
- [1] 2025-10-08T00:54:03Z
    Orientation: reviewed pattern doc and src/utils/async-utils.ts to confirm existing API surface (retry, debounce, managed intervals) covers registry expectations; current registry counts are stale (rg shows 132 setTimeout + 35 setInterval entries across src). Consumers: backend/connection-factory.ts (5 setTimeout), backend/service-health-check.ts (3 setTimeout), backend/backend-service-router.ts (3 setTimeout + 2 setInterval), backend/pcl-backend-integration.ts (4 setTimeout + 2 setInterval), interfaces/cli-adapter-abstracted.ts (3 setTimeout), interfaces/navigation/exit-handler.ts (3 setTimeout), state/enhanced-state-synchronization.ts (2 setTimeout + 4 setInterval), validation/hybrid-validation-system-v3c.ts (13 setTimeout + 2 setInterval). Commands: rg -c "setTimeout" src | sort -t: -k2 -nr | head -n 15; rg -c "setInterval" src | sort -t: -k2 -nr | head -n 15; sed -n '1,200p' src/utils/async-utils.ts. Guardrails: Stage 2 must start with backend-service-router timers to stabilise lifecycle/health probes, reuse AsyncUtils.cleanup within existing shutdown handlers, and stage UI/validation migrations until Universal Skin + session timing specs settle.
- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Core Infrastructure Utilities (CRITICAL Priority)
    Pattern doc: Templum/dev/patterns/utilities/core/async-utils.md
    Utility focus: (Templum/src/utils/async-utils.ts)
    Problem: 316 setTimeout/setInterval calls with manual timeout management
    API intent: await timeout(promise, 5000) - Auto-cleanup, retry with backoff
    Impact: ~200 timeout calls consolidatable, reliable retry patterns
    Starter files:
    • src/backend/service-discovery.ts (43 timeout calls) (post-MVP)
    • src/backend/connection-factory.ts (38 timeout calls) (post-MVP)
    • src/backend/backend-service-router.ts (52 timeout calls) (MVP focus: lifecycle/health timers keeping Jest alive)
    • src/interfaces/terminal-ui-components.ts (29 timeout calls) (post-MVP)
    • src/core/templum-core.ts (34 timeout calls) (post-MVP)

### Pattern 4

- [7] 2025-10-12T16:30:24Z
    Risks: Phase 6 validation running with mocks; real backend window still pending coordination.; Follow-ups: Schedule PHASE6_RUN_REAL rerun with Backend Connectivity + Interface Delivery leads once service window confirmed; archive validation artefacts in activity log.
- [5B] 2025-10-12T12:39:03Z
    2025-10-12: Adjusted mock performance regression monitor to treat higher-is-better metrics (concurrency) correctly and accept improvements > baseline. phase6-validation rerun (log: tmp/consolidation/pattern-4-stage5/phase6-validation-after-mock-perf-adjust.log, report: validation-reports/phase6-validation-2025-10-12T12-38-55-983Z.md) now passes without mock-induced regression warnings.
- [5B] 2025-10-12T10:49:06Z
    2025-10-12: Updated mock cross-interface comparison to ignore interface-specific metadata and short-circuit scenarios; phase6-validation re-run (log: tmp/consolidation/pattern-4-stage5/phase6-validation-after-mock-normalized.log) now reports 100% cross-interface consistency while performance warnings remain due to mock baselines.
- [5B] 2025-10-12T10:32:34Z
    Guardrails: keep ServiceDiscovery/ConnectionFactory zero-knowledge and maintain typed EventUtils bus invariants while prepping Stage 6; Stage 6 gating battery: npm run phase6-validation, npm run phase6-health, npm run test -- --runTestsByPath src/tests/backend/backend-serialization-log.test.ts src/tests/backend/backend-connection-lifecycle.test.ts src/tests/backend/manual-override-flow.test.ts src/tests/backend/manual-override-watcher.integration.test.ts; Artefacts: sync Templum/docs/current/progress.md, dev/tasks/unified-session-layer.md, dev/tasks/connection-lifecycle-events.md once evidence captured; Approvals: Backend Connectivity + Interface Delivery leads to confirm gating logs before Stage 6 lane claims.
- [5B] 2025-10-12T10:20:31Z
    Stage 5A alignment completed; re-ran event-utils guardrail tests, confirmed adapter/session/telemetry/skin cleanup remains in place, and flagged Stage 6a to carry templum-core connection suite adapter mocks for leak prevention.
- [4] 2025-10-12T01:03:13Z
    Lane 4b: Session manager refactored onto EventUtils typed bus and tests hardened for clean shutdown; templum-core connection suite still requires adapter mocks during Stage 6 migration to avoid legacy CLI module leaks.
- [4] 2025-10-12T00:17:54Z
    Lane 4c: Observability + resilience emitters now wrap EventUtils batchSubscribe/forward (process mirror + scoped resilience bus) with cleanup-aware teardown; verified via npm run test -- --runTestsByPath src/tests/backend/backend-connection-lifecycle.test.ts src/tests/backend/backend-serialization-log.test.ts
- [4] 2025-10-12T00:12:41Z
    Lane 4d: Added waitForEvent-based cleanup for terminal UI components, registered process signal handlers via scoped EventUtils context, and captured formatter test evidence.
- [4] 2025-10-12T00:04:23Z
    Lane 4e: Executed manual override validation suites with EventUtils harness; manual-override flow + watcher tests passing, evidence logged at dev/architecture/evidence/pattern-4-lane-4e-validation-suites.md.
- [4] 2025-10-11T23:52:06Z
    Lane 4a: CLI + command adapters now emit via EventUtils typed bus with scoped cleanup; docs/tasks updated and menu-definition adapter suite logged at dev/architecture/evidence/pattern-4-lane-4a-menu-definition-adapter.test.md.
- [3] 2025-10-11T17:55:51Z — codex
    Guardrails: preserve zero-knowledge ServiceDiscovery/ConnectionFactory contracts, enforce event schema validation per manual-override-flow.md, reuse EventUtils waitForEvent/batchSubscribe patterns captured in Stage 2 tests, and document changes in docs/current/progress.md + dev/tasks/unified-session-layer.md when each lane lands.
- [3] 2025-10-11T17:55:46Z — codex
    Dependencies: lane deps encoded (6a waits on Stage 4 + lanes 4b/4c; 6b after 4a/4d; 6c after 4c; 6d after 4e + display-stack lanes). Cross-pattern: pair with Pattern 3 Async Utils for cleanupContext + timer reuse, Pattern 7 Terminal Formatter + Pattern 5 Display Utils for adapter/menu sync, and log Haruspex milestone handshakes before 4e/6d per milestone-01 playbook.
- [3] 2025-10-11T17:55:38Z — codex
    Sequencing: run Stage 4 lanes 4a→4b→4c→4d→4e so adapters publish typed maps before session/telemetry/renderer/harness swaps; Stage 6 executes 6a→6b→6c→6d with command evidence dropped in utility-consolidation-activity-log + docs/current/progress.md updates after each lane.
- [3] 2025-10-11T17:55:26Z — codex
    Lane owners: 4a Interface Delivery (Display Stack) w/ CLI+VSCode maintainers; 4b Session Core (Unified Session Layer) w/ Backend Connectivity pairing; 4c Observability & Resilience telemetry crew; 4d Skin Engine pod; 4e QA validation harness. Stage 6 lanes: 6a Backend Connectivity validation, 6b Interface Delivery release sign-off, 6c Observability telemetry verification, 6d QA harness close-out.
- [3] 2025-10-09T17:00:49Z — codex
    Stage 3 prep — Cohort guidance: Interfaces/Adapters to replace direct EventEmitter wiring with createScopedBus + typed maps, piggyback on src/tests/utils/event-utils.test.ts before adapter regressions; Orchestrators/Session Core to route session+state broadcast via createTypedEmitter + forward, align lifecycle cleanupContext use; Observability/Resilience to wrap telemetry emitters with batchSubscribe+forward for globalBus mirroring; Skin Engine to rely on waitForEvent for renderer readiness and scoped cleanup; Test Harness to standardize harness timers around waitForEvent/batchSubscribe and record scoped cleanup evidence.
- [2] 2025-10-09T16:52:09Z — codex
    Suites: npm test -- src/tests/utils/event-utils.test.ts; Guardrails: typed emitter binding, scoped context cleanup, forward/waitForEvent protections; Coverage: exercising batch subscribe and emit error handling under mocked logger/error-handler.
- [1] 2025-10-09T15:36:31Z
    Consumers: 70 modules bucketed via rg inventory; Commands: rg --stats 'EventEmitter' src; rg --files-with-matches 'EventEmitter' src; rg --files-with-matches 'EventEmitter' src | cut -d/ -f2 | sort | uniq -c; Priority clusters: Interfaces & adapters (15 modules across CLI/VSCode/universal adapters, Interface Delivery owners); Orchestrators & session/state engines (9 modules: universal interface/session managers, state sync, backend dependency router, Session Core owners); Observability & resilience monitors (6 modules: templum-observability-system, cli-performance-monitor, progressive timeout and resilience utils, Observability owners); Skin/render/rendering engines (4 modules: universal skin engines, renderer, Skin Engine owners); Test & harness coverage (22 modules: backend/service discovery, MCP channel utilities, tests folder, QA coordination). Guardrails: maintain typed emitter compatibility with EventUtils API, keep CLI/VSCode adapters stable, align orchestrator cleanup semantics with zero-knowledge registry, and coordinate observability hooks before altering global emitters.
- [1] 2025-10-09T15:16:12Z
    Consumers: 70 modules (backend=8, interfaces=15, mcp-channel=6, tests=8, utils=4, validation=4, risk=3, remaining categories <=2) confirmed via inventory; Commands: rg --stats 'EventEmitter' src; rg --files-with-matches 'EventEmitter' src; rg --files-with-matches 'EventEmitter' src | cut -d/ -f2 | sort | uniq -c; Guardrails: protect adapters (CLI, VSCode, command registry), session orchestrators, and observability emitters while aligning with event-utils spec before modifications.
- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Core Infrastructure Utilities (CRITICAL Priority)
    Pattern doc: Templum/dev/patterns/utilities/core/event-utils.md
    Utility focus: (Templum/src/utils/event-utils.ts)
    Problem: 528 EventEmitter uses with repeated event management patterns
    API intent: events.typed<EventMap>().emit('event', data) - Typed events, auto-cleanup
    Impact: Standardized event handling, reduced boilerplate
    Starter files:
    • All components using EventEmitter pattern (528 uses across codebase)
    • Event handling, debouncing, aggregation patterns
    • Typed event management systems

### Pattern 5

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Display & UI Utilities (HIGH Priority)
    Pattern doc: Templum/dev/patterns/utilities/display/display-utils.md
    Utility focus: (Templum/src/utils/display-utils.ts)
    Problem: Display calculations repeated in multiple places
    API intent: display.calculate().width(80).order('connected-first') - Fluent API
    Impact: ~25 files, ~400 lines reduction, consistent display standards
    Starter files:
    • src/interfaces/cli-display-consistency-engine.ts - Delegates layout + ordering to Display Utils stack (Stage 6 lane c validation 2025-10-03T19:27Z).
    • src/interfaces/service-ordering-manager.ts - Service display ordering
    • src/rendering/universal-layout-engine.ts - Layout calculations migrated to Display Utils (Stage 6 lane c validation 2025-10-03T19:27Z).
    • Display consistency patterns consolidated across CLI components per Stage 6 lane c close-out (evidence: tmp/stage6/pattern-5/\*.log).

### Pattern 6

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Display & UI Utilities (HIGH Priority)
    Pattern doc: Templum/dev/patterns/utilities/display/window-utils.md
    Utility focus: (Templum/src/utils/window-utils.ts)
    Problem: Border and window layout logic duplicated
    API intent: window.border('double').title('Menu').render() - Chainable window API
    Impact: ~15 files, ~300 lines reduction, consistent window management
    Starter files:
    • src/rendering/content-layout-system.ts - BorderRenderer, WindowLayout
    • src/interfaces/terminal-ui-components.ts - Window management
    • Border rendering patterns across CLI components

### Pattern 7

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Display & UI Utilities (HIGH Priority)
    Pattern doc: Templum/dev/patterns/utilities/display/terminal-formatter.md
    Utility focus: (Templum/src/utils/terminal-formatter.ts)
    Problem: 266 chalk calls with inconsistent color usage
    API intent: fmt.success('text').border() - Semantic formatting, auto-fallback
    Impact: ~13 files, ~200 lines reduction, consistent terminal styling
    Starter files:
    • src/cli-entry.ts (51 chalk calls)
    • src/mcp-channel/src/visual-feedback-system.ts (47 chalk calls)
    • src/interfaces/cli-adapter-abstracted.ts (44 chalk calls)
    • src/interfaces/terminal-ui-components.ts (35 chalk calls)
    • src/interfaces/interactive-menu-renderer.ts (27 chalk calls)

### Pattern 8

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Display & UI Utilities (HIGH Priority)
    Pattern doc: Templum/dev/patterns/utilities/display/theme-utils.md
    Utility focus: (Templum/src/utils/theme-utils.ts)
    Problem: Theme management scattered across rendering components
    API intent: theme.load('dark').apply().colors - Theme switching with fallbacks
    Impact: ~8 files, ~150 lines reduction, centralized theme management
    Starter files:
    • Theme loading and switching patterns
    • Color palette management beyond chalk
    • Interface-specific theme adaptations

### Pattern 9

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Data Management Utilities (HIGH Priority)
    Pattern doc: Templum/dev/patterns/utilities/data/validator.md
    Utility focus: (Templum/src/utils/validator.ts) — removed placeholder implementation; rebuild once migration plan is finalised
    Problem: Validation logic scattered, repeated patterns
    API intent: validate.port(3000).url('http://...').schema(data, schema) - Chainable validation
    Impact: ~12 files, ~200 lines reduction, consistent validation
    Starter files:
    • src/backend/connection-factory.ts - validateConfig method
    • src/backend/service-discovery.ts - health validation, process validation
    • src/backend/backend-service-router.ts - BackendConfig validation
    • Schema validation patterns across components

### Pattern 10

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Data Management Utilities (HIGH Priority)
    Pattern doc: Templum/dev/patterns/utilities/data/type-guards.md
    Utility focus: (Templum/src/utils/type-guards.ts) — removed placeholder implementation; rebuild once pattern doc is updated
    Problem: Repeated type checking boilerplate across components
    API intent: is.string(val) && has.property(obj, 'key') - Semantic type guards
    Impact: ~20 files, ~150 lines reduction, consistent type checking
    Starter files:
    • Type checking patterns across all components
    • Interface validation, property existence checks
    • Runtime type safety patterns

### Pattern 11

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Data Management Utilities (HIGH Priority)
    Pattern doc: Templum/dev/patterns/utilities/data/serialization-utils.md
    Utility focus: (Templum/src/utils/serialization-utils.ts) — fluent serialization/parsing API implemented with logger/error-handler integration (baseline 2025-10-01; reconfirmed during 2025-10-06 Stage 7 validation)
    Problem: JSON/serialization patterns repeated across components
    API intent: serialize.json(obj).withDefaults() - Safe serialization with validation
    Impact: ~15 files, ~100 lines reduction, consistent data handling
    Starter files:
    • JSON processing for skin definitions
    • Configuration file serialization
    • Backend communication data handling
    • Stage 1 plan drafted — see Templum/dev/architecture/utility-consolidation-plans/pattern-11.md; consumer inventory prioritises service-discovery, backend-service-router, connection-factory, templum-core, cli-entry, observability system, and universal skin engine.

### Pattern 12

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Data Management Utilities (HIGH Priority)
    Pattern doc: Templum/dev/patterns/utilities/data/chainable-string-utils.md
    Utility focus: (Templum/src/utils/chainable-string-utils.ts) — fluent API implemented with logger/error-handler wiring and comprehensive Jest coverage.
    Problem: String manipulation repeated in multiple places
    API intent: str.truncate(50).pad().wrap(80) - Chainable text processing
    Impact: ~10 files, ~80 lines reduction, consistent text handling
    Starter files:
    • Text truncation, padding, wrapping patterns
    • Case conversion, string escaping
    • Text processing across UI components

### Pattern 13

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: System Utilities (MEDIUM Priority)
    Pattern doc: Templum/dev/patterns/utilities/system/path-utils.md
    Utility focus: (Templum/src/utils/path-utils.ts) — implemented sandboxed async helpers with confidence scoring; tests in src/tests/utils/path-utils.test.ts
    Problem: File system operations repeated with manual error handling
    API intent: PathUtils.from(...).join(...).readJSON() - Sandboxed async path operations with confidence scoring
    Impact: ~8 files, ~120 lines reduction, consistent file handling
    Starter files:
    • src/backend/service-discovery.ts - Service file management
    • src/backend/connection-factory.ts - Workspace detection
    • Configuration file reading patterns across components

### Pattern 14

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: System Utilities (MEDIUM Priority)
    Pattern doc: Templum/dev/patterns/utilities/system/configuration-utils.md
    Utility focus: (Templum/src/utils/configuration-utils.ts)
    Problem: Configuration handling patterns scattered
    API intent: config.load().merge().env('NODE_ENV') - Unified config management
    Impact: ~10 files, ~150 lines reduction, consistent configuration
    Starter files:
    • Configuration loading, validation, merging
    • Environment variable handling
    • Default configuration management

### Pattern 15

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: System Utilities (MEDIUM Priority)
    Pattern doc: Templum/dev/patterns/utilities/system/cache-utils.md
    Utility focus: (Templum/src/utils/cahce-utils.ts)
    Problem: Caching patterns not consistently implemented
    API intent: cache.get('key') ?? cache.set('key', value, ttl) - LRU with TTL
    Impact: ~6 files, ~100 lines reduction, consistent caching
    Starter files:
    • Multi-level caching patterns mentioned in architecture
    • Cache key generation, TTL management
    • Cache invalidation patterns

### Pattern 16

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: System Utilities (MEDIUM Priority)
    Pattern doc: Templum/dev/patterns/utilities/system/performance-utils.md
    Utility focus: (Templum/src/utils/performance-utils.ts)
    Problem: Performance monitoring not centralized
    API intent: perf.time('operation').mark().measure() - Simple performance tracking
    Impact: ~8 files, ~80 lines reduction, consistent metrics
    Starter files:
    • Performance tracking scattered across components
    • Metrics collection patterns
    • Timing and profiling utilities

### Pattern 17

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Pattern Base Utilities (MEDIUM Priority)
    Pattern doc: Templum/dev/patterns/utilities/registry-utils.md
    Utility focus: (Templum/src/utils/registry-utils.ts)
    Problem: Registry patterns repeated with similar lifecycle management
    API intent: registry.create<T>().register(key, item).lifecycle() - Base registry class
    Impact: ~5 files, ~200 lines reduction, consistent registry patterns
    Starter files:
    • src/commands/universal-command-registry.ts - Command registration
    • src/menus/universal-menu-registry.ts - Menu registration
    • src/registry/pcl-command-registry.ts - PCL command patterns
    • src/registry/pcl-menu-registry.ts - PCL menu patterns
    • src/interfaces/interface-adapter-registry.ts - Adapter registration

### Pattern 18

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Pattern Base Utilities (MEDIUM Priority)
    Pattern doc: Templum/dev/patterns/utilities/core/factory-utils.md
    Utility focus: (Templum/src/utils/factory-utils.ts)
    Problem: Factory patterns repeated without shared base
    API intent: factory.create<T>(type).withConfig().build() - Factory pattern base
    Impact: ~4 files, ~100 lines reduction, consistent factory patterns
    Starter files:
    • src/backend/connection-factory.ts - Connection creation patterns
    • Adapter factory patterns across interface components
    • Component factory patterns in core

### Pattern 19

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Pattern Base Utilities (MEDIUM Priority)
    Pattern doc: Templum/dev/patterns/utilities/resilience-utils.md
    Utility focus: (Templum/src/utils/resilience-utils.ts)
    Problem: Resilience patterns scattered across risk management
    API intent: resilience.fallback().monitor().rollback() - Unified resilience patterns
    Impact: ~3 files, ~150 lines reduction, consistent resilience handling
    Starter files:
    • src/risk/fallback-manager.ts - Fallback strategies
    • src/risk/performance-monitor.ts - Performance monitoring
    • src/risk/rollback-criteria.ts - Rollback decision making

### Pattern 20

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Business Logic Utilities (MEDIUM Priority)
    Pattern doc: Templum/dev/patterns/utilities/core/navigation-utils-utility.md
    Utility focus: (Templum/src/utils/navigation-utils.ts) — removed placeholder implementation; rebuild after finalising pattern doc
    Problem: Navigation patterns duplicated across components
    API intent: nav.breadcrumb().back().home().exit() - Unified navigation API
    Impact: ~4 files, ~180 lines reduction, consistent navigation
    Starter files:
    • src/navigation/breadcrumb-manager.ts - Breadcrumb management
    • src/navigation/exit-handler.ts - Exit handling
    • src/navigation/content-driven-navigation.ts - Content navigation
    • src/navigation/skin-navigation-parser.ts - Skin-based navigation

### Pattern 21

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Business Logic Utilities (MEDIUM Priority)
    Pattern doc: Templum/dev/patterns/utilities/core/protocol-utils.md
    Utility focus: (Templum/src/utils/protocol-utils.ts)
    Problem: Protocol patterns repeated across IPC/HTTP/WebSocket implementations
    API intent: protocol.connect().health().retry() - Shared protocol utilities
    Impact: ~6 files, ~250 lines reduction, consistent protocol handling
    Starter files:
    • IPC protocol patterns - connection, retry, health
    • HTTP protocol patterns - similar shared concerns
    • WebSocket protocol patterns - connection management
    • Shared protocol abstractions

### Pattern 22

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Business Logic Utilities (MEDIUM Priority)
    Pattern doc: Templum/dev/patterns/utilities/core/service-utils.md
    Utility focus: (Templum/src/utils/service-utils.ts) — removed placeholder implementation; recreate in tandem with refreshed pattern doc
    Problem: Service management patterns scattered
    API intent: service.order().health().resolve() - Service management utilities
    Impact: ~3 files, ~120 lines reduction, consistent service handling
    Starter files:
    • src/interfaces/service-ordering-manager.ts - Service ordering
    • Service health monitoring patterns
    • Backend dependency resolution patterns

### Pattern 23

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Development Tools (LOW Priority)
    Pattern doc: Templum/dev/patterns/utilities/dev/test-utils.md
    Utility focus: (Templum/src/utils/test-utils.ts)
    Problem: Massive test files with repeated mock/assertion patterns
    API intent: test.mock().assert().data() - Comprehensive testing utilities
    Impact: ~23 files, ~2,000+ lines reduction, consistent testing infrastructure
    Starter files:
    • src/tests/integration-validation-framework.ts (4,234 lines - MASSIVE!)
    • src/validation/hybrid-validation-system-v3c.ts (2,049 lines - HUGE!)
    • Mock generation patterns across 21+ other test files
    • Assertion helpers, test data factories

### Pattern 24

- [1] 2025-09-14T18:00:00Z — safe-consolidation-candidates
    Category: Development Tools (LOW Priority)
    Pattern doc: Templum/dev/patterns/utilities/dev/debug-utils.md
    Utility focus: (Templum/src/utils/debug-utils.ts)
    Problem: Debug utilities not centralized or consistent
    API intent: debug.log().inspect().profile() - Development debugging utilities
    Impact: ~5 files, ~60 lines reduction, consistent debugging
    Starter files:
    • Debug logging patterns scattered across components
    • Inspection and profiling utilities
    • Development-only debugging features

### Pattern 999

- [3] 2025-10-08T10:48:05Z — 999-stage3
    Beginning orchestration

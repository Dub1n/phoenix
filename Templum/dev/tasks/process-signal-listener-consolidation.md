# Task: Consolidate Process Signal Listener Registration

Related requirement: `docs/current/progress.md` → Quality & Release Readiness → "Process signal listener consolidation".

Tags: `#infra`

## Checklist

- [ ] Inventory every module that attaches `process` signal/exception listeners or `process.stdin` handlers (navigation exit handler, terminal UI components, integration harness, CLI adapters, MCP channel runtime, etc.) and document ownership/lifecycle expectations. Focus on `src/interfaces/navigation/exit-handler.ts` (`ExitHandler.registerGlobalListeners`), `src/tests/integration-validation-framework.ts` (`Phase6IntegrationValidationSuite.registerProcessHandlers`), `src/cli-entry.ts` (`registerProcessHandlers`), and `src/mcp-channel/src/event-listener-manager.ts` (`EventListenerManager.registerProcessListeners`).
- [ ] Design and implement a shared listener manager that registers each signal/exception handler exactly once, exposes scoped subscribe/unsubscribe APIs, and integrates teardown with Jest/integration harness lifecycles.
- [ ] Refactor CLI/navigation/integration modules to consume the manager instead of directly calling `process.on`, ensuring tests clean up listeners after each run.
- [ ] Add regression coverage (unit or harness-level) that asserts listener counts stay under the default threshold across repeated suite runs (e.g., inspect `process.listenerCount` within Jest lifecycle hooks).
- [ ] Update docs/progress/task files with the new architecture guidance.
- [ ] Commit with message `templum: consolidate process signal listeners` after tests.

## References

- Code: `Templum/src/interfaces/navigation/exit-handler.ts`, `Templum/src/interfaces/terminal-ui-components.ts`, `Templum/src/interfaces/cli-adapter.ts`, `Templum/src/interfaces/cli-adapter-abstracted.ts`, `Templum/src/interfaces/navigation/index.ts`, `Templum/src/tests/integration-validation-framework.ts`, `Templum/src/index.ts`, `Templum/src/mcp-channel/src/*.ts`
- Tests: `npx jest --no-cache --runInBand --runTestsByPath src/interfaces/__tests__/adaptive-cli-integration.test.ts src/interfaces/navigation/__tests__/navigation-system.test.ts`, `npm run phase6-health`
- Docs: `docs/current/progress.md`, `Templum/dev/architecture/utility-consolidation-activity-log.md`

## Current Assessment (2025-10-05)

- Implementation: No consolidated signal manager exists; multiple modules attach `process.on` handlers (CLI entry, navigation exit handler, integration validation harness, MCP runtime, etc.), leading to listener proliferation.
- Tests: `scripts/run-with-timeout.mjs --timeout 180000 -- npm test -- tests/interfaces/interface-adapter-integration.test.ts` had to be terminated with SIGTERM because lingering listeners prevented Jest from exiting.
- Next steps: design the shared manager, migrate existing listeners, provide teardown/reset hooks for tests, and log listener counts to confirm consolidation.

## Notes

- Consider moving the listener lifecycle into a dedicated module (e.g., `src/core/process-signal-manager.ts`) that can be initialised once per process and that tracks subscriber counts for teardown safety.
- The manager should provide hooks for suites to call `reset()` between tests so Jest workers do not accumulate listeners even if modules are required multiple times.
- Evaluate whether existing exit handlers should push cleanup callbacks onto adapter-level disposables instead of touching `process` directly.
- Document any behavioural changes (e.g., signal handling order, graceful shutdown timing) and notify CLI/navigation owners before rollout.
- If this task changes prerequisites or dependency relationships, regenerate the project’s dependency map JSON (see `dev/tasks/*_task_dependencies.json`) and attach the updated file in the related progress planner.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed

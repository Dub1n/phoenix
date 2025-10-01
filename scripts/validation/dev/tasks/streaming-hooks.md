# Task: Streaming/subscription hooks for progress updates.

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Streaming/subscription hooks for progress updates."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Capture current progress signals (console logs, timeout monitors) in `src/core/enhanced-orchestrator.js` and map required event payload (category, project, phase, timestamp, elapsed, status hints).
- [ ] Add failing unit tests for a new `ProgressStreamService` (`tests/unit/streaming/progress-stream-service.test.js`) covering subscriber registration, backpressure-safe buffering, and teardown.
- [ ] Add integration tests that run `EnhancedValidationOrchestrator.executeValidationWithTimeout` against a stub validator to assert event emission order and payloads (`tests/integration/streaming/orchestrator-progress-stream.test.js`).
- [ ] Implement `src/core/progress-stream-service.js` (EventEmitter-backed) with JSON Lines and Server-Sent Events adapters plus dependency-injected logging guard.
- [ ] Wire the orchestrator to the progress service: instantiate in constructor, emit events for lifecycle milestones (`initialize`, `validator_loaded`, `validation_started`, interval progress ticks, `validation_completed`, `validation_failed`), and expose subscription API + CLI flags (`--progress-stream=jsonl:<path>`, `--progress-stream=sse:<port>`).
- [ ] Update validator interfaces (`interfaces/validator-interface.ts`) so validators can report fine-grained steps by invoking an injected progress callback; provide default no-op implementation to avoid breaking existing validators.
- [ ] Extend configuration (`config/enhanced-config.json`, project configs) to allow enabling/disabling specific stream adapters and to declare default destinations; ensure backwards compatibility by defaulting to disabled state.
- [ ] Document streaming architecture and subscription instructions in `docs/current/architecture-spec.md` (sections 2, 5, 6) and note the CLI/config knobs in `docs/current/progress.md` Interface Enablement notes.

### Blocked Actions (if any)
- [ ] None.

## Definition of Done
- Tests to run: `node tests/unit/streaming/progress-stream-service.test.js`, `node tests/integration/streaming/orchestrator-progress-stream.test.js`, regression suite `node tests/validation-system-enhancement-test.js`.
- Validation/commands: `node src/core/enhanced-orchestrator.js --project <project> --category <category> --task-id TEST --progress-stream=jsonl:dev/validation-results/progress.log` to confirm streamed events.
- Documentation to update: `docs/current/architecture-spec.md`, `docs/current/progress.md`, CLI usage docs if maintained, release/changelog entry.

## References
- Progress entry: `docs/current/progress.md:32`
- Architecture spec sections: `docs/current/architecture-spec.md` §§2,5,6
- Related task files: `dev/tasks/policy-engine.md`, `dev/tasks/validator-result-exports.md`

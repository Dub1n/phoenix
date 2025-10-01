# Task: Implement Haruspex job scheduling/progress tracking/cancellation

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Job scheduling/progress tracking/cancellation implemented."

## Prerequisites
- [~] HTTP server boots (handlers still tied to legacy components; replace with backend-native logic). — API Gateway needs backend-native handlers before new job endpoints and WebSocket streams can be wired in.

## Implementation Steps
### Unblocked Actions
- [ ] Add TDD coverage for the job lifecycle in `src/__tests__/jobs/job-scheduler.test.ts`, covering queue ordering, concurrency caps, progress emission, failure propagation, and cancellation semantics using real async runners.
- [ ] Introduce `JobScheduler` + supporting types in `src/core/jobs/job-scheduler.ts` (and split helpers if needed) to manage submission, worker pools, progress events, and cancellation tokens while enforcing config-driven concurrency.
- [ ] Refactor `src/haruspex-backend-service.ts` to delegate `analyzeCode`/`predictCodeEvolution` through the new scheduler, expose `submitJob/getJobStatus/cancelJob` APIs, and emit structured progress events without relying on the existing `activeAnalyses`/`activePredictions` maps.
- [ ] Extend service-level tests (update `src/__tests__/backend-service.test.ts` or add `src/__tests__/backend-job-flow.test.ts`) to exercise async job submission, polling, and cancellation using the scheduler.
- [ ] Define job DTOs (status payloads, progress snapshots, cancellation responses) in `src/api/types/api-contracts.ts` so downstream layers share a consistent contract.

### Blocked Actions (pending [~] HTTP server boots (handlers still tied to legacy components; replace with backend-native logic).)
- [ ] Implement REST endpoints in `src/api/gateway/api-gateway.ts` (`POST /jobs`, `GET /jobs/:id`, `DELETE /jobs/:id`) and WebSocket progress relays once the gateway runs on backend-native handlers.
- [ ] Document the new job API wiring in `docs/current/architecture-spec.md` and expose metrics/health probes via the refreshed HTTP server once it is decoupled from legacy components.

## Definition of Done
- Tests to run: `npm test -- src/__tests__/jobs/job-scheduler.test.ts`, relevant backend service suites (`npm test -- src/__tests__/backend-service.test.ts`), and any new integration suites added for job APIs.
- Validation/commands: Stand up the backend via `npm run build && node dist/src/backend-main.js`, issue job lifecycle requests through HTTP/WebSocket clients, and confirm Validation System category for Haruspex backend passes once available.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md` (job scheduling section), and changelog/operations notes if maintained.

## References
- Progress entry: `docs/current/progress.md:20`
- Architecture spec: `docs/current/architecture-spec.md:45`
- Related task: `dev/tasks/backend-skin-generator.md`

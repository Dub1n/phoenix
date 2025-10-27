# Task: Modularise Backend Service Router

## Goal

Refactor `backend-service-router.ts` into three collaborating modules so discovery sources, connection orchestration, and health monitoring are isolated, testable, and protocol-agnostic.

## MVP Prerequisite

- Complete MVP baseline (discovery/session fixes) so behaviour is covered by tests before splitting.

## Implementation Outline

1. **Discovered manifest sources**
   - Extract file-watch, env overrides, and manual injection into `src/backend/discovery-sources/` (each emitting typed `ServiceDescriptor` events).
2. **Connection manager**
   - Create `connection-manager.ts` that listens for descriptors, calls `ConnectionFactory`, and emits `connection:lifecycle` events (reuse existing logic but isolated).
3. **Health monitor**
   - Move continuous health probing into `health-monitor.ts`, subscribing to lifecycle events and updating state via event bus.
4. **Event bus glue**
   - Introduce a lightweight internal emitter (or DI interface) coordinating the three modules; router becomes a thin orchestrator wiring them together.
5. **Testing**
   - Add unit tests per module plus integration coverage ensuring behaviour matches pre-refactor suites.

## Task Links

- Progress tracker: `docs/target/post-mvp-progress.md` (Backend Connectivity section).
- Dependent tasks: `dev/tasks/multi-protocol-auto-registration.md`, `dev/tasks/zero-knowledge-registry.md` (must stay green).

## Status — 2025-10-24

- Pattern 1 Stage 7 close-out locked the consolidated logger across backend router and validation surfaces (`dev/architecture/logs/pattern-1-stage7-jest-ci-20251024T222520Z.log`, `dev/architecture/logs/pattern-1-stage7-phase6-health-20251024T222834Z.log`, `dev/architecture/logs/pattern-1-stage7-phase6-validation-20251024T222848Z.log`, sweep `dev/architecture/logs/pattern-1-stage7-sweep-20251024T224015Z.log`), so this modularisation can rely on the DI logger seams instead of bespoke console fallbacks; migrations remain sequenced behind Pattern 3 async-utils timer work before splitting the modules.
- TODO 2025-10-24: Pair with Pattern 3 async-utils owners on replacement timing helpers and rerun the router guardrail suites once the ErrorHandler integration is staged to ensure no regressions before extracting modules.

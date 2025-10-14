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

## Status — 2025-10-14

- Pattern 2 Stage 3 orchestration refreshed with guardrail lane 4d / runtime lane 6c covering the router, dependency resolver, and service-health flows. Manual catch blocks and console logging remain until ErrorHandler.wrap adoption lands; modularisation stays blocked behind that migration.
- TODO 2025-10-14: Pair with Pattern 1 logger + Pattern 3 async-utils owners on replacement logging/timeouts before extracting modules; rerun Stage 4 guardrail suites once ErrorHandler integration is staged.

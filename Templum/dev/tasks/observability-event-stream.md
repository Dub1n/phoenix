# Task: Observability Event Stream Architecture

## Goal

Move from direct logging/metric calls to an event-stream model so runtime components publish typed events that observability handlers consume.

## Steps

1. **Define event contracts** for discovery, session, rendering, lifecycle, and error events (`src/observability/events.ts`).
2. **Instrument publishers**: discovery modules, session manager, adapters, and core emit events instead of calling observability methods directly.
3. **Event bus & handlers**: introduce a lightweight emitter with pluggable handlers (structured logs, metrics). Default handler routes to the existing adapter.
4. **Testing**: add unit tests for emitter/handlers and integration tests ensuring events fire during discovery, skin rendering, and lifecycle transitions.
5. **Doc updates**: refresh observability blueprint to describe the event model and how to attach new handlers.

## Dependencies

- MVP baseline observability (`dev/tasks/mvp/observability-baseline.md`) must be complete.
- Coordination with coverage/CI tasks to ensure new modules are exercised.

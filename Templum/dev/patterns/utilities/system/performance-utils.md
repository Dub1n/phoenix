---
date-created: 2025-09-14T07:00:00Z
last-updated: 2025-09-30T12:00:00Z
name: performance-utils
description: Unified performance timing and metric helpers with minimal-footprint timers and fluent telemetry hooks.
status:
  - "[x]"
category: system
use-when:
  - "Consolidating repeated performance timers and telemetry emitters into a single fluent utility."
  - "Instrumenting latency and throughput without scattering performance.now() bookkeeping."
  - "Emitting consistent performance metrics across backends, CLI flows, and real-time monitors."
keywords:
  - performance
  - timing
  - metrics
  - telemetry
prerequisites:
  - logger
  - async-utils
  - resilience-utils
related-patterns:
  - cache-utils
  - registry-utils
  - resilience-utils
---

# Performance Utils Utility Pattern

## Consolidation Snapshot

- **Redundancy count**: ≈8 files reproducing manual timing logic (~80 duplicated lines) across rendering, validation, state sync, and monitoring modules.
- **Target reduction**: Replace ad hoc `performance.now()` pairs and bespoke metric payload builders with a shared API that records durations, emits metrics, and routes anomalies to the logger/error handler stack.
- **Priority**: MEDIUM (system utilities) – unlocks consistent telemetry, validates timing accuracy, and feeds existing observability pipelines.

### Current Duplication Examples

```typescript
const start = performance.now();
try {
  await execute();
  const duration = performance.now() - start;
  metrics.push({ id, duration });
  if (duration > threshold) {
    console.warn('Slow operation', { id, duration });
  }
} catch (error) {
  console.error('Failed', { id, duration: performance.now() - start, error });
}
```

Manual timer scaffolding like this appears in `src/risk/performance-monitor.ts`, `src/backend/backend-service-router.ts`, `src/monitoring/cli-performance-monitor.ts`, `src/rendering/universal-skin-renderer.ts`, `src/state/enhanced-state-synchronization.ts`, the production readiness validators, and CLI validation scripts.

## Problem Statement

Performance tracking is implemented inconsistently, with each subsystem combining raw timers, `console` logging, and bespoke metric payloads. This makes it difficult to guarantee timing accuracy, share metric schemas, or emit telemetry consistently to the observability fabric.

## Solution Overview

Deliver a `PerformanceUtils` module that enables minimal-footprint instrumentation:

- **Fluent timers**: `perf.time('operation').start().end({ tags })` wraps start/stop logic and captures metadata.
- **Measure helpers**: `await perf.measure('operation', () => doWork())` handles execution + timing + error propagation.
- **Metric emission**: One-line hooks to push structured metrics to the logger + event bus, with typed payloads for latency, throughput, and resource usage.
- **Baseline awareness**: Optional thresholds to auto-flag degradations and emit warnings without duplicating comparison logic.
- **Dependency integration**: Uses `logger`, `error-handler`, and `async-utils` for logging, safe retries, and scheduling.

### Core API Outline

```typescript
export interface PerformanceTimer {
  stop(extra?: Partial<PerformanceRecord>): PerformanceRecord;
  cancel(): void;
}

export interface PerformanceRecord {
  operation: string;
  durationMs: number;
  startedAt: number;
  stoppedAt: number;
  tags: Record<string, string>;
  metrics: PerformanceMetrics;
  thresholdBreached?: boolean;
}

export class PerformanceUtils {
  static time(operation: string, options?: PerformanceOptions): PerformanceTimer;
  static async measure<T>(operation: string, task: () => Promise<T>, options?: PerformanceOptions): Promise<{ result: T; record: PerformanceRecord }>;
  static mark(stage: string, context?: PerformanceMarkContext): void;
  static emit(record: PerformanceRecord, channels?: string[]): void;
  static registerEmitter(channel: string, handler: (record: PerformanceRecord) => void): void;
  static summarize(): PerformanceSummary;
}
```

**PerformanceOptions** allow callers to define thresholds (e.g., degradation at +20%), additional tags (`interface: 'cli'`), and metric channels (`emitTo: ['monitoring', 'logger']`).
`PerformanceMetrics`, `PerformanceMarkContext`, and `PerformanceSummary` codify the shared telemetry schema (duration, throughput, resource usage fields) so emitters can rely on a consistent shape.

### Minimal Usage Example

```typescript
const { result } = await PerformanceUtils.measure('backend:command', () =>
  router.executeCommand(backendId, command, args),
  {
    thresholdMs: 250,
    tags: { backendId, interface: 'cli' },
    emitTo: ['monitoring']
  }
);
```

The call wraps timing, emits a structured metric, and logs warnings if thresholds are exceeded without any manual `performance.now()` usage.

## Key Consumers

| Component | Responsibility | Instrumentation Focus |
|-----------|----------------|-----------------------|
| `Templum/src/risk/performance-monitor.ts` | Detect degradation against baselines | Replace manual timers and alert scaffolding with threshold-aware `PerformanceUtils` records |
| `Templum/src/backend/backend-service-router.ts` | Route backend commands and track latency | Measure command execution, connection setup, and skin loading to feed router telemetry |
| `Templum/src/monitoring/cli-performance-monitor.ts` | CLI telemetry capture and adaptive thresholds | Stream snapshots and trend analysis using shared metric emitters |
| `Templum/src/rendering/universal-skin-renderer.ts` | Render skins and detect slow layouts | Wrap render phases to surface render time metrics |
| `Templum/src/state/enhanced-state-synchronization.ts` | State sync latency tracking | Standardize sync timing and threshold evaluation |

## Implementation Guidelines

- **Singleton surface**: Expose a stateless API (default export of pure functions) while keeping shared configuration (threshold defaults, metric adapters) injectable for tests.
- **Logging & errors**: Route anomalies through `logger.warn` and rely on `error-handler` for consistent exception wrapping when measurements fail.
- **Metric adapters**: Provide extension hooks (`registerEmitter`) so monitoring modules can subscribe to emitted records without direct coupling.
- **Chainable helpers**: Timer objects expose `stop`, `emit`, and `withTag` to encourage minimal calling code.
- **Baseline integration**: Accept baseline values from `configuration-utils` (when available) and reuse resilience utilities for backoff on metric transport failures.

### Suggested Module Layout

1. `performance-utils.ts`: Exports core API, timer implementation, emitter registry.
2. `performance-record.ts`: Shared types for performance events (optional if types stay small).
3. Tests under `tests/core/performance-utils.test.ts` covering thresholds, logging, and emission hooks.

## Integration Examples

- **Batch Measurement**
  ```typescript
  const timer = PerformanceUtils.time('state-sync', { thresholdMs: 150 });
  await syncState();
  const record = timer.stop({ tags: { sessionId } });
  PerformanceUtils.emit(record);
  ```

- **Streaming Metrics**
  ```typescript
  PerformanceUtils.registerEmitter('monitoring', payload => {
    monitoringBus.publish('performance.metric', payload);
  });
  ```

## Validation Checklist

**Before migration**
- [ ] Inventory every `performance.now()` / manual timer in the targeted files and capture current threshold values.
- [ ] Verify expected metric schemas (fields, channels) with observability owners.

**During migration**
- [ ] Replace manual timers with `PerformanceUtils.measure` or `PerformanceUtils.time` while preserving metadata.
- [ ] Confirm timing accuracy by comparing sample durations against baseline manual calculations.
- [ ] Ensure metric emission hooks fire on success and failure paths, forwarding payloads to logger + monitoring adapters.

**After migration**
- [ ] Run smoke tests (CLI, backend routing, monitoring) to validate emitted metrics contain operation names, durations, and threshold flags.
- [ ] Check logs for threshold breach warnings to confirm integrations are active.
- [ ] Update `safe-consolidation-candidates.md` metrics and record achieved line reductions.

## Success Metrics

- **Consistency**: All latency/throughput measurements go through `PerformanceUtils`.
- **Observability**: Metric payloads include mandatory fields (operation, duration, tags, thresholdBreached) and arrive in monitoring dashboards.
- **Accuracy**: Measurements align within ±2ms against manual benchmarks in validation scripts.
- **Reduction**: Remove ≈80 lines of duplicate timer code across ≥8 files.

## Anti-Patterns & Guardrails

- ❌ Do not expose raw timers that require manual `performance.now()` calls.
- ❌ Avoid hard-coding console warnings; use `logger` and structured emitters.
- ❌ Skip long-running aggregation inside the utility; keep the API lightweight and composable.
- ✅ Prefer dependency injection for custom emitters to keep modules testable.
- ✅ Keep functions ≤30 lines and file size <500 lines to maintain readability.

## Migration Notes

- Coordinate with the observability team before changing metric naming conventions.
- Stage migrations starting with monitoring modules, then backend router, then rendering and state-sync paths to minimize regression risk.
- Create follow-up tasks for adding regression tests where suites are missing (e.g., CLI monitor integration tests).

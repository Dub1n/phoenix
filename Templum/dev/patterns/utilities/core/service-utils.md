---
date-created: 2025-09-14T12:00:00Z
last-updated: 2025-10-05T15:30:00Z
name: "service-utils"
description: "Single-call toolkit that normalises, ranks, and summarises services for ordering, health insights, and dependency resolution."
status: ["[x]"]
category: "business-logic"
use-when:
  - "Service ordering, health monitoring, and backend dependency flows drift because each subsystem scores services differently."
  - "You need a one-line way to turn heterogeneous service descriptors into ordered lists plus confidence-aware summaries."
  - "Migration work should eliminate duplicated sorting and health aggregation code across interface and backend layers."
keywords:
  - "service-utils"
  - "service-ordering"
  - "health-summary"
  - "dependency-resolution"
prerequisites:
  - "logger"
  - "error-handler"
  - "async-utils"
related-patterns:
  - "multi-strategy-service-discovery"
  - "protocol-utils"
  - "registry-utils"
---

## Intelligence Briefing

- Redundancy is concentrated in three files: `src/interfaces/service-ordering-manager.ts` (≈110 lines of custom comparators), `src/backend/backend-dependency-resolver.ts` (≈40 lines of manual scoring + heuristics), and `src/backend/service-discovery-validator.ts` (≈30 lines of health aggregation). Together they account for ~120 lines of duplicated logic that shape service prioritisation, summaries, and lookups.
- Each subsystem applies its own weighting (connected-first, health buckets, priority, latency, confidence) without a shared contract. Small divergences are causing inconsistent ordering between CLI displays and backend dependency resolution.
- A fluent utility with a minimal API must become the single source of truth for service ranking, summary telemetry, and dependency-oriented selection so migrations can converge quickly without rewriting consumers.

## Problem Statement

Service-facing subsystems independently implement:

- **Ordering rules**: Connected-first + health + priority across 5+ bespoke comparator helpers.
- **Health summaries**: Health monitor, validator, and dependency resolver each recalculate counts, averages, and confidence thresholds differently.
- **Dependency lookups**: Backend dependency resolver and service ordering manager both deduplicate and prefer “freshest” service data, but with divergent tie-breaking logic.

This fragmentation makes migrations error-prone, inflates maintenance cost, and blocks consolidation targets identified in `safe-consolidation-candidates.md`.

## Solution Overview

Implement `ServiceUtils` as a fluent, chainable toolkit exposing a **single call** to normalise, score, order, and summarise service descriptors.

- **Normalisation**: Ensure every record carries canonical fields (`connected`, `health`, `priority`, `responseTime`, `confidence`, `lastCheck`) with consistent defaults.
- **Deterministic scoring**: Apply a unified 0–100 score (`connected` weighting + health + priority + confidence − latency penalty) to keep ordering predictable across UI and backend flows.
- **One-line usage**: `const { ordered, summary, pick } = assessServices(services, { context: 'status-display' });`
- **Integration hooks**: Return partitions, lookups, and helper selectors (`pick`, `byId`) so health monitors and dependency resolvers can adopt the same data without bespoke transforms.

### Minimal-Footprint API

```typescript
import { assessServices } from '../../utils/service-utils';

const { ordered, partitions, summary, pick } = assessServices(services, {
  context: 'status-display',
  lowConfidenceThreshold: 0.65
});

const priorityView = ordered.slice(0, 10);
const healthSnapshot = summary.health;
const required = pick(['templum-core', 'haruspex']);
```

### Integration Examples

- **Service ordering manager** replaces its manual comparator with:

  ```typescript
  const { ordered } = assessServices(rawServices, { context: 'status-display' });
  return ordered;
  ```

- **Health monitor** converts polling output into summary metadata:

  ```typescript
  const { summary } = assessServices(discovered, { context: 'health-monitor' });
  publish(summary.confidence);
  ```

- **Backend dependency resolver** aligns tie-breaking logic:

  ```typescript
  const { byId, pick } = assessServices(candidates);
  const resolved = pick(requiredIds);
  const fallback = byId.get('templum-core');
  ```

## Adoption Targets

| Capability | Replacement | Expected Impact |
|------------|-------------|-----------------|
| Ordering logic | `ServiceOrderingManager.compare*` helpers | Remove ≈110 duplicated comparator lines |
| Health metrics | Manual averages in `service-discovery-validator` | Replace ≈30 lines with `summary` output |
| Dependency dedupe | Custom map logic in `backend-dependency-resolver` | Remove ≈40 lines and unify confidence tie-breaks |

## Files Using This Pattern

- `Templum/src/interfaces/service-ordering-manager.ts` — swap `compareServices`/`sortAlphabetical` logic for `assessServices(...).ordered`.
- `Templum/src/backend/backend-dependency-resolver.ts` — replace bespoke dedupe/heuristics with `assessServices(...).byId` + `pick` for required/optional sets.
- `Templum/src/backend/service-discovery-validator.ts` — derive validation metrics from `summary` rather than recalculating confidence, health, and latency stats.

## Migration & Validation Checklist

- [ ] Update each consumer to call `assessServices` and remove redundant comparator or summary helpers.
- [ ] Ensure logger/error-handler integration remains intact (utility already delegates to them for error capture).
- [ ] Verify CLI ordering, backend dependency resolution, and health dashboards show identical ordering after migration.
- [ ] Confirm low confidence thresholds are configured per context (default 0.70, override when domain requires).
- [ ] Add focused unit tests around new call sites to cover ordering, summary, and dependency lookup expectations.

## Success Metrics

- **Lines removed**: Target ≥120 lines across the three consumer files once migrations complete.
- **Consistency**: `ordered` output matches across CLI status views and dependency resolution smoke tests.
- **Confidence governance**: All low-confidence flags sourced from `summary.confidence.lowConfidence` to support centralised alerting.
- **Performance**: Ordering and summary generation remains sub-2ms for batches ≤200 services (validated via micro-benchmark or unit test harness).

## Implementation Notes

- `assessServices` deduplicates by `id`, preferring connected records, higher confidence, fresher `lastCheck`, and higher computed score.
- Scores land on a 0–100 scale; downstream logic should treat ≥70 as healthy, ≥85 as top-tier.
- The utility logs normalisation errors but never throws during batch assessment, keeping UI flows resilient while still surfacing diagnostics to the central logger.

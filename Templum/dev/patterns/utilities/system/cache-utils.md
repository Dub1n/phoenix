---
date-created: 2025-09-14T18:05:00Z
last-updated: 2025-09-14T18:05:00Z
name: cache-utils
description: Cache utilities providing LRU + TTL storage, confidence scoring, and simple multi-level caching interfaces
status: "[x]"
category: system
use-when:
  - Replacing repeated in-memory cache implementations
  - Sharing TTL and eviction behaviour across modules
  - Collecting cache metrics for performance tuning
  - Providing pluggable storage layers (memory, persistent, distributed)
keywords:
  - cache
  - ttl
  - lru
  - performance
  - analytics
prerequisites:
  - logger
  - validator
  - configuration-utils
related-patterns:
  - performance-utils
  - resilience-utils
  - registry-utils
---

# Cache Utils Utility Pattern

## Consolidation Snapshot

- **Redundancy count**: Cache helpers duplicated across ≈6 files (service discovery, backend router, resource manager, tests).
- **Target reduction**: ≈100 lines of caching boilerplate.
- **Priority**: MEDIUM (system utilities) – improves consistency and observability of caching behaviour.

## Problem Statement

Each subsystem implements its own caching approach (Maps with manual eviction, ad hoc TTL cleanups, bespoke metrics), leading to inconsistent behaviour and limited visibility into hit rates or stale data.

### Current State Examples

```typescript
const cache = new Map<string, CacheEntry>();
if (cache.size > 100) {
  const [key] = cache.keys();
  cache.delete(key);
}
setTimeout(() => cache.delete(key), ttlMs);
```

## Solution Overview

Provide a `CacheUtils` module that:

- exposes a `createStore` factory returning a typed cache with TTL + LRU out of the box,
- supports optional multi-level storage (memory + disk) through adapters,
- tracks hit/miss metrics and confidence scores,
- integrates with logger + resilience utilities for observability.

### Core API Sketch

```typescript
import { createLogger } from './logger';

type Level = 'memory' | 'persistent';

type CacheKey = string | number;

type CacheEvent = 'hit' | 'miss' | 'evict';

interface CacheStoreOptions {
  maxSize?: number;
  ttlMs?: number;
  level?: Level;
}

interface CacheStoreMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

interface CacheStore<T> {
  get(key: CacheKey): T | undefined;
  set(key: CacheKey, value: T, options?: { ttlMs?: number; confidence?: number }): void;
  delete(key: CacheKey): void;
  clear(): void;
  metrics(): CacheStoreMetrics;
  on(event: CacheEvent, handler: (payload: { key: CacheKey; confidence?: number }) => void): void;
}

export class CacheUtils {
  private static logger = createLogger('cache-utils');

  static createStore<T>(options: CacheStoreOptions = {}): CacheStore<T> {
    const maxSize = options.maxSize ?? 100;
    const defaultTtl = options.ttlMs ?? 5 * 60_000;
    const entries = new Map<CacheKey, { value: T; expiresAt: number; confidence: number }>();
    const listeners = new Map<CacheEvent, Set<(payload: { key: CacheKey; confidence?: number }) => void>>();
    const metrics: CacheStoreMetrics = { hits: 0, misses: 0, evictions: 0, size: 0 };

    function emit(event: CacheEvent, payload: { key: CacheKey; confidence?: number }): void {
      listeners.get(event)?.forEach(listener => listener(payload));
    }

    function evictIfNeeded(): void {
      if (entries.size <= maxSize) return;
      const [oldestKey] = entries.keys();
      if (oldestKey !== undefined) {
        entries.delete(oldestKey);
        metrics.evictions += 1;
        emit('evict', { key: oldestKey });
      }
    }

    function reapExpired(now: number): void {
      for (const [key, entry] of entries.entries()) {
        if (entry.expiresAt <= now) {
          entries.delete(key);
          emit('evict', { key, confidence: entry.confidence });
        }
      }
    }

    const store: CacheStore<T> = {
      get(key) {
        const now = Date.now();
        reapExpired(now);
        const entry = entries.get(key);
        if (!entry) {
          metrics.misses += 1;
          emit('miss', { key });
          return undefined;
        }
        metrics.hits += 1;
        emit('hit', { key, confidence: entry.confidence });
        return entry.value;
      },
      set(key, value, setOptions = {}) {
        const ttl = setOptions.ttlMs ?? defaultTtl;
        entries.set(key, { value, expiresAt: Date.now() + ttl, confidence: setOptions.confidence ?? 1 });
        metrics.size = entries.size;
        evictIfNeeded();
      },
      delete(key) {
        entries.delete(key);
        metrics.size = entries.size;
      },
      clear() {
        entries.clear();
        metrics.size = 0;
      },
      metrics() {
        return { ...metrics, size: entries.size };
      },
      on(event, handler) {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(handler);
      }
    };

    return store;
  }
}
```

### Migration Example

```typescript
// Before
const cache = new Map<string, Service>();
function getService(id: string) {
  if (cache.has(id)) return cache.get(id);
  const svc = buildService(id);
  cache.set(id, svc);
  return svc;
}

// After
const services = CacheUtils.createStore<Service>({ maxSize: 200, ttlMs: 60_000 });
services.on('evict', ({ key }) => log.debug('Service cache eviction', { key }));

function getService(id: string) {
  return services.get(id) ?? (services.set(id, buildService(id)), services.get(id)!);
}
```

## Files Using This Pattern

| Component | Migration Focus | Estimated Helpers |
|-----------|-----------------|-------------------|
| `src/backend/service-discovery.ts` | Cache service metadata with TTL | 2 helpers |
| `src/backend/backend-service-router.ts` | Share backend connection cache | 2 helpers |
| `src/risk/performance-monitor.ts` | Record metrics via cache events | 1 helper |
| Test harnesses (≈1 file) | Reuse cache store for repeatable fixtures | 1 helper |

## Expected Impact

- **Lines reduced**: ≈100 lines of ad hoc cache logic.
- **Usage footprint**: Cache CRUD within ≤4 calls per component.
- **Observability**: Built-in metrics + event hooks for performance dashboards.

## Implementation Checklist

**Before migration**

- [ ] Document current cache sizes, TTLs, and eviction policies per module.
- [ ] Identify metrics needed for performance dashboards.

**During migration**

- [ ] Replace manual `Map` + TTL handling with `CacheUtils.createStore`.
- [ ] Configure event listeners to feed metrics/logging.
- [ ] Ensure confidence scoring or TTL overrides are passed for critical entries.

**After migration**

- [ ] Validate cache eviction behaviour under load.
- [ ] Confirm metrics integrate with performance utils or logging.
- [ ] Update consolidation checklist entries.

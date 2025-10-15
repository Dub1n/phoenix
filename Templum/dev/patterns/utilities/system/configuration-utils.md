---
date-created: 2025-09-14T14:12:30Z
last-updated: 2025-09-14T14:12:30Z
name: configuration-utils
description: Unified configuration loading utilities covering environment parsing, schema validation, file persistence, and hot reloading
status: "[x]"
category: configuration
use-when:
  - Loading configuration from files, environment variables, or defaults
  - Validating configuration structure before bootstrapping services
  - Watching configuration for live reload or edit detection
  - Merging layered configuration sources consistently
keywords:
  - configuration
  - environment-variables
  - schema-validation
  - file-management
  - hot-reload
prerequisites:
  - logger
  - validator
  - path-utils
related-patterns:
  - validator
  - path-utils
  - registry-utils
---

# Configuration Utils Utility Pattern

## Consolidation Snapshot

- **Redundancy count**: Configuration loaders/env parsers duplicated across ≈10 files (`safe-consolidation-candidates.md`).
- **Target reduction**: ≈150 lines.
- **Priority**: MEDIUM (system utilities) – foundational for stable boot flows.

## Problem Statement

Multiple components (core orchestrator, backend integrations, validation frameworks) read configuration through bespoke logic. Each copies environment variable parsing, JSON/YAML loading, and schema validation, increasing drift risk and lacking consistent logging.

### Current State Examples

```typescript
const rawConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
const envPort = parseInt(process.env.TEMPLUM_PORT || '3000', 10);
if (!rawConfig.services) {
  throw new Error('services section missing');
}
```

## Solution Overview

Expose a `ConfigurationUtils` module that:

- loads base configuration from disk with safe defaults,
- merges environment overrides by declarative descriptors,
- validates via shared schema adapters (e.g. Zod) while logging warnings instead of throwing until final gate,
- emits change events for hot reloading and maintains cache/last-modified metadata.

### Core API Sketch

```typescript
import { createLogger } from './logger';
import { PathUtils } from './path-utils';
import { Validator } from './validator';

interface LoadOptions<T> {
  schema: Validator.Schema<T>;
  defaults?: Partial<T>;
  env?: EnvironmentDescriptor<T>;
  watch?: boolean;
}

interface LoadedConfig<T> {
  value: T;
  source: 'file' | 'defaults' | 'env';
  metadata: { path: string; loadedAt: number; checksum: string };
  dispose(): void;
  onChange(handler: (next: T) => void): void;
}

export class ConfigurationUtils {
  private static logger = createLogger('configuration-utils');

  static async load<T>(path: string, options: LoadOptions<T>): Promise<LoadedConfig<T>> {
    const filePath = PathUtils.safeJoin(process.cwd(), path);
    const raw = await this.readFile(filePath, options.defaults);
    const merged = this.applyEnvironment(raw, options.env ?? {});
    const validation = Validator.ensure(options.schema, merged);

    if (!validation.valid) {
      validation.warnings.forEach(warning => this.logger.warn('Configuration warning', warning));
      if (validation.errors.length) {
        throw new Error(`Configuration invalid: ${validation.errors[0].message}`);
      }
    }

    const metadata = { path: filePath, loadedAt: Date.now(), checksum: this.checksum(merged) };
    const listeners = new Set<(next: T) => void>();

    if (options.watch) {
      this.watch(filePath, async () => {
        const next = await this.load(path, { ...options, watch: false });
        listeners.forEach(listener => listener(next.value));
      });
    }

    return {
      value: merged,
      source: 'file',
      metadata,
      dispose: () => listeners.clear(),
      onChange: (handler) => listeners.add(handler)
    };
  }

  // Helper implementations: readFile, applyEnvironment, checksum, watch (omitted for brevity)
}
```

### Migration Example

```typescript
// Before
const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
config.port = process.env.PORT ? Number(process.env.PORT) : config.port;
validate(config);

// After
const templumConfig = await ConfigurationUtils.load('config/templum.json', {
  schema: templumSchema,
  defaults: defaultTemplumConfig,
  env: {
    port: { type: 'number', envVar: 'TEMPLUM_PORT', fallback: 3000 }
  },
  watch: true
});
```

## Files Using This Pattern

| Component | Migration Focus | Estimated Helpers |
|-----------|-----------------|-------------------|
| `src/core/templum-core.ts` | Replace bespoke config loader + env merges | 5 helpers |
| `src/backend/service-discovery.ts` | Standardize service config ingestion | 3 helpers |
| `src/backend/connection-factory.ts` | Share env overrides for protocol endpoints | 2 helpers |
| Validation/test harnesses (≈3 files) | Use watch + schema validation pipeline | 4 helpers |

## Expected Impact

- **Lines reduced**: ≈150 across system configuration modules.
- **Usage footprint**: Config load with validation/hot reload in ≤5 lines per component.
- **Consistency**: Shared env parsing, logging, and change notification.

## Implementation Checklist

**Before migration**

- [ ] Inventory config sources (files, env, defaults) per component.
- [ ] Extract existing validation rules to shared schema definitions.

**During migration**

- [ ] Replace manual JSON parsing with `ConfigurationUtils.load`.
- [ ] Map env overrides to descriptors (type, env var, fallback).
- [ ] Enable watch mode where live reload is required.

**After migration**

- [ ] Verify logging includes missing/invalid configuration warnings.
- [ ] Exercise hot reload to confirm listeners receive updates.
- [ ] Tick consolidation checklist entries.

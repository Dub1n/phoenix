---
date-created: 2025-09-14T18:20:00Z
last-updated: 2025-09-14T18:20:00Z
name: display-utils
description: Centralized display utilities to consolidate scattered UI calculations, display standards, and service ordering patterns across interface components
status: established
category: display-ui
use-when:
  - Consolidating display consistency calculations scattered across CLI components
  - Need for unified service ordering and display standards
  - Terminal width calculations and layout constraints required
  - Consistent UI element sizing and positioning needed
keywords:
  - display-utilities
  - ui-consistency
  - service-ordering
  - layout-calculations
  - terminal-standards
prerequisites:
  - logger
  - terminal-formatter
related-patterns:
  - window-utils
  - terminal-formatter
  - terminal-ui-components
---

# Display Utils Utility Consolidation Pattern

## Consolidation Snapshot

- **Redundancy count**: Display width/order helpers duplicated in ~25 CLI-facing files (source: `safe-consolidation-candidates.md`).
- **Target reduction**: ≈400 lines of repeated calculations removed once migrated.
- **Priority**: HIGH – drives UI consistency across CLI and service ordering experiences.

## Problem Statement

Display consistency calculations are scattered across multiple CLI components. Implementations such as `DisplayStandardsCalculator`, `CLIDisplayConsistencyEngine`, `ServiceOrderingManager`, and ad-hoc layout math repeat the same logic, leading to inconsistent rendering and difficult maintenance.

### Current State Examples

```typescript
// In cli-display-consistency-engine.ts
class CLIDisplayConsistencyEngine {
  calculateDisplayWidth(content: string): number {
    // Manual width calculation logic
  }
  
  enforceConsistency(items: MenuItem[]): MenuItem[] {
    // Manual consistency enforcement
  }
}

// In service-ordering-manager.ts
class ServiceOrderingManager {
  orderServices(services: BackendService[]): BackendService[] {
    const connected = services.filter(s => s.status === 'connected');
    const disconnected = services.filter(s => s.status !== 'connected');
    return [...connected.sort(), ...disconnected.sort()];
  }
}

// Repeated layout calculations
const terminalWidth = process.stdout.columns || 80;
const contentWidth = terminalWidth - 4; // Manual padding calculation
```

## Solution Overview

Centralize layout calculations and service ordering behind a fluent `DisplayUtils` API. The utility must:

- expose one-line helpers (e.g. `display.calculate().autoWidth()`),
- integrate with the shared logger and terminal formatter,
- provide standards via `DisplayUtils.standards` instead of hard-coded magic numbers,
- handle width calculations with ANSI-safe measurements,
- support service ordering with context-aware defaults and debug logging.

### Core API Sketch

```typescript
import { createLogger } from './logger';
import { TerminalFormatter } from './terminal-formatter';

type OrderingStrategy = 'connected-first' | 'alphabetical' | 'none';

class DisplayCalculator {
  constructor(
    private widthValue = 0,
    private paddingValue = 2,
    private orderingValue: OrderingStrategy = 'connected-first'
  ) {}

  width(width: number): this {
    this.widthValue = Math.max(0, width);
    return this;
  }

  autoWidth(): this {
    this.widthValue = DisplayUtils.standards.terminalWidth;
    return this;
  }

  padding(padding: number): this {
    this.paddingValue = Math.max(0, padding);
    return this;
  }

  order(strategy: OrderingStrategy): this {
    this.orderingValue = strategy;
    return this;
  }

  layout(): DisplayLayout {
    const totalWidth = this.widthValue || DisplayUtils.standards.terminalWidth;
    const contentWidth = Math.max(totalWidth - this.paddingValue * 2, 20);

    return {
      totalWidth,
      contentWidth,
      padding: this.paddingValue,
      maxItemLength: Math.max(contentWidth - 4, 10),
      ordering: this.orderingValue,
      separatorLength: contentWidth
    };
  }
}

export class DisplayUtils {
  private static logger = createLogger('display-utils');
  private static formatter = new TerminalFormatter();

  static calculate(): DisplayCalculator {
    return new DisplayCalculator();
  }

  static orderServices<T extends { status: string; name: string }>(
    services: T[],
    options: ServiceOrderOptions = {}
  ): T[] {
    const { connectedFirst = true, alphabetical = true } = options;
    let ordered = [...services];

    if (connectedFirst) {
      const activeStatuses = ['connected', 'healthy', 'active'];
      const connected = ordered.filter(service => activeStatuses.includes(service.status));
      const others = ordered.filter(service => !activeStatuses.includes(service.status));

      if (alphabetical) {
        connected.sort((a, b) => a.name.localeCompare(b.name));
        others.sort((a, b) => a.name.localeCompare(b.name));
      }

      ordered = [...connected, ...others];
    } else if (alphabetical) {
      ordered.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.logger.debug('Ordered services', {
      total: services.length,
      connected: ordered.filter(service => service.status === 'connected').length
    });

    return ordered;
  }

  static get standards(): DisplayStandards {
    const terminalWidth = typeof process.stdout?.columns === 'number'
      ? process.stdout.columns
      : 80;

    return {
      terminalWidth,
      minWidth: 40,
      maxWidth: 120,
      defaultPadding: 2,
      borderWidth: 2,
      separatorLength: Math.min(terminalWidth - 4, 60)
    };
  }

  static responsiveWidth(content: string | string[], options: ResponsiveOptions = {}): number {
    const { minWidth, maxWidth, padding = this.standards.defaultPadding } = options;
    const standards = this.standards;

    const values = Array.isArray(content) ? content : [content];
    const contentWidth = values.reduce((max, value) => {
      const width = this.stripAnsi(value).length;
      return Math.max(max, width);
    }, 0);

    const ideal = contentWidth + padding * 2;
    const min = minWidth ?? standards.minWidth;
    const max = maxWidth ?? Math.min(standards.terminalWidth - standards.borderWidth, standards.maxWidth);

    return Math.max(min, Math.min(max, ideal));
  }

  static separator(length = this.standards.separatorLength, style: 'solid' | 'dashed' | 'double' = 'solid'): string {
    return this.formatter.ui.separator(length, style);
  }

  private static stripAnsi(value: string): string {
    return value.replace(/\u001b\[[0-9;]*m/g, '');
  }
}
```

### Migration Example

```typescript
// Before
const terminalWidth = process.stdout.columns || 80;
const contentWidth = terminalWidth - 4;
const items = services.sort((a, b) => a.name.localeCompare(b.name));

// After
const layout = DisplayUtils.calculate().autoWidth().padding(2).layout();
const items = DisplayUtils.orderServices(services);
const separator = DisplayUtils.separator(layout.separatorLength);
```

## Files Using This Pattern

| Component | Migration Focus | Estimated Helpers |
|-----------|-----------------|-------------------|
| `src/interfaces/cli-display-consistency-engine.ts` | Replace bespoke calculator with fluent layout chain | 12 helper methods |
| `src/interfaces/service-ordering-manager.ts` | Swap manual status ordering for `DisplayUtils.orderServices` | 4 ordering helpers |
| `src/rendering/universal-layout-engine.ts` | Normalize width/padding math and separator generation | 6 layout helpers |
| CLI menu + terminal components (≈22 files) | Remove inline padding/width helpers and manual separators | ≈150 duplicated lines |

## Expected Impact

- **Lines reduced**: ≈400 once CLI widgets migrate.
- **Usage footprint**: Common cases collapse to ≤3 chained calls.
- **Consistency**: Terminal output width, item ordering, and separators standardised across adapters.

## Implementation Checklist

**Before migration**
- [ ] Inventory manual width/service ordering helpers in targeted files.
- [ ] Capture terminal width edge cases (narrow terminals, ANSI content).

**During migration**
- [ ] Replace width calculations with `DisplayUtils.calculate()` fluent chains.
- [ ] Apply `DisplayUtils.orderServices` for service state sorting.
- [ ] Swap separator creation with `DisplayUtils.separator`.
- [ ] Wire `TerminalFormatter` output in components that format menu text.

**After migration**
- [ ] Verify CLI layout snapshots for connected/disconnected services.
- [ ] Ensure logging noise stays at debug level only.
- [ ] Update consolidation checklist ticks in `safe-consolidation-candidates.md`.

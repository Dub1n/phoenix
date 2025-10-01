---
date-created: 2025-09-15T10:00:00Z
last-updated: 2025-09-15T10:00:00Z
name: window-utils
description: Chainable window utilities to consolidate border rendering, window layout logic, and modal composition across CLI components
status: established
category: display-ui
use-when:
  - Replacing duplicated border rendering and window layout helpers
  - Building consistent modal/panel shells across terminal components
  - Applying standardized window dimensions, padding, and title alignment
  - Integrating window chrome with the shared formatter and display utilities
keywords:
  - window-utilities
  - ui-consistency
  - border-rendering
  - layout-management
  - terminal-ui
prerequisites:
  - display-utils
  - terminal-formatter
  - logger
related-patterns:
  - display-utils
  - terminal-formatter
  - terminal-ui-components
---

# Window Utils Utility Consolidation Pattern

## Consolidation Snapshot

- **Redundancy count**: Border/layout helpers repeated in ≈15 files (source: `safe-consolidation-candidates.md`).
- **Target reduction**: ≈300 lines of manual window chrome code.
- **Priority**: HIGH within the display group – essential for CLI layout cohesion.

## Problem Statement

Window borders, titles, and modal shells are implemented ad hoc throughout CLI modules. Files such as `src/rendering/content-layout-system.ts` and `src/interfaces/terminal-ui-components.ts` duplicate border characters, padding rules, and width calculations, producing inconsistent visuals and inflating maintenance effort.

### Current State Examples

```typescript
class BorderRenderer {
  renderBorder(width: number, height: number, title: string, borderStyle: string): string {
    // Manual border drawing logic with character arrays
  }
}

function drawModal(content: string[], title: string): string {
  const terminalWidth = process.stdout.columns || 80;
  const modalWidth = Math.min(terminalWidth - 10, content[0].length + 4);
  const borderChar = '#';
  // Manual border and content placement...
}
```

## Solution Overview

Provide a fluent `WindowUtils` builder that composes with `DisplayUtils` and `TerminalFormatter` to render windows in ≤3 calls. The utility must:

- expose `WindowUtils.builder()` returning a chainable builder for width, padding, style, and title options,
- default to ANSI-safe borders and alignment,
- delegate width calculations to `DisplayUtils` where appropriate,
- emit structured debug logs for layout choices.

### Core API Sketch

```typescript
import { createLogger } from './logger';
import { DisplayUtils } from './display-utils';
import { TerminalFormatter } from './terminal-formatter';

type WindowBorderStyle = 'single' | 'double' | 'dashed';

const BORDER_SETS = {
  single: { horizontal: '─', vertical: '│', topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘' },
  double: { horizontal: '═', vertical: '║', topLeft: '╔', topRight: '╗', bottomLeft: '╚', bottomRight: '╝' },
  dashed: { horizontal: '-', vertical: '|', topLeft: '+', topRight: '+', bottomLeft: '+', bottomRight: '+' }
} as const;

const TITLE_ALIGNERS = {
  left: (title: string, width: number) => title.padEnd(width, ' '),
  center: (title: string, width: number) => {
    const trimmed = title.trim();
    const excess = Math.max(width - trimmed.length, 0);
    const leftPad = Math.floor(excess / 2);
    const rightPad = excess - leftPad;
    return `${' '.repeat(leftPad)}${trimmed}${' '.repeat(rightPad)}`;
  },
  right: (title: string, width: number) => title.padStart(width, ' ')
} as const;

interface WindowRenderOptions {
  width?: number;
  height?: number;
  padding?: number;
  style?: WindowBorderStyle;
  title?: string;
  alignTitle?: 'left' | 'center' | 'right';
}

class WindowBuilder {
  private config: WindowRenderOptions = {};

  width(width: number): this {
    this.config.width = Math.max(1, width);
    return this;
  }

  autoWidth(): this {
    this.config.width = DisplayUtils.standards.terminalWidth - 4;
    return this;
  }

  padding(padding: number): this {
    this.config.padding = Math.max(0, padding);
    return this;
  }

  style(style: WindowBorderStyle): this {
    this.config.style = style;
    return this;
  }

  title(title: string, align: 'left' | 'center' | 'right' = 'center'): this {
    this.config.title = title;
    this.config.alignTitle = align;
    return this;
  }

  render(content: string[]): string {
    return WindowUtils.render({ ...this.config, content });
  }
}

export class WindowUtils {
  private static logger = createLogger('window-utils');
  private static formatter = new TerminalFormatter();

  static builder(): WindowBuilder {
    return new WindowBuilder();
  }

  static render({ content, width, height, padding = 1, style = 'single', title, alignTitle = 'center' }: WindowRenderOptions & { content: string[] }): string {
    const chars = BORDER_SETS[style];
    const resolvedWidth = Math.max(width ?? DisplayUtils.responsiveWidth(content, { padding }), 4);
    const innerWidth = Math.max(resolvedWidth - 2, 1);

    const header = this.composeHeader(innerWidth, chars, title, alignTitle);
    const body = this.composeBody({ content, innerWidth, padding, vertical: chars.vertical, requestedHeight: height });
    const footer = `${chars.bottomLeft}${chars.horizontal.repeat(innerWidth)}${chars.bottomRight}`;

    this.logger.debug('Rendered window', { width: resolvedWidth, height: body.length + 2, style, padding, titleLength: title?.length ?? 0 });
    return [header, ...body, footer].join('\n');
  }

  private static composeHeader(innerWidth: number, chars: typeof BORDER_SETS[WindowBorderStyle], title?: string, align: 'left' | 'center' | 'right' = 'center'): string {
    if (!title || title.trim().length === 0) {
      return `${chars.topLeft}${chars.horizontal.repeat(innerWidth)}${chars.topRight}`;
    }

    const aligned = TITLE_ALIGNERS[align](title, innerWidth).slice(0, innerWidth);
    const separator = this.stripAnsi(this.formatter.ui.separator(innerWidth, 'solid'));
    const merged = this.mergeTitle(separator, aligned);
    return `${chars.topLeft}${merged}${chars.topRight}`;
  }

  private static composeBody({ content, innerWidth, padding, vertical, requestedHeight }: { content: string[]; innerWidth: number; padding: number; vertical: string; requestedHeight?: number }): string[] {
    const usableWidth = Math.max(innerWidth - padding * 2, 1);
    const lines = content.map(line => `${vertical}${' '.repeat(padding)}${this.padLine(line, usableWidth)}${' '.repeat(padding)}${vertical}`);

    if (requestedHeight && requestedHeight > lines.length) {
      const filler = `${vertical}${' '.repeat(innerWidth)}${vertical}`;
      while (lines.length < requestedHeight) {
        lines.push(filler);
      }
    }

    return lines;
  }

  private static mergeTitle(separator: string, title: string): string {
    if (title.length >= separator.length) {
      return title.slice(0, separator.length);
    }
    const start = Math.max(Math.floor((separator.length - title.length) / 2), 0);
    const prefix = separator.slice(0, start);
    const suffix = separator.slice(start + title.length);
    return `${prefix}${title}${suffix}`;
  }

  private static padLine(value: string, width: number): string {
    const stripped = this.stripAnsi(value);
    if (stripped.length > width) {
      const truncated = stripped.slice(0, Math.max(width - 3, 0));
      return `${truncated}${width >= 3 ? '...' : ''}`.padEnd(width, ' ');
    }
    return stripped.padEnd(width, ' ');
  }

  private static stripAnsi(value: string): string {
    return value.replace(/\u001b\[[0-9;]*m/g, '');
  }
}
```

### Migration Example

```typescript
// Before
function drawModal(content: string[], title: string): string {
  // manual width + border management
}

// After
const modal = WindowUtils.builder()
  .autoWidth()
  .padding(2)
  .style('double')
  .title('Services')
  .render(contentLines);
```

## Files Using This Pattern

| Component | Migration Focus | Estimated Helpers |
|-----------|-----------------|-------------------|
| `src/rendering/content-layout-system.ts` | Replace `BorderRenderer` + layout math with `WindowUtils.builder()` | 8 helpers |
| `src/interfaces/terminal-ui-components.ts` | Standardize modal/panel rendering | 5 helpers |
| CLI dialog components (≈8 files) | Remove bespoke border characters + padding logic | ≈120 lines |

## Expected Impact

- **Lines reduced**: ≈300 across terminal UI.
- **Usage footprint**: Window shells rendered in ≤3 chained calls.
- **Consistency**: Shared border styles and title alignment across CLI components.

## Implementation Checklist

**Before migration**
- [ ] Capture existing border styles, title placements, and padding defaults.
- [ ] Identify shared content formatting needs (wrapping, truncation).

**During migration**
- [ ] Replace manual border builders with `WindowUtils.builder()`.
- [ ] Route width calculations through `DisplayUtils.responsiveWidth`.
- [ ] Use formatter-provided characters for all borders.

**After migration**
- [ ] Validate modal rendering in a narrow and wide terminal.
- [ ] Confirm debug logging is only emitted at `DEBUG` level.
- [ ] Update consolidation checklist for window utilities.

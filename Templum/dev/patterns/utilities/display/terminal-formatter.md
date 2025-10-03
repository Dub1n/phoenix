---
date-created: 2025-09-14T17:45:00Z
last-updated: 2025-10-02T16:26:03Z
name: terminal-formatter
description: Semantic formatter consolidating chalk usage into a capability-aware, cache-backed API for terminal output consistency
status:
  - "[x]"
category: display-ui
use-when:
  - Consolidating duplicated chalk styling across CLI, rendering, and diagnostic modules.
  - Requiring capability-aware fallbacks for terminals lacking color or Unicode support while preserving semantic cues.
  - Providing one-line helpers for status, UI chrome, and system output within skin-driven flows.
keywords:
  - terminal-formatter
  - semantic-formatting
  - cli-consistency
  - capability-detection
prerequisites:
  - logger
  - display-utils
  - theme-utils
related-patterns:
  - display-utils
  - window-utils
  - chainable-string-utils
  - async-utils
---

# Terminal Formatter Utility Pattern

## Consolidation Snapshot

- **Redundancy**: 266 direct `chalk` calls spread across 13 high-traffic modules (validated with `rg -c "chalk" Templum/src`).
- **Top offenders**: `src/mcp-channel/src/visual-feedback-system.ts` (47), `src/cli-entry.ts` (51), `src/interfaces/cli-adapter-abstracted.ts` (44), `src/interfaces/terminal-ui-components.ts` (35), `src/interfaces/interactive-menu-renderer.ts` (27).
- **Impact**: ≈200 duplicated lines eliminated; guarantees uniform accessibility prefixes and fallback behaviour.
- **Priority**: HIGH within display utilities—standardises CLI output before migration work on windows and layout helpers.

## Problem Statement

Terminal output currently mixes raw `chalk` calls, ad-hoc glyphs, and inconsistent fallbacks. This causes:

- Divergent styling per module, leading to visually jarring context switches.
- Accessibility regressions when Unicode or colour support is absent (many branches omit textual prefixes altogether).
- Repeated capability detection logic and manual ANSI stripping across rendering code.
- A fragile migration path—every new CLI feature repeats the same styling boilerplate.

### Redundancy Evidence

Captured via `rg -c "chalk" Templum/src`:

| File | Direct `chalk` references | Notes |
|------|--------------------------|-------|
| `Templum/src/mcp-channel/src/visual-feedback-system.ts` | 47 | Status/completion banners, inline diagnostics |
| `Templum/src/cli-entry.ts` | 51 | Boot banners, menu prompts, progress output |
| `Templum/src/interfaces/cli-adapter-abstracted.ts` | 44 | Menu rendering, error messaging |
| `Templum/src/interfaces/terminal-ui-components.ts` | 35 | Theme definitions with scattered styling |
| `Templum/src/interfaces/interactive-menu-renderer.ts` | 27 | Selection highlighting, paging hints |
| `Templum/src/interfaces/navigation/border-renderer.ts` | 19 | Border glyph definitions |
| `Templum/src/rendering/content-layout-system.ts` | 9 | Section headers, separators |
| `Templum/src/interfaces/enhanced-window-system.ts` | 9 | Focused window chrome |
| `Templum/src/rendering/universal-layout-engine.ts` | 7 | Layout diagnostics |
| `Templum/src/interfaces/terminal-compatibility-detector.ts` | 5 | Capability probes duplicating formatter logic |
| `Templum/src/interfaces/universal-interaction-manager.ts` | 4 | Inline prompts |
| `Templum/src/interfaces/navigation/width-calculator.ts` | 3 | Border previews |
| `Templum/src/interfaces/window-layout-manager.ts` | 1 | Legacy heading styling |
| `Templum/src/utils/terminal-formatter.ts` | 5 | Existing formatter internals; once consolidated, no other modules keep direct `chalk` imports |

## Solution Overview

Design a capability-aware, semantic formatter that compresses all terminal styling into one minimal-footprint API. The implementation uses the `TerminalFormatter` class, keeping consumption to one-line calls while handling theme integration, Unicode fallbacks, and caching internally.

### Design Goals

- **Semantic methods** (`formatter.status.error(...)`) hide `chalk` usage entirely.
- **Automatic capability detection** eliminates per-module probing and ensures accessibility prefixes.
- **Cache-backed formatting** accelerates repeated strings (menus, prompts, status banners) and exposes telemetry to confirm performance targets.
- **Theme integration first**: merges caller overrides with default palette and remains compatible with `theme-utils`.
- **Fluent usage**: zero configuration for common flows, optional call to `createFormatter(...)` when custom themes or capabilities are needed.

### Minimal API Surface

```typescript
import { TerminalFormatter, createFormatter } from '../../utils/terminal-formatter';

const formatter = new TerminalFormatter();
// or const formatter = createFormatter(customTheme, detectedCapabilities);

console.log(formatter.status.error('Connection failed'));
process.stdout.write(formatter.ui.header('Main Menu'));
console.log(formatter.data.table(services, { highlightRow: 0 }));
console.log(formatter.system.path('/var/log/templum.log'));
```

All helpers return pure strings, making them safe for logging, piping, or composing with other utilities.

### Capability Detection & Fallbacks

- `TerminalFormatter.detectCapabilities()` inspects colour depth, Unicode support, width, and interactivity once per formatter instance.
- Methods automatically fall back to `[ERROR]`/`[OK]` prefixes, ASCII borders (`-`, `=`), and plain prompts when colour or Unicode support is absent.
- `formatter.getCapabilities()` returns a read-only snapshot for downstream decisions (e.g., disabling emoji-driven loaders in restricted terminals).
- `TerminalFormatter.withFallback(text, fallback)` provides a static helper for edge cases where inline fallbacks are still needed during migration.

### Cache & Telemetry Features

- A bounded cache (200 entries) stores frequently reused strings (status lines, separators, prompts, navigation arrows, standard menu entries).
- Internal eviction keeps memory predictable (10% FIFO when full).
- `formatter.getCacheStats()` exposes `{ entries, hits, misses, hitRate }`, enabling quick verification that repeated usage benefits from caching.
- `formatter.clearCache()` exists for long-lived CLI sessions that change themes or capabilities mid-run.

### Integration Touchpoints

- **Logger/error handler**: wrap formatter output inside logger calls (`log.info(formatter.status.success(...))`) to keep terminals, logs, and telemetry aligned.
- **Display utils & window utils**: reuse `formatter.ui.separator(...)` and `formatter.ui.header(...)` inside those utilities to ensure shared chrome.
- **Theme utils**: pass resolved themes into `createFormatter(theme)` so colour palettes remain consistent across the display stack.

## Before / After Illustration

```typescript
// Before: scattered chalk usage (cli-entry.ts)
console.log(chalk.yellow.bold('== Starting Template Sync =='));
console.log(chalk.gray('> Connecting to discovery service...'));
console.log(chalk.green('✓ Complete'));

// After: semantic formatter
console.log(formatter.ui.header('Starting Template Sync'));
console.log(formatter.status.info('Connecting to discovery service...'));
console.log(formatter.status.success('Complete'));
```

## Files Using This Pattern

Migration priority should follow the heaviest duplication first:

1. `Templum/src/mcp-channel/src/visual-feedback-system.ts`
2. `Templum/src/cli-entry.ts`
3. `Templum/src/interfaces/cli-adapter-abstracted.ts`
4. `Templum/src/interfaces/terminal-ui-components.ts`
5. `Templum/src/interfaces/interactive-menu-renderer.ts`
6. `Templum/src/interfaces/navigation/border-renderer.ts`
7. `Templum/src/rendering/content-layout-system.ts`
8. `Templum/src/interfaces/enhanced-window-system.ts`
9. `Templum/src/rendering/universal-layout-engine.ts`
10. `Templum/src/interfaces/terminal-compatibility-detector.ts`
11. `Templum/src/interfaces/universal-interaction-manager.ts`
12. `Templum/src/interfaces/navigation/width-calculator.ts`
13. `Templum/src/interfaces/window-layout-manager.ts`
14. Remaining CLI diagnostics and legacy helpers surfaced via `rg -o "chalk"` sweeps.

## Migration Strategy

1. **Introduce formatter**: import `TerminalFormatter` (or the shared instance supplied by adapter bootstrap). Replace raw `chalk` imports.
2. **Map semantics**:
   - `chalk.red.bold` → `formatter.status.error`
   - `chalk.green` → `formatter.status.success`
   - `chalk.yellow` warnings → `formatter.status.warning`
   - Section banners / separators → `formatter.ui.header` / `formatter.ui.separator`
   - Inline prompts → `formatter.ui.prompt`
3. **Bundle context**: when messages include dynamic data, format the message first, then pass the final string to the formatter for consistency.
4. **Fallback validation**: call `formatter.getCapabilities()` during migration to verify glyph choices in constrained environments.
5. **Remove duplicated helpers**: delete local capability probes, border glyph arrays, and ANSI-stripping utilities once the formatter is integrated.
6. **Wire caching telemetry (optional)**: after migrating a module, log `formatter.getCacheStats()` during smoke tests to confirm cache warmup.

## Implementation Guidelines

- Keep formatter usage stateless: instantiate once per CLI session or inject through adapters.
- Prefer `createFormatter` in dependency-injection contexts so tests can supply mocked capabilities.
- Combine with `display-utils` for layout calculations; let formatter focus solely on string styling.
- Use `formatter.clearCache()` only when switching themes mid-session; otherwise allow natural eviction to maintain hit rates.
- When adding new semantic helpers, extend the `STATUS_GLYPHS` map and expose corresponding theme entries to maintain accessibility.

## Validation Checklist

### Before Implementation
- [ ] Capture current `chalk` reference counts per file (`rg -o "chalk"`).
- [ ] Snapshot terminal capability requirements for the target modules (Unicode usage, colour depth assumptions).
- [ ] Confirm theme dependencies—identify any modules using bespoke palettes that must move into `theme-utils` first.

### During Implementation
- [ ] Replace imports with `TerminalFormatter` or `createFormatter` and ensure only formatter methods remain.
- [ ] Verify semantics: each replacement must map to an appropriate formatter method (status/UI/data/interactive/system).
- [ ] Ensure accessibility by manually testing a no-colour scenario (`FORCE_COLOR=0 node ...`) or by injecting capabilities with `supportsUnicode: false`.
- [ ] Monitor `formatter.getCacheStats()` in dev runs to confirm cache hit rate trends upward (>70% after warm-up loops).

### After Implementation
- [ ] Run CLI smoke scripts (see `meta/workflows/milestone-01-templum-haruspex-skin-handshake.md`) and confirm output parity.
- [ ] Re-run `rg -o "chalk"` to ensure only `src/utils/terminal-formatter.ts` retains direct `chalk` usage.
- [ ] Document migration progress in `safe-consolidation-candidates.md` (tick the pattern row, note files completed).
- [ ] Add or update module-level tests/scripts to cover fallback behaviour, cache stats, and theme overrides.

## Success Metrics

- **Direct `chalk` references** reduced from 279 → ≤10 (utility-only) per release.
- **Cache hit rate** ≥75% for repeated status or navigation calls after 25 iterations.
- **Fallback coverage**: 100% of status/feedback messages include textual prefixes when colours are disabled.
- **Consistency**: All CLI/UI modules render headers, separators, and prompts using formatter helpers, verified via spot-check diffs.

## Future Enhancements

- Precompute high-usage menu frames during idle periods using `formatter.getCacheStats()` to identify candidates.
- Expose structured theme diagnostics (contrast ratios, accessibility scores) for integration with release gates.
- Evaluate sharing formatter instances across projects (e.g., Haruspex) once migration totals demonstrate stability.

This pattern provides the canonical, capability-aware formatter that underpins every terminal-facing experience in Templum. Adhering to it ensures semantic, accessible, and maintainable output across all adapters.

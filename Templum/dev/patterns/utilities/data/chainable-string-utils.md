---
date-created: 2025-09-14T00:00:00Z
last-updated: 2025-10-02T20:23:30Z
name: chainable-string-utils
description: Chainable string utility unifying truncation, padding, wrapping, and casing for CLI and renderer outputs.
status:
  - "[x]"
category: data-management
use-when:
  - CLI or renderer code needs consistent trimming, padding, or wrapping behaviour without bespoke helpers.
  - Service or skin adapters must format text for fixed-width layouts while keeping call sites terse.
  - Validation or logging pipelines require deterministic casing or truncation before display.
keywords:
  - string-utils
  - chainable-api
  - text-formatting
  - cli-output
prerequisites:
  - logger
  - error-handler
  - terminal-formatter
related-patterns:
  - display-utils
  - validator
  - terminal-formatter
---

# Chainable String Utils Utility Pattern

## Consolidation Snapshot

- **Redundancy count**: ≈10 TypeScript files repeat home-grown string helpers (~80 duplicated LOC) per `safe-consolidation-candidates.md`.
- **Primary offenders**: `src/interfaces/cli-adapter.ts`, `src/interfaces/terminal-ui-components.ts`, `src/interfaces/border-renderer.ts`, `src/interfaces/navigation/border-renderer.ts`, `src/interfaces/layout-normalizer.ts`, `src/interfaces/navigation/width-calculator.ts`, `src/rendering/universal-layout-engine.ts`, `src/rendering/content-layout-system.ts`, `src/scripts/run-phase6-integration-validation.ts`, `src/scripts/simple-phase6-validation.ts`.
- **Drift symptoms**: inconsistent ellipsis width, ad-hoc padding, missing double-width protection, and silent column overflow in terminal layouts.
- **Target outcome**: one fluent helper covers truncation, padding, wrapping, casing, whitespace normalisation, and safe display width detection with logger-driven diagnostics.

## Problem Statement

CLI and renderer layers frequently reshape strings before display. Each module performs manual `padStart`, `padEnd`, `slice`, and regex trimming, often forgetting to strip ANSI codes or apply consistent ellipses. Differences between terminal width assumptions (60, 80, 120 columns) lead to uneven tables and clipped prompts, while duplicated fallback code obscures regressions and complicates localisation.

## Solution Overview

Provide a minimal-footprint `StringUtils` module exposing chainable operations and one-line convenience methods. The module must:

1. Preserve fluent chaining so call sites read as mini pipelines (`stringy(label).trim().truncate(24).pad(28, 'right').value()`).
2. Normalise width calculations using `terminal-formatter` for ANSI-aware length detection and Unicode-safe truncation.
3. Emit structured logs when operations modify text beyond configured thresholds (e.g., truncation ellipsis applied), surfacing drift through the shared logger.
4. Share error taxonomy with `error-handler` for predictable failure handling in validation and rendering flows.
5. Export TypeScript types so consumers can extend behaviour (e.g., supply custom wrappers) without breaking substitution.

## Minimal Footprint API

```typescript
export interface ChainOptions {
  mode?: 'terminal' | 'plain';
  ellipsis?: string;
  trim?: 'none' | 'start' | 'end' | 'both';
}

export interface ChainResult {
  value: string;
  truncated: boolean;
  wrapped: boolean;
  width: number;
}

export interface StringChain {
  truncate(maxWidth: number, ellipsis?: string): StringChain;
  pad(width: number, alignment?: 'left' | 'right' | 'center'): StringChain;
  wrap(width: number, options?: { hard?: boolean; indent?: number }): StringChain;
  convertCase(style: 'upper' | 'lower' | 'title' | 'sentence'): StringChain;
  collapseWhitespace(mode?: 'spaces' | 'all'): StringChain;
  ensureSuffix(suffix: string): StringChain;
  value(): string;
  inspect(): ChainResult;
}

export interface StringUtils {
  chain(input: string, options?: ChainOptions): StringChain;
  truncate(input: string, width: number, ellipsis?: string): string;
  pad(input: string, width: number, alignment?: 'left' | 'right' | 'center'): string;
  wrap(input: string, width: number, options?: { hard?: boolean; indent?: number }): string[];
}
```

- `StringUtils.chain` is the fluent entry point.
- Convenience helpers (`truncate`, `pad`, `wrap`) call into the chain under the hood for consistency.
- Operations are ANSI-safe and rely on a shared width calculator that strips escape codes before measuring.

## Implementation Blueprint

1. **Width & Glyph Awareness**: Use `terminal-formatter` to detect terminal capabilities and capture printable width (`stripAnsi` + `wcwidth`). Provide fallbacks when capabilities are unavailable (e.g., non-TTY). Cache width detectors per mode.
2. **Builder Composition**: Represent each step as a pure function in an internal pipeline. The chain stores the latest value plus metadata flags to report truncation/wrapping decisions.
3. **Logging & Diagnostics**: Inject `createLogger('string-utils')`; log at `debug` when operations alter text length or casing beyond defaults, and `warn` when truncation removed >30% content or wrap overflow occurs.
4. **Error Surface**: Push fatal configuration issues (e.g., negative widths) through `error-handler`. Consumer code should never throw raw `RangeError` or `TypeError`.
5. **Type-Safe Extensions**: Expose `StringChain` as an interface and return plain objects so future mixins (e.g., `ansiStyle()`) can compose without breaking substitution.
6. **Batch Operations**: Provide helper to process arrays (`formatList(items, config)`) to support CLI menus previously assembling strings manually.

## Integration Contracts

- **Display Utils**: `display-utils.ts` obtains layout widths. Replace manual padding with `StringUtils.chain` to guarantee consistent separators.
- **Terminal Formatter**: share width detection and fallback glyphs for ellipses (`…` vs `...`).
- **Validator**: leverage `StringUtils.truncate` before logging validation messages to keep CLI summary columns aligned.
- **Logger/Error Handler**: all warnings/errors route through existing utilities for observability.

## Migration Plan

1. Replace ad-hoc helpers with `StringUtils` in identified files, starting with `cli-adapter` and renderer modules that drive terminal output.
2. Centralise constants for ellipsis (`'…'`) and padding widths via the utility configuration rather than scattering numeric literals.
3. Introduce `formatTableCell` helper wrapping `StringUtils.chain().truncate().pad()` for table builders.
4. Remove duplicated regex-based trim/pad implementations after successful adoption.
5. Document new API usage in component-level README or inline references to this pattern.

## Validation & Regression Checklist

- [x] Cover trimming permutations (`trimStart`, `trimEnd`, `trimBoth`) including ANSI-colour strings (`src/tests/utils/chainable-string-utils.test.ts`).
- [x] Validate padding alignment for even/odd widths and double-width Unicode characters (see `pad respects double-width glyphs` test in `chainable-string-utils.test.ts`).
- [x] Exercise wrapping for hard-break and soft-break modes (utility + integration suites for CLI/navigation).
- [x] Add regression tests ensuring truncation preserves ellipsis width, never overflows configured column, and handles strings shorter than `maxWidth` (unit coverage + `truncate leaves shorter strings untouched`).
- [ ] Snapshot CLI outputs (service status tables, validation run summaries) before/after migration to confirm visual parity — existing integration suites assert runtime behaviour; snapshot refresh still pending if CLI redesign triggers deltas.

## Test Strategy

- Unit tests live under `tests/interfaces` covering each public method with examples drawn from CLI adapters, including ANSI and plain text cases.
- Property-based tests (optional) ensure random strings never exceed requested width when truncated/padded.
- Integration smoke tests reuse existing CLI rendering snapshots; add gating to fail if width calculations exceed terminal width from `display-utils`.

## Success Metrics

- Reduce bespoke `padStart`, `padEnd`, `slice`, and regex helpers by ≥80 lines across the ten identified modules.
- Achieve one-line usage for the 12 highest-traffic call sites measured in `pattern-usage-analysis.md`.
- Eliminate column overflow bugs recorded in `observability-instrumentation` dashboard for CLI outputs.
- Maintain ≥90% unit test coverage for the utility module; add CLI snapshot baselines for regression detection.

## Future Extensions

- Optional `localize()` hook to integrate with localisation pipelines without rewriting the formatter.
- Potential `StringChain.segment()` add-on using `Intl.Segmenter` when environments support it, defaulting to current wrap logic.
- Hooks for analytics instrumentation to log frequent truncation scenarios for UX tuning.

---
date-created: 2025-09-14T20:00:00Z
last-updated: 2025-09-14T20:00:00Z
name: theme-utils
description: Centralized theme management utility for dynamic theme loading, switching, palette operations, and interface-specific adaptations across the Universal Skin Engine ecosystem
status: established
category: display-ui
use-when:
  - Dynamic theme switching and loading must be shared across interfaces
  - Color palette calculations or format conversions are duplicated
  - Interface-specific adaptations (CLI ANSI, VSCode CSS, command output) need to stay consistent
  - Theme caching/performance optimisations should be reusable
keywords:
  - theme-management
  - color-palette
  - interface-adaptations
  - dynamic-theming
  - performance-optimisation
prerequisites:
  - universal-skin-definition
  - logger
  - display-utils
related-patterns:
  - display-utils
  - pcl-rendering-integration-bridge
  - universal-interface-orchestration
---

# Theme Utils Utility Consolidation Pattern

## Consolidation Snapshot

- **Redundancy count**: Theme-loading, color conversion, and interface adaptation logic repeated across ~8 files (source: `safe-consolidation-candidates.md`).
- **Target reduction**: ≈150 lines of theme plumbing.
- **Priority**: HIGH within display category – ensures cross-interface consistency.

## Problem Statement

Theme management is scattered: CLI adapters hand-roll ANSI colors, VSCode webviews define their own CSS variables, and rendering components repeat palette inheritance logic. This duplication causes drift whenever theme definitions change, and lacks shared caching/performance handling.

### Current State Examples

```typescript
const themeData = skin.themes?.[activeTheme] || skin.theme || defaultTheme;
const ansiColor = `\u001b[38;2;${rgb.r};${rgb.g};${rgb.b}m`;
const cssVars = Object.entries(theme.colors).map(([key, value]) => `--templum-${key}: ${value};`);
```

## Solution Overview

Create a `ThemeUtils` facade that:

- resolves theme inheritance from a `UniversalSkinDefinition` in one call (`ThemeUtils.loadTheme`),
- provides formatted palette access (`ThemeUtils.colors.get('primary', 'ansi')`),
- caches resolved themes per skin/interface,
- generates interface-specific adaptations (CLI ANSI, VSCode CSS, plain strings),
- emits debug logging while preserving minimal call footprint for consumers.

### Core API Sketch

```typescript
import { createLogger } from './logger';
import type {
  UniversalSkinDefinition,
  ThemeDefinition,
  InterfaceType
} from '../types/universal-skin-definition';

type PaletteFormat = 'hex' | 'rgb' | 'ansi';

interface LoadThemeOptions {
  useCache?: boolean;
  validate?: boolean;
}

interface ThemeAdaptations {
  cli: Record<string, string>;
  vscode: Record<string, string>;
  command: Record<string, string>;
}

export class ThemeUtils {
  private static logger = createLogger('theme-utils');
  private static themeCache = new Map<string, ResolvedTheme>(); // skinId:themeId -> resolved

  static async loadTheme(
    skin: UniversalSkinDefinition,
    themeId?: string,
    options: LoadThemeOptions = {}
  ): Promise<ResolvedTheme> {
    const targetId = themeId ?? skin.defaultTheme ?? Object.keys(skin.themes ?? {})[0];
    const cacheKey = `${skin.id}:${targetId}`;

    if (options.useCache !== false && this.themeCache.has(cacheKey)) {
      this.logger.debug('Theme load satisfied from cache', { skinId: skin.id, themeId: targetId });
      return this.themeCache.get(cacheKey)!;
    }

    const theme = this.resolveDefinition(skin, targetId);
    const resolved: ResolvedTheme = {
      id: targetId,
      colors: this.resolvePalette(theme.colors, skin),
      typography: theme.typography,
      spacing: theme.spacing,
      metadata: { parentChain: this.parentChain(skin, targetId) },
      adaptations: this.buildAdaptations(theme)
    };

    if (options.validate !== false) {
      this.validate(resolved);
    }

    this.themeCache.set(cacheKey, resolved);
    return resolved;
  }

  static getColor(theme: ResolvedTheme, token: string, format: PaletteFormat = 'hex'): string {
    const source = theme.colors[token];
    if (!source) {
      throw new Error(`Theme color token not found: ${token}`);
    }
    return this.convert(source, format);
  }

  static getAdaptations(theme: ResolvedTheme, interfaceType: InterfaceType): Record<string, string> {
    return theme.adaptations[interfaceType];
  }

  // Helper implementations omitted: resolveDefinition, resolvePalette, convert, buildAdaptations, validate, parentChain.
}
```

### Migration Example

```typescript
// Before
const themeData = skin.themes?.[activeTheme] || skin.theme;
const ansiPrimary = convertToAnsi(themeData.colors.primary);
const cssVars = Object.entries(themeData.colors).reduce((vars, [key, value]) => {
  vars[`--templum-${key}`] = value;
  return vars;
}, {} as Record<string, string>);

// After
const theme = await ThemeUtils.loadTheme(skin, activeTheme);
const ansiPrimary = ThemeUtils.getColor(theme, 'primary', 'ansi');
const cssVars = ThemeUtils.getAdaptations(theme, 'vscode');
```

## Files Using This Pattern

| Component | Migration Focus | Estimated Helpers |
|-----------|-----------------|-------------------|
| `src/skin/universal-skin-engine.ts` | Replace manual theme inheritance + caching | 6 helpers |
| `src/rendering/universal-layout-engine.ts` | Consume resolved palettes for layout accents | 4 helpers |
| `src/interfaces/cli-adapter.ts` | Swap ANSI conversions to `ThemeUtils.getAdaptations('cli')` | 3 helpers |
| `src/interfaces/vscode-adapter.ts` | Build CSS vars from `ThemeUtils.getAdaptations('vscode')` | 2 helpers |
| PCL rendering bridge components | Use shared palette conversion | 2 helpers |

## Expected Impact

- **Lines reduced**: ≈150 lines of theme/color plumbing.
- **Usage footprint**: Loading + adaptations in ≤3 lines per consumer.
- **Consistency**: Identical palettes across CLI, VSCode, and command outputs with shared caching.

## Implementation Checklist

**Before migration**
- [ ] Catalogue all manual theme loads and color conversions.
- [ ] Capture inheritance/override rules currently applied in skins.

**During migration**
- [ ] Replace theme loads with `ThemeUtils.loadTheme` and enforce caching.
- [ ] Map existing ANSI/CSS conversions to `getColor`/`getAdaptations`.
- [ ] Log theme switches via the shared logger for traceability.

**After migration**
- [ ] Validate CLI/VSCode theming visually.
- [ ] Benchmark theme switching to confirm caching wins.
- [ ] Update consolidation checklist to reflect migrated files.

---
date: 2025-09-14T174500Z
name: terminal-formatter-utility-pattern
TASK-ID: ["TASK-FORMAT-001"]
category: Terminal Formatting
status: ["[x]"]
patterns: ["semantic-api-consolidation", "auto-fallback-detection", "heuristic-optimization"]
components: ["SemanticFormatter", "CapabilityDetector", "FormatterCache", "ThemeValidator"]
dependencies: ["chalk", "existing-theme-systems"]
tags: ["terminal", "formatting", "optimization", "consolidation", "semantic-api"]
---

# Terminal Formatter Utility Pattern

## Intelligence Briefing Summary

**Problem**: 279+ individual chalk calls scattered across codebase creating maintenance overhead, inconsistent formatting, and performance issues.

**Solution**: Consolidate into semantic formatting API with auto-fallback, theme integration, and heuristic optimization.

**Confidence**: High - Based on existing theme system analysis and comprehensive chalk usage patterns identified.

## Pattern Overview

### Core Concept
Transform direct chalk calls from imperative color/style commands into semantic, context-aware formatting APIs that automatically adapt to terminal capabilities and provide consistent theming.

### Before (Current State)
```typescript
// Scattered throughout codebase - 279+ instances
console.log(chalk.red.bold('Error: Something failed'));
process.stdout.write(chalk.blue('Info: ') + chalk.gray('Processing...'));
const header = chalk.cyan.underline('=== Main Menu ===');
const success = chalk.green('✓ Complete');
```

### After (Pattern Implementation)
```typescript
// Semantic, consolidated API
console.log(formatter.status.error('Something failed'));
process.stdout.write(formatter.status.info('Processing...'));
const header = formatter.ui.header('Main Menu');
const success = formatter.status.success('Complete');
```

## Architecture Components

### 1. SemanticFormatter (Core API)

**Purpose**: Primary interface providing contextual formatting methods

```typescript
export interface SemanticFormatterAPI {
  // Status Messages
  status: {
    success(message: string): string;
    error(message: string): string;
    warning(message: string): string;
    info(message: string): string;
    debug(message: string): string;
  };
  
  // UI Elements
  ui: {
    header(text: string, level?: 1 | 2 | 3): string;
    separator(length?: number, style?: 'solid' | 'dashed' | 'double'): string;
    menu(items: MenuItem[], selectedIndex?: number): string;
    prompt(question: string, type?: 'input' | 'confirm' | 'select'): string;
    breadcrumb(path: string[]): string;
  };
  
  // Data Presentation
  data: {
    table(data: any[], options?: TableOptions): string;
    progress(current: number, total: number, message?: string): string;
    highlight(text: string, pattern: string | RegExp): string;
    code(snippet: string, language?: string): string;
  };
  
  // Interactive Elements
  interactive: {
    selection(text: string, isSelected: boolean): string;
    navigation(direction: 'up' | 'down' | 'left' | 'right'): string;
    feedback(type: 'loading' | 'thinking' | 'processing', message?: string): string;
  };
  
  // System Integration
  system: {
    timestamp(date?: Date): string;
    path(filepath: string): string;
    command(cmd: string): string;
    version(version: string): string;
  };
}
```

### 2. CapabilityDetector (Auto-Fallback System)

**Purpose**: Detect terminal capabilities and provide graceful degradation

```typescript
export interface TerminalCapabilities {
  supportsColor: boolean;
  supports256Colors: boolean;
  supportsTrueColor: boolean;
  supportsStyles: boolean;
  width: number;
  height: number;
  isInteractive: boolean;
  platform: 'windows' | 'unix' | 'browser';
}

export class CapabilityDetector {
  private capabilities: TerminalCapabilities;
  private detectionCache = new Map<string, any>();

  constructor() {
    this.capabilities = this.detectCapabilities();
  }

  public getCapabilities(): TerminalCapabilities {
    return { ...this.capabilities };
  }

  public canUseFeature(feature: string): boolean {
    if (this.detectionCache.has(feature)) {
      return this.detectionCache.get(feature);
    }

    const result = this.performFeatureDetection(feature);
    this.detectionCache.set(feature, result);
    return result;
  }

  private detectCapabilities(): TerminalCapabilities {
    return {
      supportsColor: this.detectColorSupport(),
      supports256Colors: this.detect256ColorSupport(),
      supportsTrueColor: this.detectTrueColorSupport(),
      supportsStyles: this.detectStyleSupport(),
      width: process.stdout.columns || 80,
      height: process.stdout.rows || 24,
      isInteractive: process.stdin.isTTY || false,
      platform: this.detectPlatform()
    };
  }

  private performFeatureDetection(feature: string): boolean {
    switch (feature) {
      case 'emoji':
        return this.capabilities.platform !== 'windows' || this.isWindowsTerminalModern();
      case 'unicode-borders':
        return this.capabilities.supportsColor;
      case 'progress-animations':
        return this.capabilities.isInteractive && this.capabilities.supportsColor;
      case 'interactive-menus':
        return this.capabilities.isInteractive;
      default:
        return false;
    }
  }
}
```

### 3. FormatterCache (Heuristic Optimization)

**Purpose**: Cache formatted strings and optimize repeated patterns

```typescript
export class FormatterCache {
  private cache = new Map<string, string>();
  private accessCount = new Map<string, number>();
  private patternDetector = new PatternDetector();
  
  // Maximum cache entries before cleanup
  private readonly MAX_CACHE_SIZE = 1000;
  // Cache hit threshold for permanent storage
  private readonly PERMANENT_THRESHOLD = 5;

  public getCachedOrFormat(key: string, formatter: () => string): string {
    // Check cache first
    if (this.cache.has(key)) {
      this.incrementAccessCount(key);
      return this.cache.get(key)!;
    }

    // Format and cache
    const formatted = formatter();
    this.cache.set(key, formatted);
    this.accessCount.set(key, 1);

    // Detect patterns for optimization
    this.patternDetector.analyze(key, formatted);

    // Cleanup if needed
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      this.performCacheCleanup();
    }

    return formatted;
  }

  public getOptimizationStats(): {
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    commonPatterns: string[];
  } {
    return this.patternDetector.getStats();
  }

  private performCacheCleanup(): void {
    // Remove least frequently accessed items
    const entries = Array.from(this.accessCount.entries())
      .sort(([, a], [, b]) => a - b);
    
    const toRemove = Math.floor(this.MAX_CACHE_SIZE * 0.3); // Remove 30%
    
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      const [key] = entries[i];
      if (this.accessCount.get(key)! < this.PERMANENT_THRESHOLD) {
        this.cache.delete(key);
        this.accessCount.delete(key);
      }
    }
  }
}
```

### 4. ThemeValidator (Confidence Validation)

**Purpose**: Validate formatting works across different terminals and themes

```typescript
export class ThemeValidator {
  private validationResults = new Map<string, ValidationResult>();
  
  public validateFormatter(formatter: SemanticFormatter): ValidationReport {
    const report: ValidationReport = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };

    // Test color combinations
    this.validateColorContrast(formatter, report);
    
    // Test terminal compatibility
    this.validateTerminalCompatibility(formatter, report);
    
    // Test theme consistency
    this.validateThemeConsistency(formatter, report);
    
    // Test accessibility
    this.validateAccessibility(formatter, report);

    return report;
  }

  private validateColorContrast(formatter: SemanticFormatter, report: ValidationReport): void {
    const testCases = [
      { type: 'error', text: 'Error message' },
      { type: 'success', text: 'Success message' },
      { type: 'warning', text: 'Warning message' },
      { type: 'info', text: 'Info message' }
    ];

    for (const testCase of testCases) {
      try {
        const formatted = formatter.status[testCase.type as keyof typeof formatter.status](testCase.text);
        
        // Extract ANSI codes and validate contrast
        const contrastRatio = this.calculateContrastRatio(formatted);
        
        if (contrastRatio < 3.0) {
          report.warnings++;
          report.details.push({
            type: 'warning',
            message: `Low contrast ratio (${contrastRatio.toFixed(2)}) for ${testCase.type}`,
            suggestion: 'Consider using higher contrast colors'
          });
        } else {
          report.passed++;
        }
      } catch (error) {
        report.failed++;
        report.details.push({
          type: 'error',
          message: `Failed to format ${testCase.type}: ${error.message}`,
          suggestion: 'Check formatter implementation'
        });
      }
    }
  }

  private validateAccessibility(formatter: SemanticFormatter, report: ValidationReport): void {
    // Test without color (accessibility requirement)
    const originalChalk = chalk.level;
    chalk.level = 0; // Disable colors
    
    try {
      const errorMessage = formatter.status.error('Test error');
      const successMessage = formatter.status.success('Test success');
      
      // Verify messages are still distinguishable without color
      if (this.hasDistinguishableMarkers(errorMessage, successMessage)) {
        report.passed++;
      } else {
        report.warnings++;
        report.details.push({
          type: 'warning',
          message: 'Status messages may not be distinguishable without color',
          suggestion: 'Add text prefixes like [ERROR], [SUCCESS] for accessibility'
        });
      }
    } finally {
      chalk.level = originalChalk; // Restore color level
    }
  }
}
```

## Implementation Strategy

### Phase 1: Core Infrastructure Setup
```typescript
// 1. Create base semantic formatter
export class SemanticFormatter implements SemanticFormatterAPI {
  private capabilities: TerminalCapabilities;
  private cache: FormatterCache;
  private theme: TerminalColorTheme;

  constructor(
    theme: TerminalColorTheme = DefaultColorThemes.default,
    options: FormatterOptions = {}
  ) {
    this.capabilities = new CapabilityDetector().getCapabilities();
    this.cache = new FormatterCache();
    this.theme = this.validateTheme(theme);
  }

  // Implement semantic methods with auto-fallback
  public readonly status = {
    success: (message: string): string => {
      return this.cache.getCachedOrFormat(`success:${message}`, () => {
        if (this.capabilities.supportsColor) {
          return this.theme.success(`[OK] ${message}`);
        }
        return `[OK] ${message}`;
      });
    },

    error: (message: string): string => {
      return this.cache.getCachedOrFormat(`error:${message}`, () => {
        if (this.capabilities.supportsColor) {
          return this.theme.error(`[ERROR] ${message}`);
        }
        return `[ERROR] ${message}`;
      });
    },

    warning: (message: string): string => {
      return this.cache.getCachedOrFormat(`warning:${message}`, () => {
        if (this.capabilities.supportsColor) {
          return this.theme.warning(`[WARN] ${message}`);
        }
        return `[WARN] ${message}`;
      });
    },

    info: (message: string): string => {
      return this.cache.getCachedOrFormat(`info:${message}`, () => {
        if (this.capabilities.supportsColor) {
          return this.theme.info(`[INFO] ${message}`);
        }
        return `[INFO] ${message}`;
      });
    }
  };
}
```

### Phase 2: Integration with Existing Systems
```typescript
// Integration adapter for existing TerminalColorTheme system
export class ThemeIntegrationAdapter {
  static adaptExistingTheme(existingTheme: TerminalColorTheme): SemanticFormatterTheme {
    return {
      // Map existing theme colors to semantic contexts
      status: {
        success: existingTheme.success,
        error: existingTheme.error,
        warning: existingTheme.warning,
        info: existingTheme.info,
        debug: existingTheme.muted
      },
      ui: {
        header: existingTheme.primary,
        separator: existingTheme.muted,
        menu: existingTheme.secondary,
        prompt: existingTheme.accent,
        breadcrumb: existingTheme.muted
      },
      data: {
        table: existingTheme.primary,
        progress: existingTheme.success,
        highlight: existingTheme.accent,
        code: existingTheme.info
      },
      interactive: {
        selection: existingTheme.accent,
        navigation: existingTheme.secondary,
        feedback: existingTheme.primary
      }
    };
  }
}
```

### Phase 3: Migration Helpers
```typescript
// Migration utilities for existing chalk calls
export class ChalkMigrationHelper {
  private static migrationMap = new Map([
    // Status patterns
    [/chalk\.red\.(bold\()?['"`]Error:?\s*['"`]\)?/gi, 'formatter.status.error'],
    [/chalk\.green\.(bold\()?['"`]Success:?\s*['"`]\)?/gi, 'formatter.status.success'],
    [/chalk\.yellow\.(bold\()?['"`]Warning:?\s*['"`]\)?/gi, 'formatter.status.warning'],
    [/chalk\.blue\.(bold\()?['"`]Info:?\s*['"`]\)?/gi, 'formatter.status.info'],
    
    // UI patterns
    [/chalk\.(cyan|blue)\.bold\(['"`]={3,}.*={3,}['"`]\)/gi, 'formatter.ui.header'],
    [/chalk\.gray\(['"`]-{3,}['"`]\)/gi, 'formatter.ui.separator'],
    
    // Interactive patterns
    [/chalk\.accent\(['"`]>\s*['"`]\)/gi, 'formatter.interactive.selection'],
  ]);

  static generateMigrationSuggestions(sourceCode: string): MigrationSuggestion[] {
    const suggestions: MigrationSuggestion[] = [];
    
    for (const [pattern, replacement] of this.migrationMap.entries()) {
      const matches = sourceCode.matchAll(pattern);
      
      for (const match of matches) {
        suggestions.push({
          original: match[0],
          suggested: replacement,
          line: this.getLineNumber(sourceCode, match.index!),
          confidence: this.calculateConfidence(match[0])
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
}
```

## Usage Examples

### Basic Status Messages
```typescript
// Replace scattered chalk calls
const formatter = new SemanticFormatter();

// Old way (scattered throughout codebase)
console.log(chalk.red.bold('Error: Connection failed'));
console.log(chalk.green('✓ Task completed successfully'));
console.log(chalk.yellow('Warning: Deprecated API'));

// New way (semantic and consistent)
console.log(formatter.status.error('Connection failed'));
console.log(formatter.status.success('Task completed successfully'));
console.log(formatter.status.warning('Deprecated API'));
```

### UI Elements with Auto-fallback
```typescript
// Headers adapt to terminal capabilities
console.log(formatter.ui.header('Main Configuration', 1));
// Color terminal: "━━━━━━━━━━━━━━━━━━━━\n  Main Configuration  \n━━━━━━━━━━━━━━━━━━━━"
// No-color terminal: "====================\n  Main Configuration  \n===================="

// Tables with responsive formatting
const data = [
  { name: 'Service A', status: 'Running', port: 8080 },
  { name: 'Service B', status: 'Stopped', port: 8081 }
];
console.log(formatter.data.table(data));
```

### Performance-Optimized Repeated Formatting
```typescript
// Automatically cached for performance
for (let i = 0; i < 1000; i++) {
  console.log(formatter.status.info('Processing item')); // Cached after first call
}

// Get optimization statistics
const stats = formatter.getOptimizationStats();
console.log(formatter.data.table([
  { metric: 'Cache Hit Rate', value: `${stats.hitRate.toFixed(2)}%` },
  { metric: 'Common Patterns', value: stats.commonPatterns.join(', ') }
]));
```

### Theme Integration
```typescript
// Works with existing TerminalColorTheme system
import { DefaultColorThemes } from './terminal-ui-components';

const darkFormatter = new SemanticFormatter(DefaultColorThemes.dark);
const lightFormatter = new SemanticFormatter(DefaultColorThemes.light);

// Automatic adaptation
console.log(darkFormatter.status.error('Dark theme error'));
console.log(lightFormatter.status.error('Light theme error'));
```

## Confidence Validation Features

### 1. Automated Testing
```typescript
// Built-in validation testing
export function validateFormatterIntegration(): ValidationReport {
  const formatter = new SemanticFormatter();
  const validator = new ThemeValidator();
  
  return validator.validateFormatter(formatter);
}

// Usage in CI/CD
const report = validateFormatterIntegration();
if (report.failed > 0) {
  process.exit(1);
}
```

### 2. Runtime Confidence Monitoring
```typescript
// Monitor formatting confidence in production
export class RuntimeConfidenceMonitor {
  private formatSuccessRate = new Map<string, number>();
  
  public trackFormatting(context: string, success: boolean): void {
    const current = this.formatSuccessRate.get(context) || 0;
    this.formatSuccessRate.set(context, success ? current + 1 : current);
  }

  public getConfidenceReport(): ConfidenceReport {
    return Array.from(this.formatSuccessRate.entries()).map(([context, rate]) => ({
      context,
      confidence: Math.min(1.0, rate / 100), // Normalize to 0-1
      recommendation: rate < 80 ? 'review-formatting' : 'stable'
    }));
  }
}
```

## Heuristic Optimization Features

### 1. Pattern Detection
```typescript
export class PatternDetector {
  private patterns = new Map<string, PatternStats>();
  
  public analyze(key: string, formatted: string): void {
    const pattern = this.extractPattern(key);
    const stats = this.patterns.get(pattern) || { count: 0, avgLength: 0 };
    
    stats.count++;
    stats.avgLength = (stats.avgLength + formatted.length) / stats.count;
    
    this.patterns.set(pattern, stats);
    
    // Suggest optimization for frequently used patterns
    if (stats.count > 10 && !this.hasOptimization(pattern)) {
      this.suggestOptimization(pattern, stats);
    }
  }
}
```

### 2. Smart Precomputation
```typescript
// Pre-compute common formatting combinations
export class PrecomputationEngine {
  private commonCombinations = [
    { type: 'status', subtype: 'error', variants: ['common-messages'] },
    { type: 'ui', subtype: 'separator', variants: ['lengths-40-60-80'] },
    { type: 'data', subtype: 'progress', variants: ['percentages-0-25-50-75-100'] }
  ];

  public precomputeCommonFormats(formatter: SemanticFormatter): void {
    for (const combo of this.commonCombinations) {
      this.precomputeVariants(formatter, combo);
    }
  }
}
```

## Integration Testing

### Test Coverage Strategy
```typescript
describe('Terminal Formatter Pattern', () => {
  let formatter: SemanticFormatter;
  
  beforeEach(() => {
    formatter = new SemanticFormatter();
  });

  describe('Semantic API', () => {
    it('should format status messages consistently', () => {
      expect(formatter.status.error('test')).toContain('[ERROR]');
      expect(formatter.status.success('test')).toContain('[OK]');
    });
    
    it('should cache repeated formats for performance', () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        formatter.status.info('repeated message');
      }
      const cachedTime = performance.now() - start;
      
      expect(cachedTime).toBeLessThan(10); // Should be very fast due to caching
    });
  });

  describe('Auto-fallback', () => {
    it('should work without colors', () => {
      const noColorFormatter = new SemanticFormatter(undefined, { forceNoColor: true });
      const result = noColorFormatter.status.error('test');
      
      expect(result).toContain('[ERROR]');
      expect(result).not.toMatch(/\u001b\[\d+m/); // No ANSI codes
    });
  });

  describe('Theme Integration', () => {
    it('should integrate with existing themes', () => {
      const theme = DefaultColorThemes.dark;
      const themedFormatter = new SemanticFormatter(theme);
      
      expect(themedFormatter.status.error('test')).toBeDefined();
    });
  });
});
```

## Deployment Strategy

### Phase 1: Parallel Implementation (Weeks 1-2)
- Deploy SemanticFormatter alongside existing chalk calls
- Add to Phoenix Code Lite and Templum gradually
- Validate performance and functionality

### Phase 2: Progressive Migration (Weeks 3-4)
- Use ChalkMigrationHelper to identify conversion opportunities
- Replace high-frequency chalk calls first (biggest performance impact)
- Maintain backward compatibility

### Phase 3: Full Consolidation (Weeks 5-6)
- Replace remaining chalk calls
- Remove direct chalk dependencies where possible
- Validate 279+ call consolidation target

### Phase 4: Optimization (Week 7)
- Enable all heuristic optimizations
- Tune caching parameters based on production metrics
- Generate final performance report

## Success Metrics

### Performance Targets
- **Cache Hit Rate**: >85% for repeated formats
- **Memory Usage**: <5MB total for formatter cache
- **Format Speed**: <1ms average for cached calls, <10ms for new formats
- **Consolidation**: Reduce 279+ chalk calls to <50 semantic calls

### Quality Targets
- **Theme Consistency**: 100% compatibility with existing TerminalColorTheme system
- **Accessibility**: All status messages distinguishable without color
- **Terminal Compatibility**: Support for monochrome, 8-color, 256-color, and true-color terminals
- **Code Coverage**: >95% test coverage for all semantic formatting methods

### Integration Targets
- **Migration Coverage**: Convert >90% of identifiable chalk patterns
- **Performance Regression**: <5% performance impact on existing code
- **Developer Experience**: Reduce formatting-related code by >60%

## Recovery Procedures

### Fallback Strategy
If semantic formatter encounters issues:

1. **Graceful Degradation**: Fall back to plain text output
2. **Bypass Cache**: Direct formatting if cache corruption detected  
3. **Theme Recovery**: Use DefaultColorThemes.default if theme invalid
4. **Terminal Detection Recovery**: Assume basic terminal capabilities

### Monitoring and Alerts
- Monitor cache hit rates and performance metrics
- Alert on theme validation failures
- Track formatting error rates by terminal type
- Performance regression detection

## Future Enhancement Opportunities

### 1. Machine Learning Pattern Recognition
- Analyze formatting patterns to suggest semantic improvements
- Predict optimal cache sizes based on usage patterns
- Auto-detect theme preferences from user behavior

### 2. Advanced Terminal Features
- Support for hyperlinks in modern terminals
- Integration with terminal window management
- Dynamic theme switching based on time/context

### 3. Cross-Project Standardization
- Extend pattern to Haruspex and other projects
- Create shared formatting library
- Establish organization-wide formatting standards

---

## Pattern Classification

**Type**: Infrastructure Pattern  
**Complexity**: Medium-High  
**Reusability**: Very High  
**Performance Impact**: Positive (optimization through caching)  
**Maintenance Impact**: Very Positive (consolidation reduces maintenance)  

**Recommended for**: All projects using terminal output, especially CLIs with frequent formatting needs.

**Anti-patterns to Avoid**:
- Mixing semantic calls with direct chalk calls in same module
- Overriding theme colors without validation
- Ignoring terminal capability detection
- Bypassing cache for performance-critical sections

This pattern successfully consolidates the identified 279+ chalk calls into a semantic, optimized, and maintainable formatting system with auto-fallback and confidence validation capabilities.
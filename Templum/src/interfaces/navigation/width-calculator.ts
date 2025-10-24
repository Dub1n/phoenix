/**
---
date: 2025-09-12T174343Z
name: CLI Navigation Width Calculator
TASK-ID: [TASK-MCP-006]
category: navigation-system
status: ["[T]"]
patterns: [content-measurement, dynamic-sizing, responsive-layout]
components: [WidthCalculator, ContentAnalyzer]
dependencies: [string-width, terminal-formatter, display-utils]
tags: [cli, navigation, sizing, responsive]
---
 *
 * WidthCalculator - Dynamic Window Sizing System
 *
 * Provides intelligent window width calculation based on content analysis,
 * terminal formatter capabilities, and shared window/display spacing
 * standards. Implements the "widest content across all pages" requirement
 * from the design specification while delegating glyph spacing and
 * responsive bounds to consolidated utilities.
 */

import { DisplayUtils, type DisplayStandards, type ResponsiveOptions } from '../../utils/display-utils';
import { WINDOW_SPACING } from '../../utils/window-theme-constants';
import { StringWidthUtils } from '../../utils/chainable-string-utils';
import { createFormatter, TerminalFormatter, type TerminalCapabilities as FormatterCapabilities } from '../../utils/terminal-formatter';
import { createLogger, normalizeLoggerError } from '../../utils/logger';

export interface ContentAnalysisResult {
  maxLineWidth: number;
  totalLines: number;
  averageLineWidth: number;
  hasMultiByteChars: boolean;
  hasAnsiCodes: boolean;
  recommendedWidth: number;
  contentComplexity: 'simple' | 'medium' | 'complex';
}

export class ContentAnalyzer {
  static analyzeContent(lines: string[]): ContentAnalysisResult {
    let maxLineWidth = 0;
    let totalWidth = 0;
    let hasMultiByteChars = false;
    let hasAnsiCodes = false;

    for (const line of lines) {
      const width = StringWidthUtils.getDisplayWidth(line);
      const stripped = StringWidthUtils.stripAnsi(line);

      maxLineWidth = Math.max(maxLineWidth, width);
      totalWidth += width;

      if (!hasMultiByteChars && width !== stripped.length) {
        hasMultiByteChars = true;
      }

      if (!hasAnsiCodes && stripped !== line) {
        hasAnsiCodes = true;
      }
    }

    const averageLineWidth = lines.length > 0 ? totalWidth / lines.length : 0;
    const recommendedWidth = Math.max(
      WINDOW_SPACING.minWidth,
      maxLineWidth + WINDOW_SPACING.defaultPadding * 2
    );

    const contentComplexity: 'simple' | 'medium' | 'complex' = this.resolveComplexity(
      maxLineWidth,
      lines.length,
      hasMultiByteChars || hasAnsiCodes
    );

    return {
      maxLineWidth,
      totalLines: lines.length,
      averageLineWidth,
      hasMultiByteChars,
      hasAnsiCodes,
      recommendedWidth,
      contentComplexity
    };
  }

  static analyzeMenuContent(menuDefinition: any): ContentAnalysisResult {
    const lines = this.collectMenuLines(menuDefinition);
    return this.analyzeContent(lines);
  }

  static collectLines(content: string[] | any): string[] {
    if (Array.isArray(content)) {
      return content;
    }
    return this.collectMenuLines(content);
  }

  static combine(results: ContentAnalysisResult[]): ContentAnalysisResult {
    if (results.length === 0) {
      return this.analyzeContent([]);
    }

    const maxLineWidth = Math.max(...results.map(result => result.maxLineWidth));
    const recommendedWidth = Math.max(...results.map(result => result.recommendedWidth));
    const totalLines = Math.max(...results.map(result => result.totalLines));
    const averageLineWidth = results.reduce((sum, result) => sum + result.averageLineWidth, 0) / results.length;
    const hasMultiByteChars = results.some(result => result.hasMultiByteChars);
    const hasAnsiCodes = results.some(result => result.hasAnsiCodes);
    const contentComplexity = this.resolveMaxComplexity(results.map(result => result.contentComplexity));

    return {
      maxLineWidth,
      totalLines,
      averageLineWidth,
      hasMultiByteChars,
      hasAnsiCodes,
      recommendedWidth,
      contentComplexity
    };
  }

  private static collectMenuLines(menuDefinition: any): string[] {
    const lines: string[] = [];

    if (menuDefinition?.title) {
      lines.push(String(menuDefinition.title));
    }

    if (menuDefinition?.subtitle) {
      lines.push(String(menuDefinition.subtitle));
    }

    if (Array.isArray(menuDefinition?.sections)) {
      for (const section of menuDefinition.sections) {
        if (section?.heading) {
          lines.push(String(section.heading));
        }

        if (Array.isArray(section?.items)) {
          for (const item of section.items) {
            if (item?.label) {
              lines.push(String(item.label));
            }
            if (item?.description) {
              lines.push(String(item.description));
            }
          }
        }
      }
    }

    return lines;
  }

  private static resolveComplexity(
    maxLineWidth: number,
    totalLines: number,
    containsComplexCharacters: boolean
  ): 'simple' | 'medium' | 'complex' {
    if (maxLineWidth > 120 || totalLines > 20) {
      return 'complex';
    }
    if (containsComplexCharacters || maxLineWidth > 80 || totalLines > 12) {
      return 'medium';
    }
    return 'simple';
  }

  private static resolveMaxComplexity(
    complexities: Array<'simple' | 'medium' | 'complex'>
  ): 'simple' | 'medium' | 'complex' {
    if (complexities.includes('complex')) {
      return 'complex';
    }
    if (complexities.includes('medium')) {
      return 'medium';
    }
    return 'simple';
  }
}

export interface LegacyPaddingConfig {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  inner?: number;
}

export interface WidthCalculationOptions {
  minWidth?: number;
  maxWidth?: number;
  preferredWidth?: number;
  allowShrinking?: boolean;
  respectTerminalWidth?: boolean;
  enforceConsistency?: boolean;
  padding?: number;
  paddingConfig?: LegacyPaddingConfig;
}

export interface WidthCalculationResult {
  calculatedWidth: number;
  contentWidth: number;
  paddingWidth: number;
  borderWidth: number;
  isOptimal: boolean;
  reasoning: string;
  recommendations: string[];
}

export interface WidthCalculatorDependencies {
  formatter?: Pick<TerminalFormatter, 'getCapabilities'>;
  responsiveWidth?: (content: string | string[], options?: ResponsiveOptions) => number;
  standards?: () => DisplayStandards;
}

interface ResolvedWidthCalculatorDependencies {
  formatter: Pick<TerminalFormatter, 'getCapabilities'>;
  responsiveWidth: (content: string | string[], options?: ResponsiveOptions) => number;
  standards: () => DisplayStandards;
}

const DEFAULT_OPTIONS: Required<Omit<WidthCalculationOptions, 'preferredWidth' | 'paddingConfig' | 'padding'>> &
  Pick<WidthCalculationOptions, 'preferredWidth' | 'padding' | 'paddingConfig'> = {
  minWidth: WINDOW_SPACING.minWidth,
  maxWidth: WINDOW_SPACING.maxWidth,
  allowShrinking: true,
  respectTerminalWidth: true,
  enforceConsistency: false,
  preferredWidth: undefined,
  padding: undefined,
  paddingConfig: undefined
};

function createDefaultDependencies(): ResolvedWidthCalculatorDependencies {
  const formatter = createFormatter();
  return {
    formatter,
    responsiveWidth: (content, options) => DisplayUtils.responsiveWidth(content, options),
    standards: () => DisplayUtils.standards
  };
}

function mergeDependencies(
  overrides: WidthCalculatorDependencies | undefined
): ResolvedWidthCalculatorDependencies {
  const defaults = createDefaultDependencies();

  if (!overrides) {
    return defaults;
  }

  return {
    formatter: overrides.formatter ?? defaults.formatter,
    responsiveWidth: overrides.responsiveWidth ?? defaults.responsiveWidth,
    standards: overrides.standards ?? defaults.standards
  };
}

export class WidthCalculator {
  protected options: WidthCalculationOptions;
  private readonly dependencies: ResolvedWidthCalculatorDependencies;

  constructor(
    options: Partial<WidthCalculationOptions> = {},
    dependencies?: WidthCalculatorDependencies
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.dependencies = mergeDependencies(dependencies);
  }

  calculateWidth(content: string[] | any): WidthCalculationResult {
    const lines = ContentAnalyzer.collectLines(content);
    const analysis = ContentAnalyzer.analyzeContent(lines);
    return this.calculateWidthFromLines(lines, analysis);
  }

  calculateConsistentWidth(contents: (string[] | any)[]): WidthCalculationResult {
    const analyses = contents.map(content => {
      const lines = ContentAnalyzer.collectLines(content);
      return {
        lines,
        analysis: ContentAnalyzer.analyzeContent(lines)
      };
    });

    const combinedAnalysis = ContentAnalyzer.combine(analyses.map(item => item.analysis));
    const combinedLines = analyses.flatMap(item => item.lines);

    return this.calculateWidthFromLines(combinedLines, combinedAnalysis);
  }

  testCalculation(sampleContent: string[]): WidthCalculationResult {
    return this.calculateWidth(sampleContent);
  }

  updateOptions(options: Partial<WidthCalculationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getTerminalDimensions(): { width: number; height: number } {
    const capabilities = this.dependencies.formatter.getCapabilities();
    const width = this.resolveTerminalWidth(capabilities);
    const height = capabilities.height ?? process.stdout?.rows ?? 24;

    return { width, height };
  }

  protected calculateWidthFromLines(
    lines: string[],
    analysis: ContentAnalysisResult
  ): WidthCalculationResult {
    const padding = this.resolvePadding();
    const minWidth = this.options.minWidth ?? WINDOW_SPACING.minWidth;
    const maxWidth = this.resolveMaxWidth();

    const responsiveWidth = this.dependencies.responsiveWidth(lines, {
      minWidth,
      maxWidth,
      padding
    });

    let calculatedWidth = responsiveWidth;

    if (typeof this.options.preferredWidth === 'number') {
      calculatedWidth = Math.max(calculatedWidth, this.options.preferredWidth);
    }

    calculatedWidth = Math.max(minWidth, Math.min(calculatedWidth, maxWidth));

    const paddingWidth = padding * 2;
    const borderWidth = WINDOW_SPACING.borderWidth;
    const contentWidth = Math.max(calculatedWidth - paddingWidth - borderWidth, 0);
    const isOptimal = analysis.maxLineWidth <= contentWidth;

    const reasoning = this.generateReasoning(analysis, calculatedWidth, contentWidth);
    const recommendations = this.generateRecommendations(analysis, calculatedWidth, contentWidth, isOptimal);

    return {
      calculatedWidth,
      contentWidth,
      paddingWidth,
      borderWidth,
      isOptimal,
      reasoning,
      recommendations
    };
  }

  private resolvePadding(): number {
    if (typeof this.options.padding === 'number') {
      return Math.max(0, this.options.padding);
    }

    if (this.options.paddingConfig && typeof this.options.paddingConfig.inner === 'number') {
      return Math.max(0, this.options.paddingConfig.inner);
    }

    return WINDOW_SPACING.defaultPadding;
  }

  private resolveMaxWidth(): number {
    const standards = this.dependencies.standards();
    const capabilities = this.dependencies.formatter.getCapabilities();
    const terminalWidth = this.resolveTerminalWidth(capabilities);

    const maxWidthOption = this.options.maxWidth ?? WINDOW_SPACING.maxWidth;

    const boundedMax = Math.min(
      maxWidthOption,
      terminalWidth - WINDOW_SPACING.separatorMargin,
      standards.terminalWidth,
      WINDOW_SPACING.maxWidth
    );

    return Math.max(WINDOW_SPACING.minWidth, boundedMax);
  }

  private resolveTerminalWidth(capabilities: FormatterCapabilities): number {
    const standards = this.dependencies.standards();

    if (this.options.respectTerminalWidth === false) {
      return standards.terminalWidth;
    }

    const detectedWidth = capabilities.width ?? standards.terminalWidth;
    return Math.max(WINDOW_SPACING.minWidth, Math.min(detectedWidth, standards.terminalWidth));
  }

  private generateReasoning(
    analysis: ContentAnalysisResult,
    calculatedWidth: number,
    contentWidth: number
  ): string {
    const terminalWidth = this.resolveTerminalWidth(this.dependencies.formatter.getCapabilities());

    const factors = [
      `maxLineWidth=${analysis.maxLineWidth}`,
      `recommended=${analysis.recommendedWidth}`,
      `calculated=${calculatedWidth}`,
      `content=${contentWidth}`,
      `terminal=${terminalWidth}`
    ];

    if (analysis.hasMultiByteChars) {
      factors.push('multiByte');
    }

    if (analysis.hasAnsiCodes) {
      factors.push('ansi');
    }

    if (analysis.contentComplexity !== 'simple') {
      factors.push(`complexity=${analysis.contentComplexity}`);
    }

    return factors.join(', ');
  }

  private generateRecommendations(
    analysis: ContentAnalysisResult,
    calculatedWidth: number,
    contentWidth: number,
    isOptimal: boolean
  ): string[] {
    const recommendations: string[] = [];

    if (!isOptimal) {
      recommendations.push('Consider increasing max width or reducing content length.');
    }

    if (analysis.contentComplexity === 'complex') {
      recommendations.push('Complex content detected — evaluate pagination or scrolling options.');
    }

    if (analysis.hasMultiByteChars) {
      recommendations.push('Multi-byte characters present — verify terminal font support.');
    }

    const utilizationRatio = contentWidth === 0 ? 0 : contentWidth / calculatedWidth;
    if (utilizationRatio < 0.6) {
      recommendations.push('Low content utilization — adjust padding or width to reduce whitespace.');
    }

    if (calculatedWidth >= this.resolveMaxWidth()) {
      recommendations.push('Width clamped by terminal capabilities — ensure responsive layouts fall back gracefully.');
    }

    return recommendations;
  }
}

export class ResponsiveWidthCalculator extends WidthCalculator {
  private resizeListeners: Array<() => void> = [];
  private readonly logger = createLogger('width-calculator');
  private lastKnownDimensions: { width: number; height: number };

  constructor(
    options: Partial<WidthCalculationOptions> = {},
    dependencies?: WidthCalculatorDependencies
  ) {
    super(options, dependencies);
    this.lastKnownDimensions = this.getTerminalDimensions();
    this.setupResizeListener();
  }

  calculateResponsiveWidth(content: string[] | any): WidthCalculationResult {
    const originalMaxWidth = this.options.maxWidth;
    const { width } = this.getTerminalDimensions();
    const responsiveMaxWidth = Math.max(WINDOW_SPACING.minWidth, width - WINDOW_SPACING.separatorMargin);

    this.updateOptions({ maxWidth: responsiveMaxWidth });
    const result = this.calculateWidth(content);

    this.updateOptions({ maxWidth: originalMaxWidth });
    return result;
  }

  onResize(listener: () => void): void {
    this.resizeListeners.push(listener);
  }

  removeResizeListener(listener: () => void): void {
    const index = this.resizeListeners.indexOf(listener);
    if (index >= 0) {
      this.resizeListeners.splice(index, 1);
    }
  }

  cleanup(): void {
    this.resizeListeners = [];
    process.stdout.removeAllListeners('resize');
  }

  private setupResizeListener(): void {
    process.stdout.on('resize', () => {
      const dimensions = this.getTerminalDimensions();
      if (
        dimensions.width !== this.lastKnownDimensions.width ||
        dimensions.height !== this.lastKnownDimensions.height
      ) {
        this.lastKnownDimensions = dimensions;
        this.notifyResizeListeners();
      }
    });
  }

  private notifyResizeListeners(): void {
    for (const listener of this.resizeListeners) {
      try {
        listener();
      } catch (error) {
        const normalized = normalizeLoggerError(error);
        this.logger.error('Error in resize listener', normalized.error, normalized.data);
      }
    }
  }
}

export function createWidthCalculator(
  options?: Partial<WidthCalculationOptions>,
  dependencies?: WidthCalculatorDependencies
): WidthCalculator {
  return new WidthCalculator(options, dependencies);
}

export function createResponsiveWidthCalculator(
  options?: Partial<WidthCalculationOptions>,
  dependencies?: WidthCalculatorDependencies
): ResponsiveWidthCalculator {
  return new ResponsiveWidthCalculator(options, dependencies);
}

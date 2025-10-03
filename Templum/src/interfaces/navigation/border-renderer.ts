/**
---
date: 2025-09-12T174343Z
name: CLI Navigation Border Renderer
TASK-ID: [TASK-MCP-006]
category: navigation-system
status: ["[T]"]
patterns: [border-rendering, unicode-fallback, terminal-compatibility]
components: [BorderRenderer, BorderCapabilityDetector]
dependencies: [chalk, terminal-ui-components]
tags: [cli, navigation, borders, accessibility]
---
 * 
 * BorderRenderer - Structured Window Rendering System
 * 
 * Provides Unicode box-drawing character support with ASCII fallback for terminal compatibility.
 * Implements the new CLI design specification with ┌─┐ style bordered windows,
 * proper padding, and dynamic width calculation.
 * 
 * Generated: 2025-09-12T174343Z
 * TASK-ID: TASK-MCP-006 Pattern: border-rendering | Complexity: 4 | Dependencies: chalk,terminal-ui
 * Context: Implements structured window design replacing emoji-heavy interface with clean borders
 * Validation-Required: terminal-compatibility, unicode-support, accessibility
 * Pattern-Info: { approach: "progressive-enhancement", alternatives: "ascii-fallback", trade-offs: "unicode-compatibility" }
 */

import { StringUtils, StringWidthUtils } from '../../utils/chainable-string-utils';
import { DisplayUtils } from '../../utils/display-utils';
import { WINDOW_SPACING } from '../../utils/window-theme-constants';
import {
  TerminalFormatter,
  createFormatter,
  type TerminalCapabilities,
  type ColorSpec
} from '../../utils/terminal-formatter';

// TODO: [TASK-ID-001] Pattern: border-rendering | Complexity: 4 | Dependencies: terminal-detection
// Context: Terminal capability detection system for Unicode box-drawing character support
// Validation-Required: cross-platform-compatibility, fallback-behavior, performance-impact
// Pattern-Info: { approach: "capability-detection", alternatives: "environment-variables", trade-offs: "startup-performance" }

export interface BorderCharacterSet {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
  topTee: string;
  bottomTee: string;
  leftTee: string;
  rightTee: string;
  cross: string;
}

export const UNICODE_BORDERS: BorderCharacterSet = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  topTee: '┬',
  bottomTee: '┴',
  leftTee: '├',
  rightTee: '┤',
  cross: '┼'
};

export const ASCII_BORDERS: BorderCharacterSet = {
  topLeft: '+',
  topRight: '+',
  bottomLeft: '+',
  bottomRight: '+',
  horizontal: '-',
  vertical: '|',
  topTee: '+',
  bottomTee: '+',
  leftTee: '+',
  rightTee: '+',
  cross: '+'
};

export interface BorderRendererTheme {
  primary: (value: string) => string;
  accent: (value: string) => string;
  muted: (value: string) => string;
}

const applyThemeSegment = (
  formatter: TerminalFormatter,
  spec: ColorSpec | undefined
): ((value: string) => string) => {
  if (!spec) {
    return (value: string) => value;
  }
  return (value: string) => formatter.formatWithSpec(value, spec);
};

const createThemeFromFormatter = (formatter: TerminalFormatter): BorderRendererTheme => {
  const theme = formatter.getTheme();
  const navigationSpec = theme.interactive?.navigation ?? theme.ui?.prompt ?? theme.ui?.menu;

  return {
    primary: applyThemeSegment(formatter, theme.ui?.separator),
    accent: applyThemeSegment(formatter, navigationSpec),
    muted: applyThemeSegment(formatter, theme.muted)
  };
};

export interface BorderRendererDependencies {
  formatter?: TerminalFormatter;
  capabilities?: TerminalCapabilities;
  theme?: BorderRendererTheme;
}

export interface WindowBorderConfig {
  title?: string;
  subtitle?: string;
  width: number;
  height: number;
  padding: number;
  theme: BorderRendererTheme;
  useUnicode: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  doubleWidth: boolean;
}

export class BorderCapabilityDetector {
  private static formatter: TerminalFormatter | null = null;

  static configure(formatter: TerminalFormatter): void {
    this.formatter = formatter;
  }

  static reset(): void {
    this.formatter = null;
  }

  static getCapabilities(): TerminalCapabilities {
    const formatter = this.formatter ?? createFormatter();
    return formatter.getCapabilities();
  }

  static async testUnicodeRendering(): Promise<boolean> {
    return this.getCapabilities().supportsUnicode;
  }
}

/**
 * Border rendering system with Unicode support and ASCII fallback
 */
export class BorderRenderer {
  private readonly formatter: TerminalFormatter;
  private config: WindowBorderConfig;
  private borderChars: BorderCharacterSet;
  private capabilities: TerminalCapabilities;

  constructor(config: Partial<WindowBorderConfig> = {}, dependencies: BorderRendererDependencies = {}) {
    this.formatter = dependencies.formatter ?? createFormatter();
    this.capabilities = dependencies.capabilities ?? this.formatter.getCapabilities();
    const resolvedTheme = dependencies.theme ?? (config.theme as BorderRendererTheme | undefined) ?? createThemeFromFormatter(this.formatter);
    const unicodePreference = config.useUnicode ?? this.capabilities.supportsUnicode;
    const resolvedUnicode = unicodePreference && this.capabilities.supportsUnicode;

    const defaultWidth = DisplayUtils.standards.separatorLength + WINDOW_SPACING.borderWidth;
    const baseConfig: WindowBorderConfig = {
      width: defaultWidth,
      height: 10,
      padding: 3,
      theme: resolvedTheme,
      useUnicode: resolvedUnicode,
      showTitle: true,
      showSubtitle: true,
      doubleWidth: false
    };

    this.config = {
      ...baseConfig,
      ...config,
      theme: resolvedTheme,
      useUnicode: resolvedUnicode
    };

    this.borderChars = this.config.useUnicode ? UNICODE_BORDERS : ASCII_BORDERS;
  }

  /**
   * Render a complete bordered window with content
   */
  renderWindow(content: string[], title?: string, subtitle?: string): string {
    const windowConfig = {
      ...this.config,
      title: title || this.config.title,
      subtitle: subtitle || this.config.subtitle
    };

    return this.renderBorderedContent(content, windowConfig);
  }

  /**
   * Render bordered content with proper padding and sizing
   */
  private renderBorderedContent(content: string[], config: WindowBorderConfig): string {
    const lines: string[] = [];
    
    // Calculate actual content width (accounting for padding)
    const contentWidth = config.width - (config.padding * 2) - 2; // -2 for border chars
    
    // Top border with title
    lines.push(this.renderTopBorder(config));
    
    // Title line if present
    if (config.showTitle && config.title) {
      lines.push(this.renderTitleLine(config.title, config));
      if (config.showSubtitle && config.subtitle) {
        lines.push(this.renderSubtitleLine(config.subtitle, config));
      }
      lines.push(this.renderSeparatorLine(config));
    }
    
    // Content lines with padding
    const processedContent = this.processContent(content, contentWidth);
    for (const line of processedContent) {
      lines.push(this.renderContentLine(line, config));
    }
    
    // Fill remaining height if specified
    const currentHeight = lines.length + 1; // +1 for bottom border
    if (config.height > currentHeight) {
      const fillLines = config.height - currentHeight;
      for (let i = 0; i < fillLines; i++) {
        lines.push(this.renderContentLine('', config));
      }
    }
    
    // Bottom border
    lines.push(this.renderBottomBorder(config));
    
    return lines.join('\n');
  }

  /**
   * Process content to fit within specified width
   */
  private processContent(content: string[], maxWidth: number): string[] {
    if (maxWidth <= 0) {
      return content.map(() => '');
    }

    const processed: string[] = [];

    for (const rawLine of content) {
      const line = rawLine ?? '';
      if (StringWidthUtils.getDisplayWidth(line) <= maxWidth) {
        processed.push(line);
        continue;
      }

      processed.push(...StringUtils.wrap(line, maxWidth));
    }

    return processed;
  }

  /**
   * Render top border with optional title integration
   */
  private renderTopBorder(config: WindowBorderConfig): string {
    const { theme, width } = config;
    const horizontalChar = this.borderChars.horizontal;
    
    let border = this.borderChars.topLeft;
    border += horizontalChar.repeat(width - 2);
    border += this.borderChars.topRight;
    
    return theme.primary(border);
  }

  /**
   * Render bottom border
   */
  private renderBottomBorder(config: WindowBorderConfig): string {
    const { theme, width } = config;
    const horizontalChar = this.borderChars.horizontal;
    
    let border = this.borderChars.bottomLeft;
    border += horizontalChar.repeat(width - 2);
    border += this.borderChars.bottomRight;
    
    return theme.primary(border);
  }

  private normalizeInteriorContent(value: string, width: number): string {
    if (width <= 0) {
      return '';
    }

    return StringUtils.chain(value, { mode: 'terminal' })
      .truncate(width)
      .pad(width)
      .value();
  }

  /**
   * Render title line within border
   */
  private renderTitleLine(title: string, config: WindowBorderConfig): string {
    const { theme, width, padding } = config;
    const availableWidth = width - 2 - (padding * 2); // -2 for border chars
    const normalizedTitle = this.normalizeInteriorContent(title, availableWidth);
    const paddingStr = ' '.repeat(padding);
    
    return theme.primary(this.borderChars.vertical) +
           paddingStr +
           theme.accent(normalizedTitle) +
           paddingStr +
           theme.primary(this.borderChars.vertical);
  }

  /**
   * Render subtitle line within border
   */
  private renderSubtitleLine(subtitle: string, config: WindowBorderConfig): string {
    const { theme, width, padding } = config;
    const availableWidth = width - 2 - (padding * 2); // -2 for border chars
    const normalizedSubtitle = this.normalizeInteriorContent(subtitle, availableWidth);
    const paddingStr = ' '.repeat(padding);
    
    return theme.primary(this.borderChars.vertical) +
           paddingStr +
           theme.muted(normalizedSubtitle) +
           paddingStr +
           theme.primary(this.borderChars.vertical);
  }

  /**
   * Render separator line between title and content
   */
  private renderSeparatorLine(config: WindowBorderConfig): string {
    const { theme, width } = config;
    const horizontalChar = this.borderChars.horizontal;
    
    let separator = this.borderChars.leftTee;
    separator += horizontalChar.repeat(width - 2);
    separator += this.borderChars.rightTee;
    
    return theme.primary(separator);
  }

  /**
   * Render content line with proper padding
   */
  private renderContentLine(content: string, config: WindowBorderConfig): string {
    const { theme, width, padding } = config;
    const availableWidth = width - 2 - (padding * 2); // -2 for border chars
    const normalizedContent = this.normalizeInteriorContent(content, availableWidth);
    const paddingStr = ' '.repeat(padding);
    
    return theme.primary(this.borderChars.vertical) +
           paddingStr +
           normalizedContent +
           paddingStr +
           theme.primary(this.borderChars.vertical);
  }

  /**
   * Calculate optimal window dimensions for given content
   */
  calculateOptimalDimensions(content: string[], minWidth = 40, maxWidth = 120): { width: number; height: number } {
    const padding = this.config.padding ?? WINDOW_SPACING.defaultPadding;
    const borderWidth = WINDOW_SPACING.borderWidth;
    const baselineContentWidth = DisplayUtils.standards.separatorLength;

    const responsiveWidth = DisplayUtils.responsiveWidth(content, {
      padding,
      minWidth,
      maxWidth: Math.max(minWidth, maxWidth - borderWidth)
    });

    const normalizedContentWidth = Math.max(responsiveWidth, baselineContentWidth);
    const totalWidth = Math.min(maxWidth, Math.max(normalizedContentWidth + borderWidth, minWidth + borderWidth));
    
    // Calculate height based on content and wrapped lines
    let totalHeight = 2; // Top and bottom borders
    
    if (this.config.showTitle && this.config.title) {
      totalHeight += 1; // Title line
      if (this.config.showSubtitle && this.config.subtitle) {
        totalHeight += 1; // Subtitle line
      }
      totalHeight += 1; // Separator line
    }
    
    const contentWidth = Math.max(0, totalWidth - (padding * 2) - borderWidth);
    for (const line of content) {
      if (contentWidth <= 0) {
        totalHeight += 1;
        continue;
      }

      if (StringWidthUtils.getDisplayWidth(line) <= contentWidth) {
        totalHeight += 1;
        continue;
      }

      totalHeight += StringUtils.wrap(line, contentWidth).length;
    }
    
    return { width: totalWidth, height: totalHeight };
  }

  /**
   * Create a simple bordered box around text
   */
  createSimpleBox(text: string, title?: string): string {
    const lines = text.split('\n');
    const dimensions = this.calculateOptimalDimensions(lines);
    
    const config: WindowBorderConfig = {
      ...this.config,
      width: dimensions.width,
      height: dimensions.height,
      title,
      showTitle: !!title,
      showSubtitle: false
    };
    
    return this.renderBorderedContent(lines, config);
  }

  /**
   * Get current terminal capabilities
   */
  getCapabilities(): TerminalCapabilities {
    return this.capabilities;
  }

  /**
   * Test if Unicode rendering is working properly
   */
  async testUnicodeSupport(): Promise<boolean> {
    return this.capabilities.supportsUnicode;
  }

  /**
   * Switch between Unicode and ASCII border modes
   */
  setUnicodeMode(enabled: boolean): void {
    this.config.useUnicode = enabled && this.capabilities.supportsUnicode;
    this.borderChars = this.config.useUnicode ? UNICODE_BORDERS : ASCII_BORDERS;
  }

  /**
   * Update theme
   */
  setTheme(theme: BorderRendererTheme): void {
    this.config.theme = theme;
  }
}

// TODO: [TASK-ID-002] Pattern: accessibility-enhancement | Complexity: 3 | Dependencies: screen-readers
// Context: Screen reader and accessibility support for bordered interfaces
// Validation-Required: aria-compatibility, screen-reader-testing, navigation-patterns
// Pattern-Info: { approach: "semantic-markup", alternatives: "plain-text-mode", trade-offs: "visual-complexity" }

/**
 * Accessibility-enhanced border renderer with screen reader support
 */
export class AccessibleBorderRenderer extends BorderRenderer {
  private includeScreenReaderLabels: boolean;

  constructor(
    config: Partial<WindowBorderConfig & { includeScreenReaderLabels: boolean }> = {},
    dependencies: BorderRendererDependencies = {}
  ) {
    super(config, dependencies);
    this.includeScreenReaderLabels = config.includeScreenReaderLabels ?? false;
  }

  /**
   * Render window with accessibility annotations
   */
  renderAccessibleWindow(content: string[], title?: string, subtitle?: string): string {
    if (!this.includeScreenReaderLabels) {
      return this.renderWindow(content, title, subtitle);
    }

    // Add semantic labels for screen readers
    let result = '';
    
    if (title) {
      result += `[WINDOW START: ${title}]\n`;
    } else {
      result += '[WINDOW START]\n';
    }
    
    result += this.renderWindow(content, title, subtitle);
    result += '\n[WINDOW END]';
    
    return result;
  }

  /**
   * Create plain text version without borders for accessibility
   */
  renderPlainText(content: string[], title?: string, subtitle?: string): string {
    let result = '';
    
    if (title) {
      result += `=== ${title} ===\n`;
      if (subtitle) {
        result += `${subtitle}\n`;
      }
      result += '\n';
    }
    
    result += content.join('\n');
    
    return result;
  }

  /**
   * Toggle screen reader mode
   */
  setScreenReaderMode(enabled: boolean): void {
    this.includeScreenReaderLabels = enabled;
  }
}

/**
 * Factory function for creating border renderer with automatic capability detection
 */
export function createBorderRenderer(
  config: Partial<WindowBorderConfig> = {},
  dependencies: BorderRendererDependencies = {}
): BorderRenderer {
  return new BorderRenderer(config, dependencies);
}

/**
 * Factory function for creating accessible border renderer
 */
export function createAccessibleBorderRenderer(
  config: Partial<WindowBorderConfig & { includeScreenReaderLabels: boolean }> = {},
  dependencies: BorderRendererDependencies = {}
): AccessibleBorderRenderer {
  return new AccessibleBorderRenderer(config, dependencies);
}

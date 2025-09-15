/**
---
date: 2025-09-14T000000Z
name: Window Utils Utility Pattern
TASK-ID: [TASK-UTIL-001]
category: utility-patterns
status: ["[x]"]
patterns: [chainable-api, window-management, utility-consolidation]
components: [WindowUtils, BorderManager, LayoutCalculator, ContentProcessor]
dependencies: [chalk, terminal-ui-components]
tags: [utilities, windows, borders, layout, optimization]
---
 * 
 * WindowUtils - Comprehensive Window Management Utility Pattern
 * 
 * Consolidates scattered window utility patterns from across the codebase into
 * a unified, chainable API. Reduces ~300 lines of duplicated code across ~15 files
 * by providing centralized border rendering, layout calculations, and window management.
 * 
 * Generated: 2025-09-14T000000Z
 * Pattern: chainable-window-api | Complexity: 5 | Dependencies: chalk,terminal-ui
 * Context: Consolidates window utilities from BorderRenderer, WidthCalculator, WindowStack, and UI components
 * Validation-Required: performance-benchmarking, cross-platform-compatibility, api-consistency
 * Pattern-Info: { approach: "utility-consolidation", alternatives: "separate-modules", trade-offs: "centralization-vs-modularity" }
 */

import * as chalk from 'chalk';
import { EventEmitter } from 'events';
import { TerminalColorTheme, DefaultColorThemes } from '../interfaces/terminal-ui-components';

/**
 * Terminal capabilities detection consolidated from multiple sources
 */
export interface TerminalCapabilities {
  supportsUnicode: boolean;
  supportsColor: boolean;
  colorDepth: number;
  width: number;
  height: number;
  platform: string;
}

/**
 * Border character sets for different terminal capabilities
 */
export interface BorderChars {
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
}

/**
 * Window configuration options
 */
export interface WindowConfig {
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  padding?: number;
  theme?: TerminalColorTheme;
  useUnicode?: boolean;
  showBorders?: boolean;
  borderStyle?: 'single' | 'double' | 'rounded' | 'thick';
}

/**
 * Layout calculation results with optimization metrics
 */
export interface LayoutResult {
  calculatedWidth: number;
  calculatedHeight: number;
  contentWidth: number;
  contentHeight: number;
  paddingWidth: number;
  borderWidth: number;
  isOptimal: boolean;
  utilizationRatio: number;
  recommendations: string[];
  performanceMetrics: {
    calculationTime: number;
    memoryUsage: number;
    optimizationLevel: 'low' | 'medium' | 'high';
  };
}

/**
 * Content processing options
 */
export interface ContentProcessingOptions {
  maxWidth?: number;
  truncateMode?: 'ellipsis' | 'wrap' | 'cut';
  preserveFormatting?: boolean;
  handleMultiByte?: boolean;
  stripAnsi?: boolean;
}

/**
 * Window state for management
 */
export interface WindowState {
  id: string;
  title: string;
  content: string[];
  metadata: Record<string, any>;
  timestamp: number;
  parentId?: string;
}

/**
 * Terminal capabilities detector (consolidated from multiple sources)
 */
export class TerminalDetector {
  private static _capabilities: TerminalCapabilities | null = null;

  static getCapabilities(): TerminalCapabilities {
    if (!this._capabilities) {
      this._capabilities = this.detectCapabilities();
    }
    return this._capabilities;
  }

  private static detectCapabilities(): TerminalCapabilities {
    const platform = process.platform;
    const terminalType = process.env.TERM || 'unknown';
    const colorTerm = process.env.COLORTERM;
    
    // Consolidated detection logic from BorderCapabilityDetector and other sources
    const supportsUnicode = this.detectUnicode(terminalType, platform);
    const supportsColor = this.detectColor(terminalType, colorTerm);
    const colorDepth = this.detectColorDepth(terminalType, colorTerm);

    return {
      supportsUnicode,
      supportsColor,
      colorDepth,
      width: process.stdout.columns || 80,
      height: process.stdout.rows || 24,
      platform
    };
  }

  private static detectUnicode(terminalType: string, platform: string): boolean {
    // Windows-specific checks
    if (platform === 'win32') {
      const windowsTerminal = process.env.WT_SESSION;
      const powershellHost = process.env.TERM_PROGRAM;
      if (windowsTerminal || powershellHost === 'vscode') return true;
      if (terminalType === 'unknown' || terminalType.includes('cmd')) return false;
    }

    // Known Unicode-compatible terminals
    const unicodeTerminals = ['xterm-256color', 'alacritty', 'kitty', 'screen-256color'];
    if (unicodeTerminals.includes(terminalType)) return true;

    // Locale-based detection
    const locale = process.env.LC_ALL || process.env.LANG || '';
    return locale.includes('UTF-8') || locale.includes('utf8');
  }

  private static detectColor(terminalType: string, colorTerm?: string): boolean {
    if (process.env.NO_COLOR || process.env.NODE_DISABLE_COLORS) return false;
    if (process.env.FORCE_COLOR) return true;
    if (colorTerm) return true;
    
    return terminalType.includes('color') || terminalType.includes('256');
  }

  private static detectColorDepth(terminalType: string, colorTerm?: string): number {
    if (!this.detectColor(terminalType, colorTerm)) return 0;
    if (colorTerm === 'truecolor' || colorTerm === '24bit') return 24;
    if (terminalType.includes('256') || colorTerm === '256') return 8;
    if (terminalType.includes('color')) return 4;
    return 3;
  }
}

/**
 * Content processor for text handling (consolidated from multiple sources)
 */
export class ContentProcessor {
  /**
   * Get display width accounting for multi-byte characters and ANSI codes
   */
  static getDisplayWidth(text: string): number {
    // Strip ANSI codes first
    const stripped = text.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
    
    let width = 0;
    for (const char of stripped) {
      const codePoint = char.codePointAt(0);
      if (!codePoint || codePoint < 32) continue;
      
      // Wide characters (CJK, emojis) take 2 spaces
      if (this.isWideCharacter(codePoint)) {
        width += 2;
      } else if (!this.isZeroWidth(codePoint)) {
        width += 1;
      }
    }
    
    return width;
  }

  /**
   * Truncate text to fit width with ellipsis
   */
  static truncateToWidth(text: string, maxWidth: number, ellipsis = '…'): string {
    if (this.getDisplayWidth(text) <= maxWidth) return text;

    const ellipsisWidth = this.getDisplayWidth(ellipsis);
    const targetWidth = maxWidth - ellipsisWidth;
    
    let result = '';
    let currentWidth = 0;
    
    for (const char of text) {
      const charWidth = this.getDisplayWidth(char);
      if (currentWidth + charWidth > targetWidth) break;
      
      result += char;
      currentWidth += charWidth;
    }
    
    return result + ellipsis;
  }

  /**
   * Word wrap text to fit within specified width
   */
  static wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (this.getDisplayWidth(testLine) <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
        
        // Handle words longer than maxWidth
        while (this.getDisplayWidth(currentLine) > maxWidth) {
          const cutPoint = this.findCutPoint(currentLine, maxWidth);
          lines.push(currentLine.substring(0, cutPoint));
          currentLine = currentLine.substring(cutPoint);
        }
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  private static isWideCharacter(codePoint: number): boolean {
    // Consolidated wide character detection
    return (codePoint >= 0x1100 && codePoint <= 0x115F) || // Hangul Jamo
           (codePoint >= 0x2E80 && codePoint <= 0x2EFF) || // CJK Radicals
           (codePoint >= 0x3000 && codePoint <= 0x303F) || // CJK Symbols
           (codePoint >= 0x3040 && codePoint <= 0x30FF) || // Hiragana/Katakana
           (codePoint >= 0x3400 && codePoint <= 0x9FFF) || // CJK Ideographs
           (codePoint >= 0xAC00 && codePoint <= 0xD7AF) || // Hangul Syllables
           (codePoint >= 0x1F300 && codePoint <= 0x1F9FF);  // Emoji blocks
  }

  private static isZeroWidth(codePoint: number): boolean {
    return (codePoint >= 0x0300 && codePoint <= 0x036F) || // Combining marks
           codePoint === 0x200B || // Zero Width Space
           codePoint === 0x200C || // Zero Width Non-Joiner
           codePoint === 0x200D;   // Zero Width Joiner
  }

  private static findCutPoint(text: string, maxWidth: number): number {
    let width = 0;
    for (let i = 0; i < text.length; i++) {
      width += this.getDisplayWidth(text[i]);
      if (width > maxWidth) return Math.max(1, i);
    }
    return text.length;
  }
}

/**
 * Layout calculator (consolidated from WidthCalculator and layout engines)
 */
export class LayoutCalculator {
  private capabilities: TerminalCapabilities;

  constructor() {
    this.capabilities = TerminalDetector.getCapabilities();
  }

  /**
   * Calculate optimal layout dimensions with performance metrics
   */
  calculateLayout(content: string[], config: WindowConfig = {}): LayoutResult {
    const startTime = performance.now();
    
    // Analyze content
    const contentAnalysis = this.analyzeContent(content);
    
    // Calculate dimensions
    const padding = config.padding || 3;
    const borderWidth = config.showBorders !== false ? 2 : 0;
    const paddingWidth = padding * 2;
    
    // Width calculation
    let calculatedWidth = contentAnalysis.maxLineWidth + paddingWidth + borderWidth;
    
    if (config.width) {
      calculatedWidth = config.width;
    } else {
      const minWidth = config.minWidth || 40;
      const maxWidth = config.maxWidth || Math.min(this.capabilities.width - 4, 120);
      calculatedWidth = Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
    }
    
    // Height calculation
    let calculatedHeight = contentAnalysis.totalLines + (config.showBorders !== false ? 2 : 0);
    if (config.title) calculatedHeight += 1;
    if (config.subtitle) calculatedHeight += 1;
    if (config.height) calculatedHeight = config.height;
    
    // Content dimensions
    const contentWidth = calculatedWidth - paddingWidth - borderWidth;
    const contentHeight = calculatedHeight - (config.showBorders !== false ? 2 : 0);
    
    // Optimization metrics
    const utilizationRatio = contentWidth > 0 ? contentAnalysis.averageLineWidth / contentWidth : 0;
    const isOptimal = utilizationRatio >= 0.6 && utilizationRatio <= 0.9;
    
    const calculationTime = performance.now() - startTime;
    
    return {
      calculatedWidth,
      calculatedHeight,
      contentWidth,
      contentHeight,
      paddingWidth,
      borderWidth,
      isOptimal,
      utilizationRatio,
      recommendations: this.generateRecommendations(utilizationRatio, contentAnalysis),
      performanceMetrics: {
        calculationTime,
        memoryUsage: this.estimateMemoryUsage(content),
        optimizationLevel: this.getOptimizationLevel(calculationTime, utilizationRatio)
      }
    };
  }

  private analyzeContent(content: string[]): {
    maxLineWidth: number;
    totalLines: number;
    averageLineWidth: number;
    hasComplexContent: boolean;
  } {
    let maxLineWidth = 0;
    let totalWidth = 0;
    let hasComplexContent = false;
    
    for (const line of content) {
      const lineWidth = ContentProcessor.getDisplayWidth(line);
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
      totalWidth += lineWidth;
      
      // Check for complex content
      if (!hasComplexContent && (lineWidth !== line.length || line.includes('\u001b['))) {
        hasComplexContent = true;
      }
    }
    
    return {
      maxLineWidth,
      totalLines: content.length,
      averageLineWidth: content.length > 0 ? totalWidth / content.length : 0,
      hasComplexContent
    };
  }

  private generateRecommendations(utilizationRatio: number, analysis: any): string[] {
    const recommendations = [];
    
    if (utilizationRatio < 0.4) {
      recommendations.push('Consider reducing window width for better space utilization');
    } else if (utilizationRatio > 0.95) {
      recommendations.push('Consider increasing window width to prevent text truncation');
    }
    
    if (analysis.hasComplexContent) {
      recommendations.push('Complex content detected - ensure terminal supports formatting');
    }
    
    if (analysis.maxLineWidth > this.capabilities.width * 0.8) {
      recommendations.push('Content approaching terminal width limits');
    }
    
    return recommendations;
  }

  private estimateMemoryUsage(content: string[]): number {
    return content.reduce((total, line) => total + line.length * 2, 0); // Rough estimate
  }

  private getOptimizationLevel(calculationTime: number, utilizationRatio: number): 'low' | 'medium' | 'high' {
    if (calculationTime < 1 && utilizationRatio >= 0.6 && utilizationRatio <= 0.9) return 'high';
    if (calculationTime < 5 && utilizationRatio >= 0.4) return 'medium';
    return 'low';
  }
}

/**
 * Border manager (consolidated from BorderRenderer and other sources)
 */
export class BorderManager {
  private capabilities: TerminalCapabilities;
  private borderChars: Record<string, BorderChars>;

  constructor() {
    this.capabilities = TerminalDetector.getCapabilities();
    this.borderChars = {
      single: {
        topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘',
        horizontal: '─', vertical: '│',
        topTee: '┬', bottomTee: '┴', leftTee: '├', rightTee: '┤'
      },
      double: {
        topLeft: '╔', topRight: '╗', bottomLeft: '╚', bottomRight: '╝',
        horizontal: '═', vertical: '║',
        topTee: '╦', bottomTee: '╩', leftTee: '╠', rightTee: '╣'
      },
      rounded: {
        topLeft: '╭', topRight: '╮', bottomLeft: '╰', bottomRight: '╯',
        horizontal: '─', vertical: '│',
        topTee: '┬', bottomTee: '┴', leftTee: '├', rightTee: '┤'
      },
      ascii: {
        topLeft: '+', topRight: '+', bottomLeft: '+', bottomRight: '+',
        horizontal: '-', vertical: '|',
        topTee: '+', bottomTee: '+', leftTee: '+', rightTee: '+'
      }
    };
  }

  /**
   * Render borders around content
   */
  renderBorders(content: string[], config: WindowConfig, layout: LayoutResult): string[] {
    const style = config.borderStyle || 'single';
    const useUnicode = config.useUnicode !== false && this.capabilities.supportsUnicode;
    const chars = this.borderChars[useUnicode ? style : 'ascii'];
    const theme = config.theme || DefaultColorThemes.default;
    
    const lines: string[] = [];
    const width = layout.calculatedWidth;
    const padding = config.padding || 3;
    
    // Top border
    lines.push(theme.primary(chars.topLeft + chars.horizontal.repeat(width - 2) + chars.topRight));
    
    // Title and subtitle
    if (config.title) {
      lines.push(this.renderTitleLine(config.title, chars, theme, width, padding));
      if (config.subtitle) {
        lines.push(this.renderSubtitleLine(config.subtitle, chars, theme, width, padding));
      }
      lines.push(theme.primary(chars.leftTee + chars.horizontal.repeat(width - 2) + chars.rightTee));
    }
    
    // Content lines
    for (const line of content) {
      lines.push(this.renderContentLine(line, chars, theme, width, padding));
    }
    
    // Bottom border
    lines.push(theme.primary(chars.bottomLeft + chars.horizontal.repeat(width - 2) + chars.bottomRight));
    
    return lines;
  }

  private renderTitleLine(title: string, chars: BorderChars, theme: TerminalColorTheme, width: number, padding: number): string {
    const availableWidth = width - 2 - (padding * 2);
    const truncatedTitle = ContentProcessor.truncateToWidth(title, availableWidth);
    const paddedTitle = truncatedTitle.padEnd(availableWidth);
    
    return theme.primary(chars.vertical) +
           ' '.repeat(padding) +
           theme.accent(paddedTitle) +
           ' '.repeat(padding) +
           theme.primary(chars.vertical);
  }

  private renderSubtitleLine(subtitle: string, chars: BorderChars, theme: TerminalColorTheme, width: number, padding: number): string {
    const availableWidth = width - 2 - (padding * 2);
    const truncatedSubtitle = ContentProcessor.truncateToWidth(subtitle, availableWidth);
    const paddedSubtitle = truncatedSubtitle.padEnd(availableWidth);
    
    return theme.primary(chars.vertical) +
           ' '.repeat(padding) +
           theme.muted(paddedSubtitle) +
           ' '.repeat(padding) +
           theme.primary(chars.vertical);
  }

  private renderContentLine(content: string, chars: BorderChars, theme: TerminalColorTheme, width: number, padding: number): string {
    const availableWidth = width - 2 - (padding * 2);
    const truncatedContent = ContentProcessor.truncateToWidth(content, availableWidth);
    const paddedContent = truncatedContent.padEnd(availableWidth);
    
    return theme.primary(chars.vertical) +
           ' '.repeat(padding) +
           paddedContent +
           ' '.repeat(padding) +
           theme.primary(chars.vertical);
  }
}

/**
 * Main WindowUtils class with chainable API
 */
export class WindowUtils {
  private config: WindowConfig = {};
  private content: string[] = [];
  private layoutResult?: LayoutResult;
  private borderManager: BorderManager;
  private layoutCalculator: LayoutCalculator;

  constructor() {
    this.borderManager = new BorderManager();
    this.layoutCalculator = new LayoutCalculator();
  }

  /**
   * Create new WindowUtils instance
   */
  static create(): WindowUtils {
    return new WindowUtils();
  }

  /**
   * Set window content (chainable)
   */
  withContent(content: string[]): this {
    this.content = [...content];
    return this;
  }

  /**
   * Set window title (chainable)
   */
  withTitle(title: string, subtitle?: string): this {
    this.config.title = title;
    if (subtitle) this.config.subtitle = subtitle;
    return this;
  }

  /**
   * Configure borders (chainable)
   */
  withBorders(style: 'single' | 'double' | 'rounded' = 'single', enabled = true): this {
    this.config.showBorders = enabled;
    this.config.borderStyle = style;
    return this;
  }

  /**
   * Set dimensions (chainable)
   */
  withDimensions(width?: number, height?: number): this {
    if (width) this.config.width = width;
    if (height) this.config.height = height;
    return this;
  }

  /**
   * Set constraints (chainable)
   */
  withConstraints(minWidth?: number, maxWidth?: number): this {
    if (minWidth) this.config.minWidth = minWidth;
    if (maxWidth) this.config.maxWidth = maxWidth;
    return this;
  }

  /**
   * Set theme (chainable)
   */
  withTheme(theme: TerminalColorTheme): this {
    this.config.theme = theme;
    return this;
  }

  /**
   * Set padding (chainable)
   */
  withPadding(padding: number): this {
    this.config.padding = padding;
    return this;
  }

  /**
   * Calculate layout (chainable)
   */
  calculateLayout(): this {
    this.layoutResult = this.layoutCalculator.calculateLayout(this.content, this.config);
    return this;
  }

  /**
   * Get layout result
   */
  getLayout(): LayoutResult | undefined {
    return this.layoutResult;
  }

  /**
   * Render window to string
   */
  render(): string {
    if (!this.layoutResult) {
      this.calculateLayout();
    }

    if (this.config.showBorders === false) {
      // Plain text rendering
      const lines = [...this.content];
      if (this.config.title) {
        lines.unshift(`=== ${this.config.title} ===`);
        if (this.config.subtitle) {
          lines.unshift(this.config.subtitle);
        }
        lines.unshift('');
      }
      return lines.join('\n');
    }

    // Bordered rendering
    const borderedLines = this.borderManager.renderBorders(this.content, this.config, this.layoutResult!);
    return borderedLines.join('\n');
  }

  /**
   * Process and wrap content to fit width
   */
  processContent(options: ContentProcessingOptions = {}): this {
    const maxWidth = options.maxWidth || this.layoutResult?.contentWidth || 80;
    
    const processedContent: string[] = [];
    for (const line of this.content) {
      if (options.truncateMode === 'wrap') {
        processedContent.push(...ContentProcessor.wrapText(line, maxWidth));
      } else if (options.truncateMode === 'ellipsis') {
        processedContent.push(ContentProcessor.truncateToWidth(line, maxWidth));
      } else {
        processedContent.push(line);
      }
    }
    
    this.content = processedContent;
    return this;
  }

  /**
   * Get terminal capabilities
   */
  static getTerminalCapabilities(): TerminalCapabilities {
    return TerminalDetector.getCapabilities();
  }

  /**
   * Measure content dimensions
   */
  static measureContent(content: string[]): { width: number; height: number } {
    let maxWidth = 0;
    for (const line of content) {
      maxWidth = Math.max(maxWidth, ContentProcessor.getDisplayWidth(line));
    }
    return { width: maxWidth, height: content.length };
  }

  /**
   * Validate window configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (this.content.length === 0) {
      errors.push('No content provided');
    }
    
    if (this.config.width && this.config.width < 10) {
      errors.push('Width too small (minimum 10)');
    }
    
    const capabilities = TerminalDetector.getCapabilities();
    if (this.config.width && this.config.width > capabilities.width) {
      errors.push('Width exceeds terminal width');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset configuration
   */
  reset(): this {
    this.config = {};
    this.content = [];
    this.layoutResult = undefined;
    return this;
  }

  /**
   * Clone current configuration
   */
  clone(): WindowUtils {
    const clone = new WindowUtils();
    clone.config = { ...this.config };
    clone.content = [...this.content];
    clone.layoutResult = this.layoutResult;
    return clone;
  }
}

/**
 * Convenience functions for common operations
 */
export const createWindow = (content: string[], title?: string): string => {
  return WindowUtils.create()
    .withContent(content)
    .withTitle(title || '')
    .withBorders()
    .calculateLayout()
    .render();
};

export const createSimpleBox = (text: string, title?: string): string => {
  const lines = text.split('\n');
  return WindowUtils.create()
    .withContent(lines)
    .withTitle(title || '')
    .withBorders('single')
    .calculateLayout()
    .render();
};

export const measureText = (text: string): { width: number; height: number } => {
  const lines = text.split('\n');
  return WindowUtils.measureContent(lines);
};

export const getTerminalInfo = (): TerminalCapabilities => {
  return WindowUtils.getTerminalCapabilities();
};

/**
 * Performance benchmarking utility
 */
export const benchmarkWindowRendering = (content: string[], iterations = 100): {
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput: number;
} => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    WindowUtils.create()
      .withContent(content)
      .withBorders()
      .calculateLayout()
      .render();
    times.push(performance.now() - start);
  }
  
  return {
    averageTime: times.reduce((a, b) => a + b) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    throughput: iterations / (times.reduce((a, b) => a + b) / 1000)
  };
};

// Export everything for backward compatibility and individual use
export {
  TerminalDetector,
  ContentProcessor,
  LayoutCalculator,
  BorderManager
};

export default WindowUtils;
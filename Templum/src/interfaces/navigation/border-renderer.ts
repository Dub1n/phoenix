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

import * as chalk from 'chalk';
import { TerminalColorTheme, DefaultColorThemes } from '../terminal-ui-components';

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

export interface WindowBorderConfig {
  title?: string;
  subtitle?: string;
  width: number;
  height: number;
  padding: number;
  theme: TerminalColorTheme;
  useUnicode: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  doubleWidth: boolean;
}

export interface TerminalCapabilities {
  supportsUnicode: boolean;
  supportsColor: boolean;
  colorDepth: number;
  width: number;
  height: number;
  terminalType: string;
}

/**
 * Terminal capability detection for Unicode and color support
 */
export class BorderCapabilityDetector {
  private static _capabilities: TerminalCapabilities | null = null;

  static getCapabilities(): TerminalCapabilities {
    if (!this._capabilities) {
      this._capabilities = this.detectCapabilities();
    }
    return this._capabilities;
  }

  private static detectCapabilities(): TerminalCapabilities {
    const terminalType = process.env.TERM || 'unknown';
    const colorTerm = process.env.COLORTERM;
    const width = process.stdout.columns || 80;
    const height = process.stdout.rows || 24;

    // Detect Unicode support
    const supportsUnicode = this.detectUnicodeSupport(terminalType);
    
    // Detect color support
    const supportsColor = this.detectColorSupport(terminalType, colorTerm);
    const colorDepth = this.detectColorDepth(terminalType, colorTerm);

    return {
      supportsUnicode,
      supportsColor,
      colorDepth,
      width,
      height,
      terminalType
    };
  }

  private static detectUnicodeSupport(terminalType: string): boolean {
    // Known terminals with good Unicode support
    const unicodeTerminals = [
      'xterm-256color',
      'xterm-color',
      'screen-256color',
      'tmux-256color',
      'alacritty',
      'kitty'
    ];

    // Windows environments may have issues with Unicode
    if (process.platform === 'win32') {
      // Windows Terminal and newer PowerShell support Unicode
      const windowsTerminal = process.env.WT_SESSION;
      const powershellHost = process.env.TERM_PROGRAM;
      
      if (windowsTerminal || powershellHost === 'vscode') {
        return true;
      }
      
      // Traditional cmd.exe and older PowerShell don't
      if (terminalType === 'unknown' || terminalType.includes('cmd')) {
        return false;
      }
    }

    // Check for known good terminals
    if (unicodeTerminals.includes(terminalType)) {
      return true;
    }

    // Check UTF-8 locale
    const locale = process.env.LC_ALL || process.env.LANG || '';
    if (locale.includes('UTF-8') || locale.includes('utf8')) {
      return true;
    }

    // Conservative default for unknown terminals
    return terminalType.includes('xterm') || terminalType.includes('screen');
  }

  private static detectColorSupport(terminalType: string, colorTerm?: string): boolean {
    // Force color disabled
    if (process.env.NO_COLOR || process.env.NODE_DISABLE_COLORS) {
      return false;
    }

    // Force color enabled
    if (process.env.FORCE_COLOR) {
      return true;
    }

    // Check COLORTERM
    if (colorTerm) {
      return true;
    }

    // Check terminal capabilities
    const colorTerminals = [
      'xterm-256color',
      'xterm-color',
      'screen-256color',
      'tmux-256color'
    ];

    return colorTerminals.includes(terminalType) || 
           terminalType.includes('256color') || 
           terminalType.includes('color');
  }

  private static detectColorDepth(terminalType: string, colorTerm?: string): number {
    if (!this.detectColorSupport(terminalType, colorTerm)) {
      return 0;
    }

    // 24-bit color support
    if (colorTerm === 'truecolor' || colorTerm === '24bit') {
      return 24;
    }

    // 256 color support
    if (terminalType.includes('256') || colorTerm === '256') {
      return 8;
    }

    // 16 color support
    if (terminalType.includes('color')) {
      return 4;
    }

    // Basic 8 color support
    return 3;
  }

  /**
   * Test Unicode character rendering in terminal
   */
  static async testUnicodeRendering(): Promise<boolean> {
    return new Promise((resolve) => {
      // This is a simplified test - in a real implementation,
      // we might need to actually render characters and check output
      const capabilities = this.getCapabilities();
      resolve(capabilities.supportsUnicode);
    });
  }
}

/**
 * Border rendering system with Unicode support and ASCII fallback
 */
export class BorderRenderer {
  private config: WindowBorderConfig;
  private borderChars: BorderCharacterSet;
  private capabilities: TerminalCapabilities;

  constructor(config: Partial<WindowBorderConfig> = {}) {
    this.capabilities = BorderCapabilityDetector.getCapabilities();
    
    this.config = {
      width: 60,
      height: 10,
      padding: 3,
      theme: DefaultColorThemes.default,
      useUnicode: this.capabilities.supportsUnicode,
      showTitle: true,
      showSubtitle: true,
      doubleWidth: false,
      ...config
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
    const processed: string[] = [];
    
    for (const line of content) {
      if (line.length <= maxWidth) {
        processed.push(line);
      } else {
        // Word wrap long lines
        const wrapped = this.wrapLine(line, maxWidth);
        processed.push(...wrapped);
      }
    }
    
    return processed;
  }

  /**
   * Word wrap a line to fit within specified width
   */
  private wrapLine(line: string, maxWidth: number): string[] {
    const words = line.split(' ');
    const wrapped: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxWidth) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) {
          wrapped.push(currentLine);
          currentLine = word;
        } else {
          // Single word longer than maxWidth, force break
          wrapped.push(word.substring(0, maxWidth));
          currentLine = word.substring(maxWidth);
        }
      }
    }
    
    if (currentLine) {
      wrapped.push(currentLine);
    }
    
    return wrapped;
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

  /**
   * Render title line within border
   */
  private renderTitleLine(title: string, config: WindowBorderConfig): string {
    const { theme, width, padding } = config;
    const availableWidth = width - 2 - (padding * 2); // -2 for border chars
    
    const truncatedTitle = title.length > availableWidth 
      ? title.substring(0, availableWidth - 1) + '…'
      : title;
    
    const paddedTitle = truncatedTitle.padEnd(availableWidth);
    const paddingStr = ' '.repeat(padding);
    
    return theme.primary(this.borderChars.vertical) +
           paddingStr +
           theme.accent(paddedTitle) +
           paddingStr +
           theme.primary(this.borderChars.vertical);
  }

  /**
   * Render subtitle line within border
   */
  private renderSubtitleLine(subtitle: string, config: WindowBorderConfig): string {
    const { theme, width, padding } = config;
    const availableWidth = width - 2 - (padding * 2); // -2 for border chars
    
    const truncatedSubtitle = subtitle.length > availableWidth 
      ? subtitle.substring(0, availableWidth - 1) + '…'
      : subtitle;
    
    const paddedSubtitle = truncatedSubtitle.padEnd(availableWidth);
    const paddingStr = ' '.repeat(padding);
    
    return theme.primary(this.borderChars.vertical) +
           paddingStr +
           theme.muted(paddedSubtitle) +
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
    
    const truncatedContent = content.length > availableWidth 
      ? content.substring(0, availableWidth - 1) + '…'
      : content;
    
    const paddedContent = truncatedContent.padEnd(availableWidth);
    const paddingStr = ' '.repeat(padding);
    
    return theme.primary(this.borderChars.vertical) +
           paddingStr +
           paddedContent +
           paddingStr +
           theme.primary(this.borderChars.vertical);
  }

  /**
   * Calculate optimal window dimensions for given content
   */
  calculateOptimalDimensions(content: string[], minWidth = 40, maxWidth = 120): { width: number; height: number } {
    // Find longest line
    let maxContentWidth = 0;
    for (const line of content) {
      maxContentWidth = Math.max(maxContentWidth, line.length);
    }
    
    // Add padding and border space
    const totalWidth = Math.max(
      minWidth,
      Math.min(maxWidth, maxContentWidth + (this.config.padding * 2) + 2)
    );
    
    // Calculate height based on content and wrapped lines
    let totalHeight = 2; // Top and bottom borders
    
    if (this.config.showTitle && this.config.title) {
      totalHeight += 1; // Title line
      if (this.config.showSubtitle && this.config.subtitle) {
        totalHeight += 1; // Subtitle line
      }
      totalHeight += 1; // Separator line
    }
    
    const contentWidth = totalWidth - (this.config.padding * 2) - 2;
    for (const line of content) {
      if (line.length <= contentWidth) {
        totalHeight += 1;
      } else {
        // Count wrapped lines
        const wrappedLines = this.wrapLine(line, contentWidth);
        totalHeight += wrappedLines.length;
      }
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
    return BorderCapabilityDetector.testUnicodeRendering();
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
  setTheme(theme: TerminalColorTheme): void {
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

  constructor(config: Partial<WindowBorderConfig & { includeScreenReaderLabels: boolean }> = {}) {
    super(config);
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
export function createBorderRenderer(config?: Partial<WindowBorderConfig>): BorderRenderer {
  const capabilities = BorderCapabilityDetector.getCapabilities();
  
  const defaultConfig: Partial<WindowBorderConfig> = {
    useUnicode: capabilities.supportsUnicode,
    theme: capabilities.supportsColor ? DefaultColorThemes.default : {
      ...DefaultColorThemes.default,
      primary: chalk.reset,
      secondary: chalk.reset,
      success: chalk.reset,
      warning: chalk.reset,
      error: chalk.reset,
      info: chalk.reset,
      accent: chalk.reset,
      muted: chalk.reset
    }
  };
  
  return new BorderRenderer({ ...defaultConfig, ...config });
}

/**
 * Factory function for creating accessible border renderer
 */
export function createAccessibleBorderRenderer(config?: Partial<WindowBorderConfig & { includeScreenReaderLabels: boolean }>): AccessibleBorderRenderer {
  const capabilities = BorderCapabilityDetector.getCapabilities();
  
  const defaultConfig = {
    useUnicode: capabilities.supportsUnicode,
    theme: capabilities.supportsColor ? DefaultColorThemes.default : {
      ...DefaultColorThemes.default,
      primary: chalk.reset,
      secondary: chalk.reset,
      success: chalk.reset,
      warning: chalk.reset,
      error: chalk.reset,
      info: chalk.reset,
      accent: chalk.reset,
      muted: chalk.reset
    },
    includeScreenReaderLabels: false
  };
  
  return new AccessibleBorderRenderer({ ...defaultConfig, ...config });
}

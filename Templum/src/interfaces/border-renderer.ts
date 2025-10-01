/**
---
date: 2025-09-12T174343Z
name: border-renderer
TASK-ID: [TASK-MCP-006]
category: CLI Text Standardization
status: [T]
patterns: [Structured Windows, Border Rendering, Terminal Compatibility]
components: [BorderRenderer, WindowLayout, ContentAnalyzer]
dependencies: [Terminal UI Components, CLI Adapter]
tags: [border-rendering, window-layout, cli-compliance]
---
 * 
 * Border Renderer System
 * 
 * Implements structured window borders with proper nesting and text standardization.
 * Provides fallback support for terminals that don't support box-drawing characters.
*/

import { StringUtils, StringWidthUtils } from '../utils/chainable-string-utils';

export interface BorderCharacters {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
  crossTop: string;
  crossBottom: string;
  crossLeft: string;
  crossRight: string;
  cross: string;
}

export interface BorderRenderConfig {
  enableBoxDrawing: boolean;
  fallbackMode: boolean;
  minWidth: number;
  maxWidth: number;
  padding: number;
  style: 'simple' | 'double' | 'rounded';
}

export interface WindowContent {
  title?: string;
  subtitle?: string;
  content: string[];
  footer?: string;
}

export interface WindowOptions {
  width?: number;
  height?: number;
  borderSet?: string;
  theme?: WindowTheme;
  enableBoxDrawing?: boolean;
  fallbackMode?: boolean | string;
  padding?: number;
  style?: 'simple' | 'double' | 'rounded';
}

export interface WindowTheme {
  primary?: string | ((text: string) => string);
  secondary?: string | ((text: string) => string);
  accent?: string | ((text: string) => string);
  border: string | ((text: string) => string);
  background?: string | ((text: string) => string);
  text?: string | ((text: string) => string);
  title?: string | ((text: string) => string);
  content: string | ((text: string) => string);
  footer?: string | ((text: string) => string);
}

/**
 * Border character sets for different styles and compatibility modes
 */
export const BORDER_CHARACTER_SETS: Record<string, BorderCharacters> = {
  // ASCII fallback mode - maximum compatibility
  ascii: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
    crossTop: '+',
    crossBottom: '+',
    crossLeft: '+',
    crossRight: '+',
    cross: '+'
  },
  
  // Simple box drawing - good terminal support
  simple: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    crossTop: '┬',
    crossBottom: '┴',
    crossLeft: '├',
    crossRight: '┤',
    cross: '┼'
  },
  
  // Double line box drawing - enhanced appearance
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    crossTop: '╦',
    crossBottom: '╩',
    crossLeft: '╠',
    crossRight: '╣',
    cross: '╬'
  },
  
  // Rounded corners - modern appearance
  rounded: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
    crossTop: '┬',
    crossBottom: '┴',
    crossLeft: '├',
    crossRight: '┤',
    cross: '┼'
  }
};

/**
 * Window Layout Calculator
 */
export class WindowLayout {
  private config: BorderRenderConfig;
  
  constructor(config: Partial<BorderRenderConfig> = {}) {
    this.config = {
      enableBoxDrawing: true,
      fallbackMode: false,
      minWidth: 20,
      maxWidth: 120,
      padding: 2,
      style: 'simple',
      ...config
    };
  }
  
  /**
   * Calculate optimal window dimensions based on content
   */
  calculateWindowDimensions(content: string[]): { width: number; height: number } {
    const contentWidth = Math.max(...content.map(line => this.measureLineWidth(line)));
    const contentHeight = content.length;
    
    // Add padding and borders
    const totalPadding = this.config.padding * 2;
    const borderWidth = 2; // left and right borders
    const borderHeight = 2; // top and bottom borders
    
    const width = Math.min(
      Math.max(contentWidth + totalPadding + borderWidth, this.config.minWidth),
      this.config.maxWidth
    );
    
    const height = contentHeight + totalPadding + borderHeight;
    
    return { width, height };
  }
  
  /**
   * Measure the actual display width of a line (handles formatting)
   */
  private measureLineWidth(line: string): number {
    return StringWidthUtils.getDisplayWidth(line);
  }
  
  /**
   * Apply padding to content lines
   */
  applyPadding(content: string[], width: number): string[] {
    const availableWidth = Math.max(1, width - this.config.padding * 2 - 2); // subtract borders
    const paddingStr = ' '.repeat(this.config.padding);

    return content.map(line => {
      const formatted = StringUtils.chain(line, { mode: 'terminal' })
        .truncate(availableWidth, '...')
        .pad(availableWidth)
        .value();

      return paddingStr + formatted + paddingStr;
    });
  }
}

/**
 * Content Analyzer for measuring and formatting text
 */
export class ContentAnalyzer {
  /**
   * Analyze content and prepare it for window rendering
   */
  analyzeContent(content: string | string[]): {
    lines: string[];
    maxWidth: number;
    totalLines: number;
  } {
    const lines = Array.isArray(content) ? content : content.split('\n');
    const maxWidth = Math.max(...lines.map(line => this.measureText(line)));
    
    return {
      lines,
      maxWidth,
      totalLines: lines.length
    };
  }
  
  /**
   * Measure text width accounting for formatting and multi-byte characters
   */
  private measureText(text: string): number {
    return StringWidthUtils.getDisplayWidth(text);
  }
  
  /**
   * Wrap text to fit within specified width
   */
  wrapText(text: string, maxWidth: number): string[] {
    if (maxWidth <= 0) return [text];

    return StringUtils.wrap(text, Math.max(1, Math.floor(maxWidth)));
  }
}

/**
 * Border Renderer - Main class for creating structured windows
 */
export class BorderRenderer {
  private config: BorderRenderConfig;
  private characters!: BorderCharacters;
  private layout: WindowLayout;
  private analyzer: ContentAnalyzer;
  
  constructor(config: Partial<BorderRenderConfig> = {}) {
    this.config = {
      enableBoxDrawing: true,
      fallbackMode: false,
      minWidth: 20,
      maxWidth: 120,
      padding: 2,
      style: 'simple',
      ...config
    };
    
    this.layout = new WindowLayout(this.config);
    this.analyzer = new ContentAnalyzer();
    this.selectCharacterSet();
  }
  
  /**
   * Select appropriate character set based on config and terminal capabilities
   */
  private selectCharacterSet(): void {
    if (this.config.fallbackMode || !this.config.enableBoxDrawing) {
      this.characters = BORDER_CHARACTER_SETS.ascii;
    } else {
      this.characters = BORDER_CHARACTER_SETS[this.config.style] || BORDER_CHARACTER_SETS.simple;
    }
  }
  
  /**
   * Render a window with content
   */
  renderWindow(content: string | string[], title?: string): string;
  renderWindow(content: WindowContent, options?: WindowOptions): string;
  renderWindow(content: string | string[] | WindowContent, titleOrOptions?: string | WindowOptions): string {
    let actualContent: string[];
    let actualTitle: string | undefined;
    let actualOptions: WindowOptions | undefined;

    // Handle overloaded parameters
    if (typeof content === 'object' && 'content' in content) {
      // WindowContent interface
      const windowContent = content as WindowContent;
      actualContent = windowContent.content;
      actualTitle = windowContent.title;
      actualOptions = titleOrOptions as WindowOptions;
    } else {
      // string | string[] interface
      actualContent = Array.isArray(content) ? content : [content];
      actualTitle = titleOrOptions as string;
      actualOptions = undefined;
    }

    const analysis = this.analyzer.analyzeContent(actualContent);
    const dimensions = this.layout.calculateWindowDimensions(analysis.lines);
    const paddedContent = this.layout.applyPadding(analysis.lines, dimensions.width);
    
    const result: string[] = [];
    
    // Top border
    if (actualTitle) {
      result.push(this.renderTitleBorder(actualTitle, dimensions.width));
    } else {
      result.push(this.renderTopBorder(dimensions.width));
    }
    
    // Content with side borders
    for (const line of paddedContent) {
      result.push(this.renderContentLine(line, dimensions.width));
    }
    
    // Bottom border
    result.push(this.renderBottomBorder(dimensions.width));
    
    return result.join('\n');
  }
  
  /**
   * Render multiple windows in a nested structure
   */
  renderNestedWindows(windows: { content: string | string[]; title?: string }[]): string {
    const renderedWindows = windows.map(window => 
      this.renderWindow(window.content, window.title)
    );
    
    return renderedWindows.join('\n\n');
  }
  
  /**
   * Render top border
   */
  private renderTopBorder(width: number): string {
    const innerWidth = width - 2;
    return this.characters.topLeft + 
           this.characters.horizontal.repeat(innerWidth) + 
           this.characters.topRight;
  }
  
  /**
   * Render title border with embedded title
   */
  private renderTitleBorder(title: string, width: number): string {
    const innerWidth = width - 2;
    const formattedTitle = StringUtils.chain(` ${title} `, { mode: 'terminal' })
      .truncate(innerWidth, '…')
      .pad(innerWidth, 'center')
      .value();

    return this.characters.topLeft +
           formattedTitle +
           this.characters.topRight;
  }
  
  /**
   * Render content line with side borders
   */
  private renderContentLine(content: string, width: number): string {
    const innerWidth = width - 2;
    const formatted = StringUtils.chain(content, { mode: 'terminal' })
      .truncate(innerWidth, '…')
      .pad(innerWidth)
      .value();

    return this.characters.vertical + formatted + this.characters.vertical;
  }
  
  /**
   * Render bottom border
   */
  private renderBottomBorder(width: number): string {
    const innerWidth = width - 2;
    return this.characters.bottomLeft + 
           this.characters.horizontal.repeat(innerWidth) + 
           this.characters.bottomRight;
  }
  
  /**
   * Create a simple separator line
   */
  renderSeparator(width: number = 60): string {
    return this.characters.horizontal.repeat(width);
  }
  
  /**
   * Enable fallback mode for compatibility
   */
  enableFallbackMode(): void {
    this.config.fallbackMode = true;
    this.selectCharacterSet();
  }
  
  /**
   * Check if box drawing is supported (basic heuristic)
   */
  isBoxDrawingSupported(): boolean {
    // Basic check - in a real implementation you might check $TERM
    // or probe terminal capabilities
    return !this.config.fallbackMode && this.config.enableBoxDrawing;
  }
  
  /**
   * Set window style
   */
  setStyle(style: 'simple' | 'double' | 'rounded'): void {
    this.config.style = style;
    this.selectCharacterSet();
  }
  
  /**
   * Get current configuration
   */
  getConfig(): BorderRenderConfig {
    return { ...this.config };
  }
  
  /**
   * Get current character set
   */
  getCharacterSet(): BorderCharacters {
    return { ...this.characters };
  }
}

/**
 * Default border renderer instance
 */
export const defaultBorderRenderer = new BorderRenderer({
  enableBoxDrawing: true,
  fallbackMode: false,
  style: 'simple',
  padding: 2
});

/**
 * Fallback border renderer for maximum compatibility
 */
export const fallbackBorderRenderer = new BorderRenderer({
  enableBoxDrawing: false,
  fallbackMode: true,
  style: 'simple',
  padding: 2
});

/**
 * Utility functions for common operations
 */
export function renderSimpleWindow(content: string | string[], title?: string): string {
  return defaultBorderRenderer.renderWindow(content, title);
}

export function renderCompatibleWindow(content: string | string[], title?: string): string {
  return fallbackBorderRenderer.renderWindow(content, title);
}

export function createSeparator(width: number = 60): string {
  return defaultBorderRenderer.renderSeparator(width);
}

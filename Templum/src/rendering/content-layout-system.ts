/**
---
date: 2025-09-12T174643Z
name: content-layout-system
TASK-ID:
  - TASK-MCP-006
category: rendering
status:
  - "[T]"
patterns:
  - adaptive-layout
  - terminal-compatibility
  - progressive-enhancement
components:
  - BorderRenderer
  - ContentAnalyzer
  - WindowLayout
dependencies:
  - terminal-ui-components
  - chalk
  - string-width
tags:
  - content-rendering
  - layout-management
  - terminal-ui
  - adaptive-formatting
---
 * 
 * Content Rendering and Layout Management System
 * 
 * Implements structured window design with adaptive formatting, terminal compatibility,
 * and content degradation for CLI interfaces.
 * 
 * Design Requirements:
 * - Structured ┌─┐ bordered windows with proper nesting
 * - Complete emoji elimination with › selector character
 * - Dynamic width based on widest content across all pages
 * - 3-character padding between borders and content
 * - Terminal compatibility with graceful degradation
 */

import { EventEmitter } from 'events';
import {
  createFormatter,
  TerminalFormatter,
  type TerminalCapabilities as FormatterCapabilities,
  type TerminalTheme,
} from '../utils/terminal-formatter';
import { StringUtils, StringWidthUtils } from '../utils/chainable-string-utils';

// Terminal capability detection
export interface TerminalCapabilities {
  supportsUnicode: boolean;
  supportsBoxDrawing: boolean;
  supportsColor: boolean;
  width: number;
  height: number;
}

// Window layout configuration
export interface WindowLayoutConfig {
  minWidth: number;
  maxWidth: number;
  padding: number;
  borderStyle: 'unicode' | 'ascii';
  enableColors: boolean;
}

// Content structure definitions
export interface WindowContent {
  title?: string;
  subtitle?: string;
  sections: ContentSection[];
  footer?: string;
  navigationItems?: ContentItem[]; // For Back, Home, Help, Exit
  isNestedWindow?: boolean;
  parentTitle?: string;
}

export interface ContentSection {
  id: string;
  heading?: string;
  items: ContentItem[];
}

export interface ContentItem {
  id: string;
  label: string;
  description?: string;
  selected?: boolean;
  enabled?: boolean;
  prefix?: string;
  isSelector?: boolean; // For the '›' selector character
}

// Layout calculation results
export interface CalculatedLayout {
  totalWidth: number;
  contentWidth: number;
  borderChars: BorderCharSet;
  padding: string;
  needsDegradation: boolean;
  supportsColors: boolean;
  titleCentered: boolean;
  hasMenuSeparator: boolean;
  isNested: boolean;
}

// Border character sets for different terminal capabilities
export interface BorderCharSet {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
  cross: string;
  teeTop: string;
  teeBottom: string;
  teeLeft: string;
  teeRight: string;
}

// Predefined character sets
export const BORDER_CHARS = {
  unicode: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    cross: '┼',
    teeTop: '┬',
    teeBottom: '┴',
    teeLeft: '├',
    teeRight: '┤'
  } as BorderCharSet,
  
  ascii: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
    cross: '+',
    teeTop: '+',
    teeBottom: '+',
    teeLeft: '+',
    teeRight: '+'
  } as BorderCharSet
};

/**
 * Terminal Capability Detection System
 * Detects terminal features and provides fallback options
 */
export class TerminalCapabilityDetector {
  private capabilities: TerminalCapabilities | null = null;
  private readonly formatter: TerminalFormatter;

  constructor(formatter: TerminalFormatter = createFormatter()) {
    this.formatter = formatter;
  }

  detectCapabilities(): TerminalCapabilities {
    if (this.capabilities) {
      return this.capabilities;
    }

    const baseCapabilities = this.formatter.getCapabilities();
    const supportsUnicode = this.detectUnicodeSupport(baseCapabilities);
    const supportsBoxDrawing = supportsUnicode && this.detectBoxDrawingSupport(baseCapabilities);
    const supportsColor = baseCapabilities.supportsColor;
    const width = baseCapabilities.width ?? process.stdout.columns ?? 80;
    const height = baseCapabilities.height ?? process.stdout.rows ?? 24;

    this.capabilities = {
      supportsUnicode,
      supportsBoxDrawing,
      supportsColor,
      width,
      height
    };

    return this.capabilities;
  }

  private detectUnicodeSupport(baseCapabilities: FormatterCapabilities): boolean {
    if (!baseCapabilities.supportsUnicode) {
      return false;
    }

    const env = process.env;

    if (env.LANG && env.LANG.includes('UTF-8')) return true;
    if (env.LC_ALL && env.LC_ALL.includes('UTF-8')) return true;
    if (env.LC_CTYPE && env.LC_CTYPE.includes('UTF-8')) return true;

    if (env.TERM) {
      const term = env.TERM.toLowerCase();
      if (term.includes('xterm') || term.includes('screen') || term.includes('tmux')) {
        return true;
      }
    }

    if (baseCapabilities.platform === 'windows') {
      return Boolean(process.env.WT_SESSION || process.env.TERM_PROGRAM === 'vscode');
    }

    return true;
  }

  private detectBoxDrawingSupport(baseCapabilities: FormatterCapabilities): boolean {
    if (!this.detectUnicodeSupport(baseCapabilities)) {
      return false;
    }

    const term = process.env.TERM?.toLowerCase() || '';
    if (term.includes('cmd') || term.includes('powershell')) {
      return false;
    }

    return true;
  }

  forceCapabilities(capabilities: Partial<TerminalCapabilities>): void {
    this.capabilities = {
      ...this.detectCapabilities(),
      ...capabilities
    };
  }

  reset(): void {
    this.capabilities = null;
  }
}

/**
 * Content Width Analysis and Calculation
 * Analyzes content to determine optimal window widths
 */
export class ContentAnalyzer {
  private stringWidth: (str: string) => number;

  constructor() {
    // Use string-width if available, fallback to simple length
    try {
      this.stringWidth = require('string-width');
    } catch {
      this.stringWidth = (str: string) => this.stripAnsi(str).length;
    }
  }

  analyzeContent(content: WindowContent): {
    maxWidth: number;
    titleWidth: number;
    contentWidth: number;
    itemCount: number;
  } {
    let maxWidth = 0;
    let itemCount = 0;
    
    // Measure title
    const titleWidth = content.title ? this.stringWidth(content.title) : 0;
    maxWidth = Math.max(maxWidth, titleWidth);
    
    // Measure subtitle
    if (content.subtitle) {
      maxWidth = Math.max(maxWidth, this.stringWidth(content.subtitle));
    }
    
    // Measure sections
    for (const section of content.sections) {
      // Measure section heading
      if (section.heading) {
        maxWidth = Math.max(maxWidth, this.stringWidth(section.heading));
      }
      
      // Measure items
      for (const item of section.items) {
        itemCount++;
        
        // Build full item text as it would appear
        const prefix = item.prefix || '  >';  // Default selector
        const itemText = `${prefix} ${item.label}`;
        const descText = item.description ? ` - ${item.description}` : '';
        const fullText = itemText + descText;
        
        maxWidth = Math.max(maxWidth, this.stringWidth(fullText));
      }
    }
    
    // Measure footer
    if (content.footer) {
      maxWidth = Math.max(maxWidth, this.stringWidth(content.footer));
    }
    
    return {
      maxWidth,
      titleWidth,
      contentWidth: maxWidth,
      itemCount
    };
  }

  calculateOptimalWidth(
    content: WindowContent, 
    config: WindowLayoutConfig,
    terminalWidth: number
  ): number {
    const analysis = this.analyzeContent(content);
    
    // Add padding for borders and internal spacing
    const borderWidth = 2; // Left and right borders
    const paddingWidth = config.padding * 2; // Left and right padding
    const totalPadding = borderWidth + paddingWidth;
    
    // Calculate content width with some breathing room
    let optimalWidth = analysis.maxWidth + totalPadding;
    
    // Add 10% breathing room for visual appeal
    optimalWidth = Math.ceil(optimalWidth * 1.1);
    
    // Apply constraints
    optimalWidth = Math.max(config.minWidth, optimalWidth);
    optimalWidth = Math.min(config.maxWidth, optimalWidth);
    optimalWidth = Math.min(terminalWidth - 2, optimalWidth); // Leave margin
    
    return optimalWidth;
  }

  private stripAnsi(text: string): string {
    return text.replace(/\u001b\[[0-9;]*m/g, '');
  }
}

/**
 * Window Layout Manager
 * Handles window sizing, padding, and border calculations
 */
export class WindowLayout {
  private capabilityDetector: TerminalCapabilityDetector;
  private contentAnalyzer: ContentAnalyzer;

  constructor(capabilityDetector: TerminalCapabilityDetector = new TerminalCapabilityDetector()) {
    this.capabilityDetector = capabilityDetector;
    this.contentAnalyzer = new ContentAnalyzer();
  }

  calculateLayout(
    content: WindowContent, 
    config: WindowLayoutConfig
  ): CalculatedLayout {
    const capabilities = this.capabilityDetector.detectCapabilities();
    
    // Use content as-is
    const cleanContent = content;
    
    // Determine optimal width
    const optimalWidth = this.contentAnalyzer.calculateOptimalWidth(
      cleanContent,
      config,
      capabilities.width
    );
    
    // Select appropriate border characters
    const borderChars = this.selectBorderChars(capabilities, config);
    
    // Calculate content width (inside borders)
    const contentWidth = optimalWidth - 2; // Subtract border width
    
    // Create padding string
    const padding = ' '.repeat(config.padding);
    
    // Determine if degradation is needed
    const needsDegradation = !capabilities.supportsBoxDrawing || 
                           !capabilities.supportsUnicode ||
                           optimalWidth > capabilities.width;
    
    return {
      totalWidth: optimalWidth,
      contentWidth,
      borderChars,
      padding,
      needsDegradation,
      supportsColors: capabilities.supportsColor && config.enableColors,
      titleCentered: true,
      hasMenuSeparator: !!(content.navigationItems && content.navigationItems.length > 0),
      isNested: content.isNestedWindow || false
    };
  }


  private selectBorderChars(
    capabilities: TerminalCapabilities, 
    config: WindowLayoutConfig
  ): BorderCharSet {
    if (config.borderStyle === 'ascii' || !capabilities.supportsBoxDrawing) {
      return BORDER_CHARS.ascii;
    }
    return BORDER_CHARS.unicode;
  }

  forceCapabilities(capabilities: Partial<TerminalCapabilities>): void {
    this.capabilityDetector.forceCapabilities(capabilities);
  }
}

/**
 * Border Rendering System
 * Creates structured window borders with proper nesting
 */
export interface BorderRendererDependencies {
  formatter?: TerminalFormatter;
  layout?: WindowLayout;
  capabilityDetector?: TerminalCapabilityDetector;
}

export class BorderRenderer {
  private layout: WindowLayout;
  private readonly formatter: TerminalFormatter;
  private readonly theme: TerminalTheme;

  constructor(dependencies: BorderRendererDependencies = {}) {
    this.formatter = dependencies.formatter ?? createFormatter();
    this.theme = this.formatter.getTheme();
    const detector = dependencies.capabilityDetector ?? new TerminalCapabilityDetector(this.formatter);
    this.layout = dependencies.layout ?? new WindowLayout(detector);
  }

  private formatMenuItem(text: string, isSelected: boolean): string {
    return this.formatter.interactive.selection(text, isSelected);
  }

  private formatNavigationItem(text: string, enabled?: boolean): string {
    return enabled === false
      ? this.formatter.text.muted(text)
      : this.formatter.text.plain(text);
  }

  private formatTitle(text: string): string {
    return this.formatter.formatWithSpec(text, this.theme.ui.header[0]);
  }

  private formatHeading(text: string): string {
    const spec = this.theme.ui.header[1] ?? this.theme.ui.header[0];
    return this.formatter.formatWithSpec(text, spec);
  }

  private clampDescription(value: string, maxWidth: number): string {
    if (!value || maxWidth <= 0) {
      return '';
    }

    const ellipsis = '…';
    const ellipsisWidth = StringWidthUtils.getDisplayWidth(ellipsis);
    const valueWidth = StringWidthUtils.getDisplayWidth(value);
    if (valueWidth <= maxWidth) {
      return value;
    }

    if (ellipsisWidth > maxWidth) {
      return '';
    }

    let width = 0;
    let output = '';

    for (const char of value) {
      const charWidth = StringWidthUtils.getDisplayWidth(char);
      if (width + charWidth + ellipsisWidth > maxWidth) {
        break;
      }

      output += char;
      width += charWidth;
    }

    if (!output) {
      return ellipsis;
    }

    return `${output}${ellipsis}`;
  }

  private normalizeWidth(width: number): number {
    return Math.max(1, Math.floor(width));
  }

  private formatWithinWidth(
    text: string,
    width: number,
    alignment: 'left' | 'right' | 'center' = 'left',
    ellipsis = '...'
  ): string {
    const targetWidth = this.normalizeWidth(width);
    return StringUtils.chain(text, { mode: 'terminal' })
      .truncate(targetWidth, ellipsis)
      .pad(targetWidth, alignment)
      .value();
  }

  renderWindow(
    content: WindowContent,
    config: WindowLayoutConfig = {
      minWidth: 40,
      maxWidth: 100,
      padding: 3,
      borderStyle: 'unicode',
      enableColors: true
    }
  ): string {
    const layoutResult = this.layout.calculateLayout(content, config);
    
    // Build the window
    const lines: string[] = [];
    
    // Top border
    lines.push(this.createTopBorder(layoutResult));
    
    // Title section - centered in title bar
    if (content.title) {
      lines.push(this.createCenteredTitleLine(content.title, layoutResult));
      
      // Add nested window title bar if needed
      if (content.isNestedWindow) {
        lines.push(this.createNestedWindowStart(layoutResult));
        if (content.parentTitle) {
          lines.push(this.createNestedTitleLine(content.parentTitle, layoutResult));
        }
        lines.push(this.createNestedSeparatorLine(layoutResult));
      } else {
        lines.push(this.createSeparatorLine(layoutResult));
      }
    }
    
    // Subtitle/Description
    if (content.subtitle) {
      lines.push(this.createContentLineWithPadding(content.subtitle, layoutResult, content.isNestedWindow));
      lines.push(this.createEmptyLineWithPadding(layoutResult, content.isNestedWindow));
    }
    
    // Content sections
    for (const section of content.sections) {
      if (section.heading) {
        lines.push(this.createContentLineWithPadding(section.heading, layoutResult, content.isNestedWindow, true));
      }
      
      for (let i = 0; i < section.items.length; i++) {
        const item = section.items[i];
        let itemText: string;
        
        if (item.isSelector) {
          // Use selector character › for selected item
          itemText = `› ${item.label}`;
        } else {
          // Regular item with space for selector
          itemText = `  ${item.label}`;
        }
        const description = item.description ? ` - ${item.description}` : '';
        const nestedOffset = content.isNestedWindow ? 1 : 0;
        const availableWidth = layoutResult.contentWidth - (layoutResult.padding.length * 2) - nestedOffset;

        let fullText = itemText;
        if (description) {
          const baseWidth = StringWidthUtils.getDisplayWidth(itemText);
          const remainingWidth = availableWidth - baseWidth;
          if (remainingWidth > 0) {
            fullText += this.clampDescription(description, remainingWidth);
          }
        }

        const finalText = this.formatMenuItem(fullText, Boolean(item.selected));
        lines.push(this.createContentLineWithPadding(finalText, layoutResult, content.isNestedWindow));
      }
      
      // Add spacing between sections
      if (content.sections.indexOf(section) < content.sections.length - 1) {
        lines.push(this.createEmptyLineWithPadding(layoutResult, content.isNestedWindow));
      }
    }
    
    // Menu separator and navigation items
    if (content.navigationItems && content.navigationItems.length > 0) {
      lines.push(this.createEmptyLineWithPadding(layoutResult, content.isNestedWindow));
      lines.push(this.createMenuSeparatorLine(layoutResult, content.isNestedWindow));
      
      for (const navItem of content.navigationItems) {
        const navText = `  ${navItem.label}`;
        const finalNavText = this.formatNavigationItem(navText, navItem.enabled);
        lines.push(this.createContentLineWithPadding(finalNavText, layoutResult, content.isNestedWindow));
      }
    }
    
    // Footer section
    if (content.footer) {
      lines.push(this.createSeparatorLineWithPadding(layoutResult, content.isNestedWindow));
      lines.push(this.createContentLineWithPadding(content.footer, layoutResult, content.isNestedWindow));
    }
    
    // Bottom border
    if (content.isNestedWindow) {
      lines.push(this.createNestedBottomBorder(layoutResult));
    } else {
      lines.push(this.createBottomBorder(layoutResult));
    }
    
    return lines.join('\n');
  }

  private createTopBorder(layout: CalculatedLayout): string {
    const { borderChars, totalWidth } = layout;
    const innerWidth = totalWidth - 2;
    return borderChars.topLeft + 
           borderChars.horizontal.repeat(innerWidth) + 
           borderChars.topRight;
  }

  private createBottomBorder(layout: CalculatedLayout): string {
    const { borderChars, totalWidth } = layout;
    const innerWidth = totalWidth - 2;
    return borderChars.bottomLeft + 
           borderChars.horizontal.repeat(innerWidth) + 
           borderChars.bottomRight;
  }

  private createSeparatorLine(layout: CalculatedLayout): string {
    const { borderChars, totalWidth } = layout;
    const innerWidth = totalWidth - 2;
    return borderChars.teeLeft + 
           borderChars.horizontal.repeat(innerWidth) + 
           borderChars.teeRight;
  }

  private createContentLine(
    text: string, 
    layout: CalculatedLayout, 
    emphasized: boolean = false
  ): string {
    const { borderChars, contentWidth, padding } = layout;

    let processedText = text;
    if (emphasized) {
      processedText = this.formatHeading(text);
    }

    const availableWidth = contentWidth - (padding.length * 2);
    const formatted = this.formatWithinWidth(processedText, availableWidth, 'left', '...');

    return borderChars.vertical + padding + formatted + padding + borderChars.vertical;
  }

  /**
   * Create centered title line for window title bar
   */
  private createCenteredTitleLine(text: string, layout: CalculatedLayout): string {
    const { borderChars, contentWidth } = layout;
    const processedText = this.formatTitle(text);
    const centeredText = this.formatWithinWidth(processedText, contentWidth, 'center', '...');

    return borderChars.vertical + centeredText + borderChars.vertical;
  }

  /**
   * Create content line with padding awareness for nested windows
   */
  private createContentLineWithPadding(
    text: string, 
    layout: CalculatedLayout, 
    isNested: boolean = false,
    emphasized: boolean = false
  ): string {
    const { borderChars, contentWidth, padding } = layout;
    
    // Apply emphasis if needed
    let processedText = text;
    if (emphasized) {
      processedText = this.formatHeading(text);
    }
    
    // Calculate available width accounting for nesting
    const nestedOffset = isNested ? 1 : 0;
    const availableWidth = contentWidth - (padding.length * 2) - nestedOffset;

    const formatted = this.formatWithinWidth(processedText, availableWidth, 'left', '...');

    if (isNested) {
      return borderChars.vertical + ' ' + borderChars.vertical + padding + formatted + padding + borderChars.vertical;
    } else {
      return borderChars.vertical + padding + formatted + padding + borderChars.vertical;
    }
  }

  /**
   * Create empty line with padding awareness for nested windows
   */
  private createEmptyLineWithPadding(layout: CalculatedLayout, isNested: boolean = false): string {
    const { borderChars, contentWidth, padding } = layout;
    const nestedOffset = isNested ? 1 : 0;
    const emptyContent = ' '.repeat(contentWidth - (padding.length * 2) - nestedOffset);
    
    if (isNested) {
      return borderChars.vertical + ' ' + borderChars.vertical + padding + emptyContent + padding + borderChars.vertical;
    } else {
      return borderChars.vertical + padding + emptyContent + padding + borderChars.vertical;
    }
  }

  /**
   * Create menu separator line (different from regular separator)
   */
  private createMenuSeparatorLine(layout: CalculatedLayout, isNested: boolean = false): string {
    const { borderChars, contentWidth, padding } = layout;
    const nestedOffset = isNested ? 1 : 0;
    const separatorWidth = contentWidth - (padding.length * 2) - nestedOffset;
    const separatorContent = layout.borderChars.horizontal.repeat(separatorWidth);
    
    if (isNested) {
      return borderChars.vertical + ' ' + borderChars.vertical + padding + separatorContent + padding + borderChars.vertical;
    } else {
      return borderChars.vertical + padding + separatorContent + padding + borderChars.vertical;
    }
  }

  /**
   * Create nested window start border
   */
  private createNestedWindowStart(layout: CalculatedLayout): string {
    const { borderChars, totalWidth } = layout;
    const innerWidth = totalWidth - 3; // Account for nesting
    return borderChars.vertical + borderChars.topLeft + 
           borderChars.horizontal.repeat(innerWidth) + 
           borderChars.topRight;
  }

  /**
   * Create nested title line
   */
  private createNestedTitleLine(text: string, layout: CalculatedLayout): string {
    const { borderChars, contentWidth } = layout;
    const processedText = this.formatHeading(text);
    
    const nestedContentWidth = contentWidth - 1;
    const textWidth = this.getDisplayWidth(processedText);
    const leftPadding = Math.max(0, Math.floor((nestedContentWidth - textWidth) / 2));
    const rightPadding = Math.max(0, nestedContentWidth - textWidth - leftPadding);
    
    const centeredText = ' '.repeat(leftPadding) + processedText + ' '.repeat(rightPadding);
    
    return borderChars.vertical + ' ' + borderChars.vertical + centeredText + borderChars.vertical;
  }

  /**
   * Create nested separator line
   */
  private createNestedSeparatorLine(layout: CalculatedLayout): string {
    const { borderChars, totalWidth } = layout;
    const innerWidth = totalWidth - 3;
    return borderChars.vertical + ' ' + borderChars.teeLeft + 
           borderChars.horizontal.repeat(innerWidth) + 
           borderChars.teeRight;
  }

  /**
   * Create separator line with padding awareness
   */
  private createSeparatorLineWithPadding(layout: CalculatedLayout, isNested: boolean = false): string {
    if (isNested) {
      return this.createNestedSeparatorLine(layout);
    } else {
      return this.createSeparatorLine(layout);
    }
  }

  /**
   * Create nested window bottom border
   */
  private createNestedBottomBorder(layout: CalculatedLayout): string {
    const { borderChars, totalWidth } = layout;
    const innerWidth = totalWidth - 3;
    const mainBottom = borderChars.bottomLeft + 
                      borderChars.horizontal.repeat(totalWidth - 2) + 
                      borderChars.bottomRight;
    const nestedBottom = borderChars.vertical + ' ' + borderChars.bottomLeft + 
                        borderChars.horizontal.repeat(innerWidth) + 
                        borderChars.bottomRight;
    return nestedBottom + '\n' + mainBottom;
  }

  private createEmptyLine(layout: CalculatedLayout): string {
    const { borderChars, contentWidth, padding } = layout;
    const emptyContent = ' '.repeat(contentWidth - (padding.length * 2));
    return borderChars.vertical + padding + emptyContent + padding + borderChars.vertical;
  }

  private getDisplayWidth(text: string): number {
    return StringWidthUtils.getDisplayWidth(text);
  }

  forceCapabilities(capabilities: Partial<TerminalCapabilities>): void {
    this.layout.forceCapabilities(capabilities);
  }
}

/**
 * Content Layout System - Main Orchestrator
 * Coordinates all layout components for adaptive terminal rendering
 */
export interface ContentLayoutSystemDependencies {
  formatter?: TerminalFormatter;
  borderRenderer?: BorderRenderer;
  windowLayout?: WindowLayout;
  capabilityDetector?: TerminalCapabilityDetector;
}

export class ContentLayoutSystem extends EventEmitter {
  private borderRenderer: BorderRenderer;
  private windowLayout: WindowLayout;
  private capabilityDetector: TerminalCapabilityDetector;

  constructor(dependencies: ContentLayoutSystemDependencies = {}) {
    super();
    const formatter = dependencies.formatter ?? createFormatter();
    this.capabilityDetector = dependencies.capabilityDetector ?? new TerminalCapabilityDetector(formatter);
    this.windowLayout = dependencies.windowLayout ?? new WindowLayout(this.capabilityDetector);
    this.borderRenderer = dependencies.borderRenderer ?? new BorderRenderer({
      formatter,
      capabilityDetector: this.capabilityDetector,
      layout: this.windowLayout,
    });
  }

  renderContent(
    content: WindowContent,
    options: Partial<WindowLayoutConfig> = {}
  ): {
    output: string;
    layout: CalculatedLayout;
    capabilities: TerminalCapabilities;
  } {
    const capabilities = this.capabilityDetector.detectCapabilities();
    
    const config: WindowLayoutConfig = {
      minWidth: 40,
      maxWidth: Math.min(100, capabilities.width - 2),
      padding: 3,
      borderStyle: capabilities.supportsBoxDrawing ? 'unicode' : 'ascii',
      enableColors: capabilities.supportsColor,
      ...options
    };

    const layout = this.windowLayout.calculateLayout(content, config);
    const output = this.borderRenderer.renderWindow(content, config);

    this.emit('contentRendered', {
      content,
      layout,
      capabilities,
      config
    });

    return {
      output,
      layout,
      capabilities
    };
  }

  // TODO: [TASK-ID-001] Pattern: content-layout-system | Complexity: 7 | Dependencies: terminal-ui-components,chalk
  // Context: Implemented adaptive content rendering and layout management for CLI interfaces
  // Validation-Required: terminal-compatibility, width-calculation, emoji-removal, border-rendering
  // Pattern-Info: { approach: "progressive-enhancement", alternatives: "simple-text-only", trade-offs: "complexity-vs-visual-appeal" }

  testTerminalCompatibility(): {
    capabilities: TerminalCapabilities;
    compatibilityLevel: 'full' | 'partial' | 'basic';
    recommendations: string[];
  } {
    const capabilities = this.capabilityDetector.detectCapabilities();
    const recommendations: string[] = [];
    
    let compatibilityLevel: 'full' | 'partial' | 'basic' = 'full';
    
    if (!capabilities.supportsUnicode) {
      compatibilityLevel = 'partial';
      recommendations.push('Unicode support unavailable - using ASCII fallback');
    }
    
    if (!capabilities.supportsBoxDrawing) {
      compatibilityLevel = 'partial';
      recommendations.push('Box drawing characters unavailable - using ASCII borders');
    }
    
    if (!capabilities.supportsColor) {
      recommendations.push('Color support unavailable - using monochrome output');
    }
    
    if (capabilities.width < 60) {
      compatibilityLevel = 'basic';
      recommendations.push('Narrow terminal - content may be truncated');
    }
    
    if (!capabilities.supportsUnicode && !capabilities.supportsBoxDrawing) {
      compatibilityLevel = 'basic';
    }
    
    return {
      capabilities,
      compatibilityLevel,
      recommendations
    };
  }

  forceTerminalCapabilities(capabilities: Partial<TerminalCapabilities>): void {
    this.capabilityDetector.forceCapabilities(capabilities);
    this.windowLayout.forceCapabilities(capabilities);
    this.borderRenderer.forceCapabilities(capabilities);
  }

  cleanTextOfEmojis(text: string): string {
    return text; // No longer processing emojis
  }

  getEmojiMappings(): Map<string, string> {
    return new Map(); // Return empty map
  }
}

// Export factory function for easy instantiation
export function createContentLayoutSystem(): ContentLayoutSystem {
  return new ContentLayoutSystem();
}

// Export default instance
export const defaultContentLayoutSystem = createContentLayoutSystem();

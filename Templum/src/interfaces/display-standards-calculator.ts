/**
---
date: 2025-09-13T103229Z
name: display-standards-calculator
TASK-ID: [TASK-MCP-009]
category: CLI-Design-Consistency
status: [T]
patterns: [Algorithmic-Standardization, Width-Calculation, Padding-Standards]
components: [DisplayStandardsCalculator, Dimension-Calculations, Content-Measurement]
dependencies: [terminal-ui-components, responsive-layout]
tags: [CLI, Display-Consistency, Algorithms, Layout-Standards]
---
*/

import { DisplayUtils } from '../utils/display-utils';
import { TerminalSeparatorStyle } from '../utils/terminal-formatter';

/**
 * TODO: [TASK-ID-001] Pattern: algorithmic-display-standardization | Complexity: 7 | Dependencies: responsive-layout,content-measurement
 * Context: Core algorithmic foundation for consistent CLI display calculations including width, padding, and separator selection
 * Validation-Required: width-calculation-accuracy, padding-consistency, separator-pattern-compliance
 * Pattern-Info: { approach: "mathematical-standardization", alternatives: "hardcoded-values", trade-offs: "flexibility-vs-predictability" }
 */

/**
 * Display element types for consistent formatting
 */
export type DisplayElementType = 
  | 'table' 
  | 'list' 
  | 'status' 
  | 'separator' 
  | 'header' 
  | 'footer'
  | 'menu-item'
  | 'error-message'
  | 'info-panel';

/**
 * Separator context for appropriate separator selection
 */
export type SeparatorContext = 
  | 'major-section'
  | 'minor-section' 
  | 'emphasis-header'
  | 'table-border'
  | 'list-separator';

/**
 * Padding specification for different element types
 */
export interface PaddingSpec {
  left: number;
  right: number;
  top: number;
  bottom: number;
  inner: number; // For nested elements
}

/**
 * Content dimensions for width calculations
 */
export interface ContentDimensions {
  width: number;
  height: number;
  minWidth: number;
  maxWidth: number;
  hasVariableWidth: boolean;
}

/**
 * Display element for measurement and formatting
 */
export interface DisplayElement {
  type: DisplayElementType;
  content: string | string[];
  metadata?: {
    priority?: number;
    connected?: boolean;
    health?: string;
    category?: string;
  };
}

/**
 * Layout calculation result
 */
export interface LayoutCalculation {
  optimalWidth: number;
  paddingSpec: PaddingSpec;
  separatorChar: string;
  contentDimensions: ContentDimensions;
  recommendations: string[];
}

/**
 * Configuration for display standards
 */
export interface DisplayStandardsConfig {
  standardPadding: number; // Standard 3-character padding
  minWidth: number;
  maxWidth: number;
  tableCellPadding: number;
  listItemPadding: number;
  nestedElementPadding: number;
  separatorChars: {
    major: string;
    minor: string;
    emphasis: string;
    table: {
      horizontal: string;
      vertical: string;
      corner: string;
      junction: string;
    };
  };
}

/**
 * Core algorithmic calculator for display consistency standards
 */
export class DisplayStandardsCalculator {
  private config: DisplayStandardsConfig;
  private terminalWidth: number;

  constructor(config?: Partial<DisplayStandardsConfig>) {
    this.config = {
      standardPadding: 3, // Key requirement: 3-char padding
      minWidth: 40,
      maxWidth: 120,
      tableCellPadding: 1,
      listItemPadding: 2,
      nestedElementPadding: 1,
      separatorChars: {
        major: '━', // Heavy horizontal for major sections
        minor: '─', // Light horizontal for minor sections  
        emphasis: '═', // Double horizontal for emphasis
        table: {
          horizontal: '─',
          vertical: '│',
          corner: '┌',
          junction: '┬'
        }
      },
      ...config
    };

    this.terminalWidth = DisplayUtils.standards.terminalWidth;
  }

  /**
   * Calculate optimal width based on content with standardized padding
   * Core algorithm: minWidth = max(contentWidths) + standardPadding
   */
  calculateOptimalWidth(elements: DisplayElement[]): number {
    if (elements.length === 0) {
      return Math.max(this.config.minWidth, Math.min(this.config.maxWidth, this.getTerminalWidth()));
    }

    const samples = this.flattenElementContent(elements);
    const terminalWidth = this.getTerminalWidth();

    const responsiveWidth = DisplayUtils.responsiveWidth(samples, {
      padding: this.config.standardPadding,
      minWidth: this.config.minWidth,
      maxWidth: Math.min(this.config.maxWidth, terminalWidth)
    });

    const layout = DisplayUtils.calculate()
      .padding(this.config.standardPadding)
      .width(responsiveWidth)
      .layout();

    const maxAllowed = Math.min(this.config.maxWidth, terminalWidth);
    return Math.max(this.config.minWidth, Math.min(layout.totalWidth, maxAllowed));
  }

  /**
   * Get padding specification based on element type
   */
  calculatePadding(elementType: DisplayElementType): PaddingSpec {
    switch (elementType) {
      case 'table':
        return {
          left: this.config.standardPadding,
          right: this.config.standardPadding,
          top: 1,
          bottom: 1,
          inner: this.config.tableCellPadding
        };

      case 'list':
      case 'menu-item':
        return {
          left: this.config.listItemPadding,
          right: this.config.standardPadding,
          top: 0,
          bottom: 0,
          inner: 1
        };

      case 'header':
      case 'footer':
        return {
          left: this.config.standardPadding,
          right: this.config.standardPadding,
          top: 1,
          bottom: 1,
          inner: 0
        };

      case 'status':
      case 'info-panel':
        return {
          left: this.config.standardPadding,
          right: this.config.standardPadding,
          top: 0,
          bottom: 1,
          inner: this.config.nestedElementPadding
        };

      case 'error-message':
        return {
          left: this.config.standardPadding + 1, // Extra padding for errors
          right: this.config.standardPadding + 1,
          top: 1,
          bottom: 1,
          inner: 1
        };

      case 'separator':
      default:
        return {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          inner: 0
        };
    }
  }

  /**
   * Select appropriate separator character based on context
   */
  selectSeparator(context: SeparatorContext): string {
    const style = this.mapContextToSeparatorStyle(context);
    const rendered = DisplayUtils.separator(1, style);
    const stripped = this.stripAnsiCodes(rendered);

    if (stripped.length > 0) {
      return stripped;
    }

    switch (context) {
      case 'major-section':
        return this.config.separatorChars.major;
      case 'emphasis-header':
        return this.config.separatorChars.emphasis;
      case 'table-border':
        return this.config.separatorChars.table.horizontal;
      default:
        return this.config.separatorChars.minor;
    }
  }

  /**
   * Measure content dimensions for width calculations
   */
  measureContent(element: DisplayElement): ContentDimensions {
    let content: string[];
    
    if (typeof element.content === 'string') {
      content = [element.content];
    } else {
      content = element.content;
    }

    // Calculate actual content dimensions
    const widths = content.map(line => this.stripAnsiCodes(line).length);
    const width = Math.max(...widths, 0);
    const height = content.length;

    // Determine minimum and maximum widths based on element type
    let minWidth = this.config.minWidth;
    let maxWidth = this.config.maxWidth;
    let hasVariableWidth = true;

    switch (element.type) {
      case 'table':
        minWidth = Math.max(40, width);
        hasVariableWidth = false;
        break;
        
      case 'status':
      case 'info-panel':
        minWidth = Math.max(30, width);
        break;
        
      case 'separator':
        minWidth = width;
        maxWidth = width;
        hasVariableWidth = false;
        break;
    }

    return {
      width,
      height,
      minWidth,
      maxWidth,
      hasVariableWidth
    };
  }

  /**
   * Perform complete layout calculation for a set of elements
   */
  calculateLayout(elements: DisplayElement[], context: SeparatorContext = 'major-section'): LayoutCalculation {
    const primaryElementType = elements.length > 0 ? elements[0].type : 'info-panel';
    const paddingSpec = this.calculatePadding(primaryElementType);
    const effectivePadding = Math.max(this.config.standardPadding, paddingSpec.left, paddingSpec.right);
    const layout = DisplayUtils.calculate()
      .padding(effectivePadding)
      .width(this.calculateOptimalWidth(elements))
      .layout();

    const separatorStyle = this.mapContextToSeparatorStyle(context);
    const separatorChar = this.stripAnsiCodes(DisplayUtils.separator(1, separatorStyle)) || this.selectSeparator(context);

    const contentDimensions: ContentDimensions = {
      width: layout.contentWidth,
      height: elements.reduce((sum, el) => sum + this.measureContent(el).height, 0),
      minWidth: this.config.minWidth,
      maxWidth: Math.min(this.config.maxWidth, this.getTerminalWidth()),
      hasVariableWidth: elements.some(el => this.measureContent(el).hasVariableWidth)
    };

    const terminalWidth = this.getTerminalWidth();
    const recommendations: string[] = [];

    if (layout.totalWidth > terminalWidth * 0.9) {
      recommendations.push('Consider responsive layout for narrow terminals');
    }

    if (elements.length > 10) {
      recommendations.push('Consider pagination for large element sets');
    }

    if (contentDimensions.height > 20) {
      recommendations.push('Consider vertical scrolling for tall content');
    }

    return {
      optimalWidth: layout.totalWidth,
      paddingSpec,
      separatorChar,
      contentDimensions,
      recommendations
    };
  }

  /**
   * Create standardized separator line
   */
  createSeparatorLine(width: number, context: SeparatorContext = 'major-section'): string {
    const style = this.mapContextToSeparatorStyle(context);
    return DisplayUtils.separator(Math.max(1, width), style);
  }

  /**
   * Apply standard padding to text content
   */
  applyStandardPadding(text: string, elementType: DisplayElementType): string {
    const padding = this.calculatePadding(elementType);
    const leftPad = ' '.repeat(padding.left);
    const rightPad = ' '.repeat(padding.right);
    
    const lines = text.split('\n');
    const paddedLines = lines.map(line => `${leftPad}${line}${rightPad}`);
    
    // Add vertical padding
    const topPadding = '\n'.repeat(padding.top);
    const bottomPadding = '\n'.repeat(padding.bottom);
    
    return topPadding + paddedLines.join('\n') + bottomPadding;
  }

  /**
   * Get table border characters for standardized table formatting
   */
  getTableBorderChars(): {
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
    horizontal: string;
    vertical: string;
    junction: string;
    topJunction: string;
    bottomJunction: string;
    leftJunction: string;
    rightJunction: string;
  } {
    return {
      topLeft: '┌',
      topRight: '┐', 
      bottomLeft: '└',
      bottomRight: '┘',
      horizontal: '─',
      vertical: '│',
      junction: '┼',
      topJunction: '┬',
      bottomJunction: '┴',
      leftJunction: '├',
      rightJunction: '┤'
    };
  }

  /**
   * Update terminal width for responsive calculations
   */
  updateTerminalWidth(width: number): void {
    this.terminalWidth = width;
  }

  /**
   * Get current configuration
   */
  getConfiguration(): DisplayStandardsConfig {
    return { ...this.config };
  }

  /**
   * Strip ANSI color codes for accurate width measurement
   * @private
   */
  private stripAnsiCodes(text: string): string {
    // Remove ANSI escape sequences for accurate length calculation
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }

  private getTerminalWidth(): number {
    return this.terminalWidth || DisplayUtils.standards.terminalWidth;
  }

  private flattenElementContent(elements: DisplayElement[]): string[] {
    const samples: string[] = [];

    for (const element of elements) {
      if (typeof element.content === 'string') {
        samples.push(...element.content.split('\n'));
      } else {
        samples.push(...element.content);
      }
    }

    return samples
      .filter(line => line !== undefined && line !== null)
      .map(line => String(line));
  }

  private mapContextToSeparatorStyle(context: SeparatorContext): TerminalSeparatorStyle {
    switch (context) {
      case 'emphasis-header':
        return 'double';
      case 'minor-section':
      case 'list-separator':
        return 'dashed';
      case 'table-border':
      case 'major-section':
      default:
        return 'solid';
    }
  }
}

/**
 * Factory function for creating display standards calculator
 */
export function createDisplayStandardsCalculator(config?: Partial<DisplayStandardsConfig>): DisplayStandardsCalculator {
  return new DisplayStandardsCalculator(config);
}

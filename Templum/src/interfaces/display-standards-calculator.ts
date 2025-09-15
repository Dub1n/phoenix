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

    this.terminalWidth = process.stdout.columns || 80;
  }

  /**
   * Calculate optimal width based on content with standardized padding
   * Core algorithm: minWidth = max(contentWidths) + standardPadding
   */
  calculateOptimalWidth(elements: DisplayElement[]): number {
    if (elements.length === 0) {
      return this.config.minWidth + (this.config.standardPadding * 2);
    }

    // Measure content widths for all elements
    const contentWidths = elements.map(element => {
      const dimensions = this.measureContent(element);
      return dimensions.width;
    });

    // Find maximum content width
    const maxContentWidth = Math.max(...contentWidths);
    
    // Apply standard padding (3 chars each side = 6 total)
    const optimalWidth = maxContentWidth + (this.config.standardPadding * 2);
    
    // Ensure within terminal constraints
    const constrainedWidth = Math.min(
      Math.max(optimalWidth, this.config.minWidth),
      Math.min(this.config.maxWidth, this.terminalWidth - 4)
    );

    return constrainedWidth;
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
    switch (context) {
      case 'major-section':
        return this.config.separatorChars.major; // ━

      case 'minor-section':
        return this.config.separatorChars.minor; // ─

      case 'emphasis-header':
        return this.config.separatorChars.emphasis; // ═

      case 'table-border':
        return this.config.separatorChars.table.horizontal; // ─

      case 'list-separator':
      default:
        return this.config.separatorChars.minor; // ─
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
    const optimalWidth = this.calculateOptimalWidth(elements);
    const primaryElementType = elements.length > 0 ? elements[0].type : 'info-panel';
    const paddingSpec = this.calculatePadding(primaryElementType);
    const separatorChar = this.selectSeparator(context);
    
    // Calculate aggregate content dimensions
    const contentDimensions: ContentDimensions = {
      width: optimalWidth - (paddingSpec.left + paddingSpec.right),
      height: elements.reduce((sum, el) => sum + this.measureContent(el).height, 0),
      minWidth: this.config.minWidth,
      maxWidth: Math.min(this.config.maxWidth, this.terminalWidth - 4),
      hasVariableWidth: elements.some(el => this.measureContent(el).hasVariableWidth)
    };

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (optimalWidth > this.terminalWidth * 0.9) {
      recommendations.push('Consider responsive layout for narrow terminals');
    }
    
    if (elements.length > 10) {
      recommendations.push('Consider pagination for large element sets');
    }
    
    if (contentDimensions.height > 20) {
      recommendations.push('Consider vertical scrolling for tall content');
    }

    return {
      optimalWidth,
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
    const char = this.selectSeparator(context);
    return char.repeat(Math.max(1, width));
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
}

/**
 * Factory function for creating display standards calculator
 */
export function createDisplayStandardsCalculator(config?: Partial<DisplayStandardsConfig>): DisplayStandardsCalculator {
  return new DisplayStandardsCalculator(config);
}
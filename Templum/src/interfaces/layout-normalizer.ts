/**
---
date: 2025-09-13T103229Z
name: layout-normalizer
TASK-ID: [TASK-MCP-009]
category: CLI-Design-Consistency
status: [T]
patterns: [Layout-Normalization, Spacing-Uniformity, Alignment-Standards]
components: [LayoutNormalizer, Spacing-Calculator, Alignment-Processor]
dependencies: [display-standards-calculator, terminal-ui-components]
tags: [CLI, Layout-Normalization, Spacing, Alignment, Formatting]
---
*/

/**
 * TODO: [TASK-ID-003] Pattern: uniform-spacing-alignment | Complexity: 6 | Dependencies: display-standards-calculator,content-formatting
 * Context: Layout normalization system for consistent spacing, alignment, and formatting across all CLI display elements
 * Validation-Required: spacing-consistency, alignment-accuracy, table-formatting-correctness
 * Pattern-Info: { approach: "rule-based-normalization", alternatives: "manual-formatting", trade-offs: "consistency-vs-flexibility" }
 */

import { 
  DisplayElement, 
  PaddingSpec, 
  DisplayElementType,
  DisplayStandardsCalculator,
  ContentDimensions 
} from './display-standards-calculator';

/**
 * Alignment types for content positioning
 */
export type AlignmentType = 'left' | 'center' | 'right' | 'justify';

/**
 * Spacing configuration for different layout contexts
 */
export interface SpacingConfig {
  lineSpacing: number;
  paragraphSpacing: number;
  sectionSpacing: number;
  elementSpacing: number;
  indentSize: number;
}

/**
 * Table formatting configuration
 */
export interface TableFormattingConfig {
  borderStyle: 'ascii' | 'unicode' | 'minimal';
  cellPadding: number;
  headerSeparator: boolean;
  alternatingRows: boolean;
  maxColumnWidth: number;
  minColumnWidth: number;
  autoWidth: boolean;
}

/**
 * Normalized layout result
 */
export interface NormalizedLayout {
  formattedContent: string;
  actualWidth: number;
  actualHeight: number;
  appliedNormalizations: string[];
  metadata: {
    originalDimensions: ContentDimensions;
    targetDimensions: ContentDimensions;
    timestamp: number;
  };
}

/**
 * Table data structure for formatting
 */
export interface TableData {
  headers: string[];
  rows: Array<Record<string, any>>;
  metadata?: {
    sortColumn?: string;
    sortOrder?: 'asc' | 'desc';
    totalRows?: number;
    filteredRows?: number;
  };
}

/**
 * Layout normalization configuration
 */
export interface LayoutNormalizerConfig {
  spacing: SpacingConfig;
  tableFormatting: TableFormattingConfig;
  defaultAlignment: AlignmentType;
  enforceWidthLimits: boolean;
  preserveIndentation: boolean;
  normalizeLineEndings: boolean;
}

/**
 * Layout normalizer for uniform spacing and alignment
 */
export class LayoutNormalizer {
  private config: LayoutNormalizerConfig;
  private standardsCalculator: DisplayStandardsCalculator;

  constructor(
    standardsCalculator: DisplayStandardsCalculator,
    config?: Partial<LayoutNormalizerConfig>
  ) {
    this.standardsCalculator = standardsCalculator;
    
    this.config = {
      spacing: {
        lineSpacing: 0, // Lines within same element
        paragraphSpacing: 1, // Between paragraphs
        sectionSpacing: 2, // Between major sections
        elementSpacing: 1, // Between display elements
        indentSize: 2 // Standard indentation
      },
      tableFormatting: {
        borderStyle: 'unicode',
        cellPadding: 1,
        headerSeparator: true,
        alternatingRows: false,
        maxColumnWidth: 40,
        minColumnWidth: 8,
        autoWidth: true
      },
      defaultAlignment: 'left',
      enforceWidthLimits: true,
      preserveIndentation: true,
      normalizeLineEndings: true,
      ...config
    };
  }

  /**
   * Normalize spacing across multiple display elements
   */
  normalizeSpacing(elements: DisplayElement[]): NormalizedLayout {
    if (elements.length === 0) {
      return this.createEmptyLayout();
    }

    const appliedNormalizations: string[] = [];
    let formattedContent = '';
    let actualWidth = 0;
    let actualHeight = 0;

    // Process each element with appropriate spacing
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const isLast = i === elements.length - 1;

      // Apply element-specific formatting
      const elementLayout = this.normalizeElement(element);
      formattedContent += elementLayout.formattedContent;
      
      // Update dimensions
      actualWidth = Math.max(actualWidth, elementLayout.actualWidth);
      actualHeight += elementLayout.actualHeight;
      
      // Add spacing between elements (except after last)
      if (!isLast) {
        const spacingLines = this.getElementSpacing(element, elements[i + 1]);
        const spacing = '\n'.repeat(spacingLines);
        formattedContent += spacing;
        actualHeight += spacingLines;
        
        if (spacingLines > 0) {
          appliedNormalizations.push(`element-spacing-${spacingLines}`);
        }
      }

      appliedNormalizations.push(...elementLayout.appliedNormalizations);
    }

    return {
      formattedContent,
      actualWidth,
      actualHeight,
      appliedNormalizations,
      metadata: {
        originalDimensions: { width: 0, height: 0, minWidth: 0, maxWidth: 0, hasVariableWidth: false },
        targetDimensions: { width: actualWidth, height: actualHeight, minWidth: 0, maxWidth: 0, hasVariableWidth: false },
        timestamp: Date.now()
      }
    };
  }

  /**
   * Align content according to specified alignment type
   */
  alignContent(content: string[], alignment: AlignmentType, targetWidth: number): string[] {
    if (targetWidth <= 0) return content;

    return content.map(line => {
      const trimmedLine = line.trim();
      const lineWidth = this.stripAnsiCodes(trimmedLine).length;
      
      if (lineWidth >= targetWidth) {
        return trimmedLine; // Line is already at or beyond target width
      }

      const padding = targetWidth - lineWidth;
      
      switch (alignment) {
        case 'center':
          const leftPad = Math.floor(padding / 2);
          const rightPad = padding - leftPad;
          return ' '.repeat(leftPad) + trimmedLine + ' '.repeat(rightPad);
          
        case 'right':
          return ' '.repeat(padding) + trimmedLine;
          
        case 'justify':
          if (trimmedLine.includes(' ')) {
            return this.justifyLine(trimmedLine, targetWidth);
          } else {
            return trimmedLine; // Cannot justify single word
          }
          
        case 'left':
        default:
          return trimmedLine + ' '.repeat(padding);
      }
    });
  }

  /**
   * Apply standard padding to display element
   */
  standardizePadding(element: DisplayElement): NormalizedLayout {
    const paddingSpec = this.standardsCalculator.calculatePadding(element.type);
    const appliedNormalizations: string[] = [];

    let content: string[];
    if (typeof element.content === 'string') {
      content = element.content.split('\n');
    } else {
      content = element.content;
    }

    // Apply horizontal padding
    const leftPadding = ' '.repeat(paddingSpec.left);
    const rightPadding = ' '.repeat(paddingSpec.right);
    
    const paddedContent = content.map(line => {
      return leftPadding + line + rightPadding;
    });

    // Apply vertical padding
    const topPadding = Array(paddingSpec.top).fill('');
    const bottomPadding = Array(paddingSpec.bottom).fill('');
    
    const finalContent = [...topPadding, ...paddedContent, ...bottomPadding];
    
    appliedNormalizations.push(`padding-${paddingSpec.left}-${paddingSpec.right}-${paddingSpec.top}-${paddingSpec.bottom}`);

    const formattedContent = finalContent.join('\n');
    const actualWidth = Math.max(...finalContent.map(line => this.stripAnsiCodes(line).length));
    const actualHeight = finalContent.length;

    return {
      formattedContent,
      actualWidth,
      actualHeight,
      appliedNormalizations,
      metadata: {
        originalDimensions: this.standardsCalculator.measureContent(element),
        targetDimensions: { width: actualWidth, height: actualHeight, minWidth: 0, maxWidth: 0, hasVariableWidth: false },
        timestamp: Date.now()
      }
    };
  }

  /**
   * Format table with standardized borders and alignment
   */
  formatTableBorders(tableData: TableData, targetWidth: number): NormalizedLayout {
    const appliedNormalizations: string[] = [];
    const { headers, rows } = tableData;

    if (headers.length === 0) {
      return this.createEmptyLayout();
    }

    // Calculate column widths
    const columnWidths = this.calculateColumnWidths(headers, rows, targetWidth);
    appliedNormalizations.push('calculated-column-widths');

    // Get border characters
    const borders = this.getBorderChars(this.config.tableFormatting.borderStyle);
    
    let formattedContent = '';
    let actualHeight = 0;

    // Top border
    formattedContent += this.createTableBorderLine(columnWidths, borders, 'top') + '\n';
    actualHeight++;

    // Header row
    const headerRow = this.formatTableRow(headers.map((h, i) => ({ [headers[i]]: h })[headers[i]]), headers, columnWidths, borders);
    formattedContent += headerRow + '\n';
    actualHeight++;

    // Header separator
    if (this.config.tableFormatting.headerSeparator) {
      formattedContent += this.createTableBorderLine(columnWidths, borders, 'separator') + '\n';
      actualHeight++;
      appliedNormalizations.push('header-separator');
    }

    // Data rows
    rows.forEach((row, index) => {
      const formattedRow = this.formatTableRow(row, headers, columnWidths, borders);
      formattedContent += formattedRow + '\n';
      actualHeight++;

      // Alternating row styling (metadata only - actual styling handled by theme)
      if (this.config.tableFormatting.alternatingRows && index % 2 === 1) {
        appliedNormalizations.push(`alternate-row-${index}`);
      }
    });

    // Bottom border
    formattedContent += this.createTableBorderLine(columnWidths, borders, 'bottom') + '\n';
    actualHeight++;

    const actualWidth = this.getTableActualWidth(columnWidths, borders);

    return {
      formattedContent: formattedContent.trim(),
      actualWidth,
      actualHeight,
      appliedNormalizations,
      metadata: {
        originalDimensions: { width: targetWidth, height: rows.length + 3, minWidth: 0, maxWidth: 0, hasVariableWidth: false },
        targetDimensions: { width: actualWidth, height: actualHeight, minWidth: 0, maxWidth: 0, hasVariableWidth: false },
        timestamp: Date.now()
      }
    };
  }

  /**
   * Create standardized separator line
   */
  createSeparatorLine(width: number, char: string): string {
    if (width <= 0) return '';
    return char.repeat(width);
  }

  /**
   * Normalize line endings across content
   */
  normalizeLineEndings(content: string): string {
    if (!this.config.normalizeLineEndings) return content;
    
    // Convert all line endings to \n
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * Preserve or normalize indentation
   */
  normalizeIndentation(content: string[]): string[] {
    if (!this.config.preserveIndentation) {
      return content.map(line => line.trimStart());
    }

    // Normalize indentation to use standard indent size
    return content.map(line => {
      const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
      const indentLevel = Math.floor(leadingSpaces / this.config.spacing.indentSize);
      const normalizedIndent = ' '.repeat(indentLevel * this.config.spacing.indentSize);
      
      return normalizedIndent + line.trimStart();
    });
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<LayoutNormalizerConfig>): void {
    this.config = { 
      ...this.config, 
      ...config,
      spacing: { ...this.config.spacing, ...config.spacing },
      tableFormatting: { ...this.config.tableFormatting, ...config.tableFormatting }
    };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): LayoutNormalizerConfig {
    return { 
      ...this.config,
      spacing: { ...this.config.spacing },
      tableFormatting: { ...this.config.tableFormatting }
    };
  }

  /**
   * Normalize a single display element
   * @private
   */
  private normalizeElement(element: DisplayElement): NormalizedLayout {
    switch (element.type) {
      case 'table':
        // Extract table data if available
        if (element.metadata && 'tableData' in element.metadata) {
          const tableData = element.metadata.tableData as TableData;
          const targetWidth = this.standardsCalculator.calculateOptimalWidth([element]);
          return this.formatTableBorders(tableData, targetWidth);
        }
        break;
        
      case 'separator':
        const separatorWidth = this.standardsCalculator.calculateOptimalWidth([element]);
        const separatorChar = this.standardsCalculator.selectSeparator('major-section');
        const formattedContent = this.createSeparatorLine(separatorWidth, separatorChar);
        return {
          formattedContent,
          actualWidth: separatorWidth,
          actualHeight: 1,
          appliedNormalizations: ['separator-line'],
          metadata: {
            originalDimensions: this.standardsCalculator.measureContent(element),
            targetDimensions: { width: separatorWidth, height: 1, minWidth: 0, maxWidth: 0, hasVariableWidth: false },
            timestamp: Date.now()
          }
        };
        
      default:
        return this.standardizePadding(element);
    }

    // Fallback to standard padding
    return this.standardizePadding(element);
  }

  /**
   * Get spacing between two elements
   * @private
   */
  private getElementSpacing(current: DisplayElement, next: DisplayElement): number {
    // Different spacing rules based on element types
    if (current.type === 'separator' || next.type === 'separator') {
      return this.config.spacing.lineSpacing; // Minimal spacing around separators
    }
    
    if (current.type === 'header' || next.type === 'header') {
      return this.config.spacing.sectionSpacing; // More spacing around headers
    }
    
    return this.config.spacing.elementSpacing; // Standard element spacing
  }

  /**
   * Calculate optimal column widths for table
   * @private
   */
  private calculateColumnWidths(headers: string[], rows: Array<Record<string, any>>, targetWidth: number): number[] {
    const columnCount = headers.length;
    if (columnCount === 0) return [];

    // Calculate content widths
    const contentWidths = headers.map(header => {
      const headerWidth = this.stripAnsiCodes(header).length;
      const maxContentWidth = Math.max(
        ...rows.map(row => this.stripAnsiCodes(String(row[header] || '')).length)
      );
      return Math.max(headerWidth, maxContentWidth);
    });

    // Apply min/max constraints
    const constrainedWidths = contentWidths.map(width => 
      Math.max(
        this.config.tableFormatting.minColumnWidth,
        Math.min(width, this.config.tableFormatting.maxColumnWidth)
      )
    );

    // Auto-adjust if enabled and total width exceeds target
    if (this.config.tableFormatting.autoWidth) {
      const totalContentWidth = constrainedWidths.reduce((sum, w) => sum + w, 0);
      const borderWidth = (columnCount + 1) * 1 + (columnCount * this.config.tableFormatting.cellPadding * 2);
      const totalTableWidth = totalContentWidth + borderWidth;

      if (totalTableWidth > targetWidth) {
        // Proportionally reduce column widths
        const availableWidth = targetWidth - borderWidth;
        const scaleFactor = availableWidth / totalContentWidth;
        
        return constrainedWidths.map(width => Math.max(
          this.config.tableFormatting.minColumnWidth,
          Math.floor(width * scaleFactor)
        ));
      }
    }

    return constrainedWidths;
  }

  /**
   * Format a single table row
   * @private
   */
  private formatTableRow(row: Record<string, any>, headers: string[], columnWidths: number[], borders: any): string {
    const cellPadding = ' '.repeat(this.config.tableFormatting.cellPadding);
    
    const cells = headers.map((header, index) => {
      const content = String(row[header] || '');
      const width = columnWidths[index];
      
      // Truncate if necessary
      let cellContent = content.length > width ? content.substring(0, width - 1) + '…' : content;
      
      // Pad to column width
      cellContent = cellContent.padEnd(width);
      
      return cellPadding + cellContent + cellPadding;
    });

    return borders.vertical + cells.join(borders.vertical) + borders.vertical;
  }

  /**
   * Create table border line
   * @private
   */
  private createTableBorderLine(columnWidths: number[], borders: any, type: 'top' | 'bottom' | 'separator'): string {
    const cellPadding = this.config.tableFormatting.cellPadding * 2;
    
    const segments = columnWidths.map(width => 
      borders.horizontal.repeat(width + cellPadding)
    );

    let leftChar, rightChar, junctionChar;
    
    switch (type) {
      case 'top':
        leftChar = borders.topLeft;
        rightChar = borders.topRight;
        junctionChar = borders.topJunction;
        break;
      case 'bottom':
        leftChar = borders.bottomLeft;
        rightChar = borders.bottomRight;
        junctionChar = borders.bottomJunction;
        break;
      case 'separator':
        leftChar = borders.leftJunction;
        rightChar = borders.rightJunction;
        junctionChar = borders.junction;
        break;
    }

    return leftChar + segments.join(junctionChar) + rightChar;
  }

  /**
   * Get border characters for table style
   * @private
   */
  private getBorderChars(style: 'ascii' | 'unicode' | 'minimal') {
    switch (style) {
      case 'ascii':
        return {
          horizontal: '-',
          vertical: '|',
          topLeft: '+', topRight: '+', bottomLeft: '+', bottomRight: '+',
          topJunction: '+', bottomJunction: '+', leftJunction: '+', rightJunction: '+',
          junction: '+'
        };
      
      case 'minimal':
        return {
          horizontal: ' ',
          vertical: ' ',
          topLeft: ' ', topRight: ' ', bottomLeft: ' ', bottomRight: ' ',
          topJunction: ' ', bottomJunction: ' ', leftJunction: ' ', rightJunction: ' ',
          junction: ' '
        };
      
      case 'unicode':
      default:
        return this.standardsCalculator.getTableBorderChars();
    }
  }

  /**
   * Calculate actual table width including borders
   * @private
   */
  private getTableActualWidth(columnWidths: number[], borders: any): number {
    const contentWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const paddingWidth = columnWidths.length * (this.config.tableFormatting.cellPadding * 2);
    const borderWidth = columnWidths.length + 1; // Vertical borders
    
    return contentWidth + paddingWidth + borderWidth;
  }

  /**
   * Justify a line of text to target width
   * @private
   */
  private justifyLine(line: string, targetWidth: number): string {
    const words = line.trim().split(/\s+/);
    if (words.length <= 1) return line;

    const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
    const totalSpaces = targetWidth - totalWordLength;
    const gaps = words.length - 1;
    
    if (gaps === 0 || totalSpaces <= 0) return line;

    const spacesPerGap = Math.floor(totalSpaces / gaps);
    const extraSpaces = totalSpaces % gaps;

    let result = words[0];
    for (let i = 1; i < words.length; i++) {
      const spaces = spacesPerGap + (i <= extraSpaces ? 1 : 0);
      result += ' '.repeat(spaces) + words[i];
    }

    return result;
  }

  /**
   * Strip ANSI codes for accurate measurement
   * @private
   */
  private stripAnsiCodes(text: string): string {
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  }

  /**
   * Create empty layout result
   * @private
   */
  private createEmptyLayout(): NormalizedLayout {
    return {
      formattedContent: '',
      actualWidth: 0,
      actualHeight: 0,
      appliedNormalizations: [],
      metadata: {
        originalDimensions: { width: 0, height: 0, minWidth: 0, maxWidth: 0, hasVariableWidth: false },
        targetDimensions: { width: 0, height: 0, minWidth: 0, maxWidth: 0, hasVariableWidth: false },
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Factory function for creating layout normalizer
 */
export function createLayoutNormalizer(
  standardsCalculator: DisplayStandardsCalculator,
  config?: Partial<LayoutNormalizerConfig>
): LayoutNormalizer {
  return new LayoutNormalizer(standardsCalculator, config);
}
/**
---
date: 2025-09-12T174343Z
name: window-layout-manager
TASK-ID: [TASK-MCP-006]
category: cli-enhancement
status: [T]
patterns: [dynamic-width-calculation, content-measurement, responsive-layout]
components: [window-layout-manager, content-analyzer]
dependencies: [chalk, terminal-compatibility-detector, border-renderer]
tags: [terminal-ui, layout, width-calculation, content-measurement]
---
 * 
 * Window Layout Manager
 * 
 * Handles dynamic width calculation, content measurement, and responsive
 * layout for structured windows. Provides intelligent sizing based on
 * content analysis and terminal constraints.
 * 
 * TASK-MCP-006: Dynamic window sizing and layout management
 */

import { TerminalCapabilities } from './terminal-compatibility-detector';
import { WindowContent, WindowOptions } from './border-renderer';

export interface ContentMeasurements {
  maxLineWidth: number;
  totalLines: number;
  avgLineWidth: number;
  titleWidth: number;
  footerWidth: number;
  hasLongLines: boolean;
  contentComplexity: 'simple' | 'medium' | 'complex';
}

export interface LayoutConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  preferredAspectRatio?: number;
  terminalMargin: number;
  allowWrapping: boolean;
  enforceMinPadding: number;
}

export interface OptimalLayout {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  padding: number;
  needsWrapping: boolean;
  needsScrolling: boolean;
  scalingFactor: number;
}

export interface LayoutBreakpoint {
  name: string;
  minWidth: number;
  maxWidth: number;
  recommendations: {
    padding: number;
    maxContentWidth: number;
    preferredHeight: number;
    allowVerticalCompression: boolean;
  };
}

export class WindowLayoutManager {
  private static readonly LAYOUT_BREAKPOINTS: LayoutBreakpoint[] = [
    {
      name: 'narrow',
      minWidth: 0,
      maxWidth: 60,
      recommendations: {
        padding: 1,
        maxContentWidth: 50,
        preferredHeight: 15,
        allowVerticalCompression: true
      }
    },
    {
      name: 'standard',
      minWidth: 61,
      maxWidth: 100,
      recommendations: {
        padding: 2,
        maxContentWidth: 80,
        preferredHeight: 20,
        allowVerticalCompression: false
      }
    },
    {
      name: 'wide',
      minWidth: 101,
      maxWidth: 150,
      recommendations: {
        padding: 3,
        maxContentWidth: 120,
        preferredHeight: 25,
        allowVerticalCompression: false
      }
    },
    {
      name: 'ultra-wide',
      minWidth: 151,
      maxWidth: Number.MAX_SAFE_INTEGER,
      recommendations: {
        padding: 4,
        maxContentWidth: 140,
        preferredHeight: 30,
        allowVerticalCompression: false
      }
    }
  ];

  /**
   * Measure content dimensions and complexity
   */
  measureContent(content: WindowContent): ContentMeasurements {
    const lines = content.content;
    let maxLineWidth = 0;
    let totalWidth = 0;

    // Measure each line
    for (const line of lines) {
      const width = this.getVisualWidth(line);
      maxLineWidth = Math.max(maxLineWidth, width);
      totalWidth += width;
    }

    const avgLineWidth = lines.length > 0 ? totalWidth / lines.length : 0;
    const titleWidth = content.title ? this.getVisualWidth(content.title) : 0;
    const footerWidth = content.footer ? this.getVisualWidth(content.footer) : 0;

    // Determine if there are long lines that might need wrapping
    const hasLongLines = lines.some(line => this.getVisualWidth(line) > 80);

    // Assess content complexity
    let contentComplexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (lines.length > 20 || maxLineWidth > 100 || hasLongLines) {
      contentComplexity = 'complex';
    } else if (lines.length > 10 || maxLineWidth > 60) {
      contentComplexity = 'medium';
    }

    return {
      maxLineWidth,
      totalLines: lines.length,
      avgLineWidth,
      titleWidth,
      footerWidth,
      hasLongLines,
      contentComplexity
    };
  }

  /**
   * Calculate optimal layout based on content and terminal capabilities
   */
  calculateOptimalLayout(
    content: WindowContent,
    capabilities: TerminalCapabilities,
    options: WindowOptions = {}
  ): OptimalLayout {
    const measurements = this.measureContent(content);
    const constraints = this.createLayoutConstraints(capabilities, options);
    const breakpoint = this.getLayoutBreakpoint(capabilities.width);

    // Determine base dimensions
    const maxContentWidth = Math.max(
      measurements.maxLineWidth,
      measurements.titleWidth,
      measurements.footerWidth
    );

    // Calculate optimal width
    let optimalWidth = Math.min(
      maxContentWidth + (breakpoint.recommendations.padding * 2) + 2, // +2 for borders
      constraints.maxWidth
    );

    // Apply options overrides
    if (options.width) {
      optimalWidth = Math.min(options.width, constraints.maxWidth);
    }

    optimalWidth = Math.max(optimalWidth, constraints.minWidth);

    // Calculate content width
    const contentWidth = optimalWidth - 2 - (breakpoint.recommendations.padding * 2);

    // Determine if wrapping is needed
    const needsWrapping = constraints.allowWrapping && measurements.hasLongLines && 
                         measurements.maxLineWidth > contentWidth;

    // Calculate height considering wrapping
    let effectiveLines = measurements.totalLines;
    if (needsWrapping) {
      effectiveLines = this.calculateWrappedLines(content.content, contentWidth);
    }

    let optimalHeight = effectiveLines + 2; // +2 for borders
    if (content.title) optimalHeight += 1;
    if (content.footer) optimalHeight += 1;

    // Apply height constraints
    if (options.height) {
      optimalHeight = Math.min(options.height, constraints.maxHeight);
    }

    optimalHeight = Math.max(optimalHeight, constraints.minHeight);
    optimalHeight = Math.min(optimalHeight, constraints.maxHeight);

    // Calculate if scrolling is needed
    const needsScrolling = effectiveLines > (optimalHeight - 2 - 
                          (content.title ? 1 : 0) - (content.footer ? 1 : 0));

    // Calculate scaling factor for responsive design
    const scalingFactor = Math.min(
      capabilities.width / 100, // Base width assumption
      capabilities.height / 30  // Base height assumption
    );

    return {
      width: optimalWidth,
      height: optimalHeight,
      contentWidth,
      contentHeight: optimalHeight - 2 - (content.title ? 1 : 0) - (content.footer ? 1 : 0),
      padding: breakpoint.recommendations.padding,
      needsWrapping,
      needsScrolling,
      scalingFactor
    };
  }

  /**
   * Get layout breakpoint for given width
   */
  getLayoutBreakpoint(terminalWidth: number): LayoutBreakpoint {
    for (const breakpoint of WindowLayoutManager.LAYOUT_BREAKPOINTS) {
      if (terminalWidth >= breakpoint.minWidth && terminalWidth <= breakpoint.maxWidth) {
        return breakpoint;
      }
    }
    return WindowLayoutManager.LAYOUT_BREAKPOINTS[1]; // Default to 'standard'
  }

  /**
   * Create layout constraints from terminal capabilities and options
   */
  private createLayoutConstraints(
    capabilities: TerminalCapabilities,
    options: WindowOptions
  ): LayoutConstraints {
    const margin = 4; // 2 chars on each side

    return {
      minWidth: Math.max(20, options.width || 0),
      maxWidth: capabilities.width - margin,
      minHeight: Math.max(5, options.height || 0),
      maxHeight: capabilities.height - margin,
      terminalMargin: margin,
      allowWrapping: true,
      enforceMinPadding: 1
    };
  }

  /**
   * Calculate total lines needed after text wrapping
   */
  private calculateWrappedLines(lines: string[], maxWidth: number): number {
    let totalLines = 0;

    for (const line of lines) {
      const visualWidth = this.getVisualWidth(line);
      if (visualWidth <= maxWidth) {
        totalLines += 1;
      } else {
        // Calculate how many lines this will wrap to
        totalLines += Math.ceil(visualWidth / maxWidth);
      }
    }

    return totalLines;
  }

  /**
   * Get visual width of text (excluding ANSI codes)
   */
  private getVisualWidth(text: string): number {
    // Strip ANSI escape codes
    const stripped = text.replace(/\u001b\[[0-9;]*m/g, '');
    
    // Handle potential multi-byte characters
    // For now, assume 1:1 ratio, but this could be enhanced for better Unicode support
    return stripped.length;
  }

  /**
   * Wrap text to fit within specified width
   */
  wrapText(text: string, maxWidth: number, preserveIndentation: boolean = true): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    let baseIndentation = '';

    // Detect base indentation if preserving
    if (preserveIndentation) {
      const match = text.match(/^(\s*)/);
      baseIndentation = match ? match[1] : '';
    }

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (this.getVisualWidth(testLine) <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = (preserveIndentation ? baseIndentation : '') + word;
        } else {
          // Single word is too long, force break
          lines.push(word.substring(0, maxWidth));
          currentLine = word.substring(maxWidth);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }

  /**
   * Optimize content for display within layout constraints
   */
  optimizeContentForLayout(
    content: WindowContent,
    layout: OptimalLayout
  ): WindowContent {
    let optimizedContent = [...content.content];

    // Apply text wrapping if needed
    if (layout.needsWrapping) {
      const wrappedLines: string[] = [];
      for (const line of content.content) {
        const wrapped = this.wrapText(line, layout.contentWidth);
        wrappedLines.push(...wrapped);
      }
      optimizedContent = wrappedLines;
    }

    // Truncate content if scrolling is needed and we want to fit in window
    if (layout.needsScrolling && layout.contentHeight > 0) {
      const maxLines = layout.contentHeight;
      if (optimizedContent.length > maxLines) {
        optimizedContent = optimizedContent.slice(0, maxLines - 1);
        optimizedContent.push('... (content truncated)');
      }
    }

    return {
      title: content.title,
      content: optimizedContent,
      footer: content.footer
    };
  }

  /**
   * Generate layout summary for debugging
   */
  generateLayoutSummary(
    content: WindowContent,
    layout: OptimalLayout,
    capabilities: TerminalCapabilities
  ): string {
    const measurements = this.measureContent(content);
    const breakpoint = this.getLayoutBreakpoint(capabilities.width);

    return `Layout Summary:
  Terminal: ${capabilities.width}x${capabilities.height}
  Breakpoint: ${breakpoint.name}
  Window: ${layout.width}x${layout.height}
  Content: ${layout.contentWidth}x${layout.contentHeight}
  Padding: ${layout.padding}
  Wrapping: ${layout.needsWrapping ? 'Yes' : 'No'}
  Scrolling: ${layout.needsScrolling ? 'Yes' : 'No'}
  Content Lines: ${measurements.totalLines}
  Max Line Width: ${measurements.maxLineWidth}
  Complexity: ${measurements.contentComplexity}`;
  }
}

// Export singleton instance
export const windowLayoutManager = new WindowLayoutManager();

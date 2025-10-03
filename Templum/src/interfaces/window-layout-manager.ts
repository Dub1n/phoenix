/**
---
date: 2025-09-12T174343Z
name: window-layout-manager
TASK-ID: [TASK-MCP-006]
category: cli-enhancement
status: [T]
patterns: [dynamic-width-calculation, content-measurement, responsive-layout]
components: [window-layout-manager, content-analyzer]
dependencies: [terminal-compatibility-detector, display-utils, window-theme-constants, chainable-string-utils]
tags: [terminal-ui, layout, width-calculation, content-measurement]
---
 *
 * Window Layout Manager
 *
 * Calculates optimal window dimensions using shared Display/Window utility
 * spacing, formatter-aware fallbacks, and content analysis. Removes bespoke
 * breakpoint tables in favour of responsive rules sourced from
 * `DisplayUtils` and `WINDOW_SPACING`.
 */

import { DisplayUtils } from '../utils/display-utils';
import { WINDOW_SPACING } from '../utils/window-theme-constants';
import { StringUtils, StringWidthUtils } from '../utils/chainable-string-utils';
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

export class WindowLayoutManager {
  measureContent(content: WindowContent): ContentMeasurements {
    const lines = this.collectLines(content);

    let maxLineWidth = 0;
    let totalWidth = 0;

    for (const line of lines) {
      const width = StringWidthUtils.getDisplayWidth(line);
      maxLineWidth = Math.max(maxLineWidth, width);
      totalWidth += width;
    }

    const avgLineWidth = lines.length > 0 ? totalWidth / lines.length : 0;
    const titleWidth = content.title ? StringWidthUtils.getDisplayWidth(content.title) : 0;
    const footerWidth = content.footer ? StringWidthUtils.getDisplayWidth(content.footer) : 0;
    const hasLongLines = lines.some(line => StringWidthUtils.getDisplayWidth(line) > WINDOW_SPACING.separatorLength);

    const contentComplexity: 'simple' | 'medium' | 'complex' = (() => {
      if (hasLongLines || lines.length > 20 || maxLineWidth > 120) {
        return 'complex';
      }
      if (lines.length > 10 || maxLineWidth > 80) {
        return 'medium';
      }
      return 'simple';
    })();

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

  calculateOptimalLayout(
    content: WindowContent,
    capabilities: TerminalCapabilities,
    options: WindowOptions = {}
  ): OptimalLayout {
    const padding = this.resolvePadding(options);
    const constraints = this.createLayoutConstraints(capabilities, options, padding);
    const measurements = this.measureContent(content);
    const lines = this.collectLines(content);

    const responsiveWidth = DisplayUtils.responsiveWidth(lines, {
      padding,
      minWidth: constraints.minWidth,
      maxWidth: constraints.maxWidth
    });

    const requestedWidth = typeof options.width === 'number'
      ? Math.max(constraints.minWidth, Math.min(options.width, constraints.maxWidth))
      : responsiveWidth;

    const width = Math.max(constraints.minWidth, Math.min(requestedWidth, constraints.maxWidth));
    const contentWidth = Math.max(width - WINDOW_SPACING.borderWidth - padding * 2, 1);

    const wrappedLineCount = constraints.allowWrapping
      ? this.calculateWrappedLines(content.content, contentWidth)
      : measurements.totalLines;
    const needsWrapping = constraints.allowWrapping && wrappedLineCount > content.content.length;

    let bodyLineCount = wrappedLineCount;
    let height = bodyLineCount + 2; // borders

    if (content.title) {
      height += 1;
    }
    if (content.footer) {
      height += 1;
    }

    if (typeof options.height === 'number') {
      height = Math.max(constraints.minHeight, Math.min(options.height, constraints.maxHeight));
    } else {
      height = Math.max(constraints.minHeight, Math.min(height, constraints.maxHeight));
    }

    const availableContentHeight = Math.max(
      height - 2 - (content.title ? 1 : 0) - (content.footer ? 1 : 0),
      0
    );
    const needsScrolling = bodyLineCount > availableContentHeight;
    const scalingFactor = this.calculateScalingFactor(capabilities);

    return {
      width,
      height,
      contentWidth,
      contentHeight: availableContentHeight,
      padding,
      needsWrapping,
      needsScrolling,
      scalingFactor
    };
  }

  optimizeContentForLayout(
    content: WindowContent,
    layout: OptimalLayout
  ): WindowContent {
    let optimizedContent = [...content.content];

    if (layout.needsWrapping) {
      optimizedContent = optimizedContent.flatMap(line => this.wrapText(line, layout.contentWidth));
    }

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

  generateLayoutSummary(
    content: WindowContent,
    layout: OptimalLayout,
    capabilities: TerminalCapabilities
  ): string {
    const measurements = this.measureContent(content);

    return `Layout Summary:
  Terminal: ${capabilities.width}x${capabilities.height}
  Window: ${layout.width}x${layout.height}
  Content: ${layout.contentWidth}x${layout.contentHeight}
  Padding: ${layout.padding}
  Wrapping: ${layout.needsWrapping ? 'Yes' : 'No'}
  Scrolling: ${layout.needsScrolling ? 'Yes' : 'No'}
  Content Lines: ${measurements.totalLines}
  Max Line Width: ${measurements.maxLineWidth}
  Complexity: ${measurements.contentComplexity}`;
  }

  private collectLines(content: WindowContent): string[] {
    const lines: string[] = [];

    if (content.title) {
      lines.push(content.title);
    }

    lines.push(...content.content);

    if (content.footer) {
      lines.push(content.footer);
    }

    return lines;
  }

  private resolvePadding(options: WindowOptions): number {
    if (typeof options.padding === 'number') {
      return Math.max(0, options.padding);
    }
    return WINDOW_SPACING.defaultPadding;
  }

  private createLayoutConstraints(
    capabilities: TerminalCapabilities,
    options: WindowOptions,
    padding: number
  ): LayoutConstraints {
    const standards = DisplayUtils.standards;
    const terminalWidth = capabilities.width ?? standards.terminalWidth;
    const terminalHeight = capabilities.height ?? standards.minWidth;

    const minWidth = Math.max(
      WINDOW_SPACING.minWidth,
      standards.minWidth,
      options.width ?? WINDOW_SPACING.minWidth
    );

    const maxWidth = Math.max(
      minWidth,
      Math.min(
        WINDOW_SPACING.maxWidth,
        standards.maxWidth,
        terminalWidth - WINDOW_SPACING.separatorMargin
      )
    );

    const minHeight = Math.max(5, options.height ?? 0);
    const maxHeight = Math.max(minHeight, terminalHeight - WINDOW_SPACING.borderWidth);

    return {
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      preferredAspectRatio: undefined,
      terminalMargin: WINDOW_SPACING.separatorMargin,
      allowWrapping: true,
      enforceMinPadding: padding
    };
  }

  private calculateWrappedLines(lines: string[], maxWidth: number): number {
    if (maxWidth <= 0) {
      return lines.length;
    }

    return lines.reduce((total, line) => {
      const segments = StringUtils.wrap(line, maxWidth, { hard: false });
      return total + segments.length;
    }, 0);
  }

  private wrapText(text: string, maxWidth: number): string[] {
    if (maxWidth <= 0) {
      return [''];
    }
    const segments = StringUtils.wrap(text, maxWidth, { hard: false });
    return segments.length > 0 ? segments : [''];
  }

  private calculateScalingFactor(capabilities: TerminalCapabilities): number {
    const standards = DisplayUtils.standards;
    const widthRatio = (capabilities.width ?? standards.terminalWidth) / Math.max(standards.terminalWidth, 1);
    const heightRatio = (capabilities.height ?? 30) / 30;
    return Number.isFinite(widthRatio) && Number.isFinite(heightRatio)
      ? Math.min(widthRatio, heightRatio)
      : 1;
  }
}

export const windowLayoutManager = new WindowLayoutManager();

import { createLogger, Logger } from './logger';
import { DisplayUtils } from './display-utils';
import {
  TerminalFormatter,
  createFormatter,
  type TerminalCapabilities,
  TerminalSeparatorStyle,
} from './terminal-formatter';
import { WINDOW_BORDER_GLYPHS, WindowBorderGlyphSet, WindowBorderStyle, WINDOW_SPACING } from './window-theme-constants';

export interface WindowRenderOptions {
  width?: number;
  height?: number;
  padding?: number;
  style?: WindowBorderStyle;
  title?: string;
  alignTitle?: 'left' | 'center' | 'right';
}

export interface WindowRenderInput extends WindowRenderOptions {
  content: string[];
}

export interface WindowBuilderConfig extends WindowRenderOptions {}

const TITLE_ALIGNERS: Record<'left' | 'center' | 'right', (title: string, width: number) => string> = {
  left: (title, width) => title.padEnd(width, ' '),
  center: (title, width) => {
    const trimmed = title.trim();
    const excess = Math.max(width - trimmed.length, 0);
    const leftPad = Math.floor(excess / 2);
    const rightPad = excess - leftPad;
    return `${' '.repeat(leftPad)}${trimmed}${' '.repeat(rightPad)}`;
  },
  right: (title, width) => title.padStart(width, ' ')
};

interface WindowFormatter {
  getCapabilities(): TerminalCapabilities;
  ui: {
    separator(length?: number, style?: TerminalSeparatorStyle): string;
  };
}

export interface WindowUtilsDependencies {
  logger?: Logger;
  formatter?: WindowFormatter;
}

interface ResolvedWindowUtilsDependencies {
  logger: Logger;
  formatter: WindowFormatter;
}

export class WindowBuilder {
  private config: WindowBuilderConfig = {};

  width(width: number): this {
    this.config.width = Math.max(1, width);
    return this;
  }

  autoWidth(): this {
    this.config.width = DisplayUtils.standards.terminalWidth - DisplayUtils.standards.separatorMargin;
    return this;
  }

  height(height: number): this {
    this.config.height = Math.max(0, height);
    return this;
  }

  padding(padding: number): this {
    this.config.padding = Math.max(0, padding);
    return this;
  }

  style(style: WindowBorderStyle): this {
    this.config.style = style;
    return this;
  }

  title(title: string, alignment: 'left' | 'center' | 'right' = 'center'): this {
    this.config.title = title;
    this.config.alignTitle = alignment;
    return this;
  }

  render(content: string[]): string {
    return WindowUtils.render({ ...this.config, content });
  }
}

export class WindowUtils {
  private static createDefaultDependencies(): ResolvedWindowUtilsDependencies {
    return {
      logger: createLogger('window-utils'),
      formatter: createFormatter(),
    };
  }

  private static dependencies: ResolvedWindowUtilsDependencies = WindowUtils.createDefaultDependencies();

  static configure(dependencies: WindowUtilsDependencies): void {
    if (dependencies.logger) {
      WindowUtils.dependencies.logger = dependencies.logger;
    }

    if (dependencies.formatter) {
      WindowUtils.dependencies.formatter = dependencies.formatter;
    }
  }

  static reset(): void {
    WindowUtils.dependencies = WindowUtils.createDefaultDependencies();
  }

  static builder(): WindowBuilder {
    return new WindowBuilder();
  }

  static render(input: WindowRenderInput): string {
    const { formatter, logger } = WindowUtils.dependencies;
    const capabilities = formatter.getCapabilities?.() ?? TerminalFormatter.detectCapabilities();
    const style = input.style ?? 'single';
    const glyphs = WindowUtils.resolveGlyphs(style, capabilities);
    const resolvedStyle = capabilities.supportsUnicode || style === 'ascii' ? style : 'ascii';

    const content = input.content ?? [];
    const padding = input.padding ?? WINDOW_SPACING.defaultPadding;
    const requestedWidth = input.width ?? DisplayUtils.responsiveWidth(content, { padding });
    const minimumWidth = Math.max(WINDOW_SPACING.borderWidth + 2, WINDOW_SPACING.separatorMargin);
    const capabilityWidth = Math.max(
      minimumWidth,
      Math.min(capabilities.width ?? minimumWidth, WINDOW_SPACING.maxWidth)
    );
    const boundedWidth = Math.min(Math.max(requestedWidth, minimumWidth), capabilityWidth);
    const innerWidth = Math.max(boundedWidth - WINDOW_SPACING.borderWidth, 1);

    const header = this.composeHeader({
      glyphs,
      title: input.title,
      align: input.alignTitle ?? 'center',
      innerWidth
    });

    const body = this.composeBody({
      content,
      padding,
      innerWidth,
      vertical: glyphs.edges.vertical,
      requestedHeight: input.height
    });

    const footer = `${glyphs.corners.bottomLeft}${glyphs.edges.horizontal.repeat(innerWidth)}${glyphs.corners.bottomRight}`;

    const output = [header, ...body, footer].join('\n');
    logger.debug('Rendered window', {
      width: boundedWidth,
      height: body.length + 2,
      padding,
      requestedStyle: style,
      resolvedStyle,
      titleLength: input.title?.length ?? 0,
      supportsUnicode: capabilities.supportsUnicode,
      supportsColor: capabilities.supportsColor
    });
    return output;
  }

  private static resolveGlyphs(
    style: WindowBorderStyle,
    capabilities: TerminalCapabilities
  ): WindowBorderGlyphSet {
    const baseSet = WINDOW_BORDER_GLYPHS[style] ?? WINDOW_BORDER_GLYPHS.single;

    if (style === 'ascii') {
      return baseSet;
    }

    if (capabilities.supportsColor && capabilities.supportsUnicode) {
      return baseSet;
    }

    return WindowUtils.applyGlyphFallbacks(baseSet, WINDOW_BORDER_GLYPHS.ascii, capabilities);
  }

  private static applyGlyphFallbacks(
    base: WindowBorderGlyphSet,
    fallback: WindowBorderGlyphSet,
    capabilities: TerminalCapabilities
  ): WindowBorderGlyphSet {
    const edges = {
      horizontal: TerminalFormatter.withFallback(base.edges.horizontal, fallback.edges.horizontal, capabilities),
      vertical: TerminalFormatter.withFallback(base.edges.vertical, fallback.edges.vertical, capabilities),
    };

    const corners = {
      topLeft: TerminalFormatter.withFallback(base.corners.topLeft, fallback.corners.topLeft, capabilities),
      topRight: TerminalFormatter.withFallback(base.corners.topRight, fallback.corners.topRight, capabilities),
      bottomLeft: TerminalFormatter.withFallback(base.corners.bottomLeft, fallback.corners.bottomLeft, capabilities),
      bottomRight: TerminalFormatter.withFallback(base.corners.bottomRight, fallback.corners.bottomRight, capabilities),
    };

    const junctions = {
      top: TerminalFormatter.withFallback(base.junctions.top, fallback.junctions.top, capabilities),
      bottom: TerminalFormatter.withFallback(base.junctions.bottom, fallback.junctions.bottom, capabilities),
      left: TerminalFormatter.withFallback(base.junctions.left, fallback.junctions.left, capabilities),
      right: TerminalFormatter.withFallback(base.junctions.right, fallback.junctions.right, capabilities),
      cross: TerminalFormatter.withFallback(base.junctions.cross, fallback.junctions.cross, capabilities),
    };

    return {
      edges,
      corners,
      junctions,
    };
  }

  private static composeHeader({ glyphs, title, align, innerWidth }: { glyphs: WindowBorderGlyphSet; title?: string; align: 'left' | 'center' | 'right'; innerWidth: number }): string {
    if (!title || title.trim().length === 0) {
      return `${glyphs.corners.topLeft}${glyphs.edges.horizontal.repeat(innerWidth)}${glyphs.corners.topRight}`;
    }

    const maxTitleWidth = Math.max(innerWidth, title.length);
    const alignedTitle = TITLE_ALIGNERS[align](title, maxTitleWidth).slice(0, innerWidth);
    const decorated = WindowUtils.dependencies.formatter.ui.separator(innerWidth, 'solid');
    const stripped = this.stripAnsi(decorated);

    const merged = stripped.substring(0, Math.min(innerWidth, alignedTitle.length));
    const withTitle = `${glyphs.corners.topLeft}${this.mergeTitle(merged, alignedTitle)}${glyphs.corners.topRight}`;
    return withTitle;
  }

  private static composeBody({ content, padding, innerWidth, vertical, requestedHeight }: { content: string[]; padding: number; innerWidth: number; vertical: string; requestedHeight?: number }): string[] {
    const availableWidth = Math.max(innerWidth - padding * 2, 1);
    const paddedContent = content.map(line => this.padLine(line, availableWidth));
    const lines = paddedContent.map(line => `${vertical}${' '.repeat(padding)}${line}${' '.repeat(padding)}${vertical}`);

    if (requestedHeight && requestedHeight > lines.length) {
      const fillerCount = requestedHeight - lines.length;
      for (let i = 0; i < fillerCount; i += 1) {
        lines.push(`${vertical}${' '.repeat(innerWidth)}${vertical}`);
      }
    }

    return lines;
  }

  private static mergeTitle(separator: string, title: string): string {
    if (title.length >= separator.length) {
      return title.slice(0, separator.length);
    }

    const start = Math.max(Math.floor((separator.length - title.length) / 2), 0);
    const prefix = separator.slice(0, start);
    const suffix = separator.slice(start + title.length);
    return `${prefix}${title}${suffix}`;
  }

  private static padLine(value: string, width: number): string {
    const stripped = this.stripAnsi(value);
    if (stripped.length === width) {
      return value;
    }

    if (stripped.length > width) {
      const truncated = stripped.slice(0, Math.max(width - 3, 0));
      return `${truncated}${width >= 3 ? '...' : ''}`.padEnd(width, ' ');
    }

    return `${stripped}${' '.repeat(width - stripped.length)}`;
  }

  private static stripAnsi(value: string): string {
    return value.replace(/\u001b\[[0-9;]*m/g, '');
  }
}

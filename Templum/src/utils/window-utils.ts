import { createLogger, Logger } from './logger';
import { DisplayUtils } from './display-utils';
import { TerminalFormatter } from './terminal-formatter';

export type WindowBorderStyle = 'single' | 'double' | 'dashed';

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

const BORDER_SETS: Record<WindowBorderStyle, { horizontal: string; vertical: string; topLeft: string; topRight: string; bottomLeft: string; bottomRight: string; tee: string }>= {
  single: {
    horizontal: '─',
    vertical: '│',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    tee: '┤'
  },
  double: {
    horizontal: '═',
    vertical: '║',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    tee: '╣'
  },
  dashed: {
    horizontal: '-',
    vertical: '|',
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    tee: '+'
  }
};

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

export class WindowBuilder {
  private config: WindowBuilderConfig = {};

  width(width: number): this {
    this.config.width = Math.max(1, width);
    return this;
  }

  autoWidth(): this {
    this.config.width = DisplayUtils.standards.terminalWidth - 4;
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
  private static logger: Logger = createLogger('window-utils');
  private static formatter = new TerminalFormatter();

  static builder(): WindowBuilder {
    return new WindowBuilder();
  }

  static render(input: WindowRenderInput): string {
    const content = input.content ?? [];
    const padding = input.padding ?? 1;
    const style = input.style ?? 'single';
    const chars = BORDER_SETS[style];

    const width = input.width ?? DisplayUtils.responsiveWidth(content, { padding });
    const boundedWidth = Math.max(width, 4);
    const innerWidth = Math.max(boundedWidth - 2, 1);

    const header = this.composeHeader({
      chars,
      title: input.title,
      align: input.alignTitle ?? 'center',
      innerWidth
    });

    const body = this.composeBody({
      content,
      padding,
      innerWidth,
      vertical: chars.vertical,
      requestedHeight: input.height
    });

    const footer = `${chars.bottomLeft}${chars.horizontal.repeat(innerWidth)}${chars.bottomRight}`;

    const output = [header, ...body, footer].join('\n');
    this.logger.debug('Rendered window', {
      width: boundedWidth,
      height: body.length + 2,
      padding,
      style,
      titleLength: input.title?.length ?? 0
    });
    return output;
  }

  private static composeHeader({ chars, title, align, innerWidth }: { chars: typeof BORDER_SETS[WindowBorderStyle]; title?: string; align: 'left' | 'center' | 'right'; innerWidth: number }): string {
    if (!title || title.trim().length === 0) {
      return `${chars.topLeft}${chars.horizontal.repeat(innerWidth)}${chars.topRight}`;
    }

    const maxTitleWidth = Math.max(innerWidth, title.length);
    const alignedTitle = TITLE_ALIGNERS[align](title, maxTitleWidth).slice(0, innerWidth);
    const decorated = this.formatter.ui.separator(innerWidth, 'solid');
    const stripped = this.stripAnsi(decorated);

    const merged = stripped.substring(0, Math.min(innerWidth, alignedTitle.length));
    const withTitle = `${chars.topLeft}${this.mergeTitle(merged, alignedTitle)}${chars.topRight}`;
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

import { createLogger, Logger } from './logger';
import { TerminalFormatter } from './terminal-formatter';

export interface ServiceOrderOptions {
  connectedFirst?: boolean;
  alphabetical?: boolean;
}

export interface ResponsiveOptions {
  minWidth?: number;
  maxWidth?: number;
  padding?: number;
}

export interface ItemFormatOptions {
  numbered?: boolean;
  prefix?: string;
  suffix?: string;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface DisplayStandards {
  terminalWidth: number;
  minWidth: number;
  maxWidth: number;
  defaultPadding: number;
  borderWidth: number;
  separatorLength: number;
}

export interface DisplayLayout {
  totalWidth: number;
  contentWidth: number;
  padding: number;
  maxItemLength: number;
  ordering: string;
  separatorLength: number;
}

class DisplayCalculator {
  private widthValue = 0;
  private paddingValue = 2;
  private orderingValue: 'connected-first' | 'alphabetical' | 'none' = 'connected-first';

  width(width: number): this {
    this.widthValue = Math.max(0, width);
    return this;
  }

  autoWidth(): this {
    this.widthValue = DisplayUtils.standards.terminalWidth;
    return this;
  }

  padding(padding: number): this {
    this.paddingValue = Math.max(0, padding);
    return this;
  }

  order(strategy: 'connected-first' | 'alphabetical' | 'none'): this {
    this.orderingValue = strategy;
    return this;
  }

  layout(): DisplayLayout {
    const totalWidth = this.widthValue || DisplayUtils.standards.terminalWidth;
    const contentWidth = Math.max(totalWidth - this.paddingValue * 2, 20);

    return {
      totalWidth,
      contentWidth,
      padding: this.paddingValue,
      maxItemLength: Math.max(contentWidth - 4, 10),
      ordering: this.orderingValue,
      separatorLength: contentWidth
    };
  }
}

export class DisplayUtils {
  private static logger: Logger = createLogger('display-utils');
  private static formatter: TerminalFormatter = new TerminalFormatter();

  static calculate(): DisplayCalculator {
    return new DisplayCalculator();
  }

  static orderServices<T extends { status: string; name: string }>(
    services: T[],
    options: ServiceOrderOptions = {}
  ): T[] {
    const { connectedFirst = true, alphabetical = true } = options;
    let ordered = [...services];

    if (connectedFirst) {
      const connected = ordered.filter(service =>
        ['connected', 'healthy', 'active'].includes(service.status)
      );
      const others = ordered.filter(service => !['connected', 'healthy', 'active'].includes(service.status));

      if (alphabetical) {
        connected.sort((a, b) => a.name.localeCompare(b.name));
        others.sort((a, b) => a.name.localeCompare(b.name));
      }

      ordered = [...connected, ...others];
    } else if (alphabetical) {
      ordered.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.logger.debug('Ordered services', {
      total: services.length,
      connected: ordered.filter(service => service.status === 'connected').length
    });

    return ordered;
  }

  static get standards(): DisplayStandards {
    const terminalWidth = typeof process.stdout?.columns === 'number'
      ? process.stdout.columns
      : 80;

    return {
      terminalWidth,
      minWidth: 40,
      maxWidth: 120,
      defaultPadding: 2,
      borderWidth: 2,
      separatorLength: Math.min(terminalWidth - 4, 60)
    };
  }

  static responsiveWidth(content: string | string[], options: ResponsiveOptions = {}): number {
    const { minWidth, maxWidth, padding = this.standards.defaultPadding } = options;
    const standards = this.standards;

    const values = Array.isArray(content) ? content : [content];
    const contentWidth = values.reduce((max, value) => {
      const width = this.stripAnsi(value).length;
      return Math.max(max, width);
    }, 0);

    const ideal = contentWidth + padding * 2;
    const min = minWidth ?? standards.minWidth;
    const max = maxWidth ?? Math.min(standards.terminalWidth - standards.borderWidth, standards.maxWidth);

    return Math.max(min, Math.min(max, ideal));
  }

  static formatItems(items: string[], options: ItemFormatOptions = {}): string[] {
    const {
      numbered = true,
      prefix = '',
      suffix = '',
      width = 0,
      alignment = 'left'
    } = options;

    return items.map((item, index) => {
      let output = item;

      if (numbered) {
        const number = String(index + 1).padStart(2, ' ');
        output = `${number}. ${output}`;
      }

      if (prefix) {
        output = `${prefix}${output}`;
      }

      if (suffix) {
        output = `${output}${suffix}`;
      }

      if (width > 0) {
        output = this.applyWidth(output, width, alignment);
      }

      return output;
    });
  }

  static separator(length = this.standards.separatorLength, style: 'solid' | 'dashed' | 'double' = 'solid'): string {
    return this.formatter.ui.separator(length, style);
  }

  private static applyWidth(value: string, width: number, alignment: ItemFormatOptions['alignment']): string {
    const stripped = this.stripAnsi(value);
    const padding = width - stripped.length;

    if (padding <= 0) {
      return stripped.slice(0, Math.max(0, width - 3)) + (stripped.length > width ? '...' : '');
    }

    switch (alignment) {
      case 'center': {
        const left = Math.floor(padding / 2);
        const right = padding - left;
        return `${' '.repeat(left)}${value}${' '.repeat(right)}`;
      }
      case 'right':
        return `${' '.repeat(padding)}${value}`;
      default:
        return `${value}${' '.repeat(padding)}`;
    }
  }

  private static stripAnsi(value: string): string {
    return value.replace(/\u001B\[[0-9;]*m/g, '');
  }
}

export const {
  calculate,
  orderServices,
  responsiveWidth,
  formatItems,
  standards: displayStandards
} = DisplayUtils;

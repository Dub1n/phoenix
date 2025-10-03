import { createLogger, Logger } from './logger';
import { createFormatter, TERMINAL_FORMATTER_SPACING, TerminalSeparatorStyle } from './terminal-formatter';

interface DisplayFormatter {
  ui: {
    separator(length?: number, style?: TerminalSeparatorStyle): string;
  };
}

type ColumnsProvider = () => number | undefined;

export interface DisplayUtilsDependencies {
  logger?: Logger;
  formatter?: DisplayFormatter;
  columnsProvider?: ColumnsProvider;
}

interface ResolvedDisplayUtilsDependencies {
  logger: Logger;
  formatter: DisplayFormatter;
  columnsProvider: ColumnsProvider;
}

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
  separatorMargin: number;
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
  private static createDefaultDependencies(): ResolvedDisplayUtilsDependencies {
    return {
      logger: createLogger('display-utils'),
      formatter: createFormatter(),
      columnsProvider: () => (typeof process.stdout?.columns === 'number' ? process.stdout.columns : undefined)
    };
  }

  private static dependencies: ResolvedDisplayUtilsDependencies = DisplayUtils.createDefaultDependencies();

  static configure(dependencies: DisplayUtilsDependencies): void {
    if (dependencies.logger) {
      DisplayUtils.dependencies.logger = dependencies.logger;
    }

    if (dependencies.formatter) {
      DisplayUtils.dependencies.formatter = dependencies.formatter;
    }

    if (dependencies.columnsProvider) {
      DisplayUtils.dependencies.columnsProvider = dependencies.columnsProvider;
    }
  }

  static reset(): void {
    DisplayUtils.dependencies = DisplayUtils.createDefaultDependencies();
  }

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

    DisplayUtils.dependencies.logger.debug('Ordered services', {
      total: services.length,
      connected: ordered.filter(service => service.status === 'connected').length
    });

    return ordered;
  }

  static get standards(): DisplayStandards {
    const providedWidth = DisplayUtils.dependencies.columnsProvider();
    const terminalWidth = typeof providedWidth === 'number' && Number.isFinite(providedWidth)
      ? providedWidth
      : typeof process.stdout?.columns === 'number'
        ? process.stdout.columns
        : 80;

    return {
      terminalWidth,
      minWidth: TERMINAL_FORMATTER_SPACING.minTerminalWidth,
      maxWidth: TERMINAL_FORMATTER_SPACING.maxTerminalWidth,
      defaultPadding: TERMINAL_FORMATTER_SPACING.defaultPadding,
      borderWidth: TERMINAL_FORMATTER_SPACING.borderWidth,
      separatorLength: Math.min(
        Math.max(1, terminalWidth - TERMINAL_FORMATTER_SPACING.separatorMargin),
        TERMINAL_FORMATTER_SPACING.separatorLength
      ),
      separatorMargin: TERMINAL_FORMATTER_SPACING.separatorMargin
    };
  }

  static responsiveWidth(content: string | string[], options: ResponsiveOptions = {}): number {
    const { minWidth, maxWidth, padding = DisplayUtils.standards.defaultPadding } = options;
    const standards = DisplayUtils.standards;

    const values = Array.isArray(content) ? content : [content];
    const contentWidth = values.reduce((max, value) => {
      const width = DisplayUtils.stripAnsi(value).length;
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
        output = DisplayUtils.applyWidth(output, width, alignment);
      }

      return output;
    });
  }

  static separator(length = DisplayUtils.standards.separatorLength, style: TerminalSeparatorStyle = 'solid'): string {
    return DisplayUtils.dependencies.formatter.ui.separator(length, style);
  }

  private static applyWidth(value: string, width: number, alignment: ItemFormatOptions['alignment']): string {
    const stripped = DisplayUtils.stripAnsi(value);
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

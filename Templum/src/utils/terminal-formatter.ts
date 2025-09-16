import chalk from 'chalk';
import { inspect } from 'util';

export type Platform = 'windows' | 'unix' | 'browser';

export interface TerminalCapabilities {
  supportsColor: boolean;
  supports256Colors: boolean;
  supportsTrueColor: boolean;
  supportsStyles: boolean;
  supportsUnicode: boolean;
  width: number;
  height: number;
  isInteractive: boolean;
  platform: Platform;
}

type Modifier = 'bold' | 'dim' | 'italic' | 'underline' | 'inverse';

export interface ColorSpec {
  fg?: string;
  bg?: string;
  modifiers?: Modifier[];
}

export interface MenuItem {
  label: string;
  description?: string;
  shortcut?: string;
  disabled?: boolean;
}

export interface TableOptions {
  headers?: string[];
  padding?: number;
  align?: Array<'left' | 'right' | 'center'>;
  highlightRow?: number;
}

export interface TerminalTheme {
  status: {
    success: ColorSpec;
    error: ColorSpec;
    warning: ColorSpec;
    info: ColorSpec;
    debug: ColorSpec;
  };
  ui: {
    header: [ColorSpec, ColorSpec, ColorSpec];
    separator: ColorSpec;
    menu: ColorSpec;
    menuSelected: ColorSpec;
    prompt: ColorSpec;
    breadcrumb: ColorSpec;
  };
  data: {
    tableHeader: ColorSpec;
    tableCell: ColorSpec;
    highlight: ColorSpec;
    code: ColorSpec;
  };
  interactive: {
    selection: ColorSpec;
    navigation: ColorSpec;
    feedback: ColorSpec;
  };
  system: {
    timestamp: ColorSpec;
    path: ColorSpec;
    command: ColorSpec;
    version: ColorSpec;
  };
  muted: ColorSpec;
}

const DEFAULT_THEME: TerminalTheme = {
  status: {
    success: { fg: '#4caf50', modifiers: ['bold'] },
    error: { fg: '#ff5252', modifiers: ['bold'] },
    warning: { fg: '#ffd54f', modifiers: ['bold'] },
    info: { fg: '#4fc3f7' },
    debug: { fg: '#9e9e9e' }
  },
  ui: {
    header: [
      { fg: '#90caf9', modifiers: ['bold'] },
      { fg: '#64b5f6', modifiers: ['bold'] },
      { fg: '#42a5f5', modifiers: ['bold'] }
    ],
    separator: { fg: '#78909c' },
    menu: { fg: '#e0e0e0' },
    menuSelected: { fg: '#ffffff', bg: '#42a5f5', modifiers: ['bold'] },
    prompt: { fg: '#4dd0e1', modifiers: ['bold'] },
    breadcrumb: { fg: '#aed581' }
  },
  data: {
    tableHeader: { fg: '#80cbc4', modifiers: ['bold'] },
    tableCell: { fg: '#e0f7fa' },
    highlight: { fg: '#ffab91', modifiers: ['bold'] },
    code: { fg: '#c5e1a5' }
  },
  interactive: {
    selection: { fg: '#ffffff', bg: '#7e57c2', modifiers: ['bold'] },
    navigation: { fg: '#ffcc80', modifiers: ['bold'] },
    feedback: { fg: '#b39ddb', modifiers: ['italic'] }
  },
  system: {
    timestamp: { fg: '#b0bec5' },
    path: { fg: '#81d4fa' },
    command: { fg: '#ce93d8' },
    version: { fg: '#ffcc80' }
  },
  muted: { fg: '#9e9e9e' }
};

function applySpec(text: string, spec: ColorSpec, capabilities: TerminalCapabilities): string {
  if (!capabilities.supportsColor || !spec) {
    return text;
  }

  let painter = chalk;

  if (spec.fg) {
    painter = spec.fg.startsWith('#')
      ? painter.hex(spec.fg)
      : (painter as any)[spec.fg] ?? painter.keyword(spec.fg);
  }

  if (spec.bg) {
    painter = spec.bg.startsWith('#')
      ? painter.bgHex(spec.bg)
      : (painter as any)[`bg${spec.bg.charAt(0).toUpperCase()}${spec.bg.slice(1)}`] ?? painter.bgKeyword(spec.bg);
  }

  if (spec.modifiers) {
    for (const modifier of spec.modifiers) {
      const fn = (painter as any)[modifier];
      if (typeof fn === 'function') {
        painter = fn.bind(painter);
      }
    }
  }

  try {
    return painter(text);
  } catch {
    return text;
  }
}

function pad(text: string, length: number, align: 'left' | 'right' | 'center'): string {
  const visibleLength = text.replace(/\u001b\[[0-9;]*m/g, '').length;
  if (visibleLength >= length) {
    return text;
  }

  const padding = length - visibleLength;
  if (align === 'right') {
    return `${' '.repeat(padding)}${text}`;
  }
  if (align === 'center') {
    const left = Math.floor(padding / 2);
    const right = padding - left;
    return `${' '.repeat(left)}${text}${' '.repeat(right)}`;
  }
  return `${text}${' '.repeat(padding)}`;
}

function unicodeOrFallback(capabilities: TerminalCapabilities, unicode: string, fallback: string): string {
  return capabilities.supportsUnicode ? unicode : fallback;
}

export class TerminalFormatter {
  private readonly capabilities: TerminalCapabilities;
  private readonly theme: TerminalTheme;

  constructor(theme: Partial<TerminalTheme> = {}, capabilities?: TerminalCapabilities) {
    this.capabilities = capabilities ?? TerminalFormatter.detectCapabilities();
    this.theme = TerminalFormatter.mergeTheme(theme);
  }

  readonly status = {
    success: (message: string) => this.formatStatus('success', message),
    error: (message: string) => this.formatStatus('error', message),
    warning: (message: string) => this.formatStatus('warning', message),
    info: (message: string) => this.formatStatus('info', message),
    debug: (message: string) => this.formatStatus('debug', message)
  };

  readonly ui = {
    header: (message: string, level: 1 | 2 | 3 = 1) => this.formatHeader(message, level),
    separator: (length = this.capabilities.width, style: 'solid' | 'dashed' | 'double' = 'solid') =>
      this.formatSeparator(length, style),
    menu: (items: MenuItem[], selectedIndex = 0) => this.formatMenu(items, selectedIndex),
    prompt: (question: string, type: 'input' | 'confirm' | 'select' = 'input') =>
      this.formatPrompt(question, type),
    breadcrumb: (segments: string[]) => this.formatBreadcrumb(segments)
  };

  readonly data = {
    table: (rows: unknown[], options: TableOptions = {}) => this.formatTable(rows, options),
    progress: (current: number, total: number, message?: string) => this.formatProgress(current, total, message),
    highlight: (text: string, pattern: string | RegExp) => this.formatHighlight(text, pattern),
    code: (snippet: string, language = '') => this.formatCode(snippet, language)
  };

  readonly interactive = {
    selection: (text: string, isSelected: boolean) => this.formatSelection(text, isSelected),
    navigation: (direction: 'up' | 'down' | 'left' | 'right') => this.formatNavigation(direction),
    feedback: (type: 'loading' | 'thinking' | 'processing', message?: string) => this.formatFeedback(type, message)
  };

  readonly system = {
    timestamp: (date = new Date()) => this.formatSystem('timestamp', date.toISOString()),
    path: (value: string) => this.formatSystem('path', value),
    command: (value: string) => this.formatSystem('command', value),
    version: (value: string) => this.formatSystem('version', value)
  };

  private formatStatus(kind: keyof TerminalTheme['status'], message: string): string {
    const spec = this.theme.status[kind];
    return applySpec(message, spec, this.capabilities);
  }

  private formatHeader(message: string, level: 1 | 2 | 3): string {
    const spec = this.theme.ui.header[level - 1];
    const prefix = unicodeOrFallback(this.capabilities, '❯', '>');
    return applySpec(`${prefix} ${message}`, spec, this.capabilities);
  }

  private formatSeparator(length: number, style: 'solid' | 'dashed' | 'double'): string {
    const palette = {
      solid: unicodeOrFallback(this.capabilities, '─', '-'),
      dashed: unicodeOrFallback(this.capabilities, '╌', '-'),
      double: unicodeOrFallback(this.capabilities, '═', '=')
    } as const;

    const char = palette[style];
    const separator = char.repeat(Math.max(1, Math.min(length, this.capabilities.width)));
    return applySpec(separator, this.theme.ui.separator, this.capabilities);
  }

  private formatMenu(items: MenuItem[], selectedIndex: number): string {
    return items
      .map((item, index) => {
        const bullet = unicodeOrFallback(this.capabilities, '•', '*');
        const base = `${bullet} ${item.label}` + (item.shortcut ? ` (${item.shortcut})` : '');
        const description = item.description ? ` ${applySpec(item.description, this.theme.muted, this.capabilities)}` : '';
        const text = `${base}${description}`;

        if (item.disabled) {
          return applySpec(text, this.theme.muted, this.capabilities);
        }

        if (index === selectedIndex) {
          return applySpec(text, this.theme.ui.menuSelected, this.capabilities);
        }

        return applySpec(text, this.theme.ui.menu, this.capabilities);
      })
      .join('\n');
  }

  private formatPrompt(question: string, type: 'input' | 'confirm' | 'select'): string {
    const suffix = type === 'confirm'
      ? unicodeOrFallback(this.capabilities, '[y/n]', '(y/n)')
      : type === 'select'
        ? unicodeOrFallback(this.capabilities, '⏷', 'v')
        : ':';

    return applySpec(`${question} ${suffix}`, this.theme.ui.prompt, this.capabilities);
  }

  private formatBreadcrumb(segments: string[]): string {
    const separator = unicodeOrFallback(this.capabilities, ' › ', ' > ');
    return segments
      .map(segment => applySpec(segment, this.theme.ui.breadcrumb, this.capabilities))
      .join(separator);
  }

  private formatTable(rows: unknown[], options: TableOptions): string {
    const rowsAsArrays = rows.map(row => (
      Array.isArray(row) ? row : Object.values(row ?? {})
    ));
    const headers = options.headers ?? (rows.length && !Array.isArray(rows[0]) ? Object.keys(rows[0] as Record<string, unknown>) : []);
    const padding = options.padding ?? 2;
    const align = options.align ?? [];

    const columnCount = Math.max(
      headers.length,
      ...rowsAsArrays.map(row => row.length)
    );

    const widths = new Array(columnCount).fill(0);

    const applyRow = (row: unknown[]) => {
      row.forEach((value, columnIndex) => {
        const text = formatCell(value);
        const length = text.replace(/\u001b\[[0-9;]*m/g, '').length;
        widths[columnIndex] = Math.max(widths[columnIndex], length);
      });
    };

    if (headers.length) {
      applyRow(headers);
    }
    rowsAsArrays.forEach(applyRow);

    const renderRow = (row: unknown[], rowIndex: number, spec: ColorSpec) => {
      return row
        .map((value, columnIndex) => {
          const text = formatCell(value);
          const columnAlign = align[columnIndex] ?? 'left';
          const padded = pad(text, widths[columnIndex] + padding, columnAlign);
          return applySpec(padded, spec, this.capabilities);
        })
        .join('');
    };

    const output: string[] = [];

    if (headers.length) {
      output.push(renderRow(headers, -1, this.theme.data.tableHeader));
      output.push(this.formatSeparator(Math.min(this.capabilities.width, widths.reduce((sum, width) => sum + width + padding, 0)), 'dashed'));
    }

    rowsAsArrays.forEach((row, index) => {
      const spec = options.highlightRow === index ? this.theme.data.highlight : this.theme.data.tableCell;
      output.push(renderRow(row, index, spec));
    });

    return output.join('\n');
  }

  private formatProgress(current: number, total: number, message?: string): string {
    const normalizedCurrent = Math.max(0, Math.min(current, total));
    const percentage = total === 0 ? 0 : Math.round((normalizedCurrent / total) * 100);
    const barWidth = Math.min(this.capabilities.width - 15, 40);
    const filled = Math.round((percentage / 100) * barWidth);
    const empty = barWidth - filled;

    const bar = `${unicodeOrFallback(this.capabilities, '█', '#').repeat(filled)}${unicodeOrFallback(this.capabilities, '░', '-').repeat(empty)}`;
    const base = `[${bar}] ${percentage.toString().padStart(3, ' ')}%`;

    const prefix = message ? `${message} ` : '';
    return `${prefix}${applySpec(base, this.theme.interactive.feedback, this.capabilities)}`;
  }

  private formatHighlight(text: string, pattern: string | RegExp): string {
    const regex = typeof pattern === 'string'
      ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      : pattern;

    return text.replace(regex, match => applySpec(match, this.theme.data.highlight, this.capabilities));
  }

  private formatCode(snippet: string, language: string): string {
    const header = language ? `(${language}) ` : '';
    return applySpec(`${header}${snippet}`, this.theme.data.code, this.capabilities);
  }

  private formatSelection(text: string, isSelected: boolean): string {
    return isSelected
      ? applySpec(text, this.theme.interactive.selection, this.capabilities)
      : applySpec(text, this.theme.ui.menu, this.capabilities);
  }

  private formatNavigation(direction: 'up' | 'down' | 'left' | 'right'): string {
    const arrows: Record<typeof direction, string> = {
      up: unicodeOrFallback(this.capabilities, '↑', '^'),
      down: unicodeOrFallback(this.capabilities, '↓', 'v'),
      left: unicodeOrFallback(this.capabilities, '←', '<'),
      right: unicodeOrFallback(this.capabilities, '→', '>')
    };
    return applySpec(arrows[direction], this.theme.interactive.navigation, this.capabilities);
  }

  private formatFeedback(type: 'loading' | 'thinking' | 'processing', message?: string): string {
    const symbols: Record<typeof type, string> = {
      loading: unicodeOrFallback(this.capabilities, '⏳', '..'),
      thinking: unicodeOrFallback(this.capabilities, '🤔', '?'),
      processing: unicodeOrFallback(this.capabilities, '⚙️', '*')
    };
    const base = `${symbols[type]}${message ? ` ${message}` : ''}`;
    return applySpec(base, this.theme.interactive.feedback, this.capabilities);
  }

  private formatSystem(kind: keyof TerminalTheme['system'], value: string): string {
    return applySpec(value, this.theme.system[kind], this.capabilities);
  }

  private static mergeTheme(theme: Partial<TerminalTheme>): TerminalTheme {
    const merged: TerminalTheme = JSON.parse(JSON.stringify(DEFAULT_THEME));

    const apply = (source: any, patch: any) => {
      if (!patch) return;
      for (const key of Object.keys(patch)) {
        if (patch[key] && typeof patch[key] === 'object' && !Array.isArray(patch[key])) {
          apply(source[key], patch[key]);
        } else {
          source[key] = patch[key];
        }
      }
    };

    apply(merged, theme);
    return merged;
  }

  private static detectUnicode(): boolean {
    if (process.platform !== 'win32') {
      return true;
    }
    return Boolean(process.env.TERM_PROGRAM === 'vscode' || process.env.WT_SESSION);
  }

  static detectCapabilities(): TerminalCapabilities {
    const supportsColor = Boolean(chalk.supportsColor && chalk.supportsColor.hasBasic);
    const supports256Colors = Boolean(chalk.supportsColor && chalk.supportsColor.has256);
    const supportsTrueColor = Boolean(chalk.supportsColor && chalk.supportsColor.has16m);
    const supportsStyles = supportsColor;

    return {
      supportsColor,
      supports256Colors,
      supportsTrueColor,
      supportsStyles,
      supportsUnicode: this.detectUnicode(),
      width: process.stdout?.columns ?? 80,
      height: process.stdout?.rows ?? 24,
      isInteractive: Boolean(process.stdout?.isTTY),
      platform: process.platform === 'win32' ? 'windows' : 'unix'
    };
  }

  static withFallback(text: string, fallback: string, capabilities?: TerminalCapabilities): string {
    const caps = capabilities ?? this.detectCapabilities();
    return caps.supportsColor || caps.supportsUnicode ? text : fallback;
  }
}

export const createFormatter = (theme: Partial<TerminalTheme> = {}, capabilities?: TerminalCapabilities) =>
  new TerminalFormatter(theme, capabilities);

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return inspect(value, { depth: 2 });
}


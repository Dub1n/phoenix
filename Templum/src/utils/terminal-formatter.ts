import chalk from 'chalk';
import { inspect } from 'util';
import { createTemplumError } from '../types/templum-types';
import { TypeAssertions, TypeGuards, TypeValidators } from './type-guards';

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
type PaletteTone = 'primary' | 'secondary' | 'accent' | 'muted';

export const TERMINAL_SEPARATOR_STYLES = ['solid', 'dashed', 'double'] as const;
export type TerminalSeparatorStyle = typeof TERMINAL_SEPARATOR_STYLES[number];

export const TERMINAL_FORMATTER_SPACING = {
  /** Default left/right padding applied by display/window helpers */
  defaultPadding: 2,
  /** Total visual border width (left + right) reserved when drawing windows */
  borderWidth: 2,
  /** Preferred maximum separator length before clamping to terminal width */
  separatorLength: 60,
  /** Margin reserved from terminal width when computing separators */
  separatorMargin: 4,
  /** Recommended minimum terminal width before wrapping content */
  minTerminalWidth: 40,
  /** Recommended maximum terminal width for deterministic snapshots */
  maxTerminalWidth: 120
} as const;

export const getFormatterSeparatorLength = (): number => TERMINAL_FORMATTER_SPACING.separatorLength;

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

export interface FormatterCacheStats {
  entries: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export interface FormatterFactoryOptions {
  theme: Partial<TerminalTheme>;
  capabilities: TerminalCapabilities;
}

export type FormatterFactory = (options: FormatterFactoryOptions) => TerminalFormatter;

export interface ConfigureFormatterOptions {
  defaultTheme?: Partial<TerminalTheme> | (() => Partial<TerminalTheme>);
  capabilitiesProvider?: () => TerminalCapabilities;
  factory?: FormatterFactory;
}

const ALLOWED_MODIFIERS: readonly Modifier[] = ['bold', 'dim', 'italic', 'underline', 'inverse'] as const;

const isAllowedModifier = (value: unknown): value is Modifier =>
  TypeGuards.isString(value) && (ALLOWED_MODIFIERS as readonly string[]).includes(value);

const isColorSpec = (value: unknown): value is ColorSpec => TypeGuards.isPlainObject(value);

const STATUS_GLYPHS: Record<keyof TerminalTheme['status'], { unicode: string; fallback: string }> = {
  success: { unicode: '✔', fallback: '[OK]' },
  error: { unicode: '✖', fallback: '[ERROR]' },
  warning: { unicode: '⚠', fallback: '[WARN]' },
  info: { unicode: 'ℹ', fallback: '[INFO]' },
  debug: { unicode: '…', fallback: '[DEBUG]' }
};

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

function sanitizeColorSpec(spec: ColorSpec, path: string): ColorSpec {
  if (!TypeGuards.isPlainObject(spec)) {
    throw createTemplumError(
      `Terminal theme segment '${path}' must be a plain object`,
      'TERMINAL_FORMATTER_INVALID_THEME',
      'validation',
      { path },
    );
  }

  const sanitized: ColorSpec = { ...spec };

  if (sanitized.fg !== undefined && !TypeGuards.isNonEmptyString(sanitized.fg)) {
    throw createTemplumError(
      `Terminal theme field '${path}.fg' must be a non-empty string`,
      'TERMINAL_FORMATTER_INVALID_THEME',
      'validation',
      { path, field: 'fg' },
    );
  }

  if (sanitized.bg !== undefined && !TypeGuards.isNonEmptyString(sanitized.bg)) {
    throw createTemplumError(
      `Terminal theme field '${path}.bg' must be a non-empty string`,
      'TERMINAL_FORMATTER_INVALID_THEME',
      'validation',
      { path, field: 'bg' },
    );
  }

  if (sanitized.modifiers !== undefined) {
    try {
      TypeAssertions.assertWithConfidence(
        sanitized.modifiers,
        (value): value is Modifier[] => TypeValidators.isArrayOf(value, isAllowedModifier),
        `Invalid terminal theme modifiers for ${path}`,
      );
    } catch (error) {
      throw createTemplumError(
        `Terminal theme modifiers for ${path} must be an array of supported values`,
        'TERMINAL_FORMATTER_INVALID_THEME',
        'validation',
        { path: `${path}.modifiers` },
      );
    }

    sanitized.modifiers = [...sanitized.modifiers];
  }

  return sanitized;
}

export class TerminalFormatter {
  private static readonly MAX_CACHE_SIZE = 200;
  private readonly capabilities: TerminalCapabilities;
  private readonly theme: TerminalTheme;
  private readonly cache = new Map<string, string>();
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(theme: Partial<TerminalTheme> = {}, capabilities?: TerminalCapabilities) {
    const resolvedCapabilities = capabilities ?? TerminalFormatter.detectCapabilities();
    this.capabilities = TerminalFormatter.validateCapabilities(resolvedCapabilities);
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
    separator: (
      length: number = getFormatterSeparatorLength(),
      style: TerminalSeparatorStyle = 'solid'
    ) => this.formatSeparator(length, style),
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

  readonly text = {
    muted: (message: string) =>
      this.formatCached(
        `text:muted:${message}`,
        () => applySpec(message, this.theme.muted, this.capabilities)
      ),
    plain: (message: string) => message
  };

  readonly palette = {
    primary: (text: string) => this.formatPalette('primary', text),
    secondary: (text: string) => this.formatPalette('secondary', text),
    accent: (text: string) => this.formatPalette('accent', text),
    muted: (text: string) => this.formatPalette('muted', text)
  };

  getCapabilities(): TerminalCapabilities {
    return { ...this.capabilities };
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  getCacheStats(): FormatterCacheStats {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total === 0 ? 0 : this.cacheHits / total;

    return {
      entries: this.cache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate
    };
  }

  getTheme(): TerminalTheme {
    return cloneThemeOverrides(this.theme) as TerminalTheme;
  }

  formatWithSpec(spec: ColorSpec | undefined, text: string): string;
  formatWithSpec(text: string, spec: ColorSpec | undefined): string;
  formatWithSpec(
    first: string | ColorSpec | undefined,
    second: string | ColorSpec | undefined,
  ): string {
    const text = typeof first === 'string' ? first : typeof second === 'string' ? second : '';
    const spec = (typeof first === 'object' ? first :
      typeof second === 'object' ? second : undefined) as ColorSpec | undefined;

    if (!spec) {
      return text;
    }

    return applySpec(text, spec, this.capabilities);
  }

  private formatStatus(kind: keyof TerminalTheme['status'], message: string): string {
    const spec = this.theme.status[kind];
    const glyph = unicodeOrFallback(this.capabilities, STATUS_GLYPHS[kind].unicode, STATUS_GLYPHS[kind].fallback);
    const text = glyph ? `${glyph} ${message}` : message;

    return this.formatCached(
      `status:${kind}:${message}`,
      () => applySpec(text, spec, this.capabilities)
    );
  }

  private formatHeader(message: string, level: 1 | 2 | 3): string {
    const spec = this.theme.ui.header[level - 1];
    const prefix = unicodeOrFallback(this.capabilities, '❯', '>');
    return this.formatCached(
      `ui:header:${level}:${message}`,
      () => applySpec(`${prefix} ${message}`, spec, this.capabilities)
    );
  }

  private formatSeparator(
    length: number = getFormatterSeparatorLength(),
    style: TerminalSeparatorStyle = 'solid'
  ): string {
    const palette: Record<TerminalSeparatorStyle, string> = {
      solid: unicodeOrFallback(this.capabilities, '─', '-'),
      dashed: unicodeOrFallback(this.capabilities, '╌', '-'),
      double: unicodeOrFallback(this.capabilities, '═', '=')
    };

    const maxLength = Math.max(1, this.capabilities.width - TERMINAL_FORMATTER_SPACING.separatorMargin);
    const effectiveLength = Math.max(1, Math.min(length, maxLength));
    const key = `ui:separator:${style}:${effectiveLength}`;

    return this.formatCached(
      key,
      () => {
        const separator = palette[style].repeat(effectiveLength);
        return applySpec(separator, this.theme.ui.separator, this.capabilities);
      }
    );
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
    return this.formatCached(
      `ui:prompt:${type}:${question}`,
      () => applySpec(`${question} ${suffix}`, this.theme.ui.prompt, this.capabilities)
    );
  }

  private formatBreadcrumb(segments: string[]): string {
    const separator = unicodeOrFallback(this.capabilities, ' › ', ' > ');
    return this.formatCached(
      `ui:breadcrumb:${segments.join('>')}`,
      () =>
        segments
          .map(segment => applySpec(segment, this.theme.ui.breadcrumb, this.capabilities))
          .join(separator)
    );
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
    return this.formatCached(
      `data:code:${language}:${snippet}`,
      () => applySpec(`${header}${snippet}`, this.theme.data.code, this.capabilities),
      snippet.length <= 120
    );
  }

  private formatSelection(text: string, isSelected: boolean): string {
    const key = `interactive:selection:${isSelected}:${text}`;

    return this.formatCached(
      key,
      () => (isSelected
        ? applySpec(text, this.theme.interactive.selection, this.capabilities)
        : applySpec(text, this.theme.ui.menu, this.capabilities)
      ),
      text.length <= 120
    );
  }

  private formatNavigation(direction: 'up' | 'down' | 'left' | 'right'): string {
    const arrows: Record<typeof direction, string> = {
      up: unicodeOrFallback(this.capabilities, '↑', '^'),
      down: unicodeOrFallback(this.capabilities, '↓', 'v'),
      left: unicodeOrFallback(this.capabilities, '←', '<'),
      right: unicodeOrFallback(this.capabilities, '→', '>')
    };
    return this.formatCached(
      `interactive:navigation:${direction}`,
      () => applySpec(arrows[direction], this.theme.interactive.navigation, this.capabilities)
    );
  }

  private formatFeedback(type: 'loading' | 'thinking' | 'processing', message?: string): string {
    const symbols: Record<typeof type, string> = {
      loading: unicodeOrFallback(this.capabilities, '⏳', '..'),
      thinking: unicodeOrFallback(this.capabilities, '🤔', '?'),
      processing: unicodeOrFallback(this.capabilities, '⚙️', '*')
    };
    const base = `${symbols[type]}${message ? ` ${message}` : ''}`;
    return this.formatCached(
      `interactive:feedback:${type}:${message ?? ''}`,
      () => applySpec(base, this.theme.interactive.feedback, this.capabilities),
      (message ?? '').length <= 120
    );
  }

  private formatSystem(kind: keyof TerminalTheme['system'], value: string): string {
    return this.formatCached(
      `system:${kind}:${value}`,
      () => applySpec(value, this.theme.system[kind], this.capabilities),
      value.length <= 120
    );
  }

  private static validateCapabilities(capabilities: TerminalCapabilities): TerminalCapabilities {
    const booleanFields: Array<keyof TerminalCapabilities> = [
      'supportsColor',
      'supports256Colors',
      'supportsTrueColor',
      'supportsStyles',
      'supportsUnicode',
      'isInteractive',
    ];

    const capabilityRecord = capabilities as unknown as Record<string, unknown>;

    for (const field of booleanFields) {
      if (!TypeGuards.isBoolean(capabilityRecord[field])) {
        throw createTemplumError(
          `Terminal capability '${String(field)}' must be boolean`,
          'TERMINAL_FORMATTER_INVALID_CAPABILITIES',
          'validation',
          { field }
        );
      }
    }

    if (!TypeGuards.isPositiveNumber(capabilities.width)) {
      throw createTemplumError(
        'Terminal capability width must be a positive number',
        'TERMINAL_FORMATTER_INVALID_CAPABILITIES',
        'validation',
        { field: 'width', value: capabilities.width }
      );
    }

    if (!TypeGuards.isPositiveNumber(capabilities.height)) {
      throw createTemplumError(
        'Terminal capability height must be a positive number',
        'TERMINAL_FORMATTER_INVALID_CAPABILITIES',
        'validation',
        { field: 'height', value: capabilities.height }
      );
    }

    if (!['windows', 'unix', 'browser'].includes(capabilities.platform)) {
      throw createTemplumError(
        'Terminal capability platform must be one of windows, unix, or browser',
        'TERMINAL_FORMATTER_INVALID_CAPABILITIES',
        'validation',
        { field: 'platform', value: capabilities.platform }
      );
    }

    return capabilities;
  }

  private static mergeTheme(theme: Partial<TerminalTheme>): TerminalTheme {
    const merged: TerminalTheme = JSON.parse(JSON.stringify(DEFAULT_THEME));

    const apply = (source: any, patch: unknown) => {
      if (!TypeGuards.isPlainObject(patch)) {
        return;
      }

      for (const key of Object.keys(patch)) {
        const value = (patch as Record<string, unknown>)[key];
        if (TypeGuards.isPlainObject(value)) {
          if (!TypeGuards.isObject(source[key])) {
            source[key] = {};
          }
          apply(source[key], value);
        } else {
          source[key] = value;
        }
      }
    };

    apply(merged, theme);
    return TerminalFormatter.sanitiseTheme(merged);
  }

  private static sanitiseTheme(theme: TerminalTheme): TerminalTheme {
    const sanitize = (spec: ColorSpec, path: string): ColorSpec => sanitizeColorSpec(spec, path);

    const headerInput: unknown = theme.ui.header;
    if (!TypeValidators.isArrayOf(headerInput, isColorSpec)) {
      throw createTemplumError(
        'Terminal theme ui.header must be an array of colour specifications',
        'TERMINAL_FORMATTER_INVALID_THEME',
        'validation',
        { path: 'ui.header' },
      );
    }

    if (headerInput.length !== 3) {
      throw createTemplumError(
        'Terminal theme ui.header must contain exactly three entries',
        'TERMINAL_FORMATTER_INVALID_THEME',
        'validation',
        { path: 'ui.header' },
      );
    }

    const header = headerInput.map((spec, index) => sanitize(spec, `ui.header[${index}]`)) as [ColorSpec, ColorSpec, ColorSpec];

    return {
      status: {
        success: sanitize(theme.status.success, 'status.success'),
        error: sanitize(theme.status.error, 'status.error'),
        warning: sanitize(theme.status.warning, 'status.warning'),
        info: sanitize(theme.status.info, 'status.info'),
        debug: sanitize(theme.status.debug, 'status.debug'),
      },
      ui: {
        header,
        separator: sanitize(theme.ui.separator, 'ui.separator'),
        menu: sanitize(theme.ui.menu, 'ui.menu'),
        menuSelected: sanitize(theme.ui.menuSelected, 'ui.menuSelected'),
        prompt: sanitize(theme.ui.prompt, 'ui.prompt'),
        breadcrumb: sanitize(theme.ui.breadcrumb, 'ui.breadcrumb'),
      },
      data: {
        tableHeader: sanitize(theme.data.tableHeader, 'data.tableHeader'),
        tableCell: sanitize(theme.data.tableCell, 'data.tableCell'),
        highlight: sanitize(theme.data.highlight, 'data.highlight'),
        code: sanitize(theme.data.code, 'data.code'),
      },
      interactive: {
        selection: sanitize(theme.interactive.selection, 'interactive.selection'),
        navigation: sanitize(theme.interactive.navigation, 'interactive.navigation'),
        feedback: sanitize(theme.interactive.feedback, 'interactive.feedback'),
      },
      system: {
        timestamp: sanitize(theme.system.timestamp, 'system.timestamp'),
        path: sanitize(theme.system.path, 'system.path'),
        command: sanitize(theme.system.command, 'system.command'),
        version: sanitize(theme.system.version, 'system.version'),
      },
      muted: sanitize(theme.muted, 'muted'),
    };
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
    if (caps.supportsColor && caps.supportsUnicode) {
      return text;
    }
    return fallback;
  }

  private formatCached(key: string, compute: () => string, cacheable = true): string {
    if (!cacheable) {
      this.cacheMisses++;
      return compute();
    }

    const scopedKey = `${this.cacheKeyPrefix()}:${key}`;

    if (this.cache.has(scopedKey)) {
      this.cacheHits++;
      return this.cache.get(scopedKey)!;
    }

    this.cacheMisses++;
    const value = compute();

    if (this.cache.size >= TerminalFormatter.MAX_CACHE_SIZE) {
      this.evictCacheEntries();
    }

    this.cache.set(scopedKey, value);
    return value;
  }

  private cacheKeyPrefix(): string {
    return `${this.capabilities.supportsColor ? 'color' : 'mono'}-${this.capabilities.supportsUnicode ? 'unicode' : 'ascii'}`;
  }

  private evictCacheEntries(): void {
    const removeCount = Math.ceil(TerminalFormatter.MAX_CACHE_SIZE * 0.1);
    let removed = 0;

    for (const key of this.cache.keys()) {
      this.cache.delete(key);
      removed++;
      if (removed >= removeCount) {
        break;
      }
    }
  }

  private formatPalette(tone: PaletteTone, text: string): string {
    const key = `palette:${tone}:${text}`;

    const resolver = () => {
      switch (tone) {
        case 'primary':
          return applySpec(text, this.theme.ui.menu, this.capabilities);
        case 'secondary':
          return applySpec(text, this.theme.ui.prompt, this.capabilities);
        case 'accent':
          return applySpec(text, this.theme.ui.menuSelected, this.capabilities);
        case 'muted':
        default:
          return applySpec(text, this.theme.muted, this.capabilities);
      }
    };

    return this.formatCached(key, resolver);
  }
}

interface FormatterConfigurationState {
  themeProvider: () => Partial<TerminalTheme>;
  capabilitiesProvider: () => TerminalCapabilities;
  factory?: FormatterFactory;
}

const DEFAULT_THEME_PROVIDER = () => ({} as Partial<TerminalTheme>);
const DEFAULT_CAPABILITIES_PROVIDER = () => TerminalFormatter.detectCapabilities();

const DEFAULT_CONFIGURATION: FormatterConfigurationState = {
  themeProvider: DEFAULT_THEME_PROVIDER,
  capabilitiesProvider: DEFAULT_CAPABILITIES_PROVIDER
};

let formatterConfiguration: FormatterConfigurationState = {
  themeProvider: DEFAULT_CONFIGURATION.themeProvider,
  capabilitiesProvider: DEFAULT_CONFIGURATION.capabilitiesProvider
};

export const configureFormatter = (options: ConfigureFormatterOptions): void => {
  if (!options) {
    return;
  }

  if (options.defaultTheme) {
    const previous = formatterConfiguration.themeProvider;

    if (typeof options.defaultTheme === 'function') {
      const themeFactory = options.defaultTheme;
      formatterConfiguration.themeProvider = () =>
        mergeThemeOverrides(previous(), themeFactory());
    } else {
      const themePatch = options.defaultTheme;
      formatterConfiguration.themeProvider = () =>
        mergeThemeOverrides(previous(), themePatch);
    }
  }

  if (options.capabilitiesProvider) {
    formatterConfiguration.capabilitiesProvider = options.capabilitiesProvider;
  }

  if (options.factory) {
    formatterConfiguration.factory = options.factory;
  }
};

export const resetFormatterConfiguration = (): void => {
  formatterConfiguration = {
    themeProvider: DEFAULT_CONFIGURATION.themeProvider,
    capabilitiesProvider: DEFAULT_CONFIGURATION.capabilitiesProvider
  };
};

export const createFormatter = (theme: Partial<TerminalTheme> = {}, capabilities?: TerminalCapabilities) => {
  const baseTheme = formatterConfiguration.themeProvider();
  const mergedTheme = mergeThemeOverrides(baseTheme, theme);
  const resolvedCapabilities = capabilities ?? formatterConfiguration.capabilitiesProvider();

  if (formatterConfiguration.factory) {
    return formatterConfiguration.factory({
      theme: mergedTheme,
      capabilities: resolvedCapabilities
    });
  }

  return new TerminalFormatter(mergedTheme, resolvedCapabilities);
};

function mergeThemeOverrides(
  base: Partial<TerminalTheme>,
  overrides?: Partial<TerminalTheme>
): Partial<TerminalTheme> {
  const clonedBase = cloneThemeOverrides(base);
  if (!overrides) {
    return clonedBase;
  }
  return mergeOverrideInto(clonedBase, overrides) as Partial<TerminalTheme>;
}

function cloneThemeOverrides(theme: Partial<TerminalTheme>): Partial<TerminalTheme> {
  if (!TypeGuards.isPlainObject(theme)) {
    return {};
  }
  return mergeOverrideInto({}, theme) as Partial<TerminalTheme>;
}

function mergeOverrideInto(target: Record<string, unknown>, patch: unknown): Record<string, unknown> {
  if (!TypeGuards.isPlainObject(patch)) {
    return target;
  }

  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    if (TypeGuards.isPlainObject(value)) {
      const current = TypeGuards.isPlainObject(target[key]) ? (target[key] as Record<string, unknown>) : {};
      target[key] = mergeOverrideInto({ ...current }, value);
    } else if (Array.isArray(value)) {
      target[key] = value.map(item =>
        TypeGuards.isPlainObject(item) ? mergeOverrideInto({}, item) : item
      );
    } else if (typeof value !== 'undefined') {
      target[key] = value;
    }
  }

  return target;
}

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

import { createLogger, Logger, LogLevel } from './logger';
import { ErrorHandler } from './error-handler';

export type ChainMode = 'terminal' | 'plain';

export interface ChainOptions {
  mode?: ChainMode;
  ellipsis?: string;
  trim?: 'none' | 'start' | 'end' | 'both';
}

export interface ChainResult {
  value: string;
  truncated: boolean;
  wrapped: boolean;
  width: number;
}

export interface StringChain {
  truncate(maxWidth: number, ellipsis?: string): StringChain;
  pad(width: number, alignment?: 'left' | 'right' | 'center', fill?: string): StringChain;
  wrap(width: number, options?: { hard?: boolean; indent?: number }): StringChain;
  convertCase(style: 'upper' | 'lower' | 'title' | 'sentence'): StringChain;
  collapseWhitespace(mode?: 'spaces' | 'all'): StringChain;
  ensureSuffix(suffix: string): StringChain;
  value(): string;
  inspect(): ChainResult;
}

export interface StringUtilsApi {
  chain(input: string, options?: ChainOptions): StringChain;
  truncate(input: string, width: number, ellipsis?: string): string;
  pad(input: string, width: number, alignment?: 'left' | 'right' | 'center', fill?: string): string;
  wrap(input: string, width: number, options?: { hard?: boolean; indent?: number }): string[];
}

interface WrapComputationOptions {
  hard?: boolean;
  indent?: number;
}

interface ChainInternalState {
  value: string;
  truncated: boolean;
  wrapped: boolean;
}

const ANSI_REGEX = /\u001b\[[0-9;]*[a-zA-Z]/g;

const DEFAULT_OPTIONS: Required<ChainOptions> = {
  mode: 'terminal',
  ellipsis: '…',
  trim: 'none'
};

function ensurePositiveWidth(width: number, context: string): number {
  if (!Number.isFinite(width) || width <= 0) {
    throw ErrorHandler.handle(new Error(`Invalid width: ${width}`), context, { width });
  }
  return width;
}

function normalizeFill(fill?: string): string {
  if (!fill) {
    return ' ';
  }
  return fill.length === 1 ? fill : fill.charAt(0);
}

function stripAnsi(value: string): string {
  return value.replace(ANSI_REGEX, '');
}

function isZeroWidth(codePoint: number): boolean {
  return (
    (codePoint >= 0x0300 && codePoint <= 0x036F) ||
    (codePoint >= 0x1AB0 && codePoint <= 0x1AFF) ||
    (codePoint >= 0x1DC0 && codePoint <= 0x1DFF) ||
    (codePoint >= 0x20D0 && codePoint <= 0x20FF) ||
    (codePoint >= 0xFE20 && codePoint <= 0xFE2F) ||
    codePoint === 0x200B ||
    codePoint === 0x200C ||
    codePoint === 0x200D ||
    codePoint === 0xFEFF
  );
}

function isWide(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115F) ||
    (codePoint >= 0x2329 && codePoint <= 0x232A) ||
    (codePoint >= 0x2E80 && codePoint <= 0xA4CF) ||
    (codePoint >= 0xAC00 && codePoint <= 0xD7A3) ||
    (codePoint >= 0xF900 && codePoint <= 0xFAFF) ||
    (codePoint >= 0xFE10 && codePoint <= 0xFE6F) ||
    (codePoint >= 0xFF00 && codePoint <= 0xFF60) ||
    (codePoint >= 0xFFE0 && codePoint <= 0xFFE6) ||
    (codePoint >= 0x1F300 && codePoint <= 0x1F64F) ||
    (codePoint >= 0x1F900 && codePoint <= 0x1F9FF) ||
    (codePoint >= 0x20000 && codePoint <= 0x3FFFD)
  );
}

function charWidth(char: string): number {
  const codePoint = char.codePointAt(0);
  if (!codePoint) {
    return 0;
  }
  if (isZeroWidth(codePoint)) {
    return 0;
  }
  if (isWide(codePoint)) {
    return 2;
  }
  return 1;
}

function measureWidth(value: string, mode: ChainMode): number {
  if (!value) {
    return 0;
  }
  const target = mode === 'terminal' ? stripAnsi(value) : value;
  let total = 0;
  for (const char of target) {
    total += charWidth(char);
  }
  return total;
}

function truncateValueToWidth(
  value: string,
  width: number,
  ellipsis: string,
  mode: ChainMode,
  context: string
): { value: string; truncated: boolean; width: number } {
  const validatedWidth = ensurePositiveWidth(width, context);
  const normalizedEllipsis = ellipsis ?? DEFAULT_OPTIONS.ellipsis;
  const ellipsisWidth = measureWidth(normalizedEllipsis, mode);
  if (ellipsisWidth >= validatedWidth) {
    throw ErrorHandler.handle(
      new Error('Ellipsis must be narrower than requested width'),
      context,
      { ellipsis: normalizedEllipsis, width: validatedWidth }
    );
  }

  const currentWidth = measureWidth(value, mode);
  if (currentWidth <= validatedWidth) {
    return { value, truncated: false, width: validatedWidth };
  }

  const targetWidth = validatedWidth - ellipsisWidth;
  let result = '';
  let consumedWidth = 0;
  for (const char of value) {
    const charWidthValue = measureWidth(char, mode);
    if (consumedWidth + charWidthValue > targetWidth) {
      break;
    }
    result += char;
    consumedWidth += charWidthValue;
  }

  return { value: `${result}${normalizedEllipsis}`, truncated: true, width: validatedWidth };
}

function wrapSegments(value: string, width: number, options: WrapComputationOptions, mode: ChainMode): string[] {
  const { hard = false, indent = 0 } = options;
  const indentString = indent > 0 ? ' '.repeat(indent) : '';
  if (value.length === 0) {
    return [indentString ? indentString : ''];
  }

  const rawLines = value.split(/\r?\n/);
  const result: string[] = [];

  for (const rawLine of rawLines) {
    if (rawLine.length === 0) {
      result.push(indentString);
      continue;
    }

    if (hard) {
      let current = '';
      let currentWidth = 0;
      for (const char of rawLine) {
        const charW = measureWidth(char, mode);
        if (char === '\r') {
          continue;
        }
        if (char === '\n') {
          if (current) {
            result.push(`${indentString}${current}`);
            current = '';
            currentWidth = 0;
          }
          continue;
        }
        if (charW > width) {
          result.push(`${indentString}${char}`);
          current = '';
          currentWidth = 0;
          continue;
        }
        if (currentWidth + charW > width && current) {
          result.push(`${indentString}${current}`);
          current = char;
          currentWidth = charW;
          continue;
        }
        current += char;
        currentWidth += charW;
      }
      if (current) {
        result.push(`${indentString}${current}`);
      }
      continue;
    }

    const words = rawLine.trim().length === 0 ? [] : rawLine.trim().split(/\s+/);
    if (words.length === 0) {
      result.push(`${indentString}`);
      continue;
    }

    let currentLine = '';
    let currentWidth = 0;
    for (const word of words) {
      const wordWidth = measureWidth(word, mode);
      const separatorWidth = currentLine ? 1 : 0;
      if (currentLine && currentWidth + separatorWidth + wordWidth > width) {
        result.push(`${indentString}${currentLine}`);
        currentLine = word;
        currentWidth = wordWidth;
      } else {
        if (currentLine) {
          currentLine = `${currentLine} ${word}`;
          currentWidth += separatorWidth + wordWidth;
        } else {
          currentLine = word;
          currentWidth = wordWidth;
        }
      }
    }
    if (currentLine) {
      result.push(`${indentString}${currentLine}`);
    }
  }

  return result.length > 0 ? result : [indentString];
}

function applyTrim(value: string, trim: ChainOptions['trim']): string {
  switch (trim) {
    case 'start':
      return value.trimStart();
    case 'end':
      return value.trimEnd();
    case 'both':
      return value.trim();
    default:
      return value;
  }
}

class ChainBuilder implements StringChain {
  private state: ChainInternalState;
  private readonly options: Required<ChainOptions>;
  private readonly logger: Logger;

  constructor(input: string, options: Required<ChainOptions>, logger: Logger) {
    this.logger = logger;
    this.options = options;
    this.state = {
      value: applyTrim(input, options.trim),
      truncated: false,
      wrapped: false
    };
  }

  truncate(maxWidth: number, ellipsis?: string): StringChain {
    const context = 'string-utils.truncate';
    const marker = ellipsis ?? this.options.ellipsis;
    const currentWidth = this.currentWidth();
    const { value, truncated, width } = truncateValueToWidth(
      this.state.value,
      maxWidth,
      marker,
      this.options.mode,
      context
    );

    if (!truncated) {
      this.logger.debug('truncate skipped; already within bounds', { width, currentWidth });
      this.state.truncated = this.state.truncated || false;
      return this;
    }

    this.state.value = value;
    this.state.truncated = true;
    const newWidth = measureWidth(this.state.value, this.options.mode);
    const reductionRatio = (currentWidth - newWidth) / currentWidth;
    if (reductionRatio > 0.3) {
      this.logger.warn('string truncated beyond threshold', { currentWidth, targetWidth: width, reductionRatio });
    } else {
      this.logger.debug('string truncated', { currentWidth, targetWidth: width });
    }
    return this;
  }

  pad(width: number, alignment: 'left' | 'right' | 'center' = 'right', fill?: string): StringChain {
    const context = 'string-utils.pad';
    const targetWidth = ensurePositiveWidth(width, context);
    const fillChar = normalizeFill(fill);
    const currentWidth = this.currentWidth();
    if (currentWidth >= targetWidth) {
      return this;
    }

    const difference = targetWidth - currentWidth;
    if (alignment === 'left') {
      this.state.value = `${fillChar.repeat(difference)}${this.state.value}`;
      return this;
    }
    if (alignment === 'center') {
      const left = Math.floor(difference / 2);
      const right = difference - left;
      this.state.value = `${fillChar.repeat(left)}${this.state.value}${fillChar.repeat(right)}`;
      return this;
    }

    this.state.value = `${this.state.value}${fillChar.repeat(difference)}`;
    return this;
  }

  wrap(width: number, options?: { hard?: boolean; indent?: number }): StringChain {
    const context = 'string-utils.wrap';
    const targetWidth = ensurePositiveWidth(width, context);
    const indent = options?.indent ?? 0;
    if (indent < 0) {
      throw ErrorHandler.handle(new Error('Indent must be zero or positive'), context, { indent });
    }

    const segments = wrapSegments(this.state.value, targetWidth, { hard: options?.hard, indent }, this.options.mode);
    this.state.value = segments.join('\n');
    this.state.wrapped = segments.length > 1 || this.state.value.includes('\n');
    this.logger.debug('string wrapped', { width: targetWidth, segments: segments.length, hard: Boolean(options?.hard) });
    return this;
  }

  convertCase(style: 'upper' | 'lower' | 'title' | 'sentence'): StringChain {
    switch (style) {
      case 'upper':
        this.state.value = this.state.value.toUpperCase();
        break;
      case 'lower':
        this.state.value = this.state.value.toLowerCase();
        break;
      case 'title':
        this.state.value = this.state.value
          .split(/\s+/)
          .map(token => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
          .join(' ');
        break;
      case 'sentence': {
        const trimmed = this.state.value.trim();
        if (trimmed.length === 0) {
          return this;
        }
        this.state.value = `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
        break;
      }
      default:
        throw ErrorHandler.handle(new Error(`Unsupported case conversion: ${style}`), 'string-utils.convertCase', { style });
    }
    return this;
  }

  collapseWhitespace(mode: 'spaces' | 'all' = 'spaces'): StringChain {
    if (mode === 'spaces') {
      const segments = this.state.value.split(/\r?\n/);
      this.state.value = segments
        .map(segment => segment.replace(/[ \t]+/g, ' ').trimEnd())
        .join('\n');
      return this;
    }

    this.state.value = this.state.value.replace(/\s+/g, ' ').trim();
    return this;
  }

  ensureSuffix(suffix: string): StringChain {
    if (!suffix) {
      return this;
    }
    if (!this.state.value.endsWith(suffix)) {
      this.state.value = `${this.state.value}${suffix}`;
    }
    return this;
  }

  value(): string {
    return this.state.value;
  }

  inspect(): ChainResult {
    return {
      value: this.state.value,
      truncated: this.state.truncated,
      wrapped: this.state.wrapped,
      width: this.computeMaxLineWidth()
    };
  }

  private currentWidth(): number {
    return this.computeMaxLineWidth();
  }

  private computeMaxLineWidth(): number {
    const segments = this.state.value.split(/\n/);
    return segments.reduce((max, segment) => Math.max(max, measureWidth(segment, this.options.mode)), 0);
  }
}

class StringUtilsClass implements StringUtilsApi {
  private readonly logger: Logger = createLogger('string-utils', { level: LogLevel.ERROR });

  chain(input: string, options?: ChainOptions): StringChain {
    const resolved: Required<ChainOptions> = {
      mode: options?.mode ?? DEFAULT_OPTIONS.mode,
      ellipsis: options?.ellipsis ?? DEFAULT_OPTIONS.ellipsis,
      trim: options?.trim ?? DEFAULT_OPTIONS.trim
    };
    return new ChainBuilder(input, resolved, this.logger);
  }

  truncate(input: string, width: number, ellipsis?: string): string {
    return this.chain(input).truncate(width, ellipsis).value();
  }

  pad(input: string, width: number, alignment: 'left' | 'right' | 'center' = 'right', fill?: string): string {
    return this.chain(input).pad(width, alignment, fill).value();
  }

  wrap(input: string, width: number, options?: { hard?: boolean; indent?: number }): string[] {
    const resolvedWidth = ensurePositiveWidth(width, 'string-utils.wrap');
    const segments = wrapSegments(input, resolvedWidth, options ?? {}, DEFAULT_OPTIONS.mode);
    this.logger.debug('wrap helper invoked', { width: resolvedWidth, segments: segments.length, hard: Boolean(options?.hard) });
    return segments;
  }
}

export const StringWidthUtils = {
  getDisplayWidth(value: string, mode: ChainMode = 'terminal'): number {
    return measureWidth(value, mode);
  },
  stripAnsi(value: string): string {
    return stripAnsi(value);
  },
  truncateToWidth(
    value: string,
    maxWidth: number,
    ellipsis: string = DEFAULT_OPTIONS.ellipsis,
    mode: ChainMode = 'terminal'
  ): string {
    return truncateValueToWidth(value, maxWidth, ellipsis, mode, 'string-utils.width-utils.truncateToWidth').value;
  }
};

export const StringUtils: StringUtilsApi = new StringUtilsClass();
export const stringUtils = StringUtils;

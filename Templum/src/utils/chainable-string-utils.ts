import { performance } from 'perf_hooks';

export interface StringProcessorConfig {
  enablePerformanceTracking?: boolean;
  confidenceThreshold?: number;
  cacheResults?: boolean;
  maxOperations?: number;
}

export interface ProcessingOperation {
  type: 'truncate' | 'pad' | 'wrap' | 'case' | 'validate';
  input: string;
  output: string;
  confidence: number;
  duration: number;
  parameters: Record<string, unknown>;
}

export interface PerformanceMetrics {
  totalDuration: number;
  operationCount: number;
  cacheHits: number;
  averageConfidence: number;
}

export interface ProcessingResult {
  value: string;
  confidence: number;
  operations: ProcessingOperation[];
  performanceMetrics: PerformanceMetrics;
  warnings: string[];
  cached: boolean;
}

export interface WrapOptions {
  width?: number;
  preserveWords?: boolean;
  delimiter?: string;
}

const DEFAULT_CONFIG: Required<StringProcessorConfig> = {
  enablePerformanceTracking: true,
  confidenceThreshold: 0.85,
  cacheResults: true,
  maxOperations: 20
};

const RESULT_CACHE = new Map<string, ProcessingResult>();

export class StringProcessor {
  private readonly operations: ProcessingOperation[] = [];
  private currentValue: string;
  private readonly config: Required<StringProcessorConfig>;
  private readonly startTime: number;
  private cacheHits = 0;
  private warnings: string[] = [];
  private readonly initialValue: string;

  constructor(input: string, config: StringProcessorConfig = {}) {
    this.currentValue = input;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = performance.now();
    this.initialValue = input;
  }

  truncate(maxLength: number, ellipsis = '...'): this {
    const operationStart = performance.now();
    const original = this.currentValue;
    let confidence = 1;

    if (original.length > maxLength) {
      const targetLength = Math.max(0, maxLength - ellipsis.length);
      this.currentValue = `${original.slice(0, targetLength)}${ellipsis}`;
      confidence = Math.min(1, maxLength / original.length);
    }

    this.addOperation({
      type: 'truncate',
      input: original,
      output: this.currentValue,
      confidence,
      duration: this.measure(operationStart),
      parameters: { maxLength, ellipsis }
    });

    return this;
  }

  pad(targetLength: number, direction: 'left' | 'right' | 'both' = 'right', char = ' '): this {
    const operationStart = performance.now();
    const original = this.currentValue;

    if (targetLength <= this.currentValue.length) {
      this.addOperation({
        type: 'pad',
        input: original,
        output: original,
        confidence: 1,
        duration: this.measure(operationStart),
        parameters: { targetLength, direction, char }
      });
      return this;
    }

    const paddingNeeded = targetLength - this.currentValue.length;
    const repeated = char.repeat(paddingNeeded);
    switch (direction) {
      case 'left':
        this.currentValue = `${repeated}${this.currentValue}`;
        break;
      case 'both': {
        const left = Math.floor(paddingNeeded / 2);
        const right = paddingNeeded - left;
        this.currentValue = `${char.repeat(left)}${this.currentValue}${char.repeat(right)}`;
        break;
      }
      default:
        this.currentValue = `${this.currentValue}${repeated}`;
    }

    const confidence = Math.min(1, targetLength / (this.currentValue.length || 1));

    this.addOperation({
      type: 'pad',
      input: original,
      output: this.currentValue,
      confidence,
      duration: this.measure(operationStart),
      parameters: { targetLength, direction, char }
    });

    return this;
  }

  wrap(options: WrapOptions = {}): this {
    const { width = 80, preserveWords = true, delimiter = '\n' } = options;
    const operationStart = performance.now();
    const original = this.currentValue;

    if (width <= 0) {
      this.addOperation({
        type: 'wrap',
        input: original,
        output: original,
        confidence: 1,
        duration: this.measure(operationStart),
        parameters: options
      });
      return this;
    }

    const words = original.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (candidate.length <= width) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        if (preserveWords || word.length <= width) {
          currentLine = word;
        } else {
          const fragments = word.match(new RegExp(`.{1,${width}}`, 'g')) || [];
          lines.push(...fragments.slice(0, -1));
          currentLine = fragments[fragments.length - 1] ?? '';
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    this.currentValue = lines.join(delimiter);

    this.addOperation({
      type: 'wrap',
      input: original,
      output: this.currentValue,
      confidence: Math.min(1, width / Math.max(original.length, 1)),
      duration: this.measure(operationStart),
      parameters: options
    });

    return this;
  }

  toUpperCase(): this {
    return this.applyCaseTransformation('uppercase');
  }

  toLowerCase(): this {
    return this.applyCaseTransformation('lowercase');
  }

  toTitleCase(): this {
    const operationStart = performance.now();
    const original = this.currentValue;
    this.currentValue = original.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    this.addOperation({
      type: 'case',
      input: original,
      output: this.currentValue,
      confidence: 1,
      duration: this.measure(operationStart),
      parameters: { mode: 'title' }
    });

    return this;
  }

  validate(validator: (value: string) => boolean, issue?: string): this {
    const operationStart = performance.now();
    const original = this.currentValue;
    const valid = validator(original);

    if (!valid) {
      this.warnings.push(issue ?? 'Validation check failed');
    }

    this.addOperation({
      type: 'validate',
      input: original,
      output: original,
      confidence: valid ? 1 : 0.5,
      duration: this.measure(operationStart),
      parameters: { issue }
    });

    return this;
  }

  result(): ProcessingResult {
    const cacheKey = this.cacheKey();

    if (this.config.cacheResults && RESULT_CACHE.has(cacheKey)) {
      const cached = RESULT_CACHE.get(cacheKey)!;
      this.cacheHits += 1;
      return { ...cached, cached: true };
    }

    const duration = this.measure(this.startTime);
    const averageConfidence = this.operations.length
      ? this.operations.reduce((sum, op) => sum + op.confidence, 0) / this.operations.length
      : 1;

    const result: ProcessingResult = {
      value: this.currentValue,
      confidence: averageConfidence,
      operations: [...this.operations],
      performanceMetrics: {
        totalDuration: duration,
        operationCount: this.operations.length,
        cacheHits: this.cacheHits,
        averageConfidence
      },
      warnings: [...this.warnings],
      cached: false
    };

    if (this.config.cacheResults) {
      RESULT_CACHE.set(cacheKey, {
        ...result,
        operations: [...result.operations],
        warnings: [...result.warnings]
      });
    }

    if (this.operations.length > this.config.maxOperations) {
      result.warnings.push('Operation count exceeded configured maximum');
    }

    return result;
  }

  value(): string {
    return this.result().value;
  }

  private applyCaseTransformation(mode: 'uppercase' | 'lowercase'): this {
    const operationStart = performance.now();
    const original = this.currentValue;
    this.currentValue = mode === 'uppercase' ? original.toUpperCase() : original.toLowerCase();

    this.addOperation({
      type: 'case',
      input: original,
      output: this.currentValue,
      confidence: 1,
      duration: this.measure(operationStart),
      parameters: { mode }
    });

    return this;
  }

  private addOperation(operation: ProcessingOperation): void {
    this.operations.push(operation);
  }

  private measure(start: number): number {
    if (!this.config.enablePerformanceTracking) {
      return 0;
    }
    return Math.max(0, performance.now() - start);
  }

  private cacheKey(): string {
    const signature = this.operations
      .map(op => `${op.type}:${JSON.stringify(op.parameters)}`)
      .join('|');
    return JSON.stringify({ initial: this.initialValue, config: this.config, signature });
  }
}

export class StringUtils {
  static process(input: string, config: StringProcessorConfig = {}): StringProcessor {
    return new StringProcessor(input, config);
  }

  static truncate(input: string, maxLength: number, config: StringProcessorConfig = {}): string {
    return this.process(input, config).truncate(maxLength).value();
  }

  static wrap(input: string, options: WrapOptions = {}, config: StringProcessorConfig = {}): string {
    return this.process(input, config).wrap(options).value();
  }
}

export const { process: processString, truncate: truncateString, wrap: wrapString } = StringUtils;

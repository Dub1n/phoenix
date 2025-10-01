import { createDebugToolkit } from '../../src/utils/debug-utils';
import { LogLevel, Logger } from '../../src/utils/logger';

type RecordedLog = {
  level: LogLevel;
  message: string;
  data?: unknown;
};

type LoggerContract = Pick<Logger, 'debug' | 'info' | 'warn' | 'error' | 'setLevel' | 'child'>;

class StubLogger implements LoggerContract {
  readonly records: RecordedLog[];
  private readonly context: string;

  constructor(context = 'stub', records: RecordedLog[] = []) {
    this.context = context;
    this.records = records;
  }

  debug(message: string, data?: unknown): void {
    this.records.push({ level: LogLevel.DEBUG, message: this.tag(message), data });
  }

  info(message: string, data?: unknown): void {
    this.records.push({ level: LogLevel.INFO, message: this.tag(message), data });
  }

  warn(message: string, data?: unknown): void {
    this.records.push({ level: LogLevel.WARN, message: this.tag(message), data });
  }

  error(message: string, error?: Error | null, data?: unknown): void {
    const payload = error ? { error, data } : data;
    this.records.push({ level: LogLevel.ERROR, message: this.tag(message), data: payload });
  }

  setLevel(): void {
    // No-op for tests
  }

  child(suffix: string): Logger {
    return new StubLogger(`${this.context}:${suffix}`, this.records) as unknown as Logger;
  }

  private tag(message: string): string {
    return `[${this.context}] ${message}`;
  }
}

describe('Debug Toolkit', () => {
  test('chains log and inspect when enabled', () => {
    const stubLogger = new StubLogger();
    const toolkit = createDebugToolkit({
      namespace: 'unit',
      logger: stubLogger as unknown as Logger,
      level: LogLevel.DEBUG,
      historyLimit: 5
    });

    const chained = toolkit
      .log('connected to backend', { data: { backendId: 'haruspex' } })
      .inspect({ session: 'active' }, { label: 'session state' });

    expect(chained).toBe(toolkit);
    expect(stubLogger.records).toHaveLength(2);
    expect(toolkit.getHistory()).toHaveLength(2);
    expect(toolkit.getHistory()[0].type).toBe('log');
    expect(toolkit.getHistory()[1].type).toBe('inspect');
  });

  test('respects log level gating', () => {
    const stubLogger = new StubLogger();
    const toolkit = createDebugToolkit({
      namespace: 'unit',
      logger: stubLogger as unknown as Logger,
      enabled: true,
      level: LogLevel.WARN
    });

    toolkit.log('debug details ignored');
    expect(stubLogger.records).toHaveLength(0);

    toolkit.log('escalated warning', { level: LogLevel.WARN, data: { attempts: 3 } });
    expect(stubLogger.records).toHaveLength(1);
    expect(stubLogger.records[0]).toMatchObject({
      level: LogLevel.WARN,
      message: '[unit] escalated warning'
    });
  });

  test('profiles async operations with timing metadata', async () => {
    const stubLogger = new StubLogger();
    let now = 10;
    const toolkit = createDebugToolkit({
      namespace: 'unit',
      logger: stubLogger as unknown as Logger,
      clock: () => now
    });

    const result = await toolkit.profile('load skin', async () => {
      now += 25;
      return { skin: 'phoenix-lite' };
    }, {
      metadata: { backendId: 'phoenix-lite' }
    });

    expect(result).toEqual({ skin: 'phoenix-lite' });
    expect(stubLogger.records).toHaveLength(1);
    expect(stubLogger.records[0].data).toMatchObject({ durationMs: 25, backendId: 'phoenix-lite' });
    expect(toolkit.getHistory()[0]).toMatchObject({
      type: 'profile',
      label: 'load skin',
      durationMs: 25
    });
  });

  test('delegates failures through the configured error handler', async () => {
    const stubLogger = new StubLogger();
    const handledErrors: unknown[] = [];
    const toolkit = createDebugToolkit({
      namespace: 'unit',
      logger: stubLogger as unknown as Logger,
      errorHandler: (error, context, metadata) => {
        handledErrors.push({ error, context, metadata });
        return new Error(`wrapped-${String((error as Error).message ?? error)}`);
      }
    });

    await expect(toolkit.profile('fails-fast', () => {
      throw new Error('boom');
    })).rejects.toThrow('wrapped-boom');

    expect(handledErrors).toHaveLength(1);
    expect(handledErrors[0]).toMatchObject({
      context: 'unit:fails-fast',
      metadata: { phase: 'profile', durationMs: expect.any(Number) }
    });
  });

  test('teardown executes registered cleanup and clears history', () => {
    const stubLogger = new StubLogger();
    const toolkit = createDebugToolkit({
      namespace: 'unit',
      logger: stubLogger as unknown as Logger
    });

    let cleanupRuns = 0;
    toolkit.onTeardown(() => cleanupRuns++);
    toolkit.log('cleanup tracked');

    expect(toolkit.getHistory()).toHaveLength(1);
    toolkit.teardown();
    expect(cleanupRuns).toBe(1);
    expect(toolkit.getHistory()).toHaveLength(0);

    toolkit.teardown();
    expect(cleanupRuns).toBe(1);
  });

  test('withContext composes namespaces via logger child', () => {
    const stubLogger = new StubLogger();
    const toolkit = createDebugToolkit({
      namespace: 'root',
      logger: stubLogger as unknown as Logger
    });

    const child = toolkit.withContext('adapter');
    child.log('connected');

    expect(stubLogger.records[0].message).toBe('[root:adapter] connected');
    expect(child.getHistory()[0]).toMatchObject({
      type: 'log',
      namespace: 'root:adapter'
    });
  });
});

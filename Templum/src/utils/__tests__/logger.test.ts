import { createLogger, LoggerConfig, LogLevel, LogRecord, LoggerTransport } from '../logger';

class TestTransport implements LoggerTransport {
  public readonly records: LogRecord[] = [];

  log(record: LogRecord): void {
    this.records.push(record);
  }
}

const baselineConfiguration = LoggerConfig.getConfiguration();

const resetConfiguration = (): void => {
  LoggerConfig.configure({
    level: baselineConfiguration.level,
    structured: baselineConfiguration.structured,
    serializer: baselineConfiguration.serializer,
    transport: baselineConfiguration.transport,
  });

  if (baselineConfiguration.structured) {
    LoggerConfig.useStructuredLogging(baselineConfiguration.serializer);
  } else {
    LoggerConfig.disableStructuredLogging();
  }
};

describe('Logger', () => {
  let transport: TestTransport;

  beforeEach(() => {
    resetConfiguration();
    transport = new TestTransport();
    LoggerConfig.configure({
      transport,
      level: LogLevel.DEBUG,
      structured: false,
      serializer: undefined,
    });
    LoggerConfig.disableStructuredLogging();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    resetConfiguration();
  });

  it('logs messages at or above the active level', () => {
    const logger = createLogger('test-logger');

    logger.info('hello world', { scope: 'unit' });

    expect(transport.records).toHaveLength(1);
    expect(transport.records[0]).toMatchObject({
      level: LogLevel.INFO,
      message: 'hello world',
      context: 'test-logger',
      data: { scope: 'unit' },
    });
  });

  it('skips messages below the instance level while emitting higher levels', () => {
    const logger = createLogger('warn-only', { level: LogLevel.WARN });

    logger.info('should be skipped');
    logger.warn('warn boundary reached');
    logger.error('fatal issue', new Error('boom'));

    expect(transport.records).toHaveLength(2);
    expect(transport.records[0]).toMatchObject({
      level: LogLevel.WARN,
      message: 'warn boundary reached',
    });
    expect(transport.records[1].error).toBeInstanceOf(Error);
    expect(transport.records[1].error?.message).toBe('boom');
  });

  it('passes structured payloads through the configured serializer', () => {
    const serializerOutput = { formatted: true };
    LoggerConfig.useStructuredLogging(() => serializerOutput);

    const logger = createLogger('structured');
    const error = new Error('failure');

    logger.error('structured error', error, { reason: 'test' });

    expect(transport.records).toHaveLength(1);
    const [record] = transport.records;

    expect(record.data).toBe(serializerOutput);
    expect(record.error).toBe(error);
  });

  it('records durations with time/timeEnd and merges supplemental data', () => {
    jest.useFakeTimers({ now: Date.now() });
    const logger = createLogger('performance');

    logger.time('bootstrap');
    jest.advanceTimersByTime(250);
    logger.timeEnd('bootstrap', { phase: 'init' });

    jest.useRealTimers();

    expect(transport.records).toHaveLength(1);
    const [record] = transport.records;

    expect(record.message).toBe('bootstrap completed');
    expect(record.durationMs).toBe(250);
    expect(record.data).toEqual({ phase: 'init' });
  });

  it('ignores unmatched timeEnd calls without emitting records', () => {
    const logger = createLogger('performance');

    logger.timeEnd('never-started');

    expect(transport.records).toHaveLength(0);
  });
});

describe('Guardrail: consolidated sink abstraction', () => {
  beforeEach(() => {
    resetConfiguration();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    resetConfiguration();
  });

  it('fails until the default logger transport stops invoking console.* directly', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

    const logger = createLogger('default-transport');

    logger.info('info guardrail');
    logger.warn('warn guardrail');
    logger.error('error guardrail', new Error('guardrail failure'));
    logger.debug('debug guardrail');

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
  });
});

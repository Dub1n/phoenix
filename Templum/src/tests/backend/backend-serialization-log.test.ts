import { LoggerConfig, LogLevel, type LogRecord } from '../../utils/logger';
import { emitSerializationWarnings } from '../../backend/backend-serialization-log';
import { createTemplumError } from '../../types/templum-types';
import type { SerializationOutcome } from '../../utils/serialization-utils';

describe('backend serialization logging helper', () => {
  const originalConfiguration = LoggerConfig.getConfiguration();
  let capturedRecords: LogRecord[];

  beforeEach(() => {
    capturedRecords = [];
    LoggerConfig.useTransport({
      log(record) {
        capturedRecords.push(record);
      },
    });
    LoggerConfig.disableStructuredLogging();
    LoggerConfig.setLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    LoggerConfig.useTransport(originalConfiguration.transport);
    if (originalConfiguration.structured) {
      LoggerConfig.useStructuredLogging(originalConfiguration.serializer);
    } else {
      LoggerConfig.disableStructuredLogging();
    }
    LoggerConfig.setLevel(originalConfiguration.level);
  });

  it('does not log when serialization succeeds without warnings', () => {
    const outcome: SerializationOutcome<string> = {
      ok: true,
      status: 'success',
      value: 'payload',
      meta: {
        context: 'serialization.json.stringify',
        bytes: 42,
        durationMs: 3,
        warnings: [],
        maskedFields: [],
      },
    };

    emitSerializationWarnings('service-discovery:registry', outcome);

    expect(capturedRecords).toHaveLength(0);
  });

  it('logs a warning when serialization falls back', () => {
    const templumError = createTemplumError(
      'Serialized payload exceeded limit',
      'SERIALIZATION_SIZE_LIMIT_EXCEEDED',
      'validation',
      { limit: 2048 },
    );

    const outcome: SerializationOutcome<string> = {
      ok: true,
      status: 'fallback',
      value: '{}',
      error: templumError,
      meta: {
        context: 'serialization.json.stringify',
        bytes: 4096,
        durationMs: 7,
        warnings: ['Serialization failed; using fallback value'],
        maskedFields: ['token'],
      },
    };

    emitSerializationWarnings('service-discovery:registry', outcome);

    expect(capturedRecords).toHaveLength(1);
    const [record] = capturedRecords;
    expect(record.level).toBe(LogLevel.WARN);
    expect(record.context).toBe('serialization-utils:backend:service-discovery:registry');
    expect(record.message).toBe('Serialization fallback emitted');
    expect(record.data).toMatchObject({
      context: 'service-discovery:registry',
      status: 'fallback',
      warnings: ['Serialization failed; using fallback value'],
      bytes: 4096,
      durationMs: 7,
      maskedFields: ['token'],
    });
  });

  it('logs a warning when serialization succeeds with warnings', () => {
    const outcome: SerializationOutcome<Record<string, unknown>> = {
      ok: true,
      status: 'success',
      value: { ok: true },
      meta: {
        context: 'serialization.json.parse',
        bytes: 128,
        durationMs: 2,
        warnings: ['Applied defaults for missing optional fields'],
        maskedFields: [],
      },
    };

    emitSerializationWarnings('backend-service-router:ipc', outcome);

    expect(capturedRecords).toHaveLength(1);
    const [record] = capturedRecords;
    expect(record.level).toBe(LogLevel.WARN);
    expect(record.context).toBe('serialization-utils:backend:backend-service-router:ipc');
    expect(record.message).toBe('Serialization completed with warnings');
    expect(record.data).toMatchObject({
      context: 'backend-service-router:ipc',
      status: 'success',
      warnings: ['Applied defaults for missing optional fields'],
      bytes: 128,
      durationMs: 2,
      maskedFields: [],
    });
  });

  it('logs an error when serialization fails', () => {
    const templumError = createTemplumError(
      'Invalid JSON payload',
      'SERIALIZATION_PARSE_ERROR',
      'validation',
      { rawPayload: '{"invalid": }' },
    );

    const outcome: SerializationOutcome<unknown> = {
      ok: false,
      status: 'error',
      error: templumError,
      meta: {
        context: 'serialization.json.parse',
        bytes: 17,
        durationMs: 5,
        warnings: ['Encountered malformed JSON payload'],
        maskedFields: [],
      },
    };

    emitSerializationWarnings('backend-service-router:ipc', outcome);

    expect(capturedRecords).toHaveLength(1);
    const [record] = capturedRecords;
    expect(record.level).toBe(LogLevel.ERROR);
    expect(record.context).toBe('serialization-utils:backend:backend-service-router:ipc');
    expect(record.message).toBe('Serialization failed');
    expect(record.error).toBe(templumError);
    expect(record.data).toMatchObject({
      context: 'backend-service-router:ipc',
      status: 'error',
      warnings: ['Encountered malformed JSON payload'],
      bytes: 17,
      durationMs: 5,
      maskedFields: [],
    });
  });
});

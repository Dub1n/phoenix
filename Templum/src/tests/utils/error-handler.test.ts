import { ErrorHandler, type ErrorMetadata } from '../../utils/error-handler';
import { Logger } from '../../utils/logger';
import * as AsyncUtils from '../../utils/async-utils';

describe('ErrorHandler utility', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('normalizes errors and logs rich metadata via handle', () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const templumError = ErrorHandler.handle(new TypeError('boom'), 'test-context', { foo: 'bar' });

    expect(templumError.code).toBe('TypeError');
    expect(templumError.category).toBe('runtime');
    expect(templumError.message).toContain('test-context: boom');
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Error in test-context',
      templumError,
      expect.objectContaining({
        originalError: expect.objectContaining({ name: 'TypeError', message: 'boom' }),
        foo: 'bar'
      })
    );
  });

  it('returns fallback values and emits warnings when handleAsync encounters failures', async () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    const result = await ErrorHandler.handleAsync(
      Promise.reject(new Error('async failure')),
      'async-context',
      { fallback: 'fallback-value' }
    );

    expect(result).toBe('fallback-value');
    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(loggerWarnSpy).toHaveBeenCalledWith('Using fallback for async-context', { fallback: 'fallback-value' });
  });

  it('merges metadata into handleAsync logging when fallbacks are used', async () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    const result = await ErrorHandler.handleAsync(
      Promise.reject(new Error('metadata failure')),
      'metadata-context',
      {
        fallback: 'metadata-fallback',
        metadata: { requestId: 'abc-123' }
      }
    );

    expect(result).toBe('metadata-fallback');
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Error in metadata-context',
      expect.any(Object),
      expect.objectContaining({
        originalError: expect.objectContaining({ message: 'metadata failure' }),
        requestId: 'abc-123',
        fallback: 'metadata-fallback'
      })
    );
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'Using fallback for metadata-context',
      expect.objectContaining({ fallback: 'metadata-fallback', requestId: 'abc-123' })
    );
  });

  it('supports swallow semantics in handleAsync without emitting warnings', async () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    const result = await ErrorHandler.handleAsync(
      Promise.reject(new Error('swallow failure')),
      'swallow-context',
      { swallow: true }
    );

    expect(result).toBeUndefined();
    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(loggerWarnSpy).not.toHaveBeenCalled();
  });

  it('honours logError flag in withFallback', () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const fallback = ErrorHandler.withFallback(
      () => {
        throw new Error('sync failure');
      },
      'safe-value',
      'sync-context',
      false
    );

    expect(fallback).toBe('safe-value');
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it('supports metadata-aware withFallback options', () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const fallback = ErrorHandler.withFallback(
      () => {
        throw new Error('sync failure');
      },
      'safe-value',
      'metadata-fallback-context',
      {
        metadata: { correlationId: 'cid-42' }
      }
    );

    expect(fallback).toBe('safe-value');
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Error in metadata-fallback-context',
      expect.any(Object),
      expect.objectContaining({ correlationId: 'cid-42' })
    );
  });

  it('retries asynchronous work with exponential backoff semantics and wraps terminal failures', async () => {
    const sleepSpy = jest.spyOn(AsyncUtils, 'sleep').mockResolvedValue();
    const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const onRetry = jest.fn();

    const attempt = jest.fn().mockRejectedValue(new Error('retry failure'));

    await expect(
      ErrorHandler.retry(attempt, 'retry-context', {
        maxAttempts: 2,
        baseDelayMs: 10,
        jitter: false,
        onRetry
      })
    ).rejects.toMatchObject({
      code: 'Error',
      message: expect.stringContaining('retry-context (after 2 attempts)')
    });

    expect(attempt).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(
      'retry-context',
      expect.any(Error),
      1,
      10
    );
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'retry-context attempt 1 failed, retrying',
      expect.objectContaining({
        attempt: 1,
        maxAttempts: 2,
        delayMs: 10,
        error: 'retry failure'
      })
    );
    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(sleepSpy).toHaveBeenCalledTimes(1);
  });

  it('scope merges metadata for fallback flows', async () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    const scoped = ErrorHandler.scope('scoped-context', { requestId: 'req-001' });
    const result = await scoped.handleAsync(
      Promise.reject(new Error('scoped failure')),
      { fallback: 'scoped-fallback', metadata: { attempt: 2 } }
    );

    expect(result).toBe('scoped-fallback');
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Error in scoped-context',
      expect.any(Object),
      expect.objectContaining({
        requestId: 'req-001',
        attempt: 2,
        fallback: 'scoped-fallback'
      })
    );
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'Using fallback for scoped-context',
      expect.objectContaining({
        requestId: 'req-001',
        attempt: 2,
        fallback: 'scoped-fallback'
      })
    );
  });

  it('scope child composes context using formatContext and inherits metadata', async () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const scoped = ErrorHandler.scope('root-context', { traceId: 'trace-root' });
    const child = scoped.child('loader', { component: 'router' });

    await child.handleAsync(Promise.reject(new Error('child failure')), {
      swallow: true
    });

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Error in root-context::loader',
      expect.any(Object),
      expect.objectContaining({
        traceId: 'trace-root',
        component: 'router'
      })
    );
  });

  it('formatContext joins segments and removes blanks', () => {
    expect(ErrorHandler.formatContext('backend', 'router', '', 'fetch')).toBe('backend::router::fetch');
    expect(ErrorHandler.formatContext('backend', undefined, 'resolve')).toBe('backend::resolve');
  });

  it('capture returns ok result for successful sync operations without logging', () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const result = ErrorHandler.capture(() => 42, 'capture-context');

    expect(result).toEqual({ ok: true, value: 42 });
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it('scoped captureAsync merges metadata and surfaces templum errors without throwing', async () => {
    const originalHandle = ErrorHandler.handle.bind(ErrorHandler);
    const metadataCalls: Array<ErrorMetadata | undefined> = [];
    const handleSpy = jest.spyOn(ErrorHandler, 'handle').mockImplementation((error, context, metadata) => {
      metadataCalls.push(metadata);
      return originalHandle(error, context, metadata);
    });

    const scoped = ErrorHandler.scope(
      ErrorHandler.formatContext('root', 'capture'),
      { requestId: 'req-99' }
    );

    const result = await scoped.captureAsync(
      async () => {
        throw new Error('capture failure');
      },
      { step: 'verify' }
    );

    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('capture failure');
    expect(metadataCalls[0]).toEqual({ requestId: 'req-99', step: 'verify' });

    handleSpy.mockRestore();
  });
});

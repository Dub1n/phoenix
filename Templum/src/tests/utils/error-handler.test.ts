import { ErrorHandler } from '../../utils/error-handler';
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
});

import {
  AsyncUtils,
  withTimeout,
  retry,
  sleep,
  debounce,
  throttle,
  createInterval,
} from '../../utils/async-utils';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('AsyncUtils', () => {
  afterEach(() => {
    AsyncUtils.cleanup();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('withTimeout resolves before reaching the timeout window', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 50)).resolves.toBe('ok');
  });

  test('withTimeout rejects when the operation exceeds the timeout', async () => {
    await expect(withTimeout(new Promise(() => void 0), 10)).rejects.toThrow('Operation timed out');
  });

  test('withTimeout propagates the original rejection reason', async () => {
    const failure = new Error('boom');

    await expect(withTimeout(Promise.reject(failure), 20)).rejects.toBe(failure);
  });

  test('retry resolves after transient failures using deterministic delays', async () => {
    let attempts = 0;
    const fn = jest.fn(async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error(`attempt-${attempts}`);
      }
      return 'success';
    });

    const start = Date.now();
    const result = await retry(fn, { maxAttempts: 3, baseDelayMs: 5, jitter: false });
    const duration = Date.now() - start;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(duration).toBeGreaterThanOrEqual(10);
  });

  test('retry throws the final error after exhausting attempts', async () => {
    const persistentError = new Error('persistent');
    const fn = jest.fn(async () => {
      throw persistentError;
    });

    await expect(retry(fn, { maxAttempts: 2, baseDelayMs: 5, jitter: false })).rejects.toBe(
      persistentError
    );
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('debounce waits for a quiet period before invoking the handler', async () => {
    const handler = jest.fn();
    const debounced = debounce(handler, 15);

    debounced('first');
    debounced('second');

    await wait(30);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenLastCalledWith('second');
  });

  test('throttle executes immediately and then with the most recent arguments after the window', async () => {
    const handler = jest.fn();
    const throttled = throttle(handler, 20);

    throttled('first');
    await wait(5);
    throttled('second');

    await wait(30);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[0][0]).toBe('first');
    expect(handler.mock.calls[1][0]).toBe('second');
  });

  test('createInterval schedules the handler and stop prevents further execution', async () => {
    let callCount = 0;
    const interval = createInterval(() => {
      callCount += 1;
    }, 10);

    await wait(35);
    interval.stop();

    const countAfterStop = callCount;
    await wait(30);

    expect(countAfterStop).toBeGreaterThanOrEqual(3);
    expect(callCount).toBe(countAfterStop);
  });

  test('cleanup halts active timers and intervals', async () => {
    let intervalCount = 0;
    createInterval(() => {
      intervalCount += 1;
    }, 10);

    const pendingSleep = sleep(200);

    await wait(25);

    AsyncUtils.cleanup();

    const afterCleanupCount = intervalCount;
    await wait(30);

    expect(intervalCount).toBe(afterCleanupCount);

    const race = await Promise.race([
      pendingSleep.then(() => 'resolved'),
      wait(40).then(() => 'still-pending'),
    ]);

    expect(race).toBe('still-pending');
  });
});


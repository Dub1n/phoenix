type SampleEvents = {
  data: (payload: { value: string }) => void;
  ready: () => void;
  error: (error: Error) => void;
};

const mockLogger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
};

const mockHandle = jest.fn();

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  createLogger: jest.fn(() => mockLogger),
  Logger: class {},
  LogLevel: { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
}));

jest.mock('../../utils/error-handler', () => ({
  __esModule: true,
  handle: (error: unknown, context: string) => mockHandle(error, context)
}));

// Import after mocks so the module picks up the mocked collaborators.
import {
  EventUtils,
  batchSubscribe,
  cleanupContext,
  cleanupEvents,
  createScopedBus,
  createEventBusHost,
  createTypedEmitter,
  emit,
  forward,
  subscribe,
  waitForEvent
} from '../../utils/event-utils';
import { sleep } from '../../utils/async-utils';

describe('event-utils', () => {
  afterEach(() => {
    cleanupEvents();
    jest.clearAllMocks();
  });

  test('createTypedEmitter wires typed listeners and emits payloads safely', () => {
    const emitter = createTypedEmitter<SampleEvents>();
    const handler = jest.fn();

    subscribe(emitter, 'data', handler);

    const result = emit(emitter, 'data', { value: 'alpha' });

    expect(result).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ value: 'alpha' });
    expect(mockLogger.debug).toHaveBeenCalledWith('Emitting event', {
      event: 'data',
      listeners: 1
    });
  });

  test('subscribe respects once/prepend options and context tracking', () => {
    const emitter = createTypedEmitter<SampleEvents>();
    const onceHandler = jest.fn();
    const prependHandler = jest.fn();

    subscribe(emitter, 'ready', onceHandler, { once: true, context: 'session' });
    subscribe(emitter, 'ready', prependHandler, { prepend: true, context: 'session' });

    emit(emitter, 'ready');
    emit(emitter, 'ready');

    expect(onceHandler).toHaveBeenCalledTimes(1);
    expect(prependHandler).toHaveBeenCalledTimes(2);

    cleanupContext('session');

    const diagnostics = EventUtils.getDiagnostics();
    expect(diagnostics.totalContexts).toBe(0);
    expect(diagnostics.totalSubscriptions).toBe(0);
  });

  test('forward relays events between emitters with subscription cleanup', () => {
    const source = createTypedEmitter<SampleEvents>();
    const target = createTypedEmitter<SampleEvents>();
    const targetHandler = jest.fn();

    subscribe(target, 'data', targetHandler);

    const unsubscribers = forward(source, target, ['data'], 'bridge');

    emit(source, 'data', { value: 'mirrored' });

    expect(targetHandler).toHaveBeenCalledWith({ value: 'mirrored' });
    expect(unsubscribers).toHaveLength(1);

    unsubscribers.forEach(unsub => unsub());
    emit(source, 'data', { value: 'after-cleanup' });

    expect(targetHandler).toHaveBeenCalledTimes(1);
  });

  test('waitForEvent resolves once the event arrives and rejects on timeout', async () => {
    const emitter = createTypedEmitter<SampleEvents>();

    const resolvePromise = waitForEvent(emitter, 'data', 100);

    void sleep(10).then(() => {
      emit(emitter, 'data', { value: 'payload' });
    });

    await expect(resolvePromise).resolves.toEqual([{ value: 'payload' }]);

    const timeoutPromise = waitForEvent(emitter, 'ready', 5);

    await expect(timeoutPromise).rejects.toThrow("Event 'ready' not received within 5ms");
  });

  test('batchSubscribe registers handlers and cleanup removes contexts', () => {
    const emitter = createTypedEmitter<SampleEvents>();
    const firstHandler = jest.fn();
    const secondHandler = jest.fn();

    const unsubscribers = batchSubscribe(
      emitter,
      [
        { event: 'data', handler: firstHandler },
        { event: 'ready', handler: secondHandler }
      ],
      'batch'
    );

    emit(emitter, 'data', { value: 'batch-one' });
    emit(emitter, 'ready');

    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).toHaveBeenCalledTimes(1);
    expect(unsubscribers).toHaveLength(2);

    cleanupContext('batch');

    const diagnostics = EventUtils.getDiagnostics();
    expect(diagnostics.totalContexts).toBe(0);
  });

  test('createScopedBus encapsulates context-aware subscriptions', () => {
    const bus = createScopedBus<SampleEvents>('component');
    const handler = jest.fn();

    bus.subscribe('data', handler);

    bus.emit('data', { value: 'scoped' });

    expect(handler).toHaveBeenCalledWith({ value: 'scoped' });
    expect(bus.getListenerCount('data')).toBe(1);

    bus.cleanup();

    const diagnostics = EventUtils.getDiagnostics();
    expect(diagnostics.totalContexts).toBe(0);
    expect(bus.getListenerCount('data')).toBe(0);
  });

  test('emit traps listener failures and routes through error handler', () => {
    const emitter = createTypedEmitter<SampleEvents>();
    const failure = new Error('boom');

    subscribe(emitter, 'data', () => {
      throw failure;
    });

    const result = emit(emitter, 'data', { value: 'trigger' });

    expect(result).toBe(false);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Event emission failed',
      undefined,
      expect.objectContaining({
        event: 'data',
        error: failure.message
      })
    );
    expect(mockHandle).toHaveBeenCalledWith(failure, 'event-emission:data');
  });

  test('createEventBusHost wires default context and cleanup', () => {
    const host = createEventBusHost<SampleEvents>({ context: 'templum-core', maxListeners: 5 });
    const handler = jest.fn();

    const unsubscribe = host.on('data', handler);
    host.emit('data', { value: 'hosted' });

    expect(handler).toHaveBeenCalledWith({ value: 'hosted' });
    expect(host.listenerCount('data')).toBe(1);

    const diagnostics = EventUtils.getDiagnostics();
    expect(diagnostics.contextStats.get('templum-core')).toBe(1);

    unsubscribe();
    host.cleanup();

    expect(EventUtils.getDiagnostics().totalContexts).toBe(0);
    expect(host.listenerCount('data')).toBe(0);
  });

  test('createEventBusHost supports once and prepend subscriptions', () => {
    const host = createEventBusHost<SampleEvents>({ context: 'templum-core-testing' });
    const onceHandler = jest.fn();
    const prependOnceHandler = jest.fn();

    host.once('ready', onceHandler);
    host.prependOnce('ready', prependOnceHandler);

    host.emit('ready');
    host.emit('ready');

    expect(prependOnceHandler).toHaveBeenCalledTimes(1);
    expect(onceHandler).toHaveBeenCalledTimes(1);
  });
});

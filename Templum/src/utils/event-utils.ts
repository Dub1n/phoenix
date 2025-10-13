import { EventEmitter } from 'events';
import { createLogger, Logger } from './logger';
import { handle as handleError } from './error-handler';
import { createTimeout, ManagedTimeout } from './async-utils';

export interface TypedEventMap {
  [event: string]: (...args: any[]) => any;
}

export type GenericEventMap = Record<string, (...args: any[]) => unknown>;

type EventKey<TEventMap extends TypedEventMap> = Extract<keyof TEventMap, string>;

export type UnsubscribeFn = () => void;

export interface SubscriptionOptions {
  once?: boolean;
  prepend?: boolean;
  context?: string;
}

export interface EventBusHostOptions {
  /**
   * Context key used for EventUtils subscription tracking.
   * Defaults to a generated identifier when omitted.
   */
  context?: string;
  /**
   * Optional override for the emitter max listener threshold.
   */
  maxListeners?: number;
}

export interface EventBusHost<TEventMap extends TypedEventMap> {
  readonly emitter: TypedEventEmitter<TEventMap>;
  readonly context: string;
  emit<K extends EventKey<TEventMap>>(event: K, ...args: Parameters<TEventMap[K]>): boolean;
  on<K extends EventKey<TEventMap>>(
    event: K,
    handler: TEventMap[K],
    options?: SubscriptionOptions
  ): UnsubscribeFn;
  once<K extends EventKey<TEventMap>>(
    event: K,
    handler: TEventMap[K],
    options?: Omit<SubscriptionOptions, 'once'>
  ): UnsubscribeFn;
  prepend<K extends EventKey<TEventMap>>(
    event: K,
    handler: TEventMap[K],
    options?: SubscriptionOptions
  ): UnsubscribeFn;
  prependOnce<K extends EventKey<TEventMap>>(
    event: K,
    handler: TEventMap[K],
    options?: Omit<SubscriptionOptions, 'once'>
  ): UnsubscribeFn;
  off<K extends EventKey<TEventMap>>(event: K, handler: TEventMap[K]): void;
  removeAll(event?: EventKey<TEventMap>): void;
  listenerCount<K extends EventKey<TEventMap>>(event: K): number;
  getEventNames(): EventKey<TEventMap>[];
  cleanup(): void;
}

export interface BatchSubscription<TEventMap extends TypedEventMap> {
  event: EventKey<TEventMap>;
  handler: TEventMap[EventKey<TEventMap>];
  options?: SubscriptionOptions;
}

export interface EventDiagnostics {
  totalContexts: number;
  totalSubscriptions: number;
  contextStats: Map<string, number>;
  globalBusListeners: number;
}

export interface ScopedEventBus<TEventMap extends TypedEventMap> {
  emitter: TypedEventEmitter<TEventMap>;
  scope: string;
  emit<K extends EventKey<TEventMap>>(event: K, ...args: Parameters<TEventMap[K]>): boolean;
  subscribe<K extends EventKey<TEventMap>>(event: K, handler: TEventMap[K], options?: SubscriptionOptions): UnsubscribeFn;
  cleanup(): void;
  getListenerCount<K extends EventKey<TEventMap>>(event: K): number;
  getEventNames(): EventKey<TEventMap>[];
}

export type TypedEventEmitter<TEventMap extends TypedEventMap> = EventEmitter & {
  emit<K extends EventKey<TEventMap>>(event: K, ...args: Parameters<TEventMap[K]>): boolean;
  on<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): TypedEventEmitter<TEventMap>;
  once<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): TypedEventEmitter<TEventMap>;
  off<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): TypedEventEmitter<TEventMap>;
  removeListener<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): TypedEventEmitter<TEventMap>;
  removeAllListeners(event?: EventKey<TEventMap>): TypedEventEmitter<TEventMap>;
  listenerCount(event: EventKey<TEventMap>): number;
  prependListener<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): TypedEventEmitter<TEventMap>;
  prependOnceListener<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): TypedEventEmitter<TEventMap>;
  eventNames(): EventKey<TEventMap>[];
};

export type AnyTypedEventEmitter = TypedEventEmitter<GenericEventMap>;

export class EventUtils {
  private static logger: Logger = createLogger('event-utils');
  private static globalEmitter: EventEmitter = new EventEmitter();
  private static activeEmitters: WeakSet<EventEmitter> = new WeakSet();
  private static subscriptions: Map<string, Set<UnsubscribeFn>> = new Map();

  static {
    EventUtils.globalEmitter.setMaxListeners(200);
  }

  static createTypedEmitter<TEventMap extends TypedEventMap>(): TypedEventEmitter<TEventMap> {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(50);
    EventUtils.activeEmitters.add(emitter);

    const typedEmitter = emitter as TypedEventEmitter<TEventMap>;
    const originalEmit = emitter.emit.bind(emitter);

    typedEmitter.emit = (<K extends EventKey<TEventMap>>(
      event: K,
      ...args: Parameters<TEventMap[K]>
    ) => {
      try {
        return originalEmit(event, ...args);
      } catch (error) {
        EventUtils.logger.error('Event emission failed', undefined, {
          event: String(event),
          error: error instanceof Error ? error.message : error
        });
        handleError(error, `event-emission:${String(event)}`);
        return false;
      }
    }) as TypedEventEmitter<TEventMap>['emit'];

    return typedEmitter;
  }

  static subscribe<TEventMap extends TypedEventMap, K extends EventKey<TEventMap>>(
    emitter: TypedEventEmitter<TEventMap>,
    event: K,
    handler: TEventMap[K],
    options: SubscriptionOptions = {}
  ): UnsubscribeFn {
    const { once = false, prepend = false, context = 'default' } = options;

    if (!EventUtils.subscriptions.has(context)) {
      EventUtils.subscriptions.set(context, new Set());
    }

    if (once) {
      if (prepend) {
        emitter.prependOnceListener(event, handler);
      } else {
        emitter.once(event, handler);
      }
    } else if (prepend) {
      emitter.prependListener(event, handler);
    } else {
      emitter.on(event, handler);
    }

    const unsubscribe: UnsubscribeFn = () => {
      emitter.off(event, handler);
      EventUtils.subscriptions.get(context)?.delete(unsubscribe);
    };

    EventUtils.subscriptions.get(context)!.add(unsubscribe);
    return unsubscribe;
  }

  static emit<TEventMap extends TypedEventMap, K extends EventKey<TEventMap>>(
    emitter: TypedEventEmitter<TEventMap>,
    event: K,
    ...args: Parameters<TEventMap[K]>
  ): boolean {
    try {
      EventUtils.logger.debug('Emitting event', {
        event: String(event),
        listeners: emitter.listenerCount(event)
      });
      return emitter.emit(event, ...args);
    } catch (error) {
      EventUtils.logger.error('Event emission failed', undefined, {
        event: String(event),
        error: error instanceof Error ? error.message : error
      });
      handleError(error, `event-emission:${String(event)}`);
      return false;
    }
  }

  static get globalBus(): TypedEventEmitter<any> {
    return EventUtils.globalEmitter as TypedEventEmitter<any>;
  }

  static createScopedBus<TEventMap extends TypedEventMap>(
    scope: string,
    maxListeners = 50
  ): ScopedEventBus<TEventMap> {
    const emitter = EventUtils.createTypedEmitter<TEventMap>();
    emitter.setMaxListeners(maxListeners);

    return {
      emitter,
      scope,
      emit: (event, ...args) => EventUtils.emit(emitter, event, ...args),
      subscribe: (event, handler, options) =>
        EventUtils.subscribe(emitter, event, handler, { ...options, context: scope }),
      cleanup: () => EventUtils.cleanupContext(scope),
      getListenerCount: event => emitter.listenerCount(event),
      getEventNames: () => emitter.eventNames() as EventKey<TEventMap>[]
    };
  }

  static batchSubscribe<TEventMap extends TypedEventMap>(
    emitter: TypedEventEmitter<TEventMap>,
    subscriptions: BatchSubscription<TEventMap>[],
    context?: string
  ): UnsubscribeFn[] {
    return subscriptions.map(({ event, handler, options }) =>
      EventUtils.subscribe(emitter, event, handler, { ...options, context })
    );
  }

  static forward<TEventMap extends TypedEventMap>(
    from: TypedEventEmitter<TEventMap>,
    to: TypedEventEmitter<TEventMap>,
    events: EventKey<TEventMap>[],
    context?: string
  ): UnsubscribeFn[] {
    const forwardSingle = <K extends EventKey<TEventMap>>(event: K): UnsubscribeFn => {
      const forwarder = ((...args: Parameters<TEventMap[K]>) => {
        EventUtils.emit(to, event, ...args);
      }) as TEventMap[K];
      return EventUtils.subscribe(from, event, forwarder, { context });
    };

    return events.map(event => forwardSingle(event));
  }

  static waitForEvent<TEventMap extends TypedEventMap, K extends EventKey<TEventMap>>(
    emitter: TypedEventEmitter<TEventMap>,
    event: K,
    timeoutMs = 5000
  ): Promise<Parameters<TEventMap[K]>> {
    return new Promise((resolve, reject) => {
      let timeoutHandle: ManagedTimeout | null = null;

      const handler = (...args: Parameters<TEventMap[K]>) => {
        timeoutHandle?.cancel();
        emitter.off(event, handler as any);
        resolve(args);
      };

      timeoutHandle = createTimeout(() => {
        emitter.off(event, handler as any);
        reject(new Error(`Event '${String(event)}' not received within ${timeoutMs}ms`));
      }, timeoutMs, { unref: true });

      emitter.once(event, handler as any);
    });
  }

  static cleanupContext(context: string): void {
    const subscriptions = EventUtils.subscriptions.get(context);
    if (!subscriptions) {
      return;
    }

    subscriptions.forEach(unsubscribe => unsubscribe());
    subscriptions.clear();
    EventUtils.subscriptions.delete(context);
    EventUtils.logger.debug('Cleaned subscriptions for context', { context });
  }

  static cleanup(): void {
    EventUtils.subscriptions.forEach(subs => subs.forEach(unsubscribe => unsubscribe()));
    EventUtils.subscriptions.clear();
    EventUtils.globalEmitter.removeAllListeners();
    EventUtils.logger.info('Event utilities cleanup completed');
  }

  static getDiagnostics(): EventDiagnostics {
    const contextStats = new Map<string, number>();
    EventUtils.subscriptions.forEach((subs, context) => {
      contextStats.set(context, subs.size);
    });

    return {
      totalContexts: EventUtils.subscriptions.size,
      totalSubscriptions: Array.from(EventUtils.subscriptions.values()).reduce((sum, set) => sum + set.size, 0),
      contextStats,
      globalBusListeners: EventUtils.globalEmitter.eventNames().length
    };
  }

  static createEventBusHost<TEventMap extends TypedEventMap>(
    options: EventBusHostOptions = {}
  ): EventBusHost<TEventMap> {
    const { maxListeners = 50 } = options;
    const baseContext = options.context?.trim();
    const context =
      baseContext && baseContext.length > 0
        ? baseContext
        : `event-bus-host-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;

    const emitter = EventUtils.createTypedEmitter<TEventMap>();
    emitter.setMaxListeners(maxListeners);

    const subscribeWithContext = <K extends EventKey<TEventMap>>(
      event: K,
      handler: TEventMap[K],
      subscriptionOptions: SubscriptionOptions = {}
    ): UnsubscribeFn => {
      const mergedOptions: SubscriptionOptions = {
        ...subscriptionOptions,
        context: subscriptionOptions.context ?? context
      };
      return EventUtils.subscribe(emitter, event, handler, mergedOptions);
    };

    const host: EventBusHost<TEventMap> = {
      emitter,
      context,
      emit: (event, ...args) => EventUtils.emit(emitter, event, ...args),
      on: (event, handler, subscriptionOptions) =>
        subscribeWithContext(event, handler, subscriptionOptions),
      once: (event, handler, subscriptionOptions) =>
        subscribeWithContext(event, handler, { ...(subscriptionOptions || {}), once: true }),
      prepend: (event, handler, subscriptionOptions) =>
        subscribeWithContext(event, handler, { ...(subscriptionOptions || {}), prepend: true }),
      prependOnce: (event, handler, subscriptionOptions) =>
        subscribeWithContext(event, handler, {
          ...(subscriptionOptions || {}),
          once: true,
          prepend: true
        }),
      off: (event, handler) => {
        emitter.off(event, handler);
      },
      removeAll: event => {
        emitter.removeAllListeners(event);
      },
      listenerCount: event => emitter.listenerCount(event),
      getEventNames: () => emitter.eventNames() as EventKey<TEventMap>[],
      cleanup: () => {
        EventUtils.cleanupContext(context);
        emitter.removeAllListeners();
      }
    };

    return host;
  }
}

export const {
  createTypedEmitter,
  subscribe,
  emit,
  globalBus,
  createScopedBus,
  batchSubscribe,
  forward,
  waitForEvent,
  cleanupContext,
  createEventBusHost,
  cleanup: cleanupEvents
} = EventUtils;

export interface CommonEvents {
  error: (error: Error) => void;
  ready: () => void;
  destroy: () => void;
  data: (data: unknown) => void;
  change: (value: unknown) => void;
  start: () => void;
  stop: () => void;
  connected: () => void;
  disconnected: () => void;
}

export interface ComponentLifecycleEvents {
  initialize: () => void;
  mount: () => void;
  unmount: () => void;
  update: (props: Record<string, unknown>) => void;
  error: (error: Error) => void;
}

export interface BackendServiceEvents {
  serviceDiscovered: (service: { name: string; url: string }) => void;
  serviceConnected: (serviceName: string) => void;
  serviceDisconnected: (serviceName: string) => void;
  serviceError: (serviceName: string, error: Error) => void;
  healthCheck: (status: 'healthy' | 'degraded' | 'unhealthy') => void;
}

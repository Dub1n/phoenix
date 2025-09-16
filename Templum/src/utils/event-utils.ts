import { EventEmitter } from 'events';
import { createLogger, Logger } from './logger';
import { handle as handleError } from './error-handler';

export interface TypedEventMap {
  [event: string]: (...args: any[]) => any;
}

export type UnsubscribeFn = () => void;

export interface SubscriptionOptions {
  once?: boolean;
  prepend?: boolean;
  context?: string;
}

export interface BatchSubscription<TEventMap extends TypedEventMap> {
  event: keyof TEventMap;
  handler: TEventMap[keyof TEventMap];
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
  emit<K extends keyof TEventMap>(event: K, ...args: Parameters<TEventMap[K]>): boolean;
  subscribe<K extends keyof TEventMap>(event: K, handler: TEventMap[K], options?: SubscriptionOptions): UnsubscribeFn;
  cleanup(): void;
  getListenerCount<K extends keyof TEventMap>(event: K): number;
  getEventNames(): (keyof TEventMap)[];
}

export interface TypedEventEmitter<TEventMap extends TypedEventMap> extends EventEmitter {
  emit<K extends keyof TEventMap>(event: K, ...args: Parameters<TEventMap[K]>): boolean;
  on<K extends keyof TEventMap>(event: K, listener: TEventMap[K]): this;
  once<K extends keyof TEventMap>(event: K, listener: TEventMap[K]): this;
  removeListener<K extends keyof TEventMap>(event: K, listener: TEventMap[K]): this;
  removeAllListeners<K extends keyof TEventMap>(event?: K): this;
  listenerCount<K extends keyof TEventMap>(event: K): number;
  prependListener<K extends keyof TEventMap>(event: K, listener: TEventMap[K]): this;
  prependOnceListener<K extends keyof TEventMap>(event: K, listener: TEventMap[K]): this;
}

export class EventUtils {
  private static logger: Logger = createLogger('event-utils');
  private static globalEmitter: EventEmitter = new EventEmitter();
  private static activeEmitters: WeakSet<EventEmitter> = new WeakSet();
  private static subscriptions: Map<string, Set<UnsubscribeFn>> = new Map();

  static {
    this.globalEmitter.setMaxListeners(200);
  }

  static createTypedEmitter<TEventMap extends TypedEventMap>(): TypedEventEmitter<TEventMap> {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(50);
    this.activeEmitters.add(emitter);

    const typedEmitter = emitter as TypedEventEmitter<TEventMap>;
    const originalEmit = typedEmitter.emit.bind(typedEmitter);

    typedEmitter.emit = <K extends keyof TEventMap>(
      event: K,
      ...args: Parameters<TEventMap[K]>
    ): boolean => {
      try {
        return originalEmit(event as string, ...args);
      } catch (error) {
        this.logger.error('Event emission failed', undefined, {
          event: String(event),
          error: error instanceof Error ? error.message : error
        });
        handleError(error, `event-emission:${String(event)}`);
        return false;
      }
    };

    return typedEmitter;
  }

  static subscribe<TEventMap extends TypedEventMap, K extends keyof TEventMap>(
    emitter: TypedEventEmitter<TEventMap>,
    event: K,
    handler: TEventMap[K],
    options: SubscriptionOptions = {}
  ): UnsubscribeFn {
    const { once = false, prepend = false, context = 'default' } = options;

    if (!this.subscriptions.has(context)) {
      this.subscriptions.set(context, new Set());
    }

    if (once) {
      if (prepend) {
        emitter.prependOnceListener(event as string, handler);
      } else {
        emitter.once(event as string, handler);
      }
    } else if (prepend) {
      emitter.prependListener(event as string, handler);
    } else {
      emitter.on(event as string, handler);
    }

    const unsubscribe: UnsubscribeFn = () => {
      emitter.removeListener(event as string, handler);
      this.subscriptions.get(context)?.delete(unsubscribe);
    };

    this.subscriptions.get(context)!.add(unsubscribe);
    return unsubscribe;
  }

  static emit<TEventMap extends TypedEventMap, K extends keyof TEventMap>(
    emitter: TypedEventEmitter<TEventMap>,
    event: K,
    ...args: Parameters<TEventMap[K]>
  ): boolean {
    try {
      this.logger.debug('Emitting event', {
        event: String(event),
        listeners: emitter.listenerCount(event as string)
      });
      return emitter.emit(event, ...args);
    } catch (error) {
      this.logger.error('Event emission failed', undefined, {
        event: String(event),
        error: error instanceof Error ? error.message : error
      });
      handleError(error, `event-emission:${String(event)}`);
      return false;
    }
  }

  static get globalBus(): TypedEventEmitter<any> {
    return this.globalEmitter as TypedEventEmitter<any>;
  }

  static createScopedBus<TEventMap extends TypedEventMap>(
    scope: string,
    maxListeners = 50
  ): ScopedEventBus<TEventMap> {
    const emitter = this.createTypedEmitter<TEventMap>();
    emitter.setMaxListeners(maxListeners);

    return {
      emitter,
      scope,
      emit: (event, ...args) => this.emit(emitter, event, ...args),
      subscribe: (event, handler, options) =>
        this.subscribe(emitter, event, handler, { ...options, context: scope }),
      cleanup: () => this.cleanupContext(scope),
      getListenerCount: event => emitter.listenerCount(event as string),
      getEventNames: () => emitter.eventNames() as (keyof TEventMap)[]
    };
  }

  static batchSubscribe<TEventMap extends TypedEventMap>(
    emitter: TypedEventEmitter<TEventMap>,
    subscriptions: BatchSubscription<TEventMap>[],
    context?: string
  ): UnsubscribeFn[] {
    return subscriptions.map(({ event, handler, options }) =>
      this.subscribe(emitter, event, handler, { ...options, context })
    );
  }

  static forward<TEventMap extends TypedEventMap>(
    from: TypedEventEmitter<TEventMap>,
    to: TypedEventEmitter<TEventMap>,
    events: (keyof TEventMap)[],
    context?: string
  ): UnsubscribeFn[] {
    return events.map(event =>
      this.subscribe(from, event, (...args) => this.emit(to, event, ...args), { context })
    );
  }

  static waitForEvent<TEventMap extends TypedEventMap, K extends keyof TEventMap>(
    emitter: TypedEventEmitter<TEventMap>,
    event: K,
    timeoutMs = 5000
  ): Promise<Parameters<TEventMap[K]>> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        emitter.removeListener(event as string, handler as any);
        reject(new Error(`Event '${String(event)}' not received within ${timeoutMs}ms`));
      }, timeoutMs);

      const handler = (...args: Parameters<TEventMap[K]>) => {
        clearTimeout(timer);
        emitter.removeListener(event as string, handler as any);
        resolve(args);
      };

      emitter.once(event as string, handler as any);
    });
  }

  static cleanupContext(context: string): void {
    const subscriptions = this.subscriptions.get(context);
    if (!subscriptions) {
      return;
    }

    subscriptions.forEach(unsubscribe => unsubscribe());
    subscriptions.clear();
    this.subscriptions.delete(context);
    this.logger.debug('Cleaned subscriptions for context', { context });
  }

  static cleanup(): void {
    this.subscriptions.forEach(subs => subs.forEach(unsubscribe => unsubscribe()));
    this.subscriptions.clear();
    this.globalEmitter.removeAllListeners();
    this.logger.info('Event utilities cleanup completed');
  }

  static getDiagnostics(): EventDiagnostics {
    const contextStats = new Map<string, number>();
    this.subscriptions.forEach((subs, context) => {
      contextStats.set(context, subs.size);
    });

    return {
      totalContexts: this.subscriptions.size,
      totalSubscriptions: Array.from(this.subscriptions.values()).reduce((sum, set) => sum + set.size, 0),
      contextStats,
      globalBusListeners: this.globalEmitter.eventNames().length
    };
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


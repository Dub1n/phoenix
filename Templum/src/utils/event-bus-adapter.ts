import {
  createEventBusHost,
  EventBusHost,
  SubscriptionOptions,
  TypedEventMap,
  TypedEventEmitter,
  UnsubscribeFn
} from './event-utils';

type EventKey<TEventMap extends TypedEventMap> = Extract<keyof TEventMap, string>;
type ListenerFn = (...args: any[]) => unknown;

export interface EventBusAdapter<TEventMap extends TypedEventMap> {
  readonly emitter: TypedEventEmitter<TEventMap>;
  readonly context: string;
  emit<K extends EventKey<TEventMap>>(event: K, ...args: Parameters<TEventMap[K]>): boolean;
  on<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K], options?: SubscriptionOptions): void;
  once<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K], options?: SubscriptionOptions): void;
  off<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): void;
  removeAllListeners(event?: EventKey<TEventMap>): void;
  listenerCount<K extends EventKey<TEventMap>>(event: K): number;
  eventNames(): EventKey<TEventMap>[];
  cleanup(): void;
}

interface AdapterConfig {
  scope: string;
  maxListeners?: number;
}

export function createEventBusAdapter<TEventMap extends TypedEventMap>(
  config: AdapterConfig
): EventBusAdapter<TEventMap> {
  const { scope, maxListeners = 50 } = config;
  const host: EventBusHost<TEventMap> = createEventBusHost<TEventMap>({
    context: scope,
    maxListeners
  });
  const listenerRegistry = new Map<EventKey<TEventMap>, Map<ListenerFn, UnsubscribeFn>>();

  const storeListener = <K extends EventKey<TEventMap>>(
    event: K,
    listener: TEventMap[K],
    unsubscribe: UnsubscribeFn
  ) => {
    if (!listenerRegistry.has(event)) {
      listenerRegistry.set(event, new Map());
    }
    listenerRegistry.get(event)!.set(listener as ListenerFn, unsubscribe);
  };

  const subscribe = <K extends EventKey<TEventMap>>(
    event: K,
    listener: TEventMap[K],
    options?: SubscriptionOptions
  ) => {
    const unsubscribe =
      options?.once && options?.prepend
        ? host.prependOnce(event, listener, options)
        : options?.once
          ? host.once(event, listener, options)
          : options?.prepend
            ? host.prepend(event, listener, options)
            : host.on(event, listener, options);
    storeListener(event, listener, unsubscribe);
  };

  const emit = <K extends EventKey<TEventMap>>(
    event: K,
    ...args: Parameters<TEventMap[K]>
  ): boolean => host.emit(event, ...args);

  const on = <K extends EventKey<TEventMap>>(
    event: K,
    listener: TEventMap[K],
    options?: SubscriptionOptions
  ) => {
    subscribe(event, listener, options);
  };

  const once = <K extends EventKey<TEventMap>>(
    event: K,
    listener: TEventMap[K],
    options?: SubscriptionOptions
  ) => {
    subscribe(event, listener, { ...options, once: true });
  };

  const off = <K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]) => {
    const listeners = listenerRegistry.get(event);
    const unsubscribe = listeners?.get(listener as ListenerFn);

    if (unsubscribe) {
      unsubscribe();
      listeners!.delete(listener as ListenerFn);
      if (listeners!.size === 0) {
        listenerRegistry.delete(event);
      }
    }
  };

  const removeAllListeners = (event?: EventKey<TEventMap>) => {
    if (event) {
      const listeners = listenerRegistry.get(event);
      if (listeners) {
        listeners.forEach(unsubscribe => unsubscribe());
        listenerRegistry.delete(event);
      }
      host.removeAll(event);
      return;
    }

    listenerRegistry.forEach(listeners => {
      listeners.forEach(unsubscribe => unsubscribe());
    });
    listenerRegistry.clear();
    host.cleanup();
  };

  const listenerCount = <K extends EventKey<TEventMap>>(event: K): number =>
    host.listenerCount(event);

  const eventNames = (): EventKey<TEventMap>[] => host.getEventNames();

  const cleanup = () => {
    removeAllListeners();
  };

  return {
    emitter: host.emitter,
    context: host.context,
    emit,
    on,
    once,
    off,
    removeAllListeners,
    listenerCount,
    eventNames,
    cleanup
  };
}

export abstract class EventDrivenComponent<TEventMap extends TypedEventMap> {
  protected readonly events: EventBusAdapter<TEventMap>;

  protected constructor(scope: string, maxListeners?: number) {
    this.events = createEventBusAdapter<TEventMap>({
      scope,
      maxListeners
    });
  }

  emit<K extends EventKey<TEventMap>>(event: K, ...args: Parameters<TEventMap[K]>): boolean {
    return this.events.emit(event, ...args);
  }

  on<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): this {
    this.events.on(event, listener);
    return this;
  }

  addListener<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): this {
    return this.on(event, listener);
  }

  once<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): this {
    this.events.once(event, listener);
    return this;
  }

  off<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): this {
    this.events.off(event, listener);
    return this;
  }

  removeListener<K extends EventKey<TEventMap>>(event: K, listener: TEventMap[K]): this {
    return this.off(event, listener);
  }

  removeAllListeners(event?: EventKey<TEventMap>): this {
    this.events.removeAllListeners(event);
    return this;
  }

  protected get eventEmitter(): TypedEventEmitter<TEventMap> {
    return this.events.emitter;
  }

  protected get eventContext(): string {
    return this.events.context;
  }

  listenerCount(event: EventKey<TEventMap>): number {
    return this.events.listenerCount(event);
  }

  eventNames(): EventKey<TEventMap>[] {
    return this.events.eventNames();
  }

  protected cleanupEvents(): void {
    this.events.cleanup();
  }
}

import {
  EventUtils,
  ScopedEventBus,
  SubscriptionOptions,
  TypedEventMap,
  UnsubscribeFn
} from './event-utils';

type EventKey<TEventMap extends TypedEventMap> = Extract<keyof TEventMap, string>;
type ListenerFn = (...args: any[]) => unknown;

export interface EventBusAdapter<TEventMap extends TypedEventMap> {
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
  const events: ScopedEventBus<TEventMap> = EventUtils.createScopedBus<TEventMap>(scope, maxListeners);
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
    const unsubscribe = events.subscribe(event, listener, options);
    storeListener(event, listener, unsubscribe);
  };

  const emit = <K extends EventKey<TEventMap>>(
    event: K,
    ...args: Parameters<TEventMap[K]>
  ): boolean => events.emit(event, ...args);

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
      events.emitter.removeAllListeners(event);
      return;
    }

    listenerRegistry.forEach(listeners => {
      listeners.forEach(unsubscribe => unsubscribe());
    });
    listenerRegistry.clear();
    events.cleanup();
  };

  const listenerCount = <K extends EventKey<TEventMap>>(event: K): number =>
    events.getListenerCount(event);

  const eventNames = (): EventKey<TEventMap>[] => events.getEventNames();

  const cleanup = () => {
    removeAllListeners();
  };

  return {
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

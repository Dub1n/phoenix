import type { TypedEventMap } from '../../src/utils/event-utils';

interface RecordedEvent {
  event: string;
  payload: unknown[];
}

/**
 * Captures typed events emitted during tests, making it easier to assert on payload metadata.
 * The recorder stores a flat history while allowing consumers to query by event name.
 */
export function createTypedEventRecorder<TEvents extends TypedEventMap = TypedEventMap>() {
  const events: RecordedEvent[] = [];

  const record = <K extends Extract<keyof TEvents, string>>(event: K) => {
    return (...payload: Parameters<TEvents[K]>) => {
      events.push({ event, payload });
    };
  };

  const find = (event: string) => events.filter(entry => entry.event === event);

  const latest = (event: string) => {
    const matches = find(event);
    return matches.length > 0 ? matches[matches.length - 1] : undefined;
  };

  return {
    record,
    find,
    latest,
    get all() {
      return [...events];
    }
  };
}

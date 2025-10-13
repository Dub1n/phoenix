import type {
  BackendConnectionLifecycleEvent,
  BackendConnectionLifecycleState
} from '../../types/templum-types';
import type { TypedEventEmitter } from '../../utils/event-utils';

interface LifecycleChannelOptions {
  dedupeWindowMs?: number;
}

const DEFAULT_DEDUPE_WINDOW_MS = 500;

const normalizeError = (error: unknown): BackendConnectionLifecycleEvent['error'] => {
  if (!error) {
    return undefined;
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    };
  }

  if (typeof error === 'object') {
    const message = (error as { message?: string }).message ?? JSON.stringify(error);
    const code = (error as { code?: string }).code;
    return {
      message,
      code
    };
  }

  return { message: String(error) };
};

export class BackendLifecycleChannel {
  private readonly lastEvents = new Map<string, { state: BackendConnectionLifecycleState; timestamp: number }>();
  private readonly dedupeWindowMs: number;

  constructor(
    private readonly emitter: Pick<
      TypedEventEmitter<{ 'connection:lifecycle': (event: BackendConnectionLifecycleEvent) => void }>,
      'emit'
    >,
    options: LifecycleChannelOptions = {}
  ) {
    this.dedupeWindowMs = options.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;
  }

  emitConnected(backendId: string, details: Partial<BackendConnectionLifecycleEvent> = {}): void {
    this.emit('connected', backendId, details);
  }

  emitDisconnected(backendId: string, details: Partial<BackendConnectionLifecycleEvent> = {}): void {
    this.emit('disconnected', backendId, details);
  }

  emitRecovered(backendId: string, details: Partial<BackendConnectionLifecycleEvent> = {}): void {
    this.emit('recovered', backendId, details);
  }

  emitHealthDegraded(backendId: string, details: Partial<BackendConnectionLifecycleEvent> = {}): void {
    this.emit('health-degraded', backendId, details);
  }

  emitFailed(backendId: string, error: unknown, details: Partial<BackendConnectionLifecycleEvent> = {}): void {
    this.emit('failed', backendId, {
      ...details,
      error: normalizeError(error)
    });
  }

  private emit(
    state: BackendConnectionLifecycleState,
    backendId: string,
    details: Partial<BackendConnectionLifecycleEvent>
  ): void {
    const now = Date.now();
    const last = this.lastEvents.get(backendId);

    if (last && last.state === state && now - last.timestamp < this.dedupeWindowMs) {
      return;
    }

    const event: BackendConnectionLifecycleEvent = {
      backendId,
      state,
      timestamp: now,
      ...details,
      error: details.error ? normalizeError(details.error) : undefined
    };

    this.lastEvents.set(backendId, { state, timestamp: now });
    this.emitter.emit('connection:lifecycle', event);
  }
}

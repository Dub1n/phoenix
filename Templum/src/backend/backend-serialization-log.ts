import { createLogger, type Logger } from '../utils/logger';
import type { SerializationOutcome } from '../utils/serialization-utils';

const baseBackendSerializationLogger = createLogger('serialization-utils').child('backend');

export function getBackendSerializationLogger(scope?: string): Logger {
  return scope ? baseBackendSerializationLogger.child(scope) : baseBackendSerializationLogger;
}

interface SerializationLogPayload {
  context: string;
  status: SerializationOutcome<unknown>['status'];
  warnings: string[];
  bytes: number;
  durationMs: number;
  maskedFields: string[];
}

function buildPayload(context: string, outcome: SerializationOutcome<unknown>): SerializationLogPayload {
  return {
    context,
    status: outcome.status,
    warnings: [...outcome.meta.warnings],
    bytes: outcome.meta.bytes,
    durationMs: outcome.meta.durationMs,
    maskedFields: [...outcome.meta.maskedFields],
  };
}

export function emitSerializationWarnings(
  context: string,
  outcome: SerializationOutcome<unknown>,
): void {
  const logger = getBackendSerializationLogger(context);
  const payload = buildPayload(context, outcome);

  if (!outcome.ok) {
    logger.error('Serialization failed', outcome.error ?? undefined, payload);
    return;
  }

  if (outcome.status === 'fallback') {
    logger.warn('Serialization fallback emitted', payload);
    return;
  }

  if (outcome.status === 'defaults') {
    logger.warn('Serialization defaults applied', payload);
    return;
  }

  if (payload.warnings.length > 0) {
    logger.warn('Serialization completed with warnings', payload);
  }
}

import type { TemplumError } from '../types/templum-types';
import { ErrorHandler, type ErrorMetadata, type ScopedErrorHandler } from '../utils/error-handler';

export type ScopedAsyncResult<T> = { ok: true; value: T } | { ok: false; error: TemplumError };

export function createTemplumCoreErrorHandler(): ScopedErrorHandler {
  return ErrorHandler.scope(
    ErrorHandler.formatContext('core', 'templum-core'),
    { component: 'templum-core' }
  );
}

export async function captureScopedAsync<T>(
  handler: ScopedErrorHandler,
  operation: () => Promise<T>,
  metadata?: ErrorMetadata
): Promise<ScopedAsyncResult<T>> {
  try {
    const value = await operation();
    return { ok: true, value };
  } catch (error) {
    const templumError = handler.handle(error, metadata);
    return { ok: false, error: templumError };
  }
}

export function captureScopedSync<T>(
  handler: ScopedErrorHandler,
  operation: () => T,
  metadata?: ErrorMetadata
): ScopedAsyncResult<T> {
  try {
    const value = operation();
    return { ok: true, value };
  } catch (error) {
    const templumError = handler.handle(error, metadata);
    return { ok: false, error: templumError };
  }
}

export function createTemplumCoreError(
  message: string,
  code: string,
  category: TemplumError['category'],
  contextDetails?: Record<string, unknown>
): TemplumError {
  const error = new Error(message) as TemplumError;
  error.code = code;
  error.category = category;
  error.timestamp = Date.now();
  if (contextDetails) {
    error.context = contextDetails;
  }
  error.toString = function templumCoreErrorToString(): string {
    return this.message;
  };
  return error;
}

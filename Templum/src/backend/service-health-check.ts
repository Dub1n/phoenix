import * as http from 'http';
import * as https from 'https';
import { WebSocket } from 'ws';

import { ConnectionFactory } from './connection-factory';
import type { BackendConfig } from '../types/universal-skin-engine-types';
import type { Logger } from '../utils/logger';
import { resolveHealthEndpoint, type NormalizedServiceManifest } from './schemas/service-manifest';

export interface ServiceHealthCheckRequest {
  manifest: NormalizedServiceManifest;
  config: BackendConfig;
  timeoutMs: number;
  logger: Logger;
  context: string;
}

export async function performServiceHealthCheck(request: ServiceHealthCheckRequest): Promise<boolean> {
  const { manifest, logger } = request;
  if (!manifest.healthCheck) {
    logger.debug('No health check configuration; assuming healthy', {
      serviceId: manifest.id,
      context: request.context,
    });
    return true;
  }

  const resolvedEndpoint = resolveHealthEndpoint(manifest);
  const strategy = manifest.healthCheck.type ?? manifest.protocol;

  switch (strategy) {
    case 'http':
      if (!resolvedEndpoint) {
        logger.warn('HTTP health check missing endpoint; skipping', {
          serviceId: manifest.id,
          context: request.context,
        });
        return true;
      }
      return checkHttpHealth(resolvedEndpoint, request);
    case 'websocket':
      if (!resolvedEndpoint) {
        logger.warn('WebSocket health check missing endpoint; skipping', {
          serviceId: manifest.id,
          context: request.context,
        });
        return true;
      }
      return checkWebSocketHealth(resolvedEndpoint, request);
    case 'ipc':
      return checkIpcHealth(request);
    default:
      logger.warn('Unknown health check type; skipping', {
        serviceId: manifest.id,
        type: strategy,
        context: request.context,
      });
      return true;
  }
}

function checkHttpHealth(url: string, request: ServiceHealthCheckRequest): Promise<boolean> {
  const { timeoutMs, logger, manifest, context } = request;

  return new Promise((resolve) => {
    const client = url.startsWith('https://') ? https : http;

    const timeout = setTimeout(() => {
      logger.warn('HTTP health check timed out', {
        serviceId: manifest.id,
        url,
        timeoutMs,
        context,
      });
      resolve(false);
    }, timeoutMs);

    const req = client.get(url, (res) => {
      res.resume();
      clearTimeout(timeout);
      const statusCode = res.statusCode ?? 0;
      const healthy = statusCode >= 200 && statusCode < 300;

      if (!healthy) {
        logger.warn('HTTP health check returned non-2xx', {
          serviceId: manifest.id,
          url,
          statusCode,
          context,
        });
      }

      resolve(healthy);
    });

    req.on('error', (error: unknown) => {
      clearTimeout(timeout);
      const normalizedError = error instanceof Error ? error.message : String(error);
      logger.warn('HTTP health check failed', {
        serviceId: manifest.id,
        url,
        error: normalizedError,
        context,
      });
      resolve(false);
    });

    req.on('timeout', () => {
      clearTimeout(timeout);
      logger.warn('HTTP health check socket timeout', {
        serviceId: manifest.id,
        url,
        timeoutMs,
        context,
      });
      req.destroy();
      resolve(false);
    });
  });
}

function checkWebSocketHealth(url: string, request: ServiceHealthCheckRequest): Promise<boolean> {
  const { timeoutMs, logger, manifest, context } = request;

  return new Promise((resolve) => {
    let completed = false;
    const socket = new WebSocket(url, {
      handshakeTimeout: timeoutMs,
    });

    const timeout = setTimeout(() => {
      if (completed) {
        return;
      }
      completed = true;
      logger.warn('WebSocket health check timed out', {
        serviceId: manifest.id,
        url,
        timeoutMs,
        context,
      });
      try {
        socket.terminate();
      } catch (error) {
        logger.debug('WebSocket termination threw during timeout', {
          serviceId: manifest.id,
          error: error instanceof Error ? error.message : String(error),
          context,
        });
      }
      resolve(false);
    }, timeoutMs);

    socket.once('open', () => {
      if (completed) {
        return;
      }

      completed = true;
      clearTimeout(timeout);
      socket.terminate();
      resolve(true);
    });

    socket.once('error', (error: unknown) => {
      if (completed) {
        return;
      }

      completed = true;
      clearTimeout(timeout);
      logger.warn('WebSocket health check failed', {
        serviceId: manifest.id,
        url,
        error: error instanceof Error ? error.message : String(error),
        context,
      });
      resolve(false);
    });
  });
}

async function checkIpcHealth(request: ServiceHealthCheckRequest): Promise<boolean> {
  const { manifest, timeoutMs, logger, context } = request;
  const clonedConfig: BackendConfig = {
    ...request.config,
    timeout: Math.min(request.config.timeout ?? timeoutMs, timeoutMs),
    retries: 0,
    keepAlive: false,
  };

  let timeoutHandle: NodeJS.Timeout | undefined;
  let connectionTimedOut = false;

  const timeoutPromise = new Promise<boolean>((resolve) => {
    timeoutHandle = setTimeout(() => {
      connectionTimedOut = true;
      logger.warn('IPC health check timed out', {
        serviceId: manifest.id,
        endpoint: clonedConfig.endpoint,
        timeoutMs,
        context,
      });
      resolve(false);
    }, timeoutMs);
  });

  const attemptPromise = (async () => {
    let connection: Awaited<ReturnType<typeof ConnectionFactory.create>> | undefined;

    try {
      connection = await ConnectionFactory.create(manifest.id, clonedConfig);
      await connection.connect();
      await connection.disconnect();
      return true;
    } catch (error) {
      const normalizedError = error instanceof Error ? error.message : String(error);
      logger.warn('IPC health check failed', {
        serviceId: manifest.id,
        endpoint: clonedConfig.endpoint,
        error: normalizedError,
        context,
      });

      if (connection) {
        try {
          await connection.disconnect();
        } catch (_disconnectError) {
          // Swallow disconnect errors during failure cleanup
        }
      }

      return false;
    }
  })();

  const result = await Promise.race([timeoutPromise, attemptPromise]);

  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }

  if (connectionTimedOut) {
    return false;
  }

  return result;
}

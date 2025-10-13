import http, { IncomingMessage, ServerResponse } from 'http';
import os from 'os';
import { createTimeout } from '../../../src/utils/async-utils';

const SERVICE_NAME = 'phoenix-code-lite';
const VERSION = process.env.npm_package_version ?? 'dev';

type HealthStatus = 'starting' | 'ok';

interface HealthPayload {
  service: string;
  version: string;
  status: HealthStatus;
  mode: 'mock';
  uptimeSeconds: number;
  hostname: string;
  skipHaruspex: boolean;
}

const httpPort = normalisePort(process.env.HTTP_PORT, 3012);
const readinessDelayMs = normaliseInteger(process.env.PCL_READINESS_DELAY_MS, 0);
const startTimestamp = Date.now();
let ready = readinessDelayMs === 0;

createTimeout(() => {
  ready = true;
  log('Service ready (readiness delay elapsed)');
}, readinessDelayMs, { unref: true });

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  if (!req.url) {
    send(res, 400, { error: 'Bad Request', detail: 'Missing URL' });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/health')) {
    const status: HealthStatus = ready ? 'ok' : 'starting';
    const payload: HealthPayload = {
      service: SERVICE_NAME,
      version: VERSION,
      status,
      mode: 'mock',
      uptimeSeconds: process.uptime(),
      hostname: os.hostname(),
      skipHaruspex: shouldSkipHaruspex()
    };
    send(res, ready ? 200 : 503, payload);
    return;
  }

  if (req.method === 'POST' && req.url === '/shutdown') {
    log('Shutdown requested via HTTP');
    send(res, 202, { status: 'shutting-down' });
    shutdown();
    return;
  }

  send(res, 404, { error: 'Not Found' });
});

server.listen(httpPort, () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : httpPort;
  log(`Mock service listening on ${port}`);
});

server.on('error', (error) => {
  console.error(`[${SERVICE_NAME}] server error`, error);
  process.exitCode = 1;
  shutdown();
});

const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
for (const signal of signals) {
  process.on(signal, () => {
    log(`Received ${signal}, shutting down`);
    shutdown();
  });
}

process.on('uncaughtException', (error) => {
  console.error(`[${SERVICE_NAME}] uncaught exception`, error);
  process.exitCode = 1;
  shutdown();
});

function send(res: ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function normalisePort(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normaliseInteger(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function shouldSkipHaruspex(): boolean {
  const env = process.env.PHASE6_SKIP_HARUSPEX;
  if (env === '0') {
    return false;
  }
  if (env === '1') {
    return true;
  }
  // Default to skipping until real backend integration is restored.
  return true;
}

function log(message: string): void {
  const elapsedMs = Date.now() - startTimestamp;
  // eslint-disable-next-line no-console
  console.log(`[${SERVICE_NAME}] ${message} (${elapsedMs}ms)`);
}

function shutdown(): void {
  server.close(() => {
    log('Server stopped');
    process.exit();
  });
  // Force exit if close hangs
  createTimeout(() => {
    log('Forced shutdown');
    process.exit();
  }, 1000, { unref: true });
}

export {};

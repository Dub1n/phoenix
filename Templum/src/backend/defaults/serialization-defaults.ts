import {
  serviceRegistryEntrySchema,
  ipcHandshakeSchema,
  websocketHandshakeSchema,
  cliRequestEnvelopeSchema,
  type ServiceRegistryEntry,
  type IPCHandshakePayload,
  type WebsocketHandshakePayload,
  type CliRequestEnvelope
} from '../schemas/serialization-registry';

function sanitizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, '');
}

function currentTimestamp(): number {
  return Date.now();
}

const DEFAULT_HANDSHAKE_CAPABILITIES = [
  'context-management',
  'memory-integration',
  'semantic-search'
] as const;

function sanitizeMetadata(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const target = value as Record<string, unknown> | unknown[];

  if (seen.has(target as object)) {
    return '[Circular]';
  }

  seen.add(target as object);

  if (Array.isArray(target)) {
    return target.map(item => sanitizeMetadata(item, seen));
  }

  const entries = Object.entries(target).map(([key, entryValue]) => [key, sanitizeMetadata(entryValue, seen)]);
  return Object.fromEntries(entries);
}

export function buildServiceRegistryDefaults(
  overrides: Pick<ServiceRegistryEntry, 'id' | 'endpoint'> & Partial<ServiceRegistryEntry>
): ServiceRegistryEntry {
  const timestamp = overrides.registrationTime ?? currentTimestamp();
  const endpoint = sanitizeEndpoint(overrides.endpoint);

  const candidate: ServiceRegistryEntry = {
    id: overrides.id,
    endpoint: overrides.endpoint,
    protocol: overrides.protocol ?? 'http',
    health: overrides.health ?? `${endpoint}/health`,
    capabilities: overrides.capabilities ?? [],
    version: overrides.version ?? '1.0.0',
    registrationTime: timestamp,
    lastSeen: overrides.lastSeen ?? timestamp,
    capabilitiesEndpoint: overrides.capabilitiesEndpoint ?? `${endpoint}/capabilities`,
    versionEndpoint: overrides.versionEndpoint ?? `${endpoint}/version`,
    pid: overrides.pid,
    authentication: overrides.authentication,
    metadata: overrides.metadata ?? {}
  };

  return serviceRegistryEntrySchema.parse(candidate);
}

export function buildIPCHandshakeDefaults(
  overrides: Pick<IPCHandshakePayload, 'service'> & Partial<IPCHandshakePayload>
): IPCHandshakePayload {
  const timestamp = overrides.timestamp ?? currentTimestamp();

  const candidate: IPCHandshakePayload = {
    type: 'handshake',
    service: overrides.service,
    client: overrides.client ?? 'templum-universal-interface',
    version: overrides.version ?? '1.0.0',
    timestamp,
    protocol: 'ipc',
    capabilities: overrides.capabilities ?? [],
    authentication: overrides.authentication,
    metadata: overrides.metadata,
    pid: overrides.pid
  };

  return ipcHandshakeSchema.parse(candidate);
}

export function buildWebsocketHandshakeDefaults(
  overrides: Pick<WebsocketHandshakePayload, 'service'> & Partial<WebsocketHandshakePayload>
): WebsocketHandshakePayload {
  const timestamp = overrides.timestamp ?? currentTimestamp();

  const candidate: WebsocketHandshakePayload = {
    type: 'handshake',
    service: overrides.service,
    client: overrides.client ?? 'templum-universal-interface',
    version: overrides.version ?? '1.0.0',
    timestamp,
    protocol: 'websocket',
    capabilities: overrides.capabilities ?? [...DEFAULT_HANDSHAKE_CAPABILITIES],
    authentication: overrides.authentication,
    metadata: overrides.metadata,
    endpoint: overrides.endpoint ?? 'ws://localhost',
    channel: overrides.channel
  };

  return websocketHandshakeSchema.parse(candidate);
}

export function buildCliRequestDefaults(
  overrides: Partial<CliRequestEnvelope> = {}
): CliRequestEnvelope {
  const timestamp = overrides.timestamp ?? currentTimestamp();
  const baseId = overrides.id ?? `templum-cli-${timestamp}`;

  const candidate: CliRequestEnvelope = {
    id: baseId,
    requestId: overrides.requestId ?? baseId,
    type: overrides.type ?? 'command',
    timestamp,
    payload: overrides.payload ?? {},
    context: overrides.context ?? 'templum-cli',
    priority: overrides.priority ?? 'normal',
    retries: overrides.retries ?? 0,
    version: overrides.version ?? '1.0.0',
    metadata: overrides.metadata ?? {}
  };

  return cliRequestEnvelopeSchema.parse(candidate);
}

export interface CliCommandPayload {
  command: string;
  interfaceType: string;
  args: unknown[];
  context: Record<string, unknown>;
  timestamp: number;
}

type CliCommandPayloadInput = {
  command: string;
  interfaceType?: string;
  args?: unknown[];
  context?: Record<string, unknown>;
  timestamp?: number;
};

export function buildCliCommandPayload(input: CliCommandPayloadInput): CliCommandPayload {
  const timestamp = input.timestamp ?? currentTimestamp();

  return {
    command: input.command,
    interfaceType: input.interfaceType ?? 'cli',
    args: Array.isArray(input.args) ? [...input.args] : [],
    context: input.context ?? {},
    timestamp
  };
}

export interface CliIpcRequestPayload {
  type: string;
  data: unknown;
  requestId: string;
  responseFile: string;
  clientPid: number;
  timestamp: number;
  version: string;
  priority: 'low' | 'normal' | 'high';
}

type CliIpcRequestInput = {
  type: string;
  data: unknown;
  requestId: string;
  responseFile: string;
  clientPid: number;
  timestamp?: number;
  version?: string;
  priority?: 'low' | 'normal' | 'high';
};

export function buildCliIpcRequest(input: CliIpcRequestInput): CliIpcRequestPayload {
  return {
    type: input.type,
    data: input.data,
    requestId: input.requestId,
    responseFile: input.responseFile,
    clientPid: input.clientPid,
    timestamp: input.timestamp ?? currentTimestamp(),
    version: input.version ?? '1.1',
    priority: input.priority ?? 'normal'
  };
}

export type ObservabilityLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface ObservabilityFallbackLog {
  timestamp: number;
  level: ObservabilityLogLevel;
  source: string;
  message: string;
  metadata: Record<string, unknown>;
  correlationId?: string;
  sessionId?: string;
  interfaceType?: string;
}

export interface ObservabilityFallbackInput {
  source: string;
  message?: string;
  metadata?: Record<string, unknown>;
  error?: unknown;
  correlationId?: string;
  sessionId?: string;
  interfaceType?: string;
}

const OBSERVABILITY_FALLBACK_BASE: ObservabilityFallbackLog = {
  timestamp: 0,
  level: 'warn',
  source: 'observability:serialization-fallback',
  message: 'serialization-fallback',
  metadata: {
    fallbackReason: 'serialization-error',
    fallbackSource: 'observability',
    serializationTarget: 'log-entry'
  }
};

function resolveFallbackReason(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'serialization-error';
}

export function createObservabilityFallbackLog(input: ObservabilityFallbackInput): ObservabilityFallbackLog {
  const timestamp = currentTimestamp();
  const metadataFromInput: Record<string, unknown> = input.metadata ?? {};
  const sanitizedMetadata = sanitizeMetadata(metadataFromInput) as Record<string, unknown>;
  const rawSerializationTarget =
    typeof sanitizedMetadata['serializationTarget'] === 'string'
      ? (sanitizedMetadata['serializationTarget'] as string)
      : undefined;
  const serializationTarget = rawSerializationTarget ?? 'log-entry';

  const fallbackMetadata: Record<string, unknown> = {
    ...OBSERVABILITY_FALLBACK_BASE.metadata,
    ...sanitizedMetadata,
    fallbackReason: resolveFallbackReason(input.error),
    fallbackSource: input.source,
    serializationTarget
  };

  const fallback: ObservabilityFallbackLog = {
    ...OBSERVABILITY_FALLBACK_BASE,
    timestamp,
    source: input.source ?? OBSERVABILITY_FALLBACK_BASE.source,
    message: input.message ?? OBSERVABILITY_FALLBACK_BASE.message,
    metadata: fallbackMetadata
  };

  if (input.correlationId) {
    fallback.correlationId = input.correlationId;
  }

  if (input.sessionId) {
    fallback.sessionId = input.sessionId;
  }

  if (input.interfaceType) {
    fallback.interfaceType = input.interfaceType;
  }

  return fallback;
}

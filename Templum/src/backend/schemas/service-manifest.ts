import { z } from 'zod';
import type { BackendConfig } from '../../types/universal-skin-engine-types';
import type { ServiceRegistryEntry } from './serialization-registry';

const SUPPORTED_AUTH_TYPES: ReadonlyArray<NonNullable<BackendConfig['authentication']>['type']> = [
  'none',
  'basic',
  'bearer',
  'api-key',
  'oauth',
];

const protocolEnum = z.enum(['ipc', 'http', 'websocket']);

export const serviceManifestHealthCheckSchema = z
  .object({
    type: z.enum(['http', 'websocket', 'ipc']).default('http'),
    endpoint: z.string().trim().min(1).optional(),
    path: z.string().trim().min(1).optional(),
    timeoutMs: z.number().int().positive().optional(),
    metadata: z.record(z.unknown()).optional()
  })
  .refine(
    (value) => {
      if (value.type === 'ipc') {
        return true;
      }

      return Boolean(value.endpoint ?? value.path);
    },
    { message: 'HTTP/WebSocket health checks require an endpoint or path.' }
  );

export const serviceManifestSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().optional(),
    endpoint: z.string().trim().min(1),
    protocol: protocolEnum.default('http'),
    version: z.string().trim().min(1).default('1.0.0'),
    capabilities: z.array(z.string().trim().min(1)).default([]),
    registrationTime: z.number().int().nonnegative().optional(),
    lastSeen: z.number().int().nonnegative().optional(),
    pid: z.number().int().nonnegative().optional(),
    metadata: z.record(z.unknown()).optional(),
    authentication: z.record(z.unknown()).optional(),
    options: z.record(z.unknown()).optional(),
    healthCheck: serviceManifestHealthCheckSchema.optional(),
    health: z.string().trim().min(1).optional(),
    capabilitiesEndpoint: z.string().trim().optional(),
    versionEndpoint: z.string().trim().optional()
  })
  .strip();

export type ServiceManifest = z.infer<typeof serviceManifestSchema>;
export type ServiceManifestHealthCheck = z.infer<typeof serviceManifestHealthCheckSchema>;

export interface NormalizedServiceManifest {
  id: string;
  name?: string;
  endpoint: string;
  protocol: BackendConfig['protocol'];
  version: string;
  capabilities: string[];
  registrationTime?: number;
  lastSeen?: number;
  pid?: number;
  metadata?: Record<string, unknown>;
  authentication?: BackendConfig['authentication'];
  options?: Record<string, unknown>;
  healthCheck?: ServiceManifestHealthCheck;
  capabilitiesEndpoint?: string;
  versionEndpoint?: string;
}

export function resolveHealthEndpoint(manifest: NormalizedServiceManifest): string | undefined {
  const healthCheck = manifest.healthCheck;

  if (!healthCheck) {
    return undefined;
  }

  if (healthCheck.endpoint) {
    return healthCheck.endpoint;
  }

  if (!healthCheck.path) {
    if (healthCheck.type === 'ipc') {
      return manifest.endpoint;
    }

    return joinUrl(manifest.endpoint, '/health');
  }

  return joinUrl(manifest.endpoint, healthCheck.path);
}

function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) {
    return path;
  }

  const sanitizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${sanitizedBase}${sanitizedPath}`;
}

export function normalizeServiceManifest(raw: unknown): NormalizedServiceManifest | null {
  const parsed = serviceManifestSchema.safeParse(raw);

  if (!parsed.success) {
    return null;
  }

  const manifest = parsed.data;

  const healthCheck: ServiceManifestHealthCheck | undefined = manifest.healthCheck
    ? manifest.healthCheck
    : manifest.health
        ? {
            type: manifest.protocol === 'websocket' ? 'websocket' : manifest.protocol === 'ipc' ? 'ipc' : 'http',
            endpoint: manifest.health
          }
        : undefined;

  const authentication = normalizeAuthentication(manifest.authentication);

  return {
    id: manifest.id,
    name: manifest.name,
    endpoint: manifest.endpoint,
    protocol: manifest.protocol,
    version: manifest.version,
    capabilities: [...manifest.capabilities],
    registrationTime: manifest.registrationTime,
    lastSeen: manifest.lastSeen,
    pid: manifest.pid,
    metadata: manifest.metadata,
    authentication,
    options: manifest.options,
    healthCheck,
    capabilitiesEndpoint: manifest.capabilitiesEndpoint,
    versionEndpoint: manifest.versionEndpoint
  } satisfies NormalizedServiceManifest;
}

export function manifestFromRegistryEntry(entry: ServiceRegistryEntry): NormalizedServiceManifest {
  const healthCheck: ServiceManifestHealthCheck = {
    type: entry.protocol === 'websocket' ? 'websocket' : entry.protocol === 'ipc' ? 'ipc' : 'http',
    endpoint: entry.health
  };

  const authentication = normalizeAuthentication(entry.authentication as Record<string, unknown> | undefined);

  return {
    id: entry.id,
    endpoint: entry.endpoint,
    protocol: entry.protocol,
    version: entry.version,
    capabilities: [...entry.capabilities],
    registrationTime: entry.registrationTime,
    lastSeen: entry.lastSeen,
    pid: entry.pid,
    metadata: entry.metadata as Record<string, unknown> | undefined,
    authentication,
    options: (entry as Record<string, unknown>).options as Record<string, unknown> | undefined,
    healthCheck,
    capabilitiesEndpoint: entry.capabilitiesEndpoint,
    versionEndpoint: entry.versionEndpoint
  };
}

export interface ServiceManifestToBackendConfigOptions {
  timeout?: number;
}

export function buildBackendConfigFromManifest(
  manifest: NormalizedServiceManifest,
  options: ServiceManifestToBackendConfigOptions = {}
): BackendConfig {
  return {
    service: manifest.id,
    version: manifest.version,
    protocol: manifest.protocol,
    endpoint: manifest.endpoint,
    timeout: options.timeout,
    retries: 2,
    keepAlive: true,
    authentication: manifest.authentication,
    capabilities: manifest.capabilities.length ? [...manifest.capabilities] : undefined,
    capabilitiesEndpoint: manifest.capabilitiesEndpoint,
    versionEndpoint: manifest.versionEndpoint,
    healthEndpoint: resolveHealthEndpoint(manifest),
    options: manifest.options as BackendConfig['options']
  } satisfies BackendConfig;
}

function normalizeAuthentication(source: Record<string, unknown> | undefined): BackendConfig['authentication'] {
  if (!source || typeof source !== 'object') {
    return { type: 'none' };
  }

  const typeCandidate = typeof source.type === 'string' ? (source.type as string) : undefined;

  if (!typeCandidate || !SUPPORTED_AUTH_TYPES.includes(typeCandidate as NonNullable<BackendConfig['authentication']>['type'])) {
    return { type: 'none' };
  }

  const credentialsCandidate = source.credentials;
  const credentials = credentialsCandidate && typeof credentialsCandidate === 'object'
    ? Object.fromEntries(
        Object.entries(credentialsCandidate as Record<string, unknown>).filter(
          (entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string',
        ),
      )
    : undefined;

  const requiredCandidate = source.required;

  return {
    type: typeCandidate as NonNullable<BackendConfig['authentication']>['type'],
    credentials,
    required: typeof requiredCandidate === 'boolean' ? requiredCandidate : undefined,
  };
}

export function serializeServiceManifest(manifest: ServiceManifest, prettySpacing = 2): string {
  const normalized = serviceManifestSchema.parse(manifest);
  return JSON.stringify(normalized, null, prettySpacing);
}

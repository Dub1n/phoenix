import { z } from 'zod';

const protocolEnum = z.enum(['ipc', 'http', 'websocket']);

const authenticationSchema = z
  .object({
    type: z.string().min(1),
    token: z.string().optional(),
    credentials: z.unknown().optional(),
    strategy: z.string().optional()
  })
  .partial();

const capabilityArraySchema = z.array(z.string().min(1));

export const serviceRegistryEntrySchema = z
  .object({
    id: z.string().min(1, 'Service id is required'),
    endpoint: z.string().min(1, 'Endpoint is required'),
    protocol: protocolEnum,
    health: z.string().min(1, 'Health endpoint is required'),
    capabilities: capabilityArraySchema,
    version: z.string().min(1, 'Version is required'),
    registrationTime: z.number().int().nonnegative(),
    lastSeen: z.number().int().nonnegative(),
    pid: z.number().int().nonnegative().optional(),
    authentication: authenticationSchema.optional(),
    metadata: z.record(z.unknown()).optional(),
    capabilitiesEndpoint: z.string().optional(),
    versionEndpoint: z.string().optional()
  })
  .passthrough();

export const serviceRegistrySchema = z
  .object({
    services: z.record(serviceRegistryEntrySchema),
    version: z.number().int().nonnegative(),
    lastUpdated: z.number().int().nonnegative()
  })
  .passthrough();

const handshakeBaseSchema = z
  .object({
    type: z.literal('handshake'),
    service: z.string().min(1, 'Service name is required'),
    client: z.string().min(1, 'Client identifier is required'),
    version: z.string().min(1, 'Handshake version is required'),
    timestamp: z.number().int().nonnegative(),
    capabilities: capabilityArraySchema,
    authentication: authenticationSchema.optional(),
    metadata: z.record(z.unknown()).optional()
  })
  .passthrough();

export const ipcHandshakeSchema = handshakeBaseSchema.extend({
  protocol: z.literal('ipc'),
  pid: z.number().int().nonnegative().optional()
});

export const websocketHandshakeSchema = handshakeBaseSchema.extend({
  protocol: z.literal('websocket'),
  endpoint: z.string().min(1).optional(),
  channel: z.string().optional()
});

export const cliRequestEnvelopeSchema = z
  .object({
    id: z.string().min(1, 'Request id is required'),
    requestId: z.string().min(1, 'Request correlation id is required'),
    type: z.string().min(1, 'Request type is required'),
    timestamp: z.number().int().nonnegative(),
    payload: z.unknown(),
    context: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high']),
    retries: z.number().int().nonnegative(),
    version: z.string().min(1, 'Payload version is required'),
    metadata: z.record(z.unknown()).optional()
  })
  .passthrough();

export type ServiceRegistryEntry = z.infer<typeof serviceRegistryEntrySchema>;
export type ServiceRegistryDocument = z.infer<typeof serviceRegistrySchema>;
export type IPCHandshakePayload = z.infer<typeof ipcHandshakeSchema>;
export type WebsocketHandshakePayload = z.infer<typeof websocketHandshakeSchema>;
export type CliRequestEnvelope = z.infer<typeof cliRequestEnvelopeSchema>;

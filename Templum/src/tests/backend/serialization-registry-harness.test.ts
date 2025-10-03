import { jest } from '@jest/globals';
import { serialization } from '../../utils/serialization-utils';
import {
  serviceRegistryEntrySchema,
  ipcHandshakeSchema,
  websocketHandshakeSchema,
  cliRequestEnvelopeSchema
} from '../../backend/schemas/serialization-registry';
import {
  buildServiceRegistryDefaults,
  buildIPCHandshakeDefaults,
  buildWebsocketHandshakeDefaults,
  buildCliRequestDefaults
} from '../../backend/defaults/serialization-defaults';

describe('serialization registry helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-02T15:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('produces registry defaults compatible with the schema', () => {
    const defaults = buildServiceRegistryDefaults({
      id: 'templum-core',
      endpoint: 'http://localhost:4600'
    });

    expect(() => serviceRegistryEntrySchema.parse(defaults)).not.toThrow();
  });

  it('validates IPC handshake payloads via schema', () => {
    const handshake = buildIPCHandshakeDefaults({ service: 'templum-backend-router' });

    expect(() => ipcHandshakeSchema.parse(handshake)).not.toThrow();
  });

  it('applies websocket handshake defaults when fields are missing', () => {
    const minimal = { type: 'handshake', service: 'templum-backend-router' };
    const defaults = buildWebsocketHandshakeDefaults({ service: 'templum-backend-router' });

    const result = serialization
      .fromJson(JSON.stringify(minimal))
      .context('tests:websocket-handshake')
      .withSchema(websocketHandshakeSchema)
      .withDefaults(defaults)
      .parse();

    expect(result.ok).toBe(true);
    expect(result.status).toBe('defaults');
    expect(result.value).toMatchObject({
      type: 'handshake',
      service: 'templum-backend-router',
      protocol: 'websocket',
      client: defaults.client,
      version: defaults.version
    });
    expect(result.meta.warnings).toContain('Schema validation failed; applied defaults');
  });

  it('falls back to CLI request defaults when JSON parsing fails', () => {
    const fallback = buildCliRequestDefaults({ type: 'command', payload: { command: 'status' } });

    const result = serialization
      .fromJson('{"id": }')
      .context('tests:cli-envelope')
      .withSchema(cliRequestEnvelopeSchema)
      .fallback(fallback)
      .parse();

    expect(result.ok).toBe(true);
    expect(result.status).toBe('fallback');
    expect(result.value).toEqual(fallback);
    expect(result.meta.warnings).toContain('Failed to parse JSON; using fallback value');
  });
});

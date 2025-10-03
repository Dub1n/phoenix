import {
  ProtocolSession,
  ProtocolAdapter,
  ProtocolConfig,
  ProtocolMessage,
  ProtocolTransport,
} from '../../utils/protocol-utils';
import { createLogger } from '../../utils/logger';

describe('ProtocolSession', () => {
  const sessions: ProtocolSession[] = [];

  const createSession = (configOverrides: Partial<ProtocolConfig> = {}) => {
    const transport: ProtocolTransport = {
      id: 'transport-1',
      type: 'ipc',
      async send(): Promise<void> {
        // no-op for tests
      },
      async close(): Promise<void> {
        // no-op for tests
      },
      isConnected(): boolean {
        return true;
      },
    };

    const adapter: ProtocolAdapter = {
      type: 'ipc',
      name: 'fake-ipc',
      async connect(): Promise<ProtocolTransport> {
        return transport;
      },
    };

    const config: ProtocolConfig = {
      type: 'ipc',
      connection: {},
      ...configOverrides,
    };

    const session = new ProtocolSession(adapter, transport, config, createLogger('protocol-session-test'));
    sessions.push(session);
    return session;
  };

  afterEach(async () => {
    await Promise.all(sessions.map((session) => session.close()));
    sessions.length = 0;
  });

  test('throws templum error when attempting to send invalid messages', async () => {
    const session = createSession();

    const invalidMessage: ProtocolMessage = {
      type: '',
      payload: undefined,
    };

    await expect(session.send(invalidMessage)).rejects.toMatchObject({
      code: 'PROTOCOL_MESSAGE_INVALID',
      context: expect.objectContaining({
        issues: expect.arrayContaining([expect.objectContaining({ type: 'missing-field' })]),
      }),
    });
  });

  test('succeeds for structurally valid messages', async () => {
    const session = createSession();

    const validMessage: ProtocolMessage = {
      type: 'get_status',
      payload: { requestId: 'abc' },
    };

    await expect(session.send(validMessage)).resolves.toBeUndefined();
  });

  test('rejects configs without a protocol type', () => {
    const adapter: ProtocolAdapter = {
      type: 'ipc',
      name: 'fake-ipc',
      async connect(): Promise<ProtocolTransport> {
        return {
          id: 'transport-2',
          type: 'ipc',
          async send() {},
          async close() {},
          isConnected: () => true,
        };
      },
    };

    const transport: ProtocolTransport = {
      id: 'transport-2',
      type: 'ipc',
      async send() {},
      async close() {},
      isConnected: () => true,
    };

    expect(() =>
      new ProtocolSession(
        adapter,
        transport,
        { connection: {} } as unknown as ProtocolConfig,
        createLogger('protocol-session-test'),
      ),
    ).toThrow(
      expect.objectContaining({
        code: 'PROTOCOL_CONFIG_INVALID',
        context: expect.objectContaining({ field: 'type' }),
      }),
    );
  });

  test('rejects configs with non-object connection details', () => {
    const adapter: ProtocolAdapter = {
      type: 'ipc',
      name: 'fake-ipc',
      async connect(): Promise<ProtocolTransport> {
        return {
          id: 'transport-3',
          type: 'ipc',
          async send() {},
          async close() {},
          isConnected: () => true,
        };
      },
    };

    const transport: ProtocolTransport = {
      id: 'transport-3',
      type: 'ipc',
      async send() {},
      async close() {},
      isConnected: () => true,
    };

    expect(() =>
      new ProtocolSession(
        adapter,
        transport,
        { type: 'ipc', connection: 'invalid' as any } as ProtocolConfig,
        createLogger('protocol-session-test'),
      ),
    ).toThrow(
      expect.objectContaining({
        code: 'PROTOCOL_CONFIG_INVALID',
        context: expect.objectContaining({ field: 'connection' }),
      }),
    );
  });

});

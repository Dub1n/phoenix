import { z } from 'zod';
import { serialization } from '../../utils/serialization-utils';
import { LoggerConfig, LogLevel } from '../../utils/logger';

describe('serialization-utils', () => {
  beforeAll(() => {
    LoggerConfig.configure({
      structured: false,
      transport: { log: () => { /* silence logger during tests */ } }
    });
    LoggerConfig.setLevel(LogLevel.ERROR);
  });

  it('stringifies objects with metadata and no warnings', () => {
    const payload = { id: 'svc-42', nested: { status: 'ok' } };

    const result = serialization
      .json(payload)
      .context('tests:payload')
      .stringify();

    expect(result.ok).toBe(true);
    expect(result.status).toBe('success');
    expect(result.value).toBe(JSON.stringify(payload));
    expect(result.meta.bytes).toBe(Buffer.byteLength(result.value!, 'utf8'));
    expect(result.meta.context).toBe('tests:payload');
    expect(result.meta.warnings).toHaveLength(0);
  });

  it('enforces maximum size and uses fallback when exceeded', () => {
    const bigPayload = { data: 'x'.repeat(128) };

    const result = serialization
      .json(bigPayload)
      .context('tests:max-bytes')
      .maxBytes(32)
      .fallback('{}')
      .stringify();

    expect(result.ok).toBe(true);
    expect(result.status).toBe('fallback');
    expect(result.value).toBe('{}');
    expect(result.error).toBeDefined();
    expect(result.meta.warnings).toContain('Serialization failed; using fallback value');
  });

  it('masks sensitive fields and records masked metadata', () => {
    const payload = { token: 'secret', nested: { secret: 'nested-value' } };

    const result = serialization
      .json(payload)
      .context('tests:masking')
      .mask(['token', 'secret'])
      .stringify();

    expect(result.ok).toBe(true);
    expect(result.status).toBe('success');
    expect(result.value).toContain('"token":"[masked]"');
    expect(result.value).toContain('"secret":"[masked]"');
    expect(result.meta.maskedFields).toEqual(expect.arrayContaining(['token', 'secret']));
  });

  it('handles circular references without throwing', () => {
    const payload: any = { id: 'loop' };
    payload.self = payload;

    const result = serialization
      .json(payload)
      .context('tests:circular')
      .stringify();

    expect(result.ok).toBe(true);
    expect(result.status).toBe('success');
    expect(result.value).toContain('"self":"[Circular]"');
  });

  it('parses JSON with schema validation and applies defaults when needed', () => {
    const schema = z.object({
      id: z.string(),
      retries: z.number().min(0)
    });

    const result = serialization
      .fromJson('{"id":"backend-1"}')
      .withSchema(schema)
      .withDefaults({ retries: 3 })
      .parse();

    expect(result.ok).toBe(true);
    expect(result.status).toBe('defaults');
    expect(result.value).toEqual({ id: 'backend-1', retries: 3 });
    expect(result.meta.warnings).toContain('Schema validation failed; applied defaults');
  });

  it('returns fallback when JSON is invalid', () => {
    const fallback = { id: 'fallback-service', retries: 0 };

    const result = serialization
      .fromJson('{"id": }')
      .context('tests:invalid-json')
      .fallback(fallback)
      .parse();

    expect(result.ok).toBe(true);
    expect(result.status).toBe('fallback');
    expect(result.value).toEqual(fallback);
    expect(result.error).toBeDefined();
    expect(result.meta.warnings).toContain('Failed to parse JSON; using fallback value');
  });

  it('respects revivers during parsing', () => {
    const result = serialization
      .fromJson('{"timestamp": 1725148800000}')
      .context('tests:reviver')
      .reviver((key, value) => (key === 'timestamp' ? new Date(value) : value))
      .parse();

    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ timestamp: new Date(1725148800000) });
  });

  it('returns error status when schema validation fails without defaults or fallback', () => {
    const schema = z.object({ id: z.string(), retries: z.number() });

    const result = serialization
      .fromJson('{"id":"missing-retries"}')
      .context('tests:schema-error')
      .withSchema(schema)
      .parse();

    expect(result.ok).toBe(false);
    expect(result.status).toBe('error');
    expect(result.error).toBeDefined();
    expect(result.meta.warnings).toHaveLength(0);
  });
});

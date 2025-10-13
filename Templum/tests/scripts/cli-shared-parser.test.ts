import path from 'path';
import { execFileSync } from 'child_process';

type ProbeResult = Record<string, unknown>;

const probe = (...args: string[]): ProbeResult => {
  const result = execFileSync('node', [path.resolve(__dirname, 'helpers/cli-parser-probe.mjs'), ...args], {
    encoding: 'utf8'
  });
  return JSON.parse(result.trim()) as ProbeResult;
};

describe('CLI shared parser', () => {
  test('merges repeated plan-file flags for claim command', () => {
    const payload = JSON.stringify([
      '101',
      '--stage',
      '4',
      '--plan-files',
      'web/app.ts,web/app.css',
      '--plan-files',
      'docs/spec.md'
    ]);
    const output = probe('plan-files', payload);
    expect(output.planFiles as string[]).toEqual(['web/app.ts', 'web/app.css', 'docs/spec.md']);
  });

  test('captures acknowledgement note and timestamp ordering', () => {
    const payload = JSON.stringify([
      '101',
      '--add-ack',
      'QA',
      '--ack-note',
      'Confirmed',
      '--ack-timestamp',
      '2025-01-01T00:00:00Z'
    ]);
    const output = probe('ack-sequence', payload);
    expect(output.addAcks as Array<Record<string, string>>).toEqual([
      {
        agent: 'QA',
        note: 'Confirmed',
        timestamp: '2025-01-01T00:00:00Z'
      }
    ]);
  });

  test('rejects acknowledgement metadata before ack declaration', () => {
    const payload = JSON.stringify(['101', '--ack-note', 'oops']);
    const output = probe('ack-sequence-error', payload);
    expect(typeof output.error).toBe('string');
    expect((output.error as string)).toContain('--ack-note must follow --add-ack');
  });

  test('resolves help aliases to canonical descriptor', () => {
    const payload = JSON.stringify(['claim']);
    const output = probe('help-alias', payload);
    expect(output.name).toBe('help');
    expect(output.command).toBe('claim');
  });
});

import { describe, expect, it } from '@jest/globals';
import path from 'path';
import { pathToFileURL } from 'url';

const dynamicImport: (specifier: string) => Promise<any> = new Function(
  'specifier',
  'return import(specifier);'
) as (specifier: string) => Promise<any>;

async function loadCliModule() {
  const moduleUrl = pathToFileURL(path.resolve(__dirname, '../cli-command-stub.mjs')).href;
  return dynamicImport(moduleUrl);
}

describe('auto-blocking cascade guardrails', () => {
  describe('reopenDownstreamStageGates', () => {
    it('resets downstream gates to pending when an upstream stage reopens', async () => {
      const { reopenDownstreamStageGates } = await loadCliModule();
      const pattern = {
        patternId: 'pattern-104',
        stageGates: {
          '1': { status: 'complete' },
          '2': { status: 'complete' },
          '3': { status: 'pending' },
          '4': { status: 'complete', completedAt: '2025-01-01T12:00:00.000Z' },
          '5': {
            status: 'complete',
            completedAt: '2025-01-02T12:00:00.000Z',
            startedAt: '2025-01-01T09:30:00.000Z',
            elapsedMs: 3600000
          },
          '6': { status: 'in_progress' },
          '7': { status: 'complete' }
        }
      };
      const registry = { patterns: [pattern], cohorts: [] };

      const result = reopenDownstreamStageGates(registry as any, pattern as any, '3');

      expect(result.stageIds).toEqual(['5', '7']);
      expect(result.cohortSegments).toEqual([]);
      expect(pattern.stageGates?.['4']?.status).toBe('complete');
      expect(pattern.stageGates?.['4']?.completedAt).toBe('2025-01-01T12:00:00.000Z');
      expect(pattern.stageGates?.['5']?.status).toBe('pending');
      expect(pattern.stageGates?.['5']?.completedAt).toBeUndefined();
      expect(pattern.stageGates?.['5']?.startedAt).toBeUndefined();
      expect(pattern.stageGates?.['5']?.elapsedMs).toBeUndefined();
      expect(pattern.stageGates?.['6']?.status).toBe('in_progress');
      expect(pattern.stageGates?.['7']?.status).toBe('pending');
      expect(pattern.stageGates?.['2']?.status).toBe('complete');
    });
    it('preserves Stage 5A cohorts when Stage 5 resets its own downstream gates', async () => {
      const { reopenDownstreamStageGates } = await loadCliModule();
      const pattern = {
        patternId: 'pattern-205',
        cohorts: ['A'],
        stageGates: {
          '5': { status: 'pending' },
          '6': {
            status: 'complete',
            completedAt: '2025-02-02T10:00:00.000Z',
            startedAt: '2025-02-02T09:00:00.000Z',
            elapsedMs: 3600000
          },
          '7': { status: 'complete', completedAt: '2025-02-05T18:00:00.000Z' }
        }
      };
      const registry = {
        patterns: [pattern],
        cohorts: [
          {
            id: 'A',
            stages: {
              '5a': { segment: '5a', status: 'complete', completedAt: '2025-02-01T12:00:00.000Z' }
            }
          }
        ]
      };

      const result = reopenDownstreamStageGates(registry as any, pattern as any, '5');

      expect(result.stageIds).toEqual(['6', '7']);
      expect(result.cohortSegments).toEqual([]);
      expect(pattern.stageGates?.['6']?.status).toBe('pending');
      expect(pattern.stageGates?.['6']?.completedAt).toBeUndefined();
      expect(pattern.stageGates?.['7']?.status).toBe('pending');
      expect(pattern.stageGates?.['7']?.completedAt).toBeUndefined();
      expect(registry.cohorts?.[0]?.stages?.['5a']?.status).toBe('complete');
    });
    it.todo('reopens Stage 5A cohort segments and peer Stage 5/6 gates when stages 1-4 reopen');
  });

  describe('promoteDependentLanes', () => {
    it('only unblocks dependent lanes that belong to later stages', async () => {
      const { promoteDependentLanes } = await loadCliModule();
      const pattern = {
        patternId: 'pattern-205',
        lanes: {
          '5a': { status: 'complete' },
          '5b': {
            status: 'blocked',
            dependencies: [{ patternId: 'pattern-205', gate: 'lane-5a' }]
          },
          '6a': {
            status: 'blocked',
            dependencies: [{ patternId: 'pattern-205', gate: 'lane-5a' }]
          }
        }
      };
      const registry = { patterns: [pattern], cohorts: [] };

      const promoted = promoteDependentLanes(registry as any, pattern as any, '5a');

      expect(promoted).toEqual(['6a']);
      expect(pattern.lanes?.['5b']?.status).toBe('blocked');
      expect(pattern.lanes?.['6a']?.status).toBe('pending');
      expect(pattern.lanes?.['6a']?.notes).toContain('Auto-unblocked after lane 5a completion');
    });

    it('still unblocks higher-stage lanes when dependencies clear', async () => {
      const { promoteDependentLanes } = await loadCliModule();
      const pattern = {
        patternId: 'pattern-306',
        lanes: {
          '3a': { status: 'complete' },
          '4a': {
            status: 'blocked',
            dependencies: [{ patternId: 'pattern-306', gate: 'lane-3a' }]
          },
          '5a': {
            status: 'blocked',
            dependencies: [{ patternId: 'pattern-306', gate: 'lane-3a' }]
          }
        }
      };
      const registry = { patterns: [pattern], cohorts: [] };

      const promoted = promoteDependentLanes(registry as any, pattern as any, '3a');

      expect(promoted).toEqual(['4a', '5a']);
      expect(pattern.lanes?.['4a']?.status).toBe('pending');
      expect(pattern.lanes?.['5a']?.status).toBe('pending');
    });
  });

  describe('CLI integration', () => {
    it.todo('preserves completed Stage 5 peers when the same stage is reclaimed and reopened');
    it.todo('reopens cohort peers when Stage 3 returns to pending');
    it.todo('records cascade output so coordinators can action reopened scopes');
  });
});

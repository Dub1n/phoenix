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

describe('Stage 5 alignment propagation', () => {
  it('removes alignment spec from Stage 5 plan files and records a Stage 5 note', async () => {
    const { propagateCohortStagePlanFiles } = await loadCliModule();
    const pattern = {
      patternId: 'pattern-301',
      name: 'Pattern 301',
      stageGates: {
        '5': {
          plannedFiles: ['dev/architecture/shared-alignment.md', 'src/runtime.ts']
        }
      },
      notes: []
    };
    const registry = { patterns: [pattern] };
    const cohort = { id: 'A', patterns: ['pattern-301'] };

    const updates = propagateCohortStagePlanFiles(
      registry as any,
      cohort as any,
      '5a',
      ['dev/architecture/shared-alignment.md']
    );

    expect(updates).toHaveLength(1);
    expect(updates[0].patternId).toBe('pattern-301');
    expect(updates[0].removedPlanFiles).toEqual(['dev/architecture/shared-alignment.md']);
    expect(updates[0].noteAction).toBe('added');
    expect(pattern.stageGates?.['5']?.plannedFiles).toEqual(['src/runtime.ts']);
    expect(pattern.notes?.some((note: any) => note.scope?.includes('stage-5'))).toBe(true);
    const stage5Note = pattern.notes?.find((note: any) => note.scope?.includes('stage-5'));
    expect(stage5Note?.body).toContain('dev/architecture/shared-alignment.md');
    expect(pattern.updatedAt).toBeDefined();
  });

  it('refreshes the Stage 5 note when the alignment spec path changes', async () => {
    const { propagateCohortStagePlanFiles } = await loadCliModule();
    const pattern = {
      patternId: 'pattern-302',
      name: 'Pattern 302',
      stageGates: {
        '5': {
          plannedFiles: ['src/runtime.ts']
        }
      },
      notes: [
        {
          id: 'stage-5-alignment-old',
          timestamp: '2025-10-11T10:00:00Z',
          body: 'Stage 5B alignment spec reference: dev/architecture/original-spec.md. Stage 5 plan-files intentionally exclude the shared alignment record.',
          scope: ['stage-5']
        }
      ],
      updatedAt: '2025-10-11T10:00:00Z'
    };
    const registry = { patterns: [pattern] };
    const cohort = { id: 'B', patterns: ['pattern-302'] };

    const updates = propagateCohortStagePlanFiles(
      registry as any,
      cohort as any,
      '5a',
      ['dev/architecture/revised-spec.md']
    );

    expect(updates).toHaveLength(1);
    expect(updates[0].patternId).toBe('pattern-302');
    expect(updates[0].removedPlanFiles).toEqual([]);
    expect(updates[0].noteAction).toBe('updated');
    expect(pattern.stageGates?.['5']?.plannedFiles).toEqual(['src/runtime.ts']);
    const stage5Notes = pattern.notes?.filter((note: any) => note.scope?.includes('stage-5')) ?? [];
    expect(stage5Notes).toHaveLength(1);
    expect(stage5Notes[0]?.body).toContain('dev/architecture/revised-spec.md');
    expect(stage5Notes[0]?.body).not.toContain('dev/architecture/original-spec.md');
    expect(pattern.updatedAt).not.toBe('2025-10-11T10:00:00Z');
  });
});

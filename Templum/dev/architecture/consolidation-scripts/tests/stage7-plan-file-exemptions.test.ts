import { describe, expect, it } from '@jest/globals';
import path from 'path';
import { pathToFileURL } from 'url';

const dynamicImport: (specifier: string) => Promise<any> = new Function(
  'specifier',
  'return import(specifier);'
) as (specifier: string) => Promise<any>;

async function loadPlanFileUtils() {
  const moduleUrl = pathToFileURL(
    path.resolve(__dirname, '../modules/plan-file-utils.mjs')
  ).href;
  return dynamicImport(moduleUrl);
}

async function loadScheduleTools() {
  const moduleUrl = pathToFileURL(
    path.resolve(__dirname, '../schedule-tools.mjs')
  ).href;
  return dynamicImport(moduleUrl);
}

async function loadCliModule() {
  const moduleUrl = pathToFileURL(
    path.resolve(__dirname, '../cli-command-stub.mjs')
  ).href;
  return dynamicImport(moduleUrl);
}

describe('Stage 7 plan-file exemptions', () => {
  it('ignores Stage 7 gates when collecting active plan-file maps', async () => {
    const { collectActivePlanFileMap } = await loadPlanFileUtils();
    const pattern = {
      stageGates: {
        '7': { status: 'in_progress', plannedFiles: ['Templum/'] }
      },
      lanes: {
        '6a': { status: 'in_progress', plannedFiles: ['Templum/src/runtime.ts'] }
      }
    };

    const activeMap = collectActivePlanFileMap(pattern, 'lane-6a');

    expect(activeMap.has('templum/')).toBe(false);
  });

  it('does not surface Stage 7 gates as registry plan-file conflicts', async () => {
    const { hasRegistryPlanConflict } = await loadPlanFileUtils();
    const registry = {
      patterns: [
        {
          patternId: 'A',
          stageGates: {
            '7': { status: 'in_progress', plannedFiles: ['Templum/'] }
          }
        },
        {
          patternId: 'B',
          lanes: {}
        }
      ]
    };

    const conflict = hasRegistryPlanConflict(
      registry,
      ['Templum/'],
      'B',
      'lane-6a'
    );

    expect(conflict).toEqual({ conflict: false, conflicts: [] });
  });

  it('still reports conflicts for overlapping Stage 6 lanes', async () => {
    const { hasRegistryPlanConflict } = await loadPlanFileUtils();
    const registry = {
      patterns: [
        {
          patternId: 'A',
          lanes: {
            '6a': { status: 'in_progress', plannedFiles: ['Templum/'] }
          }
        },
        {
          patternId: 'B',
          lanes: {}
        }
      ]
    };

    const conflict = hasRegistryPlanConflict(
      registry,
      ['Templum/'],
      'B',
      'lane-6a'
    );

    expect(conflict.conflict).toBe(true);
    expect(conflict.conflicts).toContain('pattern-A:lane-6a');
  });

  it('keeps Stage 6 lanes pending when Stage 7 holds the repo root plan-file and upstream lanes depend on them', async () => {
    const { buildSchedule } = await loadScheduleTools();
    const cliModule = await loadCliModule();
    const { autoUpdateAllPatternStatuses } = cliModule;
    const registry = {
      patterns: [
        {
          patternId: '1',
          stageGates: {
            '5': { status: 'complete' },
            '7': { status: 'pending', plannedFiles: ['Templum/'] }
          },
          lanes: {
            '6a': { status: 'complete', plannedFiles: ['Templum/'] }
          }
        },
        {
          patternId: '2',
          stageGates: {
            '5': { status: 'complete' }
          },
          lanes: {
            '6j': {
              status: 'blocked',
              plannedFiles: ['Templum/'],
              dependencies: [{ patternId: '2', gate: 'lane-6k' }]
            },
            '6k': { status: 'blocked', plannedFiles: ['Templum/'] }
          }
        }
      ],
      cohorts: []
    };

    autoUpdateAllPatternStatuses(registry);
    const schedule = buildSchedule(registry);
    const stage6kTask = schedule.waves
      .flatMap((wave) => wave.tasks)
      .find((task) => String(task.patternId) === '2' && task.scope === 'lane-6k');

    expect(stage6kTask).toBeDefined();
    expect(stage6kTask?.status).toBe('pending');
    expect(stage6kTask?.isBlocked).toBeFalsy();

    const stage6jTask = schedule.waves
      .flatMap((wave) => wave.tasks)
      .find((task) => String(task.patternId) === '2' && task.scope === 'lane-6j');

    expect(stage6jTask).toBeDefined();
    expect(stage6jTask?.status).toBe('blocked');
    expect(stage6jTask?.dependencies?.some((dep) => dep.scope === 'lane-6k')).toBe(true);
  });
});

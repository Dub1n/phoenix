#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { renderScheduleMarkdown } from './schedule-markdown.mjs';
import { renderScheduleJson } from './schedule-json.mjs';
import { enforceNoteIndentation } from './schedule-format-helpers.mjs';
import { cliPaths, registryPath, resolveRepoPath } from './modules/environment.mjs';

const schedulesDir = cliPaths.schedulesDir;

const stageOrder = ['1', '2', '3', '4', '5', '6', '7'];
const includedStageIds = new Set(['1', '2', '3', '5', '7']);
const stageCompletionStatuses = new Set(['complete', 'ready']);
const stageFinalStatuses = new Set(['deferred', 'cancelled']);
const laneCompletionStatuses = new Set(['complete', 'ready_for_handoff']);
const laneFinalStatuses = new Set(['deferred', 'cancelled']);
const blockedStatuses = new Set(['blocked']);
const autoBlockEligibleStatuses = new Set(['pending', 'waiting', 'planned', 'scheduled']);
const activeBlockingStatuses = new Set(['pending', 'waiting', 'planned', 'scheduled', 'in_progress', 'blocked']);
const autoLaneStatuses = new Set(['pending', 'blocked']);

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function normaliseScope(scope) {
  if (!scope) {
    return '';
  }
  return String(scope).toLowerCase();
}

function createDependency(patternId, scope, options = {}) {
  if (!scope) {
    return null;
  }
  return {
    patternId,
    scope: normaliseScope(scope),
    isDefault: Boolean(options.isDefault)
  };
}

function roundUpToMinutes(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return null;
  }
  const minutes = Math.ceil(ms / 60000);
  return minutes > 0 ? minutes : null;
}

function deriveStageFocus(pattern, stageId) {
  const patternName = pattern?.name || `Pattern ${pattern?.patternId ?? ''}`;
  switch (stageId) {
    case '1':
      return `Inventory and scope alignment for ${patternName}`;
    case '2':
      return `Test-first utility updates across ${patternName}`;
    case '3':
      return `Migration orchestration plan for ${patternName}`;
    case '5':
      return `Cohort gating readiness for ${patternName}`;
    case '7':
      return `Final verification and wrap-up for ${patternName}`;
    default:
      return '';
  }
}

function deriveCohortFocus(cohort, segment) {
  const cohortLabel = cohort?.name || `Cohort ${normaliseCohortId(cohort?.id)}`;
  if (!segment) {
    return `Cohort coordination for ${cohortLabel}`;
  }
  const lower = String(segment).toLowerCase();
  if (lower === '5a') {
    return `Stage 5A alignment for ${cohortLabel}`;
  }
  return `${segment.toUpperCase()} alignment for ${cohortLabel}`;
}

function normalisePlanFiles(files) {
  if (!files || !files.length) {
    return [];
  }
  const unique = new Set();
  files.forEach((file) => {
    if (!file) {
      return;
    }
    const trimmed = file.trim();
    if (trimmed && trimmed !== '0') {
      unique.add(trimmed);
    }
  });
  return [...unique].sort((a, b) => a.localeCompare(b));
}

function planFileKey(value) {
  if (!value) {
    return null;
  }
  return value.trim().toLowerCase();
}

function normalizeStatus(value) {
  if (!value) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

function dependencyKey(patternId, scope) {
  return `${String(patternId)}|${scope.toLowerCase()}`;
}

function parseStageNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = Number.parseInt(String(value), 10);
  return Number.isNaN(numeric) ? null : numeric;
}

function inferStageNumberFromLaneId(laneId) {
  if (!laneId) {
    return null;
  }
  const match = String(laneId).match(/^(\d+)/);
  if (!match) {
    return null;
  }
  return parseStageNumber(match[1]);
}

function inferStageNumberFromScope(scope) {
  if (!scope) {
    return null;
  }
  if (scope.startsWith('stage-')) {
    return parseStageNumber(scope.slice(6));
  }
  if (scope.startsWith('lane-')) {
    return inferStageNumberFromLaneId(scope.slice(5));
  }
  if (scope.startsWith('cohort-')) {
    const segment = scope.slice(7);
    const digits = segment.match(/(\d+)/);
    return digits ? parseStageNumber(digits[1]) : null;
  }
  return null;
}

function isStage7Task(task) {
  if (!task) {
    return false;
  }
  if (typeof task.stageNumber === 'number') {
    return task.stageNumber === 7;
  }
  if (task.stageNumber !== undefined && task.stageNumber !== null) {
    const numeric = Number(task.stageNumber);
    if (!Number.isNaN(numeric)) {
      return numeric === 7;
    }
  }
  if (task.type === 'stage') {
    const stageId = task.stageId !== undefined && task.stageId !== null ? String(task.stageId) : '';
    if (stageId) {
      return stageId === '7';
    }
    const scope = task.scope ? String(task.scope).toLowerCase() : '';
    return scope === 'stage-7';
  }
  if (task.scope) {
    const scope = String(task.scope).toLowerCase();
    if (scope.startsWith('stage-')) {
      return scope === 'stage-7';
    }
    if (scope.startsWith('lane-')) {
      const stageNumber = inferStageNumberFromLaneId(scope.slice(5));
      return stageNumber === 7;
    }
  }
  return false;
}

function ignoresPlanCollisionBlocking(task) {
  return isStage7Task(task);
}

function dedupeDependencies(dependencies) {
  if (!dependencies || !dependencies.length) {
    return [];
  }
  const map = new Map();
  dependencies.forEach((dep) => {
    if (!dep) {
      return;
    }
    const scope = normaliseScope(dep.scope);
    const patternKey = dep.patternId !== undefined && dep.patternId !== null ? String(dep.patternId) : '';
    const key = `${patternKey}|${scope}`;
    const existing = map.get(key);
    const normalized = {
      patternId: dep.patternId,
      scope,
      isDefault: Boolean(dep.isDefault)
    };
    if (existing) {
      existing.isDefault = existing.isDefault && normalized.isDefault;
    } else {
      map.set(key, normalized);
    }
  });
  return [...map.values()];
}

function collectLaneEntriesForStage(pattern, stageNumber) {
  return Object.entries(pattern.lanes || {}).filter(([laneId]) => inferStageNumberFromLaneId(laneId) === stageNumber);
}

function collectLaneScopesForStage(pattern, stageNumber) {
  return collectLaneEntriesForStage(pattern, stageNumber).map(([laneId]) => laneScope(laneId));
}

function collectLaneDependenciesForStage(pattern, stageNumber, options = {}) {
  const patternId = pattern.patternId;
  return collectLaneScopesForStage(pattern, stageNumber)
    .map((scope) => createDependency(patternId, scope, options))
    .filter(Boolean);
}

function defaultStageStatus(stageId) {
  return stageId === '1' ? 'pending' : 'blocked';
}

function compareLaneOrder(taskA, taskB) {
  if (!taskA || !taskB) {
    return 0;
  }
  const numericA = Number.parseInt(String(taskA.patternId), 10);
  const numericB = Number.parseInt(String(taskB.patternId), 10);
  if (!Number.isNaN(numericA) && !Number.isNaN(numericB) && numericA !== numericB) {
    return numericA - numericB;
  }
  const stringA = String(taskA.patternId);
  const stringB = String(taskB.patternId);
  if (stringA !== stringB) {
    return stringA.localeCompare(stringB, undefined, { numeric: true });
  }
  const laneIdA = taskA.laneId ? String(taskA.laneId) : '';
  const laneIdB = taskB.laneId ? String(taskB.laneId) : '';
  return laneIdA.localeCompare(laneIdB, undefined, { numeric: true });
}

function normaliseCohortId(value) {
  if (!value && value !== 0) {
    return '';
  }
  return String(value).trim();
}

function cohortStageScope(segment) {
  return `cohort-${segment.toLowerCase()}`;
}

function findCohort(registry, cohortId) {
  const normalized = normaliseCohortId(cohortId).toLowerCase();
  return (registry.cohorts || []).find((entry) => normaliseCohortId(entry.id).toLowerCase() === normalized) || null;
}
export async function loadRegistry(customPath = registryPath) {
  const raw = await readFile(customPath, 'utf8');
  return JSON.parse(raw);
}

function findPattern(registry, patternId) {
  return registry.patterns.find((pattern) => pattern.patternId === patternId) || null;
}

function stageScope(stageId) {
  return `stage-${stageId}`;
}

function laneScope(laneId) {
  return `lane-${laneId.toLowerCase()}`;
}

function parsePatternsOption(value) {
  if (!value) {
    return [];
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => Number.parseInt(entry, 10)).filter((num) => !Number.isNaN(num));
    }
  } catch (_) {
    // fall through to comma parsing
  }
  return trimmed
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((num) => !Number.isNaN(num));
}

function dependencySatisfiedViaRegistry(registry, patternId, scope) {
  if (typeof patternId === 'string' && patternId.startsWith('cohort:')) {
    const cohortId = patternId.slice(7);
    const cohort = findCohort(registry, cohortId);
    if (!cohort) {
      return false;
    }
    if (scope.startsWith('cohort-')) {
      const segment = scope.slice(7);
      const entry = cohort.stages?.[segment];
      if (!entry) {
        return false;
      }
      return stageCompletionStatuses.has(entry.status || 'pending');
    }
    return false;
  }
  const targetPattern = findPattern(registry, patternId);
  if (!targetPattern) {
    return false;
  }
  if (scope.startsWith('stage-')) {
    const stageId = scope.slice(6);
    const gate = targetPattern.stageGates?.[stageId];
    if (!gate) {
      return false;
    }
    return stageCompletionStatuses.has(gate.status || 'pending');
  }
  if (scope.startsWith('lane-')) {
    const laneId = scope.slice(5);
    const lane = targetPattern.lanes?.[laneId];
    if (!lane) {
      return false;
    }
    return laneCompletionStatuses.has(lane.status || 'pending');
  }
  return false;
}


function buildCohortDependencies(registry, cohort, segment) {
  const dependencies = [];
  if (segment.toLowerCase() === '5a') {
    (cohort.patterns || []).forEach((patternId) => {
      const pattern = findPattern(registry, patternId);
      if (!pattern) {
        return;
      }
      dependencies.push(...collectLaneDependenciesForStage(pattern, 4, { isDefault: true }));
    });
  }
  return dedupeDependencies(dependencies);
}

function buildCohortStageTasks(registry, selectedPatterns, options = {}) {
  const cohortTasks = [];
  const restrict = Boolean(options.restrictToSelection);
  const allowedCohorts =
    options.cohortIds && options.cohortIds.size ? options.cohortIds : null;
  const selectedSet = selectedPatterns instanceof Set ? selectedPatterns : null;
  const selectionHasEntries = selectedSet ? selectedSet.size > 0 : false;
  (registry.cohorts || []).forEach((cohort) => {
    const normalizedId = normaliseCohortId(cohort.id);
    if (!normalizedId) {
      return;
    }
    if (allowedCohorts && allowedCohorts.size && !allowedCohorts.has(normalizedId)) {
      if (restrict) {
        return;
      }
    }
    const cohortPatterns = cohort.patterns || [];
    if (restrict) {
      if (allowedCohorts && allowedCohorts.size) {
        if (!allowedCohorts.has(normalizedId)) {
          return;
        }
      } else {
        if (!selectedSet || !selectionHasEntries) {
          return;
        }
        const intersects = cohortPatterns.some((patternId) => selectedSet.has(patternId));
        if (!intersects) {
          return;
        }
      }
    } else if (selectedSet && selectionHasEntries) {
      const intersects = cohortPatterns.some((patternId) => selectedSet.has(patternId));
      if (!intersects) {
        return;
      }
    }
    const stages = cohort.stages || {};
    const segments = new Set(Object.keys(stages));
    segments.add('5a');
    segments.forEach((segment) => {
      const entry = stages[segment] || {};
      const plannedFiles = normalisePlanFiles(entry?.plannedFiles || []);
      const stageNumber = inferStageNumberFromScope(cohortStageScope(segment));
      const dependencies = buildCohortDependencies(registry, cohort, segment);
      const normalizedSegment = String(segment).toLowerCase();
      const rawStatus = entry?.status || 'blocked';
      let status = rawStatus;
      const normalizedStatus = normalizeStatus(rawStatus) || 'blocked';
      if (normalizedSegment === '5a' && normalizedStatus === 'blocked') {
        const dependenciesSatisfied =
          !dependencies.length ||
          dependencies.every((dependency) => dependencySatisfiedViaRegistry(registry, dependency.patternId, dependency.scope));
        if (dependenciesSatisfied) {
          status = 'pending';
        }
      }
      cohortTasks.push({
        key: dependencyKey(`cohort:${normalizedId}`, cohortStageScope(segment)),
        patternId: `cohort:${normalizedId}`,
        cohortId: normalizedId,
        name: cohort.name || `Cohort ${normalizedId}`,
        scope: cohortStageScope(segment),
        status,
        type: 'cohort-stage',
        targetId: segment,
        stageNumber,
        plannedFiles,
        plannedFileKeys: plannedFiles.map(planFileKey).filter(Boolean),
        dependencies,
        elapsedMs: entry?.elapsedMs || null,
        durationMinutes: roundUpToMinutes(entry?.elapsedMs || null),
        startedAt: entry?.startedAt || null,
        isBlocked: blockedStatuses.has(status),
        focus: deriveCohortFocus(cohort, segment)
      });
    });
  });
  return cohortTasks;
}

export function collectPatternsForCohorts(registry, cohortIds) {
  const patternSet = new Set();
  (cohortIds || []).forEach((cohortId) => {
    const cohort = findCohort(registry, cohortId);
    if (!cohort) {
      return;
    }
    (cohort.patterns || []).forEach((patternId) => {
      if (!Number.isNaN(Number.parseInt(patternId, 10))) {
        patternSet.add(Number.parseInt(patternId, 10));
      } else {
        patternSet.add(patternId);
      }
    });
  });
  return [...patternSet].sort((a, b) => Number(a) - Number(b));
}

function getStageStatus(pattern, stageId) {
  if (!pattern) {
    return defaultStageStatus(stageId);
  }
  const gate = pattern.stageGates?.[stageId];
  if (!gate || !gate.status) {
    return defaultStageStatus(stageId);
  }
  return String(gate.status);
}

function isStageComplete(pattern, stageId) {
  return stageCompletionStatuses.has(getStageStatus(pattern, stageId));
}

function buildTasks(registry, selectedPatterns, options = {}) {
  const restrict = Boolean(options.restrictToSelection);
  const allowedCohorts =
    options.cohortIds && options.cohortIds.size ? options.cohortIds : null;
  const selectedIds = selectedPatterns instanceof Set ? selectedPatterns : null;
  const tasks = buildCohortStageTasks(registry, selectedIds, {
    restrictToSelection: restrict,
    cohortIds: allowedCohorts
  });
  const includePattern = (patternId) => {
    if (!restrict) {
      if (!selectedIds || selectedIds.size === 0) {
        return true;
      }
      return selectedIds.has(patternId);
    }
    if (!selectedIds) {
      return false;
    }
    return selectedIds.has(patternId);
  };
  registry.patterns.forEach((pattern) => {
    if (!includePattern(pattern.patternId)) {
      return;
    }
    stageOrder.forEach((stageId) => {
      if (!includedStageIds.has(stageId)) {
        return;
      }
      const gate = pattern.stageGates?.[stageId];
      const status = gate?.status || 'blocked';
      if (stageFinalStatuses.has(status)) {
        return;
      }
      const stageNumber = parseStageNumber(stageId);
      const dependencies = [];
      const stageIndex = stageOrder.indexOf(stageId);
      if (stageIndex > 0) {
        const prevStageId = stageOrder
          .slice(0, stageIndex)
          .reverse()
          .find((candidate) => includedStageIds.has(candidate));
        if (prevStageId) {
          const dependency = createDependency(pattern.patternId, stageScope(prevStageId), { isDefault: true });
          if (dependency) {
            dependencies.push(dependency);
          }
        }
      }
      if (stageId === '5') {
        dependencies.push(...collectLaneDependenciesForStage(pattern, 4, { isDefault: true }));
        (pattern.cohorts || []).forEach((cohortId) => {
          const normalizedCohortId = normaliseCohortId(cohortId);
          if (!normalizedCohortId) {
            return;
          }
          const cohortDependency = createDependency(`cohort:${normalizedCohortId}`, cohortStageScope('5a'), {
            isDefault: true
          });
          if (cohortDependency) {
            dependencies.push(cohortDependency);
          }
          const cohort = findCohort(registry, cohortId);
          if (cohort) {
            (cohort.patterns || []).forEach((memberId) => {
              const member = findPattern(registry, memberId);
              if (!member) {
                return;
              }
              const isSamePattern = member.patternId === pattern.patternId;
              dependencies.push(...collectLaneDependenciesForStage(member, 4, { isDefault: isSamePattern }));
            });
          }
        });
      } else if (stageId === '7') {
        dependencies.push(...collectLaneDependenciesForStage(pattern, 6, { isDefault: true }));
      }
      const plannedFiles = normalisePlanFiles(gate?.plannedFiles || []);
      const dedupedDependencies = dedupeDependencies(dependencies);
      tasks.push({
        key: dependencyKey(pattern.patternId, stageScope(stageId)),
        patternId: pattern.patternId,
        name: pattern.name,
        scope: stageScope(stageId),
        status,
        type: 'stage',
        stageId,
        stageNumber,
        plannedFiles,
        plannedFileKeys: plannedFiles.map(planFileKey).filter(Boolean),
        dependencies: dedupedDependencies,
        elapsedMs: gate?.elapsedMs || null,
        durationMinutes: roundUpToMinutes(gate?.elapsedMs || null),
        startedAt: gate?.startedAt || null,
        isBlocked: blockedStatuses.has(status),
        targetId: stageId,
        focus: deriveStageFocus(pattern, stageId)
      });
    });
    Object.entries(pattern.lanes || {}).forEach(([laneId, lane]) => {
      const status = lane.status || 'pending';
      if (laneFinalStatuses.has(status)) {
        return;
      }
      const laneStageNumber = inferStageNumberFromLaneId(laneId);
      const explicitDependencies = (lane.dependencies || [])
        .map((dep) => createDependency(dep.patternId, dep.gate, { isDefault: false }))
        .filter(Boolean);
      const dependencies = [...explicitDependencies];
      if (laneStageNumber === 4) {
        const defaultDependency = createDependency(pattern.patternId, stageScope('3'), { isDefault: true });
        if (defaultDependency) {
          dependencies.push(defaultDependency);
        }
      } else if (laneStageNumber === 6) {
        const defaultDependency = createDependency(pattern.patternId, stageScope('5'), { isDefault: true });
        if (defaultDependency) {
          dependencies.push(defaultDependency);
        }
      }
      const plannedFiles = normalisePlanFiles(lane.plannedFiles || []);
      const dedupedDependencies = dedupeDependencies(dependencies);
      tasks.push({
        key: dependencyKey(pattern.patternId, laneScope(laneId)),
        patternId: pattern.patternId,
        name: pattern.name,
        scope: laneScope(laneId),
        status,
        type: 'lane',
        laneId,
        stageNumber: laneStageNumber,
        plannedFiles,
        plannedFileKeys: plannedFiles.map(planFileKey).filter(Boolean),
        dependencies: dedupedDependencies,
        elapsedMs: lane.elapsedMs || null,
        durationMinutes: roundUpToMinutes(lane.elapsedMs || null),
        startedAt: lane.startedAt || null,
        isBlocked: blockedStatuses.has(status),
        targetId: laneId,
        focus: lane.scope || ''
      });
    });
  });
  return tasks.filter((task) => {
    if (task.type !== 'stage') {
      return true;
    }
    if (task.stageId === '4' || task.stageId === '6') {
      return false;
    }
    return true;
  });
}

function collectPlanFilesFromWave(tasks) {
  const collected = new Set();
  tasks.forEach((task) => {
    (task.plannedFiles || []).forEach((file) => collected.add(file));
  });
  return [...collected].sort((a, b) => a.localeCompare(b));
}

function unresolvedDependencies(task, resolvedKeys, tasksByKey, registry) {
  const unresolved = [];
  task.dependencies.forEach((dep) => {
    const depKey = dependencyKey(dep.patternId, dep.scope);
    if (resolvedKeys.has(depKey)) {
      return;
    }
    const targetTask = tasksByKey.get(depKey);
    if (targetTask) {
      if (dependencyTaskCompletesRequirement(targetTask)) {
        resolvedKeys.add(depKey);
        return;
      }
      unresolved.push(depKey);
      return;
    }
    if (!dependencySatisfiedViaRegistry(registry, dep.patternId, dep.scope)) {
      unresolved.push(depKey);
    }
  });
  return unresolved;
}

function dependencyTaskCompletesRequirement(task) {
  if (!task) {
    return false;
  }
  const status = normalizeStatus(task.status);
  if (!status) {
    return false;
  }
  if ((task.type === 'stage' || task.type === 'cohort-stage') && stageCompletionStatuses.has(status)) {
    return true;
  }
  if ((task.type === 'lane' || task.type === 'cohort-lane') && laneCompletionStatuses.has(status)) {
    return true;
  }
  if (task.type === 'stage' && stageFinalStatuses.has(status)) {
    return true;
  }
  if (task.type === 'lane' && laneFinalStatuses.has(status)) {
    return true;
  }
  return false;
}

function dependenciesResolved(task, resolvedKeys, tasksByKey, registry) {
  return unresolvedDependencies(task, resolvedKeys, tasksByKey, registry).length === 0;
}

function statusEligibleForAutoBlocking(task) {
  const status = normalizeStatus(task.status);
  if (!autoBlockEligibleStatuses.has(status)) {
    return false;
  }
  if (task.type === 'lane' || task.type === 'stage' || task.type === 'cohort-stage') {
    return true;
  }
  return false;
}

function statusBlocksLaterTasks(task) {
  const status = normalizeStatus(task.status);
  if (!status || status === 'complete' || status === 'ready' || status === 'ready_for_handoff') {
    return false;
  }
  if (task.type === 'lane' && laneFinalStatuses.has(status)) {
    return false;
  }
  if (task.type === 'stage' && stageFinalStatuses.has(status)) {
    return false;
  }
  return activeBlockingStatuses.has(status) || status === 'blocked' || status === 'in_progress';
}

function participatesInWavePlanConflicts(task) {
  if (!task || !task.plannedFileKeys || !task.plannedFileKeys.length) {
    return false;
  }
  if (ignoresPlanCollisionBlocking(task)) {
    return false;
  }
  return statusBlocksLaterTasks(task);
}

function planConflictExists(task, usedPlanKeys) {
  if (!participatesInWavePlanConflicts(task)) {
    return false;
  }
  return task.plannedFileKeys.some((fileKey) => usedPlanKeys.has(fileKey));
}

function shouldAutoBlockDueToMissingPlans(task) {
  if (!task || task.type !== 'lane') {
    return false;
  }
  if (task.stageNumber !== 6) {
    return false;
  }
  const status = normalizeStatus(task.status);
  if (!autoLaneStatuses.has(status)) {
    return false;
  }
  return !task.plannedFileKeys || !task.plannedFileKeys.length;
}

function shouldRegisterPlanKey(task, patternStage7Complete) {
  if (!task || !task.plannedFileKeys || !task.plannedFileKeys.length) {
    return false;
  }
  if (ignoresPlanCollisionBlocking(task)) {
    return false;
  }
  if (statusBlocksLaterTasks(task)) {
    return true;
  }
  if (task.type === 'lane') {
    const patternId = task.patternId === undefined || task.patternId === null ? '' : String(task.patternId);
    if (!patternId) {
      return false;
    }
    if (patternStage7Complete.get(patternId) === false) {
      return true;
    }
  }
  return false;
}

function entryBlocksTask(entry, task, patternStage7Complete) {
  if (!entry) {
    return false;
  }
  if (ignoresPlanCollisionBlocking(entry)) {
    return false;
  }
  if (statusBlocksLaterTasks(entry)) {
    return true;
  }
  if (entry.type !== 'lane') {
    return false;
  }
  const entryPatternId = entry.patternId === undefined || entry.patternId === null ? '' : String(entry.patternId);
  const taskPatternId = task.patternId === undefined || task.patternId === null ? '' : String(task.patternId);
  if (!entryPatternId || entryPatternId === taskPatternId) {
    return false;
  }
  return patternStage7Complete.get(entryPatternId) === false;
}

function applyPlanCollisionAutoBlocking(waves, registry) {
  const activePlanKeys = new Map();
  const patternStage7Complete = new Map();
  if (registry && Array.isArray(registry.patterns)) {
    registry.patterns.forEach((pattern) => {
      if (!pattern || pattern.patternId === undefined || pattern.patternId === null) {
        return;
      }
      patternStage7Complete.set(String(pattern.patternId), isStageComplete(pattern, '7'));
    });
  }
  waves.forEach((wave) => {
    (wave.tasks || []).forEach((task) => {
      if (shouldAutoBlockDueToMissingPlans(task)) {
        task.status = 'blocked';
        task.isBlocked = true;
        return;
      }
      if (!statusEligibleForAutoBlocking(task)) {
        return;
      }
      if (!task.plannedFileKeys || !task.plannedFileKeys.length) {
        return;
      }
      const hasBlockingKey = task.plannedFileKeys.some((key) => {
        const holders = activePlanKeys.get(key);
        if (!holders || !holders.length) {
          return false;
        }
        return holders.some((entry) => entryBlocksTask(entry, task, patternStage7Complete));
      });
      if (!hasBlockingKey) {
        return;
      }
      task.status = 'blocked';
      task.isBlocked = true;
    });
    (wave.tasks || []).forEach((task) => {
      if (!task.plannedFileKeys || !task.plannedFileKeys.length) {
        return;
      }
      if (ignoresPlanCollisionBlocking(task)) {
        return;
      }
      if (!shouldRegisterPlanKey(task, patternStage7Complete)) {
        return;
      }
      task.plannedFileKeys.forEach((key) => {
        if (!activePlanKeys.has(key)) {
          activePlanKeys.set(key, []);
        }
        activePlanKeys.get(key).push(task);
      });
    });
  });
}

function dependencyTargetsTask(dependency, task) {
  if (!dependency || !task || !task.key) {
    return false;
  }
  if (dependency.patternId === undefined || dependency.patternId === null) {
    return false;
  }
  if (!dependency.scope) {
    return false;
  }
  return dependencyKey(dependency.patternId, dependency.scope) === task.key;
}

function blockedEntryDependsOnTask(blockedEntry, candidate) {
  if (!blockedEntry || !candidate || !Array.isArray(blockedEntry.dependencies)) {
    return false;
  }
  return blockedEntry.dependencies.some((dependency) => dependencyTargetsTask(dependency, candidate));
}

function applySymmetricPlanBlocking(waves) {
  const planOwners = new Map();
  waves.forEach((wave) => {
    (wave.tasks || []).forEach((task) => {
      if (!task || !task.plannedFileKeys || !task.plannedFileKeys.length) {
        return;
      }
      if (ignoresPlanCollisionBlocking(task)) {
        return;
      }
      const status = normalizeStatus(task.status);
      if (!status || (!autoBlockEligibleStatuses.has(status) && status !== 'blocked')) {
        return;
      }
      task.plannedFileKeys.forEach((key) => {
        if (!key) {
          return;
        }
        if (!planOwners.has(key)) {
          planOwners.set(key, []);
        }
        planOwners.get(key).push(task);
      });
    });
  });
  planOwners.forEach((tasks) => {
    if (!tasks || tasks.length < 2) {
      return;
    }
    const blockedEntries = tasks.filter((entry) => normalizeStatus(entry.status) === 'blocked');
    if (!blockedEntries.length) {
      return;
    }
    const primaryOwner =
      tasks.find(
        (entry) =>
          statusEligibleForAutoBlocking(entry) && normalizeStatus(entry.status) !== 'blocked'
      ) || null;
    tasks.forEach((entry) => {
      if (!statusEligibleForAutoBlocking(entry)) {
        return;
      }
      const shouldBlock = blockedEntries.some((blockedEntry) => {
        if (blockedEntry.key === entry.key) {
          return true;
        }
        if (blockedEntryDependsOnTask(blockedEntry, entry)) {
          return false;
        }
        return true;
      });
      if (!shouldBlock) {
        return;
      }
      if (primaryOwner && entry === primaryOwner) {
        return;
      }
      entry.status = 'blocked';
      entry.isBlocked = true;
    });
  });
}

function statusIsHardBlocked(task) {
  const status = normalizeStatus(task?.status);
  return status === 'blocked';
}

function rebalanceBlockedWaves(waves) {
  const output = [];
  waves.forEach((wave) => {
    if (!wave || !Array.isArray(wave.tasks)) {
      return;
    }
    const ready = [];
    const blocked = [];
    wave.tasks.forEach((task) => {
      if (statusIsHardBlocked(task)) {
        blocked.push(task);
      } else {
        ready.push(task);
      }
    });
    if (ready.length) {
      output.push({
        index: 0,
        label: createWaveLabel(ready),
        tasks: ready,
        plannedFiles: collectPlanFilesFromWave(ready)
      });
    }
    if (blocked.length) {
      output.push({
        index: 0,
        label: createWaveLabel(blocked),
        tasks: blocked,
        plannedFiles: collectPlanFilesFromWave(blocked)
      });
    }
  });
  output.forEach((wave, idx) => {
    wave.index = idx;
    wave.label = createWaveLabel(wave.tasks || []);
  });
  return output;
}

function computeTaskWeight(task) {
  if (task.type === 'cohort-stage' && task.scope === 'cohort-5a') {
    return { stageNumber: 5, priority: 0 };
  }
  const stageNumber = task.stageNumber ?? inferStageNumberFromScope(task.scope) ?? 99;
  let priority = 2;
  if (task.type === 'lane') {
    priority = 1;
  } else if (task.type === 'stage') {
    priority = 2;
  }
  return { stageNumber, priority };
}

function createWaveLabel(tasks) {
  let hasCohort5a = false;
  const stageNumbers = new Set();
  tasks.forEach((task) => {
    if (task.type === 'cohort-stage' && task.scope === 'cohort-5a') {
      hasCohort5a = true;
      return;
    }
    const stageNumber = task.stageNumber ?? inferStageNumberFromScope(task.scope);
    if (stageNumber !== null && !Number.isNaN(stageNumber)) {
      stageNumbers.add(stageNumber);
    }
  });
  if (hasCohort5a && stageNumbers.size === 0) {
    return 'stage-5a';
  }
  if (!stageNumbers.size) {
    return 'mixed';
  }
  const sorted = [...stageNumbers].sort((a, b) => a - b);
  if (sorted.length === 1) {
    return `stage-${sorted[0]}`;
  }
  return `stages-${sorted.join('+')}`;
}

export function buildSchedule(registry, options = {}) {
  const patternsProvided = Array.isArray(options.patterns);
  const patternSelection = patternsProvided ? new Set(options.patterns) : null;
  const restrictToSelection = Boolean(options.restrictToSelection);
  const cohortIds =
    options.cohortIds && options.cohortIds.length
      ? new Set(options.cohortIds.map((id) => normaliseCohortId(id)).filter(Boolean))
      : null;
  const tasks = buildTasks(registry, patternSelection, {
    restrictToSelection,
    cohortIds
  });
  const tasksByKey = new Map(tasks.map((task) => [task.key, task]));
  const resolvedKeys = new Set();
  const scheduledKeys = new Set();
  const waves = [];

  let iterations = 0;
  const maxIterations = tasks.length * 5;

  while (scheduledKeys.size < tasks.length && iterations < maxIterations) {
    const available = tasks.filter(
      (task) => !scheduledKeys.has(task.key) && dependenciesResolved(task, resolvedKeys, tasksByKey, registry)
    );
    if (!available.length) {
      break;
    }
    const readyCandidates = available.filter((task) => !statusIsHardBlocked(task));
    const candidates = readyCandidates.length ? readyCandidates : available;
    candidates.sort((a, b) => {
      const aWeight = computeTaskWeight(a);
      const bWeight = computeTaskWeight(b);
      if (aWeight.stageNumber !== bWeight.stageNumber) {
        return aWeight.stageNumber - bWeight.stageNumber;
      }
      if (aWeight.priority !== bWeight.priority) {
        return aWeight.priority - bWeight.priority;
      }
      const aPattern = String(a.patternId);
      const bPattern = String(b.patternId);
      if (aPattern !== bPattern) {
        return aPattern.localeCompare(bPattern, undefined, { numeric: true });
      }
      return a.scope.localeCompare(b.scope);
    });
    const usedPlanKeys = new Set();
    const waveTasks = [];
    candidates.forEach((task) => {
      if (planConflictExists(task, usedPlanKeys)) {
        return;
      }
      waveTasks.push(task);
      if (participatesInWavePlanConflicts(task)) {
        (task.plannedFileKeys || []).forEach((key) => usedPlanKeys.add(key));
      }
    });
    if (!waveTasks.length) {
      const fallback = available[0];
      waveTasks.push(fallback);
      if (participatesInWavePlanConflicts(fallback)) {
        (fallback.plannedFileKeys || []).forEach((key) => usedPlanKeys.add(key));
      }
    }
    const label = createWaveLabel(waveTasks);
    waves.push({
      index: waves.length,
      label,
      tasks: waveTasks,
      plannedFiles: collectPlanFilesFromWave(waveTasks)
    });
    waveTasks.forEach((task) => {
      scheduledKeys.add(task.key);
      resolvedKeys.add(task.key);
    });
    iterations += 1;
  }

  if (scheduledKeys.size < tasks.length) {
    tasks
      .filter((task) => !scheduledKeys.has(task.key))
      .forEach((task) => {
        waves.push({
          index: waves.length,
          label: createWaveLabel([task]),
          tasks: [task],
          plannedFiles: collectPlanFilesFromWave([task])
        });
        scheduledKeys.add(task.key);
      });
  }

  applyPlanCollisionAutoBlocking(waves, registry);
  applySymmetricPlanBlocking(waves);
  const normalizedWaves = rebalanceBlockedWaves(waves);

  return {
    generatedAt: nowIso(),
    patternIds: patternSelection ? [...patternSelection].sort((a, b) => a - b) : [],
    waves: normalizedWaves,
    unscheduled: []
  };
}

function deriveDefaultOutputPath(patterns, format) {
  const suffix = patterns && patterns.length ? patterns.join('-') : 'all';
  const extension = format === 'json' ? 'json' : 'md';
  if (format === 'json') {
    return path.join(schedulesDir, `schedule-${suffix}.json`);
  }
  return path.join(schedulesDir, `schedule-${suffix}.md`);
}

export async function generateScheduleArtifacts(registry, options = {}) {
  const format = options.format && options.format !== 'md' ? options.format : 'markdown';
  const cohortIds = (options.cohorts || []).map((id) => normaliseCohortId(id)).filter(Boolean);
  let selectedPatterns;
  let restrictToSelection = false;
  if (options.patternsProvided) {
    selectedPatterns = Array.isArray(options.patterns) ? options.patterns : [];
    restrictToSelection = true;
  }
  if ((!selectedPatterns || selectedPatterns.length === 0) && cohortIds.length) {
    selectedPatterns = collectPatternsForCohorts(registry, cohortIds);
    restrictToSelection = true;
  }
  const patternList = Array.isArray(selectedPatterns) ? selectedPatterns : undefined;
  const schedule = buildSchedule(registry, {
    patterns: patternList,
    restrictToSelection,
    cohortIds
  });
  const saveEnabled = options.save !== false;
  let outputPath = resolveRepoPath(options.output);
  let changed = false;
  if (saveEnabled) {
    if (!outputPath) {
      outputPath = deriveDefaultOutputPath(patternList, format);
    }
    await mkdir(path.dirname(outputPath), { recursive: true });
  }
  const prettierTarget = saveEnabled ? outputPath : options.output ? outputPath : null;
  const renderArgs = {
    schedule,
    registry,
    savePath: prettierTarget,
    formatWithPrettier: true
  };
  let rendered;
  if (format === 'json') {
    rendered = await renderScheduleJson(renderArgs);
  } else {
    rendered = await renderScheduleMarkdown(renderArgs);
    rendered = enforceNoteIndentation(rendered);
  }
  if (saveEnabled) {
    let existing = null;
    try {
      existing = await readFile(outputPath, 'utf8');
    } catch (_) {
      existing = null;
    }
    if (existing !== rendered) {
      await writeFile(outputPath, rendered, 'utf8');
      changed = true;
    }
  }
  return { schedule, rendered, outputPath: saveEnabled ? outputPath : null, saved: saveEnabled, changed };
}

export function parseCliArgs(argv) {
  const options = {
    format: 'markdown',
    patterns: [],
    cohorts: [],
    save: true,
    patternsProvided: false,
    cohortsProvided: false
  };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case '--patterns':
        if (i + 1 >= argv.length) {
          throw new Error('--patterns requires a value (e.g., "[1,2]" or "1,2")');
        }
        options.patterns = parsePatternsOption(argv[i + 1]);
        options.patternsProvided = true;
        i += 1;
        break;
      case '--cohort':
        if (i + 1 >= argv.length) {
          throw new Error('--cohort requires a value');
        }
        if (!options.cohorts) {
          options.cohorts = [];
        }
        options.cohorts.push(argv[i + 1]);
        options.cohortsProvided = true;
        i += 1;
        break;
      case '--format':
        if (i + 1 >= argv.length) {
          throw new Error('--format requires a value (json|markdown)');
        }
        options.format = argv[i + 1].toLowerCase();
        i += 1;
        break;
      case '--output':
        if (i + 1 >= argv.length) {
          throw new Error('--output requires a path value');
        }
        options.output = argv[i + 1];
        i += 1;
        break;
      case '--no-save':
        options.save = false;
        break;
      case '--registry':
        if (i + 1 >= argv.length) {
          throw new Error('--registry requires a path value');
        }
        options.registry = argv[i + 1];
        i += 1;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown flag: ${token}`);
    }
  }
  return options;
}

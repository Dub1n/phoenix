export const COMPLETED_STATUSES = new Set(['complete', 'ready', 'ready_for_handoff']);

const STATUS_GLYPHS = {
  complete: '[x]',
  ready: '[x]',
  ready_for_handoff: '[x]',
  in_progress: '[~]',
  pending: '[ ]',
  waiting: '[ ]',
  planned: '[ ]',
  scheduled: '[ ]',
  blocked: '[?]',
  paused: '[?]',
  hold: '[?]',
  deferred: '[-]',
  cancelled: '[!]',
  failed: '[!]',
  reopened: '[~]'
};

function normalizeStatus(value) {
  return value ? String(value).toLowerCase() : '';
}

export function mapStatusToGlyph(status) {
  const normalized = normalizeStatus(status);
  return STATUS_GLYPHS[normalized] || '[?]';
}

export function formatDurationFromMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes === null || minutes === undefined) {
    return '--:--';
  }
  const safeMinutes = Math.max(0, Math.ceil(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function formatScopeLabel(scope) {
  if (!scope) {
    return '';
  }
  const normalized = String(scope).toLowerCase();
  if (normalized.startsWith('cohort-')) {
    if (normalized === 'cohort-5a') {
      return '5A';
    }
    return normalized.slice(7);
  }
  if (normalized.startsWith('lane-')) {
    return normalized.slice(5);
  }
  if (normalized.startsWith('stage-')) {
    const label = normalized.slice(6);
    if (label === '5') {
      return '5B';
    }
    return label;
  }
  return normalized;
}

export function formatDependencyDisplay(dep) {
  if (!dep) {
    return null;
  }
  const scopeLabel = formatScopeLabel(dep.scope);
  if (!scopeLabel) {
    return null;
  }
  let patternLabel;
  if (typeof dep.patternId === 'string' && dep.patternId.startsWith('cohort:')) {
    patternLabel = 'C';
  } else if (dep.patternId !== undefined && dep.patternId !== null) {
    patternLabel = String(dep.patternId);
  } else {
    patternLabel = '?';
  }
  return `${patternLabel}:${scopeLabel}`;
}

function isCohortTask(task) {
  if (!task) {
    return false;
  }
  if (task.type === 'cohort-stage') {
    return true;
  }
  return typeof task.patternId === 'string' && String(task.patternId).startsWith('cohort:');
}

export function formatPatternLabel(task) {
  if (!task) {
    return '';
  }
  if (isCohortTask(task)) {
    return 'C';
  }
  if (task.patternId === undefined || task.patternId === null) {
    return '';
  }
  return String(task.patternId);
}

export function deriveNoteScopeLabel(note) {
  if (!note) {
    return '';
  }
  const scopes = Array.isArray(note.scope)
    ? note.scope
        .map((entry) => (entry ? String(entry).trim() : ''))
        .filter(Boolean)
    : [];
  const pickByPrefix = (prefix) => scopes.find((value) => value.toLowerCase().startsWith(`${prefix}-`));
  const selected =
    pickByPrefix('lane') ||
    pickByPrefix('stage') ||
    pickByPrefix('cohort') ||
    (scopes.length ? scopes[0] : null) ||
    (note.stage ? String(note.stage).trim() : null) ||
    null;
  if (!selected) {
    return '';
  }
  return formatScopeLabel(selected);
}

export function enforceNoteIndentation(markdown) {
  if (typeof markdown !== 'string' || !markdown.includes('\n- [')) {
    return markdown;
  }
  return markdown.replace(/(- \[[^\n]+\][^\n]*\n)((?: {2}[^\n]*\n?)*)/g, (match, heading, body) => {
    if (!body) {
      return match;
    }
    const adjustedBody = body.replace(/^ {2}(?![ ])/gm, '    ');
    return `${heading}${adjustedBody}`;
  });
}

export function formatTargetLabel(task) {
  if (!task) {
    return '';
  }
  if (task.type === 'cohort-stage') {
    const label = task.targetId ? String(task.targetId) : formatScopeLabel(task.scope);
    if (typeof label === 'string' && label.toLowerCase() === '5a') {
      return '5A';
    }
    return label;
  }
  if (task.type === 'stage') {
    const rawLabel = task.stageId !== undefined && task.stageId !== null ? String(task.stageId) : null;
    const normalizedLabel = rawLabel || formatScopeLabel(task.scope);
    if (String(task.stageId) === '5' || (!rawLabel && String(normalizedLabel).toLowerCase() === '5')) {
      return '5B';
    }
    return normalizedLabel;
  }
  if (task.type === 'lane') {
    return task.laneId ? String(task.laneId) : formatScopeLabel(task.scope);
  }
  return formatScopeLabel(task.scope);
}

export function extractUniqueTasks(schedule) {
  if (!schedule || !Array.isArray(schedule.waves)) {
    return [];
  }
  const map = new Map();
  schedule.waves.forEach((wave) => {
    (wave.tasks || []).forEach((task) => {
      if (!task || map.has(task.key)) {
        return;
      }
      map.set(task.key, { ...task, waveIndex: wave.index });
    });
  });
  return [...map.values()];
}

function patternSortValue(task) {
  if (!task) {
    return Number.MAX_SAFE_INTEGER;
  }
  if (typeof task.patternId === 'number') {
    return task.patternId;
  }
  if (typeof task.patternId === 'string') {
    if (task.patternId.startsWith('cohort:')) {
      const suffix = task.patternId.slice(7);
      const numeric = Number.parseInt(suffix, 10);
      const base = Number.isNaN(numeric) ? 0 : numeric;
      return Number.MAX_SAFE_INTEGER - 1000 + base;
    }
    const parsed = Number.parseInt(task.patternId, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Number.MAX_SAFE_INTEGER - 500;
}

function stageSortValue(task) {
  if (!task) {
    return Number.MAX_SAFE_INTEGER;
  }
  if (Number.isFinite(task.stageNumber)) {
    return task.stageNumber;
  }
  return Number.MAX_SAFE_INTEGER - 10;
}

function secondarySortKey(task) {
  if (!task) {
    return '';
  }
  if (task.type === 'lane') {
    return task.laneId ? String(task.laneId) : formatScopeLabel(task.scope);
  }
  if (task.type === 'stage') {
    return task.stageId ? String(task.stageId) : formatScopeLabel(task.scope);
  }
  if (task.type === 'cohort-stage') {
    return task.targetId ? String(task.targetId) : formatScopeLabel(task.scope);
  }
  return formatScopeLabel(task.scope);
}

export function sortCompletedTasks(tasks) {
  return [...(tasks || [])].sort((a, b) => {
    const patternDiff = patternSortValue(a) - patternSortValue(b);
    if (patternDiff !== 0) {
      return patternDiff;
    }
    const stageDiff = stageSortValue(a) - stageSortValue(b);
    if (stageDiff !== 0) {
      return stageDiff;
    }
    return secondarySortKey(a).localeCompare(secondarySortKey(b), 'en', { numeric: true });
  });
}

export function collectPatternIdsFromTasks(tasks) {
  const ids = new Set();
  (tasks || []).forEach((task) => {
    if (!task) {
      return;
    }
    if (typeof task.patternId === 'number') {
      ids.add(task.patternId);
    } else if (typeof task.patternId === 'string' && !task.patternId.startsWith('cohort:')) {
      const parsed = Number.parseInt(task.patternId, 10);
      if (!Number.isNaN(parsed)) {
        ids.add(parsed);
      }
    }
  });
  return ids;
}

export function collectPatternNotes(registry, patternIdSet) {
  if (!registry || !Array.isArray(registry.patterns) || !patternIdSet || !patternIdSet.size) {
    return [];
  }
  const notes = [];
  patternIdSet.forEach((patternId) => {
    const pattern = registry.patterns.find((entry) => entry.patternId === patternId);
    if (!pattern) {
      return;
    }
    const noteEntries = Array.isArray(pattern.notes) ? [...pattern.notes] : [];
    if (!noteEntries.length) {
      return;
    }
    noteEntries.sort((a, b) => {
      const aTime = Date.parse(a.timestamp || '') || 0;
      const bTime = Date.parse(b.timestamp || '') || 0;
      return bTime - aTime;
    });
    notes.push({
      patternId,
      patternName: pattern.name || `Pattern ${patternId}`,
      notes: noteEntries
    });
  });
  notes.sort((a, b) => a.patternId - b.patternId);
  return notes;
}

function inferStageNumberFromScope(scope) {
  if (!scope) {
    return null;
  }
  const normalized = String(scope).toLowerCase();
  const match = normalized.match(/(?:stage|lane|cohort)-(\d+)/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getNonDefaultDependencies(task) {
  const stageNumber = Number.isFinite(task?.stageNumber) ? task.stageNumber : null;
  return (task?.dependencies || [])
    .filter((dep) => !dep.isDefault)
    .filter((dep) => {
      if (!stageNumber || stageNumber < 5) {
        return true;
      }
      const dependencyStage = inferStageNumberFromScope(dep.scope);
      if (!dependencyStage) {
        return true;
      }
      if (dependencyStage <= 4) {
        return false;
      }
      return true;
    });
}

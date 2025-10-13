import prettier from 'prettier';
import {
  COMPLETED_STATUSES,
  mapStatusToGlyph,
  formatDurationFromMinutes,
  formatDependencyDisplay,
  extractUniqueTasks,
  sortCompletedTasks,
  formatPatternLabel,
  formatTargetLabel,
  collectPatternIdsFromTasks,
  collectPatternNotes,
  getNonDefaultDependencies
} from './schedule-format-helpers.mjs';

function serializeTask(task, sectionLabel) {
  const dependencies = getNonDefaultDependencies(task).map((dep) => ({
    patternId: dep.patternId,
    scope: dep.scope,
    display: formatDependencyDisplay(dep)
  }));
  const isCohort = typeof task.patternId === 'string' && task.patternId.startsWith('cohort:');
  return {
    key: task.key,
    section: sectionLabel,
    waveIndex: task.waveIndex,
    type: task.type,
    patternId: isCohort ? null : task.patternId,
    patternLabel: formatPatternLabel(task) || null,
    patternName: task.name || null,
    cohortId: task.cohortId || (isCohort ? task.patternId.slice(7) : null),
    target: formatTargetLabel(task) || null,
    stageNumber: Number.isFinite(task.stageNumber) ? task.stageNumber : null,
    stageId: task.stageId || null,
    laneId: task.laneId || null,
    status: task.status,
    statusGlyph: mapStatusToGlyph(task.status),
    isBlocked: Boolean(task.isBlocked),
    dependencies,
    durationMinutes: task.durationMinutes ?? null,
    durationDisplay: formatDurationFromMinutes(task.durationMinutes),
    elapsedMs: task.elapsedMs ?? null,
    startedAt: task.startedAt || null,
    plannedFiles: task.plannedFiles || [],
    focus: task.focus || (task.type === 'lane' ? task.scope || '' : ''),
    name: task.name || null
  };
}

export async function renderScheduleJson({ schedule, registry, savePath, formatWithPrettier = true } = {}) {
  if (!schedule) {
    throw new Error('renderScheduleJson requires a schedule object.');
  }

  const uniqueTasks = extractUniqueTasks(schedule);
  const taskByKey = new Map(uniqueTasks.map((task) => [task.key, task]));

  const completedTasks = sortCompletedTasks(
    uniqueTasks.filter((task) => COMPLETED_STATUSES.has(String(task.status || '').toLowerCase()))
  );

  const waveSections = (schedule.waves || []).map((wave) => {
    const tasks = (wave.tasks || [])
      .map((task) => taskByKey.get(task.key))
      .filter(
        (task) => task && !COMPLETED_STATUSES.has(String(task.status || '').toLowerCase())
      );
    return { label: String(wave.index), tasks };
  });

  const sections = [];
  if (completedTasks.length) {
    sections.push({
      label: 'x',
      tasks: completedTasks.map((task) => serializeTask(task, 'x'))
    });
  }
  waveSections.forEach((section) => {
    if (!section.tasks.length) {
      return;
    }
    sections.push({
      label: section.label,
      tasks: section.tasks.map((task) => serializeTask(task, section.label))
    });
  });

  const notes = collectPatternNotes(registry, collectPatternIdsFromTasks(uniqueTasks)).map((entry) => ({
    patternId: entry.patternId,
    patternName: entry.patternName,
    notes: entry.notes.map((note) => ({
      id: note.id || null,
      timestamp: note.timestamp || null,
      author: note.author || null,
      scope: Array.isArray(note.scope) ? note.scope : [],
      body: typeof note.body === 'string' ? note.body : ''
    }))
  }));

  const payload = {
    generatedAt: schedule.generatedAt,
    patternIds: schedule.patternIds || [],
    sections,
    notes
  };

  const json = JSON.stringify(payload, null, 2);
  if (!formatWithPrettier) {
    return json;
  }
  try {
    const config = await prettier.resolveConfig(savePath || '');
    return prettier.format(json, { ...(config || {}), parser: 'json' });
  } catch (_) {
    return json;
  }
}

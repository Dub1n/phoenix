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
  getNonDefaultDependencies,
  deriveNoteScopeLabel
} from './schedule-format-helpers.mjs';
import { formatMarkdownIfNeeded } from './modules/markdown.mjs';

function escapeCell(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function formatFocusCell(task) {
  const focus = task.focus || (task.type === 'lane' ? task.scope || '' : '');
  const trimmed = escapeCell(focus);
  return trimmed || '';
}

function formatDependenciesCell(task) {
  const formatted = getNonDefaultDependencies(task)
    .map((dep) => formatDependencyDisplay(dep))
    .filter(Boolean);
  if (!formatted.length) {
    return '-';
  }
  return formatted.join(', ');
}

function renderTaskRow(task) {
  const patternCell = escapeCell(formatPatternLabel(task)) || ' ';
  const targetCell = escapeCell(formatTargetLabel(task)) || ' ';
  const statusCell = mapStatusToGlyph(task.status);
  const dependencyCell = escapeCell(formatDependenciesCell(task) || '-');
  const durationCell = escapeCell(formatDurationFromMinutes(task.durationMinutes));
  const focusCell = formatFocusCell(task);
  return `| ${patternCell.padEnd(3, ' ')} | ${targetCell.padEnd(3, ' ')} | ${statusCell.padEnd(3, ' ')} | ${dependencyCell.padEnd(
    4,
    ' '
  )} | ${durationCell.padEnd(5, ' ')} | ${focusCell} |`;
}

function renderSectionHeader(label) {
  return `|     |     |     |      |       | \`{${label}}\` |`;
}

function appendNotesSection(lines, registry, tasks) {
  const patternIds = collectPatternIdsFromTasks(tasks);
  const collections = collectPatternNotes(registry, patternIds);
  if (!collections.length) {
    return;
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  collections.forEach((entry, index) => {
    lines.push(`### Pattern ${entry.patternId}`);
    lines.push('');
    entry.notes.forEach((note) => {
      const timestamp = note.timestamp || '—';
      const authorSegment = note.author ? ` — ${note.author}` : '';
      const scopeLabel = deriveNoteScopeLabel(note);
      const scopeSegment = scopeLabel ? `[${scopeLabel}] ` : '';
      lines.push(`- ${scopeSegment}${timestamp}${authorSegment}`);
      const body = typeof note.body === 'string' ? note.body.trim() : '';
      if (body) {
        body.split(/\r?\n/).forEach((line) => {
          lines.push(`    ${line}`);
        });
      } else {
        lines.push('    _No note body provided._');
      }
    });
    if (index < collections.length - 1) {
      lines.push('');
    }
  });
}

export async function renderScheduleMarkdown({ schedule, registry, savePath, formatWithPrettier = true } = {}) {
  if (!schedule) {
    throw new Error('renderScheduleMarkdown requires a schedule object.');
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

  const lines = [];
  lines.push('# Consolidation Schedule (Generated)');
  lines.push('');
  lines.push(`Generated at ${schedule.generatedAt}.`);
  if (schedule.patternIds && schedule.patternIds.length) {
    lines.push(`Patterns: ${schedule.patternIds.join(', ')}.`);
  }
  lines.push('');
  lines.push('| Pa  | Ta  | St  | De   | Ti    | Focus |');
  lines.push('| --- | --- | --- | ---- | ----- | ----- |');

  if (completedTasks.length) {
    lines.push(renderSectionHeader('x'));
    completedTasks.forEach((task) => {
      lines.push(renderTaskRow(task));
    });
  }

  waveSections.forEach((section) => {
    if (!section.tasks.length) {
      return;
    }
    lines.push(renderSectionHeader(section.label));
    section.tasks.forEach((task) => {
      lines.push(renderTaskRow(task));
    });
  });

  appendNotesSection(lines, registry, uniqueTasks);

  const targetPath =
    formatWithPrettier && typeof savePath === 'string' && savePath.endsWith('.md')
      ? savePath
      : formatWithPrettier
        ? 'ConsolidationSchedule.md'
        : 'ConsolidationSchedule';
  return formatMarkdownIfNeeded(targetPath, lines.join('\n'));
}

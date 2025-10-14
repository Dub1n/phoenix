#!/usr/bin/env node
import fs from 'node:fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import process from 'process';
import { spawnSync } from 'node:child_process';
import Ajv from 'ajv/dist/2020.js';
import { fileURLToPath } from 'url';
import readline from 'readline/promises';
import prettier from 'prettier';
import {
  parseCommandInvocation,
  formatCommandUsage,
  formatGlobalHelp,
  resolveDescriptor,
  throwUsageError
} from './cli-shared-parser.mjs';
import { deriveNoteScopeLabel, enforceNoteIndentation } from './schedule-format-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath =
  process.env.CONSOLIDATION_STATE_PATH || path.join(__dirname, 'config/consolidation-state.json');
const schemaPath = path.join(__dirname, 'config/consolidation-state.schema.json');
const scheduleModulePath = path.join(__dirname, 'generate-schedule.mjs');
const scheduleToolsModulePath = path.join(__dirname, 'schedule-tools.mjs');
const repoRoot = (() => {
  const override = process.env.CONSOLIDATION_REPO_ROOT;
  if (override) {
    return path.resolve(override);
  }
  return resolveRepoRoot(__dirname);
})();
const consolidationScriptsRelativePath = (() => {
  const relative = path.relative(repoRoot, __dirname);
  if (!relative || relative === '.') {
    return '';
  }
  return relative.split(path.sep).join('/');
})();
const consolidationDirectoryLabel =
  consolidationScriptsRelativePath || '(consolidation CLI directory)';

const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addFormat('date-time', (value) => !Number.isNaN(Date.parse(value)));

let schemaValidator = null;

const pendingRegen = {
  patterns: new Set(),
  scopes: new Set(),
  cohorts: new Set()
};

function resolveRepoRoot(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    const candidate = path.join(current, 'package.json');
    if (fs.existsSync(candidate)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error('Unable to locate repository root from consolidation CLI path.');
    }
    current = parent;
  }
}

function markPatternForRegen(patternId) {
  if (patternId === null || patternId === undefined) {
    return;
  }
  const numeric = Number.parseInt(patternId, 10);
  if (!Number.isNaN(numeric)) {
    pendingRegen.patterns.add(numeric);
  }
}

function markCohortForRegen(cohortId) {
  if (cohortId || cohortId === 0) {
    const normalized = String(cohortId).trim();
    if (normalized) {
      pendingRegen.cohorts.add(normalized);
    }
  }
}

function setRegistryMeta(registry, key, value) {
  Object.defineProperty(registry, key, {
    configurable: true,
    enumerable: false,
    writable: true,
    value
  });
}

function cohortLabelFromIndex(index) {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`Cannot generate cohort label for index ${index}`);
  }
  let remaining = index + 1;
  let label = '';
  while (remaining > 0) {
    remaining -= 1;
    const remainder = remaining % 26;
    label = String.fromCharCode(65 + remainder) + label;
    remaining = Math.floor(remaining / 26);
  }
  return label;
}

function getCohortAliasMap(registry) {
  const value = registry.__cohortAliasMap;
  return value instanceof Map ? value : null;
}

function canonicalizeCohortIds(registry, options = {}) {
  const { touch = false } = options;
  const cohorts = getCohortCollection(registry);
  const aliasMap = new Map();
  const mapping = new Map();
  cohorts.forEach((cohort, index) => {
    const canonicalId = cohortLabelFromIndex(index);
    const original = String(cohort.id || '').trim();
    if (original) {
      aliasMap.set(original.toLowerCase(), canonicalId);
    }
    aliasMap.set(canonicalId.toLowerCase(), canonicalId);
    if (!original || original.toUpperCase() !== canonicalId) {
      mapping.set(original || canonicalId, canonicalId);
      cohort.id = canonicalId;
      if (touch) {
        cohort.updatedAt = nowIso();
      }
    } else {
      cohort.id = canonicalId;
    }
    if (Array.isArray(cohort.patterns)) {
      cohort.patterns = [...new Set(cohort.patterns)].sort((a, b) => a - b);
    } else {
      cohort.patterns = [];
    }
  });

  if (Array.isArray(registry.patterns)) {
    registry.patterns.forEach((pattern) => {
      const existing = getPatternCohortIds(pattern);
      if (!existing.length) {
        return;
      }
      const next = existing
        .map((id) => {
          const token = String(id).trim();
          const mapped = aliasMap.get(token.toLowerCase());
          return mapped || token.toUpperCase();
        })
        .filter(Boolean);
      const before = JSON.stringify(existing);
      setPatternCohortList(pattern, next);
      const after = JSON.stringify(getPatternCohortIds(pattern));
      if (touch && before !== after) {
        touchPattern(pattern);
      }
    });
  }

  if (mapping.size) {
    const remappedPending = new Set();
    pendingRegen.cohorts.forEach((entry) => {
      const key = String(entry).trim().toLowerCase();
      const mapped = aliasMap.get(key);
      if (mapped) {
        remappedPending.add(mapped);
      } else {
        remappedPending.add(entry);
      }
    });
    pendingRegen.cohorts.clear();
    remappedPending.forEach((entry) => pendingRegen.cohorts.add(entry));
  }

  setRegistryMeta(registry, '__cohortAliasMap', aliasMap);
  setRegistryMeta(registry, '__nextCohortId', cohortLabelFromIndex(cohorts.length));
  setRegistryMeta(registry, '__legacyCohortMapping', mapping);
  return { aliasMap, mapping, nextId: cohortLabelFromIndex(cohorts.length) };
}

function resolveCanonicalCohortId(registry, value) {
  if (value === undefined || value === null) {
    throw new Error('Cohort id cannot be empty.');
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    throw new Error('Cohort id cannot be empty.');
  }
  const aliasMap = getCohortAliasMap(registry);
  const mapped = aliasMap ? aliasMap.get(trimmed.toLowerCase()) : null;
  return mapped || normaliseCohortId(trimmed);
}

function registerScopeChange(patternId, scope) {
  if (!scope && scope !== 0) {
    return;
  }
  const numeric = Number.parseInt(patternId, 10);
  if (Number.isNaN(numeric)) {
    return;
  }
  const normalizedScope = String(scope).toLowerCase();
  pendingRegen.scopes.add(`${numeric}|${normalizedScope}`);
  markPatternForRegen(numeric);
}

function enforceScopeCleanupGuard(pattern, scopeKind, scopeId, options = {}) {
  const outcome = runScopeCleanupGuard(pattern, scopeKind, scopeId);
  if (!outcome.executed) {
    return outcome;
  }
  const scopeLabel = formatScopeLabel(scopeKind, scopeId);
  const messageWhenOk = buildGuardSuccessMessage(pattern.patternId, scopeLabel, outcome);
  if (!outcome.matches.length) {
    console.log(messageWhenOk);
    return outcome;
  }
  const message = buildGuardFailureMessage(
    pattern.patternId,
    scopeKind,
    scopeLabel,
    outcome,
    Boolean(options.force)
  );
  if (options.force) {
    console.log(message);
    return outcome;
  }
  throw new Error(message);
}

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

async function getValidator() {
  if (!schemaValidator) {
    const schemaRaw = await readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaRaw);
    schemaValidator = ajv.compile(schema);
  }
  return schemaValidator;
}

async function loadRegistry() {
  const raw = await readFile(registryPath, 'utf8');
  const registry = JSON.parse(raw);
  const validate = await getValidator();
  if (!validate(registry)) {
    const errorText = validate.errors?.map((err) => `- ${err.instancePath || '<root>'} ${err.message || ''}`).join('\n') || 'unknown validation error';
    throw new Error(`Registry failed schema validation:\n${errorText}`);
  }
  const originalIds = (registry.cohorts || []).map((cohort) => cohort.id);
  canonicalizeCohortIds(registry, { touch: false });
  const renamed = [];
  (registry.cohorts || []).forEach((cohort, index) => {
    const before = originalIds[index];
    if (before && before !== cohort.id) {
      renamed.push(`${before}→${cohort.id}`);
    }
  });
  if (renamed.length) {
    console.log(`Cohort ids normalized to alphabetical sequence: ${renamed.join(', ')}`);
  }
  return registry;
}

async function saveRegistry(registry, options = {}) {
  canonicalizeCohortIds(registry, { touch: true });
  autoUpdateAllPatternStatuses(registry);
  registry.updatedAt = nowIso();
  const validate = await getValidator();
  if (!validate(registry)) {
    const errorText = validate.errors?.map((err) => `- ${err.instancePath || '<root>'} ${err.message || ''}`).join('\n') || 'unknown validation error';
    throw new Error(`Registry failed schema validation:\n${errorText}`);
  }
  await writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n');
  if (!options.skipRegen) {
    const baseRegenArgs = options.regenArgs !== undefined ? options.regenArgs : buildRegenRequest(registry);
    const regenRequest =
      baseRegenArgs && typeof baseRegenArgs === 'object'
        ? { ...baseRegenArgs, silent: baseRegenArgs.silent ?? true }
        : { params: baseRegenArgs, silent: true };
    await runRegen(registry, regenRequest);
  }
  if (!options.preservePendingRegen) {
    clearPendingRegen();
  }
}

function touchPattern(pattern) {
  pattern.updatedAt = nowIso();
  markPatternForRegen(pattern.patternId);
}

async function formatMarkdownIfNeeded(filePath, content) {
  if (!filePath.endsWith('.md')) {
    return content;
  }
  try {
    const config = await prettier.resolveConfig(filePath);
    const options = { ...(config || {}), parser: 'markdown' };
    const formatted = prettier.format(content, options);
    return enforceNoteIndentation(formatted);
  } catch (_) {
    return enforceNoteIndentation(content);
  }
}

function normalisePlanFiles(files) {
  if (!files || !files.length) {
    return [];
  }
  const unique = new Set();
  files.forEach((entry) => {
    if (!entry) {
      return;
    }
    const trimmed = entry.trim();
    if (trimmed && trimmed !== '0') {
      unique.add(trimmed);
    }
  });
  return [...unique].sort((a, b) => a.localeCompare(b));
}

function normalisePlanFileInputs(rawValues, descriptor, contextLabel) {
  if (!rawValues || !rawValues.length) {
    return [];
  }
  const flattened = [];
  let blankEntries = 0;
  rawValues.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      blankEntries += 1;
      return;
    }
    flattened.push(trimmed);
  });
  if (!flattened.length) {
    const label = contextLabel ? `${contextLabel}: ` : '';
    throwUsageError(descriptor, `${label}--plan-files requires at least one non-empty path`);
  }
  if (blankEntries > 0) {
    const label = contextLabel ? `${contextLabel}: ` : '';
    throwUsageError(
      descriptor,
      `${label}--plan-files received empty entries; combine values as '--plan-files "pathA,pathB"' or repeat the flag.`
    );
  }
  return normalisePlanFiles(flattened);
}

function normaliseSearchTermInputs(rawValues, descriptor, contextLabel) {
  if (!rawValues || !rawValues.length) {
    return [];
  }
  const flattened = [];
  let blankEntries = 0;
  rawValues.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      blankEntries += 1;
      return;
    }
    flattened.push(trimmed);
  });
  if (!flattened.length) {
    const label = contextLabel ? `${contextLabel}: ` : '';
    throwUsageError(descriptor, `${label}--search-terms requires at least one non-empty value`);
  }
  if (blankEntries > 0) {
    const label = contextLabel ? `${contextLabel}: ` : '';
    throwUsageError(descriptor, `${label}--search-terms received empty entries.`);
  }
  return normaliseSearchTerms(flattened);
}

function computeDurationMs(startIso, endIso) {
  if (!startIso) {
    return null;
  }
  const start = Date.parse(startIso);
  const end = Date.parse(endIso || nowIso());
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return null;
  }
  return end - start;
}

const RG_FILE_CHUNK_SIZE = 200;

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function shouldExcludeFromSweep(relativePath) {
  if (!relativePath) {
    return false;
  }
  if (!consolidationScriptsRelativePath) {
    return false;
  }
  return (
    relativePath === consolidationScriptsRelativePath ||
    relativePath.startsWith(`${consolidationScriptsRelativePath}/`)
  );
}

function formatSampleList(values) {
  if (!values.length) {
    return '';
  }
  const sample = values.slice(0, 5).join(', ');
  const suffix = values.length > 5 ? ', ...' : '';
  return ` (${sample}${suffix})`;
}

function normaliseSearchTerms(rawTerms) {
  if (!Array.isArray(rawTerms) || !rawTerms.length) {
    return [];
  }
  const unique = new Set();
  rawTerms.forEach((term) => {
    if (typeof term !== 'string') {
      return;
    }
    const trimmed = term.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  });
  return [...unique].sort((a, b) => a.localeCompare(b));
}

function filterGitIgnoredFiles(files) {
  if (!files.length) {
    return { kept: [], ignored: [] };
  }
  const unique = [...new Set(files)];
  const input = `${unique.join('\n')}\n`;
  const result = spawnSync('git', ['check-ignore', '--stdin'], {
    cwd: repoRoot,
    encoding: 'utf8',
    input,
    maxBuffer: 10 * 1024 * 1024
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0 && result.status !== 1) {
    const message = (result.stderr || '').trim();
    throw new Error(message || 'git check-ignore failed');
  }
  const ignoredSet = new Set(
    (result.stdout || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  );
  if (!ignoredSet.size) {
    return { kept: unique, ignored: [] };
  }
  const kept = unique.filter((file) => !ignoredSet.has(file));
  const ignored = unique.filter((file) => ignoredSet.has(file));
  return { kept, ignored };
}

function expandPlannedFileEntries(plannedFiles = []) {
  if (!plannedFiles.length) {
    return { expanded: [], ignored: [], excluded: [] };
  }
  const results = new Set();
  const queue = [];
  const visited = new Set();
  const excluded = new Set();

  plannedFiles.forEach((entry) => {
    if (typeof entry !== 'string') {
      return;
    }
    const trimmed = entry.trim();
    if (!trimmed) {
      return;
    }
    const normalisedEntry =
      trimmed === '.' || trimmed === './' ? '.' : trimmed.replace(/^\.\//, '');
    const resolved = path.resolve(repoRoot, normalisedEntry);
    const relativeToRepo = path.relative(repoRoot, resolved);
    if (relativeToRepo.startsWith('..')) {
      return;
    }
    const normalizedRelative = relativeToRepo ? toPosixPath(relativeToRepo) : '';
    if (normalizedRelative && shouldExcludeFromSweep(normalizedRelative)) {
      excluded.add(normalizedRelative);
      return;
    }
    queue.push({ absolute: resolved });
  });

  while (queue.length) {
    const { absolute } = queue.pop();
    if (visited.has(absolute)) {
      continue;
    }
    visited.add(absolute);
    const relativeAbsolute = path.relative(repoRoot, absolute);
    if (relativeAbsolute.startsWith('..')) {
      continue;
    }
    const normalizedAbsolute = relativeAbsolute ? toPosixPath(relativeAbsolute) : '';
    if (normalizedAbsolute && shouldExcludeFromSweep(normalizedAbsolute)) {
      excluded.add(normalizedAbsolute);
      continue;
    }
    let stat;
    try {
      stat = fs.statSync(absolute);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      let entries;
      try {
        entries = fs.readdirSync(absolute, { withFileTypes: true });
      } catch {
        continue;
      }
      entries.forEach((dirent) => {
        const nextAbsolute = path.join(absolute, dirent.name);
        const relativeNext = path.relative(repoRoot, nextAbsolute);
        if (relativeNext.startsWith('..')) {
          return;
        }
        const normalizedNext = relativeNext ? toPosixPath(relativeNext) : '';
        if (normalizedNext && shouldExcludeFromSweep(normalizedNext)) {
          excluded.add(normalizedNext);
          return;
        }
        if (dirent.isDirectory()) {
          queue.push({ absolute: nextAbsolute });
        } else if (dirent.isFile()) {
          const normalized = normalizedNext;
          if (!normalized.toLowerCase().endsWith('.md')) {
            results.add(normalized);
          }
        }
      });
    } else if (stat.isFile()) {
      const relativeFile = path.relative(repoRoot, absolute);
      if (relativeFile.startsWith('..')) {
        continue;
      }
      const normalizedFile = relativeFile ? toPosixPath(relativeFile) : '';
      if (normalizedFile && shouldExcludeFromSweep(normalizedFile)) {
        excluded.add(normalizedFile);
        continue;
      }
      if (!normalizedFile.toLowerCase().endsWith('.md')) {
        results.add(normalizedFile);
      }
    }
  }

  const sorted = [...results].sort((a, b) => a.localeCompare(b));
  const { kept, ignored } = filterGitIgnoredFiles(sorted);
  const excludedList = [...excluded].sort((a, b) => a.localeCompare(b));
  return { expanded: kept, ignored, excluded: excludedList };
}

function runRipgrepCount(term, files) {
  const counts = new Map();
  if (!term || !files.length) {
    return counts;
  }
  for (let index = 0; index < files.length; index += RG_FILE_CHUNK_SIZE) {
    const chunk = files.slice(index, index + RG_FILE_CHUNK_SIZE);
    if (!chunk.length) {
      continue;
    }
    const args = [
      '--no-heading',
      '--with-filename',
      '--color',
      'never',
      '--no-messages',
      '--path-separator',
      '/',
      '--fixed-strings',
      '--count',
      term,
      ...chunk
    ];
    const result = spawnSync('rg', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status === 2) {
      const message = (result.stderr || 'ripgrep reported an error.').trim();
      throw new Error(message);
    }
    const output = (result.stdout || '').trim();
    if (!output) {
      continue;
    }
    output.split('\n').forEach((line) => {
      if (!line) {
        return;
      }
      const lastColon = line.lastIndexOf(':');
      if (lastColon === -1) {
        return;
      }
      const filePath = line.slice(0, lastColon).trim();
      const countText = line.slice(lastColon + 1).trim();
      const count = Number.parseInt(countText, 10);
      if (!filePath || Number.isNaN(count) || count <= 0) {
        return;
      }
      const normalizedFile = filePath.startsWith('./') ? filePath.slice(2) : filePath;
      const current = counts.get(normalizedFile) || 0;
      counts.set(normalizedFile, current + count);
    });
  }
  return counts;
}

function collectFileTermMatches(searchTerms, files) {
  const fileToTerms = new Map();
  searchTerms.forEach((term) => {
    const counts = runRipgrepCount(term, files);
    counts.forEach((count, filePath) => {
      const fileEntry = fileToTerms.get(filePath) || new Map();
      fileEntry.set(term, (fileEntry.get(term) || 0) + count);
      fileToTerms.set(filePath, fileEntry);
    });
  });
  const matches = [];
  fileToTerms.forEach((termMap, filePath) => {
    termMap.forEach((count, term) => {
      if (count > 0) {
        matches.push({ file: filePath, term, count });
      }
    });
  });
  matches.sort((a, b) => {
    const byFile = a.file.localeCompare(b.file);
    if (byFile !== 0) {
      return byFile;
    }
    return a.term.localeCompare(b.term);
  });
  return matches;
}

function runScopeCleanupGuard(pattern, scopeKind, scopeId) {
  const holder =
    scopeKind === 'stage'
      ? pattern.stageGates?.[scopeId]
      : pattern.lanes?.[scopeId];
  const searchTerms = normaliseSearchTerms(holder?.searchTerms || []);
  const plannedFiles = Array.isArray(holder?.plannedFiles) ? [...holder.plannedFiles] : [];
  if (!searchTerms.length) {
    return {
      executed: false,
      reason: 'missing-search-terms',
      searchTerms,
      plannedFiles,
      matches: [],
      expandedFiles: [],
      ignoredFiles: [],
      excludedFiles: []
    };
  }
  if (!plannedFiles.length) {
    return {
      executed: false,
      reason: 'missing-planned-files',
      searchTerms,
      plannedFiles,
      matches: [],
      expandedFiles: [],
      ignoredFiles: [],
      excludedFiles: []
    };
  }
  const {
    expanded: expandedFiles,
    ignored: ignoredFiles,
    excluded: excludedFiles
  } = expandPlannedFileEntries(plannedFiles);
  if (!expandedFiles.length) {
    let reason = 'no-files-resolved';
    if (ignoredFiles.length && !excludedFiles.length) {
      reason = 'only-gitignored';
    } else if (excludedFiles.length && !ignoredFiles.length) {
      reason = 'only-excluded-paths';
    } else if (ignoredFiles.length && excludedFiles.length) {
      reason = 'only-excluded-and-gitignored';
    }
    return {
      executed: false,
      reason,
      searchTerms,
      plannedFiles,
      matches: [],
      expandedFiles: [],
      ignoredFiles,
      excludedFiles
    };
  }
  const matches = collectFileTermMatches(searchTerms, expandedFiles);
  return {
    executed: true,
    reason: null,
    searchTerms,
    plannedFiles,
    matches,
    expandedFiles,
    ignoredFiles,
    excludedFiles
  };
}

function formatScopeLabel(scopeKind, scopeId) {
  return scopeKind === 'stage' ? `stage ${scopeId}` : `lane ${scopeId}`;
}

function formatList(values, formatter = (value) => value) {
  if (!values.length) {
    return '[]';
  }
  return `[${values.map((value) => formatter(value)).join(', ')}]`;
}

function formatMatches(matches) {
  if (!matches.length) {
    return ['(no matches)'];
  }
  return matches.map(
    (entry) => `  • ${entry.file} — "${entry.term}" ×${entry.count}`
  );
}

function buildGuardSuccessMessage(patternId, scopeLabel, outcome) {
  const formattedTerms = formatList(outcome.searchTerms, (term) => `"${term}"`);
  const formattedFiles = formatList(outcome.plannedFiles);
  return `No instances of ${formattedTerms} found in ${formattedFiles} (pattern ${patternId} ${scopeLabel}).`;
}

function buildGuardFailureMessage(patternId, scopeKind, scopeLabel, outcome, forced = false) {
  const formattedTerms = formatList(outcome.searchTerms, (term) => `"${term}"`);
  const formattedFiles = formatList(outcome.plannedFiles);
  const lines = [
    `Pattern ${patternId} ${scopeLabel}: unmigrated patterns found in planned files.`,
    `  Terms: ${formattedTerms}`,
    `  Planned files: ${formattedFiles}`,
    '  Summary:',
    ...formatMatches(outcome.matches)
  ];
  if (forced) {
    lines.push(
      'Proceeding due to --force. Add a stage note explaining the remaining instances in your planned files.'
    );
  } else {
    const scopeNoun = scopeKind === 'stage' ? 'stage' : 'lane';
    lines.push(
      `If these belong in this ${scopeNoun}, migrate them before marking it complete. Otherwise reapply the update with --force and add a stage note explaining the remaining instances in your planned files.`
    );
  }
  return lines.join('\n');
}

function collectSweepScopes(pattern) {
  const stageScopes = Object.entries(pattern.stageGates || {})
    .filter(([, gate]) => normaliseSearchTerms(gate?.searchTerms || []).length)
    .map(([stageId]) => stageId)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const laneScopes = Object.entries(pattern.lanes || {})
    .filter(([, lane]) => normaliseSearchTerms(lane?.searchTerms || []).length)
    .map(([laneId]) => laneId.toLowerCase())
    .sort((a, b) => a.localeCompare(b));
  return {
    stages: stageScopes,
    lanes: laneScopes
  };
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return null;
  }
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const parts = [];
  if (days) {
    parts.push(`${days}d`);
  }
  if (hours % 24) {
    parts.push(`${hours % 24}h`);
  }
  if (minutes % 60 && parts.length < 3) {
    parts.push(`${minutes % 60}m`);
  }
  if (parts.length === 0 && seconds) {
    parts.push(`${seconds % 60}s`);
  }
  return parts.join(' ');
}

function parseScopeKey(entry) {
  if (!entry) {
    return null;
  }
  const [patternToken, scope] = String(entry).split('|');
  if (!patternToken || !scope) {
    return null;
  }
  const patternId = Number.parseInt(patternToken, 10);
  if (Number.isNaN(patternId)) {
    return null;
  }
  return { patternId, scope: scope.toLowerCase() };
}

function collectDependentPatterns(registry, patternId, scope) {
  const dependents = new Set();
  if (!registry || !Array.isArray(registry.patterns)) {
    return dependents;
  }
  const targetScope = scope.toLowerCase();
  registry.patterns.forEach((pattern) => {
    const stageEntries = Object.entries(pattern.stageGates || {});
    stageEntries.forEach(([, gate]) => {
      if (!gate || !Array.isArray(gate.dependencies)) {
        return;
      }
      if (gate.dependencies.some((dep) => dep.patternId === patternId && dep.gate === targetScope)) {
        dependents.add(pattern.patternId);
      }
    });
    const laneEntries = Object.entries(pattern.lanes || {});
    laneEntries.forEach(([, lane]) => {
      if (!lane || !Array.isArray(lane.dependencies)) {
        return;
      }
      if (lane.dependencies.some((dep) => dep.patternId === patternId && dep.gate === targetScope)) {
        dependents.add(pattern.patternId);
      }
    });
  });
  return dependents;
}

function buildRegenRequest(registry) {
  if (!registry) {
    return { forceAll: true };
  }
  const patternSet = new Set(pendingRegen.patterns);
  const cohortSet = new Set(
    [...pendingRegen.cohorts]
      .map((id) => normaliseCohortId(id))
      .filter((id) => id && id.length)
  );
  const scopeEntries = [...pendingRegen.scopes];
  scopeEntries.forEach((entry) => {
    const parsed = parseScopeKey(entry);
    if (!parsed) {
      return;
    }
    patternSet.add(parsed.patternId);
    const dependents = collectDependentPatterns(registry, parsed.patternId, parsed.scope);
    dependents.forEach((id) => patternSet.add(id));
  });
  cohortSet.forEach((cohortId) => {
    const cohort = findCohortById(registry, cohortId);
    if (!cohort || !Array.isArray(cohort.patterns)) {
      return;
    }
    cohort.patterns.forEach((patternId) => {
      const numeric = Number.parseInt(patternId, 10);
      if (!Number.isNaN(numeric)) {
        patternSet.add(numeric);
      }
    });
  });
  patternSet.forEach((patternId) => {
    const pattern = registry.patterns.find((entry) => entry.patternId === patternId);
    if (!pattern) {
      return;
    }
    (getPatternCohortIds(pattern) || []).forEach((cohortId) => {
      if (cohortId || cohortId === 0) {
        cohortSet.add(normaliseCohortId(cohortId));
      }
    });
  });
  if (!patternSet.size && !cohortSet.size) {
    return { forceAll: true };
  }
  return {
    patterns: [...patternSet].sort((a, b) => a - b),
    cohorts: [...cohortSet].sort(),
    includeGlobalSchedule: true
  };
}

function clearPendingRegen() {
  pendingRegen.patterns.clear();
  pendingRegen.scopes.clear();
  pendingRegen.cohorts.clear();
}

function applyPlanFiles(target, planFiles, clearPlanFiles) {
  if (clearPlanFiles) {
    delete target.plannedFiles;
  }
  if (planFiles && planFiles.length) {
    target.plannedFiles = normalisePlanFiles(planFiles);
  }
}

function applySearchTerms(target, searchTerms, clearSearchTerms) {
  if (clearSearchTerms) {
    delete target.searchTerms;
  }
  if (searchTerms && searchTerms.length) {
    target.searchTerms = normaliseSearchTerms(searchTerms);
  }
}

function planFileKey(value) {
  if (!value) {
    return null;
  }
  return value.trim().toLowerCase();
}

function addPlanFilesToMap(map, scopeId, files) {
  if (!files || !files.length) {
    return;
  }
  files.forEach((file) => {
    const key = planFileKey(file);
    if (!key) {
      return;
    }
    const existing = map.get(key);
    if (existing) {
      existing.add(scopeId);
    } else {
      map.set(key, new Set([scopeId]));
    }
  });
}

function collectActivePlanFileMap(pattern, excludeScopeId = null) {
  const map = new Map();
  Object.entries(pattern.stageGates || {}).forEach(([stageId, gate]) => {
    if (!gate || gate.status !== 'in_progress') {
      return;
    }
    const scopeId = `stage-${stageId}`;
    if (excludeScopeId && excludeScopeId === scopeId) {
      return;
    }
    addPlanFilesToMap(map, scopeId, gate.plannedFiles || []);
  });
  Object.entries(pattern.lanes || {}).forEach(([laneId, lane]) => {
    if (!lane || lane.status !== 'in_progress') {
      return;
    }
    const scopeId = `lane-${laneId}`;
    if (excludeScopeId && excludeScopeId === scopeId) {
      return;
    }
    addPlanFilesToMap(map, scopeId, lane.plannedFiles || []);
  });
  return map;
}


function collectRegistryPlanFileMap(registry, options = {}) {
  const map = new Map();
  const excludePatternId = options.excludePatternId || null;
  const excludeScopeId = options.excludeScopeId || null;
  if (!registry || !Array.isArray(registry.patterns)) {
    return map;
  }
  registry.patterns.forEach((pattern) => {
    if (!pattern) {
      return;
    }
    const patternScopePrefix = `pattern-${pattern.patternId}`;
    Object.entries(pattern.stageGates || {}).forEach(([stageId, gate]) => {
      if (!gate || gate.status !== 'in_progress') {
        return;
      }
      const scopeId = `stage-${stageId}`;
      if (excludePatternId && pattern.patternId === excludePatternId && excludeScopeId === scopeId) {
        return;
      }
      addPlanFilesToMap(map, `${patternScopePrefix}:${scopeId}`, gate.plannedFiles || []);
    });
    Object.entries(pattern.lanes || {}).forEach(([laneId, lane]) => {
      if (!lane || lane.status !== 'in_progress') {
        return;
      }
      const scopeId = `lane-${laneId}`;
      if (excludePatternId && pattern.patternId === excludePatternId && excludeScopeId === scopeId) {
        return;
      }
      addPlanFilesToMap(map, `${patternScopePrefix}:${scopeId}`, lane.plannedFiles || []);
    });
  });
  return map;
}

function hasRegistryPlanConflict(registry, planFiles, patternId, scopeId) {
  if (!planFiles || !planFiles.length) {
    return { conflict: false, conflicts: [] };
  }
  const globalMap = collectRegistryPlanFileMap(registry, { excludePatternId: patternId, excludeScopeId: scopeId });
  if (!globalMap.size) {
    return { conflict: false, conflicts: [] };
  }
  const { conflict, conflicts } = findPlanConflicts(planFiles, globalMap);
  if (!conflict) {
    return { conflict: false, conflicts: [] };
  }
  return {
    conflict: true,
    conflicts
  };
}
function findPlanConflicts(planFiles, activeMap) {
  if (!planFiles || !planFiles.length || !activeMap.size) {
    return { conflict: false, conflicts: [] };
  }
  const conflicts = new Set();
  planFiles.forEach((file) => {
    const key = planFileKey(file);
    if (!key) {
      return;
    }
    const scopes = activeMap.get(key);
    if (scopes) {
      scopes.forEach((scope) => conflicts.add(scope));
    }
  });
  return { conflict: conflicts.size > 0, conflicts: [...conflicts].sort() };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0) {
    return { command: 'help', params: [] };
  }
  const [command, ...params] = args;
  return { command, params };
}

function parseGuidePatternShorthand(rawToken) {
  if (typeof rawToken !== 'string') {
    return { errors: [] };
  }
  const colonIndex = rawToken.indexOf(':');
  if (colonIndex === -1) {
    return { errors: [] };
  }
  const suffix = rawToken.slice(colonIndex + 1);
  if (!suffix) {
    return { errors: [] };
  }
  const segments = suffix
    .split(':')
    .map((segment) => segment.trim())
    .filter(Boolean);
  const result = {
    stage: undefined,
    lane: undefined,
    showLanes: false,
    showRecent: false,
    focusNext: false,
    errors: []
  };
  segments.forEach((segment) => {
    const lower = segment.toLowerCase();
    if (lower.startsWith('lane-')) {
      if (result.lane) {
        result.errors.push('guide: multiple lane shorthands specified.');
        return;
      }
      const laneId = lower.slice(5);
      if (!laneId || !/^[0-9]+[a-z]$/.test(laneId)) {
        result.errors.push(`guide: invalid lane shorthand "${segment}".`);
        return;
      }
      result.lane = laneId;
      return;
    }
    if (lower.startsWith('stage-')) {
      if (result.stage) {
        result.errors.push('guide: multiple stage shorthands specified.');
        return;
      }
      const stageId = segment.slice(6);
      if (!stageId) {
        result.errors.push(`guide: invalid stage shorthand "${segment}".`);
        return;
      }
      result.stage = stageId;
      return;
    }
    if (lower === 'lanes') {
      result.showLanes = true;
      return;
    }
    if (lower === 'recent') {
      result.showRecent = true;
      return;
    }
    if (lower === 'next' || lower === 'n') {
      result.focusNext = true;
      return;
    }
    // Unknown segment: treat as error so the agent corrects the input.
    result.errors.push(`guide: unrecognised shorthand segment "${segment}".`);
  });
  return result;
}

const stageOrder = ['1', '2', '3', '4', '5', '6', '7'];
const guideStageOrder = new Set([...stageOrder, '5a']);

function displayStageId(stageId) {
  if (stageId === undefined || stageId === null) {
    return '';
  }
  const raw = String(stageId).trim();
  if (!raw) {
    return '';
  }
  const lower = raw.toLowerCase();
  if (lower === '5a') {
    return '5A';
  }
  if (lower === '5' || lower === '5b') {
    return '5B';
  }
  if (/^\d+$/.test(lower)) {
    return lower;
  }
  return raw.toUpperCase();
}

function displayStageLabel(stageId) {
  const id = displayStageId(stageId);
  return id ? `Stage ${id}` : 'Stage';
}

function normalizeGuideStageOption(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  const raw = String(value).trim();
  if (!raw.length) {
    return undefined;
  }
  const lower = raw.toLowerCase();
  if (lower === '5b') {
    return '5';
  }
  if (guideStageOrder.has(lower)) {
    return lower;
  }
  const numeric = Number.parseInt(raw, 10);
  if (!Number.isNaN(numeric)) {
    const normalized = String(numeric);
    if (guideStageOrder.has(normalized)) {
      return normalized;
    }
  }
  throw new Error(`guide: invalid stage ${value}`);
}
const stageGuidance = {
  '1': {
    title: 'Stage 1 — Scope & Inventory',
    reminders: [
      'Review the Stage 1 discovery notes before resuming so context stays aligned.',
      'Capture discovery commands, consumer inventory, and preliminary cluster buckets (top emitters, adapters, orchestrators) in the registry before moving forward.',
      'Draft the Stage 1 exit summary only after synthesising the inventory into priorities, guardrails, and doc/progress follow-ups so Stage 2/3 inherit actionable context.',
      'Keep zero-knowledge seams untouched—verify ServiceDiscovery and ConnectionFactory usages remain backend-agnostic as you map consumers.',
      'When follow-up work emerges, attach dependencies to the owning stage or create a dedicated lane so the CLI drives the next action instead of out-of-band notes.',
      'Unsure about CLI syntax? Run `npm run consolidate -- help` before diving into docs or source references.'
    ]
  },
  '2': {
    title: 'Stage 2 — Test-First Utility Updates',
    reminders: [
      'Author or refresh regression suites before implementation per Testing Guide expectations.',
      'Keep DI seams and shared utility guardrails aligned with Stage 1 notes.',
      'Record executed commands, logs, and outcomes in the registry so generated plans stay accurate.',
      'When later stages surface new coverage gaps, reopen Stage 2 and add fresh tests—do not reopen completed lanes or repurpose executed suites.',
      'Track blockers with dependencies (and companion lanes if needed) so downstream agents see exactly what must finish before Stage 2 can close.',
      'Unsure about CLI syntax? Run `npm run consolidate -- help` before diving into docs or source references.'
    ]
  },
  '3': {
    title: 'Stage 3 — Migration Orchestration',
    reminders: [
      'Capture Stage 4 guardrail lanes and their paired Stage 6 runtime lanes inside the Stage 3 note so downstream owners see the one-to-one mapping immediately.',
      'Run the migration search (e.g., `rg`) for the required terms, classify each hit as guardrail (tests/helpers) or runtime (production surfaces), and assign them to the correct lane.',
      'Keep Stage 4 and Stage 6 plan-files/search terms disjoint while mirroring the full term set onto Stage 7 (add the project root, e.g., `Templum/`, to Stage 7 plan-files) so sweeps enforce the contract.',
      'Keep cross-pattern coordination in the registry (Stage 3 note + activity) so downstream owners have a single source and can correct plan-file collisions early.',
      'If dependencies shift, add a Stage 3 note and notify the affected pattern owners instead of editing manual trackers.',
      'Completed lanes stay sealed; when new migration cohorts emerge, create additional Stage 6 lanes and capture the change in a fresh Stage 3 note rather than reopening prior work.',
      'When orchestration is blocked, record it with dependencies referencing the exact lane/stage that must move so coordination stays in-band.',
      'Unsure about CLI syntax? Run `npm run consolidate -- help` before diving into docs or source references.'
    ]
  },
  '4': {
    title: 'Stage 4 — Prerequisites',
    reminders: [
      'Use Stage 4 to author/refine guardrail suites, fixtures, and helpers that fail until the migration lands; record the failing signature in the lane notes.',
      'Attach the timeout-wrapper log from the failing guardrail run so downstream owners can replay the baseline without guesswork.',
      'Keep guardrail assets isolated from runtime migration surfaces—update paired Stage 6 lanes whenever new coverage emerges.',
      'If a guardrail unexpectedly passes, reopen the coverage work (Stage 2/3) or block the lane before closing so false greens do not leak downstream.',
      'Need a deeper walkthrough? See “Stage 3 Orchestration Checklist” in consolidation-cli-spec.md for the full pairing process.',
      'Unsure about CLI syntax? Run `npm run consolidate -- help` before diving into docs or source references.'
    ]
  },
  '5a': {
    title: 'Stage 5A — Cohort Alignment',
    reminders: [
      'Capture the alignment session using `cohort-stage --segment 5a` with notes, plan files, and timing so downstream Stage 5B owners inherit the record.',
      'Ensure Stage 4 guardrails (adapter cleanup, session lifecycle hooks, telemetry wiring, skin engine readiness) remain satisfied across all cohort patterns before closing the segment.',
      'When new risks emerge, log them in the cohort notes and attach dependencies to the blocking pattern so the registry schedule stays authoritative.',
      'For the full playbook, review “Stage 5A Cohort Alignment Workflow” in consolidation-cli-spec.md if the CLI summary is not enough.',
      'Unsure about CLI syntax? Run `npm run consolidate -- help` before diving into docs or source references.'
    ]
  },
  '5': {
    title: 'Stage 5B — Cohort Alignment & Prep',
    reminders: [
      'Aggregate Stage 4 guardrail artefacts (expected failure logs, helper locations, owners) inside Stage 5 notes and the hand-off record so execution lanes inherit the baseline.',
      'Replay the guardrail battery to confirm it still fails pre-migration; document the command preset, failure signature, and the migration checklist each Stage 6 lane must follow.',
      'Refine Stage 6 lanes so each one references its guardrail counterpart, dependencies, and runtime plan-files before unlocking them for execution.',
      'Use Stage 5B notes/activity entries to broadcast approvals and readiness; keep the stage open until every lane has clear instructions and evidence attached.',
      'When alignment waits on another scope, add explicit dependencies (or new lanes) so the schedule reflects the outstanding work.',
      'Unsure about CLI syntax? Run `npm run consolidate -- help` before diving into docs or source references.'
    ]
  },
  '6': {
    title: 'Stage 6 — Migration',
    reminders: [
      'Work one lane at a time; start every session by replaying the Stage 4 guardrail to confirm the expected failure and log the evidence before editing.',
      'Apply the migration, rerun the guardrail until it passes, and attach both failing and passing logs so Stage 7 can audit the full arc.',
      'Run the cleanup sweep (`npm run consolidate -- sweep <patternId> --lane <laneId>`) before marking a lane complete; the CLI enforces this guard.',
      'Flip Stage 3 glyph back to `[~]` when new migration scope appears, but keep completed lanes closed—add a new lane instead of reopening the finished one.',
      'If a guardrail still fails after migration, block the lane, attach dependencies to the remediation scope, and capture the follow-up via `append-activity`.',
      'Use `claim` with `--lane` to avoid collisions, and keep dependencies updated so scheduling stays authoritative.',
      'Unsure about CLI syntax? Run `npm run consolidate -- help` before diving into docs or source references.'
    ]
  },
  '7': {
    title: 'Stage 7 — Validation & Close-Out',
    reminders: [
      'Execute Stage 7 validation battery (targeted suites + phase6 health/validation).',
      'Run the cleanup sweep (`npm run consolidate -- sweep <patternId> --stage 7`) to confirm no revertable code remains; Stage 7 completion is blocked until the sweep passes.',
      'When scope shifts, append a Stage 7 note that calls out the reason and the Stage 7 validation to rerun so the next owner sees the latest checklist.',
      'Document outstanding follow-ups (e.g., real backend coverage) in notes or dev tasks.',
      'Update progress trackers and archive final evidence in the activity log.',
      'If validation stalls, add dependencies pointing at the remediation owner (stage or lane) so the follow-up is tracked within the registry.',
      'Unsure about CLI syntax? Run `npm run consolidate -- help` before diving into docs or source references.'
    ]
  }
};

const stageActionGuidance = {
  '1': (pattern) => [
    `1. Claim this stage with \`npm run consolidate -- claim ${pattern.patternId} --stage 1\`.`,
    `2. Run the discovery commands (e.g., \`rg --stats\`, \`rg --files-with-matches\`) and capture what you find via \`npm run consolidate -- stage-note ${pattern.patternId} 1 --body "Consumers: ...; Guardrails: ..."\`.`,
    `3. Convert the inventory into priorities, cohorts, and doc updates; attach dependencies for any downstream stage or lane that must unblock the plan.`,
    `4. When Stage 1 outputs are ready, close it with \`npm run consolidate -- update-stage ${pattern.patternId} 1 --status complete --notes "Exit: clusters/priorities/next-docs"\`.`,
    `Need a full snapshot later? Use \`npm run consolidate -- status ${pattern.patternId}\` to review the registry state before handing off.`
  ],
  '2': (pattern) => [
    `1. Claim this stage with \`npm run consolidate -- claim ${pattern.patternId} --stage 2\`.`,
    `2. Author or refresh the regression suites up front; log the plan with \`npm run consolidate -- stage-note ${pattern.patternId} 2 --body "Suites: ...; Guardrails: ..."\` and note which timeout wrapper preset (\`--preset jest-suite\` for targeted files, \`--preset jest-ci\` for bundled commands) you’ll apply.`,
    `3. Execute the suites via \`node scripts/run-with-timeout.mjs --preset <preset> -- npm …\` (e.g., \`--preset jest-ci\` for \`npm run test:ci\`) and update evidence using \`npm run consolidate -- update-stage ${pattern.patternId} 2 --status in_progress --files <log>\` as you collect artefacts.`,
    `4. Mark Stage 2 complete via \`npm run consolidate -- update-stage ${pattern.patternId} 2 --status complete --notes "Results: ..."\` once coverage is green. If gaps arise later, reopen the stage and attach dependencies to the blocking lane.`,
    `Need recent history? Run \`npm run consolidate -- guide ${pattern.patternId} --recent\` for the latest activity summaries.`
  ],
  '3': (pattern) => [
    `1. Claim this stage with \`npm run consolidate -- claim ${pattern.patternId} --stage 3\`.`,
    `2. Use \`npm run consolidate -- create-lane ${pattern.patternId} <laneId>\` to declare Stage 4 guardrail lanes alongside their paired Stage 6 runtime lanes; keep guardrail plan-files limited to tests/helpers and record the mapping in the Stage 3 note.`,
      `3. Run the migration search (e.g., \`rg\`) for every required term, then apply guardrail hits to the Stage 4 lanes and runtime hits to the Stage 6 companions via \`update-lane … --plan-files … --search-terms …\`. (Need more context? See “Stage 3 Orchestration Checklist” in consolidation-cli-spec.md.)`,
    `4. Mirror the combined search-term list onto Stage 7 and add the project root (e.g., \`Templum/\`) with \`npm run consolidate -- update-stage ${pattern.patternId} 7 --plan-files "Templum/" --search-terms "<term1,term2,...>"\` so sweeps cover the entire migration contract.`,
    `5. Capture sequencing, guardrail failure signatures, and dependencies with \`npm run consolidate -- stage-note ${pattern.patternId} 3 --body "Order: ...; Guardrails: ...; Dependencies: ..."\`.`,
    `6. When orchestration is solid, close Stage 3 via \`npm run consolidate -- update-stage ${pattern.patternId} 3 --status complete --notes "Stage 4/6 defined; blockers recorded"\`.`,
    `If additional cohorts appear, reopen Stage 3 and add the new lanes plus dependencies before handing off.`
  ],
  '4': (pattern, context = {}) => {
    const laneId = context.laneId || context.suggestedLaneId || '<laneId>';
    return [
      `1. Claim this lane with \`npm run consolidate -- claim ${pattern.patternId} --lane ${laneId}\`.`,
      `2. Outline the guardrail you are authoring—including the expected failure text and paired Stage 6 lane—in a Stage 4 note via \`npm run consolidate -- stage-note ${pattern.patternId} 4 --body "Lane ${laneId}: Guardrail=<...>; Expected failure=<...>; Paired Stage 6=<...>"\`.`,
      `3. Implement or refresh the guardrail and run it via \`node scripts/run-with-timeout.mjs --preset <preset> -- …\` (pick \`jest-suite\`, \`jest-ci\`, or \`phase6-validation\` as needed); log the failing artefact with \`npm run consolidate -- update-lane ${pattern.patternId} ${laneId} --status in_progress --files <log> --summary "Expected failure: <signature>"\`.`,
      `4. If the guardrail passes unexpectedly, flip the lane to blocked, reopen the required coverage stage, and log the blocker with \`npm run consolidate -- append-activity ${pattern.patternId} --lane ${laneId} --summary "Guardrail passed unexpectedly — follow-up: <action>"\` before proceeding.`,
      `5. Once the guardrail fails deterministically, close the lane with \`npm run consolidate -- update-lane ${pattern.patternId} ${laneId} --status complete --summary "Guardrail failing as expected; Stage 6 <pairedLaneId> primed" --files <log>\`, and mirror any new guardrail links onto the paired Stage 6 lane via \`update-lane\` so execution owners inherit the instructions.`
    ];
  },
  '5a': (pattern, context = {}) => {
    const cohorts = context.stage5a?.cohortIds?.length ? context.stage5a.cohortIds : getPatternCohortIds(pattern);
    const cohortList = cohorts.length ? cohorts.join(', ') : '<cohortId>';
    return [
      `1. Kick off each cohort (${cohortList}) with \`npm run consolidate -- cohort-stage <cohortId> --segment 5a --status in_progress --notes "<alignment summary>" --plan-files <alignment-spec.md>\` so the registry records the shared spec path, start time, and any artefacts you gather.`,
      `2. Author or refresh the cohort alignment spec under \`dev/architecture/…\`, capturing Stage 4 guardrails, a shared-dependencies matrix, DI seams, required cleanup/doc updates, gating command wrappers, approvals, and outstanding risks; keep the file listed in \`--plan-files\`/ \`--files\` as you attach evidence.`,
      `3. Log Stage 5 notes or activity entries for each pattern referencing the spec location and highlighting the decisions/alignment outputs so Stage 5B owners inherit the contract without rereading every lane note.`,
      `4. Attach dependencies for any follow-up work uncovered during alignment via \`npm run consolidate -- update-lane … --add-dependency <csv>\` or \`--update-stage …\` and capture the open items (missing tests, doc syncs, telemetry gaps, etc.) directly in the spec.`,
      `5. Close the cohort segment with \`npm run consolidate -- cohort-stage <cohortId> --segment 5a --status complete --notes "<outcome>" --plan-files <alignment-spec.md>\` once the spec is published, activity entries are filed, and evidence is archived; nudge Stage 5B docs/progress trackers immediately afterward.`
    ];
  },
  '5': (pattern) => [
    `1. Claim this stage with \`npm run consolidate -- claim ${pattern.patternId} --stage 5\`.`,
    `2. Use \`npm run consolidate -- stage-note ${pattern.patternId} 5 --body "Guardrails: ...; Approvals: ...; Stage6 lanes: ..."\` and \`update-handoff\` to capture the baseline failure logs, ownership, and migration checklist that Stage 6 will execute.`,
    `3. Replay the guardrail battery via \`node scripts/run-with-timeout.mjs --preset <preset> -- …\` (e.g., \`--preset phase6-validation -- npm run phase6-validation\`) to confirm the unmigrated failure still reproduces; record the log with \`npm run consolidate -- update-stage ${pattern.patternId} 5 --status in_progress --files <log>\`.`,
    `4. Update each Stage 6 lane with the guardrail reference, dependencies, and expected migration steps via \`npm run consolidate -- update-lane ${pattern.patternId} <stage6LaneId> --summary "Guardrail: <suite>; Steps: <...>" --add-dependency ${pattern.patternId}:<stage4LaneId>\` (swap placeholders) so execution owners inherit clear instructions.`,
    `5. Close Stage 5B with \`npm run consolidate -- update-stage ${pattern.patternId} 5 --status complete --notes "Guardrails rehearsed; Stage 6 lanes unlocked"\` only after every lane has evidence and instructions attached.`,
    `If alignment stalls, keep Stage 5B in progress, attach dependencies to the waiting work, and surface the delay in the activity log.`
  ],
  '6': (pattern, context = {}) => {
    const laneId = context.laneId || context.suggestedLaneId || '<laneId>';
    return [
      `1. Start by claiming this lane (\`npm run consolidate -- claim ${pattern.patternId} --lane ${laneId}\`); do not run migration commands until the claim is recorded.`,
      `2. Reproduce the Stage 4 guardrail failure via \`node scripts/run-with-timeout.mjs --preset <preset> -- …\` and attach the failing log with \`npm run consolidate -- update-lane ${pattern.patternId} ${laneId} --status in_progress --files <fail-log> --summary "Baseline failure: <signature>"\`.`,
      `3. Apply the migration, rerun the guardrail (plus any Stage 6 battery such as \`npm run test:ci\` or \`npm run phase6-validation\`) until it passes, and capture the passing artefact with \`npm run consolidate -- update-lane ${pattern.patternId} ${laneId} --files <pass-log> --summary "Guardrail passing; commands=<...>"\`.`,
      `4. Run the cleanup sweep with \`npm run consolidate -- sweep ${pattern.patternId} --lane ${laneId}\`; clear any matches before closing the lane via \`npm run consolidate -- update-lane ${pattern.patternId} ${laneId} --status complete --summary "Migration complete; sweep clean" --files <pass-log>\`.`,
      `5. If a blocker appears (e.g., guardrail still failing or new scope discovered), immediately set the lane to blocked, attach the dependency to the owning scope, and record details with \`npm run consolidate -- append-activity ${pattern.patternId} --lane ${laneId} --summary "Blocker: <details>"\`; otherwise keep Stage 6 notes/activity entries current and leave the stage pending until every lane is [x].`
    ];
  },
  '7': (pattern) => [
    `1. Claim this stage with \`npm run consolidate -- claim ${pattern.patternId} --stage 7\`.`,
    `2. Execute the Stage 7 validation battery through \`node scripts/run-with-timeout.mjs --preset <preset> -- …\` (match the preset to each command) and store artefacts using \`npm run consolidate -- update-stage ${pattern.patternId} 7 --status in_progress --files <log>\`.`,
    `3. Add a Stage 7 note capturing the reason for the scope change, the validations to rerun, and confirmation that required documentation/progress trackers were updated (automation pending) via \`npm run consolidate -- stage-note ${pattern.patternId} 7 --body "Reason: ...; Required check: ...; Docs verified: <paths>"\`.`,
    `4. Run the cleanup sweep via \`npm run consolidate -- sweep ${pattern.patternId} --stage 7\`; once it passes and documentation is updated, mark Stage 7 complete with \`npm run consolidate -- update-stage ${pattern.patternId} 7 --status complete --notes "Release-ready"\`.`,
    `If regressions appear later, reopen Stage 7, attach dependencies to the remediation scope, and coordinate via the activity log.`
  ]
};

const stageCompletionStatuses = new Set(['complete']);
const stageReadyCompletionStatuses = new Set(['complete']);
const stageProgressStatuses = new Set(['pending', 'blocked', 'in_progress']);
const cohortStageSatisfiedStatuses = new Set(['complete']);
const autoStageStatuses = new Set(['pending', 'blocked']);
const autoLaneStatuses = new Set(['pending', 'blocked']);
const planConflictResolvedLaneStatuses = new Set(['complete', 'ready_for_handoff', 'cancelled', 'deferred']);

function normalisePlanFileKey(path) {
  if (!path) {
    return '';
  }
  return path.trim().toLowerCase();
}

function lanePlanFileKeys(lane) {
  if (!lane) {
    return [];
  }
  return normalisePlanFiles(lane.plannedFiles || []).map(normalisePlanFileKey).filter(Boolean);
}

function collectStageLaneEntries(pattern, laneId) {
  const targetStageNumber = inferStageNumberFromLaneId(laneId);
  if (targetStageNumber === null) {
    return [];
  }
  return Object.entries(pattern.lanes || {})
    .filter(([otherId]) => inferStageNumberFromLaneId(otherId) === targetStageNumber)
    .sort(([aId], [bId]) => aId.localeCompare(bId, undefined, { numeric: true }));
}

function findPlanFileBlockingLaneIds(pattern, laneId) {
  const entries = collectStageLaneEntries(pattern, laneId);
  if (!entries.length) {
    return [];
  }
  const targetIndex = entries.findIndex(([candidateId]) => candidateId === laneId);
  if (targetIndex <= 0) {
    return [];
  }
  const targetKeys = lanePlanFileKeys(pattern.lanes?.[laneId]);
  if (!targetKeys.length) {
    return [];
  }
  const blocking = new Set();
  for (let index = 0; index < targetIndex; index += 1) {
    const [otherId, otherLane] = entries[index];
    const otherKeys = lanePlanFileKeys(otherLane);
    if (!otherKeys.length) {
      continue;
    }
    const overlaps = targetKeys.some((key) => otherKeys.includes(key));
    if (!overlaps) {
      continue;
    }
    const status = (otherLane.status || '').toLowerCase();
    if (!planConflictResolvedLaneStatuses.has(status)) {
      blocking.add(otherId);
    }
  }
  return [...blocking];
}

function compareLaneOrder(patternIdA, laneIdA, patternIdB, laneIdB) {
  const numericA = Number.parseInt(patternIdA, 10);
  const numericB = Number.parseInt(patternIdB, 10);
  if (!Number.isNaN(numericA) && !Number.isNaN(numericB) && numericA !== numericB) {
    return numericA - numericB;
  }
  const stringA = String(patternIdA);
  const stringB = String(patternIdB);
  if (stringA !== stringB) {
    return stringA.localeCompare(stringB, undefined, { numeric: true });
  }
  return String(laneIdA).localeCompare(String(laneIdB), undefined, { numeric: true });
}

function findCohortPlanFileBlockingEntries(registry, pattern, laneId) {
  const laneStage = inferStageNumberFromLaneId(laneId);
  if (laneStage !== 6) {
    return [];
  }
  const cohortIds = getPatternCohortIds(pattern).map(normaliseCohortId);
  if (!cohortIds.length) {
    return [];
  }
  const cohort = findCohortById(registry, cohortIds[0]);
  if (!cohort) {
    return [];
  }
  const targetKeys = lanePlanFileKeys(pattern.lanes?.[laneId]);
  if (!targetKeys.length) {
    return [];
  }
  const blockers = [];
  const targetPatternId = pattern.patternId;
  const targetLaneId = laneId;
  (cohort.patterns || []).forEach((memberId) => {
    if (memberId === targetPatternId) {
      return;
    }
    const memberPattern = getPatternById(registry, memberId);
    if (!memberPattern) {
      return;
    }
    Object.entries(memberPattern.lanes || {}).forEach(([otherLaneId, otherLane]) => {
      if (inferStageNumberFromLaneId(otherLaneId) !== laneStage) {
        return;
      }
      const otherKeys = lanePlanFileKeys(otherLane);
      if (!otherKeys.length) {
        return;
      }
      if (!targetKeys.some((key) => otherKeys.includes(key))) {
        return;
      }
      const status = (otherLane.status || '').toLowerCase();
      if (planConflictResolvedLaneStatuses.has(status)) {
        return;
      }
      if (compareLaneOrder(memberPattern.patternId, otherLaneId, targetPatternId, targetLaneId) < 0) {
        blockers.push({ patternId: memberPattern.patternId, laneId: otherLaneId });
      }
    });
  });
  return blockers;
}

function normaliseCohortId(value) {
  if (value === undefined || value === null) {
    throw new Error('Cohort id cannot be empty.');
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    throw new Error('Cohort id cannot be empty.');
  }
  return trimmed.toUpperCase();
}

function touchCohort(cohort) {
  if (cohort) {
    cohort.updatedAt = nowIso();
    markCohortForRegen(cohort.id);
  }
}

function getCohortCollection(registry) {
  if (!registry.cohorts) {
    registry.cohorts = [];
  }
  return registry.cohorts;
}

function findCohortById(registry, cohortId) {
  const canonicalId = resolveCanonicalCohortId(registry, cohortId);
  return (registry.cohorts || []).find((cohort) => normaliseCohortId(cohort.id) === canonicalId) || null;
}

function ensureCohort(registry, cohortId, options = {}) {
  const cohorts = getCohortCollection(registry);
  let cohort = findCohortById(registry, cohortId);
  if (!cohort) {
    cohort = {
      id: normaliseCohortId(cohortId),
      patterns: []
    };
    if (options.name) {
      cohort.name = options.name;
    }
    cohorts.push(cohort);
  } else if (options.name) {
    cohort.name = options.name;
  }
  if (options.description) {
    cohort.description = options.description;
  }
  touchCohort(cohort);
  return cohort;
}

function getPatternCohortIds(pattern) {
  return Array.isArray(pattern.cohorts) ? [...pattern.cohorts] : [];
}

function attachPatternToCohort(cohort, patternId) {
  if (!cohort.patterns.includes(patternId)) {
    cohort.patterns.push(patternId);
    cohort.patterns.sort((a, b) => a - b);
  }
}

function detachPatternFromCohort(cohort, patternId) {
  const next = cohort.patterns.filter((id) => id !== patternId);
  cohort.patterns = next;
}

function requirePatternById(registry, patternId) {
  const pattern = (registry.patterns || []).find((p) => p.patternId === patternId);
  if (!pattern) {
    throw new Error(`Pattern ${patternId} not found in registry.`);
  }
  return pattern;
}

function getCohortStageEntry(cohort, segment) {
  if (!cohort) {
    return null;
  }
  const normalizedSegment = segment.toLowerCase();
  const stages = cohort.stages || (cohort.stages = {});
  return stages[normalizedSegment] || null;
}

function ensureCohortStage(cohort, segment) {
  const normalizedSegment = segment.toLowerCase();
  const stages = cohort.stages || (cohort.stages = {});
  let entry = stages[normalizedSegment];
  if (!entry) {
    entry = {
      segment: normalizedSegment,
      status: 'blocked'
    };
    stages[normalizedSegment] = entry;
  }
  return entry;
}

function setCohortStageStatus(cohort, segment, status, options = {}) {
  const entry = ensureCohortStage(cohort, segment);
  const previousStatus = entry.status || 'blocked';
  entry.status = status;
  if (options.notes !== undefined) {
    if (!options.notes) {
      delete entry.notes;
    } else {
      entry.notes = options.notes;
    }
  }
  if (options.planFiles || options.clearPlanFiles) {
    applyPlanFiles(entry, options.planFiles, options.clearPlanFiles);
  }
  const nowTimestamp = nowIso();
  if (status === 'in_progress') {
    if (options.startedAt) {
      entry.startedAt = options.startedAt;
    } else if (!entry.startedAt || previousStatus !== 'in_progress') {
      entry.startedAt = nowTimestamp;
    }
    if (options.completedAt) {
      entry.completedAt = options.completedAt;
    } else {
      delete entry.completedAt;
    }
  } else {
    if (previousStatus === 'in_progress' && entry.startedAt) {
      const durationMs = computeDurationMs(entry.startedAt, options.completedAt || nowTimestamp);
      if (durationMs) {
        entry.elapsedMs = durationMs;
      } else {
        delete entry.elapsedMs;
      }
    }
    if (options.completedAt) {
      entry.completedAt = options.completedAt;
    } else if (status === 'complete') {
      entry.completedAt = nowTimestamp;
    } else {
      delete entry.completedAt;
    }
    if (status === 'pending' || status === 'blocked') {
      delete entry.startedAt;
      delete entry.elapsedMs;
      delete entry.completedAt;
    } else if (options.startedAt && !entry.startedAt) {
      entry.startedAt = options.startedAt;
    }
  }
  touchCohort(cohort);
  return { entry, previousStatus };
}

function getPatternStageStatus(pattern, stageId) {
  const status = pattern.stageGates?.[stageId]?.status;
  if (status) {
    return status;
  }
  return defaultStageStatus(stageId);
}

function lanesForStage(pattern, stagePrefix) {
  return Object.entries(pattern.lanes || {})
    .filter(([laneId]) => laneId.startsWith(stagePrefix))
    .map(([laneId, lane]) => ({ laneId, lane }));
}

function lanesCompleteForStage(pattern, stagePrefix) {
  const lanes = lanesForStage(pattern, stagePrefix);
  if (!lanes.length) {
    return true;
  }
  return lanes.every(({ lane }) => lane && lane.status === 'complete');
}

function patternStage4Ready(pattern) {
  const stage3Status = getPatternStageStatus(pattern, '3');
  if (!stageCompletionStatuses.has(stage3Status)) {
    return false;
  }
  return lanesCompleteForStage(pattern, '4');
}

function cohortStage4Ready(registry, cohort) {
  return (cohort.patterns || []).every((patternId) => {
    const pattern = getPatternById(registry, patternId);
    if (!pattern) {
      return false;
    }
    return patternStage4Ready(pattern);
  });
}

function cohortStage5AComplete(cohort) {
  const entry = getCohortStageEntry(cohort, '5a');
  if (!entry) {
    return false;
  }
  return cohortStageSatisfiedStatuses.has(entry.status);
}

function evaluateStage5Gate(registry, pattern) {
  const cohortIds = getPatternCohortIds(pattern);
  if (!cohortIds.length) {
    return { stage4Ready: true, stage5AReady: true, blockers: [] };
  }
  const blockers = [];
  let stage4Ready = true;
  let stage5AReady = true;
  cohortIds.forEach((cohortId) => {
    const cohort = findCohortById(registry, cohortId);
    if (!cohort) {
      stage4Ready = false;
      blockers.push(`Cohort ${cohortId} is missing from registry`);
      return;
    }
    if (!cohortStage4Ready(registry, cohort)) {
      stage4Ready = false;
      blockers.push(`Cohort ${cohort.id} Stage 4 lanes incomplete`);
    }
    if (!cohortStage5AComplete(cohort)) {
      stage5AReady = false;
      blockers.push(`Cohort ${cohort.id} Stage 5A pending`);
    }
  });
  return { stage4Ready, stage5AReady, blockers };
}

function normaliseStageStatusValue(status) {
  if (!status) {
    return 'blocked';
  }
  const lower = String(status).toLowerCase();
  if (stageStatusMetadata[lower]) {
    return lower;
  }
  return 'blocked';
}

function aggregateStageStatuses(statuses) {
  if (!statuses.length) {
    return 'complete';
  }
  const normalized = statuses.map(normaliseStageStatusValue);
  if (normalized.some((status) => status === 'blocked')) {
    return 'blocked';
  }
  if (normalized.some((status) => status === 'pending')) {
    return 'pending';
  }
  if (normalized.some((status) => status === 'in_progress')) {
    return 'in_progress';
  }
  if (normalized.some((status) => status === 'ready')) {
    return 'ready';
  }
  if (normalized.every((status) => status === 'complete')) {
    return 'complete';
  }
  return normalized[0] || 'blocked';
}

function collectStage5aContext(registry, pattern) {
  const cohortIds = getPatternCohortIds(pattern);
  const cohortDetails = cohortIds.map((cohortId) => {
    const cohort = findCohortById(registry, cohortId);
    if (!cohort) {
      return {
        cohortId,
        cohort: null,
        entry: null,
        status: 'blocked',
        patterns: []
      };
    }
    const entry = getCohortStageEntry(cohort, '5a');
    const status = entry ? normaliseStageStatusValue(entry.status) : 'pending';
    const patterns = (cohort.patterns || [])
      .map((id) => getPatternById(registry, id))
      .filter(Boolean);
    return {
      cohortId,
      cohort,
      entry,
      status,
      patterns
    };
  });
  const aggregateStatus = cohortDetails.length
    ? aggregateStageStatuses(cohortDetails.map((detail) => detail.status))
    : 'complete';
  const aggregateGlyph = stageStatusMetadata[aggregateStatus]?.glyph || '[ ]';
  const aggregateLabel = stageStatusMetadata[aggregateStatus]?.label || aggregateStatus;
  const actionable = aggregateStatus !== 'complete';
  return {
    cohorts: cohortDetails,
    aggregateStatus,
    aggregateGlyph,
    aggregateLabel,
    actionable,
    cohortIds
  };
}

function printStage4SummaryForPattern(pattern, indent = '    ') {
  const patternLabel = pattern.name ? `${pattern.patternId} — ${pattern.name}` : `Pattern ${pattern.patternId}`;
  console.log(`${indent}• ${patternLabel}`);

  const stage4Gate = pattern.stageGates?.['4'];
  const stage4Status = normaliseStageStatusValue(stage4Gate?.status || defaultStageStatus('4'));
  const stage4Glyph = stageStatusMetadata[stage4Status]?.glyph || '[ ]';
  console.log(`${indent}  Stage 4: ${stage4Glyph} ${stage4Status}`);
  if (stage4Gate?.elapsedMs) {
    const elapsed = formatDuration(stage4Gate.elapsedMs);
    if (elapsed) {
      console.log(`${indent}  Stage 4 elapsed: ${elapsed}`);
    }
  }
  if (stage4Gate?.completedAt) {
    console.log(`${indent}  Completed at: ${stage4Gate.completedAt}`);
  }

  const stage4Lanes = Object.keys(pattern.lanes || {}).filter((laneId) => laneId.startsWith('4')).sort();
  if (stage4Lanes.length) {
    console.log(`${indent}  Stage 4 lanes:`);
    stage4Lanes.forEach((laneId) => {
      const lane = pattern.lanes[laneId];
      if (!lane) {
        return;
      }
      const laneStatus = formatLaneStatus(laneId, lane);
      console.log(`${indent}    ${laneStatus}`);
      if (lane.commands?.length) {
        lane.commands.forEach((cmd) => {
          const statusSuffix = cmd.status ? ` [${cmd.status}]` : '';
          const executedSuffix = cmd.executedAt ? ` @ ${cmd.executedAt}` : '';
          const summarySuffix = cmd.summary ? ` — ${cmd.summary}` : '';
          console.log(`${indent}      • ${cmd.command}${statusSuffix}${executedSuffix}${summarySuffix}`);
        });
      }
      if (lane.plannedFiles?.length) {
        console.log(`${indent}      Planned files: ${lane.plannedFiles.join(', ')}`);
      }
    });
  } else {
    console.log(`${indent}  Stage 4 lanes: (none recorded)`);
  }

  const stage4Notes = getStageNotesSorted(pattern, '4');
  if (stage4Notes.length) {
    console.log(`${indent}  Stage 4 notes:`);
    stage4Notes.forEach((note) => {
      const author = note.author ? ` — ${note.author}` : '';
      console.log(`${indent}    • ${note.timestamp}${author}: ${note.body}`);
    });
  }
}

function printStage5aDetail(registry, pattern, context) {
  const cohortPatterns = new Map();
  cohortPatterns.set(pattern.patternId, pattern);
  (context.cohorts || []).forEach((detail) => {
    (detail.patterns || []).forEach((cohortPattern) => {
      if (cohortPattern?.patternId !== undefined && !cohortPatterns.has(cohortPattern.patternId)) {
        cohortPatterns.set(cohortPattern.patternId, cohortPattern);
      }
    });
  });
  if (!cohortPatterns.size) {
    return;
  }
  console.log('');
  console.log('Stage 4 readiness snapshot:');
  [...cohortPatterns.values()]
    .sort((a, b) => a.patternId - b.patternId)
    .forEach((entry, index, arr) => {
      printStage4SummaryForPattern(entry, '    ');
      if (index < arr.length - 1) {
        console.log('');
      }
    });
}


function setPatternCohortList(pattern, cohortIds) {
  if (!cohortIds.length) {
    delete pattern.cohorts;
    return;
  }
  pattern.cohorts = [...new Set(cohortIds.map(normaliseCohortId))].sort((a, b) => a.localeCompare(b));
}

function removePatternFromCohort(registry, cohort, patternId) {
  if (!cohort || !Array.isArray(cohort.patterns)) {
    return;
  }
  cohort.patterns = cohort.patterns.filter((entry) => entry !== patternId);
  touchCohort(cohort);
}

function syncCohortAssignments(registry, pattern, desiredCohorts, options = {}) {
  const normalizedDesired = [...new Set(desiredCohorts.map(normaliseCohortId))];
  if (normalizedDesired.length > 1) {
    throw new Error(`Pattern ${pattern.patternId} may only belong to one cohort (requested: ${normalizedDesired.join(', ')}).`);
  }
  const existing = getPatternCohortIds(pattern).map(normaliseCohortId);
  const toRemove = existing.filter((id) => !normalizedDesired.includes(id));
  const toAdd = normalizedDesired.filter((id) => !existing.includes(id));
  toRemove.forEach((cohortId) => {
    const cohort = findCohortById(registry, cohortId);
    if (cohort) {
      removePatternFromCohort(registry, cohort, pattern.patternId);
    }
  });
  toAdd.forEach((cohortId) => {
    const cohort = ensureCohort(registry, cohortId, options.cohortMetadata || {});
    attachPatternToCohort(cohort, pattern.patternId);
  });
  setPatternCohortList(pattern, normalizedDesired);
  touchPattern(pattern);
  return { added: toAdd, removed: toRemove };
}

function assertStage5Access(registry, pattern) {
  const evaluation = evaluateStage5Gate(registry, pattern);
  if (evaluation.stage4Ready && evaluation.stage5AReady) {
    return true;
  }
  const message = evaluation.blockers.length ? evaluation.blockers.join('; ') : 'Stage 5B prerequisites are not satisfied';
  throw new Error(message);
}


const laneStatusMetadata = {
  pending: { glyph: '[ ]', label: 'pending', autoAssignable: true },
  in_progress: { glyph: '[~]', label: 'in-progress', autoAssignable: false },
  blocked: { glyph: '[?]', label: 'blocked', autoAssignable: false },
  complete: { glyph: '[x]', label: 'complete', autoAssignable: false }
};

const laneStatusValues = Object.keys(laneStatusMetadata);
const autoAssignableLaneStatuses = laneStatusValues.filter((key) => laneStatusMetadata[key].autoAssignable);
const noteHeavyStatuses = ['blocked'];
const glyphLegendText = '[ ] pending, [~] in_progress, [?] blocked, [x] complete';

function getStagePlannedFiles(pattern, stageId) {
  return pattern.stageGates?.[stageId]?.plannedFiles || [];
}

function getLanePlannedFiles(pattern, laneId) {
  return pattern.lanes?.[laneId]?.plannedFiles || [];
}

function hasPlanConflict(planFiles, pattern, scopeId) {
  const activeMap = collectActivePlanFileMap(pattern, scopeId);
  const { conflict } = findPlanConflicts(planFiles, activeMap);
  return conflict;
}

function findDependentLanes(pattern, laneId) {
  const dependents = [];
  const targetGate = `lane-${laneId}`;
  Object.entries(pattern.lanes || {}).forEach(([otherId, lane]) => {
    if (otherId === laneId) {
      return;
    }
    const dependencies = lane.dependencies || [];
    if (
      dependencies.some(
        (dep) => dep.patternId === pattern.patternId && dep.gate && dep.gate.toLowerCase() === targetGate
      )
    ) {
      dependents.push(otherId);
    }
  });
  return dependents.sort();
}

function findDependentStages(pattern, laneId) {
  const targetGate = `lane-${laneId}`;
  const stageDependents = new Set();
  Object.entries(pattern.lanes || {}).forEach(([otherId, lane]) => {
    const dependencies = lane.dependencies || [];
    dependencies.forEach((dep) => {
      if (dep.patternId === pattern.patternId && dep.gate && dep.gate.toLowerCase() === targetGate) {
        const stage = laneIdToStage(otherId);
        if (stage) {
          stageDependents.add(stage);
        }
      }
    });
  });
  return [...stageDependents].sort();
}

function getPatternById(registry, patternId) {
  return registry.patterns.find((entry) => entry.patternId === patternId) || null;
}

function stageGateSatisfied(registry, dep) {
  const stageId = dep.gate.slice(6);
  const targetPattern = getPatternById(registry, dep.patternId);
  if (!targetPattern) {
    return false;
  }
  const status = targetPattern.stageGates?.[stageId]?.status;
  return status === 'complete';
}

function laneDependencySatisfied(registry, dep) {
  const laneId = dep.gate.slice(5);
  const targetPattern = getPatternById(registry, dep.patternId);
  if (!targetPattern) {
    return false;
  }
  return targetPattern.lanes?.[laneId]?.status === 'complete';
}

function dependencySatisfied(registry, dep) {
  if (!dep.gate) {
    return false;
  }
  const gate = dep.gate.toLowerCase();
  if (!gate.startsWith('stage-') && !gate.startsWith('lane-')) {
    return false;
  }
  const normalizedDep = { ...dep, gate };
  if (gate.startsWith('stage-')) {
    return stageGateSatisfied(registry, normalizedDep);
  }
  return laneDependencySatisfied(registry, normalizedDep);
}

function laneDependenciesSatisfied(registry, pattern, laneId) {
  const lane = pattern.lanes?.[laneId];
  if (!lane) {
    return false;
  }
  const deps = lane.dependencies || [];
  if (!deps.length) {
    return true;
  }
  return deps.every((dep) => dependencySatisfied(registry, dep));
}

function stageDependenciesSatisfied(registry, pattern, stageId) {
  let baseSatisfied = false;
  switch (stageId) {
    case '1':
      baseSatisfied = true;
      break;
    case '2':
      baseSatisfied = stageCompletionStatuses.has(getPatternStageStatus(pattern, '1'));
      break;
    case '3':
      baseSatisfied = stageCompletionStatuses.has(getPatternStageStatus(pattern, '2'));
      break;
    case '4':
      baseSatisfied = stageCompletionStatuses.has(getPatternStageStatus(pattern, '3'));
      break;
    case '5': {
      if (!stageCompletionStatuses.has(getPatternStageStatus(pattern, '3'))) {
        baseSatisfied = false;
        break;
      }
      const evaluation = evaluateStage5Gate(registry, pattern);
      baseSatisfied = evaluation.stage4Ready && evaluation.stage5AReady;
      break;
    }
    case '6':
      baseSatisfied = stageCompletionStatuses.has(getPatternStageStatus(pattern, '5'));
      break;
    case '7': {
      if (!stageCompletionStatuses.has(getPatternStageStatus(pattern, '5'))) {
        baseSatisfied = false;
        break;
      }
      baseSatisfied = lanesCompleteForStage(pattern, '6');
      break;
    }
    default:
      baseSatisfied = false;
  }

  if (!baseSatisfied) {
    return false;
  }

  const gate = pattern.stageGates?.[stageId];
  const dependencies = gate?.dependencies || [];
  if (!dependencies.length) {
    return true;
  }
  return dependencies.every((dep) => dependencySatisfied(registry, dep));
}


function autoUpdateLaneStatus(registry, pattern, laneId) {
  const lane = pattern.lanes?.[laneId];
  if (!lane || !autoLaneStatuses.has(lane.status || '')) {
    return;
  }
  const previousStatus = lane.status || 'pending';
  let shouldBePending = laneDependenciesSatisfied(registry, pattern, laneId);
  const laneStage = inferStageNumberFromLaneId(laneId);
  if (laneStage === 4 && !stageCompletionStatuses.has(getPatternStageStatus(pattern, '3'))) {
    shouldBePending = false;
  } else if (laneStage === 6) {
    const stage5Status = getPatternStageStatus(pattern, '5');
    if (!stageReadyCompletionStatuses.has(stage5Status)) {
      shouldBePending = false;
    }
  }
  if (shouldBePending) {
    const planBlockers = findPlanFileBlockingLaneIds(pattern, laneId);
    if (planBlockers.length) {
      shouldBePending = false;
    }
  }
  if (shouldBePending) {
    const cohortPlanBlockers = findCohortPlanFileBlockingEntries(registry, pattern, laneId);
    if (cohortPlanBlockers.length) {
      shouldBePending = false;
    }
  }
  const nextStatus = shouldBePending ? 'pending' : 'blocked';
  if (previousStatus === nextStatus) {
    return;
  }
  lane.status = nextStatus;
  lane.updatedAt = nowIso();
  if (lane.status === 'blocked') {
    delete lane.startedAt;
    delete lane.elapsedMs;
  }
  registerScopeChange(pattern.patternId, `lane-${laneId}`);
  touchPattern(pattern);
}

function autoUpdateStageStatus(registry, pattern, stageId) {
  const gate = ensureStageGate(pattern, stageId);
  if (!autoStageStatuses.has(gate.status || '')) {
    return;
  }
  const previousStatus = gate.status || defaultStageStatus(stageId);
  const shouldBePending = stageDependenciesSatisfied(registry, pattern, stageId);
  const nextStatus = shouldBePending ? 'pending' : 'blocked';
  if (previousStatus === nextStatus) {
    return;
  }
  gate.status = nextStatus;
  if (gate.status === 'blocked') {
    delete gate.startedAt;
    delete gate.elapsedMs;
    delete gate.completedAt;
  }
  registerScopeChange(pattern.patternId, `stage-${stageId}`);
  touchPattern(pattern);
}

function autoUpdatePatternStatuses(registry, pattern) {
  Object.keys(pattern.lanes || {}).forEach((laneId) => {
    autoUpdateLaneStatus(registry, pattern, laneId);
  });
  stageOrder.forEach((stageId) => {
    autoUpdateStageStatus(registry, pattern, stageId);
  });
}

function autoUpdateAllPatternStatuses(registry) {
  (registry.patterns || []).forEach((pattern) => {
    autoUpdatePatternStatuses(registry, pattern);
  });
}


const stageStatusMetadata = {
  pending: { glyph: '[ ]', label: 'pending' },
  in_progress: { glyph: '[~]', label: 'in-progress' },
  blocked: { glyph: '[?]', label: 'blocked' },
  ready: { glyph: '[>]', label: 'ready' },
  complete: { glyph: '[x]', label: 'complete' }
};

const assignableStageStatuses = ['pending'];
const assignableLaneStatuses = ['pending'];

function deriveAgentId(patternId, scope) {
  if (scope.lane) {
    // TODO: Replace deterministic agent ids with unique random aliases once the alias pool is available.
    return `${patternId}-${scope.lane}`;
  }
  return `${patternId}-stage${scope.stage}`;
}

function findNextAssignableLane(registry, pattern, stageId) {
  const lanePrefix = `${stageId}`;
  const laneIds = Object.keys(pattern.lanes || {})
    .filter((laneId) => laneId.startsWith(lanePrefix))
    .sort();
  for (const laneId of laneIds) {
    const lane = pattern.lanes?.[laneId];
    if (!lane) {
      continue;
    }
    if (!autoAssignableLaneStatuses.includes(lane.status)) {
      continue;
    }
    if (!laneDependenciesSatisfied(registry, pattern, laneId)) {
      continue;
    }
    const planFiles = getLanePlannedFiles(pattern, laneId);
    const scopeId = `lane-${laneId}`;
    if (planFiles.length && hasPlanConflict(planFiles, pattern, scopeId)) {
      continue;
    }
    if (planFiles.length) {
      const globalConflict = hasRegistryPlanConflict(registry, planFiles, pattern.patternId, scopeId);
      if (globalConflict.conflict) {
        continue;
      }
    }
    return laneId;
  }
  return null;
}

function findNextWorkTarget(registry, pattern, fromStageId) {
  const startIndex = stageOrder.indexOf(String(fromStageId));
  if (startIndex === -1) {
    return null;
  }
  for (let i = startIndex + 1; i < stageOrder.length; i += 1) {
    const stageId = stageOrder[i];
    const gateStatus = pattern.stageGates?.[stageId]?.status || defaultStageStatus(stageId);
    if (!assignableStageStatuses.includes(gateStatus)) {
      continue;
    }
    if (stageId === '4' || stageId === '6') {
      const nextLane = findNextAssignableLane(registry, pattern, stageId);
      if (nextLane) {
        return { type: 'lane', stageId, laneId: nextLane };
      }
      continue;
    }
    const planFiles = getStagePlannedFiles(pattern, stageId);
    const scopeId = `stage-${stageId}`;
    if (stageId === '5') {
      const gate = evaluateStage5Gate(registry, pattern);
      if (!gate.stage4Ready || !gate.stage5AReady) {
        continue;
      }
    }
    if (planFiles.length && hasPlanConflict(planFiles, pattern, scopeId)) {
      continue;
    }
    if (planFiles.length) {
      const globalConflict = hasRegistryPlanConflict(registry, planFiles, pattern.patternId, scopeId);
      if (globalConflict.conflict) {
        continue;
      }
    }
    return { type: 'stage', stageId };
  }
  return null;
}

function printNextWorkHint(patternId, hint) {
  if (!hint) {
    return;
  }
  console.log('');
  if (hint.type === 'stage') {
    const stageLabel = displayStageLabel(hint.stageId);
    console.log(`Next-work hint: ${stageLabel} is now assignable.`);
    console.log('Confirm with your coordinator, then:');
    console.log(`  npm run consolidate -- guide ${patternId} --stage ${hint.stageId}`);
    console.log(`  npm run consolidate -- claim ${patternId} --stage ${hint.stageId}`);
  } else if (hint.type === 'lane') {
    const stageLabel = displayStageLabel(laneIdToStage(hint.laneId));
    console.log(`Next-work hint: Lane ${hint.laneId} (${stageLabel}) is now assignable.`);
    console.log('Confirm with your coordinator, then:');
    console.log(`  npm run consolidate -- guide ${patternId} --lane ${hint.laneId}`);
    console.log(`  npm run consolidate -- claim ${patternId} --lane ${hint.laneId}`);
  }
  console.log('If you are told to pause, commit any touched files with an appropriate message.');
}

function appendStageClaimNote(pattern, stageId, body, author) {
  if (!body) {
    return;
  }
  const notes = pattern.notes || (pattern.notes = []);
  const timestamp = nowIso();
  const entry = {
    id: `stage-${stageId}-claim-${timestamp.replace(/[^0-9T]/g, '')}`,
    timestamp,
    body,
    scope: [`stage-${stageId}`]
  };
  if (author) {
    entry.author = author;
  }
  notes.push(entry);
}

function normaliseStageId(value) {
  if (value === undefined || value === null) {
    throw new Error('Invalid stage id: value missing');
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    throw new Error('Invalid stage id: value missing');
  }
  const lower = trimmed.toLowerCase();
  const normalized = lower === '5b' ? '5' : lower;
  if (!stageOrder.includes(normalized)) {
    throw new Error(`Invalid stage id: ${value}`);
  }
  return normalized;
}

function defaultStageStatus(stageId) {
  return stageId === '1' ? 'pending' : 'blocked';
}

function ensureStageGate(pattern, stageId) {
  const stageGates = pattern.stageGates || (pattern.stageGates = {});
  let gate = stageGates[stageId];
  if (!gate) {
    gate = {
      status: defaultStageStatus(stageId)
    };
    stageGates[stageId] = gate;
  }
  return gate;
}

function setStageGate(pattern, stageId, status, options = {}) {
  const gate = ensureStageGate(pattern, stageId);
  const defaultStatus = defaultStageStatus(stageId);
  const previousStatus = gate.status || defaultStatus;
  const statusProvided = options.statusProvided === false ? false : true;
  const nextStatus = statusProvided ? status : previousStatus;

  if (statusProvided) {
    gate.status = nextStatus;
  }

  if (Object.prototype.hasOwnProperty.call(options, 'notes')) {
    if (!options.notes) {
      delete gate.notes;
    } else {
      gate.notes = options.notes;
    }
  }
  if (options.planFiles || options.clearPlanFiles) {
    applyPlanFiles(gate, options.planFiles, options.clearPlanFiles);
  }

  let durationMs = null;
  const nowTimestamp = nowIso();
  const completionTimestamp = Object.prototype.hasOwnProperty.call(options, 'completedAt')
    ? options.completedAt
    : nowTimestamp;

  if (statusProvided) {
    if (nextStatus === 'in_progress') {
      if (options.startedAt) {
        gate.startedAt = options.startedAt;
      } else if (!gate.startedAt || previousStatus !== 'in_progress') {
        gate.startedAt = nowTimestamp;
      }
      if (Object.prototype.hasOwnProperty.call(options, 'completedAt')) {
        if (!options.completedAt) {
          delete gate.completedAt;
        } else {
          gate.completedAt = options.completedAt;
        }
      }
    } else {
      if (previousStatus === 'in_progress' && gate.startedAt) {
        durationMs = computeDurationMs(gate.startedAt, completionTimestamp);
        if (durationMs) {
          gate.elapsedMs = durationMs;
        } else {
          delete gate.elapsedMs;
        }
      }
      if (nextStatus === 'complete') {
        gate.completedAt = completionTimestamp;
      } else if (Object.prototype.hasOwnProperty.call(options, 'completedAt')) {
        if (!options.completedAt) {
          delete gate.completedAt;
        } else {
          gate.completedAt = options.completedAt;
        }
      } else {
        delete gate.completedAt;
      }
      if (nextStatus !== 'in_progress' && previousStatus !== 'in_progress' && options.startedAt && !gate.startedAt) {
        gate.startedAt = options.startedAt;
      }
      if (nextStatus === 'pending' || nextStatus === 'blocked') {
        delete gate.startedAt;
        delete gate.elapsedMs;
        delete gate.completedAt;
      }
    }
  } else if (options.completedAtProvided) {
    if (!options.completedAt) {
      delete gate.completedAt;
    } else {
      gate.completedAt = options.completedAt;
    }
  }

  registerScopeChange(pattern.patternId, `stage-${stageId}`);
  return { gate, previousStatus, durationMs, statusChanged: statusProvided && nextStatus !== previousStatus };
}

function recomputePatternStagePointer(pattern) {
  const nextStage = inferredStage(pattern);
  pattern.stage = Number.parseInt(nextStage, 10);
}

function inferredStage(pattern) {
  for (const stage of stageOrder) {
    const gate = pattern.stageGates?.[stage];
    if (!gate || gate.status !== 'complete') {
      return stage;
    }
  }
  return '7';
}

function collectLaneCommands(lane) {
  const commands = lane.commands || [];
  return commands.map((cmd) => ({
    command: cmd.command,
    status: cmd.status || 'pending',
    summary: cmd.summary,
    executedAt: cmd.executedAt,
    logPath: cmd.logPath
  }));
}

function laneIdToStage(laneId) {
  const match = /^([0-9]+)/.exec(laneId);
  return match ? match[1] : null;
}

function inferStageNumberFromLaneId(laneId) {
  const stage = laneIdToStage(laneId);
  if (!stage) {
    return null;
  }
  const numeric = Number.parseInt(stage, 10);
  return Number.isNaN(numeric) ? null : numeric;
}

function glyphForLaneStatus(status) {
  return laneStatusMetadata[status]?.glyph || '[ ]';
}

function describeLaneStatus(status) {
  return laneStatusMetadata[status]?.label || status;
}

function printLaneDetail(pattern, laneId, lane) {
  console.log('');
  const glyph = glyphForLaneStatus(lane.status);
  console.log(`Lane ${laneId}: ${glyph}`);
  console.log(`Scope: ${lane.scope}`);
  if (lane.startedAt) {
    console.log(`Started at: ${lane.startedAt}`);
  }
  if (lane.elapsedMs) {
    const humanDuration = formatDuration(lane.elapsedMs);
    if (humanDuration) {
      console.log(`Elapsed: ${humanDuration}`);
    }
  } else if (lane.status === 'in_progress' && lane.startedAt) {
    const runningMs = computeDurationMs(lane.startedAt, nowIso());
    if (runningMs) {
      const humanDuration = formatDuration(runningMs);
      if (humanDuration) {
        console.log(`Elapsed (current): ${humanDuration}`);
      }
    }
  }

  if (lane.plannedFiles?.length) {
    console.log('Planned files:');
    lane.plannedFiles.forEach((file) => console.log(` - ${file}`));
  } else {
    console.log('Planned files: (not recorded) — update via `claim`/`update-lane --plan-files` to unlock scheduling cues.');
  }
  if (lane.searchTerms?.length) {
    console.log('Search terms:');
    lane.searchTerms.forEach((term) => console.log(` - ${term}`));
  }
  const commands = collectLaneCommands(lane);
  if (commands.length) {
    console.log('Required commands:');
    commands.forEach((cmd) => {
      const status = cmd.status ? ` [${cmd.status}]` : '';
      const executedAt = cmd.executedAt ? ` @ ${cmd.executedAt}` : '';
      const suffix = cmd.summary ? ` — ${cmd.summary}` : '';
      console.log(` - ${cmd.command}${status}${executedAt}${suffix}`);
      if (cmd.logPath) {
        console.log(`   log: ${cmd.logPath}`);
      }
    });
  } else {
    console.log('Required commands: (none recorded)');
  }
  const laneStage = laneIdToStage(laneId);
  const scopedNotes = collectAllNotesForLane(pattern, laneId);
  if (scopedNotes.length) {
    console.log('Notes:');
    scopedNotes.forEach((note) => {
      const author = note.author ? ` — ${note.author}` : '';
      console.log(` - ${note.timestamp}${author}: ${note.body}`);
    });
  }
}

function filterNotes(pattern, scopes) {
  const notes = pattern.notes || [];
  if (!scopes || scopes.length === 0) {
    return notes;
  }
  return notes.filter((note) => {
    const noteScope = note.scope || [];
    return noteScope.some((entry) => scopes.includes(entry));
  });
}

function getStageTitle(stageId) {
  const stageMeta = stageGuidance[stageId];
  return stageMeta?.title ? stageMeta.title : displayStageLabel(stageId);
}

function getStageNotesSorted(pattern, stageId) {
  const scopedNotes = filterNotes(pattern, [`stage-${stageId}`]);
  return [...scopedNotes].sort((a, b) => {
    const aTime = Date.parse(a.timestamp);
    const bTime = Date.parse(b.timestamp);
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
      return 0;
    }
    if (Number.isNaN(aTime)) {
      return -1;
    }
    if (Number.isNaN(bTime)) {
      return 1;
    }
    return aTime - bTime;
  });
}

function printImmediateUpstreamSummary(pattern, targetStage) {
  const stageId = String(targetStage).toLowerCase() === '5a' ? '5' : String(targetStage);
  const stageIdx = stageOrder.indexOf(stageId);
  if (stageIdx <= 0) {
    return false;
  }

  const prevStageId = stageOrder[stageIdx - 1];
  const prevGate = pattern.stageGates?.[prevStageId];
  const stageNotes = getStageNotesSorted(pattern, prevStageId);
  const latestNote = stageNotes.length ? stageNotes[stageNotes.length - 1] : null;

  const hasGateNotes = Boolean(prevGate?.notes);
  const hasStageNotes = Boolean(latestNote);
  if (!hasGateNotes && !hasStageNotes) {
    return false;
  }

  console.log('');
  const prevStageLabel = displayStageLabel(prevStageId);
  console.log(
    `Upstream summary — ${prevStageLabel}${stageGuidance[prevStageId]?.title ? ` (${getStageTitle(prevStageId)})` : ''}`
  );
  if (prevGate?.status) {
    const glyph = stageStatusMetadata[prevGate.status]?.glyph || '[ ]';
    const elapsed = prevGate.elapsedMs ? formatDuration(prevGate.elapsedMs) : null;
    const elapsedText = elapsed ? `, elapsed ${elapsed}` : '';
    console.log(` Status: ${glyph}${elapsedText}`);
  }
  if (prevGate?.notes) {
    console.log(` Exit notes: ${prevGate.notes}`);
  }
  if (latestNote) {
    const author = latestNote.author ? ` — ${latestNote.author}` : '';
    console.log(` Latest note (${latestNote.timestamp}${author}): ${latestNote.body}`);
    const remaining = stageNotes.length - 1;
    if (remaining > 0) {
      console.log(
        ` (${remaining} additional note${remaining === 1 ? '' : 's'} recorded for ${displayStageLabel(prevStageId)})`
      );
    }
  }
  let printedHandoff = false;
  if (prevStageId === '5' && pattern.handoff) {
    printHandoffSummary(pattern, ' Handoff guardrails:');
    printedHandoff = true;
  }
  return printedHandoff;
}

function collectAllNotesForLane(pattern, laneId) {
  const laneStage = laneIdToStage(laneId);
  const directNotes = filterNotes(pattern, [laneId]);
  const stageNotes = laneStage ? filterNotes(pattern, [`stage-${laneStage}`]) : [];
  const combined = [...directNotes];
  stageNotes.forEach((note) => {
    if (!combined.includes(note)) {
      combined.push(note);
    }
  });
  return combined.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

function printLaneNotes(pattern, laneId, indent = '    ') {
  const notes = collectAllNotesForLane(pattern, laneId);
  if (!notes.length) {
    return;
  }
  notes.forEach((note) => {
    const author = note.author ? ` — ${note.author}` : '';
    console.log(`${indent}• ${note.timestamp}${author}: ${note.body}`);
  });
}

function printGuide(registry, pattern, options = {}) {
  console.log(`Guide for Pattern ${pattern.patternId} — ${pattern.name}`);
  if (pattern.description) {
    console.log(`Summary: ${pattern.description}`);
  }
  printPatternCohorts(registry, pattern);
  console.log(`Legend: ${glyphLegendText}`);

  const pointerStage = inferredStage(pattern);
  const stageGate = pattern.stageGates?.[pointerStage];
  let stageOverride = options.stage;
  if (!stageOverride && stageGate?.status === 'in_progress') {
    stageOverride = pointerStage;
  }
  let laneSelection = options.lane ? options.lane.toLowerCase() : null;
  let laneStage = laneSelection ? laneIdToStage(laneSelection) : null;
  const pointerIndex = stageOrder.indexOf(pointerStage);
  let targetStage = stageOverride || laneStage || pointerStage;

  if (options.focusNext && pointerIndex >= 0) {
    if (!stageOverride && !laneSelection) {
      const pointerStatus = stageGate?.status || defaultStageStatus(pointerStage);
      let candidateStage = pointerStage;
      if (pointerStatus === 'complete') {
        const nextStage = stageOrder.slice(pointerIndex + 1).find((stage) => {
          const gate = pattern.stageGates?.[stage];
          if (gate && gate.status === 'complete') {
            return false;
          }
          if (stage === '6') {
            return Object.keys(pattern.lanes || {}).some((key) => key.startsWith('6'));
          }
          return true;
        });
        if (nextStage) {
          candidateStage = nextStage;
        }
      }
      targetStage = candidateStage;
    } else if (stageOverride) {
      targetStage = stageOverride;
    }
  }

  if (!laneSelection && (targetStage === '4' || targetStage === '6') && options.focusNext) {
    const nextLaneId = findNextAssignableLane(registry, pattern, targetStage);
    if (nextLaneId) {
      laneSelection = nextLaneId.toLowerCase();
      laneStage = targetStage;
    }
  }

  if (!laneSelection && !stageOverride && targetStage === '6') {
    const autoLane = findNextAssignableLane(registry, pattern, '6');
    if (autoLane) {
      laneSelection = autoLane.toLowerCase();
      laneStage = '6';
    }
  }

  if (laneSelection) {
    laneStage = laneIdToStage(laneSelection);
  }

  targetStage = stageOverride || laneStage || targetStage;

  const stage5Evaluation = evaluateStage5Gate(registry, pattern);
  const stage5Locked = Boolean(stage5Evaluation && (!stage5Evaluation.stage4Ready || !stage5Evaluation.stage5AReady));
  const stage5aContext = collectStage5aContext(registry, pattern);

  if (!laneSelection && !stageOverride && targetStage === '5' && stage5Locked) {
    targetStage = '5a';
  }
  if (stageOverride === '5a') {
    targetStage = '5a';
  }

  const stageInfo = stageGuidance[targetStage];
  const pointerInfo = stageGuidance[pointerStage];
  const isStage5Path = targetStage === '5' || targetStage === '5a';
  const focusedGateKey = targetStage === '5a' ? '5' : targetStage;
  const focusedGate = targetStage === '5a' ? pattern.stageGates?.['5'] : pattern.stageGates?.[targetStage];
  let handoffPrinted = false;

  console.log('');
  const pointerGlyph = stageStatusMetadata[stageGate?.status || defaultStageStatus(pointerStage)]?.glyph || '[ ]';
  const targetStatusForGlyph =
    targetStage === '5a' ? stage5aContext.aggregateStatus : focusedGate?.status || defaultStageStatus(targetStage);
  const targetGlyph = stageStatusMetadata[targetStatusForGlyph]?.glyph || '[ ]';
  const pointerStageDisplay = displayStageId(pointerStage);
  const targetStageDisplay = displayStageId(targetStage);
  if (!stageOverride && !laneSelection) {
    console.log(`Current stage: ${targetGlyph} ${targetStageDisplay}${stageInfo ? ` (${stageInfo.title})` : ''}`);
  } else {
    console.log(`Stage pointer: ${pointerGlyph} ${pointerStageDisplay}${pointerInfo ? ` (${pointerInfo.title})` : ''}`);
    console.log(`Focused stage: ${targetGlyph} ${targetStageDisplay}${stageInfo ? ` (${stageInfo.title})` : ''}`);
  }

  if (targetStage !== '5a' && focusedGate) {
    if (focusedGate.completedAt) {
      console.log(`Completed at: ${focusedGate.completedAt}`);
    }
    if (focusedGate.startedAt) {
      console.log(`Started at: ${focusedGate.startedAt}`);
    }
    if (focusedGate.elapsedMs) {
      const formatted = formatDuration(focusedGate.elapsedMs);
      if (formatted) {
        console.log(`Elapsed: ${formatted}`);
      }
    }
    if (focusedGate.plannedFiles?.length) {
      console.log('Planned files:');
      focusedGate.plannedFiles.forEach((file) => console.log(` - ${file}`));
      const stageConflicts = hasRegistryPlanConflict(
        registry,
        focusedGate.plannedFiles,
        pattern.patternId,
        `stage-${focusedGateKey}`
      );
      if (stageConflicts.conflict) {
        console.log(`Conflict warning: ${stageConflicts.conflicts.join(', ')}`);
      }
    } else if (focusedGate.status === 'in_progress') {
      console.log('Planned files: (not recorded) — add via `update-stage --plan-files` to improve scheduling.');
    }
    if (focusedGate.searchTerms?.length) {
      console.log('Search terms:');
      focusedGate.searchTerms.forEach((term) => console.log(` - ${term}`));
    }
    if (focusedGate.notes) {
      console.log(`Notes: ${focusedGate.notes}`);
    }
  }

  const upstreamHandoffPrinted = printImmediateUpstreamSummary(pattern, targetStage);
  if (upstreamHandoffPrinted) {
    handoffPrinted = true;
  }

  if (stageInfo?.reminders?.length) {
    console.log('');
    console.log('Stage reminders:');
    stageInfo.reminders.forEach((item) => console.log(` - ${item}`));
  }

  const suggestedLaneId =
    laneSelection || (targetStage === '4' || targetStage === '6' ? findNextAssignableLane(registry, pattern, targetStage) : null);
  const stageActionsFactory = stageActionGuidance[targetStage];
  const stageActions =
    typeof stageActionsFactory === 'function'
      ? stageActionsFactory(pattern, { laneId: laneSelection, suggestedLaneId, stage5a: stage5aContext })
      : [];

  if (stageActions.length) {
    console.log('');
    console.log('Stage actions:');
    if (targetStage === '5' && stage5Locked) {
      console.log(
        ' - Stage 5B guidance unlocks once cohort Stage 4 readiness and Stage 5A alignment are marked `complete`. Use `cohort --all` to confirm the active id, then `cohort --id <cohortId> --list` and `cohort-stage <cohortId> --segment 5a --show` to coordinate readiness.'
      );
    } else {
      stageActions.forEach((item) => console.log(` ${item}`));
    }
  }

  if (((targetStage === '5' && !stage5Locked) || targetStage === '6') && pattern.handoff && !handoffPrinted) {
    printHandoffSummary(pattern);
    handoffPrinted = true;
  }

  const stageStatus =
    targetStage === '5a' ? stage5aContext.aggregateStatus : focusedGate?.status || defaultStageStatus(targetStage);
  let stageHasActionableWork = false;

  if (targetStage === '6') {
    if (laneSelection) {
      const lane = pattern.lanes?.[laneSelection];
      if (!lane) {
        throw new Error(`Lane ${laneSelection} not found for pattern ${pattern.patternId}.`);
      }
      if (lane.status === 'in_progress' || autoAssignableLaneStatuses.includes(lane.status)) {
        stageHasActionableWork = true;
      }
      printLaneDetail(pattern, laneSelection, lane);
      if (!stageHasActionableWork) {
        stageHasActionableWork = Object.keys(pattern.lanes || {}).some((key) => {
          if (!key.startsWith('6')) {
            return false;
          }
          const candidate = pattern.lanes[key];
          return candidate && autoAssignableLaneStatuses.includes(candidate.status);
        });
      }
    } else if (options.showLanes) {
      const laneKeys = Object.keys(pattern.lanes || {}).filter((key) => key.startsWith('6')).sort();
      if (!laneKeys.length) {
        console.log('');
        console.log('No Stage 6 lanes defined.');
      } else {
        console.log('');
        if (!handoffPrinted) {
          printHandoffSummary(pattern, 'Handoff summary:');
          handoffPrinted = true;
          console.log('');
        }
        console.log('Stage 6 lane status:');
        laneKeys.forEach((key) => {
          const lane = pattern.lanes[key];
          if (!lane) {
            return;
          }
          console.log(` - ${formatLaneStatus(key, lane)}`);
          if (noteHeavyStatuses.includes(lane.status)) {
            printLaneNotes(pattern, key, '   ');
          }
        });
        stageHasActionableWork = laneKeys.some((key) => {
          const lane = pattern.lanes[key];
          return lane && autoAssignableLaneStatuses.includes(lane.status);
        });
      }
    } else {
      const nextLaneId = findNextAssignableLane(registry, pattern, '6');
      if (nextLaneId) {
        const lane = pattern.lanes?.[nextLaneId];
        if (lane) {
          stageHasActionableWork = true;
          printLaneDetail(pattern, nextLaneId, lane);
        }
      } else {
        const laneKeys = Object.keys(pattern.lanes || {}).filter((key) => key.startsWith('6')).sort();
        const hasIncomplete = laneKeys.some((key) => {
          const status = pattern.lanes[key]?.status;
          return status && status !== 'complete';
        });
        if (hasIncomplete) {
          console.log('');
          console.log('No Stage 6 lanes are currently auto-assignable. Lane status overview:');
          laneKeys.forEach((key) => {
            const lane = pattern.lanes[key];
            if (!lane) {
              return;
            }
            console.log(` - ${formatLaneStatus(key, lane)}`);
            if (noteHeavyStatuses.includes(lane.status)) {
              printLaneNotes(pattern, key, '   ');
            }
          });
          console.log('');
          console.log('All Stage 6 lanes are blocked or queued. Coordinate with the current owner via `npm run consolidate -- append-activity <patternId> --lane <laneId> --summary "Blocker"` or resolve the blockers before claiming another lane.');
        } else {
          console.log('');
          console.log('All Stage 6 lanes are complete.');
        }
      }
    }
  } else if (targetStage === '5a') {
    stageHasActionableWork = stage5aContext.actionable;
    printStage5aDetail(registry, pattern, stage5aContext);
  } else if (targetStage === '5') {
    if (stage5Locked) {
      stageHasActionableWork = stage5aContext.actionable;
      printStage5aDetail(registry, pattern, stage5aContext);
    }
    const lanePrefix = '6';
    const laneKeys = Object.keys(pattern.lanes || {}).filter((key) => key.startsWith(lanePrefix)).sort();
    if (laneSelection) {
      const lane = pattern.lanes?.[laneSelection];
      if (!lane) {
        throw new Error(`Lane ${laneSelection} not found for pattern ${pattern.patternId}.`);
      }
      if (lane.status === 'in_progress' || autoAssignableLaneStatuses.includes(lane.status)) {
        stageHasActionableWork = true;
      }
      printLaneDetail(pattern, laneSelection, lane);
      if (!stageHasActionableWork) {
        stageHasActionableWork = laneKeys.some((key) => {
          const candidate = pattern.lanes[key];
          return candidate && autoAssignableLaneStatuses.includes(candidate.status);
        });
      }
    } else {
      if (laneKeys.length) {
        console.log('');
        console.log('Lane status:');
        laneKeys.forEach((key) => {
          const lane = pattern.lanes[key];
          if (!lane) {
            return;
          }
          console.log(` - ${formatLaneStatus(key, lane)}`);
          if (noteHeavyStatuses.includes(lane.status)) {
            printLaneNotes(pattern, key, '   ');
          }
        });
        stageHasActionableWork = laneKeys.some((key) => {
          const lane = pattern.lanes[key];
          return lane && autoAssignableLaneStatuses.includes(lane.status);
        });
        if (!stageHasActionableWork) {
          console.log('');
          console.log('No lanes are currently assignable. Coordinate with the stage owner or review blockers before reopening work.');
        }
      }
      const scopedNotes = filterNotes(pattern, [`stage-${targetStage}`]);
      if (scopedNotes.length) {
        console.log('Notes:');
        scopedNotes.forEach((note) => {
          const author = note.author ? ` — ${note.author}` : '';
          console.log(` - ${note.timestamp}${author}: ${note.body}`);
        });
      }
    }
    if (!stageHasActionableWork && stage5Locked) {
      stageHasActionableWork = stage5aContext.actionable;
    }
    if (!stageHasActionableWork) {
      const actionableStatuses = new Set(['pending', 'in_progress']);
      if (actionableStatuses.has(stageStatus)) {
        stageHasActionableWork = true;
      }
    }
  } else if (targetStage === '4') {
    const lanePrefix = '4';
    const laneKeys = Object.keys(pattern.lanes || {}).filter((key) => key.startsWith(lanePrefix)).sort();
    if (laneSelection) {
      const lane = pattern.lanes?.[laneSelection];
      if (!lane) {
        throw new Error(`Lane ${laneSelection} not found for pattern ${pattern.patternId}.`);
      }
      if (lane.status === 'in_progress' || autoAssignableLaneStatuses.includes(lane.status)) {
        stageHasActionableWork = true;
      }
      printLaneDetail(pattern, laneSelection, lane);
      if (!stageHasActionableWork) {
        stageHasActionableWork = laneKeys.some((key) => {
          const candidate = pattern.lanes[key];
          return candidate && autoAssignableLaneStatuses.includes(candidate.status);
        });
      }
    } else {
      if (laneKeys.length) {
        console.log('');
        console.log('Lane status:');
        laneKeys.forEach((key) => {
          const lane = pattern.lanes[key];
          if (!lane) {
            return;
          }
          console.log(` - ${formatLaneStatus(key, lane)}`);
          if (noteHeavyStatuses.includes(lane.status)) {
            printLaneNotes(pattern, key, '   ');
          }
        });
        stageHasActionableWork = laneKeys.some((key) => {
          const lane = pattern.lanes[key];
          return lane && autoAssignableLaneStatuses.includes(lane.status);
        });
        if (!stageHasActionableWork) {
          console.log('');
          console.log('No lanes are currently assignable. Coordinate with the stage owner or review blockers before reopening work.');
        }
      }
      const scopedNotes = filterNotes(pattern, [`stage-${targetStage}`]);
      if (scopedNotes.length) {
        console.log('Notes:');
        scopedNotes.forEach((note) => {
          const author = note.author ? ` — ${note.author}` : '';
          console.log(` - ${note.timestamp}${author}: ${note.body}`);
        });
      }
    }
  } else {
    const scopedNotes = filterNotes(pattern, [`stage-${targetStage}`]);
    if (scopedNotes.length) {
      console.log('');
      console.log('Notes:');
      scopedNotes.forEach((note) => {
        const author = note.author ? ` — ${note.author}` : '';
        console.log(` - ${note.timestamp}${author}: ${note.body}`);
      });
    }
    const actionableStatuses = new Set(['pending', 'in_progress']);
    stageHasActionableWork = actionableStatuses.has(stageStatus);
  }

  if (options.showRecent && pattern.activity?.length) {
    console.log('');
    console.log('Recent activity:');
    const recent = [...pattern.activity]
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, 3);
    recent.forEach((entry) => {
      const stageLabel = entry.stage.startsWith('lane-') ? entry.stage.replace('lane-', 'Lane ') : entry.stage;
      const agent = entry.agent ? ` — ${entry.agent}` : '';
      console.log(` - ${entry.timestamp} (${stageLabel})${agent}: ${entry.summary}`);
    });
  }

  const closedStatuses = new Set(['complete', 'ready']);
  if (!stageHasActionableWork && !closedStatuses.has(stageStatus)) {
    console.log('');
    console.log('No actionable work is currently available for this stage. Coordinate with the current owner, resolve blockers, or review notes before attempting another claim.');
  }
}

function parseCommaList(value) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parsePatternIdList(value) {
  if (!value) {
    return [];
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => Number.parseInt(entry, 10)).filter((num) => !Number.isNaN(num));
      }
    } catch (_) {
      // fall through to comma parsing
    }
  }
  return trimmed
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((num) => !Number.isNaN(num));
}

function parsePatternIdInputs(values, contextLabel = 'cohort') {
  if (!values || !values.length) {
    return [];
  }
  const collected = new Set();
  values.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    trimmed
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => {
        const parsed = Number.parseInt(entry, 10);
        if (Number.isNaN(parsed) || parsed < 1) {
          throw new Error(`${contextLabel}: invalid pattern id "${entry}"`);
        }
        collected.add(parsed);
      });
  });
  return [...collected].sort((a, b) => a - b);
}

function parseDependencyDescriptor(value, context = 'create-lane') {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${context}: dependency entries cannot be blank`);
  }
  const parts = trimmed.split(':');
  if (parts.length !== 2) {
    throw new Error(`${context}: dependency entries must use patternId:gate format (received "${value}")`);
  }
  const patternToken = parts[0].trim();
  const gateToken = parts[1].trim().toLowerCase();
  const patternId = Number.parseInt(patternToken, 10);
  if (Number.isNaN(patternId) || patternId < 1) {
    throw new Error(`${context}: invalid dependency pattern id "${patternToken}"`);
  }
  if (!/^stage-[1-7]$/.test(gateToken) && !/^lane-[46][a-z]$/.test(gateToken)) {
    throw new Error(
      `${context}: dependency gate must be stage-<1-7> or lane-<4/6><id>; received "${parts[1].trim()}"`
    );
  }
  return { patternId, gate: gateToken };
}

function dependencyKey(dep) {
  return `${dep.patternId}:${dep.gate}`;
}

function dedupeDependencyList(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  const seen = new Set();
  const deduped = [];
  list.forEach((dep) => {
    if (!dep || typeof dep.patternId !== 'number' || !dep.gate) {
      return;
    }
    const key = dependencyKey(dep);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    deduped.push({ patternId: dep.patternId, gate: dep.gate });
  });
  return deduped;
}

function formatDependencyReference(dep) {
  return `${dep.patternId}:${dep.gate}`;
}

function applyDependencyMutations(target, mutations = {}) {
  const addList = dedupeDependencyList(mutations.addDependencies || []);
  const removeList = dedupeDependencyList(mutations.removeDependencies || []);
  const clear = Boolean(mutations.clearDependencies);
  let current = Array.isArray(target.dependencies) ? [...target.dependencies] : [];
  const result = { changed: false, added: [], removed: [], current };

  if (clear && current.length) {
    result.removed.push(...current.map((dep) => ({ ...dep })));
    current = [];
    result.changed = true;
  }

  if (removeList.length) {
    const removeKeys = new Set(removeList.map(dependencyKey));
    const retained = [];
    current.forEach((dep) => {
      const key = dependencyKey(dep);
      if (removeKeys.has(key)) {
        result.removed.push(dep);
        result.changed = true;
      } else {
        retained.push(dep);
      }
    });
    current = retained;
  }

  if (addList.length) {
    const existingKeys = new Set(current.map(dependencyKey));
    addList.forEach((dep) => {
      const key = dependencyKey(dep);
      if (!existingKeys.has(key)) {
        current.push(dep);
        existingKeys.add(key);
        result.added.push(dep);
        result.changed = true;
      }
    });
  }

  current = dedupeDependencyList(current);
  if (current.length) {
    target.dependencies = current;
  } else {
    delete target.dependencies;
  }
  result.current = current;
  return result;
}


function printHandoffSummary(pattern, heading = '\nHandoff summary:') {
  const guardrails = pattern.handoff?.guardrails || [];
  const sharedFiles = pattern.handoff?.sharedFiles || [];
  const acknowledgements = pattern.handoff?.acknowledgements || [];
  if (!guardrails.length && !sharedFiles.length && !acknowledgements.length) {
    return;
  }
  console.log(heading);
  if (guardrails.length) {
    console.log(' Guardrails:');
    guardrails.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry}`);
    });
  }
  if (sharedFiles.length) {
    console.log(' Shared files:');
    sharedFiles.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry}`);
    });
  }
  if (acknowledgements.length) {
    console.log(' Acknowledgements:');
    acknowledgements.forEach((entry, index) => {
      const noteSuffix = entry.note ? ` — ${entry.note}` : '';
      console.log(`  ${index + 1}. ${entry.agent} @ ${entry.timestamp}${noteSuffix}`);
    });
  }
}

async function promptPropagationTargets(pattern, laneId, options) {
  const dependents = findDependentLanes(pattern, laneId);
  const dependentStages = findDependentStages(pattern, laneId);
  if (!options.skipPrompt) {
    const depStageMessage = dependentStages.length
      ? `Stage alignment impacted: ${dependentStages.map((stage) => displayStageLabel(stage)).join(', ')}`
      : null;
    if (depStageMessage) {
      console.log(depStageMessage);
    }
    if (dependents.length) {
      console.log(`Dependent lanes: ${dependents.join(', ')}`);
    }
  }

  const defaultBlocked = options.status === 'blocked' ? dependents : [];
  const defaultQueued = options.status !== 'blocked' ? dependents : [];

  if (options.skipPrompt) {
    if (options.block.length === 0 && defaultBlocked.length) {
      options.block.push(...defaultBlocked);
    }
    if (options.queue.length === 0 && defaultQueued.length) {
      options.queue.push(...defaultQueued);
    }
    return options;
  }
  if (options.block.length || options.queue.length) {
    return options;
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return options;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const blockDefault = defaultBlocked.join(', ');
    const blockPrompt = blockDefault
      ? `Lanes to mark blocked (comma separated, default ${blockDefault || 'none'}): `
      : 'Lanes to mark blocked (comma separated, blank for none): ';
    const blockAnswer = (await rl.question(blockPrompt)).trim();
    const blockValue = blockAnswer || blockDefault;
    if (blockValue) {
      options.block = parseCommaList(blockValue.toLowerCase());
    }

    const queueDefault = defaultQueued.filter((laneId) => !options.block.includes(laneId)).join(', ');
    const queuePrompt = queueDefault
      ? `Lanes to mark pending (comma separated, default ${queueDefault || 'none'}): `
      : 'Lanes to mark pending (comma separated, blank for none): ';
    const queueAnswer = (await rl.question(queuePrompt)).trim();
    const queueValue = queueAnswer || queueDefault;
    if (queueValue) {
      options.queue = parseCommaList(queueValue.toLowerCase());
    }
  } finally {
    rl.close();
  }
  if (options.block.length) {
    options.block = [...new Set(options.block)];
  }
  if (options.queue.length) {
    options.queue = [...new Set(options.queue)];
  }
  return options;
}

function propagateLaneStatuses(pattern, originLaneId, options) {
  const updated = { blocked: [], pending: [] };
  const touchedStages = new Set();
  const reasonLine = options.note || options.summary || '';
  const noteSuffix = reasonLine ? ` — ${reasonLine.split('\n')[0]}` : '';

  const markLane = (laneId, status, prefix) => {
    if (laneId === originLaneId) {
      return;
    }
    const lane = pattern.lanes?.[laneId];
    if (!lane) {
      return;
    }
    lane.status = status;
    lane.updatedAt = nowIso();
    lane.notes = lane.notes ? `${lane.notes}\n${prefix}${originLaneId}${noteSuffix}` : `${prefix}${originLaneId}${noteSuffix}`;
    touchedStages.add(laneIdToStage(laneId));
    registerScopeChange(pattern.patternId, `lane-${laneId}`);
    if (status === 'blocked') {
      updated.blocked.push(laneId);
    } else if (status === 'pending') {
      updated.pending.push(laneId);
    }
  };

  options.block.forEach((laneId) => markLane(laneId, 'blocked', 'Blocked due to '));
  options.queue.forEach((laneId) => markLane(laneId, 'pending', 'Queued behind '));

  touchedStages.forEach((stageId) => {
    if (stageId) {
      recomputeStageGateFromLanes(pattern, stageId);
    }
  });

  return updated;
}

function promoteDependentLanes(registry, pattern, originLaneId) {
  const promoted = [];
  const dependents = findDependentLanes(pattern, originLaneId);
  dependents.forEach((laneId) => {
    const lane = pattern.lanes?.[laneId];
    if (!lane) {
      return;
    }
    if (lane.status !== 'blocked') {
      return;
    }
    if (!laneDependenciesSatisfied(registry, pattern, laneId)) {
      return;
    }
    lane.status = 'pending';
    lane.updatedAt = nowIso();
    const note = `Auto-unblocked after lane ${originLaneId} completion`;
    lane.notes = lane.notes ? `${lane.notes}\n${note}` : note;
    registerScopeChange(pattern.patternId, `lane-${laneId}`);
    const stage = laneIdToStage(laneId);
    if (stage) {
      recomputeStageGateFromLanes(pattern, stage);
    }
    promoted.push(laneId);
  });
  return promoted;
}

function formatStageStatus(stageGate, stageNumber) {
  if (!stageGate) {
    return `${displayStageLabel(stageNumber)}: (no data)`;
  }
  const glyph = stageStatusMetadata[stageGate.status]?.glyph || '[ ]';
  const parts = [`${displayStageLabel(stageNumber)}: ${glyph} ${stageGate.status}`];
  if (stageGate.startedAt) {
    parts.push(`started ${stageGate.startedAt}`);
  }
  if (stageGate.elapsedMs) {
    const human = formatDuration(stageGate.elapsedMs);
    if (human) {
      parts.push(`elapsed ${human}`);
    }
  }
  if (stageGate.completedAt) {
    parts.push(`@ ${stageGate.completedAt}`);
  }
  if (stageGate.notes) {
    parts.push(`— ${stageGate.notes}`);
  }
  return parts.join(' ');
}

function formatLaneStatus(laneId, lane) {
  const glyph = glyphForLaneStatus(lane.status);
  const parts = [`${laneId}: ${glyph}`];
  if (lane.updatedAt) {
    parts.push(`@ ${lane.updatedAt}`);
  }
  if (lane.scope) {
    parts.push(`— ${lane.scope}`);
  }
  return parts.join(' ');
}

function evaluateStageStatusFromLanes(statuses) {
  if (!statuses.length) {
    return 'pending';
  }
  if (statuses.every((status) => status === 'complete')) {
    return 'complete';
  }
  if (statuses.some((status) => status === 'blocked')) {
    return 'blocked';
  }
  if (statuses.some((status) => status === 'in_progress')) {
    return 'in_progress';
  }
  if (statuses.some((status) => status === 'pending')) {
    return 'pending';
  }
  return 'pending';
}

function recomputeStageGateFromLanes(pattern, stageId) {
  const lanePrefix = stageId === '4' ? '4' : stageId === '6' ? '6' : null;
  if (!lanePrefix) {
    return;
  }
  const laneKeys = Object.keys(pattern.lanes || {}).filter((key) => key.startsWith(lanePrefix)).sort();
  if (laneKeys.length === 0) {
    return;
  }
  const statuses = laneKeys.map((key) => pattern.lanes[key]?.status || 'pending');
  const nextStatus = evaluateStageStatusFromLanes(statuses);
  setStageGate(pattern, stageId, nextStatus);
}

function setLaneStatus(pattern, laneId, status, note, options = {}) {
  const lane = pattern.lanes?.[laneId];
  if (!lane) {
    throw new Error(`Lane ${laneId} not found for pattern ${pattern.patternId}.`);
  }
  const statusProvided = options.statusProvided === false ? false : true;
  const currentStatus = lane.status || 'pending';
  const nextStatus = statusProvided ? status.toLowerCase() : currentStatus.toLowerCase();
  if (statusProvided && !laneStatusMetadata[nextStatus]) {
    throw new Error(`Unknown lane status: ${status}`);
  }
  const nowTimestamp = nowIso();
  if (statusProvided) {
    lane.status = nextStatus;
  }
  lane.updatedAt = nowTimestamp;
  if (options.planFiles || options.clearPlanFiles) {
    applyPlanFiles(lane, options.planFiles, options.clearPlanFiles);
  }
  let durationMs = null;
  if (statusProvided) {
    if (nextStatus === 'in_progress') {
      if (options.startedAt) {
        lane.startedAt = options.startedAt;
      } else if (!lane.startedAt || currentStatus !== 'in_progress') {
        lane.startedAt = nowTimestamp;
      }
    } else if (currentStatus === 'in_progress' && lane.startedAt) {
      durationMs = computeDurationMs(lane.startedAt, nowTimestamp);
      if (durationMs) {
        lane.elapsedMs = durationMs;
      } else {
        delete lane.elapsedMs;
      }
    } else if (options.startedAt && !lane.startedAt) {
      lane.startedAt = options.startedAt;
    }
    if (nextStatus === 'pending' || nextStatus === 'blocked') {
      delete lane.startedAt;
      delete lane.elapsedMs;
    }
  } else if (options.startedAt && !lane.startedAt) {
    lane.startedAt = options.startedAt;
  }
  if (note) {
    lane.notes = lane.notes ? `${lane.notes}\n${note}` : note;
  }
  const stage = laneIdToStage(laneId);
  if (stage) {
    recomputeStageGateFromLanes(pattern, stage);
  }
  registerScopeChange(pattern.patternId, `lane-${laneId.toLowerCase()}`);
  return { lane, previousStatus: currentStatus, durationMs, statusChanged: statusProvided && nextStatus !== currentStatus.toLowerCase() };
}


function printPatternCohorts(registry, pattern) {
  const cohortIds = getPatternCohortIds(pattern);
  if (!cohortIds.length) {
    console.log('Cohorts: (none assigned)');
    return;
  }
  const entries = cohortIds.map((cohortId) => {
    const cohort = findCohortById(registry, cohortId);
    if (!cohort) {
      return `${cohortId} — (missing from registry)`;
    }
    const baseLabel = cohort.name ? `${cohort.id} — ${cohort.name}` : cohort.id;
    const stage5 = getCohortStageEntry(cohort, '5a');
    if (!stage5) {
      return baseLabel;
    }
    const statusLabel = stage5.status ? `${stage5.status}` : 'unknown';
    const completed = stage5.completedAt ? ` @ ${stage5.completedAt}` : '';
    return `${baseLabel} (Stage 5A: ${statusLabel}${completed})`;
  });
  console.log(`Cohorts: ${entries.join('; ')}`);
}

function appendCohortNote(cohort, note) {
  if (!note) {
    return;
  }
  const timestamp = nowIso();
  const entry = `${timestamp} — ${note}`;
  if (cohort.notes) {
    cohort.notes = `${cohort.notes}\n${entry}`;
  } else {
    cohort.notes = entry;
  }
}

function segmentSortKey(segment) {
  const match = /^(\d+)([a-z]?)$/i.exec(segment);
  if (!match) {
    return segment;
  }
  const numeric = Number.parseInt(match[1], 10);
  const suffix = match[2] || '';
  return `${numeric.toString().padStart(2, '0')}-${suffix}`;
}

function printCohortDetails(registry, cohort, options = {}) {
  const indent = options.indent || '';
  const header = cohort.name ? `${cohort.id} — ${cohort.name}` : cohort.id;
  console.log(`${indent}Cohort ${header}`);
  if (cohort.description) {
    console.log(`${indent}  Description: ${cohort.description}`);
  }
  if (cohort.patterns.length) {
    const patternSummaries = cohort.patterns.map((patternId) => {
      const pattern = registry.patterns.find((p) => p.patternId === patternId);
      return pattern ? `${patternId} (${pattern.name})` : `${patternId} (missing)`;
    });
    console.log(`${indent}  Patterns: ${patternSummaries.join(', ')}`);
  } else {
    console.log(`${indent}  Patterns: (none assigned)`);
    console.log(`${indent}  Warning: assign patterns to this cohort before recording Stage 5A progress.`);
  }
  if (cohort.plannedFiles?.length) {
    console.log(`${indent}  Planned files: ${cohort.plannedFiles.join(', ')}`);
  }
  if (cohort.notes) {
    console.log(`${indent}  Notes:`);
    cohort.notes.split('\n').forEach((line) => {
      console.log(`${indent}    • ${line}`);
    });
  }
  if (cohort.updatedAt) {
    console.log(`${indent}  Updated: ${cohort.updatedAt}`);
  }
  const stages = cohort.stages || {};
  const segmentFilter = options.segment ? options.segment.toLowerCase() : null;
  const keys = Object.keys(stages).filter((segment) => {
    if (!segmentFilter) {
      return true;
    }
    return segment.toLowerCase() === segmentFilter;
  });
  if (!keys.length) {
    if (segmentFilter) {
      console.log(`${indent}  Segment ${segmentFilter} not yet recorded.`);
    } else {
      console.log(`${indent}  Segments: (none recorded)`);
    }
    return;
  }
  console.log(`${indent}  Segments:`);
  keys
    .sort((a, b) => segmentSortKey(a).localeCompare(segmentSortKey(b)))
    .forEach((segment) => {
      const entry = stages[segment];
      const status = entry?.status || 'unknown';
      const completed = entry?.completedAt ? ` @ ${entry.completedAt}` : '';
      console.log(`${indent}    • ${segment}: ${status}${completed}`);
      if (entry?.startedAt && entry?.completedAt) {
        console.log(`${indent}      Window: ${entry.startedAt} → ${entry.completedAt}`);
      } else if (entry?.startedAt) {
        console.log(`${indent}      Started: ${entry.startedAt}`);
      }
      if (entry?.plannedFiles?.length) {
        console.log(`${indent}      Planned files: ${entry.plannedFiles.join(', ')}`);
      }
      if (entry?.notes) {
        console.log(`${indent}      Notes: ${entry.notes}`);
      }
    });
}

function printCohortDirectory(registry) {
  const cohorts = getCohortCollection(registry);
  if (!cohorts.length) {
    console.log('No cohorts recorded.');
    return;
  }
  cohorts.forEach((cohort, index) => {
    const header = cohort.name ? `${cohort.id} — ${cohort.name}` : cohort.id;
    const patterns = cohort.patterns.length ? cohort.patterns.join(', ') : '(no patterns)';
    const stage5a = getCohortStageEntry(cohort, '5a');
    const stageLabel = stage5a
      ? `${stage5a.status}${stage5a.completedAt ? ` @ ${stage5a.completedAt}` : ''}`
      : 'not started';
    console.log(`${header}`);
    console.log(`  Patterns: ${patterns}`);
    console.log(`  Stage 5A: ${stageLabel}`);
    if (cohort.description) {
      console.log(`  Description: ${cohort.description}`);
    }
    if (index < cohorts.length - 1) {
      console.log('');
    }
  });
}

function propagateCohortStagePlanFiles(registry, cohort, segment, planFiles) {
  if (!segment || segment.toLowerCase() !== '5a') {
    return [];
  }
  const normalized = normalisePlanFiles(planFiles);
  if (!normalized.length) {
    return [];
  }
  const updates = [];
  (cohort.patterns || []).forEach((patternId) => {
    const pattern = registry.patterns.find((p) => p.patternId === patternId);
    if (!pattern) {
      return;
    }
    const gate = ensureStageGate(pattern, '5');
    const existing = Array.isArray(gate.plannedFiles) ? normalisePlanFiles(gate.plannedFiles) : [];
    const merged = normalisePlanFiles([...existing, ...normalized]);
    const changed =
      merged.length !== existing.length || merged.some((value, index) => value !== existing[index]);
    if (changed) {
      gate.plannedFiles = merged;
      registerScopeChange(patternId, 'stage-5');
      touchPattern(pattern);
      updates.push({
        patternId,
        name: pattern.name,
        planFiles: merged
      });
    }
  });
  return updates;
}

function printStatus(registry, pattern, updatedAt) {
  console.log(`Pattern ${pattern.patternId} — ${pattern.name}`);
  console.log(`Stage pointer: ${pattern.stage}`);
  if (pattern.description) {
    console.log(pattern.description);
  }
  printPatternCohorts(registry, pattern);
  console.log('');
  console.log('Stage gates:');
  const gateKeys = Object.keys(pattern.stageGates || {}).sort((a, b) => Number(a) - Number(b));
  gateKeys.forEach((key) => {
    console.log(`  ${formatStageStatus(pattern.stageGates[key], key)}`);
  });
  if (gateKeys.length === 0) {
    console.log('  (no stage gate metadata)');
  }
  console.log('');
  const printLaneGroup = (prefix, heading) => {
    console.log(heading);
    const laneKeys = Object.keys(pattern.lanes || {}).filter((k) => k.startsWith(prefix)).sort();
    if (laneKeys.length === 0) {
      console.log('  (no lanes recorded)');
      return;
    }
    laneKeys.forEach((laneId) => {
      const lane = pattern.lanes[laneId];
      console.log(`  ${formatLaneStatus(laneId, lane)}`);
      if (noteHeavyStatuses.includes(lane.status)) {
        printLaneNotes(pattern, laneId, '    ');
      }
      pattern.lanes[laneId].commands.forEach((cmd) => {
        const status = cmd.status ? ` [${cmd.status}]` : '';
        const executedAt = cmd.executedAt ? ` @ ${cmd.executedAt}` : '';
        const suffix = cmd.summary ? ` — ${cmd.summary}` : '';
        console.log(`    • ${cmd.command}${status}${executedAt}${suffix}`);
      });
    });
  };

  printLaneGroup('4', 'Stage 4 lanes:');
  printLaneGroup('6', 'Stage 6 lanes:');

  const nextLaneId = findNextAssignableLane(registry, pattern, '6');
  if (nextLaneId) {
    const lane = pattern.lanes?.[nextLaneId];
    if (lane) {
      console.log('');
      console.log(`Next assignable lane: ${nextLaneId} — ${describeLaneStatus(lane.status)} (${lane.scope})`);
    }
  } else if (Object.keys(pattern.lanes || {}).some((key) => key.startsWith('6'))) {
    console.log('');
    console.log('No auto-assignable Stage 6 lanes. Review lane notes for blockers or hand-off tasks.');
  }

  if (pattern.dependencies?.length) {
    console.log('');
    console.log(`Dependencies: ${pattern.dependencies.join(', ')}`);
  }
  if (pattern.handoff) {
    const { guardrails = [], sharedFiles = [] } = pattern.handoff;
    if (guardrails.length) {
      console.log('');
      console.log('Guardrails:');
      guardrails.forEach((g) => console.log(`  - ${g}`));
    }
    if (sharedFiles.length) {
      console.log('');
      console.log('Shared files:');
      sharedFiles.forEach((f) => console.log(`  - ${f}`));
    }
  }
  if (pattern.activity?.length) {
    console.log('');
    console.log('Recent activity:');
    const sorted = [...pattern.activity].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    sorted.slice(0, 5).forEach((entry) => {
      console.log(`  - ${entry.timestamp} (${entry.stage}): ${entry.summary}`);
    });
  }
  console.log('');
  console.log(`Registry snapshot updated at ${updatedAt}`);
}

function formatNoteHeading(note) {
  const timestamp = note.timestamp || '—';
  const authorSegment = note.author ? ` — ${note.author}` : '';
  const scopeLabel = deriveNoteScopeLabel(note);
  const scopeSegment = scopeLabel ? `[${scopeLabel}] ` : '';
  return `${scopeSegment}${timestamp}${authorSegment}`;
}

function getNoteBodyLines(note) {
  if (!note || typeof note.body !== 'string') {
    return ['_No note body provided._'];
  }
  const trimmed = note.body.trim();
  if (!trimmed) {
    return ['_No note body provided._'];
  }
  return trimmed.split(/\r?\n/);
}

function listNotes(pattern) {
  console.log('');
  console.log('Notes:');
  const notes = [...(pattern.notes || [])].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  if (notes.length === 0) {
    console.log('  (no notes recorded)');
    return;
  }
  notes.forEach((note) => {
    console.log(`  - ${formatNoteHeading(note)}`);
    getNoteBodyLines(note).forEach((line) => {
      console.log(`    ${line}`);
    });
  });
}

function renderStageSummary(pattern) {
  const gateKeys = Object.keys(pattern.stageGates || {}).sort((a, b) => Number(a) - Number(b));
  const rows = gateKeys.map((stage) => {
    const gate = pattern.stageGates[stage];
    const planned = gate.plannedFiles?.length ? gate.plannedFiles.join(', ') : '—';
    const elapsed = gate.elapsedMs ? formatDuration(gate.elapsedMs) || `${gate.elapsedMs}ms` : '—';
    return `| ${stage} | ${gate.status} | ${gate.startedAt || '—'} | ${gate.completedAt || '—'} | ${elapsed} | ${planned} | ${gate.notes ? gate.notes.replace(/\n/g, ' ') : '—'} |`;
  });
  return [
    '| Stage | Status | Started At | Completed At | Elapsed | Planned Files | Notes |',
    '| ----- | ------ | ---------- | ------------- | ------- | ------------- | ----- |',
    ...rows
  ].join('\n');
}

function renderLaneTable(pattern, prefix) {
  const laneKeys = Object.keys(pattern.lanes || {}).filter((key) => key.startsWith(prefix)).sort();
  if (laneKeys.length === 0) {
    return '_No lanes recorded._';
  }
  const rows = laneKeys.map((laneId) => {
    const lane = pattern.lanes[laneId];
    const elapsed = lane.elapsedMs ? formatDuration(lane.elapsedMs) || `${lane.elapsedMs}ms` : '—';
    const planned = lane.plannedFiles?.length ? lane.plannedFiles.join(', ') : '—';
    return `| ${laneId} | ${lane.status} | ${lane.updatedAt || '—'} | ${lane.startedAt || '—'} | ${elapsed} | ${planned} | ${lane.scope} |`;
  });
  return [
    '| Lane | Status | Updated At | Started At | Elapsed | Planned Files | Scope |',
    '| ---- | ------ | ---------- | ---------- | ------- | ------------- | ----- |',
    ...rows
  ].join('\n');
}

function renderActivityList(pattern) {
  if (!pattern.activity?.length) {
    return '_No activity recorded._';
  }
  const entries = [...pattern.activity].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return entries
    .map((entry) => {
      const agent = entry.agent ? ` — ${entry.agent}` : '';
      const files = entry.files?.length ? `\n  - Files: ${entry.files.join(', ')}` : '';
      const duration = entry.durationMs ? `\n  - Duration: ${formatDuration(entry.durationMs) || `${entry.durationMs}ms`}` : '';
      return `- ${entry.timestamp} — ${entry.stage}${agent}\n  - Summary: ${entry.summary}${files}${duration}`;
    })
    .join('\n');
}

function renderNotes(pattern) {
  const notes = [...(pattern.notes || [])].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  if (notes.length === 0) {
    return '_No notes recorded._';
  }
  return notes
    .map((note) => {
      const heading = `- ${formatNoteHeading(note)}`;
      const bodyLines = getNoteBodyLines(note).map((line) => `    ${line}`);
      return [heading, ...bodyLines].join('\n');
    })
    .join('\n');
}

function renderPatternMarkdown(pattern, updatedAt) {
  const patternStamp = pattern.updatedAt || updatedAt;
  const stage4Lanes = renderLaneTable(pattern, '4');
  const stage6Lanes = renderLaneTable(pattern, '6');
  const notesSection = renderNotes(pattern);
  return `# Utility Consolidation Plan — Pattern ${pattern.patternId} (Generated Preview)\n\nUpdated from registry snapshot ${patternStamp}.\n\n## Stage Summary\n${renderStageSummary(pattern)}\n\n## Stage 4 Lanes\n${stage4Lanes}\n\n## Stage 6 Lanes\n${stage6Lanes}\n\n## Recent Activity\n${renderActivityList(pattern)}\n\n## Notes\n${notesSection}\n`;
}

function renderTrackerMarkdown(registry) {
  const header = ['| Pattern | Name | Stage | Next Action |', '| ------- | ---- | ----- | ----------- |'];
  const rows = registry.patterns.map((pattern) => {
    const stageKeys = Object.keys(pattern.stageGates || {}).sort((a, b) => Number(a) - Number(b));
    const firstOpen = stageKeys.find((key) => pattern.stageGates[key].status !== 'complete');
    const nextAction = firstOpen
      ? `${displayStageLabel(firstOpen)} — ${pattern.stageGates[firstOpen].status}`
      : `${displayStageLabel('7')} wrap-up`;
    return `| ${pattern.patternId} | ${pattern.name} | ${pattern.stage} | ${nextAction} |`;
  });
  return ['# Consolidation Registry Snapshot', '', ...header, ...rows, '', `Generated ${registry.updatedAt}.`].join('\n');
}

function renderActivityMarkdown(registry) {
  const allEntries = registry.patterns.flatMap((pattern) =>
    (pattern.activity || []).map((entry) => ({ ...entry, pattern: pattern.patternId, name: pattern.name }))
  );
  if (!allEntries.length) {
    return '# Utility Consolidation Activity (Generated)\n\n_No activity recorded in registry._\n';
  }
  const ordered = allEntries.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const lines = ordered.map((entry) => {
    const files = entry.files?.length ? `\n  - Files: ${entry.files.join(', ')}` : '';
    const agent = entry.agent ? ` — ${entry.agent}` : '';
    const duration = entry.durationMs ? `\n  - Duration: ${formatDuration(entry.durationMs) || `${entry.durationMs}ms`}` : '';
    return `- ${entry.timestamp} — Pattern ${entry.pattern} (${entry.name}) — ${entry.stage}${agent}\n  - Summary: ${entry.summary}${files}${duration}`;
  });
  return ['# Utility Consolidation Activity (Generated)', '', ...lines].join('\n');
}

async function writeFileIfChanged(filePath, content, checkOnly) {
  const formattedContent = await formatMarkdownIfNeeded(filePath, content);
  let existing = null;
  try {
    existing = await readFile(filePath, 'utf8');
  } catch (_) {
    existing = null;
  }
  if (existing === formattedContent) {
    return false;
  }
  if (checkOnly) {
    throw new Error(`Generated content for ${filePath} would change; rerun without --check to update.`);
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, formattedContent, 'utf8');
  return true;
}

function parseRegenParams(params = []) {
  const config = {
    checkOnly: false,
    forceAll: false,
    includeGlobalSchedule: true,
    patterns: [],
    cohorts: [],
    silent: false
  };
  for (let i = 0; i < params.length; i += 1) {
    const token = params[i];
    switch (token) {
      case '--check':
        config.checkOnly = true;
        break;
      case '--all':
      case '--force-all':
        config.forceAll = true;
        break;
      case '--no-global':
        config.includeGlobalSchedule = false;
        break;
      case '--global':
        config.includeGlobalSchedule = true;
        break;
      case '--pattern': {
        if (i + 1 >= params.length) {
          throw new Error('regen: --pattern requires an id');
        }
        const numeric = Number.parseInt(params[i + 1], 10);
        if (Number.isNaN(numeric)) {
          throw new Error(`regen: invalid pattern id "${params[i + 1]}"`);
        }
        config.patterns.push(numeric);
        i += 1;
        break;
      }
      case '--patterns': {
        if (i + 1 >= params.length) {
          throw new Error('regen: --patterns requires a value');
        }
        const parsed = parsePatternIdList(params[i + 1]);
        config.patterns.push(...parsed);
        i += 1;
        break;
      }
      case '--cohort': {
        if (i + 1 >= params.length) {
          throw new Error('regen: --cohort requires an id');
        }
        const value = params[i + 1];
        if (!value.trim()) {
          throw new Error('regen: --cohort id cannot be blank');
        }
        config.cohorts.push(value.trim());
        i += 1;
        break;
      }
      case '--cohorts': {
        if (i + 1 >= params.length) {
          throw new Error('regen: --cohorts requires a value');
        }
        const raw = params[i + 1];
        raw
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
          .forEach((value) => config.cohorts.push(value));
        i += 1;
        break;
      }
      case '--silent':
        config.silent = true;
        break;
      case '--verbose':
        config.silent = false;
        break;
      default:
        throw new Error(`regen: unknown flag ${token}`);
    }
  }
  return config;
}

function normalizeRegenOptions(registry, options = {}) {
  let baseConfig;
  if (Array.isArray(options)) {
    baseConfig = parseRegenParams(options);
  } else if (options && typeof options === 'object') {
    const paramConfig = Array.isArray(options.params) ? parseRegenParams(options.params) : null;
    baseConfig = {
      checkOnly: Boolean(options.checkOnly),
      forceAll: Boolean(options.forceAll),
      includeGlobalSchedule:
        Object.prototype.hasOwnProperty.call(options, 'includeGlobalSchedule') ? Boolean(options.includeGlobalSchedule) : true,
      patterns: Array.isArray(options.patterns)
        ? [...options.patterns]
        : options.patterns instanceof Set
        ? [...options.patterns]
        : [],
      cohorts: Array.isArray(options.cohorts)
        ? [...options.cohorts]
        : options.cohorts instanceof Set
        ? [...options.cohorts]
        : [],
      silent: Boolean(options.silent)
    };
    if (paramConfig) {
      baseConfig.checkOnly = baseConfig.checkOnly || paramConfig.checkOnly;
      baseConfig.forceAll = baseConfig.forceAll || paramConfig.forceAll;
      if (paramConfig.includeGlobalSchedule === false) {
        baseConfig.includeGlobalSchedule = false;
      } else if (paramConfig.includeGlobalSchedule === true) {
        baseConfig.includeGlobalSchedule = baseConfig.includeGlobalSchedule && true;
      }
      baseConfig.patterns.push(...paramConfig.patterns);
      baseConfig.cohorts.push(...paramConfig.cohorts);
      if (paramConfig.silent) {
        baseConfig.silent = true;
      }
    }
  } else {
    baseConfig = {
      checkOnly: false,
      forceAll: false,
      includeGlobalSchedule: true,
      patterns: [],
      cohorts: [],
      silent: false
    };
  }
  const patternSet = new Set();
  (baseConfig.patterns || []).forEach((entry) => {
    const numeric = Number.parseInt(entry, 10);
    if (!Number.isNaN(numeric)) {
      patternSet.add(numeric);
    }
  });
  const cohortSet = new Set();
  (baseConfig.cohorts || []).forEach((entry) => {
    if (entry || entry === 0) {
      cohortSet.add(normaliseCohortId(entry));
    }
  });

  const forceAll = baseConfig.forceAll || (!patternSet.size && !cohortSet.size);

  return {
    checkOnly: Boolean(baseConfig.checkOnly),
    forceAll,
    includeGlobalSchedule: baseConfig.includeGlobalSchedule !== false,
    patternSet,
    cohortSet,
    silent: Boolean(baseConfig.silent)
  };
}

async function runRegen(registry, options = {}) {
  const { checkOnly, forceAll, includeGlobalSchedule, patternSet, cohortSet, silent } = normalizeRegenOptions(registry, options);
  const generatedFiles = [];
  const planDir = path.join(repoRoot, 'dev/architecture/plans');
  const targetPatterns = forceAll
    ? [...registry.patterns]
    : registry.patterns.filter((pattern) => patternSet.has(pattern.patternId));
  for (const pattern of targetPatterns) {
    const generatedPath = path.join(planDir, `${pattern.patternId}.generated.md`);
    const content = renderPatternMarkdown(pattern, registry.updatedAt);
    const changed = await writeFileIfChanged(generatedPath, content, checkOnly);
    generatedFiles.push({ file: generatedPath, changed });
  }
  const trackerPath = path.join(__dirname, 'registry-status.generated.md');
  const trackerChanged = await writeFileIfChanged(trackerPath, renderTrackerMarkdown(registry), checkOnly);
  generatedFiles.push({ file: trackerPath, changed: trackerChanged });

  try {
    const { generateScheduleArtifacts } = await import(scheduleToolsModulePath);
    const schedulesDir = path.join(repoRoot, 'dev/architecture/schedules');
    const scheduleArtifacts = [];
    if (includeGlobalSchedule) {
      scheduleArtifacts.push(
        await generateScheduleArtifacts(registry, {
          format: 'markdown',
          output: path.join(schedulesDir, 'schedule-all.md')
        })
      );
      scheduleArtifacts.push(
        await generateScheduleArtifacts(registry, {
          format: 'json',
          output: path.join(schedulesDir, 'schedule-all.json')
        })
      );
    }
    const cohortIds = forceAll
      ? (registry.cohorts || []).map((cohort) => normaliseCohortId(cohort.id))
      : [...cohortSet];
    const processedCohorts = new Set();
    for (const cohortId of cohortIds) {
      if (!cohortId || processedCohorts.has(cohortId)) {
        continue;
      }
      const cohort = findCohortById(registry, cohortId);
      if (!cohort) {
        continue;
      }
      processedCohorts.add(cohortId);
      const safeId = normaliseCohortId(cohort.id);
      const baseName = safeId;
      const cohortPatterns = Array.isArray(cohort.patterns) ? cohort.patterns : [];
      scheduleArtifacts.push(
        await generateScheduleArtifacts(registry, {
          format: 'markdown',
          output: path.join(schedulesDir, `${baseName}.md`),
          patterns: cohortPatterns,
          patternsProvided: true,
          cohorts: [safeId],
          cohortsProvided: true
        })
      );
      scheduleArtifacts.push(
        await generateScheduleArtifacts(registry, {
          format: 'json',
          output: path.join(schedulesDir, `${baseName}.json`),
          patterns: cohortPatterns,
          patternsProvided: true,
          cohorts: [safeId],
          cohortsProvided: true
        })
      );
    }
    scheduleArtifacts.forEach((artifact) => {
      if (artifact.outputPath) {
        generatedFiles.push({ file: artifact.outputPath, changed: artifact.changed });
      }
    });
  } catch (error) {
    if (!silent) {
      console.warn(`Schedule regeneration skipped: ${error.message || error}`);
    }
  }

  const activityPath = path.join(repoRoot, 'dev/architecture/utility-consolidation-activity-log.generated.md');
  const activityChanged = await writeFileIfChanged(activityPath, renderActivityMarkdown(registry), checkOnly);
  generatedFiles.push({ file: activityPath, changed: activityChanged });

  if (!silent) {
    const changedCount = generatedFiles.filter((item) => item.changed).length;
    const summary = changedCount === 0 ? 'No changes' : `Updated ${changedCount} file(s).`;
    console.log(summary);
    generatedFiles.forEach((item) => {
      console.log(` - ${item.changed ? 'updated' : 'no-op'} ${item.file}`);
    });
  }
}

async function main() {
  try {
    const registry = await loadRegistry();
    autoUpdateAllPatternStatuses(registry);
    const { command, params } = parseArgs(process.argv);
    const descriptor = resolveDescriptor(command);
    if (!descriptor) {
      throw new Error(`Unknown command: ${command}`);
    }
    const { positionals, options, helpRequested } = parseCommandInvocation(descriptor, params);
    if (descriptor.name !== 'help' && helpRequested) {
      console.log(formatCommandUsage(descriptor));
      return;
    }
    switch (descriptor.name) {
      case 'guide': {
        const patternId = positionals.patternId;
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const guideOptions = { ...options };
        const rawPatternToken = params[0];
        const shorthand = parseGuidePatternShorthand(rawPatternToken);
        if (shorthand.errors.length) {
          throwUsageError(descriptor, shorthand.errors.join(' '));
        }
        if (shorthand.showLanes) {
          guideOptions.showLanes = true;
        }
        if (shorthand.showRecent) {
          guideOptions.showRecent = true;
        }
        if (shorthand.focusNext) {
          guideOptions.focusNext = true;
        }
        if (shorthand.lane) {
          const normalizedLane = shorthand.lane;
          if (guideOptions.lane && guideOptions.lane !== normalizedLane) {
            throwUsageError(
              descriptor,
              `guide: conflicting lane targets (${guideOptions.lane} vs ${normalizedLane}).`
            );
          }
          if (!guideOptions.lane) {
            guideOptions.lane = normalizedLane;
          }
        }
        let shorthandStageNormalized;
        if (shorthand.stage) {
          try {
            shorthandStageNormalized = normalizeGuideStageOption(shorthand.stage);
          } catch (error) {
            throwUsageError(descriptor, error.message);
          }
        }
        if (guideOptions.stage) {
          try {
            const normalizedStage = normalizeGuideStageOption(guideOptions.stage);
            if (shorthandStageNormalized && normalizedStage !== shorthandStageNormalized) {
              throwUsageError(
                descriptor,
                `guide: conflicting stage targets (${guideOptions.stage} vs ${shorthand.stage}).`
              );
            }
            guideOptions.stage = normalizedStage;
          } catch (error) {
            throwUsageError(descriptor, error.message);
          }
        } else if (shorthandStageNormalized) {
          guideOptions.stage = shorthandStageNormalized;
        }
        if (guideOptions.lane && !/^[0-9]+[a-z]$/i.test(guideOptions.lane)) {
          throwUsageError(descriptor, `guide: invalid lane ${guideOptions.lane}`);
        }
        if (guideOptions.lane && !(pattern.lanes || {})[guideOptions.lane]) {
          throw new Error(`Lane ${guideOptions.lane} not found for pattern ${patternId}.`);
        }
        if (guideOptions.focusNext && (guideOptions.stage || guideOptions.lane)) {
          throwUsageError(descriptor, 'guide: --next cannot be combined with --stage/--lane');
        }
        if (guideOptions.stage && guideOptions.lane) {
          const laneStage = laneIdToStage(guideOptions.lane);
          if (laneStage && laneStage !== guideOptions.stage) {
            throwUsageError(
              descriptor,
              `guide: lane ${guideOptions.lane} belongs to stage ${laneStage}, not ${guideOptions.stage}`
            );
          }
        }
        printGuide(registry, pattern, guideOptions);
        break;
      }
      case 'claim': {
        const patternId = positionals.patternId;
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const claimOptions = {
          ...options,
          planFiles: Array.isArray(options.planFiles) ? options.planFiles : []
        };
        const hasStage = Boolean(claimOptions.stage);
        const hasLane = Boolean(claimOptions.lane);
        if (!hasStage && !hasLane) {
          throwUsageError(descriptor, 'claim requires --stage <id> or --lane <laneId>.');
        }
        if (hasStage && hasLane) {
          throwUsageError(descriptor, 'claim accepts either --stage or --lane, not both.');
        }

        let outputMessage = '';

        if (hasStage) {
          const stageId = normaliseStageId(String(claimOptions.stage));
          const stageLabel = displayStageLabel(stageId);
          autoUpdatePatternStatuses(registry, pattern);
          const gate = ensureStageGate(pattern, stageId);
          const currentStatus = gate.status || defaultStageStatus(stageId);
          if (currentStatus === 'in_progress') {
            throw new Error(
              `${stageLabel} is already in_progress. Choose another stage or coordinate with the current owner.`
            );
          }
          if (!assignableStageStatuses.includes(currentStatus)) {
            throw new Error(
              `${stageLabel} cannot be claimed while it is ${currentStatus}. Coordinate with the current owner or resolve blockers first.`
            );
          }
          if (stageId === '5') {
            assertStage5Access(registry, pattern);
          }
          const normalizedPlanFiles = normalisePlanFileInputs(claimOptions.planFiles, descriptor, 'claim');
          if (normalizedPlanFiles.length) {
            const conflicts = findPlanConflicts(normalizedPlanFiles, collectActivePlanFileMap(pattern, `stage-${stageId}`));
            if (conflicts.conflict) {
              console.log(
                `Warning: planned files overlap with active work scopes (${conflicts.conflicts.join(', ')}). Coordinate before proceeding.`
              );
            }
            const registryConflicts = hasRegistryPlanConflict(registry, normalizedPlanFiles, patternId, `stage-${stageId}`);
            if (registryConflicts.conflict) {
              console.log(
                `Warning: planned files overlap with other in-progress scopes (${registryConflicts.conflicts.join(', ')}). Coordinate before proceeding.`
              );
            }
          }
          setStageGate(pattern, stageId, 'in_progress', {
            planFiles: normalizedPlanFiles,
            clearPlanFiles: claimOptions.clearPlanFiles
          });
          if (!normalizedPlanFiles.length && !claimOptions.clearPlanFiles) {
            console.log('Reminder: no planned files recorded; add them with --plan-files to improve scheduling.');
          }
          recomputePatternStagePointer(pattern);
          autoUpdatePatternStatuses(registry, pattern);
          const agentId = deriveAgentId(patternId, { stage: stageId });
          appendStageClaimNote(pattern, stageId, claimOptions.note, agentId);
          const activityEntries = pattern.activity || (pattern.activity = []);
          activityEntries.push({
            stage: `stage-${stageId}`,
            timestamp: nowIso(),
            summary: claimOptions.summary || `${stageLabel} claimed`,
            agent: agentId
          });
          outputMessage = `${stageLabel} for pattern ${patternId} claimed with agent id ${agentId}.`;
        } else {
          const laneId = claimOptions.lane;
          if (!laneId) {
            throwUsageError(descriptor, 'claim --lane requires a lane id (e.g., 4a, 6b).');
          }
          autoUpdatePatternStatuses(registry, pattern);
          const lane = pattern.lanes?.[laneId];
          if (!lane) {
            throw new Error(`Lane ${laneId} not found for pattern ${patternId}.`);
          }
          const laneStage = laneIdToStage(laneId);
          if (!laneStage) {
            throw new Error(`Unable to determine stage for lane ${laneId}.`);
          }
          const currentStatus = lane.status || 'pending';
          if (currentStatus === 'in_progress') {
            throw new Error(
              `Lane ${laneId} is already in_progress. Choose another lane or coordinate with the current owner.`
            );
          }
          if (!assignableLaneStatuses.includes(currentStatus)) {
            throw new Error(
              `Lane ${laneId} cannot be claimed while it is ${currentStatus}. Coordinate with the current owner or resolve blockers first.`
            );
          }
          if (!laneDependenciesSatisfied(registry, pattern, laneId)) {
            throw new Error(`Lane ${laneId} dependencies are not satisfied yet.`);
          }
          if (lane.stage === '5') {
            assertStage5Access(registry, pattern);
          }
          const normalizedPlanFiles = normalisePlanFileInputs(claimOptions.planFiles, descriptor, 'claim');
          if (normalizedPlanFiles.length) {
            const conflicts = findPlanConflicts(normalizedPlanFiles, collectActivePlanFileMap(pattern, `lane-${laneId}`));
            if (conflicts.conflict) {
              console.log(
                `Warning: planned files overlap with active work scopes (${conflicts.conflicts.join(', ')}). Coordinate before proceeding.`
              );
            }
            const registryConflicts = hasRegistryPlanConflict(registry, normalizedPlanFiles, patternId, `lane-${laneId}`);
            if (registryConflicts.conflict) {
              console.log(
                `Warning: planned files overlap with other in-progress scopes (${registryConflicts.conflicts.join(', ')}). Coordinate before proceeding.`
              );
            }
          }
          setLaneStatus(pattern, laneId, 'in_progress', claimOptions.note, {
            planFiles: normalizedPlanFiles,
            clearPlanFiles: claimOptions.clearPlanFiles
          });
          autoUpdatePatternStatuses(registry, pattern);
          if (!normalizedPlanFiles.length && !claimOptions.clearPlanFiles) {
            console.log('Reminder: no planned files recorded; add them with --plan-files to improve scheduling.');
          }
          const agentId = deriveAgentId(patternId, { lane: laneId });
          const activityEntries = pattern.activity || (pattern.activity = []);
          activityEntries.push({
            stage: `lane-${laneId}`,
            timestamp: nowIso(),
            summary: claimOptions.summary || `Lane ${laneId} claimed`,
            agent: agentId
          });
          outputMessage = `Lane ${laneId} for pattern ${patternId} claimed with agent id ${agentId}.`;
        }

        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(outputMessage);
        if (hasStage) {
          console.log(
            'Auto-blocking: downstream stage gates and lanes stay blocked until this stage is marked `complete`; rely on the gate status instead of manual toggles.'
          );
        }
        if (hasLane) {
          const laneId = claimOptions.lane;
          const lane = pattern.lanes?.[laneId];
          const laneStage = laneIdToStage(laneId);
          if (laneStage === '6') {
            printHandoffSummary(pattern, '\nHandoff summary:');
          }
          if (lane) {
            printLaneDetail(pattern, laneId, lane);
          }
        }
        break;
      }
      case 'update-stage': {
        const patternId = positionals.patternId;
        const stageId = normaliseStageId(String(positionals.stageId));
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const stageOptions = {
          ...options,
          files: Array.isArray(options.files) ? options.files : [],
          planFiles: Array.isArray(options.planFiles) ? options.planFiles : [],
          addDependencies: Array.isArray(options.addDependencies) ? options.addDependencies : [],
          removeDependencies: Array.isArray(options.removeDependencies) ? options.removeDependencies : [],
          searchTerms: Array.isArray(options.searchTerms) ? options.searchTerms : []
        };
        const stageLabel = displayStageLabel(stageId);
        const gate = ensureStageGate(pattern, stageId);
        const currentStatus = gate.status || defaultStageStatus(stageId);
        const statusProvided = Boolean(stageOptions.statusProvided);
        const requestedStatus = statusProvided ? String(stageOptions.status).toLowerCase() : currentStatus.toLowerCase();

        if (statusProvided && !stageStatusMetadata[requestedStatus]) {
          throwUsageError(descriptor, `Unsupported stage status: ${stageOptions.status}`);
        }
        if (stageOptions.completedAtProvided && Number.isNaN(Date.parse(stageOptions.completedAt))) {
          throwUsageError(descriptor, 'update-stage: --completed-at must be a valid ISO8601 timestamp');
        }
        if (stageId === '5' && statusProvided && requestedStatus === 'in_progress') {
          assertStage5Access(registry, pattern);
        }

        const normalizedFiles = stageOptions.files.length ? [...new Set(stageOptions.files)] : [];
        const normalizedPlanFiles = stageOptions.planFiles.length
          ? normalisePlanFileInputs(stageOptions.planFiles, descriptor, 'update-stage')
          : undefined;
        const normalizedSearchTerms = stageOptions.searchTerms?.length
          ? normaliseSearchTermInputs(stageOptions.searchTerms, descriptor, 'update-stage')
          : undefined;

        const addDependencies = stageOptions.addDependencies.map((entry) =>
          parseDependencyDescriptor(entry, 'update-stage')
        );
        const removeDependencies = stageOptions.removeDependencies.map((entry) =>
          parseDependencyDescriptor(entry, 'update-stage')
        );

        const hasPlanFileMutation = Boolean(stageOptions.planFiles.length) || Boolean(stageOptions.clearPlanFiles);
        const hasSearchMutation = Boolean(stageOptions.searchTerms.length) || Boolean(stageOptions.clearSearchTerms);
        const hasDependencyMutation =
          addDependencies.length > 0 || removeDependencies.length > 0 || Boolean(stageOptions.clearDependencies);
        const hasNotesMutation = Boolean(stageOptions.notesProvided);
        const hasCompletedAtMutation = Boolean(stageOptions.completedAtProvided);
        const hasSummaryMutation = Boolean(stageOptions.summary);
        const hasFilesMutation = normalizedFiles.length > 0;
        if (
          !statusProvided &&
          !hasPlanFileMutation &&
          !hasSearchMutation &&
          !hasDependencyMutation &&
          !hasNotesMutation &&
          !hasCompletedAtMutation &&
          !hasSummaryMutation &&
          !hasFilesMutation
        ) {
          throwUsageError(descriptor, 'update-stage requires --status or another mutation flag.');
        }

        if (normalizedPlanFiles?.length) {
          const conflicts = findPlanConflicts(normalizedPlanFiles, collectActivePlanFileMap(pattern, `stage-${stageId}`));
          if (conflicts.conflict) {
            console.log(
              `Warning: planned files overlap with active work scopes (${conflicts.conflicts.join(', ')}). Coordinate before proceeding.`
            );
          }
          const registryConflicts = hasRegistryPlanConflict(registry, normalizedPlanFiles, patternId, `stage-${stageId}`);
          if (registryConflicts.conflict) {
            console.log(
              `Warning: planned files overlap with other in-progress scopes (${registryConflicts.conflicts.join(', ')}). Coordinate before proceeding.`
            );
          }
        }

        if (normalizedSearchTerms || stageOptions.clearSearchTerms) {
          applySearchTerms(gate, normalizedSearchTerms, Boolean(stageOptions.clearSearchTerms));
        }
        if (statusProvided && requestedStatus === 'complete' && (stageId === '6' || stageId === '7')) {
          enforceScopeCleanupGuard(pattern, 'stage', stageId, { force: Boolean(stageOptions.force) });
        }
        const stageDependencyChanges = applyDependencyMutations(gate, {
          addDependencies,
          removeDependencies,
          clearDependencies: Boolean(stageOptions.clearDependencies)
        });
        const { durationMs, previousStatus, statusChanged } = setStageGate(pattern, stageId, requestedStatus, {
          statusProvided,
          notes: stageOptions.notesProvided ? stageOptions.notes : undefined,
          completedAt: stageOptions.completedAtProvided ? stageOptions.completedAt : undefined,
          planFiles: normalizedPlanFiles,
          clearPlanFiles: stageOptions.clearPlanFiles
        });
        if (stageOptions.planFiles.length === 0 && stageOptions.clearPlanFiles) {
          console.log('Planned files cleared from stage gate.');
        }
        recomputePatternStagePointer(pattern);
        autoUpdatePatternStatuses(registry, pattern);

        if (stageDependencyChanges.changed) {
          const parts = [];
          if (stageDependencyChanges.added.length) {
            parts.push(`+${stageDependencyChanges.added.map(formatDependencyReference).join(', ')}`);
          }
          if (stageDependencyChanges.removed.length) {
            parts.push(`-${stageDependencyChanges.removed.map(formatDependencyReference).join(', ')}`);
          }
          if (stageOptions.clearDependencies && stageDependencyChanges.removed.length === 0 && stageDependencyChanges.added.length === 0) {
            parts.push('cleared');
          }
          const summaryBody = parts.length ? parts.join('; ') : 'updated';
          const currentList = stageDependencyChanges.current.length
            ? stageDependencyChanges.current.map(formatDependencyReference).join(', ')
            : '(none)';
          console.log(`${stageLabel} dependencies updated (${summaryBody}). Current: ${currentList}`);
        }

        const updatedStatus = gate.status || defaultStageStatus(stageId);
        const activityEntries = pattern.activity || (pattern.activity = []);
        let stageSummaryText;
        if (stageOptions.summary) {
          stageSummaryText = stageOptions.summary;
        } else if (statusProvided) {
          stageSummaryText = statusChanged
            ? `${stageLabel} status set to ${requestedStatus}`
            : `${stageLabel} status remains ${requestedStatus}`;
        } else {
          stageSummaryText = `${stageLabel} metadata updated (status ${updatedStatus})`;
        }
        if (stageDependencyChanges.changed) {
          const dependencyMutationSummary = stageDependencyChanges.current.length
            ? stageDependencyChanges.current.map(formatDependencyReference).join(', ')
            : '(none)';
          const parts = [];
          if (stageDependencyChanges.added.length) {
            parts.push(`+${stageDependencyChanges.added.map(formatDependencyReference).join(', ')}`);
          }
          if (stageDependencyChanges.removed.length) {
            parts.push(`-${stageDependencyChanges.removed.map(formatDependencyReference).join(', ')}`);
          }
          if (stageOptions.clearDependencies && stageDependencyChanges.removed.length === 0 && stageDependencyChanges.added.length === 0) {
            parts.push('cleared');
          }
          const mutationLabel = parts.length ? parts.join('; ') : 'deps updated';
          stageSummaryText = stageOptions.summary
            ? `${stageSummaryText} (${mutationLabel} → ${dependencyMutationSummary})`
            : `${stageSummaryText} — ${mutationLabel} → ${dependencyMutationSummary}`;
        }

        const activityEntry = {
          stage: `stage-${stageId}`,
          timestamp: nowIso(),
          summary: stageSummaryText
        };
        if (stageOptions.agent) {
          activityEntry.agent = stageOptions.agent;
        }
        if (normalizedFiles.length) {
          activityEntry.files = normalizedFiles;
        }
        if (durationMs) {
          activityEntry.durationMs = durationMs;
        }
        activityEntries.push(activityEntry);

        let stageNextHint = null;
        if (statusProvided && statusChanged && requestedStatus === 'complete') {
          stageNextHint = findNextWorkTarget(registry, pattern, stageId);
        }

        touchPattern(pattern);
        await saveRegistry(registry);
        const messageStatus = statusProvided ? requestedStatus : updatedStatus;
        if (statusProvided) {
          if (statusChanged) {
            console.log(`${stageLabel} updated to ${messageStatus}.`);
          } else {
            console.log(`${stageLabel} status unchanged (${messageStatus}).`);
          }
        } else {
          console.log(`${stageLabel} metadata updated (status ${messageStatus}).`);
        }
        if (durationMs && previousStatus === 'in_progress') {
          const human = formatDuration(durationMs) || `${durationMs}ms`;
          console.log(`  Elapsed while in_progress: ${human}`);
        }
        if (normalizedPlanFiles?.length) {
          console.log(`  Planned files now tracked: ${normalizedPlanFiles.join(', ')}`);
        } else if (stageOptions.clearPlanFiles) {
          console.log('  Planned files cleared.');
        }
        if (stageNextHint) {
          printNextWorkHint(patternId, stageNextHint);
        }
        break;
      }

      case 'cohort': {
        canonicalizeCohortIds(registry, { touch: false });
        const cohortOptions = {
          ...options,
          addPattern: Array.isArray(options.addPattern) ? options.addPattern : [],
          removePattern: Array.isArray(options.removePattern) ? options.removePattern : [],
          create: Array.isArray(options.create) ? options.create : []
        };
        const createIds = parsePatternIdInputs(cohortOptions.create, 'cohort --create');
        const addIds = parsePatternIdInputs(cohortOptions.addPattern, 'cohort --add-pattern');
        const removeIds = parsePatternIdInputs(cohortOptions.removePattern, 'cohort --remove-pattern');
        const hasCreate = createIds.length > 0;
        const hasAdd = addIds.length > 0;
        const hasRemove = removeIds.length > 0;
        const hasMetadataChange = Boolean(cohortOptions.name || cohortOptions.description);
        const hasNote = Boolean(cohortOptions.note);
        const hasId = typeof cohortOptions.id === 'string' && cohortOptions.id.trim().length > 0;

        if (cohortOptions.all) {
          if (hasCreate || hasId || hasAdd || hasRemove || hasMetadataChange || hasNote || cohortOptions.list) {
            throwUsageError(descriptor, 'cohort --all cannot be combined with other options.');
          }
          printCohortDirectory(registry);
          break;
        }

        if (hasCreate) {
          if (hasId || hasAdd || hasRemove || cohortOptions.list) {
            throwUsageError(
              descriptor,
              'cohort --create cannot be combined with --id/--add-pattern/--remove-pattern/--list.'
            );
          }
          if (!createIds.length) {
            throwUsageError(descriptor, 'cohort --create requires at least one pattern id.');
          }
          const meta = canonicalizeCohortIds(registry, { touch: false });
          const newCohortId =
            meta.nextId || cohortLabelFromIndex(getCohortCollection(registry).length);
          const cohort = ensureCohort(registry, newCohortId, {
            name: cohortOptions.name,
            description: cohortOptions.description
          });
          const assignedPatterns = [];
          createIds.forEach((patternId) => {
            const pattern = requirePatternById(registry, patternId);
            const existing = getPatternCohortIds(pattern);
            if (existing.length) {
              throw new Error(
                `Pattern ${patternId} already assigned to cohort ${existing[0]}; remove it before creating a new cohort.`
              );
            }
            const result = syncCohortAssignments(registry, pattern, [cohort.id]);
            if (result.added.includes(cohort.id)) {
              assignedPatterns.push(patternId);
              const activityEntries = pattern.activity || (pattern.activity = []);
              activityEntries.push({
                stage: 'stage-5',
                timestamp: nowIso(),
                summary: `Assigned to cohort ${cohort.id}`
              });
            }
          });
          if (hasNote) {
            appendCohortNote(cohort, cohortOptions.note);
          }
          touchCohort(cohort);
          canonicalizeCohortIds(registry, { touch: false });
          await saveRegistry(registry);
          console.log(
            `Created cohort ${cohort.id} (${assignedPatterns.length} pattern${assignedPatterns.length === 1 ? '' : 's'} assigned).`
          );
          printCohortDetails(registry, cohort);
          break;
        }

        if (!hasId) {
          throwUsageError(descriptor, 'cohort requires --all, --create, or --id <cohortId>.');
        }

        const cohort = findCohortById(registry, cohortOptions.id);
        if (!cohort) {
          throw new Error(
            `Cohort ${cohortOptions.id} not found. Run 'npm run consolidate -- cohort --all' to inspect available cohorts.`
          );
        }

        const actuallyAdded = [];
        const actuallyRemoved = [];

        if (hasRemove) {
          removeIds.forEach((patternId) => {
            const pattern = requirePatternById(registry, patternId);
            const existing = getPatternCohortIds(pattern);
            if (!existing.includes(cohort.id)) {
              console.log(`Pattern ${patternId} is not assigned to cohort ${cohort.id}; skipping removal.`);
              return;
            }
            const result = syncCohortAssignments(registry, pattern, []);
            if (result.removed.includes(cohort.id)) {
              actuallyRemoved.push(patternId);
              const activityEntries = pattern.activity || (pattern.activity = []);
              activityEntries.push({
                stage: 'stage-5',
                timestamp: nowIso(),
                summary: `Removed from cohort ${cohort.id}`
              });
            }
          });
        }

        if (hasAdd) {
          addIds.forEach((patternId) => {
            const pattern = requirePatternById(registry, patternId);
            const existing = getPatternCohortIds(pattern);
            if (existing.length && !existing.includes(cohort.id)) {
              throw new Error(
                `Pattern ${patternId} already assigned to cohort ${existing[0]}; remove it before adding to ${cohort.id}.`
              );
            }
            const result = syncCohortAssignments(registry, pattern, [cohort.id]);
            if (result.added.includes(cohort.id)) {
              actuallyAdded.push(patternId);
              const activityEntries = pattern.activity || (pattern.activity = []);
              activityEntries.push({
                stage: 'stage-5',
                timestamp: nowIso(),
                summary: `Assigned to cohort ${cohort.id}`
              });
            }
          });
        }

        if (hasMetadataChange) {
          if (cohortOptions.name) {
            cohort.name = cohortOptions.name;
          }
          if (cohortOptions.description) {
            cohort.description = cohortOptions.description;
          }
        }

        if (hasNote) {
          appendCohortNote(cohort, cohortOptions.note);
        }

        const mutated =
          actuallyAdded.length > 0 || actuallyRemoved.length > 0 || hasMetadataChange || hasNote;
        const shouldList =
          cohortOptions.list ||
          (!mutated && !hasAdd && !hasRemove && !hasMetadataChange && !hasNote);

        if (mutated) {
          touchCohort(cohort);
          canonicalizeCohortIds(registry, { touch: false });
          await saveRegistry(registry);
          const addedLabel = actuallyAdded.length ? actuallyAdded.join(', ') : 'none';
          const removedLabel = actuallyRemoved.length ? actuallyRemoved.join(', ') : 'none';
          console.log(`Cohort ${cohort.id} updated (added: ${addedLabel}; removed: ${removedLabel}).`);
        }

        if (shouldList || mutated) {
          printCohortDetails(registry, cohort);
        }
        if (!mutated && !shouldList) {
          console.log('No cohort changes recorded.');
        }

        break;
      }
      case 'pattern-cohort': {
        throwUsageError(
          descriptor,
          'pattern-cohort has been replaced by `cohort`. Run `npm run consolidate -- cohort --help` for the updated workflow.'
        );
        break;
      }
      case 'cohort-stage': {
        canonicalizeCohortIds(registry, { touch: false });
        const cohortOptions = {
          ...options,
          planFiles: Array.isArray(options.planFiles) ? options.planFiles : []
        };
        const cohort = findCohortById(registry, positionals.cohortId);
        if (!cohort) {
          throw new Error(
            `Cohort ${positionals.cohortId} not found. Use 'npm run consolidate -- cohort --all' to inspect available ids.`
          );
        }
        const segmentToken = cohortOptions.segment ? String(cohortOptions.segment).toLowerCase() : null;
        const statusToken = cohortOptions.status ? String(cohortOptions.status).toLowerCase() : null;
        const showOnly = Boolean(cohortOptions.show);
        if (showOnly) {
          const hasMutation =
            statusToken ||
            cohortOptions.planFiles.length > 0 ||
            cohortOptions.clearPlanFiles ||
            cohortOptions.notes ||
            cohortOptions.startedAt ||
            cohortOptions.completedAt;
          if (hasMutation) {
            throwUsageError(descriptor, 'cohort-stage --show cannot be combined with mutation flags.');
          }
          if (segmentToken) {
            printCohortDetails(registry, cohort, { segment: segmentToken });
          } else {
            printCohortDetails(registry, cohort);
          }
          if (!cohort.patterns.length) {
            console.log(
              `Warning: cohort ${cohort.id} has no patterns assigned. Align work on the aggregated cohort instead.`
            );
          }
          break;
        }
        if (!segmentToken) {
          throwUsageError(descriptor, 'cohort-stage requires --segment <value>');
        }
        if (!statusToken) {
          throwUsageError(descriptor, 'cohort-stage requires --status <value>');
        }
        if (!stageStatusMetadata[statusToken]) {
          throwUsageError(descriptor, `cohort-stage: unsupported status ${cohortOptions.status}`);
        }
        if (!cohort.patterns.length) {
          throw new Error(
            `Cohort ${cohort.id} has no patterns assigned. Use the aggregated cohort id when recording Stage 5A.`
          );
        }
        if (cohortOptions.startedAt && Number.isNaN(Date.parse(cohortOptions.startedAt))) {
          throwUsageError(descriptor, 'cohort-stage: --started-at must be a valid ISO8601 timestamp');
        }
        if (cohortOptions.completedAt && Number.isNaN(Date.parse(cohortOptions.completedAt))) {
          throwUsageError(descriptor, 'cohort-stage: --completed-at must be a valid ISO8601 timestamp');
        }
        const planFiles =
          cohortOptions.planFiles.length
            ? normalisePlanFileInputs(cohortOptions.planFiles, descriptor, 'cohort-stage')
            : undefined;
        if (planFiles?.length) {
          const registryConflicts = hasRegistryPlanConflict(
            registry,
            planFiles,
            null,
            `cohort-${cohort.id}-${segmentToken}`
          );
          if (registryConflicts.conflict) {
            console.log(
              `Warning: cohort planned files overlap with in-progress scopes (${registryConflicts.conflicts.join(', ')}). Coordinate before proceeding.`
            );
          }
        }
        const existingEntry = getCohortStageEntry(cohort, segmentToken) || undefined;
        const existingPlanFiles = existingEntry?.plannedFiles || [];
        const nextPlanFiles = cohortOptions.clearPlanFiles
          ? []
          : planFiles !== undefined
          ? planFiles
          : existingPlanFiles;
        if (segmentToken === '5a' && statusToken === 'complete' && nextPlanFiles.length === 0) {
          throw new Error(
            'Stage 5A completion requires at least one alignment spec plan file. Pass --plan-files <path> before marking the segment complete.'
          );
        }
        const { entry, previousStatus } = setCohortStageStatus(cohort, segmentToken, statusToken, {
          notes: cohortOptions.notes,
          planFiles,
          clearPlanFiles: cohortOptions.clearPlanFiles,
          startedAt: cohortOptions.startedAt,
          completedAt: cohortOptions.completedAt
        });
        const durationMessage =
          previousStatus === 'in_progress' && entry.elapsedMs ? formatDuration(entry.elapsedMs) : null;
        const planFilePropagation =
          entry.status === 'complete'
            ? propagateCohortStagePlanFiles(registry, cohort, segmentToken, entry.plannedFiles || [])
            : [];
        touchCohort(cohort);
        await saveRegistry(registry);
        console.log(`Cohort ${cohort.id} segment ${entry.segment} updated to ${entry.status}.`);
        if (durationMessage) {
          console.log(`  Elapsed while in_progress: ${durationMessage}`);
        }
        if (segmentToken === '5a' && entry.status === 'complete') {
          if (planFilePropagation.length) {
            const list = planFilePropagation
              .map((detail) => `${detail.patternId}${detail.name ? ` (${detail.name})` : ''}`)
              .join(', ');
            console.log(
              `  Stage 5 planned files updated for patterns: ${list}. Stage 5B guidance now references the shared alignment spec.`
            );
          } else {
            console.log(
              '  Stage 5 planned files already included the alignment spec. Stage 5B agents will see the shared plan automatically.'
            );
          }
        }
        break;
      }
      case 'schedule': {
        const scheduleOptions = { ...options };
        if (scheduleOptions.format && !['json', 'markdown', 'md'].includes(scheduleOptions.format.toLowerCase())) {
          throwUsageError(descriptor, 'schedule: --format must be json or markdown');
        }
        const patterns =
          typeof scheduleOptions.patternsInput === 'string' && scheduleOptions.patternsInput.trim().length
            ? parsePatternIdList(scheduleOptions.patternsInput)
            : undefined;
        const cohorts = Array.isArray(scheduleOptions.cohorts)
          ? [...new Set(scheduleOptions.cohorts.map((value) => normaliseCohortId(value)))]
          : [];
        const format = scheduleOptions.format ? scheduleOptions.format.toLowerCase() : 'markdown';
        const outputPath = scheduleOptions.output
          ? path.isAbsolute(scheduleOptions.output)
            ? scheduleOptions.output
            : path.join(repoRoot, scheduleOptions.output)
          : undefined;
        const { generateScheduleArtifacts } = await import(scheduleToolsModulePath);
        const artifacts = await generateScheduleArtifacts(registry, {
          patterns,
          cohorts,
          format,
          output: outputPath,
          save: scheduleOptions.save !== undefined ? scheduleOptions.save : true,
          patternsProvided: Array.isArray(patterns),
          cohortsProvided: cohorts.length > 0
        });
        if (artifacts.outputPath) {
          console.log(`Schedule written to ${artifacts.outputPath}`);
        }
        const shouldPrint =
          !artifacts.saved || !artifacts.outputPath || format === 'json' || scheduleOptions.save === false;
        if (shouldPrint && artifacts.rendered) {
          console.log(artifacts.rendered);
        }
        break;
      }
      case 'stage-note': {
        const patternId = positionals.patternId;
        const stageId = normaliseStageId(String(positionals.stageId));
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const noteOptions = options;
        if (!noteOptions.body) {
          throwUsageError(descriptor, 'stage-note requires --body "text"');
        }
        const notes = pattern.notes || (pattern.notes = []);
        const generatedId = noteOptions.id || `stage-${stageId}-note-${nowIso().replace(/[^0-9T]/g, '')}`;
        if (notes.some((note) => note.id === generatedId)) {
          throw new Error(`Note id ${generatedId} already exists for pattern ${patternId}`);
        }
        const newNote = {
          id: generatedId,
          timestamp: nowIso(),
          body: noteOptions.body,
          scope: [`stage-${stageId}`]
        };
        if (noteOptions.agent) {
          newNote.author = noteOptions.agent;
        }
        notes.push(newNote);
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Added stage-${stageId} note ${generatedId} to pattern ${patternId}.`);
        break;
      }
      case 'create-lane': {
        const patternId = positionals.patternId;
        const laneIdToken = positionals.laneId;
        const laneId = String(laneIdToken || '').toLowerCase();
        if (!/^4[a-z]+$/.test(laneId) && !/^6[a-z]+$/.test(laneId)) {
          throwUsageError(
            descriptor,
            'create-lane supports Stage 4 lanes (4a, 4b, …) and Stage 6 lanes (6a, 6b, …); append additional letters as needed.'
          );
        }
        const stageId = laneIdToStage(laneId);
        if (!stageId || (stageId !== '4' && stageId !== '6')) {
          throwUsageError(descriptor, `create-lane only supports Stage 4 or Stage 6 lanes (received ${laneId}).`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const laneMap = pattern.lanes || (pattern.lanes = {});
        if (laneMap[laneId]) {
          throw new Error(`Lane ${laneId} already exists for pattern ${patternId}.`);
        }
        const laneOptions = {
          ...options,
          searchTerms: Array.isArray(options.searchTerms) ? options.searchTerms : []
        };
        const scope = laneOptions.scope?.trim();
        if (!scope) {
          throwUsageError(descriptor, 'create-lane requires --scope "description".');
        }
        const commands = Array.isArray(laneOptions.commands)
          ? [...new Set(laneOptions.commands.filter((entry) => entry && entry.trim()))]
          : [];
        if (!commands.length) {
          throwUsageError(descriptor, 'create-lane requires at least one --command "command to run".');
        }
        const status = (laneOptions.status || 'blocked').toLowerCase();
        if (!laneStatusMetadata[status]) {
          throwUsageError(descriptor, `create-lane: unsupported status ${laneOptions.status}`);
        }
        if (status === 'in_progress') {
          throwUsageError(
            descriptor,
            'create-lane cannot initialise a lane in `in_progress`. Create the lane first, then call `claim` with `--lane`.'
          );
        }
        const dependencyRefs = Array.isArray(laneOptions.dependencyRefs) ? laneOptions.dependencyRefs : [];
        const dependencies = dependencyRefs.length
          ? dedupeDependencyList(dependencyRefs.map((entry) => parseDependencyDescriptor(entry, 'create-lane')))
          : [];
        const planFiles = laneOptions.planFiles?.length
          ? normalisePlanFileInputs(laneOptions.planFiles, descriptor, 'create-lane')
          : [];
        const searchTerms = laneOptions.searchTerms.length
          ? normaliseSearchTermInputs(laneOptions.searchTerms, descriptor, 'create-lane')
          : [];
        const note = laneOptions.note?.trim();

        const laneEntry = {
          status,
          scope,
          commands: commands.map((commandText) => ({ command: commandText })),
          updatedAt: nowIso()
        };
        if (planFiles.length) {
          laneEntry.plannedFiles = planFiles;
        }
        if (searchTerms.length) {
          laneEntry.searchTerms = searchTerms;
        }
        if (dependencies.length) {
          laneEntry.dependencies = dependencies;
        }
        if (note) {
          laneEntry.notes = note;
        }

        laneMap[laneId] = laneEntry;
        registerScopeChange(pattern.patternId, `lane-${laneId}`);
        recomputeStageGateFromLanes(pattern, stageId);

        const activityEntries = pattern.activity || (pattern.activity = []);
        const defaultSummary = `Created lane ${laneId} (${scope})`;
        const activityEntry = {
          stage: `stage-${stageId}`,
          timestamp: nowIso(),
          summary: laneOptions.summary || defaultSummary
        };
        if (laneOptions.agent) {
          activityEntry.agent = laneOptions.agent;
        }
        activityEntries.push(activityEntry);

        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Lane ${laneId} created for pattern ${patternId}.`);
        if (dependencies.length) {
          const dependencyList = dependencies.map((dep) => `${dep.patternId}:${dep.gate}`).join(', ');
          console.log(`Dependencies: ${dependencyList}`);
        }
        printLaneDetail(pattern, laneId, laneEntry);
        if (laneEntry.status === 'blocked') {
          console.log(
            'Auto-blocking: this lane will move to `pending` automatically once its prerequisites are marked `complete`; no manual status update is needed.'
          );
        }
        break;
      }
      case 'remove-lane': {
        const patternId = positionals.patternId;
        const laneIdToken = positionals.laneId;
        const laneId = String(laneIdToken || '').toLowerCase();
        if (!/^4[a-z]+$/.test(laneId) && !/^6[a-z]+$/.test(laneId)) {
          throwUsageError(
            descriptor,
            'remove-lane supports Stage 4 lanes (4a, 4b, …) and Stage 6 lanes (6a, 6b, …); append additional letters as needed.'
          );
        }
        const stageId = laneIdToStage(laneId);
        if (!stageId || (stageId !== '4' && stageId !== '6')) {
          throwUsageError(descriptor, `remove-lane only supports Stage 4 or Stage 6 lanes (received ${laneId}).`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const laneMap = pattern.lanes || {};
        const lane = laneMap[laneId];
        if (!lane) {
          throw new Error(`Lane ${laneId} not found for pattern ${patternId}.`);
        }

        const dependents = findDependentLanes(pattern, laneId);
        const dependentStages = findDependentStages(pattern, laneId);
        const targetGate = `lane-${laneId}`;
        const inProgress = lane.status === 'in_progress';

        if (!options.force) {
          if (inProgress) {
            throw new Error(
              `Lane ${laneId} is currently in_progress; flip it back to pending/blocked (or pass --force) before removing it.`
            );
          }
          if (dependents.length) {
            throw new Error(
              `Lane ${laneId} still has dependant lanes (${dependents.join(
                ', '
              )}). Remove those dependencies first or retry with --force.`
            );
          }
          if (dependentStages.length) {
            throw new Error(
              `Lane ${laneId} is referenced by stage dependencies (${dependentStages
                .map((stageKey) => displayStageLabel(stageKey))
                .join(', ')}). Clear those dependencies or re-run with --force.`
            );
          }
        }

        const clearedLaneDeps = [];
        const clearedStageDeps = [];
        if (options.force) {
          if (dependents.length) {
            dependents.forEach((dependentLaneId) => {
              const dependentLane = pattern.lanes?.[dependentLaneId];
              if (!dependentLane) {
                return;
              }
              const currentDeps = dependentLane.dependencies || [];
              const filtered = currentDeps.filter(
                (dep) => !(dep.patternId === pattern.patternId && dep.gate && dep.gate.toLowerCase() === targetGate)
              );
              if (filtered.length !== currentDeps.length) {
                if (filtered.length) {
                  dependentLane.dependencies = filtered;
                } else {
                  delete dependentLane.dependencies;
                }
                dependentLane.updatedAt = nowIso();
                clearedLaneDeps.push(dependentLaneId);
                registerScopeChange(pattern.patternId, `lane-${dependentLaneId}`);
              }
            });
          }
          if (dependentStages.length) {
            dependentStages.forEach((stageKey) => {
              const gate = pattern.stageGates?.[stageKey];
              if (!gate || !Array.isArray(gate.dependencies) || !gate.dependencies.length) {
                return;
              }
              const filtered = gate.dependencies.filter(
                (dep) => !(dep.patternId === pattern.patternId && dep.gate && dep.gate.toLowerCase() === targetGate)
              );
              if (filtered.length !== gate.dependencies.length) {
                if (filtered.length) {
                  gate.dependencies = filtered;
                } else {
                  delete gate.dependencies;
                }
                clearedStageDeps.push(stageKey);
                registerScopeChange(pattern.patternId, `stage-${stageKey}`);
              }
            });
          }
        }

        let notesRemoved = 0;
        if (options.dropNotes && Array.isArray(pattern.notes) && pattern.notes.length) {
          const before = pattern.notes.length;
          pattern.notes = pattern.notes.filter((note) => {
            const scopeEntries = Array.isArray(note.scope) ? note.scope : [];
            return !scopeEntries.includes(laneId);
          });
          notesRemoved = before - pattern.notes.length;
        }

        delete laneMap[laneId];
        registerScopeChange(pattern.patternId, `lane-${laneId}`);
        recomputeStageGateFromLanes(pattern, stageId);
        recomputePatternStagePointer(pattern);

        const summary = options.summary?.trim() || `Removed lane ${laneId}`;
        const activityEntries = pattern.activity || (pattern.activity = []);
        const activityEntry = {
          stage: `stage-${stageId}`,
          timestamp: nowIso(),
          summary
        };
        if (options.agent) {
          activityEntry.agent = options.agent;
        }
        activityEntries.push(activityEntry);

        touchPattern(pattern);
        await saveRegistry(registry);

        console.log(`Lane ${laneId} removed from pattern ${patternId}.`);
        if (clearedLaneDeps.length) {
          console.log(` Cleared dependencies from lanes: ${clearedLaneDeps.join(', ')}`);
        }
        if (clearedStageDeps.length) {
          const labels = clearedStageDeps.map((stageKey) => displayStageLabel(stageKey));
          console.log(` Cleared stage dependencies: ${labels.join(', ')}`);
        }
        if (notesRemoved > 0) {
          console.log(` Dropped ${notesRemoved} lane note${notesRemoved === 1 ? '' : 's'}.`);
        }
        break;
      }
      case 'update-handoff': {
        const patternId = positionals.patternId;
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const handoffOptions = options;
        const handoff = pattern.handoff || (pattern.handoff = { guardrails: [], sharedFiles: [], acknowledgements: [] });
        handoff.guardrails = Array.isArray(handoff.guardrails) ? [...handoff.guardrails] : [];
        handoff.sharedFiles = Array.isArray(handoff.sharedFiles) ? [...handoff.sharedFiles] : [];
        handoff.acknowledgements = Array.isArray(handoff.acknowledgements) ? [...handoff.acknowledgements] : [];

        const mutationFlagsPresent =
          handoffOptions.addGuardrails?.length ||
          handoffOptions.removeGuardrails?.length ||
          handoffOptions.clearGuardrails ||
          handoffOptions.addFiles?.length ||
          handoffOptions.removeFiles?.length ||
          handoffOptions.clearFiles ||
          handoffOptions.addAcks?.length ||
          handoffOptions.removeAcks?.length ||
          handoffOptions.removeAckAgents?.length ||
          handoffOptions.clearAcks;

        if (handoffOptions.listOnly) {
          if (mutationFlagsPresent) {
            throwUsageError(descriptor, 'update-handoff: --list cannot be combined with mutation flags.');
          }
          printHandoffSummary(pattern, 'Handoff summary:');
          break;
        }

        let changed = false;

        if (handoffOptions.clearGuardrails) {
          if (handoff.guardrails.length) {
            handoff.guardrails = [];
            changed = true;
          }
        }
        const removeGuardrails = (handoffOptions.removeGuardrails || []).map((value) => value - 1);
        if (!handoffOptions.clearGuardrails && removeGuardrails.length) {
          const sorted = [...removeGuardrails].sort((a, b) => b - a);
          sorted.forEach((index) => {
            if (index < 0 || index >= handoff.guardrails.length) {
              throw new Error(`update-handoff: guardrail index ${index + 1} out of range`);
            }
            handoff.guardrails.splice(index, 1);
            changed = true;
          });
        }
        const addGuardrails = (handoffOptions.addGuardrails || []).map((entry) => entry.trim()).filter(Boolean);
        if (addGuardrails.length) {
          handoff.guardrails.push(...addGuardrails);
          changed = true;
        }

        if (handoffOptions.clearFiles) {
          if (handoff.sharedFiles.length) {
            handoff.sharedFiles = [];
            changed = true;
          }
        }
        const removeFiles = (handoffOptions.removeFiles || []).map((value) => value - 1);
        if (!handoffOptions.clearFiles && removeFiles.length) {
          const sorted = [...removeFiles].sort((a, b) => b - a);
          sorted.forEach((index) => {
            if (index < 0 || index >= handoff.sharedFiles.length) {
              throw new Error(`update-handoff: shared file index ${index + 1} out of range`);
            }
            handoff.sharedFiles.splice(index, 1);
            changed = true;
          });
        }
        const addFiles = (handoffOptions.addFiles || []).map((entry) => entry.trim()).filter(Boolean);
        if (addFiles.length) {
          handoff.sharedFiles.push(...addFiles);
          changed = true;
        }

        if (handoffOptions.clearAcks) {
          if (handoff.acknowledgements.length) {
            handoff.acknowledgements = [];
            changed = true;
          }
        }
        const removeAckIndexes = (handoffOptions.removeAcks || []).map((value) => value - 1);
        if (!handoffOptions.clearAcks && removeAckIndexes.length) {
          const sorted = [...removeAckIndexes].sort((a, b) => b - a);
          sorted.forEach((index) => {
            if (index < 0 || index >= handoff.acknowledgements.length) {
              throw new Error(`update-handoff: acknowledgement index ${index + 1} out of range`);
            }
            handoff.acknowledgements.splice(index, 1);
            changed = true;
          });
        }
        const addAcks = (handoffOptions.addAcks || []).map((entry) => {
          const agent = entry.agent?.trim();
          if (!agent) {
            throwUsageError(descriptor, 'update-handoff: --add-ack requires an agent value.');
          }
          const ack = { agent };
          if (entry.note) {
            ack.note = entry.note;
          }
          if (entry.timestamp) {
            const parsedTs = Date.parse(entry.timestamp);
            if (Number.isNaN(parsedTs)) {
              throwUsageError(descriptor, 'update-handoff: --ack-timestamp must be a valid ISO8601 timestamp.');
            }
            ack.timestamp = new Date(parsedTs).toISOString().replace(/\.\d{3}Z$/, 'Z');
          } else {
            ack.timestamp = nowIso();
          }
          return ack;
        });
        if (addAcks.length) {
          handoff.acknowledgements.push(...addAcks);
          changed = true;
        }
        const removeAckAgents = (handoffOptions.removeAckAgents || []).map((entry) => entry.trim()).filter(Boolean);
        if (removeAckAgents.length) {
          removeAckAgents.forEach((agent) => {
            const index = handoff.acknowledgements.findIndex((ack) => ack.agent === agent);
            if (index === -1) {
              throw new Error(`update-handoff: acknowledgement for agent ${agent} not found`);
            }
            handoff.acknowledgements.splice(index, 1);
            changed = true;
          });
        }

        if (!changed) {
          throw new Error('update-handoff: no changes provided');
        }

        pattern.handoff = handoff;
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Updated handoff for pattern ${patternId}.`);
        break;
      }
      case 'append-activity': {
        const patternId = positionals.patternId;
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const activityOptions = options;
        const scopeCandidates = [];
        if (activityOptions.scope) {
          const value = activityOptions.scope.toLowerCase();
          if (!/^stage-[0-9]+$/.test(value) && !/^lane-[0-9]+[a-z]+$/.test(value)) {
            throwUsageError(descriptor, 'append-activity: --scope must reference stage-N or lane-6b.');
          }
          scopeCandidates.push(value);
        }
        if (activityOptions.stage) {
          const stageId = normaliseStageId(activityOptions.stage);
          scopeCandidates.push(`stage-${stageId}`);
        }
        if (activityOptions.lane) {
          const laneId = activityOptions.lane.toLowerCase();
          if (!pattern.lanes || !pattern.lanes[laneId]) {
            throw new Error(`append-activity: lane ${laneId} not found for pattern ${patternId}.`);
          }
          scopeCandidates.push(`lane-${laneId}`);
        }
        if (!scopeCandidates.length) {
          throwUsageError(descriptor, 'append-activity requires --scope, --stage, or --lane to identify the activity target.');
        }
        const uniqueScopes = [...new Set(scopeCandidates)];
        if (uniqueScopes.length > 1) {
          throwUsageError(descriptor, 'append-activity: conflicting scope values provided.');
        }
        const scope = uniqueScopes[0];
        if (scope.startsWith('lane-')) {
          const laneId = scope.slice(5);
          if (!pattern.lanes || !pattern.lanes[laneId]) {
            throw new Error(`append-activity: lane ${laneId} not found for pattern ${patternId}.`);
          }
        }
        const summary = activityOptions.summary?.trim();
        if (!summary) {
          throwUsageError(descriptor, 'append-activity requires --summary "text".');
        }
        let timestamp = activityOptions.timestamp ? activityOptions.timestamp.trim() : nowIso();
        if (activityOptions.timestamp) {
          if (Number.isNaN(Date.parse(activityOptions.timestamp))) {
            throwUsageError(descriptor, 'append-activity: --timestamp must be a valid ISO8601 value.');
          }
          timestamp = new Date(activityOptions.timestamp).toISOString().replace(/\.\d{3}Z$/, 'Z');
        }
        const files = activityOptions.files?.length ? [...new Set(activityOptions.files)] : [];
        const activityEntries = pattern.activity || (pattern.activity = []);
        const entry = {
          stage: scope,
          timestamp,
          summary
        };
        if (activityOptions.agent) {
          entry.agent = activityOptions.agent;
        }
        if (files.length) {
          entry.files = files;
        }
        activityEntries.push(entry);
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Appended activity entry for ${scope} on pattern ${patternId}.`);
        break;
      }
      case 'update-lane': {
        const patternId = positionals.patternId;
        const laneIdToken = positionals.laneId;
        const laneId = String(laneIdToken || '').toLowerCase();
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const lane = pattern.lanes?.[laneId];
        if (!lane) {
          throw new Error(`Lane ${laneId} not found for pattern ${patternId}.`);
        }
        const laneStage = lane.stage || laneIdToStage(laneId);
        const laneOptions = {
          ...options,
          searchTerms: Array.isArray(options.searchTerms) ? options.searchTerms : []
        };
        const statusProvided = Boolean(laneOptions.statusProvided);
        if (statusProvided && !laneOptions.status) {
          throwUsageError(descriptor, 'update-lane --status requires a value.');
        }
        const currentStatus = lane.status || 'pending';
        const requestedStatus = statusProvided
          ? String(laneOptions.status).toLowerCase()
          : currentStatus.toLowerCase();
        if (statusProvided && !laneStatusMetadata[requestedStatus]) {
          throwUsageError(descriptor, `Unsupported lane status: ${laneOptions.status}`);
        }
        if (laneStage === '5' && statusProvided && requestedStatus === 'in_progress') {
          assertStage5Access(registry, pattern);
        }
        if (statusProvided && requestedStatus === 'in_progress' && currentStatus !== 'in_progress') {
          throwUsageError(
            descriptor,
            'update-lane cannot move a lane into `in_progress`. Use `npm run consolidate -- claim <patternId> --lane <laneId>` instead.'
          );
        }

        const planFiles = laneOptions.planFiles?.length
          ? normalisePlanFileInputs(laneOptions.planFiles, descriptor, 'update-lane')
          : undefined;
        if (planFiles?.length) {
          const conflicts = findPlanConflicts(planFiles, collectActivePlanFileMap(pattern, `lane-${laneId}`));
          if (conflicts.conflict) {
            console.log(
              `Warning: planned files overlap with active work scopes (${conflicts.conflicts.join(', ')}). Coordinate before proceeding.`
            );
          }
          const registryConflicts = hasRegistryPlanConflict(registry, planFiles, patternId, `lane-${laneId}`);
          if (registryConflicts.conflict) {
            console.log(
              `Warning: planned files overlap with other in-progress scopes (${registryConflicts.conflicts.join(', ')}). Coordinate before proceeding.`
            );
          }
        }

        let block = Array.isArray(laneOptions.block)
          ? [...new Set(laneOptions.block.map((entry) => entry.toLowerCase()))]
          : [];
        let queue = Array.isArray(laneOptions.queue)
          ? [...new Set(laneOptions.queue.map((entry) => entry.toLowerCase()))]
          : [];
        const files = laneOptions.files?.length ? [...new Set(laneOptions.files)] : [];
        const addDependencies = laneOptions.addDependencyRefs?.length
          ? dedupeDependencyList(
              laneOptions.addDependencyRefs.map((entry) => parseDependencyDescriptor(entry, 'update-lane'))
            )
          : [];
        const removeDependencies = laneOptions.removeDependencyRefs?.length
          ? dedupeDependencyList(
              laneOptions.removeDependencyRefs.map((entry) => parseDependencyDescriptor(entry, 'update-lane'))
            )
          : [];
        const noteText = Array.isArray(laneOptions.notes) ? laneOptions.notes.join('\n') : laneOptions.notes;

        const dependencyChanges = applyDependencyMutations(lane, {
          addDependencies,
          removeDependencies,
          clearDependencies: Boolean(laneOptions.clearDependencies)
        });
        const normalizedSearchTerms = laneOptions.searchTerms.length
          ? normaliseSearchTermInputs(laneOptions.searchTerms, descriptor, 'update-lane')
          : undefined;
        if (normalizedSearchTerms || laneOptions.clearSearchTerms) {
          applySearchTerms(lane, normalizedSearchTerms, Boolean(laneOptions.clearSearchTerms));
        }
        if (
          statusProvided &&
          requestedStatus === 'complete' &&
          (laneStage === '6' || laneStage === '7')
        ) {
          enforceScopeCleanupGuard(pattern, 'lane', laneId, { force: Boolean(laneOptions.force) });
        }

        const hasPlanFileMutation = Boolean(laneOptions.planFiles?.length) || Boolean(laneOptions.clearPlanFiles);
        const hasSearchMutation = Boolean(laneOptions.searchTerms.length) || Boolean(laneOptions.clearSearchTerms);
        const hasDependencyMutation =
          addDependencies.length > 0 || removeDependencies.length > 0 || Boolean(laneOptions.clearDependencies);
        const hasBlockQueueMutation = block.length > 0 || queue.length > 0;
        const hasNotesMutation = Boolean(noteText);
        const hasSummaryMutation = Boolean(laneOptions.summary);
        const hasFilesMutation = files.length > 0;
        const hasAgentMutation = Boolean(laneOptions.agent);
        if (
          !statusProvided &&
          !hasPlanFileMutation &&
          !hasSearchMutation &&
          !hasDependencyMutation &&
          !hasBlockQueueMutation &&
          !hasNotesMutation &&
          !hasSummaryMutation &&
          !hasFilesMutation &&
          !hasAgentMutation
        ) {
          throwUsageError(descriptor, 'update-lane requires --status or another mutation flag.');
        }

        const { durationMs, previousStatus, statusChanged } = setLaneStatus(pattern, laneId, requestedStatus, noteText, {
          planFiles,
          clearPlanFiles: Boolean(laneOptions.clearPlanFiles),
          statusProvided
        });
        let dependencyMutationSummary = null;
        if (dependencyChanges.changed) {
          const parts = [];
          if (dependencyChanges.added.length) {
            parts.push(`+${dependencyChanges.added.map(formatDependencyReference).join(', ')}`);
          }
          if (dependencyChanges.removed.length) {
            parts.push(`-${dependencyChanges.removed.map(formatDependencyReference).join(', ')}`);
          }
          if (laneOptions.clearDependencies && dependencyChanges.removed.length === 0 && dependencyChanges.added.length === 0) {
            parts.push('cleared');
          }
          const summaryBody = parts.length ? parts.join('; ') : 'updated';
          const currentList = dependencyChanges.current.length
            ? dependencyChanges.current.map(formatDependencyReference).join(', ')
            : '(none)';
          console.log(`Lane ${laneId} dependencies updated (${summaryBody}). Current: ${currentList}`);
          dependencyMutationSummary = `${summaryBody} → ${currentList}`;
        }

        let propagationOptions = {
          status: requestedStatus,
          block,
          queue,
          skipPrompt: Boolean(laneOptions.skipPrompt)
        };
        if (statusChanged) {
          if (!propagationOptions.skipPrompt) {
            propagationOptions = await promptPropagationTargets(pattern, laneId, propagationOptions);
          }
        } else {
          propagationOptions.block = [];
          propagationOptions.queue = [];
          propagationOptions.skipPrompt = true;
        }
        block = [...new Set((propagationOptions.block || []).map((entry) => entry.toLowerCase()))];
        queue = [...new Set((propagationOptions.queue || []).map((entry) => entry.toLowerCase()))];

        const propagation = statusChanged
          ? propagateLaneStatuses(pattern, laneId, { ...propagationOptions, status: requestedStatus })
          : { blocked: [], pending: [] };
        let autoPromoted = [];
        if (statusChanged && requestedStatus === 'complete') {
          autoPromoted = promoteDependentLanes(registry, pattern, laneId);
        }

        const stage = laneStage || laneIdToStage(laneId);
        if (stage) {
          recomputeStageGateFromLanes(pattern, stage);
        }

        let laneNextHint = null;
        if (statusChanged && requestedStatus === 'complete') {
          if (stage === '4' || stage === '6') {
            const nextLaneId = findNextAssignableLane(registry, pattern, stage);
            if (nextLaneId && nextLaneId !== laneId) {
              laneNextHint = { type: 'lane', stageId: stage, laneId: nextLaneId };
            } else {
              laneNextHint = findNextWorkTarget(registry, pattern, stage);
            }
          } else if (stage) {
            laneNextHint = findNextWorkTarget(registry, pattern, stage);
          }
        }

        const updatedStatus = lane.status || requestedStatus;
        const activityEntries = pattern.activity || (pattern.activity = []);
        let summaryText;
        if (laneOptions.summary) {
          summaryText = laneOptions.summary;
        } else if (statusProvided) {
          summaryText = statusChanged
            ? `Lane ${laneId} status set to ${requestedStatus}`
            : `Lane ${laneId} status remains ${requestedStatus}`;
        } else {
          summaryText = `Lane ${laneId} metadata updated (status ${updatedStatus})`;
        }
        if (dependencyMutationSummary) {
          const suffix = dependencyMutationSummary.startsWith('cleared') ? dependencyMutationSummary : `deps ${dependencyMutationSummary}`;
          summaryText = laneOptions.summary ? `${summaryText} (${suffix})` : `${summaryText} — ${suffix}`;
        }
        const activityEntry = {
          stage: `lane-${laneId}`,
          timestamp: nowIso(),
          summary: summaryText
        };
        if (laneOptions.agent) {
          activityEntry.agent = laneOptions.agent;
        }
        if (files.length) {
          activityEntry.files = files;
        }
        if (durationMs) {
          activityEntry.durationMs = durationMs;
        }
        activityEntries.push(activityEntry);

        touchPattern(pattern);
        await saveRegistry(registry);

        const messageStatus = statusProvided ? requestedStatus : updatedStatus;
        if (statusProvided) {
          if (statusChanged) {
            console.log(`Lane ${laneId} updated to ${messageStatus}.`);
          } else {
            console.log(`Lane ${laneId} status unchanged (${messageStatus}).`);
          }
        } else {
          console.log(`Lane ${laneId} metadata updated (status ${messageStatus}).`);
        }
        if (durationMs && previousStatus === 'in_progress') {
          const human = formatDuration(durationMs) || `${durationMs}ms`;
          console.log(`  Elapsed while in_progress: ${human}`);
        }
        if (planFiles?.length) {
          console.log(`  Planned files now tracked: ${planFiles.join(', ')}`);
        } else if (laneOptions.clearPlanFiles) {
          console.log('  Planned files cleared.');
        }
        if (propagation.blocked.length) {
          console.log(`Blocked lanes: ${propagation.blocked.join(', ')}`);
        }
        if (propagation.pending.length) {
          console.log(`Pending lanes: ${propagation.pending.join(', ')}`);
        }
        if (autoPromoted.length) {
          console.log(`Auto-unblocked lanes: ${autoPromoted.join(', ')}`);
        }
        if (laneNextHint) {
          printNextWorkHint(patternId, laneNextHint);
        }
        if (statusChanged && requestedStatus === 'blocked' && previousStatus === 'in_progress') {
          console.log(
            `Guidance: Lane ${laneId} paused mid-flight. Log blocker context with \`npm run consolidate -- append-activity ${patternId} --lane ${laneId} --summary "Blocker"\` if you have not already, then rerun \`npm run consolidate -- guide ${patternId} --lane ${laneId}\` before reclaiming once it clears.`
          );
        }
        break;
      }
      case 'status': {
        const patternId = positionals.patternId;
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        printStatus(registry, pattern, registry.updatedAt);
        if (options.notes) {
          listNotes(pattern);
        }
        break;
      }
      case 'notes': {
        const patternId = positionals.patternId;
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        listNotes(pattern);
        break;
      }
      case 'add-note': {
        const patternId = positionals.patternId;
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const noteOptions = options;
        if (!noteOptions.body) {
          throwUsageError(descriptor, 'add-note requires --body "text".');
        }
        const noteList = pattern.notes || (pattern.notes = []);
        const generatedId = noteOptions.id || `note-${nowIso().replace(/[^0-9T]/g, '')}`;
        if (noteList.some((note) => note.id === generatedId)) {
          throw new Error(`Note id ${generatedId} already exists for pattern ${patternId}`);
        }
        const newNote = {
          id: generatedId,
          timestamp: nowIso(),
          body: noteOptions.body
        };
        if (noteOptions.author) {
          newNote.author = noteOptions.author;
        }
        const scopes = Array.isArray(noteOptions.scope)
          ? [...new Set(noteOptions.scope.filter((entry) => entry && entry.trim()))]
          : [];
        if (scopes.length) {
          newNote.scope = scopes;
        }
        noteList.push(newNote);
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Added note ${generatedId} to pattern ${patternId}.`);
        break;
      }
      case 'remove-note': {
        const patternId = positionals.patternId;
        const noteId = positionals.noteId;
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const notes = pattern.notes || [];
        const index = notes.findIndex((note) => note.id === noteId);
        if (index === -1) {
          throw new Error(`Note ${noteId} not found for pattern ${patternId}.`);
        }
        notes.splice(index, 1);
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Removed note ${noteId} from pattern ${patternId}.`);
        break;
      }
      case 'regen': {
        const regenOptions = options;
        const patternIds = Array.isArray(regenOptions.pattern)
          ? regenOptions.pattern
          : regenOptions.pattern !== undefined
          ? [regenOptions.pattern]
          : [];
        const parsedPatternList = regenOptions.patterns ? parsePatternIdList(regenOptions.patterns) : [];
        const patterns = [...new Set([...patternIds, ...parsedPatternList])];

        const cohortList = Array.isArray(regenOptions.cohort) ? regenOptions.cohort : [];
        const cohortsFromCsv = regenOptions.cohorts
          ? regenOptions.cohorts
              .split(',')
              .map((entry) => entry.trim())
              .filter(Boolean)
          : [];
        const cohorts = [...new Set([...cohortList, ...cohortsFromCsv])];

        let includeGlobalSchedule;
        if (regenOptions.noGlobal) {
          includeGlobalSchedule = false;
        } else if (regenOptions.global) {
          includeGlobalSchedule = true;
        }

        let silent;
        if (regenOptions.silent) {
          silent = true;
        } else if (regenOptions.verbose) {
          silent = false;
        }

        await runRegen(registry, {
          checkOnly: Boolean(regenOptions.check),
          forceAll: Boolean(regenOptions.all),
          includeGlobalSchedule,
          patterns,
          cohorts,
          silent
        });
        break;
      }
      case 'sweep': {
        const patternId = positionals.patternId;
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const sweepOptions = options || {};
        const guardScopes = collectSweepScopes(pattern);
        if (sweepOptions.list) {
          const stageList = guardScopes.stages.length ? guardScopes.stages.join(', ') : '(none)';
          const laneList = guardScopes.lanes.length ? guardScopes.lanes.join(', ') : '(none)';
          console.log(`Cleanup guard scopes for pattern ${patternId}:\n  stages: ${stageList}\n  lanes: ${laneList}`);
          if (!sweepOptions.stage && !sweepOptions.lane) {
            break;
          }
        }
        const hasStage = Boolean(sweepOptions.stage);
        const hasLane = Boolean(sweepOptions.lane);
        if ((hasStage ? 1 : 0) + (hasLane ? 1 : 0) !== 1) {
          throwUsageError(descriptor, 'sweep requires exactly one of --stage <id> or --lane <laneId>.');
        }
        if (hasStage) {
          const stageId = normaliseStageId(String(sweepOptions.stage));
          const outcome = runScopeCleanupGuard(pattern, 'stage', stageId);
          if (!outcome.executed) {
            const scopeLabel = formatScopeLabel('stage', stageId);
            if (outcome.reason === 'missing-search-terms') {
              console.log(`No search terms configured for ${scopeLabel} on pattern ${patternId}; nothing to sweep.`);
            } else if (outcome.reason === 'missing-planned-files') {
              console.log(`No planned files recorded for ${scopeLabel} on pattern ${patternId}; nothing to sweep.`);
            } else if (outcome.reason === 'only-gitignored') {
              const detail = formatSampleList(outcome.ignoredFiles);
              console.log(
                `Planned files for ${scopeLabel} on pattern ${patternId} only resolve to paths excluded by repository .gitignore rules${detail}; adjust the planned files before sweeping.`
              );
            } else if (outcome.reason === 'only-excluded-paths') {
              const detail = formatSampleList(outcome.excludedFiles);
              console.log(
                `Planned files for ${scopeLabel} on pattern ${patternId} only resolve to files inside ${consolidationDirectoryLabel}${detail}; adjust the planned files before sweeping.`
              );
            } else if (outcome.reason === 'only-excluded-and-gitignored') {
              const excludedDetail = formatSampleList(outcome.excludedFiles);
              const ignoredDetail = formatSampleList(outcome.ignoredFiles);
              console.log(
                `Planned files for ${scopeLabel} on pattern ${patternId} only resolve to files inside ${consolidationDirectoryLabel}${excludedDetail} or to paths excluded by repository .gitignore rules${ignoredDetail}; adjust the planned files before sweeping.`
              );
            } else if (outcome.reason === 'no-files-resolved') {
              console.log(
                `Planned files for ${scopeLabel} on pattern ${patternId} resolved to no non-markdown files; nothing to sweep.`
              );
            }
            break;
          }
          const scopeLabel = formatScopeLabel('stage', stageId);
          if (!outcome.matches.length) {
            console.log(buildGuardSuccessMessage(patternId, scopeLabel, outcome));
          } else {
            console.log(buildGuardFailureMessage(patternId, 'stage', scopeLabel, outcome, false));
            process.exitCode = 1;
          }
          break;
        }
        const laneId = String(sweepOptions.lane).toLowerCase();
        if (!pattern.lanes || !pattern.lanes[laneId]) {
          console.log(`Lane ${laneId} is not present on pattern ${patternId}.`);
          process.exitCode = 1;
          break;
        }
        const outcome = runScopeCleanupGuard(pattern, 'lane', laneId);
        if (!outcome.executed) {
          const scopeLabel = formatScopeLabel('lane', laneId);
          if (outcome.reason === 'missing-search-terms') {
            console.log(`No search terms configured for ${scopeLabel} on pattern ${patternId}; nothing to sweep.`);
          } else if (outcome.reason === 'missing-planned-files') {
            console.log(`No planned files recorded for ${scopeLabel} on pattern ${patternId}; nothing to sweep.`);
          } else if (outcome.reason === 'only-gitignored') {
            const detail = formatSampleList(outcome.ignoredFiles);
            console.log(
              `Planned files for ${scopeLabel} on pattern ${patternId} only resolve to paths excluded by repository .gitignore rules${detail}; adjust the planned files before sweeping.`
            );
          } else if (outcome.reason === 'only-excluded-paths') {
            const detail = formatSampleList(outcome.excludedFiles);
            console.log(
              `Planned files for ${scopeLabel} on pattern ${patternId} only resolve to files inside ${consolidationDirectoryLabel}${detail}; adjust the planned files before sweeping.`
            );
          } else if (outcome.reason === 'only-excluded-and-gitignored') {
            const excludedDetail = formatSampleList(outcome.excludedFiles);
            const ignoredDetail = formatSampleList(outcome.ignoredFiles);
            console.log(
              `Planned files for ${scopeLabel} on pattern ${patternId} only resolve to files inside ${consolidationDirectoryLabel}${excludedDetail} or to paths excluded by repository .gitignore rules${ignoredDetail}; adjust the planned files before sweeping.`
            );
          } else if (outcome.reason === 'no-files-resolved') {
            console.log(
              `Planned files for ${scopeLabel} on pattern ${patternId} resolved to no non-markdown files; nothing to sweep.`
            );
          }
        } else {
          const scopeLabel = formatScopeLabel('lane', laneId);
          if (!outcome.matches.length) {
            console.log(buildGuardSuccessMessage(patternId, scopeLabel, outcome));
          } else {
            console.log(buildGuardFailureMessage(patternId, 'lane', scopeLabel, outcome, false));
            process.exitCode = 1;
          }
        }
        break;
      }
      case 'help':
      case '--help':
      case '-h': {
        const target = positionals.command;
        if (!target) {
          console.log(formatGlobalHelp());
          break;
        }
        const targetDescriptor = resolveDescriptor(target);
        if (!targetDescriptor) {
          console.log(formatGlobalHelp());
          console.log(`\\nUnknown command: ${target}`);
        } else {
          console.log(formatCommandUsage(targetDescriptor));
        }
        break;
      }
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

main();

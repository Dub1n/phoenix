import fs from 'node:fs';
import path from 'path';
import process from 'process';
import os from 'node:os';
import { fileURLToPath } from 'url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.resolve(moduleDir, '..');
const cliConfigPath = path.join(scriptsDir, 'config/consolidation-cli.config.json');

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

function expandHomePath(value) {
  if (typeof value !== 'string') {
    return value;
  }
  if (value === '~') {
    return os.homedir();
  }
  if (value.startsWith('~/')) {
    return path.join(os.homedir(), value.slice(2));
  }
  return value;
}

function resolvePathInput(rawValue, baseDir) {
  if (typeof rawValue !== 'string') {
    return null;
  }
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }
  const expanded = expandHomePath(trimmed);
  if (path.isAbsolute(expanded)) {
    return path.normalize(expanded);
  }
  return path.resolve(baseDir, expanded);
}

function ensureDirectory(label, target) {
  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    throw new Error(`${label} directory "${target}" does not exist.`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`${label} path "${target}" is not a directory.`);
  }
}

function loadCliConfig(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read consolidation CLI config: ${error.message || error}`);
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return {};
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Config must be a JSON object.');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse consolidation CLI config: ${error.message || error}`);
  }
}

const templumRoot = resolveRepoRoot(scriptsDir);
const cliConfig = loadCliConfig(cliConfigPath);

const repoRoot = (() => {
  const envOverride = resolvePathInput(process.env.CONSOLIDATION_REPO_ROOT, templumRoot);
  if (envOverride) {
    ensureDirectory('CONSOLIDATION_REPO_ROOT', envOverride);
    return envOverride;
  }
  const configRoot = resolvePathInput(cliConfig.root, templumRoot);
  if (configRoot) {
    ensureDirectory('consolidation CLI config root', configRoot);
    return configRoot;
  }
  return templumRoot;
})();

function resolveRepoPath(value) {
  return resolvePathInput(value, repoRoot);
}

const configPaths = cliConfig.paths && typeof cliConfig.paths === 'object' && !Array.isArray(cliConfig.paths)
  ? cliConfig.paths
  : {};

const PATH_DEFAULTS = {
  plansDir: { base: 'templum', path: path.join('dev', 'architecture', 'plans') },
  schedulesDir: { base: 'templum', path: path.join('dev', 'architecture', 'schedules') },
  activityLog: {
    base: 'templum',
    path: path.join('dev', 'architecture', 'utility-consolidation-activity-log.generated.md')
  },
  registryStatus: { base: 'scripts', path: 'registry-status.generated.md' }
};

function resolveDefaultPath(definition) {
  switch (definition.base) {
    case 'templum':
      return path.resolve(templumRoot, definition.path);
    case 'scripts':
      return path.resolve(scriptsDir, definition.path);
    case 'root':
      return path.resolve(repoRoot, definition.path);
    default:
      throw new Error(`Unknown default path base "${definition.base}" for consolidation CLI configuration.`);
  }
}

const cliPaths = Object.freeze(
  Object.fromEntries(
    Object.entries(PATH_DEFAULTS).map(([key, definition]) => {
      const override = resolveRepoPath(configPaths[key]);
      const resolved = override || resolveDefaultPath(definition);
      return [key, resolved];
    })
  )
);

const registryPath = (() => {
  const envOverride = resolvePathInput(process.env.CONSOLIDATION_STATE_PATH, process.cwd());
  if (envOverride) {
    return envOverride;
  }
  const configOverride = resolveRepoPath(configPaths.registryState);
  if (configOverride) {
    return configOverride;
  }
  return path.join(scriptsDir, 'config/consolidation-state.json');
})();

const schemaPath = path.join(scriptsDir, 'config/consolidation-state.schema.json');
const scheduleModulePath = path.join(scriptsDir, 'generate-schedule.mjs');
const scheduleToolsModulePath = path.join(scriptsDir, 'schedule-tools.mjs');

const consolidationScriptsRelativePath = (() => {
  const relative = path.relative(repoRoot, scriptsDir);
  if (!relative || relative === '.') {
    return '';
  }
  return relative.split(path.sep).join('/');
})();

const consolidationDirectoryLabel =
  consolidationScriptsRelativePath || '(consolidation CLI directory)';

function normaliseSymbol(value) {
  if (!value) {
    return '';
  }
  return String(value)
    .trim()
    .replace(/^\.\/+/, '')
    .toLowerCase();
}

function stripExtensions(value) {
  let target = value;
  if (target.endsWith('.json')) {
    target = target.slice(0, -5);
    return { core: target, format: 'json' };
  }
  if (target.endsWith('.markdown')) {
    target = target.slice(0, -9);
    return { core: target, format: 'markdown' };
  }
  if (target.endsWith('.md')) {
    target = target.slice(0, -3);
    return { core: target, format: 'markdown' };
  }
  return { core: target, format: null };
}

function stripGeneratedSuffix(value) {
  const suffixes = ['.generated', '_generated', '-generated'];
  for (const suffix of suffixes) {
    if (value.endsWith(suffix)) {
      return value.slice(0, -suffix.length);
    }
  }
  return value;
}

function normaliseToken(value) {
  const normalised = normaliseSymbol(value);
  if (!normalised) {
    return { token: '', format: null };
  }
  const basename = path.basename(normalised);
  const { core, format } = stripExtensions(basename);
  const withoutGenerated = stripGeneratedSuffix(core);
  const collapsed = withoutGenerated.replace(/[\s._-]+/g, '-');
  return { token: collapsed, format };
}

function parseGeneratedArtifactSpec(entry) {
  if (typeof entry !== 'string') {
    return { keys: [], error: 'Entries must be strings.' };
  }
  const trimmed = entry.trim();
  if (!trimmed) {
    return { keys: [], error: 'Entries must not be empty.' };
  }
  const { token, format } = normaliseToken(trimmed);
  if (!token) {
    return { keys: [], error: `Unable to interpret "${entry}".` };
  }

  const keys = [];
  const genericSchedules = new Set(['schedule', 'schedules']);
  const genericPlans = new Set(['plan', 'plans']);
  const genericCohorts = new Set(['cohort', 'cohorts', 'schedule-cohort', 'schedule-cohorts']);
  const genericTracker = new Set(['registry-status', 'registrystatus', 'tracker', 'registry']);
  const genericActivity = new Set([
    'activity',
    'activitylog',
    'activity-log',
    'utility-consolidation-activity-log',
    'utility-consolidation-activity'
  ]);
  const wildcardTokens = new Set(['*', 'all-files', 'everything']);

  if (wildcardTokens.has(token)) {
    return { keys: ['*'], error: null };
  }
  if (genericPlans.has(token)) {
    return { keys: ['plan'], error: null };
  }
  if (genericSchedules.has(token)) {
    return { keys: ['schedule'], error: null };
  }
  if (genericCohorts.has(token)) {
    return { keys: ['schedule:cohort'], error: null };
  }
  if (genericTracker.has(token)) {
    return { keys: ['registry-status'], error: null };
  }
  if (genericActivity.has(token)) {
    return { keys: ['activity'], error: null };
  }

  if (/^pattern-(\d+)$/.test(token)) {
    const match = token.match(/^pattern-(\d+)$/);
    return { keys: [`plan:${match[1]}`], error: null };
  }
  if (/^\d+$/.test(token)) {
    return { keys: [`plan:${token}`], error: null };
  }
  if (/^schedule-all$/.test(token) || /^scheduleall$/.test(token) || token === 'global' || token === 'all') {
    if (format) {
      return { keys: [`schedule:all:${format}`], error: null };
    }
    return { keys: ['schedule:all'], error: null };
  }
  if (/^schedule-(.+)$/.test(token)) {
    const match = token.match(/^schedule-(.+)$/);
    const scope = match[1];
    if (scope === 'all') {
      if (format) {
        return { keys: [`schedule:all:${format}`], error: null };
      }
      return { keys: ['schedule:all'], error: null };
    }
    const cohortId = scope.toLowerCase();
    if (format) {
      return { keys: [`schedule:cohort:${cohortId}:${format}`], error: null };
    }
    return { keys: [`schedule:cohort:${cohortId}`], error: null };
  }
  if (/^cohort-(.+)$/.test(token)) {
    const match = token.match(/^cohort-(.+)$/);
    const cohortId = match[1].toLowerCase();
    if (format) {
      return { keys: [`schedule:cohort:${cohortId}:${format}`], error: null };
    }
    return { keys: [`schedule:cohort:${cohortId}`], error: null };
  }
  if (/^[a-z0-9]+$/.test(token) && !/^\d+$/.test(token)) {
    const cohortId = token.toLowerCase();
    if (format) {
      return { keys: [`schedule:cohort:${cohortId}:${format}`], error: null };
    }
    return { keys: [`schedule:cohort:${cohortId}`], error: null };
  }
  if (/^registry-status(?:-generated)?$/.test(token)) {
    return { keys: ['registry-status'], error: null };
  }
  if (/^utility-consolidation-activity-log(?:-generated)?$/.test(token)) {
    return { keys: ['activity'], error: null };
  }

  return { keys: [], error: `Unknown generatedArtifacts entry "${entry}".` };
}

function compileArtifactFilter(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return () => true;
  }
  const include = new Set();
  let allowAll = false;
  entries.forEach((entry) => {
    const { keys, error } = parseGeneratedArtifactSpec(entry);
    if (error) {
      throw new Error(error);
    }
    keys.forEach((key) => {
      if (key === '*') {
        allowAll = true;
      } else {
        include.add(key);
      }
    });
  });
  if (allowAll) {
    return () => true;
  }
  return (descriptor) => {
    if (!descriptor || typeof descriptor !== 'object') {
      return true;
    }
    const keys = [];
    switch (descriptor.type) {
      case 'plan': {
        const patternId = descriptor.patternId !== undefined ? String(descriptor.patternId) : '';
        keys.push(`plan:${patternId}`, 'plan');
        break;
      }
      case 'schedule': {
        const scope =
          descriptor.scope === 'all'
            ? 'all'
            : descriptor.scope !== undefined && descriptor.scope !== null
              ? String(descriptor.scope).toLowerCase()
              : '';
        const format = descriptor.format === 'json' ? 'json' : 'markdown';
        if (scope === 'all') {
          keys.push(`schedule:all:${format}`, 'schedule:all', 'schedule');
        } else if (scope) {
          keys.push(
            `schedule:cohort:${scope}:${format}`,
            `schedule:cohort:${scope}`,
            'schedule:cohort',
            'schedule'
          );
        } else {
          keys.push('schedule');
        }
        break;
      }
      case 'activity':
        keys.push('activity');
        break;
      case 'registry-status':
        keys.push('registry-status');
        break;
      default:
        keys.push(descriptor.type);
        break;
    }
    return keys.some((key) => include.has(key));
  };
}

const generatedArtifactEntries = Array.isArray(cliConfig.generatedArtifacts)
  ? cliConfig.generatedArtifacts
  : [];
const shouldGenerateArtifact = compileArtifactFilter(generatedArtifactEntries);

export {
  cliConfig,
  cliPaths,
  consolidationDirectoryLabel,
  consolidationScriptsRelativePath,
  registryPath,
  repoRoot,
  resolveRepoPath,
  resolveRepoRoot,
  scheduleModulePath,
  scheduleToolsModulePath,
  schemaPath,
  scriptsDir,
  shouldGenerateArtifact,
  templumRoot
};

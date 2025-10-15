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
  templumRoot
};

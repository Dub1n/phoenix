import fs from 'node:fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.resolve(moduleDir, '..');

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

const repoRoot = (() => {
  const override = process.env.CONSOLIDATION_REPO_ROOT;
  if (override) {
    return path.resolve(override);
  }
  return resolveRepoRoot(scriptsDir);
})();

const registryPath =
  process.env.CONSOLIDATION_STATE_PATH || path.join(scriptsDir, 'config/consolidation-state.json');
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
  consolidationDirectoryLabel,
  consolidationScriptsRelativePath,
  registryPath,
  repoRoot,
  resolveRepoRoot,
  scheduleModulePath,
  scheduleToolsModulePath,
  schemaPath,
  scriptsDir
};

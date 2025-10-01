#!/usr/bin/env node

/**
 * Phase 6 dual-run automation.
 * Executes the mock-backed validation by default and optionally the real-backend
 * variant when PHASE6_RUN_REAL=1 or --real is supplied.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const cliEntry = path.resolve(__dirname, '../dist/src/scripts/run-phase6-integration-validation.js');

const run = (command, args, extraEnv = {}) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const shouldSkipBuild = process.argv.includes('--no-build') || process.env.PHASE6_SKIP_BUILD === '1';
const shouldRunReal =
  process.env.PHASE6_RUN_REAL === '1' ||
  process.argv.includes('--real') ||
  process.argv.includes('--with-real');

if (!shouldSkipBuild) {
  run(npmCmd, ['run', 'build']);
}

run('node', [cliEntry, 'run']);

if (shouldRunReal) {
  console.log('\n🔁 Running Phase 6 validation against real backend services...');
  run('node', [cliEntry, 'run', '--use-real-backends'], {
    PHASE6_USE_REAL_BACKENDS: '1',
    PHASE6_SKIP_HARUSPEX: '0',
  });
} else {
  console.log('\nℹ️ Skipping real backend run (set PHASE6_RUN_REAL=1 or pass --real to enable).');
}


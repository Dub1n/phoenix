#!/usr/bin/env node

/**
 * Phase 6 dual-run automation.
 * Executes the mock-backed validation by default and optionally the real-backend
 * variant when PHASE6_RUN_REAL=1 or --real is supplied.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const { createScriptRuntime } = require('./utils/script-runtime');

const runtime = createScriptRuntime('scripts:run-phase6-full');

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
    const details = {
      command,
      args,
      status: result.status,
      signal: result.signal,
    };
    const error =
      result.error ??
      new Error(
        `Command ${command} ${args.join(' ')} exited with status ${result.status ?? 'unknown'}`
      );
    runtime.exitWithError(error, 'scripts:run-phase6-full.spawn', details);
    throw error;
  }
};

const shouldSkipBuild = process.argv.includes('--no-build') || process.env.PHASE6_SKIP_BUILD === '1';
const shouldRunReal =
  process.env.PHASE6_RUN_REAL === '1' ||
  process.argv.includes('--real') ||
  process.argv.includes('--with-real');

const main = () => {
  try {
    if (!shouldSkipBuild) {
      run(npmCmd, ['run', 'build']);
    }

    run('node', [cliEntry, 'run']);

    if (shouldRunReal) {
      runtime.logger.info('Running Phase 6 validation against real backend services', {
        context: 'phase6-full-script',
        action: 'start-real-backend-run'
      });
      run('node', [cliEntry, 'run', '--use-real-backends'], {
        PHASE6_USE_REAL_BACKENDS: '1',
        PHASE6_SKIP_HARUSPEX: '0',
      });
    } else {
      runtime.logger.info('Skipping real backend run; enable with PHASE6_RUN_REAL=1 or --real', {
        context: 'phase6-full-script',
        action: 'skip-real-backend-run'
      });
    }

    runtime.setExitCode(0);
  } catch (error) {
    runtime.exitWithError(error, 'scripts:run-phase6-full.main');
  }
};

if (require.main === module) {
  main();
}

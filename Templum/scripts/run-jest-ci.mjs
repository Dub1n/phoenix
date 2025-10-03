#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jestBin = require.resolve('jest/bin/jest');

const passthroughArgs = process.argv.slice(2);
const baseArgs = ['--runInBand', '--detectOpenHandles', '--forceExit', ...passthroughArgs];

const child = spawn(process.execPath, [jestBin, ...baseArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
    CI: '1',
    JEST_FORCE_EXIT: '1'
  }
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('[run-jest-ci] Failed to launch Jest:', error);
  process.exit(1);
});

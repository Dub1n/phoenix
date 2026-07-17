#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { resolveArchiveLogPath } from './utils/archive-log-path.mjs';

const require = createRequire(import.meta.url);
const { createScriptRuntime } = require('./utils/script-runtime.js');
const runtime = createScriptRuntime('scripts:run-with-timeout');

let createTimeout;
let createInterval;

const loadAsyncUtils = () => {
  try {
    return require('../dist/src/utils/async-utils.js');
  } catch (error) {
    runtime.handleError(error, 'scripts:run-with-timeout.load-async-utils');
    const message =
      'Managed timer utilities not available. Run `npm run build` to generate dist/src/utils/async-utils.js before executing scripts/run-with-timeout.mjs.';
    throw new Error(
      `${message}\nUnderlying error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

({ createTimeout, createInterval } = loadAsyncUtils());

const args = process.argv.slice(2);

try {

const presetPatternMap = new Map([
  ['jest-ci', ['✅ Overall: PASSED']],
  ['jest-suite', ['Ran all test suites.']],
  ['phase6-validation', ['Phase6IntegrationValidationSuite: Validation complete.']],
  ['phase6-health', ['Overall System Health: ✅ HEALTHY']]
]);

const usage = `Usage:\n  node scripts/run-with-timeout.mjs [options] -- <command> [args...]\n\nOptions:\n  --timeout <ms>        Maximum runtime before sending SIGTERM (default 30000).\n  --kill-after <ms>     Grace period after SIGTERM before SIGKILL (default 5000).\n  --signal <name>       Signal to send at timeout (default SIGTERM).\n  --cwd <path>          Working directory for the spawned process.\n  --log-file <path>     Append output below any archive/ directory in this monorepo.\n  --heartbeat <ms>      Log a heartbeat every N ms (requires --log-file for file output).\n  --exit-on-pattern <p> Terminate early once stdout/stderr contains the pattern.\n  --preset <name>       Shorthand for predefined exit pattern sets (e.g. jest-ci).\n`;

if (args.length === 0) {
  throw new Error(usage);
}

const separatorIndex = args.indexOf('--');
if (separatorIndex === -1 || separatorIndex === args.length - 1) {
  throw new Error(`Error: specify a command after \`--\`.\n\n${usage}`);
}

const optionArgs = args.slice(0, separatorIndex);
const commandArgs = args.slice(separatorIndex + 1);

let timeoutMs = 30000;
let killAfterMs = 5000;
let timeoutSignal = 'SIGTERM';
let spawnCwd = process.cwd();
let logFilePath;
let heartbeatMs = 0;
const exitPatterns = [];

for (let i = 0; i < optionArgs.length; i += 1) {
  const option = optionArgs[i];
  switch (option) {
    case '--timeout':
      i += 1;
      timeoutMs = Number(optionArgs[i]);
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        throw new Error('Invalid --timeout value; provide a positive number of milliseconds.');
      }
      break;
    case '--kill-after':
      i += 1;
      killAfterMs = Number(optionArgs[i]);
      if (!Number.isFinite(killAfterMs) || killAfterMs < 0) {
        throw new Error('Error: --kill-after must be a non-negative number of milliseconds.');
      }
      break;
    case '--signal':
      i += 1;
      timeoutSignal = optionArgs[i];
      if (typeof timeoutSignal !== 'string' || timeoutSignal.length === 0) {
        throw new Error('Error: --signal must be a valid signal name.');
      }
      break;
    case '--cwd':
      i += 1;
      spawnCwd = optionArgs[i] ?? spawnCwd;
      break;
    case '--log-file':
      i += 1;
      logFilePath = optionArgs[i];
      if (typeof logFilePath !== 'string' || logFilePath.length === 0) {
        throw new Error('Error: --log-file requires a file path.');
      }
      break;
    case '--heartbeat':
      i += 1;
      heartbeatMs = Number(optionArgs[i]);
      if (!Number.isFinite(heartbeatMs) || heartbeatMs <= 0) {
        throw new Error('Error: --heartbeat must be a positive number of milliseconds.');
      }
      break;
    case '--exit-on-pattern':
      i += 1;
      if (typeof optionArgs[i] !== 'string' || optionArgs[i].length === 0) {
        throw new Error('Error: --exit-on-pattern requires a non-empty pattern string.');
      }
      exitPatterns.push(optionArgs[i]);
      break;
    case '--preset':
      i += 1;
      if (typeof optionArgs[i] !== 'string' || optionArgs[i].length === 0) {
        throw new Error('Error: --preset requires a preset name.');
      }
      {
        const preset = presetPatternMap.get(optionArgs[i]);
        if (!preset) {
          throw new Error(
            `Error: unknown preset "${optionArgs[i]}". Available presets: ${
              Array.from(presetPatternMap.keys()).join(', ') || '(none)'
            }.`
          );
        }
        exitPatterns.push(...preset);
      }
      break;
    default:
      throw new Error(`Error: Unknown option ${option}\n\n${usage}`);
  }
}

const [command, ...commandRest] = commandArgs;

if (!command) {
  throw new Error(`Error: missing command to execute.\n\n${usage}`);
}

const isPosix = process.platform !== 'win32';
const startTime = Date.now();

let logStream;
if (logFilePath) {
  try {
    logFilePath = resolveArchiveLogPath(logFilePath);
    mkdirSync(path.dirname(logFilePath), { recursive: true });
    logStream = createWriteStream(logFilePath, { flags: 'a' });
  } catch (error) {
    runtime.handleError(error, 'scripts:run-with-timeout.open-log', { logFilePath });
    throw new Error(
      `Error: unable to open log file '${logFilePath}': ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

const formatTime = () => `+${(Date.now() - startTime).toString().padStart(5, ' ')}ms`;

const logLine = (message, level = 'info') => {
  const line = `[run-with-timeout] [${new Date().toISOString()}] ${formatTime()} ${message}`;
  if (level === 'error') {
    console.warn(line);
  } else {
    console.log(line);
  }
  if (logStream) {
    logStream.write(line + '\n');
  }
};

const finish = (code = 0) => {
  runtime.setExitCode(code);
  if (logStream) {
    logStream.end();
  }
};

const captureOutput = Boolean(logStream || exitPatterns.length > 0);
const stdioOption = captureOutput ? ['inherit', 'pipe', 'pipe'] : 'inherit';

const child = spawn(command, commandRest, {
  cwd: spawnCwd,
  stdio: stdioOption,
  env: { ...process.env },
  detached: isPosix
});

let completed = false;
let terminationRequested = false;

logLine(`Spawned PID ${child.pid} with timeout ${timeoutMs}ms (kill-after ${killAfterMs}ms).`);

let stdoutBuffer = '';
let stderrBuffer = '';
const maxPatternBuffer = 4096;
let patternTerminationIssued = false;

const maybeTruncateBuffer = (buffer) => {
  if (buffer.length <= maxPatternBuffer) {
    return buffer;
  }
  return buffer.slice(buffer.length - maxPatternBuffer);
};

const handlePatternDetection = (source, buffer) => {
  if (patternTerminationIssued || exitPatterns.length === 0) {
    return;
  }
  const matchedPattern = exitPatterns.find((pattern) => buffer.includes(pattern));
  if (!matchedPattern) {
    return;
  }
  patternTerminationIssued = true;
  initiateTermination(`Pattern "${matchedPattern}" detected on ${source}.`, timeoutSignal);
};

if (captureOutput && child.stdout) {
  child.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    if (logStream) {
      logStream.write(chunk);
    }
    stdoutBuffer = maybeTruncateBuffer(stdoutBuffer + chunk.toString());
    handlePatternDetection('stdout', stdoutBuffer);
  });
}

if (captureOutput && child.stderr) {
  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
    if (logStream) {
      logStream.write(chunk);
    }
    stderrBuffer = maybeTruncateBuffer(stderrBuffer + chunk.toString());
    handlePatternDetection('stderr', stderrBuffer);
  });
}

let heartbeatHandle;
let killAfterGuard = null;
let timeoutHandle;
if (heartbeatMs > 0) {
  heartbeatHandle = createInterval(
    () => {
      if (!completed) {
        logLine(`Heartbeat: child ${child.pid} still running.`, 'info');
      } else {
        heartbeatHandle?.stop();
        heartbeatHandle = undefined;
      }
    },
    heartbeatMs,
    { unref: true }
  );
}

const sendSignal = (signal) => {
  if (!child.pid) {
    return;
  }

  try {
    if (isPosix) {
      process.kill(-child.pid, signal);
    } else {
      child.kill(signal);
    }
  } catch (error) {
    if ((error)?.code !== 'ESRCH') {
      logLine(`Failed to send ${signal} to PID ${child.pid}: ${error.message}`, 'error');
    }
  }
};

const initiateTermination = (reason, signal = timeoutSignal) => {
  if (completed) {
    return;
  }
  const terminationAlreadyRequested = terminationRequested;
  terminationRequested = true;
  timeoutHandle?.cancel?.();
  if (!terminationAlreadyRequested) {
    logLine(`${reason} Sending ${signal} to PID ${child.pid}.`);
  } else {
    logLine(`${reason} Ensuring signal ${signal} reaches PID ${child.pid}.`);
  }
  sendSignal(signal);
  if (killAfterMs > 0 && !killAfterGuard) {
    killAfterGuard = createTimeout(
      () => {
        if (!completed) {
          logLine(`Process ${child.pid} still running. Sending SIGKILL.`, 'error');
          sendSignal('SIGKILL');
        }
      },
      killAfterMs,
      { unref: true }
    );
  }
};

timeoutHandle = createTimeout(
  () => initiateTermination(`Timeout reached (${timeoutMs}ms).`, timeoutSignal),
  timeoutMs,
  { unref: true }
);

child.on('exit', (code, signal) => {
  completed = true;
  timeoutHandle.cancel?.();
  heartbeatHandle?.stop?.();
  heartbeatHandle = undefined;
  killAfterGuard?.cancel?.();
  killAfterGuard = null;
  if (signal) {
    logLine(`Process exited due to signal ${signal}.`, 'error');
    finish(1);
    return;
  }
  logLine(`Process exited with code ${code ?? 0}.`, code === 0 ? 'info' : 'error');
  finish(code ?? 0);
});

child.on('error', (error) => {
  completed = true;
  timeoutHandle.cancel?.();
  heartbeatHandle?.stop?.();
  heartbeatHandle = undefined;
  killAfterGuard?.cancel?.();
  killAfterGuard = null;
  runtime.handleError(error, 'scripts:run-with-timeout.child-error', {
    command,
    args: commandRest,
  });
  logLine(`Failed to start command: ${error.message}`, 'error');
  finish(1);
});

const forwardSignal = (sig) => {
  if (completed) {
    return;
  }
  sendSignal(sig);
};

process.on('SIGINT', forwardSignal);
process.on('SIGTERM', forwardSignal);
process.on('exit', () => {
  if (!completed && terminationRequested) {
    sendSignal('SIGKILL');
  } else if (!completed) {
    sendSignal('SIGTERM');
  }
});
} catch (error) {
  runtime.exitWithError(error, 'scripts:run-with-timeout.main', { argv: args });
  console.log(error instanceof Error ? error.message : String(error));
}

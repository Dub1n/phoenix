#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let createTimeout;
let createInterval;

try {
  ({ createTimeout, createInterval } = require('../dist/src/utils/async-utils.js'));
} catch (error) {
  const message =
    'Managed timer utilities not available. Run `npm run build` to generate dist/src/utils/async-utils.js before executing scripts/run-with-timeout.mjs.';
  console.error(message);
  console.error('Underlying error:', error instanceof Error ? error.message : error);
  process.exit(1);
}

const args = process.argv.slice(2);

const presetPatternMap = new Map([
  ['jest-ci', ['✅ Overall: PASSED']],
  ['jest-suite', ['Ran all test suites.']],
  ['phase6-validation', ['Phase6IntegrationValidationSuite: Validation complete.']],
  ['phase6-health', ['Overall System Health: ✅ HEALTHY']]
]);

const usage = `Usage:\n  node scripts/run-with-timeout.mjs [options] -- <command> [args...]\n\nOptions:\n  --timeout <ms>        Maximum runtime before sending SIGTERM (default 30000).\n  --kill-after <ms>     Grace period after SIGTERM before SIGKILL (default 5000).\n  --signal <name>       Signal to send at timeout (default SIGTERM).\n  --cwd <path>          Working directory for the spawned process.\n  --log-file <path>     Append diagnostic output to the given file.\n  --heartbeat <ms>      Log a heartbeat every N ms (requires --log-file for file output).\n  --exit-on-pattern <p> Terminate early once stdout/stderr contains the pattern.\n  --preset <name>       Shorthand for predefined exit pattern sets (e.g. jest-ci).\n`;

if (args.length === 0) {
  console.error(usage);
  process.exit(1);
}

const separatorIndex = args.indexOf('--');
if (separatorIndex === -1 || separatorIndex === args.length - 1) {
  console.error('Error: specify a command after `--`.');
  console.error('\n' + usage);
  process.exit(1);
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
        console.error('Error: --timeout must be a positive number of milliseconds.');
        process.exit(1);
      }
      break;
    case '--kill-after':
      i += 1;
      killAfterMs = Number(optionArgs[i]);
      if (!Number.isFinite(killAfterMs) || killAfterMs < 0) {
        console.error('Error: --kill-after must be a non-negative number of milliseconds.');
        process.exit(1);
      }
      break;
    case '--signal':
      i += 1;
      timeoutSignal = optionArgs[i];
      if (typeof timeoutSignal !== 'string' || timeoutSignal.length === 0) {
        console.error('Error: --signal must be a valid signal name.');
        process.exit(1);
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
        console.error('Error: --log-file requires a file path.');
        process.exit(1);
      }
      break;
    case '--heartbeat':
      i += 1;
      heartbeatMs = Number(optionArgs[i]);
      if (!Number.isFinite(heartbeatMs) || heartbeatMs <= 0) {
        console.error('Error: --heartbeat must be a positive number of milliseconds.');
        process.exit(1);
      }
      break;
    case '--exit-on-pattern':
      i += 1;
      if (typeof optionArgs[i] !== 'string' || optionArgs[i].length === 0) {
        console.error('Error: --exit-on-pattern requires a non-empty pattern string.');
        process.exit(1);
      }
      exitPatterns.push(optionArgs[i]);
      break;
    case '--preset':
      i += 1;
      if (typeof optionArgs[i] !== 'string' || optionArgs[i].length === 0) {
        console.error('Error: --preset requires a preset name.');
        process.exit(1);
      }
      {
        const preset = presetPatternMap.get(optionArgs[i]);
        if (!preset) {
          console.error(`Error: unknown preset "${optionArgs[i]}". Available presets: ${Array.from(presetPatternMap.keys()).join(', ') || '(none)'}.`);
          process.exit(1);
        }
        exitPatterns.push(...preset);
      }
      break;
    default:
      console.error(`Error: Unknown option ${option}`);
      console.error('\n' + usage);
      process.exit(1);
  }
}

const [command, ...commandRest] = commandArgs;

if (!command) {
  console.error('Error: missing command to execute.');
  console.error('\n' + usage);
  process.exit(1);
}

const isPosix = process.platform !== 'win32';
const startTime = Date.now();

let logStream;
if (logFilePath) {
  try {
    mkdirSync(path.dirname(logFilePath), { recursive: true });
    logStream = createWriteStream(logFilePath, { flags: 'a' });
  } catch (error) {
    console.error(`Error: unable to open log file '${logFilePath}':`, error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const formatTime = () => `+${(Date.now() - startTime).toString().padStart(5, ' ')}ms`;

const logLine = (message, level = 'info') => {
  const line = `[run-with-timeout] [${new Date().toISOString()}] ${formatTime()} ${message}`;
  if (level === 'error') {
    console.error(line);
  } else {
    console.warn(line);
  }
  if (logStream) {
    logStream.write(line + '\n');
  }
};

const finish = (code = 0) => {
  const exit = () => process.exit(code);
  if (logStream) {
    logStream.end(exit);
  } else {
    exit();
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
  logLine(`Failed to start command: ${error.message}`, 'error');
  finish(1);
});

const forwardSignal = (sig) => {
  if (completed) {
    process.exit();
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

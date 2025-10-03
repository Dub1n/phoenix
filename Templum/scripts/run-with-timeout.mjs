#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

const usage = `Usage:\n  node scripts/run-with-timeout.mjs [options] -- <command> [args...]\n\nOptions:\n  --timeout <ms>      Maximum runtime before sending SIGTERM (default 30000).\n  --kill-after <ms>   Grace period after SIGTERM before SIGKILL (default 5000).\n  --signal <name>     Signal to send at timeout (default SIGTERM).\n  --cwd <path>        Working directory for the spawned process.\n  --log-file <path>   Append diagnostic output to the given file.\n  --heartbeat <ms>    Log a heartbeat every N ms (requires --log-file for file output).\n`;

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

const stdioOption = logStream ? ['inherit', 'pipe', 'pipe'] : 'inherit';

const child = spawn(command, commandRest, {
  cwd: spawnCwd,
  stdio: stdioOption,
  env: { ...process.env },
  detached: isPosix
});

let completed = false;
let terminationRequested = false;

logLine(`Spawned PID ${child.pid} with timeout ${timeoutMs}ms (kill-after ${killAfterMs}ms).`);

if (logStream && child.stdout) {
  child.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    logStream?.write(chunk);
  });
}

if (logStream && child.stderr) {
  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
    logStream?.write(chunk);
  });
}

let heartbeatHandle;
if (heartbeatMs > 0) {
  heartbeatHandle = setInterval(() => {
    if (!completed) {
      logLine(`Heartbeat: child ${child.pid} still running.`, 'info');
    }
  }, heartbeatMs);
  heartbeatHandle.unref();
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

const terminate = () => {
  if (completed) {
    return;
  }
  terminationRequested = true;
  logLine(`Timeout reached (${timeoutMs}ms). Sending ${timeoutSignal} to PID ${child.pid}.`);
  sendSignal(timeoutSignal);
  if (killAfterMs > 0) {
    setTimeout(() => {
      if (!completed) {
        logLine(`Process ${child.pid} still running. Sending SIGKILL.`, 'error');
        sendSignal('SIGKILL');
      }
    }, killAfterMs).unref();
  }
};

const timeoutHandle = setTimeout(terminate, timeoutMs);

child.on('exit', (code, signal) => {
  completed = true;
  clearTimeout(timeoutHandle);
  if (heartbeatHandle) {
    clearInterval(heartbeatHandle);
  }
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
  clearTimeout(timeoutHandle);
  if (heartbeatHandle) {
    clearInterval(heartbeatHandle);
  }
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

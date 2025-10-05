#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function exitWithUsage(message) {
  if (message) {
    console.error(message);
  }
  console.error(`\nUsage: custommove <source-pattern> <target-pattern> [options]\n\n` +
    `Patterns support [a|b|c] expansions in <source-pattern> and [*] placeholders in <target-pattern>.\n\n` +
    `Options:\n` +
    `  --dry-run             Preview actions without modifying files\n` +
    `  --no-ref-update      Skip reference updates\n` +
    `  --skip-check         Skip post-move ripgrep verification\n` +
    `  --ref-root <dir>     Limit reference updates to a directory (default: repository root)\n` +
    `  --commit[=<msg>]     Commit the change after completion (optional message).\n` +
    `  --message <msg>      Explicit commit message (alias for --commit)\n` +
    `  --silent             Suppress non-error logs`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    updateRefs: true,
    runCheck: true,
    refRoot: undefined,
    commit: false,
    commitMessage: undefined,
    silent: false,
  };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--no-ref-update') {
      options.updateRefs = false;
    } else if (arg === '--skip-check') {
      options.runCheck = false;
    } else if (arg === '--silent') {
      options.silent = true;
    } else if (arg === '--ref-root') {
      const value = argv[i + 1];
      if (!value) {
        exitWithUsage('Missing value for --ref-root');
      }
      options.refRoot = value;
      i += 1;
    } else if (arg === '--commit') {
      options.commit = true;
      const potentialMessage = argv[i + 1];
      if (potentialMessage && !potentialMessage.startsWith('--')) {
        options.commitMessage = potentialMessage;
        i += 1;
      }
    } else if (arg.startsWith('--commit=')) {
      options.commit = true;
      options.commitMessage = arg.slice('--commit='.length);
    } else if (arg === '--message') {
      const value = argv[i + 1];
      if (!value) {
        exitWithUsage('Missing value for --message');
      }
      options.commit = true;
      options.commitMessage = value;
      i += 1;
    } else if (arg.startsWith('-')) {
      exitWithUsage(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length < 2) {
    exitWithUsage('Expected <source-pattern> and <target-pattern>.');
  }

  return {
    sourcePattern: positional[0],
    targetPattern: positional[1],
    options,
  };
}

function runCommand(command, args, cwd, errorMessage, allowFailure = false) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8',
  });

  if (result.error) {
    if (allowFailure) {
      return result;
    }
    throw new Error(`${errorMessage}: ${result.error.message}`);
  }

  if (result.status !== 0 && !allowFailure) {
    throw new Error(`${errorMessage}: ${result.stderr.trim() || result.stdout.trim()}`);
  }

  return result;
}

function getRepoRoot(startDir) {
  const result = runCommand('git', ['rev-parse', '--show-toplevel'], startDir, 'Unable to find repository root');
  return result.stdout.trim();
}

function expandBracketPattern(pattern) {
  const bracketMatch = pattern.match(/\[([^\]]+)\]/);
  if (!bracketMatch) {
    return [pattern];
  }
  const items = bracketMatch[1].split('|').map((item) => item.trim());
  return items.map((item) => pattern.replace(bracketMatch[0], item));
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function ensureInsideRepo(repoRoot, candidatePath) {
  const normalized = path.normalize(candidatePath);
  const relative = path.relative(repoRoot, normalized);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes repository root: ${candidatePath}`);
  }
  return normalized;
}

function detectBinary(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.allocUnsafe(8000);
    const bytesRead = fs.readSync(fd, buffer, 0, 8000, 0);
    for (let i = 0; i < bytesRead; i += 1) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  } finally {
    fs.closeSync(fd);
  }
}

function defaultCommitMessage(moves) {
  if (moves.length === 1) {
    return `Move ${toPosix(moves[0].oldRelative)} to ${toPosix(moves[0].newRelative)}`;
  }
  return `Move ${moves.length} pattern files`;
}

function buildMovePlan(sourcePattern, targetPattern, repoRoot) {
  const sourceCandidates = expandBracketPattern(sourcePattern);
  if (sourceCandidates.length === 0) {
    throw new Error('No sources resolved from pattern.');
  }

  const sourcePaths = sourceCandidates.map((candidate) => {
    const absolute = path.resolve(repoRoot, candidate);
    if (!fs.existsSync(absolute)) {
      throw new Error(`Source file not found: ${candidate}`);
    }
    const stats = fs.statSync(absolute);
    if (!stats.isFile()) {
      throw new Error(`Source is not a file: ${candidate}`);
    }
    return absolute;
  });

  let targetPaths;
  if (targetPattern.includes('[*]')) {
    targetPaths = sourcePaths.map((sourcePath) => {
      const { name: stem } = path.parse(sourcePath);
      return targetPattern.replace(/\[\*\]/g, stem);
    });
  } else {
    const expandedTargets = expandBracketPattern(targetPattern);
    if (expandedTargets.length === 1 && sourcePaths.length >= 1) {
      targetPaths = sourcePaths.map(() => expandedTargets[0]);
    } else if (expandedTargets.length === sourcePaths.length) {
      targetPaths = expandedTargets;
    } else {
      throw new Error('Target pattern expansion count must be 1 or equal to number of sources.');
    }
  }

  const moves = sourcePaths.map((sourceAbsolute, index) => {
    const rawTarget = targetPaths[index];
    const targetAbsolute = path.resolve(repoRoot, rawTarget);
    const targetDir = path.dirname(targetAbsolute);
    const oldRelative = path.relative(repoRoot, sourceAbsolute);
    const newRelative = path.relative(repoRoot, targetAbsolute);

    ensureInsideRepo(repoRoot, targetAbsolute);

    return {
      sourceAbsolute,
      targetAbsolute,
      targetDir,
      oldRelative,
      newRelative,
    };
  });

  return moves;
}

function log(message, options) {
  if (!options.silent) {
    console.log(message);
  }
}

function performMoves(moves, repoRoot, options) {
  moves.forEach((move) => {
    const { sourceAbsolute, targetAbsolute, targetDir, oldRelative, newRelative } = move;
    const targetExists = fs.existsSync(targetAbsolute);
    if (targetExists) {
      throw new Error(`Target already exists: ${newRelative}`);
    }

    if (!fs.existsSync(targetDir)) {
      if (options.dryRun) {
        log(`[dry-run] mkdir -p ${toPosix(path.relative(repoRoot, targetDir))}`, options);
      } else {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    }

    if (options.dryRun) {
      log(`[dry-run] git mv ${toPosix(oldRelative)} ${toPosix(newRelative)}`, options);
    } else {
      runCommand('git', ['mv', '--', oldRelative, newRelative], repoRoot, 'git mv failed');
      log(`Moved ${toPosix(oldRelative)} → ${toPosix(newRelative)}`, options);
    }
  });
}

function updateReferences(moves, repoRoot, options) {
  const refRoot = options.refRoot ? path.resolve(repoRoot, options.refRoot) : repoRoot;
  ensureInsideRepo(repoRoot, refRoot);

  const trackedResult = runCommand('git', ['ls-files'], repoRoot, 'Unable to list tracked files');
  const trackedFiles = trackedResult.stdout.split('\n').filter(Boolean);

  const replacements = moves.map((move) => ({
    from: toPosix(move.oldRelative),
    to: toPosix(move.newRelative),
  }));

  const updatedFiles = [];

  trackedFiles.forEach((relativePath) => {
    const absolutePath = path.resolve(repoRoot, relativePath);
    if (!absolutePath.startsWith(refRoot)) {
      return;
    }
    const stats = fs.statSync(absolutePath);
    if (!stats.isFile()) {
      return;
    }

    if (detectBinary(absolutePath)) {
      return;
    }
    let content = fs.readFileSync(absolutePath, 'utf-8');
    let modified = false;

    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.split(from).join(to);
        modified = true;
      }
    });

    if (modified) {
      if (options.dryRun) {
        log(`[dry-run] update references in ${toPosix(relativePath)}`, options);
      } else {
        fs.writeFileSync(absolutePath, content, 'utf-8');
        updatedFiles.push(relativePath);
      }
    }
  });

  if (!options.dryRun && updatedFiles.length > 0) {
    log(`Updated references in ${updatedFiles.length} files`, options);
  }
  if (!options.dryRun && updatedFiles.length === 0) {
    log('No reference updates required', options);
  }

  return updatedFiles;
}

function runRipgrepVerification(moves, repoRoot, options) {
  moves.forEach((move) => {
    const searchTerm = toPosix(move.oldRelative);
    const result = runCommand('rg', ['--no-heading', '--line-number', '--color', 'never', searchTerm], repoRoot, 'rg verification failed', true);
    if (result.status === 0) {
      const matches = result.stdout.trim();
      if (!options.silent) {
        console.warn(`⚠️  Residual references to ${searchTerm}:`);
        console.warn(matches);
      }
    } else {
      log(`No residual references to ${searchTerm}`, options);
    }
  });
}

function ensureRipgrep(repoRoot, options) {
  try {
    runCommand('rg', ['--version'], repoRoot, 'ripgrep not available');
  } catch (error) {
    if (!options.silent) {
      console.warn('ripgrep (rg) not found. Install it to enable verification checks.');
    }
    return false;
  }
  return true;
}

function performCommit(repoRoot, options, moves) {
  if (options.dryRun) {
    log('[dry-run] git commit --all', options);
    return;
  }
  const message = options.commitMessage || defaultCommitMessage(moves);
  runCommand('git', ['commit', '--all', '-m', message], repoRoot, 'git commit failed');
  log(`Created commit: ${message}`, options);
}

function main() {
  const { sourcePattern, targetPattern, options } = parseArgs(process.argv.slice(2));
  const startDir = process.cwd();
  const repoRoot = getRepoRoot(startDir);

  const moves = buildMovePlan(sourcePattern, targetPattern, repoRoot);

  performMoves(moves, repoRoot, options);

  if (options.updateRefs) {
    updateReferences(moves, repoRoot, options);
  } else if (!options.silent) {
    log('Reference updates skipped (--no-ref-update).', options);
  }

  if (options.runCheck && ensureRipgrep(repoRoot, options)) {
    runRipgrepVerification(moves, repoRoot, options);
  }

  if (options.commit) {
    performCommit(repoRoot, options, moves);
  }
}

try {
  main();
} catch (error) {
  console.error(`custommove failed: ${error.message}`);
  process.exit(1);
}

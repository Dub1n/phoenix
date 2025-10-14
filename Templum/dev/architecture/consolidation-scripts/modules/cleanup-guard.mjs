import fs from 'node:fs';
import path from 'path';
import { spawnSync } from 'node:child_process';
import { consolidationScriptsRelativePath, repoRoot } from './environment.mjs';
import { normaliseSearchTerms } from './plan-file-utils.mjs';

const RG_FILE_CHUNK_SIZE = 200;

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function shouldExcludeFromSweep(relativePath) {
  if (!relativePath || !consolidationScriptsRelativePath) {
    return false;
  }
  return (
    relativePath === consolidationScriptsRelativePath ||
    relativePath.startsWith(`${consolidationScriptsRelativePath}/`)
  );
}

function formatSampleList(values) {
  if (!values.length) {
    return '';
  }
  const sample = values.slice(0, 5).join(', ');
  const suffix = values.length > 5 ? ', ...' : '';
  return ` (${sample}${suffix})`;
}

function filterGitIgnoredFiles(files) {
  if (!files.length) {
    return { kept: [], ignored: [] };
  }
  const unique = [...new Set(files)];
  const input = `${unique.join('\n')}\n`;
  const result = spawnSync('git', ['check-ignore', '--stdin'], {
    cwd: repoRoot,
    encoding: 'utf8',
    input,
    maxBuffer: 10 * 1024 * 1024
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0 && result.status !== 1) {
    const message = (result.stderr || '').trim();
    throw new Error(message || 'git check-ignore failed');
  }
  const ignoredSet = new Set(
    (result.stdout || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  );
  if (!ignoredSet.size) {
    return { kept: unique, ignored: [] };
  }
  const kept = unique.filter((file) => !ignoredSet.has(file));
  const ignored = unique.filter((file) => ignoredSet.has(file));
  return { kept, ignored };
}

function expandPlannedFileEntries(plannedFiles = []) {
  if (!plannedFiles.length) {
    return { expanded: [], ignored: [], excluded: [] };
  }
  const results = new Set();
  const queue = [];
  const visited = new Set();
  const excluded = new Set();

  plannedFiles.forEach((entry) => {
    if (typeof entry !== 'string') {
      return;
    }
    const trimmed = entry.trim();
    if (!trimmed) {
      return;
    }
    const normalisedEntry =
      trimmed === '.' || trimmed === './' ? '.' : trimmed.replace(/^\.\//, '');
    const resolved = path.resolve(repoRoot, normalisedEntry);
    const relativeToRepo = path.relative(repoRoot, resolved);
    if (relativeToRepo.startsWith('..')) {
      return;
    }
    const normalizedRelative = relativeToRepo ? toPosixPath(relativeToRepo) : '';
    if (normalizedRelative && shouldExcludeFromSweep(normalizedRelative)) {
      excluded.add(normalizedRelative);
      return;
    }
    queue.push({ absolute: resolved });
  });

  while (queue.length) {
    const { absolute } = queue.pop();
    if (visited.has(absolute)) {
      continue;
    }
    visited.add(absolute);
    const relativeAbsolute = path.relative(repoRoot, absolute);
    if (relativeAbsolute.startsWith('..')) {
      continue;
    }
    const normalizedAbsolute = relativeAbsolute ? toPosixPath(relativeAbsolute) : '';
    if (normalizedAbsolute && shouldExcludeFromSweep(normalizedAbsolute)) {
      excluded.add(normalizedAbsolute);
      continue;
    }
    let stat;
    try {
      stat = fs.statSync(absolute);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      let entries;
      try {
        entries = fs.readdirSync(absolute, { withFileTypes: true });
      } catch {
        continue;
      }
      entries.forEach((dirent) => {
        const nextAbsolute = path.join(absolute, dirent.name);
        const relativeNext = path.relative(repoRoot, nextAbsolute);
        if (relativeNext.startsWith('..')) {
          return;
        }
        const normalizedNext = relativeNext ? toPosixPath(relativeNext) : '';
        if (normalizedNext && shouldExcludeFromSweep(normalizedNext)) {
          excluded.add(normalizedNext);
          return;
        }
        queue.push({ absolute: nextAbsolute });
      });
    } else if (stat.isFile()) {
      const relativeFile = path.relative(repoRoot, absolute);
      if (relativeFile.startsWith('..')) {
        continue;
      }
      const normalizedFile = relativeFile ? toPosixPath(relativeFile) : '';
      if (normalizedFile && shouldExcludeFromSweep(normalizedFile)) {
        excluded.add(normalizedFile);
      } else if (!normalizedFile.toLowerCase().endsWith('.md')) {
        results.add(normalizedFile);
      }
    }
  }

  const sorted = [...results].sort((a, b) => a.localeCompare(b));
  const { kept, ignored } = filterGitIgnoredFiles(sorted);
  const excludedList = [...excluded].sort((a, b) => a.localeCompare(b));
  return { expanded: kept, ignored, excluded: excludedList };
}

function runRipgrepCount(term, files) {
  const counts = new Map();
  if (!term || !files.length) {
    return counts;
  }
  for (let index = 0; index < files.length; index += RG_FILE_CHUNK_SIZE) {
    const chunk = files.slice(index, index + RG_FILE_CHUNK_SIZE);
    if (!chunk.length) {
      continue;
    }
    const args = [
      '--no-heading',
      '--with-filename',
      '--color',
      'never',
      '--no-messages',
      '--path-separator',
      '/',
      '--fixed-strings',
      '--count',
      term,
      ...chunk
    ];
    const result = spawnSync('rg', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status === 2) {
      const message = (result.stderr || 'ripgrep reported an error.').trim();
      throw new Error(message);
    }
    const output = (result.stdout || '').trim();
    if (!output) {
      continue;
    }
    output.split('\n').forEach((line) => {
      if (!line) {
        return;
      }
      const lastColon = line.lastIndexOf(':');
      if (lastColon === -1) {
        return;
      }
      const filePath = line.slice(0, lastColon).trim();
      const countText = line.slice(lastColon + 1).trim();
      const count = Number.parseInt(countText, 10);
      if (!filePath || Number.isNaN(count) || count <= 0) {
        return;
      }
      const normalizedFile = filePath.startsWith('./') ? filePath.slice(2) : filePath;
      const current = counts.get(normalizedFile) || 0;
      counts.set(normalizedFile, current + count);
    });
  }
  return counts;
}

function collectFileTermMatches(searchTerms, files) {
  const fileToTerms = new Map();
  searchTerms.forEach((term) => {
    const counts = runRipgrepCount(term, files);
    counts.forEach((count, filePath) => {
      const fileEntry = fileToTerms.get(filePath) || new Map();
      fileEntry.set(term, (fileEntry.get(term) || 0) + count);
      fileToTerms.set(filePath, fileEntry);
    });
  });
  const matches = [];
  fileToTerms.forEach((termMap, filePath) => {
    termMap.forEach((count, term) => {
      if (count > 0) {
        matches.push({ file: filePath, term, count });
      }
    });
  });
  matches.sort((a, b) => {
    const byFile = a.file.localeCompare(b.file);
    if (byFile !== 0) {
      return byFile;
    }
    return a.term.localeCompare(b.term);
  });
  return matches;
}

function runScopeCleanupGuard(pattern, scopeKind, scopeId) {
  const holder =
    scopeKind === 'stage'
      ? pattern.stageGates?.[scopeId]
      : pattern.lanes?.[scopeId];
  const searchTerms = normaliseSearchTerms(holder?.searchTerms || []);
  const plannedFiles = Array.isArray(holder?.plannedFiles) ? [...holder.plannedFiles] : [];
  if (!searchTerms.length) {
    return {
      executed: false,
      reason: 'missing-search-terms',
      searchTerms,
      plannedFiles,
      matches: [],
      expandedFiles: [],
      ignoredFiles: [],
      excludedFiles: []
    };
  }
  if (!plannedFiles.length) {
    return {
      executed: false,
      reason: 'missing-planned-files',
      searchTerms,
      plannedFiles,
      matches: [],
      expandedFiles: [],
      ignoredFiles: [],
      excludedFiles: []
    };
  }
  const {
    expanded: expandedFiles,
    ignored: ignoredFiles,
    excluded: excludedFiles
  } = expandPlannedFileEntries(plannedFiles);
  if (!expandedFiles.length) {
    let reason = 'no-files-resolved';
    if (ignoredFiles.length && !excludedFiles.length) {
      reason = 'only-gitignored';
    } else if (excludedFiles.length && !ignoredFiles.length) {
      reason = 'only-excluded-paths';
    } else if (ignoredFiles.length && excludedFiles.length) {
      reason = 'only-excluded-and-gitignored';
    }
    return {
      executed: false,
      reason,
      searchTerms,
      plannedFiles,
      matches: [],
      expandedFiles: [],
      ignoredFiles,
      excludedFiles
    };
  }
  const matches = collectFileTermMatches(searchTerms, expandedFiles);
  return {
    executed: true,
    reason: null,
    searchTerms,
    plannedFiles,
    matches,
    expandedFiles,
    ignoredFiles,
    excludedFiles
  };
}

function formatScopeLabel(scopeKind, scopeId) {
  return scopeKind === 'stage' ? `stage ${scopeId}` : `lane ${scopeId}`;
}

function formatList(values, formatter = (value) => value) {
  if (!values.length) {
    return '[]';
  }
  return `[${values.map((value) => formatter(value)).join(', ')}]`;
}

function formatMatches(matches) {
  if (!matches.length) {
    return ['(no matches)'];
  }
  return matches.map(
    (entry) => `  • ${entry.file} — "${entry.term}" ×${entry.count}`
  );
}

function buildGuardSuccessMessage(patternId, scopeLabel, outcome) {
  const formattedTerms = formatList(outcome.searchTerms, (term) => `"${term}"`);
  const formattedFiles = formatList(outcome.plannedFiles);
  return `No instances of ${formattedTerms} found in ${formattedFiles} (pattern ${patternId} ${scopeLabel}).`;
}

function buildGuardFailureMessage(patternId, scopeKind, scopeLabel, outcome, forced = false) {
  const formattedTerms = formatList(outcome.searchTerms, (term) => `"${term}"`);
  const formattedFiles = formatList(outcome.plannedFiles);
  const lines = [
    `Pattern ${patternId} ${scopeLabel}: unmigrated patterns found in planned files.`,
    `  Terms: ${formattedTerms}`,
    `  Planned files: ${formattedFiles}`,
    '  Summary:',
    ...formatMatches(outcome.matches)
  ];
  if (forced) {
    lines.push(
      'Proceeding due to --force. Add a stage note explaining the remaining instances in your planned files.'
    );
  } else {
    const scopeNoun = scopeKind === 'stage' ? 'stage' : 'lane';
    lines.push(
      `If these belong in this ${scopeNoun}, migrate them before marking it complete. Otherwise reapply the update with --force and add a stage note explaining the remaining instances in your planned files.`
    );
  }
  return lines.join('\n');
}

function collectSweepScopes(pattern) {
  const stageScopes = Object.entries(pattern.stageGates || {})
    .filter(([, gate]) => normaliseSearchTerms(gate?.searchTerms || []).length)
    .map(([stageId]) => stageId)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const laneScopes = Object.entries(pattern.lanes || {})
    .filter(([, lane]) => normaliseSearchTerms(lane?.searchTerms || []).length)
    .map(([laneId]) => laneId.toLowerCase())
    .sort((a, b) => a.localeCompare(b));
  return {
    stages: stageScopes,
    lanes: laneScopes
  };
}

function enforceScopeCleanupGuard(pattern, scopeKind, scopeId, options = {}) {
  const outcome = runScopeCleanupGuard(pattern, scopeKind, scopeId);
  if (!outcome.executed) {
    return outcome;
  }
  const scopeLabel = formatScopeLabel(scopeKind, scopeId);
  const messageWhenOk = buildGuardSuccessMessage(pattern.patternId, scopeLabel, outcome);
  if (!outcome.matches.length) {
    console.log(messageWhenOk);
    return outcome;
  }
  const message = buildGuardFailureMessage(
    pattern.patternId,
    scopeKind,
    scopeLabel,
    outcome,
    Boolean(options.force)
  );
  if (options.force) {
    console.log(message);
    return outcome;
  }
  throw new Error(message);
}

export {
  buildGuardFailureMessage,
  buildGuardSuccessMessage,
  collectSweepScopes,
  enforceScopeCleanupGuard,
  formatSampleList,
  formatScopeLabel,
  runScopeCleanupGuard
};

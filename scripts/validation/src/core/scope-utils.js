import fs from 'fs';
import path from 'path';
import { minimatch } from 'minimatch';

const DEFAULT_PATTERNS = ['**/*.ts', '**/*.js', 'src/**/*.ts', 'src/**/*.js'];
const DEFAULT_IGNORE_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.next',
  'out',
  '.turbo',
  '.idea'
]);

const DEFAULT_OPTIONS = {
  maxDepth: 25,
  maxFiles: 250,
  maxFileSize: 5 * 1024 * 1024,
  maxTotalSize: 50 * 1024 * 1024,
  ignoreDirectories: []
};

const MINIMATCH_OPTIONS = {
  dot: true,
  nocase: true
};

const POSIX_SEP = '/';

const toPosixPath = value => value.replace(/\\/g, POSIX_SEP);

const ensurePatternsArray = patterns => {
  if (!patterns) {
    return [...DEFAULT_PATTERNS];
  }

  if (Array.isArray(patterns)) {
    return patterns.filter(Boolean);
  }

  if (typeof patterns === 'string') {
    return patterns
      .split(',')
      .map(pattern => pattern.trim())
      .filter(Boolean);
  }

  return [...DEFAULT_PATTERNS];
};

const normalizePattern = (projectPath, rawPattern) => {
  if (!rawPattern) {
    return '';
  }

  let pattern = String(rawPattern).trim();
  if (!pattern) {
    return '';
  }

  pattern = toPosixPath(pattern);
  const projectPathPosix = toPosixPath(projectPath);

  if (pattern.startsWith(projectPathPosix)) {
    pattern = pattern.slice(projectPathPosix.length);
  }

  if (pattern.startsWith('./')) {
    pattern = pattern.slice(2);
  }

  if (pattern.startsWith('/')) {
    pattern = pattern.slice(1);
  }

  const projectDirName = path.basename(projectPathPosix);
  if (pattern.startsWith(`${projectDirName}/`)) {
    pattern = pattern.slice(projectDirName.length + 1);
  }

  if (/^[a-zA-Z]:/.test(pattern)) {
    pattern = pattern.replace(/^[a-zA-Z]:\//, '');
  }

  return pattern;
};

const compilePatterns = patterns =>
  patterns
    .filter(Boolean)
    .map(pattern => toPosixPath(pattern))
    .filter((pattern, index, array) => array.indexOf(pattern) === index);

const shouldIgnoreDirectory = (directoryName, options) => {
  if (!directoryName) {
    return false;
  }

  if (DEFAULT_IGNORE_DIRECTORIES.has(directoryName)) {
    return true;
  }

  return (options.ignoreDirectories || []).includes(directoryName);
};

const getMatchingPatterns = (relativePath, fileName, patterns) => {
  if (!patterns.length) {
    return ['**/*'];
  }

  return patterns.filter(pattern =>
    minimatch(relativePath, pattern, MINIMATCH_OPTIONS) ||
    minimatch(fileName, pattern, MINIMATCH_OPTIONS)
  );
};

const walkDirectory = (root, dir, patterns, options, state) => {
  if (state.files.length >= options.maxFiles || state.totalSize >= options.maxTotalSize) {
    return;
  }

  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    state.warnings.push(`Unable to read directory: ${dir} (${error.message})`);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (shouldIgnoreDirectory(entry.name, options)) {
        continue;
      }

      if ((state.depthMap.get(dir) || 0) >= options.maxDepth) {
        state.warnings.push(`Skipping deep directory: ${fullPath}`);
        continue;
      }

      state.depthMap.set(fullPath, (state.depthMap.get(dir) || 0) + 1);
      walkDirectory(root, fullPath, patterns, options, state);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (entry.name.startsWith('.') || entry.name.endsWith('.map')) {
      continue;
    }

    const relativePath = toPosixPath(path.relative(root, fullPath));
    const matchingPatterns = getMatchingPatterns(relativePath, entry.name, patterns);
    if (matchingPatterns.length === 0) {
      continue;
    }

    let stats;
    try {
      stats = fs.statSync(fullPath);
    } catch (error) {
      state.warnings.push(`Unable to stat file: ${fullPath} (${error.message})`);
      continue;
    }

    if (stats.size > options.maxFileSize) {
      state.warnings.push(`Skipping large file (${Math.round(stats.size / 1024)}KB): ${relativePath}`);
      continue;
    }

    if (state.totalSize + stats.size > options.maxTotalSize) {
      state.warnings.push('Total scope size limit reached');
      return;
    }

    state.files.push(fullPath);
    state.relativeFiles.push(relativePath);
    state.patternMatches.set(fullPath, matchingPatterns);
    state.totalSize += stats.size;

    if (state.files.length >= options.maxFiles) {
      state.warnings.push(`Reached file limit (${options.maxFiles})`);
      return;
    }
  }
};

export const resolveScopedFiles = async (projectPath, scopeConfig = {}, customOptions = {}) => {
  const rawPatterns = ensurePatternsArray(scopeConfig.patterns);
  const normalizedPatterns = rawPatterns
    .map(pattern => normalizePattern(projectPath, pattern))
    .filter(Boolean);

  const patterns = compilePatterns([
    ...normalizedPatterns,
    ...rawPatterns.map(pattern => toPosixPath(pattern))
  ]);

  const options = {
    ...DEFAULT_OPTIONS,
    ...customOptions,
    ignoreDirectories: [
      ...(DEFAULT_OPTIONS.ignoreDirectories || []),
      ...(customOptions.ignoreDirectories || [])
    ]
  };

  const state = {
    files: [],
    relativeFiles: [],
    patternMatches: new Map(),
    totalSize: 0,
    warnings: [],
    depthMap: new Map([[projectPath, 0]])
  };

  walkDirectory(projectPath, projectPath, patterns, options, state);

  return {
    root: projectPath,
    files: state.files,
    relativeFiles: state.relativeFiles,
    patternMatches: state.patternMatches,
    totalSize: state.totalSize,
    warnings: state.warnings,
    patterns: patterns.length ? patterns : [...DEFAULT_PATTERNS]
  };
};

const formatBytes = bytes => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  const decimals = value >= 100 || index === 0 ? 0 : 1;
  return value.toFixed(decimals) + ' ' + units[index];
};

export const summarizeScope = (scopeResult, options = {}) => {
  if (!scopeResult || !scopeResult.files) {
    return null;
  }

  const { limit = 10, includeCounts = true, includePatterns = false } = options;
  const files = scopeResult.relativeFiles && scopeResult.relativeFiles.length === scopeResult.files.length
    ? scopeResult.relativeFiles
    : scopeResult.files.map(file => file.replace(/\\/g, '/'));

  const summaryLines = [];
  if (includeCounts) {
    const label = 'Scope summary: ' + files.length + ' file' + (files.length === 1 ? '' : 's');
    summaryLines.push(label);
  }
  if (typeof scopeResult.totalSize === 'number') {
    summaryLines.push('Scope size: ' + formatBytes(scopeResult.totalSize));
  }
  const limitedFiles = files.slice(0, limit);
  if (limitedFiles.length) {
    const truncated = files.length > limit ? ' (truncated)' : '';
    summaryLines.push('Files: ' + limitedFiles.join(', ') + truncated);
  }
  if (includePatterns && Array.isArray(scopeResult.patterns) && scopeResult.patterns.length > 0) {
    summaryLines.push('Patterns: ' + scopeResult.patterns.join(', '));
  }

  return summaryLines.length ? summaryLines.join('\n') : null;
};

export const appendScopeEvidence = (result, scopeResult, options = {}) => {
  if (!result || !scopeResult) {
    return;
  }

  const evidenceKey = options.evidenceKey || 'evidence';
  const warningsKey = options.warningsKey || 'warnings';
  const evidence = result[evidenceKey] || (result[evidenceKey] = []);
  const warningList = result[warningsKey] || (result[warningsKey] = []);

  if (Array.isArray(scopeResult.warnings) && scopeResult.warnings.length) {
    warningList.push(...scopeResult.warnings);
  }

  if (Array.isArray(scopeResult.patterns) && scopeResult.patterns.length) {
    evidence.push('Normalized scope patterns: ' + scopeResult.patterns.join(', '));
  }

  if (typeof scopeResult.totalSize === 'number') {
    evidence.push('Scope size: ' + scopeResult.files.length + ' files, ' + formatBytes(scopeResult.totalSize));
  } else {
    evidence.push('Scope includes ' + scopeResult.files.length + ' files');
  }

  const summary = summarizeScope(scopeResult, options);
  if (summary) {
    evidence.push(summary);
  }
};

export const filterScopedFiles = (scopeResult, patterns) => {
  if (!scopeResult || !Array.isArray(scopeResult.files) || scopeResult.files.length === 0) {
    return { files: [], relativeFiles: [] };
  }

  const effectivePatterns = ensurePatternsArray(patterns);
  if (!effectivePatterns.length) {
    return {
      files: [...scopeResult.files],
      relativeFiles: scopeResult.relativeFiles ? [...scopeResult.relativeFiles] : scopeResult.files.map(file => file.replace(/\\/g, '/'))
    };
  }

  const normalized = effectivePatterns.map(pattern => toPosixPath(pattern));
  const matchedFiles = [];
  const matchedRelative = [];

  scopeResult.files.forEach((absolute, index) => {
    const relative = scopeResult.relativeFiles?.[index] || absolute.replace(/\\/g, '/');
    const candidate = toPosixPath(relative);

    const isMatch = normalized.some(pattern => minimatch(candidate, pattern, MINIMATCH_OPTIONS));
    if (isMatch) {
      matchedFiles.push(absolute);
      matchedRelative.push(relative);
    }
  });

  return {
    files: matchedFiles,
    relativeFiles: matchedRelative
  };
};


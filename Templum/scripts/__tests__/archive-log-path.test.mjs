import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {
  repositoryRoot,
  resolveArchiveLogPath,
  templumRoot
} from '../utils/archive-log-path.mjs';

test('accepts utility-migration evidence paths', () => {
  const candidate = path.join(templumRoot, 'archive/dev-files/utility-migration/evidence/pattern-2/stage6/lane6d/guardrail-pass.log');
  assert.equal(resolveArchiveLogPath(candidate), candidate);
});

test('accepts non-migration archive layouts and filenames', () => {
  const candidate = path.join(templumRoot, 'archive/test-runs/backend/diagnostic-output.txt');
  assert.equal(resolveArchiveLogPath(candidate), candidate);
});

test('accepts another monorepo project archive', () => {
  const candidate = path.join(repositoryRoot, 'Haruspex/archive/test-runs/diagnostic.log');
  assert.equal(resolveArchiveLogPath(candidate), candidate);
});

test('resolves project-relative archive paths', () => {
  const candidate = 'archive/dev-files/utility-migration/evidence/pattern-4/stage7/phase6-health.log';
  assert.equal(resolveArchiveLogPath(candidate, templumRoot), path.join(templumRoot, candidate));
});

test('rejects paths without an archive directory', () => {
  assert.throws(
    () => resolveArchiveLogPath('tmp/consolidation/test.log', templumRoot),
    /below/
  );
});

test('rejects archive-like directory names', () => {
  const candidate = path.join(repositoryRoot, 'Haruspex/archive-old/test.log');
  assert.throws(() => resolveArchiveLogPath(candidate), /directory named archive/);
});

test('rejects an archive path outside the monorepo', () => {
  const candidate = path.join(repositoryRoot, '../archive/test.log');
  assert.throws(() => resolveArchiveLogPath(candidate), /inside/);
});

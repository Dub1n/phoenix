import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_PATH = path.resolve(__dirname, '../update.mjs');

function setupFixture() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'skill-tree-cli-'));
  const skillDir = path.join(tmp, 'skill-tree');
  mkdirSync(skillDir, { recursive: true });
  const state = {
    version: 0.1,
    updated: '2025-01-01',
    roles: { ladder: [] },
    nodes: [
      {
        id: 'demo',
        title: 'Demo Node',
        parent: null,
        level: 'learner',
        readiness: 0.5,
        test_cooldown: 0,
        confidence: 'low',
        evidence: [],
        achievements: {},
        priority: false,
      },
    ],
  };
  writeFileSync(path.join(skillDir, 'skill-tree.yaml'), YAML.stringify(state, { indent: 2 }));
  const areas = {
    version: 0.1,
    statuses: [
      { id: 'unseen', label: 'Unseen', description: '' },
      { id: 'learning', label: 'Learning', description: '' },
    ],
    areas: [],
  };
  writeFileSync(path.join(skillDir, 'areas.yaml'), YAML.stringify(areas, { indent: 2 }));
  return { tmp, skillDir };
}

test('increments readiness, evidence, and check-ins', () => {
  const { tmp } = setupFixture();
  const env = {
    ...process.env,
    SKILL_TREE_ROOT: tmp,
    SKILL_TREE_DATE: '2030-01-01',
  };
  const result = spawnSync(
    'node',
    [CLI_PATH, '--node', 'demo', '--readiness', '+0.1', '--evidence', 'Practiced migration flow', '-c'],
    { env, encoding: 'utf8' },
  );
  assert.strictEqual(result.status, 0, result.stderr);
  const skillDir = path.join(tmp, 'skill-tree');
  const updatedState = YAML.parse(readFileSync(path.join(skillDir, 'skill-tree.yaml'), 'utf8'));
  const node = updatedState.nodes.find((entry) => entry.id === 'demo');
  assert.ok(node, 'node exists after update');
  assert.strictEqual(node.readiness, 0.6);
  assert.strictEqual(node.check_ins, 1);
  assert.ok(node.evidence.some((line) => line.startsWith('2030-01-01:')));
  const renderOutput = readFileSync(path.join(skillDir, 'skill-tree.md'), 'utf8');
  assert.match(renderOutput, /Demo Node/);
  rmSync(tmp, { recursive: true, force: true });
});

test('writes log file with slug and topic upsert', () => {
  const { tmp } = setupFixture();
  const env = {
    ...process.env,
    SKILL_TREE_ROOT: tmp,
    SKILL_TREE_DATE: '2030-02-02',
  };
  const result = spawnSync(
    'node',
    [
      CLI_PATH,
      '--node',
      'demo',
      '--topic-upsert',
      'id=wsl_migration,status=learning,note=covered move',
      '--log',
      '- Domains touched: Tooling & Automation',
      '--log-slug',
      'tooling',
    ],
    { env, encoding: 'utf8' },
  );
  assert.strictEqual(result.status, 0, result.stderr);
  const skillDir = path.join(tmp, 'skill-tree');
  const areas = YAML.parse(readFileSync(path.join(skillDir, 'areas.yaml'), 'utf8'));
  const entry = areas.areas.find((section) => section.node === 'demo');
  assert.ok(entry, 'topic container created');
  const topic = entry.topics.find((item) => item.id === 'wsl_migration');
  assert.strictEqual(topic.status, 'learning');
  const logPath = path.join(skillDir, 'skill-log', '2030-02-02--tooling.md');
  const logContents = readFileSync(logPath, 'utf8');
  assert.match(logContents, /## Check-in: 2030-02-02/);
  assert.match(logContents, /Domains touched/);
  rmSync(tmp, { recursive: true, force: true });
});

test('skip-render flag avoids regenerating markdown', () => {
  const { tmp } = setupFixture();
  const env = {
    ...process.env,
    SKILL_TREE_ROOT: tmp,
    SKILL_TREE_DATE: '2030-03-03',
  };
  const skillDir = path.join(tmp, 'skill-tree');
  const mdPath = path.join(skillDir, 'skill-tree.md');
  rmSync(mdPath, { force: true });
  const result = spawnSync(
    'node',
    [CLI_PATH, '--node', 'demo', '--readiness', '+0.05', '--skip-render'],
    { env, encoding: 'utf8' },
  );
  assert.strictEqual(result.status, 0, result.stderr);
  assert.ok(!existsSync(mdPath), 'skill-tree.md should not be regenerated when skipping render');
  rmSync(tmp, { recursive: true, force: true });
});

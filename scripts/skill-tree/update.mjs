#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.env.SKILL_TREE_ROOT
  ? path.resolve(process.env.SKILL_TREE_ROOT)
  : path.resolve(__dirname, '../..');
const DATE_OVERRIDE = process.env.SKILL_TREE_DATE ?? null;
const SKILL_DIR = path.join(ROOT, 'skill-tree');
const STATE_PATH = path.join(SKILL_DIR, 'skill-tree.yaml');
const AREAS_PATH = path.join(SKILL_DIR, 'areas.yaml');
const LOG_DIR = path.join(SKILL_DIR, 'skill-log');
const RENDER_SCRIPT = path.join(__dirname, 'render.mjs');

function loadYaml(filePath, fallback = {}) {
  if (!existsSync(filePath)) {
    return fallback;
  }
  const raw = readFileSync(filePath, 'utf8');
  return YAML.parse(raw) ?? fallback;
}

function writeYaml(filePath, data) {
  const serialised = YAML.stringify(data, { indent: 2, simpleKeys: true });
  writeFileSync(filePath, serialised, 'utf8');
}

function today() {
  if (DATE_OVERRIDE) return DATE_OVERRIDE;
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const result = { flags: new Map(), multi: new Map(), positionals: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('-')) {
      result.positionals.push(token);
      continue;
    }
    if (token.startsWith('-') && !token.startsWith('--')) {
      const chars = token.slice(1).split('');
      chars.forEach((ch) => addArg(result, ch, true));
      continue;
    }
    const [namePart, valuePart] = token.split('=', 2);
    const name = namePart.slice(2);
    if (valuePart !== undefined) {
      addArg(result, name, valuePart);
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      addArg(result, name, next);
      i += 1;
    } else {
      addArg(result, name, true);
    }
  }
  return result;
}

function addArg(container, name, value) {
  if (!container.multi.has(name)) {
    container.multi.set(name, []);
  }
  container.multi.get(name).push(value);
  container.flags.set(name, value);
}

function firstArg(args, key, fallback = undefined) {
  if (!args.multi.has(key)) return fallback;
  const values = args.multi.get(key);
  return values.length ? values[0] : fallback;
}

function allArgs(args, key) {
  if (!args.multi.has(key)) return [];
  return args.multi.get(key);
}

function usage(exitCode = 0) {
  const lines = [
    'Usage: npm run skill-tree:update -- --node <id> [options]',
    '',
    'Primary operations:',
    '  --node <id>                 Select node to modify (required for most edits)',
    '  --set-title "text"          Rename the node (keeps casing/spacing)',
    '  --set-parent <id|none>      Reassign parent (use "none" to clear)',
    '  --readiness <delta>         Adjust readiness by +/- value (e.g. +0.1)',
    '  --set-readiness <value>     Set readiness explicitly (0-1)',
    '  --level <ladder-id>         Update level (learner|junior|mid|senior|staff)',
    '  --confidence <value>        Update confidence (low|medium|high)',
    '  --cooldown <int>            Set test cooldown counter',
    '  --priority on|off           Toggle priority focus',
    '  --achievement key=value     Upsert achievement value (use key= to clear)',
    '  --clear-achievement <key>   Remove achievement entry',
    '  --evidence "text"           Append evidence line (date auto-prefixes if missing)',
    '  --set-next-hint "text"      Replace next test hint',
    '  --clear-next-hint           Remove next test hint',
    '  --check-in                  Increment check-in tally for node',
    '',
    'Area/topic management:',
    '  --topic-upsert key=value,...   Upsert topic under areas.yaml (defaults node=target)',
    '  --topic-remove key=value,...   Remove topic (requires node and id)',
    '',
    'Node management:',
    '  --create-node key=value,...    Create new node (id required; title/parent optional)',
    '  --update-node key=value,...    Set node properties (title, parent, etc.)',
    '  --remove-node <id>             Delete node (fails if children remain unless --cascade)',
    '  --cascade                      Allow node removal to also drop descendants',
    '',
    'Logging:',
    '  --log "markdown"              Write skill-log entry (auto filename by date/slug)',
    '  --log-file <path>             Copy contents from path into new log entry',
    '  --log-slug <slug>             Override slug portion of log filename',
    '  --force                       Allow overwriting existing log file',
    '  --skip-render                 Prevent automatic Markdown render after update',
    '  -c, --check-in                Increment node check-in counter (alias already listed)',
    '',
    'Utility:',
    '  --dry-run                     Show planned changes without writing files',
    '  --help                        Display this message',
    '',
    'Examples:',
    '  npm run skill-tree:update -- --node tooling_automation --readiness +0.1 --evidence "Planning session"',
    '  npm run skill-tree:update -- --create-node id=new_skill,title="Observability",parent=devops_platform --level learner',
    '  npm run skill-tree:update -- --node tooling_automation --topic-upsert id=wsl_migration,status=learning,note="Covered repo move"',
  ];
  console.log(lines.join('\n'));
  process.exit(exitCode);
}

function parseKeyValueList(input, contextLabel) {
  if (!input) return {};
  const pairs = input.split(',');
  const result = {};
  for (const pair of pairs) {
    const [key, ...rest] = pair.split('=');
    const value = rest.join('=');
    if (!key) {
      throw new Error(`Invalid key/value in ${contextLabel}: "${pair}"`);
    }
    result[key.trim()] = value.trim();
  }
  return result;
}

function parseFloatMaybe(value, label) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return num;
}

function parseBoolean(value) {
  const normalised = String(value).toLowerCase();
  if (['on', 'true', '1', 'yes'].includes(normalised)) return true;
  if (['off', 'false', '0', 'no'].includes(normalised)) return false;
  throw new Error(`Invalid boolean value: ${value}`);
}

function ensureStateLoaded(state) {
  if (!state.nodes) {
    state.nodes = [];
  }
}

function findNode(state, nodeId) {
  return (state.nodes ?? []).find((node) => node.id === nodeId) ?? null;
}

function ensureNode(state, nodeId) {
  const node = findNode(state, nodeId);
  if (!node) {
    const choices = state.nodes.map((n) => n.id).sort();
    const hint = choices.length ? `Available nodes: ${choices.join(', ')}` : 'No nodes in skill-tree.yaml yet.';
    throw new Error(`Node "${nodeId}" not found. ${hint}`);
  }
  return node;
}

function applyNodeUpdate(node, updates) {
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === '__DELETE__') {
      delete node[key];
    } else {
      node[key] = value;
    }
  });
}

function clampReadiness(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function ensureTopicContainer(areasDoc, nodeId) {
  if (!areasDoc.areas) {
    areasDoc.areas = [];
  }
  let entry = areasDoc.areas.find((area) => area.node === nodeId);
  if (!entry) {
    entry = { node: nodeId, topics: [] };
    areasDoc.areas.push(entry);
  }
  if (!entry.topics) {
    entry.topics = [];
  }
  return entry;
}

function removeTopic(areasDoc, nodeId, topicId) {
  if (!areasDoc.areas) return false;
  const entry = areasDoc.areas.find((area) => area.node === nodeId);
  if (!entry || !entry.topics) return false;
  const originalLength = entry.topics.length;
  entry.topics = entry.topics.filter((topic) => topic.id !== topicId);
  if (!entry.topics.length) {
    areasDoc.areas = areasDoc.areas.filter((area) => area !== entry);
  }
  return entry.topics.length !== originalLength;
}

function formatEvidenceText(text) {
  const trimmed = text.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed;
  }
  return `${today()}: ${trimmed}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'session';
}

function uniqueLogPath(slug, force = false) {
  const date = today();
  const safeSlug = slugify(slug ?? 'session');
  const filename = `${date}--${safeSlug}.md`;
  const fullPath = path.join(LOG_DIR, filename);
  if (existsSync(fullPath) && !force) {
    throw new Error(`Log file already exists: ${filename} (use --force to overwrite)`);
  }
  return { fullPath, filename };
}

function ensureLogDirectory() {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

function normaliseAchievementValue(raw) {
  if (raw === '' || raw === undefined || raw === null) return '__DELETE__';
  const text = String(raw).trim();
  if (!text) return '__DELETE__';
  if (['true', 'false'].includes(text.toLowerCase())) {
    return text.toLowerCase() === 'true';
  }
  return raw;
}

function validateStatus(areasDoc, status) {
  const statuses = (areasDoc.statuses ?? []).map((entry) => entry.id);
  if (!statuses.length) return true;
  if (!statuses.includes(status)) {
    throw new Error(`Unknown topic status "${status}". Valid options: ${statuses.join(', ')}`);
  }
  return true;
}

function ensureNodeCanBeRemoved(state, nodeId, cascade) {
  const children = (state.nodes ?? []).filter((node) => node.parent === nodeId);
  if (children.length && !cascade) {
    const list = children.map((child) => child.id).join(', ');
    throw new Error(`Node "${nodeId}" has children (${list}). Use --cascade to remove descendants.`);
  }
  return children.map((child) => child.id);
}

function removeNode(state, nodeId) {
  state.nodes = (state.nodes ?? []).filter((node) => node.id !== nodeId);
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.flags.has('help') || args.flags.has('h')) {
    usage(0);
  }

  if (!existsSync(STATE_PATH)) {
    console.error('skill-tree.yaml not found.');
    process.exit(1);
  }

  const dryRun = args.flags.has('dry-run');
  const cascade = args.flags.has('cascade');
  const skipRender = args.flags.has('skip-render');

  const createSpecs = allArgs(args, 'create-node');
  const updateSpecs = allArgs(args, 'update-node');
  const removeSpecs = allArgs(args, 'remove-node');
  const topicUpserts = allArgs(args, 'topic-upsert');
  const topicRemovals = allArgs(args, 'topic-remove');
  const achievements = allArgs(args, 'achievement');
  const clearAchievements = allArgs(args, 'clear-achievement');
  const evidenceEntries = allArgs(args, 'evidence');
  const logEntries = allArgs(args, 'log');
  const logFile = firstArg(args, 'log-file');
  const logSlug = firstArg(args, 'log-slug');
  const force = args.flags.has('force');
  const checkIn = args.flags.has('check-in') || args.flags.has('c');

  const haveNodeOps = [
    args.flags.has('set-title'),
    args.flags.has('set-parent'),
    args.flags.has('readiness'),
    args.flags.has('set-readiness'),
    args.flags.has('level'),
    args.flags.has('confidence'),
    args.flags.has('cooldown'),
    args.flags.has('priority'),
    achievements.length,
    clearAchievements.length,
    evidenceEntries.length,
    args.flags.has('set-next-hint'),
    args.flags.has('clear-next-hint'),
    checkIn,
  ].some(Boolean);

  let targetNodeId = firstArg(args, 'node');
  const state = loadYaml(STATE_PATH, {});
  ensureStateLoaded(state);
  const areasDoc = loadYaml(AREAS_PATH, { statuses: [], areas: [] });

  const createdNodes = [];
  const removedNodes = [];
  const updatedNodes = [];
  const topicChanges = [];
  const evidenceAdded = [];
  const logsWritten = [];

  // Handle node creation
  for (const spec of createSpecs) {
    const data = parseKeyValueList(spec, '--create-node');
    assert(data.id, 'Creating a node requires an id (id=foo).');
    if (findNode(state, data.id)) {
      throw new Error(`Node "${data.id}" already exists.`);
    }
    const newNode = {
      id: data.id,
      title: data.title ?? data.id,
      parent: data.parent ?? null,
      level: data.level ?? 'learner',
      readiness: data.readiness ? clampReadiness(parseFloatMaybe(data.readiness, 'readiness')) : 0,
      test_cooldown: data.test_cooldown ? Number.parseInt(data.test_cooldown, 10) : 0,
      confidence: data.confidence ?? 'low',
      evidence: [],
      achievements: {},
      priority: data.priority ? parseBoolean(data.priority) : false,
      check_ins: data.check_ins ? Number.parseInt(data.check_ins, 10) : 0,
    };
    state.nodes.push(newNode);
    createdNodes.push(newNode.id);
    if (!targetNodeId) {
      targetNodeId = newNode.id;
    }
  }

  // Handle node removal
  if (removeSpecs.length) {
    for (const id of removeSpecs) {
      const nodeId = String(id).trim();
      ensureNode(state, nodeId);
      const descendants = ensureNodeCanBeRemoved(state, nodeId, cascade);
      removeNode(state, nodeId);
      removedNodes.push(nodeId, ...descendants);
      if (targetNodeId === nodeId) {
        targetNodeId = null;
      }
    }
  }

  let targetNode = null;
  if (targetNodeId) {
    targetNode = ensureNode(state, targetNodeId);
  } else if (haveNodeOps || topicUpserts.length || topicRemovals.length || logEntries.length || logFile) {
    throw new Error('You must provide --node <id> for the requested operations.');
  }

  // Node property updates
  if (targetNode) {
    if (args.flags.has('set-title')) {
      targetNode.title = firstArg(args, 'set-title');
      updatedNodes.push(targetNode.id);
    }
    if (args.flags.has('set-parent')) {
      const rawParent = firstArg(args, 'set-parent');
      const sentinel = ['none', 'null', ''];
      const cleaned = sentinel.includes(String(rawParent).toLowerCase()) ? null : rawParent;
      if (cleaned === targetNode.id) {
        throw new Error('A node cannot be its own parent.');
      }
      if (cleaned) {
        ensureNode(state, cleaned);
      }
      targetNode.parent = cleaned ?? null;
      updatedNodes.push(targetNode.id);
    }
    if (args.flags.has('set-readiness')) {
      const value = clampReadiness(parseFloatMaybe(firstArg(args, 'set-readiness'), '--set-readiness'));
      targetNode.readiness = value;
      updatedNodes.push(targetNode.id);
    }
    if (args.flags.has('readiness')) {
      const delta = parseFloatMaybe(firstArg(args, 'readiness'), '--readiness');
      const previous = Number.isFinite(targetNode.readiness) ? targetNode.readiness : 0;
      targetNode.readiness = clampReadiness(previous + delta);
      updatedNodes.push(targetNode.id);
    }
    if (args.flags.has('level')) {
      targetNode.level = firstArg(args, 'level');
      updatedNodes.push(targetNode.id);
    }
    if (args.flags.has('confidence')) {
      targetNode.confidence = firstArg(args, 'confidence');
      updatedNodes.push(targetNode.id);
    }
    if (args.flags.has('cooldown')) {
      targetNode.test_cooldown = Number.parseInt(firstArg(args, 'cooldown'), 10) || 0;
      updatedNodes.push(targetNode.id);
    }
    if (args.flags.has('priority')) {
      targetNode.priority = parseBoolean(firstArg(args, 'priority'));
      updatedNodes.push(targetNode.id);
    }
    if (args.flags.has('set-next-hint')) {
      targetNode.next_test_hint = firstArg(args, 'set-next-hint');
      updatedNodes.push(targetNode.id);
    }
    if (args.flags.has('clear-next-hint')) {
      delete targetNode.next_test_hint;
      updatedNodes.push(targetNode.id);
    }
    if (checkIn) {
      const current = Number.isFinite(targetNode.check_ins) ? targetNode.check_ins : 0;
      targetNode.check_ins = current + 1;
      updatedNodes.push(targetNode.id);
    }
    for (const spec of achievements) {
      const [key, ...rest] = String(spec).split('=');
      if (!key) {
        throw new Error('Achievement entries require key=value.');
      }
      const rawValue = rest.join('=');
      const value = normaliseAchievementValue(rawValue);
      if (value === '__DELETE__') {
        if (targetNode.achievements) {
          delete targetNode.achievements[key];
        }
      } else {
        if (!targetNode.achievements) targetNode.achievements = {};
        targetNode.achievements[key] = value;
      }
      updatedNodes.push(targetNode.id);
    }
    for (const key of clearAchievements) {
      if (targetNode.achievements) {
        delete targetNode.achievements[key];
        updatedNodes.push(targetNode.id);
      }
    }
    if (evidenceEntries.length) {
      if (!targetNode.evidence) targetNode.evidence = [];
      for (const entry of evidenceEntries) {
        const formatted = formatEvidenceText(String(entry));
        targetNode.evidence.push(formatted);
        evidenceAdded.push({ node: targetNode.id, entry: formatted });
      }
      updatedNodes.push(targetNode.id);
    }
  }

  // Explicit node property overrides via --update-node
  for (const spec of updateSpecs) {
    const payload = parseKeyValueList(spec, '--update-node');
    assert(payload.id || targetNodeId, 'Updating a node requires id=<node> or an active --node selection.');
    const nodeId = payload.id ?? targetNodeId;
    const node = ensureNode(state, nodeId);
    const updates = { ...payload };
    delete updates.id;
    if (updates.title === '') updates.title = '__DELETE__';
    if (updates.parent === '') updates.parent = null;
    ['readiness', 'test_cooldown', 'check_ins'].forEach((field) => {
      if (updates[field] !== undefined) {
        const number = parseFloatMaybe(updates[field], `${field}`);
        updates[field] = field === 'readiness' ? clampReadiness(number) : Math.round(number);
      }
    });
    if (updates.priority !== undefined) {
      updates.priority = parseBoolean(updates.priority);
    }
    applyNodeUpdate(node, updates);
    updatedNodes.push(node.id);
  }

  // Topic upserts/removals
  for (const spec of topicUpserts) {
    const data = parseKeyValueList(spec, '--topic-upsert');
    const nodeId = data.node ?? targetNodeId;
    assert(nodeId, 'Topic upsert requires node=<id> or an active --node.');
    assert(data.id, 'Topic upsert requires id=<topic-id>.');
    if (data.status) {
      validateStatus(areasDoc, data.status);
    }
    const container = ensureTopicContainer(areasDoc, nodeId);
    const existing = container.topics.find((topic) => topic.id === data.id);
    const payload = { ...data };
    delete payload.node;
    if (payload.priority !== undefined) {
      payload.priority = parseBoolean(payload.priority);
    }
    if (payload.last) {
      payload.last_covered = payload.last;
      delete payload.last;
    }
    if (payload.note === '') {
      delete payload.note;
    }
    if (existing) {
      Object.assign(existing, payload);
    } else {
      container.topics.push(payload);
    }
    topicChanges.push({ action: existing ? 'updated' : 'created', nodeId, topicId: payload.id });
  }

  for (const spec of topicRemovals) {
    const data = parseKeyValueList(spec, '--topic-remove');
    const nodeId = data.node ?? targetNodeId;
    assert(nodeId, 'Topic removal requires node=<id> or an active --node.');
    assert(data.id, 'Topic removal requires id=<topic-id>.');
    const removed = removeTopic(areasDoc, nodeId, data.id);
    if (!removed) {
      throw new Error(`Topic ${data.id} not found under node ${nodeId}.`);
    }
    topicChanges.push({ action: 'removed', nodeId, topicId: data.id });
  }

  // Logging support
  if (logEntries.length || logFile) {
    ensureLogDirectory();
    let body = '';
    if (logFile) {
      body = readFileSync(path.resolve(ROOT, logFile), 'utf8');
    }
    if (logEntries.length) {
      const joined = logEntries.join('\n');
      body = body ? `${body}\n${joined}` : joined;
    }
    if (!body.trim()) {
      throw new Error('Log content is empty. Provide --log "text" or --log-file <path>.');
    }
    if (!body.trim().startsWith('##')) {
      body = `## Check-in: ${today()}\n\n${body.trim()}\n`;
    }
    const slugSource = logSlug ?? targetNodeId ?? 'session';
    const { fullPath, filename } = uniqueLogPath(slugSource, force);
    if (!dryRun) {
      writeFileSync(fullPath, body, 'utf8');
    }
    logsWritten.push(filename);
  }

  const anythingChanged =
    createdNodes.length ||
    removedNodes.length ||
    updatedNodes.length ||
    topicChanges.length ||
    logsWritten.length;

  if (!anythingChanged) {
    console.log('No changes to apply.');
    return;
  }

  state.updated = today();

  if (!dryRun) {
    writeYaml(STATE_PATH, state);
    writeYaml(AREAS_PATH, areasDoc);
    if (!skipRender) {
      const result = spawnSync(process.execPath, [RENDER_SCRIPT], {
        cwd: ROOT,
        stdio: 'inherit',
        env: process.env,
      });
      if (result.status !== 0) {
        throw new Error('Renderer failed (rerun with --skip-render to bypass).');
      }
    }
  }

  const summary = [];
  if (createdNodes.length) {
    summary.push(`Created nodes: ${Array.from(new Set(createdNodes)).join(', ')}`);
  }
  if (removedNodes.length) {
    summary.push(`Removed nodes: ${Array.from(new Set(removedNodes)).join(', ')}`);
  }
  if (updatedNodes.length) {
    const list = Array.from(new Set(updatedNodes));
    summary.push(`Updated nodes: ${list.join(', ')}`);
  }
  if (topicChanges.length) {
    const lines = topicChanges.map((entry) => `${entry.action} ${entry.topicId} (node ${entry.nodeId})`);
    summary.push(`Topic changes: ${lines.join('; ')}`);
  }
  if (evidenceAdded.length) {
    const lines = evidenceAdded.map((entry) => `${entry.node}: ${entry.entry}`);
    summary.push(`Evidence added: ${lines.join('; ')}`);
  }
  if (logsWritten.length) {
    summary.push(`Log entries written: ${logsWritten.join(', ')}`);
  }

  const header = dryRun ? '[dry-run] ' : '';
  console.log(`${header}Skill tree update complete.`);
  summary.forEach((line) => console.log(` - ${line}`));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

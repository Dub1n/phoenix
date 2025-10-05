import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = process.env.SKILL_TREE_ROOT
  ? path.resolve(process.env.SKILL_TREE_ROOT)
  : path.resolve(__dirname, '../..');
const SKILL_DIR = path.join(ROOT, 'skill-tree');
const STATE_PATH = path.join(SKILL_DIR, 'skill-tree.yaml');
const OUTPUT_PATH = path.join(SKILL_DIR, 'skill-tree.md');
const LOG_DIR = path.join(SKILL_DIR, 'skill-log');
const AREAS_PATH = path.join(SKILL_DIR, 'areas.yaml');

function loadState() {
  if (!existsSync(STATE_PATH)) {
    throw new Error(`Missing skill tree state at ${STATE_PATH}`);
  }
  const raw = readFileSync(STATE_PATH, 'utf8');
  return YAML.parse(raw);
}

function loadAreas() {
  if (!existsSync(AREAS_PATH)) {
    return { statuses: [], areas: [] };
  }
  const raw = readFileSync(AREAS_PATH, 'utf8');
  return YAML.parse(raw) ?? { statuses: [], areas: [] };
}

function buildLadderMap(ladder = []) {
  const map = new Map();
  ladder.forEach((entry, index) => {
    map.set(entry.id, { ...entry, index });
  });
  return map;
}

function buildTree(nodes) {
  const map = new Map();
  const orphans = [];

  nodes.forEach((node) => {
    const enriched = {
      ...node,
      readiness: typeof node.readiness === 'number' ? node.readiness : 0,
      test_cooldown: Number.isInteger(node.test_cooldown) ? node.test_cooldown : 0,
      evidence: Array.isArray(node.evidence) ? node.evidence : [],
      achievements: node.achievements ?? {},
      children: [],
    };
    map.set(node.id, enriched);
  });

  for (const node of map.values()) {
    if (node.parent) {
      const parent = map.get(node.parent);
      if (parent) {
        parent.children.push(node);
      } else {
        orphans.push(node);
      }
    }
  }

  const roots = Array.from(map.values()).filter((node) => !node.parent || !map.has(node.parent));
  roots.push(...orphans.filter((node) => !roots.includes(node)));

  const sortByTitle = (a, b) => a.title.localeCompare(b.title);
  const sortChildren = (node) => {
    node.children.sort(sortByTitle);
    node.children.forEach(sortChildren);
  };
  roots.sort(sortByTitle).forEach(sortChildren);

  return { roots, map };
}

function formatLevel(levelId, ladderMap) {
  if (!levelId) return 'Unrated';
  const entry = ladderMap.get(levelId);
  return entry ? entry.label : levelId;
}

function levelScore(levelId, ladderMap) {
  const entry = ladderMap.get(levelId);
  return entry ? entry.index : null;
}

function progressBar(value, width = 10) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const filled = Math.round(clamped * width);
  const empty = width - filled;
  const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
  const percentage = Math.round(clamped * 100);
  return { bar, percentage };
}

function formatConfidence(confidence) {
  if (!confidence) return null;
  const normalised = String(confidence).toLowerCase();
  const capitalised = normalised.charAt(0).toUpperCase() + normalised.slice(1);
  return capitalised;
}

function findLatestEvidence(nodes) {
  let latest = null;

  const dateFromEvidence = (entry) => {
    if (typeof entry !== 'string') return null;
    const match = entry.match(/^(\d{4}-\d{2}-\d{2})\s*:?\s*(.*)$/);
    if (!match) return null;
    return { date: match[1], detail: match[2] ?? '', raw: entry };
  };

  for (const node of nodes) {
    for (const entry of node.evidence ?? []) {
      const parsed = dateFromEvidence(entry);
      if (!parsed) continue;
      if (!latest || parsed.date > latest.date) {
        latest = { ...parsed, node };
      }
    }
  }

  return latest;
}

function latestCheckIn() {
  if (!existsSync(LOG_DIR)) {
    return null;
  }
  const files = readdirSync(LOG_DIR);
  let latest = null;
  for (const file of files) {
    const match = file.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!match) continue;
    const date = match[1];
    if (!latest || date > latest.date) {
      latest = { date, file };
    }
  }
  return latest;
}

function capitalise(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildAreasIndex(areasDoc) {
  const statusMap = new Map();
  for (const entry of areasDoc.statuses ?? []) {
    statusMap.set(entry.id, entry);
  }

  const nodeMap = new Map();
  for (const area of areasDoc.areas ?? []) {
    const list = [];
    for (const topic of area.topics ?? []) {
      const status = statusMap.get(topic.status) ?? { label: topic.status ?? 'unknown' };
      list.push({ ...topic, statusLabel: status.label ?? topic.status ?? 'Unknown' });
    }
    if (list.length) {
      nodeMap.set(area.node, list);
    }
  }

  return { statusMap, nodeMap };
}

function renderAchievements(node) {
  const entries = Object.entries(node.achievements || {});
  if (!entries.length) return null;
  const lines = entries.map(([key, value]) => {
    const achieved = value !== false && value !== null && value !== 'false';
    const badge = achieved ? '◆' : ' ';
    const suffix = typeof value === 'string' && value !== 'true' ? ` (${value})` : '';
    return `    - [${badge}] ${key}${suffix}`;
  });
  return ['  - Achievements:', ...lines];
}

function renderEvidence(node) {
  if (!node.evidence || !node.evidence.length) return null;
  const lines = node.evidence.map((item) => `    - ${item}`);
  return ['  - Evidence:', ...lines];
}

function renderAreas(node, areasIndex) {
  if (!areasIndex) return null;
  const topics = areasIndex.nodeMap.get(node.id);
  if (!topics || !topics.length) return null;

  const lines = topics.map((topic) => {
    const parts = [`[${topic.statusLabel ?? topic.status ?? 'status'}] ${topic.label}`];
    if (topic.last_covered) parts.push(`last: ${topic.last_covered}`);
    if (topic.note) parts.push(`note: ${topic.note}`);
    if (topic.priority) parts.push('priority');
    return `    - ${parts.join(' — ')}`;
  });

  return ['  - Areas:', ...lines];
}

function renderNode(node, ladderMap, areasIndex, depth = 0) {
  const lines = [];
  const indent = '  '.repeat(depth);
  const levelLabel = formatLevel(node.level, ladderMap);
  const { bar, percentage } = progressBar(node.readiness ?? 0);
  const confidence = formatConfidence(node.confidence);
  const bits = [
    `Level: ${levelLabel}`,
    `Readiness: ${bar} ${percentage}%`,
  ];
  if (confidence) bits.push(`Confidence: ${confidence}`);
  if (node.test_cooldown && node.test_cooldown > 0) {
    bits.push(`Cooldown: ${node.test_cooldown}`);
  }
  if (node.priority) {
    bits.push('Priority: High');
  }
  lines.push(`${indent}- **${node.title}** — ${bits.join(' • ')}`);

  if (node.last_test) {
    const outcomeIcon = node.last_test.outcome === 'pass' ? '✅' : node.last_test.outcome === 'fail' ? '❌' : 'ℹ️';
    const summary = node.last_test.summary ? ` — ${node.last_test.summary}` : '';
    lines.push(`${indent}  - Last test: ${outcomeIcon} ${node.last_test.date ?? 'unknown'}${summary}`);
  }

  if (node.next_test_hint) {
    lines.push(`${indent}  - Next test hint: ${node.next_test_hint}`);
  }

  const evidenceLines = renderEvidence(node);
  if (evidenceLines) {
    lines.push(...evidenceLines.map((line) => `${indent}${line}`));
  }

  const achievementLines = renderAchievements(node);
  if (achievementLines) {
    lines.push(...achievementLines.map((line) => `${indent}${line}`));
  }

  const areaLines = renderAreas(node, areasIndex);
  if (areaLines) {
    lines.push(...areaLines.map((line) => `${indent}${line}`));
  }

  node.children.forEach((child) => {
    lines.push(...renderNode(child, ladderMap, areasIndex, depth + 1));
  });

  return lines;
}

function renderSummary({ nodes, ladder, areasIndex }) {
  const ladderMap = buildLadderMap(ladder);
  const scores = nodes
    .map((node) => levelScore(node.level, ladderMap))
    .filter((value) => value !== null);

  const count = scores.length;
  const total = scores.reduce((sum, value) => sum + value, 0);
  const avg = count ? total / count : null;
  const overallIndex = avg !== null ? Math.round(avg) : null;
  const overallLevel = overallIndex !== null && ladder[overallIndex] ? ladder[overallIndex].label : 'Unrated';

  const readinessValues = nodes.map((node) => node.readiness ?? 0);
  const avgReadiness = readinessValues.length
    ? (readinessValues.reduce((sum, value) => sum + value, 0) / readinessValues.length) * 100
    : null;
  const totalCheckIns = nodes.reduce(
    (sum, node) => sum + (Number.isFinite(node.check_ins) ? node.check_ins : 0),
    0,
  );

  const latest = latestCheckIn();
  const highlight = findLatestEvidence(nodes);

  const totalAreas = areasIndex ? [...areasIndex.nodeMap.values()].reduce((sum, list) => sum + list.length, 0) : 0;

  const summaryLines = [];
  summaryLines.push(`**Overall level:** ${overallLevel}${avg !== null ? ` (avg index ${avg.toFixed(2)})` : ''}`);
  summaryLines.push(`**Tracked domains:** ${nodes.length}`);
  if (avgReadiness !== null) {
    summaryLines.push(`**Average readiness:** ${avgReadiness.toFixed(0)}%`);
  }
  if (totalCheckIns) {
    summaryLines.push(`**Recorded check-ins:** ${totalCheckIns}`);
  }
  summaryLines.push(`**Last check-in:** ${latest ? `${latest.date} (${latest.file})` : 'n/a'}`);
  if (totalAreas) {
    summaryLines.push(`**Areas logged:** ${totalAreas}`);
  }

  if (highlight) {
    summaryLines.push('');
    summaryLines.push(`> **Recent highlight** — ${highlight.node.title} (${highlight.date})`);
    summaryLines.push(`> ${highlight.detail || highlight.raw}`);
  }

  return summaryLines.join('\n');
}

function renderTreeDocument(state, areasDoc) {
  const ladder = state.roles?.ladder ?? [];
  const ladderMap = buildLadderMap(ladder);
  const { roots, map } = buildTree(state.nodes ?? []);
  const areasIndex = buildAreasIndex(areasDoc);

  const header = ['# Skill Tree', '', renderSummary({ nodes: Array.from(map.values()), ladder, areasIndex }), ''];

  const body = [];
  roots.forEach((node) => {
    body.push(...renderNode(node, ladderMap, areasIndex, 0));
    body.push('');
  });

  const legend = [
    '---',
    'Legend: `[◆]` achievement complete · `[ ]` not yet complete · `priority` denotes high-focus topic',
  ];

  return [...header, ...body, ...legend].join('\n').trim() + '\n';
}

function main() {
  const state = loadState();
  const areasDoc = loadAreas();
  const markdown = renderTreeDocument(state, areasDoc);
  writeFileSync(OUTPUT_PATH, markdown, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Skill tree written to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

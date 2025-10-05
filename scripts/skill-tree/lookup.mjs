import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const SKILL_DIR = path.join(ROOT, 'skill-tree');
const STATE_PATH = path.join(SKILL_DIR, 'skill-tree.yaml');
const AREAS_PATH = path.join(SKILL_DIR, 'areas.yaml');

function loadYaml(filePath, fallback = {}) {
  if (!existsSync(filePath)) {
    return fallback;
  }
  const raw = readFileSync(filePath, 'utf8');
  return YAML.parse(raw) ?? fallback;
}

function buildMaps(state) {
  const nodeMap = new Map();
  (state.nodes ?? []).forEach((node) => {
    nodeMap.set(node.id, node);
  });
  const ladderMap = new Map();
  (state.roles?.ladder ?? []).forEach((entry, index) => {
    ladderMap.set(entry.id, { ...entry, index });
  });
  return { nodeMap, ladderMap };
}

function buildAreasIndex(areasDoc) {
  const statusMap = new Map();
  for (const entry of areasDoc.statuses ?? []) {
    statusMap.set(entry.id, entry);
  }
  const areaMap = new Map();
  for (const area of areasDoc.areas ?? []) {
    const list = [];
    for (const topic of area.topics ?? []) {
      const status = statusMap.get(topic.status);
      list.push({
        ...topic,
        statusLabel: status?.label ?? topic.status ?? 'unknown',
        statusDescription: status?.description ?? '',
      });
    }
    if (list.length) {
      areaMap.set(area.node, list);
    }
  }
  return { areaMap, statusMap };
}

function formatLevel(node, ladderMap) {
  if (!node.level) return 'Unrated';
  const entry = ladderMap.get(node.level);
  return entry ? entry.label : node.level;
}

function readinessPercent(node) {
  const value = Number.isFinite(node.readiness) ? Math.max(0, Math.min(1, node.readiness)) : 0;
  return Math.round(value * 100);
}

function pathToRoot(nodeId, nodeMap) {
  const path = [];
  let current = nodeMap.get(nodeId);
  const safety = nodeMap.size + 5;
  let guard = 0;
  while (current && guard < safety) {
    path.unshift(current);
    current = current.parent ? nodeMap.get(current.parent) : null;
    guard += 1;
  }
  return path;
}

function displayNode(node, maps, areasIndex) {
  const ladderMap = maps.ladderMap;
  const nodeMap = maps.nodeMap;
  const path = pathToRoot(node.id, nodeMap);
  const titlePath = path.map((n) => n.title).join(' → ');
  console.log(`\n=== ${node.title} (${node.id}) ===`);
  console.log(`Path: ${titlePath}`);
  console.log(`Level: ${formatLevel(node, ladderMap)}`);
  console.log(`Readiness: ${readinessPercent(node)}%`);
  if (node.test_cooldown) {
    console.log(`Cooldown remaining: ${node.test_cooldown}`);
  }
  if (node.confidence) {
    console.log(`Confidence: ${node.confidence}`);
  }
  if (node.priority) {
    console.log('Priority: High');
  }
  if (node.last_test) {
    console.log(`Last test: ${node.last_test.outcome ?? 'n/a'} on ${node.last_test.date ?? 'unknown'}${node.last_test.summary ? ` — ${node.last_test.summary}` : ''}`);
  }
  if (node.next_test_hint) {
    console.log(`Next test hint: ${node.next_test_hint}`);
  }
  if (node.evidence?.length) {
    console.log('Evidence:');
    node.evidence.slice(-5).forEach((entry) => console.log(`  • ${entry}`));
    if (node.evidence.length > 5) {
      console.log(`  … (${node.evidence.length - 5} more)`);
    }
  }
  const achievements = Object.entries(node.achievements ?? {});
  if (achievements.length) {
    console.log('Achievements:');
    achievements.forEach(([key, value]) => {
      const achieved = value !== false && value !== null && value !== 'false';
      const badge = achieved ? '◆' : ' ';
      const extra = typeof value === 'string' && value !== 'true' ? ` (${value})` : '';
      console.log(`  • [${badge}] ${key}${extra}`);
    });
  }

  const topics = areasIndex.areaMap.get(node.id) ?? [];
  if (topics.length) {
    console.log('Areas covered:');
    topics.forEach((topic) => {
      const pieces = [`  • [${topic.statusLabel}] ${topic.label}`];
      if (topic.last_covered) pieces.push(`last ${topic.last_covered}`);
      if (topic.note) pieces.push(`note: ${topic.note}`);
      if (topic.priority) pieces.push('priority');
      console.log(pieces.join(' — '));
    });
  }
}

function findMatches(tokens, nodeMap) {
  if (!tokens.length) return [];
  const lowerTokens = tokens.map((token) => token.toLowerCase());
  const exact = lowerTokens
    .map((token) => nodeMap.get(token))
    .filter(Boolean);
  const unmatchedTokens = lowerTokens.filter((token) => !nodeMap.has(token));
  const fuzzy = [];
  if (unmatchedTokens.length) {
    for (const node of nodeMap.values()) {
      const haystack = `${node.id} ${node.title}`.toLowerCase();
      if (unmatchedTokens.some((token) => haystack.includes(token))) {
        fuzzy.push(node);
      }
    }
  }
  const merged = new Map();
  [...exact, ...fuzzy].forEach((node) => {
    if (node) merged.set(node.id, node);
  });
  return Array.from(merged.values());
}

function main() {
  if (!existsSync(STATE_PATH)) {
    console.error('Skill tree state not found.');
    process.exit(1);
  }
  const state = loadYaml(STATE_PATH, {});
  const areas = loadYaml(AREAS_PATH, { statuses: [], areas: [] });
  const maps = buildMaps(state);
  const areasIndex = buildAreasIndex(areas);

  const tokens = process.argv.slice(2);
  if (!tokens.length) {
    console.log('Usage: npm run skill-tree:lookup -- <node-id-or-search-phrase> [more tokens]');
    console.log('Example: npm run skill-tree:lookup -- node_async_patterns');
    process.exit(0);
  }

  const matches = findMatches(tokens, maps.nodeMap);
  if (!matches.length) {
    console.log('No matching nodes.');
    process.exit(0);
  }

  matches.forEach((node) => displayNode(node, maps, areasIndex));
}

main();

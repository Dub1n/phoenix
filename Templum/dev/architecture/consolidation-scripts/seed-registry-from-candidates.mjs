#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.join(__dirname, '..', 'consolidation-state.json');
const candidatesPath = path.join(__dirname, '..', '..', 'safe-consolidation-candidates.md');

const NOTE_TIMESTAMP = '2025-09-14T18:00:00Z';
const NOTE_AUTHOR = 'safe-consolidation-candidates';
const OWNER_PLACEHOLDER = { agent: 'unassigned', claimedAt: NOTE_TIMESTAMP };

function sanitizeIso(value) {
  if (!value) {
    return null;
  }
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return null;
  }
  return new Date(time).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function derivePatternUpdatedAt(pattern) {
  const timestamps = [];
  const push = (value) => {
    const iso = sanitizeIso(value);
    if (iso) {
      timestamps.push(iso);
    }
  };
  Object.values(pattern.stageGates || {}).forEach((gate) => {
    push(gate.completedAt);
  });
  Object.values(pattern.lanes || {}).forEach((lane) => {
    push(lane.updatedAt);
    (lane.commands || []).forEach((cmd) => push(cmd.executedAt));
  });
  (pattern.notes || []).forEach((note) => push(note.timestamp));
  (pattern.activity || []).forEach((entry) => push(entry.timestamp));
  (pattern.handoff?.acknowledgements || []).forEach((ack) => push(ack.timestamp));

  if (!timestamps.length) {
    return null;
  }
  const latest = timestamps.reduce((max, value) => (value > max ? value : max), timestamps[0]);
  return latest;
}

function normaliseLinkTarget(raw) {
  if (!raw) {
    return null;
  }
  const linkMatch = /\[[^\]]*\]\(([^)]+)\)/.exec(raw);
  const target = linkMatch ? linkMatch[1] : raw;
  const cleaned = target.trim();
  if (!cleaned.startsWith('.')) {
    return cleaned;
  }
  const resolved = path.posix.normalize(path.posix.join('Templum/dev/architecture', cleaned));
  return resolved;
}

function stripTrailingImpactSuffix(title) {
  const parts = title.split(' - ');
  if (parts.length > 1) {
    return parts[0].trim();
  }
  return title.trim();
}

function cleanInlineMarkdown(value) {
  if (!value) {
    return value;
  }
  let result = value;
  result = result.replace(/\*\*(.+?)\*\*/g, '$1');
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');
  result = result.replace(/`([^`]+)`/g, '$1');
  result = result.replace(/\*(?!\s)([^*]+?)\*/g, '$1');
  result = result.replace(/_(?!\s)([^_]+?)_/g, '$1');
  return result.trim();
}

function buildNoteBody(data) {
  const lines = [];
  if (data.category) {
    lines.push(`Category: ${data.category}`);
  }
  if (data.patternDoc) {
    lines.push(`Pattern doc: ${data.patternDoc}`);
  }
  if (data.utilityFile) {
    lines.push(`Utility focus: ${data.utilityFile}`);
  }
  if (data.currentProblem) {
    lines.push(`Problem: ${data.currentProblem}`);
  }
  if (data.apiDesign) {
    lines.push(`API intent: ${data.apiDesign}`);
  }
  if (data.impact) {
    lines.push(`Impact: ${data.impact}`);
  }
  if (data.files && data.files.length) {
    lines.push('Starter files:');
    data.files.forEach((file) => {
      lines.push(`  • ${file}`);
    });
  }
  return lines.join('\n');
}

function collectCandidateSections(markdown) {
  const lines = markdown.split('\n');
  const sections = [];
  let currentCategory = null;
  let currentSection = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const categoryMatch = /^##\s+Category\s+\d+:\s+(.*)$/.exec(line);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }
    const patternMatch = /^###\s+(\d+)\.\s+(.*)$/.exec(line);
    if (patternMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        id: Number(patternMatch[1]),
        title: patternMatch[2].trim(),
        category: currentCategory,
        lines: []
      };
      continue;
    }
    if (currentSection) {
      currentSection.lines.push(rawLine);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function parseSection(section) {
  const data = {
    patternId: section.id,
    name: stripTrailingImpactSuffix(section.title),
    category: section.category,
    patternDoc: null,
    utilityFile: null,
    currentProblem: null,
    apiDesign: null,
    impact: null,
    files: []
  };

  let i = 0;
  while (i < section.lines.length) {
    const rawLine = section.lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }
    const patternMatch = /^\-\s*(?:\[[^\]]*\]\s*)?\*\*Pattern File\*\*:\s*(.*)$/.exec(trimmed);
    if (patternMatch) {
      const cleaned = normaliseLinkTarget(patternMatch[1]);
      data.patternDoc = cleaned || cleanInlineMarkdown(patternMatch[1]);
      i += 1;
      continue;
    }
    const utilityMatch = /^\-\s*(?:\[[^\]]*\]\s*)?\*\*Utility File\*\*:\s*(.*)$/.exec(trimmed);
    if (utilityMatch) {
      data.utilityFile = cleanInlineMarkdown(utilityMatch[1]);
      i += 1;
      continue;
    }
    const currentProblemMatch = /^\-\s*\*\*Current Problem\*\*:\s*(.*)$/.exec(trimmed);
    if (currentProblemMatch) {
      data.currentProblem = cleanInlineMarkdown(currentProblemMatch[1]);
      i += 1;
      continue;
    }
    const apiMatch = /^\-\s*\*\*API Design\*\*:\s*(.*)$/.exec(trimmed);
    if (apiMatch) {
      data.apiDesign = cleanInlineMarkdown(apiMatch[1]);
      i += 1;
      continue;
    }
    const impactMatch = /^\-\s*\*\*Impact\*\*:\s*(.*)$/.exec(trimmed);
    if (impactMatch) {
      data.impact = cleanInlineMarkdown(impactMatch[1]);
      i += 1;
      continue;
    }
    const filesHeaderMatch = /^\-\s*(?:\[[^\]]*\]\s*)?\*\*Files Using This Pattern\*\*:?/.exec(trimmed);
    if (filesHeaderMatch) {
      i += 1;
      const files = [];
      while (i < section.lines.length) {
        const nextRaw = section.lines[i];
        const nextTrimmed = nextRaw.trim();
        if (!nextTrimmed || !/^\-/.test(nextTrimmed)) {
          if (!nextTrimmed.startsWith('-') && !nextTrimmed.startsWith('*') && !nextTrimmed.startsWith('`')) {
            break;
          }
        }
        if (/^\s{0,3}[-*]\s/.test(nextRaw)) {
          let cleaned = nextRaw.replace(/^\s*[-*]\s*(?:\[[^\]]*\]\s*)?/, '');
          cleaned = cleanInlineMarkdown(cleaned);
          if (cleaned) {
            files.push(cleaned);
          }
        } else if (/^\s{2,}\-/.test(nextRaw)) {
          let cleaned = nextRaw.replace(/^\s+[-*]\s*(?:\[[^\]]*\]\s*)?/, '');
          cleaned = cleanInlineMarkdown(cleaned);
          if (cleaned) {
            files.push(cleaned);
          }
        } else {
          break;
        }
        i += 1;
      }
      data.files = files.slice(0, 5);
      continue;
    }
    i += 1;
  }

  return data;
}

function upsertPattern(registry, patternData) {
  const noteId = `stage1-import-pattern-${patternData.patternId}`;
  const noteEntry = {
    id: noteId,
    timestamp: NOTE_TIMESTAMP,
    author: NOTE_AUTHOR,
    scope: ['stage-1'],
    body: buildNoteBody(patternData)
  };

  const description = patternData.currentProblem || patternData.apiDesign || `See Stage 1 note for Pattern ${patternData.patternId}.`;

  const existing = registry.patterns.find((entry) => entry.patternId === patternData.patternId);
  if (existing) {
    if (!existing.notes) {
      existing.notes = [];
    }
    const idx = existing.notes.findIndex((note) => note.id === noteId);
    if (idx >= 0) {
      existing.notes[idx] = noteEntry;
    } else {
      existing.notes.push(noteEntry);
    }
    if (!existing.description) {
      existing.description = description;
    }
    if (!existing.updatedAt) {
      existing.updatedAt = derivePatternUpdatedAt(existing) || NOTE_TIMESTAMP;
    }
    return 'updated';
  }

  const newPattern = {
    patternId: patternData.patternId,
    name: patternData.name,
    description,
    stage: 1,
    owner: { ...OWNER_PLACEHOLDER },
    dependencies: [],
    stageGates: {
      '1': { status: 'open' }
    },
    lanes: {},
    handoff: {
      guardrails: [],
      sharedFiles: [],
      acknowledgements: []
    },
    updatedAt: NOTE_TIMESTAMP,
    notes: [noteEntry],
    evidence: [],
    activity: []
  };

  registry.patterns.push(newPattern);
  return 'inserted';
}

async function main() {
  const [registryRaw, candidatesRaw] = await Promise.all([
    readFile(registryPath, 'utf8'),
    readFile(candidatesPath, 'utf8')
  ]);

  const registry = JSON.parse(registryRaw);
  const sections = collectCandidateSections(candidatesRaw);
  const parsed = sections.map(parseSection);

  const results = { inserted: 0, updated: 0 };

  parsed.forEach((data) => {
    const action = upsertPattern(registry, data);
    results[action] += 1;
  });

  registry.patterns.sort((a, b) => a.patternId - b.patternId);
  registry.updatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

  console.log(`Registry updated: ${results.inserted} inserted, ${results.updated} updated from safe-consolidation-candidates.md`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

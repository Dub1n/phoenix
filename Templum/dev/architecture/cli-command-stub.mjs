#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import process from 'process';
import Ajv from 'ajv/dist/2020.js';
import { fileURLToPath } from 'url';
import readline from 'readline/promises';
import prettier from 'prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const registryPath = process.env.CONSOLIDATION_STATE_PATH || path.join(__dirname, 'consolidation-state.json');
const schemaPath = path.join(__dirname, 'consolidation-state.schema.json');

const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addFormat('date-time', (value) => !Number.isNaN(Date.parse(value)));

let schemaValidator = null;

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

async function getValidator() {
  if (!schemaValidator) {
    const schemaRaw = await readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaRaw);
    schemaValidator = ajv.compile(schema);
  }
  return schemaValidator;
}

async function loadRegistry() {
  const raw = await readFile(registryPath, 'utf8');
  const registry = JSON.parse(raw);
  const validate = await getValidator();
  if (!validate(registry)) {
    const errorText = validate.errors?.map((err) => `- ${err.instancePath || '<root>'} ${err.message || ''}`).join('\n') || 'unknown validation error';
    throw new Error(`Registry failed schema validation:\n${errorText}`);
  }
  return registry;
}

async function saveRegistry(registry, options = {}) {
  registry.updatedAt = nowIso();
  const validate = await getValidator();
  if (!validate(registry)) {
    const errorText = validate.errors?.map((err) => `- ${err.instancePath || '<root>'} ${err.message || ''}`).join('\n') || 'unknown validation error';
    throw new Error(`Registry failed schema validation:\n${errorText}`);
  }
  await writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n');
  if (!options.skipRegen) {
    await runRegen(registry, options.regenArgs || []);
  }
}

function touchPattern(pattern) {
  pattern.updatedAt = nowIso();
}

async function formatMarkdownIfNeeded(filePath, content) {
  if (!filePath.endsWith('.md')) {
    return content;
  }
  try {
    const config = await prettier.resolveConfig(filePath);
    const options = { ...(config || {}), parser: 'markdown' };
    return prettier.format(content, options);
  } catch (_) {
    return content;
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0) {
    return { command: 'help', params: [] };
  }
  const [command, ...params] = args;
  return { command, params };
}

const stageOrder = ['1', '2', '3', '4', '5', '6', '7'];
const stage6LaneOrder = ['6a', '6b', '6c', '6d'];
const stageGuidance = {
  '1': {
    title: 'Stage 1 — Scope & Inventory',
    reminders: [
      'Review the Stage 1 orientation note in this guide and compare it with current findings.',
      'Capture discovery commands, consumer inventory, and guardrails directly in the registry before moving forward.',
      'Leave a Stage 1 exit summary so Stage 2/3 owners inherit the right context.'
    ]
  },
  '2': {
    title: 'Stage 2 — Test-First Utility Updates',
    reminders: [
      'Author or refresh regression suites before implementation per Testing Guide expectations.',
      'Keep DI seams and shared utility guardrails aligned with Stage 1 notes.',
      'Record executed commands, logs, and outcomes in the registry so generated plans stay accurate.'
    ]
  },
  '3': {
    title: 'Stage 3 — Migration Orchestration',
    reminders: [
      'Capture Stage 4/6 ownership, sequencing, and lane definitions inside the Stage 3 note; use `create-lane` to add missing entries before marking the gate ready.',
      'Keep cross-pattern coordination in the registry (Stage 3 note + activity) so downstream owners have a single source.',
      'If dependencies shift, add a Stage 3 note and notify the affected pattern owners instead of editing manual trackers.'
    ]
  },
  '4': {
    title: 'Stage 4 — Prerequisites',
    reminders: [
      'Drive lanes 4a/4b/4c to `[x]` before migrations; keep statuses current in the registry.',
      'Attach gating evidence via lane command summaries/log paths so generated plans capture the run history.',
      'Re-run foundational suites after each lane and update the associated command entries.',
      'Add parallel prerequisites with `create-lane` when new scope emerges; stage gates stay accurate once the lane is defined.'
    ]
  },
  '5': {
    title: 'Stage 5 — Cohort Alignment & Prep',
    reminders: [
      'Capture guardrails/approvals in the registry (handoff block + Stage 5 notes) before unlocking lanes.',
      'Execute the Stage 6 gating battery and record command evidence before flipping Stage 6 lanes to assignable.',
      'Create or refine Stage 6 lanes with `create-lane` so cohorts inherit a complete migration slate.',
      'Use Stage 5 notes/activity entries to broadcast readiness; no manual schedule updates required.'
    ]
  },
  '6': {
    title: 'Stage 6 — Living Lanes',
    reminders: [
      'Work one lane at a time; coordinate assignments via schedule and activity log.',
      'Run mandated commands from the registry entry and attach logs before marking complete.',
      'Flip Stage 3 glyph back to `[~]` if new blockers require reprioritisation.',
      'Use `claim-lane` to avoid lane collisions as dependencies unlock.',
      'Introduce additional Stage 6 execution slices with `create-lane` when dependencies demand parallel tracks.'
    ]
  },
  '7': {
    title: 'Stage 7 — Validation & Close-Out',
    reminders: [
      'Execute Stage 7 validation battery (targeted suites + phase6 health/validation).',
      'Document outstanding follow-ups (e.g., real backend coverage) in notes or dev tasks.',
      'Update progress trackers and archive final evidence in the activity log.'
    ]
  }
};

const stageActionGuidance = {
  '1': [
    '1. Claim ownership if needed: `npm run consolidate -- claim <patternId> --agent <name>` (updates registry owner metadata).',
    '2. Log discovery work with `npm run consolidate -- stage-note <patternId> 1 --body "Consumers: …; Commands: rg …"` (scope auto-tags the note for Stage 1).',
    '3. Summarise outstanding risks, leave Stage 4 lane planning for the Stage 3 pass, and keep the note focused on hand-off guardrails.',
    '4. When ready, mark Stage 1 complete via `npm run consolidate -- update-stage <patternId> 1 --status complete --notes "Summary…" [--agent <name>]`.',
    'Need a full snapshot? Run `npm run consolidate -- status <patternId>` if additional detail is required before hand-off.'
  ],
  '2': [
    '1. Flip Stage 2 to `in_progress` when your TDD cycle begins: `npm run consolidate -- update-stage <patternId> 2 --status in_progress --notes "Tests planned…" [--agent <name>]`.',
    '2. Capture suites, guardrails, and coverage updates with `npm run consolidate -- stage-note <patternId> 2 --body "Suites: …; Guardrails: …" [--agent <name>]` so Stage 3 inherits the context.',
    '3. After the battery passes, record exit details/logs and mark Stage 2 `complete`: `npm run consolidate -- update-stage <patternId> 2 --status complete --notes "Results: …" [--files tmp/...log]`.',
    'Need more detail later? Re-run `guide --recent` to review the latest Stage 2 activity without opening external docs.'
  ],
  '3': [
    '1. Review Stage 4/6 targets with `npm run consolidate -- guide <patternId> --lanes` before planning migrations.',
    '2. Define missing Stage 4 lanes via `npm run consolidate -- create-lane <patternId> 4a --scope "Prereq description" --command "Command to run" [--depends 8:stage-2]` (repeat for each lane; CLI enforces scopes and command lists).',
    '3. Document orchestration owners, sequencing, and cross-pattern dependencies via `npm run consolidate -- stage-note <patternId> 3 --body "Lane owners: …; Dependencies: …" [--agent <name>]`.',
    '4. Once plans are locked, set Stage 3 `complete` with `npm run consolidate -- update-stage <patternId> 3 --status complete --notes "Ready for Stage 4" [--agent <name>]` (reopen with `in_progress` if plans change).',
    'Need coordination history? The Stage 3 note and `guide --recent` output are the single source of truth.'
  ],
  '4': [
    '1. Start each prerequisite by moving the lane to `in_progress`: `npm run consolidate -- update-lane <patternId> 4a --status in_progress --agent <name>`.',
    '2. Need another prerequisite slice? Add it first with `npm run consolidate -- create-lane <patternId> 4d --scope "New prerequisite" --command "Command to qualify"` so stage status stays authoritative.',
    '3. Run mandated commands and close the lane with evidence: `npm run consolidate -- update-lane <patternId> 4a --status complete --summary "Gating battery green" --files tmp/...log` (verify log paths manually; the CLI does not validate them).',
    '4. Use `npm run consolidate -- stage-note <patternId> 4 --body "Lane 4a evidence: …; Risks: …"` to log findings, then mark Stage 4 `complete` when every lane is `[x]`.',
    'Blocked prerequisites? Switch the lane to `blocked` (include a note) and let the CLI propagate scheduling hints.'
  ],
  '5': [
    '1. Maintain guardrails/shared files/approvals with `npm run consolidate -- update-handoff <patternId> --add-guardrail "…" --add-file "…" --add-ack "Agent"` (use `--remove-ack-agent <name>` or removal indexes to tidy existing entries). Stage 5 captures all required approvals; no per-lane approval steps are needed.',
    '2. Log alignment context (owners, risks, mitigations) via `npm run consolidate -- stage-note <patternId> 5 --body "Approvals: …; Risks: …" [--agent <name>]`.',
    '3. Stand up Stage 6 execution lanes with `npm run consolidate -- create-lane <patternId> 6a --scope "Migration focus" --command "Command to validate"` (define all required lanes before signalling readiness).',
    '4. After executing the gating battery, update related lanes with evidence and set Stage 5 to `ready`: `npm run consolidate -- update-stage <patternId> 5 --status ready --notes "Gating battery complete" [--files tmp/...log]`.',
    'Leave Stage 5 `in_progress` if approvals or evidence are missing—document the gap so Stage 6 owners stay aligned.'
  ],
  '6': [
    '1. Use `npm run consolidate -- guide <patternId> --lanes` to identify the next assignable lane before touching consumers.',
    '2. Need a fresh migration slice? Define it first with `npm run consolidate -- create-lane <patternId> 6d --scope "Parallel track" --command "Command to certify"` before claiming it.',
    '3. Claim the lane via `npm run consolidate -- claim-lane <patternId> [laneId] --agent <name>` so status flips to `in_progress` safely.',
    '4. Run the required commands and finish with `npm run consolidate -- update-lane <patternId> <laneId> --status complete --summary "Suites green" --files tmp/...log` once evidence is captured (verify log paths manually; the CLI does not validate them).',
    '5. Capture collaborative evidence or follow-ups without changing lane status via `npm run consolidate -- append-activity <patternId> --lane <laneId> --summary "Notes…" [--files tmp/...log] [--agent <name>]` (include `--stage` when logging broader updates).',
    '6. Review the handoff summary surfaced in the guide, then record cross-lane status in `npm run consolidate -- stage-note <patternId> 6 --body "Lanes complete: …; Blockers: …" [--agent <name>]`. Update Stage 6 to `complete` when all lanes are `[x]`.',
    'Encounter a blocker? Set the lane to `blocked`/`scheduled` and accept the CLI propagation prompts so downstream work stays in sync.'
  ],
  '7': [
    '1. Execute the validation battery (targeted suites, `npm run phase6-validation`, etc.) and gather log paths for evidence.',
    '2. Summarise validation results and follow-ups with `npm run consolidate -- stage-note <patternId> 7 --body "Phase6: …; Follow-ups: …" [--agent <name>]`.',
    '3. Close the pattern by marking Stage 7 `complete`: `npm run consolidate -- update-stage <patternId> 7 --status complete --notes "Validation complete" --files tmp/...log` (leave as `ready` if live validation is deferred).',
    'Hand-off context lives in the Stage 7 note—no extra docs required.'
  ]
};

const laneStatusMetadata = {
  pending: { glyph: '[ ]', label: 'to-do', autoAssignable: true },
  scheduled: { glyph: '[<]', label: 'queued (ready)', autoAssignable: true },
  in_progress: { glyph: '[~]', label: 'in-progress', autoAssignable: false },
  blocked: { glyph: '[?]', label: 'blocked', autoAssignable: false },
  needs_verification: { glyph: '[T]', label: 'needs verification', autoAssignable: false },
  ready_for_handoff: { glyph: '[D]', label: 'ready for hand-off', autoAssignable: false },
  complete: { glyph: '[x]', label: 'complete', autoAssignable: false },
  deferred: { glyph: '[>]', label: 'forwarded/deferred', autoAssignable: false },
  cancelled: { glyph: '[-]', label: 'cancelled', autoAssignable: false }
};

const laneStatusValues = Object.keys(laneStatusMetadata);
const autoAssignableLaneStatuses = laneStatusValues.filter((key) => laneStatusMetadata[key].autoAssignable);
const noteHeavyStatuses = ['blocked', 'needs_verification', 'ready_for_handoff'];

function findDependentLanes(pattern, laneId) {
  const dependents = [];
  const targetGate = `lane-${laneId}`;
  Object.entries(pattern.lanes || {}).forEach(([otherId, lane]) => {
    if (otherId === laneId) {
      return;
    }
    const dependencies = lane.dependencies || [];
    if (
      dependencies.some(
        (dep) => dep.patternId === pattern.patternId && dep.gate && dep.gate.toLowerCase() === targetGate
      )
    ) {
      dependents.push(otherId);
    }
  });
  return dependents.sort();
}

function findDependentStages(pattern, laneId) {
  const targetGate = `lane-${laneId}`;
  const stageDependents = new Set();
  Object.entries(pattern.lanes || {}).forEach(([otherId, lane]) => {
    const dependencies = lane.dependencies || [];
    dependencies.forEach((dep) => {
      if (dep.patternId === pattern.patternId && dep.gate && dep.gate.toLowerCase() === targetGate) {
        const stage = laneIdToStage(otherId);
        if (stage) {
          stageDependents.add(stage);
        }
      }
    });
  });
  return [...stageDependents].sort();
}

function getPatternById(registry, patternId) {
  return registry.patterns.find((entry) => entry.patternId === patternId) || null;
}

function stageGateSatisfied(registry, dep) {
  const stageId = dep.gate.slice(6);
  const targetPattern = getPatternById(registry, dep.patternId);
  if (!targetPattern) {
    return false;
  }
  const status = targetPattern.stageGates?.[stageId]?.status;
  return status === 'complete' || status === 'ready';
}

function laneDependencySatisfied(registry, dep) {
  const laneId = dep.gate.slice(5);
  const targetPattern = getPatternById(registry, dep.patternId);
  if (!targetPattern) {
    return false;
  }
  return targetPattern.lanes?.[laneId]?.status === 'complete';
}

function dependencySatisfied(registry, dep) {
  if (!dep.gate) {
    return false;
  }
  const gate = dep.gate.toLowerCase();
  if (!gate.startsWith('stage-') && !gate.startsWith('lane-')) {
    return false;
  }
  const normalizedDep = { ...dep, gate };
  if (gate.startsWith('stage-')) {
    return stageGateSatisfied(registry, normalizedDep);
  }
  return laneDependencySatisfied(registry, normalizedDep);
}

function laneDependenciesSatisfied(registry, pattern, laneId) {
  const lane = pattern.lanes?.[laneId];
  if (!lane) {
    return false;
  }
  const deps = lane.dependencies || [];
  if (!deps.length) {
    return true;
  }
  return deps.every((dep) => dependencySatisfied(registry, dep));
}

function orderedStage6Lanes(pattern) {
  const laneMap = pattern.lanes || {};
  const primary = stage6LaneOrder.filter((laneId) => laneMap[laneId]);
  const others = Object.keys(laneMap)
    .filter((laneId) => laneId.startsWith('6') && !stage6LaneOrder.includes(laneId))
    .sort();
  return [...primary, ...others];
}

const stageStatusMetadata = {
  open: { glyph: '[ ]', label: 'open' },
  scheduled: { glyph: '[<]', label: 'scheduled' },
  in_progress: { glyph: '[~]', label: 'in-progress' },
  blocked: { glyph: '[?]', label: 'blocked' },
  ready: { glyph: '[T]', label: 'ready' },
  complete: { glyph: '[x]', label: 'complete' },
  deferred: { glyph: '[>]', label: 'deferred' }
};

function normaliseStageId(value) {
  const stageId = String(value);
  if (!stageOrder.includes(stageId)) {
    throw new Error(`Invalid stage id: ${value}`);
  }
  return stageId;
}

function ensureStageGate(pattern, stageId) {
  const stageGates = pattern.stageGates || (pattern.stageGates = {});
  const gate = stageGates[stageId] || { status: 'open' };
  stageGates[stageId] = gate;
  return gate;
}

function setStageGate(pattern, stageId, status, options = {}) {
  const gate = ensureStageGate(pattern, stageId);
  gate.status = status;
  if (Object.prototype.hasOwnProperty.call(options, 'notes')) {
    if (options.notes === '') {
      delete gate.notes;
    } else {
      gate.notes = options.notes;
    }
  }
  if (Object.prototype.hasOwnProperty.call(options, 'completedAt')) {
    if (!options.completedAt) {
      delete gate.completedAt;
    } else {
      gate.completedAt = options.completedAt;
    }
  } else if (status === 'complete' || status === 'ready') {
    gate.completedAt = nowIso();
  } else {
    delete gate.completedAt;
  }
  return gate;
}

function recomputePatternStagePointer(pattern) {
  const nextStage = inferredStage(pattern);
  pattern.stage = Number.parseInt(nextStage, 10);
}

function inferredStage(pattern) {
  for (const stage of stageOrder) {
    const gate = pattern.stageGates?.[stage];
    if (!gate || gate.status !== 'complete') {
      return stage;
    }
  }
  return '7';
}

function nextIncompleteLane(pattern) {
  for (const status of autoAssignableLaneStatuses) {
    for (const laneId of stage6LaneOrder) {
      const lane = pattern.lanes?.[laneId];
      if (!lane) {
        continue;
      }
      if (lane.status === status) {
        return { id: laneId, lane };
      }
    }
  }
  return null;
}

function collectLaneCommands(lane) {
  const commands = lane.commands || [];
  return commands.map((cmd) => ({
    command: cmd.command,
    status: cmd.status || 'pending',
    summary: cmd.summary,
    executedAt: cmd.executedAt,
    logPath: cmd.logPath
  }));
}

function laneIdToStage(laneId) {
  const match = /^([0-9]+)/.exec(laneId);
  return match ? match[1] : null;
}

function glyphForLaneStatus(status) {
  return laneStatusMetadata[status]?.glyph || '[ ]';
}

function describeLaneStatus(status) {
  return laneStatusMetadata[status]?.label || status;
}

function printLaneDetail(pattern, laneId, lane) {
  console.log('');
  const glyph = glyphForLaneStatus(lane.status);
  const label = describeLaneStatus(lane.status);
  const assignable = laneStatusMetadata[lane.status]?.autoAssignable ? ' (assignable)' : '';
  console.log(`Lane ${laneId}: ${glyph} ${label}${assignable}`);
  console.log(`Scope: ${lane.scope}`);
  const commands = collectLaneCommands(lane);
  if (commands.length) {
    console.log('Required commands:');
    commands.forEach((cmd) => {
      const status = cmd.status ? ` [${cmd.status}]` : '';
      const executedAt = cmd.executedAt ? ` @ ${cmd.executedAt}` : '';
      const suffix = cmd.summary ? ` — ${cmd.summary}` : '';
      console.log(` - ${cmd.command}${status}${executedAt}${suffix}`);
      if (cmd.logPath) {
        console.log(`   log: ${cmd.logPath}`);
      }
    });
  } else {
    console.log('Required commands: (none recorded)');
  }
  const laneStage = laneIdToStage(laneId);
  const scopedNotes = collectAllNotesForLane(pattern, laneId);
  if (scopedNotes.length) {
    console.log('Notes:');
    scopedNotes.forEach((note) => {
      const author = note.author ? ` — ${note.author}` : '';
      console.log(` - ${note.timestamp}${author}: ${note.body}`);
    });
  }
}

function filterNotes(pattern, scopes) {
  const notes = pattern.notes || [];
  if (!scopes || scopes.length === 0) {
    return notes;
  }
  return notes.filter((note) => {
    const noteScope = note.scope || [];
    return noteScope.some((entry) => scopes.includes(entry));
  });
}

function collectAllNotesForLane(pattern, laneId) {
  const laneStage = laneIdToStage(laneId);
  const directNotes = filterNotes(pattern, [laneId]);
  const stageNotes = laneStage ? filterNotes(pattern, [`stage-${laneStage}`]) : [];
  const combined = [...directNotes];
  stageNotes.forEach((note) => {
    if (!combined.includes(note)) {
      combined.push(note);
    }
  });
  return combined.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

function printLaneNotes(pattern, laneId, indent = '    ') {
  const notes = collectAllNotesForLane(pattern, laneId);
  if (!notes.length) {
    return;
  }
  notes.forEach((note) => {
    const author = note.author ? ` — ${note.author}` : '';
    console.log(`${indent}• ${note.timestamp}${author}: ${note.body}`);
  });
}

function printGuide(pattern, options = {}) {
  console.log(`Guide for Pattern ${pattern.patternId} — ${pattern.name}`);

  const ownerAgent = pattern.owner?.agent || 'unknown';
  if (ownerAgent === 'unassigned') {
    console.log('Owner: (unassigned) — set the registry owner before advancing this pattern.');
  } else {
    const claimedSuffix = pattern.owner?.claimedAt ? ` (claimed ${pattern.owner.claimedAt})` : '';
    console.log(`Owner: ${ownerAgent}${claimedSuffix}`);
  }
  if (pattern.description) {
    console.log(`Summary: ${pattern.description}`);
  }

  const pointerStage = inferredStage(pattern);
  const stageGate = pattern.stageGates?.[pointerStage];
  if (stageGate?.status === 'in_progress') {
    options = { ...options, stage: pointerStage };
  }
  const stageOverride = options.stage;
  const laneId = options.lane || null;
  const laneStage = laneId ? laneIdToStage(laneId) : null;
  const pointerIndex = stageOrder.indexOf(pointerStage);
  let targetStage = stageOverride || laneStage || pointerStage;
  if (options.focusNext && !stageOverride && !laneId && pointerIndex >= 0) {
    const nextStage = stageOrder.slice(pointerIndex + 1).find((stage) => {
      const gate = pattern.stageGates?.[stage];
      if (gate && gate.status === 'complete') {
        return false;
      }
      if (stage === '6') {
        return Object.keys(pattern.lanes || {}).some((key) => key.startsWith('6'));
      }
      return true;
    });
    if (nextStage) {
      targetStage = nextStage;
    }
  }
  const focusedGate = pattern.stageGates?.[targetStage];
  const stageInfo = stageGuidance[targetStage];
  const pointerInfo = stageGuidance[pointerStage];
  let handoffPrinted = false;

  console.log('');
  const pointerGlyph = stageStatusMetadata[stageGate?.status || 'open']?.glyph || '[ ]';
  const targetGlyph = stageStatusMetadata[focusedGate?.status || 'open']?.glyph || '[ ]';
  if (!stageOverride && !laneId) {
    console.log(`Current stage: ${targetGlyph} ${targetStage}${stageInfo ? ` (${stageInfo.title})` : ''}`);
  } else {
    console.log(`Stage pointer: ${pointerGlyph} ${pointerStage}${pointerInfo ? ` (${pointerInfo.title})` : ''}`);
    console.log(`Focused stage: ${targetGlyph} ${targetStage}${stageInfo ? ` (${stageInfo.title})` : ''}`);
  }

  if (focusedGate) {
    console.log(`Status: ${focusedGate.status}`);
    if (focusedGate.completedAt) {
      console.log(`Completed at: ${focusedGate.completedAt}`);
    }
    if (focusedGate.notes) {
      console.log(`Notes: ${focusedGate.notes}`);
    }
  } else {
    console.log('Status: not yet started');
  }

  if (stageInfo?.reminders?.length) {
    console.log('');
    console.log('Stage reminders:');
    stageInfo.reminders.forEach((item) => console.log(` - ${item}`));
  }
  const stageActions = stageActionGuidance[targetStage];
  if (stageActions?.length) {
    console.log('');
    console.log('Stage actions:');
    stageActions.forEach((item) => console.log(` ${item}`));
  }

  if ((targetStage === '5' || targetStage === '6') && pattern.handoff) {
    printHandoffSummary(pattern);
    handoffPrinted = true;
  }

  if (targetStage === '6') {
    if (laneId) {
      const lane = pattern.lanes?.[laneId];
      if (!lane) {
        throw new Error(`Lane ${laneId} not found for pattern ${pattern.patternId}.`);
      }
      printLaneDetail(pattern, laneId, lane);
    } else if (options.showLanes) {
      const laneKeys = Object.keys(pattern.lanes || {}).filter((key) => key.startsWith('6')).sort();
      if (!laneKeys.length) {
        console.log('\nNo Stage 6 lanes defined.');
      } else {
        console.log('');
        if (!handoffPrinted) {
          printHandoffSummary(pattern, 'Handoff summary:');
          handoffPrinted = true;
          console.log('');
        }
        console.log('Stage 6 lane status:');
        laneKeys.forEach((key) => {
          const lane = pattern.lanes[key];
          if (!lane) {
            return;
          }
          console.log(` - ${formatLaneStatus(key, lane)}`);
          if (noteHeavyStatuses.includes(lane.status)) {
            printLaneNotes(pattern, key, '   ');
          }
        });
      }
    } else {
      const nextLane = nextIncompleteLane(pattern);
      if (nextLane) {
        printLaneDetail(pattern, nextLane.id, nextLane.lane);
      } else {
        const laneKeys = Object.keys(pattern.lanes || {}).filter((key) => key.startsWith('6')).sort();
        const hasIncomplete = laneKeys.some((key) => {
          const status = pattern.lanes[key]?.status;
          return status && status !== 'complete';
        });
        if (hasIncomplete) {
          console.log('\nNo Stage 6 lanes are currently auto-assignable. Lane status overview:');
          laneKeys.forEach((key) => {
            const lane = pattern.lanes[key];
            if (!lane) {
              return;
            }
            console.log(` - ${formatLaneStatus(key, lane)}`);
            if (noteHeavyStatuses.includes(lane.status)) {
              printLaneNotes(pattern, key, '   ');
            }
          });
        } else {
          console.log('\nAll Stage 6 lanes are complete.');
        }
      }
    }
  } else if (targetStage === '4' || targetStage === '5') {
    const lanePrefix = targetStage === '4' ? '4' : '6';
    const laneKeys = Object.keys(pattern.lanes || {}).filter((key) => key.startsWith(lanePrefix)).sort();
    if (laneId) {
      const lane = pattern.lanes?.[laneId];
      if (!lane) {
        throw new Error(`Lane ${laneId} not found for pattern ${pattern.patternId}.`);
      }
      printLaneDetail(pattern, laneId, lane);
    } else {
      if (laneKeys.length) {
        console.log('');
        console.log('Lane status:');
        laneKeys.forEach((key) => {
          const lane = pattern.lanes[key];
          if (!lane) {
            return;
          }
          console.log(` - ${formatLaneStatus(key, lane)}`);
          if (noteHeavyStatuses.includes(lane.status)) {
            printLaneNotes(pattern, key, '   ');
          }
        });
      }
      const scopedNotes = filterNotes(pattern, [`stage-${targetStage}`]);
      if (scopedNotes.length) {
        console.log('Notes:');
        scopedNotes.forEach((note) => {
          const author = note.author ? ` — ${note.author}` : '';
          console.log(` - ${note.timestamp}${author}: ${note.body}`);
        });
      }
    }
  } else {
    const scopedNotes = filterNotes(pattern, [`stage-${targetStage}`]);
    if (scopedNotes.length) {
      console.log('\nNotes:');
      scopedNotes.forEach((note) => {
        const author = note.author ? ` — ${note.author}` : '';
        console.log(` - ${note.timestamp}${author}: ${note.body}`);
      });
    }
  }
  if (options.showRecent && pattern.activity?.length) {
    console.log('\nRecent activity:');
    const recent = [...pattern.activity]
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, 3);
    recent.forEach((entry) => {
      const stageLabel = entry.stage.startsWith('lane-') ? entry.stage.replace('lane-', 'Lane ') : entry.stage;
      const agent = entry.agent ? ` — ${entry.agent}` : '';
      console.log(` - ${entry.timestamp} (${stageLabel})${agent}: ${entry.summary}`);
    });
  }
}

function parseGuideOptions(tokens) {
  const options = {};
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    switch (token) {
      case '--next':
      case '-n':
        if (options.focusNext) {
          throw new Error('guide: duplicate --next flag');
        }
        options.focusNext = true;
        break;
      case '--stage': {
        if (options.stage) {
          throw new Error('guide: duplicate --stage flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('guide: --stage requires a value');
        }
        const value = tokens[i + 1];
        if (!stageOrder.includes(value)) {
          throw new Error(`guide: invalid stage ${value}`);
        }
        options.stage = value;
        i += 1;
        break;
      }
      case '--lane': {
        if (options.lane) {
          throw new Error('guide: duplicate --lane flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('guide: --lane requires a value');
        }
        const value = tokens[i + 1].toLowerCase();
        if (!/^[0-9]+[a-z]$/i.test(value)) {
          throw new Error(`guide: invalid lane ${tokens[i + 1]}`);
        }
        options.lane = value;
        i += 1;
        break;
      }
      case '--lanes':
        options.showLanes = true;
        break;
      case '--recent':
        options.showRecent = true;
        break;
      default:
        throw new Error(`guide: unknown flag ${token}`);
    }
  }
  if (options.focusNext && (options.stage || options.lane)) {
    throw new Error('guide: --next cannot be combined with --stage/--lane');
  }
  if (options.stage && options.lane) {
    const laneStage = laneIdToStage(options.lane);
    if (laneStage && laneStage !== options.stage) {
      throw new Error(`guide: lane ${options.lane} belongs to stage ${laneStage}, not ${options.stage}`);
    }
  }
  return options;
}

function parseCommaList(value) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseDependencyDescriptor(value, context = 'create-lane') {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${context}: dependency entries cannot be blank`);
  }
  const parts = trimmed.split(':');
  if (parts.length !== 2) {
    throw new Error(`${context}: dependency entries must use patternId:gate format (received "${value}")`);
  }
  const patternToken = parts[0].trim();
  const gateToken = parts[1].trim().toLowerCase();
  const patternId = Number.parseInt(patternToken, 10);
  if (Number.isNaN(patternId) || patternId < 1) {
    throw new Error(`${context}: invalid dependency pattern id "${patternToken}"`);
  }
  if (!/^stage-[1-7]$/.test(gateToken) && !/^lane-[46][a-z]$/.test(gateToken)) {
    throw new Error(
      `${context}: dependency gate must be stage-<1-7> or lane-<4/6><id>; received "${parts[1].trim()}"`
    );
  }
  return { patternId, gate: gateToken };
}

function parseCreateLaneOptions(tokens) {
  const options = {
    commands: [],
    dependencies: []
  };
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    switch (token) {
      case '--scope': {
        if (options.scope) {
          throw new Error('create-lane: duplicate --scope flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('create-lane: --scope requires a value');
        }
        const value = tokens[i + 1].trim();
        if (!value) {
          throw new Error('create-lane: --scope cannot be blank');
        }
        options.scope = value;
        i += 1;
        break;
      }
      case '--command': {
        if (i + 1 >= tokens.length) {
          throw new Error('create-lane: --command requires a value');
        }
        const value = tokens[i + 1];
        if (!value.trim()) {
          throw new Error('create-lane: --command cannot be blank');
        }
        options.commands.push(value);
        i += 1;
        break;
      }
      case '--status': {
        if (options.status) {
          throw new Error('create-lane: duplicate --status flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('create-lane: --status requires a value');
        }
        options.status = tokens[i + 1].toLowerCase();
        i += 1;
        break;
      }
      case '--depends': {
        if (i + 1 >= tokens.length) {
          throw new Error('create-lane: --depends requires a value');
        }
        const entries = parseCommaList(tokens[i + 1]);
        if (!entries.length) {
          throw new Error('create-lane: --depends value cannot be empty');
        }
        const parsed = entries.map((entry) => parseDependencyDescriptor(entry, 'create-lane'));
        options.dependencies.push(...parsed);
        i += 1;
        break;
      }
      case '--note': {
        if (options.note) {
          throw new Error('create-lane: duplicate --note flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('create-lane: --note requires a value');
        }
        const value = tokens[i + 1];
        if (!value.trim()) {
          throw new Error('create-lane: --note cannot be blank');
        }
        options.note = value;
        i += 1;
        break;
      }
      case '--agent': {
        if (options.agent) {
          throw new Error('create-lane: duplicate --agent flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('create-lane: --agent requires a value');
        }
        options.agent = tokens[i + 1];
        i += 1;
        break;
      }
      case '--summary': {
        if (options.summary) {
          throw new Error('create-lane: duplicate --summary flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('create-lane: --summary requires a value');
        }
        options.summary = tokens[i + 1];
        i += 1;
        break;
      }
      default:
        throw new Error(`create-lane: unknown flag ${token}`);
    }
  }
  if (options.commands.length) {
    options.commands = [...new Set(options.commands)];
  }
  if (options.dependencies.length) {
    const seen = new Set();
    options.dependencies = options.dependencies.filter((dep) => {
      const key = `${dep.patternId}:${dep.gate}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  return options;
}

function parseLaneUpdateOptions(tokens) {
  const options = {
    block: [],
    queue: [],
    files: [],
    skipPrompt: false
  };
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    switch (token) {
      case '--status': {
        if (options.status) {
          throw new Error('update-lane: duplicate --status flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('update-lane: --status requires a value');
        }
        const value = tokens[i + 1].toLowerCase();
        options.status = value;
        i += 1;
        break;
      }
      case '--note': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-lane: --note requires a value');
        }
        options.note = options.note ? `${options.note}\n${tokens[i + 1]}` : tokens[i + 1];
        i += 1;
        break;
      }
      case '--agent': {
        if (options.agent) {
          throw new Error('update-lane: duplicate --agent flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('update-lane: --agent requires a value');
        }
        options.agent = tokens[i + 1];
        i += 1;
        break;
      }
      case '--summary': {
        if (options.summary) {
          throw new Error('update-lane: duplicate --summary flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('update-lane: --summary requires a value');
        }
        options.summary = tokens[i + 1];
        i += 1;
        break;
      }
      case '--block': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-lane: --block requires a value');
        }
        const lanes = parseCommaList(tokens[i + 1].toLowerCase());
        options.block.push(...lanes);
        i += 1;
        break;
      }
      case '--queue': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-lane: --queue requires a value');
        }
        const lanes = parseCommaList(tokens[i + 1].toLowerCase());
        options.queue.push(...lanes);
        i += 1;
        break;
      }
      case '--files': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-lane: --files requires a value');
        }
        const files = parseCommaList(tokens[i + 1]);
        options.files.push(...files);
        i += 1;
        break;
      }
      case '--no-prompt': {
        options.skipPrompt = true;
        break;
      }
      default:
        throw new Error(`update-lane: unknown flag ${token}`);
    }
  }
  if (options.block.length) {
    options.block = [...new Set(options.block)];
  }
  if (options.queue.length) {
    options.queue = [...new Set(options.queue)];
  }
  if (options.files.length) {
    options.files = [...new Set(options.files)];
  }
  return options;
}

function parseAppendActivityOptions(tokens) {
  const options = {
    files: []
  };
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    switch (token) {
      case '--scope': {
        if (options.scope) {
          throw new Error('append-activity: duplicate --scope flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('append-activity: --scope requires a value');
        }
        options.scope = tokens[i + 1];
        i += 1;
        break;
      }
      case '--stage': {
        if (options.stage) {
          throw new Error('append-activity: duplicate --stage flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('append-activity: --stage requires a value');
        }
        options.stage = tokens[i + 1];
        i += 1;
        break;
      }
      case '--lane': {
        if (options.lane) {
          throw new Error('append-activity: duplicate --lane flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('append-activity: --lane requires a value');
        }
        options.lane = tokens[i + 1];
        i += 1;
        break;
      }
      case '--summary': {
        if (options.summary) {
          throw new Error('append-activity: duplicate --summary flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('append-activity: --summary requires a value');
        }
        options.summary = tokens[i + 1];
        i += 1;
        break;
      }
      case '--agent': {
        if (options.agent) {
          throw new Error('append-activity: duplicate --agent flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('append-activity: --agent requires a value');
        }
        options.agent = tokens[i + 1];
        i += 1;
        break;
      }
      case '--files': {
        if (i + 1 >= tokens.length) {
          throw new Error('append-activity: --files requires a value');
        }
        const files = parseCommaList(tokens[i + 1]);
        options.files.push(...files);
        i += 1;
        break;
      }
      case '--timestamp': {
        if (options.timestamp) {
          throw new Error('append-activity: duplicate --timestamp flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('append-activity: --timestamp requires a value');
        }
        const value = tokens[i + 1];
        if (Number.isNaN(Date.parse(value))) {
          throw new Error('append-activity: --timestamp must be a valid ISO8601 value');
        }
        options.timestamp = value;
        i += 1;
        break;
      }
      default:
        throw new Error(`append-activity: unknown flag ${token}`);
    }
  }
  if (options.files.length) {
    options.files = [...new Set(options.files)];
  }
  return options;
}

function printHandoffSummary(pattern, heading = '\nHandoff summary:') {
  const guardrails = pattern.handoff?.guardrails || [];
  const sharedFiles = pattern.handoff?.sharedFiles || [];
  const acknowledgements = pattern.handoff?.acknowledgements || [];
  if (!guardrails.length && !sharedFiles.length && !acknowledgements.length) {
    return;
  }
  console.log(heading);
  if (guardrails.length) {
    console.log(' Guardrails:');
    guardrails.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry}`);
    });
  }
  if (sharedFiles.length) {
    console.log(' Shared files:');
    sharedFiles.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry}`);
    });
  }
  if (acknowledgements.length) {
    console.log(' Acknowledgements:');
    acknowledgements.forEach((entry, index) => {
      const noteSuffix = entry.note ? ` — ${entry.note}` : '';
      console.log(`  ${index + 1}. ${entry.agent} @ ${entry.timestamp}${noteSuffix}`);
    });
  }
}

function parseStageUpdateOptions(tokens) {
  const options = {
    files: []
  };
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    switch (token) {
      case '--status': {
        if (options.status) {
          throw new Error('update-stage: duplicate --status flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('update-stage: --status requires a value');
        }
        options.status = tokens[i + 1].toLowerCase();
        i += 1;
        break;
      }
      case '--notes': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-stage: --notes requires a value');
        }
        options.notes = tokens[i + 1];
        options.notesProvided = true;
        i += 1;
        break;
      }
      case '--clear-notes':
        options.notes = '';
        options.notesProvided = true;
        break;
      case '--agent': {
        if (options.agent) {
          throw new Error('update-stage: duplicate --agent flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('update-stage: --agent requires a value');
        }
        options.agent = tokens[i + 1];
        i += 1;
        break;
      }
      case '--summary': {
        if (options.summary) {
          throw new Error('update-stage: duplicate --summary flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('update-stage: --summary requires a value');
        }
        options.summary = tokens[i + 1];
        i += 1;
        break;
      }
      case '--completed-at': {
        if (options.completedAtProvided) {
          throw new Error('update-stage: duplicate --completed-at flag');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('update-stage: --completed-at requires a value');
        }
        options.completedAt = tokens[i + 1];
        options.completedAtProvided = true;
        i += 1;
        break;
      }
      case '--files': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-stage: --files requires a value');
        }
        const files = parseCommaList(tokens[i + 1]);
        options.files.push(...files);
        i += 1;
        break;
      }
      default:
        throw new Error(`update-stage: unknown flag ${token}`);
    }
  }
  if (options.files.length) {
    options.files = [...new Set(options.files)];
  }
  return options;
}

function parseHandoffOptions(tokens) {
  const options = {
    addGuardrails: [],
    removeGuardrails: [],
    clearGuardrails: false,
    addFiles: [],
    removeFiles: [],
    clearFiles: false,
    addAcks: [],
    removeAcks: [],
    removeAckAgents: [],
    clearAcks: false,
    listOnly: false
  };
  let pendingAck = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    switch (token) {
      case '--add-guardrail': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-handoff: --add-guardrail requires a value');
        }
        options.addGuardrails.push(tokens[i + 1]);
        i += 1;
        break;
      }
      case '--remove-guardrail': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-handoff: --remove-guardrail requires an index');
        }
        const index = Number.parseInt(tokens[i + 1], 10);
        if (Number.isNaN(index) || index < 1) {
          throw new Error('update-handoff: --remove-guardrail expects a 1-based index');
        }
        options.removeGuardrails.push(index - 1);
        i += 1;
        break;
      }
      case '--clear-guardrails':
        options.clearGuardrails = true;
        break;
      case '--add-file': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-handoff: --add-file requires a value');
        }
        options.addFiles.push(tokens[i + 1]);
        i += 1;
        break;
      }
      case '--remove-file': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-handoff: --remove-file requires an index');
        }
        const index = Number.parseInt(tokens[i + 1], 10);
        if (Number.isNaN(index) || index < 1) {
          throw new Error('update-handoff: --remove-file expects a 1-based index');
        }
        options.removeFiles.push(index - 1);
        i += 1;
        break;
      }
      case '--clear-files':
        options.clearFiles = true;
        break;
      case '--add-ack': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-handoff: --add-ack requires an agent value');
        }
        pendingAck = { agent: tokens[i + 1] };
        options.addAcks.push(pendingAck);
        i += 1;
        break;
      }
      case '--ack-note': {
        if (!pendingAck) {
          throw new Error('update-handoff: --ack-note must follow --add-ack');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('update-handoff: --ack-note requires a value');
        }
        pendingAck.note = tokens[i + 1];
        i += 1;
        break;
      }
      case '--ack-timestamp': {
        if (!pendingAck) {
          throw new Error('update-handoff: --ack-timestamp must follow --add-ack');
        }
        if (i + 1 >= tokens.length) {
          throw new Error('update-handoff: --ack-timestamp requires a value');
        }
        const ts = tokens[i + 1];
        if (Number.isNaN(Date.parse(ts))) {
          throw new Error('update-handoff: --ack-timestamp must be a valid ISO8601 timestamp');
        }
        pendingAck.timestamp = new Date(ts).toISOString().replace(/\.\d{3}Z$/, 'Z');
        i += 1;
        break;
      }
      case '--remove-ack': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-handoff: --remove-ack requires an index');
        }
        const index = Number.parseInt(tokens[i + 1], 10);
        if (Number.isNaN(index) || index < 1) {
          throw new Error('update-handoff: --remove-ack expects a 1-based index');
        }
        options.removeAcks.push(index - 1);
        i += 1;
        break;
      }
      case '--remove-ack-agent': {
        if (i + 1 >= tokens.length) {
          throw new Error('update-handoff: --remove-ack-agent requires a value');
        }
        options.removeAckAgents.push(tokens[i + 1]);
        i += 1;
        break;
      }
      case '--clear-acks':
        options.clearAcks = true;
        break;
      case '--list':
        options.listOnly = true;
        break;
      default:
        throw new Error(`update-handoff: unknown flag ${token}`);
    }
  }
  return options;
}

async function promptPropagationTargets(pattern, laneId, options) {
  const dependents = findDependentLanes(pattern, laneId);
  const dependentStages = findDependentStages(pattern, laneId);
  if (!options.skipPrompt) {
    const depStageMessage = dependentStages.length
      ? `Stage alignment impacted: ${dependentStages.map((stage) => `Stage ${stage}`).join(', ')}`
      : null;
    if (depStageMessage) {
      console.log(depStageMessage);
    }
    if (dependents.length) {
      console.log(`Dependent lanes: ${dependents.join(', ')}`);
    }
  }

  const defaultBlocked = options.status === 'blocked' ? dependents : [];
  const defaultQueued = options.status !== 'blocked' ? dependents : [];

  if (options.skipPrompt) {
    if (options.block.length === 0 && defaultBlocked.length) {
      options.block.push(...defaultBlocked);
    }
    if (options.queue.length === 0 && defaultQueued.length) {
      options.queue.push(...defaultQueued);
    }
    return options;
  }
  if (options.block.length || options.queue.length) {
    return options;
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return options;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const blockDefault = defaultBlocked.join(', ');
    const blockPrompt = blockDefault
      ? `Lanes to mark blocked (comma separated, default ${blockDefault || 'none'}): `
      : 'Lanes to mark blocked (comma separated, blank for none): ';
    const blockAnswer = (await rl.question(blockPrompt)).trim();
    const blockValue = blockAnswer || blockDefault;
    if (blockValue) {
      options.block = parseCommaList(blockValue.toLowerCase());
    }

    const queueDefault = defaultQueued.filter((laneId) => !options.block.includes(laneId)).join(', ');
    const queuePrompt = queueDefault
      ? `Lanes to mark scheduled (comma separated, default ${queueDefault || 'none'}): `
      : 'Lanes to mark scheduled (comma separated, blank for none): ';
    const queueAnswer = (await rl.question(queuePrompt)).trim();
    const queueValue = queueAnswer || queueDefault;
    if (queueValue) {
      options.queue = parseCommaList(queueValue.toLowerCase());
    }
  } finally {
    rl.close();
  }
  if (options.block.length) {
    options.block = [...new Set(options.block)];
  }
  if (options.queue.length) {
    options.queue = [...new Set(options.queue)];
  }
  return options;
}

function propagateLaneStatuses(pattern, originLaneId, options) {
  const updated = { blocked: [], scheduled: [] };
  const touchedStages = new Set();
  const reasonLine = options.note || options.summary || '';
  const noteSuffix = reasonLine ? ` — ${reasonLine.split('\n')[0]}` : '';

  const markLane = (laneId, status, prefix) => {
    if (laneId === originLaneId) {
      return;
    }
    const lane = pattern.lanes?.[laneId];
    if (!lane) {
      return;
    }
    lane.status = status;
    lane.updatedAt = nowIso();
    lane.notes = lane.notes ? `${lane.notes}\n${prefix}${originLaneId}${noteSuffix}` : `${prefix}${originLaneId}${noteSuffix}`;
    touchedStages.add(laneIdToStage(laneId));
    if (status === 'blocked') {
      updated.blocked.push(laneId);
    } else if (status === 'scheduled') {
      updated.scheduled.push(laneId);
    }
  };

  options.block.forEach((laneId) => markLane(laneId, 'blocked', 'Blocked due to '));
  options.queue.forEach((laneId) => markLane(laneId, 'scheduled', 'Scheduled behind '));

  touchedStages.forEach((stageId) => {
    if (stageId) {
      recomputeStageGateFromLanes(pattern, stageId);
    }
  });

  return updated;
}

function promoteDependentLanes(registry, pattern, originLaneId) {
  const promoted = [];
  const dependents = findDependentLanes(pattern, originLaneId);
  dependents.forEach((laneId) => {
    const lane = pattern.lanes?.[laneId];
    if (!lane) {
      return;
    }
    if (lane.status !== 'blocked') {
      return;
    }
    if (!laneDependenciesSatisfied(registry, pattern, laneId)) {
      return;
    }
    lane.status = 'scheduled';
    lane.updatedAt = nowIso();
    const note = `Auto-scheduled after lane ${originLaneId} completion`;
    lane.notes = lane.notes ? `${lane.notes}\n${note}` : note;
    const stage = laneIdToStage(laneId);
    if (stage) {
      recomputeStageGateFromLanes(pattern, stage);
    }
    promoted.push(laneId);
  });
  return promoted;
}

function formatStageStatus(stageGate, stageNumber) {
  if (!stageGate) {
    return `Stage ${stageNumber}: (no data)`;
  }
  const glyph = stageStatusMetadata[stageGate.status]?.glyph || '[ ]';
  const parts = [`Stage ${stageNumber}: ${glyph} ${stageGate.status}`];
  if (stageGate.completedAt) {
    parts.push(`@ ${stageGate.completedAt}`);
  }
  if (stageGate.notes) {
    parts.push(`— ${stageGate.notes}`);
  }
  return parts.join(' ');
}

function formatLaneStatus(laneId, lane) {
  const glyph = glyphForLaneStatus(lane.status);
  const label = describeLaneStatus(lane.status);
  const assignable = laneStatusMetadata[lane.status]?.autoAssignable ? ' (assignable)' : '';
  const parts = [`${laneId}: ${glyph} ${label}${assignable}`];
  if (lane.updatedAt) {
    parts.push(`@ ${lane.updatedAt}`);
  }
  parts.push(`— ${lane.scope}`);
  return parts.join(' ');
}

function evaluateStageStatusFromLanes(statuses) {
  if (!statuses.length) {
    return 'open';
  }
  if (statuses.every((status) => status === 'complete')) {
    return 'complete';
  }
  if (statuses.some((status) => status === 'blocked')) {
    return 'blocked';
  }
  if (statuses.some((status) => status === 'needs_verification')) {
    return 'in_progress';
  }
  if (statuses.some((status) => status === 'in_progress')) {
    return 'in_progress';
  }
  if (statuses.some((status) => status === 'ready_for_handoff') && statuses.every((status) => status === 'ready_for_handoff' || status === 'complete')) {
    return 'ready';
  }
  if (statuses.some((status) => status === 'scheduled') && statuses.every((status) => ['scheduled', 'complete', 'ready_for_handoff'].includes(status))) {
    return 'scheduled';
  }
  if (statuses.some((status) => status === 'deferred') || statuses.some((status) => status === 'cancelled')) {
    return 'deferred';
  }
  if (statuses.some((status) => status === 'pending')) {
    return 'open';
  }
  return 'in_progress';
}

function recomputeStageGateFromLanes(pattern, stageId) {
  const lanePrefix = stageId === '4' ? '4' : stageId === '6' ? '6' : null;
  if (!lanePrefix) {
    return;
  }
  const laneKeys = Object.keys(pattern.lanes || {}).filter((key) => key.startsWith(lanePrefix)).sort();
  if (laneKeys.length === 0) {
    return;
  }
  const statuses = laneKeys.map((key) => pattern.lanes[key]?.status || 'pending');
  const nextStatus = evaluateStageStatusFromLanes(statuses);
  const stageGates = pattern.stageGates || (pattern.stageGates = {});
  const gate = stageGates[stageId] || (stageGates[stageId] = { status: 'open' });
  gate.status = nextStatus;
  if (nextStatus === 'complete') {
    if (!gate.completedAt) {
      gate.completedAt = nowIso();
    }
  } else {
    if (gate.completedAt) {
      delete gate.completedAt;
    }
  }
}

function setLaneStatus(pattern, laneId, status, note) {
  const statusValue = status.toLowerCase();
  if (!laneStatusMetadata[statusValue]) {
    throw new Error(`Unknown lane status: ${status}`);
  }
  const lane = pattern.lanes?.[laneId];
  if (!lane) {
    throw new Error(`Lane ${laneId} not found for pattern ${pattern.patternId}.`);
  }
  lane.status = statusValue;
  lane.updatedAt = nowIso();
  if (note) {
    lane.notes = lane.notes ? `${lane.notes}\n${note}` : note;
  }
  const stage = laneIdToStage(laneId);
  if (stage) {
    recomputeStageGateFromLanes(pattern, stage);
  }
}

function printStatus(pattern, updatedAt) {
  console.log(`Pattern ${pattern.patternId} — ${pattern.name}`);
  console.log(`Stage pointer: ${pattern.stage}`);
  if (pattern.description) {
    console.log(pattern.description);
  }
  console.log('');
  console.log('Stage gates:');
  const gateKeys = Object.keys(pattern.stageGates || {}).sort((a, b) => Number(a) - Number(b));
  gateKeys.forEach((key) => {
    console.log(`  ${formatStageStatus(pattern.stageGates[key], key)}`);
  });
  if (gateKeys.length === 0) {
    console.log('  (no stage gate metadata)');
  }
  console.log('');
  const printLaneGroup = (prefix, heading) => {
    console.log(heading);
    const laneKeys = Object.keys(pattern.lanes || {}).filter((k) => k.startsWith(prefix)).sort();
    if (laneKeys.length === 0) {
      console.log('  (no lanes recorded)');
      return;
    }
    laneKeys.forEach((laneId) => {
      const lane = pattern.lanes[laneId];
      console.log(`  ${formatLaneStatus(laneId, lane)}`);
      if (noteHeavyStatuses.includes(lane.status)) {
        printLaneNotes(pattern, laneId, '    ');
      }
      pattern.lanes[laneId].commands.forEach((cmd) => {
        const status = cmd.status ? ` [${cmd.status}]` : '';
        const executedAt = cmd.executedAt ? ` @ ${cmd.executedAt}` : '';
        const suffix = cmd.summary ? ` — ${cmd.summary}` : '';
        console.log(`    • ${cmd.command}${status}${executedAt}${suffix}`);
      });
    });
  };

  printLaneGroup('4', 'Stage 4 lanes:');
  printLaneGroup('6', 'Stage 6 lanes:');

  const nextAssignable = nextIncompleteLane(pattern);
  if (nextAssignable) {
    console.log('');
    console.log(`Next assignable lane: ${nextAssignable.id} — ${describeLaneStatus(nextAssignable.lane.status)} (${nextAssignable.lane.scope})`);
  } else if (Object.keys(pattern.lanes || {}).some((key) => key.startsWith('6'))) {
    console.log('');
    console.log('No auto-assignable Stage 6 lanes. Review lane notes for blockers or hand-off tasks.');
  }

  if (pattern.dependencies?.length) {
    console.log('');
    console.log(`Dependencies: ${pattern.dependencies.join(', ')}`);
  }
  if (pattern.handoff) {
    const { guardrails = [], sharedFiles = [] } = pattern.handoff;
    if (guardrails.length) {
      console.log('');
      console.log('Guardrails:');
      guardrails.forEach((g) => console.log(`  - ${g}`));
    }
    if (sharedFiles.length) {
      console.log('');
      console.log('Shared files:');
      sharedFiles.forEach((f) => console.log(`  - ${f}`));
    }
  }
  if (pattern.activity?.length) {
    console.log('');
    console.log('Recent activity:');
    const sorted = [...pattern.activity].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    sorted.slice(0, 5).forEach((entry) => {
      console.log(`  - ${entry.timestamp} (${entry.stage}): ${entry.summary}`);
    });
  }
  console.log('');
  console.log(`Registry snapshot updated at ${updatedAt}`);
}

function listNotes(pattern) {
  console.log('');
  console.log('Notes:');
  const notes = [...(pattern.notes || [])].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  if (notes.length === 0) {
    console.log('  (no notes recorded)');
    return;
  }
  notes.forEach((note) => {
    const author = note.author ? ` — ${note.author}` : '';
    const scope = note.scope?.length ? ` [${note.scope.join(', ')}]` : '';
    console.log(`  - ${note.timestamp}${author}${scope} :: ${note.id}`);
    const body = note.body.replace(/\n/g, '\n    ');
    console.log(`    ${body}`);
  });
}

function renderStageSummary(pattern) {
  const gateKeys = Object.keys(pattern.stageGates || {}).sort((a, b) => Number(a) - Number(b));
  const rows = gateKeys.map((stage) => {
    const gate = pattern.stageGates[stage];
    return `| ${stage} | ${gate.status} | ${gate.completedAt || '—'} | ${gate.notes ? gate.notes.replace(/\n/g, ' ') : '—'} |`;
  });
  return ['| Stage | Status | Completed At | Notes |', '| ----- | ------ | ------------- | ----- |', ...rows].join('\n');
}

function renderLaneTable(pattern, prefix) {
  const laneKeys = Object.keys(pattern.lanes || {}).filter((key) => key.startsWith(prefix)).sort();
  if (laneKeys.length === 0) {
    return '_No lanes recorded._';
  }
  const rows = laneKeys.map((laneId) => {
    const lane = pattern.lanes[laneId];
    return `| ${laneId} | ${lane.status} | ${lane.updatedAt || '—'} | ${lane.scope} |`;
  });
  return ['| Lane | Status | Updated At | Scope |', '| ---- | ------ | ---------- | ----- |', ...rows].join('\n');
}

function renderActivityList(pattern) {
  if (!pattern.activity?.length) {
    return '_No activity recorded._';
  }
  const entries = [...pattern.activity].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return entries
    .map((entry) => {
      const agent = entry.agent ? ` — ${entry.agent}` : '';
      const files = entry.files?.length ? `\n  - Files: ${entry.files.join(', ')}` : '';
      return `- ${entry.timestamp} — ${entry.stage}${agent}\n  - Summary: ${entry.summary}${files}`;
    })
    .join('\n');
}

function renderNotes(pattern) {
  const notes = [...(pattern.notes || [])].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  if (notes.length === 0) {
    return '_No notes recorded._';
  }
  return notes
    .map((note) => {
      const author = note.author ? ` — ${note.author}` : '';
      const scope = note.scope?.length ? ` [${note.scope.join(', ')}]` : '';
      const body = note.body.replace(/\n/g, '\n  ');
      return `- ${note.timestamp}${author}${scope} :: ${note.id}\n  ${body}`;
    })
    .join('\n');
}

function renderPatternMarkdown(pattern, updatedAt) {
  const patternStamp = pattern.updatedAt || updatedAt;
  const stage4Lanes = renderLaneTable(pattern, '4');
  const stage6Lanes = renderLaneTable(pattern, '6');
  const notesSection = renderNotes(pattern);
  return `# Utility Consolidation Plan — Pattern ${pattern.patternId} (Generated Preview)\n\nUpdated from registry snapshot ${patternStamp}.\n\n## Stage Summary\n${renderStageSummary(pattern)}\n\n## Stage 4 Lanes\n${stage4Lanes}\n\n## Stage 6 Lanes\n${stage6Lanes}\n\n## Recent Activity\n${renderActivityList(pattern)}\n\n## Notes\n${notesSection}\n`;
}

function renderTrackerMarkdown(registry) {
  const header = ['| Pattern | Name | Stage | Next Action |', '| ------- | ---- | ----- | ----------- |'];
  const rows = registry.patterns.map((pattern) => {
    const stageKeys = Object.keys(pattern.stageGates || {}).sort((a, b) => Number(a) - Number(b));
    const firstOpen = stageKeys.find((key) => pattern.stageGates[key].status !== 'complete');
    const nextAction = firstOpen ? `Stage ${firstOpen} — ${pattern.stageGates[firstOpen].status}` : 'Stage 7 wrap-up';
    return `| ${pattern.patternId} | ${pattern.name} | ${pattern.stage} | ${nextAction} |`;
  });
  return ['# Consolidation Registry Snapshot', '', ...header, ...rows, '', `Generated ${registry.updatedAt}.`].join('\n');
}

function renderActivityMarkdown(registry) {
  const allEntries = registry.patterns.flatMap((pattern) =>
    (pattern.activity || []).map((entry) => ({ ...entry, pattern: pattern.patternId, name: pattern.name }))
  );
  if (!allEntries.length) {
    return '# Utility Consolidation Activity (Generated)\n\n_No activity recorded in registry._\n';
  }
  const ordered = allEntries.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const lines = ordered.map((entry) => {
    const files = entry.files?.length ? `\n  - Files: ${entry.files.join(', ')}` : '';
    const agent = entry.agent ? ` — ${entry.agent}` : '';
    return `- ${entry.timestamp} — Pattern ${entry.pattern} (${entry.name}) — ${entry.stage}${agent}\n  - Summary: ${entry.summary}${files}`;
  });
  return ['# Utility Consolidation Activity (Generated)', '', ...lines].join('\n');
}

async function writeFileIfChanged(filePath, content, checkOnly) {
  const formattedContent = await formatMarkdownIfNeeded(filePath, content);
  let existing = null;
  try {
    existing = await readFile(filePath, 'utf8');
  } catch (_) {
    existing = null;
  }
  if (existing === formattedContent) {
    return false;
  }
  if (checkOnly) {
    throw new Error(`Generated content for ${filePath} would change; rerun without --check to update.`);
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, formattedContent, 'utf8');
  return true;
}

async function runRegen(registry, params) {
  const checkOnly = params.includes('--check');
  const generatedFiles = [];
  const planDir = path.join(repoRoot, 'Templum/dev/architecture/utility-consolidation-plans');
  for (const pattern of registry.patterns) {
    const generatedPath = path.join(planDir, `pattern-${pattern.patternId}.generated.md`);
    const content = renderPatternMarkdown(pattern, registry.updatedAt);
    const changed = await writeFileIfChanged(generatedPath, content, checkOnly);
    generatedFiles.push({ file: generatedPath, changed });
  }
  const trackerPath = path.join(__dirname, 'registry-status.generated.md');
  const trackerChanged = await writeFileIfChanged(trackerPath, renderTrackerMarkdown(registry), checkOnly);
  generatedFiles.push({ file: trackerPath, changed: trackerChanged });

  const activityPath = path.join(repoRoot, 'Templum/dev/architecture/utility-consolidation-activity-log.generated.md');
  const activityChanged = await writeFileIfChanged(activityPath, renderActivityMarkdown(registry), checkOnly);
  generatedFiles.push({ file: activityPath, changed: activityChanged });

  const changedCount = generatedFiles.filter((item) => item.changed).length;
  const summary = changedCount === 0 ? 'No changes' : `Updated ${changedCount} file(s).`;
  console.log(summary);
  generatedFiles.forEach((item) => {
    console.log(` - ${item.changed ? 'updated' : 'no-op'} ${item.file}`);
  });
}

async function main() {
  try {
    const registry = await loadRegistry();
    const { command, params } = parseArgs(process.argv);
    switch (command) {
      case 'guide': {
        if (params.length === 0) {
          throw new Error('Usage: guide <patternId> [--stage N] [--lane 6b]');
        }
        const [idToken, ...flags] = params;
        const patternId = Number.parseInt(idToken, 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${idToken}`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const options = parseGuideOptions(flags);
        if (options.lane && !(pattern.lanes || {})[options.lane]) {
          throw new Error(`Lane ${options.lane} not found for pattern ${patternId}.`);
        }
        printGuide(pattern, options);
        break;
      }
      case 'claim': {
        if (params.length === 0) {
          throw new Error('Usage: claim <patternId> --agent <name> [--claimed-at ISO8601]');
        }
        const patternId = Number.parseInt(params[0], 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${params[0]}`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const options = params.slice(1);
        let agent = null;
        let claimedAt = null;
        for (let i = 0; i < options.length; i += 1) {
          const token = options[i];
          switch (token) {
            case '--agent':
              if (i + 1 >= options.length) {
                throw new Error('claim: --agent requires a value');
              }
              agent = options[i + 1];
              i += 1;
              break;
            case '--claimed-at':
              if (i + 1 >= options.length) {
                throw new Error('claim: --claimed-at requires a value');
              }
              claimedAt = options[i + 1];
              if (Number.isNaN(Date.parse(claimedAt))) {
                throw new Error('claim: --claimed-at must be a valid ISO8601 timestamp');
              }
              i += 1;
              break;
            default:
              throw new Error(`Unknown flag for claim: ${token}`);
          }
        }
        if (!agent) {
          throw new Error('claim requires --agent <name>');
        }
        const owner = pattern.owner || (pattern.owner = {});
        owner.agent = agent;
        owner.claimedAt = claimedAt || nowIso();
        recomputePatternStagePointer(pattern);
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Pattern ${patternId} owner set to ${agent}.`);
        break;
      }
      case 'update-stage': {
        if (params.length < 2) {
          throw new Error('Usage: update-stage <patternId> <stageId> --status <value> [--notes text] [--agent name] [--summary text] [--completed-at ISO] [--files paths]');
        }
        const patternId = Number.parseInt(params[0], 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${params[0]}`);
        }
        const stageId = normaliseStageId(params[1]);
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const flagTokens = params.slice(2);
        const options = parseStageUpdateOptions(flagTokens);
        if (!options.status) {
          throw new Error('update-stage requires --status <value>');
        }
        if (!stageStatusMetadata[options.status]) {
          throw new Error(`Unsupported stage status: ${options.status}`);
        }
        if (options.completedAtProvided && Number.isNaN(Date.parse(options.completedAt))) {
          throw new Error('update-stage: --completed-at must be a valid ISO8601 timestamp');
        }
        setStageGate(pattern, stageId, options.status, {
          notes: options.notesProvided ? options.notes : undefined,
          completedAt: options.completedAtProvided ? options.completedAt : undefined
        });
        recomputePatternStagePointer(pattern);

        const activityEntries = pattern.activity || (pattern.activity = []);
        const activityEntry = {
          stage: `stage-${stageId}`,
          timestamp: nowIso(),
          summary: options.summary || `Stage ${stageId} status set to ${options.status}`
        };
        if (options.agent) {
          activityEntry.agent = options.agent;
        }
        if (options.files.length) {
          activityEntry.files = options.files;
        }
        activityEntries.push(activityEntry);

        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Stage ${stageId} updated to ${options.status}.`);
        break;
      }
      case 'stage-note': {
        if (params.length < 2) {
          throw new Error('Usage: stage-note <patternId> <stageId> --body "text" [--agent name] [--id custom-id]');
        }
        const patternId = Number.parseInt(params[0], 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${params[0]}`);
        }
        const stageId = normaliseStageId(params[1]);
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const tokens = params.slice(2);
        let body = null;
        let author = null;
        let noteId = null;
        for (let i = 0; i < tokens.length; i += 1) {
          const token = tokens[i];
          switch (token) {
            case '--body':
              if (i + 1 >= tokens.length) {
                throw new Error('stage-note: --body requires a value');
              }
              body = tokens[i + 1];
              i += 1;
              break;
            case '--agent':
            case '--author':
              if (i + 1 >= tokens.length) {
                throw new Error('stage-note: --agent/--author requires a value');
              }
              author = tokens[i + 1];
              i += 1;
              break;
            case '--id':
              if (i + 1 >= tokens.length) {
                throw new Error('stage-note: --id requires a value');
              }
              noteId = tokens[i + 1];
              i += 1;
              break;
            default:
              throw new Error(`stage-note: unknown flag ${token}`);
          }
        }
        if (!body) {
          throw new Error('stage-note requires --body "text"');
        }
        const notes = pattern.notes || (pattern.notes = []);
        const generatedId = noteId || `stage-${stageId}-note-${nowIso().replace(/[^0-9T]/g, '')}`;
        if (notes.some((note) => note.id === generatedId)) {
          throw new Error(`Note id ${generatedId} already exists for pattern ${patternId}`);
        }
        const newNote = {
          id: generatedId,
          timestamp: nowIso(),
          body,
          scope: [`stage-${stageId}`]
        };
        if (author) {
          newNote.author = author;
        }
        notes.push(newNote);
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Added stage-${stageId} note ${generatedId} to pattern ${patternId}.`);
        break;
      }
      case 'create-lane': {
        if (params.length < 2) {
          throw new Error(
            'Usage: create-lane <patternId> <laneId> --scope "description" --command "command to run" [--command "..."] [--status pending] [--depends 8:stage-4] [--note text] [--agent name] [--summary text]'
          );
        }
        const patternId = Number.parseInt(params[0], 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${params[0]}`);
        }
        const laneIdToken = params[1];
        if (!laneIdToken) {
          throw new Error('create-lane requires a lane id (e.g., 4a, 6b).');
        }
        const laneId = laneIdToken.toLowerCase();
        if (!/^4[a-z]$/.test(laneId) && !/^6[a-d]$/.test(laneId)) {
          throw new Error('create-lane supports Stage 4 lanes (4a–4z) and Stage 6 lanes (6a–6d).');
        }
        const stageId = laneIdToStage(laneId);
        if (!stageId || (stageId !== '4' && stageId !== '6')) {
          throw new Error(`create-lane only supports Stage 4 or Stage 6 lanes (received ${laneId}).`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const laneMap = pattern.lanes || (pattern.lanes = {});
        if (laneMap[laneId]) {
          throw new Error(`Lane ${laneId} already exists for pattern ${patternId}.`);
        }
        const options = parseCreateLaneOptions(params.slice(2));
        if (!options.scope) {
          throw new Error('create-lane requires --scope "description"');
        }
        if (!options.commands.length) {
          throw new Error('create-lane requires at least one --command "command to run"');
        }
        const status = (options.status || 'pending').toLowerCase();
        if (!laneStatusMetadata[status]) {
          throw new Error(`create-lane: unsupported status ${status}`);
        }
        if (status === 'in_progress') {
          throw new Error(
            'create-lane cannot initialise a lane in `in_progress`. Create the lane first, then call `claim-lane`.'
          );
        }
        const laneCommands = options.commands.map((commandText) => ({
          command: commandText
        }));
        const laneEntry = {
          status,
          scope: options.scope,
          commands: laneCommands,
          updatedAt: nowIso()
        };
        if (options.dependencies.length) {
          laneEntry.dependencies = options.dependencies;
        }
        if (options.note) {
          laneEntry.notes = options.note;
        }
        laneMap[laneId] = laneEntry;
        recomputeStageGateFromLanes(pattern, stageId);
        const activityEntries = pattern.activity || (pattern.activity = []);
        const defaultSummary = `Created lane ${laneId} (${options.scope})`;
        const activityEntry = {
          stage: `stage-${stageId}`,
          timestamp: nowIso(),
          summary: options.summary || defaultSummary
        };
        if (options.agent) {
          activityEntry.agent = options.agent;
        }
        activityEntries.push(activityEntry);
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Lane ${laneId} created for pattern ${patternId}.`);
        if (options.dependencies.length) {
          const dependencyList = options.dependencies
            .map((dep) => `${dep.patternId}:${dep.gate}`)
            .join(', ');
          console.log(`Dependencies: ${dependencyList}`);
        }
        printLaneDetail(pattern, laneId, laneEntry);
        break;
      }
      case 'claim-lane': {
        if (params.length === 0) {
          throw new Error('Usage: claim-lane <patternId> [laneId] --agent <name> [--summary text] [--note text]');
        }
        const patternId = Number.parseInt(params[0], 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${params[0]}`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        let laneId = null;
        let index = 1;
        if (params[1] && !params[1].startsWith('--')) {
          laneId = params[1].toLowerCase();
          index = 2;
        }
        const optionTokens = params.slice(index);
        let agent = null;
        let summary = null;
        let note = null;
        let laneFlag = null;
        for (let i = 0; i < optionTokens.length; i += 1) {
          const token = optionTokens[i];
          switch (token) {
            case '--lane':
              if (i + 1 >= optionTokens.length) {
                throw new Error('claim-lane: --lane requires a value');
              }
              laneFlag = optionTokens[i + 1].toLowerCase();
              i += 1;
              break;
            case '--agent':
              if (i + 1 >= optionTokens.length) {
                throw new Error('claim-lane: --agent requires a value');
              }
              agent = optionTokens[i + 1];
              i += 1;
              break;
            case '--summary':
              if (i + 1 >= optionTokens.length) {
                throw new Error('claim-lane: --summary requires a value');
              }
              summary = optionTokens[i + 1];
              i += 1;
              break;
            case '--note':
              if (i + 1 >= optionTokens.length) {
                throw new Error('claim-lane: --note requires a value');
              }
              note = optionTokens[i + 1];
              i += 1;
              break;
            default:
              throw new Error(`claim-lane: unknown flag ${token}`);
          }
        }
        if (!agent) {
          throw new Error('claim-lane requires --agent <name>');
        }
        if (laneId && laneFlag && laneId !== laneFlag) {
          throw new Error('claim-lane: lane specified twice with different values.');
        }
        if (laneFlag && !laneId) {
          laneId = laneFlag;
        }
        const laneOrder = orderedStage6Lanes(pattern);
        if (!laneOrder.length) {
          throw new Error(`Pattern ${patternId} has no Stage 6 lanes to claim.`);
        }
        let targetLaneId = laneId;
        if (targetLaneId) {
          if (!pattern.lanes?.[targetLaneId]) {
            throw new Error(`Lane ${targetLaneId} not found for pattern ${patternId}.`);
          }
          if (laneIdToStage(targetLaneId) !== '6') {
            throw new Error(`Lane ${targetLaneId} is not a Stage 6 lane.`);
          }
        } else {
          targetLaneId = laneOrder.find((candidate) => {
            const lane = pattern.lanes?.[candidate];
            if (!lane) {
              return false;
            }
            if (!autoAssignableLaneStatuses.includes(lane.status)) {
              return false;
            }
            return laneDependenciesSatisfied(registry, pattern, candidate);
          });
        }
        if (!targetLaneId) {
          throw new Error('No auto-assignable Stage 6 lanes available. Check statuses via `guide --lanes` or coordinate with the current owner.');
        }
        const lane = pattern.lanes?.[targetLaneId];
        if (!lane) {
          throw new Error(`Lane ${targetLaneId} not found for pattern ${patternId}.`);
        }
        if (!autoAssignableLaneStatuses.includes(lane.status)) {
          throw new Error(`Lane ${targetLaneId} is not assignable (current status: ${lane.status}).`);
        }
        if (!laneDependenciesSatisfied(registry, pattern, targetLaneId)) {
          throw new Error(`Lane ${targetLaneId} dependencies are not satisfied yet.`);
        }
        if (lane.status === 'in_progress') {
          throw new Error(`Lane ${targetLaneId} is already in_progress. Choose another lane or coordinate with the current owner.`);
        }
        setLaneStatus(pattern, targetLaneId, 'in_progress', note);
        const stage = laneIdToStage(targetLaneId);
        if (stage) {
          recomputeStageGateFromLanes(pattern, stage);
        }
        const activityEntries = pattern.activity || (pattern.activity = []);
        const activityEntry = {
          stage: `lane-${targetLaneId}`,
          timestamp: nowIso(),
          summary: summary || `Lane ${targetLaneId} claimed by ${agent}`,
          agent
        };
        activityEntries.push(activityEntry);
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Lane ${targetLaneId} claimed by ${agent}.`);
        if (stage === '6') {
          printHandoffSummary(pattern, '\nHandoff summary:');
        }
        printLaneDetail(pattern, targetLaneId, lane);
        break;
      }
      case 'update-handoff': {
        if (params.length === 0) {
          throw new Error('Usage: update-handoff <patternId> [--add-guardrail "…"] [--remove-guardrail N] [--add-file "…"] [--remove-file N] [--add-ack "Agent"] [--ack-note "…"] [--ack-timestamp ISO] [--remove-ack N] [--clear-guardrails] [--clear-files] [--clear-acks]');
        }
        const patternId = Number.parseInt(params[0], 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${params[0]}`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const options = parseHandoffOptions(params.slice(1));
        const handoff = pattern.handoff || (pattern.handoff = { guardrails: [], sharedFiles: [], acknowledgements: [] });
        handoff.guardrails = Array.isArray(handoff.guardrails) ? [...handoff.guardrails] : [];
        handoff.sharedFiles = Array.isArray(handoff.sharedFiles) ? [...handoff.sharedFiles] : [];
        handoff.acknowledgements = Array.isArray(handoff.acknowledgements) ? [...handoff.acknowledgements] : [];

        if (options.listOnly) {
          const hasChanges =
            options.addGuardrails.length ||
            options.removeGuardrails.length ||
            options.clearGuardrails ||
            options.addFiles.length ||
            options.removeFiles.length ||
            options.clearFiles ||
            options.addAcks.length ||
            options.removeAcks.length ||
            options.removeAckAgents.length ||
            options.clearAcks;
          if (hasChanges) {
            throw new Error('update-handoff: --list cannot be combined with mutation flags.');
          }
          printHandoffSummary(pattern, 'Handoff summary:');
          break;
        }

        let changed = false;

        if (options.clearGuardrails) {
          if (handoff.guardrails.length) {
            handoff.guardrails = [];
          }
          changed = true;
        }
        if (!options.clearGuardrails && options.removeGuardrails.length) {
          const sorted = [...options.removeGuardrails].sort((a, b) => b - a);
          sorted.forEach((index) => {
            if (index < 0 || index >= handoff.guardrails.length) {
              throw new Error(`update-handoff: guardrail index ${index + 1} out of range`);
            }
            handoff.guardrails.splice(index, 1);
            changed = true;
          });
        }
        if (options.addGuardrails.length) {
          handoff.guardrails.push(...options.addGuardrails);
          changed = true;
        }

        if (options.clearFiles) {
          if (handoff.sharedFiles.length) {
            handoff.sharedFiles = [];
          }
          changed = true;
        }
        if (!options.clearFiles && options.removeFiles.length) {
          const sorted = [...options.removeFiles].sort((a, b) => b - a);
          sorted.forEach((index) => {
            if (index < 0 || index >= handoff.sharedFiles.length) {
              throw new Error(`update-handoff: shared file index ${index + 1} out of range`);
            }
            handoff.sharedFiles.splice(index, 1);
            changed = true;
          });
        }
        if (options.addFiles.length) {
          handoff.sharedFiles.push(...options.addFiles);
          changed = true;
        }

        if (options.clearAcks) {
          if (handoff.acknowledgements.length) {
            handoff.acknowledgements = [];
          }
          changed = true;
        }
        if (!options.clearAcks && options.removeAcks.length) {
          const sorted = [...options.removeAcks].sort((a, b) => b - a);
          sorted.forEach((index) => {
            if (index < 0 || index >= handoff.acknowledgements.length) {
              throw new Error(`update-handoff: acknowledgement index ${index + 1} out of range`);
            }
            handoff.acknowledgements.splice(index, 1);
            changed = true;
          });
        }
        if (options.addAcks.length) {
          options.addAcks.forEach((entry) => {
            const ack = { ...entry };
            ack.timestamp = ack.timestamp || nowIso();
            handoff.acknowledgements.push(ack);
          });
          changed = true;
        }
        if (options.removeAckAgents.length) {
          const before = handoff.acknowledgements.length;
          options.removeAckAgents.forEach((agent) => {
            const index = handoff.acknowledgements.findIndex((ack) => ack.agent === agent);
            if (index === -1) {
              throw new Error(`update-handoff: acknowledgement for agent ${agent} not found`);
            }
            handoff.acknowledgements.splice(index, 1);
          });
          if (handoff.acknowledgements.length !== before) {
            changed = true;
          }
        }

        if (!changed) {
          throw new Error('update-handoff: no changes provided');
        }

        pattern.handoff = handoff;
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Updated handoff for pattern ${patternId}.`);
        break;
      }
      case 'append-activity': {
        if (params.length === 0) {
          throw new Error(
            'Usage: append-activity <patternId> --scope stage-6|lane-6b [--stage N] [--lane 6b] --summary "text" [--agent name] [--files paths] [--timestamp ISO]'
          );
        }
        const patternId = Number.parseInt(params[0], 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${params[0]}`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const options = parseAppendActivityOptions(params.slice(1));
        const scopeCandidates = [];
        if (options.scope) {
          const value = options.scope.toLowerCase();
          if (!/^stage-[0-9]+$/.test(value) && !/^lane-[0-9]+[a-z]+$/.test(value)) {
            throw new Error('append-activity: --scope must reference stage-N or lane-6b.');
          }
          scopeCandidates.push(value);
        }
        if (options.stage) {
          const stageId = normaliseStageId(options.stage);
          scopeCandidates.push(`stage-${stageId}`);
        }
        if (options.lane) {
          const laneId = options.lane.toLowerCase();
          if (!pattern.lanes || !pattern.lanes[laneId]) {
            throw new Error(`append-activity: lane ${laneId} not found for pattern ${patternId}.`);
          }
          scopeCandidates.push(`lane-${laneId}`);
        }
        if (!scopeCandidates.length) {
          throw new Error('append-activity requires --scope, --stage, or --lane to identify the activity target.');
        }
        const uniqueScopes = [...new Set(scopeCandidates)];
        if (uniqueScopes.length > 1) {
          throw new Error('append-activity: conflicting scope values provided.');
        }
        const scope = uniqueScopes[0];
        if (!options.summary) {
          throw new Error('append-activity requires --summary "text".');
        }
        if (scope.startsWith('lane-')) {
          const laneId = scope.slice(5);
          if (!pattern.lanes || !pattern.lanes[laneId]) {
            throw new Error(`append-activity: lane ${laneId} not found for pattern ${patternId}.`);
          }
        }
        const activityEntries = pattern.activity || (pattern.activity = []);
        const entry = {
          stage: scope,
          timestamp: options.timestamp || nowIso(),
          summary: options.summary
        };
        if (options.agent) {
          entry.agent = options.agent;
        }
        if (options.files.length) {
          entry.files = options.files;
        }
        activityEntries.push(entry);
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Appended activity entry for ${scope} on pattern ${patternId}.`);
        break;
      }
      case 'update-lane': {
        if (params.length < 2) {
          throw new Error('Usage: update-lane <patternId> <laneId> --status <value> [--note text] [--agent name] [--summary text] [--block lanes] [--queue lanes] [--files paths] [--no-prompt]');
        }
        const [idToken, laneToken, ...flagTokens] = params;
        const patternId = Number.parseInt(idToken, 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${idToken}`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const laneId = laneToken.toLowerCase();
        if (!pattern.lanes || !pattern.lanes[laneId]) {
          throw new Error(`Lane ${laneId} not found for pattern ${patternId}.`);
        }
        const lane = pattern.lanes[laneId];
        let options = parseLaneUpdateOptions(flagTokens);
        if (!options.status) {
          throw new Error('update-lane requires --status');
        }
        if (!laneStatusMetadata[options.status]) {
          throw new Error(`Unsupported lane status: ${options.status}`);
        }
        const statusChanged = options.status !== lane.status;
        if (options.status === 'in_progress' && lane.status !== 'in_progress') {
          throw new Error(
            'update-lane cannot move a lane into `in_progress`. Use `npm run consolidate -- claim-lane <patternId> [laneId] --agent <name>` instead.'
          );
        }
        if (statusChanged && options.status === 'blocked' && !options.note && !options.skipPrompt) {
          console.log('Warning: blocked lanes should include a note describing the blocker.');
        }
        if (statusChanged) {
          options = await promptPropagationTargets(pattern, laneId, options);
        } else {
          options.block = [];
          options.queue = [];
          options.skipPrompt = true;
        }
        setLaneStatus(pattern, laneId, options.status, options.note);
        const propagation = statusChanged ? propagateLaneStatuses(pattern, laneId, options) : { blocked: [], scheduled: [] };
        let autoPromoted = [];
        if (statusChanged && options.status === 'complete') {
          autoPromoted = promoteDependentLanes(registry, pattern, laneId);
        }

        const stage = laneIdToStage(laneId);
        if (stage) {
          recomputeStageGateFromLanes(pattern, stage);
        }

        const activityEntries = pattern.activity || (pattern.activity = []);
        const summaryText = options.summary || `Lane ${laneId} status set to ${options.status}`;
        const activityEntry = {
          stage: `lane-${laneId}`,
          timestamp: nowIso(),
          summary: summaryText
        };
        if (options.agent) {
          activityEntry.agent = options.agent;
        }
        if (options.files.length) {
          activityEntry.files = options.files;
        }
        activityEntries.push(activityEntry);

        touchPattern(pattern);
        await saveRegistry(registry);

        console.log(`Lane ${laneId} updated to ${options.status}.`);
        if (propagation.blocked.length) {
          console.log(`Blocked lanes: ${propagation.blocked.join(', ')}`);
        }
        if (propagation.scheduled.length) {
          console.log(`Scheduled lanes: ${propagation.scheduled.join(', ')}`);
        }
        if (autoPromoted.length) {
          console.log(`Auto-scheduled lanes: ${autoPromoted.join(', ')}`);
        }
        break;
      }
      case 'status': {
        if (params.length === 0) {
          throw new Error('Usage: status <patternId> [--notes]');
        }
        const [idToken, ...flags] = params;
        const patternId = Number.parseInt(idToken, 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${idToken}`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        printStatus(pattern, registry.updatedAt);
        if (flags.includes('--notes')) {
          listNotes(pattern);
        }
        break;
      }
      case 'notes': {
        if (params.length === 0) {
          throw new Error('Usage: notes <patternId>');
        }
        const patternId = Number.parseInt(params[0], 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${params[0]}`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        listNotes(pattern);
        break;
      }
      case 'add-note': {
        if (params.length === 0) {
          throw new Error('Usage: add-note <patternId> --body "text" [--scope stage-6] [--author name] [--id custom-id]');
        }
        const patternId = Number.parseInt(params[0], 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${params[0]}`);
        }
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const options = params.slice(1);
        let body = null;
        let author = null;
        let noteId = null;
        const scope = [];
        for (let i = 0; i < options.length; i += 1) {
          const token = options[i];
          switch (token) {
            case '--body':
              if (i + 1 >= options.length) {
                throw new Error('--body requires a value');
              }
              body = options[i + 1];
              i += 1;
              break;
            case '--author':
              if (i + 1 >= options.length) {
                throw new Error('--author requires a value');
              }
              author = options[i + 1];
              i += 1;
              break;
            case '--scope':
              if (i + 1 >= options.length) {
                throw new Error('--scope requires a value');
              }
              scope.push(options[i + 1]);
              i += 1;
              break;
            case '--id':
              if (i + 1 >= options.length) {
                throw new Error('--id requires a value');
              }
              noteId = options[i + 1];
              i += 1;
              break;
            default:
              throw new Error(`Unknown flag for add-note: ${token}`);
          }
        }
        if (!body) {
          throw new Error('add-note requires --body');
        }
        const noteList = pattern.notes || (pattern.notes = []);
        const generatedId = noteId || `note-${nowIso().replace(/[^0-9T]/g, '')}`;
        if (noteList.some((note) => note.id === generatedId)) {
          throw new Error(`Note id ${generatedId} already exists for pattern ${patternId}`);
        }
        const newNote = {
          id: generatedId,
          timestamp: nowIso(),
          body,
        };
        if (author) {
          newNote.author = author;
        }
        if (scope.length) {
          newNote.scope = scope;
        }
        noteList.push(newNote);
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Added note ${generatedId} to pattern ${patternId}.`);
        break;
      }
      case 'remove-note': {
        if (params.length < 2) {
          throw new Error('Usage: remove-note <patternId> <noteId>');
        }
        const patternId = Number.parseInt(params[0], 10);
        if (Number.isNaN(patternId)) {
          throw new Error(`Invalid pattern id: ${params[0]}`);
        }
        const noteId = params[1];
        const pattern = registry.patterns.find((p) => p.patternId === patternId);
        if (!pattern) {
          throw new Error(`Pattern ${patternId} not found in registry.`);
        }
        const notes = pattern.notes || [];
        const index = notes.findIndex((note) => note.id === noteId);
        if (index === -1) {
          throw new Error(`Note ${noteId} not found for pattern ${patternId}.`);
        }
        notes.splice(index, 1);
        touchPattern(pattern);
        await saveRegistry(registry);
        console.log(`Removed note ${noteId} from pattern ${patternId}.`);
        break;
      }
      case 'regen':
        await runRegen(registry, params);
        break;
      case 'help':
      case '--help':
      case '-h':
        console.log('Usage:');
        console.log('  guide <patternId> [--stage N] [--lane 6b] [--lanes] [--recent] [--next|-n]');
        console.log('                                Show targeted guidance for the pattern');
        console.log('  claim <patternId> --agent <name> [--claimed-at ISO]');
        console.log('                                Set or refresh ownership metadata');
        console.log('  stage-note <patternId> <stageId> --body "text" [--agent name]');
        console.log('                                Add a stage-scoped note to the registry');
        console.log('  update-stage <patternId> <stageId> --status <value> [options]');
        console.log('                                Update stage gate status, notes, and activity log');
        console.log('  update-handoff <patternId> [options]');
        console.log('                                Maintain guardrails, shared files, acknowledgements (`--list` to inspect)');
        console.log('  create-lane <patternId> <laneId> --scope "…" --command "…" [options]');
        console.log('                                Define Stage 4/6 lanes plus commands/dependencies before assignment');
        console.log('  claim-lane <patternId> [laneId] --agent <name> [--summary text]');
        console.log('                                Safely claim the next assignable Stage 6 lane');
        console.log('  update-lane <patternId> <laneId> --status <value> [options]');
        console.log('                                Update lane status, capture notes, and propagate impacts');
        console.log('  append-activity <patternId> --scope stage-6|lane-6b --summary "text" [options]');
        console.log('                                Add collaborative evidence to the activity log without changing lane status');
        console.log('  status <patternId> [--notes]   Show registry snapshot for a pattern');
        console.log('  notes <patternId>              List notes recorded for a pattern');
        console.log('  add-note <patternId> --body "text" [--scope stage-6] [--author name]');
        console.log('  remove-note <patternId> <noteId>   Delete a note by id');
        console.log('  regen [--check]                (Optional) Regenerate Markdown previews; auto-run after mutations');
        console.log('');
        console.log('Generators run automatically after write operations. Use `regen --check` in CI or when you need a dry-run diff.');
        console.log('Docs: Templum/dev/architecture/consolidation-registry-overview.md and consolidation-cli-design.md describe the workflow.');
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

main();

import { readFile, writeFile } from 'fs/promises';
import Ajv from 'ajv/dist/2020.js';
import { registryPath, schemaPath } from './environment.mjs';
import { nowIso } from './time-utils.mjs';

const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addFormat('date-time', (value) => !Number.isNaN(Date.parse(value)));

let schemaValidator = null;

const pendingRegen = {
  patterns: new Set(),
  scopes: new Set(),
  cohorts: new Set()
};

function markPatternForRegen(patternId) {
  if (patternId === null || patternId === undefined) {
    return;
  }
  const numeric = Number.parseInt(patternId, 10);
  if (!Number.isNaN(numeric)) {
    pendingRegen.patterns.add(numeric);
  }
}

function markCohortForRegen(cohortId) {
  if (cohortId || cohortId === 0) {
    const normalized = String(cohortId).trim();
    if (normalized) {
      pendingRegen.cohorts.add(normalized);
    }
  }
}

function registerScopeChange(patternId, scope) {
  if (!scope && scope !== 0) {
    return;
  }
  const numeric = Number.parseInt(patternId, 10);
  if (Number.isNaN(numeric)) {
    return;
  }
  const normalizedScope = String(scope).toLowerCase();
  pendingRegen.scopes.add(`${numeric}|${normalizedScope}`);
  markPatternForRegen(numeric);
}

function setRegistryMeta(registry, key, value) {
  Object.defineProperty(registry, key, {
    configurable: true,
    enumerable: false,
    writable: true,
    value
  });
}

function cohortLabelFromIndex(index) {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`Cannot generate cohort label for index ${index}`);
  }
  let remaining = index + 1;
  let label = '';
  while (remaining > 0) {
    remaining -= 1;
    const remainder = remaining % 26;
    label = String.fromCharCode(65 + remainder) + label;
    remaining = Math.floor(remaining / 26);
  }
  return label;
}

function getCohortAliasMap(registry) {
  const value = registry.__cohortAliasMap;
  return value instanceof Map ? value : null;
}

function getCohortCollection(registry) {
  if (!registry.cohorts) {
    registry.cohorts = [];
  }
  return registry.cohorts;
}

function normaliseCohortId(value) {
  if (value === undefined || value === null) {
    throw new Error('Cohort id cannot be empty.');
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    throw new Error('Cohort id cannot be empty.');
  }
  return trimmed.toUpperCase();
}

function getPatternCohortIds(pattern) {
  return Array.isArray(pattern.cohorts) ? [...pattern.cohorts] : [];
}

function setPatternCohortList(pattern, cohortIds) {
  if (!cohortIds.length) {
    delete pattern.cohorts;
    return;
  }
  pattern.cohorts = [...new Set(cohortIds.map(normaliseCohortId))].sort((a, b) => a.localeCompare(b));
}

function touchPattern(pattern) {
  pattern.updatedAt = nowIso();
  markPatternForRegen(pattern.patternId);
}

function touchCohort(cohort) {
  if (cohort) {
    cohort.updatedAt = nowIso();
    markCohortForRegen(cohort.id);
  }
}

function canonicalizeCohortIds(registry, options = {}) {
  const { touch = false } = options;
  const cohorts = getCohortCollection(registry);
  const aliasMap = new Map();
  const mapping = new Map();
  cohorts.forEach((cohort, index) => {
    const canonicalId = cohortLabelFromIndex(index);
    const original = String(cohort.id || '').trim();
    if (original) {
      aliasMap.set(original.toLowerCase(), canonicalId);
    }
    aliasMap.set(canonicalId.toLowerCase(), canonicalId);
    if (!original || original.toUpperCase() !== canonicalId) {
      mapping.set(original || canonicalId, canonicalId);
      cohort.id = canonicalId;
      if (touch) {
        cohort.updatedAt = nowIso();
      }
    } else {
      cohort.id = canonicalId;
    }
    if (Array.isArray(cohort.patterns)) {
      cohort.patterns = [...new Set(cohort.patterns)].sort((a, b) => a - b);
    } else {
      cohort.patterns = [];
    }
  });

  if (Array.isArray(registry.patterns)) {
    registry.patterns.forEach((pattern) => {
      const existing = getPatternCohortIds(pattern);
      if (!existing.length) {
        return;
      }
      const next = existing
        .map((id) => {
          const token = String(id).trim();
          const mapped = aliasMap.get(token.toLowerCase());
          return mapped || token.toUpperCase();
        })
        .filter(Boolean);
      const before = JSON.stringify(existing);
      setPatternCohortList(pattern, next);
      const after = JSON.stringify(getPatternCohortIds(pattern));
      if (touch && before !== after) {
        touchPattern(pattern);
      }
    });
  }

  if (mapping.size) {
    const remappedPending = new Set();
    pendingRegen.cohorts.forEach((entry) => {
      const key = String(entry).trim().toLowerCase();
      const mapped = aliasMap.get(key);
      if (mapped) {
        remappedPending.add(mapped);
      } else {
        remappedPending.add(entry);
      }
    });
    pendingRegen.cohorts.clear();
    remappedPending.forEach((entry) => pendingRegen.cohorts.add(entry));
  }

  setRegistryMeta(registry, '__cohortAliasMap', aliasMap);
  setRegistryMeta(registry, '__nextCohortId', cohortLabelFromIndex(cohorts.length));
  setRegistryMeta(registry, '__legacyCohortMapping', mapping);
  return { aliasMap, mapping, nextId: cohortLabelFromIndex(cohorts.length) };
}

function resolveCanonicalCohortId(registry, value) {
  if (value === undefined || value === null) {
    throw new Error('Cohort id cannot be empty.');
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    throw new Error('Cohort id cannot be empty.');
  }
  const aliasMap = getCohortAliasMap(registry);
  const mapped = aliasMap ? aliasMap.get(trimmed.toLowerCase()) : null;
  return mapped || normaliseCohortId(trimmed);
}

function findCohortById(registry, cohortId) {
  const canonicalId = resolveCanonicalCohortId(registry, cohortId);
  return (registry.cohorts || []).find((cohort) => normaliseCohortId(cohort.id) === canonicalId) || null;
}

function ensureCohort(registry, cohortId, options = {}) {
  const cohorts = getCohortCollection(registry);
  let cohort = findCohortById(registry, cohortId);
  if (!cohort) {
    cohort = {
      id: normaliseCohortId(cohortId),
      patterns: []
    };
    if (options.name) {
      cohort.name = options.name;
    }
    cohorts.push(cohort);
  } else if (options.name) {
    cohort.name = options.name;
  }
  if (options.description) {
    cohort.description = options.description;
  }
  touchCohort(cohort);
  return cohort;
}

function attachPatternToCohort(cohort, patternId) {
  if (!cohort.patterns.includes(patternId)) {
    cohort.patterns.push(patternId);
    cohort.patterns.sort((a, b) => a - b);
  }
}

function detachPatternFromCohort(cohort, patternId) {
  cohort.patterns = (cohort.patterns || []).filter((id) => id !== patternId);
}

function removePatternFromCohort(registry, cohort, patternId) {
  if (!cohort || !Array.isArray(cohort.patterns)) {
    return;
  }
  cohort.patterns = cohort.patterns.filter((entry) => entry !== patternId);
  touchCohort(cohort);
}

function syncCohortAssignments(registry, pattern, desiredCohorts, options = {}) {
  const normalizedDesired = [...new Set(desiredCohorts.map(normaliseCohortId))];
  if (normalizedDesired.length > 1) {
    throw new Error(`Pattern ${pattern.patternId} may only belong to one cohort (requested: ${normalizedDesired.join(', ')}).`);
  }
  const existing = getPatternCohortIds(pattern).map(normaliseCohortId);
  const toRemove = existing.filter((id) => !normalizedDesired.includes(id));
  const toAdd = normalizedDesired.filter((id) => !existing.includes(id));
  toRemove.forEach((cohortId) => {
    const cohort = findCohortById(registry, cohortId);
    if (cohort) {
      removePatternFromCohort(registry, cohort, pattern.patternId);
    }
  });
  toAdd.forEach((cohortId) => {
    const cohort = ensureCohort(registry, cohortId, options.cohortMetadata || {});
    attachPatternToCohort(cohort, pattern.patternId);
  });
  setPatternCohortList(pattern, normalizedDesired);
  touchPattern(pattern);
  return { added: toAdd, removed: toRemove };
}

function collectDependentPatterns(registry, patternId, scope) {
  const dependents = new Set();
  if (!registry || !Array.isArray(registry.patterns)) {
    return dependents;
  }
  const targetScope = scope.toLowerCase();
  registry.patterns.forEach((pattern) => {
    const stageEntries = Object.entries(pattern.stageGates || {});
    stageEntries.forEach(([, gate]) => {
      if (!gate || !Array.isArray(gate.dependencies)) {
        return;
      }
      if (gate.dependencies.some((dep) => dep.patternId === patternId && dep.gate === targetScope)) {
        dependents.add(pattern.patternId);
      }
    });
    const laneEntries = Object.entries(pattern.lanes || {});
    laneEntries.forEach(([, lane]) => {
      if (!lane || !Array.isArray(lane.dependencies)) {
        return;
      }
      if (lane.dependencies.some((dep) => dep.patternId === patternId && dep.gate === targetScope)) {
        dependents.add(pattern.patternId);
      }
    });
  });
  return dependents;
}

function parseScopeKey(entry) {
  if (!entry) {
    return null;
  }
  const [patternToken, scope] = String(entry).split('|');
  if (!patternToken || !scope) {
    return null;
  }
  const patternId = Number.parseInt(patternToken, 10);
  if (Number.isNaN(patternId)) {
    return null;
  }
  return { patternId, scope: scope.toLowerCase() };
}

function buildRegenRequest(registry) {
  if (!registry) {
    return { forceAll: true };
  }
  const patternSet = new Set(pendingRegen.patterns);
  const cohortSet = new Set(
    [...pendingRegen.cohorts]
      .map((id) => normaliseCohortId(id))
      .filter((id) => id && id.length)
  );
  const scopeEntries = [...pendingRegen.scopes];
  scopeEntries.forEach((entry) => {
    const parsed = parseScopeKey(entry);
    if (!parsed) {
      return;
    }
    patternSet.add(parsed.patternId);
    const dependents = collectDependentPatterns(registry, parsed.patternId, parsed.scope);
    dependents.forEach((id) => patternSet.add(id));
  });
  cohortSet.forEach((cohortId) => {
    const cohort = findCohortById(registry, cohortId);
    if (!cohort || !Array.isArray(cohort.patterns)) {
      return;
    }
    cohort.patterns.forEach((patternId) => {
      const numeric = Number.parseInt(patternId, 10);
      if (!Number.isNaN(numeric)) {
        patternSet.add(numeric);
      }
    });
  });
  patternSet.forEach((patternId) => {
    const pattern = registry.patterns.find((entry) => entry.patternId === patternId);
    if (!pattern) {
      return;
    }
    (getPatternCohortIds(pattern) || []).forEach((cohortId) => {
      if (cohortId || cohortId === 0) {
        cohortSet.add(normaliseCohortId(cohortId));
      }
    });
  });
  if (!patternSet.size && !cohortSet.size) {
    return { forceAll: true };
  }
  return {
    patterns: [...patternSet].sort((a, b) => a - b),
    cohorts: [...cohortSet].sort(),
    includeGlobalSchedule: true
  };
}

function clearPendingRegen() {
  pendingRegen.patterns.clear();
  pendingRegen.scopes.clear();
  pendingRegen.cohorts.clear();
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
    const errorText =
      validate.errors?.map((err) => `- ${err.instancePath || '<root>'} ${err.message || ''}`).join('\n') ||
      'unknown validation error';
    throw new Error(`Registry failed schema validation:\n${errorText}`);
  }
  const originalIds = (registry.cohorts || []).map((cohort) => cohort.id);
  canonicalizeCohortIds(registry, { touch: false });
  const renamed = [];
  (registry.cohorts || []).forEach((cohort, index) => {
    const before = originalIds[index];
    if (before && before !== cohort.id) {
      renamed.push(`${before}→${cohort.id}`);
    }
  });
  if (renamed.length) {
    console.log(`Cohort ids normalized to alphabetical sequence: ${renamed.join(', ')}`);
  }
  return registry;
}

async function persistRegistry(registry) {
  canonicalizeCohortIds(registry, { touch: true });
  registry.updatedAt = nowIso();
  const validate = await getValidator();
  if (!validate(registry)) {
    const errorText =
      validate.errors?.map((err) => `- ${err.instancePath || '<root>'} ${err.message || ''}`).join('\n') ||
      'unknown validation error';
    throw new Error(`Registry failed schema validation:\n${errorText}`);
  }
  await writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n');
  return buildRegenRequest(registry);
}

function getCohortStageEntry(cohort, segment) {
  if (!cohort) {
    return null;
  }
  if (!cohort.segments) {
    cohort.segments = {};
  }
  if (!cohort.segments[segment]) {
    cohort.segments[segment] = {};
  }
  return cohort.segments[segment];
}

function ensureCohortStage(cohort, segment) {
  const entry = getCohortStageEntry(cohort, segment);
  if (!entry.status) {
    entry.status = 'pending';
  }
  return entry;
}

function setCohortStageStatus(cohort, segment, status, options = {}) {
  const entry = ensureCohortStage(cohort, segment);
  entry.status = status;
  if (status === 'pending') {
    delete entry.startedAt;
    delete entry.completedAt;
    delete entry.durationMs;
  }
  if (options.startedAt) {
    entry.startedAt = options.startedAt;
  }
  if (options.completedAt) {
    entry.completedAt = options.completedAt;
  }
  if (options.durationMs !== undefined) {
    entry.durationMs = options.durationMs;
  }
  touchCohort(cohort);
  return entry;
}

export {
  attachPatternToCohort,
  buildRegenRequest,
  canonicalizeCohortIds,
  clearPendingRegen,
  collectDependentPatterns,
  cohortLabelFromIndex,
  detachPatternFromCohort,
  ensureCohort,
  ensureCohortStage,
  findCohortById,
  getCohortAliasMap,
  getCohortCollection,
  getCohortStageEntry,
  getPatternCohortIds,
  loadRegistry,
  markCohortForRegen,
  markPatternForRegen,
  normaliseCohortId,
  persistRegistry,
  registerScopeChange,
  removePatternFromCohort,
  resolveCanonicalCohortId,
  setCohortStageStatus,
  setPatternCohortList,
  syncCohortAssignments,
  touchCohort,
  touchPattern
};

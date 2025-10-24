import { throwUsageError } from '../cli-shared-parser.mjs';

// Stage 7 runs release sweeps across the repo; its plan-files should not block other work.
const planConflictExcludedStageIds = new Set(['7']);

function stageEligibleForPlanConflict(stageId) {
  if (!stageId) {
    return true;
  }
  const normalized = String(stageId).toLowerCase();
  return !planConflictExcludedStageIds.has(normalized);
}

function normalisePlanFiles(files) {
  if (!files || !files.length) {
    return [];
  }
  const unique = new Set();
  files.forEach((entry) => {
    if (!entry) {
      return;
    }
    const trimmed = entry.trim();
    if (trimmed && trimmed !== '0') {
      unique.add(trimmed);
    }
  });
  return [...unique].sort((a, b) => a.localeCompare(b));
}

function normalisePlanFileInputs(rawValues, descriptor, contextLabel) {
  if (!rawValues || !rawValues.length) {
    return [];
  }
  const flattened = [];
  let blankEntries = 0;
  rawValues.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      blankEntries += 1;
      return;
    }
    flattened.push(trimmed);
  });
  if (!flattened.length) {
    const label = contextLabel ? `${contextLabel}: ` : '';
    throwUsageError(descriptor, `${label}--plan-files requires at least one non-empty path`);
  }
  if (blankEntries > 0) {
    const label = contextLabel ? `${contextLabel}: ` : '';
    throwUsageError(
      descriptor,
      `${label}--plan-files received empty entries; combine values as '--plan-files "pathA,pathB"' or repeat the flag.`
    );
  }
  return normalisePlanFiles(flattened);
}

function normaliseSearchTerms(rawTerms) {
  if (!Array.isArray(rawTerms) || !rawTerms.length) {
    return [];
  }
  const unique = new Set();
  rawTerms.forEach((term) => {
    if (typeof term !== 'string') {
      return;
    }
    const trimmed = term.trim();
    if (trimmed) {
      unique.add(trimmed);
    }
  });
  return [...unique].sort((a, b) => a.localeCompare(b));
}

function normaliseSearchTermInputs(rawValues, descriptor, contextLabel) {
  if (!rawValues || !rawValues.length) {
    return [];
  }
  const flattened = [];
  let blankEntries = 0;
  rawValues.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      blankEntries += 1;
      return;
    }
    flattened.push(trimmed);
  });
  if (!flattened.length) {
    const label = contextLabel ? `${contextLabel}: ` : '';
    throwUsageError(descriptor, `${label}--search-terms requires at least one non-empty value`);
  }
  if (blankEntries > 0) {
    const label = contextLabel ? `${contextLabel}: ` : '';
    throwUsageError(descriptor, `${label}--search-terms received empty entries.`);
  }
  return normaliseSearchTerms(flattened);
}

function applyPlanFiles(target, planFiles, clearPlanFiles) {
  if (clearPlanFiles) {
    delete target.plannedFiles;
  }
  if (planFiles && planFiles.length) {
    target.plannedFiles = normalisePlanFiles(planFiles);
  }
}

function applySearchTerms(target, searchTerms, clearSearchTerms) {
  if (clearSearchTerms) {
    delete target.searchTerms;
  }
  if (searchTerms && searchTerms.length) {
    target.searchTerms = normaliseSearchTerms(searchTerms);
  }
}

function planFileKey(value) {
  if (!value) {
    return null;
  }
  return value.trim().toLowerCase();
}

function addPlanFilesToMap(map, scopeId, files) {
  if (!files || !files.length) {
    return;
  }
  files.forEach((file) => {
    const key = planFileKey(file);
    if (!key) {
      return;
    }
    const existing = map.get(key);
    if (existing) {
      existing.add(scopeId);
    } else {
      map.set(key, new Set([scopeId]));
    }
  });
}

function collectActivePlanFileMap(pattern, excludeScopeId = null) {
  const map = new Map();
  Object.entries(pattern.stageGates || {}).forEach(([stageId, gate]) => {
    if (!gate || gate.status !== 'in_progress') {
      return;
    }
    if (!stageEligibleForPlanConflict(stageId)) {
      return;
    }
    const scopeId = `stage-${stageId}`;
    if (excludeScopeId && excludeScopeId === scopeId) {
      return;
    }
    addPlanFilesToMap(map, scopeId, gate.plannedFiles || []);
  });
  Object.entries(pattern.lanes || {}).forEach(([laneId, lane]) => {
    if (!lane || lane.status !== 'in_progress') {
      return;
    }
    const scopeId = `lane-${laneId}`;
    if (excludeScopeId && excludeScopeId === scopeId) {
      return;
    }
    addPlanFilesToMap(map, scopeId, lane.plannedFiles || []);
  });
  return map;
}

function collectRegistryPlanFileMap(registry, options = {}) {
  const map = new Map();
  const excludePatternId = options.excludePatternId || null;
  const excludeScopeId = options.excludeScopeId || null;
  if (!registry || !Array.isArray(registry.patterns)) {
    return map;
  }
  registry.patterns.forEach((pattern) => {
    if (!pattern) {
      return;
    }
    const patternScopePrefix = `pattern-${pattern.patternId}`;
    Object.entries(pattern.stageGates || {}).forEach(([stageId, gate]) => {
      if (!gate || gate.status !== 'in_progress') {
        return;
      }
      if (!stageEligibleForPlanConflict(stageId)) {
        return;
      }
      const scopeId = `stage-${stageId}`;
      if (excludePatternId && pattern.patternId === excludePatternId && excludeScopeId === scopeId) {
        return;
      }
      addPlanFilesToMap(map, `${patternScopePrefix}:${scopeId}`, gate.plannedFiles || []);
    });
    Object.entries(pattern.lanes || {}).forEach(([laneId, lane]) => {
      if (!lane || lane.status !== 'in_progress') {
        return;
      }
      const scopeId = `lane-${laneId}`;
      if (excludePatternId && pattern.patternId === excludePatternId && excludeScopeId === scopeId) {
        return;
      }
      addPlanFilesToMap(map, `${patternScopePrefix}:${scopeId}`, lane.plannedFiles || []);
    });
  });
  return map;
}

function findPlanConflicts(planFiles, activeMap) {
  if (!planFiles || !planFiles.length || !activeMap.size) {
    return { conflict: false, conflicts: [] };
  }
  const conflicts = new Set();
  planFiles.forEach((file) => {
    const key = planFileKey(file);
    if (!key) {
      return;
    }
    const scopes = activeMap.get(key);
    if (scopes) {
      scopes.forEach((scope) => conflicts.add(scope));
    }
  });
  return { conflict: conflicts.size > 0, conflicts: [...conflicts].sort() };
}

function hasRegistryPlanConflict(registry, planFiles, patternId, scopeId) {
  if (!planFiles || !planFiles.length) {
    return { conflict: false, conflicts: [] };
  }
  const globalMap = collectRegistryPlanFileMap(registry, { excludePatternId: patternId, excludeScopeId: scopeId });
  if (!globalMap.size) {
    return { conflict: false, conflicts: [] };
  }
  const { conflict, conflicts } = findPlanConflicts(planFiles, globalMap);
  if (!conflict) {
    return { conflict: false, conflicts: [] };
  }
  return {
    conflict: true,
    conflicts
  };
}

function normalisePlanFileKey(path) {
  if (!path) {
    return '';
  }
  return path.trim().toLowerCase();
}

function lanePlanFileKeys(lane) {
  if (!lane) {
    return [];
  }
  return normalisePlanFiles(lane.plannedFiles || []).map(normalisePlanFileKey).filter(Boolean);
}

export {
  addPlanFilesToMap,
  applyPlanFiles,
  applySearchTerms,
  collectActivePlanFileMap,
  collectRegistryPlanFileMap,
  findPlanConflicts,
  hasRegistryPlanConflict,
  lanePlanFileKeys,
  normalisePlanFiles,
  normalisePlanFileInputs,
  normalisePlanFileKey,
  normaliseSearchTermInputs,
  normaliseSearchTerms,
  planFileKey
};

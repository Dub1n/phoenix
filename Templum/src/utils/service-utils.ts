import { createLogger } from './logger';
import { createTemplumError } from '../types/templum-types';
import { TypeAssertions, TypeGuards } from './type-guards';

const logger = createLogger('service-utils');

export type ServiceHealth = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface ServiceLike {
  id: string;
  name?: string;
  connected?: boolean;
  health?: ServiceHealth;
  priority?: number;
  responseTime?: number | null;
  confidence?: number | null;
  lastCheck?: number | null;
  tags?: string[];
  source?: string;
}

export interface ServiceSnapshot {
  id: string;
  name: string;
  connected: boolean;
  health: ServiceHealth;
  priority: number;
  responseTime: number | null;
  confidence: number;
  lastCheck: number;
  tags: string[];
  source?: string;
  score: number;
}

export interface ServiceSummary {
  connection: {
    total: number;
    connected: number;
    disconnected: number;
  };
  health: Record<ServiceHealth, number>;
  latency: {
    sampleSize: number;
    averageMs: number;
    p95Ms: number;
  };
  confidence: {
    mean: number;
    min: number;
    max: number;
    lowConfidence: string[];
  };
  updatedAt: number;
}

export interface AssessServicesOptions {
  context?: 'status-display' | 'menu-selection' | 'search-results' | 'health-monitor' | 'connection-list' | 'priority-queue';
  now?: () => number;
  lowConfidenceThreshold?: number;
}

export interface ServiceAssessment {
  ordered: ServiceSnapshot[];
  partitions: {
    connected: ServiceSnapshot[];
    disconnected: ServiceSnapshot[];
  };
  summary: ServiceSummary;
  byId: Map<string, ServiceSnapshot>;
  pick(ids: string[]): ServiceSnapshot[];
}

export type ThemeFallbackMode = 'unicode' | 'ascii' | 'simple';

export interface ThemeUsageRecord {
  id: string;
  theme: string;
  applied: boolean;
  fallbackMode: ThemeFallbackMode;
  capabilities: {
    supportsColor: boolean;
    supportsUnicode: boolean;
  };
  overrides?: string[];
}

export interface ThemeMetricsSummary {
  total: number;
  applied: number;
  fallbackModes: Record<ThemeFallbackMode, number>;
  overridesApplied: number;
  capabilityScore: {
    average: number;
    min: number;
    max: number;
  };
}

const HEALTH_SCORE: Record<ServiceHealth, number> = {
  healthy: 1,
  degraded: 0.65,
  unhealthy: 0.2,
  unknown: 0.5
};

const DEFAULT_OPTIONS: Required<Omit<AssessServicesOptions, 'context'>> = {
  now: () => Date.now(),
  lowConfidenceThreshold: 0.7
};

export function assessServices(inputs: ServiceLike[], options: AssessServicesOptions = {}): ServiceAssessment {
  const safeInputs = Array.isArray(inputs) ? inputs : [];
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const isNowFunction = (value: unknown): value is () => number =>
    TypeGuards.isFunction(value);

  const sanitizedOptions: Required<Omit<AssessServicesOptions, 'context'>> = {
    now: TypeAssertions.safeCast(mergedOptions.now, isNowFunction, DEFAULT_OPTIONS.now),
    lowConfidenceThreshold: TypeAssertions.safeCast(
      mergedOptions.lowConfidenceThreshold,
      TypeGuards.isNumber,
      DEFAULT_OPTIONS.lowConfidenceThreshold,
    ),
  };

  const normalized = dedupeServices(safeInputs, sanitizedOptions);
  const ordered = orderServices(normalized, options.context);

  const byId = new Map(ordered.map((service) => [service.id, service]));
  const summary = buildSummary(ordered, sanitizedOptions);
  const partitions = partitionServices(ordered);

  return {
    ordered,
    partitions,
    summary,
    byId,
    pick: (ids) => pickServices(ids, ordered)
  };
}

function dedupeServices(inputs: ServiceLike[], options: Required<Omit<AssessServicesOptions, 'context'>>): ServiceSnapshot[] {
  const map = new Map<string, ServiceSnapshot>();

  inputs.forEach((input, index) => {
    const validatedInput = ensureServiceRecord(input, index);
    const snapshot = normalizeService(validatedInput, options);
    const existing = map.get(snapshot.id);

    if (!existing) {
      map.set(snapshot.id, snapshot);
      return;
    }

    const preferred = pickPreferred(existing, snapshot);
    map.set(snapshot.id, preferred);
  });

  return Array.from(map.values());
}

function normalizeService(input: ServiceLike, options: Required<Omit<AssessServicesOptions, 'context'>>): ServiceSnapshot {
  const name = TypeGuards.isNonEmptyString(input.name) ? input.name.trim() : input.id;
  const connected = Boolean(input.connected);
  const health = normaliseHealth(input.health);
  const priority = TypeGuards.isNumber(input.priority)
    ? Math.max(0, input.priority)
    : 0;
  const responseTime = normaliseResponseTime(input.responseTime);
  const confidence = clamp(TypeGuards.isNumber(input.confidence) ? input.confidence : 0.5, 0, 1);
  const lastCheck = TypeGuards.isNumber(input.lastCheck) ? input.lastCheck : options.now();
  const tags = Array.isArray(input.tags)
    ? Array.from(new Set(input.tags.filter((tag): tag is string => TypeGuards.isNonEmptyString(tag))))
    : [];
  const score = scoreService({ connected, health, priority, responseTime, confidence });

  return {
    id: input.id,
    name,
    connected,
    health,
    priority,
    responseTime,
    confidence,
    lastCheck,
    tags,
    source: input.source,
    score
  };
}

function normaliseHealth(value?: ServiceHealth): ServiceHealth {
  if (!value) return 'unknown';
  if (value === 'healthy' || value === 'degraded' || value === 'unhealthy' || value === 'unknown') {
    return value;
  }
  return 'unknown';
}

function normaliseResponseTime(value: number | null | undefined): number | null {
  if (!TypeGuards.isNumber(value) || Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, value);
}

function ensureServiceRecord(input: ServiceLike, index: number): ServiceLike {
  if (!TypeGuards.isNonEmptyString(input?.id)) {
    throw createTemplumError(
      'Service record must include an id',
      'SERVICE_UTILS_INVALID_INPUT',
      'validation',
      { index, missingField: 'id' }
    );
  }

  if (input.priority !== undefined && !TypeGuards.isNumber(input.priority)) {
    throw createTemplumError(
      'Service record priority must be a number when provided',
      'SERVICE_UTILS_INVALID_INPUT',
      'validation',
      { index, field: 'priority', value: input.priority }
    );
  }

  if (input.responseTime !== undefined && input.responseTime !== null && !TypeGuards.isNumber(input.responseTime)) {
    throw createTemplumError(
      'Service record responseTime must be numeric when provided',
      'SERVICE_UTILS_INVALID_INPUT',
      'validation',
      { index, field: 'responseTime', value: input.responseTime }
    );
  }

  if (input.confidence !== undefined && !TypeGuards.isNumber(input.confidence)) {
    throw createTemplumError(
      'Service record confidence must be numeric when provided',
      'SERVICE_UTILS_INVALID_INPUT',
      'validation',
      { index, field: 'confidence', value: input.confidence }
    );
  }

  return input;
}

function scoreService(record: {
  connected: boolean;
  health: ServiceHealth;
  priority: number;
  responseTime: number | null;
  confidence: number;
}): number {
  const connectivity = record.connected ? 0.4 : 0;
  const health = (HEALTH_SCORE[record.health] ?? 0.5) * 0.3;
  const priorityBoost = Math.min(0.15, record.priority * 0.03);
  const confidenceBoost = clamp(record.confidence, 0, 1) * 0.15;
  const latencyPenalty = record.responseTime == null ? 0.05 : Math.min(0.25, record.responseTime / 400);

  const rawScore = connectivity + health + priorityBoost + confidenceBoost - latencyPenalty;
  return Math.round(clamp(rawScore, 0, 1) * 100); // 0-100 scale
}

function pickPreferred(existing: ServiceSnapshot, candidate: ServiceSnapshot): ServiceSnapshot {
  if (candidate.connected && !existing.connected) return candidate;
  if (!candidate.connected && existing.connected) return existing;
  if (candidate.confidence !== existing.confidence) {
    return candidate.confidence > existing.confidence ? candidate : existing;
  }
  if (candidate.lastCheck !== existing.lastCheck) {
    return candidate.lastCheck > existing.lastCheck ? candidate : existing;
  }
  if (candidate.score !== existing.score) {
    return candidate.score > existing.score ? candidate : existing;
  }
  if (candidate.responseTime != null && existing.responseTime == null) return candidate;
  if (candidate.responseTime == null && existing.responseTime != null) return existing;
  return candidate;
}

function orderServices(services: ServiceSnapshot[], context: AssessServicesOptions['context']): ServiceSnapshot[] {
  const cloned = [...services];
  cloned.sort((a, b) => compareServices(a, b, context));
  return cloned;
}

function compareServices(a: ServiceSnapshot, b: ServiceSnapshot, context: AssessServicesOptions['context']): number {
  if (a.connected !== b.connected) {
    return a.connected ? -1 : 1;
  }

  const healthOrder: Record<ServiceHealth, number> = {
    healthy: 0,
    degraded: 1,
    unhealthy: 2,
    unknown: 3
  };
  if (a.health !== b.health) {
    return healthOrder[a.health] - healthOrder[b.health];
  }

  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }

  if (context === 'status-display' && a.responseTime != null && b.responseTime != null) {
    const delta = a.responseTime - b.responseTime;
    if (Math.abs(delta) > 10) {
      return delta;
    }
  }

  if (a.score !== b.score) {
    return b.score - a.score;
  }

  const aKey = a.name.toLowerCase();
  const bKey = b.name.toLowerCase();
  if (aKey < bKey) return -1;
  if (aKey > bKey) return 1;
  return 0;
}

function partitionServices(services: ServiceSnapshot[]) {
  const connected: ServiceSnapshot[] = [];
  const disconnected: ServiceSnapshot[] = [];

  for (const service of services) {
    if (service.connected) {
      connected.push(service);
    } else {
      disconnected.push(service);
    }
  }

  return { connected, disconnected };
}

function buildSummary(services: ServiceSnapshot[], options: Required<Omit<AssessServicesOptions, 'context'>>): ServiceSummary {
  const connection = {
    total: services.length,
    connected: services.filter((service) => service.connected).length,
    disconnected: services.filter((service) => !service.connected).length
  };

  const health: Record<ServiceHealth, number> = {
    healthy: 0,
    degraded: 0,
    unhealthy: 0,
    unknown: 0
  };
  for (const service of services) {
    health[service.health] += 1;
  }

  const latencyValues = services
    .map((service) => service.responseTime)
    .filter((value): value is number => value != null);
  const latency = {
    sampleSize: latencyValues.length,
    averageMs: latencyValues.length ? average(latencyValues) : 0,
    p95Ms: latencyValues.length ? percentile(latencyValues, 0.95) : 0
  };

  const confidenceValues = services.map((service) => service.confidence);
  const confidence = {
    mean: confidenceValues.length ? average(confidenceValues) : 0,
    min: confidenceValues.length ? Math.min(...confidenceValues) : 0,
    max: confidenceValues.length ? Math.max(...confidenceValues) : 0,
    lowConfidence: services
      .filter((service) => service.confidence < options.lowConfidenceThreshold)
      .map((service) => service.id)
  };

  return {
    connection,
    health,
    latency,
    confidence,
    updatedAt: options.now()
  };
}

function pickServices(ids: string[], ordered: ServiceSnapshot[]): ServiceSnapshot[] {
  const requested = new Set(ids);
  return ordered.filter((service) => requested.has(service.id));
}

export function summariseThemeUsage(records: ThemeUsageRecord[]): ThemeMetricsSummary {
  const fallbackCounts: Record<ThemeFallbackMode, number> = {
    unicode: 0,
    ascii: 0,
    simple: 0,
  };

  const deduped = new Map<string, { record: ThemeUsageRecord; score: number }>();
  const safeRecords = Array.isArray(records) ? records : [];

  safeRecords.forEach((raw, index) => {
    const normalised = normaliseThemeUsage(raw, index);
    if (!normalised) {
      return;
    }

    const score = computeThemeCapabilityScore(normalised);
    const current = deduped.get(normalised.id);

    if (!current || shouldReplaceThemeRecord(normalised, score, current.record, current.score)) {
      deduped.set(normalised.id, { record: normalised, score });
    }
  });

  if (deduped.size === 0) {
    return {
      total: 0,
      applied: 0,
      fallbackModes: fallbackCounts,
      overridesApplied: 0,
      capabilityScore: { average: 0, min: 0, max: 0 },
    };
  }

  let applied = 0;
  let overridesApplied = 0;
  let totalScore = 0;
  let minScore = Number.POSITIVE_INFINITY;
  let maxScore = Number.NEGATIVE_INFINITY;

  for (const { record, score } of deduped.values()) {
    fallbackCounts[record.fallbackMode] += 1;
    if (record.applied) {
      applied += 1;
    }
    overridesApplied += record.overrides?.length ?? 0;
    totalScore += score;
    minScore = Math.min(minScore, score);
    maxScore = Math.max(maxScore, score);
  }

  const averageScore = clamp(totalScore / deduped.size, 0, 1);

  return {
    total: deduped.size,
    applied,
    fallbackModes: fallbackCounts,
    overridesApplied,
    capabilityScore: {
      average: averageScore,
      min: clamp(minScore, 0, 1),
      max: clamp(maxScore, 0, 1),
    },
  };
}

function normaliseThemeUsage(raw: ThemeUsageRecord, index: number): ThemeUsageRecord | null {
  if (!TypeGuards.isNonEmptyString(raw?.id)) {
    logger.warn('Skipping theme usage record with invalid id', { index, record: raw });
    return null;
  }

  const theme = TypeGuards.isNonEmptyString(raw.theme) ? raw.theme : 'default';
  const fallback = raw.fallbackMode;
  const fallbackMode: ThemeFallbackMode = fallback === 'ascii' || fallback === 'simple' ? fallback : 'unicode';

  const supportsColor = Boolean(raw.capabilities?.supportsColor);
  const supportsUnicode = Boolean(raw.capabilities?.supportsUnicode);

  const overrides = Array.isArray(raw.overrides)
    ? raw.overrides.filter((value): value is string => TypeGuards.isNonEmptyString(value))
    : [];

  return {
    id: raw.id,
    theme,
    applied: Boolean(raw.applied),
    fallbackMode,
    capabilities: {
      supportsColor,
      supportsUnicode,
    },
    overrides,
  };
}

function shouldReplaceThemeRecord(
  candidate: ThemeUsageRecord,
  candidateScore: number,
  current: ThemeUsageRecord,
  currentScore: number,
): boolean {
  if (candidate.applied !== current.applied) {
    return candidate.applied;
  }

  if (candidateScore !== currentScore) {
    return candidateScore > currentScore;
  }

  const candidatePreference = fallbackPreference(candidate.fallbackMode);
  const currentPreference = fallbackPreference(current.fallbackMode);
  if (candidatePreference !== currentPreference) {
    return candidatePreference > currentPreference;
  }

  return true;
}

function fallbackPreference(mode: ThemeFallbackMode): number {
  switch (mode) {
    case 'unicode':
      return 3;
    case 'ascii':
      return 2;
    case 'simple':
    default:
      return 1;
  }
}

function computeThemeCapabilityScore(record: ThemeUsageRecord): number {
  let score = 0;
  if (record.capabilities.supportsColor) {
    score += 0.4;
  }
  if (record.capabilities.supportsUnicode) {
    score += 0.4;
  }
  if (record.applied) {
    score += 0.15;
  }

  if (record.fallbackMode === 'unicode') {
    score += 0.05;
  } else if (record.fallbackMode === 'ascii') {
    score -= 0.1;
  } else {
    score -= 0.2;
  }

  return clamp(score, 0, 1);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function percentile(values: number[], ratio: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(ratio * sorted.length));
  return sorted[index];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

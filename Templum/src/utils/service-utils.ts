import { createLogger } from './logger';
import { ErrorHandler } from './error-handler';

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

  const normalized = dedupeServices(safeInputs, mergedOptions);
  const ordered = orderServices(normalized, options.context);

  const byId = new Map(ordered.map((service) => [service.id, service]));
  const summary = buildSummary(ordered, mergedOptions);
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

  for (const input of inputs) {
    try {
      const snapshot = normalizeService(input, options);
      const existing = map.get(snapshot.id);

      if (!existing) {
        map.set(snapshot.id, snapshot);
        continue;
      }

      const preferred = pickPreferred(existing, snapshot);
      map.set(snapshot.id, preferred);
    } catch (error) {
      const templumError = ErrorHandler.handle(error, 'service-utils.normalize');
      logger.warn('Failed to normalise service record', { error: templumError.message, id: input?.id });
    }
  }

  return Array.from(map.values());
}

function normalizeService(input: ServiceLike, options: Required<Omit<AssessServicesOptions, 'context'>>): ServiceSnapshot {
  if (!input?.id) {
    throw new Error('Service record must include an id');
  }

  const name = typeof input.name === 'string' && input.name.trim() ? input.name.trim() : input.id;
  const connected = Boolean(input.connected);
  const health = normaliseHealth(input.health);
  const priority = Number.isFinite(input.priority) ? Math.max(0, Number(input.priority)) : 0;
  const responseTime = normaliseResponseTime(input.responseTime);
  const confidence = clamp(typeof input.confidence === 'number' ? input.confidence : 0.5, 0, 1);
  const lastCheck = typeof input.lastCheck === 'number' ? input.lastCheck : options.now();
  const tags = Array.isArray(input.tags) ? Array.from(new Set(input.tags.filter(Boolean))) : [];
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
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, value);
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

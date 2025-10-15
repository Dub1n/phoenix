import * as fs from 'fs';
import * as path from 'path';

export interface Phase6BaselineMetricDefinition {
  metric: string;
  baselineValue: number;
  target: number;
  criticalThreshold: number;
  higherIsBetter?: boolean;
  unit?: string;
  sampleSize?: number;
  notes?: string;
}

export interface Phase6BaselineFile {
  baselineRunId: string;
  capturedAt: string;
  command: string;
  source?: string;
  metrics: Phase6BaselineMetricDefinition[];
  metadata?: Record<string, unknown>;
}

export interface BaselineLoadResult {
  data: Phase6BaselineFile;
  map: Map<string, Phase6BaselineMetricDefinition>;
}

export class Phase6PerformanceBaselineLoader {
  private readonly baselinePath: string;

  constructor(baselinePath: string) {
    this.baselinePath = path.resolve(baselinePath);
  }

  load(): BaselineLoadResult {
    if (!fs.existsSync(this.baselinePath)) {
      throw new Error(`Phase 6 baseline file not found at ${this.baselinePath}`);
    }

    const raw = fs.readFileSync(this.baselinePath, 'utf8');
    const data = JSON.parse(raw) as Phase6BaselineFile;

    if (!Array.isArray(data.metrics) || data.metrics.length === 0) {
      throw new Error(`Phase 6 baseline file is missing metric definitions (${this.baselinePath})`);
    }

    const map = new Map<string, Phase6BaselineMetricDefinition>();
    for (const metric of data.metrics) {
      if (!metric || typeof metric.metric !== 'string') {
        continue;
      }
      map.set(metric.metric, metric);
    }

    return { data, map };
  }
}


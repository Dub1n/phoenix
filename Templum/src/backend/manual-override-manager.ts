import { EventEmitter } from 'events';
import type { DiscoveredService } from './service-discovery';

export type ManualOverrideScope = 'session' | 'global';

export interface ManualOverrideOptions {
  scope?: ManualOverrideScope;
  expiresAt?: number;
  reason?: string;
}

export interface ManualOverrideMetadata {
  discoveryMethod?: DiscoveredService['discoveryMethod'];
  confidence?: number;
}

export interface ManualOverrideDescriptor {
  serviceId: string;
  scope: ManualOverrideScope;
  appliedAt: number;
  expiresAt?: number;
  reason?: string;
  metadata?: ManualOverrideMetadata;
}

export interface ManualOverrideSnapshot {
  overrides: ManualOverrideDescriptor[];
  updatedAt: number;
}

export interface ManualOverrideAppliedEvent {
  descriptor: ManualOverrideDescriptor;
  snapshot: ManualOverrideSnapshot;
}

export interface ManualOverrideClearedEvent {
  descriptor?: ManualOverrideDescriptor;
  snapshot: ManualOverrideSnapshot;
}

export type ManualOverrideClearResult = ManualOverrideClearedEvent;

interface ManualOverrideRecord {
  descriptor: ManualOverrideDescriptor;
}

export declare interface ManualOverrideManager {
  on(event: 'manualOverride:applied', listener: (payload: ManualOverrideAppliedEvent) => void): this;
  on(event: 'manualOverride:cleared', listener: (payload: ManualOverrideClearedEvent) => void): this;
  emit(event: 'manualOverride:applied', payload: ManualOverrideAppliedEvent): boolean;
  emit(event: 'manualOverride:cleared', payload: ManualOverrideClearedEvent): boolean;
}

export class ManualOverrideManager extends EventEmitter {
  private overrides = new Map<string, ManualOverrideRecord>();

  applyOverride(
    serviceId: string,
    metadata: ManualOverrideMetadata | undefined,
    options: ManualOverrideOptions = {}
  ): ManualOverrideDescriptor {
    const descriptor: ManualOverrideDescriptor = {
      serviceId,
      scope: options.scope ?? 'session',
      appliedAt: Date.now(),
      expiresAt: options.expiresAt,
      reason: options.reason,
      metadata: metadata && Object.keys(metadata).length > 0 ? { ...metadata } : undefined
    };

    this.overrides.set(serviceId, { descriptor });
    const snapshot = this.buildSnapshot();
    this.emit('manualOverride:applied', { descriptor, snapshot });
    return descriptor;
  }

  clearOverride(serviceId?: string): ManualOverrideClearedEvent {
    let descriptor: ManualOverrideDescriptor | undefined;

    if (serviceId) {
      descriptor = this.overrides.get(serviceId)?.descriptor;
      this.overrides.delete(serviceId);
    } else {
      descriptor = undefined;
      this.overrides.clear();
    }

    const snapshot = this.buildSnapshot();
    this.emit('manualOverride:cleared', { descriptor, snapshot });
    return { descriptor, snapshot };
  }

  handleServiceRemoval(serviceId: string): ManualOverrideClearedEvent | undefined {
    if (!this.overrides.has(serviceId)) {
      return undefined;
    }

    const descriptor = this.overrides.get(serviceId)?.descriptor;
    this.overrides.delete(serviceId);
    const snapshot = this.buildSnapshot();
    const payload: ManualOverrideClearedEvent = { descriptor, snapshot };
    this.emit('manualOverride:cleared', payload);
    return payload;
  }

  pruneExpired(now: number = Date.now()): ManualOverrideDescriptor[] {
    const removed: ManualOverrideDescriptor[] = [];

    for (const [serviceId, record] of Array.from(this.overrides.entries())) {
      const { descriptor } = record;
      if (descriptor.expiresAt && descriptor.expiresAt <= now) {
        removed.push(descriptor);
        this.overrides.delete(serviceId);
      }
    }

    if (removed.length > 0) {
      const snapshot = this.buildSnapshot();
      this.emit('manualOverride:cleared', { descriptor: undefined, snapshot });
    }

    return removed;
  }

  getSnapshot(): ManualOverrideSnapshot {
    return this.buildSnapshot();
  }

  hasOverride(serviceId: string): boolean {
    return this.overrides.has(serviceId);
  }

  syncWithServices(serviceIds: Set<string>): ManualOverrideDescriptor[] {
    const removed: ManualOverrideDescriptor[] = [];

    for (const [serviceId, record] of Array.from(this.overrides.entries())) {
      if (!serviceIds.has(serviceId)) {
        removed.push(record.descriptor);
        this.overrides.delete(serviceId);
      }
    }

    if (removed.length > 0) {
      const snapshot = this.buildSnapshot();
      this.emit('manualOverride:cleared', { descriptor: undefined, snapshot });
    }

    return removed;
  }

  private buildSnapshot(): ManualOverrideSnapshot {
    const overrides = Array.from(this.overrides.values())
      .map(record => record.descriptor)
      .sort((a, b) => a.serviceId.localeCompare(b.serviceId));

    return {
      overrides,
      updatedAt: Date.now()
    };
  }
}

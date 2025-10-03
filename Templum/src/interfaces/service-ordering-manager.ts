/**
---
date: 2025-09-13T103229Z
name: service-ordering-manager
TASK-ID: [TASK-MCP-009]
category: CLI-Design-Consistency
status: [T]
patterns: [Service-Ordering, Connected-First-Alphabetical, Priority-Sorting]
components: [ServiceOrderingManager, Service-Comparators, Priority-Logic]
dependencies: [display-standards-calculator, templum-types]
tags: [CLI, Service-Ordering, Connected-Services, Alphabetical-Sort]
---
*/

import { DisplayUtils, ServiceOrderOptions } from '../utils/display-utils';

/**
 * TODO: [TASK-ID-002] Pattern: connected-first-alphabetical-ordering | Complexity: 5 | Dependencies: service-status-detection
 * Context: Service ordering logic that prioritizes connected services above disconnected ones, with alphabetical ordering within each group
 * Validation-Required: connection-status-accuracy, alphabetical-sorting-correctness, edge-case-handling
 * Pattern-Info: { approach: "multi-tier-sorting", alternatives: "single-sort-key", trade-offs: "complexity-vs-user-experience" }
 */

/**
 * Service information interface for ordering
 */
export interface ServiceInfo {
  id: string;
  name?: string;
  connected: boolean;
  health?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  priority?: number;
  responseTime?: number;
  capabilities?: string[];
  lastCheck?: number;
  category?: string;
  version?: string;
  metadata?: Record<string, any>;
}

/**
 * Service ordering context for different display scenarios
 */
export type ServiceOrderingContext = 
  | 'status-display'
  | 'menu-selection'
  | 'search-results'
  | 'health-monitor'
  | 'connection-list'
  | 'priority-queue';

/**
 * Ordering configuration options
 */
export interface ServiceOrderingConfig {
  prioritizeConnected: boolean;
  alphabeticalWithinTier: boolean;
  healthPriority: boolean;
  responsiveTimePriority: boolean;
  customPriorityWeight: number;
  caseSensitiveSort: boolean;
  groupByCategory: boolean;
}

/**
 * Service ordering result with metadata
 */
export interface ServiceOrderingResult {
  orderedServices: ServiceInfo[];
  connectedCount: number;
  disconnectedCount: number;
  healthyCount: number;
  totalCount: number;
  averageResponseTime?: number;
  orderingMetadata: {
    appliedRules: string[];
    sortingContext: ServiceOrderingContext;
    timestamp: number;
  };
}

/**
 * Service ordering manager implementing connected-first, alphabetical ordering
 */
interface DisplayOrderProxy {
  status: string;
  name: string;
  source: ServiceInfo;
}

export class ServiceOrderingManager {
  private config: ServiceOrderingConfig;

  constructor(config?: Partial<ServiceOrderingConfig>) {
    this.config = {
      prioritizeConnected: true, // Key requirement: connected services first
      alphabeticalWithinTier: true, // Key requirement: alphabetical within tiers
      healthPriority: true,
      responsiveTimePriority: false,
      customPriorityWeight: 1.0,
      caseSensitiveSort: false,
      groupByCategory: false,
      ...config
    };
  }

  orderServices(
    services: ServiceInfo[],
    context: ServiceOrderingContext = 'status-display'
  ): ServiceOrderingResult {
    if (!services || services.length === 0) {
      return this.createEmptyResult(context);
    }

    const orderedByDisplay = this.resolveDisplayOrder(services, context);
    const orderedServices = this.applyResponseTimePriority(orderedByDisplay, context);

    const connectedCount = orderedServices.filter(service => service.connected).length;
    const disconnectedCount = orderedServices.length - connectedCount;
    const healthyCount = orderedServices.filter(service => service.health === 'healthy').length;
    const totalCount = orderedServices.length;
    const averageResponseTime = this.calculateAverageResponseTime(orderedServices);

    return {
      orderedServices,
      connectedCount,
      disconnectedCount,
      healthyCount,
      totalCount,
      averageResponseTime,
      orderingMetadata: {
        appliedRules: this.getAppliedRules(),
        sortingContext: context,
        timestamp: Date.now()
      }
    };
  }

  sortServices(services: ServiceInfo[]): ServiceInfo[] {
    return this.orderServices(services).orderedServices;
  }

  prioritizeConnected(services: ServiceInfo[]): ServiceInfo[] {
    return this.resolveDisplayOrder(services, 'status-display', {
      connectedFirst: true,
      alphabetical: true
    });
  }

  sortAlphabetical(services: ServiceInfo[]): ServiceInfo[] {
    return [...services].sort((a, b) => this.compareAlphabetically(a, b));
  }

  groupByCategory(
    services: ServiceInfo[],
    context: ServiceOrderingContext = 'status-display'
  ): Map<string, ServiceInfo[]> {
    const groups = new Map<string, ServiceInfo[]>();

    for (const service of services) {
      const category = service.category || 'uncategorized';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(service);
    }

    for (const [category, categoryServices] of groups.entries()) {
      const sortedServices = this.orderServices(categoryServices, context).orderedServices;
      groups.set(category, sortedServices);
    }

    const sortedCategories = Array.from(groups.keys()).sort();
    const sortedGroups = new Map<string, ServiceInfo[]>();

    for (const category of sortedCategories) {
      sortedGroups.set(category, groups.get(category)!);
    }

    return sortedGroups;
  }

  filterByConnectionStatus(services: ServiceInfo[], connected: boolean): ServiceInfo[] {
    return services.filter(service => service.connected === connected);
  }

  filterByHealthStatus(services: ServiceInfo[], health: ServiceInfo['health']): ServiceInfo[] {
    return services.filter(service => service.health === health);
  }

  sortByResponseTime(services: ServiceInfo[]): ServiceInfo[] {
    return [...services].sort((a, b) => {
      if (typeof a.responseTime !== 'number' && typeof b.responseTime !== 'number') {
        return 0;
      }
      if (typeof a.responseTime !== 'number') {
        return 1;
      }
      if (typeof b.responseTime !== 'number') {
        return -1;
      }

      return a.responseTime - b.responseTime;
    });
  }

  sortByHealthPriority(services: ServiceInfo[]): ServiceInfo[] {
    const healthPriorityOrder: Record<string, number> = {
      healthy: 0,
      degraded: 1,
      unhealthy: 2,
      unknown: 3
    };

    return [...services].sort((a, b) => {
      const aPriority = healthPriorityOrder[a.health || 'unknown'];
      const bPriority = healthPriorityOrder[b.health || 'unknown'];

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return this.compareAlphabetically(a, b);
    });
  }

  updateConfiguration(config: Partial<ServiceOrderingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfiguration(): ServiceOrderingConfig {
    return { ...this.config };
  }

  validateOrdering(result: ServiceOrderingResult): boolean {
    const { orderedServices } = result;

    if (!this.config.prioritizeConnected) {
      return true;
    }

    let foundDisconnected = false;
    for (const service of orderedServices) {
      if (!service.connected) {
        foundDisconnected = true;
      } else if (foundDisconnected) {
        return false;
      }
    }

    if (this.config.alphabeticalWithinTier) {
      const connected = orderedServices.filter(service => service.connected);
      const disconnected = orderedServices.filter(service => !service.connected);

      return this.isAlphabeticallySorted(connected) && this.isAlphabeticallySorted(disconnected);
    }

    return true;
  }

  private resolveDisplayOrder(
    services: ServiceInfo[],
    _context: ServiceOrderingContext,
    overrides?: ServiceOrderOptions
  ): ServiceInfo[] {
    const options: ServiceOrderOptions = {
      connectedFirst: this.config.prioritizeConnected,
      alphabetical: this.config.alphabeticalWithinTier,
      ...overrides
    };

    const alphabeticalEnabled = options.alphabetical ?? true;

    const proxies: DisplayOrderProxy[] = services.map((service, index) =>
      this.createDisplayProxy(service, index, alphabeticalEnabled)
    );

    const ordered = DisplayUtils.orderServices(proxies, options);
    return ordered.map(proxy => proxy.source);
  }

  private createDisplayProxy(
    service: ServiceInfo,
    index: number,
    alphabeticalEnabled: boolean
  ): DisplayOrderProxy {
    return {
      status: this.deriveDisplayStatus(service),
      name: this.createSortKey(service, index, alphabeticalEnabled),
      source: service
    };
  }

  private deriveDisplayStatus(service: ServiceInfo): string {
    return service.connected ? 'connected' : 'inactive';
  }

  private createSortKey(
    service: ServiceInfo,
    originalIndex: number,
    alphabeticalEnabled: boolean
  ): string {
    const tokens = [
      this.formatNumberToken(this.getHealthRank(service)),
      this.formatNumberToken(this.getPriorityRank(service))
    ];

    if (alphabeticalEnabled) {
      tokens.push(this.getAlphabeticalKey(service));
    } else {
      tokens.push(this.formatNumberToken(originalIndex, 6));
    }

    return tokens.join('|');
  }

  private getAlphabeticalKey(service: ServiceInfo): string {
    const key = service.name || service.id;
    return this.config.caseSensitiveSort ? key : key.toLowerCase();
  }

  private getHealthRank(service: ServiceInfo): number {
    if (!this.config.healthPriority) {
      return 0;
    }

    const healthOrder: Record<ServiceInfo['health'] | 'fallback', number> = {
      healthy: 0,
      degraded: 1,
      unhealthy: 2,
      unknown: 3,
      fallback: 3
    };

    return healthOrder[service.health ?? 'fallback'] ?? 3;
  }

  private getPriorityRank(service: ServiceInfo): number {
    const weight = typeof this.config.customPriorityWeight === 'number'
      ? this.config.customPriorityWeight
      : 0;

    if (weight <= 0 || typeof service.priority !== 'number') {
      return 9999;
    }

    const scaled = 9999 - Math.round(service.priority * weight * 100);
    return Math.max(0, Math.min(9999, scaled));
  }

  private formatNumberToken(value: number, size = 4): string {
    const max = 10 ** size - 1;
    const clamped = Math.min(Math.max(0, Math.floor(value)), max);
    return clamped.toString().padStart(size, '0');
  }

  private applyResponseTimePriority(
    services: ServiceInfo[],
    context: ServiceOrderingContext
  ): ServiceInfo[] {
    if (!this.config.responsiveTimePriority || context !== 'status-display') {
      return services;
    }

    const connectedWithTimings = services
      .map((service, index) => ({ service, index }))
      .filter(item => item.service.connected && typeof item.service.responseTime === 'number');

    if (connectedWithTimings.length < 2) {
      return services;
    }

    const sorted = [...connectedWithTimings].sort((a, b) => {
      const diff = (a.service.responseTime ?? 0) - (b.service.responseTime ?? 0);
      if (Math.abs(diff) <= 10) {
        return 0;
      }
      return diff;
    });

    const result = [...services];
    const connectedIndices = connectedWithTimings.map(item => item.index);

    for (let i = 0; i < connectedIndices.length; i++) {
      result[connectedIndices[i]] = sorted[i].service;
    }

    return result;
  }

  private calculateAverageResponseTime(services: ServiceInfo[]): number | undefined {
    const connectedWithResponse = services.filter(
      service => service.connected && typeof service.responseTime === 'number'
    );

    if (connectedWithResponse.length === 0) {
      return undefined;
    }

    const total = connectedWithResponse.reduce(
      (sum, service) => sum + (service.responseTime ?? 0),
      0
    );

    return total / connectedWithResponse.length;
  }

  private compareAlphabetically(a: ServiceInfo, b: ServiceInfo): number {
    const aKey = this.getAlphabeticalKey(a);
    const bKey = this.getAlphabeticalKey(b);
    return aKey.localeCompare(bKey);
  }

  private isAlphabeticallySorted(services: ServiceInfo[]): boolean {
    for (let i = 1; i < services.length; i++) {
      if (this.compareAlphabetically(services[i - 1], services[i]) > 0) {
        return false;
      }
    }
    return true;
  }

  private getAppliedRules(): string[] {
    const rules: string[] = [];

    if (this.config.prioritizeConnected) {
      rules.push('connected-services-first');
    }

    if (this.config.alphabeticalWithinTier) {
      rules.push('alphabetical-within-tier');
    }

    if (this.config.healthPriority) {
      rules.push('health-priority-ordering');
    }

    if (this.config.responsiveTimePriority) {
      rules.push('response-time-optimization');
    }

    if (this.config.groupByCategory) {
      rules.push('category-grouping');
    }

    return rules;
  }

  private createEmptyResult(context: ServiceOrderingContext): ServiceOrderingResult {
    return {
      orderedServices: [],
      connectedCount: 0,
      disconnectedCount: 0,
      healthyCount: 0,
      totalCount: 0,
      orderingMetadata: {
        appliedRules: [],
        sortingContext: context,
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Factory function for creating service ordering manager
 */
export function createServiceOrderingManager(config?: Partial<ServiceOrderingConfig>): ServiceOrderingManager {
  return new ServiceOrderingManager(config);
}

/**
 * Utility function for quick connected-first, alphabetical sorting
 */
export function quickSortServices(services: ServiceInfo[]): ServiceInfo[] {
  const manager = createServiceOrderingManager();
  return manager.sortServices(services);
}

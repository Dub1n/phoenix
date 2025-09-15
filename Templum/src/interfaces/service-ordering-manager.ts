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
 * Service comparison result
 */
interface ServiceComparisonResult {
  comparison: number; // -1, 0, 1 for sorting
  reasons: string[]; // Explanation of why this order was chosen
}

/**
 * Service ordering manager implementing connected-first, alphabetical ordering
 */
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

  /**
   * Primary service ordering method: Connected services above disconnected, alphabetical ordering
   */
  orderServices(services: ServiceInfo[], context: ServiceOrderingContext = 'status-display'): ServiceOrderingResult {
    if (!services || services.length === 0) {
      return this.createEmptyResult(context);
    }

    // Create a copy to avoid mutating original array
    const servicesToSort = [...services];
    
    // Apply the main sorting algorithm
    const orderedServices = servicesToSort.sort((a, b) => {
      return this.compareServices(a, b, context).comparison;
    });

    // Calculate statistics
    const connectedCount = orderedServices.filter(s => s.connected).length;
    const disconnectedCount = orderedServices.length - connectedCount;
    const healthyCount = orderedServices.filter(s => s.health === 'healthy').length;
    const totalCount = orderedServices.length;
    
    // Calculate average response time for connected services
    const connectedServices = orderedServices.filter(s => s.connected && s.responseTime);
    const averageResponseTime = connectedServices.length > 0 
      ? connectedServices.reduce((sum, s) => sum + (s.responseTime || 0), 0) / connectedServices.length 
      : undefined;

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

  /**
   * Sort services with connected-first, alphabetical-within-tier algorithm
   */
  sortServices(services: ServiceInfo[]): ServiceInfo[] {
    return this.orderServices(services).orderedServices;
  }

  /**
   * Prioritize connected services over disconnected ones
   */
  prioritizeConnected(services: ServiceInfo[]): ServiceInfo[] {
    const connected = services.filter(s => s.connected);
    const disconnected = services.filter(s => !s.connected);
    
    // Sort alphabetically within each tier
    const sortedConnected = this.sortAlphabetical(connected);
    const sortedDisconnected = this.sortAlphabetical(disconnected);
    
    return [...sortedConnected, ...sortedDisconnected];
  }

  /**
   * Sort services alphabetically by ID
   */
  sortAlphabetical(services: ServiceInfo[]): ServiceInfo[] {
    return [...services].sort((a, b) => {
      const aKey = a.name || a.id;
      const bKey = b.name || b.id;
      
      if (this.config.caseSensitiveSort) {
        return aKey.localeCompare(bKey);
      } else {
        return aKey.toLowerCase().localeCompare(bKey.toLowerCase());
      }
    });
  }

  /**
   * Group services by category while maintaining ordering within groups
   */
  groupByCategory(services: ServiceInfo[], context: ServiceOrderingContext = 'status-display'): Map<string, ServiceInfo[]> {
    const groups = new Map<string, ServiceInfo[]>();
    
    // Group services by category
    for (const service of services) {
      const category = service.category || 'uncategorized';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(service);
    }

    // Sort services within each category
    for (const [category, categoryServices] of groups.entries()) {
      const sortedServices = this.orderServices(categoryServices, context).orderedServices;
      groups.set(category, sortedServices);
    }

    // Sort categories alphabetically
    const sortedCategories = Array.from(groups.keys()).sort();
    const sortedGroups = new Map<string, ServiceInfo[]>();
    
    for (const category of sortedCategories) {
      sortedGroups.set(category, groups.get(category)!);
    }

    return sortedGroups;
  }

  /**
   * Filter services by connection status
   */
  filterByConnectionStatus(services: ServiceInfo[], connected: boolean): ServiceInfo[] {
    return services.filter(s => s.connected === connected);
  }

  /**
   * Filter services by health status
   */
  filterByHealthStatus(services: ServiceInfo[], health: ServiceInfo['health']): ServiceInfo[] {
    return services.filter(s => s.health === health);
  }

  /**
   * Get services sorted by response time (fastest first)
   */
  sortByResponseTime(services: ServiceInfo[]): ServiceInfo[] {
    return [...services].sort((a, b) => {
      // Services without response time go to end
      if (!a.responseTime && !b.responseTime) return 0;
      if (!a.responseTime) return 1;
      if (!b.responseTime) return -1;
      
      return a.responseTime - b.responseTime;
    });
  }

  /**
   * Get services sorted by health priority (healthy first)
   */
  sortByHealthPriority(services: ServiceInfo[]): ServiceInfo[] {
    const healthPriorityOrder: Record<string, number> = {
      'healthy': 0,
      'degraded': 1,
      'unhealthy': 2,
      'unknown': 3
    };

    return [...services].sort((a, b) => {
      const aPriority = healthPriorityOrder[a.health || 'unknown'];
      const bPriority = healthPriorityOrder[b.health || 'unknown'];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same health status, use alphabetical
      return this.compareAlphabetically(a, b);
    });
  }

  /**
   * Update ordering configuration
   */
  updateConfiguration(config: Partial<ServiceOrderingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): ServiceOrderingConfig {
    return { ...this.config };
  }

  /**
   * Validate service ordering result for consistency
   */
  validateOrdering(result: ServiceOrderingResult): boolean {
    const { orderedServices } = result;
    
    if (!this.config.prioritizeConnected) return true;
    
    // Check that all connected services come before disconnected ones
    let foundDisconnected = false;
    for (const service of orderedServices) {
      if (!service.connected) {
        foundDisconnected = true;
      } else if (foundDisconnected) {
        // Found connected service after disconnected service - invalid ordering
        return false;
      }
    }

    // Check alphabetical ordering within connected and disconnected groups
    if (this.config.alphabeticalWithinTier) {
      const connected = orderedServices.filter(s => s.connected);
      const disconnected = orderedServices.filter(s => !s.connected);
      
      return this.isAlphabeticallySorted(connected) && this.isAlphabeticallySorted(disconnected);
    }

    return true;
  }

  /**
   * Compare two services using the configured ordering rules
   * @private
   */
  private compareServices(a: ServiceInfo, b: ServiceInfo, context: ServiceOrderingContext): ServiceComparisonResult {
    const reasons: string[] = [];

    // Rule 1: Connected services first (highest priority)
    if (this.config.prioritizeConnected && a.connected !== b.connected) {
      const comparison = b.connected ? 1 : -1;
      reasons.push(b.connected ? 'b is connected, a is not' : 'a is connected, b is not');
      return { comparison, reasons };
    }

    // Rule 2: Health priority within connection tier
    if (this.config.healthPriority && a.health && b.health && a.health !== b.health) {
      const healthComparison = this.compareByHealth(a, b);
      if (healthComparison !== 0) {
        reasons.push(`health priority: ${a.health} vs ${b.health}`);
        return { comparison: healthComparison, reasons };
      }
    }

    // Rule 3: Custom priority if set
    if (a.priority !== b.priority) {
      const aPriority = a.priority || 0;
      const bPriority = b.priority || 0;
      if (aPriority !== bPriority) {
        const comparison = bPriority - aPriority; // Higher priority first
        reasons.push(`custom priority: ${aPriority} vs ${bPriority}`);
        return { comparison, reasons };
      }
    }

    // Rule 4: Response time priority (if enabled and both services are connected)
    if (this.config.responsiveTimePriority && 
        a.connected && b.connected && 
        a.responseTime && b.responseTime &&
        context === 'status-display') {
      const comparison = a.responseTime - b.responseTime; // Faster first
      if (Math.abs(comparison) > 10) { // Only if significant difference (>10ms)
        reasons.push(`response time: ${a.responseTime}ms vs ${b.responseTime}ms`);
        return { comparison, reasons };
      }
    }

    // Rule 5: Alphabetical ordering (final tiebreaker)
    if (this.config.alphabeticalWithinTier) {
      const comparison = this.compareAlphabetically(a, b);
      if (comparison !== 0) {
        reasons.push(`alphabetical: ${a.id} vs ${b.id}`);
        return { comparison, reasons };
      }
    }

    // Services are equivalent
    return { comparison: 0, reasons: ['services are equivalent'] };
  }

  /**
   * Compare services by health status
   * @private
   */
  private compareByHealth(a: ServiceInfo, b: ServiceInfo): number {
    const healthOrder: Record<string, number> = {
      'healthy': 0,
      'degraded': 1,  
      'unhealthy': 2,
      'unknown': 3
    };

    const aOrder = healthOrder[a.health || 'unknown'];
    const bOrder = healthOrder[b.health || 'unknown'];
    
    return aOrder - bOrder;
  }

  /**
   * Compare services alphabetically by ID or name
   * @private
   */
  private compareAlphabetically(a: ServiceInfo, b: ServiceInfo): number {
    const aKey = a.name || a.id;
    const bKey = b.name || b.id;
    
    if (this.config.caseSensitiveSort) {
      return aKey.localeCompare(bKey);
    } else {
      return aKey.toLowerCase().localeCompare(bKey.toLowerCase());
    }
  }

  /**
   * Check if services are alphabetically sorted
   * @private
   */
  private isAlphabeticallySorted(services: ServiceInfo[]): boolean {
    for (let i = 1; i < services.length; i++) {
      if (this.compareAlphabetically(services[i - 1], services[i]) > 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get list of applied ordering rules
   * @private
   */
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

  /**
   * Create empty result for edge cases
   * @private
   */
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
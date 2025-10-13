/**---
 * title: [Templum Resource Manager - Native Resource Management System]
 * tags: [Core, ResourceManagement, Native, System]
 * provides: [ResourceAllocation, ResourceMonitoring, PolicyEnforcement, ServiceDiscovery]
 * requires: [Core Types, EventEmitter, Performance APIs]
 * description: [Templum-native resource management system for comprehensive resource allocation, monitoring, and cleanup]
 * ---*/

import { 
  isTemplumError,
  createTemplumError,
  ErrorSignalPayload,
  MetricsSignalPayload,
  BackendType
} from '../types/templum-types';
import { createInterval, type ManagedInterval } from '../utils/async-utils';
import { type TypedEventMap } from '../utils/event-utils';
import { EventDrivenComponent } from '../utils/event-bus-adapter';

// ============================================================================
// Resource Management Interfaces
// ============================================================================

export interface ResourcePolicy {
  maxMemoryMB: number;
  maxConnections: number;
  maxCacheSize: number;
  connectionTimeoutMs: number;
  cleanupIntervalMs: number;
  resourceTimeoutMs: number;
  enableAutoCleanup: boolean;
  resourcePriorities: Record<string, number>;
}

export interface ResourceUsage {
  memory: {
    used: number;      // MB
    allocated: number; // MB  
    limit: number;     // MB
    percentage: number;
  };
  connections: {
    active: number;
    allocated: number;
    limit: number;
    percentage: number;
  };
  cache: {
    used: number;      // MB
    limit: number;     // MB
    hitRate: number;   // 0-1
    entries: number;
  };
  fileHandles: {
    open: number;
    limit: number;
    percentage: number;
  };
  processes: {
    active: number;
    limit: number;
    percentage: number;
  };
}

export interface ResourceHandle {
  id: string;
  type: 'memory' | 'connection' | 'cache' | 'file' | 'process' | 'service';
  owner: string;
  allocatedAt: number;
  lastAccessed: number;
  size: number; // MB or count depending on type
  metadata: Record<string, any>;
  priority: number; // 1-10, 10 = highest priority
  cleanup: () => Promise<void>;
}

export interface ServiceHealth {
  serviceId: string;
  type: BackendType | 'core' | 'interface';
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastCheck: number;
  responseTime: number; // ms
  errorRate: number;    // 0-1
  resourceUsage: Partial<ResourceUsage>;
  metadata: Record<string, any>;
}

export interface ResourceAllocationRequest {
  type: ResourceHandle['type'];
  owner: string;
  size: number;
  priority?: number;
  metadata?: Record<string, any>;
  cleanup?: () => Promise<void>;
}

export interface ResourceManagerStatus {
  initialized: boolean;
  resourceUsage: ResourceUsage;
  activeResources: number;
  serviceHealth: ServiceHealth[];
  policyViolations: number;
  lastCleanup: number;
  nextCleanup: number;
}

// ============================================================================
// Templum Native Resource Manager Implementation  
// ============================================================================

interface TemplumResourceManagerEvents extends TypedEventMap {
  initialized: (payload: { timestamp: number; policy: ResourcePolicy }) => void;
  shutdown: (payload: { timestamp: number }) => void;
  resourceAllocated: (payload: {
    resourceId: string;
    type: ResourceHandle['type'];
    owner: string;
    size: number;
    timestamp: number;
  }) => void;
  resourceDeallocated: (payload: {
    resourceId: string;
    type: ResourceHandle['type'];
    owner: string;
    size: number;
    lifetime: number;
    timestamp: number;
  }) => void;
  serviceRegistered: (payload: { serviceId: string; type: ServiceHealth['type']; timestamp: number }) => void;
  serviceHealthChanged: (payload: {
    serviceId: string;
    previousStatus: ServiceHealth['status'];
    newStatus: ServiceHealth['status'];
    timestamp: number;
  }) => void;
  serviceUnhealthy: (payload: {
    serviceId: string;
    status: ServiceHealth['status'];
    responseTime: number;
    errorRate: number;
    timestamp: number;
  }) => void;
  resourceMetrics: (payload: MetricsSignalPayload) => void;
  automaticCleanup: (payload: { cleanedResources: number; timestamp: number }) => void;
  policyViolation: (payload: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    current: number;
    limit: number;
    timestamp: number;
  }) => void;
  policyUpdated: (payload: { policy: ResourcePolicy; timestamp: number }) => void;
}

export class TemplumResourceManager extends EventDrivenComponent<TemplumResourceManagerEvents> {
  private initialized: boolean = false;
  private policy: ResourcePolicy;
  private resources: Map<string, ResourceHandle> = new Map();
  private services: Map<string, ServiceHealth> = new Map();
  private cleanupInterval: ManagedInterval | null = null;
  private monitoringInterval: ManagedInterval | null = null;
  private usageHistory: ResourceUsage[] = [];
  private maxHistorySize: number = 100;

  constructor(policy?: Partial<ResourcePolicy>) {
    super('templum-resource-manager', 100);
    
    this.policy = {
      maxMemoryMB: 512,
      maxConnections: 50,
      maxCacheSize: 128,
      connectionTimeoutMs: 30000,
      cleanupIntervalMs: 60000, // 1 minute
      resourceTimeoutMs: 300000, // 5 minutes
      enableAutoCleanup: true,
      resourcePriorities: {
        'skinEngine': 8,
        'stateManager': 9,
        'backendRouter': 7,
        'backendServiceRouter': 6,
        'cache': 5,
        'temporary': 2
      },
      ...policy
    };

    this.setupEventListeners();
  }

  // ============================================================================
  // Initialization and Lifecycle
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('TemplumResourceManager: Already initialized');
      return;
    }

    try {
      console.log('TemplumResourceManager: Initializing native resource management system');
      
      // Initialize core services monitoring
      await this.initializeServiceDiscovery();
      
      // Start resource monitoring
      this.startResourceMonitoring();
      
      // Start automatic cleanup if enabled
      if (this.policy.enableAutoCleanup) {
        this.startAutomaticCleanup();
      }
      
      this.initialized = true;
      this.emit('initialized', { 
        timestamp: Date.now(),
        policy: this.policy 
      });
      
      console.log('TemplumResourceManager: Native resource management initialized');
    } catch (error) {
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'TemplumResourceManager',
        error: isTemplumError(error) ? error : createTemplumError(
          error instanceof Error ? error.message : 'Unknown initialization error',
          'RESOURCE_MANAGER_INIT_ERROR',
          'configuration'
        ),
        severity: 'critical'
      };
      
      console.error('TemplumResourceManager: Initialization failed:', errorPayload.error);
      throw errorPayload.error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('TemplumResourceManager: Starting graceful shutdown');

    try {
      // Stop monitoring and cleanup intervals
      if (this.cleanupInterval) {
        this.cleanupInterval.stop();
        this.cleanupInterval = null;
      }
      
      if (this.monitoringInterval) {
        this.monitoringInterval.stop();
        this.monitoringInterval = null;
      }

      // Cleanup all resources
      await this.cleanupAllResources();
      
      // Clear service registrations
      this.services.clear();
      this.usageHistory = [];
      
      this.initialized = false;
      this.emit('shutdown', { timestamp: Date.now() });
      this.removeAllListeners();
      this.cleanupEvents();

      console.log('TemplumResourceManager: Shutdown complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('TemplumResourceManager: Shutdown failed:', errorMessage);
      throw createTemplumError(`Resource manager shutdown failed: ${errorMessage}`, 'SHUTDOWN_ERROR', 'runtime');
    }
  }

  // ============================================================================
  // Resource Allocation and Management
  // ============================================================================

  async allocateResource(request: ResourceAllocationRequest): Promise<string> {
    if (!this.initialized) {
      throw createTemplumError('Resource manager not initialized', 'RESOURCE_MANAGER_NOT_READY', 'configuration');
    }

    // Check resource limits before allocation
    await this.enforceResourcePolicies(request);

    const resourceId = `${request.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const priority = request.priority || this.policy.resourcePriorities[request.owner] || 5;

    const resource: ResourceHandle = {
      id: resourceId,
      type: request.type,
      owner: request.owner,
      allocatedAt: Date.now(),
      lastAccessed: Date.now(),
      size: request.size,
      metadata: request.metadata || {},
      priority,
      cleanup: request.cleanup || (async () => {
        console.log(`Default cleanup for resource ${resourceId}`);
      })
    };

    this.resources.set(resourceId, resource);
    
    this.emit('resourceAllocated', {
      resourceId,
      type: request.type,
      owner: request.owner,
      size: request.size,
      timestamp: Date.now()
    });

    console.log(`TemplumResourceManager: Allocated ${request.type} resource ${resourceId} for ${request.owner}`);
    return resourceId;
  }

  async deallocateResource(resourceId: string): Promise<void> {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      console.warn(`TemplumResourceManager: Resource ${resourceId} not found for deallocation`);
      return;
    }

    try {
      // Execute resource-specific cleanup
      await resource.cleanup();
      
      this.resources.delete(resourceId);
      
      this.emit('resourceDeallocated', {
        resourceId,
        type: resource.type,
        owner: resource.owner,
        size: resource.size,
        lifetime: Date.now() - resource.allocatedAt,
        timestamp: Date.now()
      });
      
      console.log(`TemplumResourceManager: Deallocated resource ${resourceId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`TemplumResourceManager: Failed to deallocate resource ${resourceId}:`, errorMessage);
      throw createTemplumError(`Resource deallocation failed: ${errorMessage}`, 'RESOURCE_CLEANUP_ERROR', 'runtime');
    }
  }

  updateResourceAccess(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (resource) {
      resource.lastAccessed = Date.now();
    }
  }

  getResourceUsage(): ResourceUsage {
    const memoryUsage = process.memoryUsage();
    const totalMemoryMB = memoryUsage.heapUsed / (1024 * 1024);
    
    const memoryResources = Array.from(this.resources.values())
      .filter(r => r.type === 'memory')
      .reduce((sum, r) => sum + r.size, 0);
      
    const connectionResources = Array.from(this.resources.values())
      .filter(r => r.type === 'connection').length;
      
    const cacheResources = Array.from(this.resources.values())
      .filter(r => r.type === 'cache')
      .reduce((sum, r) => sum + r.size, 0);
      
    const fileResources = Array.from(this.resources.values())
      .filter(r => r.type === 'file').length;
      
    const processResources = Array.from(this.resources.values())
      .filter(r => r.type === 'process').length;

    const cacheHitRate = this.calculateCacheHitRate();

    return {
      memory: {
        used: totalMemoryMB,
        allocated: memoryResources,
        limit: this.policy.maxMemoryMB,
        percentage: totalMemoryMB / this.policy.maxMemoryMB
      },
      connections: {
        active: connectionResources,
        allocated: connectionResources,
        limit: this.policy.maxConnections,
        percentage: connectionResources / this.policy.maxConnections
      },
      cache: {
        used: cacheResources,
        limit: this.policy.maxCacheSize,
        hitRate: cacheHitRate,
        entries: Array.from(this.resources.values()).filter(r => r.type === 'cache').length
      },
      fileHandles: {
        open: fileResources,
        limit: 100, // Default OS limit estimate
        percentage: fileResources / 100
      },
      processes: {
        active: processResources,
        limit: 20, // Conservative limit
        percentage: processResources / 20
      }
    };
  }

  // ============================================================================
  // Service Discovery and Health Monitoring
  // ============================================================================

  async registerService(serviceId: string, type: ServiceHealth['type'], metadata?: Record<string, any>): Promise<void> {
    const health: ServiceHealth = {
      serviceId,
      type,
      status: 'healthy',
      lastCheck: Date.now(),
      responseTime: 0,
      errorRate: 0,
      resourceUsage: {},
      metadata: metadata || {}
    };

    this.services.set(serviceId, health);
    
    this.emit('serviceRegistered', {
      serviceId,
      type,
      timestamp: Date.now()
    });
    
    console.log(`TemplumResourceManager: Registered service ${serviceId} (${type})`);
  }

  async updateServiceHealth(serviceId: string, status: ServiceHealth['status'], responseTime?: number, errorRate?: number): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      console.warn(`TemplumResourceManager: Service ${serviceId} not registered for health update`);
      return;
    }

    const previousStatus = service.status;
    service.status = status;
    service.lastCheck = Date.now();
    
    if (responseTime !== undefined) {
      service.responseTime = responseTime;
    }
    
    if (errorRate !== undefined) {
      service.errorRate = errorRate;  
    }

    // Emit health change events
    if (previousStatus !== status) {
      this.emit('serviceHealthChanged', {
        serviceId,
        previousStatus,
        newStatus: status,
        timestamp: Date.now()
      });
      
      if (status === 'unhealthy' || status === 'offline') {
        this.emit('serviceUnhealthy', {
          serviceId,
          status,
          responseTime: service.responseTime,
          errorRate: service.errorRate,
          timestamp: Date.now()
        });
      }
    }

    console.log(`TemplumResourceManager: Updated ${serviceId} health: ${status}`);
  }

  getServiceHealth(): ServiceHealth[] {
    return Array.from(this.services.values());
  }

  getServiceHealthById(serviceId: string): ServiceHealth | null {
    return this.services.get(serviceId) || null;
  }

  // ============================================================================
  // Policy Enforcement and Resource Cleanup
  // ============================================================================

  private async enforceResourcePolicies(request: ResourceAllocationRequest): Promise<void> {
    const currentUsage = this.getResourceUsage();

    // Memory limit enforcement
    if (request.type === 'memory' && 
        currentUsage.memory.used + request.size > this.policy.maxMemoryMB) {
      // Try to free up memory through cleanup
      await this.cleanupLowPriorityResources('memory');
      
      const updatedUsage = this.getResourceUsage();
      if (updatedUsage.memory.used + request.size > this.policy.maxMemoryMB) {
        throw createTemplumError(
          `Memory allocation would exceed limit (${this.policy.maxMemoryMB}MB)`,
          'MEMORY_LIMIT_EXCEEDED',
          'configuration'
        );
      }
    }

    // Connection limit enforcement
    if (request.type === 'connection' && 
        currentUsage.connections.active >= this.policy.maxConnections) {
      await this.cleanupLowPriorityResources('connection');
      
      const updatedUsage = this.getResourceUsage();
      if (updatedUsage.connections.active >= this.policy.maxConnections) {
        throw createTemplumError(
          `Connection allocation would exceed limit (${this.policy.maxConnections})`,
          'CONNECTION_LIMIT_EXCEEDED',
          'configuration'
        );
      }
    }

    // Cache limit enforcement  
    if (request.type === 'cache' &&
        currentUsage.cache.used + request.size > this.policy.maxCacheSize) {
      await this.cleanupLowPriorityResources('cache');
      
      const updatedUsage = this.getResourceUsage();
      if (updatedUsage.cache.used + request.size > this.policy.maxCacheSize) {
        throw createTemplumError(
          `Cache allocation would exceed limit (${this.policy.maxCacheSize}MB)`,
          'CACHE_LIMIT_EXCEEDED', 
          'configuration'
        );
      }
    }
  }

  private async cleanupLowPriorityResources(type?: ResourceHandle['type']): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    // Get resources for cleanup (expired or low priority)
    const resourcesForCleanup = Array.from(this.resources.values())
      .filter(resource => {
        if (type && resource.type !== type) return false;
        
        // Cleanup expired resources
        const isExpired = (now - resource.lastAccessed) > this.policy.resourceTimeoutMs;
        
        // Cleanup low-priority resources if needed
        const isLowPriority = resource.priority <= 3;
        
        return isExpired || isLowPriority;
      })
      .sort((a, b) => a.priority - b.priority); // Cleanup lowest priority first

    // Cleanup resources
    for (const resource of resourcesForCleanup) {
      try {
        await this.deallocateResource(resource.id);
        cleanedCount++;
      } catch (error) {
        console.error(`Failed to cleanup resource ${resource.id}:`, error);
      }
    }

    if (cleanedCount > 0) {
      console.log(`TemplumResourceManager: Cleaned up ${cleanedCount} ${type || 'all'} resources`);
    }

    return cleanedCount;
  }

  private async cleanupAllResources(): Promise<void> {
    console.log('TemplumResourceManager: Cleaning up all resources');
    
    const resourceIds = Array.from(this.resources.keys());
    let cleanedCount = 0;

    for (const resourceId of resourceIds) {
      try {
        await this.deallocateResource(resourceId);
        cleanedCount++;
      } catch (error) {
        console.error(`Failed to cleanup resource ${resourceId}:`, error);
      }
    }

    console.log(`TemplumResourceManager: Cleaned up ${cleanedCount}/${resourceIds.length} resources`);
  }

  // ============================================================================
  // Monitoring and Metrics
  // ============================================================================ 

  private startResourceMonitoring(): void {
    this.monitoringInterval?.stop();
    this.monitoringInterval = createInterval(() => {
      try {
        const usage = this.getResourceUsage();
        
        // Store usage history
        this.usageHistory.push(usage);
        if (this.usageHistory.length > this.maxHistorySize) {
          this.usageHistory.shift();
        }

        // Emit metrics
        const metricsPayload: MetricsSignalPayload = {
          timestamp: Date.now(),
          source: 'TemplumResourceManager',
          metrics: {
            memory: {
              heapUsed: usage.memory.used,
              rss: usage.memory.allocated
            },
            cpu: { user: 0, system: 0 }, // Will be enhanced with actual CPU metrics
            interfaces: {}
          },
          category: 'performance'
        };

        this.emit('resourceMetrics', metricsPayload);

        // Check for policy violations
        this.checkPolicyViolations(usage);
        
      } catch (error) {
        console.error('Resource monitoring error:', error);
      }
    }, 10000, { unref: true }); // Every 10 seconds

    console.log('TemplumResourceManager: Resource monitoring started');
  }

  private startAutomaticCleanup(): void {
    this.cleanupInterval?.stop();
    this.cleanupInterval = createInterval(async () => {
      try {
        const cleanedCount = await this.cleanupLowPriorityResources();
        if (cleanedCount > 0) {
          this.emit('automaticCleanup', {
            cleanedResources: cleanedCount,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Automatic cleanup error:', error);
      }
    }, this.policy.cleanupIntervalMs, { unref: true });

    console.log('TemplumResourceManager: Automatic cleanup started');
  }

  private checkPolicyViolations(usage: ResourceUsage): void {
    let violations = 0;

    if (usage.memory.percentage > 0.9) {
      this.emit('policyViolation', {
        type: 'memory',
        severity: 'high',
        current: usage.memory.percentage,
        limit: 0.9,
        timestamp: Date.now()
      });
      violations++;
    }

    if (usage.connections.percentage > 0.8) {
      this.emit('policyViolation', {
        type: 'connections', 
        severity: 'medium',
        current: usage.connections.percentage,
        limit: 0.8,
        timestamp: Date.now()
      });
      violations++;
    }

    if (violations > 0) {
      console.warn(`TemplumResourceManager: ${violations} policy violations detected`);
    }
  }

  private async initializeServiceDiscovery(): Promise<void> {
    // Register core Templum services for monitoring
    await this.registerService('templum-core', 'core', { component: 'TemplumCore' });
    await this.registerService('adapter-registry', 'core', { component: 'TemplumAdapterRegistry' });
    
    console.log('TemplumResourceManager: Service discovery initialized');
  }

  private calculateCacheHitRate(): number {
    // Simplified cache hit rate calculation
    // In a real implementation, this would track actual cache hits/misses
    const cacheResources = Array.from(this.resources.values()).filter(r => r.type === 'cache');
    if (cacheResources.length === 0) return 0;
    
    // Simulate cache hit rate based on resource age and access patterns
    const averageAge = cacheResources.reduce((sum, r) => sum + (Date.now() - r.allocatedAt), 0) / cacheResources.length;
    const averageAccess = cacheResources.reduce((sum, r) => sum + (Date.now() - r.lastAccessed), 0) / cacheResources.length;
    
    // Higher hit rate for recently accessed, established caches
    const hitRate = Math.max(0.1, Math.min(0.95, 1 - (averageAccess / (averageAge + 1))));
    return hitRate;
  }

  // ============================================================================
  // Status and Reporting
  // ============================================================================

  getStatus(): ResourceManagerStatus {
    return {
      initialized: this.initialized,
      resourceUsage: this.getResourceUsage(),
      activeResources: this.resources.size,
      serviceHealth: this.getServiceHealth(),
      policyViolations: 0, // Would track actual violations
      lastCleanup: this.cleanupInterval ? Date.now() : 0,
      nextCleanup: this.cleanupInterval ? Date.now() + this.policy.cleanupIntervalMs : 0
    };
  }

  getAllocatedResources(owner?: string): ResourceHandle[] {
    const resources = Array.from(this.resources.values());
    return owner ? resources.filter(r => r.owner === owner) : resources;
  }

  getUsageHistory(): ResourceUsage[] {
    return [...this.usageHistory];
  }

  getResourcePolicy(): ResourcePolicy {
    return { ...this.policy };
  }

  updateResourcePolicy(updates: Partial<ResourcePolicy>): void {
    this.policy = { ...this.policy, ...updates };
    this.emit('policyUpdated', {
      policy: this.policy,
      timestamp: Date.now()
    });
    console.log('TemplumResourceManager: Resource policy updated');
  }

  // ============================================================================
  // Event Listeners Setup
  // ============================================================================

  private setupEventListeners(): void {
    this.on('resourceAllocated', ({ resourceId, type, owner, size }) => {
      console.log(`Resource allocated: ${type} ${resourceId} (${size}MB) for ${owner}`);
    });

    this.on('resourceDeallocated', ({ resourceId, type, owner, lifetime }) => {
      console.log(`Resource deallocated: ${type} ${resourceId} for ${owner} (lived ${lifetime}ms)`);
    });

    this.on('serviceHealthChanged', ({ serviceId, previousStatus, newStatus }) => {
      console.log(`Service health changed: ${serviceId} ${previousStatus} → ${newStatus}`);
    });

    this.on('policyViolation', ({ type, severity, current, limit }) => {
      console.warn(`Policy violation: ${type} usage ${(current * 100).toFixed(1)}% exceeds ${(limit * 100).toFixed(1)}% limit (${severity})`);
    });

    this.on('automaticCleanup', ({ cleanedResources }) => {
      console.log(`Automatic cleanup completed: ${cleanedResources} resources cleaned`);
    });
  }
}

// ============================================================================
// Resource Manager Factory and Integration
// ============================================================================

/**
 * Factory function for creating configured resource manager instances
 */
export function createTemplumResourceManager(policy?: Partial<ResourcePolicy>): TemplumResourceManager {
  return new TemplumResourceManager(policy);
}

/**
 * Singleton resource manager instance for global use
 */
let globalResourceManager: TemplumResourceManager | null = null;

export function getGlobalResourceManager(): TemplumResourceManager {
  if (!globalResourceManager) {
    globalResourceManager = createTemplumResourceManager({
      maxMemoryMB: 512,
      maxConnections: 50,
      maxCacheSize: 128,
      enableAutoCleanup: true,
      cleanupIntervalMs: 60000
    });
  }
  return globalResourceManager;
}

export function initializeGlobalResourceManager(policy?: Partial<ResourcePolicy>): Promise<void> {
  const manager = getGlobalResourceManager();
  if (policy) {
    manager.updateResourcePolicy(policy);
  }
  return manager.initialize();
}

export function shutdownGlobalResourceManager(): Promise<void> {
  if (globalResourceManager) {
    const shutdownPromise = globalResourceManager.shutdown();
    globalResourceManager = null;
    return shutdownPromise;
  }
  return Promise.resolve();
}

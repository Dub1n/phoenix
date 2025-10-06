/**---
 * title: [Core Component Interfaces - Dependency Injection Contracts]
 * tags: [Interface, DependencyInjection, Core, Adapter]
 * provides: [ISkinEngine, IStateManager, IBackendRouter, IBackendServiceRouter]
 * requires: [Core Types, Universal Types]
 * description: [Interface contracts for Templum core component dependency injection using PCL adapter pattern]
 * ---*/

import { 
  UniversalSkinDefinition, 
  StateUpdate,
  CommandResult,
  InterfaceType,
  BackendConnectionLifecycleEvent
} from '../types/templum-types';
import type {
  ManualOverrideOptions,
  ManualOverrideDescriptor,
  ManualOverrideSnapshot,
  ManualOverrideClearResult
} from '../backend/manual-override-manager';

// Resource management interfaces
import { 
  ResourcePolicy,
  ResourceUsage,
  ResourceAllocationRequest,
  ResourceManagerStatus,
  ServiceHealth
} from '../core/templum-resource-manager';

// Observability interfaces
import { IObservabilityService } from '../observability/observability-adapter';
import type { TemplumSessionManagerContract } from '../session/universal-session-manager.types';

/**
 * Universal Skin Engine interface for dependency injection
 * Abstracts skin rendering and validation operations
 */
export interface ISkinEngine {
  /**
   * Initialize the skin engine with configuration
   */
  initialize?(config?: any): Promise<void>;
  
  /**
   * Render skin for specific interface type
   */
  renderForInterface?(skinDefinition: UniversalSkinDefinition, interfaceType: InterfaceType, context?: any): Promise<any>;
  
  /**
   * Validate skin definition
   */
  validateSkin?(skinDefinition: UniversalSkinDefinition): Promise<boolean>;
  
  /**
   * Generate HTML for skin rendering
   */
  generateSkinHTML?(renderResult: any, skinDefinition: UniversalSkinDefinition): string;
  
  /**
   * Dispose skin engine resources
   */
  dispose?(): Promise<void>;
}

/**
 * Enhanced State Manager interface for dependency injection
 * Abstracts state synchronization and management
 */
export interface IStateManager {
  /**
   * Initialize state manager with configuration
   */
  initialize(config?: any): Promise<void>;
  
  /**
   * Synchronize state across interfaces
   */
  syncState?(interfaceType: InterfaceType, stateUpdate: StateUpdate, source: string): Promise<void>;
  
  /**
   * Send message through state manager
   */
  sendMessage?(message: any): Promise<void>;
  
  /**
   * Get current state
   */
  getCurrentState?(): any;
  
  /**
   * Shutdown state manager
   */
  shutdown?(): Promise<void>;

  /**
   * Handle backend lifecycle updates and broadcast to registered interfaces
   */
  handleBackendLifecycleEvent?(event: BackendConnectionLifecycleEvent): Promise<void>;
}

/**
 * PCL Backend Router interface for dependency injection  
 * Abstracts backend command routing and execution
 */
export interface IBackendRouter {
  /**
   * Initialize backend router with dependencies
   */
  initialize?(dependencies: any): void;
  
  /**
   * Execute command through backend router
   */
  executeCommand?(command: string, args?: any[], context?: any): Promise<CommandResult>;
  
  /**
   * Get backend router status
   */
  getStatus?(): any;
  
  /**
   * Shutdown backend router
   */
  shutdown?(): Promise<void>;
}

/**
 * Backend Service Router interface for dependency injection
 * Abstracts multi-backend service discovery and management  
 */
export interface IBackendServiceRouter {
  /**
   * Discover and connect to available backend services
   */
  discoverAndConnect(): Promise<void>;
  
  /**
   * Load skin definition from specific backend
   */
  loadBackendSkin(backendId: string): Promise<UniversalSkinDefinition | null>;
  
  /**
   * Execute command on specific backend service
   */
  executeCommand?(backendId: string, command: string, args?: any[]): Promise<any>;
  
  /**
   * Check if service is available
   */
  isServiceAvailable?(backendId: string): Promise<boolean>;
  
  /**
   * Get connection status for all backends
   */
  getConnectionStatus?(): any;
  
  /**
   * Subscribe to backend lifecycle events
   */
  onLifecycleEvent?(listener: (event: BackendConnectionLifecycleEvent) => void): () => void;

  /**
   * Cleanup backend service connections
   */
  cleanup?(): Promise<void>;

  /**
   * Apply a manual override for the provided service identifier
   */
  applyManualOverride?(serviceId: string, options?: ManualOverrideOptions): Promise<ManualOverrideDescriptor>;

  /**
   * Clear manual overrides (single service or all)
   */
  clearManualOverride?(serviceId?: string): Promise<ManualOverrideClearResult>;

  /**
   * Retrieve sanitized manual override snapshot for downstream consumers
   */
  getManualOverrideSnapshot?(): ManualOverrideSnapshot;
}

/**
 * Templum Resource Manager interface for dependency injection
 * Abstracts native resource management, monitoring, and policy enforcement
 */
export interface IResourceManager {
  /**
   * Initialize resource manager with policies
   */
  initialize(): Promise<void>;
  
  /**
   * Allocate a system resource with tracking and monitoring
   */
  allocateResource(request: ResourceAllocationRequest): Promise<string>;
  
  /**
   * Deallocate a system resource with cleanup
   */
  deallocateResource(resourceId: string): Promise<void>;
  
  /**
   * Update resource last access time for cleanup tracking
   */
  updateResourceAccess(resourceId: string): void;
  
  /**
   * Get current resource usage metrics
   */
  getResourceUsage(): ResourceUsage;
  
  /**
   * Register a service for health monitoring
   */
  registerService(serviceId: string, type: ServiceHealth['type'], metadata?: Record<string, any>): Promise<void>;
  
  /**
   * Update service health status
   */
  updateServiceHealth(serviceId: string, status: ServiceHealth['status'], responseTime?: number, errorRate?: number): Promise<void>;
  
  /**
   * Get all service health information
   */
  getServiceHealth(): ServiceHealth[];
  
  /**
   * Get resource manager status and metrics
   */
  getStatus(): ResourceManagerStatus;
  
  /**
   * Update resource management policies
   */
  updateResourcePolicy(updates: Partial<ResourcePolicy>): void;
  
  /**
   * Shutdown resource manager and cleanup all resources
   */
  shutdown(): Promise<void>;
}

/**
 * Templum Core Dependencies interface
 * Defines all dependencies that can be injected into TemplumCore
 */
export interface ITemplumCoreDependencies {
  skinEngine: ISkinEngine;
  stateManager: IStateManager; 
  backendRouter: IBackendRouter;
  backendServiceRouter: IBackendServiceRouter;
  resourceManager: IResourceManager;
  observabilityService: IObservabilityService;
  sessionManager: TemplumSessionManagerContract;
}

/**
 * Dependency injection validation levels
 */
export type ValidationLevel = 'strict' | 'standard' | 'relaxed';

/**
 * Component validation status
 */
export interface ComponentValidationStatus {
  name: string;
  valid: boolean;
  issues: string[];
  interfaceCompliance: boolean;
  methodAvailability: boolean;
  initializationStatus: 'pending' | 'initializing' | 'initialized' | 'failed';
}

/**
 * Dependency wiring validation status
 */
export interface DependencyWiringStatus {
  sourceComponent: string;
  targetComponent: string;
  wiringValid: boolean;
  issues: string[];
  circularDependency: boolean;
  interfaceCompatibility: boolean;
}

/**
 * Comprehensive validation report
 */
export interface ValidationReport {
  timestamp: number;
  overallValid: boolean;
  validationLevel: ValidationLevel;
  componentValidation: ComponentValidationStatus[];
  dependencyWiring: DependencyWiringStatus[];
  integrityValidation: {
    allRequiredPresent: boolean;
    noDuplicateInstances: boolean;
    circularDependencies: string[];
    initializationOrder: boolean;
  };
  recommendations: string[];
  executionTime: number;
}

/**
 * Enhanced dependency injection configuration with validation options
 */
export interface IDependencyInjectionConfig {
  enableSkinEngine?: boolean;
  enableStateManager?: boolean;
  enableBackendRouter?: boolean;
  enableBackendServiceRouter?: boolean;
  enableResourceManager?: boolean;
  enableObservabilityService?: boolean;
  
  // Validation configuration
  validationLevel?: ValidationLevel;
  enableValidationReporting?: boolean;
  validateComponentInterfaces?: boolean;
  validateDependencyWiring?: boolean;
  validateInitializationOrder?: boolean;
  validationTimeout?: number;
  
  customFactories?: {
    skinEngine?: () => ISkinEngine;
    stateManager?: () => IStateManager;
    backendRouter?: () => IBackendRouter;
    backendServiceRouter?: () => IBackendServiceRouter;
    resourceManager?: () => IResourceManager;
    observabilityService?: () => IObservabilityService;
  };
}

/**
 * Component factory interface for creating instances
 */
export interface IComponentFactory {
  createSkinEngine(config?: any): ISkinEngine;
  createStateManager(config?: any): IStateManager;
  createBackendRouter(config?: any): IBackendRouter;
  createBackendServiceRouter(config?: any): IBackendServiceRouter;
  createResourceManager(config?: any): IResourceManager;
}

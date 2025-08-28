/**---
 * title: [Templum Orchestrator Interface - Abstraction Layer Contract]
 * tags: [Interface, Abstraction, Orchestrator, Core]
 * provides: [ITemplumOrchestrator, Core Abstraction Layer]
 * requires: [Universal Types, Templum Types]
 * description: [Abstraction interface for Templum core orchestration, enables dependency inversion for interface adapters]
 * ---*/

import { 
  InterfaceType,
  InterfaceAdapter,
  UniversalSkinDefinition,
  TemplumSystemStatus,
  CommandResult,
  CommandContext
} from '../types/templum-types';
import { 
  ISkinEngine,
  IBackendServiceRouter,
  IResourceManager
} from './core-component-interfaces';

/**
 * Core Templum orchestrator abstraction interface
 * 
 * This interface provides the abstraction layer that interface adapters depend on,
 * enabling proper dependency inversion and eliminating direct coupling to TemplumCore.
 * 
 * Interface adapters (VSCode, CLI, etc.) should depend only on this abstraction,
 * not on the concrete TemplumCore implementation.
 */
export interface ITemplumOrchestrator {
  /**
   * Check if the orchestrator is initialized and ready for operations
   */
  isInitialized(): boolean;

  /**
   * Get list of supported interface types
   */
  getSupportedInterfaces(): InterfaceType[];

  /**
   * Register an interface adapter with the orchestrator
   */
  registerInterface(interfaceType: InterfaceType, adapter: InterfaceAdapter): Promise<void>;

  /**
   * Load a skin definition into the orchestrator
   */
  loadSkin(skinDefinition: UniversalSkinDefinition): Promise<void>;

  /**
   * Load backend skin definition for interface rendering
   */
  loadBackendSkin(backendId: string): Promise<UniversalSkinDefinition | null>;

  /**
   * Execute command through the orchestrator
   */
  executeCommand(
    command: string,
    sourceInterface: InterfaceType,
    args?: any[],
    context?: CommandContext
  ): Promise<CommandResult>;

  /**
   * Get current system status
   */
  getSystemStatus(): TemplumSystemStatus;

  /**
   * Refresh backend service connections and rediscover available services
   */
  refreshBackendServices(): Promise<void>;

  /**
   * Get Universal Skin Engine for rendering operations
   */
  getUniversalSkinEngine(): ISkinEngine;

  /**
   * Get Backend Service Router for service integration
   */
  getBackendRouter(): IBackendServiceRouter;

  /**
   * Get Resource Manager for system resource management
   */
  getResourceManager(): IResourceManager;

  /**
   * Shutdown the orchestrator
   */
  shutdown(): Promise<void>;
}

/**
 * Interface adapter abstraction
 * 
 * This interface defines the contract that all interface adapters must implement
 * to work with the Templum orchestrator abstraction layer.
 */
export interface IInterfaceAdapter extends InterfaceAdapter {
  /**
   * Initialize the interface adapter with orchestrator
   */
  initialize(orchestrator: ITemplumOrchestrator): Promise<void>;

  /**
   * Get interface type identifier
   */
  getInterfaceType(): InterfaceType;

  /**
   * Check if adapter supports a specific skin definition
   */
  supportsSkin(skinDefinition: UniversalSkinDefinition): boolean;
}

/**
 * Factory interface for creating interface adapters
 * 
 * This enables testable, dependency-injection-friendly adapter creation
 * without direct coupling to concrete adapter implementations.
 */
export interface IInterfaceAdapterFactory {
  /**
   * Create VSCode interface adapter
   */
  createVSCodeAdapter(context?: any): IInterfaceAdapter;

  /**
   * Create CLI interface adapter
   */
  createCLIAdapter(config?: any): IInterfaceAdapter;

  /**
   * Create command interface adapter
   */
  createCommandAdapter(config?: any): IInterfaceAdapter;

  /**
   * Register custom adapter factory
   */
  registerAdapterFactory(interfaceType: InterfaceType, factory: () => IInterfaceAdapter): void;
}
/**
 ---
title: [Interface Adapter Registry - Abstraction Layer Management]
tags: [Registry, Interface, Adapter, Abstraction]
provides: [InterfaceAdapterRegistry, Abstracted Adapter Management]
requires: [ITemplumOrchestrator, Interface Adapters, Factory Patterns]
description: [Registry for managing interface adapters through abstraction layer, eliminates direct coupling to concrete implementations]
 ---
 **/

import { 
  InterfaceType,
  TemplumError as _TemplumError,
  createTemplumError,
  isTemplumError,
  ErrorSignalPayload
} from '../types/templum-types';
import { 
  ITemplumOrchestrator,
  IInterfaceAdapter,
  IInterfaceAdapterFactory
} from './templum-orchestrator-interface';
import { EventDrivenComponent } from '../utils/event-bus-adapter';
import { TypedEventMap } from '../utils/event-utils';

interface InterfaceAdapterRegistryEvents extends TypedEventMap {
  initialized: (payload: { timestamp: number; adapterFactories: number }) => void;
  adapterRegistered: (payload: { interfaceType: InterfaceType; timestamp: number; totalAdapters: number }) => void;
  adapterRemoved: (payload: { interfaceType: InterfaceType; timestamp: number; remainingAdapters: number }) => void;
  disposed: (payload: { timestamp: number }) => void;
  vsCodeContextSet: (payload: { timestamp: number; hasContext: boolean; contextKeys: string[] }) => void;
}

/**
 * Interface Adapter Registry with Abstraction Layer
 * 
 * This registry manages interface adapters through the abstraction layer,
 * ensuring that no adapter has direct coupling to concrete implementations.
 * All adapters depend only on the ITemplumOrchestrator abstraction.
 */
export class InterfaceAdapterRegistry
  extends EventDrivenComponent<InterfaceAdapterRegistryEvents>
  implements IInterfaceAdapterFactory {
  private static instanceCounter = 0;
  private adapters: Map<InterfaceType, IInterfaceAdapter> = new Map();
  private adapterFactories: Map<InterfaceType, () => IInterfaceAdapter> = new Map();
  private orchestrator!: ITemplumOrchestrator;
  private initialized: boolean = false;
  private vsCodeContext: any = null;

  constructor() {
    super(`interface-adapter-registry:${InterfaceAdapterRegistry.instanceCounter++}`, 50);
  }

  /**
   * Initialize the registry with orchestrator abstraction
   */
  async initialize(orchestrator: ITemplumOrchestrator): Promise<void> {
    if (this.initialized) {
      console.warn('InterfaceAdapterRegistry: Already initialized');
      return;
    }

    try {
      this.orchestrator = orchestrator;
      
      // Register built-in adapter factories
      await this.registerBuiltInFactories();
      
      this.initialized = true;
      this.emit('initialized', { timestamp: Date.now(), adapterFactories: this.adapterFactories.size });
      
      console.log('InterfaceAdapterRegistry: Initialized with abstraction layer', {
        registeredFactories: Array.from(this.adapterFactories.keys()),
        orchestratorInitialized: orchestrator.isInitialized()
      });
      
    } catch (error) {
      const errorPayload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'InterfaceAdapterRegistry',
        error: isTemplumError(error) ? error : createTemplumError(
          error instanceof Error ? error.message : 'Unknown initialization error',
          'REGISTRY_INITIALIZATION_ERROR',
          'configuration'
        ),
        severity: 'critical'
      };

      console.error('InterfaceAdapterRegistry: Initialization failed:', errorPayload.error);
      throw createTemplumError(`Registry initialization failed: ${errorPayload.error.message}`, 'INITIALIZATION_ERROR', 'configuration');
    }
  }

  /**
   * Create and register interface adapter using factory pattern
   */
  async createAndRegisterAdapter(interfaceType: InterfaceType, context?: any): Promise<IInterfaceAdapter> {
    if (!this.initialized || !this.orchestrator.isInitialized()) {
      throw createTemplumError('Registry or orchestrator not initialized', 'SERVICE_NOT_READY', 'configuration');
    }

    try {
      // Check if adapter already exists
      if (this.adapters.has(interfaceType)) {
        console.warn(`InterfaceAdapterRegistry: Adapter for ${interfaceType} already exists, returning existing`);
        return this.adapters.get(interfaceType)!;
      }

      // Create adapter using factory
      const adapter = await this.createAdapter(interfaceType, context);
      
      // Initialize adapter with orchestrator abstraction
      await adapter.initialize(this.orchestrator);
      
      // Register adapter
      this.adapters.set(interfaceType, adapter);
      
      this.emit('adapterRegistered', { 
        interfaceType, 
        timestamp: Date.now(),
        totalAdapters: this.adapters.size
      });
      
      console.log(`InterfaceAdapterRegistry: Created and registered ${interfaceType} adapter via abstraction layer`);
      return adapter;
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      throw createTemplumError(`Failed to create ${interfaceType} adapter: ${errorMessage}`, 'ADAPTER_CREATION_ERROR', 'runtime');
    }
  }

  /**
   * Get existing interface adapter
   */
  getAdapter(interfaceType: InterfaceType): IInterfaceAdapter | undefined {
    return this.adapters.get(interfaceType);
  }

  /**
   * Get all registered adapters
   */
  getAllAdapters(): Map<InterfaceType, IInterfaceAdapter> {
    return new Map(this.adapters);
  }

  /**
   * Remove and dispose of interface adapter
   */
  async removeAdapter(interfaceType: InterfaceType): Promise<void> {
    const adapter = this.adapters.get(interfaceType);
    if (adapter) {
      try {
        await adapter.dispose();
        this.adapters.delete(interfaceType);
        
        this.emit('adapterRemoved', { 
          interfaceType, 
          timestamp: Date.now(),
          remainingAdapters: this.adapters.size
        });
        
        console.log(`InterfaceAdapterRegistry: Removed ${interfaceType} adapter`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`InterfaceAdapterRegistry: Failed to dispose ${interfaceType} adapter:`, errorMessage);
      }
    }
  }

  // Factory methods implementation

  createVSCodeAdapter(_context?: any): IInterfaceAdapter {
    const factory = this.adapterFactories.get('vscode');
    if (!factory) {
      throw createTemplumError('VSCode adapter factory not registered', 'FACTORY_NOT_FOUND', 'configuration');
    }
    return factory();
  }

  createCLIAdapter(_config?: any): IInterfaceAdapter {
    const factory = this.adapterFactories.get('cli');
    if (!factory) {
      throw createTemplumError('CLI adapter factory not registered', 'FACTORY_NOT_FOUND', 'configuration');
    }
    return factory();
  }

  createCommandAdapter(_config?: any): IInterfaceAdapter {
    const factory = this.adapterFactories.get('command');
    if (!factory) {
      throw createTemplumError('Command adapter factory not registered', 'FACTORY_NOT_FOUND', 'configuration');
    }
    return factory();
  }

  registerAdapterFactory(interfaceType: InterfaceType, factory: () => IInterfaceAdapter): void {
    this.adapterFactories.set(interfaceType, factory);
    console.log(`InterfaceAdapterRegistry: Registered factory for ${interfaceType} adapter`);
  }

  /**
   * Dispose all adapters and clean up registry
   */
  async dispose(): Promise<void> {
    try {
      // Dispose all adapters
      const disposePromises = Array.from(this.adapters.values()).map(adapter => {
        return adapter.dispose().catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('InterfaceAdapterRegistry: Adapter disposal error:', errorMessage);
        });
      });
      
      await Promise.allSettled(disposePromises);
      
      // Clear registries
      this.adapters.clear();
      this.adapterFactories.clear();
      this.initialized = false;
      
      this.emit('disposed', { timestamp: Date.now() });
      this.removeAllListeners();
      
      console.log('InterfaceAdapterRegistry: Disposal complete');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('InterfaceAdapterRegistry: Disposal failed:', errorMessage);
      throw createTemplumError(`Registry disposal failed: ${errorMessage}`, 'DISPOSAL_ERROR', 'runtime');
    }
  }

  /**
   * Set VSCode context for enhanced context provider integration
   * This provides a clean way to inject VSCode extension context
   * @param context VSCode extension context from activation
   */
  setVSCodeContext(context: any): void {
    this.vsCodeContext = context;
    this.emit('vsCodeContextSet', { 
      timestamp: Date.now(),
      hasContext: !!context,
      contextKeys: context ? Object.keys(context) : []
    });
    
    console.log('InterfaceAdapterRegistry: VSCode context set', {
      hasContext: !!context,
      contextType: context?.constructor?.name || 'unknown'
    });
  }

  /**
   * Get registry status
   */
  getStatus(): any {
    return {
      initialized: this.initialized,
      registeredAdapters: Array.from(this.adapters.keys()),
      availableFactories: Array.from(this.adapterFactories.keys()),
      orchestratorReady: this.orchestrator?.isInitialized() || false,
      contextStatus: {
        vscodeContextAvailable: !!(this.vsCodeContext || (global as any).__templumVSCodeContext || process.env.VSCODE_IPC_HOOK),
        vscodeContextSource: this.vsCodeContext ? 'registry' : 
                           (global as any).__templumVSCodeContext ? 'global' : 
                           process.env.VSCODE_IPC_HOOK ? 'environment' : 'none'
      }
    };
  }

  /**
   * Set VSCode extension context for adapter creation
   * Following Haruspex context management patterns for proper provider initialization
   */
  static setVSCodeContext(context: any): void {
    (global as any).__templumVSCodeContext = context;
    console.log('InterfaceAdapterRegistry: VSCode context registered for adapter factory use');
  }

  /**
   * Clear VSCode extension context (for cleanup)
   */
  static clearVSCodeContext(): void {
    delete (global as any).__templumVSCodeContext;
    console.log('InterfaceAdapterRegistry: VSCode context cleared');
  }

  /**
   * Create adapter using appropriate factory
   * @private
   */
  private async createAdapter(interfaceType: InterfaceType, context?: any): Promise<IInterfaceAdapter> {
    switch (interfaceType) {
      case 'vscode':
        return this.createVSCodeAdapter(context);
      case 'cli':
        return this.createCLIAdapter(context);
      case 'command':
        return this.createCommandAdapter(context);
      default:
        throw createTemplumError(`Unsupported interface type: ${interfaceType}`, 'UNSUPPORTED_INTERFACE', 'validation');
    }
  }

  /**
   * Register built-in adapter factories with lazy loading and proper context handling
   * Following Haruspex extension.ts provider registration patterns for robust initialization
   * @private
   */
  private async registerBuiltInFactories(): Promise<void> {
    const registeredFactories: string[] = [];
    const failedFactories: string[] = [];
    
    try {
      // VSCode adapter factory with context validation and graceful degradation
      this.registerAdapterFactory('vscode', () => {
        try {
          // Dynamic import to avoid circular dependencies
          const { createVSCodeInterfaceAdapter } = require('./vscode-adapter-abstracted');
          
          // Enhanced VSCode Context Provider Integration
          // Supports multiple context provision strategies with fallback chain
          let context: any = null;
          
          // Strategy 1: Context provided via registry setVSCodeContext method (preferred)
          if (this.vsCodeContext) {
            context = this.vsCodeContext;
          }
          // Strategy 2: Global state fallback for legacy integration
          else if ((global as any).__templumVSCodeContext) {
            context = (global as any).__templumVSCodeContext;
            console.info('InterfaceAdapterRegistry: Using global VSCode context (legacy fallback)');
          }
          // Strategy 3: Dynamic context resolution from VSCode environment
          else if (typeof process !== 'undefined' && process.env.VSCODE_IPC_HOOK) {
            // VSCode environment detected, create minimal context for extension integration
            context = {
              subscriptions: [],
              extensionPath: process.cwd(),
              globalState: {
                get: () => undefined,
                update: () => Promise.resolve()
              },
              workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve()
              }
            };
            console.info('InterfaceAdapterRegistry: Created minimal VSCode context from environment');
          }
          
          if (!context) {
            console.warn('InterfaceAdapterRegistry: VSCode context not available, adapter creation will be deferred');
            throw createTemplumError('VSCode context not available for adapter creation', 'CONTEXT_NOT_AVAILABLE', 'configuration');
          }
          
          return createVSCodeInterfaceAdapter(context);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown VSCode adapter creation error';
          console.error('InterfaceAdapterRegistry: VSCode adapter factory failed:', errorMessage);
          throw createTemplumError(`VSCode adapter creation failed: ${errorMessage}`, 'ADAPTER_FACTORY_ERROR', 'runtime');
        }
      });
      registeredFactories.push('vscode');

      // CLI adapter factory with enhanced error handling
      this.registerAdapterFactory('cli', () => {
        try {
          // Dynamic import to avoid circular dependencies
          const { createCLIInterfaceAdapter } = require('./cli-adapter-abstracted');
          return createCLIInterfaceAdapter(); // Default configuration works for CLI
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown CLI adapter creation error';
          console.error('InterfaceAdapterRegistry: CLI adapter factory failed:', errorMessage);
          throw createTemplumError(`CLI adapter creation failed: ${errorMessage}`, 'ADAPTER_FACTORY_ERROR', 'runtime');
        }
      });
      registeredFactories.push('cli');

      // Command adapter factory with enhanced error handling
      this.registerAdapterFactory('command', () => {
        try {
          // Dynamic import to avoid circular dependencies
          const { createCommandInterfaceAdapter } = require('./command-adapter-abstracted');
          return createCommandInterfaceAdapter(); // Default configuration works for command interface
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown command adapter creation error';
          console.error('InterfaceAdapterRegistry: Command adapter factory failed:', errorMessage);
          throw createTemplumError(`Command adapter creation failed: ${errorMessage}`, 'ADAPTER_FACTORY_ERROR', 'runtime');
        }
      });
      registeredFactories.push('command');

      console.log('InterfaceAdapterRegistry: Built-in factories registered with enhanced error handling', {
        factories: registeredFactories,
        implemented: ['vscode', 'cli', 'command'],
        contextDependencies: ['vscode'],
        independentFactories: ['cli', 'command']
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('InterfaceAdapterRegistry: Factory registration encountered errors:', errorMessage);
      failedFactories.push('unknown');
    } finally {
      // Log final registration status with Haruspex-style comprehensive reporting
      console.log('InterfaceAdapterRegistry: Factory registration complete', {
        successful: registeredFactories,
        failed: failedFactories,
        total: registeredFactories.length + failedFactories.length,
        gracefulDegradation: failedFactories.length > 0 ? 'Enabled - manual registration available' : 'Not needed'
      });
    }
  }
}

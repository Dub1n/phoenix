/**
 ---
title: [Interface Adapter Registry - Abstraction Layer Management]
tags: [Registry, Interface, Adapter, Abstraction]
provides: [InterfaceAdapterRegistry, Abstracted Adapter Management]
requires: [ITemplumOrchestrator, Interface Adapters, Factory Patterns]
description: [Registry for managing interface adapters through abstraction layer, eliminates direct coupling to concrete implementations]
 ---
 **/

import { InterfaceType, ErrorSignalPayload, createTemplumError, isTemplumError } from '../types/templum-types';
import { ITemplumOrchestrator, IInterfaceAdapter, IInterfaceAdapterFactory } from './templum-orchestrator-interface';
import {
  BaseRegistry,
  ComponentRegistration,
  LifecycleConfiguration,
  RegistryIntelligence,
  ValidationReport
} from '../utils/registry-utils';

type AdapterFactory = () => IInterfaceAdapter;

export interface InterfaceAdapterRegistryInitializeOptions {
  registerBuiltIns?: boolean;
}

interface AdapterRegistrationMetadata {
  interfaceType: InterfaceType;
  eager: boolean;
}

const DEFAULT_LIFECYCLE_CONFIGURATION: Partial<LifecycleConfiguration> = {
  enableValidation: true,
  validationLevel: 'standard',
  enableIntelligence: true,
  intelligenceUpdateInterval: 30_000,
  enablePerformanceMonitoring: true,
  lifecycleTimeout: 10_000
};

/**
 * Interface Adapter Registry backed by the shared registry utilities.
 *
 * This rewrite replaces bespoke map/lifecycle logic with the generic BaseRegistry implementation,
 * ensuring consistent validation, intelligence reporting, and lifecycle management across all registries.
 */
export class InterfaceAdapterRegistry
  extends BaseRegistry<IInterfaceAdapter, InterfaceAdapterRegistryInitializeOptions>
  implements IInterfaceAdapterFactory
{
  private orchestrator: ITemplumOrchestrator | null = null;
  private vsCodeContext: any = null;
  private registryReady = false;
  private builtInsRegistered = false;
  private readonly adapterFactories = new Map<InterfaceType, AdapterFactory>();

  constructor(configuration: Partial<LifecycleConfiguration> = {}) {
    super({ ...DEFAULT_LIFECYCLE_CONFIGURATION, ...configuration }, 'interface-adapter-registry');
  }

  /**
   * Initialize the registry with orchestrator abstraction and optional built-in factories.
   */
  async initialize(
    orchestrator: ITemplumOrchestrator,
    options: InterfaceAdapterRegistryInitializeOptions = {}
  ): Promise<void> {
    if (this.registryReady) {
      this.logger.warn('InterfaceAdapterRegistry: Already initialized');
      return;
    }

    try {
      this.orchestrator = orchestrator;
      const shouldRegisterBuiltIns = options.registerBuiltIns ?? true;

      if (shouldRegisterBuiltIns && !this.builtInsRegistered) {
        await this.registerBuiltInFactories();
      }

      await super.initialize(options);
      this.registryReady = true;

      this.emit('initialized', {
        timestamp: Date.now(),
        adapterFactories: this.adapterFactories.size
      });

      this.logger.info('InterfaceAdapterRegistry: Initialized with abstraction layer', {
        registeredFactories: Array.from(this.adapterFactories.keys()),
        orchestratorInitialized: this.orchestrator?.isInitialized() ?? false
      });
    } catch (error) {
      const payload: ErrorSignalPayload = {
        timestamp: Date.now(),
        source: 'InterfaceAdapterRegistry',
        error: isTemplumError(error)
          ? error
          : createTemplumError(
              error instanceof Error ? error.message : 'Unknown initialization error',
              'REGISTRY_INITIALIZATION_ERROR',
              'configuration'
            ),
        severity: 'critical'
      };

      this.logger.error('InterfaceAdapterRegistry: Initialization failed', {
        error: payload.error.message
      });

      throw payload.error;
    }
  }

  /**
   * Create (or resolve) an adapter instance for the requested interface type.
   */
  async createAndRegisterAdapter(interfaceType: InterfaceType, context?: any): Promise<IInterfaceAdapter> {
    this.ensureReady();

    if (!this.has(interfaceType)) {
      throw createTemplumError(
        `Adapter factory for ${interfaceType} is not registered`,
        'FACTORY_NOT_FOUND',
        'configuration'
      );
    }

    if (interfaceType === 'vscode' && context) {
      this.setVSCodeContext(context);
    }

    const adapter = await this.resolve(interfaceType);

    this.emit('adapterRegistered', {
      interfaceType,
      timestamp: Date.now(),
      totalAdapters: this.components.size
    });

    return adapter;
  }

  /**
   * Retrieve an existing adapter instance without creating a new one.
   */
  getAdapter(interfaceType: InterfaceType): IInterfaceAdapter | undefined {
    return this.components.get(interfaceType);
  }

  /**
   * Retrieve all active adapters.
   */
  getAllAdapters(): Map<InterfaceType, IInterfaceAdapter> {
    const entries = Array.from(this.components.entries()) as Array<[InterfaceType, IInterfaceAdapter]>;
    return new Map(entries);
  }

  /**
   * Remove and dispose of an adapter instance while keeping the factory registration intact.
   */
  async removeAdapter(interfaceType: InterfaceType): Promise<void> {
    const adapter = this.components.get(interfaceType);
    if (!adapter) {
      return;
    }

    try {
      if (typeof adapter.dispose === 'function') {
        await Promise.resolve(adapter.dispose());
      }
    } finally {
      this.components.delete(interfaceType);
      this.emit('adapterRemoved', {
        interfaceType,
        timestamp: Date.now(),
        remainingAdapters: this.components.size
      });
    }
  }

  /**
   * Factory interface implementation for VSCode adapter creation.
   */
  createVSCodeAdapter(_context?: any): IInterfaceAdapter {
    const factory = this.adapterFactories.get('vscode');
    if (!factory) {
      throw createTemplumError('VSCode adapter factory not registered', 'FACTORY_NOT_FOUND', 'configuration');
    }
    return factory();
  }

  /**
   * Factory interface implementation for CLI adapter creation.
   */
  createCLIAdapter(_config?: any): IInterfaceAdapter {
    const factory = this.adapterFactories.get('cli');
    if (!factory) {
      throw createTemplumError('CLI adapter factory not registered', 'FACTORY_NOT_FOUND', 'configuration');
    }
    return factory();
  }

  /**
   * Factory interface implementation for command adapter creation.
   */
  createCommandAdapter(_config?: any): IInterfaceAdapter {
    const factory = this.adapterFactories.get('command');
    if (!factory) {
      throw createTemplumError('Command adapter factory not registered', 'FACTORY_NOT_FOUND', 'configuration');
    }
    return factory();
  }

  /**
   * Register custom adapter factory and wire it into the shared registry lifecycle.
   */
  registerAdapterFactory(interfaceType: InterfaceType, factory: AdapterFactory, eager = false): void {
    this.adapterFactories.set(interfaceType, factory);

    if (this.has(interfaceType)) {
      const existing = this.components.get(interfaceType);
      if (existing && typeof existing.dispose === 'function') {
        void Promise.resolve(existing.dispose()).catch(() => undefined);
      }
      this.components.delete(interfaceType);
      this.unregister(interfaceType);
    }

    this.register({
      name: interfaceType,
      factory: async () => {
        const adapter = await Promise.resolve(factory());
        await this.initializeAdapter(interfaceType, adapter);
        return adapter;
      },
      lifecycle: {
        eager,
        dispose: async (adapter) => {
          if (typeof adapter.dispose === 'function') {
            await Promise.resolve(adapter.dispose());
          }
        }
      },
      metadata: this.createRegistrationMetadata(interfaceType, eager)
    });

    this.logger.debug('InterfaceAdapterRegistry: Registered factory', { interfaceType, eager });
  }

  /**
   * Dispose registry and reset tracked state.
   */
  async dispose(): Promise<void> {
    try {
      await super.dispose();
      this.registryReady = false;
      this.components.clear();
      this.logger.info('InterfaceAdapterRegistry: Disposal complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('InterfaceAdapterRegistry: Disposal failed', { error: message });
      throw error;
    }
  }

  /**
   * High-level status snapshot for diagnostics and observability.
   */
  getStatus(): {
    initialized: boolean;
    registeredAdapters: string[];
    activeAdapters: InterfaceType[];
    orchestratorReady: boolean;
    validation?: ValidationReport | null;
    intelligence?: RegistryIntelligence | null;
    contextStatus: {
      vscodeContextAvailable: boolean;
      vscodeContextSource: 'registry' | 'global' | 'environment' | 'none';
    };
  } {
    const validation = this.getValidationReport();
    const intelligence = this.getIntelligence();

    return {
      initialized: this.registryReady,
      registeredAdapters: this.getRegisteredComponents(),
      activeAdapters: Array.from(this.components.keys()) as InterfaceType[],
      orchestratorReady: this.orchestrator?.isInitialized() ?? false,
      validation,
      intelligence,
      contextStatus: {
        vscodeContextAvailable: !!this.resolveVSCodeContext(false),
        vscodeContextSource: this.determineVSCodeContextSource()
      }
    };
  }

  /**
   * Set VSCode extension context for adapter creation (instance-level).
   */
  setVSCodeContext(context: any): void {
    this.vsCodeContext = context;
    this.logger.debug('InterfaceAdapterRegistry: VSCode context set', {
      provided: true,
      hasSubscriptions: !!context?.subscriptions,
      hasGlobalState: !!context?.globalState
    });
  }

  /**
   * Clear VSCode extension context (instance-level).
   */
  clearVSCodeContext(): void {
    this.vsCodeContext = null;
    this.logger.debug('InterfaceAdapterRegistry: VSCode context cleared');
  }

  /**
   * Static helpers for legacy integrations that set the context globally.
   */
  static setVSCodeContext(context: any): void {
    (global as any).__templumVSCodeContext = context;
    console.log('InterfaceAdapterRegistry: VSCode context registered for adapter factory use');
  }

  static clearVSCodeContext(): void {
    delete (global as any).__templumVSCodeContext;
    console.log('InterfaceAdapterRegistry: VSCode context cleared');
  }

  // BaseRegistry lifecycle hooks ------------------------------------------------

  protected onBeforeInitialize(): void {
    // No-op hook maintained for future extensions.
  }

  protected onAfterInitialize(): void {
    // No additional work required post initialization.
  }

  protected onBeforeDispose(): void {
    // No-op hook maintained for symmetry.
  }

  protected onAfterDispose(): void {
    this.builtInsRegistered = false;
    this.orchestrator = null;
  }

  protected async validateComponent(
    component: IInterfaceAdapter,
    registration: ComponentRegistration<IInterfaceAdapter>
  ): Promise<{
    name: string;
    valid: boolean;
    issues: string[];
    interfaceCompliance: boolean;
    methodAvailability: boolean;
    initializationStatus: 'pending' | 'initialized' | 'failed';
    confidenceScore: number;
  }> {
    const issues: string[] = [];

    if (typeof component.initialize !== 'function') {
      issues.push('Adapter is missing initialize method');
    }

    if (typeof component.dispose !== 'function') {
      issues.push('Adapter is missing dispose method');
    }

    const initialized = this.components.has(registration.name);

    return {
      name: registration.name,
      valid: issues.length === 0,
      issues,
      interfaceCompliance: true,
      methodAvailability: issues.length === 0,
      initializationStatus: initialized ? 'initialized' : 'pending',
      confidenceScore: issues.length === 0 ? 0.95 : 0.5
    };
  }

  // Internal helpers -----------------------------------------------------------

  private ensureReady(): void {
    if (!this.registryReady) {
      throw createTemplumError('InterfaceAdapterRegistry is not initialized', 'SERVICE_NOT_READY', 'configuration');
    }

    if (!this.orchestrator || !this.orchestrator.isInitialized()) {
      throw createTemplumError('ITemplumOrchestrator is not initialized', 'SERVICE_NOT_READY', 'configuration');
    }
  }

  private async initializeAdapter(interfaceType: InterfaceType, adapter: IInterfaceAdapter): Promise<void> {
    if (!this.orchestrator || !this.orchestrator.isInitialized()) {
      throw createTemplumError('ITemplumOrchestrator is not initialized', 'SERVICE_NOT_READY', 'configuration');
    }

    if (typeof adapter.initialize === 'function') {
      await Promise.resolve(adapter.initialize(this.orchestrator));
    }

    this.logger.debug('InterfaceAdapterRegistry: Adapter initialized', { interfaceType });
  }

  private createRegistrationMetadata(interfaceType: InterfaceType, eager: boolean): AdapterRegistrationMetadata {
    return {
      interfaceType,
      eager
    };
  }

  private determineVSCodeContextSource(): 'registry' | 'global' | 'environment' | 'none' {
    if (this.vsCodeContext) {
      return 'registry';
    }

    if ((global as any).__templumVSCodeContext) {
      return 'global';
    }

    if (typeof process !== 'undefined' && process.env.VSCODE_IPC_HOOK) {
      return 'environment';
    }

    return 'none';
  }

  private resolveVSCodeContext(throwOnMissing = true): any {
    if (this.vsCodeContext) {
      return this.vsCodeContext;
    }

    if ((global as any).__templumVSCodeContext) {
      return (global as any).__templumVSCodeContext;
    }

    if (typeof process !== 'undefined' && process.env.VSCODE_IPC_HOOK) {
      return {
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
    }

    if (throwOnMissing) {
      throw createTemplumError('VSCode context not available for adapter creation', 'CONTEXT_NOT_AVAILABLE', 'configuration');
    }

    return null;
  }

  private async registerBuiltInFactories(): Promise<void> {
    const registered: InterfaceType[] = [];
    const failed: string[] = [];

    try {
      // VSCode adapter factory with layered context resolution
      this.registerAdapterFactory('vscode', () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { createVSCodeInterfaceAdapter } = require('./vscode-adapter-abstracted');
          const context = this.resolveVSCodeContext();
          return createVSCodeInterfaceAdapter(context);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown VSCode adapter creation error';
          throw createTemplumError(`VSCode adapter creation failed: ${message}`, 'ADAPTER_FACTORY_ERROR', 'runtime');
        }
      });
      registered.push('vscode');

      // CLI adapter factory
      this.registerAdapterFactory('cli', () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { createCLIInterfaceAdapter } = require('./cli-adapter-abstracted');
          return createCLIInterfaceAdapter();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown CLI adapter creation error';
          throw createTemplumError(`CLI adapter creation failed: ${message}`, 'ADAPTER_FACTORY_ERROR', 'runtime');
        }
      });
      registered.push('cli');

      // Command adapter factory
      this.registerAdapterFactory('command', () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { createCommandInterfaceAdapter } = require('./command-adapter-abstracted');
          return createCommandInterfaceAdapter();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown command adapter creation error';
          throw createTemplumError(`Command adapter creation failed: ${message}`, 'ADAPTER_FACTORY_ERROR', 'runtime');
        }
      });
      registered.push('command');

      this.logger.info('InterfaceAdapterRegistry: Built-in factories registered', {
        factories: registered
      });
      this.builtInsRegistered = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown adapter factory registration error';
      failed.push(message);
      this.logger.warn('InterfaceAdapterRegistry: Factory registration encountered errors', {
        error: message
      });
      throw error;
    } finally {
      this.logger.debug('InterfaceAdapterRegistry: Factory registration summary', {
        successful: registered,
        failed,
        total: registered.length + failed.length
      });
    }
  }
}

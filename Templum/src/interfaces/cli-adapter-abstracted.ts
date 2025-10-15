/**
---
title: [CLI Interface Adapter - Abstraction Layer Implementation]
tags: [Interface, Adapter, CLI, Abstraction]
provides: [CLIInterfaceAdapter, Abstracted CLI Integration]
requires: [ITemplumOrchestrator, CLI Framework, Universal Types]
description: [Abstracted CLI interface adapter that depends on ITemplumOrchestrator interface, not concrete implementations]
---
*/

import * as readline from 'readline';
import { 
  createTemplumError, 
  isTemplumError,
  InterfaceType,
  CommandResult,
  UniversalSkinDefinition,
  StateUpdate,
  InterfaceAdapterStatus
} from '../types/templum-types';
import { 
  ITemplumOrchestrator, 
  IInterfaceAdapter 
} from './templum-orchestrator-interface';
import {
  EventUtils,
  ScopedEventBus,
  SubscriptionOptions,
  TypedEventMap,
  UnsubscribeFn
} from '../utils/event-utils';
import {
  TerminalUI,
  DefaultColorThemes,
  ProgressBar,
  Spinner,
  InteractivePrompt,
  ResponsiveLayout,
  createDefaultTerminalUI
} from './terminal-ui-components';
import { StringUtils } from '../utils/chainable-string-utils';
import { UniversalLayoutEngine } from '../rendering/universal-layout-engine';
import {
  createFormatter,
  TerminalCapabilities,
  TerminalFormatter,
  getFormatterSeparatorLength,
} from '../utils/terminal-formatter';
import {
  buildSkinMenuFromUniversalDefinition,
  coerceUniversalMenuDefinition,
} from '../rendering/menu-definition-adapter';
import { 
  InteractiveMenuRenderer, 
  MenuInteractionResult 
} from './interactive-menu-renderer';
import { 
  CLIDisplayConsistencyEngine, 
  createCLIDisplayConsistencyEngine,
  BackendStatusDisplayData 
} from './cli-display-consistency-engine';
import { ServiceInfo } from './service-ordering-manager';
import { CLISessionBridge, CLISessionSnapshot } from './cli-session-bridge';
import { EnhancedWindowSystem, WindowSetRenderResult } from './enhanced-window-system';
import { sleep } from '../utils/async-utils';
import { createLogger, LogLevel } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { TypeGuards, TypeValidators } from '../utils/type-guards';
import type { UniversalMenuRegistry, UniversalMenuDefinition } from '../menus/universal-menu-registry';

/**
 * CLI Input Types (Interface-specific)
 */
export interface CLIInput {
  type: 'command' | 'menu_selection' | 'keyboard_shortcut' | 'navigation';
  value: string;
  rawInput?: string;
  context?: CLIInputContext;
}

export interface CLIInputContext {
  currentMenu?: string;
  navigationHistory?: string[];
  sessionId?: string;
}

export interface CLIInputResult {
  handled: boolean;
  result?: any;
  navigationChange?: NavigationChange;
  errors?: string[];
}

export interface NavigationChange {
  action: 'menu' | 'back' | 'forward' | 'exit';
  target?: string;
  previousMenu?: string;
}

export interface CLIRenderResult {
  success: boolean;
  rendered: boolean;
  output?: string;
  errors?: string[];
}

interface CLIInteractiveSessionEvent {
  menu: string;
  timestamp: number;
}

interface CLIInteractiveSessionStoppedEvent {
  timestamp: number;
}

interface CLISkinRenderedEvent {
  interfaceType: InterfaceType;
  skinId: string;
  renderTime?: number;
  items: number;
}

interface CLIInterfaceAdapterEvents extends TypedEventMap {
  stateUpdated: (state: StateUpdate) => void;
  skinRendered: (payload: CLISkinRenderedEvent) => void;
  interactiveSessionStarted: (payload: CLIInteractiveSessionEvent) => void;
  interactiveSessionStopped: (payload: CLIInteractiveSessionStoppedEvent) => void;
  interruptReceived: () => void;
}

type CLIEventKey = Extract<keyof CLIInterfaceAdapterEvents, string>;
type AnyListener = (...args: any[]) => unknown;

/**
 * Abstracted CLI Interface Adapter
 * 
 * This adapter uses the ITemplumOrchestrator abstraction instead of directly coupling
 * to concrete implementations like UniversalCommandRegistry, UniversalMenuRegistry, etc.
 * This provides proper separation of concerns and enables dependency inversion.
 */
export class CLIInterfaceAdapter implements IInterfaceAdapter {
  private static instanceCounter = 0;

  private readonly eventScope: string;
  private readonly events: ScopedEventBus<CLIInterfaceAdapterEvents>;
  private readonly listenerRegistry = new Map<CLIEventKey, Map<AnyListener, UnsubscribeFn>>();
  private orchestrator!: ITemplumOrchestrator;
  private readlineInterface: readline.Interface | null = null;
  private keyboardShortcuts = new Map<string, string>();
  private isInteractiveMode: boolean = false;
  private config: CLIAdapterConfig;
  private terminalUI: TerminalUI;
  private activeSpinner: Spinner | null = null;
  private activeProgressBar: ProgressBar | null = null;
  private interactiveMenuRenderer: InteractiveMenuRenderer | null = null;
  private sessionManager!: CLISessionBridge;
  private consistencyEngine: CLIDisplayConsistencyEngine;
  private readonly formatter: TerminalFormatter;
  private readonly logger = createLogger('cli-interface-adapter', { level: LogLevel.INFO });
  private windowSystem: EnhancedWindowSystem;
  private activeSkin: UniversalSkinDefinition | null = null;
  private readonly compatibilityLayoutEngine = new UniversalLayoutEngine();

  constructor(config?: CLIAdapterInitializationOptions) {
    const { formatter, formatterCapabilities, ...adapterConfig } = config ?? {};

    this.eventScope = `cli-interface-adapter:${CLIInterfaceAdapter.instanceCounter++}`;
    this.events = EventUtils.createScopedBus<CLIInterfaceAdapterEvents>(this.eventScope, 75);

    this.config = {
      enableInteractiveMode: true,
      enableKeyboardShortcuts: true,
      enableColorOutput: true,
      enableProgressIndicators: true,
      clearScreenOnRender: true,
      maxHistorySize: 50,
      inputTimeout: 30000,
      terminalTheme: 'default',
      enableResponsiveLayout: true,
      ...adapterConfig
    };

    const capabilities = this.resolveFormatterCapabilities(formatterCapabilities);
    this.formatter = formatter ?? createFormatter({}, capabilities);

    // Initialize terminal UI with centralized defaults
    this.terminalUI = createDefaultTerminalUI(this.config.terminalTheme, {
      formatter: this.formatter,
      columnsProvider: () => this.formatter.getCapabilities().width,
    });

    // Initialize session manager
    // TODO: [TASK-ID-004] Pattern: session-manager-integration | Complexity: 4 | Dependencies: session-persistence
    // Initialize consistency engine with responsive layout integration
    // TODO: [TASK-ID-005] Pattern: display-consistency-integration | Complexity: 6 | Dependencies: consistency-framework,responsive-layout
    // Context: Integration of CLI display consistency engine for uniform formatting across all display elements
    this.consistencyEngine = createCLIDisplayConsistencyEngine({
      enforceWidthStandards: this.config.enableResponsiveLayout,
      enforceServiceOrdering: true,
      enforceLayoutNormalization: true,
      skinCompatibilityMode: true,
      responsiveBreakpoints: {
        small: getFormatterSeparatorLength(),
        medium: 100,
        large: 140
      }
    });

    this.windowSystem = new EnhancedWindowSystem();
  }

  emit<K extends CLIEventKey>(event: K, ...args: Parameters<CLIInterfaceAdapterEvents[K]>): boolean {
    return this.events.emit(event, ...args);
  }

  on<K extends CLIEventKey>(event: K, listener: CLIInterfaceAdapterEvents[K]): this {
    this.registerListener(event, listener);
    return this;
  }

  addListener<K extends CLIEventKey>(event: K, listener: CLIInterfaceAdapterEvents[K]): this {
    return this.on(event, listener);
  }

  once<K extends CLIEventKey>(event: K, listener: CLIInterfaceAdapterEvents[K]): this {
    this.registerListener(event, listener, { once: true });
    return this;
  }

  off<K extends CLIEventKey>(event: K, listener: CLIInterfaceAdapterEvents[K]): this {
    this.unregisterListener(event, listener);
    return this;
  }

  removeListener<K extends CLIEventKey>(event: K, listener: CLIInterfaceAdapterEvents[K]): this {
    return this.off(event, listener);
  }

  removeAllListeners(event?: CLIEventKey): this {
    if (event) {
      this.flushListeners(event);
    } else {
      for (const eventName of Array.from(this.listenerRegistry.keys())) {
        this.flushListeners(eventName);
      }
      this.events.cleanup();
    }
    return this;
  }

  listenerCount(event: CLIEventKey): number {
    return this.events.getListenerCount(event);
  }

  eventNames(): CLIEventKey[] {
    return this.events.getEventNames();
  }

  private registerListener<K extends CLIEventKey>(
    event: K,
    listener: CLIInterfaceAdapterEvents[K],
    options?: SubscriptionOptions
  ): void {
    const unsubscribe = EventUtils.subscribe(this.events.emitter, event, listener, {
      context: this.eventScope,
      ...options
    });

    if (!this.listenerRegistry.has(event)) {
      this.listenerRegistry.set(event, new Map());
    }

    this.listenerRegistry.get(event)!.set(listener as unknown as AnyListener, unsubscribe);
  }

  private unregisterListener<K extends CLIEventKey>(
    event: K,
    listener: CLIInterfaceAdapterEvents[K]
  ): void {
    const registry = this.listenerRegistry.get(event);
    const unsubscribe = registry?.get(listener as unknown as AnyListener);

    if (unsubscribe) {
      unsubscribe();
      registry!.delete(listener as unknown as AnyListener);
      if (registry!.size === 0) {
        this.listenerRegistry.delete(event);
      }
    } else {
      this.events.emitter.off(event, listener);
    }
  }

  private flushListeners(event: CLIEventKey): void {
    const registry = this.listenerRegistry.get(event);
    if (registry) {
      for (const unsubscribe of registry.values()) {
        unsubscribe();
      }
      registry.clear();
      this.listenerRegistry.delete(event);
    }
    this.events.emitter.removeAllListeners(event);
  }

  private formatColumn(
    value: unknown,
    width: number,
    alignment: 'left' | 'right' | 'center' = 'right'
  ): string {
    const text = value === null || value === undefined ? '' : String(value);
    return StringUtils.chain(text, { mode: 'terminal' }).pad(width, alignment).value();
  }

  private resolveFormatterCapabilities(
    overrides?: Partial<TerminalCapabilities>
  ): TerminalCapabilities {
    const detected = TerminalFormatter.detectCapabilities();
    const merged: TerminalCapabilities = {
      ...detected,
      ...overrides,
    };

    if (!this.config.enableColorOutput) {
      return {
        ...merged,
        supportsColor: false,
        supportsStyles: false,
      };
    }

    return merged;
  }

  private formatInfo(message: string): string {
    return this.formatter.status.info(message);
  }

  private formatSuccess(message: string): string {
    return this.formatter.status.success(message);
  }

  private formatWarning(message: string): string {
    return this.formatter.status.warning(message);
  }

  private formatError(message: string): string {
    return this.formatter.status.error(message);
  }

  private formatMuted(message: string): string {
    return this.formatter.text.muted(message);
  }

  private formatSeparator(length: number): string {
    return this.formatter.ui.separator(length, 'double');
  }

  private formatCommandPrompt(prompt: string): string {
    return this.formatter.system.command(prompt);
  }

  private printLine(message: string = ''): void {
    process.stdout.write(`${message}\n`);
  }

  private normalizeError(error: unknown): Error | undefined {
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === 'string' && error.length > 0) {
      return new Error(error);
    }
    return undefined;
  }

  private getSessionSnapshot(): CLISessionSnapshot {
    return this.sessionManager.getCurrentSession();
  }

  private getCurrentMenu(): string {
    return this.getSessionSnapshot().currentMenu;
  }

  private getNavigationHistory(): string[] {
    return [...this.getSessionSnapshot().navigationHistory];
  }

  private outputProceduralWindows(windowSet: WindowSetRenderResult['windowSet']): void {
    windowSet.windows.forEach((window, index) => {
      this.printLine(window.output);
      if (index < windowSet.windows.length - 1) {
        this.printLine();
      }
    });
  }

  private calculateWindowItemCount(result: WindowSetRenderResult): number {
    const activeWindow =
      result.windowSet.windows.find((window) => window.menuId === result.windowSet.activeMenuId) ??
      result.windowSet.windows[0];

    if (!activeWindow) {
      return 0;
    }

    return activeWindow.content.sections.reduce((total, section) => total + section.items.length, 0);
  }

  private async updateMenuRegistryState(result: WindowSetRenderResult): Promise<void> {
    const registry = await this.resolveMenuRegistry();
    if (!registry) {
      return;
    }

    try {
      await registry.updateMenuState('cli', {
        activeMenu: result.windowSet.activeMenuId,
        navigationHistory: result.windowSet.navigationHistory,
      });
    } catch (error) {
      this.logger.warn('Failed to update menu registry state', this.normalizeError(error));
    }
  }

  private validateMenuPayload(menuData: unknown): {
    isValid: boolean;
    reason?: string;
    payload?: UniversalMenuDefinition;
  } {
    if (!TypeGuards.isPlainObject(menuData)) {
      return {
        isValid: false,
        reason: 'CLIInterfaceAdapter: menu payload must be a plain object',
      };
    }

    const payload = menuData as Record<string, unknown>;
    const sections = payload.sections;

    if (
      sections !== undefined &&
      !TypeValidators.isArrayOf(
        sections,
        (entry): entry is Record<string, unknown> => TypeGuards.isPlainObject(entry)
      )
    ) {
      return {
        isValid: false,
        reason: 'CLIInterfaceAdapter: menu payload sections must be an array of plain objects',
      };
    }

    if (Array.isArray(sections)) {
      for (const section of sections as Record<string, unknown>[]) {
        const items = section.items;
        if (
          items !== undefined &&
          !TypeValidators.isArrayOf(
            items,
            (item): item is Record<string, unknown> => TypeGuards.isPlainObject(item)
          )
        ) {
          return {
            isValid: false,
            reason: 'CLIInterfaceAdapter: menu items must be provided as plain object entries',
          };
        }
      }
    }

    return {
      isValid: true,
      payload: coerceUniversalMenuDefinition(payload, {
        fallbackId: 'cli-menu',
        fallbackTitle: 'Templum CLI Menu',
      }),
    };
  }

  private async resolveMenuRegistry(): Promise<UniversalMenuRegistry | null> {
    const candidate = this.orchestrator as unknown as {
      getMenuRegistry?: () => UniversalMenuRegistry | Promise<UniversalMenuRegistry>;
    };

    if (candidate && typeof candidate.getMenuRegistry === 'function') {
      try {
        const registry = await candidate.getMenuRegistry();
        return registry ?? null;
      } catch (_error) {
        return null;
      }
    }

    return null;
  }

  private setCurrentMenu(menuId: string, options: { addToHistory?: boolean; resetHistory?: boolean } = {}): void {
    const { addToHistory = true, resetHistory = false } = options;
    if (resetHistory) {
      this.sessionManager.resetNavigationHistory();
    }
    this.sessionManager.navigateToMenu(menuId, addToHistory);
  }

  /**
   * Initialize with orchestrator abstraction
   */
  async initialize(orchestrator: ITemplumOrchestrator): Promise<void> {
    this.orchestrator = orchestrator;

    // Initialize session management first
    const sessionManagerContract = this.orchestrator.getSessionManager();
    this.sessionManager = new CLISessionBridge({ sessionManager: sessionManagerContract });
    await this.sessionManager.initialize();

    // Restore session state
    const session = this.sessionManager.getCurrentSession();

    // Register this adapter with the orchestrator
    await this.orchestrator.registerInterface('cli', this);
    
    // Initialize CLI components
    await this.initializeCLIComponents();

    this.logger.info('Initialized with session', { sessionId: session.sessionId });
  }

  async render(menuData: unknown): Promise<CLIRenderResult> {
    if (!this.orchestrator || !this.orchestrator.isInitialized()) {
      return {
        success: false,
        rendered: false,
        errors: ['Adapter not initialized'],
      };
    }

    const validation = this.validateMenuPayload(menuData);
    if (!validation.isValid || !validation.payload) {
      return {
        success: false,
        rendered: false,
        errors: [validation.reason ?? 'CLIInterfaceAdapter: invalid menu payload'],
      };
    }

    try {
      const skinDefinition = buildSkinMenuFromUniversalDefinition(validation.payload, 'cli');
      const renderResult = await this.compatibilityLayoutEngine.renderForInterface(
        skinDefinition,
        'cli',
        {
          interfaceType: 'cli',
          minHeight: 15,
          minWidth: 40,
          maxWidth: 100,
          textboxLines: 3,
          paddingLines: 2,
          enforceConsistentHeight: true,
          interfaceSpecific: {
            cli: {
              interactive: this.config.enableInteractiveMode,
              colorDepth: this.config.enableColorOutput ? 8 : 0,
              unicodeSupport: true,
            },
          },
        }
      );

      if (renderResult.success && renderResult.output) {
        this.printLine(renderResult.output);

        if (this.config.enableKeyboardShortcuts && this.keyboardShortcuts.size > 0) {
          this.displayKeyboardShortcuts();
        }

        return {
          success: true,
          rendered: true,
          output: renderResult.output,
        };
      }

      return {
        success: false,
        rendered: false,
        errors: renderResult.errors ?? ['Unknown rendering error'],
      };
    } catch (error) {
      const templumError = ErrorHandler.handle(error, 'interfaces.cli-adapter.render');
      return {
        success: false,
        rendered: false,
        errors: [templumError.message],
      };
    }
  }

  getInterfaceType(): InterfaceType {
    return 'cli';
  }

  supportsSkin(skinDefinition: UniversalSkinDefinition): boolean {
    // Check if this skin is compatible with CLI interface
    return skinDefinition.metadata.compatibleInterfaces.includes('cli');
  }

  isInInteractiveMode(): boolean {
    return this.isInteractiveMode;
  }

  getActiveMenuId(): string {
    return this.getCurrentMenu();
  }

  /**
   * Sync state update from orchestrator
   */
  async syncState(stateUpdate: StateUpdate): Promise<void> {
    try {
      // Handle state synchronization for CLI interface
      this.logger.info('Received state update', {
        timestamp: new Date(stateUpdate.timestamp).toISOString()
      });
      
      // Update local state based on menu updates
      if (stateUpdate.menuUpdates) {
        for (const [menuId, menuUpdate] of Object.entries(stateUpdate.menuUpdates)) {
          if (menuUpdate.refreshRequired && menuId !== this.getCurrentMenu()) {
            this.logger.info('Menu refresh required', { menuId });
          }
          // Handle navigation state changes if available
          if (menuUpdate.navigationState) {
            this.logger.debug('Navigation state updated', { menuId, navigationState: menuUpdate.navigationState });
          }
        }
      }
      
      // Handle session state updates
      if (stateUpdate.sessionState) {
        this.logger.info('Session state synchronized');
      }

      this.emit('stateUpdated', stateUpdate);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('State sync failed', this.normalizeError(error), { errorMessage });
    }
  }

  /**
   * Get adapter status information
   */
  getStatus(): InterfaceAdapterStatus {
    return {
      active: this.orchestrator?.isInitialized() && this.isInteractiveMode,
      interfaceType: 'cli',
      initialized: this.orchestrator?.isInitialized() || false,
      connected: this.isInteractiveMode,
      lastActivity: Date.now(),
      activeSession: this.isInteractiveMode ? 'interactive' : undefined,
      error: undefined,
      performance: {
        averageResponseTime: 0, // CLI is typically immediate response
        totalCommands: 0, // Could track this if needed
        errorRate: 0 // Could track this if needed
      },
      configuration: {
        interactiveMode: this.config.enableInteractiveMode,
        keyboardShortcuts: this.config.enableKeyboardShortcuts,
        colorOutput: this.config.enableColorOutput
      }
    };
  }


  /**
   * Apply skin definition using orchestrator abstraction
   */
  async applySkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    if (!this.orchestrator.isInitialized()) {
      this.logger.warn('Cannot apply skin - orchestrator not ready');
      return;
    }

    try {
      let skinEngineResult: any = null;
      const skinEngine = this.orchestrator.getUniversalSkinEngine();

      if (skinEngine?.renderForInterface) {
        try {
          skinEngineResult = await skinEngine.renderForInterface(
            skinDefinition,
            'cli',
            {
              interfaceType: 'cli',
              interactive: this.config.enableInteractiveMode,
              colorDepth: this.config.enableColorOutput ? 8 : 0,
            }
          );

          if (skinEngineResult?.success === false) {
            this.logger.warn('Skin engine reported an unsuccessful render', {
              fallbackReason: skinEngineResult.metadata?.fallbackReason ?? 'unknown reason'
            });
          }
        } catch (renderError) {
          const normalizedError = this.normalizeError(renderError);
          this.logger.warn('Skin engine render failed, continuing with procedural renderer', normalizedError);
          this.logger.error('Failed to apply skin', normalizedError, {
            errorMessage: normalizedError?.message ?? 'Unknown skin engine render error',
          });
        }
      } else {
        this.logger.warn('Skin engine does not implement renderForInterface; relying on procedural renderer');
      }

      const currentMenuId = this.getCurrentMenu();
      const defaultMenuId = skinDefinition.menus?.main?.id ?? currentMenuId ?? 'main';
      const targetMenuId =
        currentMenuId && currentMenuId !== 'main'
          ? currentMenuId
          : defaultMenuId;

      const windowSetResult = await this.windowSystem.renderWindowSet(skinDefinition, {
        menuId: targetMenuId,
        navigationHistory: this.getNavigationHistory(),
      });

      const cliRenderOutput =
        typeof skinEngineResult?.renderedContent?.cli === 'string'
          ? skinEngineResult.renderedContent.cli
          : null;

      if (cliRenderOutput) {
        this.printLine(cliRenderOutput);
      }

      if (windowSetResult.windowSet.windows.length > 0) {
        this.outputProceduralWindows(windowSetResult.windowSet);
      } else if (!cliRenderOutput) {
        this.printLine(this.formatWarning('Procedural renderer did not return any CLI windows.'));
      }

      this.sessionManager.navigateToMenu(windowSetResult.windowSet.activeMenuId, false);
      await this.updateMenuRegistryState(windowSetResult);

      if (this.config.enableKeyboardShortcuts && this.keyboardShortcuts.size > 0) {
        this.displayKeyboardShortcuts();
      }

      this.emit('skinRendered', {
        interfaceType: 'cli' as InterfaceType,
        skinId: skinDefinition.metadata.id,
        renderTime: windowSetResult.renderTime,
        items: this.calculateWindowItemCount(windowSetResult),
      });

      this.logger.info('Applied skin via orchestrator abstraction', {
        skinName: skinDefinition.metadata.name,
        skinId: skinDefinition.metadata.id,
        mode: windowSetResult.mode,
      });

      this.activeSkin = skinDefinition;
      
    } catch (error) {
      const templumError = ErrorHandler.handle(error, 'interfaces.cli-adapter.apply-skin', {
        skinId: skinDefinition?.metadata?.id ?? skinDefinition?.id ?? this.activeSkin?.id,
      });
      this.logger.error('Failed to apply skin', templumError, {
        errorMessage: templumError.message,
      });
      this.printLine(this.formatError('Failed to apply skin. See logs for details.'));
    }
  }

  async renderMenuWindow(menuId: string): Promise<WindowSetRenderResult> {
    const loadedSkins = this.orchestrator.getLoadedSkins();
    const fallbackSkin = loadedSkins.length > 0 ? loadedSkins[loadedSkins.length - 1] : null;
    const activeSkin = this.activeSkin ?? fallbackSkin;

    if (!activeSkin) {
      throw createTemplumError('Cannot render menu window without a loaded skin', 'SERVICE_NOT_READY', 'configuration');
    }

    const windowSetResult = await this.windowSystem.renderWindowSet(activeSkin, {
      menuId,
      navigationHistory: this.getNavigationHistory(),
    });

    if (windowSetResult.windowSet.windows.length > 0) {
      const targetWindow =
        windowSetResult.windowSet.windows.find((window) => window.menuId === menuId) ??
        windowSetResult.windowSet.windows[0];

      this.printLine(targetWindow.output);
    } else {
      this.printLine(this.formatWarning(`No procedural window available for menu '${menuId}'.`));
    }

    this.sessionManager.navigateToMenu(windowSetResult.windowSet.activeMenuId, true);
    await this.updateMenuRegistryState(windowSetResult);

    return windowSetResult;
  }

  /**
   * Execute command using orchestrator abstraction with terminal UI enhancements
   */
  async executeCommand(command: string, args: any[] = []): Promise<any> {
    if (!this.orchestrator.isInitialized()) {
      throw createTemplumError('Orchestrator not initialized', 'SERVICE_NOT_READY', 'configuration');
    }

    let spinner: Spinner | null = null;
    
    try {
      // Show spinner for command execution if enabled
      if (this.config.enableProgressIndicators) {
        spinner = this.terminalUI.createSpinner({
          text: `Executing command: ${command}`,
          frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
        });
        spinner.start();
      }
      
      // Execute command through orchestrator abstraction
      const result = await this.orchestrator.executeCommand(
        command,
        'cli',
        args,
        { 
          source: 'CLIInterfaceAdapter', 
          timestamp: Date.now(),
          interactive: this.isInteractiveMode,
          currentMenu: this.getCurrentMenu()
        }
      );

      // TASK-CLI-014: Check if orchestrator indicates command should be handled locally
      if (result && result.handleLocally === true) {
        // Process command locally instead of forwarding to service
        this.logger.info('Processing command locally', { command });
        
        if (spinner) {
          spinner.info(`Processing '${command}' locally`);
        }
        
        // Handle local command processing
        const localResult = await this.processLocalCommand(command, args);
        
        if (spinner) {
          spinner.succeed(`Command '${command}' processed locally`);
        }
        
        return localResult;
      }

      // Stop spinner and show success for remote commands
      if (spinner) {
        spinner.succeed(`Command '${command}' executed successfully`);
      }

      // Display results in CLI format with responsive layout
      this.displayCommandResult(result);
      
      return result;
      
    } catch (error) {
      const errorMessage = isTemplumError(error) ? error.message : (error instanceof Error ? error.message : 'Unknown error');
      
      // Stop spinner and show error
      if (spinner) {
        spinner.fail(`Command '${command}' failed: ${errorMessage}`);
      }
      
      throw createTemplumError(`Command execution failed: ${errorMessage}`, 'COMMAND_EXECUTION_ERROR', 'runtime');
    }
  }

  /**
   * TASK-CLI-014: Process local CLI commands that should not be forwarded to Templum Core
   * @private
   */
  private async processLocalCommand(command: string, _args: any[] = []): Promise<any> {
    const cmd = command.trim().toLowerCase();
    
    try {
      // Handle different types of local commands
      if (cmd === 'help') {
        await this.displayHelp();
        return { success: true, message: 'Help displayed', command };
        
      } else if (cmd === 'refresh') {
        await this.loadInitialContent();
        return { success: true, message: 'CLI content refreshed', command };
        
      } else if (cmd === 'status') {
        await this.displayAvailableBackends();
        return { success: true, message: 'Backend status displayed', command };
        
      } else if (cmd === 'back') {
        // Navigate back in menu history using session manager
        const previousMenu = this.sessionManager.navigateBack();
        if (previousMenu) {
          await this.loadInitialContent();
          return { success: true, message: `Navigated back to ${previousMenu}`, command };
        } else {
          return { success: false, message: 'No previous menu in history', command };
        }
        
      } else if (cmd === 'home') {
        // Navigate to main menu
        this.setCurrentMenu('main', { addToHistory: false, resetHistory: true });
        await this.loadInitialContent();
        return { success: true, message: 'Navigated to main menu', command };
        
      } else if (cmd === 'c' || cmd === 'command') {
        // TODO: [TASK-ID-005] Pattern: dual-interaction-modes | Complexity: 5 | Dependencies: terminal-ui-components,session-persistence
        // Context: Switch to command mode with preserved session state and seamless mode switching
        // Validation-Required: mode-switching, state-preservation, user-experience
        // Pattern-Info: { approach: "hotkey-mode-switching", alternatives: "menu-selection,flag-based", trade-offs: "immediacy-vs-discoverability" }
        return await this.switchToCommandMode();
        
      } else if (cmd === 'm' || cmd === 'menu') {
        // Switch to menu mode
        return await this.switchToMenuMode();
        
      } else if (cmd.startsWith('load ')) {
        // Load specific backend skin
        const backendId = cmd.substring(5).trim();
        await this.loadSpecificBackendSkin(backendId);
        return { success: true, message: `Attempted to load skin from ${backendId}`, command };
        
      } else if (/^\d+$/.test(cmd)) {
        // Handle numeric menu selection
        await this.handleInput({
          type: 'menu_selection',
          value: cmd,
          context: { currentMenu: this.getCurrentMenu() }
        });
        return { success: true, message: `Menu selection: ${cmd}`, command };
        
      } else if (cmd === 'quit' || cmd === 'exit') {
        // Handle exit commands
        this.printLine('👋 Goodbye!');
        process.exit(0);
        
      } else {
        // Unknown local command
        this.printLine(`❌ Unknown local command: ${command}`);
        this.printLine('💡 Type "help" to see available commands');
        return { success: false, message: `Unknown local command: ${command}`, command };
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Local command processing failed', this.normalizeError(error), {
        command
      });
      this.printLine(this.formatError(`❌ Local command processing failed: ${errorMessage}`));
      return { success: false, error: errorMessage, command };
    }
  }

  /**
   * Start interactive CLI session with visual menu navigation
   */
  async startInteractiveSession(initialMenu = 'main'): Promise<void> {
    if (!this.config.enableInteractiveMode) {
      throw createTemplumError('Interactive mode not enabled', 'CONFIGURATION_ERROR', 'configuration');
    }

    if (!this.orchestrator.isInitialized()) {
      throw createTemplumError('Orchestrator not initialized', 'SERVICE_NOT_READY', 'configuration');
    }

    try {
      this.isInteractiveMode = true;
      this.setCurrentMenu(initialMenu, { addToHistory: false, resetHistory: true });

      // Initialize interactive menu renderer
      this.interactiveMenuRenderer = new InteractiveMenuRenderer(this.orchestrator, {
        formatter: this.formatter
      });

      // Show welcome message
      this.printLine(this.formatSuccess('✅ Connected to Templum service successfully'));
      this.printLine(this.formatInfo('🚀 Starting Templum interactive session...'));
      this.printLine(this.formatMuted('Use arrow keys to navigate, Enter to select, Ctrl+C to exit'));
      this.printLine(this.formatSeparator(60));

      // TASK-CLI-014: Add automatic skin discovery and loading during initialization
      this.printLine(this.formatInfo('🔍 Discovering and loading backend skins...'));
      await this.loadInitialContent();
      this.printLine(this.formatSeparator(60));

      this.emit('interactiveSessionStarted', { menu: this.getCurrentMenu(), timestamp: Date.now() });

      // Start interactive menu loop
      await this.runInteractiveMenuLoop();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createTemplumError(`Failed to start interactive session: ${errorMessage}`, 'SESSION_START_ERROR', 'runtime');
    }
  }

  /**
   * Run interactive menu loop with navigation and command execution
   */
  private async runInteractiveMenuLoop(): Promise<void> {
    if (!this.interactiveMenuRenderer) {
      throw createTemplumError('Interactive menu renderer not initialized', 'INTERNAL_ERROR', 'runtime');
    }

    let sessionRunning = true;
    const sessionHistory: string[] = [];

    try {
      while (sessionRunning && this.isInteractiveMode) {
        try {
          const result: MenuInteractionResult = await this.interactiveMenuRenderer.displayMenu();
          
          // Record interaction in session history
          sessionHistory.push(`${new Date().toISOString()}: ${result.action} - ${result.target || result.command || 'unknown'}`);
          
          switch (result.action) {
            case 'navigate':
            case 'back':
              // Navigation is handled by the menu renderer
              break;
              
            case 'execute':
              if (result.command) {
                await this.executeMenuCommand(result.command, result.data);
                
                // TODO: [TASK-MCP-010-002] Pattern: cli-design-compliance | Complexity: 3 | Dependencies: command-execution,navigation-flow
                // Context: Replaced Press Enter message with timeout-based flow per CLI-design specification
                // Validation-Required: command-execution-flow, user-experience-timing, cli-design-compliance
                // Pattern-Info: { approach: "timeout-based-continuation", alternatives: "immediate-return", trade-offs: "result-visibility-vs-flow-speed" }
                // Brief pause to show result, then return to menu
                // CLI-design compliance: No Press Enter messages
                await sleep(1500);
              }
              break;
              
            case 'help':
              // Help is displayed by the menu renderer, just wait for user
            await this.waitForKeypress();
            break;
            
          case 'quit':
            sessionRunning = false;
            break;
        }
        
      } catch (error) {
        if ((error as any).isTtyError === false || (error as any).name === 'ExitPromptError') {
          // User pressed Ctrl+C
          sessionRunning = false;
        } else {
          this.logger.error('Menu interaction error', this.normalizeError(error));
          const description =
            error instanceof Error
              ? error.message
              : typeof error === 'string'
                ? error
                : 'Unknown error';
          this.printLine(this.formatError(`Menu interaction error: ${description}`));
          // TODO: [TASK-MCP-010-003] Pattern: cli-design-compliance | Complexity: 3 | Dependencies: error-handling,navigation-flow
          // Context: Replaced Press Enter message with timeout-based error handling per CLI-design specification
          // Validation-Required: error-display-timing, user-experience-flow, cli-design-compliance
          // Pattern-Info: { approach: "timeout-based-error-handling", alternatives: "immediate-return", trade-offs: "error-visibility-vs-flow-interruption" }
          // Brief pause to display error, then return to menu
          // CLI-design compliance: No Press Enter messages
          await sleep(2000);
        }
      }
    }
    
  } finally {
      // Store session history for potential debugging
      this.printLine(this.formatWarning('\n🛑 Interactive session ended'));
      this.printLine(this.formatMuted(`Session history: ${sessionHistory.length} interactions recorded`));
    }
  }

  /**
   * Execute command from menu selection
   */
  private async executeMenuCommand(command: string, data?: any): Promise<void> {
    let commandNamespace: string | undefined;
    let commandAction: string | undefined;
    try {
      this.printLine(this.formatInfo(`\n⚡ Executing: ${command}`));
      
      const [namespace, action, ...args] = command.split(':');
      commandNamespace = namespace;
      commandAction = action;
      
      switch (namespace) {
        case 'system':
          await this.handleSystemCommand(action, args, data);
          break;
          
        case 'services':
          await this.handleServicesCommand(action, args, data);
          break;
          
        case 'backend':
          await this.handleBackendCommand(action, args, data);
          break;
          
        case 'command':
          await this.handleCommandExecution(action, args, data);
          break;
          
        case 'settings':
          await this.handleSettingsCommand(action, args, data);
          break;
          
        case 'execute':
          // Execute command on specific backend
          if (args.length > 0) {
            const backendId = args[0];
            const commandToExecute = await this.promptForCommand(`Enter command for ${backendId}:`);
            if (commandToExecute.trim()) {
              const result = await this.orchestrator.executeCommand(
                commandToExecute, 
                'cli', 
                [], 
                { backendId, source: 'interactive-menu' }
              );
              this.displayCommandResult(result);
            }
          }
          break;
          
        default:
          this.printLine(this.formatWarning(`Unknown command namespace: ${namespace}`));
      }
      
    } catch (error) {
      const normalizedError = this.normalizeError(error);
      const errorMessage =
        normalizedError?.message ?? (typeof error === 'string' ? error : 'Unknown error');
      const metadata: Record<string, unknown> = {};
      if (commandNamespace !== undefined) {
        metadata.namespace = commandNamespace;
      }
      if (commandAction !== undefined) {
        metadata.action = commandAction;
      }
      this.logger.error(
        'Command execution failed during menu handling',
        normalizedError ?? null,
        Object.keys(metadata).length > 0 ? metadata : undefined
      );
      this.printLine(this.formatError(`Command execution failed: ${errorMessage}`));
    }
  }

  /**
   * Handle system commands
   */
  private async handleSystemCommand(action: string, _args: string[], _data?: any): Promise<void> {
    switch (action) {
      case 'status':
        const systemStatus = this.orchestrator.getSystemStatus();
        this.printLine(this.formatSuccess('\n📊 System Status:'));
        this.printLine(`  Initialized: ${systemStatus.coreEngine.initialized ? '✅' : '❌'}`);
        this.printLine(`  Active Interfaces: ${systemStatus.activeInterfaces?.join(', ') || 'None'}`);
        
        if (systemStatus.coreEngine?.backendConnections?.backends) {
          const backends = Object.entries(systemStatus.coreEngine.backendConnections.backends);
          this.printLine(`  Connected Backends: ${backends.length}`);
          
          if (backends.length > 0) {
            this.displayBackendStatus({ backends: systemStatus.coreEngine.backendConnections.backends });
          }
        }
        break;
        
      default:
        this.printLine(this.formatWarning(`Unknown system command: ${action}`));
    }
  }

  /**
   * Handle services commands
   */
  private async handleServicesCommand(action: string, _args: string[], _data?: any): Promise<void> {
    switch (action) {
      case 'list':
        const systemStatus = this.orchestrator.getSystemStatus();
        if (systemStatus.coreEngine?.backendConnections?.backends) {
          this.displayBackendStatus({ backends: systemStatus.coreEngine.backendConnections.backends });
        } else {
          this.printLine(this.formatWarning('No backend services found'));
        }
        break;
        
      case 'refresh':
        this.printLine(this.formatInfo('🔄 Refreshing backend services...'));
        await this.orchestrator.refreshBackendServices();
        this.printLine(this.formatSuccess('✅ Backend services refreshed'));
        break;
        
      default:
        this.printLine(this.formatWarning(`Unknown services command: ${action}`));
    }
  }

  /**
   * Handle backend-specific commands
   */
  private async handleBackendCommand(action: string, args: string[], _data?: any): Promise<void> {
    if (action === 'info' && args.length > 0) {
      const backendId = args[0];
      const systemStatus = this.orchestrator.getSystemStatus();
      
      const backends = systemStatus.coreEngine?.backendConnections?.backends;
      if (backends) {
        // Find the backend in the typed structure
        const backendEntry = Object.entries(backends).find(([key]) => key === backendId);
        if (backendEntry) {
          const [_key, backend] = backendEntry;
          this.printLine(this.formatSuccess(`\n📋 Backend Info: ${backendId}`));
          this.printLine(`  Connected: ${backend.connected ? '✅' : '❌'}`);
          this.printLine(`  Health: ${backend.health || 'Unknown'}`);
          this.printLine(`  Last Check: ${new Date(backend.lastCheck).toISOString()}`);
          
          if (backend.capabilities) {
            this.printLine(`  Capabilities: ${backend.capabilities.join(', ')}`);
          }
          
          if (backend.version) {
            this.printLine(`  Version: ${backend.version}`);
          }
          
          if (backend.responseTime) {
            this.printLine(`  Response Time: ${backend.responseTime}ms`);
          }
        } else {
          this.printLine(this.formatWarning(`Backend not found: ${backendId}`));
        }
      } else {
        this.printLine(this.formatWarning(`Backend not found: ${backendId}`));
      }
    } else {
      this.printLine(this.formatWarning(`Unknown backend command: ${action}`));
    }
  }

  /**
   * Handle command execution
   */
  private async handleCommandExecution(action: string, _args: string[], _data?: any): Promise<void> {
    if (action === 'custom') {
      const command = await this.promptForCommand('Enter command to execute:');
      if (command.trim()) {
        const result = await this.orchestrator.executeCommand(
          command, 
          'cli', 
          [], 
          { source: 'interactive-menu-custom' }
        );
        this.displayCommandResult(result);
      }
    }
  }

  /**
   * Handle settings commands
   */
  private async handleSettingsCommand(action: string, _args: string[], _data?: any): Promise<void> {
    switch (action) {
      case 'toggle-mode':
        this.printLine(this.formatInfo('🔀 Switching to command mode...'));
        // Switch to command mode (would need additional implementation)
        this.printLine(this.formatWarning('Command mode not yet implemented - staying in menu mode'));
        break;
        
      default:
        this.printLine(this.formatWarning(`Unknown settings command: ${action}`));
    }
  }

  /**
   * Wait for user keypress without conflicting with main inquirer session
   * TASK-CLI-009: Fixed nested inquirer calls causing terminal state corruption
   */
  private async waitForKeypress(): Promise<void> {
    const stdin = process.stdin;

    // Non-TTY environments (automated testing, etc.) do not support keypress
    if (!stdin.isTTY) {
      await sleep(1000);
      return;
    }

    await new Promise<void>((resolve) => {
      // Use a simple one-time listener without changing terminal modes
      // This avoids conflicts with the main inquirer session
      stdin.resume();
      const listener = () => {
        stdin.removeListener('data', listener);
        stdin.pause();
        resolve();
      };
      stdin.once('data', listener);
    });
  }

  /**
   * Prompt for custom command input
   */
  private async promptForCommand(message: string): Promise<string> {
    const inquirer = await import('inquirer');
    const { command } = await inquirer.default.prompt([
      {
        type: 'input',
        name: 'command',
        message: message
      }
    ]);
    return command;
  }

  /**
   * Stop interactive CLI session
   */
  async stopInteractiveSession(): Promise<void> {
    this.isInteractiveMode = false;
    
    if (this.readlineInterface) {
      this.readlineInterface.removeAllListeners();
      this.readlineInterface.close();
      this.readlineInterface = null;
    }

    this.emit('interactiveSessionStopped', { timestamp: Date.now() });
    this.logger.info('Interactive session stopped');
  }

  async dispose(): Promise<void> {
    try {
      // Stop interactive session if active
      if (this.isInteractiveMode) {
        await this.stopInteractiveSession();
      }

      // Cleanup session manager
      if (this.sessionManager?.dispose) {
        await this.sessionManager.dispose();
      }

      // Cleanup terminal UI components
      await this.terminalUI.cleanup();

      // Clean up resources
      this.keyboardShortcuts.clear();
      this.sessionManager?.resetNavigationHistory();
      this.removeAllListeners();
      
      this.logger.info('Disposed successfully with session saved');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Disposal error', this.normalizeError(error), { errorMessage });
    }
  }

  async cleanup(): Promise<boolean> {
    await this.dispose();
    return true;
  }

  /**
   * Switch to command mode with session persistence
   * TODO: [TASK-ID-006] Pattern: command-mode-implementation | Complexity: 6 | Dependencies: dual-interaction-modes,session-persistence
   * Context: Implement direct command input mode with readline interface and command history
   * Validation-Required: command-parsing, history-management, error-handling
   * Pattern-Info: { approach: "readline-based-command-mode", alternatives: "prompt-library", trade-offs: "control-vs-simplicity" }
   */
  private async switchToCommandMode(): Promise<any> {
    this.printLine(this.formatInfo('\n🔧 Switching to Command Mode'));
    this.printLine(this.formatMuted('Type commands directly. Use "m" to return to menu mode.'));
    this.printLine(this.formatMuted('Commands: help, status, load <backend>, quit, etc.'));
    this.printLine(this.formatSeparator(50));
    
    this.sessionManager.switchInteractionMode('command');
    
    // Start command mode input loop
    await this.runCommandModeLoop();
    
    return { success: true, message: 'Entered command mode', mode: 'command' };
  }

  /**
   * Switch to menu mode with session persistence
   */
  private async switchToMenuMode(): Promise<any> {
    this.printLine(this.formatInfo('\n📋 Switching to Menu Mode'));
    this.printLine(this.formatMuted('Use arrow keys to navigate, Enter to select.'));
    this.printLine(this.formatSeparator(50));
    
    this.sessionManager.switchInteractionMode('menu');
    
    // Refresh menu content
    await this.loadInitialContent();
    
    return { success: true, message: 'Entered menu mode', mode: 'menu' };
  }

  /**
   * Run command mode input loop with readline
   */
  private async runCommandModeLoop(): Promise<void> {
    const readline = require('readline');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.formatCommandPrompt('templum> ')
    });

    // Setup command history
    const session = this.sessionManager.getCurrentSession();
    if (session.commandHistory.length > 0) {
      // Note: readline history setup would require more complex implementation
      this.printLine(this.formatMuted(`Command history available (${session.commandHistory.length} commands)`));
    }

    rl.prompt();

    return new Promise((resolve) => {
      rl.on('line', async (input: string) => {
        const command = input.trim();
        
        if (!command) {
          rl.prompt();
          return;
        }

        // Add command to session history
        this.sessionManager.addCommandToHistory(command);

        // Check for mode switching
        if (command === 'm' || command === 'menu') {
          rl.close();
          await this.switchToMenuMode();
          resolve();
          return;
        }

        // Check for exit
        if (command === 'quit' || command === 'exit') {
          this.printLine('👋 Goodbye!');
          rl.close();
          process.exit(0);
        }

        try {
          // Process the command
          const result = await this.processLocalCommand(command);
          
          if (result.success) {
            this.printLine(this.formatSuccess(`✅ ${result.message}`));
          } else {
            this.printLine(this.formatError(`❌ ${result.message}`));
          }
          
        } catch (error) {
          // TODO: [TASK-ID-007] Pattern: intelligent-error-recovery | Complexity: 7 | Dependencies: error-recovery-patterns,user-guidance
          // Context: Enhanced error handling with recovery suggestions and user guidance
          // Validation-Required: error-categorization, recovery-suggestion-accuracy, user-experience
          // Pattern-Info: { approach: "contextual-error-recovery", alternatives: "generic-error-display", trade-offs: "complexity-vs-user-experience" }
          await this.handleIntelligentError(error, command, 'command-mode');
        }

        rl.prompt();
      });

      rl.on('close', () => {
        resolve();
      });

      rl.on('SIGINT', () => {
        this.printLine(this.formatWarning('\n🔄 Use "m" to switch to menu mode or "quit" to exit'));
        rl.prompt();
      });
    });
  }

  /**
   * Intelligent error handling with contextual recovery suggestions
   * TODO: [TASK-ID-008] Pattern: contextual-error-recovery-system | Complexity: 8 | Dependencies: error-analysis,user-guidance-patterns
   * Context: Comprehensive error analysis and recovery suggestion system with context-aware guidance
   * Validation-Required: error-pattern-recognition, suggestion-relevance, recovery-success-rate
   * Pattern-Info: { approach: "pattern-based-error-analysis", alternatives: "static-error-mapping", trade-offs: "intelligence-vs-maintainability" }
   */
  private async handleIntelligentError(error: any, context: string, source: string): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = this.categorizeError(error, context);
    
    // Display error with context
    this.printLine(this.formatError(`\n❌ ${errorType.category}: ${errorMessage}`));
    
    // Provide recovery suggestions
    const suggestions = this.generateRecoverySuggestions(errorType, context, source);
    if (suggestions.length > 0) {
      this.printLine(this.formatWarning('\n💡 Recovery Suggestions:'));
      suggestions.forEach((suggestion, index) => {
        this.printLine(this.formatWarning(`   ${index + 1}. ${suggestion.action}`));
        if (suggestion.command) {
          this.printLine(this.formatMuted(`      Try: ${suggestion.command}`));
        }
      });
    }
    
    // Offer automated recovery if available
    const autoRecovery = this.getAutomatedRecovery(errorType, context);
    if (autoRecovery) {
      this.printLine(this.formatInfo(`\n🔧 Auto-recovery available: ${autoRecovery.description}`));
      this.printLine(this.formatMuted('Type "y" to attempt auto-recovery, or any other key to continue...'));
      
      // Note: In a full implementation, this would wait for user input
      // For now, just log the availability
    }
    
    // Log error for session history
    this.sessionManager.addCommandToHistory(`ERROR: ${context} - ${errorMessage}`);
  }

  /**
   * Categorize error based on patterns and context
   */
  private categorizeError(error: any, context: string): { category: string; severity: 'low' | 'medium' | 'high'; recoverable: boolean } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // IPC/Communication errors
    if (errorMessage.includes('IPC') || errorMessage.includes('timeout') || errorMessage.includes('ENOENT')) {
      return { category: 'Communication Error', severity: 'high', recoverable: true };
    }
    
    // Service discovery errors
    if (errorMessage.includes('service') && (errorMessage.includes('not found') || errorMessage.includes('unavailable'))) {
      return { category: 'Service Unavailable', severity: 'high', recoverable: true };
    }
    
    // Command syntax errors
    if (errorMessage.includes('Unknown') && context.includes('command')) {
      return { category: 'Command Error', severity: 'low', recoverable: true };
    }
    
    // Backend errors
    if (errorMessage.includes('backend') || errorMessage.includes('skin')) {
      return { category: 'Backend Error', severity: 'medium', recoverable: true };
    }
    
    // File system errors
    if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
      return { category: 'Permission Error', severity: 'medium', recoverable: true };
    }
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return { category: 'Network Error', severity: 'high', recoverable: true };
    }
    
    // Default categorization
    return { category: 'System Error', severity: 'medium', recoverable: false };
  }

  /**
   * Generate contextual recovery suggestions
   */
  private generateRecoverySuggestions(errorType: { category: string; severity: string; recoverable: boolean }, context: string, source: string): Array<{ action: string; command?: string; priority: number }> {
    const suggestions: Array<{ action: string; command?: string; priority: number }> = [];
    
    switch (errorType.category) {
      case 'Communication Error':
        suggestions.push(
          { action: 'Check if Templum service is running', command: 'ps aux | grep templum', priority: 1 },
          { action: 'Restart Templum service if needed', command: 'node dist/src/index.js', priority: 2 },
          { action: 'Check service registry', command: 'ls ~/.templum/services/', priority: 3 }
        );
        break;
        
      case 'Service Unavailable':
        suggestions.push(
          { action: 'Refresh backend services', command: 'refresh', priority: 1 },
          { action: 'Check backend status', command: 'status', priority: 2 },
          { action: 'Load specific backend manually', command: 'load <backend-id>', priority: 3 }
        );
        break;
        
      case 'Command Error':
        suggestions.push(
          { action: 'View available commands', command: 'help', priority: 1 },
          { action: 'Check command spelling and syntax', priority: 2 },
          { action: 'Switch to menu mode for guided navigation', command: 'm', priority: 3 }
        );
        break;
        
      case 'Backend Error':
        suggestions.push(
          { action: 'Check backend connectivity', command: 'status', priority: 1 },
          { action: 'Try loading a different backend', command: 'load pcl', priority: 2 },
          { action: 'Restart CLI to refresh connections', priority: 3 }
        );
        break;
        
      case 'Permission Error':
        suggestions.push(
          { action: 'Check file permissions', priority: 1 },
          { action: 'Run with appropriate permissions', priority: 2 },
          { action: 'Check ~/.templum directory access', priority: 3 }
        );
        break;
        
      case 'Network Error':
        suggestions.push(
          { action: 'Check network connectivity', priority: 1 },
          { action: 'Verify service endpoints', priority: 2 },
          { action: 'Switch to local mode if available', priority: 3 }
        );
        break;
    }
    
    // Add context-specific suggestions
    if (source === 'command-mode') {
      suggestions.push({ action: 'Switch to menu mode for easier navigation', command: 'm', priority: 4 });
    }
    
    if (context.includes('skin')) {
      suggestions.push({ action: 'Try loading default skin', command: 'load default', priority: 4 });
    }
    
    return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Get automated recovery options
   */
  private getAutomatedRecovery(errorType: { category: string; severity: string; recoverable: boolean }, context: string): { description: string; action: () => Promise<void> } | null {
    if (!errorType.recoverable) {
      return null;
    }
    
    switch (errorType.category) {
      case 'Service Unavailable':
        return {
          description: 'Refresh backend services and reload interface',
          action: async () => {
            await this.orchestrator.refreshBackendServices();
            await this.loadInitialContent();
          }
        };
        
      case 'Backend Error':
        return {
          description: 'Reset to main menu and refresh content',
          action: async () => {
            this.setCurrentMenu('main', { addToHistory: false, resetHistory: true });
            await this.loadInitialContent();
          }
        };
        
      case 'Command Error':
        if (context.includes('load')) {
          return {
            description: 'Show available backends for loading',
            action: async () => {
              await this.displayAvailableBackends();
            }
          };
        }
        break;
    }
    
    return null;
  }

  /**
   * Create and display a progress bar for long-running operations
   */
  createProgressBar(total: number, message?: string): ProgressBar {
    const progressBar = this.terminalUI.createProgressBar({
      width: this.getOptimalProgressBarWidth(),
      format: ':bar :percent :eta :message',
      showPercentage: true,
      showEta: true
    });
    
    progressBar.start(total);
    if (message) {
      progressBar.update(0, message);
    }
    
    this.activeProgressBar = progressBar;
    return progressBar;
  }

  /**
   * Create an interactive prompt for user input
   */
  createPrompt(): InteractivePrompt {
    return this.terminalUI.createPrompt();
  }

  /**
   * Show a spinner with message
   */
  showSpinner(message: string): Spinner {
    const spinner = this.terminalUI.createSpinner({
      text: message
    });
    
    spinner.start();
    this.activeSpinner = spinner;
    return spinner;
  }

  /**
   * Hide active spinner
   */
  hideSpinner(finalMessage?: string): void {
    if (this.activeSpinner) {
      if (finalMessage) {
        this.activeSpinner.succeed(finalMessage);
      } else {
        this.activeSpinner.stop();
      }
      this.activeSpinner = null;
    }
  }

  /**
   * Set terminal theme
   */
  setTheme(themeName: keyof typeof DefaultColorThemes): void {
    const theme = DefaultColorThemes[themeName];
    if (theme) {
      this.terminalUI.setTheme(theme);
      this.config.terminalTheme = themeName;
    }
  }

  /**
   * Get responsive layout manager
   */
  getResponsiveLayout(): ResponsiveLayout {
    return this.terminalUI.getLayout();
  }

  /**
   * Format content with responsive layout
   */
  formatResponsiveContent<T>(content: T, formatters: {
    small: (content: T) => string;
    medium: (content: T) => string;
    large: (content: T) => string;
  }): string {
    return this.terminalUI.getLayout().formatForBreakpoint(content, formatters);
  }

  /**
   * Create responsive table display
   */
  displayTable(data: any[], headers: string[]): void {
    const table = this.terminalUI.getLayout().createTable(data, headers);
    this.printLine(table);
  }

  /**
   * Handle CLI input with proper abstraction
   */
  async handleInput(input: CLIInput): Promise<CLIInputResult> {
    try {
      switch (input.type) {
        case 'command':
          return await this.handleCommandInput(input);
        case 'menu_selection':
          return await this.handleMenuSelection(input);
        case 'keyboard_shortcut':
          return await this.handleKeyboardShortcut(input);
        case 'navigation':
          return await this.handleNavigation(input);
        default:
          return { handled: false, errors: [`Unknown input type: ${input.type}`] };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Input handling error', this.normalizeError(error), { errorMessage });
      return { 
        handled: false, 
        errors: [errorMessage] 
      };
    }
  }

  /**
   * Initialize CLI components using orchestrator abstraction
   * @private
   */
  private async initializeCLIComponents(): Promise<void> {
    // Setup keyboard shortcuts
    if (this.config.enableKeyboardShortcuts) {
      await this.setupKeyboardShortcuts();
    }

    // Setup event handlers for orchestrator events
    this.setupEventHandlers();
  }

  /**
   * Load initial content using orchestrator abstraction
   * @private
   */
  private async loadInitialContent(): Promise<void> {
    if (!this.orchestrator.isInitialized()) {
      return;
    }

    try {
      this.logger.info('Loading initial content with real backend integration');
      
      // Get system status with real backend connection information
      const systemStatus = this.orchestrator.getSystemStatus();
      const backendConnections = systemStatus.coreEngine?.backendConnections || { backends: {}, totalConnections: 0, healthyConnections: 0 };

      // Attempt to render any skins already loaded into the orchestrator before falling back to backend discovery
      const preloadedSkins =
        typeof this.orchestrator.getLoadedSkins === 'function'
          ? this.orchestrator.getLoadedSkins().filter((skin) =>
              skin?.metadata?.compatibleInterfaces?.includes('cli'))
          : [];

      let skinLoaded = false;

      for (const skin of preloadedSkins) {
        try {
          this.logger.info('Rendering preloaded skin', {
            skinId: skin.metadata?.id ?? skin.id,
            skinName: skin.metadata?.name ?? skin.id
          });
          await this.applySkin(skin);
          skinLoaded = true;
          break;
        } catch (preloadedError) {
          const message = preloadedError instanceof Error ? preloadedError.message : String(preloadedError);
          this.logger.warn('Failed to render preloaded skin', {
            skinId: skin.metadata?.id ?? skin.id,
            errorMessage: message
          });
        }
      }

      // Display backend status
      this.displayBackendStatus(backendConnections);
      
      // Prioritize healthy backends for skin loading
      const healthyBackends = Object.entries(backendConnections.backends || {})
        .filter(([_, status]) => status.connected && status.health === 'healthy')
        .sort((a, b) => {
          const aTime = a[1].responseTime || 1000;
          const bTime = b[1].responseTime || 1000;
          return aTime - bTime; // Prefer faster response times
        });

      this.logger.info('Healthy backend count discovered', {
        healthyBackendCount: healthyBackends.length,
        totalBackends: Object.keys(backendConnections.backends || {}).length
      });

      // If no preloaded skin rendered successfully, attempt to load from healthy backends
      for (const [backendId] of healthyBackends) {
        if (skinLoaded) {
          break;
        }
        try {
          this.logger.info('Attempting to load backend skin', { backendId });
          
          const skinDefinition = await this.orchestrator.loadBackendSkin(backendId);
          
          if (skinDefinition) {
            this.logger.info('Loaded backend skin', {
              backendId,
              skinId: skinDefinition.id,
              skinName: skinDefinition.name ?? skinDefinition.id
            });
            await this.applySkin(skinDefinition);
            skinLoaded = true;
            break;
          }
        } catch (error) {
          const normalizedError = this.normalizeError(error);
          this.logger.warn('Failed to load skin from backend', {
            backendId,
            errorMessage: normalizedError?.message ?? (error instanceof Error ? error.message : 'Unknown error')
          });
        }
      }

      // Display fallback content if no skins loaded
      if (!skinLoaded) {
        this.printLine(this.getFallbackCLIOutput(backendConnections));
      }

    } catch (error) {
      const templumError = ErrorHandler.handle(error, 'interfaces.cli-adapter.load-initial-content');
      this.logger.error('Failed to load initial content', templumError);
      this.printLine(this.getErrorCLIOutput(templumError.message));
    }
  }

  /**
   * Setup readline interface for interactive mode
   * @private
   */
  private async setupReadlineInterface(): Promise<void> {
    this.readlineInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });

    this.readlineInterface.on('line', async (input) => {
      await this.processInteractiveInput(input.trim());
    });

    this.readlineInterface.on('SIGINT', () => {
      this.emit('interruptReceived');
      this.stopInteractiveSession();
    });

    this.readlineInterface.prompt();
  }

  /**
   * Setup default keyboard shortcuts
   * @private
   */
  private async setupKeyboardShortcuts(): Promise<void> {
    const defaultShortcuts = [
      { key: 'h', command: 'help', description: 'Show help' },
      { key: 'q', command: 'quit', description: 'Quit application' },
      { key: 'b', command: 'back', description: 'Go back' },
      { key: 'r', command: 'refresh', description: 'Refresh current view' },
      { key: 's', command: 'status', description: 'Show system status' }
    ];

    for (const shortcut of defaultShortcuts) {
      this.keyboardShortcuts.set(shortcut.key, shortcut.command);
    }
  }

  /**
   * Setup event handlers for orchestrator events
   * @private
   */
  private setupEventHandlers(): void {
    // Listen for orchestrator events if accessible
    // Note: This would depend on the orchestrator's event interface
  }

  /**
   * Process interactive input
   * @private
   */
  private async processInteractiveInput(input: string): Promise<void> {
    if (!input) {
      this.readlineInterface?.prompt();
      return;
    }

    // Handle navigation commands
    if (input === 'back') {
      await this.handleNavigation({ type: 'navigation', value: 'back' });
    } else if (input === 'quit' || input === 'exit') {
      await this.stopInteractiveSession();
      return;
    } else if (input === 'help') {
      this.displayHelp();
    } else if (input === 'status') {
      const systemStatus = this.orchestrator.getSystemStatus();
      this.displayBackendStatus(systemStatus.coreEngine?.backendConnections || { backends: {}, totalConnections: 0, healthyConnections: 0 });
    } else if (input === 'refresh') {
      await this.loadInitialContent();
    } else if (input.startsWith('load ')) {
      // Manual backend skin loading
      const backendId = input.substring(5).trim();
      await this.loadSpecificBackendSkin(backendId);
    } else if (/^\d+$/.test(input)) {
      // Numeric menu selection
      await this.handleInput({
        type: 'menu_selection',
        value: input,
        context: { currentMenu: this.getCurrentMenu() }
      });
    } else {
      // Command execution
      await this.handleInput({
        type: 'command',
        value: input,
        context: { currentMenu: this.getCurrentMenu() }
      });
    }

    if (this.isInteractiveMode) {
      this.readlineInterface?.prompt();
    }
  }

  /**
   * Handle command input
   * @private
   */
  private async handleCommandInput(input: CLIInput): Promise<CLIInputResult> {
    try {
      const result = await this.executeCommand(input.value, []);
      return { handled: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { handled: false, errors: [errorMessage] };
    }
  }

  /**
   * Handle menu selection (placeholder - would need menu system integration)
   * @private
   */
  private async handleMenuSelection(input: CLIInput): Promise<CLIInputResult> {
    this.printLine(`Menu selection ${input.value} (integration with orchestrator menu system pending)`);
    return { handled: true, result: { menuSelection: input.value } };
  }

  /**
   * Handle keyboard shortcut
   * @private
   */
  private async handleKeyboardShortcut(input: CLIInput): Promise<CLIInputResult> {
    const command = this.keyboardShortcuts.get(input.value);
    
    if (!command) {
      return { handled: false, errors: ['Unknown keyboard shortcut'] };
    }

    return await this.handleCommandInput({
      type: 'command',
      value: command,
      context: input.context
    });
  }

  /**
   * Handle navigation
   * @private
   */
  private async handleNavigation(input: CLIInput): Promise<CLIInputResult> {
    switch (input.value) {
      case 'back':
        if (this.getNavigationHistory().length === 0) {
          return { handled: false, errors: ['No previous menu in history'] };
        }
        const previousMenu = this.sessionManager.navigateBack();
        if (!previousMenu) {
          return { handled: false, errors: ['No previous menu in history'] };
        }
        this.printLine(`Navigated back to: ${previousMenu}`);
        return { handled: true, navigationChange: { action: 'back', target: previousMenu } };
      
      case 'home':
        this.setCurrentMenu('main', { addToHistory: false, resetHistory: true });
        this.printLine('Navigated to main menu');
        return { handled: true, navigationChange: { action: 'menu', target: 'main' } };
      
      default:
        return { handled: false, errors: ['Unknown navigation command'] };
    }
  }

  /**
   * Display command result in CLI format
   * @private
   */
  private displayCommandResult(result: CommandResult): void {
    if (result.success) {
      this.printLine(`✅ ${result.message || 'Command executed successfully'}`);
      
      if (result.metadata?.backendId) {
        this.printLine(`   Backend: ${result.metadata.backendId}`);
      }
      
      if (result.executionTime) {
        this.printLine(`   Time: ${result.executionTime}ms`);
      }
    } else {
      this.printLine(`❌ ${result.error || 'Command execution failed'}`);
    }
  }

  /**
   * Get optimal progress bar width based on terminal size
   * @private
   */
  private getOptimalProgressBarWidth(): number {
    const layout = this.terminalUI.getLayout();
    const dimensions = layout.getDimensions();
    const breakpoint = layout.getCurrentBreakpoint();
    
    switch (breakpoint) {
      case 'small':
        return Math.min(30, dimensions.width - 20);
      case 'medium':
        return Math.min(50, dimensions.width - 30);
      case 'large':
        return Math.min(70, dimensions.width - 40);
      default:
        return 40;
    }
  }

  /**
   * Display backend status information using consistency framework
   * @private
   */
  private displayBackendStatus(backendConnections: any): void {
    // Convert backend connections to ServiceInfo format for consistency engine
    const services: ServiceInfo[] = Object.entries(backendConnections.backends).map(([serviceId, status]) => {
      const statusTyped = status as any;
      return {
        id: serviceId,
        name: serviceId,
        connected: statusTyped.connected || false,
        health: statusTyped.health || 'unknown',
        responseTime: statusTyped.responseTime,
        capabilities: statusTyped.capabilities || [],
        lastCheck: statusTyped.lastCheck || Date.now(),
        version: statusTyped.version,
        metadata: statusTyped
      } as ServiceInfo;
    });

    // Use consistency engine for backend status display
    const displayData: BackendStatusDisplayData = {
      services,
      context: 'status-display',
      showHealthDetails: true,
      showResponseTimes: true,
      showCapabilities: true
    };

    try {
      // Apply consistency framework
      const consistencyResult = this.consistencyEngine.formatBackendStatusDisplay(displayData);
      
      // Set theme for skin compatibility
      const theme = this.terminalUI.getTheme();
      if (theme) {
        this.consistencyEngine.setTheme(theme);
      }
      
      // Display the consistently formatted content
      this.printLine(consistencyResult.formattedContent);
      
      // Display additional statistics with consistent formatting
      if (consistencyResult.serviceMetadata) {
        const { connectedCount, totalCount, healthyCount } = consistencyResult.serviceMetadata;
        const statusText = healthyCount > 0 ? 'Operational' : 'Discovery Mode';
        
        // Use theme functions if available
        if (theme && typeof theme.info === 'function' && typeof theme.success === 'function' && typeof theme.warning === 'function') {
          const statusDisplay = healthyCount > 0 ? theme.success(statusText) : theme.warning(statusText);
          this.printLine(theme.info(`Connected: ${connectedCount}/${totalCount} | Healthy: ${healthyCount}/${connectedCount} | Status: ${statusDisplay}`));
        } else {
          this.printLine(`Connected: ${connectedCount}/${totalCount} | Healthy: ${healthyCount}/${connectedCount} | Status: ${statusText}`);
        }
      }
      
      // Display recommendations if any
      if (consistencyResult.recommendations.length > 0) {
        this.printLine('\n💡 Recommendations:');
        consistencyResult.recommendations.forEach(rec => {
          this.printLine(`   ${rec}`);
        });
      }
      
      this.printLine();
      
    } catch (error) {
      this.logger.error('Consistency engine failed, using fallback display', this.normalizeError(error));
      
      // Fallback to basic display
      this.displayBackendStatusFallback(backendConnections);
    }
  }

  /**
   * Fallback backend status display when consistency engine fails
   * @private
   */
  private displayBackendStatusFallback(backendConnections: any): void {
    this.printLine('\n🌐 Backend Service Status (Fallback Display):');
    this.printLine('━'.repeat(60));
    
    Object.entries(backendConnections.backends).forEach(([serviceId, status]) => {
      const statusTyped = status as any;
      const icon = statusTyped.connected ? '🟢' : '🔴';
      const serviceColumn = this.formatColumn(serviceId, 20);
      const connectionState = this.formatColumn(statusTyped.connected ? 'Connected' : 'Disconnected', 12);
      const health = statusTyped.health || 'Unknown';
      this.printLine(`${icon} ${serviceColumn} ${connectionState} | ${health}`);
    });
    
    this.printLine('━'.repeat(60));
    this.printLine();
  }

  /**
   * Display keyboard shortcuts
   * @private
   */
  private displayKeyboardShortcuts(): void {
    if (this.keyboardShortcuts.size === 0) return;

    this.printLine('\n⌨️  Keyboard Shortcuts:');
    this.keyboardShortcuts.forEach((command, key) => {
      this.printLine(`  ${key} - ${command}`);
    });
    this.printLine();
  }

  /**
   * Display help information
   * @private
   */
  private displayHelp(): void {
    this.printLine('\n📚 Templum CLI Help (Abstraction Layer):');
    this.printLine('Commands:');
    this.printLine('  help     - Show this help message');
    this.printLine('  back     - Go to previous menu');
    this.printLine('  home     - Go to main menu');
    this.printLine('  refresh  - Refresh current view');
    this.printLine('  status   - Show backend service status');
    this.printLine('  load <id>- Load backend skin (e.g., load pcl, load minimal-example)');
    this.printLine('  quit     - Exit application');
    this.printLine('\nNavigation:');
    this.printLine('  1-9      - Select menu item by number');
    this.printLine('  command  - Execute any backend command');
    
    if (this.keyboardShortcuts.size > 0) {
      this.printLine('\nShortcuts:');
      this.keyboardShortcuts.forEach((command, key) => {
        this.printLine(`  ${key}       - ${command}`);
      });
    }
    
    this.printLine('\nBackend Integration:');
    if (this.orchestrator?.isInitialized()) {
      this.printLine('  ✅ Real backend integration active via orchestrator abstraction');
    } else {
      this.printLine('  ⚠️  Orchestrator not initialized');
    }
    this.printLine();
  }

  /**
   * Get fallback CLI output for initial content
   * @private
   */
  private getFallbackCLIOutput(backendConnections: any): string {
    const connectedCount = Object.values(backendConnections.backends).filter((b: any) => b.connected).length;
    const totalCount = Object.keys(backendConnections.backends).length;
    const healthyCount = Object.values(backendConnections.backends).filter((b: any) => b.health === 'healthy').length;
    
    return `
🌟 Templum Universal Interface - CLI Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ CLI Interface Adapter Active (Real Backend Integration)

Backend Status: Connected ${connectedCount}/${totalCount} | Healthy ${healthyCount}/${connectedCount}
System Status: ${healthyCount > 0 ? '🟢 Operational' : '🟡 Discovery Mode'}

${healthyCount === 0 ? 'Waiting for backend services to become available...' : 'Ready for command execution with real backend integration.'}

Type 'help' for available commands or 'status' for detailed backend information.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
  }

  /**
   * Get error CLI output for display
   * @private
   */
  private getErrorCLIOutput(error: string): string {
    return `
❌ CLI Interface Adapter - Real Backend Integration Error
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Error: ${error}
Timestamp: ${new Date().toISOString()}

🔧 Troubleshooting Real Backend Integration:
- Ensure Haruspex, PCL, or Litany services are running
- Check backend service accessibility on configured ports
- Verify backend endpoint configuration in Templum config
- Backend service discovery may be in progress
- System will use orchestrator fallback for functionality

Using abstraction layer with real backend integration.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
  }

  /**
   * Load a specific backend's skin definition manually
   * @private
   */
  private async loadSpecificBackendSkin(backendId: string): Promise<void> {
    if (!backendId) {
      this.printLine('❌ Please specify a backend ID (e.g., load pcl, load minimal-example)');
      return;
    }

    try {
      this.printLine(`🔄 Loading skin from backend: ${backendId}`);
      
      // Attempt to load the backend skin via orchestrator
      const skinDefinition = await this.orchestrator.loadBackendSkin(backendId);
      
      if (skinDefinition) {
        this.printLine(`✅ Successfully loaded skin: ${skinDefinition.name || backendId}`);
        this.printLine(`   Version: ${skinDefinition.version}`);
        this.printLine(`   ID: ${skinDefinition.id}`);
        
        // Refresh the CLI content to show the new skin
        await this.loadInitialContent();
        this.printLine(`📋 Interface updated with ${skinDefinition.name || backendId} skin definition`);
        
      } else {
        this.printLine(`❌ Could not load skin from backend: ${backendId}`);
        this.printLine('💡 Check if backend is running and accessible');
        
        // Show available backends
        await this.displayAvailableBackends();
      }
      
    } catch (error) {
      const normalizedError = this.normalizeError(error);
      this.logger.error('Failed to load skin from backend during manual load', normalizedError, {
        backendId
      });
      const errorMessage = normalizedError?.message ?? (error instanceof Error ? error.message : 'Unknown error');
      this.printLine(this.formatError(`❌ Failed to load skin from ${backendId}: ${errorMessage}`));
      this.printLine('💡 Use "status" command to check backend connectivity');
    }
  }

  /**
   * Display available backends for user reference  
   * @private
   */
  private async displayAvailableBackends(): Promise<void> {
    try {
      const systemStatus = this.orchestrator.getSystemStatus();
      const backends = systemStatus.coreEngine?.backendConnections?.backends || {};
      
      if (Object.keys(backends).length === 0) {
        this.printLine('📡 No backends currently connected');
        return;
      }
      
      this.printLine('\n📡 Available backends:');
      for (const [serviceId, status] of Object.entries(backends)) {
        const statusIcon = status.connected 
          ? (status.health === 'healthy' ? '🟢' : '🟡') 
          : '🔴';
        this.printLine(`  ${statusIcon} ${serviceId} - ${status.connected ? 'connected' : 'disconnected'}`);
      }
      this.printLine('\n💡 Try: load <backend-id>');
      
    } catch (_error) {
      this.printLine('⚠️ Failed to get backend status');
    }
  }
}

/**
 * CLI Adapter Configuration
 */
export interface CLIAdapterConfig {
  enableInteractiveMode: boolean;
  enableKeyboardShortcuts: boolean;
  enableColorOutput: boolean;
  enableProgressIndicators: boolean;
  clearScreenOnRender: boolean;
  maxHistorySize: number;
  inputTimeout?: number;
  terminalTheme: keyof typeof DefaultColorThemes;
  enableResponsiveLayout: boolean;
}

export type CLIAdapterInitializationOptions = Partial<CLIAdapterConfig> & {
  formatter?: TerminalFormatter;
  formatterCapabilities?: Partial<TerminalCapabilities>;
};

/**
 * Factory function for creating CLI interface adapter
 * 
 * This provides a clean creation pattern that doesn't require direct imports
 * of the concrete adapter class in other parts of the system.
 */
export function createCLIInterfaceAdapter(config?: CLIAdapterInitializationOptions): IInterfaceAdapter {
  return new CLIInterfaceAdapter(config);
}

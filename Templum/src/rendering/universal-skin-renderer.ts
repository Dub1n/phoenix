/**
 * Universal Skin Renderer
 * 
 * Extended from Phoenix Code Lite Skin Menu Renderer for multi-interface support.
 * Maintains full PCL compatibility while adding VSCode TreeView, WebView, and 
 * Command interface rendering capabilities.
 * 
 * Dependencies: Menu Registry, Session Context, Interface Adapters
 * Performance Target: Maintain PCL baseline performance with interface caching
 * 
 * Generated: 2025-08-21
 */

import { EventEmitter } from 'events';
import { UniversalLayoutEngine, UniversalSkinMenuDefinition, InterfaceType } from './universal-layout-engine';
import { UniversalMenuRegistry } from '../menus/universal-menu-registry';
import { SessionContextFoundation, SessionContext } from '../session/session-context-foundation';

// Extended interfaces for multi-interface support
export interface UniversalSkinContext extends SkinContext {
  interfaceType: InterfaceType;
  sessionId?: string;
  adapterConfig?: InterfaceAdapterConfig;
}

export interface SkinContext {
  skinId: string;
  level: string;
  parentMenu?: string;
  breadcrumb?: string[];
  terminalWidth?: number;
}

export interface InterfaceAdapterConfig {
  vscode?: VSCodeRenderConfig;
  cli?: CLIRenderConfig;
  command?: CommandRenderConfig;
}

export interface VSCodeRenderConfig {
  enableTreeView: boolean;
  enableWebView: boolean;
  enableStatusBar: boolean;
  treeViewRefreshInterval?: number;
  webViewRetainContext?: boolean;
}

export interface CLIRenderConfig {
  enableInteractiveMode: boolean;
  enableColorOutput: boolean;
  enableKeyboardShortcuts: boolean;
  clearScreenOnRender: boolean;
}

export interface CommandRenderConfig {
  outputFormat: 'text' | 'json' | 'table';
  verbosityLevel: 'minimal' | 'normal' | 'verbose';
  includeHeaders: boolean;
}

export interface UniversalMenuRenderResult extends MenuRenderResult {
  interfaceType: InterfaceType;
  interfaceSpecific?: any;
  sessionContext?: SessionContext;
  cacheKey?: string;
}

export interface MenuRenderResult {
  layout: any;
  skinDefinition: UniversalSkinMenuDefinition;
  context: UniversalSkinContext;
  renderTime: number;
  success: boolean;
  errors?: string[];
}

export interface UniversalSkinLoader extends SkinLoader {
  getSkinMenuDefinitionForInterface(
    skinId: string, 
    menuId: string, 
    interfaceType: InterfaceType
  ): UniversalSkinMenuDefinition | null;
  getInterfacePreferences(skinId: string, interfaceType: InterfaceType): InterfaceAdapterConfig;
  validateSkinForInterface(skinId: string, interfaceType: InterfaceType): boolean;
}

export interface SkinLoader {
  getSkinMenuDefinition(skinId: string, menuId: string): UniversalSkinMenuDefinition | null;
  getLayoutPreferences(skinId: string): any;
  getThemeDefinition(skinId: string): any;
  listAvailableSkins(): string[];
  validateSkinDefinition(skinId: string): boolean;
}

export interface SkinCacheEntry {
  renderResult: UniversalMenuRenderResult;
  timestamp: Date;
  interfaceType: InterfaceType;
  sessionId?: string;
}

/**
 * Universal Skin Renderer - Multi-Interface Enhancement of PCL Architecture
 * Extends PCL SkinMenuRenderer for VSCode, CLI, and Command interface support
 */
export class UniversalSkinRenderer extends EventEmitter {
  private layoutEngine: UniversalLayoutEngine;
  private menuRegistry: UniversalMenuRegistry;
  private sessionContext: SessionContextFoundation;
  private skinLoader?: UniversalSkinLoader;
  private defaultLayoutConstraints: any;
  private renderingMetrics = new Map<string, number>();
  private interfaceCache = new Map<string, SkinCacheEntry>();
  private maxCacheSize = 100;
  private cacheExpiryMs = 300000; // 5 minutes

  constructor(
    menuRegistry: UniversalMenuRegistry,
    sessionContext: SessionContextFoundation,
    options?: {
      skinLoader?: UniversalSkinLoader;
      defaultConstraints?: any;
      enableMetrics?: boolean;
      cacheConfig?: { maxSize?: number; expiryMs?: number };
    }
  ) {
    super();
    this.layoutEngine = new UniversalLayoutEngine();
    this.menuRegistry = menuRegistry;
    this.sessionContext = sessionContext;
    this.skinLoader = options?.skinLoader;
    
    this.defaultLayoutConstraints = {
      minHeight: 25,
      minWidth: 30,
      maxWidth: 100,
      textboxLines: 3,
      paddingLines: 2,
      enforceConsistentHeight: true,
      ...options?.defaultConstraints
    };

    if (options?.cacheConfig) {
      this.maxCacheSize = options.cacheConfig.maxSize || 100;
      this.cacheExpiryMs = options.cacheConfig.expiryMs || 300000;
    }

    this.setupEventHandlers();
  }

  /**
   * Primary rendering method for multi-interface support
   * Extends PCL renderMenu method with interface-specific rendering
   */
  async renderMenu(
    skinId: string,
    menuId: string,
    interfaceType: InterfaceType,
    context?: Partial<UniversalSkinContext>
  ): Promise<UniversalMenuRenderResult> {
    const startTime = performance.now();
    
    try {
      // Build complete context with session integration
      const fullContext = await this.buildUniversalContext(
        skinId,
        menuId,
        interfaceType,
        context
      );

      // Check cache first
      const cacheKey = this.generateCacheKey(skinId, menuId, interfaceType, fullContext.sessionId);
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        this.emit('cacheHit', cacheKey);
        return cached;
      }

      // Load menu definition (with interface-specific adaptations)
      const skinMenuDefinition = await this.loadMenuDefinitionForInterface(
        skinId,
        menuId,
        interfaceType
      );
      
      if (!skinMenuDefinition) {
        throw new Error(`Menu definition not found: ${skinId}:${menuId} for ${interfaceType}`);
      }

      // Get interface-specific layout constraints
      const layoutConstraints = this.getLayoutConstraintsForInterface(
        skinId,
        interfaceType
      );
      
      // Render using Universal Layout Engine
      const renderResult = await this.layoutEngine.renderForInterface(
        skinMenuDefinition,
        interfaceType,
        layoutConstraints
      );

      if (!renderResult.success) {
        throw new Error(`Layout engine rendering failed: ${renderResult.errors?.join(', ')}`);
      }

      const renderTime = performance.now() - startTime;
      this.recordMetrics(skinId, menuId, interfaceType, renderTime);
      
      const result: UniversalMenuRenderResult = {
        layout: renderResult.output,
        skinDefinition: skinMenuDefinition,
        context: fullContext,
        renderTime,
        success: true,
        interfaceType,
        interfaceSpecific: renderResult,
        sessionContext: fullContext.sessionId 
          ? (this.sessionContext.getSession(fullContext.sessionId) || undefined)
          : undefined,
        cacheKey
      };

      // Cache the result
      this.cacheResult(cacheKey, result);
      
      this.emit('menuRendered', result);
      return result;
      
    } catch (error) {
      const renderTime = performance.now() - startTime;
      
      const errorResult: UniversalMenuRenderResult = {
        layout: {},
        skinDefinition: {} as UniversalSkinMenuDefinition,
        context: { skinId, level: menuId, interfaceType },
        renderTime,
        success: false,
        interfaceType,
        errors: [error instanceof Error ? error.message : 'Unknown render error']
      };

      this.emit('menuRenderError', errorResult);
      return errorResult;
    }
  }

  /**
   * Render legacy menu with multi-interface support
   * Maintains PCL compatibility while extending for multiple interfaces
   */
  async renderLegacyMenu(
    content: any,
    context: any,
    interfaceType: InterfaceType = 'cli',
    skinId = 'legacy'
  ): Promise<UniversalMenuRenderResult> {
    const startTime = performance.now();
    
    try {
      // Convert legacy format to UniversalSkinMenuDefinition
      const skinDefinition = this.convertLegacyToUniversal(content, context, interfaceType);
      
      // Render using Universal Layout Engine
      const renderResult = await this.layoutEngine.renderForInterface(
        skinDefinition,
        interfaceType,
        this.defaultLayoutConstraints
      );

      const renderTime = performance.now() - startTime;
      this.recordMetrics(skinId, context.level, interfaceType, renderTime);
      
      const result: UniversalMenuRenderResult = {
        layout: renderResult.output,
        skinDefinition,
        context: { 
          skinId, 
          level: context.level, 
          interfaceType,
          ...context 
        },
        renderTime,
        success: renderResult.success,
        interfaceType,
        interfaceSpecific: renderResult,
        errors: renderResult.errors
      };

      this.emit('legacyMenuRendered', result);
      return result;
      
    } catch (error) {
      const renderTime = performance.now() - startTime;
      
      return {
        layout: {},
        skinDefinition: {} as UniversalSkinMenuDefinition,
        context: { skinId, level: context.level, interfaceType },
        renderTime,
        success: false,
        interfaceType,
        errors: [error instanceof Error ? error.message : 'Legacy render error']
      };
    }
  }

  /**
   * Batch render for multiple interfaces simultaneously
   * Useful for cross-interface testing and validation
   */
  async renderForAllInterfaces(
    skinId: string,
    menuId: string,
    context?: Partial<UniversalSkinContext>
  ): Promise<Record<InterfaceType, UniversalMenuRenderResult>> {
    const interfaces: InterfaceType[] = ['vscode', 'cli', 'command'];
    const results: Record<string, UniversalMenuRenderResult> = {};

    const renderPromises = interfaces.map(async (interfaceType) => {
      const result = await this.renderMenu(skinId, menuId, interfaceType, context);
      return { interfaceType, result };
    });

    const completedRenders = await Promise.all(renderPromises);
    
    for (const { interfaceType, result } of completedRenders) {
      results[interfaceType] = result;
    }

    this.emit('batchRenderCompleted', results);
    return results as Record<InterfaceType, UniversalMenuRenderResult>;
  }

  /**
   * Preview layout for specific interface without rendering
   * Extended from PCL previewLayout with interface support
   */
  async previewLayoutForInterface(
    skinId: string,
    menuId: string,
    interfaceType: InterfaceType,
    constraints?: any
  ): Promise<any | null> {
    const skinDefinition = await this.loadMenuDefinitionForInterface(
      skinId,
      menuId,
      interfaceType
    );
    
    if (!skinDefinition) return null;
    
    const layoutConstraints = {
      ...this.getLayoutConstraintsForInterface(skinId, interfaceType),
      ...constraints
    };
    
    // Use layout engine's calculation without rendering
    return await this.layoutEngine.renderForInterface(
      skinDefinition,
      interfaceType,
      layoutConstraints
    );
  }

  /**
   * Clear interface-specific cache
   */
  clearCacheForInterface(interfaceType?: InterfaceType): number {
    let cleared = 0;
    
    if (interfaceType) {
      for (const [key, entry] of this.interfaceCache) {
        if (entry.interfaceType === interfaceType) {
          this.interfaceCache.delete(key);
          cleared++;
        }
      }
    } else {
      cleared = this.interfaceCache.size;
      this.interfaceCache.clear();
    }

    this.emit('cacheCleared', interfaceType, cleared);
    return cleared;
  }

  /**
   * Get rendering metrics with interface breakdown
   */
  getMetricsWithInterfaceBreakdown(): Record<string, any> {
    const metrics: Record<string, any> = {
      total: Object.fromEntries(this.renderingMetrics),
      byInterface: {} as Record<InterfaceType, Record<string, number>>
    };

    // Group metrics by interface
    for (const [key, value] of this.renderingMetrics) {
      const parts = key.split(':');
      if (parts.length >= 3) {
        const interfaceType = parts[2] as InterfaceType;
        const metricKey = `${parts[0]}:${parts[1]}`;
        
        if (!metrics.byInterface[interfaceType]) {
          metrics.byInterface[interfaceType] = {};
        }
        metrics.byInterface[interfaceType][metricKey] = value;
      }
    }

    return metrics;
  }

  /**
   * Update default constraints for specific interface
   */
  updateDefaultConstraintsForInterface(
    interfaceType: InterfaceType,
    constraints: any
  ): void {
    if (!this.defaultLayoutConstraints.interfaceSpecific) {
      this.defaultLayoutConstraints.interfaceSpecific = {};
    }
    
    this.defaultLayoutConstraints.interfaceSpecific[interfaceType] = {
      ...this.defaultLayoutConstraints.interfaceSpecific[interfaceType],
      ...constraints
    };

    this.emit('constraintsUpdated', interfaceType, constraints);
  }

  // Private implementation methods
  private async buildUniversalContext(
    skinId: string,
    menuId: string,
    interfaceType: InterfaceType,
    context?: Partial<UniversalSkinContext>
  ): Promise<UniversalSkinContext> {
    // Get current session or create temporary one
    let sessionId = context?.sessionId;
    let sessionContext = sessionId ? this.sessionContext.getSession(sessionId) : null;
    
    if (!sessionContext) {
      sessionContext = this.sessionContext.getActiveSession();
      sessionId = sessionContext?.sessionId;
    }

    return {
      skinId,
      level: menuId,
      interfaceType,
      sessionId,
      adapterConfig: this.getAdapterConfigForInterface(interfaceType),
      ...context
    };
  }

  private async loadMenuDefinitionForInterface(
    skinId: string,
    menuId: string,
    interfaceType: InterfaceType
  ): Promise<UniversalSkinMenuDefinition | null> {
    // Use Universal Skin Loader if available
    if (this.skinLoader) {
      return this.skinLoader.getSkinMenuDefinitionForInterface(skinId, menuId, interfaceType);
    }
    
    // Try to get from menu registry
    try {
      const menu = await this.menuRegistry.getMenu(menuId, interfaceType);
      return this.adaptMenuForInterface(menu, interfaceType);
    } catch (_error) {
      // Fallback to built-in definitions
      return this.getBuiltInMenuDefinitionForInterface(skinId, menuId, interfaceType);
    }
  }

  private adaptMenuForInterface(
    menu: any,
    interfaceType: InterfaceType
  ): UniversalSkinMenuDefinition {
    const baseDefinition: UniversalSkinMenuDefinition = {
      title: menu.title,
      subtitle: menu.subtitle,
      items: this.convertMenuSectionsToItems(menu.sections || []),
      interfaces: [interfaceType]
    };

    // Add interface-specific adaptations
    switch (interfaceType) {
      case 'vscode':
        baseDefinition.interfaceConfig = {
          vscode: {
            treeViewProvider: true,
            webViewPanel: true,
            commandPalette: true,
            statusBar: true
          }
        };
        break;

      case 'cli':
        baseDefinition.interfaceConfig = {
          cli: {
            interactive: true,
            colorEnabled: true,
            keyboardShortcuts: true,
            clearScreen: true
          }
        };
        break;

      case 'command':
        baseDefinition.interfaceConfig = {
          command: {
            directExecution: true,
            outputFormat: 'text',
            verbosityLevel: 'normal'
          }
        };
        break;
    }

    return baseDefinition;
  }

  private convertMenuSectionsToItems(sections: any[]): any[] {
    const items: any[] = [];
    
    for (const section of sections) {
      for (const item of section.items || []) {
        items.push({
          id: item.id,
          label: item.label,
          description: item.description,
          type: item.action?.type || 'command',
          command: item.action?.target
        });
      }
    }
    
    return items;
  }

  private convertLegacyToUniversal(
    content: any,
    context: any,
    interfaceType: InterfaceType
  ): UniversalSkinMenuDefinition {
    // Convert legacy menu content to Universal format
    return {
      title: content.title || context.level,
      subtitle: content.subtitle,
      items: content.items || [],
      interfaces: [interfaceType]
    };
  }

  private getLayoutConstraintsForInterface(
    skinId: string,
    interfaceType: InterfaceType
  ): any {
    let constraints = { ...this.defaultLayoutConstraints };
    
    if (this.skinLoader) {
      const interfacePreferences = this.skinLoader.getInterfacePreferences(skinId, interfaceType);
      constraints = { ...constraints, ...interfacePreferences };
    }

    // Add interface-specific defaults
    constraints.interfaceType = interfaceType;
    constraints.interfaceSpecific = constraints.interfaceSpecific || {};
    
    switch (interfaceType) {
      case 'vscode':
        constraints.interfaceSpecific.vscode = {
          treeDepth: 3,
          iconSize: 'medium',
          compactMode: false,
          ...constraints.interfaceSpecific.vscode
        };
        break;

      case 'cli':
        constraints.interfaceSpecific.cli = {
          interactive: true,
          colorDepth: 8,
          unicodeSupport: true,
          ...constraints.interfaceSpecific.cli
        };
        break;

      case 'command':
        constraints.interfaceSpecific.command = {
          outputFormat: 'text',
          verbosityLevel: 'normal',
          includeHeaders: true,
          ...constraints.interfaceSpecific.command
        };
        break;
    }

    return constraints;
  }

  private getAdapterConfigForInterface(interfaceType: InterfaceType): InterfaceAdapterConfig {
    const config: InterfaceAdapterConfig = {};

    switch (interfaceType) {
      case 'vscode':
        config.vscode = {
          enableTreeView: true,
          enableWebView: true,
          enableStatusBar: true,
          treeViewRefreshInterval: 5000,
          webViewRetainContext: true
        };
        break;

      case 'cli':
        config.cli = {
          enableInteractiveMode: true,
          enableColorOutput: true,
          enableKeyboardShortcuts: true,
          clearScreenOnRender: true
        };
        break;

      case 'command':
        config.command = {
          outputFormat: 'text',
          verbosityLevel: 'normal',
          includeHeaders: true
        };
        break;
    }

    return config;
  }

  private getBuiltInMenuDefinitionForInterface(
    skinId: string,
    menuId: string,
    _interfaceType: InterfaceType
  ): UniversalSkinMenuDefinition | null {
    // Extended built-in definitions with interface support
    const definitions: Record<string, Record<string, UniversalSkinMenuDefinition>> = {
      'templum-universal': {
        main: {
          title: 'Templum Universal Interface',
          subtitle: 'Multi-backend interface orchestration',
          items: [
            {
              id: 'backends',
              label: 'Backend Services',
              description: 'Manage connected backend services',
              type: 'submenu',
              command: 'templum.backends'
            },
            {
              id: 'interfaces',
              label: 'Interface Management',
              description: 'Configure interface adapters',
              type: 'submenu',
              command: 'templum.interfaces'
            },
            {
              id: 'sessions',
              label: 'Session Management',
              description: 'View and manage active sessions',
              type: 'command',
              command: 'templum.sessions'
            }
          ],
          interfaces: ['vscode', 'cli', 'command'],
          theme: {
            primaryColor: 'cyan',
            accentColor: 'blue',
            separatorChar: '═',
            useIcons: true
          }
        }
      }
    };

    return definitions[skinId]?.[menuId] || null;
  }

  private generateCacheKey(
    skinId: string,
    menuId: string,
    interfaceType: InterfaceType,
    sessionId?: string
  ): string {
    return `${skinId}:${menuId}:${interfaceType}:${sessionId || 'default'}`;
  }

  private getCachedResult(cacheKey: string): UniversalMenuRenderResult | null {
    const cached = this.interfaceCache.get(cacheKey);
    
    if (!cached) return null;
    
    // Check if cache entry has expired
    const now = new Date();
    if (now.getTime() - cached.timestamp.getTime() > this.cacheExpiryMs) {
      this.interfaceCache.delete(cacheKey);
      return null;
    }

    return cached.renderResult;
  }

  private cacheResult(cacheKey: string, result: UniversalMenuRenderResult): void {
    // Clean up expired entries if cache is getting full
    if (this.interfaceCache.size >= this.maxCacheSize) {
      this.cleanupExpiredCacheEntries();
    }

    this.interfaceCache.set(cacheKey, {
      renderResult: result,
      timestamp: new Date(),
      interfaceType: result.interfaceType,
      sessionId: result.sessionContext?.sessionId
    });
  }

  private cleanupExpiredCacheEntries(): void {
    const now = new Date();
    const expired: string[] = [];
    
    for (const [key, entry] of this.interfaceCache) {
      if (now.getTime() - entry.timestamp.getTime() > this.cacheExpiryMs) {
        expired.push(key);
      }
    }

    for (const key of expired) {
      this.interfaceCache.delete(key);
    }

    this.emit('cacheCleanup', expired.length);
  }

  private recordMetrics(
    skinId: string,
    menuId: string,
    interfaceType: InterfaceType,
    renderTime: number
  ): void {
    const key = `${skinId}:${menuId}:${interfaceType}`;
    this.renderingMetrics.set(key, renderTime);
    
    // Warn if performance exceeds PCL baseline
    if (renderTime > 100) {
      console.warn(`Skin rendering exceeded 100ms baseline: ${renderTime}ms for ${key}`);
    }
  }

  private setupEventHandlers(): void {
    // Listen for menu registry changes
    this.menuRegistry.on('menusLoaded', (_sources) => {
      this.clearCacheForInterface(); // Clear all cache on menu updates
    });

    // Listen for session changes
    this.sessionContext.on('activeSessionChanged', (sessionId) => {
      this.emit('sessionChanged', sessionId);
    });

    // Performance monitoring
    this.on('menuRendered', (result) => {
      if (result.renderTime > 100) {
        this.emit('performanceWarning', {
          skinId: result.context.skinId,
          menuId: result.context.level,
          interfaceType: result.interfaceType,
          renderTime: result.renderTime,
          threshold: 100
        });
      }
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.interfaceCache.clear();
    this.renderingMetrics.clear();
    this.removeAllListeners();
  }
}
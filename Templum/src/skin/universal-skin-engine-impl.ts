/**---
 * title: [Universal Skin Engine - Phase 5 Implementation]
 * tags: [Skin-Engine, Universal-Rendering, Multi-Interface, Performance-Optimized]
 * provides: [Cross-Interface Rendering, State Management, Performance Optimization, Cache Management]
 * requires: [Universal Skin Types, Interface Adapters, Performance Monitoring]
 * description: [Phase 5 Universal Skin Engine implementation with performance targets and multi-backend support]
 * ---*/

import { EventEmitter } from 'events';
import { 
  UniversalSkinDefinition, 
  SkinRenderResult, 
  RenderingContext, 
  InterfaceType,
  RenderedComponent 
} from '../types/universal-skin-engine-types';

export class UniversalSkinEngine extends EventEmitter {
  private skins: Map<string, UniversalSkinDefinition> = new Map();
  private renderCache: Map<string, SkinRenderResult> = new Map();
  private interfaceStates: Map<string, any> = new Map();
  private config = {
    maxCacheSize: 100,
    cacheTimeout: 300000 // 5 minutes
  };

  constructor() {
    super();
  }

  /**
   * Register a universal skin definition
   */
  async registerSkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    this.skins.set(skinDefinition.metadata.id, skinDefinition);
    this.emit('skinRegistered', {
      skinId: skinDefinition.metadata.id,
      name: skinDefinition.metadata.name,
      supportedInterfaces: skinDefinition.metadata.targetInterfaces,
      timestamp: Date.now()
    });
  }

  /**
   * Render skin for specific interface with context
   */
  async renderForInterface(
    skin: UniversalSkinDefinition,
    interfaceType: string,
    context: RenderingContext
  ): Promise<SkinRenderResult> {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(skin.metadata.id, interfaceType, context.theme);
      
      // Check cache first
      if (this.renderCache.has(cacheKey)) {
        const cachedResult = this.renderCache.get(cacheKey)!;
        cachedResult.performance.cacheHit = true;
        return cachedResult;
      }
      
      // Create rendered components based on interface type
      const components: RenderedComponent[] = [];
      
      if (interfaceType === 'vscode' && skin.views?.treeViews) {
        skin.views.treeViews.forEach(treeView => {
          components.push({
            id: treeView.id,
            type: 'treeView',
            backend: skin.metadata.backendService,
            content: treeView
          });
        });
      }
      
      if (interfaceType === 'cli' && skin.menus?.main) {
        components.push({
          id: skin.menus.main.id,
          type: 'menu',
          backend: skin.metadata.backendService,
          content: skin.menus.main
        });
      }
      
      if (interfaceType === 'command' && skin.commands?.primary) {
        skin.commands.primary.forEach(command => {
          components.push({
            id: command.id,
            type: 'command',
            backend: skin.metadata.backendService,
            content: command
          });
        });
      }
      
      const renderTime = Date.now() - startTime;
      
      const result: SkinRenderResult = {
        success: true,
        interface: interfaceType,
        metadata: {
          skinId: skin.metadata.id,
          backendService: skin.metadata.backendService
        },
        components,
        performance: {
          renderTime,
          outputSize: JSON.stringify(components).length,
          cacheHit: false
        },
        customization: {
          analysisMode: context.preferences?.analysisMode || 'standard'
        },
        inheritance: {
          parentSkin: skin.metadata.parentSkin,
          applied: !!skin.metadata.parentSkin
        }
      };
      
      // Cache the result
      this.renderCache.set(cacheKey, result);
      this.maintainCacheSize();
      
      return result;
      
    } catch (error) {
      return {
        success: false,
        interface: interfaceType,
        metadata: {
          skinId: skin.metadata.id,
          backendService: skin.metadata.backendService
        },
        components: [],
        performance: {
          renderTime: Date.now() - startTime,
          outputSize: 0,
          cacheHit: false
        },
        customization: {},
        inheritance: {
          parentSkin: skin.metadata.parentSkin,
          applied: false
        }
      };
    }
  }

  /**
   * Switch between interfaces with optional state preservation
   */
  async switchInterface(
    fromInterface: string,
    toInterface: string,
    preserveState: boolean = false
  ): Promise<{ success: boolean; preservedState: boolean; switchTime?: number }> {
    const startTime = Date.now();
    
    try {
      if (preserveState) {
        // Get state from source interface
        const sourceState = this.interfaceStates.get(fromInterface);
        if (sourceState) {
          // Copy state to target interface
          this.interfaceStates.set(toInterface, { ...sourceState });
        }
      }
      
      const switchTime = Date.now() - startTime;
      
      return {
        success: true,
        preservedState: preserveState,
        switchTime
      };
    } catch (error) {
      return {
        success: false,
        preservedState: false,
        switchTime: Date.now() - startTime
      };
    }
  }

  /**
   * Set state for specific interface and synchronize to other interfaces
   */
  async setState(interfaceType: string, state: any): Promise<void> {
    this.interfaceStates.set(interfaceType, state);
    
    // Synchronize state to other interfaces (simplified synchronization)
    const otherInterfaces = ['vscode', 'cli', 'command'].filter(iface => iface !== interfaceType);
    for (const otherInterface of otherInterfaces) {
      this.interfaceStates.set(otherInterface, { ...state });
    }
  }

  /**
   * Get state for specific interface
   */
  async getState(interfaceType: string): Promise<any> {
    return this.interfaceStates.get(interfaceType) || {};
  }

  /**
   * Cleanup engine resources
   */
  async cleanup(): Promise<void> {
    this.renderCache.clear();
    this.interfaceStates.clear();
    this.skins.clear();
  }

  /**
   * Generate cache key for render results
   */
  private generateCacheKey(skinId: string, interfaceType: string, theme: string): string {
    return `${skinId}-${interfaceType}-${theme}`;
  }

  /**
   * Maintain cache size within limits
   */
  private maintainCacheSize(): void {
    if (this.renderCache.size > this.config.maxCacheSize) {
      // Remove oldest entries (simple LRU)
      const entries = Array.from(this.renderCache.entries());
      entries.sort((a, b) => a[1].performance.renderTime - b[1].performance.renderTime);
      
      const toRemove = entries.slice(0, this.renderCache.size - this.config.maxCacheSize);
      toRemove.forEach(([key]) => this.renderCache.delete(key));
    }
  }
}
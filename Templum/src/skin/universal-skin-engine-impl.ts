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

  RenderedComponent 
} from '../types/universal-skin-engine-types';
import {
  isTemplumError,
  createTemplumError,
  UniversalSkinDefinition as _TemplumSkinDefinition
} from '../types/templum-types';
import { SkinVersionManager } from './skin-version-manager';
import { serialization } from '../utils/serialization-utils';
import { emitSerializationWarnings } from '../backend/backend-serialization-log';
import { validateSkinDefinition } from '../validation/skin-validator';
import type { SkinValidationResult } from '../validation/skin-validator';

export class UniversalSkinEngine extends EventEmitter {
  private skins: Map<string, UniversalSkinDefinition> = new Map();
  private renderCache: Map<string, SkinRenderResult> = new Map();
  private interfaceStates: Map<string, any> = new Map();
  private versionManager: SkinVersionManager;
  private config = {
    maxCacheSize: 100,
    cacheTimeout: 300000 // 5 minutes
  };

  constructor() {
    super();
    this.versionManager = new SkinVersionManager();
  }

  /**
   * Register a universal skin definition with comprehensive validation
   */
  async registerSkin(skinDefinition: UniversalSkinDefinition): Promise<void> {
    const skinId = skinDefinition.id ?? skinDefinition.metadata?.id ?? 'unknown-skin';
    let schemaValidation: SkinValidationResult | undefined;

    try {
      schemaValidation = validateSkinDefinition(skinDefinition, {
        expectedValidatorVersion: this.versionManager.getValidatorVersion()
      });

      if (!schemaValidation.valid) {
        const errorMessage = schemaValidation.errors.length > 0
          ? schemaValidation.errors.join('; ')
          : 'Schema validation failed';
        throw createTemplumError(
          `Skin validation failed: ${errorMessage}`,
          'skin-validation-error',
          'validation'
        );
      }

      if (!skinDefinition.id) {
        throw createTemplumError('Skin ID missing after schema validation', 'missing-id', 'validation');
      }
      if (!skinDefinition.version) {
        throw createTemplumError('Skin version missing after schema validation', 'missing-version', 'validation');
      }

      // Step 2: Version compatibility validation
      const compatibilityResult = await this.versionManager.validateCompatibility(skinDefinition);
      if (!compatibilityResult.compatible) {
        throw createTemplumError(
          `Version compatibility failed: ${compatibilityResult.issues.join(', ')}`,
          'version-compatibility-error', 
          'validation'
        );
      }

      // Step 3: Check for version conflicts with existing skins
      const existingSkin = this.skins.get(skinDefinition.id);
      if (existingSkin) {
        const conflicts = this.versionManager.detectConflicts(existingSkin, skinDefinition);
        if (conflicts.length > 0 && conflicts.some(c => !c.canAutoResolve)) {
          throw createTemplumError(
            `Version conflict detected: ${conflicts.map(c => `${c.conflictType} conflict between ${c.existingVersion} and ${c.conflictingVersion}`).join(', ')}`,
            'version-conflict-error',
            'validation'
          );
        }
        
        // Auto-resolve conflicts if possible
        if (conflicts.length > 0 && conflicts.every(c => c.canAutoResolve)) {
          const resolution = await this.versionManager.resolveConflicts(conflicts, 'last-writer-wins');
          if (!resolution.overallSuccess) {
            throw createTemplumError(
              'Failed to resolve version conflicts automatically',
              'conflict-resolution-error',
              'validation'
            );
          }
        }
      }

      // Step 4: Register version tracking
      const parsedVersion = this.versionManager.parseVersion(skinDefinition.version);
      this.versionManager.registerSkinVersion(skinDefinition.id, parsedVersion);

      // Step 5: Store validated skin and emit success event
      this.skins.set(skinDefinition.id, skinDefinition);
      this.emit('skinRegistered', {
        skinId: skinDefinition.id,
        name: skinDefinition.name,
        version: skinDefinition.version,
        supportedInterfaces: skinDefinition.metadata?.supportedInterfaces || [],
        compatibilityLevel: compatibilityResult.level,
        schemaVersion: schemaValidation.schemaVersion,
        validationWarnings: schemaValidation.warnings || [],
        timestamp: Date.now()
      });
      
      // Emit warnings if present
      if (schemaValidation.warnings && schemaValidation.warnings.length > 0) {
        this.emit('skinValidationWarnings', {
          skinId: skinDefinition.id,
          warnings: schemaValidation.warnings,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      const templumError = isTemplumError(error)
        ? error
        : createTemplumError(`Registration failed: ${error}`, 'registration-error', 'runtime');

      this.emit('skinRegistrationFailed', {
        skinId,
        error: templumError,
        validationErrors: schemaValidation?.errors || [],
        timestamp: Date.now()
      });

      throw templumError;
    }
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
      // Generate cache key with null safety
      const cacheKey = this.generateCacheKey(skin.id, interfaceType, context.theme);
      
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
          id: skin.menus.main.id || 'main-menu',
          type: 'menu',
          backend: skin.metadata.backendService,
          content: skin.menus.main
        });
      }
      
      if (interfaceType === 'command' && skin.commands?.primary) {
        skin.commands.primary.forEach(command => {
          components.push({
            id: command.id || `command-${Math.random().toString(36).substr(2, 9)}`,
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
          skinId: skin.id,
          backendService: skin.metadata?.backendService || 'default'
        },
        components,
        performance: {
          renderTime,
          outputSize: this.computeSerializedBytes(
            components,
            'skin:universal-skin-engine-impl:component-output'
          ),
          cacheHit: false
        },
        customization: {
          analysisMode: context.preferences?.analysisMode || 'standard'
        },
        inheritance: {
          parentSkin: skin.metadata?.parentSkin,
          applied: !!skin.metadata?.parentSkin
        }
      };
      
      // Cache the result
      this.renderCache.set(cacheKey, result);
      this.maintainCacheSize();
      
      return result;
      
    } catch (_error) {
      return {
        success: false,
        interface: interfaceType,
        metadata: {
          skinId: skin.id,
          backendService: skin.metadata?.backendService || 'default'
        },
        components: [],
        performance: {
          renderTime: Date.now() - startTime,
          outputSize: 0,
          cacheHit: false
        },
        customization: {},
        inheritance: {
          parentSkin: skin.metadata?.parentSkin,
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
    } catch (_error) {
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

  private computeSerializedBytes(value: unknown, context: string): number {
    const builder = serialization.json(value).context(context).fallback('{}');
    const outcome = builder.stringify();
    emitSerializationWarnings(context, outcome);
    return outcome.meta.bytes;
  }
}

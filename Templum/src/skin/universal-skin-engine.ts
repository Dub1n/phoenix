/**---
 * title: [Universal Skin Engine - PCL-Skins Integration Orchestrator]
 * tags: [Skin-Engine, PCL-Skins, Universal-Rendering, Theme-Consistency, Multi-Backend]
 * provides: [Skin Inheritance, Theme Management, Cross-Interface Rendering, PCL Pattern Integration]
 * requires: [PCL-Skins Architecture, Interface Adapters, Theme Assets, Rendering Engines]
 * description: [Universal skin engine leveraging PCL-Skins architecture for 70% reuse potential with theme consistency]
 * ---*/

import { EventEmitter } from 'events';
import { 
  UniversalSkinDefinition, 
  SkinRenderResult, 
  RenderingContext, 
  InterfaceType,
  RenderedComponent,
  ThemeDefinition,
  ColorPalette,
  ColorScale,
  Typography,
  SpacingSystem,
  BorderSystem,
  ShadowSystem,
  AnimationSystem,
  ComponentSkin,
  ComponentVariant,
  ComponentState,
  ResponsiveConfig,
  AccessibilityConfig,
  SkinAssets,
  IconDefinition,
  ImageDefinition,
  FontDefinition,
  SoundDefinition,
  RenderingConfiguration,
  InterfaceRenderingConfig,
  SkinPerformanceConfig,
  SkinOverride,
  // Version management types
  ISkinVersionManager,
  SkinRegistrationRequest,
  SkinRegistrationResult,
  SkinVersionQuery,
  VersionConflict,
  ConflictResolutionStrategy
} from '../types/universal-skin-engine-types';
import {
  TemplumError,
  isTemplumError,
  createTemplumError,
  Signals,
  ErrorSignalPayload,
  MetricsSignalPayload
} from '../types/templum-types';

// Import PCL Rendering Adapter for 70% code reuse
import { 
  PCLRenderingAdapter, 
  UniversalMenuDefinition,
  UniversalLayoutConstraints,
  UniversalRenderResult
} from './pcl-rendering-adapter';

// Import Skin Version Manager
import { SkinVersionManager } from './skin-version-manager';

// All type definitions imported from types files - removing duplicates

// ThemeDefinition now imported from types file

// ColorPalette now imported from types file

// ColorScale now imported from types file

// Typography now imported from types file

// SpacingSystem now imported from types file

// BorderSystem now imported from types file

// ShadowSystem now imported from types file

// AnimationSystem now imported from types file

// ComponentSkin now imported from types file

// ComponentVariant now imported from types file

// ComponentState now imported from types file

// ResponsiveConfig now imported from types file

// AccessibilityConfig now imported from types file

// SkinAssets, IconDefinition, ImageDefinition, FontDefinition, SoundDefinition now imported from types file

// RenderingConfiguration now imported from types file

// InterfaceRenderingConfig now imported from types file

// SkinPerformanceConfig now imported from types file

// SkinOverride now imported from types file

// SkinRenderResult now imported from types file - removing duplicate definition

// Keeping SkinEngineStats as it's specific to the engine implementation
export interface SkinEngineStats {
  totalSkins: number;
  activeThemes: number;
  renderingEngines: Record<string, number>;
  performanceMetrics: {
    avgRenderTime: number;
    cacheHitRate: number;
    totalOutputSize: number;
  };
  pclIntegration: {
    skinsWithPCLSupport: number;
    avgReusePercentage: number;
    optimizationOpportunities: number;
  };
  interfaceSupport: Record<string, {
    supportedSkins: number;
    avgLoadTime: number;
    successRate: number;
  }>;
}

export class UniversalSkinEngine extends EventEmitter {
  private skins: Map<string, UniversalSkinDefinition> = new Map();
  private skinVersions: Map<string, Map<string, UniversalSkinDefinition>> = new Map(); // skinId -> version -> skin
  private activeThemes: Map<string, string> = new Map(); // interface -> theme
  private renderCache: Map<string, SkinRenderResult> = new Map();
  private interfaceStates: Map<string, any> = new Map(); // interface -> state
  private renderingEngines: Map<string, any> = new Map();
  private interfaceAdapters: Map<string, any> = new Map();
  private pclRenderingAdapter: PCLRenderingAdapter;
  private versionManager: ISkinVersionManager;
  private config: {
    cacheTimeout: number;
    maxCacheSize: number;
    defaultTheme: string;
    performanceMode: 'development' | 'production';
    systemVersion: string;
  };

  constructor(systemVersion?: string) {
    super();
    this.config = {
      cacheTimeout: 300000, // 5 minutes
      maxCacheSize: 100, // 100 rendered skins
      defaultTheme: 'default-light',
      performanceMode: 'production',
      systemVersion: systemVersion || '1.0.0'
    };
    this.pclRenderingAdapter = new PCLRenderingAdapter();
    this.versionManager = new SkinVersionManager(this.config.systemVersion);
    this.initializePCLSkinIntegration();
    this.initializeDefaultSkins();
  }

  /**
   * Register universal skin with version management and PCL-Skins integration
   */
  async registerSkin(
    skinDefinition: UniversalSkinDefinition, 
    options?: { 
      overrideExisting?: boolean; 
      preferredResolution?: ConflictResolutionStrategy;
      validateCompatibility?: boolean 
    }
  ): Promise<SkinRegistrationResult> {
    try {
      // Create registration request
      const request: SkinRegistrationRequest = {
        skin: skinDefinition,
        overrideExisting: options?.overrideExisting || false,
        preferredResolution: options?.preferredResolution || 'last-writer-wins',
        validateCompatibility: options?.validateCompatibility !== false // Default to true
      };

      return await this.registerSkinWithVersioning(request);
    } catch (error) {
      if (isTemplumError(error)) {
        throw error;
      }
      throw createTemplumError(`Failed to register skin ${skinDefinition.id}: ${error}`, 'skin-registration-error', 'validation');
    }
  }

  /**
   * Version-aware skin registration with comprehensive conflict detection
   */
  async registerSkinWithVersioning(request: SkinRegistrationRequest): Promise<SkinRegistrationResult> {
    const { skin } = request;
    const result: SkinRegistrationResult = {
      success: false,
      skinId: skin.id,
      version: skin.version,
      action: 'rejected',
      conflicts: [],
      migrations: [],
      warnings: [],
      errors: []
    };

    try {
      // 1. Validate skin definition (including version compatibility)
      const validation = await this.validateSkinDefinitionWithVersioning(skin);
      if (!validation.valid) {
        result.errors = validation.errors;
        return result;
      }

      // 2. Check for existing versions and conflicts
      const existingVersions = this.skinVersions.get(skin.id);
      const conflicts: VersionConflict[] = [];
      
      if (existingVersions) {
        for (const [existingVersion, existingSkin] of Array.from(existingVersions)) {
          const detected = this.versionManager.detectConflicts(existingSkin, skin);
          conflicts.push(...detected);
        }
      }

      result.conflicts = conflicts;

      // 3. Handle conflicts if any exist
      if (conflicts.length > 0) {
        const resolution = await this.versionManager.resolveConflicts(
          conflicts, 
          request.preferredResolution || 'last-writer-wins'
        );

        if (!resolution.overallSuccess && !request.overrideExisting) {
          result.errors?.push('Version conflicts detected and could not be auto-resolved');
          return result;
        }
      }

      // 4. Apply migrations if needed
      const migrations: Array<{ strategy: any; applied: boolean; duration?: number }> = [];
      if (existingVersions && existingVersions.size > 0) {
        for (const [existingVersion, existingSkin] of Array.from(existingVersions)) {
          const migrationStrategy = this.versionManager.findMigrationStrategy(
            existingVersion, 
            skin.version
          );
          
          if (migrationStrategy) {
            const migrationResult = await this.versionManager.applyMigration(skin, migrationStrategy);
            migrations.push({
              strategy: migrationStrategy,
              applied: migrationResult.migrated,
              duration: migrationResult.duration
            });

            if (migrationResult.migrated && migrationResult.result) {
              // Use migrated skin for registration
              request.skin = migrationResult.result;
            }
          }
        }
      }

      result.migrations = migrations;

      // 5. Optimize skin with PCL patterns
      const optimizedSkin = await this.optimizeWithPCLPatterns(request.skin);
      
      // 6. Setup inheritance chain
      await this.setupSkinInheritance(optimizedSkin);
      
      // 7. Prepare rendering configurations for each supported interface
      await this.prepareInterfaceConfigurations(optimizedSkin);

      // 8. Register skin in version storage
      await this.storeSkinVersion(optimizedSkin);

      // 9. Update caches and indexes
      await this.updateSkinCaches(optimizedSkin);

      // 10. Success!
      result.success = true;
      result.action = existingVersions && existingVersions.size > 0 ? 'updated' : 'registered';

      // Emit registration event with version information
      this.emit('skinRegistered', {
        skinId: optimizedSkin.id,
        name: optimizedSkin.name,
        version: optimizedSkin.version,
        action: result.action,
        conflicts: result.conflicts?.length || 0,
        migrations: result.migrations?.length || 0,
        pclReusePercentage: optimizedSkin.pclCompatibility.reusePercentage,
        supportedInterfaces: optimizedSkin.metadata.supportedInterfaces,
        timestamp: Date.now()
      });

      console.log(
        `Universal Skin Engine: ${result.action === 'registered' ? 'Registered' : 'Updated'} ` +
        `${optimizedSkin.name} v${optimizedSkin.version} with ${optimizedSkin.pclCompatibility.reusePercentage}% PCL reuse`
      );

      return result;
    } catch (error) {
      result.errors?.push(`Registration failed: ${error}`);
      if (isTemplumError(error)) {
        throw error;
      }
      throw createTemplumError(`Failed to register skin with versioning: ${error}`, 'skin-registration-error', 'validation');
    }
  }

  /**
   * Render skin for specific interface and theme with context
   */
  async renderForInterface(
    skin: UniversalSkinDefinition,
    interfaceType: string,
    context: RenderingContext
  ): Promise<SkinRenderResult> {
    const startTime = Date.now();
    
    try {
      // Generate cache key using skin.id instead of skin.metadata.id
      const cacheKey = this.generateCacheKey(skin.id, interfaceType, context.theme, context, skin.version);
      
      // Check cache first
      if (this.renderCache.has(cacheKey)) {
        const cachedResult = this.renderCache.get(cacheKey)!;
        cachedResult.performance.cacheHit = true;
        return cachedResult;
      }
      
      // ✅ NEW: Convert to Universal Menu Definition using PCL patterns
      const universalMenuDefinition = this.pclRenderingAdapter.convertToUniversalMenuDefinition(
        skin, 
        interfaceType, 
        context
      );

      // ✅ NEW: Calculate layout constraints using PCL layout engine patterns
      const layoutConstraints = this.pclRenderingAdapter.calculateUniversalLayout(
        interfaceType,
        context,
        universalMenuDefinition.items.length
      );

      // ✅ NEW: Render using PCL patterns for sophisticated rendering
      const pclRenderResult = await this.pclRenderingAdapter.renderUniversalMenu(
        universalMenuDefinition,
        layoutConstraints,
        context
      );

      // Convert PCL render result to Universal Skin Engine format
      const result: SkinRenderResult = {
        success: pclRenderResult.success,
        interface: interfaceType,
        metadata: {
          skinId: skin.id,
          backendService: skin.metadata.backendService,
          pclIntegration: true,
          reusePercentage: pclRenderResult.performance.pclReusePercentage
        },
        components: pclRenderResult.components,
        performance: {
          renderTime: pclRenderResult.performance.renderTime,
          cacheHit: pclRenderResult.performance.cacheHit,
          outputSize: (pclRenderResult.htmlContent || pclRenderResult.cliContent || '').length
        },
        customization: {
          analysisMode: context.preferences?.analysisMode || 'standard',
          pclTheme: pclRenderResult.theme,
          layoutConstraints: layoutConstraints
        },
        inheritance: {
          parentSkin: skin.metadata.parentSkin,
          applied: !!skin.metadata.parentSkin
        },
        // ✅ NEW: Enhanced content with PCL rendering
        renderedContent: {
          html: pclRenderResult.htmlContent,
          cli: pclRenderResult.cliContent,
          layout: pclRenderResult.layout
        }
      };
      
      // Cache the result
      this.renderCache.set(cacheKey, result);
      this.maintainCacheSize();
      
      // Emit success metrics
      this.emit('performance:metric', {
        timestamp: Date.now(),
        source: 'universal-skin-engine',
        category: 'performance' as const,
        metrics: {
          memory: {
            heapUsed: process.memoryUsage().heapUsed,
            rss: process.memoryUsage().rss
          },
          cpu: {
            user: process.cpuUsage().user,
            system: process.cpuUsage().system
          },
          interfaces: {
            [interfaceType]: {
              responseTime: pclRenderResult.performance.renderTime,
              lastActivity: Date.now(),
              pcl_reuse_percentage: pclRenderResult.performance.pclReusePercentage,
              components_rendered: pclRenderResult.components.length,
              cache_hit: false
            }
          }
        }
      } as MetricsSignalPayload);
      
      return result;
      
    } catch (error) {
      // Enhanced error handling with signal emission
      const errorMessage = isTemplumError(error) ? error.message : String(error);
      
      this.emit('skin-engine:error', {
        timestamp: Date.now(),
        source: 'universal-skin-engine',
        severity: 'high',
        error: createTemplumError(`PCL-enhanced skin rendering failed for ${skin.id} on ${interfaceType}: ${errorMessage}`, 'RENDERING_ERROR', 'runtime'),
        context: 'Universal Skin Engine with PCL Integration',
        skinId: skin.id,
        interface: interfaceType
      } as ErrorSignalPayload);
      
      // TODO: [TASK-NEW-040] Fallback to basic rendering when PCL integration fails
      // Priority: Medium | Complexity: 6
      // Dependencies: Basic component rendering patterns, error recovery system
      // Phase: Integration
      
      return {
        success: false,
        interface: interfaceType,
        metadata: {
          skinId: skin.id,
          backendService: skin.metadata.backendService,
          error: errorMessage,
          pclIntegration: false
        },
        components: [],
        performance: {
          renderTime: Date.now() - startTime,
          cacheHit: false,
          outputSize: 0
        },
        customization: {
          analysisMode: context.preferences?.analysisMode || 'standard'
        },
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
   * Set state for specific interface
   */
  async setState(interfaceType: string, state: any): Promise<void> {
    this.interfaceStates.set(interfaceType, state);
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
    this.activeThemes.clear();
    this.renderingEngines.clear();
    this.interfaceAdapters.clear();
  }

  /**
   * Render skin for specific interface and theme with PCL optimization
   */
  async renderSkin(
    skinId: string,
    interfaceType: string,
    themeName: string,
    options?: {
      components?: string[];
      responsive?: boolean;
      accessibility?: boolean;
      optimization?: 'speed' | 'size' | 'quality';
    }
  ): Promise<SkinRenderResult> {
    const skin = this.skins.get(skinId);
    if (!skin) {
      throw new Error(`Skin ${skinId} not found`);
    }

    const supportedInterfaces = skin.metadata?.supportedInterfaces || [];
    if (!supportedInterfaces.includes(interfaceType as any)) {
      throw createTemplumError(`Skin ${skinId} does not support interface ${interfaceType}`, 'InterfaceNotSupported', 'validation');
    }

    const theme = skin.themes[themeName];
    if (!theme) {
      throw createTemplumError(`Theme ${themeName} not found in skin ${skinId}`, 'ThemeNotFound', 'validation');
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(skinId, interfaceType, themeName, options, skin?.version);

    // Check cache first
    if (this.renderCache.has(cacheKey)) {
      const cachedResult = this.renderCache.get(cacheKey)!;
      cachedResult.performance.cacheHit = true;
      this.emit('renderCacheHit', { skinId, interfaceType, themeName });
      return cachedResult;
    }

    try {
      // Get interface-specific renderer
      const renderer = await this.getRenderer(skin, interfaceType);
      
      // Apply PCL-Skins inheritance patterns
      const inheritedSkin = await this.applyInheritanceChain(skin, theme);
      
      // Render components with interface adaptations
      const renderOutput = await this.renderWithAdaptations(
        inheritedSkin,
        theme,
        interfaceType,
        renderer,
        options
      );

      // Apply performance optimizations
      const optimizedOutput = await this.applyRenderingOptimizations(
        renderOutput,
        skin.performance,
        options
      );

      // Validate rendering result
      const validation = await this.validateRenderResult(optimizedOutput, skin, interfaceType);

      const result: SkinRenderResult = {
        skinId,
        interface: interfaceType,
        theme: themeName,
        metadata: {
          skinId,
          backendService: skin.metadata.backendService
        },
        components: [],
        output: optimizedOutput,
        performance: {
          renderTime: Date.now() - startTime,
          outputSize: this.calculateOutputSize(optimizedOutput),
          cacheHit: false
        },
        customization: {},
        inheritance: {
          parentSkin: skin.metadata.parentSkin,
          applied: !!skin.metadata.parentSkin
        },
        validation
      };

      // Cache result if valid
      if (validation.valid) {
        this.renderCache.set(cacheKey, result);
        this.maintainCacheSize();
      }

      this.emit('skinRendered', result);
      return result;

    } catch (error) {
      const errorMessage = isTemplumError(error) 
        ? error.message 
        : (error instanceof Error ? error.message : 'Unknown error');
      
      const errorResult: SkinRenderResult = {
        skinId,
        interface: interfaceType,
        theme: themeName,
        metadata: {
          skinId,
          backendService: skin.metadata.backendService
        },
        components: [],
        output: {},
        performance: {
          renderTime: Date.now() - startTime,
          outputSize: 0,
          cacheHit: false
        },
        customization: {},
        inheritance: {
          parentSkin: skin.metadata.parentSkin,
          applied: false
        },
        validation: {
          valid: false,
          warnings: [],
          errors: [errorMessage]
        }
      };

      // Emit error signal with proper payload
      const errorPayload: ErrorSignalPayload = {
        error: isTemplumError(error) ? error : createTemplumError(errorMessage, 'SkinRenderError', 'runtime'),
        timestamp: Date.now(),
        source: 'UniversalSkinEngine',
        severity: 'high'
      };
      (process as any).emit('skinRenderError', errorPayload);
      
      this.emit('skinRenderError', errorResult);
      throw new Error(`Skin rendering failed: ${errorMessage}`);
    }
  }

  /**
   * Apply theme to interface with automatic skin selection
   */
  async applyThemeToInterface(
    interfaceType: string,
    themeName: string,
    skinId?: string
  ): Promise<SkinRenderResult> {
    // Auto-select best skin if not specified
    if (!skinId) {
      skinId = await this.selectBestSkinForInterface(interfaceType, themeName);
    }

    const renderResult = await this.renderSkin(skinId, interfaceType, themeName, {
      optimization: this.config.performanceMode === 'production' ? 'size' : 'quality'
    });

    // Apply to interface adapter
    const adapter = this.interfaceAdapters.get(interfaceType);
    if (adapter && adapter.applyTheme) {
      await adapter.applyTheme(renderResult);
    }

    // Track active theme
    this.activeThemes.set(interfaceType, `${skinId}:${themeName}`);

    this.emit('themeApplied', {
      interfaceType,
      skinId,
      themeName,
      renderResult,
      timestamp: Date.now()
    });

    return renderResult;
  }

  /**
   * Create custom theme variant with PCL inheritance
   */
  async createThemeVariant(
    baseSkinId: string,
    baseThemeName: string,
    variantName: string,
    customizations: Partial<ThemeDefinition>
  ): Promise<void> {
    const baseSkin = this.skins.get(baseSkinId);
    if (!baseSkin) {
      throw createTemplumError(`Base skin ${baseSkinId} not found`, 'SkinNotFound', 'validation');
    }

    const baseTheme = baseSkin.themes[baseThemeName];
    if (!baseTheme) {
      throw createTemplumError(`Base theme ${baseThemeName} not found`, 'ThemeNotFound', 'validation');
    }

    // Create variant theme with PCL inheritance patterns
    const variantTheme = await this.createInheritedTheme(baseTheme, customizations);
    
    // Add variant to base skin
    baseSkin.themes[variantName] = variantTheme;
    baseSkin.themes[baseThemeName].variants = baseSkin.themes[baseThemeName].variants || {};
    baseSkin.themes[baseThemeName].variants[variantName] = customizations;

    this.emit('themeVariantCreated', {
      baseSkinId,
      baseThemeName,
      variantName,
      timestamp: Date.now()
    });

    console.log(`Universal Skin Engine: Created theme variant ${variantName} for ${baseSkinId}`);
  }

  /**
   * Get skin inheritance optimization opportunities
   */
  getInheritanceOptimizations(): {
    totalOpportunities: number;
    pclPatternAdoption: Array<{
      skinId: string;
      currentReuse: number;
      potentialReuse: number;
      missingPatterns: string[];
    }>;
    inheritanceOptimizations: Array<{
      skinId: string;
      redundantDefinitions: number;
      inheritanceOpportunity: number;
      suggestedBaseTheme: string;
    }>;
    performanceOptimizations: Array<{
      skinId: string;
      currentSize: number;
      optimizedSize: number;
      techniques: string[];
    }>;
  } {
    const opportunities = {
      totalOpportunities: 0,
      pclPatternAdoption: [] as any[],
      inheritanceOptimizations: [] as any[],
      performanceOptimizations: [] as any[]
    };

    for (const [skinId, skin] of Array.from(this.skins.entries())) {
      // Analyze PCL pattern adoption
      const pclAnalysis = this.analyzePCLPatternAdoption(skin);
      if (pclAnalysis.improvementPotential > 15) {
        opportunities.pclPatternAdoption.push({
          skinId,
          currentReuse: pclAnalysis.currentReuse,
          potentialReuse: pclAnalysis.potentialReuse,
          missingPatterns: pclAnalysis.missingPatterns
        });
        opportunities.totalOpportunities++;
      }

      // Analyze inheritance opportunities
      const inheritanceAnalysis = this.analyzeInheritanceOptimization(skin);
      if (inheritanceAnalysis.redundantDefinitions > 20) {
        opportunities.inheritanceOptimizations.push({
          skinId,
          redundantDefinitions: inheritanceAnalysis.redundantDefinitions,
          inheritanceOpportunity: inheritanceAnalysis.opportunity,
          suggestedBaseTheme: inheritanceAnalysis.suggestedBase
        });
        opportunities.totalOpportunities++;
      }

      // Analyze performance optimization opportunities
      const performanceAnalysis = this.analyzePerformanceOptimization(skin);
      if (performanceAnalysis.improvementPotential > 25) {
        opportunities.performanceOptimizations.push({
          skinId,
          currentSize: performanceAnalysis.currentSize,
          optimizedSize: performanceAnalysis.optimizedSize,
          techniques: performanceAnalysis.techniques
        });
        opportunities.totalOpportunities++;
      }
    }

    return opportunities;
  }

  /**
   * Get skin engine statistics and health metrics
   */
  getSkinEngineStats(): SkinEngineStats {
    const allSkins = Array.from(this.skins.values());
    const renderResults = Array.from(this.renderCache.values());

    // Calculate performance metrics
    const avgRenderTime = renderResults.length > 0 ?
      renderResults.reduce((sum, result) => sum + result.performance.renderTime, 0) / renderResults.length : 0;

    const cacheHits = renderResults.filter(r => r.performance.cacheHit).length;
    const cacheHitRate = renderResults.length > 0 ? (cacheHits / renderResults.length) * 100 : 0;

    const totalOutputSize = renderResults.reduce((sum, result) => sum + result.performance.outputSize, 0);

    // Calculate PCL integration metrics
    const skinsWithPCLSupport = allSkins.filter(s => s.pclCompatibility.reusePercentage > 0).length;
    const avgReusePercentage = allSkins.length > 0 ?
      allSkins.reduce((sum, skin) => sum + skin.pclCompatibility.reusePercentage, 0) / allSkins.length : 0;

    // Calculate interface support metrics
    const interfaceSupport: Record<string, any> = {};
    const interfaces = ['vscode', 'cli', 'command', 'web'];

    interfaces.forEach(iface => {
      const supportingSkins = allSkins.filter(s => s.metadata?.supportedInterfaces?.includes(iface as any) || false);
      const interfaceResults = renderResults.filter(r => r.interface === iface);
      const avgLoadTime = interfaceResults.length > 0 ?
        interfaceResults.reduce((sum, r) => sum + r.performance.renderTime, 0) / interfaceResults.length : 0;
      const successRate = interfaceResults.length > 0 ?
        (interfaceResults.filter(r => r.validation?.valid).length / interfaceResults.length) * 100 : 0;

      interfaceSupport[iface] = {
        supportedSkins: supportingSkins.length,
        avgLoadTime,
        successRate
      };
    });

    return {
      totalSkins: allSkins.length,
      activeThemes: this.activeThemes.size,
      renderingEngines: this.getRenderingEngineStats(),
      performanceMetrics: {
        avgRenderTime,
        cacheHitRate,
        totalOutputSize
      },
      pclIntegration: {
        skinsWithPCLSupport,
        avgReusePercentage,
        optimizationOpportunities: this.getInheritanceOptimizations().totalOpportunities
      },
      interfaceSupport
    };
  }

  // ============================================================================
  // Version-Aware Skin Management Public Methods
  // ============================================================================

  /**
   * Load skin with version-aware resolution
   */
  async loadSkin(query: SkinVersionQuery): Promise<UniversalSkinDefinition | null> {
    try {
      const availableVersions = new Map<string, UniversalSkinDefinition>();
      
      // Get all versions of the requested skin
      const versionMap = this.skinVersions.get(query.skinId);
      if (versionMap) {
        for (const [version, skin] of Array.from(versionMap)) {
          availableVersions.set(`${query.skinId}:${version}`, skin);
        }
      }

      // Use version manager to resolve the best version
      const resolution = await this.versionManager.resolveVersion(query, availableVersions);
      
      if (resolution.resolved && resolution.skin) {
        console.log(`Loaded skin ${query.skinId} v${resolution.version}${resolution.fallbackUsed ? ' (fallback)' : ''}`);
        return resolution.skin;
      }

      console.warn(`Failed to load skin ${query.skinId}: ${resolution.reason}`);
      return null;
    } catch (error) {
      console.error(`Error loading skin ${query.skinId}:`, error);
      return null;
    }
  }

  /**
   * Get all available versions of a skin
   */
  getSkinVersions(skinId: string): { version: string; skin: UniversalSkinDefinition }[] {
    const versionMap = this.skinVersions.get(skinId);
    if (!versionMap) {
      return [];
    }

    return Array.from(versionMap.entries()).map(([version, skin]) => ({ version, skin }));
  }

  /**
   * Get skin version information including compatibility
   */
  async getSkinVersionInfo(skinId: string, version?: string): Promise<any> {
    try {
      const versionMap = this.skinVersions.get(skinId);
      if (!versionMap) {
        return null;
      }

      // If specific version requested
      if (version) {
        const skin = versionMap.get(version);
        if (!skin) {
          return null;
        }
        return await this.versionManager.getVersionInfo(skin, this.config.systemVersion);
      }

      // Return info for all versions
      const allVersionInfo = [];
      for (const [v, skin] of Array.from(versionMap)) {
        const info = await this.versionManager.getVersionInfo(skin, this.config.systemVersion);
        allVersionInfo.push({ ...info, version: v });
      }

      return allVersionInfo.sort((a, b) => this.versionManager.compareVersions(b.version, a.version));
    } catch (error) {
      console.error(`Error getting version info for ${skinId}:`, error);
      return null;
    }
  }

  /**
   * Check if a specific skin version is compatible with the system
   */
  async checkSkinCompatibility(skinId: string, version: string): Promise<{
    compatible: boolean;
    level: 'full' | 'partial' | 'breaking' | 'incompatible';
    issues: string[];
    recommendations: string[];
  } | null> {
    try {
      const versionMap = this.skinVersions.get(skinId);
      if (!versionMap) {
        return null;
      }

      const skin = versionMap.get(version);
      if (!skin) {
        return null;
      }

      return await this.versionManager.validateCompatibility(skin, this.config.systemVersion);
    } catch (error) {
      console.error(`Error checking compatibility for ${skinId} v${version}:`, error);
      return null;
    }
  }

  /**
   * Get latest compatible version of a skin
   */
  async getLatestCompatibleSkin(skinId: string, includePrerelease: boolean = false): Promise<{
    skin: UniversalSkinDefinition;
    version: string;
    compatibilityLevel: string;
  } | null> {
    try {
      const query: SkinVersionQuery = {
        skinId,
        versionPattern: 'latest',
        fallbackStrategy: 'latest-compatible',
        includePrerelease
      };

      const availableVersions = new Map<string, UniversalSkinDefinition>();
      const versionMap = this.skinVersions.get(skinId);
      if (versionMap) {
        for (const [version, skin] of Array.from(versionMap)) {
          availableVersions.set(`${skinId}:${version}`, skin);
        }
      }

      const resolution = await this.versionManager.resolveVersion(query, availableVersions);
      if (resolution.resolved && resolution.skin) {
        const compatibility = await this.versionManager.validateCompatibility(
          resolution.skin, 
          this.config.systemVersion
        );

        return {
          skin: resolution.skin,
          version: resolution.version!,
          compatibilityLevel: compatibility.level
        };
      }

      return null;
    } catch (error) {
      console.error(`Error getting latest compatible skin for ${skinId}:`, error);
      return null;
    }
  }

  /**
   * Unregister a specific skin version
   */
  async unregisterSkinVersion(skinId: string, version: string): Promise<boolean> {
    try {
      const versionMap = this.skinVersions.get(skinId);
      if (!versionMap || !versionMap.has(version)) {
        return false;
      }

      // Remove from version storage
      versionMap.delete(version);
      if (versionMap.size === 0) {
        this.skinVersions.delete(skinId);
      }

      // Update main storage if this was the current version
      const currentSkin = this.skins.get(skinId);
      if (currentSkin && currentSkin.version === version) {
        // Find and set the latest remaining version
        if (versionMap.size > 0) {
          const latestVersion = this.versionManager.getLatestVersion(skinId, false);
          if (latestVersion) {
            const latestSkin = versionMap.get(latestVersion.raw);
            if (latestSkin) {
              this.skins.set(skinId, latestSkin);
            }
          }
        } else {
          this.skins.delete(skinId);
        }
      }

      // Clear related cache entries
      const keysToRemove: string[] = [];
      for (const [cacheKey] of Array.from(this.renderCache)) {
        if (cacheKey.includes(`${skinId}:${version}`)) {
          keysToRemove.push(cacheKey);
        }
      }
      keysToRemove.forEach(key => this.renderCache.delete(key));

      // Unregister from version manager
      this.versionManager.unregisterSkinVersion(skinId, version);

      this.emit('skinVersionUnregistered', { skinId, version, timestamp: Date.now() });
      console.log(`Unregistered skin ${skinId} v${version}`);
      return true;
    } catch (error) {
      console.error(`Error unregistering skin ${skinId} v${version}:`, error);
      return false;
    }
  }

  /**
   * Connect PCL-Skins integration service
   */
  connectPCLSkinsService(pclSkinsService: any): void {
    // PCL integration now handled by PCLRenderingAdapter - deprecated method
    
    this.emit('pclSkinsConnected', {
      serviceVersion: pclSkinsService.version || 'unknown',
      supportedPatterns: pclSkinsService.getSupportedPatterns?.() || [],
      timestamp: Date.now()
    });

    console.log('Universal Skin Engine: Connected to PCL-Skins service');
  }

  /**
   * Register interface adapter for skin rendering
   */
  registerInterfaceAdapter(interfaceType: string, adapter: any): void {
    this.interfaceAdapters.set(interfaceType, adapter);
    
    this.emit('interfaceAdapterRegistered', {
      interfaceType,
      capabilities: adapter.getCapabilities?.() || [],
      timestamp: Date.now()
    });
  }

  private async validateSkinDefinition(skin: UniversalSkinDefinition): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!skin.id) errors.push('Skin ID is required');
    if (!skin.name) errors.push('Skin name is required');
    if (!skin.version) errors.push('Skin version is required');
    const supportedInterfaces = skin.metadata?.supportedInterfaces || [];
    if (!supportedInterfaces.length) errors.push('At least one supported interface is required');
    if (!Object.keys(skin.themes).length) errors.push('At least one theme is required');

    // Validate PCL compatibility
    if (skin.pclCompatibility.reusePercentage < 0 || skin.pclCompatibility.reusePercentage > 100) {
      errors.push('PCL reuse percentage must be between 0 and 100');
    }

    // Validate themes
    for (const [themeName, theme] of Object.entries(skin.themes)) {
      if (!theme.colors) errors.push(`Theme ${themeName} missing color palette`);
      if (!theme.typography) errors.push(`Theme ${themeName} missing typography configuration`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Enhanced validation with version compatibility checking
   */
  private async validateSkinDefinitionWithVersioning(skin: UniversalSkinDefinition): Promise<{ valid: boolean; errors: string[] }> {
    try {
      // Start with basic validation
      const basicValidation = await this.validateSkinDefinition(skin);
      if (!basicValidation.valid) {
        return basicValidation;
      }

      const errors: string[] = [...basicValidation.errors];

      // Additional version-specific validation
      try {
        // Validate semantic version format
        this.versionManager.parseVersion(skin.version);
      } catch (versionError) {
        errors.push(`Invalid version format: ${skin.version}`);
      }

      // Validate system compatibility
      const compatibility = await this.versionManager.validateCompatibility(skin, this.config.systemVersion);
      if (!compatibility.compatible && compatibility.level === 'incompatible') {
        errors.push(...compatibility.issues);
      } else if (compatibility.issues.length > 0) {
        // Add warnings for partial compatibility issues
        console.warn(`Skin ${skin.id} v${skin.version} compatibility warnings:`, compatibility.issues);
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      return { 
        valid: false, 
        errors: [`Validation error: ${error}`] 
      };
    }
  }

  /**
   * Comprehensive validation with advanced compatibility checking (TASK-SKIN-002)
   * 
   * This method extends basic validation with deep compatibility analysis
   * for interface requirements, performance constraints, and cross-interface support
   */
  async validateSkinDefinitionComprehensive(
    skin: UniversalSkinDefinition, 
    targetInterface?: InterfaceType,
    options?: {
      includeAdvancedValidation?: boolean;
      validateAssets?: boolean;
      checkPerformance?: boolean;
      crossInterfaceValidation?: boolean;
      strictMode?: boolean;
    }
  ): Promise<{ 
    valid: boolean; 
    errors: string[];
    warnings: string[];
    advancedReport?: any; // AdvancedCompatibilityReport but avoiding circular imports
  }> {
    const opts = {
      includeAdvancedValidation: true,
      validateAssets: true,
      checkPerformance: true,
      crossInterfaceValidation: false,
      strictMode: false,
      ...options
    };

    try {
      // Start with existing enhanced validation
      const basicValidation = await this.validateSkinDefinitionWithVersioning(skin);
      const errors: string[] = [...basicValidation.errors];
      const warnings: string[] = [];
      let advancedReport: any = undefined;

      // If basic validation fails and we're in strict mode, stop here
      if (!basicValidation.valid && opts.strictMode) {
        return { valid: false, errors, warnings };
      }

      // Perform advanced compatibility validation if requested and target interface specified
      if (opts.includeAdvancedValidation && targetInterface) {
        try {
          advancedReport = await this.versionManager.validateAdvancedCompatibility(skin, targetInterface, {
            includeWarnings: true,
            validateAssets: opts.validateAssets,
            checkPerformance: opts.checkPerformance,
            crossInterfaceValidation: opts.crossInterfaceValidation,
            strictMode: opts.strictMode
          });

          // Add advanced validation errors and warnings
          if (advancedReport.errors && advancedReport.errors.length > 0) {
            errors.push(...advancedReport.errors);
          }

          if (advancedReport.warnings && advancedReport.warnings.length > 0) {
            warnings.push(...advancedReport.warnings);
          }

          // In strict mode, incompatible or partially compatible skins are considered invalid
          if (opts.strictMode && advancedReport.overall !== 'compatible') {
            errors.push(`Skin not fully compatible with ${targetInterface} interface`);
          }

        } catch (advancedError) {
          console.warn(`Advanced compatibility validation failed: ${advancedError}`);
          if (opts.strictMode) {
            errors.push(`Advanced validation error: ${advancedError}`);
          } else {
            warnings.push(`Advanced validation warning: ${advancedError}`);
          }
        }
      }

      const valid = errors.length === 0;

      // Log comprehensive validation results
      if (advancedReport) {
        console.log(`[SKIN-VALIDATION] ${skin.id} v${skin.version} → ${targetInterface}: ${advancedReport.overall} (score: ${advancedReport.score})`);
        if (advancedReport.recommendations && advancedReport.recommendations.length > 0) {
          console.log(`[SKIN-VALIDATION] Recommendations:`, advancedReport.recommendations);
        }
      }

      return { 
        valid, 
        errors, 
        warnings,
        advancedReport
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Comprehensive validation failed: ${error}`],
        warnings: []
      };
    }
  }

  /**
   * Validate skin compatibility for specific interface (TASK-SKIN-002)
   * 
   * Quick method to check if a skin is compatible with a target interface
   */
  async validateSkinForInterface(
    skin: UniversalSkinDefinition,
    targetInterface: InterfaceType,
    strictMode: boolean = false
  ): Promise<{ 
    compatible: boolean; 
    score: number; 
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const advancedReport = await this.versionManager.validateAdvancedCompatibility(skin, targetInterface, {
        includeWarnings: !strictMode,
        validateAssets: true,
        checkPerformance: true,
        crossInterfaceValidation: false,
        strictMode
      });

      const issues: string[] = [];
      if (advancedReport.errors) issues.push(...advancedReport.errors);
      if (advancedReport.warnings) issues.push(...advancedReport.warnings);

      return {
        compatible: advancedReport.overall === 'compatible' || (!strictMode && advancedReport.overall === 'partially-compatible'),
        score: advancedReport.score,
        issues,
        recommendations: advancedReport.recommendations || []
      };

    } catch (error) {
      return {
        compatible: false,
        score: 0,
        issues: [`Compatibility validation failed: ${error}`],
        recommendations: ['Consider using basic validation instead']
      };
    }
  }

  /**
   * Store skin version in versioned storage
   */
  private async storeSkinVersion(skin: UniversalSkinDefinition): Promise<void> {
    try {
      // Get or create version map for this skin
      let versionMap = this.skinVersions.get(skin.id);
      if (!versionMap) {
        versionMap = new Map();
        this.skinVersions.set(skin.id, versionMap);
      }

      // Store this version
      versionMap.set(skin.version, skin);

      // Also update the main skins map with latest version logic
      // Check if this is the latest version
      const existingSkin = this.skins.get(skin.id);
      if (!existingSkin || this.versionManager.compareVersions(skin.version, existingSkin.version) > 0) {
        this.skins.set(skin.id, skin);
      }

      // Register version with version manager for tracking
      const parsedVersion = this.versionManager.parseVersion(skin.version);
      this.versionManager.registerSkinVersion(skin.id, parsedVersion);

      console.log(`Stored skin ${skin.id} v${skin.version} in versioned storage`);
    } catch (error) {
      throw createTemplumError(`Failed to store skin version: ${error}`, 'skin-storage-error', 'validation');
    }
  }

  /**
   * Update caches with version-aware keys
   */
  private async updateSkinCaches(skin: UniversalSkinDefinition): Promise<void> {
    try {
      // Clear version-specific cache entries for this skin
      const keysToRemove: string[] = [];
      for (const [cacheKey] of Array.from(this.renderCache)) {
        if (cacheKey.includes(skin.id)) {
          keysToRemove.push(cacheKey);
        }
      }

      keysToRemove.forEach(key => this.renderCache.delete(key));

      // TODO: Pre-warm cache for common interface/theme combinations
      // This could be added based on usage patterns

      console.log(`Updated caches for skin ${skin.id} v${skin.version}`);
    } catch (error) {
      console.warn(`Failed to update caches for skin ${skin.id}:`, error);
      // Don't throw - cache updates are not critical for registration success
    }
  }

  private async optimizeWithPCLPatterns(skin: UniversalSkinDefinition): Promise<UniversalSkinDefinition> {
    const optimized = { ...skin };

    // PCL optimization now handled by PCLRenderingAdapter
    // Maintain compatibility with existing PCL compatibility structure
    if (false) { // Disabled legacy PCL integration
      const pclOptimizations = null; // await this.pclSkinIntegration.analyzeSkinOptimizations(skin);
      
      optimized.pclCompatibility.reusePercentage = Math.max(
        skin.pclCompatibility.reusePercentage,
        (pclOptimizations as any)?.potentialReuse || 0
      );
      
      optimized.pclCompatibility.inheritancePatterns = [
        ...skin.pclCompatibility.inheritancePatterns,
        ...((pclOptimizations as any)?.recommendedPatterns || [])
      ];
      
      optimized.pclCompatibility.optimizations = [
        ...skin.pclCompatibility.optimizations,
        ...((pclOptimizations as any)?.availableOptimizations || [])
      ];
    }

    // Apply performance optimizations
    optimized.performance = this.optimizeSkinPerformance(skin.performance);

    return optimized;
  }

  private optimizeSkinPerformance(performance: SkinPerformanceConfig): SkinPerformanceConfig {
    const optimized = { ...performance };

    // Optimize loading strategy based on size and complexity
    if (optimized.metrics.targetLoadTime > 1000) {
      optimized.loadingStrategy = 'lazy';
    } else if (optimized.metrics.targetLoadTime > 500) {
      optimized.loadingStrategy = 'progressive';
    }

    // Optimize caching policy
    if (optimized.metrics.maxMemoryUsage > 50) {
      optimized.cachingPolicy = 'disk';
    } else {
      optimized.cachingPolicy = 'hybrid';
    }

    return optimized;
  }

  private async setupSkinInheritance(skin: UniversalSkinDefinition): Promise<void> {
    // Setup inheritance chain with parent skins
    for (const parentSkinId of skin.inheritance.parentSkins) {
      const parentSkin = this.skins.get(parentSkinId);
      if (parentSkin) {
        // Apply inheritance patterns from parent
        await this.applyParentInheritance(skin, parentSkin);
      }
    }
  }

  private async applyParentInheritance(childSkin: UniversalSkinDefinition, parentSkin: UniversalSkinDefinition): Promise<void> {
    // Merge themes with child overriding parent
    for (const [themeName, parentTheme] of Object.entries(parentSkin.themes)) {
      if (!childSkin.themes[themeName]) {
        childSkin.themes[themeName] = { ...parentTheme };
      } else {
        // Merge theme properties
        childSkin.themes[themeName] = this.mergeThemes(parentTheme, childSkin.themes[themeName]);
      }
    }

    // Merge components with child overriding parent
    for (const [componentName, parentComponent] of Object.entries(parentSkin.components)) {
      if (!childSkin.components[componentName]) {
        childSkin.components[componentName] = { ...parentComponent };
      } else {
        // Merge component properties
        childSkin.components[componentName] = this.mergeComponents(parentComponent, childSkin.components[componentName]);
      }
    }

    // Merge assets
    childSkin.assets = this.mergeAssets(parentSkin.assets, childSkin.assets);
  }

  private mergeThemes(parentTheme: ThemeDefinition, childTheme: ThemeDefinition): ThemeDefinition {
    return {
      ...parentTheme,
      ...childTheme,
      colors: { ...parentTheme.colors, ...childTheme.colors },
      typography: { ...parentTheme.typography, ...childTheme.typography },
      spacing: { ...parentTheme.spacing, ...childTheme.spacing },
      borders: { ...parentTheme.borders, ...childTheme.borders },
      shadows: { ...parentTheme.shadows, ...childTheme.shadows },
      animations: { ...parentTheme.animations, ...childTheme.animations },
      customProperties: { ...parentTheme.customProperties, ...childTheme.customProperties }
    };
  }

  private mergeComponents(parentComponent: ComponentSkin, childComponent: ComponentSkin): ComponentSkin {
    return {
      ...parentComponent,
      ...childComponent,
      variants: { ...parentComponent.variants, ...childComponent.variants },
      states: { ...parentComponent.states, ...childComponent.states },
      responsive: { ...parentComponent.responsive, ...childComponent.responsive },
      accessibility: { ...parentComponent.accessibility, ...childComponent.accessibility }
    };
  }

  private mergeAssets(parentAssets: SkinAssets, childAssets: SkinAssets): SkinAssets {
    return {
      icons: { ...parentAssets.icons, ...childAssets.icons },
      images: { ...parentAssets.images, ...childAssets.images },
      fonts: { ...parentAssets.fonts, ...childAssets.fonts },
      sounds: { ...parentAssets.sounds, ...childAssets.sounds }
    };
  }

  private async prepareInterfaceConfigurations(skin: UniversalSkinDefinition): Promise<void> {
    const supportedInterfaces = skin.metadata?.supportedInterfaces || [];
    for (const interfaceType of supportedInterfaces) {
      const interfaceConfig = skin.rendering.targets[interfaceType];
      if (!interfaceConfig) {
        // Create default interface configuration
        skin.rendering.targets[interfaceType] = this.createDefaultInterfaceConfig(interfaceType);
      }
    }
  }

  private createDefaultInterfaceConfig(interfaceType: string): InterfaceRenderingConfig {
    const baseConfig: InterfaceRenderingConfig = {
      interface: interfaceType as any,
      renderer: 'css',
      adaptations: {},
      constraints: {
        colorDepth: 24,
        maxFileSize: 1024 * 1024, // 1MB
        supportedFeatures: ['colors', 'typography', 'spacing']
      }
    };

    // Interface-specific adaptations
    switch (interfaceType) {
      case 'cli':
        baseConfig.constraints.colorDepth = 8;
        baseConfig.constraints.supportedFeatures = ['colors-limited', 'spacing'];
        baseConfig.adaptations = { 'high-contrast': true, 'simplified-layout': true };
        break;
      case 'vscode':
        baseConfig.constraints.supportedFeatures.push('animations', 'shadows', 'gradients');
        baseConfig.adaptations = { 'theme-inheritance': true, 'icon-support': true };
        break;
      case 'web':
        baseConfig.constraints.supportedFeatures.push('animations', 'shadows', 'gradients', 'transforms');
        baseConfig.adaptations = { 'responsive': true, 'progressive-enhancement': true };
        break;
    }

    return baseConfig;
  }

  private generateCacheKey(skinId: string, interfaceType: string, themeName: string, options?: any, version?: string): string {
    // Get version from skin if not explicitly provided
    let skinVersion = version;
    if (!skinVersion) {
      const skin = this.skins.get(skinId);
      skinVersion = skin?.version || 'unknown';
    }
    
    const optionsHash = options ? JSON.stringify(options) : '';
    return `${skinId}:${skinVersion}-${interfaceType}-${themeName}-${optionsHash}`;
  }

  private async getRenderer(skin: UniversalSkinDefinition, interfaceType: string): Promise<any> {
    const interfaceConfig = skin.rendering.targets[interfaceType];
    const rendererName = interfaceConfig.renderer;
    
    let renderer = this.renderingEngines.get(rendererName);
    if (!renderer) {
      renderer = await this.createRenderer(rendererName);
      this.renderingEngines.set(rendererName, renderer);
    }

    return renderer;
  }

  private async createRenderer(rendererName: string): Promise<any> {
    // Create interface-specific renderer
    switch (rendererName) {
      case 'css':
        return { render: this.renderToCSS.bind(this) };
      case 'tokens':
        return { render: this.renderToTokens.bind(this) };
      default:
        throw createTemplumError(`Unknown renderer: ${rendererName}`, 'UnknownRenderer', 'configuration');
    }
  }

  private async applyInheritanceChain(skin: UniversalSkinDefinition, theme: ThemeDefinition): Promise<any> {
    let inheritedSkin = { skin, theme };

    // Apply base theme if specified
    if (skin.inheritance.baseTheme) {
      const baseTheme = skin.themes[skin.inheritance.baseTheme];
      if (baseTheme) {
        inheritedSkin.theme = this.mergeThemes(baseTheme, theme);
      }
    }

    // Apply mixins
    for (const mixinId of skin.inheritance.mixins) {
      const mixin = await this.getMixin(mixinId);
      if (mixin) {
        inheritedSkin = await this.applyMixin(inheritedSkin, mixin);
      }
    }

    // Apply overrides
    for (const override of skin.inheritance.overrides) {
      inheritedSkin = this.applyOverride(inheritedSkin, override);
    }

    return inheritedSkin;
  }

  private async renderWithAdaptations(
    inheritedSkin: any,
    theme: ThemeDefinition,
    interfaceType: string,
    renderer: any,
    options?: any
  ): Promise<any> {
    const renderContext = {
      skin: inheritedSkin.skin,
      theme: inheritedSkin.theme,
      interface: interfaceType,
      options: options || {}
    };

    return await renderer.render(renderContext);
  }

  private async applyRenderingOptimizations(
    renderOutput: any,
    performanceConfig: SkinPerformanceConfig,
    options?: any
  ): Promise<any> {
    let optimized = { ...renderOutput };

    // Apply compression if enabled
    if (performanceConfig.compressionLevel > 0) {
      optimized = await this.compressOutput(optimized, performanceConfig.compressionLevel);
    }

    // Apply tree-shaking if enabled
    if (renderOutput.css && options?.components) {
      optimized.css = this.treeShakeCSS(optimized.css, options.components);
    }

    // Apply minification in production
    if (this.config.performanceMode === 'production') {
      optimized = await this.minifyOutput(optimized);
    }

    return optimized;
  }

  private async validateRenderResult(output: any, skin: UniversalSkinDefinition, interfaceType: string): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Validate output size
    const outputSize = this.calculateOutputSize(output);
    const maxSize = skin.rendering.targets[interfaceType]?.constraints.maxFileSize || 1024 * 1024;
    
    if (outputSize > maxSize) {
      errors.push(`Output size ${outputSize} bytes exceeds maximum ${maxSize} bytes`);
    } else if (outputSize > maxSize * 0.8) {
      warnings.push(`Output size ${outputSize} bytes is close to maximum ${maxSize} bytes`);
    }

    // Validate feature support
    const supportedFeatures = skin.rendering.targets[interfaceType]?.constraints.supportedFeatures || [];
    const usedFeatures = this.extractUsedFeatures(output);
    
    for (const feature of usedFeatures) {
      if (!supportedFeatures.includes(feature)) {
        warnings.push(`Feature ${feature} may not be supported on ${interfaceType}`);
      }
    }

    return { valid: errors.length === 0, warnings, errors };
  }

  private calculateOutputSize(output: any): number {
    return JSON.stringify(output).length;
  }

  private extractUsedFeatures(output: any): string[] {
    const features: string[] = [];
    
    if (output.css) {
      const css = output.css;
      if (css.includes('animation') || css.includes('transition')) features.push('animations');
      if (css.includes('box-shadow') || css.includes('text-shadow')) features.push('shadows');
      if (css.includes('gradient')) features.push('gradients');
      if (css.includes('transform')) features.push('transforms');
    }

    return features;
  }

  private maintainCacheSize(): void {
    if (this.renderCache.size > this.config.maxCacheSize) {
      // Remove oldest entries (simple LRU)
      const entries = Array.from(this.renderCache.entries());
      entries.sort((a, b) => a[1].performance.renderTime - b[1].performance.renderTime);
      
      const toRemove = entries.slice(0, this.renderCache.size - this.config.maxCacheSize);
      toRemove.forEach(([key]) => this.renderCache.delete(key));
    }
  }

  private async selectBestSkinForInterface(interfaceType: string, themeName: string): Promise<string> {
    const compatibleSkins = Array.from(this.skins.values())
      .filter(skin => skin.metadata?.supportedInterfaces?.includes(interfaceType as any) || false)
      .filter(skin => skin.themes[themeName]);

    if (compatibleSkins.length === 0) {
      throw createTemplumError(`No compatible skins found for interface ${interfaceType} with theme ${themeName}`, 'NoCompatibleSkins', 'validation');
    }

    // Select skin with highest PCL reuse percentage
    const bestSkin = compatibleSkins.reduce((best, current) => 
      current.pclCompatibility.reusePercentage > best.pclCompatibility.reusePercentage ? current : best
    );

    return bestSkin.id;
  }

  private async createInheritedTheme(baseTheme: ThemeDefinition, customizations: Partial<ThemeDefinition>): Promise<ThemeDefinition> {
    return {
      ...baseTheme,
      ...customizations,
      colors: { ...baseTheme.colors, ...customizations.colors },
      typography: { ...baseTheme.typography, ...customizations.typography },
      spacing: { ...baseTheme.spacing, ...customizations.spacing },
      borders: { ...baseTheme.borders, ...customizations.borders },
      shadows: { ...baseTheme.shadows, ...customizations.shadows },
      animations: { ...baseTheme.animations, ...customizations.animations },
      customProperties: { ...baseTheme.customProperties, ...customizations.customProperties }
    };
  }

  // Analysis methods for optimization opportunities
  private analyzePCLPatternAdoption(skin: UniversalSkinDefinition): {
    currentReuse: number;
    potentialReuse: number;
    improvementPotential: number;
    missingPatterns: string[];
  } {
    const currentReuse = skin.pclCompatibility.reusePercentage;
    const potentialReuse = this.calculatePotentialPCLReuse(skin);
    const improvementPotential = potentialReuse - currentReuse;
    const missingPatterns = this.identifyMissingPCLPatterns(skin);

    return { currentReuse, potentialReuse, improvementPotential, missingPatterns };
  }

  private calculatePotentialPCLReuse(skin: UniversalSkinDefinition): number {
    // Calculate potential PCL reuse based on skin characteristics
    let potential = skin.pclCompatibility.reusePercentage;

    // Increase potential based on supported interfaces
    const supportedInterfaces = skin.metadata?.supportedInterfaces || [];
    potential += supportedInterfaces.length * 5; // 5% per interface

    // Increase potential based on inheritance usage
    if (skin.inheritance.parentSkins.length > 0) potential += 15;
    if (skin.inheritance.mixins.length > 0) potential += 10;

    // Increase potential based on component reusability
    const reusableComponents = Object.values(skin.components).filter(c => c.pclMapping.reuseLevel !== 'low').length;
    potential += reusableComponents * 3; // 3% per reusable component

    return Math.min(100, potential);
  }

  private identifyMissingPCLPatterns(skin: UniversalSkinDefinition): string[] {
    const allPCLPatterns = [
      'theme-inheritance',
      'component-variants',
      'responsive-tokens',
      'accessibility-patterns',
      'performance-optimization',
      'multi-interface-support'
    ];

    const currentPatterns = skin.pclCompatibility.inheritancePatterns;
    return allPCLPatterns.filter(pattern => !currentPatterns.includes(pattern));
  }

  private analyzeInheritanceOptimization(skin: UniversalSkinDefinition): {
    redundantDefinitions: number;
    opportunity: number;
    suggestedBase: string;
  } {
    // Analyze for redundant theme/component definitions
    const themeCount = Object.keys(skin.themes).length;
    const redundantDefinitions = themeCount > 3 ? (themeCount - 3) * 10 : 0;
    const opportunity = redundantDefinitions > 0 ? 25 : 0;
    const suggestedBase = this.suggestBaseTheme(skin);

    return { redundantDefinitions, opportunity, suggestedBase };
  }

  private suggestBaseTheme(skin: UniversalSkinDefinition): string {
    // Find the most common theme properties to suggest as base
    const themeNames = Object.keys(skin.themes);
    return themeNames.length > 0 ? themeNames[0] : 'default-light';
  }

  private analyzePerformanceOptimization(skin: UniversalSkinDefinition): {
    currentSize: number;
    optimizedSize: number;
    improvementPotential: number;
    techniques: string[];
  } {
    const currentSize = JSON.stringify(skin).length;
    const techniques: string[] = [];
    let optimizedSize = currentSize;

    // Estimate optimization potential
    if (skin.performance.compressionLevel < 9) {
      techniques.push('increase-compression');
      optimizedSize *= 0.8;
    }

    if (skin.performance.loadingStrategy !== 'lazy') {
      techniques.push('lazy-loading');
      optimizedSize *= 0.9;
    }

    const improvementPotential = ((currentSize - optimizedSize) / currentSize) * 100;

    return { currentSize, optimizedSize, improvementPotential, techniques };
  }

  private getRenderingEngineStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const [engineName] of Array.from(this.renderingEngines.entries())) {
      const skinsUsingEngine = Array.from(this.skins.values())
        .filter(skin => Object.values(skin.rendering.targets).some(target => target.renderer === engineName));
      stats[engineName] = skinsUsingEngine.length;
    }

    return stats;
  }

  // Rendering method implementations
  private async renderToCSS(context: any): Promise<any> {
    const { theme, interface: interfaceType, options } = context;
    
    // Generate CSS from theme
    const css = this.generateCSSFromTheme(theme, interfaceType, options);
    
    return { css, tokens: this.extractTokensFromTheme(theme) };
  }

  private async renderToTokens(context: any): Promise<any> {
    const { theme } = context;
    return { tokens: this.extractTokensFromTheme(theme) };
  }

  private generateCSSFromTheme(theme: ThemeDefinition, interfaceType: string, options?: any): string {
    // Simplified CSS generation - real implementation would be more sophisticated
    const css = `
:root {
  --primary-color: ${theme.colors.primary[500]};
  --secondary-color: ${theme.colors.secondary[500]};
  --background-color: ${theme.colors.background.primary};
  --text-color: ${theme.colors.text.primary};
  --font-family: ${theme.typography.fontFamilies.primary};
}

.theme-${interfaceType} {
  color: var(--text-color);
  background-color: var(--background-color);
  font-family: var(--font-family);
}
    `;

    return css.trim();
  }

  private extractTokensFromTheme(theme: ThemeDefinition): Record<string, any> {
    return {
      colors: theme.colors,
      typography: theme.typography,
      spacing: theme.spacing,
      borders: theme.borders,
      shadows: theme.shadows,
      animations: theme.animations
    };
  }

  // Helper methods for advanced functionality
  private async getMixin(mixinId: string): Promise<any> {
    // Placeholder - would load mixin definitions
    return null;
  }

  private async applyMixin(inheritedSkin: any, mixin: any): Promise<any> {
    // Placeholder - would apply mixin to skin
    return inheritedSkin;
  }

  private applyOverride(inheritedSkin: any, override: SkinOverride): any {
    // Apply override to specific property
    return inheritedSkin;
  }

  private async compressOutput(output: any, compressionLevel: number): Promise<any> {
    // Placeholder - would apply compression
    return output;
  }

  private treeShakeCSS(css: string, components: string[]): string {
    // Placeholder - would remove unused CSS
    return css;
  }

  private async minifyOutput(output: any): Promise<any> {
    // Placeholder - would minify output
    return output;
  }

  private initializePCLSkinIntegration(): void {
    // Initialize PCL-Skins integration patterns
    console.log('Universal Skin Engine: Initializing PCL-Skins integration for 70% reuse potential');
  }

  private initializeDefaultSkins(): void {
    // Initialize default universal skins with PCL compatibility
    const defaultSkin: UniversalSkinDefinition = {
      id: 'default-universal',
      name: 'Default Universal Theme',
      version: '1.0.0',
      pclCompatibility: {
        enabled: true, // Interface alignment with core templum-types
        version: '1.0.0',
        reusePercentage: 70, // 70% reuse potential from Phase 1
        inheritancePatterns: [
          'theme-inheritance',
          'component-variants',
          'multi-interface-support'
        ],
        optimizations: [
          'lazy-loading',
          'tree-shaking',
          'compression'
        ]
      },
      metadata: {
        description: 'Default universal theme with PCL integration',
        author: 'Templum System',
        tags: ['default', 'universal', 'pcl-compatible'],
        supportedInterfaces: ['vscode', 'cli', 'command'],
        backendService: 'templum-default',
        dependencies: []
      },
      inheritance: {
        parentSkins: [],
        overrides: [],
        mixins: []
      },
      themes: {
        'default-light': this.createDefaultTheme('light'),
        'default-dark': this.createDefaultTheme('dark')
      },
      components: {},
      assets: {
        icons: {},
        images: {},
        fonts: {},
        sounds: {}
      },
      rendering: {
        engine: 'css',
        output: 'css',
        optimizations: {
          treeshaking: true,
          minification: true,
          caching: true,
          lazyLoading: true
        },
        targets: {}
      },
      performance: {
        loadingStrategy: 'progressive',
        cachingPolicy: 'hybrid',
        compressionLevel: 6,
        criticalPath: [],
        metrics: {
          targetLoadTime: 500,
          maxMemoryUsage: 25,
          renderBudget: 16
        }
      }
    };

    this.skins.set(defaultSkin.id, defaultSkin);
    console.log(`Universal Skin Engine: Initialized default skin with 70% PCL reuse potential`);
  }

  private createDefaultTheme(type: 'light' | 'dark'): ThemeDefinition {
    const baseColors = type === 'light' ? {
      primary: { '500': '#007acc' } as ColorScale,
      background: { primary: '#ffffff', secondary: '#f5f5f5', tertiary: '#e5e5e5', overlay: 'rgba(0,0,0,0.1)' },
      text: { primary: '#333333', secondary: '#666666', disabled: '#999999', inverse: '#ffffff' }
    } : {
      primary: { '500': '#0099ff' } as ColorScale,
      background: { primary: '#1e1e1e', secondary: '#252526', tertiary: '#2d2d30', overlay: 'rgba(0,0,0,0.3)' },
      text: { primary: '#cccccc', secondary: '#999999', disabled: '#666666', inverse: '#000000' }
    };

    return {
      name: `Default ${type}`,
      type,
      colors: {
        ...baseColors,
        secondary: { '500': '#6c757d' } as ColorScale,
        accent: { '500': '#28a745' } as ColorScale,
        neutral: { '500': '#6c757d' } as ColorScale,
        semantic: {
          success: { '500': '#28a745' } as ColorScale,
          warning: { '500': '#ffc107' } as ColorScale,
          error: { '500': '#dc3545' } as ColorScale,
          info: { '500': '#17a2b8' } as ColorScale
        },
        border: {
          primary: type === 'light' ? '#e0e0e0' : '#404040',
          secondary: type === 'light' ? '#f0f0f0' : '#303030',
          focus: '#007acc',
          error: '#dc3545'
        }
      } as ColorPalette,
      typography: {
        fontFamilies: {
          primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          secondary: 'Georgia, serif',
          monospace: '"SF Mono", Monaco, "Cascadia Code", monospace'
        },
        fontSizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        },
        fontWeights: {
          normal: 400,
          medium: 500,
          bold: 700
        },
        lineHeights: {
          tight: 1.25,
          normal: 1.5,
          loose: 1.75
        },
        letterSpacing: {
          tight: '-0.025em',
          normal: '0',
          wide: '0.025em'
        }
      },
      spacing: {
        unit: 4,
        scale: {
          xs: 0.5,
          sm: 1,
          base: 2,
          lg: 4,
          xl: 6
        }
      },
      borders: {
        radii: {
          none: '0',
          sm: '0.125rem',
          base: '0.25rem',
          lg: '0.5rem',
          full: '9999px'
        },
        widths: {
          none: '0',
          thin: '1px',
          base: '2px',
          thick: '4px'
        },
        styles: {
          solid: 'solid',
          dashed: 'dashed',
          dotted: 'dotted'
        }
      },
      shadows: {
        elevations: {
          none: 'none',
          sm: '0 1px 2px rgba(0,0,0,0.05)',
          base: '0 1px 3px rgba(0,0,0,0.1)',
          lg: '0 4px 6px rgba(0,0,0,0.1)'
        },
        colors: {
          default: 'rgba(0,0,0,0.1)',
          colored: 'rgba(0,122,204,0.15)'
        }
      },
      animations: {
        durations: {
          fast: '150ms',
          base: '300ms',
          slow: '500ms'
        },
        easings: {
          linear: 'linear',
          easeIn: 'ease-in',
          easeOut: 'ease-out',
          easeInOut: 'ease-in-out'
        },
        transitions: {
          all: 'all 300ms ease-in-out',
          colors: 'color 150ms ease-in-out, background-color 150ms ease-in-out',
          transform: 'transform 300ms ease-in-out'
        }
      },
      customProperties: {},
      variants: {}
    };
  }
}
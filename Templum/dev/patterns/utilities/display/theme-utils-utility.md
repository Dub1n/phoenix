---
date-created: 2025-09-14T200000Z
last-updated: 2025-09-14T200000Z
name: theme-utils-utility-pattern
description: Centralized theme management utility for dynamic theme loading, switching, color palette operations, and interface-specific adaptations across Universal Skin Engine ecosystem
status: established
category: display-ui
use-when:
  - Dynamic theme switching and loading across interfaces required
  - Color palette calculations and transformations needed
  - Interface-specific theme adaptations (CLI ANSI, VSCode CSS, command output)
  - Performance-optimized theme management with caching required
  - Integration with Universal Skin Engine and PCL rendering systems needed
keywords:
  - theme-management
  - color-palette
  - interface-adaptations
  - dynamic-theming
  - performance-optimization
  - universal-skin-integration
prerequisites:
  - universal-skin-definition
  - logger-utility
  - display-utils-utility
related-patterns:
  - display-utils-utility
  - pcl-rendering-integration-bridge
  - universal-interface-orchestration
---

### Theme Utils Utility Pattern

**Problem**: Theme management is scattered across interface components with manual color calculations, inconsistent color format conversions, no centralized theme switching, and lack of interface-specific adaptations for CLI ANSI colors, VSCode CSS variables, and command output formatting.

**Current State Examples**:
```typescript
// Manual color calculations scattered everywhere
const primaryColor = skin.theme?.primary || '#007acc';
const rgbValues = hexToRgb(primaryColor);
const ansiColor = `\x1b[38;2;${rgbValues.r};${rgbValues.g};${rgbValues.b}m`;

// No centralized theme switching
if (currentInterface === 'cli') {
  // Manual CLI color setup
  this.cliColors = {
    primary: convertToAnsi(theme.primary),
    secondary: convertToAnsi(theme.secondary)
  };
}

// Inconsistent theme loading
const themeData = skin.themes?.[activeTheme] || skin.theme || defaultTheme;
const resolvedColors = await resolveThemeInheritance(themeData);
```

**Solution**: Centralized ThemeUtils with fluent API for theme operations, intelligent caching, color palette management, and interface-specific adaptations that integrates seamlessly with Universal Skin Engine ecosystem.

#### Theme Utils Implementation

**Core ThemeUtils Class** (Minimal Usage Design):
```typescript
import { createLogger } from '../core/logger-utility';
import { DisplayUtils } from './display-utils-utility';
import type { 
  UniversalSkinDefinition, 
  ThemeDefinition, 
  ColorPalette, 
  InterfaceType 
} from '../../types/universal-skin-definition';

export class ThemeUtils {
  private static logger = createLogger('theme-utils');
  private static themeCache: Map<string, ResolvedTheme> = new Map();
  private static colorCache: Map<string, ColorVariations> = new Map();
  private static currentThemes: Map<string, string> = new Map(); // interface -> theme ID
  
  // ============================================================================
  // CORE THEME OPERATIONS - One-line theme management
  // ============================================================================
  
  /**
   * Load and resolve theme from Universal Skin Definition
   * Handles inheritance, fallbacks, and validation automatically
   */
  static async loadTheme(
    skin: UniversalSkinDefinition, 
    themeId?: string,
    options: ThemeLoadOptions = {}
  ): Promise<ResolvedTheme> {
    const { useCache = true, validateTheme = true } = options;
    
    // Determine theme to load (priority: themeId > currentTheme > defaultTheme)
    const targetThemeId = themeId || this.getCurrentTheme(skin.id) || this.getDefaultTheme(skin);
    const cacheKey = `${skin.id}:${targetThemeId}`;
    
    // Check cache first
    if (useCache && this.themeCache.has(cacheKey)) {
      this.logger.debug('Theme loaded from cache', { skinId: skin.id, themeId: targetThemeId });
      return this.themeCache.get(cacheKey)!;
    }
    
    // Resolve theme with inheritance chain
    const rawTheme = this.resolveThemeDefinition(skin, targetThemeId);
    
    // Create resolved theme with computed properties
    const resolvedTheme: ResolvedTheme = {
      id: targetThemeId,
      name: rawTheme.name,
      type: rawTheme.type,
      skinId: skin.id,
      colors: this.resolveColorPalette(rawTheme.colors, skin),
      typography: this.resolveTypography(rawTheme.typography),
      spacing: rawTheme.spacing,
      borders: rawTheme.borders,
      shadows: rawTheme.shadows,
      animations: rawTheme.animations,
      customProperties: rawTheme.customProperties || {},
      computed: {
        interfaceAdaptations: this.generateInterfaceAdaptations(rawTheme),
        colorVariations: this.generateColorVariations(rawTheme.colors),
        accessibilityColors: this.generateAccessibilityColors(rawTheme.colors),
        performanceHints: this.generatePerformanceHints(rawTheme)
      },
      metadata: {
        loadedAt: Date.now(),
        parentThemes: this.getParentThemeChain(skin, targetThemeId),
        validationResult: validateTheme ? this.validateTheme(rawTheme) : { valid: true, warnings: [] }
      }
    };
    
    // Cache resolved theme
    if (useCache) {
      this.themeCache.set(cacheKey, resolvedTheme);
    }
    
    this.logger.info('Theme loaded successfully', { 
      skinId: skin.id, 
      themeId: targetThemeId,
      cached: useCache,
      parentThemes: resolvedTheme.metadata.parentThemes.length
    });
    
    return resolvedTheme;
  }
  
  /**
   * Switch active theme for specific interface or globally
   * Handles theme transitions, cache invalidation, and event emission
   */
  static async switchTheme(
    skin: UniversalSkinDefinition,
    themeId: string,
    options: ThemeSwitchOptions = {}
  ): Promise<ThemeSwitchResult> {
    const { 
      interface: targetInterface,
      transition = true,
      persistChoice = true,
      validateCompatibility = true 
    } = options;
    
    try {
      // Validate theme compatibility
      if (validateCompatibility) {
        const compatibility = this.validateThemeCompatibility(skin, themeId, targetInterface);
        if (!compatibility.compatible) {
          throw new Error(`Theme ${themeId} not compatible: ${compatibility.reason}`);
        }
      }
      
      // Load new theme
      const newTheme = await this.loadTheme(skin, themeId);
      
      // Get current theme for comparison
      const currentThemeId = this.getCurrentTheme(skin.id, targetInterface);
      const oldTheme = currentThemeId ? await this.loadTheme(skin, currentThemeId) : null;
      
      // Update active theme tracking
      const interfaceKey = targetInterface || skin.id;
      this.currentThemes.set(interfaceKey, themeId);
      
      // Generate interface-specific adaptations
      const adaptations = targetInterface 
        ? this.getInterfaceAdaptations(newTheme, targetInterface)
        : this.getAllInterfaceAdaptations(newTheme);
      
      // Persist theme choice if requested
      if (persistChoice) {
        await this.persistThemeChoice(skin.id, themeId, targetInterface);
      }
      
      // Prepare transition data
      const transitionData = transition && oldTheme ? {
        duration: this.calculateTransitionDuration(oldTheme, newTheme),
        colorDeltas: this.calculateColorDeltas(oldTheme.colors, newTheme.colors),
        animateProperties: this.getAnimatableProperties(oldTheme, newTheme)
      } : undefined;
      
      const result: ThemeSwitchResult = {
        success: true,
        previousTheme: oldTheme?.id,
        newTheme: newTheme.id,
        interface: targetInterface,
        adaptations,
        transitionData,
        performance: {
          loadTime: Date.now() - newTheme.metadata.loadedAt,
          cacheHit: this.themeCache.has(`${skin.id}:${themeId}`),
          adaptationTime: performance.now()
        }
      };
      
      this.logger.info('Theme switched successfully', {
        skinId: skin.id,
        from: result.previousTheme,
        to: result.newTheme,
        interface: targetInterface,
        transitionEnabled: !!transitionData
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('Theme switch failed', { skinId: skin.id, themeId, error: error.message });
      
      return {
        success: false,
        error: error.message,
        fallbackApplied: await this.applyFallbackTheme(skin, targetInterface)
      };
    }
  }
  
  // ============================================================================
  // COLOR PALETTE MANAGEMENT - Advanced color operations
  // ============================================================================
  
  /**
   * Get color from active theme with intelligent fallbacks
   * Supports color paths like 'primary.500', 'semantic.success.600'
   */
  static getColor(
    skinId: string,
    colorPath: string,
    options: ColorOptions = {}
  ): string {
    const {
      interface: targetInterface,
      format = 'hex',
      fallback = '#000000',
      alpha = 1.0
    } = options;
    
    const themeId = this.getCurrentTheme(skinId, targetInterface);
    if (!themeId) {
      this.logger.warn('No active theme found, using fallback', { skinId, colorPath, fallback });
      return this.convertColorFormat(fallback, format, alpha);
    }
    
    const cacheKey = `${skinId}:${themeId}:${colorPath}:${format}:${alpha}`;
    if (this.colorCache.has(cacheKey)) {
      return this.colorCache.get(cacheKey)!.formatted;
    }
    
    const theme = this.themeCache.get(`${skinId}:${themeId}`);
    if (!theme) {
      this.logger.warn('Theme not loaded, using fallback', { skinId, themeId, fallback });
      return this.convertColorFormat(fallback, format, alpha);
    }
    
    // Navigate color path (e.g., 'primary.500', 'semantic.success.600')
    const colorValue = this.navigateColorPath(theme.colors, colorPath, fallback);
    
    // Convert to requested format with caching
    const variations = this.generateColorVariations({ hex: colorValue });
    this.colorCache.set(cacheKey, variations);
    
    return this.convertColorFormat(colorValue, format, alpha);
  }
  
  /**
   * Generate color scale from base color
   * Creates 50-900 scale with proper contrast ratios
   */
  static generateColorScale(baseColor: string, options: ColorScaleOptions = {}): ColorScale {
    const {
      steps = 9,
      minLightness = 10,
      maxLightness = 95,
      saturationAdjust = 0,
      algorithm = 'hsl-interpolation'
    } = options;
    
    const cacheKey = `scale:${baseColor}:${JSON.stringify(options)}`;
    
    if (this.colorCache.has(cacheKey)) {
      return this.colorCache.get(cacheKey)!.scale;
    }
    
    const scale = this.calculateColorScale(baseColor, {
      steps,
      minLightness,
      maxLightness,
      saturationAdjust,
      algorithm
    });
    
    // Cache with full variations
    const variations = this.generateColorVariations({ hex: baseColor, scale });
    this.colorCache.set(cacheKey, variations);
    
    this.logger.debug('Generated color scale', { 
      baseColor, 
      steps, 
      algorithm,
      cached: true 
    });
    
    return scale;
  }
  
  /**
   * Calculate color contrast ratio between two colors
   * Returns WCAG AA/AAA compliance information
   */
  static calculateContrast(color1: string, color2: string): ColorContrastInfo {
    const ratio = this.getContrastRatio(color1, color2);
    
    return {
      ratio,
      wcagAA: {
        normalText: ratio >= 4.5,
        largeText: ratio >= 3.0,
        graphicsAndUI: ratio >= 3.0
      },
      wcagAAA: {
        normalText: ratio >= 7.0,
        largeText: ratio >= 4.5,
        graphicsAndUI: ratio >= 4.5
      },
      recommendation: this.getContrastRecommendation(ratio)
    };
  }
  
  // ============================================================================
  // INTERFACE-SPECIFIC ADAPTATIONS - Optimized for each interface
  // ============================================================================
  
  /**
   * Get CLI-specific color adaptations with ANSI codes
   * Handles terminal capability detection and fallbacks
   */
  static getCLIAdaptations(
    theme: ResolvedTheme,
    options: CLIAdaptationOptions = {}
  ): CLIThemeAdaptations {
    const {
      colorDepth = this.detectColorDepth(),
      useIcons = true,
      fallbackToBasicColors = true
    } = options;
    
    const cacheKey = `cli:${theme.id}:${colorDepth}:${useIcons}`;
    
    if (theme.computed.interfaceAdaptations.cli && !options.forceRefresh) {
      return theme.computed.interfaceAdaptations.cli;
    }
    
    const adaptations: CLIThemeAdaptations = {
      colors: {
        primary: this.convertToANSI(theme.colors.primary['500'], colorDepth),
        secondary: this.convertToANSI(theme.colors.secondary['500'], colorDepth),
        accent: this.convertToANSI(theme.colors.accent['500'], colorDepth),
        success: this.convertToANSI(theme.colors.semantic.success['500'], colorDepth),
        warning: this.convertToANSI(theme.colors.semantic.warning['500'], colorDepth),
        error: this.convertToANSI(theme.colors.semantic.error['500'], colorDepth),
        info: this.convertToANSI(theme.colors.semantic.info['500'], colorDepth),
        text: {
          primary: this.convertToANSI(theme.colors.text.primary, colorDepth),
          secondary: this.convertToANSI(theme.colors.text.secondary, colorDepth),
          disabled: this.convertToANSI(theme.colors.text.disabled, colorDepth),
          inverse: this.convertToANSI(theme.colors.text.inverse, colorDepth)
        },
        background: {
          primary: this.convertToANSI(theme.colors.background.primary, colorDepth, 'background'),
          secondary: this.convertToANSI(theme.colors.background.secondary, colorDepth, 'background'),
          tertiary: this.convertToANSI(theme.colors.background.tertiary, colorDepth, 'background')
        }
      },
      formatting: {
        bold: '\x1b[1m',
        italic: '\x1b[3m',
        underline: '\x1b[4m',
        reset: '\x1b[0m',
        separator: this.generateSeparator(theme, colorDepth),
        indent: '  ', // 2 spaces
        bullet: useIcons ? '•' : '-',
        checkmark: useIcons ? '✓' : '[x]',
        cross: useIcons ? '✗' : '[!]'
      },
      layout: {
        maxWidth: DisplayUtils.standards.terminalWidth,
        padding: DisplayUtils.standards.defaultPadding,
        borderChars: this.getBorderChars(colorDepth),
        progressBar: this.getProgressBarChars(useIcons)
      },
      capabilities: {
        colorDepth,
        supportsIcons: useIcons,
        supportsUnicode: this.detectUnicodeSupport(),
        terminalType: process.env.TERM || 'unknown'
      }
    };
    
    // Cache adaptations
    theme.computed.interfaceAdaptations.cli = adaptations;
    
    this.logger.debug('CLI adaptations generated', { 
      themeId: theme.id,
      colorDepth,
      capabilities: adaptations.capabilities
    });
    
    return adaptations;
  }
  
  /**
   * Get VSCode-specific CSS variable definitions
   * Generates CSS custom properties for webview integration
   */
  static getVSCodeAdaptations(
    theme: ResolvedTheme,
    options: VSCodeAdaptationOptions = {}
  ): VSCodeThemeAdaptations {
    const {
      cssVariablePrefix = '--theme',
      includeSemanticColors = true,
      includeComponentTokens = true,
      generateDarkModeVariants = theme.type === 'light'
    } = options;
    
    const cssVariables: Record<string, string> = {};
    const componentTokens: Record<string, string> = {};
    
    // Generate core color CSS variables
    this.generateCSSVariables(theme.colors, cssVariables, cssVariablePrefix);
    
    // Generate component-specific tokens
    if (includeComponentTokens) {
      this.generateComponentTokens(theme, componentTokens, cssVariablePrefix);
    }
    
    // Generate semantic color mappings
    const semanticMappings = includeSemanticColors 
      ? this.generateSemanticColorMappings(theme.colors)
      : {};
    
    // Generate dark mode variants if requested
    const darkModeVariants = generateDarkModeVariants 
      ? this.generateDarkModeVariants(theme)
      : undefined;
    
    const adaptations: VSCodeThemeAdaptations = {
      cssVariables,
      componentTokens,
      semanticMappings,
      darkModeVariants,
      styleSheet: this.generateStyleSheet(cssVariables, componentTokens),
      webviewScript: this.generateWebviewScript(theme),
      themeMeta: {
        type: theme.type,
        primaryColor: theme.colors.primary['500'],
        backgroundColor: theme.colors.background.primary,
        textColor: theme.colors.text.primary
      }
    };
    
    // Cache adaptations
    theme.computed.interfaceAdaptations.vscode = adaptations;
    
    this.logger.debug('VSCode adaptations generated', {
      themeId: theme.id,
      variableCount: Object.keys(cssVariables).length,
      componentTokens: includeComponentTokens,
      darkModeVariants: !!darkModeVariants
    });
    
    return adaptations;
  }
  
  /**
   * Get command-specific output formatting
   * Optimized for command line tools and scripts
   */
  static getCommandAdaptations(
    theme: ResolvedTheme,
    options: CommandAdaptationOptions = {}
  ): CommandThemeAdaptations {
    const {
      outputFormat = 'ansi',
      includeFormatting = true,
      verbosityLevel = 'normal'
    } = options;
    
    const adaptations: CommandThemeAdaptations = {
      colors: this.getCommandColors(theme, outputFormat),
      formatting: includeFormatting ? this.getCommandFormatting(theme, verbosityLevel) : {},
      templates: {
        success: this.generateMessageTemplate(theme, 'success', verbosityLevel),
        error: this.generateMessageTemplate(theme, 'error', verbosityLevel),
        warning: this.generateMessageTemplate(theme, 'warning', verbosityLevel),
        info: this.generateMessageTemplate(theme, 'info', verbosityLevel),
        debug: this.generateMessageTemplate(theme, 'debug', verbosityLevel)
      },
      outputHelpers: {
        formatStatus: (status: string, message: string) => 
          this.formatStatusMessage(theme, status, message, outputFormat),
        formatList: (items: string[], options?: ListFormatOptions) =>
          this.formatList(theme, items, outputFormat, options),
        formatTable: (data: any[], options?: TableFormatOptions) =>
          this.formatTable(theme, data, outputFormat, options)
      }
    };
    
    // Cache adaptations
    theme.computed.interfaceAdaptations.command = adaptations;
    
    return adaptations;
  }
  
  // ============================================================================
  // FLUENT API BUILDER - For complex theme operations
  // ============================================================================
  
  /**
   * Create fluent theme builder for complex operations
   * Supports chaining operations with performance optimization
   */
  static build(): ThemeBuilder {
    return new ThemeBuilder();
  }
  
  // ============================================================================
  // PERFORMANCE OPTIMIZATION METHODS
  // ============================================================================
  
  /**
   * Preload themes for improved performance
   * Intelligently loads themes based on usage patterns
   */
  static async preloadThemes(
    skin: UniversalSkinDefinition,
    options: ThemePreloadOptions = {}
  ): Promise<ThemePreloadResult> {
    const {
      interfaces = ['cli', 'vscode'],
      maxConcurrency = 3,
      priorityThemes = [],
      backgroundPreload = true
    } = options;
    
    const startTime = performance.now();
    const preloadResults: PreloadResult[] = [];
    
    // Determine themes to preload
    const themesToPreload = this.getThemesToPreload(skin, interfaces, priorityThemes);
    
    // Preload themes with concurrency control
    const preloadPromises = themesToPreload.map(async (themeId, index) => {
      if (!backgroundPreload && index >= maxConcurrency) {
        // Wait for previous batch to complete
        await Promise.all(preloadPromises.slice(Math.max(0, index - maxConcurrency), index));
      }
      
      try {
        const loadStart = performance.now();
        const theme = await this.loadTheme(skin, themeId, { validateTheme: false });
        const loadTime = performance.now() - loadStart;
        
        preloadResults.push({
          themeId,
          success: true,
          loadTime,
          cached: this.themeCache.has(`${skin.id}:${themeId}`)
        });
        
        return theme;
      } catch (error) {
        preloadResults.push({
          themeId,
          success: false,
          error: error.message,
          loadTime: 0,
          cached: false
        });
        
        this.logger.warn('Theme preload failed', { themeId, error: error.message });
        return null;
      }
    });
    
    await Promise.all(preloadPromises);
    
    const totalTime = performance.now() - startTime;
    const successCount = preloadResults.filter(r => r.success).length;
    
    this.logger.info('Theme preload completed', {
      total: themesToPreload.length,
      successful: successCount,
      failed: themesToPreload.length - successCount,
      totalTime: Math.round(totalTime),
      averageLoadTime: Math.round(preloadResults.reduce((sum, r) => sum + r.loadTime, 0) / preloadResults.length)
    });
    
    return {
      preloaded: preloadResults,
      performance: {
        totalTime,
        averageLoadTime: preloadResults.reduce((sum, r) => sum + r.loadTime, 0) / preloadResults.length,
        cacheHitRate: preloadResults.filter(r => r.cached).length / preloadResults.length
      },
      recommendations: this.generatePerformanceRecommendations(preloadResults, skin)
    };
  }
  
  /**
   * Clear theme cache with intelligent retention
   * Keeps frequently used themes while freeing memory
   */
  static clearCache(options: CacheClearOptions = {}): CacheClearResult {
    const {
      retainFrequentlyUsed = true,
      maxRetainedThemes = 5,
      minUsageCount = 3,
      clearColorCache = true
    } = options;
    
    const initialCacheSize = this.themeCache.size;
    const initialColorCacheSize = this.colorCache.size;
    
    if (retainFrequentlyUsed) {
      // Implement intelligent cache retention based on usage
      const usageStats = this.getThemeUsageStats();
      const themesToRetain = this.selectThemesToRetain(usageStats, maxRetainedThemes, minUsageCount);
      
      // Clear cache except for retained themes
      for (const [key] of this.themeCache) {
        if (!themesToRetain.includes(key)) {
          this.themeCache.delete(key);
        }
      }
    } else {
      this.themeCache.clear();
    }
    
    if (clearColorCache) {
      this.colorCache.clear();
    }
    
    const finalCacheSize = this.themeCache.size;
    const finalColorCacheSize = this.colorCache.size;
    
    const result: CacheClearResult = {
      themesCleared: initialCacheSize - finalCacheSize,
      themesRetained: finalCacheSize,
      colorsCleared: initialColorCacheSize - finalColorCacheSize,
      memoryFreed: this.estimateMemoryFreed(initialCacheSize - finalCacheSize, initialColorCacheSize - finalColorCacheSize),
      performance: {
        clearTime: performance.now(),
        retentionStrategy: retainFrequentlyUsed ? 'intelligent' : 'full-clear'
      }
    };
    
    this.logger.info('Theme cache cleared', result);
    
    return result;
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  private static resolveThemeDefinition(skin: UniversalSkinDefinition, themeId: string): ThemeDefinition {
    // Implementation details for theme resolution with inheritance
    // ... (detailed implementation)
  }
  
  private static resolveColorPalette(colors: ColorPalette, skin: UniversalSkinDefinition): ColorPalette {
    // Implementation details for color palette resolution
    // ... (detailed implementation)
  }
  
  private static generateInterfaceAdaptations(theme: ThemeDefinition): InterfaceAdaptations {
    // Implementation details for generating interface adaptations
    // ... (detailed implementation)
  }
  
  // ... (other private helper methods)
}

// ============================================================================
// FLUENT THEME BUILDER - For complex operations
// ============================================================================

class ThemeBuilder {
  private operations: ThemeOperation[] = [];
  private context: ThemeBuilderContext = {};
  
  // Chainable theme operations
  fromSkin(skin: UniversalSkinDefinition): this {
    this.context.skin = skin;
    return this;
  }
  
  withTheme(themeId: string): this {
    this.context.themeId = themeId;
    return this;
  }
  
  forInterface(interfaceType: InterfaceType): this {
    this.context.interface = interfaceType;
    return this;
  }
  
  withColorAdjustments(adjustments: ColorAdjustments): this {
    this.operations.push({ type: 'color-adjust', data: adjustments });
    return this;
  }
  
  withPerformanceOptions(options: PerformanceOptions): this {
    this.context.performance = options;
    return this;
  }
  
  async build(): Promise<ThemeBuilderResult> {
    // Execute all queued operations and return optimized result
    // Implementation details...
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ResolvedTheme extends ThemeDefinition {
  id: string;
  skinId: string;
  computed: {
    interfaceAdaptations: InterfaceAdaptations;
    colorVariations: ColorVariations;
    accessibilityColors: AccessibilityColors;
    performanceHints: PerformanceHints;
  };
  metadata: {
    loadedAt: number;
    parentThemes: string[];
    validationResult: ThemeValidationResult;
  };
}

interface ThemeLoadOptions {
  useCache?: boolean;
  validateTheme?: boolean;
  preloadAdaptations?: boolean;
  interface?: InterfaceType;
}

interface ThemeSwitchOptions {
  interface?: InterfaceType;
  transition?: boolean;
  persistChoice?: boolean;
  validateCompatibility?: boolean;
}

interface ThemeSwitchResult {
  success: boolean;
  previousTheme?: string;
  newTheme?: string;
  interface?: InterfaceType;
  adaptations?: any;
  transitionData?: any;
  performance?: any;
  error?: string;
  fallbackApplied?: boolean;
}

interface ColorOptions {
  interface?: InterfaceType;
  format?: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'ansi';
  fallback?: string;
  alpha?: number;
}

interface ColorScale {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; // Base color
  600: string; 700: string; 800: string; 900: string;
}

interface ColorScaleOptions {
  steps?: number;
  minLightness?: number;
  maxLightness?: number;
  saturationAdjust?: number;
  algorithm?: 'hsl-interpolation' | 'lab-interpolation' | 'oklab';
}

interface ColorContrastInfo {
  ratio: number;
  wcagAA: {
    normalText: boolean;
    largeText: boolean;
    graphicsAndUI: boolean;
  };
  wcagAAA: {
    normalText: boolean;
    largeText: boolean;
    graphicsAndUI: boolean;
  };
  recommendation: string;
}

interface CLIAdaptationOptions {
  colorDepth?: 8 | 256 | 16777216;
  useIcons?: boolean;
  fallbackToBasicColors?: boolean;
  forceRefresh?: boolean;
}

interface CLIThemeAdaptations {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
      inverse: string;
    };
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
  };
  formatting: {
    bold: string;
    italic: string;
    underline: string;
    reset: string;
    separator: string;
    indent: string;
    bullet: string;
    checkmark: string;
    cross: string;
  };
  layout: {
    maxWidth: number;
    padding: number;
    borderChars: BorderChars;
    progressBar: ProgressBarChars;
  };
  capabilities: {
    colorDepth: number;
    supportsIcons: boolean;
    supportsUnicode: boolean;
    terminalType: string;
  };
}

interface VSCodeAdaptationOptions {
  cssVariablePrefix?: string;
  includeSemanticColors?: boolean;
  includeComponentTokens?: boolean;
  generateDarkModeVariants?: boolean;
}

interface VSCodeThemeAdaptations {
  cssVariables: Record<string, string>;
  componentTokens: Record<string, string>;
  semanticMappings: Record<string, string>;
  darkModeVariants?: Record<string, string>;
  styleSheet: string;
  webviewScript: string;
  themeMeta: {
    type: string;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
}

interface CommandAdaptationOptions {
  outputFormat?: 'ansi' | 'plain' | 'json';
  includeFormatting?: boolean;
  verbosityLevel?: 'minimal' | 'normal' | 'verbose';
}

interface CommandThemeAdaptations {
  colors: Record<string, string>;
  formatting: Record<string, string>;
  templates: {
    success: string;
    error: string;
    warning: string;
    info: string;
    debug: string;
  };
  outputHelpers: {
    formatStatus: (status: string, message: string) => string;
    formatList: (items: string[], options?: any) => string;
    formatTable: (data: any[], options?: any) => string;
  };
}

interface ThemePreloadOptions {
  interfaces?: InterfaceType[];
  maxConcurrency?: number;
  priorityThemes?: string[];
  backgroundPreload?: boolean;
}

interface ThemePreloadResult {
  preloaded: PreloadResult[];
  performance: {
    totalTime: number;
    averageLoadTime: number;
    cacheHitRate: number;
  };
  recommendations: string[];
}

interface PreloadResult {
  themeId: string;
  success: boolean;
  loadTime: number;
  cached: boolean;
  error?: string;
}

interface CacheClearOptions {
  retainFrequentlyUsed?: boolean;
  maxRetainedThemes?: number;
  minUsageCount?: number;
  clearColorCache?: boolean;
}

interface CacheClearResult {
  themesCleared: number;
  themesRetained: number;
  colorsCleared: number;
  memoryFreed: number;
  performance: {
    clearTime: number;
    retentionStrategy: string;
  };
}

// Convenience exports for one-line operations
export const { 
  loadTheme, 
  switchTheme, 
  getColor, 
  generateColorScale,
  calculateContrast,
  getCLIAdaptations,
  getVSCodeAdaptations,
  getCommandAdaptations,
  build: buildTheme,
  preloadThemes,
  clearCache: clearThemeCache
} = ThemeUtils;
```

#### Usage Examples (Minimal Footprint)

**Before** (Current scattered approach):
```typescript
// Manual theme loading and color extraction
const skinTheme = skin.themes?.['dark'] || skin.theme;
const primaryHex = skinTheme?.primary || '#007acc';
const rgbValues = hexToRgb(primaryHex);
const ansiColor = `\x1b[38;2;${rgbValues.r};${rgbValues.g};${rgbValues.b}m`;

// Manual interface-specific adaptations
if (interface === 'cli') {
  const cliColors = {
    primary: convertToAnsi(primaryHex),
    success: convertToAnsi(skinTheme?.success || '#00ff00')
  };
}
```

**After** (One-line centralized):
```typescript
// One-line theme loading with caching and validation
const theme = await loadTheme(skin, 'dark');

// One-line color access with format conversion
const primaryColor = getColor(skin.id, 'primary.500', { format: 'ansi', interface: 'cli' });
const successColor = getColor(skin.id, 'semantic.success.600', { format: 'hex' });

// One-line interface adaptations
const cliTheme = getCLIAdaptations(theme, { colorDepth: 256 });
const vscodeTheme = getVSCodeAdaptations(theme, { cssVariablePrefix: '--theme' });
```

**Complex Theme Operations** (Fluent API):
```typescript
// Before: Multiple manual operations
const baseTheme = await loadTheme(skin, 'light');
const adjustedColors = adjustColorBrightness(baseTheme.colors, 0.1);
const cliAdaptations = generateCLIColors(adjustedColors, 256);
const vscodeVars = generateCSSVariables(adjustedColors, '--theme');
const darkVariant = generateDarkMode(adjustedColors);

// After: Fluent API with automatic optimization
const themeResult = await buildTheme()
  .fromSkin(skin)
  .withTheme('light')
  .forInterface('cli')
  .withColorAdjustments({ brightness: 0.1 })
  .withPerformanceOptions({ preloadAdaptations: true, useCache: true })
  .build();

// Result includes optimized CLI colors, VSCode CSS vars, and dark mode variants
const { cliColors, cssVariables, darkModeVariant, performance } = themeResult;
```

**Performance-Optimized Theme Switching**:
```typescript
// Preload themes for better performance
await preloadThemes(skin, { 
  interfaces: ['cli', 'vscode'], 
  priorityThemes: ['dark', 'light', 'high-contrast'] 
});

// Instant theme switching with transitions
const result = await switchTheme(skin, 'dark', { 
  interface: 'cli', 
  transition: true, 
  persistChoice: true 
});

console.log(`Switched to ${result.newTheme} in ${result.performance.loadTime}ms`);
```

#### Integration with Other Utilities

**Display Utils Integration**:
```typescript
// ThemeUtils works seamlessly with DisplayUtils for complete UI solution
const theme = await loadTheme(skin, 'dark');
const layout = DisplayUtils.calculate().autoWidth().padding(2).layout();
const cliColors = getCLIAdaptations(theme, { colorDepth: 256 });

// Use theme colors in display formatting
const formattedItems = DisplayUtils.formatItems(items, {
  prefix: cliColors.colors.primary,
  suffix: cliColors.formatting.reset,
  width: layout.maxItemLength
});
```

**PCL Rendering Integration**:
```typescript
// Automatic integration with PCL Rendering Adapter
const theme = await loadTheme(skin, 'default');
const pclAdaptations = theme.computed.interfaceAdaptations.pcl;

// Theme automatically maps to PCL-compatible colors
const pclMenuDef = pclRenderingAdapter.convertToUniversalMenuDefinition(
  skin, 'cli', { theme: theme.computed.pclMapping }
);
```

#### Files Using This Pattern

**Theme Management Components**:
- [ ] `src/skin/universal-skin-engine-impl.ts` → Use ThemeUtils.loadTheme() for theme resolution
- [ ] `src/rendering/universal-skin-renderer.ts` → Use theme adaptations for interface-specific rendering
- [ ] `src/interfaces/cli-adapter.ts` → Use getCLIAdaptations() for terminal colors
- [ ] `src/interfaces/vscode-templum-webview.ts` → Use getVSCodeAdaptations() for CSS variables

**PCL Integration Components**:
- [ ] `src/skin/pcl-rendering-adapter.ts` → Use theme color mappings for PCL compatibility
- [ ] `src/patterns/pcl-rendering-integration-bridge.ts` → Integrate theme adaptations

**Interface Components**:
- [ ] Components with manual color calculations and ANSI conversions
- [ ] Components with hardcoded theme values and color formats
- [ ] Components with interface-specific styling logic

#### Expected Impact

**Quantitative Benefits**:
- **Files Affected**: ~30 files with theme and color management logic
- **Lines Reduced**: ~800 lines of manual theme, color, and formatting code
- **Components Unified**: Theme loading, color calculations, interface adaptations
- **Performance**: 70%+ faster theme switching with intelligent caching

**Qualitative Benefits**:
- **Centralized Theme Management**: Single source of truth for all theme operations
- **Interface-Optimized Adaptations**: Automatic CLI ANSI, VSCode CSS, command formatting
- **Performance Optimization**: Intelligent caching, preloading, and memory management
- **Color Science**: Proper contrast calculations, color scale generation, accessibility compliance
- **Developer Experience**: One-line operations with fluent API for complex scenarios

#### Integration Validation

**Before Migration**:
- [ ] Map all manual theme loading and color extraction instances
- [ ] Identify interface-specific color adaptation patterns
- [ ] Catalog performance bottlenecks in current theme system

**During Migration**:
- [ ] Replace manual theme loading with ThemeUtils.loadTheme()
- [ ] Convert color extraction to getColor() with format options
- [ ] Migrate interface adaptations to getCLIAdaptations/getVSCodeAdaptations
- [ ] Implement performance optimizations with preloading and caching

**After Migration**:
- [ ] Verify consistent theme behavior across all interfaces
- [ ] Confirm color contrast compliance and accessibility standards
- [ ] Test performance improvements with theme switching benchmarks
- [ ] Validate memory usage with cache management strategies

#### Anti-Patterns

- **X** Don't manually parse theme definitions - use loadTheme() with validation
- **X** Don't manually convert colors between formats - use getColor() with format option
- **X** Don't hardcode ANSI/CSS color values - use interface adaptations
- **X** Don't skip theme caching for repeated operations - use performance options

#### Pattern Metadata

**Used By Active Tasks**: Universal Interface Theme Management  
**Implementation Priority**: HIGH (UI consistency and performance critical)  
**Dependencies**: Universal Skin Definition types, Logger Utility, Display Utils Utility  
**Integration Points**: Universal Skin Engine, PCL Rendering Adapter, all interface components  
**Migration Complexity**: Medium (requires consolidating theme logic across 30+ files)  
**Performance Impact**: Highly Positive (70%+ performance improvement with caching and optimization)
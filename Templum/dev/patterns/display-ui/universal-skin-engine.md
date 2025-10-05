---
date-created: 2025-08-15-0000
last-updated: 2025-09-11-0000
name: universal-skin-engine
description: Comprehensive universal rendering engine that handles multiple interface types with consistent theming, version management, and cross-platform compatibility
status: established
category: display-ui
use-when:
  - Need consistent theming across multiple interface types (CLI, VSCode, web)
  - Implementing cross-platform compatibility with high code reuse
  - Building a centralized rendering system with version management
  - Require event-driven architecture for skin management
keywords:
  - rendering
  - theming
  - cross-platform
  - version-management
  - interface-types
  - universal
  - engine
  - pcl-integration
prerequisites:
  - pcl-rendering-integration-bridge
  - skin-versioning-system
  - templumerror-integration
related-patterns:
  - pcl-enhanced-rendering
  - universal-interface-orchestration
  - advanced-compatibility-validation
---

# Universal Skin Engine Pattern

**Problem**: Templum needed a universal rendering engine that could handle multiple interface types (CLI, VSCode, web) with consistent theming, version management, and cross-platform compatibility while achieving high code reuse.

**Solution**: Comprehensive Universal Skin Engine with PCL integration, version management, event-driven architecture, and intelligent caching for 70%+ code reuse across interface types.

#### Universal Skin Engine Pattern: Architecture

The Universal Skin Engine implements a layered architecture:

1. **Registration Layer**: Version-aware skin registration with conflict resolution
2. **Rendering Layer**: PCL-integrated rendering with interface adaptation
3. **Management Layer**: Theme management, caching, and performance optimization
4. **Integration Layer**: Event emission, error handling, and cross-system coordination

#### Universal Skin Engine Pattern: Implementation Steps

**Step 1**: Core Engine Structure

```typescript
export class UniversalSkinEngine extends EventEmitter {
  private skins: Map<string, UniversalSkinDefinition> = new Map();
  private skinVersions: Map<string, Map<string, UniversalSkinDefinition>> = new Map();
  private activeThemes: Map<string, string> = new Map();
  private renderCache: Map<string, SkinRenderResult> = new Map();
  private pclRenderingAdapter: PCLRenderingAdapter;
  private versionManager: ISkinVersionManager;
  
  constructor(systemVersion?: string) {
    super();
    this.config = {
      cacheTimeout: 300000, // 5 minutes
      maxCacheSize: 100,
      defaultTheme: 'default-light',
      performanceMode: 'production',
      systemVersion: systemVersion || '1.0.0'
    };
    this.pclRenderingAdapter = new PCLRenderingAdapter();
    this.versionManager = new SkinVersionManager(this.config.systemVersion);
    this.initializePCLSkinIntegration();
  }
}
```

**Step 2**: Version-Aware Registration

```typescript
async registerSkin(
  skinDefinition: UniversalSkinDefinition, 
  options?: { 
    overrideExisting?: boolean; 
    preferredResolution?: ConflictResolutionStrategy;
    validateCompatibility?: boolean 
  }
): Promise<SkinRegistrationResult> {
  try {
    const request: SkinRegistrationRequest = {
      skin: skinDefinition,
      overrideExisting: options?.overrideExisting || false,
      preferredResolution: options?.preferredResolution || 'last-writer-wins',
      validateCompatibility: options?.validateCompatibility !== false
    };

    return await this.registerSkinWithVersioning(request);
  } catch (error) {
    if (isTemplumError(error)) {
      throw error;
    }
    throw createTemplumError(
      `Failed to register skin ${skinDefinition.id}: ${error}`, 
      'skin-registration-error', 
      'validation'
    );
  }
}
```

**Step 3**: PCL-Integrated Rendering

```typescript
async renderForInterface(
  skinId: string, 
  interfaceType: InterfaceType, 
  context: RenderingContext = {}
): Promise<SkinRenderResult> {
  const cacheKey = `${skinId}-${interfaceType}-${JSON.stringify(context)}`;
  
  // Check cache first
  if (this.renderCache.has(cacheKey)) {
    const cached = this.renderCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached;
    }
  }

  try {
    const skin = this.getSkinById(skinId);
    if (!skin) {
      throw createTemplumError(`Skin not found: ${skinId}`, 'skin-not-found', 'validation');
    }

    // Use PCL Rendering Adapter for 70% code reuse
    const universalResult = await this.pclRenderingAdapter.renderWithPCLIntegration(
      skin, interfaceType, context
    );

    const result: SkinRenderResult = {
      skinId,
      interfaceType,
      timestamp: Date.now(),
      success: true,
      renderedComponents: universalResult.components,
      theme: universalResult.appliedTheme,
      metadata: {
        renderTime: universalResult.renderTime,
        cacheHit: false,
        pclIntegration: true,
        version: skin.version
      }
    };

    // Cache result
    this.renderCache.set(cacheKey, result);
    this.cleanupRenderCache();

    // Emit rendering event
    this.emit('skinRendered', result);

    return result;
  } catch (error) {
    const errorResult: SkinRenderResult = {
      skinId,
      interfaceType,
      timestamp: Date.now(),
      success: false,
      error: isTemplumError(error) ? error : createTemplumError(
        `Render failed: ${error}`, 'render-error', 'runtime'
      )
    };

    this.emit('renderError', errorResult);
    return errorResult;
  }
}
```

**Step 4**: Theme Management

```typescript
async setActiveTheme(interfaceType: InterfaceType, themeId: string): Promise<void> {
  try {
    // Validate theme exists
    const theme = await this.getThemeById(themeId);
    if (!theme) {
      throw createTemplumError(`Theme not found: ${themeId}`, 'theme-not-found', 'validation');
    }

    // Update active theme mapping
    this.activeThemes.set(interfaceType, themeId);

    // Clear related cache entries
    this.clearCacheForInterface(interfaceType);

    // Emit theme change event
    this.emit('themeChanged', { interfaceType, themeId, timestamp: Date.now() });
  } catch (error) {
    throw isTemplumError(error) ? error : createTemplumError(
      `Failed to set theme: ${error}`, 'theme-error', 'runtime'
    );
  }
}
```

**Step 5**: Event-Driven Integration

```typescript
private initializePCLSkinIntegration(): void {
  // Listen for PCL rendering events
  this.pclRenderingAdapter.on('renderComplete', (result) => {
    this.emit('pclRenderComplete', result);
  });

  this.pclRenderingAdapter.on('renderError', (error) => {
    this.emit('pclRenderError', error);
  });

  // Initialize performance monitoring
  this.on('skinRendered', (result) => {
    this.updatePerformanceMetrics(result);
  });
}
```

#### Universal Skin Engine Pattern: Success Metrics

- **Code Reuse**: >70% reuse via PCL Rendering Adapter integration
- **Performance**: <200ms average render time, <5MB memory footprint
- **Compatibility**: Support for CLI, VSCode, and web interfaces
- **Version Management**: Automatic conflict detection and resolution
- **Cache Efficiency**: >80% cache hit rate for repeated renders

#### Universal Skin Engine Pattern: Anti-Patterns

- **Direct Rendering**: Don't bypass PCL adapter for custom rendering
- **Version Conflicts**: Always use version manager for registration
- **Memory Leaks**: Ensure proper cache cleanup and event listener management
- **Error Suppression**: Always emit error events for monitoring

#### Universal Skin Engine Pattern: Validation Checklist

- [ ] PCL Rendering Adapter properly integrated
- [ ] Version management handles conflicts correctly
- [ ] Event emission works for all operations
- [ ] Cache management prevents memory leaks
- [ ] Error handling uses TemplumError patterns
- [ ] Performance metrics are captured

#### Universal Skin Engine Pattern: Implementation Feedback

**Successfully Applied**: Universal Skin Engine integration, PCL rendering adapter, skin version management, theme consistency across interfaces

**Pattern Metadata**:

- **Files Using This Pattern**: `src/skin/universal-skin-engine.ts`, `src/skin/pcl-rendering-adapter.ts`, `src/skin/skin-version-manager.ts`
- **Integration Points**: PCL Rendering Adapter, Skin Version Manager, TemplumError system, Event emitters
- **Dependencies**: Event-driven architecture, PCL integration patterns, version management systems

// TODO: [TASK-PATTERN-001] Pattern: frontmatter-standardization | Complexity: 2 | Dependencies: pattern-template
// Context: Updated frontmatter to follow standardized template format with proper YAML structure and field naming
// Validation-Required: yaml-syntax, field-completeness, template-compliance
// Pattern-Info: { approach: "template-based-update", alternatives: "manual-formatting", trade-offs: "standardization-vs-custom-fields" }

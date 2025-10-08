/**
 * Universal Skin Engine - TypeScript API Definitions
 * 
 * Generated: 2025-08-21
 * Purpose: Complete TypeScript interface definitions for Universal Skin Engine implementation
 * Context: Phase 5 implementation support with full type safety and IntelliSense
 * Based on: Design specification v1.0, Phase 1-4 implementation patterns
 */

// ============================================================================
// Core Types and Enums - Now imported from unified definition
// ============================================================================

// ============================================================================
// Universal Skin Definition - Unified Import
// ============================================================================

// Migration Note (2025-09-01): Core UniversalSkinDefinition moved to universal-skin-definition.ts
// This maintains backward compatibility while using the unified definition

// Direct imports for types used within this file (fixes TS2304 errors)
import type {
  UniversalSkinDefinition,
  InterfaceType,
  ConflictResolutionStrategy,
  FeatureMatrix,
  PerformanceHints
} from './universal-skin-definition';
import type { ThemeMetricsSummary } from '../utils/service-utils';
export type { 
  UniversalSkinDefinition,
  InterfaceType,
  BackendType,
  ComponentState,
  CacheStrategy,
  ConflictResolutionStrategy,
  PCLCompatibility,
  SkinAssets,
  SkinInheritance,
  RenderingConfiguration,
  SkinPerformanceConfig,
  CachingStrategy,
  ValidationRules,
  BackendConfig,
  PerformanceHints,
  // Theme and component definitions
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
  ResponsiveConfig,
  AccessibilityConfig,
  // Asset definitions  
  IconAssetDefinition,
  IconDefinition,
  ImageDefinition,
  FontDefinition,
  SoundDefinition,
  // UI component definitions
  SkinViews,
  TreeViewDefinition,
  PanelDefinition,
  StatusBarDefinition,
  DecorationDefinition,
  SkinMenus,
  MenuDefinition,
  MenuItemDefinition,
  ContextMenuDefinition,
  SkinCommands,
  CommandDefinition,
  ParameterDefinition,
  HelpDefinition,
  HelpSection,
  CompletionDefinition,
  SkinWorkflows,
  WorkflowDefinition,
  WorkflowStepDefinition,
  WorkflowTemplate,
  // Legacy theme support
  SkinTheme,
  // Feature matrix definitions
  FeatureMatrix,
  VSCodeFeatures,
  CLIFeatures,
  CommandFeatures,
  SharedFeatures,
  // Rendering configuration
  InterfaceRenderingConfig,
  SkinOverride
} from './universal-skin-definition';

/**
 * Skin metadata with compatibility and requirements
 */
export interface SkinMetadata {
  // Identity - some properties moved to root level for implementation compatibility
  id?: string;                   // Optional since moved to root
  name?: string;                 // Optional since moved to root
  version?: string;              // Version compatibility - added for test alignment
  description: string;           // Human-readable description
  author?: string;               // Author information
  tags?: string[];               // Categorization tags
  
  // Compatibility and requirements - Interface alignment with core templum-types
  backend?: any;                 // Backend type compatibility with core templum-types
  compatibleInterfaces?: InterfaceType[]; // Interface alignment with core templum-types
  supportedInterfaces?: InterfaceType[];  // Renamed from targetInterfaces for implementation compatibility
  targetInterfaces?: InterfaceType[];    // Backward compatibility alias for supportedInterfaces
  backendService: string;        // Backend service identifier
  minimumVersion?: string;       // Minimum backend version required
  dependencies?: string[];       // Dependencies list
  
  // Feature support matrix
  features?: FeatureMatrix;      // Interface-specific feature availability
  performance?: PerformanceHints; // Optimization hints for renderers
  
  // Optional inheritance support
  parentSkin?: string;           // Parent skin for inheritance
}

// Feature interfaces now imported from unified definition

// ============================================================================
// Skin Component Interfaces - Now imported from unified definition
// ============================================================================

// ============================================================================
// Rendering and Engine Interfaces
// ============================================================================

export interface SkinRenderResult {
  success?: boolean; // Optional for compatibility
  skinId?: string;   // Alternative format support
  interface: string;
  theme?: string;    // Theme information
  metadata: {
    skinId: string;
    backendService: string;
    pclIntegration?: boolean;
    reusePercentage?: number;
    error?: string;
    // TASK-NEW-040: Fallback rendering metadata
    fallbackUsed?: boolean;
    fallbackReason?: string;
    originalError?: string;
    fallbackFailed?: boolean;
    themeMetrics?: ThemeMetricsSummary;
  };
  components: RenderedComponent[];
  performance: {
    renderTime: number;
    outputSize: number; // Required by implementation
    cacheHit: boolean;
  };
  output?: Record<string, any>; // Rendering output
  customization: Record<string, any>;
  inheritance: {
    parentSkin?: string;
    applied: boolean;
  };
  validation?: {
    valid: boolean;
    warnings: string[];
    errors: string[];
  };
  renderedContent?: {
    html?: string;
    cli?: string;
    layout?: any;
  };
}

export interface RenderedComponent {
  id: string;
  type: string;
  backend?: string;
  content?: any;
}

export interface RenderingContext {
  interface: InterfaceType;
  theme: string;
  preferences?: any;
  capabilities?: any;
  session?: any;
}

// ============================================================================
// Additional Required Interfaces for Implementation
// ============================================================================

// Theme and Asset Interfaces - Now imported from unified definition

// ============================================================================
// Universal Skin Engine Interface
// ============================================================================

export interface IUniversalSkinEngine {
  registerSkin(skinDefinition: UniversalSkinDefinition): Promise<void>;
  renderForInterface(
    skin: UniversalSkinDefinition,
    interfaceType: string,
    context: RenderingContext
  ): Promise<SkinRenderResult>;
  renderSkin(
    skinId: string,
    interfaceType: string,
    themeName: string,
    options?: any
  ): Promise<SkinRenderResult>;
  switchInterface(
    fromInterface: string,
    toInterface: string,
    preserveState?: boolean
  ): Promise<{ success: boolean; preservedState: boolean; switchTime?: number }>;
  setState(interfaceType: string, state: any): Promise<void>;
  getState(interfaceType: string): Promise<any>;
  cleanup?(): Promise<void>;
}

// ============================================================================
// Skin Versioning System Interfaces
// ============================================================================

/**
 * Semantic version representation with comparison utilities
 */
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string[];
  build?: string[];
  raw: string;
}

/**
 * Version compatibility rule definition
 */
export interface VersionCompatibilityRule {
  id: string;
  description: string;
  pattern: string; // semver pattern (e.g., "^1.2.0", "~2.1.0", ">=1.0.0 <2.0.0")
  systemVersion: string; // minimum system version required
  breaking?: boolean; // indicates breaking changes
  migrationRequired?: boolean; // requires migration for compatibility
}

/**
 * Version conflict information
 */
export interface VersionConflict {
  skinId: string;
  existingVersion: string;
  conflictingVersion: string;
  conflictType: 'major' | 'minor' | 'patch' | 'prerelease' | 'duplicate';
  resolution: ConflictResolutionStrategy;
  canAutoResolve: boolean;
}

/**
 * Migration strategy for version compatibility
 */
export interface MigrationStrategy {
  id: string;
  fromVersion: string; // version pattern to migrate from
  toVersion: string; // target version pattern
  strategy: 'automatic' | 'guided' | 'manual' | 'fallback';
  description: string;
  estimatedTime?: number; // estimated migration time in ms
  riskLevel: 'low' | 'medium' | 'high';
  migrationSteps?: MigrationStep[];
}

/**
 * Individual migration step
 */
export interface MigrationStep {
  id: string;
  description: string;
  type: 'transform' | 'validate' | 'backup' | 'notify';
  required: boolean;
  transformer?: (skin: UniversalSkinDefinition) => Promise<UniversalSkinDefinition>;
  validator?: (skin: UniversalSkinDefinition) => Promise<{ valid: boolean; errors: string[] }>;
}

/**
 * Version-aware skin registration request
 */
export interface SkinRegistrationRequest {
  skin: UniversalSkinDefinition;
  overrideExisting?: boolean;
  preferredResolution?: ConflictResolutionStrategy;
  validateCompatibility?: boolean;
  allowDowngrade?: boolean;
}

/**
 * Skin registration result with version information
 */
export interface SkinRegistrationResult {
  success: boolean;
  skinId: string;
  version: string;
  action: 'registered' | 'updated' | 'migrated' | 'rejected';
  conflicts?: VersionConflict[];
  migrations?: {
    strategy: MigrationStrategy;
    applied: boolean;
    duration?: number;
  }[];
  warnings?: string[];
  errors?: string[];
}

/**
 * Version-aware skin query parameters
 */
export interface SkinVersionQuery {
  skinId: string;
  versionPattern?: string; // semver pattern (e.g., "^1.0.0", "latest")
  exactVersion?: string; // specific version
  fallbackStrategy?: 'latest-compatible' | 'latest-stable' | 'system-default';
  includePrerelease?: boolean;
}

/**
 * Skin version information
 */
export interface SkinVersionInfo {
  version: SemanticVersion;
  isLatest: boolean;
  isStable: boolean;
  compatibilityLevel: 'full' | 'partial' | 'breaking' | 'incompatible';
  systemCompatibility: {
    supported: boolean;
    minimumSystemVersion?: string;
    warnings?: string[];
  };
  deprecation?: {
    deprecated: boolean;
    deprecationDate?: Date;
    replacementVersion?: string;
    sunsetDate?: Date;
  };
}

/**
 * Skin version manager service interface
 */
export interface ISkinVersionManager {
  // Version parsing and comparison
  parseVersion(version: string): SemanticVersion;
  compareVersions(v1: string | SemanticVersion, v2: string | SemanticVersion): number;
  satisfiesRange(version: string, range: string): boolean;
  
  // Compatibility validation
  validateCompatibility(skin: UniversalSkinDefinition, systemVersion?: string): Promise<{
    compatible: boolean;
    level: 'full' | 'partial' | 'breaking' | 'incompatible';
    issues: string[];
    recommendations: string[];
  }>;
  
  // Version resolution
  resolveVersion(query: SkinVersionQuery, availableVersions: Map<string, UniversalSkinDefinition>): Promise<{
    resolved: boolean;
    skin?: UniversalSkinDefinition;
    version?: string;
    fallbackUsed?: boolean;
    reason?: string;
  }>;
  
  // Conflict detection and resolution
  detectConflicts(
    existingSkin: UniversalSkinDefinition, 
    newSkin: UniversalSkinDefinition
  ): VersionConflict[];
  
  resolveConflicts(
    conflicts: VersionConflict[], 
    strategy: ConflictResolutionStrategy
  ): Promise<{
    resolutions: { conflict: VersionConflict; action: string; success: boolean }[];
    overallSuccess: boolean;
  }>;
  
  // Migration management
  findMigrationStrategy(fromVersion: string, toVersion: string): MigrationStrategy | null;
  applyMigration(skin: UniversalSkinDefinition, strategy: MigrationStrategy): Promise<{
    migrated: boolean;
    result?: UniversalSkinDefinition;
    duration?: number;
    errors?: string[];
  }>;
  
  // Version information
  getVersionInfo(skin: UniversalSkinDefinition, systemVersion?: string): Promise<SkinVersionInfo>;
  listAvailableVersions(skinId: string): SemanticVersion[];
  getLatestVersion(skinId: string, includePrerelease?: boolean): SemanticVersion | null;

  // Version registration management
  registerSkinVersion(skinId: string, version: SemanticVersion): void;
  unregisterSkinVersion(skinId: string, version: string): void;

  // Contract versioning
  getValidatorVersion(): string;

  // Advanced compatibility validation (TASK-SKIN-002)
  validateAdvancedCompatibility(
    skin: UniversalSkinDefinition, 
    targetInterface: InterfaceType,
    options?: AdvancedCompatibilityOptions
  ): Promise<AdvancedCompatibilityReport>;
}

// ============================================================================
// Advanced Compatibility Types (TASK-SKIN-002: Advanced Skin Compatibility Checks)
// ============================================================================

/**
 * Interface requirements definition for each interface type
 */
export interface InterfaceRequirements {
  interfaceType: InterfaceType;
  requiredComponents: string[]; // e.g., ['views', 'commands', 'menus']
  supportedFeatures: string[]; // features this interface can handle
  assetRequirements: AssetRequirements;
  performanceConstraints: PerformanceConstraints;
  minimumVersion?: string;
  description: string;
}

/**
 * Asset requirements for interface compatibility
 */
export interface AssetRequirements {
  requiredIcons?: string[]; // required icon names/paths
  supportedIconFormats: string[]; // e.g., ['svg', 'png']
  requiredFonts?: string[]; // required font families
  supportedImageFormats: string[]; // e.g., ['png', 'jpg', 'svg']
  maxAssetSize?: number; // maximum asset size in bytes
  requiredThemeProperties: string[]; // required theme color properties
}

/**
 * Performance constraints for interface compatibility
 */
export interface PerformanceConstraints {
  maxSkinSize?: number; // maximum skin definition size in bytes
  maxRenderTime?: number; // maximum rendering time in milliseconds
  maxMemoryUsage?: number; // maximum memory usage in MB
  maxStartupTime?: number; // maximum startup time in milliseconds
  maxAssetLoadTime?: number; // maximum asset loading time in milliseconds
  supportedComplexity: 'low' | 'medium' | 'high'; // rendering complexity support
}

/**
 * Options for advanced compatibility validation
 */
export interface AdvancedCompatibilityOptions {
  includeWarnings?: boolean; // include compatibility warnings
  validateAssets?: boolean; // validate asset existence and formats
  checkPerformance?: boolean; // perform performance compatibility checks
  crossInterfaceValidation?: boolean; // validate cross-interface compatibility
  strictMode?: boolean; // strict validation mode
}

/**
 * Comprehensive compatibility report
 */
export interface AdvancedCompatibilityReport {
  overall: 'compatible' | 'partially-compatible' | 'incompatible';
  skinId: string;
  targetInterface: InterfaceType;
  
  // Detailed compatibility results
  structuralCompatibility: StructuralCompatibilityResult;
  featureCompatibility: FeatureCompatibilityResult;
  assetCompatibility: AssetCompatibilityResult;
  performanceCompatibility: PerformanceCompatibilityResult;
  crossInterfaceCompatibility?: CrossInterfaceCompatibilityResult;
  
  // Summary information
  score: number; // compatibility score 0-100
  recommendations: string[];
  warnings: string[];
  errors: string[];
  
  // Additional metadata
  validationDate: Date;
  validationDuration: number; // milliseconds
  validatorVersion: string;
}

/**
 * Structural compatibility validation result
 */
export interface StructuralCompatibilityResult {
  compatible: boolean;
  requiredComponents: { component: string; present: boolean; valid: boolean }[];
  missingComponents: string[];
  invalidComponents: { component: string; issues: string[] }[];
  score: number; // 0-100
}

/**
 * Feature compatibility validation result
 */
export interface FeatureCompatibilityResult {
  compatible: boolean;
  supportedFeatures: string[];
  unsupportedFeatures: string[];
  partiallySupported: { feature: string; limitations: string[] }[];
  featureMatrix: Record<string, 'supported' | 'partial' | 'unsupported'>;
  score: number; // 0-100
}

/**
 * Asset compatibility validation result
 */
export interface AssetCompatibilityResult {
  compatible: boolean;
  validAssets: string[];
  missingAssets: string[];
  invalidAssets: { asset: string; issues: string[] }[];
  oversizedAssets: { asset: string; size: number; limit: number }[];
  unsupportedFormats: { asset: string; format: string; supportedFormats: string[] }[];
  score: number; // 0-100
}

/**
 * Performance compatibility validation result
 */
export interface PerformanceCompatibilityResult {
  compatible: boolean;
  skinSize: { actual: number; limit?: number; withinLimits: boolean };
  estimatedRenderTime: { estimated: number; limit?: number; withinLimits: boolean };
  estimatedMemoryUsage: { estimated: number; limit?: number; withinLimits: boolean };
  complexityLevel: 'low' | 'medium' | 'high';
  complexitySupported: boolean;
  performanceWarnings: string[];
  score: number; // 0-100
}

/**
 * Cross-interface compatibility validation result
 */
export interface CrossInterfaceCompatibilityResult {
  compatible: boolean;
  testedInterfaces: InterfaceType[];
  compatibleInterfaces: InterfaceType[];
  incompatibleInterfaces: { interface: InterfaceType; issues: string[] }[];
  sharedFeatures: string[];
  interfaceSpecificFeatures: Record<string, string[]>;
  portabilityScore: number; // 0-100 - how portable across interfaces
}

/**
 * Interface capability matrix - defines what each interface supports
 */
export interface InterfaceCapabilityMatrix {
  [interfaceType: string]: {
    supportedComponents: string[];
    supportedFeatures: string[];
    assetCapabilities: AssetRequirements;
    performanceProfile: PerformanceConstraints;
    specializations: string[]; // interface-specific features
  };
}

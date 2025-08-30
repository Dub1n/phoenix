/**
 * Universal Skin Engine - TypeScript API Definitions
 * 
 * Generated: 2025-08-21
 * Purpose: Complete TypeScript interface definitions for Universal Skin Engine implementation
 * Context: Phase 5 implementation support with full type safety and IntelliSense
 * Based on: Design specification v1.0, Phase 1-4 implementation patterns
 */

// ============================================================================
// Core Types and Enums
// ============================================================================

export type InterfaceType = 'vscode' | 'cli' | 'command';
export type ComponentState = 'idle' | 'loading' | 'active' | 'error' | 'disabled';
export type CacheStrategy = 'lru' | 'lfu' | 'ttl';
export type ConflictResolutionStrategy = 'last-writer-wins' | 'merge-compatible' | 'user-intervention';

// ============================================================================
// Universal Skin Definition Interfaces
// ============================================================================

/**
 * Complete skin definition for multi-interface rendering
 * Single definition supports VSCode, CLI, and Command interfaces
 */
export interface UniversalSkinDefinition {
  // Core identification - aligned with implementation
  id: string;
  name: string;
  description?: string;
  version: string;
  
  // PCL compatibility features
  pclCompatibility: PCLCompatibility;
  
  // Core metadata and identification
  metadata: SkinMetadata;
  
  // Interface-specific definitions
  views?: SkinViews;           // VSCode TreeViews, panels
  menus?: SkinMenus;           // CLI menu structures  
  commands?: SkinCommands;     // Command-line commands
  workflows?: SkinWorkflows;   // Multi-step automation
  
  // Cross-interface features
  shortcuts?: Record<string, string>;
  themes: Record<string, ThemeDefinition>; // Multiple themes support
  components: Record<string, ComponentSkin>;
  assets: SkinAssets;
  
  // Backend and inheritance
  backendConfig?: BackendConfig;
  inheritance: SkinInheritance;
  
  // Rendering and performance
  rendering: RenderingConfiguration;
  performance: SkinPerformanceConfig;
  
  // Validation
  caching?: CachingStrategy;
  validation?: ValidationRules;
}

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

/**
 * Feature availability matrix per interface type
 */
export interface FeatureMatrix {
  vscode: VSCodeFeatures;
  cli: CLIFeatures;
  command: CommandFeatures;
  shared: SharedFeatures;
}

export interface VSCodeFeatures {
  treeViews: boolean;
  panels: boolean;
  statusBar: boolean;
  decorations: boolean;
  commands: boolean;
  contextMenus: boolean;
}

export interface CLIFeatures {
  interactiveMenus: boolean;
  keyboardNavigation: boolean;
  progressIndicators: boolean;
  inputValidation: boolean;
  sessionManagement: boolean;
}

export interface CommandFeatures {
  flagParsing: boolean;
  pipeSupport: boolean;
  completions: boolean;
  helpGeneration: boolean;
  aliasSupport: boolean;
}

export interface SharedFeatures {
  workflows: boolean;
  theming: boolean;
  caching: boolean;
  stateSync: boolean;
  errorHandling: boolean;
}

// ============================================================================
// Skin Component Interfaces
// ============================================================================

export interface SkinViews {
  treeViews?: TreeViewDefinition[];
  panels?: PanelDefinition[];
  statusBar?: StatusBarDefinition[];
  decorations?: DecorationDefinition[];
}

export interface TreeViewDefinition {
  id: string;
  name: string;
  title?: string;
  description?: string;
  icon?: string;
  dataProvider: string;
  refreshCommand?: string;
}

export interface PanelDefinition {
  id: string;
  name: string;
  type: 'webview' | 'tree' | 'form';
  showOnStartup?: boolean;
  retainContextWhenHidden?: boolean;
}

export interface StatusBarDefinition {
  id: string;
  text: string;
  command?: string;
  tooltip?: string;
  priority?: number;
}

export interface DecorationDefinition {
  id: string;
  type: 'line' | 'range' | 'gutter';
  color?: string;
  backgroundColor?: string;
}

export interface SkinMenus {
  main: MenuDefinition;
  submenus?: Record<string, MenuDefinition>;
  contexts?: ContextMenuDefinition[];
}

export interface MenuDefinition {
  id: string;
  title: string;
  description?: string;
  items: MenuItemDefinition[];
}

export interface MenuItemDefinition {
  id: string;
  label: string;
  description?: string;
  command?: string;
  shortcut?: string;
  submenu?: string;
  type?: 'command' | 'submenu' | 'separator';
}

export interface ContextMenuDefinition {
  id: string;
  when: string;
  items: MenuItemDefinition[];
}

export interface SkinCommands {
  primary: CommandDefinition[];
  aliases?: Record<string, string>;
  help: HelpDefinition;
  completions?: CompletionDefinition[];
}

export interface CommandDefinition {
  id: string;
  name: string;
  title?: string;
  description: string;
  command?: string;
  category?: string;
  parameters?: ParameterDefinition[];
}

export interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  description?: string;
  default?: any;
}

export interface HelpDefinition {
  format: 'markdown' | 'text';
  sections: HelpSection[];
}

export interface HelpSection {
  title: string;
  content: string;
}

export interface CompletionDefinition {
  command: string;
  completions: string[];
}

export interface SkinWorkflows {
  workflows?: WorkflowDefinition[];
  templates?: WorkflowTemplate[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  command: string;
  waitForCompletion?: boolean;
  parameters?: Record<string, any>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  parameters: ParameterDefinition[];
  workflow: WorkflowDefinition;
}

export interface SkinTheme {
  name: string;
  colors: {
    primary: string;
    secondary?: string;
    success?: string;
    warning?: string;
    error?: string;
    background: {
      primary: string;
      secondary?: string;
    };
    text: {
      primary: string;
      secondary?: string;
    };
  };
  typography?: {
    fontFamily?: string;
    fontSize?: Record<string, string>;
  };
}

// Enhanced Backend Configuration for Generic Connection Factory
// Supports the full connection specification from TASK-GENERIC-004
export interface BackendConfig {
  // Basic identification (backward compatibility)
  service: string;
  version: string;
  
  // Enhanced connection specification
  protocol: 'ipc' | 'http' | 'websocket' | 'grpc';
  endpoint: string;
  
  // Enhanced authentication options
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth';
    credentials?: Record<string, string>;
    required?: boolean;
  };
  
  // Connection behavior configuration
  timeout?: number;
  retries?: number;
  keepAlive?: boolean;
  
  // Service discovery endpoints
  healthEndpoint?: string;
  capabilitiesEndpoint?: string;
  
  // Protocol-specific options
  options?: { [key: string]: any };
  
  // Legacy support
  endpoints?: Record<string, string>;
}

export interface CachingStrategy {
  strategy: CacheStrategy;
  maxAge: number;
  maxSize: number;
}

export interface ValidationRules {
  schema: string;
  strictMode?: boolean;
  validateOnLoad?: boolean;
}

export interface PerformanceHints {
  loadingStrategy?: 'eager' | 'lazy' | 'progressive';
  cacheStrategy?: CacheStrategy;
  preloadComponents?: string[];
  criticalPath?: string[];
  renderingHints?: Record<string, any>;
}

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

// PCL Compatibility Interface
export interface PCLCompatibility {
  enabled: boolean; // Interface alignment with core templum-types
  version: string;
  reusePercentage: number;
  inheritancePatterns: string[];
  optimizations: string[];
}

// Theme Definition (expanded from SkinTheme)
export interface ThemeDefinition {
  name: string;
  type: 'light' | 'dark' | 'high-contrast' | 'custom';
  colors: ColorPalette;
  typography: Typography;
  spacing: SpacingSystem;
  borders: BorderSystem;
  shadows: ShadowSystem;
  animations: AnimationSystem;
  customProperties: Record<string, any>;
  variants?: Record<string, Partial<ThemeDefinition>>;
}

export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;
  semantic: {
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    info: ColorScale;
  };
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
    overlay: string;
  };
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
  };
}

export interface ColorScale {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; // Base color
  600: string; 700: string; 800: string; 900: string;
}

export interface Typography {
  fontFamilies: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  fontSizes: Record<string, string>;
  fontWeights: Record<string, number>;
  lineHeights: Record<string, number>;
  letterSpacing: Record<string, string>;
}

export interface SpacingSystem {
  unit: number; // Base spacing unit in pixels
  scale: Record<string, number>; // Multipliers for the base unit
}

export interface BorderSystem {
  radii: Record<string, string>;
  widths: Record<string, string>;
  styles: Record<string, string>;
}

export interface ShadowSystem {
  elevations: Record<string, string>;
  colors: Record<string, string>;
}

export interface AnimationSystem {
  durations: Record<string, string>;
  easings: Record<string, string>;
  transitions: Record<string, string>;
}

// Component and Asset Interfaces
export interface ComponentSkin {
  name: string;
  type: 'container' | 'input' | 'display' | 'navigation' | 'feedback' | 'overlay';
  variants: Record<string, ComponentVariant>;
  states: Record<string, ComponentState>;
  responsive: ResponsiveConfig;
  accessibility: AccessibilityConfig;
  pclMapping: {
    pclComponent?: string;
    reuseLevel: 'high' | 'medium' | 'low';
    adaptationRequired: boolean;
  };
}

export interface ComponentVariant {
  styles: Record<string, any>;
  tokens: Record<string, string>;
  modifiers: Record<string, any>;
}

export interface ResponsiveConfig {
  breakpoints: Record<string, string>;
  adaptiveStyles: Record<string, Record<string, any>>;
  fluidScaling: boolean;
}

export interface AccessibilityConfig {
  focusStyles: Record<string, any>;
  highContrastMode: Record<string, any>;
  screenReaderSupport: {
    ariaLabels: Record<string, string>;
    descriptions: Record<string, string>;
  };
  keyboardNavigation: {
    tabOrder: number;
    shortcuts: Record<string, string>;
  };
}

export interface SkinAssets {
  icons: Record<string, IconDefinition>;
  images: Record<string, ImageDefinition>;
  fonts: Record<string, FontDefinition>;
  sounds: Record<string, SoundDefinition>;
}

export interface IconDefinition {
  source: string;
  format: 'svg' | 'font' | 'png' | 'webp';
  variants: Record<string, string>;
  sizing: Record<string, string>;
}

export interface ImageDefinition {
  source: string;
  format: 'png' | 'jpg' | 'webp' | 'svg';
  variants: Record<string, string>;
  responsive: boolean;
}

export interface FontDefinition {
  family: string;
  source: string;
  weights: number[];
  formats: string[];
}

export interface SoundDefinition {
  source: string;
  format: 'mp3' | 'wav' | 'ogg';
  variants: Record<string, string>;
}

// Inheritance and Configuration
export interface SkinInheritance {
  parentSkins: string[];
  baseTheme?: string;
  mixins: string[];
  overrides: SkinOverride[];
}

export interface SkinOverride {
  target: string; // CSS selector or component path
  property: string;
  value: any;
  condition?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface RenderingConfiguration {
  engine: 'css' | 'styled-components' | 'emotion' | 'tailwind' | 'css-in-js';
  output: 'css' | 'js' | 'json' | 'tokens';
  optimizations: {
    treeshaking: boolean;
    minification: boolean;
    caching: boolean;
    lazyLoading: boolean;
  };
  targets: Record<string, InterfaceRenderingConfig>;
}

export interface InterfaceRenderingConfig {
  interface: 'vscode' | 'cli' | 'command' | 'web';
  renderer: string;
  adaptations: Record<string, any>;
  constraints: {
    colorDepth: number;
    maxFileSize: number;
    supportedFeatures: string[];
  };
}

export interface SkinPerformanceConfig {
  loadingStrategy: 'eager' | 'lazy' | 'progressive';
  cachingPolicy: 'memory' | 'disk' | 'hybrid';
  compressionLevel: number; // 1-9
  criticalPath: string[];
  metrics: {
    targetLoadTime: number; // ms
    maxMemoryUsage: number; // MB
    renderBudget: number; // ms per frame
  };
}

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
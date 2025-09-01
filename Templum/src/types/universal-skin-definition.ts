/**
 * Unified UniversalSkinDefinition - Single Source of Truth
 * 
 * Migration Note (2025-09-01): This replaces the dual definitions in
 * templum-types.ts and universal-skin-engine-types.ts
 * All components should import from this file going forward.
 * 
 * Generated: 2025-09-01
 * Purpose: Unified interface definition supporting both minimal and full-featured backends
 * Architecture: Optional properties pattern for progressive enhancement
 */

// ============================================================================
// Core Types and Enums
// ============================================================================

export type InterfaceType = 'vscode' | 'cli' | 'command';
export type BackendType = 'pcl' | 'litany' | 'haruspex';
export type ComponentState = 'idle' | 'loading' | 'active' | 'error' | 'disabled';
export type CacheStrategy = 'lru' | 'lfu' | 'ttl';
export type ConflictResolutionStrategy = 'last-writer-wins' | 'merge-compatible' | 'user-intervention';

// ============================================================================
// Unified Universal Skin Definition Interface
// ============================================================================

/**
 * Unified Universal Skin Definition - Single source of truth
 * Supports both minimal backends (skin-only) and full-featured backends
 * Uses optional properties pattern for progressive enhancement
 */
export interface UniversalSkinDefinition {
  // ============================================================================
  // REQUIRED CORE PROPERTIES - Minimal viable skin
  // ============================================================================
  
  /** Unique skin identifier */
  id: string;
  
  /** Human-readable skin name */
  name: string;
  
  /** Semantic version string */
  version: string;
  
  /** Core metadata (combines both legacy interfaces for compatibility) */
  metadata: {
    /** Skin identifier (backward compatibility) */
    id: string;
    
    /** Skin name (backward compatibility) */
    name: string;
    
    /** Version (backward compatibility) */
    version: string;
    
    /** Backend type classification */
    backend: BackendType;
    
    /** Backend service identifier */
    backendService: string;
    
    /** Compatible interface types */
    compatibleInterfaces: InterfaceType[];
    
    /** Optional description */
    description?: string;
    
    /** Optional author information */
    author?: string;
    
    /** Optional categorization tags */
    tags?: string[];
    
    /** Optional minimum backend version */
    minimumVersion?: string;
    
    /** Optional dependencies */
    dependencies?: string[];
    
    /** Optional feature support matrix */
    features?: FeatureMatrix;
    
    /** Optional performance hints */
    performance?: PerformanceHints;
    
    /** Optional parent skin for inheritance */
    parentSkin?: string;
    
    /** Optional supported interfaces (alias for compatibleInterfaces) */
    supportedInterfaces?: InterfaceType[];
    
    /** Optional target interfaces (backward compatibility) */
    targetInterfaces?: InterfaceType[];
  };

  // ============================================================================
  // OPTIONAL ENHANCEMENT PROPERTIES - Progressive feature support
  // ============================================================================
  
  /** Optional skin description (root level for convenience) */
  description?: string;
  
  /** Optional PCL compatibility configuration */
  pclCompatibility?: PCLCompatibility;
  
  /** Optional VSCode visual interface definitions */
  views?: SkinViews;
  
  /** Optional CLI interactive menu definitions */
  menus?: SkinMenus;
  
  /** Optional command interface definitions */
  commands?: SkinCommands;
  
  /** Optional multi-step workflow definitions */
  workflows?: SkinWorkflows;
  
  /** Optional cross-interface keyboard shortcuts */
  shortcuts?: Record<string, string>;
  
  /** Optional theme definitions (multiple themes support) */
  themes?: Record<string, ThemeDefinition>;
  
  /** Optional legacy theme support (backward compatibility) */
  theme?: SkinTheme;
  
  /** Optional component definitions */
  components?: Record<string, ComponentSkin>;
  
  /** Optional asset definitions (icons, images, fonts, sounds) */
  assets?: SkinAssets;
  
  /** Optional backend connection configuration */
  backendConfig?: BackendConfig;
  
  /** Optional inheritance and composition configuration */
  inheritance?: SkinInheritance;
  
  /** Optional rendering engine configuration */
  rendering?: RenderingConfiguration;
  
  /** Optional performance optimization configuration */
  performance?: SkinPerformanceConfig;
  
  /** Optional caching strategy configuration */
  caching?: CachingStrategy;
  
  /** Optional validation rules */
  validation?: ValidationRules;
}

// ============================================================================
// Supporting Interface Definitions
// ============================================================================

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

export interface PerformanceHints {
  loadingStrategy?: 'eager' | 'lazy' | 'progressive';
  cacheStrategy?: CacheStrategy;
  preloadComponents?: string[];
  criticalPath?: string[];
  renderingHints?: Record<string, any>;
}

export interface PCLCompatibility {
  enabled: boolean;
  version: string;
  reusePercentage: number;
  inheritancePatterns: string[];
  optimizations: string[];
  features?: string[];
}

// ============================================================================
// UI Component Definitions
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
  showCollapseAll?: boolean;
  canSelectMany?: boolean;
  contextMenus?: ContextMenuDefinition[];
  onSelectionChange?: string;
  icons?: IconDefinition;
}

export interface PanelDefinition {
  id: string;
  name: string;
  type: 'webview' | 'tree' | 'form' | 'custom';
  showOnStartup?: boolean;
  retainContextWhenHidden?: boolean;
  viewColumn?: number;
  preserveFocus?: boolean;
  enableScripts?: boolean;
  retainContext?: boolean;
  contentUrl?: string;
  messageHandler?: string;
}

export interface StatusBarDefinition {
  id: string;
  text: string;
  command?: string;
  tooltip?: string;
  priority?: number;
  alignment?: 'left' | 'right';
}

export interface DecorationDefinition {
  id: string;
  type: 'line' | 'range' | 'gutter';
  color?: string;
  backgroundColor?: string;
}

export interface SkinMenus {
  main?: MenuDefinition;
  submenus?: Record<string, MenuDefinition>;
  contexts?: ContextMenuDefinition[];
  // Legacy support for object-style menus
  [menuId: string]: MenuDefinition | Record<string, MenuDefinition> | ContextMenuDefinition[] | undefined;
}

export interface MenuDefinition {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  items: MenuItemDefinition[];
  theme?: SkinTheme;
  navigation?: NavigationDefinition;
}

export interface MenuItemDefinition {
  id: string;
  label: string;
  description?: string;
  action?: string;
  command?: string;
  shortcuts?: string[];
  shortcut?: string;
  submenu?: string | MenuItemDefinition[];
  type?: 'action' | 'command' | 'submenu' | 'separator' | 'workflow';
  icon?: string;
  enabled?: boolean;
  visible?: boolean;
}

export interface ContextMenuDefinition {
  id: string;
  title?: string;
  when?: string;
  command?: string;
  group?: string;
  items?: MenuItemDefinition[];
}

// ============================================================================
// Command and Workflow Definitions
// ============================================================================

export interface SkinCommands {
  primary?: CommandDefinition[];
  aliases?: Record<string, string>;
  help?: HelpDefinition;
  completions?: CompletionDefinition[];
  // Legacy support for object-style commands
  [commandId: string]: CommandDefinition | CommandDefinition[] | Record<string, string> | HelpDefinition | CompletionDefinition[] | undefined;
}

export interface CommandDefinition {
  id?: string;
  name?: string;
  title: string;
  description: string;
  handler?: string;
  command?: string;
  category?: string;
  parameters?: ParameterDefinition[];
  shortcuts?: string[];
  type?: string;
  workflow?: WorkflowDefinition;
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
  // Legacy support for object-style workflows
  [workflowId: string]: WorkflowDefinition | WorkflowDefinition[] | WorkflowTemplate[] | undefined;
}

export interface WorkflowDefinition {
  id?: string;
  name?: string;
  title: string;
  description: string;
  steps: WorkflowStepDefinition[];
  conditions?: WorkflowCondition[];
  rollback?: RollbackDefinition;
}

export interface WorkflowStepDefinition {
  id: string;
  command: string;
  description?: string;
  args?: any[];
  condition?: string;
  onError?: 'stop' | 'continue' | 'retry';
  timeout?: number;
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

export interface WorkflowCondition {
  condition: string;
  action: string;
}

export interface RollbackDefinition {
  steps: WorkflowStepDefinition[];
  condition: string;
}

// ============================================================================
// Theme and Asset Definitions
// ============================================================================

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

// Legacy theme support
export interface SkinTheme {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  foreground: string;
}

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
  icons?: Record<string, IconAssetDefinition>;
  images?: Record<string, ImageDefinition>;
  fonts?: Record<string, FontDefinition>;
  sounds?: Record<string, SoundDefinition>;
}

export interface IconAssetDefinition {
  source: string;
  format: 'svg' | 'font' | 'png' | 'webp';
  variants: Record<string, string>;
  sizing: Record<string, string>;
}

export interface IconDefinition {
  light: string;
  dark: string;
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

// ============================================================================
// Backend and Configuration Definitions
// ============================================================================

export interface BackendConfig {
  // Basic identification (backward compatibility)
  service: string;
  version: string;
  
  // Enhanced connection specification
  protocol: 'ipc' | 'http' | 'websocket';
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
  
  // Service capabilities defined in skin
  capabilities?: string[];
  
  // Service discovery endpoints
  healthEndpoint?: string;
  capabilitiesEndpoint?: string;
  versionEndpoint?: string;
  
  // Protocol-specific options
  options?: { [key: string]: any };
  
  // Legacy support
  endpoints?: Record<string, string>;
}

export interface SkinInheritance {
  parentSkins?: string[];
  parent?: string;
  baseTheme?: string;
  mixins?: string[];
  overrides?: SkinOverride[];
}

export interface SkinOverride {
  target: string; // CSS selector or component path
  property: string;
  value: any;
  condition?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface RenderingConfiguration {
  engine?: 'css' | 'styled-components' | 'emotion' | 'tailwind' | 'css-in-js';
  output?: 'css' | 'js' | 'json' | 'tokens';
  mode?: 'standard' | 'optimized' | 'compatibility';
  caching?: boolean;
  lazyLoading?: boolean;
  optimizations?: {
    treeshaking: boolean;
    minification: boolean;
    caching: boolean;
    lazyLoading: boolean;
  };
  targets?: Record<string, InterfaceRenderingConfig>;
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
  enableOptimization?: boolean;
  cacheTimeout?: number;
  maxConcurrentRenders?: number;
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

export interface NavigationDefinition {
  canGoBack?: boolean;
  canGoForward?: boolean;
  breadcrumbs?: string[];
}
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
  description: string;           // Human-readable description
  author?: string;               // Author information
  tags?: string[];               // Categorization tags
  
  // Compatibility and requirements
  supportedInterfaces: InterfaceType[];  // Renamed from targetInterfaces for implementation compatibility
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

export interface BackendConfig {
  service: string;
  version: string;
  endpoints: Record<string, string>;
  authentication?: {
    type: 'none' | 'api-key' | 'oauth';
    required?: boolean;
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
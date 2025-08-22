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
  // Core metadata and identification
  metadata: SkinMetadata;
  
  // Interface-specific definitions
  views: SkinViews;           // VSCode TreeViews, panels
  menus: SkinMenus;           // CLI menu structures  
  commands: SkinCommands;     // Command-line commands
  workflows: SkinWorkflows;   // Multi-step automation
  
  // Cross-interface features
  shortcuts: Record<string, string>;
  theme: SkinTheme;
  backendConfig: BackendConfig;
  
  // Performance and validation
  caching: CachingStrategy;
  validation: ValidationRules;
}

/**
 * Skin metadata with compatibility and requirements
 */
export interface SkinMetadata {
  // Identity
  id: string;                    // Unique identifier (e.g., 'haruspex-analysis')
  name: string;                  // Display name
  version: string;               // Semantic version
  description: string;           // Human-readable description
  
  // Compatibility and requirements
  targetInterfaces: InterfaceType[];  // ['vscode', 'cli', 'command']
  backendService: string;        // Backend service identifier
  minimumVersion?: string;       // Minimum backend version required
  
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
  items: MenuItemDefinition[];
}

export interface MenuItemDefinition {
  id: string;
  label: string;
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
  description: string;
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
  success: boolean;
  interface: string;
  metadata: {
    skinId: string;
    backendService: string;
  };
  components: RenderedComponent[];
  performance: {
    renderTime: number;
    cacheHit: boolean;
  };
  customization: Record<string, any>;
  inheritance: {
    parentSkin?: string;
    applied: boolean;
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
  preferences: any;
  capabilities: any;
  session: any;
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
  switchInterface(
    fromInterface: string,
    toInterface: string,
    preserveState?: boolean
  ): Promise<{ success: boolean; preservedState: boolean; switchTime?: number }>;
  setState(interfaceType: string, state: any): Promise<void>;
  getState(interfaceType: string): Promise<any>;
  cleanup?(): Promise<void>;
}
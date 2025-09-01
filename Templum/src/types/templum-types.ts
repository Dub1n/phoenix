/**---
 * title: [Templum Types - Core Type Definitions]
 * tags: [Types, Interfaces, TypeScript, Core]
 * provides: [Type Definitions, Interface Contracts, Data Structures]
 * requires: [TypeScript]
 * description: [Comprehensive type definitions for Templum universal interface orchestrator]
 * ---*/

// Migration Note (2025-09-01): Core types moved to universal-skin-definition.ts
// Import and re-export for backward compatibility
import { 
  UniversalSkinDefinition,
  BackendType,
  InterfaceType,
  PCLCompatibility,
  SkinAssets,
  SkinInheritance,
  RenderingConfiguration,
  SkinPerformanceConfig
} from './universal-skin-definition';

// Re-export imported types for backward compatibility
export { 
  UniversalSkinDefinition,
  BackendType,
  InterfaceType,
  PCLCompatibility,
  SkinAssets,
  SkinInheritance,
  RenderingConfiguration,
  SkinPerformanceConfig
};

// Configuration interfaces
export interface TemplumConfiguration {
  maxConcurrentSessions?: number;
  sessionTimeoutMs?: number;
  enableHealthMonitoring?: boolean;
  performanceMetrics?: boolean;
  backendDiscovery?: {
    enabled: boolean;
    interval: number;
  };
}

// Interface adapter base contract
export interface InterfaceAdapter {
  getInterfaceType(): InterfaceType;
  applySkin(skinDefinition: UniversalSkinDefinition): Promise<void>;
  syncState(stateUpdate: StateUpdate): Promise<void>;
  dispose(): Promise<void>;
  getStatus(): InterfaceAdapterStatus;
}

// Command execution interfaces
export interface CommandContext {
  sessionId?: string;
  originalInput?: string;
  commandDef?: any;
  [key: string]: any;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  source?: InterfaceType;
  timestamp?: number;
  executionTime?: number;
  context?: CommandContext;
  metadata?: {
    backendId?: string;
    routing?: string;
    executionMode?: string;
    [key: string]: any;
  };
}

export interface CommandDefinition {
  title: string;
  description: string;
  handler: string;
  shortcuts?: string[];
  type?: string;
  workflow?: WorkflowDefinition;
}

// State management interfaces
export interface StateUpdate {
  timestamp: number;
  globalState?: any;
  sessionState?: any;
  treeViewUpdates?: Record<string, TreeViewUpdate>;
  webviewUpdates?: Record<string, WebviewUpdate>;
  menuUpdates?: Record<string, MenuStateUpdate>;
  statusUpdates?: Record<string, StatusUpdate>;
  commandResult?: any;
  notifications?: NotificationUpdate[];
}

export interface StateSubscriber {
  id: string;
  onStateUpdate(stateUpdate: StateUpdate): Promise<void>;
}

// UI Component Definitions
export interface TreeViewDefinition {
  id: string;
  title: string;
  description?: string;
  showCollapseAll?: boolean;
  canSelectMany?: boolean;
  contextMenus?: ContextMenuDefinition[];
  onSelectionChange?: string;
  dataProvider: string;
  icons?: IconDefinition;
}

export interface PanelDefinition {
  id: string;
  title: string;
  type: 'webview' | 'custom';
  viewColumn?: number;
  preserveFocus?: boolean;
  enableScripts?: boolean;
  retainContext?: boolean;
  contentUrl?: string;
  messageHandler?: string;
}

export interface MenuDefinition {
  title: string;
  subtitle?: string;
  items: MenuItemDefinition[];
  theme?: SkinTheme;
  navigation?: NavigationDefinition;
}

export interface MenuItemDefinition {
  id: string;
  label: string;
  description?: string;
  action: string;
  shortcuts?: string[];
  type?: 'action' | 'submenu' | 'separator' | 'workflow';
  icon?: string;
  enabled?: boolean;
  visible?: boolean;
  submenu?: MenuItemDefinition[];
}

export interface WorkflowDefinition {
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
}

// System status interfaces
export interface TemplumSystemStatus {
  // Root-level properties for extension compatibility
  health?: 'healthy' | 'warning' | 'error';
  activeBackends?: string[];
  activeInterfaces?: InterfaceType[];
  
  coreEngine: {
    initialized: boolean;
    activeInterfaces: InterfaceType[];
    loadedSkins: string[];
    backendConnections: BackendConnectionStatus;
  };
  stateManager: StateManagerStatus;
  skinEngine: SkinEngineStatus;
  performance: PerformanceMetrics;
}

export interface BackendConnectionStatus {
  totalConnections: number;
  healthyConnections: number;
  backends: {
    [backend in BackendType]?: {
      connected: boolean;
      health: 'healthy' | 'unhealthy' | 'error';
      lastCheck: number;
      lastError?: string;
      capabilities?: string[];
      responseTime?: number;
      version?: string;
    };
  };
}

export interface StateManagerStatus {
  synchronized: boolean;
  globalState: {
    lastModified: number;
    backendStates: string[];
  };
  sessionState: {
    startTime: number;
    totalCommands: number;
    lastCommand: string;
  };
  subscribers: number;
  historySize: number;
  persistence: any;
}

export interface SkinEngineStatus {
  cachedSkins: number;
  renderers: {
    vscode: any;
    cli: any;
    command: any;
  };
  performance: {
    cacheHitRate: number;
    averageRenderTime: number;
  };
}

export interface InterfaceAdapterStatus {
  active: boolean;
  [key: string]: any;
}

export interface PerformanceMetrics {
  memory: {
    heapUsed: number;
    rss: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  interfaces: {
    [key in InterfaceType]?: {
      responseTime: number;
      lastActivity: number;
      [key: string]: any;
    };
  };
}

// Update type interfaces
export interface TreeViewUpdate {
  refreshData?: any;
  expandedNodes?: string[];
  selectedNodes?: string[];
}

export interface WebviewUpdate {
  type: string;
  payload: any;
}

export interface MenuStateUpdate {
  itemStates?: Record<string, any>;
  navigationState?: Record<string, any>;
  refreshRequired?: boolean;
}

export interface StatusUpdate {
  text: string;
  tooltip?: string;
  color?: string;
  priority?: string;
}

export interface NotificationUpdate {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
}

// Supporting interfaces
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

export interface StatusBarDefinition {
  id: string;
  text: string;
  tooltip?: string;
  command?: string;
  alignment?: 'left' | 'right';
  priority?: number;
}

export interface ContextMenuDefinition {
  id: string;
  title: string;
  command: string;
  group?: string;
}

export interface IconDefinition {
  light: string;
  dark: string;
}

export interface NavigationDefinition {
  canGoBack?: boolean;
  canGoForward?: boolean;
  breadcrumbs?: string[];
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
// Error Handling and Type Safety
// ============================================================================

/**
 * Standardized error types for consistent error handling across Templum
 */
export interface TemplumError extends Error {
  code: string;
  category: 'validation' | 'runtime' | 'integration' | 'configuration' | 'network';
  timestamp: number;
  context?: Record<string, any>;
  originalError?: Error;
}

export interface ComponentError extends TemplumError {
  componentId: string;
  componentType: string;
  operationType: string;
}

export interface ValidationError extends TemplumError {
  field: string;
  value: any;
  constraint: string;
}

export interface IntegrationError extends TemplumError {
  service: string;
  endpoint?: string;
  statusCode?: number;
  retryable: boolean;
}

export interface NetworkError extends TemplumError {
  service: string;
  timeout: number;
  retryCount: number;
}

/**
 * Type guard for proper error handling in catch blocks
 */
export function isTemplumError(error: unknown): error is TemplumError {
  return error instanceof Error && 'code' in error && 'category' in error;
}

/**
 * Utility to create standardized error objects
 */
export function createTemplumError(
  message: string, 
  code: string, 
  category: TemplumError['category'],
  context?: Record<string, any>
): TemplumError {
  const error = new Error(message) as TemplumError;
  error.code = code;
  error.category = category;
  error.timestamp = Date.now();
  error.context = context;
  return error;
}

// ============================================================================
// Signal and Event Type System
// ============================================================================

/**
 * Standardized signal types for event emitter system
 */
export type Signals = 
  | 'backend-integration:metrics'
  | 'backend-integration:error'
  | 'state-sync:metrics'
  | 'state-sync:error' 
  | 'state-sync:update'
  | 'skin-engine:render'
  | 'skin-engine:error'
  | 'interface:switch'
  | 'interface:error'
  | 'command:execute'
  | 'command:complete'
  | 'command:error'
  | 'session:start'
  | 'session:end'
  | 'performance:metric'
  | 'validation:complete'
  | 'validation:error';

export interface SignalPayload {
  timestamp: number;
  source: string;
  data?: any;
  error?: TemplumError;
}

export interface MetricsSignalPayload extends SignalPayload {
  metrics: PerformanceMetrics;
  category: 'performance' | 'usage' | 'error';
}

export interface ErrorSignalPayload extends SignalPayload {
  error: TemplumError;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Migration Note (2025-09-01): Supporting types moved to universal-skin-definition.ts
// These types are now imported from the unified definition file above
/**---
 * title: [Service Communication Contracts - Haruspex 2.0 ↔ Templum 1.0 IPC]
 * tags: [Service, Contracts, IPC, Communication, TypeScript, Interfaces]
 * provides: [HaruspexAnalysisService, TemplumOrchestrator, IPC Protocol]
 * requires: [IPC Transport, Backend Router, State Manager]
 * description: [TypeScript service contracts for Haruspex-Templum IPC communication]
 * created: 2025-08-21
 * ---*/

// =============================================================================
// CORE SERVICE INTERFACES
// =============================================================================

/**
 * Haruspex 2.0 Analysis Service Interface
 * 
 * Pure backend analysis service with no UI concerns.
 * Implements comprehensive code analysis, pattern detection, and predictive insights.
 */
export interface HaruspexAnalysisService {
  // Core analysis operations
  analyzeCode(request: AnalysisRequest): Promise<AnalysisResult>;
  analyzeDependencies(request: DependencyAnalysisRequest): Promise<DependencyAnalysisResult>;
  analyzeArchitecture(request: ArchitectureAnalysisRequest): Promise<ArchitectureAnalysisResult>;
  
  // Prediction services
  predictIssues(request: PredictionRequest): Promise<PredictionResult>;
  predictPerformance(request: PerformanceAnalysisRequest): Promise<PerformanceInsights>;
  
  // Service health and status
  getStatus(): Promise<ServiceStatus>;
  healthCheck(): Promise<boolean>;
  getCapabilities(): Promise<ServiceCapabilities>;
  
  // Session and workspace management
  initializeWorkspace(config: WorkspaceConfig): Promise<WorkspaceInitResult>;
  updateWorkspace(updates: WorkspaceUpdates): Promise<WorkspaceUpdateResult>;
  cleanupWorkspace(workspaceId: string): Promise<void>;
}

/**
 * Templum 1.0 Orchestrator Interface
 * 
 * Universal interface orchestrator managing presentation across all interface modalities.
 * Coordinates with multiple backend services through unified skin system.
 */
export interface TemplumOrchestrator {
  // Interface rendering and coordination
  renderAnalysis(result: AnalysisResult, target: UITarget): Promise<RenderResult>;
  switchInterface(mode: InterfaceMode): Promise<InterfaceSwitchResult>;
  applySkin(skinDefinition: UniversalSkinDefinition): Promise<SkinApplicationResult>;
  
  // Cross-interface state management
  syncState(stateUpdate: StateUpdate): Promise<StateSyncResult>;
  broadcastStateUpdate(update: StateUpdate): Promise<BroadcastResult>;
  getInterfaceState(interfaceType: InterfaceType): Promise<InterfaceState>;
  
  // Backend service coordination
  registerBackendService(service: BackendServiceInfo): Promise<RegistrationResult>;
  routeCommand(command: string, args: any[], context: CommandContext): Promise<CommandResult>;
  executeWorkflow(workflow: WorkflowDefinition, context: WorkflowContext): Promise<WorkflowResult>;
}

// =============================================================================
// IPC PROTOCOL DEFINITIONS
// =============================================================================

/**
 * IPC Message Protocol
 * 
 * Based on Templum 1.0 specification IPC communication patterns.
 * Supports bidirectional communication with request/response and pub/sub patterns.
 */
export interface IPCMessage {
  id: string;                        // Unique message identifier
  type: IPCMessageType;             // Message type for routing
  timestamp: number;                // Message timestamp
  source: ServiceIdentifier;        // Source service information
  target: ServiceIdentifier;        // Target service information
  payload: any;                     // Message payload (request/response data)
  correlationId?: string;           // For request/response correlation
  priority?: MessagePriority;       // Message priority level
  timeout?: number;                 // Message timeout in ms
}

export type IPCMessageType = 
  | 'request'                       // Request message expecting response
  | 'response'                      // Response to previous request
  | 'notification'                  // One-way notification (no response expected)
  | 'broadcast'                     // Broadcast to multiple receivers
  | 'heartbeat'                     // Service health check
  | 'error';                        // Error notification

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

export interface ServiceIdentifier {
  type: 'haruspex' | 'templum' | 'pcl' | 'litany';
  instanceId: string;
  version: string;
  endpoint: string;
}

/**
 * IPC Transport Layer
 * 
 * Abstraction for underlying transport mechanism.
 * Supports Node.js IPC, WebSockets, and HTTP for different deployment scenarios.
 */
export interface IPCTransport {
  // Connection management
  connect(endpoint: string): Promise<IPCConnection>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Message handling
  send(message: IPCMessage): Promise<void>;
  request(message: IPCMessage): Promise<IPCMessage>;
  subscribe(messageType: IPCMessageType, handler: IPCMessageHandler): void;
  unsubscribe(messageType: IPCMessageType, handler: IPCMessageHandler): void;
  
  // Health monitoring
  ping(): Promise<number>;          // Returns latency in ms
  getConnectionStats(): ConnectionStats;
}

export interface IPCConnection {
  id: string;
  status: ConnectionStatus;
  endpoint: string;
  connectedAt: number;
  lastActivity: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';

export type IPCMessageHandler = (message: IPCMessage) => Promise<void> | void;

// =============================================================================
// DATA STRUCTURES AND REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Analysis Request/Response Types
 */
export interface AnalysisRequest {
  workspaceId: string;
  analysisType: AnalysisType;
  targetPath: string;
  options: AnalysisOptions;
  context: AnalysisContext;
}

export type AnalysisType = 
  | 'code-quality'
  | 'dependency-analysis'
  | 'architecture-review'
  | 'security-scan'
  | 'performance-analysis'
  | 'prediction-model';

export interface AnalysisOptions {
  depth: 'shallow' | 'moderate' | 'deep';
  includeTests: boolean;
  includeDependencies: boolean;
  performanceAnalysis: boolean;
  securityScan: boolean;
  generateRecommendations: boolean;
  outputFormat: 'json' | 'markdown' | 'html';
}

export interface AnalysisContext {
  projectType?: string;
  framework?: string;
  language?: string;
  previousAnalysisId?: string;
  baselineVersion?: string;
  customRules?: AnalysisRule[];
}

export interface AnalysisResult {
  analysisId: string;
  workspaceId: string;
  timestamp: number;
  analysisType: AnalysisType;
  status: 'completed' | 'failed' | 'partial';
  
  // Core results
  summary: AnalysisSummary;
  findings: AnalysisFinding[];
  recommendations: AnalysisRecommendation[];
  metrics: AnalysisMetrics;
  
  // Visualization data for Templum
  visualizationData: VisualizationData;
  treeData?: TreeDataStructure;
  chartData?: ChartDataStructure;
  
  // State updates for interface synchronization
  stateUpdates: StateUpdates;
  
  // Performance metadata
  executionTime: number;
  resourceUsage: ResourceUsageMetrics;
}

/**
 * UI Target and Interface Types
 */
export interface UITarget {
  interfaceType: InterfaceType;
  targetId: string;
  renderingOptions: RenderingOptions;
}

export type InterfaceType = 'vscode' | 'cli' | 'command' | 'web';

export type InterfaceMode = InterfaceType;

export interface RenderingOptions {
  theme?: string;
  layout?: 'compact' | 'detailed' | 'summary';
  interactive?: boolean;
  realTimeUpdates?: boolean;
  customizations?: Record<string, any>;
}

/**
 * State Management Types
 */
export interface StateUpdate {
  timestamp: number;
  updateId: string;
  source: ServiceIdentifier;
  
  // Global state changes
  globalState?: Record<string, any>;
  
  // Interface-specific updates
  treeViewUpdates?: Record<string, TreeViewUpdate>;
  webviewUpdates?: Record<string, WebviewUpdate>;
  menuUpdates?: Record<string, MenuStateUpdate>;
  statusUpdates?: Record<string, StatusUpdate>;
  
  // Backend state updates
  backendStates?: {
    haruspex?: Record<string, any>;
    pcl?: Record<string, any>;
    litany?: Record<string, any>;
  };
  
  // Notifications for users
  notifications?: NotificationMessage[];
}

export interface StateSyncResult {
  success: boolean;
  syncId: string;
  timestamp: number;
  affectedInterfaces: InterfaceType[];
  syncLatency: number;
  errors?: string[];
}

/**
 * Service Status and Health Types
 */
export interface ServiceStatus {
  serviceId: string;
  serviceType: 'haruspex' | 'templum';
  status: 'initializing' | 'ready' | 'busy' | 'error' | 'maintenance';
  version: string;
  uptime: number;
  health: HealthMetrics;
  capabilities: ServiceCapabilities;
  activeWorkspaces: number;
  lastActivity: number;
}

export interface HealthMetrics {
  cpuUsage: number;               // Percentage
  memoryUsage: number;            // MB
  avgResponseTime: number;        // ms
  requestsPerSecond: number;
  errorRate: number;              // Percentage
  availability: number;           // Percentage
}

export interface ServiceCapabilities {
  supportedAnalysisTypes: AnalysisType[];
  supportedInterfaces: InterfaceType[];
  maxConcurrentAnalyses: number;
  maxWorkspaceSize: number;       // MB
  supportedLanguages: string[];
  customCapabilities?: Record<string, any>;
}

// =============================================================================
// PERFORMANCE REQUIREMENTS
// =============================================================================

/**
 * Performance Requirements from Templum 1.0 Specification
 */
export interface PerformanceRequirements {
  // Interface switching performance
  interfaceSwitching: {
    target: 100;                    // <100ms as specified in Templum spec
    acceptable: 200;                // Acceptable fallback
    critical: 500;                  // Performance alert threshold
  };
  
  // Command routing performance
  commandRouting: {
    target: 50;                     // <50ms as specified in Templum spec
    acceptable: 100;
    critical: 300;
  };
  
  // State synchronization performance
  stateSynchronization: {
    target: 150;                    // <150ms as specified in Templum spec
    acceptable: 300;
    critical: 1000;
  };
  
  // IPC communication latency
  ipcLatency: {
    target: 10;                     // <10ms for local IPC
    acceptable: 50;
    critical: 200;
  };
}

// =============================================================================
// ERROR HANDLING AND RECOVERY
// =============================================================================

/**
 * Error Types and Recovery Strategies
 */
export interface ServiceError {
  errorId: string;
  timestamp: number;
  source: ServiceIdentifier;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: Record<string, any>;
  stackTrace?: string;
  correlationId?: string;
  recoveryStrategy?: RecoveryStrategy;
}

export type ErrorType = 
  | 'communication_error'
  | 'analysis_error'
  | 'configuration_error'
  | 'resource_error'
  | 'timeout_error'
  | 'validation_error'
  | 'system_error';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'graceful_degradation' | 'manual_intervention';
  maxRetries?: number;
  backoffStrategy?: 'linear' | 'exponential';
  fallbackAction?: string;
  userNotification?: boolean;
}

// =============================================================================
// CONFIGURATION AND DEPLOYMENT
// =============================================================================

/**
 * Service Configuration
 */
export interface ServiceConfiguration {
  // Service identity
  serviceId: string;
  serviceType: 'haruspex' | 'templum';
  version: string;
  
  // Communication settings
  ipc: {
    endpoint: string;
    protocol: 'ipc' | 'http' | 'websocket';
    timeout: number;
    retryAttempts: number;
    heartbeatInterval: number;
  };
  
  // Performance settings
  performance: {
    maxConcurrentOperations: number;
    requestQueueSize: number;
    responseTimeout: number;
    healthCheckInterval: number;
  };
  
  // Resource limits
  resources: {
    maxMemoryUsage: number;         // MB
    maxCpuUsage: number;           // Percentage
    diskSpaceThreshold: number;     // MB
    maxFileSize: number;           // MB
  };
  
  // Feature flags
  features: {
    enablePerformanceMonitoring: boolean;
    enableDetailedLogging: boolean;
    enableErrorRecovery: boolean;
    enableStatePersistence: boolean;
  };
}

// =============================================================================
// SUPPORTING TYPES FOR COMPLETE INTERFACE COVERAGE
// =============================================================================

export interface AnalysisSummary {
  totalIssues: number;
  criticalIssues: number;
  codeQualityScore: number;
  securityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
}

export interface AnalysisFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  message: string;
  location: CodeLocation;
  recommendation?: string;
}

export interface AnalysisRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export interface AnalysisMetrics {
  linesOfCode: number;
  complexity: number;
  testCoverage?: number;
  dependencies: number;
  technicalDebt: number;
}

export interface CodeLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface VisualizationData {
  charts?: ChartDataStructure[];
  tables?: TableDataStructure[];
  trees?: TreeDataStructure[];
  networks?: NetworkDataStructure[];
}

export interface ChartDataStructure {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  data: any[];
  labels: string[];
  options?: Record<string, any>;
}

export interface TableDataStructure {
  headers: string[];
  rows: any[][];
  sortable?: boolean;
  filterable?: boolean;
}

export interface TreeDataStructure {
  root: TreeNode;
  expandedNodes?: string[];
  selectedNodes?: string[];
}

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  data?: any;
  icon?: string;
  state?: 'expanded' | 'collapsed';
}

export interface NetworkDataStructure {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  layout?: 'hierarchical' | 'force' | 'circular';
}

export interface NetworkNode {
  id: string;
  label: string;
  type: string;
  data?: any;
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: string;
  weight?: number;
}

// Interface-specific update types
export interface TreeViewUpdate {
  refreshData: any;
  expandedNodes: string[];
  selectedNodes: string[];
}

export interface WebviewUpdate {
  type: 'data-update' | 'style-update' | 'action';
  payload: any;
}

export interface MenuStateUpdate {
  itemStates: Record<string, any>;
  navigationState: Record<string, any>;
  refreshRequired: boolean;
}

export interface StatusUpdate {
  text: string;
  tooltip: string;
  color: 'default' | 'success' | 'warning' | 'error';
  priority: 'low' | 'normal' | 'high';
}

export interface NotificationMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  autoHide?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  primary?: boolean;
}

// Command and workflow types
export interface CommandContext {
  workspaceId?: string;
  interfaceType?: InterfaceType;
  userId?: string;
  sessionId?: string;
  originalInput?: string;
  commandDef?: any;
  customContext?: Record<string, any>;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  source?: InterfaceType;
  timestamp?: number;
  executionTime?: number;
}

export interface WorkspaceConfig {
  workspaceId: string;
  rootPath: string;
  projectType?: string;
  language?: string;
  framework?: string;
  analysisSettings: AnalysisOptions;
  customRules?: AnalysisRule[];
}

export interface AnalysisRule {
  id: string;
  name: string;
  type: 'pattern' | 'metric' | 'custom';
  pattern?: string;
  threshold?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface WorkspaceInitResult {
  workspaceId: string;
  status: 'initialized' | 'failed';
  capabilities: string[];
  estimatedAnalysisTime?: number;
  error?: string;
}

export interface WorkspaceUpdates {
  workspaceId: string;
  changedFiles?: string[];
  deletedFiles?: string[];
  configUpdates?: Partial<WorkspaceConfig>;
}

export interface WorkspaceUpdateResult {
  workspaceId: string;
  status: 'updated' | 'failed';
  affectedAnalyses: string[];
  reanalysisRequired: boolean;
  error?: string;
}

// Resource usage and performance tracking
export interface ResourceUsageMetrics {
  cpuTime: number;                // ms
  memoryPeak: number;            // MB
  diskReads: number;             // Number of file reads
  diskWrites: number;            // Number of file writes
  networkRequests: number;       // Number of network calls
}

export interface ConnectionStats {
  totalMessages: number;
  messagesSent: number;
  messagesReceived: number;
  averageLatency: number;        // ms
  errorRate: number;             // Percentage
  uptime: number;                // ms
  lastError?: string;
  lastErrorTime?: number;
}

// Universal skin and backend service types (from Templum spec)
export interface UniversalSkinDefinition {
  metadata: {
    id: string;
    name: string;
    backend: 'pcl' | 'litany' | 'haruspex';
    version: string;
    compatibleInterfaces: InterfaceType[];
  };
  views?: any;
  menus?: any;
  commands?: any;
  workflows?: any;
  shortcuts?: any;
  customizations?: any;
  theme?: any;
  backendConfig?: any;
}

export interface BackendServiceInfo {
  type: 'pcl' | 'litany' | 'haruspex';
  endpoint: string;
  protocol: 'ipc' | 'http' | 'websocket';
  capabilities: ServiceCapabilities;
  skinDefinition?: UniversalSkinDefinition;
}

// Result types for service operations
export interface RenderResult {
  success: boolean;
  renderedComponents: string[];
  renderTime: number;
  errors?: string[];
}

export interface InterfaceSwitchResult {
  success: boolean;
  fromInterface: InterfaceType;
  toInterface: InterfaceType;
  switchTime: number;
  statePreserved: boolean;
  errors?: string[];
}

export interface SkinApplicationResult {
  success: boolean;
  appliedInterfaces: InterfaceType[];
  applicationTime: number;
  componentsCreated: string[];
  errors?: string[];
}

export interface BroadcastResult {
  success: boolean;
  deliveredTo: ServiceIdentifier[];
  failedDeliveries: ServiceIdentifier[];
  totalLatency: number;
  errors?: string[];
}

export interface RegistrationResult {
  success: boolean;
  serviceId: string;
  registrationTime: number;
  assignedEndpoint?: string;
  error?: string;
}

export interface InterfaceState {
  interfaceType: InterfaceType;
  active: boolean;
  lastUpdate: number;
  currentSkin?: string;
  componentStates: Record<string, any>;
  userContext: Record<string, any>;
}

// Workflow types
export interface WorkflowDefinition {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  conditions?: WorkflowCondition[];
  rollback?: RollbackDefinition;
}

export interface WorkflowStep {
  id: string;
  command: string;
  description?: string;
  args?: any[];
  condition?: string;
  onError?: 'stop' | 'continue' | 'retry';
  timeout?: number;
}

export interface WorkflowCondition {
  id: string;
  type: 'pre' | 'post' | 'during';
  expression: string;
  errorMessage?: string;
}

export interface RollbackDefinition {
  enabled: boolean;
  steps: RollbackStep[];
  strategy: 'automatic' | 'manual' | 'conditional';
}

export interface RollbackStep {
  id: string;
  description: string;
  action: string;
  args?: any[];
}

export interface WorkflowContext {
  workflowId: string;
  sessionId: string;
  userId?: string;
  interfaceType: InterfaceType;
  variables: Record<string, any>;
  currentStep?: number;
}

export interface WorkflowResult {
  workflowId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'partial';
  completedSteps: string[];
  failedStep?: string;
  results: Record<string, any>;
  executionTime: number;
  error?: string;
}

// Additional analysis types for completeness
export interface DependencyAnalysisRequest extends AnalysisRequest {
  includeDev: boolean;
  includeTransitive: boolean;
  vulnerabilityScan: boolean;
  licenseAnalysis: boolean;
}

export interface DependencyAnalysisResult extends AnalysisResult {
  dependencies: DependencyInfo[];
  vulnerabilities: VulnerabilityInfo[];
  licenses: LicenseInfo[];
  dependencyTree: DependencyTreeNode;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'direct' | 'transitive' | 'dev';
  location: string;
  size?: number;
  lastUpdated?: number;
}

export interface VulnerabilityInfo {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dependency: string;
  version: string;
  description: string;
  fix?: string;
  references: string[];
}

export interface LicenseInfo {
  dependency: string;
  license: string;
  licenseType: 'permissive' | 'copyleft' | 'proprietary' | 'unknown';
  compatible: boolean;
  issues?: string[];
}

export interface DependencyTreeNode {
  name: string;
  version: string;
  dependencies: DependencyTreeNode[];
  circular?: boolean;
}

export interface ArchitectureAnalysisRequest extends AnalysisRequest {
  includeMetrics: boolean;
  diagramGeneration: boolean;
  patternDetection: boolean;
  couplingAnalysis: boolean;
}

export interface ArchitectureAnalysisResult extends AnalysisResult {
  modules: ModuleInfo[];
  relationships: RelationshipInfo[];
  patterns: ArchitecturalPattern[];
  metrics: ArchitectureMetrics;
  diagrams?: DiagramData[];
}

export interface ModuleInfo {
  name: string;
  path: string;
  type: 'component' | 'service' | 'utility' | 'configuration';
  size: number;
  complexity: number;
  dependencies: string[];
  dependents: string[];
}

export interface RelationshipInfo {
  source: string;
  target: string;
  type: 'imports' | 'extends' | 'implements' | 'calls' | 'instantiates';
  strength: number;
  bidirectional: boolean;
}

export interface ArchitecturalPattern {
  type: string;
  confidence: number;
  description: string;
  components: string[];
  benefits: string[];
  issues: string[];
}

export interface ArchitectureMetrics {
  modularity: number;
  coupling: number;
  cohesion: number;
  stability: number;
  abstractness: number;
  distance: number;
}

export interface DiagramData {
  type: 'component' | 'sequence' | 'class' | 'dependency';
  format: 'mermaid' | 'plantuml' | 'dot';
  data: string;
  metadata: Record<string, any>;
}

export interface PredictionRequest extends AnalysisRequest {
  predictionType: PredictionType;
  timeHorizon: 'short' | 'medium' | 'long';
  historicalData?: HistoricalDataPoint[];
}

export type PredictionType = 
  | 'bug-prediction'
  | 'maintenance-effort'
  | 'performance-degradation'
  | 'security-risks'
  | 'code-evolution';

export interface PredictionResult extends AnalysisResult {
  predictions: Prediction[];
  confidence: number;
  recommendations: PredictionRecommendation[];
  riskFactors: RiskFactor[];
}

export interface Prediction {
  id: string;
  type: PredictionType;
  description: string;
  confidence: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  likelihood: number;
  preventionStrategies: string[];
}

export interface PredictionRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  expectedImpact: string;
  timeline: string;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  description: string;
  mitigation?: string;
}

export interface HistoricalDataPoint {
  timestamp: number;
  metrics: Record<string, number>;
  events: string[];
  context: Record<string, any>;
}

export interface PerformanceAnalysisRequest extends AnalysisRequest {
  includeRuntime: boolean;
  includeProfiling: boolean;
  includeMemoryAnalysis: boolean;
  benchmarkComparison: boolean;
}

export interface PerformanceInsights extends AnalysisResult {
  bottlenecks: PerformanceBottleneck[];
  recommendations: PerformanceRecommendation[];
  benchmarks: BenchmarkResult[];
  trends: PerformanceTrend[];
}

export interface PerformanceBottleneck {
  location: CodeLocation;
  type: 'cpu' | 'memory' | 'io' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  suggestions: string[];
}

export interface PerformanceRecommendation {
  id: string;
  category: 'optimization' | 'refactoring' | 'architecture' | 'infrastructure';
  title: string;
  description: string;
  expectedGain: string;
  implementationEffort: 'low' | 'medium' | 'high';
  prerequisites: string[];
}

export interface BenchmarkResult {
  operation: string;
  currentPerformance: number;
  benchmarkPerformance: number;
  unit: string;
  percentageDifference: number;
  verdict: 'better' | 'worse' | 'similar';
}

export interface PerformanceTrend {
  metric: string;
  trend: 'improving' | 'degrading' | 'stable';
  changeRate: number;
  timeframe: string;
  significance: 'low' | 'medium' | 'high';
}
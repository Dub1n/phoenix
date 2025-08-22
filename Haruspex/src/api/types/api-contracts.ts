/**---
 * title: [Haruspex 2.0 API Contracts - Core Interface Definitions]
 * tags: [API, Contracts, TypeScript, Backend, Service]
 * provides: [API-Types, Request-Response-Contracts, Protocol-Definitions]
 * requires: [TypeScript, Core-Analysis-Types, Prediction-Types]
 * description: [Comprehensive API contract definitions for all Haruspex 2.0 protocols]
 * ---*/

// ================================
// Core Service Types
// ================================

export interface HaruspexServiceConfig {
  // API Gateway configuration
  api: {
    ipc: {
      port: number;
      timeout: number;
      maxConnections: number;
    };
    http: {
      port: number;
      cors: boolean;
      rateLimit: {
        requests: number;
        windowMs: number;
      };
    };
    websocket: {
      port: number;
      heartbeat: number;
      maxClients: number;
    };
  };
  
  // Analysis engine configuration
  analysis: {
    maxConcurrentAnalyses: number;
    timeoutMs: number;
    cacheEnabled: boolean;
    cacheTtlMs: number;
  };
  
  // Prediction engine configuration
  prediction: {
    modelsPath: string;
    confidenceThreshold: number;
    maxPredictionTime: number;
  };
  
  // Diagnostic configuration
  diagnostics: {
    healthCheckInterval: number;
    metricsRetention: number;
    alertThresholds: {
      memoryUsageMB: number;
      responseTimeMs: number;
      errorRate: number;
    };
  };
}

// ================================
// Analysis API Contracts
// ================================

export interface AnalysisRequest {
  // Code content to analyze
  code: string;
  
  // Language and framework context
  language: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp' | 'go' | 'rust';
  framework?: string;
  
  // Analysis configuration
  depth: 'quick' | 'standard' | 'deep' | 'comprehensive';
  includeExecution?: boolean;
  includePredictions?: boolean;
  
  // Context information
  filePath?: string;
  projectContext?: ProjectContext;
  
  // Performance options
  timeout?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  // Caching
  contentHash: string;
  useCache?: boolean;
}

export interface AnalysisResult {
  // Session information
  sessionId: string;
  timestamp: number;
  
  // Core analysis results
  codeStructure: CodeStructureAnalysis;
  performance: PerformanceAnalysis;
  security: SecurityAnalysis;
  architecture: ArchitectureAnalysis;
  patterns: PatternAnalysis;
  
  // Summary and scoring
  overallScore: OverallScore;
  criticalIssues: CriticalIssue[];
  recommendations: Recommendation[];
  
  // Metadata
  executionTime: number;
  analysisDepth: string;
  coverageMetrics: CoverageMetrics;
  metadata: {
    cacheHit: boolean;
    modelVersions: Record<string, string>;
    analysisPhases: AnalysisPhase[];
  };
}

export interface CodeStructureAnalysis {
  metrics: {
    linesOfCode: number;
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    technicalDebt: number;
  };
  classes: ClassInfo[];
  functions: FunctionInfo[];
  dependencies: DependencyInfo[];
  testCoverage: TestCoverageInfo;
  score: number;
  issues: CodeIssue[];
}

export interface PerformanceAnalysis {
  bottlenecks: PerformanceBottleneck[];
  memoryUsage: MemoryAnalysis;
  algorithimicComplexity: ComplexityAnalysis;
  resourceUsage: ResourceUsageAnalysis;
  optimizationOpportunities: OptimizationOpportunity[];
  score: number;
  projectedImpact: PerformanceImpact;
}

export interface SecurityAnalysis {
  vulnerabilities: SecurityVulnerability[];
  dataFlowAnalysis: DataFlowInfo[];
  accessControlIssues: AccessControlIssue[];
  cryptographicIssues: CryptographicIssue[];
  complianceCheck: ComplianceResult;
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ArchitectureAnalysis {
  designPatterns: DesignPattern[];
  antiPatterns: AntiPattern[];
  modularity: ModularityAnalysis;
  coupling: CouplingAnalysis;
  cohesion: CohesionAnalysis;
  layering: LayeringAnalysis;
  score: number;
  recommendations: ArchitecturalRecommendation[];
}

export interface PatternAnalysis {
  detectedPatterns: DetectedPattern[];
  codeSmells: CodeSmell[];
  bestPractices: BestPracticeResult[];
  refactoringOpportunities: RefactoringOpportunity[];
  qualityGates: QualityGateResult[];
}

// ================================
// Prediction API Contracts
// ================================

export interface PredictionRequest {
  // Code context for prediction
  codeContext: CodeContext;
  
  // Prediction parameters
  timeHorizon: '1d' | '7d' | '30d' | '90d' | '180d' | '1y';
  predictionTypes: PredictionType[];
  
  // Historical data for better predictions
  historicalData?: HistoricalData;
  teamMetrics?: TeamMetrics;
  
  // Prediction configuration
  confidenceThreshold?: number;
  includeAlternatives?: boolean;
  maxAlternatives?: number;
}

export interface PredictionResult {
  sessionId: string;
  timestamp: number;
  
  // Core predictions
  patterns: PatternPrediction[];
  bugs: BugPrediction[];
  refactoring: RefactoringPrediction[];
  performance: PerformancePrediction[];
  evolution: EvolutionPrediction;
  
  // Cross-cutting insights
  correlatedInsights: CorrelatedInsight[];
  
  // Risk assessment
  overallRiskAssessment: OverallRiskAssessment;
  
  // Actionable recommendations
  prioritizedActions: PrioritizedAction[];
  
  // Confidence and validation
  confidence: number;
  confidenceMetrics: ConfidenceMetrics;
  validationMetrics: ValidationMetrics;
  
  // Timeline projections
  timelineProjections: TimelineProjection[];
}

export type PredictionType = 
  | 'pattern-evolution'
  | 'bug-prediction'
  | 'refactoring-opportunities'
  | 'performance-impact'
  | 'code-evolution'
  | 'maintenance-risk'
  | 'security-risk'
  | 'quality-trends';

// ================================
// Diagnostic API Contracts
// ================================

export interface SystemDiagnostics {
  timestamp: number;
  
  // Core engine status
  coreEngine: {
    status: 'healthy' | 'degraded' | 'critical';
    activeAnalyses: number;
    totalAnalyses: number;
    averageResponseTime: number;
    memoryUsage: number;
  };
  
  // Component diagnostics
  analysisEngine: AnalysisEngineDiagnostics;
  predictionEngine: PredictionEngineDiagnostics;
  apiGateway: APIGatewayStatus;
  cacheManager: CacheStatus;
  
  // System health
  performance: PerformanceMetrics;
  health: SystemHealthReport;
  alerts: SystemAlert[];
}

export interface AnalysisEngineDiagnostics {
  status: 'operational' | 'degraded' | 'offline';
  analyzers: {
    codeAnalyzer: ComponentStatus;
    performanceAnalyzer: ComponentStatus;
    securityAnalyzer: ComponentStatus;
    architectureAnalyzer: ComponentStatus;
  };
  performance: {
    totalAnalyses: number;
    averageAnalysisTime: number;
    cacheHitRate: number;
    memoryUsage: number;
  };
  cache: {
    size: number;
    hitRate: number;
    memoryUsage: number;
  };
}

export interface PredictionEngineDiagnostics {
  status: 'operational' | 'degraded' | 'offline';
  predictors: {
    patternPredictor: ComponentStatus;
    bugPredictor: ComponentStatus;
    refactoringPredictor: ComponentStatus;
    performancePredictor: ComponentStatus;
  };
  models: {
    totalModels: number;
    activeModels: number;
    modelAccuracy: number;
    lastUpdate: number;
  };
  performance: {
    totalPredictions: number;
    averagePredictionTime: number;
    cacheHitRate: number;
    predictionAccuracy: number;
  };
}

export interface APIGatewayStatus {
  servers: {
    ipc: ServerStatus;
    http: ServerStatus;
    websocket: ServerStatus;
  };
  connections: {
    total: number;
    byType: Record<string, number>;
    averageAge: number;
  };
  performance: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

export interface ServerStatus {
  running: boolean;
  port: number;
  connections?: number;
  activeRequests?: number;
  uptime: number;
}

// ================================
// Skin Provider API Contracts
// ================================

export interface UniversalSkinDefinition {
  metadata: SkinMetadata;
  views: SkinViews;
  menus: SkinMenus;
  commands: SkinCommands;
  workflows: SkinWorkflows;
  shortcuts: Record<string, string>;
  theme: SkinTheme;
  backendConfig: BackendConfig;
}

export interface SkinMetadata {
  id: string;
  name: string;
  backend: string;
  version: string;
  compatibleInterfaces: InterfaceType[];
  description: string;
  author: string;
  capabilities: string[];
}

export interface SkinViews {
  treeViews: TreeViewDefinition[];
  panels: PanelDefinition[];
  statusBar: StatusBarDefinition[];
  explorer: ExplorerDefinition[];
}

export interface SkinMenus {
  main: MenuDefinition;
  context: ContextMenuDefinition[];
  toolbar: ToolbarDefinition[];
}

export interface SkinCommands {
  [commandId: string]: CommandDefinition;
}

export interface SkinWorkflows {
  [workflowId: string]: WorkflowDefinition;
}

export interface TreeViewDefinition {
  id: string;
  title: string;
  description: string;
  dataProvider: string;
  onSelectionChange?: string;
  contextMenu?: string[];
  dragAndDrop?: boolean;
}

export interface CommandDefinition {
  title: string;
  description: string;
  handler: string;
  shortcuts?: string[];
  examples?: string[];
  parameters?: CommandParameter[];
}

export interface WorkflowDefinition {
  title: string;
  description: string;
  steps: WorkflowStep[];
  parallelSteps?: boolean;
  errorHandling?: WorkflowErrorHandling;
}

// ================================
// Protocol-Specific Types
// ================================

export interface IPCMessage {
  id: string;
  type: 'request' | 'response' | 'error' | 'event';
  method?: string;
  payload?: any;
  error?: string;
  timestamp: number;
}

export interface HTTPRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
}

export interface HTTPResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'request' | 'response' | 'stream' | 'error' | 'heartbeat';
  id?: string;
  method?: string;
  payload?: any;
  error?: string;
  timestamp: number;
}

// ================================
// Supporting Types
// ================================

export type InterfaceType = 'vscode' | 'cli' | 'command' | 'web' | 'api';

export interface ProjectContext {
  projectPath: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'maven' | 'gradle' | 'pip' | 'cargo';
  buildSystem?: string;
  testFramework?: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
}

export interface CodeContext {
  projectPath: string;
  files: string[];
  dependencies: ProjectDependencies;
  configuration: ProjectConfiguration;
  history?: GitHistory;
}

export interface ComponentStatus {
  status: 'healthy' | 'degraded' | 'offline';
  lastCheck: number;
  metrics: Record<string, number>;
  errors: string[];
}

export interface PerformanceMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsActive: number;
  };
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  component: string;
  resolved: boolean;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  title: string;
  description: string;
  actionType: 'command' | 'restart' | 'scale' | 'investigate';
  command?: string;
}

// ================================
// Error Types
// ================================

export class HaruspexAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'HaruspexAPIError';
  }
}

export class AnalysisError extends HaruspexAPIError {
  constructor(message: string, public sessionId?: string, details?: any) {
    super(message, 'ANALYSIS_ERROR', 422, details);
    this.name = 'AnalysisError';
  }
}

export class PredictionError extends HaruspexAPIError {
  constructor(message: string, public sessionId?: string, details?: any) {
    super(message, 'PREDICTION_ERROR', 422, details);
    this.name = 'PredictionError';
  }
}

export class ValidationError extends HaruspexAPIError {
  constructor(message: string, public field?: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends HaruspexAPIError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends HaruspexAPIError {
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
    this.name = 'ServiceUnavailableError';
  }
}

// ================================
// API Response Wrappers
// ================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: number;
    requestId: string;
    version: string;
    processingTime: number;
  };
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface StreamResponse {
  type: 'start' | 'progress' | 'data' | 'complete' | 'error';
  sessionId: string;
  timestamp: number;
  data?: any;
  progress?: {
    current: number;
    total: number;
    percentage: number;
    phase: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
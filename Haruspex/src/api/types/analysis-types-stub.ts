/**---
 * title: [Analysis Types Stub - Missing Type Definitions]
 * tags: [Types, Stub, Analysis, TypeScript, API]
 * provides: [Analysis-Types, Stub-Interfaces, Type-Definitions]
 * requires: [TypeScript]
 * description: [Stub implementations for missing analysis types - TEMPORARY SOLUTION]
 * ---*/

// ================================
// Analysis Result Types - STUBS
// ================================

export interface OverallScore {
  total: number;
  quality: number;
  maintainability: number;
  performance: number;
  security: number;
}

export interface CriticalIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  location: string;
  recommendation: string;
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  impact: string;
  effort: string;
}

export interface CoverageMetrics {
  lines: number;
  functions: number;
  statements: number;
  branches: number;
}

export interface AnalysisPhase {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'completed' | 'failed' | 'skipped';
}

export interface ClassInfo {
  name: string;
  methods: number;
  properties: number;
  complexity: number;
  location: string;
}

export interface FunctionInfo {
  name: string;
  parameters: number;
  complexity: number;
  location: string;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development';
  vulnerabilities: number;
}

export interface TestCoverageInfo {
  percentage: number;
  lines: number;
  functions: number;
  statements: number;
}

export interface CodeIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: string;
}

// ================================
// Performance Analysis Types - STUBS
// ================================

export interface PerformanceBottleneck {
  type: string;
  location: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface MemoryAnalysis {
  usage: number;
  leaks: number;
  allocations: number;
}

export interface ComplexityAnalysis {
  cyclomatic: number;
  cognitive: number;
  halstead: number;
}

export interface ResourceUsageAnalysis {
  cpu: number;
  memory: number;
  io: number;
}

export interface OptimizationOpportunity {
  type: string;
  description: string;
  impact: string;
  effort: string;
}

export interface PerformanceImpact {
  before: number;
  after: number;
  improvement: number;
}

// ================================
// Security Analysis Types - STUBS
// ================================

export interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  location: string;
}

export interface DataFlowInfo {
  source: string;
  sink: string;
  path: string[];
  sensitive: boolean;
}

export interface AccessControlIssue {
  type: string;
  location: string;
  description: string;
  risk: string;
}

export interface CryptographicIssue {
  type: string;
  algorithm: string;
  weakness: string;
  recommendation: string;
}

export interface ComplianceResult {
  standard: string;
  compliant: boolean;
  issues: string[];
}

// ================================
// Architecture Analysis Types - STUBS
// ================================

export interface DesignPattern {
  name: string;
  description: string;
  location: string;
  usage: string;
}

export interface AntiPattern {
  name: string;
  description: string;
  location: string;
  impact: string;
}

export interface ModularityAnalysis {
  cohesion: number;
  coupling: number;
  modularity: number;
}

export interface CouplingAnalysis {
  afferent: number;
  efferent: number;
  instability: number;
}

export interface CohesionAnalysis {
  lcom: number;
  strength: 'high' | 'medium' | 'low';
}

export interface LayeringAnalysis {
  layers: number;
  violations: number;
  dependencies: number;
}

export interface ArchitecturalRecommendation {
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// ================================
// Pattern Analysis Types - STUBS
// ================================

export interface DetectedPattern {
  name: string;
  confidence: number;
  location: string;
  description: string;
}

export interface CodeSmell {
  type: string;
  location: string;
  severity: string;
  description: string;
}

export interface BestPracticeResult {
  practice: string;
  compliant: boolean;
  recommendation: string;
}

export interface RefactoringOpportunity {
  type: string;
  location: string;
  description: string;
  effort: string;
}

export interface QualityGateResult {
  gate: string;
  passed: boolean;
  threshold: number;
  actual: number;
}

// ================================
// Prediction Types - STUBS
// ================================

export interface HistoricalData {
  commits: number;
  bugs: number;
  changes: number;
  timeRange: string;
}

export interface TeamMetrics {
  size: number;
  experience: number;
  velocity: number;
}

export interface PatternPrediction {
  pattern: string;
  probability: number;
  timeline: string;
}

export interface BugPrediction {
  location: string;
  probability: number;
  type: string;
}

export interface RefactoringPrediction {
  component: string;
  urgency: 'high' | 'medium' | 'low';
  reason: string;
}

export interface PerformancePrediction {
  metric: string;
  trend: 'improving' | 'degrading' | 'stable';
  projection: number;
}

export interface EvolutionPrediction {
  direction: string;
  confidence: number;
  timeline: string;
}

export interface CorrelatedInsight {
  type: string;
  correlation: number;
  description: string;
}

export interface OverallRiskAssessment {
  level: 'high' | 'medium' | 'low';
  factors: string[];
  mitigation: string;
}

export interface PrioritizedAction {
  action: string;
  priority: number;
  impact: string;
}

export interface ConfidenceMetrics {
  overall: number;
  factors: Record<string, number>;
}

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
}

export interface TimelineProjection {
  milestone: string;
  date: string;
  confidence: number;
}

// ================================
// System Health Types - STUBS
// ================================

export interface CacheStatus {
  size: number;
  hitRate: number;
  missRate: number;
  evictions: number;
}

export interface SystemHealthReport {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  issues: string[];
  performance: Record<string, number>;
}

// ================================
// Skin System Types - STUBS
// ================================

export interface SkinTheme {
  name?: string;  // Made optional for compatibility
  colors?: Record<string, string>;  // Made optional for compatibility
  fonts?: Record<string, string>;  // Made optional for compatibility
  // Support direct color properties for simplified usage
  primary?: string;
  secondary?: string;
  accent?: string;
  success?: string;
  warning?: string;
  error?: string;
  background?: string;
  foreground?: string;
}

export interface BackendConfig {
  service: string;
  version: string;
  protocol: 'ipc' | 'http' | 'websocket';
  endpoint: string;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth';
    credentials?: Record<string, string>;
    required?: boolean;
  };
  timeout?: number;
  retries?: number;
  keepAlive?: boolean;
  capabilities?: string[];
  healthEndpoint?: string;
  capabilitiesEndpoint?: string;
  versionEndpoint?: string;
  options?: Record<string, unknown>;
  endpoints?: Record<string, string>;
}

export interface PanelDefinition {
  id: string;
  name?: string;
  title: string;
  location: string;
  size: string;
  type?: string;  // Added for compatibility
  contentUrl?: string;  // Added for compatibility
  messageHandler?: string;  // Added for compatibility
}

export interface StatusBarDefinition {
  id: string;
  text: string;
  priority: number | string;  // Made flexible for compatibility
  alignment: 'left' | 'right';
  tooltip?: string;  // Added for compatibility
}

export interface MenuDefinition {
  id: string;
  title: string;
  subtitle?: string;  // Added for compatibility
  items: MenuItemDefinition[];
}

export interface MenuItemDefinition {
  id: string;
  label: string;
  command?: string;
  submenu?: MenuItemDefinition[];
}

export interface ContextMenuDefinition {
  id: string;
  context: string;
  items: MenuItemDefinition[];
}

export interface ToolbarDefinition {
  id: string;
  location: string;
  items: ToolbarItemDefinition[];
}

export interface ToolbarItemDefinition {
  id: string;
  icon: string;
  command: string;
  tooltip: string;
}

export interface ExplorerDefinition {
  id: string;
  title: string;
  provider: string;
}

export interface CommandParameter {
  name: string;
  type: string;
  required?: boolean;  // Made optional for compatibility
  description: string;
  options?: string[];  // Added for compatibility
}

export interface WorkflowStep {
  id: string;
  name?: string;  // Made optional for compatibility
  action?: string;  // Made optional for compatibility
  command?: string;  // Added for compatibility
  description?: string;  // Added for compatibility
  parameters?: Record<string, any>;  // Made optional for compatibility
}

export interface WorkflowErrorHandling {
  strategy: 'abort' | 'continue' | 'retry' | 'continue-on-error';  // Added continue-on-error
  maxRetries: number;
  fallbackActions?: string[];  // Added for compatibility
}

// ================================
// Project Context Types - STUBS
// ================================

export interface ProjectDependencies {
  production: Record<string, string>;
  development: Record<string, string>;
}

export interface ProjectConfiguration {
  language: string;
  framework: string;
  buildTool: string;
}

export interface GitHistory {
  commits: number;
  branches: number;
  contributors: number;
  lastCommit: string;
}

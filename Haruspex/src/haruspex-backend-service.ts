/**---
 * title: [Haruspex 2.0 Backend Service - Main Entry Point]
 * tags: [Backend, Service, Entry-Point, API-First, Pure-Backend]
 * provides: [Service-Orchestration, Lifecycle-Management, API-Coordination]
 * requires: [Core-Engine, API-Gateway, Analysis-Engine, Prediction-Engine]
 * description: [Main orchestrator for Haruspex 2.0 pure backend service with API-first architecture]
 * ---*/

import { EventEmitter } from 'events';
import { 
  HaruspexServiceConfig,
  AnalysisRequest,
  AnalysisResult,
  PredictionRequest,
  PredictionResult,
  SystemDiagnostics,
  UniversalSkinDefinition,
  ServiceUnavailableError,
  HaruspexAPIError,
  ProjectDependencies
} from './api/types/api-contracts';
import { APIGateway } from './api/gateway/api-gateway';
import { HaruspexCoreEngine, HaruspexCoreEngineConfig } from './core/haruspex-core-engine';
import { DiagnosticSystem } from './diagnostics/diagnostic-system';
import { CacheManager } from './cache/cache-manager';
import { SkinProvider } from './skin/skin-provider';
import { TemplumRegistrationService } from './integration/templum-registration-service';
import { createBackendDependencies, createDefaultBackendConfig, validateBackendEnvironment } from './core/backend-dependencies';

export interface ServiceStatus {
  status: 'starting' | 'healthy' | 'degraded' | 'critical' | 'stopping' | 'stopped';
  uptime: number;
  version: string;
  components: {
    analysisEngine: 'operational' | 'degraded' | 'offline';
    predictionEngine: 'operational' | 'degraded' | 'offline';
    apiGateway: 'operational' | 'degraded' | 'offline';
    diagnostics: 'operational' | 'degraded' | 'offline';
    cache: 'operational' | 'degraded' | 'offline';
  };
  performance: {
    totalRequests: number;
    averageResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  lastHealthCheck: number;
}

export interface ServiceMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    byProtocol: {
      ipc: number;
      http: number;
      websocket: number;
    };
  };
  analysis: {
    totalAnalyses: number;
    averageAnalysisTime: number;
    cacheHitRate: number;
    successRate: number;
  };
  prediction: {
    totalPredictions: number;
    averagePredictionTime: number;
    averageConfidence: number;
    successRate: number;
  };
  system: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
}

/**
 * Haruspex 2.0 Backend Service
 * 
 * Main orchestrator that coordinates all backend components in a pure service architecture.
 * Provides comprehensive code analysis and prediction capabilities through HTTP-first architecture
 * using the integrated HaruspexCoreEngine with enterprise-grade reliability, performance, and monitoring.
 */
export class HaruspexBackendService extends EventEmitter {
  private coreEngine!: HaruspexCoreEngine; // Will be initialized in initialize()
  private apiGateway: APIGateway;
  private diagnosticSystem: DiagnosticSystem;
  private cacheManager: CacheManager;
  private skinProvider: SkinProvider;
  private templumRegistration?: TemplumRegistrationService;

  private serviceStatus: ServiceStatus;
  private activeAnalyses: Map<string, any> = new Map();
  private activePredictions: Map<string, any> = new Map();
  
  private startTime: number = 0;
  private healthCheckInterval?: NodeJS.Timeout;
  private isInitialized = false;
  private coreEngineConfig: HaruspexCoreEngineConfig;

  constructor(private config: HaruspexServiceConfig) {
    super();

    // Store Core Engine configuration for later initialization with backend dependencies
    this.coreEngineConfig = {
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 30000,
        monitorWindow: 60000
      },
      errorBoundary: {
        isolationStrategy: 'component',
        recoveryStrategy: 'graceful-degradation',
        maxRetries: 3
      },
      telemetry: {
        privacyCompliant: true,
        performanceMetrics: true,
        errorReporting: true,
        logLevel: 'info'
      },
      fileMonitoring: {
        enabled: false, // Disabled for HTTP-first backend
        patterns: ['**/*.{ts,tsx,js,jsx,md,json}'],
        debounceMs: 500
      },
      analysis: {
        timeout: config.analysis.timeoutMs,
        maxConcurrentRequests: config.analysis.maxConcurrentAnalyses,
        cacheEnabled: config.analysis.cacheEnabled,
        cacheTtl: config.analysis.cacheTtlMs
      }
    };

    // Initialize other components (Core Engine will be initialized with backend dependencies in initialize())
    this.apiGateway = new APIGateway(config.api);
    this.diagnosticSystem = new DiagnosticSystem();
    this.cacheManager = new CacheManager();
    this.skinProvider = new SkinProvider();

    // Initialize service status
    this.serviceStatus = this.initializeServiceStatus();

    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize the backend service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Service is already initialized');
    }

    console.log('Haruspex Backend Service: Starting initialization...');
    this.startTime = Date.now();
    this.serviceStatus.status = 'starting';

    try {
      // Initialize backend environment
      console.log('Haruspex Backend Service: Validating backend environment...');
      await validateBackendEnvironment();

      // Initialize components in dependency order
      console.log('Haruspex Backend Service: Initializing cache manager...');
      await this.cacheManager.initialize();
      this.serviceStatus.components.cache = 'operational';

      // Create backend dependencies for Core Engine
      console.log('Haruspex Backend Service: Creating backend dependencies...');
      const runtimeConfig = createDefaultBackendConfig(process.cwd());
      const backendDependencies = await createBackendDependencies(runtimeConfig);

      // Initialize Core Engine with backend dependencies
      console.log('Haruspex Backend Service: Initializing Core Engine with backend dependencies...');
      this.coreEngine = new HaruspexCoreEngine(
        process.cwd(),
        this.coreEngineConfig,
        undefined, // No PCL adapters for pure backend
        backendDependencies
      );
      
      await this.coreEngine.initialize();
      this.serviceStatus.components.analysisEngine = 'operational';
      this.serviceStatus.components.predictionEngine = 'operational';
      console.log('Haruspex Backend Service: Core Engine initialization complete');

      console.log('Haruspex Backend Service: Initializing diagnostic system...');
      await this.diagnosticSystem.startMonitoring();
      this.serviceStatus.components.diagnostics = 'operational';

      console.log('Haruspex Backend Service: Starting API gateway...');
      await this.apiGateway.start(this.coreEngine, this.cacheManager);
      this.serviceStatus.components.apiGateway = 'operational';

      // Register with Templum for service discovery
      console.log('Haruspex Backend Service: Registering with Templum...');
      try {
        this.templumRegistration = new TemplumRegistrationService({
          serviceName: 'haruspex-analysis',
          port: this.config.api.http.port,
          version: '2.1.0',
          capabilities: [
            'code-analysis',
            'pattern-detection', 
            'security-scanning',
            'performance-analysis',
            'architecture-analysis',
            'bug-prediction',
            'refactoring-recommendations',
            'evolution-prediction'
          ]
        });
        await this.templumRegistration.register();
        console.log('Haruspex Backend Service: Templum registration successful');
      } catch (error) {
        console.warn('Haruspex Backend Service: Templum registration failed (non-critical):', error);
        // Don't fail the entire service startup if Templum registration fails
      }

      // Start health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
      this.serviceStatus.status = 'healthy';
      this.serviceStatus.lastHealthCheck = Date.now();

      console.log('Haruspex Backend Service: Initialization complete');
      
      this.emit('initialized', {
        timestamp: Date.now(),
        initializationTime: Date.now() - this.startTime,
        version: this.serviceStatus.version
      });

    } catch (error) {
      this.serviceStatus.status = 'critical';
      console.error('Haruspex Backend Service: Initialization failed:', error);
      
      this.emit('initializationFailed', {
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
        partialInitialization: this.getPartialInitializationStatus()
      });
      
      throw error;
    }
  }

  /**
   * Perform comprehensive code analysis
   */
  async analyzeCode(request: AnalysisRequest): Promise<AnalysisResult> {
    this.ensureOperational();
    
    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    try {
      // Register active analysis
      this.activeAnalyses.set(sessionId, {
        sessionId,
        request,
        startTime,
        status: 'running'
      });

      // Check cache first
      const cacheKey = this.generateCacheKey('analysis', request.contentHash);
      const cachedResult = await this.cacheManager.get(cacheKey) as AnalysisResult;
      
      if (cachedResult && this.isCacheValid(cachedResult, request)) {
        console.log(`Analysis cache hit for session ${sessionId}`);
        
        // Update cache metadata
        const enhancedResult = {
          ...cachedResult,
          sessionId,
          timestamp: Date.now(),
          metadata: {
            ...cachedResult.metadata,
            cacheHit: true,
            originalSessionId: cachedResult.sessionId
          }
        };

        this.activeAnalyses.delete(sessionId);
        this.recordAnalysisMetrics(sessionId, Date.now() - startTime, true);
        
        return enhancedResult;
      }

      // Perform analysis using HTTP-compatible Core Engine
      console.log(`Starting analysis for session ${sessionId}`);
      const result = await this.coreEngine.analyzeCode(request);

      // Generate predictions if requested
      if (request.includePredictions) {
        const predictionRequest: PredictionRequest = {
          codeContext: {
            projectPath: request.filePath || '',
            files: [request.filePath || 'inline-code'],
            dependencies: { 
              production: {},
              development: {}
            },
            configuration: request.projectContext?.configuration || {
              language: request.language,
              framework: request.framework || 'unknown',
              buildTool: 'unknown'
            }
          },
          timeHorizon: '30d',
          predictionTypes: ['pattern-evolution', 'bug-prediction', 'refactoring-opportunities']
        };

        try {
          const predictions = await this.coreEngine.predictCodeEvolution(predictionRequest);
          
          (result as any).predictions = predictions;
        } catch (predictionError) {
          console.warn(`Prediction generation failed for session ${sessionId}:`, predictionError);
          // Continue without predictions rather than failing the entire request
        }
      }

      // Cache the result
      await this.cacheManager.set(cacheKey, result, this.config.analysis.cacheTtlMs);

      // Cleanup and metrics
      this.activeAnalyses.delete(sessionId);
      this.recordAnalysisMetrics(sessionId, Date.now() - startTime, true);

      console.log(`Analysis completed for session ${sessionId} in ${Date.now() - startTime}ms`);
      
      this.emit('analysisCompleted', {
        sessionId,
        executionTime: Date.now() - startTime,
        cacheHit: false,
        includedPredictions: request.includePredictions || false
      });

      return result;

    } catch (error) {
      this.activeAnalyses.delete(sessionId);
      this.recordAnalysisMetrics(sessionId, Date.now() - startTime, false);

      console.error(`Analysis failed for session ${sessionId}:`, error);
      
      this.emit('analysisFailed', {
        sessionId,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof Error) {
        throw new HaruspexAPIError(`Analysis failed: ${error.message}`, 'ANALYSIS_ERROR', 422, {
          sessionId,
          executionTime: Date.now() - startTime
        });
      }
      
      throw error;
    }
  }

  /**
   * Generate code evolution predictions
   */
  async predictCodeEvolution(request: PredictionRequest): Promise<PredictionResult> {
    this.ensureOperational();
    
    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    try {
      // Register active prediction
      this.activePredictions.set(sessionId, {
        sessionId,
        request,
        startTime,
        status: 'running'
      });

      // Check cache
      const cacheKey = this.generateCacheKey('prediction', JSON.stringify(request));
      const cachedResult = await this.cacheManager.get(cacheKey) as PredictionResult;
      
      if (cachedResult && this.isPredictionCacheValid(cachedResult, request)) {
        console.log(`Prediction cache hit for session ${sessionId}`);
        
        const enhancedResult = {
          ...cachedResult,
          sessionId,
          timestamp: Date.now()
        };

        this.activePredictions.delete(sessionId);
        this.recordPredictionMetrics(sessionId, Date.now() - startTime, true);
        
        return enhancedResult;
      }

      // Generate predictions using HTTP-compatible Core Engine
      console.log(`Starting prediction for session ${sessionId}`);
      const result = await this.coreEngine.predictCodeEvolution(request);

      // Cache the result (shorter TTL for predictions)
      await this.cacheManager.set(cacheKey, result, Math.floor(this.config.analysis.cacheTtlMs / 2));

      // Cleanup and metrics
      this.activePredictions.delete(sessionId);
      this.recordPredictionMetrics(sessionId, Date.now() - startTime, true);

      console.log(`Prediction completed for session ${sessionId} in ${Date.now() - startTime}ms`);
      
      this.emit('predictionCompleted', {
        sessionId,
        executionTime: Date.now() - startTime,
        confidence: result.confidence,
        timeHorizon: request.timeHorizon
      });

      return result;

    } catch (error) {
      this.activePredictions.delete(sessionId);
      this.recordPredictionMetrics(sessionId, Date.now() - startTime, false);

      console.error(`Prediction failed for session ${sessionId}:`, error);
      
      this.emit('predictionFailed', {
        sessionId,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof Error) {
        throw new HaruspexAPIError(`Prediction failed: ${error.message}`, 'PREDICTION_ERROR', 422, {
          sessionId,
          executionTime: Date.now() - startTime
        });
      }
      
      throw error;
    }
  }

  /**
   * Get comprehensive system diagnostics using HTTP-compatible Core Engine
   */
  async getSystemDiagnostics(): Promise<SystemDiagnostics> {
    // Delegate to HTTP-compatible Core Engine for comprehensive diagnostics
    return await this.coreEngine.getSystemDiagnostics();
  }

  /**
   * Provide skin definition for Templum integration using HTTP-compatible Core Engine
   */
  async provideSkinDefinition(): Promise<UniversalSkinDefinition> {
    // Delegate to HTTP-compatible Core Engine for Templum skin definition
    return await this.coreEngine.provideSkinDefinition();
  }

  /**
   * Get current service status
   */
  getStatus(): ServiceStatus {
    return {
      ...this.serviceStatus,
      uptime: this.startTime > 0 ? Date.now() - this.startTime : 0,
      lastHealthCheck: Date.now()
    };
  }

  /**
   * Check if service has UI components (should always return false for backend service)
   */
  hasUIComponents(): boolean {
    return false;
  }

  /**
   * Get available API endpoints
   */
  getApiEndpoints(): string[] {
    return [
      `ipc://localhost:${this.config.api.ipc.port}`,
      `http://localhost:${this.config.api.http.port}`,
      `ws://localhost:${this.config.api.websocket.port}`
    ];
  }

  /**
   * Gracefully shutdown the service
   */
  async shutdown(): Promise<void> {
    console.log('Haruspex Backend Service: Starting graceful shutdown...');
    this.serviceStatus.status = 'stopping';

    try {
      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = undefined;
      }

      // Stop accepting new requests
      await this.apiGateway.stop();
      this.serviceStatus.components.apiGateway = 'offline';

      // Unregister from Templum
      if (this.templumRegistration) {
        console.log('Haruspex Backend Service: Unregistering from Templum...');
        try {
          await this.templumRegistration.unregister();
          console.log('Haruspex Backend Service: Templum unregistration successful');
        } catch (error) {
          console.warn('Haruspex Backend Service: Templum unregistration failed:', error);
        }
      }

      // Wait for active operations to complete
      await this.waitForActiveOperations();

      // Shutdown components in reverse dependency order
      await this.diagnosticSystem.stop();
      this.serviceStatus.components.diagnostics = 'offline';

      // Shutdown HTTP-compatible Core Engine
      this.coreEngine.dispose();
      this.serviceStatus.components.predictionEngine = 'offline';
      this.serviceStatus.components.analysisEngine = 'offline';

      await this.cacheManager.shutdown();
      this.serviceStatus.components.cache = 'offline';

      this.serviceStatus.status = 'stopped';
      console.log('Haruspex Backend Service: Shutdown complete');
      
      this.emit('shutdown', {
        timestamp: Date.now(),
        totalUptime: Date.now() - this.startTime,
        version: this.serviceStatus.version
      });

    } catch (error) {
      console.error('Haruspex Backend Service: Error during shutdown:', error);
      this.serviceStatus.status = 'critical';
      
      this.emit('shutdownError', {
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  private setupEventHandlers(): void {
    // Handle API Gateway events
    this.apiGateway.on('serverError', (event) => {
      console.error(`API Gateway ${event.type} server error:`, event.error);
      this.updateComponentStatus('apiGateway', 'degraded');
    });

    // Handle Core Engine events (Note: Core Engine uses internal error handling)
    // The Core Engine integrates circuit breakers and error boundaries internally
    // so we rely on its internal reliability mechanisms rather than external event handling

    // Handle diagnostic alerts
    this.diagnosticSystem.on('alert', (alert: any) => {
      console.warn('System alert:', alert);
      this.emit('systemAlert', alert);
    });
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.diagnostics.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const memoryUsage = this.getMemoryUsage();
      const responseTime = await this.getAverageResponseTime();

      // Check memory usage
      if (memoryUsage > this.config.diagnostics.alertThresholds.memoryUsageMB) {
        this.updateServiceStatus('degraded');
        this.emit('healthWarning', {
          type: 'memory',
          value: memoryUsage,
          threshold: this.config.diagnostics.alertThresholds.memoryUsageMB
        });
      }

      // Check response time
      if (responseTime > this.config.diagnostics.alertThresholds.responseTimeMs) {
        this.updateServiceStatus('degraded');
        this.emit('healthWarning', {
          type: 'responseTime',
          value: responseTime,
          threshold: this.config.diagnostics.alertThresholds.responseTimeMs
        });
      }

      // Update health check timestamp
      this.serviceStatus.lastHealthCheck = Date.now();

      // If no issues, ensure status is healthy
      if (this.serviceStatus.status === 'degraded' && 
          memoryUsage <= this.config.diagnostics.alertThresholds.memoryUsageMB &&
          responseTime <= this.config.diagnostics.alertThresholds.responseTimeMs) {
        this.updateServiceStatus('healthy');
      }

    } catch (error) {
      console.error('Health check failed:', error);
      this.updateServiceStatus('critical');
    }
  }

  private ensureOperational(): void {
    if (!this.isInitialized) {
      throw new ServiceUnavailableError('Service is not initialized');
    }
    
    if (this.serviceStatus.status === 'critical' || this.serviceStatus.status === 'stopping') {
      throw new ServiceUnavailableError('Service is not operational');
    }
  }

  private async waitForActiveOperations(): Promise<void> {
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 1000; // 1 second
    let waitTime = 0;

    while ((this.activeAnalyses.size > 0 || this.activePredictions.size > 0) && waitTime < maxWaitTime) {
      console.log(`Waiting for ${this.activeAnalyses.size} analyses and ${this.activePredictions.size} predictions to complete...`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;
    }

    if (this.activeAnalyses.size > 0 || this.activePredictions.size > 0) {
      console.warn('Force stopping with active operations remaining');
    }
  }

  private updateComponentStatus(component: keyof ServiceStatus['components'], status: 'operational' | 'degraded' | 'offline'): void {
    this.serviceStatus.components[component] = status;
    
    // Update overall service status based on component health
    const componentStatuses = Object.values(this.serviceStatus.components);
    if (componentStatuses.some(s => s === 'offline')) {
      this.updateServiceStatus('critical');
    } else if (componentStatuses.some(s => s === 'degraded')) {
      this.updateServiceStatus('degraded');
    } else if (componentStatuses.every(s => s === 'operational')) {
      this.updateServiceStatus('healthy');
    }
  }

  private updateServiceStatus(status: ServiceStatus['status']): void {
    if (this.serviceStatus.status !== status) {
      const previousStatus = this.serviceStatus.status;
      this.serviceStatus.status = status;
      
      this.emit('statusChanged', {
        previousStatus,
        newStatus: status,
        timestamp: Date.now()
      });
    }
  }

  private initializeServiceStatus(): ServiceStatus {
    return {
      status: 'stopped',
      uptime: 0,
      version: '2.1.0',
      components: {
        analysisEngine: 'offline',
        predictionEngine: 'offline',
        apiGateway: 'offline',
        diagnostics: 'offline',
        cache: 'offline'
      },
      performance: {
        totalRequests: 0,
        averageResponseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      lastHealthCheck: 0
    };
  }

  private getPartialInitializationStatus(): Record<string, boolean> {
    return {
      cacheManager: this.serviceStatus.components.cache === 'operational',
      analysisEngine: this.serviceStatus.components.analysisEngine === 'operational',
      predictionEngine: this.serviceStatus.components.predictionEngine === 'operational',
      diagnosticSystem: this.serviceStatus.components.diagnostics === 'operational',
      apiGateway: this.serviceStatus.components.apiGateway === 'operational'
    };
  }

  private getMemoryUsage(): number {
    return Math.round(process.memoryUsage().heapUsed / 1024 / 1024); // MB
  }

  private async getPerformanceMetrics(): Promise<any> {
    return {
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: 0, // Would implement actual CPU monitoring
      uptime: Date.now() - this.startTime,
      activeConnections: this.apiGateway.getStatus().connections.total
    };
  }

  private async getSystemHealth(): Promise<any> {
    return {
      overallHealth: this.calculateOverallHealth(),
      components: this.serviceStatus.components,
      lastCheck: this.serviceStatus.lastHealthCheck
    };
  }

  private async getSystemAlerts(): Promise<any[]> {
    // Would implement actual alert management
    return [];
  }

  private async getTotalAnalyses(): Promise<number> {
    // Would track this metric
    return 0;
  }

  private async getAverageResponseTime(): Promise<number> {
    // Would calculate this from actual metrics
    return 0;
  }

  private async getServiceCapabilities(): Promise<string[]> {
    return [
      'code-analysis',
      'pattern-detection',
      'security-scanning',
      'performance-analysis',
      'architecture-analysis',
      'bug-prediction',
      'refactoring-recommendations',
      'evolution-prediction',
      'real-time-streaming',
      'multi-protocol-api',
      'caching',
      'diagnostics'
    ];
  }

  private calculateOverallHealth(): number {
    const componentWeights = {
      analysisEngine: 0.3,
      predictionEngine: 0.25,
      apiGateway: 0.2,
      diagnostics: 0.15,
      cache: 0.1
    };

    let totalHealth = 0;
    Object.entries(this.serviceStatus.components).forEach(([component, status]) => {
      const weight = componentWeights[component as keyof typeof componentWeights] || 0;
      const health = status === 'operational' ? 100 : status === 'degraded' ? 50 : 0;
      totalHealth += health * weight;
    });

    return Math.round(totalHealth);
  }

  private isCacheValid(cachedResult: AnalysisResult, request: AnalysisRequest): boolean {
    // Simple cache validation - in production would be more sophisticated
    const maxAge = this.config.analysis.cacheTtlMs;
    return (Date.now() - cachedResult.timestamp) < maxAge;
  }

  private isPredictionCacheValid(cachedResult: PredictionResult, request: PredictionRequest): boolean {
    // Predictions have shorter cache validity
    const maxAge = Math.floor(this.config.analysis.cacheTtlMs / 2);
    return (Date.now() - cachedResult.timestamp) < maxAge;
  }

  private generateCacheKey(type: string, content: string): string {
    // Simple cache key generation
    return `${type}:${this.hashString(content)}`;
  }

  private hashString(str: string): string {
    // Simple hash function - would use crypto in production
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordAnalysisMetrics(sessionId: string, duration: number, success: boolean): void {
    // Would implement comprehensive metrics tracking
    this.emit('analysisMetrics', { sessionId, duration, success });
  }

  private recordPredictionMetrics(sessionId: string, duration: number, success: boolean): void {
    // Would implement comprehensive metrics tracking  
    this.emit('predictionMetrics', { sessionId, duration, success });
  }
}
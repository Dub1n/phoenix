/**---
 * title: [API Gateway - HTTP-First Backend Communication Hub]
 * tags: [API, Gateway, HTTP-First, Backend, Templum-Compatible]
 * provides: [HTTP-Protocol-Management, Request-Routing, Client-Communication]
 * requires: [HTTP-Server, WebSocket-Server, Core-Engine]
 * description: [Templum 2.1 compatible API gateway with HTTP-first communication for Haruspex backend]
 * ---*/

import { EventEmitter } from 'events';
import { 
  HaruspexServiceConfig, 
  AnalysisRequest, 
  AnalysisResult,
  PredictionRequest,
  PredictionResult,
  SystemDiagnostics,
  HTTPRequest,
  HTTPResponse,
  WebSocketMessage,
  APIResponse,
  StreamResponse,
  HaruspexAPIError,
  ValidationError,
  RateLimitError,
  ServiceUnavailableError
} from '../types/api-contracts';
import { HTTPServer } from './protocols/http-server';
import { WebSocketServer } from './protocols/websocket-server';
import { RequestRouter } from './routing/request-router';
import { AuthenticationManager } from './auth/auth-manager';
import { RateLimiter } from './middleware/rate-limiter';
import { RequestValidator } from './validation/request-validator';
import { ResponseFormatter } from './formatting/response-formatter';
import { TemplumConfigurationManager } from '../../config/templum-configuration-manager';

export interface ClientConnection {
  id: string;
  type: 'http' | 'websocket';
  client: any;
  connectedAt: number;
  lastActivity: number;
  metadata?: {
    userAgent?: string;
    clientId?: string;
    sessionId?: string;
  };
}

export interface GatewayMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
}

/**
 * API Gateway - HTTP-First communication hub for Templum integration
 * 
 * Manages HTTP and WebSocket protocol servers and routes requests
 * to the appropriate Haruspex Core Engine methods while providing authentication,
 * rate limiting, validation, and response formatting.
 */
export class APIGateway extends EventEmitter {
  private httpServer: HTTPServer;
  private webSocketServer: WebSocketServer;
  private requestRouter: RequestRouter;
  private authManager: AuthenticationManager;
  private rateLimiter: RateLimiter;
  private validator: RequestValidator;
  private formatter: ResponseFormatter;
  
  private activeConnections: Map<string, ClientConnection> = new Map();
  private metrics: GatewayMetrics = this.initializeMetrics();
  private monitoringInterval?: NodeJS.Timeout;
  private isRunning = false;

  // Reference to system components (injected during startup)
  private coreEngine?: any;
  private cacheManager?: any;
  private diagnosticSystem?: any;
  private configManager?: TemplumConfigurationManager;

  constructor(private config: HaruspexServiceConfig['api']) {
    super();
    
    // Initialize protocol servers
    this.httpServer = new HTTPServer(config.http);
    this.webSocketServer = new WebSocketServer(config.websocket);
    
    // Initialize middleware and utilities
    this.requestRouter = new RequestRouter();
    this.authManager = new AuthenticationManager();
    this.rateLimiter = new RateLimiter(config.http.rateLimit);
    this.validator = new RequestValidator();
    this.formatter = new ResponseFormatter();
    
    // Setup event handlers
    this.setupEventHandlers();
  }

  /**
   * Start HTTP-first protocol servers for Templum integration
   */
  async start(coreEngine: any, cacheManager?: any, diagnosticSystem?: any, configManager?: TemplumConfigurationManager): Promise<void> {
    if (this.isRunning) {
      throw new Error('API Gateway is already running');
    }

    console.log('API Gateway: Starting HTTP-first protocol servers...');
    this.coreEngine = coreEngine;
    this.cacheManager = cacheManager;
    this.diagnosticSystem = diagnosticSystem;
    this.configManager = configManager;
    
    // Set up diagnostic system component references
    if (this.diagnosticSystem) {
      this.diagnosticSystem.setSystemComponents({
        apiGateway: this,
        coreEngine: this.coreEngine,
        cacheManager: this.cacheManager
      });
    }

    try {
      // Start HTTP and WebSocket servers in parallel
      await Promise.all([
        this.startHTTPServer(),
        this.startWebSocketServer()
      ]);

      // Setup request routing
      this.setupRequestRouting();

      // Start connection monitoring
      this.startConnectionMonitoring();

      this.isRunning = true;
      console.log('API Gateway: HTTP-first servers started and ready');
      
      this.emit('started', {
        timestamp: Date.now(),
        servers: {
          http: this.config.http.port,
          websocket: this.config.websocket.port
        }
      });

    } catch (error) {
      console.error('API Gateway: Failed to start servers:', error);
      await this.stop(); // Clean up any partially started servers
      throw error;
    }
  }

  /**
   * Stop all servers and clean up resources
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('API Gateway: Stopping all servers...');

    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    // Stop accepting new connections
    await Promise.all([
      this.httpServer.stop(),
      this.webSocketServer.stop()
    ]);

    // Close all active connections gracefully
    await this.closeAllConnections();

    this.isRunning = false;
    console.log('API Gateway: All servers stopped');
    
    this.emit('stopped', {
      timestamp: Date.now(),
      finalMetrics: { ...this.metrics }
    });
  }

  /**
   * Handle comprehensive health check request for Templum compliance
   */
  private async handleHealthCheck(): Promise<HTTPResponse> {
    const startTime = Date.now();
    
    try {
      let healthStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
      let systemDiagnostics: any = null;
      let errorMessage: string | null = null;

      // Get comprehensive system diagnostics if available
      if (this.diagnosticSystem) {
        try {
          systemDiagnostics = await this.diagnosticSystem.getSystemDiagnostics();
          healthStatus = this.diagnosticSystem.getHealthStatus();
        } catch (error) {
          console.error('Health Check: Error getting system diagnostics:', error);
          healthStatus = 'degraded';
          errorMessage = error instanceof Error ? error.message : 'Diagnostic system error';
        }
      } else {
        healthStatus = 'degraded';
        errorMessage = 'Diagnostic system not available';
      }

      // Build comprehensive health response
      const healthResponse: any = {
        // Basic service information
        status: healthStatus,
        service: 'haruspex-analysis',
        version: '2.1.0',
        timestamp: Date.now(),
        uptime: Math.floor(process.uptime()),
        templumCompatible: true,
        
        // Processing time for health check
        healthCheckTime: Date.now() - startTime,
        
        // System overview
        system: {
          nodejs: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
            percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
          }
        },

        // Server status
        servers: {
          http: {
            running: this.httpServer?.isRunning() || false,
            port: this.config.http.port
          },
          websocket: {
            running: this.webSocketServer?.isRunning() || false,
            port: this.config.websocket.port
          }
        },

        // API Gateway metrics
        metrics: {
          totalRequests: this.metrics.totalRequests,
          successfulRequests: this.metrics.successfulRequests,
          failedRequests: this.metrics.failedRequests,
          averageResponseTime: this.metrics.averageResponseTime,
          activeConnections: this.activeConnections.size,
          errorRate: this.metrics.errorRate
        }
      };

      // Add comprehensive diagnostics if available
      if (systemDiagnostics) {
        healthResponse.diagnostics = {
          coreEngine: systemDiagnostics.coreEngine,
          performance: systemDiagnostics.performance,
          health: systemDiagnostics.health,
          alertCount: systemDiagnostics.alerts?.length || 0,
          activeAlerts: systemDiagnostics.alerts?.filter((alert: any) => !alert.resolved).length || 0
        };
      }

      // Add error information if present
      if (errorMessage) {
        healthResponse.warnings = [errorMessage];
      }

      // Set appropriate HTTP status code based on health
      const httpStatusCode = healthStatus === 'healthy' ? 200 : 
                           healthStatus === 'degraded' ? 503 : 500;

      return {
        status: httpStatusCode,
        headers: { 'Content-Type': 'application/json' },
        body: healthResponse,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Health Check: Critical error during health check:', error);
      
      // Return minimal error response
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          status: 'critical',
          service: 'haruspex-analysis',
          version: '2.1.0',
          timestamp: Date.now(),
          templumCompatible: true,
          error: error instanceof Error ? error.message : 'Health check failed',
          healthCheckTime: Date.now() - startTime
        },
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get current gateway status and metrics
   */
  getStatus(): any {
    return {
      running: this.isRunning,
      servers: {
        http: {
          running: this.httpServer.isRunning(),
          port: this.config.http.port,
          activeRequests: this.httpServer.getActiveRequestCount()
        },
        websocket: {
          running: this.webSocketServer.isRunning(),
          port: this.config.websocket.port,
          connections: Array.from(this.activeConnections.values())
            .filter(conn => conn.type === 'websocket').length
        }
      },
      connections: {
        total: this.activeConnections.size,
        byType: this.getConnectionsByType(),
        averageAge: this.calculateAverageConnectionAge()
      },
      metrics: { ...this.metrics },
      performance: {
        requestsPerMinute: this.metrics.requestsPerMinute,
        averageResponseTime: this.metrics.averageResponseTime,
        errorRate: this.metrics.errorRate
      }
    };
  }


  private async startHTTPServer(): Promise<void> {
    // Setup middleware
    this.httpServer.use(this.authManager.middleware());
    this.httpServer.use(this.rateLimiter.middleware());

    // Analysis endpoints
    this.httpServer.post('/api/v1/analyze', async (req: HTTPRequest): Promise<HTTPResponse> => {
      return this.handleHTTPRequest('analyze', req);
    });

    // Prediction endpoints
    this.httpServer.post('/api/v1/predict', async (req: HTTPRequest): Promise<HTTPResponse> => {
      return this.handleHTTPRequest('predict', req);
    });

    // Diagnostics endpoints
    this.httpServer.get('/api/v1/diagnostics', async (req: HTTPRequest): Promise<HTTPResponse> => {
      return this.handleHTTPRequest('diagnostics', req);
    });

    // Skin definition endpoint
    this.httpServer.get('/api/v1/skin', async (req: HTTPRequest): Promise<HTTPResponse> => {
      return this.handleHTTPRequest('skin', req);
    });

    // ML model management endpoints
    this.httpServer.post('/api/v1/models/refresh', async (req: HTTPRequest): Promise<HTTPResponse> => {
      return this.handleHTTPRequest('refreshModels', req);
    });

    // ===== TEMPLUM 1.2 COMPATIBILITY ENDPOINTS =====
    
    // Templum skin definition endpoint (required)
    this.httpServer.get('/getSkinDefinition', async (req: HTTPRequest): Promise<HTTPResponse> => {
      return this.handleHTTPRequest('skin', req);
    });

    // Templum command execution endpoint (required)
    this.httpServer.post('/executeCommand', async (req: HTTPRequest): Promise<HTTPResponse> => {
      return this.handleTemplumCommand(req);
    });

    // Health check endpoint (Templum compatible)
    this.httpServer.get('/health', async (req: HTTPRequest): Promise<HTTPResponse> => {
      return this.handleHealthCheck();
    });

    await this.httpServer.start();
    console.log(`API Gateway: HTTP server listening on port ${this.config.http.port}`);
  }

  private async startWebSocketServer(): Promise<void> {
    // Setup WebSocket server for streaming analysis
    this.webSocketServer.on('connection', (client: any) => {
      const connectionId = this.generateConnectionId();
      
      const connection: ClientConnection = {
        id: connectionId,
        type: 'websocket',
        client,
        connectedAt: Date.now(),
        lastActivity: Date.now()
      };
      
      this.activeConnections.set(connectionId, connection);

      // Setup message handlers
      client.on('message', async (data: string) => {
        try {
          const message: WebSocketMessage = JSON.parse(data);
          await this.handleWebSocketMessage(connectionId, message);
        } catch (error) {
          client.send(JSON.stringify({
            type: 'error',
            error: 'Invalid message format',
            timestamp: Date.now()
          }));
        }
      });

      client.on('close', () => {
        this.activeConnections.delete(connectionId);
        this.emit('connectionClosed', { connectionId, type: 'websocket' });
      });

      // Send welcome message
      client.send(JSON.stringify({
        type: 'connected',
        connectionId,
        capabilities: ['streaming-analysis', 'real-time-predictions', 'live-diagnostics'],
        timestamp: Date.now()
      }));

      this.emit('connectionOpened', { connectionId, type: 'websocket' });
      console.log(`API Gateway: WebSocket client connected (${connectionId})`);
    });

    await this.webSocketServer.start();
    console.log(`API Gateway: WebSocket server listening on port ${this.config.websocket.port}`);
  }


  private async handleHTTPRequest(endpoint: string, req: HTTPRequest): Promise<HTTPResponse> {
    this.metrics.totalRequests++;
    const startTime = Date.now();

    try {
      // Validate request
      this.validator.validateHTTPRequest(req);

      // Route request based on endpoint
      let result: any;
      
      switch (endpoint) {
        case 'analyze':
          result = await this.routeRequest('analyze', req.body, 'http', req.headers);
          break;
        case 'predict':
          result = await this.routeRequest('predict', req.body, 'http', req.headers);
          break;
        case 'diagnostics':
          result = await this.routeRequest('diagnostics', null, 'http', req.headers);
          break;
        case 'skin':
          result = await this.routeRequest('skin', null, 'http', req.headers);
          break;
        default:
          throw new ValidationError(`Unknown endpoint: ${endpoint}`);
      }

      // Format successful response
      const apiResponse: APIResponse = this.formatter.formatSuccess(result, {
        requestId: this.generateRequestId(),
        processingTime: Date.now() - startTime
      });

      this.updateSuccessMetrics(Date.now() - startTime);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: apiResponse,
        timestamp: Date.now()
      };

    } catch (error) {
      this.updateErrorMetrics();
      
      const apiResponse: APIResponse = this.formatter.formatError(error as Error, {
        requestId: this.generateRequestId(),
        processingTime: Date.now() - startTime
      });

      const statusCode = error instanceof HaruspexAPIError ? error.statusCode : 500;

      return {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: apiResponse,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Handle Templum command execution requests
   */
  private async handleTemplumCommand(req: HTTPRequest): Promise<HTTPResponse> {
    this.metrics.totalRequests++;
    const startTime = Date.now();

    try {
      // Validate request structure
      if (!req.body || !req.body.command) {
        throw new ValidationError('Command is required for Templum execution');
      }

      const { command, args = {} } = req.body;
      
      console.log(`Templum: Executing command ${command}`, args);

      let result: any;

      // Map Templum commands to existing backend operations
      switch (command) {
        case 'haruspex.analyzeCode':
          if (!args.code) {
            throw new ValidationError('Code content is required for analysis');
          }
          result = await this.routeRequest('analyze', {
            code: args.code,
            language: args.language || 'typescript',
            framework: args.framework,
            depth: args.depth || 'standard',
            includeExecution: args.includeExecution || false
          }, 'http');
          break;

        case 'haruspex.predictEvolution':
          if (!args.codeContext) {
            throw new ValidationError('Code context is required for predictions');
          }
          result = await this.routeRequest('predict', {
            codeContext: args.codeContext,
            timeHorizon: args.timeHorizon || '90d',
            historicalData: args.historicalData
          }, 'http');
          break;

        case 'haruspex.getDiagnostics':
          result = await this.routeRequest('diagnostics', null, 'http');
          break;

        case 'haruspex.getHealthStatus':
          result = {
            status: 'healthy',
            service: 'haruspex-analysis',
            version: '2.1.0',
            timestamp: Date.now(),
            uptime: Math.floor(process.uptime())
          };
          break;

        case 'haruspex.clearCache':
          if (this.cacheManager) {
            await this.cacheManager.clearAll();
            result = {
              action: 'cache_cleared',
              timestamp: Date.now(),
              message: 'Analysis cache has been cleared successfully',
              cleared: true
            };
          } else {
            result = {
              action: 'cache_cleared',
              timestamp: Date.now(),
              message: 'Cache manager not available - operating without cache',
              cleared: false
            };
          }
          break;

        case 'haruspex.refreshModels':
          if (this.coreEngine && this.coreEngine.refreshMLModels) {
            try {
              // Use the integrated PredictionEngine's refreshModels functionality
              const refreshResult = await this.coreEngine.refreshMLModels();
              result = {
                action: refreshResult.success ? 'models_refreshed' : 'models_refresh_failed',
                timestamp: refreshResult.timestamp,
                message: refreshResult.message,
                refreshed: refreshResult.success,
                components: refreshResult.success ? ['prediction-engine', 'model-manager'] : [],
                details: refreshResult.success ? 'ML models refreshed via HTTP-integrated PredictionEngine' : 'ML model refresh failed'
              };
            } catch (error) {
              result = {
                action: 'models_refresh_failed',
                timestamp: Date.now(),
                message: `Model refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                refreshed: false,
                error: 'core-engine-error'
              };
            }
          } else {
            result = {
              action: 'models_refresh_failed',
              timestamp: Date.now(),
              message: 'Core engine or ML model refresh capability not available',
              refreshed: false,
              error: 'core-engine-unavailable'
            };
          }
          break;

        // Configuration management commands
        case 'haruspex.getConfiguration':
          if (this.configManager) {
            result = {
              action: 'configuration_retrieved',
              timestamp: Date.now(),
              configuration: this.configManager.getConfiguration(),
              templumService: this.configManager.getTemplumServiceDefinition()
            };
          } else {
            result = {
              action: 'configuration_unavailable',
              timestamp: Date.now(),
              message: 'Configuration manager not available',
              error: 'config-manager-unavailable'
            };
          }
          break;

        case 'haruspex.updateConfiguration':
          if (this.configManager) {
            if (!args.section || !args.updates) {
              throw new ValidationError('Configuration section and updates are required');
            }
            try {
              const validation = await this.configManager.updateConfiguration({
                section: args.section,
                updates: args.updates,
                validate: args.validate !== false,
                persist: args.persist !== false
              });
              result = {
                action: 'configuration_updated',
                timestamp: Date.now(),
                section: args.section,
                validation,
                success: validation.valid,
                message: validation.valid ? 'Configuration updated successfully' : 'Configuration update failed validation'
              };
            } catch (error) {
              result = {
                action: 'configuration_update_failed',
                timestamp: Date.now(),
                message: `Configuration update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: 'config-update-error'
              };
            }
          } else {
            result = {
              action: 'configuration_update_failed',
              timestamp: Date.now(),
              message: 'Configuration manager not available',
              error: 'config-manager-unavailable'
            };
          }
          break;

        case 'haruspex.validateConfiguration':
          if (this.configManager) {
            const config = args.configuration || this.configManager.getConfiguration();
            const validation = this.configManager.validateConfiguration(config);
            result = {
              action: 'configuration_validated',
              timestamp: Date.now(),
              validation,
              valid: validation.valid
            };
          } else {
            result = {
              action: 'configuration_validation_failed',
              timestamp: Date.now(),
              message: 'Configuration manager not available',
              error: 'config-manager-unavailable'
            };
          }
          break;

        case 'haruspex.revertConfiguration':
          if (this.configManager) {
            try {
              const historyIndex = args.historyIndex || 0;
              await this.configManager.revertConfiguration(historyIndex);
              result = {
                action: 'configuration_reverted',
                timestamp: Date.now(),
                historyIndex,
                message: `Configuration reverted to history index ${historyIndex}`,
                reverted: true
              };
            } catch (error) {
              result = {
                action: 'configuration_revert_failed',
                timestamp: Date.now(),
                message: `Configuration revert failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: 'config-revert-error'
              };
            }
          } else {
            result = {
              action: 'configuration_revert_failed',
              timestamp: Date.now(),
              message: 'Configuration manager not available',
              error: 'config-manager-unavailable'
            };
          }
          break;

        case 'haruspex.getConfigurationHistory':
          if (this.configManager) {
            const history = this.configManager.getConfigurationHistory();
            result = {
              action: 'configuration_history_retrieved',
              timestamp: Date.now(),
              history,
              count: history.length
            };
          } else {
            result = {
              action: 'configuration_history_unavailable',
              timestamp: Date.now(),
              message: 'Configuration manager not available',
              error: 'config-manager-unavailable'
            };
          }
          break;

        default:
          throw new ValidationError(`Unknown Templum command: ${command}. Available commands: haruspex.analyzeCode, haruspex.predictEvolution, haruspex.getDiagnostics, haruspex.getHealthStatus, haruspex.clearCache, haruspex.refreshModels, haruspex.getConfiguration, haruspex.updateConfiguration, haruspex.validateConfiguration, haruspex.revertConfiguration, haruspex.getConfigurationHistory`);
      }

      // Format Templum response
      const templumResponse = {
        success: true,
        result,
        command,
        timestamp: Date.now(),
        backend: 'haruspex-2.1',
        processingTime: Date.now() - startTime
      };

      this.updateSuccessMetrics(Date.now() - startTime);

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: templumResponse,
        timestamp: Date.now()
      };

    } catch (error) {
      this.updateErrorMetrics();
      
      console.error(`Templum command execution error:`, error);
      
      const templumErrorResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        command: req.body?.command || 'unknown',
        timestamp: Date.now(),
        backend: 'haruspex-2.1',
        processingTime: Date.now() - startTime,
        availableCommands: [
          'haruspex.analyzeCode',
          'haruspex.predictEvolution', 
          'haruspex.getDiagnostics',
          'haruspex.getHealthStatus',
          'haruspex.clearCache',
          'haruspex.refreshModels'
        ]
      };

      const statusCode = error instanceof HaruspexAPIError ? error.statusCode : 500;

      return {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: templumErrorResponse,
        timestamp: Date.now()
      };
    }
  }

  private async handleWebSocketMessage(connectionId: string, message: WebSocketMessage): Promise<void> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    connection.lastActivity = Date.now();
    this.metrics.totalRequests++;

    const startTime = Date.now();

    try {
      // Handle different message types
      switch (message.type) {
        case 'request':
          const result = await this.routeRequest(message.method!, message.payload, 'websocket');
          
          const response: WebSocketMessage = {
            type: 'response',
            id: message.id,
            payload: result,
            timestamp: Date.now()
          };

          (connection.client as any).send(JSON.stringify(response));
          break;

        case 'stream':
          // Handle streaming requests (for long-running analyses)
          await this.handleStreamingRequest(connectionId, message);
          break;

        case 'heartbeat':
          // Respond to heartbeat
          const heartbeat: WebSocketMessage = {
            type: 'heartbeat',
            timestamp: Date.now()
          };
          (connection.client as any).send(JSON.stringify(heartbeat));
          break;

        default:
          throw new ValidationError(`Unsupported message type: ${message.type}`);
      }

      this.updateSuccessMetrics(Date.now() - startTime);

    } catch (error) {
      const errorResponse: WebSocketMessage = {
        type: 'error',
        id: message.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };

      (connection.client as any).send(JSON.stringify(errorResponse));
      this.updateErrorMetrics();
    }
  }

  private async routeRequest(method: string, payload: any, protocol: string, httpHeaders?: Record<string, string>): Promise<any> {
    if (!this.coreEngine) {
      throw new ServiceUnavailableError('Core engine not available');
    }

    // Apply rate limiting for all protocols
    await this.rateLimiter.checkLimit(`${protocol}:${method}`);

    const startTime = Date.now();
    
    switch (method) {
      case 'analyze':
        if (!payload || !payload.code) {
          throw new ValidationError('Code content is required for analysis');
        }
        return await this.handleCachedAnalysis(payload as AnalysisRequest, httpHeaders);

      case 'predict':
        if (!payload || !payload.codeContext) {
          throw new ValidationError('Code context is required for predictions');
        }
        return await this.handleCachedPrediction(payload as PredictionRequest, httpHeaders);

      case 'diagnostics':
        return await this.coreEngine.getSystemDiagnostics();

      case 'skin':
        return await this.coreEngine.provideSkinDefinition();

      case 'refreshModels':
        if (!this.coreEngine.refreshMLModels) {
          throw new ServiceUnavailableError('ML model refresh capability not available');
        }
        return await this.coreEngine.refreshMLModels();

      default:
        throw new ValidationError(`Unknown method: ${method}`);
    }
  }

  private async handleStreamingRequest(connectionId: string, message: WebSocketMessage): Promise<void> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    // Start streaming analysis
    const sessionId = this.generateSessionId();
    
    try {
      // Send stream start
      const startMessage: StreamResponse = {
        type: 'start',
        sessionId,
        timestamp: Date.now()
      };
      (connection.client as any).send(JSON.stringify(startMessage));

      // Execute analysis with progress updates
      const result = await this.executeWithProgress(
        sessionId,
        message.method!,
        message.payload,
        (progress) => {
          const progressMessage: StreamResponse = {
            type: 'progress',
            sessionId,
            timestamp: Date.now(),
            progress
          };
          (connection.client as any).send(JSON.stringify(progressMessage));
        }
      );

      // Send final result
      const completeMessage: StreamResponse = {
        type: 'complete',
        sessionId,
        timestamp: Date.now(),
        data: result
      };
      (connection.client as any).send(JSON.stringify(completeMessage));

    } catch (error) {
      const errorMessage: StreamResponse = {
        type: 'error',
        sessionId,
        timestamp: Date.now(),
        error: {
          code: error instanceof HaruspexAPIError ? error.code : 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
      (connection.client as any).send(JSON.stringify(errorMessage));
    }
  }

  private async executeWithProgress(
    sessionId: string,
    method: string,
    payload: any,
    onProgress: (progress: any) => void
  ): Promise<any> {
    // This would integrate with the core engine's progress reporting
    // For now, simulate progress updates
    const phases = ['initialization', 'analysis', 'prediction', 'finalization'];
    
    for (let i = 0; i < phases.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
      
      onProgress({
        current: i + 1,
        total: phases.length,
        percentage: Math.round(((i + 1) / phases.length) * 100),
        phase: phases[i]
      });
    }

    // Execute the actual request
    return await this.routeRequest(method, payload, 'websocket');
  }

  // HTTP-Optimized Cache Integration Methods

  /**
   * Handle cached analysis with HTTP-optimized caching strategy
   */
  private async handleCachedAnalysis(request: AnalysisRequest, httpHeaders?: Record<string, string>): Promise<any> {
    if (!this.cacheManager) {
      // Fall back to direct core engine call if cache not available
      return await this.coreEngine.analyzeCode(request);
    }

    const startTime = Date.now();
    
    try {
      // Check for cached result with ETag support
      const ifNoneMatch = httpHeaders?.['if-none-match'];
      const cachedResult = await this.cacheManager.getCachedAnalysisResult(request, ifNoneMatch);
      
      if (cachedResult.result === null && cachedResult.etag && ifNoneMatch) {
        // 304 Not Modified - return minimal response
        console.log(`Analysis cache ETag match - returning 304 Not Modified`);
        return {
          status: 304,
          headers: {
            'ETag': cachedResult.etag,
            'Cache-Control': 'max-age=3600, must-revalidate'
          }
        };
      }
      
      if (cachedResult.result) {
        // Cache hit - return cached result with HTTP headers
        const responseTime = Date.now() - startTime;
        console.log(`Analysis cache ${cachedResult.tier} tier hit (${responseTime}ms)`);
        
        return {
          ...cachedResult.result,
          metadata: {
            ...cachedResult.result.metadata,
            cacheHit: true,
            cacheTier: cachedResult.tier,
            responseTime
          },
          httpHeaders: cachedResult.httpHeaders
        };
      }
      
      // Cache miss - execute analysis and cache result
      console.log(`Analysis cache miss - executing analysis`);
      const result = await this.coreEngine.analyzeCode(request);
      
      // Cache the result asynchronously (don't block response)
      this.cacheManager.cacheAnalysisResult(request, result, httpHeaders)
        .catch((error: any) => console.error('Failed to cache analysis result:', error));
      
      const responseTime = Date.now() - startTime;
      return {
        ...result,
        metadata: {
          ...result.metadata,
          cacheHit: false,
          responseTime
        }
      };
      
    } catch (error) {
      console.error('Error in cached analysis handling:', error);
      // Fall back to direct core engine call on cache errors
      return await this.coreEngine.analyzeCode(request);
    }
  }

  /**
   * Handle cached prediction with HTTP-optimized caching strategy
   */
  private async handleCachedPrediction(request: PredictionRequest, httpHeaders?: Record<string, string>): Promise<any> {
    if (!this.cacheManager) {
      // Fall back to direct core engine call if cache not available
      return await this.coreEngine.predictCodeEvolution(request);
    }

    const startTime = Date.now();
    
    try {
      // Check for cached result
      const cachedResult = await this.cacheManager.getCachedPredictionResult(request);
      
      if (cachedResult) {
        // Cache hit - return cached result
        const responseTime = Date.now() - startTime;
        console.log(`Prediction cache hit (${responseTime}ms)`);
        
        return {
          ...cachedResult,
          metadata: {
            ...cachedResult.metadata || {},
            cacheHit: true,
            responseTime
          }
        };
      }
      
      // Cache miss - execute prediction and cache result
      console.log(`Prediction cache miss - executing prediction`);
      const result = await this.coreEngine.predictCodeEvolution(request);
      
      // Cache the result asynchronously (don't block response)
      this.cacheManager.cachePredictionResult(request, result)
        .catch((error: any) => console.error('Failed to cache prediction result:', error));
      
      const responseTime = Date.now() - startTime;
      return {
        ...result,
        metadata: {
          ...result.metadata || {},
          cacheHit: false,
          responseTime
        }
      };
      
    } catch (error) {
      console.error('Error in cached prediction handling:', error);
      // Fall back to direct core engine call on cache errors
      return await this.coreEngine.predictCodeEvolution(request);
    }
  }

  /**
   * Get cache performance metrics for monitoring
   */
  getCacheMetrics(): any {
    if (!this.cacheManager || !this.cacheManager.getPerformanceMetrics) {
      return {
        available: false,
        message: 'Cache manager not available or metrics not supported'
      };
    }

    const metrics = this.cacheManager.getPerformanceMetrics();
    return {
      available: true,
      ...metrics,
      timestamp: Date.now()
    };
  }

  private setupRequestRouting(): void {
    // Configure request routing policies
    this.requestRouter.addRoute('analyze', {
      priority: 1,
      timeout: 30000,
      retries: 1,
      rateLimit: { requests: 10, windowMs: 60000 }
    });

    this.requestRouter.addRoute('predict', {
      priority: 2,
      timeout: 45000,
      retries: 1,
      rateLimit: { requests: 5, windowMs: 60000 }
    });

    this.requestRouter.addRoute('diagnostics', {
      priority: 3,
      timeout: 5000,
      retries: 2,
      rateLimit: { requests: 20, windowMs: 60000 }
    });

    this.requestRouter.addRoute('refreshModels', {
      priority: 4,
      timeout: 60000,  // Longer timeout for model refresh
      retries: 1,
      rateLimit: { requests: 2, windowMs: 300000 }  // More restrictive rate limiting (2 requests per 5 minutes)
    });

    // Configuration management routes
    this.requestRouter.addRoute('getConfig', {
      priority: 5,
      timeout: 5000,
      retries: 2,
      rateLimit: { requests: 50, windowMs: 60000 }
    });

    this.requestRouter.addRoute('updateConfig', {
      priority: 5,
      timeout: 10000,
      retries: 1,
      rateLimit: { requests: 10, windowMs: 60000 }  // Moderate rate limiting for config updates
    });

    this.requestRouter.addRoute('validateConfig', {
      priority: 5,
      timeout: 8000,
      retries: 1,
      rateLimit: { requests: 20, windowMs: 60000 }
    });

    this.requestRouter.addRoute('revertConfig', {
      priority: 5,
      timeout: 8000,
      retries: 1,
      rateLimit: { requests: 5, windowMs: 300000 }  // Restrictive rate limiting for config reverts
    });
  }

  private setupEventHandlers(): void {
    // Handle server events
    this.httpServer.on('error', (error) => {
      this.emit('serverError', { type: 'http', error });
    });

    this.webSocketServer.on('error', (error) => {
      this.emit('serverError', { type: 'websocket', error });
    });
  }

  private startConnectionMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.cleanupStaleConnections();
      this.updateMetrics();
    }, 30000); // Every 30 seconds
  }

  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 300000; // 5 minutes

    for (const [connectionId, connection] of Array.from(this.activeConnections.entries())) {
      if (now - connection.lastActivity > staleThreshold) {
        console.log(`API Gateway: Cleaning up stale connection ${connectionId}`);
        this.activeConnections.delete(connectionId);
        
        try {
          if (connection.type === 'websocket') {
            (connection.client as any).close();
          }
        } catch (error) {
          console.warn(`Error closing stale connection: ${error}`);
        }
      }
    }
  }

  private async closeAllConnections(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const connection of Array.from(this.activeConnections.values())) {
      const promise = new Promise<void>((resolve) => {
        try {
          if (connection.type === 'websocket') {
            (connection.client as any).close();
          }
        } catch (error) {
          console.warn(`Error closing connection: ${error}`);
        }
        resolve();
      });
      closePromises.push(promise);
    }

    await Promise.all(closePromises);
    this.activeConnections.clear();
  }

  private updateSuccessMetrics(responseTime: number): void {
    this.metrics.successfulRequests++;
    this.updateAverageResponseTime(responseTime);
  }

  private updateErrorMetrics(): void {
    this.metrics.failedRequests++;
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageResponseTime = 
      ((this.metrics.averageResponseTime * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  private updateMetrics(): void {
    this.metrics.activeConnections = this.activeConnections.size;
    this.metrics.errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.failedRequests / this.metrics.totalRequests 
      : 0;
    
    // Calculate requests per minute (simplified)
    this.metrics.requestsPerMinute = Math.round(this.metrics.totalRequests / 60);
  }

  private getConnectionsByType(): Record<string, number> {
    const byType: Record<string, number> = { http: 0, websocket: 0 };
    
    for (const connection of Array.from(this.activeConnections.values())) {
      byType[connection.type]++;
    }
    
    return byType;
  }

  private calculateAverageConnectionAge(): number {
    if (this.activeConnections.size === 0) return 0;
    
    const now = Date.now();
    let totalAge = 0;
    for (const connection of Array.from(this.activeConnections.values())) {
      totalAge += (now - connection.connectedAt);
    }
    
    return Math.round(totalAge / this.activeConnections.size);
  }

  private initializeMetrics(): GatewayMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      activeConnections: 0,
      requestsPerMinute: 0,
      errorRate: 0
    };
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

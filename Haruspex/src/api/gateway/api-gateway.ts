/**---
 * title: [API Gateway - Multi-Protocol Backend Communication Hub]
 * tags: [API, Gateway, Multi-Protocol, Backend, Service-Orchestration]
 * provides: [Protocol-Management, Request-Routing, Client-Communication]
 * requires: [IPC-Server, HTTP-Server, WebSocket-Server, Core-Engine]
 * description: [Central API gateway coordinating IPC, HTTP, and WebSocket protocols for Haruspex 2.0]
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
  IPCMessage,
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
import { IPCServer } from './protocols/ipc-server';
import { HTTPServer } from './protocols/http-server';
import { WebSocketServer } from './protocols/websocket-server';
import { RequestRouter } from './routing/request-router';
import { AuthenticationManager } from './auth/auth-manager';
import { RateLimiter } from './middleware/rate-limiter';
import { RequestValidator } from './validation/request-validator';
import { ResponseFormatter } from './formatting/response-formatter';

export interface ClientConnection {
  id: string;
  type: 'ipc' | 'http' | 'websocket';
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
 * API Gateway - Central coordination point for all client communication
 * 
 * Manages multiple protocol servers (IPC, HTTP, WebSocket) and routes requests
 * to the appropriate Haruspex Core Engine methods while providing authentication,
 * rate limiting, validation, and response formatting.
 */
export class APIGateway extends EventEmitter {
  private ipcServer: IPCServer;
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

  // Reference to the core engine (injected during startup)
  private coreEngine?: any;

  constructor(private config: HaruspexServiceConfig['api']) {
    super();
    
    // Initialize protocol servers
    this.ipcServer = new IPCServer(config.ipc);
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
   * Start all protocol servers and begin accepting connections
   */
  async start(coreEngine: any): Promise<void> {
    if (this.isRunning) {
      throw new Error('API Gateway is already running');
    }

    console.log('API Gateway: Starting all protocol servers...');
    this.coreEngine = coreEngine;

    try {
      // Start all protocol servers in parallel
      await Promise.all([
        this.startIPCServer(),
        this.startHTTPServer(),
        this.startWebSocketServer()
      ]);

      // Setup request routing
      this.setupRequestRouting();

      // Start connection monitoring
      this.startConnectionMonitoring();

      this.isRunning = true;
      console.log('API Gateway: All servers started and ready');
      
      this.emit('started', {
        timestamp: Date.now(),
        servers: {
          ipc: this.config.ipc.port,
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
      this.ipcServer.stop(),
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
   * Get current gateway status and metrics
   */
  getStatus(): any {
    return {
      running: this.isRunning,
      servers: {
        ipc: {
          running: this.ipcServer.isRunning(),
          port: this.config.ipc.port,
          connections: Array.from(this.activeConnections.values())
            .filter(conn => conn.type === 'ipc').length
        },
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

  private async startIPCServer(): Promise<void> {
    // Setup IPC server for real-time communication (primary for Templum)
    this.ipcServer.on('connection', (client: any) => {
      const connectionId = this.generateConnectionId();
      
      const connection: ClientConnection = {
        id: connectionId,
        type: 'ipc',
        client,
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        metadata: {
          clientId: client.clientId || 'unknown'
        }
      };
      
      this.activeConnections.set(connectionId, connection);

      // Setup message handlers
      client.on('message', async (message: IPCMessage) => {
        await this.handleIPCMessage(connectionId, message);
      });

      client.on('disconnect', () => {
        this.activeConnections.delete(connectionId);
        this.emit('connectionClosed', { connectionId, type: 'ipc' });
      });

      this.emit('connectionOpened', { connectionId, type: 'ipc' });
      console.log(`API Gateway: IPC client connected (${connectionId})`);
    });

    await this.ipcServer.start();
    console.log(`API Gateway: IPC server listening on port ${this.config.ipc.port}`);
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

    // Health check endpoint
    this.httpServer.get('/health', async (req: HTTPRequest): Promise<HTTPResponse> => {
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          status: 'healthy',
          timestamp: Date.now(),
          version: '2.0.0'
        },
        timestamp: Date.now()
      };
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

  private async handleIPCMessage(connectionId: string, message: IPCMessage): Promise<void> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    connection.lastActivity = Date.now();
    this.metrics.totalRequests++;

    const startTime = Date.now();

    try {
      // Validate message
      this.validator.validateIPCMessage(message);

      let response: any;

      switch (message.type) {
        case 'request':
          response = await this.routeRequest(message.method!, message.payload, 'ipc');
          break;
        default:
          throw new ValidationError(`Unsupported message type: ${message.type}`);
      }

      // Send successful response
      const responseMessage: IPCMessage = {
        id: message.id,
        type: 'response',
        payload: response,
        timestamp: Date.now()
      };

      (connection.client as any).send(responseMessage);

      // Update metrics
      this.updateSuccessMetrics(Date.now() - startTime);

    } catch (error) {
      // Send error response
      const errorMessage: IPCMessage = {
        id: message.id,
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };

      (connection.client as any).send(errorMessage);

      // Update metrics
      this.updateErrorMetrics();
    }
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
          result = await this.routeRequest('analyze', req.body, 'http');
          break;
        case 'predict':
          result = await this.routeRequest('predict', req.body, 'http');
          break;
        case 'diagnostics':
          result = await this.routeRequest('diagnostics', null, 'http');
          break;
        case 'skin':
          result = await this.routeRequest('skin', null, 'http');
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

  private async routeRequest(method: string, payload: any, protocol: string): Promise<any> {
    if (!this.coreEngine) {
      throw new ServiceUnavailableError('Core engine not available');
    }

    // Apply rate limiting for all protocols
    await this.rateLimiter.checkLimit(`${protocol}:${method}`);

    switch (method) {
      case 'analyze':
        if (!payload || !payload.code) {
          throw new ValidationError('Code content is required for analysis');
        }
        return await this.coreEngine.analyzeCode(payload as AnalysisRequest);

      case 'predict':
        if (!payload || !payload.codeContext) {
          throw new ValidationError('Code context is required for predictions');
        }
        return await this.coreEngine.predictCodeEvolution(payload as PredictionRequest);

      case 'diagnostics':
        return await this.coreEngine.getSystemDiagnostics();

      case 'skin':
        return await this.coreEngine.provideSkinDefinition();

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
  }

  private setupEventHandlers(): void {
    // Handle server events
    this.ipcServer.on('error', (error) => {
      this.emit('serverError', { type: 'ipc', error });
    });

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

    for (const [connectionId, connection] of this.activeConnections.entries()) {
      if (now - connection.lastActivity > staleThreshold) {
        console.log(`API Gateway: Cleaning up stale connection ${connectionId}`);
        this.activeConnections.delete(connectionId);
        
        try {
          if (connection.type === 'websocket') {
            (connection.client as any).close();
          } else if (connection.type === 'ipc') {
            (connection.client as any).disconnect();
          }
        } catch (error) {
          console.warn(`Error closing stale connection: ${error}`);
        }
      }
    }
  }

  private async closeAllConnections(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const connection of this.activeConnections.values()) {
      const promise = new Promise<void>((resolve) => {
        try {
          if (connection.type === 'ipc') {
            (connection.client as any).disconnect();
          } else if (connection.type === 'websocket') {
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
    const byType: Record<string, number> = { ipc: 0, http: 0, websocket: 0 };
    
    for (const connection of this.activeConnections.values()) {
      byType[connection.type]++;
    }
    
    return byType;
  }

  private calculateAverageConnectionAge(): number {
    if (this.activeConnections.size === 0) return 0;
    
    const now = Date.now();
    const totalAge = Array.from(this.activeConnections.values())
      .reduce((sum, conn) => sum + (now - conn.connectedAt), 0);
    
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
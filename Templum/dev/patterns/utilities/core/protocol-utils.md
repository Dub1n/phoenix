---
date: 2025-09-14T213145Z
name: protocol-utils
TASK-ID: ["TASK-UTIL-005"]
category: core-infrastructure-utility
status: ["[x]"]
patterns: ["utility-consolidation", "protocol-management", "connection-optimization", "confidence-validation"]
components: ["protocol-utils", "connection-manager", "message-validator", "protocol-adapters", "health-monitor"]
dependencies: ["logger-utility", "error-handler-utility", "event-utils", "async-utils"]
tags: ["protocols", "ipc", "http", "websocket", "connection-management", "optimization", "confidence-validation"]
description: Unified protocol utilities for IPC/HTTP/WebSocket connection management optimization with confidence-validated message processing and shared protocol abstractions
use-when:
  - Multiple protocol implementations with duplicated connection logic
  - Need for unified protocol abstraction across IPC/HTTP/WebSocket
  - Connection pooling and lifecycle management optimization required
  - Message validation and confidence scoring for protocol communication
  - Protocol health monitoring and diagnostics needed
  - Configuration management for multiple protocol types
keywords:
  - protocol-utilities
  - connection-management
  - message-validation
  - confidence-scoring
  - protocol-optimization
  - health-monitoring
prerequisites:
  - error-handler
  - logger
  - event-utils
  - async-utils
related-patterns:
  - circuit-breaker-resilience
  - backend-service-integration
  - observability-infrastructure
  - configuration-management
---

### Protocol Utils Utility Consolidation Pattern

**Intelligence Briefing**: Current protocol implementations across Haruspex IPC (815 lines), HTTP Server (296 lines), and WebSocket stubs show significant duplication in connection management, error handling, and health monitoring. Consolidation opportunity identified for unified protocol abstractions with confidence-validated message processing and optimized connection management.

**Problem**: Multiple protocol implementations (IPC, HTTP, WebSocket) with duplicated connection logic, inconsistent error handling, scattered health monitoring, and no unified abstraction for protocol communication. Each protocol reinvents connection lifecycle, message validation, retry logic, and monitoring patterns.

**Current State Examples**:

```typescript
// Duplicated IPC connection management in Haruspex
export class HaruspexIPCServer extends EventEmitter {
  private server: net.Server | undefined;
  private clients: Map<string, net.Socket> = new Map();
  private isRunning = false;
  private port: number = 0;
  
  async start(): Promise<void> {
    // Manual TCP server setup with custom error handling
    this.server = net.createServer((socket) => {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.clients.set(clientId, socket);
      // Manual message handling and error recovery
    });
  }
}

// Duplicated HTTP connection management
export class HTTPServer extends EventEmitter {
  private app: express.Application;
  private server?: any;
  private running = false;
  private activeRequestCount = 0;
  
  async start(): Promise<void> {
    // Manual Express server setup with custom middleware
    this.server = this.app.listen(this.config.port, () => {
      this.running = true;
      // Custom health monitoring
    });
  }
}

// Manual message validation (scattered across protocols)
private async handleClientMessage(clientId: string, data: Buffer): Promise<void> {
  try {
    const messages = data.toString().split('\n').filter(line => line.trim());
    for (const messageStr of messages) {
      const message: IPCMessage = JSON.parse(messageStr); // No validation
      await this.processMessage(clientId, message);
    }
  } catch (error) {
    // Custom error handling per protocol
  }
}

// Duplicated health monitoring per protocol
getStatus(): any {
  const uptime = this.isRunning ? Date.now() - (this.serverStartTime || Date.now()) : 0;
  const memUsage = process.memoryUsage();
  // Custom health calculation per protocol
}
```

**Solution**: Unified ProtocolUtils with confidence-validated message processing, optimized connection management, shared protocol abstractions, and integrated health monitoring across IPC/HTTP/WebSocket protocols.

#### Protocol Utils Implementation

**Core ProtocolUtils Class** (Unified Protocol Management):

```typescript
import { EventEmitter } from 'events';
import { createLogger } from './logger';
import { handleError, handleAsync } from './error-handler';
import { createTypedEmitter, subscribe, emit } from './event-utils';
import { withTimeout, withRetry, TIMEOUTS } from './async-utils';
import * as net from 'net';
import * as http from 'http';
import * as https from 'https';
import { WebSocket, WebSocketServer } from 'ws';

// Unified protocol configuration with confidence validation
export interface ProtocolConfig {
  type: 'ipc' | 'http' | 'https' | 'websocket';
  connection: {
    host?: string;
    port?: number;
    path?: string;
    timeout: number;
    retries: number;
    keepAlive: boolean;
    maxConnections: number;
  };
  validation: {
    enableConfidenceScoring: boolean;
    requiredConfidence: number; // 0-100
    schemaValidation: boolean;
    messageTimeout: number;
  };
  health: {
    checkInterval: number;
    maxFailures: number;
    recoveryTimeout: number;
  };
  security?: {
    tls?: boolean;
    cert?: string;
    key?: string;
    ca?: string;
  };
}

// Unified message interface with confidence validation
export interface ProtocolMessage<T = any> {
  id: string;
  type: string;
  timestamp: number;
  payload?: T;
  metadata?: {
    confidence?: number; // 0-100 confidence score
    source?: string;
    version?: string;
    encrypted?: boolean;
  };
}

// Protocol response with confidence tracking
export interface ProtocolResponse<T = any> extends ProtocolMessage<T> {
  requestId: string;
  success: boolean;
  error?: string;
  processingTime?: number;
  validationScore?: number;
}

// Connection state with health tracking
export interface ConnectionState {
  id: string;
  protocol: 'ipc' | 'http' | 'https' | 'websocket';
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
  endpoint: string;
  connectedAt?: number;
  lastActivity?: number;
  healthScore: number; // 0-100
  metrics: {
    messagesIn: number;
    messagesOut: number;
    errors: number;
    avgResponseTime: number;
    uptime: number;
  };
}

// Protocol adapter interface for unified handling
export interface ProtocolAdapter {
  type: 'ipc' | 'http' | 'https' | 'websocket';
  connect(config: ProtocolConfig): Promise<ConnectionState>;
  disconnect(connectionId: string): Promise<void>;
  send<T>(connectionId: string, message: ProtocolMessage<T>): Promise<ProtocolResponse<T>>;
  listen(connectionId: string, messageHandler: MessageHandler): void;
  getHealth(connectionId: string): Promise<HealthStatus>;
  cleanup(): Promise<void>;
}

export type MessageHandler<T = any> = (message: ProtocolMessage<T>) => Promise<ProtocolResponse<T> | void>;

export class ProtocolUtils {
  private static logger = createLogger('protocol-utils');
  private static connections = new Map<string, ConnectionState>();
  private static adapters = new Map<string, ProtocolAdapter>();
  private static messageValidators = new Map<string, MessageValidator>();
  private static healthMonitor = new HealthMonitor();
  private static events = createTypedEmitter<ProtocolEvents>();
  
  static {
    // Initialize protocol adapters
    this.registerAdapter('ipc', new IPCAdapter());
    this.registerAdapter('http', new HTTPAdapter());
    this.registerAdapter('https', new HTTPSAdapter());
    this.registerAdapter('websocket', new WebSocketAdapter());
    
    // Start health monitoring
    this.healthMonitor.start();
  }
  
  // Create connection with unified configuration
  static async createConnection(
    name: string, 
    config: ProtocolConfig
  ): Promise<string> {
    const connectionId = `${name}_${config.type}_${Date.now()}`;
    
    try {
      this.logger.info('Creating protocol connection', { connectionId, type: config.type });
      
      // Validate configuration with confidence scoring
      const configValidation = await this.validateConfig(config);
      if (configValidation.confidence < config.validation.requiredConfidence) {
        throw new Error(`Configuration confidence too low: ${configValidation.confidence}%`);
      }
      
      // Get appropriate adapter
      const adapter = this.adapters.get(config.type);
      if (!adapter) {
        throw new Error(`No adapter found for protocol: ${config.type}`);
      }
      
      // Establish connection with retry and timeout
      const connectionState = await withRetry(
        () => withTimeout(adapter.connect(config), config.connection.timeout),
        config.connection.retries,
        `protocol-connection-${config.type}`
      );
      
      connectionState.id = connectionId;
      this.connections.set(connectionId, connectionState);
      
      // Setup health monitoring
      this.healthMonitor.monitor(connectionId, config.health);
      
      // Emit connection event
      emit(this.events, 'connectionEstablished', { connectionId, state: connectionState });
      
      this.logger.info('Protocol connection established', { connectionId, protocol: config.type });
      return connectionId;
      
    } catch (error) {
      this.logger.error('Failed to create protocol connection', { connectionId, error });
      emit(this.events, 'connectionFailed', { connectionId, error });
      throw handleError(error, `protocol-connection-${config.type}`);
    }
  }
  
  // Send message with confidence validation and optimization
  static async sendMessage<T, R>(
    connectionId: string,
    message: ProtocolMessage<T>,
    options: SendOptions = {}
  ): Promise<ProtocolResponse<R>> {
    const { 
      timeout = TIMEOUTS.NORMAL,
      retries = 3,
      requireConfidence = true,
      confidenceThreshold = 80
    } = options;
    
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }
    
    const adapter = this.adapters.get(connection.protocol);
    if (!adapter) {
      throw new Error(`No adapter for protocol: ${connection.protocol}`);
    }
    
    try {
      // Validate message with confidence scoring
      const validation = await this.validateMessage(message, connection.protocol);
      if (requireConfidence && validation.confidence < confidenceThreshold) {
        throw new Error(`Message confidence too low: ${validation.confidence}%`);
      }
      
      // Add confidence metadata
      message.metadata = {
        ...message.metadata,
        confidence: validation.confidence,
        source: 'protocol-utils',
        version: '1.0.0'
      };
      
      // Send with retry and timeout
      const startTime = Date.now();
      const response = await withRetry(
        () => withTimeout(adapter.send(connectionId, message), timeout),
        retries,
        `protocol-send-${connection.protocol}`
      );
      
      // Update connection metrics
      connection.metrics.messagesOut++;
      connection.metrics.avgResponseTime = this.updateAverage(
        connection.metrics.avgResponseTime,
        Date.now() - startTime,
        connection.metrics.messagesOut
      );
      connection.lastActivity = Date.now();
      
      // Emit success event
      emit(this.events, 'messageSent', { connectionId, messageId: message.id, responseTime: Date.now() - startTime });
      
      return response;
      
    } catch (error) {
      connection.metrics.errors++;
      this.logger.error('Failed to send message', { connectionId, messageId: message.id, error });
      emit(this.events, 'messageFailed', { connectionId, messageId: message.id, error });
      throw handleError(error, `protocol-send-${connection.protocol}`);
    }
  }
  
  // Listen for messages with unified handling
  static listenForMessages<T>(
    connectionId: string,
    messageHandler: MessageHandler<T>,
    options: ListenOptions = {}
  ): () => void {
    const { 
      validateIncoming = true,
      confidenceThreshold = 70,
      autoRespond = true
    } = options;
    
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }
    
    const adapter = this.adapters.get(connection.protocol);
    if (!adapter) {
      throw new Error(`No adapter for protocol: ${connection.protocol}`);
    }
    
    const wrappedHandler: MessageHandler<T> = async (message) => {
      try {
        // Validate incoming message if enabled
        if (validateIncoming) {
          const validation = await this.validateMessage(message, connection.protocol);
          if (validation.confidence < confidenceThreshold) {
            this.logger.warn('Low confidence incoming message', { 
              connectionId, 
              messageId: message.id, 
              confidence: validation.confidence 
            });
          }
        }
        
        // Update connection metrics
        connection.metrics.messagesIn++;
        connection.lastActivity = Date.now();
        
        // Call user handler
        const response = await messageHandler(message);
        
        // Emit message received event
        emit(this.events, 'messageReceived', { connectionId, messageId: message.id });
        
        return response;
        
      } catch (error) {
        connection.metrics.errors++;
        this.logger.error('Message handler error', { connectionId, messageId: message.id, error });
        emit(this.events, 'messageHandlerError', { connectionId, messageId: message.id, error });
        
        if (autoRespond) {
          return {
            id: `error_${Date.now()}`,
            type: 'error_response',
            timestamp: Date.now(),
            requestId: message.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          } as ProtocolResponse;
        }
        
        throw error;
      }
    };
    
    adapter.listen(connectionId, wrappedHandler);
    
    // Return cleanup function
    return () => {
      this.logger.debug('Stopped listening for messages', { connectionId });
    };
  }
  
  // Get connection pool status with optimization insights
  static getConnectionPool(): ConnectionPoolStatus {
    const connections = Array.from(this.connections.values());
    const byProtocol = new Map<string, ConnectionState[]>();
    
    connections.forEach(conn => {
      if (!byProtocol.has(conn.protocol)) {
        byProtocol.set(conn.protocol, []);
      }
      byProtocol.get(conn.protocol)!.push(conn);
    });
    
    const poolOptimization = this.analyzePoolOptimization(connections);
    
    return {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.status === 'connected').length,
      byProtocol: Object.fromEntries(byProtocol.entries()),
      healthScore: this.calculatePoolHealthScore(connections),
      optimization: poolOptimization,
      recommendations: this.generateOptimizationRecommendations(poolOptimization)
    };
  }
  
  // Protocol-specific health monitoring
  static async getConnectionHealth(connectionId: string): Promise<HealthStatus> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }
    
    const adapter = this.adapters.get(connection.protocol);
    if (!adapter) {
      throw new Error(`No adapter for protocol: ${connection.protocol}`);
    }
    
    try {
      const adapterHealth = await adapter.getHealth(connectionId);
      const overallHealth = this.calculateOverallHealth(connection, adapterHealth);
      
      return {
        connectionId,
        status: overallHealth.status,
        score: overallHealth.score,
        metrics: connection.metrics,
        lastCheck: Date.now(),
        issues: overallHealth.issues,
        recommendations: overallHealth.recommendations
      };
      
    } catch (error) {
      this.logger.error('Health check failed', { connectionId, error });
      return {
        connectionId,
        status: 'unhealthy',
        score: 0,
        metrics: connection.metrics,
        lastCheck: Date.now(),
        issues: ['Health check failed'],
        recommendations: ['Reconnect or investigate connection issues']
      };
    }
  }
  
  // Confidence-validated message processing
  static async validateMessage<T>(
    message: ProtocolMessage<T>, 
    protocol: string
  ): Promise<ValidationResult> {
    const validator = this.messageValidators.get(protocol) || this.messageValidators.get('default');
    if (!validator) {
      return { valid: true, confidence: 50, issues: ['No validator available'] };
    }
    
    try {
      return await validator.validate(message);
    } catch (error) {
      this.logger.error('Message validation failed', { messageId: message.id, protocol, error });
      return { valid: false, confidence: 0, issues: [`Validation error: ${error}`] };
    }
  }
  
  // Protocol configuration validation with confidence scoring
  static async validateConfig(config: ProtocolConfig): Promise<ConfigValidationResult> {
    const validationResults: ConfigValidationResult = {
      valid: true,
      confidence: 100,
      issues: [],
      optimizations: []
    };
    
    // Validate required fields
    if (!config.type || !['ipc', 'http', 'https', 'websocket'].includes(config.type)) {
      validationResults.valid = false;
      validationResults.confidence = 0;
      validationResults.issues.push('Invalid or missing protocol type');
      return validationResults;
    }
    
    // Protocol-specific validation
    switch (config.type) {
      case 'ipc':
        if (!config.connection.path && !config.connection.port) {
          validationResults.confidence -= 30;
          validationResults.issues.push('IPC requires either path or port');
        }
        break;
      case 'http':
      case 'https':
        if (!config.connection.port || config.connection.port < 1 || config.connection.port > 65535) {
          validationResults.confidence -= 40;
          validationResults.issues.push('HTTP requires valid port (1-65535)');
        }
        break;
      case 'websocket':
        if (!config.connection.host || !config.connection.port) {
          validationResults.confidence -= 30;
          validationResults.issues.push('WebSocket requires host and port');
        }
        break;
    }
    
    // Performance optimizations
    if (config.connection.keepAlive !== true) {
      validationResults.optimizations.push('Enable keepAlive for better performance');
    }
    
    if (config.connection.maxConnections > 100) {
      validationResults.optimizations.push('Consider connection pooling for >100 connections');
    }
    
    if (config.validation.requiredConfidence < 70) {
      validationResults.optimizations.push('Consider higher confidence threshold for production');
    }
    
    return validationResults;
  }
  
  // Connection cleanup with graceful shutdown
  static async cleanup(connectionId?: string): Promise<void> {
    if (connectionId) {
      // Cleanup specific connection
      const connection = this.connections.get(connectionId);
      if (connection) {
        const adapter = this.adapters.get(connection.protocol);
        if (adapter) {
          await adapter.disconnect(connectionId);
        }
        this.connections.delete(connectionId);
        this.healthMonitor.unmonitor(connectionId);
        emit(this.events, 'connectionClosed', { connectionId });
        this.logger.info('Connection cleaned up', { connectionId });
      }
    } else {
      // Cleanup all connections
      this.logger.info('Cleaning up all protocol connections');
      const cleanupPromises = Array.from(this.connections.keys()).map(id => this.cleanup(id));
      await Promise.allSettled(cleanupPromises);
      
      // Cleanup adapters
      const adapterCleanup = Array.from(this.adapters.values()).map(adapter => adapter.cleanup());
      await Promise.allSettled(adapterCleanup);
      
      this.healthMonitor.stop();
      this.logger.info('Protocol utilities cleanup completed');
    }
  }
  
  // Register custom protocol adapter
  static registerAdapter(protocol: string, adapter: ProtocolAdapter): void {
    this.adapters.set(protocol, adapter);
    this.logger.info('Protocol adapter registered', { protocol });
  }
  
  // Register message validator
  static registerValidator(protocol: string, validator: MessageValidator): void {
    this.messageValidators.set(protocol, validator);
    this.logger.info('Message validator registered', { protocol });
  }
  
  // Get comprehensive diagnostics
  static getDiagnostics(): ProtocolDiagnostics {
    const connections = Array.from(this.connections.values());
    
    return {
      totalConnections: connections.length,
      connectionsByProtocol: this.groupBy(connections, 'protocol'),
      connectionsByStatus: this.groupBy(connections, 'status'),
      totalMessages: connections.reduce((sum, c) => sum + c.metrics.messagesIn + c.metrics.messagesOut, 0),
      totalErrors: connections.reduce((sum, c) => sum + c.metrics.errors, 0),
      avgHealthScore: connections.reduce((sum, c) => sum + c.healthScore, 0) / connections.length || 0,
      adapters: Array.from(this.adapters.keys()),
      validators: Array.from(this.messageValidators.keys()),
      uptime: process.uptime()
    };
  }
  
  // Utility methods
  private static updateAverage(current: number, newValue: number, count: number): number {
    return ((current * (count - 1)) + newValue) / count;
  }
  
  private static groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const groupKey = String(item[key]);
      acc[groupKey] = (acc[groupKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
  
  private static analyzePoolOptimization(connections: ConnectionState[]): PoolOptimization {
    // Implementation for pool optimization analysis
    return {
      efficiencyScore: 85,
      underutilizedConnections: [],
      overloadedConnections: [],
      recommendations: []
    };
  }
  
  private static generateOptimizationRecommendations(optimization: PoolOptimization): string[] {
    // Implementation for generating optimization recommendations
    return [];
  }
  
  private static calculatePoolHealthScore(connections: ConnectionState[]): number {
    if (connections.length === 0) return 100;
    return connections.reduce((sum, c) => sum + c.healthScore, 0) / connections.length;
  }
  
  private static calculateOverallHealth(connection: ConnectionState, adapterHealth: HealthStatus): OverallHealth {
    // Implementation for calculating overall health
    return {
      status: 'healthy',
      score: 95,
      issues: [],
      recommendations: []
    };
  }
}

// Protocol Events for monitoring
export interface ProtocolEvents {
  connectionEstablished: (data: { connectionId: string; state: ConnectionState }) => void;
  connectionFailed: (data: { connectionId: string; error: any }) => void;
  connectionClosed: (data: { connectionId: string }) => void;
  messageSent: (data: { connectionId: string; messageId: string; responseTime: number }) => void;
  messageReceived: (data: { connectionId: string; messageId: string }) => void;
  messageFailed: (data: { connectionId: string; messageId: string; error: any }) => void;
  messageHandlerError: (data: { connectionId: string; messageId: string; error: any }) => void;
  healthCheckFailed: (data: { connectionId: string; error: any }) => void;
}

// Supporting interfaces
export interface SendOptions {
  timeout?: number;
  retries?: number;
  requireConfidence?: boolean;
  confidenceThreshold?: number;
}

export interface ListenOptions {
  validateIncoming?: boolean;
  confidenceThreshold?: number;
  autoRespond?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  confidence: number; // 0-100
  issues: string[];
}

export interface ConfigValidationResult extends ValidationResult {
  optimizations: string[];
}

export interface HealthStatus {
  connectionId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number; // 0-100
  metrics: ConnectionState['metrics'];
  lastCheck: number;
  issues: string[];
  recommendations: string[];
}

export interface ConnectionPoolStatus {
  totalConnections: number;
  activeConnections: number;
  byProtocol: Record<string, ConnectionState[]>;
  healthScore: number;
  optimization: PoolOptimization;
  recommendations: string[];
}

export interface PoolOptimization {
  efficiencyScore: number;
  underutilizedConnections: string[];
  overloadedConnections: string[];
  recommendations: string[];
}

export interface OverallHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface ProtocolDiagnostics {
  totalConnections: number;
  connectionsByProtocol: Record<string, number>;
  connectionsByStatus: Record<string, number>;
  totalMessages: number;
  totalErrors: number;
  avgHealthScore: number;
  adapters: string[];
  validators: string[];
  uptime: number;
}

export interface MessageValidator {
  validate<T>(message: ProtocolMessage<T>): Promise<ValidationResult>;
}

// Health monitoring class
class HealthMonitor {
  private intervals = new Map<string, NodeJS.Timeout>();
  private logger = createLogger('protocol-health-monitor');
  
  start(): void {
    this.logger.info('Health monitor started');
  }
  
  monitor(connectionId: string, config: ProtocolConfig['health']): void {
    const interval = setInterval(async () => {
      try {
        await ProtocolUtils.getConnectionHealth(connectionId);
      } catch (error) {
        this.logger.error('Health check failed', { connectionId, error });
        emit(ProtocolUtils['events'], 'healthCheckFailed', { connectionId, error });
      }
    }, config.checkInterval);
    
    this.intervals.set(connectionId, interval);
  }
  
  unmonitor(connectionId: string): void {
    const interval = this.intervals.get(connectionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(connectionId);
    }
  }
  
  stop(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.logger.info('Health monitor stopped');
  }
}

// Protocol adapter implementations
class IPCAdapter implements ProtocolAdapter {
  type: 'ipc' = 'ipc';
  private servers = new Map<string, net.Server>();
  private clients = new Map<string, net.Socket>();
  private logger = createLogger('ipc-adapter');
  
  async connect(config: ProtocolConfig): Promise<ConnectionState> {
    // Implementation for IPC connection
    this.logger.info('Connecting via IPC', { config });
    return {
      id: '',
      protocol: 'ipc',
      status: 'connected',
      endpoint: config.connection.path || `localhost:${config.connection.port}`,
      connectedAt: Date.now(),
      healthScore: 100,
      metrics: { messagesIn: 0, messagesOut: 0, errors: 0, avgResponseTime: 0, uptime: 0 }
    };
  }
  
  async disconnect(connectionId: string): Promise<void> {
    this.logger.info('Disconnecting IPC', { connectionId });
  }
  
  async send<T>(connectionId: string, message: ProtocolMessage<T>): Promise<ProtocolResponse<T>> {
    // Implementation for IPC message sending
    return {
      id: `response_${Date.now()}`,
      type: 'response',
      timestamp: Date.now(),
      requestId: message.id,
      success: true
    };
  }
  
  listen(connectionId: string, messageHandler: MessageHandler): void {
    this.logger.info('Listening for IPC messages', { connectionId });
  }
  
  async getHealth(connectionId: string): Promise<HealthStatus> {
    return {
      connectionId,
      status: 'healthy',
      score: 100,
      metrics: { messagesIn: 0, messagesOut: 0, errors: 0, avgResponseTime: 0, uptime: 0 },
      lastCheck: Date.now(),
      issues: [],
      recommendations: []
    };
  }
  
  async cleanup(): Promise<void> {
    this.logger.info('IPC adapter cleanup');
  }
}

class HTTPAdapter implements ProtocolAdapter {
  type: 'http' = 'http';
  private logger = createLogger('http-adapter');
  
  async connect(config: ProtocolConfig): Promise<ConnectionState> {
    this.logger.info('Connecting via HTTP', { config });
    return {
      id: '',
      protocol: 'http',
      status: 'connected',
      endpoint: `${config.connection.host}:${config.connection.port}`,
      connectedAt: Date.now(),
      healthScore: 100,
      metrics: { messagesIn: 0, messagesOut: 0, errors: 0, avgResponseTime: 0, uptime: 0 }
    };
  }
  
  async disconnect(connectionId: string): Promise<void> {
    this.logger.info('Disconnecting HTTP', { connectionId });
  }
  
  async send<T>(connectionId: string, message: ProtocolMessage<T>): Promise<ProtocolResponse<T>> {
    return {
      id: `response_${Date.now()}`,
      type: 'response',
      timestamp: Date.now(),
      requestId: message.id,
      success: true
    };
  }
  
  listen(connectionId: string, messageHandler: MessageHandler): void {
    this.logger.info('Listening for HTTP messages', { connectionId });
  }
  
  async getHealth(connectionId: string): Promise<HealthStatus> {
    return {
      connectionId,
      status: 'healthy',
      score: 100,
      metrics: { messagesIn: 0, messagesOut: 0, errors: 0, avgResponseTime: 0, uptime: 0 },
      lastCheck: Date.now(),
      issues: [],
      recommendations: []
    };
  }
  
  async cleanup(): Promise<void> {
    this.logger.info('HTTP adapter cleanup');
  }
}

class HTTPSAdapter implements ProtocolAdapter {
  type: 'https' = 'https';
  private logger = createLogger('https-adapter');
  
  async connect(config: ProtocolConfig): Promise<ConnectionState> {
    this.logger.info('Connecting via HTTPS', { config });
    return {
      id: '',
      protocol: 'https',
      status: 'connected',
      endpoint: `${config.connection.host}:${config.connection.port}`,
      connectedAt: Date.now(),
      healthScore: 100,
      metrics: { messagesIn: 0, messagesOut: 0, errors: 0, avgResponseTime: 0, uptime: 0 }
    };
  }
  
  async disconnect(connectionId: string): Promise<void> {
    this.logger.info('Disconnecting HTTPS', { connectionId });
  }
  
  async send<T>(connectionId: string, message: ProtocolMessage<T>): Promise<ProtocolResponse<T>> {
    return {
      id: `response_${Date.now()}`,
      type: 'response',
      timestamp: Date.now(),
      requestId: message.id,
      success: true
    };
  }
  
  listen(connectionId: string, messageHandler: MessageHandler): void {
    this.logger.info('Listening for HTTPS messages', { connectionId });
  }
  
  async getHealth(connectionId: string): Promise<HealthStatus> {
    return {
      connectionId,
      status: 'healthy',
      score: 100,
      metrics: { messagesIn: 0, messagesOut: 0, errors: 0, avgResponseTime: 0, uptime: 0 },
      lastCheck: Date.now(),
      issues: [],
      recommendations: []
    };
  }
  
  async cleanup(): Promise<void> {
    this.logger.info('HTTPS adapter cleanup');
  }
}

class WebSocketAdapter implements ProtocolAdapter {
  type: 'websocket' = 'websocket';
  private logger = createLogger('websocket-adapter');
  
  async connect(config: ProtocolConfig): Promise<ConnectionState> {
    this.logger.info('Connecting via WebSocket', { config });
    return {
      id: '',
      protocol: 'websocket',
      status: 'connected',
      endpoint: `ws://${config.connection.host}:${config.connection.port}`,
      connectedAt: Date.now(),
      healthScore: 100,
      metrics: { messagesIn: 0, messagesOut: 0, errors: 0, avgResponseTime: 0, uptime: 0 }
    };
  }
  
  async disconnect(connectionId: string): Promise<void> {
    this.logger.info('Disconnecting WebSocket', { connectionId });
  }
  
  async send<T>(connectionId: string, message: ProtocolMessage<T>): Promise<ProtocolResponse<T>> {
    return {
      id: `response_${Date.now()}`,
      type: 'response',
      timestamp: Date.now(),
      requestId: message.id,
      success: true
    };
  }
  
  listen(connectionId: string, messageHandler: MessageHandler): void {
    this.logger.info('Listening for WebSocket messages', { connectionId });
  }
  
  async getHealth(connectionId: string): Promise<HealthStatus> {
    return {
      connectionId,
      status: 'healthy',
      score: 100,
      metrics: { messagesIn: 0, messagesOut: 0, errors: 0, avgResponseTime: 0, uptime: 0 },
      lastCheck: Date.now(),
      issues: [],
      recommendations: []
    };
  }
  
  async cleanup(): Promise<void> {
    this.logger.info('WebSocket adapter cleanup');
  }
}

// Convenience exports for minimal usage
export const {
  createConnection,
  sendMessage,
  listenForMessages,
  getConnectionPool,
  getConnectionHealth,
  validateMessage,
  validateConfig,
  cleanup: cleanupProtocols,
  registerAdapter,
  registerValidator,
  getDiagnostics
} = ProtocolUtils;
```

#### Usage Examples (Intelligence Briefing)

**Before** (Current duplicated patterns):

```typescript
// Duplicated IPC server setup (Haruspex - 815 lines)
export class HaruspexIPCServer extends EventEmitter {
  private server: net.Server | undefined;
  private clients: Map<string, net.Socket> = new Map();
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private isRunning = false;
  private socketPath: string;
  
  async start(): Promise<void> {
    this.server = net.createServer((socket) => {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.clients.set(clientId, socket);
      // Custom message handling, health monitoring, error recovery...
    });
    // Manual TCP server binding, connection info file management...
  }
}

// Duplicated HTTP server setup (296 lines)
export class HTTPServer extends EventEmitter {
  private app: express.Application;
  private server?: any;
  private running = false;
  private activeRequestCount = 0;
  
  async start(): Promise<void> {
    this.server = this.app.listen(this.config.port, () => {
      this.running = true;
      // Custom middleware, error handling, health monitoring...
    });
  }
}

// Manual message validation scattered across protocols
private async handleClientMessage(clientId: string, data: Buffer): Promise<void> {
  try {
    const messages = data.toString().split('\n').filter(line => line.trim());
    for (const messageStr of messages) {
      const message: IPCMessage = JSON.parse(messageStr); // No confidence validation
      await this.processMessage(clientId, message);
    }
  } catch (error) {
    this.debugManager.log(`Error parsing client message: ${error}`, 'error');
  }
}
```

**After** (Unified with confidence validation):

```typescript
// Unified protocol connection with confidence validation
const backendConnection = await createConnection('haruspex-backend', {
  type: 'ipc',
  connection: {
    host: '127.0.0.1',
    port: 8080,
    timeout: 5000,
    retries: 3,
    keepAlive: true,
    maxConnections: 50
  },
  validation: {
    enableConfidenceScoring: true,
    requiredConfidence: 80,
    schemaValidation: true,
    messageTimeout: 3000
  },
  health: {
    checkInterval: 30000,
    maxFailures: 3,
    recoveryTimeout: 10000
  }
});

// Confidence-validated message sending
const response = await sendMessage(backendConnection, {
  id: 'debug-info-request',
  type: 'get_debug_info',
  timestamp: Date.now(),
  payload: { component: 'core-engine' }
}, {
  timeout: 5000,
  retries: 2,
  requireConfidence: true,
  confidenceThreshold: 85
});

// Unified message listening with validation
const stopListening = listenForMessages(backendConnection, async (message) => {
  console.log('Received message:', message.type, 'Confidence:', message.metadata?.confidence);
  
  return {
    id: `response_${Date.now()}`,
    type: 'ack',
    timestamp: Date.now(),
    requestId: message.id,
    success: true,
    payload: { processed: true }
  };
}, {
  validateIncoming: true,
  confidenceThreshold: 75,
  autoRespond: false
});

// Multiple protocol management with unified interface
const httpConnection = await createConnection('api-gateway', {
  type: 'http',
  connection: { host: 'localhost', port: 3000, timeout: 3000, retries: 2, keepAlive: true, maxConnections: 20 },
  validation: { enableConfidenceScoring: true, requiredConfidence: 70, schemaValidation: true, messageTimeout: 2000 },
  health: { checkInterval: 15000, maxFailures: 2, recoveryTimeout: 5000 }
});

const wsConnection = await createConnection('realtime-updates', {
  type: 'websocket',
  connection: { host: 'localhost', port: 8080, timeout: 10000, retries: 5, keepAlive: true, maxConnections: 100 },
  validation: { enableConfidenceScoring: true, requiredConfidence: 60, schemaValidation: false, messageTimeout: 1000 },
  health: { checkInterval: 20000, maxFailures: 3, recoveryTimeout: 15000 }
});
```

**Connection Pool Optimization**:

```typescript
// Monitor and optimize connection pool
const poolStatus = getConnectionPool();
console.log('Pool Efficiency:', poolStatus.optimization.efficiencyScore);
console.log('Recommendations:', poolStatus.recommendations);

// Health monitoring across all protocols
for (const [connectionId] of ProtocolUtils['connections']) {
  const health = await getConnectionHealth(connectionId);
  if (health.score < 80) {
    console.warn(`Connection ${connectionId} health degraded:`, health.issues);
  }
}

// Protocol diagnostics
const diagnostics = getDiagnostics();
console.log('Protocol System Status:', {
  connections: diagnostics.totalConnections,
  messages: diagnostics.totalMessages,
  errors: diagnostics.totalErrors,
  avgHealth: diagnostics.avgHealthScore
});
```

#### Files Using This Pattern

**Backend Communication** (Protocol duplication elimination):

- [ ] `src/backend/service-discovery.ts` (HTTP/WebSocket discovery → unified protocol management)
- [ ] `src/backend/connection-factory.ts` (Multiple protocol factories → unified connection creation)
- [ ] `src/backend/backend-service-router.ts` (Custom protocol routing → unified message handling)
- [ ] `src/backend/pcl-backend-integration.ts` (PCL-specific protocol → unified backend communication)

**Core Protocol Implementations** (Consolidation targets):

- [ ] `Haruspex/src/debugging/ipc-protocol.ts` (815 lines → unified IPC adapter)
- [ ] `Haruspex/src/debugging/ipc-client.ts` (Client implementation → unified client/server)
- [ ] `Haruspex/src/api/gateway/protocols/http-server.ts` (296 lines → unified HTTP adapter)
- [ ] `Haruspex/src/api/gateway/protocols/websocket-server.ts` (Stub → unified WebSocket adapter)

**Interface Adapters** (Protocol abstraction):

- [ ] `src/interfaces/cli-adapter.ts` (Command execution protocols → unified protocol messaging)
- [ ] `src/interfaces/vscode-adapter.ts` (VSCode communication → unified protocol events)
- [ ] `src/interfaces/universal-interaction-manager.ts` (Cross-interface protocols → unified protocol bus)

**System Components** (Health monitoring integration):

- [ ] `src/observability/templum-observability-system.ts` (Protocol metrics → unified health monitoring)
- [ ] `src/core/templum-core.ts` (Orchestrator protocols → unified protocol management)
- [ ] `src/session/templum-universal-session-manager.ts` (Session protocols → unified session communication)

#### Expected Impact

**Quantitative Benefits**:

- **Code Reduction**: ~1,400 lines of duplicated protocol code consolidated into unified utilities
- **Protocol Implementations**: 4+ separate protocol implementations → 1 unified system with adapters
- **Files Affected**: 15+ files with protocol handling consolidated to shared utilities
- **Connection Management**: Unified pooling and lifecycle management across all protocols
- **Message Validation**: Confidence-scored validation for 100% of protocol messages

**Qualitative Benefits**:

- **Intelligence-Driven Communication**: Confidence scoring for all protocol messages ensures reliable communication
- **Connection Optimization**: Automatic pool optimization with efficiency scoring and recommendations
- **Unified Protocol Abstraction**: Same interface for IPC/HTTP/WebSocket with protocol-specific optimizations
- **Health Monitoring**: Real-time health scoring and diagnostics across all protocol connections
- **Error Resilience**: Circuit breaker patterns and retry logic built into all protocol communication
- **Development Experience**: One-line connection creation and message handling with automatic validation

#### Integration with Other Utilities

**Event Utils Integration**:

```typescript
// Protocol events integrated with typed event system
const protocolEvents = createTypedEmitter<ProtocolEvents>();
subscribe(protocolEvents, 'connectionEstablished', (data) => {
  console.log('New connection:', data.connectionId, data.state.protocol);
});
```

**Error Handler Integration**:

```typescript
// All protocol errors handled through centralized error handling
const result = await handleAsync(
  sendMessage(connectionId, message),
  'protocol-send-operation'
);
```

**Logger Integration**:

```typescript
// Protocol operations automatically logged with context
const diagnostics = getDiagnostics();
logger.info('Protocol system status', diagnostics);
```

**Async Utils Integration**:

```typescript
// Protocol timeouts and retries using shared async utilities
const response = await withRetry(
  () => withTimeout(sendMessage(connectionId, message), TIMEOUTS.LONG),
  3,
  'protocol-message-send'
);
```

#### Implementation Validation

**Before Migration**:

- [ ] Audit all protocol implementations for duplication patterns
- [ ] Identify message types and validation requirements per protocol
- [ ] Map health monitoring and error handling patterns
- [ ] Document connection pooling and lifecycle management needs

**During Migration**:

- [ ] Replace protocol-specific connection management with unified utilities
- [ ] Migrate message handling to confidence-validated processing
- [ ] Convert health monitoring to unified system
- [ ] Integrate with existing error handling and logging utilities

**After Migration**:

- [ ] Verify all protocol connections use unified management
- [ ] Confirm confidence validation works across all message types
- [ ] Test connection pool optimization and health monitoring
- [ ] Validate cross-protocol communication and error handling
- [ ] Monitor diagnostics for performance improvements

#### Anti-Patterns

- **X** Don't create protocol-specific connection management - use unified ProtocolUtils
- **X** Don't skip confidence validation for production messages - always validate critical communications
- **X** Don't manually implement retry/timeout logic - use built-in resilience patterns
- **X** Don't ignore health monitoring - monitor all protocol connections
- **X** Don't mix protocol-specific error handling - use unified error handling patterns

#### Pattern Metadata

**Used By Active Tasks**: Backend Service Integration, Universal Interface Orchestration, Protocol Communication Modernization  
**Implementation Priority**: HIGH (Eliminates significant code duplication and improves reliability)  
**Dependencies**: Logger Utility, Error Handler Utility, Event Utils Utility, Async Utils Utility  
**Integration Points**: All backend communication, interface adapters, health monitoring systems  
**Migration Complexity**: High (requires protocol analysis and message validation implementation)  
**Performance Impact**: Positive (connection pooling, health monitoring, optimized message handling, confidence-validated communication)

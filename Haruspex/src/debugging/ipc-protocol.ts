/**---
 * title: [Haruspex IPC Protocol - Agent Communication Bridge]
 * tags: [IPC, Debugging, Agent-Communication, Real-Time]
 * provides: [IPCServer, IPCClient, DebugProtocol, StateSync]
 * requires: [Core Engine, Debug Manager, Node.js IPC]
 * description: [Inter-process communication protocol for real-time agent debugging and state inspection]
 * ---*/

import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';
import { HaruspexCoreEngine } from '../core/haruspex-core-engine';
import { HaruspexDebugManager, DebugInfo, DiagnosticReport } from './haruspex-debug-manager';

// Protocol message types
export type IPCMessageType = 
  | 'ping' | 'pong'
  | 'get_status' | 'status_response'
  | 'get_debug_info' | 'debug_info_response'
  | 'get_health' | 'health_response'
  | 'get_metrics' | 'metrics_response'
  | 'refresh_data' | 'refresh_response'
  | 'execute_command' | 'command_response'
  | 'subscribe_events' | 'unsubscribe_events'
  | 'state_change' | 'health_change' | 'error_event'
  | 'shutdown' | 'shutdown_ack';

export interface IPCMessage<T = any> {
  id: string;
  type: IPCMessageType;
  timestamp: number;
  payload?: T;
}

export interface IPCResponse<T = any> extends IPCMessage<T> {
  requestId: string;
  success: boolean;
  error?: string;
}

// Command execution types
export interface CommandRequest {
  command: string;
  args?: any[];
  options?: Record<string, any>;
}

export interface CommandResponse {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

// Event subscription types
export interface EventSubscription {
  eventType: 'state_change' | 'health_change' | 'file_change' | 'error' | 'all';
  filters?: Record<string, any>;
}

// State change notification
export interface StateChangeEvent {
  component: string;
  property: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

/**
 * IPC Server for Haruspex extension - enables external agent communication
 * 
 * Runs inside VSCode extension process and exposes:
 * - Real-time state inspection
 * - Command execution
 * - Event subscription
 * - Health monitoring
 */
export class HaruspexIPCServer extends EventEmitter {
  private server: net.Server | undefined;
  private clients: Map<string, net.Socket> = new Map();
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private isRunning = false;
  private socketPath: string;
  private port: number = 0; // Will be assigned dynamically
  private host: string = '127.0.0.1';
  private connectionInfoPath: string;
  
  constructor(
    private coreEngine: HaruspexCoreEngine,
    private debugManager: HaruspexDebugManager,
    private workspaceRoot: string
  ) {
    super();
    
    // Create .haruspex directory in workspace for connection info
    const haruspexDir = path.join(workspaceRoot, '.haruspex');
    if (!fs.existsSync(haruspexDir)) {
      fs.mkdirSync(haruspexDir, { recursive: true });
    }
    
    // Store connection information in a file instead of using Unix socket
    this.connectionInfoPath = path.join(haruspexDir, 'haruspex-debug-connection.json');
    this.socketPath = `${this.host}:${this.port}`; // For compatibility with existing code
    
    // Clean up any existing connection file
    if (fs.existsSync(this.connectionInfoPath)) {
      fs.unlinkSync(this.connectionInfoPath);
    }
  }

  /**
   * Start the IPC server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('IPC Server already running');
    }

    this.server = net.createServer((socket) => {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.clients.set(clientId, socket);
      this.subscriptions.set(clientId, []);
      
      this.debugManager.log(`IPC client connected: ${clientId} from ${socket.remoteAddress}:${socket.remotePort}`);
      
      // Handle client messages
      socket.on('data', (data) => {
        this.handleClientMessage(clientId, data);
      });
      
      socket.on('close', () => {
        this.clients.delete(clientId);
        this.subscriptions.delete(clientId);
        this.debugManager.log(`IPC client disconnected: ${clientId}`);
      });
      
      socket.on('error', (error) => {
        this.debugManager.log(`IPC client error: ${error.message}`, 'error');
        this.clients.delete(clientId);
        this.subscriptions.delete(clientId);
      });
      
      // Send welcome message
      this.sendToClient(clientId, {
        id: 'welcome',
        type: 'pong',
        timestamp: Date.now(),
        payload: { 
          serverVersion: '1.0.0',
          capabilities: [
            'status_monitoring',
            'debug_info',
            'command_execution',
            'event_subscription',
            'real_time_state'
          ]
        }
      });
    });

    return new Promise((resolve, reject) => {
      // Listen on localhost with dynamic port allocation
      this.debugManager.log(`Attempting to bind IPC server to ${this.host}:0`);
      
      this.server!.listen(0, this.host, () => {
        const address = this.server!.address();
        if (typeof address === 'object' && address !== null) {
          this.port = address.port;
          this.socketPath = `${this.host}:${this.port}`;
          
          this.debugManager.log(`TCP server bound successfully to port ${this.port}`);
          
          // Write connection info to file for CLI tools to find
          const connectionInfo = {
            host: this.host,
            port: this.port,
            socketPath: this.socketPath,
            timestamp: Date.now(),
            serverVersion: '1.0.0'
          };
          
          try {
            // Ensure the .haruspex directory exists
            const haruspexDir = path.dirname(this.connectionInfoPath);
            if (!fs.existsSync(haruspexDir)) {
              this.debugManager.log(`Creating .haruspex directory: ${haruspexDir}`);
              fs.mkdirSync(haruspexDir, { recursive: true });
            }
            
            this.debugManager.log(`Writing connection info to: ${this.connectionInfoPath}`);
            fs.writeFileSync(this.connectionInfoPath, JSON.stringify(connectionInfo, null, 2));
            
            // Validate the file was written correctly
            if (!fs.existsSync(this.connectionInfoPath)) {
              throw new Error('Connection info file was not created');
            }
            
            const fileContent = fs.readFileSync(this.connectionInfoPath, 'utf-8');
            const parsedInfo = JSON.parse(fileContent);
            if (parsedInfo.port !== this.port || parsedInfo.host !== this.host) {
              throw new Error('Connection info file contains incorrect data');
            }
            
            this.debugManager.log(`Connection info file validated successfully`);
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.debugManager.log(`CRITICAL: Failed to write connection info file: ${errorMessage}`, 'error');
            
            // This is critical - without the connection file, CLI tools can't connect
            this.server!.close();
            reject(new Error(`Connection info file creation failed: ${errorMessage}`));
            return;
          }
          
          this.isRunning = true;
          this.debugManager.log(`Haruspex IPC Server started successfully at ${this.socketPath}`);
          this.debugManager.log(`Connection info available at: ${this.connectionInfoPath}`);
          resolve();
        } else {
          reject(new Error('Failed to get server address'));
        }
      });
      
      this.server!.on('error', (error) => {
        this.debugManager.log(`IPC Server TCP error: ${error.message}`, 'error');
        
        // Add more specific error handling
        if (error.message.includes('EADDRINUSE')) {
          this.debugManager.log('Port already in use, will try different port on retry', 'error');
        } else if (error.message.includes('EACCES')) {
          this.debugManager.log('Permission denied binding to port', 'error');
        } else if (error.message.includes('EADDRNOTAVAIL')) {
          this.debugManager.log('Address not available', 'error');
        }
        
        reject(error);
      });
    });
  }

  /**
   * Stop the IPC server
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      return;
    }

    // Notify all clients of shutdown
    this.broadcastMessage({
      id: 'shutdown_notification',
      type: 'shutdown',
      timestamp: Date.now(),
      payload: { reason: 'server_shutdown' }
    });

    // Close all client connections
    for (const [clientId, socket] of this.clients) {
      socket.end();
    }
    this.clients.clear();
    this.subscriptions.clear();

    return new Promise((resolve) => {
      this.server!.close(() => {
        this.isRunning = false;
        this.debugManager.log('Haruspex IPC Server stopped');
        
        // Clean up connection info file
        if (fs.existsSync(this.connectionInfoPath)) {
          try {
            fs.unlinkSync(this.connectionInfoPath);
          } catch (error) {
            this.debugManager.log(`Warning: Could not remove connection info file: ${error}`, 'warning');
          }
        }
        
        resolve();
      });
    });
  }

  /**
   * Handle incoming client messages
   */
  private async handleClientMessage(clientId: string, data: Buffer): Promise<void> {
    try {
      const messages = data.toString().split('\n').filter(line => line.trim());
      
      for (const messageStr of messages) {
        const message: IPCMessage = JSON.parse(messageStr);
        await this.processMessage(clientId, message);
      }
    } catch (error) {
      this.debugManager.log(`Error parsing client message: ${error}`, 'error');
      this.sendError(clientId, 'parse_error', 'Invalid message format');
    }
  }

  /**
   * Process individual message from client
   */
  private async processMessage(clientId: string, message: IPCMessage): Promise<void> {
    const startTime = Date.now();

    try {
      switch (message.type) {
        case 'ping':
          this.sendResponse(clientId, message, 'pong', { timestamp: Date.now() });
          break;

        case 'get_status':
          const status = await this.getEngineStatus();
          this.sendResponse(clientId, message, 'status_response', status);
          break;

        case 'get_debug_info':
          const debugInfo = await this.debugManager.collectDebugInfo();
          this.sendResponse(clientId, message, 'debug_info_response', debugInfo);
          break;

        case 'get_health':
          const health = this.coreEngine.getHealthStatus();
          this.sendResponse(clientId, message, 'health_response', health);
          break;

        case 'get_metrics':
          const metrics = this.coreEngine.getMetrics();
          this.sendResponse(clientId, message, 'metrics_response', metrics);
          break;

        case 'refresh_data':
          const refreshResult = await this.refreshAllData();
          this.sendResponse(clientId, message, 'refresh_response', refreshResult);
          break;

        case 'execute_command':
          const commandResult = await this.executeCommand(message.payload as CommandRequest);
          this.sendResponse(clientId, message, 'command_response', commandResult);
          break;

        case 'subscribe_events':
          this.addEventSubscription(clientId, message.payload as EventSubscription);
          this.sendResponse(clientId, message, 'pong', { subscribed: true });
          break;

        case 'unsubscribe_events':
          this.removeEventSubscription(clientId, message.payload as EventSubscription);
          this.sendResponse(clientId, message, 'pong', { unsubscribed: true });
          break;

        default:
          this.sendError(clientId, message.id, `Unknown message type: ${message.type}`);
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.sendError(clientId, message.id, errorMessage);
    }

    const duration = Date.now() - startTime;
    this.debugManager.log(`IPC message processed: ${message.type} in ${duration}ms`);
  }

  /**
   * Get comprehensive engine status
   */
  private async getEngineStatus(): Promise<any> {
    const health = this.coreEngine.getHealthStatus();
    const metrics = this.coreEngine.getMetrics();
    const debugInfo = await this.debugManager.collectDebugInfo();
    
    return {
      health,
      metrics,
      debugInfo,
      timestamp: Date.now(),
      pclIntegration: this.coreEngine.isPCLIntegrationAvailable()
    };
  }

  /**
   * Refresh all engine data
   */
  private async refreshAllData(): Promise<any> {
    const startTime = Date.now();
    const results: any = {
      success: true,
      refreshed: [],
      errors: [],
      duration: 0
    };

    try {
      // Refresh core data
      const [truthMatrix, docTree, diagrams] = await Promise.allSettled([
        this.coreEngine.getTruthMatrix(),
        this.coreEngine.getDocumentationTree(),
        this.coreEngine.getMermaidDiagrams()
      ]);

      if (truthMatrix.status === 'fulfilled') {
        results.refreshed.push('truth_matrix');
      } else {
        results.errors.push(`Truth Matrix: ${truthMatrix.reason}`);
      }

      if (docTree.status === 'fulfilled') {
        results.refreshed.push('documentation_tree');
      } else {
        results.errors.push(`Documentation Tree: ${docTree.reason}`);
      }

      if (diagrams.status === 'fulfilled') {
        results.refreshed.push('mermaid_diagrams');
      } else {
        results.errors.push(`Mermaid Diagrams: ${diagrams.reason}`);
      }

      // Broadcast state change to subscribed clients
      this.broadcastStateChange({
        component: 'core_engine',
        property: 'all_data',
        oldValue: null,
        newValue: 'refreshed',
        timestamp: Date.now()
      });

    } catch (error) {
      results.success = false;
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    results.duration = Date.now() - startTime;
    return results;
  }

  /**
   * Execute VSCode command through IPC
   */
  private async executeCommand(request: CommandRequest): Promise<CommandResponse> {
    const startTime = Date.now();
    
    try {
      // Map common commands to engine methods
      let result: any;
      
      switch (request.command) {
        case 'haruspex.refreshAll':
          result = await this.refreshAllData();
          break;
          
        case 'haruspex.getHealth':
          result = this.coreEngine.getHealthStatus();
          break;
          
        case 'haruspex.getMetrics':
          result = this.coreEngine.getMetrics();
          break;
          
        case 'haruspex.analyzeWorkspace':
          if (this.coreEngine.isPCLIntegrationAvailable()) {
            result = await this.coreEngine.analyzeWorkspace(request.args?.[0]);
          } else {
            throw new Error('PCL integration not available');
          }
          break;
          
        case 'haruspex.runTDD':
          if (this.coreEngine.isPCLIntegrationAvailable()) {
            result = await this.coreEngine.runTDD(
              request.args?.[0], 
              request.args?.[1], 
              request.options
            );
          } else {
            throw new Error('PCL integration not available');
          }
          break;
          
        default:
          throw new Error(`Unknown command: ${request.command}`);
      }

      return {
        success: true,
        result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Add event subscription for client
   */
  private addEventSubscription(clientId: string, subscription: EventSubscription): void {
    const clientSubs = this.subscriptions.get(clientId) || [];
    clientSubs.push(subscription);
    this.subscriptions.set(clientId, clientSubs);
    
    this.debugManager.log(`Client ${clientId} subscribed to ${subscription.eventType} events`);
  }

  /**
   * Remove event subscription for client
   */
  private removeEventSubscription(clientId: string, subscription: EventSubscription): void {
    const clientSubs = this.subscriptions.get(clientId) || [];
    const filtered = clientSubs.filter(sub => 
      sub.eventType !== subscription.eventType ||
      JSON.stringify(sub.filters) !== JSON.stringify(subscription.filters)
    );
    this.subscriptions.set(clientId, filtered);
    
    this.debugManager.log(`Client ${clientId} unsubscribed from ${subscription.eventType} events`);
  }

  /**
   * Broadcast state change to subscribed clients
   */
  private broadcastStateChange(event: StateChangeEvent): void {
    for (const [clientId, subscriptions] of this.subscriptions) {
      const relevantSubs = subscriptions.filter(sub => 
        sub.eventType === 'all' || 
        sub.eventType === 'state_change'
      );
      
      if (relevantSubs.length > 0) {
        this.sendToClient(clientId, {
          id: `state_change_${Date.now()}`,
          type: 'state_change',
          timestamp: Date.now(),
          payload: event
        });
      }
    }
  }

  /**
   * Send response to specific client
   */
  private sendResponse(
    clientId: string, 
    originalMessage: IPCMessage, 
    responseType: IPCMessageType, 
    payload: any
  ): void {
    const response: IPCResponse = {
      id: `response_${Date.now()}`,
      type: responseType,
      timestamp: Date.now(),
      requestId: originalMessage.id,
      success: true,
      payload
    };
    
    this.sendToClient(clientId, response);
  }

  /**
   * Send error response to specific client
   */
  private sendError(clientId: string, requestId: string, error: string): void {
    const errorResponse: IPCResponse = {
      id: `error_${Date.now()}`,
      type: 'error_event',
      timestamp: Date.now(),
      requestId,
      success: false,
      error
    };
    
    this.sendToClient(clientId, errorResponse);
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: IPCMessage | IPCResponse): void {
    const client = this.clients.get(clientId);
    if (client && !client.destroyed) {
      try {
        const messageStr = JSON.stringify(message) + '\n';
        client.write(messageStr);
      } catch (error) {
        this.debugManager.log(`Error sending to client ${clientId}: ${error}`, 'error');
        this.clients.delete(clientId);
        this.subscriptions.delete(clientId);
      }
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcastMessage(message: IPCMessage): void {
    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, message);
    }
  }

  /**
   * Get comprehensive IPC server status with enhanced health monitoring
   */
  getStatus(): any {
    const uptime = this.isRunning ? Date.now() - (this.serverStartTime || Date.now()) : 0;
    const memUsage = process.memoryUsage();
    
    return {
      running: this.isRunning,
      socketPath: this.socketPath,
      host: this.host,
      port: this.port,
      connectionInfoPath: this.connectionInfoPath,
      clientCount: this.clients.size,
      subscriptionCount: Array.from(this.subscriptions.values())
        .reduce((sum, subs) => sum + subs.length, 0),
      lastConnection: this.clients.size > 0 ? Date.now() : undefined,
      uptime: uptime,
      performance: {
        memoryUsage: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          rss: Math.round(memUsage.rss / 1024 / 1024) // MB
        },
        messageCount: this.messageCount || 0,
        avgResponseTime: this.calculateAverageResponseTime(),
        errorRate: this.calculateErrorRate()
      },
      health: {
        overall: this.getOverallHealth(),
        checks: {
          serverRunning: this.isRunning,
          connectionFileExists: fs.existsSync(this.connectionInfoPath),
          portAccessible: this.port > 0,
          memoryWithinLimits: memUsage.heapUsed < 500 * 1024 * 1024, // 500MB limit
          clientConnections: this.clients.size >= 0
        }
      }
    };
  }

  /**
   * Get enhanced health status with detailed system metrics
   */
  getEnhancedHealth(): any {
    const memUsage = process.memoryUsage();
    const uptime = this.isRunning ? Date.now() - (this.serverStartTime || Date.now()) : 0;
    
    return {
      timestamp: Date.now(),
      server: {
        running: this.isRunning,
        uptime: uptime,
        port: this.port,
        clientCount: this.clients.size
      },
      system: {
        memory: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss,
          percentUsed: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        performance: {
          messageCount: this.messageCount || 0,
          averageResponseTime: this.calculateAverageResponseTime(),
          errorCount: this.errorCount || 0,
          errorRate: this.calculateErrorRate()
        }
      },
      health: {
        overall: this.getOverallHealth(),
        score: this.calculateHealthScore(),
        issues: this.getHealthIssues()
      }
    };
  }

  /**
   * Export comprehensive debug information
   */
  async exportDebugInfo(): Promise<any> {
    const debugInfo = await this.debugManager.collectDebugInfo();
    const serverStatus = this.getStatus();
    const healthInfo = this.getEnhancedHealth();
    
    return {
      timestamp: Date.now(),
      exportVersion: '1.0.0',
      server: {
        info: serverStatus,
        health: healthInfo,
        configuration: {
          host: this.host,
          port: this.port,
          connectionFile: this.connectionInfoPath,
          workspaceRoot: this.workspaceRoot
        }
      },
      extension: debugInfo,
      diagnostics: await this.debugManager.generateDiagnosticReport(),
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      },
      connections: {
        active: Array.from(this.clients.entries()).map(([id, socket]) => ({
          id,
          remoteAddress: socket.remoteAddress,
          remotePort: socket.remotePort,
          connected: !socket.destroyed
        })),
        subscriptions: Object.fromEntries(this.subscriptions.entries())
      }
    };
  }

  // Private helper methods for enhanced health monitoring

  private serverStartTime: number = Date.now();
  private messageCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];

  private calculateAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  private calculateErrorRate(): number {
    if (this.messageCount === 0) return 0;
    return Math.round((this.errorCount / this.messageCount) * 100);
  }

  private getOverallHealth(): 'healthy' | 'degraded' | 'critical' {
    const score = this.calculateHealthScore();
    if (score >= 90) return 'healthy';
    if (score >= 70) return 'degraded';
    return 'critical';
  }

  private calculateHealthScore(): number {
    let score = 100;
    const memUsage = process.memoryUsage();
    
    // Server running check (40 points)
    if (!this.isRunning) score -= 40;
    
    // Memory usage check (20 points)
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (memPercent > 90) score -= 20;
    else if (memPercent > 75) score -= 10;
    
    // Error rate check (20 points)
    const errorRate = this.calculateErrorRate();
    if (errorRate > 10) score -= 20;
    else if (errorRate > 5) score -= 10;
    
    // Connection file check (10 points)
    if (!fs.existsSync(this.connectionInfoPath)) score -= 10;
    
    // Port accessibility check (10 points)
    if (this.port <= 0) score -= 10;
    
    return Math.max(0, score);
  }

  private getHealthIssues(): string[] {
    const issues: string[] = [];
    const memUsage = process.memoryUsage();
    
    if (!this.isRunning) {
      issues.push('IPC server is not running');
    }
    
    if (!fs.existsSync(this.connectionInfoPath)) {
      issues.push('Connection info file is missing');
    }
    
    if (this.port <= 0) {
      issues.push('Server port is not accessible');
    }
    
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (memPercent > 90) {
      issues.push(`Memory usage is critically high (${Math.round(memPercent)}%)`);
    } else if (memPercent > 75) {
      issues.push(`Memory usage is elevated (${Math.round(memPercent)}%)`);
    }
    
    const errorRate = this.calculateErrorRate();
    if (errorRate > 10) {
      issues.push(`Error rate is high (${errorRate}%)`);
    }
    
    return issues;
  }
}
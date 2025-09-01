/**
 * @fileoverview Generic Connection Factory - TASK-GENERIC-001 Implementation
 * @author Claude Code Implementation  
 * @created 2025-08-29
 * 
 * Replaces hardcoded backend connections with generic factory that creates
 * connections based on skin definition backend configuration.
 */

import { ChildProcess } from 'child_process';
import * as WebSocket from 'ws';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { 
  createTemplumError
} from '../types/templum-types';
import { BackendConfig } from '../types/universal-skin-engine-types';

// Connection interface from backend-service-router.ts
export interface BackendConnection {
  id: string;
  // Note: gRPC support deferred to future implementation
  protocol: 'ipc' | 'http' | 'websocket';
  endpoint: string;
  connection?: ChildProcess | WebSocket.WebSocket | any;
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * Generic Connection Factory
 * Creates protocol-specific connections based on BackendConfig
 * Implements Factory Method pattern for extensible connection creation
 */
export class ConnectionFactory {
  
  /**
   * Main factory method - creates connection based on backend configuration
   * Replaces hardcoded connection logic in BackendServiceRouter
   */
  static async create(
    serviceId: string, 
    backendConfig: BackendConfig
  ): Promise<BackendConnection> {
    
    // Validate configuration
    ConnectionFactory.validateConfig(backendConfig);
    
    // Create protocol-specific connection
    switch (backendConfig.protocol) {
      case 'ipc':
        return ConnectionFactory.createIPCConnection(serviceId, backendConfig);
      case 'http':
        return ConnectionFactory.createHTTPConnection(serviceId, backendConfig);
      case 'websocket':
        return ConnectionFactory.createWebSocketConnection(serviceId, backendConfig);
      default:
        throw createTemplumError(
          `Unsupported protocol: ${backendConfig.protocol} (Note: gRPC support deferred to future implementation)`, 
          'PROTOCOL_ERROR', 
          'integration'
        );
    }
  }

  /**
   * Validate backend configuration before creating connection
   */
  private static validateConfig(config: BackendConfig): void {
    if (!config.protocol) {
      throw createTemplumError('Protocol is required in BackendConfig', 'VALIDATION_ERROR', 'integration');
    }
    
    if (!config.endpoint) {
      throw createTemplumError('Endpoint is required in BackendConfig', 'VALIDATION_ERROR', 'integration');
    }
    
    // Set defaults
    config.timeout = config.timeout || 10000;
    config.retries = config.retries || 3;
    config.keepAlive = config.keepAlive !== undefined ? config.keepAlive : true;
  }

  /**
   * Create IPC connection (for Haruspex service)
   * Uses enhanced BackendConfig instead of hardcoded settings
   */
  private static createIPCConnection(
    serviceId: string, 
    config: BackendConfig
  ): BackendConnection {
    // ENHANCED: Pass configurable IPC settings from BackendConfig
    const ipcConfig = {
      workspaceMarkers: config.options?.workspaceMarkers as string[],
      connectionDir: config.options?.connectionDir as string,
      connectionFile: config.options?.connectionFile as string
    };
    const ipcClient = new HaruspexIPCClient(config.options?.workspacePath as string, ipcConfig);
    let connected = false;

    return {
      id: serviceId,
      protocol: 'ipc',
      endpoint: config.endpoint,
      connection: ipcClient,
      isConnected: () => {
        const status = ipcClient.getConnectionStatus();
        return status.connected && connected;
      },
      connect: async () => {
        try {
          console.log(`[IPC] Establishing connection to ${serviceId} via ${config.endpoint}`);
          
          await ipcClient.connect();
          connected = true;
          
          console.log(`[IPC] Successfully connected to ${serviceId}`);
          
          // Verify connection if authentication required
          if (config.authentication?.required) {
            await ConnectionFactory.authenticateConnection(ipcClient, config.authentication);
          }
          
        } catch (error) {
          connected = false;
          throw createTemplumError(
            `Failed to establish IPC connection to ${serviceId}: ${error}`, 
            'IPC_CONNECTION_FAILED', 
            'integration'
          );
        }
      },
      disconnect: async () => {
        try {
          console.log(`[IPC] Disconnecting from ${serviceId}`);
          await ipcClient.disconnect();
          connected = false;
        } catch (error) {
          console.warn(`[IPC] Warning during disconnection from ${serviceId}: ${error}`);
          connected = false;
        }
      }
    };
  }

  /**
   * Create HTTP connection (for PCL service)
   * Uses enhanced BackendConfig instead of hardcoded settings
   */
  private static createHTTPConnection(
    serviceId: string, 
    config: BackendConfig
  ): BackendConnection {
    let httpConnected = false;
    
    return {
      id: serviceId,
      protocol: 'http',
      endpoint: config.endpoint,
      isConnected: () => httpConnected,
      connect: async () => {
        try {
          console.log(`[HTTP] Testing connection to ${serviceId} at ${config.endpoint}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);

          try {
            // Use configured health endpoint or fallback to defaults
            const healthEndpoints = [
              config.healthEndpoint,
              `${config.endpoint}/api/health`,
              `${config.endpoint}/api/status`,
              `${config.endpoint}/health`,
              `${config.endpoint}/ping`
            ].filter(Boolean) as string[];

            let connected = false;
            for (const healthEndpoint of healthEndpoints) {
              try {
                const headers: Record<string, string> = { 'Accept': 'application/json' };
                
                // Add authentication headers if configured
                if (config.authentication?.credentials) {
                  ConnectionFactory.addAuthHeaders(headers, config.authentication);
                }

                const response = await fetch(healthEndpoint, {
                  signal: controller.signal,
                  method: 'GET',
                  headers
                });

                if (response.ok) {
                  console.log(`[HTTP] ${serviceId} service available at ${healthEndpoint}`);
                  connected = true;
                  break;
                }
              } catch (endpointError) {
                console.log(`[HTTP] Health check failed for ${healthEndpoint}: ${endpointError}`);
              }
            }

            clearTimeout(timeoutId);
            
            if (connected) {
              httpConnected = true;
              console.log(`[HTTP] Successfully connected to ${serviceId}`);
            } else {
              throw new Error(`All health endpoints failed for ${serviceId} service`);
            }
            
          } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
          }
        } catch (error) {
          httpConnected = false;
          throw createTemplumError(
            `Failed to establish HTTP connection to ${serviceId}: ${error}`, 
            'HTTP_CONNECTION_FAILED', 
            'integration'
          );
        }
      },
      disconnect: async () => {
        console.log(`[HTTP] Disconnecting from ${serviceId}`);
        httpConnected = false;
      }
    };
  }

  /**
   * Create WebSocket connection (for Litany service)
   * Uses enhanced BackendConfig instead of hardcoded settings
   */
  private static createWebSocketConnection(
    serviceId: string, 
    config: BackendConfig
  ): BackendConnection {
    let ws: WebSocket.WebSocket | null = null;
    let wsConnected = false;

    return {
      id: serviceId,
      protocol: 'websocket',
      endpoint: config.endpoint,
      connection: ws,
      isConnected: () => wsConnected && ws !== null && ws.readyState === ws.OPEN,
      connect: async () => {
        try {
          console.log(`[WebSocket] Establishing connection to ${serviceId} at ${config.endpoint}`);
          
          const wsUrl = config.endpoint.replace('ws://', 'ws://').replace('http://', 'ws://');
          ws = new WebSocket.WebSocket(wsUrl);

          return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              wsConnected = false;
              reject(new Error(`WebSocket connection timeout for ${serviceId}`));
            }, config.timeout || 15000);

            ws!.onopen = async () => {
              clearTimeout(timeout);
              console.log(`[WebSocket] Connection established to ${serviceId}`);
              
              try {
                // Perform service handshake with authentication if required
                await ConnectionFactory.performWebSocketHandshake(ws!, serviceId, config);
                wsConnected = true;
                console.log(`[WebSocket] Successfully connected to ${serviceId}`);
                resolve();
              } catch (handshakeError) {
                wsConnected = false;
                console.error(`[WebSocket] Handshake failed with ${serviceId}:`, handshakeError);
                reject(handshakeError);
              }
            };

            ws!.onerror = (error) => {
              clearTimeout(timeout);
              wsConnected = false;
              console.error(`[WebSocket] Connection error for ${serviceId}:`, error);
              reject(error);
            };

            ws!.onclose = () => {
              wsConnected = false;
              console.log(`[WebSocket] ${serviceId} connection closed`);
            };

            ws!.onmessage = (event) => {
              console.log(`[WebSocket] Message from ${serviceId}:`, event.data);
            };
          });
        } catch (error) {
          wsConnected = false;
          throw createTemplumError(
            `Failed to establish WebSocket connection to ${serviceId}: ${error}`, 
            'WEBSOCKET_CONNECTION_FAILED', 
            'integration'
          );
        }
      },
      disconnect: async () => {
        if (ws && ws.readyState === ws.OPEN) {
          console.log(`[WebSocket] Disconnecting from ${serviceId}`);
          ws.close();
          wsConnected = false;
          ws = null;
        }
      }
    };
  }

  // Note: gRPC support deferred to future implementation
  // createGRPCConnection method removed to prevent confusion

  /**
   * Perform WebSocket handshake with service-specific protocol
   */
  private static async performWebSocketHandshake(
    ws: WebSocket.WebSocket, 
    serviceId: string, 
    config: BackendConfig
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.log(`[WebSocket] Performing handshake with ${serviceId}`);
      
      const handshakeTimeout = setTimeout(() => {
        reject(new Error(`WebSocket handshake timeout for ${serviceId}`));
      }, 5000);

      const handshakeMessage = {
        type: 'handshake',
        service: 'templum-backend-router',
        version: config.version,
        client: 'templum-universal-interface',
        timestamp: Date.now(),
        protocol: 'websocket',
        authentication: config.authentication?.credentials
      };

      const handshakeHandler = (data: WebSocket.RawData) => {
        try {
          const response = JSON.parse(data.toString());
          
          if (response.type === 'handshake_ack' && response.success) {
            clearTimeout(handshakeTimeout);
            ws.off('message', handshakeHandler);
            console.log(`[WebSocket] Handshake successful for ${serviceId}`);
            resolve();
          } else if (response.type === 'handshake_error') {
            clearTimeout(handshakeTimeout);
            ws.off('message', handshakeHandler);
            reject(new Error(`WebSocket handshake failed: ${response.error || 'Unknown error'}`));
          }
        } catch {
          // Continue listening for proper handshake response
        }
      };

      ws.on('message', handshakeHandler);
      
      try {
        ws.send(JSON.stringify(handshakeMessage));
        console.log(`[WebSocket] Handshake message sent to ${serviceId}`);
      } catch (sendError) {
        clearTimeout(handshakeTimeout);
        ws.off('message', handshakeHandler);
        reject(new Error(`Failed to send handshake: ${sendError}`));
      }
    });
  }

  /**
   * Add authentication headers based on authentication configuration
   */
  private static addAuthHeaders(
    headers: Record<string, string>, 
    auth: NonNullable<BackendConfig['authentication']>
  ): void {
    if (!auth.credentials) return;

    switch (auth.type) {
      case 'basic':
        if (auth.credentials.username && auth.credentials.password) {
          const credentials = btoa(`${auth.credentials.username}:${auth.credentials.password}`);
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case 'bearer':
        if (auth.credentials.token) {
          headers['Authorization'] = `Bearer ${auth.credentials.token}`;
        }
        break;
      case 'api-key':
        if (auth.credentials.apiKey) {
          headers['X-API-Key'] = auth.credentials.apiKey;
        }
        break;
    }
  }

  /**
   * Authenticate connection for IPC services
   */
  private static async authenticateConnection(
    client: any, 
    auth: NonNullable<BackendConfig['authentication']>
  ): Promise<void> {
    if (auth.type === 'none' || !auth.required) return;
    
    // Implementation depends on the specific IPC authentication protocol
    console.log(`[IPC] Authenticating connection with ${auth.type} authentication`);
    
    if (auth.credentials && client.sendRequest) {
      await client.sendRequest('authenticate', auth.credentials);
    }
  }
}

// Import HaruspexIPCClient from the existing backend-service-router.ts
// This maintains compatibility with existing IPC implementation
class HaruspexIPCClient {
  private socket: net.Socket | undefined;
  private isConnected = false;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>();
  private messageBuffer = '';
  private connectionInfo: any = null;
  private workspacePath: string;
  private connectionInfoPath: string;

  constructor(workspacePath?: string, ipcConfig?: { 
    workspaceMarkers?: string[]; 
    connectionDir?: string; 
    connectionFile?: string;
  }) {
    this.workspacePath = workspacePath || this.findWorkspaceRoot(process.cwd(), ipcConfig?.workspaceMarkers) || process.cwd();
    
    // ENHANCED: Configurable IPC paths via backend config
    const connectionDir = ipcConfig?.connectionDir || '.haruspex';
    const connectionFile = ipcConfig?.connectionFile || 'haruspex-debug-connection.json';
    this.connectionInfoPath = path.join(this.workspacePath, connectionDir, connectionFile);
  }

  private findWorkspaceRoot(startPath: string, workspaceMarkers?: string[]): string | undefined {
    let currentPath = startPath;
    
    // ENHANCED: Generic workspace detection with configurable markers
    const markers = workspaceMarkers || [
      '.haruspex',      // Haruspex project marker
      '.templum',       // Templum project marker
      '.vscode',        // VSCode workspace marker
      '.git',           // Git repository marker
      'package.json',   // Node.js project marker
      'Cargo.toml',     // Rust project marker
      'pyproject.toml', // Python project marker
      '.project'        // Generic project marker
    ];
    
    while (currentPath !== path.dirname(currentPath)) {
      for (const marker of markers) {
        const markerPath = path.join(currentPath, marker);
        if (fs.existsSync(markerPath)) {
          console.log(`[IPC] Found workspace root via marker '${marker}' at: ${currentPath}`);
          return currentPath;
        }
      }
      currentPath = path.dirname(currentPath);
    }
    
    return undefined;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    if (!fs.existsSync(this.connectionInfoPath)) {
      throw new Error(`Haruspex connection info not found at ${this.connectionInfoPath}`);
    }

    try {
      const connectionData = fs.readFileSync(this.connectionInfoPath, 'utf-8');
      this.connectionInfo = JSON.parse(connectionData);
    } catch (error) {
      throw new Error(`Failed to parse Haruspex connection info: ${error}`);
    }

    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();
      
      const timeout = setTimeout(() => {
        this.socket?.destroy();
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket.connect(this.connectionInfo.port, this.connectionInfo.host, () => {
        clearTimeout(timeout);
        this.isConnected = true;
        console.log(`[IPC] Connected to Haruspex at ${this.connectionInfo.host}:${this.connectionInfo.port}`);
        resolve();
      });

      this.socket.on('error', (error) => {
        clearTimeout(timeout);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('close', () => {
        this.isConnected = false;
        console.log('[IPC] Connection to Haruspex closed');
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket && !this.socket.destroyed) {
      this.socket.destroy();
    }
    this.isConnected = false;
    
    for (const request of Array.from(this.pendingRequests.values())) {
      clearTimeout(request.timeout);
      request.reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();
  }

  getConnectionStatus(): { connected: boolean; info: any } {
    return {
      connected: this.isConnected,
      info: this.connectionInfo
    };
  }

  async sendRequest(type: string, payload?: any): Promise<any> {
    if (!this.isConnected || !this.socket) {
      throw new Error('Not connected to Haruspex service');
    }

    const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message = {
      id: requestId,
      type,
      timestamp: Date.now(),
      payload,
      requestId
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout for ${type}`));
      }, 30000);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      const messageStr = JSON.stringify(message) + '\n';
      this.socket!.write(messageStr);
    });
  }
}
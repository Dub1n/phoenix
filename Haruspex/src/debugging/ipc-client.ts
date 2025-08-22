/**---
 * title: [Haruspex IPC Client - Agent Communication Client]
 * tags: [IPC, Client, Agent-Communication, Real-Time]
 * provides: [HaruspexIPCClient, Connection Management, Command Execution]
 * requires: [IPC Protocol, Node.js Net, EventEmitter]
 * description: [IPC client for connecting to Haruspex extension from external agents and CLI tools]
 * ---*/

import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { 
  IPCMessage, 
  IPCResponse, 
  IPCMessageType,
  CommandRequest,
  CommandResponse,
  EventSubscription,
  StateChangeEvent
} from './ipc-protocol';

export interface ConnectionOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

interface ConnectionInfo {
  host: string;
  port: number;
  socketPath: string;
  timestamp: number;
  serverVersion: string;
}

/**
 * Haruspex IPC Client - Connects to Haruspex extension for real-time debugging
 * 
 * Provides:
 * - Connection management with auto-retry
 * - Request/response pattern with timeouts
 * - Event subscription and real-time updates
 * - Command execution interface
 * - State synchronization
 */
export class HaruspexIPCClient extends EventEmitter {
  private socket: net.Socket | undefined;
  private isConnected = false;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>();
  private socketPath: string = '';
  private connectionInfoPath: string = '';
  private connectionInfo: ConnectionInfo | null = null;
  private reconnectTimer: NodeJS.Timeout | undefined;
  private messageBuffer = '';

  constructor(private workspacePath?: string) {
    super();
    this.updateSocketPath();
  }

  /**
   * Set workspace path and update socket path
   */
  setWorkspacePath(workspacePath: string): void {
    this.workspacePath = workspacePath;
    this.updateSocketPath();
  }

  /**
   * Update socket path based on workspace
   */
  private updateSocketPath(): void {
    if (!this.workspacePath) {
      // Try to detect workspace from current directory
      this.workspacePath = this.findWorkspaceRoot(process.cwd());
    }

    if (!this.workspacePath) {
      throw new Error('Workspace path not found. Please specify workspace directory.');
    }

    this.connectionInfoPath = path.join(this.workspacePath, '.haruspex', 'haruspex-debug-connection.json');
    this.socketPath = this.connectionInfoPath; // For compatibility, will be updated after reading connection info
  }

  /**
   * Find workspace root by looking for .haruspex directory
   */
  private findWorkspaceRoot(startPath: string): string | undefined {
    let currentPath = startPath;
    
    while (currentPath !== path.dirname(currentPath)) {
      const haruspexPath = path.join(currentPath, '.haruspex');
      if (fs.existsSync(haruspexPath)) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }
    
    return undefined;
  }

  /**
   * Read connection info from file with enhanced validation
   */
  private readConnectionInfo(): ConnectionInfo | null {
    try {
      if (!fs.existsSync(this.connectionInfoPath)) {
        console.log(`Connection info file not found: ${this.connectionInfoPath}`);
        return null;
      }

      const content = fs.readFileSync(this.connectionInfoPath, 'utf8');
      let info: ConnectionInfo;
      
      try {
        info = JSON.parse(content);
      } catch (parseError) {
        console.log(`Failed to parse connection info: ${parseError}`);
        return null;
      }
      
      // Enhanced validation
      if (!info.host || !info.port || !info.timestamp) {
        console.log(`Invalid connection info structure:`, info);
        return null;
      }

      // Check if port is valid number
      if (typeof info.port !== 'number' || info.port <= 0 || info.port > 65535) {
        console.log(`Invalid port number: ${info.port}`);
        return null;
      }

      // Check if connection info is recent (within 1 hour)
      const age = Date.now() - info.timestamp;
      if (age > 3600000) { // 1 hour
        console.log(`Connection info expired (age: ${Math.round(age/1000/60)} minutes)`);
        return null;
      }

      console.log(`✅ Valid connection info found - Host: ${info.host}, Port: ${info.port}`);
      return info;
    } catch (error) {
      console.log(`Error reading connection info: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  /**
   * Connect to Haruspex extension with enhanced retry logic
   */
  async connect(options: ConnectionOptions = {}): Promise<void> {
    if (this.isConnected) {
      console.log('Already connected to Haruspex extension');
      return;
    }

    const { timeout = 5000, retryAttempts = 3, retryDelay = 1000 } = options;
    console.log(`Attempting to connect with timeout: ${timeout}ms, retries: ${retryAttempts}, delay: ${retryDelay}ms`);

    // Read connection info from file with validation
    this.connectionInfo = this.readConnectionInfo();
    if (!this.connectionInfo) {
      const errorMsg = `Haruspex extension not running. Connection info not found: ${this.connectionInfoPath}
      
Troubleshooting steps:
1. Make sure Haruspex extension is activated in VSCode
2. Check that VSCode workspace is open
3. Verify .haruspex directory exists in workspace
4. Run 'Haruspex: Start Agent Debugging' command in VSCode`;
      throw new Error(errorMsg);
    }

    // Update socket path for display
    this.socketPath = this.connectionInfo.socketPath;

    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const attemptConnection = () => {
        attempts++;
        console.log(`Connection attempt ${attempts}/${retryAttempts} to ${this.connectionInfo!.host}:${this.connectionInfo!.port}`);
        
        this.socket = new net.Socket();
        
        const connectionTimeout = setTimeout(() => {
          console.log(`Connection attempt ${attempts} timed out after ${timeout}ms`);
          this.socket?.destroy();
          if (attempts < retryAttempts) {
            console.log(`Retrying in ${retryDelay}ms...`);
            setTimeout(attemptConnection, retryDelay);
          } else {
            const errorMsg = `Connection failed after ${attempts} attempts. 
            
Possible causes:
1. Haruspex extension IPC server not started
2. Port ${this.connectionInfo!.port} is blocked by firewall
3. Connection info file is stale
4. Extension crashed after creating connection file

Try running these commands:
- npm run debug:ping
- npm run test:ipc-connection`;
            reject(new Error(errorMsg));
          }
        }, timeout);

        // Connect using TCP host and port
        this.socket.connect(this.connectionInfo!.port, this.connectionInfo!.host, () => {
          console.log(`✅ Connected successfully on attempt ${attempts}`);
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          this.setupSocketHandlers();
          this.emit('connected');
          resolve();
        });

        this.socket.on('error', (error) => {
          console.log(`Connection attempt ${attempts} failed:`, error.message);
          clearTimeout(connectionTimeout);
          if (attempts < retryAttempts) {
            // Use exponential backoff for retries
            const delay = retryDelay * Math.pow(1.5, attempts - 1);
            console.log(`Retrying in ${delay}ms with exponential backoff...`);
            setTimeout(attemptConnection, delay);
          } else {
            const errorMsg = `All connection attempts failed. Last error: ${error.message}

Connection details:
- Host: ${this.connectionInfo!.host}
- Port: ${this.connectionInfo!.port}
- Workspace: ${this.workspacePath}
- Connection file: ${this.connectionInfoPath}

Troubleshooting:
1. Restart VSCode and try again
2. Check if another process is using port ${this.connectionInfo!.port}
3. Run 'Haruspex: Show Debug Output' in VSCode for server-side logs`;
            reject(new Error(errorMsg));
          }
        });
      };

      attemptConnection();
    });
  }

  /**
   * Disconnect from Haruspex extension
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.socket) {
      return;
    }

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    // Reject all pending requests
    for (const [id, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();

    return new Promise((resolve) => {
      this.socket!.end(() => {
        this.isConnected = false;
        this.socket = undefined;
        this.emit('disconnected');
        resolve();
      });
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.on('data', (data) => {
      this.handleSocketData(data);
    });

    this.socket.on('close', () => {
      this.isConnected = false;
      this.emit('disconnected');
      
      // Clear pending requests
      for (const [id, request] of this.pendingRequests) {
        clearTimeout(request.timeout);
        request.reject(new Error('Connection lost'));
      }
      this.pendingRequests.clear();
      
      // Attempt reconnection
      this.attemptReconnection();
    });

    this.socket.on('error', (error) => {
      this.emit('error', error);
    });
  }

  /**
   * Handle incoming socket data
   */
  private handleSocketData(data: Buffer): void {
    this.messageBuffer += data.toString();
    
    // Process complete messages (delimited by newlines)
    const messages = this.messageBuffer.split('\n');
    this.messageBuffer = messages.pop() || ''; // Keep incomplete message in buffer
    
    for (const messageStr of messages) {
      if (messageStr.trim()) {
        try {
          const message: IPCMessage | IPCResponse = JSON.parse(messageStr);
          this.handleMessage(message);
        } catch (error) {
          this.emit('error', new Error(`Failed to parse message: ${error}`));
        }
      }
    }
  }

  /**
   * Handle parsed message from server
   */
  private handleMessage(message: IPCMessage | IPCResponse): void {
    // Check if it's a response to a pending request
    if ('requestId' in message && message.requestId) {
      const pending = this.pendingRequests.get(message.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.requestId);
        
        if (message.success) {
          pending.resolve(message.payload);
        } else {
          pending.reject(new Error(message.error || 'Unknown error'));
        }
        return;
      }
    }

    // Handle event messages
    switch (message.type) {
      case 'state_change':
        this.emit('state_change', message.payload as StateChangeEvent);
        break;
      case 'health_change':
        this.emit('health_change', message.payload);
        break;
      case 'error_event':
        this.emit('error_event', message.payload);
        break;
      case 'shutdown':
        this.emit('server_shutdown', message.payload);
        break;
      case 'pong':
        // Handle welcome message or ping response
        if (message.id === 'welcome') {
          this.emit('welcome', message.payload);
        }
        break;
    }
  }

  /**
   * Attempt automatic reconnection
   */
  private attemptReconnection(): void {
    if (this.reconnectTimer) {
      return; // Already attempting reconnection
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined;
      
      try {
        await this.connect({ timeout: 3000, retryAttempts: 1 });
      } catch (error) {
        // Retry again after delay
        this.attemptReconnection();
      }
    }, 2000);
  }

  /**
   * Send message and wait for response
   */
  private async sendRequest<T = any>(
    type: IPCMessageType, 
    payload?: any, 
    timeout: number = 10000
  ): Promise<T> {
    if (!this.isConnected || !this.socket) {
      throw new Error('Not connected to Haruspex extension');
    }

    const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: IPCMessage = {
      id,
      type,
      timestamp: Date.now(),
      payload
    };

    return new Promise((resolve, reject) => {
      const requestTimeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${type}`));
      }, timeout);

      this.pendingRequests.set(id, {
        resolve,
        reject,
        timeout: requestTimeout
      });

      try {
        const messageStr = JSON.stringify(message) + '\n';
        this.socket!.write(messageStr);
      } catch (error) {
        clearTimeout(requestTimeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  // Public API Methods

  /**
   * Ping the server
   */
  async ping(): Promise<any> {
    return this.sendRequest('ping');
  }

  /**
   * Get comprehensive status
   */
  async getStatus(): Promise<any> {
    return this.sendRequest('get_status');
  }

  /**
   * Get debug information
   */
  async getDebugInfo(): Promise<any> {
    return this.sendRequest('get_debug_info');
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<any> {
    return this.sendRequest('get_health');
  }

  /**
   * Get performance metrics
   */
  async getMetrics(): Promise<any> {
    return this.sendRequest('get_metrics');
  }

  /**
   * Refresh all data
   */
  async refreshData(): Promise<any> {
    return this.sendRequest('refresh_data', undefined, 30000); // Longer timeout for refresh
  }

  /**
   * Execute command
   */
  async executeCommand(request: CommandRequest, timeout: number = 30000): Promise<CommandResponse> {
    return this.sendRequest('execute_command', request, timeout);
  }

  /**
   * Subscribe to events
   */
  async subscribeToEvents(eventTypes: string[], filters?: Record<string, any>): Promise<void> {
    const subscription: EventSubscription = {
      eventType: eventTypes.length === 1 ? eventTypes[0] as any : 'all',
      filters: filters || {}
    };
    
    await this.sendRequest('subscribe_events', subscription);
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribeFromEvents(eventTypes: string[], filters?: Record<string, any>): Promise<void> {
    const subscription: EventSubscription = {
      eventType: eventTypes.length === 1 ? eventTypes[0] as any : 'all',
      filters: filters || {}
    };
    
    await this.sendRequest('unsubscribe_events', subscription);
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Validate connection by testing basic communication
   */
  async validateConnection(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const response = await this.ping();
      console.log('✅ Connection validation successful:', response);
      return true;
    } catch (error) {
      console.log('❌ Connection validation failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Test connection with detailed diagnostics
   */
  async testConnection(): Promise<{
    connected: boolean;
    pingSuccess: boolean;
    statusSuccess: boolean;
    healthSuccess: boolean;
    errors: string[];
  }> {
    const result = {
      connected: this.isConnected,
      pingSuccess: false,
      statusSuccess: false,
      healthSuccess: false,
      errors: [] as string[]
    };

    if (!this.isConnected) {
      result.errors.push('Not connected to extension');
      return result;
    }

    // Test ping
    try {
      await this.ping();
      result.pingSuccess = true;
      console.log('✅ Ping test passed');
    } catch (error) {
      result.errors.push(`Ping failed: ${error instanceof Error ? error.message : error}`);
      console.log('❌ Ping test failed');
    }

    // Test status
    try {
      await this.getStatus();
      result.statusSuccess = true;
      console.log('✅ Status test passed');
    } catch (error) {
      result.errors.push(`Status failed: ${error instanceof Error ? error.message : error}`);
      console.log('❌ Status test failed');
    }

    // Test health
    try {
      await this.getHealth();
      result.healthSuccess = true;
      console.log('✅ Health test passed');
    } catch (error) {
      result.errors.push(`Health failed: ${error instanceof Error ? error.message : error}`);
      console.log('❌ Health test failed');
    }

    return result;
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): any {
    return {
      connected: this.isConnected,
      socketPath: this.socketPath,
      host: this.connectionInfo?.host,
      port: this.connectionInfo?.port,
      workspacePath: this.workspacePath,
      connectionInfoPath: this.connectionInfoPath,
      pendingRequests: this.pendingRequests.size
    };
  }
}
# IPC Communication Protocol Specification

> **Created**: 2025-08-21  
> **Purpose**: Define IPC protocol for Haruspex 2.0 ↔ Templum 1.0 communication  
> **Based on**: Templum 1.0 specification and service contracts analysis  
> **Status**: Architecture Foundation (Step 0) Implementation

## Protocol Overview

### Protocol Selection Rationale

Based on Templum 1.0 specification analysis and performance requirements:

- **Primary Protocol**: **Node.js IPC** (Inter-Process Communication)
  - **Performance**: <10ms local communication latency
  - **Reliability**: Built-in process management and error handling
  - **Platform Support**: Cross-platform Node.js compatibility
  - **Security**: Process-level isolation with controlled message passing

- **Secondary Protocol**: **HTTP** (for distributed deployments)
  - **Use Case**: Enterprise deployments with service separation
  - **Performance**: <50ms network communication acceptable
  - **Scalability**: Load balancing and horizontal scaling support
  - **Standards**: RESTful API patterns with JSON payloads

- **Future Protocol**: **WebSocket** (for real-time updates)
  - **Use Case**: Real-time state synchronization across interfaces
  - **Performance**: <20ms bidirectional communication
  - **Features**: Push notifications and streaming updates

## IPC Message Protocol

### Message Structure

```typescript
interface IPCMessage {
  id: string;                        // UUID v4 message identifier
  type: IPCMessageType;             // Message routing type
  timestamp: number;                // Unix timestamp (ms)
  source: ServiceIdentifier;        // Source service information
  target: ServiceIdentifier;        // Target service information
  payload: any;                     // Message-specific data
  correlationId?: string;           // Request/response correlation
  priority?: MessagePriority;       // Processing priority
  timeout?: number;                 // Message timeout (ms)
  retryCount?: number;              // Retry attempt counter
}
```

### Message Types

```typescript
type IPCMessageType = 
  | 'request'                       // Request expecting response
  | 'response'                      // Response to request
  | 'notification'                  // One-way notification
  | 'broadcast'                     // Multi-target broadcast
  | 'heartbeat'                     // Health monitoring
  | 'error'                         // Error notification
  | 'subscribe'                     // Event subscription
  | 'unsubscribe'                   // Event unsubscription
  | 'event';                        // Event notification
```

### Service Identification

```typescript
interface ServiceIdentifier {
  type: 'haruspex' | 'templum' | 'pcl' | 'litany';
  instanceId: string;               // Unique instance identifier
  version: string;                  // Semantic version (e.g., "2.0.0")
  endpoint: string;                 // Communication endpoint
  pid?: number;                     // Process ID (for IPC)
  startTime: number;                // Service start timestamp
}
```

### Message Priority System

```typescript
type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

// Priority handling guidelines:
// - critical: System health, error recovery (process immediately)
// - high: User-initiated commands, UI updates (< 50ms processing)
// - normal: Background analysis, routine operations (< 200ms processing)
// - low: Cleanup, metrics collection (best effort processing)
```

## Communication Patterns

### 1. Request-Response Pattern

**Use Case**: Command execution, data queries, synchronous operations

```typescript
// Request message
{
  id: "req_123456789",
  type: "request",
  timestamp: 1692634800000,
  source: {
    type: "templum",
    instanceId: "templum_main_001",
    version: "1.0.0",
    endpoint: "ipc://templum-main"
  },
  target: {
    type: "haruspex", 
    instanceId: "haruspex_analysis_001",
    version: "2.0.0",
    endpoint: "ipc://haruspex-backend"
  },
  payload: {
    operation: "analyzeCode",
    parameters: {
      workspaceId: "workspace_123",
      analysisType: "code-quality",
      targetPath: "/src/components/",
      options: { depth: "moderate", includeTests: true }
    }
  },
  correlationId: "analysis_session_456",
  priority: "high",
  timeout: 30000
}

// Response message
{
  id: "res_123456789", 
  type: "response",
  timestamp: 1692634802500,
  source: {
    type: "haruspex",
    instanceId: "haruspex_analysis_001", 
    version: "2.0.0",
    endpoint: "ipc://haruspex-backend"
  },
  target: {
    type: "templum",
    instanceId: "templum_main_001",
    version: "1.0.0", 
    endpoint: "ipc://templum-main"
  },
  payload: {
    success: true,
    result: {
      analysisId: "analysis_789",
      status: "completed",
      summary: { totalIssues: 15, codeQualityScore: 85 },
      findings: [/* analysis findings */],
      visualizationData: {/* UI rendering data */}
    }
  },
  correlationId: "analysis_session_456"
}
```

**Performance Requirements**:

- Request processing: <50ms acknowledgment
- Response delivery: <10ms local IPC latency
- Total round-trip: Target-dependent (analysis may take seconds)

### 2. Notification Pattern

**Use Case**: Status updates, progress notifications, one-way information

```typescript
{
  id: "notif_987654321",
  type: "notification", 
  timestamp: 1692634803000,
  source: {
    type: "haruspex",
    instanceId: "haruspex_analysis_001",
    version: "2.0.0",
    endpoint: "ipc://haruspex-backend"
  },
  target: {
    type: "templum",
    instanceId: "templum_main_001", 
    version: "1.0.0",
    endpoint: "ipc://templum-main"
  },
  payload: {
    eventType: "analysisProgress",
    data: {
      analysisId: "analysis_789",
      progress: 45,
      currentPhase: "dependency-analysis",
      estimatedTimeRemaining: 15000
    }
  },
  priority: "normal"
}
```

**Performance Requirements**:

- Delivery latency: <5ms for local notifications
- Processing overhead: Minimal (fire-and-forget)
- Queue depth: Max 1000 pending notifications per service

### 3. Broadcast Pattern

**Use Case**: Cross-interface state synchronization, system-wide updates

```typescript
{
  id: "broadcast_555444333",
  type: "broadcast",
  timestamp: 1692634804000, 
  source: {
    type: "templum",
    instanceId: "templum_main_001",
    version: "1.0.0",
    endpoint: "ipc://templum-main"
  },
  target: {
    type: "*",  // Broadcast to all connected services
    instanceId: "*",
    version: "*",
    endpoint: "*"
  },
  payload: {
    eventType: "stateUpdate",
    data: {
      updateId: "state_update_111",
      globalState: {/* global state changes */},
      treeViewUpdates: {/* interface updates */},
      affectedInterfaces: ["vscode", "cli", "command"]
    }
  },
  priority: "high"
}
```

**Performance Requirements**:

- Broadcast delivery: <25ms to all connected services  
- State synchronization: <150ms complete cross-interface sync
- Failure handling: Continue broadcast even if some services fail

### 4. Health Monitoring Pattern

**Use Case**: Service health checks, connection validation, system monitoring

```typescript
// Heartbeat request
{
  id: "heartbeat_777888999",
  type: "heartbeat", 
  timestamp: 1692634805000,
  source: {
    type: "templum",
    instanceId: "templum_main_001",
    version: "1.0.0",
    endpoint: "ipc://templum-main"
  },
  target: {
    type: "haruspex",
    instanceId: "haruspex_analysis_001",
    version: "2.0.0", 
    endpoint: "ipc://haruspex-backend"
  },
  payload: {
    requestType: "healthCheck",
    includeMetrics: true
  },
  priority: "low",
  timeout: 5000
}

// Heartbeat response
{
  id: "heartbeat_response_777888999",
  type: "response",
  timestamp: 1692634805050,
  source: {
    type: "haruspex",
    instanceId: "haruspex_analysis_001",
    version: "2.0.0",
    endpoint: "ipc://haruspex-backend"
  },
  target: {
    type: "templum", 
    instanceId: "templum_main_001",
    version: "1.0.0",
    endpoint: "ipc://templum-main"
  },
  payload: {
    status: "healthy",
    uptime: 3600000,
    health: {
      cpuUsage: 25.5,
      memoryUsage: 128.7,
      avgResponseTime: 45.2,
      requestsPerSecond: 12.3,
      errorRate: 0.01
    },
    capabilities: {
      supportedAnalysisTypes: ["code-quality", "security-scan"],
      maxConcurrentAnalyses: 5,
      supportedLanguages: ["typescript", "javascript", "python"]
    }
  },
  correlationId: "heartbeat_777888999"
}
```

**Performance Requirements**:

- Heartbeat frequency: Every 30 seconds
- Response timeout: <2ms for local services
- Health evaluation: <1ms processing time

## Transport Layer Implementation

### Node.js IPC Transport

**Primary implementation for local service communication**:

```typescript
export class NodeIPCTransport implements IPCTransport {
  private childProcess?: ChildProcess;
  private messageHandlers: Map<IPCMessageType, IPCMessageHandler[]> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private connectionStats: ConnectionStats = this.initializeStats();
  
  async connect(endpoint: string): Promise<IPCConnection> {
    const startTime = performance.now();
    
    try {
      // Parse IPC endpoint (e.g., "ipc://haruspex-backend")
      const serviceName = endpoint.replace('ipc://', '');
      
      // Spawn child process for IPC communication
      this.childProcess = spawn('node', [this.getServiceExecutablePath(serviceName)], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        env: { ...process.env, NODE_IPC_MODE: 'true' }
      });
      
      // Setup IPC message handling
      this.childProcess.on('message', this.handleIncomingMessage.bind(this));
      this.childProcess.on('error', this.handleConnectionError.bind(this));
      this.childProcess.on('exit', this.handleProcessExit.bind(this));
      
      // Wait for service initialization
      await this.waitForServiceReady(5000);
      
      const connectionTime = performance.now() - startTime;
      this.connectionStats.connectionTime = connectionTime;
      
      return {
        id: `ipc_${serviceName}_${Date.now()}`,
        status: 'connected',
        endpoint,
        connectedAt: Date.now(),
        lastActivity: Date.now()
      };
      
    } catch (error) {
      throw new Error(`IPC connection failed: ${error.message}`);
    }
  }
  
  async send(message: IPCMessage): Promise<void> {
    if (!this.childProcess || !this.isConnected()) {
      throw new Error('IPC transport not connected');
    }
    
    try {
      const startTime = performance.now();
      
      // Serialize and send message
      this.childProcess.send(JSON.stringify(message));
      
      const sendTime = performance.now() - startTime;
      this.connectionStats.messagesSent++;
      this.updateLatencyMetrics(sendTime);
      
    } catch (error) {
      this.connectionStats.errorCount++;
      throw new Error(`IPC send failed: ${error.message}`);
    }
  }
  
  async request(message: IPCMessage): Promise<IPCMessage> {
    return new Promise((resolve, reject) => {
      const timeout = message.timeout || 10000;
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request timeout: ${message.id}`));
      }, timeout);
      
      this.pendingRequests.set(message.id, {
        resolve,
        reject,
        timeoutHandle,
        startTime: performance.now()
      });
      
      this.send(message).catch(error => {
        clearTimeout(timeoutHandle);
        this.pendingRequests.delete(message.id);
        reject(error);
      });
    });
  }
  
  subscribe(messageType: IPCMessageType, handler: IPCMessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }
  
  unsubscribe(messageType: IPCMessageType, handler: IPCMessageHandler): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  private async handleIncomingMessage(rawMessage: string): Promise<void> {
    const receiveTime = performance.now();
    this.connectionStats.messagesReceived++;
    
    try {
      const message: IPCMessage = JSON.parse(rawMessage);
      
      // Handle response messages
      if (message.type === 'response' && message.correlationId) {
        const pendingRequest = this.pendingRequests.get(message.correlationId);
        if (pendingRequest) {
          clearTimeout(pendingRequest.timeoutHandle);
          this.pendingRequests.delete(message.correlationId);
          
          const roundTripTime = receiveTime - pendingRequest.startTime;
          this.updateLatencyMetrics(roundTripTime);
          
          pendingRequest.resolve(message);
          return;
        }
      }
      
      // Handle other message types
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        await Promise.all(handlers.map(handler => handler(message)));
      }
      
    } catch (error) {
      console.error(`IPC message handling error: ${error.message}`);
      this.connectionStats.errorCount++;
    }
  }
  
  async ping(): Promise<number> {
    const pingMessage: IPCMessage = {
      id: `ping_${Date.now()}`,
      type: 'heartbeat',
      timestamp: Date.now(),
      source: this.getLocalServiceIdentifier(),
      target: this.getTargetServiceIdentifier(),
      payload: { requestType: 'ping' },
      timeout: 1000
    };
    
    const startTime = performance.now();
    
    try {
      await this.request(pingMessage);
      return performance.now() - startTime;
    } catch (error) {
      throw new Error(`Ping failed: ${error.message}`);
    }
  }
  
  isConnected(): boolean {
    return this.childProcess !== null && 
           this.childProcess.connected &&
           !this.childProcess.killed;
  }
  
  getConnectionStats(): ConnectionStats {
    return {
      ...this.connectionStats,
      uptime: Date.now() - this.connectionStats.startTime,
      averageLatency: this.connectionStats.totalLatency / Math.max(1, this.connectionStats.totalMessages)
    };
  }
}
```

### Performance Optimization Strategies

#### 1. Message Batching

```typescript
interface MessageBatch {
  id: string;
  messages: IPCMessage[];
  batchSize: number;
  createdAt: number;
  priority: MessagePriority;
}

export class BatchedIPCTransport extends NodeIPCTransport {
  private batchBuffer: Map<string, IPCMessage[]> = new Map();
  private batchTimer?: NodeJS.Timeout;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5; // ms
  
  async send(message: IPCMessage): Promise<void> {
    if (message.priority === 'critical' || message.type === 'heartbeat') {
      // Send critical messages immediately
      return super.send(message);
    }
    
    // Add to batch
    const targetKey = `${message.target.type}_${message.target.instanceId}`;
    if (!this.batchBuffer.has(targetKey)) {
      this.batchBuffer.set(targetKey, []);
    }
    
    const batch = this.batchBuffer.get(targetKey)!;
    batch.push(message);
    
    // Send batch if size threshold reached
    if (batch.length >= this.BATCH_SIZE) {
      await this.sendBatch(targetKey, batch);
      this.batchBuffer.set(targetKey, []);
    } else if (!this.batchTimer) {
      // Set timer for batch timeout
      this.batchTimer = setTimeout(async () => {
        await this.flushAllBatches();
        this.batchTimer = undefined;
      }, this.BATCH_TIMEOUT);
    }
  }
  
  private async sendBatch(targetKey: string, messages: IPCMessage[]): Promise<void> {
    const batchMessage: IPCMessage = {
      id: `batch_${Date.now()}`,
      type: 'notification',
      timestamp: Date.now(),
      source: this.getLocalServiceIdentifier(),
      target: messages[0].target,
      payload: {
        messageType: 'batch',
        messages: messages
      },
      priority: 'normal'
    };
    
    await super.send(batchMessage);
  }
}
```

#### 2. Connection Pooling

```typescript
export class PooledIPCTransport {
  private connectionPool: Map<string, NodeIPCTransport[]> = new Map();
  private roundRobinIndex: Map<string, number> = new Map();
  private readonly POOL_SIZE = 3;
  
  async getConnection(serviceType: string): Promise<NodeIPCTransport> {
    const pool = this.connectionPool.get(serviceType) || [];
    
    if (pool.length === 0) {
      // Create initial pool
      for (let i = 0; i < this.POOL_SIZE; i++) {
        const transport = new NodeIPCTransport();
        await transport.connect(`ipc://${serviceType}-${i}`);
        pool.push(transport);
      }
      this.connectionPool.set(serviceType, pool);
      this.roundRobinIndex.set(serviceType, 0);
    }
    
    // Round-robin connection selection
    const index = this.roundRobinIndex.get(serviceType)!;
    const connection = pool[index];
    this.roundRobinIndex.set(serviceType, (index + 1) % pool.length);
    
    return connection;
  }
}
```

#### 3. Message Compression

```typescript
interface CompressedMessage extends IPCMessage {
  compressed: boolean;
  originalSize?: number;
  compressionRatio?: number;
}

export class CompressedIPCTransport extends NodeIPCTransport {
  private readonly COMPRESSION_THRESHOLD = 1024; // bytes
  
  async send(message: IPCMessage): Promise<void> {
    const serialized = JSON.stringify(message);
    
    if (serialized.length > this.COMPRESSION_THRESHOLD) {
      // Compress large messages
      const compressed = await this.compress(serialized);
      const compressedMessage: CompressedMessage = {
        ...message,
        payload: compressed.data,
        compressed: true,
        originalSize: serialized.length,
        compressionRatio: compressed.ratio
      };
      
      await super.send(compressedMessage);
    } else {
      await super.send(message);
    }
  }
  
  private async compress(data: string): Promise<{ data: string; ratio: number }> {
    // Simple compression implementation
    // In production, use proper compression library (gzip, brotli)
    const originalSize = data.length;
    const compressed = Buffer.from(data).toString('base64');
    
    return {
      data: compressed,
      ratio: compressed.length / originalSize
    };
  }
}
```

## Error Handling and Recovery

### Error Classification

```typescript
interface ServiceError extends Error {
  errorId: string;
  timestamp: number;
  source: ServiceIdentifier;
  type: ErrorType;
  severity: ErrorSeverity;
  details?: Record<string, any>;
  recoveryStrategy?: RecoveryStrategy;
}

type ErrorType = 
  | 'connection_error'              // Transport layer failures
  | 'timeout_error'                 // Request timeout
  | 'serialization_error'           // Message format issues
  | 'authentication_error'          // Security failures
  | 'service_unavailable'           // Target service down
  | 'protocol_error'                // Protocol violation
  | 'resource_error';               // Resource exhaustion

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
```

### Recovery Strategies

```typescript
interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'circuit_breaker' | 'graceful_degradation';
  maxRetries?: number;
  backoffStrategy?: 'linear' | 'exponential' | 'random';
  fallbackAction?: string;
  circuitBreakerThreshold?: number;
  userNotification?: boolean;
}

export class ResilientIPCTransport extends NodeIPCTransport {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryConfigs: Map<ErrorType, RecoveryStrategy> = new Map();
  
  constructor() {
    super();
    this.initializeRecoveryStrategies();
  }
  
  private initializeRecoveryStrategies(): void {
    this.retryConfigs.set('timeout_error', {
      type: 'retry',
      maxRetries: 3,
      backoffStrategy: 'exponential'
    });
    
    this.retryConfigs.set('connection_error', {
      type: 'circuit_breaker',
      circuitBreakerThreshold: 5,
      fallbackAction: 'queue_message'
    });
    
    this.retryConfigs.set('service_unavailable', {
      type: 'graceful_degradation',
      fallbackAction: 'cache_response',
      userNotification: true
    });
  }
  
  async sendWithRecovery(message: IPCMessage): Promise<void> {
    const serviceKey = `${message.target.type}_${message.target.instanceId}`;
    const circuitBreaker = this.getOrCreateCircuitBreaker(serviceKey);
    
    if (circuitBreaker.isOpen()) {
      throw new ServiceError({
        errorId: `cb_${Date.now()}`,
        type: 'service_unavailable',
        severity: 'high',
        message: `Circuit breaker open for ${serviceKey}`,
        recoveryStrategy: this.retryConfigs.get('service_unavailable')
      });
    }
    
    try {
      await this.send(message);
      circuitBreaker.recordSuccess();
      
    } catch (error) {
      circuitBreaker.recordFailure();
      
      const serviceError = this.classifyError(error);
      const strategy = this.retryConfigs.get(serviceError.type);
      
      if (strategy) {
        await this.executeRecoveryStrategy(message, serviceError, strategy);
      } else {
        throw serviceError;
      }
    }
  }
  
  private async executeRecoveryStrategy(
    message: IPCMessage,
    error: ServiceError,
    strategy: RecoveryStrategy
  ): Promise<void> {
    switch (strategy.type) {
      case 'retry':
        await this.retryWithBackoff(message, strategy);
        break;
      case 'fallback':
        await this.executeFallbackAction(message, strategy.fallbackAction);
        break;
      case 'graceful_degradation':
        await this.handleGracefulDegradation(message, error);
        break;
      default:
        throw error;
    }
  }
}
```

### Circuit Breaker Implementation

```typescript
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half_open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private recoveryThreshold: number = 3
  ) {}
  
  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half_open';
        this.failures = 0;
      }
    }
    return this.state === 'open';
  }
  
  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}
```

## Security Considerations

### Message Authentication

```typescript
interface AuthenticatedMessage extends IPCMessage {
  signature: string;
  nonce: string;
  timestamp: number;
}

export class SecureIPCTransport extends NodeIPCTransport {
  private secretKey: string;
  private nonceCache: Set<string> = new Set();
  
  constructor(secretKey: string) {
    super();
    this.secretKey = secretKey;
  }
  
  async send(message: IPCMessage): Promise<void> {
    const authenticatedMessage = await this.signMessage(message);
    await super.send(authenticatedMessage);
  }
  
  private async signMessage(message: IPCMessage): Promise<AuthenticatedMessage> {
    const nonce = this.generateNonce();
    const payload = JSON.stringify({
      ...message,
      nonce,
      timestamp: Date.now()
    });
    
    const signature = await this.computeHMAC(payload, this.secretKey);
    
    return {
      ...message,
      signature,
      nonce,
      timestamp: Date.now()
    };
  }
  
  private async verifyMessage(message: AuthenticatedMessage): Promise<boolean> {
    // Check nonce uniqueness (prevent replay attacks)
    if (this.nonceCache.has(message.nonce)) {
      return false;
    }
    
    // Check timestamp freshness (prevent replay attacks)
    const age = Date.now() - message.timestamp;
    if (age > 300000) { // 5 minutes
      return false;
    }
    
    // Verify signature
    const payload = JSON.stringify({
      ...message,
      signature: undefined
    });
    
    const expectedSignature = await this.computeHMAC(payload, this.secretKey);
    const isValid = message.signature === expectedSignature;
    
    if (isValid) {
      this.nonceCache.add(message.nonce);
      // Clean old nonces periodically
      if (this.nonceCache.size > 10000) {
        this.cleanupNonceCache();
      }
    }
    
    return isValid;
  }
}
```

## Performance Monitoring

### Metrics Collection

```typescript
interface IPCMetrics {
  // Latency metrics
  averageLatency: number;
  p95Latency: number;  
  p99Latency: number;
  maxLatency: number;
  
  // Throughput metrics
  messagesPerSecond: number;
  bytesPerSecond: number;
  requestsPerSecond: number;
  responsesPerSecond: number;
  
  // Error metrics
  errorRate: number;
  timeoutRate: number;
  connectionErrors: number;
  protocolErrors: number;
  
  // Resource metrics
  memoryUsage: number;
  cpuUsage: number;
  connectionCount: number;
  queueDepth: number;
}

export class MonitoredIPCTransport extends NodeIPCTransport {
  private metrics: IPCMetrics = this.initializeMetrics();
  private latencyHistory: number[] = [];
  private metricsInterval?: NodeJS.Timeout;
  
  constructor() {
    super();
    this.startMetricsCollection();
  }
  
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
      this.reportMetrics();
    }, 10000); // 10 second intervals
  }
  
  private updateMetrics(): void {
    // Calculate latency percentiles
    if (this.latencyHistory.length > 0) {
      this.latencyHistory.sort((a, b) => a - b);
      const len = this.latencyHistory.length;
      
      this.metrics.averageLatency = this.latencyHistory.reduce((a, b) => a + b, 0) / len;
      this.metrics.p95Latency = this.latencyHistory[Math.floor(len * 0.95)];
      this.metrics.p99Latency = this.latencyHistory[Math.floor(len * 0.99)];
      this.metrics.maxLatency = this.latencyHistory[len - 1];
    }
    
    // Calculate rates
    const stats = this.getConnectionStats();
    const timeWindow = 10; // seconds
    
    this.metrics.messagesPerSecond = stats.totalMessages / timeWindow;
    this.metrics.errorRate = stats.errorCount / Math.max(1, stats.totalMessages);
    
    // Clear history to prevent memory growth
    this.latencyHistory = [];
  }
}
```

---

## Implementation Roadmap

### Phase 1: Core IPC Infrastructure

1. ✅ Service contract definitions
2. ✅ IPC message protocol specification  
3. 🔄 Basic Node.js IPC transport implementation
4. ⏳ Message routing and handling
5. ⏳ Error handling and recovery

### Phase 2: Performance Optimization  

1. ⏳ Message batching implementation
2. ⏳ Connection pooling
3. ⏳ Message compression
4. ⏳ Performance monitoring

### Phase 3: Advanced Features

1. ⏳ Security and authentication
2. ⏳ Circuit breaker pattern
3. ⏳ Health monitoring
4. ⏳ Graceful degradation

### Phase 4: Production Readiness

1. ⏳ Load testing and optimization
2. ⏳ Documentation and examples
3. ⏳ Integration testing
4. ⏳ Deployment automation

---

**Next Steps**:

1. Implement basic Node.js IPC transport class
2. Create message routing and handling infrastructure  
3. Develop proof-of-concept IPC communication between services
4. Validate performance requirements with benchmarking
5. Integrate with CLI→VSCode adaptation POC for complete validation

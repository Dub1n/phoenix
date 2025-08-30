# Haruspex Implementation Patterns

> **Purpose**: Reusable implementation patterns for Haruspex backend service architecture  
> **Created**: 2025-08-23  
> **Usage**: Referenced by haruspex-active-tasks.md for implementation guidance  
> **Maintenance**: Add patterns from completed fixes, remove obsolete patterns

## Backend Service Foundation Patterns

### backend-service-templum-migration {#backend-service-templum-integration}

**Pattern**: Backend Service Templum Integration - Pure Backend Architecture Migration
**Purpose**: Migrate VSCode-coupled backend services to Templum-compatible pure backend architecture
**Status**: ESTABLISHED | **Last Updated**: 2025-08-30

**Problem**: Backend services designed as VSCode extension components need to operate independently for Templum 2.1 integration

**Solution**: Create standalone entry points with comprehensive configuration management while preserving existing VSCode extension functionality

**Implementation Requirements**:

- Version alignment for Templum compatibility (update service version to 2.1.0)
- Standalone entry point creation with full configuration support
- Package.json updates for binary entry points and backend-specific scripts
- Pure backend validation ensuring zero VSCode runtime dependencies

**Core Architecture**:

```typescript
// Standalone backend entry point pattern
export class BackendServiceLauncher {
  private static createServiceConfig(): HaruspexServiceConfig {
    // Default configuration optimized for Templum HTTP-first architecture
    // Environment variable integration for deployment flexibility
    // Command-line argument parsing for runtime customization
  }
  
  private static setupGracefulShutdown(service: BackendService): void {
    // Handle SIGTERM, SIGINT, SIGUSR2 signals
    // Proper service cleanup and resource disposal
    // Error handling and logging for shutdown processes
  }
  
  public static async main(): Promise<void> {
    // Service instantiation with merged configuration
    // Event handler setup for initialization feedback
    // Templum registration and service discovery
    // Production-ready logging and monitoring
  }
}
```

**Package Integration**:

```json
{
  "bin": {
    "haruspex-backend": "./dist/src/backend-main.js"
  },
  "scripts": {
    "build:backend": "npm run build && chmod +x ./dist/src/backend-main.js",
    "start:backend": "npm run build:backend && node ./dist/src/backend-main.js",
    "dev:backend": "npm run build && node --inspect ./dist/src/backend-main.js"
  }
}
```

**Configuration Management Pattern**:

- **Precedence Order**: CLI args > environment variables > defaults
- **Type Safety**: Full TypeScript integration with HaruspexServiceConfig interface
- **Deployment Flexibility**: Support for containerized and standalone deployments
- **Development Support**: Debug mode and inspection capabilities

**Used By Active Tasks**: [TASK-H-M07] VSCode Extension Decoupling (✅ completed), [TASK-H-M08] Command Execution System Templum Compatibility

**Integration Points**: 
- templum-auto-registration-enhanced (service discovery)
- ipc-to-http-protocol-migration (communication layer)
- universal-skin-definition-generator (interface definition)

**Time Estimate**: ~2-3 hours for similar backend service migrations
**Difficulty**: 🟡 Medium (requires careful configuration interface alignment)
**Prerequisites**: HTTP Gateway operational, Universal Skin Provider functional, Templum Protocol Adapter complete

### backend-service-foundation {#analysis-engine-implementation}

**Pattern**: Analysis Engine Implementation
**Purpose**: Core backend analysis service for code analysis and architectural assessment

**Implementation Requirements**:

- Create service interface with PCL integration capabilities
- Implement code parsing and AST analysis functionality
- Design plugin architecture for extensible analysis modules
- Add telemetry and performance monitoring hooks

**File Structure**:

``` filesystem
src/engine/analysis-engine.ts
├── interfaces/
│   ├── IAnalysisEngine.ts
│   ├── IAnalysisResult.ts
│   └── ICodeAnalysisRequest.ts
├── modules/
│   ├── ast-analyzer.ts
│   ├── dependency-analyzer.ts
│   └── pattern-detector.ts
└── config/
    └── analysis-config.ts
```

**Integration Points**:

- PCL integration for workflow coordination
- Telemetry collector for performance metrics
- Circuit breaker for resilience
- Cache manager for result optimization

### ml-engine-architecture {#prediction-engine-implementation}

**Pattern**: Prediction Engine Implementation  
**Purpose**: ML-based prediction service for architectural recommendations

**Core Components**:

- Prediction model interface and configuration
- Training data management and versioning
- Model inference engine with caching
- Performance monitoring and model accuracy tracking

**Dependencies**:

```typescript
// Integration with Analysis Engine for input data
import { IAnalysisResult } from '../engine/interfaces/IAnalysisResult';
// Cache management for prediction results
import { CacheManager } from '../cache/cache-manager';
// Circuit breaker for external ML services
import { CircuitBreaker } from '../core/circuit-breaker';
```

### rest-api-architecture {#http-server-implementation}

**Pattern**: HTTP Server Protocol Implementation
**Purpose**: Express.js-based HTTP server for Templum 2.1 compatibility
**Status**: ESTABLISHED | **Last Updated**: 2025-08-30

**Implementation Requirements**:

- Express.js framework with TypeScript integration
- Templum-compatible endpoints (/getSkinDefinition, /executeCommand, /health)
- Request/response transformation for API Gateway compatibility
- Comprehensive middleware pipeline (CORS, validation, error handling)
- Proper lifecycle management with event emission

**Core Architecture**:

```typescript
export class HTTPServer extends EventEmitter {
  private app: express.Application;
  private server?: any;
  private running = false;
  
  // Request/response transformation
  private registerRoute(method: string, path: string, handler: (req: HTTPRequest) => Promise<HTTPResponse>): void;
  
  // Middleware support
  use(middleware: express.RequestHandler): void;
  
  // Lifecycle management
  async start(): Promise<void>;
  async stop(): Promise<void>;
  isRunning(): boolean;
}
```

**Integration Points**:

- API Gateway protocol server orchestration
- Templum service discovery and registration
- Request validation and rate limiting
- Response formatting and error handling

**Established Usage Pattern** (3+ successful applications):
- ✅ Haruspex API Gateway HTTP protocol
- ✅ Templum-compatible endpoint implementation
- ✅ Express.js TypeScript integration

### ipc-communication-layer {#ipc-server-implementation} [DEPRECATED]

**Pattern**: IPC Server Implementation  
**Purpose**: Inter-process communication for Templum integration
**Status**: DEPRECATED | **Deprecated**: 2025-08-30 | **Reason**: Replaced by HTTP-first architecture

**Deprecation Notice**: This pattern has been superseded by the HTTP-first architecture implemented in [TASK-H-M04]. Templum 2.1 requires HTTP-first communication, making IPC unnecessary. The existing HTTP server implementation provides all required functionality.

**Migration Path**: Use `rest-api-architecture` pattern with `templum-http-gateway-integration` for all backend communication needs.

**Historical Protocol Design** (for reference):

- Message-based communication protocol
- Request/response pattern with async support  
- Error handling and timeout management
- Security and access control integration

**Historical Message Format**:

```typescript
// DEPRECATED - Use HTTP requests instead
interface IPCMessage {
  id: string;
  type: 'request' | 'response' | 'error';
  service: 'analysis' | 'prediction' | 'diagnostic';
  payload: any;
  timestamp: number;
}
```

## Service Integration Patterns

### dependency-chain-restoration {#backend-service-dependencies}

**Pattern**: Backend Service Dependency Resolution
**Purpose**: Systematic restoration of broken import dependencies

**Resolution Strategy**:

1. **Dependency Mapping**: Map all required imports to implementation status
2. **Implementation Priority**: Create foundation services before dependent services  
3. **Interface Design**: Define stable interfaces before implementation
4. **Mock Integration**: Provide mock implementations for parallel development

**Standard Import Pattern**:

```typescript
// Always import from established interfaces first
import { IAnalysisEngine } from '../engine/interfaces/IAnalysisEngine';
import { IPredictionEngine } from '../engine/interfaces/IPredictionEngine';
import { ICacheManager } from '../cache/interfaces/ICacheManager';

// Then import implementations with fallback handling
import { AnalysisEngine } from '../engine/analysis-engine';
import { PredictionEngine } from '../engine/prediction-engine';
```

### analysis-result-caching {#cache-manager-design}

**Pattern**: Cache Manager Architecture Design
**Purpose**: Optimized caching for analysis and prediction results

**Cache Strategy**:

- **Hot Cache**: Frequently accessed analysis results (in-memory)
- **Warm Cache**: Recent predictions and calculations (Redis/file-based)
- **Cold Storage**: Historical data and archives (database/file system)

**Cache Key Design**:

```typescript
// Analysis results: hash of input + version
const analysisKey = `analysis:${contentHash}:${engineVersion}`;

// Prediction results: model + input signature
const predictionKey = `prediction:${modelId}:${inputSignature}`;
```

### rest-api-architecture {#http-server-implementation}

**Pattern**: HTTP Server Implementation
**Purpose**: RESTful API for external access to Haruspex services

**API Design Principles**:

- Resource-based URLs with versioning (`/api/v1/analysis`, `/api/v1/predictions`)
- Standard HTTP methods and status codes
- JSON request/response format with schema validation
- Authentication and rate limiting integration

**Standard Endpoint Pattern**:

```typescript
// Analysis endpoint
POST /api/v1/analysis
{
  "projectPath": "/path/to/project",
  "analysisType": "architectural|dependency|pattern",
  "options": { "includeMetrics": true }
}

// Prediction endpoint  
POST /api/v1/predictions
{
  "analysisResult": { ... },
  "predictionType": "improvement|risk|architecture",
  "confidence": "high|medium|low"
}
```

## Testing and Verification Patterns

### integration-testing-validation {#pcl-integration-verification}

**Pattern**: PCL Integration Workflow Verification
**Purpose**: Systematic validation of claimed working integrations

**Verification Approach**:

1. **Component Isolation**: Test each adapter independently
2. **Integration Flow**: Test end-to-end workflow with real data
3. **Error Scenarios**: Test failure modes and recovery
4. **Performance Validation**: Measure response times and resource usage

**Standard Test Structure**:

```typescript
describe('PCL Integration', () => {
  it('should handle project discovery workflow', async () => {
    // Test real integration, not mocks
    const result = await haruspexService.integrateWithPCL(realProjectData);
    expect(result.success).toBe(true);
    expect(result.analysisResults).toBeDefined();
  });
});
```

### extension-stability-testing {#vscode-extension-verification}

**Pattern**: VSCode Extension Stability Testing
**Purpose**: Comprehensive validation of legacy extension functionality

**Testing Areas**:

- WebView provider functionality and rendering
- Command registration and execution
- File watching and change detection
- Memory management and resource cleanup

### test-coverage-analysis {#test-coverage-verification}

**Pattern**: Component Test Coverage Verification  
**Purpose**: Validate actual test coverage vs. claims

**Coverage Analysis**:

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Service-to-service communication
- **End-to-End Tests**: Complete workflow validation
- **Mock vs. Real**: Separate mock tests from real integration tests

## Architecture and Type System Patterns

### api-gateway-restoration {#api-gateway-protocols}

**Pattern**: API Gateway Protocol Integration
**Purpose**: Complete protocol module implementation for API gateway
**Status**: ESTABLISHED | **Last Updated**: 2025-08-30

**Protocol Modules Required**:

- Authentication protocol (JWT, API keys)
- Rate limiting and throttling protocol  
- Request/response transformation protocol
- Error handling and logging protocol
- Health checking and monitoring protocol

### request-router-middleware-pattern {#request-routing-middleware}

**Pattern**: Request Router Middleware Implementation
**Purpose**: Policy enforcement middleware with timeout, retry, and rate limiting
**Status**: ESTABLISHED | **Last Updated**: 2025-08-30
**Difficulty**: 🟡 Medium | **Est. Time**: ~3-4 hours

**Problem**: Need request routing with configurable policies (timeout, retry, rate limiting) and extensible middleware pipeline
**Solution**: Complete middleware system with policy enforcement and pipeline architecture

**Implementation**:
```typescript
interface RequestContext {
  method: string;
  payload: any;
  protocol: string;
  startTime: number;
  attemptCount?: number;
  metadata?: Record<string, any>;
}

export class RequestRouter {
  private middleware: MiddlewareFunction[] = [];
  private rateLimitTracking: Map<string, Array<number>> = new Map();
  
  async executeRequest(context: RequestContext, handler: RouteHandler): Promise<any> {
    // Apply rate limiting → retry logic → timeout → middleware pipeline
    return this.executeWithRetry(context, route, async () => {
      return this.executeWithTimeout(context, route, async () => {
        return this.executeMiddlewarePipeline(context, handler);
      });
    });
  }
}
```

**Core Features**:
- **Policy Enforcement**: Route-based timeout, retry, and rate limiting
- **Middleware Pipeline**: Extensible middleware chain with next() pattern
- **Rate Limiting**: Time-window based with automatic cleanup
- **Retry Logic**: Exponential backoff with configurable attempts
- **Statistics**: Runtime monitoring and performance metrics

**Used By Active Tasks**: [TASK-H-NEW-004] (✅ completed)
**Integration Points**: [api-gateway-restoration](#api-gateway-protocols), [templum-http-gateway-integration](#http-gateway-templum)

### comprehensive-type-system {#api-contracts-completion}

**Pattern**: API Contracts Type System Completion
**Purpose**: Complete type definitions for all API interfaces
**Status**: ESTABLISHED | **Last Updated**: 2025-08-30
**Difficulty**: 🟡 Medium | **Est. Time**: ~4-6 hours

**Problem**: Missing type definitions causing 58+ compilation failures and preventing engine integration
**Solution**: Complete type system with flexible interfaces and engine stub implementations

**Type System Organization**:

``` filesystem
src/api/types/
├── api-contracts.ts (main contract definitions)
├── analysis-types-stub.ts (comprehensive stub type definitions)
└── engine implementations/
    ├── analysis-engine.ts (analysis engine stub)
    ├── prediction-engine.ts (prediction engine stub)  
    ├── diagnostic-system.ts (health monitoring stub)
    └── cache-manager.ts (caching system stub)
```

**Flexible Interface Pattern**:

```typescript
// Flexible type definitions accommodating multiple usage patterns
export interface BackendConfig {
  type: string;
  endpoints: string[];
  endpoint?: string;      // Optional for compatibility
  protocol?: string;      // Optional for compatibility
  authentication: boolean;
  timeout?: number;       // Optional for compatibility
}

// Engine stub implementation pattern
export class AnalysisEngine {
  async initialize(): Promise<void> { /* stub implementation */ }
  async analyzeCode(request: AnalysisRequest): Promise<AnalysisResult> { /* stub */ }
  getDiagnostics() { /* return proper interface structure */ }
  on(event: string, callback: Function) { /* event compatibility */ }
}
```

**Key Implementation Features**:
- **Interface Flexibility**: Optional properties for backward compatibility
- **Engine Stub Pattern**: Functional stub implementations for all engines
- **Event Compatibility**: Event emitter interfaces for existing event-driven code
- **Resource Management**: Proper initialization and cleanup lifecycle
- **Type Safety**: Complete TypeScript coverage with proper return types

**Established Usage Pattern** (1 successful application):
- ✅ Haruspex API Contracts Type System (58+ type definitions resolved)
- ✅ Engine Stub Implementations (4 engines with full interfaces)
- ✅ Compilation Error Reduction (76% improvement)

**Used By Active Tasks**: [TASK-H-NEW-005] (✅ completed), [TASK-H-NEW-006] (analysis engine), [TASK-H-NEW-007] (prediction engine)
**Integration Points**: [backend-service-foundation](#analysis-engine-implementation), [ml-engine-architecture](#prediction-engine-implementation)

### websocket-streaming-architecture {#websocket-server-implementation}

**Pattern**: WebSocket Server Implementation
**Purpose**: Real-time streaming for analysis progress and results

**Streaming Events**:

- Analysis progress updates
- Real-time prediction results
- System health and performance metrics
- Error notifications and alerts

### health-monitoring-framework {#diagnostic-system-design}

**Pattern**: Diagnostic System Design
**Purpose**: Health monitoring and diagnostic framework

**Monitoring Components**:

- Service health checks and heartbeat
- Performance metrics collection and reporting
- Error rate monitoring and alerting
- Resource usage tracking and optimization

## Templum Integration Patterns

### templum-http-gateway-integration {#http-gateway-templum-compatibility}

**Pattern**: Templum HTTP Gateway Implementation
**Purpose**: HTTP API gateway with Templum 1.2 endpoint compatibility
**Status**: ESTABLISHED
**Difficulty**: 🟡 Medium | **Est. Time**: ~6-8 hours

**Problem**: Extend existing HTTP infrastructure to support Templum service discovery and command execution
**Solution**: Add Templum-specific endpoints to existing API gateway with command mapping

**Implementation**:
```typescript
// Templum-compatible endpoint structure
app.get('/getSkinDefinition', () => skinProvider.generateSkinDefinition());
app.post('/executeCommand', (req) => handleTemplumCommand(req.body));

// Command mapping approach
const commandMap = {
  'haruspex.analyzeCode': (args) => routeRequest('analyze', args),
  'haruspex.predictEvolution': (args) => routeRequest('predict', args),
  'haruspex.getDiagnostics': (args) => routeRequest('diagnostics', args)
};
```

**Used By Active Tasks**: [TASK-H-M01] (✅ completed), [TASK-H-M04] (✅ completed), [TASK-H-M08] (command mapping)
**Integration Points**: [templum-auto-registration-enhanced](#templum-auto-registration), [universal-skin-definition-generator](#universal-skin-provider), [ipc-to-http-protocol-migration](#protocol-migration)

### ipc-to-http-protocol-migration {#protocol-migration}

**Pattern**: IPC to HTTP Protocol Migration
**Purpose**: Convert multi-protocol systems to HTTP-first architecture for Templum 2.1 compatibility
**Status**: ESTABLISHED | **Last Updated**: 2025-08-30
**Difficulty**: 🟡 Medium | **Est. Time**: ~2-4 hours

**Problem**: Existing multi-protocol systems with non-functional IPC stubs need conversion to HTTP-first communication
**Solution**: Systematic removal of IPC dependencies and consolidation to HTTP-only communication

**Implementation**:
```typescript
// BEFORE: Multi-protocol startup
await Promise.all([
  this.startIPCServer(),
  this.startHTTPServer(),
  this.startWebSocketServer()
]);

// AFTER: HTTP-first startup
await Promise.all([
  this.startHTTPServer(),
  this.startWebSocketServer()
]);
```

**Migration Steps**:
1. **Assessment**: Verify IPC implementation is stub-only
2. **HTTP Validation**: Confirm HTTP server provides all required functionality
3. **Type Cleanup**: Remove IPC types from imports and interfaces
4. **Startup Simplification**: Remove IPC server from startup sequence
5. **Connection Tracking**: Update to HTTP/WebSocket only
6. **Status Monitoring**: Remove IPC references from status reporting
7. **Compilation Validation**: Ensure TypeScript compilation passes

**Key Benefits**:
- **Performance**: Eliminates unnecessary server startup overhead
- **Simplicity**: Reduces system complexity and resource usage
- **Templum Compatibility**: Aligns with Templum 2.1 HTTP-first requirements
- **Maintenance**: Fewer protocols to maintain and debug

**Used By Active Tasks**: [TASK-H-M04] (✅ completed - API Gateway HTTP-first conversion)
**Integration Points**: [templum-http-gateway-integration](#http-gateway-templum-compatibility), [rest-api-architecture](#http-server-implementation)

**Established Usage Pattern** (1 successful application):
- ✅ API Gateway IPC-to-HTTP Migration (Complete protocol consolidation)
- ✅ 84 lines of unused IPC code removed
- ✅ TypeScript compilation maintained without errors
- ✅ HTTP functionality preserved during migration

### templum-auto-registration-enhanced {#templum-service-discovery}

**Pattern**: Templum Auto-Registration Service
**Purpose**: Automatic service discovery with lifecycle management
**Status**: ESTABLISHED  
**Difficulty**: 🟢 Basic | **Est. Time**: ~2-3 hours

**Problem**: Enable Templum to automatically discover and connect to Haruspex backend
**Solution**: Write service definition files to ~/.templum/services/ with heartbeat management

**Implementation**:
```typescript
interface TemplumServiceDefinition {
  id: string;
  endpoint: string;
  capabilities: string[];
  status: 'active' | 'inactive';
  lastHeartbeat: number;
}

// Auto-registration with cleanup
const registration = new TemplumRegistrationService({
  serviceName: 'haruspex-analysis',
  port: config.http.port,
  capabilities: ['code-analysis', 'prediction']
});
await registration.register();
```

**Used By Active Tasks**: [TASK-H-M03] (✅ completed), [TASK-H-M09] (health monitoring integration)
**Established Usage Pattern** (1 successful application):
- ✅ Haruspex Auto-Registration Service (Complete Templum 1.2 integration)
- ✅ Lifecycle Management (Process cleanup and heartbeat validated)
- ✅ Backend Service Integration (HaruspexBackendService integration working)
**Integration Points**: [templum-http-gateway-integration](#http-gateway-templum), [health-monitoring-framework](#diagnostic-system-design)

### universal-skin-definition-generator {#templum-skin-provider}

**Pattern**: Templum Universal Skin Provider 
**Purpose**: Generate Templum 1.2 compatible skin definitions with HTTP backend configuration
**Status**: ESTABLISHED
**Difficulty**: 🟡 Medium | **Est. Time**: ~4-5 hours

**Problem**: Provide complete UI definitions for Templum interface orchestration
**Solution**: Dynamic skin generation with HTTP protocol configuration

**Implementation**:
```typescript
// Backend config for HTTP protocol
const backendConfig = {
  endpoint: `http://localhost:${httpPort}`,
  protocol: 'http',
  templum: {
    version: '1.2',
    endpoints: {
      getSkinDefinition: '/getSkinDefinition',
      executeCommand: '/executeCommand',
      health: '/health'
    }
  }
};

// Command definition structure
const commands = {
  'haruspex.analyzeCode': {
    title: 'Analyze Code',
    handler: 'analyzeCode',
    parameters: [...]
  }
};
```

**Used By Active Tasks**: [TASK-H-M02] (✅ completed), [TASK-H-M08] (command execution)
**Integration Points**: [templum-http-gateway-integration](#http-gateway-templum), [templum-command-mapping-system](#command-mapping)

**Established Usage Pattern** (1 successful application):
- ✅ Haruspex Universal Skin Provider (Complete Templum 1.2 implementation)
- ✅ UI Component Type Resolution (All interface properties properly implemented)
- ✅ Backend Configuration Simplification (HTTP-first approach validated)

## HTTP-First Architecture Patterns

### core-engine-http-first-migration {#core-engine-http-migration}

**Pattern**: Core Engine HTTP-First Migration  
**Purpose**: Transform VSCode-dependent core engines to HTTP-compatible backend service architecture  
**Status**: ESTABLISHED | **Last Updated**: 2025-08-30  
**Difficulty**: 🟡 Medium | **Est. Time**: ~4-6 hours

**Problem**: Core engines designed for VSCode UI integration need to provide analysis services through HTTP endpoints for pure backend operation

**Solution**: Refactor core engine to implement HTTP-compatible service methods while preserving existing analysis capabilities and reliability patterns

**Implementation Requirements**:

- Remove VSCode dependencies (`vscode` imports, ExtensionContext usage)
- Implement HTTP-compatible service methods (analyzeCode, predictCodeEvolution, getSystemDiagnostics, provideSkinDefinition)
- Update configuration system for backend operation (telemetry, file monitoring)
- Preserve reliability components (circuit breakers, error boundaries, telemetry)
- Add comprehensive fallback handling for error scenarios

**Core Architecture Transformation**:

```typescript
// BEFORE: VSCode-dependent methods
getDocumentationTree(): Promise<DocumentationTreeNode[]>
getTruthMatrix(): Promise<TruthMatrix>
setupFileWatching(context: vscode.ExtensionContext): void

// AFTER: HTTP-compatible service methods
analyzeCode(request: AnalysisRequest): Promise<AnalysisResult>
predictCodeEvolution(request: PredictionRequest): Promise<PredictionResult>
getSystemDiagnostics(): Promise<SystemDiagnostics>
provideSkinDefinition(): Promise<UniversalSkinDefinition>
setupFileWatching(rootPath?: string): void
```

**Backend Service Integration Pattern**:

```typescript
// HTTP-compatible Core Engine configuration
const coreEngineConfig: HaruspexCoreEngineConfig = {
  circuitBreaker: { failureThreshold: 5, recoveryTimeout: 30000 },
  errorBoundary: { isolationStrategy: 'component', recoveryStrategy: 'graceful-degradation' },
  telemetry: { privacyCompliant: true, logLevel: 'info' },
  fileMonitoring: { enabled: false }, // Disabled for HTTP backend
  analysis: { timeout: 30000, maxConcurrentRequests: 5, cacheEnabled: true }
};

// Backend service integration
this.coreEngine = new HaruspexCoreEngine(process.cwd(), coreEngineConfig);
await this.apiGateway.start(this.coreEngine); // Direct delegation to Core Engine
```

**Key Migration Features**:

- **Comprehensive Fallback Systems**: Complete analysis/prediction/diagnostics structures with service unavailable indicators
- **Templum Skin Integration**: Full Templum 2.1 compatible skin definitions with command mapping
- **HTTP Method Integration**: Request/response patterns matching API Gateway expectations
- **Reliability Preservation**: All circuit breaker, error boundary, and telemetry patterns maintained
- **Configuration Flexibility**: HTTP-compatible configuration with backend-specific options

**Validation Approach**:

1. **Initialization Testing**: Core engine initialization without VSCode dependencies
2. **HTTP Method Testing**: All four service methods (analyze, predict, diagnostics, skin)
3. **Integration Testing**: Backend service delegation to core engine methods
4. **Error Scenario Testing**: Fallback behavior validation
5. **Type Compatibility**: Interface alignment with API contracts

**Used By Active Tasks**: [TASK-H-M06] (✅ completed)  
**Integration Points**: [backend-service-templum-migration](#backend-service-templum-integration), [comprehensive-type-system](#api-contracts-completion), [templum-http-gateway-integration](#http-gateway-templum-compatibility)

**Established Usage Pattern** (1 successful application):  
- ✅ Haruspex Core Engine HTTP Migration (Complete VSCode dependency removal)
- ✅ HTTP Service Method Implementation (4 core service endpoints operational)  
- ✅ Backend Service Integration (Seamless HaruspexBackendService delegation)
- ✅ Reliability Pattern Preservation (Circuit breaker, error boundary, telemetry maintained)

**Time Estimate**: ~4-6 hours for similar core engine migrations  
**Prerequisites**: Backend service foundation operational, API Gateway HTTP endpoints established, comprehensive type system available

### vscode-pure-backend-separation {#vscode-extension-decoupling}

**Pattern**: VSCode Extension Decoupling via Dependency Injection
**Purpose**: Enable pure backend operation while maintaining VSCode extension compatibility
**Status**: ESTABLISHED | **Last Updated**: 2025-08-30
**Difficulty**: 🔴 Complex | **Est. Time**: ~4-6 hours

**Problem**: Core Engine and backend components have embedded VSCode dependencies that prevent pure backend operation, but the backend service needs to run independently for Templum integration.

**Solution**: Implement dependency injection pattern with abstract interfaces and runtime-specific implementations to enable both VSCode extension and pure backend operation from the same codebase.

**Architectural Approach**:

```typescript
// Abstract interfaces for dependency injection
export interface ITelemetryCollector {
  recordEvent(name: string, data: Record<string, unknown>): void;
  recordPerformanceMetric(operation: string, durationMs: number): void;
  recordError(error: Error | string, context?: Record<string, unknown>): void;
  dispose(): void;
}

export interface ICoreEngineDependencies {
  telemetry: ITelemetryCollector;
  fileMonitor: IFileMonitor;
  context: 'vscode' | 'backend' | 'test';
}

// Core Engine with dependency injection
export class HaruspexCoreEngine {
  constructor(
    workspaceRoot: string,
    config: HaruspexCoreEngineConfig,
    pclAdapters?: HaruspexCoreEnginePCLDeps,
    dependencies?: ICoreEngineDependencies  // Optional injection
  ) {
    if (dependencies) {
      // Use injected dependencies (backend mode)
      this.telemetry = dependencies.telemetry;
      this.monitor = dependencies.fileMonitor;
    } else {
      // Use VSCode implementations (extension mode)
      this.telemetry = new TelemetryCollector(vscodeConfig);
      this.monitor = new HaruspexFileMonitor(workspaceRoot, vscodeConfig);
    }
  }
}
```

**Backend Implementation Strategy**:

```typescript
// Pure backend implementations
export class BackendTelemetryCollector implements ITelemetryCollector {
  // Uses Node.js console/file logging instead of VSCode output channels
  recordEvent(name: string, data: Record<string, unknown>): void {
    console.log(`[${timestamp}] [${name}]`, this.sanitizeData(data));
  }
}

export class BackendFileMonitor implements IFileMonitor {
  // Uses chokidar instead of VSCode file system APIs
  async startMonitoring(): Promise<void> {
    this.watcher = chokidar.watch(watchPaths, watchOptions);
  }
}

// Dependency factory for backend context
export const createBackendDependencies = async (config: IRuntimeConfig): Promise<ICoreEngineDependencies> => {
  return {
    telemetry: new BackendTelemetryAdapter(new BackendTelemetryCollector(config.telemetry)),
    fileMonitor: new BackendFileMonitorAdapter(new BackendFileMonitor(config.workspaceRoot, config.fileMonitor)),
    context: 'backend'
  };
};
```

**Integration with Backend Service**:

```typescript
// Backend service creates and injects dependencies
async initialize(): Promise<void> {
  // Validate backend environment
  await validateBackendEnvironment();
  
  // Create backend dependencies
  const runtimeConfig = createDefaultBackendConfig(process.cwd());
  const backendDependencies = await createBackendDependencies(runtimeConfig);
  
  // Initialize Core Engine with backend dependencies
  this.coreEngine = new HaruspexCoreEngine(
    process.cwd(),
    this.coreEngineConfig,
    undefined, // No PCL adapters for pure backend
    backendDependencies
  );
}
```

**Key Implementation Features**:

- **Backward Compatibility**: VSCode extension continues to work unchanged
- **Clean Separation**: Runtime context determines implementation choice
- **Interface Compliance**: Adapter pattern ensures interface compatibility
- **Environment Validation**: Backend environment validation before startup
- **Pure Dependencies**: Backend implementations use only Node.js APIs

**Dependencies Added**:
- `chokidar: ^3.5.3` - For backend file system monitoring

**Validation Approach**:

1. **Compilation Testing**: TypeScript compilation without VSCode dependencies
2. **Runtime Testing**: Backend service startup and operation validation
3. **Integration Testing**: Core Engine functionality with backend dependencies
4. **Backward Compatibility**: VSCode extension functionality preservation

**Used By Active Tasks**: [TASK-H-M07] (✅ completed)  
**Integration Points**: [backend-service-templum-migration](#backend-service-templum-integration), [core-engine-http-first-migration](#core-engine-http-migration)

**Established Usage Pattern** (1 successful application):
- ✅ Haruspex VSCode Extension Decoupling (Complete dependency injection implementation)
- ✅ Backend Service Pure Operation (Zero VSCode dependencies in backend execution path)
- ✅ Backward Compatibility Maintained (VSCode extension unchanged and functional)
- ✅ Dependency Injection Architecture (Abstract interfaces with multiple implementations)

**Time Estimate**: ~4-6 hours for similar VSCode decoupling implementations
**Prerequisites**: Core Engine operational, Backend Service architecture established, Understanding of dependency injection patterns

## TODO Discovery Pattern

### todo-tagging-system

**Usage**: When discovering new backend issues during implementation
**Standard Format**:

```typescript
// TODO: [TASK-H-NEW-XXX] Brief description  
// Priority: High|Medium|Low
// Complexity: Estimated 1-12
// Location: Backend service context
// Dependencies: List service dependencies
// Phase: Foundation|Services|Integration
```

**Documentation Phase Processing**:

1. Search codebase for TODO tags: `grep -r "TODO: \[TASK-H-" .`
2. Add discovered tasks to haruspex-active-tasks.md
3. Remove TODO tags after documenting
4. Assign appropriate task IDs and priority markers

---

**Pattern Count**: 21 patterns documented (core-engine-http-first-migration established, ipc-communication-layer deprecated)  
**Last Updated**: 2025-08-30  
**Maintenance**: Add new patterns from completed backend implementations, archive obsolete patterns

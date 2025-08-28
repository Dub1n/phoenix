# Haruspex Implementation Patterns

> **Purpose**: Reusable implementation patterns for Haruspex backend service architecture  
> **Created**: 2025-08-23  
> **Usage**: Referenced by haruspex-active-tasks.md for implementation guidance  
> **Maintenance**: Add patterns from completed fixes, remove obsolete patterns

## Backend Service Foundation Patterns

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

### ipc-communication-layer {#ipc-server-implementation}

**Pattern**: IPC Server Implementation
**Purpose**: Inter-process communication for Templum integration

**Protocol Design**:

- Message-based communication protocol
- Request/response pattern with async support
- Error handling and timeout management
- Security and access control integration

**Standard Message Format**:

```typescript
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

**Protocol Modules Required**:

- Authentication protocol (JWT, API keys)
- Rate limiting and throttling protocol  
- Request/response transformation protocol
- Error handling and logging protocol
- Health checking and monitoring protocol

### comprehensive-type-system {#api-contracts-completion}

**Pattern**: API Contracts Type System Completion
**Purpose**: Complete type definitions for all API interfaces

**Type System Organization**:

``` filesystem
src/api/types/
├── api-contracts.ts (main contract definitions)
├── analysis-types.ts (analysis-specific types)
├── prediction-types.ts (prediction-specific types)
├── cache-types.ts (caching-related types)
└── common-types.ts (shared utility types)
```

**Standard Type Pattern**:

```typescript
// Request/Response pairs for all endpoints
export interface AnalysisRequest {
  projectPath: string;
  options: AnalysisOptions;
}

export interface AnalysisResponse {
  success: boolean;
  result?: AnalysisResult;
  error?: ErrorDetails;
}
```

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

**Pattern Count**: 15 patterns documented  
**Last Updated**: 2025-08-23  
**Maintenance**: Add new patterns from completed backend implementations, archive obsolete patterns

---
date-created: 2025-09-01-0000
last-updated: 2025-09-11-0000
name: templumerror-integration
description: Standardized error handling pattern with typed error interfaces, utility functions, and consistent error categorization
status: established
category: resilience
use-when:
  - Components need consistent error handling approaches
  - Debugging requires proper error monitoring and categorization
  - System needs comprehensive error management and recovery
  - Error handling patterns need to be standardized across components
keywords:
  - error-handling
  - typescript
  - error-interfaces
  - error-categorization
  - monitoring
  - debugging
  - type-safety
  - signal-system
prerequisites:
  - typescript-fundamentals
  - error-handling-basics
  - logging-systems
related-patterns:
  - signal-system-integration
  - component-error-boundaries
  - monitoring-integration
---

<!-- TASK-PATTERN-001: Frontmatter standardization completed 2025-09-11-121733 -->

### TemplumError Integration Pattern

**Problem**: Templum components used inconsistent error handling approaches, making debugging difficult and preventing proper error monitoring, categorization, and recovery across the system.

**Solution**: Standardized error handling pattern with typed error interfaces, utility functions, type guards, and consistent error categorization for comprehensive error management.

#### TemplumError Integration Pattern: Architecture

The pattern provides a comprehensive error handling system:

1. **Type System**: Strongly typed error interfaces with categorization
2. **Utility Functions**: Helper functions for error creation and type checking
3. **Specialized Errors**: Domain-specific error types for different component types
4. **Integration Support**: Signal system integration for error monitoring

#### TemplumError Integration Pattern: Implementation Steps

**Step 1**: Core Error Interface Definition

```typescript
export interface TemplumError extends Error {
  code: string;
  category: 'validation' | 'runtime' | 'integration' | 'configuration' | 'network';
  timestamp: number;
  context?: Record<string, any>;
  originalError?: Error;
}
```

**Step 2**: Specialized Error Types

```typescript
export interface ComponentError extends TemplumError {
  componentId: string;
  componentType: string;
  operationType: string;
}

export interface ValidationError extends TemplumError {
  field: string;
  value: any;
  constraint: string;
}

export interface IntegrationError extends TemplumError {
  service: string;
  endpoint?: string;
  statusCode?: number;
  retryable: boolean;
}

export interface NetworkError extends TemplumError {
  service: string;
  timeout: number;
  retryCount: number;
}
```

**Step 3**: Error Utility Functions

```typescript
export function createTemplumError(
  message: string, 
  code: string, 
  category: TemplumError['category'],
  context?: Record<string, any>
): TemplumError {
  const error = new Error(message) as TemplumError;
  error.code = code;
  error.category = category;
  error.timestamp = Date.now();
  error.context = context;
  return error;
}

export function isTemplumError(error: unknown): error is TemplumError {
  return error instanceof Error && 'code' in error && 'category' in error;
}
```

**Step 4**: Component Integration Pattern

```typescript
// In backend components (connection-factory.ts example)
export class ConnectionFactory {
  static async create(serviceId: string, backendConfig: BackendConfig): Promise<BackendConnection> {
    try {
      // Validate configuration
      ConnectionFactory.validateConfig(backendConfig);
      
      // Create connection based on protocol
      switch (backendConfig.protocol) {
        case 'http':
          return await ConnectionFactory.createHTTPConnection(serviceId, backendConfig);
        case 'websocket':
          return await ConnectionFactory.createWebSocketConnection(serviceId, backendConfig);
        case 'ipc':
          return await ConnectionFactory.createIPCConnection(serviceId, backendConfig);
        default:
          throw createTemplumError(
            `Unsupported protocol: ${backendConfig.protocol}`,
            'UNSUPPORTED_PROTOCOL',
            'configuration',
            { protocol: backendConfig.protocol, serviceId }
          );
      }
    } catch (error) {
      // Re-throw TemplumErrors, wrap others
      if (isTemplumError(error)) {
        throw error;
      }
      throw createTemplumError(
        `Failed to create connection for ${serviceId}: ${error}`,
        'CONNECTION_CREATION_FAILED',
        'runtime',
        { serviceId, backendConfig, originalError: error }
      );
    }
  }
}
```

**Step 5**: Error Handling in Async Operations

```typescript
// In service discovery (service-discovery.ts example)
async discoverServices(options: DiscoveryOptions = {}): Promise<DiscoveredService[]> {
  try {
    const allServices: DiscoveredService[] = [];
    const strategies = this.getEnabledStrategies(options);

    for (const strategy of strategies) {
      try {
        const services = await strategy.discover();
        allServices.push(...services);
      } catch (error) {
        // Log strategy failure but continue with others
        console.warn(`Discovery strategy ${strategy.name} failed:`, error);
        
        if (isTemplumError(error)) {
          // Strategy-specific error handling
          this.handleStrategyError(strategy, error);
        }
      }
    }

    if (allServices.length === 0 && strategies.length > 0) {
      throw createTemplumError(
        'No services discovered by any strategy',
        'NO_SERVICES_DISCOVERED',
        'integration',
        { strategiesAttempted: strategies.map(s => s.name) }
      );
    }

    return this.deduplicateServices(allServices);
  } catch (error) {
    if (isTemplumError(error)) {
      throw error;
    }
    throw createTemplumError(
      `Service discovery failed: ${error}`,
      'DISCOVERY_FAILED',
      'runtime',
      { options, originalError: error }
    );
  }
}
```

**Step 6**: Signal System Integration

```typescript
export interface ErrorSignalPayload extends SignalPayload {
  error: TemplumError;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Usage in components
this.emit('error', {
  timestamp: Date.now(),
  source: 'ConnectionFactory',
  error: templumError,
  severity: 'high'
} as ErrorSignalPayload);
```

#### TemplumError Integration Pattern: Success Metrics

- **Error Categorization**: 100% of errors use proper category classification
- **Context Preservation**: All errors include relevant context for debugging
- **Type Safety**: Strong typing prevents error handling mistakes
- **Monitoring Integration**: All errors emit proper signals for monitoring
- **Recovery Support**: Error types indicate whether operations are retryable

#### TemplumError Integration Pattern: Anti-Patterns

- **Generic Errors**: Don't use plain Error objects, always use TemplumError types
- **Missing Context**: Always include relevant context for debugging
- **Error Suppression**: Don't catch and ignore errors without proper handling
- **Type Confusion**: Always use type guards when handling unknown errors

#### TemplumError Integration Pattern: Validation Checklist

- [ ] All error creation uses createTemplumError utility
- [ ] Error type guards are used in catch blocks
- [ ] Specialized error types used where appropriate
- [ ] Context information is preserved in errors
- [ ] Signal system integration for error monitoring
- [ ] Proper error categorization for all error types

#### TemplumError Integration Pattern: Implementation Feedback

**Successfully Applied**: Connection factory error handling, service discovery error management, backend integration error patterns, validation system error handling

**Pattern Metadata**:

- **Files Using This Pattern**: `src/types/templum-types.ts`, `src/backend/connection-factory.ts`, `src/backend/service-discovery.ts`, `src/backend/pcl-backend-integration.ts`
- **Integration Points**: Signal system, monitoring infrastructure, validation systems, all backend components
- **Dependencies**: TypeScript type system, Event emission patterns, Logging systems

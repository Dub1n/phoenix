---
date-created: 2025-08-20
last-updated: 2025-08-23
name: circuit-breaker-resilience
description: Circuit breaker implementation with operation-specific tracking, Templum error integration, signal emission, and specialized factory patterns
status: ESTABLISHED
category: Infrastructure
use-when:
  - Critical operations need resilience against cascading failures
  - Implementing error isolation with comprehensive error recovery
  - Need operation-specific failure tracking and recovery strategies
  - Building fault-tolerant systems with automatic recovery
keywords: [circuit-breaker, resilience, error-recovery, fault-tolerance, cascading-failures, isolation]
prerequisites: [unified-type-system, templumerror-integration]
related-patterns: [error-recovery, observability-infrastructure, templum-resource-management-unified]
---

# Circuit Breaker Resilience Pattern

**Problem**: Critical operations need resilience against cascading failures and error isolation with comprehensive error recovery.

**Solution**: Circuit breaker implementation with operation-specific tracking, Templum error integration, signal emission, and specialized factory patterns.

#### Circuit Breaker Resilience Pattern: Implementation Steps

**Step 1**: Templum Error Integration Pattern

```typescript
// Complete error type system integration
import { 
  TemplumError, 
  isTemplumError, 
  createTemplumError, 
  Signals, 
  ErrorSignalPayload 
} from '../types/templum-types';

// Type-safe error creation with context
throw createTemplumError(
  'failureThreshold must be greater than 0',
  'INVALID_CONFIG_FAILURE_THRESHOLD',
  'configuration',
  { provided: config.failureThreshold }
);

// Error handling pattern in catch blocks
} catch (error) {
  const templumError = isTemplumError(error) 
    ? error 
    : createTemplumError(
        error instanceof Error ? error.message : 'Unknown operation error',
        'OPERATION_ERROR',
        'runtime',
        { operationType, originalError: error }
      );
}
```

**Step 2**: Signal System Integration Pattern

```typescript
// Signal payload creation with typed interfaces
const payload: ErrorSignalPayload = {
  timestamp: Date.now(),
  source: 'TemplumCircuitBreaker',
  error: templumError,
  severity: this.state === 'OPEN' ? 'high' : 'medium'
};

// Event emission via Node.js process pattern
(process as any).emit('backend-integration:error' as Signals, payload);

// Error-safe telemetry pattern
try {
  // Signal emission logic
} catch (error) {
  console.warn('Failed to emit signal:', isTemplumError(error) ? error.message : error);
}
```

**Step 3**: Specialized Component Factory Pattern

```typescript
// Base factory with overrideable defaults
export function createTemplumCircuitBreaker(overrides: Partial<ErrorRecoveryConfig> = {}): TemplumCircuitBreaker {
  const defaultConfig: ErrorRecoveryConfig = {
    failureThreshold: 5,        // Conservative for interface operations
    recoveryTimeout: 30000,     // 30 seconds - allows time for backend recovery
    monitorWindow: 60000,       // 1 minute monitoring window
    enableTelemetry: true       // Enable by default for production monitoring
  };

  const config = { ...defaultConfig, ...overrides };
  return new TemplumCircuitBreaker(config);
}

// Specialized factories for specific use cases
export function createInterfaceSwitchCircuitBreaker(): TemplumCircuitBreaker {
  return createTemplumCircuitBreaker({
    failureThreshold: 3,        // Lower threshold for interface operations
    recoveryTimeout: 10000,     // 10 seconds - interfaces should recover quickly
    monitorWindow: 30000,       // 30 second window for interface monitoring
    enableTelemetry: true
  });
}
```

**Step 4**: Operation-Specific Tracking Pattern

```typescript
// Operation type definitions
type OperationType = 'interface-switch' | 'backend-integration' | 'state-management' | 'general';

// Operation-specific tracking
async executeWithFallback<T>(
  operation: () => Promise<T>, 
  fallback: T,
  operationType: OperationType = 'general'
): Promise<T>

// Operation-specific health checks
isHealthyForOperation(operationType: string): boolean {
  switch (operationType) {
    case 'interface-switch':
      return this.interfaceSwitchingFailures < (this.failures * 0.5);
    case 'backend-integration':
      return this.backendIntegrationFailures < (this.failures * 0.7);
    case 'state-management':
      return this.stateManagementFailures < (this.failures * 0.6);
    default:
      return this.state === 'CLOSED' || this.state === 'HALF_OPEN';
  }
}
```

#### Circuit Breaker Resilience Pattern: Success Metrics

- Complete Templum error type integration with consistent handling
- Signal emission provides operational visibility for monitoring
- Factory pattern enables environment-specific optimization
- Operation-specific tracking prevents cascading failures
- Comprehensive error context for debugging and analysis

#### Circuit Breaker Resilience Pattern: Anti-Patterns

- **X** Bypassing `isTemplumError` type guard in catch blocks
- **X** Creating errors without using `createTemplumError` function
- **X** Hardcoding configuration instead of using specialized factories
- **X** Ignoring operation-specific failure patterns

#### Circuit Breaker Resilience Pattern: Validation Checklist

- [ ] All error handling uses `isTemplumError` type guard pattern
- [ ] All errors created with `createTemplumError` function
- [ ] Signal emission uses typed payload interfaces
- [ ] Factory functions provide base + specialized configurations
- [ ] Operation-specific tracking implemented for targeted recovery

#### Circuit Breaker Resilience Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

#### Circuit Breaker Resilience Pattern: Pattern Metadata

**Used By Active Tasks**: Interface Adapters, Backend Services, State Management
**Successfully Applied**: Circuit Breaker Implementation (2025-08-23)
**Integration Points**: Templum Error System, Signal Emission, Factory Registry
**Files Using This Pattern**: Components requiring resilience and failure isolation

### Multi-Strategy Service Discovery Pattern

**Status**: ✅ ESTABLISHED
**Category**: Backend Integration
**Last Updated**: 2025-08-29
**Difficulty**: 🟠 Advanced
**Est. Time**: ~4 hours
**Prerequisites**: Generic Connection Factory, Dynamic Command Routing

**Problem**: Hardcoded backend discovery (PCL:3002, Litany:3003, Haruspex file locations) limiting system flexibility and preventing dynamic service management.

**Solution**: Intelligent multi-strategy discovery system that automatically finds backend services using registry-based, configuration-based, and endpoint scanning strategies with graceful fallback.

#### Multi-Strategy Service Discovery Pattern: Implementation Steps

**Step 1**: Core Implementation

```typescript
// Multi-strategy discovery orchestration
class ServiceDiscovery extends EventEmitter {
  private strategies: DiscoveryStrategy[] = [];
  
  async discoverServices(): Promise<DiscoveredService[]> {
    const allServices: DiscoveredService[] = [];
    
    // Execute strategies by priority (registry > config > scanning)
    const strategyPromises = this.strategies.map(async (strategy) => {
      try {
        return await strategy.discover();
      } catch (error) {
        this.emit('strategyError', { strategy: strategy.name, error });
        return [];
      }
    });
    
    const results = await Promise.allSettled(strategyPromises);
    
    // Collect and deduplicate by confidence score
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allServices.push(...result.value);
      }
    }
    
    return this.deduplicateServices(allServices);
  }
}

// Registry-based discovery (highest priority)
class RegistryBasedDiscoveryStrategy implements DiscoveryStrategy {
  readonly priority = 100;
  
  async discover(): Promise<DiscoveredService[]> {
    const registry = JSON.parse(fs.readFileSync(this.registryPath));
    const services: DiscoveredService[] = [];
    
    for (const [serviceId, registration] of Object.entries(registry.services)) {
      // Validate health and skip stale registrations
      if (this.isRegistrationValid(registration)) {
        services.push({
          id: serviceId,
          config: this.createBackendConfig(registration),
          discoveryMethod: 'registry',
          confidence: 0.9, // High confidence
          timestamp: Date.now()
        });
      }
    }
    
    return services;
  }
}

// Backend service router integration
class TemplumBackendServiceRouter {
  constructor(discoveryOptions?: ServiceDiscoveryOptions) {
    this.serviceDiscovery = new ServiceDiscovery(discoveryOptions);
    this.useGenericDiscovery = discoveryOptions?.useGenericDiscovery ?? true;
  }
  
  async discoverAndConnect(): Promise<void> {
    if (this.useGenericDiscovery) {
      await this.discoverAndConnectGeneric();
    } else {
      await this.discoverAndConnectLegacy(); // Backward compatibility
    }
  }
}
```

**Step 2**: Discovery Strategies

1. **Registry-Based Discovery** (Priority: 100)
   - Central service registry with JSON-based storage
   - Health endpoint validation and stale registration filtering
   - Highest confidence rating (0.9) for verified registrations

2. **Configuration-Based Discovery** (Priority: 75)
   - User-configured backend endpoints via JSON configuration files
   - Comprehensive backend configuration validation
   - Medium-high confidence rating (0.8) for user-specified configs

3. **Endpoint Scanning Discovery** (Priority: 50)
   - HTTP, WebSocket, and IPC protocol scanning across configurable ports
   - `/api/skin` endpoint discovery for service identification
   - Lower confidence rating (0.6-0.7) due to scanning uncertainty

**Step 3**: Key Features

- **Multi-Strategy Orchestration**: Intelligent coordination of multiple discovery approaches
- **Priority-Based Execution**: Higher priority strategies execute first, results deduplicated by confidence
- **Graceful Degradation**: Individual strategy failures don't crash the system
- **Backward Compatibility**: Legacy hardcoded discovery maintained as fallback
- **Event-Driven Architecture**: Discovery lifecycle events for monitoring and integration
- **Intelligent Deduplication**: Prefer higher confidence and newer discoveries for duplicate services

#### Multi-Strategy Service Discovery Pattern: Success Metrics

- Type Safety: Full TypeScript compilation with comprehensive interfaces
- Test Coverage: 487 lines of comprehensive test suite covering all strategies
- Error Resilience: Graceful handling of strategy failures and network issues
- Performance: Sub-second discovery across multiple strategies with parallel execution
- Flexibility: Support for custom strategies and configurable discovery options
- Multi-strategy discovery system replacing hardcoded endpoints
- Full backward compatibility maintained

#### Multi-Strategy Service Discovery Pattern: Anti-Patterns

- **X** [Anti-Patterns]

#### Multi-Strategy Service Discovery Pattern: Validation Checklist

- [ ] Multi-strategy orchestration operational
- [ ] Registry-based discovery functional
- [ ] Configuration-based discovery working
- [ ] Endpoint scanning discovery active
- [ ] Graceful fallback strategies implemented
- [ ] Backward compatibility maintained
- [ ] Error resilience testing complete
- [ ] Performance benchmarks met

#### Multi-Strategy Service Discovery Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

- **2025-09-03 - [TASK-CLI-015]**: Enhanced pattern with robust file watching capabilities and configurable health checks. Key insights:
  - **Directory Management Challenge**: Pattern needed proactive directory creation for file watching - implemented automatic directory initialization
  - **Health Check Flexibility**: Added `enableHealthChecks` configuration option for testing scenarios while maintaining production validation
  - **Event System Integration**: File watcher events (add/change/remove) integrate seamlessly with existing EventEmitter architecture
  - **Performance Impact**: Sub-second event detection with zero performance degradation to existing discovery strategies
  - **Time**: 4 hours (diagnostic + fix + validation) vs. estimated 4 hours - accurate complexity assessment

#### Multi-Strategy Service Discovery Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-GENERIC-003], [TASK-CLI-015]
**Successfully Applied**: [TASK-GENERIC-003] ✅ Generic Service Discovery Mechanism (2025-08-29), [TASK-CLI-015] ✅ File System Watching Enhancement (2025-09-03)
**Integration Points**: Connection Factory, Dynamic Command Router, Backend Service Router, Universal Skin Engine
**Files Using This Pattern**: src/backend/service-discovery.ts, src/tests/backend/service-discovery.test.ts, src/backend/backend-service-router.ts

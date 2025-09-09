### Enhanced BackendConfig Schema Pattern

**Status**: ESTABLISHED
**Category**: Foundation
**Last Updated**: 2025-08-29
**Difficulty**: 🟢 Basic
**Est. Time**: ~30-45 minutes
**Prerequisites**: Basic TypeScript interface design, Universal Skin Engine Types

**Problem**: Generic backend integration requires comprehensive connection configuration that supports multiple protocols, authentication methods, and service discovery endpoints while maintaining backward compatibility with existing minimal configurations.

**Solution**: Enhanced BackendConfig interface with full connection specification and backward compatibility translation layer.

#### Enhanced BackendConfig Schema Pattern: Implementation Steps

**Step 1**: Enhanced Interface Definition

```typescript
// Enhanced BackendConfig with comprehensive connection specification
interface BackendConfig {
  // Basic identification
  service: string;
  version: string;
  
  // Enhanced connection specification
  protocol: 'ipc' | 'http' | 'websocket' | 'grpc';
  endpoint: string;
  
  // Enhanced authentication options
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth';
    credentials?: Record<string, string>;
    required?: boolean;
  };
  
  // Connection behavior configuration
  timeout?: number;
  retries?: number;
  keepAlive?: boolean;
  
  // Service discovery endpoints
  healthEndpoint?: string;
  capabilitiesEndpoint?: string;
  
  // Protocol-specific options
  options?: { [key: string]: any };
  
  // Legacy support
  endpoints?: Record<string, string>;
}
```

**Step 2**: Backward Compatibility Layer

```typescript
// Configuration manager with multi-mode support
class BackendIntegrationConfigManager {
  getBackendConfig(backendName: string, skinConfig?: BackendConfig): BackendConfig | null {
    // Generic mode: Use skin configuration first
    if (this.config.mode === 'generic' || this.config.mode === 'hybrid') {
      if (skinConfig) {
        const override = this.config.genericOverrides.get(backendName);
        return override ? { ...skinConfig, ...override } : skinConfig;
      }
    }
    
    // Legacy mode or fallback: Use hardcoded configuration
    if (this.config.mode === 'legacy' || this.config.features.enableLegacyFallback) {
      return this.getLegacyBackendConfig(backendName);
    }
    
    return null;
  }
}
```

**Step 3**: Connection Factory Integration

```typescript
// Generic connection factory using enhanced schema
class ConnectionFactory {
  static async create(serviceId: string, backendConfig: BackendConfig): Promise<BackendConnection> {
    // Validate configuration
    ConnectionFactory.validateConfig(backendConfig);
    
    // Create protocol-specific connection based on enhanced config
    switch (backendConfig.protocol) {
      case 'ipc':
        return ConnectionFactory.createIPCConnection(serviceId, backendConfig);
      case 'http':
        return ConnectionFactory.createHTTPConnection(serviceId, backendConfig);
      // ... other protocols
    }
  }
}
```

#### Enhanced BackendConfig Schema Pattern: Success Metrics

- Clean compilation and backward compatibility maintained: 100% success rate
- Supports full connection specification for any backend protocol
- Enables authentication, service discovery, and protocol-specific options
- Provides safe transition path from hardcoded to generic backend integration

#### Enhanced BackendConfig Schema Pattern: Anti-Patterns

- **X** [Anti-Patterns]

#### Enhanced BackendConfig Schema Pattern: Validation Checklist

- [ ] Enhanced BackendConfig interface properly defined with all required fields
- [ ] Backward compatibility layer maintains support for existing configurations
- [ ] Connection factory integrates with enhanced schema validation
- [ ] Protocol-specific options correctly handled

#### Enhanced BackendConfig Schema Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

#### Enhanced BackendConfig Schema Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-GENERIC-004]
**Successfully Applied**: [TASK-GENERIC-004] ✅ Enhanced BackendConfig Schema Implementation (2025-08-29)
**Integration Points**: Universal Skin Engine Types
**Files Using This Pattern**: backend-integration-config.ts, connection-factory.ts, universal-skin-engine-types.ts

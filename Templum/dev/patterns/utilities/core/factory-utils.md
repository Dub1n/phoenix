---
date-created: 2025-09-14T00:00:00Z
last-updated: 2025-09-14T19:10:00Z
name: factory-utils
description: Shared factory orchestration utilities that standardize creation pipelines across connection, adapter, and session components.
status: "[!]"
category: infrastructure
use-when:
  - Consolidating duplicated switch-based factory logic across backend connectors and adapters.
  - Replacing ad-hoc factory error handling with centralized, contextual responses.
  - Providing chainable factory registration for modules that load strategies dynamically.
keywords:
  - factory-utils
  - factory-registry
  - strategy-orchestration
prerequisites:
  - logger
  - error-handler
  - registry-utils
related-patterns:
  - async-utils
  - resilience-utils
  - registry-utils
---

## Factory Utils Consolidation Pattern

**Problem**: Connection, adapter, and session modules each maintain bespoke factory logic (≈4 files / ≈110 lines) with duplicated strategy registration, console logging, and manual error propagation. The duplication slows feature work and creates drift in validation and observability expectations.

**Solution**: A minimal-footprint Factory Utils toolkit that provides fluent strategy registration, consistent error handling, and automatic instrumentation. Callers should replace multi-branch switch statements with one-line creation calls while delegating lifecycle checks to the shared utility.

### Redundancy Snapshot

| Area | Representative File | Duplicated Concerns |
|------|---------------------|---------------------|
| Backend connectivity | `src/backend/connection-factory.ts` | Switch-based protocol gating, console logging, ad-hoc retries |
| Interface adapters | `src/interfaces/interface-adapter-registry.ts` | Map lifecycle management, factory guards, manual telemetry |
| Legacy adapter fallback | `src/interfaces/interface-adapter-registry.legacy.ts` | Manual registry cleanup, duplicate error reporting |
| Session bootstrap | `src/session/templum-universal-session-manager.ts` | Inline factory guards for session/context loaders |

**Impact**: Consolidating these segments removes ≈110 duplicated lines, enforces consistent strategy coverage, and unlocks shared validation hooks for additional factory-based modules.

### Representative Before

```typescript
switch (backendConfig.protocol) {
  case 'ipc':
    console.log(`[IPC] Establishing connection to ${serviceId}`);
    return await createIPC(serviceId, backendConfig);
  case 'http':
    console.log(`[HTTP] Testing connection to ${serviceId}`);
    return await createHTTP(serviceId, backendConfig);
  default:
    throw createTemplumError(`Unsupported protocol: ${backendConfig.protocol}`, 'PROTOCOL_ERROR', 'integration');
}
```

### Minimal Footprint API Design

```typescript
import { createLogger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { createFactoryToolkit } from '../utils/factory-utils';

const connectionFactory = createFactoryToolkit<BackendConfig, BackendConnection>({
  id: 'connection-factory',
  logger: createLogger('connection-factory'),
  handleError: (error, { scope, metadata }) =>
    ErrorHandler.handle(error, scope ?? 'connection-factory', metadata)
})
  .withStrategy('ipc', createIPCConnection)
  .withStrategy('http', createHTTPConnection)
  .withStrategy('websocket', createWebSocketConnection)
  .withFallback('ipc');

const connection = await connectionFactory.create(serviceId, backendConfig, {
  context: { retry: backendConfig.retries }
});
```

**Key affordances**:

- `createFactoryToolkit` returns a fluent builder: `withStrategy`, `withConfig`, `withFallback`, `create`.
- Automatic logging wraps every strategy invocation via shared Logger integration.
- Error handler delegates to `error-handler` utilities to standardize severity + remediation hints.
- Strategies can return sync or async results without additional boilerplate.

### Representative After

```typescript
const connection = await factoryUtils
  .forConnections()
  .create(serviceId, backendConfig);
```

### Integration Targets

- `src/backend/connection-factory.ts`: Replace protocol switch with strategy registry; surface retries and authentication hooks through factory contexts.
- `src/interfaces/interface-adapter-registry.ts`: Swap bespoke `adapterFactories` map usage for shared registration helpers (`register`, `resolve`, `dispose`).
- `src/interfaces/interface-adapter-registry.legacy.ts`: Align legacy path with shared lifecycle guards before eventual removal.
- `src/session/templum-universal-session-manager.ts`: Use factory contexts for session activation strategies and eliminate inline guard clauses.

### Implementation Guidance

- **Strategy registration**: Factories register via `registerStrategy(type, resolver, options)` with optional feature flags (`eager`, `singleton`).
- **Context packaging**: Utility injects caller metadata (service ID, interface type, telemetry scope) automatically; modules can extend context for specialized requirements.
- **Validation**: Built-in schema checks verify that each requested strategy exists, exports the expected interface, and declares recovery paths.
- **Error contexts**: The toolkit passes `{ strategy, scope, metadata }` into `handleError` callbacks so modules can enrich remediation guidance.
- **Observability**: Logger and performance hooks (`startSpan`, `finishSpan`) execute by default; disable per strategy via options.
- **Dependency injection**: Toolkit accepts injected transports (logger, metrics, fallback strategies) to remain testable and composable.

### Validation Checklist

- [ ] All factory-dependent modules register strategies through Factory Utils (no raw `switch` blocks remain).
- [ ] Strategy coverage matrix documented (IPC, HTTP, WebSocket, CLI adapters, VSCode adapters, session recovery) with tests for success + failure paths.
- [ ] Error handling routes through `error-handler` utilities; each failure emits actionable remediation metadata.
- [ ] Logger integration verified for every strategy invocation, including child contexts.
- [ ] Unit tests cover factory creation, fallback selection, and misconfiguration rejection (≥80% branch coverage for the utility itself).

### Migration Playbook

1. Implement `Templum/src/utils/factory-utils.ts` using the toolkit design above (tests first in `Templum/src/utils/__tests__/factory-utils.test.ts`).
2. Migrate `connection-factory`, `interface-adapter-registry`, and session manager to the shared API.
3. Remove duplicated telemetry + guard clauses once validated.
4. Update documentation callouts in `safe-consolidation-candidates.md` after each migration stage.

### Success Metrics

- ≥110 duplicated lines removed across the four target modules.
- Factory creation calls reduced to single-line invocations with shared context injection.
- Consistent remediation metadata attached to 100% of factory failures.
- Observability dashboards receive standardized telemetry for strategy invocations.

### Anti-Patterns

- **X** Registering strategies directly on module-local maps.
- **X** Throwing raw errors or logging via `console.*` within strategies.
- **X** Mixing factory registration and creation in the same function instead of using the builder lifecycle.
- **X** Skipping tests for fallback paths or unsupported strategy requests.

### Outstanding Notes

- Utility implementation is pending (`Templum/src/utils/factory-utils.ts`); apply TDD per onboarding guidance before migrating consumers.
- Coordinate with Registry Utils maintainers to share lifecycle validation primitives and avoid divergent behaviors.

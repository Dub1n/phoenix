---
date-created: 2025-09-14T18:05:00Z
last-updated: 2025-10-24T22:40:00Z
name: logger
description: Centralized logging infrastructure to eliminate 2,810 console.log/warn/error calls across 75+ files with structured, contextual logging
status: "[x]"
category: infrastructure
use-when:
  - Eliminating scattered console logging across components
  - Need for structured logging with context management
  - Consistent log format and level management required
  - Performance tracking and debug capabilities needed
keywords:
  - logging
  - console-consolidation
  - structured-logging
  - context-management
  - performance-tracking
prerequisites:
  - none
related-patterns:
  - error-handler
  - debug-utils
  - performance-utils
---

### Logger Utility Consolidation Pattern

**Problem**: Templum has 2,810 console.log/warn/error calls scattered across 75+ files with inconsistent formatting, no structured data support, and contextual prefixes manually maintained in each component.

**Current State Examples**:

```typescript
console.log('[SERVICE_DISCOVERY] Starting service scan...');
console.log('[IPC] Connection established to backend');
console.error('[HTTP] Backend request failed:', error.message);
console.warn('[WebSocket] Connection unstable, retrying...');
```

**Solution**: Centralized Logger utility with automatic context detection, structured logging, minimal usage footprint, and performance tracking capabilities.

#### Logger Utility Implementation

**Core Logger Class** (Minimal Usage Design):

```typescript
export class Logger {
  private context: string;
  private level: LogLevel = LogLevel.INFO;
  private performance: Map<string, number> = new Map();
  
  constructor(context?: string) {
    // Auto-detect context from call stack if not provided
    this.context = context || this.detectContext();
  }
  
  // Minimal usage API - single line calls
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  error(message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, { error: error?.message, stack: error?.stack, ...data });
  }
  
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  // Performance tracking - one-liner timing
  time(label: string): void {
    this.performance.set(label, Date.now());
  }
  
  timeEnd(label: string): void {
    const start = this.performance.get(label);
    if (start) {
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration: `${duration}ms` });
      this.performance.delete(label);
    }
  }
  
  // Child loggers for component-specific contexts
  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`);
  }
  
  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.level) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.context}] [${LogLevel[level]}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
  
  private detectContext(): string {
    // Simple context detection from Error stack
    const stack = new Error().stack;
    const match = stack?.match(/at.*\/([^\/]+)\.ts:/);
    return match?.[1] || 'UNKNOWN';
  }
}

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Global logger factory - minimal setup
export const createLogger = (context?: string): Logger => new Logger(context);

// Default logger instance for immediate use
export const log = new Logger();
```

**Environment Configuration**:

```typescript
export class LoggerConfig {
  static configure(options: LoggerOptions): void {
    // Configure global log level, format, output destination
  }
  
  static setLevel(level: LogLevel): void {
    // Set global log level
  }
  
  static enableStructured(): void {
    // Enable JSON structured output for production
  }
}
```

#### Usage Examples (Minimal Footprint)

**Before** (Current scattered approach):

```typescript
// In backend-service-router.ts (315 calls to replace)
console.log('[BACKEND_ROUTER] Starting service discovery...');
console.log('[BACKEND_ROUTER] Connected to service:', serviceId);
console.error('[BACKEND_ROUTER] Connection failed:', error.message);

// In service-discovery.ts (287 calls to replace)  
console.log('[SERVICE_DISCOVERY] Scanning ~/.templum/services/...');
console.warn('[SERVICE_DISCOVERY] Stale service removed:', pid);

// Manual timing
const start = Date.now();
// ... operation ...
console.log('[SERVICE_DISCOVERY] Scan completed in', Date.now() - start, 'ms');
```

**After** (Consolidated with auto-context):

```typescript
// Component-level logger with auto-detected context
const log = createLogger(); // Auto-detects 'backend-service-router' from file

// Single-line usage
log.info('Starting service discovery...');
log.info('Connected to service', { serviceId });
log.error('Connection failed', error);

// In service-discovery.ts
const log = createLogger(); // Auto-detects 'service-discovery'
log.info('Scanning ~/.templum/services/...');
log.warn('Stale service removed', { pid });

// One-line performance timing
log.time('service-scan');
// ... operation ...
log.timeEnd('service-scan'); // Automatically logs with duration
```

**Child Logger Usage**:

```typescript
// In complex components, create sub-loggers
const log = createLogger('backend-router');
const httpLog = log.child('http');  
const ipcLog = log.child('ipc');

httpLog.info('HTTP request started');  // [backend-router:http] 
ipcLog.info('IPC connection opened');   // [backend-router:ipc]
```

> **2025-10-24 Status:** Stage 4/6 migrations plus the Stage 7 sweep eliminated all 2,810 console calls. Validation artefacts: `Templum/archive/dev-files/utility-migration/evidence/pattern-1/stage7/jest-ci-20251024T222520Z.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-1/stage7/phase6-health-20251024T222834Z.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-1/stage7/phase6-validation-20251024T222848Z.log`, `Templum/archive/dev-files/utility-migration/evidence/pattern-1/stage7/sweep-20251024T224015Z.log`.

#### Files Using This Pattern

**Core Backend Components**:

- [x] `src/backend/backend-service-router.ts` (315 console calls → `log.info/warn/error`)
- [x] `src/backend/service-discovery.ts` (287 console calls → auto-context logging)
- [x] `src/backend/connection-factory.ts` (156 console calls → child loggers per protocol)
- [x] `src/backend/dynamic-command-router.ts` (89 console calls → structured command logging)

**Interface Components**:

- [x] `src/interfaces/cli-adapter.ts` (198 console calls → CLI-specific context)
- [x] `src/interfaces/cli-adapter-abstracted.ts` (234 console calls → abstracted context logging)
- [x] `src/interfaces/vscode-adapter.ts` (78 console calls → VSCode event logging)
- [x] `src/interfaces/terminal-ui-components.ts` (142 console calls → UI component logging)

**Core System Components**:

- [x] `src/core/templum-core.ts` (167 console calls → orchestrator logging)
- [x] `src/core/adapter-registry.ts` (123 console calls → dependency injection logging)
- [x] `src/skin/universal-skin-engine.ts` (189 console calls → skin processing logging)
- [x] `src/session/templum-universal-session-manager.ts` (134 console calls → session state logging)

**All Additional Files** (68+ files with remaining 898 console calls):

- [x] All components with console.log/warn/error usage migrate to centralized logger

#### Skin Domain Helper (Universal Pattern)

To keep Stage 6 migrations aligned, skin-domain components (Universal Skin Engine, Skin Version Manager, related helpers) must acquire loggers through `getSkinLogger(domain, segment)`. The helper enforces a single shared tree per domain with the following allowed segments:

```typescript
import { getSkinLogger } from '../../skin/skin-logger';

const coreLogger = getSkinLogger('universal-skin-engine');
const renderingLogger = getSkinLogger('universal-skin-engine', 'rendering');
const validationLogger = getSkinLogger('universal-skin-engine', 'validation');
const integrationLogger = getSkinLogger('universal-skin-engine', 'integration');
```

- `domain` must be `'universal-skin-engine'` or `'skin-version-manager'` (additions require pattern review).
- Segments are limited to `core`, `rendering`, `validation`, and `integration`; call the helper for each segment instead of creating new child names.
- Instance-specific scoping (e.g., `getSkinLogger(..., 'rendering').child('instance-1')`) is permitted, but the segment must originate from the helper.

Future Stage 6 lanes should reference this helper instead of introducing bespoke child loggers; Stage 3 guardrails will flag direct `.child()` calls under `src/skin/**` that bypass it.

#### Expected Impact

**Quantitative Benefits**:

- **Lines Reduced**: ~1,500-2,000 lines of manual console formatting removed
- **Files Affected**: 75+ files with console logging
- **Calls Consolidated**: 2,810 console calls → single logger API
- **Consistency**: 100% consistent log format across entire codebase

**Qualitative Benefits**:

- **Structured Logging**: JSON output option for production monitoring
- **Context Awareness**: Automatic context detection reduces boilerplate
- **Performance Tracking**: Built-in timing capabilities
- **Debug Control**: Environment-based log level control
- **Child Loggers**: Component-specific contexts without manual prefixes

#### Implementation Validation

**Before Migration**:

- [x] Counted exact console calls in each target file (Stage 1 inventory log `dev/architecture/plans/1.generated.md`).
- [x] Identified context patterns and manual prefixes per lane scopes.
- [x] Mapped performance timing patterns to `Logger.time/timeEnd`.

**During Migration**:  

- [x] Replaced console calls with appropriate log methods across Stage 4 guardrail lanes.
- [x] Used auto-context detection and scoped helpers (`getSkinLogger`, `createLogger().child`) where needed.
- [x] Converted manual timing to `log.time()` / `log.timeEnd()`.
- [x] Added structured data payloads for telemetry surfaces.

**After Migration**:

- [x] Verified all 2,810 console calls eliminated (Stage 7 sweep log `Templum/archive/dev-files/utility-migration/evidence/pattern-1/stage7/sweep-20251024T224015Z.log`).
- [x] Confirmed consistent log format across components via Jest + Phase 6 validation runs.
- [x] Tested log level filtering through coverage in `src/utils/__tests__/logger.test.ts`.
- [x] Validated performance tracking through guardrail suites recorded in `Templum/archive/dev-files/utility-migration/evidence/pattern-1/stage7/jest-ci-20251024T222520Z.log`.

#### Anti-Patterns

- **X** Don't manually create context strings - use auto-detection
- **X** Don't use console.* calls anywhere after migration  
- **X** Don't create multiple loggers in same component unless needed for sub-contexts
- **X** Don't log sensitive data (passwords, tokens) even in debug mode

#### Pattern Metadata

**Used By Active Tasks**: Phase 2 Utility Consolidation  
**Implementation Priority**: CRITICAL (Highest Impact)  
**Dependencies**: None (foundation utility)  
**Integration Points**: All components across entire codebase  
**Migration Complexity**: Medium (simple find/replace with context consideration)  
**Performance Impact**: Positive (structured logging, optional JSON output)

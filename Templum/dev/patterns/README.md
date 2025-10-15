---
date-created: 2025-10-03T14:53:00Z
last-updated: 2025-10-08T00:00:00Z
name: pattern-readme
category: patterns
status: '[~]'
tags:
  - patterns
  - readme
  - maintenance
  - index
  - templum
---

## Templum Implementation Patterns

- **Purpose**: Single source of truth for active Templum implementation patterns and utility consolidation plans.
- **Usage**: Align implementation work with established patterns before writing code; confirm prerequisites, keywords, and related patterns.
- **Maintenance**: Regenerate tables and pattern reference blocks whenever frontmatter changes; update `last-updated` in this README with each refresh.
- **Upstream Sources**: Pattern metadata (`frontmatter`) inside `Templum/dev/patterns/**/*.md`.

### Generated Pattern Directory

#### Active Patterns

<!-- PATTERN:ACTIVE_TABLE -->
| Pattern | Status | Category | Keywords |
| --- | --- | --- | --- |
| [abstraction-layer-architecture](architecture/abstraction-layer-architecture.md) | [x] | architecture | abstraction, dependency-inversion, interface-adapters, orchestrator, decoupling, testability |
| [accessibility-compliance-cli-interfaces](display-ui/accessibility-compliance-cli-interfaces.md) | [x] | display-ui | accessibility-compliance, wcag-2-1-aa, screen-reader-support, keyboard-navigation, assistive-technologies, semantic-markup, inclusive-design |
| [adaptive-mcp-integration](integration/adaptive-mcp-integration.md) | [x] | integration | mcp-integration, adaptive-timeout, circuit-breaker, fallback-strategies, connection-resilience, cli-validation |
| [advanced-compatibility-validation](quality/advanced-compatibility-validation.md) | [x] | quality | validation, compatibility, interfaces, performance, structural, cross-platform, multi-dimensional, constraints |
| [async-utils](utilities/core/async-utils.md) | [x] | infrastructure | async-utilities, timeout-management, retry-logic, debouncing, throttling, promise-utilities |
| [backend-service-integration-unified](integration/backend-service-integration-unified.md) | [x] | integration | backend-integration, protocol-abstraction, skin-driven, generic-factory, multi-protocol |
| [bordered-window-layout](display-ui/bordered-window-layout.md) | [x] | display-ui | window-borders, terminal-layout, cli-design, visual-structure, procedural-rendering |
| [cache-utils](utilities/system/cache-utils.md) | [x] | system | cache, ttl, lru, performance, analytics |
| [chainable-string-utils](utilities/data/chainable-string-utils.md) | [x] | data-management | string-utils, chainable-api, text-formatting, cli-output |
| [circuit-breaker-resilience](resilience/circuit-breaker-resilience.md) | [x] | resilience | circuit-breaker, resilience, error-recovery, fault-tolerance, cascading-failures, isolation |
| [cli-process-separation](architecture/cli-process-separation.md) | established | architecture | cli-separation, process-architecture, service-discovery, ipc-communication, headless-deployment, multi-terminal |
| [cli-visual-design-structured-windows](display-ui/cli-visual-design-structured-windows.md) | [x] | display-ui | structured-windows, border-rendering, unicode-fallback, terminal-compatibility, progressive-enhancement, emoji-elimination, accessibility-compliance |
| [configuration-management](configuration/configuration-management.md) | [x] | configuration | configuration, config-management, schema-bridging, templum-config-manager, component-initialization, environment-detection |
| [configuration-utils](utilities/system/configuration-utils.md) | [x] | configuration | configuration, environment-variables, schema-validation, file-management, hot-reload |
| [core-component-unit-testing](testing/core-component-unit-testing.md) | [x] | testing | unit-testing, mock-management, integration-testing, backend-validation, jest, typescript, service-discovery, connection-factory |
| [cross-separator-navigation](display-ui/cross-separator-navigation.md) | [x] | display-ui | menu-navigation, separator-handling, exit-behavior, keyboard-input, raw-mode, confirmation-dialogs |
| [debug-utils](utilities/dev/debug-utils.md) | [~] | development-tools | debug-toolkit, profiling, state-inspection |
| [dependency-injection-unified](architecture/dependency-injection-unified.md) | x | architecture | dependency-injection, adapter-pattern, initialization, lifecycle-management, validation |
| [display-utils](utilities/display/display-utils.md) | [x] | display-ui | display-utilities, ui-consistency, service-ordering, layout-calculations, terminal-standards |
| [dynamic-command-router-integration](integration/dynamic-command-router-integration.md) | [x] | integration | dynamic-command-router, menu-integration, registry-systems, backward-compatibility, skin-driven |
| [dynamic-command-routing](routing/dynamic-command-routing.md) | [x] | routing | dynamic-routing, command-mapping, backend-integration, skin-definitions, runtime-configuration, generic-routing |
| [dynamic-local-command-detection](routing/dynamic-local-command-detection.md) | [x] | routing | dynamic-routing, command-detection, skin-definition-driven, routing-accuracy, backward-compatibility |
| [dynamic-routing-initialization](initialization/dynamic-routing-initialization.md) | [x] | initialization | lazy-initialization, routing-startup, error-handling, performance-optimization, graceful-degradation |
| [efficient-fallback](resilience/efficient-fallback.md) | [x] | resilience | fallback, null-check, performance, graceful-degradation, exception-handling, error-reduction |
| [emoji-elimination-systematic-replacement](display-ui/emoji-elimination-systematic-replacement.md) | [x] | display-ui | emoji-elimination, systematic-replacement, text-equivalents, batch-processing, accessibility-compliance, clean-design, unicode-cleanup |
| [end-to-end-testing-scenarios](testing-integration/end-to-end-testing-scenarios.md) | [x] | testing-integration | e2e-testing, integration-testing, performance-monitoring, workflow-validation, cross-interface-testing, mock-services, jest-framework |
| [enhanced-backendconfig-schema](configuration/enhanced-backendconfig-schema.md) | [x] | configuration | backend-config, connection-schema, protocol-support, authentication, service-discovery, backward-compatibility |
| [enhanced-menu-integration](integration/enhanced-menu-integration.md) | [x] | integration | menu-integration, backward-compatibility, hybrid-architecture, performance-optimization, progressive-enhancement |
| [enhanced-skin-registration-validation](quality/enhanced-skin-registration-validation.md) | [x] | quality | skin-registration, validation, version-management, conflict-detection, error-handling, universal-skin-engine |
| [enhanced-validation-testing](testing/enhanced-validation-testing.md) | [x] | testing | validation-testing, autonomous-systems, safety-framework, agent-integration, rollback-recovery, audit-trail, production-readiness, quality-gates |
| [error-handler](utilities/core/error-handler.md) | [x] | infrastructure | error-handling, catch-block-consolidation, error-recovery, timeout-management, structured-errors |
| [error-recovery](resilience/error-recovery.md) | [x] | resilience | error-recovery, fallback-rendering, graceful-degradation, system-availability, fault-tolerance, integration-failure, circuit-breaker, resilience |
| [event-utils](utilities/core/event-utils.md) | [x] | infrastructure | event-utilities, typed-events, event-emitter-consolidation, subscription-management, automatic-cleanup, event-bus |
| [factory-registry-with-context-management](architecture/factory-registry-with-context-management.md) | [x] | architecture | factory-pattern, registry, context-management, error-boundaries, vscode-extension, dependency-injection |
| [factory-utils](utilities/core/factory-utils.md) | [!] | infrastructure | factory-utils, factory-registry, strategy-orchestration |
| [file-based-handoff-infrastructure](infrastructure/file-based-handoff-infrastructure.md) | [x] | infrastructure | agent-communication, context-isolation, handoff, json-schemas, file-system, workflow, audit-trail |
| [generic-agent-template](development-tools/generic-agent-template.md) | [x] | development-tools | agent-template, context-isolation, handoff-protocol, cross-project, research-automation |
| [http-protocol-communication](integration/http-protocol-communication.md) | [x] | integration | http, pcl-integration, backend-communication, api-endpoints, error-handling, timeout-handling, service-mapping |
| [hybrid-cli-development-testing](testing-integration/hybrid-cli-development-testing.md) | [x] | testing-integration | hybrid-synthesis, cli-development, agent-interaction, multi-category-validation, context-preservation |
| [integration-test-framework-transition](testing-integration/integration-test-framework-transition.md) | [x] | testing-integration | integration-testing, jest, public-api, mock-elimination, real-behavior-validation |
| [interface-adapter-integration-testing](testing-integration/interface-adapter-integration-testing.md) | [x] | testing-integration | interface-adapters, integration-testing, orchestrator, testing-framework, mock-implementation, cross-interface, state-synchronization |
| [ipc-protocol-communication](integration/ipc-protocol-communication.md) | [x] | integration | ipc, inter-process-communication, backend-service, haruspex, childprocess, real-time-messaging |
| [library-module-interop-resolution](development-tools/library-module-iterop-resolution.md) | experimental | development-tools | typescript, esmodule, interop, compilation, library-integration, zod, configuration |
| [logger](utilities/core/logger.md) | [x] | infrastructure | logging, console-consolidation, structured-logging, context-management, performance-tracking |
| [mcp-integration-preservation-ui-changes](integration/mcp-integration-preservation-ui-changes.md) | [x] | integration | mcp-preservation, agent-cli-compatibility, backward-compatibility, ui-transformation, command-mapping, session-management, mcp-bridge |
| [mcp-pty-integration](integration/mcp-pty-integration.md) | [x] | integration | mcp, pty, terminal, session-management, cross-platform, mock-development |
| [minimal-compilation-stabilization-pattern](development-tools/minimal-compilation-stabilization-pattern.md) | [x] | development-tools | compilation, stabilization, dependencies, typescript, test-fixes, scope-discipline, error-reduction |
| [mock-real-api-alignment](integration/mock-real-api-alignment.md) | [x] | integration | api-alignment, typescript-interfaces, mocks, testing, compilation-errors, interface-conflicts |
| [mock-real-api-contract-testing](testing-integration/mock-real-api-contract-testing.md) | experimental | testing-integration | contract-testing, mock-validation, api-consistency, test-infrastructure, automated-testing |
| [multi-strategy-service-discovery](infrastructure/multi-strategy-service-discovery.md) | [x] | infrastructure | service-discovery, backend-integration, multi-strategy, dynamic-configuration, endpoint-scanning, registry-based |
| [navigation-utils](utilities/core/navigation-utils-utility.md) | [x] | business-logic | navigation-utils, breadcrumb-optimization, confidence-scoring, routing-flows, state-management |
| [node.js-type-system-alignment](development-tools/node.js-type-system-alignment.md) | [x] | development-tools | nodejs, typescript, websocket, imports, scoping, constructors, type-system |
| [observability-infrastructure](operations/observability-infrastructure.md) | [x] | operations | observability, logging, metrics, monitoring, alerting, structured-logging, performance, debugging |
| [path-utils](utilities/system/path-utils.md) | [~] | system | safe-paths, sandbox-io, confidence-scoring, cross-platform |
| [pcl-component-integration-unified](integration/pcl-component-integration-unified.md) | [x] | integration | pcl, component, integration, performance, validation, health-analysis, real-components, measurement |
| [pcl-enhanced-rendering](display-ui/pcl-enhanced-rendering.md) | [x] | display-ui | pcl-rendering, theme-adapter, component-styling, universal-menu-item, type-specific-styling, visual-enhancement |
| [pcl-rendering-integration-bridge-pattern](display-ui/pcl-rendering-integration-bridge.md) | [x] | display-ui | rendering, pcl-integration, universal-skin-engine, bridge-pattern, theme-mapping, layout-engine |
| [performance-utils](utilities/system/performance-utils.md) | [x] | system | performance, timing, metrics, telemetry |
| [production-readiness-validation](quality/production-readiness-validation.md) | [x] | quality | production-readiness, system-validation, real-metrics, deployment-assessment, performance-validation, resource-management, error-handling, system-health |
| [progressive-enhancement-terminal-ui](display-ui/progressive-enhancement-terminal-ui.md) | [x] | display-ui | progressive-enhancement, terminal-compatibility, capability-detection, adaptive-ui, fallback-strategies, environment-detection, graceful-degradation |
| [protocol-communication-overview](integration/protocol-communication-overview.md) | [x] | integration | protocol, communication, backend-integration, ipc, http, websocket, service-integration |
| [protocol-utils](utilities/core/protocol-utils.md) | [x] | infrastructure | protocol-utilities, connection-management, message-validation, confidence-scoring, protocol-optimization, health-monitoring |
| [real-implementation-integration](integration/real-implementation-integration.md) | [x] | integration | implementation-integration, placeholder-replacement, universal-skin-engine, error-handling, fallback-coordination, real-implementations |
| [registry-utils](utilities/registry-utils.md) | x | infrastructure | registry-utils, lifecycle-management, dependency-injection, confidence-scoring |
| [resilience-utils-consolidation-pattern](utilities/resilience-utils.md) | pending | resilience | resilience-utilities, fallback-strategies, performance-monitoring, rollback-automation, risk-mitigation, system-recovery |
| [serialization-utils](utilities/data/serialization-utils.md) | [x] | data-management | serialization, json-safety, schema-validation, fallback-orchestration |
| [service-utils](utilities/core/service-utils.md) | [x] | business-logic | service-utils, service-ordering, health-summary, dependency-resolution |
| [session-management-unified](architecture/session-management-unified.md) | [x] | architecture | session-management, interface-coordination, state-preservation, error-recovery, multi-backend, session-lifecycle |
| [skin-versioning-system](configuration/skin-versioning-system.md) | [x] | configuration | versioning, semantic-versioning, skin-management, conflict-resolution, migration, compatibility, caching |
| [templum-resource-management-unified](infrastructure/templum-resource-management-unified.md) | [x] | infrastructure | resource-management, memory-allocation, connection-pooling, policy-enforcement, service-health, automated-cleanup, resource-tracking, performance-monitoring |
| [templumerror-integration](resilience/templumerror-integration.md) | [x] | resilience | error-handling, typescript, error-interfaces, error-categorization, monitoring, debugging, type-safety, signal-system |
| [terminal-formatter](utilities/display/terminal-formatter.md) | [x] | display-ui | terminal-formatter, semantic-formatting, cli-consistency, capability-detection |
| [terminal-state-management](infrastructure/terminal-state-management.md) | [x] | infrastructure | terminal, state-management, inquirer, cli, stdin, process-control |
| [terminal-ui-components](display-ui/terminal-ui-components.md) | [x] | display-ui | terminal-ui, cli-components, progress-bars, interactive-prompts, responsive-layout, chalk-theming |
| [test-health-monitoring](quality/test-health-monitoring.md) | [x] | quality | test-health, monitoring, pre-commit, coverage, validation, infrastructure, quality-gates |
| [test-infrastructure-repair](testing/test-infrastructure-repair.md) | [x] | testing | test-infrastructure, typescript, compilation-errors, type-system, test-repair, interface-alignment |
| [test-type-system-alignment](testing/test-type-system-alignment.md) | [x] | testing | type-alignment, test-interfaces, typescript-compilation, dual-type-system, TDD-workflow, interface-contracts, templum-types, universal-skin-engine-types |
| [test-utils](utilities/dev/test-utils.md) | [x] | development-tools | test-utilities, mock-generation, assertion-helpers, test-data-factories, integration-testing |
| [theme-utils](utilities/display/theme-utils.md) | [x] | display-ui | theme-management, color-palette, interface-adaptations, dynamic-theming, performance-optimisation |
| [type-conversion](foundation/type-conversion.md) | [x] | foundation | type-conversion, type-safety, interface-bridging, legacy-compatibility, design-tokens, theme-conversion |
| [type-guards](utilities/data/type-guards.md) | [ ] | data-management | type-guards, typescript, runtime-validation, confidence-scoring, semantic-api, property-validation, type-narrowing, runtime-safety |
| [typescript-configuration-optimization](configuration/typescript-configuration-optimization.md) | [x] | configuration | typescript, configuration, performance, compilation, module-resolution, esmodule-interop |
| [unified-type-system](foundation/unified-type-system.md) | [x] | foundation | typescript, compilation, error-handling, type-system, map-iteration, signals, templum-types |
| [universal-interface-orchestration](architecture/universal-interface-orchestration.md) | [x] | architecture | interface-switching, session-preservation, universal-skin-engine, validation, error-recovery, performance-monitoring, orchestration |
| [universal-skin-engine](display-ui/universal-skin-engine.md) | [x] | display-ui | rendering, theming, cross-platform, version-management, interface-types, universal, engine, pcl-integration |
| [unused-variable-cleanup-automation](quality/unused-variable-cleanup-automation.md) | [x] | quality | eslint, typescript, automation, unused-variables, imports, code-quality, compilation |
| [validator](utilities/data/validator.md) | proposed | data-management | validation-utilities, data-consistency, schema-validation, input-validation, type-checking |
| [vscode-extension-activation-pattern](initialization/vscode-extension-activation-pattern.md) | [x] | initialization | vscode, extension, activation, webview, commands, lifecycle, graceful-degradation |
| [vscode-extension-configuration](configuration/vscode-extension-configuration.md) | [x] | configuration | vscode, extension, configuration, manifest, package.json, cli-conversion, activation-events, view-contributions |
| [vscode-extension-integration-system](integration/vscode-extension-integration-system.md) | [x] | integration | vscode-extension, service-discovery, interface-switching, connection-management, resource-cleanup, tree-provider, templum-core |
| [vscode-service-tree-provider](display-ui/vscode-service-tree-provider.md) | [x] | display-ui | vscode, tree-provider, conditional-display, backend-capability-profile, service-tree, visual-indicators |
| [websocket-protocol-communication](integration/websocket-protocol-communication.md) | [x] | integration | websocket, real-time, bidirectional, protocol, litany, backend-service, messaging |
| [window-utils](utilities/display/window-utils.md) | [x] | display-ui | window-utilities, ui-consistency, border-rendering, layout-management, terminal-ui |
<!-- /PATTERN:ACTIVE_TABLE -->

#### Deprecated or Migrated Patterns

<!-- PATTERN:DEPRECATED_TABLE -->
| Pattern | Status | Category | Keywords |
| --- | --- | --- | --- |
| [backend-integration-feature-flags](configuration/backend-integration-feature-flags.md) | deprecated | configuration | feature-flags, backend-integration, progressive-enhancement, hybrid-modes, fallback-mechanisms |
<!-- /PATTERN:DEPRECATED_TABLE -->

### Pattern Reference Details

> Full pattern metadata with context, prerequisites, and related work. Sorted alphabetically by pattern `name`.

<!-- PATTERN:DETAIL_LIST -->
- [abstraction-layer-architecture](architecture/abstraction-layer-architecture.md) | 2025-09-11-1217 | architecture | Complete abstraction layer with interface contracts enabling dependency inversion for all interface adapters, decoupling concrete implementations from interface layer
  - use-when:
    - Interface adapters are directly coupled to concrete implementations, violating dependency inversion principle and reducing testability
  - keywords: abstraction, dependency-inversion, interface-adapters, orchestrator, decoupling, testability
  - prerequisites: basic-interface-adapter-pattern, universal-interface-management
  - related patterns: interface-adapter-registry, universal-skin-engine, backend-service-abstraction

- [accessibility-compliance-cli-interfaces](display-ui/accessibility-compliance-cli-interfaces.md) | 2025-09-12-174343 | display-ui | WCAG 2.1 AA compliant CLI interface design with screen reader support, keyboard navigation accessibility, and semantic markup for assistive technologies
  - use-when:
    - Building CLI applications requiring accessibility compliance (WCAG 2.1 AA)
    - Need screen reader compatibility and assistive technology support
    - Implementing interfaces for users with visual, motor, or cognitive disabilities
    - Creating enterprise applications with accessibility requirements
    - Supporting keyboard-only navigation and voice control systems
  - keywords: accessibility-compliance, wcag-2-1-aa, screen-reader-support, keyboard-navigation, assistive-technologies, semantic-markup, inclusive-design
  - prerequisites: terminal-ui-components, emoji-elimination-systematic-replacement
  - related patterns: cli-visual-design-structured-windows, progressive-enhancement-terminal-ui, emoji-elimination-systematic-replacement

- [adaptive-mcp-integration](integration/adaptive-mcp-integration.md) | 2025-09-13-103229 | integration | MCP integration with adaptive timeout handling, circuit breaker patterns, and intelligent fallback mechanisms for robust CLI validation testing
  - use-when:
    - MCP server integration needs resilient connection handling
    - Adaptive timeout strategies required for varying network conditions
    - Circuit breaker patterns needed for service reliability
    - Fallback mechanisms required when MCP services unavailable
  - keywords: mcp-integration, adaptive-timeout, circuit-breaker, fallback-strategies, connection-resilience, cli-validation
  - prerequisites: mcp-server, timeout-handling, circuit-breaker-resilience, error-recovery
  - related patterns: mcp-integration-preservation-ui-changes, circuit-breaker-resilience, error-recovery, hybrid-cli-development-testing

- [advanced-compatibility-validation](quality/advanced-compatibility-validation.md) | 2025-09-11-0000 | quality | Multi-dimensional compatibility validation system with configurable depth, interface-specific requirements, performance constraint validation, and comprehensive reporting with actionable recommendations
  - use-when:
    - Validating skin compatibility across multiple interface types (VSCode, CLI, Command)
    - Need deep structural and performance analysis beyond basic version checking
    - Preventing runtime failures in cross-platform deployments
    - Ensuring optimal user experience across different interfaces
  - keywords: validation, compatibility, interfaces, performance, structural, cross-platform, multi-dimensional, constraints
  - prerequisites: skin-versioning-system, universal-skin-engine, interface-type-system
  - related patterns: enhanced-skin-registration-validation, test-type-system-alignment, universal-interface-orchestration

- [async-utils](utilities/core/async-utils.md) | 2025-09-14T18:15:00Z | infrastructure | Centralized async utilities to eliminate 316 setTimeout/setInterval calls with automatic cleanup, retry logic, and debouncing/throttling
  - use-when:
    - Eliminating manual timeout management across components
    - Need for consistent retry logic with exponential backoff
    - Debouncing and throttling patterns required
    - Promise utilities and timeout management needed
  - keywords: async-utilities, timeout-management, retry-logic, debouncing, throttling, promise-utilities
  - prerequisites: error-handler-utility, logger-utility
  - related patterns: error-handler-utility, performance-utils-utility, resilience-utils

- [backend-integration-feature-flags](configuration/backend-integration-feature-flags.md) | 2025-09-11-1217 | configuration | Feature flag system enabling progressive enhancement with hybrid modes and automatic fallback mechanisms.
  - use-when:
    - Migrating from hardcoded backend integration to generic systems
    - Need progressive enhancement with hybrid modes
    - Requiring automatic fallback mechanisms
  - keywords: feature-flags, backend-integration, progressive-enhancement, hybrid-modes, fallback-mechanisms
  - prerequisites: backend-architecture-understanding
  - related patterns: backend-service-integration-unified, enhanced-backendconfig-schema

- [backend-service-integration-unified](integration/backend-service-integration-unified.md) | 2025-09-11-121733 | integration | Fully generic, skin-driven backend integration supporting multiple protocols with zero Templum code changes for new backends
  - use-when:
    - Integrating new backend services without code changes
    - Supporting multiple communication protocols (IPC, HTTP, WebSocket, gRPC)
    - Implementing skin-driven service discovery
    - Building protocol-agnostic connection factories
    - Creating generic command routing systems
  - keywords: backend-integration, protocol-abstraction, skin-driven, generic-factory, multi-protocol
  - prerequisites: Enhanced BackendConfig Schema, Universal Interface Orchestration, Protocol Communication Framework
  - related patterns: enhanced-backendconfig-schema, universal-interface-orchestration, ipc-protocol-communication, http-protocol-communication, websocket-protocol-communication

- [bordered-window-layout](display-ui/bordered-window-layout.md) | 2025-09-13-103229 | display-ui | Enhanced window rendering system with borders, centered titles, and consistent padding for CLI design specification compliance
  - use-when:
    - CLI interface needs bordered windows with proper visual structure
    - Terminal UI requires centered titles and consistent padding
    - Need procedural window generation from content specifications
    - Must comply with CLI design specification requirements
  - keywords: window-borders, terminal-layout, cli-design, visual-structure, procedural-rendering
  - prerequisites: terminal-ui-components, chalk-theming
  - related patterns: terminal-ui-components, cross-separator-navigation, cli-visual-design-structured-windows, progressive-enhancement-terminal-ui

- [cache-utils](utilities/system/cache-utils.md) | 2025-09-14T18:05:00Z | system | Cache utilities providing LRU + TTL storage, confidence scoring, and simple multi-level caching interfaces
  - use-when:
    - Replacing repeated in-memory cache implementations
    - Sharing TTL and eviction behaviour across modules
    - Collecting cache metrics for performance tuning
    - Providing pluggable storage layers (memory, persistent, distributed)
  - keywords: cache, ttl, lru, performance, analytics
  - prerequisites: logger, validator, configuration-utils
  - related patterns: performance-utils, resilience-utils, registry-utils

- [chainable-string-utils](utilities/data/chainable-string-utils.md) | 2025-10-02T20:23:30Z | data-management | Chainable string utility unifying truncation, padding, wrapping, and casing for CLI and renderer outputs.
  - use-when:
    - CLI or renderer code needs consistent trimming, padding, or wrapping behaviour without bespoke helpers.
    - Service or skin adapters must format text for fixed-width layouts while keeping call sites terse.
    - Validation or logging pipelines require deterministic casing or truncation before display.
  - keywords: string-utils, chainable-api, text-formatting, cli-output
  - prerequisites: logger, error-handler, terminal-formatter
  - related patterns: display-utils, validator, terminal-formatter

- [circuit-breaker-resilience](resilience/circuit-breaker-resilience.md) | 2025-09-11-0000 | resilience | Circuit breaker implementation with operation-specific tracking, Templum error integration, signal emission, and specialized factory patterns
  - use-when:
    - Critical operations need resilience against cascading failures
    - Implementing error isolation with comprehensive error recovery
    - Need operation-specific failure tracking and recovery strategies
    - Building fault-tolerant systems with automatic recovery
  - keywords: circuit-breaker, resilience, error-recovery, fault-tolerance, cascading-failures, isolation
  - prerequisites: unified-type-system, templumerror-integration
  - related patterns: error-recovery, observability-infrastructure, templum-resource-management-unified

- [cli-process-separation](architecture/cli-process-separation.md) | 2025-09-11-0000 | architecture | Architectural separation of service and CLI into independent processes with IPC-based service discovery
  - use-when:
    - Need headless service deployment without CLI interface
    - Want multi-terminal CLI access to single service instance
    - Require containerization with separate CLI access
    - Building service-oriented architecture with independent components
  - keywords: cli-separation, process-architecture, service-discovery, ipc-communication, headless-deployment, multi-terminal
  - prerequisites: service-discovery, ipc-communication, process-management
  - related patterns: service-discovery, process-management, ipc-protocol

- [cli-visual-design-structured-windows](display-ui/cli-visual-design-structured-windows.md) | 2025-09-12-174343 | display-ui | Structured window rendering system with Unicode box-drawing and ASCII fallback for clean, emoji-free CLI interfaces with proper padding and progressive enhancement
  - use-when:
    - Migrating from emoji-heavy CLI interfaces to clean structured design
    - Need terminal compatibility with Unicode fallback to ASCII borders
    - Building professional CLI interfaces requiring structured window layout
    - Implementing accessibility-compliant CLI design with screen reader support
    - Creating CLI interfaces that work across different terminal environments
  - keywords: structured-windows, border-rendering, unicode-fallback, terminal-compatibility, progressive-enhancement, emoji-elimination, accessibility-compliance
  - prerequisites: terminal-ui-components, chalk-theming
  - related patterns: emoji-elimination-systematic-replacement, progressive-enhancement-terminal-ui, accessibility-compliance-cli-interfaces, mcp-integration-preservation

- [configuration-management](configuration/configuration-management.md) | 2025-09-11-0000 | configuration | Bridge comprehensive configuration with simplified component-specific configuration interfaces
  - use-when:
    - Components need to access centralized configuration data
    - Bridging complex configuration schemas to simplified component interfaces
    - Environment-specific configuration adaptation is required
    - Eliminating hardcoded configuration values from components
  - keywords: configuration, config-management, schema-bridging, templum-config-manager, component-initialization, environment-detection
  - prerequisites: templum-config-manager
  - related patterns: component-initialization, environment-detection

- [configuration-utils](utilities/system/configuration-utils.md) | 2025-09-14T14:12:30Z | configuration | Unified configuration loading utilities covering environment parsing, schema validation, file persistence, and hot reloading
  - use-when:
    - Loading configuration from files, environment variables, or defaults
    - Validating configuration structure before bootstrapping services
    - Watching configuration for live reload or edit detection
    - Merging layered configuration sources consistently
  - keywords: configuration, environment-variables, schema-validation, file-management, hot-reload
  - prerequisites: logger, validator, path-utils
  - related patterns: validator, path-utils, registry-utils

- [core-component-unit-testing](testing/core-component-unit-testing.md) | 2025-09-11-0000 | testing | Comprehensive unit testing pattern with mock management, integration test orchestration, and real backend validation for critical components
  - use-when:
    - Testing core components in Templum with external dependencies
    - Ensuring reliability of backend integration points
    - Validating service discovery and connection factory logic
    - Implementing comprehensive test coverage for critical components
  - keywords: unit-testing, mock-management, integration-testing, backend-validation, jest, typescript, service-discovery, connection-factory
  - prerequisites: jest-framework-setup, typescript-configuration, mock-patterns
  - related patterns: integration-testing, backend-service-patterns, mock-management, test-orchestration

- [cross-separator-navigation](display-ui/cross-separator-navigation.md) | 2025-09-13-103229 | display-ui | Enhanced menu navigation system with proper separator handling, exit behavior, and keyboard responsiveness for CLI interfaces
  - use-when:
    - Interactive menus need navigation across separator sections
    - Exit functionality requires double confirmation patterns
    - Keyboard input handling needs raw mode control
    - Menu systems require proper state management
  - keywords: menu-navigation, separator-handling, exit-behavior, keyboard-input, raw-mode, confirmation-dialogs
  - prerequisites: bordered-window-layout, terminal-ui-components, readline interface
  - related patterns: bordered-window-layout, enhanced-menu-integration, terminal-ui-components, confirmation-exit-pattern

- [debug-utils](utilities/dev/debug-utils.md) | 2025-09-15T00:00:00Z | development-tools | Chainable development toolkit for logging, inspection, and profiling with confidence gating.
  - use-when:
    - Deploying temporary or diagnostic instrumentation that must respect production safety boundaries.
    - Profiling backend adapters, CLI flows, or test harnesses without scattering ad-hoc console statements.
  - keywords: debug-toolkit, profiling, state-inspection
  - prerequisites: logger, error-handler
  - related patterns: async-utils, logger, test-utils

- [dependency-injection-unified](architecture/dependency-injection-unified.md) | 2025-09-11-0000 | architecture | Complete 4-phase dependency injection system with enhanced adapters, systematic initialization, and validation
  - use-when:
    - Component lifecycle management across interface adapters needed
    - Dependency coordination between core services required
    - Enhanced adapter functionality with validation required
    - Systematic initialization order must be enforced
  - keywords: dependency-injection, adapter-pattern, initialization, lifecycle-management, validation
  - prerequisites: abstraction-layer-architecture, universal-interface-orchestration
  - related patterns: enhanced-adapter-pattern, 4-phase-initialization, graceful-disposal-pattern

- [display-utils](utilities/display/display-utils.md) | 2025-09-14T18:20:00Z | display-ui | Centralized display utilities to consolidate scattered UI calculations, display standards, and service ordering patterns across interface components
  - use-when:
    - Consolidating display consistency calculations scattered across CLI components
    - Need for unified service ordering and display standards
    - Terminal width calculations and layout constraints required
    - Consistent UI element sizing and positioning needed
  - keywords: display-utilities, ui-consistency, service-ordering, layout-calculations, terminal-standards
  - prerequisites: logger, terminal-formatter
  - related patterns: window-utils, terminal-formatter, terminal-ui-components

- [dynamic-command-router-integration](integration/dynamic-command-router-integration.md) | 2025-09-11-121733 | integration | Menu and registry systems need to integrate with DynamicCommandRouter for skin-driven command routing while maintaining backward compatibility with legacy hardcoded patterns
  - use-when:
    - Menu and registry systems need to integrate with DynamicCommandRouter
    - Skin-driven command routing while maintaining backward compatibility
    - Legacy hardcoded patterns must be preserved
  - keywords: dynamic-command-router, menu-integration, registry-systems, backward-compatibility, skin-driven
  - prerequisites: dynamic-command-router-understanding, feature-flag-configuration
  - related patterns: dynamic-command-routing, universal-command-registry, backend-service-integration-unified

- [dynamic-command-routing](routing/dynamic-command-routing.md) | 2025-09-11-0000 | routing | Dynamic command routing system that eliminates hardcoded patterns by building routing tables from skin definitions at runtime
  - use-when:
    - Implementing generic backend integration without hardcoded routing
    - Adding new backends that need command routing capabilities
    - Building systems that route commands based on skin definitions
    - Creating flexible command-to-backend mapping systems
  - keywords: dynamic-routing, command-mapping, backend-integration, skin-definitions, runtime-configuration, generic-routing
  - prerequisites: backend-service-integration, universal-interface-orchestration, unified-type-system
  - related patterns: backend-service-integration, universal-interface-orchestration, session-management

- [dynamic-local-command-detection](routing/dynamic-local-command-detection.md) | 2025-09-13-103229 | routing | Dynamic command routing system that replaces hardcoded command detection with skin-definition based routing for flexible CLI command resolution
  - use-when:
    - CLI command detection needs to be dynamic rather than hardcoded
    - Skin definitions should drive command routing decisions
    - Backward compatibility required during routing system migration
    - Performance benchmarks needed for routing accuracy
  - keywords: dynamic-routing, command-detection, skin-definition-driven, routing-accuracy, backward-compatibility
  - prerequisites: dynamic-command-router, universal-skin-engine, service-discovery
  - related patterns: dynamic-routing-initialization, universal-skin-engine, service-discovery, backend-service-integration-unified

- [dynamic-routing-initialization](initialization/dynamic-routing-initialization.md) | 2025-09-13-103229 | initialization | Lazy initialization system for dynamic routing components with error handling, performance optimization, and graceful degradation patterns
  - use-when:
    - Dynamic routing system needs efficient startup initialization
    - Lazy loading preferred over eager initialization for performance
    - Error handling required for routing system failures
    - Graceful degradation needed when dynamic routing unavailable
  - keywords: lazy-initialization, routing-startup, error-handling, performance-optimization, graceful-degradation
  - prerequisites: dynamic-command-router, service-discovery, error-recovery
  - related patterns: dynamic-local-command-detection, dynamic-command-router-integration, error-recovery, service-discovery

- [efficient-fallback](resilience/efficient-fallback.md) | 2025-09-11-0000 | resilience | Graceful null-check patterns and efficient fallback mechanisms that eliminate exceptions for expected behavior
  - use-when:
    - Exception-based control flow for expected fallback behavior causes performance degradation
    - Unclear code flow from exception handling for routine missing functionality
    - Need to eliminate exception overhead for expected missing features
    - Want graceful degradation instead of error-based fallback patterns
  - keywords: fallback, null-check, performance, graceful-degradation, exception-handling, error-reduction
  - prerequisites: exception-handling-patterns
  - related patterns: backend-service-integration, error-handling-patterns

- [emoji-elimination-systematic-replacement](display-ui/emoji-elimination-systematic-replacement.md) | 2025-09-12-174343 | display-ui | Comprehensive emoji removal and replacement system with 47+ mapped emojis, text equivalents, and batch processing for clean CLI interface design
  - use-when:
    - Converting emoji-heavy interfaces to professional text-based design
    - Need systematic emoji replacement across multiple files and components
    - Building accessibility-compliant interfaces requiring text equivalents
    - Implementing clean design standards that eliminate emoji dependencies
    - Processing large codebases for emoji consistency cleanup
  - keywords: emoji-elimination, systematic-replacement, text-equivalents, batch-processing, accessibility-compliance, clean-design, unicode-cleanup
  - prerequisites: —
  - related patterns: cli-visual-design-structured-windows, accessibility-compliance-cli-interfaces, progressive-enhancement-terminal-ui

- [end-to-end-testing-scenarios](testing-integration/end-to-end-testing-scenarios.md) | 2025-09-11-0000 | testing-integration | Comprehensive E2E testing framework with flexible scenario execution, realistic backend service mocking, performance monitoring, and systematic validation of complete user journeys across multiple interface types
  - use-when:
    - Validating complete user workflows across multiple system components
    - Testing cross-interface coordination and state synchronization
    - Establishing performance baselines and regression detection
    - Validating system behavior under realistic usage scenarios
  - keywords: e2e-testing, integration-testing, performance-monitoring, workflow-validation, cross-interface-testing, mock-services, jest-framework
  - prerequisites: mock-backend-services, jest-testing-framework, interface-adapter-patterns
  - related patterns: mock-to-real-transition, interface-adapter-integration-testing, test-infrastructure

- [enhanced-backendconfig-schema](configuration/enhanced-backendconfig-schema.md) | 2025-09-11-0000 | configuration | Enhanced BackendConfig interface with comprehensive connection specification and backward compatibility
  - use-when:
    - Generic backend integration requires multiple protocol support
    - Need authentication and service discovery configuration
    - Transitioning from hardcoded to generic backend configurations
    - Implementing protocol-specific connection options
  - keywords: backend-config, connection-schema, protocol-support, authentication, service-discovery, backward-compatibility
  - prerequisites: universal-skin-engine-types, typescript-interfaces
  - related patterns: generic-connection-factory, backend-integration-config, universal-skin-definition

- [enhanced-menu-integration](integration/enhanced-menu-integration.md) | 2025-09-13-103229 | integration | Hybrid integration pattern for combining new CLI design systems with existing menu infrastructure while maintaining backward compatibility
  - use-when:
    - Need to integrate new CLI design with existing menu systems
    - Require backward compatibility during UI transitions
    - Performance optimization needed for menu loading operations
    - Want pattern-based UX improvements without breaking existing functionality
  - keywords: menu-integration, backward-compatibility, hybrid-architecture, performance-optimization, progressive-enhancement
  - prerequisites: bordered-window-layout, cross-separator-navigation, terminal-ui-components
  - related patterns: bordered-window-layout, cross-separator-navigation, progressive-enhancement-terminal-ui, terminal-ui-components

- [enhanced-skin-registration-validation](quality/enhanced-skin-registration-validation.md) | 2025-09-11-0000 | quality | Comprehensive validation pipeline for Universal Skin Engine registration with version compatibility checks and conflict detection
  - use-when:
    - Universal Skin Engine needs validation for skin registration
    - Version compatibility checking is required for skin registration
    - Conflict detection and resolution needed for skin versions
    - Comprehensive error handling required for skin registration failures
  - keywords: skin-registration, validation, version-management, conflict-detection, error-handling, universal-skin-engine
  - prerequisites: skin-version-manager, templum-error-system, existing-validation-infrastructure
  - related patterns: skin-version-management, error-handling-patterns, validation-pipeline

- [enhanced-validation-testing](testing/enhanced-validation-testing.md) | 2025-09-11-0000 | testing | Comprehensive test coverage for autonomous validation script extension generation with production safety requirements
  - use-when:
    - Autonomous validation system implementations requiring comprehensive safety validation
    - Extension generation systems with production deployment requirements
    - Agent integration scenarios requiring validation function extraction
    - Systems requiring comprehensive audit trails and regulatory compliance
    - High-risk autonomous operations requiring rollback and recovery mechanisms
  - keywords: validation-testing, autonomous-systems, safety-framework, agent-integration, rollback-recovery, audit-trail, production-readiness, quality-gates
  - prerequisites: state-management-library, validation-framework, audit-logging-system
  - related patterns: validation-framework, safety-mechanisms, agent-integration, audit-trail-management

- [error-handler](utilities/core/error-handler.md) | 2025-09-14T18:10:00Z | infrastructure | Centralized error handling to standardize 695 catch blocks with consistent error wrapping, recovery strategies, and minimal usage footprint
  - use-when:
    - Standardizing scattered try/catch blocks across components
    - Need for consistent error wrapping and recovery patterns
    - Timeout and retry error handling required
    - Centralized error logging and context management needed
  - keywords: error-handling, catch-block-consolidation, error-recovery, timeout-management, structured-errors
  - prerequisites: logger-utility
  - related patterns: async-utils, logger-utility, resilience-utils

- [error-recovery](resilience/error-recovery.md) | 2025-09-11-0000 | resilience | Implement structured fallback rendering system that maintains system availability during component failures
  - use-when:
    - System components fail completely when primary integration methods encounter errors
    - Users receive empty failure responses instead of graceful degradation
    - Application needs to maintain availability during partial component failures
    - Integration failures should trigger alternative code paths for basic functionality
    - Cross-process communication requires fault-tolerant fallback mechanisms
  - keywords: error-recovery, fallback-rendering, graceful-degradation, system-availability, fault-tolerance, integration-failure, circuit-breaker, resilience
  - prerequisites: circuit-breaker-resilience, templumerror-integration
  - related patterns: circuit-breaker-resilience, performance-monitoring, structured-error-handling

- [event-utils](utilities/core/event-utils.md) | 2025-09-14T21:30:00Z | infrastructure | Centralized event utilities to eliminate 528 EventEmitter uses with typed event management, automatic cleanup, and minimal-footprint API design
  - use-when:
    - Eliminating scattered EventEmitter instantiation across components
    - Need for consistent typed event management
    - Automatic subscription cleanup and memory leak prevention
    - Centralized event bus and publish/subscribe patterns
  - keywords: event-utilities, typed-events, event-emitter-consolidation, subscription-management, automatic-cleanup, event-bus
  - prerequisites: error-handler, logger
  - related patterns: async-utils, logger, error-handler, observer-pattern-utilities

- [factory-registry-with-context-management](architecture/factory-registry-with-context-management.md) | 2025-09-11-0000 | architecture | Factory registration systems with context-dependent dependencies, error boundaries and graceful degradation
  - use-when:
    - Need factory registration with context dependencies
    - Implementing VSCode extension context management
    - Requiring error boundaries with graceful degradation
  - keywords: factory-pattern, registry, context-management, error-boundaries, vscode-extension, dependency-injection
  - prerequisites: dependency-injection-pattern, vscode-extension-context
  - related patterns: dependency-injection, unified-type-system

- [factory-utils](utilities/core/factory-utils.md) | 2025-09-14T19:10:00Z | infrastructure | Shared factory orchestration utilities that standardize creation pipelines across connection, adapter, and session components.
  - use-when:
    - Consolidating duplicated switch-based factory logic across backend connectors and adapters.
    - Replacing ad-hoc factory error handling with centralized, contextual responses.
    - Providing chainable factory registration for modules that load strategies dynamically.
  - keywords: factory-utils, factory-registry, strategy-orchestration
  - prerequisites: logger, error-handler, registry-utils
  - related patterns: async-utils, resilience-utils, registry-utils

- [file-based-handoff-infrastructure](infrastructure/file-based-handoff-infrastructure.md) | 2025-09-11-0000 | infrastructure | Structured file-based communication system with JSON schemas, automated cleanup, and comprehensive error handling
  - use-when:
    - Subagent workflow implementations requiring context isolation
    - Multi-phase operations where agents need to pass structured data
    - Cross-project agent reusability with standardized communication protocols
    - Long-running workflows that need audit trails and recovery capabilities
  - keywords: agent-communication, context-isolation, handoff, json-schemas, file-system, workflow, audit-trail
  - prerequisites: node-js-environment, typescript-interfaces, json-schema-validation
  - related patterns: sequential-workflow-integration, error-recovery-pattern, configuration-management

- [generic-agent-template](development-tools/generic-agent-template.md) | 2025-09-11-0000 | development-tools | Project-agnostic Analysis Agents with context isolation and file-based handoff communication
  - use-when:
    - Need context isolation during research phases
    - Require cross-project agent reusability
    - Want to reduce main agent context by 70%+
    - Building subagent workflow infrastructure
  - keywords: agent-template, context-isolation, handoff-protocol, cross-project, research-automation
  - prerequisites: file-manager-pattern, error-handling-pattern
  - related patterns: subagent-workflow, file-based-handoff, research-agent-pattern

- [http-protocol-communication](integration/http-protocol-communication.md) | 2025-09-11-0000 | integration | Real HTTP implementation with PCL service-specific API integration, enhanced headers and request options, and comprehensive error handling
  - use-when:
    - PCL backend service requires HTTP communication with service-specific endpoint mapping
    - Enhanced request/response handling is needed for backend services
    - Service-specific API integration with proper error handling is required
    - HTTP communication with timeout and retry logic is needed
  - keywords: http, pcl-integration, backend-communication, api-endpoints, error-handling, timeout-handling, service-mapping
  - prerequisites: backend-service-integration, http-client-libraries
  - related patterns: backend-service-integration, error-recovery, service-discovery

- [hybrid-cli-development-testing](testing-integration/hybrid-cli-development-testing.md) | 2025-09-12-113834 | testing-integration | 5-phase synthesis approach for CLI development with agent interaction capabilities, multi-category validation, and context preservation
  - use-when:
    - Developing CLI interfaces requiring agent interaction capabilities
    - Need rapid end-to-end development with comprehensive validation
    - Building MCP channel or agent-CLI integration systems
    - Require context preservation across development phases
  - keywords: hybrid-synthesis, cli-development, agent-interaction, multi-category-validation, context-preservation
  - prerequisites: mcp-pty-integration, validation-infrastructure, testing-frameworks
  - related patterns: agent-cli-interaction-validation, mcp-pty-integration, enhanced-validation-testing

- [integration-test-framework-transition](testing-integration/integration-test-framework-transition.md) | 2025-09-11-0000 | testing-integration | Transition from private property mocking to public API testing with real component validation
  - use-when:
    - Integration tests written for mock-based architecture need to validate real implementation behavior
    - Private property access in tests causes compilation errors
    - Test suite provides false confidence due to mock-dependent testing
    - Real integration issues are hidden by mock responses
  - keywords: integration-testing, jest, public-api, mock-elimination, real-behavior-validation
  - prerequisites: jest-testing-framework, typescript-compilation-understanding
  - related patterns: api-validation-pattern, component-integration-testing

- [interface-adapter-integration-testing](testing-integration/interface-adapter-integration-testing.md) | 2025-09-11-0000 | testing-integration | Comprehensive integration testing framework with MockTemplumOrchestrator implementation for systematic validation of interface adapter scenarios
  - use-when:
    - Interface adapters lack comprehensive integration tests
    - Need to validate orchestrator integration patterns
    - Requiring cross-interface coordination testing
    - Testing dependency injection patterns
    - Validating real backend service integration capabilities
  - keywords: interface-adapters, integration-testing, orchestrator, testing-framework, mock-implementation, cross-interface, state-synchronization
  - prerequisites: jest-testing-framework, templum-orchestrator-interface, interface-adapter-implementations
  - related patterns: state-synchronization-testing, adapter-compliance-validation, orchestrator-integration

- [ipc-protocol-communication](integration/ipc-protocol-communication.md) | 2025-09-11-0000 | integration | Real IPC implementation with service-specific enhancements and real-time message handling
  - use-when:
    - Backend service requires IPC communication
    - Service-specific API integration needed
    - Real-time message handling required
    - Cross-process communication necessary
  - keywords: ipc, inter-process-communication, backend-service, haruspex, childprocess, real-time-messaging
  - prerequisites: backend-service-integration, nodejs-childprocess
  - related patterns: backend-service-discovery, error-recovery-patterns

- [library-module-interop-resolution](development-tools/library-module-iterop-resolution.md) | 2025-09-11-0000 | development-tools | Systematic resolution of ESModule interop conflicts in TypeScript library imports
  - use-when:
    - TypeScript compilation fails with TS1259 ESModuleInterop errors
    - Third-party library imports cause compilation conflicts
    - Build pipeline blocked by library compatibility issues
    - Testing workflows fail due to import resolution problems
  - keywords: typescript, esmodule, interop, compilation, library-integration, zod, configuration
  - prerequisites: typescript-configuration, package-management
  - related patterns: dependency-resolution, build-optimization, typescript-configuration

- [logger](utilities/core/logger.md) | 2025-09-14T18:05:00Z | infrastructure | Centralized logging infrastructure to eliminate 2,810 console.log/warn/error calls across 75+ files with structured, contextual logging
  - use-when:
    - Eliminating scattered console logging across components
    - Need for structured logging with context management
    - Consistent log format and level management required
    - Performance tracking and debug capabilities needed
  - keywords: logging, console-consolidation, structured-logging, context-management, performance-tracking
  - prerequisites: —
  - related patterns: error-handler, debug-utils, performance-utils

- [mcp-integration-preservation-ui-changes](integration/mcp-integration-preservation-ui-changes.md) | 2025-09-12-174343 | integration | Maintain MCP Channel compatibility and agent-CLI interaction capabilities during major UI transformations while preserving backward compatibility and command mapping
  - use-when:
    - Performing major CLI interface redesigns while maintaining agent compatibility
    - Updating UI frameworks that could break existing MCP tool integrations
    - Need to preserve agent-CLI interaction patterns during visual transformation
    - Ensuring backward compatibility for automated agent workflows during UI changes
    - Implementing progressive UI enhancements without disrupting MCP channels
  - keywords: mcp-preservation, agent-cli-compatibility, backward-compatibility, ui-transformation, command-mapping, session-management, mcp-bridge
  - prerequisites: mcp-pty-integration, agent-cli-interaction-validation, session-management-unified
  - related patterns: cli-visual-design-structured-windows, progressive-enhancement-terminal-ui, hybrid-cli-development-testing

- [mcp-pty-integration](integration/mcp-pty-integration.md) | 2025-09-11-0000 | integration | Mock-ready PTY foundation with comprehensive session lifecycle management for agent-CLI interaction
  - use-when:
    - Need agent-CLI interaction through pseudoterminal sessions
    - Building MCP server frameworks for terminal automation
    - Implementing cross-platform terminal integration
    - Developing mock-first architecture for external dependencies
  - keywords: mcp, pty, terminal, session-management, cross-platform, mock-development
  - prerequisites: typescript-configuration, testing-infrastructure
  - related patterns: mcp-server-framework, error-handling-foundation, resource-cleanup-pattern

- [minimal-compilation-stabilization-pattern](development-tools/minimal-compilation-stabilization-pattern.md) | 2025-09-11-0000 | development-tools | Focused stabilization approach addressing dependency installation and test file fixes while documenting interface issues for systematic resolution
  - use-when:
    - Development workflow blocked by compilation failures from missing dependencies
    - Test file type errors preventing any progress
    - Need to unblock development while preserving scope discipline
    - TypeScript compilation errors need rapid triage and focused fixing
  - keywords: compilation, stabilization, dependencies, typescript, test-fixes, scope-discipline, error-reduction
  - prerequisites: typescript-project-setup, package-json-configuration, typescript-error-categories
  - related patterns: test-type-system-alignment-pattern, comprehensive-backend-validation-pattern, null-safety-completion-pattern

- [mock-real-api-alignment](integration/mock-real-api-alignment.md) | 2025-09-11-0000 | integration | Unifies mock interfaces with real implementation APIs to prevent compilation errors and integration failures
  - use-when:
    - Mock interfaces and real implementation APIs become misaligned over time
    - TypeScript compilation errors from interface conflicts (100+ errors)
    - Test infrastructure failures due to API mismatches
    - Integration failures blocking development
    - Need to maintain backward compatibility while aligning APIs
  - keywords: api-alignment, typescript-interfaces, mocks, testing, compilation-errors, interface-conflicts
  - prerequisites: real-component-api-analysis
  - related patterns: type-system-foundation, test-infrastructure-patterns

- [mock-real-api-contract-testing](testing-integration/mock-real-api-contract-testing.md) | 2025-09-11-0000 | testing-integration | Contract testing to ensure mock/real API consistency with automated validation
  - use-when:
    - Mock interfaces diverge from real implementations
    - Test expectations fail due to API inconsistencies
    - Need automated validation of mock behavior
  - keywords: contract-testing, mock-validation, api-consistency, test-infrastructure, automated-testing
  - prerequisites: real-component-api-analysis
  - related patterns: test-infrastructure-repair, api-signature-matching

- [multi-strategy-service-discovery](infrastructure/multi-strategy-service-discovery.md) | 2025-09-11-0000 | infrastructure | Intelligent multi-strategy discovery system that automatically finds backend services using registry-based, configuration-based, and endpoint scanning strategies with graceful fallback
  - use-when:
    - Need to eliminate hardcoded backend service endpoints
    - Require dynamic service discovery across multiple protocols
    - Want graceful fallback for service discovery failures
    - Building flexible backend integration architecture
  - keywords: service-discovery, backend-integration, multi-strategy, dynamic-configuration, endpoint-scanning, registry-based
  - prerequisites: generic-connection-factory, dynamic-command-routing
  - related patterns: backend-service-router, universal-skin-engine, connection-factory

- [navigation-utils](utilities/core/navigation-utils-utility.md) | 2025-10-01T11:18:59Z | business-logic | Unified navigation utilities providing path validation, breadcrumb optimisation, and confidence-scored navigation state management.
  - use-when:
    - Centralising breadcrumb or navigation state handling across adapters or surfaces
    - Validating and sanitising navigation paths before routing them to content handlers
    - Computing navigation confidence scores across modules without duplicating heuristics
    - Providing a minimal API for go/back/home/exit flows that keeps history in sync
  - keywords: navigation-utils, breadcrumb-optimization, confidence-scoring, routing-flows, state-management
  - prerequisites: logger, validator, display-utils
  - related patterns: dynamic-command-router, content-driven-navigation, terminal-ui-components

- [node.js-type-system-alignment](development-tools/node.js-type-system-alignment.md) | 2025-09-11-0000 | development-tools | Proper import syntax, variable naming conventions, and Node.js type system integration
  - use-when:
    - WebSocket constructors require correct import syntax
    - Variable scoping conflicts with Node.js globals
    - TypeScript compilation errors specific to Node.js type definitions
    - Constructor functions not accessible after import
  - keywords: nodejs, typescript, websocket, imports, scoping, constructors, type-system
  - prerequisites: —
  - related patterns: typescript-compilation-fixes, import-standardization

- [observability-infrastructure](operations/observability-infrastructure.md) | 2025-09-11-0000 | operations | Complete observability infrastructure with centralized logging, metrics collection, alerting, and integration with existing dependency injection system
  - use-when:
    - Scattered console.log statements throughout codebase need centralization
    - Enterprise-grade monitoring and alerting is required
    - Structured logging and metrics collection is needed
    - Performance monitoring and debugging capabilities must be enhanced
  - keywords: observability, logging, metrics, monitoring, alerting, structured-logging, performance, debugging
  - prerequisites: dependency-injection-system, abstraction-layer-architecture
  - related patterns: backend-service-integration, dependency-injection-system, abstraction-layer-architecture

- [path-utils](utilities/system/path-utils.md) | 2025-10-01T11:03:35Z | system | Sandboxed path orchestration with confidence scoring for cross-platform file operations.
  - use-when:
    - Handling filesystem paths that must remain inside a guarded workspace or sandbox root.
    - Consolidating duplicated filesystem access across discovery, configuration, or session managers.
    - Reading or writing JSON assets while preserving consistent logging and fallback semantics.
  - keywords: safe-paths, sandbox-io, confidence-scoring, cross-platform
  - prerequisites: logger, error-handler, async-utils
  - related patterns: configuration-utils, registry-utils, resilience-utils

- [pcl-component-integration-unified](integration/pcl-component-integration-unified.md) | 2025-08-27-0000 | integration | Complete real PCL component integration with performance measurement, method validation, and comprehensive health analysis
  - use-when:
    - Need to integrate real PCL components instead of simulated validation
    - Require actual performance measurement of component response times
    - Component method validation and testing is needed
    - Comprehensive system health analysis is required
  - keywords: pcl, component, integration, performance, validation, health-analysis, real-components, measurement
  - prerequisites: mock-to-real-transition, universal-interface-orchestration
  - related patterns: mock-to-real-transition, backend-service-integration, unified-type-system

- [pcl-enhanced-rendering](display-ui/pcl-enhanced-rendering.md) | 2025-09-11-0000 | display-ui | Enhanced rendering pipeline with type-specific styling, content enhancement, and theme integration for PCL components
  - use-when:
    - PCL rendering adapters need sophisticated component styling with theme awareness
    - Type-specific visual enhancements are required for consistent user experience
    - Theme-aware styling and visual cues need to be applied to UniversalMenuItem components
  - keywords: pcl-rendering, theme-adapter, component-styling, universal-menu-item, type-specific-styling, visual-enhancement
  - prerequisites: pcl-theme-adapter, universal-menu-item-interface
  - related patterns: pcl-theme-adapter-pattern, universal-layout-engine-pattern, responsive-design-pattern

- [pcl-rendering-integration-bridge-pattern](display-ui/pcl-rendering-integration-bridge.md) | 2025-09-11-0000 | display-ui | Comprehensive PCL Rendering Adapter that bridges Universal Skin Engine with Phoenix Code Lite's proven rendering patterns
  - use-when:
    - Universal Skin Engine needs sophisticated rendering capabilities
    - Code reuse opportunities exist between Universal and PCL systems
    - Consistent UI quality across interface types is required
    - PCL rendering patterns need to be integrated while maintaining architectural boundaries
  - keywords: rendering, pcl-integration, universal-skin-engine, bridge-pattern, theme-mapping, layout-engine
  - prerequisites: universal-interface-orchestration, pcl-component-integration
  - related patterns: universal-interface-orchestration, backend-service-integration, session-management

- [performance-utils](utilities/system/performance-utils.md) | 2025-09-30T12:00:00Z | system | Unified performance timing and metric helpers with minimal-footprint timers and fluent telemetry hooks.
  - use-when:
    - Consolidating repeated performance timers and telemetry emitters into a single fluent utility.
    - Instrumenting latency and throughput without scattering performance.now() bookkeeping.
    - Emitting consistent performance metrics across backends, CLI flows, and real-time monitors.
  - keywords: performance, timing, metrics, telemetry
  - prerequisites: logger, async-utils, resilience-utils
  - related patterns: cache-utils, registry-utils, resilience-utils

- [production-readiness-validation](quality/production-readiness-validation.md) | 2025-09-11-0000 | quality | Comprehensive validation for production deployment requirements using real system metrics
  - use-when:
    - System needs comprehensive production deployment validation
    - Real system metrics are required instead of hardcoded values
    - Production readiness assessment across performance, resource, error, and health dimensions
    - Evidence-based production deployment decisions are needed
  - keywords: production-readiness, system-validation, real-metrics, deployment-assessment, performance-validation, resource-management, error-handling, system-health
  - prerequisites: templum-resource-management, performance-validation, error-recovery
  - related patterns: real-system-metrics-collection, comprehensive-validation-framework, cli-integration

- [progressive-enhancement-terminal-ui](display-ui/progressive-enhancement-terminal-ui.md) | 2025-09-12-174343 | display-ui | Environment capability detection with multi-layer fallback strategies and adaptive UI enhancement selection for optimal terminal experience across all platforms
  - use-when:
    - Building CLI interfaces that must work across diverse terminal environments
    - Need optimal visual experience while maintaining universal compatibility
    - Implementing features that depend on terminal capabilities (Unicode, colors, dimensions)
    - Creating professional interfaces that degrade gracefully on limited terminals
    - Supporting both modern and legacy terminal environments
  - keywords: progressive-enhancement, terminal-compatibility, capability-detection, adaptive-ui, fallback-strategies, environment-detection, graceful-degradation
  - prerequisites: terminal-ui-components, chalk-theming
  - related patterns: cli-visual-design-structured-windows, emoji-elimination-systematic-replacement, accessibility-compliance-cli-interfaces

- [protocol-communication-overview](integration/protocol-communication-overview.md) | 2025-09-11-0000 | integration | Complete real protocol communication implemented through three specialized patterns for different backend services
  - use-when:
    - Need to replace mock protocol implementations with real backend service integration
    - Implementing specialized communication patterns for IPC, HTTP, and WebSocket protocols
    - Coordinating multi-protocol backend service communication with fallback mechanisms
  - keywords: protocol, communication, backend-integration, ipc, http, websocket, service-integration
  - prerequisites: backend-service-integration, generic-connection-factory
  - related patterns: ipc-protocol-communication-pattern, http-protocol-communication-pattern, websocket-protocol-communication-pattern

- [protocol-utils](utilities/core/protocol-utils.md) | 2025-09-14T21:31:45Z | infrastructure | Unified protocol utilities for IPC/HTTP/WebSocket connection management optimization with confidence-validated message processing and shared protocol abstractions
  - use-when:
    - Multiple protocol implementations with duplicated connection logic
    - Need for unified protocol abstraction across IPC/HTTP/WebSocket
    - Connection pooling and lifecycle management optimization required
    - Message validation and confidence scoring for protocol communication
    - Protocol health monitoring and diagnostics needed
    - Configuration management for multiple protocol types
  - keywords: protocol-utilities, connection-management, message-validation, confidence-scoring, protocol-optimization, health-monitoring
  - prerequisites: error-handler, logger, event-utils, async-utils
  - related patterns: circuit-breaker-resilience, backend-service-integration, observability-infrastructure, configuration-management

- [real-implementation-integration](integration/real-implementation-integration.md) | 2025-09-11-0000 | integration | Systematic connection to existing real implementations with proper error handling and fallback coordination
  - use-when:
    - Hardcoded placeholder implementations exist when real implementations are available
    - Need to eliminate unnecessary duplication and improve functionality
    - Connecting to existing Universal Skin Engine or similar real components
    - Replacing mock implementations with production-ready alternatives
  - keywords: implementation-integration, placeholder-replacement, universal-skin-engine, error-handling, fallback-coordination, real-implementations
  - prerequisites: universal-skin-engine, error-handling-patterns, component-architecture
  - related patterns: error-handling-with-fallbacks, component-integration, universal-rendering

- [registry-utils](utilities/registry-utils.md) | 2025-09-15T12:00:00Z | infrastructure | Confidence-validated registry foundation replacing bespoke lifecycle, validation, and duplicate detection logic scattered across interface and command registries
  - use-when:
    - You need to register and lazily resolve components while enforcing consistent lifecycle hooks
    - Duplicate registry code exists across command, menu, adapter, or service registries
    - Validation, duplicate detection, and health insights must be standardized without bespoke wiring
  - keywords: registry-utils, lifecycle-management, dependency-injection, confidence-scoring
  - prerequisites: logger, error-handler, async-utils
  - related patterns: factory-utils, service-utils, dependency-injection-unified

- [resilience-utils-consolidation-pattern](utilities/resilience-utils.md) | 2025-09-15T00:00:00Z | resilience | Unified resilience utilities consolidating fallback strategies, performance monitoring, and rollback decision logic into a single chainable API for consistent system resilience
  - use-when:
    - Need unified resilience patterns across components
    - Consolidating scattered fallback and monitoring logic
    - Implementing automated rollback decision systems
    - Reducing complexity in risk management components
  - keywords: resilience-utilities, fallback-strategies, performance-monitoring, rollback-automation, risk-mitigation, system-recovery
  - prerequisites: error-handler-utility, logger-utility, async-utils
  - related patterns: circuit-breaker-resilience, error-recovery, performance-utils-utility, observability-infrastructure

- [serialization-utils](utilities/data/serialization-utils.md) | 2025-10-01T11:09:36Z | data-management | Fluent JSON serialization helpers with schema-aware parsing, confidence defaults, and fallback recovery for multi-protocol payloads
  - use-when:
    - Handling backend payloads that move between IPC, HTTP, and WebSocket adapters.
    - Persisting or reloading configuration files that must obey shared schemas.
    - Shipping skin definitions or interface state snapshots between runtimes.
  - keywords: serialization, json-safety, schema-validation, fallback-orchestration
  - prerequisites: logger, error-handler, validator, type-guards
  - related patterns: configuration-utils, resilience-utils, backend-service-integration-unified, error-handler

- [service-utils](utilities/core/service-utils.md) | 2025-10-05T15:30:00Z | business-logic | Single-call toolkit that normalises, ranks, and summarises services for ordering, health insights, and dependency resolution.
  - use-when:
    - Service ordering, health monitoring, and backend dependency flows drift because each subsystem scores services differently.
    - You need a one-line way to turn heterogeneous service descriptors into ordered lists plus confidence-aware summaries.
    - Migration work should eliminate duplicated sorting and health aggregation code across interface and backend layers.
  - keywords: service-utils, service-ordering, health-summary, dependency-resolution
  - prerequisites: logger, error-handler, async-utils
  - related patterns: multi-strategy-service-discovery, protocol-utils, registry-utils

- [session-management-unified](architecture/session-management-unified.md) | 2025-08-29-0000 | architecture | Enterprise-grade session state management with comprehensive error recovery and cross-interface coordination
  - use-when:
    - Need to coordinate session state across multiple interfaces (CLI, VSCode, web)
    - Implementing interface switching while preserving session context
    - Building enterprise-grade session recovery mechanisms
    - Managing multi-backend session state synchronization
    - Tracking session lifecycle and completion status
  - keywords: session-management, interface-coordination, state-preservation, error-recovery, multi-backend, session-lifecycle
  - prerequisites: universal-interface-orchestration, abstraction-layer-architecture
  - related patterns: universal-interface-orchestration, backend-service-integration-unified, dependency-injection-unified, circuit-breaker-resilience

- [skin-versioning-system](configuration/skin-versioning-system.md) | 2025-09-11-0000 | configuration | Comprehensive semantic versioning system with multi-version storage, conflict resolution, compatibility validation, and automated migration framework
  - use-when:
    - Universal Skin Engine lacks version management capabilities
    - Need to handle multiple skin versions with conflict detection
    - Require compatibility validation and migration strategies
    - Need version-aware caching and storage management
  - keywords: versioning, semantic-versioning, skin-management, conflict-resolution, migration, compatibility, caching
  - prerequisites: universal-skin-engine, unified-type-system, templum-error-integration
  - related patterns: universal-skin-engine-pattern, unified-type-system-pattern, templum-error-integration-pattern

- [templum-resource-management-unified](infrastructure/templum-resource-management-unified.md) | 2025-09-11-0000 | infrastructure | Enterprise-grade resource management system with allocation tracking, policy enforcement, service health monitoring, and automated cleanup
  - use-when:
    - System resource leaks need to be prevented
    - Unmanaged connections causing memory exhaustion
    - Resource monitoring and policy enforcement required
    - Investigation tasks blocked by resource issues
    - Automated cleanup and lifecycle management needed
  - keywords: resource-management, memory-allocation, connection-pooling, policy-enforcement, service-health, automated-cleanup, resource-tracking, performance-monitoring
  - prerequisites: templum-core-architecture, dependency-injection-patterns
  - related patterns: dependency-injection-unified-pattern, universal-interface-orchestration-pattern, backend-service-integration-unified-pattern

- [templumerror-integration](resilience/templumerror-integration.md) | 2025-09-11-0000 | resilience | Standardized error handling pattern with typed error interfaces, utility functions, and consistent error categorization
  - use-when:
    - Components need consistent error handling approaches
    - Debugging requires proper error monitoring and categorization
    - System needs comprehensive error management and recovery
    - Error handling patterns need to be standardized across components
  - keywords: error-handling, typescript, error-interfaces, error-categorization, monitoring, debugging, type-safety, signal-system
  - prerequisites: typescript-fundamentals, error-handling-basics, logging-systems
  - related patterns: signal-system-integration, component-error-boundaries, monitoring-integration

- [terminal-formatter](utilities/display/terminal-formatter.md) | 2025-10-02T16:26:03Z | display-ui | Semantic formatter consolidating chalk usage into a capability-aware, cache-backed API for terminal output consistency
  - use-when:
    - Consolidating duplicated chalk styling across CLI, rendering, and diagnostic modules.
    - Requiring capability-aware fallbacks for terminals lacking color or Unicode support while preserving semantic cues.
    - Providing one-line helpers for status, UI chrome, and system output within skin-driven flows.
  - keywords: terminal-formatter, semantic-formatting, cli-consistency, capability-detection
  - prerequisites: logger, display-utils, theme-utils
  - related patterns: display-utils, window-utils, chainable-string-utils, async-utils

- [terminal-state-management](infrastructure/terminal-state-management.md) | 2025-09-11-0000 | infrastructure | Prevents terminal state corruption when using inquirer in CLI applications
  - use-when:
    - CLI applications using inquirer for menu navigation
    - Terminal-based user interaction workflows with continuation prompts
    - Preventing nested inquirer session conflicts
  - keywords: terminal, state-management, inquirer, cli, stdin, process-control
  - prerequisites: cli-interface-management, event-handling-patterns
  - related patterns: cli-process-separation, interactive-menu-systems

- [terminal-ui-components](display-ui/terminal-ui-components.md) | 2025-09-11-0000 | display-ui | Complete terminal UI components system with interactive search, progress bars, spinners, and responsive layout management
  - use-when:
    - CLI interface lacks modern terminal UI components for user interaction
    - Need progress indication for command execution and long-running operations
    - Require interactive prompts with text input and option selection
    - Want responsive display across different terminal sizes
  - keywords: terminal-ui, cli-components, progress-bars, interactive-prompts, responsive-layout, chalk-theming
  - prerequisites: cli-interface-adapter, abstraction-layer-architecture
  - related patterns: universal-layout-engine, cli-adapter-abstracted, cli-visual-design-structured-windows, progressive-enhancement-terminal-ui, accessibility-compliance-cli-interfaces

- [test-health-monitoring](quality/test-health-monitoring.md) | 2025-09-11-0000 | quality | Comprehensive test infrastructure health monitoring with pre-commit hooks, coverage reality checks, and continuous validation
  - use-when:
    - Test infrastructure might degrade over time without detection
    - Need to prevent false security from broken tests
    - Require automated validation before commits
    - Want continuous monitoring of test system health
  - keywords: test-health, monitoring, pre-commit, coverage, validation, infrastructure, quality-gates
  - prerequisites: husky, jest, typescript
  - related patterns: ci-cd-pipeline, test-infrastructure-repair, coverage-validation, quality-gates-framework

- [test-infrastructure-repair](testing/test-infrastructure-repair.md) | 2025-09-11-0000 | testing | Systematic repair of TypeScript type system consistency and test compilation issues
  - use-when:
    - Test infrastructure fails due to compilation errors and type mismatches
    - TypeScript compilation errors prevent test execution
    - Type definition mismatches between tests and components
    - Mock interfaces don't align with real component interfaces
  - keywords: test-infrastructure, typescript, compilation-errors, type-system, test-repair, interface-alignment
  - prerequisites: typescript-configuration
  - related patterns: mock-real-api-contract-testing, type-system-pattern

- [test-type-system-alignment](testing/test-type-system-alignment.md) | 2025-09-11-0000 | testing | Align test interfaces with implementation types to resolve TypeScript compilation failures in dual type system architecture
  - use-when:
    - Test interfaces mismatch implementation types causing TypeScript compilation failures
    - TDD workflow validation is prevented by type system misalignment
    - Dual type system architecture requires test object structure alignment
    - Implementation architecture analysis reveals interface incompatibilities
  - keywords: type-alignment, test-interfaces, typescript-compilation, dual-type-system, TDD-workflow, interface-contracts, templum-types, universal-skin-engine-types
  - prerequisites: typescript-fundamentals, implementation-architecture-analysis, tdd-methodology
  - related patterns: interface-compliance-resolution, compilation-error-patterns, type-system-architecture

- [test-utils](utilities/dev/test-utils.md) | 2025-09-14T182500Z | development-tools | Centralized testing utilities to consolidate massive test files (6,283+ lines) with mock generation, assertion helpers, and test data factories
  - use-when:
    - Consolidating massive test infrastructure files exceeding LLM limits
    - Need for consistent mock generation patterns across test suites
    - Assertion helpers and test data factories scattered across tests
    - Integration test framework requiring standardization
  - keywords: test-utilities, mock-generation, assertion-helpers, test-data-factories, integration-testing
  - prerequisites: logger-utility, error-handler-utility
  - related patterns: enhanced-validation-testing, integration-test-framework-transition, core-component-unit-testing

- [theme-utils](utilities/display/theme-utils.md) | 2025-09-14T20:00:00Z | display-ui | Centralized theme management utility for dynamic theme loading, switching, palette operations, and interface-specific adaptations across the Universal Skin Engine ecosystem
  - use-when:
    - Dynamic theme switching and loading must be shared across interfaces
    - Color palette calculations or format conversions are duplicated
    - Interface-specific adaptations (CLI ANSI, VSCode CSS, command output) need to stay consistent
    - Theme caching/performance optimisations should be reusable
  - keywords: theme-management, color-palette, interface-adaptations, dynamic-theming, performance-optimisation
  - prerequisites: universal-skin-definition, logger, display-utils
  - related patterns: display-utils, pcl-rendering-integration-bridge, universal-interface-orchestration

- [type-conversion](foundation/type-conversion.md) | 2025-09-11-0000 | foundation | Type-safe conversion utilities that bridge interface gaps while maintaining full type safety
  - use-when:
    - Type system mismatches between simple legacy interfaces and comprehensive modern type definitions
    - Need to eliminate `as any` casting while maintaining type safety
    - Converting minimal definitions to comprehensive systems
    - Creating complete design token systems from basic colors
  - keywords: type-conversion, type-safety, interface-bridging, legacy-compatibility, design-tokens, theme-conversion
  - prerequisites: unified-type-system
  - related patterns: unified-type-system, null-safety, comprehensive-type-definitions

- [type-guards](utilities/data/type-guards.md) | 2025-10-01T12:43:40Z | data-management | Comprehensive type guards utility system with semantic API design, confidence-validated property existence checks, and runtime type safety patterns
  - use-when:
    - Need runtime type validation with TypeScript integration
    - Require confidence-based property existence validation
    - Building type-safe APIs with semantic method names
    - Implementing robust error handling with type narrowing
    - Need performance-optimized type checking utilities
  - keywords: type-guards, typescript, runtime-validation, confidence-scoring, semantic-api, property-validation, type-narrowing, runtime-safety
  - prerequisites: unified-type-system, comprehensive-type-system
  - related patterns: unified-type-system, comprehensive-type-system, templum-error-integration, performance-validation

- [typescript-configuration-optimization](configuration/typescript-configuration-optimization.md) | 2025-09-02-0000 | configuration | Optimize TypeScript configuration for enhanced library compatibility and build performance
  - use-when:
    - Need to improve TypeScript compilation performance
    - Experiencing library compatibility issues
    - Upgrading TypeScript configuration for modern standards
    - Implementing incremental compilation
  - keywords: typescript, configuration, performance, compilation, module-resolution, esmodule-interop
  - prerequisites: basic-typescript-knowledge, existing-tsconfig
  - related patterns: compilation-error-resolution, library-compatibility-validation

- [unified-type-system](foundation/unified-type-system.md) | 2025-09-11-0000 | foundation | Complete type system architecture with error hierarchy, signal types, and compilation compatibility
  - use-when:
    - TypeScript compilation failures due to inconsistent error handling
    - Map iteration causing TS2488 errors across compilation targets
    - Need for standardized type system integration
    - Implementing error hierarchy and signal types
  - keywords: typescript, compilation, error-handling, type-system, map-iteration, signals, templum-types
  - prerequisites: —
  - related patterns: templum-error-integration, map-iteration-pattern, error-handling-pattern, interface-property-alignment-pattern

- [universal-interface-orchestration](architecture/universal-interface-orchestration.md) | 2025-09-11-0000 | architecture | Orchestrates interface switching between multiple interface types while preserving session state and coordinating Universal Skin Engine rendering
  - use-when:
    - Complex interface switching between VSCode, CLI, and command interfaces is required
    - Session state must be preserved across interface switches
    - Universal Skin Engine integration is needed for interface-specific rendering
    - Comprehensive validation and error recovery is required for interface switching
    - Performance monitoring of interface switches is needed
  - keywords: interface-switching, session-preservation, universal-skin-engine, validation, error-recovery, performance-monitoring, orchestration
  - prerequisites: interface-adapters, universal-skin-engine, session-management, dependency-injection
  - related patterns: backend-service-integration, session-state-management, universal-skin-engine-integration, abstraction-layer-architecture

- [universal-skin-engine](display-ui/universal-skin-engine.md) | 2025-09-11-0000 | display-ui | Comprehensive universal rendering engine that handles multiple interface types with consistent theming, version management, and cross-platform compatibility
  - use-when:
    - Need consistent theming across multiple interface types (CLI, VSCode, web)
    - Implementing cross-platform compatibility with high code reuse
    - Building a centralized rendering system with version management
    - Require event-driven architecture for skin management
  - keywords: rendering, theming, cross-platform, version-management, interface-types, universal, engine, pcl-integration
  - prerequisites: pcl-rendering-integration-bridge, skin-versioning-system, templumerror-integration
  - related patterns: pcl-enhanced-rendering, universal-interface-orchestration, advanced-compatibility-validation

- [unused-variable-cleanup-automation](quality/unused-variable-cleanup-automation.md) | 2025-09-11-0000 | quality | Automated script that intelligently distinguishes between unused imports and variables for ESLint cleanup
  - use-when:
    - Large codebases accumulate unused variables causing ESLint errors
    - TypeScript compilation failures from incorrectly handled imports
    - Manual cleanup is time-consuming and error-prone
    - Need to reduce ESLint warnings while maintaining compilation
  - keywords: eslint, typescript, automation, unused-variables, imports, code-quality, compilation
  - prerequisites: eslint-configuration, typescript-setup
  - related patterns: automated-code-quality, build-integration, ci-cd-gates

- [validator](utilities/data/validator.md) | 2025-09-15T10:00:00Z | data-management | Centralized validation utility to consolidate scattered validation logic, repeated patterns, and inconsistent data checks across data management components.
  - use-when:
    - Consolidating scattered input validation logic (e.g., port numbers, URLs).
    - Needing consistent schema validation for configuration or data objects.
    - Implementing chainable validation rules for improved readability and conciseness.
    - Requiring standardized error reporting for validation failures.
  - keywords: validation-utilities, data-consistency, schema-validation, input-validation, type-checking
  - prerequisites: logger-utility, error-handler-utility
  - related patterns: type-guards, serialization-utils

- [vscode-extension-activation-pattern](initialization/vscode-extension-activation-pattern.md) | 2025-09-11-0000 | initialization | Comprehensive VSCode extension activation with webview providers, command registration, graceful degradation, and resource cleanup
  - use-when:
    - Creating VSCode extension with complete package.json configuration
    - Implementing extension activation with graceful degradation
    - Setting up webview providers and command registration
    - Managing extension lifecycle and resource cleanup
  - keywords: vscode, extension, activation, webview, commands, lifecycle, graceful-degradation
  - prerequisites: vscode-extension-configuration-pattern
  - related patterns: universal-interface-orchestration-pattern, backend-service-integration-pattern, resource-cleanup-pattern

- [vscode-extension-configuration](configuration/vscode-extension-configuration.md) | 2025-09-11-0000 | configuration | Systematic package.json configuration for converting Node.js CLI applications to VSCode extensions
  - use-when:
    - Converting Node.js CLI applications to VSCode extensions
    - Setting up VSCode extension manifest configuration
    - Configuring activity bar containers and views
    - Adding commands to VSCode command palette
    - Setting up extension development dependencies
  - keywords: vscode, extension, configuration, manifest, package.json, cli-conversion, activation-events, view-contributions
  - prerequisites: vscode-extension-development-knowledge
  - related patterns: extension-development-lifecycle, cli-to-extension-migration

- [vscode-extension-integration-system](integration/vscode-extension-integration-system.md) | 2025-10-14-0000 | integration | Comprehensive VSCode extension integration with service discovery, connection management, interface switching, and resource cleanup
  - use-when:
    - Building comprehensive VSCode extension integration systems
    - Implementing real-time service discovery in VSCode extensions
    - Creating interface switching with state preservation
    - Managing connection lifecycle with progress tracking
    - Implementing graceful resource cleanup for extensions
  - keywords: vscode-extension, service-discovery, interface-switching, connection-management, resource-cleanup, tree-provider, templum-core
  - prerequisites: vscode-extension-activation, backend-service-integration
  - related patterns: universal-interface-orchestration, templum-resource-management, backend-service-integration-unified

- [vscode-service-tree-provider](display-ui/vscode-service-tree-provider.md) | 2025-09-11-0000 | display-ui | Implement conditional display logic using BackendCapabilityProfile to show only relevant information based on backend capabilities, with visual type indicators
  - use-when:
    - VSCode service tree displays all backend information regardless of capabilities
    - Need to eliminate confusing Unknown values for unsupported features
    - Implementing BackendCapabilityProfile-aware UI components
    - Creating conditional display logic based on backend capabilities
  - keywords: vscode, tree-provider, conditional-display, backend-capability-profile, service-tree, visual-indicators
  - prerequisites: backend-capability-profile-system, vscode-tree-data-provider
  - related patterns: two-tier-backend-prioritization-system, vscode-extension-integration-system, backend-service-integration-unified

- [websocket-protocol-communication](integration/websocket-protocol-communication.md) | 2025-09-11-0000 | integration | Real WebSocket implementation with service-specific enhancements and real-time bidirectional messaging
  - use-when:
    - Backend service requires WebSocket communication protocol
    - Real-time bidirectional messaging is needed
    - Service-specific protocol enhancements are required
    - Litany backend service integration
  - keywords: websocket, real-time, bidirectional, protocol, litany, backend-service, messaging
  - prerequisites: backend-service-integration, websocket-client-libraries
  - related patterns: backend-service-integration, universal-skin-engine

- [window-utils](utilities/display/window-utils.md) | 2025-09-15T10:00:00Z | display-ui | Chainable window utilities to consolidate border rendering, window layout logic, and modal composition across CLI components
  - use-when:
    - Replacing duplicated border rendering and window layout helpers
    - Building consistent modal/panel shells across terminal components
    - Applying standardized window dimensions, padding, and title alignment
    - Integrating window chrome with the shared formatter and display utilities
  - keywords: window-utilities, ui-consistency, border-rendering, layout-management, terminal-ui
  - prerequisites: display-utils, terminal-formatter, logger
  - related patterns: display-utils, terminal-formatter, terminal-ui-components
<!-- /PATTERN:DETAIL_LIST -->

### How to Regenerate These Sections

1. Ensure dependencies are installed: `cd Templum && npm install`.
2. Run the generator: `npm run generate:pattern-readme`.
3. Review the diff, especially for unexpected missing metadata.
4. Update accompanying progress/task docs if pattern statuses change.

> The generator inspects all Markdown files under `Templum/dev/patterns` (excluding this README) and builds: (a) active pattern table, (b) deprecated/migrated table, and (c) the detailed reference list that replaces the previous usage frequency blocks and migration guide.

## Pattern Management

### Pattern Evolution

> **Explanation**: Pattern relationships, decision rationale, and architectural guidance remain consistent with the 2025 consolidation.

#### Architectural Separation Guidelines

**Core Separation Principles**:

##### Templum Role: Universal Interface Orchestrator

- ✅ **CORRECT**: Consume backend service skin definitions
- ✅ **CORRECT**: Render universal interfaces across VSCode/CLI/Command modes
- ✅ **CORRECT**: Manage interface adapter lifecycle and state synchronization
- **X WRONG**: Adapt/reimplement backend functionality directly
- **X WRONG**: Copy backend component code with namespace changes

##### Pattern Selection Decision Tree

``` diagram
Is this a backend service that produces data/analysis?
├── YES → Use backend-service-integration pattern
│   └── Create service integration, not adaptation
│
└── NO → Is this a foundational development pattern?
    ├── YES → Consider PCL pattern adaptation
    │   └── Focus on patterns, not complete components
    │X
    └── NO → Implement Templum-native solution
        └── Follow established Templum architectural patterns
```

### Pattern Maintenance

**Latest Enhancement**: 2025-08-27 (Pattern Consolidation Guide Application)

**Maintenance Checklist**:

- [ ] **Information Preservation**: Confirm 100% diagnostic value retained after edits.
- [ ] **Enhanced Navigation**: Regenerated tables include all active patterns with correct metadata.
- [ ] **Bidirectional Cross-References**: Refresh `related-patterns` sections when adding new docs.
- [ ] **Reference Integrity**: Validate cross-references via `npm run generate:pattern-readme` and doc lint scripts.
- [ ] **Implementation Success**: Ensure established patterns have evidence and usage tracking in progress docs.
- [ ] **Content Optimization**: Keep pattern docs technical yet readable; use shared helpers to reduce duplication.

**Maintenance Process**:

1. **Pattern Evolution**: Update patterns based on successful applications.
2. **Usage Tracking**: Monitor reference frequency in active tasks and note changes in `Templum/docs/current/progress.md`.
3. **Cross-Reference Updates**: Maintain accurate bidirectional links to task documents and partner repos.
4. **Enhancement Reviews**: Run semi-regular navigation/usability reviews following `meta/DOC_HYGIENE.md`.
5. **Consolidation Review**: Execute annual review for new consolidation opportunities.

---

### Pattern Dependencies & Prerequisites

> Prerequisite insights now surface directly in the generated tables and detail list above. Use them to validate Stage 3–5 planning without relying on the retired dependency matrix.

### Pattern Evolution History

#### Wave 1: Foundation (2025-08-21 to 2025-08-22)

- **Type System Architecture**: 186→152 compilation errors resolved
- **Core Infrastructure**: Configuration + Circuit Breaker foundation
- **Impact**: Enabled all subsequent component fixes

#### Wave 2: Integration (2025-08-23)

- **Backend Service Integration**: Real protocol implementation
- **Universal Interface**: VSCode integration established
- **Architectural Separation**: Compliance validation implemented
- **Impact**: Production-ready service integration

#### Wave 3: Consolidation (2025-08-27)

- **Pattern Consolidation**: 25+ patterns → organized hierarchy
- **Documentation Framework**: Diataxis-based structure
- **Reference System**: Enhanced navigation and discovery
- **Impact**: Improved pattern accessibility and maintenance

---

## Change Log

- **2025-10-07**: Introduced automated README generation, migrated migration guide & dependency matrix to scripted tables, and documented regeneration workflow.

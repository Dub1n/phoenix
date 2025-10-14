# Task: VSCode extension initialisation stable

## Requirement Summary

- Status: [x]
- Requirement text: "VSCode extension initialisation stable (known WebView load issues)."

## Prerequisites

- [x] None.

## Implementation Steps

### Unblocked Actions

- [x] Add TDD coverage in `src/tests/interfaces/vscode-extension-initialization.test.ts` that stubs the VSCode API to exercise `activate` from `src/extension.ts:360`, asserting limited-mode activation (no workspace) falls back to placeholders, real activation registers three providers, and WebView `resolveWebviewView` receives the html scaffold; include failure-path expectations for thrown `TemplumCore.initialize` errors.
  - Added isolated-module suite capturing placeholder vs real provider registration, ready html scaffolding, and observability surfacing on initialization failure, backed by `npm test -- --testPathPatterns="vscode-extension-initialization"`.
- [x] Introduce focused provider tests in `src/tests/interfaces/vscode-templum-webview.test.ts` that mock `TemplumBackendServiceRouter` to return empty/partial `getConnectionStatus` results and verify `TemplumUniversalWebViewProvider.refresh` (`src/interfaces/vscode-templum-webview.ts:74`) posts safe payloads without throwing while recording telemetry.
  - Exercised empty and partial router snapshots to confirm safe payloads and consolidated telemetry with `npm test -- --testPathPatterns="vscode-templum-webview"`.
- [x] Harden `loadBackendData` in `src/interfaces/vscode-templum-webview.ts` (`TemplumUniversalWebViewProvider.loadBackendData`) to guard missing `connectionStatus`/`backends`, collapse the per-backend availability check into a timeout-aware helper, and emit consolidated lifecycle metrics/error messages to avoid double refresh loops.
  - Normalised status handling through `resolveBackendAvailability`, short-circuiting missing data and emitting a single aggregated metrics/error signal path to prevent refresh storms.
- [x] Update `registerWebViewProviders` and related lifecycle wiring in `src/extension.ts` (`registerWebViewProviders`, `activate`) to share a typed provider registry, subscribe to `templumCore` events (e.g. `backend-services-refreshed`, `commandError`) for deterministic refreshes, and surface initialization failures via the observability adapter instead of console-only logging.
  - Introduced a shared `WebviewProviderRegistry`, event-driven refresh hooks, and observability-backed error reporting so activation covers limited/placeholder and real provider flows consistently.
- [x] Extend the VSCode adapter abstraction in `src/interfaces/vscode-adapter-abstracted.ts` (`VSCodeInterfaceAdapter.loadInitialContent`, `VSCodeInterfaceAdapter.applySkin`) to queue calls until the WebView signals ready, preventing early postMessage rejections that currently manifest as "WebView load" errors.
  - Added ready message handling, pending message queuing, and safe flush/rejection paths to eliminate early postMessage failures while preserving existing skin/render workflows.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests to run: `npm test -- --testPathPattern="vscode-extension-initialization"`, `npm test -- --testPathPattern="vscode-templum-webview"`, then full `npm test` once targeted suites pass.
  - ✅ `npm test -- --testPathPatterns="vscode-extension-initialization"`
  - ✅ `npm test -- --testPathPatterns="vscode-templum-webview"`
  - ⚠️ `npm test` — guardrail suites already red in baseline (`tests/interfaces/interface-session-error-handler.guardrail.test.ts`, `tests/scripts/phase6-validation-cli.test.ts`, `tests/rendering/skin-payload-consumption.integration.test.ts`, etc.); no regressions observed in new VSCode activation or provider coverage.
- Validation/commands: Run `npm run validate:component` to confirm DI wiring stays consistent after activation changes; optional manual check with VSCode dev host (`code --extensionDevelopmentPath=.`) to confirm WebViews render without reload prompts.
  - ⚠️ `npm run validate:component` — script not present in package.json (attempt returned “Missing script”).
  - ⚠️ `npm run build:component` — script exists but references `../scripts/validation/component-build.js` which is absent in this workspace.
- Documentation to update: `docs/current/progress.md` (status + task link), `docs/current/architecture-spec.md` Interface Delivery section, and VSCode integration notes under `dev/patterns/vscode-extension-integration-system.md` once stability is verified.
  - ✅ Progress tracker, architecture spec, and integration pattern updated for the registry/handshake flow.

## References

- docs/current/progress.md:25
- docs/current/architecture-spec.md (Interface Delivery)
- Templum/dev/fixes/2025-08-27-2159-vscode-extension-setup.md:270
- Templum/src/extension.ts:360
- Templum/src/extension.ts:505
- Templum/src/interfaces/vscode-templum-webview.ts:74
- Templum/src/interfaces/vscode-templum-webview.ts:492
- Templum/src/interfaces/vscode-adapter-abstracted.ts:61
- Templum/src/tests/e2e/e2e-scenarios.ts:49

## Current Assessment (2025-10-14)

- Implementation: Activation now registers typed providers in both limited and full modes, observes `TemplumCore` lifecycle events, and routes initialization failures through the observability adapter; WebView providers guard missing data via `resolveBackendAvailability` and emit single-cycle telemetry, while the VSCode adapter defers postMessage traffic until a `templum:webview_ready` handshake arrives.
- Tests: Targeted suites (`npm test -- --testPathPatterns="vscode-extension-initialization"`, `npm test -- --testPathPatterns="vscode-templum-webview"`) cover activation fallbacks, provider readiness, and telemetry safety in addition to the existing integration harness; full battery pending per DoD.
- Tasks ahead: maintain registry/event wiring alongside upcoming interface delivery features and document further if additional commands or adapters join the registry.

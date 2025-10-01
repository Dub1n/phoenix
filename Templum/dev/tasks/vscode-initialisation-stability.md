# Task: VSCode extension initialisation stable

## Requirement Summary

- Status: [!]
- Requirement text: "VSCode extension initialisation stable (known WebView load issues)."

## Prerequisites

- [ ] None.

## Implementation Steps

### Unblocked Actions

- [ ] Add TDD coverage in `src/tests/interfaces/vscode-extension-initialization.test.ts` that stubs the VSCode API to exercise `activate` from `src/extension.ts:360`, asserting limited-mode activation (no workspace) falls back to placeholders, real activation registers three providers, and WebView `resolveWebviewView` receives the html scaffold; include failure-path expectations for thrown `TemplumCore.initialize` errors.
- [ ] Introduce focused provider tests in `src/tests/interfaces/vscode-templum-webview.test.ts` that mock `TemplumBackendServiceRouter` to return empty/partial `getConnectionStatus` results and verify `TemplumUniversalWebViewProvider.refresh` (`src/interfaces/vscode-templum-webview.ts:74`) posts safe payloads without throwing while recording telemetry.
- [ ] Harden `loadBackendData` in `src/interfaces/vscode-templum-webview.ts:492` to guard missing `connectionStatus`/`backends`, collapse the per-backend availability check into a timeout-aware helper, and emit consolidated lifecycle metrics/error messages to avoid double refresh loops.
- [ ] Update `registerWebViewProviders` and related lifecycle wiring in `src/extension.ts:505` to share a typed provider registry, subscribe to `templumCore` events (e.g. `backend-services-refreshed`, `commandError`) for deterministic refreshes, and surface initialization failures via the observability adapter instead of console-only logging.
- [ ] Extend the VSCode adapter abstraction in `src/interfaces/vscode-adapter-abstracted.ts:61` to queue `loadInitialContent`/`applySkin` calls until the WebView signals ready, preventing early postMessage rejections that currently manifest as "WebView load" errors.

### Blocked Actions (if any)

- [ ] None.

## Definition of Done

- Tests to run: `npm test -- --testPathPattern="vscode-extension-initialization"`, `npm test -- --testPathPattern="vscode-templum-webview"`, then full `npm test` once targeted suites pass.
- Validation/commands: Run `npm run validate:component` to confirm DI wiring stays consistent after activation changes; optional manual check with VSCode dev host (`code --extensionDevelopmentPath=.`) to confirm WebViews render without reload prompts.
- Documentation to update: `docs/current/progress.md` (status + task link), `docs/current/architecture-spec.md` Interface Delivery section, and VSCode integration notes under `dev/patterns/vscode-extension-integration-system.md` once stability is verified.

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

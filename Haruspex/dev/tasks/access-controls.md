# Task: [ ] Access controls for write operations.

## Requirement Summary
- Status: `[ ]`
- Requirement text: "Access controls for write operations."

## Prerequisites
- [ ] [~] HTTP server boots (handlers still tied to legacy components; replace with backend-native logic). — Enforcing write guards depends on backend-native handlers so every request path flows through the new security middleware instead of legacy VSCode-era stubs.

## Implementation Steps
### Unblocked Actions
- [ ] Drive the change with failing integration tests in `Haruspex/src/__tests__/api/access-controls.test.ts`: boot `HaruspexBackendService` with a temporary config that defines at least one valid write token, hit `POST /api/v1/models/refresh` and `POST /executeCommand` (`haruspex.updateConfiguration`) using `supertest`, and assert 401/403 responses when the `Authorization`/`X-Api-Key` header is missing or invalid while authorised calls succeed and mutate config/cache as expected. Verify responses omit secret material and that config files remain unchanged after blocked attempts.
- [ ] Extend service configuration contracts in `Haruspex/src/api/types/api-contracts.ts` to include a `security` section (e.g., allowed tokens, role→operation mapping, token hashing strategy). Update `Haruspex/src/config/templum-configuration-manager.ts:200` range so persisted configs store hashed tokens, redact secrets from `getConfiguration()/getConfigurationHistory()` output, and surface helper methods to reload security policy without exposing raw credentials.
- [ ] Introduce a dedicated access-control module (e.g., `Haruspex/src/security/access-control-policy.ts`) that classifies operations (`refreshModels`, `clearCache`, configuration mutations, future frontmatter writers) as write actions, loads hashed credentials from the security config, performs timing-safe comparisons via Node `crypto`, and emits structured audit events (success/failure) back to callers.
- [ ] Replace the stub `AuthenticationManager` in `Haruspex/src/api/gateway/auth/auth-manager.ts:1` with real middleware that parses `Authorization: Bearer <token>` and `X-Api-Key` headers, delegates to the new access-control policy for write checks, and exposes helpers (`assertWriteAccess`, `isAuthenticated`) that upstream routes can call before invoking mutating operations. Ensure logs mask tokens and reuse the same policy instance per process.
- [ ] Wire `Haruspex/src/api/gateway/api-gateway.ts:347-749` to enforce the policy: gate `POST /api/v1/models/refresh` and every write-capable Templum command (`haruspex.clearCache`, `haruspex.updateConfiguration`, `haruspex.revertConfiguration`, etc.) by invoking `AuthenticationManager.assertWriteAccess(...)`, return 403 on failure, and attach the caller identity to downstream telemetry so cache/model/config updates can be attributed.
- [ ] Update `Haruspex/src/haruspex-backend-service.ts:211` (and the default config builder in `Haruspex/src/backend-main.ts`) to inject the security policy into `APIGateway`, load tokens from environment variables or config files at startup, and rehydrate the policy when `TemplumConfigurationManager` persists changes. Add telemetry so startup fails fast if no write credentials are defined in production mode.
- [ ] Document the security model in `Haruspex/docs/current/architecture-spec.md` (Operational considerations) describing token storage, hashing, and the protected operation list, and note any operational runbooks needed for rotating credentials.

### Blocked Actions (pending [ ] Auditable logs for analyses and approvals.)
- [ ] Once audit logging is available, emit structured security events for every authorised/blocked write attempt and ensure the audit pipeline captures caller identity, operation, and outcome without leaking credentials.

## Definition of Done
- Tests to run: `npm run test:unit`, `npx jest Haruspex/src/__tests__/api/access-controls.test.ts`, and `npm run build:backend` complete without regressions.
- Validation/commands: `npm run start:backend` followed by `curl -X POST http://localhost:$HARUSPEX_HTTP_PORT/api/v1/models/refresh` with and without `Authorization` headers shows unauthorised requests rejected and authorised requests succeeding; similar validation for `POST /executeCommand` write commands.
- Documentation to update: `Haruspex/docs/current/architecture-spec.md` security section and `docs/current/progress.md` once the requirement is satisfied; record credential rotation guidance if separate runbooks exist.

## References
- Progress entry: `Haruspex/docs/current/progress.md:32`
- Architecture spec: `Haruspex/docs/current/architecture-spec.md:48`
- Auth stub: `Haruspex/src/api/gateway/auth/auth-manager.ts:1`
- Gateway routes: `Haruspex/src/api/gateway/api-gateway.ts:347`, `Haruspex/src/api/gateway/api-gateway.ts:514`
- Config manager: `Haruspex/src/config/templum-configuration-manager.ts:200`
- Backend wiring: `Haruspex/src/haruspex-backend-service.ts:211`

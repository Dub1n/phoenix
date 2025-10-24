# Task: Backend Capability Tiering

Related requirement: `docs/current/progress.md` → Quality & Runtime Stability → "Backend capability tiering".

Tags: `#infra`

## Checklist

- [ ] Define capability tier taxonomy (core vs optional signals) and document expected metadata fields (`docs/current/1.2-Backend-Integration-Guide.md`, `docs/current/tests/universal-backend-mock-spec.md`).
- [ ] Audit discovery/connection flows (`ServiceDiscovery`, `BackendServiceRouter`, `ConnectionFactory`) to ensure optional capabilities are gracefully ignored when absent.
- [ ] Update Phase 6 validation and health scripts to read capability flags and downgrade expectations when telemetry/health aren’t advertised.
- [ ] Adjust tests/mocks to register capability sets explicitly and cover both tiers.
- [ ] Update spec/progress/task file.
- [ ] Commit with message `templum: support backend capability tiers` after tests.

## References

- Code: `Templum/src/backend/service-discovery.ts`, `Templum/src/backend/backend-service-router.ts`, `Templum/src/tests/integration-validation-framework.ts`
- Tests: `tests/backend/**/*.ts`, `tests/integration/**/*.ts`, `npm run phase6-validation`
- Docs: `Templum/docs/current/1.2-Backend-Integration-Guide.md`, `Templum/docs/current/tests/universal-backend-mock-spec.md`

## Notes

- Capability flags should live alongside `backendConfig`/manifests so adapters and validation harnesses can determine available features without bespoke checks.
- Coordinate with `dev/tasks/universal-backend-mock-reference.md` to keep the canonical mock aligned with the tier definitions.
- Ensure existing mocks that already emit telemetry/health continue to do so by declaring the appropriate capabilities; minimal CLI-wrapping backends should only need the core tier (`command-routing`).
- Initial documentation scaffolding for tier definitions now lives in `docs/current/tests/universal-backend-mock-spec.md` (Section 2) and `docs/current/1.2-Backend-Integration-Guide.md` (Capability Tiers); further implementation work should reference these sections.
- If this task changes prerequisites or dependency relationships, regenerate the project’s dependency map JSON (see `dev/tasks/*_task_dependencies.json`) and attach the updated file in the related progress planner.

## Checklist (Copy into PR or issue if needed)

- [ ] Code/tests updated
- [ ] Docs updated
- [ ] Progress tracker updated
- [ ] Task log updated
- [ ] Checklist completed

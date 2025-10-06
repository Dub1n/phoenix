# Task: API/CLI endpoints for external repo ingest

## Requirement Summary
- Status: `[ ]`
- Requirement text: "API/CLI endpoints for ingesting external repo data."

## Prerequisites
- [ ] None.

## Implementation Steps
### Unblocked Actions
- [ ] Drive the work with red tests: add `tests/integration/external-ingest-api.test.ts` using `supertest` to assert a `POST /api/ingest` call accepts repo metadata (provider, URL/path, ref) and responds with an ingest job id plus summary, then `GET /api/ingest/:id` returns normalized artifacts; add `tests/integration/external-ingest-cli.test.ts` that uses the unified CLI entry (`src/cli/args.ts`) to invoke `phoenix-code-lite ingest --repo ./tests/fixtures/external-repo --format json` and verifies the command prints summary rows and writes the artifact file under `dist/ingest/<jobId>.json`.
- [ ] Define reusable ingestion contracts in `src/types/integration/external-ingest.ts` (e.g., `ExternalRepoSource`, `IngestJob`, `IngestArtifact`, error types) and wire DI hooks in `src/index-di.ts` so services can be resolved without direct module imports.
- [ ] Implement `src/integration/external-repo-ingest-service.ts` that uses `simple-git` for Git clones (add dependency + typings) and a pluggable extractor pipeline converting repo contents into QMS-ready documents; include adapters for local path cloning and remote HTTP(S) URLs, persist job manifests under `dist/ingest` with audit metadata, and expose async methods invoked by both CLI and API layers.
- [ ] Stand up an HTTP surface in `src/api/external-ingest-server.ts` via `fastify` (new dependency) registering routes (`POST /api/ingest`, `GET /api/ingest/:id`, `GET /api/ingest/:id/artifacts/:name`) and integrate lifecycle management in `src/index.ts` (start when `--api` flag used) plus configuration toggles in `src/core/config-manager.ts`.
- [ ] Add CLI affordances: create `src/commands/ingest-commands.ts` with handlers (`ingest:repo`, `ingest:status`, `ingest:list`), register them inside `src/commands/command-registration.ts`, extend `src/cli/help-system.ts` to document the new flags, and update `src/cli/skin-menu-renderer.ts` to surface an “External Ingest” menu entry beneath Integration actions.
- [ ] Extend automation safeguards: craft unit coverage for the service in `tests/unit/integration/external-repo-ingest-service.test.ts` (mock git operations, validate normalization logic), add fixture repos under `tests/fixtures/external-repo/`, and document operational expectations in `docs/current/architecture-spec.md` (integration section) and `docs/current/progress.md` once endpoints are live.

### Blocked Actions (if any)
- [ ] None.

## Definition of Done
- `npm run build`
- `npm test -- tests/integration/external-ingest-api.test.ts`
- `npm test -- tests/integration/external-ingest-cli.test.ts`
- `npm test -- tests/unit/integration/external-repo-ingest-service.test.ts`
- API server responds with ingest job lifecycle endpoints; CLI command exports artifacts; documentation updated (progress tracker, architecture spec, any onboarding references).

## References
- Progress entry: `docs/current/progress.md:26`
- Architecture integration notes: `docs/current/architecture-spec.md:31-35`
- Integration diagram context: `docs/current/index/ARCHITECTURE-DIAGRAM.md:528`
- Command registry wiring: `src/commands/command-registration.ts:1`
- CLI help surface: `src/cli/help-system.ts:1`

## Current Status (2025-02-15)
- Implementation: no ingestion contracts, services, or Fastify endpoints exist; CLI lacks ingest commands and there is no `dist/ingest/` output path.
- Tests executed: none — API/CLI/unit suites cited in the plan have not been created.
- Coverage snapshot: not applicable because ingest modules are absent.
- Gaps blocking completion: need git/HTTP adapters, schema definitions, CLI wiring, fixtures, and documentation to unlock downstream sync work.

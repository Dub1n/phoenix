# Task: Frontmatter enrichment workflow operational

## Requirement Summary

- Status: `[ ]`
- Requirement text: "Frontmatter enrichment workflow (deterministic, auditable) operational."

## Prerequisites

- None.

## Implementation Steps

### Unblocked Actions

- [ ] Capture expected behaviour with failing Jest specs in `src/frontmatter/__tests__/frontmatter-enrichment-service.test.ts` (cover deterministic serialization, dry-run diff output, audit log entries) and Markdown fixtures under `test/fixtures/frontmatter/`.
- [ ] Define the canonical YAML schema plus normalization helpers in `src/frontmatter/frontmatter-schema.ts`, exporting through `src/core/shared-schemas.ts` so other modules reuse the same `zod` contract.
- [ ] Extend `src/components/haruspex-stub-parser.ts` to parse and emit structured frontmatter metadata (preserving existing Markdown parsing) and add targeted unit coverage for the new behaviour.
- [ ] Implement `src/frontmatter/frontmatter-enrichment-service.ts` with deterministic key ordering, conflict resolution, and auditable write operations (JSONL ledger with sha256 checksums) wired into `TelemetryCollector`.
- [ ] Introduce `src/monitoring/frontmatter-audit.ts` to persist enrichment ledgers under `dev/audit/frontmatter/` and expose retrieval APIs for backend diagnostics.
- [ ] Register a `POST /frontmatter/enrich` workflow in `src/api/gateway/api-gateway.ts` and `src/api/gateway/routing/request-router.ts`, invoke it from `src/haruspex-backend-service.ts`, and surface a `haruspex frontmatter enrich` command in `src/debugging/haruspex-cli.ts` (with automated tests around CLI command dispatch).
- [ ] Document the new workflow and audit guarantees in `docs/current/architecture-spec.md` (Sections 3 and 5) once implementation passes tests.

### Blocked Actions (if any)

- None.

## Definition of Done

- Tests to run: `npm run test:unit`, targeted Jest suite for `src/frontmatter/__tests__/frontmatter-enrichment-service.test.ts`, CLI invocation smoke via `npm run debug:cli "frontmatter enrich --dry-run"`.
- Validation/commands: exercise `POST /frontmatter/enrich` against a sample repo, confirm audit ledger entries and dry-run diff stability.
- Documentation to update: `docs/current/progress.md`, `docs/current/architecture-spec.md`, new or updated audit notes under `dev/audit/`.

## References

- Progress entry: `docs/current/progress.md:9`.
- Architecture spec: `docs/current/architecture-spec.md:39`, `docs/current/architecture-spec.md:58`.
- Template context: `meta/templates/architecture-spec.md`.

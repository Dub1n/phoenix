## Check-in: 2026-07-16

- Domains touched: Templum CLI rendering architecture, product specification, documentation lifecycle, frontmatter governance.
- Renderer decision: replace direct string-oriented presentation with a retained character-grid pipeline that separates neutral view models, layout, composition/clipping, diffing, and terminal painting.
- Contract boundary: backend and skin data remain inputs; the CLI presentation layer must not receive backend-specific objects or preformatted terminal strings.
- Documentation model: maintain separate product specification, target architecture, focused task log, decision record, canonical current-state documents, indexes, and archives.
- Pre-implementation gate: decide overflow, minimum dimensions, resize, response retention, nested windows, text editing, disabled actions, Unicode width policy, reviewed golden frames, test seams, migration, rollback, and utility-governance mapping before production renderer work.
- Metadata convention: exactly one Markdown H1 is the canonical title; doc-type, status, tags, and last_updated are required; optional kebab-case id supplies stable machine identity; title and name are deprecated migration aliases.
- Supported document types: architecture-spec, target-architecture, product-spec, progress, operations-guide, task-log, decision-record, documentation-index, playbook, appendix, and pattern.
- Validation completed: migrated active CLI and related canonical documents pass the H1-aware frontmatter validator; schemas parse; legacy pattern name and current id compatibility were checked; whitespace validation passes.
- Deferred work: broad tasks and patterns audits, generated context indexes, and historical validation evidence remain outside this change.

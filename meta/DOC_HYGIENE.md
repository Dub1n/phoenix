---
doc-type: operations-guide
id: documentation-hygiene-protocol
status: current
tags: [documentation, governance, metadata]
last_updated: 2026-07-16
---

# Documentation Hygiene Protocol

> Purpose: keep canonical references accurate, future plans visible, and outdated material quarantined so development can move quickly without losing context.

## 1. Canonical vs. Target-State Docs

- Maintain exactly one **Current State Spec** per project:
  - Templum → `Templum/docs/current/architecture-spec.md`
  - Phoenix Code Lite → `phoenix-code-lite/docs/current/architecture-spec.md`
  - Haruspex → `Haruspex/docs/current/architecture-spec.md`
  - Validation System → `scripts/validation/docs/current/architecture-spec.md`
- Keep future/ideal plans in separate locations (e.g., `dev/architecture/`, `docs/03-PCL-QMS/`) and mark them as *Target State*.

### Frontmatter Contract

Every maintained Markdown document that participates in documentation governance must have:

- exactly one Markdown H1, which is the canonical human-readable title;
- a `doc-type` selected from the supported types below;
- `status`, `tags`, and `last_updated` lifecycle metadata;
- an optional kebab-case `id` only when a stable machine identifier is useful across renames or moves.

Do not duplicate the H1 in frontmatter. The legacy `title` field is accepted only while existing documents migrate. The legacy `name` field is accepted only as a temporary alias for `id`, primarily for pattern documents. New or substantively refreshed documents must use the H1 and `id` convention.

| Document type | Purpose | Typical location |
| --- | --- | --- |
| `architecture-spec` | Canonical implemented architecture and current-state claims | `docs/current/` |
| `target-architecture` | Accepted but not yet fully implemented architecture | `dev/architecture/`, area-specific `dev/` folders, or `docs/target/` |
| `product-spec` | Observable user behaviour and acceptance contract | Area-specific `dev/` folder until verified |
| `progress` | Canonical requirement status and prioritisation | `docs/current/progress.md` |
| `operations-guide` | Testing, deployment, support, or runtime procedures | `docs/current/` |
| `task-log` | Focused implementation checklist, validation, and evidence | `dev/tasks/` |
| `decision-record` | Accepted decision and rationale that should not be rewritten as current state | Area-specific `dev/` folder or architecture decision collection |
| `documentation-index` | Navigation and ownership map without duplicated status claims | `README.md` files in governed documentation folders |
| `playbook` | Time-bounded milestone or cross-project execution coordination | `meta/workflows/` |
| `appendix` | Supporting detail that is not an authority for current status | Adjacent to the owning canonical document |
| `pattern` | Reusable engineering solution with governed discovery metadata | `dev/patterns/` |

Use `meta/templates/document.md` for a generic governed document and the specialised templates alongside it where available. The machine-enforced type list lives in `meta/templates/schema/frontmatter.json`; update this table, the schema, and affected templates together when types change.

### Recommended Layout

```filesystem
Project/
├ README.md
├ docs/
│  ├ current/
│  │  ├ architecture-spec.md (canonical)
│  │  ├ progress.md (status tracker)
│  │  ├ testing-guide.md (canonical test command matrix)
│  │  ├ pattern-taxonomy.md (frontmatter category enum)
│  │  ├ CHANGELOG.md
│  │  └ supporting references (api.md, operations.md, etc.)
│  ├ target/
│  │  ├ architecture-target.md
│  │  └ roadmap.md / vision docs
│  ├ pending/ (optional)
│  │  └ docs needing verification or incomplete migration
│  └ archive/
│     ├ ARCHIVE_INDEX.md
│     └ superseded files
├ dev/
│  ├ architecture/
│  ├ patterns/
│  └ area-specific working docs (e.g., cli/, backend/)
├ notes/ (optional scratch space)
├ src/
├ tests/
└ scripts/
```

Promote docs from `dev/` into `docs/current/` only after implementation matches reality. Archive superseded material immediately.
Use the templates in `meta/templates/` (`architecture-spec.md`, `progress.md`, `task-log.md`, `testing-guide.md`) when creating or refreshing documents to keep structure consistent.
Projects with automated validation suites must keep `docs/current/testing-guide.md` accurate—update it alongside spec changes whenever test commands, timeouts, or orchestration scripts shift.
Keep each project's `pattern-taxonomy.md` in sync with its frontmatter schema and consult it before adding or updating pattern documentation.
Validate frontmatter and the single-H1 rule using `meta/scripts/validate_frontmatter.py` (points to `meta/templates/schema/frontmatter.json` by default) before committing significant documentation changes.

### Progress Tracking

- Maintain `docs/current/progress.md` per project with a simple legend (e.g., `[x] done`, `[~] in progress`, `[ ] unstarted`, `[!] broken`, `[?] verify`, `[P] pending`).
- Mirror the structure of the canonical spec so each requirement’s status is obvious.
- Update the progress file alongside the spec whenever behaviour changes.

### Requirement Task Logs

- For requirements that are not `[x]`, create a focused task log under `dev/tasks/`, e.g., `dev/tasks/unified-session-layer.md`.
- Capture atomic checklist items, relevant code/docs, and the expected commit message.
- Link the task log from the corresponding line in `docs/current/progress.md`.
- Archive or annotate the task log once the requirement is complete (optionally move to `docs/archive/`).

### Documentation Compliance Checklist

- Use the change checklist in `meta/DOC_CHANGE_CHECKLIST.md` before finalising work.
- Tag sections/items in your task log with the checklist categories (e.g., `#spec`, `#tests`, `#progress`) so you can quickly filter what remains.
- Always update code, tests, spec, progress log, and task file **before** committing.
- Recommended final commit step: `git status` → run checklist → commit with descriptive message → link checklist completion in task log if desired.

## 2. Documentation Change Log

- When code behaviour changes, update the relevant Current State Spec in the same commit.
- Add a dated entry to `docs/CHANGELOG.md` (per project or repo-wide) summarising the change, files touched, and validation performed.

## 3. Status Badges & Callouts

- Preface each major section with a status badge or callout:
  - `Status: Verified 2025-09-15`
  - `Status: Needs Review`
  - `Status: Planned`
- Update the badge whenever the section is touched. If behaviour is uncertain, flag it explicitly until verified.

## 4. Pull Request Checklist

- Add to PR template: “Have you updated/verified the canonical spec? If not, mark the relevant section as TODO/Needs Review.”
- Reject merges when documentation falls behind implementation unless the spec is tagged with the outstanding work.

## 5. Archive Workflow

- Move superseded docs into `docs/archive/` (per project) immediately rather than leaving stale copies.
- Maintain an `ARCHIVE_INDEX.md` explaining why each file was archived and which spec replaced it.

## 6. Automated Checks

- Create a lightweight CI job that:
  - Validates front-matter presence and cross-links.
  - Flags `Status: Verified` stamps older than a configurable window (e.g., 60 days).
  - Checks internal links/images to prevent drift.
- Optionally plug doc verifications into the Validation System (e.g., confirm referenced endpoints exist).

## 7. Scheduled Doc Sweeps

- Set regular doc-focused sprints (e.g., every major milestone) to:
  - Resolve “Needs Review” badges.
  - Close out roadmap sections that have shipped.
  - Prune Target State docs that are obsolete.

## 8. Cross-Linking

- Embed code references (file paths, commands) in specs so maintainers can jump directly to implementation/testing locations.
- Use the file reference format adopted in `meta/ARCHITECTURE.md` for consistency.

## 9. Meta Registry Upkeep

- Treat `meta/ARCHITECTURE.md` as the master index.
- Keep its “Pending Review / Verification” lists fresh—remove entries once they are resolved or archived.

Adhering to this protocol should keep the documentation ecosystem trustworthy while the projects converge on their MVPs.

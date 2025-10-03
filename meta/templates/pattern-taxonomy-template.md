# <Project Name> Pattern Taxonomy

## Purpose

- Describe why this taxonomy exists and which frontmatter/schema references rely on it.
- Tie the taxonomy to the project’s pattern documentation workflow (e.g., `meta/templates/schema/pattern-frontmatter.json`).

## Canonical Categories

> **Cross-project rules**
>
> - Categories must stay lowercase kebab-case.
> - Collapse case variants and synonyms (e.g., `Foundation` → `foundation`, `ui` → `display-ui`).
> - Document scope clearly so contributors can choose the correct label without creating ad-hoc alternatives.

| Category            | Scope                                                      | Typical Artifacts |
| ------------------- | ---------------------------------------------------------- | ----------------- |
| architecture        | Cross-system structure, boundaries, coordination.          |                   |
| foundation          | Shared primitives and base abstractions.                   |                   |
| infrastructure      | Platform/runtime plumbing (logging, async, adapters).      |                   |
| integration         | Bridges to other modules/services.                         |                   |
| business-logic      | Domain workflow and policy enforcement.                    |                   |
| configuration       | Configuration surfaces and validation.                     |                   |
| data-management     | Storage, persistence, and data shaping.                    |                   |
| development-tools   | Tooling that improves dev workflows.                       |                   |
| display-ui          | Presentation utilities/components.                         |                   |
| initialization      | Bootstrap/startup orchestration.                           |                   |
| quality             | Governance and readiness gating.                           |                   |
| resilience          | Reliability/fault tolerance patterns.                      |                   |
| routing             | Command/event/request routing.                             |                   |
| system              | Cross-cutting coordination that spans multiple subsystems. |                   |
| testing             | Testing strategy and harness utilities.                    |                   |
| testing-integration | Integration/E2E/contract testing specifics.                |                   |
| operations          | Observability, runbooks, day-two concerns.                 |                   |
| compliance          | Security/regulatory/audit enablement.                      |                   |
| enablement          | Partner onboarding, support, change-management artefacts.  |                   |

_Add or remove categories only after following the extension process below._

## Legacy Label Mapping

| Legacy Label                                | Canonical Category | Notes                                               |
| ------------------------------------------- | ------------------ | --------------------------------------------------- |
| Foundation                                  | foundation         | replace during doc audit                            |
| Infrastructure                              | infrastructure     | replace during doc audit                            |
| Integration                                 | integration        | replace during doc audit                            |
| core-infrastructure                         | infrastructure     | ensure supporting text still reads correctly        |
| core-infrastructure-utility                 | infrastructure     | consolidate terminology across docs                 |
| resilience-infrastructure                   | resilience         | adjust references from infrastructure to resilience |
| ui                                          | display-ui         | ensure content truly focuses on presentation        |
| <add additional project-specific rows here> |                    |                                                     |

## Enforcement Rules

- Keep the canonical list in sync with the project’s frontmatter schema (reference path here).
- Require schema validation (mention command or CI job) before merging documentation updates.
- If a document spans multiple scopes, split the content or choose the most specific category.

## Extension Process

1. Evaluate whether an existing category fits; avoid taxonomic sprawl.
2. Draft a proposed category (name, scope, typical artefacts) that follows lowercase kebab-case rules.
3. Update this taxonomy doc, the schema enum, and this template in the same change.
4. Run a repo-wide search (e.g., `rg "^category:"`) to migrate any documents impacted by the new label.
5. Log the taxonomy change in the project changelog or release notes and notify downstream consumers.
6. Re-run schema validation against representative frontmatter snippets.

## Applying the Taxonomy to Existing Patterns

1. Search for legacy labels across pattern docs.
2. Update frontmatter `category` entries using the mapping table.
3. Re-run schema validation (document exact command here).
4. Capture the reclassification in commit messages and task logs.

## Change Log

- <YYYY-MM-DD>: Initial taxonomy drafted / updated.

<!--
Setup Guidance:
- Reference this taxonomy from `docs/current/architecture-spec.md` (overview) and any schema comments.
- Add a reminder in `meta/DOC_CHANGE_CHECKLIST.md` to consult this file during doc updates.
- Link to this taxonomy from `meta/ARCHITECTURE.md` so cross-project auditors can find it quickly.
-->

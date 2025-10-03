# Templum Pattern Taxonomy

## Purpose

- Provide a single source of truth for the pattern frontmatter category enum used by `meta/templates/schema/pattern-frontmatter.json`.
- Collapse legacy synonyms and mixed casing into a stable, industry-aligned nomenclature that mirrors typical software-architecture layers.
- Document how to extend, audit, and apply the taxonomy so pattern metadata stays searchable and comparable across projects.

## Canonical Categories

| Category            | Scope                                                                   | Typical Artifacts                                                |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| architecture        | Cross-system structure, boundaries, and coordination mechanics.         | High-level orchestration specs, integration blueprints.          |
| foundation          | Core abstractions shared across features (base types, shared policies). | Primitive interfaces, base models, shared policies.              |
| infrastructure      | Platform services and runtime plumbing that keep the system operating.  | Logging, error handling, async foundations, platform adapters.   |
| integration         | Bridges that connect internal modules or external systems.              | Adapter patterns, protocol bridges, service orchestration.       |
| business-logic      | Domain-driven rules that express product behaviour.                     | Workflow engines, decision logic, policy evaluators.             |
| configuration       | Configuration surfaces and management patterns.                         | Schema definitions, config loaders, diff/validation logic.       |
| data-management     | Storage modelling, persistence, and transformation concerns.            | Repository patterns, serializers, data pipelines.                |
| development-tools   | Tooling that improves developer productivity.                           | Debug utilities, scaffolding scripts, local automation.          |
| display-ui          | Presentation-specific utilities and rendering helpers.                  | Terminal components, theming systems, layout utilities.          |
| initialization      | Bootstrap and startup sequences.                                        | Lifecycle managers, bootstrappers, startup orchestration.        |
| quality             | Quality governance outside dedicated testing artefacts.                 | Checklists, validation policies, readiness gates.                |
| resilience          | Reliability patterns covering fault handling and recovery.              | Circuit breakers, fallback managers, health remediation.         |
| routing             | Control-flow and request/command routing.                               | Command routers, event dispatchers, messaging bridges.           |
| system              | Cross-cutting system coordination that does not fit a narrower layer.   | Multi-subsystem orchestrators, meta-controls.                    |
| testing             | Test strategy patterns and test harness utilities.                      | Unit testing patterns, coverage governance.                      |
| testing-integration | Integration/acceptance testing specifics.                               | End-to-end harnesses, contract verification guides.              |
| operations          | Runbooks, observability, and day-two operational practices.             | Runbook frameworks, incident playbooks, telemetry rollouts.      |
| compliance          | Regulatory, security, audit enablement.                                 | Compliance checklists, audit hooks, evidence pipelines.          |
| enablement          | Partner onboarding, support, and organisational readiness.              | Training guides, change-management packages, enablement scripts. |

## Legacy Label Mapping

| Legacy Label                  | Canonical Category | Required Action                                                                       |
| ----------------------------- | ------------------ | ------------------------------------------------------------------------------------- |
| `Foundation`                  | foundation         | Update frontmatter to lowercase.                                                      |
| `Infrastructure`              | infrastructure     | Update frontmatter to lowercase.                                                      |
| `Integration`                 | integration        | Update frontmatter to lowercase.                                                      |
| `core-infrastructure`         | infrastructure     | Replace value and confirm content still matches scope.                                |
| `core-infrastructure-utility` | infrastructure     | Replace value; ensure utility-level docs also reference `infrastructure`.             |
| `resilience-infrastructure`   | resilience         | Replace value and adjust supporting text if it cites infrastructure.                  |
| `ui`                          | display-ui         | Replace with `display-ui`; verify document describes presentation-specific behaviour. |

All other legacy labels already match canonical form; still confirm spelling and casing during audit.

## Enforcement Rules

- Categories **must** remain lowercase kebab-case strings matching the table above.
- Each new or modified pattern doc must pass validation against `meta/templates/schema/pattern-frontmatter.json`.
- When content spans multiple scopes, split the document or choose the *most specific* category that best represents the dominant responsibility.
- Avoid inventing ad-hoc categories; follow the extension process instead.

## Extension Process

1. **Evaluate Need**: Confirm no existing category captures the scope (search `Templum/docs/current/pattern-taxonomy.md` and recent changes).
2. **Design Candidate**: Draft a short description and example artefacts following the table format.
3. **Propose Update**:
   - Add the new category to this document (alphabetised or grouped logically).
   - Update `meta/templates/schema/pattern-frontmatter.json` enum.
   - Update the template (`meta/templates/pattern-taxonomy-template.md`) and any project-level references.
4. **Audit Existing Docs**: Run `rg "^category:" Templum/dev/patterns` and swap any documents that should adopt the new category.
5. **Log Change**: Note the taxonomy update in the project CHANGELOG or release notes, and notify dependent teams.
6. **Validate**: Re-run schema validation (e.g., `python3 -m jsonschema`) against representative frontmatter samples.

## Applying the Taxonomy to Existing Patterns

1. Run `rg "^category:" Templum/dev/patterns` and capture files using legacy labels.
2. For each match, update the frontmatter `category` to the canonical value per the mapping table.
3. If the document materially spans multiple categories, consider splitting the content before reclassification.
4. After edits, execute the frontmatter validator against the updated files (see schema usage notes in `meta/templates/schema/pattern-frontmatter.json`).
5. Commit taxonomy changes alongside any related documentation or implementation updates; note the reclassification in the commit message for traceability.

## Change Log

- **2025-09-15**: Established canonical taxonomy, collapsed legacy synonyms, and reserved `operations`, `compliance`, and `enablement` for upcoming operations/support workstreams.

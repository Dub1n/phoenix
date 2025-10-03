---
date: 2025-09-14T183000Z
name: templum-utility-consolidation-onboarding
TASK-ID: ['TASK-ARCH-005-ONBOARD']
category: architecture-operations
status: ['[ ]']
tags: ['consolidation', 'onboarding', 'utilities', 'coordination']
dependencies: ['safe-consolidation-candidates', 'architecture-restructuring-plan', 'redundancy-report', 'pattern-usage-analysis', 'component-dependency-map']
---

# Templum Utility Consolidation Onboarding

## Purpose

Enable each agent to deliver a single utility consolidation (creation or rollout) without duplicating effort, breaking architectural guardrails, or missing prerequisite context.

## Orientation Sequence (60–90 min)

1. Read `Templum/dev/architecture/safe-consolidation-candidates.md` for scope and prioritisation.
2. Skim `Templum/dev/architecture/architecture-restructuring-plan.md` (core principles) and `Templum/dev/architecture/redundancy-report.md` (validated counts).
3. Review `Templum/dev/architecture/pattern-usage-analysis.md` + `Templum/dev/architecture/component-dependency-map.md` to understand preserved boundaries.
4. Open the pattern specification for your assigned utility (table below) and note API/usage commitments.
5. Inspect the current utility implementation in `Templum/src/utils/` (or confirm it still needs to be created) and spot impacted consumers via ripgrep before touching code.
6. Review `Templum/docs/current/testing-guide.md` to align on canonical test commands, Phase 6 scripts, and backend prerequisites before beginning Stage 2.

## Essential References

| Reference | Why It Matters |
|-----------|----------------|
| `safe-consolidation-candidates.md` | Canonical backlog, impact metrics, migration checklists.
| `architecture-restructuring-plan.md` | Non-negotiable architecture guardrails (zero-knowledge connectivity, dynamic skins, multi-interface separation).
| `redundancy-report.md` | Verified redundancy counts used in pattern frontmatter.
| `pattern-usage-analysis.md` | Confirms which separations must remain untouched during consolidation.
| `component-dependency-map.md` | Highlights oversized modules and cross-component dependencies.
| `meta/templates/schema/pattern-frontmatter.json` | Schema required when updating or adding pattern docs.
| `utility-consolidation-plans/PLAN_TEMPLATE.md` | Stage-by-stage plan skeleton, including Stage 3 multi-agent coordination.
| `docs/current/testing-guide.md` | Canonical matrix of Jest suites, Phase 6 scripts, and troubleshooting steps for consolidation validation.

## Shared Baselines

- Preserve the "Must Keep Separate" subsystems listed in `safe-consolidation-candidates.md` and `architecture-restructuring-plan.md` (service discovery, connection factory, command router, interface adapters, universal skin engine, interface manager).
- Follow AGENTS global directives: minimal-footprint APIs, SOLID thresholds, dependency injection, DRY, ≥80% coverage, and TDD-first for new utilities.
- Pattern docs must retain frontmatter compliance; use `Templum/dev/patterns/utilities/...` examples as structure references.
- Utilities must integrate with logger/error-handler/type-system hooks where applicable and expose chainable, fluent APIs as described in the pattern specs.
- Large migrations require staged commits; never revert unrelated user changes and keep file sizes <2000 lines.
- Stage 3 readiness summaries now point to Stage 4 lanes (prerequisites) and Stage 6 lanes (migration scope); keep those sections current because they remain the single source of truth for actionable tasks/tests.

## Single-Utility Workflow

1. **Claim & Align**
   - Claim an unchecked utility in `safe-consolidation-candidates.md` before editing files.
   - Confirm whether TypeScript implementation already exists (`Templum/src/utils/index.ts` lists exported utilities).
2. **Context Deep-Dive**
   - Read the pattern spec and note API/timing/logging requirements.
   - Cross-check redundancy counts with `redundancy-report.md` to anchor success metrics.
   - Map primary consumers via ripgrep (e.g. `rg "console" src/backend` for logger replacements).
3. **Plan the Work (Stage 1 & Stage 2)**
   - Document intended changes (files to touch, migration order) in your working notes and flag cross-component touchpoints.
   - For unimplemented utilities, draft interfaces + tests first (TDD). For existing utilities, list deltas needed before touching code.
4. **Orchestrate Migration Phases (Stage 3)**
   - After Stage 2 tests pass, map consumers into Stage 6 lanes (backend/core/interface/session or equivalent) and populate the Stage 4 + Stage 6 subsections in `utility-consolidation-plans/pattern-{{Pattern}}.md` with detailed tasks, tests, owners, and contingencies.
   - Use the Stage 3 section for a concise readiness summary (Stage 4 lane status, which Stage 6 lanes are pending, current risks) that points agents to the Stage 4/6 checklists.
   - Identify helper gaps or additional utility work; resolve immediately or add new Stage 4 lanes before updating the Stage 3 summary.
   - Record a Stage 3 entry in the activity log, tick the Stage 3 marker in `safe-consolidation-candidates.md`, and update the cohort schedule (`utility-consolidation-schedule.md`) so Stage 4 lane glyphs mirror the plan.
   - Call out the contingency path: if any Stage 6 lane uncovers a blocker, pause migrations, flip the Stage 3 tracker back to `[~]`, refresh the Stage 4/6 checklists and readiness summary, and log a new Stage 3 entry before resuming.
5. **Finalize Prereqs & Pattern Prep (Stage 4 & Stage 5)**
   - Work Stage 4 lanes (4a–4c) to `[x]` before touching consumer code; capture evidence for each gating test.
   - Complete Stage 5A cohort alignment (shared spec) and Stage 5B pattern preparation by iterating until every Stage 6 lane is unblocked: run the full gating battery, attach evidence/artefact paths in the plan, and only then flip trackers to `C[x]` / `P[x]` with the Stage 5 activity entry.
   - Maintain the cohort’s **Shared Dependencies Matrix** in the Stage 5 alignment spec and mirror the relevant rows into each pattern plan’s Stage 5B section so lane owners have local visibility into cross-pattern artefacts before migrations begin.
   - If new prerequisites emerge, return to Stage 3 to revise Stage 4/6 sections rather than forcing migrations forward. Split additional prerequisite work into new Stage 4 lanes when feasible so multiple agents can unblock together, and leave completed migrations in place unless the updated plan says otherwise.
6. **Execute Migrations (Stage 6)**
   - Claim Stage 6 lanes one at a time, apply the shared utility APIs, remove redundant helpers, and rerun the mandated gating suites before marking a lane complete.
   - Record migration progress in `safe-consolidation-candidates.md` checkboxes, update the schedule lane status, and capture evidence/commands in the activity log.
   - Surface architectural or DI conflicts immediately so the cohort can revisit Stage 3/Stage 5 if needed.
7. **Validate & Close (Stage 7)**
   - Run final validation suites (unit + smoke/Phase 6 scripts) and update documentation/pattern notes with the final API surface.
   - Log Stage 7 completion in the activity log, flip trackers to Stage 7 `[x]`, and note any follow-on work for future cohorts.

## Utility Assignment Matrix

### Category 1 – Core Infrastructure (Critical)

| Utility | Pattern Spec | Implementation | Primary Consumers / Notes | Status |
|---------|--------------|----------------|---------------------------|--------|
| Logger | `Templum/dev/patterns/utilities/core/logger.md` | `Templum/src/utils/logger.ts` | Backend router, service discovery, CLI/VSCode adapters, core orchestrator | Implemented; migrate callers |
| Error Handler | `Templum/dev/patterns/utilities/core/error-handler.md` | `Templum/src/utils/error-handler.ts` | Try/catch heavy back-end + skin engine modules | Implemented; migrate callers |
| Async Utils | `Templum/dev/patterns/utilities/core/async-utils.md` | `Templum/src/utils/async-utils.ts` | Timeout/retry code across backend and UI | Implemented; migrate callers |
| Event Utils | `Templum/dev/patterns/utilities/core/event-utils.md` | `Templum/src/utils/event-utils.ts` | EventEmitter usage (528 occurrences) | Implemented; migrate callers |

### Category 2 – Display & UI (High)

| Utility | Pattern Spec | Implementation | Primary Consumers / Notes | Status |
|---------|--------------|----------------|---------------------------|--------|
| Display Utils | `Templum/dev/patterns/utilities/display/display-utils.md` | `Templum/src/utils/display-utils.ts` | CLI display consistency engine, service ordering manager, layout engine | Implemented; migrate callers |
| Window Utils | `Templum/dev/patterns/utilities/display/window-utils.md` | `Templum/src/utils/window-utils.ts` | Window/border rendering inside CLI components | Implemented; migrate callers |
| Terminal Formatter | `Templum/dev/patterns/utilities/display/terminal-formatter.md` | `Templum/src/utils/terminal-formatter.ts` | All chalk styling (CLI adapters, terminal components) | Implemented; migrate callers |
| Theme Utils | `Templum/dev/patterns/utilities/display/theme-utils.md` | *(Create)* `Templum/src/utils/theme-utils.ts` | Theme loading + palette management in rendering layer | Pending implementation |

### Category 3 – Data Management (High)

| Utility | Pattern Spec | Implementation | Primary Consumers / Notes | Status |
|---------|--------------|----------------|---------------------------|--------|
| Validator | `Templum/dev/patterns/utilities/data/validator.md` | *(Create)* `Templum/src/utils/validator.ts` | Connection factory, service discovery, backend router | Pending implementation (placeholder removed) |
| Type Guards | `Templum/dev/patterns/utilities/data/type-guards.md` | *(Create)* `Templum/src/utils/type-guards.ts` | Runtime checks across interfaces + core | Pending implementation (placeholder removed) |
| Serialization Utils | `Templum/dev/patterns/utilities/data/serialization-utils.md` | *(Create)* `Templum/src/utils/serialization-utils.ts` | Skin definitions, config serialization, backend payloads | Pending implementation (placeholder removed) |
| Chainable String Utils | `Templum/dev/patterns/utilities/data/chainable-string-utils.md` | *(Create)* `Templum/src/utils/chainable-string-utils.ts` | Text formatting within UI components | Pending implementation (placeholder removed) |

### Category 4 – System Utilities (Medium)

| Utility | Pattern Spec | Implementation | Primary Consumers / Notes | Status |
|---------|--------------|----------------|---------------------------|--------|
| Path Utils | `Templum/dev/patterns/utilities/system/path-utils.md` | *(Create)* `Templum/src/utils/path-utils.ts` | Service discovery, connection factory, config loaders | Pending implementation (placeholder removed) |
| Configuration Utils | `Templum/dev/patterns/utilities/system/configuration-utils.md` | *(Create)* `Templum/src/utils/configuration-utils.ts` | Environment + config normalization | Pending implementation |
| Cache Utils | `Templum/dev/patterns/utilities/system/cache-utils.md` | *(Create)* `Templum/src/utils/cache-utils.ts` | Cache layers in backend/resource managers | Pending implementation |
| Performance Utils | `Templum/dev/patterns/utilities/system/performance-utils.md` | *(Create)* `Templum/src/utils/performance-utils.ts` | Timing/metrics across backend + UI | Pending implementation |

### Category 5 – Pattern Base (Medium)

| Utility | Pattern Spec | Implementation | Primary Consumers / Notes | Status |
|---------|--------------|----------------|---------------------------|--------|
| Registry Utils | `Templum/dev/patterns/utilities/registry-utils.md` | `Templum/src/utils/registry-utils.ts` | Command/menu registries, interface adapter registry | Implemented; migrate callers |
| Factory Utils | `Templum/dev/patterns/utilities/core/factory-utils.md` | *(Create)* `Templum/src/utils/factory-utils.ts` | Connection factory + adapter factories | Pending implementation |
| Resilience Utils | `Templum/dev/patterns/utilities/resilience-utils.md` | `Templum/src/utils/resilience-utils.ts` | Risk/fallback/performance monitors | Implemented; migrate callers |

### Category 6 – Business Logic (Medium)

| Utility | Pattern Spec | Implementation | Primary Consumers / Notes | Status |
|---------|--------------|----------------|---------------------------|--------|
| Navigation Utils | `Templum/dev/patterns/utilities/core/navigation-utils-utility.md` | *(Create)* `Templum/src/utils/navigation-utils.ts` | Breadcrumb manager, exit handler, skin navigation parser | Pending implementation (placeholder removed) |
| Protocol Utils | `Templum/dev/patterns/utilities/core/protocol-utils.md` | `Templum/src/utils/protocol-utils.ts` | IPC/HTTP/WebSocket connection handling | Implemented; migrate callers |
| Service Utils | `Templum/dev/patterns/utilities/core/service-utils-utility-pattern.md` | *(Create)* `Templum/src/utils/service-utils.ts` | Service ordering manager, health monitoring | Pending implementation (placeholder removed) |

### Category 7 – Development Tools (Low)

| Utility | Pattern Spec | Implementation | Primary Consumers / Notes | Status |
|---------|--------------|----------------|---------------------------|--------|
| Test Utils | `Templum/dev/patterns/utilities/dev/test-utils.md` | *(Create)* `Templum/src/utils/test-utils.ts` | Integration validation framework, hybrid validation system, shared mocks | Pending implementation (huge payoff) |
| Debug Utils | `Templum/dev/patterns/utilities/dev/debug-utils.md` | *(Create)* `Templum/src/utils/debug-utils.ts` | Developer-only diagnostics + profiling | Pending implementation |

## Coordination Protocols

- **Avoid overlap**: Only touch components listed under your utility’s “Files Using This Pattern” checklist plus immediate dependencies discovered via ripgrep.
- **Log conflicts early**: If migration affects another in-flight utility (e.g., logger + async utils in same function), coordinate on shared refactors before pushing changes.
- **Testing discipline**: Add or update focused unit tests per utility; where suites are missing, note them in the summary and request direction before large harness work.
- **Documentation updates**: Mirror API changes into the relevant pattern doc and ensure the frontmatter timestamps stay accurate.
- **Status reporting**: After merging changes, tick the relevant checkboxes in `safe-consolidation-candidates.md` and capture migration metrics achieved.

## Deliverables Checklist (per agent)

- Updated or newly created utility code in `Templum/src/utils/` + corresponding tests.
- Consumer migrations aligned with minimal-footprint API expectations.
- Pattern documentation adjusted if implementation deviates from existing spec.
- Validation evidence: tests executed, redundancy reduction measured, architectural guardrails re-verified.
- Status + notes recorded in `safe-consolidation-candidates.md`.

Adhering to this onboarding ensures every agent works from the same architectural playbook while independently advancing utility consolidation without stepping on each other’s work.

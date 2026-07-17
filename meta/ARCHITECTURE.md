# VDL Vault Architecture Framework

## Purpose

- Establish a living map of the active projects (Templum, Phoenix Code Lite, Haruspex, Validation System) and how they are intended to interoperate.
- Capture the reality of the current state so future sessions can validate code paths, trim dead fronts, and rebuild the skin-based UI stack without rediscovering context.
- Provide a scaffold that can be expanded project-by-project as deeper research and verification work is completed.
- Reinforce that these systems are internal tooling whose purpose is to help VDL2 meet its regulated obligations.

## Scope & Exclusions

- **In Scope:** Templum (interface orchestrator), Phoenix Code Lite (QMS workflow engine), Haruspex (analysis/prediction backend), Validation System (agent-driven quality harness), repo-level integration concerns.
- **Out of Scope for now:** Shimdex, DSS/Litany, historical documentation exercises not needed for immediate Templum/PCL/Haruspex bring-up.

## Ecosystem Summary Snapshot

| Project                 | Role                                                                                                                                      | Target State                                                                               | Current Reality                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Templum                 | Universal skin-driven interface layer for VSCode/CLI/command tooling.                                                                     | Backend router ready, CLI/UI generated from skins, multiple backends attach seamlessly.    | Backend routing reportedly working; Templum now owns the public Universal Skin Definition JSON schema and keeps runtime schema helpers in source.                           |
| Phoenix Code Lite (PCL) | Internal QMS workflow engine translating regulations into actionable development data and automating compliance workflows for VDL2 teams. | Provides QMS tooling, emits skin definitions for Templum, no legacy code-gen surface left. | Still contains large portions of original agent-oriented code-gen stack; QMS rework docs exist but code status uncertain; front-end not adapted to skins.                   |
| Haruspex                | Analysis ~~+ prediction~~ backend to support agent/dev workflows.                                                                         | Pure HTTP backend with auto-registration + skin export for Templum.                        | Migration from VSCode extension partially designed; `provideSkinDefinition()` now emits a Templum-schema-conforming skin, while live endpoint verification remains pending. |
| Validation System       | Category-driven validation orchestrator for agents and humans.                                                                            | Acts as shared quality gate for repo projects.                                             | Appears operational; used to coordinate per-project commands; needs confirmation it still runs end-to-end.                                                                  |

## Integration Overview

- **Desired topology:**
  - PCL and Haruspex expose backends (HTTP + skin definitions) → Templum discovers via auto-registration → Templum renders universal interface (VSCode/CLI) → Validation System supports runtime checks across projects.
- **Reality check points:**
  - Haruspex now has a Templum-conforming skin payload in code; PCL skin emission and live Haruspex endpoint verification remain pending before Templum has reliable live UI feeds.
  - Routing pipeline in Templum needs verification with stubbed or real backends.
  - Validation System may rely on project scripts that drifted during partial refactors.

---

## Project Dossiers

### 1. Templum

- **Mission Snapshot:** Extracted universal-interface layer intended to stop rewriting bespoke CLIs across projects, acting as backend router + renderer.
- **Current Implementation Notes:**
  - Backend discovery/service router documented as functional; relies on priority-based scanning and chokidar observers.
  - CLI/skin rendering layer is being replaced with a single character-grid presentation runtime; payload/generator plumbing exists, but the live interactive CLI still has competing hardcoded and procedural paths. The public skin contract is `Templum/schemas/universal-skin-definition.schema.json` and source TypeScript/Zod schema helpers remain runtime implementation code, not public schema artifacts.
  - Utilities consolidation and logging/error handling refactors planned but not executed.
  - [Pattern taxonomy reference](Templum/docs/current/pattern-taxonomy.md): Canonical category enum and maintenance process.
- **MVP Focus (must-land before first release):** zero-knowledge discovery + multi-protocol registration, schema-backed skin validation, shared session/context, skin-driven rendering (including the character-grid CLI runtime), Practical Developer Guide prompts/notifications that auto-complete deterministic checks, backlog tooling visibility aligned with the final YouTrack decision, manual overrides & lifecycle broadcasts, observability instrumentation with clean shutdown, Haruspex/PCL skin ingestion, and stable coverage/CI tooling.
- **Post-MVP Opportunities (Deferred):**
  - Universal Skin Engine convergence refactor.
  - Asset/localisation validator suite.
  - Adapter extensions beyond CLI/VSCode (e.g., MCP).
  - Feature flag/audit hook frameworks.
  - Mock/real dual-run automation polish (Phase 6 extras).
  - Enterprise release packaging and documentation consolidation.
- **Ideal Requirements (target architecture):**
  - **Universal Interface Core**
    - Maintains zero-knowledge backend registry; discovers services via auto-registration, filesystem watches, and explicit connect operations without prior schema coupling.
    - Enforces the Templum-owned versioned skin contract (schema validation, backward-compatibility negotiation, error reporting).
    - Exposes unified session/context layer shared across all interface adapters.
  - **Backend Connectivity**
    - Accepts registration from any compliant backend over HTTP/IPC; performs health checks, authentication, retry/backoff, and status broadcasting.
    - Surfaces connection lifecycle events (discovered, connected, degraded, disconnected) to interfaces and logs.
    - Provides configuration override support (manual add, priority ordering) without compromising zero-knowledge behaviour.
  - **Skin-Driven Rendering Pipeline**
    - Consumes skin payloads describing views, menus, workflows, commands, theming, accessibility metadata.
    - Generates interface structures exclusively from skin data—no hardcoded navigation, prompts, or command wiring.
    - Supports a character-grid CLI presentation runtime (windows, dialogs, forms, tables, input, and terminal lifecycle) with keyboard navigation derived from skin descriptors.
    - Validates skin assets (media, localization, command bindings) before exposing them to interfaces.
  - **Interface Delivery**
    - Provides CLI experience with dynamic windowed TUI, menu navigation, command execution, and contextual help sourced from skin.
    - Provides VSCode extension views (webviews/tree views) that mirror the same skin hierarchy, including interaction state syncing with CLI.
    - Surfaces developer-discipline notifications, design-review acknowledgements, and sprint risk prompts driven by Phoenix Code Lite metadata, auto-completing deterministic checks and limiting manual confirmations to outstanding actions.
    - Offers extensible adapter contract for future interfaces (e.g., command-only mode) without touching backend router logic.
  - **Operations & Observability**
    - Emits structured metrics (connection stats, command latency, user interactions) for QMS/validation consumption.
    - Implements logging/audit hooks compatible with regulated environments (traceable actions, immutable history, configurable retention).
    - Supports configuration-driven feature flags to scale down enterprise options for MVP without code changes.
- **Integration Touchpoints to Map:**
  - Auto-registration contract expected from Haruspex/PCL (HTTP endpoints, Templum-owned skin schema) and how Templum consumes them.
  - Dependency injection layout and adapter registry vs. actual imports in code.
  - Session management expectations for multi-interface use.
- **Evidence & Documentation To Collect:**
  - Working demo or logs proving backend router discovers at least one real backend.
  - Sample skin definition currently consumed (if any) and validation against `universal-skin-definition.schema.json`.
  - CLI generation status: commands produced, gaps, TODO markers in code.
  - Inventory of enterprise features vs. MVP requirements to decide on deferral.
  - Proof that developer-discipline prompts auto-complete deterministic checks, including stored acknowledgements for design reviews and sprint risk updates.
  - Updated onboarding/help content reflecting backlog tooling decision and links into Phoenix Code Lite workflows.
- **Open Risks & Unknowns:**
  - Potential over-engineering delaying functional MVP.
  - Discovery code depending on file system state not aligned with current dev setups.
  - Lack of verified skins could hide misalignments in renderer assumptions.

- **[Current-State Spec](Templum/docs/current/architecture-spec.md):** (updated with reality checks; verify flagged sections before assuming production readiness).
- **[Progress Tracker](Templum/docs/current/progress.md):** (status of ideal requirements; update alongside spec).
- **[Task Logs](Templum/dev/tasks/):** (e.g., [unified-session-layer](unified-session-layer.md)).
- **Ideal-State References:** [plans](Templum/dev/architecture/) and [flows](Templum/dev/CLI/) document the end goal. Keep in sync with the spec when implementation progresses.
- **Pending Review / Verification Files:**
  - [ValidationSystem-V3C-Documentation](Templum/docs/target/ValidationSystem-V3C-Documentation.md) — confirm which V3C features will ship and sync with Validation System team.
  - [observability-infrastructure](Templum/docs/archive/observability-infrastructure.md) & [TEST-HEALTH-MONITORING](Templum/docs/archive/TEST-HEALTH-MONITORING.md) — historical detail retained; revisit after verifying observability rollout.

### 2. Phoenix Code Lite (QMS edition)

- **Mission Snapshot:** Transitioned from agent workflow generator to an internal QMS tooling stack that lets VDL2 teams translate regulatory source material into governed requirements, guided workflows, and audit-ready evidence.
- **Current Implementation Notes:**
  - QMS documentation roadmap extensive; technical code may still reflect old workflow generation patterns.
  - Front-end/UI layer not stripped; no skin emission for Templum yet.
  - Unknown health of build/tests after regulatory refactor attempts.
- **Ideal Requirements (target architecture):**
  - **QMS Domain Model**
    - Represents design inputs, requirements, risks, verification activities, CAPA records, and release packages with immutable audit history.
    - Supports bidirectional traceability (requirement ⇄ design ⇄ test ⇄ release) with exportable matrices suitable for IEC 62304 and AAMI TIR45 evidence.
    - Stores regulatory metadata (standards clauses, status, owners, timestamps) in structured, queryable form.
    - Ingests regulatory source material (e.g., EN 62304, MDR Rule 11) via guided workflows or assisted parsing so classifications/obligations become first-class data.
    - Maintains a live risk register linking mitigations to requirements and deterministic validator evidence.
    - Documents release evidence bundle schema and SSI-QF replacement crosswalk so compliance can trace obligations without legacy forms.
  - **Workflow Automation & Assistance**
    - Orchestrates lifecycle states for work items (draft → review → approved → released) with gated transitions and electronic signatures where needed.
    - Generates QMS artifacts (forms, reports, SOP references) programmatically from data model; exports to markdown/PDF.
    - Guides developers and QA through compliance-critical tasks with contextual instructions, checklists, and SOP shortcuts.
    - Integrates with Validation System to attach automated check results to work items, blocking promotion when validators fail.
    - Provides configurable templates for different release types (prototype, production, emergency fix) with tailored validation bundles.
    - Stores formal design review records including reviewer roles, independence flags, and timestamps sourced from Templum acknowledgements.
    - Emits Practical Developer Guide metadata/events so deterministic follow-ups auto-complete and manual prompts are minimised.
    - Records backlog tooling decision (YouTrack or justified alternative) and surfaces integration hooks for Templum onboarding.
  - **Interface & Skin Output**
    - Emits Templum skin describing dashboards, task boards, review flows, and report viewers—no bespoke UI code remains.
    - Supplies contextual help and SOP references alongside each workflow step within the skin definition.
    - Supports multi-role interfaces (QA, developer, auditor) through skin-based permissions and tailored menu sets.
  - **Integration & Extensibility**
    - Offers API/CLI endpoints for ingesting commit metadata, linking external repositories, and synchronizing validation results.
    - Supports plug-in validators/adapters (e.g., tying into external CI pipelines) while maintaining QMS traceability.
    - Provides audit logging hooks aligned with regulatory requirements (tamper detection, retention policies, time sync).
    - Hosts regulatory ingestion adapters (guided UI flows, assisted parsing pipelines) so new requirements are captured without rewriting the core engine.
  - **Operational Guarantees**
    - Enforces configuration validation at startup (ensuring required validators, templates, storage paths exist).
    - Supports offline/online modes matching future distributed deployment (local data store with sync queues).
    - Generates release packages (zip/pdf bundle) containing all necessary QMS evidence ready for submission or audit.
- **Integration Touchpoints to Map:**
  - Planned skin definition generator (where to hook in, data sources).
  - Interfaces with Validation System (commands, categories, config files).
  - Any remaining Claude Code dependencies that may conflict with QMS focus.
- **Evidence & Documentation To Collect:**
  - Actual runtime status: npm scripts that still succeed/fail.
  - Code areas still oriented around code-gen vs. QMS workflows.
  - Data models supporting QMS (requirements, traceability) and their readiness for UI exposure.
  - Dependency audit for regulated environment compatibility.
  - Drafted crosswalk documenting evidence bundle schema + SSI-QF replacement and backlog tooling decision note.
  - Proof that risk register ledger, design review record store, and developer metadata events produce exports consumed by Templum.
- **Open Risks & Unknowns:**
  - Legacy logic causing dead paths or conflicting assumptions once skins added.
  - Potential security/compliance gaps if old agent features remain active.
  - Lack of clarity on how Rust/web deliverable interfaces with PCL services.

- **[Current-State Spec](phoenix-code-lite/docs/current/architecture-spec.md):** Summarises QMS pivot and outstanding work.
- **[Supplemental Diagrams](phoenix-code-lite/docs/current/index/ARCHITECTURE-DIAGRAM.md):** Legacy context diagrams—see spec for current caveats.
- **[Progress Tracker](phoenix-code-lite/docs/current/progress.md):** Mirrors QMS requirements status.
- **[Task Logs](phoenix-code-lite/dev/tasks/):** e.g., [skin-exporter](phoenix-code-lite/dev/tasks/skin-exporter.md).
- **[Ideal-State References](docs/03-PCL-QMS/):** Notably [09-Current-State](docs/03-PCL-QMS/09-Current-State.md), [03-QMS-via-PCL](docs/03-PCL-QMS/03-QMS-via-PCL.md) capture the regulated target model.
- **Pending Review / Verification Files:**
  - [Phoenix-Code-Lite-Specification](phoenix-code-lite/docs/archive/Phoenix-Code-Lite-Specification.md) — legacy Claude/TDD spec kept for reference; confirm if any sections need porting to QMS docs.
  - [CLI-IMPLEMENTATION-SUMMARY](phoenix-code-lite/dev/cli/CLI-IMPLEMENTATION-SUMMARY.md) — confirm applicability once CLI is skin-driven.
  - [Claude folder](phoenix-code-lite/src/claude/) & related agent modules — audit for deprecation during QMS migration.

### 3. Haruspex

- **Mission Snapshot:** Originally an agent-support VSCode extension; now migrating to a backend providing analysis/prediction services consumable via Templum.
- **Current Implementation Notes:**
  - Detailed 2.1 spec and backend entry point exist; actual service likely mixes mocks, hard-coded responses, and unfinished migrations.
  - Haruspex's local skin payload type is no longer treated as canonical; emitted skins conform to Templum's public JSON contract.
  - Front-end components (webviews) still present; extension architecture not fully decoupled.
  - Debugging architecture plan introduces IPC + CLI tools for state inspection; status unclear.
- **Ideal Requirements (target architecture):**
  - **Repository Intelligence Core**
    - Ingests entire codebase (multi-language support prioritising TypeScript/Rust/Markdown) with incremental updates and caching.
    - Generates structural representations (module graphs, dependency matrices) and semantic summaries without relying on LLM hallucination.
    - Detects files lacking required metadata/frontmatter and inserts or proposes standardized stubs with provenance tracking.
  - **Analysis & Visualization**
    - Produces programmatic analyses: architecture drift reports, coupling metrics, change impact assessments, risk flags tied to QMS requirements.
    - Renders diagrams (Mermaid, graph data) derived from analysis pipeline, keeping source-of-truth data available via API.
    - Supports user-driven queries (e.g., “show components touching validator pipeline”) via structured filters rather than free-form chat.
  - **Service & API Layer**
    - Exposes HTTP API for analyses, metadata updates, diagram assets, and job control; supports streaming for long-running tasks.
    - Implements job scheduling, progress tracking, cancellation, and result storage for repeatable audits.
    - Registers with Templum auto-registration and publishes a skin describing dashboards, code navigation, reports, and diff viewers.
  - **Skin-Defined Presentation**
    - Provides navigation hierarchies for repository views (overview → subsystem → file → analysis results) entirely through skin payloads.
    - Includes workflows for initiating analyses, approving frontmatter updates, exporting reports, all mediated by Templum interfaces.
    - Supports dual interface delivery (CLI/VSCode) with synced state and notifications issued via skin-defined channels.
  - **Operational & Compliance**
    - Maintains auditable logs of analyses performed, inputs, outputs, and user approvals.
    - Enforces access controls for write operations (e.g., frontmatter injection) and integrates with repo authentication where applicable.
    - Provides extension hooks for future static-analysis engines and language parsers without altering core API.
- **Integration Touchpoints to Map:**
  - Auto-registration and HTTP endpoints expected by Templum (health, Templum-schema skin, command execution).
  - Prediction/analysis engines to validate (real vs. placeholder data sources).
  - Logging/metrics required by Validation System and future audits.
- **Evidence & Documentation To Collect:**
  - Live test of backend-main service: endpoints available, sample responses, and `GET /getSkinDefinition` returns the Templum-conforming payload.
  - Inventory of mocks/placeholders inside src/ (e.g., search for TODO/MOCK tags).
  - Transition status of VSCode extension components, what can be deprecated.
  - Verification of CLI debugging tools and IPC handshake.
- **Open Risks & Unknowns:**
  - Hidden dependencies on VSCode APIs preventing pure-backend operation.
  - Placeholder data providing false sense of readiness.
  - Model/prediction pipelines unspecified or missing.

- **[Current-State Spec](Haruspex/docs/current/architecture-spec.md):** updated with migration caveats.
- **[Progress Tracker](Haruspex/docs/current/progress.md):** tracks migration readiness of backend.
- **[Task Logs](Haruspex/dev/tasks/):** e.g., [backend-skin-generator](Haruspex/dev/tasks/backend-skin-generator.md).
- **Ideal-State References:** [architecture folder](Haruspex/dev/architecture/) & [03-debugging folder](Haruspex/dev/03-debugging/) documents outline the desired backend + tooling experience.
- **Pending Review / Verification Files:**
  - [Haruspex-2.0-spec.md](Haruspex/docs/archive/Haruspex-2.0-spec.md) — decide whether any content aids the migration notes.
  - [01-Claude-Code-Integration-Architecture.md](Haruspex/docs/archive/01-Claude-Code-Integration-Architecture.md) — legacy integration doc kept for historical reference; ensure new backend fully decouples from Claude.
  - [extension.ts](Haruspex/src/extension.ts), [extension-enhanced.ts](Haruspex/src/extension-enhanced.ts) — evaluate for removal after backend separation.
  - [providers/ folder](Haruspex/src/providers/) and [omponents/ folder](Haruspex/src/components/) that emit WebViews — confirm which can be replaced by skin outputs.

### 4. Validation System

- **Mission Snapshot:** Agent-usable validation orchestrator providing repeatable category checks across projects.
- **Current Implementation Notes:**
  - Documentation indicates name-based project configs, automatic fallback to package scripts, and extension workflows for new validators.
  - Validation artifacts are centralized under `scripts/validation/results/` rather than stored in the repository-level `dev/` folder or individual project trees.
  - Requires confirmation that orchestrator runs with current dependencies and project configurations.
- **Ideal Requirements (target architecture):**
  - **Validation Orchestrator Core**
    - Executes validation suites defined by category/scope across heterogeneous projects with deterministic sandboxing.
    - Supports dependency graph of validators (pre-checks, post-checks) and shared resources (build artifacts, temp workspaces).
    - Provides configuration discovery (per-project manifests) with schema validation and helpful remediation guidance.
  - **Validator Modules**
    - Defines strict interface for validators (metadata, inputs, outputs, severity) enabling plug-and-play extension.
    - Ships with baseline categories (build, test, quality, security, documentation) and allows project-specific overrides.
    - Captures machine-readable results (JSON, JUnit) plus human-readable summaries for QMS ingestion.
  - **Integration Points**
    - Offers API/CLI invocation supporting both standalone use and embedding inside PCL workflows.
    - Produces artifacts consumable by PCL (traceability links, release gating decisions) and emits events that Templum UI can surface.
    - Supports remote execution triggers (CI/CD, agent workflows) with idempotent reruns and resume capabilities.
  - **Observability & Governance**
    - Tracks executions with audit logs, environment metadata, tool versions, and signed results for compliance.
    - Monitors validator performance/health, raising alerts for flapping or outdated checks.
    - Provides policy engine to declare required validators per release type, failing fast when coverage is incomplete.
  - **Future Interface Enablement**
    - Publishes skin metadata (even if initially minimal) so results can be visualized through Templum without custom UI code.
    - Exposes subscription hooks/webhooks for streaming progress to interfaces or other systems.
- **Integration Touchpoints to Map:**
  - Config files for PCL/Templum/Haruspex and whether they reference accurate paths/scripts.
  - Expected outputs consumed by other tooling (reports, dashboards).
  - Security or sandbox constraints when invoked by agents.
- **Evidence & Documentation To Collect:**
  - Successful execution logs for key categories (backend, ui, build) against each project.
  - Inventory of validators vs. project needs; identify missing categories.
  - Review fallback command resolution vs. actual package.json scripts.
- **Open Risks & Unknowns:**
  - Rot in project configurations causing false positives/negatives.
  - Lack of automated tests ensuring orchestrator compatibility with evolving Node versions.
  - Missing coverage for new Templum/Haruspex workflows (e.g., skin validation).

- **[Current-State Spec](scripts/validation/docs/current/architecture-spec.md):** callouts added for re-validation of command assumptions.
- **[Progress Tracker](scripts/validation/docs/current/progress.md):** status of validator ecosystem goals.
- **[Task Logs](scripts/validation/dev/tasks/):** e.g., [policy-engine](scripts/validation/dev/tasks/policy-engine.md).
- **Ideal-State References:** [VALIDATION-SYSTEM-ARCHITECTURE-README](scripts/validation/docs/target/architecture/VALIDATION-SYSTEM-ARCHITECTURE-README.md) + [CORE-VALIDATION-README](scripts/validation/docs/current/guides/CORE-VALIDATION-README.md) describe the intended modular validator ecosystem.
- **Pending Review / Verification Files:**
  - [README.md](scripts/validation/templates/README.md) — confirm templates still match orchestrator expectations.
  - [project manifests folder](scripts/validation/config/) — audit for drift once per project integration resumes.

---

## Cross-Cutting Concerns (Placeholders for Detailed Write-ups)

- **Skin Definition Contract:** Define schema expectations, source-of-truth repositories, versioning strategy, and validation tooling.
- **Runtime Topology:** Document local dev vs. deployment (e.g., how Templum discovers services running on localhost, port management, environment variables).
- **QMS Alignment:** Map how each service enables VDL2 teams to satisfy regulated workflows (traceability, audit logs, security controls) without the tooling itself becoming the regulated deliverable.
- **Agent/Human UX:** Clarify how Claude Code (if still used) interacts with new architecture, and what human operator tooling remains necessary.
- **Security & Compliance:** Analyze authentication, authorization, and logging once services are network-facing.

---

## Research & Verification Checklists

### Repository-Wide

- [-] Confirm README/CLAUDE.md guidance aligns with actual project priorities and excludes deprecated initiatives. *superceded by AGENTS.md*
- [ ] Map all active npm scripts to ensure they execute successfully or document failures with root causes.
- [ ] Inventory documentation vs. code drift; flag files whose content predates major refactors (esp. pre-QMS PCL docs).
- [ ] Validate shared TypeScript/Node versions across projects to avoid tooling conflicts.
- [ ] Ensure Validation System configs exist for each in-scope project and reference the correct paths.

### Templum

- [ ] Run discovery workflow against a live or stub backend and capture the resulting service tree.
- [ ] Verify connection factory supports required protocols for near-term projects (HTTP, IPC if still needed).
- [ ] Audit CLI generation output: commands available, missing flows, runtime errors.
- [ ] Review universal skin engine assumptions vs. Haruspex's Templum-conforming skin and future PCL skins; note mismatches.
- [ ] Identify and prioritise enterprise-grade features that can be deferred to achieve MVP stability.

### Phoenix Code Lite (QMS edition)

- [ ] Build the project (`npm run build`) and log any failures/regressions.
- [ ] Run existing test suites (unit/integration) to evaluate current coverage claims.
- [ ] Trace one end-to-end QMS workflow in code to confirm it reflects regulated use-cases, not legacy agent flows.
- [ ] Determine scope of front-end components awaiting conversion to skin definitions; document dependencies.
- [ ] Catalogue external services/dependencies (Claude Code, PDF tooling, etc.) and assess necessity for QMS target.

### Haruspex

- [ ] Launch the standalone backend (run `node` against [backend-main.js](dist/src/backend-main.js) or equivalent) and verify health, analysis, and skin endpoints.
- [ ] Inspect responses for mock/placeholder content; flag areas needing real implementations.
- [ ] Evaluate dependency on VSCode APIs by running without VSCode context; record failures.
- [ ] Exercise debugging CLI/IPC tools to ensure agent workflows are functional.
- [ ] Verify the live endpoint serves the Templum-compliant skin definition already emitted by `provideSkinDefinition()`.

### Validation System

- [ ] Execute representative validations (`backend`, `ui`, `build`) against each project; record pass/fail with notes.
- [ ] Confirm project config files reference real scripts and directories; update missing entries.
- [ ] Review validator code for outdated assumptions (e.g., old CLI paths, deprecated commands).
- [ ] Test new-validator submission pipeline end-to-end to ensure extension process still works.
- [ ] Align validation outputs with QMS reporting needs (storage location, retention, audit trails).

---

> This framework is intentionally skeletal. Each section should be expanded with concrete findings, code references, and validation logs as future sessions progress.

# Milestone Playbook — Templum ↔ Haruspex Skin Handshake

## 1. Summary

- **Milestone name:** Milestone 01 — Templum ↔ Haruspex Skin Handshake
- **Target window:** 2025-10-07 → 2025-10-28 (adjust per planning cycle)
- **Primary outcome:** Templum discovers the Haruspex backend via the zero-knowledge registry and renders a verified skin flow in CLI/VSCode from Haruspex-exported data.
- **Leads:** Project coordination — Gabri · Automation reviewer — assigned per cycle

## 2. Scope & Boundaries

- **Included:**
  - Haruspex backend auto-registration and skin emission (`Haruspex/dev/tasks/backend-skin-generator.md`).
  - Templum backend discovery and skin rendering path (`Templum/dev/tasks/multi-protocol-auto-registration.md`, `Templum/dev/tasks/zero-knowledge-registry.md`, `Templum/dev/tasks/skin-payload-consumption.md`, `Templum/dev/tasks/cli-skin-generator.md`, `Templum/dev/tasks/cli-character-grid-renderer.md`).
  - Validation System smoke coverage for the new workflow (existing backend category).
- **Excluded:**
  - Phoenix Code Lite integration and cross-product release gating.
  - Manual override flow, feature flags, or enterprise observability hardening.
  - Production-ready documentation for partners (captured in later milestones).
- **Entry criteria:**
  - `Templum` repo builds and baseline tests pass (`npm run build`, `npm test`).
  - Haruspex HTTP server boots without VSCode dependencies (`npm run build && node dist/src/backend-main.js --dry-run`).
- **Exit criteria:**
  - Generated Haruspex skin JSON validated against `Templum/schemas/universal-skin-definition.schema.json` (AJV tests green).
  - Templum CLI renders Haruspex workflows purely from skin data (no hardcoded fallbacks).
  - Evidence ledger updated with artifacts + Validation System backend category run against Haruspex.

## 3. Workstreams

| Stream                     | Intent                                                                                          | Key tasks                                                                                               | Owners                             |
| -------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Backend Discovery & Health | Ensure Templum auto-registers Haruspex over IPC/HTTP with correct health metadata.              | `Templum/dev/tasks/multi-protocol-auto-registration.md`, `Templum/dev/tasks/zero-knowledge-registry.md` | Agent rotation (Templum platform)  |
| Skin Export Pipeline       | Produce deterministic Haruspex skin payload and endpoint that conform to Templum's public schema. | `Haruspex/dev/tasks/backend-skin-generator.md`                                                          | Agent rotation (Haruspex backend)  |
| Skin-Driven Rendering      | Consume skin in Templum CLI/VSCode, retire hardcoded menus, ensure CLI generator uses metadata, and route the live CLI through the character-grid runtime. | `Templum/dev/tasks/skin-payload-consumption.md`, `Templum/dev/tasks/cli-skin-generator.md`, `Templum/dev/tasks/cli-character-grid-renderer.md` | Agent rotation (Templum interface) |
| Validation & Evidence      | Run Validation System backend category + targeted tests; capture outputs.                       | Validation System backlog (no specific task file yet)                                                   | Assigned once automation drafted   |

## 4. Agent Operating Instructions

- **Briefing cadence:**
  - Post async update in `reports/workflow/m01-status.md` at start/end of each work session (template forthcoming).
  - Coordinator reviews status twice weekly and resolves blockers.
- **Pre-flight checklist:**
  - `npm run lint` (repo root) before committing changes.
  - Targeted tests per task definition (e.g., `npm test -- src/tests/backend/service-discovery.test.ts`).
  - `node scripts/validation/run-backend-smoke.js` (Templum) after integrating new discovery logic.
- **Handoff protocol:**
  - Attach diff summary referencing files and tests run.
  - Update relevant `dev/tasks/*.md` Definition of Done checklist items.
  - Deposit artifacts (skin JSON, logs) under `reports/integration/haruspex/` with timestamped subdirectories.
- **Documentation updates:**
  - `Templum/docs/current/progress.md` and `Haruspex/docs/current/progress.md` status markers.
  - `Templum/docs/current/1.2-Backend-Integration-Guide.md` Haruspex section.
  - `Haruspex/docs/current/architecture-spec.md` snapshot notes once skin endpoint live.
  - `meta/ARCHITECTURE.md` when contract ownership or handshake status changes.

## 5. Evidence Ledger

| Artifact | Location | Produced by | Notes |
| --- | --- | --- | --- |
| Haruspex skin payload (`haruspex-skin.json`) | `reports/integration/haruspex/<YYYYMMDD>/skin.json` | Haruspex stream | Ensure Ajv validation output against `universal-skin-definition.schema.json` is stored alongside payload |
| Templum discovery log | `reports/integration/haruspex/<YYYYMMDD>/templum-discovery.log` | Backend discovery stream | Capture run of `npm run phase6-services` with Haruspex online |
| CLI render snapshot | `reports/integration/haruspex/<YYYYMMDD>/cli-render.md` | Skin rendering stream | Include screenshots or text transcripts |
| Validation System backend report | `reports/validation/haruspex/<YYYYMMDD>/backend.json` | Validation stream | Run `node src/core/enhanced-orchestrator.js --project haruspex --category backend` |

## 6. Automation & Quality Gates

- **Smoke scripts:**
  - `npm run phase6-services -- --services haruspex` (must exit 0).
  - `npm test -- src/tests/backend/service-discovery.test.ts src/tests/backend/generic-backend-integration.test.ts`.
  - `node scripts/validation/run-backend-smoke.js --project haruspex` (new helper once added).
- **CI hooks:**
  - Optional GitHub Action `haruspex-skin-smoke.yml` (to be added) running nightly; coordinator to enable once milestone stabilises.
- **Blocking conditions:**
  - AJV contract validation failure on skin payload.
  - Validation System backend category regression.
  - Missing or outdated artifact entries for more than 48 hours.

## 7. Coordination Log

- 2025-10-07 — Kick-off notes: confirm agent availability and validate entry criteria.
- Add entries as decisions or blockers arise.

## 8. Post-Milestone Tasks

- `Templum/dev/tasks/haruspex-integration.md` — extend to VSCode evidence once CLI flow stable.
- Draft milestone 02 playbook (PCL skin ingestion) using lessons learned.
- Retro session: capture automation gaps and doc updates (file under `meta/workflows/notes/m01-retro.md`).

---

## Usage

1. Run a short kick-off where you assign owners per stream:
    - Discovery/health (Templum registry tests)
    - Skin export (Haruspex backend)
    - Rendering (Templum CLI/VSCode)
    - Validation/evidence capture
2. For each stream, give the agent its specific task files plus the milestone playbook; call out:
    - Entry/exit criteria for their lane
    - Required pre-flight commands and expected artifacts
    - Where to log outputs (reports/, progress docs)
3. Schedule asynchronous sync points (e.g., daily status updates into the coordination log) so you can catch blockers early and adjust staffing.

Once the milestone runs, take a pass through the evidence ledger to verify artifacts landed, then move on to the next playbook. This keeps coordination light but still ensures every stream has clear accountability.

---

> Store this playbook under `meta/workflows/` and update sections as tasks progress. Future milestones should reuse the template in `meta/templates/milestone-playbook.md`.

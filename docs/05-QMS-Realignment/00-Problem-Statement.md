# Problem Statement

## 1. Business & Product Context

VDL2 is the next major release of the company’s hospital reporting platform, replacing the ageing VDL release that hospitals license today. The product is used internationally by clinical teams to view device telemetry, analyse results against predefined templates, and produce regulatory reports. Deployment happens per hospital: a central on-prem host stores the data, while staff connect through desktop terminals. VDL2 keeps that model but modernises the experience—a single webview-based GUI must connect either to a remote backend the company operates or to a local runtime for offline hospitals. The rewrite moves from a manually compiled C/C# codebase with no automated testing to a Rust-led stack with automated tests, faster iteration, and a UI that can be deployed in both connected and offline scenarios. Without this upgrade, every release continues to demand thousands of manual checks, the system remains brittle, and developers cannot keep pace with regulatory scrutiny or product roadmap changes.

## 2. Current Workflow & Quality Pain Points

The existing QMS and SOP workflow depends on copying giant Microsoft Word and Excel templates, renaming files by hand, and filling audit fields based on what testers see in the legacy GUI. Each release requires testers to step through a long checklist of hotkeys, dialog confirmations, and file inspections while toggling between a laggy application and an equally laggy Word document. Forgetting to duplicate a template can overwrite the canonical checklist; mistyped filenames or serial numbers ripple into audit packages. Excel-based forms contain brittle formulas that silently mis-evaluate pass/fail results. Any change to numbering schemes, regulatory clauses, or hardware variants forces someone to manually edit every template—filled and unfilled—across the entire library. Because the tooling cannot automate GUI interactions or read screen state, even partial attempts to script the checks fail, leaving developers back at square one. The compounded friction slows releases, increases error risk, and makes evidence gathering tedious for both software and hardware workflows.

## 3. Regulatory & Standards Drivers for VDL2

VDL2 must demonstrate compliance with BS EN 62304:2006+A1:2015 life-cycle processes, EU MDR 2017/745 general safety and performance requirements, MDD 93/42/EEC essential requirements, UK MDR 2002 (as amended), Canadian Medical Device Regulations SOR/98-282, and analogous US FDA expectations. The development approach should also align with Agile guidance from AAMI TIR45-2023. Software safety classification under IEC 62304 is expected to be Class B, but the team still needs to confirm the final risk analysis; that decision drives the level of evidence and traceability required. Because VDL2 introduces a cloud-accessible deployment option, the team must verify which cybersecurity or data-protection regulations apply beyond the existing hardware-focused scope. Patient data handling remains intentionally out of scope for the internal tooling—developers will model those obligations in VDL2 itself without flowing real patient data through the QMS stack.

## 4. Internal Tooling & Project Landscape

- **Templum** is the universal interface layer that should expose QMS workflows through CLI, VS Code, and other skins without hardcoding backend details. Today it lacks finished skin ingestion and still carries enterprise-grade ambitions that can be deferred for the MVP.
- **Phoenix Code Lite (PCL)** is positioned as the QMS workflow engine: it owns regulated data models, traceability, release governance, and the artefact generation that replaces Word/Excel checklists. The implementation still contains legacy agent workflows and has no skin exporter yet.
- **Haruspex** captures repository intelligence and developer-facing analysis. It should feed deterministic analysis data and skin definitions into Templum rather than rendering its own UI. The current backend still leans on VSCode-era code paths and placeholder handlers.
- **Validation System** orchestrates automated validators. It can provide the gating logic and evidence runs that PCL consumes, but its Phase 6 harness currently relies on mocked data and randomised scores, so the evidence is not yet audit-ready.
- **Other processes**: The company operates critical business workflows in a 15-year-old shared Excel workbook and similar manual forms. While not the focus of this pass, the architecture should allow future CRUD backends to emit skins through Templum so operational teams can leave those brittle tools behind.

## 5. Core Problem Statement

We must deliver an internal QMS tooling stack that replaces manual Word/Excel checklists and produces auditor-ready evidence for VDL2 development teams so they can ship compliant software on schedule, despite legacy processes, brittle templates, and the absence of skin-driven interfaces today.

## 6. Scope Boundaries

**In scope now:**
- Build a Templum-first MVP that developers, firmware engineers, and operations staff can use to run QMS workflows without touching Word/Excel.
- Consolidate PCL, Haruspex, and Validation System capabilities where they accelerate VDL2 development, even if some modules need rewriting.
- Produce machine-readable artefacts (reports, traceability exports, validator logs) that auditors can understand in lieu of the old SOP documents.

**Out of scope / deferred:**
- Handling or storing real patient data, implementing HIPAA/GDPR workflows, or introducing production-grade cybersecurity features in the internal tooling.
- Replacing the company’s entire Excel-based ERP stack during this pass—future CRUD backends may be added once approved.
- Preserving every “enterprise-grade” capability documented for Templum; the priority is a reliable interface, even if the zero-knowledge contract temporarily allows controlled manual configuration.

## 7. Desired Outcomes & Signals of Success

- Teams can run QMS, release, and hardware checklists entirely inside the new tooling with no manual Word/Excel edits, confirmed by an auditor-ready export per release.
- Traceability from requirement to validation result is generated automatically, with validator identifiers and logs captured from the Validation System or its successor.
- Release evidence packages are produced within a sprint cadence (e.g., 24–48 hours after a tagged build) and presented in a format auditors accept without rework.
- Operations staff avoid re-entering data across multiple forms; when CRUD pilots land, a single entry propagates to all required artefacts.
- Developers experience faster iteration because automated checks replace the current thousand-step manual GUI scripts.

## 8. Open Questions / Information Gaps

- **IEC 62304 classification:** Confirm Class B or adjust tooling expectations accordingly (owner: regulatory lead).
- **Cloud/cybersecurity scope:** Determine which additional standards apply once VDL2 supports remote hosting (owner: regulatory lead with engineering support).
- **Validation harness credibility:** Decide whether to rehabilitate the Phase 6 harness or replace it with deterministic validators that auditors can trust (owner: validation/QMS team).
- **CRUD backend roadmap:** Identify when to introduce additional backends to replace company-wide Excel/Word processes and secure stakeholder approval (owner: product lead).
- **Templum zero-knowledge contract:** Document any temporary deviations from the zero-knowledge registry and track remediation tasks so the MVP doesn’t ossify non-compliant patterns (owner: Templum tech lead).

Update this problem statement as decisions land—the aims, solution alignment, and traceability matrix rely on it staying accurate.

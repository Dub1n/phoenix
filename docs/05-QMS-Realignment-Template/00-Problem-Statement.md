# Problem Statement Worksheet

Use this worksheet to articulate why the QMS realignment effort exists and what must change. Keep the narrative tight—auditors and stakeholders should understand the situation without reading other files first.

## 1. Business & Product Context

- Summarise the product, target users, deployment model, and why the upgrade is needed.
- Start from the facts in `docs/00-QMS/Info.md` (medical device, international use, Rust rewrite, web + offline modes).
- Highlight the risk of continuing with the current C/C# release and manual processes.

## 2. Current Workflow & Quality Pain Points

- List the concrete problems with the existing QMS/SOP stack (e.g. Word/PDF sprawl, missing traceability links, manual audits).
- Tie each pain point to how it slows delivery or undermines compliance.
- Call out where developers or quality teams struggle day-to-day (e.g. manual test evidence, unclear hand-offs).

## 3. Regulatory & Standards Drivers

- Cite the non-negotiable standards: EN 62304-2006+A1:2015 as baseline, Agile integration via AAMI TIR45, ISO 13485 if applicable.
- State the IEC 62304 safety classification once confirmed; if unknown, leave a placeholder and flag it in `20-Progress-and-Gaps.md`.
- Mention that cybersecurity obligations are pending scoping and patient-data handling is intentionally deferred for now.

## 4. In-Flight Project Landscape

- Briefly summarise the intended role of Templum, Phoenix Code Lite, Haruspex, and Validation System using the target-state descriptions in `meta/ARCHITECTURE.md`.
- Identify where each project currently diverges from those targets (e.g. PCL still has legacy code-gen surface, Templum lacks live skins).
- Note any other systems or manual processes that will interact with the new QMS.

## 5. Core Problem Statement

- Express the single problem the QMS must solve in one to three sentences.
- Format suggestion: "We must [goal] for [product/team] so that [regulatory/business outcome], despite [constraints]."
- Ensure the statement reflects both compliance evidence and developer workflow integration.

## 6. Scope Boundaries

- Clarify what this effort will tackle now vs. what stays out of scope (e.g. no patient data processing, cybersecurity plan pending, external vendor tools excluded unless justified).
- Mention assumptions about tools (Git-based docs, Templum UI surfaces, etc.).

## 7. Desired Outcomes & Signals of Success

- List the measurable outcomes that prove the problem is solved (e.g. automated traceability from requirement to validation, audit-ready evidence generated from CI).
- These items will later become aims/objectives; keep them broad here and quantify detail in `05-Aims-and-Objectives.md`.

## 8. Open Questions / Information Gaps

- Record unanswered questions (e.g. safety class confirmation, data-retention rules, validation environment readiness).
- Link each question to an owner or follow-up plan where possible.

Update this worksheet whenever new information lands; the downstream docs depend on it staying accurate.

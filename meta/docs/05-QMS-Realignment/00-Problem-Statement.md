# Problem Statement

## 1. Business & Product Context

VDL2 is the next major release of our hospital reporting software. It replaces today's VDL program, which hospitals license to view device readings, analyse results, and produce regulatory reports. Each hospital runs the software on a central on-site computer, and staff connect to it from their desks. VDL2 keeps that "installed per hospital" model but modernises the experience:

- A single desktop application window (implemented as a webview) can connect to different back-end systems. Those systems may be operated by us, by the hospital's own IT team, by a trusted hosting partner, or by a local offline copy for hospitals with limited connectivity.
- The existing system was written in a mix of C and C# with many manual steps and no automated tests. VDL2 moves to a modern codebase (the team is evaluating Rust alongside other components) and embeds automated testing. That approach helps us catch issues sooner and deliver updates more quickly.

If we do not make this upgrade, every release will continue to require a significant amount of manual checking, the system will remain fragile, and deadlines driven by regulators or the product roadmap will become harder to meet.

## 2. Current Workflow & Quality Pain Points

Our Quality Management System (QMS) is the rulebook and set of records we use to prove the product is safe, effective, and thoroughly tested. Today's process leans heavily on Standard Operating Procedures (SOPs) maintained in Word documents and Excel spreadsheets. Testers copy large templates, rename files manually, and fill in audit fields based on what they observe in the ageing VDL software.

In day-to-day operations:

- Each release means working through long checklists of keyboard shortcuts, dialog confirmations, and file inspections, while moving between a slow application and an equally slow Word document.
- Forgetting to duplicate a template can overwrite the official checklist. Typos in filenames or serial numbers spread through audit bundles.
- Tools such as TestComplete can automate only limited portions of the workflow, so testers are left with an inefficient half-manual, half-automated process that can be slower than performing the entire workflow manually.
- Excel forms in our current QMS have fragile formulas. When numbering schemes, regulations, or hardware versions change, someone must adjust every single template across the library, whether it is already filled or still blank.
- Formal design reviews required by IEC 62304 Section 5.6 live in email threads, meeting minutes, or personal notebooks rather than a central log. Independent reviewer participation is hard to prove because the Word/Excel workflow does not capture roles or timestamps. - 'DP' (Development Process.pdf) §3.2
- Risk management updates outlined in IEC 62304 Section 7 rely on ad-hoc spreadsheets or personal reminders. Sprint reviews rarely revisit the risk register, and there is no single place where mitigations, requirements, and verification results are linked ('DP' §7).
- Traceability between requirements, implementation, and verification is rebuilt sprint-by-sprint. The official matrix (SSI-QF-20C) often lags by weeks, so engineers do not trust it during planning even though the PDF stresses continuous traceability (§4.2, §9.3).
- Release evidence bundles are assembled manually from assorted folders and emails, making it difficult to satisfy the pre-release checks called out in 'DP' §§6.3–6.4 and §§8.1–8.3.
- Developer discipline items described in the Practical Developer Guide (branch naming, TDD, Definition of Done checkpoints) are enforced by tribal knowledge. There is no automation to show whether the expected unit tests or documentation updates happened, so audit evidence is fragile ('DP' Practical Developer Guide pp.14–22).
- Backlog tooling is fragmented. Some teams track QMS actions in Trello, others in GitHub Projects, and the knowledge base is scattered. The PDF recommends YouTrack because it combines backlog management, knowledge base, and GitHub integration, but we have not made a definitive decision or communicated it broadly ('DP' Software Comparison pp.29–31).

This overhead delays releases, increases the likelihood of errors, and makes it difficult to gather evidence for both software and hardware workstreams.

## 3. Regulatory & Standards Drivers for VDL2

VDL2 must still meet all regulatory obligations. The key standards and laws are:

- **BS EN 62304:2006+A1:2015** - the lifecycle process standard for medical software.
- **EU MDR 2017/745** and **MDD 93/42/EEC** - European medical device rules defining safety and performance.
- **UK MDR 2002 (as amended)** - the UK version of medical device regulations.
- **Canadian Medical Device Regulations SOR/98-282** and comparable US FDA expectations - the North American rule set.
- **AAMI TIR45-2023** - guidance on how to use Agile practices inside a regulated environment (we already outlined this in 'DP').

We expect the software safety class under IEC 62304 to be **Class B** (medium risk), but the final risk assessment will confirm that. The classification determines the depth of traceability and evidence required. Because VDL2 introduces an option to host parts of the system in the cloud, we also need to determine which cybersecurity or data-protection rules apply in addition to the existing hardware-focused requirements.

Important boundary condition: our internal tooling will not handle real patient data. Developers will manage those obligations inside VDL2 itself, so personal data does not pass through the QMS tools.

## 4. Internal Tooling & Project Landscape

- **Templum** - This operates as the universal control layer for QMS tasks. It is intended to run the same actions from a command-line window, VS Code, or any other "skin" (an interchangeable view of the same workflow). The skin ingestion capabilities remain unfinished, and selected enterprise-grade ambitions can be deferred until after the Minimum Viable Product (MVP).
- **Phoenix Code Lite (PCL)** - This is the workflow engine. It stores the regulated data, keeps track of which requirements map to which tests (traceability), and should produce the reports that currently live in Word/Excel. The goal is to link dependent steps so that, for example, testing a new build automatically triggers the compliance checks and produces the audit-ready report. The implementation still carries legacy workflows and cannot yet export skins.
- **Haruspex** - This tool analyses our repositories and provides developer-facing insights. Instead of presenting its own interface, it should supply structured analysis data and skin definitions to Templum so that a single interface serves the user. The current version still references placeholder code paths from its early VS Code plugin days.
- **Validation System** - This component coordinates automated validation runs. It can assert "pass" or "fail" with supporting evidence. PCL will consume those results to build the quality records.
- **Other processes** - The company runs other critical workflows (for example in manufacturing or customer support) that will eventually transition away from Word/Excel. The same tooling approach should support them once the QMS pathfinder succeeds.

## 5. Problem Statement Summary

Continuing to rely on the manual QMS workflow puts release speed, traceability, and compliance at risk. The existing templates, manual evidence gathering, and partial automation attempts are insufficient for VDL2's scope. We need a system that reduces manual effort without compromising auditor confidence.

## 6. Proposed Focus

- Automate evidence capture by integrating Validation System outputs directly into the traceability chain in PCL (so test results are stored automatically).
- Provide a universal interface through Templum skins so colleagues can run QMS actions inside familiar tools (command line or VS Code) without relying on manual file copies.
- Retire the Word/Excel templates by generating audit-ready artifacts directly from the automated workflows.
- Remain aligned with the regulatory standards listed above by ensuring the new setup captures the required documents, signatures, and traceability links.

## 7. Alternatives Considered

### 7.1 Current SOP/QF Workflow (Status Quo)

- **Strengths:** Already approved for the existing Visi-Download releases. Auditors recognise document IDs like SSI-SOP-20 and SSI-QF-20A through 20S, and the process ties clearly back to the BS EN 62304 clauses. It also works for hardware development and test logging.
- **Limitations:** Everything is manual. Every checklist or report is a Word/Excel template that people must copy, rename, and complete. The SOP does not connect to source control, automated tests, or validator outputs, so developers must re-create evidence outside their primary tools. Updating versions means editing every form by hand, including ones that were already filled in, which increases the risk of drift or transcription errors. There is no real-time traceability or safeguard to guarantee Class B expectations are met.
- **Fit for VDL2:** Poor. The SOP leaves out legacy software like Visi-Download, and it assumes manual reviews for Class A/B software. It cannot scale to continuous integration, to releases that happen often, or to both online and offline deployments. It also cannot surface evidence quickly enough for sprint reviews.

### 7.2 Commercial QMS Platforms

- **Strengths:** Offer hosted workflows, electronic signatures, and ready-made FDA/MDR templates. They reduce the effort needed to set up documentation from scratch.
- **Limitations:** These tools run as separate web portals with limited ways to integrate (small APIs). They rarely align with our custom validation pipelines and cannot provide a single interface across all developer tools. Migrating Stowood's mix of hardware and software processes would still require significant bespoke work. Most vendors expect a cloud-first, patient-data-heavy environment, which would slow our internal development cadence. Licensing and data residency concerns add risk, and once adopted these products are difficult to exit.
- **Fit for VDL2:** Partial. They can hold document libraries but cannot automate the testing and traceability evidence already living in code. Developers would still need to duplicate information between systems, and firmware work would stay separate.

### 7.3 Proposed Internal Stack

- **Strengths:** Places QMS actions inside the tools we already use (Templum in the command line and VS Code), reuses Validation System outputs, and keeps evidence together in version control. Skins mean future "CRUD" back-ends (systems that let you Create, Read, Update, and Delete records such as sales or shipping) can reuse the same interface, supporting the broader move away from Word/Excel. The architecture supports both online and offline deployments.
- **Limitations:** We need upfront engineering time to finish the PCL exporters/traceability modules and to strengthen Validation System outputs. Governance features such as electronic signatures and an audit trail view must be built deliberately so auditors remain satisfied.

## 8. Desired Outcomes & Signals of Success

- Teams can complete QMS, release, and hardware checklists entirely inside the new tooling with no manual Word/Excel edits. Each release produces an export an auditor can accept without rework.
- Traceability from each requirement to the matching validation result is produced automatically. Validator IDs and logs come directly from the Validation System or whichever tool replaces it, consistent with Development-Process-1.pdf §4.2 and §9.3.
- Release evidence packages are ready within a sprint cadence (target 24–48 hours after tagging a build) and arrive in an auditor-ready format.
- Operations staff avoid re-entering the same data in multiple places. When we implement CRUD pilots, entering information once updates every required artifact.
- Developers can iterate faster because automated checks replace today's numerous manual GUI steps.
- Design reviews capture the named reviewer roles, independence confirmation, and approval timestamps that Development-Process-1.pdf §3.2 calls for.
- Risk controls and mitigations stay current during the sprint cadence (Development-Process-1.pdf §7) with a live register that links to verification evidence.
- Practical Developer Guide checkpoints (branch discipline, TDD, Definition of Done, documentation updates per Development-Process-1.pdf pp.14–21) show up where engineers work, logging confirmations automatically when deterministic signals are available.
- Backlog tooling choices preserve simplicity, integrated knowledge capture, and GitHub visibility on par with the YouTrack recommendations in Development-Process-1.pdf (pp.29–31), even if we pick an alternative.

## 9. Open Questions / Information Gaps

- **IEC 62304 classification:** Confirm Class B or adjust tooling expectations accordingly. *(Owner: regulatory lead.)*
- **Cloud/cybersecurity scope:** Decide which extra standards apply once VDL2 supports remote hosting. *(Owner: regulatory lead with engineering support.)*
- **CRUD backend roadmap:** Plan when to add the other back-end systems that will replace company-wide Word/Excel processes, and secure stakeholder approval. *(Owner: product lead.)*
- **Templum zero-knowledge contract:** Write down any temporary exceptions to the "zero-knowledge" rule (Templum should not assume details about a specific backend) and schedule fixes so the MVP does not cement bad patterns. *(Owner: Templum lead with product lead support.)*

Update this problem statement as decisions are made. The goals, the link to the solution, and the traceability matrix rely on this document remaining accurate.

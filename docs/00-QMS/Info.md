# Info

## General

What: Medical device software
Where: International
When: Development soon, deployed when ready
Who: To be used by hospitals for displaying and analysing recorded data and producing reports on the data/analysis. Made by small company in England
Why: New version of the pre-existing software. Upgrade to be forwards compatible, easier to fix bugs, run faster, update easier, easier to use, visual overhaul.

## Code

Existing version:

- written in C or C#
- partially manually compiled
- no MVVM (backend is frontend)
- runs locally
- no integrated tests, manually tested before every update
New version:
- Written all in Rust
- Integrated unit tests (ideally for backend and frontend so no manual testing needed)
- Web-based: the interface will be a web page (or web-view? i.e the same thing runs in a browser but could be a local app that just displays it) and the backend runs on a remote server such as, but not necessarily, AWS. Can run on any standard browser (not on mobile)
- Local version: the same interface will be able to connect to a local runtime for offline machines (ideally the same code, or as much of the same code as possible, the remote server uses) (runs on windows but would be good to run on MacOS if a port is easy)

## Regulations

QMS: The current software meets a list of regulations and is subject to auditing, in which the auditors go through the documentation the company has written to show how the software meets the regulations. These are called QMS (Quality Management System) and are entirely written by the company, or partners of the company, specifically for the company's devices/software.
SOP: There is an SOP (Standard Operating Procedure) written for future software releases but is currently unused. This is 'SOP-20 Software Development', and is a single word document that describes how the software and its development meets the regulations, linking to QFs (Quality Forms) and QCs (Quality Charts). QFs and QCs are filled in on a per-software basis, i.e. for the new software the relevant QFs and QCs would be filled in with the specifics of the software.

Regardless of what the form of it is, the company needs a QMS to show how the software is compliant with the regulations so that it can complete an assessment before deployment and stay compliant after deployment to pass audits.

The current SOP does not specify anything other than meeting the regulations, and is not specific to any development workflow or cycle. The company wants to use AGILE development practices going forward with the new software, which will require considerations to how the regulations can both be met and be shown to be met (via the QMS). There is an appropriate document written by AAMI: TIR45-2023 Guidance on the use of AGILE practices in the development of medical device software.  

Ideally, the QMS would be both documenting for assessment purposes and also instructive for development purposes (as the developers must follow the regulations anyway). It would be possible to have a separate instructional document(s) but keeping the docs synced/linked would be necessary.

The QMS doesn't need to be a word document or even text document; it could be in Jira (or Confluence) or any other form of documentation that is easy to follow for traceability and easy to update/use for the development and use of the QMS. Ideally it would not use a proprietary file format, instead using plaintext/markdown or similar, for ease of moving to a new software if needed (should another appear more appropriate or the one in use goes down; inevitably one of these will happen).

If the QMS isn't the current SOP, it will need to be as thorough as the current SOP in terms of showing how the software meets regulations and which regulations are shown to be met. It can use the current SOP as a template or reference, but wouldn't need to be a copy of it and shouldn't be reliant on it, such as using it as a reference.

One possible contention with the current QMS is that within the SOP there are no links (or way of linking) to the QFs or QCs, so when going through the SOP the assessor must find the relevant documents manually (there might be several of each, one for each device/software that uses it). While being modular and reusable are beneficial, having these aspects can be true for other setups that fix the above issue.

The QMS should be useable from a developer's perspective, and be easy to follow/complete while developing the software. If it is possible, having a way to integrate/link code to the QMS (such as with code stubs and unit tests) would be ideal. The work should "speak for itself" in a way that is also legible to an assessor that doesn't look at the code itself.

## SOP20 - Software Development

Here is some information on the current QMS for software development, which has been created by a partnering regulations expert but not yet put to use. It is written for the scope of the current software and may not meet the criteria for the to-be-written new software

### Regulations met

- BS EN 62304:2006+A1:2015 Medical Device Software – life-cycle processes
- EU MDR 2017/745 (EUMDR) - general safety and performance requirements
- MDD 93/42/EEC (MDD) - essential requirements
- UK MDR 2002 (as amended) (UKMDR) - essential requirements
- SOR/98-282 Canadian Medical Device Regulations - analogous requirements
- US FDA - analogous requirements

### Documents

- SOUP documentation 210929 to be incorporated in SOP-20.docx
- SSI-QF-10C Design Review iss5.docx
- SSI-QF-10D Traceability Matrix iss5.xlsx
- SSI-QF-10E Design Transfer Checklist iss3.docx
- SSI-QF-10G Design Change Record and Evaluation Form iss6.docx
- SSI-QF-10P Problem Report Software & Hardware iss4.docx
- SSI-QF-20A Software Safety Classification iss1.docx
- SSI-QF-20B Software Development Plan iss1.docx
- SSI-QF-20C Software Requirements Traceability Matrix iss1.xlsx
- SSI-QF-20D Software Architecture Design iss1.docx
- SSI-QF-20E Software Test Protocol iss1.docx
- SSI-QF-20F Software Test Report iss2.docx
- SSI-QF-20G Software Maintenance Plan iss2.docx
- SSI-QF-20H Software Maintenance Report iss2.docx
- SSI-QF-20I Software Development Summary Report iss1.docx
- SSI-QF-20J Software Release Version Control (was 10-F) iss2.docx
- SSI-QF-20K Software Checklist Iss4 (was 10J).doc
- SSI-QF-20L Software Build Numbers Summary of Changes iss2 (was 10N).doc
- SSI-QF-20M Firmware Programmable Part Release Rev 1 (was QF-10S).doc
- SSI-QF-20N Software or firmware code iss1.docx
- SSI-QF-20O Documenting SOUP (or OTS-off the shelf) Software.docx
- SSI-QF-20P 1.256 Software requirements specification.doc
- SSI-QF-20Q 1.284 Software functional specification.doc
- SSI-QF-20R 1.378 Software User Requirements.doc
- SSI-QF-20S (Was QF-10E) 3.285 Visi-Download analysis verification.doc
- SSI-SOP-20 Software Development iss3.docx

## Task

My task is to take a look over the current QMS and see if it is sufficient for the current software, see if it works with AGILE (or can be adjusted), think about alternatives to the SOP (such as the format of it or even use a completely different QMS), then create/complete the QMS for this software as much as can be done prior to development.

## AGILE

### AAMI TIR45-2023 Guidance on the use of AGILE practices in the development of medical device software

"This Technical Information Report (TIR) provides perspectives on the application of AGILE during medical device software development. It relates them to the following existing standards, regulations, and guidance:

- ISO 13485:2016, Quality management systems─Requirements for regulatory purposes;
- IEC 62304:2006+AMD1:2015, Medical device software–Software life cycle processes;
- ISO 14971:2019, Medical devices─Application of risk management to medical devices;
- FDA Code of Federal Regulations (CFR), Title 21, Part 820.30, Quality System Regulation: Design Controls;
- FDA Guidance for the content of premarket submissions for software contained in medical devices;
- FDA General principles of software validation; Final guidance for industry and FDA staff."

"AGILE emphasizes the need for the team to own its practices, inspect them, adapt them, and optimize them to their context. Regulatory requirements emphasize the need to establish a robust quality management system. Within the context of an established quality management system, AGILE practices can be applied without disrupting the quality system and without raising undue concern among regulators."

"Establish robust change management systems to manage changes and mitigate risks associated with rapid change."

### 62304:2006

"A life cycle model must be defined and shown to address the required elements of the 62304 standard"

## References

[What is Product Development? The 6 Stage Process \[2024\] • Asana](https://asana.com/resources/product-development-process)

## Questions

- [ ] Do we need to follow "ISO 13485:2016, Quality management systems─Requirements for regulatory purposes" and if so do we already?

## Roadmap

From Analysis to a Compliant Agile QMS:
    > **Phase 1: Deep Analysis & Gap Assessment**
    > *Goal: Understand exactly what you have, what you need, and where the gaps are.*

1. **Deconstruct SOP-20 and its Artifacts:**

    - **Action:** Create a master table or spreadsheet.

    - **Columns:** List every document (SOP-20, all QFs). For each, map it to the specific clauses of the key regulations it claims to satisfy, primarily **IEC 62304**.

    - **Purpose:** This forces a deep understanding of the existing QMS's structure and intent. It will reveal if the coverage is as thorough as claimed and provide a baseline for your new system.

2. **Agile Gap Analysis (AAMI TIR45):**

    - **Action:** Read AAMI TIR45. As you do, critically compare its recommendations to the workflow implied by SOP-20.

    - **Ask:** How does the current QMS handle iterative development? How would a `SSI-QF-20P Software requirements specification.doc` be managed when requirements evolve with each sprint? How is the "Definition of Done" for a user story captured and verified in a way that satisfies an auditor?

    - **Purpose:** To identify the fundamental friction between the current document-centric, waterfall-style QMS and an Agile workflow.

3. **Technology & Architecture Gap Analysis:**

    - **Action:** List the new technological components (Cloud hosting, Rust toolchain, Web front-end, potential WebView for local app) and assess the current QMS's ability to cover them.

    - **Key Gaps to look for:**

        - **Cybersecurity:** A web-based, server-hosted application has a vastly different threat profile than a local C# app. SOP-20 likely has little to no coverage here.

        - **SOUP Management:** Rust's package ecosystem (`crates.io`) is a huge strength, but every crate is SOUP (Software of Unknown Provenance). How will you document, justify, and monitor these dependencies? Your `SOUP documentation 210929 to be incorporated in SOP-20.docx` is a starting point, but it needs to be adapted for a package-manager-driven workflow (e.g., using `cargo-audit` and `cargo-deny`).

        - **Cloud Infrastructure:** If you use AWS, your QMS needs to address the "shared responsibility model." You must document your configuration, disaster recovery, and data integrity procedures for the cloud environment.

    - **Purpose:** To ensure the QMS is not just philosophically aligned but technically capable of managing the new stack.

    > **Phase 2: Strategy, Tooling & Architecture**
    > *Goal: Decide **how** you will build and manage the new QMS.*

4. **Define the QMS Architecture:**

    - **Action:** Based on the gap analysis, choose the format for your new QMS. You've identified the pain point of disconnected Word/Excel documents.

    - **Option A: The "Living QMS" (Atlassian Stack):**

        - **How:** Use Confluence for the SOP and descriptive documents. Use Jira for all "records" (QFs). A requirement is a Jira ticket. A bug report is a Jira ticket. A design change is a Jira ticket. Linkage is native.

        - **Pros:** Excellent traceability, purpose-built for Agile, familiar to many developers.

        - **Cons:** Proprietary lock-in. Exporting for an audit can be clunky if not planned for.

    - **Option B: The "Docs-as-Code" QMS (Git-based):**

        - **How:** The entire QMS (SOP, procedures, records) is written in Markdown and stored in a Git repository alongside the source code. Traceability is achieved through commit hashes and linking in issue trackers (like GitHub Issues or Jira).

        - **Pros:** Version control is inherent. Plaintext format is future-proof. Developers can use the same tools for code and documentation. "The work speaks for itself" is easier to achieve.

        - **Cons:** Requires more discipline. Tooling for audits (e.g., generating a clean, signed PDF of the "state" of the QMS at release) needs to be built or configured.

    - **Purpose:** To make a foundational decision that aligns with your company's preferences for open standards and practical workflows.

5. **Define the Agile-Compliant Workflow:**

    - **Action:** Map regulatory concepts to Agile artifacts.

    - **Example Mapping:**

        - `Software Requirement` -> A specific type of Jira Issue / tagged GitHub Issue.

        - `Risk Control Measure` -> A specific sub-task linked to a Requirement issue.

        - `Verification Test` -> A unit/integration test in the Rust code, linked back to the Requirement issue. The CI pipeline passing becomes part of the verification record.

        - `Release` -> A Git tag, which triggers a build and the automatic generation of release notes and a QMS summary report.

    - **Purpose:** To create a concrete, step-by-step process that a developer can follow sprint-to-sprint while remaining compliant.

---

## Answering Your Specific Questions

Here are direct answers to the questions you posed.

- Framework to think about this?

    The Iterative V-Model is the best mental framework. The traditional V-model (Requirements -> Design -> Implementation -> Verification -> Validation) is still required. However, in an Agile context, you execute a mini-V-model for each feature or user story within a sprint. AAMI TIR45 provides guidance on how these small, iterative V-cycles roll up to satisfy the overall V-model for the entire release.

- More information needed?

    Yes, three critical pieces of information are needed before you can finalize the QMS:

    1. **Software Safety Classification (IEC 62304):** Is this Class A, B, or C? The level of required documentation and rigor depends almost entirely on this. This should be determined by a risk analysis of the device's potential to harm a patient. `SSI-QF-20A Software Safety Classification iss1.docx` is the place to start.

    2. **Cybersecurity Requirements:** Given the web-based nature, you will need to comply with cybersecurity regulations and guidance. This includes the FDA's cybersecurity guidance and the EU's MDCG 2019-16. This will add new requirements for threat modelling, vulnerability management, and secure design that are likely missing from SOP-20.

    3. **Data Privacy Requirements:** Does the software handle patient data? If so, GDPR in the EU and HIPAA in the US will apply. This introduces requirements for data protection, consent, and breach notifications.

- How can the information be formatted to be more helpful?

    A Traceability Matrix is the single most helpful document you can create. It's what auditors live for. Your SSI-QF-20C is a starting point, but you should envision a more dynamic version. An ideal matrix links:

    User Need -> Software Requirement -> Architectural Design Element -> Risk Control -> Code Module/Function -> Verification Test Case -> Validation Result

    This provides end-to-end traceability and is the backbone of a defensible QMS.

- What would a standard cloud-based medical device QMS look like?

    It would look very similar to your existing list of documents (requirements, design, test plans, etc.) but with additional sections/documents covering:

  - **Cloud Provider Qualification:** A document justifying the choice of AWS (or another provider), outlining their compliance (e.g., ISO 27001), and defining the shared responsibility model.

  - **Infrastructure-as-Code (IaC) Validation:** Procedures for testing and validating your cloud configuration scripts (e.g., Terraform, CloudFormation).

  - **Cybersecurity Risk Management Plan:** This runs in parallel to the safety risk management plan.

  - **Data Backup and Disaster Recovery Plan:** A formal, tested plan for what happens if a server or region goes down.

- What other regulations might apply?

    Beyond what's listed and what I've added above (cybersecurity, data privacy), you must also consider:

  - **IEC 62366-1 Usability Engineering:** Since you're doing a visual overhaul and focusing on ease of use, you'll need to follow a formal usability engineering process. This involves analyzing user tasks, identifying use-related risks, and validating that the UI is safe and effective.

## Next Steps

1. **Create a Mind Map:** Put "Compliant Agile QMS" in the centre. Create main branches for the phases above: `Analysis`, `Strategy`, `New Regulations`, `Tooling`. Under each, branch out with the specific tasks and questions. This will give you a visual overview of the entire problem space.

2. **Start with Phase 1:** Begin the deep analysis of SOP-20 and the gap assessments. Don't write the new QMS yet. The goal for now is to generate questions and identify all the missing pieces.

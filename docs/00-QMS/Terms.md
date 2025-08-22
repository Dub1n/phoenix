**AGILE:**
 with respect to software or product development, term that does not denote a specific methodology, approach, or practice (i.e., there is no generally accepted, specific AGILE methodology) but rather an umbrella term that is typically applied when software or product development 1) fits with the spirit of the Manifesto for AGILE Software Development, see https://agilemanifesto.org/ [16], 2) is more empirical than deterministic, and 3) is EVOLUTIONARY and frequently iterative; the AGILE Alliance, see http://www.agilealliance.org, describes “AGILE Software Development” in the following manner: “In the late 1990’s several methodologies began to get increasing public attention. Each had a different combination of old ideas, new ideas, and transmuted old ideas. But they all emphasized close collaboration between the programmer team and business experts; face-to-face communication (as more efficient than written documentation); frequent delivery of new deployable business value; tight, self-organizing teams; and ways to craft the code and the team such that the inevitable requirements churn was not a crisis.” Definitions of the generic word AGILE usually include “quick,” “well-coordinated,” “adaptable,” and other similar words and are qualities that typically pertain to AGILE development
 ^AGILE

**ACCEPTANCE TEST - DRIVEN DEVELOPMENT (ATDD):**
 form of TEST - DRIVEN DEVELOPMENT that concentrates on applying TDD at the feature or STORY level, based on acceptance tests developed for requirements at those levels; therefore, ATDD generally involves a cross-functional team test approach with users, customers, and others beyond quality assurance (QA) representatives and technical engineers/developers; ATDD may also involve VALIDATION in addition to VERIFICATION
 ^ATDD

**BACKLOG:**
 Set of work to be DONE; in AGILE terms, a BACKLOG is usually a list of user/customer-meaningful functionality or features that is ordered in terms of value and encompasses the breadth of the system or product to be built (i.e., is MECE, mutually exclusive and collective exhaustive), but not necessarily the depth in terms of detail; BACKLOGS should encompass all work that a team must do in order to facilitate effective prioritization and planning, and therefore can include functional and non-functional/infrastructure items as well as defects; also termed “product BACKLOG” when the BACKLOG describes all the product work to be DONE, and as “ITERATION BACKLOG” for work to be completed during a specific ITERATION
 ^Backlog

**BUILD:**
 operational version of a system or component that incorporates a specified subset of the capabilities that the final product will provide
 ^Build

**BURNDOWN:**
 specific type of progress tracking chart that focuses attention on capabilities implemented/target value delivered (BURNUP) or capabilities left to implement/target value remaining (BURNDOWN); these types of charts can be used within any level (PRODUCT LAYER, RELEASE, INCREMENT, STORY) and can also be used for task hours tracking (work completed/remaining); because of the AGILE focus on results rather than activity, however, at least one level of progress chart should be on value-oriented progress; with iterative approaches, usually at least two levels of progress charts are maintained, one for the overall progress and one for particular ITERATION(s) underway; progress in value delivery is often termed “velocity” and is a key AGILE-related measure
 ^Burndown

**BURNUP:**
 specific type of progress tracking chart that focuses attention on capabilities implemented/target value delivered (BURNUP) or capabilities left to implement/target value remaining (BURNDOWN); these types of charts can be used within any level (PRODUCT LAYER, RELEASE, INCREMENT, STORY) and can also be used for task hours tracking (work completed/remaining); because of the AGILE focus on results rather than activity, however, at least one level of progress chart should be on value-oriented progress; with iterative approaches, usually at least two levels of progress charts are maintained, one for the overall progress and one for particular ITERATION(s) underway; progress in value delivery is often termed “velocity” and is a key AGILE-related measure
 ^Burnup

**CAPA:**
 Corrective and Preventive Action
 ^CAPA

**DESIGN INPUT:**
 As defined by the FDA quality system regulation, DESIGN INPUTS are “the physical and performance requirements of a device that are used as a basis for device design” (21 CFR 820(f)); it defines DESIGN OUTPUTS as “the results of a design effort at each design phase and at the end of the total design effort;” definition and management of DESIGN INPUTS and DESIGN OUTPUTS are central to medical device control and quality management systems; they also directly affect how AGILE approaches are tailored because controls are integral to choice and adaptation of lifecycle models
 ^DesignInput

**DONE**
 Term usually referring to completion of all activities necessary to deliver usable software, with varying degrees of “DONE” applying to the PRODUCT, RELEASE, INCREMENT, and STORY LAYERS; the concept of “DONE” is critical in AGILE approaches; because of the emphasis on delivering usable software and achieving results over activity, defining what “DONE” means is central to defining an AGILE life cycle model, associated processes, and product/project success criteria; variations and phrases include “Definition of DONE ,” “DONE DONE,” “DONE is DONE and “DONEness” (as in degree of achieving “DONE”)
 ^Done

**EMERGENCE:**
 in AGILE contexts, a concept usually ascribed to a system that cannot (or is not desirable to) be defined fully in advance of doing development work, and where the actual conduct of work informs and refines both the definition of the system and the work process itself, providing both better system and work results
 ^Emergence

**EMERGENT:**
 in AGILE contexts, a concept usually ascribed to a system that cannot (or is not desirable to) be defined fully in advance of doing development work, and where the actual conduct of work informs and refines both the definition of the system and the work process itself, providing both better system and work results
 ^Emergent

**EVOLUTIONARY STRATEGY:**
 life cycle model in which a system is developed in BUILDs; an EVOLUTIONARY STRATEGY is similar to an INCREMENTAL strategy but differs in acknowledging that the user need is not fully understood and all requirements cannot be defined up front; in this strategy, customer needs and system requirements are partially defined up front, then are refined in each succeeding BUILD.
 ![[AAMI_fig1.png]]
 Figure 1 graphical view of the EVOLUTIONARY approach, emphasizing the customer feedback that is an essential component of AGILE; in this view, there is a preliminary requirements analysis (analogous to BACKLOG creation) and an initial high-level design activity, both of which are commonly found in the beginning stages of many AGILE projects with an emphasis on “just enough” to get started on the version BUILD cycle.
 ^EvolutionaryStrategy

**EXECUTABLE REQUIREMENTS:**
 requirements that enable automatic generation of associated software tests; currently, EXECUTABLE REQUIREMENTS are typically either
    1. appropriately developed/formatted requirements that allow automatic generation of tests, or
    2. using executable tests as both tests and requirements (TEST - DRIVEN DEVELOPMENT and its variants)
 ^ExecutableRequirements

**INCREMENT:**
 portion of system functionality; the term also refers to the segments of development activity that result in INCREMENTs. An INCREMENT could be an increment of time, such as one of more ITERATIONS, or it could an INCREMENT of the product, such an incremental creation of a set of functionality. See INCREMENTAL and ITERATION.
 ^Increment

**INCREMENTAL:**

 1) the “INCREMENTAL” strategy [life cycle model] determines customer needs and defines the system requirements, then performs the rest of the development in a sequence of BUILDs that INCREMENTALLY establish the intended system. The first BUILD incorporates part of the planned capabilities; the next BUILD adds more capabilities, and so on, until the system is complete
 2) a software development technique in which requirements definition, design, implementation, and testing occur in an overlapping, iterative (rather than sequential) manner, resulting in INCREMENTAL completion of the overall software product
 the key difference between the two definitions is the degree of requirements and design completeness before detailed design and BUILD; AGILE tends to be closer to the second definition and more similar in first steps (e.g., BACKLOG creation, RELEASE planning) to Figure 1, with a rejection of mandatory completion of requirements and high-level design definition upfront before other activity, as shown in Figure 2 and Figure 3; in most cases, the issue is what is being defined, when, and to what degree of detail; AGILE approaches often tend toward a combination of INCREMENTAL, EVOLUTIONARY, and iterative approaches in varying degrees
 INCREMENTAL approaches also vary in terms of delivery, i.e., whether deliveries occur after one or more BUILDs or not until the entire system (or as much as practicable) is built; these variations are similar to life cycle model descriptions of “Evolutionary” and “Staged Delivery” (Figure 1 and Figure 2 where 1 to n deliveries are made) and “Design to Schedule” (Figure 3 where a single delivery is made); although non-AGILE software groups commonly do not develop INCREMENTs in priority order, McConnell presaged AGILE BACKLOGs by referencing such prioritization
 ![[AAMI_fig1.png]]
 Figure 1 - EVOLUTIONARY life cycle
 ![[AAMI_fig2.png]]
 Figure 2 - INCREMENTAL life cycle: "Staged delivery"
 ![[AAMI_fig3.png]]
 Figure 3 - INCREMENTAL life cycle: "Design to schedule"
 ^Incremental

**INCREMENT LAYER:**
 see the description in Clause 5.1.3, “Executing process activities at multiple layers of abstraction”
 ^IncrementLayer

**ITERATION:**
 in general terms, ITERATION can be defined as:

 1) Process of performing a sequence of steps repeatedly;
 2) Single execution of the sequence of steps in (1).
 iterative development usually means repeating a life cycle model or a significant portion of the life cycle model multiple times in the course of a single project, rather than a single execution of a selected life cycle;
 in AGILE frameworks such as Scrum, ITERATION means the repeated set of activities related to planning and delivering items from the BACKLOG; in Scrum’s case, an ITERATION is termed a “Sprint” and is subject to Scrum’s particular ITERATION rules/principles
 ^Iteration

**LEAN:**
 term popularly applied outside of Japan to the philosophy behind the Toyota Production System and other implementations; although definitions vary, just as with “AGILE,” LEAN is commonly characterized by a focus on the following:

- Customer value;
- Waste reduction;
- Empirical thinking (application of scientific method);
- Sustainable flow and application of queuing theory to minimize work in process/idle inventory;
- Mastery (discovery, accumulation, and exploitation of knowledge overall and in terms of individual worker capabilities).
 LEAN is not within the scope of this TIR, except for reference for reader knowledge because most AGILE approaches share, either explicitly or implicitly, elements of LEAN philosophy and the LEAN field provides additional material for the AGILE investigator
 ^Lean

**PRODUCT LAYER:**
 see the description in Clause 5.1.3, “Executing process activities at multiple layers of abstraction.”
 ^ProductLayer

**RELEASE:**

 1) Delivered version of an application which may include all or part of an application.
 2) Collection of new and/or changed configuration items which are tested and introduced into the live environment together.
 3) Software version that is made formally available to a wider community. Note to entry: The “wider community” might be internal to an organization or external to it.
 4) Particular version of a configuration item that is made available for a specific purpose.
 5) Formal notification and distribution of an approved version.
  ^Release

**RELEASE LAYER:**
 see the description in Clause 5.1.3, “Executing process activities at multiple layers of abstraction.”
 ^ReleaseLayer

**REFACTOR:**
 improving the software, or reducing technical debt, without changing behaviour or functionality; in other words, the end result/output of the software stays the same, but how the result is produced is changed or clarified
 ^Refactor

**RETROSPECTIVE:**
 meeting typically held at the end of an ITERATION, INCREMENT, or RELEASE , in which the team examines its processes to determine what succeeded and what could be improved; the RETROSPECTIVE is key to an AGILE team's ability to “inspect and adapt“ in the pursuit of “continuous improvement” the AGILE RETROSPECTIVE differs from other methodologies’ “lessons learned” exercises, in that the goal is not to generate a comprehensive list of what went wrong; a positive outcome for a RETROSPECTIVE is to identify one or two high-priority action items that the team wants to work on in the next ITERATION, INCREMENT, or RELEASE; the emphasis is on actionable items, not comprehensive analysis; R ETROSPECTIVEs take many forms, but there is usually a facilitator, who might or might not be a member of the team, and the process is typically broken down into three phases: data gathering, data analysis, and action items
 ^Retrospective

**SOFTWARE DEVELOPMENT LIFE CYCLE MODEL:**
 conceptual structure spanning the life of the software from definition of its requirements to its RELEASE for manufacturing, which:

- identifies the process, activities and tasks involved in development of a software product;
- describes the sequence of and dependency between activities and tasks; and
- identifies the milestones at which the completeness of specified deliverables is verified.
  ^LifeCycle

**SOFTWARE OF UNKNOWN PROVENANCE (SOUP):**
 software item that is already developed and generally available and that has not been developed for the purpose of being incorporated into the medical device (also known as “off-the-shelf software”) or software previously developed for which adequate records of the development processes are not available
 ^SOUP

**STAKEHOLDER:**
 a STAKEHOLDER loosely refers to anyone outside the Scrum team who has an interest in the product that the team is producing; STAKEHOLDERS can include but are not limited to direct managers, subject matter experts, account managers, salespeople, legal officers, and customers
 ^Stakeholder

**STORY:**
 “a user STORY is a short, simple description of a feature told from the perspective of the person who desires the new capability, usually a user or customer of the system. They typically follow a simple who/what/why template: As a < type of user >, I want < some goal > so that < some reason >;” the “why” is an important component in AGILE as it is a descriptor of the change’s value and helps retain focus on results important to the “who” rather than just how to achieve the goal. Also termed “user STORY”
 STORIES typically include accompanying acceptance criteria; the objective of a STORY is to provide a persistent, lightweight requirement artifact in a form that 1) is understandable by all pertinent STAKEHOLDERS , 2) has just enough information to estimate the relative size of the STORY, 3) captures just enough essence as a placeholder for future discussions to uncover or elaborate more of the requirement when needed, but not before needed, and 4) enables change and elaboration with minimum overhead and waste
 ^Story

**STORY LAYER:**
 see the description in Clause 5.1.3, “Executing process activities in multiple layers of abstraction.”
 ^StoryLayer

**TEST - DRIVEN DEVELOPMENT (TDD):**
 generically, TDD reverses the BUILD and test process by first developing the test, checking that it fails (test works), and then iteratively developing small components of software (or product function) until the particular component under development passes the test(s); emphasis is on only developing functionality necessary to pass the specific test and nothing more. Once the initial test is passed, any improvement (REFACTORING) of the component is completed and then the tests reapplied. Once REFACTORING is complete, then the next small component or function will be developed
 if a TDD approach is used, then the tests may also be used as requirements or significant portions of requirements, because the tests become the specifications for development; TDD began as primarily a software-oriented practice focusing on developer-driven VERIFICATION; now there are several variants of TDD like ATDD (see separate term entry) and behaviour-driven development
 ^TDD

**TRACEABILITY:**
 Degree to which a relationship can be established between two or more products of the development process
 ^Traceability

**VALIDATION:**
 confirmation by examination and provision of objective evidence that software specifications conform to user needs and intended uses, and that the particular requirements implemented through software can be consistently fulfilled
 ^Validation

**VERIFICATION:**
 confirmation through provision of objective evidence that specified requirements have been fulfilled
 Note to entry: “Verified” is used to designate the corresponding status.
 ^Verification

**WATERFALL:**
 “once-through” strategy [life cycle model] of performing the development process a single time. Simplistically: determine customer needs, define requirements, design the system, implement the system, test, fix and deliver
 ^Waterfall

**\[BS EN/IEC] 62304:2006+A(MD)1:2015**
 IEC 62304 is an international standard that defines the development and maintenance life cycle requirements for medical device software. The set of processes, activities, and tasks described in 62304 establishes a common framework for medical device software life cycle processes. While 62304 is not itself a regulation, it is recognized by many regulatory agencies as the de-facto standard for developing medical device software. Similar to the FDA’s Design Controls (820.30), the IEC 62304 standard presents information in what appears to be a linear model, but 62304 explicitly states it does not prescribe a specific life cycle model, only that one must be defined and shown to address the required elements of the standard.
 The two names are just different titles for the exact same set of regulations; following one results in following the other
 ^62304

**ISO 13485:**
 Internationally, regulatory agencies in key countries and regions have recognized the requirements contained in ISO 13485 (Medical devices─Quality management systems─Requirements for regulatory purposes) and have incorporated these requirements into their quality system regulations. ISO 13485 is a recognized standard specifying requirements for a comprehensive management system for the design and manufacture of medical devices.
 Subclauses of ISO 13485 Clause 7.3 (Design and Development) have the same overall objectives of the United States FDA regulation related to design controls. For some time the FDA, Health Canada, the European Union (EU), Japan, and Australia have been working within the International Medical Device Regulators Forum (IMDRF) to develop guidance documents that reflect international agreement on quality management system essential principles and requirements. Information on guidance documents from the various GHTF study groups can be found at http://www.imdrf.org/.
 ^ISO13845

**QMS:**
 A Quality Management system is a formalized system of processes, procedures and responsibilities for meeting quality processes and objectives. Medical Device quality systems allow organizations composed of staff with appropriate training and direction to meet customer and regulatory requirements.
 ^QMS

**SOP:**
 Standard Operating Procedure, the "rules" that are followed when creating, developing, updating, or building a product. References QFs and QCs etc. to lay out the specifics for each product.
 ^SOP

**QF:**
 Quality Form, filled in on a per-product basis, is referenced by the SOP
 ^QF

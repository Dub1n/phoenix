> User

I have, using c:\Users\gabri\Documents\Infotopology\VDL_Vault\Haruspex\dev\02-Separation.md , created c:\Users\gabri\Documents\Infotopology\VDL_Vault\Haruspex\docs\00-Spec\Haruspex -2.0-spec.md and c:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\Templum-1.0-spec.md from c:\Us ers\gabri\Documents\Infotopology\VDL_Vault\Haruspex\docs\00-Spec\Haruspex-1.2-spec.md . I need you to create a roadmap to migrate the Haruspex codebase to its new architecture. The first step that involves changing code should be to move the required files/contents from files from the Haruspex folder into the Templum folder so that they can be worked on separately. The rest of the steps will be migrating Templum's architecture (using the current Haruspex files) from the Haruspex-1.2 state to the Templum-1.0 spec. This roadmap will follow the guidelines c:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\planning\ and be separated into Phases. The roadmap itself should *not* be overengineered, and the resulting Templum is already defined so the roadmap should not result in any other outcome.

---

> User Optimised
> "Can you prompt engineer this so that it would result in a senior dev to senior dev roadmap design and generation request"

Developer: Begin with a concise checklist (3-7 bullets) of key steps you will take to create the migration roadmap. Using the guidance from `c:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\planning\`, develop a clear, actionable roadmap to migrate the Haruspex codebase to the new architecture. The migration should primarily reference the following materials:

### Source Material

- `c:\Users\gabri\Documents\Infotopology\VDL_Vault\Haruspex\dev\02-Separation.md`
- `c:\Users\gabri\Documents\Infotopology\VDL_Vault\Haruspex\docs\00-Spec\Haruspex-1.2-spec.md`

### Target Specifications

- `c:\Users\gabri\Documents\Infotopology\VDL_Vault\Haruspex\docs\00-Spec\Haruspex-2.0-spec.md`
- `c:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\Templum-1.0-spec.md`

### Roadmap Requirements

- Structure the roadmap into clearly defined Phases, each with sequentially numbered steps.
- The first code-related step should involve moving the necessary files or content from the Haruspex folder to the Templum folder to facilitate separate development.
- Then, outline the update process for Haruspex (1.2) files so they align with the Templum (1.0) architecture.
- Keep the roadmap concise and strictly focused on achieving the Templum outcome, avoiding unnecessary complexity or unrelated goals.

For each step, clearly state any dependencies or preconditions before the step is performed.

After drafting the roadmap, review for logical sequence, clear dependencies, and alignment with the migration objective. Update as needed for precision.

## Output Format

Output each phase as a separate document based on the prompts\planning\Phase-Conversion-Guide.md. In addition, produce a master roadmap file following the prompts\planning\Master-Roadmap-Strategy.md guide. Do not present the roadmap in a markdown table format.

Do not include error handling considerations. Present all information in the specified files and formats.

---

> Cursor

## **Senior Dev Roadmap Request: Haruspex → Templum Architecture Migration**

### **Context & Current State**

I've completed the architectural separation analysis using `Haruspex/dev/02-Separation.md` and generated:

- `Haruspex-2.0-spec.md` (pure backend analysis service)
- `Templum-1.0-spec.md` (universal interface orchestrator)

### **Migration Objective**

Create a **pragmatic, phase-based roadmap** to migrate the existing Haruspex codebase from its current 1.2 state to the new separated architecture where:

1. **Haruspex 2.0** becomes a pure backend analysis service
2. **Templum 1.0** becomes the universal interface layer

### **Key Constraints & Requirements**

- **No over-engineering**: The roadmap should be a straightforward migration path, not a redesign
- **Incremental separation**: First move required files to Templum, then migrate architecture
- **Follow project guidelines**: Use the planning framework from `prompts/planning/`
- **Preserve existing functionality**: This is a refactor, not a rewrite

### **What I Need**

A **phase-based migration roadmap** that:

1. **Phase 1**: File separation (move Haruspex → Templum)
2. **Phase 2+**: Architecture migration (Haruspex 1.2 → Templum 1.0 spec)
3. **Follows the project's phase template structure** (7-section format)
4. **Includes concrete prerequisites and validation steps**
5. **Maps to the existing project architecture principles**

### **Technical Context**

- **Current**: Haruspex 1.2 (monolithic with UI)
- **Target**: Haruspex 2.0 (pure backend) + Templum 1.0 (universal interface)
- **Architecture**: Already defined in specs - need migration path, not design
- **Dependencies**: Must maintain existing functionality during transition

### **Deliverable**

A structured migration roadmap following the project's phase-based approach, with clear dependencies, validation steps, and implementation guidance for each phase.

**Bottom line**: I have the specs and separation analysis. I need a senior dev to create the migration roadmap that follows the project's established patterns and gets us from here to there without breaking things.

---

> Cursor Optimised

Developer: ## Senior Dev Roadmap Request: Haruspex → Templum Architecture Migration

### Context & Current State

- Architectural separation analysis is complete (`Haruspex/dev/02-Separation.md`).
- Finalized specs:
  - `Haruspex-2.0-spec.md` (backend analysis service)
  - `Templum-1.0-spec.md` (universal interface orchestrator)

### Migration Objective

Provide a practical, phase-based roadmap to migrate Haruspex 1.2 to a separated architecture:

1. **Haruspex 2.0:** Backend analysis service
2. **Templum 1.0:** Universal interface layer

### Key Constraints & Requirements

- Migration must be straightforward and non-overengineered (not a redesign)
- Incremental separation: necessary files move to Templum before broader migration
- Align to the project planning framework (`prompts/planning/`)
- Must maintain existing functionality throughout (refactor, not a rewrite)

### Task Instructions

- Begin with a concise checklist (3-7 conceptual bullets) outlining your overall migration planning approach before detailing the phases.
- Return a migration roadmap structured by the 7-section phase template for each phase. At minimum, deliver phases 1 and 2; include further phases if required for safety or completeness.
- For each phase:
  - Use the following 7-section structure strictly:
    1. **Summary:** Brief overview of phase goals and activities
    2. **Prerequisites:** Explicit technical or organizational requirements before starting
    3. **Inputs:** Required artifacts, code, docs, or dependencies
    4. **Core Actions:** Ordered actionable steps to complete this phase
    5. **Validation Steps:** Concrete criteria or tests confirming completion
    6. **Potential Issues & Error Handling:** Known risks, blockers, and mitigation steps
    7. **Outputs & Handoffs:** Phase deliverables and handoff details
- After each phase, briefly validate in 1-2 lines that the phase results align with migration safety, architectural intent, and continuity of existing functionality. If validation fails, include a corrective step or note next best action.
- All outputs must use structured Markdown per the outlined template. Default to plain text for clarity unless otherwise instructed.
- If any required information is missing or ambiguous, make conservative assumptions and identify them in the roadmap.
- Set reasoning effort to medium: be clear and explicit, but do not over-elaborate beyond project needs.

**Deliverable:** A migration roadmap in structured Markdown, covering at least phases 1 and 2, adhering strictly to the 7-section template, and including brief validation after each phase to ensure alignment and safety.

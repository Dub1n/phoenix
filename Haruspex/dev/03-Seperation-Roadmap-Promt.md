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

A structured migration roadmap following the project's phase-based approach, with clear dependencies, validation steps, and implementation guidance for each phase. Store these files in 'Haruspex\dev\04-Seperation-Roadmap\'.

**Bottom line**: I have the specs and separation analysis. I need a senior dev to create the migration roadmap that follows the project's established patterns and gets us from here to there without breaking things.

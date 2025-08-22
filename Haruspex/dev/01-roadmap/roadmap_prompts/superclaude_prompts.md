# SuperClaude Commands for Haruspex Development

## 🚀 Core Phase Implementation Commands

- [x] **Phase 1: Foundation & VSCode Extension Setup**

/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_1.md --seq --c7 --think --validate --loop --focus architecture --persona-architect

- [x] **Phase 2: Haruspex Core Engine Implementation**

/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_2.md --seq --c7 --think-hard --validate --loop --focus architecture --persona-architect --delegate auto

- [x] **Phase 3: Phoenix Code Lite Component Integration**

/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_3.md --seq --c7 --think --validate --loop --focus architecture --persona-architect

- [x] **Phase 4: Documentation Tree Provider**

/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_4.md --seq --c7 --magic --think --validate --loop --focus architecture --persona-frontend

- [x] **Phase 5: WebView Providers Implementation**

/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_5.md --seq --c7 --magic --think-hard --validate --loop --focus architecture --persona-frontend --delegate auto

- [x] **Phase 6: Real-Time File Monitoring System**

/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_6.md --seq --c7 --think --validate --loop --focus performance --persona-performance

- [ ] **Phase 7: Extension Polish & Marketplace Preparation**

/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_7.md --seq --c7 --think --validate --loop --focus architecture --persona-devops

- [ ] **Phase 8: Testing, Documentation & Release**

/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_8.md --seq --c7 --play --think --validate --loop --focus architecture --persona-qa --delegate auto

## 🔍 Analysis & Planning Commands

- [ ] **Project Architecture Analysis**

/sc:analyze Haruspex/dev/roadmap/phases --seq --c7 --think-hard --focus architecture --persona-architect --delegate auto

- [ ] **Current Phase Status Review**

/sc:analyze "Review current implementation status across all Haruspex phase documents and identify next priorities" --seq --think --focus architecture --persona-architect

- [ ] **Performance & Quality Assessment**

/sc:analyze Haruspex --seq --c7 --think --focus performance --persona-performance --validate

- [ ] **Integration Points Analysis**

/sc:analyze "Identify potential integration challenges between Haruspex phases and PCL components" --seq --c7 --think-hard --focus architecture --persona-architect

## 🎯 Specific Development Tasks

- [ ] **PCL Integration Analysis**

/sc:analyze "Analyze Phoenix Code Lite components for Haruspex integration patterns and compatibility" --seq --c7 --think-hard --focus architecture --persona-architect

- [ ] **VSCode Extension Optimization**

sc:improve Haruspex --seq --c7 --think --focus performance --persona-performance --validate --loop

- [ ] **Documentation Enhancement**

/sc:improve "Enhance Haruspex documentation for better developer experience" --seq --c7 --focus architecture --persona-scribe=en --loop

- [ ] **Testing Strategy Development**

/sc:design "Comprehensive testing strategy for Haruspex VSCode extension" --seq --c7 --play --think --focus architecture --persona-qa

## 🔧 Troubleshooting & Problem Solving

- [ ] **Debug Implementation Issues**

/sc:troubleshoot "Phase [N] implementation challenges" --seq --c7 --think --focus architecture --persona-analyzer

- [ ] **Performance Issues Investigation**

/sc:troubleshoot "VSCode extension performance and responsiveness issues" --seq --c7 --think --focus performance --persona-performance

- [ ] **Integration Problems Analysis**

/sc:troubleshoot "PCL component integration issues with Haruspex architecture" --seq --c7 --think-hard --focus architecture --persona-architect

## 📚 Documentation & Knowledge Management

- [ ] **Update Implementation Guide**

/sc:improve Haruspex/dev/roadmap/Implementation-Guide.md --seq --c7 --think --focus architecture --persona-scribe=en --loop

- [ ] **Phase Document Enhancement**

/sc:improve "Phase [N] documentation based on implementation experience" --seq --c7 --think --focus architecture --persona-scribe=en --loop

- [ ] **Create Development Insights**

/sc:document "Capture lessons learned and insights from Haruspex development experience" --seq --c7 --focus architecture --persona-scribe=en

## 🎮 Quick Commands (Use --uc for faster responses)

- [ ] **Project Status Dashboard**

/sc:analyze "Generate current project status dashboard for all Haruspex phases" --seq --think --uc --focus architecture

- [ ] **Next Steps Identification**

/sc:task "Identify next development priorities based on current Haruspex implementation status" --seq --think --uc --focus architecture --persona-architect

- [ ] **Quality Gates Validation**

/sc:validate "Run quality gates validation for current Haruspex development state" --seq --c7 --validate --uc --focus architecture --persona-qa

## 🔄 Iterative Development Commands

- [ ] **Phase Review & Refinement**

/sc:improve "Review and refine Phase [N] based on implementation experience" --seq --c7 --think --loop --focus architecture --persona-architect

- [ ] **Cross-Phase Integration Check**

/sc:analyze "Validate integration consistency across completed Haruspex phases" --seq --c7 --think --focus architecture --persona-architect --delegate auto

- [ ] **Architecture Evolution Planning**

/sc:design "Plan architecture evolution for remaining Haruspex phases based on implementation learnings" --seq --c7 --think-hard --focus architecture --persona-architect

## 📊 Command Customization Guidelines

### Flag Selection by Phase Complexity

**High Complexity Phases (2, 5, 8)**:

- Add `--think-hard` for deeper analysis
- Include `--delegate auto` for complex coordination
- Consider `--all-mcp` for comprehensive server coordination

**UI-Focused Phases (4, 5, 7)**:

- Include `--magic` for UI component generation
- Use `--persona-frontend` for UI-focused development
- Add visual design considerations

**Performance-Critical Phases (6, 8)**:

- Use `--focus performance` with `--persona-performance`
- Include `--validate` for performance validation
- Add `--play` for testing if needed

**Final Phases (7, 8)**:

- Use `--persona-devops` for deployment concerns
- Include `--persona-qa` for quality assurance
- Add comprehensive validation flags

### When to Use --uc (UltraCompact)

✅ **Good for --uc**:

- Quick status checks
- Simple validation commands
- Progress summaries
- Basic troubleshooting steps

❌ **Avoid --uc for**:

- Phase implementation (need full detail)
- Complex analysis (need complete reasoning)
- Learning capture (need explanations)
- Junior dev guidance (need comprehensive help)

## 🎯 Command Templates for Copy-Paste

### Standard Phase Implementation

```bash
/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_[N].md --seq --c7 --think --validate --loop --focus architecture --persona-architect
```

### Complex Phase Implementation  

```bash
/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_[N].md --seq --c7 --think-hard --validate --loop --focus architecture --persona-architect --delegate auto
```

### UI Phase Implementation

```bash
/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_[N].md --seq --c7 --magic --think --validate --loop --focus architecture --persona-frontend
```

### Performance Phase Implementation

```bash
/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_[N].md --seq --c7 --think --validate --loop --focus performance --persona-performance
```

### Testing Phase Implementation

```bash
/sc:implement --file Haruspex/dev/roadmap_prompts/Dev_Phase_[N].md --seq --c7 --play --think --validate --loop --focus architecture --persona-qa --delegate auto
```

## 🔄 Living Commands - Update Based on Experience

This command list should evolve as you discover what works best for Haruspex development. Add new combinations, modify flags based on what proves most effective, and capture successful patterns for reuse.

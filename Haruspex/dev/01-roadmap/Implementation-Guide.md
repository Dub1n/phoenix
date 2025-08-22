---
tags: [haruspex, implementation_guide, tdd, vscode_extension, telemetry, performance, agile, living_documentation]
provides: [haruspex_implementation_guide_1_1]
requires: [./Master-Implementation-Roadmap.md, ./Phase-Dependency-Framework.md, ./Phase-Template-Generator.md, ../../docs/Haruspex_1.1.1_spec.md]
---

> Source of truth: [Haruspex 1.1](../../docs/Haruspex_1.1.1_spec.md)

# Haruspex Agile Implementation Guide - Adaptive Development Execution

## 🎯 Purpose & Philosophy

This guide provides **adaptive, reality-based** instructions for executing Haruspex VSCode extension development. Unlike traditional guides, this evolves with your implementation experience, captures real problems, and adapts to discoveries. It emphasizes **learning-driven development** where the documentation grows with the project.

### 🔄 **Agile Implementation Principles**

- **Reality Over Plans**: Document what actually happens, not just what was planned
- **Adaptation Over Rigidity**: Flexible approaches that accommodate discoveries
- **Learning Over Prescriptions**: Capture insights and evolve methods
- **Junior Dev Friendly**: Progressive complexity with clear guidance and escape routes

### Architecture Baseline (1.1)

- Embedded VSCode extension; zero external servers/REST; NodeRR/CLI-first assumptions removed.
- PCLCompatibilityValidator runs at startup; log telemetry of compatibility score.
- Reference: [Haruspex 1.1](../../docs/Haruspex_1.1.1_spec.md).

## 🚀 **Implementation Status Dashboard**

Track your overall project progress and current focus:

### 📊 **Project Status Overview**

- **Current Phase**: ⏳ *Update as you progress*
- **Overall Progress**: ⏳ *Track completion percentage*  
- **Active Issues**: ⏳ *Document current blockers*
- **Next Milestone**: ⏳ *Immediate goal focus*

### 🎯 **Quick Navigation to Active Phase**

- [📁 Current Phase Document] - *Update link to active phase*
- [📋 Active Issues & Solutions] - *Jump to current problems*
- [📚 Recent Lessons Learned] - *Latest insights*

## 🚀 **Getting Started - Junior Dev Friendly**

### 1. **Environment Setup with Reality Checks**

Start with validation that actually tells you if things work:

```bash
# Core Development Environment Validation
echo "=== Haruspex Environment Check ==="

# Node.js validation with helpful context
node --version  # Need: v18.0+, but v18.12+ recommended for better stability
if [ $? -eq 0 ]; then
  echo "✅ Node.js: Available"
else
  echo "❌ Node.js: MISSING - Install from nodejs.org"
  exit 1
fi

# npm validation with troubleshooting
npm --version   # Need: v8.0+, but npm 9+ preferred for workspace support
npm config get registry  # Should show registry URL, helps debug npm issues

# VSCode validation with extension development check
code --version  # Need: 1.74+, but 1.80+ recommended for latest extension APIs
code --list-extensions | grep -q "ms-vscode.vscode-typescript-next" || echo "💡 Consider installing TypeScript extension for better dev experience"

# Extension development tools with fallback strategies
echo "=== Installing VSCode Extension Development Tools ==="
npm install -g yo generator-code vsce || {
  echo "❌ Global install failed. Alternative approaches:"
  echo "   1. Try: npm install -g yo generator-code vsce --force"
  echo "   2. Or use local install: npx yo code"
  echo "   3. Or use manual setup (see troubleshooting section)"
}

# Actual functionality test
echo "=== Testing Extension Development Capability ==="
yo --version && echo "✅ Yeoman: Ready" || echo "❌ Yeoman: Issues detected"
echo "Environment check complete: $(date)"
```

### 🔄 **Alternative Setup Strategies**

**If Standard Setup Fails**:

```bash
# Strategy 1: Local tools (avoid global install issues)
mkdir haruspex-vscode && cd haruspex-vscode
npm init -y
npm install --save-dev yo generator-code @vscode/vsce

# Strategy 2: Manual project setup (bypass generator)
# See troubleshooting section for manual project structure

# Strategy 3: Clone from template (fastest start)
# Use existing VSCode extension as template base
```

### 2. **Agile Repository Setup**

```bash
# Create development workspace with validation
mkdir haruspex-vscode
cd haruspex-vscode || { echo "❌ Directory creation failed"; exit 1; }

# Initialize git with safety checks
git init || { echo "❌ Git init failed - check git installation"; exit 1; }

# Optional: Connect to remote (skip if working locally)
# git remote add origin [your-repository-url]

# Agile branch strategy (adapt as needed)
git checkout -b main
echo "🎯 Created main branch - stable releases"

# Working branch for active development
git checkout -b development  
echo "🔄 Created development branch - integration point"

# Phase-specific branch for current work
git checkout -b phase-01-foundation
echo "🚧 Created phase branch - active implementation"

echo "✅ Repository structure ready: $(git branch --show-current)"
```

### 📋 **Implementation Challenges & Solutions**

> *This section captures real problems encountered during setup and implementation. Update as you discover issues.*

#### 🔧 **Setup Issues Encountered**

> *Document problems here as they happen*

#### 🔧 **Development Issues Encountered**  

> *Document coding/build problems here as they happen*

#### 🔧 **VSCode Extension Issues Encountered**

> *Document extension-specific problems here as they happen*

### 3. **Agile Roadmap Navigation**

The enhanced roadmap system provides living documentation:

1. **[Master-Implementation-Roadmap.md](./Master-Implementation-Roadmap.md)** - High-level overview and phase breakdown
2. **[Phase Documents](./phases/)** - **Enhanced living phase documents** with implementation tracking
3. **[Phase-Dependency-Framework.md](./Phase-Dependency-Framework.md)** - Dependencies and validation framework  
4. **[Implementation-Guide.md](./Implementation-Guide.md)** - This adaptive guide

### 📚 **Phase Document Features (New!)**

Each phase document now includes:

- **🚀 Implementation Status Tracking** - Real-time progress visibility
- **📋 Resolved Issues Documentation** - Real problems and solutions
- **✅ Validation Results** - Actual test outcomes and metrics
- **🔄 Agile Implementation Notes** - Flexibility for discoveries
- **📚 Lessons Learned Capture** - Knowledge transfer for future phases

## 🔄 **Agile Phase Development Process**

### **Start of Phase: Setup & Planning**

```bash
# Navigate to your target phase
cd phases/phase-[N]-[name]

# Update the phase document status
# Edit Phase-[N]-[Name]-Implementation.md:
# - Change status from PENDING to IN PROGRESS
# - Update your name/date in the header
# - Review phase scope and add any early insights

echo "📝 Updated phase status to IN PROGRESS: $(date)"
```

### **During Phase: Adaptive Implementation**

#### 🔄 **Flexible TDD Approach** (Not Rigid Steps!)

**Red Phase** - Create failing tests:

```bash
# Write tests that fail in expected ways
npm test  # Expected: specific failures for new functionality
# 💡 If tests fail unexpectedly, document in "Implementation Challenges" section
```

**Green Phase** - Make tests pass:

```bash
# Write minimal code to pass tests
npm test  # Expected: tests now pass
# 💡 If different approach needed, document discovery in "Agile Implementation Notes"
```

**Blue Phase** - Refactor and improve:

```bash
# Improve code quality while maintaining tests
npm run lint  # Expected: quality standards maintained
# 💡 If new patterns emerge, capture in "Lessons Learned" section
```

#### 📝 **Continuous Documentation Updates**

**As you work, update the phase document:**

- **Hit a problem?** → Add to "Implementation Challenges & Solutions"
- **Discover something unexpected?** → Update "Agile Implementation Notes"  
- **Learn something valuable?** → Add to "Implementation Notes & Lessons Learned"
- **Complete a milestone?** → Update "Validation Results" with checkmarks

### **End of Phase: Validation & Transition**

#### ✅ **Adaptive Validation** (Reality-Based, Not Rigid)

```bash
# Core validation that should work
npm run build    # Expected: Clean TypeScript compilation
npm test         # Expected: All tests pass
npm run lint     # Expected: Quality standards met

# Document actual results in phase document:
# - Did everything work as expected?
# - What took longer/shorter than anticipated?
# - What would you do differently next time?

# Performance validation (adapt thresholds based on reality)
echo "=== Performance Check ==="
time npm run build  # Document actual timing
time npm test       # Document actual timing
echo "Performance validation complete: $(date)"
```

#### 📋 **Phase Completion Checklist**

**Before moving to next phase:**

- [ ] ✅ Update phase document status to "COMPLETED"
- [ ] 📝 Fill in "Implementation Notes & Lessons Learned" section
- [ ] 🔄 Update "Validation Results" with actual outcomes  
- [ ] 💡 Add "Recommendations for Next Phase" based on experience
- [ ] 🎯 Update this Implementation Guide if you discovered better approaches

```bash
# Commit phase completion with meaningful message
git add .
git commit -m "Complete Phase [N]: [Name] - [brief summary of what was actually accomplished]

Key learnings:
- [actual discovery 1]
- [actual discovery 2]
- [actual discovery 3]

Next phase considerations:
- [insight for next phase]"

git push origin phase-[N]-[name]
```

## 📚 Lessons Learned Capture

> *This section grows with the project and contains insights from actual implementation experience.*

### 🔧 Development Environment Insights

> *Key learnings about setup, tools, and development workflow*

### 💡 VSCode Extension Development Insights

> *Discoveries about VSCode APIs, extension architecture, and best practices*

### ⚡ Performance & Optimization Insights

> *Real-world performance discoveries and optimization strategies*

### 🏗️ Architecture & Integration Insights

> *Learnings about component integration, patterns, and architectural decisions*

### 🎯 Junior Developer Guidance Insights

> *What worked well for onboarding, what was confusing, how to improve the process*

## 🔄 Cross-Cutting Concerns & Integration Patterns

These elements appear across multiple phases. Adapt implementation based on what you discover:

### PCL Component Integration Strategy

- **Compatibility Validation**: Run PCLCompatibilityValidator at startup; adapt based on actual integration experience
- **Interface Harmonization**: Create adapter layers that actually work with real component interfaces
- **Error Isolation**: Implement patterns that handle real error scenarios you encounter

### Telemetry & Monitoring Strategy

- **Performance Tracking**: Implement TelemetryCollector based on actual performance requirements
- **User Experience Metrics**: Track what actually matters for extension usability
- **Privacy Compliance**: Ensure zero PII while capturing useful insights

### Progressive Enhancement Strategy

- **Feature Flags**: Implement based on actual scalability needs discovered during development
- **Performance Modes**: Create lightweight/balanced/full-featured modes based on real usage patterns
- **Adaptive Thresholds**: Set thresholds based on actual performance measurements, not theoretical targets

### Caching & Performance Strategy

- **Smart Caching**: Implement L1/L2/L3 caching based on actual performance bottlenecks discovered
- **Memory Management**: Set memory thresholds based on real extension usage patterns
- **Background Processing**: Gate background work based on actual system capability requirements

## 💡 **Phase-Specific Adaptive Guidance**

*These are insights and patterns, not rigid requirements. Adapt based on what you discover.*

### **Phase 1: Foundation & VSCode Extension Setup**

**🎯 Core Goal**: Get a working VSCode extension skeleton that you can build upon

**🔄 Flexible Approach**:

- **Start Simple**: Basic extension that loads and has one command
- **Validate Early**: Get extension loading in VSCode development host ASAP
- **Document Discoveries**: What works differently than expected?

**⚡ Key Success Indicators**:

- Extension loads without errors in VSCode
- Can run `npm test` and `npm run build` successfully
- Development workflow feels comfortable and fast

**🔧 Common Adaptation Points**:

- **Extension Generator Issues**: Try manual setup if `yo code` fails
- **TypeScript Complexity**: Start with simpler config if strict mode causes problems
- **Testing Framework**: Switch to simpler testing if @vscode/test-electron is problematic

### **Phase 2: Haruspex Core Engine Implementation**

**🎯 Core Goal**: Build the heart of Haruspex that provides unique value

**🔄 Flexible Approach**:

- **Start with Truth Matrix**: Focus on core differentiation first
- **Incremental Integration**: Add components one at a time
- **Reality-Test Performance**: Use real projects to validate performance

**⚡ Key Success Indicators**:

- Truth matrix provides meaningful insights on real codebases
- File parsing works on actual TypeScript/JavaScript/Markdown files
- Performance acceptable on a typical VSCode workspace

**🔧 Common Adaptation Points**:

- **Performance Issues**: Implement progressive loading if file sets are too large
- **Parsing Complexity**: Start with simpler parsing, enhance iteratively
- **VSCode API Challenges**: Use simpler APIs initially, optimize later

### **Phases 3-8: Adaptive Implementation Approach**

*Rather than prescriptive step-by-step instructions, here's adaptive guidance for each remaining phase. Use your enhanced phase documents for detailed implementation tracking.*

#### **Phase 3: PCL Integration** - *Proven Components, New Architecture*

**🎯 Goal**: Successfully integrate PCL components without breaking what works  
**🔧 Adaptation Strategy**: Start with one component, validate integration pattern, apply to others  
**⚡ Success Indicator**: PCL functionality works seamlessly within Haruspex

#### **Phase 4: Tree Provider** - *VSCode Native UI*  

**🎯 Goal**: Professional tree view that feels native to VSCode  
**🔧 Adaptation Strategy**: Start basic, enhance incrementally based on user feedback  
**⚡ Success Indicator**: Tree view enhances rather than complicates the user experience

#### **Phase 5: WebView Providers** - *Interactive Visualization*

**🎯 Goal**: Compelling visual interfaces that provide real value  
**🔧 Adaptation Strategy**: Prioritize by user value - implement highest-value webview first  
**⚡ Success Indicator**: Users prefer webviews over alternative tools for their tasks

#### **Phase 6: File Monitoring** - *Responsive Real-Time Updates*

**🎯 Goal**: System feels responsive and stays current with file changes  
**🔧 Adaptation Strategy**: Implement basic monitoring, optimize based on real performance issues  
**⚡ Success Indicator**: Updates feel instant, system remains stable under load

#### **Phase 7: Polish & Marketplace** - *Professional User Experience*

**🎯 Goal**: Extension ready for public use and marketplace submission  
**🔧 Adaptation Strategy**: Focus on user experience issues discovered during development  
**⚡ Success Indicator**: Extension meets marketplace standards and user expectations

#### **Phase 8: Testing & Release** - *Production Readiness*

**🎯 Goal**: Confident release with comprehensive validation  
**🔧 Adaptation Strategy**: Test real-world usage scenarios, not just code coverage  
**⚡ Success Indicator**: Team confident in production deployment

## 🎯 **Adaptive Quality Assurance**

### **Reality-Based Quality Validation**

**Quick Daily Health Checks**:

```bash
# Basic functionality validation
npm run build     # Should complete without errors
npm test          # Critical tests should pass
npm run lint      # Major quality issues should be resolved

# Document any issues discovered in your active phase document
```

**Adaptive Quality Metrics**:

- **Focus on User Experience**: Does the extension feel responsive and helpful?
- **Track Real Performance**: What are actual load times in your development workflow?
- **Measure What Matters**: Which metrics actually correlate with user satisfaction?

### **Performance Reality Checks**

**Establish Your Own Baselines**:

```bash
# Measure actual performance in your environment
echo "=== Performance Reality Check ==="
time npm run build  # Your actual build time
time npm test       # Your actual test time

# Use VSCode extension profiling in real usage scenarios
# Compare against extensions you actually use and like
echo "Performance check complete: $(date)"
```

**Adapt Performance Targets Based on Reality**:

- **Extension activation**: What feels fast enough in practice?
- **File operations**: How responsive do real file changes need to be?
- **Memory usage**: What's acceptable for your actual usage patterns?

## 🔧 **Adaptive Troubleshooting & Learning**

### **When Things Go Wrong (They Will!)**

**🎯 Mindset**: Problems are learning opportunities, not failures

#### **Extension Loading Issues**

```bash
# Investigation approach
code --version  # Check VSCode version compatibility
# Check VSCode Developer Tools > Output > Extension Host
# Try loading in clean VSCode instance: code --extensions-dir /tmp/empty

# Document what you discover in your phase document under "Implementation Challenges"
```

#### **Performance Issues**

```bash
# Investigation approach  
# Use VSCode's built-in extension profiler
# Monitor with Activity Monitor / Task Manager during actual usage
# Test with realistically sized projects, not toy examples

# Document actual performance characteristics, not theoretical targets
```

#### **Integration Issues**

```bash
# Investigation approach
# Start with simplest possible integration, verify it works
# Add complexity incrementally until you find the breaking point
# Document exactly where and why integration patterns break

# Often integration issues reveal architecture assumptions that need updating
```

### **Learning-Oriented Error Resolution**

**🔄 For Each Problem You Encounter**:

1. **Document the Context**: What were you trying to do when this happened?
2. **Document the Investigation**: What did you try? What worked/didn't work?
3. **Document the Solution**: What actually fixed it?
4. **Document Prevention**: How could this be avoided in the future?
5. **Update This Guide**: Add your insights to help future developers

**📚 Build Your Knowledge Base**:

- **Extension Manifest Issues**: What configurations actually work?
- **TypeScript Integration**: Which compiler settings provide the best developer experience?
- **VSCode API Patterns**: Which APIs are stable vs. which change frequently?
- **Testing Strategies**: What testing approaches actually catch problems?

## 🎯 **Adaptive Success Definition**

### **Technical Success - What Actually Matters**

**🔧 Functional Success**:

- Extension loads reliably and doesn't crash VSCode
- Core features work consistently across different project types
- Development workflow feels productive and efficient

**⚡ Performance Success**:

- Extension feels responsive during normal usage
- Doesn't noticeably slow down VSCode or other extensions
- Scales reasonably to typical project sizes

**📊 Quality Success**:

- Code is maintainable and understandable by the team
- Tests catch real problems before users encounter them
- Documentation accurately reflects how the extension actually works

### **User Experience Success - Real Value Delivered**

**🎯 Value Proposition**:

- Users choose Haruspex over alternatives for specific tasks
- Extension integrates smoothly into existing workflows
- Provides unique insights or capabilities not available elsewhere

**🔄 Adoption Success**:

- Users continue using the extension after initial trial
- Positive feedback and feature requests indicate engagement
- Extension usage patterns match intended use cases

## 🚀 **Evolutionary Development Mindset**

### **This Guide Evolves With You**

**📝 Continuous Guide Improvement**:

- Add your discoveries to the troubleshooting sections
- Update adaptive guidance based on what actually works
- Document alternative approaches you discover
- Share insights about what junior developers find confusing vs. helpful

### **Project Success Through Adaptation**

**🔄 Key Principles for Success**:

- **Reality Over Plans**: Build what actually works, not what was originally planned
- **Learning Over Perfection**: Embrace discoveries and course corrections
- **User Value Over Technical Elegance**: Prioritize features that users actually need
- **Sustainable Development**: Build in a way that supports long-term maintenance and enhancement

### **Long-Term Vision**

Haruspex becomes a valuable tool that demonstrates how **agile, learning-oriented development** can deliver better results than rigid, plan-driven approaches. The development experience itself becomes a case study in adaptive software development that evolves with real-world usage and feedback.

---

**🎯 Remember**: This guide succeeds when it helps you navigate the inevitable challenges and discoveries of VSCode extension development. Update it as you learn, and it becomes more valuable for future developers on the project.

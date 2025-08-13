# Context Awareness for Phoenix Code Lite Development

## ⊕ Understanding User Context

Every change to Phoenix Code Lite must consider **where the user is in their workflow** and **what they're trying to achieve**. This document provides the context framework for making user-centric development decisions.

## ⇔ User Workflow Stages

### 1. Project Setup & Initialization

**User Goal**: Get Phoenix Code Lite working in their project  
**Context**: First-time user or new project setup  
**Mental State**: Learning, potentially frustrated if setup is complex

#### 1.1 User Journey

```text
Install → Enter Interactive Session → Guided Setup → Template Selection → Document Configuration → First Use
```

#### 1.2 Key Considerations

- **Interactive Guidance**: Setup wizard with persistent session context
- **Progressive Disclosure**: Step-by-step configuration with clear navigation
- **Template Selection**: Visual template comparison with detailed information
- **Document Setup**: Integrated document management configuration
- **Session Persistence**: No need to restart or repeat commands

#### 1.3 Code Impact Areas

- Interactive session initialization (`CLISession`)
- Enhanced setup wizard with navigation (`enhanced-wizard.ts`)
- Template selection with preview (`MenuSystem`)
- Document management integration (`DocumentConfigurationEditor`)
- Session state management and context preservation

### 2. Configuration & Customization

**User Goal**: Optimize Phoenix Code Lite for their specific needs  
**Context**: User understands basics, wants to customize  
**Mental State**: Exploring, wanting control over behavior

#### 2.1 User Journey

```text
Interactive Session → Configuration Menu → Template Selection → Document Management → Advanced Settings → Live Preview → Apply Changes
```

#### 2.2 Key Considerations

- **Menu-Driven Discovery**: Hierarchical menus reveal configuration options progressively
- **Template-Based Configuration**: Visual template comparison with instant switching
- **Document Management Integration**: Per-template document activation settings
- **Live Validation**: Real-time validation with immediate feedback
- **Session Persistence**: Changes persist within session, can be saved or discarded
- **Context-Aware Help**: Location-specific help and guidance

#### 2.3 Code Impact Areas

- Interactive configuration menus (`MenuSystem`, `enhanced-commands.ts`)
- Template management system (`TemplateManager`, `ConfigurationEditor`)
- Document configuration integration (`DocumentConfigurationEditor`)
- Session-based validation and state management (`CLISession`)
- Context-aware navigation and breadcrumbs

### 3. Daily Development Workflow

**User Goal**: Generate high-quality code efficiently  
**Context**: Regular usage, productivity-focused  
**Mental State**: Task-oriented, time-conscious

#### 3.1 User Journey

```text
Enter Session → Quick Generate Menu → Task Input → Template Context → Document Activation → Workflow Execution → Session-Tracked Results → Continue or Exit
```

#### 3.2 Key Considerations

- **Session Continuity**: Persistent session eliminates repeated setup
- **Template Context**: Current template settings automatically applied
- **Document Integration**: Relevant documents automatically included in workflow
- **Progress Visualization**: Interactive progress tracking within session
- **Result Management**: Session maintains workflow history and context
- **Quick Actions**: Streamlined access to common operations

#### 3.3 Code Impact Areas

- Session-based workflow orchestration (`CLISession`, `SessionManager`)
- Interactive progress tracking (`MenuSystem`, `ProgressTracker`)
- Template-aware workflow execution (`TDDOrchestrator`)
- Document-integrated workflows (`DocumentManager`)
- Session state and history management

### 4. Quality Review & Validation

**User Goal**: Ensure generated code meets their standards  
**Context**: Reviewing AI-generated output  
**Mental State**: Critical, detail-oriented

#### 4.1 User Journey

```text
Code Generation → Quality Review → Accept/Reject → Integration
```

#### 4.2 Key Considerations

- **Transparency**: User should see quality metrics and validation results
- **Control**: User should be able to influence quality criteria
- **Trust**: Quality gates should build confidence in output
- **Learning**: User should understand quality decisions

#### 4.3 Code Impact Areas

- Quality gate system (`src/tdd/quality-gates.ts`)
- Audit logging (`src/utils/audit-logger.ts`)
- Metrics collection (`src/utils/metrics.ts`)
- Report generation (`src/cli/advanced-cli.ts`)

### 5. Troubleshooting & Problem Resolution

**User Goal**: Understand and fix issues when they occur  
**Context**: Something went wrong, user needs help  
**Mental State**: Frustrated, urgent need for resolution

#### 5.1 User Journey

```text
Error Occurrence → Error Message → Troubleshooting → Resolution
```

#### 5.2 Key Considerations

- **Clear Errors**: Error messages should explain what went wrong
- **Actionable Guidance**: Users should know what to do next
- **Context Preservation**: Provide enough context for debugging
- **Recovery**: System should help user recover gracefully

#### 5.3 Code Impact Areas

- Error handling throughout the system
- Help system (`src/cli/help-system.ts`)
- Audit logging for troubleshooting
- Validation and security guardrails

## ⊛ Technical Context Layers

### 1. Application Layer Context

Understanding how Phoenix Code Lite fits into the user's development environment.

#### 1.1 Integration Points

- **Project Structure**: How Phoenix Code Lite interacts with existing projects
- **Development Tools**: Integration with IDEs, version control, CI/CD
- **Team Workflows**: How multiple developers use Phoenix Code Lite
- **Deployment Processes**: How generated code fits into deployment pipelines

#### 1.2 Considerations for Development

- **File System Respect**: Don't interfere with existing project structure
- **Tool Compatibility**: Work well with popular development tools
- **Team Coordination**: Support collaborative development practices
- **Version Control**: Generate code that works well with Git workflows

### 2. System Integration Context

How Phoenix Code Lite interacts with the broader system environment.

#### 2.1 System Boundaries

- **Claude Code SDK**: Primary LLM integration point
- **Node.js Ecosystem**: NPM packages, TypeScript tooling
- **File System**: Reading/writing project files safely
- **Operating System**: Cross-platform compatibility considerations

#### 2.2 Considerations for Development

- **Resource Management**: Efficient use of system resources
- **Security Boundaries**: Respect security constraints
- **Error Propagation**: Handle system-level errors gracefully
- **Performance Impact**: Minimize impact on system performance

### 3. Data Flow Context

Understanding how data moves through Phoenix Code Lite and its lifecycle.

#### 3.1 Data Journey

```text
User Input → Validation → Processing → LLM Interaction → 
Output Generation → Quality Validation → File System → User Review
```

#### 3.2 Data Types and Contexts

- **User Input**: Task descriptions, configuration preferences
- **Configuration Data**: Templates, settings, user preferences
- **Workflow Data**: Phase results, quality metrics, audit logs
- **Generated Code**: Files, tests, documentation
- **System State**: Progress, errors, performance metrics

#### 3.3 Considerations for Development

- **Data Validation**: Validate all data at system boundaries
- **State Management**: Maintain consistent state throughout workflows
- **Error Recovery**: Handle data corruption or invalid states
- **Privacy**: Protect sensitive user data and configuration

## 🎨 User Experience Context

### 1. CLI User Experience Patterns

Understanding how users interact with command-line interfaces.

#### 1.1 CLI UX Principles

- **Predictability**: Commands should behave consistently
- **Discoverability**: Help should be easily accessible
- **Efficiency**: Power users should have shortcuts
- **Forgiveness**: Easy to undo or correct mistakes

#### 1.2 Phoenix Code Lite CLI Patterns

```bash
# Progressive disclosure - simple to complex
phoenix-code-lite generate --task "basic task"
phoenix-code-lite generate --task "complex task" --framework react --verbose

# Contextual help
phoenix-code-lite help
phoenix-code-lite help generate
phoenix-code-lite generate --help

# Configuration hierarchy
phoenix-code-lite config --show
phoenix-code-lite config --template enterprise
phoenix-code-lite config --edit
```

### 2. Progress and Feedback Patterns

Users need to understand what's happening during long-running operations.

#### 2.1 Feedback Requirements

- **Immediate Acknowledgment**: Confirm command was received
- **Progress Indication**: Show what's currently happening
- **Time Estimation**: When possible, indicate expected completion
- **Success/Failure Clarity**: Clear indication of outcomes

#### 2.2 Implementation Patterns

```typescript
// Progress tracking example
const tracker = new ProgressTracker(['Plan & Test', 'Implement & Fix', 'Refactor & Document']);
tracker.startPhase('Plan & Test');
// ... work happens
tracker.completePhase(true);
tracker.startPhase('Implement & Fix');
```

### 3. Error Recovery Patterns

When things go wrong, users need clear paths to resolution.

#### 3.1 Error Recovery Hierarchy

1. **Prevention**: Validate inputs to prevent errors
2. **Graceful Handling**: When errors occur, handle them gracefully
3. **Clear Communication**: Explain what went wrong and why
4. **Recovery Options**: Provide actionable next steps
5. **Learning**: Help users avoid similar issues

#### 3.2 Error Context Examples

```typescript
// Good error context
throw new ValidationError(
  'Task description too short',
  {
    received: taskDescription,
    minimum: 10,
    suggestion: 'Try: "Create a function that validates email addresses"'
  }
);

// Bad error context
throw new Error('Invalid input');
```

## ⌕ Component-Specific Context

### 1. TDD Orchestrator Context

**User Perspective**: Central workflow engine that coordinates the entire TDD process  
**User Expectation**: Reliable, transparent, high-quality output

**Context Considerations**:

- **Phase Transitions**: Users should understand when phases start/end
- **Error Recovery**: Failed phases should provide recovery options
- **Quality Assurance**: Users should trust the quality validation
- **Customization**: Different users have different quality standards

### 2. Interactive Session Context

**User Perspective**: Primary interaction environment providing persistent, context-aware CLI experience  
**User Expectation**: Seamless navigation, maintained context, intuitive workflows

**Context Considerations**:

- **Session Continuity**: Users expect state preservation across all operations
- **Navigation Clarity**: Clear visual indication of current location and available actions
- **Mode Flexibility**: Seamless switching between menu and command modes
- **Context Preservation**: User preferences and current state maintained throughout session

### 3. Document Management Context

**User Perspective**: Integrated feature for managing AI agent documentation and context  
**User Expectation**: Template-aware, easy to configure, clearly organized

**Context Considerations**:

- **Menu Integration**: Accessible through Configuration > Document Management menu path
- **Template Awareness**: Document activation settings specific to current template
- **Agent Organization**: Clear separation between global and agent-specific documents
- **Interactive Operations**: Toggle, preview, add, edit operations through menu interface

### Configuration System Context

**User Perspective**: Interactive menu-driven configuration management  
**User Expectation**: Visual template comparison, persistent settings, easy customization

**Context Considerations**:

- **Menu-Driven Discovery**: Configuration options revealed through hierarchical menus
- **Template Integration**: Visual template comparison with instant switching
- **Document Management**: Integrated per-template document activation
- **Session Persistence**: Changes maintained within session, can be saved or discarded

## ⚡ Critical Context Awareness Rules

### 1. Never Break User Workflows

- **Backward Compatibility**: Existing commands must continue to work
- **Configuration Migration**: Smoothly migrate old configurations
- **File System Safety**: Never corrupt or lose user files
- **Data Preservation**: Preserve user customizations and preferences

### 2. Always Consider the User's Mental Model

- **Terminology**: Use terms users understand (avoid technical jargon)
- **Behavior Consistency**: Similar actions should work similarly
- **Expectation Alignment**: System behavior should match user expectations
- **Learning Curve**: Design for both beginners and power users

### 3. Provide Context in All Communications

- **Error Messages**: Include enough context for troubleshooting
- **Progress Updates**: Explain what's happening and why
- **Success Messages**: Confirm what was accomplished
- **Help Text**: Provide relevant examples and use cases

### 4. Design for the Complete User Journey

- **Onboarding**: First-time user experience should be smooth
- **Daily Use**: Regular workflows should be efficient
- **Advanced Usage**: Power users should have advanced options
- **Troubleshooting**: Problem resolution should be straightforward

## ◊ Context Validation Checklist

Before implementing any change, validate against these context considerations:

### User Impact Assessment

- [ ] **Workflow Impact**: How does this change affect user workflows?
- [ ] **Learning Curve**: Does this make the system easier or harder to learn?
- [ ] **Error Scenarios**: What can go wrong and how will users recover?
- [ ] **Performance Impact**: Does this make the system faster or slower?

### Integration Assessment

- [ ] **System Integration**: How does this affect integration with other tools?
- [ ] **Data Flow**: Does this change how data moves through the system?
- [ ] **Configuration Impact**: Do users need to update their configuration?
- [ ] **Backward Compatibility**: Will existing users' setups continue to work?

### Quality Assessment

- [ ] **Code Quality**: Does this maintain or improve code quality?
- [ ] **Test Coverage**: Are the changes properly tested?
- [ ] **Documentation**: Is the change properly documented?
- [ ] **Security**: Does this introduce any security concerns?

---

**Remember**: Every line of code affects a user's experience. Consider their context, respect their workflow, and design for their success.

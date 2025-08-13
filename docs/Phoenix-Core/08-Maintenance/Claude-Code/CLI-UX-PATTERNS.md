# Interactive CLI User Experience Patterns for Phoenix Code Lite

## ⊕ UX Philosophy

Phoenix Code Lite's CLI is designed around **persistent interactive sessions** with dual interaction modes: users can choose between intuitive menu navigation or traditional command-line workflows, with seamless switching between modes.

## 🎨 Core UX Principles

### 1. Session Persistence

- **Continuous Context**: Users enter a persistent session that maintains state
- **No Repeated Commands**: Eliminate the need to repeatedly type `phoenix-code-lite`
- **Context Awareness**: System remembers user location and preferences

### 2. Dual Interaction Modes

- **Menu Mode**: Arrow-key navigation with numbered options for intuitive use
- **Command Mode**: Traditional command-line interface for power users
- **Mode Switching**: Seamless transition between modes with hotkeys

### 3. Progressive Disclosure

- **Contextual Menus**: Options relevant to current context and user capabilities
- **Breadcrumb Navigation**: Clear visual indication of current location
- **Guided Workflows**: Step-by-step processes for complex operations

### 4. Forgiveness & Recovery

- **Back Navigation**: ESC key and "back" command work consistently
- **Session Recovery**: Graceful error handling maintains session state
- **Clear Exit Paths**: Users can always return to main menu or exit cleanly

## 🎛️ Interactive Session Architecture

### Session Entry Points

```bash
# Interactive Session (Primary Mode)
phoenix-code-lite                    # Enters persistent interactive session

# Traditional Command Mode (Backward Compatibility)
phoenix-code-lite generate --task "description"  # Direct command execution
phoenix-code-lite config --show      # Direct configuration display
```

### Session Management

- **Automatic Mode Detection**: Detects when to use interactive vs traditional mode
- **Context Preservation**: Navigation state maintained throughout session
- **Resource Management**: Proper cleanup on session termination

### Interactive Menu Categories

#### 1. Main Menu (Session Entry Point)

```text
⋇ Phoenix Code Lite Interactive CLI
════════════════════════════════════════════════

1. Generate Code           - Start TDD workflow for new code
2. Configuration           - Manage settings and templates  
3. Templates              - Manage project templates
4. Advanced Settings      - Advanced configuration options
5. Help                   - Show available commands
6. Quit                   - Exit Phoenix Code Lite

Navigation: Type number, command name, "back", "home", or "quit"
Mode: Press "c" for command mode, "m" for menu mode
```

#### 2. Document Management (Integrated into Configuration)

```text
⋇ Configuration > Document Management
════════════════════════════════════════════════

Current Template: Enterprise
Document Status: 12 global, 8 agent-specific documents active

1. Global Documents        - Manage project-wide documentation
2. Planning Agent Docs     - Documentation for planning phase
3. Implementation Docs     - Documentation for implementation phase  
4. Quality Review Docs     - Documentation for review phase
5. Template Settings       - Configure document activation per template
6. Back to Configuration   - Return to main configuration menu

Navigation: Type number or use arrow keys, ESC to go back
```

#### 3. Template Management (Menu-Driven)

```text
□ Template Management
════════════════════════════════════════════════

Current: Enterprise Template
Available: Starter, Enterprise, Performance, Custom

1. Switch Template         - Change to different template
2. Adjust Current          - Modify current template settings
3. Create New Template     - Create custom template
4. Reset Template          - Reset to default settings
5. Preview Templates       - Compare template configurations
6. Back to Main Menu       - Return to main menu

Navigation: Type number, template name, or navigation command
```

### Interactive Navigation Patterns

#### Breadcrumb Navigation

```text
Phoenix Code Lite > Configuration > Advanced Settings > Document Management
```

#### Context-Aware Prompts

```text
Phoenix [Enterprise/Documents]> help
Phoenix [Command Mode]> config
Phoenix [Menu: 3/6]> 2
```

#### Universal Navigation Commands

- **back** - Go to previous menu
- **home** - Return to main menu  
- **quit/exit** - Exit application
- **help** - Context-sensitive help
- **c** - Switch to command mode
- **m** - Switch to menu mode

## 🎛️ Interactive UI Patterns

### Session-Based Configuration Pattern

Design for persistent session-based configuration following these principles:

#### Configuration Menu Hierarchy

```text
⋇ Phoenix Code Lite Configuration [Session Active]
════════════════════════════════════════════════

Current Template: Enterprise
Session ID: abc123-def456 | Mode: Interactive

1. Framework Settings      - Language, testing, and build preferences
2. Template Management     - Switch, create, or modify templates  
3. Document Management     - Configure per-agent documentation
4. Advanced Settings       - Security, logging, and performance
5. Agent Configuration     - Customize AI agent behavior
6. Back to Main Menu       - Return to Phoenix Code Lite main menu

Navigation: Number selection, "back", "home", or "quit"
Session Commands: "save", "reset", "status"
```

#### Interactive Template Selection

```text
□ Template Selection [Enterprise → ?]
════════════════════════════════════════════════

Preview: Comparing templates for your workflow

┌─ Starter Template ──────────────────────────┐
│ • Test Coverage: 70%                        │
│ • Quality Gates: Basic validation           │
│ • Performance: Balanced                     │
│ • Best for: Learning and experimentation    │
└─────────────────────────────────────────────┘

┌─ Enterprise Template [CURRENT] ─────────────┐
│ • Test Coverage: 90%                        │
│ • Quality Gates: Comprehensive              │  
│ • Performance: Quality-focused              │
│ • Best for: Production development          │
└─────────────────────────────────────────────┘

1. Switch to Starter    2. Keep Enterprise    3. View Performance
4. Create Custom       5. Cancel              6. Back

Navigation: Number selection or template name
```

#### Document Management Integration Pattern

```text
⋇ Document Management > Global Documents
════════════════════════════════════════════════

Template: Enterprise | 4 documents active

Available Documents:
 ✓ project-context.md      - Project overview and requirements
 ✓ api-guidelines.md       - API development standards  
 ✗ legacy-notes.md         - Historical project notes
 ✓ testing-strategy.md     - Testing approach and patterns

Actions:
1. Toggle Selection        4. Add New Document
2. Preview Document        5. Remove Document  
3. Edit Document          6. Back to Document Menu

Current Selection: [✓] = Active, [✗] = Inactive
Navigation: Number, document name, or "toggle [name]"
```

### Progress Feedback Patterns

#### Workflow Progress Display

```text
⇔ Phoenix Code Lite Workflow In Progress

⋇ Phase 1: Plan & Test                    ✓ Completed (2.3s)
⚡ Phase 2: Implement & Fix                ⇔ In Progress...
   └─ Running tests...                     ⏳ 15s elapsed
⑇ Phase 3: Refactor & Document            ‖  Pending

◊ Overall Progress: 45% complete
⋯  Estimated time remaining: 32 seconds

Press Ctrl+C to cancel
```

#### Error State Display

```text
✗ Phoenix Code Lite Workflow Failed

⋇ Phase 1: Plan & Test                    ✓ Completed
⚡ Phase 2: Implement & Fix                ✗ Failed
   └─ Test execution failed                * Error details below
⑇ Phase 3: Refactor & Document            ‖  Not started

⌕ Error Details:
Test "should validate email format" failed
Expected: true, Received: false

* Suggested Actions:
• Run 'phoenix-code-lite doctor' to check system health
• Check the generated test file at: tests/email-validator.test.ts
• Try again with '--verbose' for more details

Type 'phoenix-code-lite help troubleshooting' for more help.
```

## ⊕ User Journey Optimization

### First-Time User Experience

Goal: Get users to their first successful workflow quickly

#### Onboarding Flow

```bash
# Step 1: Installation (handled by npm)
npm install -g phoenix-code-lite

# Step 2: Project initialization with guided setup
phoenix-code-lite init
# Automatically runs configuration wizard
# Provides sample task suggestions
# Sets up appropriate template

# Step 3: First workflow with helpful guidance
phoenix-code-lite generate --task "create hello world function"
# Provides clear progress feedback
# Explains what's happening at each step
# Celebrates success and suggests next steps
```

### Returning User Experience

Goal: Make daily workflow efficient and predictable

#### Streamlined Daily Usage

```bash
# Quick workflow execution
phoenix-code-lite generate -t "user authentication API"

# Quick configuration check
phoenix-code-lite config --show

# Quick history review
phoenix-code-lite history --limit 5
```

### Power User Experience

Goal: Provide advanced capabilities without overwhelming beginners

#### Advanced Features

```bash
# Complex workflow with full customization
phoenix-code-lite generate \
  --task "implement OAuth2 with rate limiting" \
  --framework express \
  --template enterprise \
  --max-attempts 7 \
  --verbose \
  --audit-level detailed

# Advanced configuration management
phoenix-code-lite config --adjust enterprise --section agents
phoenix-code-lite config --export --format json > my-config.json
phoenix-code-lite config --import my-config.json
```

## ⋇ Help and Documentation Patterns

### Context-Aware Interactive Help

```text
⋇ Phoenix Code Lite Help [Interactive Session]
════════════════════════════════════════════════

Session Commands:
  help                    - Show this help
  home, main             - Return to main menu
  back                   - Go to previous menu
  quit, exit             - Exit Phoenix Code Lite
  save                   - Save current configuration
  status                 - Show session status

Navigation:
  1-9                    - Select menu option by number
  [option name]          - Select option by name
  c                      - Switch to command mode
  m                      - Switch to menu mode

Current Location: Configuration > Document Management
Session: abc123-def456 | Mode: Interactive | Template: Enterprise
```

### Help Content Structure

```text
⋇ Phoenix Code Lite Help: generate

USAGE:
  phoenix-code-lite generate --task "description" [options]

DESCRIPTION:
  Execute a complete TDD workflow to implement the specified task.
  This will plan tests, implement code, and refactor the result.

REQUIRED:
  -t, --task <description>     Task description (10-1000 characters)

OPTIONS:
  -f, --framework <name>       Framework hint (react, express, etc.)
  -l, --language <name>        Language hint (typescript, javascript, python)
      --template <name>        Configuration template (starter, enterprise, performance)
      --max-attempts <n>       Maximum implementation attempts (1-10, default: 3)
  -v, --verbose               Show detailed progress and debug information

EXAMPLES:
  # Simple task
  phoenix-code-lite generate --task "create email validation function"
  
  # Frontend component
  phoenix-code-lite generate --task "user login form" --framework react
  
  # Backend API
  phoenix-code-lite generate --task "REST API for users" --framework express --verbose

For context help: Type "help" in any menu for location-specific guidance
```

### Document Management Interactive Integration

```text
⋇ Document Management Integration Pattern
════════════════════════════════════════════════

Access Path: Main Menu > Configuration > Document Management

Menu Structure:
1. Global Documents        - Project-wide documentation
2. Planning Agent Docs     - Planning phase documentation  
3. Implementation Docs     - Implementation phase documentation
4. Quality Review Docs     - Review phase documentation
5. Template Settings       - Per-template document activation
6. Back to Configuration   - Return to main configuration

Document Operations:
  toggle [filename]      - Enable/disable document for current template
  preview [filename]     - View document content
  add                    - Create new document from template
  edit [filename]        - Modify document content
  remove [filename]      - Delete document (with confirmation)

Template Integration:
  Each configuration template maintains separate document activation
  settings. Changes apply only to the currently selected template.

Session Commands:
  save                   - Apply document configuration changes
  reset                  - Revert to template defaults
  status                 - Show active documents summary
```

## ◦ Error Handling UX Patterns

### Error Message Structure

```text
✗ {Error Type}: {Brief Description}

{Detailed explanation of what went wrong}

* Suggested Actions:
• {Specific action 1}
• {Specific action 2}  
• {Specific action 3}

For more help: phoenix-code-lite help {relevant-topic}
```

### Error Examples

#### Validation Error

```text
✗ Validation Error: Task description too short

The task description "hi" is only 2 characters long. 
Task descriptions must be between 10 and 1000 characters.

* Suggested Actions:
• Provide a more detailed description of what you want to implement
• Try: "Create a function that validates email addresses"
• Use --help for examples of good task descriptions

For more help: phoenix-code-lite help examples
```

#### Configuration Error

```text
✗ Configuration Error: Invalid template

The template "enterrpise" was not found. Did you mean "enterprise"?

Available templates:
• starter      - Basic configuration for learning
• enterprise   - Production-ready with strict validation  
• performance  - Speed-optimized configuration

* Suggested Actions:
• Use 'phoenix-code-lite config --show' to see current templates
• Use 'phoenix-code-lite config --use enterprise' to switch templates
• Use 'phoenix-code-lite config --add custom' to create a custom template

For more help: phoenix-code-lite help configuration
```

## 🎨 Visual Design Patterns

### Color and Symbol Usage

```bash
# Status indicators
✓ Success / Completed
✗ Error / Failed  
⚠  Warning / Attention needed
⇔ In progress / Working
‖  Pending / Waiting
⋇ Information / Details
* Suggestion / Tip
⌕ Details / Debugging

# Colors (when terminal supports them)
Green: Success states, completed items
Red: Error states, failed items
Yellow: Warning states, attention needed
Blue: Information, neutral states
Cyan: Progress indicators, active items
```

### Text Formatting

```bash
# Use consistent formatting for different content types
COMMANDS in uppercase
--options in lowercase with dashes
'literal values' in single quotes  
<placeholders> in angle brackets
[optional] in square brackets
```

## ◊ Accessibility Considerations

### Screen Reader Support

- Use clear, descriptive text for all interface elements
- Provide text alternatives for visual progress indicators
- Structure information logically with clear headings

### Keyboard Navigation

- Support standard terminal navigation (arrows, tab, enter, escape)
- Provide keyboard shortcuts for common actions
- Allow navigation without mouse/pointer

### Terminal Compatibility

- Work correctly in various terminal emulators
- Graceful degradation when colors/symbols aren't supported
- Respect terminal width and height constraints

## ✓ UX Quality Checklist

### Command Design Review

- [ ] **Intuitive naming** - Command names reflect their purpose
- [ ] **Consistent patterns** - Similar commands follow similar patterns
- [ ] **Progressive disclosure** - Simple cases are simple, complex cases are possible
- [ ] **Clear feedback** - Users always know what's happening

### Interactive Features Review

- [ ] **Navigation clarity** - Users know how to navigate interface
- [ ] **Escape routes** - Users can always get back to previous state
- [ ] **Confirmation patterns** - Destructive actions require confirmation
- [ ] **Error recovery** - Clear path from error states back to success

### Help System Review

- [ ] **Contextual help** - Help is relevant to user's current situation
- [ ] **Example quality** - Examples are practical and helpful
- [ ] **Progressive detail** - Overview first, details available when needed
- [ ] **Troubleshooting** - Common problems have clear solutions

---

**Remember**: Great CLI UX is invisible—users should focus on their work, not on figuring out how to use the tool. When the interface gets out of the way, users can accomplish their goals efficiently and confidently.

# Templum CLI User Workflow Documentation

## Common User Scenarios and Step-by-Step Workflows

### Scenario 1: First-Time User Starting Templum CLI

**User Goal**: Get up and running with Templum CLI for the first time

**Step-by-Step Workflow**:

1. **Launch CLI**: User types `templum` in their terminal
2. **Welcome Experience**:
   - See Templum logo and version information
   - Automatic service discovery begins with progress indicator
3. **Service Connection**:
   - If services found: Automatic connection to healthiest service
   - If no services: Guided setup process begins
4. **Main Menu Arrival**:
   - Clear menu options with numbered selections
   - Status bar shows connection information
   - Footer shows navigation help

**Expected User Experience**:

- No technical knowledge required
- Clear visual feedback at each step
- Helpful guidance if setup issues occur
- Quick path to productivity (under 30 seconds)

**Success Indicators**:

- User reaches main menu successfully
- Service connection status shows green/healthy
- User understands basic navigation options

---

### Scenario 2: Daily User Managing Multiple Projects

**User Goal**: Switch between different projects and check their status

**Step-by-Step Workflow**:

1. **Start from Main Menu**: User is already in active session
2. **Navigate to Projects**:
   - Select "1. Project Management" or use arrow keys + Enter
3. **View Project List**:
   - See all projects with visual status indicators
   - Recent projects highlighted at top
   - Quick access numbers for frequent projects
4. **Select Project**:
   - Choose project by number or navigate with arrows
   - Enter project-specific menu context
5. **Project Operations**:
   - Menu adapts to show project-specific options
   - Breadcrumb shows: Main → Projects → [ProjectName]
   - Can switch projects or return to main menu easily

**Expected User Experience**:

- Fast switching between projects (2-3 keystrokes)
- Always aware of current project context
- Easy to see project health and status at a glance
- Quick access to frequently used projects

**Success Indicators**:

- User can switch projects in under 5 seconds
- Project status is immediately visible
- Navigation feels intuitive and consistent

---

### Scenario 3: Troubleshooting Connection Issues

**User Goal**: Diagnose and fix problems when services aren't responding

**Step-by-Step Workflow**:

1. **Notice Problem**: Status indicators show red/unhealthy service
2. **Access Service Status**:
   - Navigate to "2. Service Status" from main menu
   - See detailed service health information
3. **Diagnostic Information**:
   - View service response times and error messages
   - See last successful connection time
   - Check service capabilities and availability
4. **Recovery Actions**:
   - Option to "Test Connection" for immediate check
   - "Refresh Status" to re-scan for services
   - "Restart Service" with confirmation prompt
5. **Alternative Services**:
   - If multiple services available, can switch to backup
   - Clear indication of which services are functional

**Expected User Experience**:

- Clear indication when problems exist
- Non-technical error descriptions
- Specific suggestions for fixing issues
- Multiple recovery options available

**Success Indicators**:

- User can identify the problem quickly
- Recovery actions are successful
- User understands how to prevent future issues

---

### Scenario 4: Power User Using Command Mode

**User Goal**: Execute specific commands quickly without menu navigation

**Step-by-Step Workflow**:

1. **Switch to Command Mode**: Press 'c' from anywhere in menu system
2. **Command Prompt**: See `templum>` prompt with cursor
3. **Type Command**: Use familiar command-line syntax
4. **Auto-Completion**: Press Tab for command and parameter suggestions
5. **Execute**: Press Enter to run command
6. **View Results**: See formatted output with status indicators
7. **Continue**: Either type next command or press 'm' for menu mode

**Common Commands**:

- `project list` - Show all projects
- `service status` - Check service health
- `help navigation` - Get help on navigation
- `settings theme dark` - Change display theme
- `project switch MyApp` - Switch to specific project

**Expected User Experience**:

- Familiar command-line interface for experienced users
- Intelligent auto-completion speeds up typing
- Consistent command syntax across all functions
- Easy to switch back to menu mode when needed

**Success Indicators**:

- Commands execute quickly and reliably
- Auto-completion works for commands and parameters
- Output is formatted clearly and consistently

---

### Scenario 5: New User Learning the System

**User Goal**: Understand available features and how to use them effectively

**Step-by-Step Workflow**:

1. **Context-Sensitive Help**:
   - Press 'h' or 'help' from any screen
   - See help relevant to current menu or command
2. **Explore Main Categories**:
   - Use arrow keys to browse main menu options
   - Each option shows brief description
3. **Discover Features**:
   - Enter each main category to see subcategories
   - Breadcrumb navigation shows current location
4. **Learn Shortcuts**:
   - Footer always shows relevant keyboard shortcuts
   - Universal commands (ESC, Home) work consistently
5. **Practice Navigation**:
   - Use ESC to go back and explore different paths
   - Try switching between menu and command modes

**Expected User Experience**:

- Help is always available and relevant
- Navigation is predictable and consistent
- Safe to explore without breaking anything
- Clear indication of current location and available actions

**Success Indicators**:

- User discovers key features through exploration
- Help system provides useful guidance
- User becomes comfortable with navigation patterns

---

### Scenario 6: Handling Errors and Recovery

**User Goal**: Recover gracefully when operations fail or unexpected issues occur

**Step-by-Step Workflow**:

1. **Error Occurs**: Operation fails with clear error message
2. **Error Information**:
   - Non-technical description of what went wrong
   - Specific suggestions for what to try next
   - Option to view detailed technical information if needed
3. **Recovery Options**:
   - "Try Again" for transient issues
   - "Go Back" to previous menu or cancel operation
   - "Get Help" for guidance on fixing the problem
4. **Session Preservation**:
   - Session state maintained even after errors
   - No need to restart or reconnect
   - Previous work and context preserved
5. **Learning from Errors**:
   - Error messages include educational information
   - Suggestions help prevent similar issues in future

**Common Error Scenarios**:

- Service becomes unavailable during operation
- Network connectivity issues
- Invalid command or parameter input
- Permission or access issues
- Resource constraints or timeouts

**Expected User Experience**:

- Errors don't cause system crashes or data loss
- Clear explanation of what happened and why
- Multiple options for recovering and continuing work
- Learning opportunity to improve future interactions

**Success Indicators**:

- User can recover from errors without losing work
- Error messages are helpful rather than intimidating
- User becomes more proficient at avoiding and handling issues

---

## Workflow Patterns and Design Principles

### Progressive Disclosure Pattern

- **Start Simple**: Main menu shows only essential options
- **Drill Down**: More specific options appear as user navigates deeper
- **Context Awareness**: Available actions change based on current context
- **Breadcrumbs**: Always show navigation path and current location

### Forgiveness and Recovery Pattern

- **ESC Anywhere**: Always provides a way to go back or cancel
- **Home Shortcut**: Can return to main menu from anywhere
- **Session Persistence**: Work is never lost due to navigation or errors
- **Confirmation**: Destructive actions require explicit confirmation

### Dual-Mode Interaction Pattern

- **Menu Mode**: Keyboard navigation with arrow keys and Enter
- **Command Mode**: Traditional command-line typing with auto-completion
- **Instant Switching**: Hotkeys allow seamless transition between modes
- **Mode Indication**: Current mode always visible in status bar

### Smart Defaults Pattern

- **Auto-Discovery**: Find and connect to services automatically
- **Best Choice Selection**: Choose optimal service when multiple available
- **Remember Preferences**: Learn from user choices and adapt
- **Sensible Fallbacks**: Graceful degradation when preferred options unavailable

### Contextual Feedback Pattern

- **Immediate Response**: Visual feedback for every user action
- **Status Indicators**: Clear symbols and colors for different states
- **Progress Communication**: Show progress for longer operations
- **Completion Confirmation**: Clear indication when operations finish

These workflows demonstrate how the Templum CLI prioritizes user experience, making complex operations simple and providing clear guidance throughout all interactions. The focus is on helping users accomplish their goals efficiently while maintaining confidence in the system's reliability and their ability to recover from any issues that arise.

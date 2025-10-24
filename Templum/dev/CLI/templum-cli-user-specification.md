# Templum CLI User Specification

## Overview

The Templum CLI provides a user-friendly command-line interface for managing and interacting with Templum services. This specification describes how users will interact with the system, focusing on workflows, behaviors, and expected experiences rather than technical implementation details.

## User Experience Philosophy

### Core Principles

**Persistent Sessions**: Once you start the CLI, you stay in an active session that remembers your context and preferences. No need to repeatedly enter connection details or re-authenticate.

**Two Ways to Work**: Choose between menu-driven navigation (use arrow keys and Enter) or traditional command typing. Switch between modes instantly with a hotkey.

**Smart Discovery**: The CLI automatically finds and connects to available Templum services on your system. It handles the technical connection details so you don't have to.

**Forgiveness First**: Made a mistake? Press ESC to go back. Need to start over? Type 'home' to return to the main menu. The CLI preserves your session and helps you recover gracefully.

## Getting Started

### Initial Launch

When you start the CLI, you'll see:

- A welcome screen with the Templum logo and version
- Automatic discovery of available services (shows progress)
- Connection status for each found service
- Main menu with clear options

### First Time Setup

If no services are found, the CLI will:

- Guide you through service discovery options
- Provide clear instructions for starting services
- Offer to help diagnose connection issues
- Remember your preferences for next time

### Universal Navigation

These work anywhere in the CLI:

- **ESC** - Go back to previous menu/cancel current action
- **Home** - Return to main menu from anywhere
- **Help** - Get context-sensitive help for current screen
- **Back** - Go back to the previous page (greyed out when N/A)
- **Exit** - Safely exit the CLI (preserves session data) (greyed out when N/A)

## User Workflows

### Discovering and Connecting to Services

**What You'll Experience:**

1. CLI starts and shows "Discovering services..." with a progress indicator
2. Found services appear with health status (green check, yellow warning, red error)
3. CLI automatically connects to the healthiest available service
4. You're brought to the main menu with connection status clearly displayed

**If Services Aren't Found:**

- Clear message explaining no services were discovered
- Options to manually specify service location
- Instructions for starting services if needed
- Help links for troubleshooting connection issues

### Working with Projects

**Navigation Path:** Main Menu → Project Management

**Available Actions:**

- View list of all projects with status indicators
- Open specific project (shows project-specific menus)
- Create new project (guided workflow)
- Import existing project (file browser integration)
- Recent projects (quick access to last 5 projects)

**Project-Specific Menus:**
Once in a project, menus adapt to show:

- Project name and current branch in header
- Project-specific commands and tools
- Quick actions relevant to project type
- Breadcrumb navigation showing: Main → Projects → [ProjectName]

### Managing Service Status

**Navigation Path:** Main Menu → Service Status

**Information Displayed:**

- List of all connected services with visual health indicators
- Response time and performance metrics (in user-friendly terms)
- Last activity timestamp
- Service capabilities (what each service can do)

**Available Actions:**

- Refresh service status (with progress indication)
- View detailed service information
- Test service connection
- Switch between multiple services
- Restart services (with confirmation prompts)

### Configuration and Settings

**Navigation Path:** Main Menu → Settings & Configuration

**User-Controllable Options:**

- Display preferences (colors, layout, information density)
- Default service selection and connection preferences
- Keyboard shortcuts customization
- Session persistence settings
- Notification and alert preferences

**Configuration is Immediate:**
Changes take effect right away with visual confirmation. No need to restart or reload.

## Interaction Patterns

### Progressive Disclosure

Menus start simple and reveal more options as needed:

- Main categories shown first
- Subcategories appear when you drill down
- Advanced options available but not cluttering basic workflows
- Breadcrumb navigation always shows where you are

### Contextual Help

Help is always relevant to what you're currently doing:

- Press 'h' or 'help' anywhere for context-specific guidance
- Tips and shortcuts shown in menu footers
- Error messages include suggested next steps
- Examples provided for command syntax

### Visual Feedback

You always know what's happening:

- **Green checkmarks** for successful operations
- **Yellow warnings** for attention needed (but not blocking)
- **Red errors** with clear explanations and recovery suggestions
- **Spinners and progress bars** for operations that take time
- **Status indicators** show connection health, service availability

### Error Recovery

When things go wrong, the CLI helps you fix them:

- Clear, non-technical error descriptions
- Specific suggestions for what to try next
- Option to automatically attempt common fixes
- Graceful degradation when services are unavailable
- Session state preserved even after errors

## Display Standards

### Color Usage

- **Cyan/Blue**: Primary interface elements, highlights
- **Green**: Success states, healthy status
- **Yellow**: Warnings, attention needed
- **Red**: Errors, critical issues
- **White/Gray**: Normal text and backgrounds

### Responsive Design

The interface adapts to your terminal:

- Minimum 80 characters wide, 24 lines tall
- Scales up gracefully on larger terminals
- Maintains readability on different color schemes
- Works in both dark and light terminal themes

## Keyboard Shortcuts

### Universal Shortcuts (work everywhere)

- **ESC**: Go back/cancel current action
- **Ctrl+C**: Emergency exit (preserves session) over two iterations with one confirmation the other actuating
- **Tab**: Auto-complete in command mode
- **?**: Quick help overlay
- **H**: Go home to main menu

### Menu Mode Shortcuts

- **↑/↓**: Navigate menu items
- **Enter**: Select highlighted item
- **1-9**: Direct selection by number
- **C**: Switch to command mode
- **R**: Refresh current view

### Command Mode Shortcuts

- **Tab**: Auto-complete commands and parameters
- **↑/↓**: Command history
- **Ctrl+L**: Clear screen
- **M**: Switch to menu mode

## Accessibility Features

### Terminal Compatibility *Post-MVP*

- Works with screen readers
- High contrast mode available
- Large text options
- Keyboard-only navigation (no mouse required)

### Graceful Degradation

- Functions in limited color terminals
- Works in reduced width terminals
- Maintains usability without special characters
- Provides text alternatives for visual indicators

## Session Management

### Automatic Session Handling

- Sessions start automatically when you launch the CLI
- Session state saved continuously (no manual save needed)
- Automatic reconnection if services restart
- Session history available for troubleshooting

### Session Information Always Visible

- Current session ID shown in status bar
- Connected service name and health status
- Current mode (Menu or Command) indicated
- Time since session started

### Clean Exit Process

- Typing 'quit' or 'exit' starts graceful shutdown
- Confirmation prompt if operations are in progress
- Session data saved automatically
- Cleanup of temporary resources handled transparently

## Performance Expectations

### Responsiveness Targets

- **Menu navigation**: Instant response to key presses
- **Command execution**: Results appear within 1-2 seconds for most operations
- **Service discovery**: Complete within 5 seconds on startup
- **Screen updates**: Smooth, no noticeable lag or flicker

### Progress Communication

For operations that take longer:

- Progress indicators appear immediately
- Time estimates provided when possible
- Option to cancel long-running operations
- Clear completion notification

## Integration Capabilities

### Service Discovery

The CLI automatically finds and connects to:

- Local Templum services running on your machine
- Network services with proper configuration
- Multiple service instances (with intelligent selection)
- Services started after the CLI is already running

### Cross-Platform Support

Consistent experience across:

- Windows (Command Prompt, PowerShell, Windows Terminal)
- macOS (Terminal, iTerm2)
- Linux (various terminal emulators)
- WSL (Windows Subsystem for Linux)

### External Tool Integration

- File system navigation and operations
- Text editor integration for configuration
- Web browser launching for documentation
- Clipboard operations for sharing information

This specification focuses on the user experience and interaction patterns that make the Templum CLI intuitive, efficient, and reliable for daily use. The technical implementation details that enable these experiences are handled transparently by the system.

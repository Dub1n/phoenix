---
date-created: 2025-09-11-0000
last-updated: 2025-09-11-0000
name: terminal-state-management
description: Prevents terminal state corruption when using inquirer in CLI applications
status: established
category: infrastructure
use-when:
  - CLI applications using inquirer for menu navigation
  - Terminal-based user interaction workflows with continuation prompts
  - Preventing nested inquirer session conflicts
keywords:
  - terminal
  - state-management
  - inquirer
  - cli
  - stdin
  - process-control
prerequisites:
  - cli-interface-management
  - event-handling-patterns
related-patterns:
  - cli-process-separation
  - interactive-menu-systems
---

### Terminal State Management Pattern
**Problem**: Terminal state corruption when nesting `inquirer` prompt sessions causes complete CLI freezing where even Ctrl+C becomes unresponsive.
**Solution**: Use compatible input handling that cooperates with main inquirer session rather than creating nested prompt conflicts.

#### Terminal State Management Pattern: Prerequisites

- CLI Interface using `inquirer` for menu navigation
- "Press Enter to continue" prompts or similar input requirements
- Terminal-based user interaction workflows

#### Terminal State Management Pattern: Implementation Steps

**Step 1**: Identify Nested Inquirer Conflicts

```typescript
// **X** PROBLEMATIC: This creates nested inquirer sessions
private async waitForKeypress(): Promise<void> {
  const inquirer = await import('inquirer');
  await inquirer.default.prompt([...]); // While main menu inquirer is active!
}
```

**Step 2**: Implement Compatible Input Handling

```typescript
// ✅ COMPATIBLE: Simple stdin listener that cooperates with inquirer
private async waitForKeypress(): Promise<void> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    
    if (stdin.isTTY) {
      // Use simple listener without changing terminal modes
      stdin.resume();
      const listener = () => {
        stdin.removeListener('data', listener);
        stdin.pause();
        resolve();
      };
      stdin.once('data', listener);
    } else {
      // Non-TTY fallback for automated environments
      setTimeout(() => resolve(), 1000);
    }
  });
}
```

**Step 3**: Proper Cleanup and Error Handling

```typescript
// Ensure proper event listener cleanup
const listener = () => {
  stdin.removeListener('data', listener); // Critical: Remove listener
  stdin.pause();                          // Critical: Pause stdin
  resolve();
};
stdin.once('data', listener);
```

#### Terminal State Management Pattern: Root Cause Analysis

**Common Symptoms**:

- CLI completely freezes after command execution
- "Press Enter to continue" prompts become unresponsive
- Ctrl+C stops working, requiring terminal restart
- Menu appears but accepts no input

**Technical Flow of Problem**:

1. Main menu uses `inquirer.prompt()` for navigation ✅
2. User executes command (e.g., "List Connected Services") ✅
3. Command completes and shows "Press Enter to continue..." ✅
4. **CRITICAL ERROR**: `waitForKeypress()` tries to create another `inquirer.prompt()` **X**
5. Two inquirer sessions fight for terminal control → complete freeze **X**

#### Terminal State Management Pattern: Success Metrics

- CLI navigation works without freezing ✓
- "Press Enter to continue" prompts work correctly ✓
- Ctrl+C remains responsive throughout interaction ✓
- Menu returns work properly after command execution ✓
- Multiple navigation cycles work without terminal corruption ✓

#### Terminal State Management Pattern: Anti-Patterns

- **X** **Nested Inquirer Sessions**: Never create `inquirer.prompt()` while another inquirer session is active
- **X** **Direct setRawMode**: Avoid `process.stdin.setRawMode()` when using inquirer-based systems
- **X** **Missing Event Cleanup**: Always remove event listeners to prevent memory leaks
- **X** **TTY Assumptions**: Always handle non-TTY environments for testing compatibility

#### Terminal State Management Pattern: Validation Checklist

- [ ] Input Compatibility: Simple stdin listeners that don't conflict with inquirer
- [ ] Event Cleanup: Proper listener removal and stdin pause operations
- [ ] Non-TTY Support: Automated fallbacks for testing and CI environments
- [ ] Freeze Prevention: No nested inquirer prompt sessions

#### Terminal State Management Pattern: Implementation Feedback

- **2025-09-02 - [TASK-CLI-009]**: Successfully resolved complete CLI freezing issue in Templum. Root cause was nested inquirer sessions in `waitForKeypress()` method. Applied pattern to both `cli-adapter-abstracted.ts` and `interactive-menu-renderer.ts`. Automated testing confirmed fix works correctly: menu navigation → command execution → "Press Enter" → return to menu without freezing. Pattern prevented terminal state corruption and maintained Ctrl+C responsiveness. Actual time: 2h (est. 1-2h). Pattern application successful on first attempt.

#### Terminal State Management Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-CLI-009] ✅ COMPLETED (2025-09-02)
**Successfully Applied**: [TASK-CLI-009] ✅ CLI UI Freeze After Service List Navigation (2025-09-02)
**Projected Usage**: CLI applications using inquirer, terminal-based user interfaces, command execution workflows with continuation prompts
**Files Using This Pattern**: cli-adapter-abstracted.ts, interactive-menu-renderer.ts
**Integration Points**: Terminal UI Components, CLI Process Separation, Interactive Menu Systems

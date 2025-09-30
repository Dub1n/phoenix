# Claude Code SendKeys Discovery

## Summary

Discovered that PowerShell `SendKeys` from background bash processes can send keystrokes directly to Claude Code interface rather than to terminal processes. This opens up possibilities for programmatic Claude Code automation.

## Key Findings

### Terminal vs Claude Code Interface Targeting

- **Background bash processes**: Isolated from direct keyboard input
- **SendKeys behavior**: Targets active window (Claude Code interface) not background terminal
- **Result**: Keystrokes become user messages in Claude Code conversation

### What We Tested

#### Approach 1: Piped Input (Works Great)

```bash
echo -e "1\n2\n3\n" | node test-interactive.js
```

- **Result**: Perfect for CLI automation
- **BashOutput shows**: Complete interaction flow with prompts and responses
- **Use case**: Pre-scripted CLI interactions for agents

#### Approach 2: PowerShell SendKeys (>/ Unexpected Discovery)

```powershell
[System.Windows.Forms.SendKeys]::SendWait("1{ENTER}")
```

- **Expected**: Send keypresses to background CLI process
- **Actual**: Sent keypresses to Claude Code interface as user messages
- **Discovery**: Accidentally found way to programmatically control Claude Code

### Claude Code Architecture Insights

1. **Agent-Terminal Separation**: Claude Code agents don't "sit in" terminals - they send commands and check results
2. **Background Process Isolation**: Background bash processes can't receive direct keyboard input
3. **Interface Targeting**: SendKeys targets the active Claude Code window, not background processes
4. **Message Flow**: Keystrokes via SendKeys become user input messages

## Potential Applications

### CLI Tool Integration

```bash
# Recommended approach for CLI automation:
echo -e "option1\nvalue2\ny\n" | your-cli-tool

# Or with input files:
your-cli-tool < input-responses.txt
```

### Programmatic Claude Code Control (Experimental)

```powershell
# Could potentially trigger:
[System.Windows.Forms.SendKeys]::SendWait("/build{ENTER}")
[System.Windows.Forms.SendKeys]::SendWait("/test{ENTER}")
[System.Windows.Forms.SendKeys]::SendWait("analyze this error{ENTER}")
```

**Possibilities**:

- Trigger slash commands programmatically
- Send structured input to Claude Code
- Create automated workflows that control Claude Code itself
- Build "meta-automation" - scripts that control the AI assistant

### BashOutput Capabilities

- Shows text output from interactive CLIs
- Displays prompts, menus, and responses
- Truncates long output intelligently
- Cannot show visual/ncurses interfaces
- Perfect for text-based CLI interactions

## Architecture Implications

### For CLI Tool Design

1. **Non-interactive modes**: Provide command-line flags instead of menus
2. **Batch processing**: Accept input files or configuration
3. **API/JSON modes**: Output structured data for agent parsing
4. **Headless operation**: Skip interactive elements when run by agents

### For Claude Code Integration

1. **Piped Input Strategy**: Most reliable for CLI automation
2. **Pre-scripted Responses**: Create input files for complex interactions
3. **Error Handling**: Design CLIs to fail gracefully with invalid piped input
4. **Agent-Friendly Output**: Structure output for easy parsing

## Next Steps & Ideas

### CLI Tool Enhancement

- [ ] Add `--batch` mode that accepts input files
- [ ] Implement `--json` output for structured data
- [ ] Create `--agent-mode` that disables interactive prompts
- [ ] Design input file format for complex workflows

### SendKeys Experimentation

- [ ] Test sending actual Claude Code slash commands
- [ ] Explore timing and window targeting
- [ ] Investigate multi-step automation sequences
- [ ] Test with different Claude Code interface states

### Integration Patterns

- [ ] Document best practices for agent-CLI integration
- [ ] Create template input files for common workflows
- [ ] Design error recovery patterns
- [ ] Build validation for agent-generated inputs

## Technical Notes

### SendKeys Limitations

- Requires active window focus
- Timing-dependent (may need delays)
- Platform-specific (Windows PowerShell)
- May not work reliably in all environments

### Piped Input Advantages

- Platform-independent
- Reliable and predictable
- Easy to test and debug
- Works in headless environments
- Perfect for CI/CD integration

## Experimental Code Snippets

### Basic SendKeys Test

```powershell
# Test sending to Claude Code interface
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait("Hello from PowerShell!{ENTER}")
```

### Advanced CLI Simulation

```bash
# Multi-step CLI interaction
{
  echo "1"           # Select menu option 1
  sleep 1
  echo "config.json" # Provide filename
  sleep 1  
  echo "y"           # Confirm action
  echo "3"           # Exit
} | your-cli-tool
```

### Input File Pattern

```txt
# responses.txt
1
config.json
y
3
```

```bash
your-cli-tool < responses.txt
```

## Observations & Questions

1. **Window Focus**: How does SendKeys determine target window?
2. **Timing**: What delays are needed for reliable SendKeys?
3. **Error States**: How does Claude Code handle malformed SendKeys input?
4. **Security**: Are there restrictions on programmatic input to Claude Code?
5. **Cross-Platform**: Does this work on macOS/Linux with different tools?

## Related Discoveries

- Background bash processes return PIDs immediately
- BashOutput provides intelligent truncation for context management  
- Claude Code agents are "outside" the terminal experience
- Interactive CLIs are fully visible through BashOutput
- Piped input provides complete control over CLI interactions

---

*Discovery Date: 2025-09-04*  
*Context: Testing interactive CLI simulation for agent integration*

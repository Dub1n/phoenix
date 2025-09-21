## Worklog Overview

- Replaced the legacy helper script with a reusable PowerShell module (`Shimdex.psm1`) and slim launcher.
- Removed the Enable/Disable toggle executables; PATH management now lives entirely in the module.
- Introduced a new configuration file at `%APPDATA%\Shimdex\config.json` plus a profile helper that applies workspace rules on every session start.
- Updated the shim (`Ps2WslShim`) to honour the `SHIMDEX_MODE` environment variable before intercepting calls and to support a `Force` mode that skips PowerShell heuristics.
- Added Pester smoke tests that exercise the module with a temporary APPDATA location.
- Normalised incoming command text by converting CRLF to LF before passing payloads to bash so heredocs and multi-line scripts behave consistently.”
- “Prerequisite helper functions (`Test-ShimdexShimPresent`, `Get-ShimdexPrerequisiteStatus`, `Test-ShimdexOperationAllowed`, session-state cache) now exist; menu wiring still pending.”

## Highlights

1. **Module architecture**
   - Exposes `Invoke-ShimdexMenu`, `Get-ShimdexStatus`, `Set-ShimdexMode`, `Set-ShimdexPathState`, `Install-ShimdexProfileSnippet`, `Install-ShimdexAlias`, and related helpers.
   - Stores preferences (mode, workspace roots, alias flag, auto PATH scope) in `%APPDATA%\Shimdex\config.json` and keeps a cache so menu operations stay fast.
   - Workspace-aware `Invoke-ShimdexProfile` sets `SHIMDEX_MODE` and optionally manages PATH every time a session starts inside the profile snippet / alias snippets.

2. **Menu refresh**
   - `shimdex.ps1` now just imports the module and calls `Invoke-ShimdexMenu`; all logic and diagnostics are shared with the rest of the tooling.
   - Menu options match module functions (build, PATH enable/disable, auto PATH toggle, workspace config, profile snippet, alias management, diagnostics).

3. **Shim runtime**
   - Reads `SHIMDEX_MODE` (`Disabled`, `Auto`, `Force`) and short-circuits to the real PowerShell host when disabled.
   - `Force` mode bypasses the PowerShell syntax heuristics so advanced bash payloads run without being blocked.
   - Existing `PS2WSL_BYPASS` override still works.

4. **Testing**
   - `tests/Shimdex.Tests.ps1` imports the module with a scoped APPDATA, asserts default config creation, validates `Set-ShimdexMode` environment updates, and checks `Get-ShimdexStatus` output.

## Follow-ups / Notes

- Renamed exported commands to approved verbs (for example, `Invoke-ShimdexBuild`, `Export-ShimdexConfig`) so Import-Module no longer emits unapproved-verb warnings.
- Additional integration tests that spawn shimmed processes could be added under `tests/` to cover end-to-end routing.
- The config cache currently persists for module lifetime; reload manually (`$script:ConfigCache = $null`) if editing `%APPDATA%\Shimdex\config.json` outside the module.

## Planned UX Enhancements

### Prerequisite states

- Detect shim binary presence (`powershell.exe`) on module import.
- Detect profile snippet installation via `Test-ShimdexProfileSnippet`.
- Track build/install outcomes per session to drive menu messaging.
- Guard commands that require the shim; emit `shim missing` notice (red) instead of silent failure.

### Launch flow updates

- On start, if shim missing → prompt `Shim not found. Build now? (Y/N)`.
  - Success → confirmation + `Press Enter to open menu`.
  - Failure/Decline → note unresolved state, append `Build shim` menu item in red.
- Mirror flow for missing profile snippet (offer install, otherwise append reminder item).
- Maintain reminder flags until prerequisites satisfied.

### Menu experience

- Rename items using task-focused language (e.g., `Enable shim globally`, `Configure shim scope`).
- Append current scope summary (`Configure shim scope (current: Auto)` when workspace set).
- Replace `Toggle automatic path management` with `Automatic PATH updates: On/Off` plus one-line explanation.
- Provide inline guidance for precedence (`Workspace scope overrides global mode when within configured paths`).
- Highlight actions that have limited effect without shim (warning footer in red).

### Diagnostics & feedback

- Extend `Get-ShimdexStatus` to surface prerequisite states and active scope resolution.
- Ensure menu actions reuse status data rather than recomputing.
- Redirect build failures to README troubleshooting anchors for quick follow-up.

### Testing & docs considerations

- Add Pester coverage for: shim-missing prompt decline/accept, guard rails, dynamic labels.
- Update README/ARCHITECTURE with new flow diagrams and terminology.

## Remaining tasks

- Integrate prerequisite prompts and stateful reminders into Invoke-ShimdexMenu.
- Refresh menu copy (task-focused labels, scope summary, PATH management wording).
- Extend Get-ShimdexStatus diagnostics with prerequisite visibility and scope precedence messaging.
- Expand Pester coverage for the new flows (prompt accept/decline, guarded commands, dynamic warnings).
- Final README/ARCHITECTURE updates once UX work lands.

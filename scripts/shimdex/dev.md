## Worklog Overview

- We focused entirely on `scripts/shimdex/shimdex.ps1`, keeping other files untouched.
- Core goals: fix menu option failures (Count errors), ensure alias installation works, improve diagnostics reporting, and make workspace-scope snippet handling reliable.
- Ran many non-persistent command experiments (PowerShell and Bash) to inspect/edit the script and simulate menu interaction; no permanent state changes outside the script itself.

## Key Changes In `scripts/shimdex/shimdex.ps1`

- Added path normalization helpers (`Normalize-ShimPath`, `Test-PathEntriesContainShim`) so diagnostics compare PATH entries case-insensitively and ignore trailing separators.
- Diagnostics now compute “User PATH includes shim” and “Current session PATH includes shim” via these helpers, report session status as True/False, and account for workspace snippets (`Test-ShimdexWorkspaceSnippet`).
- Added `Test-ShimdexWorkspaceSnippet` to detect if the workspace snippet is present before reporting “On next PowerShell session.”
- `Set-LastOutput`/`Render-LastOutput` logic now sanitizes null items so `.Count` errors are gone.
- `Set-SessionAlias` and the profile snippet both now define `shimdex` as a global function and guard null arguments. Current script content still shows `& '$scriptPath' @($args)` in the scriptblock; adjustments to drop the `()` didn’t take (command substitution kept reintroducing it). Functionally, PowerShell still throws when `shimdex` is called without PS2WSL bypass.

## Outstanding Issues

- Alias invocation – invoking the alias still fails:
    `A positional parameter cannot be found that accepts argument 'System.Object[]'.`
- The function currently calls `& '$scriptPath' @($args)`; the issue persists even when simulating with `$env:PS2WSL_BYPASS=1`.
- Diagnostics accuracy – With toggle executables present and workspace snippet installed, diagnostics now report path state correctly during scripted tests. Still need confirmation in a real session (outside our mocked profile).
- PS2WSL shim interference – The shim intercepts PowerShell calls; remember to set `PS2WSL_BYPASS=1` when running helper scripts directly, or run under Bash to avoid shim capture.
- Testing coverage – Our automated menu tests only covered options 7 and 9 with scripted inputs. Other menu actions (build, enable/disable) weren’t run after the recent edits.

## Tests & Observations

- Mocked menu sessions with queued responses to hit options 3, 6, 7, 9, and 0; Count errors are resolved.
- On option 6 we confirmed workspace snippet writes correctly and no longer crashes.
- Diagnostics output shows corrected PATH detection and alias status for the mocked scenario.
- Alias invocation test still fails even after ensuring alias snippet writes to profile and session function exists.
- Verified `PS2WSL_BYPASS` environment variable is required to ensure the script runs in “real” PowerShell rather than through the intercepting shim.

## File State

- `scripts/shimdex/shimdex.ps1` is the only modified file (checked via `git status` and `git diff`). There’s still no committed change set; local tree remains dirty due to pre-existing Ps2Wsl artifacts.
- The script retains the BOM at the start (`\ufeff`), consistent with original encoding.
- Current alias block (around lines 403–433) still reads:

    ```ps1
    param([Parameter(ValueFromRemainingArguments=`$true)][object[]]`$args)
    if (`$null -eq `$args) {`$args = @() }
    & '$scriptPath' @($args)
    ```

    and similarly in the alias snippet. Need to revisit to remove `@($args)` and replace with `@args`, then re-test.
- Diagnostics function (roughly lines 232–262) now uses the new helper functions and status logic.

## Notes on Non-`shimdex.ps1` Adjustments

Based on everything we’ve seen so far, the misbehaviour is rooted in shimdex.ps1 itself—especially the alias-handling logic and how it invokes the script—rather than any obvious defects in the surrounding files. Nothing else has jumped out as “broken.” That said:

- There are a lot of compiled helpers (EnableShim.exe, DisableShim.exe, powershell.exe shim) plus the .NET projects under src/*. I haven’t inspected them this round, but the menu’s PATH toggling relies on those binaries (or their inline fallbacks). If we discovered they weren’t updating PATH correctly in practice, we’d have to look there too—but our PATH checks now show the toggles do persist, so I’d only revisit them if future tests say otherwise.

- The alias still fails entirely inside shimdex.ps1. You could choose to offload alias creation into a dedicated helper file (e.g., a separate .psm1 with a function that installs/removes aliases). Architecturally that might feel cleaner, and it would simplify the PowerShell quoting we keep fighting. But it isn’t necessary just to fix the current bug; resolving the @($args) call or building a wrapper function inside the script will probably be quicker.

- The workspace scope snippet embedded in the user profile is generated by the menu option. If we wanted to reduce fragility (quoting, escaping, event registration), we could extract that snippet into its own template file or module and import it, rather than emitting a here-string. That would make the menu script smaller and easier to maintain, but again it’s an optional architectural improvement rather than a prerequisite to fixing the alias bug.

- Documentation (README.md, dev.md) and the JSON settings file don’t influence runtime behaviour directly. Updates there won’t surface as functional fixes, though having precise documentation (like the queued-input recipe you just requested) certainly makes future debugging easier.

So in short: there’s no evidence that other files are actively breaking the menu, and the quickest path remains patching the alias logic inside shimdex.ps1. Larger architectural moves—splitting the script into modules, templating snippets, or revisiting the binaries—could be worthwhile for long-term maintenance, but they aren’t required to resolve the immediate issue.

## Workflow Tips Going Forward

1. When editing via CLI, prefer Bash () with Python helpers to avoid shim issues; if PowerShell must be used, set .
2. Double-check alias invocation by launching a new PowerShell session (with bypass) after reinstalling via menu option 7.
3. If alias still fails, change the invocation lines to  and , ensuring these replacements actually persist (watch quoting/backticks in the editing tool).
4. After alias fix, re-run menu options 7 → 9 → 0; confirm diagnostics show alias as “Available (current session).”
5. Consider adding a dedicated “debug mode” or scripted test harness if repeated regression checks are needed.
6. To check if the shim is enabled in path without using the helper menu, a single command that includes the bypass to do so is:

    ```powershell
    $env:PS2WSL_BYPASS = '1'
    $shim = 'C:\Users\gabri\Documents\Infotopology\VDL_Vault\scripts\shimdex'
    & 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -NoProfile -Command {
        param($ShimDir)
        $target  = [System.IO.Path]::GetFullPath($ShimDir).TrimEnd('\','/')
        $entries = ([Environment]::GetEnvironmentVariable('PATH','User') -split ';') | Where-Object { $_ }
        $found   = $false
        foreach ($entry in $entries) {
            try   { $candidate = [System.IO.Path]::GetFullPath($entry).TrimEnd('\','/') }
            catch { continue }
            if ([string]::Equals($candidate, $target, [System.StringComparison]::OrdinalIgnoreCase)) {
                $found = $true
                break
            }
        }
        $found
    } -Args $shim
    ```

7. To replay menu flows without manual input, pre-queue responses and stub `Read-Host` before dot-sourcing the script. Adjust the enqueued numbers to exercise different menu paths (e.g., swap in 3,6,8 to test toggle and workspace options). Example (always run with `PS2WSL_BYPASS=1` in case the shim is active):
  
   ```powershell
   $tempProfile = Join-Path ([System.IO.Path]::GetTempPath()) 'shimdex-test-profile.ps1'
   if (Test-Path $tempProfile) { Remove-Item $tempProfile -Force }
   $global:PROFILE = $tempProfile
   $global:__responses = [System.Collections.Generic.Queue[string]]::new()
   '7','9','0' | ForEach-Object { $global:__responses.Enqueue($_) }
   function Read-Host {
       param([string]$Prompt)
       if ($global:__responses.Count -gt 0) { return $global:__responses.Dequeue() }
       throw 'No more scripted responses available.'
   }
   $env:PS2WSL_BYPASS = '1'
   .\scripts\shimdex\shimdex.ps1

## User Stories: Codex Agent

Here’s what happened while I was trying to append the workflow tip:

### What I attempted

Convert `scripts/shimdex/dev.md` to LF (`python3 … replace '\r\n'`), which succeeded.
Use `apply_patch` from a Bash shell (`bash -lc … apply_patch <<'PATCH'`) to replace the existing “Workflow Tips Going Forward” bullet list with an updated version that included a detailed item 6 showing how I preloaded menu responses via `Read-Host` stubbing.

### What the shell returned

Every `apply_patch` run failed with
`error: Failed to read file to update c:/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault\scripts/shimdex/dev.md: The system cannot find the path specified. (os error 3)`
The error path mixes `c:/mnt/c/...`, which indicates `apply_patch` interpreted the repo root twice (likely because I was already in `/mnt/c/...` and it re-prepended a Windows-style prefix). When that happened, Git couldn’t find the file, so the patch never applied—hence “system cannot find the path specified.”

### What I expected

`apply_patch` to locate the file correctly under the repo root and insert the new bullet, after which another `cat` would show the revised section.

## User notes

Maybe it would be easier to have a toggle for powershell commands that is like the bypass but in reverse (sort of), as in, the 'only thing' that determines whether it is on or not is if there is a `shimdex=0` or `shimdex=1` prefix. The options to "enable globally", "disable globally", and "set scope" change whether or not this is set to 0 or 1 in the powershell profile. The powershell profile might be able to outsource the functionality to a helper-file in the shimdex folder if needed to keep as little in there as possible i.e. it would have something that does `if shimdex = 0: nothing; if shimdex=1: include helper-file`.
The helper-file could even be the .shimdex-settings.json (if appropriate, might not be)
The logic to determine whether the shell is in the workspace scope can be either in the powershell script or in the helper-file

## Architectural Rework **New**

### Why the current setup is brittle

1. Shim always wins once PATH is patched
    The published `powershell.exe` shim sits at the front of PATH. Once that happens, *every* `powershell.exe` invocation—no matter how simple or internal—goes through the shim. There’s no fine‑grained “only wrap Codex commands” logic.

2. Shim parses before PowerShell sees anything
    The shim deconstructs command lines, rewrites them for WSL, and only afterwards, if it decides not to handle them, launches the real PowerShell. This means:
        - Complex quoting gets chewed up or misparsed.
        - Secret-scrubbed `$variables` turn into empty strings; the shim sees them as literal blanks.
        - Debugging is painful because errors surface in the shim, not in the command you issued.

3. No positive activation state
    Today “Active” is synonymous with `“powershell.exe` rewritten and PATH mutated.” There’s no quick on/off flag—only menu operations that rewrite user PATH or profile snippets. That makes it easy to forget you’re still running through the shim. It also means nested shells (or the helper menu itself) inherit the shim automatically.

4. Profile snippets do heavy lifting
    The workspace scope snippet and alias function embed a lot of logic inline. A typo, quoting error, or unforeseen case there can break host shells without any guardrails.

5. Menu script chases state without authoritativeness
    The `.shimdex-settings.json`, profile snippets, actual PATH, and the shim binary can all drift apart. The menu uses diagnostics to infer state but has no single source of truth, so corner cases slip through.

### What your “shimdex=0/1” idea buys us

You’re proposing a positive control flag. That’s a smart direction because it narrows the decision-making to a simple check before the shim does anything:

- **Environment-driven**: the shim reads env var `SHIMDEX=1` (or similar). If missing/`0`, it just launches real PowerShell immediately. That’s the inverse of the bypass and makes the script more predictable.
- **Profile responsibility**: enabling globally just sets the flag in your profile; disabling unsets it. Workspace scopes only flip the flag when you’re inside the repo. No more PATH rewriting just to enable or disable.
    Helper file: the profile snippet can shrink to:
    `if ($env:SHIMDEX -eq '1') { . '...helper.ps1' }`
    That helper can handle workspace detection, set `SHIMDEX`, and maybe even manage PATH injection if we still need it.

Big wins:

- Commands outside the workspace return to native PowerShell with zero shim code running.
- Nested scripts can opt in or out simply by setting/unsetting the flag.
- Menu operations become simple environment mutations rather than rewriting PATH each time.

### What needs rework beyond the flag

1. **Rewrite the shim’s entry point**
    It should:
        - Load configuration (JSON/profile) first.
        - Bail to real PowerShell instantly if `SHIMDEX=0`.
        - If active, convert the command to a WSL payload and exit without ever launching the real `powershell.exe`, unless the payload is on the “blocked” list.
    Right now the shim still falls through and calls the real host, which is why our simple PowerShell commands kept running in Windows despite the shim.

2. **Re-evaluate PATH manipulation**
    If the shim returns to being a drop-in replacement for powershell.exe, we might not need `EnableShim.exe`/`DisableShim.exe` at all. A profile snippet inserting the shim’s directory at the front of PATH might suffice. That makes menu options 4/5 (Enable/Disable) easier.

3. **Simplify workspace logic**
    Instead of embedding a giant here-string, let the profile call something like `Invoke-ShimdexWorkspaceScope`. That function:
        - reads `.shimdex-settings.json`,
        - compares `$PWD` to the chosen workspace,
        - sets `SHIMDEX=1` or `0`,
        - adjusts PATH if we still want automatic toggling.

4. **Separate CLI from shim core**
    Move heavy logic (alias, workspace, diagnostics, PATH toggles) into a module. Let shimdex.ps1 be just the menu UI that calls module functions. That makes the profile snippet shorter and reduces quoting issues.

5. **Testing harness**
    Build a small script that flips the flag, spawns new PowerShell instances with specific arguments, and asserts that the shim routes them correctly (WSL vs. native). That’s how we’ll know the new architecture behaves before installing it globally.

### Practical next steps

1. **Add an environment flag check to the shim** and short-circuit to real PowerShell unless `SHIMDEX=1`. This alone reduces accidental interception.

2. **Update the profile snippet** to manage only the flag and call a helper. Make the helper a normal `.ps1` next to the shim so the profile stays simple.

3. **Decide how to manage PATH** going forward:
    - Option A: keep `EnableShim.exe`/`DisableShim.exe` but add a layer that sets `SHIMDEX=1` before they do PATH work.
    - Option B: rely on `Set-Item Env:Path` inside the profile snippet plus the flag; drop the compiled helpers entirely.

4. **Refactor the menu** to use module functions rather than duplicating logic inline. That’s mostly a cleanup step but will make future debugging easier.

5. **Re-test alias**: with the flag logic in place and the shim only active when `SHIMDEX=1`, the alias function becomes straightforward—no scriptblock rewriting needed.

### Why the menu broke so easily

Because the shim intercepted its own helper commands. Every time the menu ran `Get-Content` or `Set-Content`, the shim examined it, split arguments, and tried to feed them to WSL. Even simple edits via `powershell -Command` were getting “helpfully” rerouted. Once we add a flag check and keep the shim dormant unless explicitly enabled, the menu should behave like a normal script again.

### Summary

- The core problem is the shim’s default-to-intercept design.
- Introducing a `SHIMDEX=1/0` flag swaps us to explicit opt-in and greatly reduces unintended parsing.
- Moving logic into helper modules + profile flag checks improves maintainability.
- After that, the menu can stay small and actually work reliably.

It’s real work—essentially a mini redesign—but it lines up with your original goal: “run PowerShell commands via WSL unless I say otherwise,” without having the shim hijack everyday shell use.

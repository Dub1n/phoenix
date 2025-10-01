It sounds like the shim itself (or the powershell profile invocation of it, either/or I'm not certain) could do with some serious work on when it decides to take effect and what it parses/doesn't. I had an idea for the infrastructure that might help, maybe not, but is there a solution to this? In fact, the point of the shim was to *not* call the real powershlle when powershell is called invoked with `powershell.exe` - it's supposed to pass the command to WSL (with some parsing), only sending it through (in fact, not doing anything at all ideally) if the command is one that wouldn't work in WSL (the `Commands Blocked With “Use PS2WSL_BYPASS”`). It sounds like it isn't doing that, and is letting the `powershell.exe` through as well, even after setting up the WSL bridge.
Anyway, the thought I had was:

- Maybe it would be easier to have a toggle for powershell commands that is like the bypass but in reverse (sort of), as in, the 'only thing' that determines whether it is on or not is if there is a `shimdex=0` or `shimdex=1` prefix. The options to "enable globally", "disable globally", and "set scope" change whether or not this is set to 0 or 1 in the powershell profile. The powershell profile might be able to outsource the functionality to a helper-file in the shimdex folder if needed to keep as little in there as possible i.e. it would have something that does `if shimdex = 0: nothing; if shimdex=1: include helper-file`.
- The helper-file could even be the .shimdex-settings.json (if appropriate, might not be)
- The logic to determine whether the shell is in the workspace scope can be either in the powershell script or in the helper-file
but you will have to tell me if that would be any good, either on it's own as an adjustment or as a way to help with any of this.
Overall, this whole thing is smelling like it needs an architectural restructuring or something, it *shouldn't* be that hard to get the menu to work - it is literally just a list of options to run powershell commands that individually all work - so why is it failing, other than something wrong *outisde* the menu?
Give me your thoughts on all of this, in detail, going over any and every idea that pops into your head. I need a deep dive into this so wrap your head around it please

You’re absolutely right: for something that’s “just” a menu of PowerShell actions, the amount of friction we keep hitting is a red flag that the whole shim/proxy architecture needs a hard look.

Why the current setup is brittle
Shim always wins once PATH is patched
The published powershell.exe shim sits at the front of PATH. Once that happens, every powershell.exe invocation—no matter how simple or internal—goes through the shim. There’s no fine‑grained “only wrap Codex commands” logic.

Shim parses before PowerShell sees anything
The shim deconstructs command lines, rewrites them for WSL, and only afterwards, if it decides not to handle them, launches the real PowerShell. This means:

Complex quoting gets chewed up or misparsed.
Secret-scrubbed $variables turn into empty strings; the shim sees them as literal blanks.
Debugging is painful because errors surface in the shim, not in the command you issued.
No positive activation state
Today “Active” is synonymous with “powershell.exe rewritten and PATH mutated.” There’s no quick on/off flag—only menu operations that rewrite user PATH or profile snippets. That makes it easy to forget you’re still running through the shim. It also means nested shells (or the helper menu itself) inherit the shim automatically.

Profile snippets do heavy lifting
The workspace scope snippet and alias function embed a lot of logic inline. A typo, quoting error, or unforeseen case there can break host shells without any guardrails.

Menu script chases state without authoritativeness
The .shimdex-settings.json, profile snippets, actual PATH, and the shim binary can all drift apart. The menu uses diagnostics to infer state but has no single source of truth, so corner cases slip through.

What your “shimdex=0/1” idea buys us
You’re proposing a positive control flag. That’s a smart direction because it narrows the decision-making to a simple check before the shim does anything:

Environment-driven: the shim reads env var SHIMDEX=1 (or similar). If missing/0, it just launches real PowerShell immediately. That’s the inverse of the bypass and makes the script more predictable.
Profile responsibility: enabling globally just sets the flag in your profile; disabling unsets it. Workspace scopes only flip the flag when you’re inside the repo. No more PATH rewriting just to enable or disable.
Helper file: the profile snippet can shrink to:
if ($env:SHIMDEX -eq '1') { . '...helper.ps1' }
That helper can handle workspace detection, set SHIMDEX, and maybe even manage PATH injection if we still need it.
Big wins:

Commands outside the workspace return to native PowerShell with zero shim code running.
Nested scripts can opt in or out simply by setting/unsetting the flag.
Menu operations become simple environment mutations rather than rewriting PATH each time.
What needs rework beyond the flag
Rewrite the shim’s entry point
It should:

Load configuration (JSON/profile) first.
Bail to real PowerShell instantly if SHIMDEX=0.
If active, convert the command to a WSL payload and exit without ever launching the real powershell.exe, unless the payload is on the “blocked” list.
Right now the shim still falls through and calls the real host, which is why our simple PowerShell commands kept running in Windows despite the shim.

Re-evaluate PATH manipulation
If the shim returns to being a drop-in replacement for powershell.exe, we might not need EnableShim.exe/DisableShim.exe at all. A profile snippet inserting the shim’s directory at the front of PATH might suffice. That makes menu options 4/5 (Enable/Disable) easier.

Simplify workspace logic
Instead of embedding a giant here-string, let the profile call something like Invoke-ShimdexWorkspaceScope. That function:

reads .shimdex-settings.json,
compares $PWD to the chosen workspace,
sets SHIMDEX=1 or 0,
adjusts PATH if we still want automatic toggling.
Separate CLI from shim core
Move heavy logic (alias, workspace, diagnostics, PATH toggles) into a module. Let shimdex.ps1 be just the menu UI that calls module functions. That makes the profile snippet shorter and reduces quoting issues.

Testing harness
Build a small script that flips the flag, spawns new PowerShell instances with specific arguments, and asserts that the shim routes them correctly (WSL vs. native). That’s how we’ll know the new architecture behaves before installing it globally.

Practical next steps
Add an environment flag check to the shim and short-circuit to real PowerShell unless SHIMDEX=1. This alone reduces accidental interception.

Update the profile snippet to manage only the flag and call a helper. Make the helper a normal .ps1 next to the shim so the profile stays simple.

Decide how to manage PATH going forward:

Option A: keep EnableShim.exe/DisableShim.exe but add a layer that sets SHIMDEX=1 before they do PATH work.
Option B: rely on Set-Item Env:Path inside the profile snippet plus the flag; drop the compiled helpers entirely.
Refactor the menu to use module functions rather than duplicating logic inline. That’s mostly a cleanup step but will make future debugging easier.

Re-test alias: with the flag logic in place and the shim only active when SHIMDEX=1, the alias function becomes straightforward—no scriptblock rewriting needed.

Why the menu broke so easily
Because the shim intercepted its own helper commands. Every time the menu ran Get-Content or Set-Content, the shim examined it, split arguments, and tried to feed them to WSL. Even simple edits via powershell -Command were getting “helpfully” rerouted. Once we add a flag check and keep the shim dormant unless explicitly enabled, the menu should behave like a normal script again.

Summary
The core problem is the shim’s default-to-intercept design.
Introducing a SHIMDEX=1/0 flag swaps us to explicit opt-in and greatly reduces unintended parsing.
Moving logic into helper modules + profile flag checks improves maintainability.
After that, the menu can stay small and actually work reliably.
It’s real work—essentially a mini redesign—but it lines up with your original goal: “run PowerShell commands via WSL unless I say otherwise,” without having the shim hijack everyday shell use.

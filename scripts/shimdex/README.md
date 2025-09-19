# shimdex PowerShell Shim

Location: `scripts/shimdex` relative to the repository root.

This folder contains the build of the `powershell.exe` shim that redirects Codex CLI command execution into WSL, along with utilities for enabling or disabling the shim by manipulating the user `PATH`.

## Layout

* Runtime-ready binaries live directly in `scripts/shimdex` (`powershell.exe`, `EnableShim.exe`, `DisableShim.exe`).
* All source projects sit under `scripts/shimdex/src`.
  * `src/Ps2WslShim/` produces the shim binary and renames it to `powershell.exe` during publish.
  * `src/EnableShim/` and `src/DisableShim/` build the optional toggle utilities (still available if you prefer self-contained executables).

## Getting started

1. Ensure you are on Windows with WSL available at `wsl.exe`, and install the .NET 8.0 SDK (LTS).
2. From this directory, launch the helper menu:

   ```powershell
   .\shimdex.ps1
   ```

   The menu drives every common task:
   * `1` builds the shim (`powershell.exe` + `Ps2WslShim.pdb`).
   * `2` builds the optional toggle executables (`EnableShim.exe`, `DisableShim.exe`).
   * `3` toggles whether enable/disable operations prefer those executables or inline PATH edits.
   * `4` / `5` enable or disable the shim globally for the current user.
   * `6` installs or updates the workspace-scoped profile snippet (with a built-in fallback if the toggle executables are missing).
   * `7` installs a global `shimdex` function so you can launch the menu from any PowerShell session.
   * `8` removes the workspace snippet and the alias from both your profile and the current session.
   * `9` shows diagnostics; `0` exits the helper.

   Preferences are stored in `.shimdex-settings.json` next to this script.

### Manual build commands

If you prefer to run the `dotnet` commands yourself, the helper’s first two menu items are equivalent to:

```powershell
dotnet publish src/Ps2WslShim/Ps2WslShim.csproj -c Release
dotnet publish src/EnableShim/EnableShim.csproj -c Release
dotnet publish src/DisableShim/DisableShim.csproj -c Release
```

The shim publish drops `powershell.exe` and `Ps2WslShim.pdb` into `scripts\shimdex`. The toggle publishes create `EnableShim.exe`/`DisableShim.exe` alongside them.

### Enable or disable manually (no toggle executables)

```powershell
$shimDir = (Resolve-Path scripts\shimdex).Path

# Enable
setx PATH "$shimDir;$env:PATH"
$env:PATH = "$shimDir;$env:PATH"

# Disable
$filtered = ($env:PATH -split ';' | Where-Object { $_ -and ($_ -ne $shimDir) }) -join ';'
setx PATH $filtered
$env:PATH = $filtered
```

`setx` updates the user-scoped PATH for new shells, while the `$env:PATH` assignments adjust the current session immediately.

### Choosing the real PowerShell host

The shim discovers the native host in this order:

* `PS2WSL_REAL_POWERSHELL` environment variable (set it to an absolute path if you need a custom build).
* PowerShell 7 (`pwsh.exe`) from the registry or common `Program Files` locations.
* Any `pwsh.exe` / `powershell.exe` already on `PATH`.
* Built-in Windows PowerShell (`%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe`).

The discovery runs on every bypass and before handing control back to native PowerShell.

### Optional: scope the shim to a specific workspace

Menu option `6` writes a PowerShell profile snippet that automatically enables the shim when you start inside a chosen directory tree and disables it elsewhere. If you prefer to manage the snippet yourself, the helper writes the following template—replace the placeholders and append it to `$PROFILE`:

```powershell
$shimDir = 'C:\path\to\repo\scripts\shimdex'
$workspace = 'C:\Projects\YourWorkspace'

$snippet = @"
# >>> shimdex workspace start
function Invoke-ShimdexEnable {
    param([string]`$ShimDir)
    `$exe = Join-Path `$ShimDir 'EnableShim.exe'
    if (Test-Path `$exe) {
        & `$exe | Out-Null
    }
    else {
        `$entries = ([Environment]::GetEnvironmentVariable('PATH','User') -split ';' | Where-Object { `$_ -and (`$_ -ne `$ShimDir) })
        `$newPath = (@(`$ShimDir) + `$entries) -join ';'
        [Environment]::SetEnvironmentVariable('PATH', `$newPath, 'User')
        `$processEntries = (`$env:PATH -split ';' | Where-Object { `$_ -and (`$_ -ne `$ShimDir) })
        `$env:PATH = (@(`$ShimDir) + `$processEntries | Select-Object -Unique) -join ';'
    }
}

function Invoke-ShimdexDisable {
    param([string]`$ShimDir)
    `$exe = Join-Path `$ShimDir 'DisableShim.exe'
    if (Test-Path `$exe) {
        & `$exe | Out-Null
    }
    else {
        `$entries = ([Environment]::GetEnvironmentVariable('PATH','User') -split ';' | Where-Object { `$_ -and (`$_ -ne `$ShimDir) })
        `$newPath = (`$entries | Select-Object -Unique) -join ';'
        [Environment]::SetEnvironmentVariable('PATH', `$newPath, 'User')
        `$processEntries = (`$env:PATH -split ';' | Where-Object { `$_ -and (`$_ -ne `$ShimDir) })
        `$env:PATH = (`$processEntries | Select-Object -Unique) -join ';'
    }
}

$__shimdexShimDir = '$shimDir'
$__shimdexWorkspace = '$workspace'
$__shimdexCurrent = [System.IO.Path]::GetFullPath((Get-Location).Path)

if ($__shimdexCurrent.StartsWith($__shimdexWorkspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    Invoke-ShimdexEnable -ShimDir $__shimdexShimDir
    Register-EngineEvent PowerShell.Exiting -Action { Invoke-ShimdexDisable -ShimDir '$shimDir' } | Out-Null
}
else {
    Invoke-ShimdexDisable -ShimDir $__shimdexShimDir
}

Remove-Item Variable:__shimdexShimDir,Variable:__shimdexWorkspace,Variable:__shimdexCurrent -ErrorAction SilentlyContinue
# <<< shimdex workspace end
"@

New-Item -ItemType Directory -Path (Split-Path $PROFILE) -ErrorAction SilentlyContinue | Out-Null
Add-Content -Path $PROFILE -Value $snippet
```

Menu option `7` installs an alias so `shimdex` launches this helper from any PowerShell session. To add it manually:

```powershell
$shimScript = 'C:\path\to\repo\scripts\shimdex\shimdex.ps1'
$aliasSnippet = @"
# >>> shimdex alias start
function shimdex {
    param([Parameter(ValueFromRemainingArguments=`$true)]`$args)
    & '$shimScript' @args
}
# <<< shimdex alias end
"@

Set-Item -Path Function:shimdex -Value ([ScriptBlock]::Create("param([Parameter(ValueFromRemainingArguments=`$true)]`$args)`n& '$shimScript' @args")) -Force
Add-Content -Path $PROFILE -Value $aliasSnippet
```

The helper’s removal option (`8`) undoes both snippets and clears the session alias.

## What the shim does

* Wraps calls to `powershell.exe` so they run under `wsl.exe bash -lc`.
* Mirrors enough of the native PowerShell command line surface to accept typical flags (`-Command`, `-File`, `-EncodedCommand`, etc.).
* Normalises working directories by translating Windows paths into their WSL equivalents before passing them to bash.
* Provides a heuristic that spots invocations which are still genuine PowerShell scripts and advises the operator to bypass the shim instead of sending broken syntax to bash.
* Supports an escape hatch via `PS2WSL_BYPASS=1` so you can drop back to the real PowerShell whenever you need it.

## How it works (`src/Ps2WslShim/Program.cs`)

`src/Ps2WslShim/Program.cs` contains a single `Main` that:

1. Checks the `PS2WSL_BYPASS` environment variable. When set, the shim launches the real `powershell.exe` (or `pwsh.exe`) with the received arguments untouched.
2. Parses CLI options and captures payloads for `-Command`, `-File`, or `-EncodedCommand` (UTF-16LE decoding is applied for encoded payloads).
3. Converts the current working directory and file paths into WSL form using `wslpath` semantics implemented in managed code.
4. Normalises the command string - lightly unescapes PowerShell quoting unless the payload came from `-EncodedCommand`.
5. Applies heuristics in `LooksLikePowerShellScript` to detect statements that still need real PowerShell (assignment to `$variables`, `[Type]::StaticMember`, or canonical verb-noun cmdlets). When detected the shim exits early with guidance to use `PS2WSL_BYPASS=1`.
6. Fast-paths any payload that already invokes `wsl` or `bash -lc` to avoid double wrapping.
7. For everything else builds `bash -lc "cd <cwd> && <payload>"` and executes it through `RunWsl`.

### Additional helpers

* `DePs` removes one layer of PowerShell quoting/backtick escaping.
* `RunWsl`, `RunWslArgsString`, and `Run` abstract process creation for Windows vs. WSL.
* `ToWslPath` implements path normalisation for drive letters, UNC shares, and `\\wsl$` mounts.
* `AdvisePowerShellBypass` and `LooksLikePowerShellScript` house the heuristic logic.

Setting `PS2WSL_DEBUG_PATH` to a writable file path will capture debugging traces if you add calls to `DebugLog` (left unhooked by default to keep release noise down).

## Commands

### Typical Bash Commands → Run in WSL

```powershell
uname -a && echo "$SHELL" && pwd
# Plain shell pipeline; no PowerShell markers, so the shim forwards it directly to bash -lc.

rg -n --max-columns 200 -S "TODO|FIXME" || true
# Uses POSIX quoting/operators; runs fine in bash.

fd '\.(ts|js|rs|py|md)$' | head -n 20
# Pipe-heavy command, still valid bash syntax.

wsl bash -lc "echo hi" or bash -lc "pwd"
# Already WSL-aware payloads, so the shim just hands them through without re-wrapping.

sed 's/foo/bar/g' < file.txt
# No PowerShell-only tokens, so it executes in bash.
```

### Commands Blocked With “Use PS2WSL_BYPASS”

```powershell
$pl = 'wsl bash -lc "...'
# $variable = … assignment marks it as PowerShell-specific.

[Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes('hello'))
# [Type]::Member access triggers the heuristic.

Get-ChildItem $HOME (or any Verb-Noun cmdlet such as Set-Content, Write-Host, etc.)
# Verb–noun pattern is assumed to be PowerShell-centric.

$env:FOO = 'bar'; Get-Process
# Still blocked due to $env: usage and cmdlets.

Import-Module SomeModule / Remove-Item foo.txt
# Standard cmdlets; you’ll get the bypass guidance instead of a bash failure.
```

### Edge Cases / Notes

`-EncodedCommand` payloads skip the heuristic (`PowerShell’s powershell.exe -EncodedCommand ...`), so whatever you encode will run in bash exactly as sent after decoding; use with care.

Plain commands that happen to work in both shells (e.g. `echo hi`, `dir`) continue to run in bash unless they match the heuristic patterns above.

If you actually need those PowerShell commands, either set `PS2WSL_BYPASS=1` before invoking them or run `scripts\shimdex\DisableShim.exe` to restore native PowerShell resolution.

## Utility binaries

Alongside the shim there are two helper executables built from `src/EnableShim/` and `src/DisableShim/`:

* `EnableShim.exe` prepends the directory that contains these binaries to the user `PATH`. The exe determines the directory at runtime (its own location) and double checks that `powershell.exe` exists before touching `PATH`.
* `DisableShim.exe` removes that directory from the user `PATH`.

Both utilities update the user-scoped `PATH` **and** the current process `PATH`, so shells spawned afterwards will immediately see the change, while existing shells need a restart.

## Typical usage

1. Build the shim in-place:

   ```powershell
   dotnet publish src/Ps2WslShim/Ps2WslShim.csproj -c Release
   ```

2. Enable the shim for the current user (from this directory):

   ```powershell
   scripts\shimdex\EnableShim.exe
   ```

3. Launch Codex CLI / shells as normal. Any `powershell.exe` resolution that hits this directory first will now execute through WSL.
4. When a true PowerShell command is required, call:

   ```powershell
   $env:PS2WSL_BYPASS = '1'
   powershell.exe -NoProfile -Command 'Get-Process'
   ```

5. To disable the shim and restore the prior `PATH` ordering:

   ```powershell
   scripts\shimdex\DisableShim.exe
   ```

## Diagrams

```mermaid
flowchart TD
    PS[Agent/tool invokes powershell.exe]
    SHIM[ps2wsl shim (scripts/shimdex/powershell.exe)]
    CHECK{PS2WSL_BYPASS set?}
    REAL[Launch real PowerShell]
    PARSE[Parse CLI flags]
    DECODE[Decode -EncodedCommand payloads]
    HEUR{LooksLikePowerShellScript?}
    TIP[Emit bypass guidance\n(exit with message)]
    FAST{Already wsl/bash call?}
    WRAP[Wrap with bash -lc\n(cd <cwd> && payload)]
    WSL[wsl.exe]
    BASH[bash -lc subprocess]
    OUT[(Command output)]

    PS --> SHIM --> CHECK
    CHECK -- yes --> REAL --> OUT
    CHECK -- no --> PARSE --> DECODE --> HEUR
    HEUR -- yes --> TIP
    HEUR -- no --> FAST
    FAST -- yes --> WSL --> BASH --> OUT
    FAST -- no --> WRAP --> WSL --> BASH --> OUT
```

```mermaid
flowchart LR
    subgraph Toggle Utilities (scripts/shimdex)
        EN[EnableShim.exe]
        DI[DisableShim.exe]
    end
    EN -->|Add scripts\shimdex to user PATH (front)| PATH[(User PATH)]
    DI -->|Remove scripts\shimdex from user PATH| PATH
    PATH -->|Resolution order| RES[tools resolving powershell.exe]
    RES -->|Finds shim first?| SHIM[ps2wsl shim binaries]
```

## Maintenance guide

* Source layout:
  * `src/Ps2WslShim/Program.cs` - shim entry point.
  * `src/Ps2WslShim/Ps2WslShim.csproj` - main project (publishes to the directory root and renames the output to `powershell.exe`).
  * `src/EnableShim/` and `src/DisableShim/` - source and project files for the toggle executables.
* Build everything (shim + toggles) with a single command:

  ```powershell
  dotnet publish src/Ps2WslShim/Ps2WslShim.csproj -c Release
  dotnet publish src/EnableShim/EnableShim.csproj -c Release
  dotnet publish src/DisableShim/DisableShim.csproj -c Release
  ```

* Update path detection heuristics inside `LooksLikePowerShellScript(string text)` - extend the regexes or add new checks as needed.
* Adjust path translation in `ToWslPath` if additional mount patterns appear in your environment.
* When editing the shim, rebuild to refresh `powershell.exe` so the latest logic is available to tooling.
* The toggle utilities assume they live in the same directory as `powershell.exe`; if you relocate files, rebuild or adjust their logic accordingly.
* Override the native host by setting `PS2WSL_REAL_POWERSHELL` to an absolute executable path when the automatic discovery order does not match your setup.

## Troubleshooting

* **Shim not triggered** - ensure this folder is the first match for `powershell.exe` on `PATH`. Run `where powershell` to confirm resolution order.
* **Command rejected with bypass message** - the heuristics detected PowerShell-specific syntax. Either set `PS2WSL_BYPASS=1` for that call or refine `LooksLikePowerShellScript` if the false positive is acceptable in WSL.
* **WSL path translation errors** - verify that the Windows working directory you start from exists inside WSL (especially for new drives or UNC paths). Extend `ToWslPath` as required.
* **Need native PowerShell** - temporarily disable via `scripts\shimdex\DisableShim.exe` or export `PS2WSL_BYPASS=1` before launching tools.

---

All binaries here target .NET 8.0 (LTS). Keep the SDK updated or adjust the `<TargetFramework>` if you standardise on a different runtime.

# Shimdex Architecture (2025-09-19T180000Z)

## Goals

- Centralise shim state in a PowerShell module so menu, profiles, and diagnostics share one codepath.
- Replace compiled toggle helpers with native PowerShell path management.
- Add an explicit runtime contract (SHIMDEX_MODE) that the shim honours before intercepting calls.
- Make profile and workspace integration declarative and minimal, avoiding inline helper here-strings.
- Provide repeatable diagnostics and automation hooks for testing.

## Layout

scripts/shimdex/
  ARCHITECTURE.md         (this document)
  README.md               (user-facing guide)
  Shimdex.psm1            (module implementation)
  Shimdex.psd1            (module manifest)
  shimdex.ps1             (thin launcher that imports the module and calls the menu)
  src/
    Ps2WslShim/           (shim console app; honours SHIMDEX_MODE)
  tests/
    Shimdex.Tests.ps1     (Pester 3 smoke tests for module behaviour)

The legacy toggle helper projects (`src/EnableShim`, `src/DisableShim`) and their binaries have been removed.

## Runtime Flow

1. `shimdex.ps1` imports `Shimdex.psm1` and calls `Invoke-ShimdexMenu`.
2. The module keeps configuration at `%APPDATA%/Shimdex/config.json` (created on demand).
3. Menu actions call shared helpers:
    - `Invoke-ShimdexBuild` drives `dotnet publish` for the shim.
    - `Set-ShimdexPathState -Scope User|Process -Enable/-Disable` injects or removes the shim directory from PATH.
    - `Set-ShimdexMode` persists the default runtime mode and updates the current environment.
    - `Set-ShimdexWorkspace` captures workspace roots and desired inside/outside modes.`r`n    - `Get-ShimdexPrerequisiteStatus` + `Test-ShimdexOperationAllowed` expose shim/profile readiness so the menu can gate actions.
4. Diagnostics call `Get-ShimdexStatus`, returning structured data (mode, PATH state, alias/profile flags, resolved shim path).
5. `Install-ShimdexProfileSnippet` writes a minimal profile block:

    ```powershell
    # >>> shimdex profile start
    Import-Module "C:\path\scripts\shimdex\Shimdex.psm1" -Force
    Invoke-ShimdexProfile -Quiet
    # <<< shimdex profile end
    ```
  
6. `Invoke-ShimdexProfile` loads config, evaluates the current directory against workspace rules, sets `SHIMDEX_MODE`, reinstalls the alias if requested, and (when enabled) manages PATH in-process.

## Shim Contract

`Ps2WslShim` now honours `SHIMDEX_MODE` (alongside `PS2WSL_BYPASS`):

- `Disabled` → immediately launches the resolved real PowerShell host.
- `Auto` (default) → intercepts and applies the PowerShell heuristics (`LooksLikePowerShellScript`).
- `Force` → always forwards into WSL/bash and skips the heuristics.

`PS2WSL_BYPASS=1` still bypasses the shim unconditionally.`r`n`r`nIncoming command text is normalised from CRLF to LF before being passed to bash so multi-line heredocs and scripts behave the same way under Windows or WSL.

## Testing

- `tests/Shimdex.Tests.ps1` imports the module with `%APPDATA%` redirected to the Pester `$TestDrive`, asserts default configuration creation, verifies `Set-ShimdexMode -Persist:$false` updates the current environment, and checks `Get-ShimdexStatus` output.
- Future work: add integration tests that spawn shimmed child processes under different `SHIMDEX_MODE` values to confirm routing without touching the global PATH.




# shimdex PowerShell Shim

Location: `scripts/shimdex` relative to the repository root.

This folder contains the `powershell.exe` shim that forwards Codex CLI PowerShell invocations into WSL **and** the accompanying PowerShell module (`Shimdex.psm1`) that manages configuration, PATH orchestration, profile snippets, and diagnostics.

The legacy toggle executables (`EnableShim.exe`, `DisableShim.exe`) have been removed—the module now edits PATH directly.

## Layout

```filesystem
scripts/shimdex/
  powershell.exe          # published shim binary
  Shimdex.psm1            # module with menu + helpers
  Shimdex.psd1            # module manifest
  shimdex.ps1             # thin launcher that imports the module and shows the menu
  ARCHITECTURE.md         # detailed design notes
  tests/
    Shimdex.Tests.ps1     # Pester smoke tests (uses a temp APPDATA)
  src/
    Ps2WslShim/           # shim console app source
```

User configuration is stored at `%APPDATA%\Shimdex\config.json` (created on first run).

## Getting started

1. Ensure you are on Windows with WSL available at `wsl.exe`, and install the .NET 8.0 SDK (LTS).
2. Launch the helper menu:

   ```powershell
   .\scripts\shimdex\shimdex.ps1
   ```

   Menu options (backed by module functions):
   * `1` – Build the shim (`dotnet publish` for `Ps2WslShim`).
   * `2` – Enable the shim directory on PATH (user scope).
   * `3` – Remove the shim directory from PATH (user scope).
   * `4` – Toggle automatic PATH management in the config file.
   * `5` – Set the default `SHIMDEX_MODE` persisted in config (`Disabled`, `Auto`, or `Force`).
   * `6` – Configure a workspace root (inside/outside modes).
   * `7` – Clear workspace configuration.
   * `8` – Install the profile snippet (imports the module and calls `Invoke-ShimdexProfile`).
   * `9` – Remove the profile snippet.
   * `10` – Install the `shimdex` function alias.
   * `11` – Remove the alias.
   * `12` – Display diagnostics from `Get-ShimdexStatus`.
   * `0` – Exit the helper.

   All persistent state (mode, workspace roots, alias preference, auto PATH flag) is stored in `%APPDATA%\Shimdex\config.json` and read by the module on every import.

### Building manually

```powershell
# From scripts/shimdex
$env:PS2WSL_BYPASS = '1'   # ensure we bypass the shim during the build
& dotnet publish src/Ps2WslShim/Ps2WslShim.csproj -c Release
```

The publish drops `powershell.exe` and `Ps2WslShim.pdb` in-place.

### Managing PATH without the menu

All functionality is exposed through the module:

```powershell
Import-Module (Join-Path $PWD 'scripts/shimdex/Shimdex.psm1') -Force

# Add the shim directory to the user PATH and current process PATH
Set-ShimdexPathState -Enable -Scope User

# Remove the shim directory from PATH
Set-ShimdexPathState -Disable -Scope User

# Disable automatic PATH management so Invoke-ShimdexProfile stops mutating PATH
Disable-ShimdexPathManagement
```

### Profile integration

Menu option 8 writes a minimal snippet to `$PROFILE`:

```powershell
# >>> shimdex profile start
Import-Module 'C:\path\to\repo\scripts\shimdex\Shimdex.psm1' -Force
Invoke-ShimdexProfile -Quiet
# <<< shimdex profile end
```

`Invoke-ShimdexProfile` evaluates the current directory against configured workspace roots and sets `SHIMDEX_MODE` accordingly. When automatic path management is enabled (default), it also ensures the shim directory is prepended to the configured scope (`User` or `Process`).

### Alias

```powershell
Import-Module 'scripts/shimdex/Shimdex.psm1' -Force
Install-ShimdexAlias
```

This defines a global `shimdex` function in the current session and records the preference so future `Invoke-ShimdexProfile` calls re-establish it. Use `Remove-ShimdexAlias` to undo.

### Testing

The Pester smoke tests can be run with:

```powershell
Import-Module Pester
Invoke-Pester 'scripts/shimdex/tests/Shimdex.Tests.ps1'
```

Tests temporarily redirect `%APPDATA%` to the Pester `$TestDrive` so they do not touch your real configuration.

## Runtime behaviour (`Ps2WslShim`)

`SHIMDEX_MODE` controls how the shim behaves:

| Mode      | Behaviour |
|-----------|-----------|
| `Disabled` | Immediately launches the resolved real PowerShell host. |
| `Auto` (default) | Intercepts and applies PowerShell heuristics (`LooksLikePowerShellScript`). |
| `Force` | Always forwards into WSL/bash; heuristics are skipped. |

`PS2WSL_BYPASS=1` still hard-bypasses the shim regardless of `SHIMDEX_MODE`.

The rest of the shim pipeline is unchanged from earlier revisions: it parses common PowerShell flags, normalises working directories, and executes the resulting payload inside `bash -lc` (fast-pathing invocations that already call `wsl`/`bash`).

## Environment reference

| Variable | Purpose |
|----------|---------|
| `PS2WSL_BYPASS` | When set, the shim invokes the native PowerShell host directly. |
| `PS2WSL_REAL_POWERSHELL` | Overrides host discovery with an explicit executable path. |
| `SHIMDEX_MODE` | Controls shim interception (`Disabled`, `Auto`, `Force`). Managed by the module/profile snippet. |

## Maintenance tips

* Prefer `bash -lc` when editing files to avoid the shim unless `SHIMDEX_MODE` is already `Disabled`.
* See scripts/shimdex/bash-vs-powershell.md for shell selection guidance.
* Run `Set-ShimdexMode -Mode 'Disabled' -Persist:$false` before running large PowerShell maintenance scripts to keep behaviour predictable, then restore the previous mode.
* When editing the shim, rebuild via menu option `1` so the new binary lands in `scripts/shimdex/powershell.exe` immediately.
* Keep `%APPDATA%\Shimdex` under version control’s ignore list—only the module should touch it.
* Use `Get-ShimdexStatus` (menu option 12) as the single source of truth for diagnostics: it reports config defaults, current environment mode, PATH presence (user + process), profile snippet state, alias state, and the resolved shim executable path.




<#!
.SYNOPSIS
  Interactive helper for managing the shimdex PowerShell shim.
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:ShimRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$script:SettingsPath = Join-Path $script:ShimRoot '.shimdex-settings.json'

function Get-ShimdexSettings {
    if (Test-Path $script:SettingsPath) {
        try {
            return (Get-Content $script:SettingsPath -Raw | ConvertFrom-Json)
        }
        catch {
            Write-Warning "Failed to read settings file; using defaults. $_"
        }
    }

    [pscustomobject]@{
        UseToggleBinaries = $true
        WorkspacePath     = $null
    }
}

function Save-ShimdexSettings {
    param([Parameter(Mandatory)]$Settings)
    $Settings | ConvertTo-Json -Depth 4 | Set-Content -Path $script:SettingsPath -Encoding UTF8
}

$script:Settings = Get-ShimdexSettings
if ($null -eq $script:Settings.UseToggleBinaries) { $script:Settings.UseToggleBinaries = $true }
if (-not ($script:Settings.PSObject.Properties.Name -contains 'WorkspacePath')) {
    $script:Settings | Add-Member -NotePropertyName WorkspacePath -NotePropertyValue $null
}

$script:LastOutputTitle = $null
$script:LastOutputLines = @()
$script:LastOutputColor = 'Green'
$script:OutputSlotLines = 1

function Get-ShimDirectory { $script:ShimRoot }

function Get-TogglePaths {
    $dir = Get-ShimDirectory
    [pscustomobject]@{
        Enable  = Join-Path $dir 'EnableShim.exe'
        Disable = Join-Path $dir 'DisableShim.exe'
    }
}

function Test-ToggleExecutables {
    $paths = Get-TogglePaths
    (Test-Path $paths.Enable) -and (Test-Path $paths.Disable)
}
function Normalize-ShimPath {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) { return $null }

    $trimmed = $Path.Trim()
    try {
        $full = [System.IO.Path]::GetFullPath($trimmed)
    }
    catch {
        $full = $trimmed
    }

    return $full.TrimEnd('\','/')
}

function Test-PathEntriesContainShim {
    param([string[]]$Entries)

    $target = Normalize-ShimPath -Path (Get-ShimDirectory)
    if (-not $target) { return $false }

    foreach ($entry in @($Entries)) {
        $normalized = Normalize-ShimPath -Path $entry
        if ($normalized -and [string]::Equals($normalized, $target, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }

    return $false
}

function Set-LastOutput {
    param(
        [string]$Title,
        [string[]]$Lines,
        [ConsoleColor]$Color = 'Green'
    )

    $normalized = @()
    if ($null -ne $Lines) {
        foreach ($entry in @($Lines)) {
            if ($null -ne $entry) {
                $normalized += "${entry}"
            }
        }
    }

    $script:LastOutputTitle = $Title
    $script:LastOutputLines = $normalized
    $script:LastOutputColor = $Color
}

function Clear-LastOutput {
    Set-LastOutput -Title $null -Lines @() -Color 'Green'
}

function Render-LastOutput {
    $used = 0
    $lines = @()
    if ($null -ne $script:LastOutputLines) {
        foreach ($entry in @($script:LastOutputLines)) {
            if ($null -ne $entry) {
                $lines += "${entry}"
            }
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($script:LastOutputTitle) -or $lines.Count) {
        if (-not [string]::IsNullOrWhiteSpace($script:LastOutputTitle)) {
            Write-Host "--- $script:LastOutputTitle ---" -ForegroundColor $script:LastOutputColor
            $used++
        }
        if ($lines.Count) {
            Write-Host ''
            $used++
            foreach ($line in $lines) {
                Write-Host $line -ForegroundColor $script:LastOutputColor
                $used++
            }
        }
    }

    $pad = $script:OutputSlotLines - $used
    if ($pad -lt 1) { $pad = 1 }
    for ($i = 0; $i -lt $pad; $i++) { Write-Host '' }
}

function Publish-Shim {
    Write-Host 'Publishing shim...' -ForegroundColor Cyan
    Push-Location (Get-ShimDirectory)
    try {
        & dotnet publish 'src/Ps2WslShim/Ps2WslShim.csproj' -c Release
        if ($LASTEXITCODE -ne 0) {
            throw "dotnet publish failed with exit code $LASTEXITCODE"
        }
        'Shim publish complete.'
    }
    finally {
        Pop-Location
    }
}

function Publish-Toggles {
    Write-Host 'Publishing toggle helpers...' -ForegroundColor Cyan
    Push-Location (Get-ShimDirectory)
    try {
        & dotnet publish 'src/EnableShim/EnableShim.csproj' -c Release
        if ($LASTEXITCODE -ne 0) {
            throw "dotnet publish EnableShim failed with exit code $LASTEXITCODE"
        }

        & dotnet publish 'src/DisableShim/DisableShim.csproj' -c Release
        if ($LASTEXITCODE -ne 0) {
            throw "dotnet publish DisableShim failed with exit code $LASTEXITCODE"
        }

        'Toggle helpers publish complete.'
    }
    finally {
        Pop-Location
    }
}

function Set-ShimPathState {
    param([bool]$Enable)

    $shimDir = Get-ShimDirectory

    $userPathRaw = [Environment]::GetEnvironmentVariable('PATH','User')
    $userEntries = if ([string]::IsNullOrWhiteSpace($userPathRaw)) { @() } else { $userPathRaw -split ';' }
    $userEntries = $userEntries | Where-Object { $_ -and ($_ -ne $shimDir) }
    if ($Enable) { $userEntries = ,$shimDir + $userEntries }
    $newUserPath = ($userEntries | Select-Object -Unique) -join ';'
    [Environment]::SetEnvironmentVariable('PATH', $newUserPath, 'User')

    $processEntries = $env:PATH -split ';'
    $processEntries = $processEntries | Where-Object { $_ -and ($_ -ne $shimDir) }
    if ($Enable) { $processEntries = ,$shimDir + $processEntries }
    $env:PATH = ($processEntries | Select-Object -Unique) -join ';'
}

function Enable-GlobalShim {
    $toggleRequested = $script:Settings.UseToggleBinaries
    $toggleAvailable = Test-ToggleExecutables

    if ($toggleRequested -and $toggleAvailable) {
        & (Get-TogglePaths).Enable | Out-Null
        'Shim directory prepended to PATH via EnableShim.exe.'
    }
    else {
        if ($toggleRequested -and -not $toggleAvailable) {
            Write-Warning 'Toggle executables not found; falling back to inline PATH update.'
        }
        Set-ShimPathState -Enable $true
        'Shim directory prepended to PATH.'
    }
}

function Disable-GlobalShim {
    $toggleRequested = $script:Settings.UseToggleBinaries
    $toggleAvailable = Test-ToggleExecutables

    if ($toggleRequested -and $toggleAvailable) {
        & (Get-TogglePaths).Disable | Out-Null
        'Shim directory removed from PATH via DisableShim.exe.'
    }
    else {
        if ($toggleRequested -and -not $toggleAvailable) {
            Write-Warning 'Toggle executables not found; falling back to inline PATH update.'
        }
        Set-ShimPathState -Enable $false
        'Shim directory removed from PATH.'
    }
}

function Get-ShimDiagnostics {
    $shimDir = Get-ShimDirectory
    $toggleAvailable = Test-ToggleExecutables
    $userPathRaw = [Environment]::GetEnvironmentVariable('PATH','User')
    $userEntries = if ([string]::IsNullOrWhiteSpace($userPathRaw)) { @() } else { $userPathRaw -split ';' }
    $userContains = Test-PathEntriesContainShim -Entries $userEntries
    $processEntries = if ([string]::IsNullOrWhiteSpace($env:PATH)) { @() } else { $env:PATH -split ';' }
    $processContains = Test-PathEntriesContainShim -Entries $processEntries
    $resolved = Get-Command powershell.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    $workspaceSnippet = Test-ShimdexWorkspaceSnippet
    $aliasInProfile = Test-ShimdexAliasSnippet
    $aliasInSession = Get-Command shimdex -ErrorAction SilentlyContinue

    $userPathStatus = if ($userContains) { 'True' } elseif ($workspaceSnippet) { 'On next PowerShell session' } else { 'False' }
    $sessionPathStatus = if ($processContains) { 'True' } else { 'False' }
    $aliasStatus = if ($aliasInSession) { 'Available (current session)' } elseif ($aliasInProfile) { 'Available next session' } else { 'Not installed' }

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add("Shim directory: $shimDir") | Out-Null
    $lines.Add("Use toggle executables: $($script:Settings.UseToggleBinaries)") | Out-Null
    $lines.Add("Toggle executables present: $toggleAvailable") | Out-Null
    $workspace = if ([string]::IsNullOrWhiteSpace($script:Settings.WorkspacePath)) { '(none)' } else { $script:Settings.WorkspacePath }
    $lines.Add("Workspace scope: $workspace") | Out-Null
    $lines.Add("User PATH includes shim: $userPathStatus") | Out-Null
    $lines.Add("Current session PATH includes shim: $sessionPathStatus") | Out-Null
    $lines.Add("shimdex alias: $aliasStatus") | Out-Null
    if ($resolved) {
        $lines.Add("powershell.exe resolves to: $($resolved.Source)") | Out-Null
    }
    else {
        $lines.Add('powershell.exe is not currently resolvable.') | Out-Null
    }

    return $lines.ToArray()
}

function Get-ProfilePath { $PROFILE }

function Ensure-ProfileDirectory {
    $profilePath = Get-ProfilePath
    $dir = Split-Path $profilePath -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

function Escape-SingleQuotes {
    param([string]$Value)
    $Value -replace "'","''"
}


function Test-ShimdexWorkspaceSnippet {
    $profilePath = Get-ProfilePath
    if (-not (Test-Path $profilePath)) { return $false }
    $content = Get-Content $profilePath -Raw
    return $content -like '*# >>> shimdex workspace start*'
}

function Test-ShimdexAliasSnippet {
    $profilePath = Get-ProfilePath
    if (-not (Test-Path $profilePath)) { return $false }
    $content = Get-Content $profilePath -Raw
    return $content -like '*# >>> shimdex alias start*'
}

function Install-WorkspaceScopeSnippet {
    param([string]$WorkspacePath)

    $profilePath = Get-ProfilePath
    Ensure-ProfileDirectory

    $markerStart = '# >>> shimdex workspace start'
    $markerEnd   = '# <<< shimdex workspace end'

    $existing = if (Test-Path $profilePath) { Get-Content $profilePath -Raw } else { '' }
    if ($existing) {
        $pattern = [regex]::Escape($markerStart) + '.+?' + [regex]::Escape($markerEnd)
        $existing = [regex]::Replace($existing, $pattern, '', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    }

    $shimDir = Get-ShimDirectory
    $workspaceFull = [System.IO.Path]::GetFullPath($WorkspacePath)

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

`$__shimdexShimDir = '__SHIMDIR__'
`$__shimdexWorkspace = '__WORKSPACE__'
`$__shimdexCurrent = [System.IO.Path]::GetFullPath((Get-Location).Path)

if (`$__shimdexCurrent.StartsWith(`$__shimdexWorkspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    Invoke-ShimdexEnable -ShimDir `$__shimdexShimDir
    Register-EngineEvent PowerShell.Exiting -Action { Invoke-ShimdexDisable -ShimDir '__SHIMDIR__' } | Out-Null
}
else {
    Invoke-ShimdexDisable -ShimDir `$__shimdexShimDir
}

Remove-Item Variable:__shimdexShimDir,Variable:__shimdexWorkspace,Variable:__shimdexCurrent -ErrorAction SilentlyContinue
# <<< shimdex workspace end
"@

    $snippet = $snippet.Replace('__SHIMDIR__', (Escape-SingleQuotes $shimDir))
    $snippet = $snippet.Replace('__WORKSPACE__', (Escape-SingleQuotes $workspaceFull))

    if ([string]::IsNullOrWhiteSpace($existing)) {
        $contentToWrite = $snippet
    }
    else {
        $contentToWrite = $existing.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine + $snippet
    }

    $contentToWrite | Set-Content -Path $profilePath -Encoding UTF8
    "Workspace scope applied for '$workspaceFull'."
}

function Remove-WorkspaceScopeSnippet {
    $profilePath = Get-ProfilePath
    if (-not (Test-Path $profilePath)) {
        return 'Profile file not found; nothing to remove.'
    }

    $markerStart = '# >>> shimdex workspace start'
    $markerEnd   = '# <<< shimdex workspace end'
    $content = Get-Content $profilePath -Raw
    $pattern = [regex]::Escape($markerStart) + '.+?' + [regex]::Escape($markerEnd)
    $updated = [regex]::Replace($content, $pattern, '', [System.Text.RegularExpressions.RegexOptions]::Singleline)

    if ($content -eq $updated) {
        'No shimdex workspace snippet found.'
    }
    else {
        $updated.TrimEnd() | Set-Content -Path $profilePath -Encoding UTF8
        'shimdex workspace snippet removed.'
    }
}

function Set-SessionAlias {
    $scriptPath = Join-Path (Get-ShimDirectory) 'shimdex.ps1'
    $block = @"
param([Parameter(ValueFromRemainingArguments=`$true)][object[]]`$args)
if (`$null -eq `$args) { `$args = @() }
& '$scriptPath' @($args)
"@
    Set-Item -Path Function:Global:shimdex -Value ([ScriptBlock]::Create($block)) -Force
}

function Install-ShimdexAliasSnippet {
    $profilePath = Get-ProfilePath
    Ensure-ProfileDirectory

    $markerStart = '# >>> shimdex alias start'
    $markerEnd   = '# <<< shimdex alias end'
    $existing = if (Test-Path $profilePath) { Get-Content $profilePath -Raw } else { '' }
    if ($existing) {
        $pattern = [regex]::Escape($markerStart) + '.+?' + [regex]::Escape($markerEnd)
        $existing = [regex]::Replace($existing, $pattern, '', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    }

    $scriptPath = Join-Path (Get-ShimDirectory) 'shimdex.ps1'

    $snippet = @"
# >>> shimdex alias start
function shimdex {
    param([Parameter(ValueFromRemainingArguments=`$true)][object[]]`$args)
    if (`$null -eq `$args) { `$args = @() }
    & '__SCRIPT__' @($args)
}
# <<< shimdex alias end
"@

    $snippet = $snippet.Replace('__SCRIPT__', (Escape-SingleQuotes $scriptPath))

    if ([string]::IsNullOrWhiteSpace($existing)) {
        $contentToWrite = $snippet
    }
    else {
        $contentToWrite = $existing.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine + $snippet
    }

    $contentToWrite | Set-Content -Path $profilePath -Encoding UTF8
    Set-SessionAlias
    "Alias 'shimdex' installed. Restart PowerShell sessions to load it automatically."
}

function Remove-ShimdexAliasSnippet {
    $profilePath = Get-ProfilePath
    if (-not (Test-Path $profilePath)) {
        $profileMessage = 'Profile file not found; alias snippet not removed.'
    }
    else {
        $markerStart = '# >>> shimdex alias start'
        $markerEnd   = '# <<< shimdex alias end'
        $content = Get-Content $profilePath -Raw
        $pattern = [regex]::Escape($markerStart) + '.+?' + [regex]::Escape($markerEnd)
        $updated = [regex]::Replace($content, $pattern, '', [System.Text.RegularExpressions.RegexOptions]::Singleline)

        if ($content -eq $updated) {
            $profileMessage = 'No shimdex alias snippet found.'
        }
        else {
            $updated.TrimEnd() | Set-Content -Path $profilePath -Encoding UTF8
            $profileMessage = 'shimdex alias snippet removed.'
        }
    }

    if (Get-Command shimdex -ErrorAction SilentlyContinue) {
        Remove-Item Function:Global:shimdex -ErrorAction SilentlyContinue
        return $profileMessage + [Environment]::NewLine + 'Alias removed from current session.'
    }

    $profileMessage
}

function Request-WorkspacePath {
    $input = Read-Host 'Enter workspace path (leave blank to cancel)'
    if ([string]::IsNullOrWhiteSpace($input)) {
        return $null
    }

    try {
        [System.IO.Path]::GetFullPath((Resolve-Path $input -ErrorAction Stop).Path)
    }
    catch {
        try {
            [System.IO.Path]::GetFullPath($input)
        }
        catch {
            Write-Warning 'Unable to resolve path.'
            $null
        }
    }
}

function Toggle-BinaryPreference {
    $script:Settings.UseToggleBinaries = -not $script:Settings.UseToggleBinaries
    Save-ShimdexSettings -Settings $script:Settings
    "Use toggle executables set to: $($script:Settings.UseToggleBinaries)"
}

function Configure-WorkspaceScope {
    $workspace = Request-WorkspacePath
    if (-not $workspace) {
        'Workspace scope unchanged.'
    }
    else {
        $message = Install-WorkspaceScopeSnippet -WorkspacePath $workspace
        $script:Settings.WorkspacePath = $workspace
        Save-ShimdexSettings -Settings $script:Settings
        $message
    }
}

function Remove-WorkspaceScope {
    $message = Remove-WorkspaceScopeSnippet
    $script:Settings.WorkspacePath = $null
    Save-ShimdexSettings -Settings $script:Settings
    $message
}

function Install-Alias {
    Install-ShimdexAliasSnippet
}

function Remove-Alias {
    Remove-ShimdexAliasSnippet
}

function Show-Result {
    param(
        [string]$Title,
        [Parameter(ValueFromPipeline)]
        [string[]]$Lines,
        [ConsoleColor]$Color = 'Green'
    )

    if ($null -eq $Lines) {
        $normalized = @()
    }
    else {
        $normalized = @()
        foreach ($item in @($Lines)) {
            if ($null -ne $item) {
                $normalized += "${item}"
            }
        }
    }

    Set-LastOutput -Title $Title -Lines $normalized -Color $Color

    $height = 0
    if (-not [string]::IsNullOrWhiteSpace($Title)) { $height++ }
    if ($normalized.Count -gt 0) {
        $height++ # blank line before output lines
        $height += $normalized.Count
    }
    if ($height -lt 1) { $height = 1 }
    if ($height -gt $script:OutputSlotLines) { $script:OutputSlotLines = $height }
}

function Invoke-Menu {
    while ($true) {
        Write-Host ''
        Write-Host 'shimdex helper menu' -ForegroundColor Cyan
        Write-Host '1) Build shim (powershell.exe)'
        Write-Host '2) Build toggle helpers'
        $toggleLabel = if ($script:Settings.UseToggleBinaries) { 'Yes' } else { 'No' }
        Write-Host "3) Use toggle executables: $toggleLabel"
        Write-Host '4) Enable globally'
        Write-Host '5) Disable globally'
        Write-Host '6) Scope to workspace'
        Write-Host '7) Install alias'
        Write-Host '8) Remove workspace scope and alias'
        Write-Host '9) Show diagnostics'
        Write-Host '0) Exit'
        Write-Host ''
        Render-LastOutput
        $choice = Read-Host 'Select an option'
        switch ($choice) {
            '1' {
                $message = Publish-Shim
                Show-Result 'Build shim' $message
            }
            '2' {
                $message = Publish-Toggles
                Show-Result 'Build toggles' $message
            }
            '3' {
                $message = Toggle-BinaryPreference
                Show-Result 'Toggle preference' $message
            }
            '4' {
                $message = Enable-GlobalShim
                Show-Result 'Enable shim' $message
            }
            '5' {
                $message = Disable-GlobalShim
                Show-Result 'Disable shim' $message
            }
            '6' {
                $message = Configure-WorkspaceScope
                Show-Result 'Workspace scope' $message
            }
            '7' {
                $message = Install-Alias
                Show-Result 'Install alias' $message
            }
            '8' {
                $parts = @()
                $parts += Remove-WorkspaceScope
                $parts += Remove-Alias
                $lines = $parts | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
                if (-not $lines) { $lines = 'No shimdex workspace or alias snippet found.' }
                Show-Result 'Removal' $lines
            }
            '9' {
                $lines = Get-ShimDiagnostics
                Show-Result 'Diagnostics' $lines 'Cyan'
            }
            '0' {
                Show-Result 'Exit' 'Goodbye.'
                Render-LastOutput
                return
            }
            default {
                Show-Result 'Notice' 'Invalid selection.' 'Yellow'
            }
        }
    }
}

Invoke-Menu







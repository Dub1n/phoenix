Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:ModuleRoot = Split-Path -Parent $PSCommandPath
$script:ShimRoot = $script:ModuleRoot
$script:ConfigCache = $null
$script:ProfileMarkerStart = '# >>> shimdex profile start'
$script:ProfileMarkerEnd = '# <<< shimdex profile end'
$script:AliasFunctionName = 'shimdex'
$script:EnvModeVariable = 'SHIMDEX_MODE'
$script:ValidModes = @('Disabled','Auto','Force')
 $script:MenuSessionState = [pscustomobject]@{
    ShimBuildDeclined          = $false
    ShimBuildFailedMessage     = $null
    ProfileInstallDeclined     = $false
    ProfileInstallFailedMessage = $null
}

function Get-ShimdexPaths {
    $appData = [Environment]::GetFolderPath('ApplicationData')
    if ([string]::IsNullOrWhiteSpace($appData)) {
        throw 'Unable to resolve %APPDATA% for shimdex configuration.'
    }

    $configDir = Join-Path $appData 'Shimdex'
    [pscustomobject]@{
        ModuleRoot = $script:ModuleRoot
        ShimRoot   = $script:ShimRoot
        ShimExe    = Join-Path $script:ShimRoot 'powershell.exe'
        ConfigDir  = $configDir
        ConfigPath = Join-Path $configDir 'config.json'
        Profile    = $PROFILE
    }
}

function New-DefaultShimdexConfig {
    [pscustomobject]@{
        Mode                = 'Auto'
        AutoManagePath      = $true
        PathScope           = 'User'
        WorkspaceRoots      = @()
        WorkspaceInsideMode = 'Auto'
        WorkspaceOutsideMode= 'Disabled'
        EnableAlias         = $true
    }
}

function ConvertTo-Hashtable {
    param([Parameter(Mandatory)]$InputObject)

    if ($null -eq $InputObject) { return @{} }
    if ($InputObject -is [hashtable]) { return $InputObject }

    $hash = @{}
    foreach ($prop in $InputObject.PSObject.Properties) {
        $value = $prop.Value
        if ($value -is [System.Collections.IDictionary]) {
            $hash[$prop.Name] = ConvertTo-Hashtable $value
        }
        elseif ($value -is [System.Collections.IEnumerable] -and -not ($value -is [string])) {
            $collection = @()
            foreach ($item in $value) { $collection += $item }
            $hash[$prop.Name] = $collection
        }
        else {
            $hash[$prop.Name] = $value
        }
    }
    return $hash
}

function Get-ShimdexConfig {
    if ($null -ne $script:ConfigCache) {
        return $script:ConfigCache.PSObject.Copy()
    }

    $paths = Get-ShimdexPaths
    if (Test-Path $paths.ConfigPath) {
        try {
            $raw = Get-Content $paths.ConfigPath -Raw | ConvertFrom-Json
        }
        catch {
            Write-Warning 'Failed to parse shimdex config; resetting to defaults.'
            $raw = $null
        }
    }
    else {
        $raw = $null
    }

    if ($null -eq $raw) {
        $config = New-DefaultShimdexConfig
    }
    else {
        $hash = ConvertTo-Hashtable $raw
        $config = New-DefaultShimdexConfig
        foreach ($prop in $config.PSObject.Properties) {
            if ($hash.ContainsKey($prop.Name)) {
                $prop.Value = $hash[$prop.Name]
            }
        }
    }

    $config.WorkspaceRoots = @($config.WorkspaceRoots | ForEach-Object {
        if ([string]::IsNullOrWhiteSpace($_)) { return $null }
        try { [System.IO.Path]::GetFullPath($_) }
        catch { $_ }
    }) | Where-Object { $_ }

    $script:ConfigCache = $config
    return $config.PSObject.Copy()
}

function Export-ShimdexConfig {
    param([Parameter(Mandatory)]$Config)

    $paths = Get-ShimdexPaths
    if (-not (Test-Path $paths.ConfigDir)) {
        New-Item -ItemType Directory -Path $paths.ConfigDir -Force | Out-Null
    }

    $hash = ConvertTo-Hashtable $Config
    $json = $hash | ConvertTo-Json -Depth 5
    Set-Content -Path $paths.ConfigPath -Value $json -Encoding UTF8
    $script:ConfigCache = $Config.PSObject.Copy()
}

function Reset-ShimdexSessionState {
    $script:MenuSessionState.ShimBuildDeclined = $false
    $script:MenuSessionState.ShimBuildFailedMessage = $null
    $script:MenuSessionState.ProfileInstallDeclined = $false
    $script:MenuSessionState.ProfileInstallFailedMessage = $null
}

function Get-ShimdexSessionState {
    $script:MenuSessionState.PSObject.Copy()
}

function Set-ShimdexSessionState {
    param(
        [Parameter(Mandatory)]
        [ValidateSet('ShimBuildDeclined','ShimBuildFailedMessage','ProfileInstallDeclined','ProfileInstallFailedMessage')]
        [string]$Name,
        $Value
    )

    $script:MenuSessionState.$Name = $Value
    Get-ShimdexSessionState
}

function Test-ShimdexShimPresent {
    Test-Path (Get-ShimdexPaths).ShimExe
}

function Get-ShimdexPrerequisiteStatus {
    [pscustomobject]@{
        ShimPresent      = Test-ShimdexShimPresent
        ProfileInstalled = Test-ShimdexProfileSnippet
        SessionFlags     = Get-ShimdexSessionState
    }
}

function Test-ShimdexOperationAllowed {
    param(
        [switch]$RequireShim,
        [switch]$RequireProfile
    )

    $status = Get-ShimdexPrerequisiteStatus
    $messages = [System.Collections.Generic.List[string]]::new()
    $allowed = $true

    if ($RequireShim -and -not $status.ShimPresent) {
        $allowed = $false
        [void]$messages.Add('Shim binary is not present in the shim directory.')
    }

    if ($RequireProfile -and -not $status.ProfileInstalled) {
        $allowed = $false
        [void]$messages.Add('Profile integration has not been installed.')
    }

    [pscustomobject]@{
        Allowed  = $allowed
        Messages = $messages.ToArray()
        Status   = $status
    }
}

Reset-ShimdexSessionState
function Normalize-ShimPath {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) { return $null }
    try {
        $full = [System.IO.Path]::GetFullPath($Path)
    }
    catch {
        $full = $Path
    }

    return $full.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
}

function Test-PathContainsShim {
    param([string[]]$Entries)

    $target = Normalize-ShimPath (Get-ShimdexPaths).ShimRoot
    foreach ($entry in @($Entries)) {
        $normalized = Normalize-ShimPath $entry
        if ($normalized -and [string]::Equals($normalized, $target, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }
    return $false
}

function Get-UserPathEntries {
    $raw = [Environment]::GetEnvironmentVariable('PATH','User')
    if ([string]::IsNullOrWhiteSpace($raw)) { return @() }
    return $raw -split ';'
}

function Get-ProcessPathEntries {
    if ([string]::IsNullOrWhiteSpace($env:PATH)) { return @() }
    return $env:PATH -split ';'
}

function Set-ShimdexPathState {
    [CmdletBinding(DefaultParameterSetName='Enable')]
    param(
        [Parameter(ParameterSetName='Enable', Mandatory=$true)][switch]$Enable,
        [Parameter(ParameterSetName='Disable', Mandatory=$true)][switch]$Disable,
        [ValidateSet('User','Process')][string]$Scope = 'User',
        [switch]$PersistConfig
    )

    $shouldPersist = if ($PSBoundParameters.ContainsKey('PersistConfig')) { $PersistConfig.IsPresent } else { $true }

    $targetDir = (Get-ShimdexPaths).ShimRoot

    $userEntries = @(Get-UserPathEntries)
    $procEntries = @(Get-ProcessPathEntries)

    $filter = {
        param($entry)
        $normalized = Normalize-ShimPath $entry
        $targetNormalized = Normalize-ShimPath $targetDir
        return -not ([string]::Equals($normalized, $targetNormalized, [System.StringComparison]::OrdinalIgnoreCase))
    }

    $userEntries = @($userEntries | Where-Object $filter)
    $procEntries = @($procEntries | Where-Object $filter)

    $enableFlag = $PSCmdlet.ParameterSetName -eq 'Enable'

    if ($enableFlag) {
        if ($Scope -eq 'User') {
            $userEntries = ,$targetDir + $userEntries
        }
        $procEntries = ,$targetDir + $procEntries
    }

    if ($Scope -eq 'User') {
        $newUser = ($userEntries | Where-Object { $_ }) | Select-Object -Unique
        [Environment]::SetEnvironmentVariable('PATH', ($newUser -join ';'), 'User')
    }

    $newProcess = ($procEntries | Where-Object { $_ }) | Select-Object -Unique
    $env:PATH = $newProcess -join ';'

    if ($shouldPersist) {
        $config = Get-ShimdexConfig
        $config.AutoManagePath = $true
        $config.PathScope = $Scope
        Export-ShimdexConfig -Config $config
    }

    if ($enableFlag) {
        return "Shim directory added to $Scope path scope."
    }
    else {
        return "Shim directory removed from $Scope path scope."
    }
}

function Disable-ShimdexPathManagement {
    $config = Get-ShimdexConfig
    $config.AutoManagePath = $false
    Export-ShimdexConfig -Config $config
    'Automatic shim PATH management disabled in config.'
}

function Set-ShimdexMode {
    param(
        [ValidateSet('Disabled','Auto','Force')][string]$Mode,
        [switch]$Persist
    )

    $shouldPersist = if ($PSBoundParameters.ContainsKey('Persist')) { $Persist.IsPresent } else { $true }

    [Environment]::SetEnvironmentVariable($script:EnvModeVariable, $Mode, 'Process')

    if ($shouldPersist) {
        $config = Get-ShimdexConfig
        $config.Mode = $Mode
        Export-ShimdexConfig -Config $config
    }

    "Current process SHIMDEX mode set to $Mode."
}

function Set-ShimdexWorkspace {
    param(
        [Parameter(Mandatory)][string]$Root,
        [ValidateSet('Disabled','Auto','Force')][string]$InsideMode = 'Auto',
        [ValidateSet('Disabled','Auto','Force')][string]$OutsideMode = 'Disabled'
    )

    try {
        $full = [System.IO.Path]::GetFullPath($Root)
    }
    catch {
        throw "Unable to resolve workspace root '$Root'."
    }

    $config = Get-ShimdexConfig
    $config.WorkspaceRoots = @($full)
    $config.WorkspaceInsideMode = $InsideMode
    $config.WorkspaceOutsideMode = $OutsideMode
    Export-ShimdexConfig -Config $config
    "Workspace scope set to $full (inside=$InsideMode, outside=$OutsideMode)."
}

function Clear-ShimdexWorkspace {
    $config = Get-ShimdexConfig
    $config.WorkspaceRoots = @()
    Export-ShimdexConfig -Config $config
    'Workspace scope cleared.'
}

function Resolve-WorkspaceMode {
    param([string]$CurrentPath)

    $config = Get-ShimdexConfig
    if (-not $config.WorkspaceRoots -or $config.WorkspaceRoots.Count -eq 0) {
        return $config.Mode
    }

    $full = try { [System.IO.Path]::GetFullPath($CurrentPath) } catch { $CurrentPath }

    foreach ($root in $config.WorkspaceRoots) {
        if ($full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $config.WorkspaceInsideMode
        }
    }

    return $config.WorkspaceOutsideMode
}

function Set-ShimdexAliasFunction {
    $blockContent = "param([Parameter(ValueFromRemainingArguments=`$true)][object[]]`$args)`nInvoke-ShimdexMenu @args"
    $block = [ScriptBlock]::Create($blockContent)
    Set-Item -Path ("Function:Global:$($script:AliasFunctionName)") -Value $block -Force
}

function Install-ShimdexAlias {
    $config = Get-ShimdexConfig
    Set-ShimdexAliasFunction
    $config.EnableAlias = $true
    Export-ShimdexConfig -Config $config
    "Alias '$($script:AliasFunctionName)' installed for current session and recorded in config."
}

function Remove-ShimdexAlias {
    if (Get-Command $script:AliasFunctionName -ErrorAction SilentlyContinue) {
        Remove-Item ("Function:Global:$($script:AliasFunctionName)") -ErrorAction SilentlyContinue
    }
    $config = Get-ShimdexConfig
    $config.EnableAlias = $false
    Export-ShimdexConfig -Config $config
    "Alias '$($script:AliasFunctionName)' removed and disabled in config."
}

function Ensure-ShimdexAlias {
    $config = Get-ShimdexConfig
    if ($config.EnableAlias) {
        Set-ShimdexAliasFunction
    }
}

function Install-ShimdexProfileSnippet {
    $paths = Get-ShimdexPaths
    $profilePath = $paths.Profile
    $dir = Split-Path $profilePath -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $existing = if (Test-Path $profilePath) { Get-Content $profilePath -Raw } else { '' }

    if ($existing) {
        $pattern = [regex]::Escape($script:ProfileMarkerStart) + '.+?' + [regex]::Escape($script:ProfileMarkerEnd)
        $existing = [regex]::Replace($existing, $pattern, '', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    }

    $modulePath = Join-Path $paths.ModuleRoot 'Shimdex.psm1'

    $snippet = @"
$($script:ProfileMarkerStart)
Import-Module '$modulePath' -Force
Invoke-ShimdexProfile -Quiet
$($script:ProfileMarkerEnd)
"@

    $content = if ([string]::IsNullOrWhiteSpace($existing)) {
        $snippet
    }
    else {
        $existing.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine + $snippet
    }

    Set-Content -Path $profilePath -Value $content -Encoding UTF8
    'Profile snippet installed. Restart PowerShell sessions to apply.'
}

function Remove-ShimdexProfileSnippet {
    $profilePath = (Get-ShimdexPaths).Profile
    if (-not (Test-Path $profilePath)) {
        return 'Profile file not found; nothing to remove.'
    }

    $content = Get-Content $profilePath -Raw
    $pattern = [regex]::Escape($script:ProfileMarkerStart) + '.+?' + [regex]::Escape($script:ProfileMarkerEnd)
    $updated = [regex]::Replace($content, $pattern, '', [System.Text.RegularExpressions.RegexOptions]::Singleline)

    if ($content -eq $updated) {
        'No shimdex profile snippet found.'
    }
    else {
        Set-Content -Path $profilePath -Value ($updated.TrimEnd()) -Encoding UTF8
        'shimdex profile snippet removed.'
    }
}

function Test-ShimdexProfileSnippet {
    $profilePath = (Get-ShimdexPaths).Profile
    if (-not (Test-Path $profilePath)) { return $false }
    $content = Get-Content $profilePath -Raw
    return $content -like '*# >>> shimdex profile start*'
}

function Get-ShimdexStatus {
    $paths = Get-ShimdexPaths
    $config = Get-ShimdexConfig

    $userContains = Test-PathContainsShim (Get-UserPathEntries)
    $processContains = Test-PathContainsShim (Get-ProcessPathEntries)

    $resolvedShim = if (Test-Path $paths.ShimExe) { $paths.ShimExe } else { '(not built)' }
    $profileSnippet = Test-ShimdexProfileSnippet
    $aliasInSession = Get-Command $script:AliasFunctionName -ErrorAction SilentlyContinue
    $modeEnv = [Environment]::GetEnvironmentVariable($script:EnvModeVariable)

    [pscustomobject]@{
        ConfigMode              = $config.Mode
        EnvironmentMode         = if ($modeEnv) { $modeEnv } else { '(unset)' }
        AutoManagePath          = $config.AutoManagePath
        PathScope               = $config.PathScope
        UserPathIncludesShim    = $userContains
        ProcessPathIncludesShim = $processContains
        ShimExecutable          = $resolvedShim
        WorkspaceRoots          = @($config.WorkspaceRoots)
        WorkspaceInsideMode     = $config.WorkspaceInsideMode
        WorkspaceOutsideMode    = $config.WorkspaceOutsideMode
        ProfileSnippetInstalled = $profileSnippet
        AliasEnabledInConfig    = $config.EnableAlias
        AliasAvailableInSession = [bool]$aliasInSession
    }
}

function Invoke-ShimdexBuild {
    $paths = Get-ShimdexPaths
    Push-Location $paths.ShimRoot
    try {
        & dotnet publish 'src/Ps2WslShim/Ps2WslShim.csproj' -c Release
        if ($LASTEXITCODE -ne 0) {
            throw "dotnet publish failed with exit code $LASTEXITCODE"
        }
        'Shim build completed successfully.'
    }
    finally {
        Pop-Location
    }
}

function Invoke-ShimdexProfile {
    param([switch]$Quiet)

    $mode = Resolve-WorkspaceMode (Get-Location).Path
    Set-ShimdexMode -Mode $mode -Persist:$false | Out-Null

    $config = Get-ShimdexConfig
    if ($config.AutoManagePath) {
        if ($mode -eq 'Disabled') {
            Set-ShimdexPathState -Disable -Scope $config.PathScope -PersistConfig:$false | Out-Null
        }
        else {
            Set-ShimdexPathState -Enable -Scope $config.PathScope -PersistConfig:$false | Out-Null
        }
    }

    Ensure-ShimdexAlias

    if (-not $Quiet) {
        "Profile invoked; mode set to $mode."
    }
}

function Invoke-ShimdexMenu {
    while ($true) {
        Write-Host ''
        Write-Host 'shimdex helper menu (module)' -ForegroundColor Cyan
        Write-Host '1) Build shim'
        Write-Host '2) Enable shim path (user scope)'
        Write-Host '3) Disable shim path (user scope)'
        Write-Host '4) Toggle automatic path management'
        Write-Host '5) Set default mode'
        Write-Host '6) Configure workspace'
        Write-Host '7) Clear workspace'
        Write-Host '8) Install profile snippet'
        Write-Host '9) Remove profile snippet'
        Write-Host '10) Install alias'
        Write-Host '11) Remove alias'
        Write-Host '12) Show diagnostics'
        Write-Host '0) Exit'
        Write-Host ''

        $choice = Read-Host 'Select an option'
        switch ($choice) {
            '1' {
                $result = Invoke-ShimdexBuild
                Write-Host $result -ForegroundColor Green
            }
            '2' {
                $message = Set-ShimdexPathState -Enable -Scope 'User'
                Write-Host $message -ForegroundColor Green
            }
            '3' {
                $message = Set-ShimdexPathState -Disable -Scope 'User'
                Write-Host $message -ForegroundColor Green
            }
            '4' {
                $config = Get-ShimdexConfig
                if ($config.AutoManagePath) {
                    $msg = Disable-ShimdexPathManagement
                    Write-Host $msg -ForegroundColor Yellow
                }
                else {
                    $config.AutoManagePath = $true
                    Export-ShimdexConfig -Config $config
                    Write-Host 'Automatic path management enabled in config.' -ForegroundColor Green
                }
            }
            '5' {
                $newMode = Read-Host 'Enter mode (Disabled/Auto/Force)'
                if ($script:ValidModes -contains $newMode) {
                    Write-Host (Set-ShimdexMode -Mode $newMode) -ForegroundColor Green
                }
                else {
                    Write-Host 'Invalid mode.' -ForegroundColor Yellow
                }
            }
            '6' {
                $root = Read-Host 'Enter workspace root path'
                if (-not [string]::IsNullOrWhiteSpace($root)) {
                    $inside = Read-Host 'Mode when inside workspace (Disabled/Auto/Force)'
                    if (-not ($script:ValidModes -contains $inside)) { $inside = 'Auto' }
                    $outside = Read-Host 'Mode when outside workspace (Disabled/Auto/Force)'
                    if (-not ($script:ValidModes -contains $outside)) { $outside = 'Disabled' }
                    try {
                        $msg = Set-ShimdexWorkspace -Root $root -InsideMode $inside -OutsideMode $outside
                        Write-Host $msg -ForegroundColor Green
                    }
                    catch {
                        Write-Host $_ -ForegroundColor Red
                    }
                }
            }
            '7' {
                Write-Host (Clear-ShimdexWorkspace) -ForegroundColor Yellow
            }
            '8' {
                Write-Host (Install-ShimdexProfileSnippet) -ForegroundColor Green
            }
            '9' {
                Write-Host (Remove-ShimdexProfileSnippet) -ForegroundColor Yellow
            }
            '10' {
                Write-Host (Install-ShimdexAlias) -ForegroundColor Green
            }
            '11' {
                Write-Host (Remove-ShimdexAlias) -ForegroundColor Yellow
            }
            '12' {
                $status = Get-ShimdexStatus
                $status.PSObject.Properties | ForEach-Object {
                    Write-Host ("$($_.Name): $($_.Value)") -ForegroundColor Cyan
                }
            }
            '0' {
                Write-Host 'Goodbye.' -ForegroundColor Cyan
                return
            }
            default {
                Write-Host 'Invalid selection.' -ForegroundColor Yellow
            }
        }
    }
}

Export-ModuleMember -Function `
    Get-ShimdexPaths, `
    Get-ShimdexConfig, `
    Export-ShimdexConfig, `
    Set-ShimdexMode, `
    Set-ShimdexPathState, `
    Disable-ShimdexPathManagement, `
    Set-ShimdexWorkspace, `
    Clear-ShimdexWorkspace, `
    Get-ShimdexStatus, `
    Invoke-ShimdexBuild, `
    Install-ShimdexProfileSnippet, `
    Remove-ShimdexProfileSnippet, `
    Install-ShimdexAlias, `
    Remove-ShimdexAlias, `
    Invoke-ShimdexProfile, `
    Invoke-ShimdexMenu











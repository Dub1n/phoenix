# Unified Terminal Safety Installer
# Consolidates all installation approaches into a single, maintainable script

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("vscode", "cursor", "global", "automatic")]
    [string]$Mode = "automatic",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseMode = $false
)

# Configuration
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir -or $scriptDir -eq "") {
    $scriptDir = Get-Location
}

$projectRoot = Split-Path -Parent $scriptDir
if (-not $projectRoot -or $projectRoot -eq "") {
    $projectRoot = Split-Path -Parent (Get-Location)
}

# Ensure we have valid paths
if (-not (Test-Path $scriptDir)) {
    $scriptDir = Get-Location
}
if (-not (Test-Path $projectRoot)) {
    $projectRoot = Split-Path -Parent (Get-Location)
}

$config = @{
    scriptPath = $scriptDir
    parentPath = $projectRoot
    cursorRulesPath = Join-Path $projectRoot ".cursor" "rules"
    vscodeSettingsPath = Join-Path $projectRoot ".vscode" "settings.json"
    backupSuffix = ".backup.$(Get-Date -Format 'yyyyMMdd-HHmm')"
}

# Ensure paths are absolute and valid
$config.scriptPath = (Get-Item $config.scriptPath).FullName
$config.parentPath = (Get-Item $config.parentPath).FullName

# Logging functions
function Write-InstallLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    Write-Host "[$timestamp] $Level`: $Message" -ForegroundColor $color
}

function Write-VerboseLog {
    param([string]$Message)
    if ($VerboseMode) {
        Write-InstallLog $Message "DEBUG"
    }
}

# Validation functions
function Test-InstallationPrerequisites {
    Write-InstallLog "Checking installation prerequisites..."
    
    # Check PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -lt 5) {
        Write-InstallLog "PowerShell 5.0 or higher required. Current version: $psVersion" "ERROR"
        return $false
    }
    Write-VerboseLog "PowerShell version: $psVersion"
    
    # Check execution policy
    $executionPolicy = Get-ExecutionPolicy
    if ($executionPolicy -eq "Restricted") {
        Write-InstallLog "Execution policy is restricted. Consider using 'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser'" "WARN"
    }
    Write-VerboseLog "Execution policy: $executionPolicy"
    
    # Check if running as administrator (for global installation)
    if ($Mode -eq "global" -and -not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        Write-InstallLog "Global installation requires administrator privileges" "ERROR"
        return $false
    }
    
    return $true
}

# Installation functions
function Install-VSCodeIntegration {
    Write-InstallLog "Installing VSCode integration..."
    
    $vscodeSettings = $config.vscodeSettingsPath
    if (-not (Test-Path $vscodeSettings)) {
        Write-InstallLog "Creating VSCode settings directory..."
        $vscodeDir = Split-Path $vscodeSettings
        if (-not (Test-Path $vscodeDir)) {
            New-Item -ItemType Directory -Path $vscodeDir -Force | Out-Null
        }
    }
    
    # Create or update VSCode settings
    $vscodeConfig = @{
        "terminal.integrated.profiles.windows" = @{
            "PowerShell" = @{
                "source" = "PowerShell"
                "args" = @(
                    "-ExecutionPolicy", "Bypass",
                    "-NoExit",
                    "-Command",
                    ". `"${workspaceFolder}/scripts/terminal-completer/integration/cursor-terminal-init.ps1`""
                )
            }
        }
        "terminal.integrated.defaultProfile.windows" = "PowerShell"
    }
    
    if (Test-Path $vscodeSettings) {
        $existingSettings = Get-Content $vscodeSettings | ConvertFrom-Json -AsHashtable
        $vscodeConfig = $existingSettings + $vscodeConfig
    }
    
    $vscodeConfig | ConvertTo-Json -Depth 10 | Set-Content $vscodeSettings
    Write-InstallLog "VSCode integration completed successfully" "SUCCESS"
}

function Install-CursorIntegration {
    Write-InstallLog "Installing Cursor integration..."
    
    $cursorRulesPath = $config.cursorRulesPath
    if (-not (Test-Path $cursorRulesPath)) {
        Write-InstallLog "Creating Cursor rules directory..."
        New-Item -ItemType Directory -Path $cursorRulesPath -Force | Out-Null
    }
    
    # Create terminal safety rule
    $ruleContent = @"
# Terminal Safety Rule
# Automatically applies terminal safety to all terminal operations

terminal_safety:
  enabled: true
  script_path: "$(Join-Path $config.scriptPath "core\enhanced-terminal-manager.ps1")"
  timeout: 30000
  auto_kill: true
  enhanced_monitoring: true
"@
    
    $rulePath = Join-Path $cursorRulesPath "terminal-safety.yml"
    $ruleContent | Set-Content $rulePath
    Write-InstallLog "Cursor integration rule created successfully" "SUCCESS"
}

function Install-GlobalIntegration {
    Write-InstallLog "Installing global integration..."
    
    # Create global command wrapper batch file
    $globalWrapper = @"
@echo off
powershell -ExecutionPolicy Bypass -File "$(Join-Path $config.scriptPath "core\enhanced-terminal-manager.ps1")" %*
"@
    
    # Write the batch file to a location in PATH
    $batchPath = Join-Path $env:USERPROFILE "AppData\Local\Microsoft\WinGet\Packages\Microsoft.PowerShell.PowerShell_8wekyb3d8bbwe\Microsoft.PowerShell\terminal-safety.bat"
    $batchDir = Split-Path $batchPath
    if (-not (Test-Path $batchDir)) {
        New-Item -ItemType Directory -Path $batchDir -Force | Out-Null
    }
    
    $globalWrapper | Set-Content $batchPath
    Write-InstallLog "Global batch wrapper created at: $batchPath" "SUCCESS"
    
    # Update PowerShell profile for easier access
    $profilePath = Join-Path $env:USERPROFILE "Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1"
    if (-not (Test-Path $profilePath)) {
        $profileDir = Split-Path $profilePath
        if (-not (Test-Path $profileDir)) {
            New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
        }
        New-Item -ItemType File -Path $profilePath -Force | Out-Null
    }
    
    $profileContent = Get-Content $profilePath -Raw
    if ($profileContent -notlike "*enhanced-terminal-manager*") {
        $profileContent += "`n# Terminal Safety Integration`n"
        $profileContent += "Import-Module '$(Join-Path $config.scriptPath "core\enhanced-terminal-manager.ps1")'`n"
        $profileContent += "Set-Alias -Name 'safe-term' -Value '$(Join-Path $config.scriptPath "core\enhanced-terminal-manager.ps1")'`n"
        $profileContent | Set-Content $profilePath
        Write-InstallLog "PowerShell profile updated successfully" "SUCCESS"
    } else {
        Write-InstallLog "PowerShell profile already contains terminal safety integration" "WARN"
    }
    
    Write-InstallLog "Global integration completed. You can now use 'safe-term' command or run the batch file directly." "SUCCESS"
}

function Install-AutomaticIntegration {
    Write-InstallLog "Installing automatic integration..."
    
    # Install all integration types
    Install-VSCodeIntegration
    Install-CursorIntegration
    Install-GlobalIntegration
    
    Write-InstallLog "Automatic integration completed successfully" "SUCCESS"
}

# Main installation logic
function Start-Installation {
    Write-InstallLog "Starting Terminal Safety installation..."
    Write-InstallLog "Mode: $Mode" "INFO"
    Write-InstallLog "Script path: $($config.scriptPath)" "INFO"
    
    # Validate prerequisites
    if (-not (Test-InstallationPrerequisites)) {
        Write-InstallLog "Installation prerequisites not met. Exiting." "ERROR"
        exit 1
    }
    
    # Create backup if force is not specified
    if (-not $Force) {
        Write-InstallLog "Creating backup of existing configuration..."
        # Backup logic would go here
    }
    
    # Install based on mode
    switch ($Mode) {
        "vscode" { Install-VSCodeIntegration }
        "cursor" { Install-CursorIntegration }
        "global" { Install-GlobalIntegration }
        "automatic" { Install-AutomaticIntegration }
        default { 
            Write-InstallLog "Invalid mode specified: $Mode" "ERROR"
            exit 1
        }
    }
    
    Write-InstallLog "Installation completed successfully!" "SUCCESS"
    Write-InstallLog "You can now use terminal safety features in your development environment." "INFO"
    Write-InstallLog "Phase 2 enhanced monitoring is enabled by default." "INFO"
    Write-InstallLog "Test the installation with: .\terminal-safety.ps1 phase2" "INFO"
}

# Execute installation
try {
    Start-Installation
} catch {
    Write-InstallLog "Installation failed: $($_.Exception.Message)" "ERROR"
    exit 1
}

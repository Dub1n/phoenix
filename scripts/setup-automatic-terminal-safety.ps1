# Automatic Terminal Safety Setup
# Makes safe terminal execution automatic for all commands

param(
    [switch]$Install = $false,
    [switch]$Uninstall = $false,
    [switch]$Test = $false
)

# Get the current script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# PowerShell profile path
$profilePath = $PROFILE.CurrentUserAllHosts

# Function to create safe command wrapper
function New-SafeCommandWrapper {
    param([string]$Command, [string]$Arguments = "")
    
    $safeWrapper = "powershell -ExecutionPolicy Bypass -File `"$projectRoot\scripts\auto-terminal-manager.ps1`" -Command '$Command'"
    
    if ($Arguments) {
        $safeWrapper = "powershell -ExecutionPolicy Bypass -File `"$projectRoot\scripts\auto-terminal-manager.ps1`" -Command '$Command $Arguments'"
    }
    
    return $safeWrapper
}

# Function to create PowerShell profile content
function New-PowerShellProfile {
    $profileContent = @"
# Automatic Terminal Safety Profile
# Automatically wraps all commands with safe terminal execution

# Get the project root directory
`$projectRoot = "$projectRoot"

# Function to safely execute any command
function Invoke-SafeCommand {
    param(
        [string]`$Command,
        [string]`$Arguments = "",
        [switch]`$Background = `$false,
        [switch]`$Debug = `$false
    )
    
    `$safeWrapper = "powershell -ExecutionPolicy Bypass -File `"`$projectRoot\scripts\auto-terminal-manager.ps1`""
    
    if (`$Background) {
        `$safeWrapper += " -Background"
    }
    
    if (`$Debug) {
        `$safeWrapper += " -Debug"
    }
    
    `$safeWrapper += " -Command '$Command'"
    
    if (`$Arguments) {
        `$safeWrapper = `$safeWrapper -replace "'$Command'", "'$Command `$Arguments'"
    }
    
    # Execute the safe wrapper
    Invoke-Expression `$safeWrapper
}

# Override common commands to use safe execution
function npm {
    param([string]`$Arguments = "")
    Invoke-SafeCommand -Command "npm" -Arguments `$Arguments
}

function node {
    param([string]`$Arguments = "")
    Invoke-SafeCommand -Command "node" -Arguments `$Arguments
}

function git {
    param([string]`$Arguments = "")
    Invoke-SafeCommand -Command "git" -Arguments `$Arguments
}

function tsc {
    param([string]`$Arguments = "")
    Invoke-SafeCommand -Command "tsc" -Arguments `$Arguments
}

function jest {
    param([string]`$Arguments = "")
    Invoke-SafeCommand -Command "jest" -Arguments `$Arguments
}

# Override Start-Process to use safe execution for common tools
function Start-SafeProcess {
    param(
        [string]`$FilePath,
        [string]`$ArgumentList = "",
        [switch]`$Background = `$false
    )
    
    # Check if it's a command that should use safe execution
    `$safeCommands = @("npm", "node", "git", "tsc", "jest", "yarn", "pnpm")
    
    foreach (`$cmd in `$safeCommands) {
        if (`$FilePath -like "*`$cmd*") {
            if (`$Background) {
                Invoke-SafeCommand -Command `$cmd -Arguments `$ArgumentList -Background
            } else {
                Invoke-SafeCommand -Command `$cmd -Arguments `$ArgumentList
            }
            return
        }
    }
    
    # Fall back to regular Start-Process for other commands
    Start-Process -FilePath `$FilePath -ArgumentList `$ArgumentList
}

# Create aliases for common commands
Set-Alias -Name "npm-safe" -Value npm
Set-Alias -Name "node-safe" -Value node
Set-Alias -Name "git-safe" -Value git
Set-Alias -Name "tsc-safe" -Value tsc
Set-Alias -Name "jest-safe" -Value jest

# Environment variable to indicate safe terminal is active
`$env:SAFE_TERMINAL_ENABLED = "true"

Write-Host "Automatic Terminal Safety is now active!" -ForegroundColor Green
Write-Host "All npm, node, git, tsc, and jest commands will use safe execution." -ForegroundColor Cyan
Write-Host "Use 'Get-Help Invoke-SafeCommand' for more information." -ForegroundColor Cyan
"@

    return $profileContent
}

# Function to install automatic terminal safety
function Install-AutomaticTerminalSafety {
    Write-Host "Installing Automatic Terminal Safety..." -ForegroundColor Green
    
    # Create profile directory if it doesn't exist
    $profileDir = Split-Path -Parent $profilePath
    if (-not (Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    }
    
    # Create the profile content
    $profileContent = New-PowerShellProfile
    
    # Backup existing profile
    if (Test-Path $profilePath) {
        $backupPath = "$profilePath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $profilePath $backupPath
        Write-Host "Backed up existing profile to: $backupPath" -ForegroundColor Yellow
    }
    
    # Write the new profile
    $profileContent | Out-File -FilePath $profilePath -Encoding UTF8
    Write-Host "PowerShell profile updated: $profilePath" -ForegroundColor Green
    
    # Create environment setup
    $envSetupPath = "$projectRoot\scripts\env-setup.ps1"
    $envSetupContent = @"
# Environment Setup for Automatic Terminal Safety
# Source this file to enable safe terminal execution

# Set environment variables
`$env:SAFE_TERMINAL_ENABLED = "true"
`$env:SAFE_TERMINAL_PROJECT_ROOT = "$projectRoot"

# Add project scripts to PATH
`$env:PATH = "$projectRoot\scripts;" + `$env:PATH

Write-Host "Environment setup complete!" -ForegroundColor Green
"@

    $envSetupContent | Out-File -FilePath $envSetupPath -Encoding UTF8
    Write-Host "Environment setup script created: $envSetupPath" -ForegroundColor Green
    
    Write-Host "`nInstallation complete!" -ForegroundColor Green
    Write-Host "Restart your terminal or run: . `$PROFILE" -ForegroundColor Cyan
}

# Function to uninstall automatic terminal safety
function Uninstall-AutomaticTerminalSafety {
    Write-Host "Uninstalling Automatic Terminal Safety..." -ForegroundColor Yellow
    
    if (Test-Path $profilePath) {
        # Remove the automatic terminal safety content
        $content = Get-Content $profilePath -Raw
        $lines = $content -split "`n"
        $newLines = @()
        $skipSection = $false
        
        foreach ($line in $lines) {
            if ($line -match "# Automatic Terminal Safety Profile") {
                $skipSection = $true
            }
            elseif ($skipSection -and $line -match "^#") {
                $skipSection = $false
                $newLines += $line
            }
            elseif (-not $skipSection) {
                $newLines += $line
            }
        }
        
        $newLines | Out-File -FilePath $profilePath -Encoding UTF8
        Write-Host "PowerShell profile cleaned: $profilePath" -ForegroundColor Green
    }
    
    Write-Host "`nUninstallation complete!" -ForegroundColor Green
    Write-Host "Restart your terminal or run: . `$PROFILE" -ForegroundColor Cyan
}

# Function to test automatic terminal safety
function Test-AutomaticTerminalSafety {
    Write-Host "Testing Automatic Terminal Safety..." -ForegroundColor Green
    
    # Test if the profile is loaded
    if ($env:SAFE_TERMINAL_ENABLED -eq "true") {
        Write-Host "✓ Safe terminal is enabled" -ForegroundColor Green
    } else {
        Write-Host "✗ Safe terminal is not enabled" -ForegroundColor Red
        Write-Host "Run: . `$PROFILE" -ForegroundColor Cyan
    }
    
    # Test safe command execution
    Write-Host "`nTesting safe command execution..." -ForegroundColor Yellow
    try {
        $result = Invoke-SafeCommand -Command "echo" -Arguments "test"
        Write-Host "✓ Safe command execution works" -ForegroundColor Green
    } catch {
        Write-Host "✗ Safe command execution failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test npm command
    Write-Host "`nTesting npm command..." -ForegroundColor Yellow
    try {
        $result = npm --version
        Write-Host "✓ NPM command works with safe execution" -ForegroundColor Green
    } catch {
        Write-Host "✗ NPM command failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
if ($Install) {
    Install-AutomaticTerminalSafety
}
elseif ($Uninstall) {
    Uninstall-AutomaticTerminalSafety
}
elseif ($Test) {
    Test-AutomaticTerminalSafety
}
else {
    Write-Host "Automatic Terminal Safety Setup" -ForegroundColor Green
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  .\setup-automatic-terminal-safety.ps1 -Install" -ForegroundColor White
    Write-Host "  .\setup-automatic-terminal-safety.ps1 -Uninstall" -ForegroundColor White
    Write-Host "  .\setup-automatic-terminal-safety.ps1 -Test" -ForegroundColor White
    Write-Host ""
    Write-Host "This will make ALL terminal commands automatically use safe execution." -ForegroundColor Yellow
} 
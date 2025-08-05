# Cursor Terminal Initialization Script
# This script is loaded when a terminal starts in Cursor and overrides commands with safe execution

# Set environment variables
$env:SAFE_TERMINAL_ENABLED = "true"
$env:SAFE_TERMINAL_PROJECT_ROOT = $PWD.Path

# Get the project root directory
$projectRoot = $PWD.Path

Write-Host "Cursor Terminal Safety Activated" -ForegroundColor Green

# Function to safely execute any command
function Invoke-SafeCommand {
    param(
        [string]$Command,
        [string]$Arguments = "",
        [switch]$Background = $false,
        [switch]$Debug = $false
    )
    
    $fullCommand = $Command
    if ($Arguments) {
        $fullCommand += " $Arguments"
    }
    
    # Build arguments for auto-terminal-manager
    $managerArgs = @(
        "-ExecutionPolicy", "Bypass",
        "-File", "$projectRoot\scripts\auto-terminal-manager.ps1",
        "-Command", $fullCommand
    )
    
    if ($Background) {
        $managerArgs += "-Background"
    }
    
    if ($Debug) {
        $managerArgs += "-Debug"
    }
    
    # Execute using Start-Process to avoid hanging
    try {
        $result = & powershell @managerArgs
        return $result
    }
    catch {
        Write-Host "Safe command execution failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Override common commands to use safe execution
function npm {
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "npm" -Arguments $arguments
}

function node {
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "node" -Arguments $arguments
}

function git {
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "git" -Arguments $arguments
}

function tsc {
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "tsc" -Arguments $arguments
}

function jest {
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "jest" -Arguments $arguments
}

function yarn {
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "yarn" -Arguments $arguments
}

function pnpm {
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "pnpm" -Arguments $arguments
}

# Create aliases for safe commands
Set-Alias -Name "npm-safe" -Value npm
Set-Alias -Name "node-safe" -Value node
Set-Alias -Name "git-safe" -Value git
Set-Alias -Name "tsc-safe" -Value tsc
Set-Alias -Name "jest-safe" -Value jest

Write-Host "Safe command overrides loaded: npm, node, git, tsc, jest, yarn, pnpm" -ForegroundColor Cyan
Write-Host "All commands will now use automatic timeout and hanging prevention." -ForegroundColor Cyan
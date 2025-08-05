# Global Command Wrapper
# Intercepts any command and applies safe execution automatically

param(
    [string]$Command,
    [string]$Arguments = "",
    [switch]$Background = $false,
    [switch]$Debug = $false
)

# Get the project root directory
$projectRoot = Split-Path -Parent $PSScriptRoot

# Function to check if command should use safe execution
function Should-UseSafeExecution {
    param([string]$Command)
    
    $safeCommands = @(
        "npm", "node", "git", "tsc", "jest", "yarn", "pnpm",
        "npx", "nvm", "nrm", "nls", "ncu", "nsp", "nlf",
        "webpack", "rollup", "vite", "parcel", "esbuild",
        "babel", "eslint", "prettier", "stylelint", "husky",
        "lint-staged", "commitizen", "cz-conventional-changelog"
    )
    
    $commandLower = $Command.ToLower()
    
    foreach ($safeCmd in $safeCommands) {
        if ($commandLower -like "*$safeCmd*") {
            return $true
        }
    }
    
    return $false
}

# Function to execute command safely
function Invoke-SafeExecution {
    param(
        [string]$Command,
        [string]$Arguments = "",
        [bool]$Background = $false,
        [bool]$Debug = $false
    )
    
    $safeWrapper = "powershell -ExecutionPolicy Bypass -File `"$projectRoot\scripts\auto-terminal-manager.ps1`""
    
    if ($Background) {
        $safeWrapper += " -Background"
    }
    
    if ($Debug) {
        $safeWrapper += " -Debug"
    }
    
    $fullCommand = $Command
    if ($Arguments) {
        $fullCommand += " $Arguments"
    }
    
    $safeWrapper += " -Command '$fullCommand'"
    
    Write-Host "Executing safely: $fullCommand" -ForegroundColor Cyan
    Invoke-Expression $safeWrapper
}

# Function to execute command normally
function Invoke-NormalExecution {
    param(
        [string]$Command,
        [string]$Arguments = "",
        [bool]$Background = $false
    )
    
    $fullCommand = $Command
    if ($Arguments) {
        $fullCommand += " $Arguments"
    }
    
    if ($Background) {
        Start-Process -FilePath $Command -ArgumentList $Arguments -WindowStyle Hidden
    } else {
        Invoke-Expression $fullCommand
    }
}

# Main execution logic
if ($Command) {
    if (Should-UseSafeExecution -Command $Command) {
        Invoke-SafeExecution -Command $Command -Arguments $Arguments -Background $Background -Debug $Debug
    } else {
        Invoke-NormalExecution -Command $Command -Arguments $Arguments -Background $Background
    }
} else {
    Write-Host "Global Command Wrapper" -ForegroundColor Green
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  .\global-command-wrapper.ps1 -Command 'npm test'" -ForegroundColor White
    Write-Host "  .\global-command-wrapper.ps1 -Command 'git status'" -ForegroundColor White
    Write-Host "  .\global-command-wrapper.ps1 -Command 'echo hello'" -ForegroundColor White
    Write-Host ""
    Write-Host "This wrapper automatically applies safe execution to common development commands." -ForegroundColor Yellow
} 
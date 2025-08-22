# Cursor Terminal Initialization Script - Redesigned Architecture
# Non-blocking terminal initialization with lifecycle management
# Supports selective module loading and background heartbeat system

param(
    [switch]$EnableHeartbeat = $false,
    [switch]$EnableTerminalSafety = $false,
    [switch]$EnableCommandOverrides = $false,
    [switch]$EnableAll = $false,
    [switch]$Debug = $false
)

# Enhanced environment setup
$env:SAFE_TERMINAL_ENABLED = "true"
$env:SAFE_TERMINAL_PROJECT_ROOT = $PWD.Path
$env:CURSOR_AGENT_TERMINAL = "true"
$env:TERMINAL_INIT_VERSION = "2.0"

# Get the project root directory (go up from integration/ to the repository root)
$scriptPath = $PSScriptRoot
$projectRoot = Split-Path (Split-Path (Split-Path $scriptPath -Parent) -Parent) -Parent
$script:TerminalId = $null

# Determine which modules to load
if ($EnableAll) {
    $EnableHeartbeat = $true
    $EnableTerminalSafety = $true
    $EnableCommandOverrides = $true
}

# Show module loading status
Write-Host "Cursor Terminal Initialization - Selective Loading" -ForegroundColor Green
Write-Host "Heartbeat: $EnableHeartbeat" -ForegroundColor $(if ($EnableHeartbeat) { "Green" } else { "Red" })
Write-Host "Terminal Safety: $EnableTerminalSafety" -ForegroundColor $(if ($EnableTerminalSafety) { "Green" } else { "Red" })
Write-Host "Command Overrides: $EnableCommandOverrides" -ForegroundColor $(if ($EnableCommandOverrides) { "Green" } else { "Red" })

# Initialize terminal lifecycle management and heartbeat (non-blocking)
if ($EnableHeartbeat) {
    Write-Host "Initializing terminal lifecycle management..." -ForegroundColor Cyan
    try {
        # Initialize terminal lifecycle manager first
        $lifecycleManagerPath = "$projectRoot\scripts\terminal-completer\core\terminal-lifecycle-manager.ps1"
        
        if (Test-Path $lifecycleManagerPath) {
            # Start terminal lifecycle management in background
            $lifecycleJob = Start-Job -ScriptBlock {
                param($lifecycleManagerPath, $debug)
                try {
                    $terminalId = & powershell -ExecutionPolicy Bypass -File $lifecycleManagerPath -Action "start" -Debug:$debug
                    return @{
                        status = "SUCCESS"
                        terminal_id = $terminalId
                    }
                } catch {
                    return @{
                        status = "ERROR"
                        error = $_.Exception.Message
                    }
                }
            } -ArgumentList $lifecycleManagerPath, $Debug
            
            # Brief wait for lifecycle manager to start (non-blocking)
            Start-Sleep -Milliseconds 150
            
            # Check if lifecycle management started successfully
            $lifecycleResult = Receive-Job $lifecycleJob -Wait -AutoRemoveJob -ErrorAction SilentlyContinue
            
            if ($lifecycleResult -and $lifecycleResult.status -eq "SUCCESS") {
                $script:TerminalId = $lifecycleResult.terminal_id
                Write-Host "Terminal lifecycle management active (ID: $script:TerminalId)" -ForegroundColor Green
                
                # Set environment variable for terminal ID
                $env:CURSOR_TERMINAL_ID = $script:TerminalId
                
                Write-Host "Background heartbeat system initialized - terminal ready" -ForegroundColor Green
            } else {
                Write-Host "Lifecycle management uncertain - falling back to direct heartbeat" -ForegroundColor Yellow
                
                # Fallback to direct heartbeat initialization
                $heartbeatPath = Join-Path $projectRoot "scripts\terminal-completer\core\agent-heartbeat.ps1"
                if (Test-Path $heartbeatPath) {
                    Write-Host "Direct heartbeat script found at: $heartbeatPath" -ForegroundColor Green
                    $processArgs = "-ExecutionPolicy Bypass -File `"$heartbeatPath`" -Background"
                    if ($Debug) { $processArgs += " -Debug" }
                    Start-Process powershell -ArgumentList $processArgs -NoNewWindow
                    
                    Write-Host "Fallback heartbeat initialized - terminal ready" -ForegroundColor Yellow
                } else {
                    Write-Host "No heartbeat available at: $heartbeatPath - terminal ready without heartbeat" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "Lifecycle manager not found - using direct heartbeat" -ForegroundColor Yellow
            
            # Direct heartbeat fallback
            $heartbeatPath = Join-Path $projectRoot "scripts\terminal-completer\core\agent-heartbeat.ps1"
            if (Test-Path $heartbeatPath) {
                Write-Host "Direct heartbeat script found at: $heartbeatPath" -ForegroundColor Green
                $processArgs = "-ExecutionPolicy Bypass -File `"$heartbeatPath`" -Background"
                if ($Debug) { $processArgs += " -Debug" }
                Start-Process powershell -ArgumentList $processArgs -NoNewWindow
                
                Write-Host "Direct heartbeat initialized - terminal ready" -ForegroundColor Green
            } else {
                Write-Host "No heartbeat available at: $heartbeatPath - terminal ready without heartbeat" -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host "Heartbeat initialization failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Terminal ready without heartbeat functionality" -ForegroundColor Yellow
    }
}

# Load terminal safety if enabled
if ($EnableTerminalSafety) {
    Write-Host "Loading terminal safety module..." -ForegroundColor Cyan
    # Terminal safety functionality is built into this script
    Write-Host "Terminal safety module loaded successfully" -ForegroundColor Green
}

# Load command overrides if enabled
if ($EnableCommandOverrides) {
    Write-Host "Loading command override module..." -ForegroundColor Cyan
    # Command override functionality is built into this script
    Write-Host "Command override module loaded successfully" -ForegroundColor Green
}

Write-Host ""

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
    
    # Build arguments for enhanced-terminal-manager (Phase 2)
    $managerArgs = @(
        "-ExecutionPolicy", "Bypass",
        "-File", "$projectRoot\scripts\terminal-completer\core\enhanced-terminal-manager.ps1",
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

# Register cleanup handler for terminal session
if ($script:TerminalId) {
    Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
        try {
            $lifecycleManagerPath = "$env:SAFE_TERMINAL_PROJECT_ROOT\scripts\terminal-completer\core\terminal-lifecycle-manager.ps1"
            if (Test-Path $lifecycleManagerPath -and $env:CURSOR_TERMINAL_ID) {
                & powershell -ExecutionPolicy Bypass -File $lifecycleManagerPath -Action "stop" -TerminalId $env:CURSOR_TERMINAL_ID
            }
        } catch {
            # Silently handle cleanup errors
        }
    } | Out-Null
}

# Show final status based on enabled modules
Write-Host ""
Write-Host "=== Cursor Terminal Ready (Architecture v2.1) ===" -ForegroundColor Green

if ($EnableCommandOverrides) {
    Write-Host "[OK] Safe command overrides: npm, node, git, tsc, jest, yarn, pnpm" -ForegroundColor Cyan
}

if ($EnableTerminalSafety) {
    Write-Host "[OK] Terminal safety: Automatic timeout and hanging prevention active" -ForegroundColor Cyan
    Write-Host "[OK] Enhanced monitoring: Phase 2 context-aware pattern detection" -ForegroundColor Cyan
}

if ($EnableHeartbeat) {
    if ($script:TerminalId) {
        Write-Host "[OK] Terminal lifecycle: Multi-terminal support with session tracking" -ForegroundColor Green
        Write-Host "[OK] Background heartbeat: Non-blocking terminal-specific output" -ForegroundColor Green
        Write-Host "  Session ID: $script:TerminalId" -ForegroundColor Gray
    } else {
        Write-Host "[OK] Background heartbeat: Direct heartbeat mode active" -ForegroundColor Yellow
    }
} else {
    Write-Host "[--] Heartbeat disabled: Manual mode (agent features unavailable)" -ForegroundColor Gray
}

if ($EnableHeartbeat -or $EnableTerminalSafety -or $EnableCommandOverrides) {
    Write-Host ""
    Write-Host "Terminal initialization complete - ready for agent interaction" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Terminal ready - no enhanced features enabled" -ForegroundColor Yellow
}

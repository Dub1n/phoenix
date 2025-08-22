# Agent Terminal Heartbeat System - Redesigned Architecture
# Provides terminal-specific heartbeat without Windows-wide interference
# Background execution with proper lifecycle management

param(
    [int]$IntervalSeconds = 5,
    [switch]$Debug = $false,
    [switch]$Test = $false,
    [switch]$Silent = $false,
    [switch]$Background = $true,
    [switch]$Stop = $false
)

# Global variables for lifecycle management
$script:HeartbeatRunspace = $null
$script:HeartbeatJob = $null
$script:TerminalPID = $PID
$script:SessionId = [System.Guid]::NewGuid().ToString("N")[0..7] -join ""

# Load configuration from terminal-config.json with enhanced fallback
$configPath = ".cursor/terminal-config.json"
$config = @{
    heartbeat_chars = @("*", "+", "x", "o")  # Non-intrusive spinner symbols
    max_heartbeats = if ($Test) { 5 } elseif ($Background) { 60 } else { 300 }  # 5 for testing, 60 for background (1 min), 300 for foreground (5 min)
    interval_ms = 1000    # 1 second intervals
    silent_mode = $Silent
    background_mode = $Background
    terminal_only = $true  # Only output to terminal, not system-wide
}

# Enhanced configuration loading
if (Test-Path $configPath) {
    try {
        $terminalConfig = Get-Content $configPath -Raw | ConvertFrom-Json
        if ($terminalConfig.heartbeat) {
            if ($terminalConfig.heartbeat.status_symbols) {
                $config.heartbeat_chars = $terminalConfig.heartbeat.status_symbols
            }
            if ($terminalConfig.heartbeat.max_heartbeats) {
                $config.max_heartbeats = $terminalConfig.heartbeat.max_heartbeats
            }
            if ($terminalConfig.heartbeat.interval_ms) {
                $config.interval_ms = $terminalConfig.heartbeat.interval_ms
                $IntervalSeconds = [math]::Max(1, [math]::Floor($config.interval_ms / 1000))
            }
        }
        if ($Debug) { Write-Host "[Agent-HB] Loaded configuration from terminal-config.json" -ForegroundColor Green }
    }
    catch {
        if ($Debug) { Write-Host "[Agent-HB] Warning: Config load failed, using defaults" -ForegroundColor Yellow }
    }
} else {
    if ($Debug) { Write-Host "[Agent-HB] Using default configuration" -ForegroundColor Cyan }
}

# Enhanced agent terminal detection with multiple methods
function Test-IsAgentTerminal {
    param([switch]$Verbose = $Debug)
    
    # Method 1: Check for Cursor-specific environment variables
    $agentEnvVars = @(
        "CURSOR_AGENT_TERMINAL", 
        "CURSOR_AGENT", 
        "AGENT_TERMINAL", 
        "CURSOR_TERMINAL",
        "VSCODE_AGENT_FOLDER",
        "TERM_PROGRAM"
    )
    
    foreach ($var in $agentEnvVars) {
        $value = [Environment]::GetEnvironmentVariable($var)
        if ($value) {
            if ($Verbose) { Write-Host "[Agent-HB] Agent terminal detected via env var: $var=$value" -ForegroundColor Cyan }
            return $true
        }
    }
    
    # Method 2: Check parent process tree for Cursor/VS Code
    try {
        $currentProcess = Get-Process -Id $PID -ErrorAction SilentlyContinue
        if ($currentProcess -and $currentProcess.Parent) {
            $parentProcess = Get-Process -Id $currentProcess.Parent.Id -ErrorAction SilentlyContinue
            
            if ($parentProcess) {
                $processNames = @("cursor", "code", "vscode")
                foreach ($name in $processNames) {
                    if ($parentProcess.ProcessName -like "*$name*") {
                        if ($Verbose) { Write-Host "[Agent-HB] Agent terminal detected via parent process: $($parentProcess.ProcessName)" -ForegroundColor Cyan }
                        return $true
                    }
                }
            }
        }
    }
    catch {
        # Process tree check failed, continue with other methods
    }
    
    # Method 3: Check for Cursor processes in system
    $cursorProcesses = Get-Process -Name "*cursor*" -ErrorAction SilentlyContinue
    if ($cursorProcesses) {
        if ($Verbose) { Write-Host "[Agent-HB] Cursor processes detected: $($cursorProcesses.Count)" -ForegroundColor Cyan }
        return $true
    }
    
    # Method 4: Check workspace context
    $currentPath = Get-Location
    if ($currentPath.Path -like "*VDL_Vault*" -or $env:SAFE_TERMINAL_ENABLED -eq "true") {
        if ($Verbose) { Write-Host "[Agent-HB] Agent context detected via workspace: $($currentPath.Path)" -ForegroundColor Cyan }
        return $true
    }
    
    return $false
}

# Terminal-specific output functions - Execute actual echo commands for agent visibility
function Write-TerminalHeartbeat {
    param(
        [string]$Symbol,
        [switch]$Visible = $true
    )
    
    try {
        if ($config.terminal_only -and $Visible -and -not $config.silent_mode) {
            # Execute actual echo command that agents can see complete
            $echoCommand = "echo $Symbol"
            
            if ($Debug) {
                Write-Host "[Agent-HB] Executing heartbeat command: $echoCommand" -ForegroundColor Gray
            }
            
            # Execute the echo command - this creates visible command execution and completion
            Invoke-Expression $echoCommand
            
            # Small delay to ensure command completion is visible
            Start-Sleep -Milliseconds 100
        }
        
        return $true
    }
    catch {
        if ($Debug) {
            Write-Host "[Agent-HB] Terminal heartbeat execution failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
}

function Write-TerminalMessage {
    param(
        [string]$Message,
        [string]$Color = "Gray"
    )
    
    try {
        if (-not $config.silent_mode) {
            # Write message with timestamp - simple and visible
            $timestamp = Get-Date -Format 'HH:mm:ss'
            Write-Host "$Message - $timestamp" -ForegroundColor $Color
        }
        return $true
    }
    catch {
        return $false
    }
}

# Enhanced heartbeat function with actual command execution
function Send-Heartbeat {
    param([int]$HeartbeatNumber)
    
    try {
        # Cycle through symbols sequentially
        $charIndex = ($HeartbeatNumber - 1) % $config.heartbeat_chars.Count
        $heartbeatChar = $config.heartbeat_chars[$charIndex]
        
        if ($Debug) {
            Write-Host "[Agent-HB] Heartbeat #$HeartbeatNumber - Symbol: $heartbeatChar ($($charIndex + 1)/$($config.heartbeat_chars.Count))" -ForegroundColor Green
        }
        
        # Execute actual echo command for agent visibility
        $success = Write-TerminalHeartbeat -Symbol $heartbeatChar -Visible:(-not $config.silent_mode)
        
        if ($success -and -not $config.silent_mode) {
            # Add minimal timestamp for debugging (but don't execute as command)
            $timestamp = Get-Date -Format 'HH:mm:ss.fff'
            if ($Debug) {
                Write-Host "[Agent-HB] Heartbeat executed at $timestamp" -ForegroundColor Gray
            }
        }
        
        return $success
    }
    catch {
        if ($Debug) {
            Write-Host "[Agent-HB] Heartbeat #$HeartbeatNumber failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
}

# Direct execution heartbeat system for agent visibility
function Start-DirectHeartbeat {
    param(
        [int]$IntervalSeconds = 1,
        [switch]$Force = $false
    )
    
    if ($Debug) {
        Write-Host "[Agent-HB] Starting direct execution heartbeat system" -ForegroundColor Green
        Write-Host "[Agent-HB] This will execute actual commands visible to agents" -ForegroundColor Cyan
    }
    
    # Direct execution approach - no background runspaces needed
    # This ensures commands are actually executed and visible to agents
    
    try {
        # Direct execution heartbeat loop - no background runspaces
        # This ensures actual command execution visible to agents
        
        $heartbeatCount = 0
        $startTime = Get-Date
        
        if ($Debug) {
            Write-Host "[Agent-HB] Starting direct heartbeat loop (Session: $script:SessionId)" -ForegroundColor Green
            Write-Host "[Agent-HB] Interval: $IntervalSeconds seconds, Max heartbeats: $($config.max_heartbeats)" -ForegroundColor Cyan
        }
        
        while ($heartbeatCount -lt $config.max_heartbeats) {
            $heartbeatCount++
            
            # Get symbol for this heartbeat
            $charIndex = ($heartbeatCount - 1) % $config.heartbeat_chars.Count
            $heartbeatChar = $config.heartbeat_chars[$charIndex]
            
            # Execute actual echo command - this is what agents need to see
            if ($config.terminal_only -and -not $config.silent_mode) {
                try {
                    if ($Debug) {
                        Write-Host "[Agent-HB] Executing: echo $heartbeatChar" -ForegroundColor Gray
                    }
                    
                    # Direct command execution for agent visibility
                    Invoke-Expression "echo $heartbeatChar"
                    
                    if ($Debug) {
                        $elapsed = ((Get-Date) - $startTime).TotalSeconds
                        Write-Host "[Agent-HB] Heartbeat #$heartbeatCount completed ($([math]::Round($elapsed, 1))s)" -ForegroundColor Green
                    }
                } catch {
                    if ($Debug) {
                        Write-Host "[Agent-HB] Heartbeat execution failed: $($_.Exception.Message)" -ForegroundColor Red
                    }
                }
            }
            
            # Wait for next heartbeat
            Start-Sleep -Seconds $IntervalSeconds
        }
        
        if ($Debug) {
            Write-Host "[Agent-HB] Direct heartbeat completed after $heartbeatCount heartbeats" -ForegroundColor Green
        }
        
        return $true
    }
    catch {
        if ($Debug) {
            Write-Host "[Agent-HB] Failed to start background heartbeat: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
}

# Stop background heartbeat system
function Stop-BackgroundHeartbeat {
    try {
        if ($script:HeartbeatRunspace) {
            $script:HeartbeatRunspace.Close()
            $script:HeartbeatRunspace.Dispose()
            $script:HeartbeatRunspace = $null
        }
        
        if ($script:HeartbeatJob) {
            $script:HeartbeatJob = $null
        }
        
        if ($Debug) {
            Write-Host "[Agent-HB] Background heartbeat stopped" -ForegroundColor Yellow
        }
        return $true
    }
    catch {
        if ($Debug) {
            Write-Host "[Agent-HB] Error stopping background heartbeat: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
}

# Main heartbeat system entry point
function Start-HeartbeatSystem {
    param([int]$IntervalSeconds = 1)
    
    # Use direct execution for agent visibility
    # Background mode doesn't provide real-time terminal output
    return Start-DirectHeartbeat -IntervalSeconds $IntervalSeconds
}

# Foreground heartbeat system (fallback)
function Start-ForegroundHeartbeat {
    param([int]$IntervalSeconds)
    
    if ($Debug) {
        Write-Host "[Agent-HB] Starting foreground heartbeat system..." -ForegroundColor Green
        Write-Host "[Agent-HB] Interval: $IntervalSeconds seconds" -ForegroundColor Cyan
        Write-Host "[Agent-HB] Silent mode: $($config.silent_mode)" -ForegroundColor Cyan
    }
    
    $heartbeatCount = 0
    $startTime = Get-Date
    
    try {
        while ($heartbeatCount -lt $config.max_heartbeats) {
            $heartbeatCount++
            
            # Send heartbeat
            $success = Send-Heartbeat -HeartbeatNumber $heartbeatCount
            
            if ($Debug) {
                $elapsed = ((Get-Date) - $startTime).TotalSeconds
                $statusText = if ($success) { 'Success' } else { 'Failed' }
                $statusColor = if ($success) { "Green" } else { "Red" }
                Write-Host "[Agent-HB] Heartbeat #$heartbeatCount ($([math]::Round($elapsed, 1))s) - $statusText" -ForegroundColor $statusColor
            }
            
            # Wait for next heartbeat
            Start-Sleep -Seconds $IntervalSeconds
        }
    }
    catch {
        if ($Debug) {
            Write-Host "[Agent-HB] Heartbeat interrupted: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Enhanced test function for the new architecture
function Test-HeartbeatSystem {
    Write-Host "=== Agent Heartbeat System Test (Redesigned Architecture) ===" -ForegroundColor Green
    Write-Host "Session ID: $script:SessionId" -ForegroundColor Cyan
    Write-Host ""
    
    # Test 1: Agent terminal detection
    Write-Host "Test 1: Agent Terminal Detection" -ForegroundColor Yellow
    $isAgent = Test-IsAgentTerminal -Verbose
    $detectionText = if ($isAgent) { 'DETECTED' } else { 'NOT DETECTED' }
    $detectionColor = if ($isAgent) { "Green" } else { "Yellow" }
    Write-Host "  Result: $detectionText" -ForegroundColor $detectionColor
    Write-Host ""
    
    # Test 2: Configuration loading
    Write-Host "Test 2: Configuration" -ForegroundColor Yellow
    Write-Host "  Heartbeat symbols: $($config.heartbeat_chars -join ', ')" -ForegroundColor White
    Write-Host "  Max heartbeats: $($config.max_heartbeats)" -ForegroundColor White
    Write-Host "  Interval: $($config.interval_ms)ms" -ForegroundColor White
    Write-Host "  Background mode: $($config.background_mode)" -ForegroundColor White
    Write-Host "  Terminal only: $($config.terminal_only)" -ForegroundColor White
    Write-Host ""
    
    # Test 3: Terminal output system
    Write-Host "Test 3: Terminal Output System" -ForegroundColor Yellow
    for ($i = 0; $i -lt [math]::Min(3, $config.heartbeat_chars.Count); $i++) {
        $char = $config.heartbeat_chars[$i]
        Write-Host "  Testing symbol: $char" -ForegroundColor White
        $success = Write-TerminalHeartbeat -Symbol $char -Visible:$true
        $resultText = if ($success) { 'SUCCESS' } else { 'FAILED' }
        $resultColor = if ($success) { "Green" } else { "Red" }
        Write-Host "    Result: $resultText" -ForegroundColor $resultColor
        Start-Sleep -Milliseconds 200
    }
    Write-Host ""
    
    # Test 4: Background execution capability
    Write-Host "Test 4: Background Execution" -ForegroundColor Yellow
    try {
        $testRunspace = [runspacefactory]::CreateRunspace()
        $testRunspace.Open()
        $testRunspace.Close()
        $testRunspace.Dispose()
        Write-Host "  Runspace creation: SUCCESS" -ForegroundColor Green
    }
    catch {
        Write-Host "  Runspace creation: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Test 5: Direct heartbeat system test
    if ($isAgent) {
        Write-Host "Test 5: Direct Heartbeat System (5 heartbeats)" -ForegroundColor Yellow
        Write-Host "  This will execute 5 actual echo commands visible to agents" -ForegroundColor Cyan
        
        try {
            # Test the direct heartbeat with limited count
            $testConfig = $config.Clone()
            $testConfig.max_heartbeats = 5
            $testConfig.silent_mode = $false
            
            Write-Host "  Starting direct heartbeat test..." -ForegroundColor Green
            $started = Start-DirectHeartbeat -IntervalSeconds 1
            
            if ($started) {
                Write-Host "  Direct heartbeat test completed successfully" -ForegroundColor Green
            } else {
                Write-Host "  Direct heartbeat test failed" -ForegroundColor Red
            }
        } catch {
            Write-Host "  Direct heartbeat test error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "=== Heartbeat System Test Completed ===" -ForegroundColor Green
}

# Cleanup handler for graceful shutdown
function Register-CleanupHandler {
    Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
        try {
            Stop-BackgroundHeartbeat
        } catch {
            # Silently handle cleanup errors
        }
    }
}

# Stop handler for manual stop requests
function Stop-HeartbeatService {
    Write-Host "[Agent-HB] Stopping heartbeat service..." -ForegroundColor Yellow
    $stopped = Stop-BackgroundHeartbeat
    if ($stopped) {
        Write-Host "[Agent-HB] Heartbeat service stopped successfully" -ForegroundColor Green
    } else {
        Write-Host "[Agent-HB] Error stopping heartbeat service" -ForegroundColor Red
    }
    exit 0
}

# Main execution logic with enhanced architecture
try {
    # Handle stop request
    if ($Stop) {
        Stop-HeartbeatService
    }
    
    # Handle test request
    if ($Test) {
        Test-HeartbeatSystem
        exit 0
    }
    
    # Check if we should run in agent terminal
    $isAgentTerminal = Test-IsAgentTerminal
    if (-not $isAgentTerminal) {
        if ($Debug) {
            Write-Host "[Agent-HB] Not in agent terminal - exiting" -ForegroundColor Yellow
        }
        exit 0
    }
    
    if ($Debug) {
        Write-Host "[Agent-HB] Agent terminal detected - starting heartbeat system" -ForegroundColor Green
        Write-Host "[Agent-HB] Session ID: $script:SessionId" -ForegroundColor Cyan
        Write-Host "[Agent-HB] Background mode: $($config.background_mode)" -ForegroundColor Cyan
    }
    
    # Register cleanup handler
    Register-CleanupHandler
    
    # Start heartbeat system with direct execution
    $started = Start-HeartbeatSystem -IntervalSeconds $IntervalSeconds
    
    if ($started) {
        if ($Debug) {
            Write-Host "[Agent-HB] Direct heartbeat system completed successfully" -ForegroundColor Green
            Write-Host "[Agent-HB] All heartbeat commands were executed and visible to agents" -ForegroundColor Green
        }
    } else {
        if ($Debug) {
            Write-Host "[Agent-HB] Failed to start heartbeat system" -ForegroundColor Red
        }
        exit 1
    }
}
catch {
    if ($Debug) {
        Write-Host "[Agent-HB] Fatal error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Ensure cleanup on error
    try {
        Stop-BackgroundHeartbeat
    } catch {
        # Silently handle cleanup errors
    }
    
    exit 1
}
finally {
    # Final cleanup attempt
    if ($script:HeartbeatRunspace) {
        try {
            Stop-BackgroundHeartbeat
        } catch {
            # Silently handle cleanup errors
        }
    }
}

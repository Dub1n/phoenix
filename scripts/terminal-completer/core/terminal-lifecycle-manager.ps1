# Terminal Lifecycle Manager - Multi-Terminal Coordination System
# Manages multiple terminal instances with shared heartbeat resources
# Provides session tracking, reference counting, and automatic cleanup

param(
    [string]$Action = "start",  # start, stop, status, cleanup
    [string]$TerminalId = "",   # Unique terminal identifier
    [switch]$Debug = $false,
    [switch]$Force = $false
)

# Global configuration and state management
$script:StateFile = "$env:TEMP\terminal-heartbeat-state.json"
$script:LockFile = "$env:TEMP\terminal-heartbeat-lock.tmp"
$script:MaxLockWaitSeconds = 10

# Terminal state structure
$script:DefaultState = @{
    version = "2.0"
    created = (Get-Date).ToString("o")
    last_updated = (Get-Date).ToString("o")
    active_terminals = @{}
    heartbeat_instances = @{}
    cleanup_registry = @{}
}

# Acquire file lock for thread-safe operations
function Get-StateLock {
    param([int]$TimeoutSeconds = $script:MaxLockWaitSeconds)
    
    $startTime = Get-Date
    while ((Get-Date) - $startTime -lt [TimeSpan]::FromSeconds($TimeoutSeconds)) {
        try {
            # Try to create lock file exclusively
            $lockHandle = [System.IO.File]::Create($script:LockFile)
            return $lockHandle
        }
        catch {
            Start-Sleep -Milliseconds 100
        }
    }
    throw "Failed to acquire state lock within $TimeoutSeconds seconds"
}

# Release file lock
function Release-StateLock {
    param([System.IO.FileStream]$LockHandle)
    
    try {
        if ($LockHandle) {
            $LockHandle.Close()
            $LockHandle.Dispose()
            Remove-Item $script:LockFile -Force -ErrorAction SilentlyContinue
        }
    }
    catch {
        # Silently handle lock release errors
    }
}

# Load terminal state from file
function Get-TerminalState {
    try {
        if (Test-Path $script:StateFile) {
            $content = Get-Content $script:StateFile -Raw -ErrorAction Stop
            $state = $content | ConvertFrom-Json
            
            # Ensure state has required structure
            if (-not $state.active_terminals) { $state.active_terminals = @{} }
            if (-not $state.heartbeat_instances) { $state.heartbeat_instances = @{} }
            if (-not $state.cleanup_registry) { $state.cleanup_registry = @{} }
            
            return $state
        } else {
            return $script:DefaultState.Clone()
        }
    }
    catch {
        if ($Debug) {
            Write-Host "[TLM] Failed to load state, using defaults: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        return $script:DefaultState.Clone()
    }
}

# Save terminal state to file
function Set-TerminalState {
    param($State)
    
    try {
        $State.last_updated = (Get-Date).ToString("o")
        $json = $State | ConvertTo-Json -Depth 10 -Compress
        $json | Set-Content $script:StateFile -Encoding UTF8 -Force
        return $true
    }
    catch {
        if ($Debug) {
            Write-Host "[TLM] Failed to save state: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
}

# Generate unique terminal identifier
function New-TerminalId {
    return "term_$(Get-Date -Format 'yyyyMMdd_HHmmss')_$([System.Guid]::NewGuid().ToString('N')[0..7] -join '')"
}

# Check if process is still running
function Test-ProcessAlive {
    param([int]$ProcessId)
    
    try {
        $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        return ($process -ne $null -and -not $process.HasExited)
    }
    catch {
        return $false
    }
}

# Register new terminal session
function Register-TerminalSession {
    param(
        [string]$TerminalId,
        [int]$ProcessId = $PID,
        [hashtable]$Metadata = @{}
    )
    
    $lockHandle = $null
    try {
        $lockHandle = Get-StateLock
        $state = Get-TerminalState
        
        $terminalInfo = @{
            terminal_id = $TerminalId
            process_id = $ProcessId
            started_at = (Get-Date).ToString("o")
            last_heartbeat = (Get-Date).ToString("o")
            metadata = $Metadata
            heartbeat_active = $false
            reference_count = 1
        }
        
        $state.active_terminals[$TerminalId] = $terminalInfo
        
        if (Set-TerminalState $state) {
            if ($Debug) {
                Write-Host "[TLM] Registered terminal session: $TerminalId (PID: $ProcessId)" -ForegroundColor Green
            }
            return $true
        }
        
        return $false
    }
    catch {
        if ($Debug) {
            Write-Host "[TLM] Failed to register terminal: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
    finally {
        Release-StateLock $lockHandle
    }
}

# Unregister terminal session
function Unregister-TerminalSession {
    param([string]$TerminalId)
    
    $lockHandle = $null
    try {
        $lockHandle = Get-StateLock
        $state = Get-TerminalState
        
        if ($state.active_terminals.ContainsKey($TerminalId)) {
            $terminalInfo = $state.active_terminals[$TerminalId]
            
            # Stop heartbeat if it was running for this terminal
            if ($terminalInfo.heartbeat_active) {
                Stop-TerminalHeartbeat -TerminalId $TerminalId -State $state
            }
            
            $state.active_terminals.Remove($TerminalId)
            
            if (Set-TerminalState $state) {
                if ($Debug) {
                    Write-Host "[TLM] Unregistered terminal session: $TerminalId" -ForegroundColor Yellow
                }
                return $true
            }
        }
        
        return $false
    }
    catch {
        if ($Debug) {
            Write-Host "[TLM] Failed to unregister terminal: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
    finally {
        Release-StateLock $lockHandle
    }
}

# Start heartbeat for terminal
function Start-TerminalHeartbeat {
    param(
        [string]$TerminalId,
        [hashtable]$State = $null
    )
    
    $lockHandle = $null
    try {
        if (-not $State) {
            $lockHandle = Get-StateLock
            $State = Get-TerminalState
        }
        
        if (-not $State.active_terminals.ContainsKey($TerminalId)) {
            if ($Debug) {
                Write-Host "[TLM] Terminal $TerminalId not found in active sessions" -ForegroundColor Red
            }
            return $false
        }
        
        $terminalInfo = $State.active_terminals[$TerminalId]
        
        # Check if heartbeat is already running
        if ($terminalInfo.heartbeat_active) {
            if ($Debug) {
                Write-Host "[TLM] Heartbeat already active for terminal: $TerminalId" -ForegroundColor Yellow
            }
            return $true
        }
        
        # Start heartbeat using the redesigned agent-heartbeat.ps1
        $heartbeatPath = Join-Path $PSScriptRoot "agent-heartbeat.ps1"
        if (Test-Path $heartbeatPath) {
            try {
                $heartbeatJob = Start-Job -ScriptBlock {
                    param($heartbeatPath, $terminalId, $debug)
                    & powershell -ExecutionPolicy Bypass -File $heartbeatPath -Background -Debug:$debug
                } -ArgumentList $heartbeatPath, $TerminalId, $Debug
                
                # Update state
                $terminalInfo.heartbeat_active = $true
                $terminalInfo.last_heartbeat = (Get-Date).ToString("o")
                $State.heartbeat_instances[$TerminalId] = @{
                    job_id = $heartbeatJob.Id
                    started_at = (Get-Date).ToString("o")
                }
                
                if ($lockHandle) {
                    Set-TerminalState $State
                }
                
                if ($Debug) {
                    Write-Host "[TLM] Started heartbeat for terminal: $TerminalId (Job: $($heartbeatJob.Id))" -ForegroundColor Green
                }
                return $true
            }
            catch {
                if ($Debug) {
                    Write-Host "[TLM] Failed to start heartbeat job: $($_.Exception.Message)" -ForegroundColor Red
                }
                return $false
            }
        } else {
            if ($Debug) {
                Write-Host "[TLM] Heartbeat script not found: $heartbeatPath" -ForegroundColor Red
            }
            return $false
        }
    }
    catch {
        if ($Debug) {
            Write-Host "[TLM] Failed to start terminal heartbeat: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
    finally {
        if ($lockHandle) {
            Release-StateLock $lockHandle
        }
    }
}

# Stop heartbeat for terminal
function Stop-TerminalHeartbeat {
    param(
        [string]$TerminalId,
        [hashtable]$State = $null
    )
    
    try {
        if (-not $State) {
            $State = Get-TerminalState
        }
        
        if ($State.heartbeat_instances.ContainsKey($TerminalId)) {
            $heartbeatInfo = $State.heartbeat_instances[$TerminalId]
            $jobId = $heartbeatInfo.job_id
            
            # Stop the background job
            try {
                $job = Get-Job -Id $jobId -ErrorAction SilentlyContinue
                if ($job) {
                    Stop-Job $job -ErrorAction SilentlyContinue
                    Remove-Job $job -Force -ErrorAction SilentlyContinue
                }
            }
            catch {
                # Silently handle job cleanup errors
            }
            
            # Update state
            $State.heartbeat_instances.Remove($TerminalId)
            if ($State.active_terminals.ContainsKey($TerminalId)) {
                $State.active_terminals[$TerminalId].heartbeat_active = $false
            }
            
            if ($Debug) {
                Write-Host "[TLM] Stopped heartbeat for terminal: $TerminalId" -ForegroundColor Yellow
            }
            return $true
        }
        
        return $false
    }
    catch {
        if ($Debug) {
            Write-Host "[TLM] Failed to stop terminal heartbeat: $($_.Exception.Message)" -ForegroundColor Red
        }
        return $false
    }
}

# Cleanup orphaned sessions and resources
function Invoke-TerminalCleanup {
    param([switch]$Force = $false)
    
    $lockHandle = $null
    try {
        $lockHandle = Get-StateLock
        $state = Get-TerminalState
        
        $cleaned = 0
        $orphanedTerminals = @()
        
        # Find orphaned terminals (processes no longer running)
        foreach ($terminalId in $state.active_terminals.Keys) {
            $terminalInfo = $state.active_terminals[$terminalId]
            $processId = $terminalInfo.process_id
            
            if (-not (Test-ProcessAlive $processId) -or $Force) {
                $orphanedTerminals += $terminalId
            }
        }
        
        # Clean up orphaned terminals
        foreach ($terminalId in $orphanedTerminals) {
            if ($Debug) {
                Write-Host "[TLM] Cleaning up orphaned terminal: $terminalId" -ForegroundColor Cyan
            }
            
            # Stop heartbeat if running
            Stop-TerminalHeartbeat -TerminalId $terminalId -State $state
            
            # Remove from active terminals
            $state.active_terminals.Remove($terminalId)
            $cleaned++
        }
        
        # Clean up orphaned heartbeat jobs
        $orphanedJobs = @()
        foreach ($terminalId in $state.heartbeat_instances.Keys) {
            if (-not $state.active_terminals.ContainsKey($terminalId)) {
                $orphanedJobs += $terminalId
            }
        }
        
        foreach ($terminalId in $orphanedJobs) {
            Stop-TerminalHeartbeat -TerminalId $terminalId -State $state
            $cleaned++
        }
        
        # Save updated state
        Set-TerminalState $state
        
        if ($Debug -and $cleaned -gt 0) {
            Write-Host "[TLM] Cleaned up $cleaned orphaned resources" -ForegroundColor Green
        }
        
        return $cleaned
    }
    catch {
        if ($Debug) {
            Write-Host "[TLM] Cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        return -1
    }
    finally {
        Release-StateLock $lockHandle
    }
}

# Get status of all terminals
function Get-TerminalStatus {
    try {
        $state = Get-TerminalState
        
        $status = @{
            active_terminals = $state.active_terminals.Count
            running_heartbeats = $state.heartbeat_instances.Count
            state_file = $script:StateFile
            last_updated = $state.last_updated
            terminals = @()
        }
        
        foreach ($terminalId in $state.active_terminals.Keys) {
            $terminalInfo = $state.active_terminals[$terminalId]
            $processAlive = Test-ProcessAlive $terminalInfo.process_id
            
            $status.terminals += @{
                terminal_id = $terminalId
                process_id = $terminalInfo.process_id
                process_alive = $processAlive
                heartbeat_active = $terminalInfo.heartbeat_active
                started_at = $terminalInfo.started_at
                last_heartbeat = $terminalInfo.last_heartbeat
            }
        }
        
        return $status
    }
    catch {
        if ($Debug) {
            Write-Host "[TLM] Failed to get terminal status: $($_.Exception.Message)" -ForegroundColor Red
        }
        return @{ error = $_.Exception.Message }
    }
}

# Main execution logic
try {
    # Generate terminal ID if not provided
    if (-not $TerminalId) {
        $TerminalId = New-TerminalId
    }
    
    switch ($Action.ToLower()) {
        "start" {
            Write-Host "[TLM] Starting terminal lifecycle management for: $TerminalId" -ForegroundColor Green
            
            # Register terminal session
            $registered = Register-TerminalSession -TerminalId $TerminalId -ProcessId $PID
            
            if ($registered) {
                # Start heartbeat if this appears to be an agent terminal
                $heartbeatPath = Join-Path $PSScriptRoot "agent-heartbeat.ps1"
                if (Test-Path $heartbeatPath) {
                    $heartbeatStarted = Start-TerminalHeartbeat -TerminalId $TerminalId
                    
                    if ($heartbeatStarted) {
                        Write-Host "[TLM] Terminal management active with heartbeat: $TerminalId" -ForegroundColor Green
                    } else {
                        Write-Host "[TLM] Terminal management active without heartbeat: $TerminalId" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "[TLM] Terminal management active (heartbeat unavailable): $TerminalId" -ForegroundColor Yellow
                }
                
                # Return terminal ID for reference
                Write-Output $TerminalId
            } else {
                Write-Host "[TLM] Failed to start terminal management" -ForegroundColor Red
                exit 1
            }
        }
        
        "stop" {
            Write-Host "[TLM] Stopping terminal lifecycle management for: $TerminalId" -ForegroundColor Yellow
            $unregistered = Unregister-TerminalSession -TerminalId $TerminalId
            
            if ($unregistered) {
                Write-Host "[TLM] Terminal management stopped: $TerminalId" -ForegroundColor Green
            } else {
                Write-Host "[TLM] Failed to stop terminal management or session not found" -ForegroundColor Red
                exit 1
            }
        }
        
        "status" {
            $status = Get-TerminalStatus
            
            Write-Host "=== Terminal Lifecycle Manager Status ===" -ForegroundColor Green
            Write-Host "Active Terminals: $($status.active_terminals)" -ForegroundColor Cyan
            Write-Host "Running Heartbeats: $($status.running_heartbeats)" -ForegroundColor Cyan
            Write-Host "Last Updated: $($status.last_updated)" -ForegroundColor Cyan
            Write-Host ""
            
            foreach ($terminal in $status.terminals) {
                $color = if ($terminal.process_alive) { "Green" } else { "Red" }
                Write-Host "Terminal: $($terminal.terminal_id)" -ForegroundColor $color
                Write-Host "  PID: $($terminal.process_id) (Alive: $($terminal.process_alive))" -ForegroundColor White
                Write-Host "  Heartbeat: $($terminal.heartbeat_active)" -ForegroundColor White
                Write-Host "  Started: $($terminal.started_at)" -ForegroundColor Gray
                Write-Host ""
            }
        }
        
        "cleanup" {
            Write-Host "[TLM] Starting cleanup of orphaned resources..." -ForegroundColor Cyan
            $cleaned = Invoke-TerminalCleanup -Force:$Force
            
            if ($cleaned -ge 0) {
                Write-Host "[TLM] Cleanup completed: $cleaned resources cleaned" -ForegroundColor Green
            } else {
                Write-Host "[TLM] Cleanup failed" -ForegroundColor Red
                exit 1
            }
        }
        
        default {
            Write-Host "[TLM] Unknown action: $Action" -ForegroundColor Red
            Write-Host "Available actions: start, stop, status, cleanup" -ForegroundColor Yellow
            exit 1
        }
    }
}
catch {
    Write-Host "[TLM] Fatal error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
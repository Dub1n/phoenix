# Simple Terminal Heartbeat - Direct Command Execution
# Executes actual echo commands visible to agents
# No background runspaces - direct terminal output for agent detection

param(
    [int]$IntervalSeconds = 1,
    [switch]$Debug = $false,
    [int]$MaxHeartbeats = 300
)

# Set environment for agent detection
$env:CURSOR_AGENT_TERMINAL = "true"
$env:SAFE_TERMINAL_ENABLED = "true"

# Configuration
$heartbeatSymbols = @("*", "+", "x", "o")
$heartbeatCount = 0
$startTime = Get-Date

Write-Host "[Heartbeat] Starting simple heartbeat system..." -ForegroundColor Green
Write-Host "[Heartbeat] Interval: $IntervalSeconds seconds, Max: $MaxHeartbeats" -ForegroundColor Cyan
Write-Host "[Heartbeat] Symbols will appear directly in terminal for agent detection" -ForegroundColor Yellow
Write-Host ""

try {
    while ($heartbeatCount -lt $MaxHeartbeats) {
        $heartbeatCount++
        
        # Get symbol for this heartbeat
        $symbolIndex = ($heartbeatCount - 1) % $heartbeatSymbols.Count
        $symbol = $heartbeatSymbols[$symbolIndex]
        
        # Execute actual echo command - this is what agents will see
        if ($Debug) {
            Write-Host "[Heartbeat] Executing: echo $symbol" -ForegroundColor Gray
        }
        
        # This creates the actual command execution pattern agents need to see
        Invoke-Expression "echo $symbol"
        
        if ($Debug) {
            $elapsed = ((Get-Date) - $startTime).TotalSeconds
            Write-Host "[Heartbeat] #$heartbeatCount completed ($([math]::Round($elapsed, 1))s)" -ForegroundColor Green
        }
        
        # Wait for next heartbeat
        Start-Sleep -Seconds $IntervalSeconds
    }
    
    Write-Host ""
    Write-Host "[Heartbeat] Heartbeat system completed after $heartbeatCount heartbeats" -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "[Heartbeat] ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Write-Host "[Heartbeat] Heartbeat system stopped" -ForegroundColor Yellow
}
# Test Full Heartbeat Integration
# Replicates exactly what cursor-terminal-init.ps1 does with Start-Process

Write-Host "=== Testing Full Heartbeat Integration ===" -ForegroundColor Green
Write-Host "This test replicates the cursor-terminal-init.ps1 -> agent-heartbeat.ps1 flow" -ForegroundColor Cyan
Write-Host ""

# Set up environment like cursor-terminal-init does
$env:CURSOR_AGENT_TERMINAL = "true"
$env:SAFE_TERMINAL_ENABLED = "true"

# Get the project root (go up from testing/ to repo root)
$scriptPath = $PSScriptRoot
$projectRoot = Split-Path (Split-Path (Split-Path $scriptPath -Parent) -Parent) -Parent

Write-Host "Project root: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Test: Direct heartbeat path resolution (like cursor-terminal-init does)
$heartbeatPath = Join-Path $projectRoot "scripts\terminal-completer\core\agent-heartbeat.ps1"
Write-Host "Heartbeat script path: $heartbeatPath" -ForegroundColor Gray

if (-not (Test-Path $heartbeatPath)) {
    Write-Host "ERROR: Heartbeat script not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Heartbeat script found" -ForegroundColor Green
Write-Host ""

# Test: Replicate exact Start-Process call from cursor-terminal-init
Write-Host "Starting heartbeat using exact cursor-terminal-init method..." -ForegroundColor Yellow

$processArgs = "-ExecutionPolicy Bypass -File `"$heartbeatPath`" -Background -Debug"
Write-Host "Process arguments: $processArgs" -ForegroundColor Gray

Write-Host ""
Write-Host "Launching background heartbeat process..." -ForegroundColor Green
Write-Host "You should see heartbeat symbols appearing below within a few seconds:" -ForegroundColor Cyan
Write-Host ""

try {
    # This is the exact call that cursor-terminal-init.ps1 makes
    Start-Process powershell -ArgumentList $processArgs -NoNewWindow
    
    Write-Host "Background process started successfully" -ForegroundColor Green
    Write-Host "Waiting 10 seconds to observe heartbeat output..." -ForegroundColor Cyan
    Write-Host ""
    
    # Wait and observe
    for ($i = 1; $i -le 10; $i++) {
        Write-Host "Observing... $i/10 seconds" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
    
    Write-Host ""
    Write-Host "Observation period complete" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR starting background process: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Full Integration Test Completed ===" -ForegroundColor Green
Write-Host ""
Write-Host "EXPECTED RESULTS:" -ForegroundColor Yellow
Write-Host "- Background heartbeat process started without blocking" -ForegroundColor Cyan
Write-Host "- Heartbeat symbols should have appeared during observation" -ForegroundColor Cyan
Write-Host "- Each symbol should appear roughly every second" -ForegroundColor Cyan
Write-Host "- Process should continue running in background after this script ends" -ForegroundColor Cyan
Write-Host ""
Write-Host "TROUBLESHOOTING:" -ForegroundColor Yellow
Write-Host "- If no symbols appeared: Background process may not be outputting to this terminal" -ForegroundColor Red
Write-Host "- If process did not start: Check PowerShell execution policy or script permissions" -ForegroundColor Red
Write-Host "- If symbols appeared: SUCCESS! The integration is working correctly" -ForegroundColor Green
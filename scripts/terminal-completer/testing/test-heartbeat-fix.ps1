# Test Heartbeat Fix - Validate Visible Output
# This script tests the fixed heartbeat system to ensure it's visible in the agent terminal

Write-Host "=== Testing Fixed Agent Terminal Heartbeat ===" -ForegroundColor Green
Write-Host "This test validates that the heartbeat appears in the terminal" -ForegroundColor Cyan
Write-Host ""

# Load the fixed agent terminal script
$agentScriptPath = Join-Path $PSScriptRoot "..\integration\agent-terminal-init.ps1"

if (-not (Test-Path $agentScriptPath)) {
    Write-Host "ERROR: Agent terminal script not found at: $agentScriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "Loading agent terminal script..." -ForegroundColor Yellow
try {
    # Source the script to load the heartbeat functions
    . $agentScriptPath
    
    Write-Host "`nHEARTBEAT TEST:" -ForegroundColor Green
    Write-Host "You should see [Agent ●] timestamp updates every 2 seconds" -ForegroundColor Cyan
    Write-Host "If you see these updates, the heartbeat fix is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Watch for 10 seconds then press Ctrl+C to stop..." -ForegroundColor Yellow
    Write-Host ""
    
    # Wait 10 seconds to observe heartbeat
    Start-Sleep -Seconds 10
    
    Write-Host "`n`nTest completed!" -ForegroundColor Green
    Write-Host "If you saw [Agent ●] updates, the heartbeat is fixed!" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR loading agent terminal script: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Stop heartbeat if it was started
    if (Get-Command Stop-OptimizedHeartbeat -ErrorAction SilentlyContinue) {
        Stop-OptimizedHeartbeat
    }
}

Write-Host "`nHeartbeat test completed!" -ForegroundColor Cyan

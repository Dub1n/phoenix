# Simple Integration Test
# Tests the complete cursor-terminal-init -> agent-heartbeat flow

Write-Host "=== Simple Integration Test ===" -ForegroundColor Green
Write-Host ""

# Set environment
$env:CURSOR_AGENT_TERMINAL = "true"
$env:SAFE_TERMINAL_ENABLED = "true"

# Get heartbeat path
$scriptPath = $PSScriptRoot
$projectRoot = Split-Path (Split-Path (Split-Path $scriptPath -Parent) -Parent) -Parent
$heartbeatPath = Join-Path $projectRoot "scripts\terminal-completer\core\agent-heartbeat.ps1"

Write-Host "Testing heartbeat path: $heartbeatPath" -ForegroundColor Cyan

if (-not (Test-Path $heartbeatPath)) {
    Write-Host "ERROR: Heartbeat script not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Heartbeat script found" -ForegroundColor Green
Write-Host ""

# Test the exact integration
Write-Host "Starting background heartbeat process..." -ForegroundColor Yellow

$processArgs = "-ExecutionPolicy Bypass -File `"$heartbeatPath`" -Background -Debug"
Write-Host "Arguments: $processArgs" -ForegroundColor Gray

try {
    Start-Process powershell -ArgumentList $processArgs -NoNewWindow
    Write-Host "Process started successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting 8 seconds for heartbeat symbols to appear..." -ForegroundColor Cyan
    
    for ($i = 1; $i -le 8; $i++) {
        Write-Host "Waiting... $i/8 seconds" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
    
    Write-Host ""
    Write-Host "Test completed" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Check above for heartbeat symbols: *, +, x, o" -ForegroundColor Yellow
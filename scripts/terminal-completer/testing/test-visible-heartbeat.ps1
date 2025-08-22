# Test Visible Heartbeat Implementation
# Verifies that heartbeat symbols are actually visible in terminal
# and that agents can see command completion

Write-Host "=== Testing Visible Heartbeat System ===" -ForegroundColor Green
Write-Host "This test verifies actual command execution and symbol visibility" -ForegroundColor Cyan
Write-Host ""

# Set environment variables to simulate agent terminal
$env:CURSOR_AGENT_TERMINAL = "true"
$env:SAFE_TERMINAL_ENABLED = "true"

# Get the heartbeat script path
$heartbeatPath = Join-Path $PSScriptRoot "..\core\agent-heartbeat.ps1"

if (-not (Test-Path $heartbeatPath)) {
    Write-Host "ERROR: Heartbeat script not found at: $heartbeatPath" -ForegroundColor Red
    exit 1
}

Write-Host "Testing heartbeat script: $heartbeatPath" -ForegroundColor Yellow
Write-Host ""

# Test 1: Direct heartbeat function test
Write-Host "Test 1: Direct Heartbeat Function Test" -ForegroundColor Yellow
Write-Host "This should show actual echo commands being executed:" -ForegroundColor Cyan

try {
    # Load the script to test functions directly
    . $heartbeatPath -Test -Debug
    
    Write-Host "Functions loaded successfully" -ForegroundColor Green
} catch {
    Write-Host "ERROR loading heartbeat script: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Manual heartbeat execution
Write-Host "Test 2: Manual Heartbeat Symbol Execution" -ForegroundColor Yellow
Write-Host "Watch for actual echo commands in terminal:" -ForegroundColor Cyan

$testSymbols = @("*", "+", "x", "o")

foreach ($symbol in $testSymbols) {
    Write-Host "Executing: echo $symbol" -ForegroundColor White
    
    # Execute the same way the heartbeat does it
    Invoke-Expression "echo $symbol"
    
    Write-Host "  ^ That symbol should be visible above this line" -ForegroundColor Gray
    Start-Sleep -Seconds 1
}

Write-Host ""

# Test 3: Background heartbeat brief test
Write-Host "Test 3: Background Heartbeat Brief Test (10 seconds)" -ForegroundColor Yellow
Write-Host "Starting background heartbeat - watch for symbols appearing every second:" -ForegroundColor Cyan

try {
    # Start the actual heartbeat script in background mode
    $heartbeatJob = Start-Job -ScriptBlock {
        param($heartbeatPath)
        & powershell -ExecutionPolicy Bypass -File $heartbeatPath -Debug -IntervalSeconds 1
    } -ArgumentList $heartbeatPath
    
    Write-Host "Background heartbeat job started (ID: $($heartbeatJob.Id))" -ForegroundColor Green
    Write-Host "Waiting 10 seconds - you should see heartbeat symbols appearing..." -ForegroundColor Cyan
    
    # Wait and show progress
    for ($i = 1; $i -le 10; $i++) {
        Write-Host "  Waiting... $i/10 seconds" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
    
    # Stop the background job
    Stop-Job $heartbeatJob -ErrorAction SilentlyContinue
    Remove-Job $heartbeatJob -Force -ErrorAction SilentlyContinue
    
    Write-Host "Background heartbeat test completed" -ForegroundColor Green
} catch {
    Write-Host "ERROR in background test: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Agent detection simulation
Write-Host "Test 4: Agent Command Detection Simulation" -ForegroundColor Yellow
Write-Host "Simulating agent command detection patterns:" -ForegroundColor Cyan

$testCommands = @(
    "echo # heartbeat-test",
    "Get-Date | Out-Null",
    "echo + ready"
)

foreach ($cmd in $testCommands) {
    Write-Host "Agent would see: PS> $cmd" -ForegroundColor White
    Invoke-Expression $cmd
    Write-Host "Command completed with prompt return" -ForegroundColor Gray
    Write-Host ""
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "=== Visible Heartbeat Test Completed ===" -ForegroundColor Green
Write-Host ""
Write-Host "VERIFICATION CHECKLIST:" -ForegroundColor Yellow
Write-Host "[CHECK] Did you see actual symbols (*,+,x,o) appear in the terminal above?" -ForegroundColor Cyan
Write-Host "[CHECK] Did each symbol appear on its own line with command completion?" -ForegroundColor Cyan
Write-Host "[CHECK] Did the background test show heartbeat symbols every second?" -ForegroundColor Cyan
Write-Host "[CHECK] Were the command patterns visible with PS> prompts?" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you answered YES to all, the heartbeat visibility is working correctly!" -ForegroundColor Green
Write-Host "If you answered NO to any, there are still issues with command execution." -ForegroundColor Red
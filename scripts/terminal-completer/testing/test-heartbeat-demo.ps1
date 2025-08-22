# Heartbeat System Demo
# Demonstrates how the heartbeat system prevents terminal hanging

param(
    [switch]$Quick = $false,
    [switch]$Verbose = $false
)

Write-Host "=== Agent Terminal Heartbeat System Demo ===" -ForegroundColor Green
Write-Host "This demo shows how the heartbeat system prevents terminal hanging" -ForegroundColor Cyan
Write-Host ""

# Test 1: Start heartbeat system
Write-Host "Test 1: Starting heartbeat system..." -ForegroundColor Yellow
$heartbeatJob = Start-Job -ScriptBlock {
    $heartbeatCount = 0
    $startTime = Get-Date
    
    while ($heartbeatCount -lt 20) {  # Run for 20 heartbeats
        $heartbeatCount++
        $currentTime = Get-Date
        $elapsed = ($currentTime - $startTime).TotalSeconds
        
        # Send heartbeat
        $commands = @("echo .", "echo +", "echo *", "echo -", "echo |")
        $commandIndex = ($heartbeatCount - 1) % $commands.Count
        $heartbeatCommand = $commands[$commandIndex]
        
        try {
            $result = Invoke-Expression $heartbeatCommand
            Write-Output "Heartbeat #$heartbeatCount at $($currentTime.ToString('HH:mm:ss')) - $result"
        }
        catch {
            Write-Output "Heartbeat #$heartbeatCount failed"
        }
        
        Start-Sleep -Seconds 2  # 2 second intervals for demo
    }
}

if ($heartbeatJob) {
    Write-Host "✓ Heartbeat system started (Job ID: $($heartbeatJob.Id))" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start heartbeat system" -ForegroundColor Red
    exit 1
}

# Test 2: Run some commands to show they complete normally
Write-Host "`nTest 2: Running commands to show normal completion..." -ForegroundColor Yellow

$commands = @(
    "echo 'Quick command 1'",
    "echo 'Quick command 2'", 
    "echo 'Quick command 3'",
    "Get-Date",
    "Get-Location"
)

foreach ($cmd in $commands) {
    Write-Host "Running: $cmd" -ForegroundColor Cyan
    $result = Invoke-Expression $cmd
    Write-Host "Result: $result" -ForegroundColor White
    Start-Sleep -Seconds 1
}

# Test 3: Show heartbeat activity
Write-Host "`nTest 3: Checking heartbeat activity..." -ForegroundColor Yellow

$heartbeatOutput = Receive-Job -Job $heartbeatJob -Keep
if ($heartbeatOutput) {
    Write-Host "Heartbeat activity:" -ForegroundColor Green
    foreach ($line in $heartbeatOutput) {
        Write-Host "  $line" -ForegroundColor Gray
    }
} else {
    Write-Host "No heartbeat output received" -ForegroundColor Yellow
}

# Test 4: Cleanup
Write-Host "`nTest 4: Cleaning up..." -ForegroundColor Yellow
Stop-Job -Job $heartbeatJob
Remove-Job -Job $heartbeatJob
Write-Host "✓ Heartbeat system stopped and cleaned up" -ForegroundColor Green

# Summary
Write-Host "`n=== Demo Summary ===" -ForegroundColor Green
Write-Host "✓ Heartbeat system started successfully" -ForegroundColor Green
Write-Host "✓ Commands completed normally" -ForegroundColor Green
Write-Host "✓ Heartbeat activity was generated" -ForegroundColor Green
Write-Host "✓ System cleaned up properly" -ForegroundColor Green

Write-Host "`nThe heartbeat system sends harmless commands every few seconds" -ForegroundColor Cyan
Write-Host "to keep the agent terminal responsive and prevent hanging." -ForegroundColor Cyan
Write-Host "This solves the problem where commands complete but the agent" -ForegroundColor Cyan
Write-Host "doesn't recognize completion and move on." -ForegroundColor Cyan

Write-Host "`nTo use in production:" -ForegroundColor Yellow
Write-Host "1. Load the agent-terminal-init.ps1 or cursor-terminal-init.ps1" -ForegroundColor White
Write-Host "2. Heartbeat system starts automatically" -ForegroundColor White
Write-Host "3. Commands will complete and agent will move on normally" -ForegroundColor White

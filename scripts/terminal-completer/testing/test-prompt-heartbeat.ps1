# Simple Prompt Heartbeat Test
# Tests if we can show heartbeat in PowerShell prompt

Write-Host "=== Testing Prompt-Integrated Heartbeat ===" -ForegroundColor Green
Write-Host "This test shows heartbeat directly in the PowerShell prompt" -ForegroundColor Cyan
Write-Host ""

# Initialize heartbeat variables
$global:heartbeatCount = 0
$global:heartbeatSymbols = @("●", "○", "◐", "◑")
$global:lastHeartbeatUpdate = Get-Date

# Override prompt function
function global:prompt {
    $symbol = $global:heartbeatSymbols[$global:heartbeatCount % $global:heartbeatSymbols.Length]
    $timestamp = Get-Date -Format 'HH:mm:ss'
    
    # Update heartbeat every 2 seconds
    if ((Get-Date) - $global:lastHeartbeatUpdate).TotalSeconds -ge 2) {
        $global:heartbeatCount++
        $global:lastHeartbeatUpdate = Get-Date
    }
    
    # Show heartbeat in prompt
    Write-Host "[Agent $symbol] $timestamp" -ForegroundColor Green -NoNewline
    return " PS $($executionContext.SessionState.Path.CurrentLocation)> "
}

Write-Host "Prompt heartbeat is now active!" -ForegroundColor Green
Write-Host "You should see: [Agent ●] timestamp PS path> in every prompt" -ForegroundColor Yellow
Write-Host "Try running some commands to see the heartbeat in action:" -ForegroundColor Cyan
Write-Host "  Get-Date" -ForegroundColor White
Write-Host "  ls" -ForegroundColor White
Write-Host "  echo 'test'" -ForegroundColor White
Write-Host ""
Write-Host "The heartbeat symbol will change every 2 seconds!" -ForegroundColor Green

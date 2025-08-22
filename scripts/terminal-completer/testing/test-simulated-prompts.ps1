# Simulated Prompt Cycling Test
# Creates the visual appearance of PowerShell prompts cycling without SendKeys

Write-Host "=== Testing Simulated Prompt Cycling ===" -ForegroundColor Green
Write-Host "This simulates the appearance of commands completing and prompts appearing" -ForegroundColor Cyan
Write-Host ""

function Simulate-CommandExecution {
    param([string]$Command, [string]$Output = "")
    
    $currentPath = Get-Location
    
    # Show the command being executed (simulates what agent would see)
    Write-Host "PS $currentPath> $Command" -ForegroundColor White
    
    # Show any output
    if ($Output) {
        Write-Host $Output -ForegroundColor Gray
    }
    
    # Small delay to simulate command execution
    Start-Sleep -Milliseconds 300
    
    # Show new prompt (this is what agents need to see to know terminal is ready)
    Write-Host "PS $currentPath> " -ForegroundColor White -NoNewline
    
    # Brief pause to let agents detect the prompt
    Start-Sleep -Milliseconds 500
    
    # Clear the partial prompt line for next simulation
    Write-Host ""
}

Write-Host "Starting simulated prompt cycling..." -ForegroundColor Yellow
Write-Host "Agents should see: PS> command, output, PS> ready pattern" -ForegroundColor Cyan
Write-Host ""

# Simulate a series of command completions
Simulate-CommandExecution "echo # heartbeat active" "# heartbeat active"
Simulate-CommandExecution "Get-Date | Format-Table" ""
Simulate-CommandExecution "echo # terminal ready" "# terminal ready"
Simulate-CommandExecution "Write-Host 'Agent detection test'" "Agent detection test"
Simulate-CommandExecution "echo # session active" "# session active"

Write-Host ""
Write-Host "Simulated prompt cycling complete!" -ForegroundColor Green
Write-Host "Did this create the pattern agents need to see?" -ForegroundColor Cyan

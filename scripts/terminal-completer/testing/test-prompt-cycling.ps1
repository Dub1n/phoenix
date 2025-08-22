# Test Prompt Cycling for Agents
# Shows actual terminal prompts appearing to simulate activity

Write-Host "=== Testing Prompt Cycling for Agent Detection ===" -ForegroundColor Green
Write-Host "This creates the pattern agents need to see: command -> prompt -> command -> prompt" -ForegroundColor Cyan
Write-Host ""

# Simple commands that complete instantly and show prompts
$simpleCommands = @(
    '$null',  # Does nothing but completes
    'Write-Output "heartbeat"',
    '$env:COMPUTERNAME | Out-Null',  # Quick command that does nothing visible
    '[System.DateTime]::Now | Out-Null'  # Another quick command
)

Write-Host "Starting prompt cycling test..." -ForegroundColor Yellow
Write-Host "Agents should see: PS> command, then PS> again, repeatedly" -ForegroundColor Cyan
Write-Host ""

for ($i = 0; $i -lt 5; $i++) {
    $cmd = $simpleCommands[$i % $simpleCommands.Length]
    
    # Execute the command - this should show completion and new prompt
    Write-Host "Executing: $cmd" -ForegroundColor Gray
    Invoke-Expression $cmd
    
    # Small delay to let agents detect the completion
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Prompt cycling complete. Did agents see PS> prompts appearing?" -ForegroundColor Green

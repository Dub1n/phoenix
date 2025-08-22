# Persistent Terminal Heartbeat Test
# This creates ongoing terminal activity that agents can observe

Write-Host "=== Starting Persistent Terminal Heartbeat Test ===" -ForegroundColor Green
Write-Host "This will show ongoing terminal activity that agents can detect" -ForegroundColor Cyan
Write-Host ""

# Load the agent terminal system
. "$PSScriptRoot\..\integration\agent-terminal-init.ps1"

Write-Host ""
Write-Host "Now running continuous commands to show terminal activity..." -ForegroundColor Yellow
Write-Host "Agents should see regular prompt cycling with command completion" -ForegroundColor Cyan
Write-Host ""

# Run a series of simple commands with delays to simulate activity
$commands = @(
    "echo # Heartbeat active",
    "Get-Date -Format 'HH:mm:ss'",
    "echo # Terminal responsive", 
    "Write-Host '# Agent can see this' -ForegroundColor Green",
    "echo # Ready for commands"
)

for ($i = 0; $i -lt 10; $i++) {
    $cmd = $commands[$i % $commands.Length]
    
    Write-Host "PS> $cmd" -ForegroundColor White
    Invoke-Expression $cmd
    Write-Host ""
    Start-Sleep -Seconds 2
}

Write-Host "Heartbeat test completed. Agent should have seen regular terminal activity." -ForegroundColor Green

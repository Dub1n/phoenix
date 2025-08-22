# Quick heartbeat starter - kills existing processes and starts fresh
Write-Host "Killing existing heartbeat processes..." -ForegroundColor Yellow

# Kill any existing PowerShell jobs that might be running heartbeat
Get-Job | Where-Object { $_.Name -like "*heartbeat*" -or $_.State -eq "Running" } | Stop-Job -PassThru | Remove-Job

# Kill any hanging PowerShell processes
Get-Process | Where-Object { $_.ProcessName -eq "powershell" -and $_.Id -ne $PID } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Starting fresh agent terminal init..." -ForegroundColor Green
Write-Host "This will load the heartbeat system. Press Ctrl+C when done testing." -ForegroundColor Cyan

# Load the agent terminal init script
. "$PSScriptRoot\..\integration\agent-terminal-init.ps1"

# Quick Kill Script for Hanging Terminal Processes
# Use this when terminal calls are hanging

Write-Host "Killing hanging processes..."

# Kill common hanging processes
$processes = @("node.exe", "npm.cmd", "tsc.exe", "jest.exe")

foreach ($process in $processes) {
    $running = Get-Process -Name $process -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host "Killing $process processes..."
        Stop-Process -Name $process -Force -ErrorAction SilentlyContinue
    }
}

# Kill any PowerShell jobs that might be hanging
Get-Job | Where-Object {$_.State -eq "Running"} | Stop-Job

Write-Host "Hanging processes terminated."
Write-Host "You can now continue with your work." 
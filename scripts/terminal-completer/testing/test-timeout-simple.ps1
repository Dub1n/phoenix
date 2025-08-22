# Simple timeout test script
param(
    [string]$Command = "echo 'test'",
    [int]$TimeoutMs = 5000
)

Write-Host "Testing timeout functionality with $TimeoutMs ms timeout" -ForegroundColor Green
Write-Host "Command: $Command" -ForegroundColor Cyan

# Start process with timeout
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "powershell.exe"
$processInfo.Arguments = "-Command", $Command
$processInfo.UseShellExecute = $false
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
$process.Start() | Out-Null

Write-Host "Process started with PID: $($process.Id)" -ForegroundColor Green

# Wait for completion with timeout
$startTime = Get-Date
if ($process.WaitForExit($TimeoutMs)) {
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    $output = $process.StandardOutput.ReadToEnd()
    $errOutput = $process.StandardError.ReadToEnd()
    
    Write-Host "Command completed in $([math]::Round($duration, 1))s" -ForegroundColor Green
    Write-Host "Output: $output"
    if ($errOutput) { Write-Host "Error: $errOutput" -ForegroundColor Red }
    Write-Host "Exit code: $($process.ExitCode)"
} else {
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "Timeout reached after $([math]::Round($duration, 1))s - killing process" -ForegroundColor Yellow
    $process.Kill()
    Write-Host "Process killed successfully" -ForegroundColor Green
}

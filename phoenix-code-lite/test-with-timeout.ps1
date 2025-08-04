# PowerShell script to run Jest tests with hard timeout
param(
    [string]$TestPattern = "",
    [string]$TestName = "",
    [int]$TimeoutSeconds = 30
)

Write-Host "Running Jest tests with $TimeoutSeconds second timeout..." -ForegroundColor Yellow

# Build the Jest command
$jestCmd = "npm test --"
if ($TestPattern) { $jestCmd += " --testPathPatterns=$TestPattern" }
if ($TestName) { $jestCmd += " --testNamePattern=`"$TestName`"" }
$jestCmd += " --detectOpenHandles --forceExit --runInBand"

Write-Host "Command: $jestCmd" -ForegroundColor Cyan

# Start the process
$process = Start-Process -FilePath "powershell" -ArgumentList "-Command", $jestCmd -PassThru -NoNewWindow

# Wait with timeout
$completed = $process.WaitForExit($TimeoutSeconds * 1000)

if (-not $completed) {
    Write-Host "Test timed out after $TimeoutSeconds seconds. Killing process..." -ForegroundColor Red
    
    # Kill the main process and any child processes
    try {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        
        # Also kill any node processes that might be hanging
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        
        Write-Host "Process terminated" -ForegroundColor Red
        exit 1
    }
    catch {
        Write-Host "Error killing process: $_" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Test completed within timeout" -ForegroundColor Green
    exit $process.ExitCode
}
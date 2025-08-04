# Helper script to run CLI tests with timeout to prevent hanging
param(
    [string]$TestName = "",
    [int]$TimeoutSeconds = 25
)

Write-Host "Running CLI test with $TimeoutSeconds second timeout..." -ForegroundColor Yellow

# Build the Jest command for CLI interactive tests
$jestCmd = "npm test -- --testPathPatterns=cli-interactive.test.ts --detectOpenHandles --forceExit"
if ($TestName) { 
    $jestCmd += " --testNamePattern=`"$TestName`"" 
}

Write-Host "Command: $jestCmd" -ForegroundColor Cyan

# Run with PowerShell job timeout to prevent hanging
$currentDir = Get-Location
$job = Start-Job -ScriptBlock { 
    param($cmd, $dir)
    Set-Location $dir
    Invoke-Expression $cmd 
} -ArgumentList $jestCmd, $currentDir

$completed = Wait-Job $job -Timeout $TimeoutSeconds

if ($completed) {
    Write-Host "Test completed successfully" -ForegroundColor Green
    Receive-Job $job
    $exitCode = 0
} else {
    Write-Host "Test timed out after $TimeoutSeconds seconds" -ForegroundColor Red
    $exitCode = 1
}

Remove-Job $job -Force
exit $exitCode
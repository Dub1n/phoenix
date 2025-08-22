# Test Background Runspace Output Visibility
# Tests whether background PowerShell runspaces can output to parent terminal

Write-Host "=== Testing Background Runspace Output Visibility ===" -ForegroundColor Green
Write-Host ""

# Test 1: Simple background output test
Write-Host "Test 1: Simple Background Output" -ForegroundColor Yellow
Write-Host "Starting runspace that should output symbols to this terminal..." -ForegroundColor Cyan

try {
    # Create runspace for background execution
    $runspace = [runspacefactory]::CreateRunspace()
    $runspace.Open()
    
    # Define simple output script
    $outputScript = {
        param($symbols)
        
        for ($i = 0; $i -lt $symbols.Count; $i++) {
            Write-Output $symbols[$i]
            Start-Sleep -Seconds 1
        }
    }
    
    # Create PowerShell command in runspace
    $powershell = [powershell]::Create()
    $powershell.Runspace = $runspace
    $powershell.AddScript($outputScript).AddArgument(@("*", "+", "x", "o"))
    
    # Start background execution
    $job = $powershell.BeginInvoke()
    
    Write-Host "Background runspace started - waiting 5 seconds for output..." -ForegroundColor Green
    Write-Host "You should see symbols appearing below:" -ForegroundColor Cyan
    Write-Host ""
    
    # Wait for completion or timeout
    $timeout = 5
    $elapsed = 0
    while (-not $job.IsCompleted -and $elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++
        Write-Host "Waiting... $elapsed/$timeout seconds" -ForegroundColor Gray
    }
    
    # Get results
    try {
        $results = $powershell.EndInvoke($job)
        Write-Host ""
        Write-Host "Runspace completed. Results received:" -ForegroundColor Green
        foreach ($result in $results) {
            Write-Host "  Result: $result" -ForegroundColor White
        }
    } catch {
        Write-Host "Error getting results: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Cleanup
    $powershell.Dispose()
    $runspace.Close()
    $runspace.Dispose()
    
} catch {
    Write-Host "ERROR in background test: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Background Job output test
Write-Host "Test 2: Background Job Output" -ForegroundColor Yellow
Write-Host "Starting PowerShell job that should output symbols..." -ForegroundColor Cyan

try {
    $jobScript = {
        $symbols = @("!", "@", "#", "$")
        foreach ($symbol in $symbols) {
            Write-Output "Job output: $symbol"
            Start-Sleep -Seconds 1
        }
    }
    
    $job = Start-Job -ScriptBlock $jobScript
    
    Write-Host "Job started (ID: $($job.Id)) - waiting for completion..." -ForegroundColor Green
    
    # Wait for job completion
    $job | Wait-Job -Timeout 10 | Out-Null
    
    # Receive job output
    $jobOutput = Receive-Job $job
    Remove-Job $job
    
    Write-Host "Job completed. Output received:" -ForegroundColor Green
    foreach ($line in $jobOutput) {
        Write-Host "  $line" -ForegroundColor White
    }
    
} catch {
    Write-Host "ERROR in job test: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Direct terminal command simulation
Write-Host "Test 3: Direct Terminal Command Simulation" -ForegroundColor Yellow
Write-Host "This simulates what agents should see - actual command execution:" -ForegroundColor Cyan

$heartbeatCommands = @(
    "echo *",
    "echo +", 
    "echo x",
    "echo o"
)

foreach ($cmd in $heartbeatCommands) {
    Write-Host "PS> $cmd" -ForegroundColor DarkGray
    Invoke-Expression $cmd
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "=== Background Visibility Test Completed ===" -ForegroundColor Green
Write-Host ""
Write-Host "ANALYSIS:" -ForegroundColor Yellow
Write-Host "- Test 1 shows if runspace can output to parent terminal" -ForegroundColor Cyan
Write-Host "- Test 2 shows if jobs can output to parent terminal" -ForegroundColor Cyan  
Write-Host "- Test 3 shows the desired agent-visible command pattern" -ForegroundColor Cyan
Write-Host ""
Write-Host "For agent detection, the heartbeat should work like Test 3" -ForegroundColor Green
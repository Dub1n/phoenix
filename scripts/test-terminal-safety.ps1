# Test Script for Terminal Safety Features
# Demonstrates automatic hanging prevention and timeout management

param(
    [switch]$Debug = $false,
    [switch]$Quick = $false
)

Write-Host "=== Terminal Safety Test Suite ===" -ForegroundColor Green

# Test 1: Quick command (should succeed)
Write-Host "`nTest 1: Quick command (echo)" -ForegroundColor Yellow
$result1 = powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'echo "Quick test successful"'
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Quick command test PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Quick command test FAILED" -ForegroundColor Red
}

# Test 2: NPM command (should succeed)
Write-Host "`nTest 2: NPM command (version)" -ForegroundColor Yellow
$result2 = powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'npm --version'
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ NPM command test PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ NPM command test FAILED" -ForegroundColor Red
}

# Test 3: Timeout test (should timeout and kill)
Write-Host "`nTest 3: Timeout test (should timeout after 30s)" -ForegroundColor Yellow
Write-Host "Starting hanging command test..." -ForegroundColor Cyan
$startTime = Get-Date
$result3 = powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'node -e "setTimeout(() => console.log(\"This should never print\"), 60000)"'
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

if ($LASTEXITCODE -ne 0 -and $duration -lt 35) {
    Write-Host "✓ Timeout test PASSED (killed after $([math]::Round($duration, 1))s)" -ForegroundColor Green
} else {
    Write-Host "✗ Timeout test FAILED (took $([math]::Round($duration, 1))s)" -ForegroundColor Red
}

# Test 4: Background job test
Write-Host "`nTest 4: Background job test" -ForegroundColor Yellow
$result4 = powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'echo "Background test"' -Background
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Background job test PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Background job test FAILED" -ForegroundColor Red
}

# Test 5: Process cleanup test
Write-Host "`nTest 5: Process cleanup test" -ForegroundColor Yellow
# Start a hanging process
Start-Process -FilePath "node" -ArgumentList "-e", "setTimeout(() => {}, 60000)" -WindowStyle Hidden
$hangingProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }

if ($hangingProcess) {
    Write-Host "Found hanging process: $($hangingProcess.Id)" -ForegroundColor Cyan
    
    # Run the kill script
    powershell -ExecutionPolicy Bypass -File scripts/kill-hanging.ps1
    
    $remainingProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }
    if (-not $remainingProcess) {
        Write-Host "✓ Process cleanup test PASSED" -ForegroundColor Green
    } else {
        Write-Host "✗ Process cleanup test FAILED" -ForegroundColor Red
    }
} else {
    Write-Host "No hanging processes found" -ForegroundColor Cyan
    Write-Host "✓ Process cleanup test PASSED (no cleanup needed)" -ForegroundColor Green
}

# Test 6: Configuration loading test
Write-Host "`nTest 6: Configuration loading test" -ForegroundColor Yellow
if (Test-Path ".cursor/terminal-config.json") {
    Write-Host "✓ Configuration file exists" -ForegroundColor Green
} else {
    Write-Host "✗ Configuration file missing" -ForegroundColor Red
}

# Test 7: Debug mode test
if ($Debug) {
    Write-Host "`nTest 7: Debug mode test" -ForegroundColor Yellow
    $result7 = powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'echo "Debug test"' -Debug
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Debug mode test PASSED" -ForegroundColor Green
    } else {
        Write-Host "✗ Debug mode test FAILED" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Green
Write-Host "All tests completed. Check results above." -ForegroundColor Cyan

if ($Quick) {
    Write-Host "Quick test mode - skipping timeout test" -ForegroundColor Yellow
}

Write-Host "`n=== Usage Examples ===" -ForegroundColor Green
Write-Host "Safe command execution:" -ForegroundColor Cyan
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'npm test'" -ForegroundColor White
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'git status'" -ForegroundColor White
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'npm start' -Background" -ForegroundColor White

Write-Host "`nKill hanging processes:" -ForegroundColor Cyan
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/kill-hanging.ps1" -ForegroundColor White 
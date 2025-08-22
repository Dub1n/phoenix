# Test Hanging Prevention with Debug Timeouts
# This script tests the terminal safety system with much shorter timeouts for faster testing

param(
    [switch]$Quick = $false,
    [switch]$Verbose = $false
)

Write-Host "=== Terminal Safety Hanging Prevention Test (Debug Mode) ===" -ForegroundColor Green
Write-Host "Testing with debug timeouts (5-10 seconds instead of 30-60 seconds)" -ForegroundColor Cyan
Write-Host ""

# Test 1: Quick command that should succeed
Write-Host "Test 1: Quick command (echo)" -ForegroundColor Yellow
$result1 = powershell -ExecutionPolicy Bypass -File "core\enhanced-terminal-manager.ps1" -Command 'echo "Quick test successful"' -Debug
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Quick command test PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Quick command test FAILED" -ForegroundColor Red
}

# Test 2: Command that should hang and be killed quickly (5 seconds)
Write-Host "`nTest 2: Hanging command test (should timeout in ~5 seconds)" -ForegroundColor Yellow
Write-Host "Starting hanging command test..." -ForegroundColor Cyan
$startTime = Get-Date

$result2 = powershell -ExecutionPolicy Bypass -File "core\enhanced-terminal-manager.ps1" -Command "node -e `"setTimeout(() => console.log('This should never print'), 60000)`"" -Debug

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

if ($LASTEXITCODE -ne 0 -and $duration -lt 8) {
    Write-Host "✓ Hanging prevention test PASSED (killed after $([math]::Round($duration, 1))s)" -ForegroundColor Green
} else {
    Write-Host "✗ Hanging prevention test FAILED (took $([math]::Round($duration, 1))s)" -ForegroundColor Red
}

# Test 3: Background job test
Write-Host "`nTest 3: Background job test" -ForegroundColor Yellow
$result3 = powershell -ExecutionPolicy Bypass -File "core\enhanced-terminal-manager.ps1" -Command 'echo "Background test"' -Background -Debug
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Background job test PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Background job test FAILED" -ForegroundColor Red
}

# Test 4: Enhanced monitoring test
Write-Host "`nTest 4: Enhanced monitoring test" -ForegroundColor Yellow
$result4 = powershell -ExecutionPolicy Bypass -File "core\enhanced-terminal-manager.ps1" -Command "node -e `"setTimeout(() => {}, 30000)`"" -EnhancedMonitoring -Debug
if ($LASTEXITCODE -ne 0) {
    Write-Host "✓ Enhanced monitoring test PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Enhanced monitoring test FAILED" -ForegroundColor Red
}

# Test 5: Process cleanup verification
Write-Host "`nTest 5: Process cleanup verification" -ForegroundColor Yellow
$hangingProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }
if ($hangingProcesses) {
    Write-Host "Found hanging processes, running cleanup..." -ForegroundColor Yellow
    powershell -ExecutionPolicy Bypass -File "core\kill-hanging.ps1"
    
    $remainingProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }
    if (-not $remainingProcesses) {
        Write-Host "✓ Process cleanup test PASSED" -ForegroundColor Green
    } else {
        Write-Host "✗ Process cleanup test FAILED" -ForegroundColor Red
    }
} else {
    Write-Host "✓ Process cleanup test PASSED (no cleanup needed)" -ForegroundColor Green
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Green
Write-Host "Debug timeout tests completed!" -ForegroundColor Cyan
Write-Host "All commands should now use much shorter timeouts (5-10 seconds) for faster testing." -ForegroundColor Yellow

Write-Host "`n=== Debug Mode Features ===" -ForegroundColor Green
Write-Host "• npm test: 5s timeout (instead of 60s)" -ForegroundColor White
Write-Host "• npm start: 3s timeout (instead of 30s)" -ForegroundColor White
Write-Host "• node commands: 3s timeout (instead of 30s)" -ForegroundColor White
Write-Host "• git commands: 2s timeout (instead of 15s)" -ForegroundColor White

Write-Host "`n=== Usage Examples ===" -ForegroundColor Green
Write-Host "Test hanging prevention:" -ForegroundColor Cyan
Write-Host "  powershell -ExecutionPolicy Bypass -File core\enhanced-terminal-manager.ps1 -Command 'npm test' -Debug" -ForegroundColor White
Write-Host "  powershell -ExecutionPolicy Bypass -File core\enhanced-terminal-manager.ps1 -Command `"node -e `"setTimeout(() => {}, 60000)`"`" -Debug" -ForegroundColor White

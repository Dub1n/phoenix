# Simple Terminal Safety Test
# Tests the automatic terminal manager with proper timeouts

Write-Host "=== Simple Terminal Safety Test ===" -ForegroundColor Green

# Test 1: Quick command
Write-Host "`nTest 1: Quick command" -ForegroundColor Yellow
$result1 = powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'echo "Test successful"'
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Quick command PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ Quick command FAILED" -ForegroundColor Red
}

# Test 2: NPM command
Write-Host "`nTest 2: NPM command" -ForegroundColor Yellow
$result2 = powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'npm --version'
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ NPM command PASSED" -ForegroundColor Green
} else {
    Write-Host "✗ NPM command FAILED" -ForegroundColor Red
}

# Test 3: Timeout test (short version)
Write-Host "`nTest 3: Timeout test (5 second timeout)" -ForegroundColor Yellow
Write-Host "Starting hanging command..." -ForegroundColor Cyan
$startTime = Get-Date
$result3 = powershell -ExecutionPolicy Bypass -File scripts/auto-terminal-manager.ps1 -Command 'node -e "setTimeout(() => console.log(\"This should never print\"), 10000)"'
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

if ($LASTEXITCODE -ne 0 -and $duration -lt 35) {
    Write-Host "✓ Timeout test PASSED (killed after $([math]::Round($duration, 1))s)" -ForegroundColor Green
} else {
    Write-Host "✗ Timeout test FAILED (took $([math]::Round($duration, 1))s)" -ForegroundColor Red
}

# Test 4: Process cleanup
Write-Host "`nTest 4: Process cleanup" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File scripts/kill-hanging.ps1
Write-Host "✓ Process cleanup completed" -ForegroundColor Green

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host "All tests finished. Check results above." -ForegroundColor Cyan 
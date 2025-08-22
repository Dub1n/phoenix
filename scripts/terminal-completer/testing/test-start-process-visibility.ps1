# Test Start-Process -NoNewWindow Visibility
# Tests if Start-Process with -NoNewWindow shows output in parent terminal

Write-Host "=== Testing Start-Process -NoNewWindow Output Visibility ===" -ForegroundColor Green
Write-Host ""

# Test 1: Simple Start-Process with echo commands
Write-Host "Test 1: Start-Process with Simple Echo Commands" -ForegroundColor Yellow
Write-Host "Starting process that should output symbols to this terminal..." -ForegroundColor Cyan

$testScript = @"
Write-Host 'Background process started' -ForegroundColor Green
echo 'Symbol: *'
Start-Sleep -Seconds 1
echo 'Symbol: +'
Start-Sleep -Seconds 1
echo 'Symbol: x'
Start-Sleep -Seconds 1
echo 'Symbol: o'
Write-Host 'Background process completed' -ForegroundColor Green
"@

$tempScript = [System.IO.Path]::GetTempFileName() + ".ps1"
$testScript | Out-File -FilePath $tempScript -Encoding UTF8

try {
    Write-Host "Starting background process with Start-Process -NoNewWindow..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$tempScript`"" -NoNewWindow -Wait
    Write-Host "Background process completed" -ForegroundColor Green
} finally {
    Remove-Item $tempScript -ErrorAction SilentlyContinue
}

Write-Host ""

# Test 2: Test without -Wait to see asynchronous behavior
Write-Host "Test 2: Start-Process without -Wait (Asynchronous)" -ForegroundColor Yellow
Write-Host "Starting async process - symbols should appear while this script continues..." -ForegroundColor Cyan

$testScript2 = @"
Start-Sleep -Seconds 1
echo 'Async: *'
Start-Sleep -Seconds 1
echo 'Async: +'
Start-Sleep -Seconds 1
echo 'Async: x'
Start-Sleep -Seconds 1
echo 'Async: o'
"@

$tempScript2 = [System.IO.Path]::GetTempFileName() + ".ps1"
$testScript2 | Out-File -FilePath $tempScript2 -Encoding UTF8

try {
    Write-Host "Starting async background process..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$tempScript2`"" -NoNewWindow
    
    Write-Host "Main script continues - waiting 6 seconds for async output..." -ForegroundColor Cyan
    for ($i = 1; $i -le 6; $i++) {
        Write-Host "  Main script waiting... $i/6 seconds" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
    
} finally {
    Remove-Item $tempScript2 -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "=== Start-Process Visibility Test Completed ===" -ForegroundColor Green
Write-Host ""
Write-Host "VERIFICATION:" -ForegroundColor Yellow
Write-Host "- Did you see 'Symbol: *', 'Symbol: +', etc. from Test 1?" -ForegroundColor Cyan
Write-Host "- Did you see 'Async: *', 'Async: +', etc. from Test 2?" -ForegroundColor Cyan
Write-Host ""
Write-Host "If YES: Start-Process -NoNewWindow works for output visibility" -ForegroundColor Green
Write-Host "If NO: We need a different approach for background visible output" -ForegroundColor Red
# QMS Environment Validation Script (PowerShell)
# Description: Validates all Phase 0 preparation requirements.
# Style: Refactored for robustness and maintainability.

# --- SCRIPT SETUP ---
Clear-Host
Write-Host "=== QMS Environment Validation ===" -ForegroundColor Green
Write-Host "Date: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Use a hashtable to store validation results for a clean summary
$results = @{
    pdftotext = @{ Found = $false; Message = "✗ pdftotext not found - will use Node.js alternatives" }
    pdfinfo   = @{ Found = $false; Message = "✗ pdfinfo not found - will use Node.js alternatives" }
    crypto    = @{ Found = $false; Message = "✗ Node.js crypto test failed" }
    node      = @{ Found = $false; Version = "Not Found" }
    npm       = @{ Found = $false; Version = "Not Found" }
    tsc       = @{ Found = $false; Version = "Not Found" }
    jest      = @{ Found = $false; Version = "Not Found" }
    qmsDocs   = @{ Found = $false; Message = "✗ VDL2/QMS/Docs directory not accessible" }
    en62304   = @{ Found = $false; Message = "✗ EN 62304 document not found" }
    aamiTIR45 = @{ Found = $false; Message = "✗ AAMI TIR45 document not found" }
    pclBuild  = @{ Found = $false; Message = "✗ Build failed" }
    pclTest   = @{ Found = $false; Message = "✗ Basic tests failed" }
    git       = @{ Found = $false; Message = "✗ Git not found" }
    vscode    = @{ Found = $false; Message = "✗ VS Code not found (optional)" }
    disk      = @{ Value = "Unknown" }
    memory    = @{ Value = "Unknown" }
}

# --- HELPER FUNCTIONS ---

# Helper to check for a command and log the result
function Test-CommandExists {
    param (
        [string]$CommandName,
        [string]$SuccessMessage,
        [string]$FailureMessage,
        [hashtable]$ResultStore
    )
    if (Get-Command $CommandName -ErrorAction SilentlyContinue) {
        $ResultStore.Found = $true
        $ResultStore.Message = $SuccessMessage
        Write-Host $SuccessMessage -ForegroundColor Green
    } else {
        Write-Host $FailureMessage -ForegroundColor Yellow
    }
}

# Helper to run an external command and check its exit code
function Invoke-AndTestCommand {
    param (
        [Parameter(Mandatory=$true)]
        [scriptblock]$Command,
        [string]$SuccessMessage,
        [string]$FailureMessage,
        [hashtable]$ResultStore
    )
    & $Command | Out-Null # Suppress stdout, but allow stderr
    if ($LASTEXITCODE -eq 0) {
        $ResultStore.Found = $true
        $ResultStore.Message = $SuccessMessage
        Write-Host $SuccessMessage -ForegroundColor Green
    } else {
        $ResultStore.Found = $false # Explicitly set failure
        $ResultStore.Message = $FailureMessage
        Write-Host $FailureMessage -ForegroundColor Red
    }
}


# --- VALIDATION STEPS ---

# 1. Check PDF processing tools
Write-Host "1. Checking PDF processing tools..." -ForegroundColor Cyan
Test-CommandExists -CommandName 'pdftotext' -SuccessMessage "OK pdftotext available" -FailureMessage "✗ pdftotext not found" -ResultStore $results.pdftotext
Test-CommandExists -CommandName 'pdfinfo' -SuccessMessage "OK pdfinfo available" -FailureMessage "✗ pdfinfo not found" -ResultStore $results.pdfinfo

# 2. Check cryptographic libraries
Write-Host "`n2. Checking cryptographic libraries..." -ForegroundColor Cyan
try {
    $hashOutput = node -e 'const crypto = require("crypto"); const testData = "QMS Audit Trail Test"; const hash = crypto.createHash("sha256").update(testData).digest("hex"); console.log(`Hash generation: SUCCESS\n  Hash: ${hash}`);'
    if ($LASTEXITCODE -eq 0 -and $hashOutput -like "*SUCCESS*") {
        Write-Host "OK Node.js crypto functions are available." -ForegroundColor Green
        Write-Host ($hashOutput -split "`n")[1] # Display only the hash line
        $results.crypto.Found = $true
        $results.crypto.Message = "OK Crypto available"
    } else {
        throw "Crypto test failed."
    }
} catch {
    Write-Host "✗ Node.js crypto test failed." -ForegroundColor Red
}

# 3. Validate Node.js, npm, TypeScript, Jest environments
Write-Host "`n3. Validating Node.js, TypeScript, and Jest..." -ForegroundColor Cyan
$results.node.Version = (node --version 2>$null)
if ($LASTEXITCODE -eq 0) { $results.node.Found = $true; Write-Host "OK node: $($results.node.Version)" -ForegroundColor Green } else { Write-Host "✗ node: Not Found" -ForegroundColor Red }

$results.npm.Version = (npm --version 2>$null)
if ($LASTEXITCODE -eq 0) { $results.npm.Found = $true; Write-Host "OK npm: $($results.npm.Version)" -ForegroundColor Green } else { Write-Host "✗ npm: Not Found" -ForegroundColor Red }

$results.tsc.Version = (npx tsc --version 2>$null)
if ($LASTEXITCODE -eq 0) { $results.tsc.Found = $true; Write-Host "OK tsc: $($results.tsc.Version)" -ForegroundColor Green } else { Write-Host "✗ tsc: Not Found" -ForegroundColor Red }

$results.jest.Version = (npx jest --version 2>$null)
if ($LASTEXITCODE -eq 0) { $results.jest.Found = $true; Write-Host "OK jest: $($results.jest.Version)" -ForegroundColor Green } else { Write-Host "✗ jest: Not Found" -ForegroundColor Red }

# 4. Check VDL2/QMS access
Write-Host "`n4. Checking VDL2/QMS document access..." -ForegroundColor Cyan
if (Test-Path "VDL2/QMS/Docs") {
    $results.qmsDocs.Found = $true
    $results.qmsDocs.Message = "OK VDL2/QMS/Docs directory accessible"
    Write-Host $results.qmsDocs.Message -ForegroundColor Green

    if (Test-Path "VDL2/QMS/Docs/EN 62304-2006+A1-2015 Medical device software.pdf") {
        $results.en62304.Found = $true; $results.en62304.Message = "OK EN 62304 document found"; Write-Host $results.en62304.Message -ForegroundColor Green
    } else { Write-Host $results.en62304.Message -ForegroundColor Red }

    if (Test-Path "VDL2/QMS/Docs/AAMI/AAMI TIR45-2023 Guidance on the use of AGILE practices in the development of medical device software.pdf") {
        $results.aamiTIR45.Found = $true; $results.aamiTIR45.Message = "OK AAMI TIR45 document found"; Write-Host $results.aamiTIR45.Message -ForegroundColor Green
    } else { Write-Host $results.aamiTIR45.Message -ForegroundColor Red }
} else {
    Write-Host $results.qmsDocs.Message -ForegroundColor Red
}

# 5. Validate Phoenix-Code-Lite functionality
Write-Host "`n5. Validating Phoenix-Code-Lite functionality..." -ForegroundColor Cyan
if (Test-Path "phoenix-code-lite") {
    Push-Location "phoenix-code-lite"
    Write-Host "  Testing build..." -ForegroundColor Yellow
    Invoke-AndTestCommand -Command { npm run build } -SuccessMessage "  OK Build successful" -FailureMessage " ✗ Build failed" -ResultStore $results.pclBuild
    
    Write-Host "  Testing basic functionality..." -ForegroundColor Yellow
    Invoke-AndTestCommand -Command { npm test -- --testNamePattern="environment" --passWithNoTests } -SuccessMessage "  OK Basic tests passing" -FailureMessage " ✗ Some tests failing" -ResultStore $results.pclTest
    
    Pop-Location
} else {
    Write-Host "✗ 'phoenix-code-lite' directory not found in current location." -ForegroundColor Red
}


# 6. Check development tools
Write-Host "`n6. Checking development tools..." -ForegroundColor Cyan
Test-CommandExists -CommandName 'git' -SuccessMessage "OK Git available" -FailureMessage "✗ Git not found" -ResultStore $results.git
Test-CommandExists -CommandName 'code' -SuccessMessage "OK VS Code available" -FailureMessage $results.vscode.Message -ResultStore $results.vscode

# 7. Check System Resources
Write-Host "`n7. Checking System Resources..." -ForegroundColor Cyan
try {
    $drive = Get-PSDrive C -ErrorAction Stop
    $freeSpace = [math]::Round($drive.Free / 1GB, 2)
    $results.disk.Value = "$freeSpace GB"
    Write-Host "Available disk space: $($results.disk.Value)" -ForegroundColor Green
} catch {
    Write-Host "Could not determine disk space." -ForegroundColor Yellow
}

$memory = Get-CimInstance -ClassName Win32_ComputerSystem
if ($memory) {
    $totalMemory = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)
    $results.memory.Value = "$totalMemory GB"
    Write-Host "Total memory: $($results.memory.Value)" -ForegroundColor Green
}

# --- SUMMARY ---
Write-Host "`n=== Environment Validation Summary ===" -ForegroundColor Green
Write-Host "------------------------------------"
Write-Host ("PDF Tools (pdftotext/pdfinfo): {0}, {1}" -f $results.pdftotext.Message, $results.pdfinfo.Message)
Write-Host ("Crypto Libraries: {0}" -f $results.crypto.Message)
Write-Host ("Node.js Ecosystem: node $($results.node.Version), npm $($results.npm.Version), tsc $($results.tsc.Version), jest $($results.jest.Version)")
Write-Host ("QMS Docs Access: {0}" -f $results.qmsDocs.Message)
Write-Host ("Phoenix-Code-Lite: Build ({0}), Tests ({1})" -f $results.pclBuild.Message, $results.pclTest.Message)
Write-Host ("Development Tools: Git ({0}), VS Code ({1})" -f $results.git.Message, $results.vscode.Message)
Write-Host ("System: Disk ($($results.disk.Value)), Memory ($($results.memory.Value))")
Write-Host "------------------------------------"
Write-Host "`nPhase 0 preparation validation complete." -ForegroundColor Green
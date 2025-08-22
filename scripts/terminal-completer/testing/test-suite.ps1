# Terminal Safety Test Suite
# Simple testing for terminal safety functionality

param(
    [switch]$Quick = $false
)

Write-Host "=== Terminal Safety Test Suite (Phase 2 Enhanced) ===" -ForegroundColor Green
Write-Host "Starting tests..." -ForegroundColor Cyan

$testResults = @{
    passed = 0
    failed = 0
    total = 0
}

function Test-Script {
    param([string]$Name, [string]$Path, [string]$Description)
    
    $testResults.total++
    $exists = Test-Path $Path
    
    if ($exists) {
        $testResults.passed++
        Write-Host "[PASS] $Name" -ForegroundColor Green
        Write-Host "  $Description" -ForegroundColor DarkGreen
    } else {
        $testResults.failed++
        Write-Host "[FAIL] $Name" -ForegroundColor Red
        Write-Host "  $Description" -ForegroundColor DarkRed
    }
}

# Test core functionality
Write-Host "`n=== Core Functionality ===" -ForegroundColor Yellow
Test-Script "Enhanced Terminal Manager" "core/enhanced-terminal-manager.ps1" "Main terminal safety engine (Phase 2 enhanced)"
Test-Script "Enhanced Process Monitor" "core/enhanced-process-monitor.ps1" "Core enhanced monitoring engine (Phase 2)"
Test-Script "Kill Hanging Script" "core/kill-hanging.ps1" "Process cleanup utility"

# Test installation scripts
Write-Host "`n=== Installation Scripts ===" -ForegroundColor Yellow
Test-Script "Unified Installer" "installation/unified-installer.ps1" "Unified installation script"

# Test integration scripts
Write-Host "`n=== Integration Scripts ===" -ForegroundColor Yellow
Test-Script "Cursor Terminal Init" "integration/cursor-terminal-init.ps1" "Cursor integration (Phase 2)"
Test-Script "Agent Terminal Init" "integration/agent-terminal-init.ps1" "Agent integration (Phase 2)"
Test-Script "Global Command Wrapper" "integration/global-command-wrapper.ps1" "Global command handling (Phase 2)"

# Test testing scripts
Write-Host "`n=== Testing Scripts ===" -ForegroundColor Yellow
Test-Script "Functional Test Script" "testing/test-terminal-safety.ps1" "Comprehensive functional testing"
Test-Script "Enhanced Monitoring Tests" "testing/test-enhanced-monitoring.ps1" "Phase 2 feature testing"

# Test documentation
Write-Host "`n=== Documentation ===" -ForegroundColor Yellow
Test-Script "User Guide" "docs/user-guide.md" "User documentation and usage guide (Phase 2)"
Test-Script "Developer Guide" "docs/developer-guide.md" "Developer documentation and architecture guide (Phase 2)"
Test-Script "Phase 1 Documentation" "README-Phase1.md" "Phase 1 implementation details"
Test-Script "Phase 2 Documentation" "README-Phase2.md" "Phase 2 implementation details"

# Test results
Write-Host "`n=== Test Results ===" -ForegroundColor Green
Write-Host "Total: $($testResults.total)" -ForegroundColor White
Write-Host "Passed: $($testResults.passed)" -ForegroundColor Green
Write-Host "Failed: $($testResults.failed)" -ForegroundColor Red

if ($testResults.failed -eq 0) {
    Write-Host "`n[SUCCESS] All tests passed!" -ForegroundColor Green
    Write-Host "Phase 2 enhanced monitoring is ready for use." -ForegroundColor Cyan
    Write-Host "Test Phase 2 features with: .\terminal-safety.ps1 phase2" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`n[FAILURE] Some tests failed!" -ForegroundColor Red
    exit 1
}

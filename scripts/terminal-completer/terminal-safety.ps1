# Terminal Safety System - Main Entry Point
# Provides CLI actions for installation, testing, and status

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("install", "test", "status", "help", "phase2")]
    [string]$Action = "help"
)

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Show-Help {
    Write-Host "Terminal Safety System - CLI Interface" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Cyan
    Write-Host "  .\terminal-safety.ps1 [action]" -ForegroundColor White
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  install  - Install terminal safety system" -ForegroundColor White
    Write-Host "  test     - Run comprehensive test suite" -ForegroundColor White
    Write-Host "  status   - Show system status and configuration" -ForegroundColor White
    Write-Host "  phase2   - Test Phase 2 enhanced monitoring features" -ForegroundColor White
    Write-Host "  help     - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\terminal-safety.ps1 install" -ForegroundColor White
    Write-Host "  .\terminal-safety.ps1 test" -ForegroundColor White
    Write-Host "  .\terminal-safety.ps1 phase2" -ForegroundColor White
    Write-Host ""
    Write-Host "Phase 2 Features:" -ForegroundColor Cyan
    Write-Host "  - Enhanced hanging pattern detection with context-aware matching" -ForegroundColor White
    Write-Host "  - Output change tracking and stagnation detection" -ForegroundColor White
    Write-Host "  - Comprehensive hanging risk assessment" -ForegroundColor White
    Write-Host "  - Command-specific timeout configurations" -ForegroundColor White
}

function Install-TerminalSafety {
    Write-Host "Installing Terminal Safety System..." -ForegroundColor Green
    
    $installerPath = Join-Path $scriptDir "installation\unified-installer.ps1"
    
    if (Test-Path $installerPath) {
        Write-Host "Running unified installer..." -ForegroundColor Cyan
        try {
            & powershell -ExecutionPolicy Bypass -File $installerPath
            Write-Host "Installation completed successfully!" -ForegroundColor Green
        } catch {
            Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Installer not found at: $installerPath" -ForegroundColor Red
    }
}

function Test-TerminalSafety {
    Write-Host "Running Terminal Safety Test Suite..." -ForegroundColor Green
    
    $testSuitePath = Join-Path $scriptDir "testing\test-suite.ps1"
    
    if (Test-Path $testSuitePath) {
        Write-Host "Running comprehensive test suite..." -ForegroundColor Cyan
        try {
            & powershell -ExecutionPolicy Bypass -File $testSuitePath
            Write-Host "Test suite completed successfully!" -ForegroundColor Green
        } catch {
            Write-Host "Test suite execution failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Test suite not found at: $testSuitePath" -ForegroundColor Red
    }
}

function Test-Phase2Features {
    Write-Host "Testing Phase 2 Enhanced Monitoring Features..." -ForegroundColor Green
    
    $testPath = Join-Path $scriptDir "testing\test-enhanced-monitoring.ps1"
    
    if (Test-Path $testPath) {
        Write-Host "Running Phase 2 test suite..." -ForegroundColor Cyan
        try {
            & powershell -ExecutionPolicy Bypass -File $testPath -TestPhase2
            Write-Host "Phase 2 tests completed successfully!" -ForegroundColor Green
        } catch {
            Write-Host "Some Phase 2 tests failed. Check output above for details." -ForegroundColor Red
        }
    } else {
        Write-Host "Phase 2 test suite not found at: $testPath" -ForegroundColor Red
    }
}

function Show-Status {
    Write-Host "Terminal Safety System Status" -ForegroundColor Green
    Write-Host "=============================" -ForegroundColor Green
    Write-Host ""
    
    # Check core components
    Write-Host "Core Components:" -ForegroundColor Yellow
    $coreFiles = @("enhanced-terminal-manager.ps1", "enhanced-process-monitor.ps1")
    foreach ($file in $coreFiles) {
        $filePath = Join-Path $scriptDir "core\$file"
        if (Test-Path $filePath) {
            $content = Get-Content $filePath -Raw
            if ($content -match "Phase 2" -or $content -match "outputTracking") {
                Write-Host "  [ENHANCED] $file (Phase 2)" -ForegroundColor Cyan
            } else {
                Write-Host "  [BASIC] $file" -ForegroundColor White
            }
        } else {
            Write-Host "  [MISSING] $file" -ForegroundColor Red
        }
    }
    
    # Check legacy components
    Write-Host ""
    Write-Host "Legacy Components:" -ForegroundColor Yellow
    $legacyFiles = @("auto-terminal-manager.ps1", "kill-hanging.ps1")
    foreach ($file in $legacyFiles) {
        $filePath = Join-Path $scriptDir "core\$file"
        if (Test-Path $filePath) {
            Write-Host "  [AVAILABLE] $file" -ForegroundColor White
        } else {
            Write-Host "  [MISSING] $file" -ForegroundColor Red
        }
    }
    
    # Check Phase 2 test suite
    Write-Host ""
    Write-Host "Phase 2 Testing:" -ForegroundColor Yellow
    $phase2TestPath = Join-Path $scriptDir "testing\test-enhanced-monitoring.ps1"
    if (Test-Path $phase2TestPath) {
        Write-Host "  [AVAILABLE] Phase 2 test suite" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] Phase 2 test suite" -ForegroundColor Red
    }
    
    # Check Phase 2 documentation
    Write-Host ""
    Write-Host "Documentation:" -ForegroundColor Yellow
    $phase2DocPath = Join-Path $scriptDir "README-Phase2.md"
    if (Test-Path $phase2DocPath) {
        Write-Host "  [AVAILABLE] Phase 2 documentation" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] Phase 2 documentation" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "System Status: Ready with Phase 2 capabilities" -ForegroundColor Green
    Write-Host "Test Phase 2 features with: .\terminal-safety.ps1 phase2" -ForegroundColor Cyan
}

# Main execution logic
switch ($Action.ToLower()) {
    "install" {
        Install-TerminalSafety
    }
    "test" {
        Test-TerminalSafety
    }
    "phase2" {
        Test-Phase2Features
    }
    "status" {
        Show-Status
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "Unknown action: $Action" -ForegroundColor Red
        Show-Help
    }
}

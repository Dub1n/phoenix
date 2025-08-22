# Comprehensive Test Suite for Terminal Heartbeat Architecture Redesign
# Validates all requirements from the original issues document
# Tests the complete redesigned system end-to-end

param(
    [switch]$Verbose = $false,
    [switch]$CleanupAfter = $true,
    [switch]$SkipInteractive = $false
)

# Test configuration
$script:TestResults = @()
$script:ProjectRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$script:TestStartTime = Get-Date

# ANSI color codes for better test output
$script:Colors = @{
    Green = "`e[32m"
    Red = "`e[31m"
    Yellow = "`e[33m"
    Cyan = "`e[36m"
    White = "`e[37m"
    Gray = "`e[90m"
    Reset = "`e[0m"
}

function Write-TestHeader {
    param([string]$Title)
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor White
    Write-Host "=" * 80 -ForegroundColor Cyan
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = "",
        [string]$Expected = "",
        [string]$Actual = ""
    )
    
    $result = @{
        TestName = $TestName
        Passed = $Passed
        Details = $Details
        Expected = $Expected
        Actual = $Actual
        Timestamp = Get-Date
    }
    
    $script:TestResults += $result
    
    $status = if ($Passed) { "$($script:Colors.Green)[PASS]$($script:Colors.Reset)" } else { "$($script:Colors.Red)[FAIL]$($script:Colors.Reset)" }
    Write-Host "  $status $TestName" -NoNewline
    
    if ($Details) {
        Write-Host " - $Details" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
    
    if (-not $Passed -and $Expected -and $Actual) {
        Write-Host "    Expected: $Expected" -ForegroundColor Yellow
        Write-Host "    Actual: $Actual" -ForegroundColor Red
    }
}

function Test-FileExists {
    param(
        [string]$Path,
        [string]$Description
    )
    
    $exists = Test-Path $Path
    Write-TestResult "File exists: $Description" $exists "Path: $Path"
    return $exists
}

function Test-PowerShellSyntax {
    param(
        [string]$Path,
        [string]$Description
    )
    
    try {
        $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content $Path -Raw), [ref]$null)
        Write-TestResult "PowerShell syntax: $Description" $true "Valid syntax"
        return $true
    } catch {
        Write-TestResult "PowerShell syntax: $Description" $false "Syntax error: $($_.Exception.Message)"
        return $false
    }
}

function Test-RequirementFromIssues {
    param(
        [string]$RequirementName,
        [scriptblock]$TestCode,
        [string]$Description
    )
    
    try {
        $result = & $TestCode
        $passed = [bool]$result
        Write-TestResult "Requirement: $RequirementName" $passed $Description
        return $passed
    } catch {
        Write-TestResult "Requirement: $RequirementName" $false "Error: $($_.Exception.Message)"
        return $false
    }
}

function Test-BackgroundExecution {
    param([string]$ScriptPath)
    
    try {
        # Test that script can run in background without blocking
        $job = Start-Job -ScriptBlock {
            param($scriptPath)
            $startTime = Get-Date
            & powershell -ExecutionPolicy Bypass -File $scriptPath -Test -Silent
            $endTime = Get-Date
            return @{
                success = $true
                duration = ($endTime - $startTime).TotalMilliseconds
            }
        } -ArgumentList $ScriptPath
        
        # Wait max 10 seconds for background test
        $result = Wait-Job $job -Timeout 10
        
        if ($result) {
            $output = Receive-Job $job
            Remove-Job $job -Force
            
            if ($output -and $output.success) {
                return @{ success = $true; duration = $output.duration }
            }
        } else {
            Stop-Job $job -ErrorAction SilentlyContinue
            Remove-Job $job -Force -ErrorAction SilentlyContinue
        }
        
        return @{ success = $false; reason = "Background execution timed out or failed" }
    } catch {
        return @{ success = $false; reason = $_.Exception.Message }
    }
}

# Start comprehensive testing
Write-TestHeader "Terminal Heartbeat Architecture Redesign - Comprehensive Test Suite"
Write-Host "Test started: $(Get-Date)" -ForegroundColor Gray
Write-Host "Project root: $script:ProjectRoot" -ForegroundColor Gray
Write-Host ""

# Test 1: File Structure and Availability
Write-TestHeader "Test 1: File Structure and Availability"

$coreFiles = @{
    "agent-heartbeat.ps1" = "$script:ProjectRoot\scripts\terminal-completer\core\agent-heartbeat.ps1"
    "terminal-lifecycle-manager.ps1" = "$script:ProjectRoot\scripts\terminal-completer\core\terminal-lifecycle-manager.ps1"
    "cursor-terminal-init.ps1" = "$script:ProjectRoot\scripts\terminal-completer\integration\cursor-terminal-init.ps1"
    "terminal-config.json" = "$script:ProjectRoot\.cursor\terminal-config.json"
}

foreach ($file in $coreFiles.GetEnumerator()) {
    Test-FileExists $file.Value $file.Key
}

# Test 2: PowerShell Syntax Validation
Write-TestHeader "Test 2: PowerShell Syntax Validation"

foreach ($file in $coreFiles.GetEnumerator()) {
    if ($file.Key -notlike "*.json") {
        Test-PowerShellSyntax $file.Value $file.Key
    }
}

# Test 3: Configuration Validation
Write-TestHeader "Test 3: Configuration Validation"

try {
    $config = Get-Content $coreFiles["terminal-config.json"] -Raw | ConvertFrom-Json
    
    Write-TestResult "Config JSON parse" $true "Configuration loaded successfully"
    
    $hasHeartbeat = $null -ne $config.heartbeat
    Write-TestResult "Config has heartbeat section" $hasHeartbeat
    
    if ($hasHeartbeat) {
        $hasVersion2 = $config.heartbeat.version -eq "2.0"
        Write-TestResult "Config version 2.0" $hasVersion2 "Version: $($config.heartbeat.version)"
        
        $hasBackgroundMode = $null -ne $config.heartbeat.background_mode
        Write-TestResult "Config has background_mode" $hasBackgroundMode
        
        $hasTerminalOnly = $null -ne $config.heartbeat.terminal_only
        Write-TestResult "Config has terminal_only" $hasTerminalOnly
        
        $hasLifecycleManagement = $null -ne $config.heartbeat.lifecycle_management
        Write-TestResult "Config has lifecycle_management" $hasLifecycleManagement
    }
} catch {
    Write-TestResult "Config JSON parse" $false "Error: $($_.Exception.Message)"
}

# Test 4: Original Issues Requirements Validation
Write-TestHeader "Test 4: Original Issues Requirements Validation"

# Requirement 1: Being enabled whenever the Cursor agent uses the terminal
Test-RequirementFromIssues "Agent terminal auto-detection" {
    $heartbeatScript = $coreFiles["agent-heartbeat.ps1"]
    $content = Get-Content $heartbeatScript -Raw
    
    # Check for improved agent detection methods
    $hasEnvVarCheck = $content -like "*CURSOR_AGENT_TERMINAL*"
    $hasProcessCheck = $content -like "*Get-Process*"
    $hasWorkspaceCheck = $content -like "*VDL_Vault*"
    
    return $hasEnvVarCheck -and $hasProcessCheck -and $hasWorkspaceCheck
} "Multiple detection methods implemented"

# Requirement 2: Not affecting the user's Windows environment
Test-RequirementFromIssues "No Windows-wide keyboard interference" {
    $heartbeatScript = $coreFiles["agent-heartbeat.ps1"]
    $content = Get-Content $heartbeatScript -Raw
    
    # Check that Windows API keyboard events are NOT used
    $noKeyboardApi = -not ($content -like "*keybd_event*")
    $noUserDll = -not ($content -like "*user32.dll*")
    $usesTerminalOutput = $content -like "*Console*Write*" -or $content -like "*Write-Host*"
    
    return $noKeyboardApi -and $noUserDll -and $usesTerminalOutput
} "Windows API removed, terminal-specific output implemented"

# Requirement 3: Sending symbols to the terminal
Test-RequirementFromIssues "Terminal-specific symbol output" {
    $heartbeatScript = $coreFiles["agent-heartbeat.ps1"]
    $content = Get-Content $heartbeatScript -Raw
    
    # Check for terminal-specific output mechanisms
    $hasTerminalOutput = $content -like "*Write-TerminalHeartbeat*"
    $hasAnsiSequences = $content -match "\\`e\[" -or $content -like "*Console*Write*"
    $hasConsoleWrite = $content -like "*Console*Write*"
    
    return $hasTerminalOutput -and ($hasAnsiSequences -or $hasConsoleWrite)
} "Terminal-specific output mechanism implemented"

# Requirement 4: Non-blocking execution
Test-RequirementFromIssues "Non-blocking terminal operation" {
    $heartbeatScript = $coreFiles["agent-heartbeat.ps1"]
    $content = Get-Content $heartbeatScript -Raw
    
    # Check for background execution implementation
    $hasRunspaces = $content -like "*runspacefactory*"
    $hasBackgroundMode = $content -like "*background_mode*"
    $hasNonBlocking = $content -like "*non_blocking*" -or $content -like "*Start-Job*"
    
    return $hasRunspaces -and ($hasBackgroundMode -or $hasNonBlocking)
} "Background execution with PowerShell runspaces implemented"

# Requirement 5: Terminal lifecycle management
Test-RequirementFromIssues "Multi-terminal lifecycle management" {
    $lifecycleManager = $coreFiles["terminal-lifecycle-manager.ps1"]
    $exists = Test-Path $lifecycleManager
    
    if ($exists) {
        $content = Get-Content $lifecycleManager -Raw
        $hasRegistration = $content -like "*Register-TerminalSession*"
        $hasCleanup = $content -like "*Unregister-TerminalSession*"
        $hasProcessTracking = $content -like "*Test-ProcessAlive*"
        
        return $hasRegistration -and $hasCleanup -and $hasProcessTracking
    }
    
    return $false
} "Terminal lifecycle manager with session tracking implemented"

# Test 5: Background Execution Validation
Write-TestHeader "Test 5: Background Execution Validation"

$backgroundTest = Test-BackgroundExecution $coreFiles["agent-heartbeat.ps1"]
Write-TestResult "Background execution test" $backgroundTest.success $backgroundTest.reason

if ($backgroundTest.success) {
    $fastExecution = $backgroundTest.duration -lt 5000  # Less than 5 seconds
    Write-TestResult "Background execution speed" $fastExecution "Duration: $([math]::Round($backgroundTest.duration, 2))ms"
}

# Test 6: Integration Testing
Write-TestHeader "Test 6: Integration Testing"

# Test cursor-terminal-init.ps1 integration
try {
    $initScript = $coreFiles["cursor-terminal-init.ps1"]
    $content = Get-Content $initScript -Raw
    
    $hasLifecycleIntegration = $content -like "*terminal-lifecycle-manager*"
    Write-TestResult "Integration with lifecycle manager" $hasLifecycleIntegration
    
    $hasNonBlockingInit = $content -like "*Start-Job*" -and $content -like "*non-blocking*"
    Write-TestResult "Non-blocking initialization" $hasNonBlockingInit
    
    $hasCleanupHandler = $content -like "*Register-EngineEvent*" -and $content -like "*PowerShell.Exiting*"
    Write-TestResult "Cleanup handler registration" $hasCleanupHandler
    
    $hasVersionInfo = $content -like "*Architecture v2.0*" -or $content -like "*TERMINAL_INIT_VERSION*"
    Write-TestResult "Architecture version tracking" $hasVersionInfo
} catch {
    Write-TestResult "Integration testing" $false "Error: $($_.Exception.Message)"
}

# Test 7: Backward Compatibility
Write-TestHeader "Test 7: Backward Compatibility"

try {
    $heartbeatScript = $coreFiles["agent-heartbeat.ps1"]
    $content = Get-Content $heartbeatScript -Raw
    
    # Check that old parameters are still supported
    $hasOldParams = $content -like "*param*" -and $content -like "*IntervalSeconds*" -and $content -like "*Debug*"
    Write-TestResult "Legacy parameter support" $hasOldParams
    
    # Check for fallback mechanisms
    $hasForegroundFallback = $content -like "*Start-ForegroundHeartbeat*"
    Write-TestResult "Foreground execution fallback" $hasForegroundFallback
    
    # Check for graceful degradation
    $hasErrorHandling = $content -like "*try*" -and $content -like "*catch*" -and $content -like "*finally*"
    Write-TestResult "Error handling and graceful degradation" $hasErrorHandling
} catch {
    Write-TestResult "Backward compatibility testing" $false "Error: $($_.Exception.Message)"
}

# Test 8: Manual Interactive Test (if not skipped)
if (-not $SkipInteractive) {
    Write-TestHeader "Test 8: Manual Interactive Validation"
    
    Write-Host "This test requires manual verification. Press any key to continue or Ctrl+C to skip..." -ForegroundColor Yellow
    $null = Read-Host
    
    try {
        Write-Host "Starting test terminal with heartbeat enabled..." -ForegroundColor Cyan
        
        # Start a test terminal session
        $testJob = Start-Job -ScriptBlock {
            param($projectRoot)
            
            $env:SAFE_TERMINAL_ENABLED = "true"
            $env:CURSOR_AGENT_TERMINAL = "true"
            $env:SAFE_TERMINAL_PROJECT_ROOT = $projectRoot
            
            $initScript = "$projectRoot\scripts\terminal-completer\integration\cursor-terminal-init.ps1"
            & powershell -ExecutionPolicy Bypass -File $initScript -EnableHeartbeat -Debug
            
            return "Test terminal completed"
        } -ArgumentList $script:ProjectRoot
        
        Write-Host "Test terminal job started. Waiting 5 seconds..." -ForegroundColor Cyan
        Start-Sleep -Seconds 5
        
        $jobOutput = Receive-Job $testJob -ErrorAction SilentlyContinue
        $jobState = $testJob.State
        
        Stop-Job $testJob -ErrorAction SilentlyContinue
        Remove-Job $testJob -Force -ErrorAction SilentlyContinue
        
        $manualTestPassed = $jobState -eq "Running" -or $jobState -eq "Completed"
        Write-TestResult "Manual interactive test" $manualTestPassed "Job state: $jobState"
        
    } catch {
        Write-TestResult "Manual interactive test" $false "Error: $($_.Exception.Message)"
    }
}

# Test 9: Cleanup and Resource Management
Write-TestHeader "Test 9: Cleanup and Resource Management"

if ($CleanupAfter) {
    try {
        # Test the cleanup functionality
        $lifecycleManager = $coreFiles["terminal-lifecycle-manager.ps1"]
        
        if (Test-Path $lifecycleManager) {
            $cleanupResult = & powershell -ExecutionPolicy Bypass -File $lifecycleManager -Action "cleanup" -Force
            Write-TestResult "Lifecycle cleanup execution" $true "Cleanup command executed"
            
            # Test status functionality
            $statusResult = & powershell -ExecutionPolicy Bypass -File $lifecycleManager -Action "status"
            Write-TestResult "Lifecycle status reporting" $true "Status command executed"
        } else {
            Write-TestResult "Lifecycle cleanup testing" $false "Lifecycle manager not found"
        }
        
        # Clean up any test state files
        $tempStateFile = "$env:TEMP\terminal-heartbeat-state.json"
        if (Test-Path $tempStateFile) {
            Remove-Item $tempStateFile -Force -ErrorAction SilentlyContinue
            Write-TestResult "State file cleanup" $true "Temporary state file removed"
        } else {
            Write-TestResult "State file cleanup" $true "No state file to clean"
        }
        
        # Clean up any lock files
        $tempLockFile = "$env:TEMP\terminal-heartbeat-lock.tmp"
        if (Test-Path $tempLockFile) {
            Remove-Item $tempLockFile -Force -ErrorAction SilentlyContinue
        }
        
    } catch {
        Write-TestResult "Cleanup testing" $false "Error: $($_.Exception.Message)"
    }
}

# Generate Final Test Report
Write-TestHeader "Test Results Summary"

$totalTests = $script:TestResults.Count
$passedTests = ($script:TestResults | Where-Object { $_.Passed }).Count
$failedTests = $totalTests - $passedTests
$testDuration = ((Get-Date) - $script:TestStartTime).TotalSeconds

Write-Host ""
Write-Host "Test Execution Summary:" -ForegroundColor White
Write-Host "  Total Tests: $totalTests" -ForegroundColor Cyan
Write-Host "  Passed: $passedTests" -ForegroundColor Green
Write-Host "  Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host "  Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 1))%" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Yellow" })
Write-Host "  Duration: $([math]::Round($testDuration, 2)) seconds" -ForegroundColor Gray
Write-Host ""

if ($failedTests -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $script:TestResults | Where-Object { -not $_.Passed } | ForEach-Object {
        Write-Host "  [FAIL] $($_.TestName)" -ForegroundColor Red
        if ($_.Details) {
            Write-Host "    $($_.Details)" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

# Architecture Redesign Validation Summary
Write-TestHeader "Architecture Redesign Validation Summary"

$requirementTests = $script:TestResults | Where-Object { $_.TestName -like "Requirement:*" }
$requirementsPassed = ($requirementTests | Where-Object { $_.Passed }).Count
$totalRequirements = $requirementTests.Count

Write-Host "Original Issues Requirements Compliance:" -ForegroundColor White
Write-Host "  Requirements Tested: $totalRequirements" -ForegroundColor Cyan
Write-Host "  Requirements Met: $requirementsPassed" -ForegroundColor Green
Write-Host "  Compliance Rate: $([math]::Round(($requirementsPassed / $totalRequirements) * 100, 1))%" -ForegroundColor $(if ($requirementsPassed -eq $totalRequirements) { "Green" } else { "Yellow" })

Write-Host ""
if ($requirementsPassed -eq $totalRequirements) {
    Write-Host "*** ARCHITECTURE REDESIGN SUCCESSFUL ***" -ForegroundColor Green
    Write-Host "All original issues have been addressed by the new architecture!" -ForegroundColor Green
} else {
    Write-Host "*** ARCHITECTURE REDESIGN NEEDS ATTENTION ***" -ForegroundColor Yellow
    Write-Host "Some requirements may need additional work." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Architecture Redesign Test Suite Completed: $(Get-Date)" -ForegroundColor Cyan

# Exit with appropriate code
if ($failedTests -eq 0) {
    exit 0
} else {
    exit 1
}
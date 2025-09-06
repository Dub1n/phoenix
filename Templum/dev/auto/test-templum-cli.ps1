# Templum CLI Automation Test Script
# Purpose: Test Templum CLI interaction using piped input for Claude Code agent integration

param(
    [string]$TestMode = "basic",  # basic, comprehensive, debug
    [int]$StartupDelay = 3,       # seconds to wait for main app startup
    [string]$OutputFile = "cli-test-results.json"
)

Write-Host "=== Templum CLI Automation Test ===" -ForegroundColor Cyan
Write-Host "Test Mode: $TestMode" -ForegroundColor Yellow
Write-Host "Startup Delay: $StartupDelay seconds" -ForegroundColor Yellow
Write-Host ""

# Set working directory
$TemplumPath = "C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum"
Set-Location $TemplumPath

Write-Host "Starting Templum main application..." -ForegroundColor Green
# Start main app in background job
$MainAppJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    node "Templum/dist/src/index.js"
} -ArgumentList (Split-Path $TemplumPath -Parent)

Write-Host "Waiting $StartupDelay seconds for main app to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds $StartupDelay

# Test different command sets based on mode
switch ($TestMode) {
    "basic" {
        $TestCommands = @(
            "help",
            "status", 
            "exit"
        )
    }
    "comprehensive" {
        $TestCommands = @(
            "help",
            "status",
            "list",
            "info",
            "config",
            "version",
            "exit"
        )
    }
    "debug" {
        $TestCommands = @(
            "help",
            "status",
            "debug",
            "logs", 
            "health",
            "exit"
        )
    }
}

Write-Host "Testing CLI with commands: $($TestCommands -join ', ')" -ForegroundColor Green

# Create input string for piped commands
$InputCommands = $TestCommands -join "`n"
$InputCommands += "`n"  # Extra newline to ensure proper termination

Write-Host "Executing CLI test..." -ForegroundColor Green

try {
    # Execute CLI with piped input and capture output
    $CLIOutput = $InputCommands | npm run start:cli 2>&1
    
    Write-Host "=== CLI Test Results ===" -ForegroundColor Cyan
    Write-Host $CLIOutput
    Write-Host "=== End Results ===" -ForegroundColor Cyan
    
    # Create structured results
    $Results = @{
        TestMode = $TestMode
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Commands = $TestCommands
        Success = $LASTEXITCODE -eq 0
        ExitCode = $LASTEXITCODE
        Output = $CLIOutput -split "`n"
        MainAppRunning = (Get-Job $MainAppJob).State -eq "Running"
    }
    
    # Save results to JSON
    $Results | ConvertTo-Json -Depth 3 | Out-File "$TemplumPath\dev\auto\$OutputFile" -Encoding UTF8
    Write-Host "Results saved to: $OutputFile" -ForegroundColor Green
    
} catch {
    Write-Host "Error during CLI test: $($_.Exception.Message)" -ForegroundColor Red
    $Results = @{
        TestMode = $TestMode
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Commands = $TestCommands
        Success = $false
        Error = $_.Exception.Message
        MainAppRunning = (Get-Job $MainAppJob).State -eq "Running"
    }
    $Results | ConvertTo-Json -Depth 3 | Out-File "$TemplumPath\dev\auto\$OutputFile" -Encoding UTF8
}

Write-Host ""
Write-Host "Cleaning up main app job..." -ForegroundColor Yellow

# Clean up the main app job
if ($MainAppJob) {
    Stop-Job $MainAppJob -ErrorAction SilentlyContinue
    Remove-Job $MainAppJob -ErrorAction SilentlyContinue
}

Write-Host "Test completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Cyan
Write-Host "  .\test-templum-cli.ps1                                    # Basic test"
Write-Host "  .\test-templum-cli.ps1 -TestMode comprehensive            # Full command test"
Write-Host "  .\test-templum-cli.ps1 -TestMode debug -StartupDelay 5   # Debug mode with longer delay"
Write-Host ""
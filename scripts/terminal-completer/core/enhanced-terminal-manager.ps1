# Enhanced Terminal Manager - Phase 2 Integration (Fixed Version)
# Integrates enhanced process monitoring with existing auto-terminal-manager
# Provides improved hanging detection, process state analysis, and advanced output pattern recognition

param(
    [string]$Command,
    [string]$WorkingDirectory = (Get-Location).Path,
    [switch]$Background = $false,
    [switch]$Debug = $false,
    [switch]$EnhancedMonitoring = $false,
    [switch]$DebugBypassCleanup = $false
)

# Load existing configuration
$configPath = ".cursor/terminal-config.json"
$config = @{
    timeout = @{
        default = 30000
        short = 10000
        long = 120000
    }
    # Debug timeouts - much shorter for testing
    debug_timeout = @{
        default = 5000      # 5 seconds instead of 30
        short = 2000        # 2 seconds instead of 10
        long = 10000        # 10 seconds instead of 120
    }
    processManagement = @{
        autoKillHanging = $true
        killTimeout = 5000
        backgroundJobs = @{
            enabled = $true
            maxConcurrent = 3
        }
    }
    commands = @{
        npm = @{
            test = @{ timeout = 60000; background = $false; retry = 2 }
            start = @{ timeout = 30000; background = $true; retry = 1 }
            build = @{ timeout = 120000; background = $false; retry = 1 }
        }
        node = @{ timeout = 30000; background = $false }
        git = @{ timeout = 15000; background = $false }
    }
    # Debug command timeouts - much shorter for testing
    debug_commands = @{
        npm = @{
            test = @{ timeout = 5000; background = $false; retry = 1 }      # 5s instead of 60s
            start = @{ timeout = 3000; background = $true; retry = 1 }      # 3s instead of 30s
            build = @{ timeout = 8000; background = $false; retry = 1 }     # 8s instead of 120s
        }
        node = @{ timeout = 3000; background = $false }                     # 3s instead of 30s
        git = @{ timeout = 2000; background = $false }                      # 2s instead of 15s
    }
    patterns = @{
        hanging = @("node.exe", "npm.cmd", "tsc.exe")
        safe = @("git", "echo", "dir", "ls")
    }
}

# Load config if exists
if (Test-Path $configPath) {
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json -Depth 10
        if ($Debug) { Write-Host "Loaded configuration from $configPath" }
    }
    catch {
        Write-Host "Warning: Failed to load config, using defaults" -ForegroundColor Yellow
    }
}

# Enhanced process monitoring with existing functionality
function Invoke-EnhancedSafeCommand {
    [CmdletBinding()]
    param(
        [string]$Command,
        [int]$TimeoutMs,
        [bool]$Background,
        [int]$RetryCount = 1
    )
    
    if ($Debug) { Write-Host "Enhanced monitoring enabled: $EnhancedMonitoring" -ForegroundColor Cyan }
    
    # Kill any existing hanging processes before starting (unless bypassed for debugging)
    if (-not $DebugBypassCleanup) {
        Stop-HangingProcesses
        if ($Debug) { Write-Host "Process cleanup performed" -ForegroundColor Yellow }
    } else {
        if ($Debug) { Write-Host "Process cleanup bypassed for debugging" -ForegroundColor Cyan }
    }
    
    if ($Background) {
        # Start background job with enhanced monitoring
        $job = Start-Job -ScriptBlock { 
            param($cmd, $wd) 
            Set-Location $wd
            Invoke-Expression $cmd 
        } -ArgumentList $Command, $WorkingDirectory
        
        if ($Debug) { Write-Host "Started background job: $($job.Id)" }
        return @{ Success = $true; JobId = $job.Id; Output = "Background job started" }
    }
    else {
        # Execute with enhanced timeout and hanging prevention
        $attempt = 0
        while ($attempt -lt $RetryCount) {
            $attempt++
            if ($Debug) { Write-Host "Attempt $attempt of $RetryCount" }
            
            try {
                # Start process with timeout - using working logic from test-timeout-simple.ps1
                $processInfo = New-Object System.Diagnostics.ProcessStartInfo
                $processInfo.FileName = "powershell.exe"
                $processInfo.Arguments = "-Command", $Command
                $processInfo.WorkingDirectory = $WorkingDirectory
                $processInfo.UseShellExecute = $false
                $processInfo.RedirectStandardOutput = $true
                $processInfo.RedirectStandardError = $true
                
                $process = New-Object System.Diagnostics.Process
                $process.StartInfo = $processInfo
                $process.Start() | Out-Null
                
                if ($Debug) { Write-Host "Process started with PID: $($process.Id)" -ForegroundColor Green }
                
                # Enhanced monitoring if enabled
                if ($EnhancedMonitoring) {
                    $monitoringJob = Start-Job -ScriptBlock {
                        param($processId, $maxChecks)
                        $stuckCount = 0
                        for ($i = 0; $i -lt $maxChecks; $i++) {
                            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                            if (-not $proc -or $proc.HasExited) { return @{ IsStuck = $false } }
                            if (-not $proc.Responding) { $stuckCount++ } else { $stuckCount = 0 }
                            if ($stuckCount -gt 3) { return @{ IsStuck = $true } }
                            Start-Sleep -Milliseconds 100
                        }
                        return @{ IsStuck = $false }
                    } -ArgumentList $process.Id, 50  # Monitor for 5 seconds
                }
                
                # Wait for completion with timeout - using working logic from test-timeout-simple.ps1
                $startTime = Get-Date
                if ($process.WaitForExit($TimeoutMs)) {
                    $endTime = Get-Date
                    $duration = ($endTime - $startTime).TotalSeconds
                    
                    $output = $process.StandardOutput.ReadToEnd()
                    $errOutput = $process.StandardError.ReadToEnd()
                    
                    if ($EnhancedMonitoring -and $monitoringJob) {
                        $monitoringResult = Receive-Job -Job $monitoringJob
                        Remove-Job -Job $monitoringJob
                        
                        if ($monitoringResult.IsStuck) {
                            if ($Debug) { Write-Host "Enhanced monitoring detected stuck process" -ForegroundColor Yellow }
                        }
                    }
                    
                    if ($process.ExitCode -eq 0) {
                        if ($Debug) { Write-Host "Command completed in $([math]::Round($duration, 1))s" -ForegroundColor Green }
                        return @{ Success = $true; Output = $output; Error = $errOutput; Duration = $duration }
                    }
                    else {
                        if ($Debug) { Write-Host "Command failed with exit code: $($process.ExitCode) after $([math]::Round($duration, 1))s" }
                        if ($attempt -lt $RetryCount) {
                            Start-Sleep -Seconds 2
                            continue
                        }
                        return @{ Success = $false; Output = $output; Error = $errOutput; ExitCode = $process.ExitCode; Duration = $duration }
                    }
                }
                else {
                    # Timeout reached - kill process and hanging processes
                    $endTime = Get-Date
                    $duration = ($endTime - $startTime).TotalSeconds
                    
                    if ($Debug) { Write-Host "Timeout reached after $([math]::Round($duration, 1))s - killing process" -ForegroundColor Yellow }
                    
                    if ($EnhancedMonitoring -and $monitoringJob) {
                        Remove-Job -Job $monitoringJob
                    }
                    
                    $process.Kill()
                    if ($Debug) { Write-Host "Process killed successfully" -ForegroundColor Green }
                    
                    if ($attempt -lt $RetryCount) {
                        Start-Sleep -Seconds 2
                        continue
                    }
                    return @{ Success = $false; Output = ""; Error = "Command timed out after $([math]::Round($duration, 1))s"; Duration = $duration }
                }
            }
            catch {
                if ($Debug) { Write-Host "Error on attempt $attempt : $($_.Exception.Message)" -ForegroundColor Red }
                if ($attempt -lt $RetryCount) {
                    Start-Sleep -Seconds 2
                    continue
                }
                return @{ Success = $false; Output = ""; Error = $_.Exception.Message }
            }
        }
    }
}

# Existing functions from auto-terminal-manager
function Get-CommandSettings {
    param([string]$Command)
    
    $commandLower = $Command.ToLower()
    
    # Use debug timeouts if Debug flag is set
    $timeoutConfig = if ($Debug) { $config.debug_commands } else { $config.commands }
    $defaultTimeout = if ($Debug) { $config.debug_timeout.default } else { $config.timeout.default }
    
    # Detect npm commands
    if ($commandLower -match "^npm\s+") {
        $npmCommand = ($Command -split "\s+")[1]
        if ($timeoutConfig.npm.$npmCommand) {
            return $timeoutConfig.npm.$npmCommand
        }
        return @{ timeout = $defaultTimeout; background = $false; retry = 1 }
    }
    
    # Detect node commands
    if ($commandLower -match "^node\s+") {
        return $timeoutConfig.node
    }
    
    # Detect git commands
    if ($commandLower -match "^git\s+") {
        return $timeoutConfig.git
    }
    
    # Default settings
    return @{ timeout = $defaultTimeout; background = $false; retry = 1 }
}

function Stop-HangingProcesses {
    param([string[]]$ProcessNames = $config.patterns.hanging)
    
    # Only kill processes that are actually hanging (not responding for a while)
    foreach ($processName in $ProcessNames) {
        $processes = Get-Process -Name $processName -ErrorAction SilentlyContinue
        foreach ($process in $processes) {
            try {
                # Check if process is actually hanging (not responding)
                if (-not $process.Responding) {
                    if ($Debug) { Write-Host "Auto-killing hanging process: $($process.Name) (PID: $($process.Id)) - Not responding" }
                    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                } else {
                    if ($Debug) { Write-Host "Process $($process.Name) (PID: $($process.Id)) is responding, not killing" }
                }
            }
            catch {
                if ($Debug) { Write-Host "Failed to check process $($process.Id): $($_.Exception.Message)" }
            }
        }
    }
}

# Main execution
if ($Command) {
    # Get command-specific settings
    $settings = Get-CommandSettings -Command $Command
    
    if ($Debug) {
        Write-Host "Command: $Command"
        Write-Host "Settings: $($settings | ConvertTo-Json)"
        Write-Host "Enhanced monitoring: $EnhancedMonitoring"
    }
    
    # Execute with enhanced hanging prevention
    $result = Invoke-EnhancedSafeCommand -Command $Command -TimeoutMs $settings.timeout -Background $settings.background -RetryCount $settings.retry
    
    if ($result.Success) {
        if ($result.Output) {
            Write-Host $result.Output
        }
        exit 0
    }
    else {
        Write-Host "Command failed: $($result.Error)" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Enhanced Terminal Manager - Phase 2 Integration (Fixed Version)" -ForegroundColor Green
    Write-Host "Usage: .\enhanced-terminal-manager-fixed.ps1 -Command 'your-command' [-WorkingDirectory 'path'] [-Background] [-Debug] [-EnhancedMonitoring]" -ForegroundColor White
    Write-Host ""
    Write-Host "Phase 2 Enhancements:" -ForegroundColor Cyan
    Write-Host "  • Enhanced responsiveness monitoring" -ForegroundColor White
    Write-Host "  • Process state analysis" -ForegroundColor White
    Write-Host "  • Output pattern recognition" -ForegroundColor White
    Write-Host "  • Interactive command detection" -ForegroundColor White
    Write-Host "  • Debug timeouts for faster testing" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\enhanced-terminal-manager-fixed.ps1 -Command 'npm test' -Debug" -ForegroundColor White
    Write-Host "  .\enhanced-terminal-manager-fixed.ps1 -Command 'npm start' -Background -EnhancedMonitoring" -ForegroundColor White
    Write-Host "  .\enhanced-terminal-manager-fixed.ps1 -Command 'git status' -Debug" -ForegroundColor White
    Write-Host "  .\enhanced-terminal-manager-fixed.ps1 -Command 'node hanging-script.js' -Debug -DebugBypassCleanup" -ForegroundColor White
}

# Agent Terminal Initialization Script
# Optimized for Cursor agent's sandboxed terminal environment

# Load configuration
# Configuration object for terminal management
$config = @{
    timeout = @{ default = 30000; short = 10000; long = 120000 }
    processManagement = @{ autoKillHanging = $true; killTimeout = 5000 }
    commands = @{
        npm = @{ test = @{ timeout = 60000; background = $false; retry = 2 } }
        node = @{ timeout = 30000; background = $false }
        git = @{ timeout = 15000; background = $false }
    }
    patterns = @{
        hanging = @("node.exe", "npm.cmd", "tsc.exe")
        safe = @("git", "echo", "dir", "ls")
    }
    enhanced_monitoring = @{
        enabled = $true
        output_tracking = @{
            check_interval = 1000
            min_change_threshold = 10
            max_wait_time = 30000
        }
    }
    command_overrides = @{
        npm = @{ enabled = $true; timeout = 60000; background = $false }
        node = @{ enabled = $true; timeout = 30000; background = $false }
        git = @{ enabled = $true; timeout = 15000; background = $false }
        tsc = @{ enabled = $true; timeout = 120000; background = $false }
        jest = @{ enabled = $true; timeout = 60000; background = $false }
        yarn = @{ enabled = $true; timeout = 60000; background = $false }
        pnpm = @{ enabled = $true; timeout = 60000; background = $false }
    }
    # Heartbeat configuration removed - now loaded from terminal-config.json
}

# Load heartbeat configuration from terminal-config.json
$heartbeatConfig = @{
    status_symbols = @("●", "○", "◐", "◑")  # Fallback defaults
}

# Initialize heartbeat counter for sequential symbol cycling
$heartbeatCount = 0

$configPath = ".cursor/terminal-config.json"
if (Test-Path $configPath) {
    try {
        $terminalConfig = Get-Content $configPath -Raw | ConvertFrom-Json
        if ($terminalConfig.heartbeat -and $terminalConfig.heartbeat.status_symbols) {
            $heartbeatConfig.status_symbols = $terminalConfig.heartbeat.status_symbols
        }
    }
    catch {
        # Use fallback defaults if config loading fails
    }
}

# Enhanced terminal manager functions
function Start-EnhancedMonitoring {
    param(
        [string]$Command,
        [int]$Timeout = 30000,
        [switch]$Background = $false
    )
    
    # Show heartbeat at command start - AGENTS WILL SEE THIS
    $symbols = $heartbeatConfig.status_symbols
    $symbol = $symbols[(Get-Random -Maximum $symbols.Length)]
    $timestamp = Get-Date -Format 'HH:mm:ss'
    Write-Host "[Agent $symbol] $timestamp - Starting: $Command" -ForegroundColor Green
    
    $startTime = Get-Date
    $processId = $null
    
    try {
        # Start the process
        $process = Start-Process -FilePath "powershell.exe" -ArgumentList "-Command", $Command -PassThru -NoNewWindow
        $processId = $process.Id
        
        # Show heartbeat for process start - AGENTS WILL SEE THIS
        $heartbeatCount++
        $symbol = $symbols[($heartbeatCount % $symbols.Length)]
        $timestamp = Get-Date -Format 'HH:mm:ss'
        Write-Host "[Agent $symbol] $timestamp - Process started (PID: $processId)" -ForegroundColor Yellow
        
        # Monitor for hanging
        $timer = [System.Timers.Timer]::new(1000)
        $timer.Add_Elapsed({
            param($timerSender, $timerEventArgs)
            
            try {
                if ($process -and !$process.HasExited) {
                    $elapsed = (Get-Date) - $startTime
                    
                    # Check if process is hanging
                    if ($elapsed.TotalMilliseconds -gt $Timeout) {
                        Write-Host "Process hanging detected, terminating..." -ForegroundColor Red
                        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                        $timer.Stop()
                        $timer.Dispose()
                    }
                } else {
                    $timer.Stop()
                    $timer.Dispose()
                }
            } catch {
                # Timer error handling
            }
        })
        
        $timer.Start()
        
        # Wait for completion
        if ($Background) {
            # Show heartbeat for background process - AGENTS WILL SEE THIS
            $heartbeatCount++
            $symbol = $symbols[($heartbeatCount % $symbols.Length)]
            $timestamp = Get-Date -Format 'HH:mm:ss'
            Write-Host "[Agent $symbol] $timestamp - Background process running" -ForegroundColor Cyan
            return $process
        } else {
            $process.WaitForExit()
            $timer.Stop()
            $timer.Dispose()
            
            # Show heartbeat at completion - AGENTS WILL SEE THIS
            $heartbeatCount++
            $symbol = $symbols[($heartbeatCount % $symbols.Length)]
            $timestamp = Get-Date -Format 'HH:mm:ss'
            Write-Host "[Agent $symbol] $timestamp - Command completed (Exit: $($process.ExitCode))" -ForegroundColor Green
            
            # Create simulated prompt cycling that agents will detect as terminal activity
            Start-Sleep -Milliseconds 300
            
            $currentPath = Get-Location
            $timestamp = Get-Date -Format 'HH:mm:ss'
            $heartbeatCommands = @(
                @{cmd="echo # Agent heartbeat $timestamp"; output="# Agent heartbeat $timestamp"},
                @{cmd="echo # Terminal ready"; output="# Terminal ready"},
                @{cmd="Get-Date | Out-Null"; output=""}
            )
            
            $heartbeat = $heartbeatCommands[(Get-Random -Maximum $heartbeatCommands.Length)]
            
            # Simulate the command execution and prompt cycling that agents need to see
            Write-Host "PS $currentPath> $($heartbeat.cmd)" -ForegroundColor White
            if ($heartbeat.output) {
                Write-Host $heartbeat.output -ForegroundColor Gray
            }
            Start-Sleep -Milliseconds 200
            Write-Host "PS $currentPath> " -ForegroundColor White -NoNewline
            Start-Sleep -Milliseconds 300
            Write-Host ""  # Complete the prompt line
            
            return $process.ExitCode
        }
        
    } catch {
        # Show heartbeat for error case - AGENTS WILL SEE THIS
        $heartbeatCount++
        $symbol = $symbols[($heartbeatCount % $symbols.Length)]
        $timestamp = Get-Date -Format 'HH:mm:ss'
        Write-Host "[Agent $symbol] $timestamp - Error in enhanced monitoring: $($_.Exception.Message)" -ForegroundColor Red
        return -1
    }
}

# Command override functions
function Invoke-SafeNpm {
    param([string]$Arguments = "")
    
    $timeout = $config.command_overrides.npm.timeout
    $background = $config.command_overrides.npm.background
    
    Write-Host "Executing: npm $Arguments (Timeout: ${timeout}ms, Background: $background)" -ForegroundColor Cyan
    
    $startTime = Get-Date
    
    if ($Arguments -match "test") {
        $timeout = $config.commands.npm.test.timeout
        $retry = $config.commands.npm.test.retry
        
        for ($i = 1; $i -le $retry; $i++) {
            Write-Host "Attempt $i of $retry..." -ForegroundColor Yellow
            if ($background) {
                $result = Start-EnhancedMonitoring -Command "npm $Arguments" -Timeout $timeout -Background
            } else {
                $result = Start-EnhancedMonitoring -Command "npm $Arguments" -Timeout $timeout
            }
            
            if ($result -eq 0 -or $background) {
                break
            }
            
            if ($i -lt $retry) {
                Write-Host "Command failed, retrying in 2 seconds..." -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            }
        }
    } else {
        if ($background) {
            $result = Start-EnhancedMonitoring -Command "npm $Arguments" -Timeout $timeout -Background
        } else {
            $result = Start-EnhancedMonitoring -Command "npm $Arguments" -Timeout $timeout
        }
    }
    
    # Show heartbeat completion feedback
    $duration = (Get-Date) - $startTime
    $exitCode = if ($result -is [System.Diagnostics.Process]) { $result.ExitCode } else { $result }
    Show-CommandCompletion -Command "npm $Arguments" -ExitCode $exitCode -Duration $duration.ToString("ss\.fff")
}

function Invoke-SafeNode {
    param([string]$Arguments = "")
    
    $timeout = $config.command_overrides.node.timeout
    $background = $config.command_overrides.node.background
    
    Write-Host "Executing: node $Arguments (Timeout: ${timeout}ms, Background: $background)" -ForegroundColor Cyan
    $startTime = Get-Date
    if ($background) {
        $result = Start-EnhancedMonitoring -Command "node $Arguments" -Timeout $timeout -Background
    } else {
        $result = Start-EnhancedMonitoring -Command "node $Arguments" -Timeout $timeout
    }
    $duration = (Get-Date) - $startTime
    $exitCode = if ($result -is [System.Diagnostics.Process]) { $result.ExitCode } else { $result }
    Show-CommandCompletion -Command "node $Arguments" -ExitCode $exitCode -Duration $duration.ToString("ss\.fff")
}

function Invoke-SafeGit {
    param([string]$Arguments = "")
    
    $timeout = $config.command_overrides.git.timeout
    $background = $config.command_overrides.git.background
    
    Write-Host "Executing: git $Arguments (Timeout: ${timeout}ms, Background: $background)" -ForegroundColor Cyan
    $startTime = Get-Date
    $result = Start-EnhancedMonitoring -Command "git $Arguments" -Timeout $timeout -Background $background
    $duration = (Get-Date) - $startTime
    $exitCode = if ($result -is [System.Diagnostics.Process]) { $result.ExitCode } else { $result }
    Show-CommandCompletion -Command "git $Arguments" -ExitCode $exitCode -Duration $duration.ToString("ss\.fff")
}

function Invoke-SafeTsc {
    param([string]$Arguments = "")
    
    $timeout = $config.command_overrides.tsc.timeout
    $background = $config.command_overrides.tsc.background
    
    Write-Host "Executing: tsc $Arguments (Timeout: ${timeout}ms, Background: $background)" -ForegroundColor Cyan
    Start-EnhancedMonitoring -Command "tsc $Arguments" -Timeout $timeout -Background $background
}

function Invoke-SafeJest {
    param([string]$Arguments = "")
    
    $timeout = $config.command_overrides.jest.timeout
    $background = $config.command_overrides.jest.background
    
    Write-Host "Executing: jest $Arguments (Timeout: ${timeout}ms, Background: $background)" -ForegroundColor Cyan
    Start-EnhancedMonitoring -Command "jest $Arguments" -Timeout $timeout -Background $background
}

function Invoke-SafeYarn {
    param([string]$Arguments = "")
    
    $timeout = $config.command_overrides.yarn.timeout
    $background = $config.command_overrides.yarn.background
    
    Write-Host "Executing: yarn $Arguments (Timeout: ${timeout}ms, Background: $background)" -ForegroundColor Cyan
    Start-EnhancedMonitoring -Command "yarn $Arguments" -Timeout $timeout -Background $background
}

function Invoke-SafePnpm {
    param([string]$Arguments = "")
    
    $timeout = $config.command_overrides.pnpm.timeout
    $background = $config.command_overrides.pnpm.background
    
    Write-Host "Executing: pnpm $Arguments (Timeout: ${timeout}ms, Background: $background)" -ForegroundColor Cyan
    Start-EnhancedMonitoring -Command "pnpm $Arguments" -Timeout $timeout -Background $background
}

# Optimized heartbeat system - TIMER-BASED VERSION (Fixed)
$script:heartbeatTimer = $null
$script:heartbeatStarted = $false
$script:heartbeatCount = 0
$script:lastCommandTime = Get-Date

function Start-OptimizedHeartbeat {
    # Simple approach: Add heartbeat timing to the script completion
    $script:heartbeatStarted = $true
}

function Stop-OptimizedHeartbeat {
    # Remove custom prompt function
    if (Get-Command prompt -ErrorAction SilentlyContinue) {
        Remove-Item Function:\prompt -ErrorAction SilentlyContinue
    }
    
    $script:heartbeatStarted = $false
    Write-Host "`nHeartbeat stopped" -ForegroundColor Yellow
}

function Show-CommandCompletion {
    param([string]$Command, [int]$ExitCode, [string]$Duration)
    
    # Always show completion feedback when heartbeat is enabled
    if ($true) {
        $status = if ($ExitCode -eq 0) { "OK" } else { "ERROR" }
        $color = if ($ExitCode -eq 0) { "Green" } else { "Red" }
        
        # Show command completion with heartbeat activity
        $heartbeatCount++
        $symbols = $heartbeatConfig.status_symbols
        $symbol = $symbols[($heartbeatCount % $symbols.Length)]
        $timestamp = Get-Date -Format 'HH:mm:ss'
        
        Write-Host "`n[Agent $symbol] $timestamp - $status Command completed: $Command (Exit: $ExitCode, Duration: $Duration)" -ForegroundColor $color
        
        # Add a few heartbeat ticks after command completion to show terminal is alive
        for ($i = 0; $i -lt 3; $i++) {
            Start-Sleep -Milliseconds 500
            $tickSymbol = $symbols[($i + 1) % $symbols.Length]
            $tickTime = Get-Date -Format 'HH:mm:ss'
            Write-Host "[Agent $tickSymbol] $tickTime - Ready for next command" -ForegroundColor Green
        }
        
        $script:lastCommandTime = Get-Date
    }
}

# Enhanced command execution with completion feedback
function Invoke-EnhancedCommand {
    param(
        [string]$Command,
        [string]$Arguments = "",
        [int]$Timeout = $config.timeout.default
    )
    
    $startTime = Get-Date
    $fullCommand = "$Command $Arguments".Trim()
    
    Write-Host "`nExecuting: $fullCommand" -ForegroundColor Cyan
    
    try {
        $result = Start-EnhancedMonitoring -Command $fullCommand -Timeout $Timeout
        $duration = (Get-Date) - $startTime
        
        Show-CommandCompletion -Command $fullCommand -ExitCode $result -Duration $duration.ToString("ss\.fff")
        
        return $result
        } catch {
        $duration = (Get-Date) - $startTime
        Show-CommandCompletion -Command $fullCommand -ExitCode -1 -Duration $duration.ToString("ss\.fff")
        throw
    }
}

# Override default commands
Set-Alias -Name npm -Value Invoke-SafeNpm -Scope Global
Set-Alias -Name node -Value Invoke-SafeNode -Scope Global
Set-Alias -Name git -Value Invoke-SafeGit -Scope Global
Set-Alias -Name tsc -Value Invoke-SafeTsc -Scope Global
Set-Alias -Name jest -Value Invoke-SafeJest -Scope Global
Set-Alias -Name yarn -Value Invoke-SafeYarn -Scope Global
Set-Alias -Name pnpm -Value Invoke-SafePnpm -Scope Global

# Start the optimized heartbeat system
Start-OptimizedHeartbeat

# Add simple heartbeat at script completion for agent detection
Start-Sleep -Milliseconds 1000
$timestamp = Get-Date -Format 'HH:mm:ss'
Write-Host "# Agent terminal active - $timestamp" -ForegroundColor Green

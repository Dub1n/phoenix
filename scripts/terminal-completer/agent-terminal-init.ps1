# Agent Terminal Initialization Script
# Optimized for Cursor agent's sandboxed terminal environment

$projectRoot = $PSScriptRoot
Write-Host "Agent Terminal Safety Activated" -ForegroundColor Green

# Load configuration
$configPath = "$projectRoot\.cursor\terminal-config.json"
$config = @{
    timeout = @{ default = 30000; short = 10000; long = 120000 }
    processManagement = @{ autoKillHanging = $true; killTimeout = 5000 }
    commands = @{
        npm = @{ test = @{ timeout = 60000; background = $false; retry = 2 } }
        node = @{ timeout = 30000; background = $false }
        git = @{ timeout = 15000; background = $false }
    }
    patterns = @{ hanging = @("node.exe", "npm.cmd", "tsc.exe"); safe = @("git", "echo", "dir", "ls") }
}

if (Test-Path $configPath) {
    try {
        $config = Get-Content $configPath | ConvertFrom-Json -AsHashtable
        Write-Host "Configuration loaded from $configPath" -ForegroundColor Cyan
    } catch {
        Write-Host "Warning: Failed to load config, using defaults" -ForegroundColor Yellow
    }
}

# Function to kill hanging processes
function Stop-HangingProcesses {
    $hangingPatterns = $config.patterns.hanging
    foreach ($pattern in $hangingPatterns) {
        $processes = Get-Process -Name $pattern -ErrorAction SilentlyContinue
        if ($processes) {
            Write-Host "Killing hanging process: $pattern" -ForegroundColor Yellow
            Stop-Process -Name $pattern -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Stop hanging background jobs
    $hangingJobs = Get-Job | Where-Object {$_.State -eq "Running"}
    if ($hangingJobs) {
        Write-Host "Stopping hanging background jobs" -ForegroundColor Yellow
        $hangingJobs | Stop-Job -ErrorAction SilentlyContinue
    }
}

# Function to execute commands safely
function Invoke-SafeCommand {
    param(
        [string]$Command,
        [int]$TimeoutMs = $config.timeout.default,
        [bool]$Background = $false,
        [int]$RetryCount = 1
    )
    
    # Kill hanging processes before starting
    Stop-HangingProcesses
    
    # Determine command type and settings
    $commandType = $Command.Split(' ')[0]
    $commandConfig = $config.commands.$commandType
    
    if ($commandConfig) {
        $TimeoutMs = $commandConfig.timeout
        $Background = $commandConfig.background
        $RetryCount = $commandConfig.retry
    }
    
    Write-Host "Executing: $Command (Timeout: ${TimeoutMs}ms, Background: $Background)" -ForegroundColor Cyan
    
    if ($Background) {
        # Run in background
        $job = Start-Job -ScriptBlock { param($cmd) & powershell -Command $cmd } -ArgumentList $Command
        Write-Host "Command started in background (Job ID: $($job.Id))" -ForegroundColor Green
        return $job
    } else {
        # Run with timeout
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "powershell.exe"
        $processInfo.Arguments = "-Command", $Command
        $processInfo.UseShellExecute = $false
        $processInfo.RedirectStandardOutput = $true
        $processInfo.RedirectStandardError = $true
        
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $processInfo
        
        try {
            $process.Start()
            $completed = $process.WaitForExit($TimeoutMs)
            
            if ($completed) {
                $output = $process.StandardOutput.ReadToEnd()
                $error = $process.StandardError.ReadToEnd()
                
                if ($process.ExitCode -eq 0) {
                    Write-Host "Command completed successfully" -ForegroundColor Green
                    return $output
                } else {
                    Write-Host "Command failed with exit code: $($process.ExitCode)" -ForegroundColor Red
                    if ($error) { Write-Host "Error: $error" -ForegroundColor Red }
                    return $null
                }
            } else {
                Write-Host "Command timed out after ${TimeoutMs}ms" -ForegroundColor Red
                $process.Kill()
                return $null
            }
        } catch {
            Write-Host "Error executing command: $($_.Exception.Message)" -ForegroundColor Red
            return $null
        } finally {
            if ($process -and !$process.HasExited) {
                $process.Kill()
            }
        }
    }
}

# Override common commands for automatic safety
function npm { 
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "npm $arguments"
}

function node { 
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "node $arguments"
}

function git { 
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "git $arguments"
}

function tsc { 
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "tsc $arguments"
}

function jest { 
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "jest $arguments"
}

function yarn { 
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "yarn $arguments"
}

function pnpm { 
    $arguments = $args -join " "
    Invoke-SafeCommand -Command "pnpm $arguments"
}

Write-Host "Agent terminal safety loaded. All commands will use automatic timeout and hanging prevention." -ForegroundColor Green
Write-Host "Overridden commands: npm, node, git, tsc, jest, yarn, pnpm" -ForegroundColor Cyan 
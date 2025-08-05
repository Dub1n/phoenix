# Automatic Terminal Manager for Cursor Agent
# Prevents hanging terminal calls automatically without manual intervention

param(
    [string]$Command,
    [string]$WorkingDirectory = $PWD.Path,
    [switch]$Background = $false,
    [switch]$Debug = $false
)

# Load configuration
$configPath = ".cursor/terminal-config.json"
$config = @{
    timeout = @{
        default = 30000
        short = 10000
        long = 120000
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

# Function to detect command type and get appropriate settings
function Get-CommandSettings {
    param([string]$Command)
    
    $commandLower = $Command.ToLower()
    
    # Detect npm commands
    if ($commandLower -match "^npm\s+") {
        $npmCommand = ($Command -split "\s+")[1]
        if ($config.commands.npm.$npmCommand) {
            return $config.commands.npm.$npmCommand
        }
        return @{ timeout = $config.timeout.default; background = $false; retry = 1 }
    }
    
    # Detect node commands
    if ($commandLower -match "^node\s+") {
        return $config.commands.node
    }
    
    # Detect git commands
    if ($commandLower -match "^git\s+") {
        return $config.commands.git
    }
    
    # Default settings
    return @{ timeout = $config.timeout.default; background = $false; retry = 1 }
}

# Function to kill hanging processes automatically
function Stop-HangingProcesses {
    param([string[]]$ProcessNames = $config.patterns.hanging)
    
    foreach ($processName in $ProcessNames) {
        $processes = Get-Process -Name $processName -ErrorAction SilentlyContinue
        foreach ($process in $processes) {
            try {
                if ($Debug) { Write-Host "Auto-killing hanging process: $($process.Name) (PID: $($process.Id))" }
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
            catch {
                if ($Debug) { Write-Host "Failed to kill process $($process.Id): $($_.Exception.Message)" }
            }
        }
    }
}

# Function to execute command with automatic timeout and hanging prevention
function Invoke-SafeCommand {
    param(
        [string]$Command,
        [int]$TimeoutMs,
        [bool]$Background,
        [int]$RetryCount = 1
    )
    
    # Kill any existing hanging processes before starting
    Stop-HangingProcesses
    
    if ($Background) {
        # Start background job with automatic cleanup
        $job = Start-Job -ScriptBlock { 
            param($cmd, $wd) 
            Set-Location $wd
            Invoke-Expression $cmd 
        } -ArgumentList $Command, $WorkingDirectory
        
        if ($Debug) { Write-Host "Started background job: $($job.Id)" }
        return @{ Success = $true; JobId = $job.Id; Output = "Background job started" }
    }
    else {
        # Execute with timeout and automatic hanging prevention
        $attempt = 0
        while ($attempt -lt $RetryCount) {
            $attempt++
            if ($Debug) { Write-Host "Attempt $attempt of $RetryCount" }
            
            try {
                # Start process with timeout
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
                
                # Wait for completion with timeout
                if ($process.WaitForExit($TimeoutMs)) {
                    $output = $process.StandardOutput.ReadToEnd()
                    $error = $process.StandardError.ReadToEnd()
                    
                    if ($process.ExitCode -eq 0) {
                        return @{ Success = $true; Output = $output; Error = $error }
                    }
                    else {
                        if ($Debug) { Write-Host "Command failed with exit code: $($process.ExitCode)" }
                        if ($attempt -lt $RetryCount) {
                            Start-Sleep -Seconds 2
                            continue
                        }
                        return @{ Success = $false; Output = $output; Error = $error; ExitCode = $process.ExitCode }
                    }
                }
                else {
                    # Timeout reached - kill process and hanging processes
                    if ($Debug) { Write-Host "Timeout reached, killing process and hanging processes" }
                    $process.Kill()
                    Stop-HangingProcesses
                    
                    if ($attempt -lt $RetryCount) {
                        Start-Sleep -Seconds 2
                        continue
                    }
                    return @{ Success = $false; Output = ""; Error = "Command timed out after $TimeoutMs ms" }
                }
            }
            catch {
                if ($Debug) { Write-Host "Exception during execution: $($_.Exception.Message)" }
                if ($attempt -lt $RetryCount) {
                    Start-Sleep -Seconds 2
                    continue
                }
                return @{ Success = $false; Output = ""; Error = $_.Exception.Message }
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
    }
    
    # Execute with automatic hanging prevention
    $result = Invoke-SafeCommand -Command $Command -TimeoutMs $settings.timeout -Background $settings.background -RetryCount $settings.retry
    
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
    Write-Host "Usage: .\auto-terminal-manager.ps1 -Command 'your-command' [-WorkingDirectory 'path'] [-Background] [-Debug]"
    Write-Host "Examples:"
    Write-Host "  .\auto-terminal-manager.ps1 -Command 'npm test'"
    Write-Host "  .\auto-terminal-manager.ps1 -Command 'npm start' -Background"
    Write-Host "  .\auto-terminal-manager.ps1 -Command 'git status' -Debug"
} 
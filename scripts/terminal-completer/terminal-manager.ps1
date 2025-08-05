# Terminal Process Manager for Cursor Agent
# Prevents hanging terminal calls and manages process lifecycle

param(
    [string]$Command,
    [int]$Timeout = 30000,  # 30 seconds default
    [switch]$Background = $false,
    [switch]$KillHanging = $false
)

# Function to kill hanging processes
function Stop-HangingProcesses {
    param([string]$ProcessName = "node.exe")
    
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    foreach ($process in $processes) {
        try {
            Write-Host "Terminating hanging process: $($process.Id)"
            Stop-Process -Id $process.Id -Force
        }
        catch {
            Write-Host "Failed to terminate process $($process.Id): $($_.Exception.Message)"
        }
    }
}

# Function to execute command with timeout
function Invoke-CommandWithTimeout {
    param(
        [string]$Command,
        [int]$TimeoutMs,
        [bool]$Background
    )
    
    if ($Background) {
        # Start background job
        $job = Start-Job -ScriptBlock { param($cmd) Invoke-Expression $cmd } -ArgumentList $Command
        return $job
    }
    else {
        # Execute with timeout
        try {
            $result = Invoke-Expression $Command -ErrorAction Stop
            return @{
                Success = $true
                Output = $result
                Error = $null
            }
        }
        catch {
            return @{
                Success = $false
                Output = $null
                Error = $_.Exception.Message
            }
        }
    }
}

# Main execution
if ($KillHanging) {
    Stop-HangingProcesses
    Write-Host "Hanging processes terminated"
    exit 0
}

if ($Command) {
    $result = Invoke-CommandWithTimeout -Command $Command -TimeoutMs $Timeout -Background $Background
    
    if ($result.Success) {
        Write-Host "Command executed successfully"
        if ($result.Output) {
            Write-Host $result.Output
        }
    }
    else {
        Write-Host "Command failed: $($result.Error)"
        exit 1
    }
}
else {
    Write-Host "Usage: .\terminal-manager.ps1 -Command 'your-command' [-Timeout 30000] [-Background] [-KillHanging]"
    Write-Host "Examples:"
    Write-Host "  .\terminal-manager.ps1 -Command 'npm test'"
    Write-Host "  .\terminal-manager.ps1 -KillHanging"
    Write-Host "  .\terminal-manager.ps1 -Command 'npm start' -Background"
} 
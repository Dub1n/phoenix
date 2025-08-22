# Auto-initialize agent terminal safety system
# This file should be sourced from your PowerShell profile

function Test-IsAgentTerminal {
    # Method 1: Check for Cursor-specific environment variables
    if ($env:CURSOR_AGENT_TERMINAL -or $env:VSCODE_EXTENSION_HOST -or $env:VSCODE_PID) {
        return $true
    }
    
    # Method 2: Check process tree for Cursor/VS Code
    try {
        $currentProcess = Get-Process -Id $PID -ErrorAction Stop
        $parentProcess = Get-Process -Id $currentProcess.Parent.Id -ErrorAction Stop
        
        if ($parentProcess.ProcessName -like "*cursor*" -or 
            $parentProcess.ProcessName -like "*code*" -or
            $parentProcess.ProcessName -like "*vscode*") {
            return $true
        }
        
        # Check grandparent process too
        $grandparentProcess = Get-Process -Id $parentProcess.Parent.Id -ErrorAction Stop
        if ($grandparentProcess.ProcessName -like "*cursor*" -or 
            $grandparentProcess.ProcessName -like "*code*" -or
            $grandparentProcess.ProcessName -like "*vscode*") {
            return $true
        }
    }
    catch {
        # If we can't check process tree, continue to next method
    }
    
    # Method 3: Check terminal type
    if ($env:TERM_PROGRAM -eq "vscode" -or $env:TERM_PROGRAM -eq "cursor") {
        return $true
    }
    
    # Method 4: Check if we're in a Cursor workspace
    if ($env:VSCODE_CWD -or $env:VSCODE_WORKSPACE) {
        return $true
    }
    
    return $false
}

# Auto-initialize if we're in an agent terminal
if (Test-IsAgentTerminal) {
    $scriptPath = Split-Path -Parent $PSCommandPath
    $agentInitPath = Join-Path $scriptPath "agent-terminal-init.ps1"
    
    if (Test-Path $agentInitPath) {
        try {
            . $agentInitPath
            Write-Host "Agent terminal safety auto-initialized" -ForegroundColor Green
        }
        catch {
            Write-Host "Failed to auto-initialize agent terminal safety: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

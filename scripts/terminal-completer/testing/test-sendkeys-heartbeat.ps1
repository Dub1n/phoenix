# SendKeys Heartbeat Test
# Uses Windows API to actually type into the current terminal window

Write-Host "=== Testing SendKeys Heartbeat Approach ===" -ForegroundColor Green
Write-Host "This will actually type heartbeat commands into the terminal window" -ForegroundColor Cyan
Write-Host ""

# Add Windows Forms for SendKeys
Add-Type -AssemblyName System.Windows.Forms

function Send-HeartbeatKeystroke {
    param([string]$Command)
    
    try {
        # Small delay to ensure terminal is ready
        Start-Sleep -Milliseconds 100
        
        # Send the heartbeat command followed by Enter
        [System.Windows.Forms.SendKeys]::SendWait($Command)
        Start-Sleep -Milliseconds 50
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
        
        Write-Host "Sent keystroke: $Command" -ForegroundColor Yellow
        
    } catch {
        Write-Host "Error sending keystroke: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Starting SendKeys heartbeat test..." -ForegroundColor Yellow
Write-Host "This should type actual commands in the terminal that agents can see" -ForegroundColor Cyan
Write-Host ""

# Wait a moment then send some heartbeat keystrokes
Start-Sleep -Seconds 1

$heartbeatCommands = @(
    "echo # heartbeat",
    "Get-Date | Out-Null", 
    "echo # ready"
)

foreach ($cmd in $heartbeatCommands) {
    Send-HeartbeatKeystroke $cmd
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "SendKeys heartbeat test completed" -ForegroundColor Green
Write-Host "Check if agents saw actual commands being typed and prompts appearing" -ForegroundColor Cyan
